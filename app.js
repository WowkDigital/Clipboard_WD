// ============================================================
// VOID://CLIPBOARD — Client Engine
// All cryptographic operations use Web Crypto API (AES-GCM).
// Keys live only in URL #hash — never sent to server.
// ============================================================

'use strict';

// ── Constants ────────────────────────────────────────────────
const POLL_INTERVAL = 3000;
const TEXT_TTL = 30 * 60;
const FILE_TTL = 15 * 60;

// ── State ────────────────────────────────────────────────────
let roomId = '';        // human-readable room name (in hash)
let cryptoKey = null;     // CryptoKey object (AES-GCM 256-bit)
let lastModified = '';
let pollTimer = null;
let textExpiresTimer = null;
let fileTimers = {};
let isSaving = false;
let countdowns = {};
let autoSaveTimer = null;

// ── Log ──────────────────────────────────────────────────────
function log(msg, type = '') {
    const el = document.getElementById('log');
    const line = document.createElement('div');
    line.className = 'log-line ' + type;
    const ts = new Date().toTimeString().slice(0, 8);
    line.textContent = `[${ts}] ${msg}`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
}

document.getElementById('btn-clear-log').onclick = () => {
    document.getElementById('log').innerHTML = '';
};

// ── Crypto ───────────────────────────────────────────────────
async function deriveKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('void-clipboard-v1'), iterations: 200000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

async function encrypt(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
    );
    return {
        data: bufToB64(ciphertext),
        iv: bufToB64(iv),
    };
}

async function decrypt(key, b64data, b64iv) {
    const iv = b64ToBuf(b64iv);
    const ct = b64ToBuf(b64data);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(pt);
}

async function encryptBuf(key, buffer) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
    return { data: ct, iv };
}

async function decryptBuf(key, cipherBuf, b64iv) {
    const iv = b64ToBuf(b64iv);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf);
}

// ── Room Hash (Blind Room ID) ────────────────────────────────
async function hashRoomId(id) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id));
    return bufToHex(buf);
}

