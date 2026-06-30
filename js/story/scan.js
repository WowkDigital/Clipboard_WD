'use strict';

import { DOCUMENTS, ANOMALIES } from './db.js';
import { gameState, saveProgress } from './state.js';
import { printLine, printLiveLine } from './terminal.js';
import { updateStoryUI } from './ui.js';
import { state } from '../state.js';
import { checkNoclipConditions } from './unlock.js';

export function preScanHeatCheck() {
    const now = Date.now();
    
    // 1. Cooling calculations (min temperature is 20°C)
    if (gameState.lastScanTime) {
        const secondsPassed = (now - gameState.lastScanTime) / 1000;
        const coolAmt = Math.floor(secondsPassed * 2.0); // cools at 2.0°C per second
        gameState.scannerHeat = Math.max(20, (gameState.scannerHeat || 20) - coolAmt);
    }
    gameState.lastScanTime = now;

    // 2. Overheat check (max temperature is 125°C)
    if (gameState.overheatedUntil && now < gameState.overheatedUntil) {
        const secLeft = Math.ceil((gameState.overheatedUntil - now) / 1000);
        printLine('[!!!] ERROR: SCANNER THERMAL LOCKOUT ACTIVE.', 'err');
        printLine('Hardware disabled to prevent core breakdown.', 'err');
        printLine(`System cooling down... Time remaining: ${secLeft}s.`, 'warn');
        return false;
    }

    // 3. Print warning if near critical temperature
    if (gameState.scannerHeat > 100) {
        printLine('[!] WARNING: TEMPERATURE NEAR CRITICAL LIMIT (125°C). Concurrent scans will trigger lockout!', 'err');
    }
    
    saveProgress();
    return true;
}

export function runSimulationTick() {
    const now = Date.now();
    const activeScans = state.activeScans || [];
    const N = activeScans.length;

    if (N === 0) {
        clearInterval(state.simulationInterval);
        state.simulationInterval = null;
        return;
    }

    // 1. Calculate time elapsed and update temperature (cooling: 2°C/s, heating: 6°C/s per running scan)
    const elapsedSeconds = gameState.lastScanTime ? (now - gameState.lastScanTime) / 1000 : 1;
    gameState.lastScanTime = now;

    const coolAmt = elapsedSeconds * 2.0;
    const heatAmt = elapsedSeconds * N * 6.0;

    gameState.scannerHeat = Math.max(20, Math.min(125, (gameState.scannerHeat || 20) - coolAmt + heatAmt));
    saveProgress();

    // 2. Overheat check (125°C)
    if (gameState.scannerHeat >= 125) {
        gameState.scannerHeat = 125;
        gameState.overheatedUntil = now + 60000; // 1 min lockout
        saveProgress();

        // Abort all active scans
        activeScans.forEach(scan => {
            const barLength = 10;
            const filled = Math.round((scan.pct / 100) * barLength);
            let barStr = '';
            for (let i = 0; i < barLength; i++) {
                barStr += i < filled ? '█' : '░';
            }
            scan.liveLine.update(`[!!!] OVERHEATED: SCANNING: [${barStr}] ${Math.round(scan.pct)}% | TEMP: [██████████] 125°C`);
        });

        state.activeScans = [];
        clearInterval(state.simulationInterval);
        state.simulationInterval = null;

        printLine('[!!!] FATAL: TEMPERATURE EXCEEDED 125°C. SCANNER OVERHEATED AND ALL ACTIVE SCANS ABORTED.', 'err');
        return;
    }

    // 3. Calculate progress increment for this 1s tick based on current global temperature
    const progressIncrement = 20 / (1 + (gameState.scannerHeat - 20) / 25);

    // 4. Update each active scan
    const completedScans = [];
    state.activeScans = activeScans.filter(scan => {
        scan.pct = Math.min(100, scan.pct + progressIncrement);
        
        const barLength = 10;
        const filled = Math.round((scan.pct / 100) * barLength);
        let barStr = '';
        for (let i = 0; i < barLength; i++) {
            barStr += i < filled ? '█' : '░';
        }
        
        const tempPct = Math.min(100, Math.max(0, Math.round(((gameState.scannerHeat - 20) / (125 - 20)) * 100)));
        const tempFilled = Math.round((tempPct / 100) * barLength);
        let tempBarStr = '';
        for (let i = 0; i < barLength; i++) {
            tempBarStr += i < tempFilled ? '█' : '░';
        }
        
        if (scan.pct >= 100) {
            scan.liveLine.update(`[+] SCAN COMPLETE: [██████████] 100% | TEMP: [${tempBarStr}] ${Math.round(gameState.scannerHeat)}°C`);
            completedScans.push(scan);
            return false; // Remove from active list
        } else {
            scan.liveLine.update(`[ ] SCANNING: [${barStr}] ${Math.round(scan.pct)}% | TEMP: [${tempBarStr}] ${Math.round(gameState.scannerHeat)}°C`);
            return true; // Keep in active list
        }
    });

    // 5. Finalize completed scans
    completedScans.forEach(() => {
        printLine('[+] SCANNING PROTOCOL FINISHED.', 'ok');
        processScanResults();
    });

    if (state.activeScans.length === 0) {
        clearInterval(state.simulationInterval);
        state.simulationInterval = null;
    }
}

