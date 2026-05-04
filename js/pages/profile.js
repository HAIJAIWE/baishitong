// ==================== profile.js - 个人中心 ====================
// 百事通 v1.0
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl, showToast, showConfirm, showModal, hideModal } from '../utils/ui.js';
import { isSoundEnabled, setSoundEnabled, playClick } from '../utils/sound.js';
import { appState, getTheme, setTheme, getDeviceMode, setDeviceMode, checkAchievement, resetState, setUsername } from '../state.js';
import { applyTheme, applyDeviceMode } from '../app.js';
import { navigateTo, resetPageInit } from '../router.js';
import { storageClear } from '../utils/storage.js';
import { getAIModels } from '../ai-engine.js';
import { removeStoredApiKey, logout, changePassword } from '../auth.js';
import { isLeanCloudConfigured, saveLeanCloudConfig, getLeanCloudConfig } from '../leancloud-service.js';
import { icon } from '../utils/icons.js';
import { getJobFull } from '../data-loader.js';

/**
 * 初始化个人中心
 */
export function initProfile() {
    const container = document.getElementById('page-profile');
    if (!container) return;

    clearContainer(container);
    renderProfile(container);
}

window.initProfile = initProfile;

/**
 * 渲染个人中心
 * @param {HTMLElement} container
 */
function renderProfile(container) {
    // 1. 头像和名称
    const header = createProfileHeader();
    container.appendChild(header);

    // 2. 统计卡片
    const stats = createStatsCards();
    container.appendChild(stats);

    // 3. 设置列表
    const settings = createSettingsList();
    container.appendChild(settings);

    // 4. 版本号
    const version = createEl('div', 'version-info');
    version.textContent = '百事通 v2.0';
    container.appendChild(version);
}

// ==================== 头像和名称 ====================

function createProfileHeader() {
    const header = createEl('div', 'profile-header');

    const avatar = createEl('div', 'profile-avatar');
    avatar.appendChild(icon('sun', 24, '#F59E0B'));

    const nameRow = createEl('div', 'profile-name-row');
    const name = createEl('div', 'profile-name');
    name.textContent = appState.username || '百事通用户';
    const editIcon = createEl('span', 'profile-name-edit');
    editIcon.appendChild(icon('pencil', 14, 'var(--text-tertiary)'));
    nameRow.appendChild(name);
    nameRow.appendChild(editIcon);
    nameRow.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:6px;cursor:pointer;';
    nameRow.title = '点击修改昵称';
    nameRow.addEventListener('click', function() {
        const editWrap = document.createElement('div');
        editWrap.style.cssText = 'padding:var(--space-4);';
        const editTitle = document.createElement('div');
        editTitle.style.cssText = 'font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-3);text-align:center;';
        editTitle.textContent = '修改昵称';
        editWrap.appendChild(editTitle);
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.maxLength = 12;
        editInput.value = appState.username || '百事通用户';
        editInput.placeholder = '请输入昵称（最多12字）';
        editInput.style.cssText = 'width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:var(--text-sm);background:var(--bg-secondary);color:var(--text-primary);outline:none;box-sizing:border-box;';
        editWrap.appendChild(editInput);
        const editBtnRow = document.createElement('div');
        editBtnRow.style.cssText = 'display:flex;gap:8px;margin-top:var(--space-3);';
        const cancelBtn = document.createElement('button');
        cancelBtn.className = 'btn btn-outline';
        cancelBtn.style.cssText = 'flex:1;';
        cancelBtn.textContent = '取消';
        cancelBtn.addEventListener('click', function() { hideModal(); });
        const saveBtn = document.createElement('button');
        saveBtn.className = 'btn btn-primary';
        saveBtn.style.cssText = 'flex:1;';
        saveBtn.textContent = '保存';
        saveBtn.addEventListener('click', function() {
            const newName = editInput.value.trim();
            if (newName.length === 0) {
                showToast('昵称不能为空', 'error');
                return;
            }
            setUsername(newName);
            name.textContent = newName;
            hideModal();
            showToast('昵称已更新', 'success');
        });
        editBtnRow.appendChild(cancelBtn);
        editBtnRow.appendChild(saveBtn);
        editWrap.appendChild(editBtnRow);
        showModal(editWrap);
        setTimeout(function() { editInput.focus(); editInput.select(); }, 100);
    });

    const desc = createEl('div', 'profile-desc');
    desc.textContent = '探索职业，发现未来';

    header.appendChild(avatar);
    header.appendChild(nameRow);
    header.appendChild(desc);

    return header;
}

// ==================== 统计卡片 ====================

function createStatsCards() {
    const grid = createEl('div', 'stats-grid');

    const exploredCount = appState.exploredJobs ? appState.exploredJobs.length : 0;
    const activeDays = appState.stats ? appState.stats.activeDays : 0;
    const streak = appState.stats ? appState.stats.streak : 0;

    const statItems = [
        { value: exploredCount, label: '已探索' },
        { value: activeDays, label: '学习天数' },
        { value: streak, label: '连续天数' }
    ];

    statItems.forEach(function(item) {
        const card = createEl('div', 'stat-card');

        const value = createEl('div', 'stat-value');
        value.textContent = item.value;

        const label = createEl('div', 'stat-label');
        label.textContent = item.label;

        card.appendChild(value);
        card.appendChild(label);
        grid.appendChild(card);
    });

    return grid;
}

// ==================== 设置列表 ====================

