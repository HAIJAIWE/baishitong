// ==================== home.js - 首页（改版） ====================
// 百事通 v1.0 - 参考 SaaS 风格简洁设计
// 安全原则：所有用户输入和动态内容用 textContent 渲染

import { clearContainer, createEl, debounce } from '../utils/ui.js';
import { icon, categoryIconEl } from '../utils/icons.js';
import { searchJobs, highlightKeyword, getSmartRecommendations, getRandomJobs } from '../utils/search.js';
import { navigateTo, resetPageInit } from '../router.js';
import { getRecentViewed, appState, hasCheckedInToday, getCheckinInfo } from '../state.js';
import { getJob } from '../data-loader.js';

/**
 * 初始化首页
 */
export function initHome() {
    const container = document.getElementById('page-home');
    if (!container) return;

    clearContainer(container);
    renderHome(container);
}

window.initHome = initHome;

/**
 * 渲染首页完整内容
 * @param {HTMLElement} container
 */
function renderHome(container) {
    // 1. Hero 区域（标题 + 搜索）
    const heroSection = createHeroSection();

    // 2. 快捷入口
    const quickSection = createQuickActions();

    // 3. 热门推荐（卡片网格）
    const recommendSection = createRecommendSection();

    // 4. 行业分类
    const categorySection = createCategoryGrid();

    // 5. 最近浏览
    const recentSection = createRecentSection();

    container.appendChild(heroSection);
    container.appendChild(createAnnouncement());
    container.appendChild(createCheckinReminder());
    container.appendChild(quickSection);
    container.appendChild(recommendSection);
    container.appendChild(categorySection);
    container.appendChild(recentSection);
}

// ==================== Hero 区域 ====================

function createHeroSection() {
    const section = createEl('div', 'hero-section');

    // 品牌标题
    const title = createEl('h1', 'hero-title');
    title.textContent = '百事通';
    section.appendChild(title);

    // 副标题
    const subtitle = createEl('p', 'hero-subtitle');
    subtitle.textContent = '探索 1669 个职业路径，掌握生活常识';
    section.appendChild(subtitle);

    // 搜索栏
    const searchBox = createEl('div', 'hero-search-box');

    const input = createEl('input', 'hero-search-input');
    input.type = 'text';
    input.placeholder = '搜索职业、技能、行业...';
    input.setAttribute('aria-label', '搜索职业');

    const searchBtn = createEl('button', 'hero-search-btn');
    searchBtn.appendChild(icon('search', 18, '#fff'));
    searchBtn.setAttribute('aria-label', '搜索');

    searchBox.appendChild(input);
    searchBox.appendChild(searchBtn);
    section.appendChild(searchBox);

    // 联想下拉
    const dropdown = createEl('div', 'search-dropdown');
    searchBox.appendChild(dropdown);

    // 搜索历史
    const SEARCH_HISTORY_KEY = 'byt_search_history';
    const MAX_HISTORY = 10;

    function getSearchHistory() {
        try { return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]'); }
        catch(e) { return []; }
    }

    function saveSearchHistory(keyword) {
        if (!keyword) return;
        let history = getSearchHistory();
        history = history.filter(function(h) { return h !== keyword; });
        history.unshift(keyword);
        if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
        try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history)); } catch(e) {}
    }

    function showSearchHistory() {
        const history = getSearchHistory();
        if (history.length === 0) { dropdown.classList.remove('active'); return; }
        clearContainer(dropdown);
        const header = createEl('div', 'search-dropdown-header');
        const titleEl = createEl('span', '');
        titleEl.style.cssText = 'font-size:12px;color:var(--text-tertiary);';
        titleEl.textContent = '搜索历史';
        const clearAll = createEl('span', '');
        clearAll.style.cssText = 'font-size:12px;color:var(--accent);cursor:pointer;';
        clearAll.textContent = '清除';
        clearAll.addEventListener('click', function(e) {
            e.stopPropagation();
            try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch(e2) {}
            dropdown.classList.remove('active');
        });
        header.appendChild(titleEl);
        header.appendChild(clearAll);
        dropdown.appendChild(header);
        history.forEach(function(kw) {
            const item = createEl('div', 'search-dropdown-item');
            const iconEl = icon('clock', 18, 'var(--text-tertiary)');
            const info = createEl('div', 'search-result-info');
            const name = createEl('div', 'item-name');
            name.textContent = kw;
            info.appendChild(name);
            item.appendChild(iconEl);
            item.appendChild(info);
            item.addEventListener('click', function() {
                input.value = kw;
                doSearch();
            });
            dropdown.appendChild(item);
        });
        dropdown.classList.add('active');
    }

    const doSearch = debounce(function() {
        const keyword = input.value.trim();
        if (!keyword) { showSearchHistory(); return; }
        saveSearchHistory(keyword);
        const results = searchJobs(keyword, 8);
        clearContainer(dropdown);
        if (results.length === 0) {
            const emptyTip = createEl('div', 'search-empty');
            emptyTip.textContent = '未找到相关职业';
            dropdown.appendChild(emptyTip);
        } else {
            results.forEach(function(job) {
                const item = createEl('div', 'search-dropdown-item');
                item.setAttribute('data-job-id', job.id);
                const jobIcon = categoryIconEl(job.category || job.group, 36);
                const info = createEl('div', 'search-result-info');
                const name = createEl('div', 'item-name');
                name.innerHTML = highlightKeyword(job.name || '', keyword);
                const desc = createEl('div', 'item-desc');
                desc.innerHTML = highlightKeyword(job.desc || '', keyword);
                info.appendChild(name);
                info.appendChild(desc);
                item.appendChild(jobIcon);
                item.appendChild(info);
                item.addEventListener('click', function() {
                    dropdown.classList.remove('active');
                    input.value = '';
                    window.openJobDetailModal(job.id);
                });
                dropdown.appendChild(item);
            });
        }
        dropdown.classList.add('active');
    }, 300);

    input.addEventListener('input', doSearch);
    input.addEventListener('focus', function() {
        if (!input.value.trim()) showSearchHistory();
    });

    searchBtn.addEventListener('click', function() {
        if (input.value.trim()) doSearch();
    });

    document.addEventListener('click', function(e) {
        if (!searchBox.contains(e.target)) dropdown.classList.remove('active');
    });

    return section;
}

