'use strict';

export async function deriveKey(password) {
    const enc = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']
    );
    return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('void-clipboard-v1'), iterations: 200000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
    );
}

export async function encrypt(key, plaintext) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const enc = new TextEncoder();
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv }, key, enc.encode(plaintext)
    );
    return {
        data: bufToB64(ciphertext),
        iv: bufToB64(iv),
    };
}

export async function decrypt(key, b64data, b64iv) {
    const iv = b64ToBuf(b64iv);
    const ct = b64ToBuf(b64data);
    const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
    return new TextDecoder().decode(pt);
}

export async function encryptBuf(key, buffer) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, buffer);
    return { data: ct, iv };
}

export async function decryptBuf(key, cipherBuf, b64iv) {
    const iv = b64ToBuf(b64iv);
    return crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBuf);
}

export async function hashRoomId(id) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(id));
    return bufToHex(buf);
}

// ── Helpers ──────────────────────────────────────────────────
export function bufToB64(buf) {
    return btoa(String.fromCharCode(...new Uint8Array(buf instanceof ArrayBuffer ? buf : buf.buffer || buf)));
}

export function b64ToBuf(b64) {
    const bin = atob(b64);
    const buf = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i);
    return buf;
}

export function bufToHex(buf) {
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}
