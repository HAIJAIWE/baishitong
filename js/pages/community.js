// ==================== community.js - 社区 ====================
// 百事通 v1.0
// 安全原则：所有动态内容用 textContent 渲染
// 支持 LeanCloud（真实后端）和 localStorage（回退）双模式

import { clearContainer, createEl, showToast, showConfirm } from '../utils/ui.js';
import { checkAchievement } from '../state.js';
import { isLeanCloudConfigured, fetchPosts, createPost, deletePost, toggleLike, fetchComments, addComment, fetchChatMessages, sendChatMessage } from '../leancloud-service.js';
import { getCurrentUser } from '../auth.js';

const COMMUNITY_POSTS_KEY = 'byt_community_posts';
const COMMUNITY_CHAT_KEY = 'byt_community_chat';
const CHAT_USERNAME_KEY = 'byt_chat_username';

let currentTab = 'knowledge'; // 'knowledge' | 'chat'
let currentPostId = null; // 当前查看的帖子ID

const defaultPosts = [
    {
        id: 'p1',
        avatar: '🧑‍💼',
        username: '职场老王',
        time: Date.now() - 3600000 * 5,
        title: '面试时如何回答"你的缺点是什么"',
        content: '这个问题几乎是面试必问的。关键不是真的暴露致命缺点，而是展示自我认知和改进能力。\n\n建议思路：\n1. 选择一个真实的但不影响核心能力的缺点\n2. 说明你已经意识到了这个问题\n3. 重点描述你正在采取的改进措施\n\n例如："我有时候过于关注细节，但最近我学会了在项目中设定明确的优先级，确保在规定时间内完成任务。"',
        likes: 42,
        comments: [
            { avatar: '👩‍🎓', username: '小李同学', time: Date.now() - 3600000 * 3, text: '学到了！之前面试总是不知道怎么回答这个问题' },
            { avatar: '👨‍💻', username: '技术达人', time: Date.now() - 3600000 * 1, text: '我觉得诚实回答比模板化回答更好，面试官能看出来的' }
        ]
    },
    {
        id: 'p2',
        avatar: '👩‍🏫',
        username: '教育观察者',
        time: Date.now() - 3600000 * 12,
        title: '终身学习时代，学历还重要吗',
        content: '学历在求职中的"敲门砖"作用依然存在，但越来越多的企业开始重视实际能力。特别是在互联网、设计、自媒体等领域，作品集和项目经验往往比学历更有说服力。\n\n不过，学历在以下场景仍然很重要：\n- 国企和事业单位招聘\n- 大厂校招的简历筛选\n- 考公考编的硬性要求\n\n所以，与其纠结学历重不重要，不如思考如何在现有条件下最大化自己的竞争力。',
        likes: 38,
        comments: [
            { avatar: '🧑‍🎓', username: '在读研究生', time: Date.now() - 3600000 * 8, text: '确实，学历是门槛但不是天花板' }
        ]
    },
    {
        id: 'p3',
        avatar: '👨‍🍳',
        username: '转行达人',
        time: Date.now() - 3600000 * 24,
        title: '从厨师到程序员：我的转行经历',
        content: '我在餐饮行业工作了8年，30岁那年决定转行学编程。很多人觉得不可能，但我用了两年时间完成了转型。\n\n我的经验总结：\n1. 先确定方向，我选了前端开发因为入门相对友好\n2. 利用每天下班后的2-3小时学习\n3. 做了3个完整项目作为作品集\n4. 从外包公司起步，积累经验\n\n现在我在一家中型互联网公司工作，薪资比做厨师时翻了3倍。转行不难，难的是坚持。',
        likes: 67,
        comments: [
            { avatar: '👩‍🔬', username: '迷茫中的我', time: Date.now() - 3600000 * 20, text: '太励志了！我也在考虑转行，请问您是怎么学习前端的？' },
            { avatar: '👨‍🍳', username: '转行达人', time: Date.now() - 3600000 * 18, text: '主要是看免费教程，B站上有很多优质的课程，然后多动手做项目' },
            { avatar: '🧑‍💻', username: '前端小白', time: Date.now() - 3600000 * 10, text: '同为转行者，加油！' }
        ]
    },
    {
        id: 'p4',
        avatar: '👩‍⚕️',
        username: '健康生活家',
        time: Date.now() - 3600000 * 48,
        title: '上班族如何保持健康的工作节奏',
        content: '久坐是上班族最大的健康杀手。分享几个我实践过的方法：\n\n1. 番茄工作法：每25分钟站起来活动5分钟\n2. 桌面高度调整：显示器上沿与眼睛齐平\n3. 每天至少走8000步，午休时出去走走\n4. 准备健康零食，避免外卖和含糖饮料\n5. 晚上11点前放下手机，保证7小时睡眠\n\n坚持了一个月后，颈椎痛明显缓解，下午也不会犯困了。健康是革命的本钱，别等出了问题才重视。',
        likes: 55,
        comments: [
            { avatar: '🧑‍💼', username: '久坐族', time: Date.now() - 3600000 * 36, text: '番茄工作法真的有用，推荐大家试试' }
        ]
    },
    {
        id: 'p5',
        avatar: '🧑‍🎨',
        username: '理财小能手',
        time: Date.now() - 3600000 * 72,
        title: '刚毕业如何开始理财',
        content: '理财不是有钱了才开始的事，而是从第一笔工资就要养成的习惯。\n\n新手理财建议：\n1. 先存后花：工资到账先转20%到储蓄账户\n2. 记账：用APP记录每笔支出，了解钱花在哪了\n3. 建立紧急备用金：至少存够3-6个月的生活费\n4. 学习基础知识：了解基金、定投等基本概念\n5. 不要跟风投资：不懂的东西不要碰\n\n记住，理财的第一步不是赚钱，而是控制支出。量入为出是所有财富积累的基础。',
        likes: 89,
        comments: [
            { avatar: '👩‍🎓', username: '应届毕业生', time: Date.now() - 3600000 * 60, text: '正好需要这个！之前完全没有理财概念' },
            { avatar: '👨‍💼', username: '职场新人', time: Date.now() - 3600000 * 48, text: '记账真的很重要，我记了三个月才发现自己奶茶钱花了好几千' }
        ]
    }
];

