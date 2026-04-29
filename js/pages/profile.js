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
    version.textContent = '百事通 v1.0';
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
    nameRow.style.cssText = 'display:flex;align-items:center;gap:6px;cursor:pointer;';
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
    version.textContent = '百事通 v1.0';
    panel.appendChild(version);

    const desc = createEl('div', 'about-desc');
    desc.textContent = '一款面向普通用户的职业探索应用，涵盖1662个职业数据，AI智能问答，帮助你发现职业方向。';
    panel.appendChild(desc);

    const features = createEl('div', 'about-features');
    features.style.cssText = 'font-size:var(--text-sm);color:var(--text-secondary);line-height:2;';

    const featureItems = [
        '涵盖 1662 个职业详细数据',
        '8大行业分类，54个中类',
        'AI 多模型智能问答（DeepSeek/通义千问/智谱GLM）',
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
