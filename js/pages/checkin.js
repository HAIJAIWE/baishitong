// ==================== checkin.js - 签到与积分页面 ====================
// 百事通 v1.0
// 安全原则：所有动态内容用 textContent 渲染

import { clearContainer, createEl, showToast } from '../utils/ui.js';
import { icon } from '../utils/icons.js';
import { playSuccess } from '../utils/sound.js';
import {
    getCheckinInfo, hasCheckedInToday, doCheckin,
    getLevelConfig, calcLevel, getPointRewards,
    getCheckinCalendar
} from '../state.js';

let currentYear, currentMonth;

/**
 * 初始化签到页面
 */
export function initCheckin() {
    const container = document.getElementById('page-checkin');
    if (!container) return;

    clearContainer(container);
    const now = new Date();
    currentYear = now.getFullYear();
    currentMonth = now.getMonth();
    renderCheckin(container);
}

window.initCheckin = initCheckin;

/**
 * 渲染签到页面
 * @param {HTMLElement} container
 */
function renderCheckin(container) {
    const info = getCheckinInfo();
    const levelInfo = calcLevel(info.points);
    const nextLevel = getLevelConfig().find(function(l) { return l.level === levelInfo.level + 1; });
    const checkedToday = hasCheckedInToday();

    // 1. 用户等级卡片
    const levelCard = createEl('div', 'checkin-level-card');
    renderLevelCard(levelCard, info, levelInfo, nextLevel, checkedToday);
    container.appendChild(levelCard);

    // 2. 签到按钮
    const checkinSection = createEl('div', 'checkin-action');
    renderCheckinButton(checkinSection, checkedToday, info.streak);
    container.appendChild(checkinSection);

    // 3. 连续签到奖励预览
    const streakSection = createEl('div', 'checkin-streak-preview');
    renderStreakPreview(streakSection, info.streak);
    container.appendChild(streakSection);

    // 4. 签到日历
    const calendarSection = createEl('div', 'checkin-calendar-section');
    renderCalendar(calendarSection);
    container.appendChild(calendarSection);

    // 5. 积分获取途径
    const rewardsSection = createEl('div', 'checkin-rewards');
    renderPointRewards(rewardsSection);
    container.appendChild(rewardsSection);
}

/**
 * 渲染等级卡片
 */
function renderLevelCard(card, info, levelInfo, nextLevel, checkedToday) {
    // 等级图标和名称
    const levelHeader = createEl('div', 'level-header');

    const levelIcon = createEl('div', 'level-icon');
    levelIcon.textContent = levelInfo.icon;

    const levelInfo2 = createEl('div', 'level-info');

    const levelName = createEl('div', 'level-name');
    levelName.textContent = levelInfo.name;

    const levelNum = createEl('div', 'level-num');
    levelNum.textContent = 'Lv.' + levelInfo.level;

    levelInfo2.appendChild(levelName);
    levelInfo2.appendChild(levelNum);
    levelHeader.appendChild(levelIcon);
    levelHeader.appendChild(levelInfo2);
    card.appendChild(levelHeader);

    // 积分进度条
    const progressSection = createEl('div', 'level-progress');

    const pointsLabel = createEl('div', 'points-label');
    const pointsCurrent = createEl('span', 'points-current');
    pointsCurrent.textContent = info.points + ' 积分';
    pointsLabel.appendChild(pointsCurrent);

    if (nextLevel) {
        const pointsNext = createEl('span', 'points-next');
        pointsNext.textContent = ' / ' + nextLevel.minPoints;
        pointsLabel.appendChild(pointsNext);
    }

    progressSection.appendChild(pointsLabel);

    if (nextLevel) {
        const progressBar = createEl('div', 'progress-bar');
        const progressFill = createEl('div', 'progress-fill');
        const percent = Math.min(100, Math.round((info.points / nextLevel.minPoints) * 100));
        progressFill.style.width = percent + '%';
        progressBar.appendChild(progressFill);
        progressSection.appendChild(progressBar);

        const progressHint = createEl('div', 'progress-hint');
        progressHint.textContent = '距离 ' + nextLevel.name + ' 还需 ' + (nextLevel.minPoints - info.points) + ' 积分';
        progressSection.appendChild(progressHint);
    } else {
        const maxHint = createEl('div', 'progress-hint');
        maxHint.textContent = '已达最高等级！';
        progressSection.appendChild(maxHint);
    }

    card.appendChild(progressSection);

    // 统计数据
    const statsRow = createEl('div', 'checkin-stats');

    const statItems = [
        { label: '累计签到', value: info.checkinDates ? info.checkinDates.length : 0, iconName: 'calendar' },
        { label: '连续签到', value: info.streak + '天', iconName: 'flame' },
        { label: '最长连续', value: info.maxStreak + '天', iconName: 'zap' },
        { label: '累计积分', value: info.totalPoints, iconName: 'coins' }
    ];

    statItems.forEach(function(item) {
        const stat = createEl('div', 'checkin-stat');
        const statIcon = createEl('div', 'stat-icon');
        statIcon.appendChild(icon(item.iconName, 20, 'var(--accent)'));
        const statValue = createEl('div', 'stat-value');
        statValue.textContent = item.value;
        const statLabel = createEl('div', 'stat-label');
        statLabel.textContent = item.label;
        stat.appendChild(statIcon);
        stat.appendChild(statValue);
        stat.appendChild(statLabel);
        statsRow.appendChild(stat);
    });

    card.appendChild(statsRow);
}

