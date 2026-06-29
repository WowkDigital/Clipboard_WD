'use strict';

import { state } from './state.js';
import { log } from './logger.js';
import { decrypt } from './crypto.js';
import { uploadFile, downloadFile, loadFiles, deleteFile } from './api.js';

// ── Status ───────────────────────────────────────────────────
export function setStatus(statusState, label) {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    if (!dot || !txt) return;
    txt.textContent = label;
    const colors = { online: '#10b981', sync: '#eab308', offline: '#ef4444', idle: '#525252' };
    dot.style.background = colors[statusState] || colors.idle;
    dot.classList.toggle('pulse', statusState === 'sync');
}

// ── Progress Bar ──────────────────────────────────────────────
export function setProgress(visible, label = '') {
    const wrap = document.getElementById('progress-wrap');
    if (!wrap) return;
    wrap.classList.toggle('hidden', !visible);
    if (!visible) {
        setProgressVal(0, '');
    } else {
        const lbl = document.getElementById('progress-label');
        if (lbl) lbl.textContent = label;
    }
}

export function setProgressVal(pct, label) {
    const bar = document.getElementById('progress-bar');
    if (bar) bar.style.width = pct + '%';
    if (label) {
        const lbl = document.getElementById('progress-label');
        if (lbl) lbl.textContent = label;
    }
}

// ── Helper formatting ─────────────────────────────────────────
export function fmtSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / 1024 / 1024).toFixed(1) + ' MB';
}

// ── Update Character Count ────────────────────────────────────
export function updateCharCount() {
    const editor = document.getElementById('editor');
    const charCount = document.getElementById('char-count');
    if (editor && charCount) {
        charCount.textContent = editor.value.length.toLocaleString();
    }
}

// ── Confirmation Modal ────────────────────────────────────────
export function showConfirm(message) {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirm-modal');
        const msgEl = document.getElementById('confirm-message');
        const okBtn = document.getElementById('btn-confirm-ok');
        const cancelBtn = document.getElementById('btn-confirm-cancel');

        if (!modal || !msgEl || !okBtn || !cancelBtn) {
            resolve(false);
            return;
        }

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

let lastRenderedIds = '';

// ── File Rendering ────────────────────────────────────────────
export function renderFiles(files) {
    const list = document.getElementById('file-list');
    const empty = document.getElementById('files-empty');
    if (!list || !empty) return;

    const currentIds = (files || []).map(f => f.file_id).sort().join(',');
    if (currentIds === lastRenderedIds) {
        return;
    }
    lastRenderedIds = currentIds;

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
        item.className = 'file-item p-3 flex justify-between items-center gap-3 sm:gap-4';
        item.dataset.fileId = f.file_id;

        const infoCol = document.createElement('div');
        infoCol.className = 'flex flex-col gap-1 min-w-0 flex-1';

        const nameEl = document.createElement('span');
        nameEl.className = 'mono text-xs sm:text-sm truncate font-medium';
        nameEl.style.color = 'var(--text-main)';
        nameEl.textContent = '…';

        const metaRow = document.createElement('div');
        metaRow.className = 'flex items-center gap-2 sm:gap-3 text-[10px] sm:text-xs';
        metaRow.style.color = 'var(--text-secondary)';

        const sizeEl = document.createElement('span');
        sizeEl.className = 'mono';

        const cdEl = document.createElement('span');
        cdEl.className = 'mono countdown';
        startFileCountdown(cdEl, f.expires_in);

        metaRow.appendChild(sizeEl);
        metaRow.appendChild(cdEl);
        infoCol.appendChild(nameEl);
        infoCol.appendChild(metaRow);

        const actionsCol = document.createElement('div');
        actionsCol.className = 'flex items-center gap-1.5 sm:gap-2 shrink-0';

        const dlBtn = document.createElement('button');
        dlBtn.className = 'btn';
        dlBtn.textContent = 'DOWNLOAD';
        dlBtn.style.padding = '3px 8px';
        dlBtn.style.fontSize = '9px';
        dlBtn.style.minHeight = '1.8rem';

        const delBtn = document.createElement('button');
        delBtn.className = 'btn btn-red';
        delBtn.textContent = 'DELETE';
        delBtn.style.padding = '3px 8px';
        delBtn.style.fontSize = '9px';
        delBtn.style.minHeight = '1.8rem';

        actionsCol.appendChild(dlBtn);
        actionsCol.appendChild(delBtn);

        item.appendChild(infoCol);
        item.appendChild(actionsCol);
        list.appendChild(item);

        let deleteClickedOnce = false;
        let deleteTimeout = null;

        const confirmDelete = async (fileName) => {
            if (!deleteClickedOnce) {
                deleteClickedOnce = true;
                delBtn.textContent = 'CONFIRM';
                delBtn.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                deleteTimeout = setTimeout(() => {
                    deleteClickedOnce = false;
                    delBtn.textContent = 'DELETE';
                    delBtn.style.backgroundColor = '';
                }, 4000);
            } else {
                clearTimeout(deleteTimeout);
                delBtn.disabled = true;
                delBtn.textContent = 'DELETING...';
                delBtn.style.backgroundColor = '';
                await deleteFile(f.file_id, fileName);
            }
        };

        // Decrypt metadata client-side to show filename
        decrypt(state.cryptoKey, f.encrypted_meta, f.iv_meta)
            .then(metaStr => {
                const meta = JSON.parse(metaStr);
                nameEl.textContent = meta.name;
                sizeEl.textContent = fmtSize(meta.size);
                dlBtn.onclick = () => downloadFile(f.file_id, f.encrypted_meta, f.iv_meta, meta.name);
                delBtn.onclick = () => confirmDelete(meta.name);
            })
            .catch(() => {
                nameEl.textContent = '[encrypted]';
                delBtn.onclick = () => confirmDelete('[encrypted]');
            });
    });
}

export function startFileCountdown(el, seconds) {
    function update() {
        if (seconds <= 0) {
            clearInterval(id);
            el.textContent = 'EXPIRED';
            el.style.color = 'var(--red)';
            return;
        }
        const m = String(Math.floor(seconds / 60)).padStart(2, '0');
        const s = String(seconds % 60).padStart(2, '0');
        el.textContent = `[TTL] ${m}:${s}`;
        el.style.color = seconds < 60 ? 'var(--red)' : seconds < 180 ? 'var(--amber)' : 'var(--text-secondary)';
        seconds--;
    }
    update();
    const id = setInterval(update, 1000);
    state.countdowns[Math.random()] = id;
}

export function clearCountdowns() {
    Object.values(state.countdowns).forEach(clearInterval);
    state.countdowns = {};
    lastRenderedIds = '';
}

// ── Initialize Drag & Drop ────────────────────────────────────
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');

if (dropZone && fileInput) {
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', async (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length) {
            for (const file of files) {
                await uploadFile(file);
            }
        }
    });
    fileInput.addEventListener('change', async () => {
        if (fileInput.files.length) {
            const files = Array.from(fileInput.files);
            fileInput.value = '';
            for (const file of files) {
                await uploadFile(file);
            }
        }
    });
}

// ── Initialize Tab Switching ──────────────────────────────────
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
            const el = document.getElementById('tab-' + t);
            if (el) el.classList.toggle('hidden', t !== btn.dataset.tab);
        });

        // Show/hide action buttons (ENCRYPT & SYNC, CLEAR) when switching tabs
        const textActions = document.getElementById('text-actions');
        if (textActions) {
            textActions.classList.toggle('hidden', btn.dataset.tab !== 'text');
        }

        if (btn.dataset.tab === 'files') loadFiles();
    });
});
