'use strict';

export const DOCUMENTS = {
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

export const ANOMALIES = {
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

export const SIDE_MISSIONS = {
    'SIDE-1': {
        id: 'SIDE-1',
        title: 'TIMELINE_SPLIT.sh',
        desc: 'LOG RECORD: SURVEYOR TEAM ALPHA - SECTOR 0.\nWe noticed that the yellow lobby doesn\'t just loop; it duplicates. We could hear footsteps matching ours exactly, but coming from behind a solid wall. It was as if someone else was walking in a parallel space.\n\nINSTRUCTIONS: You must establish an echo connection. Open this terminal address on a separate device or private browser window (a parallel reality) and click "ENCRYPT & SYNC" to match the temporal signatures. (The terminal should auto-detect this sync. If it doesn\'t, run the "check" command in this terminal).'
    },
    'SIDE-2': {
        id: 'SIDE-2',
        title: 'SIGNAL_OVERRIDE.bin',
        desc: 'LOG RECORD: RECOVERY UNIT - SECTOR 37.\nThe hum of the fluorescent lights (432 Hz) has a strange calming effect, but it is dangerous. It slowly wipes your memory, replacing thoughts with static. The team set up an override key to snap lost members back.\n\nINSTRUCTIONS: From the secondary parallel node (your second device or private window), you must force-inject the memory anchor command. Type and sync exactly the word "OVERRIDE" in the text editor to override the static. (The terminal should auto-detect this sync. If it doesn\'t, run the "check" command in this terminal).'
    },
    'SIDE-3': {
        id: 'SIDE-3',
        title: 'EXTERNAL_BEACON.net',
        desc: 'LOG RECORD: ESCAPE VECTOR CALIBRATION.\nThe boundary of the Backrooms is extremely thick. A local node cannot pierce the drywall alone. We need a beacon anchored outside the local subnet to pull us through.\n\nINSTRUCTIONS: Establish a connection to this terminal from a completely separate physical network node (different IP address, e.g. using a phone on mobile data, or a remote operator). Sync any data from that node to calibrate the external beacon. (The terminal should auto-detect this sync. If it doesn\'t, run the "check" command in this terminal).'
    },
    'SIDE-4': {
        id: 'SIDE-4',
        title: 'NULL_VOID_SECTOR.bin',
        desc: 'LOG RECORD: CRYPTOGRAPHIC ANOMALY.\nWe found a door marked with three white zeroes. Inside, the fluorescent lights were silent and the walls were pure black static. It was a Null Void—a spatial vacuum. Any data stored here is immune to temporal decay.\n\nINSTRUCTIONS: Manipulate the URL hash in your address bar so the Room ID (the first 8 characters following the "#" sign) starts with exactly "000" (e.g., "#000fd..."). Press Enter to reload, then check the terminal to sink the gate into the Null Void.'
    }
};

