<?php
// ============================================================
// E2EE Private Clipboard — index.php
// Zero-Knowledge Architecture: server never sees plaintext,
// filenames, or encryption keys. All secrets live in URL #hash.
// ============================================================

define('DB_PATH',      __DIR__ . '/database.sqlite');
define('UPLOAD_DIR',   __DIR__ . '/uploads/');
define('TEXT_TTL',     30 * 60);   // 30 min
define('FILE_TTL',     15 * 60);   // 15 min
define('MAX_FILE',     20 * 1024 * 1024); // 20 MB
define('GC_PROBABILITY', 5);       // % chance of GC per request

// ── Routing ─────────────────────────────────────────────────
$action = $_GET['action'] ?? null;
if ($action !== null) {
    api_dispatch($action);
    exit;
}

// ============================================================
// API LAYER
// ============================================================

function api_dispatch(string $action): void {
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store, no-cache, must-revalidate');
    header('X-Robots-Tag: noindex, nofollow');

    // Probabilistic GC — runs on ~5% of all API calls
    if (random_int(1, 100) <= GC_PROBABILITY) {
        gc_run(db());
    }

    try {
        match ($action) {
            'save_text'     => action_save_text(),
            'get_text'      => action_get_text(),
            'upload_file'   => action_upload_file(),
            'download_file' => action_download_file(),
            'list_files'    => action_list_files(),
            default         => json_error(400, 'unknown_action'),
        };
    } catch (Throwable $e) {
        json_error(500, 'internal_error');
    }
}

// ── DB Singleton ─────────────────────────────────────────────
function db(): SQLite3 {
    static $db = null;
    if ($db === null) {
        $db = new SQLite3(DB_PATH);
        $db->enableExceptions(true);
        $db->exec('PRAGMA journal_mode=WAL');
        $db->exec('PRAGMA synchronous=NORMAL');
        $db->exec('PRAGMA busy_timeout=5000');
        $db->exec('PRAGMA foreign_keys=ON');
        db_migrate($db);
    }
    return $db;
}

