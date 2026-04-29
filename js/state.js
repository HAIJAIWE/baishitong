// ==================== state.js - 应用状态管理 ====================
// 百事通 v1.0 - 面向普通用户的职业探索应用

import { icon } from './utils/icons.js';

export const STORAGE_PREFIX = 'byt_';

// 默认状态
const defaultState = {
    username: '百事通用户',
    theme: 'dark',             // 'dark' | 'light'
    deviceMode: 'mobile',     // 'mobile' | 'desktop'
    currentModel: 'gpt-4o-mini', // 当前AI模型（Puter.js 免费）
    favorites: [],            // 收藏的职业ID列表 ['job_001', 'job_002']
    recentViewed: [],         // 最近浏览的职业 [{id, timestamp}]
    compareSlots: [],         // 对比槽位 [{id, name, icon}]
    exploredJobs: [],         // 已探索的职业ID（序列化为数组存储）
    stats: {
        totalExplored: 0,
        totalStepsCompleted: 0,
        activeDays: 0,
        streak: 0,
        lastActiveDate: null,
        aiQueries: 0,
        plansGenerated: 0,
        comparisons: 0,
        tipsViewed: 0,
        searches: 0,
        stepsCompleted: 0
    },
    achievements: {
        unlocked: []  // 已解锁的成就ID列表
    },
    checkin: {
        points: 0,              // 当前积分
        totalPoints: 0,         // 累计获得积分
        checkinDates: [],       // 签到日期列表 ['2026-04-28', ...]
        streak: 0,              // 当前连续签到天数
        maxStreak: 0,           // 历史最长连续签到
        lastCheckin: null,      // 最后签到日期
        level: 1                // 用户等级
    }
};

// 全局应用状态
export let appState = JSON.parse(JSON.stringify(defaultState));

// ==================== 状态持久化 ====================

/**
 * 从 localStorage 加载状态
 * 合并默认值，确保新增字段有默认值
 */
export function loadState() {
    try {
        const saved = localStorage.getItem(STORAGE_PREFIX + 'state');
        if (saved) {
            const parsed = JSON.parse(saved);
            // 深度合并：保留默认值，覆盖已保存的值
            appState = {
                ...defaultState,
                ...parsed,
                stats: {
                    ...defaultState.stats,
                    ...(parsed.stats || {})
                },
                achievements: {
                    unlocked: (parsed.achievements && parsed.achievements.unlocked) ? parsed.achievements.unlocked : []
                },
                checkin: {
                    ...defaultState.checkin,
                    ...(parsed.checkin || {})
                }
            };
        }
    } catch (e) {
        console.warn('加载状态失败，使用默认值:', e);
        appState = JSON.parse(JSON.stringify(defaultState));
    }

    // 检查是否新的一天，更新连续天数
    _checkActiveDay();
}

/**
 * 保存状态到 localStorage
 */
export function saveState() {
    try {
        localStorage.setItem(STORAGE_PREFIX + 'state', JSON.stringify(appState));
    } catch (e) {
        console.warn('保存状态失败:', e);
    }
}

// ==================== 统计管理 ====================

/**
 * 更新统计字段
 * @param {string} key - stats 中的字段名
 * @param {*} value - 新值
 */
export function updateStat(key, value) {
    if (key in appState.stats) {
        appState.stats[key] = value;
        saveState();
    }
}

/**
 * 记录今日活跃，更新连续天数
 * @private
 */
function _checkActiveDay() {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const lastDate = appState.stats.lastActiveDate;

    if (lastDate === today) {
        // 今天已经活跃过，无需更新
        return;
    }

    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (lastDate === yesterday) {
        // 昨天活跃过，连续天数 +1
        appState.stats.streak += 1;
    } else if (lastDate !== today) {
        // 断了连续，重置为1
        appState.stats.streak = 1;
    }

    appState.stats.activeDays += 1;
    appState.stats.lastActiveDate = today;
    saveState();
}

/**
 * 增加探索计数
 */
export function incrementExplored() {
    appState.stats.totalExplored += 1;
    saveState();
}

/**
 * 增加步骤完成计数
 */
export function incrementStepsCompleted() {
    appState.stats.totalStepsCompleted += 1;
    saveState();
}

// ==================== 最近浏览 ====================

/**
 * 添加最近浏览记录
 * @param {string} jobId - 职业 ID
 */
export function addRecentView(jobId) {
    if (!jobId) return;

    // 移除已有的相同记录
    appState.recentViewed = appState.recentViewed.filter(item => item.id !== jobId);

    // 添加到最前面
    appState.recentViewed.unshift({
        id: jobId,
        timestamp: Date.now()
    });

    // 最多保留 30 条
    if (appState.recentViewed.length > 30) {
        appState.recentViewed = appState.recentViewed.slice(0, 30);
    }

    saveState();
}

