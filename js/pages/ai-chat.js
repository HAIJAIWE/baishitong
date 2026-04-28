// ==================== ai-chat.js - AI 问答页 ====================
// 百事通 v1.0
// 支持多模型切换、API Key 管理、登录保护

import { clearContainer, createEl, showToast, showModal, hideModal } from '../utils/ui.js';
import { getCurrentModel, setCurrentModel, checkAchievement } from '../state.js';
import { getModelConfig, getAIModels, streamAI, renderMarkdown, isModelConfigured, addCustomModel, deleteCustomModel, AI_AGENTS } from '../ai-engine.js';
import { isLoggedIn, getCurrentUser, storeApiKey, getStoredApiKey, logout } from '../auth.js';
import { resetPageInit } from '../router.js';
import { storageGet, storageSet, storageRemove } from '../utils/storage.js';

// 对话状态
const _chatState = {
    messages: [],
    isLoading: false,
    currentAgent: null  // 当前选中的智能体 ID
};

const CHAT_HISTORY_KEY = 'ai_chat_history';
const MAX_HISTORY_MESSAGES = 50;

/**
 * 初始化 AI 问答页
 */
export function initAiChat() {
    const container = document.getElementById('page-ai');
    if (!container) return;

    clearContainer(container);

    // 未登录显示登录界面
    if (!isLoggedIn()) {
        renderLoginView(container);
        return;
    }

    // 恢复对话历史（仅首次初始化时）
    if (_chatState.messages.length === 0) {
        const saved = storageGet(CHAT_HISTORY_KEY, []);
        if (Array.isArray(saved) && saved.length > 0) {
            _chatState.messages = saved.slice(-MAX_HISTORY_MESSAGES);
        }
    }

    renderAiChat(container);
}

window.initAiChat = initAiChat;

export function sendChatMessage(message) {
    if (_chatState.isLoading || !message) return;

    const chatArea = document.getElementById('aiChatMessages');
    if (!chatArea) return;

    // 隐藏欢迎消息
    const welcome = document.getElementById('aiWelcome');
    if (welcome) welcome.style.display = 'none';

    // 添加用户消息
    _chatState.messages.push({ role: 'user', content: message });
    appendUserBubble(chatArea, message);

    // 检查AI提问成就
    checkAchievement('custom_job');

    // 创建 AI 气泡（流式填充）
    _chatState.isLoading = true;
    const aiBubble = createStreamingBubble(chatArea);

    // 调用 AI（流式）
    const modelId = getCurrentModel();
    let fullText = '';

    streamAI(modelId, _chatState.messages, function(chunk) {
        fullText += chunk;
        updateStreamingBubble(aiBubble, fullText);
    }, _chatState.currentAgent).then(function(reply) {
        // 流式完成，最终渲染
        finalizeStreamingBubble(aiBubble, reply || fullText);

        _chatState.messages.push({ role: 'assistant', content: reply || fullText });

        if (_chatState.messages.length > MAX_HISTORY_MESSAGES) {
            _chatState.messages = _chatState.messages.slice(-MAX_HISTORY_MESSAGES);
        }

        // 保存对话历史
        saveChatHistory();

        _chatState.isLoading = false;
    }).catch(function(err) {
        // 流式失败，显示错误
        if (aiBubble && aiBubble.parentNode) {
            aiBubble.parentNode.removeChild(aiBubble);
        }

        const errorBubble = createEl('div', 'chat-bubble ai');
        const avatar = createEl('div', 'bubble-avatar');
        avatar.textContent = '⚠️';
        const content = createEl('div', 'bubble-content');
        content.style.cssText = 'color:var(--warning);';
        content.textContent = err.message || '请求失败';
        errorBubble.appendChild(avatar);
        errorBubble.appendChild(content);
        chatArea.appendChild(errorBubble);

        _chatState.isLoading = false;
    });
}

window.sendChatMessage = sendChatMessage;

// ==================== 登录视图 ====================

