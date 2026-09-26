/* ============================================================
 * audio.js — Web Audio 合成音效（无音频文件；离线 file:// 可用）
 * 发射 whoosh / 爆炸 boom / RWR 告警蜂鸣（越近越急）/ 发动机轰鸣（随速）
 * 惰性初始化：无 AudioContext 环境全部 API 安全不抛错（冒烟测试可入链）
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';

  const A = {
    ctx: null, master: null, muted: false,
    _noise: null, _engineGain: null, _engineFilt: null,
    _beepT: 0
  };

  function ensure() {
    if (A.ctx || typeof window === 'undefined') return A.ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      A.ctx = new AC();
      A.master = A.ctx.createGain();
      A.master.gain.value = A.muted ? 0 : 0.4;
      A.master.connect(A.ctx.destination);
      /* 共享噪声源（2s 循环白噪） */
      const len = Math.floor(A.ctx.sampleRate * 2);
      A._noise = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
      const d = A._noise.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      /* 发动机：循环噪声 → 低通 → 增益（随速） */
      const src = A.ctx.createBufferSource();
      src.buffer = A._noise;
      src.loop = true;
      A._engineFilt = A.ctx.createBiquadFilter();
      A._engineFilt.type = 'lowpass';
      A._engineFilt.frequency.value = 220;
      A._engineGain = A.ctx.createGain();
      A._engineGain.gain.value = 0;
      src.connect(A._engineFilt);
      A._engineFilt.connect(A._engineGain);
      A._engineGain.connect(A.master);
      src.start(0);
    } catch (e) {
      A.ctx = null;
    }
    return A.ctx;
  }

  A.init = function () { ensure(); };
  A.resume = function () {
    const c = ensure();
    if (c && c.state === 'suspended' && c.resume) c.resume().catch(() => {});
  };
  A.setMuted = function (m) {
    A.muted = !!m;
    if (A.master) A.master.gain.value = A.muted ? 0 : 0.4;
  };

  function noiseBurst(dur, f0, f1, vol) {
    const c = ensure();
    if (!c || A.muted) return;
    const t = c.currentTime;
    const src = c.createBufferSource();
    src.buffer = A._noise;
    const filt = c.createBiquadFilter();
    filt.type = 'lowpass';
    filt.frequency.setValueAtTime(f0, t);
    filt.frequency.exponentialRampToValueAtTime(Math.max(f1, 40), t + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filt);
    filt.connect(g);
    g.connect(A.master);
    src.start(t, Math.random() * 1.2);
    src.stop(t + dur + 0.02);
  }

  function tone(freq, dur, vol, type) {
    const c = ensure();
    if (!c || A.muted) return;
    const t = c.currentTime;
    const o = c.createOscillator();
    o.type = type || 'sine';
    o.frequency.value = freq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g);
    g.connect(A.master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /* 发射：火箭点火 whoosh + 低频冲击 */
  A.launch = function () {
    noiseBurst(0.7, 2600, 260, 0.5);
    tone(82, 0.35, 0.3, 'triangle');
  };

  /* 爆炸：低频 boom + 碎裂噪声 */
  A.explode = function () {
    noiseBurst(1.1, 1600, 90, 0.7);
    tone(58, 0.5, 0.45, 'sine');
  };

  /* 发动机轰鸣：level 0..1（随速度），平滑跟随 */
  A.setEngine = function (level) {
    const c = ensure();
    if (!c || !A._engineGain) return;
    const l = Math.max(0, Math.min(1, level || 0));
    const g = A._engineGain.gain;
    g.value += (l * 0.16 - g.value) * 0.08;
    A._engineFilt.frequency.value = 180 + l * 700;
  };

  /* RWR 告警蜂鸣：level 0..1（越近越急：1.15s → 0.2s 间隔），0=静默 */
  A.tick = function (dt, level) {
    const c = ensure();
    if (!c || A.muted) return;
    if (!(level > 0)) { A._beepT = 0; return; }
    A._beepT -= dt;
    if (A._beepT <= 0) {
      tone(1180, 0.055, 0.2, 'square');
      A._beepT = 1.15 - Math.max(0, Math.min(1, level)) * 0.95;
    }
  };

  WT.audio = A;
})(window.WT = window.WT || {});
