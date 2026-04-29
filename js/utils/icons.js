// ==================== icons.js - Lucide 图标工具 ====================
// 使用 lucide 图标库替代 emoji，提供统一的精致图标
// 用法: import { icon } from '../utils/icons.js'; icon('search', 20)

import { createEl } from './ui.js';

// 预加载常用图标 SVG 路径
const ICON_PATHS = {
    // 首页 & 导航
    home: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z',
    search: 'M11 3a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM21 21l-4.35-4.35',
    bot: 'M12 8V4H8',
    messageCircle: 'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8.9H3l1.9-1.9A8.5 8.5 0 0 1 2.5 11a8.38 8.38 0 0 1 .9-3.8 8.5 8.5 0 0 1 7.6-4.7 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
    users: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2',
    target: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
    user: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    compass: 'M16.5 2.5c5.52 0 10 4.48 10 10s-4.48 10-10 10-10-4.48-10-10 4.48-10 10-10z M2 12l10-10 2 8-8 2z',
    briefcase: 'M16 20V4H8v16 M2 8h20v10H2z',
    scale: 'M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z M7 21h10 M12 3v18 M3 7l2 9 M21 7l-2 9',
    puzzle: 'M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47 0-.905-.187-1.233-.516l-.447-.447a1.06 1.06 0 0 0-.754-.315c-.285 0-.559.113-.754.315l-1.568 1.568c-.47.47-.706 1.087-.706 1.704s.235 1.233.706 1.704l1.611 1.611a.98.98 0 0 1 .276.837c0 .47-.187.905-.516 1.233l-.447.447a1.06 1.06 0 0 0-.315.754c0 .285.113.559.315.754l1.568 1.568c.47.47 1.087.706 1.704.706s1.233-.235 1.704-.706l1.611-1.611a.98.98 0 0 1 .837-.276c.47 0 .905.187 1.233.516l.447.447c.196.196.469.315.754.315s.559-.113.754-.315l1.568-1.568c.47-.47.706-1.087.706-1.704s-.235-1.233-.706-1.704l-1.611-1.611a.98.98 0 0 1-.276-.837c0-.47.187-.905.516-1.233l.447-.447a1.06 1.06 0 0 0 .315-.754c0-.285-.113-.559-.315-.754l-1.568-1.568a2.41 2.41 0 0 1-.706-1.704c0-.617.235-1.233.706-1.704l1.611-1.611a.98.98 0 0 1 .837-.276c.47 0 .905.187 1.233.516l.447.447c.196.196.469.315.754.315s.559-.113.754-.315',
    heart: 'M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z',
    calendar: 'M19 4H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2z M16 2v4 M8 2v4 M3 10h18',
    clock: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2',
    check: 'M20 6L9 17l-5-5',
    chevronRight: 'M9 18l6-6-6-6',
    chevronLeft: 'M15 18l-6-6 6-6',
    chevronDown: 'M6 9l6 6 6-6',
    arrowRight: 'M5 12h14 M12 5l7 7-7 7',
    x: 'M18 6L6 18 M6 6l12 12',
    plus: 'M12 5v14 M5 12h14',
    star: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z',
    bookmark: 'M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z',
    share2: 'M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8 M16 6l-4-4-4 4 M12 2v13',
    settings: 'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
    award: 'M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6.5 6.5 0 0 0 7.5 2 11 11 0 0 0 3 8.5c1 1.3 1.5 2.8 1.5 4.5 0 1.5.5 2.5 1.5 3 .5.3 1 .5 1.5.5',
    trendingUp: 'M23 6l-9.5 9.5-5-5L1 18',
    zap: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z',
    building: 'M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18z M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2 M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2 M10 6h4 M10 10h4 M10 14h4 M10 18h4',
    factory: 'M2 20a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8l-7 5V8l-7 5V4a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z M17 18h1 M12 18h1 M7 18h1',
    graduationCap: 'M22 10v6M2 10l10-5 10 5-10 5z M6 12v5c0 2 6 3 6 3s6-1 6-3v-5',
    bookOpen: 'M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z',
    lightbulb: 'M9 18h6 M10 22h4 M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z',
    shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
    brain: 'M12 5a3 3 0 1 0-5.99.13A4 4 0 0 0 2 9a4 4 0 0 0 .22 1.31A3.5 3.5 0 0 0 3 14.5V17a1 1 0 0 0 1 1h4v1a2 2 0 0 0 4 0v-1h4a1 1 0 0 0 1-1v-2.5a3.5 3.5 0 0 0 .78-4.19A4 4 0 0 0 22 9a4 4 0 0 0-4.01-3.87A3 3 0 0 0 12 5z',
    flame: 'M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 2-2.5 3.5-1 5 1 .5.5 1.5 1 2.5-1.5 1-2.5.5-3 1-1 1.5-2 2.5-2 4 0 2.5 2 4.5 4 4.5s4-2 4-4.5c0-1.5-1-3-2-4z',
    gift: 'M20 12v10H4V12 M2 7h20v5H2z M12 22V7 M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z',
    circleDot: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 12a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    layoutGrid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    folder: 'M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z',
    globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M2 12h20 M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1-4-10z',
    sparkles: 'M12 3l1.912 5.813a2 2 0 0 0 1.275 1.275L21 12l-5.813 1.912a2 2 0 0 0-1.275 1.275L12 21l-1.912-5.813a2 2 0 0 0-1.275-1.275L3 12l5.813-1.912a2 2 0 0 0 1.275-1.275L12 3z',
    barChart3: 'M3 3v18h18 M7 16V8 M11 16V11 M15 16v-3 M19 16v-7',
    refreshCw: 'M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15',
    eye: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    filter: 'M22 3H2l8 9.46V19l4 2v-8.54L22 3z',
    mapPin: 'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
    coffee: 'M18 8h1a4 4 0 0 1 0 8h-1 M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z M6 1v3 M10 1v3 M14 1v3',
    music: 'M9 18V5l12-2v13 M9 18c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z M21 16c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z',
    camera: 'M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z M12 17a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
    penTool: 'M12 19l7-7 3 3-7 7-3-3z M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z M2 2l7.586 7.586 M13 13l4 4',
    code: 'M16 18l6-6-6-6 M8 6l-6 6 6 6',
    database: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M2 12h20 M2 12c0 3.87 4.48 7 10 7s10-3.13 10-7 M2 12c0-3.87 4.48-7 10-7s10 3.13 10 7',
    stethoscope: 'M4.8 2.3A2 2 0 0 0 4 4v6a8 8 0 0 0 16 0V4a2 2 0 0 0-.8-1.7 M8 22h8 M12 18a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    gavel: 'M14.5 2.5l5 5 M9.5 7.5l5 5 M4.5 12.5l5 5 M2 20l2-2 2 2 M6 22l2-2 2 2 M14 4l-2 2 M9 9l-2 2 M4 14l-2 2',
    rocket: 'M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 0 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0 M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5',
    landPlot: 'M2 22V8l5 3V2l5 3V2l5 3v17 M22 22H2',
    ship: 'M2 21c.6.5 1.2 1.8 1.8 3 1.8s2.4-.6 3-1.8c.6.5 1.8 1.8 3 1.8s2.4-.6 3-1.8c.6.5 1.8 1.8 3 1.8s2.4-.6 3-1.8 M12 12V2 M8 8l4-6 4 6 M2 16h20 M6 12l-4 4 M18 12l4 4',
    shieldCheck: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z M9 12l2 2 4-4',
    clipboardList: 'M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2 M12 2a2 2 0 0 1 2 2v0a2 2 0 0 1-2 2h0a2 2 0 0 1-2-2v0a2 2 0 0 1 2-2z M8 10h8 M8 14h8 M8 18h4',
    wallet: 'M21 12V7H5a2 2 0 0 1 0-4h14v4 M3 5v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5 M18 12a2 2 0 0 0 0 4',
    coins: 'M8 7a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M16 15a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M2 12h20 M12 2v20',
    timer: 'M10 2h4 M12 14l2-2 M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
    history: 'M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8 M3 3v5h5',
    flag: 'M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z M4 22l-1-7',
    trophy: 'M6 9H4.5a2.5 2.5 0 0 1 0-5C7 2 9 6 9 6 M18 9h1.5a2.5 2.5 0 0 0 0-5C17 2 15 6 15 6 M12 2L9 9l-3 13h12L15 9z',
    medal: 'M12 15a5 5 0 1 0 0-10 5 5 0 0 0 0 10z M8.5 2l-2.5 8 6 2 6-2-2.5-8h-7z',
    sun: 'M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M6.34 17.66l-1.41 1.41 M19.07 4.93l-1.41 1.41 M12 6a6 6 0 1 0 0 12 6 6 0 0 0 0-12z',
    moon: 'M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z',
    info: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 16v-4 M12 8h.01',
    alertTriangle: 'M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01',
    checkCircle: 'M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4L12 14.01l-3-3',
    xCircle: 'M22 12h-4 M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M15 9l-6 6 M9 9l6 6',
    helpCircle: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
    searchCode: 'M21 12l-9-9-9 9 M3 12h18',
    gitBranch: 'M6 3v12 M18 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M18 9a9 9 0 0 1-9 9',
    link: 'M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71 M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71',
    externalLink: 'M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6 M15 3h6v6 M10 14L21 3',
    download: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
    upload: 'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
    copy: 'M20 9h-9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2z M3 15h9a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2H3a2 2 0 0 0-2 2v4a2 2 0 0 0 2 2z',
    trash2: 'M3 6h18 M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6 M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2 M10 11v6 M14 11v6',
    edit: 'M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7 M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z',
    send: 'M22 2L11 13 M22 2l-7 20-4-9-9-4z',
    menu: 'M3 12h18 M3 6h18 M3 18h18',
    grid: 'M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z',
    list: 'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
    layers: 'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
    activity: 'M22 12h-4l-3 9L9 3l-3 9H2',
    pieChart: 'M21.21 15.89A10 10 0 1 1 8 2.83 M22 12A10 10 0 0 0 12 2v10z',
    fileText: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8',
    megaphone: 'M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z',
    handshake: 'M20 17l-2-2 M4 17l2-2 M12 19l-2-2 2-2 M2 9l10-7 10 7-5 7-5-7-5 7z',
    sprout: 'M7 20h10 M12 20v-8 M12 12C8 12 4 8 4 4c4 0 8 4 8 8z M12 12c4 0 8-4 8-8-4 0-8 4-8 8z',
    flask: 'M9 3h6 M10 9V3h4v6l5 8.5a2 2 0 0 1-1.7 3H6.7a2 2 0 0 1-1.7-3L10 9z',
    wrench: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    plane: 'M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z',
    palette: 'M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.1-.7-.4-1-.2-.3-.4-.6-.4-1 0-.8.7-1.5 1.5-1.5H16c3.3 0 6-2.7 6-6 0-5.5-4.5-9-10-9z M8 13a1 1 0 1 1 0-2 1 1 0 0 1 0 2z M5 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z M11 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z M16 7a1 1 0 1 1 0-2 1 1 0 0 1 0 2z M19 10a1 1 0 1 1 0-2 1 1 0 0 1 0 2z',
    library: 'M12 2v20 M2 7h10v15H2z M22 7H12v15h10z M4 2v3 M8 2v3 M16 2v3 M20 2v3',
    cpu: 'M6 4h12a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z M9 1v3 M15 1v3 M9 20v3 M15 20v3 M20 9h3 M20 15h3 M1 9h3 M1 15h3 M9 9h6v6H9z',
    network: 'M16.5 18c.8 0 1.5.7 1.5 1.5S17.3 21 16.5 21 15 20.3 15 19.5s.7-1.5 1.5-1.5z M7.5 18c.8 0 1.5.7 1.5 1.5S8.3 21 7.5 21 6 20.3 6 19.5 6.7 18 7.5 18z M12 6c.8 0 1.5.7 1.5 1.5S12.8 9 12 9s-1.5-.7-1.5-1.5S11.2 6 12 6z M12 2v4 M12 9v2 M5.5 15.5L10 11 M18.5 15.5L14 11',
    shoppingBag: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z M3 6h18 M16 10a4 4 0 0 1-8 0',
    truck: 'M1 3h15v13H1z M16 8h4l3 3v5h-7V8z M5.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z M18.5 18.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
    monitor: 'M8 21h8 M12 17v4 M4 4h16a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    trees: 'M12 22V8 M5 12l7-10 7 10 M5 12h14 M3 22h18',
    tool: 'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z',
    scissors: 'M6 9a3 3 0 0 0 0 6 M18 9a3 3 0 0 1 0 6 M6 15l12-12 M6 9l12 12',
    paw: 'M12 22c-4 0-8-2-8-6 0-3 2-5 4-7l2-2 2 2c2 2 4 4 4 7 0 4-4 6-8 6z M8 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M16 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z M10 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M14 16a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
    hammer: 'M15 12l-8.5 8.5a2.83 2.83 0 1 1-4-4L11 8 M18 5l-3-3 M22 9l-3-3 M2 22l4-4',
    drama: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M8 12a4 4 0 0 1 8 0 M9 9h.01 M15 9h.01',
    wheat: 'M2 22l10-10 M12 12l4-4 M16 8l4-4 M12 16l-4 4 M8 20l-4 4 M14 8l2-2 M10 14l2-2',
    beef: 'M8 2h8l2 4-2 4H8L6 6z M6 10l-2 4 2 4h12l2-4-2-4 M10 18v4 M14 18v4',
    fish: 'M6 12s0-8 8-10c0 0-3 4-3 10s3 10 3 10c-8-2-8-10-8-10z M2 12h2 M20 12h2 M18 8l2-2 M18 16l2 2',
    tractor: 'M10 12V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4 M18 12v4a2 2 0 0 1-2 2h-2 M6 18a4 4 0 0 1 4-4 M6 18a4 4 0 0 0 4 4 M2 18h4 M6 14v8',
    cog: 'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z',
    anvil: 'M4 14h16v4H4z M6 18h12v2a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-2z M2 10l4 4h12l4-4 M10 2v8 M14 4v6',
    car: 'M5 17h14v-5l-2-5H7L5 12v5z M5 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M19 17a2 2 0 1 0 0 4 2 2 0 0 0 0-4z M9 17h6 M7 7l3-3 M17 7l-3-3',
    circuitBoard: 'M4 4h16v16H4z M4 12h16 M12 4v16 M8 8h8 M8 16h8 M2 8h2 M2 16h2 M20 8h2 M20 16h2 M8 2v2 M16 2v2 M8 20v2 M16 20v2',
    gauge: 'M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z M12 6v6l4 2 M18 12h-2',
    pill: 'M4.5 19.5l15-15a4.95 4.95 0 0 1 7 7l-15 15a4.95 4.95 0 0 1-7-7z M12 8l4 4',
    hardHat: 'M2 18h20 M4 18v-2a8 8 0 0 1 16 0v2 M12 4v2 M9 6h6',
    pickaxe: 'M14.5 2.5l5 5 M4 13l5 5 M9.5 7.5l5 5 M2 11l5 5 M7 16l5-5 M12 21l5-5',
    package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01l8.73-5.05 M12 22.08V12',
    axe: 'M14.5 2.5l5 5 M4 13l5 5 M9.5 7.5l5 5 M2 11l5 5 M7 16l5-5 M12 21l5-5',
    paintbrush: 'M18.37 2.63a2.12 2.12 0 0 1 3 3L14 13l-4 1 1-4z M7 21l-3-3 M12 16l-5 5 M5 11l-3-3',
    anchor: 'M12 8v8 M5 12H2a10 10 0 0 0 20 0h-3 M12 22a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    smile: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z M8 14s1.5 2 4 2 4-2 4-2 M9 9h.01 M15 9h.01',
    smartphone: 'M12 18h.01M8 21h8a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2z',
    crown: 'M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7z',
    tv: 'M9.5 2h5M2 7h20M4 7v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7 M12 17a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
    circle: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z',
    lock: 'M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z M7 11V7a5 5 0 0 1 10 0v4',
    key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
    cloud: 'M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z',
    rainbow: 'M12 2a10 10 0 0 0 0 20 10 10 0 0 0 0-20z M12 2v20 M2 12h20 M4.93 4.93l14.14 14.14 M19.07 4.93L4.93 19.07',
    thumbsUp: 'M7 10v12 M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88z',
    doorOpen: 'M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z M13 2v7 M13 9h2',
    volume2: 'M11 5L6 9H2v6h4l5 4V5z M19.07 4.93a10 10 0 0 1 0 14.14 M15.54 8.46a5 5 0 0 1 0 7.07'
};

