'use strict';

// ── Game Database ────────────────────────────────────────────
const DOCUMENTS = {
    'DOC-1': {
        id: 'DOC-1',
        title: 'EXPEDITION_DEPARTURE.log',
        content: [
            '[LOG ENTRY: 12-14-1981 | SURVEYOR TEAM ALPHA]',
            'Our team entered the sub-level of the local commercial facility to investigate reports of an "infinite office space" anomaly.',
            'We marked the entrance door with orange paint. However, upon closing the door behind us, the handle became completely unresponsive, and the texture of the wall seemed to shift.',
            'If you are finding this log on the gateway, know that we set a general passcode lock on our primary logs to prevent security leaks. The passcode is the year we departed this reality.'
        ]
    },
    'DOC-2': {
        id: 'DOC-2',
        title: 'LOBBY_OBSERVATIONS.log',
        content: [
            '[LOG ENTRY: 12-16-1981 | SURVEYOR TEAM ALPHA]',
            'We have been walking for 48 hours. The wallpaper is a damp yellow pattern, and the ceiling is covered in fluorescent tube lights humming at an unbearable volume.',
            'The hum is consistent. We measured it at exactly 432 Hz. We noticed that tuning a gateway receiver to this specific frequency allows us to map nearby physical distortions.',
            'Run a scan on the terminal to calibrate our receiver to 432 Hz and see if we can find any way out of this hallway.'
        ]
    },
    'DOC-3': {
        id: 'DOC-3',
        title: 'UNDERGROUND_WATERWAYS.log',
        content: [
            '[LOG ENTRY: 12-19-1981 | SURVEYOR TEAM ALPHA]',
            'The yellow lobby has suddenly transitioned into a massive network of indoor pools and tiled chambers. The air is warm and smells faintly of chlorine.',
            'We found a heavy steel security door leading to what appears to be an open courtyard. The door is locked. A note next to it says:',
            '"VALIDATE COORDINATES: AREA 188. SUB-GRID COORDS: LAT 37.188, LON -118.404"',
            'Enter the latitude coordinates to validate the door lock (use: unlock <lat_value_without_dots>).'
        ]
    },
    'DOC-4': {
        id: 'DOC-4',
        title: 'THE_COURTYARD_GATE.log',
        content: [
            '[LOG ENTRY: 12-21-1981 | SURVEYOR TEAM ALPHA]',
            'The door unlocked. We are looking up at a hollow courtyard surrounded by tiers of identical windows. No sky, just an empty grey cloud overlay.',
            'We believe we can "no-clip" back into reality, but it requires aligning the local gate data transfer to a high-frequency short-lived clipboard space.',
            'INSTRUCTIONS:',
            '1. Go to the main TEXT editor tab of this Clipboard.',
            '2. Set the clipboard text to exactly: NOCLIP',
            '3. Change the TTL (Time-To-Live) on the HUD to exactly: 15m (which is 900s)',
            '4. Click the \'ENCRYPT & SYNC\' button.',
            '5. Once synced, run \'scan\' or \'status\' in this terminal to trigger the gate.'
        ]
    },
    'DOC-5': {
        id: 'DOC-5',
        title: 'RETURN_TO_REALITY.log',
        content: [
            '[LOG ENTRY: SUCCESS | ESCAPE COMPLETED]',
            'The gate frequency synchronized perfectly. The spatial distortion collapsed, releasing the gateway archives.',
            'If you are reading this, the gate is open. You may now return. Thank you for assisting with the recovery of Surveyor Team Alpha.'
        ]
    }
};

const ANOMALIES = {
    'IMG-1': {
        id: 'IMG-1',
        title: 'Level 0 Lobby',
        src: 'assets/story/liminal_1.png',
        desc: 'A monotonous loop of empty, damp yellow rooms with fluorescent lights.'
    },
    'IMG-2': {
        id: 'IMG-2',
        title: 'Level 37 Poolrooms',
        src: 'assets/story/liminal_2.png',
        desc: 'Chlorine-scented water and tiled chambers extending infinitely.'
    },
    'IMG-3': {
        id: 'IMG-3',
        title: 'Level 188 Courtyard',
        src: 'assets/story/liminal_3.png',
        desc: 'A rectangular courtyard surrounded by windows with a grey, static sky.'
    },
    'IMG-4': {
        id: 'IMG-4',
        title: 'Liminal Escape',
        src: 'assets/story/liminal_4.png',
        desc: 'The gateway exit. Blinding white light offering a path back to reality.'
    }
};

