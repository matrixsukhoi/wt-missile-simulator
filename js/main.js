/* ============================================================
 * main.js — 引导、键盘输入与主循环
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';
  const P = WT.phys;
  const FIXED_DT = 1 / 120;

  const state = {
    eng: null, cfg: null, tactic: null, tacticName: '手动驾驶',
    paused: false, warp: 1, acc: 0,
    keys: {}, cmd: { pitch: 0, roll: 0 },
    sampleAcc: 0, seed: 1, ended: false
  };

  const clamp = P.clamp;

  /* ---------- 手动驾驶输入（与自动战术同构的指令） ---------- */
  function manualCmd(dt) {
    const tPitch = (state.keys.pull ? 1 : 0) + (state.keys.push ? -1 : 0);
    const tRoll = (state.keys.rright ? 1 : 0) + (state.keys.rleft ? -1 : 0);
    const rate = 5;   // 杆量平滑
    state.cmd.pitch += clamp(tPitch - state.cmd.pitch, -rate * dt, rate * dt);
    state.cmd.roll += clamp(tRoll - state.cmd.roll, -rate * dt, rate * dt);
    state.cmd.sep = (state.keys.thrUp ? 1 : 0) + (state.keys.thrDn ? -1 : 0);  // SHIFT/CTRL 油门
    return state.cmd;
  }

  /* ---------- 发射 / 重开 ---------- */
  function launch() {
    const cfg = WT.ui.collectCfg();
    state.cfg = cfg;
    state.playerShots = [];
    WT.view.reset();
    state.eng = new P.Engagement(cfg);
    const tid = WT.ui.tacticId();
    state.tacticName = WT.ui.tacticName();
    state.tactic = tid === 'manual'
      ? null
      : WT.tactics.create(tid, P.mulberry32((state.seed++ * 7919 + 13) >>> 0));
    state.paused = false;
    state.acc = 0;
    state.ended = false;
    state.cmd = { pitch: 0, roll: 0 };
    WT.ui.hideBanner();
    WT.ui._mInfo = null;   // 清除上一局的 NEZ/DEZ 缓存（防跨局陈旧值）
    WT.ui.setPauseLabel(false);
    WT.ui.updateHUD(state.eng);
  }

  /* ---------- 交战结束 ---------- */
  function onEngagementEnd(eng) {
    const res = eng.result;
    const sc = state.cfg.scenario;
    WT.ui.addRecord({
      tactic: state.tacticName,
      missile: state.cfg.missile.name +
        (state.cfg.scenario.salvoN > 1 ? ' ×' + state.cfg.scenario.salvoN : ''),
      aspect: sc.aspectDeg, dist: sc.launchDistM,
      label: res.label, hit: res.hit,
      missDist: res.missDist, t: res.t, peakG: res.peakG
    });
    if (res.hit) WT.view.spawnExplosion(eng.missile.pos.clone());
    else if (eng.minRangePos) WT.view.spawnCpaMarker(eng.minRangePos);
    WT.ui.showBanner(res, state.tacticName);
  }

  /* ---------- 批量打靶（战术对比测试） ---------- */
  function onBatch() {
    const tid = WT.ui.tacticId();
    if (tid === 'manual') {
      WT.ui.toast('批量测试请先选择一种自动规避战术');
      return;
    }
    const cfg = WT.ui.collectCfg();
    const n = WT.ui.batchN();
    const tName = WT.ui.tacticName();
    WT.ui.setBatchContext(cfg.missile.name, cfg.scenario.aspectDeg, cfg.scenario.launchDistM);
    const results = P.runBatch(
      cfg, (rng) => WT.tactics.create(tid, rng), n, (Date.now() & 0xffffff) >>> 0);
    for (const r of results) {
      r.missile = cfg.missile.name;
      r.aspect = cfg.scenario.aspectDeg;
      r.dist = cfg.scenario.launchDistM;
    }
    WT.ui.showBatch(results, tName);
  }

  /* ---------- 键盘 ---------- */
  function bindKeys() {
    const map = {
      KeyS: 'pull', ArrowUp: 'pull',
      KeyW: 'push', ArrowDown: 'push',
      KeyA: 'rleft', ArrowLeft: 'rleft',
      KeyD: 'rright', ArrowRight: 'rright',
      ShiftLeft: 'thrUp', ShiftRight: 'thrUp',
      ControlLeft: 'thrDn', ControlRight: 'thrDn'
    };
    window.addEventListener('keydown', (e) => {
      if (WT.audio) WT.audio.resume();   // 用户手势解锁 AudioContext
      /* 焦点在输入控件时不拦截按键（保留表单编辑/按钮空格激活） */
      if (e.target && /^(INPUT|SELECT|TEXTAREA|BUTTON)$/.test(e.target.tagName)) return;
      if (map[e.code]) {
        state.keys[map[e.code]] = true;
        e.preventDefault();
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat && !state.paused) {
          if (state.mode === 'duel') {
            const d = state.duel;
            if (d && !d.done) {
              if (state.duelTarget === 'missile' && WT.ui.interceptAllowed()) {
                const th = d.primaryThreat();
                if (th && th.flying && WT.inFrontHemisphere(d.player, th)) {
                  d.fire('player', th);
                } else {
                  WT.ui.toast('无可拦截目标（需在前半球）');
                }
              } else if (!d.enemyDead && WT.inFrontHemisphere(d.player, d.enemy)) {
                d.fire('player');
              } else if (!d.enemyDead) {
                WT.ui.toast('目标不在前半球（机头前方），无法发射');
              }
            }
          } else {
            fireCounter();
          }
        }
      }
      if (e.code === 'KeyF' && !e.repeat && state.mode === 'duel') {
        if (!WT.ui.interceptAllowed()) {
          WT.ui.toast('需勾选【允许拦截对方导弹】才能切换目标');
        } else {
          state.duelTarget = state.duelTarget === 'missile' ? 'aircraft' : 'missile';
          WT.ui.toast('锁定目标：' +
            (state.duelTarget === 'missile' ? '最近导弹' : '敌机'));
        }
      }
      if (e.code === 'KeyR' && !e.repeat) {
        if (state.mode === 'duel') startDuel();
        else launch();
      }
      if (e.code === 'KeyP' && !e.repeat) togglePause();
      if (e.code === 'KeyC' && !e.repeat) {
        WT.ui.setCamLabel(WT.view.cycleCamera());
      }
    });
    window.addEventListener('keyup', (e) => {
      if (map[e.code]) {
        state.keys[map[e.code]] = false;
        e.preventDefault();
      }
    });
  }

  function togglePause() {
    state.paused = !state.paused;
    WT.ui.setPauseLabel(state.paused);
  }

  /* ---------- 主循环 ---------- */
  let last = performance.now();
  /* 音效驱动：发动机随速 + RWR 告警音（≤19km 雷达弹，越近越急） */
  function audioFrame(dt) {
    if (!WT.audio) return;
    const ac = (state.mode === 'duel' && state.duel)
      ? state.duel.player : (state.eng && state.eng.aircraft);
    WT.audio.setEngine(ac ? Math.min(1, ac.V / 700) : 0);
    let lvl = 0;
    if (state.mode === 'duel' && state.duel) {
      const th = state.duel.primaryThreat && state.duel.primaryThreat();
      if (th && th.flying && !WT.ui.isIrMissile(th.p)) {
        const r = th.pos.distanceTo(state.duel.player.pos);
        if (r <= WT.CONST.RWR_WARN_RANGE) lvl = 1 - r / WT.CONST.RWR_WARN_RANGE;
      }
    } else if (state.eng && state.eng.missile && state.eng.missile.flying && !state.eng.done) {
      const ms = state.eng.missile;
      if (!WT.ui.isIrMissile(ms.p)) {
        const r = ms.pos.distanceTo(state.eng.aircraft.pos);
        if (r <= WT.CONST.RWR_WARN_RANGE) lvl = 1 - r / WT.CONST.RWR_WARN_RANGE;
      }
    }
    WT.audio.tick(dt, lvl);
  }

  function frame(now) {
    requestAnimationFrame(frame);
    audioFrame(1 / 60);
    const realDt = Math.min((now - last) / 1000, 0.05);
    last = now;
    if (state.mode === 'duel') { duelFrame(realDt); return; }
    const eng = state.eng;
    if (!eng) return;

    if (!state.paused && !eng.done) {
      state.acc += realDt * state.warp;
      let guard = 0;
      while (state.acc >= FIXED_DT && !eng.done && guard++ < 4000) {
        const cmd = state.tactic
          ? state.tactic.update(eng, FIXED_DT)
          : manualCmd(FIXED_DT);
        if (state.tactic) {
          /* 自动战术管杆量、飞行员管油门：SHIFT/CTRL 始终生效（不按=战术默认全油门） */
          const thrKey = (state.keys.thrUp ? 1 : 0) + (state.keys.thrDn ? -1 : 0);
          cmd.sep = thrKey || 1;
        }
        eng.step(FIXED_DT, cmd);
        state.acc -= FIXED_DT;
      }
    }
    if (eng.done && !state.ended) {
      state.ended = true;
      onEngagementEnd(eng);
    }
    stepShots(eng, realDt);

    state.sampleAcc += realDt;
    if (state.sampleAcc >= 0.1) {
      state.sampleAcc = 0;
      WT.ui.updateHUD(eng);
    }
    const viewEng = state.playerShots.length
      ? Object.assign(Object.create(eng), {
          missiles: eng.missiles.concat(state.playerShots.filter((m) => m.flying))
        })
      : eng;
    WT.view.update(viewEng, realDt);
    WT.ui.updateMissileBox(eng, WT.view);
  }

  /* ---------- 单向模式拦截弹（空格：锁定最近来袭导弹） ---------- */
  function fireCounter() {
    const eng = state.eng;
    if (!eng || eng.done || state.paused) return;
    if ((state.shotCooldown || 0) > 0) return;
    if (!WT.ui.interceptAllowed()) {
      WT.ui.toast('未勾选【允许拦截对方导弹】，无法拦截');
      return;
    }
    const threat = eng.missile;
    if (!threat || !threat.flying) return;
    if (!WT.inFrontHemisphere(eng.aircraft, threat)) {
      WT.ui.toast('目标不在前半球（机头前方），无法发射');
      return;
    }
    let flying = 0;
    for (const m of state.playerShots) if (m.flying) flying++;
    if (flying >= 4) return;
    const shot = WT.spawnShot(eng.aircraft, threat, WT.ui.myMissileParams());
    shot.side = 'player';
    shot.isInterceptor = true;
    shot.lockTarget = threat;   // 被锁定的【来袭导弹】（引导线连线它，不是我机）
    state.playerShots.push(shot);
    state.shotCooldown = 0.4;
  }

  function stepShots(eng, dt) {
    state.shotCooldown = Math.max(0, (state.shotCooldown || 0) - dt);
    if (eng.done || state.paused) return;   // 结束/暂停后不再拦截、不弹提示
    for (const m of state.playerShots) {
      if (!m.flying) continue;
      const threat = eng.missile;
      const st = WT.stepShot(m, threat && threat.flying ? threat : null, dt,
        state.cfg.scenario.engine);
      if (st === 'hit' && threat && threat.flying) {
        threat.flying = false;
        threat.endReason = 'intercepted';
        WT.ui.toast('拦截成功！来袭导弹被击毁');
      }
    }
    if (state.playerShots.length > 24) {
      state.playerShots = state.playerShots.filter((m) => m.flying);
    }
  }

  /* ---------- 对抗模式 ---------- */
  function startDuel() {
    state.duel = new WT.DuelSim(WT.ui.collectDuelCfg());
    state.duelShown = false;
    state.duelTarget = 'aircraft';   // F 键切换目标：aircraft | missile
    state.paused = false;
    WT.ui.setPauseLabel(false);
    WT.ui.hideBanner();
    WT.view.reset();
  }

  function duelFrame(realDt) {
    const duel = state.duel;
    if (!duel) return;
    const simDt = realDt * state.warp;   // 时间加速对对抗模式同样生效
    if (!state.paused && !duel.done) {
      const steps = Math.max(1, Math.min(8, Math.round(simDt / FIXED_DT)));
      const dt = simDt / steps;
      for (let i = 0; i < steps; i++) duel.step(dt, manualCmd(dt));
    }
    WT.view.update({
      aircraft: duel.player,
      missiles: duel.missiles,
      missile: duel.primaryThreat(),
      enemy: duel.enemy,
      enemyDead: duel.enemyDead,
      playerDead: duel.playerDead,
      done: duel.done
    }, realDt);
    WT.ui.updateDuelHUD(duel);
    WT.ui.updateEnemyBox(duel, WT.view);
    WT.ui.drawRWRDuel(duel);
    /* 右上角：最近威胁导弹的过载-马赫曲线（无威胁时清空） */
    const threatNow = duel.primaryThreat();
    WT.ui.drawNCurve(threatNow && threatNow.flying
      ? {
          done: false,
          missile: threatNow,
          cfg: { missile: threatNow.p, aircraft: duel.cfg.aircraft }
        }
      : { done: true, missile: null });
    if (duel.done && !state.duelShown) {
      state.duelShown = true;
      WT.view.spawnExplosion(
        duel.result.kind === 'win' ? duel.enemy.pos : duel.player.pos);
      WT.ui.showBanner(
        duel.result.label +
          `（命中 ${duel.stats.playerScored} · 被命中 ${duel.stats.playerTaken}）`,
        duel.result.kind === 'win' ? 'win' : 'lose');
    }
  }

  /* ---------- 启动 ---------- */
  window.addEventListener('load', () => {
    WT.view = new WT.SimView(document.getElementById('app'));
    WT.ui.init({
      onLaunch: () => { if (state.mode === 'duel') startDuel(); else launch(); },
      onPause: togglePause,
      onCam: () => WT.ui.setCamLabel(WT.view.cycleCamera()),
      onWarp: (v, btn) => {
        state.warp = v;
        for (const b of document.querySelectorAll('[data-warp]')) {
          b.classList.toggle('active', b === btn);
        }
      },
      onBatch,
      onModeChange: (v) => {
        if (v === 'duel' && !WT.DuelSim) {
          WT.ui.showBanner('对抗模式组件未加载，请 Ctrl+F5 强制刷新', 'lose');
          return;
        }
        state.mode = v;
        WT.ui.applyMode(v);
        try {
          if (v === 'duel') startDuel();
          else launch();
        } catch (err) {
          console.error(err);
          WT.ui.showBanner('模式切换失败: ' + err.message, 'lose');
          state.mode = 'single';
          document.getElementById('selMode').value = 'single';
          WT.ui.applyMode('single');
        }
      }
    });
    WT.ui.setCamLabel('free');   // 默认自由视角
    bindKeys();
    launch();
    requestAnimationFrame(frame);
  });
})(window.WT);
