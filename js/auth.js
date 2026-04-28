// ==================== auth.js - 本地登录系统 ====================
// 纯前端登录，账号数据存在 localStorage
// 登录后解锁 API Key 等敏感信息

import { encrypt, decrypt, generateRandomPassword } from './utils/crypto.js';

const AUTH_PREFIX = 'byt_auth_';
const SESSION_KEY = 'byt_session';
const DEVICE_KEY = 'byt_device_key';

/**
 * 注册新账号
 * @param {string} username
 * @param {string} password
 * @returns {{ success: boolean, message: string }}
 */
export function register(username, password) {
    if (!username || username.length < 2) {
        return { success: false, message: '用户名至少2个字符' };
    }
    if (!password || password.length < 4) {
        return { success: false, message: '密码至少4个字符' };
    }

    const userKey = AUTH_PREFIX + username;

    // 检查是否已存在
    try {
        if (localStorage.getItem(userKey)) {
            return { success: false, message: '用户名已存在' };
        }
    } catch (e) {
        return { success: false, message: '存储访问失败' };
    }

    // 生成设备密钥（用于加密 API Key）
    const deviceKey = generateRandomPassword(32);

    // 存储用户数据（密码哈希 + 设备密钥）
    // 简单哈希（非安全级别，仅防止明文存储）
    const userData = {
        username: username,
        passwordHash: simpleHash(password),
        deviceKey: deviceKey,
        createdAt: new Date().toISOString(),
        lastLogin: null
    };

    try {
        localStorage.setItem(userKey, JSON.stringify(userData));
        return { success: true, message: '注册成功' };
    } catch (e) {
        return { success: false, message: '存储空间不足' };
    }
}

/**
 * 登录
 * @param {string} username
 * @param {string} password
 * @returns {{ success: boolean, message: string }}
 */
export function login(username, password) {
    const userKey = AUTH_PREFIX + username;
    let userData;

    try {
        const raw = localStorage.getItem(userKey);
        if (!raw) {
            return { success: false, message: '用户名不存在' };
        }
        userData = JSON.parse(raw);
    } catch (e) {
        return { success: false, message: '数据读取失败' };
    }

    if (userData.passwordHash !== simpleHash(password)) {
        return { success: false, message: '密码错误' };
    }

    // 更新最后登录时间
    userData.lastLogin = new Date().toISOString();
    try {
        localStorage.setItem(userKey, JSON.stringify(userData));
    } catch (e) {}

    // 创建会话
    const session = {
        username: username,
        loginTime: new Date().toISOString(),
        deviceKey: userData.deviceKey
    };

    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {}

    return { success: true, message: '登录成功' };
}

/**
 * 登出
 */
export function logout() {
    try {
        localStorage.removeItem(SESSION_KEY);
    } catch (e) {}
}

/**
 * 修改密码
 * @param {string} oldPassword - 旧密码
 * @param {string} newPassword - 新密码
 * @returns {Promise<{ success: boolean, message: string }>}
 */
export async function changePassword(oldPassword, newPassword) {
    const username = getCurrentUser();
    if (!username) {
        return { success: false, message: '未登录' };
    }

    if (!newPassword || newPassword.length < 4) {
        return { success: false, message: '新密码至少4个字符' };
    }

    const userKey = AUTH_PREFIX + username;
    let userData;

    try {
        const raw = localStorage.getItem(userKey);
        if (!raw) {
            return { success: false, message: '用户数据不存在' };
        }
        userData = JSON.parse(raw);
    } catch (e) {
        return { success: false, message: '数据读取失败' };
    }

    // 验证旧密码
    if (userData.passwordHash !== simpleHash(oldPassword)) {
        return { success: false, message: '旧密码错误' };
    }

    // 重新加密所有 API Key（因为 deviceKey 绑定的是用户密码派生的）
    // 注意：当前实现中 deviceKey 是随机生成的，不依赖密码
    // 所以改密码不需要重新加密 API Key
    const oldDeviceKey = userData.deviceKey;

    // 更新密码哈希
    userData.passwordHash = simpleHash(newPassword);

    try {
        localStorage.setItem(userKey, JSON.stringify(userData));
    } catch (e) {
        return { success: false, message: '存储失败' };
    }

    // 重新创建会话
    const session = {
        username: username,
        loginTime: new Date().toISOString(),
        deviceKey: oldDeviceKey
    };

    try {
        localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch (e) {}

    return { success: true, message: '密码修改成功' };
}

/**
 * 检查是否已登录
 * @returns {boolean}
 */
export function isLoggedIn() {
    try {
        return !!localStorage.getItem(SESSION_KEY);
    } catch (e) {
        return false;
    }
}

/**
 * 获取当前登录用户名
 * @returns {string|null}
 */
export function getCurrentUser() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        return session.username;
    } catch (e) {
        return null;
    }
}

/**
 * 获取设备密钥（用于加密 API Key）
 * @returns {string|null}
 */
export function getDeviceKey() {
    try {
        const raw = localStorage.getItem(SESSION_KEY);
        if (!raw) return null;
        const session = JSON.parse(raw);
        return session.deviceKey;
    } catch (e) {
        return null;
    }
}

/**
 * 加密存储 API Key
 * @param {string} modelId - 模型标识
 * @param {string} apiKey - API Key
 * @returns {Promise<boolean>}
 */
export async function storeApiKey(modelId, apiKey) {
    const deviceKey = getDeviceKey();
    if (!deviceKey) return false;

    try {
        const encrypted = await encrypt(apiKey, deviceKey);
        localStorage.setItem('byt_apikey_' + modelId, encrypted);
        return true;
    } catch (e) {
        console.error('存储 API Key 失败:', e);
        return false;
    }
}

/**
 * 读取解密后的 API Key
 * @param {string} modelId
 * @returns {Promise<string|null>}
 */
export async function getStoredApiKey(modelId) {
    const deviceKey = getDeviceKey();
    if (!deviceKey) return null;

    try {
        const encrypted = localStorage.getItem('byt_apikey_' + modelId);
        if (!encrypted) return null;
        return await decrypt(encrypted, deviceKey);
    } catch (e) {
        console.error('读取 API Key 失败:', e);
        return null;
    }
}

/**
 * 删除存储的 API Key
 * @param {string} modelId
 */
export function removeStoredApiKey(modelId) {
    try {
        localStorage.removeItem('byt_apikey_' + modelId);
    } catch (e) {}
}

/**
 * 获取所有已配置 Key 的模型列表
 * @returns {string[]}
 */
export function getConfiguredModelIds() {
    const ids = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && key.startsWith('byt_apikey_')) {
                ids.push(key.replace('byt_apikey_', ''));
            }
        }
    } catch (e) {}
    return ids;
}

/**
 * 简单哈希函数（非安全级别，仅防止明文存储）
 * @param {string} str
 * @returns {string}
 */
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // 转为32位整数
    }
    // 加盐混淆
    return 'h_' + Math.abs(hash).toString(36) + '_' + str.length.toString(36);
}

// 暴露到全局
window.register = register;
window.login = login;
window.logout = logout;
window.changePassword = changePassword;
window.isLoggedIn = isLoggedIn;
window.getCurrentUser = getCurrentUser;
window.storeApiKey = storeApiKey;
window.getStoredApiKey = getStoredApiKey;
window.removeStoredApiKey = removeStoredApiKey;
window.getConfiguredModelIds = getConfiguredModelIds;
