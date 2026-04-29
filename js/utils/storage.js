// ==================== storage.js - localStorage 封装 ====================
// 百事通 v1.0

import { STORAGE_PREFIX } from '../state.js';

/**
 * 从 localStorage 读取值
 * @param {string} key - 键名（不含前缀）
 * @param {*} defaultValue - 默认值（键不存在时返回）
 * @returns {*} 解析后的值或默认值
 */
export function storageGet(key, defaultValue) {
    try {
        const fullKey = STORAGE_PREFIX + key;
        const raw = localStorage.getItem(fullKey);
        if (raw === null || raw === undefined) {
            return defaultValue;
        }
        // 尝试 JSON 解析
        try {
            return JSON.parse(raw);
        } catch (e) {
            // 非 JSON 字符串，直接返回
            return raw;
        }
    } catch (e) {
        console.warn('storageGet 失败:', key, e);
        return defaultValue;
    }
}

/**
 * 写入 localStorage
 * @param {string} key - 键名（不含前缀）
 * @param {*} value - 要存储的值（自动 JSON 序列化）
 */
export function storageSet(key, value) {
    try {
        const fullKey = STORAGE_PREFIX + key;
        if (value === undefined || value === null) {
            localStorage.removeItem(fullKey);
            return;
        }
        // 对象/数组/布尔值/数字使用 JSON 序列化
        if (typeof value === 'object' || typeof value === 'boolean' || typeof value === 'number') {
            localStorage.setItem(fullKey, JSON.stringify(value));
        } else {
            localStorage.setItem(fullKey, String(value));
        }
    } catch (e) {
        console.warn('storageSet 失败:', key, e);
        // 可能是存储空间满了
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error('localStorage 存储空间已满');
        }
    }
}

/**
 * 从 localStorage 删除指定键
 * @param {string} key - 键名（不含前缀）
 */
export function storageRemove(key) {
    try {
        localStorage.removeItem(STORAGE_PREFIX + key);
    } catch (e) {
        console.warn('storageRemove 失败:', key, e);
    }
}

/**
 * 清空所有带前缀的数据
 * 不会清除其他应用的数据
 */
export function storageClear() {
    try {
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf(STORAGE_PREFIX) === 0) {
                keysToRemove.push(k);
            }
        }
        keysToRemove.forEach(function(k) {
            localStorage.removeItem(k);
        });
    } catch (e) {
        console.warn('storageClear 失败:', e);
    }
}

/**
 * 获取所有带前缀的键名
 * @returns {Array<string>}
 */
export function storageKeys() {
    const keys = [];
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k && k.indexOf(STORAGE_PREFIX) === 0) {
                keys.push(k.substring(STORAGE_PREFIX.length));
            }
        }
    } catch (e) {
        console.warn('storageKeys 失败:', e);
    }
    return keys;
}

/**
 * 检查键是否存在
 * @param {string} key - 键名（不含前缀）
 * @returns {boolean}
 */
export function storageHas(key) {
    try {
        return localStorage.getItem(STORAGE_PREFIX + key) !== null;
    } catch (e) {
        return false;
    }
}
