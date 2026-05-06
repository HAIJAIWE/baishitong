// ==================== favorites.js - 收藏页 ====================
// 百事通 v1.0
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl, showConfirm, showToast, showModal, hideModal } from '../utils/ui.js';
import { icon, categoryIconEl } from '../utils/icons.js';
import { getFavorites, toggleFavorite, checkAchievement, getTipFavorites, toggleTipFavorite, isTipFavorited } from '../state.js';
import { getJob } from '../data-loader.js';
import { navigateTo } from '../router.js';

let favoritesTab = 'jobs'; // 'jobs' | 'tips'
let tipsDataCache = null;

/**
 * 初始化收藏页
 */
export function initFavorites() {
    const container = document.getElementById('page-favorites');
    if (!container) return;

    clearContainer(container);
    renderFavorites(container);
}

window.initFavorites = initFavorites;

/**
 * 渲染收藏页
 * @param {HTMLElement} container
 */
function renderFavorites(container) {
    // 页面标题
    const header = createEl('div', 'page-header');

    const title = createEl('h2', '');
    title.textContent = '我的收藏';

    const count = createEl('span', 'page-badge');
    var jobFavs = getFavorites();
    var tipFavs = getTipFavorites();
    var totalCount = jobFavs.length + tipFavs.length;
    count.textContent = totalCount > 0 ? (totalCount + '项') : '';

    header.appendChild(title);
    header.appendChild(count);
    container.appendChild(header);

    // 标签页切换
    var tabWrap = createEl('div', '');
    tabWrap.style.cssText = 'display:flex;gap:var(--space-2);margin-bottom:var(--space-4);background:var(--bg-tertiary);border-radius:var(--radius-lg);padding:3px;';

    var jobTabBtn = createEl('button', '');
    jobTabBtn.style.cssText = 'flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:none;font-size:var(--text-sm);cursor:pointer;transition:all var(--duration-fast) var(--ease-default);';
    jobTabBtn.textContent = '⭐ 职业收藏 (' + jobFavs.length + ')';
    if (favoritesTab === 'jobs') {
        jobTabBtn.style.background = 'var(--bg-primary)';
        jobTabBtn.style.fontWeight = 'var(--font-bold)';
        jobTabBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    } else {
        jobTabBtn.style.background = 'transparent';
        jobTabBtn.style.color = 'var(--text-secondary)';
    }
    jobTabBtn.addEventListener('click', function() {
        favoritesTab = 'jobs';
        clearContainer(container);
        renderFavorites(container);
    });
    tabWrap.appendChild(jobTabBtn);

    var tipTabBtn = createEl('button', '');
    tipTabBtn.style.cssText = 'flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-md);border:none;font-size:var(--text-sm);cursor:pointer;transition:all var(--duration-fast) var(--ease-default);';
    tipTabBtn.textContent = '💡 常识收藏 (' + tipFavs.length + ')';
    if (favoritesTab === 'tips') {
        tipTabBtn.style.background = 'var(--bg-primary)';
        tipTabBtn.style.fontWeight = 'var(--font-bold)';
        tipTabBtn.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
    } else {
        tipTabBtn.style.background = 'transparent';
        tipTabBtn.style.color = 'var(--text-secondary)';
    }
    tipTabBtn.addEventListener('click', function() {
        favoritesTab = 'tips';
        clearContainer(container);
        renderFavorites(container);
    });
    tabWrap.appendChild(tipTabBtn);

    container.appendChild(tabWrap);

    // 根据当前标签页渲染内容
    if (favoritesTab === 'jobs') {
        renderJobFavorites(container, jobFavs);
    } else {
        renderTipFavorites(container, tipFavs);
    }
}

/**
 * 渲染职业收藏列表
 */