/**
 * 获取最近浏览列表
 * @param {number} [limit=10] - 返回数量
 * @returns {Array} 最近浏览的职业记录
 */
export function getRecentViewed(limit) {
    limit = limit || 10;
    return appState.recentViewed.slice(0, limit);
}

/**
 * 清空最近浏览
 */
export function clearRecentViewed() {
    appState.recentViewed = [];
    saveState();
}

// ==================== 收藏管理 ====================

/**
 * 切换收藏状态
 * @param {string} jobId - 职业 ID
 * @returns {boolean} 切换后的收藏状态（true=已收藏）
 */
export function toggleFavorite(jobId) {
    if (!jobId) return false;

    const index = appState.favorites.indexOf(jobId);
    if (index === -1) {
        appState.favorites.push(jobId);
        saveState();
        return true;
    } else {
        appState.favorites.splice(index, 1);
        saveState();
        return false;
    }
}

/**
 * 检查是否已收藏
 * @param {string} jobId - 职业 ID
 * @returns {boolean}
 */
export function isFavorite(jobId) {
    return appState.favorites.indexOf(jobId) !== -1;
}

/**
 * 获取所有收藏的职业 ID
 * @returns {Array<string>}
 */
export function getFavorites() {
    return appState.favorites.slice();
}

/**
 * 清空所有收藏
 */
export function clearFavorites() {
    appState.favorites = [];
    saveState();
}

// ==================== 已探索职业 ====================

/**
 * 标记职业为已探索
 * @param {string} jobId - 职业 ID
 */
export function markExplored(jobId) {
    if (!jobId) return;
    if (appState.exploredJobs.indexOf(jobId) === -1) {
        appState.exploredJobs.push(jobId);
        saveState();
    }
}

/**
 * 检查职业是否已探索
 * @param {string} jobId - 职业 ID
 * @returns {boolean}
 */
export function isExplored(jobId) {
    return appState.exploredJobs.indexOf(jobId) !== -1;
}

/**
 * 获取已探索职业数量
 * @returns {number}
 */
export function getExploredCount() {
    return appState.exploredJobs.length;
}

// ==================== 对比槽位管理 ====================

/**
 * 添加到对比槽位
 * @param {string} id - 职业 ID
 * @param {string} name - 职业名称
 * @param {string} icon - 职业图标（emoji）
 * @returns {boolean} 是否添加成功
 */
export function addToCompare(id, name, icon) {
    if (!id) return false;

    // 最多对比 3 个
    if (appState.compareSlots.length >= 3) {
        return false;
    }

    // 检查是否已在对比中
    if (appState.compareSlots.some(function(slot) { return slot.id === id; })) {
        return false;
    }

    appState.compareSlots.push({ id: id, name: name, icon: icon });
    saveState();
    return true;
}

/**
 * 从对比槽位移除
 * @param {string} jobId - 职业 ID
 */
export function removeFromCompare(jobId) {
    appState.compareSlots = appState.compareSlots.filter(function(slot) {
        return slot.id !== jobId;
    });
    saveState();
}

/**
 * 清空对比槽位
 */
export function clearCompare() {
    appState.compareSlots = [];
    saveState();
}

/**
 * 获取对比槽位
 * @returns {Array}
 */
export function getCompareSlots() {
    return appState.compareSlots.slice();
}

/**
 * 检查是否在对比中
 * @param {string} jobId
 * @returns {boolean}
 */
export function isInCompare(jobId) {
    return appState.compareSlots.some(function(slot) { return slot.id === jobId; });
}

// ==================== 主题管理 ====================

/**
 * 获取当前主题
 * @returns {string} 'dark' | 'light'
 */
export function getTheme() {
    return appState.theme;
}

/**
 * 设置主题
 * @param {string} theme - 'dark' | 'light'
 */
export function setTheme(theme) {
    if (theme !== 'dark' && theme !== 'light') return;
    appState.theme = theme;
    saveState();
}

export function setUsername(name) {
    if (!name || typeof name !== 'string') return;
    name = name.trim().substring(0, 12);
    if (name.length === 0) return;
    appState.username = name;
    saveState();
}

// ==================== API Key 管理 ====================

/**
 * 获取指定模型的 API Key
 * @param {string} modelId - 模型标识
 * @returns {string|null}
 */
export function getApiKey(modelId) {
    try {
        return localStorage.getItem(STORAGE_PREFIX + 'apikey_' + modelId) || null;
    } catch (e) {
        return null;
    }
}

