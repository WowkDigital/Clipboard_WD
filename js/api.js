'use strict';

import { state } from './state.js';
import { log } from './logger.js';
import { hashRoomId, encrypt, decrypt, encryptBuf, decryptBuf } from './crypto.js';
import { setStatus, setProgress, setProgressVal, updateCharCount, renderFiles, fmtSize } from './ui.js';

const POLL_INTERVAL = 3000;
const TEXT_TTL = 30 * 60;
const FILE_TTL = 15 * 60;

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

        const res = await fetch(`?action=get_text&room_hash=${rh}`, { headers });

        if (res.status === 304) {
            setStatus('online', 'ONLINE');
            return; // No change
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const lm = res.headers.get('Last-Modified');
        if (lm) state.lastModified = lm;

        const data = await res.json();
        if (data.empty) {
            setStatus('online', 'ONLINE');
            clearTextExpiry();
            return;
        }

        // Only update if we're not actively editing
        if (document.activeElement !== document.getElementById('editor')) {
            const plain = await decrypt(state.cryptoKey, data.encrypted_data, data.iv);
            const editor = document.getElementById('editor');
            if (editor) {
                editor.value = plain;
                updateCharCount();
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
export async function saveText() {
    if (!state.cryptoKey || state.isSaving) return;
    if (state.autoSaveTimer) {
        clearTimeout(state.autoSaveTimer);
        state.autoSaveTimer = null;
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
    if (indicator) indicator.textContent = 'ENCRYPTING';

    try {
        const { data, iv } = await encrypt(state.cryptoKey, plaintext);
        const rh = await hashRoomId(state.roomId);

        const res = await fetch('?action=save_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_hash: rh, encrypted_data: data, iv }),
        });

        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        state.lastModified = '';
        if (indicator) indicator.textContent = '[SYNCED]';
        log('TEXT SYNCED', 'ok');
        if (json.expires_in !== undefined) startTextExpiry(json.expires_in);
        setStatus('online', 'ONLINE');

    } catch (e) {
        log(`SAVE ERR: ${e.message}`, 'err');
        if (indicator) indicator.textContent = 'ERROR';
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
    if (!el) return;
    function tick() {
        if (seconds <= 0) {
            el.textContent = 'EXPIRED';
            el.style.color = 'var(--red)';
            return;
        }
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        el.textContent = `TTL ${m}:${s}`;
        el.style.color = seconds < 120 ? 'var(--amber)' : 'var(--text-muted)';
        seconds--;
        state.textExpiresTimer = setTimeout(tick, 1000);
    }
    tick();
}

export function clearTextExpiry() {
    if (state.textExpiresTimer) clearTimeout(state.textExpiresTimer);
    const el = document.getElementById('text-expires');
    if (el) el.textContent = '';
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

        setProgressVal(60, 'ENCRYPTING METADATA...');

        // Encrypt metadata (filename + MIME)
        const meta = JSON.stringify({ name: file.name, type: file.type, size: file.size });
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
        xhr.open('POST', '?action=upload_file');
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
        const res = await fetch(`?action=list_files&room_hash=${rh}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        renderFiles(data.files);
    } catch (e) {
        log(`FILES ERR: ${e.message}`, 'err');
    }
}

// ── File Download ────────────────────────────────────────────
export async function downloadFile(fileId, encMeta, ivMeta, fileName) {
    if (!state.cryptoKey) return;
    log(`DOWNLOADING: ${fileName}`, '');

    try {
        const rh = await hashRoomId(state.roomId);
        const res = await fetch(`?action=download_file&file_id=${fileId}&room_hash=${rh}`);

        if (res.status === 410) { log(`FILE EXPIRED OR CONSUMED`, 'warn'); await loadFiles(); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const encIvB64 = res.headers.get('X-Encrypted-Meta-IV') || ivMeta;

        let encBuf = await res.arrayBuffer();
        log(`DECRYPTING: ${fileName}`, '');

        const plainBuf = await decryptBuf(state.cryptoKey, encBuf, encIvB64);
        encBuf = null; // OOM protection

        // Recover MIME from metadata
        let mime = 'application/octet-stream';
        try {
            const meta = JSON.parse(await decrypt(state.cryptoKey, encMeta, ivMeta));
            mime = meta.type || mime;
        } catch { }

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