// ==================== 快捷入口 ====================

function createQuickActions() {
    const section = createEl('div', 'quick-section');

    const actions = [
        { icon: 'compass', label: '职业探索', page: 'page-explore', color: '#3B82F6' },
        { icon: 'bot', label: 'AI问答', page: 'page-ai', color: '#8B5CF6' },
        { icon: 'scale', label: '职业对比', page: 'page-compare', color: '#F59E0B' },
        { icon: 'lightbulb', label: '生活常识', page: 'page-tips', color: '#10B981' },
        { icon: 'messageCircle', label: '社区', page: 'page-community', color: '#EC4899' },
        { icon: 'target', label: '每日签到', page: 'page-checkin', color: '#EF4444' },
        { icon: 'puzzle', label: '职业测评', page: 'page-assessment', color: '#6366F1' }
    ];

    const grid = createEl('div', 'quick-grid');

    actions.forEach(function(action) {
        const item = createEl('div', 'quick-item');

        const iconWrap = createEl('div', 'quick-icon-wrap');
        iconWrap.style.background = action.color + '15';
        iconWrap.appendChild(icon(action.icon, 22, action.color));

        const label = createEl('span', 'quick-label');
        label.textContent = action.label;

        item.appendChild(iconWrap);
        item.appendChild(label);

        item.addEventListener('click', function() {
            navigateTo(action.page);
        });

        grid.appendChild(item);
    });

    section.appendChild(grid);
    return section;
}

// ==================== 热门推荐（卡片网格） ====================

const REC_CAT_COLORS = {
    'gov_leader': '#3B82F6',
    'professional': '#8B5CF6',
    'clerk': '#A855F7',
    'service': '#F59E0B',
    'agriculture': '#10B981',
    'manufacturing': '#EF4444',
    'military': '#6366F1',
    'other': '#64748B'
};

const REC_CAT_NAMES = {
    'gov_leader': '负责人',
    'professional': '专业技术人员',
    'clerk': '办事人员',
    'service': '社会服务',
    'agriculture': '农林牧渔',
    'manufacturing': '生产制造',
    'military': '军人',
    'other': '其他'
};