function renderLoginView(container) {
    const main = createEl('div', 'chat-page');

    // 头部
    const header = createEl('div', 'ai-header');
    const title = createEl('span', '');
    title.textContent = '🤖 AI 问答';
    title.style.cssText = 'font-weight:var(--font-semibold);font-size:var(--text-lg);';
    header.appendChild(title);
    main.appendChild(header);

    // 登录卡片
    const card = createEl('div', '');
    card.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:var(--space-6);text-align:center;';

    const icon = createEl('div', '');
    icon.textContent = '🔐';
    icon.style.cssText = 'font-size:48px;margin-bottom:var(--space-4);';

    const desc = createEl('p', '');
    desc.textContent = '登录后即可使用 AI 问答功能';
    desc.style.cssText = 'color:var(--text-secondary);margin-bottom:var(--space-6);';

    card.appendChild(icon);
    card.appendChild(desc);

    // 登录表单
    const form = createEl('div', '');
    form.style.cssText = 'width:100%;max-width:320px;';

    const usernameInput = createEl('input', 'input');
    usernameInput.type = 'text';
    usernameInput.placeholder = '用户名';
    usernameInput.style.cssText = 'margin-bottom:var(--space-2);';

    const passwordInput = createEl('input', 'input');
    passwordInput.type = 'password';
    passwordInput.placeholder = '密码';
    passwordInput.style.cssText = 'margin-bottom:var(--space-3);';

    const loginBtn = createEl('button', 'btn btn-primary');
    loginBtn.style.cssText = 'width:100%;margin-bottom:var(--space-2);';
    loginBtn.textContent = '登录';

    const registerBtn = createEl('button', 'btn btn-secondary');
    registerBtn.style.cssText = 'width:100%;';
    registerBtn.textContent = '注册新账号';

    form.appendChild(usernameInput);
    form.appendChild(passwordInput);
    form.appendChild(loginBtn);
    form.appendChild(registerBtn);
    card.appendChild(form);

    main.appendChild(card);
    container.appendChild(main);

    // 登录事件
    loginBtn.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        if (!username || !password) {
            showToast('请输入用户名和密码', 'warning');
            return;
        }
        const result = window.login(username, password);
        if (result.success) {
            showToast('登录成功');
            initAiChat();
        } else {
            showToast(result.message, 'error');
        }
    });

    // 注册事件
    registerBtn.addEventListener('click', function() {
        const username = usernameInput.value.trim();
        const password = passwordInput.value;
        if (!username || !password) {
            showToast('请输入用户名和密码', 'warning');
            return;
        }
        const result = window.register(username, password);
        if (result.success) {
            showToast('注册成功，请登录');
        } else {
            showToast(result.message, 'error');
        }
    });

    // 回车登录
    passwordInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') loginBtn.click();
    });
}

// ==================== 聊天视图 ====================

function renderAiChat(container) {
    const main = createEl('div', 'chat-page');

    // 1. 顶部栏
    const header = createAiHeader();
    main.appendChild(header);

    // 2. 聊天区域
    const chatArea = createEl('div', 'chat-container chat-messages');
    chatArea.id = 'aiChatMessages';

    // 欢迎消息
    const welcome = createWelcomeMessage();
    chatArea.appendChild(welcome);

    // 恢复历史消息
    if (_chatState.messages.length > 0) {
        welcome.style.display = 'none';
        _chatState.messages.forEach(function(msg) {
            if (msg.role === 'user') {
                appendUserBubble(chatArea, msg.content);
            } else if (msg.role === 'assistant') {
                appendAiBubble(chatArea, msg.content);
            }
        });
    }

    main.appendChild(chatArea);

    // 3. 输入区域
    const inputArea = createChatInput(chatArea);
    main.appendChild(inputArea);

    container.appendChild(main);
}

// ==================== 顶部栏 ====================

