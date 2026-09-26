/* smoke-test.js — 动力学内核冒烟测试（Node 运行：node tools/smoke-test.js）
 * 验证：大气/阻力表、迎头不机动目标应被命中、机动战术下可脱靶 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
global.window = global;
global.addEventListener = global.addEventListener || (() => {});   // main.js 启动注册
for (const f of ['lib/three.min.js', 'js/config.js', 'js/missiles.js',
  'js/missiles.js', 'js/physics.js', 'js/aero.js', 'js/dez.js', 'js/tactics.js',
  'js/duel.js', 'js/audio.js', 'js/render.js', 'js/ui.js', 'js/main.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}

const WT = global.WT;
const P = WT.phys;
const base = WT.DEFAULTS;
let pass = 0, fail = 0;
function check(name, cond, info) {
  if (cond) { pass++; console.log(`  [PASS] ${name} ${info || ''}`); }
  else { fail++; console.log(`  [FAIL] ${name} ${info || ''}`); }
}
check('render.js / main.js 加载无异常（黑屏回归）',
  typeof WT.SimView === 'function' && typeof WT.ui.init === 'function' &&
  typeof WT.DuelSim === 'function');
check('audio.js 加载无异常（音效合成）',
  typeof WT.audio === 'object' && typeof WT.audio.tick === 'function' &&
  typeof WT.audio.launch === 'function');
try {
  WT.audio.init(); WT.audio.resume(); WT.audio.launch();
  WT.audio.explode(); WT.audio.setEngine(0.5); WT.audio.tick(0.01, 0.5);
  WT.audio.tick(0.01, 0); WT.audio.setMuted(true); WT.audio.tick(0.01, 0.8);
  check('音效 API 无 AudioContext 环境安全', true);
} catch (e) {
  check('音效 API 无 AudioContext 环境安全', false, e.message);
}

console.log('== 大气 / 阻力 ==');
const sea = P.atmosphere(0), hi = P.atmosphere(11000);
check('海平面音速≈340 m/s', Math.abs(sea.a - 340.3) < 1.5, `a=${sea.a.toFixed(1)}`);
check('11km 大气密度衰减', hi.rho < 0.4 * sea.rho, `rho=${hi.rho.toFixed(3)}`);
check('Cx(M=1) 阻力峰', P.cxAt(1.1) > P.cxAt(0.8), `Cx(0.8)=${P.cxAt(0.8)} Cx(1.1)=${P.cxAt(1.1)}`);

function mkCfg(over) {
  const preset = WT.MISSILE_PRESETS.aim9l;
  return {
    missile: {
      mass0: preset.mass0, caliber: preset.caliber, wingMult: preset.wingMult,
      cxK: preset.cxK, stages: preset.stages.map(s => ({ ...s })),
      nMaxG: preset.nMaxG, pnGain: preset.pnGain, fuseR: preset.fuseR,
      seekerRateMaxDeg: preset.seekerRateMaxDeg,
      minDist: 30, lifeS: preset.lifeS, vMax: preset.vMax, maxMach: preset.maxMach,
      loft: false, loftAngleDeg: 0
    },
    aircraft: { ...base.aircraft },
    scenario: { ...base.scenario, ...(over || {}) }
  };
}

console.log('== 迎头 8km 不机动 ==');
{
  const eng = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 8000 }));
  let peakMG = 0;
  while (!eng.done && eng.t < 60) {
    eng.step(0.01, { pitch: 0, roll: 0 });
    peakMG = Math.max(peakMG, eng.missile.gLoad);
  }
  check('静止目标被命中', eng.result && eng.result.hit,
    `${eng.result.label} t=${eng.t.toFixed(1)}s miss=${eng.result.missDist.toFixed(1)}m`);
  check('导弹过载遥测有效（0.9~30 G）', peakMG >= 0.9 && peakMG <= 30.1,
    `peak=${peakMG.toFixed(1)}G`);
}

console.log('== 尾追 3km 不机动 ==');
{
  const eng = new P.Engagement(mkCfg({ aspectDeg: 180, launchDistM: 3000 }));
  while (!eng.done && eng.t < 60) eng.step(0.01, { pitch: 0, roll: 0 });
  check('尾追命中', eng.result && eng.result.hit,
    `${eng.result.label} t=${eng.t.toFixed(1)}s miss=${eng.result.missDist.toFixed(1)}m`);
}

console.log('== 拉过载的能量损失（诱导阻力） ==');
{
  const eS = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 15000 }));
  while (!eS.done && eS.t < 3) eS.step(0.01, { pitch: 0, roll: 0 });
  const vS = eS.missile.vel.length();
  const eM = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 15000 }));
  while (!eM.done && eM.t < 3) eM.step(0.01, { pitch: 1, roll: 0 });
  const vM = eM.missile.vel.length();
  check('目标持续9G时导弹速度损失显著更快', vM < vS - 2,
    `直飞=${vS.toFixed(0)}m/s 机动后=${vM.toFixed(0)}m/s`);
}

console.log('== 侧向 6km 不机动（PN 侧向拦截） ==');
{
  const eng = new P.Engagement(mkCfg({ aspectDeg: 90, launchDistM: 6000 }));
  while (!eng.done && eng.t < 60) eng.step(0.01, { pitch: 0, roll: 0 });
  check('侧向拦截命中', eng.result && eng.result.hit,
    `${eng.result.label} t=${eng.t.toFixed(1)}s miss=${eng.result.missDist.toFixed(1)}m`);
}

console.log('== 战术对比批量打靶（迎头 6km, ×20） ==');
for (const tid of ['steadyTurn', 'tail', 'tailLevel', 'dez']) {
  const cfg = mkCfg({ aspectDeg: 0, launchDistM: 6000 });
  const rs = P.runBatch(cfg, (rng) => WT.tactics.create(tid, rng), 20, 42);
  const hits = rs.filter(r => r.hit).length;
  const missAvg = rs.filter(r => !r.hit).reduce((s, r) => s + r.missDist, 0) /
    Math.max(1, rs.filter(r => !r.hit).length);
  console.log(`  [INFO] ${tid}: 命中 ${hits}/20, 平均脱靶 ${missAvg.toFixed(0)} m`);
  check(tid + ' 全程有结果', rs.every(r => r.label), `hits=${hits}`);
}

console.log('== RWR 方位角（0=机头正前，+=右） ==');
{
  const eng0 = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 5000 }));
  const b0 = WT.tactics.missileBearing(eng0) * 180 / Math.PI;
  check('迎头方位角≈0°', Math.abs(b0) < 5, `brg=${b0.toFixed(1)}°`);
  const eng90 = new P.Engagement(mkCfg({ aspectDeg: 90, launchDistM: 5000 }));
  const b90 = WT.tactics.missileBearing(eng90) * 180 / Math.PI;
  check('来袭方位90°=右侧（RWR 显示 +90°）', Math.abs(b90 - 90) < 5, `brg=${b90.toFixed(1)}°`);
  const eng180 = new P.Engagement(mkCfg({ aspectDeg: 180, launchDistM: 5000 }));
  const b180 = WT.tactics.missileBearing(eng180) * 180 / Math.PI;
  check('尾追方位角≈±180°', Math.abs(Math.abs(b180) - 180) < 5, `brg=${b180.toFixed(1)}°`);
  /* 机动中：机头右转 90° 后，原正前的导弹应转到左侧 -90° */
  const engYaw = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 5000 }));
  engYaw.aircraft.quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), -Math.PI / 2);
  const bYaw = WT.tactics.missileBearing(engYaw) * 180 / Math.PI;
  check('右转90°后原前方导弹显示-90°（左）', Math.abs(bYaw + 90) < 5, `brg=${bYaw.toFixed(1)}°`);
  /* 大坡度不退化：横滚 90° 后水平面右侧的导弹仍应显示 +90° */
  const engRoll = new P.Engagement(mkCfg({ aspectDeg: 90, launchDistM: 5000 }));
  engRoll.aircraft.quat.setFromAxisAngle(new THREE.Vector3(0, 0, -1), Math.PI / 2);
  const bRoll = WT.tactics.missileBearing(engRoll) * 180 / Math.PI;
  check('坡度90°时右侧导弹仍显示+90°', Math.abs(bRoll - 90) < 5, `brg=${bRoll.toFixed(1)}°`);
  /* 左转 → 原前方导弹应相对向右移（+30°） */
  const engLeft = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 5000 }));
  engLeft.aircraft.quat.setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 6);
  const bLeft = WT.tactics.missileBearing(engLeft) * 180 / Math.PI;
  check('左转30°后原前方导弹显示+30°（右移）', Math.abs(bLeft - 30) < 5, `brg=${bLeft.toFixed(1)}°`);
}

console.log('== 置尾平飞定高回归 ==');
{
  const eng = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 15000 }));
  const tac = WT.tactics.create('tailLevel', P.mulberry32(7));
  while (!eng.done && eng.t < 6) eng.step(0.01, tac.update(eng, 0.01));
  check('置尾平飞高度起伏 < 60 m', Math.abs(eng.aircraft.pos.y - 5000) < 60,
    `y=${eng.aircraft.pos.y.toFixed(0)}m`);
}

