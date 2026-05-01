// ==================== assessment.js - 职业测评页面 ====================
// 百事通 v2.0 - 基于霍兰德职业兴趣理论的职业测评
// 支持120题题库，随机抽30题，联动1669个职业数据库
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl, showToast } from '../utils/ui.js';
import { navigateTo } from '../router.js';
import { addPoints } from '../state.js';
import { icon } from '../utils/icons.js';

// ==================== 内置回退题目（10题） ====================
// 当 JSON 加载失败时使用

const FALLBACK_QUESTIONS = [
    {
        id: 1,
        title: '你更喜欢哪种类型的活动？',
        options: [
            { text: '动手修理或制作东西', scores: { R: 3, I: 0, A: 0, S: 0, E: 0, C: 1 } },
            { text: '阅读研究感兴趣的课题', scores: { R: 0, I: 3, A: 0, S: 1, E: 0, C: 0 } },
            { text: '绘画、写作或音乐创作', scores: { R: 0, I: 1, A: 3, S: 0, E: 0, C: 0 } },
            { text: '帮助别人解决问题', scores: { R: 0, I: 0, A: 0, S: 3, E: 1, C: 0 } }
        ]
    },
    {
        id: 2,
        title: '你理想的工作环境是？',
        options: [
            { text: '户外或车间，动手操作', scores: { R: 3, I: 0, A: 0, S: 0, E: 0, C: 0 } },
            { text: '实验室或图书馆，安静研究', scores: { R: 0, I: 3, A: 1, S: 0, E: 0, C: 0 } },
            { text: '创意工作室或舞台', scores: { R: 0, I: 0, A: 3, S: 0, E: 0, C: 0 } },
            { text: '办公室或学校，与人交流', scores: { R: 0, I: 0, A: 0, S: 2, E: 1, C: 1 } }
        ]
    },
    {
        id: 3,
        title: '在团队合作中，你通常扮演什么角色？',
        options: [
            { text: '执行者，负责具体实施', scores: { R: 2, I: 0, A: 0, S: 0, E: 0, C: 2 } },
            { text: '分析师，研究问题和方案', scores: { R: 0, I: 3, A: 0, S: 0, E: 0, C: 1 } },
            { text: '创意者，提出新想法', scores: { R: 0, I: 1, A: 3, S: 0, E: 0, C: 0 } },
            { text: '协调者，组织大家合作', scores: { R: 0, I: 0, A: 0, S: 2, E: 2, C: 0 } }
        ]
    },
    {
        id: 4,
        title: '遇到问题时，你倾向于？',
        options: [
            { text: '直接动手尝试解决', scores: { R: 3, I: 1, A: 0, S: 0, E: 0, C: 0 } },
            { text: '先查阅资料深入研究', scores: { R: 0, I: 3, A: 0, S: 0, E: 0, C: 1 } },
            { text: '从不同角度思考创意方案', scores: { R: 0, I: 1, A: 3, S: 0, E: 0, C: 0 } },
            { text: '找人商量，集思广益', scores: { R: 0, I: 0, A: 0, S: 3, E: 1, C: 0 } }
        ]
    },
    {
        id: 5,
        title: '空闲时间你最喜欢做什么？',
        options: [
            { text: '运动、健身或户外探险', scores: { R: 3, I: 0, A: 0, S: 0, E: 0, C: 0 } },
            { text: '看纪录片或科普文章', scores: { R: 0, I: 3, A: 0, S: 0, E: 0, C: 0 } },
            { text: '看电影、展览或听音乐会', scores: { R: 0, I: 0, A: 3, S: 0, E: 0, C: 0 } },
            { text: '和朋友聚会或做志愿者', scores: { R: 0, I: 0, A: 0, S: 3, E: 1, C: 0 } }
        ]
    },
    {
        id: 6,
        title: '你最看重工作中的什么？',
        options: [
            { text: '稳定的收入和福利', scores: { R: 1, I: 0, A: 0, S: 0, E: 0, C: 3 } },
            { text: '不断学习和成长的机会', scores: { R: 0, I: 3, A: 0, S: 1, E: 0, C: 0 } },
            { text: '自由发挥创造力的空间', scores: { R: 0, I: 0, A: 3, S: 0, E: 0, C: 0 } },
            { text: '帮助他人、服务社会', scores: { R: 0, I: 0, A: 0, S: 3, E: 1, C: 0 } }
        ]
    },
    {
        id: 7,
        title: '你更擅长哪种沟通方式？',
        options: [
            { text: '用行动和成果说话', scores: { R: 2, I: 0, A: 0, S: 0, E: 1, C: 0 } },
            { text: '用数据和逻辑说服人', scores: { R: 0, I: 2, A: 0, S: 0, E: 1, C: 1 } },
            { text: '用故事和情感打动人', scores: { R: 0, I: 0, A: 3, S: 1, E: 0, C: 0 } },
            { text: '耐心倾听并给予建议', scores: { R: 0, I: 0, A: 0, S: 3, E: 0, C: 1 } }
        ]
    },
    {
        id: 8,
        title: '面对压力和挑战时，你会？',
        options: [
            { text: '迎难而上，直接行动', scores: { R: 2, I: 0, A: 0, S: 0, E: 2, C: 0 } },
            { text: '冷静分析，制定计划', scores: { R: 0, I: 2, A: 0, S: 0, E: 0, C: 2 } },
            { text: '寻找创意解决方案', scores: { R: 0, I: 1, A: 3, S: 0, E: 0, C: 0 } },
            { text: '寻求他人支持和帮助', scores: { R: 0, I: 0, A: 0, S: 3, E: 0, C: 0 } }
        ]
    },
    {
        id: 9,
        title: '你更喜欢哪种学习方式？',
        options: [
            { text: '动手实践，边做边学', scores: { R: 3, I: 1, A: 0, S: 0, E: 0, C: 0 } },
            { text: '阅读书籍和在线课程', scores: { R: 0, I: 3, A: 0, S: 0, E: 0, C: 1 } },
            { text: '观看视频教程或参加讲座', scores: { R: 0, I: 1, A: 2, S: 0, E: 0, C: 0 } },
            { text: '参加小组讨论或培训班', scores: { R: 0, I: 0, A: 0, S: 3, E: 1, C: 0 } }
        ]
    },
    {
        id: 10,
        title: '你的长远职业目标是？',
        options: [
            { text: '成为某个领域的专家', scores: { R: 1, I: 3, A: 0, S: 0, E: 0, C: 1 } },
            { text: '创办自己的公司或品牌', scores: { R: 0, I: 0, A: 1, S: 0, E: 3, C: 0 } },
            { text: '创作出有影响力的作品', scores: { R: 0, I: 1, A: 3, S: 0, E: 0, C: 0 } },
            { text: '成为受人尊敬的专业人士', scores: { R: 0, I: 1, A: 0, S: 2, E: 1, C: 1 } }
        ]
    }
];

