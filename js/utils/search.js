// ==================== search.js - 搜索工具 ====================
// 百事通 v1.0

import { getRecentViewed } from '../state.js';

/**
 * 搜索职业
 * 在职业名称、描述、ID中搜索关键词
 * @param {string} keyword - 搜索关键词
 * @param {number} [limit=20] - 返回结果数量上限
 * @returns {Array} 匹配的职业列表
 */
export function searchJobs(keyword, limit) {
    if (!keyword || typeof keyword !== 'string') return [];
    limit = limit || 20;

    // 确保数据已加载
    if (typeof window._jobsData === 'undefined' || !window._jobsData) {
        console.warn('职业数据未加载，无法搜索');
        return [];
    }

    const kw = keyword.toLowerCase().trim();
    if (!kw) return [];

    const results = [];

    window._jobsData.jobs.forEach(function(job) {
        let score = 0;

        // 名称匹配（权重最高）
        if (job.name && job.name.toLowerCase().indexOf(kw) !== -1) {
            score += 10;
            // 名称完全匹配，额外加分
            if (job.name.toLowerCase() === kw) {
                score += 20;
            }
        }

        // ID 匹配
        if (job.id && job.id.toLowerCase().indexOf(kw) !== -1) {
            score += 5;
        }

        // 描述匹配
        if (job.desc && job.desc.toLowerCase().indexOf(kw) !== -1) {
            score += 3;
        }

        // 分类匹配
        if (job.category && job.category.toLowerCase().indexOf(kw) !== -1) {
            score += 2;
        }

        // 标签匹配
        if (job.tags && Array.isArray(job.tags)) {
            job.tags.forEach(function(tag) {
                if (tag.toLowerCase().indexOf(kw) !== -1) {
                    score += 4;
                }
            });
        }

        if (score > 0) {
            results.push({ job: job, score: score });
        }
    });

    // 按分数降序排列
    results.sort(function(a, b) {
        return b.score - a.score;
    });

    // 返回职业对象列表
    return results.slice(0, limit).map(function(item) {
        return item.job;
    });
}

/**
 * 按分类筛选职业
 * @param {Array} jobs - 职业列表
 * @param {string} categoryId - 分类 ID
 * @returns {Array} 筛选后的职业列表
 */
export function filterByCategory(jobs, categoryId) {
    if (!Array.isArray(jobs)) return [];
    if (!categoryId) return jobs;

    // 使用全局分类映射
    const categoryMap = window.JOB_CATEGORY_MAP || {};

    return jobs.filter(function(job) {
        return categoryMap[job.id] === categoryId;
    });
}

/**
 * 按行业组筛选
 * @param {Array} jobs - 职业列表
 * @param {string} groupId - 行业组 ID
 * @returns {Array}
 */
export function filterByGroup(jobs, groupId) {
    if (!Array.isArray(jobs)) return [];
    if (!groupId) return jobs;

    const categoryMap = window.JOB_CATEGORY_MAP || {};
    const industryGroups = window.INDUSTRY_GROUPS || [];

    // 找到该行业组下的所有分类
    let groupCategories = [];
    industryGroups.forEach(function(group) {
        if (group.id === groupId && Array.isArray(group.midCategories)) {
            groupCategories = group.midCategories.map(function(cat) {
                return cat.id;
            });
        }
    });

    if (groupCategories.length === 0) return [];

    return jobs.filter(function(job) {
        return groupCategories.indexOf(categoryMap[job.id]) !== -1;
    });
}

/**
 * 排序职业列表
 * @param {Array} jobs - 职业列表
 * @param {string} field - 排序字段（'name' | 'id' | 'category'）
 * @param {string} [order='asc'] - 排序方向 'asc' | 'desc'
 * @returns {Array} 排序后的列表
 */
export function sortByField(jobs, field, order) {
    if (!Array.isArray(jobs)) return [];
    field = field || 'name';
    order = order || 'asc';

    const sorted = jobs.slice(); // 不修改原数组

    sorted.sort(function(a, b) {
        let valA = a[field] || '';
        let valB = b[field] || '';

        // 字符串比较
        if (typeof valA === 'string') {
            valA = valA.toLowerCase();
            valB = valB.toLowerCase();
        }

        if (valA < valB) return order === 'asc' ? -1 : 1;
        if (valA > valB) return order === 'asc' ? 1 : -1;
        return 0;
    });

    return sorted;
}

/**
 * 随机推荐职业
 * @param {number} [count=6] - 推荐数量
 * @param {Array} [excludeIds=[]] - 要排除的职业 ID
 * @returns {Array} 随机职业列表
 */
