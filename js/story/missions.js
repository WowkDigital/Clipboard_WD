'use strict';

import { SIDE_MISSIONS } from './db.js';
import { gameState, saveProgress } from './state.js';
import { printLine, printLiveLine } from './terminal.js';
import { updateStoryUI } from './ui.js';
import { state } from '../state.js';
import { hashRoomId } from '../crypto.js';

export async function checkSideMissions() {
    let completedAny = false;
    const editor = document.getElementById('editor');
    const editorVal = editor ? editor.value.trim() : '';

    // SIDE-1: Remote Handshake
    if (!gameState.completedSideMissions.includes('SIDE-1')) {
        if (state.lastSyncClientId && state.lastSyncClientId !== state.clientId) {
            gameState.completedSideMissions.push('SIDE-1');
            printLine('[+] PARALLEL OPERATION COMPLETED: TIMELINE_SPLIT.sh', 'ok');
            printLine('Connection from parallel client node detected. Handshake established.', 'ok');
            completedAny = true;
        }
    }

    // SIDE-2: Payload Decryption
    if (gameState.completedSideMissions.includes('SIDE-1') && !gameState.completedSideMissions.includes('SIDE-2')) {
        if (state.lastSyncClientId && state.lastSyncClientId !== state.clientId && editorVal === 'OVERRIDE') {
            gameState.completedSideMissions.push('SIDE-2');
            printLine('[+] PARALLEL OPERATION COMPLETED: SIGNAL_OVERRIDE.bin', 'ok');
            printLine('Decrypted remote override payload successfully.', 'ok');
            completedAny = true;
        }
    }

    // SIDE-3: Gateway Uplink
    if (gameState.completedSideMissions.includes('SIDE-2') && !gameState.completedSideMissions.includes('SIDE-3')) {
        if (state.lastSyncIp && state.clientIp && state.lastSyncIp !== state.clientIp) {
            gameState.completedSideMissions.push('SIDE-3');
            printLine('[+] PARALLEL OPERATION COMPLETED: EXTERNAL_BEACON.net', 'ok');
            printLine('Uplink confirmed from external network node. Client IP differs.', 'ok');
            completedAny = true;
        }
    }

    // SIDE-4: Null Void Sector
    if (gameState.completedSideMissions.includes('SIDE-3') && !gameState.completedSideMissions.includes('SIDE-4')) {
        if (state.roomId && state.roomId.startsWith('000')) {
            gameState.completedSideMissions.push('SIDE-4');
            printLine('[+] PARALLEL OPERATION COMPLETED: NULL_VOID_SECTOR.bin', 'ok');
            printLine('Cryptographic Null Void coordinate detected in URL hash.', 'ok');
            printLine('Decrypted secret logs for Level 37 poolroom structures.', 'ok');
            completedAny = true;
        }
    }

    // SIDE-5: Hash Collision
    if (gameState.completedSideMissions.includes('SIDE-4') && !gameState.completedSideMissions.includes('SIDE-5')) {
        const hashVal = location.hash.slice(1);
        if (hashVal && hashVal.length === 64) {
            const derivedHash = await hashRoomId(hashVal);
            if (derivedHash.startsWith('00000')) {
                gameState.completedSideMissions.push('SIDE-5');
                printLine('[+] PARALLEL OPERATION COMPLETED: HASH_COLLISION.bin', 'ok');
                printLine('Hash collision found! Cryptographic gate bypassed.', 'ok');
                completedAny = true;
            }
        }
    }

    if (completedAny) {
        saveProgress();
        updateStoryUI();
    }
}

export function startBypassMiner() {
    printLine('[+] INITIATING COGNITIVE DECRYPTION (PROOF OF WORK)...', 'sys');
    printLine('[+] TARGET PATTERN: room_hash starts with "00000"', 'sys');
    printLine('[!] Press "CLEAR" or type "stop" to abort mining.', 'warn');

    state.isMining = true;
    let totalHashes = 0;
    const startTime = Date.now();
    const liveLine = printLiveLine('[ ] Initializing hash generator...', 'warn');
    
    let isAborted = false;
    state.abortMining = () => {
        isAborted = true;
        state.isMining = false;
        state.abortMining = null;
        liveLine.update('[!] Decryption miner aborted by user.');
    };

    // Generate a secure base seed once to avoid system call overhead inside the loop
    const baseBytes = new Uint8Array(28);
    crypto.getRandomValues(baseBytes);
    const baseHex = Array.from(baseBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    let counter = 0;

    async function mineBatch() {
        if (isAborted) return;
        
        const batchSize = 350;
        for (let i = 0; i < batchSize; i++) {
            // Fast key generation: baseHex + 8-char hex counter
            const counterHex = (counter++).toString(16).padStart(8, '0');
            const key = baseHex + counterHex;
            
            const derived = await hashRoomId(key);
            
            if (derived.startsWith('00000')) {
                state.isMining = false;
                state.abortMining = null;
                liveLine.update(`[+] SUCCESS! Key found: ${key}`);
                printLine(`[+] Decrypted hash signature: ${derived}`, 'ok');
                printLine(`[+] Total hashes computed: ${counter.toLocaleString()}`, 'ok');
                printLine(`\n[!] BYPASS KEY ACQUIRED: ${key}`, 'sys');
                printLine(`[!] MANUAL SYNC REQUIRED:`, 'warn');
                printLine(`1. Copy the key above.`, 'warn');
                printLine(`2. Paste it in your browser URL bar after the '#' symbol (replacing the current key).`, 'warn');
                printLine(`3. Press Enter to load the parallel sector and complete the gate bypass.`, 'warn');
                return;
            }
        }
        
        totalHashes += batchSize;
        const elapsed = (Date.now() - startTime) / 1000;
        const speed = Math.round(totalHashes / elapsed);
        
        liveLine.update(`[ ] Hashes tried: ${totalHashes.toLocaleString()} | Speed: ${speed.toLocaleString()} H/s`);
        
        setTimeout(mineBatch, 0);
    }
    
    mineBatch();
}