function renderJobFavorites(container, favorites) {
    // 空状态
    if (favorites.length === 0) {
        var empty = createEl('div', 'empty-state');

        var iconEl = createEl('div', 'empty-icon');
        iconEl.appendChild(icon('star', 20, '#F59E0B'));

        var text = createEl('div', 'empty-title');
        text.textContent = '还没有收藏任何职业';

        var desc = createEl('div', 'empty-desc');
        desc.textContent = '去探索页发现感兴趣的职业吧';

        var btn = createEl('button', 'btn btn-primary empty-action');
        btn.textContent = '去探索职业';

        btn.addEventListener('click', function() {
            navigateTo('page-explore');
        });

        empty.appendChild(iconEl);
        empty.appendChild(text);
        empty.appendChild(desc);
        empty.appendChild(btn);
        container.appendChild(empty);
        return;
    }

    // 收藏列表
    var list = createEl('div', 'job-list');

    favorites.forEach(function(jobId, index) {
        var job = getJob(jobId);
        if (!job) return;

        var card = createFavoriteCard(job, index);
        list.appendChild(card);
    });

    container.appendChild(list);
}

/**
 * 渲染常识收藏列表
 */
function renderTipFavorites(container, tipFavorites) {
    if (tipFavorites.length === 0) {
        var empty = createEl('div', 'empty-state');

        var iconEl = createEl('div', 'empty-icon');
        iconEl.appendChild(icon('lightbulb', 20, '#10B981'));

        var text = createEl('div', 'empty-title');
        text.textContent = '还没有收藏任何常识';

        var desc = createEl('div', 'empty-desc');
        desc.textContent = '去生活常识页发现实用小技巧吧';

        var btn = createEl('button', 'btn btn-primary empty-action');
        btn.textContent = '去浏览常识';

        btn.addEventListener('click', function() {
            navigateTo('page-tips');
        });

        empty.appendChild(iconEl);
        empty.appendChild(text);
        empty.appendChild(desc);
        empty.appendChild(btn);
        container.appendChild(empty);
        return;
    }

    // 加载常识数据
    if (tipsDataCache) {
        renderTipCards(container, tipFavorites, tipsDataCache);
    } else {
        var loading = createEl('div', 'empty-state');
        var loadingText = createEl('div', 'empty-title');
        loadingText.textContent = '加载中...';
        loading.appendChild(loadingText);
        container.appendChild(loading);

        fetch('js/data/tips_cn.json')
            .then(function(r) { return r.json(); })
            .then(function(data) {
                tipsDataCache = data;
                clearContainer(container);
                renderTipCards(container, tipFavorites, data);
            })
            .catch(function() {
                clearContainer(container);
                var errEl = createEl('div', 'empty-state');
                var errText = createEl('div', 'empty-title');
                errText.textContent = '数据加载失败';
                errEl.appendChild(errText);
                container.appendChild(errEl);
            });
    }
}

/**
 * 渲染常识收藏卡片
 */
function renderTipCards(container, tipFavorites, data) {
    // 构建所有常识的查找表
    var tipMap = {};
    var catMap = {};
    for (var i = 0; i < data.categories.length; i++) {
        var cat = data.categories[i];
        for (var j = 0; j < cat.subCategories.length; j++) {
            var sub = cat.subCategories[j];
            for (var k = 0; k < sub.tips.length; k++) {
                var tip = sub.tips[k];
                tipMap[tip.id] = tip;
                catMap[tip.id] = cat;
            }
        }
    }

    var list = createEl('div', 'job-list');

    for (var m = 0; m < tipFavorites.length; m++) {
        var tipId = tipFavorites[m];
        var tip = tipMap[tipId];
        if (!tip) continue;

        var cat = catMap[tipId];
        var card = createTipFavoriteCard(tip, cat, m);
        list.appendChild(card);
    }

    container.appendChild(list);
}

/**
 * 创建常识收藏卡片
 */
