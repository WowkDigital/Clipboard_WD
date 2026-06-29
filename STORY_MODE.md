# Subsystem Documentation: Story Mode

The Story Mode in **VOID://CLIPBOARD** is an interactive text-adventure/ARG (Alternate Reality Game) integrated with the clipboard's client-side E2EE properties (detecting live text space inputs and short-lived TTL session states).

Files associated with the Story Mode:
1. **[js/story.js](file:///c:/Users/wowkd/Desktop/Antigraviti%20Condes/Clipboard_WD/js/story.js)**: Contains game databases, state machine logic, terminal command parser, and local progress storage hooks.
2. **[index.php](file:///c:/Users/wowkd/Desktop/Antigraviti%20Condes/Clipboard_WD/index.php)**: HTML structure for the terminal dashboard layout, log lists, anomalies grids, and retro modal viewer.
3. **[style.css](file:///c:/Users/wowkd/Desktop/Antigraviti%20Condes/Clipboard_WD/style.css)**: Layout styling, CRT monitor flicker overlay, list hovers, and retro modal containers.

---

## 1. Database Architecture

The game assets and logs are stored inside static objects in `js/story.js`:

### Documents (`DOCUMENTS`)
Each entry represents an expedition log:
```javascript
const DOCUMENTS = {
    'DOCUMENT_ID': {
        id: 'DOCUMENT_ID', // e.g. 'DOC-6'
        title: 'FILENAME.log',
        content: [
            'Line 1 of log text...',
            'Line 2 of log text...',
            // Each string in the array prints as a separate line in the terminal
        ]
    }
};
```

### Anomalies (`ANOMALIES`)
Entries representing captured photographs in the gallery:
```javascript
const ANOMALIES = {
    'ANOMALY_ID': {
        id: 'ANOMALY_ID', // e.g. 'IMG-5'
        title: 'Level / Anomaly Title',
        src: 'assets/story/filename.png',
        desc: 'Classified report details shown under the photograph when zoomed in the modal.'
    }
};
```

---

## 2. State & Persistence (`gameState`)

The progression state is saved locally under the `void_clipboard_story` key in `localStorage`:
* `stage`: A number indicating the active progression phase (0 to 5) to control puzzle locks.
* `unlockedDocs`: Array of document IDs currently decrypted.
* `unlockedAnomalies`: Array of anomaly image IDs currently in the gallery.

### State Helpers:
* `loadProgress()`: Reads state from `localStorage`.
* `saveProgress()`: Writes state to `localStorage`.
* `resetProgress()`: Restores the starting variables (called via `reset` command).

---

## 3. Creating New Game Stages (Adding Logs & Anomalies)

To add a new puzzle step, follow this checklist:

### Step 1: Register Logs and Images
Add entries to the `DOCUMENTS` and `ANOMALIES` structures in `js/story.js`.

### Step 2: Define the Passcode Lock
If the document requires an unlock code submitted via `unlock <passcode>`, add a verification block inside `executeUnlock(code)` in `js/story.js`:
```javascript
function executeUnlock(code) {
    const sanitized = code.trim().toLowerCase();

    if (sanitized === 'your_passcode') {
        if (gameState.stage === 4) {
            gameState.stage = 5;
            gameState.unlockedDocs.push('DOC-6');
            printLine('[+] DECRYPTION SUCCESSFUL: Archives unlocked.', 'ok');
            saveProgress();
            updateStoryUI();
        }
    }
    // ...
}
```

### Step 3: Define Scan Triggers
If a stage requires running a `scan` command on a specific stage, append the trigger logic inside `handleCommand` under the `scan` case or inside `processScanResults()`:
```javascript
case 'scan':
    if (gameState.stage === 5) {
        printLine('[+] Scanning tunnels at frequency 888 Hz...', 'warn');
        gameState.stage = 6;
        gameState.unlockedAnomalies.push('IMG-5');
        printLine('[NEW ANOMALY SPOTTED]: Cave system image recovered.', 'ok');
        saveProgress();
        updateStoryUI();
    } else {
        executeScan();
    }
    break;
```

---

## 4. Registering New Commands

All commands are validated inside `handleCommand(cmdLine)` in `js/story.js`.

To add a new command:
1. Append the description line under `case 'help'` so the user is aware of the new instruction.
2. Insert a new `case` block inside the `switch(cmd)` structure:
```javascript
case 'hack':
    printLine('[!] INITIATING SECURE OVERWRITE...', 'warn');
    setTimeout(() => {
        printLine('[+] Temporary high-level console bypass granted.', 'ok');
    }, 500);
    break;
```

### Terminal Output Colors:
Use the secondary parameter in `printLine(text, type)` to color-code terminal logs:
* `''` (Default) -> Light Blue (`#38bdf8`) - normal output text.
* `'sys'` -> Purple (`#a855f7`) - system headers and dividers.
* `'ok'` -> Green (`#10b981`) - validation pass / unlock success.
* `'warn'` -> Gold/Amber (`#eab308`) - in-progress actions and loading flags.
* `'err'` -> Red (`#ef4444`) - authentication fails, errors.

---

## 5. Hint Subsystem (`hint`)

The `hint` command parses the current `gameState.stage` value and prints stage-specific English clues. 

When creating a new stage, make sure to add an `if (gameState.stage === X)` block inside the `hint` case, so players can always retrieve context clues if they get stuck.