function createSettingsList() {
    const list = createEl('div', 'settings-list');

    const items = [
        {
            icon: 'calendar',
            name: '每日签到',
            desc: '签到打卡赢积分',
            action: 'checkin'
        },
        {
            icon: 'palette',
            name: '主题切换',
            desc: '暗色 / 亮色模式',
            action: 'theme'
        },
        {
            icon: 'smartphone',
            name: '设备模式',
            desc: '手机端 / 电脑端布局',
            action: 'device-mode'
        },
        {
            icon: 'key',
            name: 'AI 设置',
            desc: '配置 API Key 和模型',
            action: 'ai-settings'
        },
        {
            icon: 'lock',
            name: '修改密码',
            desc: '更改登录密码',
            action: 'change-password'
        },
        {
            icon: 'volume2',
            name: '音效',
            desc: '操作音效反馈',
            action: 'sound-toggle'
        },
        {
            icon: 'messageCircle',
            name: '社区',
            desc: isLeanCloudConfigured() ? '已连接 LeanCloud' : '本地模式（点击配置）',
            action: 'community'
        },
        {
            icon: 'cloud',
            name: 'LeanCloud 配置',
            desc: isLeanCloudConfigured() ? '已配置' : '未配置',
            action: 'leancloud-config'
        },
        {
            icon: 'trophy',
            name: '成就',
            desc: '查看已解锁成就',
            action: 'achievements'
        },
        {
            icon: 'barChart3',
            name: '学习进度',
            desc: '查看各职业学习情况',
            action: 'learning-dashboard'
        },
        {
            icon: 'bell',
            name: '消息通知',
            desc: getUnreadNotificationCount() > 0
                ? getUnreadNotificationCount() + ' 条未读通知'
                : '查看系统通知和更新日志',
            action: 'notifications'
        },
        {
            icon: 'heart',
            name: '赞助支持',
            desc: '帮助百事通持续运营 ❤️',
            action: 'support'
        },
        {
            icon: 'info',
            name: '关于百事通',
            desc: '版本信息和说明',
            action: 'about'
        },
        {
            icon: 'trash2',
            name: '清除数据',
            desc: '清除所有本地数据',
            action: 'clear'
        }
    ];

    items.forEach(function(item) {
        const row = createEl('div', 'settings-item');

        const iconEl = createEl('span', 'setting-icon');
        iconEl.appendChild(icon(item.icon, 18));

        const info = createEl('div', 'setting-info');

        const name = createEl('div', 'setting-name');
        name.textContent = item.name;

        const desc = createEl('div', 'setting-desc');
        desc.textContent = item.desc;

        info.appendChild(name);
        info.appendChild(desc);

        row.appendChild(iconEl);
        row.appendChild(info);

        // 主题切换特殊处理：显示开关
        if (item.action === 'theme') {
            const theme = getTheme();
            const toggle = createEl('div', 'theme-toggle' + (theme === 'dark' ? ' active' : ''));

            const thumb = createEl('div', 'toggle-thumb');
            toggle.appendChild(thumb);

            toggle.addEventListener('click', function(e) {
                e.stopPropagation();
                const current = getTheme();
                const newTheme = current === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
                applyTheme(newTheme);

                if (newTheme === 'dark') {
                    toggle.classList.add('active');
                } else {
                    toggle.classList.remove('active');
                }

                showToast('已切换到' + (newTheme === 'dark' ? '暗色' : '亮色') + '模式', 'success');

                // 检查主题切换成就
                checkAchievement('custom_job');
            });

            row.appendChild(toggle);
        } else if (item.action === 'device-mode') {
            const mode = getDeviceMode();
            const modeToggle = createEl('div', 'theme-toggle' + (mode === 'desktop' ? ' active' : ''));

            const modeThumb = createEl('div', 'toggle-thumb');
            modeToggle.appendChild(modeThumb);

            modeToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                const current = getDeviceMode();
                const newMode = current === 'mobile' ? 'desktop' : 'mobile';
                setDeviceMode(newMode);
                applyDeviceMode(newMode);

                if (newMode === 'desktop') {
                    modeToggle.classList.add('active');
                } else {
                    modeToggle.classList.remove('active');
                }

                // 更新描述文字
                desc.textContent = newMode === 'desktop' ? '电脑端布局（当前）' : '手机端 / 电脑端布局';

                showToast('已切换到' + (newMode === 'desktop' ? '电脑端' : '手机端') + '布局', 'success');
            });

            row.appendChild(modeToggle);
        } else if (item.action === 'sound-toggle') {
            const soundToggle = createEl('div', 'theme-toggle' + (isSoundEnabled() ? ' active' : ''));

            const soundThumb = createEl('div', 'toggle-thumb');
            soundToggle.appendChild(soundThumb);

            soundToggle.addEventListener('click', function(e) {
                e.stopPropagation();
                const newState = !isSoundEnabled();
                setSoundEnabled(newState);

                if (newState) {
                    soundToggle.classList.add('active');
                    desc.textContent = '操作音效反馈（已开启）';
                    playClick();
                    showToast('音效已开启', 'success');
                } else {
                    soundToggle.classList.remove('active');
                    desc.textContent = '操作音效反馈（已关闭）';
                    showToast('音效已关闭', 'info');
                }
            });

            row.appendChild(soundToggle);
        } else {
            const arrow = createEl('span', 'setting-arrow');
            arrow.textContent = '›';
            row.appendChild(arrow);
        }

        row.addEventListener('click', function(e) {
            // 如果点击的是主题或设备模式开关，不触发行点击
            if (e.target.closest('.theme-toggle')) return;

            handleSettingAction(item.action);
        });

        list.appendChild(row);
    });

    return list;
}

/**
 * 处理设置项点击
 * @param {string} action
 */
function handleSettingAction(action) {
    switch (action) {
        case 'checkin':
            resetPageInit('page-checkin');
            navigateTo('page-checkin');
            break;

        case 'ai-settings':
            // 跳转到 AI 页面
            resetPageInit('page-ai');
            navigateTo('page-ai');
            setTimeout(function() {
                if (typeof window.initAiChat === 'function') {
                    window.initAiChat();
                }
            }, 200);
            break;

        case 'change-password':
            showChangePasswordModal();
            break;

        case 'community':
            resetPageInit('page-community');
            navigateTo('page-community');
            break;

        case 'leancloud-config':
            showLeanCloudConfigPanel();
            break;

        case 'achievements':
            resetPageInit('page-achievements');
            navigateTo('page-achievements');
            break;

        case 'learning-dashboard':
            showLearningDashboard();
            break;

        case 'notifications':
            showNotifications();
            break;

        case 'support':
            showSupportModal();
            break;

        case 'about':
            showAboutModal();
            break;

        case 'clear':
            showConfirm(
                '清除数据',
                '确定要清除所有本地数据吗？此操作不可恢复。',
                function() {
                    // 清除所有数据
                    resetState();
                    storageClear();
                    // 清除 API Keys（加密存储的）
                    const models = getAIModels();
                    models.forEach(function(m) {
                        removeStoredApiKey(m.id);
                    });
                    // 登出
                    logout();
                    showToast('数据已清除', 'success');
                    // 重新渲染
                    initProfile();
                }
            );
            break;
    }
}

