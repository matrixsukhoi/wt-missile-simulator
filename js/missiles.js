/* missiles.js — 扩展导弹预设（第一批~第七批合并，共 59 款）
 * 参数提取自 War Thunder 2.59.0.7 拆包数据 rocketguns/*.blkx（原始单位）
 * 批次：①7款 ②12款 ③12款 ④19款（AIM-54全系等） ⑤1款（伊朗 Fakour-90 思想90） ⑥7款（麻雀家族/闪电家族） ⑦1款（PL-15）
 * 合并日期 | 原分批文件 missiles_extra2~5.js 已删除 */
(function (WT) {
  'use strict';
  Object.assign(WT.MISSILE_PRESETS, {
    // ---- 第一批：AIM-120D/PL-12/PL-12A/R-77/R-77-1/MICA-EM/Derby ----
    aim120d: {
      key: 'aim120d', name: 'AIM-120D（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 162.3861,          // rocket.mass
      caliber: 0.1778,          // rocket.caliber
      wingMult: 1.7,            // rocket.wingAreaMult
      cxK: 1.225,               // rocket.CxK
      stages: [
        { t: 7.75, thrust: 15542, massLost: 51.2559 /* mass-massEnd */ }
      ],
      nMaxG: 35,                // rocket.loadFactorMax
      pnGain: 6,                // guidanceAutopilot.propNavMult
      fuseR: 12,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar）
      minDist: 30,              // rocket.minDistance
      lifeS: 180,               // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4.4,             // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 22,         // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.66,            // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.9,       // rocket.distFromCmToStab
      finAoaHorRad: 0.452936,   // rocket.finsAoaHor
      finAoaVerRad: 0.452936,   // rocket.finsAoaVer
      finsLatAccelG: 35,        // rocket.finsLatAccel
      pid: {
        p: null, i: null, d: null, iLim: null, // datamine 未提供（本弹 autopilot 仅有 pid0/pid1 时变块，无 accelControl* 字段）
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    },
    pl12: {
      key: 'pl12', name: 'PL-12（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 198,               // rocket.mass
      caliber: 0.203,           // rocket.caliber
      wingMult: 1.8,            // rocket.wingAreaMult
      cxK: 1.325,               // rocket.CxK
      stages: [
        { t: 2.5, thrust: 34960, massLost: 38 /* mass-massEnd */ },
        { t: 5, thrust: 12880, massLost: 28 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 38,                // rocket.loadFactorMax
      pnGain: 6,                // guidanceAutopilot.propNavMult
      fuseR: 10,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar）
      minDist: 30,              // rocket.minDistance
      lifeS: 80,                // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4,               // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 20,         // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.934,           // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.5,       // rocket.distFromCmToStab
      finAoaHorRad: 0.452936,   // rocket.finsAoaHor
      finAoaVerRad: 0.452936,   // rocket.finsAoaVer
      finsLatAccelG: 38,        // rocket.finsLatAccel
      pid: {
        p: 0.001784, i: 0.018364, d: 0.000051, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    },
    pl12a: {
      key: 'pl12a', name: 'PL-12A（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 214,               // rocket.mass
      caliber: 0.203,           // rocket.caliber
      wingMult: 1.8,            // rocket.wingAreaMult
      cxK: 1.325,               // rocket.CxK
      stages: [
        { t: 2.5, thrust: 34960, massLost: 38 /* mass-massEnd */ },
        { t: 6, thrust: 14105, massLost: 36.8 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 38,                // rocket.loadFactorMax
      pnGain: 6,                // guidanceAutopilot.propNavMult
      fuseR: 10,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar）
      minDist: 30,              // rocket.minDistance
      lifeS: 120,               // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4,               // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 20,         // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.934,           // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.5,       // rocket.distFromCmToStab
      finAoaHorRad: 0.452936,   // rocket.finsAoaHor
      finAoaVerRad: 0.452936,   // rocket.finsAoaVer
      finsLatAccelG: 38,        // rocket.finsLatAccel
      pid: {
        p: 0.001889, i: 0.019444, d: 0.000071, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    },
    r77: {
      key: 'r77', name: 'R-77（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 175,               // rocket.mass
      caliber: 0.2,             // rocket.caliber
      wingMult: 1.5,            // rocket.wingAreaMult
      cxK: 1.425,               // rocket.CxK
      stages: [
        { t: 6, thrust: 23000, massLost: 60 /* mass-massEnd */ }
      ],
      nMaxG: 50,                // rocket.loadFactorMax
      pnGain: 6,                // guidanceAutopilot.propNavMult
      fuseR: 10,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar）
      minDist: 30,              // rocket.minDistance
      lifeS: 90,                // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4,               // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 24,         // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6,             // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: 1.3,               // CyMaxAoA（本弹为标量，取该值）
      maxCyAoaRad: null,        // datamine 未提供（CyMaxAoA 无第 2 项迎角）
      finMomentArmM: 0.4,       // rocket.distFromCmToStab
      finAoaHorRad: 0.698132,   // rocket.finsAoaHor
      finAoaVerRad: 0.698132,   // rocket.finsAoaVer
      finsLatAccelG: 55,        // rocket.finsLatAccel
      pid: {
        p: 0.00202, i: 0.00679, d: 0.000024, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    },
    r77_1: {
      key: 'r77_1', name: 'R-77-1（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 190,               // rocket.mass
      caliber: 0.2,             // rocket.caliber
      wingMult: 1.5,            // rocket.wingAreaMult
      cxK: 1.4,                 // rocket.CxK
      stages: [
        { t: 7, thrust: 23835, massLost: 71 /* mass-massEnd */ }
      ],
      nMaxG: 50,                // rocket.loadFactorMax
      pnGain: 6,                // guidanceAutopilot.propNavMult
      fuseR: 10,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar）
      minDist: 30,              // rocket.minDistance
      lifeS: 120,               // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4,               // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 24,         // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.71,            // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: 1.3,               // CyMaxAoA（本弹为标量，取该值）
      maxCyAoaRad: null,        // datamine 未提供（CyMaxAoA 无第 2 项迎角）
      finMomentArmM: 0.4,       // rocket.distFromCmToStab
      finAoaHorRad: 0.698132,   // rocket.finsAoaHor
      finAoaVerRad: 0.698132,   // rocket.finsAoaVer
      finsLatAccelG: 55,        // rocket.finsLatAccel
      pid: {
        p: 0.002125, i: 0.006481, d: 0.000023, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    },
    mica_em: {
      key: 'mica_em', name: 'MICA-EM（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 112,               // rocket.mass
      caliber: 0.16,            // rocket.caliber
      wingMult: 1.65,           // rocket.wingAreaMult
      cxK: 1.4,                 // rocket.CxK
      stages: [
        { t: 3.5, thrust: 24840, massLost: 37.8 /* mass-massEnd */ }
      ],
      nMaxG: 50,                // rocket.loadFactorMax
      pnGain: 6,                // guidanceAutopilot.propNavMult
      fuseR: 12,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar）
      minDist: 30,              // rocket.minDistance
      lifeS: 70,                // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4.5,             // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 22,         // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.1,             // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: 1.35,              // CyMaxAoA（本弹为标量，取该值）
      maxCyAoaRad: null,        // datamine 未提供（CyMaxAoA 无第 2 项迎角）
      finMomentArmM: 0.35,      // rocket.distFromCmToStab
      finAoaHorRad: 0.567232,   // rocket.finsAoaHor
      finAoaVerRad: 0.567232,   // rocket.finsAoaVer
      finsLatAccelG: 60,        // rocket.finsLatAccel
      pid: {
        p: 0.001042, i: 0.013603, d: 0.000028, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    },
    derby: {
      key: 'derby', name: 'Derby（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 118,               // rocket.mass
      caliber: 0.16,            // rocket.caliber
      wingMult: 1.4,            // rocket.wingAreaMult
      cxK: 1.55,                // rocket.CxK
      stages: [
        { t: 2.74, thrust: 20145, massLost: 23 /* mass-massEnd */ },
        { t: 3.79, thrust: 9500, massLost: 15 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 40,                // rocket.loadFactorMax
      pnGain: 4,                // guidanceAutopilot.propNavMult
      fuseR: 12,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar）
      minDist: 30,              // rocket.minDistance
      lifeS: 70,                // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4,               // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 27.5,       // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.62,            // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.11,      // rocket.distFromCmToStab
      finAoaHorRad: 0.330668,   // rocket.finsAoaHor
      finAoaVerRad: 0.330668,   // rocket.finsAoaVer
      finsLatAccelG: 46.7469,   // rocket.finsLatAccel
      pid: {
        p: 0.0101, i: 0.0065, d: 0.00015, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    },
    // ---- 第二批：AIM-9M/AIM-7M/R-73/R-27R/R-27T/Python-4/AAM-3/AAM-4/PL-5E2/PL-9/Skyflash/R-3R ----
    aim9m: {
      key: 'aim9m', name: 'AIM-9M 响尾蛇（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 84.46,            // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.4,                // rocket.CxK
      stages: [
        { t: 5.3, thrust: 10800, massLost: 27.4 /* mass-massEnd */ }
      ],
      nMaxG: 30,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 22,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.85,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.25,      // rocket.finsAoaHor
      finAoaVerRad: 0.25,      // rocket.finsAoaVer
      finsLatAccelG: 37.5,     // rocket.finsLatAccel
      pid: {
        p: 0.002, i: 0.0361, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim7m: {
      key: 'aim7m', name: 'AIM-7M 麻雀（中距半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 231.3321,         // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 4.5, thrust: 21479.88, massLost: 42.8645 /* mass-massEnd */ },
        { t: 11, thrust: 3765.95, massLost: 18.3705 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 400,            // rocket.minDistance
      lifeS: 75,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6676,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 29,       // rocket.finsLatAccel
      pid: {
        p: 0.013481, i: 0.034835, d: 0.001341, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r73: {
      key: 'r73', name: 'R-73（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 105,              // rocket.mass
      caliber: 0.17,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 2.5,                // rocket.CxK
      stages: [
        { t: 5.5, thrust: 13750, massLost: 34 /* mass-massEnd */ }
      ],
      nMaxG: 40,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 6,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 20,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.9,            // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.12,     // rocket.distFromCmToStab
      finAoaHorRad: 0.25,      // rocket.finsAoaHor
      finAoaVerRad: 0.25,      // rocket.finsAoaVer
      finsLatAccelG: 45,       // rocket.finsLatAccel
      pid: {
        p: null, i: null, d: null, iLim: null, // datamine 未提供（本弹 autopilot 仅有 pid0~pid3 时变块，无 accelControl* 字段）
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r27r: {
      key: 'r27r', name: 'R-27R（中距半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 253,              // rocket.mass
      caliber: 0.23,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 1.9,                // rocket.CxK
      stages: [
        { t: 6, thrust: 25125, massLost: 67 /* mass-massEnd */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 4,              // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.32,      // rocket.finsAoaHor
      finAoaVerRad: 0.32,      // rocket.finsAoaVer
      finsLatAccelG: 36.96,    // rocket.finsLatAccel
      pid: {
        p: 0.0015, i: 0.0216, d: 0.0011, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r27t: {
      key: 'r27t', name: 'R-27T（中距红外弹）',
      // ---- 基础参数 ----
      mass0: 245.5,            // rocket.mass
      caliber: 0.23,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 2.425,              // rocket.CxK
      stages: [
        { t: 6, thrust: 25125, massLost: 67 /* mass-massEnd */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 30,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（中距弹默认；datamine 仅有 startSpeed=0）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.7,            // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.32,      // rocket.finsAoaHor
      finAoaVerRad: 0.32,      // rocket.finsAoaVer
      finsLatAccelG: 36.96,    // rocket.finsLatAccel
      pid: {
        p: 0.006, i: 0.0311, d: 0.0013, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pyton4: {
      key: 'pyton4', name: 'Python-4（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 105,              // rocket.mass
      caliber: 0.16,           // rocket.caliber
      wingMult: 1.45,          // rocket.wingAreaMult
      cxK: 2.65,               // rocket.CxK
      stages: [
        { t: 3, thrust: 17600, massLost: 24 /* mass-massEnd */ },
        { t: 5, thrust: 7920, massLost: 18 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 50,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 7,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 45,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 20,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3,              // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.22,      // rocket.finsAoaHor
      finAoaVerRad: 0.22,      // rocket.finsAoaVer
      finsLatAccelG: 60,       // rocket.finsLatAccel
      pid: {
        p: 0.0036, i: 0.0341, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aam3: {
      key: 'aam3', name: 'AAM-3（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 91,               // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.3,           // rocket.wingAreaMult
      cxK: 2.85,               // rocket.CxK
      stages: [
        { t: 5.2, thrust: 11952.69, massLost: 27.4 /* mass-massEnd */ }
      ],
      nMaxG: 40,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 6,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 30,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 45,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.02,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.09,     // rocket.distFromCmToStab
      finAoaHorRad: 0.278762,  // rocket.finsAoaHor
      finAoaVerRad: 0.278762,  // rocket.finsAoaVer
      finsLatAccelG: 37.1989,  // rocket.finsLatAccel
      pid: {
        p: 0.0021, i: 0.0401, d: 0.0008, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aam4: {
      key: 'aam4', name: 'AAM-4（中距主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 222,              // rocket.mass
      caliber: 0.203,          // rocket.caliber
      wingMult: 1.65,          // rocket.wingAreaMult
      cxK: 1.3,                // rocket.CxK
      stages: [
        { t: 4, thrust: 27025, massLost: 47 /* mass-massEnd */ },
        { t: 5, thrust: 9200, massLost: 20 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 32,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 12,               // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,    // radarSeeker.rateMax（guidanceType=radar，active=true）
      minDist: 30,             // rocket.minDistance
      lifeS: 100,              // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: true,              // guidanceAutopilot.loftEnabled
      loftAngleDeg: 20,        // guidanceAutopilot.loftElevation
      launchMach: 1.5,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.667,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.5,      // rocket.distFromCmToStab
      finAoaHorRad: 0.452936,  // rocket.finsAoaHor
      finAoaVerRad: 0.452936,  // rocket.finsAoaVer
      finsLatAccelG: 32,       // rocket.finsLatAccel
      pid: {
        p: 0.002169, i: 0.02284, d: 0.000072, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl5e2: {
      key: 'pl5e2', name: 'PL-5E2（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 83,               // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 2, thrust: 27900, massLost: 24.8 /* mass-massEnd */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 7,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 23,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.892,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.22,      // rocket.finsAoaHor
      finAoaVerRad: 0.22,      // rocket.finsAoaVer
      finsLatAccelG: 31,       // rocket.finsLatAccel
      pid: {
        p: 0.0021, i: 0.0336, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl9: {
      key: 'pl9', name: 'PL-9（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 115,              // rocket.mass
      caliber: 0.157,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 1.25, thrust: 35200, massLost: 20 /* mass-massEnd */ },
        { t: 2.75, thrust: 16160, massLost: 20.2 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 7,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 30,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.992,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.248,     // rocket.finsAoaHor
      finAoaVerRad: 0.248,     // rocket.finsAoaVer
      finsLatAccelG: 37.2052,  // rocket.finsLatAccel
      pid: {
        p: 0.0021, i: 0.0376, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    skyflash: {
      key: 'skyflash', name: 'Skyflash 天空闪光（中距半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 195.04,           // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 2.8, thrust: 31143.83, massLost: 41.55 /* mass-massEnd */ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 15.25,            // rocket.proximityFuse.radius
      seekerRateMaxDeg: 44,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 40,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6676,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 25,       // rocket.finsLatAccel
      pid: {
        p: 0.013035, i: 0.031954, d: 0.001167, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r3r: {
      key: 'r3r', name: 'R-3R（半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 75.3,             // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.9,                // rocket.CxK
      stages: [
        { t: 2.2, thrust: 17318, massLost: 20.5 /* mass-massEnd */ }
      ],
      nMaxG: 10,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 21,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 1.7,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.83,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.11,      // rocket.finsAoaHor
      finAoaVerRad: 0.11,      // rocket.finsAoaVer
      finsLatAccelG: 10.7,     // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.0491, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    // ---- 第三批：R-27ET/PL-8B/R-27ER/R-60M/R-13M1/Magic 2/AIM-9P4/Python-3/PL-5B/Red Top/AIM-4G/R-3S ----
    r27et: {
      key: 'r27et', name: 'R-27ET（红外增程中距弹）',
      // ---- 基础参数 ----
      mass0: 343,              // rocket.mass
      caliber: 0.26,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 1.85,               // rocket.CxK
      stages: [
        { t: 3.2, thrust: 55275, massLost: 80.4 /* mass-massEnd */ },
        { t: 4.8, thrust: 26630, massLost: 58.1 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 30,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 1750,              // rocket.endSpeed
      maxMach: 5.75,           // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 4.5,            // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.32,      // rocket.finsAoaHor
      finAoaVerRad: 0.32,      // rocket.finsAoaVer
      finsLatAccelG: 36.96,    // rocket.finsLatAccel
      pid: {
        p: 0.004, i: 0.0301, d: 0.0012, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl8b: {
      key: 'pl8b', name: 'PL-8B（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 121,              // rocket.mass
      caliber: 0.16,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 0.785, thrust: 37675, massLost: 13 /* mass-massEnd */ },
        { t: 2.85, thrust: 20500, massLost: 25.7 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 40,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 7,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 20,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.999,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.22,      // rocket.finsAoaHor
      finAoaVerRad: 0.22,      // rocket.finsAoaVer
      finsLatAccelG: 31.2,     // rocket.finsLatAccel
      pid: {
        p: 0.0035, i: 0.0346, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r27er: {
      key: 'r27er', name: 'R-27ER（中距半主动雷达增程弹）',
      // ---- 基础参数 ----
      mass0: 350,              // rocket.mass
      caliber: 0.26,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 1.455,              // rocket.CxK
      stages: [
        { t: 3.2, thrust: 55275, massLost: 64 /* mass-massEnd */ },
        { t: 4.8, thrust: 26630, massLost: 74.5 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 1750,              // rocket.endSpeed
      maxMach: 5.75,           // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 4.7,            // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.32,      // rocket.finsAoaHor
      finAoaVerRad: 0.32,      // rocket.finsAoaVer
      finsLatAccelG: 36.96,    // rocket.finsLatAccel
      pid: {
        p: 0.004, i: 0.0301, d: 0.0012, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r60m: {
      key: 'r60m', name: 'R-60M（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 44,               // rocket.mass
      caliber: 0.12,           // rocket.caliber
      wingMult: 1.25,          // rocket.wingAreaMult
      cxK: 3.1,                // rocket.CxK
      stages: [
        { t: 3, thrust: 9500, massLost: 10 /* mass-massEnd */ }
      ],
      nMaxG: 30,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 3,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 30,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 25,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.095,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.06,     // rocket.distFromCmToStab
      finAoaHorRad: 0.18,      // rocket.finsAoaHor
      finAoaVerRad: 0.18,      // rocket.finsAoaVer
      finsLatAccelG: 29.1,     // rocket.finsLatAccel
      pid: {
        p: 0.0015, i: 0.0496, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r13m1: {
      key: 'r13m1', name: 'R-13M1（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 90.6,             // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 2, thrust: 26000, massLost: 30.6 /* mass-massEnd */ }
      ],
      nMaxG: 20,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 16.5,  // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.4,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.876,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.2,       // rocket.finsAoaHor
      finAoaVerRad: 0.2,       // rocket.finsAoaVer
      finsLatAccelG: 18.7,     // rocket.finsLatAccel
      pid: {
        p: 0.0015, i: 0.0316, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    magic2: {
      key: 'magic2', name: 'R.550 Magic 2（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 89,               // rocket.mass
      caliber: 0.157,          // rocket.caliber
      wingMult: 1.45,          // rocket.wingAreaMult
      cxK: 2.515,              // rocket.CxK
      stages: [
        { t: 2, thrust: 27950, massLost: 23.65 /* mass-massEnd */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 25,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.748,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.356,     // rocket.finsAoaHor
      finAoaVerRad: 0.356,     // rocket.finsAoaVer
      finsLatAccelG: 27.3543,  // rocket.finsLatAccel
      pid: {
        p: 0.0016, i: 0.0341, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim9p4: {
      key: 'aim9p4', name: 'AIM-9P4 响尾蛇（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 76.93,            // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 2.2, thrust: 17498.36, massLost: 18.93 /* mass-massEnd */ }
      ],
      nMaxG: 20,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 22,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 40,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.05,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.18,      // rocket.finsAoaHor
      finAoaVerRad: 0.18,      // rocket.finsAoaVer
      finsLatAccelG: 17.6,     // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.0406, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pyton3: {
      key: 'pyton3', name: 'Python-3（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 121,              // rocket.mass
      caliber: 0.16,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 0.785, thrust: 37675, massLost: 13 /* mass-massEnd */ },
        { t: 2.85, thrust: 20500, massLost: 25.7 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 40,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 7,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 20,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.999,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.22,      // rocket.finsAoaHor
      finAoaVerRad: 0.22,      // rocket.finsAoaVer
      finsLatAccelG: 31.2,     // rocket.finsLatAccel
      pid: {
        p: 0.0035, i: 0.0346, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl5b: {
      key: 'pl5b', name: 'PL-5B（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 84.5,             // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 2, thrust: 27900, massLost: 24.8 /* mass-massEnd */ }
      ],
      nMaxG: 30,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 9,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 23,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.892,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.17,      // rocket.finsAoaHor
      finAoaVerRad: 0.17,      // rocket.finsAoaVer
      finsLatAccelG: 31,       // rocket.finsLatAccel
      pid: {
        p: 0.0045, i: 0.0466, d: 0.0009, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    redtop: {
      key: 'redtop', name: 'Red Top 红顶（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 167.8292,         // rocket.mass
      caliber: 0.23,           // rocket.caliber
      wingMult: 1.3,           // rocket.wingAreaMult
      cxK: 2.075,              // rocket.CxK
      stages: [
        { t: 2.5, thrust: 30500, massLost: 35.8338 /* mass-massEnd */ }
      ],
      nMaxG: 12,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 12,               // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 30,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.4,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.32,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab（arcadeProp 内 0.15 为街机覆盖值，不采用）
      finAoaHorRad: 0.142232,  // rocket.finsAoaHor（arcadeProp 内 0.15 为街机覆盖值，不采用）
      finAoaVerRad: 0.142232,  // rocket.finsAoaVer（arcadeProp 内 0.15 为街机覆盖值，不采用）
      finsLatAccelG: 10.2787,  // rocket.finsLatAccel
      pid: {
        p: 0.0041, i: 0.0386, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim4g: {
      key: 'aim4g', name: 'AIM-4G 猎鹰（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 66.22449,         // rocket.mass
      caliber: 0.168656,       // rocket.caliber
      wingMult: 1.925,         // rocket.wingAreaMult
      cxK: 2.025,              // rocket.CxK
      stages: [
        { t: 0.63, thrust: 19741.316, massLost: 5.8967 /* mass-massEnd */ },
        { t: 4.09, thrust: 2834.1257, massLost: 6.3503 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 27,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: null,             // datamine 未提供（本弹无 proximityFuse 块，仅有 fuseDelayDist/distanceFuse=false）
      seekerRateMaxDeg: 12,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 22,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.0955,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.075,    // rocket.distFromCmToStab
      finAoaHorRad: 0.100443,  // rocket.finsAoaHor
      finAoaVerRad: 0.100443,  // rocket.finsAoaVer
      finsLatAccelG: 27,       // rocket.finsLatAccel
      pid: {
        p: 0.0056, i: 0.0481, d: 0.00045, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r3s: {
      key: 'r3s', name: 'R-3S（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 75.3,             // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.9,                // rocket.CxK
      stages: [
        { t: 2.2, thrust: 17318.18, massLost: 20.5 /* mass-massEnd */ }
      ],
      nMaxG: 10,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 9,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 6,     // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 21,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 1.7,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.838,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.11,      // rocket.finsAoaHor
      finAoaVerRad: 0.11,      // rocket.finsAoaVer
      finsLatAccelG: 10.7,     // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.0491, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    // ---- 第四批：AIM-54A/B/C/C+/AIM-9B/9D/9H/9J/Magic 1/Firestreak/Shafrir-2/PL-2/5C/7/11/AIM-4F/26B/R-60MK/R-13M ----
    aim54a: {
      key: 'aim54a', name: 'AIM-54A 不死鸟（远程主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 446.562,          // rocket.mass
      caliber: 0.381,          // rocket.caliber
      wingMult: 1.2,           // rocket.wingAreaMult
      cxK: 1,                  // rocket.CxK
      stages: [
        { t: 27.8, thrust: 12981.21, massLost: 163.293 /* propulsion0.impulse0.massLost（datamine 直接给出）*/ }
      ],
      nMaxG: 22,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 16.764,           // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，active=主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 160,              // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 5.7,            // rocket.machMax
      loft: true,              // guidanceAutopilot.loftEnabled = true
      loftAngleDeg: 22,        // guidanceAutopilot.loftElevation
      launchMach: 1.5,         // 默认值（主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.96,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.0125,   // rocket.distFromCmToStab
      finAoaHorRad: 0.436332,  // rocket.finsAoaHor
      finAoaVerRad: 0.436332,  // rocket.finsAoaVer
      finsLatAccelG: 22,       // rocket.finsLatAccel
      pid: {
        p: 0.064911, i: 0.099337, d: 0.007652, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim54b: {
      key: 'aim54b', name: 'AIM-54B 不死鸟（远程主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 446.562,          // rocket.mass
      caliber: 0.381,          // rocket.caliber
      wingMult: 1.2,           // rocket.wingAreaMult
      cxK: 1,                  // rocket.CxK
      stages: [
        { t: 27.8, thrust: 12981.21, massLost: 163.293 /* propulsion0.impulse0.massLost（datamine 直接给出）*/ }
      ],
      nMaxG: 22,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 16.764,           // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，active=主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 160,              // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 5.7,            // rocket.machMax
      loft: true,              // guidanceAutopilot.loftEnabled = true
      loftAngleDeg: 22,        // guidanceAutopilot.loftElevation
      launchMach: 1.5,         // 默认值（主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.96,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.0125,   // rocket.distFromCmToStab
      finAoaHorRad: 0.436332,  // rocket.finsAoaHor
      finAoaVerRad: 0.436332,  // rocket.finsAoaVer
      finsLatAccelG: 22,       // rocket.finsLatAccel
      pid: {
        p: 0.064911, i: 0.099337, d: 0.007652, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim54c: {
      key: 'aim54c', name: 'AIM-54C 不死鸟（远程主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 446.788,          // rocket.mass
      caliber: 0.381,          // rocket.caliber
      wingMult: 1.2,           // rocket.wingAreaMult
      cxK: 1,                  // rocket.CxK
      stages: [
        { t: 27.8, thrust: 12981.21, massLost: 163.293 /* propulsion0.impulse0.massLost（datamine 直接给出）*/ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 16.764,           // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，active=主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 160,              // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 5.7,            // rocket.machMax
      loft: true,              // guidanceAutopilot.loftEnabled = true
      loftAngleDeg: 22,        // guidanceAutopilot.loftElevation
      launchMach: 1.5,         // 默认值（主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.96,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.0125,   // rocket.distFromCmToStab
      finAoaHorRad: 0.436332,  // rocket.finsAoaHor
      finAoaVerRad: 0.436332,  // rocket.finsAoaVer
      finsLatAccelG: 22,       // rocket.finsLatAccel
      pid: {
        p: 0.064911, i: 0.099337, d: 0.007652, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim54c_plus: {
      key: 'aim54c_plus', name: 'AIM-54C+ 不死鸟（远程主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 446.788,          // rocket.mass
      caliber: 0.381,          // rocket.caliber
      wingMult: 1.2,           // rocket.wingAreaMult
      cxK: 1,                  // rocket.CxK
      stages: [
        { t: 27.8, thrust: 12981.21, massLost: 163.293 /* propulsion0.impulse0.massLost（datamine 直接给出）*/ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 16.764,           // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，active=主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 160,              // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 5.7,            // rocket.machMax
      loft: true,              // guidanceAutopilot.loftEnabled = true
      loftAngleDeg: 22,        // guidanceAutopilot.loftElevation
      launchMach: 1.5,         // 默认值（主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.96,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.0125,   // rocket.distFromCmToStab
      finAoaHorRad: 0.436332,  // rocket.finsAoaHor
      finAoaVerRad: 0.436332,  // rocket.finsAoaVer
      finsLatAccelG: 22,       // rocket.finsLatAccel
      pid: {
        p: 0.064911, i: 0.099337, d: 0.007652, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim9b: {
      key: 'aim9b', name: 'AIM-9B 响尾蛇（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 74.38915,         // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.9,                // rocket.CxK
      stages: [
        { t: 2.2, thrust: 17498.36, massLost: 18.5973 /* mass-massEnd */ }
      ],
      nMaxG: 10,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 9.144,            // rocket.proximityFuse.radius
      seekerRateMaxDeg: 11,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 20,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 1.7,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.8321,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.11,      // rocket.finsAoaHor
      finAoaVerRad: 0.11,      // rocket.finsAoaVer
      finsLatAccelG: 10.4,     // rocket.finsLatAccel
      pid: {
        p: 0.0005, i: 0.0531, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim9d: {
      key: 'aim9d', name: 'AIM-9D 响尾蛇（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 88.45,            // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.4,                // rocket.CxK
      stages: [
        { t: 5, thrust: 11000, massLost: 32.65 /* mass-massEnd */ }
      ],
      nMaxG: 18,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3,              // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.17,      // rocket.finsAoaHor
      finAoaVerRad: 0.17,      // rocket.finsAoaVer
      finsLatAccelG: 19.8,     // rocket.finsLatAccel
      pid: {
        p: 0.0055, i: 0.0631, d: 0.0012, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim9h: {
      key: 'aim9h', name: 'AIM-9H 响尾蛇（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 88.45,            // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.4,                // rocket.CxK
      stages: [
        { t: 5, thrust: 11000, massLost: 32.65 /* mass-massEnd */ }
      ],
      nMaxG: 18,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3,              // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.17,      // rocket.finsAoaHor
      finAoaVerRad: 0.17,      // rocket.finsAoaVer
      finsLatAccelG: 19.8,     // rocket.finsLatAccel
      pid: {
        p: 0.0055, i: 0.0631, d: 0.0012, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim9j: {
      key: 'aim9j', name: 'AIM-9J 响尾蛇（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 76.93,            // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 2.2, thrust: 17498.36, massLost: 18.93 /* mass-massEnd */ }
      ],
      nMaxG: 20,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 16.5,  // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 40,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.05,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.18,      // rocket.finsAoaHor
      finAoaVerRad: 0.18,      // rocket.finsAoaVer
      finsLatAccelG: 17.6,     // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.0406, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    magic: {
      key: 'magic', name: 'R.550 Magic 1（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 89,               // rocket.mass
      caliber: 0.157,          // rocket.caliber
      wingMult: 1.45,          // rocket.wingAreaMult
      cxK: 2.515,              // rocket.CxK
      stages: [
        { t: 2, thrust: 27000, massLost: 23 /* mass-massEnd */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 35,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 25,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.748,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.356,     // rocket.finsAoaHor
      finAoaVerRad: 0.356,     // rocket.finsAoaVer
      finsLatAccelG: 27.3543,  // rocket.finsLatAccel
      pid: {
        p: 0.0016, i: 0.0396, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    firestreak: {
      key: 'firestreak', name: 'Firestreak 火光（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 136,              // rocket.mass
      caliber: 0.222,          // rocket.caliber
      wingMult: 1.3,           // rocket.wingAreaMult
      cxK: 3.5,                // rocket.CxK
      stages: [
        { t: 1.9, thrust: 38000, massLost: 40 /* mass-massEnd */ }
      ],
      nMaxG: 15,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 10,               // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 13,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.4,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.18,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.06,     // rocket.distFromCmToStab
      finAoaHorRad: 0.12,      // rocket.finsAoaHor（arcadeProp 内 0.14 为街机覆盖值，不采用）
      finAoaVerRad: 0.12,      // rocket.finsAoaVer（arcadeProp 内 0.14 为街机覆盖值，不采用）
      finsLatAccelG: 10.9,     // rocket.finsLatAccel
      pid: {
        p: 0.004, i: 0.0486, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    shafrir2: {
      key: 'shafrir2', name: 'Shafrir-2 蜻蜓（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 90,               // rocket.mass
      caliber: 0.15,           // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.9,                // rocket.CxK
      stages: [
        { t: 5, thrust: 11400, massLost: 27 /* mass-massEnd */ }
      ],
      nMaxG: 18,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 18,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 30,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.1,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.8,            // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.18,      // rocket.finsAoaHor
      finAoaVerRad: 0.18,      // rocket.finsAoaVer
      finsLatAccelG: 18.5,     // rocket.finsLatAccel
      pid: {
        p: 0.0045, i: 0.0381, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl2: {
      key: 'pl2', name: 'PL-2（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 75.3,             // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.9,                // rocket.CxK
      stages: [
        { t: 2.2, thrust: 17318.18, massLost: 20.5 /* mass-massEnd */ }
      ],
      nMaxG: 10,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 9,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 6,     // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 21,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 1.7,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.838,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.11,      // rocket.finsAoaHor
      finAoaVerRad: 0.11,      // rocket.finsAoaVer
      finsLatAccelG: 10.7,     // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.0491, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl5c: {
      key: 'pl5c', name: 'PL-5C（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 84.5,             // rocket.mass
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 2, thrust: 27900, massLost: 24.8 /* mass-massEnd */ }
      ],
      nMaxG: 30,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 9,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 23,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.892,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.17,      // rocket.finsAoaHor
      finAoaVerRad: 0.17,      // rocket.finsAoaVer
      finsLatAccelG: 31,       // rocket.finsLatAccel
      pid: {
        p: 0.0045, i: 0.0466, d: 0.0009, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl7: {
      key: 'pl7', name: 'PL-7（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 89,               // rocket.mass
      caliber: 0.157,          // rocket.caliber
      wingMult: 1.45,          // rocket.wingAreaMult
      cxK: 2.515,              // rocket.CxK
      stages: [
        { t: 2, thrust: 27000, massLost: 23 /* mass-massEnd */ }
      ],
      nMaxG: 35,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 35,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 25,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.748,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.356,     // rocket.finsAoaHor
      finAoaVerRad: 0.356,     // rocket.finsAoaVer
      finsLatAccelG: 27.3543,  // rocket.finsLatAccel
      pid: {
        p: 0.0016, i: 0.0396, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    pl11: {
      key: 'pl11', name: 'PL-11（中距半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 230,              // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 3.5, thrust: 37500, massLost: 57 /* mass-massEnd */ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 45,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 5,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.7,            // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 25,       // rocket.finsLatAccel
      pid: {
        p: 0.013749, i: 0.032945, d: 0.001476, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim4f: {
      key: 'aim4f', name: 'AIM-4F 猎鹰（半主动雷达格斗弹）',
      // ---- 基础参数 ----
      mass0: 68.91882,         // rocket.mass
      caliber: 0.168656,       // rocket.caliber
      wingMult: 1.925,         // rocket.wingAreaMult
      cxK: 2.025,              // rocket.CxK
      stages: [
        { t: 0.63, thrust: 19741.316, massLost: 6.0781 /* mass-massEnd */ },
        { t: 4.09, thrust: 2834.1257, massLost: 6.1462 /* massEnd-massEnd1 */ }
      ],
      nMaxG: 27,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: null,             // datamine 未提供（本弹无 proximityFuse 块）
      seekerRateMaxDeg: 12,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 22,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.193671,       // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.075,    // rocket.distFromCmToStab
      finAoaHorRad: 0.100443,  // rocket.finsAoaHor
      finAoaVerRad: 0.100443,  // rocket.finsAoaVer
      finsLatAccelG: 27,       // rocket.finsLatAccel
      pid: {
        p: 0.003, i: 0.0436, d: 0.0011, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim26b: {
      key: 'aim26b', name: 'AIM-26B 猎鹰（中距半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 117.3081,         // rocket.mass
      caliber: 0.28956,        // rocket.caliber
      wingMult: 1.85,          // rocket.wingAreaMult
      cxK: 0.95,               // rocket.CxK
      stages: [
        { t: 2.09, thrust: 27422.328, massLost: 27.7418 /* mass-massEnd */ }
      ],
      nMaxG: 28,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 30,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.55,           // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.159,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.1,       // rocket.finsAoaHor
      finAoaVerRad: 0.1,       // rocket.finsAoaVer
      finsLatAccelG: 28,       // rocket.finsLatAccel
      pid: {
        p: 0.0031, i: 0.0736, d: 0.00035, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r60mk: {
      key: 'r60mk', name: 'R-60MK（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 44,               // rocket.mass
      caliber: 0.12,           // rocket.caliber
      wingMult: 1.25,          // rocket.wingAreaMult
      cxK: 3.1,                // rocket.CxK
      stages: [
        { t: 3, thrust: 9500, massLost: 10 /* mass-massEnd */ }
      ],
      nMaxG: 30,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 3,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 30,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 25,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.095,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.06,     // rocket.distFromCmToStab
      finAoaHorRad: 0.18,      // rocket.finsAoaHor
      finAoaVerRad: 0.18,      // rocket.finsAoaVer
      finsLatAccelG: 29.1,     // rocket.finsLatAccel
      pid: {
        p: 0.0015, i: 0.0496, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r13m: {
      key: 'r13m', name: 'R-13M（红外格斗弹）',
      // ---- 基础参数 ----
      mass0: 87.7,             // rocket.mass（bulletName=su_r13m）
      caliber: 0.127,          // rocket.caliber
      wingMult: 1.4,           // rocket.wingAreaMult
      cxK: 3.3,                // rocket.CxK
      stages: [
        { t: 2, thrust: 26000, massLost: 27.7 /* mass-massEnd */ }
      ],
      nMaxG: 15,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 5,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 60,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 2.4,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 2.83,           // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.1,      // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 18.7,     // 回退：取 R-13M1 同字段（su_r_13m.blkx 无 rocket.finsLatAccel，取 su_r_13m1.blkx finsLatAccel=18.7）
      pid: {
        p: 0.01, i: 0.005, d: 0.002, iLim: 0.5, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    // ---- 第五批：Fakour-90 思想90（伊朗） ----
    fakour90: {
      key: 'fakour90', name: 'Fakour-90 思想90（远程主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 637.2973,        // rocket.mass
      caliber: 0.37,          // rocket.caliber
      wingMult: 1.2,          // rocket.wingAreaMult
      cxK: 1.05,              // rocket.CxK
      stages: [
        { t: 5, thrust: 83900, massLost: 182 /* mass-massEnd = 637.2973-455.2973 */ },
        { t: 21, thrust: 12400, massLost: 113 /* massEnd-massEnd1 = 455.2973-342.2973 */ }
      ],
      nMaxG: 20,              // rocket.loadFactorMax
      pnGain: 4,              // guidanceAutopilot.propNavMult
      fuseR: 20,              // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,   // radarSeeker.rateMax（guidanceType=radar，active=主动）
      minDist: 30,            // rocket.minDistance
      lifeS: 150,             // rocket.timeLife
      vMax: 2000,             // rocket.endSpeed
      maxMach: 4,             // rocket.machMax
      loft: true,             // guidanceAutopilot.loftEnabled = true
      loftAngleDeg: 15,       // guidanceAutopilot.loftElevation
      launchMach: 1.5,        // 默认值（主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 4.25,          // rocket.length
      cxVsAoaPerRad2: null,   // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,        // datamine 未提供（无 rocket.CyK）
      maxCy: null,            // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,      // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.35,    // rocket.distFromCmToStab
      finAoaHorRad: 0.244082, // rocket.finsAoaHor
      finAoaVerRad: 0.244082, // rocket.finsAoaVer
      finsLatAccelG: 25.088,  // rocket.finsLatAccel
      pid: {
        p: 0.0311, i: 0.016, d: 0.00035, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    // ---- 第六批：麻雀家族/闪电家族 ----
    aim7f: {
      key: 'aim7f', name: 'AIM-7F 麻雀（半主动雷达中距弹）',
      // ---- 基础参数 ----
      mass0: 231.3321,         // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 4.5, thrust: 21479.88, massLost: 42.8645 /* mass-massEnd = 231.3321-188.4676 */ },
        { t: 11, thrust: 3765.95, massLost: 18.3705 /* massEnd-massEnd1 = 188.4676-170.0971 */ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 400,            // rocket.minDistance
      lifeS: 75,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6676,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK，语义与本模型升力斜率不等价，仅参考
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 29,       // rocket.finsLatAccel
      pid: {
        p: 0.013481, i: 0.034835, d: 0.001341, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim7e2: {
      key: 'aim7e2', name: 'AIM-7E2 麻雀（半主动雷达格斗弹）',
      // ---- 基础参数 ----
      mass0: 193.7,            // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 2.8, thrust: 31143.83, massLost: 39.2972 /* mass-massEnd = 193.7-154.4028 */ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 40,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6676,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK，语义与本模型升力斜率不等价，仅参考
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 25,       // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.029, d: 0.0008, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r24r: {
      key: 'r24r', name: 'R-24R（中距半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 244,              // rocket.mass
      caliber: 0.2,            // rocket.caliber
      wingMult: 1.35,          // rocket.wingAreaMult
      cxK: 2.1,                // rocket.CxK
      stages: [
        { t: 3, thrust: 50000, massLost: 75 /* mass-massEnd = 244-169 */ }
      ],
      nMaxG: 24,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 10,               // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 45,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 4.487,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.133,    // rocket.distFromCmToStab
      finAoaHorRad: 0.28,      // rocket.finsAoaHor
      finAoaVerRad: 0.28,      // rocket.finsAoaVer
      finsLatAccelG: 21.9,     // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.0236, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    r24t: {
      key: 'r24t', name: 'R-24T（中距红外弹）',
      // ---- 基础参数 ----
      mass0: 237,              // rocket.mass
      caliber: 0.2,            // rocket.caliber
      wingMult: 1.35,          // rocket.wingAreaMult
      cxK: 2.1,                // rocket.CxK
      stages: [
        { t: 3, thrust: 50000, massLost: 75 /* mass-massEnd = 237-162 */ }
      ],
      nMaxG: 24,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 10,               // rocket.proximityFuse.radius
      seekerRateMaxDeg: 20,    // opticalSeeker.rateMax（guidanceType=optical）
      minDist: 30,             // rocket.minDistance
      lifeS: 45,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 3.5,            // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.2,         // 默认值（红外弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 4.194,          // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,         // datamine 未提供（无 rocket.CyK）
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.133,    // rocket.distFromCmToStab
      finAoaHorRad: 0.28,      // rocket.finsAoaHor
      finAoaVerRad: 0.28,      // rocket.finsAoaVer
      finsLatAccelG: 21.9,     // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.0236, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim7e: {
      key: 'aim7e', name: 'AIM-7E 麻雀（半主动雷达中距弹）',
      // ---- 基础参数 ----
      mass0: 195.9519,         // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 2.8, thrust: 31143.83, massLost: 41.5491 /* mass-massEnd = 195.9519-154.4028 */ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 6,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 40,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6676,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK，语义与本模型升力斜率不等价，仅参考
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 25,       // rocket.finsLatAccel
      pid: {
        p: 0.013035, i: 0.031954, d: 0.001167, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    aim7d: {
      key: 'aim7d', name: 'AIM-7D 麻雀（半主动雷达中距弹）',
      // ---- 基础参数 ----
      mass0: 182.34,           // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 2.1, thrust: 34700, massLost: 38.34 /* mass-massEnd = 182.34-144 */ }
      ],
      nMaxG: 15,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 8,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 12,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 40,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6676,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK，语义与本模型升力斜率不等价，仅参考
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 15,       // rocket.finsLatAccel
      pid: {
        p: 0.008896, i: 0.037609, d: 0.000719, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    skyflash_dogfight: {
      key: 'skyflash_dogfight', name: 'Skyflash 天空闪光 格斗型（半主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 195.04,           // rocket.mass
      caliber: 0.2032,         // rocket.caliber
      wingMult: 3.25,          // rocket.wingAreaMult
      cxK: 1.4125,             // rocket.CxK
      stages: [
        { t: 2.8, thrust: 31143.83, massLost: 41.55 /* mass-massEnd = 195.04-153.49 */ }
      ],
      nMaxG: 25,               // rocket.loadFactorMax
      pnGain: 4,               // guidanceAutopilot.propNavMult
      fuseR: 15.25,            // rocket.proximityFuse.radius
      seekerRateMaxDeg: 44,    // radarSeeker.rateMax（guidanceType=radar，无 active=半主动）
      minDist: 30,             // rocket.minDistance
      lifeS: 40,               // rocket.timeLife
      vMax: 2000,              // rocket.endSpeed
      maxMach: 4,              // rocket.machMax
      loft: false,             // guidanceAutopilot 无 loftEnabled（未启用）
      loftAngleDeg: 0,         // 无 loftElevation（未启用）
      launchMach: 1.5,         // 默认值（半主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.6676,         // rocket.length
      cxVsAoaPerRad2: null,    // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: 3.5,          // rocket.CyK，语义与本模型升力斜率不等价，仅参考
      maxCy: null,             // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,       // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.052,    // rocket.distFromCmToStab
      finAoaHorRad: 0.16,      // rocket.finsAoaHor
      finAoaVerRad: 0.16,      // rocket.finsAoaVer
      finsLatAccelG: 25,       // rocket.finsLatAccel
      pid: {
        p: 0.0025, i: 0.029, d: 0.0008, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800  // guidanceAutopilot.baseIndSpeed
      }
    },
    // ---- 第七批：PL-15 ----
    pl15: {
      key: 'pl15', name: 'PL-15（远程主动雷达弹）',
      // ---- 基础参数 ----
      mass0: 198,               // rocket.mass
      caliber: 0.203,           // rocket.caliber
      wingMult: 1.4,            // rocket.wingAreaMult
      cxK: 1.6,                 // rocket.CxK
      stages: [
        { t: 3, thrust: 34500, massLost: 45 /* propulsion0.impulse0.massLost（datamine 直接给出）*/ },
        { t: 2.5, thrust: 17250, massLost: 15 /* propulsion1.impulse0.massLost（datamine 直接给出）*/ }
      ],
      nMaxG: 38,                // rocket.loadFactorMax
      pnGain: 4,                // guidanceAutopilot.propNavMult
      fuseR: 10,                // rocket.proximityFuse.radius
      seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar，active=主动）
      minDist: 30,              // rocket.minDistance
      lifeS: 80,                // rocket.timeLife
      vMax: 2000,               // rocket.endSpeed
      maxMach: 4,               // rocket.machMax
      loft: true,               // guidanceAutopilot.loftEnabled
      loftAngleDeg: 20,         // guidanceAutopilot.loftElevation
      launchMach: 1.5,          // 默认值（主动雷达弹；datamine 仅有 startSpeed=0，无发射初速马赫依据）
      // ---- 细化气动参数（原值原单位，缺字段写 null）----
      lengthM: 3.93,            // rocket.length
      cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
      cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
      maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
      maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
      finMomentArmM: 0.3,       // rocket.distFromCmToStab
      finAoaHorRad: 0.375092,   // rocket.finsAoaHor
      finAoaVerRad: 0.375092,   // rocket.finsAoaVer
      finsLatAccelG: 41.4036,   // rocket.finsLatAccel
      pid: {
        p: 0.0046, i: 0.0375, d: 0.00015, iLim: 1, // guidanceAutopilot.accelControl*
        baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
      }
    }
  });
})(window.WT);

/* ==== 原 missiles_patch.js（2.59.0.7 修正 / 离架延迟 timeOutS / 红外判型标记）已并入本文件 ==== */
/* missiles_patch.js — 用 WT 2.59.0.7 拆包数据补齐/修正原始预设（aim9l/pl8/r60/aim120a）
 * 来源 rocketguns/*.blkx：us_aim9l_sidewinder.blkx / su_pl8.blkx / su_r_60.blkx / us_aim_120a.blkx
 * 标注 "// 2.59修正：原值=XX" 者为 2.59 拆包值与 config.js 原值不一致、已采用 2.59 值
 * 提取日期 2026-09-23 */
(function (WT) {
  'use strict';
  Object.assign(WT.MISSILE_PRESETS.aim9l, {
    // ---- 基础参数校对（2.59）----
    mass0: 84.46,             // rocket.mass
    caliber: 0.127,           // rocket.caliber
    wingMult: 1.4,            // rocket.wingAreaMult
    cxK: 3.4,                 // rocket.CxK
    stages: [
      { t: 5.3, thrust: 10800, massLost: 27.4 /* mass-massEnd */ }
    ],
    nMaxG: 30,                // rocket.loadFactorMax
    pnGain: 4,                // guidanceAutopilot.propNavMult
    fuseR: 5,                 // rocket.proximityFuse.radius
    seekerRateMaxDeg: 22,     // opticalSeeker.rateMax（guidanceType=optical）
    minDist: 30,              // rocket.minDistance
    lifeS: 60,                // rocket.timeLife
    vMax: 2000,               // 2.59修正：原值=1000（rocket.endSpeed）
    maxMach: 2.5,             // rocket.machMax
    loft: false,              // guidanceAutopilot 无 loftEnabled（未启用）
    loftAngleDeg: 0,          // 无 loftElevation（未启用）
    // ---- 细化气动参数（原值原单位，缺字段写 null）----
    lengthM: 2.85,            // rocket.length
    cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
    cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
    maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
    maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
    finMomentArmM: 0.1,       // rocket.distFromCmToStab
    finAoaHorRad: 0.25,       // rocket.finsAoaHor
    finAoaVerRad: 0.25,       // rocket.finsAoaVer
    finsLatAccelG: 37.5,      // rocket.finsLatAccel
    pid: {
      p: 0.002, i: 0.0361, d: 0.0006, iLim: 1, // guidanceAutopilot.accelControl*
      baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
    }
  });
  Object.assign(WT.MISSILE_PRESETS.pl8, {
    // ---- 基础参数校对（2.59）----
    mass0: 121,               // rocket.mass
    caliber: 0.16,            // rocket.caliber
    wingMult: 1.4,            // rocket.wingAreaMult
    cxK: 3.3,                 // rocket.CxK
    stages: [
      { t: 0.785, thrust: 37675, massLost: 13 /* mass-massEnd */ },
      { t: 2.85, thrust: 20500, massLost: 25.7 /* massEnd-massEnd1 */ }
    ],
    nMaxG: 40,                // rocket.loadFactorMax
    pnGain: 4,                // guidanceAutopilot.propNavMult
    fuseR: 7,                 // rocket.proximityFuse.radius
    seekerRateMaxDeg: 20,     // opticalSeeker.rateMax（guidanceType=optical）
    minDist: 30,              // rocket.minDistance
    lifeS: 20,                // rocket.timeLife
    vMax: 2000,               // 2.59修正：原值=1000（rocket.endSpeed）
    maxMach: 3.5,             // rocket.machMax
    loft: false,              // guidanceAutopilot 无 loftEnabled（未启用）
    loftAngleDeg: 0,          // 无 loftElevation（未启用）
    // ---- 细化气动参数（原值原单位，缺字段写 null）----
    lengthM: 2.999,           // rocket.length
    cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
    cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
    maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
    maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
    finMomentArmM: 0.1,       // rocket.distFromCmToStab
    finAoaHorRad: 0.22,       // rocket.finsAoaHor
    finAoaVerRad: 0.22,       // rocket.finsAoaVer
    finsLatAccelG: 31.2,      // rocket.finsLatAccel
    pid: {
      p: 0.0035, i: 0.0346, d: 0.0007, iLim: 1, // guidanceAutopilot.accelControl*
      baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
    }
  });
  Object.assign(WT.MISSILE_PRESETS.r60, {
    // ---- 基础参数校对（2.59）----
    mass0: 43.5,              // rocket.mass
    caliber: 0.12,            // rocket.caliber
    wingMult: 1.25,           // rocket.wingAreaMult
    cxK: 3.1,                 // rocket.CxK
    stages: [
      { t: 3, thrust: 9500, massLost: 10 /* mass-massEnd */ }
    ],
    nMaxG: 30,                // rocket.loadFactorMax
    pnGain: 4,                // guidanceAutopilot.propNavMult
    fuseR: 3,                 // rocket.proximityFuse.radius
    seekerRateMaxDeg: 30,     // opticalSeeker.rateMax（guidanceType=optical）
    minDist: 30,              // rocket.minDistance
    lifeS: 25,                // rocket.timeLife
    vMax: 2000,               // 2.59修正：原值=850（rocket.endSpeed）
    maxMach: 2.5,             // rocket.machMax
    loft: false,              // guidanceAutopilot 无 loftEnabled（未启用）
    loftAngleDeg: 0,          // 无 loftElevation（未启用）
    // ---- 细化气动参数（原值原单位，缺字段写 null）----
    lengthM: 2.095,           // rocket.length
    cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
    cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
    maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
    maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
    finMomentArmM: 0.06,      // rocket.distFromCmToStab
    finAoaHorRad: 0.18,       // rocket.finsAoaHor
    finAoaVerRad: 0.18,       // rocket.finsAoaVer
    finsLatAccelG: 29.1,      // rocket.finsLatAccel
    pid: {
      p: 0.0015, i: 0.0496, d: 0.0005, iLim: 1, // guidanceAutopilot.accelControl*
      baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
    }
  });
  Object.assign(WT.MISSILE_PRESETS.aim120a, {
    // ---- 基础参数校对（2.59）----
    mass0: 156.4894,          // 2.59修正：原值=147.87（rocket.mass）
    caliber: 0.1778,          // rocket.caliber
    wingMult: 1.745,          // 2.59修正：原值=1.275（rocket.wingAreaMult）
    cxK: 1.225,               // 2.59修正：原值=1.425（rocket.CxK）
    stages: [                 // 2.59修正：原值=[{t:1.7,thrust:22300,massLost:16.12},{t:5.3,thrust:13485,massLost:30.42}]
      { t: 1.4, thrust: 26687.5, massLost: 16.1479 /* mass-massEnd */ },
      { t: 5.3, thrust: 13346.5, massLost: 30.5721 /* massEnd-massEnd1 */ }
    ],
    nMaxG: 35,                // rocket.loadFactorMax
    pnGain: 6,                // 2.59修正：原值=4.0（guidanceAutopilot.propNavMult）
    fuseR: 12,                // rocket.proximityFuse.radius
    seekerRateMaxDeg: 60,     // radarSeeker.rateMax（guidanceType=radar，active=true）
    minDist: 30,              // rocket.minDistance
    lifeS: 80,                // rocket.timeLife
    vMax: 2000,               // rocket.endSpeed
    maxMach: 4,               // rocket.machMax
    loft: true,               // guidanceAutopilot.loftEnabled
    loftAngleDeg: 22,         // 2.59修正：原值=22.5（guidanceAutopilot.loftElevation）
    // ---- 细化气动参数（原值原单位，缺字段写 null）----
    lengthM: 3.66,            // rocket.length
    cxVsAoaPerRad2: null,     // datamine 未提供（无 rocket.CxAoA）
    cyKPerRad: null,          // datamine 未提供（无 rocket.CyK）
    maxCy: null,              // datamine 未提供（无 rocket.CyMaxAoA）
    maxCyAoaRad: null,        // datamine 未提供（无 rocket.CyMaxAoA）
    finMomentArmM: 0.9,       // rocket.distFromCmToStab
    finAoaHorRad: 0.452936,   // rocket.finsAoaHor
    finAoaVerRad: 0.452936,   // rocket.finsAoaVer
    finsLatAccelG: 35,        // rocket.finsLatAccel
    pid: {
      p: null, i: null, d: null, iLim: null, // datamine 未提供（本弹 autopilot 仅有 pid0/pid1 时变块，无 accelControl* 字段）
      baseIndSpeedKmh: 1800   // guidanceAutopilot.baseIndSpeed
    }
  });
  /* RWR 告警标记：红外弹（datamine guidanceType=optical）无雷达辐射 → 不告警 */
  const IR_KEYS = ['aim9l', 'aim9b', 'aim9d', 'aim9h', 'aim9j', 'aim9m', 'aim9p4',
    'pl8', 'pl8b', 'pl5b', 'pl5c', 'pl5e2', 'pl7', 'pl9', 'pl2',
    'r60', 'r60m', 'r60mk', 'r73', 'r13m', 'r13m1', 'r3s', 'r27t', 'r27et',
    'r24t', 'redtop',
    'pyton3', 'pyton4', 'aam3', 'magic', 'magic2', 'firestreak', 'shafrir2',
    'aim4g', 'aim4f'];
  for (const k of IR_KEYS) {
    if (WT.MISSILE_PRESETS[k]) WT.MISSILE_PRESETS[k].irSeeker = true;
  }
  /* ---- 离架延迟 timeOutS（datamine guidanceAutopilot.timeOut，单位 s；发射后直飞段）---- */
  Object.assign(WT.MISSILE_PRESETS.aim9l, { timeOutS: 0.4 /* us_aim9l_sidewinder.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl8, { timeOutS: 0.5 /* su_pl8.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r60, { timeOutS: 0.35 /* su_r_60.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim120a, { timeOutS: 0.6 /* us_aim_120a.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim120d, { timeOutS: 0.6 /* us_aim_120d.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl12, { timeOutS: 0.3 /* cn_pl12.blkx timeToGain 零增益平台 0.3s（无 timeOut 字段；两格式互斥） */ });
  Object.assign(WT.MISSILE_PRESETS.pl12a, { timeOutS: 0.3 /* cn_pl12a.blkx timeToGain 零增益平台 0.3s */ });
  Object.assign(WT.MISSILE_PRESETS.r77, { timeOutS: 0.3 /* su_r_77.blkx timeToGain 零增益平台 0.3s */ });
  Object.assign(WT.MISSILE_PRESETS.r77_1, { timeOutS: 0.3 /* su_r_77_1.blkx timeToGain 零增益平台 0.3s */ });
  Object.assign(WT.MISSILE_PRESETS.mica_em, { timeOutS: 0.15 /* fr_mica_em.blkx timeToGain 零增益平台 0.15s */ });
  Object.assign(WT.MISSILE_PRESETS.derby, { timeOutS: 0.3 /* il_derby.blkx timeToGain 零增益平台 0.3s */ });
  Object.assign(WT.MISSILE_PRESETS.aim9m, { timeOutS: 0.4 /* us_aim9m_sidewinder.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim7m, { timeOutS: 0 /* us_aim7m_sparrow.blkx 无 timeOut；timeToGain=(0,0)→(1,1) 无零增益平台，t=0 即有增益 */ });
  Object.assign(WT.MISSILE_PRESETS.r73, { timeOutS: 0.15 /* su_r_73.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r27r, { timeOutS: 0.35 /* su_r_27r.blkx timeToGain 零增益平台 0.35s（无 timeOut 字段） */ });
  Object.assign(WT.MISSILE_PRESETS.r27t, { timeOutS: 0.35 /* su_r_27t.blkx timeToGain 零增益平台 0.35s */ });
  Object.assign(WT.MISSILE_PRESETS.pyton4, { timeOutS: 0.2 /* il_pyton_4.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aam3, { timeOutS: 0.4 /* jp_aam3.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aam4, { timeOutS: 0.3 /* jp_aam4.blkx timeToGain 零增益平台 0.3s */ });
  Object.assign(WT.MISSILE_PRESETS.pl5e2, { timeOutS: 0.5 /* su_pl5e2.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl9, { timeOutS: 0.5 /* su_pl9.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.skyflash, { timeOutS: 1.8 /* uk_skyflash_aim_7.blkx timeToGain 零增益平台 1.8s */ });
  Object.assign(WT.MISSILE_PRESETS.r3r, { timeOutS: 0.5 /* su_r_3r.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r27et, { timeOutS: 0.35 /* su_r_27et.blkx timeToGain 零增益平台 0.35s */ });
  Object.assign(WT.MISSILE_PRESETS.pl8b, { timeOutS: 0.5 /* cn_pl8b.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r27er, { timeOutS: 0.35 /* su_r_27er.blkx timeToGain 零增益平台 0.35s */ });
  Object.assign(WT.MISSILE_PRESETS.r60m, { timeOutS: 0.35 /* su_r_60m.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r13m1, { timeOutS: 0.5 /* su_r_13m1.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.magic2, { timeOutS: 0.25 /* fr_r_550_magic_2.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim9p4, { timeOutS: 0.5 /* us_aim9p4_sidewinder.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pyton3, { timeOutS: 0.5 /* il_pyton_3.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl5b, { timeOutS: 0.5 /* su_pl5b.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.redtop, { timeOutS: 0.3 /* uk_redtop.blkx timeToGain 零增益平台 0.3s */ });
  Object.assign(WT.MISSILE_PRESETS.aim4g, { timeOutS: 0.63 /* us_aim4g_falcon.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r3s, { timeOutS: 0.5 /* su_r_3s.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim54a, { timeOutS: 2.5 /* us_aim_54a.blkx timeToGain 零增益平台 2.5s */ });
  Object.assign(WT.MISSILE_PRESETS.aim54b, { timeOutS: 2.5 /* us_aim_54b.blkx timeToGain 零增益平台 2.5s */ });
  Object.assign(WT.MISSILE_PRESETS.aim54c, { timeOutS: 2.5 /* us_aim_54c.blkx timeToGain 零增益平台 2.5s */ });
  Object.assign(WT.MISSILE_PRESETS.aim54c_plus, { timeOutS: 2.5 /* us_aim_54c_plus.blkx timeToGain 零增益平台 2.5s */ });
  Object.assign(WT.MISSILE_PRESETS.aim9b, { timeOutS: 0.5 /* us_aim9b_sidewinder.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim9d, { timeOutS: 0.4 /* us_aim9d_sidewinder.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim9h, { timeOutS: 0.4 /* us_aim9h_sidewinder.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim9j, { timeOutS: 0.5 /* us_aim9j_sidewinder.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.magic, { timeOutS: 0.25 /* fr_r_550_magic.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.firestreak, { timeOutS: 0.34 /* uk_firestreak.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.shafrir2, { timeOutS: 0.5 /* il_shafrir_2.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl2, { timeOutS: 0.5 /* su_pl2.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl5c, { timeOutS: 0.5 /* su_pl5c.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl7, { timeOutS: 0.25 /* su_pl7.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl11, { timeOutS: 0.5 /* cn_pl11.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim4f, { timeOutS: 0.63 /* us_aim4f_falcon.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim26b, { timeOutS: 2 /* us_aim_26b.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r60mk, { timeOutS: 0.35 /* su_r_60mk.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.r13m, { timeOutS: 0.5 /* su_r_13m.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.fakour90, { timeOutS: 1.5 /* ir_fakour_90.blkx guidance.timeOut（实测位于 rocket.guidance.guidanceAutopilot 子块内） */ });
  Object.assign(WT.MISSILE_PRESETS.aim7f, { timeOutS: 0 /* us_aim7f_sparrow.blkx 无 timeOut；timeToGain=(0,0)→(1,1) 无零增益平台，t=0 即有增益 */ });
  Object.assign(WT.MISSILE_PRESETS.aim7e2, { timeOutS: 0.7 /* us_aim7e2_dogfight_sparrow.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.aim7e, { timeOutS: 1.8 /* us_aim7e_sparrow.blkx timeToGain 零增益平台 1.8s */ });
  Object.assign(WT.MISSILE_PRESETS.aim7d, { timeOutS: 1.8 /* us_aim7d_sparrow.blkx timeToGain 零增益平台 1.8s */ });
  Object.assign(WT.MISSILE_PRESETS.r24r, { timeOutS: 0.5 /* su_r_24r.blkx timeToGain 零增益平台 0.5s */ });
  Object.assign(WT.MISSILE_PRESETS.r24t, { timeOutS: 0.5 /* su_r_24t.blkx timeToGain 零增益平台 0.5s */ });
  Object.assign(WT.MISSILE_PRESETS.skyflash_dogfight, { timeOutS: 0.7 /* uk_skyflash_aim_7_dogfight.blkx guidanceAutopilot.timeOut */ });
  Object.assign(WT.MISSILE_PRESETS.pl15, { timeOutS: 0.3 /* cn_pl15.blkx timeToGain 零增益平台 0.3s */ });
})(window.WT);