// ── URL & Init ───────────────────────────────────────────────
function genKey() {
    return Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

async function loadFromHash() {
    let hash = location.hash.slice(1);
    if (!hash || hash.length < 16) {
        // Fresh session — generate new key
        const keyRaw = genKey();
        location.hash = keyRaw;
        return;
    }
    roomId = hash.slice(0, 8);
    cryptoKey = await deriveKey(hash);
    document.getElementById('room-display').textContent = roomId;
    log(`SESSION LOADED: ${roomId}`, 'ok');
    setStatus('sync', 'SYNCING');
    await pollText();
    await loadFiles();
    startPolling();
}

window.addEventListener('hashchange', () => {
    stopPolling();
    clearCountdowns();
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    lastModified = '';
    cryptoKey = null;
    document.getElementById('editor').value = '';
    document.getElementById('file-list').innerHTML = '';
    loadFromHash();
});

// ── Status ───────────────────────────────────────────────────
function setStatus(state, label) {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    txt.textContent = label;
    const colors = { online: '#10b981', sync: '#eab308', offline: '#ef4444', idle: '#525252' };
    dot.style.background = colors[state] || colors.idle;
    dot.classList.toggle('pulse', state === 'sync');
}

// ── Polling ──────────────────────────────────────────────────
function startPolling() {
    stopPolling();
    pollTimer = setInterval(async () => {
        await pollText();
        await loadFiles();
    }, POLL_INTERVAL);
    setStatus('online', 'ONLINE');
}

// Ensure polling stops clean on unload
window.addEventListener('beforeunload', stopPolling);

function stopPolling() {
    if (pollTimer) clearInterval(pollTimer);
    pollTimer = null;
}

async function pollText() {
    if (!cryptoKey) return;
    try {
        const rh = await hashRoomId(roomId);
        const headers = { 'X-Requested-With': 'XMLHttpRequest' };
        if (lastModified) headers['If-Modified-Since'] = lastModified;

        const res = await fetch(`?action=get_text&room_hash=${rh}`, { headers });

        if (res.status === 304) {
            setStatus('online', 'ONLINE');
            return; // No change
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const lm = res.headers.get('Last-Modified');
        if (lm) lastModified = lm;

        const data = await res.json();
        if (data.empty) {
            setStatus('online', 'ONLINE');
            clearTextExpiry();
            return;
        }

        // Only update if we're not actively editing
        if (document.activeElement !== document.getElementById('editor')) {
            const plain = await decrypt(cryptoKey, data.encrypted_data, data.iv);
            document.getElementById('editor').value = plain;
            updateCharCount();
        }

        if (data.expires_in !== undefined) startTextExpiry(data.expires_in);
        setStatus('online', 'ONLINE');

    } catch (e) {
        setStatus('offline', 'OFFLINE');
        log(`POLL ERR: ${e.message}`, 'err');
    }
}

// ── Save Text ────────────────────────────────────────────────
async function saveText() {
    if (!cryptoKey || isSaving) return;
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
        autoSaveTimer = null;
    }
    const plaintext = document.getElementById('editor').value;
    isSaving = true;
    const btn = document.getElementById('btn-save');
    btn.disabled = true;
    btn.textContent = 'ENCRYPTING...';
    document.getElementById('sync-indicator').textContent = 'ENCRYPTING';

    try {
        const { data, iv } = await encrypt(cryptoKey, plaintext);
        const rh = await hashRoomId(roomId);

        const res = await fetch('?action=save_text', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ room_hash: rh, encrypted_data: data, iv }),
        });

        const json = await res.json();
        if (!json.ok) throw new Error(json.error);

        lastModified = '';
        document.getElementById('sync-indicator').textContent = '[SYNCED]';
        log('TEXT SYNCED', 'ok');
        if (json.expires_in !== undefined) startTextExpiry(json.expires_in);
        setStatus('online', 'ONLINE');

    } catch (e) {
        log(`SAVE ERR: ${e.message}`, 'err');
        document.getElementById('sync-indicator').textContent = 'ERROR';
        setStatus('offline', 'OFFLINE');
    } finally {
        isSaving = false;
        btn.disabled = false;
        btn.textContent = 'ENCRYPT & SYNC';
    }
}

// ── Text Expiry Timer ────────────────────────────────────────
function startTextExpiry(seconds) {
    clearTextExpiry();
    const el = document.getElementById('text-expires');
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
        textExpiresTimer = setTimeout(tick, 1000);
    }
    tick();
}

function clearTextExpiry() {
    if (textExpiresTimer) clearTimeout(textExpiresTimer);
    document.getElementById('text-expires').textContent = '';
}