// ==================== RIASEC 类型定义 ====================

const RIASEC_TYPES = {
    R: {
        name: '实用技术型',
        icon: 'wrench',
        color: '#EF4444',
        desc: '你喜欢动手操作，擅长使用工具和机械',
        industries: ['manufacturing', 'agriculture'],
        careers: ['机械工程师', '电工', '焊工', '汽车维修技师', '厨师', '建筑工人', '飞行员', '农民'],
        advice: '你适合需要动手能力和技术操作的职业。推荐方向：工程技术、生产制造、农业技术、交通运输等。'
    },
    I: {
        name: '研究分析型',
        icon: 'flask',
        color: '#3B82F6',
        desc: '你喜欢思考和研究，善于分析和解决复杂问题',
        industries: ['professional'],
        careers: ['软件工程师', '数据分析师', '科研人员', '医生', '药剂师', '大学教授', '心理咨询师'],
        advice: '你适合需要深度思考和专业知识的工作。推荐方向：科学研究、技术开发、医疗健康、数据分析等。'
    },
    A: {
        name: '创意艺术型',
        icon: 'palette',
        color: '#A855F7',
        desc: '你有丰富的想象力和创造力，追求自我表达',
        industries: ['professional'],
        careers: ['UI设计师', '平面设计师', '作家', '记者', '摄影师', '音乐家', '演员', '建筑师'],
        advice: '你适合需要创造力和审美能力的工作。推荐方向：设计创意、媒体传播、文学艺术、影视娱乐等。'
    },
    S: {
        name: '社会服务型',
        icon: 'handshake',
        color: '#10B981',
        desc: '你善于与人交往，乐于帮助和服务他人',
        industries: ['service', 'leader'],
        careers: ['教师', '护士', '社工', '心理咨询师', '人力资源专员', '社区工作者', '客服经理'],
        advice: '你适合需要人际沟通和关怀他人的工作。推荐方向：教育培训、医疗护理、社会服务、人力资源等。'
    },
    E: {
        name: '经营管理型',
        icon: 'briefcase',
        color: '#F59E0B',
        desc: '你有领导力和影响力，善于组织和决策',
        industries: ['leader', 'professional'],
        careers: ['企业管理者', '销售经理', '律师', '房地产经纪人', '创业者', '市场总监', '公务员'],
        advice: '你适合需要领导力和商业头脑的工作。推荐方向：企业管理、市场营销、法律金融、创业创新等。'
    },
    C: {
        name: '规范事务型',
        icon: 'clipboardList',
        color: '#64748B',
        desc: '你做事有条理，注重细节和准确性',
        industries: ['clerk', 'professional'],
        careers: ['会计', '审计师', '行政专员', '银行柜员', '档案管理员', '质检员', '税务师'],
        advice: '你适合需要严谨细致和规范操作的工作。推荐方向：财务会计、行政管理、质量控制、法律事务等。'
    }
};

