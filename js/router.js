// ==================== router.js - SPA 路由 ====================
// 百事通 v1.0

import { hideModal } from './utils/ui.js';
import { playClick } from './utils/sound.js';

// 页面初始化函数映射
const pageInitMap = {
    'page-home': function() {
        if (typeof window.initHome === 'function') window.initHome();
    },
    'page-explore': function() {
        if (typeof window.initExplore === 'function') window.initExplore();
    },
    'page-ai': function() {
        if (typeof window.initAiChat === 'function') window.initAiChat();
    },
    'page-community': function() {
        if (typeof window.initCommunity === 'function') window.initCommunity();
    },
    'page-favorites': function() {
        if (typeof window.initFavorites === 'function') window.initFavorites();
    },
    'page-compare': function() {
        if (typeof window.initCompare === 'function') window.initCompare();
    },
    'page-profile': function() {
        if (typeof window.initProfile === 'function') window.initProfile();
    },
    'page-tips': function() {
        if (typeof window.initTips === 'function') window.initTips();
    },
    'page-achievements': function() {
        if (typeof window.initAchievements === 'function') window.initAchievements();
    },
    'page-checkin': function() {
        if (typeof window.initCheckin === 'function') window.initCheckin();
    },
    'page-assessment': function() {
        if (typeof window.initAssessment === 'function') window.initAssessment();
    }
};

// 记录各页面是否已初始化过
let pageInitialized = {};

/**
 * 导航到指定页面
 * @param {string} pageId - 页面 ID（如 'page-home'）
 */
export function navigateTo(pageId) {
    // 验证 pageId
    if (!pageId || typeof pageId !== 'string') return;

    playClick();

    const pageEl = document.getElementById(pageId);
    if (!pageEl) {
        console.warn('页面不存在:', pageId);
        return;
    }

    // 导航时自动关闭模态框，防止页面内容叠加
    hideModal();

    // 切换 .page 的 active class
    const allPages = document.querySelectorAll('.page');
    for (let i = 0; i < allPages.length; i++) {
        allPages[i].classList.remove('active');
    }
    pageEl.classList.add('active');

    // 更新底部导航高亮
    const navItems = document.querySelectorAll('.nav-item');
    for (let j = 0; j < navItems.length; j++) {
        if (navItems[j].getAttribute('data-page') === pageId) {
            navItems[j].classList.add('active');
            navItems[j].setAttribute('aria-current', 'page');
        } else {
            navItems[j].classList.remove('active');
            navItems[j].removeAttribute('aria-current');
        }
    }

    // 触发页面初始化函数（仅首次进入时初始化，或每次都初始化的页面）
    const initFn = pageInitMap[pageId];
    if (initFn) {
        // 首页和收藏页每次进入都刷新
        const alwaysInit = ['page-home', 'page-community', 'page-compare'];
        if (alwaysInit.indexOf(pageId) !== -1 || !pageInitialized[pageId]) {
            initFn();
            pageInitialized[pageId] = true;
        }
    }

    // 滚动到顶部
    window.scrollTo(0, 0);

    // 处理从其他页面跳转过来的待填入问题
    if (window._pendingAiQuestion && pageId === 'page-ai') {
        setTimeout(function() {
            var input = document.getElementById('aiChatInput');
            if (input) {
                input.value = window._pendingAiQuestion;
                input.focus();
            }
            window._pendingAiQuestion = null;
        }, 350);
    }
}

/**
 * 重置页面初始化状态（用于强制重新初始化）
 * @param {string} [pageId] - 指定页面，不传则重置所有
 */
export function resetPageInit(pageId) {
    if (pageId) {
        delete pageInitialized[pageId];
    } else {
        pageInitialized = {};
    }
}

// ==================== 事件绑定 ====================

// 底部导航点击事件（事件委托）
document.addEventListener('DOMContentLoaded', function() {
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) {
        bottomNav.addEventListener('click', function(e) {
            const navItem = e.target.closest('.nav-item');
            if (navItem) {
                const pageId = navItem.getAttribute('data-page');
                if (pageId) {
                    navigateTo(pageId);
                }
            }
        });
    }

    // 模态框遮罩点击关闭
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', function(e) {
            if (e.target === modalOverlay) {
                hideModal();
            }
        });
    }

    // ESC 键关闭模态框
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            hideModal();
        }
    });
});

// ==================== 暴露到全局 ====================
window.navigateTo = navigateTo;
window.resetPageInit = resetPageInit;