/**
 * 显示关于弹窗
 */
function showAboutModal() {
    const html = '<div class="ai-settings-panel" id="aboutPanel"></div>';
    showModal(html);

    const panel = document.getElementById('aboutPanel');
    if (!panel) return;

    const title = createEl('div', 'modal-section-title center');
    title.textContent = '关于百事通';
    panel.appendChild(title);

    const aboutIcon = createEl('div', 'about-icon');
    aboutIcon.appendChild(icon('sun', 20, '#F59E0B'));
    panel.appendChild(aboutIcon);

    const version = createEl('div', 'about-version');
    version.textContent = '百事通 v2.0';
    panel.appendChild(version);

    const desc = createEl('div', 'about-desc');
    desc.textContent = '一款面向所有人的知识探索应用，涵盖职业百科、生活常识、AI智能问答，帮助你发现职业方向、提升生活技能。';
    panel.appendChild(desc);

    const features = createEl('div', 'about-features');
    features.style.cssText = 'font-size:var(--text-sm);color:var(--text-secondary);line-height:2;';

    const featureItems = [
        '涵盖 1669 个职业详细数据',
        '8大行业分类，82个中类',
        '4200+ 条生活常识（烹饪/收纳/养生/数码/宠物/育儿等）',
        '120题霍兰德职业测评（每次随机30题）',
        '7个AI智能体（职业顾问/简历/面试/学习规划等）',
        'AI 多模型支持（DeepSeek/通义千问/智谱GLM/Kimi等）',
        '职业对比分析',
        '学习路径规划',
        '暗色/亮色主题切换'
    ];

    featureItems.forEach(function(f) {
        const item = createEl('div', '');
        item.textContent = '  ' + f;
        features.appendChild(item);
    });

    panel.appendChild(features);

    // QQ群和反馈
    const contactSection = createEl('div', '');
    contactSection.style.cssText = 'margin-top:var(--space-4);padding-top:var(--space-3);border-top:1px solid var(--border);text-align:center;';

    const contactTitle = createEl('div', '');
    contactTitle.style.cssText = 'font-size:var(--text-sm);color:var(--text-secondary);margin-bottom:var(--space-2);';
    contactTitle.textContent = '💬 有想法或遇到Bug？加入用户群反馈';
    contactSection.appendChild(contactTitle);

    const qqGroup = createEl('div', '');
    qqGroup.style.cssText = 'display:inline-flex;align-items:center;gap:var(--space-2);padding:var(--space-2) var(--space-4);background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-lg);cursor:pointer;user-select:all;';
    qqGroup.innerHTML = '<span style="font-size:14px;">👥</span><span style="font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--text-primary);letter-spacing:1px;">932919784</span>';
    qqGroup.title = '点击复制群号';
    qqGroup.addEventListener('click', function() {
        navigator.clipboard.writeText('932919784').then(function() {
            qqGroup.innerHTML = '<span style="font-size:14px;">✅</span><span style="font-size:var(--text-sm);color:var(--accent);">已复制群号</span>';
            setTimeout(function() {
                qqGroup.innerHTML = '<span style="font-size:14px;">👥</span><span style="font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--text-primary);letter-spacing:1px;">932919784</span>';
            }, 2000);
        });
    });
    contactSection.appendChild(qqGroup);

    const contactHint = createEl('div', '');
    contactHint.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin-top:var(--space-1);';
    contactHint.textContent = 'QQ搜索群号即可加入，欢迎提出建议和反馈问题';
    contactSection.appendChild(contactHint);

    panel.appendChild(contactSection);
}

/**
 * 显示修改密码弹窗
 */
function showChangePasswordModal() {
    const html = '<div class="ai-settings-panel" id="changePwdPanel"></div>';
    showModal(html);

    const panel = document.getElementById('changePwdPanel');
    if (!panel) return;

    const title = createEl('div', 'modal-section-title center');
    title.textContent = '';
    title.appendChild(icon('lock', 18));
    title.appendChild(document.createTextNode(' 修改密码'));
    panel.appendChild(title);

    const fields = [
        { id: 'pwd_old', placeholder: '旧密码', type: 'password' },
        { id: 'pwd_new', placeholder: '新密码（至少4位）', type: 'password' },
        { id: 'pwd_confirm', placeholder: '确认新密码', type: 'password' }
    ];

    fields.forEach(function(field) {
        const input = createEl('input', 'input');
        input.id = field.id;
        input.type = field.type;
        input.placeholder = field.placeholder;
        input.style.cssText = 'margin-bottom:var(--space-2);';
        panel.appendChild(input);
    });

    const btnRow = createEl('div', '');
    btnRow.style.cssText = 'display:flex;gap:var(--space-2);margin-top:var(--space-3);';

    const saveBtn = createEl('button', 'btn btn-primary');
    saveBtn.style.cssText = 'flex:1;';
    saveBtn.textContent = '确认修改';

    const cancelBtn = createEl('button', 'btn btn-secondary');
    cancelBtn.style.cssText = 'flex:1;';
    cancelBtn.textContent = '取消';

    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    panel.appendChild(btnRow);

    saveBtn.addEventListener('click', async function() {
        const oldPwd = document.getElementById('pwd_old').value;
        const newPwd = document.getElementById('pwd_new').value;
        const confirmPwd = document.getElementById('pwd_confirm').value;

        if (!oldPwd || !newPwd || !confirmPwd) {
            showToast('请填写所有字段', 'warning');
            return;
        }
        if (newPwd !== confirmPwd) {
            showToast('两次输入的新密码不一致', 'warning');
            return;
        }

        const result = await changePassword(oldPwd, newPwd);
        if (result.success) {
            showToast('密码修改成功');
            hideModal();
        } else {
            showToast(result.message, 'error');
        }
    });

    cancelBtn.addEventListener('click', function() {
        hideModal();
    });
}

// ==================== 学习进度仪表盘 ====================