export function getRandomJobs(count, excludeIds) {
    count = count || 6;
    excludeIds = excludeIds || [];

    if (typeof window._jobsData === 'undefined' || !window._jobsData) {
        return [];
    }

    const pool = window._jobsData.jobs.filter(function(job) {
        return excludeIds.indexOf(job.id) === -1;
    });

    // Fisher-Yates 洗牌
    for (let i = pool.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = pool[i];
        pool[i] = pool[j];
        pool[j] = temp;
    }

    return pool.slice(0, count);
}

/**
 * 获取热门职业（基于已探索数量最多的分类）
 * @param {number} [limit=10]
 * @returns {Array}
 */
export function getPopularJobs(limit) {
    if (typeof window._jobsData === 'undefined' || !window._jobsData) {
        return [];
    }

    limit = limit || 10;
    // 返回前 N 个职业（数据中排在前面的通常是比较热门的）
    return window._jobsData.jobs.slice(0, limit);
}

/**
 * 精选热门职业列表（用于首页推荐）
 * 混合型：接地气 + 实用求职 + 新潮有趣，覆盖普通人真实生活
 */
const FEATURED_JOBS = [
    // === 接地气：普通人日常接触的职业 ===
    'delivery_rider',        // 外卖骑手
    'courier',               // 快递打包员
    'rideshare_driver',      // 网约车司机
    'cashier',               // 收银员
    'waiter',                // 餐厅服务员
    'cleaner',               // 保洁员
    'security_guard',        // 保安
    'supermarket',           // 超市理货员
    'construction_worker',   // 建筑工人
    'bus_driver',            // 公交司机
    'taxi_driver',           // 出租车司机
    'housekeeper',           // 酒店客房整理员

    // === 实用求职：有门槛但普通人能做的职业 ===
    'programmer',            // 程序员
    'nurse',                 // 护士
    'accountant',            // 会计
    'kindergarten_teacher',  // 幼儿园老师
    'electrician',           // 电工
    'chef',                  // 厨师
    'beautician',            // 美容师
    'barista',               // 咖啡师
    'photographer',          // 摄影师
    'fitness_trainer',       // 健身教练
    'hr_specialist',         // 人事专员
    'car_mechanic',          // 汽车修理工
    'welder',                // 焊工
    'online_seller',         // 电商运营
    'real_estate_agent',     // 房产中介
    'driving_instructor',    // 驾校教练
    'veterinarian',          // 兽医
    'psychologist',          // 心理咨询师
    'graphic_designer',      // 平面设计师
    'civil_servant',         // 公务员
    'police_officer',        // 人民警察
    'doctor',                // 医生
    'lawyer',                // 律师
    'primary_teacher',       // 小学老师
    'pharmacist',            // 药剂师
    'bank_clerk',            // 银行柜员

    // === 新潮有趣：年轻人感兴趣的新兴/小众职业 ===
    'hanfu_stylist',         // 汉服造型师
    'ai_tester',             // 生成式AI系统测试员
    'drone_show_planner',    // 无人机编队飞行规划员
    'game_face_maker',       // 游戏捏脸师
    'cross_border_ecom_op',  // 跨境电商运营管理师
    'pet_trainer_pro',       // 服务犬驯养师
    'travel_photo_planner',  // 旅拍定制师
    'nail_livestreamer',     // 美甲直播展示师
    'preserved_flower_maker',// 保鲜花制作工
    'bbq_chef_pro',          // 烧烤料理师
    'sleep_manager',         // 睡眠健康管理师
    'tea_taster',            // 品茶师
    'esports_coach',         // 电竞教练
    'pet_funeral_director',  // 宠物殡葬师
    'cloud_maker',           // 云朵制作师
    'food_stylist_pro',      // 美食造型师
    'wardrobe_consultant',   // 衣橱整理师
    'smart_warehouse_op',    // 智慧仓运维员
    'stunt_coordinator_pro', // 特技协调员
    'confession_writer',     // 代写情书/文案

    // === 农林牧渔 ===
    'farmer',                // 农民
    'fisherman',             // 渔民

    // === 军人 ===
    'special_forces',        // 特种兵
    'airforce_pilot',        // 空军飞行员
];

/**
 * 智能推荐职业（用于首页热门推荐）
 * 策略：精选职业池 + 分类多样性 + 浏览偏好加权
 * @param {number} [count=8] - 推荐数量
 * @returns {Array<{job:Object, reason:string}>} 推荐列表
 */
