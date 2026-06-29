'use strict';

import { state } from './state.js';
import { log } from './logger.js';
import { hashRoomId, encrypt, decrypt, encryptBuf, decryptBuf, bufToB64 } from './crypto.js';
import { setStatus, setProgress, setProgressVal, updateCharCount, renderFiles, fmtSize } from './ui.js';
import { diff_match_patch } from './diff-match-patch.js';

const POLL_INTERVAL = 3000;
const TEXT_TTL = 30 * 60;
const FILE_TTL = 30 * 60;

// Helper to update editor value and restore cursor range mapping
function updateEditorValueAndRestoreCursor(editor, newText) {
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const oldText = editor.value;

    if (oldText === newText) return;

    if (document.activeElement !== editor) {
        editor.value = newText;
        return;
    }

    try {
        const dmp = new diff_match_patch();
        const diffs = dmp.diff_main(oldText, newText);
        const newStart = dmp.diff_xIndex(diffs, start);
        const newEnd = dmp.diff_xIndex(diffs, end);

        editor.value = newText;
        editor.setSelectionRange(newStart, newEnd);
    } catch (e) {
        log(`CURSOR MAP ERR: ${e.message}`, 'warn');
        editor.value = newText;
    }
}

// ── Polling ──────────────────────────────────────────────────
export function startPolling() {
    stopPolling();
    state.pollTimer = setInterval(async () => {
        await pollText();
        await loadFiles();
    }, POLL_INTERVAL);
    setStatus('online', 'ONLINE');
}

export function stopPolling() {
    if (state.pollTimer) clearInterval(state.pollTimer);
    state.pollTimer = null;
}

export async function pollText() {
    if (!state.cryptoKey) return;
    try {
        const rh = await hashRoomId(state.roomId);
        const headers = { 'X-Requested-With': 'XMLHttpRequest' };
        if (state.lastModified) headers['If-Modified-Since'] = state.lastModified;

        const res = await fetch(`api.php?action=get_text&room_hash=${rh}`, { headers });

        if (res.status === 304) {
            setStatus('online', 'ONLINE');
            return; // No change
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const lm = res.headers.get('Last-Modified');
        if (lm) state.lastModified = lm;

        const data = await res.json();
        const editor = document.getElementById('editor');

        if (data.empty) {
            setStatus('online', 'ONLINE');
            clearTextExpiry();
            
            // If local text matches the last synced state or user is not focused, clear it
            if (editor && (editor.value === state.lastSyncedText || document.activeElement !== editor)) {
                updateEditorValueAndRestoreCursor(editor, '');
                updateCharCount();
            }
            state.lastSyncedText = '';
            state.lastSyncedTime = 0;
            return;
        }

        const serverText = await decrypt(state.cryptoKey, data.encrypted_data, data.iv);

        if (state.lastSyncedText === null) {
            // First time loading text in this room/session
            state.lastSyncedText = serverText;
            state.lastSyncedTime = data.updated_at;
            if (editor) {
                updateEditorValueAndRestoreCursor(editor, serverText);
                updateCharCount();
            }
        } else if (serverText !== state.lastSyncedText) {
            // Server version has changed!
            const localText = editor ? editor.value : '';
            if (localText !== state.lastSyncedText) {
                // Collision! Both server and local have modified the text.
                log('COLLISION DETECTED - MERGING SERVER CHANGES...', 'warn');
                try {
                    const dmp = new diff_match_patch();
                    const patches = dmp.patch_make(state.lastSyncedText, serverText);
                    const [mergedText, results] = dmp.patch_apply(patches, localText);
                    
                    if (editor) {
                        updateEditorValueAndRestoreCursor(editor, mergedText);
                        updateCharCount();
                    }
                    
                    // Mark baseline synced to this server text
                    state.lastSyncedText = serverText;
                    state.lastSyncedTime = data.updated_at;
                    log('CHANGES AUTO-MERGED', 'ok');
                } catch (err) {
                    log(`MERGE ERR: ${err.message}`, 'err');
                }
            } else {
                // No local modifications, safely update text (with cursor restoration in case of focus)
                if (editor) {
                    updateEditorValueAndRestoreCursor(editor, serverText);
                    updateCharCount();
                }
                state.lastSyncedText = serverText;
                state.lastSyncedTime = data.updated_at;
            }
        }

        if (data.ttl !== undefined) {
            const select = document.getElementById('select-ttl');
            if (select) {
                select.value = data.ttl;
            }
        }

        if (data.expires_in !== undefined) startTextExpiry(data.expires_in);
        setStatus('online', 'ONLINE');

    } catch (e) {
        setStatus('offline', 'OFFLINE');
        log(`POLL ERR: ${e.message}`, 'err');
    }
}

// ── Save Text ────────────────────────────────────────────────
export async function saveText(isRetry = false) {
    if (!state.cryptoKey || state.isSaving) return;
    if (state.autoSaveTimer) {
        clearTimeout(state.autoSaveTimer);
        state.autoSaveTimer = null;
    }
    if (state.autoSaveInterval) {
        clearInterval(state.autoSaveInterval);
        state.autoSaveInterval = null;
    }
    const editor = document.getElementById('editor');
    if (!editor) return;
    const plaintext = editor.value;
    state.isSaving = true;
    const btn = document.getElementById('btn-save');
    if (btn) {
        btn.disabled = true;
        btn.textContent = 'ENCRYPTING...';
    }
    const indicator = document.getElementById('sync-indicator');
    if (indicator) {
        indicator.textContent = 'ENCRYPTING';
        indicator.style.color = 'var(--accent-primary)';
    }

    try {
        const { data, iv } = await encrypt(state.cryptoKey, plaintext);
        const rh = await hashRoomId(state.roomId);

        const select = document.getElementById('select-ttl');
        const ttl = select ? parseInt(select.value, 10) : 3600;

        // Include lastSyncedTime to detect conflict on server
        const payload = {
            room_hash: rh,
            encrypted_data: data,
            iv: iv,
            last_updated: state.lastSyncedTime || 0,
            ttl: ttl
        };

        const res = await fetch('api.php?action=save_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (res.status === 409) {
            if (!isRetry) {
                log('SYNC CONFLICT DETECTED - MERGING...', 'warn');
                state.isSaving = false;
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = 'ENCRYPT & SYNC';
                }
                // Fetch latest server changes and merge
                await pollText();
                // Retry saving merged text
                await saveText(true);
                return;
            } else {
                throw new Error('Conflict could not be resolved automatically.');
            }
        }

        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        state.lastModified = '';
        state.lastSyncedText = plaintext;
        state.lastSyncedTime = json.updated_at;

        if (indicator) {
            indicator.textContent = '[SYNCED]';
            indicator.style.color = 'var(--success)';
        }
        log('TEXT SYNCED', 'ok');
        if (json.expires_in !== undefined) startTextExpiry(json.expires_in);
        setStatus('online', 'ONLINE');

    } catch (e) {
        log(`SAVE ERR: ${e.message}`, 'err');
        if (indicator) {
            indicator.textContent = 'ERROR';
            indicator.style.color = 'var(--error)';
        }
        setStatus('offline', 'OFFLINE');
    } finally {
        state.isSaving = false;
        if (btn) {
            btn.disabled = false;
            btn.textContent = 'ENCRYPT & SYNC';
        }
    }
}

