// ============================================================
// VOID://CLIPBOARD — Client Engine Entry Point (ES Module)
// Keys live only in URL #hash — never sent to server.
// ============================================================

'use strict';

import { state } from './js/state.js';
import { log } from './js/logger.js';
import { deriveKey } from './js/crypto.js';
import { setStatus, updateCharCount, showConfirm, clearCountdowns } from './js/ui.js';
import { saveText, pollText, loadFiles, startPolling, stopPolling, clearTextExpiry, resetTTL } from './js/api.js';

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
    state.roomId = hash.slice(0, 8);
    state.cryptoKey = await deriveKey(hash);
    
    const display = document.getElementById('room-display');
    if (display) display.textContent = state.roomId;
    
    log(`SESSION LOADED: ${state.roomId}`, 'ok');
    setStatus('sync', 'SYNCING');
    await pollText();
    await loadFiles();
    startPolling();
}

window.addEventListener('hashchange', () => {
    stopPolling();
    clearCountdowns();
    if (state.autoSaveTimer) {
        clearTimeout(state.autoSaveTimer);
        state.autoSaveTimer = null;
    }
    if (state.autoSaveInterval) {
        clearInterval(state.autoSaveInterval);
        state.autoSaveInterval = null;
    }
    state.lastModified = '';
    state.cryptoKey = null;
    state.lastSyncedText = null;
    state.lastSyncedTime = 0;
    
    const editor = document.getElementById('editor');
    if (editor) editor.value = '';
    
    const list = document.getElementById('file-list');
    if (list) list.innerHTML = '';
    
    loadFromHash();
});

// Ensure polling stops clean on unload
window.addEventListener('beforeunload', stopPolling);

// ── Initialize Event Handlers ────────────────────────────────
const btnSave = document.getElementById('btn-save');
if (btnSave) btnSave.addEventListener('click', saveText);

const btnResetTTL = document.getElementById('btn-reset-ttl');
if (btnResetTTL) btnResetTTL.addEventListener('click', resetTTL);

const selectTTL = document.getElementById('select-ttl');
if (selectTTL) selectTTL.addEventListener('change', resetTTL);

const btnClear = document.getElementById('btn-clear');
if (btnClear) {
    btnClear.addEventListener('click', async () => {
        const editor = document.getElementById('editor');
        if (editor) editor.value = '';
        updateCharCount();
        clearTextExpiry();
        await saveText();
    });
}

const btnNewRoom = document.getElementById('btn-new-room');
if (btnNewRoom) {
    btnNewRoom.addEventListener('click', async () => {
        const confirmed = await showConfirm('Generate a new session? The current session link will no longer be accessible from this tab.');
        if (!confirmed) return;
        stopPolling();
        const k = genKey();
        location.hash = k;
    });
}

const btnCopyUrl = document.getElementById('btn-copy-url');
if (btnCopyUrl) {
    btnCopyUrl.addEventListener('click', () => {
        navigator.clipboard.writeText(location.href).then(() => {
            btnCopyUrl.textContent = '[COPIED]';
            btnCopyUrl.classList.add('flash');
            setTimeout(() => {
                btnCopyUrl.textContent = 'COPY LINK';
                btnCopyUrl.classList.remove('flash');
            }, 1500);
            log('SHARE URL COPIED', 'ok');
        });
    });
}

// Auto-save on Ctrl/Cmd+S
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        saveText();
    }
});

const editor = document.getElementById('editor');
if (editor) {
    editor.addEventListener('input', () => {
        updateCharCount();
        
        // Clear existing auto-save timer & interval
        if (state.autoSaveTimer) {
            clearTimeout(state.autoSaveTimer);
        }
        if (state.autoSaveInterval) {
            clearInterval(state.autoSaveInterval);
            state.autoSaveInterval = null;
        }
        
        const indicator = document.getElementById('sync-indicator');
        const duration = 5000;
        const startTime = Date.now();
        
        const updateProgressBar = () => {
            const elapsed = Date.now() - startTime;
            
            const barLength = 5;
            const filledLength = Math.min(barLength, Math.floor(elapsed / 1000));
            
            let barHTML = '';
            for (let i = 0; i < barLength; i++) {
                if (i < filledLength) {
                    barHTML += '<span style="display:inline-block; width:8px; height:10px; background:currentColor; margin-left:1px; margin-right:1px; vertical-align:-1px;"></span>';
                } else {
                    barHTML += '<span style="display:inline-block; width:8px; height:10px; background:transparent; border:1px solid currentColor; opacity:0.2; margin-left:1px; margin-right:1px; vertical-align:-1px;"></span>';
                }
            }
            
            if (indicator) {
                indicator.innerHTML = `WAITING TO SYNC [${barHTML}]`;
                indicator.style.color = 'var(--accent-primary)';
            }
        };

        updateProgressBar();
        
        state.autoSaveInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            updateProgressBar();
            if (elapsed >= duration) {
                clearInterval(state.autoSaveInterval);
                state.autoSaveInterval = null;
            }
        }, 100);
        
        state.autoSaveTimer = setTimeout(async () => {
            await saveText();
        }, duration);
    });
}

// ── Boot ─────────────────────────────────────────────────────
(async () => {
    log('VOID://CLIPBOARD INITIALIZED', 'ok');
    log('WEB CRYPTO: ' + (crypto.subtle ? 'AES-GCM READY' : 'UNAVAILABLE — USE HTTPS'), crypto.subtle ? 'ok' : 'err');
    await loadFromHash();
})();