/**
 * 设置指定模型的 API Key
 * @param {string} modelId - 模型标识
 * @param {string} key - API Key
 */
export function setApiKey(modelId, key) {
    try {
        if (key) {
            localStorage.setItem(STORAGE_PREFIX + 'apikey_' + modelId, key);
        } else {
            localStorage.removeItem(STORAGE_PREFIX + 'apikey_' + modelId);
        }
    } catch (e) {
        console.warn('保存 API Key 失败:', e);
    }
}

// ==================== AI 模型管理 ====================

/**
 * 获取当前 AI 模型
 * @returns {string}
 */
export function getCurrentModel() {
    return appState.currentModel;
}

/**
 * 设置当前 AI 模型
 * @param {string} modelId
 */
export function setCurrentModel(modelId) {
    appState.currentModel = modelId;
    saveState();
}

// ==================== 设备模式管理 ====================

/**
 * 获取当前设备模式
 * @returns {string} 'mobile' | 'desktop'
 */
export function getDeviceMode() {
    // 如果用户已手动选择过模式，使用用户选择
    if (appState.deviceMode) return appState.deviceMode;
    // 自动检测：屏幕宽度 >= 768px 使用桌面模式
    if (window.innerWidth >= 768) return 'desktop';
    return 'mobile';
}

/**
 * 设置设备模式
 * @param {string} mode - 'mobile' | 'desktop'
 */
export function setDeviceMode(mode) {
    if (mode !== 'mobile' && mode !== 'desktop') return;
    appState.deviceMode = mode;
    saveState();
}

// ==================== 签到与积分管理 ====================

// 等级配置
const LEVEL_CONFIG = [
    { level: 1, name: '新手探索者', minPoints: 0, icon: 'sprout' },
    { level: 2, name: '职业学徒', minPoints: 50, icon: 'bookOpen' },
    { level: 3, name: '行业达人', minPoints: 200, icon: 'star' },
    { level: 4, name: '职场精英', minPoints: 500, icon: 'sun' },
    { level: 5, name: '百事通大师', minPoints: 1000, icon: 'crown' },
    { level: 6, name: '传奇智者', minPoints: 2000, icon: 'sparkles' }
];

// 积分奖励配置
const POINT_REWARDS = {
    dailyCheckin: 10,       // 每日签到
    streakBonus: [0, 0, 5, 10, 15, 20, 30, 50], // 连续签到奖励 [0天,1天,2天,3天,4天,5天,6天,7天+]
    exploreJob: 5,          // 探索职业
    favoriteJob: 2,         // 收藏职业
    aiQuestion: 3,          // AI提问
    communityPost: 8,       // 发帖
    communityComment: 3,    // 评论
    achievementUnlock: 20,  // 解锁成就
    compareJobs: 5          // 对比职业
};

/**
 * 获取等级配置
 * @returns {Array}
 */
export function getLevelConfig() {
    return LEVEL_CONFIG.slice();
}

/**
 * 获取积分奖励配置
 * @returns {Object}
 */
export function getPointRewards() {
    return Object.assign({}, POINT_REWARDS);
}

/**
 * 根据积分计算等级
 * @param {number} points
 * @returns {Object} 等级信息
 */
export function calcLevel(points) {
    let current = LEVEL_CONFIG[0];
    for (let i = LEVEL_CONFIG.length - 1; i >= 0; i--) {
        if (points >= LEVEL_CONFIG[i].minPoints) {
            current = LEVEL_CONFIG[i];
            break;
        }
    }
    return current;
}

/**
 * 获取签到信息
 * @returns {Object}
 */
export function getCheckinInfo() {
    return Object.assign({}, appState.checkin);
}

/**
 * 检查今天是否已签到
 * @returns {boolean}
 */
export function hasCheckedInToday() {
    const today = new Date().toISOString().split('T')[0];
    return (appState.checkin.checkinDates || []).indexOf(today) !== -1;
}

/**
 * 执行签到
 * @returns {Object} { success, points, streak, bonus, message }
 */
