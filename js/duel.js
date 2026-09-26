/* ============================================================
 * duel.js — 对抗模式：双机 + 双方导弹 + AI 战术 + 命中计数
 *  - 玩家机：手动驾驶（键鼠）或沿用面板飞机参数
 *  - 敌机：主动策略（直飞 / 朝向玩家）+ 规避策略（复用 tactics 库）
 *  - 双方可选无敌（默认关），命中/被命中实时计数
 *  - 导弹为带 side 标记的 Missile/AeroMissile，各自攻击对方飞机
 * ============================================================ */
(function (WT) {
  'use strict';
  const P = WT.phys;
  const V3 = THREE.Vector3;
  const clamp = P.clamp;

  class DuelSim {
    /* cfg = {
     *   aircraft: 飞机参数（双方通用）, engine: 'dynamic'|'const',
     *   playerMissile / enemyMissile: 导弹参数（含 model/loft/timeOutS 等）,
     *   playerInvincible / enemyInvincible: bool,
     *   enemy: { fireInterval, offense: 'straight'|'toward', evasion: ''|战术id },
     *   startDist: 初始距离 m
     * } */
    constructor(cfg) {
      this.cfg = cfg;
      this.t = 0;
      this.done = false;
      this.result = null;
      this.missiles = [];
      this._ringIdx = 0;   // 导弹池环形复用游标（满 1024 覆盖最旧槽位）
      this.stats = {
        playerScored: 0, playerTaken: 0,   // 我方命中 / 被命中
        enemyScored: 0, enemyTaken: 0
      };
      this.playerDead = false;
      this.enemyDead = false;

      /* 几何：玩家 (0,alt,0) 朝 -Z；敌机 (0,alt,-dist) 朝 +Z（对头） */
      this.player = new P.Aircraft(cfg.aircraft, new V3(0, cfg.targetAltM || 5000, 0));
      this.enemy = new P.Aircraft(
        Object.assign({}, cfg.aircraft, {
          mach: cfg.enemyMach != null ? cfg.enemyMach : cfg.aircraft.mach   // 敌方初速 Ma
        }),
        new V3(0, cfg.enemyAltM != null ? cfg.enemyAltM : (cfg.targetAltM || 5000),
          -(cfg.startDist || 15000)));   // 敌机高度可独立配置（nmEnemyAlt）
      this.enemy.quat.setFromAxisAngle(new V3(0, 1, 0), Math.PI);

      this.playerCooldown = 0;
      this.enemyCooldown = Math.min(2, (cfg.enemy && cfg.enemy.fireInterval) || 8);
      this.interceptCount = 0;   // 拦截对方导弹计数
      /* 敌机恢复状态机：normal(规避/主动) → climb(安全后上高) → recover(主动策略) */
      this.enemyPhase = 'normal';
      this._wasEvading = false;
      this._preFwd = new V3(0, 0, 1);
      this._escapeAlt = cfg.targetAltM || 5000;
      this._enemyTurnSign = 0;

      /* 敌方规避策略：复用 tactics 库（以适配器喂 eng 接口） */
      this.evasion = null;
      if (cfg.enemy && cfg.enemy.evasion && WT.tactics) {
        this.evasion = WT.tactics.create(cfg.enemy.evasion,
          P.mulberry32((Math.random() * 0xffffff) >>> 0));
      }
      const self = this;
      this._threat = null;
      this._adapter = {
        aircraft: this.enemy,
        get missile() {
          return self._threat || {
            flying: false, guidanceOn: false,
            pos: self.enemy.pos, vel: self.enemy.vel, mass: 1, p: {}
          };
        },
        cfg: {
          missile: cfg.playerMissile || {},
          aircraft: cfg.aircraft
        },
        done: false
      };
    }

    /* 最近的飞行中导弹（side 侧面临的威胁 = 对方打来的弹） */
    _nearestThreat(side) {
      let best = null, bd = Infinity;
      for (const m of this.missiles) {
        if (!m.flying || m.side === side) continue;
        const d = m.pos.distanceTo(side === 'enemy' ? this.enemy.pos : this.player.pos);
        if (d < bd) { bd = d; best = m; }
      }
      return best;
    }

    /* 供视图/RWR 使用：对玩家威胁最大的弹（敌方弹优先取最近） */
    primaryThreat() {
      return this._nearestThreat('player');
    }

    /* 发射导弹：side='player'|'enemy'；target 可指定（拦截弹锁定对方导弹） */
    fire(side, target) {
      const src = side === 'player' ? this.player : this.enemy;
      const tgt = target || (side === 'player' ? this.enemy : this.player);
      if (this.done || (side === 'player' ? this.playerDead : this.enemyDead)) return null;
      if (side === 'player' && this.playerCooldown > 0) return null;
      let alive = 0;
      for (const m of this.missiles) if (m.flying) alive++;
      if (alive >= WT.CONST.MISSILE_POOL_CAP) return null;

      const params = side === 'player' ? this.cfg.playerMissile : this.cfg.enemyMissile;
      const m = spawnShot(src, tgt, params);   // 与拦截弹共用发射构造
      if (!m) return null;                     // 后半球等发射约束拦截
      m.side = side;
      m.lockTarget = tgt;   // 锁定目标（引导线连线用）
      if (target) { m.targetObj = target; m.targetIsMissile = true; }
      /* 导弹池环形复用：不回收数组；满员后覆盖最旧槽位（复用第一个） */
      if (this.missiles.length < WT.CONST.MISSILE_POOL_CAP) {
        this.missiles.push(m);
      } else {
        this.missiles[this._ringIdx] = m;
        this._ringIdx = (this._ringIdx + 1) % WT.CONST.MISSILE_POOL_CAP;
      }
      if (side === 'player') this.playerCooldown = 0.35;
      return m;
    }

    /* 敌机指令：规避优先；DEZ【显示安全】后立即"上高 → 主动策略"（不等导弹消失） */
    _enemyCmd(dt) {
      const threat = this._nearestThreat('enemy');
      this._threat = threat;

      /* DEZ 安全评估（5Hz 节流）：所有来袭弹都在 DEZ 安全带外（Rpe > 1.25·R_DEZ）
       * 才算安全 —— 与 HUD "安全区" 同义；无来袭弹 = 安全 */
      if (!this._safeT || this.t - this._safeT > 0.2) {
        this._safeT = this.t;
        this._allSafe = true;
        this._allLowE = true;
        const g0 = P.G0 || 9.81;
        const eOwn = 0.5 * this.enemy.V * this.enemy.V + g0 * this.enemy.pos.y;
        for (const m of this.missiles) {
          if (!m.flying || m.side !== 'player') continue;
          const rpe = m.pos.distanceTo(this.enemy.pos);
          let safe;
          if (WT.dez) {
            const d = WT.dez.computeRdez(m, this.enemy,
              m.p || this.cfg.playerMissile || {}, this.cfg.aircraft.nMaxPos);
            safe = rpe > d.rDez * 1.25;
          } else {
            safe = rpe > 5000;
          }
          if (!safe) { this._allSafe = false; }
          /* 比能量 e = V²/2 + g·h：导弹能量 ≥ 自身 → 不反击，继续维持 DEZ */
          const vm = m.vel.length();
          const eM = 0.5 * vm * vm + g0 * m.pos.y;
          if (eM >= eOwn) this._allLowE = false;
        }
      }

      /* 决策规则（用户规则）：有【最近导弹】且能量未被拖垮 → 对其规避；
       * 最近导弹为空（或已被拖到低能量）→ 恢复执行主动策略（经上高+回头过渡） */
      const mustEvade = threat && this.evasion && !this._allLowE;
      if (mustEvade) {
        if (!this._wasEvading) {
          this._wasEvading = true;
          const a0 = P.attitudeAngles(this.enemy.quat);
          this._preFwd = new V3(a0.fwd.x, 0, a0.fwd.z).normalize();  // 记录先前航向
          this._escapeAlt = this.enemy.pos.y;
          this.enemyPhase = 'normal';   // 新一轮规避：重置恢复段
          this._azHold = false;
          this._enemyTurnSign = 0;
        }
        if (threat.p) this._adapter.cfg.missile = threat.p;
        return this.evasion.update(this._adapter, dt);
      }

      /* 规避结束（最近导弹为空 / 能量被拖垮）→ 一次性过渡：上高 + 最大过载回头 */
      if (this.enemyPhase === 'normal' && this._wasEvading) {
        this.enemyPhase = 'climb';
        this._azHold = false;
        this._enemyTurnSign = 0;
        this._climbT = this.t;
        this._wasEvading = false;
      }

      /* 恢复段 1（序贯）：先平翼上高（+2km），再最大过载回头 —— 回头指向
       * 【主动策略的目标方向】：朝向玩家→指向玩家 / 直飞→回先前航向 */
      if (this.enemyPhase === 'climb') {
        const a = P.attitudeAngles(this.enemy.quat);
        const fwdH = new V3(a.fwd.x, 0, a.fwd.z);
        if (fwdH.lengthSq() < 1e-8) fwdH.set(0, 0, -1); else fwdH.normalize();
        const rightH = new V3().crossVectors(fwdH, new V3(0, 1, 0));
        const to = this.cfg.enemy.offense === 'straight'
          ? this._preFwd.clone()
          : this._offenseDir();
        const az = Math.atan2(to.dot(rightH), to.dot(fwdH));
        const climbed = this.enemy.pos.y >= this._escapeAlt + 1800;
        /* 过渡限时 30s：到点无论如何转入主动策略（剩余对正由主动策略收尾） */
        if ((climbed && Math.abs(az) < 0.17) || this.t - (this._climbT || 0) > 30) {
          this.enemyPhase = 'recover';
        } else if (!climbed) {
          /* 阶段 A：平翼爬升到目标高度（γ 目标随剩余高度渐缩，平滑改出） */
          const gamX = Math.asin(clamp(a.fwd.y, -1, 1));
          const gamTX = clamp((this._escapeAlt + 2000 - this.enemy.pos.y) / 1200, 0, 1) * 0.3;
          return {
            pitch: clamp((gamTX - gamX) * 4, -0.5, 0.5),
            roll: clamp(P.angDiff(0, a.bank) * 1.5, -1, 1),
            sep: 1
          };
        } else {
          /* 阶段 B：最大过载回头（水平转向）；γ 偏高先平翼压回（防拉杆变爬升） */
          if (!this._enemyTurnSign || Math.abs(az) < 0.35) {
            this._enemyTurnSign = Math.sign(az) || 1;
          }
          const err = P.angDiff(this._enemyTurnSign * Math.PI / 2, a.bank);
          const rollCmd = clamp(err * 1.5, -1, 1);
          const gam = Math.asin(clamp(a.fwd.y, -1, 1));
          if (gam > 0.08) {
            const bErr = P.angDiff(0, a.bank);
            if (Math.abs(bErr) > 0.12) {
              return { pitch: 0, roll: clamp(bErr * 1.5, -1, 1), sep: 1 };
            }
            return {
              pitch: clamp(-gam * 4, -0.5, 0.5),
              roll: clamp(bErr * 1.5, -1, 1),
              sep: 1
            };
          }
          return { pitch: Math.abs(err) < 0.26 ? 1 : 0, roll: rollCmd, sep: 1 };
        }
      }
      /* 恢复段 2：主动策略（toward=转向玩家 / straight=回头先前航向平飞） */
      if (this.enemyPhase === 'recover') {
        const to = this.cfg.enemy.offense === 'straight'
          ? this._preFwd.clone()
          : this._offenseDir();
        return this._steerCmd(to);
      }

      /* 常态：主动策略（注意：绝不能在此清 _wasEvading ——
       * 否则"规避结束→回头过渡"的入场券被销毁，长期对抗后就永远不回头） */
      const off = this.cfg.enemy && this.cfg.enemy.offense;
      if (off === 'toward') return this._towardCmd();
      if (off === 'keepDist' || off === 'keepDist10') return this._steerCmd(this._offenseDir());
      return { pitch: 0, roll: 0, sep: 1 };
    }

    /* 平飞保持：航迹角 γ 收敛到 0（注意：本模型 pitch=0 是"姿态不变"，
     * 不等于平飞——会把爬升段的抬头姿态原封不动带上去，必须做 γ 伺服） */
    _levelCmd() {
      const a = P.attitudeAngles(this.enemy.quat);
      const gam = Math.asin(clamp(a.fwd.y, -1, 1));
      return { pitch: clamp(-gam * 4, -0.5, 0.5), roll: 0, sep: 1 };
    }

    /* 主动策略方向：toward→直指玩家；keepDist→【转向敌机但保持距离】——
     * 机头偏角 θ 随间距误差连续变化：过远 θ 小（直指逼近）；恰 15km θ=90°
     * （切向环绕守距）；过近 θ>90°（拉开远离，越近越偏）。环绕侧向一次锁定防抖 */
    _offenseDir() {
      const to = new V3().subVectors(this.player.pos, this.enemy.pos);
      const off = this.cfg.enemy && this.cfg.enemy.offense;
      if (off === 'keepDist' || off === 'keepDist10') {
        const distT = off === 'keepDist10' ? 10000 : 15000;
        const R = Math.max(to.length(), 1);
        /* 期望径向速度 ∝ 间距误差（收敛到目标间距——敌机 NEZ 外界，
         * ±200m/s 限幅；增益 0.15 使"越近越远离"渐进） */
        const wantRdot = clamp((distT - R) * 0.15, -200, 200);
        const cosT = clamp(-wantRdot / Math.max(this.enemy.V, 80), -1, 1);
        const theta = Math.acos(cosT);   // 0=直指敌机，π=正后方
        const a = P.attitudeAngles(this.enemy.quat);
        const fwdH = new V3(a.fwd.x, 0, a.fwd.z);
        if (fwdH.lengthSq() < 1e-8) fwdH.set(0, 0, -1); else fwdH.normalize();
        const rightH = new V3().crossVectors(fwdH, new V3(0, 1, 0));
        const az = Math.atan2(to.dot(rightH), to.dot(fwdH));
        if (!this._kdSide) this._kdSide = az >= 0 ? 1 : -1;
        const dir = to.clone().normalize();
        const phi = this._kdSide * theta;
        const c = Math.cos(phi), s = Math.sin(phi);
        return new V3(dir.x * c - dir.z * s, 0, dir.x * s + dir.z * c);
      }
      return to;
    }

    /* 朝向玩家（转向前方目标方向） */
    _towardCmd() {
      return this._steerCmd(new V3().subVectors(this.player.pos, this.enemy.pos));
    }

    /* 90° 坡度水平转弯对正目标方向后平飞（含反转段转向侧锁定） */
    _steerCmd(to) {
      const a = P.attitudeAngles(this.enemy.quat);
      const fwdH = new V3(a.fwd.x, 0, a.fwd.z);
      if (fwdH.lengthSq() < 1e-8) return { pitch: 0, roll: 0, sep: 1 };
      fwdH.normalize();
      const rightH = new V3().crossVectors(fwdH, new V3(0, 1, 0));
      const az = Math.atan2(to.dot(rightH), to.dot(fwdH));
      /* 本模型约定：平飞需 γ 伺服（pitch=0 仅姿态不变） */
      if (Math.abs(az) < 0.12 || (this._azHold && Math.abs(az) < 0.22)) {
        this._azHold = true;
        this._enemyTurnSign = 0;   // 对正完成，转向侧解锁
        return this._levelCmd();
      }
      this._azHold = false;
      /* 反转段转向侧锁定（防穿越 ±180° 翻转） */
      if (!this._enemyTurnSign) this._enemyTurnSign = Math.sign(az) || 1;
      const bankTarget = this._enemyTurnSign * Math.PI / 2;
      const err = P.angDiff(bankTarget, a.bank);
      const rollCmd = clamp(err * 1.5, -1, 1);
      const gam = Math.asin(clamp(a.fwd.y, -1, 1));
      if (Math.abs(gam) > 0.25) {
        /* γ 超限：先回平机翼再压回（带坡度推杆=反向偏航，必须平翼后推） */
        const bErr = P.angDiff(0, a.bank);
        if (Math.abs(bErr) > 0.12) {
          return { pitch: 0, roll: clamp(bErr * 1.5, -1, 1), sep: 1 };
        }
        return { pitch: clamp(-gam * 4, -0.5, 0.5), roll: clamp(bErr * 1.5, -1, 1), sep: 1 };
      }
      return {
        pitch: Math.abs(err) < 0.26 ? 1 : 0,
        roll: rollCmd,
        sep: 1
      };
    }

    step(dt, cmdPlayer) {
      if (this.done) return;
      this.t += dt;

      if (!this.playerDead) this.player.step(dt, cmdPlayer || { pitch: 0, roll: 0 });
      if (!this.enemyDead) this.enemy.step(dt, this._enemyCmd(dt));

      /* 飞机撞地结算 */
      if (!this.playerDead && this.player.pos.y <= 25) {
        this.playerDead = true;
        this._finish('lose', 'crash');
      } else if (!this.enemyDead && this.enemy.pos.y <= 25) {
        this.enemyDead = true;
        this._finish('win', 'crash');
      }

      /* 敌方按间隔发射 */
      this.playerCooldown = Math.max(0, this.playerCooldown - dt);
      if (!this.enemyDead) {
        this.enemyCooldown -= dt;
        if (this.enemyCooldown <= 0) {
          this.enemyCooldown = (this.cfg.enemy && this.cfg.enemy.fireInterval) || 8;
          if (!this.playerDead) this.fire('enemy');
        }
      }

      /* 导弹步进 + 命中判定（连续 CPA） + 生命周期 */
      for (const m of this.missiles) {
        if (!m.flying) continue;
        const target = m.targetObj || (m.side === 'player' ? this.enemy : this.player);
        const targetDead = m.targetObj ? !m.targetObj.flying
          : (m.side === 'player' ? this.enemyDead : this.playerDead);
        if (targetDead) { m.flying = false; continue; }

        m.step(dt, target, this.cfg.engine);

        const rel1 = new V3().subVectors(m.pos, target.pos);
        const minDistStep = P.segMinDist(m._prevRel, rel1);
        m._prevRel.copy(rel1);
        if (m.t > 0.2 && minDistStep < m.minRange) m.minRange = minDistStep;

        const fuseR = (m.p && m.p.fuseR) || 5;
        if (minDistStep <= fuseR) {
          m.flying = false;
          if (m.targetIsMissile) {
            target.flying = false;
            this.interceptCount++;              // 拦截对方导弹
          } else if (m.side === 'player') {
            this.stats.playerScored++; this.stats.enemyTaken++;
            if (!this.cfg.enemyInvincible) {
              this.enemyDead = true;
              this._finish('win');
            }
          } else {
            this.stats.enemyScored++; this.stats.playerTaken++;
            if (!this.cfg.playerInvincible) {
              this.playerDead = true;
              this._finish('lose');
            }
          }
          continue;
        }
        /* 生命周期 */
        const rdot = new V3().subVectors(target.vel, m.vel);
        const closing = -rel1.dot(rdot) / Math.max(rel1.length(), 1e-6);
        if (m.pos.y <= 5) m.flying = false;
        else if (m.t >= ((m.p && m.p.lifeS) || 60)) m.flying = false;
        else if (this.cfg.engine !== 'const' && m.vel.length() < 180) m.flying = false;
        else if (closing < -30 && rel1.length() > m.minRange + 400) m.flying = false;
      }
    }

    _finish(kind, cause) {
      if (this.done) return;   // 防同帧二次结算覆盖胜负（撞地+命中同帧等）
      this.done = true;
    if (WT.audio) WT.audio.explode();   // 命中/坠毁音效
      const label = cause === 'crash'
        ? (kind === 'win' ? '敌机撞地' : '我方撞地')
        : (kind === 'win' ? '敌机被击落' : '我方被击落');
      this.result = {
        kind, cause,
        t: this.t,
        label,
        scored: this.stats.playerScored,
        taken: this.stats.playerTaken
      };
    }
  }

  /* 前半球约束：目标须在发射机机头前方半球才能发射 */
  function inFrontHemisphere(launcher, target) {
    const fwd = new V3(0, 0, -1).applyQuaternion(launcher.quat);
    return new V3().subVectors(target.pos, launcher.pos).dot(fwd) > 0;
  }

  /* ---- 拦截弹（单向模式：我方导弹锁定最近来袭导弹）----
   * spawnShot：从发射机发射一枚锁定 target 的导弹（受前半球约束）
   * stepShot：步进 + 弹对弹判定（返回 'hit' | 'lost' | null） */
  function spawnShot(launcher, target, params) {
    if (!inFrontHemisphere(launcher, target)) return null;   // 后半球禁止发射
    const MClass = (params && params.model === 'aero' && WT.AeroMissile)
      ? WT.AeroMissile : P.Missile;
    const fwd = new V3(0, 0, -1).applyQuaternion(launcher.quat);
    const mp = launcher.pos.clone().addScaledVector(fwd, 5);
    const aim = target.pos.clone().sub(mp).normalize();
    const v0 = ((params && params.launchMach) || 1.2) * P.atmosphere(mp.y).a;
    /* 导弹初速 = 载机速度矢量（无论敌我）；发射后与载具完全无关，
     * 由发动机推力/制导独立演化（launchMach 仅作无载具速度时的兜底） */
    const m = new MClass(params || {}, {
      pos: mp,
      vel: launcher.vel && launcher.vel.lengthSq() > 1
        ? launcher.vel.clone()
        : aim.multiplyScalar(v0),
      range0: mp.distanceTo(target.pos)
    });
    m._prevRel = m.pos.clone().sub(target.pos);
    m.minRange = Infinity;
    m.lockTarget = target;   // 锁定目标（引导线连线它；拦截弹 = 被锁定的【导弹】）
    if (WT.audio) WT.audio.launch();   // 发射音效
    return m;
  }

  function stepShot(m, target, dt, engine) {
    if (!m.flying) return 'lost';
    if (!target || !target.flying) {
      if (m.t > 1) m.flying = false;
      return target ? null : 'lost';
    }
    m.step(dt, target, engine);
    const rel = new V3().subVectors(m.pos, target.pos);
    const minD = P.segMinDist(m._prevRel, rel);
    m._prevRel.copy(rel);
    if (m.t > 0.2 && minD < m.minRange) m.minRange = minD;
    /* 弹对弹近炸：引信半径 + 25m（对撞高交会裕度） */
    const fuse = ((target.p && target.p.fuseR) || 5) + 25;
    if (minD <= fuse) {
      m.flying = false;
      return 'hit';
    }
    if (m.pos.y <= 5 || m.t >= ((m.p && m.p.lifeS) || 60) ||
        (engine !== 'const' && m.vel.length() < 180)) {
      m.flying = false;
      return 'lost';
    }
    return null;
  }

  WT.spawnShot = spawnShot;
  WT.stepShot = stepShot;
  WT.inFrontHemisphere = inFrontHemisphere;
  WT.DuelSim = DuelSim;
})(window.WT = window.WT || {});
