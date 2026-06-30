'use strict';

const STORAGE_KEY = 'void_clipboard_settings';

const DEFAULT_SETTINGS = {
    fontSize: '15', // '13', '15', '18', '21'
    fontFamily: 'modern', // 'modern', 'vt323'
    width: 'max-w-3xl', // 'max-w-xl', 'max-w-3xl', 'max-w-5xl', 'max-w-full'
    crt: 'on', // 'on', 'off'
    curvature: 'off', // 'on', 'off'
    glitch: 'off' // 'on', 'off'
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

    // 2. Apply font family override
    document.body.classList.toggle('font-vt323', currentSettings.fontFamily === 'vt323');

    // 3. Apply container width
    const mainEl = document.getElementById('main-container');
    if (mainEl) {
        mainEl.classList.remove('max-w-xl', 'max-w-3xl', 'max-w-5xl', 'max-w-full');
        mainEl.classList.add(currentSettings.width);
    }

    // 4. Apply CRT Overlay
    const crtOverlay = document.getElementById('crt-overlay');
    if (crtOverlay) {
        crtOverlay.classList.toggle('hidden', currentSettings.crt === 'off');
    }

    // 5. Apply Curvature & Glitch
    document.body.classList.toggle('crt-curved', currentSettings.curvature === 'on');
    document.body.classList.toggle('crt-glitch', currentSettings.glitch === 'on');

    updateActiveButtons();
}

function updateActiveButtons() {
    document.querySelectorAll('.btn-settings-opt').forEach(btn => {
        const setting = btn.dataset.setting;
        const val = btn.dataset.val;
        let isActive = false;

        if (setting === 'font-size' && currentSettings.fontSize === val) isActive = true;
        if (setting === 'font-family' && currentSettings.fontFamily === val) isActive = true;
        if (setting === 'width' && currentSettings.width === val) isActive = true;
        if (setting === 'crt' && currentSettings.crt === val) isActive = true;
        if (setting === 'curvature' && currentSettings.curvature === val) isActive = true;
        if (setting === 'glitch' && currentSettings.glitch === val) isActive = true;

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
    const sidebar = document.getElementById('settings-sidebar');
    const backdrop = document.getElementById('settings-backdrop');
    const btnCloseSettings = document.getElementById('btn-settings-close');

    if (btnSettings && sidebar && backdrop && btnCloseSettings) {
        const openModal = () => {
            sidebar.classList.remove('hidden');
            backdrop.classList.remove('hidden');
            // Force reflow
            void sidebar.offsetWidth;
            sidebar.classList.add('open');
        };

        const closeModal = () => {
            sidebar.classList.remove('open');
            backdrop.classList.add('hidden');
            
            const onTransitionEnd = () => {
                if (!sidebar.classList.contains('open')) {
                    sidebar.classList.add('hidden');
                }
                sidebar.removeEventListener('transitionend', onTransitionEnd);
            };
            sidebar.addEventListener('transitionend', onTransitionEnd);
        };

        btnSettings.addEventListener('click', openModal);
        btnCloseSettings.addEventListener('click', closeModal);
        backdrop.addEventListener('click', closeModal);

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && sidebar.classList.contains('open')) {
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
            } else if (setting === 'font-family') {
                currentSettings.fontFamily = val;
            } else if (setting === 'width') {
                currentSettings.width = val;
            } else if (setting === 'crt') {
                currentSettings.crt = val;
            } else if (setting === 'curvature') {
                currentSettings.curvature = val;
            } else if (setting === 'glitch') {
                currentSettings.glitch = val;
            }

            saveSettings();
            applySettings();
        });
    });
}
