// ==================== ai-engine.js - AI 引擎（多模型支持） ====================
// 百事通 v1.0
// 支持：豆包、通义千问、DeepSeek、智谱、Kimi、OpenAI 及自定义模型
// 全部兼容 OpenAI API 格式
// 安全原则：AI返回内容必须经过 sanitize 处理后才能用 innerHTML 渲染

import { sanitize } from './utils/ui.js';
import { isLoggedIn, getStoredApiKey } from './auth.js';

/**
 * 内置模型配置（OpenAI 兼容格式）
 * 每个模型需要配置：baseUrl, model, 需要用户填 apiKey
 */
const AI_MODELS = {
    // === 国内模型 ===
    'doubao': {
        id: 'doubao',
        name: '豆包',
        provider: '字节跳动',
        baseUrl: 'https://ark.cn-beijing.volces.com/api/v3',
        model: 'doubao-pro-32k',
        icon: '🫘',
        builtin: true,
        description: '字节跳动出品，中文理解强',
        keyHint: '火山引擎 API Key',
        keyUrl: 'https://console.volcengine.com/ark'
    },
    'qwen': {
        id: 'qwen',
        name: '通义千问',
        provider: '阿里云',
        baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
        model: 'qwen-turbo',
        icon: '☁️',
        builtin: true,
        description: '阿里云出品，性价比高',
        keyHint: '阿里云 DashScope API Key',
        keyUrl: 'https://dashscope.console.aliyun.com/'
    },
    'deepseek': {
        id: 'deepseek',
        name: 'DeepSeek',
        provider: '深度求索',
        baseUrl: 'https://api.deepseek.com/v1',
        model: 'deepseek-chat',
        icon: '🔷',
        builtin: true,
        description: '国产模型，编程能力强',
        keyHint: 'DeepSeek API Key',
        keyUrl: 'https://platform.deepseek.com/api_keys'
    },
    'glm': {
        id: 'glm',
        name: '智谱 GLM',
        provider: '智谱AI',
        baseUrl: 'https://open.bigmodel.cn/api/paas/v4',
        model: 'glm-4-flash',
        icon: '🧬',
        builtin: true,
        description: '智谱AI出品，免费额度多',
        keyHint: '智谱 API Key',
        keyUrl: 'https://open.bigmodel.cn/usercenter/apikeys'
    },
    'kimi': {
        id: 'kimi',
        name: 'Kimi',
        provider: '月之暗面',
        baseUrl: 'https://api.moonshot.cn/v1',
        model: 'moonshot-v1-8k',
        icon: '🌙',
        builtin: true,
        description: '月之暗面出品，长文本优秀',
        keyHint: 'Moonshot API Key',
        keyUrl: 'https://platform.moonshot.cn/console/api-keys'
    },

    // === 国际模型 ===
    'gpt-4o-mini': {
        id: 'gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'OpenAI',
        baseUrl: 'https://api.openai.com/v1',
        model: 'gpt-4o-mini',
        icon: '🤖',
        builtin: true,
        description: 'OpenAI 轻量模型，快速准确',
        keyHint: 'OpenAI API Key',
        keyUrl: 'https://platform.openai.com/api-keys'
    },
    'claude': {
        id: 'claude',
        name: 'Claude',
        provider: 'Anthropic',
        baseUrl: 'https://api.anthropic.com/v1',
        model: 'claude-sonnet-4-20250514',
        icon: '🧠',
        builtin: true,
        description: 'Anthropic 出品，推理能力强',
        keyHint: 'Anthropic API Key',
        keyUrl: 'https://console.anthropic.com/',
        // Claude 使用不同的请求格式，需要特殊处理
        customFormat: 'anthropic'
    },
    'gemini': {
        id: 'gemini',
        name: 'Gemini',
        provider: 'Google',
        baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
        model: 'gemini-2.0-flash',
        icon: '💎',
        builtin: true,
        description: 'Google 出品，多模态',
        keyHint: 'Google AI API Key',
        keyUrl: 'https://aistudio.google.com/apikey'
    }
};

// 自定义模型存储
let customModels = {};

// 默认模型
let currentModelId = 'deepseek';

/**
 * 系统提示词
 */
