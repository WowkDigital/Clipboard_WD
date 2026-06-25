'use strict';

export function log(msg, type = '') {
    const el = document.getElementById('log');
    if (!el) return;
    const line = document.createElement('div');
    line.className = 'log-line ' + type;
    const ts = new Date().toTimeString().slice(0, 8);
    line.textContent = `[${ts}] ${msg}`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
}

// Initialize logger event listeners
const clearBtn = document.getElementById('btn-clear-log');
if (clearBtn) {
    clearBtn.onclick = () => {
        const el = document.getElementById('log');
        if (el) el.innerHTML = '';
    };
}