console.log('== 战术区分度（尾追 15km, 导弹初速 Ma1.0, ×20） ==');
let anyEvaded = false;
for (const tid of ['steadyTurn', 'tail', 'tailLevel', 'dez']) {
  const cfg = mkCfg({ aspectDeg: 180, launchDistM: 15000, launchMach: 1.0 });
  const rs = P.runBatch(cfg, (rng) => WT.tactics.create(tid, rng), 20, 42);
  const hits = rs.filter(r => r.hit).length;
  const missAvg = rs.filter(r => !r.hit).reduce((s, r) => s + r.missDist, 0) /
    Math.max(1, rs.filter(r => !r.hit).length);
  console.log(`  [INFO] ${tid}: 命中 ${hits}/20, 平均脱靶 ${missAvg.toFixed(0)} m`);
  if (hits < 20) anyEvaded = true;
}
check('恶劣场景下规避可生效（存在真实脱靶）', anyEvaded);

/* ---------- 细化气动模型（AeroMissile） ---------- */
function mkCfgFull(key, over) {
  const preset = WT.MISSILE_PRESETS[key];
  return {
    missile: Object.assign({}, preset, {
      stages: preset.stages.map(s => ({ ...s })),
      model: 'aero'
    }),
    aircraft: { ...WT.DEFAULTS.aircraft },
    scenario: { ...WT.DEFAULTS.scenario, ...(over || {}) }
  };
}

console.log('== 细化气动模型（AoA/诱导阻力/舵面限制） ==');
{
  /* PL-12 迎头 12km 不机动应命中（双级+中段爬升+气动模型） */
  const eng = new P.Engagement(mkCfgFull('pl12', { aspectDeg: 0, launchDistM: 12000 }));
  let peakAoa = 0;
  while (!eng.done && eng.t < 90) {
    eng.step(0.01, { pitch: 0, roll: 0 });
    peakAoa = Math.max(peakAoa, eng.missile.alphaDeg || 0);
  }
  check('PL-12 气动模型迎头命中', eng.result && eng.result.hit,
    `${eng.result.label} t=${eng.t.toFixed(1)}s miss=${eng.result.missDist.toFixed(1)}m`);
  const aoaLimit = Math.min(WT.MISSILE_PRESETS.pl12.finAoaHorRad,
    WT.MISSILE_PRESETS.pl12.finAoaVerRad) * 180 / Math.PI;
  check('AoA 受舵面迎角限制', peakAoa <= aoaLimit + 0.5,
    `peakAoA=${peakAoa.toFixed(1)}° lim=${aoaLimit.toFixed(1)}°`);
}
{
  /* 迎角诱导阻力：大过载机动时能量损失应显著（隔离高抛程序，专测诱导阻力） */
  const cS = mkCfgFull('aim120d', { aspectDeg: 0, launchDistM: 20000 });
  cS.missile.loft = false;
  const eS = new P.Engagement(cS);
  while (!eS.done && eS.t < 3) eS.step(0.01, { pitch: 0, roll: 0 });
  const vS = eS.missile.vel.length();
  const cM = mkCfgFull('aim120d', { aspectDeg: 0, launchDistM: 20000 });
  cM.missile.loft = false;
  const eM = new P.Engagement(cM);
  while (!eM.done && eM.t < 3) eM.step(0.01, { pitch: 1, roll: 0 });
  const vM = eM.missile.vel.length();
  check('气动模型诱导阻力生效（9G 机动掉速更快）', vM < vS - 2,
    `直飞=${vS.toFixed(0)}m/s 机动后=${vM.toFixed(0)}m/s`);
}
{
  /* 全部扩展导弹预设完整性（58 款） */
  const keys = ['aim120d', 'pl12', 'pl12a', 'r77', 'r77_1', 'mica_em', 'derby',
    'aim9m', 'aim7m', 'r73', 'r27r', 'r27t', 'pyton4', 'aam3', 'aam4',
    'pl5e2', 'pl9', 'skyflash', 'r3r',
    'r27et', 'pl8b', 'r27er', 'r60m', 'r13m1', 'magic2', 'aim9p4',
    'pyton3', 'pl5b', 'redtop', 'aim4g', 'r3s',
    'aim54a', 'aim54b', 'aim54c', 'aim54c_plus', 'aim9b', 'aim9d', 'aim9h',
    'aim9j', 'magic', 'firestreak', 'shafrir2', 'pl2', 'pl5c', 'pl7', 'pl11',
    'aim4f', 'aim26b', 'r60mk', 'r13m', 'fakour90',
    'aim7f', 'aim7e2', 'aim7e', 'aim7d', 'r24r', 'r24t', 'skyflash_dogfight',
    'pl15'];
  check('59 款扩展导弹预设齐全', keys.every(k => WT.MISSILE_PRESETS[k] &&
    WT.MISSILE_PRESETS[k].mass0 > 0 && WT.MISSILE_PRESETS[k].finsLatAccelG > 0));
}
{
  /* 原始 4 款预设气动字段已补齐（数据缺失修复回归） */
  const fixed = ['aim9l', 'pl8', 'r60', 'aim120a'].every(k => {
    const p = WT.MISSILE_PRESETS[k];
    return p.lengthM > 0 && p.finAoaHorRad > 0 && p.finsLatAccelG > 0 &&
      p.finMomentArmM > 0 && p.pid && p.pid.baseIndSpeedKmh > 0;
  });
  check('原始预设（aim9l/aim120a 等）气动字段已补齐', fixed);
  check('全部预设离架延迟已填写',
    ['aim9l', 'pl8', 'r60', 'aim120a', 'aim120d', 'r73', 'fakour90', 'pl15', 'aim26b']
      .every(k => WT.MISSILE_PRESETS[k] && WT.MISSILE_PRESETS[k].timeOutS !== undefined),
    `aim9l=${WT.MISSILE_PRESETS.aim9l.timeOutS}s fakour90=${WT.MISSILE_PRESETS.fakour90.timeOutS}s`);
}
{
  /* 舵面权限标定（用户反馈场景）：AIM-120D 在 M2.6 动压下应能拉满 35G */
  const p = WT.MISSILE_PRESETS.aim120d;
  const A = WT.buildAero(p);
  const atm = P.atmosphere(5000);
  const q26 = 0.5 * atm.rho * Math.pow(2.6 * atm.a, 2);
  const auth = Math.min(p.nMaxG, A.finsLatG) * Math.min(1, q26 / A.qRef);
  check('AIM-120D M2.6 舵面权限 ≈35G', auth >= 34.5,
    `auth=${auth.toFixed(1)}G q=${(q26 / 1000).toFixed(0)}kPa`);
  /* 侧向短距饱和需求：应能实际拉出 >25G（旧升力链会卡在 ~13G） */
  const eng = new P.Engagement(mkCfgFull('aim120d',
    { aspectDeg: 90, launchDistM: 2000, launchMach: 2.0 }));
  let peak = 0;
  while (!eng.done && eng.t < 30) {
    eng.step(0.01, { pitch: 1, roll: 0 });
    peak = Math.max(peak, eng.missile.gLoad || 0);
  }
  check('AIM-120D 高需求下实际过载 >25G', peak > 25 && peak <= 35.5,
    `peak=${peak.toFixed(1)}G`);
}

console.log('== 重力势能 ↔ 动能（爬升减速/俯冲加速/机械能守恒） ==');
{
  const p = WT.MISSILE_PRESETS.aim9l;
  const cfg = Object.assign({}, p, {
    stages: [{ t: 200, thrust: 0, massLost: 0 }],
    cxK: 1e-6, loft: false, fuseR: 5, seekerRateMaxDeg: 60, lifeS: 200, model: 'base'
  });
  const target = { pos: new THREE.Vector3(0, 0, -1e7), vel: new THREE.Vector3(0, 0, 0) };
  function ballistic(vy, y0) {
    const m = new P.Missile(cfg, {
      pos: new THREE.Vector3(0, y0, 0),
      vel: new THREE.Vector3(0, 300 * vy, -300 * Math.sqrt(1 - vy * vy)),
      range0: 0
    });
    m.guidanceOn = false;             // 关闭制导，仅弹道
    for (let i = 0; i < 500; i++) m.step(0.01, target, 'dynamic');
    return m;
  }
  const climb = ballistic(Math.sin(Math.PI / 4), 0);      // +45° 爬升
  const level = ballistic(0, 5000);                        // 平飞
  const dive = ballistic(-Math.sin(Math.PI / 4), 8000);    // -45° 俯冲
  check('爬升 5s 减速 >20m/s（动能→势能）', climb.vel.length() < 280,
    `v=${climb.vel.length().toFixed(1)} y=${climb.pos.y.toFixed(0)}`);
  check('俯冲 5s 加速 >20m/s（势能→动能）', dive.vel.length() > 320,
    `v=${dive.vel.length().toFixed(1)}`);
  check('平飞 5s 速度基本不变', Math.abs(level.vel.length() - 300) < 8,
    `v=${level.vel.length().toFixed(1)}`);
  /* 机械能守恒（升力⊥速度不做功；残差=诱导阻力做功） */
  const E0 = 0.5 * 300 * 300 + WT.G0 * 8000;
  const Ed = 0.5 * dive.vel.length() ** 2 + WT.G0 * dive.pos.y;
  check('俯冲段机械能守恒（残差=阻力<5%）', Math.abs(Ed - E0) / E0 < 0.05,
    `ΔE/E=${(100 * Math.abs(Ed - E0) / E0).toFixed(2)}%`);
}

