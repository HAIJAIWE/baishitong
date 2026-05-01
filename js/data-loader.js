// data-loader.js - 智能数据加载器 v3
// 策略：索引秒开 + 按需加载分类数据
// 首屏仅加载索引（~300KB），打开职业详情时按需加载对应分类
let _jobsData = null;        // 索引数据（轻量）
let _categoriesData = null;
let _achievementsData = null;
const _fullJobsCache = {};     // 完整数据缓存 { jobId: jobObject }
const _groupLoadState = {};    // 各分类加载状态 { group: 'loading'|'loaded'|'error' }
const _groupLoadPromises = {}; // 各分类加载 Promise（避免重复请求）

// group → JSON 文件映射
const GROUP_FILES = {
    'leader': 'js/data/jobs/jobs_leader.json',
    'professional': 'js/data/jobs/jobs_professional.json',
    'clerk': 'js/data/jobs/jobs_clerk.json',
    'service': 'js/data/jobs/jobs_service.json',
    'agriculture': 'js/data/jobs/jobs_agriculture.json',
    'manufacturing': 'js/data/jobs/jobs_manufacturing.json',
    'military': 'js/data/jobs/jobs_military.json',
    'other': 'js/data/jobs/jobs_other.json'
};

/**
 * 加载索引数据（秒开，~300KB）
 * 不再 await 加载完整数据，改为按需加载
 */
export async function loadData() {
    if (_jobsData) return;

    // 仅加载索引 + 分类 + 成就（~300KB，秒开）
    const [indexRes, catRes, achRes] = await Promise.all([
        fetch('js/data/jobs_index.json'),
        fetch('js/data/categories.json'),
        fetch('js/data/achievements.json')
    ]);

    _jobsData = await indexRes.json();
    _categoriesData = await catRes.json();
    _achievementsData = await achRes.json();

    // 构建全局变量
    window.INDUSTRY_GROUPS = _categoriesData.industryGroups;
    window.JOB_CATEGORIES = _categoriesData.midCategories;
    window.JOB_CATEGORY_MAP = _categoriesData.categoryMap;
    window.ACHIEVEMENTS = _achievementsData;

    // 用索引数据构建 JOB_TEMPLATES（列表/搜索立刻可用）
    const JOB_TEMPLATES = {};
    _jobsData.jobs.forEach(job => {
        JOB_TEMPLATES[job.id] = job;
    });
    window.JOB_TEMPLATES = JOB_TEMPLATES;
    window._jobsData = _jobsData;
    window._categoriesData = _categoriesData;

    console.log('[数据] 索引加载完成: ' + _jobsData.totalJobs + '个职业（完整数据按需加载）');

    // 延迟预加载：等用户浏览3秒后再开始预加载，避免影响首屏加载速度
    setTimeout(function() {
        _preloadVisibleGroups();
    }, 3000);
}

/**
 * 延迟预加载常用分类数据（只加载最常用的几个，避免一次性下载20MB）
 */
function _preloadVisibleGroups() {
    // 只预加载最常用的3个分类（约8MB），其余按需加载
    var priorityGroups = ['service', 'professional', 'manufacturing'];
    priorityGroups.forEach(function(group) {
        _loadGroup(group);
    });
}

/**
 * 加载指定分类的完整数据
 * @param {string} group - 分类 ID（如 'professional'）
 * @returns {Promise<boolean>} 是否加载成功
 */
async function _loadGroup(group) {
    // 已加载过，直接返回
    if (_groupLoadState[group] === 'loaded') return true;

    // 正在加载中，等待同一个 Promise
    if (_groupLoadPromises[group]) {
        return _groupLoadPromises[group];
    }

    const file = GROUP_FILES[group];
    if (!file) return false;

    _groupLoadState[group] = 'loading';

    _groupLoadPromises[group] = fetch(file)
        .then(function(r) { return r.ok ? r.json() : null; })
        .catch(function() { return null; })
        .then(function(data) {
            if (data && data.jobs) {
                data.jobs.forEach(function(job) {
                    _fullJobsCache[job.id] = job;
                    // 升级 JOB_TEMPLATES 为完整版
                    if (window.JOB_TEMPLATES) {
                        window.JOB_TEMPLATES[job.id] = job;
                    }
                });
                _groupLoadState[group] = 'loaded';
                console.log('[数据] 分类 [' + group + '] 加载完成: ' + data.jobs.length + '个职业');
                return true;
            } else {
                _groupLoadState[group] = 'error';
                console.warn('[数据] 分类 [' + group + '] 加载失败');
                return false;
            }
        });

    return _groupLoadPromises[group];
}

/**
 * 根据职业ID加载其所属分类的完整数据
 * @param {string} jobId
 * @returns {Promise<boolean>}
 */
async function _loadJobGroup(jobId) {
    // 如果缓存中已有完整数据，直接返回
    if (_fullJobsCache[jobId]) return true;

    // 从索引中查找该职业的 group
    const indexJob = _jobsData && _jobsData.jobs.find(function(j) { return j.id === jobId; });
    if (!indexJob || !indexJob.group) return false;

    return _loadGroup(indexJob.group);
}

/**
 * 获取职业数据（同步，返回缓存中的数据）
 * 完整数据加载完成后返回完整版，否则返回索引版
 */
export function getJob(id) {
    return _fullJobsCache[id] || (window.JOB_TEMPLATES && window.JOB_TEMPLATES[id]) || null;
}

/**
 * 获取职业完整数据（异步，确保数据已加载）
 * 用于打开职业详情等需要完整数据的场景
 * @param {string} jobId
 * @returns {Promise<Object|null>}
 */
export async function getJobFull(jobId) {
    // 先检查缓存
    if (_fullJobsCache[jobId]) return _fullJobsCache[jobId];

    // 按需加载对应分类
    const loaded = await _loadJobGroup(jobId);
    if (loaded) return _fullJobsCache[jobId] || null;

    // 加载失败，返回索引版
    return getJob(jobId);
}

/**
 * 确保完整数据可用（兼容旧代码）
 * @deprecated 建议使用 getJobFull(jobId) 替代
 */
export async function ensureFullData() {
    // 等待所有分类加载完成
    const promises = Object.keys(GROUP_FILES).map(function(g) { return _loadGroup(g); });
    await Promise.all(promises);
}

/**
 * 检查职业是否有完整数据
 * @param {string} jobId
 * @returns {boolean}
 */
export function hasFullData(jobId) {
    return !!_fullJobsCache[jobId];
}

export function getJobsByCategory(catId) {
    if (!_jobsData) return [];
    return _jobsData.jobs.filter(function(j) { return (window.JOB_CATEGORY_MAP || {})[j.id] === catId; });
}

export function getCategoriesByGroup(groupId) {
    if (!_categoriesData) return [];
    const group = _categoriesData.industryGroups.find(function(g) { return g.id === groupId; });
    return group ? group.midCategories : [];
}

// ==================== 保留全局导出（很多页面直接读取 window.JOB_TEMPLATES 等运行时变量） ====================
window.loadData = loadData;
window.getJob = getJob;
window.getJobFull = getJobFull;
window.hasFullData = hasFullData;
window.ensureFullData = ensureFullData;
window.getJobsByCategory = getJobsByCategory;
window.getCategoriesByGroup = getCategoriesByGroup;