const SYSTEM_PROMPT = '你是「百事通」AI职业顾问，专门帮助用户了解各种职业。你可以回答关于职业的任何问题，包括：\n'
    + '- 职业的工作内容和日常\n'
    + '- 职业的发展前景和薪资\n'
    + '- 如何入行和需要什么条件\n'
    + '- 职业的优缺点\n'
    + '- 职业相关的技能和学习路径\n'
    + '- 职业对比分析\n'
    + '请用简洁易懂的语言回答，适合普通大众阅读。回答要有条理，善用分点。如果用户问的问题与职业无关，请礼貌地引导回职业话题。';

/**
 * AI 智能体配置
 */
const AI_AGENTS = [
    {
        id: 'career-advisor',
        name: '职业顾问',
        icon: '💼',
        desc: '全方位职业探索与规划',
        prompt: '你是「百事通」资深职业规划顾问，拥有20年职业咨询经验，帮助用户深入了解各种职业。\n\n你的专业能力：\n1. 职业全景解析：详细解读任何职业的工作内容、日常工作流程、所需技能\n2. 入行路径规划：从零基础到入行的完整路径，包括学历要求、证书、培训\n3. 发展前景分析：行业趋势、薪资水平、晋升空间、地域差异\n4. 优劣势评估：客观分析职业的利弊，帮助用户理性决策\n5. 职业对比：多维度对比不同职业，帮助用户找到最适合的方向\n\n回答要求：\n- 语言简洁专业，适合普通大众理解\n- 善用分点和编号，结构清晰\n- 给出具体数字和案例（如薪资范围、学习周期）\n- 如果用户的问题不够具体，主动追问以提供更精准的建议\n- 涉及薪资时给出国内主流城市的参考范围'
    },
    {
        id: 'resume-coach',
        name: '简历助手',
        icon: '📝',
        desc: '打造专业简历，提升求职竞争力',
        prompt: '你是「百事通」专业简历优化专家，精通各行业招聘需求，帮助用户打造高通过率的简历。\n\n你的专业能力：\n1. 简历结构优化：根据求职目标调整简历结构和内容重点\n2. 工作经历润色：将平淡的工作描述转化为有冲击力的成就表述\n3. 技能匹配分析：针对目标岗位匹配和突出相关技能\n4. 自我评价撰写：写出有说服力的个人优势总结\n5. 简历诊断：发现简历中的常见问题并给出改进建议\n\n回答要求：\n- 提供可直接使用的简历文案，标注哪些内容需要用户自行替换\n- 使用STAR法则（情境-任务-行动-结果）指导经历描述\n- 给出具体示例，如"修改前→修改后"的对比\n- 针对不同经验水平（应届生/转行/资深）给出差异化建议\n- 提醒常见的简历避坑要点'
    },
    {
        id: 'interview-coach',
        name: '面试教练',
        icon: '🎯',
        desc: '模拟面试，提升面试表现',
        prompt: '你是「百事通」资深面试教练，拥有丰富的HR和面试官经验，帮助用户全面提升面试能力。\n\n你的专业能力：\n1. 面试问题预测：根据目标岗位预测高频面试问题\n2. 回答技巧指导：教用户用结构化方式回答各类面试题\n3. 模拟面试：扮演面试官进行模拟提问和点评\n4. 薪资谈判：指导用户如何在面试中谈薪资\n5. 面试礼仪：从着装到肢体语言的全方位指导\n\n回答要求：\n- 先给出回答框架/思路，再提供具体参考话术\n- 标注回答中的加分项和减分项\n- 针对技术岗和管理岗给出不同策略\n- 提供面试前、中、后的完整注意事项\n- 鼓励用户主动练习，可以提出"我们来模拟一下"进行互动\n- 用"面试官视角"和"求职者视角"双角度分析'
    },
    {
        id: 'study-planner',
        name: '学习规划师',
        icon: '📚',
        desc: '制定学习计划，高效提升技能',
        prompt: '你是「百事通」专业学习规划师，擅长为不同基础的用户制定高效、可执行的学习计划。\n\n你的专业能力：\n1. 学习路径规划：为任何职业/技能制定从入门到精通的分阶段学习计划\n2. 学习资源推荐：推荐优质的学习资源（书籍、课程、网站、实践项目）\n3. 时间管理建议：根据用户可用时间合理安排学习进度\n4. 学习方法指导：推荐高效的学习方法和记忆技巧\n5. 考证规划：各类职业资格证书的报考条件和备考策略\n\n回答要求：\n- 学习计划要具体到每周/每月的任务，可执行性强\n- 区分"必学"和"选学"内容，标注优先级\n- 给出每个阶段的预期成果和检验标准\n- 推荐免费和付费资源，注明来源\n- 考虑用户的时间和经济成本，给出性价比最高的方案\n- 主动询问用户的基础水平和可用时间，以便个性化推荐'
    },
    {
        id: 'workplace-mentor',
        name: '职场导师',
        icon: '🤝',
        desc: '职场人际关系与职业发展指导',
        prompt: '你是「百事通」资深职场导师，拥有丰富的职场经验和管理咨询背景，帮助用户解决职场中的实际问题。\n\n你的专业能力：\n1. 职场沟通：向上汇报、跨部门协作、客户沟通的技巧\n2. 人际关系：处理同事关系、领导关系、职场冲突\n3. 职业发展：晋升策略、跳槽时机、职业转型\n4. 工作效率：时间管理、优先级排序、高效工作法\n5. 心态调整：职场压力管理、工作与生活平衡\n\n回答要求：\n- 结合真实职场场景给出具体可操作的建议\n- 分析问题背后的根本原因，不只是表面解决方案\n- 给出正面和反面案例帮助理解\n- 尊重用户的感受，先共情再给建议\n- 涉及法律问题（如劳动纠纷）时提醒咨询专业人士\n- 避免空洞的鸡汤，提供有实操价值的指导'
    },
    {
        id: 'general-assistant',
        name: '百事通助手',
        icon: '🌟',
        desc: '产品帮助、生活常识、闲聊陪伴',
        prompt: '你是「百事通」全能助手，是用户最贴心的AI伙伴。你不局限于职业话题，可以解答任何问题。\n\n你的能力范围：\n1. 产品引导：介绍百事通App的各项功能和使用方法\n   - 首页：热门职业推荐和行业分类浏览\n   - 职业探索：搜索1669个职业，查看详细信息、学习路径（起步期→发展期→提升期→突破期→引领期）、薪资对比\n   - AI问答：支持多个AI模型（DeepSeek、通义千问、智谱GLM、Kimi、GPT、Claude等），可选择不同智能体获得专业回答\n   - 社区：用户分享职业经验和心得（需配置LeanCloud后多人共享）\n - 常识：800条生活常识，涵盖厨房烹饪、家务收纳、健康养生、数码科技、出行交通、购物消费、社交礼仪、法律常识、理财知识、生活窍门\n   - 我的：个人中心，收藏职业、查看成就、配置AI和LeanCloud\n2. 生活常识解答：回答日常生活中的各种问题，如烹饪技巧、健康知识、数码使用、出行攻略、法律维权、理财建议等\n3. 闲聊陪伴：友好自然地与用户聊天，分享有趣的知识，讲笑话，推荐书籍电影，讨论热点话题\n4. 学习提升：解答各学科基础知识，推荐学习资源，帮助制定学习计划\n5. 情感支持：倾听用户的烦恼，给予温暖鼓励和理性建议\n\n回答要求：\n- 语气亲切自然，像朋友一样交流，不要过于正式\n- 涉及产品功能时给出具体的操作指引\n- 生活常识回答要准确实用，必要时说明原理\n- 闲聊时可以适当幽默，但不刻意\n- 如果用户问的问题你不确定，诚实说明而不是编造\n- 鼓励用户探索百事通的各项功能'
    }
];