export function getSmartRecommendations(count) {
    count = count || 8;
    const allJobs = window._jobsData ? window._jobsData.jobs : [];
    if (!allJobs.length) return [];

    const categoryMap = window.JOB_CATEGORY_MAP || {};
    const recentViewed = getRecentViewed(30);

    // 统计用户浏览过的分类偏好
    const catPreference = {};
    recentViewed.forEach(function(item) {
        const cat = categoryMap[item.id];
        if (cat) {
            catPreference[cat] = (catPreference[cat] || 0) + 1;
        }
    });

    // 构建精选池
    const featuredPool = [];
    FEATURED_JOBS.forEach(function(jid) {
        const job = allJobs.find(function(j) { return j.id === jid; });
        if (job) featuredPool.push(job);
    });

    // 如果精选池不够，从全部职业中补充热门（取每个分类前几个）
    if (featuredPool.length < count * 2) {
        const existingIds = {};
        featuredPool.forEach(function(j) { existingIds[j.id] = true; });
        allJobs.forEach(function(job) {
            if (!existingIds[job.id] && featuredPool.length < count * 3) {
                featuredPool.push(job);
                existingIds[job.id] = true;
            }
        });
    }

    // 打分排序
    const scored = featuredPool.map(function(job) {
        let score = 0;
        let reason = '';

        // 精选加分
        if (FEATURED_JOBS.indexOf(job.id) !== -1) {
            score += 50;
        }

        // 用户偏好分类加分
        const cat = categoryMap[job.id];
        if (cat && catPreference[cat]) {
            score += catPreference[cat] * 10;
        }

        // 未浏览过的加分（推荐新内容）
        const viewed = recentViewed.some(function(item) { return item.id === job.id; });
        if (!viewed) {
            score += 15;
        }

        // 添加随机因子（避免每次一样）
        score += Math.random() * 20;

        // 决定推荐理由（更贴近普通人视角）
        if (cat && catPreference[cat] && catPreference[cat] >= 2) {
            reason = '你可能会感兴趣';
        } else if (FEATURED_JOBS.indexOf(job.id) !== -1 && viewed) {
            reason = '值得再看一看';
        } else if (!viewed && FEATURED_JOBS.indexOf(job.id) !== -1) {
            // 根据职业类型给不同理由
            const downToEarth = ['delivery_rider','courier','rideshare_driver','cashier','waiter','cleaner',
                'security_guard','supermarket','construction_worker','bus_driver','taxi_driver','housekeeper',
                'parking_attendant','farmer','fisherman'];
            const trendy = ['hanfu_stylist','ai_tester','drone_show_planner','game_face_maker',
                'cross_border_ecom_op','pet_trainer_pro','travel_photo_planner','nail_livestreamer',
                'preserved_flower_maker','bbq_chef_pro','sleep_manager','tea_taster','esports_coach',
                'pet_funeral_director','cloud_maker','food_stylist_pro','wardrobe_consultant',
                'smart_warehouse_op','stunt_coordinator_pro','confession_writer'];
            if (downToEarth.indexOf(job.id) !== -1) {
                const reasons1 = ['身边常见的好工作', '门槛低收入稳', '很多人在做', '就业容易上手快'];
                reason = reasons1[Math.floor(Math.random() * reasons1.length)];
            } else if (trendy.indexOf(job.id) !== -1) {
                const reasons2 = ['新兴职业', '年轻人关注', '新赛道新机会', '了解一下不吃亏'];
                reason = reasons2[Math.floor(Math.random() * reasons2.length)];
            } else {
                const reasons3 = ['热门职业', '需求量大', '发展前景好', '值得一了解'];
                reason = reasons3[Math.floor(Math.random() * reasons3.length)];
            }
        } else {
            reason = '热门职业';
        }

        return { job: job, score: score, reason: reason };
    });

    // 按分数排序
    scored.sort(function(a, b) { return b.score - a.score; });

    // 确保分类多样性：从排序结果中选取不同分类的职业
    const selected = [];
    const usedCats = {};
    const restPool = [];

    scored.forEach(function(item) {
        const cat = categoryMap[item.job.id] || 'other';
        if (selected.length < count && !usedCats[cat]) {
            selected.push(item);
            usedCats[cat] = true;
        } else {
            restPool.push(item);
        }
    });

    // 不够的从剩余池中补充
    while (selected.length < count && restPool.length > 0) {
        selected.push(restPool.shift());
    }

    return selected;
}

// 保留全局导出（部分页面直接使用）
window.getSmartRecommendations = getSmartRecommendations;

/**
 * 高亮搜索关键词
 * 返回包含 <mark> 标签的文本（仅用于安全上下文）
 * @param {string} text - 原始文本
 * @param {string} keyword - 搜索关键词
 * @returns {string} 带高亮标记的文本
 */
export function highlightKeyword(text, keyword) {
    if (!text || !keyword) return text || '';

    // 转义正则特殊字符
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('(' + escaped + ')', 'gi');
    return text.replace(regex, '<mark>$1</mark>');
}

// ==================== 保留全局导出 ====================
window.searchJobs = searchJobs;
window.filterByCategory = filterByCategory;
window.filterByGroup = filterByGroup;
window.sortByField = sortByField;
window.getRandomJobs = getRandomJobs;
window.getPopularJobs = getPopularJobs;
window.highlightKeyword = highlightKeyword;