// ==================== 页面状态 ====================

let currentQuestion = 0;
let answers = [];
let scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };
let activeQuestions = [];  // 当前测评使用的题目（从题库中抽取的）
let jobRiasecMap = null;   // 职业-RIASEC映射数据
let useExtendedBank = false; // 是否使用了扩展题库

// ==================== 数据加载 ====================

/**
 * 从JSON加载扩展题库
 * @returns {Promise<Array|null>}
 */
async function loadExtendedQuestions() {
    try {
        const resp = await fetch('js/data/assessment_questions.json');
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && data.questions && data.questions.length > 0) {
            return data.questions;
        }
        return null;
    } catch (e) {
        console.warn('[Assessment] 扩展题库加载失败，使用内置题目:', e);
        return null;
    }
}

/**
 * 从JSON加载职业-RIASEC映射
 * @returns {Promise<Object|null>}
 */
async function loadJobRiasecMap() {
    try {
        const resp = await fetch('js/data/job_riasec_map.json');
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && data.mapping) {
            return data.mapping;
        }
        return null;
    } catch (e) {
        console.warn('[Assessment] 职业映射加载失败:', e);
        return null;
    }
}

/**
 * Fisher-Yates 洗牌算法
 * @param {Array} arr
 * @returns {Array}
 */
function shuffleArray(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var tmp = a[i];
        a[i] = a[j];
        a[j] = tmp;
    }
    return a;
}

/**
 * 从题库中随机抽取指定数量的题目
 * 确保覆盖多种维度（interest/activity/skill/value）
 * @param {Array} allQuestions
 * @param {number} count
 * @returns {Array}
 */