/**
 * 调用 AI 模型（OpenAI 兼容格式）
 * @param {string} modelId - 模型标识
 * @param {Array} messages - 消息数组 [{role, content}]
 * @returns {Promise<string>} AI 回复内容
 */
export async function callAI(modelId, messages, agentId) {
    let modelConfig = AI_MODELS[modelId] || customModels[modelId];
    if (!modelConfig) {
        throw new Error('未知的AI模型: ' + modelId);
    }

    // 检查登录状态
    if (!isLoggedIn()) {
        throw new Error('请先登录后使用AI功能');
    }

    // 获取 API Key
    const apiKey = await getStoredApiKey(modelId);
    if (!apiKey) {
        throw new Error('请先在设置中配置 ' + modelConfig.name + ' 的 API Key');
    }

    // 根据智能体选择 system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (agentId) {
        const agent = AI_AGENTS.find(function(a) { return a.id === agentId; });
        if (agent) {
            systemPrompt = agent.prompt;
        }
    }
    const fullMessages = [
        { role: 'system', content: systemPrompt }
    ].concat(messages.slice(-20));

    // Claude 使用特殊格式
    if (modelConfig.customFormat === 'anthropic') {
        return callAnthropic(modelConfig, apiKey, fullMessages);
    }

    // OpenAI 兼容格式（豆包、千问、DeepSeek、GLM、Kimi、GPT、Gemini 都支持）
    return callOpenAICompatible(modelConfig, apiKey, fullMessages);
}

