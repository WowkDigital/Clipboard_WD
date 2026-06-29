'use strict';

import { loadProgress } from './story/state.js';
import { updateStoryUI, initCollapsible } from './story/ui.js';
import { handleCommand } from './story/events.js';
import { printLine, clearTerminal } from './story/terminal.js';

// ── Initialization ───────────────────────────────────────────
export function initStory() {
    loadProgress();
    initCollapsible();
    updateStoryUI();

    // Hook up terminal input listener
    const input = document.getElementById('story-terminal-input');
    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value;
                input.value = '';
                handleCommand(cmd);
            }
        });
    }

    // Hook up shortcut buttons click listener
    document.querySelectorAll('.btn-cmd-shortcut').forEach(btn => {
        btn.addEventListener('click', () => {
            const cmd = btn.dataset.cmd;
            if (cmd) {
                handleCommand(cmd);
                if (input) input.focus();
            }
        });
    });

    // Print welcome text on load
    clearTerminal();
    printLine('[+] ESTABLISHING SECURE PROTOCOL WITH LIMIT GATEWAY...', 'warn');
    setTimeout(() => {
        printLine('[+] GATEWAY IP: 192.168.100.254 (SUBNET 37)', 'warn');
        printLine('[+] ATTEMPTING HANDSHAKE... SUCCESS.', 'ok');
        printLine('[+] SYSTEM STATUS: STANDBY', 'ok');
        printLine('[+] EXPEDITION ARCHIVES RECOVERY SUITE V1.0 INITIALIZED.', 'sys');
        printLine('[+] TYPE \'help\' FOR A LIST OF COMMANDS.', 'sys');
        printLine('----------------------------------------------------', 'sys');
    }, 100);
}