// ── File Upload ──────────────────────────────────────────────
async function uploadFile(file) {
    if (!cryptoKey) return;
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
        const { data: encBuf, iv: encIv } = await encryptBuf(cryptoKey, buffer);
        buffer = null; // OOM protection

        setProgressVal(60, 'ENCRYPTING METADATA...');

        // Encrypt metadata (filename + MIME)
        const meta = JSON.stringify({ name: file.name, type: file.type, size: file.size });
        const { data: encMeta, iv: ivMeta } = await encrypt(cryptoKey, meta);

        setProgressVal(70, 'UPLOADING...');

        // Build multipart form
        const rh = await hashRoomId(roomId);
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

function setProgress(visible, label = '') {
    const wrap = document.getElementById('progress-wrap');
    wrap.classList.toggle('hidden', !visible);
    if (!visible) {
        setProgressVal(0, '');
    } else {
        document.getElementById('progress-label').textContent = label;
    }
}

function setProgressVal(pct, label) {
    document.getElementById('progress-bar').style.width = pct + '%';
    if (label) document.getElementById('progress-label').textContent = label;
}

// ── File List ────────────────────────────────────────────────
async function loadFiles() {
    if (!cryptoKey) return;
    try {
        const rh = await hashRoomId(roomId);
        const res = await fetch(`?action=list_files&room_hash=${rh}`);
        const data = await res.json();
        if (!data.ok) throw new Error(data.error);

        renderFiles(data.files);
    } catch (e) {
        log(`FILES ERR: ${e.message}`, 'err');
    }
}

// Make loadFiles globally accessible if needed, or let trigger components call it
function renderFiles(files) {
    const list = document.getElementById('file-list');
    const empty = document.getElementById('files-empty');

    // Clear old countdown timers
    clearCountdowns();
    list.innerHTML = '';

    if (!files || files.length === 0) {
        empty.classList.remove('hidden');
        return;
    }
    empty.classList.add('hidden');

    files.forEach(f => {
        const item = document.createElement('div');
        item.className = 'file-item p-3 flex items-center gap-3 flex-wrap';
        item.dataset.fileId = f.file_id;

        const cdEl = document.createElement('span');
        cdEl.className = 'mono text-xs countdown ml-auto';
        cdEl.style.color = 'var(--text-muted)';
        startFileCountdown(cdEl, f.expires_in);

        const nameEl = document.createElement('span');
        nameEl.className = 'mono text-xs flex-1 truncate';
        nameEl.style.color = 'var(--text-dim)';
        nameEl.textContent = '…';

        const sizeEl = document.createElement('span');
        sizeEl.className = 'mono text-xs';
        sizeEl.style.color = 'var(--text-muted)';

        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn';
        dlBtn.textContent = 'DECRYPT';
        dlBtn.style.padding = '3px 10px';
        dlBtn.style.fontSize = '10px';

        item.appendChild(nameEl);
        item.appendChild(sizeEl);
        item.appendChild(cdEl);
        item.appendChild(dlBtn);
        list.appendChild(item);

        // Decrypt metadata client-side to show filename
        decrypt(cryptoKey, f.encrypted_meta, f.iv_meta)
            .then(metaStr => {
                const meta = JSON.parse(metaStr);
                nameEl.textContent = meta.name;
                sizeEl.textContent = fmtSize(meta.size);
                dlBtn.onclick = () => downloadFile(f.file_id, f.encrypted_meta, f.iv_meta, meta.name);
            })
            .catch(() => { nameEl.textContent = '[encrypted]'; });
    });
}

function startFileCountdown(el, seconds) {
    const id = setInterval(() => {
        if (seconds <= 0) {
            clearInterval(id);
            el.textContent = 'EXPIRED';
            el.style.color = 'var(--red)';
            return;
        }
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        el.textContent = `[TTL] ${m}:${s}`;
        el.style.color = seconds < 60 ? 'var(--red)' : seconds < 180 ? 'var(--amber)' : 'var(--text-muted)';
        seconds--;
    }, 1000);
    countdowns[Math.random()] = id;
}

function clearCountdowns() {
    Object.values(countdowns).forEach(clearInterval);
    countdowns = {};
}

// ── File Download ────────────────────────────────────────────
async function downloadFile(fileId, encMeta, ivMeta, fileName) {
    if (!cryptoKey) return;
    log(`DOWNLOADING: ${fileName}`, '');

    try {
        const rh = await hashRoomId(roomId);
        const res = await fetch(`?action=download_file&file_id=${fileId}&room_hash=${rh}`);

        if (res.status === 410) { log(`FILE EXPIRED OR CONSUMED`, 'warn'); await loadFiles(); return; }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const encIvB64 = res.headers.get('X-Encrypted-Meta-IV') || ivMeta;

        let encBuf = await res.arrayBuffer();
        log(`DECRYPTING: ${fileName}`, '');

        const plainBuf = await decryptBuf(cryptoKey, encBuf, encIvB64);
        encBuf = null; // OOM protection

        // Recover MIME from metadata
        let mime = 'application/octet-stream';
        try {
            const meta = JSON.parse(await decrypt(cryptoKey, encMeta, ivMeta));
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

// ── Helpers ──────────────────────────────────────────────────
function bufToB64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf)));
}

