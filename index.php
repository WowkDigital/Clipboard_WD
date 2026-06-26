<?php
// ============================================================
// E2EE Private Clipboard — index.php
// Zero-Knowledge Architecture: server never sees plaintext,
// filenames, or encryption keys. All secrets live in URL #hash.
// ============================================================

require_once __DIR__ . '/api.php';
?>
<!DOCTYPE html>
<html lang="en" class="h-full">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="robots" content="noindex, nofollow">
    <title>VOID://CLIPBOARD</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@300;400;500;600&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>

<body class="h-full min-h-screen flex flex-col">

    <!-- Ambient retro overlays -->
    <div id="crt-overlay"></div>
    <div id="scene-vignette"></div>
    <div id="scene-noise"></div>

    <!-- Liminal OS inspired HUD bar -->
    <header id="hud-bar" class="flex flex-wrap items-center justify-between gap-y-3 gap-x-2 py-3 px-4">
        <div class="hud-left flex flex-wrap items-center gap-2">
            <span class="hud-logo font-mono text-sm font-bold tracking-wider mr-2">VOID://<span class="hud-logo-dim">CLIPBOARD</span></span>
            
            <span class="hud-badge">
                <span id="status-dot" class="pulse inline-block w-2.5 h-2.5 rounded-full"
                    style="background:var(--text-muted)"></span>
                <span id="status-text" class="mono text-xs" style="color:var(--text-secondary)">OFFLINE</span>
            </span>
            
            <span class="hud-badge flex items-center">
                <span class="mono text-xs" style="color:var(--text-muted)">SESSION ID:</span>
                <span id="room-display" class="mono text-xs ml-1" style="color:var(--accent-primary); font-weight:bold;">—</span>
            </span>

            <span class="flex items-center gap-1.5 px-2" style="font-family:var(--font-mono);">
                <span class="mono text-xs" style="color:var(--text-muted)">TTL:</span>
                <select id="select-ttl" class="mono text-xs bg-transparent text-main border-none p-0 cursor-pointer outline-none font-bold" style="color:var(--accent-primary); width:auto;">
                    <option value="900" style="background:#0a0a0a; color:#f0f0f0;">15m</option>
                    <option value="1800" style="background:#0a0a0a; color:#f0f0f0;">30m</option>
                    <option value="3600" selected style="background:#0a0a0a; color:#f0f0f0;">1h</option>
                    <option value="14400" style="background:#0a0a0a; color:#f0f0f0;">4h</option>
                    <option value="43200" style="background:#0a0a0a; color:#f0f0f0;">12h</option>
                    <option value="86400" style="background:#0a0a0a; color:#f0f0f0;">24h</option>
                    <option value="172800" style="background:#0a0a0a; color:#f0f0f0;">48h</option>
                </select>
            </span>

            <span class="flex items-center px-2" style="font-family:var(--font-mono);">
                <span id="session-valid-until" class="mono text-xs" style="color:var(--text-secondary)">valid until: —</span>
            </span>

            <button id="btn-reset-ttl" class="hud-badge hud-badge-btn">EXTEND TTL</button>
        </div>
        
        <div class="hud-right flex flex-wrap items-center gap-2">
            <button class="hud-badge hud-badge-btn" id="btn-new-room">NEW SESSION</button>
            <button class="hud-badge hud-badge-btn" id="btn-copy-url">COPY LINK</button>
        </div>
    </header>

    <!-- Main Container -->
    <main class="flex-1 max-w-3xl w-full mx-auto px-4 py-6 flex flex-col gap-5 relative z-10">

        <!-- Main Glass Panel -->
        <div class="glass-panel p-5 flex flex-col gap-4">

            <!-- Nav Tabs & Actions -->
            <div class="flex justify-between items-center border-b mb-1 pb-1" style="border-color:var(--glass-border)">
                <div class="flex gap-0">
                    <button class="tab-active btn-tab" data-tab="text">TEXT</button>
                    <button class="btn-tab" data-tab="files">FILES</button>
                </div>
                <div id="text-actions" class="flex gap-2">
                    <button class="btn" id="btn-save" style="padding: 3px 10px !important; font-size: 10px !important; min-height: 1.8rem !important;">ENCRYPT &amp; SYNC</button>
                    <button class="btn btn-red" id="btn-clear" style="padding: 3px 10px !important; font-size: 10px !important; min-height: 1.8rem !important;">CLEAR</button>
                </div>
            </div>

            <!-- Tab content: TEXT -->
            <div id="tab-text" class="flex flex-col gap-4">
                <div class="relative flex flex-col">
                    <textarea id="editor" rows="14"
                        placeholder="Paste your text here to begin secure synchronization... // HOW IT WORKS:&#10;// 1. End-to-end encryption (AES-GCM) happens in the browser before sending data to the server.&#10;// 2. The decryption key remains in the URL (#hash) and is never transmitted to the server.&#10;// 3. Text data automatically expires according to the set TTL (default 1 hour, up to 48 hours).&#10;// 4. Uploaded files are securely encrypted, follow the session TTL, can be downloaded multiple times, or manually deleted."
                        class="w-full p-4"></textarea>
                    <div class="absolute bottom-3 right-4 flex items-center gap-3 pointer-events-none">
                        <span id="text-expires" class="mono text-xs countdown" style="color:var(--text-muted)"></span>
                        <span id="char-count" class="mono text-xs" style="color:var(--text-muted)">0</span>
                    </div>
                </div>
                <div class="flex items-center justify-end">
                    <div id="sync-indicator" class="mono text-xs" style="color:var(--text-muted)">—</div>
                </div>
            </div>

            <!-- Tab content: FILES -->
            <div id="tab-files" class="flex flex-col gap-4 hidden">

                <div id="drop-zone"
                    class="flex flex-col items-center justify-center gap-2 p-10 cursor-pointer select-none relative overflow-hidden"
                    style="min-height:160px">
                    <div class="mono text-sm" style="color:var(--text-dim)">DROP FILE HERE</div>
                    <div class="mono text-xs" style="color:var(--text-muted)">or click to browse · max 20 MB</div>
                    <div class="mono text-xs" style="color:var(--text-muted)">encrypted client-side · multi-download · 30 min TTL</div>
                    <input type="file" id="file-input" class="absolute inset-0 opacity-0 cursor-pointer">
                </div>

                <div id="progress-wrap" class="hidden">
                    <div class="w-full overflow-hidden">
                        <div id="progress-bar" class="h-full" style="width:0%"></div>
                    </div>
                    <div id="progress-label" class="mono text-xs mt-1" style="color:var(--text-dim)">ENCRYPTING...</div>
                </div>

                <div id="file-list" class="flex flex-col gap-2"></div>
                <div id="files-empty" class="mono text-xs text-center py-8" style="color:var(--text-muted)">// no files in this room</div>

            </div>

        </div>

        <!-- System Log Container -->
        <div class="glass-panel p-4 flex flex-col gap-2">
            <div class="mono text-xs flex items-center justify-between pb-1 border-b" style="border-color:var(--glass-border)">
                <span class="flex items-center gap-1.5">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber pulse" style="background-color:var(--accent-primary)"></span>
                    <span style="color:var(--accent-primary); font-weight:600; letter-spacing:0.05em;">SYS://LOG</span>
                </span>
                <button id="btn-clear-log" class="mono text-xs"
                    style="color:var(--text-muted);background:none;border:none;cursor:pointer;font-family:inherit;font-size:10px;text-transform:uppercase;">[CLEAR]</button>
            </div>
            <div id="log" class="flex flex-col gap-0.5"></div>
        </div>

    </main>

    <!-- Custom Retro Confirmation Modal -->
    <div id="confirm-modal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-sm hidden">
        <div class="glass-panel p-6 max-w-sm w-full mx-4 flex flex-col gap-4">
            <div class="mono text-xs flex items-center gap-1.5 pb-2 border-b" style="border-color:var(--glass-border)">
                <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber pulse" style="background-color:var(--accent-primary)"></span>
                <span style="color:var(--accent-primary); font-weight:600; letter-spacing:0.05em;">SYS://CONFIRM</span>
            </div>
            <p id="confirm-message" class="mono text-sm leading-relaxed" style="color:var(--text-main)"></p>
            <div class="flex justify-end gap-3 mt-2">
                <button id="btn-confirm-cancel" class="btn">CANCEL</button>
                <button id="btn-confirm-ok" class="btn btn-red">PROCEED</button>
            </div>
        </div>
    </div>

    <script type="module" src="app.js"></script>
</body>

</html>