const defaultChatMessages = [
    { avatar: '😊', username: '小明', time: Date.now() - 3600000 * 2, text: '大家好！有人了解数据分析这个方向吗？' },
    { avatar: '📊', username: '数据分析师', time: Date.now() - 3600000 * 1.5, text: '我是做数据分析的，有什么想了解的可以问我' },
    { avatar: '😊', username: '小明', time: Date.now() - 3600000, text: '需要学哪些工具和技能呢？' },
    { avatar: '📊', username: '数据分析师', time: Date.now() - 3600000 * 0.5, text: 'Excel是基础，然后学SQL、Python，工具方面Tableau或Power BI至少会一个' },
    { avatar: '🤔', username: '好奇宝宝', time: Date.now() - 3600000 * 0.2, text: '零基础转行数据分析大概需要多久？' }
];

/**
 * 获取当前用户名：优先使用登录用户名，否则使用随机聊天用户名
 * @returns {string}
 */
function getEffectiveUsername() {
    const loggedInUser = getCurrentUser();
    if (loggedInUser) return loggedInUser;
    return getChatUsername().replace(/^[\u{1F300}-\u{1F9FF}]/u, '');
}

/**
 * 获取社区帖子列表（支持双模式）
 * @returns {Promise<Array>}
 */
async function getCommunityPosts() {
    const useLeanCloud = isLeanCloudConfigured();
    if (useLeanCloud) {
        const posts = await fetchPosts(20, 0);
        if (posts) return posts;
        // LeanCloud 请求失败，回退到 localStorage
    }

    // localStorage 模式
    const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            // 解析失败，使用默认数据
        }
    }
    // 首次使用，初始化默认帖子
    localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(defaultPosts));
    return defaultPosts.slice();
}

/**
 * 保存社区帖子列表（仅 localStorage 模式使用）
 * @param {Array} posts
 */
function saveCommunityPosts(posts) {
    localStorage.setItem(COMMUNITY_POSTS_KEY, JSON.stringify(posts));
}

/**
 * 获取聊天消息列表（支持双模式）
 * @returns {Promise<Array>}
 */
async function getChatMessages() {
    const useLeanCloud = isLeanCloudConfigured();
    if (useLeanCloud) {
        const messages = await fetchChatMessages(50);
        if (messages) return messages;
        // LeanCloud 请求失败，回退到 localStorage
    }

    // localStorage 模式
    const raw = localStorage.getItem(COMMUNITY_CHAT_KEY);
    if (raw) {
        try {
            return JSON.parse(raw);
        } catch (e) {
            // 解析失败，使用默认数据
        }
    }
    localStorage.setItem(COMMUNITY_CHAT_KEY, JSON.stringify(defaultChatMessages));
    return defaultChatMessages.slice();
}

/**
 * 保存聊天消息列表（仅 localStorage 模式使用）
 * @param {Array} messages
 */
function saveChatMessages(messages) {
    localStorage.setItem(COMMUNITY_CHAT_KEY, JSON.stringify(messages));
}

/**
 * 获取或生成聊天用户名
 * @returns {string}
 */
