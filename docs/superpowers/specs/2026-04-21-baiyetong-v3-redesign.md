# 百业通 v3.0 全面重构设计文档

> 日期：2026-04-21
> 状态：已批准
> 方案：渐进式重构（方案A）

## 1. 项目概述

### 1.1 项目定位
「百业通」是一个面向普通用户（学生、转行者、求职者）的职业探索应用，帮助用户了解各行各业的工作内容、薪资水平、发展路径，并通过AI问答获得个性化职业建议。

### 1.2 重构目标
- **UI全面升级**：从面向心智障碍群体的简洁风格，升级为面向普通用户的现代职业百科风格
- **功能增强**：新增职业对比、收藏系统、多模型AI问答
- **安全加固**：XSS防护、CSP策略、API Key安全管理
- **部署上线**：Gitee Pages部署，PWA离线支持

### 1.3 技术约束
- 纯原生 HTML5 + CSS3 + JavaScript（无框架依赖）
- 纯静态架构，无后端服务
- 单页应用（SPA），通过CSS class切换页面
- 数据层复用现有JSON文件（jobs_cn.json、categories.json、achievements.json）
- PWA支持（Service Worker + manifest.json）

## 2. 架构设计

### 2.1 文件结构
```
star-workshop/
├── index.html              （单页入口，语义化HTML5）
├── manifest.json           （PWA配置）
├── sw.js                   （Service Worker v8）
├── css/
│   ├── design-tokens.css   （CSS变量：颜色/字体/间距/动效）
│   ├── base.css            （重置 + 排版 + 通用组件）
│   ├── layout.css          （页面布局 + 响应式网格）
│   └── pages.css           （各页面特定样式）
├── js/
│   ├── app.js              （入口 + 初始化）
│   ├── router.js           （SPA路由）
│   ├── data-loader.js      （JSON数据加载 + 查询API）
│   ├── state.js            （状态管理 + localStorage持久化）
│   ├── ai-engine.js        （多模型AI引擎）
│   ├── pages/
│   │   ├── home.js         （首页）
│   │   ├── explore.js      （职业浏览）
│   │   ├── compare.js      （职业对比）
│   │   ├── favorites.js    （收藏夹）
│   │   ├── ai-chat.js      （AI问答）
│   │   └── profile.js      （个人中心）
│   └── utils/
│       ├── ui.js           （Toast/Modal/动画）
│       ├── search.js       （搜索/筛选/排序）
│       └── storage.js      （localStorage封装）
└── js/data/
    ├── jobs_cn.json        （975→1600+职业数据）
    ├── categories.json     （8大类81中类）
    └── achievements.json   （成就系统）
```

### 2.2 数据流
```
JSON文件 → data-loader.js（fetch+解析） → 全局变量 + 查询API → 页面模块渲染
用户操作 → state.js（状态更新） → storage.js（localStorage持久化）
AI请求 → ai-engine.js（多模型适配） → 页面渲染
```

### 2.3 模块职责

| 模块 | 职责 | 依赖 |
|------|------|------|
| app.js | 应用入口，异步初始化，注册SW | data-loader, router, all pages |
| router.js | SPA路由，页面切换，底部导航 | state |
| data-loader.js | 加载JSON数据，提供查询API | 无 |
| state.js | 全局状态管理，localStorage读写 | storage |
| ai-engine.js | 多模型AI调用，统一接口 | storage |
| home.js | 首页渲染：搜索、推荐、分类入口 | data-loader, state |
| explore.js | 职业浏览：分类筛选、列表、详情 | data-loader, state, search |
| compare.js | 职业对比：并排对比+AI总结 | data-loader, ai-engine |
| favorites.js | 收藏管理：收藏/取消/分组 | state, storage |
| ai-chat.js | AI问答：多模型切换、对话管理 | ai-engine, state, storage |
| profile.js | 个人中心：统计、设置、主题切换 | state, storage |

## 3. 视觉设计

### 3.1 设计方向
**「现代职业百科」** — 专业但不冰冷，温暖但有力量

### 3.2 暗亮双模式

#### 暗色模式（默认）
- 背景：#1a1f36（深蓝灰）
- 卡片背景：#242b45
- 文字主色：#e8eaed
- 文字次色：#9aa0b8
- 强调色：#f59e0b（琥珀金）
- 强调色悬停：#fbbf24
- 成功色：#10b981
- 警告色：#ef4444
- 边框：rgba(255,255,255,0.08)

