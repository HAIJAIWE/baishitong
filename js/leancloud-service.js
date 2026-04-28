// ==================== leancloud-service.js - LeanCloud 云服务封装 ====================
// 百事通 v1.0
// 社区功能的数据层，将本地存储操作迁移至 LeanCloud 云端

import AV from 'leancloud-storage';
import { encrypt, decrypt } from './utils/crypto.js';

// 加密密码（固定值，仅用于混淆存储，防止直接明文读取）
const LC_CRYPTO_PASS = 'byt_leancloud_2024_secure';

// ==================== 配置管理 ====================

/**
 * 初始化 LeanCloud SDK
 * @param {string} appId - 应用 ID
 * @param {string} appKey - 应用 Key
 * @param {string} serverURL - 服务器地址
 */
function initLeanCloud(appId, appKey, serverURL) {
    try {
        AV.init({
            appId: appId,
            appKey: appKey,
            serverURL: serverURL
        });
    } catch (e) {
        console.error('LeanCloud 初始化失败:', e);
    }
}

/**
 * 检查 LeanCloud 是否已配置
 * @returns {boolean}
 */
function isLeanCloudConfigured() {
    const appId = localStorage.getItem('byt_lc_appid');
    const appKeyEnc = localStorage.getItem('byt_lc_appkey');
    const serverURL = localStorage.getItem('byt_lc_server');
    return !!(appId && appKeyEnc && serverURL);
}

/**
 * 保存 LeanCloud 配置（加密存储 App Key）并初始化
 * @param {string} appId - 应用 ID
 * @param {string} appKey - 应用 Key
 * @param {string} serverURL - 服务器地址
 */
async function saveLeanCloudConfig(appId, appKey, serverURL) {
    localStorage.setItem('byt_lc_appid', appId);
    localStorage.setItem('byt_lc_server', serverURL);
    // App Key 加密存储
    try {
        const encrypted = await encrypt(appKey, LC_CRYPTO_PASS);
        localStorage.setItem('byt_lc_appkey', encrypted);
    } catch (e) {
        // 加密失败时回退到明文（不应该发生）
        localStorage.setItem('byt_lc_appkey', appKey);
    }
    initLeanCloud(appId, appKey, serverURL);
}

/**
 * 获取已存储的 LeanCloud 配置（自动解密 App Key）
 * @returns {Promise<Object|null>} 配置对象或 null
 */
async function getLeanCloudConfig() {
    const appId = localStorage.getItem('byt_lc_appid');
    const appKeyEnc = localStorage.getItem('byt_lc_appkey');
    const serverURL = localStorage.getItem('byt_lc_server');
    if (!appId || !appKeyEnc || !serverURL) {
        return null;
    }
    // 尝试解密 App Key
    let appKey;
    try {
        appKey = await decrypt(appKeyEnc, LC_CRYPTO_PASS);
    } catch (e) {
        // 可能是旧版明文存储，直接使用
        appKey = appKeyEnc;
    }
    return {
        appId: appId,
        appKey: appKey,
        serverURL: serverURL
    };
}

// ==================== 帖子操作 ====================

/**
 * 获取帖子列表
 * @param {number} [limit=20] - 每页数量
 * @param {number} [skip=0] - 跳过数量
 * @returns {Promise<Array|null>} 帖子数组或 null
 */
async function fetchPosts(limit, skip) {
    try {
        limit = limit || 20;
        skip = skip || 0;

        const query = new AV.Query('Post');
        query.descending('createdAt');
        query.limit(limit);
        query.skip(skip);

        const results = await query.find();

        // 获取当前用户名，用于判断是否已点赞
        const currentUsername = localStorage.getItem('byt_chat_username') || '';

        const posts = [];
        for (let i = 0; i < results.length; i++) {
            const post = results[i];
            const likedBy = post.get('likedBy') || [];
            const likedByCurrentUser = likedBy.indexOf(currentUsername) !== -1;

            posts.push({
                id: post.id,
                avatar: post.get('avatar') || '',
                username: post.get('username') || '匿名用户',
                title: post.get('title') || '',
                content: post.get('content') || '',
                likes: post.get('likes') || 0,
                likedByCurrentUser: likedByCurrentUser,
                commentCount: post.get('commentCount') || 0,
                time: post.createdAt.getTime(),
                objectId: post.id
            });
        }

        return posts;
    } catch (e) {
        console.error('获取帖子列表失败:', e);
        return null;
    }
}

/**
 * 创建新帖子
 * @param {string} title - 帖子标题
 * @param {string} content - 帖子内容
 * @param {string} username - 用户名
 * @param {string} avatar - 用户头像
 * @returns {Promise<Object|null>} 新帖子对象或 null
 */
async function createPost(title, content, username, avatar) {
    try {
        const Post = AV.Object.extend('Post');
        const post = new Post();

        post.set('title', title);
        post.set('content', content);
        post.set('username', username);
        post.set('avatar', avatar);
        post.set('likes', 0);
        post.set('likedBy', []);
        post.set('commentCount', 0);

        const saved = await post.save();

        return {
            id: saved.id,
            avatar: avatar || '',
            username: username || '匿名用户',
            title: title || '',
            content: content || '',
            likes: 0,
            likedByCurrentUser: false,
            commentCount: 0,
            time: saved.createdAt.getTime(),
            objectId: saved.id
        };
    } catch (e) {
        console.error('创建帖子失败:', e);
        return null;
    }
}

/**
 * 删除帖子
 * @param {string} objectId - 帖子 objectId
 * @returns {Promise<boolean>} 是否删除成功
 */
async function deletePost(objectId) {
    try {
        const post = AV.Object.createWithoutData('Post', objectId);
        await post.destroy();
        return true;
    } catch (e) {
        console.error('删除帖子失败:', e);
        return false;
    }
}