function createAiHeader() {
    const header = createEl('div', 'ai-header');

    // 智能体选择器（左上角）
    const agentSelector = createEl('div', 'agent-selector');
    const agentIcon = createEl('span', '');
    const agentLabel = createEl('span', '');
    const agentArrow = createEl('span', '');
    agentArrow.textContent = '▾';
    agentArrow.style.cssText = 'font-size:10px;color:var(--text-tertiary);margin-left:2px;';

    // 获取当前选中的智能体
    function updateAgentDisplay() {
        if (_chatState.currentAgent) {
            const agent = AI_AGENTS.find(function(a) { return a.id === _chatState.currentAgent; });
            if (agent) {
                agentIcon.textContent = agent.icon;
                agentLabel.textContent = agent.name;
                return;
            }
        }
        agentIcon.textContent = '🤖';
        agentLabel.textContent = 'AI助手';
    }
    updateAgentDisplay();

    agentSelector.appendChild(agentIcon);
    agentSelector.appendChild(agentLabel);
    agentSelector.appendChild(agentArrow);

    // 下拉菜单
    const dropdown = createEl('div', 'agent-dropdown');

    // "通用"选项
    const defaultOpt = createEl('div', 'agent-option' + (!_chatState.currentAgent ? ' active' : ''));
    defaultOpt.innerHTML = '<span>🤖</span><span>通用模式</span><span style="font-size:var(--text-xs);color:var(--text-tertiary);margin-left:auto;">默认</span>';
    defaultOpt.addEventListener('click', function(e) {
        e.stopPropagation();
        _chatState.currentAgent = null;
        updateAgentDisplay();
        dropdown.classList.remove('show');
        updateWelcomeForAgent();
    });
    dropdown.appendChild(defaultOpt);

    // 各智能体选项
    AI_AGENTS.forEach(function(agent) {
        const opt = createEl('div', 'agent-option' + (_chatState.currentAgent === agent.id ? ' active' : ''));
        opt.innerHTML = '<span>' + agent.icon + '</span><span>' + agent.name + '</span><span style="font-size:var(--text-xs);color:var(--text-tertiary);margin-left:auto;">' + agent.desc + '</span>';
        opt.addEventListener('click', function(e) {
            e.stopPropagation();
            _chatState.currentAgent = agent.id;
            updateAgentDisplay();
            dropdown.classList.remove('show');
            updateWelcomeForAgent();
        });
        dropdown.appendChild(opt);
    });

    agentSelector.appendChild(dropdown);

    // 点击切换下拉
    agentSelector.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdown.classList.toggle('show');
    });

    // 点击外部关闭
    document.addEventListener('click', function() {
        dropdown.classList.remove('show');
    });

    header.appendChild(agentSelector);

    // 右侧按钮组
    const rightBtns = createEl('div', '');
    rightBtns.style.cssText = 'display:flex;align-items:center;gap:4px;margin-left:auto;';

    // 清除历史按钮
    const clearBtn = createEl('div', '');
    clearBtn.style.cssText = 'cursor:pointer;font-size:var(--text-sm);color:var(--text-tertiary);padding:4px 6px;border-radius:6px;';
    clearBtn.textContent = '🗑️';
    clearBtn.title = '清除聊天记录';
    clearBtn.addEventListener('click', function() {
        if (confirm('确定要清除所有聊天记录吗？')) {
            clearChatHistory();
            resetPageInit('page-ai');
            initAiChat();
            showToast('聊天记录已清除');
        }
    });
    rightBtns.appendChild(clearBtn);

    // 登出按钮
    const logoutBtn = createEl('div', '');
    logoutBtn.style.cssText = 'cursor:pointer;font-size:var(--text-sm);color:var(--text-tertiary);padding:4px 6px;border-radius:6px;';
    logoutBtn.textContent = '🚪';
    logoutBtn.title = '登出';
    logoutBtn.addEventListener('click', function() {
        if (confirm('确定要登出吗？')) {
            logout();
            _chatState.messages = [];
            storageRemove(CHAT_HISTORY_KEY);
            initAiChat();
        }
    });
    rightBtns.appendChild(logoutBtn);

    // 模型选择器
    const currentModelId = getCurrentModel();
    const modelConfig = getModelConfig(currentModelId);
    const selector = createEl('div', 'ai-model-selector');

    const dot = createEl('span', 'model-dot');

    const label = createEl('span', '');
    label.textContent = modelConfig ? modelConfig.name : '选择模型';

    selector.appendChild(dot);
    selector.appendChild(label);

    selector.addEventListener('click', function() {
        showModelSelectorPanel();
    });

    rightBtns.appendChild(selector);
    header.appendChild(rightBtns);

    return header;
}

// 切换智能体时更新欢迎信息
function updateWelcomeForAgent() {
    const titleEl = document.querySelector('.welcome-title');
    const input = document.getElementById('aiChatInput');
    if (_chatState.currentAgent) {
        const agent = AI_AGENTS.find(function(a) { return a.id === _chatState.currentAgent; });
        if (titleEl) titleEl.textContent = agent.icon + ' ' + agent.name + '已就绪';
        if (input) input.placeholder = '向' + agent.name + '提问...';
    } else {
        if (titleEl) titleEl.textContent = '你好！我是百事通AI助手';
        if (input) input.placeholder = '输入你的职业问题...';
    }
}

