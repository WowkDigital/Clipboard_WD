export const state = {
    roomId: '',
    cryptoKey: null,
    lastModified: '',
    pollTimer: null,
    textExpiresTimer: null,
    fileTimers: {},
    isSaving: false,
    countdowns: {},
    autoSaveTimer: null,
    autoSaveInterval: null,
    lastSyncedText: null,
    lastSyncedTime: 0,
    clientId: getOrCreateClientId(),
    clientIp: '',
    lastSyncIp: '',
    lastSyncClientId: '',
    onPollTextSuccess: null,
    isMining: false,
    abortMining: null,
};

function getOrCreateClientId() {
    let id = localStorage.getItem('void_clipboard_client_id');
    if (!id) {
        id = Array.from(crypto.getRandomValues(new Uint8Array(16)))
            .map(b => b.toString(16).padStart(2, '0')).join('');
        localStorage.setItem('void_clipboard_client_id', id);
    }
    return id;
}

