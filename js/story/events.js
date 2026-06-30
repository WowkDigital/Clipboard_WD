'use strict';

import { DOCUMENTS, ANOMALIES, SIDE_MISSIONS } from './db.js';
import { gameState, saveProgress, resetProgress } from './state.js';
import { printLine, clearTerminal } from './terminal.js';
import { updateStoryUI, readDocumentInTerminal, openImageModal } from './ui.js';
import { state } from '../state.js';

// Import sub-module functions
import { checkSideMissions, startBypassMiner } from './missions.js';
import { preScanHeatCheck, executeScan, processScanResults } from './scan.js';
import { executeUnlock, checkNoclipConditions } from './unlock.js';

// Re-export checkSideMissions so other files can continue importing it from here
export { checkSideMissions };

// ── Command Parsing & Routing ─────────────────────────────────
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
            const scanOnlyIds = ['IMG-5', 'IMG-6', 'IMG-7', 'IMG-8'];
            const unlockedScanOnly = scanOnlyIds.filter(id => gameState.unlockedAnomalies.includes(id)).length;
            const remainingScanOnly = scanOnlyIds.length - unlockedScanOnly;
            printLine(`[i] Deep-sector signatures: ${remainingScanOnly} / 4 hidden anomalies remaining to be discovered.`, 'sys');
            
            if (!preScanHeatCheck()) {
                break;
            }
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
            if (state.simulationInterval) {
                clearInterval(state.simulationInterval);
                state.simulationInterval = null;
            }
            state.activeScans = [];
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