console.log('== DEZ 动能规避（Alkaher2015 论文验证） ==');
{
  /* 论文情景：20000ft(6.1km)、目标 Mach1、能量耗尽型滑行导弹 M4.5→M1 */
  function coastCfg(dist, launchMach) {
    const p = WT.MISSILE_PRESETS.aim120a;
    return {
      missile: Object.assign({}, p, {
        stages: [{ t: 0.01, thrust: 0, massLost: 0 }],   // 纯滑行
        loft: false, model: 'base'
      }),
      aircraft: { ...WT.DEFAULTS.aircraft },
      scenario: {
        ...WT.DEFAULTS.scenario,
        aspectDeg: 0, launchDistM: dist,
        launchAltM: 6100, targetAltM: 6100, launchMach
      }
    };
  }
  const cfg = coastCfg(30000, 4.5);
  const a6 = P.atmosphere(6100).a;
  const cr = WT.dez.coastRange(cfg.missile, 6100, 4.5 * a6, 1.0 * a6, cfg.missile.mass0);
  check('滑行能量航程 M4.5→M1 > 15km', cr.s > 15000,
    `s=${(cr.s / 1000).toFixed(1)}km tf=${cr.t.toFixed(0)}s`);

  /* 几何：尾追 DER < 迎头 DER（转尾追消除双方转弯代价项；
   * 论文中"缩 66%"为全程动态累计——几何 66% + 能量衰减 33%） */
  const eH = new P.Engagement(coastCfg(30000, 4.5));
  const dH = WT.dez.computeRdez(eH.missile, eH.aircraft, cfg.missile, 9);
  const eT = new P.Engagement(coastCfg(30000, 4.5));
  eT.aircraft.vel.copy(eT.missile.vel).setLength(eT.aircraft.V);   // 目标顺弹速 = 尾追
  const dT = WT.dez.computeRdez(eT.missile, eT.aircraft, cfg.missile, 9);
  check('尾追 DER 显著小于迎头 DER', dT.rDez < 0.95 * dH.rDez,
    `迎头=${(dH.rDez / 1000).toFixed(1)}km 尾追=${(dT.rDez / 1000).toFixed(1)}km`);
  /* 能量衰减：同几何下弹速越低 DER 越小（论文动态收缩的能量项） */
  const eS = new P.Engagement(coastCfg(30000, 2.2));
  const dS = WT.dez.computeRdez(eS.missile, eS.aircraft, cfg.missile, 9);
  check('低弹速 DER 显著收缩（能量衰减项）', dS.rDez < 0.6 * dH.rDez,
    `M4.5=${(dH.rDez / 1000).toFixed(1)}km M2.2=${(dS.rDez / 1000).toFixed(1)}km`);

  /* 论文定理：DEZ 内启动最优动能规避 → 脱离；不机动 → 命中 */
  check('初始处于 DEZ 内', 30000 > dH.rDez,
    `R_DEZ=${(dH.rDez / 1000).toFixed(1)}km`);
  /* NEZ/DEZ 双边界分区 */
  check('NEZ ≤ DEZ 且为正', dH.rNez > 0 && dH.rNez < dH.rDez,
    `NEZ=${(dH.rNez / 1000).toFixed(1)}km DEZ=${(dH.rDez / 1000).toFixed(1)}km`);
  check('40km 判"安全"', WT.dez.status(40000, dH.rNez, dH.rDez).code === 'safe');
  check('30km 判"立即脱离!"（DEZ 裕度带）',
    WT.dez.status(30000, dH.rNez, dH.rDez).code === 'go');
  check('NEZ 内判"末端"', WT.dez.status(dH.rNez * 0.5, dH.rNez, dH.rDez).code === 'nez');
  check('NEZ/DEZ 间判"对抗区"',
    WT.dez.status((dH.rNez + dH.rDez) / 2, dH.rNez, dH.rDez).code === 'contested');
  const eng = new P.Engagement(coastCfg(30000, 4.5));
  const tac = WT.tactics.create('dez', P.mulberry32(5));
  while (!eng.done && eng.t < 120) eng.step(0.01, tac.update(eng, 0.01));
  check('DEZ 动能规避成功脱离', eng.result && !eng.result.hit,
    `${eng.result.label} miss=${eng.result.missDist.toFixed(0)}m t=${eng.t.toFixed(1)}s`);
  check('DEZ 规避：允许下高冲刺，禁爬升逃逸',
    eng.aircraft.pos.y < 6100 + 400 && eng.aircraft.pos.y > 6100 - 2500,
    `y=${eng.aircraft.pos.y.toFixed(0)}m`);
  const eng2 = new P.Engagement(coastCfg(30000, 4.5));
  while (!eng2.done && eng2.t < 120) eng2.step(0.01, { pitch: 0, roll: 0 });
  check('对照组不机动被命中', eng2.result && eng2.result.hit,
    `${eng2.result.label} miss=${eng2.result.missDist.toFixed(0)}m`);
}

console.log('== 导弹连发 + 飞行总距离 ==');
{
  const cfg = mkCfg({ aspectDeg: 180, launchDistM: 15000 });
  cfg.scenario.salvoN = 3;
  cfg.scenario.salvoInterval = 2.5;
  const eng = new P.Engagement(cfg);
  check('首发在列 + 2 枚排队', eng.missiles.length === 1 && eng.missileQueue.length === 2);
  while (!eng.done && eng.t < 6) eng.step(0.01, { pitch: 0, roll: 0 });
  check('6s 内连发 3 枚全部出膛', eng.missiles.length === 3, `n=${eng.missiles.length}`);
  while (!eng.done && eng.t < 120) eng.step(0.01, { pitch: 0, roll: 0 });
  check('连发交战正常结算', !!eng.result, eng.result && eng.result.label);
  check('每发飞行总距离已累计', eng.missiles.every(m => m.travelDist > 2000),
    eng.missiles.map(m => (m.travelDist / 1000).toFixed(1)).join('/') + 'km');
}