function createTipFavoriteCard(tip, cat, index) {
    var card = createEl('div', 'job-card');
    card.style.animationDelay = Math.min(index * 30, 300) + 'ms';
    card.style.cursor = 'pointer';

    var iconWrap = createEl('div', '');
    iconWrap.style.cssText = 'width:44px;height:44px;border-radius:var(--radius-lg);background:rgba(16,185,129,0.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:22px;';
    iconWrap.textContent = cat ? cat.icon : '💡';

    var info = createEl('div', 'job-info');

    var name = createEl('div', 'job-name');
    name.textContent = tip.title || '';

    var desc = createEl('div', 'job-desc');
    desc.textContent = tip.content.length > 50 ? tip.content.substring(0, 50) + '...' : tip.content;

    var catLabel = createEl('span', '');
    catLabel.style.cssText = 'font-size:var(--text-xs);color:var(--accent);background:rgba(59,130,246,0.1);padding:1px 6px;border-radius:var(--radius-full);margin-top:2px;display:inline-block;';
    catLabel.textContent = cat ? (cat.icon + ' ' + cat.name) : '';

    info.appendChild(name);
    info.appendChild(desc);
    info.appendChild(catLabel);

    card.appendChild(iconWrap);
    card.appendChild(info);

    // 点击查看详情
    card.addEventListener('click', function(e) {
        if (e.target.closest('.fav-remove-btn')) return;
        showTipDetailModal(tip);
    });

    // 长按/右键取消收藏
    var removeBtn = createEl('button', 'fav-remove-btn');
    removeBtn.textContent = '取消收藏';
    removeBtn.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:100px;background:var(--warning);color:#fff;border:none;font-size:var(--text-xs);cursor:pointer;display:flex;align-items:center;justify-content:center;transform:translateX(100%);transition:transform var(--duration-normal) var(--ease-default);z-index:1;';
    removeBtn.style.display = 'none';

    var longPressTimer = null;

    card.addEventListener('touchstart', function() {
        longPressTimer = setTimeout(function() {
            removeBtn.style.display = 'flex';
            removeBtn.style.transform = 'translateX(0)';
            card.style.transform = 'translateX(-100px)';
            card.style.transition = 'transform var(--duration-normal) var(--ease-default)';
        }, 500);
    }, { passive: true });

    card.addEventListener('touchend', function() {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    });

    card.addEventListener('touchmove', function() {
        if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
    }, { passive: true });

    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleTipFavorite(tip.id);
        showToast('已取消收藏', 'info');
        initFavorites();
    });

    card.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showConfirm(
            '取消收藏',
            '确定取消收藏「' + tip.title + '」吗？',
            function() {
                toggleTipFavorite(tip.id);
                showToast('已取消收藏', 'info');
                initFavorites();
            }
        );
    });

    card.appendChild(removeBtn);

    return card;
}

/**
 * 弹窗显示常识详情（收藏页用）
 */
function showTipDetailModal(tip) {
    var html = '<div class="tip-detail-modal" id="tipDetailModal"></div>';
    showModal(html);

    var modal = document.getElementById('tipDetailModal');
    if (!modal) return;

    var title = createEl('h2', 'tip-detail-title');
    title.textContent = tip.title;
    title.style.cssText = 'font-size:var(--text-lg);font-weight:var(--font-bold);color:var(--text-primary);margin-bottom:var(--space-3);line-height:1.4;';
    modal.appendChild(title);

    var content = createEl('p', 'tip-detail-content');
    content.textContent = tip.content;
    content.style.cssText = 'font-size:var(--text-base);color:var(--text-secondary);line-height:1.8;margin-bottom:var(--space-4);';
    modal.appendChild(content);

    if (tip.tags && tip.tags.length > 0) {
        var tagsWrap = createEl('div', 'tip-tags');
        for (var i = 0; i < tip.tags.length; i++) {
            var tag = createEl('span', 'tip-tag', tip.tags[i]);
            tagsWrap.appendChild(tag);
        }
        modal.appendChild(tagsWrap);
    }

    // 操作按钮区
    var actions = createEl('div', '');
    actions.style.cssText = 'display:flex;gap:var(--space-2);margin-top:var(--space-4);';

    var favBtn = createEl('button', '');
    var isFav = isTipFavorited(tip.id);
    favBtn.style.cssText = 'flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--border);background:' + (isFav ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)') + ';color:var(--text-secondary);font-size:var(--text-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:var(--space-1);';
    favBtn.innerHTML = isFav ? '❤️ 已收藏' : '🤍 收藏';
    favBtn.addEventListener('click', function() {
        var added = toggleTipFavorite(tip.id);
        this.innerHTML = added ? '❤️ 已收藏' : '🤍 收藏';
        this.style.background = added ? 'rgba(239,68,68,0.1)' : 'var(--bg-tertiary)';
    });
    actions.appendChild(favBtn);

    var copyBtn = createEl('button', '');
    copyBtn.style.cssText = 'flex:1;padding:var(--space-2) var(--space-3);border-radius:var(--radius-lg);border:1px solid var(--border);background:var(--bg-tertiary);color:var(--text-secondary);font-size:var(--text-sm);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:var(--space-1);';
    copyBtn.textContent = '📋 复制';
    copyBtn.addEventListener('click', function() {
        var text = tip.title + '\n' + tip.content;
        navigator.clipboard.writeText(text).then(function() {
            copyBtn.textContent = '✅ 已复制';
            setTimeout(function() { copyBtn.textContent = '📋 复制'; }, 2000);
        });
    });
    actions.appendChild(copyBtn);

    modal.appendChild(actions);

    var closeBtn = createEl('button', 'btn btn-primary');
    closeBtn.style.cssText = 'width:100%;margin-top:var(--space-4);';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', function() {
        hideModal();
    });
    modal.appendChild(closeBtn);
}

