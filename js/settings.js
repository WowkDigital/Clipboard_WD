'use strict';

const STORAGE_KEY = 'void_clipboard_settings';

const DEFAULT_SETTINGS = {
    fontSize: '15', // '13', '15', '18', '21'
    width: 'max-w-3xl', // 'max-w-xl', 'max-w-3xl', 'max-w-5xl', 'max-w-full'
    crt: 'on' // 'on', 'off'
};

let currentSettings = { ...DEFAULT_SETTINGS };

export function initSettings() {
    loadSettings();
    applySettings();
    setupEventListeners();
}

function loadSettings() {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            currentSettings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
        }
    } catch (e) {
        console.error('Failed to load settings', e);
    }
}

function saveSettings() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch (e) {
        console.error('Failed to save settings', e);
    }
}

function applySettings() {
    // 1. Apply font size
    document.documentElement.style.setProperty('--app-font-size', currentSettings.fontSize + 'px');

    // 2. Apply container width
    const mainEl = document.getElementById('main-container');
    if (mainEl) {
        mainEl.classList.remove('max-w-xl', 'max-w-3xl', 'max-w-5xl', 'max-w-full');
        mainEl.classList.add(currentSettings.width);
    }

    // 3. Apply CRT Overlay
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay) {
        crtOverlay.classList.toggle('hidden', currentSettings.crt === 'off');
    }

    updateActiveButtons();
}

function updateActiveButtons() {
    document.querySelectorAll('.btn-settings-opt').forEach(btn => {
        const setting = btn.dataset.setting;
        const val = btn.dataset.val;
        let isActive = false;

        if (setting === 'font-size' && currentSettings.fontSize === val) isActive = true;
        if (setting === 'width' && currentSettings.width === val) isActive = true;
        if (setting === 'crt' && currentSettings.crt === val) isActive = true;

        if (isActive) {
            btn.classList.add('tab-active');
            btn.style.color = 'var(--accent-primary)';
            btn.style.borderColor = 'var(--accent-primary)';
        } else {
            btn.classList.remove('tab-active');
            btn.style.color = '';
            btn.style.borderColor = '';
        }
    });
}

function setupEventListeners() {
    const btnSettings = document.getElementById('btn-settings');
    const modalSettings = document.getElementById('settings-modal');
    const btnCloseSettings = document.getElementById('btn-settings-close');

    if (btnSettings && modalSettings && btnCloseSettings) {
        btnSettings.addEventListener('click', () => {
            modalSettings.classList.remove('hidden');
        });

        const closeModal = () => {
            modalSettings.classList.add('hidden');
        };

        btnCloseSettings.addEventListener('click', closeModal);

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modalSettings.classList.contains('hidden')) {
                closeModal();
            }
        });
    }

    // Settings option clicks
    document.querySelectorAll('.btn-settings-opt').forEach(btn => {
        btn.addEventListener('click', () => {
            const setting = btn.dataset.setting;
            const val = btn.dataset.val;

            if (setting === 'font-size') {
                currentSettings.fontSize = val;
            } else if (setting === 'width') {
                currentSettings.width = val;
            } else if (setting === 'crt') {
                currentSettings.crt = val;
            }

            saveSettings();
            applySettings();
        });
    });
}
