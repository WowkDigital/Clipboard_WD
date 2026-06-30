'use strict';

export const gameState = {
    stage: 0, // 0: Start, 1: Unlocked DOC-2, 2: Scanned 432Hz -> DOC-3/IMG-2, 3: Coordinates Unlocked -> DOC-4/IMG-3, 4: NOCLIP Synced -> DOC-5/IMG-4
    unlockedDocs: ['DOC-1'],
    unlockedAnomalies: [],
    completedSideMissions: [],
    seenDocs: ['DOC-1'],
    seenAnomalies: [],
    seenMissions: [],
    scannerHeat: 20,
    overheatedUntil: 0,
    lastScanTime: 0,
    collapsedSections: {
        docs: false,
        missions: false,
        gallery: false,
        hardware: false
    }
};

// Load progress from localStorage
export function loadProgress() {
    const saved = localStorage.getItem('void_clipboard_story');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.stage = data.stage ?? 0;
            gameState.unlockedDocs = data.unlockedDocs ?? ['DOC-1'];
            gameState.unlockedAnomalies = data.unlockedAnomalies ?? [];
            gameState.completedSideMissions = data.completedSideMissions ?? [];
            gameState.seenDocs = data.seenDocs ?? ['DOC-1'];
            gameState.seenAnomalies = data.seenAnomalies ?? [];
            gameState.seenMissions = data.seenMissions ?? [];
            gameState.scannerHeat = data.scannerHeat ?? 20;
            gameState.overheatedUntil = data.overheatedUntil ?? 0;
            gameState.lastScanTime = data.lastScanTime ?? 0;
            gameState.heatBypassTime = data.heatBypassTime ?? 0;
            gameState.themeBypassCalibrated = data.themeBypassCalibrated ?? false;
            gameState.collapsedSections = data.collapsedSections ?? {
                docs: false,
                missions: false,
                gallery: false,
                hardware: false
            };
            // Fallback for hardware collapsed state
            if (gameState.collapsedSections.hardware === undefined) {
                gameState.collapsedSections.hardware = false;
            }
        } catch (e) {
            console.error('Failed to parse story progress:', e);
        }
    }
}

// Save progress to localStorage
export function saveProgress() {
    localStorage.setItem('void_clipboard_story', JSON.stringify(gameState));
}

// Reset progress
export function resetProgress() {
    gameState.stage = 0;
    gameState.unlockedDocs = ['DOC-1'];
    gameState.unlockedAnomalies = [];
    gameState.completedSideMissions = [];
    gameState.seenDocs = ['DOC-1'];
    gameState.seenAnomalies = [];
    gameState.seenMissions = [];
    gameState.scannerHeat = 20;
    gameState.overheatedUntil = 0;
    gameState.lastScanTime = 0;
    gameState.heatBypassTime = 0;
    gameState.themeBypassCalibrated = false;
    gameState.collapsedSections = {
        docs: false,
        missions: false,
        gallery: false,
        hardware: false
    };
    saveProgress();
}