// ==================== 欢迎消息 ====================

function createWelcomeMessage() {
    const welcome = createEl('div', 'ai-welcome');
    welcome.id = 'aiWelcome';

    const icon = createEl('div', 'welcome-icon');
    icon.textContent = '🤖';

    const title = createEl('div', 'welcome-title');
    title.textContent = '你好！我是百事通AI助手';

    const desc = createEl('div', 'welcome-desc');
    desc.textContent = '可以问我任何关于职业的问题';

    welcome.appendChild(icon);
    welcome.appendChild(title);
    welcome.appendChild(desc);

    // 快捷问题
    const questions = createEl('div', 'quick-questions');
    const presetQuestions = [
        '程序员需要学什么？',
        '护士的工作辛苦吗？',
        '如何成为厨师？',
        '建筑工人的薪资多少？',
        '当兵需要什么条件？'
    ];

    presetQuestions.forEach(function(q) {
        const btn = createEl('button', 'quick-question');
        btn.textContent = q;
        btn.addEventListener('click', function() {
            sendChatMessage(q);
        });
        questions.appendChild(btn);
    });

    welcome.appendChild(questions);
    return welcome;
}

// ==================== 聊天输入 ====================

function createChatInput(chatArea) {
    const area = createEl('div', 'chat-input-area');

    const input = createEl('input', 'input');
    input.id = 'aiChatInput';
    input.type = 'text';
    input.placeholder = '输入你的职业问题...';
    input.setAttribute('aria-label', '输入职业问题');

    const sendBtn = createEl('button', 'send-btn');
    sendBtn.textContent = '➤';
    sendBtn.style.cssText = 'font-size:18px;';

    sendBtn.addEventListener('click', function() {
        const msg = input.value.trim();
        if (msg) {
            sendChatMessage(msg);
            input.value = '';
        }
    });

    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            const msg = input.value.trim();
            if (msg) {
                sendChatMessage(msg);
                input.value = '';
            }
        }
    });

    area.appendChild(input);
    area.appendChild(sendBtn);

    return area;
}

// ==================== 消息气泡 ====================