/**
 * 从 localStorage 扫描所有学习进度数据
 * 支持两种 key 格式：
 *   - bst_learned_{jobId}_{levelIndex}_{stepIndex} (值为 "1")
 *   - byt_path_progress_{jobId} (值为 JSON {levelIndex_stepIndex: true})
 * @returns {Object} { jobId: { completedSteps: [{level, step}], totalCompleted: number } }
 */
function scanLearningData() {
    const result = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (!key) continue;

            // 格式1: bst_learned_{jobId}_{levelIndex}_{stepIndex}
            if (key.indexOf('bst_learned_') === 0) {
                const val = localStorage.getItem(key);
                if (val !== '1') continue;
                const parts = key.replace('bst_learned_', '').split('_');
                const jobId = parts[0];
                const levelIndex = parseInt(parts[1], 10);
                const stepIndex = parseInt(parts[2], 10);
                if (isNaN(levelIndex) || isNaN(stepIndex)) continue;

                if (!result[jobId]) {
                    result[jobId] = { completedSteps: [], totalCompleted: 0 };
                }
                result[jobId].completedSteps.push({ level: levelIndex, step: stepIndex });
                result[jobId].totalCompleted++;
            }

            // 格式2: byt_path_progress_{jobId}
            if (key.indexOf('byt_path_progress_') === 0) {
                const jobId = key.replace('byt_path_progress_', '');
                const raw = localStorage.getItem(key);
                if (!raw) continue;
                let progressData;
                try { progressData = JSON.parse(raw); } catch (e) { continue; }

                if (!result[jobId]) {
                    result[jobId] = { completedSteps: [], totalCompleted: 0 };
                }

                Object.keys(progressData).forEach(function(stepKey) {
                    if (!progressData[stepKey]) return;
                    // stepKey 格式: "levelIndex_stepIndex"
                    const parts = stepKey.split('_');
                    const levelIndex = parseInt(parts[0], 10);
                    const stepIndex = parseInt(parts[1], 10);
                    if (isNaN(levelIndex) || isNaN(stepIndex)) return;

                    // 避免与格式1重复计数
                    const exists = result[jobId].completedSteps.some(function(s) {
                        return s.level === levelIndex && s.step === stepIndex;
                    });
                    if (!exists) {
                        result[jobId].completedSteps.push({ level: levelIndex, step: stepIndex });
                        result[jobId].totalCompleted++;
                    }
                });
            }
        }
    } catch (e) {
        console.warn('[学习进度] 扫描 localStorage 失败:', e);
    }
    return result;
}

/**
 * 显示学习进度仪表盘弹窗
 */