function selectQuestions(allQuestions, count) {
    // 按维度分组
    var byDimension = {};
    allQuestions.forEach(function(q) {
        var dim = q.dimension || 'interest';
        if (!byDimension[dim]) byDimension[dim] = [];
        byDimension[dim].push(q);
    });

    var selected = [];
    var dimensions = Object.keys(byDimension);

    // 每个维度至少抽取一定数量，确保多样性
    var perDim = Math.floor(count / dimensions.length);
    var remainder = count - perDim * dimensions.length;

    dimensions.forEach(function(dim, idx) {
        var pool = shuffleArray(byDimension[dim]);
        var take = perDim + (idx < remainder ? 1 : 0);
        selected = selected.concat(pool.slice(0, take));
    });

    // 如果还不够（某些维度题目不足），从剩余题目中补充
    if (selected.length < count) {
        var selectedIds = {};
        selected.forEach(function(q) { selectedIds[q.id] = true; });
        var remaining = allQuestions.filter(function(q) { return !selectedIds[q.id]; });
        remaining = shuffleArray(remaining);
        selected = selected.concat(remaining.slice(0, count - selected.length));
    }

    // 最终打乱顺序
    return shuffleArray(selected).slice(0, count);
}

/**
 * 根据RIASEC得分匹配推荐职业
 * @param {Object} resultScores - { R: n, I: n, A: n, S: n, E: n, C: n }
 * @param {Object} mapping - job_riasec_map
 * @returns {Array} 排序后的推荐职业列表
 */
function matchJobs(resultScores, mapping) {
    if (!mapping) return [];

    // 计算用户各维度百分比
    var total = 0;
    Object.keys(resultScores).forEach(function(k) { total += resultScores[k]; });
    if (total === 0) return [];

    var userPct = {};
    Object.keys(resultScores).forEach(function(k) {
        userPct[k] = resultScores[k] / total;
    });

    // 对每个职业计算匹配度
    var jobMatches = [];
    Object.keys(mapping).forEach(function(jobId) {
        var job = mapping[jobId];
        var primary = job.primary;
        var secondary = job.secondary;

        // 匹配度 = 主要类型权重 * 用户该类型百分比 + 次要类型权重 * 用户该类型百分比
        var matchScore = userPct[primary] * 0.6 + userPct[secondary] * 0.3;

        // 如果用户的top2类型与职业的primary/secondary匹配，额外加分
        var sortedUser = Object.keys(userPct).sort(function(a, b) {
            return userPct[b] - userPct[a];
        });
        if (sortedUser[0] === primary) matchScore += 0.05;
        if (sortedUser[1] === secondary) matchScore += 0.03;

        jobMatches.push({
            id: jobId,
            name: job.name || jobId,
            primary: primary,
            secondary: secondary,
            matchScore: Math.min(0.99, matchScore)
        });
    });

    // 按匹配度降序排列
    jobMatches.sort(function(a, b) {
        return b.matchScore - a.matchScore;
    });

    return jobMatches;
}

// ==================== 初始化 ====================

/**
 * 初始化测评页面
 */
export async function initAssessment() {
    const container = document.getElementById('page-assessment');
    if (!container) return;

    clearContainer(container);
    currentQuestion = 0;
    answers = [];
    scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

    // 尝试加载扩展题库和职业映射
    var extendedQuestions = await loadExtendedQuestions();
    jobRiasecMap = await loadJobRiasecMap();

    if (extendedQuestions && extendedQuestions.length >= 30) {
        useExtendedBank = true;
        activeQuestions = selectQuestions(extendedQuestions, 30);
    } else {
        useExtendedBank = false;
        activeQuestions = FALLBACK_QUESTIONS.slice();
    }

    renderStartPage(container);
}

window.initAssessment = initAssessment;

// ==================== 开始页面 ====================