#### 亮色模式
- 背景：#f5f7fa
- 卡片背景：#ffffff
- 文字主色：#1a1f36
- 文字次色：#6b7280
- 强调色：#f59e0b（琥珀金）
- 强调色悬停：#d97706
- 成功色：#059669
- 警告色：#dc2626
- 边框：rgba(0,0,0,0.08)

### 3.3 字体
- 正文：'Noto Sans SC', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
- 代码/数字：'JetBrains Mono', 'Fira Code', monospace
- 字号层级：12px / 14px / 16px / 20px / 24px / 32px

### 3.4 间距系统
- 基础单位：4px
- 间距层级：4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64px

### 3.5 动效
- 页面切换：fadeIn(200ms) + slideUp(300ms)
- 卡片出现：stagger fadeInUp(100ms间隔)
- 列表过滤：fadeOut(150ms) → DOM更新 → fadeIn(150ms)
- 悬浮效果：scale(1.02) + shadow增强
- 主题切换：transition 300ms all

### 3.6 响应式断点
- 移动端：≤480px（默认，最大宽度480px居中）
- 平板端：481px-768px
- 桌面端：769px-1024px
- 大屏：≥1025px（最大宽度1200px居中）

## 4. 页面设计

### 4.1 首页（Home）
- **搜索栏**：固定顶部，全局搜索职业，实时联想下拉（最多10条）
- **快捷入口**：4个图标卡片横排（职业探索/AI问答/职业对比/我的收藏）
- **热门推荐**：横向滑动卡片（3-5个），展示推荐职业
- **八大类入口**：2×4网格，每个大类显示emoji图标+名称+职业数量
- **最近浏览**：列表显示最近查看过的5个职业

### 4.2 职业探索（Explore）
- **分类筛选**：顶部大类Tab（横向滚动）→ 中类Chip（可多选）
- **职业列表**：卡片式布局
  - 每张卡片：emoji图标 + 名称 + 简述（一行）+ 薪资标签
  - 支持搜索过滤 + 排序（名称/薪资/热度）
- **职业详情**（全屏模态页面）
  - 头部：大emoji + 名称 + 一句话描述
  - 概览卡片组：工作内容/工作环境/工作时间/薪资/适合人群/优缺点
  - 学习路径：5级进阶手风琴，每级4步骤
  - 底部操作栏：收藏按钮 + 分享按钮 + AI提问按钮

### 4.3 职业对比（Compare）— 新增
- 选择器：从收藏或搜索中添加2-3个职业
- 对比表格：并排展示各维度
  - 基本信息：名称/行业/薪资
  - 工作概况：内容/环境/时间
  - 适合人群/优缺点
- AI总结：调用AI生成对比分析和建议

### 4.4 收藏夹（Favorites）— 新增
- 收藏列表：卡片式，显示emoji+名称+收藏时间
- 空状态引导：提示去探索职业
- 操作：取消收藏、加入对比
- 数据持久化：localStorage

### 4.5 AI问答（AI Chat）
- **模型选择器**：顶部下拉，切换DeepSeek/通义千问/智谱GLM
- **API Key管理**：设置面板，每个模型独立配置Key
- **对话界面**：
  - 聊天气泡（用户右对齐金色，AI左对齐卡片色）
  - 打字指示器（三个跳动点）
  - 消息时间戳
- **快捷问题**：基于当前浏览职业动态生成
- **系统提示词**：注入职业数据摘要，限定回答范围
- **上下文**：保留最近10轮对话

### 4.6 个人中心（Profile）
- **学习统计**：已探索职业数 / 完成步骤数 / 学习天数 / 连续天数
- **收藏管理**：入口跳转到收藏页
- **主题切换**：暗色/亮色模式切换开关
- **AI设置**：入口跳转到AI Key配置
- **关于**：版本号、项目介绍
- **清除数据**：确认弹窗后清除所有本地数据

### 4.7 底部导航
5个Tab：首页 | 职业探索 | AI问答 | 收藏 | 我的

## 5. AI多模型引擎

### 5.1 支持的模型

