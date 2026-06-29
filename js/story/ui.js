'use strict';

import { DOCUMENTS, ANOMALIES, SIDE_MISSIONS } from './db.js';
import { gameState, saveProgress } from './state.js';
import { printLine } from './terminal.js';

// ── UI Rendering ─────────────────────────────────────────────
export function updateStoryUI() {
    updateCollapsibleStates();

    renderDocuments();
    renderGallery();
    renderSideMissions();
    
    // Update counters
    const docsCount = document.getElementById('docs-count');
    if (docsCount) {
        docsCount.textContent = `${gameState.unlockedDocs.length}/${Object.keys(DOCUMENTS).length}`;
    }
    
    const galleryCount = document.getElementById('gallery-count');
    if (galleryCount) {
        galleryCount.textContent = `${gameState.unlockedAnomalies.length}/${Object.keys(ANOMALIES).length}`;
    }

    const sideCount = document.getElementById('side-missions-count');
    if (sideCount) {
        sideCount.textContent = `${gameState.completedSideMissions.length}/${Object.keys(SIDE_MISSIONS).length}`;
    }

    // Update new content badges
    const docsNew = document.getElementById('story-docs-new');
    if (docsNew) {
        const hasNewDocs = gameState.unlockedDocs.some(id => !gameState.seenDocs.includes(id));
        docsNew.classList.toggle('hidden', !hasNewDocs);
    }

    const missionsNew = document.getElementById('story-missions-new');
    if (missionsNew) {
        const hasNewMissions = gameState.completedSideMissions.some(id => !gameState.seenMissions.includes(id));
        missionsNew.classList.toggle('hidden', !hasNewMissions);
    }

    const galleryNew = document.getElementById('story-gallery-new');
    if (galleryNew) {
        const hasNewAnomalies = gameState.unlockedAnomalies.some(id => !gameState.seenAnomalies.includes(id));
        galleryNew.classList.toggle('hidden', !hasNewAnomalies);
    }
}

export function updateCollapsibleStates() {
    const docsList = document.getElementById('story-docs-list');
    const docsToggle = document.getElementById('story-docs-toggle');
    if (docsList && docsToggle) {
        const isCollapsed = gameState.collapsedSections.docs;
        docsList.classList.toggle('hidden', isCollapsed);
        docsToggle.textContent = isCollapsed ? '[+]' : '[-]';
    }

    const missionsList = document.getElementById('story-side-missions-list');
    const missionsToggle = document.getElementById('story-missions-toggle');
    if (missionsList && missionsToggle) {
        const isCollapsed = gameState.collapsedSections.missions;
        missionsList.classList.toggle('hidden', isCollapsed);
        missionsToggle.textContent = isCollapsed ? '[+]' : '[-]';
    }

    const galleryGrid = document.getElementById('story-gallery-grid');
    const galleryToggle = document.getElementById('story-gallery-toggle');
    if (galleryGrid && galleryToggle) {
        const isCollapsed = gameState.collapsedSections.gallery;
        galleryGrid.classList.toggle('hidden', isCollapsed);
        galleryToggle.textContent = isCollapsed ? '[+]' : '[-]';
    }
}

export function initCollapsible() {
    const docsHeader = document.getElementById('story-docs-header');
    if (docsHeader) {
        docsHeader.addEventListener('click', () => {
            gameState.collapsedSections.docs = !gameState.collapsedSections.docs;
            // Mark all unlocked docs as seen when interacting with header
            gameState.unlockedDocs.forEach(id => {
                if (!gameState.seenDocs.includes(id)) gameState.seenDocs.push(id);
            });
            saveProgress();
            updateStoryUI();
        });
    }

    const missionsHeader = document.getElementById('story-missions-header');
    if (missionsHeader) {
        missionsHeader.addEventListener('click', () => {
            gameState.collapsedSections.missions = !gameState.collapsedSections.missions;
            // Mark all completed missions as seen when interacting with header
            gameState.completedSideMissions.forEach(id => {
                if (!gameState.seenMissions.includes(id)) gameState.seenMissions.push(id);
            });
            saveProgress();
            updateStoryUI();
        });
    }

    const galleryHeader = document.getElementById('story-gallery-header');
    if (galleryHeader) {
        galleryHeader.addEventListener('click', () => {
            gameState.collapsedSections.gallery = !gameState.collapsedSections.gallery;
            // Mark all unlocked anomalies as seen when interacting with header
            gameState.unlockedAnomalies.forEach(id => {
                if (!gameState.seenAnomalies.includes(id)) gameState.seenAnomalies.push(id);
            });
            saveProgress();
            updateStoryUI();
        });
    }
}

