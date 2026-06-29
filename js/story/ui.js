'use strict';

import { DOCUMENTS, ANOMALIES, SIDE_MISSIONS } from './db.js';
import { gameState } from './state.js';
import { printLine } from './terminal.js';

// ── UI Rendering ─────────────────────────────────────────────
export function updateStoryUI() {
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
}

export function renderSideMissions() {
    const list = document.getElementById('story-side-missions-list');
    if (!list) return;
    list.innerHTML = '';

    Object.keys(SIDE_MISSIONS).forEach(id => {
        const mission = SIDE_MISSIONS[id];
        const isCompleted = gameState.completedSideMissions.includes(id);

        const el = document.createElement('div');
        el.className = `doc-item ${isCompleted ? '' : 'active'}`;

        const titleSpan = document.createElement('span');
        titleSpan.textContent = mission.title;

        const statusSpan = document.createElement('span');
        statusSpan.className = 'text-[9px] px-1 rounded border';
        if (isCompleted) {
            statusSpan.textContent = 'COMPLETED';
            statusSpan.style.borderColor = '#10b981';
            statusSpan.style.color = '#10b981';
        } else {
            statusSpan.textContent = 'ACTIVE';
            statusSpan.style.borderColor = '#eab308';
            statusSpan.style.color = '#eab308';
        }

        el.appendChild(titleSpan);
        el.appendChild(statusSpan);

        el.onclick = () => {
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