| 模型 | API地址 | 模型名 | 免费额度 |
|------|---------|--------|----------|
| DeepSeek | https://api.deepseek.com/chat/completions | deepseek-chat | 新用户赠送 |
| 通义千问 | https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions | qwen-turbo | 有免费额度 |
| 智谱GLM | https://open.bigmodel.cn/api/paas/v4/chat/completions | glm-4-flash | 有免费额度 |

### 5.2 统一调用接口
```javascript
async function callAI(modelId, messages) {
    const config = AI_MODELS[modelId];
    const apiKey = getApiKey(modelId); // from localStorage
    const response = await fetch(config.apiUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
            model: config.model,
            messages: messages,
            max_tokens: config.maxTokens,
            temperature: 0.7
        })
    });
    // 统一错误处理
    if (!response.ok) {
        throw new AIError(response.status, modelId);
    }
    return response.json();
}
```

### 5.3 系统提示词
```
你是「百业通」AI职业顾问。你拥有975个职业的详细数据，涵盖8大行业类别。
请根据用户的问题，提供专业、实用的职业建议。
回答要求：
1. 基于你了解的职业数据回答，不编造不存在的职业
2. 回答简洁实用，适合普通用户理解
3. 涉及薪资时说明是参考范围
4. 建议具体可行，避免空泛
```

## 6. 安全设计

### 6.1 XSS防护
- 所有动态内容通过 `textContent` 渲染，不使用 `innerHTML` 插入用户输入
- AI返回内容通过DOMPurify或自定义sanitize函数清理后再渲染
- 搜索输入长度限制为50字符

### 6.2 CSP策略
```html
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               script-src 'self';
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
               font-src 'self' https://fonts.gstatic.com;
               connect-src 'self' https://api.deepseek.com https://dashscope.aliyuncs.com https://open.bigmodel.cn;
               img-src 'self' data:;">
```

### 6.3 API Key安全
- Key仅存储在用户本地localStorage
- 永不上传到任何第三方服务器（仅发送到对应的AI API）
- 提供清除Key功能
- Key在设置面板中以密码形式显示（默认掩码）

### 6.4 数据安全
- localStorage数据按命名空间隔离：`byt_` 前缀
- 敏感数据（API Key）单独存储，不随导出功能泄露

## 7. PWA与部署

### 7.1 Service Worker策略
- **缓存版本**：`baiyetong-v8`
- **JSON数据**：网络优先 + 缓存回退（确保数据最新）
- **JS/CSS/HTML**：缓存优先 + 版本更新时刷新
- **安装阶段**：预缓存核心资源（不含大JSON，JSON按需缓存）
- **离线回退**：缓存中的index.html

### 7.2 Gitee Pages部署
1. 创建Gitee仓库 `baiyetong`
2. 推送代码到 `main` 分支
3. Gitee后台 → Pages → 部署分支选 `main`，目录选 `/`
4. 访问地址：`https://<username>.gitee.io/baiyetong/`
5. 可选：绑定自定义域名

### 7.3 性能优化
- JSON数据懒加载：首页不加载完整jobs_cn.json，仅加载categories.json
- 职业详情按需加载：点击职业时才从jobs_cn.json中获取
- 图片：使用emoji代替图片，零网络请求
- CSS/JS：合并压缩，Gzip压缩
- 字体：使用系统字体栈为主，Noto Sans SC按需加载

## 8. 数据扩展计划

### 8.1 职业数量目标
- 当前：975个职业
- 目标：1600+个职业
- 扩展策略：补充薄弱中类 + 新增新兴职业（AI相关、新能源、数字经济等）

### 8.2 数据质量
- 每个职业包含：id、name、icon、desc、overview（7个维度）、levels（5级×4步骤）
- 确保所有中类至少5个职业
- 薪资数据标注参考范围

## 9. 实施阶段

### 阶段1：UI重构
1. CSS设计系统（design-tokens + base + layout）
2. index.html重构（语义化HTML5 + 暗亮双模式）
3. 首页重写
4. 职业探索页重写
5. 个人中心重写

### 阶段2：功能增强
1. AI多模型引擎
2. AI问答页重写
3. 收藏系统
4. 职业对比功能
5. 搜索优化

### 阶段3：部署上线
1. 安全加固（CSP、XSS防护、Key安全）
2. Service Worker优化
3. 性能优化（懒加载、压缩）
4. Gitee Pages部署
5. 测试验证