console.log('== RWR NEZ/DEZ 刻度显示（DOM/Canvas 桩） ==');
{
  const rec = [];
  const ctxStub = new Proxy({}, {
    get: (t, k) => (...a) => { rec.push([k, ...a]); },
    set: () => true
  });
  const els = {};
  const mkEl = (id) => (id === 'rwr' || id === 'ncurve'
    ? { width: 340, height: 340, style: {}, getContext: () => ctxStub }
    : {
        textContent: '', innerHTML: '', style: {}, value: '', checked: false,
        options: [], selectedOptions: [{ textContent: '' }],
        addEventListener() {}, appendChild() {}, insertBefore() {}
      });
  global.document = {
    getElementById: (id) => els[id] || (els[id] = mkEl(id)),
    createElement: () => mkEl('_opt'),
    querySelectorAll: () => []
  };
  const eng = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 20000 }));
  /* 语义门槛：先步进过助推段（aim9l 助推 5.3s）进入滑行段再采样 */
  eng.step(0.01, { pitch: 0, roll: 0 });
  while (!eng.done && eng.missile.thrust > 0 && eng.t < 10) {
    eng.step(0.01, { pitch: 0, roll: 0 });
  }
  try { WT.ui.updateHUD(eng); } catch (e) { console.log('  [DIAG] updateHUD 抛错:', e.message); }
  const info = WT.ui._mInfo;
  check('滑行段 NEZ/DEZ 数值有效', !!info && isFinite(info.rNez) && isFinite(info.rDez) && info.rNez > 0,
    info ? `N=${(info.rNez / 1000).toFixed(1)}km D=${(info.rDez / 1000).toFixed(1)}km` : '无 _mInfo');
  const texts = rec.filter(r => r[0] === 'fillText').map(r => r[1]);
  check('滑行段 RWR 绘出 N/D 刻度（含数值）',
    texts.some(t => /^N\d/.test(t)) && texts.some(t => /^D\d/.test(t)),
    'fillText: ' + texts.join(','));
  /* 助推段：不画刻度，仅"滑行段生效"提示 */
  rec.length = 0;
  const engB = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 15000 }));   // ≤19km 告警门内
  engB.step(0.01, { pitch: 0, roll: 0 });
  try { WT.ui.updateHUD(engB); } catch (e) { console.log('  [DIAG] updateHUD 抛错:', e.message); }
  const textsB = rec.filter(r => r[0] === 'fillText').map(r => r[1]);
  check('助推段不画 N/D（提示"滑行段生效"）',
    !textsB.some(t => /^N\d/.test(t)) && textsB.includes('N/D 滑行段生效'),
    textsB.join(','));
  /* 恒速模式：概念不适用，不画 */
  rec.length = 0;
  const cfgC = mkCfg({ aspectDeg: 0, launchDistM: 20000 });
  cfgC.scenario.engine = 'const';
  const engC = new P.Engagement(cfgC);
  engC.step(0.01, { pitch: 0, roll: 0 });
  try { WT.ui.updateHUD(engC); } catch (e) { console.log('  [DIAG] updateHUD 抛错:', e.message); }
  const textsC = rec.filter(r => r[0] === 'fillText').map(r => r[1]);
  check('恒速模式不画 N/D', !textsC.some(t => /^N\d/.test(t)) &&
    !textsC.includes('N/D 滑行段生效'), textsC.join(','));
  /* 完整 UI 初始化链路（浏览器路径复现："切模式卡死"根因）——必须先 init 再测 UI 链路 */
  try {
    for (const [id, v] of Object.entries({
      nmNpos: 9, nmNneg: -4, nmRoll: 180, nmMach: 1, nmTAlt: 5, nmMAlt: 5,
      nmDist: 8, nmMass: 84, nmCaliber: 0.127, nmCxK: 3.4, nmFuse: 5,
      nmBoostT: 5, nmBoostThrust: 10000, nmBoostFuel: 40, nmSusT: 0,
      nmSusThrust: 0, nmSusFuel: 0, nmNmaxM: 30, nmPn: 4, nmSeekRate: 22,
      nmLife: 60, nmTimeOut: 0, nmLaunchMach: 1.2, nmAspect: 0,
      nmSalvo: 1, nmInterval: 3, nmLaunchYaw: 0, nmLoftAng: 0,
      nmEnemyMach: 1.2, nmEnemyInterval: 8, nmDuelDist: 25,
      nmEnemyAlt: 4,   // 敌机高度 4km（与我机 5km 区分）
      selScenario: 'bvr_mid',   // 验证场景预设启动灌入（dist 25 / r77_1，与 map 值区分）
      nmSepMax: 300, nmSepMin: -100, nmGLoss: -300, nmMaxEas: 1550,
      selPreset: 'aim9l', selMyMissile: 'custom', selEnemyMissile: 'aim9l',
      selEngine: 'dynamic', selACModel: 'const', selMode: 'single',
      selEnemyOffense: 'straight', selEnemyEvasion: ''
    })) global.document.getElementById(id).value = v;
    WT.ui.init({
      onLaunch() {}, onPause() {}, onCam() {}, onWarp() {}, onBatch() {},
      onModeChange() {}
    });
    const cfgX = WT.ui.collectDuelCfg();
    const duelX = new WT.DuelSim(cfgX);
    duelX.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    WT.ui.updateDuelHUD(duelX);
    WT.ui.drawRWRDuel(duelX);
    check('对抗模式 UI 初始化链路无异常（卡死复现）', true);
  check('默认场景预设启动灌入（弹种/距离）',
    String(global.document.getElementById('selPreset').value) === 'r77_1' &&
    String(global.document.getElementById('nmDist').value) === '25',
    `preset=${global.document.getElementById('selPreset').value} ` +
    `dist=${global.document.getElementById('nmDist').value}`);
  check('敌机高度可配置（与我机独立）',
    Math.abs(duelX.enemy.pos.y - 4000) < 1 &&
    Math.abs(duelX.player.pos.y - duelX.enemy.pos.y) > 100,
    `敌机=${duelX.enemy.pos.y.toFixed(0)} 我机=${duelX.player.pos.y.toFixed(0)}`);
  check('敌方初速Ma 生效（与我机初速独立）',
    Math.abs(duelX.enemy.V - 1.2 * WT.phys.atmosphere(4000).a) < 2 &&
    Math.abs(duelX.player.V - 1.0 * WT.phys.atmosphere(6000).a) < 2,
    `敌V=${duelX.enemy.V.toFixed(0)} 我V=${duelX.player.V.toFixed(0)}`);
  } catch (e) {
    check('对抗模式 UI 初始化链路无异常（卡死复现）', false, e.message);
  }
  /* 对抗模式 UI 链路（空导弹列表渲染路径——"切模式卡死"回归） */
  const duelStub = new WT.DuelSim({
    aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
    engine: 'dynamic',
    playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
    enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
    playerInvincible: false, enemyInvincible: false,
    enemy: { fireInterval: 5, offense: 'straight', evasion: '' },
    startDist: 15000, targetAltM: 5000
  });
  try {
    WT.ui.updateDuelHUD(duelStub);
    WT.ui.drawRWRDuel(duelStub);
    check('对抗 HUD/RWR（空导弹）链路无异常', true);
  } catch (e) {
    check('对抗 HUD/RWR（空导弹）链路无异常', false, e.message);
  }
  /* （初始化链路测试已前置执行） */
  /* 拦截弹：锁定最近来袭导弹（单向模式空格） */
  {
    const target = new P.Missile(Object.assign({}, WT.MISSILE_PRESETS.aim9l), {
      pos: new THREE.Vector3(0, 5000, -4000),
      vel: new THREE.Vector3(0, 0, 400),
      range0: 4000
    });
    target.side = 'enemy';
    const shot = WT.spawnShot(duelStub.player, target,
      Object.assign({}, WT.MISSILE_PRESETS.aim9l));
    check('拦截弹发射（锁定来袭导弹）', !!shot && shot.flying &&
      !!shot.lockTarget && shot.lockTarget !== shot);
    /* 初速 = 载机速度（发射后与载具无关） */
    const acV = duelStub.player.vel.length();
    check('导弹初速 = 载机速度（发射后独立）',
      Math.abs(shot.vel.length() - acV) < 1,
      `载具=${acV.toFixed(0)} 弹=${shot.vel.length().toFixed(0)}`);
    let status = null;
    for (let i = 0; i < 800 && !status; i++) {
      status = WT.stepShot(shot, target, 0.01, 'dynamic');
    }
    check('拦截弹弹对弹命中', status === 'hit',
      `status=${status} min=${(shot.minRange || 0).toFixed(0)}m t=${shot.t.toFixed(1)}s`);
  }
  /* RWR 双方导弹标记必须都可见（审核 #3） */
  {
    const duelR = new WT.DuelSim({
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
      engine: 'dynamic',
      playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
      enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim120d),   // 雷达弹（红外不告警）
      playerInvincible: true, enemyInvincible: true,
      enemy: { fireInterval: 30, offense: 'straight', evasion: '' },
      startDist: 15000, targetAltM: 5000
    });
    duelR.fire('player');
    duelR.enemyCooldown = 0;
    duelR.step(0.01, { pitch: 0, roll: 0, sep: 1 });   // 敌方也发一枚
    rec.length = 0;
    WT.ui.drawRWRDuel(duelR);
    const tR = rec.filter((r) => r[0] === 'fillText').map((r) => r[1]);
    check('RWR 仅显示敌方 M（我方导弹不上 RWR）',
      tR.includes('M') && !tR.includes('F'), tR.join(','));
    /* 告警门控：红外弹不告警；>19km 不告警 */
    const mkDuelR2 = (em, dist) => {
      const d = new WT.DuelSim({
        aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
        engine: 'dynamic',
        playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim120d),
        enemyMissile: Object.assign({}, WT.MISSILE_PRESETS[em]),
        playerInvincible: true, enemyInvincible: true,
        enemy: { fireInterval: 30, offense: 'straight', evasion: '' },
        startDist: dist, targetAltM: 5000
      });
      d.enemyCooldown = 0;
      d.step(0.01, { pitch: 0, roll: 0, sep: 1 });
      rec.length = 0;
      WT.ui.drawRWRDuel(d);
      return rec.filter((r) => r[0] === 'fillText').map((r) => r[1]);
    };
    check('红外弹不告警（RWR 无 M）',
      !mkDuelR2('aim9l', 15000).includes('M'));
    check('超 19km 不告警（RWR 无 M）',
      !mkDuelR2('aim120d', 25000).includes('M'));
    /* 导弹标签：雷达弹 ≤19km 显示"雷达开机"（红外弹不显示） */
    {
      const viewStub = { worldToScreen: () => ({ visible: true, x: 100, y: 100 }) };
      WT.ui._mBoxOn = true;   // init 按复选框桩置过 false，显式开启
      const engM = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 15000 }));
      engM.step(0.01, { pitch: 0, roll: 0 });
      WT.ui.updateMissileBox(engM, viewStub);
      const htmlNear = String(global.document.getElementById('mBox').innerHTML);
      check('导弹标签 ≤19km 显示"雷达开机"', /雷达开机/.test(htmlNear));
      const engM2 = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 25000 }));
      engM2.step(0.01, { pitch: 0, roll: 0 });
      WT.ui.updateMissileBox(engM2, viewStub);
      const htmlFar = String(global.document.getElementById('mBox').innerHTML);
      check('导弹标签 >19km 不显示"雷达开机"', !/雷达开机/.test(htmlFar));
      const engM3 = new P.Engagement(mkCfg({ aspectDeg: 0, launchDistM: 15000 }));
      engM3.step(0.01, { pitch: 0, roll: 0 });
      engM3.missile.p = Object.assign({}, engM3.missile.p,
        { name: 'XX（红外格斗弹）' });
      WT.ui.updateMissileBox(engM3, viewStub);
      check('红外弹标签不显示"雷达开机"',
        !/雷达开机/.test(String(global.document.getElementById('mBox').innerHTML)));
    }
    /* 发布审核回归：判型 / 字段保留 / 结算防覆盖 / 表单钳位 */
    {
      check('AIM-7E2 半主动雷达弹正确判型（应告警）',
        WT.ui.isIrMissile({ name: 'AIM-7E2 麻雀（半主动雷达格斗弹）' }) === false &&
        WT.ui.isIrMissile({ name: 'XX（红外格斗弹）' }) === true &&
        WT.ui.isIrMissile(WT.MISSILE_PRESETS.aim9l) === true,
        '规则：显式 irSeeker > 含"雷达" > 含"红外"');
      const duX = new WT.DuelSim({
        aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
        engine: 'dynamic',
        playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
        enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
        playerInvincible: true, enemyInvincible: true,
        enemy: { fireInterval: 30, offense: 'straight', evasion: '' },
        startDist: 5000, targetAltM: 5000
      });
      duX._finish('win');
      duX._finish('lose');
      check('_finish 防同帧二次覆盖', !!duX.result && duX.result.kind === 'win',
        duX.result ? `kind=${duX.result.kind}` : '无结果');
      const prevSel = String(global.document.getElementById('selPreset').value);
      global.document.getElementById('selPreset').value = 'aim9l';
      global.document.getElementById('nmMass').value = '0';   // 非法输入
      const cfgSan = WT.ui.collectCfg();
      check('collectCfg 保留预设扩展字段且钳位非法输入',
        cfgSan.missile.irSeeker === true && cfgSan.missile.mass0 >= 1 &&
        Number.isFinite(cfgSan.missile.mass0),
        `irSeeker=${cfgSan.missile.irSeeker} mass0=${cfgSan.missile.mass0}`);
      global.document.getElementById('selPreset').value = prevSel;
      global.document.getElementById('nmMass').value = '84';
    }
    /* 对抗模式：最近威胁导弹的过载-马赫曲线 */
    rec.length = 0;
    WT.ui._nChartOn = true;   // 桩环境默认关，显式开启
    const th = duelR.primaryThreat();
    WT.ui.drawNCurve(th && th.flying
      ? { done: false, missile: th, cfg: { missile: th.p, aircraft: duelR.cfg.aircraft } }
      : { done: true, missile: null });
    const tC = rec.filter((r) => r[0] === 'fillText').map((r) => String(r[1]));
    check('对抗模式绘制最近威胁弹的过载-马赫曲线',
      tC.some((t) => t.includes('过载')), tC.slice(0, 3).join(','));
  }
  /* 无敌勾选实时生效（审核 #1/#2：切模式后再配置也必须生效） */
  {
    global.document.getElementById('selMyMissile').value = 'aim9l';
    global.document.getElementById('selEnemyMissile').value = 'aim9l';
    global.document.getElementById('nmEnemyMach').value = '1.2';
    const duelI = new WT.DuelSim({
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
      engine: 'dynamic',
      playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
      enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
      playerInvincible: false, enemyInvincible: false,
      enemy: { fireInterval: 3, offense: 'straight', evasion: '' },
      startDist: 2000, targetAltM: 5000
    });
    global.document.getElementById('chkInvMe').checked = true;
    global.document.getElementById('chkInvEnemy').checked = true;
    WT.ui.updateDuelHUD(duelI);        // 首次同步立即执行
    duelI.fire('player');
    for (let i = 0; i < 800; i++) duelI.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    check('无敌勾选实时生效（中途开启不结算）',
      !duelI.done && duelI.stats.playerScored >= 1 && duelI.stats.playerTaken >= 1,
      `done=${duelI.done} 命中=${duelI.stats.playerScored} 被命中=${duelI.stats.playerTaken}`);
    global.document.getElementById('chkInvMe').checked = false;
    global.document.getElementById('chkInvEnemy').checked = false;
  }
  /* 模式特有选项按模式显隐（需求：不切模式就不显示该模式特有选项） */
  WT.ui.applyMode('duel');
  const visOk = document.getElementById('duelOnly').style.display === '' &&
    document.getElementById('secScenario').style.display === 'none' &&
    document.getElementById('secBatch').style.display === 'none';
  WT.ui.applyMode('single');
  check('模式特有选项按模式显隐', visOk &&
    document.getElementById('duelOnly').style.display === 'none' &&
    document.getElementById('secScenario').style.display === '',
    '对抗:敌方配置显示/单向配置隐藏 → 切回互换');
  /* 前半球发射约束 + 对抗默认值 */
  {
    const duelH = new WT.DuelSim({
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
      engine: 'dynamic',
      playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim120d),
      enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim120d),
      playerInvincible: true, enemyInvincible: true,
      enemy: { fireInterval: 30, offense: 'straight', evasion: '' },
      startDist: 15000, targetAltM: 5000
    });
    const mFront = duelH.fire('player');
    duelH.enemy.pos.z = duelH.player.pos.z + 5000;   // 敌机挪到我机后方
    duelH.playerCooldown = 0;
    const mRear = duelH.fire('player');
    check('前半球可发射 / 后半球禁止', !!mFront && mRear === null &&
      !WT.inFrontHemisphere(duelH.player, duelH.enemy),
      `前方=${!!mFront} 后方=${mRear}`);
    /* 重新应用面板默认值后断言（前序测试会显式改写下拉值） */
    WT.ui.init({
      onLaunch() {}, onPause() {}, onCam() {}, onWarp() {}, onBatch() {},
      onModeChange() {}
    });
    check('对抗默认双方 AIM-120D、25km',
      String(global.document.getElementById('selMyMissile').value) === 'aim120d' &&
      String(global.document.getElementById('selEnemyMissile').value) === 'aim120d' &&
      String(global.document.getElementById('nmDuelDist').value) === '25',
      `我方=${global.document.getElementById('selMyMissile').value} ` +
      `敌方=${global.document.getElementById('selEnemyMissile').value}`);
  }
  /* 【允许拦截对方导弹】开关 + 指定目标拦截（F 切换目标的底层） */
  {
    check('拦截开关默认关闭', WT.ui.interceptAllowed() === false);
    global.document.getElementById('chkIntercept').checked = true;
    check('勾选后允许拦截', WT.ui.interceptAllowed() === true);
    const duelI2 = new WT.DuelSim({
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
      engine: 'dynamic',
      playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim120d),
      enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim120d),
      playerInvincible: true, enemyInvincible: true,
      enemy: { fireInterval: 30, offense: 'straight', evasion: '' },
      startDist: 6000, targetAltM: 5000
    });
    duelI2.enemyCooldown = 0;
    duelI2.step(0.01, { pitch: 0, roll: 0, sep: 1 });   // 敌方发一枚来袭弹
    const th2 = duelI2.primaryThreat();
    duelI2.playerCooldown = 0;
    const shot2 = duelI2.fire('player', th2);            // 指定目标拦截
    for (let i = 0; i < 1200 && duelI2.interceptCount === 0; i++) {
      duelI2.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    }
    check('指定目标拦截成功（弹对弹）',
      !!shot2 && duelI2.interceptCount === 1 && th2.flying === false &&
      shot2.lockTarget === th2,
      `拦截数=${duelI2.interceptCount}`);
    global.document.getElementById('chkIntercept').checked = false;
  }
  /* 敌机状态浮动标签（导弹标签同款，绿框）+ SEP 默认值 = 300 */
  {
    const duelE = new WT.DuelSim({
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
      engine: 'dynamic',
      playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
      enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
      playerInvincible: true, enemyInvincible: true,
      enemy: { fireInterval: 30, offense: 'straight', evasion: '' },
      startDist: 15000, targetAltM: 5000
    });
    WT.ui.updateEnemyBox(duelE,
      { worldToScreen: () => ({ x: 100, y: 80, visible: true }) });
    const eb = global.document.getElementById('eBox');
    const txt = String(eb.innerHTML).replace(/<[^>]+>/g, ' ');
    check('敌机状态浮动标签（距离/速度·马赫/高度）',
      eb.style.display === 'block' && txt.includes('Ma') &&
      txt.includes('高度') && txt.includes('距离'),
      txt.trim().slice(0, 46));
    const ac0 = new P.Aircraft({}, new THREE.Vector3(0, 5000, 0));
    check('最大 SEP 默认 300', ac0.sepCmd === 300, `sepCmd=${ac0.sepCmd}`);
  }
  delete global.document;
}