function getChatUsername() {
    let name = localStorage.getItem(CHAT_USERNAME_KEY);
    if (name) return name;

    const adjectives = ['快乐的', '聪明的', '勇敢的', '可爱的', '活泼的', '阳光的', '好奇的', '热情的'];
    const nouns = ['探索者', '学习者', '追梦人', '旅行家', '思考者', '实践者', '创造者', '冒险家'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const emojis = ['😊', '🌟', '🎯', '🚀', '💡', '🔥', '✨', '🌈'];
    const emoji = emojis[Math.floor(Math.random() * emojis.length)];

    name = emoji + adj + noun;
    localStorage.setItem(CHAT_USERNAME_KEY, name);
    return name;
}

/**
 * 格式化时间
 * @param {number} timestamp
 * @returns {string}
 */
function formatCommunityTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return minutes + '分钟前';
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return hours + '小时前';
    const days = Math.floor(hours / 24);
    if (days < 30) return days + '天前';

    const d = new Date(timestamp);
    return d.getFullYear() + '/' + (d.getMonth() + 1) + '/' + d.getDate();
}

/**
 * 初始化社区页
 */
export async function initCommunity() {
    const container = document.getElementById('page-community');
    if (!container) return;

    currentTab = 'knowledge';
    currentPostId = null;

    clearContainer(container);
    renderCommunity(container);
}

window.initCommunity = initCommunity;

/**
 * 渲染社区页
 * @param {HTMLElement} container
 */
function renderCommunity(container) {
    // 页面标题
    const header = createEl('div', 'page-header');
    const title = createEl('h2', '');
    title.textContent = '社区';
    header.appendChild(title);
    container.appendChild(header);

    // Tab 切换
    const tabs = createEl('div', 'community-tabs');

    const knowledgeTab = createEl('div', 'community-tab active');
    knowledgeTab.textContent = '知识分享';
    knowledgeTab.addEventListener('click', function() {
        if (currentTab === 'knowledge') return;
        currentTab = 'knowledge';
        currentPostId = null;
        knowledgeTab.classList.add('active');
        chatTab.classList.remove('active');
        clearContainer(tabContent);
        renderKnowledgeTab(tabContent);
        removeFab();
        fab.style.display = 'flex';
    });

    const chatTab = createEl('div', 'community-tab');
    chatTab.textContent = '聊天室';
    chatTab.addEventListener('click', function() {
        if (currentTab === 'chat') return;
        currentTab = 'chat';
        currentPostId = null;
        chatTab.classList.add('active');
        knowledgeTab.classList.remove('active');
        clearContainer(tabContent);
        renderChatTab(tabContent);
        fab.style.display = 'none';
        removeFab();
    });

    tabs.appendChild(knowledgeTab);
    tabs.appendChild(chatTab);
    container.appendChild(tabs);

    // Tab 内容区域
    const tabContent = createEl('div', '');
    tabContent.id = 'communityTabContent';
    container.appendChild(tabContent);

    // 浮动发帖按钮
    const fab = createEl('button', 'post-fab');
    fab.textContent = '+';
    fab.addEventListener('click', function() {
        showNewPostForm(container);
    });
    container.appendChild(fab);

    // 默认渲染知识分享
    renderKnowledgeTab(tabContent);
}

/**
 * 创建加载骨架屏
 * @param {HTMLElement} container
 */
function showLoadingSkeleton(container) {
    for (let i = 0; i < 3; i++) {
        const skeleton = createEl('div', 'post-card');
        skeleton.style.opacity = '0.5';
        skeleton.innerHTML = '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;"><div style="width:36px;height:36px;border-radius:50%;background:var(--border);"></div><div style="flex:1;"><div style="height:14px;background:var(--border);border-radius:4px;width:40%;margin-bottom:6px;"></div><div style="height:12px;background:var(--border);border-radius:4px;width:25%;"></div></div></div><div style="height:18px;background:var(--border);border-radius:4px;width:70%;margin-bottom:8px;"></div><div style="height:14px;background:var(--border);border-radius:4px;width:100%;margin-bottom:4px;"></div><div style="height:14px;background:var(--border);border-radius:4px;width:85%;margin-bottom:12px;"></div><div style="display:flex;gap:16px;"><div style="height:14px;background:var(--border);border-radius:4px;width:40px;"></div><div style="height:14px;background:var(--border);border-radius:4px;width:40px;"></div></div>';
        container.appendChild(skeleton);
    }
}

/**
 * 渲染知识分享 Tab
 * @param {HTMLElement} container
 */
async function renderKnowledgeTab(container) {
    const useLeanCloud = isLeanCloudConfigured();

    if (useLeanCloud) {
        // 显示加载骨架屏
        showLoadingSkeleton(container);
    }

    const posts = await getCommunityPosts();

    // LeanCloud 模式下清除骨架屏
    if (useLeanCloud) {
        clearContainer(container);
    }

    if (posts.length === 0) {
        const empty = createEl('div', 'empty-state');
        const icon = createEl('div', 'empty-icon');
        icon.textContent = '📝';
        const text = createEl('div', 'empty-title');
        text.textContent = '还没有知识帖子';
        const desc = createEl('div', 'empty-desc');
        desc.textContent = '点击右下角按钮发布第一篇帖子吧';
        empty.appendChild(icon);
        empty.appendChild(text);
        empty.appendChild(desc);
        container.appendChild(empty);
        return;
    }

    posts.forEach(function(post, index) {
        const card = createPostCard(post, index);
        container.appendChild(card);
    });
}