export function renderSideMissions() {
    const list = document.getElementById('story-side-missions-list');
    if (!list) return;
    list.innerHTML = '';

    const sideIds = Object.keys(SIDE_MISSIONS);

    sideIds.forEach((id, idx) => {
        const mission = SIDE_MISSIONS[id];
        const isCompleted = gameState.completedSideMissions.includes(id);
        const isUnlocked = idx === 0 || gameState.completedSideMissions.includes(sideIds[idx - 1]);

        const el = document.createElement('div');
        el.className = `doc-item ${isCompleted ? '' : isUnlocked ? 'active' : 'locked'}`;

        const titleSpan = document.createElement('span');
        titleSpan.textContent = isUnlocked ? mission.title : 'OPERATION_[LOCKED].bin';

        const statusSpan = document.createElement('span');
        statusSpan.className = 'text-[9px] px-1 rounded border';
        if (isCompleted) {
            statusSpan.textContent = 'COMPLETED';
            statusSpan.style.borderColor = '#10b981';
            statusSpan.style.color = '#10b981';
        } else if (isUnlocked) {
            statusSpan.textContent = 'ACTIVE';
            statusSpan.style.borderColor = '#eab308';
            statusSpan.style.color = '#eab308';
        } else {
            statusSpan.textContent = 'LOCKED';
            statusSpan.style.borderColor = 'var(--glass-border)';
            statusSpan.style.color = 'var(--text-muted)';
        }

        el.appendChild(titleSpan);
        el.appendChild(statusSpan);

        el.onclick = () => {
            if (!isUnlocked) {
                const terminal = document.getElementById('story-terminal-output');
                if (terminal) {
                    terminal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                printLine(`\n[-] OPERATION LOCKED`, 'err');
                printLine(`You must complete the previous parallel operations before unlocking this channel.`, 'warn');
                return;
            }

            if (isCompleted && !gameState.seenMissions.includes(id)) {
                gameState.seenMissions.push(id);
                saveProgress();
                updateStoryUI();
            }
            
            // Scroll to terminal so user knows content appeared there
            const terminal = document.getElementById('story-terminal-output');
            if (terminal) {
                terminal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            printLine(`\n--- MISSION DETAILS: ${mission.title} ---`, 'sys');
            printLine(mission.desc, '');
            printLine(`Status: ${isCompleted ? 'COMPLETED' : 'ACTIVE'}`, isCompleted ? 'ok' : 'warn');
            printLine('----------------------------------------\n', 'sys');
        };

        list.appendChild(el);
    });
}


export function renderDocuments() {
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
            el.onclick = () => {
                // Scroll to terminal so user knows content appeared there
                const terminal = document.getElementById('story-terminal-output');
                if (terminal) {
                    terminal.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                }
                readDocumentInTerminal(id);
            };
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

export function renderGallery() {
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
export function readDocumentInTerminal(id) {
    const doc = DOCUMENTS[id];
    if (!doc) return;
    
    // Mark as seen
    if (!gameState.seenDocs.includes(id)) {
        gameState.seenDocs.push(id);
        saveProgress();
        updateStoryUI();
    }
    
    printLine(`\n--- READING FILE: ${doc.title} ---`, 'sys');
    doc.content.forEach(line => {
        printLine(line, '');
    });
    printLine('----------------------------------------\n', 'sys');
}

// ── Image Modal ──────────────────────────────────────────────
export function openImageModal(id) {
    const item = ANOMALIES[id];
    if (!item) return;

    // Mark as seen
    if (!gameState.seenAnomalies.includes(id)) {
        gameState.seenAnomalies.push(id);
        saveProgress();
        updateStoryUI();
    }

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