/**
 * 渲染签到按钮
 */
function renderCheckinButton(section, checkedToday, streak) {
    const btn = createEl('button', 'checkin-btn' + (checkedToday ? ' checked' : ''));

    if (checkedToday) {
        btn.appendChild(icon('check', 18));
        btn.appendChild(document.createTextNode(' 今日已签到'));
        btn.disabled = true;
    } else {
        btn.appendChild(icon('target', 18));
        btn.appendChild(document.createTextNode(' 立即签到'));
        btn.addEventListener('click', function() {
            const result = doCheckin();
            if (result.success) {
                playSuccess();
                showToast(result.message, 'success', 3000);

                // 检查升级
                if (result.level) {
                    setTimeout(function() {
                        const span = document.createElement('span');
                        span.appendChild(icon('sparkles', 16, 'var(--accent)'));
                        span.appendChild(document.createTextNode(' 恭喜达到 ' + result.level.name + '！'));
                        showToast(span, 'success', 4000);
                    }, 1500);
                }

                // 重新渲染页面
                const container = document.getElementById('page-checkin');
                if (container) {
                    clearContainer(container);
                    renderCheckin(container);
                }
            } else {
                showToast(result.message, 'warning');
            }
        });
    }

    section.appendChild(btn);
}

/**
 * 渲染连续签到奖励预览
 */
function renderStreakPreview(section, currentStreak) {
    const title = createEl('h3', 'section-title');
    title.appendChild(icon('flame', 18));
    title.appendChild(document.createTextNode(' 连续签到奖励'));
    section.appendChild(title);

    const rewards = getPointRewards();
    const streakDays = [1, 2, 3, 4, 5, 6, 7];

    const streakGrid = createEl('div', 'streak-grid');

    streakDays.forEach(function(day) {
        const item = createEl('div', 'streak-item' + (currentStreak >= day ? ' achieved' : '') + (currentStreak === day ? ' current' : ''));

        const dayLabel = createEl('div', 'streak-day');
        dayLabel.textContent = '第' + day + '天';

        const bonus = rewards.streakBonus[day] || 0;
        const bonusLabel = createEl('div', 'streak-bonus');
        bonusLabel.textContent = bonus > 0 ? '+' + bonus : '-';

        const checkIcon = createEl('div', 'streak-check');
        checkIcon.textContent = currentStreak >= day ? '✓' : '';

        item.appendChild(dayLabel);
        item.appendChild(bonusLabel);
        item.appendChild(checkIcon);
        streakGrid.appendChild(item);
    });

    // 7天以上
    const extraItem = createEl('div', 'streak-item' + (currentStreak >= 7 ? ' achieved' : ''));
    const extraDay = createEl('div', 'streak-day');
    extraDay.textContent = '7天+';
    const extraBonus = createEl('div', 'streak-bonus');
    extraBonus.textContent = '+50';
    const extraCheck = createEl('div', 'streak-check');
    extraCheck.textContent = currentStreak >= 7 ? '✓' : '';
    extraItem.appendChild(extraDay);
    extraItem.appendChild(extraBonus);
    extraItem.appendChild(extraCheck);
    streakGrid.appendChild(extraItem);

    section.appendChild(streakGrid);
}

/**
 * 渲染签到日历
 */
function renderCalendar(section) {
    const title = createEl('h3', 'section-title');
    title.appendChild(icon('calendar', 18));
    title.appendChild(document.createTextNode(' 签到日历'));
    section.appendChild(title);
    const nav = createEl('div', 'calendar-nav');

    const prevBtn = createEl('button', 'calendar-nav-btn');
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        refreshCalendar();
    });

    const monthLabel = createEl('div', 'calendar-month');
    monthLabel.textContent = currentYear + '年' + (currentMonth + 1) + '月';

    const nextBtn = createEl('button', 'calendar-nav-btn');
    nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        refreshCalendar();
    });

    nav.appendChild(prevBtn);
    nav.appendChild(monthLabel);
    nav.appendChild(nextBtn);
    section.appendChild(nav);

    // 日历网格
    const grid = createEl('div', 'calendar-grid');

    // 星期头
    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(function(wd) {
        const cell = createEl('div', 'calendar-cell weekday');
        cell.textContent = wd;
        grid.appendChild(cell);
    });

    // 计算当月天数和起始星期
    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const checkedDates = getCheckinCalendar(currentYear, currentMonth);
    const today = new Date();

    // 空白填充
    for (let i = 0; i < firstDay; i++) {
        const empty = createEl('div', 'calendar-cell empty');
        grid.appendChild(empty);
    }

    // 日期
    for (let d = 1; d <= daysInMonth; d++) {
        const cell = createEl('div', 'calendar-cell');
        const dayNum = createEl('span', 'day-num');
        dayNum.textContent = d;
        cell.appendChild(dayNum);

        const isChecked = checkedDates.indexOf(d) !== -1;
        const isToday = (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d);

        if (isChecked) {
            cell.classList.add('checked');
            const dot = createEl('span', 'check-dot');
            dot.textContent = '✓';
            cell.appendChild(dot);
        }
        if (isToday) {
            cell.classList.add('today');
        }

        grid.appendChild(cell);
    }

    section.appendChild(grid);
}