// ── Text Expiry Timer ────────────────────────────────────────
export function startTextExpiry(seconds) {
    clearTextExpiry();
    const el = document.getElementById('text-expires');
    const validUntilEl = document.getElementById('session-valid-until');
    
    let expiryDate = seconds > 0 ? new Date(Date.now() + seconds * 1000) : null;
    
    if (!el) return;
    function tick() {
        if (seconds <= 0) {
            el.textContent = 'EXPIRED';
            el.style.color = 'var(--red)';
            if (validUntilEl) {
                validUntilEl.innerHTML = '<span style="color:var(--red)">EXPIRED</span>';
            }
            return;
        }
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        el.textContent = `TTL ${m}:${s}`;
        el.style.color = seconds < 120 ? 'var(--amber)' : 'var(--text-muted)';
        
        if (validUntilEl && expiryDate) {
            const hVal = Math.floor(seconds / 3600);
            const mVal = Math.floor((seconds % 3600) / 60);
            const sVal = seconds % 60;
            
            const hStr = hVal > 0 ? String(hVal).padStart(2, '0') + ':' : '';
            const mStr = String(mVal).padStart(2, '0');
            const sStr = String(sVal).padStart(2, '0');
            const timerStr = `${hStr}${mStr}:${sStr}`;
            
            validUntilEl.innerHTML = `valid until: <span style="color:var(--text-main);">${formatDateTime(expiryDate)}</span> (<span style="color:var(--accent-primary); font-weight:bold;">${timerStr}</span>)`;
        }
        
        seconds--;
        state.textExpiresTimer = setTimeout(tick, 1000);
    }
    tick();
}

export function clearTextExpiry() {
    if (state.textExpiresTimer) clearTimeout(state.textExpiresTimer);
    const el = document.getElementById('text-expires');
    if (el) el.textContent = '';
    const validUntilEl = document.getElementById('session-valid-until');
    if (validUntilEl) {
        validUntilEl.textContent = 'valid until: —';
        validUntilEl.style.color = 'var(--text-muted)';
    }
}