async function showLearningDashboard() {
    // 先显示加载状态
    const loadingWrap = document.createElement('div');
    loadingWrap.className = 'learning-dashboard';
    loadingWrap.style.cssText = 'text-align:center;padding:60px 20px;';
    const timerIcon = icon('barChart3', 32);
    timerIcon.style.marginBottom = '12px';
    loadingWrap.appendChild(timerIcon);
    const loadingText = document.createElement('div');
    loadingText.style.color = 'var(--text-secondary)';
    loadingText.textContent = '正在加载学习数据...';
    loadingWrap.appendChild(loadingText);
    showModal(loadingWrap);

    // 扫描学习数据
    const learningData = scanLearningData();
    const jobIds = Object.keys(learningData);

    // 异步加载所有职业的完整数据
    const jobDataMap = {};
    const loadPromises = jobIds.map(function(jobId) {
        return getJobFull(jobId).then(function(job) {
            if (job) jobDataMap[jobId] = job;
        });
    });
    await Promise.all(loadPromises);

    // 构建仪表盘内容
    const wrap = document.createElement('div');
    wrap.className = 'learning-dashboard';

    // 标题
    const title = createEl('div', 'modal-section-title center');
    title.textContent = '';
    title.appendChild(icon('barChart3', 18));
    title.appendChild(document.createTextNode(' 学习进度'));
    wrap.appendChild(title);

    if (jobIds.length === 0) {
        // 没有学习记录
        const emptyState = createEl('div', '');
        emptyState.style.cssText = 'text-align:center;padding:40px 20px;color:var(--text-secondary);';
        const emptyIcon = createEl('div', '');
        emptyIcon.style.cssText = 'font-size:48px;margin-bottom:12px;';
        emptyIcon.appendChild(icon('bookOpen', 48, 'var(--text-tertiary)'));
        emptyState.appendChild(emptyIcon);
        const emptyText = createEl('div', '');
        emptyText.style.cssText = 'font-size:var(--text-base);margin-bottom:8px;';
        emptyText.textContent = '还没有学习记录';
        emptyState.appendChild(emptyText);
        const emptyHint = createEl('div', '');
        emptyHint.style.cssText = 'font-size:var(--text-sm);color:var(--text-tertiary);';
        emptyHint.textContent = '去职业详情页标记学习步骤吧';
        emptyState.appendChild(emptyHint);
        wrap.appendChild(emptyState);
        showModal(wrap);
        return;
    }

    // === 1. 总览数据（3个数字卡片） ===
    let totalCompletedSteps = 0;
    let totalEstimatedTime = 0; // 分钟
    let totalSteps = 0;

    jobIds.forEach(function(jobId) {
        const data = learningData[jobId];
        totalCompletedSteps += data.totalCompleted;

        const job = jobDataMap[jobId];
        if (job && job.levels) {
            job.levels.forEach(function(level, lvIdx) {
                if (level.steps) {
                    totalSteps += level.steps.length;
                    level.steps.forEach(function(step, stepIdx) {
                        // 检查是否已完成
                        const isCompleted = data.completedSteps.some(function(s) {
                            return s.level === lvIdx && s.step === stepIdx;
                        });
                        if (isCompleted && step.estimatedTime) {
                            totalEstimatedTime += step.estimatedTime;
                        }
                    });
                }
            });
        }
    });

    const activeJobCount = jobIds.length;

    // 格式化时长
    function formatTime(minutes) {
        if (minutes < 60) return minutes + '分钟';
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? hours + '小时' + mins + '分钟' : hours + '小时';
    }

    const statsGrid = createEl('div', '');
    statsGrid.style.cssText = 'display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-2);margin-bottom:var(--space-4);';

    const statItems = [
        { value: activeJobCount, label: '学习中的职业', icon: 'briefcase', color: '#2563EB' },
        { value: totalCompletedSteps, label: '已完成步骤', icon: 'checkCircle', color: '#059669' },
        { value: formatTime(totalEstimatedTime), label: '累计学习时长', icon: 'timer', color: '#D97706' }
    ];

    statItems.forEach(function(item) {
        const card = createEl('div', '');
        card.style.cssText = 'background:var(--bg-primary);border-radius:var(--radius-lg);padding:var(--space-3);text-align:center;';

        const iconWrap = createEl('div', '');
        iconWrap.style.cssText = 'margin-bottom:6px;';
        iconWrap.appendChild(icon(item.icon, 20, item.color));
        card.appendChild(iconWrap);

        const value = createEl('div', '');
        value.style.cssText = 'font-size:var(--text-xl);font-weight:var(--font-bold);color:var(--text-primary);';
        value.textContent = item.value;
        card.appendChild(value);

        const label = createEl('div', '');
        label.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px;';
        label.textContent = item.label;
        card.appendChild(label);

        statsGrid.appendChild(card);
    });

    wrap.appendChild(statsGrid);

    // === 2. 学习中的职业列表 ===
    const sectionTitle = createEl('div', '');
    sectionTitle.style.cssText = 'font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-3);display:flex;align-items:center;gap:6px;';
    sectionTitle.appendChild(icon('bookOpen', 16, 'var(--accent)'));
    sectionTitle.appendChild(document.createTextNode(' 学习中的职业'));
    wrap.appendChild(sectionTitle);

    // 构建职业进度数据并排序
    const jobProgressList = jobIds.map(function(jobId) {
        const data = learningData[jobId];
        const job = jobDataMap[jobId];
        let jobTotalSteps = 0;
        let jobCompletedSteps = data.totalCompleted;

        if (job && job.levels) {
            job.levels.forEach(function(level) {
                if (level.steps) jobTotalSteps += level.steps.length;
            });
        }

        const percent = jobTotalSteps > 0 ? Math.round((jobCompletedSteps / jobTotalSteps) * 100) : 0;

        return {
            jobId: jobId,
            jobName: job ? job.name : jobId,
            completedSteps: jobCompletedSteps,
            totalSteps: jobTotalSteps,
            percent: percent
        };
    });

    // 按完成度降序排序
    jobProgressList.sort(function(a, b) { return b.percent - a.percent; });

    const jobList = createEl('div', '');
    jobList.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-4);';

    jobProgressList.forEach(function(item) {
        const row = createEl('div', '');
        row.style.cssText = 'background:var(--bg-primary);border-radius:var(--radius-md);padding:var(--space-3);';

        // 上方：职业名 + 进度数字
        const topRow = createEl('div', '');
        topRow.style.cssText = 'display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;';

        const nameEl = createEl('div', '');
        nameEl.style.cssText = 'font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);max-width:70%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
        nameEl.textContent = item.jobName;
        topRow.appendChild(nameEl);

        const percentEl = createEl('div', '');
        percentEl.style.cssText = 'font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--accent);';
        percentEl.textContent = item.completedSteps + '/' + item.totalSteps;
        topRow.appendChild(percentEl);

        row.appendChild(topRow);

        // 进度条
        const barBg = createEl('div', '');
        barBg.style.cssText = 'width:100%;height:8px;background:var(--bg-tertiary);border-radius:4px;overflow:hidden;';

        const barFill = createEl('div', '');
        barFill.style.cssText = 'height:100%;border-radius:4px;background:linear-gradient(90deg, var(--accent), #059669);transition:width 0.8s ease;width:0;';

        barBg.appendChild(barFill);
        row.appendChild(barBg);

        jobList.appendChild(row);

        // 动画：延迟设置宽度以触发过渡效果
        requestAnimationFrame(function() {
            setTimeout(function() {
                barFill.style.width = item.percent + '%';
            }, 50);
        });
    });

    wrap.appendChild(jobList);

    // === 3. 最近学习（最近完成的5个步骤） ===
    // 收集所有已完成步骤的信息
    const recentSteps = [];
    jobIds.forEach(function(jobId) {
        const data = learningData[jobId];
        const job = jobDataMap[jobId];

        data.completedSteps.forEach(function(stepInfo) {
            let stepTitle = '';
            let estimatedTime = 0;

            if (job && job.levels && job.levels[stepInfo.level] && job.levels[stepInfo.level].steps) {
                const step = job.levels[stepInfo.level].steps[stepInfo.step];
                if (step) {
                    stepTitle = step.title || '';
                    estimatedTime = step.estimatedTime || 0;
                }
            }

            // 用 localStorage key 的存在时间作为排序依据（无法精确获取时间，用 key 顺序近似）
            recentSteps.push({
                jobId: jobId,
                jobName: job ? job.name : jobId,
                levelIndex: stepInfo.level,
                stepIndex: stepInfo.step,
                stepTitle: stepTitle,
                estimatedTime: estimatedTime
            });
        });
    });

    // 取最近5个（倒序，即最后添加的在前面）
    const recentList = recentSteps.slice(-5).reverse();

    if (recentList.length > 0) {
        const recentTitle = createEl('div', '');
        recentTitle.style.cssText = 'font-size:var(--text-base);font-weight:var(--font-semibold);margin-bottom:var(--space-3);display:flex;align-items:center;gap:6px;';
        recentTitle.appendChild(icon('clock', 16, 'var(--accent)'));
        recentTitle.appendChild(document.createTextNode(' 最近学习'));
        wrap.appendChild(recentTitle);

        const recentContainer = createEl('div', '');
        recentContainer.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-4);';

        recentList.forEach(function(item) {
            const row = createEl('div', '');
            row.style.cssText = 'background:var(--bg-primary);border-radius:var(--radius-md);padding:var(--space-3);display:flex;align-items:center;gap:var(--space-2);';

            const checkIcon = createEl('span', '');
            checkIcon.appendChild(icon('checkCircle', 16, '#059669'));
            row.appendChild(checkIcon);

            const info = createEl('div', '');
            info.style.cssText = 'flex:1;min-width:0;';

            const stepTitleEl = createEl('div', '');
            stepTitleEl.style.cssText = 'font-size:var(--text-sm);color:var(--text-primary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            stepTitleEl.textContent = item.stepTitle || ('步骤 ' + (item.stepIndex + 1));
            info.appendChild(stepTitleEl);

            const jobNameEl = createEl('div', '');
            jobNameEl.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;';
            jobNameEl.textContent = item.jobName;
            info.appendChild(jobNameEl);

            row.appendChild(info);

            if (item.estimatedTime) {
                const timeEl = createEl('span', '');
                timeEl.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);white-space:nowrap;';
                timeEl.appendChild(icon('timer', 12));
                timeEl.appendChild(document.createTextNode(' ' + formatTime(item.estimatedTime)));
                row.appendChild(timeEl);
            }

            recentContainer.appendChild(row);
        });

        wrap.appendChild(recentContainer);
    }

    // 关闭按钮
    const closeBtn = createEl('button', 'btn btn-outline');
    closeBtn.style.cssText = 'width:100%;';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', function() { hideModal(); });
    wrap.appendChild(closeBtn);

    showModal(wrap);
}

