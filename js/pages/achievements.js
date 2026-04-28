// ==================== achievements.js - 成就页面 ====================
// 百事通 v1.0
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl } from '../utils/ui.js';
import { getUnlockedAchievements } from '../state.js';

/**
 * 初始化成就页面
 */
export function initAchievements() {
    const container = document.getElementById('page-achievements');
    if (!container) return;

    clearContainer(container);
    renderAchievements(container);
}

window.initAchievements = initAchievements;

/**
 * 渲染成就页面
 * @param {HTMLElement} container
 */
function renderAchievements(container) {
    const achievements = window.ACHIEVEMENTS || [];
    const unlocked = getUnlockedAchievements();

    // 1. 页面头部
    const header = createEl('div', 'achievements-header');

    const title = createEl('h2', '');
    title.textContent = '🏆 成就';

    const count = createEl('div', 'achievements-count');
    count.textContent = '已解锁 ' + unlocked.length + '/' + achievements.length;

    header.appendChild(title);
    header.appendChild(count);
    container.appendChild(header);

    // 2. 成就网格
    if (achievements.length === 0) {
        const empty = createEl('div', 'empty-state');
        const emptyIcon = createEl('div', 'empty-icon');
        emptyIcon.textContent = '🏆';
        const emptyTitle = createEl('div', 'empty-title');
        emptyTitle.textContent = '暂无成就';
        const emptyDesc = createEl('div', 'empty-desc');
        emptyDesc.textContent = '成就数据加载中...';
        empty.appendChild(emptyIcon);
        empty.appendChild(emptyTitle);
        empty.appendChild(emptyDesc);
        container.appendChild(empty);
        return;
    }

    const grid = createEl('div', 'achievements-grid');

    achievements.forEach(function(ach) {
        const isUnlocked = unlocked.indexOf(ach.id) !== -1;
        const card = createAchievementCard(ach, isUnlocked);
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

/**
 * 创建成就卡片
 * @param {Object} ach - 成就数据
 * @param {boolean} isUnlocked - 是否已解锁
 * @returns {HTMLElement}
 */
function createAchievementCard(ach, isUnlocked) {
    const card = createEl('div', 'achievement-card' + (isUnlocked ? ' unlocked' : ' locked'));

    const icon = createEl('div', 'achievement-icon');
    icon.textContent = ach.icon || '🏆';

    const name = createEl('div', 'achievement-name');
    name.textContent = ach.name || '';

    const desc = createEl('div', 'achievement-desc');
    desc.textContent = ach.desc || '';

    const condition = createEl('div', 'achievement-condition');
    condition.textContent = isUnlocked ? '✅ 已解锁' : '🔒 未解锁';

    card.appendChild(icon);
    card.appendChild(name);
    card.appendChild(desc);
    card.appendChild(condition);

    return card;
}
