// ==================== tips.js - 生活常识 ====================
// 百事通 v1.0
// 安全原则：所有用户输入和动态内容用 textContent 渲染

import { clearContainer, createEl, showModal, hideModal } from '../utils/ui.js';

let tipsData = null;
let currentCategory = null;
const currentSub = null;
let searchKeyword = '';

/**
 * 初始化生活常识页面
 */
export function initTips() {
    const page = document.getElementById('page-tips');
    if (!page) return;

    // 加载数据（缓存）
    if (!tipsData) {
        fetch('js/data/tips_cn.json')
            .then(function(res) { return res.json(); })
            .then(function(data) {
                tipsData = data;
                renderPage(page);
            })
            .catch(function() {
                clearContainer(page);
                const empty = createEl('div', 'empty-state');
                const icon = createEl('div', 'empty-icon');
                icon.textContent = '💡';
                const title = createEl('div', 'empty-title');
                title.textContent = '数据加载失败';
                empty.appendChild(icon);
                empty.appendChild(title);
                page.appendChild(empty);
            });
    } else {
        clearContainer(page);
        renderPage(page);
    }
}

window.initTips = initTips;

/**
 * 渲染页面
 * @param {HTMLElement} page
 */
function renderPage(page) {
    clearContainer(page);

    // 顶部标题栏
    const header = createEl('div', 'tips-header');
    const title = createEl('h1', 'tips-title', '💡 生活常识');
    const subtitle = createEl('p', 'tips-subtitle', tipsData.totalTips + '条实用小技巧');
    header.appendChild(title);
    header.appendChild(subtitle);
    page.appendChild(header);

    // 搜索栏
    const searchWrap = createEl('div', 'tips-search');
    const searchBox = createEl('div', 'search-box');

    const searchIcon = createEl('span', 'search-icon', '🔍');

    const searchInput = document.createElement('input');
    searchInput.className = 'input';
    searchInput.type = 'text';
    searchInput.placeholder = '搜索生活常识...';
    searchInput.id = 'tipsSearchInput';
    searchInput.setAttribute('aria-label', '搜索生活常识');

    const searchClear = createEl('span', 'search-clear', '✕');
    searchClear.id = 'tipsSearchClear';

    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchInput);
    searchBox.appendChild(searchClear);
    searchWrap.appendChild(searchBox);
    page.appendChild(searchWrap);

    // 分类标签
    const tabsWrap = createEl('div', 'tips-tabs');
    tabsWrap.id = 'tipsTabs';

    const allBtn = createEl('button', 'chip active', '📋 全部');
    allBtn.setAttribute('data-cat', 'all');
    tabsWrap.appendChild(allBtn);

    for (let i = 0; i < tipsData.categories.length; i++) {
        const cat = tipsData.categories[i];
        const btn = createEl('button', 'chip', cat.icon + ' ' + cat.name);
        btn.setAttribute('data-cat', cat.id);
        tabsWrap.appendChild(btn);
    }
    page.appendChild(tabsWrap);

    // 内容区域
    const content = createEl('div', 'tips-content');
    content.id = 'tipsContent';
    page.appendChild(content);

    // 绑定事件
    bindEvents(page);

    // 默认显示全部
    showAll();
}

/**
 * 绑定事件
 * @param {HTMLElement} page
 */