function createRecommendSection() {
    const section = createEl('div', 'content-section');

    // 标题行
    const titleRow = createEl('div', 'section-header');
    const h2 = createEl('h2', 'section-heading');
    h2.textContent = '热门职业推荐';
    titleRow.appendChild(h2);

    const subtitle = createEl('p', 'section-subheading');
    subtitle.textContent = '探索不同职业的工作内容和发展方向';
    titleRow.appendChild(subtitle);
    section.appendChild(titleRow);

    // 卡片网格
    const grid = createEl('div', 'rec-grid');
    renderRecommendCards(grid);
    section.appendChild(grid);

    // 查看更多
    const moreLink = createEl('div', 'more-link');
    moreLink.textContent = '查看更多职业 ';
    moreLink.appendChild(icon('arrowRight', 14, 'var(--accent)'));
    moreLink.addEventListener('click', function() {
        navigateTo('page-explore');
    });
    section.appendChild(moreLink);

    return section;
}

function renderRecommendCards(container) {
    const recommendations = [];
    if (typeof getSmartRecommendations === 'function') {
        const smart = getSmartRecommendations(6);
        smart.forEach(function(r) { recommendations.push(r); });
    }
    if (!recommendations.length) {
        const randomJobs = getRandomJobs(6);
        randomJobs.forEach(function(job) {
            recommendations.push({ job: job, reason: '热门职业' });
        });
    }

    const categoryMap = window.JOB_CATEGORY_MAP || {};

    recommendations.forEach(function(item) {
        const job = item.job;
        const subCat = categoryMap[job.id] || 'other';

        let groupId = subCat;
        const groups = window.INDUSTRY_GROUPS || [];
        for (let i = 0; i < groups.length; i++) {
            const mids = groups[i].midCategories || [];
            for (let j = 0; j < mids.length; j++) {
                if (mids[j].id === subCat) { groupId = groups[i].id; break; }
            }
            if (groupId !== subCat) break;
        }

        const catColor = REC_CAT_COLORS[groupId] || '#64748B';
        const catName = REC_CAT_NAMES[groupId] || '其他';

        const card = createEl('div', 'rec-card');

        // 职业图标
        const cardIcon = categoryIconEl(job.category || job.group, 36);
        card.appendChild(cardIcon);

        // 分类标签
        const tag = createEl('span', 'rec-tag');
        tag.textContent = catName;
        tag.style.color = catColor;
        tag.style.background = catColor + '12';
        card.appendChild(tag);

        // 职业名称
        const name = createEl('h3', 'rec-card-name');
        name.textContent = job.name || '';
        card.appendChild(name);

        // 描述
        const desc = createEl('p', 'rec-card-desc');
        desc.textContent = job.desc || '';
        card.appendChild(desc);

        // 底部箭头
        const arrow = createEl('span', 'rec-card-arrow');
        arrow.appendChild(icon('chevronRight', 16, catColor));
        card.appendChild(arrow);

        card.addEventListener('click', function() {
            window.openJobDetailModal(job.id);
        });

        container.appendChild(card);
    });
}

// ==================== 行业分类 ====================

function createCategoryGrid() {
    const section = createEl('div', 'content-section');

    const titleRow = createEl('div', 'section-header');
    const h2 = createEl('h2', 'section-heading');
    h2.textContent = '行业分类';
    titleRow.appendChild(h2);

    const subtitle = createEl('p', 'section-subheading');
    subtitle.textContent = '按行业大类浏览职业';
    titleRow.appendChild(subtitle);
    section.appendChild(titleRow);

    const grid = createEl('div', 'cat-grid');

    const groups = window.INDUSTRY_GROUPS || [];
    groups.forEach(function(group) {
        const card = createEl('div', 'cat-card');

        const iconEl = icon('folder', 28, 'var(--text-secondary)');

        const info = createEl('div', 'cat-card-info');

        const name = createEl('div', 'cat-card-name');
        name.textContent = group.name || '';

        let count = 0;
        const catMap = window.JOB_CATEGORY_MAP || {};
        const cats = group.categories || [];
        Object.keys(catMap).forEach(function(jobId) {
            if (cats.indexOf(catMap[jobId]) !== -1) count++;
        });

        const countEl = createEl('div', 'cat-card-count');
        countEl.textContent = count + ' 个职业';

        info.appendChild(name);
        info.appendChild(countEl);
        card.appendChild(iconEl);
        card.appendChild(info);

        card.addEventListener('click', function() {
            appState.selectedGroup = group.id;
            resetPageInit('page-explore');
            navigateTo('page-explore');
        });

        grid.appendChild(card);
    });

    section.appendChild(grid);
    return section;
}

