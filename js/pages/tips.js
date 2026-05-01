// ==================== tips.js - 生活常识 ====================
// 百事通 v1.0
// 三级导航：大类 → 中类 → 内容

import { clearContainer, createEl, showModal, hideModal } from '../utils/ui.js';
import { icon } from '../utils/icons.js';

let tipsData = null;
let currentCategory = null;   // 当前大类 ID
let currentSubCat = null;     // 当前中类 ID（null=全部中类）
let searchKeyword = '';

/**
 * 初始化生活常识页面
 */
export function initTips() {
    const page = document.getElementById('page-tips');
    if (!page) return;

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
                const iconWrap = createEl('div', 'empty-icon');
                iconWrap.appendChild(icon('lightbulb', 20, 'var(--accent)'));
                const title = createEl('div', 'empty-title');
                title.textContent = '数据加载失败';
                empty.appendChild(iconWrap);
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
 */
function renderPage(page) {
    clearContainer(page);

    // 顶部标题栏
    const header = createEl('div', 'tips-header');
    const title = createEl('h1', 'tips-title');
    title.appendChild(icon('lightbulb', 18));
    title.appendChild(document.createTextNode(' 生活常识'));
    const subtitle = createEl('p', 'tips-subtitle', tipsData.totalTips + '条实用小技巧');
    header.appendChild(title);
    header.appendChild(subtitle);
    page.appendChild(header);

    // 搜索栏
    const searchWrap = createEl('div', 'tips-search');
    const searchBox = createEl('div', 'search-box');
    const searchIcon = createEl('span', 'search-icon');
    searchIcon.appendChild(icon('search', 16));
    const searchInput = document.createElement('input');
    searchInput.className = 'input';
    searchInput.type = 'text';
    searchInput.placeholder = '搜索生活常识...';
    searchInput.id = 'tipsSearchInput';
    searchInput.setAttribute('aria-label', '搜索生活常识');
    const searchClear = createEl('span', 'search-clear', '×');
    searchClear.id = 'tipsSearchClear';
    searchBox.appendChild(searchIcon);
    searchBox.appendChild(searchInput);
    searchBox.appendChild(searchClear);
    searchWrap.appendChild(searchBox);
    page.appendChild(searchWrap);

    // 大类标签栏
    const tabsWrap = createEl('div', 'tips-tabs');
    tabsWrap.id = 'tipsTabs';
    const allBtn = createEl('button', 'chip active');
    allBtn.appendChild(icon('clipboardList', 14));
    allBtn.appendChild(document.createTextNode(' 全部'));
    allBtn.setAttribute('data-cat', 'all');
    tabsWrap.appendChild(allBtn);
    for (let i = 0; i < tipsData.categories.length; i++) {
        const cat = tipsData.categories[i];
        const btn = createEl('button', 'chip', cat.icon + ' ' + cat.name);
        btn.setAttribute('data-cat', cat.id);
        tabsWrap.appendChild(btn);
    }
    page.appendChild(tabsWrap);

    // 中类标签栏（选中大类后显示）
    const subTabsWrap = createEl('div', 'tips-sub-tabs');
    subTabsWrap.id = 'tipsSubTabs';
    subTabsWrap.style.display = 'none';
    page.appendChild(subTabsWrap);

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
 */
function bindEvents(page) {
    // 大类切换
    const tabs = page.querySelector('#tipsTabs');
    tabs.addEventListener('click', function(e) {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        tabs.querySelectorAll('.chip').forEach(function(t) { t.classList.remove('active'); });
        btn.classList.add('active');
        const catId = btn.getAttribute('data-cat');
        currentCategory = catId;
        currentSubCat = null;
        searchKeyword = '';
        const input = page.querySelector('#tipsSearchInput');
        if (input) input.value = '';
        page.querySelector('#tipsSearchClear').classList.remove('visible');

        if (catId === 'all') {
            hideSubTabs(page);
            showAll();
        } else {
            showSubTabs(page, catId);
            showCategoryContent(catId, null);
        }
    });

    // 中类切换
    const subTabs = page.querySelector('#tipsSubTabs');
    subTabs.addEventListener('click', function(e) {
        const btn = e.target.closest('.chip');
        if (!btn) return;
        subTabs.querySelectorAll('.chip').forEach(function(t) { t.classList.remove('active'); });
        btn.classList.add('active');
        const subId = btn.getAttribute('data-sub');
        currentSubCat = subId === 'all' ? null : subId;
        showCategoryContent(currentCategory, currentSubCat);
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
            if (currentCategory && currentCategory !== 'all') {
                showCategoryContent(currentCategory, currentSubCat);
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
            showCategoryContent(currentCategory, currentSubCat);
        } else {
            showAll();
        }
    });
}

/**
 * 显示中类标签栏
 */
function showSubTabs(page, catId) {
    const subTabsWrap = page.querySelector('#tipsSubTabs');
    clearContainer(subTabsWrap);
    subTabsWrap.style.display = 'block';

    let cat = null;
    for (let i = 0; i < tipsData.categories.length; i++) {
        if (tipsData.categories[i].id === catId) { cat = tipsData.categories[i]; break; }
    }
    if (!cat || !cat.subCategories) {
        subTabsWrap.style.display = 'none';
        return;
    }

    // "全部" Chip
    const allChip = createEl('button', 'chip active');
    allChip.appendChild(icon('layers', 14));
    allChip.appendChild(document.createTextNode(' 全部'));
    allChip.setAttribute('data-sub', 'all');
    subTabsWrap.appendChild(allChip);

    // 各中类 Chip
    const subIcons = {
        // 厨房烹饪
        'cooking_skill': { icon: 'flame', emoji: '🔥' },
        'food_prep': { icon: 'chefHat', emoji: '🔪' },
        'seasoning': { icon: 'droplets', emoji: '🧂' },
        'food_storage': { icon: 'refrigerator', emoji: '🫙' },
        // 家务收纳
        'cleaning': { icon: 'sparkles', emoji: '✨' },
        'organizing': { icon: 'archive', emoji: '📦' },
        'laundry': { icon: 'shirt', emoji: '👕' },
        'appliance': { icon: 'plug', emoji: '🔌' },
        // 健康养生
        'diet_health': { icon: 'apple', emoji: '🥗' },
        'exercise': { icon: 'dumbbell', emoji: '🏋️' },
        'first_aid': { icon: 'heart', emoji: '🩹' },
        'mental_health': { icon: 'brain', emoji: '🧠' },
        // 数码科技
        'phone_tips': { icon: 'smartphone', emoji: '📲' },
        'computer_tips': { icon: 'monitor', emoji: '💻' },
        'software': { icon: 'download', emoji: '💿' },
        'cyber_security': { icon: 'shield', emoji: '🔒' },
        // 出行交通
        'travel': { icon: 'mapPin', emoji: '🗺️' },
        'driving': { icon: 'car', emoji: '🚙' },
        'public_transport': { icon: 'bus', emoji: '🚌' },
        'flight_hotel': { icon: 'plane', emoji: '✈️' },
        // 购物消费
        'shopping': { icon: 'shoppingBag', emoji: '🛍️' },
        'bargain': { icon: 'tag', emoji: '🏷️' },
        'anti_fraud': { icon: 'alertTriangle', emoji: '⚠️' },
        'online_shopping': { icon: 'globe', emoji: '🌐' },
        // 社交礼仪
        'workplace': { icon: 'briefcase', emoji: '💼' },
        'dining': { icon: 'utensils', emoji: '🍽️' },
        'communication': { icon: 'messageCircle', emoji: '💬' },
        'interpersonal': { icon: 'users', emoji: '👥' },
        // 法律常识
        'consumer_rights': { icon: 'scale', emoji: '⚖️' },
        'labor_rights': { icon: 'fileText', emoji: '📋' },
        'contract': { icon: 'fileSignature', emoji: '📝' },
        'legal_aid': { icon: 'lifeBuoy', emoji: '🆘' },
        // 理财知识
        'savings': { icon: 'piggyBank', emoji: '🐷' },
        'fund': { icon: 'trendingUp', emoji: '📈' },
        'credit_card': { icon: 'creditCard', emoji: '💳' },
        'anti_scam': { icon: 'eye', emoji: '👁️' },
        // 生活窍门
        'stain_removal': { icon: 'target', emoji: '🎯' },
        'repair': { icon: 'wrench', emoji: '🔧' },
        'recycling': { icon: 'recycle', emoji: '♻️' },
        'seasonal': { icon: 'sun', emoji: '☀️' }
    };
    for (let i = 0; i < cat.subCategories.length; i++) {
        const sub = cat.subCategories[i];
        const subIcon = subIcons[sub.id];
        const chip = createEl('button', 'chip', (subIcon ? subIcon.emoji + ' ' : '') + sub.name);
        chip.setAttribute('data-sub', sub.id);
        subTabsWrap.appendChild(chip);
    }
}

/**
 * 隐藏中类标签栏
 */
function hideSubTabs(page) {
    const subTabsWrap = page.querySelector('#tipsSubTabs');
    subTabsWrap.style.display = 'none';
    clearContainer(subTabsWrap);
}

/**
 * 显示全部分类
 */
function showAll() {
    const content = document.getElementById('tipsContent');
    clearContainer(content);
    for (let i = 0; i < tipsData.categories.length; i++) {
        const cat = tipsData.categories[i];
        content.appendChild(renderCategory(cat, null));
    }
}

/**
 * 显示某个大类的内容（可按中类过滤）
 */
function showCategoryContent(catId, subId) {
    let cat = null;
    for (let i = 0; i < tipsData.categories.length; i++) {
        if (tipsData.categories[i].id === catId) { cat = tipsData.categories[i]; break; }
    }
    if (!cat) return;
    const content = document.getElementById('tipsContent');
    clearContainer(content);
    content.appendChild(renderCategory(cat, subId));
}

/**
 * 渲染分类区块
 * @param {Object} cat - 分类数据
 * @param {string|null} subId - 中类过滤（null=全部中类）
 * @param {number} [initialCount=10] - 每个子分类初始显示条数
 */
function renderCategory(cat, subId, initialCount) {
    var showCount = (typeof initialCount === 'number') ? initialCount : 10;
    var wrap = createEl('div', 'tips-category');

    var catHeader = createEl('div', 'tips-cat-header');
    var catIcon = createEl('span', 'tips-cat-icon', cat.icon);
    var catName = createEl('h2', 'tips-cat-name', cat.name);
    var catDesc = createEl('span', 'tips-cat-desc', cat.desc);
    catHeader.appendChild(catIcon);
    catHeader.appendChild(catName);
    catHeader.appendChild(catDesc);
    wrap.appendChild(catHeader);

    for (var i = 0; i < cat.subCategories.length; i++) {
        var sub = cat.subCategories[i];
        if (subId && sub.id !== subId) continue;

        var subWrap = createEl('div', 'tips-sub');
        var subName = createEl('h3', 'tips-sub-name', sub.name);
        subWrap.appendChild(subName);

        var list = createEl('div', 'tips-list');
        var tips = sub.tips;
        var displayCount = Math.min(tips.length, showCount);

        for (var j = 0; j < displayCount; j++) {
            list.appendChild(renderTipCard(tips[j]));
        }

        // 如果还有更多，显示"展开更多"按钮
        if (tips.length > showCount) {
            var remaining = tips.length - showCount;
            var moreBtn = createEl('button', '');
            moreBtn.style.cssText = 'width:100%;padding:var(--space-2);margin-top:var(--space-2);background:var(--bg-tertiary);border:1px dashed var(--border);border-radius:var(--radius-lg);color:var(--text-tertiary);font-size:var(--text-xs);cursor:pointer;text-align:center;';
            moreBtn.textContent = '展开更多（还有' + remaining + '条）';
            moreBtn.setAttribute('data-sub-id', sub.id);
            moreBtn.setAttribute('data-cat-id', cat.id);
            moreBtn.addEventListener('click', function() {
                var btn = this;
                var catId = btn.getAttribute('data-cat-id');
                var sId = btn.getAttribute('data-sub-id');
                // 找到对应子分类，渲染全部
                var targetCat = null;
                for (var c = 0; c < tipsData.categories.length; c++) {
                    if (tipsData.categories[c].id === catId) { targetCat = tipsData.categories[c]; break; }
                }
                if (!targetCat) return;
                var targetSub = null;
                for (var s = 0; s < targetCat.subCategories.length; s++) {
                    if (targetCat.subCategories[s].id === sId) { targetSub = targetCat.subCategories[s]; break; }
                }
                if (!targetSub) return;
                // 移除按钮
                btn.remove();
                // 追加剩余卡片
                for (var k = showCount; k < targetSub.tips.length; k++) {
                    list.appendChild(renderTipCard(targetSub.tips[k]));
                }
            });
            list.appendChild(moreBtn);
        }

        subWrap.appendChild(list);
        wrap.appendChild(subWrap);
    }

    return wrap;
}

/**
 * 渲染单条常识卡片
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

    const arrow = createEl('span', '');
    arrow.textContent = '›';
    arrow.style.cssText = 'font-size:20px;color:var(--text-tertiary);margin-left:auto;flex-shrink:0;';
    header.style.cssText = 'display:flex;align-items:center;gap:var(--space-2);';
    header.appendChild(arrow);

    card.appendChild(header);

    const preview = createEl('p', 'tip-preview', tip.content.length > 40 ? tip.content.substring(0, 40) + '...' : tip.content);
    card.appendChild(preview);

    card.addEventListener('click', function() {
        showTipDetail(tip);
    });

    return card;
}

/**
 * 弹窗显示常识详情
 */
function showTipDetail(tip) {
    const html = '<div class="tip-detail-modal" id="tipDetailModal"></div>';
    showModal(html);

    const modal = document.getElementById('tipDetailModal');
    if (!modal) return;

    const title = createEl('h2', 'tip-detail-title');
    title.textContent = tip.title;
    title.style.cssText = 'font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--text-primary);margin-bottom:var(--space-3);line-height:1.4;';
    modal.appendChild(title);

    const content = createEl('p', 'tip-detail-content');
    content.textContent = tip.content;
    content.style.cssText = 'font-size:var(--text-base);color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-4);';
    modal.appendChild(content);

    if (tip.tags && tip.tags.length > 0) {
        const tagsWrap = createEl('div', 'tip-tags');
        for (let i = 0; i < tip.tags.length; i++) {
            const tag = createEl('span', 'tip-tag', tip.tags[i]);
            tagsWrap.appendChild(tag);
        }
        modal.appendChild(tagsWrap);
    }

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
        const iconEl = createEl('div', 'empty-icon');
        iconEl.appendChild(icon('search', 18, 'var(--text-tertiary)'));
        const title = createEl('div', 'empty-title');
        title.textContent = '没有找到相关常识';
        empty.appendChild(iconEl);
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