/**
 * OpenAI 兼容格式调用
 */
async function callOpenAICompatible(modelConfig, apiKey, messages) {
    const url = modelConfig.baseUrl + '/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: modelConfig.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(function() { return {}; });
        const errMsg = errorData.error?.message || errorData.message || 'HTTP ' + response.status;

        if (response.status === 401) {
            throw new Error('API Key 无效或已过期，请检查设置');
        }
        if (response.status === 429) {
            throw new Error('请求频率超限，请稍后再试');
        }
        if (response.status === 403) {
            throw new Error('API Key 权限不足');
        }
        throw new Error('AI 请求失败: ' + errMsg);
    }

    const data = await response.json();

    if (data.choices && data.choices[0]?.message?.content) {
        return data.choices[0].message.content;
    }

    throw new Error('AI 返回格式异常');
}

/**
 * Anthropic (Claude) 格式调用
 */
async function callAnthropic(modelConfig, apiKey, messages) {
    // Claude 的 system 消息需要单独传
    let systemPrompt = '';
    const claudeMessages = [];

    messages.forEach(function(msg) {
        if (msg.role === 'system') {
            systemPrompt = msg.content;
        } else {
            claudeMessages.push(msg);
        }
    });

    const url = modelConfig.baseUrl + '/messages';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: modelConfig.model,
            max_tokens: 2000,
            system: systemPrompt,
            messages: claudeMessages
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(function() { return {}; });
        const errMsg = errorData.error?.message || 'HTTP ' + response.status;
        throw new Error('Claude 请求失败: ' + errMsg);
    }

    const data = await response.json();

    if (data.content && data.content[0]?.text) {
        return data.content[0].text;
    }

    throw new Error('Claude 返回格式异常');
}

/**
 * 流式调用 AI 模型（SSE）
 * @param {string} modelId - 模型标识
 * @param {Array} messages - 消息数组 [{role, content}]
 * @param {Function} onChunk - 每收到一段文本时的回调 onChunk(text)
 * @returns {Promise<string>} 完整的 AI 回复内容
 */
export async function streamAI(modelId, messages, onChunk, agentId) {
    let modelConfig = AI_MODELS[modelId] || customModels[modelId];
    if (!modelConfig) {
        throw new Error('未知的AI模型: ' + modelId);
    }

    // 检查登录状态
    if (!isLoggedIn()) {
        throw new Error('请先登录后使用AI功能');
    }

    // 获取 API Key
    const apiKey = await getStoredApiKey(modelId);
    if (!apiKey) {
        throw new Error('请先在设置中配置 ' + modelConfig.name + ' 的 API Key');
    }

    // 根据智能体选择 system prompt
    let systemPrompt = SYSTEM_PROMPT;
    if (agentId) {
        const agent = AI_AGENTS.find(function(a) { return a.id === agentId; });
        if (agent) {
            systemPrompt = agent.prompt;
        }
    }
    const fullMessages = [
        { role: 'system', content: systemPrompt }
    ].concat(messages.slice(-20));

    // Claude 使用特殊格式
    if (modelConfig.customFormat === 'anthropic') {
        return streamAnthropic(modelConfig, apiKey, fullMessages, onChunk);
    }

    // OpenAI 兼容格式（豆包、千问、DeepSeek、GLM、Kimi、GPT、Gemini 都支持）
    return streamOpenAICompatible(modelConfig, apiKey, fullMessages, onChunk);
}

/**
 * OpenAI 兼容格式流式调用
 */
