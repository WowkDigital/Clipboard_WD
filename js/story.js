'use strict';

import { loadProgress } from './story/state.js';
import { updateStoryUI, initCollapsible } from './story/ui.js';
import { handleCommand, checkSideMissions } from './story/events.js';
import { printLine, clearTerminal } from './story/terminal.js';
import { state } from './state.js';

// ── Initialization ───────────────────────────────────────────
export function initStory() {
    loadProgress();
    initCollapsible();
    updateStoryUI();

    state.onPollTextSuccess = () => {
        checkSideMissions();
    };
    checkSideMissions();

    // Hook up terminal input listener
    const input = document.getElementById('story-terminal-input');
    const cmdHistory = [];
    let historyIdx = -1;
    let tempInput = '';

    if (input) {
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const cmd = input.value.trim();
                if (cmd) {
                    if (cmdHistory.length === 0 || cmdHistory[cmdHistory.length - 1] !== cmd) {
                        cmdHistory.push(cmd);
                    }
                }
                historyIdx = -1;
                tempInput = '';
                input.value = '';
                handleCommand(cmd);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (cmdHistory.length === 0) return;
                
                if (historyIdx === -1) {
                    tempInput = input.value;
                    historyIdx = cmdHistory.length - 1;
                } else if (historyIdx > 0) {
                    historyIdx--;
                }
                input.value = cmdHistory[historyIdx];
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (historyIdx === -1) return;
                
                if (historyIdx < cmdHistory.length - 1) {
                    historyIdx++;
                    input.value = cmdHistory[historyIdx];
                } else {
                    historyIdx = -1;
                    input.value = tempInput;
                }
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
