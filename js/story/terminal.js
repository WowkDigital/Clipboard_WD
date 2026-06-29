'use strict';

// ── Terminal Printing Helper ─────────────────────────────────
export function printLine(text, type = '', delay = 0) {
    const output = document.getElementById('story-terminal-output');
    if (!output) return;

    const line = document.createElement('div');
    line.className = 'mono text-xs leading-relaxed py-0.5';
    
    if (type === 'ok') {
        line.style.color = '#10b981'; // Green
    } else if (type === 'err') {
        line.style.color = '#ef4444'; // Red
    } else if (type === 'warn') {
        line.style.color = '#eab308'; // Amber
    } else if (type === 'sys') {
        line.style.color = '#a855f7'; // Purple
    } else {
        line.style.color = '#38bdf8'; // Sky blue default
    }

    if (delay === 0) {
        line.textContent = text;
        output.appendChild(line);
        output.scrollTop = output.scrollHeight;
    } else {
        // Simple typewriter animation
        line.textContent = '';
        output.appendChild(line);
        let i = 0;
        const interval = setInterval(() => {
            if (i < text.length) {
                line.textContent += text.charAt(i);
                i++;
                output.scrollTop = output.scrollHeight;
            } else {
                clearInterval(interval);
            }
        }, delay);
    }
}

export function clearTerminal() {
    const output = document.getElementById('story-terminal-output');
    if (output) output.innerHTML = '';
}
