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
                    <button class="btn-tab" data-tab="story">STORY MODE</button>
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
                    <input type="file" id="file-input" class="absolute inset-0 opacity-0 cursor-pointer" multiple>
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

            <!-- Tab content: STORY MODE -->
            <div id="tab-story" class="flex flex-col gap-5 hidden">
                <!-- Terminal Section -->
                <div class="flex flex-col gap-2">
                    <div class="mono text-[10px] flex items-center justify-between pb-1 border-b" style="border-color:var(--glass-border)">
                        <span class="flex items-center gap-1.5">
                            <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber pulse" style="background-color:var(--accent-primary)"></span>
                            <span style="color:var(--accent-primary); font-weight:600; letter-spacing:0.05em;">GATEWAY://TERMINAL_V1.0</span>
                        </span>
                        <span style="color:var(--text-muted)">[SESSION: ENCRYPTED]</span>
                    </div>
                    <div id="story-terminal-output" class="p-4 border rounded overflow-y-auto" style="height: 300px; border-color:var(--glass-border);">
                        <!-- Simulation text will be populated dynamically -->
                    </div>
                    <div class="flex items-center gap-2 border rounded bg-black/60 p-2" style="border-color:var(--glass-border)">
                        <span class="mono text-xs font-bold text-sky-400 shrink-0 select-none">USR://&gt;</span>
                        <input type="text" id="story-terminal-input" class="bg-transparent border-none outline-none mono text-xs text-sky-300 w-full focus:ring-0 p-0" style="caret-color: #38bdf8;" placeholder="Type 'help' for instructions..." autofocus autocomplete="off">
                    </div>
                    <!-- Command Shortcuts -->
                    <div class="flex flex-wrap gap-1.5 mt-1 select-none">
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded" data-cmd="help">HELP</button>
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded" data-cmd="status">STATUS</button>
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded" data-cmd="scan">SCAN</button>
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded" data-cmd="check">CHECK</button>
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded" data-cmd="docs">DOCS</button>
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded" data-cmd="gallery">GALLERY</button>
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded" data-cmd="hint">HINT</button>
                        <button class="btn-cmd-shortcut mono text-[10px] uppercase px-2 py-0.5 border rounded btn-red" data-cmd="clear">CLEAR</button>
                    </div>
                </div>

                <!-- Decrypted Documents list -->
                <div class="glass-panel p-4 flex flex-col gap-2 bg-black/40">
                    <div id="story-docs-header" class="mono text-xs font-bold border-b pb-1 flex justify-between items-center cursor-pointer select-none" style="border-color:var(--glass-border); color:var(--accent-primary)">
                        <div class="flex items-center gap-2">
                            <span>[DECRYPTED_LOGS]</span>
                            <span id="story-docs-toggle" style="color:var(--text-muted)">[-]</span>
                            <span id="story-docs-new" class="text-[9px] bg-amber/15 border border-amber/40 px-1.5 py-0.5 rounded text-amber-500 animate-pulse hidden" style="color:var(--accent-primary); border-color:rgba(234,179,8,0.4); background:rgba(234,179,8,0.15)">NEW CONTENT</span>
                        </div>
                        <span id="docs-count" class="text-xs font-medium" style="color:var(--text-secondary)">0/5</span>
                    </div>
                    <div id="story-docs-list" class="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                        <!-- Decrypted items with lock/unlock states -->
                    </div>
                </div>

                <!-- Side Missions list -->
                <div class="glass-panel p-4 flex flex-col gap-2 bg-black/40">
                    <div id="story-missions-header" class="mono text-xs font-bold border-b pb-1 flex justify-between items-center cursor-pointer select-none" style="border-color:var(--glass-border); color:var(--accent-primary)">
                        <div class="flex items-center gap-2">
                            <span>[INDEPENDENT_MISSIONS]</span>
                            <span id="story-missions-toggle" style="color:var(--text-muted)">[-]</span>
                            <span id="story-missions-new" class="text-[9px] bg-amber/15 border border-amber/40 px-1.5 py-0.5 rounded text-amber-500 animate-pulse hidden" style="color:var(--accent-primary); border-color:rgba(234,179,8,0.4); background:rgba(234,179,8,0.15)">NEW CONTENT</span>
                        </div>
                        <span id="side-missions-count" class="text-xs font-medium" style="color:var(--text-secondary)">0/4</span>
                    </div>
                    <div id="story-side-missions-list" class="flex flex-col gap-1.5 max-h-[180px] overflow-y-auto">
                        <!-- Side missions with status -->
                    </div>
                </div>


                <!-- Gallery list -->
                <div class="glass-panel p-4 flex flex-col gap-2 bg-black/40">
                    <div id="story-gallery-header" class="mono text-xs font-bold border-b pb-1 flex justify-between items-center cursor-pointer select-none" style="border-color:var(--glass-border); color:var(--accent-primary)">
                        <div class="flex items-center gap-2">
                            <span>[CAPTURED_ANOMALIES]</span>
                            <span id="story-gallery-toggle" style="color:var(--text-muted)">[-]</span>
                            <span id="story-gallery-new" class="text-[9px] bg-amber/15 border border-amber/40 px-1.5 py-0.5 rounded text-amber-500 animate-pulse hidden" style="color:var(--accent-primary); border-color:rgba(234,179,8,0.4); background:rgba(234,179,8,0.15)">NEW CONTENT</span>
                        </div>
                        <span id="gallery-count" class="text-xs font-medium" style="color:var(--text-secondary)">0/4</span>
                    </div>
                    <div id="story-gallery-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-3 max-h-[260px] overflow-y-auto">
                        <!-- Discovered photos thumbnail grid -->
                    </div>
                </div>
            </div>

        </div>

        <!-- System Log Container -->
        <div class="glass-panel p-4 flex flex-col gap-2">
            <div id="log-header" class="mono text-xs flex items-center justify-between pb-1 border-b cursor-pointer select-none" style="border-color:var(--glass-border)">
                <span class="flex items-center gap-1.5">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-amber pulse" style="background-color:var(--accent-primary)"></span>
                    <span style="color:var(--accent-primary); font-weight:600; letter-spacing:0.05em;">SYS://LOG</span>
                    <span id="log-toggle-indicator" style="color:var(--text-muted)">[-]</span>
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

    <!-- Retro Anomaly Image Viewer Modal -->
    <div id="story-image-modal" class="fixed inset-0 z-[1000] flex items-center justify-center bg-black/90 backdrop-blur-sm hidden">
        <div class="glass-panel p-6 max-w-lg w-full mx-4 flex flex-col gap-4">
            <div class="mono text-xs flex items-center justify-between pb-2 border-b" style="border-color:var(--glass-border)">
                <span class="flex items-center gap-1.5">
                    <span class="inline-block w-1.5 h-1.5 rounded-full bg-sky-400 pulse"></span>
                    <span id="story-modal-title" style="color:#38bdf8; font-weight:600; letter-spacing:0.05em;">ANOMALY_RECORD</span>
                </span>
                <span style="color:var(--text-muted)">[CLASSIFIED]</span>
            </div>
            <div class="border overflow-hidden bg-black/60 flex items-center justify-center rounded" style="border-color:var(--glass-border)">
                <img id="story-modal-img" src="" alt="Anomaly visual" class="max-h-[350px] w-auto object-contain">
            </div>
            <p id="story-modal-desc" class="mono text-xs leading-relaxed" style="color:var(--text-secondary)"></p>
            <div class="flex justify-end mt-2">
                <button id="btn-story-modal-close" class="btn">CLOSE RECORD</button>
            </div>
        </div>
    </div>

    <!-- Load Footer Library -->
    <script src="https://cdn.jsdelivr.net/gh/WowkDigital/WowkDigitalFooter@latest/wowk-digital-footer.js"></script>

    <!-- Initialize Footer -->
    <script>
      document.addEventListener('DOMContentLoaded', () => {
        WowkDigitalFooter.init({
          siteName: 'VOID://CLIPBOARD',
          container: 'body',
          brandName: 'Wowk Digital',
          brandUrl: 'https://github.com/WowkDigital',
          showHubLink: true,
          hubUrl: 'https://wowkdigital.github.io/WD_HUB/',
          theme: 'auto'
        });
      });
    </script>

    <script type="module" src="app.js"></script>
</body>

</html>