// ==================== 消息通知 ====================

/**
 * 获取已读通知ID列表
 * @returns {Array<string>}
 */
function getReadNotificationIds() {
    try {
        return JSON.parse(localStorage.getItem('bst_read_notifications') || '[]');
    } catch (e) {
        return [];
    }
}

/**
 * 获取未读通知数量
 * @returns {number}
 */
function getUnreadNotificationCount() {
    const readIds = getReadNotificationIds();
    // 从 notifications.json 获取通知总数（同步方式：使用缓存或默认值）
    // 这里用已知的总通知数 5 作为基准，实际加载时会更准确
    const totalIds = ['n001', 'n002', 'n003', 'n004', 'n005'];
    return totalIds.filter(function(id) { return readIds.indexOf(id) === -1; }).length;
}

/**
 * 显示消息通知弹窗
 */
async function showNotifications() {
    // 显示加载状态
    const loadingWrap = document.createElement('div');
    loadingWrap.className = 'notifications-panel';
    loadingWrap.style.cssText = 'text-align:center;padding:60px 20px;';
    const bellIcon = icon('bell', 32);
    bellIcon.style.marginBottom = '12px';
    loadingWrap.appendChild(bellIcon);
    const loadingText = document.createElement('div');
    loadingText.style.color = 'var(--text-secondary)';
    loadingText.textContent = '正在加载通知...';
    loadingWrap.appendChild(loadingText);
    showModal(loadingWrap);

    // 加载通知数据
    let notifications = [];
    try {
        const res = await fetch('js/data/notifications.json');
        const data = await res.json();
        notifications = data.notifications || [];
    } catch (e) {
        console.warn('[通知] 加载失败:', e);
    }

    // 获取已读列表
    const readIds = getReadNotificationIds();

    // 按日期降序排列
    notifications.sort(function(a, b) {
        return b.date.localeCompare(a.date);
    });

    // 构建弹窗内容
    const wrap = document.createElement('div');
    wrap.className = 'notifications-panel';

    // 标题
    const title = createEl('div', 'modal-section-title center');
    title.textContent = '';
    title.appendChild(icon('bell', 18));
    title.appendChild(document.createTextNode(' 消息通知'));
    wrap.appendChild(title);

    if (notifications.length === 0) {
        const emptyState = createEl('div', '');
        emptyState.style.cssText = 'text-align:center;padding:40px 20px;color:var(--text-secondary);';
        const emptyIcon = createEl('div', '');
        emptyIcon.style.cssText = 'font-size:48px;margin-bottom:12px;';
        emptyIcon.appendChild(icon('bell', 48, 'var(--text-tertiary)'));
        emptyState.appendChild(emptyIcon);
        const emptyText = createEl('div', '');
        emptyText.style.cssText = 'font-size:var(--text-base);margin-bottom:8px;';
        emptyText.textContent = '暂无通知';
        emptyState.appendChild(emptyText);
        wrap.appendChild(emptyState);
        showModal(wrap);
        return;
    }

    // 类型 → 颜色/标签映射
    const typeConfig = {
        update:   { label: '更新', color: '#2563EB', bg: '#2563EB15' },
        feature:  { label: '新功能', color: '#059669', bg: '#05966915' },
        reminder: { label: '提醒', color: '#D97706', bg: '#D9770615' }
    };

    // 通知列表
    const list = createEl('div', '');
    list.style.cssText = 'display:flex;flex-direction:column;gap:var(--space-2);margin-bottom:var(--space-4);';

    notifications.forEach(function(notif) {
        const isRead = readIds.indexOf(notif.id) !== -1;
        const config = typeConfig[notif.type] || typeConfig.update;

        const row = createEl('div', '');
        row.style.cssText = 'background:var(--bg-primary);border-radius:var(--radius-md);padding:var(--space-3);display:flex;gap:var(--space-3);align-items:flex-start;cursor:pointer;opacity:' + (isRead ? '0.6' : '1') + ';transition:opacity 0.2s;';

        // 图标
        const iconWrap = createEl('div', '');
        iconWrap.style.cssText = 'width:40px;height:40px;border-radius:var(--radius-md);display:flex;align-items:center;justify-content:center;background:' + config.bg + ';flex-shrink:0;';
        iconWrap.appendChild(icon(notif.icon || 'bell', 20, config.color));
        row.appendChild(iconWrap);

        // 内容区
        const info = createEl('div', '');
        info.style.cssText = 'flex:1;min-width:0;';

        // 标题行（标题 + 类型标签 + 日期）
        const titleRow = createEl('div', '');
        titleRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:4px;flex-wrap:wrap;';

        const notifTitle = createEl('div', '');
        notifTitle.style.cssText = 'font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);';
        notifTitle.textContent = notif.title;
        titleRow.appendChild(notifTitle);

        // 类型标签
        const tag = createEl('span', '');
        tag.style.cssText = 'font-size:10px;padding:1px 6px;border-radius:4px;color:' + config.color + ';background:' + config.bg + ';font-weight:500;white-space:nowrap;';
        tag.textContent = config.label;
        titleRow.appendChild(tag);

        // 未读圆点
        if (!isRead) {
            const dot = createEl('span', '');
            dot.style.cssText = 'width:6px;height:6px;border-radius:50%;background:#EF4444;flex-shrink:0;';
            titleRow.appendChild(dot);
        }

        info.appendChild(titleRow);

        // 内容
        const content = createEl('div', '');
        content.style.cssText = 'font-size:var(--text-xs);color:var(--text-secondary);line-height:1.5;margin-bottom:4px;';
        content.textContent = notif.content;
        info.appendChild(content);

        // 日期
        const date = createEl('div', '');
        date.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);';
        date.textContent = notif.date;
        info.appendChild(date);

        row.appendChild(info);

        // 点击标记为已读
        row.addEventListener('click', function() {
            if (!isRead) {
                const updatedReadIds = getReadNotificationIds();
                if (updatedReadIds.indexOf(notif.id) === -1) {
                    updatedReadIds.push(notif.id);
                    try { localStorage.setItem('bst_read_notifications', JSON.stringify(updatedReadIds)); } catch (e) {}
                }
                row.style.opacity = '0.6';
                // 移除未读圆点
                const dotEl = titleRow.querySelector('span[style*="border-radius:50%"]');
                if (dotEl) dotEl.remove();
                // 更新菜单项描述
                updateNotificationDesc();
            }
        });

        list.appendChild(row);
    });

    wrap.appendChild(list);

    // 全部标记已读按钮
    const unreadCount = notifications.filter(function(n) { return readIds.indexOf(n.id) === -1; }).length;
    if (unreadCount > 0) {
        const markAllBtn = createEl('button', 'btn btn-outline');
        markAllBtn.style.cssText = 'width:100%;margin-bottom:var(--space-2);';
        markAllBtn.textContent = '全部标记为已读';
        markAllBtn.addEventListener('click', function() {
            const allIds = notifications.map(function(n) { return n.id; });
            try { localStorage.setItem('bst_read_notifications', JSON.stringify(allIds)); } catch (e) {}
            // 更新所有行的样式
            list.querySelectorAll('div[style*="opacity"]').forEach(function(row) {
                row.style.opacity = '0.6';
            });
            list.querySelectorAll('span[style*="border-radius:50%"]').forEach(function(dot) {
                dot.remove();
            });
            updateNotificationDesc();
            showToast('已全部标记为已读', 'success');
        });
        wrap.appendChild(markAllBtn);
    }

    // 关闭按钮
    const closeBtn = createEl('button', 'btn btn-outline');
    closeBtn.style.cssText = 'width:100%;';
    closeBtn.textContent = '关闭';
    closeBtn.addEventListener('click', function() { hideModal(); });
    wrap.appendChild(closeBtn);

    showModal(wrap);
}

