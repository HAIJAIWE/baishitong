// ==================== app.js - 应用入口 ====================
// 百事通 v1.0 (ES Modules)

import { loadState, appState, getDeviceMode, setDeviceMode, checkAchievement } from './state.js';
import { icon } from './utils/icons.js';
import { loadData } from './data-loader.js';
import { navigateTo } from './router.js';
import { initSound } from './utils/sound.js';

// 动态导入各页面（代码分割，按需加载）
const pageImports = {
    'page-home': () => import('./pages/home.js'),
    'page-explore': () => import('./pages/explore.js'),
    'page-tips': () => import('./pages/tips.js'),
    'page-compare': () => import('./pages/compare.js'),
    'page-ai': () => import('./pages/ai-chat.js'),
    'page-profile': () => import('./pages/profile.js'),
    'page-community': () => import('./pages/community.js'),
    'page-achievements': () => import('./pages/achievements.js'),
    'page-favorites': () => import('./pages/favorites.js'),
    'page-checkin': () => import('./pages/checkin.js'),
    'page-assessment': () => import('./pages/assessment.js'),
    'page-onboarding': () => import('./pages/onboarding.js')
};

// 预加载首页
pageImports['page-home']();

// 暴露给路由使用
window.pageImports = pageImports;

/**
 * 应用初始化
 */
export async function initApp() {
    try {
        // 加载状态
        loadState();

        // 应用主题（免责声明也需要主题）
        applyTheme(appState.theme);

        // 初始化 SVG 图标
        initIcons();

        // 应用设备模式
        applyDeviceMode(getDeviceMode());

        // 检查是否需要显示免责声明
        if (!checkDisclaimer()) {
            setupDisclaimer();
            return; // 等待用户确认后再初始化
        }

        // 已同意过，直接隐藏免责声明
        const overlay = document.getElementById('disclaimerOverlay');
        if (overlay) overlay.classList.add('hidden');

        // 继续正常初始化
        await continueInit();
    } catch (e) {
        console.error('应用初始化失败:', e);
        console.error('错误堆栈:', e.stack || '无堆栈');
        console.error('错误消息:', e.message || '无消息');
        console.error('错误名称:', e.name || '无名称');
        showErrorFileProtocol();
    }
}

/**
 * 继续初始化（免责声明确认后调用）
 */
async function continueInit() {
    try {
        // 显示骨架屏加载状态
        showLoadingSkeleton();

        // 加载职业数据（索引秒开，完整数据后台加载）
        await loadData();

        // 隐藏骨架屏，显示首页
        hideLoadingSkeleton();
        navigateTo('page-home');

        // 新用户引导
        if (typeof window.showOnboarding === 'function') {
            window.showOnboarding();
        }

        // 检查连续签到相关成就
        checkAchievement('streak_3');
        checkAchievement('streak_7');
        checkAchievement('streak_30');
        initSound();

        console.log('百事通 v2.0 初始化完成');
    } catch (e) {
        console.error('应用初始化失败:', e);
        hideLoadingSkeleton();
        // 判断是否是 file:// 协议导致 fetch 失败
        if (window.location.protocol === 'file:') {
            showErrorFileProtocol();
        } else {
            showError(e);
        }
    }
}

/**
 * 显示加载骨架屏
 */
function showLoadingSkeleton() {
    const app = document.getElementById('app');
    if (!app) return;

    const skeleton = document.createElement('div');
    skeleton.id = 'loadingSkeleton';
    skeleton.style.cssText = 'padding:var(--space-4);max-width:600px;margin:0 auto;';

    // 模拟首页骨架
    const html = '<div style="margin-bottom:var(--space-4);">'
        + '<div class="skeleton skeleton-line long" style="height:40px;margin-bottom:var(--space-3);"></div>'
        + '<div class="skeleton skeleton-line medium"></div>'
        + '</div>'
        + '<div style="margin-bottom:var(--space-4);">'
        + '<div class="skeleton skeleton-line short" style="margin-bottom:var(--space-3);"></div>'
        + '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--space-2);">'
        + '<div class="skeleton" style="height:60px;border-radius:var(--radius-lg);"></div>'
        + '<div class="skeleton" style="height:60px;border-radius:var(--radius-lg);"></div>'
        + '<div class="skeleton" style="height:60px;border-radius:var(--radius-lg);"></div>'
        + '<div class="skeleton" style="height:60px;border-radius:var(--radius-lg);"></div>'
        + '</div></div>'
        + '<div style="margin-bottom:var(--space-4);">'
        + '<div class="skeleton skeleton-line short" style="margin-bottom:var(--space-3);"></div>'
        + '<div class="skeleton skeleton-card"></div>'
        + '<div class="skeleton skeleton-card"></div>'
        + '<div class="skeleton skeleton-card"></div>'
        + '<div class="skeleton skeleton-card"></div>'
        + '</div>';

    skeleton.innerHTML = html;
    app.appendChild(skeleton);
}

