'use strict';

import { DOCUMENTS, ANOMALIES, SIDE_MISSIONS } from './db.js';
import { gameState, saveProgress, resetProgress } from './state.js';
import { printLine, clearTerminal, printLiveLine } from './terminal.js';
import { updateStoryUI, readDocumentInTerminal, openImageModal } from './ui.js';
import { state } from '../state.js';
import { hashRoomId } from '../crypto.js';

// ── Side Missions Check System ───────────────────────────────
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

// ── Game Event System ────────────────────────────────────────
export function executeScan() {
    printLine('[+] SCANNING IN PROGRESS...', 'warn');
    let pct = 0;
    const interval = setInterval(() => {
        if (pct < 100) {
            pct += 20;
            printLine(`[ ] Scanning frequencies: ${pct}% complete...`, 'warn');
        } else {
            clearInterval(interval);
            printLine('[+] SCAN COMPLETE.', 'ok');
            processScanResults();
        }
    }, 250);
}

export function processScanResults() {
    if (gameState.stage === 0) {
        // Stage 0 -> Unlock Anomaly 1
        if (!gameState.unlockedAnomalies.includes('IMG-1')) {
            gameState.unlockedAnomalies.push('IMG-1');
            printLine('[NEW ANOMALY SPOTTED]: Level 0 Lobby database archive recovered.', 'ok');
            printLine('Check the anomaly gallery to view the photograph.', 'ok');
            saveProgress();
            updateStoryUI();
        } else {
            printLine('[-] Scan finished. No new local anomalies detected. Current level connection is Level 0.', 'err');
        }
    } else if (gameState.stage === 1) {
        printLine('[-] Scan finished. Receiver is uncalibrated. Signal interference matches 432 Hz resonance.', 'warn');
        printLine('Hint: Find a way to tune the receiver or solve log code to progress.', 'warn');
    } else if (gameState.stage === 2) {
        // Scanned at 432 Hz -> Unlocks DOC-3 and IMG-2 (Poolrooms)
        if (!gameState.unlockedDocs.includes('DOC-3')) {
            gameState.unlockedDocs.push('DOC-3');
            gameState.unlockedAnomalies.push('IMG-2');
            gameState.stage = 2; // Keep at 2
            printLine('[CALIBRATED SCAN]: Successfully tuned gateway receiver to 432 Hz.', 'ok');
            printLine('[DECRYPTED]: UNDERGROUND_WATERWAYS.log is now readable.', 'ok');
            printLine('[NEW ANOMALY SPOTTED]: Level 37 Poolrooms photo recovered.', 'ok');
            saveProgress();
            updateStoryUI();
        } else {
            printLine('[-] Scan finished. Receiver tuned to 432 Hz. Environment stable.', 'ok');
        }
    } else if (gameState.stage === 3) {
        printLine('[-] Scan finished. Steel security door detected. Coordinate validation still pending.', 'warn');
    } else if (gameState.stage === 4) {
        // Scan or status when ESCAPE sequence is valid
        checkNoclipConditions();
    } else if (gameState.stage === 5) {
        printLine('[+] Connection closed. Expedition archives fully recovered.', 'ok');
    }
}

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

