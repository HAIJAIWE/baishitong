// ==================== onboarding.js - 首次使用引导 ====================
// 百事通 v1.0
// 新用户首次打开时展示引导教程，4步滑动式引导页

import { createEl } from '../utils/ui.js';

// ==================== 引导步骤数据 ====================

const STEPS = [
    {
        icon: '\uD83D\uDD0D',
        title: '探索职业',
        desc: '涵盖1670+个职业，8大行业分类'
    },
    {
        icon: '\uD83E\uDD16',
        title: 'AI 智能问答',
        desc: '多模型AI助手，解答职业疑问'
    },
    {
        icon: '\uD83D\uDCDA',
        title: '学习路径',
        desc: '每个职业5级学习路径，从入门到专家'
    },
    {
        icon: '\uD83D\uDE80',
        title: '开始探索',
        desc: '准备好了吗？开始你的职业探索之旅'
    }
];

// ==================== 核心函数 ====================

/**
 * 显示首次使用引导
 * 如果用户已完成引导则不显示
 * @param {Function} [onComplete] - 引导完成后的回调
 */
export function showOnboarding(onComplete) {
    // 检查是否已完成引导
    if (localStorage.getItem('byt_onboarding_done') === 'true') {
        if (typeof onComplete === 'function') {
            onComplete();
        }
        return;
    }

    // 当前步骤索引
    let currentStep = 0;

    // 触摸滑动相关状态
    let touchStartX = 0;
    let touchStartY = 0;
    let isSwiping = false;

    // ==================== 创建遮罩层 ====================

    const overlay = createEl('div', '');
    overlay.style.cssText = ''
        + 'position:fixed;top:0;left:0;right:0;bottom:0;'
        + 'background:rgba(0,0,0,0.75);'
        + 'z-index:var(--z-modal);'
        + 'display:flex;flex-direction:column;'
        + 'align-items:center;justify-content:center;'
        + 'opacity:0;transition:opacity var(--duration-normal) var(--ease-out);';

    // ==================== 步骤容器（滑动区域） ====================

    const slidesWrapper = createEl('div', '');
    slidesWrapper.style.cssText = ''
        + 'width:100%;max-width:var(--app-max-width);'
        + 'height:100%;display:flex;align-items:center;justify-content:center;'
        + 'overflow:hidden;position:relative;';

    // 滑动轨道
    const track = createEl('div', '');
    track.style.cssText = ''
        + 'display:flex;width:400%;height:100%;'
        + 'transition:transform var(--duration-slow) var(--ease-out);'
        + 'will-change:transform;';

    // ==================== 创建每个步骤卡片 ====================

    STEPS.forEach(function(step, index) {
        const slide = createEl('div', '');
        slide.style.cssText = ''
            + 'width:25%;height:100%;'
            + 'display:flex;flex-direction:column;'
            + 'align-items:center;justify-content:center;'
            + 'padding:var(--space-8) var(--space-6);'
            + 'box-sizing:border-box;';

        // emoji 图标
        const iconEl = createEl('div', '');
        iconEl.textContent = step.icon;
        iconEl.style.cssText = ''
            + 'font-size:64px;line-height:1;'
            + 'margin-bottom:var(--space-8);'
            + 'filter:drop-shadow(0 4px 12px rgba(0,0,0,0.3));';

        // 标题
        const titleEl = createEl('h2', '');
        titleEl.textContent = step.title;
        titleEl.style.cssText = ''
            + 'font-size:var(--text-2xl);'
            + 'font-weight:var(--font-bold);'
            + 'color:var(--text-primary);'
            + 'margin:0 0 var(--space-4) 0;'
            + 'text-align:center;';

        // 描述
        const descEl = createEl('p', '');
        descEl.textContent = step.desc;
        descEl.style.cssText = ''
            + 'font-size:var(--text-lg);'
            + 'color:var(--text-secondary);'
            + 'text-align:center;'
            + 'line-height:var(--leading-relaxed);'
            + 'margin:0;max-width:280px;';

        slide.appendChild(iconEl);
        slide.appendChild(titleEl);
        slide.appendChild(descEl);
        track.appendChild(slide);
    });

    slidesWrapper.appendChild(track);

    // ==================== 指示器圆点 ====================

    const dotsContainer = createEl('div', '');
    dotsContainer.style.cssText = ''
        + 'display:flex;gap:var(--space-2);'
        + 'margin-top:var(--space-10);'
        + 'position:absolute;bottom:120px;'
        + 'left:50%;transform:translateX(-50%);';

    const dots = [];
    STEPS.forEach(function(_, index) {
        const dot = createEl('div', '');
        dot.style.cssText = ''
            + 'width:8px;height:8px;border-radius:var(--radius-full);'
            + 'background:var(--text-tertiary);'
            + 'transition:all var(--duration-normal) var(--ease-out);'
            + 'opacity:0.4;';
        dots.push(dot);
        dotsContainer.appendChild(dot);
    });

    // ==================== 操作按钮 ====================

    const btnContainer = createEl('div', '');
    btnContainer.style.cssText = ''
        + 'position:absolute;bottom:48px;'
        + 'left:50%;transform:translateX(-50%);'
        + 'width:100%;max-width:280px;padding:0 var(--space-6);'
        + 'box-sizing:border-box;';

    const actionBtn = createEl('button', '');
    actionBtn.style.cssText = ''
        + 'width:100%;padding:var(--space-4) var(--space-8);'
        + 'border:none;border-radius:var(--radius-xl);'
        + 'background:var(--gradient-accent);'
        + 'color:#fff;font-size:var(--text-lg);'
        + 'font-weight:var(--font-semibold);'
        + 'cursor:pointer;'
        + 'transition:transform var(--duration-fast) var(--ease-out),'
        + 'box-shadow var(--duration-fast) var(--ease-out);'
        + 'box-shadow:var(--shadow-md);';

    // 跳过按钮
    const skipBtn = createEl('button', '');
    skipBtn.style.cssText = ''
        + 'position:absolute;top:var(--space-6);right:var(--space-6);'
        + 'background:none;border:none;'
        + 'color:var(--text-tertiary);'
        + 'font-size:var(--text-sm);'
        + 'cursor:pointer;padding:var(--space-2) var(--space-3);'
        + 'z-index:1;';
    skipBtn.textContent = '跳过';

    // ==================== 更新视图 ====================

    function updateView() {
        // 滑动轨道偏移
        track.style.transform = 'translateX(-' + (currentStep * 25) + '%)';

        // 更新圆点状态
        dots.forEach(function(dot, i) {
            if (i === currentStep) {
                dot.style.opacity = '1';
                dot.style.background = 'var(--accent)';
                dot.style.width = '24px';
            } else {
                dot.style.opacity = '0.4';
                dot.style.background = 'var(--text-tertiary)';
                dot.style.width = '8px';
            }
        });

        // 更新按钮文字
        if (currentStep === STEPS.length - 1) {
            actionBtn.textContent = '开始使用';
        } else {
            actionBtn.textContent = '下一步';
        }
    }

    // ==================== 完成引导 ====================

    function finishOnboarding() {
        // 标记已完成
        try {
            localStorage.setItem('byt_onboarding_done', 'true');
        } catch (e) {
            // localStorage 不可用时静默失败
        }

        // 淡出动画
        overlay.style.opacity = '0';

        setTimeout(function() {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            // 恢复背景滚动
            document.body.style.overflow = '';
            // 执行完成回调
            if (typeof onComplete === 'function') {
                onComplete();
            }
        }, 300);
    }

    // ==================== 事件绑定 ====================

    // 按钮点击：下一步或完成
    actionBtn.addEventListener('click', function() {
        if (currentStep < STEPS.length - 1) {
            currentStep++;
            updateView();
        } else {
            finishOnboarding();
        }
    });

    // 跳过按钮
    skipBtn.addEventListener('click', function() {
        finishOnboarding();
    });

    // 按钮点击缩放反馈
    actionBtn.addEventListener('mousedown', function() {
        actionBtn.style.transform = 'scale(0.97)';
    });
    actionBtn.addEventListener('mouseup', function() {
        actionBtn.style.transform = 'scale(1)';
    });
    actionBtn.addEventListener('mouseleave', function() {
        actionBtn.style.transform = 'scale(1)';
    });

    // ==================== 触摸滑动支持 ====================

    slidesWrapper.addEventListener('touchstart', function(e) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        isSwiping = false;
    }, { passive: true });

    slidesWrapper.addEventListener('touchmove', function(e) {
        const dx = e.touches[0].clientX - touchStartX;
        const dy = e.touches[0].clientY - touchStartY;

        // 判断是否为水平滑动（水平位移大于垂直位移）
        if (!isSwiping && Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 10) {
            isSwiping = true;
        }

        // 水平滑动时跟随手指移动（带阻尼）
        if (isSwiping) {
            const baseOffset = -(currentStep * 25);
            const slidePercent = (dx / slidesWrapper.offsetWidth) * 25;
            // 边界阻尼：在首尾步骤时减少滑动距离
            let dampedSlide = slidePercent;
            if ((currentStep === 0 && slidePercent > 0) ||
                (currentStep === STEPS.length - 1 && slidePercent < 0)) {
                dampedSlide = slidePercent * 0.3;
            }
            track.style.transition = 'none';
            track.style.transform = 'translateX(' + (baseOffset + dampedSlide) + '%)';
        }
    }, { passive: true });

    slidesWrapper.addEventListener('touchend', function(e) {
        if (!isSwiping) return;

        const dx = e.changedTouches[0].clientX - touchStartX;
        const threshold = slidesWrapper.offsetWidth * 0.2;

        // 恢复过渡动画
        track.style.transition = 'transform var(--duration-slow) var(--ease-out)';

        if (dx < -threshold && currentStep < STEPS.length - 1) {
            // 向左滑 → 下一步
            currentStep++;
        } else if (dx > threshold && currentStep > 0) {
            // 向右滑 → 上一步
            currentStep--;
        }

        updateView();
        isSwiping = false;
    }, { passive: true });

    // ==================== 组装并显示 ====================

    overlay.appendChild(skipBtn);
    overlay.appendChild(slidesWrapper);
    overlay.appendChild(dotsContainer);
    overlay.appendChild(btnContainer);

    // 阻止背景滚动
    document.body.style.overflow = 'hidden';

    // 添加到页面
    document.body.appendChild(overlay);

    // 触发入场动画
    requestAnimationFrame(function() {
        overlay.style.opacity = '1';
    });

    // 初始化视图
    updateView();
}

// ==================== 全局导出 ====================
window.showOnboarding = showOnboarding;
