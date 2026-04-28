// ==================== compare.js - 职业对比页 ====================
// 百事通 v1.0
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl, showConfirm, showToast, showModal, hideModal, debounce } from '../utils/ui.js';
import { clearCompare, getCompareSlots, removeFromCompare, getFavorites, addToCompare, checkAchievement, getCurrentModel } from '../state.js';
import { searchJobs } from '../utils/search.js';
import { getJob } from '../data-loader.js';
import { navigateTo } from '../router.js';
import { isModelConfigured, callAI, renderMarkdown } from '../ai-engine.js';

// 页面状态
const _compareState = {
    isAiLoading: false
};

/**
 * 初始化职业对比页
 */
export function initCompare() {
    const container = document.getElementById('page-compare');
    if (!container) return;

    clearContainer(container);
    renderCompare(container);
}

window.initCompare = initCompare;

/**
 * 渲染对比页
 * @param {HTMLElement} container
 */
function renderCompare(container) {
    // 标题
    const header = createEl('div', 'page-header');

    const title = createEl('h2', '');
    title.textContent = '职业对比';

    const clearBtn = createEl('button', 'btn btn-secondary btn-sm');
    clearBtn.textContent = '清空';

    clearBtn.addEventListener('click', function() {
        showConfirm('清空对比', '确定清空所有对比职业吗？', function() {
            clearCompare();
            renderCompare(container);
            showToast('已清空对比', 'info');
        });
    });

    header.appendChild(title);
    header.appendChild(clearBtn);
    container.appendChild(header);

    // 对比槽位
    const slots = createCompareSlots();
    container.appendChild(slots);

    // 对比表格
    const table = createCompareTable();
    container.appendChild(table);
}

// ==================== 对比槽位 ====================

function createCompareSlots() {
    const wrap = createEl('div', 'compare-slots');
    const slots = getCompareSlots();

    for (let i = 0; i < 3; i++) {
        const slot = createEl('div', 'compare-slot' + (slots[i] ? ' filled' : ''));

        if (slots[i]) {
            // 已填充
            const icon = createEl('span', 'slot-icon');
            icon.textContent = slots[i].icon || '💼';

            const name = createEl('span', 'slot-name');
            name.textContent = slots[i].name || '';

            slot.appendChild(icon);
            slot.appendChild(name);

            // 点击移除
            (function(idx) {
                slot.addEventListener('click', function() {
                    removeFromCompare(slots[idx].id);
                    renderCompare(document.getElementById('page-compare'));
                    showToast('已移除', 'info');
                });
            })(i);
        } else {
            // 空槽位
            const addIcon = createEl('span', 'slot-add-icon');
            addIcon.textContent = '+';

            const addLabel = createEl('span', 'slot-add-label');
            addLabel.textContent = '添加职业';

            slot.appendChild(addIcon);
            slot.appendChild(addLabel);

            // 点击选择职业
            (function() {
                slot.addEventListener('click', function() {
                    showJobPicker();
                });
            })();
        }

        wrap.appendChild(slot);
    }

    return wrap;
}

// ==================== 职业选择器 ====================

function showJobPicker() {
    const favorites = getFavorites();

    const html = '<div class="ai-settings-panel" id="jobPicker"></div>';
    showModal(html);

    const panel = document.getElementById('jobPicker');
    if (!panel) return;

    const title = createEl('div', 'modal-section-title');
    title.textContent = '选择要对比的职业';
    panel.appendChild(title);

    // 搜索框
    const searchBox = createEl('div', 'mb-3');

    const input = createEl('input', 'input');
    input.type = 'text';
    input.placeholder = '搜索职业...';
    input.setAttribute('aria-label', '搜索职业');
    searchBox.appendChild(input);
    panel.appendChild(searchBox);

    // 结果列表
    const resultList = createEl('div', 'picker-list');
    resultList.id = 'pickerResults';

    // 渲染收藏列表
    function renderPickerResults(keyword) {
        clearContainer(resultList);

        const jobs = [];
        if (keyword) {
            const searchResults = searchJobs(keyword, 20);
            searchResults.forEach(function(j) { jobs.push(j); });
        } else {
            // 默认显示收藏
            favorites.forEach(function(jobId) {
                const job = getJob(jobId);
                if (job) jobs.push(job);
            });
        }

        if (jobs.length === 0) {
            const empty = createEl('div', 'empty-state');
            empty.textContent = keyword ? '未找到相关职业' : '暂无收藏，请搜索添加';
            resultList.appendChild(empty);
            return;
        }

        // 过滤已在对比中的
        const compareSlots = getCompareSlots();
        const compareIds = compareSlots.map(function(s) { return s.id; });

        jobs.forEach(function(job) {
            if (compareIds.indexOf(job.id) !== -1) return;

            const item = createEl('div', 'picker-item');

            item.addEventListener('mouseenter', function() {
                item.classList.add('active');
            });
            item.addEventListener('mouseleave', function() {
                item.classList.remove('active');
            });

            const icon = createEl('span', 'picker-icon');
            icon.textContent = job.icon || '💼';

            const name = createEl('span', 'picker-name');
            name.textContent = job.name || '';

            const desc = createEl('span', 'picker-desc');
            desc.textContent = job.desc || '';

            const addIcon = createEl('span', 'picker-add');
            addIcon.textContent = '+';

            item.appendChild(icon);
            item.appendChild(name);
            item.appendChild(addIcon);

            item.addEventListener('click', function() {
                const added = addToCompare(job.id, job.name, job.icon);
                if (added) {
                    hideModal();
                    renderCompare(document.getElementById('page-compare'));
                    showToast('已添加到对比', 'success');

                    // 检查对比成就
                    checkAchievement('custom_job');
                } else {
                    showToast('最多对比3个职业', 'error');
                }
            });

            resultList.appendChild(item);
        });
    }

    renderPickerResults('');

    // 搜索
    input.addEventListener('input', debounce(function() {
        renderPickerResults(input.value.trim());
    }, 300));

    panel.appendChild(resultList);
}