/**
 * 隐藏加载骨架屏
 */
function hideLoadingSkeleton() {
    const skeleton = document.getElementById('loadingSkeleton');
    if (skeleton) skeleton.remove();
}

/**
 * 检查用户是否已同意免责声明
 */
function checkDisclaimer() {
    return localStorage.getItem('byt_disclaimer_agreed') === 'true';
}

/**
 * 设置免责声明交互
 */
function setupDisclaimer() {
    const overlay = document.getElementById('disclaimerOverlay');
    const checkbox = document.getElementById('disclaimerAgree');
    const btn = document.getElementById('disclaimerBtn');
    const appContainer = document.getElementById('app');

    if (!overlay || !checkbox || !btn) return;

    // 隐藏主应用
    if (appContainer) appContainer.style.display = 'none';

    // 模式选择
    let selectedMode = getDeviceMode();
    const modeCards = overlay.querySelectorAll('.mode-select-card');
    modeCards.forEach(function(card) {
        if (card.getAttribute('data-mode') === selectedMode) {
            card.classList.add('active');
        } else {
            card.classList.remove('active');
        }
    });
    modeCards.forEach(function(card) {
        card.addEventListener('click', function() {
            modeCards.forEach(function(c) { c.classList.remove('active'); });
            card.classList.add('active');
            selectedMode = card.getAttribute('data-mode');
        });
    });

    // 复选框控制按钮
    checkbox.addEventListener('change', function() {
        btn.disabled = !this.checked;
    });

    // 点击进入
    btn.addEventListener('click', function() {
        if (!checkbox.checked) return;

        // 保存设备模式
        setDeviceMode(selectedMode);
        applyDeviceMode(selectedMode);

        // 记录已同意
        localStorage.setItem('byt_disclaimer_agreed', 'true');
        localStorage.setItem('byt_disclaimer_time', new Date().toISOString());

        // 隐藏免责声明
        overlay.classList.add('hidden');

        // 显示主应用
        if (appContainer) appContainer.style.display = '';

        // 继续初始化
        continueInit();
    });
}

/**
 * 显示错误信息
 */
function showError(e) {
    const app = document.getElementById('app');
    if (app) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'loading-page';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'empty-icon';
        iconWrap.appendChild(icon('smile', 20, 'var(--text-secondary)'));

        const title = document.createElement('h2');
        title.className = 'empty-title';
        title.textContent = '加载失败';

        const desc = document.createElement('p');
        desc.className = 'empty-desc';
        desc.textContent = '请检查网络连接后刷新页面重试';

        const btn = document.createElement('button');
        btn.className = 'btn btn-primary empty-action';
        btn.textContent = '重新加载';
        btn.addEventListener('click', function() {
            window.location.reload();
        });

        errorDiv.appendChild(iconWrap);
        errorDiv.appendChild(title);
        errorDiv.appendChild(desc);
        errorDiv.appendChild(btn);
        app.appendChild(errorDiv);
    }
}

/**
 * 显示 file:// 协议错误提示
 */
function showErrorFileProtocol() {
    const app = document.getElementById('app');
    if (app) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'loading-page';

        const iconWrap = document.createElement('div');
        iconWrap.className = 'empty-icon';
        iconWrap.appendChild(icon('alertTriangle', 20, 'var(--warning)'));

        const title = document.createElement('h2');
        title.className = 'empty-title';
        title.textContent = '无法加载数据';

        const desc = document.createElement('p');
        desc.className = 'empty-desc';
        desc.textContent = '直接打开HTML文件无法加载数据，请通过本地服务器访问';

        const tip = document.createElement('p');
        tip.className = 'empty-desc';
        tip.style.fontSize = 'var(--text-xs)';
        tip.style.marginTop = 'var(--space-2)';
        tip.textContent = '提示：在项目目录运行 npx serve 或 python -m http.server 8080，然后访问 http://localhost:8080';

        const btn = document.createElement('button');
        btn.className = 'btn btn-primary empty-action';
        btn.textContent = '重新加载';
        btn.addEventListener('click', function() {
            window.location.reload();
        });

        errorDiv.appendChild(iconWrap);
        errorDiv.appendChild(title);
        errorDiv.appendChild(desc);
        errorDiv.appendChild(tip);
        errorDiv.appendChild(btn);
        app.appendChild(errorDiv);
    }
}

