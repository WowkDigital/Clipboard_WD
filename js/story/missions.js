'use strict';

import { SIDE_MISSIONS, HARDWARE_MISSIONS } from './db.js';
import { gameState, saveProgress } from './state.js';
import { printLine, printLiveLine } from './terminal.js';
import { updateStoryUI } from './ui.js';
import { state } from '../state.js';
import { hashRoomId, decrypt } from '../crypto.js';
import { loadFiles } from '../api.js';



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

    // HW-8: Thermal Equilibrium
    if (!gameState.completedSideMissions.includes('HW-8')) {
        if (gameState.heatBypassTime >= 15) {
            gameState.completedSideMissions.push('HW-8');
            printLine('[+] HARDWARE PROTOCOL COMPLETED: THERMAL_EQUILIBRIUM.bin', 'ok');
            printLine('Scanner cooling system recalibrated successfully under heavy load.', 'ok');
            completedAny = true;
        }
    }

    // HW-9: Decaying Packets
    if (!gameState.completedSideMissions.includes('HW-9')) {
        await loadFiles();
        const decryptedFiles = [];
        if (state.files && state.files.length > 0) {
            for (const f of state.files) {
                try {
                    const metaStr = await decrypt(state.cryptoKey, f.encrypted_meta, f.iv_meta);
                    const meta = JSON.parse(metaStr);
                    decryptedFiles.push({
                        name: meta.name,
                        created_at: f.created_at
                    });
                } catch (e) {
                    // Decrypt failed
                }
            }
        }

        const p1 = decryptedFiles.find(f => f.name === 'part_1.bin');
        const p2 = decryptedFiles.find(f => f.name === 'part_2.bin');
        const p3 = decryptedFiles.find(f => f.name === 'part_3.bin');

        if (p1 && p2 && p3) {
            const now = Math.floor(Date.now() / 1000);
            const age1 = now - p1.created_at;
            const age2 = now - p2.created_at;
            const age3 = now - p3.created_at;

            if (age1 <= 60 && age2 <= 300 && age3 <= 1800) {
                gameState.completedSideMissions.push('HW-9');
                printLine('[+] HARDWARE PROTOCOL COMPLETED: DECAYING_PACKETS.net', 'ok');
                printLine('All three data packets merged successfully before signal decay threshold.', 'ok');
                completedAny = true;
            } else {
                printLine('[-] Check failed: One or more data packets expired. part_1.bin must be < 60s old.', 'err');
                printLine(`  part_1.bin age: ${age1}s (limit: 60s) - ${age1 <= 60 ? 'OK' : 'EXPIRED'}`, age1 <= 60 ? 'ok' : 'err');
                printLine(`  part_2.bin age: ${age2}s (limit: 300s) - ${age2 <= 300 ? 'OK' : 'EXPIRED'}`, age2 <= 300 ? 'ok' : 'err');
                printLine(`  part_3.bin age: ${age3}s (limit: 1800s) - ${age3 <= 1800 ? 'OK' : 'EXPIRED'}`, age3 <= 1800 ? 'ok' : 'err');
            }
        } else {
            printLine('[-] Check failed: Missing packet files in storage grid.', 'err');
            printLine(`  Required files: part_1.bin (TTL 1m), part_2.bin (TTL 5m), part_3.bin (TTL 30m).`, 'warn');
            printLine(`  Found in grid: ${decryptedFiles.map(f => f.name).join(', ') || 'None'}`, 'warn');
        }
    }

    // HW-10: Color Theme Sequence
    if (!gameState.completedSideMissions.includes('HW-10')) {
        if (gameState.themeBypassCalibrated) {
            gameState.completedSideMissions.push('HW-10');
            printLine('[+] HARDWARE PROTOCOL COMPLETED: PHOSPHOR_RECOVERY.sh', 'ok');
            printLine('CRT Phosphor grid recalibrated. Color profile variance stabilized.', 'ok');
            completedAny = true;
        }
    }

    if (completedAny) {
        saveProgress();
        updateStoryUI();
    }
}

// Theme change tracker for HW-10 color theme sequence (amber -> green -> dark -> amber)
let themeSequence = [];
window.onThemeChange = (newTheme) => {
    if (!gameState.completedSideMissions.includes('HW-10')) {
        if (newTheme === 'amber') {
            if (themeSequence.length === 0) {
                themeSequence.push('amber');
            } else if (themeSequence.length === 3 && themeSequence[2] === 'dark') {
                themeSequence.push('amber');
                gameState.themeBypassCalibrated = true;
                saveProgress();
                printLine('[+] PHOSPHOR GUN ALIGNED: Color calibration loop successful. Run "check" to confirm.', 'ok');
            } else {
                themeSequence = ['amber']; // Reset to start
            }
        } else if (newTheme === 'green') {
            if (themeSequence.length === 1 && themeSequence[0] === 'amber') {
                themeSequence.push('green');
            } else {
                themeSequence = []; // Invalid reset
            }
        } else if (newTheme === 'dark') {
            if (themeSequence.length === 2 && themeSequence[1] === 'green') {
                themeSequence.push('dark');
            } else {
                themeSequence = []; // Invalid reset
            }
        }
    }
};


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