// ==================== 对比表格 ====================

function createCompareTable() {
    const wrap = createEl('div', '');
    const slots = getCompareSlots();

    if (slots.length < 2) {
        const hint = createEl('div', 'empty-state');
        hint.textContent = '请至少选择2个职业进行对比';
        wrap.appendChild(hint);
        return wrap;
    }

    // 获取职业数据
    const jobs = slots.map(function(slot) {
        return getJob(slot.id);
    }).filter(Boolean);

    // 对比维度
    const dimensions = [
        { label: '工作内容', getVal: function(j) { return (j.overview && j.overview.whatDo) || '暂无'; } },
        { label: '工作环境', getVal: function(j) { return (j.overview && j.overview.environment) || '暂无'; } },
        { label: '工作时间', getVal: function(j) { return (j.overview && j.overview.workTime) || '暂无'; } },
        { label: '薪资待遇', getVal: function(j) { return (j.overview && j.overview.salary) || '暂无'; } },
        { label: '适合人群', getVal: function(j) { return (j.overview && j.overview.whoFits) || '暂无'; } },
        { label: '优点', getVal: function(j) { return (j.overview && j.overview.pros) || '暂无'; } },
        { label: '注意事项', getVal: function(j) { return (j.overview && j.overview.cons) || '暂无'; } }
    ];

    const table = createEl('table', 'compare-table');

    // 表头
    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');

    const thEmpty = document.createElement('th');
    thEmpty.textContent = '';
    headerRow.appendChild(thEmpty);

    jobs.forEach(function(job) {
        const th = document.createElement('th');
        th.textContent = job.icon + ' ' + job.name;
        th.style.cssText = 'width:auto;font-weight:var(--font-semibold);color:var(--text-primary);font-size:var(--text-sm);white-space:nowrap;';
        headerRow.appendChild(th);
    });

    thead.appendChild(headerRow);
    table.appendChild(thead);

    // 表体
    const tbody = document.createElement('tbody');

    dimensions.forEach(function(dim) {
        const tr = document.createElement('tr');

        const tdLabel = document.createElement('td');
        tdLabel.textContent = dim.label;
        tr.appendChild(tdLabel);

        jobs.forEach(function(job) {
            const td = document.createElement('td');
            td.textContent = dim.getVal(job);
            td.style.cssText = 'font-size:var(--text-xs);line-height:var(--leading-relaxed);max-width:150px;';
            tr.appendChild(td);
        });

        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    wrap.appendChild(table);

    // AI 总结按钮
    const aiSection = createEl('div', 'compare-ai-section');

    const aiBtn = createEl('button', 'btn btn-primary btn-lg btn-full');
    aiBtn.textContent = '🤖 AI 对比分析';

    aiBtn.addEventListener('click', function() {
        generateAiCompare(jobs, wrap);
    });

    aiSection.appendChild(aiBtn);
    wrap.appendChild(aiSection);

    return wrap;
}

// ==================== AI 对比分析 ====================

function generateAiCompare(jobs, container) {
    if (_compareState.isAiLoading) return;

    // 检查 API Key
    const modelId = getCurrentModel();
    if (!isModelConfigured(modelId)) {
        showToast('请先配置 AI API Key', 'error');
        return;
    }

    _compareState.isAiLoading = true;

    // 构建对比提示
    const jobInfos = jobs.map(function(job) {
        const ov = job.overview || {};
        return job.name + '：' + (ov.shortDesc || job.desc) + '。薪资：' + (ov.salary || '未知') + '。适合人群：' + (ov.whoFits || '未知') + '。优点：' + (ov.pros || '未知') + '。注意事项：' + (ov.cons || '未知');
    }).join('\n\n');

    const prompt = '请对比分析以下职业，从发展前景、薪资水平、入行难度、工作强度等方面进行对比，给出建议：\n\n' + jobInfos;

    const messages = [{ role: 'user', content: prompt }];

    // 显示加载
    const loadingDiv = createEl('div', 'ai-result-card');
    loadingDiv.id = 'aiCompareLoading';
    loadingDiv.textContent = 'AI 正在分析中...';
    container.appendChild(loadingDiv);

    callAI(modelId, messages).then(function(reply) {
        // 移除加载
        const loading = document.getElementById('aiCompareLoading');
        if (loading && loading.parentNode) {
            loading.parentNode.removeChild(loading);
        }

        // 显示结果
        const resultDiv = createEl('div', 'ai-result-card');
        resultDiv.id = 'aiCompareResult';

        // AI 返回内容：先 sanitize 再用 innerHTML 渲染
        resultDiv.innerHTML = renderMarkdown(reply);

        container.appendChild(resultDiv);
        _compareState.isAiLoading = false;
    }).catch(function(err) {
        const loading = document.getElementById('aiCompareLoading');
        if (loading && loading.parentNode) {
            loading.parentNode.removeChild(loading);
        }

        showToast('AI 分析失败: ' + (err.message || '未知错误'), 'error');
        _compareState.isAiLoading = false;
    });
}