/**
 * 更新通知菜单项的描述文字（显示未读数量）
 */
function updateNotificationDesc() {
    const unreadCount = getUnreadNotificationCount();
    const settingsItems = document.querySelectorAll('.settings-item');
    settingsItems.forEach(function(item) {
        const nameEl = item.querySelector('.setting-name');
        if (nameEl && nameEl.textContent === '消息通知') {
            const descEl = item.querySelector('.setting-desc');
            if (descEl) {
                descEl.textContent = unreadCount > 0
                    ? unreadCount + ' 条未读通知'
                    : '查看系统通知和更新日志';
            }
        }
    });
}

// ==================== 请我喝奶茶 ====================

function showSupportModal() {
    const wrap = document.createElement('div');
    wrap.style.cssText = 'text-align:center;padding:var(--space-6);';

    // 图标
    const iconWrap = document.createElement('div');
    iconWrap.style.cssText = 'font-size:48px;margin-bottom:var(--space-4);';
    iconWrap.textContent = '❤️';
    wrap.appendChild(iconWrap);

    // 标题
    const title = document.createElement('h3');
    title.style.cssText = 'font-size:var(--text-lg);font-weight:700;color:var(--text-primary);margin:0 0 var(--space-2);';
    title.textContent = '赞助支持百事通';
    wrap.appendChild(title);

    // 说明
    const desc = document.createElement('p');
    desc.style.cssText = 'font-size:var(--text-sm);color:var(--text-secondary);margin:0 0 var(--space-5);line-height:1.6;';
    desc.textContent = '如果百事通对你有帮助，可以随缘请我喝杯奶茶，就当是小小的创作鼓励。\n金额不分多少，每份都是心意，非常感谢～\n\n赞助完全自愿，不影响您使用任何功能。\n\n百事通有什么缺点或者哪里不完善的地方，可以过来找我，优化一下。';
    wrap.appendChild(desc);

    // 资金用途
    const useWrap = document.createElement('div');
    useWrap.style.cssText = 'background:var(--bg-primary);border-radius:var(--radius-lg);padding:var(--space-3) var(--space-4);margin-bottom:var(--space-5);text-align:left;';
    const useTitle = document.createElement('div');
    useTitle.style.cssText = 'font-size:var(--text-xs);font-weight:600;color:var(--text-tertiary);margin-bottom:var(--space-2);';
    useTitle.textContent = '你的支持将用于';
    useWrap.appendChild(useTitle);
    var uses = ['持续更新和维护百事通', '新功能开发'];
    for (var i = 0; i < uses.length; i++) {
        var useItem = document.createElement('div');
        useItem.style.cssText = 'font-size:var(--text-sm);color:var(--text-secondary);padding:2px 0;display:flex;align-items:center;gap:6px;';
        useItem.textContent = '✓ ' + uses[i];
        useWrap.appendChild(useItem);
    }
    wrap.appendChild(useWrap);

    // 微信收款码区域
    const qrWrap = document.createElement('div');
    qrWrap.style.cssText = 'display:flex;flex-direction:column;align-items:center;gap:var(--space-3);margin-bottom:var(--space-5);';

    const qrLabel = document.createElement('span');
    qrLabel.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);';
    qrLabel.textContent = '微信扫码赞助';
    qrWrap.appendChild(qrLabel);

    // 微信收款码图片
    const qrImg = document.createElement('img');
    qrImg.src = '/baishitong/wechat-pay.png';
    qrImg.alt = '微信收款码';
    qrImg.style.cssText = 'width:200px;height:200px;border-radius:var(--radius-lg);object-fit:cover;box-shadow:var(--shadow-md);';
    qrWrap.appendChild(qrImg);
    wrap.appendChild(qrWrap);

    // 感谢
    const tip = document.createElement('p');
    tip.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin:0 0 var(--space-3);';
    tip.textContent = '感谢每一位支持者的心意，百事通会持续更新 ❤️';
    wrap.appendChild(tip);

    // QQ群
    const qqTip = document.createElement('div');
    qqTip.style.cssText = 'text-align:center;margin-bottom:var(--space-4);';
    qqTip.innerHTML = '<span style="font-size:var(--text-xs);color:var(--text-tertiary);">有想法或Bug反馈？加QQ群 </span><span style="font-size:var(--text-sm);font-weight:var(--font-bold);color:var(--text-primary);cursor:pointer;user-select:all;" onclick="navigator.clipboard.writeText(\'932919784\')">932919784</span>';
    wrap.appendChild(qqTip);

    // 关闭按钮
    const closeBtn = document.createElement('button');
    closeBtn.className = 'btn btn-outline';
    closeBtn.style.cssText = 'width:100%;';
    closeBtn.textContent = '我了解了';
    closeBtn.addEventListener('click', function() { hideModal(); });
    wrap.appendChild(closeBtn);

    showModal(wrap);
}

