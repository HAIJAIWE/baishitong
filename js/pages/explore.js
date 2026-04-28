// ==================== explore.js - 职业探索页 ====================
// 百事通 v1.0
// 安全原则：所有用户输入和动态内容用 textContent 渲染

import { clearContainer, createEl, throttle, showToast, showModal, hideModal, escapeHtml } from '../utils/ui.js';
import { appState } from '../state.js';
import { addRecentView, markExplored, checkAchievement, isFavorite, toggleFavorite } from '../state.js';
import { getCategoriesByGroup, getJob, getJobFull, hasFullData } from '../data-loader.js';
import { sortByField } from '../utils/search.js';
import { navigateTo, resetPageInit } from '../router.js';

// 页面状态
const _exploreState = {
    selectedGroup: null,   // 当前选中的大类 ID
    selectedCats: [],      // 选中的中类 ID 列表（支持多选）
    allJobs: [],           // 当前筛选后的职业列表
    filteredJobs: []       // 虚拟滚动：排序后的筛选结果
};

/**
 * 初始化职业探索页
 */
export function initExplore() {
    const container = document.getElementById('page-explore');
    if (!container) return;

    clearContainer(container);

    // 从全局状态或 URL 参数获取预选大类
    const preGroup = appState.selectedGroup || null;
    _exploreState.selectedGroup = preGroup;
    _exploreState.selectedCats = [];

    // 如果有预选大类，加载其中类
    if (preGroup) {
        const midCats = getCategoriesByGroup(preGroup);
        if (midCats && midCats.length > 0) {
            _exploreState.selectedCats = midCats.map(function(c) { return c.id; });
        }
    }

    // 获取所有职业
    _exploreState.allJobs = getAllJobs();

    renderExplore(container);
}

window.initExplore = initExplore;

/**
 * 获取所有职业列表
 * @returns {Array}
 */
function getAllJobs() {
    const templates = window.JOB_TEMPLATES || {};
    return Object.keys(templates).map(function(key) {
        return templates[key];
    });
}

/**
 * 渲染探索页
 * @param {HTMLElement} container
 */
function renderExplore(container) {
    // 1. 分类 Tab
    const tabsSection = createCategoryTabs();

    // 2. 中类 Chip
    const chipsSection = createMidCategoryChips();

    // 3. 职业列表
    const listSection = createJobList();

    container.appendChild(tabsSection);
    container.appendChild(chipsSection);
    container.appendChild(listSection);
}

// ==================== 分类 Tab ====================

function createCategoryTabs() {
    const wrap = createEl('div', 'mb-3');

    const tabs = createEl('div', 'category-tabs');

    // "全部" Tab
    const allTab = createEl('button', 'category-tab' + (!_exploreState.selectedGroup ? ' active' : ''));
    allTab.textContent = '全部';
    allTab.addEventListener('click', function() {
        _exploreState.selectedGroup = null;
        _exploreState.selectedCats = [];
        appState.selectedGroup = null;
        refreshExplore();
    });
    tabs.appendChild(allTab);

    // 8个大类 Tab
    const groups = window.INDUSTRY_GROUPS || [];
    groups.forEach(function(group) {
        const tab = createEl('button', 'category-tab' + (_exploreState.selectedGroup === group.id ? ' active' : ''));
        const rawName = (group.name || '').replace(/^\d+\s*/, '');
        // 短名称映射
        const shortNames = {
            '党的机关、国家机关、群众团体和社会组织、企事业单位负责人': '负责人',
            '专业技术人员': '技术人员',
            '办事人员和有关人员': '办事人员',
            '社会生产服务和生活服务人员': '服务人员',
            '农、林、牧、渔业生产及辅助人员': '农林牧渔',
            '生产制造及有关人员': '制造人员',
            '军人': '军人',
            '不便分类的其他从业人员': '其他'
        };
        const displayName = shortNames[rawName] || (rawName.length > 6 ? rawName.substring(0, 5) + '…' : rawName);
        tab.textContent = (group.icon || '') + ' ' + displayName;
        tab.title = group.name || '';

        tab.addEventListener('click', function() {
            _exploreState.selectedGroup = group.id;
            appState.selectedGroup = group.id;

            // 默认选中该大类下所有中类
            const midCats = getCategoriesByGroup(group.id);
            _exploreState.selectedCats = midCats ? midCats.map(function(c) { return c.id; }) : [];

            refreshExplore();
        });

        tabs.appendChild(tab);
    });

    wrap.appendChild(tabs);
    return wrap;
}