function formatDateTime(date) {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export async function resetTTL() {
    if (!state.cryptoKey) return;
    const select = document.getElementById('select-ttl');
    const ttl = select ? parseInt(select.value, 10) : 3600;
    
    try {
        const rh = await hashRoomId(state.roomId);
        const payload = {
            room_hash: rh,
            ttl: ttl
        };
        const res = await fetch('api.php?action=reset_ttl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);
        
        log('SESSION TTL EXTENDED', 'ok');
        if (json.expires_in !== undefined) startTextExpiry(json.expires_in);
        await loadFiles();
    } catch (e) {
        log(`EXTEND TTL ERR: ${e.message}`, 'err');
    }
}

// ── File Upload ──────────────────────────────────────────────
export async function uploadFile(file) {
    if (!state.cryptoKey) return;
    if (file.size > 20 * 1024 * 1024) {
        log(`FILE TOO LARGE: ${file.name} (max 20MB)`, 'err');
        return;
    }

    setProgress(true, 'READING FILE...');
    log(`UPLOADING: ${file.name} (${fmtSize(file.size)})`, '');

    let buffer = null;
    try {
        buffer = await readFileAsBuffer(file);
        setProgressVal(20, 'ENCRYPTING...');

        // Encrypt file content
        const { data: encBuf, iv: encIv } = await encryptBuf(state.cryptoKey, buffer);
        buffer = null; // OOM protection

        // Encrypt metadata (filename + MIME + file IV)
        const meta = JSON.stringify({
            name: file.name,
            type: file.type,
            size: file.size,
            iv_file: bufToB64(encIv)
        });
        const { data: encMeta, iv: ivMeta } = await encrypt(state.cryptoKey, meta);

        setProgressVal(70, 'UPLOADING...');

        // Build multipart form
        const rh = await hashRoomId(state.roomId);
        const form = new FormData();
        form.append('room_hash', rh);
        form.append('encrypted_meta', encMeta);
        form.append('iv_meta', ivMeta);
        form.append('file', new Blob([encBuf]), 'encrypted.bin');

        // XHR for upload progress
        await uploadWithProgress(form, (pct) => setProgressVal(70 + pct * 0.3, `UPLOADING ${Math.round(70 + pct * 0.3)}%`));

        log(`UPLOAD COMPLETE: ${file.name}`, 'ok');
        setProgress(false);
        await loadFiles();

    } catch (e) {
        buffer = null;
        log(`UPLOAD ERR: ${e.message}`, 'err');
        setProgress(false);
    }
}

function uploadWithProgress(form, onProgress) {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'api.php?action=upload_file');
        xhr.upload.onprogress = (e) => { if (e.lengthComputable) onProgress(e.loaded / e.total); };
        xhr.onload = () => {
            try {
                const r = JSON.parse(xhr.responseText);
                r.ok ? resolve(r) : reject(new Error(r.error));
            } catch { reject(new Error('invalid response')); }
        };
        xhr.onerror = () => reject(new Error('network error'));
        xhr.send(form);
    });
}

function readFileAsBuffer(file) {
    return new Promise((res, rej) => {
        const fr = new FileReader();
        fr.onload = () => res(fr.result);
        fr.onerror = () => rej(new Error('read failed'));
        fr.readAsArrayBuffer(file);
    });
}

// ── File List ────────────────────────────────────────────────
export async function loadFiles() {
    if (!state.cryptoKey) return;
    try {
        const rh = await hashRoomId(state.roomId);
        const res = await fetch(`api.php?action=list_files&room_hash=${rh}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        renderFiles(data.files);
        setStatus('online', 'ONLINE');
    } catch (e) {
        setStatus('offline', 'OFFLINE');
        log(`FILES ERR: ${e.message}`, 'err');
    }
}

// ── File Download ────────────────────────────────────────────
export async function downloadFile(fileId, encMeta, ivMeta, fileName) {
    if (!state.cryptoKey) return;
    log(`DOWNLOADING: ${fileName}`, '');

    try {
        const rh = await hashRoomId(state.roomId);
        const res = await fetch(`api.php?action=download_file&file_id=${fileId}&room_hash=${rh}`);

        if (res.status === 410) { log(`FILE EXPIRED`, 'warn'); await loadFiles(); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        let encBuf = await res.arrayBuffer();
        log(`DECRYPTING: ${fileName}`, '');

        // Recover file IV and MIME from metadata
        let fileIv = ivMeta; // fallback
        let mime = 'application/octet-stream';
        try {
            const meta = JSON.parse(await decrypt(state.cryptoKey, encMeta, ivMeta));
            mime = meta.type || mime;
            if (meta.iv_file) {
                fileIv = meta.iv_file;
            }
        } catch (err) {
            log(`METADATA DECRYPT ERR: ${err.message}`, 'warn');
        }

        const plainBuf = await decryptBuf(state.cryptoKey, encBuf, fileIv);
        encBuf = null; // OOM protection

        // Trigger browser download
        const blob = new Blob([plainBuf], { type: mime });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = fileName; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 60000);

        log(`DOWNLOAD COMPLETE: ${fileName}`, 'ok');
        await loadFiles();

    } catch (e) {
        log(`DOWNLOAD ERR: ${e.message}`, 'err');
    }
}

export async function deleteFile(fileId, fileName) {
    if (!state.cryptoKey) return;
    try {
        const rh = await hashRoomId(state.roomId);
        const payload = {
            file_id: fileId,
            room_hash: rh
        };
        const res = await fetch('api.php?action=delete_file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        log(`FILE DELETED: ${fileName}`, 'ok');
        await loadFiles();
    } catch (e) {
        log(`DELETE ERR: ${e.message}`, 'err');
    }
}
