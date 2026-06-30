'use strict';

// ── Line-by-Line Queue State ─────────────────────────────────
let printQueue = [];
let isPrinting = false;
let isProcessingScheduled = false;
let timerId = null;
let lineDelay = 50;

// ── Terminal Printing Helper ─────────────────────────────────
export function printLine(text, type = '', delay = -1) {
    printQueue.push({ text, type, delay });
    if (!isPrinting && !isProcessingScheduled) {
        isProcessingScheduled = true;
        queueMicrotask(() => {
            isProcessingScheduled = false;
            processQueue();
        });
    }
}

export function clearTerminal() {
    printQueue = [];
    isPrinting = false;
    isProcessingScheduled = false;
    if (timerId) {
        clearTimeout(timerId);
        timerId = null;
    }
    const output = document.getElementById('story-terminal-output');
    if (output) output.innerHTML = '';
}

function processQueue() {
    if (isPrinting) return;
    if (printQueue.length === 0) return;

    isPrinting = true;

    // Calculate line delay dynamically to finish the entire batch in ~1.0 second.
    // Capped at max 80ms for optimal readability.
    const totalLines = printQueue.length;
    lineDelay = totalLines > 0 ? Math.min(200, 1000 / totalLines) : 50;
    if (lineDelay < 10) lineDelay = 10; // Minimum 10ms

    printNextLine();
}

function printNextLine() {
    if (printQueue.length === 0) {
        isPrinting = false;
        return;
    }

    const { text, type, delay } = printQueue.shift();
    const output = document.getElementById('story-terminal-output');
    if (!output) {
        isPrinting = false;
        return;
    }

    const line = document.createElement('div');
    line.className = 'mono text-xs leading-relaxed py-0.5';

    if (type === 'ok') {
        line.style.color = 'var(--success, #10b981)';
    } else if (type === 'err') {
        line.style.color = 'var(--error, #ef4444)';
    } else if (type === 'warn') {
        line.style.color = 'var(--accent-primary, #eab308)';
    } else if (type === 'sys') {
        line.style.color = '#a855f7';
    } else {
        line.style.color = '#38bdf8';
    }

    line.textContent = text || '';
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;

    const actualDelay = delay >= 0 ? delay : lineDelay;

    if (actualDelay === 0) {
        printNextLine();
    } else {
        timerId = setTimeout(printNextLine, actualDelay);
    }
}

export function printLiveLine(initialText, type = '') {
    const output = document.getElementById('story-terminal-output');
    if (!output) return null;
    const line = document.createElement('div');
    line.className = 'mono text-xs leading-relaxed py-0.5';
    
    if (type === 'ok') {
        line.style.color = 'var(--success, #10b981)';
    } else if (type === 'err') {
        line.style.color = 'var(--error, #ef4444)';
    } else if (type === 'warn') {
        line.style.color = 'var(--accent-primary, #eab308)';
    } else if (type === 'sys') {
        line.style.color = '#a855f7';
    } else {
        line.style.color = '#38bdf8';
    }

    line.textContent = initialText;
    output.appendChild(line);
    output.scrollTop = output.scrollHeight;
    
    return {
        update: (newText) => {
            line.textContent = newText;
        },
        remove: () => {
            line.remove();
        }
    };
}



