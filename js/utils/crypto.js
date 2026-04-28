// ==================== crypto.js - 加密工具 ====================
// 使用 Web Crypto API 进行 AES-GCM 加密
// 用于加密存储用户的 API Key 等敏感信息

const ENCRYPTION_ALGO = 'AES-GCM';
const KEY_LENGTH = 256;
const IV_LENGTH = 12;

/**
 * 从密码派生加密密钥
 * @param {string} password - 用户密码
 * @param {Uint8Array} salt - 盐值
 * @returns {Promise<CryptoKey>}
 */
async function deriveKey(password, salt) {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
        'raw',
        encoder.encode(password),
        'PBKDF2',
        false,
        ['deriveKey']
    );

    return crypto.subtle.deriveKey(
        {
            name: 'PBKDF2',
            salt: salt,
            iterations: 100000,
            hash: 'SHA-256'
        },
        keyMaterial,
        { name: ENCRYPTION_ALGO, length: KEY_LENGTH },
        false,
        ['encrypt', 'decrypt']
    );
}

/**
 * 加密文本
 * @param {string} plainText - 明文
 * @param {string} password - 加密密码
 * @returns {Promise<string>} Base64 编码的加密数据（格式：salt:iv:ciphertext）
 */
export async function encrypt(plainText, password) {
    const encoder = new TextEncoder();

    // 生成随机盐和 IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

    // 派生密钥
    const key = await deriveKey(password, salt);

    // 加密
    const encrypted = await crypto.subtle.encrypt(
        { name: ENCRYPTION_ALGO, iv: iv },
        key,
        encoder.encode(plainText)
    );

    // 组合：salt(16) + iv(12) + ciphertext
    const combined = new Uint8Array(salt.length + iv.length + encrypted.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encrypted), salt.length + iv.length);

    // 转为 Base64
    return btoa(String.fromCharCode.apply(null, combined));
}

/**
 * 解密文本
 * @param {string} cipherBase64 - Base64 编码的加密数据
 * @param {string} password - 解密密码
 * @returns {Promise<string>} 明文
 */
export async function decrypt(cipherBase64, password) {
    // 解码 Base64
    const combined = Uint8Array.from(atob(cipherBase64), function(c) {
        return c.charCodeAt(0);
    });

    // 提取 salt、iv、ciphertext
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 16 + IV_LENGTH);
    const ciphertext = combined.slice(16 + IV_LENGTH);

    // 派生密钥
    const key = await deriveKey(password, salt);

    // 解密
    const decrypted = await crypto.subtle.decrypt(
        { name: ENCRYPTION_ALGO, iv: iv },
        key,
        ciphertext
    );

    return new TextDecoder().decode(decrypted);
}

/**
 * 生成随机密码（用于设备绑定加密）
 * @param {number} length
 * @returns {string}
 */
export function generateRandomPassword(length) {
    length = length || 32;
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
    const array = crypto.getRandomValues(new Uint8Array(length));
    return Array.from(array, function(b) {
        return chars[b % chars.length];
    }).join('');
}