// ==================== 中类 Chip ====================

function createMidCategoryChips() {
    const wrap = createEl('div', '');

    if (!_exploreState.selectedGroup) {
        wrap.style.display = 'none';
        return wrap;
    }

    const midCats = getCategoriesByGroup(_exploreState.selectedGroup);
    if (!midCats || midCats.length === 0) {
        wrap.style.display = 'none';
        return wrap;
    }

    const chips = createEl('div', 'mid-category-chips');

    // "全部" Chip
    const allSelected = _exploreState.selectedCats.length === midCats.length;
    const allChip = createEl('button', 'category-tab' + (allSelected ? ' active' : ''));
    allChip.textContent = '全部';
    allChip.addEventListener('click', function() {
        _exploreState.selectedCats = midCats.map(function(c) { return c.id; });
        refreshExplore();
    });
    chips.appendChild(allChip);

    // 各中类 Chip
    midCats.forEach(function(cat) {
        const isActive = _exploreState.selectedCats.indexOf(cat.id) !== -1;
        const chip = createEl('button', 'category-tab' + (isActive ? ' active' : ''));
        chip.textContent = (cat.icon || '') + ' ' + (cat.name || '');

        chip.addEventListener('click', function() {
            const idx = _exploreState.selectedCats.indexOf(cat.id);
            if (idx !== -1) {
                // 取消选中（至少保留一个）
                if (_exploreState.selectedCats.length > 1) {
                    _exploreState.selectedCats.splice(idx, 1);
                }
            } else {
                _exploreState.selectedCats.push(cat.id);
            }
            refreshExplore();
        });

        chips.appendChild(chip);
    });

    wrap.appendChild(chips);
    return wrap;
}

// ==================== 职业列表 ====================

function createJobList() {
    const wrap = createEl('div', '');
    let filtered = filterExploreJobs();

    if (filtered.length === 0) {
        const empty = createEl('div', 'empty-state');
        empty.textContent = '暂无匹配的职业';
        wrap.appendChild(empty);
        return wrap;
    }

    filtered = sortByField(filtered, 'name', 'asc');
    _exploreState.filteredJobs = filtered;

    // 虚拟滚动容器
    const list = createEl('div', 'job-list');
    list.style.overflow = 'auto';
    list.style.maxHeight = 'calc(100vh - 280px)';
    list.style.webkitOverflowScrolling = 'touch';

    // 占位元素撑开滚动高度
    const placeholder = createEl('div', '');
    placeholder.style.height = (filtered.length * 72) + 'px'; // 每个卡片约72px高
    list.appendChild(placeholder);

    // 可视区域容器
    const visibleContainer = createEl('div', '');
    visibleContainer.style.position = 'relative';
    list.insertBefore(visibleContainer, placeholder);

    const ITEM_HEIGHT = 72;
    const BUFFER = 5;

    function renderVisibleItems() {
        const scrollTop = list.scrollTop;
        const viewHeight = list.clientHeight;
        const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER);
        const endIndex = Math.min(filtered.length, Math.ceil((scrollTop + viewHeight) / ITEM_HEIGHT) + BUFFER);

        // 清空并重新渲染可见项
        while (visibleContainer.firstChild) {
            visibleContainer.removeChild(visibleContainer.firstChild);
        }

        for (let i = startIndex; i < endIndex; i++) {
            const card = createJobCard(filtered[i], i);
            card.style.position = 'absolute';
            card.style.top = (i * ITEM_HEIGHT) + 'px';
            card.style.left = '0';
            card.style.right = '0';
            card.style.animationDelay = '0ms'; // 虚拟滚动不需要入场动画
            visibleContainer.appendChild(card);
        }
    }

    list.addEventListener('scroll', throttle(renderVisibleItems, 50));

    // 初始渲染
    renderVisibleItems();

    wrap.appendChild(list);
    return wrap;
}