/**
 * 刷新日历（切换月份）
 */
function refreshCalendar() {
    const section = document.querySelector('.checkin-calendar-section');
    if (!section) return;

    // 清除旧内容
    while (section.firstChild) {
        section.removeChild(section.firstChild);
    }

    const title = document.createElement('h3');
    title.className = 'section-title';
    title.appendChild(icon('calendar', 18));
    title.appendChild(document.createTextNode(' 签到日历'));
    section.appendChild(title);

    // 重新渲染导航和网格
    const nav = document.createElement('div');
    nav.className = 'calendar-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'calendar-nav-btn';
    prevBtn.textContent = '◀';
    prevBtn.addEventListener('click', function() {
        currentMonth--;
        if (currentMonth < 0) { currentMonth = 11; currentYear--; }
        refreshCalendar();
    });

    const monthLabel = document.createElement('div');
    monthLabel.className = 'calendar-month';
    monthLabel.textContent = currentYear + '年' + (currentMonth + 1) + '月';

    const nextBtn = document.createElement('button');
    nextBtn.className = 'calendar-nav-btn';
    nextBtn.textContent = '▶';
    nextBtn.addEventListener('click', function() {
        currentMonth++;
        if (currentMonth > 11) { currentMonth = 0; currentYear++; }
        refreshCalendar();
    });

    nav.appendChild(prevBtn);
    nav.appendChild(monthLabel);
    nav.appendChild(nextBtn);
    section.appendChild(nav);

    const grid = document.createElement('div');
    grid.className = 'calendar-grid';

    const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
    weekdays.forEach(function(wd) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell weekday';
        cell.textContent = wd;
        grid.appendChild(cell);
    });

    const firstDay = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const checkedDates = getCheckinCalendar(currentYear, currentMonth);
    const today = new Date();

    for (let i = 0; i < firstDay; i++) {
        const empty = document.createElement('div');
        empty.className = 'calendar-cell empty';
        grid.appendChild(empty);
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-cell';
        const dayNum = document.createElement('span');
        dayNum.className = 'day-num';
        dayNum.textContent = d;
        cell.appendChild(dayNum);

        const isChecked = checkedDates.indexOf(d) !== -1;
        const isToday = (today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === d);

        if (isChecked) {
            cell.classList.add('checked');
            const dot = document.createElement('span');
            dot.className = 'check-dot';
            dot.textContent = '✓';
            cell.appendChild(dot);
        }
        if (isToday) {
            cell.classList.add('today');
        }

        grid.appendChild(cell);
    }

    section.appendChild(grid);
}

/**
 * 渲染积分获取途径
 */
function renderPointRewards(section) {
    const title = createEl('h3', 'section-title');
    title.appendChild(icon('coins', 18));
    title.appendChild(document.createTextNode(' 积分获取途径'));
    section.appendChild(title);

    const rewards = getPointRewards();
    const items = [
        { action: 'dailyCheckin', label: '每日签到', desc: '每天签到获得积分' },
        { action: 'exploreJob', label: '探索职业', desc: '查看职业详情' },
        { action: 'favoriteJob', label: '收藏职业', desc: '收藏感兴趣的职业' },
        { action: 'aiQuestion', label: 'AI 提问', desc: '向 AI 提问一次' },
        { action: 'communityPost', label: '发布帖子', desc: '在社区分享内容' },
        { action: 'communityComment', label: '发表评论', desc: '参与社区讨论' },
        { action: 'achievementUnlock', label: '解锁成就', desc: '达成成就条件' },
        { action: 'compareJobs', label: '职业对比', desc: '对比不同职业' }
    ];

    const list = createEl('div', 'reward-list');

    items.forEach(function(item) {
        const row = createEl('div', 'reward-item');

        const rewardLabel = createEl('div', 'reward-label');
        const rewardName = createEl('span', 'reward-name');
        rewardName.textContent = item.label;
        const rewardDesc = createEl('span', 'reward-desc');
        rewardDesc.textContent = item.desc;
        rewardLabel.appendChild(rewardName);
        rewardLabel.appendChild(rewardDesc);

        const rewardPoints = createEl('div', 'reward-points');
        rewardPoints.textContent = '+' + (rewards[item.action] || 0);

        row.appendChild(rewardLabel);
        row.appendChild(rewardPoints);
        list.appendChild(row);
    });

    section.appendChild(list);
}
