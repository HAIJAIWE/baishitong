// ==================== sound.js - 音效系统 ====================
// 使用 Web Audio API 生成音效，无需音频文件

let audioCtx = null;
let soundEnabled = true;

/**
 * 获取/创建 AudioContext（懒加载）
 */
function getAudioCtx() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    return audioCtx;
}

/**
 * 播放一个简单的音调
 * @param {number} freq - 频率 (Hz)
 * @param {number} duration - 持续时间 (秒)
 * @param {string} type - 波形类型 (sine/square/triangle/sawtooth)
 * @param {number} volume - 音量 (0-1)
 */
function playTone(freq, duration, type, volume) {
    if (!soundEnabled) return;
    try {
        const ctx = getAudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        gain.gain.setValueAtTime(volume || 0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + duration);
    } catch (e) {
        // 静默失败，不影响功能
    }
}

/**
 * 按钮点击音效 — 短促清脆的"咔嗒"声
 */
export function playClick() {
    playTone(800, 0.06, 'sine', 0.08);
}

/**
 * 成功提示音效 — 上升的两音阶"叮咚"
 */
export function playSuccess() {
    playTone(523, 0.1, 'sine', 0.1);
    setTimeout(function() {
        playTone(784, 0.15, 'sine', 0.1);
    }, 100);
}

/**
 * 错误提示音效 — 下降的低沉"嗡"声
 */
export function playError() {
    playTone(300, 0.15, 'sine', 0.1);
    setTimeout(function() {
        playTone(220, 0.2, 'sine', 0.08);
    }, 150);
}

/**
 * 通知音效 — 清脆的三连音"叮叮叮"
 */
export function playNotify() {
    playTone(880, 0.08, 'sine', 0.08);
    setTimeout(function() {
        playTone(1047, 0.08, 'sine', 0.08);
    }, 100);
    setTimeout(function() {
        playTone(1319, 0.12, 'sine', 0.08);
    }, 200);
}

/**
 * 设置音效开关
 * @param {boolean} enabled
 */
export function setSoundEnabled(enabled) {
    soundEnabled = enabled;
    try {
        localStorage.setItem('byt_sound_enabled', enabled ? '1' : '0');
    } catch (e) {}
}

/**
 * 获取音效开关状态
 * @returns {boolean}
 */
export function isSoundEnabled() {
    return soundEnabled;
}

/**
 * 初始化音效设置（从 localStorage 读取）
 */
export function initSound() {
    try {
        const saved = localStorage.getItem('byt_sound_enabled');
        if (saved !== null) {
            soundEnabled = saved === '1';
        }
    } catch (e) {}
}