/**
 * 应用主题到 DOM
 * @param {string} theme - 'dark' | 'light'
 */
export function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme || 'dark');

    // 更新 PWA 主题色
    const themeColorMeta = document.querySelector('meta[name="theme-color"]');
    if (themeColorMeta) {
        themeColorMeta.setAttribute('content', theme === 'dark' ? '#1a1a2e' : '#f0f4f8');
    }
}

/**
 * 初始化 SVG 图标（替换 data-icon 标记的 span）
 */
function initIcons() {
    document.querySelectorAll('[data-icon]').forEach(function(el) {
        var name = el.getAttribute('data-icon');
        if (name) {
            var svgIcon = icon(name, 22);
            el.textContent = '';
            el.appendChild(svgIcon);
        }
    });
}

/**
 * 应用设备模式到 DOM
 * @param {string} mode - 'mobile' | 'desktop'
 */
export function applyDeviceMode(mode) {
    document.documentElement.setAttribute('data-device', mode || 'mobile');
}

/**
 * 注册 Service Worker
 */
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').then(function(registration) {
            console.log('Service Worker 注册成功:', registration.scope);

            // 监听 Service Worker 更新
            registration.addEventListener('updatefound', function() {
                var newWorker = registration.installing;
                newWorker.addEventListener('statechange', function() {
                    if (newWorker.state === 'activated') {
                        console.log('[SW] 新版本已激活');
                    }
                });
            });
        }).catch(function(err) {
            console.warn('Service Worker 注册失败:', err);
        });
    }
}

/**
 * 网络状态监控
 * 离线时在页面顶部显示提示条，恢复网络时自动隐藏
 */
function setupNetworkStatus() {
    var banner = null;

    function showOfflineBanner() {
        if (banner) return; // 已显示则不重复创建

        banner = document.createElement('div');
        banner.id = 'offlineBanner';
        banner.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;'
            + 'background:linear-gradient(135deg, #f59e0b, #d97706);'
            + 'color:#1a1a2e;text-align:center;'
            + 'padding:8px 16px;font-size:14px;font-weight:600;'
            + 'display:flex;align-items:center;justify-content:center;gap:8px;'
            + 'box-shadow:0 2px 12px rgba(0,0,0,0.2);'
            + 'animation:slideDown 0.3s ease;'
            + 'transform:translateY(0);';

        // WiFi 断开图标
        var svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svgIcon.setAttribute('width', '16');
        svgIcon.setAttribute('height', '16');
        svgIcon.setAttribute('viewBox', '0 0 24 24');
        svgIcon.setAttribute('fill', 'none');
        svgIcon.setAttribute('stroke', 'currentColor');
        svgIcon.setAttribute('stroke-width', '2');
        svgIcon.setAttribute('stroke-linecap', 'round');
        svgIcon.setAttribute('stroke-linejoin', 'round');
        svgIcon.innerHTML = '<line x1="1" y1="1" x2="23" y2="23"/>'
            + '<path d="M16.72 11.06A10.94 10.94 0 0 1 19 12.55"/>'
            + '<path d="M5 12.55a10.94 10.94 0 0 1 5.17-2.39"/>'
            + '<path d="M10.71 5.05A16 16 0 0 1 22.56 9"/>'
            + '<path d="M1.42 9a15.91 15.91 0 0 1 4.7-2.88"/>'
            + '<path d="M8.53 16.11a6 6 0 0 1 6.95 0"/>'
            + '<line x1="12" y1="20" x2="12.01" y2="20"/>';

        var textSpan = document.createElement('span');
        textSpan.textContent = '当前处于离线模式，已缓存的内容仍可访问';

        banner.appendChild(svgIcon);
        banner.appendChild(textSpan);
        document.body.appendChild(banner);
    }

    function hideOfflineBanner() {
        if (!banner) return;
        banner.style.opacity = '0';
        banner.style.transition = 'opacity 0.3s ease';
        setTimeout(function() {
            if (banner && banner.parentNode) {
                banner.parentNode.removeChild(banner);
            }
            banner = null;
        }, 300);
    }

    window.addEventListener('offline', function() {
        console.log('[网络] 已断开连接');
        showOfflineBanner();
    });

    window.addEventListener('online', function() {
        console.log('[网络] 已恢复连接');
        hideOfflineBanner();
    });

    // 页面加载时检查初始网络状态
    if (!navigator.onLine) {
        showOfflineBanner();
    }
}