function appendUserBubble(container, text) {
    const bubble = createEl('div', 'chat-bubble user');
    const avatar = createEl('div', 'bubble-avatar');
    avatar.textContent = '👤';
    const content = createEl('div', 'bubble-content');
    content.textContent = text;
    bubble.appendChild(avatar);
    bubble.appendChild(content);
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

function appendAiBubble(container, text) {
    const bubble = createEl('div', 'chat-bubble ai');
    const avatar = createEl('div', 'bubble-avatar');
    avatar.textContent = '🤖';
    const content = createEl('div', 'bubble-content');
    content.innerHTML = renderMarkdown(text);
    bubble.appendChild(avatar);
    bubble.appendChild(content);
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
}

function showTypingIndicator(container) {
    const bubble = createEl('div', 'chat-bubble ai');
    const avatar = createEl('div', 'bubble-avatar');
    avatar.textContent = '🤖';
    const content = createEl('div', 'bubble-content');
    const typing = createEl('div', 'typing-indicator');
    typing.innerHTML = '<span></span><span></span><span></span>';
    content.appendChild(typing);
    bubble.appendChild(avatar);
    bubble.appendChild(content);
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

// ==================== 流式气泡 ====================

function createStreamingBubble(container) {
    const bubble = createEl('div', 'chat-bubble ai');
    const avatar = createEl('div', 'bubble-avatar');
    avatar.textContent = '🤖';
    const content = createEl('div', 'bubble-content streaming-content');
    const cursor = createEl('span', 'streaming-cursor');
    cursor.textContent = '▊';
    content.appendChild(cursor);
    bubble.appendChild(avatar);
    bubble.appendChild(content);
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

function updateStreamingBubble(bubble, text) {
    const content = bubble.querySelector('.bubble-content');
    if (!content) return;
    // 保留光标元素
    const cursor = content.querySelector('.streaming-cursor');
    // 设置纯文本（流式过程中用 textContent 避免 XSS）
    content.textContent = text;
    if (cursor) content.appendChild(cursor);
    // 自动滚动
    const container = bubble.parentNode;
    if (container) container.scrollTop = container.scrollHeight;
}

function finalizeStreamingBubble(bubble, text) {
    const content = bubble.querySelector('.bubble-content');
    if (!content) return;
    // 最终渲染：用 markdown 渲染
    content.classList.remove('streaming-content');
    content.innerHTML = renderMarkdown(text);
    const container = bubble.parentNode;
    if (container) container.scrollTop = container.scrollHeight;
}

// ==================== 模型选择面板 ====================

function showModelSelectorPanel() {
    const models = getAIModels();
    const currentModelId = getCurrentModel();

    const html = '<div class="ai-settings-panel" id="modelPanel"></div>';
    showModal(html);

    const panel = document.getElementById('modelPanel');
    if (!panel) return;

    const title = createEl('div', 'modal-section-title');
    title.textContent = '选择 AI 模型';
    panel.appendChild(title);

    // 国内模型
    const cnTitle = createEl('div', 'modal-sub-title');
    cnTitle.textContent = '🇨🇳 国内模型';
    cnTitle.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin:var(--space-2) 0 var(--space-1);';
    panel.appendChild(cnTitle);

    const cnModels = models.filter(function(m) {
        return ['doubao', 'qwen', 'deepseek', 'glm', 'kimi'].indexOf(m.id) !== -1;
    });
    cnModels.forEach(function(model) {
        panel.appendChild(createModelCard(model, currentModelId));
    });

    // 国际模型
    const intlTitle = createEl('div', 'modal-sub-title');
    intlTitle.textContent = '🌐 国际模型';
    intlTitle.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin:var(--space-3) 0 var(--space-1);';
    panel.appendChild(intlTitle);

    const intlModels = models.filter(function(m) {
        return ['gpt-4o-mini', 'claude', 'gemini'].indexOf(m.id) !== -1;
    });
    intlModels.forEach(function(model) {
        panel.appendChild(createModelCard(model, currentModelId));
    });

    // 自定义模型
    const customModels = models.filter(function(m) { return !m.builtin; });
    if (customModels.length > 0) {
        const customTitle = createEl('div', 'modal-sub-title');
        customTitle.textContent = '⚙️ 自定义模型';
        customTitle.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin:var(--space-3) 0 var(--space-1);';
        panel.appendChild(customTitle);

        customModels.forEach(function(model) {
            panel.appendChild(createModelCard(model, currentModelId, true));
        });
    }

    // 添加自定义模型按钮
    const addBtn = createEl('button', 'btn btn-secondary');
    addBtn.style.cssText = 'width:100%;margin-top:var(--space-3);';
    addBtn.textContent = '➕ 添加自定义模型';
    addBtn.addEventListener('click', function() {
        hideModal();
        showAddCustomModelPanel();
    });
    panel.appendChild(addBtn);

    // 底部说明
    const tipDiv = createEl('div', '');
    tipDiv.style.cssText = 'text-align:center;margin-top:var(--space-3);';
    const tipText = createEl('span', '');
    tipText.textContent = '🔑 点击模型卡片配置 API Key';
    tipText.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);';
    tipDiv.appendChild(tipText);
    panel.appendChild(tipDiv);
}

/**
 * 创建模型卡片
 */
function createModelCard(model, currentModelId, canDelete) {
    const card = createEl('div', 'model-card');

    if (currentModelId === model.id) {
        card.classList.add('selected');
    }

    const icon = createEl('span', 'model-icon');
    icon.textContent = model.icon || '🤖';

    const info = createEl('div', 'model-info');

    const nameRow = createEl('div', '');
    nameRow.style.cssText = 'display:flex;align-items:center;gap:6px;';

    const name = createEl('div', 'model-name');
    name.textContent = model.name;

    const provider = createEl('span', '');
    provider.textContent = model.provider || '';
    provider.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);';

    nameRow.appendChild(name);
    nameRow.appendChild(provider);

    const desc = createEl('div', '');
    desc.textContent = model.description || '';
    desc.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin-top:2px;';

    info.appendChild(nameRow);
    info.appendChild(desc);

    // 状态：已配置 / 未配置
    const status = createEl('div', 'model-status');
    // 异步检查配置状态
    isModelConfigured(model.id).then(function(configured) {
        if (configured) {
            status.textContent = '✅ 已配置';
            status.style.color = 'var(--color-success)';
        } else {
            status.textContent = '⚠️ 未配置Key';
            status.style.color = 'var(--text-tertiary)';
        }
    });

    info.appendChild(status);

    const check = createEl('span', 'model-check');
    check.textContent = currentModelId === model.id ? '✓' : '';

    card.appendChild(icon);
    card.appendChild(info);
    card.appendChild(check);

    // 点击：左半区切换模型，右半区配置Key
    card.addEventListener('click', function(e) {
        // 如果点击的是删除按钮区域
        if (canDelete && e.offsetX > card.offsetWidth - 40) {
            if (confirm('确定删除自定义模型 ' + model.name + '？')) {
                deleteCustomModel(model.id);
                hideModal();
                showModelSelectorPanel();
            }
            return;
        }

        // 如果已配置Key，切换模型
        // 否则打开Key设置
        isModelConfigured(model.id).then(function(configured) {
            if (configured) {
                setCurrentModel(model.id);
                hideModal();
                resetPageInit('page-ai');
                initAiChat();
                showToast('已切换到 ' + model.name);
            } else {
                hideModal();
                showApiKeyPanel(model);
            }
        });
    });

    return card;
}

// ==================== API Key 设置面板 ====================

function showApiKeyPanel(model) {
    const html = '<div class="ai-settings-panel" id="apiKeyPanel"></div>';
    showModal(html);

    const panel = document.getElementById('apiKeyPanel');
    if (!panel) return;

    // 标题
    const title = createEl('div', 'modal-section-title');
    title.textContent = model.icon + ' ' + model.name + ' - API Key 设置';
    panel.appendChild(title);

    // 说明
    const desc = createEl('p', '');
    desc.textContent = '请输入你的 ' + (model.keyHint || 'API Key');
    desc.style.cssText = 'color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);';
    panel.appendChild(desc);

    // Key 输入框
    const keyInput = createEl('input', 'input');
    keyInput.type = 'password';
    keyInput.placeholder = model.keyHint || 'sk-...';
    keyInput.style.cssText = 'margin-bottom:var(--space-2);';

    // 读取已保存的Key
    getStoredApiKey(model.id).then(function(savedKey) {
        if (savedKey) {
            keyInput.value = savedKey;
        }
    });

    panel.appendChild(keyInput);

    // 显示/隐藏Key
    const toggleRow = createEl('div', '');
    toggleRow.style.cssText = 'display:flex;align-items:center;gap:6px;margin-bottom:var(--space-3);';
    const toggleLabel = createEl('span', '');
    toggleLabel.textContent = '显示 Key';
    toggleLabel.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);cursor:pointer;';
    toggleLabel.addEventListener('click', function() {
        keyInput.type = keyInput.type === 'password' ? 'text' : 'password';
        toggleLabel.textContent = keyInput.type === 'password' ? '显示 Key' : '隐藏 Key';
    });
    toggleRow.appendChild(toggleLabel);
    panel.appendChild(toggleRow);

    // 获取Key链接
    if (model.keyUrl) {
        const linkRow = createEl('div', '');
        linkRow.style.cssText = 'margin-bottom:var(--space-3);';
        const link = createEl('a', '');
        link.textContent = '👉 前往 ' + (model.provider || '') + ' 获取 API Key';
        link.href = model.keyUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.style.cssText = 'font-size:var(--text-xs);color:var(--accent);';
        linkRow.appendChild(link);
        panel.appendChild(linkRow);
    }

    // 按钮
    const btnRow = createEl('div', '');
    btnRow.style.cssText = 'display:flex;gap:var(--space-2);margin-top:var(--space-2);';

    const saveBtn = createEl('button', 'btn btn-primary');
    saveBtn.style.cssText = 'flex:1;';
    saveBtn.textContent = '保存';

    const cancelBtn = createEl('button', 'btn btn-secondary');
    cancelBtn.style.cssText = 'flex:1;';
    cancelBtn.textContent = '取消';

    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    panel.appendChild(btnRow);

    // 保存事件
    saveBtn.addEventListener('click', async function() {
        const key = keyInput.value.trim();
        if (!key) {
            showToast('请输入 API Key', 'warning');
            return;
        }
        const ok = await storeApiKey(model.id, key);
        if (ok) {
            showToast('API Key 已保存（加密存储）');
            hideModal();
            // 自动切换到该模型
            setCurrentModel(model.id);
            resetPageInit('page-ai');
            initAiChat();
        } else {
            showToast('保存失败', 'error');
        }
    });

    cancelBtn.addEventListener('click', function() {
        hideModal();
    });
}

