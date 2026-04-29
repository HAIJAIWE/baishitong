// ==================== favorites.js - 收藏页 ====================
// 百事通 v1.0
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl, showConfirm, showToast } from '../utils/ui.js';
import { icon, categoryIconEl } from '../utils/icons.js';
import { getFavorites, toggleFavorite, checkAchievement } from '../state.js';
import { getJob } from '../data-loader.js';
import { navigateTo } from '../router.js';

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
    const favorites = getFavorites();

    // 页面标题
    const header = createEl('div', 'page-header');

    const title = createEl('h2', '');
    title.textContent = '我的收藏';

    const count = createEl('span', 'page-badge');
    count.textContent = favorites.length > 0 ? (favorites.length + '个职业') : '';

    header.appendChild(title);
    header.appendChild(count);
    container.appendChild(header);

    // 空状态
    if (favorites.length === 0) {
        const empty = createEl('div', 'empty-state');

        const iconEl = createEl('div', 'empty-icon');
        iconEl.appendChild(icon('star', 20, '#F59E0B'));

        const text = createEl('div', 'empty-title');
        text.textContent = '还没有收藏任何职业';

        const desc = createEl('div', 'empty-desc');
        desc.textContent = '去探索页发现感兴趣的职业吧';

        const btn = createEl('button', 'btn btn-primary empty-action');
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
    const list = createEl('div', 'job-list');

    favorites.forEach(function(jobId, index) {
        const job = getJob(jobId);
        if (!job) return;

        const card = createFavoriteCard(job, index);
        list.appendChild(card);
    });

    container.appendChild(list);
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