function db_migrate(SQLite3 $db): void {
    $db->exec('
        CREATE TABLE IF NOT EXISTS rooms (
            room_hash       TEXT PRIMARY KEY,
            encrypted_data  TEXT NOT NULL,
            iv              TEXT NOT NULL,
            updated_at      INTEGER NOT NULL
        );
        CREATE TABLE IF NOT EXISTS files (
            file_id         TEXT PRIMARY KEY,
            room_hash       TEXT NOT NULL,
            encrypted_meta  TEXT NOT NULL,
            iv_meta         TEXT NOT NULL,
            download_count  INTEGER NOT NULL DEFAULT 0,
            created_at      INTEGER NOT NULL
        );
    ');
}

// ── Actions ──────────────────────────────────────────────────

function action_save_text(): void {
    $body = json_input();
    $room_hash      = validate_hash($body['room_hash'] ?? '');
    $encrypted_data = $body['encrypted_data'] ?? '';
    $iv             = $body['iv'] ?? '';
    $last_updated   = isset($body['last_updated']) ? (int)$body['last_updated'] : 0;

    if (!$encrypted_data || !$iv) {
        json_error(400, 'missing_fields');
    }

    $db = db();
    $now = time();

    $db->exec('BEGIN IMMEDIATE');

    // Concurrency conflict detection
    if ($last_updated > 0) {
        $stmt = $db->prepare('SELECT updated_at FROM rooms WHERE room_hash = :rh');
        $stmt->bindValue(':rh', $room_hash, SQLITE3_TEXT);
        $row = $stmt->execute()->fetchArray(SQLITE3_ASSOC);
        if ($row && $row['updated_at'] > $last_updated) {
            $db->exec('ROLLBACK');
            json_error(409, 'conflict');
        }
    }

    $stmt = $db->prepare('
        INSERT INTO rooms (room_hash, encrypted_data, iv, updated_at)
        VALUES (:rh, :ed, :iv, :ua)
        ON CONFLICT(room_hash) DO UPDATE SET
            encrypted_data = excluded.encrypted_data,
            iv             = excluded.iv,
            updated_at     = excluded.updated_at
    ');
    $stmt->bindValue(':rh', $room_hash, SQLITE3_TEXT);
    $stmt->bindValue(':ed', $encrypted_data, SQLITE3_TEXT);
    $stmt->bindValue(':iv', $iv, SQLITE3_TEXT);
    $stmt->bindValue(':ua', $now, SQLITE3_INTEGER);
    $stmt->execute();
    $db->exec('COMMIT');

    json_ok(['saved' => true, 'updated_at' => $now]);
}

function action_get_text(): void {
    $room_hash = validate_hash($_GET['room_hash'] ?? '');
    $db = db();
    $now = time();

    $stmt = $db->prepare('SELECT encrypted_data, iv, updated_at FROM rooms WHERE room_hash = :rh');
    $stmt->bindValue(':rh', $room_hash, SQLITE3_TEXT);
    $row = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

    if (!$row) {
        json_ok(['empty' => true]);
        return;
    }

    // Lazy deletion — expired room
    if ($now - $row['updated_at'] > TEXT_TTL) {
        $db->exec('BEGIN IMMEDIATE');
        $del = $db->prepare('DELETE FROM rooms WHERE room_hash = :rh');
        $del->bindValue(':rh', $room_hash, SQLITE3_TEXT);
        $del->execute();
        $db->exec('COMMIT');
        json_ok(['empty' => true]);
        return;
    }

    // HTTP 304 short-circuit
    $last_modified = gmdate('D, d M Y H:i:s', $row['updated_at']) . ' GMT';
    $ims = $_SERVER['HTTP_IF_MODIFIED_SINCE'] ?? '';
    if ($ims && strtotime($ims) >= $row['updated_at']) {
        http_response_code(304);
        exit;
    }

    header('Last-Modified: ' . $last_modified);
    json_ok([
        'encrypted_data' => $row['encrypted_data'],
        'iv'             => $row['iv'],
        'updated_at'     => $row['updated_at'],
        'expires_in'     => TEXT_TTL - ($now - $row['updated_at']),
    ]);
}

function action_upload_file(): void {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') json_error(405, 'method_not_allowed');

    // Detect if POST size exceeded limits (which empties $_POST and $_FILES)
    if (empty($_POST) && empty($_FILES) && (int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 0) {
        $max_post = ini_get('post_max_size');
        json_error(400, "post_max_size_exceeded (limit: $max_post)");
    }

    $room_hash      = validate_hash($_POST['room_hash'] ?? '');
    $encrypted_meta = $_POST['encrypted_meta'] ?? '';
    $iv_meta        = $_POST['iv_meta'] ?? '';
    $file           = $_FILES['file'] ?? null;

    if (!$encrypted_meta || !$iv_meta || !$file) json_error(400, 'missing_fields');

    if ($file['error'] !== UPLOAD_ERR_OK) {
        if ($file['error'] === UPLOAD_ERR_INI_SIZE) {
            $max_upload = ini_get('upload_max_filesize');
            json_error(400, "upload_max_filesize_exceeded (limit: $max_upload)");
        }
        json_error(400, 'upload_error_code_' . $file['error']);
    }
    if ($file['size'] > MAX_FILE)                 json_error(413, 'file_too_large');

    if (!is_dir(UPLOAD_DIR)) mkdir(UPLOAD_DIR, 0750, true);

    $file_id   = bin2hex(random_bytes(16)); // UUID-style
    $dest_path = UPLOAD_DIR . $file_id;

    if (!move_uploaded_file($file['tmp_name'], $dest_path)) {
        json_error(500, 'storage_error');
    }

    $db  = db();
    $now = time();

    $db->exec('BEGIN IMMEDIATE');
    $stmt = $db->prepare('
        INSERT INTO files (file_id, room_hash, encrypted_meta, iv_meta, created_at)
        VALUES (:fid, :rh, :em, :im, :ca)
    ');
    $stmt->bindValue(':fid', $file_id, SQLITE3_TEXT);
    $stmt->bindValue(':rh',  $room_hash, SQLITE3_TEXT);
    $stmt->bindValue(':em',  $encrypted_meta, SQLITE3_TEXT);
    $stmt->bindValue(':im',  $iv_meta, SQLITE3_TEXT);
    $stmt->bindValue(':ca',  $now, SQLITE3_INTEGER);
    $stmt->execute();
    $db->exec('COMMIT');

    json_ok([
        'file_id'   => $file_id,
        'created_at'=> $now,
        'expires_in'=> FILE_TTL,
    ]);
}

function action_download_file(): void {
    $file_id   = preg_replace('/[^a-f0-9]/', '', $_GET['file_id'] ?? '');
    $room_hash = validate_hash($_GET['room_hash'] ?? '');

    if (strlen($file_id) !== 32) json_error(400, 'invalid_file_id');

    $db  = db();
    $now = time();

    $stmt = $db->prepare('
        SELECT file_id, encrypted_meta, iv_meta, download_count, created_at
        FROM files WHERE file_id = :fid AND room_hash = :rh
    ');
    $stmt->bindValue(':fid', $file_id, SQLITE3_TEXT);
    $stmt->bindValue(':rh',  $room_hash, SQLITE3_TEXT);
    $row = $stmt->execute()->fetchArray(SQLITE3_ASSOC);

    if (!$row) json_error(404, 'not_found');

    // Expired or already downloaded
    if ($row['download_count'] >= 1 || ($now - $row['created_at']) > FILE_TTL) {
        purge_file($db, $file_id);
        json_error(410, 'expired_or_consumed');
    }

    $path = UPLOAD_DIR . $file_id;
    if (!file_exists($path)) {
        purge_file($db, $file_id);
        json_error(404, 'not_found');
    }

    // Increment download count atomically BEFORE streaming
    $db->exec('BEGIN IMMEDIATE');
    $upd = $db->prepare('UPDATE files SET download_count = 1 WHERE file_id = :fid');
    $upd->bindValue(':fid', $file_id, SQLITE3_TEXT);
    $upd->execute();
    $db->exec('COMMIT');

    // Disable output buffering to stream directly to web server without hitting memory limits
    while (ob_get_level()) {
        ob_end_clean();
    }

    // Stream encrypted blob — Content-Type is opaque
    header('Content-Type: application/octet-stream');
    header('Content-Length: ' . filesize($path));
    header('Cache-Control: no-store');
    header('X-Encrypted-Meta: ' . $row['encrypted_meta']);
    header('X-Encrypted-Meta-IV: ' . $row['iv_meta']);

    readfile($path);

    // Sync deletion without relying on shutdown functions
    @unlink($path);
    $db->exec('BEGIN IMMEDIATE');
    $del = $db->prepare('DELETE FROM files WHERE file_id = :fid');
    $del->bindValue(':fid', $file_id, SQLITE3_TEXT);
    $del->execute();
    $db->exec('COMMIT');
    exit;
}

function action_list_files(): void {
    $room_hash = validate_hash($_GET['room_hash'] ?? '');
    $db  = db();
    $now = time();

    $stmt = $db->prepare('
        SELECT file_id, encrypted_meta, iv_meta, created_at, download_count
        FROM files WHERE room_hash = :rh
        ORDER BY created_at DESC
    ');
    $stmt->bindValue(':rh', $room_hash, SQLITE3_TEXT);
    $result = $stmt->execute();

    $files = [];
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $age = $now - $row['created_at'];
        if ($row['download_count'] >= 1 || $age > FILE_TTL) {
            purge_file($db, $row['file_id']);
            continue;
        }
        $files[] = [
            'file_id'        => $row['file_id'],
            'encrypted_meta' => $row['encrypted_meta'],
            'iv_meta'        => $row['iv_meta'],
            'created_at'     => $row['created_at'],
            'expires_in'     => FILE_TTL - $age,
        ];
    }

    json_ok(['files' => $files]);
}

// ── Helpers ──────────────────────────────────────────────────

function validate_hash(string $h): string {
    $h = strtolower(preg_replace('/[^a-fA-F0-9]/', '', $h));
    if (strlen($h) !== 64) json_error(400, 'invalid_room_hash');
    return $h;
}

function json_input(): array {
    $raw = file_get_contents('php://input');
    $data = json_decode($raw, true);
    if (!is_array($data)) json_error(400, 'invalid_json');
    return $data;
}

function json_ok(array $data): void {
    echo json_encode(array_merge(['ok' => true], $data));
    exit;
}

function json_error(int $code, string $msg): never {
    http_response_code($code);
    echo json_encode(['ok' => false, 'error' => $msg]);
    exit;
}

function purge_file(SQLite3 $db, string $file_id): void {
    $path = UPLOAD_DIR . preg_replace('/[^a-f0-9]/', '', $file_id);
    @unlink($path);
    $db->exec('BEGIN IMMEDIATE');
    $stmt = $db->prepare('DELETE FROM files WHERE file_id = :fid');
    $stmt->bindValue(':fid', $file_id, SQLITE3_TEXT);
    $stmt->execute();
    $db->exec('COMMIT');
}

function gc_run(SQLite3 $db): void {
    $now = time();
    $text_cutoff = $now - TEXT_TTL;
    $file_cutoff = $now - FILE_TTL;

    $db->exec('BEGIN IMMEDIATE');

    // Purge expired text rooms
    $db->exec("DELETE FROM rooms WHERE updated_at < $text_cutoff");

    // Find expired/consumed files
    $res = $db->query("
        SELECT file_id FROM files
        WHERE created_at < $file_cutoff OR download_count >= 1
    ");
    while ($row = $res->fetchArray(SQLITE3_ASSOC)) {
        @unlink(UPLOAD_DIR . $row['file_id']);
    }
    $db->exec("DELETE FROM files WHERE created_at < $file_cutoff OR download_count >= 1");

    $db->exec('COMMIT');

    // Orphan sweep — files on disk not in DB (Optimized)
    $valid_files = [];
    $res = $db->query('SELECT file_id FROM files');
    while ($row = $res->fetchArray(SQLITE3_NUM)) {
        $valid_files[$row[0]] = true;
    }

    if (is_dir(UPLOAD_DIR)) {
        foreach (scandir(UPLOAD_DIR) as $f) {
            if ($f === '.' || $f === '..' || $f === '.htaccess') continue;
            
            $fid = preg_replace('/[^a-f0-9]/', '', $f);
            if (strlen($fid) !== 32 || !isset($valid_files[$fid])) {
                @unlink(UPLOAD_DIR . $f);
            }
        }
    }
}