function bindEvents(page) {
    // 分类切换
    const tabs = page.querySelector('#tipsTabs');
    tabs.addEventListener('click', function(e) {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        // 更新active
        tabs.querySelectorAll('.chip').forEach(function(t) { t.classList.remove('active'); });
        btn.classList.add('active');
        const catId = btn.getAttribute('data-cat');
        currentCategory = catId;
        searchKeyword = '';
        const input = page.querySelector('#tipsSearchInput');
        if (input) input.value = '';
        page.querySelector('#tipsSearchClear').classList.remove('visible');

        if (catId === 'all') {
            showAll();
        } else {
            showCategory(catId);
        }
    });

    // 搜索
    const input = page.querySelector('#tipsSearchInput');
    const clearBtn = page.querySelector('#tipsSearchClear');
    input.addEventListener('input', function() {
        searchKeyword = this.value.trim();
        if (searchKeyword.length > 0) {
            clearBtn.classList.add('visible');
            doSearch(searchKeyword);
        } else {
            clearBtn.classList.remove('visible');
            // 恢复当前分类
            if (currentCategory && currentCategory !== 'all') {
                showCategory(currentCategory);
            } else {
                showAll();
            }
        }
    });
    clearBtn.addEventListener('click', function() {
        input.value = '';
        searchKeyword = '';
        this.classList.remove('visible');
        if (currentCategory && currentCategory !== 'all') {
            showCategory(currentCategory);
        } else {
            showAll();
        }
    });
}

/**
 * 显示全部分类
 */
function showAll() {
    const content = document.getElementById('tipsContent');
    clearContainer(content);
    for (let i = 0; i < tipsData.categories.length; i++) {
        const cat = tipsData.categories[i];
        content.appendChild(renderCategory(cat));
    }
}

/**
 * 显示单个分类
 * @param {string} catId
 */
function showCategory(catId) {
    let cat = null;
    for (let i = 0; i < tipsData.categories.length; i++) {
        if (tipsData.categories[i].id === catId) { cat = tipsData.categories[i]; break; }
    }
    if (!cat) return;
    const content = document.getElementById('tipsContent');
    clearContainer(content);
    content.appendChild(renderCategory(cat));
}

/**
 * 渲染分类区块
 * @param {Object} cat
 * @returns {HTMLElement}
 */
function renderCategory(cat) {
    const wrap = createEl('div', 'tips-category');

    const catHeader = createEl('div', 'tips-cat-header');
    const catIcon = createEl('span', 'tips-cat-icon', cat.icon);
    const catName = createEl('h2', 'tips-cat-name', cat.name);
    const catDesc = createEl('span', 'tips-cat-desc', cat.desc);
    catHeader.appendChild(catIcon);
    catHeader.appendChild(catName);
    catHeader.appendChild(catDesc);
    wrap.appendChild(catHeader);

    for (let i = 0; i < cat.subCategories.length; i++) {
        const sub = cat.subCategories[i];
        const subWrap = createEl('div', 'tips-sub');
        const subName = createEl('h3', 'tips-sub-name', sub.name);
        subWrap.appendChild(subName);

        const list = createEl('div', 'tips-list');
        for (let j = 0; j < sub.tips.length; j++) {
            list.appendChild(renderTipCard(sub.tips[j]));
        }
        subWrap.appendChild(list);
        wrap.appendChild(subWrap);
    }

    return wrap;
}

/**
 * 渲染单条常识卡片（列表模式，只显示标题）
 * @param {Object} tip
 * @returns {HTMLElement}
 */
function renderTipCard(tip) {
    const card = createEl('div', 'tip-card');
    card.setAttribute('data-tip-id', tip.id);
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.style.cursor = 'pointer';

    const header = createEl('div', 'tip-card-header');
    const title = createEl('h4', 'tip-title', tip.title);
    header.appendChild(title);

    // 右侧箭头提示可点击
    const arrow = createEl('span', '');
    arrow.textContent = '›';
    arrow.style.cssText = 'font-size:20px;color:var(--text-tertiary);margin-left:auto;flex-shrink:0;';
    header.style.cssText = 'display:flex;align-items:center;gap:var(--space-2);';
    header.appendChild(arrow);

    card.appendChild(header);

    // 只显示前一行内容作为预览
    const preview = createEl('p', 'tip-preview', tip.content.length > 40 ? tip.content.substring(0, 40) + '...' : tip.content);
    card.appendChild(preview);

    // 点击弹窗显示详情
    card.addEventListener('click', function() {
        showTipDetail(tip);
    });

    return card;
}

/**
 * 弹窗显示常识详情
 * @param {Object} tip
 */
