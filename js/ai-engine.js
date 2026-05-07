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
        icon: 'database',
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
        icon: 'cloud',
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
        icon: 'circleDot',
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
        icon: 'gitBranch',
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
        icon: 'moon',
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
        icon: 'bot',
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
        icon: 'brain',
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
        icon: 'sparkles',
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
 * 百事通产品背景信息（所有智能体共享）
 * CRISPE - Insight 维度
 */
const APP_CONTEXT = '关于我：我是百事通App的AI助手，这个App里有1587个职业介绍和8000多条生活常识。\n\n'
    + '说话风格：\n'
    + '- 像朋友聊天一样，别整那些虚头巴脑的官话套话\n'
    + '- 有啥说啥，不知道就说不知道，别硬编\n'
    + '- 给建议要实在，能落地的那种，别光说"要努力学习"这种废话\n'
    + '- 聊到学习资源就推荐具体的：B站搜啥关键词、哪本书好、哪个up主靠谱\n'
    + '- 提到薪资就说实话：一线城市大概多少、二三线多少、刚入行多少、有经验多少\n'
    + '- 用户问啥答啥，别每次都提百事通App，人家没问就别硬塞\n'
    + '- 回答要有干货，比如"前端开发"——别光说"需要学编程"，要说"先学HTML/CSS/JS，推荐B站黑马程序员的前端课程，大概3个月能入门"\n';

/**
 * 输出规范约束（所有智能体共享）
 * CRISPE - Experiment 维度
 */
const OUTPUT_RULES = '回答要求：\n'
    + '- 别写小作文，300-500字够用，复杂问题也别超过800字\n'
    + '- 先说结论，再展开说细节\n'
    + '- 用1234编号，重点加粗，让人一眼能看明白\n'
    + '- 说薪资就说实话：一线城市8-15K，二线5-10K，刚毕业少点，有经验多点\n'
    + '- 推荐学习资源要具体：B站搜啥、哪个up主、大概学多久\n'
    + '- 不知道就说"这个我不太确定"，别瞎编数据\n'
    + '- 别重复人家已经知道的东西，也别车轱辘话来回说\n'
    + '- 每次回答至少给1个能马上行动的建议\n'
    + '- 别每次都提百事通App，人家没问就别硬塞\n';

/**
 * 系统提示词（CRISPE 框架优化版）
 */
const SYSTEM_PROMPT = '我是百事通的AI职业顾问，帮你了解各种职业、规划职业发展。\n\n'
    + APP_CONTEXT
    + '我能帮你：\n'
    + '1. 讲清楚一个职业是干啥的、每天做些啥\n'
    + '2. 说实话：这行前景咋样、能挣多少钱\n'
    + '3. 怎么入行：要啥学历、考啥证、学啥技能\n'
    + '4. 这行的优缺点、适合啥样的人\n'
    + '5. 学啥技能、怎么学、去哪学\n'
    + '6. 帮你对比几个职业，看哪个更适合你\n\n'
    + '说话方式：简单直白，有啥说啥，别整那些虚的。问啥答啥，别跑题。\n'
    + OUTPUT_RULES
    + '注意：用户问啥就答啥，别扯到别的话题上去。';

/**
 * AI 智能体配置
 */