function renderStartPage(container) {
    const page = createEl('div', 'assess-start');

    const iconEl = createEl('div', 'assess-start-icon');
    iconEl.appendChild(icon('puzzle', 48, 'var(--accent)'));
    page.appendChild(iconEl);

    const title = createEl('h2', 'assess-start-title');
    title.textContent = '职业兴趣测评';
    page.appendChild(title);

    const desc = createEl('p', 'assess-start-desc');
    if (useExtendedBank) {
        desc.textContent = '基于霍兰德职业兴趣理论，从 120 道专业题库中随机抽取 30 题，智能匹配 1600+ 职业方向';
    } else {
        desc.textContent = '基于霍兰德职业兴趣理论，通过精选题目，发现最适合你的职业方向';
    }
    page.appendChild(desc);

    const features = createEl('div', 'assess-features');

    var featureItems;
    if (useExtendedBank) {
        featureItems = [
            { icon: 'timer', text: '约 5 分钟完成' },
            { icon: 'target', text: '30 / 120 随机题目' },
            { icon: 'barChart3', text: '1600+ 职业智能匹配' }
        ];
    } else {
        featureItems = [
            { icon: 'timer', text: '约 2 分钟完成' },
            { icon: 'target', text: '10 道精选题目' },
            { icon: 'barChart3', text: '个性化职业推荐' }
        ];
    }

    featureItems.forEach(function(f) {
        const item = createEl('div', 'assess-feature');
        const fi = createEl('span', '');
        fi.appendChild(icon(f.icon, 16));
        const ft = createEl('span', '');
        ft.textContent = f.text;
        item.appendChild(fi);
        item.appendChild(ft);
        features.appendChild(item);
    });

    page.appendChild(features);

    const btn = createEl('button', 'assess-start-btn');
    btn.textContent = '开始测评 \u2192';
    btn.addEventListener('click', function() {
        renderQuestionPage(container);
    });
    page.appendChild(btn);

    // 历史结果
    const savedResult = getSavedResult();
    if (savedResult) {
        const historyLink = createEl('div', 'assess-history');
        historyLink.textContent = '';
        historyLink.appendChild(icon('clipboardList', 14));
        historyLink.appendChild(document.createTextNode(' 查看上次测评结果'));
        historyLink.addEventListener('click', function() {
            renderResultPage(container, savedResult);
        });
        page.appendChild(historyLink);
    }

    container.appendChild(page);
}

// ==================== 答题页面 ====================

function renderQuestionPage(container) {
    const page = createEl('div', 'assess-question-page');

    // 进度条
    const progress = createEl('div', 'assess-progress');
    const bar = createEl('div', 'assess-progress-bar');
    const percent = Math.round(((currentQuestion) / activeQuestions.length) * 100);
    bar.style.width = percent + '%';
    const label = createEl('div', 'assess-progress-label');
    label.textContent = (currentQuestion + 1) + ' / ' + activeQuestions.length;
    progress.appendChild(bar);
    progress.appendChild(label);
    page.appendChild(progress);

    // 题目
    const q = activeQuestions[currentQuestion];

    const qTitle = createEl('h3', 'assess-q-title');
    qTitle.textContent = q.text || q.title;
    page.appendChild(qTitle);

    // 选项
    const optionsList = createEl('div', 'assess-options');

    q.options.forEach(function(opt, idx) {
        const option = createEl('div', 'assess-option');

        const radio = createEl('div', 'assess-radio');
        radio.textContent = String.fromCharCode(65 + idx); // A B C D

        const text = createEl('div', 'assess-option-text');
        text.textContent = opt.text;

        option.appendChild(radio);
        option.appendChild(text);

        option.addEventListener('click', function() {
            // 高亮选中
            var allOpts = optionsList.querySelectorAll('.assess-option');
            allOpts.forEach(function(o) { o.classList.remove('selected'); });
            option.classList.add('selected');

            // 记录答案
            answers[currentQuestion] = idx;
            Object.keys(opt.scores).forEach(function(key) {
                scores[key] += opt.scores[key];
            });

            // 延迟跳转下一题
            setTimeout(function() {
                currentQuestion++;
                if (currentQuestion < activeQuestions.length) {
                    clearContainer(container);
                    renderQuestionPage(container);
                } else {
                    // 计算结果
                    addPoints('exploreJob');
                    const result = calculateResult();
                    saveResult(result);
                    clearContainer(container);
                    renderResultPage(container, result);
                }
            }, 400);
        });

        optionsList.appendChild(option);
    });

    page.appendChild(optionsList);

    // 返回按钮
    const backBtn = createEl('div', 'assess-back');
    backBtn.textContent = '\u2190 返回';
    backBtn.addEventListener('click', function() {
        if (currentQuestion > 0) {
            // 回退上一题
            var prevQ = activeQuestions[currentQuestion - 1];
            var prevScores = prevQ.options[answers[currentQuestion - 1]].scores;
            Object.keys(prevScores).forEach(function(key) {
                scores[key] -= prevScores[key];
            });
            answers.pop();
            currentQuestion--;
            clearContainer(container);
            renderQuestionPage(container);
        } else {
            clearContainer(container);
            renderStartPage(container);
        }
    });
    page.appendChild(backBtn);

    container.appendChild(page);
}

