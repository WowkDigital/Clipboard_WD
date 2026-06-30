'use strict';

import { gameState, saveProgress } from './state.js';
import { printLine } from './terminal.js';
import { updateStoryUI } from './ui.js';

export function checkNoclipConditions() {
    const editor = document.getElementById('editor');
    const ttlSelect = document.getElementById('select-ttl');
    
    const editorVal = editor ? editor.value.trim() : '';
    const ttlVal = ttlSelect ? ttlSelect.value : '';

    if (editorVal === 'NOCLIP' && ttlVal === '900') {
        // Complete game! Stage 5
        gameState.stage = 5;
        if (!gameState.unlockedDocs.includes('DOC-5')) gameState.unlockedDocs.push('DOC-5');
        if (!gameState.unlockedAnomalies.includes('IMG-4')) gameState.unlockedAnomalies.push('IMG-4');
        
        printLine('\n========================================', 'ok');
        printLine('!!! NOCLIP SEQUENCE TRIGGERED !!!', 'ok');
        printLine('========================================', 'ok');
        printLine('[+] Synchronization key matches gateway exit vector.', 'ok');
        printLine('[+] Collapsing space-time coordinates...', 'ok');
        printLine('[+] Recovery protocol: SUCCESSFUL.', 'ok');
        printLine('[DECRYPTED]: RETURN_TO_REALITY.log is now readable.', 'ok');
        printLine('[NEW ANOMALY SPOTTED]: Anomaly escape exit image recovered.', 'ok');
        printLine('[!] Check the [CAPTURED ANOMALIES] section at the bottom of the page to view the photograph.', 'sys');
        printLine('\nYOU HAVE SUCCESSFULLY ASSISTED SURVEYOR TEAM ALPHA.', 'sys');
        printLine('Type "reset" to restart the puzzle or enjoy the findings.', 'sys');
        
        saveProgress();
        updateStoryUI();
    } else {
        // Explain current status
        printLine('[-] Scan failed. Spatial coordinates unstable.', 'err');
        printLine('Required conditions for gateway exit sync:', 'warn');
        printLine('1. Current Text space synced key must match "NOCLIP".', 'warn');
        printLine('2. Connection short-lived TTL must be set to 15m.', 'warn');
        printLine(`(Current Text: "${editorVal}", Current TTL: ${ttlVal === '900' ? '15m (900s) [VALID]' : 'INVALID'})`, 'err');
    }
}

export function executeUnlock(code) {
    if (!code) {
        printLine('Usage: unlock <passcode>', 'err');
        return;
    }

    const sanitized = code.trim().toLowerCase();

    if (sanitized === '1981') {
        if (gameState.stage === 0 || !gameState.unlockedDocs.includes('DOC-2')) {
            gameState.stage = 1;
            if (!gameState.unlockedDocs.includes('DOC-2')) gameState.unlockedDocs.push('DOC-2');
            printLine('[+] ACCESS GRANTED. Code match for Expedition Departure Year.', 'ok');
            printLine('[DECRYPTED]: LOBBY_OBSERVATIONS.log is now readable.', 'ok');
            saveProgress();
            updateStoryUI();
        } else {
            printLine('[-] Code already submitted. DOC-2 is already unlocked.', 'warn');
        }
    } else if (sanitized === '37188' || sanitized === '37.188') {
        if (gameState.stage === 2 || gameState.stage === 1) {
            gameState.stage = 3;
            if (!gameState.unlockedDocs.includes('DOC-4')) gameState.unlockedDocs.push('DOC-4');
            if (!gameState.unlockedAnomalies.includes('IMG-3')) gameState.unlockedAnomalies.push('IMG-3');
            printLine('[+] ACCESS GRANTED. Coordinates match Door Sub-grid Area 188.', 'ok');
            printLine('[DECRYPTED]: THE_COURTYARD_GATE.log is now readable.', 'ok');
            printLine('[NEW ANOMALY SPOTTED]: Level 188 Courtyard photo recovered.', 'ok');
            printLine('[!] Check the [CAPTURED ANOMALIES] section at the bottom of the page to view the photograph.', 'sys');
            saveProgress();
            updateStoryUI();
        } else if (gameState.stage < 2) {
            printLine('[-] Unlock code validation failed. Steel Door connection not found in this sector yet.', 'err');
        } else {
            printLine('[-] Code already submitted. DOC-4 is already unlocked.', 'warn');
        }
    } else {
        printLine('[-] ACCESS DENIED. Cryptographic passcode mismatch.', 'err');
    }
}