/**
 * 创建 SVG 图标元素
 * @param {string} name - 图标名称
 * @param {number} [size=20] - 图标大小
 * @param {string} [color] - 图标颜色（默认继承）
 * @param {number} [strokeWidth=2] - 线条粗细
 * @returns {HTMLElement}
 */
export function icon(name, size, color, strokeWidth) {
    size = size || 20;
    strokeWidth = strokeWidth || 2;
    var path = ICON_PATHS[name];
    if (!path) return createEl('span', '');

    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', size);
    svg.setAttribute('height', size);
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', color || 'currentColor');
    svg.setAttribute('stroke-width', strokeWidth);
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.style.cssText = 'display:inline-block;vertical-align:middle;flex-shrink:0;';

    var pathEl = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathEl.setAttribute('d', path);
    svg.appendChild(pathEl);

    return svg;
}

/**
 * 创建带背景的图标按钮
 * @param {string} name - 图标名称
 * @param {string} bgColor - 背景色
 * @param {number} [iconSize=20] - 图标大小
 * @param {number} [bgSize=40] - 背景大小
 * @param {string} [iconColor] - 图标颜色
 * @returns {HTMLElement}
 */
export function iconBg(name, bgColor, iconSize, bgSize, iconColor) {
    iconSize = iconSize || 20;
    bgSize = bgSize || 40;
    var wrap = createEl('div', '');
    wrap.style.cssText = 'width:' + bgSize + 'px;height:' + bgSize + 'px;border-radius:12px;display:flex;align-items:center;justify-content:center;background:' + bgColor + ';';
    wrap.appendChild(icon(name, iconSize, iconColor));
    return wrap;
}