function showTipDetail(tip) {
    const html = '<div class="tip-detail-modal" id="tipDetailModal"></div>';
    showModal(html);

    const modal = document.getElementById('tipDetailModal');
    if (!modal) return;

    // 标题
    const title = createEl('h2', 'tip-detail-title');
    title.textContent = tip.title;
    title.style.cssText = 'font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--text-primary);margin-bottom:var(--space-3);line-height:1.4;';
    modal.appendChild(title);

    // 内容
    const content = createEl('p', 'tip-detail-content');
    content.textContent = tip.content;
    content.style.cssText = 'font-size:var(--text-base);color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-4);';
    modal.appendChild(content);

    // 标签
    if (tip.tags && tip.tags.length > 0) {
        const tagsWrap = createEl('div', 'tip-tags');
        for (let i = 0; i < tip.tags.length; i++) {
            const tag = createEl('span', 'tip-tag', tip.tags[i]);
            tagsWrap.appendChild(tag);
        }
        modal.appendChild(tagsWrap);
    }

    // 关闭按钮
    const closeBtn = createEl('button', 'btn btn-primary');
    closeBtn.style.cssText = 'width:100%;margin-top:var(--space-4);';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', function() {
        hideModal();
    });
    modal.appendChild(closeBtn);
}

/**
 * 搜索
 * @param {string} keyword
 */
function doSearch(keyword) {
    const results = [];
    const kw = keyword.toLowerCase();
    for (let i = 0; i < tipsData.categories.length; i++) {
        const cat = tipsData.categories[i];
        for (let j = 0; j < cat.subCategories.length; j++) {
            const sub = cat.subCategories[j];
            for (let k = 0; k < sub.tips.length; k++) {
                const tip = sub.tips[k];
                if (tip.title.toLowerCase().indexOf(kw) !== -1 ||
                    tip.content.toLowerCase().indexOf(kw) !== -1 ||
                    (tip.tags && tip.tags.some(function(t) { return t.toLowerCase().indexOf(kw) !== -1; }))) {
                    results.push({ tip: tip, catName: cat.icon + ' ' + cat.name, subName: sub.name });
                }
            }
        }
    }

    const content = document.getElementById('tipsContent');
    clearContainer(content);

    if (results.length === 0) {
        const empty = createEl('div', 'empty-state');
        const icon = createEl('div', 'empty-icon');
        icon.textContent = '🔍';
        const title = createEl('div', 'empty-title');
        title.textContent = '没有找到相关常识';
        empty.appendChild(icon);
        empty.appendChild(title);
        content.appendChild(empty);
    } else {
        const resultWrap = createEl('div', 'tips-search-result');
        const countEl = createEl('p', 'tips-search-count', '找到 ' + results.length + ' 条相关常识');
        resultWrap.appendChild(countEl);

        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            const card = createEl('div', 'tip-card');
            card.setAttribute('role', 'button');
            card.setAttribute('tabindex', '0');
            card.style.cursor = 'pointer';

            const cardHeader = createEl('div', 'tip-card-header');
            const catLabel = createEl('span', 'tip-card-cat', r.catName + ' · ' + r.subName);
            cardHeader.appendChild(catLabel);

            // 箭头
            const arrow = createEl('span', '');
            arrow.textContent = '›';
            arrow.style.cssText = 'font-size:20px;color:var(--text-tertiary);margin-left:auto;flex-shrink:0;';
            cardHeader.style.cssText = 'display:flex;align-items:center;gap:var(--space-2);';
            cardHeader.appendChild(arrow);

            card.appendChild(cardHeader);

            const tipTitle = createEl('h4', 'tip-title', r.tip.title);
            card.appendChild(tipTitle);

            const preview = createEl('p', 'tip-preview', r.tip.content.length > 40 ? r.tip.content.substring(0, 40) + '...' : r.tip.content);
            card.appendChild(preview);

            card.addEventListener('click', function() {
                showTipDetail(r.tip);
            });

            resultWrap.appendChild(card);
        }
        content.appendChild(resultWrap);
    }
}