/**
 * 显示 LeanCloud 配置弹窗
 */
async function showLeanCloudConfigPanel() {
    const html = '<div class="ai-settings-panel" id="lcConfigPanel"></div>';
    showModal(html);

    const panel = document.getElementById('lcConfigPanel');
    if (!panel) return;

    const title = createEl('div', 'modal-section-title center');
    title.textContent = '';
    title.appendChild(icon('cloud', 18));
    title.appendChild(document.createTextNode(' LeanCloud 配置'));
    panel.appendChild(title);

    const desc = createEl('p', '');
    desc.textContent = '配置 LeanCloud 后，社区功能将使用真实后端，所有用户可以互相看到帖子';
    desc.style.cssText = 'color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);';
    panel.appendChild(desc);

    // 读取已保存的配置
    const savedConfig = await getLeanCloudConfig();

    const fields = [
        { id: 'lc_appid', label: 'App ID', placeholder: '你的 LeanCloud App ID', value: savedConfig ? savedConfig.appId : '', isSecret: false },
        { id: 'lc_appkey', label: 'App Key', placeholder: '你的 LeanCloud App Key', value: savedConfig ? savedConfig.appKey : '', isSecret: true },
        { id: 'lc_server', label: '服务器地址', placeholder: 'https://xxx.lc-cn-n1-shared.com', value: savedConfig ? savedConfig.serverURL : '', isSecret: false }
    ];

    fields.forEach(function(field) {
        const label = createEl('div', '');
        label.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:4px;';
        label.textContent = field.label;
        panel.appendChild(label);

        const input = createEl('input', 'input');
        input.id = field.id;
        input.type = field.isSecret ? 'password' : 'text';
        input.placeholder = field.placeholder;
        input.value = field.value || '';
        input.style.cssText = 'margin-bottom:var(--space-2);';
        panel.appendChild(input);

        // 敏感字段添加显示/隐藏切换
        if (field.isSecret) {
            const toggleLabel = createEl('span', '');
            toggleLabel.textContent = '显示';
            toggleLabel.style.cssText = 'font-size:var(--text-xs);color:var(--accent);cursor:pointer;margin-bottom:var(--space-2);display:inline-block;';
            toggleLabel.addEventListener('click', function() {
                input.type = input.type === 'password' ? 'text' : 'password';
                toggleLabel.textContent = input.type === 'password' ? '显示' : '隐藏';
            });
            panel.appendChild(toggleLabel);
        }
    });

    // 提示链接
    const tipRow = createEl('div', '');
    tipRow.style.cssText = 'margin-bottom:var(--space-3);';
    const tipLink = createEl('a', '');
    tipLink.textContent = '';
    tipLink.appendChild(icon('externalLink', 12));
    tipLink.appendChild(document.createTextNode(' 前往 LeanCloud 控制台获取配置'));
    tipLink.href = 'https://console.leancloud.cn/app';
    tipLink.target = '_blank';
    tipLink.rel = 'noopener noreferrer';
    tipLink.style.cssText = 'font-size:var(--text-xs);color:var(--accent);';
    tipRow.appendChild(tipLink);
    panel.appendChild(tipRow);

    // 按钮
    const btnRow = createEl('div', '');
    btnRow.style.cssText = 'display:flex;gap:var(--space-2);margin-top:var(--space-2);';

    const saveBtn = createEl('button', 'btn btn-primary');
    saveBtn.style.cssText = 'flex:1;';
    saveBtn.textContent = '保存';

    const clearBtn = createEl('button', 'btn btn-secondary');
    clearBtn.style.cssText = 'flex:1;';
    clearBtn.textContent = '清除配置';

    const cancelBtn = createEl('button', 'btn btn-secondary');
    cancelBtn.style.cssText = 'flex:1;';
    cancelBtn.textContent = '取消';

    btnRow.appendChild(saveBtn);
    btnRow.appendChild(clearBtn);
    btnRow.appendChild(cancelBtn);
    panel.appendChild(btnRow);

    saveBtn.addEventListener('click', async function() {
        const appId = document.getElementById('lc_appid').value.trim();
        const appKey = document.getElementById('lc_appkey').value.trim();
        const serverURL = document.getElementById('lc_server').value.trim();

        if (!appId || !appKey || !serverURL) {
            showToast('请填写所有字段', 'warning');
            return;
        }

        await saveLeanCloudConfig(appId, appKey, serverURL);
        showToast('LeanCloud 配置已保存（加密存储）', 'success');
        hideModal();
        // 重新渲染个人中心以更新状态
        initProfile();
    });

    clearBtn.addEventListener('click', function() {
        showConfirm('清除配置', '清除后社区将恢复本地模式，确定？', function() {
            try {
                localStorage.removeItem('byt_lc_appid');
                localStorage.removeItem('byt_lc_appkey');
                localStorage.removeItem('byt_lc_server');
            } catch (e) {}
            showToast('已清除 LeanCloud 配置', 'info');
            hideModal();
            initProfile();
        });
    });

    cancelBtn.addEventListener('click', function() {
        hideModal();
    });
}