function b64ToBuf(b64) {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf;
}

// Helper to convert array buffer to hex string
function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

function updateCharCount() {
    const v = document.getElementById('editor').value;
    document.getElementById('char-count').textContent = v.length.toLocaleString();
}

function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('btn-confirm-ok');
        const cancelBtn = document.getElementById('btn-confirm-cancel');

        msgEl.textContent = message;
        modal.classList.remove('hidden');

        function cleanup(result) {
            modal.classList.add('hidden');
            okBtn.onclick = null;
            cancelBtn.onclick = null;
            document.removeEventListener('keydown', handleEsc);
            resolve(result);
        }

        function handleEsc(e) {
            if (e.key === 'Escape') cleanup(false);
        }

        okBtn.onclick = () => cleanup(true);
        cancelBtn.onclick = () => cleanup(false);
        document.addEventListener('keydown', handleEsc);
    });
}


// ── Drag & Drop ──────────────────────────────────────────────
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    const files = e.dataTransfer.files;
    if (files.length) uploadFile(files[0]);
});
fileInput.addEventListener('change', () => {
    if (fileInput.files.length) { uploadFile(fileInput.files[0]); fileInput.value = ''; }
});

// ── Tabs ─────────────────────────────────────────────────────
document.querySelectorAll('[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('[data-tab]').forEach(b => {
            b.classList.remove('tab-active');
            b.style.color = 'var(--text-secondary)';
            b.style.borderBottom = '2px solid transparent';
        });
        btn.classList.add('tab-active');
        btn.style.color = 'var(--accent-primary)';
        btn.style.borderBottom = '2px solid var(--accent-primary)';

        ['text', 'files'].forEach(t => {
            document.getElementById('tab-' + t).classList.toggle('hidden', t !== btn.dataset.tab);
        });

        // Show/hide action buttons (ENCRYPT & SYNC, CLEAR) when switching tabs
        const textActions = document.getElementById('text-actions');
        if (textActions) {
            textActions.classList.toggle('hidden', btn.dataset.tab !== 'text');
        }

        if (btn.dataset.tab === 'files') loadFiles();
    });
});

// ── Buttons ──────────────────────────────────────────────────
document.getElementById('btn-save').addEventListener('click', saveText);
document.getElementById('btn-clear').addEventListener('click', async () => {
    document.getElementById('editor').value = '';
    updateCharCount();
    clearTextExpiry();
    await saveText();
});

document.getElementById('btn-new-room').addEventListener('click', async () => {
    const confirmed = await showConfirm('Generate a new session? The current session link will no longer be accessible from this tab.');
    if (!confirmed) return;
    stopPolling();
    const k = genKey();
    location.hash = k;
});

document.getElementById('btn-copy-url').addEventListener('click', () => {
    navigator.clipboard.writeText(location.href).then(() => {
        const btn = document.getElementById('btn-copy-url');
        btn.textContent = '[COPIED]';
        btn.classList.add('flash');
        setTimeout(() => { btn.textContent = 'COPY LINK'; btn.classList.remove('flash'); }, 1500);
        log('SHARE URL COPIED', 'ok');
    });
});

// Auto-save on Ctrl/Cmd+S
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveText(); }
});

document.getElementById('editor').addEventListener('input', () => {
    updateCharCount();
    
    // Clear existing auto-save timer
    if (autoSaveTimer) {
        clearTimeout(autoSaveTimer);
    }
    
    document.getElementById('sync-indicator').textContent = 'WAITING TO SYNC...';
    
    autoSaveTimer = setTimeout(async () => {
        await saveText();
    }, 5000);
});

// ── Boot ─────────────────────────────────────────────────────
(async () => {
    log('VOID://CLIPBOARD INITIALIZED', 'ok');
    log('WEB CRYPTO: ' + (crypto.subtle ? 'AES-GCM READY' : 'UNAVAILABLE — USE HTTPS'), crypto.subtle ? 'ok' : 'err');
    await loadFromHash();
})();