/**
 * 创建帖子卡片（兼容 LeanCloud 和 localStorage 数据格式）
 * @param {Object} post
 * @param {number} index
 * @returns {HTMLElement}
 */
function createPostCard(post, index) {
    const card = createEl('div', 'post-card');
    card.style.animationDelay = Math.min(index * 30, 300) + 'ms';
    card.style.animation = 'cardIn var(--duration-normal) var(--ease-out) both';

    // 头部：头像 + 用户名 + 时间
    const header = createEl('div', 'post-header');

    const avatar = createEl('div', 'post-avatar');
    avatar.textContent = post.avatar || '👤';

    const userInfo = createEl('div', 'post-user-info');

    const username = createEl('div', 'post-username');
    username.textContent = post.username || '匿名用户';

    const time = createEl('div', 'post-time');
    time.textContent = formatCommunityTime(post.time);

    userInfo.appendChild(username);
    userInfo.appendChild(time);
    header.appendChild(avatar);
    header.appendChild(userInfo);
    card.appendChild(header);

    // 标题
    const title = createEl('div', 'post-title');
    title.textContent = post.title || '';
    card.appendChild(title);

    // 内容预览
    const content = createEl('div', 'post-content');
    content.textContent = post.content || '';
    card.appendChild(content);

    // 底部：点赞 + 评论
    const footer = createEl('div', 'post-footer');

    const likeBtn = createEl('div', 'post-action');
    const likeIcon = createEl('span', '');
    likeIcon.textContent = '👍';
    const likeCount = createEl('span', '');
    likeCount.textContent = (post.likes || 0) + '';
    likeBtn.appendChild(likeIcon);
    likeBtn.appendChild(likeCount);

    const commentBtn = createEl('div', 'post-action');
    const commentIcon = createEl('span', '');
    commentIcon.textContent = '💬';
    const commentCount = createEl('span', '');
    // LeanCloud 使用 commentCount，localStorage 使用 comments.length
    commentCount.textContent = (post.commentCount != null ? post.commentCount : (post.comments ? post.comments.length : 0)) + '';
    commentBtn.appendChild(commentIcon);
    commentBtn.appendChild(commentCount);

    // 点赞功能
    likeBtn.addEventListener('click', async function(e) {
        e.stopPropagation();
        const useLeanCloud = isLeanCloudConfigured();
        const postId = post.objectId || post.id;

        if (useLeanCloud) {
            const username = getEffectiveUsername();
            const result = await toggleLike(postId, username);
            if (result) {
                post.likes = result.likes;
                post.likedByCurrentUser = result.likedByCurrentUser;
                if (result.likedByCurrentUser) {
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                }
                likeCount.textContent = result.likes + '';
            }
        } else {
            const posts = getCommunityPosts();
            // 注意：localStorage 模式下 getCommunityPosts 是 async，但这里需要同步操作
            // 直接读取 localStorage
            const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
            if (raw) {
                try {
                    const posts = JSON.parse(raw);
                    for (let i = 0; i < posts.length; i++) {
                        if (posts[i].id === post.id) {
                            posts[i].liked = !posts[i].liked;
                            posts[i].likes = (posts[i].likes || 0) + (posts[i].liked ? 1 : -1);
                            saveCommunityPosts(posts);
                            if (posts[i].liked) {
                                likeBtn.classList.add('liked');
                            } else {
                                likeBtn.classList.remove('liked');
                            }
                            likeCount.textContent = posts[i].likes + '';
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
    });

    // 兼容两种数据格式的已点赞状态
    // LeanCloud: likedByCurrentUser, localStorage: liked
    if (post.likedByCurrentUser || post.liked) {
        likeBtn.classList.add('liked');
    }

    footer.appendChild(likeBtn);
    footer.appendChild(commentBtn);
    card.appendChild(footer);

    // 点击打开详情
    card.addEventListener('click', function() {
        const tabContent = document.getElementById('communityTabContent');
        if (tabContent) {
            clearContainer(tabContent);
            renderPostDetail(tabContent, post.objectId || post.id);
        }
    });

    return card;
}

/**
 * 渲染帖子详情
 * @param {HTMLElement} container
 * @param {string} postId
 */
async function renderPostDetail(container, postId) {
    const useLeanCloud = isLeanCloudConfigured();
    let post = null;
    let comments = [];

    if (useLeanCloud) {
        // LeanCloud 模式：从服务端获取帖子和评论
        const posts = await fetchPosts(100, 0);
        if (posts) {
            for (let i = 0; i < posts.length; i++) {
                if (posts[i].objectId === postId || posts[i].id === postId) {
                    post = posts[i];
                    break;
                }
            }
        }
        if (post) {
            const fetchedComments = await fetchComments(post.objectId || postId);
            if (fetchedComments) {
                comments = fetchedComments;
            }
        }
    } else {
        // localStorage 模式
        const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
        if (raw) {
            try {
                const posts = JSON.parse(raw);
                for (let i = 0; i < posts.length; i++) {
                    if (posts[i].id === postId) {
                        post = posts[i];
                        break;
                    }
                }
            } catch (e) {}
        }
        if (post) {
            comments = post.comments || [];
        }
    }

    if (!post) {
        showToast('帖子不存在', 'error');
        initCommunity();
        return;
    }

    // 隐藏 FAB
    const fab = document.querySelector('.post-fab');
    if (fab) fab.style.display = 'none';

    // 返回按钮
    const backHeader = createEl('div', 'post-detail-header');
    const backBtn = createEl('button', 'post-detail-back');
    backBtn.textContent = '← 返回列表';
    backBtn.addEventListener('click', function() {
        clearContainer(container);
        renderKnowledgeTab(container);
        if (fab) fab.style.display = 'flex';
    });
    backHeader.appendChild(backBtn);
    container.appendChild(backHeader);

    // 帖子头部
    const header = createEl('div', 'post-header');

    const avatar = createEl('div', 'post-avatar');
    avatar.textContent = post.avatar || '👤';

    const userInfo = createEl('div', 'post-user-info');

    const username = createEl('div', 'post-username');
    username.textContent = post.username || '匿名用户';

    const time = createEl('div', 'post-time');
    time.textContent = formatCommunityTime(post.time);

    userInfo.appendChild(username);
    userInfo.appendChild(time);
    header.appendChild(avatar);
    header.appendChild(userInfo);
    container.appendChild(header);

    // 标题
    const title = createEl('div', 'post-title');
    title.textContent = post.title || '';
    title.style.fontSize = 'var(--text-lg)';
    container.appendChild(title);

    // 完整内容
    const content = createEl('div', 'post-detail-content');
    content.textContent = post.content || '';
    container.appendChild(content);

    // 互动栏
    const actions = createEl('div', 'post-footer');

    const likeBtn = createEl('div', 'post-action');
    const likeIcon = createEl('span', '');
    likeIcon.textContent = '👍';
    const likeCount = createEl('span', '');
    likeCount.textContent = (post.likes || 0) + ' 赞';
    likeBtn.appendChild(likeIcon);
    likeBtn.appendChild(likeCount);

    // 兼容两种数据格式的已点赞状态
    if (post.likedByCurrentUser || post.liked) {
        likeBtn.classList.add('liked');
    }

    likeBtn.addEventListener('click', async function() {
        const effectivePostId = post.objectId || postId;

        if (useLeanCloud) {
            const username = getEffectiveUsername();
            const result = await toggleLike(effectivePostId, username);
            if (result) {
                post.likes = result.likes;
                post.likedByCurrentUser = result.likedByCurrentUser;
                if (result.likedByCurrentUser) {
                    likeBtn.classList.add('liked');
                } else {
                    likeBtn.classList.remove('liked');
                }
                likeCount.textContent = result.likes + ' 赞';
            }
        } else {
            const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
            if (raw) {
                try {
                    const allPosts = JSON.parse(raw);
                    for (let j = 0; j < allPosts.length; j++) {
                        if (allPosts[j].id === postId) {
                            allPosts[j].liked = !allPosts[j].liked;
                            allPosts[j].likes = (allPosts[j].likes || 0) + (allPosts[j].liked ? 1 : -1);
                            saveCommunityPosts(allPosts);
                            post = allPosts[j];
                            if (post.liked) {
                                likeBtn.classList.add('liked');
                            } else {
                                likeBtn.classList.remove('liked');
                            }
                            likeCount.textContent = post.likes + ' 赞';
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
    });

    actions.appendChild(likeBtn);

    // 删除按钮（仅自己的帖子）
    const currentUsername = getEffectiveUsername();
    if (post.username === currentUsername) {
        const deleteBtn = createEl('div', 'post-action');
        deleteBtn.style.color = 'var(--danger)';
        const deleteIcon = createEl('span', '');
        deleteIcon.textContent = '🗑️';
        const deleteText = createEl('span', '');
        deleteText.textContent = '删除';
        deleteBtn.appendChild(deleteIcon);
        deleteBtn.appendChild(deleteText);

        deleteBtn.addEventListener('click', function() {
            showConfirm('删除帖子', '确定要删除这篇帖子吗？删除后不可恢复。', async function() {
                const effectivePostId = post.objectId || postId;

                if (useLeanCloud) {
                    const success = await deletePost(effectivePostId);
                    if (success) {
                        showToast('帖子已删除', 'info');
                        clearContainer(container);
                        renderKnowledgeTab(container);
                        if (fab) fab.style.display = 'flex';
                    } else {
                        showToast('删除失败', 'error');
                    }
                } else {
                    const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
                    if (raw) {
                        try {
                            const allPosts = JSON.parse(raw);
                            const filtered = [];
                            for (let d = 0; d < allPosts.length; d++) {
                                if (allPosts[d].id !== postId) {
                                    filtered.push(allPosts[d]);
                                }
                            }
                            saveCommunityPosts(filtered);
                            showToast('帖子已删除', 'info');
                            clearContainer(container);
                            renderKnowledgeTab(container);
                            if (fab) fab.style.display = 'flex';
                        } catch (e) {}
                    }
                }
            });
        });

        actions.appendChild(deleteBtn);
    }

    container.appendChild(actions);

    // 评论区
    const commentSection = createEl('div', 'comment-list');

    const commentTitle = createEl('div', '');
    commentTitle.style.cssText = 'font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);margin-bottom:var(--space-3);';
    // LeanCloud 使用 commentCount，localStorage 使用 comments.length
    const totalComments = useLeanCloud ? comments.length : (post.comments ? post.comments.length : 0);
    commentTitle.textContent = '评论 (' + totalComments + ')';
    commentSection.appendChild(commentTitle);

    if (comments.length === 0) {
        const noComment = createEl('div', '');
        noComment.style.cssText = 'text-align:center;padding:var(--space-4);color:var(--text-tertiary);font-size:var(--text-sm);';
        noComment.textContent = '暂无评论，来说两句吧';
        commentSection.appendChild(noComment);
    } else {
        comments.forEach(function(comment) {
            const item = createCommentItem(comment);
            commentSection.appendChild(item);
        });
    }

    container.appendChild(commentSection);

    // 评论输入栏
    const inputBar = createEl('div', 'comment-input-bar');

    const input = createEl('input', 'input');
    input.type = 'text';
    input.placeholder = '写评论...';

    const sendBtn = createEl('button', 'chat-send-btn');
    sendBtn.textContent = '发送';

    sendBtn.addEventListener('click', async function() {
        const text = input.value.trim();
        if (!text) return;

        const effectivePostId = post.objectId || postId;
        const username = getEffectiveUsername();
        const avatar = '😊';

        if (useLeanCloud) {
            const result = await addComment(effectivePostId, text, username, avatar);
            if (result) {
                input.value = '';
                showToast('评论成功', 'success');
                // 重新渲染详情
                clearContainer(container);
                renderPostDetail(container, effectivePostId);
            } else {
                showToast('评论失败', 'error');
            }
        } else {
            const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
            if (raw) {
                try {
                    const allPosts = JSON.parse(raw);
                    for (let k = 0; k < allPosts.length; k++) {
                        if (allPosts[k].id === postId) {
                            if (!allPosts[k].comments) allPosts[k].comments = [];
                            allPosts[k].comments.push({
                                avatar: avatar,
                                username: username,
                                time: Date.now(),
                                text: text
                            });
                            saveCommunityPosts(allPosts);
                            input.value = '';
                            showToast('评论成功', 'success');
                            // 重新渲染详情
                            clearContainer(container);
                            renderPostDetail(container, postId);
                            break;
                        }
                    }
                } catch (e) {}
            }
        }
    });

    // 回车发送
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    inputBar.appendChild(input);
    inputBar.appendChild(sendBtn);
    container.appendChild(inputBar);
}

/**
 * 创建评论项
 * @param {Object} comment
 * @returns {HTMLElement}
 */
function createCommentItem(comment) {
    const item = createEl('div', 'comment-item');

    const avatar = createEl('div', 'comment-avatar');
    avatar.textContent = comment.avatar || '👤';

    const body = createEl('div', 'comment-body');

    const name = createEl('div', 'comment-name');
    name.textContent = comment.username || '匿名';

    const text = createEl('div', 'comment-text');
    text.textContent = comment.text || '';

    const time = createEl('div', 'comment-time');
    time.textContent = formatCommunityTime(comment.time);

    body.appendChild(name);
    body.appendChild(text);
    body.appendChild(time);

    item.appendChild(avatar);
    item.appendChild(body);

    return item;
}

/**
 * 显示新帖表单
 * @param {HTMLElement} container
 */
function showNewPostForm(container) {
    const tabContent = document.getElementById('communityTabContent');
    if (!tabContent) return;

    clearContainer(tabContent);

    // 隐藏 FAB
    const fab = document.querySelector('.post-fab');
    if (fab) fab.style.display = 'none';

    // 返回按钮
    const backHeader = createEl('div', 'post-detail-header');
    const backBtn = createEl('button', 'post-detail-back');
    backBtn.textContent = '← 取消';
    backBtn.addEventListener('click', function() {
        clearContainer(tabContent);
        renderKnowledgeTab(tabContent);
        if (fab) fab.style.display = 'flex';
    });
    backHeader.appendChild(backBtn);
    tabContent.appendChild(backHeader);

    // 表单
    const form = createEl('div', 'new-post-form');

    const titleLabel = createEl('div', '');
    titleLabel.style.cssText = 'font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);margin-bottom:var(--space-2);';
    titleLabel.textContent = '标题';

    const titleInput = createEl('input', 'input');
    titleInput.type = 'text';
    titleInput.placeholder = '输入帖子标题';
    titleInput.maxLength = 50;

    const contentLabel = createEl('div', '');
    contentLabel.style.cssText = 'font-size:var(--text-sm);font-weight:var(--font-semibold);color:var(--text-primary);margin-bottom:var(--space-2);margin-top:var(--space-2);';
    contentLabel.textContent = '内容';

    const contentArea = document.createElement('textarea');
    contentArea.className = '';
    contentArea.style.cssText = 'width:100%;background:var(--bg-tertiary);border:1px solid var(--border);border-radius:var(--radius-lg);padding:var(--space-3);font-size:var(--text-sm);color:var(--text-primary);margin-bottom:var(--space-3);box-sizing:border-box;min-height:120px;resize:vertical;line-height:var(--leading-relaxed);';
    contentArea.placeholder = '分享你的知识和经验...';

    const submitBtn = createEl('button', 'btn btn-primary');
    submitBtn.style.cssText = 'width:100%;';
    submitBtn.textContent = '发布帖子';

    submitBtn.addEventListener('click', async function() {
        const titleVal = titleInput.value.trim();
        const contentVal = contentArea.value.trim();

        if (!titleVal) {
            showToast('请输入标题', 'error');
            return;
        }
        if (!contentVal) {
            showToast('请输入内容', 'error');
            return;
        }

        const useLeanCloud = isLeanCloudConfigured();
        const username = getEffectiveUsername();
        const avatar = '😊';

        if (useLeanCloud) {
            const newPost = await createPost(titleVal, contentVal, username, avatar);
            if (newPost) {
                showToast('发布成功', 'success');
                checkAchievement('custom_job');
                clearContainer(tabContent);
                renderKnowledgeTab(tabContent);
                if (fab) fab.style.display = 'flex';
            } else {
                showToast('发布失败', 'error');
            }
        } else {
            const raw = localStorage.getItem(COMMUNITY_POSTS_KEY);
            let posts = [];
            if (raw) {
                try { posts = JSON.parse(raw); } catch (e) {}
            }
            const newPost = {
                id: 'p' + Date.now(),
                avatar: avatar,
                username: username,
                time: Date.now(),
                title: titleVal,
                content: contentVal,
                likes: 0,
                liked: false,
                comments: []
            };

            posts.unshift(newPost);
            saveCommunityPosts(posts);

            showToast('发布成功', 'success');

            // 检查发帖成就
            checkAchievement('custom_job');
            clearContainer(tabContent);
            renderKnowledgeTab(tabContent);
            if (fab) fab.style.display = 'flex';
        }
    });

    form.appendChild(titleLabel);
    form.appendChild(titleInput);
    form.appendChild(contentLabel);
    form.appendChild(contentArea);
    form.appendChild(submitBtn);
    tabContent.appendChild(form);

    // 自动聚焦标题
    titleInput.focus();
}

/**
 * 渲染聊天室 Tab
 * @param {HTMLElement} container
 */
async function renderChatTab(container) {
    const useLeanCloud = isLeanCloudConfigured();

    // 聊天容器
    const chatWrap = createEl('div', '');
    chatWrap.style.cssText = 'display:flex;flex-direction:column;height:calc(100dvh - 260px);min-height:400px;';

    // 消息区域
    const messagesArea = createEl('div', 'chat-messages-area');

    // LeanCloud 模式下先显示加载提示
    if (useLeanCloud) {
        const loadingTip = createEl('div', '');
        loadingTip.style.cssText = 'text-align:center;padding:var(--space-4);color:var(--text-tertiary);font-size:var(--text-sm);';
        loadingTip.textContent = '加载消息中...';
        messagesArea.appendChild(loadingTip);
    }

    const messages = await getChatMessages();
    const username = getChatUsername();

    // LeanCloud 模式下清除加载提示
    if (useLeanCloud) {
        clearContainer(messagesArea);
    }

    messages.forEach(function(msg) {
        const isSelf = msg.username === username;
        const bubble = createChatBubble(msg, isSelf);
        messagesArea.appendChild(bubble);
    });

    chatWrap.appendChild(messagesArea);

    // 输入栏
    const inputBar = createEl('div', 'chat-input-bar');

    const input = createEl('input', 'input');
    input.type = 'text';
    input.placeholder = '输入消息...';

    const sendBtn = createEl('button', 'chat-send-btn');
    sendBtn.textContent = '发送';

    sendBtn.addEventListener('click', async function() {
        const text = input.value.trim();
        if (!text) return;

        const effectiveUsername = getEffectiveUsername();
        const avatar = '😊';

        if (useLeanCloud) {
            const result = await sendChatMessage(text, effectiveUsername, avatar);
            if (result) {
                input.value = '';
                checkAchievement('emotion_green');

                // 添加新气泡
                const bubble = createChatBubble({
                    avatar: avatar,
                    username: effectiveUsername,
                    time: Date.now(),
                    text: text
                }, true);
                messagesArea.appendChild(bubble);

                // 滚动到底部
                messagesArea.scrollTop = messagesArea.scrollHeight;
            } else {
                showToast('发送失败', 'error');
            }
        } else {
            const allMessages = getChatMessages();
            allMessages.push({
                avatar: avatar,
                username: username,
                time: Date.now(),
                text: text
            });
            saveChatMessages(allMessages);
            input.value = '';

            // 检查聊天成就
            checkAchievement('emotion_green');

            // 添加新气泡
            const bubble = createChatBubble({
                avatar: avatar,
                username: username,
                time: Date.now(),
                text: text
            }, true);
            messagesArea.appendChild(bubble);

            // 滚动到底部
            messagesArea.scrollTop = messagesArea.scrollHeight;
        }
    });

    // 回车发送
    input.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            sendBtn.click();
        }
    });

    inputBar.appendChild(input);
    inputBar.appendChild(sendBtn);
    chatWrap.appendChild(inputBar);

    container.appendChild(chatWrap);

    // 滚动到底部
    requestAnimationFrame(function() {
        messagesArea.scrollTop = messagesArea.scrollHeight;
    });
}

/**
 * 创建聊天气泡
 * @param {Object} msg
 * @param {boolean} isSelf
 * @returns {HTMLElement}
 */
function createChatBubble(msg, isSelf) {
    const bubble = createEl('div', 'chat-bubble' + (isSelf ? ' self' : ''));

    const avatar = createEl('div', 'chat-bubble-avatar');
    avatar.textContent = msg.avatar || '👤';

    const body = createEl('div', 'chat-bubble-body');

    if (!isSelf) {
        const name = createEl('div', 'chat-bubble-name');
        name.textContent = msg.username || '匿名';
        body.appendChild(name);
    }

    const text = createEl('div', 'chat-bubble-text');
    text.textContent = msg.text || '';
    body.appendChild(text);

    const time = createEl('div', 'chat-bubble-time');
    time.textContent = formatCommunityTime(msg.time);
    body.appendChild(time);

    bubble.appendChild(avatar);
    bubble.appendChild(body);

    // 自己的消息支持撤回（3分钟内）
    if (isSelf) {
        const canRecall = (Date.now() - (msg.time || 0)) < 3 * 60 * 1000;
        let longPressTimer = null;

        const doRecall = function() {
            if (!canRecall) {
                showToast('超过3分钟，无法撤回', 'warning');
                return;
            }
            showConfirm('撤回消息', '确定要撤回这条消息吗？', function() {
                const useLeanCloud = isLeanCloudConfigured();

                if (useLeanCloud) {
                    // LeanCloud 模式下暂不支持撤回（需要删除远程消息）
                    showToast('云端消息暂不支持撤回', 'warning');
                    return;
                }

                // localStorage 模式
                const allMsgs = getChatMessages();
                let idx = -1;
                for (let i = allMsgs.length - 1; i >= 0; i--) {
                    if (allMsgs[i].time === msg.time && allMsgs[i].text === msg.text) {
                        idx = i;
                        break;
                    }
                }
                if (idx !== -1) {
                    allMsgs.splice(idx, 1);
                    saveChatMessages(allMsgs);
                    bubble.style.transition = 'all 0.3s ease';
                    bubble.style.opacity = '0';
                    bubble.style.transform = 'translateX(100%)';
                    setTimeout(function() {
                        if (bubble.parentNode) bubble.parentNode.removeChild(bubble);
                    }, 300);
                    showToast('消息已撤回', 'info');
                }
            });
        };

        bubble.addEventListener('touchstart', function(e) {
            longPressTimer = setTimeout(doRecall, 600);
        }, { passive: true });

        bubble.addEventListener('touchend', function() {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        });

        bubble.addEventListener('touchmove', function() {
            if (longPressTimer) { clearTimeout(longPressTimer); longPressTimer = null; }
        }, { passive: true });

        // 桌面端右键撤回
        bubble.addEventListener('contextmenu', function(e) {
            e.preventDefault();
            doRecall();
        });
    }

    return bubble;
}

/**
 * 移除 FAB 按钮
 */
function removeFab() {
    const fab = document.querySelector('.post-fab');
    if (fab) fab.style.display = 'none';
}