/**
 * PWA 安装引导
 */
let deferredPrompt = null;

function setupPWAInstall() {
    // 监听 beforeinstallprompt 事件
    window.addEventListener('beforeinstallprompt', function(e) {
        e.preventDefault();
        deferredPrompt = e;
        // 延迟显示安装横幅（等首页加载完）
        setTimeout(showInstallBanner, 3000);
    });

    // 监听安装完成事件
    window.addEventListener('appinstalled', function() {
        deferredPrompt = null;
        hideInstallBanner();
        console.log('PWA 已安装');
    });
}

function showInstallBanner() {
    // 如果已经安装过或用户拒绝过，不再显示
    if (localStorage.getItem('byt_install_dismissed') === 'true') return;
    if (!deferredPrompt) return;

    // 检查是否已在 standalone 模式（已安装）
    if (window.matchMedia('(display-mode: standalone)').matches) return;

    const banner = document.createElement('div');
    banner.id = 'pwaInstallBanner';
    banner.style.cssText = 'position:fixed;bottom:70px;left:50%;transform:translateX(-50%);background:var(--bg-secondary);border:1px solid var(--border-color);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);display:flex;align-items:center;gap:var(--space-3);z-index:500;box-shadow:0 4px 20px rgba(0,0,0,0.3);max-width:90vw;animation:slideUp 0.3s ease;';

    const iconWrap = document.createElement('span');
    iconWrap.appendChild(icon('smartphone', 20, 'var(--accent)'));
    iconWrap.style.fontSize = '24px';

    const text = document.createElement('div');
    text.style.cssText = 'flex:1;';
    const title = document.createElement('div');
    title.textContent = '安装百事通到桌面';
    title.style.cssText = 'font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);';
    const desc = document.createElement('div');
    desc.textContent = '快速访问，离线可用';
    desc.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px;';
    text.appendChild(title);
    text.appendChild(desc);

    const installBtn = document.createElement('button');
    installBtn.textContent = '安装';
    installBtn.className = 'btn btn-primary';
    installBtn.style.cssText = 'padding:6px 16px;font-size:var(--text-sm);white-space:nowrap;';
    installBtn.addEventListener('click', async function() {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const result = await deferredPrompt.userChoice;
        if (result.outcome === 'accepted') {
            console.log('用户同意安装');
        }
        deferredPrompt = null;
        hideInstallBanner();
    });

    const closeBtn = document.createElement('span');
    closeBtn.textContent = '\u00d7';
    closeBtn.style.cssText = 'cursor:pointer;color:var(--text-tertiary);font-size:var(--text-lg);padding:4px;';
    closeBtn.addEventListener('click', function() {
        localStorage.setItem('byt_install_dismissed', 'true');
        hideInstallBanner();
    });

    banner.appendChild(iconWrap);
    banner.appendChild(text);
    banner.appendChild(installBtn);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);
}

function hideInstallBanner() {
    const banner = document.getElementById('pwaInstallBanner');
    if (banner) banner.remove();
}

// ==================== 启动 ====================
// ES Modules 是 deferred 的，但模块依赖链的异步加载可能导致
// DOMContentLoaded 在模块执行前就已触发，因此需要同时检查 readyState
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        initApp();
        registerServiceWorker();
        setupNetworkStatus();
        setupPWAInstall();
    });
} else {
    // DOMContentLoaded 已触发（常见于 Vite 开发模式的模块异步加载场景）
    initApp();
    registerServiceWorker();
    setupNetworkStatus();
    setupPWAInstall();
}

// 暴露到全局（供 profile.js 等模块使用）
window.applyTheme = applyTheme;
window.applyDeviceMode = applyDeviceMode;