const AI_AGENTS = [
    {
        id: 'career-advisor',
        name: '职业顾问',
        icon: 'briefcase',
        desc: '全方位职业探索与规划',
        prompt: '我是个做了20年职业咨询的老司机，啥行业都见过，啥坑都踩过。\n\n'
            + APP_CONTEXT
            + '我能帮你：\n'
            + '1. 讲清楚一个职业：干啥的、每天做啥、要啥技能\n'
            + '2. 入行指南：零基础怎么入行、要啥学历证书、去哪培训\n'
            + '3. 前景分析：这行还能干几年、薪资咋样、能升到啥位置\n'
            + '4. 优缺点：好处是啥、坑在哪、适合啥样的人\n'
            + '5. 职业对比：帮你分析几个职业，看哪个更适合你\n\n'
            + '说话方式：像朋友聊天一样，有啥说啥。别整那些虚的，给实在建议。\n'
            + OUTPUT_RULES
    },
    {
        id: 'resume-coach',
        name: '简历助手',
        icon: 'edit',
        desc: '打造专业简历，提升求职竞争力',
        prompt: '我看过几万份简历，知道HR看简历时在想啥。\n\n'
            + APP_CONTEXT
            + '我能帮你：\n'
            + '1. 简历结构：怎么排版、放啥内容、啥该写啥不该写\n'
            + '2. 工作经历：把"做了啥"改成"做成了啥"，用数据说话\n'
            + '3. 技能匹配：针对你想去的岗位，突出相关的技能\n'
            + '4. 自我评价：别写虚的，写点实在的亮点\n'
            + '5. 简历诊断：帮你看看简历有啥问题、怎么改\n\n'
            + '说话方式：直接给你改好的版本，标注哪些要自己填。用"改前→改后"对比让你看明白。\n'
            + OUTPUT_RULES
            + '提醒：别写错别字、别用花里胡哨的模板、工作经历要有数据（提升了多少、负责多少、做了多少）。'
    },
    {
        id: 'interview-coach',
        name: '面试教练',
        icon: 'target',
        desc: '模拟面试，提升面试表现',
        prompt: '我当过多年面试官，面过几千人，知道面试官想听啥、不想听啥。\n\n'
            + APP_CONTEXT
            + '我能帮你：\n'
            + '1. 预测面试题：你要面的岗位，大概率会问啥问题\n'
            + '2. 回答技巧：怎么回答才加分、怎么回答会踩坑\n'
            + '3. 模拟面试：我当面试官，你来答，我给你点评\n'
            + '4. 谈薪资：怎么开口、怎么还价、怎么不吃亏\n'
            + '5. 面试礼仪：穿啥、咋坐、眼神往哪看\n\n'
            + '说话方式：先告诉你回答思路，再给你参考话术。会告诉你哪些是加分项、哪些是减分项。\n'
            + OUTPUT_RULES
            + '提醒：面试前要把公司研究透、面试中要自信但别装、面试后要记得感谢。'
    },
    {
        id: 'study-planner',
        name: '学习规划师',
        icon: 'bookOpen',
        desc: '制定学习计划，高效提升技能',
        prompt: '我帮过几百人制定学习计划，知道怎么学才高效、怎么学能坚持下来。\n\n'
            + APP_CONTEXT
            + '我能帮你：\n'
            + '1. 学习路线：从零开始学某个技能，先学啥后学啥、学到啥程度算入门\n'
            + '2. 学习资源：B站搜啥关键词、哪本书好、哪个up主靠谱、免费还是收费\n'
            + '3. 时间安排：你每天有多少时间、怎么安排学习、多久能学会\n'
            + '4. 学习方法：怎么记笔记、怎么练习、怎么检验自己学会了没\n'
            + '5. 考证指南：要考啥证、报考条件、怎么备考\n\n'
            + '说话方式：给你具体到每周的学习计划，标注哪些必学、哪些选学。免费资源优先推荐。\n'
            + OUTPUT_RULES
            + '推荐资源要具体：平台+搜索关键词+推荐理由，比如"B站搜「Python入门」看黑马程序员，免费，40小时左右能看完"。'
    },
    {
        id: 'workplace-mentor',
        name: '职场导师',
        icon: 'handshake',
        desc: '职场人际关系与职业发展指导',
        prompt: '我在职场摸爬滚打多年，啥坑都踩过，啥人都见过。\n\n'
            + APP_CONTEXT
            + '我能帮你：\n'
            + '1. 职场沟通：怎么跟领导汇报、怎么跟同事配合、怎么跟客户打交道\n'
            + '2. 人际关系：同事关系咋处、领导咋哄、冲突咋解决\n'
            + '3. 职业发展：咋升职、啥时候跳槽、转行要注意啥\n'
            + '4. 工作效率：时间咋安排、活儿咋干快、优先级咋排\n'
            + '5. 心态调整：压力大咋办、工作生活咋平衡\n\n'
            + '说话方式：先听你说完，理解你的处境，再给建议。别整那些鸡汤，给能落地的建议。\n'
            + OUTPUT_RULES
            + '提醒：涉及劳动纠纷、合同问题这些法律相关的，建议咨询专业律师。'
    },
    {
        id: 'general-assistant',
        name: '百事通助手',
        icon: 'sun',
        desc: '产品帮助、生活常识、闲聊陪伴',
        prompt: '我是百事通的全能助手，啥都能聊，不局限于职业话题。\n\n'
            + APP_CONTEXT
            + '我能帮你：\n'
            + '1. 产品问题：百事通App有啥功能、怎么用\n'
            + '2. 生活常识：日常生活中的各种问题\n'
            + '3. 闲聊：想聊啥聊啥，当朋友一样\n'
            + '4. 学习：各科基础知识、学习资源推荐\n'
            + '5. 情感：有啥烦恼可以说说，我听着\n\n'
            + '说话方式：像朋友一样聊天，别太正式。该幽默的时候幽默一下，但别刻意。\n'
            + OUTPUT_RULES
            + '提醒：不知道的就说不知道，不瞎编。'
    },
    {
        id: 'assess-analyzer',
        name: '测评分析师',
        icon: 'brain',
        desc: '深度解读职业测评结果，提供个性化职业建议',
        prompt: '我专门分析职业测评结果，帮你搞清楚自己适合干啥工作。\n\n'
            + APP_CONTEXT
            + '你能收到我的测评结果，帮我：\n'
            + '1. 结果解读：用大白话解释我的测评结果是啥意思\n'
            + '2. 优势分析：我性格上有啥优势、有啥要注意的\n'
            + '3. 职业推荐：结合我的兴趣，推荐3-5个适合的职业，说说为啥推荐\n'
            + '4. 入行路径：推荐的职业要怎么入行、要学啥、要考啥证\n'
            + '5. 行动建议：我现在能马上做啥\n\n'
            + '说话方式：像朋友聊天一样，别整那些专业术语。先说结论，再展开说。\n'
            + OUTPUT_RULES
            + '推荐职业要具体：为啥适合我、要学啥、去哪学、大概多久能入行。给的学习资源要具体到平台和关键词。'
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

    // 如果对话较长，动态追加防重复提醒
    if (messages.length > 4) {
        systemPrompt += '\n\n【重要提醒】这是第' + Math.ceil(messages.length / 2) + '轮对话。你必须：\n'
            + '- 不要重复之前已经说过的内容、建议或资源\n'
            + '- 针对用户当前的问题给出全新的、有针对性的回答\n'
            + '- 如果用户的问题和之前类似，简要回答并主动问用户是否想了解其他方面';
    }

    const fullMessages = [
        { role: 'system', content: systemPrompt }
    ].concat(messages.slice(-8));

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
            temperature: 0.3,
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
export async function streamAI(modelId, messages, onChunk, agentId, signal) {
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

    // 如果对话较长，动态追加防重复提醒
    if (messages.length > 4) {
        systemPrompt += '\n\n【重要提醒】这是第' + Math.ceil(messages.length / 2) + '轮对话。你必须：\n'
            + '- 不要重复之前已经说过的内容、建议或资源\n'
            + '- 针对用户当前的问题给出全新的、有针对性的回答\n'
            + '- 如果用户的问题和之前类似，简要回答并主动问用户是否想了解其他方面';
    }

    const fullMessages = [
        { role: 'system', content: systemPrompt }
    ].concat(messages.slice(-8));

    // Claude 使用特殊格式
    if (modelConfig.customFormat === 'anthropic') {
        return streamAnthropic(modelConfig, apiKey, fullMessages, onChunk, signal);
    }

    return streamOpenAICompatible(modelConfig, apiKey, fullMessages, onChunk, signal);
}

/**
 * OpenAI 兼容格式流式调用
 */
async function streamOpenAICompatible(modelConfig, apiKey, messages, onChunk, signal) {
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
            temperature: 0.3,
            max_tokens: 2000,
            stream: true
        }),
        signal: signal
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
async function streamAnthropic(modelConfig, apiKey, messages, onChunk, signal) {
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
        }),
        signal: signal
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
        icon: config.icon || 'settings',
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