/**
 * 根据当前筛选条件过滤职业
 * @returns {Array}
 */
function filterExploreJobs() {
    const allJobs = _exploreState.allJobs;

    if (!_exploreState.selectedGroup && _exploreState.selectedCats.length === 0) {
        return allJobs;
    }

    const catMap = window.JOB_CATEGORY_MAP || {};

    return allJobs.filter(function(job) {
        if (_exploreState.selectedCats.length === 0) return true;
        return _exploreState.selectedCats.indexOf(catMap[job.id]) !== -1;
    });
}

/**
 * 创建职业卡片
 * @param {Object} job
 * @param {number} index
 * @returns {HTMLElement}
 */
function createJobCard(job, index) {
    const card = createEl('div', 'job-card');
    card.style.animationDelay = Math.min(index * 30, 300) + 'ms';

    const icon = createEl('div', 'job-icon');
    icon.textContent = job.icon || '💼';

    const info = createEl('div', 'job-info');

    const name = createEl('div', 'job-name');
    name.textContent = job.name || '';

    const desc = createEl('div', 'job-desc');
    const rawDesc = job.desc || '';
    desc.textContent = rawDesc.length > 20 ? rawDesc.substring(0, 19) + '…' : rawDesc;

    info.appendChild(name);
    info.appendChild(desc);

    // 薪资：只显示简短范围
    let salary = '';
    if (job.overview && job.overview.salary) {
        const rawSalary = job.overview.salary;
        // 提取第一个薪资范围（如 "4000-7000元/月" 或 "1.5-3万/年"）
        const match = rawSalary.match(/[\d.]+-[\d.]+\s*[万亿]?\s*元?\/?\s*[月年]/);
        if (match) {
            salary = match[0];
        } else {
            // 备用：取第一行
            const firstLine = rawSalary.split('\n')[0];
            salary = firstLine.length > 15 ? firstLine.substring(0, 14) + '…' : firstLine;
        }
    }

    card.appendChild(icon);
    card.appendChild(info);

    if (salary) {
        const salaryEl = createEl('div', 'job-salary');
        salaryEl.textContent = salary;
        card.appendChild(salaryEl);
    }

    card.addEventListener('click', function() {
        openJobDetailModal(job.id);
    });

    return card;
}

/**
 * 刷新探索页（重新渲染）
 */
function refreshExplore() {
    const container = document.getElementById('page-explore');
    if (!container) return;
    clearContainer(container);
    renderExplore(container);
}

// ==================== 职业详情模态框 ====================

/**
 * 打开职业详情模态框（异步，确保完整数据加载）
 * @param {string} jobId
 */