// ==================== 最近浏览 ====================

function createRecentSection() {
    const section = createEl('div', 'content-section');

    const recentList = getRecentViewed(5);
    if (!recentList || recentList.length === 0) {
        section.style.display = 'none';
        return section;
    }

    const titleRow = createEl('div', 'section-header');
    const h2 = createEl('h2', 'section-heading');
    h2.textContent = '最近浏览';
    titleRow.appendChild(h2);
    section.appendChild(titleRow);

    const list = createEl('div', 'recent-list');

    recentList.forEach(function(item) {
        const job = getJob(item.id);
        if (!job) return;

        const row = createEl('div', 'recent-item');

        const iconEl = categoryIconEl(job.category || job.group, 36);

        const info = createEl('div', 'recent-info');

        const name = createEl('span', 'recent-name');
        name.textContent = job.name || '';

        let timeStr = '';
        const ts = item.timestamp;
        if (ts) {
            const d = new Date(ts);
            const now = new Date();
            const diffMin = Math.floor((now - d) / 60000);
            if (diffMin < 1) timeStr = '刚刚';
            else if (diffMin < 60) timeStr = diffMin + '分钟前';
            else if (diffMin < 1440) timeStr = Math.floor(diffMin / 60) + '小时前';
            else timeStr = Math.floor(diffMin / 1440) + '天前';
        }

        const time = createEl('span', 'recent-time');
        time.textContent = timeStr;

        info.appendChild(name);
        info.appendChild(time);
        row.appendChild(iconEl);
        row.appendChild(info);

        const arrow = icon('chevronRight', 18, 'var(--text-tertiary)');

        row.appendChild(arrow);

        row.addEventListener('click', function() {
            window.openJobDetailModal(job.id);
        });

        list.appendChild(row);
    });

    section.appendChild(list);
    return section;
}

// ==================== 公告栏 ====================

function createAnnouncement() {
    var section = createEl('div', 'announcement-bar');

    var icon = createEl('span', 'announcement-icon');
    icon.appendChild(document.createTextNode('📢'));
    section.appendChild(icon);

    var text = createEl('div', 'announcement-text');
    text.textContent = '🎉 已收录10000条生活常识、1669个职业、120题测评，持续优化中！QQ交流群：932919784';
    section.appendChild(text);

    var closeBtn = createEl('span', 'announcement-close');
    closeBtn.textContent = '×';
    closeBtn.addEventListener('click', function() {
        section.style.display = 'none';
        try { localStorage.setItem('bst_announcement_closed', '1'); } catch(e) {}
    });
    section.appendChild(closeBtn);

    // 检查是否已关闭
    try {
        if (localStorage.getItem('bst_announcement_closed') === '1') {
            section.style.display = 'none';
        }
    } catch(e) {}

    return section;
}

// ==================== 签到提醒卡片 ====================

function createCheckinReminder() {
    var section = createEl('div', 'checkin-reminder-card');

    // 如果当天已签到，不显示
    if (hasCheckedInToday()) {
        section.style.display = 'none';
        return section;
    }

    var info = getCheckinInfo();
    var streak = info.streak || 0;

    // 图标
    var iconWrap = createEl('span', 'checkin-reminder-icon');
    iconWrap.appendChild(icon('target', 20, '#EF4444'));
    section.appendChild(iconWrap);

    // 文字
    var textWrap = createEl('div', 'checkin-reminder-text');
    var mainText = createEl('div', 'checkin-reminder-main');
    mainText.textContent = '别忘了今日签到！';
    textWrap.appendChild(mainText);

    var subText = createEl('div', 'checkin-reminder-sub');
    if (streak > 0) {
        subText.textContent = '已连续签到 ' + streak + ' 天，继续保持';
    } else {
        subText.textContent = '签到赢积分，连续签到有额外奖励';
    }
    textWrap.appendChild(subText);
    section.appendChild(textWrap);

    // 箭头
    var arrow = createEl('span', 'checkin-reminder-arrow');
    arrow.appendChild(icon('chevronRight', 18, 'var(--text-tertiary)'));
    section.appendChild(arrow);

    // 点击跳转到签到页面
    section.addEventListener('click', function() {
        navigateTo('page-checkin');
    });

    return section;
}