// ── Game State ───────────────────────────────────────────────
let gameState = {
    stage: 0, // 0: Start, 1: Unlocked DOC-2, 2: Scanned 432Hz -> DOC-3/IMG-2, 3: Coordinates Unlocked -> DOC-4/IMG-3, 4: NOCLIP Synced -> DOC-5/IMG-4
    unlockedDocs: ['DOC-1'],
    unlockedAnomalies: []
};

// Load progress from localStorage
function loadProgress() {
    const saved = localStorage.getItem('void_clipboard_story');
    if (saved) {
        try {
            gameState = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to parse story progress:', e);
        }
    }
}

// Save progress to localStorage
function saveProgress() {
    localStorage.setItem('void_clipboard_story', JSON.stringify(gameState));
}

// Reset progress
function resetProgress() {
    gameState = {
        stage: 0,
        unlockedDocs: ['DOC-1'],
        unlockedAnomalies: []
    };
    saveProgress();
}

// ── Terminal Printing Helper ─────────────────────────────────
function printLine(text, type = '', delay = 0) {
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

function clearTerminal() {
    const output = document.getElementById('story-terminal-output');
    if (output) output.innerHTML = '';
}

// ── UI Rendering ─────────────────────────────────────────────
function updateStoryUI() {
    renderDocuments();
    renderGallery();
    
    // Update counters
    const docsCount = document.getElementById('docs-count');
    if (docsCount) {
        docsCount.textContent = `${gameState.unlockedDocs.length}/${Object.keys(DOCUMENTS).length}`;
    }
    
    const galleryCount = document.getElementById('gallery-count');
    if (galleryCount) {
        galleryCount.textContent = `${gameState.unlockedAnomalies.length}/${Object.keys(ANOMALIES).length}`;
    }
}

function renderDocuments() {
    const list = document.getElementById('story-docs-list');
    if (!list) return;
    list.innerHTML = '';

    Object.keys(DOCUMENTS).forEach(id => {
        const doc = DOCUMENTS[id];
        const isUnlocked = gameState.unlockedDocs.includes(id);

        const el = document.createElement('div');
        el.className = `doc-item ${isUnlocked ? '' : 'locked'}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.textContent = isUnlocked ? doc.title : 'LOG_ARCHIVE_[ENCRYPTED].bin';

        const statusSpan = document.createElement('span');
        statusSpan.className = 'text-[9px] px-1 rounded border';
        if (isUnlocked) {
            statusSpan.textContent = 'OPEN';
            statusSpan.style.borderColor = '#10b981';
            statusSpan.style.color = '#10b981';
            el.onclick = () => readDocumentInTerminal(id);
        } else {
            statusSpan.textContent = 'LOCKED';
            statusSpan.style.borderColor = 'var(--glass-border)';
            statusSpan.style.color = 'var(--text-muted)';
        }

        el.appendChild(titleSpan);
        el.appendChild(statusSpan);
        list.appendChild(el);
    });
}

function renderGallery() {
    const grid = document.getElementById('story-gallery-grid');
    if (!grid) return;
    grid.innerHTML = '';

    Object.keys(ANOMALIES).forEach(id => {
        const item = ANOMALIES[id];
        const isUnlocked = gameState.unlockedAnomalies.includes(id);

        const el = document.createElement('div');
        el.className = `gallery-thumb ${isUnlocked ? '' : 'locked'}`;

        if (isUnlocked) {
            const img = document.createElement('img');
            img.src = item.src;
            img.alt = item.title;
            el.appendChild(img);
            el.onclick = () => openImageModal(id);
        }

        grid.appendChild(el);
    });
}

// Read document in terminal
function readDocumentInTerminal(id) {
    const doc = DOCUMENTS[id];
    if (!doc) return;
    
    printLine(`\n--- READING FILE: ${doc.title} ---`, 'sys');
    doc.content.forEach(line => {
        printLine(line, '');
    });
    printLine('----------------------------------------\n', 'sys');
}

// ── Image Modal ──────────────────────────────────────────────
function openImageModal(id) {
    const item = ANOMALIES[id];
    if (!item) return;

    const modal = document.getElementById('story-image-modal');
    const modalImg = document.getElementById('story-modal-img');
    const modalTitle = document.getElementById('story-modal-title');
    const modalDesc = document.getElementById('story-modal-desc');

    if (!modal || !modalImg || !modalTitle || !modalDesc) return;

    modalImg.src = item.src;
    modalTitle.textContent = item.title;
    modalDesc.textContent = item.desc;

    modal.classList.remove('hidden');
    
    const closeBtn = document.getElementById('btn-story-modal-close');
    const handleClose = () => {
        modal.classList.add('hidden');
        closeBtn.onclick = null;
        document.removeEventListener('keydown', handleEsc);
    };

    const handleEsc = (e) => {
        if (e.key === 'Escape') handleClose();
    };

    closeBtn.onclick = handleClose;
    document.addEventListener('keydown', handleEsc);
}

// ── Game Event System ────────────────────────────────────────
function executeScan() {
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

function processScanResults() {
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

function checkNoclipConditions() {
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

function executeUnlock(code) {
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
function handleCommand(cmdLine) {
    const line = cmdLine.trim();
    if (!line) return;

    printLine(`USR://> ${line}`, 'sys');

    const parts = line.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const arg = parts.slice(1).join(' ');

    switch (cmd) {
        case 'help':
            printLine('AVAILABLE COMMANDS:', 'sys');
            printLine('  help           - Display this command matrix.');
            printLine('  status         - Retrieve terminal connection details.');
            printLine('  scan           - Calibrate frequency receiver to scan for local anomalies.');
            printLine('  docs           - Show list of discovered documents.');
            printLine('  read <id>      - Read a document. (e.g., read DOC-1)');
            printLine('  gallery        - Show captured image data details.');
            printLine('  view <id>      - View an anomaly photo. (e.g., view IMG-1)');
            printLine('  unlock <code>  - Submit decryption key to open locked archives.');
            printLine('  hint           - Show a hint for the current stage if you are stuck.');
            printLine('  clear          - Clear terminal screen buffer.');
            printLine('  reset          - Reset all story progress.');
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
            printLine('LIMIT GATEWAY CORE V1.0');
            printLine(`SIGNAL STRENGTH: ${gameState.stage >= 4 ? '95%' : gameState.stage >= 2 ? '70%' : '37%'}`, 'warn');
            
            let sector = 'Sector 0: Yellow Lobby';
            if (gameState.stage === 2) sector = 'Sector 37: Underground Poolrooms';
            if (gameState.stage === 3) sector = 'Sector 188: Windowed Courtyard';
            if (gameState.stage >= 4) sector = 'Gateway exit vector calibrated';
            printLine(`CURRENT SECTOR: ${sector}`, 'warn');
            printLine(`DECRYPTED DOCUMENTS: ${gameState.unlockedDocs.length} / 5`, 'warn');
            printLine(`DISCOVERED ANOMALIES: ${gameState.unlockedAnomalies.length} / 4`, 'warn');
            
            let archiveStatus = 'PARTIALLY ENCRYPTED';
            if (gameState.stage === 5) archiveStatus = 'FULLY DECRYPTED - GATES OPEN';
            printLine(`ARCHIVE ENCRYPTION STATUS: ${archiveStatus}`, 'warn');
            break;

        case 'scan':
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

        case 'clear':
            clearTerminal();
            break;

        case 'reset':
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

// ── Initialization ───────────────────────────────────────────
export function initStory() {
    loadProgress();
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
