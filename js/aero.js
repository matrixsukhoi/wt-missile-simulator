/* ============================================================
 * aero.js — 细化导弹气动模型（AeroMissile，伪 5 自由度）
 *
 * 在基础质点模型之上引入：
 *   1) 迎角状态 α⃗（世界系二维向量，位于垂直速度平面内）
 *      一阶作动器/弹体响应滞后：τ ≈ 0.08 s（datamine 无舵机时间常数，
 *      按 finsLatAccel/finMomentArm 量级取工程值）
 *   2) 非线性升力：Cy(α) = k_L·α（α ≤ α_stall），失速后平台 maxCy
 *      - k_L 按 finsLatAccel/qRef 标定（datamine 的 CyK 语义不同，不作斜率使用）
 *   3) 诱导阻力（升致阻力）：D_i = q·S·CxAoA·α²
 *      - CxAoA 取 datamine rocket.CxAoA；缺失时标定回退 CxAoA = 0.1·k_L²
 *   4) 舵面限制（datamine 实测）：
 *      - 迎角上限 = min(finsAoaHor, finsAoaVer)
 *      - 横向过载上限 = min(loadFactorMax, finsLatAccel)
 *
 * 气动力合力 = 升力(α⃗ 方向) + 轴向(推力 − 零升阻力 − 诱导阻力) + 重力
 * 制导/推进/事件逻辑与基础模型一致（同 PN + 导引头角速率限制 + break-lock）。
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';
  const P = WT.phys;
  const G0 = WT.G0;
  const V3 = THREE.Vector3;
  const clamp = P.clamp;
  const cxAt = P.cxAt;
  const atmosphere = P.atmosphere;

  const CN_FIN = 4.5;      // 超音速翼面升力斜率（rad⁻¹，工程推定值）

  /* 从预设解析气动参数（含 datamine 缺失项的文档化回退） */
  function buildAero(p) {
    const finH = (p.finAoaHorRad > 0) ? p.finAoaHorRad : 0.5;
    const finV = (p.finAoaVerRad > 0) ? p.finAoaVerRad : 0.5;
    const alphaMax = Math.min(finH, finV);            // 舵面迎角限制（rad）
    const finsLatG = (p.finsLatAccelG > 0) ? p.finsLatAccelG : p.nMaxG;
    /* 舵面权限参考动压：datamine baseIndSpeed（指示空速，默认 1800 km/h）
     * qRef = ½ρ0·VRef²。qRef 以上舵面满权限，以下随动压线性衰减。 */
    const vRef = ((p.pid && p.pid.baseIndSpeedKmh > 0)
      ? p.pid.baseIndSpeedKmh : 1800) / 3.6;
    const qRef = 0.5 * 1.225 * vRef * vRef;
    /* 升力斜率标定：升力链与舵面权限平台在 qRef、发射质量处相交 ——
     *   k_L = finsLat·m0·g / (qRef·S·α_max)
     * 形成经典两段式可用过载包线（过载-马赫曲线）：
     *   低速段 n = q·S·k_L·α_max/(m·g) ∝ M²（受 fin 面积/迎角限制）
     *   高速段 n = min(nMax, finsLat)   平台（受 finsLatAccel 限制）
     * 注意：datamine 的 CyK 语义与本模型"每弧度升力斜率"并不等价 ——
     * 直接代入会把 AIM-7M 的机动性饿死到 ~2G/M1.8（与 finsLatAccel=29G
     * 标称严重矛盾），故 k_L 一律用上式标定，CyK 仅作参考保留。 */
    const S = Math.PI * p.caliber * p.caliber / 4 * p.wingMult;
    const kL = (finsLatG * G0 * p.mass0) / Math.max(qRef * S * alphaMax, 1e-6);
    /* α² 诱导阻力系数：引擎极线 D_i = q·S·cy²·indCoeff、indCoeff = 1/(π·λ)（λ=3 引擎默认）
     *（polares.cpp L531/L89-98）→ 映射到 α² 形式：CxAoA = k_L²/(π·3) = 0.1061·k_L²。
     * 旧回退 0.1·k_L² ⇔ λ=3.18；此处按引擎 λ=3 精确化（+6%）。
     * k_L 标定值很大时按 C_Di ≈ 0.1·min(Cy,3.2)² 截断等效（防极端值） */
    const kDrag = Math.min(kL, 20);
    const cxVsAoa = (p.cxVsAoaPerRad2 > 0)
      ? p.cxVsAoaPerRad2 : (kDrag * kDrag) / (Math.PI * 3);
    /* 舵面力矩动力学参数（fin面积 × 力臂 × 动压 → 机动响应带宽）：
     * I ≈ 0.02·m0·L²（细长体转动惯量修正，推定）；
     * S_fin = 0.5·S（舵面占翼面有效面积份额，推定，wingAreaMult 即 FM 舵/翼面积参数）；
     * 力臂 l = distFromCmToStab（datamine 实测） */
    const L = (p.lengthM > 0) ? p.lengthM : 20 * p.caliber;
    const Iyy = 0.02 * p.mass0 * L * L;
    const Sfin = 0.5 * S;
    const arm = (p.finMomentArmM > 0) ? p.finMomentArmM : 0.3;
    return { alphaMax, kL, cxVsAoa, finsLatG, qRef, S, Iyy, Sfin, arm };
  }

  class AeroMissile extends P.Missile {
    constructor(params, opts) {
      super(params, opts);
      this.aero = buildAero(params);
      this.aoaVec = new V3(0, 0, 0);   // 迎角矢量（方向=升力方向，模=α rad）
      this.aoaRate = new V3(0, 0, 0);  // 迎角变化率（rad/s）
      this.alphaDeg = 0;
    }

    step(dt, target, engine) {
      this.t += dt;
      const h = this.pos.y;
      const atm = atmosphere(h);
      const V = Math.max(this.vel.length(), 1e-6);
      const vhat = this.vel.clone().multiplyScalar(1 / V);
      const mach = V / atm.a;
      const p = this.p, A = this.aero;

      /* --- 推进（分级火箭 + 秒耗质量） --- */
      if (engine === 'const') {
        this.thrust = 0;
      } else {
        const prop = this._propulsion(this.t);
        this.thrust = prop.thrust;
        this.mass = prop.mass;
      }

      /* --- 制导：比例导引 a = N·Vc·(ω×v̂)（与基础模型一致） --- */
      /* 离架延迟（guidanceAutopilot.timeOut）：期内保持直飞，到期开启引导 */
      if (!this.guided && this.t >= this.timeOutS) this.guided = true;
      const r = new V3().subVectors(target.pos, this.pos);
      const rm = Math.max(r.length(), 1e-6);
      const rdot = new V3().subVectors(target.vel, this.vel);
      const closing = -r.dot(rdot) / rm;
      const aCmd = new V3(0, 0, 0);
      if (this.guided && closing > 1e-3) {
        const losRate = new V3().crossVectors(r, rdot).multiplyScalar(1 / (rm * rm));
        const losMag = losRate.length();
        const rateMax = (p.seekerRateMaxDeg || 30) * Math.PI / 180;
        if (losMag > rateMax) losRate.multiplyScalar(rateMax / losMag);
        if (losMag > 1.5 * rateMax) {
          this.overRateTime += dt;
          if (this.overRateTime > 0.6) {
            this.guidanceOn = false;
            this.brokeLock = true;
          }
        } else {
          this.overRateTime = Math.max(0, this.overRateTime - 2 * dt);
        }
        if (this.guidanceOn) {
          aCmd.crossVectors(losRate, vhat).multiplyScalar(p.pnGain * closing);
        }
      }
      /* 离架延迟段无升力、保持直飞；引导开启后重力补偿并入指令 */
      if (this.guided) aCmd.y += G0;
      /* 中段爬升（高抛）：垂直面由"爬升角程序"接管（覆盖 PN 垂直分量，见 physics.js） */
      if (this.guided && p.loft && closing > 0 && this.range0 &&
          rm > 0.5 * this.range0 && rm / Math.max(closing, 1) > 12) {
        const vh = this.vel.clone().normalize();
        /* 顶点瞄准（与 physics.js 同律）：逼近目标顶点时爬升角自动收平 */
        const hApex = this.h0 * (1 + 0.35 * (p.loftAngleDeg / 22));
        const vyNow = vh.y * this.vel.length();
        const gam = Math.asin(clamp(vh.y, -1, 1));
        const gamT = Math.min(p.loftAngleDeg * Math.PI / 180,
          Math.max(0, 0.0003 * (hApex - this.pos.y) - 0.0008 * Math.max(vyNow, 0)));
        const gamRate = clamp(0.15 * (gamT - gam), -0.25, 0.25);
        const aVert = Math.max(this.vel.length(), 120) * gamRate + G0;
        const uUp = new V3(0, 1, 0).addScaledVector(vh, -vh.y);
        if (uUp.lengthSq() > 1e-9) {
          uUp.normalize();
          aCmd.addScaledVector(uUp, aVert - aCmd.dot(uUp));
        }
      }
      /* 重力补偿/爬升偏置必须⊥速度：升力不做功。
       * 去掉沿速度分量，保留动能↔重力势能的正确转换（爬升减速、俯冲加速） */
      aCmd.addScaledVector(vhat, -aCmd.dot(vhat));

      /* --- 气动求解 --- */
      const q = 0.5 * atm.rho * V * V;
      const Sref = Math.PI * p.caliber * p.caliber / 4;
      const S = Sref * p.wingMult;                   // 升力/诱导阻力参考面积
      /* 可用过载 = min(舵面/结构权限平台, 升力链)（两段式包线）：
       * 高速段受 finsLatAccel / loadFactorMax 平台限制；
       * 低速段受 q·S·k_L·α_max/(m·g) 限制（fin 面积/迎角） */
      const authCap = Math.min(p.nMaxG, A.finsLatG) * G0;
      const liftCap = q * S * A.kL * A.alphaMax / Math.max(this.mass, 1);
      const aAvail = Math.min(authCap, liftCap);
      if (aCmd.length() > aAvail) aCmd.multiplyScalar(aAvail / aCmd.length());

      /* 迎角指令：配平所需 α = a·m/(q·S·k_L)，受舵面迎角限制截断 */
      const aLen = aCmd.length();
      const alphaCmd = Math.min(
        (this.mass * aLen) / Math.max(q * S * A.kL, 1e-9), A.alphaMax);

      /* 迎角二阶舵面动力学（finAOA/fin面积/质心距离直接挂钩机动性）：
       *   α̈ = ω_n²·(α_cmd − α) − 2ζ·ω_n·α̇
       *   ω_n = √(q · S_fin · Cn_fin · l / I)
       * 舵面面积越大、力臂越长、动压越高 → 响应越快（机动性越强）；
       * 弹体越重越长（惯量大） → 响应越慢 */
      const tvec = new V3(0, 0, 0);
      if (alphaCmd > 1e-9 && aLen > 1e-6) {
        tvec.copy(aCmd).multiplyScalar(alphaCmd / aLen);
      }
      const wn = clamp(Math.sqrt(Math.max(q * A.Sfin * CN_FIN * A.arm / A.Iyy, 1e-9)), 5, 30);
      const accA = tvec.clone().sub(this.aoaVec).multiplyScalar(wn * wn)
        .addScaledVector(this.aoaRate, -2 * 0.8 * wn);
      this.aoaRate.addScaledVector(accA, dt);
      this.aoaVec.addScaledVector(this.aoaRate, dt);
      /* 幅值硬限制：舵面迎角（finsAoaHor/Ver） */
      if (this.aoaVec.length() > A.alphaMax) {
        this.aoaVec.setLength(A.alphaMax);
        this.aoaRate.multiplyScalar(0.5);
      }

      /* 升力 = α⃗ 方向 · q·S·k_L·α（线性升力；α 已被舵面限制截断） */
      const aoa = this.aoaVec.length();
      const lift = aoa > 1e-9
        ? this.aoaVec.clone().multiplyScalar(q * S * A.kL)
        : new V3(0, 0, 0);

      /* 轴向：推力 − 零升阻力 − 诱导阻力（α²） */
      const D0 = q * Sref * p.wingMult * p.cxK * cxAt(mach);
      const Di = q * S * A.cxVsAoa * aoa * aoa;
      const aAxial = engine === 'const' ? 0 : (this.thrust - D0 - Di) / this.mass;

      /* --- 积分 --- */
      const acc = lift.multiplyScalar(1 / this.mass)
        .addScaledVector(vhat, aAxial)
        .add(new V3(0, -G0, 0));
      this.vel.addScaledVector(acc, dt);
      this.pos.addScaledVector(this.vel, dt);
      if (engine === 'const') {
        this.vel.multiplyScalar(this.launchSpeed / Math.max(this.vel.length(), 1e-6));
      }

      /* 遥测 */
      this.alphaDeg = aoa * 180 / Math.PI;
      this.gLoad = q * S * A.kL * aoa / Math.max(this.mass, 1e-6) / G0;
      this.travelDist += this.vel.length() * dt;
      this.trailPts.push(this.pos.clone());
    }
  }

  /* 过载-马赫曲线：n_max(M) = min(舵面权限平台, 升力链)
   *   舵面权限 = min(nMaxG, finsLatAccel)        ← 高速段平台
   *   升力链   = q·S·k_L·α_max/(m·g) ∝ M²      ← 低速段（fin 面积/迎角） */
  function nMaxAtMach(p, A, mass, mach, h) {
    const atm = P.atmosphere(h);
    const q = 0.5 * atm.rho * Math.pow(Math.max(mach, 0.05) * atm.a, 2);
    const auth = Math.min(p.nMaxG, A.finsLatG);
    const lift = q * A.S * A.kL * A.alphaMax / (Math.max(mass, 1) * G0);
    return { n: Math.min(auth, lift), auth, lift, q };
  }

  /* 转折马赫：升力链 = 权限平台的交点
   *（低于此马赫 → 升力链限制，机动性随速度下降而下降） */
  function cornerMach(p, A, mass, h) {
    const atm = P.atmosphere(h);
    const plat = Math.min(p.nMaxG, A.finsLatG);
    const qStar = plat * Math.max(mass, 1) * G0 /
      Math.max(A.S * A.kL * A.alphaMax, 1e-9);
    return Math.sqrt(Math.max(2 * qStar / (atm.rho * atm.a * atm.a), 0));
  }

  WT.AeroMissile = AeroMissile;
  WT.buildAero = buildAero;
  WT.nMaxAtMach = nMaxAtMach;
  WT.cornerMach = cornerMach;
})(window.WT);