// ── Command Parsing ──────────────────────────────────────────
export async function handleCommand(cmdLine) {
    const line = cmdLine.trim();
    if (!line) return;

    if (state.isAdminPrompt) {
        state.isAdminPrompt = false;
        printLine('USR://> *********', 'sys');
        if (line === 'admin_31415') {
            gameState.stage = 5;
            
            // Unlock all documents
            Object.keys(DOCUMENTS).forEach(id => {
                if (!gameState.unlockedDocs.includes(id)) gameState.unlockedDocs.push(id);
            });
            
            // Unlock all anomalies
            Object.keys(ANOMALIES).forEach(id => {
                if (!gameState.unlockedAnomalies.includes(id)) gameState.unlockedAnomalies.push(id);
            });
            
            // Complete all side missions
            Object.keys(SIDE_MISSIONS).forEach(id => {
                if (!gameState.completedSideMissions.includes(id)) gameState.completedSideMissions.push(id);
            });
            
            printLine('[+] ADMIN BYPASS TRIGGERED: All gateway layers decrypted.', 'ok');
            saveProgress();
            updateStoryUI();
        } else {
            printLine('[-] INVALID ADMIN PASSWORD. ACCESS DENIED.', 'err');
        }
        return;
    }

    printLine(`USR://> ${line}`, 'sys');

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
        case 'help':
            printLine('AVAILABLE COMMANDS:', 'sys');
            printLine('');
            printLine('--- CORE PROTOCOLS (STORY PROGRESSION) ---', 'sys');
            printLine('  docs           - Show list of decrypted documents.');
            printLine('  read <id>      - Read document contents (e.g., read DOC-1).');
            printLine('  scan           - Calibrate frequency and scan for anomalies/gates.');
            printLine('  unlock <code>  - Submit decryption key to open locked archives.');
            printLine('  hint           - Get a directive clue for your current location.');
            printLine('');
            printLine('--- PARALLEL BYPASSES (SIDE MISSIONS) ---', 'sys');
            printLine('  check          - Run handshake verification on bypass networks.');
            printLine('  mine           - Initiate local PoW miner for hash collision.');
            printLine('  stop           - Abort active decryption mining.');
            printLine('  ip             - Query client IP address.');
            printLine('');
            printLine('--- SYSTEM MAINTENANCE & COSMETICS ---', 'sys');
            printLine('  help           - Display this command directory.');
            printLine('  status         - Query connection strength and encryption status.');
            printLine('  gallery        - Show captured anomaly database records.');
            printLine('  view <id>      - Load anomaly image in modal (e.g., view IMG-1).');
            printLine('  clear          - Clear terminal console buffer.');
            printLine('  reset          - Perform hard factory reset of story progress.');
            break;

        case 'ip':
            printLine(`[+] CURRENT CLIENT IP: ${state.clientIp || 'UNKNOWN (SYNC REQUIRED)'}`, 'ok');
            break;

        case 'check':
            printLine('Checking sub-channel bypass networks...', 'sys');
            await checkSideMissions();
            Object.keys(SIDE_MISSIONS).forEach(id => {
                const isDone = gameState.completedSideMissions.includes(id);
                if (isDone && !gameState.seenMissions.includes(id)) {
                    gameState.seenMissions.push(id);
                }
                printLine(`  [${id}] ${SIDE_MISSIONS[id].title}: ${isDone ? 'COMPLETED' : 'ACTIVE'}`, isDone ? 'ok' : 'warn');
            });
            saveProgress();
            updateStoryUI();
            break;

        case 'hint':
            printLine('--- HINT MODULE ACTIVE ---', 'sys');
            if (gameState.stage === 0) {
                printLine('Task: First steps');
                printLine('HINT: Read document DOC-1 carefully using the command "read DOC-1". You will find the year the expedition departed. Use this year as the unlock code: unlock <year>');
            } else if (gameState.stage === 1) {
                printLine('Task: Calibrating frequencies');
                printLine('HINT: You have decrypted document DOC-2. Read it ("read DOC-2") to learn the registered frequency (432 Hz). Then, type "scan" so the receiver automatically tunes to this value.');
            } else if (gameState.stage === 2) {
                printLine('Task: Gate verification');
                printLine('HINT: You have accessed log DOC-3 ("read DOC-3"). Surveyor Team Alpha requests you to enter the latitude (LAT) coordinates of the gate. Use the command: unlock 37188');
            } else if (gameState.stage === 3) {
                printLine('Task: Noclip exit protocol');
                printLine('HINT: In document DOC-4 ("read DOC-4") the exit procedure is detailed. Go to the first tab (TEXT), type "NOCLIP" in the editor, change the TTL on the HUD bar to 15m (15 minutes), and click "ENCRYPT & SYNC". Then return to the terminal and type "scan".');
            } else if (gameState.stage === 4) {
                printLine('Task: Gate exit launch');
                printLine('HINT: Make sure you have the exact word "NOCLIP" in the TEXT tab, and the TTL on the HUD is set to 15m (and synced). Type the command "scan" in this terminal to complete the noclip escape.');
            } else if (gameState.stage === 5) {
                printLine('Game Completed!');
                printLine('HINT: The archive has been fully decrypted and the team is safe. Use "reset" to play again.');
            }
            break;

        case 'status':
            await checkSideMissions();
            printLine('LIMIT GATEWAY CORE V1.0');
            printLine(`SIGNAL STRENGTH: ${gameState.stage >= 4 ? '95%' : gameState.stage >= 2 ? '70%' : '37%'}`, 'warn');
            
            let sector = 'Sector 0: Yellow Lobby';
            if (gameState.stage === 2) sector = 'Sector 37: Underground Poolrooms';
            if (gameState.stage === 3) sector = 'Sector 188: Windowed Courtyard';
            if (gameState.stage >= 4) sector = 'Gateway exit vector calibrated';
            printLine(`CURRENT SECTOR: ${sector}`, 'warn');
            printLine(`DECRYPTED DOCUMENTS: ${gameState.unlockedDocs.length} / 5`, 'warn');
            printLine(`DISCOVERED ANOMALIES: ${gameState.unlockedAnomalies.length} / 4`, 'warn');
            printLine(`COMPLETED BYPASSES: ${gameState.completedSideMissions.length} / ${Object.keys(SIDE_MISSIONS).length}`, 'warn');
            
            let archiveStatus = 'PARTIALLY ENCRYPTED';
            if (gameState.stage === 5) archiveStatus = 'FULLY DECRYPTED - GATES OPEN';
            printLine(`ARCHIVE ENCRYPTION STATUS: ${archiveStatus}`, 'warn');
            break;

        case 'scan':
            await checkSideMissions();
            // Check if user is in Stage 1 and needs to calibrate to 432 Hz
            if (gameState.stage === 1) {
                printLine('[+] Scanning frequency band...', 'warn');
                printLine('[?] Found active resonance matching LOBBY_OBSERVATIONS frequency (432 Hz).', 'sys');
                printLine('[!] Tuning receiver... Calibrated successfully!', 'ok');
                gameState.stage = 2;
                saveProgress();
                processScanResults();
            } else if (gameState.stage === 3) {
                // Check if clipboard is already synced with NOCLIP and TTL is 15m
                const editor = document.getElementById('editor');
                const ttlSelect = document.getElementById('select-ttl');
                
                const editorVal = editor ? editor.value.trim() : '';
                const ttlVal = ttlSelect ? ttlSelect.value : '';
                
                if (editorVal === 'NOCLIP' && ttlVal === '900') {
                    gameState.stage = 4;
                    saveProgress();
                    checkNoclipConditions();
                } else {
                    executeScan();
                }
            } else if (gameState.stage === 4) {
                checkNoclipConditions();
            } else {
                executeScan();
            }
            break;

        case 'docs':
            printLine('--- DECRYPTED DOCUMENTS ---', 'sys');
            Object.keys(DOCUMENTS).forEach(id => {
                const isUnlocked = gameState.unlockedDocs.includes(id);
                printLine(`  [${id}] ${isUnlocked ? DOCUMENTS[id].title : '[LOCKED]'}`);
            });
            break;

        case 'read':
            if (!arg) {
                printLine('Usage: read <doc_id>. Example: read DOC-1', 'err');
                break;
            }
            const docId = arg.toUpperCase();
            if (!DOCUMENTS[docId]) {
                printLine(`[-] Unknown document ID: ${docId}`, 'err');
            } else if (!gameState.unlockedDocs.includes(docId)) {
                printLine(`[-] Document ${docId} is still locked/encrypted.`, 'err');
            } else {
                readDocumentInTerminal(docId);
            }
            break;

        case 'gallery':
            printLine('--- DISCOVERED ANOMALIES ---', 'sys');
            Object.keys(ANOMALIES).forEach(id => {
                const isUnlocked = gameState.unlockedAnomalies.includes(id);
                printLine(`  [${id}] ${isUnlocked ? ANOMALIES[id].title : '[LOCKED]'}`);
            });
            break;

        case 'view':
            if (!arg) {
                printLine('Usage: view <image_id>. Example: view IMG-1', 'err');
                break;
            }
            const imgId = arg.toUpperCase();
            if (!ANOMALIES[imgId]) {
                printLine(`[-] Unknown anomaly ID: ${imgId}`, 'err');
            } else if (!gameState.unlockedAnomalies.includes(imgId)) {
                printLine(`[-] Anomaly photograph ${imgId} is locked.`, 'err');
            } else {
                openImageModal(imgId);
                printLine(`[+] Opening retro image viewer for ${imgId}...`, 'ok');
            }
            break;

        case 'unlock':
            executeUnlock(arg);
            break;

        case 'mine':
            if (state.isMining) {
                printLine('[-] Decryption miner is already running.', 'err');
                break;
            }
            const isSide5Unlocked = gameState.completedSideMissions.includes('SIDE-4');
            const isSide5Completed = gameState.completedSideMissions.includes('SIDE-5');
            
            if (!isSide5Unlocked) {
                printLine('[-] HASH_COLLISION.bin is locked. You must decrypt previous sectors first.', 'err');
                break;
            }
            if (isSide5Completed) {
                printLine('[!] HASH_COLLISION.bin is already completed. Restarting miner for verification...', 'warn');
            }
            
            startBypassMiner();
            break;

        case 'stop':
            if (state.isMining && typeof state.abortMining === 'function') {
                state.abortMining();
            } else {
                printLine('[-] No active decryption miner running.', 'err');
            }
            break;

        case 'admin':
            if (arg.trim() === 'access') {
                state.isAdminPrompt = true;
                printLine('[?] ENTER ADMIN ACCESS KEY:', 'warn');
            } else {
                printLine('[-] Usage: admin access', 'err');
            }
            break;

        case 'clear':
            if (state.isMining && typeof state.abortMining === 'function') {
                state.abortMining();
            }
            clearTerminal();
            break;

        case 'reset':
            if (state.isMining && typeof state.abortMining === 'function') {
                state.abortMining();
            }
            resetProgress();
            clearTerminal();
            printLine('[+] SYSTEM PROGRESS RESET.', 'warn');
            printLine('[+] Type "help" to start again.', '');
            updateStoryUI();
            break;

        default:
            printLine(`[-] Command not recognized: ${cmd}. Type 'help' for instructions.`, 'err');
            break;
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