console.log('== 飞机简易气动（能量/SEP） ==');
{
  const p = {
    mach: 1, nMaxPos: 9, nMaxNeg: -4, rollRateMaxDeg: 180,
    model: 'aero', sepMax: 200, sepMin: -100, gLossMax: -300, sepRate: 200
  };
  const mkAC = () => new P.Aircraft(p, new THREE.Vector3(0, 5000, 0));
  /* 全油门平飞加速 */
  const a1 = mkAC(); const v1 = a1.V;
  for (let i = 0; i < 500; i++) a1.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  check('全油门平飞加速', a1.V > v1 + 15, `ΔV=+${(a1.V - v1).toFixed(0)}`);
  /* 收油门平飞减速 */
  const a2 = mkAC(); a2.sepCmd = 0; const v2 = a2.V;
  for (let i = 0; i < 500; i++) a2.step(0.01, { pitch: 0, roll: 0, sep: -1 });
  check('收油门平飞减速', a2.V < v2 - 8, `ΔV=${(a2.V - v2).toFixed(0)}`);
  /* 爬升：动能换高度（隔离变量：极大表速上限=关闭阻力项，专测能量互换） */
  const mkAC0 = () => new P.Aircraft(Object.assign({}, p, { maxEasKmh: 1e6 }),
    new THREE.Vector3(0, 5000, 0));
  const a3 = mkAC0(); a3.sepCmd = 0; const v3 = a3.V, y3 = a3.pos.y;
  for (let i = 0; i < 300; i++) a3.step(0.01, { pitch: 1, roll: 0, sep: 0 });
  check('爬升用动能换高度', a3.V < v3 - 20 && a3.pos.y > y3 + 250,
    `ΔV=${(a3.V - v3).toFixed(0)} Δy=+${(a3.pos.y - y3).toFixed(0)}`);
  /* 俯冲（1G 缓推，无机动损失）：高度换速度 */
  const a4 = mkAC0(); a4.sepCmd = 0; const v4 = a4.V, y4 = a4.pos.y;
  for (let i = 0; i < 800; i++) a4.step(0.01, { pitch: -0.25, roll: 0, sep: 0 });
  check('俯冲用高度换速度', a4.V > v4 + 5 && a4.pos.y < y4 - 200,
    `ΔV=+${(a4.V - v4).toFixed(0)} Δy=${(a4.pos.y - y4).toFixed(0)}`);
  /* 机动能量损失：满过载实时 SEP = 油门 SEP − 300 */
  const a5 = mkAC();
  for (let i = 0; i < 250; i++) a5.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  const sepLevel = a5.sepActual;
  a5.n = 9;
  a5.step(0.01, { pitch: 1, roll: 0, sep: 1 });
  const ratio = (Math.abs(a5.n) - 1) / 8;
  check('满过载实时SEP = 油门 − 阻力损失 − 300·ratio', (() => {
    const easA5 = a5.V * Math.sqrt(P.atmosphere(a5.pos.y).rho / 1.225);
    const dragA5 = 200 * (easA5 / (1550 / 3.6)) ** 2;
    const expectA5 = a5.sepCmd - dragA5 - 300 * ratio;
    return Math.abs(a5.sepActual - expectA5) < 2 && a5.sepActual < sepLevel - 150;
  })(), `sep=${a5.sepActual.toFixed(0)}`);
  /* 能量方程不变量（任意机动下成立）：Δ(V²/2 + g·h) = ∫ g·SEP dt */
  const a6 = mkAC(); a6.sepCmd = 50;
  let E0 = 0.5 * a6.V * a6.V + WT.G0 * a6.pos.y, acc = 0;
  for (let i = 0; i < 600; i++) {
    a6.step(0.01, {
      pitch: (i % 200 < 100) ? 0.8 : -0.4,
      roll: 0.5,
      sep: i < 100 ? 1 : -0.3
    });
    acc += WT.G0 * a6.sepActual * 0.01;
  }
  const E1 = 0.5 * a6.V * a6.V + WT.G0 * a6.pos.y;
  check('能量方程守恒 ΔE = ∫g·SEP dt',
    Math.abs((E1 - E0) - acc) < Math.max(30, 0.03 * Math.abs(acc)),
    `ΔE=${(E1 - E0).toFixed(0)} ∫gSEP=${acc.toFixed(0)}`);
  /* 默认油门 = 最大 SEP */
  const a7 = mkAC();
  check('默认油门 SEP = 最大', Math.abs(a7.sepCmd - 200) < 1e-9 && a7.sepActual > 199,
    `sepCmd=${a7.sepCmd} sepActual=${a7.sepActual.toFixed(0)}`);
  /* 机动损失计入实时 SEP（允许负值）：满油门 + 满过载 → 显著负能量 */
  const a9 = mkAC();
  for (let i = 0; i < 500; i++) a9.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  a9.n = 9;
  a9.step(0.01, { pitch: 1, roll: 0, sep: 1 });
  check('满油门+满过载 实时 SEP 为负（机动损失计入）',
    a9.sepActual < -50, `sep=${a9.sepActual.toFixed(0)}`);
  /* 表速限制：正 SEP 随接近最大表速衰减到 0（默认 1550 km/h EAS） */
  const a8 = mkAC();
  for (let i = 0; i < 25000; i++) a8.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  const eas8 = a8.V * Math.sqrt(P.atmosphere(a8.pos.y).rho / 1.225) * 3.6;
  check('最大表速限制（表速≤1550km/h，SEP→0）',
    eas8 <= 1555 && a8.sepActual >= 0 && a8.sepActual < 10,
    `表速=${eas8.toFixed(0)}km/h SEP=${a8.sepActual.toFixed(1)}`);
  /* 超过最大表速：阻力>推力 → SEP 为负（自动减速回落） */
  const a10 = mkAC();
  a10.V = 600;   // 5km 处表速≈1675km/h > 1550
  a10.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  check('超过最大表速 → SEP 为负（阻力作用）', a10.sepActual < -10,
    `sep=${a10.sepActual.toFixed(0)}`);
}