export function doCheckin() {
    const today = new Date().toISOString().split('T')[0];

    // 已签到
    if (hasCheckedInToday()) {
        return { success: false, points: 0, streak: 0, bonus: 0, message: '今天已经签到过了' };
    }

    // 计算连续签到
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let newStreak = 1;
    if (appState.checkin.lastCheckin === yesterday) {
        newStreak = (appState.checkin.streak || 0) + 1;
    }

    // 计算积分
    let basePoints = POINT_REWARDS.dailyCheckin;
    let bonusPoints = 0;
    const streakIndex = Math.min(newStreak, POINT_REWARDS.streakBonus.length - 1);
    bonusPoints = POINT_REWARDS.streakBonus[streakIndex] || 0;

    const totalEarned = basePoints + bonusPoints;

    // 更新状态
    appState.checkin.checkinDates.push(today);
    appState.checkin.streak = newStreak;
    appState.checkin.lastCheckin = today;
    appState.checkin.points += totalEarned;
    appState.checkin.totalPoints += totalEarned;
    if (newStreak > (appState.checkin.maxStreak || 0)) {
        appState.checkin.maxStreak = newStreak;
    }

    // 更新等级
    const newLevel = calcLevel(appState.checkin.points);
    appState.checkin.level = newLevel.level;

    saveState();

    // 构建消息
    let message = '签到成功！+' + totalEarned + '积分';
    if (bonusPoints > 0) {
        message += '（含连续' + newStreak + '天奖励+' + bonusPoints + '）';
    }

    return {
        success: true,
        points: totalEarned,
        streak: newStreak,
        bonus: bonusPoints,
        level: newLevel,
        message: message
    };
}

/**
 * 增加积分（用于其他行为奖励）
 * @param {string} action - 行为类型（对应 POINT_REWARDS 的 key）
 * @returns {number} 获得的积分
 */
export function addPoints(action) {
    const reward = POINT_REWARDS[action];
    if (!reward) return 0;

    appState.checkin.points += reward;
    appState.checkin.totalPoints += reward;

    const newLevel = calcLevel(appState.checkin.points);
    appState.checkin.level = newLevel.level;

    saveState();
    return reward;
}

/**
 * 消耗积分
 * @param {number} amount
 * @returns {boolean} 是否成功
 */
export function spendPoints(amount) {
    if (appState.checkin.points < amount) return false;
    appState.checkin.points -= amount;
    saveState();
    return true;
}

/**
 * 获取签到日历数据（当月）
 * @param {number} year
 * @param {number} month
 * @returns {Array} 已签到的日期数组
 */
export function getCheckinCalendar(year, month) {
    const prefix = year + '-' + String(month + 1).padStart(2, '0');
    return (appState.checkin.checkinDates || []).filter(function(d) {
        return d.indexOf(prefix) === 0;
    }).map(function(d) {
        return parseInt(d.split('-')[2], 10);
    });
}

// ==================== 重置状态 ====================

/**
 * 重置所有状态到默认值
 */
export function resetState() {
    appState = JSON.parse(JSON.stringify(defaultState));
    saveState();
}

// ==================== 成就管理 ====================

/**
 * 获取已解锁的成就ID列表
 * @returns {Array<string>}
 */
export function getUnlockedAchievements() {
    return (appState.achievements && appState.achievements.unlocked) ? appState.achievements.unlocked.slice() : [];
}

/**
 * 检查成就是否已解锁
 * @param {string} id - 成就ID
 * @returns {boolean}
 */
export function isAchievementUnlocked(id) {
    const unlocked = getUnlockedAchievements();
    return unlocked.indexOf(id) !== -1;
}

/**
 * 解锁成就
 * @param {string} id - 成就ID
 */
export function unlockAchievement(id) {
    if (!id) return;
    if (!appState.achievements) {
        appState.achievements = { unlocked: [] };
    }
    if (appState.achievements.unlocked.indexOf(id) !== -1) return;

    appState.achievements.unlocked.push(id);
    saveState();

    // 查找成就名称
    const achievements = window.ACHIEVEMENTS || [];
    let achName = '';
    for (let i = 0; i < achievements.length; i++) {
        if (achievements[i].id === id) {
            achName = achievements[i].name || id;
            break;
        }
    }

    // 延迟引用 showToast，避免与 ui.js 的循环依赖
    if (typeof window.showToast === 'function') {
        const msgEl = document.createElement('span');
        msgEl.appendChild(icon('trophy', 16, 'var(--accent)'));
        msgEl.appendChild(document.createTextNode(' 成就解锁：' + achName));
        window.showToast(msgEl, 'success', 4000);
    }
}

/**
 * 检查并解锁成就（条件满足时自动解锁）
 * @param {string} id - 成就ID
 */