// ==================== 添加自定义模型面板 ====================

function showAddCustomModelPanel() {
    const html = '<div class="ai-settings-panel" id="customModelPanel"></div>';
    showModal(html);

    const panel = document.getElementById('customModelPanel');
    if (!panel) return;

    const title = createEl('div', 'modal-section-title');
    title.textContent = '➕ 添加自定义模型';
    panel.appendChild(title);

    const desc = createEl('p', '');
    desc.textContent = '支持所有 OpenAI 兼容格式的 API';
    desc.style.cssText = 'color:var(--text-secondary);font-size:var(--text-sm);margin-bottom:var(--space-3);';
    panel.appendChild(desc);

    // 表单字段
    const fields = [
        { id: 'cm_name', label: '模型名称', placeholder: '例如：我的模型', required: true },
        { id: 'cm_baseUrl', label: 'API 地址', placeholder: '例如：https://api.example.com/v1', required: true },
        { id: 'cm_model', label: '模型 ID', placeholder: '例如：gpt-3.5-turbo', required: true },
        { id: 'cm_keyHint', label: 'Key 提示', placeholder: '例如：API Key（选填）' }
    ];

    fields.forEach(function(field) {
        const label = createEl('div', '');
        label.style.cssText = 'font-size:var(--text-xs);color:var(--text-tertiary);margin-bottom:4px;';
        label.textContent = field.label + (field.required ? ' *' : '');
        panel.appendChild(label);

        const input = createEl('input', 'input');
        input.id = field.id;
        input.type = 'text';
        input.placeholder = field.placeholder;
        input.style.cssText = 'margin-bottom:var(--space-2);';
        panel.appendChild(input);
    });

    // 按钮
    const btnRow = createEl('div', '');
    btnRow.style.cssText = 'display:flex;gap:var(--space-2);margin-top:var(--space-2);';

    const saveBtn = createEl('button', 'btn btn-primary');
    saveBtn.style.cssText = 'flex:1;';
    saveBtn.textContent = '添加';

    const cancelBtn = createEl('button', 'btn btn-secondary');
    cancelBtn.style.cssText = 'flex:1;';
    cancelBtn.textContent = '取消';

    btnRow.appendChild(saveBtn);
    btnRow.appendChild(cancelBtn);
    panel.appendChild(btnRow);

    saveBtn.addEventListener('click', function() {
        const name = document.getElementById('cm_name').value.trim();
        const baseUrl = document.getElementById('cm_baseUrl').value.trim();
        const modelId = document.getElementById('cm_model').value.trim();
        const keyHint = document.getElementById('cm_keyHint').value.trim();

        if (!name || !baseUrl || !modelId) {
            showToast('请填写必填字段', 'warning');
            return;
        }

        // 生成唯一ID
        const id = 'custom_' + Date.now();

        const result = addCustomModel({
            id: id,
            name: name,
            baseUrl: baseUrl,
            model: modelId,
            keyHint: keyHint || 'API Key'
        });

        if (result.success) {
            showToast('模型添加成功');
            hideModal();
            showModelSelectorPanel();
        } else {
            showToast(result.message, 'error');
        }
    });

    cancelBtn.addEventListener('click', function() {
        hideModal();
    });
}

// ==================== 对话历史管理 ====================

function saveChatHistory() {
    try {
        storageSet(CHAT_HISTORY_KEY, _chatState.messages.slice(-MAX_HISTORY_MESSAGES));
    } catch (e) {
        // 存储空间不足时忽略
    }
}

export function clearChatHistory() {
    _chatState.messages = [];
    storageRemove(CHAT_HISTORY_KEY);
}

window.clearChatHistory = clearChatHistory;

// 暴露设置面板到全局（供 profile.js 调用）
window.showSettingsPanel = showModelSelectorPanel;