console.log('== AIM-7M 升力链标定（CyK 语义回归） ==');
{
  const p = WT.MISSILE_PRESETS.aim7m;
  const A = WT.buildAero(p);
  const atm = P.atmosphere(5000);
  const q = 0.5 * atm.rho * Math.pow(1.8 * atm.a, 2);
  const gLift = q * A.S * A.kL * A.alphaMax / (p.mass0 * WT.G0);
  check('AIM-7M M1.8 升力链可用过载 ≥20G（曾被 CyK 饿死）', gLift >= 20,
    `kL=${A.kL.toFixed(1)}/rad αmax=${(A.alphaMax * 57.3).toFixed(1)}° ` +
    `升力上限=${gLift.toFixed(1)}G (finsLat=${p.finsLatAccelG}G)`);
}

console.log('== 过载-马赫曲线（低速升力链 / 高速 finsLat 平台） ==');
{
  const p = WT.MISSILE_PRESETS.aim120d;
  const A = WT.buildAero(p);
  const lo = WT.nMaxAtMach(p, A, p.mass0, 0.6, 5000);
  const mid = WT.nMaxAtMach(p, A, p.mass0, 1.5, 5000);
  const hi = WT.nMaxAtMach(p, A, p.mass0, 3.0, 5000);
  const plat = Math.min(p.nMaxG, A.finsLatG);
  check('低速段受 fin 面积/迎角限制（远低于平台）',
    lo.n < plat * 0.5 && lo.lift <= lo.auth + 1e-6,
    `M0.6 n=${lo.n.toFixed(1)}G lift=${lo.lift.toFixed(1)} auth=${lo.auth.toFixed(1)}`);
  check('高速段受 finsLatAccel 平台限制',
    Math.abs(hi.n - plat) < 0.1 && hi.lift > plat,
    `M3.0 n=${hi.n.toFixed(1)}G 平台=${plat}G`);
  check('曲线随马赫单调升至平台', lo.n < mid.n && mid.n <= plat + 0.1,
    `${lo.n.toFixed(1)}→${mid.n.toFixed(1)}→${hi.n.toFixed(1)}G`);
  const r1 = WT.nMaxAtMach(p, A, p.mass0, 0.5, 5000).n;
  const r2 = WT.nMaxAtMach(p, A, p.mass0, 1.0, 5000).n;
  check('低速段 ∝ M²（同高度）', Math.abs(r2 / r1 - 4) < 0.2,
    `M0.5=${r1.toFixed(2)} M1.0=${r2.toFixed(2)}G`);
  /* 转折马赫：升力链 = 平台交点 */
  const mc = WT.cornerMach(p, A, p.mass0, 5000);
  const atC = WT.nMaxAtMach(p, A, p.mass0, mc, 5000);
  check('转折马赫标注（AIM-120D@5km ≈M2.0）', mc > 1.8 && mc < 2.2,
    `M*=${mc.toFixed(2)}`);
  check('转折点处过载 = finsLat 平台', Math.abs(atC.n - plat) < 0.5,
    `n=${atC.n.toFixed(1)}G 平台=${plat}G`);
}

console.log('== 离架延迟（guidanceAutopilot.timeOut） ==');
{
  const p = Object.assign({}, WT.MISSILE_PRESETS.aim9l, { timeOutS: 1.5, loft: false });
  const m = new P.Missile(p, {
    pos: new THREE.Vector3(0, 5000, 0),
    vel: new THREE.Vector3(300, 0, -300).setLength(400),
    range0: 5000
  });
  const target = {
    pos: new THREE.Vector3(5000, 5000, 0), vel: new THREE.Vector3(0, 0, 0)
  };
  const v0 = m.vel.clone().normalize();
  for (let i = 0; i < 120; i++) m.step(0.01, target, 'dynamic');  // 1.2s：延迟段内
  const v1 = m.vel.clone().normalize();
  check('延迟段内保持直飞（无引导转向）', v0.angleTo(v1) < 0.05,
    `偏角=${(v0.angleTo(v1) * 57.3).toFixed(2)}°（含重力下垂）`);
  check('延迟段内 guided=false', m.guided === false && m.t < m.timeOutS);
  for (let i = 0; i < 300; i++) m.step(0.01, target, 'dynamic');  // 累计 4.2s
  const v2 = m.vel.clone().normalize();
  check('延迟结束后开启引导（转向目标）', m.guided && v0.angleTo(v2) > 0.1,
    `偏角=${(v0.angleTo(v2) * 57.3).toFixed(1)}°`);
}

console.log('== 初始速度偏角（斜射）+ timeToGain 离架映射 ==');
{
  check('timeToGain 零增益平台映射（R-27ER/AIM-54A/Skyflash/AIM-7F）',
    WT.MISSILE_PRESETS.r27er.timeOutS === 0.35 &&
    WT.MISSILE_PRESETS.aim54a.timeOutS === 2.5 &&
    WT.MISSILE_PRESETS.skyflash.timeOutS === 1.8 &&
    WT.MISSILE_PRESETS.aim7f.timeOutS === 0,
    `r27er=${WT.MISSILE_PRESETS.r27er.timeOutS}s aim54a=${WT.MISSILE_PRESETS.aim54a.timeOutS}s ` +
    `skyflash=${WT.MISSILE_PRESETS.skyflash.timeOutS}s aim7f=${WT.MISSILE_PRESETS.aim7f.timeOutS}s`);
  /* 斜射：初速与来袭方向（瞄准线）夹角 = 设定值 */
  const cfgY = mkCfg({ aspectDeg: 0, launchDistM: 12000, launchYawDeg: 30 });
  cfgY.missile.timeOutS = 0;
  const engY = new P.Engagement(cfgY);
  const aimDir = new THREE.Vector3(0, 5000, 0).sub(engY.missile.pos).normalize();
  const vDir = engY.missile.vel.clone().normalize();
  check('发射时初速偏角 = 30°', Math.abs(aimDir.angleTo(vDir) - Math.PI / 6) < 0.02,
    `夹角=${(aimDir.angleTo(vDir) * 57.3).toFixed(1)}°`);
  while (!engY.done && engY.t < 60) engY.step(0.01, { pitch: 0, roll: 0 });
  check('斜射后引导修正命中', engY.result && engY.result.hit,
    `${engY.result.label} miss=${engY.result.missDist.toFixed(0)}m`);
}