export async function openJobDetailModal(jobId) {
    // 先用索引数据检查职业是否存在
    let job = getJob(jobId);
    if (!job) {
        showToast('职业数据不存在', 'error');
        return;
    }

    // 记录浏览
    addRecentView(jobId);
    markExplored(jobId);

    // 检查探索相关成就
    checkAchievement('first_task');
    checkAchievement('five_tasks');
    checkAchievement('ten_tasks');
    checkAchievement('twenty_tasks');
    checkAchievement('all_jobs');

    // 如果没有完整数据，显示加载状态并按需加载
    if (!hasFullData(jobId)) {
        const loadingHtml = '<div class="job-detail" style="text-align:center;padding:60px 20px;">'
            + '<div style="font-size:32px;margin-bottom:12px;">⏳</div>'
            + '<div style="color:var(--text-secondary);">正在加载职业详情...</div>'
            + '</div>';
        showModal(loadingHtml);

        // 按需加载完整数据
        job = await getJobFull(jobId);
        if (!job || !job.overview) {
            hideModal();
            showToast('职业详情加载失败，请重试', 'error');
            return;
        }
    }

    const ov = job.overview || {};

    // 构建模态框 HTML
    const html = '<div class="job-detail">'
        + '<div class="job-detail-header" id="detailHeader"></div>'
        + '<div class="overview-grid" id="detailOverview"></div>'
        + '<div class="learning-path" id="detailLearningPath"></div>'
        + '<div class="detail-actions" id="detailActions"></div>'
        + '<div class="related-jobs" id="detailRelated" style="margin-top:var(--space-4);"></div>'
        + '</div>';

    showModal(html);

    // 安全填充头部
    const header = document.getElementById('detailHeader');
    if (header) {
        // 关闭按钮
        const closeBtn = createEl('button', 'detail-close-btn');
        closeBtn.textContent = '✕';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.addEventListener('click', function() {
            if (typeof hideModal === 'function') hideModal();
        });
        header.appendChild(closeBtn);

        const iconEl = createEl('div', 'detail-icon');
        iconEl.textContent = job.icon || '💼';

        const nameEl = createEl('div', 'detail-name');
        nameEl.textContent = job.name || '';

        const descEl = createEl('div', 'detail-desc');
        descEl.textContent = ov.shortDesc || job.desc || '';

        header.appendChild(iconEl);
        header.appendChild(nameEl);
        header.appendChild(descEl);
    }

    // 渲染完整内容（overview + levels + actions）
    _renderJobDetailContent(job, jobId);
}

window.openJobDetailModal = openJobDetailModal;

/**
 * 渲染职业详情内容（overview + levels + actions）
 */
