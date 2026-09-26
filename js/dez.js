/* ============================================================
 * dez.js — Dynamic-Escape-Zone 动态逃逸区（Alkaher & Moshaiov, JGCD 2015）
 * "Dynamic-Escape-Zone to Avoid Energy-Bleeding Coasting Missile"
 *
 * DER（动态逃逸距离）实时计算（论文 Eq.26-29 的平面简化实现）：
 *
 *   RProj_DEZ = R(ρp,ρe,Δχp,Δχe) + R_S&Lp(vp→v_min) − ve·tf
 *   R(·)      = ρp(|sinΔχp| − |Δχp|) + ρe(|Δχe| − |sinΔχe|)
 *   R_DEZ     = RProj_DEZ / cos(|Δχp| − |σp|)   （本实现取当前 LOS 投影≈1）
 *
 *   ρp, ρe   = v²/(g·n_max)            双方最小转弯半径
 *   Δχp, Δχe = 转向最终 LOS 轴所需转角（p 机头对 LOS，e 机尾对 LOS）
 *   R_S&Lp   = 弹从 vp 滑行减速到 v_min 的能量航程（零升阻力，论文保守假设）
 *   tf       = 对应滑行时间；v_min = 目标速度（捕获集边界 vp(tf)=ve）
 *
 * 判据（论文 Eq.1）：Rpe > R_DEZ ∈ DEZ 内 → 施行最优动能规避可保证脱离；
 * Rpe ≤ R_DEZ → 已错过动能规避窗口，只能末端规避。
 * 考虑论文的不确定性分析，决策时预留 ~25% 裕度。
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';
  const P = WT.phys;
  const G0 = WT.G0;

  function wrapPi(a) {
    while (a > Math.PI) a -= 2 * Math.PI;
    while (a < -Math.PI) a += 2 * Math.PI;
    return a;
  }

  /* 导弹能量滑行航程/时间：从当前速度 v0 减速到 vMin（纯滑行，推力为 0）。
   * nEff = 0 → 仅零升阻力（论文 DEZ 的保守假设：无诱导阻力，对规避方保守）
   * nEff > 0 → 另计诱导阻力（按平均机动过载 nEff，D_i = 0.1·(n·m·g)²/(q·S)，
   *             与基础模型标定一致；对导弹保守 → 用于 NEZ 必杀区边界） */
  function coastRange(p, h, v0, vMin, massNow, nEff) {
    let v = v0, s = 0, t = 0, mass = massNow || p.mass0;
    const Sref = Math.PI * p.caliber * p.caliber / 4;
    const Sl = Sref * p.wingMult;
    const dt = 0.05;
    for (let i = 0; i < 6000 && v > vMin; i++) {
      const atm = P.atmosphere(h);
      const q = 0.5 * atm.rho * v * v;
      const D0 = q * Sref * p.wingMult * p.cxK * P.cxAt(v / atm.a);
      const Di = nEff > 0
        ? 0.1 * Math.pow(nEff * mass * G0, 2) / Math.max(q * Sl, 1e-6) : 0;
      const a = -(D0 + Di) / Math.max(mass, 1);
      v = Math.max(v + a * dt, vMin);
      s += v * dt;
      t += dt;
      if (t > 300) break;
    }
    return { s, t };
  }

  /* DER 主计算：输入当前弹目状态与双方参数 */
  function computeRdez(missile, aircraft, missileParams, neMax) {
    const rel = new THREE.Vector3().subVectors(aircraft.pos, missile.pos);
    const los = Math.atan2(rel.x, rel.z);                       // 视线角（XZ 平面）
    const chiP = Math.atan2(missile.vel.x, missile.vel.z);      // 导弹航向
    const chiE = Math.atan2(aircraft.vel.x, aircraft.vel.z);    // 目标航向
    const sigP = wrapPi(chiP - los);                            // 弹前置角（机头对 LOS）
    const sigE = wrapPi(Math.PI - (chiE - los));                // 目标态势角（σe=π 即尾追）
    const dChiP = Math.abs(wrapPi(los - chiP));                 // 转向最终 LOS 的转角
    const dChiE = Math.abs(wrapPi(los - chiE));                 // 机尾对 LOS 的转角

    const vp = missile.vel.length();
    const ve = aircraft.vel.length();
    const vMin = ve;                                            // 捕获集边界 vp(tf)=ve
    const ne = neMax || 9;
    const np = missileParams.nMaxG || 25;
    const rhoP = vp * vp / (G0 * np);                           // 弹最小转弯半径
    const rhoE = ve * ve / (G0 * ne);                           // 机最小转弯半径

    const cr = coastRange(missileParams, missile.pos.y, vp, vMin, missile.mass, 0);
    /* NEZ（必杀区）边界：导弹侧保守 —— 全程按 0.35·np 平均机动计诱导阻力 */
    const crN = coastRange(missileParams, missile.pos.y, vp, vMin, missile.mass,
      0.35 * np);
    const geo = rhoP * (Math.abs(Math.sin(dChiP)) - dChiP)
              + rhoE * (dChiE - Math.abs(Math.sin(dChiE)));
    const rProj = geo + cr.s - ve * cr.t;
    const rDez = Math.max(rProj, 0);
    const rNez = Math.max(Math.min(geo + crN.s - ve * crN.t, rDez), 0);
    return { rDez, rNez, rProj, sigP, sigE, dChiP, dChiE, rhoP, rhoE,
      coastRange: cr.s, coastTime: cr.t };
  }

  /* 三区决策（DEZ/NEZ 双边界；DEZ 侧含论文不确定性裕度）：
   *   Rpe > 1.25·R_DEZ   安全区（可脱离）        绿
   *   R_DEZ < Rpe ≤ 1.25·R_DEZ  立即脱离!        黄
   *   R_NEZ < Rpe ≤ R_DEZ  对抗区（胜负取决于战术） 橙
   *   Rpe ≤ R_NEZ        NEZ 内（必杀区/末端）    红   */
  const MARGIN = 1.25;
  function status(rpe, rNez, rDez) {
    if (rpe > rDez * MARGIN) return { code: 'safe', text: '安全', rNez, rDez };
    if (rpe > rDez) return { code: 'go', text: '立即脱离!', rNez, rDez };
    if (rpe > rNez) return { code: 'contested', text: '对抗区', rNez, rDez };
    return { code: 'nez', text: 'NEZ内(末端)', rNez, rDez };
  }

  WT.dez = { computeRdez, coastRange, status, wrapPi, MARGIN };
})(window.WT);