console.log('== 大气模型（DagorEngine 精确移植锚定） ==');
{
  const at0 = P.atmosphere(0), at10 = P.atmosphere(10000),
    at15 = P.atmosphere(15000), at25 = P.atmosphere(25000);
  check('引擎多项式值锚定 a(0)/ρ(15km)/T(10km)',
    Math.abs(at0.a - 341.203) < 0.5 && Math.abs(at15.rho - 0.208328) < 0.0005 &&
    Math.abs(at10.T - 223.818) < 0.5,
    `a0=${at0.a.toFixed(2)} rho15=${at15.rho.toFixed(5)} T10=${at10.T.toFixed(2)}`);
  check('18.3km 尾部 1/h 行为照抄引擎（ρ(25km)=0.0851）',
    Math.abs(at25.rho - 0.085095) < 0.0005,
    `rho25=${at25.rho.toFixed(5)}`);
}

console.log('== 远距 BVR 高抛（中段爬升角程序） ==');
{
  const preset = WT.MISSILE_PRESETS.aim120d;
  for (const model of ['aero', 'base']) {
    const cfg = {
      missile: Object.assign({}, preset, { model }),
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
      scenario: Object.assign({}, WT.DEFAULTS.scenario, {
        launchDistM: 50000, launchAltM: 10000, targetAltM: 10000,
        launchMach: 1.6, aspectDeg: 0, engine: 'dynamic'
      })
    };
    const eng = new P.Engagement(cfg);
    let apex = 0;
    while (!eng.done && eng.t < 90) {
      eng.step(0.01, { pitch: 0, roll: 0 });
      if (eng.missile.pos.y > apex) apex = eng.missile.pos.y;
    }
    check(`高抛弹道（${model}）顶点 +2~3.8km 且命中（游戏实测校准）`,
      apex - 10000 > 2000 && apex - 10000 < 3800 && eng.result && eng.result.hit,
      `顶点=${(apex / 1000).toFixed(2)}km ${eng.result && eng.result.label}`);
  }
}

console.log('== 对抗模式（双机/双方导弹/命中计数） ==');
{
  const mkDuel = (over) => new WT.DuelSim(Object.assign({
    aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
    engine: 'dynamic',
    playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
    enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l, { launchMach: 1.2 }),
    playerInvincible: true,
    enemyInvincible: true,
    enemy: { fireInterval: 3, offense: 'straight', evasion: '' },
    startDist: 2500, targetAltM: 5000
  }, over || {}));
  const duel = mkDuel({ startDist: 6000 });
  check('初始状态干净', duel.missiles.length === 0 && !duel.done);
  const m = duel.fire('player');
  check('空格发射我方导弹', !!m && m.side === 'player' && duel.missiles.length === 1);
  for (let i = 0; i < 1500; i++) duel.step(0.01, { pitch: 0, roll: 0 });
  const enemyShots = duel.missiles.filter(x => x.side === 'enemy').length;
  check('敌方按间隔发射（3s）', enemyShots >= 2, `敌弹=${enemyShots}`);
  check('无敌模式：命中计数且不结算',
    duel.stats.playerScored >= 1 && duel.stats.playerTaken >= 1 && !duel.done,
    `命中=${duel.stats.playerScored} 被命中=${duel.stats.playerTaken}`);
  const duel2 = mkDuel({
    playerInvincible: false, enemyInvincible: false, startDist: 2000
  });
  duel2.fire('player');
  for (let i = 0; i < 800 && !duel2.done; i++) duel2.step(0.01, { pitch: 0, roll: 0 });
  check('非无敌命中即结算', duel2.done && duel2.result && duel2.result.kind === 'win',
    duel2.result ? `${duel2.result.label} t=${duel2.result.t.toFixed(1)}s` : '未结算');
  const duel3 = mkDuel({
    enemy: { fireInterval: 2, offense: 'toward', evasion: 'steadyTurn' }
  });
  check('敌方规避策略可定制（复用战术库）', !!duel3.evasion);
  for (let i = 0; i < 400; i++) duel3.step(0.01, { pitch: 0, roll: 0 });
  check('敌方主动策略朝向玩家（距离收缩）',
    duel3.enemy.pos.distanceTo(duel3.player.pos) < 2500,
    `距离=${duel3.enemy.pos.distanceTo(duel3.player.pos).toFixed(0)}m`);
  /* 飞机撞地结算（审核 #8） */
  const duel4 = mkDuel({});
  duel4.player.pos.y = 10;
  duel4.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  check('对抗模式飞机撞地结算', duel4.done && duel4.result &&
    duel4.result.label === '我方撞地',
    duel4.result ? duel4.result.label : '未结算');
  /* DEZ 安全后：上高 → 主动策略（需求 #3） */
  const duelZ = mkDuel({
    enemy: { fireInterval: 60, offense: 'toward', evasion: 'dez' },
    startDist: 12000
  });
  duelZ.fire('player');
  const altZ0 = duelZ.enemy.pos.y;
  let sawClimb = false;
  for (let i = 0; i < 12000 && !duelZ.done; i++) {
    duelZ.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    if (duelZ.enemyPhase === 'climb' || duelZ.enemyPhase === 'recover') sawClimb = true;
  }
  check('导弹能量低于自身后上高并按主动策略回头',
    sawClimb && duelZ.enemy.pos.y > altZ0 + 1500 && duelZ.enemy.pos.y < altZ0 + 4000,
    `phase=${duelZ.enemyPhase} Δh=${(duelZ.enemy.pos.y - altZ0).toFixed(0)}m`);
  /* 安全判据单元验证：导弹仍在飞但已进 DEZ 安全带 → 立即恢复（不等弹消失） */
  {
    const duelS = mkDuel({
      enemy: { fireInterval: 60, offense: 'toward', evasion: 'dez' }
    });
    const far = new P.Missile(Object.assign({}, WT.MISSILE_PRESETS.aim9l), {
      pos: new THREE.Vector3(0, 5000, -100000), vel: new THREE.Vector3(0, 0, -300),
      range0: 1000
    });
    far.side = 'player';
    far._prevRel = far.pos.clone();   // CPA 前置状态（spawnShot 会设，手造需补）
    duelS.missiles.push(far);
    duelS._wasEvading = true;      // 已规避过
    duelS.enemyPhase = 'normal';
    duelS.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    check('低能量弹仍在飞即转入上高回头',
      duelS.enemyPhase === 'climb' && far.flying === true,
      `phase=${duelS.enemyPhase}`);
  }

  /* DEZ 转向完成 → 未达最大表速则略微下高冲刺；达标后平飞 */
  {
    const ez = WT.tactics.create('dez');
    ez.phase = 2;
    const ac = new P.Aircraft(
      { model: 'const', mach: 0.8, nMaxPos: 9, nMaxNeg: -4, rollRateMaxDeg: 180 },
      new THREE.Vector3(0, 5000, 0));
    const threat = {
      pos: new THREE.Vector3(0, 5000, 20000), vel: new THREE.Vector3(0, 0, -300)
    };
    const engA = { aircraft: ac, player: ac, enemy: ac, missile: threat };
    const cmdLow = ez.update(engA, 0.01);            // 表速 838km/h << 1550
    ac.V = 600;                                       // 表速≈1677km/h > 1550
    const cmdHi = ez.update(engA, 0.01);
    check('DEZ 转向完成：表速不足→下高冲刺，达标→平飞',
      cmdLow.pitch < -0.05 && Math.abs(cmdHi.pitch) < 0.06,
      `低速指令=${cmdLow.pitch.toFixed(2)} 高速指令=${cmdHi.pitch.toFixed(2)}`);
  }

  /* 主动策略：保持距离（15km 间距；过近→远离、过远→靠近） */
  {
    const mkK = (dist, em) => mkDuel({
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft, { mach: 0.8 }),
      enemyMach: em,
      enemy: { fireInterval: 600, offense: 'keepDist', evasion: '' },
      startDist: dist
    });
    const k1 = mkK(8000, 1.6);
    const d0 = k1.enemy.pos.distanceTo(k1.player.pos);
    for (let i = 0; i < 3000; i++) k1.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    const d1 = k1.enemy.pos.distanceTo(k1.player.pos);
    check('保持距离：过近→远离', d1 > d0 + 2000, `${d0.toFixed(0)}→${d1.toFixed(0)}`);
    const k2 = mkK(25000, 1.6);
    const d2 = k2.enemy.pos.distanceTo(k2.player.pos);
    for (let i = 0; i < 3000; i++) k2.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    const d3 = k2.enemy.pos.distanceTo(k2.player.pos);
    check('保持距离：过远→靠近', d3 < d2 - 2000, `${d2.toFixed(0)}→${d3.toFixed(0)}`);
    /* 目的回归：15km 外 = poke 姿态（敌机在前半球，可不断射击骚扰） */
    const k3 = mkK(20000, 1.2);
    let facing = false;
    for (let i = 0; i < 2500; i++) {
      k3.step(0.01, { pitch: 0, roll: 0, sep: 1 });
      if (i % 250 === 0 && k3.enemy.pos.distanceTo(k3.player.pos) > 15000) {
        const to = new THREE.Vector3().subVectors(k3.player.pos, k3.enemy.pos);
        const f = WT.phys.attitudeAngles(k3.enemy.quat).fwd;
        if (to.normalize().dot(f) > 0) facing = true;   // 玩家在前半球 = 可 poke
      }
    }
    check('保持距离：外圈保持 poke 姿态（指向敌机）', facing);
    /* 10km 变体：同样收敛到各自目标间距 */
    const mkK10 = (dist) => mkDuel({
      aircraft: Object.assign({}, WT.DEFAULTS.aircraft, { mach: 0.8 }),
      enemyMach: 1.6,
      enemy: { fireInterval: 600, offense: 'keepDist10', evasion: '' },
      startDist: dist
    });
    const k4 = mkK10(25000);
    for (let i = 0; i < 3000; i++) k4.step(0.01, { pitch: 0, roll: 0, sep: 1 });
    const d4 = k4.enemy.pos.distanceTo(k4.player.pos);
    check('保持10km：过远→收敛到 ~10km', d4 > 8000 && d4 < 13000,
      `25000→${d4.toFixed(0)}`);
  }

  /* 长期对抗后仍会回头（规避结束 → 主动策略，_wasEvading 不被常态销毁） */
  {
    const duelB = mkDuel({
      enemy: { fireInterval: 600, offense: 'toward', evasion: 'dez' }
    });
    duelB._wasEvading = true;          // 曾规避过（长对抗的残余状态）
    duelB.enemyPhase = 'normal';
    duelB._escapeAlt = duelB.enemy.pos.y;
    duelB._preFwd = new THREE.Vector3(0, 0, 1);
    let sawRecover = false;
    for (let i = 0; i < 9000 && !sawRecover; i++) {
      duelB.step(0.01, { pitch: 0, roll: 0, sep: 1 });
      if (duelB.enemyPhase === 'recover') sawRecover = true;
    }
    check('规避结束后回头执行主动策略（不卡死）',
      sawRecover && duelB.enemyPhase === 'recover',
      `phase=${duelB.enemyPhase} y=${duelB.enemy.pos.y.toFixed(0)}`);
  }

  /* 导弹池环形复用（不回收数组；满 1024 覆盖最旧槽位，死弹轨迹保留） */
  const duel5 = mkDuel({ enemy: { fireInterval: 60, offense: 'straight', evasion: '' } });
  for (let i = 0; i < 1100; i++) {
    duel5.playerCooldown = 0;
    duel5.fire('player');
    duel5.missiles[duel5.missiles.length - 1].flying = false;   // 置死，避免活弹上限
  }
  check('导弹池环形复用（≤1024，覆盖最旧）', duel5.missiles.length === 1024,
    `列表=${duel5.missiles.length}`);
}

