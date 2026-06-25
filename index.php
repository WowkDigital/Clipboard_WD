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
    <link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Inter:wght@300;400;500&display=swap"
        rel="stylesheet">
    <link rel="stylesheet" href="style.css">
</head>

<body class="h-full min-h-screen flex flex-col">

    <header class="border-b" style="border-color:var(--border)">
        <div class="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <div class="flex items-center gap-3">
                <span class="mono glow text-sm tracking-widest" style="color:var(--green)">VOID://CLIP</span>
                <span class="mono text-xs" style="color:var(--text-dim)">E2EE · ZERO-KNOWLEDGE</span>
            </div>
            <div class="flex items-center gap-2">
                <span id="status-dot" class="pulse inline-block w-2 h-2 rounded-full"
                    style="background:var(--text-muted)"></span>
                <span id="status-text" class="mono text-xs" style="color:var(--text-dim)">OFFLINE</span>
            </div>
        </div>
    </header>

    <div class="border-b" style="border-color:var(--border); background:var(--surface)">
        <div class="max-w-3xl mx-auto px-4 py-2 flex items-center gap-3 flex-wrap">
            <span class="mono text-xs" style="color:var(--text-dim)">ROOM:</span>
            <span id="room-display" class="mono text-xs cursor" style="color:var(--amber)">—</span>
            <div class="flex-1"></div>
            <button class="btn text-xs" id="btn-new-room" style="font-size:10px;padding:4px 10px">NEW ROOM</button>
            <button class="btn text-xs" id="btn-copy-url" style="font-size:10px;padding:4px 10px">COPY LINK</button>
        </div>
    </div>

    <main class="flex-1 max-w-3xl w-full mx-auto px-4 py-5 flex flex-col gap-4">

        <div class="flex gap-0 border-b" style="border-color:var(--border)">
            <button class="tab-active btn" data-tab="text"
                style="border:none;border-bottom:1px solid var(--green);border-radius:0;padding:8px 20px;">TEXT</button>
            <button class="btn" data-tab="files"
                style="border:none;border-bottom:1px solid transparent;border-radius:0;padding:8px 20px;color:var(--text-dim)">FILES</button>
        </div>

        <div id="tab-text" class="flex flex-col gap-3">
            <div class="relative">
                <textarea id="editor" rows="14"
                    placeholder="// paste text, code, or data here — encrypted before leaving your browser"
                    class="w-full rounded-none p-4"></textarea>
                <div class="absolute bottom-2 right-3 flex items-center gap-3">
                    <span id="text-expires" class="mono text-xs countdown" style="color:var(--text-muted)"></span>
                    <span id="char-count" class="mono text-xs" style="color:var(--text-muted)">0</span>
                </div>
            </div>
            <div class="flex items-center justify-between flex-wrap gap-2">
                <div class="flex gap-2">
                    <button class="btn" id="btn-save">ENCRYPT &amp; SYNC</button>
                    <button class="btn btn-red" id="btn-clear">CLEAR</button>
                </div>
                <div id="sync-indicator" class="mono text-xs" style="color:var(--text-muted)">—</div>
            </div>
        </div>

        <div id="tab-files" class="flex flex-col gap-3 hidden">

            <div id="drop-zone"
                class="rounded-none flex flex-col items-center justify-center gap-2 p-10 cursor-pointer select-none relative overflow-hidden"
                style="min-height:160px">
                <div class="mono text-sm" style="color:var(--text-dim)">DROP FILE HERE</div>
                <div class="mono text-xs" style="color:var(--text-muted)">or click to browse · max 20 MB</div>
                <div class="mono text-xs" style="color:var(--text-muted)">encrypted client-side · 1 download · 15 min
                    TTL</div>
                <input type="file" id="file-input" class="absolute inset-0 opacity-0 cursor-pointer">
            </div>

            <div id="progress-wrap" class="hidden">
                <div class="w-full h-1 rounded-none overflow-hidden" style="background:var(--border)">
                    <div id="progress-bar" class="h-full" style="width:0%"></div>
                </div>
                <div id="progress-label" class="mono text-xs mt-1" style="color:var(--text-dim)">ENCRYPTING...</div>
            </div>

            <div id="file-list" class="flex flex-col gap-2"></div>
            <div id="files-empty" class="mono text-xs text-center py-8" style="color:var(--text-muted)">// no files in
                this room</div>

        </div>

        <div class="border-t pt-2" style="border-color:var(--border)">
            <div class="mono text-xs mb-1 flex items-center gap-2" style="color:var(--text-muted)">
                <span>SYS://LOG</span>
                <button id="btn-clear-log"
                    style="color:var(--text-muted);background:none;border:none;cursor:pointer;font-size:10px;font-family:inherit">CLR</button>
            </div>
            <div id="log" class="flex flex-col gap-0.5"></div>
        </div>

    </main>

    <script src="app.js"></script>
</body>

</html>