/**
 * 创建收藏卡片
 * @param {Object} job
 * @param {number} index
 * @returns {HTMLElement}
 */
function createFavoriteCard(job, index) {
    const card = createEl('div', 'job-card');
    card.style.animationDelay = Math.min(index * 30, 300) + 'ms';
    card.style.position = 'relative';
    card.style.overflow = 'hidden';

    const iconEl = categoryIconEl(job.category || job.group, 44);

    const info = createEl('div', 'job-info');

    const name = createEl('div', 'job-name');
    name.textContent = job.name || '';

    const desc = createEl('div', 'job-desc');
    desc.textContent = job.desc || '';

    info.appendChild(name);
    info.appendChild(desc);

    // 薪资
    let salary = '';
    if (job.overview && job.overview.salary) {
        salary = job.overview.salary;
    }

    card.appendChild(iconEl);
    card.appendChild(info);

    if (salary) {
        const salaryEl = createEl('div', 'job-salary');
        salaryEl.textContent = salary;
        card.appendChild(salaryEl);
    }

    // 点击打开详情
    card.addEventListener('click', function(e) {
        // 如果点击的是取消收藏按钮，不打开详情
        if (e.target.closest('.fav-remove-btn')) return;
        window.openJobDetailModal(job.id);
    });

    // 长按/右滑显示取消收藏按钮
    const removeBtn = createEl('button', 'fav-remove-btn');
    removeBtn.textContent = '取消收藏';
    removeBtn.style.cssText = 'position:absolute;right:0;top:0;bottom:0;width:100px;background:var(--warning);color:#fff;border:none;font-size:var(--text-xs);cursor:pointer;display:flex;align-items:center;justify-content:center;transform:translateX(100%);transition:transform var(--duration-normal) var(--ease-default);z-index:1;';
    removeBtn.style.display = 'none'; // 默认隐藏

    // 长按检测
    let longPressTimer = null;
    let isLongPress = false;

    card.addEventListener('touchstart', function(e) {
        isLongPress = false;
        longPressTimer = setTimeout(function() {
            isLongPress = true;
            removeBtn.style.display = 'flex';
            removeBtn.style.transform = 'translateX(0)';
            card.style.transform = 'translateX(-100px)';
            card.style.transition = 'transform var(--duration-normal) var(--ease-default)';
        }, 500);
    }, { passive: true });

    card.addEventListener('touchend', function() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    });

    card.addEventListener('touchmove', function() {
        if (longPressTimer) {
            clearTimeout(longPressTimer);
            longPressTimer = null;
        }
    }, { passive: true });

    // 取消收藏
    removeBtn.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleFavorite(job.id);
        showToast('已取消收藏', 'info');
        // 重新渲染
        initFavorites();
    });

    // 右键菜单（桌面端）
    card.addEventListener('contextmenu', function(e) {
        e.preventDefault();
        showConfirm(
            '取消收藏',
            '确定取消收藏「' + job.name + '」吗？',
            function() {
                toggleFavorite(job.id);
                showToast('已取消收藏', 'info');
                initFavorites();
            }
        );
    });

    card.appendChild(removeBtn);

    return card;
}
