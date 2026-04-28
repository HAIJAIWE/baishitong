// ==================== ui.js - UI 工具 ====================
// 百事通 v1.0
// 安全原则：所有用户输入和 AI 返回内容必须用 textContent 渲染，禁止 innerHTML 插入用户数据

import { playSuccess, playError } from './sound.js';

/**
 * 显示 Toast 通知
 * @param {string} message - 通知消息
 * @param {string} [type='info'] - 类型 'success' | 'error' | 'info'
 * @param {number} [duration=3000] - 显示时长（毫秒）
 */
export function showToast(message, type, duration) {
    type = type || 'info';
    duration = duration || 3000;

    // 音效反馈
    if (type === 'success') {
        playSuccess();
    } else if (type === 'error' || type === 'warning') {
        playError();
    }

    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast toast-' + type;

    // 安全渲染：使用 textContent 防止 XSS
    toast.textContent = message;

    container.appendChild(toast);

    // 触发重排后添加 show 类（动画）
    requestAnimationFrame(function() {
        toast.classList.add('show');
    });

    // 自动消失
    setTimeout(function() {
        toast.classList.remove('show');
        toast.classList.add('hide');
        setTimeout(function() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 显示模态框（底部弹出式）
 * @param {string} contentHtml - 模态框内容 HTML（仅限开发者可控的模板，禁止插入用户数据）
 */
export function showModal(contentHtml) {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    if (!overlay || !content) return;

    // 支持传入 DOM 元素或 HTML 字符串
    if (contentHtml instanceof HTMLElement || contentHtml instanceof Node) {
        content.innerHTML = '';
        content.appendChild(contentHtml);
    } else {
        content.innerHTML = contentHtml;
    }

    overlay.classList.add('active');

    // 阻止背景滚动
    document.body.style.overflow = 'hidden';
}

/**
 * 关闭模态框
 */
export function hideModal() {
    const overlay = document.getElementById('modalOverlay');
    const content = document.getElementById('modalContent');

    if (overlay) {
        overlay.classList.remove('active');
    }

    if (content) {
        content.innerHTML = '';
    }

    // 恢复滚动
    document.body.style.overflow = '';
}

/**
 * 安全创建 DOM 元素
 * 所有文本内容通过 textContent 设置，防止 XSS
 * @param {string} tag - HTML 标签名
 * @param {string} [className=''] - CSS 类名
 * @param {string} [textContent=''] - 文本内容（安全渲染）
 * @returns {HTMLElement}
 */
export function escapeHtml(str) {
    const div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
}

export function createEl(tag, className, textContent) {
    const el = document.createElement(tag);
    if (className) {
        el.className = className;
    }
    if (textContent !== undefined && textContent !== null && textContent !== '') {
        el.textContent = textContent;
    }
    return el;
}

/**
 * 安全创建带属性的元素
 * @param {string} tag - HTML 标签名
 * @param {Object} options - 配置项
 * @param {string} [options.className] - CSS 类名
 * @param {string} [options.textContent] - 文本内容（安全）
 * @param {string} [options.html] - HTML 内容（仅限开发者可控内容）
 * @param {Object} [options.attrs] - 属性键值对
 * @param {Object} [options.events] - 事件监听器 {click: fn, ...}
 * @param {Array} [options.children] - 子元素数组
 * @returns {HTMLElement}
 */
export function createElEx(tag, options) {
    options = options || {};
    const el = document.createElement(tag);

    if (options.className) {
        el.className = options.className;
    }

    // 安全文本内容
    if (options.textContent !== undefined && options.textContent !== null) {
        el.textContent = options.textContent;
    }

    // 仅限开发者可控的 HTML（不用于用户数据）
    if (options.html !== undefined && options.html !== null) {
        el.innerHTML = options.html;
    }

    // 属性
    if (options.attrs) {
        Object.keys(options.attrs).forEach(function(key) {
            el.setAttribute(key, options.attrs[key]);
        });
    }

    // 事件
    if (options.events) {
        Object.keys(options.events).forEach(function(evt) {
            if (typeof options.events[evt] === 'function') {
                el.addEventListener(evt, options.events[evt]);
            }
        });
    }

    // 子元素
    if (options.children && Array.isArray(options.children)) {
        options.children.forEach(function(child) {
            if (child && child instanceof HTMLElement) {
                el.appendChild(child);
            }
        });
    }

    return el;
}

/**
 * XSS 清理 - 移除危险字符
 * 用于在必须使用 innerHTML 的场景中预处理用户输入
 * 注意：优先使用 textContent，仅在无法避免时使用此函数
 * @param {string} str - 待清理的字符串
 * @returns {string} 清理后的安全字符串
 */
export function sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * 清空一个容器的所有子元素
 * @param {HTMLElement|string} container - DOM 元素或元素 ID
 */
export function clearContainer(container) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (container) {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }
}

/**
 * 格式化数字（添加千分位）
 * @param {number} num
 * @returns {string}
 */
export function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) return '0';
    return num.toLocaleString('zh-CN');
}

/**
 * 防抖函数
 * @param {Function} fn - 要防抖的函数
 * @param {number} delay - 延迟毫秒数
 * @returns {Function}
 */
export function debounce(fn, delay) {
    delay = delay || 300;
    let timer = null;
    return function() {
        const context = this;
        const args = arguments;
        if (timer) clearTimeout(timer);
        timer = setTimeout(function() {
            fn.apply(context, args);
        }, delay);
    };
}

/**
 * 节流函数
 * @param {Function} fn - 要节流的函数
 * @param {number} interval - 间隔毫秒数
 * @returns {Function}
 */
export function throttle(fn, interval) {
    interval = interval || 200;
    let lastTime = 0;
    return function() {
        const now = Date.now();
        if (now - lastTime >= interval) {
            lastTime = now;
            fn.apply(this, arguments);
        }
    };
}

/**
 * 确认对话框（使用模态框实现）
 * @param {string} title - 标题
 * @param {string} message - 消息
 * @param {Function} onConfirm - 确认回调
 * @param {Function} [onCancel] - 取消回调
 */
export function showConfirm(title, message, onConfirm, onCancel) {
    const html = ''
        + '<div class="confirm-title"></div>'
        + '<div class="confirm-message"></div>'
        + '<div class="confirm-actions">'
        + '  <button class="btn btn-outline" id="confirmCancel">取消</button>'
        + '  <button class="btn btn-primary" id="confirmOk">确定</button>'
        + '</div>';

    showModal(html);

    // 安全设置文本
    const titleEl = document.querySelector('.confirm-title');
    const msgEl = document.querySelector('.confirm-message');
    if (titleEl) titleEl.textContent = title || '确认';
    if (msgEl) msgEl.textContent = message || '';

    const cancelBtn = document.getElementById('confirmCancel');
    const okBtn = document.getElementById('confirmOk');

    if (okBtn) {
        okBtn.addEventListener('click', function() {
            hideModal();
            if (typeof onConfirm === 'function') onConfirm();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            hideModal();
            if (typeof onCancel === 'function') onCancel();
        });
    }
}

/**
 * 加载状态指示器
 * @param {HTMLElement|string} container - 容器
 * @param {boolean} [show=true] - 显示或隐藏
 */
export function toggleLoading(container, show) {
    if (typeof container === 'string') {
        container = document.getElementById(container);
    }
    if (!container) return;

    if (show === false) {
        const existing = container.querySelector('.loading-spinner');
        if (existing) container.removeChild(existing);
        return;
    }

    const spinner = createEl('div', 'loading-spinner');
    spinner.textContent = '加载中...';
    container.appendChild(spinner);
}

// ==================== 保留全局导出（HTML 内联事件可能用到） ====================
window.showToast = showToast;
window.showModal = showModal;
window.hideModal = hideModal;
window.createEl = createEl;
window.createElEx = createElEx;
window.escapeHtml = escapeHtml;
window.sanitize = sanitize;
window.clearContainer = clearContainer;
window.formatNumber = formatNumber;
window.debounce = debounce;
window.throttle = throttle;
window.showConfirm = showConfirm;
window.toggleLoading = toggleLoading;