async function streamOpenAICompatible(modelConfig, apiKey, messages, onChunk) {
    const url = modelConfig.baseUrl + '/chat/completions';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + apiKey
        },
        body: JSON.stringify({
            model: modelConfig.model,
            messages: messages,
            temperature: 0.7,
            max_tokens: 2000,
            stream: true
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(function() { return {}; });
        const errMsg = errorData.error?.message || errorData.message || 'HTTP ' + response.status;

        if (response.status === 401) {
            throw new Error('API Key 无效或已过期，请检查设置');
        }
        if (response.status === 429) {
            throw new Error('请求频率超限，请稍后再试');
        }
        if (response.status === 403) {
            throw new Error('API Key 权限不足');
        }
        throw new Error('AI 请求失败: ' + errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留未完成的行

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line || !line.startsWith('data:')) continue;

            const data = line.slice(5).trim();
            if (data === '[DONE]') continue;

            try {
                const parsed = JSON.parse(data);
                const content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
                if (content) {
                    fullText += content;
                    onChunk(content);
                }
            } catch (e) {
                // 忽略解析失败的行
            }
        }
    }

    return fullText;
}

/**
 * Anthropic (Claude) 格式流式调用
 */
async function streamAnthropic(modelConfig, apiKey, messages, onChunk) {
    // Claude 的 system 消息需要单独传
    let systemPrompt = '';
    const claudeMessages = [];

    messages.forEach(function(msg) {
        if (msg.role === 'system') {
            systemPrompt = msg.content;
        } else {
            claudeMessages.push(msg);
        }
    });

    const url = modelConfig.baseUrl + '/messages';

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({
            model: modelConfig.model,
            max_tokens: 2000,
            system: systemPrompt,
            messages: claudeMessages,
            stream: true
        })
    });

    if (!response.ok) {
        const errorData = await response.json().catch(function() { return {}; });
        const errMsg = errorData.error?.message || 'HTTP ' + response.status;

        if (response.status === 401) {
            throw new Error('API Key 无效或已过期，请检查设置');
        }
        if (response.status === 429) {
            throw new Error('请求频率超限，请稍后再试');
        }
        if (response.status === 403) {
            throw new Error('API Key 权限不足');
        }
        throw new Error('Claude 请求失败: ' + errMsg);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    let currentEventType = '';

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // 保留未完成的行

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();

            if (line.startsWith('event:')) {
                currentEventType = line.slice(6).trim();
                continue;
            }

            if (line.startsWith('data:')) {
                const data = line.slice(5).trim();
                if (!data) continue;

                try {
                    const parsed = JSON.parse(data);

                    if (currentEventType === 'content_block_delta' && parsed.delta && parsed.delta.text) {
                        fullText += parsed.delta.text;
                        onChunk(parsed.delta.text);
                    }
                } catch (e) {
                    // 忽略解析失败的行
                }
            }
        }
    }

    return fullText;
}

/**
 * 获取所有可用模型列表（内置 + 自定义）
 */
export function getAIModels() {
    const all = Object.keys(AI_MODELS).map(function(key) {
        return AI_MODELS[key];
    });
    // 加上自定义模型
    Object.keys(customModels).forEach(function(key) {
        all.push(customModels[key]);
    });
    return all;
}

/**
 * 检查模型是否已配置 API Key
 */
export async function isModelConfigured(modelId) {
    if (!isLoggedIn()) return false;
    const key = await getStoredApiKey(modelId);
    return !!key;
}

/**
 * 获取模型配置
 */
export function getModelConfig(modelId) {
    return AI_MODELS[modelId] || customModels[modelId] || null;
}

/**
 * 获取/设置当前模型
 */
export function getCurrentModel() {
    return currentModelId;
}

export function setCurrentModel(modelId) {
    if (AI_MODELS[modelId] || customModels[modelId]) {
        currentModelId = modelId;
        try { localStorage.setItem('byt_current_model', modelId); } catch (e) {}
    }
}

// 从 localStorage 恢复模型选择
try {
    const saved = localStorage.getItem('byt_current_model');
    if (saved && (AI_MODELS[saved] || customModels[saved])) currentModelId = saved;
} catch (e) {}

// ==================== 自定义模型管理 ====================

const CUSTOM_MODEL_STORAGE = 'byt_custom_models';