export function checkAchievement(id) {
    if (!id || isAchievementUnlocked(id)) return;

    let shouldUnlock = false;

    switch (id) {
        case 'first_task':
            shouldUnlock = (appState.exploredJobs && appState.exploredJobs.length >= 1);
            break;
        case 'five_tasks':
            shouldUnlock = (appState.exploredJobs && appState.exploredJobs.length >= 5);
            break;
        case 'ten_tasks':
            shouldUnlock = (appState.exploredJobs && appState.exploredJobs.length >= 10);
            break;
        case 'twenty_tasks':
            shouldUnlock = (appState.exploredJobs && appState.exploredJobs.length >= 20);
            break;
        case 'fifty_tasks':
            shouldUnlock = (appState.exploredJobs && appState.exploredJobs.length >= 50);
            break;
        case 'hundred_tasks':
            shouldUnlock = (appState.exploredJobs && appState.exploredJobs.length >= 100);
            break;
        case 'first_star':
            shouldUnlock = (appState.favorites && appState.favorites.length >= 1);
            break;
        case 'five_stars':
            shouldUnlock = (appState.favorites && appState.favorites.length >= 5);
            break;
        case 'ten_stars':
            shouldUnlock = (appState.favorites && appState.favorites.length >= 10);
            break;
        case 'streak_3':
            shouldUnlock = (appState.stats && appState.stats.streak >= 3);
            break;
        case 'streak_7':
            shouldUnlock = (appState.stats && appState.stats.streak >= 7);
            break;
        case 'streak_14':
            shouldUnlock = (appState.stats && appState.stats.streak >= 14);
            break;
        case 'streak_30':
            shouldUnlock = (appState.stats && appState.stats.streak >= 30);
            break;
        case 'streak_60':
            shouldUnlock = (appState.stats && appState.stats.streak >= 60);
            break;
        case 'active_5':
            shouldUnlock = (appState.stats && appState.stats.activeDays >= 5);
            break;
        case 'active_15':
            shouldUnlock = (appState.stats && appState.stats.activeDays >= 15);
            break;
        case 'active_30':
            shouldUnlock = (appState.stats && appState.stats.activeDays >= 30);
            break;
        case 'first_ai':
            shouldUnlock = (appState.stats && appState.stats.aiQueries >= 1);
            break;
        case 'ai_five':
            shouldUnlock = (appState.stats && appState.stats.aiQueries >= 5);
            break;
        case 'ai_twenty':
            shouldUnlock = (appState.stats && appState.stats.aiQueries >= 20);
            break;
        case 'first_plan':
            shouldUnlock = (appState.stats && appState.stats.plansGenerated >= 1);
            break;
        case 'first_compare':
            shouldUnlock = (appState.stats && appState.stats.comparisons >= 1);
            break;
        case 'first_tip':
            shouldUnlock = (appState.stats && appState.stats.tipsViewed >= 1);
            break;
        case 'tips_ten':
            shouldUnlock = (appState.stats && appState.stats.tipsViewed >= 10);
            break;
        case 'first_search':
            shouldUnlock = (appState.stats && appState.stats.searches >= 1);
            break;
        case 'first_step':
            shouldUnlock = (appState.stats && appState.stats.stepsCompleted >= 1);
            break;
        case 'steps_ten':
            shouldUnlock = (appState.stats && appState.stats.stepsCompleted >= 10);
            break;
        case 'steps_fifty':
            shouldUnlock = (appState.stats && appState.stats.stepsCompleted >= 50);
            break;
        default:
            break;
    }

    if (shouldUnlock) {
        unlockAchievement(id);
    }
}

// ==================== 保留全局导出 ====================
window.appState = appState;
window.loadState = loadState;
window.saveState = saveState;
window.updateStat = updateStat;
window.incrementExplored = incrementExplored;
window.incrementStepsCompleted = incrementStepsCompleted;
window.addRecentView = addRecentView;
window.getRecentViewed = getRecentViewed;
window.clearRecentViewed = clearRecentViewed;
window.toggleFavorite = toggleFavorite;
window.isFavorite = isFavorite;
window.getFavorites = getFavorites;
window.clearFavorites = clearFavorites;
window.markExplored = markExplored;
window.isExplored = isExplored;
window.getExploredCount = getExploredCount;
window.addToCompare = addToCompare;
window.removeFromCompare = removeFromCompare;
window.clearCompare = clearCompare;
window.getCompareSlots = getCompareSlots;
window.isInCompare = isInCompare;
window.getTheme = getTheme;
window.setTheme = setTheme;
window.getDeviceMode = getDeviceMode;
window.setDeviceMode = setDeviceMode;
window.getApiKey = getApiKey;
window.setApiKey = setApiKey;
window.getCurrentModel = getCurrentModel;
window.setCurrentModel = setCurrentModel;
window.resetState = resetState;
window.getUnlockedAchievements = getUnlockedAchievements;
window.isAchievementUnlocked = isAchievementUnlocked;
window.unlockAchievement = unlockAchievement;
window.checkAchievement = checkAchievement;