/**
 * 切换点赞状态
 * 读取帖子的 likedBy 数组，将当前用户名加入或移除，同时更新 likes 计数
 * @param {string} postObjectId - 帖子 objectId
 * @param {string} username - 当前用户名
 * @returns {Promise<Object|null>} 更新后的点赞信息 {likes, likedByCurrentUser} 或 null
 */
async function toggleLike(postObjectId, username) {
    try {
        const query = new AV.Query('Post');
        const post = await query.get(postObjectId);

        const likedBy = post.get('likedBy') || [];
        let likes = post.get('likes') || 0;
        let likedByCurrentUser = false;

        const index = likedBy.indexOf(username);
        if (index !== -1) {
            // 已点赞，取消点赞
            likedBy.splice(index, 1);
            likes = Math.max(0, likes - 1);
        } else {
            // 未点赞，添加点赞
            likedBy.push(username);
            likes = likes + 1;
            likedByCurrentUser = true;
        }

        post.set('likedBy', likedBy);
        post.set('likes', likes);
        await post.save();

        return {
            likes: likes,
            likedByCurrentUser: likedByCurrentUser
        };
    } catch (e) {
        console.error('切换点赞失败:', e);
        return null;
    }
}

// ==================== 评论操作 ====================

/**
 * 获取帖子的评论列表
 * @param {string} postObjectId - 帖子 objectId
 * @returns {Promise<Array|null>} 评论数组或 null
 */
async function fetchComments(postObjectId) {
    try {
        // 构造指向帖子的 Pointer
        const postPointer = AV.Object.createWithoutData('Post', postObjectId);

        const query = new AV.Query('Comment');
        query.equalTo('post', postPointer);
        query.ascending('createdAt');

        const results = await query.find();

        const comments = [];
        for (let i = 0; i < results.length; i++) {
            const comment = results[i];
            comments.push({
                id: comment.id,
                avatar: comment.get('avatar') || '',
                username: comment.get('username') || '匿名',
                text: comment.get('text') || '',
                time: comment.createdAt.getTime(),
                objectId: comment.id
            });
        }

        return comments;
    } catch (e) {
        console.error('获取评论失败:', e);
        return null;
    }
}

/**
 * 添加评论
 * 创建评论对象并关联到帖子，同时将帖子的 commentCount 加 1
 * @param {string} postObjectId - 帖子 objectId
 * @param {string} text - 评论内容
 * @param {string} username - 用户名
 * @param {string} avatar - 用户头像
 * @returns {Promise<Object|null>} 新评论对象或 null
 */
async function addComment(postObjectId, text, username, avatar) {
    try {
        // 构造指向帖子的 Pointer
        const postPointer = AV.Object.createWithoutData('Post', postObjectId);

        // 创建评论
        const Comment = AV.Object.extend('Comment');
        const comment = new Comment();

        comment.set('post', postPointer);
        comment.set('text', text);
        comment.set('username', username);
        comment.set('avatar', avatar);

        const saved = await comment.save();

        // 帖子评论数 +1
        const post = AV.Object.createWithoutData('Post', postObjectId);
        post.increment('commentCount', 1);
        await post.save();

        return {
            id: saved.id,
            avatar: avatar || '',
            username: username || '匿名',
            text: text || '',
            time: saved.createdAt.getTime(),
            objectId: saved.id
        };
    } catch (e) {
        console.error('添加评论失败:', e);
        return null;
    }
}

// ==================== 聊天消息操作 ====================

/**
 * 获取聊天消息列表（按时间升序）
 * @param {number} [limit=50] - 消息数量上限
 * @returns {Promise<Array|null>} 消息数组或 null
 */
async function fetchChatMessages(limit) {
    try {
        limit = limit || 50;

        const query = new AV.Query('ChatMessage');
        query.ascending('createdAt');
        query.limit(limit);

        const results = await query.find();

        const messages = [];
        for (let i = 0; i < results.length; i++) {
            const msg = results[i];
            messages.push({
                id: msg.id,
                avatar: msg.get('avatar') || '',
                username: msg.get('username') || '匿名',
                text: msg.get('text') || '',
                time: msg.createdAt.getTime(),
                objectId: msg.id
            });
        }

        return messages;
    } catch (e) {
        console.error('获取聊天消息失败:', e);
        return null;
    }
}

/**
 * 发送聊天消息
 * @param {string} text - 消息内容
 * @param {string} username - 用户名
 * @param {string} avatar - 用户头像
 * @returns {Promise<Object|null>} 新消息对象或 null
 */
async function sendChatMessage(text, username, avatar) {
    try {
        const ChatMessage = AV.Object.extend('ChatMessage');
        const msg = new ChatMessage();

        msg.set('text', text);
        msg.set('username', username);
        msg.set('avatar', avatar);

        const saved = await msg.save();

        return {
            id: saved.id,
            avatar: avatar || '',
            username: username || '匿名',
            text: text || '',
            time: saved.createdAt.getTime(),
            objectId: saved.id
        };
    } catch (e) {
        console.error('发送聊天消息失败:', e);
        return null;
    }
}

// ==================== 导出 ====================

export {
    initLeanCloud,
    isLeanCloudConfigured,
    saveLeanCloudConfig,
    getLeanCloudConfig,
    fetchPosts,
    createPost,
    deletePost,
    toggleLike,
    fetchComments,
    addComment,
    fetchChatMessages,
    sendChatMessage
};

// 暴露关键配置函数到全局，供非模块脚本调用
window.initLeanCloud = initLeanCloud;
window.isLeanCloudConfigured = isLeanCloudConfigured;
window.saveLeanCloudConfig = saveLeanCloudConfig;
window.getLeanCloudConfig = getLeanCloudConfig;