// ==================== 职业分类 → SVG 图标映射 ====================
// 为每个职业分类分配精致的 SVG 图标和主题色

var CATEGORY_ICON_MAP = {
    // === 8 大类 ===
    leader:              { icon: 'award',          color: '#8B5CF6' },
    professional:        { icon: 'graduationCap',   color: '#2563EB' },
    clerk:               { icon: 'clipboardList',   color: '#0891B2' },
    service:             { icon: 'heart',           color: '#EC4899' },
    agriculture:         { icon: 'sprout',          color: '#16A34A' },
    manufacturing:       { icon: 'factory',         color: '#EA580C' },
    military:            { icon: 'shield',          color: '#DC2626' },
    other:               { icon: 'layers',          color: '#6B7280' },

    // === 中类：负责人 ===
    gov_leader:          { icon: 'landPlot',        color: '#7C3AED' },
    org_leader:          { icon: 'users',           color: '#8B5CF6' },
    institution_leader:  { icon: 'building',        color: '#6D28D9' },
    enterprise_leader:   { icon: 'briefcase',       color: '#5B21B6' },

    // === 中类：专业技术人员 ===
    researcher:          { icon: 'flask',           color: '#1D4ED8' },
    engineer:            { icon: 'wrench',          color: '#2563EB' },
    agri_tech:           { icon: 'sprout',          color: '#15803D' },
    aviation_tech:       { icon: 'plane',           color: '#0369A1' },
    health_professional: { icon: 'stethoscope',     color: '#DC2626' },
    finance_professional:{ icon: 'trendingUp',      color: '#059669' },
    legal_professional:  { icon: 'scale',           color: '#7C3AED' },
    teacher:             { icon: 'bookOpen',        color: '#D97706' },
    art_sport_professional: { icon: 'palette',      color: '#DB2777' },
    media_professional:  { icon: 'megaphone',       color: '#EA580C' },
    translator:          { icon: 'globe',           color: '#0891B2' },
    archive_professional:{ icon: 'library',         color: '#92400E' },
    digital_tech:        { icon: 'code',            color: '#2563EB' },
    smart_mfg:           { icon: 'cpu',             color: '#4F46E5' },
    industrial_net:      { icon: 'network',         color: '#0284C7' },

    // === 中类：办事人员 ===
    admin_clerk:         { icon: 'fileText',        color: '#0891B2' },
    safety_worker:       { icon: 'shieldCheck',     color: '#DC2626' },
    other_clerk:         { icon: 'list',            color: '#64748B' },

    // === 中类：服务人员 ===
    retail_service:      { icon: 'shoppingBag',     color: '#E11D48' },
    logistics_service:   { icon: 'truck',           color: '#EA580C' },
    food_service:        { icon: 'coffee',          color: '#D97706' },
    it_service:          { icon: 'monitor',         color: '#2563EB' },
    finance_service:     { icon: 'wallet',          color: '#059669' },
    property_service:    { icon: 'home',            color: '#7C3AED' },
    business_service:    { icon: 'handshake',       color: '#0891B2' },
    tech_auxiliary:      { icon: 'settings',        color: '#475569' },
    env_service:         { icon: 'trees',           color: '#16A34A' },
    life_service:        { icon: 'sparkles',        color: '#EC4899' },
    utility_service:     { icon: 'zap',             color: '#EAB308' },
    repair_service:      { icon: 'tool',            color: '#78716C' },
    beauty_service:      { icon: 'scissors',        color: '#DB2777' },
    pet_service:         { icon: 'paw',             color: '#F59E0B' },
    wedding_service:     { icon: 'heart',           color: '#E11D48' },
    craft_service:       { icon: 'penTool',         color: '#92400E' },
    film_music:          { icon: 'music',           color: '#7C3AED' },
    sports_entertainment:{ icon: 'trophy',          color: '#F59E0B' },
    home_repair:         { icon: 'hammer',          color: '#78716C' },
    culture_service:     { icon: 'drama',           color: '#DC2626' },
    health_service:      { icon: 'activity',        color: '#059669' },
    new_service:         { icon: 'star',            color: '#6366F1' },

    // === 中类：农林牧渔 ===
    farm_worker:         { icon: 'wheat',           color: '#CA8A04' },
    forestry_worker:     { icon: 'trees',           color: '#15803D' },
    livestock_worker:    { icon: 'beef',            color: '#B45309' },
    fishery_worker:      { icon: 'fish',            color: '#0369A1' },
    agri_auxiliary:      { icon: 'tractor',         color: '#65A30D' },
    agri_processing:     { icon: 'factory',         color: '#A16207' },

    // === 中类：生产制造 ===
    production_auxiliary:{ icon: 'cog',             color: '#64748B' },
    machining:           { icon: 'settings',        color: '#475569' },
    metal_worker:        { icon: 'anvil',           color: '#78716C' },
    equipment_maker:     { icon: 'cog',             color: '#57534E' },
    special_equipment:   { icon: 'cpu',             color: '#4F46E5' },
    auto_maker:          { icon: 'car',             color: '#DC2626' },
    transport_maker:     { icon: 'rocket',          color: '#0369A1' },
    electrical_maker:    { icon: 'zap',             color: '#EAB308' },
    electronics_maker:   { icon: 'circuitBoard',    color: '#2563EB' },
    instrument_maker:    { icon: 'gauge',           color: '#0891B2' },
    pharma_maker:        { icon: 'pill',            color: '#059669' },
    chemical_worker:     { icon: 'flask',           color: '#7C3AED' },
    construction_worker: { icon: 'hardHat',         color: '#EA580C' },
    miner:               { icon: 'pickaxe',         color: '#78716C' },
    daily_maker:         { icon: 'package',         color: '#6366F1' },
    wood_worker:         { icon: 'axe',             color: '#92400E' },
    craft_maker:         { icon: 'paintbrush',      color: '#DB2777' },

    // === 军人 ===
    soldier:             { icon: 'shield',          color: '#DC2626' },
    salvage_worker:      { icon: 'anchor',          color: '#0369A1' },

    // === 其他 ===
    uncategorized:       { icon: 'helpCircle',      color: '#6B7280' }
};