/**
 * 加载自定义模型
 */
function loadCustomModels() {
    try {
        const raw = localStorage.getItem(CUSTOM_MODEL_STORAGE);
        if (raw) {
            customModels = JSON.parse(raw);
        }
    } catch (e) {
        customModels = {};
    }
}

/**
 * 保存自定义模型
 */
function saveCustomModels() {
    try {
        localStorage.setItem(CUSTOM_MODEL_STORAGE, JSON.stringify(customModels));
    } catch (e) {}
}

/**
 * 添加自定义模型
 * @param {Object} config - { id, name, baseUrl, model, icon, description }
 */
export function addCustomModel(config) {
    if (!config.id || !config.baseUrl || !config.model) {
        return { success: false, message: '请填写必要字段（名称、API地址、模型ID）' };
    }

    customModels[config.id] = {
        id: config.id,
        name: config.name || config.model,
        provider: '自定义',
        baseUrl: config.baseUrl.replace(/\/+$/, ''), // 去掉末尾斜杠
        model: config.model,
        icon: config.icon || '⚙️',
        builtin: false,
        description: config.description || '自定义模型',
        keyHint: config.keyHint || 'API Key',
        keyUrl: config.keyUrl || ''
    };

    saveCustomModels();
    return { success: true, message: '模型添加成功' };
}

/**
 * 更新自定义模型
 */
export function updateCustomModel(config) {
    if (!customModels[config.id]) {
        return { success: false, message: '模型不存在' };
    }
    return addCustomModel(config);
}

/**
 * 删除自定义模型
 */
export function deleteCustomModel(modelId) {
    if (!customModels[modelId]) return;
    delete customModels[modelId];
    saveCustomModels();

    // 如果删除的是当前使用的模型，切换到默认
    if (currentModelId === modelId) {
        setCurrentModel('deepseek');
    }
}

// 加载自定义模型
loadCustomModels();

/**
 * 将 markdown 转换为安全的 HTML
 */
export function renderMarkdown(text) {
    if (typeof text !== 'string') return '';

    const safe = sanitize(text);
    let html = safe;

    // 代码块
    html = html.replace(/```([\s\S]*?)```/g, function(_match, code) {
        return '<pre style="background:var(--bg-tertiary);padding:12px;border-radius:8px;overflow-x:auto;font-size:13px;margin:8px 0;"><code>' + code.trim() + '</code></pre>';
    });

    // 行内代码
    html = html.replace(/`([^`]+)`/g, '<code style="background:var(--bg-tertiary);padding:2px 6px;border-radius:4px;font-size:13px;">$1</code>');

    // 标题
    html = html.replace(/^### (.+)$/gm, '<strong style="font-size:15px;display:block;margin:12px 0 6px;">$1</strong>');
    html = html.replace(/^## (.+)$/gm, '<strong style="font-size:16px;display:block;margin:14px 0 8px;">$1</strong>');
    html = html.replace(/^# (.+)$/gm, '<strong style="font-size:18px;display:block;margin:16px 0 8px;">$1</strong>');

    // 粗体
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');

    // 无序列表
    html = html.replace(/^[\*\-] (.+)$/gm, '<span style="display:block;padding-left:16px;position:relative;margin:2px 0;"><span style="position:absolute;left:4px;">•</span>$1</span>');

    // 有序列表
    html = html.replace(/^\d+\. (.+)$/gm, '<span style="display:block;padding-left:20px;position:relative;margin:2px 0;">$1</span>');

    // 换行
    html = html.replace(/\n\n/g, '<br><br>');
    html = html.replace(/\n/g, '<br>');

    return html;
}

// ==================== 暴露到全局 ====================
window.AI_MODELS = AI_MODELS;
window.callAI = callAI;
window.streamAI = streamAI;
window.getAIModels = getAIModels;
window.isModelConfigured = isModelConfigured;
window.getModelConfig = getModelConfig;
window.renderMarkdown = renderMarkdown;
window.getCurrentModel = getCurrentModel;
window.setCurrentModel = setCurrentModel;
window.addCustomModel = addCustomModel;
window.updateCustomModel = updateCustomModel;
window.deleteCustomModel = deleteCustomModel;

export { AI_MODELS, AI_AGENTS, SYSTEM_PROMPT };