function _renderJobDetailContent(job, jobId) {
    const ov = job.overview || {};

    // 安全填充概览网格
    const overview = document.getElementById('detailOverview');
    if (overview) {
        const items = [
            { label: '工作内容', value: ov.whatDo || '暂无介绍' },
            { label: '工作环境', value: ov.environment || '暂无介绍' },
            { label: '工作时间', value: ov.workTime || '暂无介绍' },
            { label: '薪资待遇', value: ov.salary || '暂无介绍' },
            { label: '适合人群', value: ov.whoFits || '暂无介绍', full: true },
            { label: '优点', value: ov.pros || '暂无' },
            { label: '注意事项', value: ov.cons || '暂无' }
        ];

        items.forEach(function(item) {
            const div = createEl('div', 'overview-item' + (item.full ? ' full-width' : ''));
            const label = createEl('div', 'overview-label');
            label.textContent = item.label;
            const value = createEl('div', 'overview-value');
            value.textContent = item.value;
            div.appendChild(label);
            div.appendChild(value);
            overview.appendChild(div);
        });
    }

    // 学习路径（手风琴）
    const pathContainer = document.getElementById('detailLearningPath');
    if (pathContainer && job.levels && job.levels.length > 0) {
        const pathTitle = createEl('div', 'card-title');
        pathTitle.textContent = '学习路径';
        pathTitle.style.cssText = 'font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-3);';
        pathContainer.appendChild(pathTitle);

        // === Feature 1: 用户阶段选择器 ===
        const stages = [
            { label: '在校生', value: 'student' },
            { label: '刚入行(0-2年)', value: 'junior' },
            { label: '有一定经验(2-5年)', value: 'mid' },
            { label: '资深(5年+)', value: 'senior' }
        ];
        const stageConfig = {
            'student': { expand: 0, dimFrom: 2 },
            'junior':  { expand: 1, dimFrom: 3 },
            'mid':     { expand: 2, dimFrom: 4 },
            'senior':  { expand: 3, dimFrom: 5 }
        };

        let currentStage = null;
        try { currentStage = localStorage.getItem('byt_user_stage'); } catch(e) {}

        const stageSelector = createEl('div', 'path-stage-selector');
        const stageChips = [];
        stages.forEach(function(s) {
            const chip = createEl('button', 'path-stage-chip' + (currentStage === s.value ? ' active' : ''));
            chip.textContent = s.label;
            chip.setAttribute('data-stage', s.value);
            chip.addEventListener('click', function() {
                const selected = chip.getAttribute('data-stage');
                if (currentStage === selected) {
                    // 取消选择
                    currentStage = null;
                    try { localStorage.removeItem('byt_user_stage'); } catch(e) {}
                } else {
                    currentStage = selected;
                    try { localStorage.setItem('byt_user_stage', selected); } catch(e) {}
                }
                // 刷新详情以重新渲染
                openJobDetailModal(jobId);
            });
            stageChips.push(chip);
            stageSelector.appendChild(chip);
        });
        pathContainer.appendChild(stageSelector);

        // 读取进度
        const progressKey = 'byt_path_progress_' + jobId;
        let progressData = {};
        try { progressData = JSON.parse(localStorage.getItem(progressKey) || '{}'); } catch(e) {}

        const activeStageCfg = currentStage ? stageConfig[currentStage] : null;

        job.levels.forEach(function(level, lvIdx) {
            const levelCard = createEl('div', 'level-card');

            // Feature 1: 根据阶段设置 dimmed / 推荐起点
            if (activeStageCfg) {
                if (lvIdx === activeStageCfg.expand) {
                    // 推荐起点 - 稍后添加 badge
                } else if (lvIdx >= activeStageCfg.dimFrom) {
                    levelCard.classList.add('dimmed');
                }
            }

            // 头部（可点击展开/折叠）
            const levelHeader = createEl('div', 'level-header');

            const levelIcon = createEl('span', 'level-icon');
            levelIcon.textContent = level.icon || '📖';

            const levelInfo = createEl('div', 'level-info');
            const levelName = createEl('div', 'level-name');

            // 阶段名称映射：level.name → 发展期名称
            const stageMap = {
                '入门': '起步期', '基础': '发展期', '核心': '提升期',
                '进阶': '突破期', '精通': '引领期'
            };
            const displayName = stageMap[level.name] || level.name || '';
            levelName.textContent = '第' + level.level + '阶段 · ' + displayName;

            // Feature 1: 推荐起点 badge
            if (activeStageCfg && lvIdx === activeStageCfg.expand) {
                const badge = createEl('span', 'level-badge');
                badge.textContent = '推荐起点';
                levelName.appendChild(badge);
            }

            const levelDesc = createEl('div', 'level-desc');
            levelDesc.textContent = level.desc || '';

            // Feature 1: dimmed 级别显示"后续解锁"
            if (levelCard.classList.contains('dimmed')) {
                const lockLabel = createEl('span', '');
                lockLabel.textContent = ' · 后续解锁';
                lockLabel.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);';
                levelName.appendChild(lockLabel);
            }

            // 目标成果
            if (level.outcome) {
                const outcome = createEl('div', 'level-outcome');
                outcome.textContent = '🎯 ' + level.outcome;
                levelInfo.appendChild(outcome);
            }

            levelInfo.appendChild(levelName);
            levelInfo.appendChild(levelDesc);

            const arrow = createEl('span', 'level-arrow');
            arrow.textContent = '›';

            levelHeader.appendChild(levelIcon);
            levelHeader.appendChild(levelInfo);
            levelHeader.appendChild(arrow);

            // 步骤内容
            const stepsDiv = createEl('div', 'level-steps');

            if (level.steps && level.steps.length > 0) {
                level.steps.forEach(function(step, stepIdx) {
                    const stepKey = lvIdx + '_' + stepIdx;
                    const isCompleted = !!progressData[stepKey];

                    const stepItem = createEl('div', 'step-item' + (isCompleted ? ' completed' : ''));

                    const stepIcon = createEl('span', 'step-icon');
                    stepIcon.textContent = isCompleted ? '✅' : (step.icon || '📌');

                    const stepInfo = createEl('div', '');
                    const stepTitleRow = createEl('div', '');
                    stepTitleRow.style.cssText = 'display:flex;align-items:center;justify-content:space-between;gap:var(--space-2);';

                    const stepTitle = createEl('div', 'step-title');
                    stepTitle.textContent = step.title || '';
                    if (isCompleted) {
                        stepTitle.style.textDecoration = 'line-through';
                        stepTitle.style.opacity = '0.6';
                    }

                    stepTitleRow.appendChild(stepTitle);

                    // 预估时间
                    if (step.estimatedTime) {
                        const timeEl = createEl('span', 'step-time');
                        const hours = Math.round(step.estimatedTime / 60);
                        if (hours >= 1) {
                            timeEl.textContent = '⏱ ' + hours + '小时';
                        } else {
                            timeEl.textContent = '⏱ ' + step.estimatedTime + '分钟';
                        }
                        stepTitleRow.appendChild(timeEl);
                    }

                    stepInfo.appendChild(stepTitleRow);

                    const stepDesc = createEl('div', 'step-desc');
                    stepDesc.textContent = step.description || '';
                    stepInfo.appendChild(stepDesc);

                    // 实用建议
                    if (step.tip) {
                        const tipEl = createEl('div', 'step-tip');
                        tipEl.textContent = '💡 ' + step.tip;
                        stepInfo.appendChild(tipEl);
                    }

                    // === Feature 2: 学习资源链接 ===
                    const resourceBtn = createEl('a', 'step-resource');
                    resourceBtn.textContent = '📚 学习资源';
                    resourceBtn.target = '_blank';
                    resourceBtn.rel = 'noopener';
                    const searchQuery = encodeURIComponent(job.name + ' ' + step.title + ' 学习教程');
                    resourceBtn.href = 'https://www.baidu.com/s?wd=' + searchQuery;
                    resourceBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                    });
                    stepInfo.appendChild(resourceBtn);

                    stepItem.appendChild(stepIcon);
                    stepItem.appendChild(stepInfo);

                    // 点击标记完成/取消
                    stepItem.style.cursor = 'pointer';
                    stepItem.addEventListener('click', function(e) {
                        e.stopPropagation();
                        progressData[stepKey] = !progressData[stepKey];
                        try { localStorage.setItem(progressKey, JSON.stringify(progressData)); } catch(e2) {}
                        // 刷新详情
                        openJobDetailModal(jobId);
                    });

                    stepsDiv.appendChild(stepItem);
                });
            }

            levelCard.appendChild(levelHeader);
            levelCard.appendChild(stepsDiv);

            // 手风琴切换
            levelHeader.addEventListener('click', function() {
                const isExpanded = stepsDiv.classList.contains('expanded');
                // 关闭所有
                const allSteps = pathContainer.querySelectorAll('.level-steps');
                const allHeaders = pathContainer.querySelectorAll('.level-header');
                for (let i = 0; i < allSteps.length; i++) {
                    allSteps[i].classList.remove('expanded');
                }
                for (let j = 0; j < allHeaders.length; j++) {
                    allHeaders[j].classList.remove('expanded');
                }
                // 切换当前
                if (!isExpanded) {
                    stepsDiv.classList.add('expanded');
                    levelHeader.classList.add('expanded');
                }
            });

            pathContainer.appendChild(levelCard);

            // Feature 1: 自动展开推荐起点
            if (activeStageCfg && lvIdx === activeStageCfg.expand) {
                stepsDiv.classList.add('expanded');
                levelHeader.classList.add('expanded');
            }
        });

        // === Feature 3: 学习计划生成器 ===
        const planBtn = createEl('button', 'btn btn-primary');
        planBtn.style.cssText = 'width:100%;margin-top:var(--space-4);';
        planBtn.textContent = '📋 生成我的学习计划';
        planBtn.addEventListener('click', function() {
            // 确定推荐级别
            let targetLevelIdx = 0;
            let targetLevel = job.levels[0];
            if (activeStageCfg) {
                targetLevelIdx = activeStageCfg.expand;
                targetLevel = job.levels[targetLevelIdx];
            }
            if (!targetLevel || !targetLevel.steps || targetLevel.steps.length === 0) {
                showToast('暂无学习步骤数据');
                return;
            }

            // 构建计划 HTML
            let html = '<div style="text-align:right;margin-bottom:8px;"><span id="planCloseBtn" style="font-size:18px;color:var(--text-tertiary);cursor:pointer;padding:4px 8px;">✕</span></div>';
            html += '<div style="font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-4);text-align:center;">' + escapeHtml(job.name) + ' - 学习计划</div>';

            // 本周重点
            html += '<div class="plan-section"><div class="plan-section-title">📌 本周重点</div>';
            const weekSteps = targetLevel.steps.slice(0, 2);
            for (let wi = 0; wi < weekSteps.length; wi++) {
                const ws = weekSteps[wi];
                const wh = ws.estimatedTime ? Math.round(ws.estimatedTime / 60) : 0;
                const wt = wh >= 1 ? wh + '小时' : (ws.estimatedTime ? ws.estimatedTime + '分钟' : '');
                html += '<div class="plan-item"><span class="plan-item-icon">☐</span><span class="plan-item-text">' + escapeHtml(ws.title || '') + '</span><span class="plan-item-time">' + wt + '</span></div>';
            }
            html += '</div>';

            // 本月目标
            html += '<div class="plan-section"><div class="plan-section-title">🎯 本月目标</div>';
            let totalMin = 0;
            for (let ti = 0; ti < targetLevel.steps.length; ti++) {
                totalMin += (targetLevel.steps[ti].estimatedTime || 0);
            }
            const totalH = Math.round(totalMin / 60);
            const totalTimeStr = totalH >= 1 ? '约' + totalH + '小时' : '约' + totalMin + '分钟';
            html += '<div class="plan-item"><span class="plan-item-icon">🏆</span><span class="plan-item-text">完成「第' + targetLevel.level + '级 · ' + escapeHtml(targetLevel.name || '') + '」全部 ' + targetLevel.steps.length + ' 个步骤</span><span class="plan-item-time">' + totalTimeStr + '</span></div>';

            for (let si = 0; si < targetLevel.steps.length; si++) {
                const ss = targetLevel.steps[si];
                const sh = ss.estimatedTime ? Math.round(ss.estimatedTime / 60) : 0;
                const st = sh >= 1 ? sh + '小时' : (ss.estimatedTime ? ss.estimatedTime + '分钟' : '');
                html += '<div class="plan-item"><span class="plan-item-icon">☐</span><span class="plan-item-text">' + escapeHtml(ss.title || '') + '</span><span class="plan-item-time">' + st + '</span></div>';
            }
            html += '</div>';

            // 分享按钮
            html += '<button class="btn btn-outline" id="planShareBtn" style="width:100%;margin-top:var(--space-4);">分享到社区</button>';

            showModal(html);

            // 绑定事件
            const closeEl = document.getElementById('planCloseBtn');
            if (closeEl) closeEl.addEventListener('click', function() { hideModal(); });

            const shareEl = document.getElementById('planShareBtn');
            if (shareEl) shareEl.addEventListener('click', function() {
                let planText = job.name + ' 学习计划\n本周重点:\n';
                for (let pi = 0; pi < weekSteps.length; pi++) {
                    planText += '- ' + (weekSteps[pi].title || '') + '\n';
                }
                planText += '本月目标: 完成' + (targetLevel.name || '') + '\n';
                try {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(planText);
                    } else {
                        const ta = document.createElement('textarea');
                        ta.value = planText;
                        ta.style.position = 'fixed';
                        ta.style.opacity = '0';
                        document.body.appendChild(ta);
                        ta.select();
                        document.execCommand('copy');
                        document.body.removeChild(ta);
                    }
                    showToast('已复制到剪贴板');
                } catch(e) {
                    showToast('已复制到剪贴板');
                }
            });
        });
        pathContainer.appendChild(planBtn);
    }

    // 底部操作栏
    const actions = document.getElementById('detailActions');
    if (actions) {
        // 收藏按钮
        const favBtn = createEl('button', 'btn btn-secondary');
        const favText = isFavorite(jobId) ? '已收藏' : '收藏';
        favBtn.textContent = (isFavorite(jobId) ? '⭐' : '☆') + ' ' + favText;
        favBtn.addEventListener('click', function() {
            const nowFav = toggleFavorite(jobId);
            favBtn.textContent = (nowFav ? '⭐' : '☆') + ' ' + (nowFav ? '已收藏' : '收藏');
            showToast(nowFav ? '已收藏' : '已取消收藏', 'success');

            // 检查收藏相关成就
            if (nowFav) {
                checkAchievement('first_star');
                checkAchievement('ten_stars');
            }
        });

        // 分享按钮
        const shareBtn = createEl('button', 'btn btn-secondary');
        shareBtn.textContent = '🔗 分享';
        shareBtn.addEventListener('click', function() {
            const shareText = job.name + ' - ' + (ov.shortDesc || job.desc);
            if (navigator.share) {
                navigator.share({ title: '百事通 - ' + job.name, text: shareText }).catch(function() {});
            } else {
                // 复制到剪贴板
                if (navigator.clipboard) {
                    navigator.clipboard.writeText(shareText).then(function() {
                        showToast('已复制到剪贴板', 'success');
                    }).catch(function() {
                        showToast('分享失败', 'error');
                    });
                }
            }
        });

        // AI 提问按钮
        const aiBtn = createEl('button', 'btn btn-primary');
        aiBtn.textContent = '🤖 AI提问';
        aiBtn.addEventListener('click', function() {
            hideModal();
            // 跳转到 AI 页面并预填问题
            resetPageInit('page-ai');
            navigateTo('page-ai');
            // 延迟设置输入框内容
            setTimeout(function() {
                const aiInput = document.getElementById('aiChatInput');
                if (aiInput) {
                    aiInput.value = '请介绍一下' + job.name + '这个职业';
                    aiInput.focus();
                }
            }, 200);
        });

        actions.appendChild(favBtn);
        actions.appendChild(shareBtn);
        actions.appendChild(aiBtn);
    }

    // 相关职业推荐
    const relatedContainer = document.getElementById('detailRelated');
    if (relatedContainer && job.category) {
        const relatedTitle = createEl('div', 'card-title');
        relatedTitle.textContent = '相关职业';
        relatedTitle.style.cssText = 'font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-3);';
        relatedContainer.appendChild(relatedTitle);

        const relatedGrid = createEl('div', '');
        relatedGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2);';

        // 从同分类中随机选取 3-6 个相关职业（排除当前）
        try {
            const catData = getCategoriesByGroup();
            let sameCategoryJobs = [];
            catData.forEach(function(group) {
                group.categories.forEach(function(cat) {
                    if (cat.id === job.category) {
                        sameCategoryJobs = cat.jobs || [];
                    }
                });
            });

            // 过滤掉当前职业，随机取 6 个
            const others = sameCategoryJobs.filter(function(j) { return j.id !== jobId; });
            const shuffled = others.sort(function() { return 0.5 - Math.random(); });
            const related = shuffled.slice(0, 6);

            related.forEach(function(rj) {
                const card = createEl('div', '');
                card.style.cssText = 'background:var(--bg-tertiary);border-radius:var(--radius-md);padding:var(--space-2);text-align:center;cursor:pointer;transition:transform 0.15s ease;';
                card.textContent = (rj.icon || '💼') + ' ' + (rj.name || '');
                card.style.fontSize = 'var(--text-xs)';
                card.addEventListener('click', function() {
                    hideModal();
                    setTimeout(function() {
                        openJobDetailModal(rj.id);
                    }, 300);
                });
                card.addEventListener('mouseenter', function() {
                    card.style.transform = 'scale(1.05)';
                });
                card.addEventListener('mouseleave', function() {
                    card.style.transform = 'scale(1)';
                });
                relatedGrid.appendChild(card);
            });

            if (related.length === 0) {
                const empty = createEl('div', '');
                empty.textContent = '暂无相关职业';
                empty.style.cssText = 'color:var(--text-tertiary);font-size:var(--text-sm);text-align:center;padding:var(--space-3);';
                relatedGrid.appendChild(empty);
            }

            relatedContainer.appendChild(relatedGrid);
        } catch (e) {
            // 静默失败
        }
    }
}
