// ==================== assessment.js - 职业测评页面 ====================
// 百事通 v1.0 - 基于霍兰德职业兴趣理论的职业测评
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl, showToast } from '../utils/ui.js';
import { navigateTo } from '../router.js';
import { addPoints } from '../state.js';
import { icon } from '../utils/icons.js';

// ==================== 测评题目 ====================
// 基于霍兰德 RIASEC 理论，结合中国职业分类体系

const QUESTIONS = [
    // 第1题：兴趣偏好
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
    // 第2题：工作环境
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
    // 第3题：团队角色
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
    // 第4题：解决问题方式
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
    // 第5题：空闲时间
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
    // 第6题：价值观
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
    // 第7题：沟通方式
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
    // 第8题：压力应对
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
    // 第9题：学习偏好
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
    // 第10题：长远目标
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

/**
 * 初始化测评页面
 */
export function initAssessment() {
    const container = document.getElementById('page-assessment');
    if (!container) return;

    clearContainer(container);
    currentQuestion = 0;
    answers = [];
    scores = { R: 0, I: 0, A: 0, S: 0, E: 0, C: 0 };

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
    desc.textContent = '基于霍兰德职业兴趣理论，通过 10 道精选题目，发现最适合你的职业方向';
    page.appendChild(desc);

    const features = createEl('div', 'assess-features');

    const featureItems = [
        { icon: 'timer', text: '约 2 分钟完成' },
        { icon: 'target', text: '10 道精选题目' },
        { icon: 'barChart3', text: '个性化职业推荐' }
    ];

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
    btn.textContent = '开始测评 →';
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
    const percent = Math.round(((currentQuestion) / QUESTIONS.length) * 100);
    bar.style.width = percent + '%';
    const label = createEl('div', 'assess-progress-label');
    label.textContent = (currentQuestion + 1) + ' / ' + QUESTIONS.length;
    progress.appendChild(bar);
    progress.appendChild(label);
    page.appendChild(progress);

    // 题目
    const q = QUESTIONS[currentQuestion];

    const qTitle = createEl('h3', 'assess-q-title');
    qTitle.textContent = q.title;
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
                if (currentQuestion < QUESTIONS.length) {
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
    backBtn.textContent = '← 返回';
    backBtn.addEventListener('click', function() {
        if (currentQuestion > 0) {
            // 回退上一题
            var prevScores = QUESTIONS[currentQuestion - 1].options[answers[currentQuestion - 1]].scores;
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
        timestamp: Date.now()
    };

    Object.keys(scores).forEach(function(k) {
        result.percentages[k] = Math.round((scores[k] / total) * 100);
    });

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

    // 推荐职业
    var careersSection = createEl('div', 'assess-careers');

    var cTitle = createEl('h3', 'assess-chart-title');
    cTitle.textContent = '';
    cTitle.appendChild(icon('target', 18));
    cTitle.appendChild(document.createTextNode(' 推荐职业方向'));
    careersSection.appendChild(cTitle);

    var allCareers = primary.careers.concat(secondary.careers);
    // 去重
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

    // 操作按钮
    var actions = createEl('div', 'assess-actions');

    var aiBtn = createEl('button', 'assess-action-btn accent');
    aiBtn.textContent = '';
    aiBtn.appendChild(icon('brain', 16));
    aiBtn.appendChild(document.createTextNode(' AI 智能分析'));
    aiBtn.style.cssText = 'background:linear-gradient(135deg, #6366F1, #8B5CF6);color:#fff;border:none;';
    aiBtn.addEventListener('click', function() {
        // 构建测评结果摘要
        var primary = RIASEC_TYPES[result.primary];
        var secondary = RIASEC_TYPES[result.secondary];
        var summary = '这是我的霍兰德职业测评结果，请帮我分析：\n\n'
            + '主要类型：' + primary.name + '（' + result.primary + '）- ' + Math.round(result.percentages[result.primary]) + '%\n'
            + '次要类型：' + secondary.name + '（' + result.secondary + '）- ' + Math.round(result.percentages[result.secondary]) + '%\n\n'
            + '各维度得分：\n';
        var sortedKeys = Object.keys(result.percentages).sort(function(a, b) {
            return result.percentages[b] - result.percentages[a];
        });
        sortedKeys.forEach(function(key) {
            var type = RIASEC_TYPES[key];
            summary += '- ' + type.name + '（' + key + '）：' + Math.round(result.percentages[key]) + '%\n';
        });
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
