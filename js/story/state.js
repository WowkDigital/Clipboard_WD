'use strict';

export const gameState = {
    stage: 0, // 0: Start, 1: Unlocked DOC-2, 2: Scanned 432Hz -> DOC-3/IMG-2, 3: Coordinates Unlocked -> DOC-4/IMG-3, 4: NOCLIP Synced -> DOC-5/IMG-4
    unlockedDocs: ['DOC-1'],
    unlockedAnomalies: []
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
    saveProgress();
}