// 备用图标映射（当分类图标不存在时使用）
var FALLBACK_ICONS = ['briefcase', 'building', 'clipboardList', 'lightbulb', 'compass', 'star', 'flag', 'circleDot'];

/**
 * 获取职业分类对应的图标和颜色
 * @param {string} categoryId - 分类 ID
 * @returns {{ icon: string, color: string }}
 */
export function getCategoryIcon(categoryId) {
    if (!categoryId) return { icon: 'briefcase', color: '#6B7280' };
    var mapped = CATEGORY_ICON_MAP[categoryId];
    if (mapped) return mapped;
    // 按字符串 hash 选择备用图标
    var hash = 0;
    for (var i = 0; i < categoryId.length; i++) {
        hash = ((hash << 5) - hash) + categoryId.charCodeAt(i);
        hash |= 0;
    }
    var idx = Math.abs(hash) % FALLBACK_ICONS.length;
    return { icon: FALLBACK_ICONS[idx], color: '#6B7280' };
}

/**
 * 创建职业分类图标元素（带彩色背景）
 * @param {string} categoryId - 分类 ID
 * @param {number} [size=52] - 容器大小
 * @returns {HTMLElement}
 */
export function categoryIconEl(categoryId, size) {
    size = size || 52;
    var info = getCategoryIcon(categoryId);
    var wrap = createEl('div', 'job-icon');
    wrap.style.cssText = 'width:' + size + 'px;height:' + size + 'px;display:flex;align-items:center;justify-content:center;background:' + info.color + '12;border-radius:var(--radius-lg);border:1px solid ' + info.color + '20;';
    wrap.appendChild(icon(info.icon, Math.round(size * 0.5), info.color));
    return wrap;
}
