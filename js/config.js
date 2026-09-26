/* ============================================================
 * config.js — 全局常量、导弹预设与默认参数
 *
 * 弹体参数提取自 War Thunder 公开 datamine（经 missile_sim 项目整理）：
 *   AIM-9L / PL-8 / R-60 / AIM-120A 的质量、口径、推进级、CxK、
 *   过载上限、比例导引增益、引信半径等均来自对应 JSON 参数文件。
 * 阻力模型采用 missile_sim 同款 1943 年 Cx(M) 阻力律（×1.10）。
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';

  WT.G0 = 9.80665;

  /* 1943 年 Cx(M) ×1.10 跨/超音速阻力表（马赫数 → 轴向阻力系数）
   * 表外按端点值保持，避免低马赫出现负阻力。 */
  WT.CX_MACH_TABLE = [
    [0.80, 0.173], [0.90, 0.209], [1.00, 0.330], [1.10, 0.402],
    [1.20, 0.413], [1.40, 0.396], [1.60, 0.380], [1.80, 0.358],
    [1.93, 0.352], [2.01, 0.342], [2.29, 0.314], [2.66, 0.288],
    [3.10, 0.270], [3.50, 0.250], [4.00, 0.231]
  ];

  /* ---------------- 导弹预设 ----------------
   * fields:
   *   mass0     发射质量 kg          caliber   弹径 m
   *   wingMult  翼面/弹身面积倍数    cxK       轴向阻力系数标度
   *   stages[]  推进级 {t 助推时间 s, thrust 推力 N, massLost 燃料 kg}
   *   nMaxG     最大横向过载 G        pnGain    比例导引增益 N
   *   fuseR     近炸引信半径 m        minDist   最小攻击距离 m
   *   lifeS     寿命 s                vMax      速度上限 m/s
   *   maxMach   马赫上限              loft      中段爬升
   *   loftAngleDeg 爬升仰角 °         launchMach 默认发射初速（马赫）
   */
  WT.MISSILE_PRESETS = {
    aim9l: {
      key: 'aim9l', name: 'AIM-9L 响尾蛇（近距格斗弹）',
      mass0: 84.46, caliber: 0.127, wingMult: 1.4, cxK: 3.4,
      stages: [{ t: 5.3, thrust: 10800, massLost: 27.4 }],
      nMaxG: 30, pnGain: 4.0, fuseR: 5, seekerRateMaxDeg: 22, minDist: 30,
      lifeS: 60, vMax: 1000, maxMach: 2.5, loft: false, loftAngleDeg: 0,
      launchMach: 1.2
    },
    pl8: {
      key: 'pl8', name: 'PL-8（近距格斗弹）',
      mass0: 121.0, caliber: 0.16, wingMult: 1.4, cxK: 3.3,
      stages: [
        { t: 0.785, thrust: 37675, massLost: 13.0 },
        { t: 2.85, thrust: 20500, massLost: 25.7 }
      ],
      nMaxG: 40, pnGain: 4.0, fuseR: 7, seekerRateMaxDeg: 20, minDist: 30,
      lifeS: 20, vMax: 1000, maxMach: 3.5, loft: false, loftAngleDeg: 0,
      launchMach: 1.2
    },
    r60: {
      key: 'r60', name: 'R-60（近距格斗弹）',
      mass0: 43.5, caliber: 0.12, wingMult: 1.25, cxK: 3.1,
      stages: [{ t: 3.0, thrust: 9500, massLost: 10.0 }],
      nMaxG: 30, pnGain: 4.0, fuseR: 3, seekerRateMaxDeg: 30, minDist: 30,
      lifeS: 25, vMax: 850, maxMach: 2.5, loft: false, loftAngleDeg: 0,
      launchMach: 1.2
    },
    aim120a: {
      key: 'aim120a', name: 'AIM-120A（中距主动雷达弹）',
      mass0: 147.87, caliber: 0.1778, wingMult: 1.275, cxK: 1.425,
      stages: [
        { t: 1.7, thrust: 22300, massLost: 16.12 },
        { t: 5.3, thrust: 13485, massLost: 30.42 }
      ],
      nMaxG: 35, pnGain: 4.0, fuseR: 12, seekerRateMaxDeg: 60, minDist: 30,
      lifeS: 80, vMax: 2000, maxMach: 4.0, loft: true, loftAngleDeg: 22.5,
      launchMach: 1.5
    }
  };

  /* ---------------- 默认场景 / 飞机参数 ---------------- */
  /* ---------- 全局常量（原 19000/1024/30 等魔法数字多处重复） ---------- */
  WT.CONST = {
    RWR_WARN_RANGE: 19000,     // RWR 告警距离上限 m（=主动雷达导引头开机点）
    MISSILE_POOL_CAP: 1024,    // 导弹池环形槽位上限
    TRAIL_HZ: 30               // 尾迹采样率（按仿真时间）
  };

  WT.DEFAULTS = {
    scenario: {
      preset: 'aim9l',
      launchDistM: 8000,     // 来袭距离（弹目初始距离）
      launchAltM: 5000,      // 导弹发射高度
      targetAltM: 5000,      // 被锁定飞机高度
      launchMach: 1.2,       // 导弹初速（马赫）
      aspectDeg: 0,          // 来袭方位：0=迎头 90=右侧向 180=尾追（向右为正）
      engine: 'dynamic'      // dynamic=推进/阻力半经验模型 const=恒速纯运动学
    },
    aircraft: {
      mach: 1.0,             // 恒定飞行马赫数（默认 1 马赫）
      nMaxPos: 10.0,         // 最大法向过载（拉杆，默认 10G；重力参与转弯）
      nMaxNeg: -4.0,         // 最大负过载（压杆）
      rollRateMaxDeg: 180    // 最大滚转速率 °/s
    }
  };

  /* 来袭方位快捷档 */
  WT.ASPECT_PRESETS = [
    { deg: 0, name: '迎头' },
    { deg: 90, name: '正侧向' },
    { deg: 180, name: '尾追' }
  ];

  /* 战术列表（tactics.js 实现） */
  WT.TACTICS = [
    { id: 'manual', name: '手动驾驶' },
    { id: 'steadyTurn', name: '最大G定常盘旋' },
    { id: 'tail', name: '置尾（对正导弹速度矢量）' },
    { id: 'tailLevel', name: '置尾平飞（水平对正·定高）' },
    { id: 'dez', name: 'DEZ动能规避（Alkaher2015）' },
    { id: 'perp', name: '垂直导弹速度矢量' }
  ];
})(window.WT);