export function executeScan() {
    const barLength = 10;
    const liveLine = printLiveLine('', 'warn');
    
    const tempPct = Math.min(100, Math.max(0, Math.round(((gameState.scannerHeat - 20) / (125 - 20)) * 100)));
    const tempFilled = Math.round((tempPct / 100) * barLength);
    let tempBarStr = '';
    for (let i = 0; i < barLength; i++) {
        tempBarStr += i < tempFilled ? '█' : '░';
    }
    
    liveLine.update(`[ ] SCANNING: [░░░░░░░░░░] 0% | TEMP: [${tempBarStr}] ${Math.round(gameState.scannerHeat)}°C`);

    state.activeScans = state.activeScans || [];
    state.activeScans.push({
        id: Math.random(),
        pct: 0,
        liveLine: liveLine
    });

    // Ensure global simulation ticker is active
    if (!state.simulationInterval) {
        gameState.lastScanTime = Date.now();
        state.simulationInterval = setInterval(runSimulationTick, 1000);
    }
}

export function checkForScanAnomalies() {
    const scanOnlyIds = ['IMG-5', 'IMG-6', 'IMG-7', 'IMG-8'];
    const lockedScanOnly = scanOnlyIds.filter(id => !gameState.unlockedAnomalies.includes(id));
    
    if (lockedScanOnly.length > 0) {
        // 35% chance to discover one of the remaining scan-only anomalies
        if (Math.random() < 0.35) {
            const discoverId = lockedScanOnly[Math.floor(Math.random() * lockedScanOnly.length)];
            gameState.unlockedAnomalies.push(discoverId);
            printLine('\n----------------------------------------', 'ok');
            printLine('[!] DEEP SCAN SUCCESSFUL: SECURE FREQUENCY DETECTED', 'ok');
            printLine(`[NEW ANOMALY SPOTTED]: ${ANOMALIES[discoverId].title}`, 'ok');
            printLine(`Description: ${ANOMALIES[discoverId].desc}`, 'sys');
            printLine('[!] Check the [CAPTURED ANOMALIES] section at the bottom of the page to view the photograph.', 'sys');
            printLine('----------------------------------------\n', 'ok');
            saveProgress();
            updateStoryUI();
            return true;
        } else {
            printLine('[?] DEEP SCAN INTERFERENCE: Faint, encrypted spatial resonance detected, but could not lock on. Signals suggest hidden anomalies remain in nearby sectors. Try scanning again.', 'warn');
        }
    }
    return false;
}

export function processScanResults() {
    // Check if we can unlock scan-only anomalies
    checkForScanAnomalies();

    if (gameState.stage === 0) {
        // Stage 0 -> Unlock Anomaly 1
        if (!gameState.unlockedAnomalies.includes('IMG-1')) {
            gameState.unlockedAnomalies.push('IMG-1');
            printLine('[NEW ANOMALY SPOTTED]: Level 0 Lobby database archive recovered.', 'ok');
            printLine('[!] Check the [CAPTURED ANOMALIES] section at the bottom of the page to view the photograph.', 'sys');
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
            printLine('[!] Check the [CAPTURED ANOMALIES] section at the bottom of the page to view the photograph.', 'sys');
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
