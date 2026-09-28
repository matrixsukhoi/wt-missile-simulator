/* ============================================================
 * physics.js — 简化动力学内核
 *
 * 大气模型：ISA 对流层简化
 * 飞机模型：3 自由度质点 + 姿态四元数（速度恒沿机轴，1 马赫不变）
 *           拉杆/压杆 → 法向过载指令（默认 +9G/-4G，带舵机速率限制）
 *           滚转     → 绕机体纵轴滚转（默认 180°/s）
 * 导弹模型：3 自由度质点 + 比例导引（PN）+ 分级固体火箭 + 阻力模型
 *           a_cmd = N · Vc · (ω_los × v̂)   （与 missile_sim 一致）
 *           阻力   D = ½ρV² · CdA(M)，CdA(M) 用 1943 Cx(M) 表 ×标度
 * 目标事件：近炸引信 / 直接命中 / 脱靶 / 超时 / 动力耗尽 / 撞地
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';

  const G0 = WT.G0;
  const V3 = THREE.Vector3;
  const Q = THREE.Quaternion;
  const AXIS_X = new V3(1, 0, 0);       // 机体右翼轴（抬头为正转）
  const AXIS_FWD = new V3(0, 0, -1);    // 机体前向（三.js 约定）
  const BODY_FWD = new V3(0, 0, -1);
  const WORLD_UP = new V3(0, 1, 0);

  /* ---------------- 工具函数 ---------------- */
  function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }

  function interpTable(x, table) {
    if (x <= table[0][0]) return table[0][1];
    const n = table.length;
    if (x >= table[n - 1][0]) return table[n - 1][1];
    for (let i = 1; i < n; i++) {
      if (x <= table[i][0]) {
        const [x0, y0] = table[i - 1], [x1, y1] = table[i];
        return y0 + (y1 - y0) * (x - x0) / (x1 - x0);
      }
    }
    return table[n - 1][1];
  }

  /* 1943 Cx(M) ×1.10 阻力系数 */
  function cxAt(mach) { return interpTable(mach, WT.CX_MACH_TABLE); }

  /* 大气模型：DagorEngine gamePhys/props/atmosphere 精确移植
   *（源码 atmosphere.cpp L13/L67/L70/L73/L76 + atmosphere.h L27-29 系数字面值）
   * 语义：单一 4 次多项式拟合（设计域 0..18300 m），非 ISA 分层、无 11/20km 边界；
   * h>18300 时 T 冻结 216.667K、p/ρ 按 1/h 尾部衰减（引擎行为，勿当 bug 修）。
   * 注意：p/ρ/T 三项独立拟合（隐含 R=p/(ρT) 在 278~287 漂移），不要用 p=ρRT 交叉验证。 */
  const ATM = {
    H_MAX: 18300,
    P0: 101300,          // 引擎字面值（非 101325）
    T0: 288.16,          // 引擎字面值（非 288.15）
    RO0: 1.225,
    SONIC_K: 20.1,       // a = 20.1·√T（⇔ γR = 404.01）
    C_T: [1, -2.27712e-5, 2.18069e-10, -5.71104e-14, 3.97306e-18],
    C_P: [1, -0.000118441, 5.6763e-9, -1.3738e-13, 1.60373e-18],
    C_R: [1, -9.59387e-5, 3.53118e-9, -5.83556e-14, 2.28719e-19]
  };
  function atmPoly(c, v) {   // atmosphere.cpp L13 Horner 求值
    return (((c[4] * v + c[3]) * v + c[2]) * v + c[1]) * v + c[0];
  }
  function atmosphere(h) {
    const hh = Math.max(0, h);
    const hLo = Math.min(hh, ATM.H_MAX);
    const tail = ATM.H_MAX / Math.max(ATM.H_MAX, hh);   // ≤18300m 恒为 1
    const T = ATM.T0 * atmPoly(ATM.C_T, hLo);
    return {
      T,
      p: ATM.P0 * atmPoly(ATM.C_P, hLo) * tail,
      rho: ATM.RO0 * atmPoly(ATM.C_R, hLo) * tail,
      a: ATM.SONIC_K * Math.sqrt(T)
    };
  }

  /* 相对运动线段最近距离（连续 CPA）：prevRel→rel 线段到原点的最小距离 */
  function segMinDist(prevRel, rel) {
    if (!prevRel) return rel.length();   // 防御：手造弹无 _prevRel
    const d = new V3().subVectors(rel, prevRel);
    const d2 = d.lengthSq();
    if (d2 <= 1e-12) return rel.length();
    const tau = clamp(-prevRel.dot(d) / d2, 0, 1);
    return prevRel.clone().addScaledVector(d, tau).length();
  }

  /* 姿态角：俯仰角 + 坡度角（右坡度为正，倒飞 = ±180°） */
  function attitudeAngles(quat) {
    const f = BODY_FWD.clone().applyQuaternion(quat);
    const upW = new V3(0, 1, 0).applyQuaternion(quat);
    const rightW = new V3(1, 0, 0).applyQuaternion(quat);
    const pitch = Math.asin(clamp(f.y, -1, 1));
    const bank = Math.atan2(-rightW.y, upW.y);
    return { pitch, bank, fwd: f, up: upW, right: rightW };
  }

  /* 角度差（弧度），结果在 [-π, π] */
  function angDiff(a, b) {
    let d = a - b;
    while (d > Math.PI) d -= 2 * Math.PI;
    while (d < -Math.PI) d += 2 * Math.PI;
    return d;
  }

  /* 确定性随机数（批量测试用） */
  function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* ============================================================
   * 被锁定飞机（简化 3DOF，恒定马赫）
   * ============================================================ */
  class Aircraft {
    constructor(params, pos) {
      this.p = params;                 // {mach, nMaxPos, nMaxNeg, rollRateMaxDeg}
      this.pos = pos.clone();
      this.vel = new V3();
      this.quat = new Q();             // 初始：平飞朝 -Z
      this.n = 1.0;                    // 当前法向过载（G）
      this.rollRate = 0;               // 当前滚转速率 rad/s
      this.peakG = 1.0;
      this.V = 0;
      /* 简易气动（能量/SEP）模型状态 */
      this.sepCmd = (params.sepInit != null ? params.sepInit
        : (params.sepMax != null ? params.sepMax : 300));  // 油门给定 SEP（默认满油门 = 最大）
      this.sepActual = 0;                                           // 实时 SEP
      this.step(0.0, { pitch: 0, roll: 0 });
    }

    /* cmd: {pitch ∈[-1,1] 拉杆+ / 压杆-, roll ∈[-1,1] 右滚+, sep ∈[-1,1] 油门±} */
    step(dt, cmd) {
      const h = this.pos.y;
      const aero = this.p.model === 'aero';
      if (!aero) {
        this.V = this.p.mach * atmosphere(h).a;   // 基础模型：维持设定马赫数
      } else if (!(this.V > 1)) {
        this.V = this.p.mach * atmosphere(h).a;   // 简易气动：初速 = 设定马赫
      }

      /* 过载指令：拉杆按最大正过载，压杆按最大负过载 */
      const cmdPitch = clamp(cmd.pitch || 0, -1, 1);
      /* 法向过载指令映射：0 杆 = 1G（配平）、满杆 = nMaxPos、满推 = nMaxNeg */
      const nTarget = cmdPitch >= 0
        ? 1 + cmdPitch * (this.p.nMaxPos - 1)
        : 1 + cmdPitch * Math.abs(1 - this.p.nMaxNeg);

      /* 舵机：过载速率限制 ±30 G/s */
      const nRate = 30;
      this.n += clamp(nTarget - this.n, -nRate * dt, nRate * dt);
      this.peakG = Math.max(this.peakG, Math.abs(this.n));

      /* 滚转舵机：速率限制 */
      const rrTarget = clamp(cmd.roll || 0, -1, 1) *
        this.p.rollRateMaxDeg * Math.PI / 180;
      const rrAccel = 12;              // rad/s² 滚转角加速度限制
      this.rollRate += clamp(rrTarget - this.rollRate, -rrAccel * dt, rrAccel * dt);

      if (dt > 0) {
        /* 姿态积分：拉杆 = 绕机体 +X 抬头；滚转 = 绕机体纵轴 */
        /* 重力参与转弯（法向过载模型）：上拉需克服重力（−1g 分量），
         * 下俯/倒飞重力助推（随姿态 upY 连续变化） */
        const upY = new V3(0, 1, 0).applyQuaternion(this.quat).y;
        const wPitch = (this.n - upY) * G0 / this.V;   // rad/s
        const dqPitch = new Q().setFromAxisAngle(AXIS_X, wPitch * dt);
        const dqRoll = new Q().setFromAxisAngle(AXIS_FWD, this.rollRate * dt);
        this.quat.multiply(dqPitch).multiply(dqRoll).normalize();
      }
      /* 速度恒沿机头（零侧滑/迎角简化）；
       * 注意：dt=0（构造初始化）时也必须给 vel 赋值，否则首步前 vel=0 */
      const fwd = BODY_FWD.clone().applyQuaternion(this.quat);

      if (aero && dt > 0) {
        /* ===== 简易气动/能量模型（SEP，能量机动法） =====
         * 油门（cmd.sep：SHIFT 增 / CTRL 减）增减 SEP，限幅 [sepMin, sepMax]；
         * 机动能量损失随过载线性：1G=0，最大机动过载 = gLossMax（默认 -300 m/s）；
         * 实时 SEP = 油门 SEP + 机动能量损失（即"取最大 SEP 减机动损失"语义）；
         * 能量方程 d(h + V²/2g)/dt = SEP：
         *   爬升（Vv>0）→ 动能换高度（减速）；俯冲（Vv<0）→ 高度换速度（加速） */
        const nlim = Math.max(this.p.nMaxPos || 10, 1.5);
        const ratio = clamp((Math.abs(this.n) - 1) / (nlim - 1), 0, 1);
        /* 油门百分比（0..100%）：SHIFT 增 / CTRL 减（sepRate 兼容旧口径：m/s/s）；
         * 实时 SEP = 最大油门SEP(默认300) × 油门百分比 − 阻力SEP + 机动损失 */
        const sepMaxCfg = this.p.sepMax != null ? this.p.sepMax : 300;
        this.sepCmd += clamp(cmd.sep || 0, -1, 1) * (this.p.sepRate || 150) * dt;
        this.sepCmd = clamp(this.sepCmd, 0, sepMaxCfg);
        this.thr = sepMaxCfg > 0 ? this.sepCmd / sepMaxCfg : 1;   // 油门百分比（供 HUD）
        const lossMax = this.p.gLossMax != null ? this.p.gLossMax : -200;
        /* 表速/阻力模型：阻力功率损失 ∝ V² ——
         *   阻力损失 = sepMax·(V_EAS / V_EAS_max)²
         * 满油门 SEP = sepMax·(1−(V/Vmax)²)：最大表速（默认 1550 km/h EAS）处为 0，
         * **超过最大表速为负**（阻力 > 推力，自动减速回落）；
         * 表速→真空速按 V_TAS = V_EAS·√(ρ0/ρ) 换算，不同高度限速真空速不同 */
        const atmNow = atmosphere(h);
        const easMax = (this.p.maxEasKmh != null ? this.p.maxEasKmh : 1550) / 3.6;
        const eas = this.V * Math.sqrt(Math.max(atmNow.rho / 1.225, 1e-6));
        const sepMax = this.p.sepMax != null ? this.p.sepMax : 300;
        const dragPen = sepMax * (eas / easMax) * (eas / easMax);
        /* 实时 SEP = 油门 − 阻力损失 + 机动能量损失（无下限；最小SEP参数已移除） */
        this.sepActual = this.sepCmd + lossMax * ratio - dragPen;
        const Vv = fwd.y * this.V;                // 垂直速度（爬升率）
        this.V = Math.max(
          this.V + G0 * (this.sepActual - Vv) / Math.max(this.V, 80) * dt, 80);
        /* 真空速硬限幅（表速上限换算值） */
        const vTasMax = easMax * Math.sqrt(1.225 / Math.max(atmNow.rho, 1e-6));
        if (this.V > vTasMax) this.V = vTasMax;
      } else if (aero) {
        this.sepActual = this.sepCmd;
      }

      this.vel.copy(fwd).multiplyScalar(this.V);
      this.pos.addScaledVector(this.vel, dt);
      return this;
    }

    angles() { return attitudeAngles(this.quat); }
  }

  /* ============================================================
   * 导弹（3DOF + 比例导引）
   * ============================================================ */
  class Missile {
    constructor(params, opts) {
      this.p = params;
      this.pos = opts.pos.clone();
      this.vel = opts.vel.clone();
      this.t = 0;
      this.h0 = this.pos.y;        // 发射高度（高抛顶点预算基准）
      this.mass = params.mass0;
      this.thrust = 0;
      this.stageName = null;
      this.trailPts = [];
      this.launchSpeed = this.vel.length();
      this.range0 = opts.range0;
      this.flying = true;
      this.guidanceOn = true;      // 导引头是否仍在跟踪
      this.brokeLock = false;      // 曾因角速率超限丢失
      this.overRateTime = 0;
      this.gLoad = 0;              // 当前法向过载（G）
      this.aoaVec = new V3(0, 0, 0);  // 迎角矢量（方向=升力方向，模=α rad）
      this.alphaDeg = 0;           // 当前迎角（°）
      this.travelDist = 0;         // 飞行总距离（m）
      /* 离架延迟（datamine guidanceAutopilot.timeOut）：延迟段内保持直飞 */
      this.timeOutS = params.timeOutS || 0;
      this.guided = !(this.timeOutS > 0);
    }

    /* 推进级采样：推力、秒耗量、当前质量 */
    _propulsion(t) {
      let tPrev = 0, lost = 0;
      for (const st of this.p.stages) {
        const tEnd = tPrev + st.t;
        if (t < tEnd) {
          const frac = (t - tPrev) / st.t;
          return {
            thrust: st.thrust,
            mass: this.p.mass0 - lost - st.massLost * frac,
            stage: st
          };
        }
        lost += st.massLost;
        tPrev = tEnd;
      }
      return { thrust: 0, mass: Math.max(this.p.mass0 - lost, 1), stage: null };
    }

    /* 单步积分；target = {pos, vel}；engine = 'dynamic' | 'const' */
    step(dt, target, engine) {
      this.t += dt;
      const h = this.pos.y;
      const atm = atmosphere(h);
      const V = Math.max(this.vel.length(), 1e-6);
      const vhat = this.vel.clone().multiplyScalar(1 / V);
      const mach = V / atm.a;

      /* --- 制导：比例导引 a = N·Vc·(ω×v̂) --- */
      /* 离架延迟（guidanceAutopilot.timeOut）：期内保持直飞，到期开启引导 */
      if (!this.guided && this.t >= this.timeOutS) this.guided = true;
      const r = new V3().subVectors(target.pos, this.pos);
      const rm = Math.max(r.length(), 1e-6);
      const rdot = new V3().subVectors(target.vel, this.vel);
      const closing = -r.dot(rdot) / rm;
      let aLat = new V3(0, 0, 0);
      if (this.guided && closing > 1e-3) {
        const losRate = new V3().crossVectors(r, rdot).multiplyScalar(1 / (rm * rm));
        const losMag = losRate.length();
        /* 导引头角速率限制（datamine seeker.rateMax） */
        const rateMax = (this.p.seekerRateMaxDeg || 30) * Math.PI / 180;
        if (losMag > rateMax) losRate.multiplyScalar(rateMax / losMag);
        /* 持续超限 → 导引头丢失目标（简化 break-lock），此后惯性飞行 */
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
          aLat.crossVectors(losRate, vhat).multiplyScalar(this.p.pnGain * closing);
        }
      }

      /* 重力补偿（把重力计入横向指令一起限幅）；离架延迟段无升力、保持直飞 */
      if (this.guided) aLat.y += G0;

      /* 中段爬升（高抛）：垂直面由"爬升角程序"接管 —— 爬升角 γ 以一阶速率趋向
       * loftAngle，PN 的垂直分量被覆盖（水平导引保持）。旧实现只叠加 0.35G
       * 微小偏置，会被 PN 的碰撞航线保持完全抵消（50km 弹道顶点仅 ~160m）。 */
      if (this.guided && this.p.loft && closing > 0 && this.range0 &&
          rm > 0.5 * this.range0 && rm / Math.max(closing, 1) > 12) {
        const vh = this.vel.clone().normalize();
        /* 顶点瞄准：目标顶点 = 发射高度·(1 + 0.35·loftAngle/22°)，
         * 按游戏实测校准（AIM-120D 10km/M1.6 迎头发射顶点 ≤13.5km）；
         * 逼近顶点时爬升角自动收平，不再一路按标称角爬到门限 */
        const hApex = this.h0 * (1 + 0.31 * (this.p.loftAngleDeg / 22));
        const vyNow = vh.y * this.vel.length();
        const gam = Math.asin(clamp(vh.y, -1, 1));
        /* PD 顶点伺服：位置项给爬升角，垂直速度项提前收平（消惯性过冲） */
        const gamT = Math.min(this.p.loftAngleDeg * Math.PI / 180,
          Math.max(0, 0.0003 * (hApex - this.pos.y) - 0.0011 * Math.max(vyNow, 0)));
        const gamRate = clamp(0.15 * (gamT - gam), -0.25, 0.25);
        const aVert = Math.max(this.vel.length(), 120) * gamRate + G0;
        const uUp = new V3(0, 1, 0).addScaledVector(vh, -vh.y);
        if (uUp.lengthSq() > 1e-9) {
          uUp.normalize();
          aLat.addScaledVector(uUp, aVert - aLat.dot(uUp));
        }
      }

      /* 重力补偿/爬升偏置必须⊥速度：升力不做功。
       * 去掉沿速度分量，否则"补偿力"给导弹做功，
       * 会恰好抵消重力的切向分量，抹掉动能↔重力势能的转换 */
      aLat.addScaledVector(vhat, -aLat.dot(vhat));

      /* 横向过载限幅：可用过载随动压衰减（低速/高空舵效下降） */
      const q = 0.5 * atm.rho * V * V;
      const aMax = this.p.nMaxG * clamp(q / 50000, 0.15, 1) * G0;
      if (aLat.length() > aMax) aLat.multiplyScalar(aMax / aLat.length());
      this.gLoad = aLat.length() / G0;    // 限幅后实际法向过载（G）

      /* 弹体姿态遥测：迎角矢量 aoaVec（方向=升力方向 ⊥速度，模=α）——
       * α = CL/k_L，CL = m·a_lat/(q·S)（与诱导阻力同一升力系数，基型/气动一致） */
      {
        const mEff = this.mass || this.p.mass0 || 100;
        const SlA = (Math.PI * this.p.caliber * this.p.caliber / 4) * this.p.wingMult;
        const kLA = this.p.cyKPerRad || 3;
        const aoaM = clamp((mEff * aLat.length()) / Math.max(q * SlA, 1e-6) / kLA, 0, 0.5);
        this.aoaVec = aLat.lengthSq() > 1e-9
          ? aLat.clone().normalize().multiplyScalar(aoaM)
          : new V3(0, 0, 0);
        this.alphaDeg = aoaM * 180 / Math.PI;
      }

      /* --- 轴向：推力 - 零升阻力 - 诱导阻力 --- */
      let aAxial = 0;
      if (engine === 'const') {
        /* 恒速纯运动学模式：每步恢复初速（无能量损失，纯几何对抗） */
      } else {
        const prop = this._propulsion(this.t);
        this.thrust = prop.thrust;
        this.mass = prop.mass;
        const Sref = Math.PI * this.p.caliber * this.p.caliber / 4;
        const CdA = Sref * this.p.wingMult * this.p.cxK * cxAt(mach);
        const D0 = q * CdA;                 // 零升阻力
        /* 诱导阻力（升致阻力）：拉过载即耗能。
         * D_i = k·(n·m·g)²/(q·S)，k = 1/(π·AR·e)（AR≈4、e≈0.8，
         * 弹体+舵面组合的有效值，按拦截时间线校准），
         * 升力系数 CL 以 4 截断模拟失速。拉得越狠速度掉得越快——
         * 持续大过载机动是拉干导弹能量的主要手段。 */
        const Sl = Sref * this.p.wingMult;
        const nAcc = this.gLoad * G0;       // 横向加速度 m/s²
        const CL = clamp((this.mass * nAcc) / Math.max(q * Sl, 1e-6), 0, 4);
        const Di = q * Sl * CL * CL * (1 / (Math.PI * 4 * 0.8));
        aAxial = -(D0 + Di) / this.mass;   // 阻力沿速度反向（推力改沿弹体轴，见下）
      }

      /* --- 合成加速度并积分 ---
       * 推力沿【弹体轴】：弹体轴 = 速度矢量偏转迎角 α（方向=升力方向）——
       * 攻角下推力有侧向分量（助推转向）、轴向分量按 cosα 折减 */
      const aoaT = this.aoaVec.length();
      const nHat = aoaT > 1e-6
        ? vhat.clone().multiplyScalar(Math.cos(aoaT))
          .addScaledVector(this.aoaVec.clone().normalize(), Math.sin(aoaT)).normalize()
        : vhat;
      const acc = aLat.clone()
        .addScaledVector(nHat, (this.thrust || 0) / this.mass)
        .addScaledVector(vhat, aAxial)
        .add(new V3(0, -G0, 0));          // 重力
      this.vel.addScaledVector(acc, dt);
      this.pos.addScaledVector(this.vel, dt);

      if (engine === 'const') {
        this.vel.multiplyScalar(this.launchSpeed / Math.max(this.vel.length(), 1e-6));
      }
      this.travelDist += this.vel.length() * dt;
      this.trailPts.push(this.pos.clone());
    }
  }

  /* ============================================================
   * 交战（Engagement）：一次完整对抗
   * ============================================================ */
  const RESULT_LABEL = {
    hit_direct: '直接命中',
    hit_prox: '近炸命中',
    miss: '脱靶',
    intercepted: '被拦截（我方拦截弹击毁）',
    timeout: '超时',
    exhausted: '导弹动力耗尽',
    missile_crash: '导弹撞地',
    target_crash: '目标撞地'
  };

  class Engagement {
    /* cfg: { aircraft{...}, missile{preset fields + nMaxG/pnGain/fuseR 可覆盖},
     *        scenario{launchDistM, launchAltM, targetAltM, launchMach, aspectDeg, engine} } */
    constructor(cfg) {
      this.cfg = cfg;
      this.t = 0;
      this.done = false;
      this.result = null;
      this.minRange = Infinity;
      this.minRangePos = null;
      this.peakG = 1;
      this.log = [];

      const s = cfg.scenario;
      /* 目标机：位于原点上空，初始朝 -Z 平飞 */
      this.aircraft = new Aircraft(cfg.aircraft, new V3(0, s.targetAltM, 0));

      /* 导弹发射位置：按来袭方位角环绕目标布置
       * aspectDeg: 0=迎头(机头前方) 90=右侧向 180=尾追 */
      const fwd = new V3(0, 0, -1);
      const aspect = s.aspectDeg * Math.PI / 180;
      const dir = fwd.clone().applyAxisAngle(WORLD_UP, -aspect); // 方位角向右为正（与 RWR 同手向）
      const mpos = new V3(0, s.launchAltM, 0)
        .addScaledVector(dir, s.launchDistM);

      /* 导弹构造器（连发：每发在自己发射时刻瞄准目标当时位置） */
      const MClass = (cfg.missile.model === 'aero' && WT.AeroMissile)
        ? WT.AeroMissile : Missile;
      this._spawnMissile = () => {
        const mp = new V3(0, s.launchAltM, 0).addScaledVector(dir, s.launchDistM);
        const aimv = new V3(0, s.targetAltM, 0).sub(mp).normalize();
        /* 初始速度矢量方向：与来袭方向（瞄准线）的夹角 —— 模拟斜射/离架偏转 */
        const yaw0 = (s.launchYawDeg || 0) * Math.PI / 180;
        if (yaw0 !== 0) aimv.applyAxisAngle(WORLD_UP, yaw0);
        const v0 = s.launchMach * atmosphere(s.launchAltM).a;
        const m = new MClass(cfg.missile, {
          pos: mp, vel: aimv.multiplyScalar(v0), range0: s.launchDistM
        });
        m._prevRel = m.pos.clone().sub(this.aircraft.pos);
        m.endReason = null;
        m.minRange = Infinity;
        return m;
      };
      /* 连发：首发立即入列，其余按发射间隔排队 */
      this.missiles = [this._spawnMissile()];
      this.salvoN = Math.max(1, Math.min(cfg.scenario.salvoN || 1, 8));
      this.salvoInterval = cfg.scenario.salvoInterval || 3;
      this.missileQueue = [];
      for (let i = 1; i < this.salvoN; i++) {
        this.missileQueue.push(i * this.salvoInterval);
      }
      this._minAtLaunch = s.launchDistM;
    }

    /* 主威胁 = 飞行中离本机最近的一枚；否则最后一枚 */
    get missile() {
      let best = null, bd = Infinity;
      for (const m of this.missiles) {
        if (!m.flying) continue;
        const d = m.pos.distanceTo(this.aircraft.pos);
        if (d < bd) { bd = d; best = m; }
      }
      return best || this.missiles[this.missiles.length - 1];
    }

    /* 推进一步。cmd = {pitch, roll} */
    step(dt, cmd) {
      if (this.done) return;
      this.t += dt;

      /* 连发：到点发射 */
      while (this.missileQueue.length && this.t >= this.missileQueue[0]) {
        this.missileQueue.shift();
        this.missiles.push(this._spawnMissile());
      }

      this.aircraft.step(dt, cmd);
      if (this.aircraft.pos.y <= 25) {
        this._finish('target_crash', this.minRange);
        return;
      }
      this.peakG = Math.max(this.peakG, Math.abs(this.aircraft.n));

      const fuseR = this.cfg.missile.fuseR;
      let anyFlying = this.missileQueue.length > 0;
      for (const m of this.missiles) {
        if (!m.flying) continue;
        m.step(dt, { pos: this.aircraft.pos, vel: this.aircraft.vel },
          this.cfg.scenario.engine);

        /* 弹目相对运动线段上的最近距离（连续 CPA 判定，
         * 避免高速交错时单步位移大于引信半径而漏判命中） */
        const rel1 = new V3().subVectors(m.pos, this.aircraft.pos);
        const minDistStep = segMinDist(m._prevRel, rel1);
        m._prevRel.copy(rel1);
        const range = rel1.length();
        if (m.t > 0.2 && minDistStep < m.minRange) {
          m.minRange = minDistStep;
          if (minDistStep < this.minRange) {
            this.minRange = minDistStep;
            this.minRangePos = m.pos.clone().lerp(this.aircraft.pos, 0.5);
          }
        }

        const rdot = new V3().subVectors(this.aircraft.vel, m.vel);
        const closing = -rel1.dot(rdot) / Math.max(range, 1e-6);

        /* --- 单发终止判定（任一发命中则全交战立即结束） --- */
        if (minDistStep <= fuseR) {
          this._finish(minDistStep <= 3 ? 'hit_direct' : 'hit_prox', minDistStep);
          return;
        } else if (m.pos.y <= 5) {
          m.flying = false; m.endReason = 'missile_crash';
        } else if (m.t >= this.cfg.missile.lifeS) {
          m.flying = false; m.endReason = 'timeout';
        } else if (m.vel.length() < 180 && this.cfg.scenario.engine !== 'const') {
          m.flying = false; m.endReason = 'exhausted';
        } else if (closing < -30 && range > m.minRange + 400) {
          m.flying = false; m.endReason = 'miss';   // 弹目距离已拉开
        } else {
          anyFlying = true;
        }
      }

      /* 全部弹结束且无命中 → 按最小脱靶那枚的结束原因结算 */
      if (!anyFlying) this._settle();
    }

    _settle() {
      if (this.done) return;
      let best = this.missiles[0];
      for (const m of this.missiles) {
        if ((m.minRange == null ? Infinity : m.minRange) <
            (best.minRange == null ? Infinity : best.minRange)) best = m;
      }
      this._finish(best.endReason || 'miss', this.minRange);
    }

    _finish(result, missDist) {
      this.done = true;
      let label = RESULT_LABEL[result];
      if (result === 'miss' && this.missile && this.missile.brokeLock) {
        label = '脱靶（导引头超限丢失）';
      }
      this.result = {
        result, label,
        hit: result === 'hit_direct' || result === 'hit_prox',
        missDist: Math.max(missDist === Infinity ? 0 : missDist, 0),
        t: this.t,
        peakG: this.peakG
      };
    }

    /* 遥测（10 Hz 采样） */
    sample() {
      const range = this.missile.pos.distanceTo(this.aircraft.pos);
      const rdot = new V3().subVectors(this.aircraft.vel, this.missile.vel);
      const rv = new V3().subVectors(this.aircraft.pos, this.missile.pos);
      const closing = -rv.dot(rdot) / Math.max(range, 1e-6);
      return {
        t: this.t,
        acAlt: this.aircraft.pos.y,
        acMach: this.aircraft.V / atmosphere(this.aircraft.pos.y).a,
        n: this.aircraft.n,
        range, closing,
        mSpeed: this.missile.vel.length(),
        missDist: this.minRange
      };
    }
  }

  /* ============================================================
   * 批量打靶（战术测试）：无渲染快速仿真
   * ============================================================ */
  function runBatch(cfg, tacticFactory, nRuns, seed0) {
    const out = [];
    for (let i = 0; i < nRuns; i++) {
      const rng = mulberry32((seed0 + i * 7919) >>> 0);
      const eng = new Engagement(cfg);
      const tactic = tacticFactory(rng);
      const dt = 0.01;
      while (!eng.done && eng.t < 150) {
        const cmd = tactic.update(eng, dt) || { pitch: 0, roll: 0 };
        eng.step(dt, cmd);
      }
      if (!eng.done) eng._finish('timeout', eng.minRange);
      out.push(Object.assign({}, eng.result, { run: i + 1 }));
    }
    return out;
  }

  WT.phys = {
    clamp, cxAt, atmosphere, attitudeAngles, angDiff, mulberry32,
    Aircraft, Missile, Engagement, runBatch, RESULT_LABEL, segMinDist
  };
})(window.WT);
