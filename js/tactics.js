/* ============================================================
 * tactics.js — 规避战术自动驾驶仪
 *
 * 所有战术输出与手动驾驶相同的指令 {pitch, roll}：
 *   pitch ∈ [-1,1]  拉杆(+9G 上限) / 压杆(-4G 上限)
 *   roll  ∈ [-1,1]  左/右滚转
 * 即战术与人在环完全等价，可直接对比测试。
 *
 * 战术清单（精简版）：
 *   1) 最大G定常盘旋   2) 置尾   3) 置尾平飞   4) DEZ 动能规避
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';
  const P = WT.phys;
  const clamp = P.clamp;

  /* 共用：坡度保持控制器（roll 指令把坡度压到目标值） */
  function bankController(eng, bankTargetRad) {
    const { bank } = P.attitudeAngles(eng.aircraft.quat);
    const err = P.angDiff(bankTargetRad, bank);
    return clamp(err * 1.5, -1, 1);
  }

  const UP = new THREE.Vector3(0, 1, 0);

  /* 共用：导弹相对机头【水平航向】的方位角（水平面投影，0=机头航向，+右）
   * 注意不能直接用机体轴做 atan2：大坡度/倒飞时机体侧轴接近竖直，
   * 水平方位会退化（转弯时菱形不随航向移动），故统一取水平面投影。 */
  function missileBearing(eng) {
    const rel = eng.missile.pos.clone().sub(eng.aircraft.pos);
    const a = P.attitudeAngles(eng.aircraft.quat);
    const fwdH = new THREE.Vector3(a.fwd.x, 0, a.fwd.z);
    const relH = new THREE.Vector3(rel.x, 0, rel.z);
    if (fwdH.lengthSq() < 1e-8 || relH.lengthSq() < 1e-8) {
      /* 俯冲正下方 / 机头垂直等退化情形回退到机体轴解算 */
      return Math.atan2(rel.dot(a.right), rel.dot(a.fwd));
    }
    fwdH.normalize();
    const rightH = new THREE.Vector3().crossVectors(fwdH, UP);  // fwd×up = 右
    return Math.atan2(relH.dot(rightH), relH.dot(fwdH));
  }

  /* 共用：导弹相对水平面的仰角（+上 / -下） */
  function missileElevation(eng) {
    const rel = eng.missile.pos.clone().sub(eng.aircraft.pos);
    const horiz = Math.hypot(rel.x, rel.z);
    return Math.atan2(rel.y, Math.max(horiz, 1e-6));
  }

  /* 基类 */
  class Tactic {
    constructor(rng) {
      this.rng = rng || Math.random;
      this.t = 0;
      this._turnSign = 0;
    }
    update(eng, dt) {
      this.t += dt;
      const c = this._cmd(eng, dt) || { pitch: 0, roll: 0 };
      if (c.sep == null) c.sep = 1;   // 自动战术默认全油门（保能量）
      return c;
    }
    /* 转向侧选择：反转段（|az|>90°）进入时一次锁定，
     * 防止目标方位穿越 ±180° 时转向侧翻转（表现为"先向一边滚、又翻到另一边"）；
     * |az|<90° 短侧明确，直接跟随 */
    turnSignFor(az) {
      const s = Math.sign(az) || 1;
      if (Math.abs(az) > Math.PI / 2) {
        if (!this._turnSign) this._turnSign = s;
        return this._turnSign;
      }
      this._turnSign = s;
      return s;
    }
    _cmd() { return { pitch: 0, roll: 0 }; }
  }

  /* 1) 最大G定常盘旋：压 ~80° 坡度持续满拉 */
  class SteadyTurn extends Tactic {
    constructor(rng) {
      super(rng);
      this.dir = this.rng() < 0.5 ? 1 : -1;   // 盘旋方向
      this.bankTarget = this.dir * 80 * Math.PI / 180;
    }
    _cmd(eng) {
      return { pitch: 1, roll: bankController(eng, this.bankTarget) };
    }
  }

  /* 2) 置尾：最大过载对正【导弹速度矢量】方向飞行，把导弹压到尾后 ——
   * 将迎头/侧向的高能遭遇强制转换为尾追低能几何（导弹必须追着跑、能量快速耗尽）。 */
  class ForceTail extends Tactic {
    _cmd(eng) {
      const a = P.attitudeAngles(eng.aircraft.quat);
      /* 目标航向 = 导弹速度矢量的水平投影 */
      const mv = eng.missile.vel;
      let dir = new THREE.Vector3(mv.x, 0, mv.z);
      if (dir.lengthSq() < 1e-4) {
        /* 导弹近乎垂直下落等退化情形：改为背离导弹平飞（同样置尾） */
        const rel = eng.missile.pos.clone().sub(eng.aircraft.pos);
        dir.set(-rel.x, 0, -rel.z);
      }
      dir.normalize();
      const fwdH = new THREE.Vector3(a.fwd.x, 0, a.fwd.z);
      if (fwdH.lengthSq() < 1e-8) return { pitch: 1, roll: 0 };  // 俯冲正下方退化
      fwdH.normalize();
      const rightH = new THREE.Vector3().crossVectors(fwdH, UP);
      const az = Math.atan2(dir.dot(rightH), dir.dot(fwdH));
      /* 压坡度对正目标航向 + 转向 */
      const bankTarget = clamp(this.turnSignFor(az) * Math.abs(az) * 1.3,
        -85 * Math.PI / 180, 85 * Math.PI / 180);
      /* 未对正时最大过载转向；已对正（|az|<15°）改小过载防止拉飘偏航 */
      const pitch = Math.abs(az) > 0.26 ? 1 : 0.3;
      return { pitch, roll: bankController(eng, bankTarget) };
    }
  }

  /* 3) 置尾平飞：只在水平面内转向对正【导弹速度矢量】水平方向，全程保持平飞 ——
   * 与置尾相同的几何目的，但用 90° 坡度纯水平转弯（此时拉杆只产生水平角速度，
   * 机头严格保持水平 = 定高），坡度未到位前不拉杆，避免高度起伏。 */
  class ForceTailLevel extends Tactic {
    _cmd(eng) {
      const a = P.attitudeAngles(eng.aircraft.quat);
      const mv = eng.missile.vel;
      let dir = new THREE.Vector3(mv.x, 0, mv.z);
      if (dir.lengthSq() < 1e-4) {
        /* 导弹近乎垂直下落等退化情形：改为背离导弹平飞（同样置尾） */
        const rel = eng.missile.pos.clone().sub(eng.aircraft.pos);
        dir.set(-rel.x, 0, -rel.z);
      }
      dir.normalize();
      const fwdH = new THREE.Vector3(a.fwd.x, 0, a.fwd.z);
      if (fwdH.lengthSq() < 1e-8) return { pitch: 1, roll: 0 };
      fwdH.normalize();
      const rightH = new THREE.Vector3().crossVectors(fwdH, UP);
      const az = Math.atan2(dir.dot(rightH), dir.dot(fwdH));

      const TH = 5 * Math.PI / 180;
      if (Math.abs(az) <= TH) {
        /* 已对正：改平机翼保持平飞 */
        return { pitch: 0, roll: bankController(eng, 0) };
      }
      /* 纯水平转弯：压 90° 坡度（正对短转一侧），坡度到位（±15°）才拉杆 */
      const bankTarget = this.turnSignFor(az) * Math.PI / 2;
      const bankErr = Math.abs(P.angDiff(bankTarget, a.bank));
      return { pitch: bankErr < 0.26 ? 1 : 0, roll: bankController(eng, bankTarget) };
    }
  }

  /* 4) DEZ 动能规避（Alkaher & Moshaiov, JGCD 2015）：
   * 待机段保持平飞直航，实时解算动态逃逸距离 R_DEZ；
   * 当 Rpe ≤ 1.25·R_DEZ（最晚脱离时机，含不确定性裕度）启动论文最优策略
   * —— tail-steering：最大过载把机尾对准弹目视线（σe→π，强制转尾追），
   * 清零后定高直飞，靠"能量耗尽型滑行导弹"的动能衰减脱离。 */
  class DezEscape extends Tactic {
    constructor(rng) { super(rng); this.phase = 0; }   // 0 待机 / 1 转向对正 / 2 直飞脱离
    _cmd(eng) {
      const ms = eng.missile;
      const ac = eng.aircraft;
      const a = P.attitudeAngles(ac.quat);
      const Rpe = ms.pos.distanceTo(ac.pos);

      if (this.phase === 0) {
        const dez = WT.dez.computeRdez(ms, ac, eng.cfg.missile,
          eng.cfg.aircraft.nMaxPos);
        this.lastRdez = dez.rDez;
        if (Rpe <= dez.rDez * WT.dez.MARGIN) this.phase = 1;   // 最晚脱离时机
        return { pitch: 0, roll: bankController(eng, 0) };     // 自由飞行段
      }

      /* tail-steering：目标航向 = 背离导弹的 LOS 方向（机尾对弹） */
      const dir = new THREE.Vector3(ac.pos.x - ms.pos.x, 0, ac.pos.z - ms.pos.z);
      if (dir.lengthSq() < 1e-6) dir.set(a.fwd.x, 0, a.fwd.z);
      dir.normalize();
      const fwdH = new THREE.Vector3(a.fwd.x, 0, a.fwd.z);
      if (fwdH.lengthSq() < 1e-8) return { pitch: 1, roll: 0 };
      fwdH.normalize();
      const rightH = new THREE.Vector3().crossVectors(fwdH, UP);
      const az = Math.atan2(dir.dot(rightH), dir.dot(fwdH));

      if (Math.abs(az) < 0.09) {
        this.phase = 2;
        /* 转向完成：未达最大表速 → 略微下高（γ≈−3°）冲刺加速，达标后平飞 */
        const gamQ = Math.asin(Math.max(-1, Math.min(1, a.fwd.y)));
        const easMaxQ = ((ac.p && ac.p.maxEasKmh) || 1550) / 3.6;
        const atmQ = P.atmosphere(ac.pos.y);
        const easQ = ac.V * Math.sqrt(Math.max(atmQ.rho / 1.225, 1e-6));
        const gamTQ = easQ < easMaxQ * 0.995 ? -0.055 : 0;
        return {
          pitch: Math.max(-0.5, Math.min(0.5, (gamTQ - gamQ) * 4)),
          roll: bankController(eng, 0),
          sep: 1
        };
      }
      if (this.phase === 2) this.phase = 1;                   // 目标又偏了，重新对正
      /* 纯水平转弯对正（90° 坡度下拉杆只产生水平角速度，机头保持水平）：
       * 避免旧操纵律"坡度小 + 满拉"把转向变成向高空的火箭式爬升 */
      const bankTarget = this.turnSignFor(az) * Math.PI / 2;
      const bankErr = Math.abs(P.angDiff(bankTarget, a.bank));
      return { pitch: bankErr < 0.26 ? 1 : 0, roll: bankController(eng, bankTarget) };
    }
  }

  /* 5) 垂直导弹速度矢量规避：转向与来袭弹速度矢量【垂直】的方向 ——
   * 弹目相对速度取得最大横向分量，迫使导弹以最大需用过载转弯（能量快速耗尽、脱靶量增大）；
   * 两个垂直方向取转向较近侧并一次锁定，90° 坡度纯水平转弯对正（同置尾平飞的操纵律）。 */
  class PerpEvade extends Tactic {
    _cmd(eng) {
      const a = P.attitudeAngles(eng.aircraft.quat);
      const mv = eng.missile.vel;
      let dir = new THREE.Vector3(mv.x, 0, mv.z);
      if (dir.lengthSq() < 1e-4) {
        /* 退化情形（导弹近乎垂直下落）：以弹目连线方向替代 */
        dir.copy(eng.missile.pos).sub(eng.aircraft.pos).setY(0).negate();
        if (dir.lengthSq() < 1e-4) dir.set(0, 0, -1);
      }
      dir.normalize();
      const perpA = new THREE.Vector3(-dir.z, 0, dir.x);
      const perpB = new THREE.Vector3(dir.z, 0, -dir.x);
      const fwdH = new THREE.Vector3(a.fwd.x, 0, a.fwd.z);
      if (fwdH.lengthSq() < 1e-8) return { pitch: 1, roll: 0 };
      fwdH.normalize();
      const rightH = new THREE.Vector3().crossVectors(fwdH, UP);
      const azA = Math.atan2(perpA.dot(rightH), perpA.dot(fwdH));
      const azB = Math.atan2(perpB.dot(rightH), perpB.dot(fwdH));
      if (!this._side) this._side = Math.abs(azA) <= Math.abs(azB) ? 1 : 2;
      const az = this._side === 1 ? azA : azB;
      if (Math.abs(az) < 0.12) return { pitch: 0, roll: bankController(eng, 0) };  // 已垂直：平飞保持
      const bankTarget = this.turnSignFor(az) * Math.PI / 2;
      const bankErr = Math.abs(P.angDiff(bankTarget, a.bank));
      return { pitch: bankErr < 0.26 ? 1 : 0, roll: bankController(eng, bankTarget) };
    }
  }

  const FACTORY = {
    steadyTurn: (rng) => new SteadyTurn(rng),
    tail: (rng) => new ForceTail(rng),
    tailLevel: (rng) => new ForceTailLevel(rng),
    dez: (rng) => new DezEscape(rng),
    perp: (rng) => new PerpEvade(rng)
  };

  WT.tactics = {
    create(id, rng) {
      const f = FACTORY[id];
      return f ? f(rng) : null;    // manual → null
    },
    missileBearing, missileElevation
  };
})(window.WT);
