# VOID://CLIPBOARD

A minimalist, E2EE (End-to-End Encrypted) Zero-Knowledge private web clipboard for instantly sharing text and files. Built with a sleek retro-terminal style.

## 🚀 Zero-Knowledge Architecture

The system is designed with privacy as the absolute priority:
- **Client-Side Cryptography**: Encryption and decryption take place entirely inside your web browser using the browser's built-in **Web Crypto API (AES-GCM 256-bit)**.
- **Blind Rooms**: Encryption keys and room IDs reside solely in the URL `#hash` fragment. Since URL hashes are never transmitted to the web server, the server is blind to your secrets.
- **Ephemeral Storage**: All synchronized data is strictly time-restricted (TTL) or deleted immediately after consumption:
  - **Text Clipboard**: Auto-expires after **30 minutes**.
  - **File Sharing**: Encrypted client-side, allows **only 1 download**, and auto-expires after **15 minutes** (max 20 MB).
  - **Database Blindness**: The SQLite database only stores the room hash (SHA-256 of the Room ID), base64-encoded encrypted metadata, initialization vectors (IVs), and the ciphertext blobs. It never has access to raw content, file names, or MIME types.

---

## ✨ Features

- 🟢 **Real-Time Sync**: Synchronizes text/code changes across clients using secure, low-overhead HTTP polling.
- 📁 **E2EE File Sharing**: Drag-and-drop file sharing with automatic file chunks encryption before uploading.
- ⏱️ **Auto-Destruction**: Live TTL countdown timers show exactly when your text or files will expire.
- 🎨 **Phosphor Glow UI**: A premium dark terminal aesthetic with glowing text, phosphor pulse indicators, and retro scanline effects.
- ⚡ **Lightweight & Self-contained**: Single PHP backend logic file (`api.php`), standalone styles (`style.css`), and frontend script (`app.js`).

---

## 🛠️ Installation & Setup

### Prerequisites
- PHP 8.0 or newer
- SQLite3 extension enabled in PHP (`php_sqlite3`)

### Local Development
1. Clone this repository to your local workspace:
   ```bash
   git clone https://github.com/your-username/void-clipboard.git
   cd void-clipboard
   ```
2. Start the built-in PHP development server:
   ```bash
   php -S localhost:8000
   ```
3. Open your browser and navigate to `http://localhost:8000`.

### Production Deployment
1. Upload all files (`index.php`, `api.php`, `style.css`, `app.js`) to your web server (Apache, Nginx, or Caddy) supporting PHP.
2. Ensure the server has write permissions in the installation directory to create the SQLite database (`database.sqlite`) and the `uploads/` directory.
3. **Important**: Always serve this application over **HTTPS**; the Web Crypto API (`crypto.subtle`) is disabled by browsers on non-secure connections (`http://` except `localhost`).

---

## 🔒 Security Specifications

- **Key Derivation**: PBKDF2 with 200,000 iterations and SHA-256 hashing.
- **Encryption Algorithm**: AES-GCM 256-bit.
- **Database Backend**: SQLite 3 with Write-Ahead Logging (WAL) enabled for concurrency.
- **Garbage Collection (GC)**: Probabilistic cleanup mechanism runs on 5% of API requests to purge expired rooms, expired files, and unlink orphaned files from disk.

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
