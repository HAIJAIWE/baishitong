// ==================== home.js - 首页 ====================
// 百事通 v1.0
// 安全原则：所有用户输入和动态内容用 textContent 渲染

import { clearContainer, createEl, debounce } from '../utils/ui.js';
import { searchJobs, highlightKeyword, getSmartRecommendations, getRandomJobs } from '../utils/search.js';
import { navigateTo, resetPageInit } from '../router.js';
import { getRecentViewed, appState } from '../state.js';
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
    // 1. 搜索栏（sticky）
    const searchSection = createSearchBar();

    // 2. 快捷入口
    const quickSection = createQuickActions();

    // 3. 热门推荐
    const recommendSection = createRecommendSection();

    // 4. 八大类入口
    const categorySection = createCategoryGrid();

    // 5. 最近浏览
    const recentSection = createRecentSection();

    container.appendChild(searchSection);
    container.appendChild(quickSection);
    container.appendChild(recommendSection);
    container.appendChild(categorySection);
    container.appendChild(recentSection);
}

// ==================== 搜索栏 ====================

function createSearchBar() {
    const section = createEl('div', 'home-search');

    const box = createEl('div', 'search-box');

    const input = createEl('input', 'input');
    input.type = 'text';
    input.placeholder = '搜索职业...';
    input.setAttribute('aria-label', '搜索职业');

    const iconWrap = createEl('div', '');
    iconWrap.style.cssText = 'position:absolute;right:12px;top:50%;transform:translateY(-50%);display:flex;align-items:center;gap:8px;';
    iconWrap.textContent = ''; // 清空

    const searchIcon = createEl('span', '');
    searchIcon.textContent = '🔍';
    searchIcon.style.cssText = 'font-size:16px;cursor:pointer;';

    const clearBtn = createEl('span', '');
    clearBtn.textContent = '✕';
    clearBtn.style.cssText = 'font-size:14px;cursor:pointer;color:var(--text-tertiary);display:none;padding:4px;';

    iconWrap.appendChild(searchIcon);
    iconWrap.appendChild(clearBtn);

    // 联想下拉
    const dropdown = createEl('div', 'search-dropdown');

    box.appendChild(input);
    box.appendChild(iconWrap);
    box.appendChild(dropdown);
    section.appendChild(box);

    // === 搜索历史 ===
    const SEARCH_HISTORY_KEY = 'byt_search_history';
    const MAX_HISTORY = 10;

    function getSearchHistory() {
        try {
            return JSON.parse(localStorage.getItem(SEARCH_HISTORY_KEY) || '[]');
        } catch(e) { return []; }
    }

    function saveSearchHistory(keyword) {
        if (!keyword) return;
        let history = getSearchHistory();
        // 去重
        history = history.filter(function(h) { return h !== keyword; });
        history.unshift(keyword);
        if (history.length > MAX_HISTORY) history = history.slice(0, MAX_HISTORY);
        try { localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history)); } catch(e) {}
    }

    function showSearchHistory() {
        const history = getSearchHistory();
        if (history.length === 0) {
            dropdown.classList.remove('active');
            return;
        }
        clearContainer(dropdown);

        // 标题
        const header = createEl('div', '');
        header.style.cssText = 'display:flex;justify-content:space-between;align-items:center;padding:8px 12px;';
        const title = createEl('span', '');
        title.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);';
        title.textContent = '搜索历史';
        const clearAll = createEl('span', '');
        clearAll.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);cursor:pointer;';
        clearAll.textContent = '清除';
        clearAll.addEventListener('click', function(e) {
            e.stopPropagation();
            try { localStorage.removeItem(SEARCH_HISTORY_KEY); } catch(e2) {}
            dropdown.classList.remove('active');
        });
        header.appendChild(title);
        header.appendChild(clearAll);
        dropdown.appendChild(header);

        history.forEach(function(kw) {
            const item = createEl('div', 'search-dropdown-item');
            const icon = createEl('span', 'item-icon');
            icon.textContent = '🕐';
            const info = createEl('div', 'search-result-info');
            const name = createEl('div', 'item-name');
            name.textContent = kw;
            info.appendChild(name);
            item.appendChild(icon);
            item.appendChild(info);
            item.addEventListener('click', function() {
                input.value = kw;
                clearBtn.style.display = 'block';
                doSearch();
            });
            dropdown.appendChild(item);
        });

        dropdown.classList.add('active');
    }

    // 聚焦时显示搜索历史
    input.addEventListener('focus', function() {
        if (!input.value.trim()) {
            showSearchHistory();
        }
    });

    // 搜索事件（debounce 300ms）
    const doSearch = debounce(function() {
        const keyword = input.value.trim();
        if (!keyword) {
            showSearchHistory();
            clearBtn.style.display = 'none';
            return;
        }
        clearBtn.style.display = 'block';

        const results = searchJobs(keyword, 8);
        clearContainer(dropdown);

        if (results.length === 0) {
            const emptyTip = createEl('div', 'search-empty');
            emptyTip.textContent = '未找到相关职业';
            dropdown.appendChild(emptyTip);
        } else {
            // 保存搜索历史
            saveSearchHistory(keyword);

            results.forEach(function(job) {
                const item = createEl('div', 'search-dropdown-item');
                item.setAttribute('data-job-id', job.id);

                const icon = createEl('span', 'item-icon');
                icon.textContent = job.icon || '💼';

                const info = createEl('div', 'search-result-info');

                const name = createEl('div', 'item-name');
                name.innerHTML = highlightKeyword(job.name || '', keyword);

                const desc = createEl('div', 'item-desc');
                desc.innerHTML = highlightKeyword(job.desc || '', keyword);

                info.appendChild(name);
                info.appendChild(desc);
                item.appendChild(icon);
                item.appendChild(info);

                item.addEventListener('click', function() {
                    dropdown.classList.remove('active');
                    input.value = '';
                    clearBtn.style.display = 'none';
                    window.openJobDetailModal(job.id);
                });

                dropdown.appendChild(item);
            });
        }

        dropdown.classList.add('active');
    }, 300);

    input.addEventListener('input', doSearch);

    // 清除按钮
    clearBtn.addEventListener('click', function() {
        input.value = '';
        dropdown.classList.remove('active');
        clearBtn.style.display = 'none';
        input.focus();
    });

    // 点击外部关闭下拉
    document.addEventListener('click', function(e) {
        if (!box.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    return section;
}

// ==================== 快捷入口 ====================

function createQuickActions() {
    const section = createEl('div', 'mb-6');

    const grid = createEl('div', 'quick-actions');

    const actions = [
        { icon: '🔍', label: '职业探索', page: 'page-explore' },
        { icon: '🤖', label: 'AI问答', page: 'page-ai' },
        { icon: '⚖️', label: '职业对比', page: 'page-compare' },
        { icon: '💡', label: '生活常识', page: 'page-tips' },
        { icon: '💬', label: '社区', page: 'page-community' }
    ];

    actions.forEach(function(action) {
        const item = createEl('div', 'quick-action-item');
        item.setAttribute('data-page', action.page);

        const icon = createEl('span', 'action-icon');
        icon.textContent = action.icon;

        const label = createEl('span', 'action-label');
        label.textContent = action.label;

        item.appendChild(icon);
        item.appendChild(label);

        item.addEventListener('click', function() {
            navigateTo(action.page);
        });

        grid.appendChild(item);
    });

    section.appendChild(grid);
    return section;
}

// ==================== 热门推荐 ====================

// 分类颜色映射
const REC_CAT_COLORS = {
    'gov_leader': '#E74C3C',
    'professional': '#3498DB',
    'clerk': '#9B59B6',
    'service': '#E67E22',
    'agriculture': '#27AE60',
    'manufacturing': '#F39C12',
    'military': '#2C3E50',
    'other': '#1ABC9C'
};

// 分类名称映射
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
    const section = createEl('div', 'mb-6');

    // 标题行 + 换一批按钮
    const titleRow = createEl('div', 'section-title');
    const h2 = createEl('h2', '');
    h2.textContent = '热门推荐';
    titleRow.appendChild(h2);

    const refreshBtn = createEl('span', 'rec-refresh-btn');
    refreshBtn.textContent = '换一批';
    titleRow.appendChild(refreshBtn);
    section.appendChild(titleRow);

    // 横向滚动容器
    const scrollWrap = createEl('div', 'recommend-scroll scroll-container');

    // 渲染推荐卡片
    renderRecommendCards(scrollWrap);

    // 换一批点击事件
    refreshBtn.addEventListener('click', function() {
        // 旋转动画
        refreshBtn.classList.add('rec-refreshing');
        setTimeout(function() {
            refreshBtn.classList.remove('rec-refreshing');
        }, 400);

        // 清空并重新渲染
        scrollWrap.innerHTML = '';
        renderRecommendCards(scrollWrap);
    });

    section.appendChild(scrollWrap);
    return section;
}

function renderRecommendCards(container) {
    const recommendations = [];
    if (typeof getSmartRecommendations === 'function') {
        const smart = getSmartRecommendations(8);
        smart.forEach(function(r) { recommendations.push(r); });
    }

    // 兜底：如果智能推荐没数据，用随机
    if (!recommendations.length) {
        const randomJobs = getRandomJobs(8);
        randomJobs.forEach(function(job) {
            recommendations.push({ job: job, reason: '热门职业' });
        });
    }

    const categoryMap = window.JOB_CATEGORY_MAP || {};

    recommendations.forEach(function(item) {
        const job = item.job;
        const reason = item.reason || '热门职业';
        const subCat = categoryMap[job.id] || 'other';

        // 找到所属大类
        let groupId = subCat;
        const groups = window.INDUSTRY_GROUPS || [];
        for (let i = 0; i < groups.length; i++) {
            const mids = groups[i].midCategories || [];
            for (let j = 0; j < mids.length; j++) {
                if (mids[j].id === subCat) {
                    groupId = groups[i].id;
                    break;
                }
            }
            if (groupId !== subCat) break;
        }

        const catColor = REC_CAT_COLORS[groupId] || '#95A5A6';
        const catName = REC_CAT_NAMES[groupId] || '其他';

        const card = createEl('div', 'recommend-card');

        // 顶部色条
        const colorBar = createEl('div', 'rec-color-bar');
        colorBar.style.background = catColor;
        card.appendChild(colorBar);

        // 图标 + 分类标签行
        const topRow = createEl('div', 'rec-top-row');

        const icon = createEl('div', 'rec-icon');
        icon.textContent = job.icon || '💼';
        topRow.appendChild(icon);

        const catTag = createEl('span', 'rec-cat-tag');
        catTag.textContent = catName;
        catTag.style.background = catColor + '18';
        catTag.style.color = catColor;
        topRow.appendChild(catTag);

        card.appendChild(topRow);

        // 职业名称
        const name = createEl('div', 'rec-name');
        name.textContent = job.name || '';
        card.appendChild(name);

        // 推荐理由
        const reasonEl = createEl('div', 'rec-reason');
        reasonEl.textContent = reason;
        card.appendChild(reasonEl);

        // 描述
        const desc = createEl('div', 'rec-desc');
        desc.textContent = job.desc || '';
        card.appendChild(desc);

        card.addEventListener('click', function() {
            window.openJobDetailModal(job.id);
        });

        container.appendChild(card);
    });
}

// ==================== 八大类入口 ====================

function createCategoryGrid() {
    const section = createEl('div', 'mb-6');

    // 标题
    const titleRow = createEl('div', 'section-title');
    const h2 = createEl('h2', '');
    h2.textContent = '行业分类';
    titleRow.appendChild(h2);
    section.appendChild(titleRow);

    // 2x4 网格
    const grid = createEl('div', 'category-grid');

    const groups = window.INDUSTRY_GROUPS || [];
    groups.forEach(function(group) {
        const card = createEl('div', 'category-card');

        const icon = createEl('span', 'cat-icon');
        icon.textContent = group.icon || '📁';

        const info = createEl('div', 'cat-info');

        const name = createEl('div', 'cat-name');
        name.textContent = group.name || '';
        name.style.cssText = 'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;';

        // 计算该大类下的职业数量
        let count = 0;
        const catMap = window.JOB_CATEGORY_MAP || {};
        const cats = group.categories || [];
        Object.keys(catMap).forEach(function(jobId) {
            if (cats.indexOf(catMap[jobId]) !== -1) {
                count++;
            }
        });

        const countEl = createEl('div', 'cat-count');
        countEl.textContent = count + '个职业';

        info.appendChild(name);
        info.appendChild(countEl);
        card.appendChild(icon);
        card.appendChild(info);

        card.addEventListener('click', function() {
            // 跳转到 explore 页并选中该大类
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
    const section = createEl('div', 'mb-6');
    section.style.cssText = 'padding-bottom:var(--space-8);';

    const recentList = getRecentViewed(5);

    // 无数据时隐藏
    if (!recentList || recentList.length === 0) {
        section.style.display = 'none';
        return section;
    }

    // 标题
    const titleRow = createEl('div', 'section-title');
    const h2 = createEl('h2', '');
    h2.textContent = '最近浏览';
    titleRow.appendChild(h2);
    section.appendChild(titleRow);

    const list = createEl('div', 'recent-list');

    recentList.forEach(function(item) {
        const job = getJob(item.id);
        if (!job) return;

        const row = createEl('div', 'recent-item');

        const icon = createEl('span', 'recent-icon');
        icon.textContent = job.icon || '💼';

        const name = createEl('span', 'recent-name');
        name.textContent = job.name || '';

        // 时间格式化
        let timeStr = '';
        const ts = item.timestamp;
        if (ts) {
            const d = new Date(ts);
            const now = new Date();
            const diffMs = now - d;
            const diffMin = Math.floor(diffMs / 60000);
            if (diffMin < 1) {
                timeStr = '刚刚';
            } else if (diffMin < 60) {
                timeStr = diffMin + '分钟前';
            } else if (diffMin < 1440) {
                timeStr = Math.floor(diffMin / 60) + '小时前';
            } else {
                timeStr = Math.floor(diffMin / 1440) + '天前';
            }
        }

        const time = createEl('span', 'recent-time');
        time.textContent = timeStr;

        row.appendChild(icon);
        row.appendChild(name);
        row.appendChild(time);

        row.addEventListener('click', function() {
            window.openJobDetailModal(job.id);
        });

        list.appendChild(row);
    });

    section.appendChild(list);
    return section;
}
