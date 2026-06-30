'use strict';

export const DOCUMENTS = {
    'DOC-1': {
        id: 'DOC-1',
        title: 'EXPEDITION_DEPARTURE.log',
        content: [
            '[LOG ENTRY: 12-14-1981 | SURVEYOR TEAM ALPHA | LEVEL 0: THE LOBBY]',
            'We crossed the threshold. What was supposed to be a routine inspection of a commercial basement has warped into an endless labyrinth of moist carpet, decaying yellow wallpaper, and the oppressive, nonstop hum of fluorescent lights. The heavy fire door we entered through has vanished, replaced by a seamless drywall partition.',
            'We are marking the walls, but the geometry seems to shift when we aren\'t looking. To secure our findings from unauthorized entities or spatial corruption, we have encrypted our terminal archives.',
            '',
            '[TECHNICAL DEVIATION PROTOCOL]:',
            'To access our primary surveyor database, you must input the year of our departure into the gateway terminal. Execute: unlock <four-digit-departure-year>'
        ]
    },
    'DOC-2': {
        id: 'DOC-2',
        title: 'LOBBY_OBSERVATIONS.log',
        content: [
            '[LOG ENTRY: 12-16-1981 | SURVEYOR TEAM ALPHA | LEVEL 0: THE LOBBY]',
            'Two days of wandering. The hum of the ceiling tubes is maddening, but we\'ve noticed a pattern. The electromagnetic frequency fluctuates near spots where the physical walls feel "soft" or unstable. We calibrated our equipment and measured the stable resonance at exactly 432 Hz.',
            'Tuning our terminal gateway to this frequency might allow us to map nearby spatial tears and find an exit from this yellow monotony.',
            '',
            '[TECHNICAL DEVIATION PROTOCOL]:',
            'You must execute a diagnostic scan to calibrate the receiver\'s signal handler. Type: scan'
        ]
    },
    'DOC-3': {
        id: 'DOC-3',
        title: 'UNDERGROUND_WATERWAYS.log',
        content: [
            '[LOG ENTRY: 12-19-1981 | SURVEYOR TEAM ALPHA | LEVEL 37: THE POOLROOMS]',
            'A sudden transition. The damp carpet is gone, replaced by pristine white tile floors and lukewarm, chlorine-scented water stretching as far as the eye can see. The ceiling is low, and the sound of dripping water echoes off the walls. It feels peaceful, yet deeply unsettling.',
            'We have located a heavy steel bulkhead door that appears to lead to an open courtyard, but it is hydraulically locked. A plaque on the console reads: "VALIDATE COORDINATES: AREA 188. SUB-GRID COORDS: LAT 37.188, LON -118.404".',
            '',
            '[TECHNICAL DEVIATION PROTOCOL]:',
            'To override the bulkhead\'s hydraulic lock, validate the gateway by entering the target latitude coordinate. Execute: unlock 37188 (or 37.188)'
        ]
    },
    'DOC-4': {
        id: 'DOC-4',
        title: 'THE_COURTYARD_GATE.log',
        content: [
            '[LOG ENTRY: 12-21-1981 | SURVEYOR TEAM ALPHA | LEVEL 188: THE COURTYARD]',
            'The bulkhead opened. We are standing in a massive, open-air courtyard surrounded by towering walls of identical, dark windows. Above us is not a sky, but a flat, static-grey void. The spatial tension here is extreme. We believe we can trigger a "no-clip" sequence to slip back into reality, but it requires aligning the local gate data transfer to a high-frequency, short-lived clipboard space.',
            'If the synchronization is successful, we can tear open the exit vector.',
            '',
            '[TECHNICAL DEVIATION PROTOCOL]:',
            '1. Navigate to the primary TEXT editor tab of this gateway interface.',
            '2. Input the exact spatial bypass command: NOCLIP',
            '3. Adjust the TTL (Time-To-Live) on the HUD bar to exactly 15m (900 seconds) to match the spatial instability window.',
            '4. Click \'ENCRYPT & SYNC\' to broadcast the signature.',
            '5. Return to this terminal and execute: scan (to initialize the exit sequence)'
        ]
    },
    'DOC-5': {
        id: 'DOC-5',
        title: 'RETURN_TO_REALITY.log',
        content: [
            '[LOG ENTRY: SUCCESS | ESCAPE VECTOR CONFIRMED]',
            'The gateway frequency matched perfectly. The walls of the courtyard fractured into blinding white light, collapsing the liminal distortion. Surveyor Team Alpha has successfully transitioned back to baseline reality.',
            'The archives are fully decrypted. The way out is clear.',
            '',
            '[TECHNICAL DEVIATION PROTOCOL]:',
            'The escape route is stable. To clear the terminal state and prepare for future anomalies, type: reset'
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
        desc: 'LOG RECORD: LEVEL 0 (PARALLEL ECHOES).\nWe noticed that the yellow lobby doesn\'t just loop; it duplicates. We can hear footsteps matching ours exactly, but coming from behind a solid wall. It is as if someone else is walking in a parallel space.\n\n[TECHNICAL DEVIATION PROTOCOL]: You must establish a temporal handshake to bridge the parallel realities. Open this room link in a separate private browser tab or device (a parallel universe), and click "ENCRYPT & SYNC" to match the temporal signatures. Run "check" in the primary terminal to verify the handshake.'
    },
    'SIDE-2': {
        id: 'SIDE-2',
        title: 'SIGNAL_OVERRIDE.bin',
        desc: 'LOG RECORD: LEVEL 37 (MEMORY LOSS).\nThe chlorine vapor and the humming of the lights are eroding our short-term memories. We need to inject an active mental anchor to clear the cognitive static.\n\n[TECHNICAL DEVIATION PROTOCOL]: Use your secondary parallel node (the other tab or device) to send an emergency override code. Type and sync the word "OVERRIDE" in the text editor to clear the cognitive fog, then execute "check" on the primary terminal.'
    },
    'SIDE-3': {
        id: 'SIDE-3',
        title: 'EXTERNAL_BEACON.net',
        desc: 'LOG RECORD: BOUNDARY ANOMALY.\nThe yellow wallpaper layers are too thick. A local node cannot punch through the drywall alone; we need a beacon anchored outside the local network subnet to pull us through.\n\n[TECHNICAL DEVIATION PROTOCOL]: Connect to this gateway room from an external network (e.g. using a mobile phone on cellular data, or a remote peer) and sync any message to calibrate the external tracking beacon. Run "check" to confirm.'
    },
    'SIDE-4': {
        id: 'SIDE-4',
        title: 'NULL_VOID_SECTOR.bin',
        desc: 'LOG RECORD: LEVEL 0 (NULL ROOM).\nWe found a room where the lights are completely dark and the walls are filled with silent black noise. It is a cryptographic vacuum. Any data stored here is immune to temporal decay.\n\n[TECHNICAL DEVIATION PROTOCOL]: Re-route the gateway connection to the Null Void sector by modifying the room ID in the URL. Change the first three characters of the room ID hash (right after the "#" character) to "000" (e.g., "#000..."), reload, and run "check" to sink the data.'
    },
    'SIDE-5': {
        id: 'SIDE-5',
        title: 'HASH_COLLISION.bin',
        desc: 'LOG RECORD: GATEWAY OVERLOAD PROTOCOL.\nThe exit barrier requires a highly specific mathematical sequence to trigger a structural collapse in the liminal walls.\n\n[TECHNICAL DEVIATION PROTOCOL]: Run the proof-of-work miner by typing "mine" in the terminal (or clicking the green [ MINE ] button) to compute a custom cryptographic hash key that starts with five zeroes ("00000"). Once calculated, append it to your URL hash to overload the gate.'
    }
};