console.log('== 重构守护（segMinDist 连续 CPA） ==');
{
  const a = P.segMinDist(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, -10));
  const b = P.segMinDist(new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, 8));
  check('segMinDist 线段 CPA', Math.abs(a) < 1e-9 && Math.abs(b - 8) < 1e-9,
    `穿心=${a.toFixed(3)} 端点=${b.toFixed(1)}`);
}

console.log('== 转向侧锁定（防 ±180° 翻转） ==');
{
  const t = WT.tactics.create('dez', P.mulberry32(1));
  const s1 = t.turnSignFor(179 * Math.PI / 180);    // 反转段：锁定 +
  const s2 = t.turnSignFor(-179 * Math.PI / 180);   // 穿越 ±180° 后仍 +
  const s3 = t.turnSignFor(-45 * Math.PI / 180);    // |az|<90° 后跟随短侧 -
  check('转向侧锁定防 ±180° 翻转', s1 === 1 && s2 === 1 && s3 === -1,
    `s1=${s1} s2=${s2} s3=${s3}`);
  const t2 = WT.tactics.create('tail', P.mulberry32(1));
  const b1 = t2.turnSignFor(-175 * Math.PI / 180);
  const b2 = t2.turnSignFor(178 * Math.PI / 180);
  check('置尾同享转向侧锁定', b1 === -1 && b2 === -1, `b1=${b1} b2=${b2}`);
}

/* 油门百分比：SHIFT 增 / CTRL 减，SEP = 最大油门SEP×百分比 − 阻力SEP */
{
  const acTh = new P.Aircraft({
    model: 'aero', mach: 1, nMaxPos: 9, nMaxNeg: -4, rollRateMaxDeg: 180,
    sepMax: 200, gLossMax: -300, maxEasKmh: 1550
  }, new THREE.Vector3(0, 5000, 0));
  const sep0 = acTh.sepCmd;
  for (let i = 0; i < 100; i++) acTh.step(0.01, { pitch: 0, roll: 0, sep: -1 });
  const sep1 = acTh.sepCmd;
  for (let i = 0; i < 100; i++) acTh.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  const sep2 = acTh.sepCmd;
  check('油门百分比：CTRL 减 / SHIFT 增（SEP 随动）',
    sep1 < sep0 - 50 && sep2 > sep1 + 50 && acTh.sepCmd >= 0 && acTh.thr >= 0 && acTh.thr <= 1,
    `${sep0.toFixed(0)} → ${sep1.toFixed(0)} → ${sep2.toFixed(0)} thr=${(acTh.thr * 100).toFixed(0)}%`);
}
/* 新战术：垂直导弹速度矢量（机头趋向 ⊥ 导弹速度矢量） */
{
  const acP = new P.Aircraft(Object.assign({}, WT.DEFAULTS.aircraft),
    new THREE.Vector3(0, 5000, 0));
  const msP = new P.Missile(Object.assign({}, WT.MISSILE_PRESETS.aim9l), {
    pos: new THREE.Vector3(0, 5000, -12000), vel: new THREE.Vector3(0, 0, 350),
    range0: 12000
  });
  msP._prevRel = msP.pos.clone().sub(acP.pos);
  const engP = {
    aircraft: acP, missile: msP, player: acP, enemy: acP,
    cfg: { missile: WT.MISSILE_PRESETS.aim9l, aircraft: WT.DEFAULTS.aircraft }
  };
  const tacP = WT.tactics.create('perp', P.mulberry32(7));
  let bestDev = 180;
  for (let i = 0; i < 4000 && msP.flying; i++) {
    const cmd = tacP.update(engP, 0.01);
    acP.step(0.01, cmd);
    msP.step(0.01, acP, 'dynamic');
    if (i % 50 === 0) {
      const mv = msP.vel.clone().setY(0);
      const fh = WT.phys.attitudeAngles(acP.quat).fwd.clone().setY(0);
      if (mv.lengthSq() > 1 && fh.lengthSq() > 0.25) {   // fwd 为单位向量（lengthSq≈1）
        const ang = Math.acos(Math.max(-1, Math.min(1,
          Math.abs(mv.normalize().dot(fh.normalize()))))) * 57.3;
        bestDev = Math.min(bestDev, Math.abs(ang - 90));
      }
    }
  }
  check('perp 战术：机头趋向 ⊥ 导弹速度矢量（偏差 <35°）',
    bestDev < 35, `最小偏差=${bestDev.toFixed(0)}°`);
}
/* 数据契约：预设关键字段与 data/missiles_2.59.0.7.json（blkx2json 生成）一致 */
{
  const fsD = require('fs'), pathD = require('path');
  const dataPath = pathD.join(__dirname, '..', 'data', 'missiles_2.59.0.7.json');
  if (fsD.existsSync(dataPath)) {
    const D259 = JSON.parse(fsD.readFileSync(dataPath, 'utf8'));
    let diff = 0, checked = 0;
    for (const k of Object.keys(D259)) {
      const d = D259[k], p = WT.MISSILE_PRESETS[k];
      if (!p) continue;
      checked++;
      const s0 = (p.stages && p.stages[0]) || {};
      const d0 = (d.stages && d.stages[0]) || {};
      for (const [n2, dv, pv] of [
        ['mass0', d.mass0, p.mass0], ['nMaxG', d.nMaxG, p.nMaxG],
        ['pnGain', d.pnGain, p.pnGain], ['lifeS', d.lifeS, p.lifeS],
        ['t', d0.t, s0.t], ['thrust', d0.thrust, s0.thrust]]) {
        if (dv != null && pv != null &&
            Math.abs(dv - pv) > Math.max(0.01, Math.abs(dv) * 0.02)) {
          diff++;
          console.log(`  [DIFF] ${k}.${n2} 预设=${pv} datamine2.59=${dv}`);
        }
      }
    }
    check('数据契约：预设与 2.59.0.7 datamine 一致', checked >= 50 && diff === 0,
      `keys=${checked} 差异=${diff}`);
  } else {
    check('数据契约：预设与 2.59.0.7 datamine 一致', false,
      '缺少 data/missiles_2.59.0.7.json（node tools/blkx2json.js 生成）');
  }
}
console.log(`\n结果: PASS ${pass}, FAIL ${fail}`);
process.exit(fail ? 1 : 0);