// ==================== 结果计算 ====================

function calculateResult() {
    // 排序
    var sorted = Object.keys(scores).sort(function(a, b) {
        return scores[b] - scores[a];
    });

    var primary = sorted[0];
    var secondary = sorted[1];

    // 计算百分比
    var total = 0;
    Object.keys(scores).forEach(function(k) { total += scores[k]; });

    var result = {
        primary: primary,
        secondary: secondary,
        scores: Object.assign({}, scores),
        percentages: {},
        timestamp: Date.now(),
        questionCount: activeQuestions.length,
        useExtendedBank: useExtendedBank
    };

    Object.keys(scores).forEach(function(k) {
        result.percentages[k] = total > 0 ? Math.round((scores[k] / total) * 100) : 0;
    });

    // 如果有职业映射数据，匹配推荐职业
    if (jobRiasecMap) {
        result.recommendedJobs = matchJobs(scores, jobRiasecMap).slice(0, 20);
    }

    return result;
}

// ==================== 结果页面 ====================

function renderResultPage(container, result) {
    var primary = RIASEC_TYPES[result.primary];
    var secondary = RIASEC_TYPES[result.secondary];

    var page = createEl('div', 'assess-result');

    // 标题
    var header = createEl('div', 'assess-result-header');
    var hIcon = createEl('div', 'assess-result-icon');
    hIcon.appendChild(icon('barChart3', 20));
    header.appendChild(hIcon);

    var hTitle = createEl('h2', 'assess-result-title');
    hTitle.textContent = '你的测评结果';
    header.appendChild(hTitle);

    var hDesc = createEl('p', 'assess-result-desc');
    hDesc.textContent = '基于霍兰德职业兴趣理论分析';
    header.appendChild(hDesc);
    page.appendChild(header);

    // 主要类型
    var primaryCard = createEl('div', 'assess-type-card primary');

    var typeBadge = createEl('div', 'assess-type-badge');
    typeBadge.style.background = primary.color + '20';
    typeBadge.style.color = primary.color;
    typeBadge.textContent = '';
    typeBadge.appendChild(icon(primary.icon, 16, primary.color));
    typeBadge.appendChild(document.createTextNode(' ' + primary.name));
    primaryCard.appendChild(typeBadge);

    var typeDesc = createEl('p', 'assess-type-desc');
    typeDesc.textContent = primary.desc;
    primaryCard.appendChild(typeDesc);

    var typeAdvice = createEl('div', 'assess-type-advice');
    typeAdvice.textContent = primary.advice;
    primaryCard.appendChild(typeAdvice);

    page.appendChild(primaryCard);

    // 六维雷达图（用 CSS 模拟）
    var chart = createEl('div', 'assess-chart');

    var chartTitle = createEl('h3', 'assess-chart-title');
    chartTitle.textContent = '兴趣维度分布';
    chart.appendChild(chartTitle);

    var barChart = createEl('div', 'assess-bar-chart');

    var sortedKeys = Object.keys(result.percentages).sort(function(a, b) {
        return result.percentages[b] - result.percentages[a];
    });

    sortedKeys.forEach(function(key) {
        var type = RIASEC_TYPES[key];
        var pct = result.percentages[key];

        var row = createEl('div', 'assess-bar-row');

        var label = createEl('div', 'assess-bar-label');
        label.textContent = '';
        label.appendChild(icon(type.icon, 14, type.color));
        label.appendChild(document.createTextNode(' ' + type.name));

        var barWrap = createEl('div', 'assess-bar-wrap');
        var barFill = createEl('div', 'assess-bar-fill');
        barFill.style.width = pct + '%';
        barFill.style.background = type.color;

        var pctLabel = createEl('div', 'assess-bar-pct');
        pctLabel.textContent = pct + '%';
        pctLabel.style.color = type.color;

        barWrap.appendChild(barFill);
        row.appendChild(label);
        row.appendChild(barWrap);
        row.appendChild(pctLabel);
        barChart.appendChild(row);
    });

    chart.appendChild(barChart);
    page.appendChild(chart);

    // 推荐职业（从职业数据库匹配）
    if (result.recommendedJobs && result.recommendedJobs.length > 0) {
        var careersSection = createEl('div', 'assess-careers');

        var cTitle = createEl('h3', 'assess-chart-title');
        cTitle.textContent = '';
        cTitle.appendChild(icon('target', 18));
        cTitle.appendChild(document.createTextNode(' 智能匹配职业推荐'));
        careersSection.appendChild(cTitle);

        var cSubtitle = createEl('p', '');
        cSubtitle.style.cssText = 'font-size:13px;color:var(--text-secondary);margin:-8px 0 12px;';
        cSubtitle.textContent = '基于你的测评结果，从 1600+ 职业数据库中智能匹配，点击可查看详情';
        careersSection.appendChild(cSubtitle);

        var careerGrid = createEl('div', 'assess-career-grid');

        result.recommendedJobs.slice(0, 12).forEach(function(job) {
            var tag = createEl('div', 'assess-career-tag assess-career-tag-clickable');
            tag.style.cursor = 'pointer';

            // 职业名称
            var nameSpan = createEl('span', '');
            nameSpan.textContent = job.name;
            tag.appendChild(nameSpan);

            // 匹配度
            var matchSpan = createEl('span', 'assess-match-pct');
            matchSpan.textContent = Math.round(job.matchScore * 100) + '%';
            var matchColor = job.matchScore >= 0.3 ? '#10B981' : (job.matchScore >= 0.2 ? '#F59E0B' : '#64748B');
            matchSpan.style.color = matchColor;
            matchSpan.style.fontSize = '11px';
            matchSpan.style.marginLeft = '6px';
            tag.appendChild(matchSpan);

            // RIASEC 类型标签
            var typeTag = createEl('span', 'assess-riasec-mini-tag');
            typeTag.textContent = job.primary + job.secondary;
            typeTag.style.cssText = 'font-size:10px;background:' + RIASEC_TYPES[job.primary].color + '20;color:' + RIASEC_TYPES[job.primary].color + ';padding:1px 4px;border-radius:3px;margin-left:4px;';
            tag.appendChild(typeTag);

            // 点击跳转到职业详情
            tag.addEventListener('click', function() {
                if (window.openJobDetailModal) {
                    window.openJobDetailModal(job.id);
                } else {
                    showToast('职业详情功能加载中...', 'info');
                }
            });

            careerGrid.appendChild(tag);
        });

        careersSection.appendChild(careerGrid);
        page.appendChild(careersSection);
    } else {
        // 回退到静态推荐
        var careersSection = createEl('div', 'assess-careers');

        var cTitle = createEl('h3', 'assess-chart-title');
        cTitle.textContent = '';
        cTitle.appendChild(icon('target', 18));
        cTitle.appendChild(document.createTextNode(' 推荐职业方向'));
        careersSection.appendChild(cTitle);

        var allCareers = primary.careers.concat(secondary.careers);
        var uniqueCareers = [];
        allCareers.forEach(function(c) {
            if (uniqueCareers.indexOf(c) === -1) uniqueCareers.push(c);
        });

        var careerGrid = createEl('div', 'assess-career-grid');

        uniqueCareers.slice(0, 8).forEach(function(career) {
            var tag = createEl('div', 'assess-career-tag');
            tag.textContent = career;
            careerGrid.appendChild(tag);
        });

        careersSection.appendChild(careerGrid);
        page.appendChild(careersSection);
    }

    // 操作按钮
    var actions = createEl('div', 'assess-actions');

    var aiBtn = createEl('button', 'assess-action-btn accent');
    aiBtn.textContent = '';
    aiBtn.appendChild(icon('brain', 16));
    aiBtn.appendChild(document.createTextNode(' AI 智能分析'));
    aiBtn.style.cssText = 'background:linear-gradient(135deg, #6366F1, #8B5CF6);color:#fff;border:none;';
    aiBtn.addEventListener('click', function() {
        // 构建测评结果摘要
        var primaryType = RIASEC_TYPES[result.primary];
        var secondaryType = RIASEC_TYPES[result.secondary];
        var summary = '这是我的霍兰德职业测评结果，请帮我分析：\n\n'
            + '主要类型：' + primaryType.name + '（' + result.primary + '）- ' + Math.round(result.percentages[result.primary]) + '%\n'
            + '次要类型：' + secondaryType.name + '（' + result.secondary + '）- ' + Math.round(result.percentages[result.secondary]) + '%\n\n'
            + '各维度得分：\n';
        var sortedKeys = Object.keys(result.percentages).sort(function(a, b) {
            return result.percentages[b] - result.percentages[a];
        });
        sortedKeys.forEach(function(key) {
            var type = RIASEC_TYPES[key];
            summary += '- ' + type.name + '（' + key + '）：' + Math.round(result.percentages[key]) + '%\n';
        });

        // 如果有推荐职业，加入摘要
        if (result.recommendedJobs && result.recommendedJobs.length > 0) {
            summary += '\n系统推荐的前5个职业：\n';
            result.recommendedJobs.slice(0, 5).forEach(function(job, i) {
                summary += (i + 1) + '. ' + job.name + '（匹配度 ' + Math.round(job.matchScore * 100) + '%）\n';
            });
        }

        summary += '\n请根据以上结果，给我详细的职业分析和建议。';

        // 跳转到 AI 问答页
        if (window.chatWithAgent) {
            window.chatWithAgent('assess-analyzer', summary);
        }
        navigateTo('page-ai');
    });
    actions.appendChild(aiBtn);

    var retryBtn = createEl('button', 'assess-action-btn');
    retryBtn.textContent = '';
    retryBtn.appendChild(icon('refreshCw', 16));
    retryBtn.appendChild(document.createTextNode(' 重新测评'));
    retryBtn.addEventListener('click', function() {
        clearContainer(container);
        initAssessment();
    });
    actions.appendChild(retryBtn);

    var exploreBtn = createEl('button', 'assess-action-btn primary');
    exploreBtn.textContent = '';
    exploreBtn.appendChild(icon('compass', 16));
    exploreBtn.appendChild(document.createTextNode(' 探索推荐职业'));
    exploreBtn.addEventListener('click', function() {
        navigateTo('page-explore');
    });
    actions.appendChild(exploreBtn);

    page.appendChild(actions);

    // 分享提示
    var shareTip = createEl('div', 'assess-share-tip');
    shareTip.textContent = '';
    shareTip.appendChild(icon('lightbulb', 14));
    shareTip.appendChild(document.createTextNode(' 测评结果已保存，下次访问可直接查看'));
    page.appendChild(shareTip);

    container.appendChild(page);
}

// ==================== 本地存储 ====================

function saveResult(result) {
    try {
        localStorage.setItem('byt_assessment_result', JSON.stringify(result));
    } catch(e) {}
}

function getSavedResult() {
    try {
        var data = localStorage.getItem('byt_assessment_result');
        return data ? JSON.parse(data) : null;
    } catch(e) {
        return null;
    }
}
