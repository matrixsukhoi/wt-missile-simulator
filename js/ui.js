/* ============================================================
 * ui.js — 参数面板、HUD、RWR、战术测试记录与 CSV 导出
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';
  const $ = (id) => document.getElementById(id);

  const ui = {
    records: [],
    _handlers: {}
  };

  /* ---------- 滑条/数字联动 ---------- */
  function pair(slId, nmId) {
    const sl = $(slId), nm = $(nmId);
    sl.addEventListener('input', () => { nm.value = sl.value; });
    nm.addEventListener('input', () => { sl.value = nm.value; });
    return {
      get: () => {
        const v = parseFloat(nm.value);
        return isFinite(v) ? v : parseFloat(sl.value);   // 输入框清空时回退滑条值
      },
      set: (v) => { sl.value = v; nm.value = v; }
    };
  }

  let P_DIST, P_MALT, P_MACH, P_ASPECT, P_TALT, P_YAW;

  /* ---------- 来袭场景预设（一键装载整组参数） ---------- */
  const SCENARIOS = {
    bvr_far:      { preset: 'aim120d', dist: 50, malt: 10, talt: 10, mach: 1.6, aspect: 0, yaw: 0 },
    bvr_mid:      { preset: 'r77_1',   dist: 25, malt: 6,  talt: 6,  mach: 1.5, aspect: 0, yaw: 0 },
    wvr_head:     { preset: 'mica_em', dist: 10, malt: 3,  talt: 3,  mach: 1.2, aspect: 0, yaw: 0 },
    offaxis_same: { preset: 'pl12a',   dist: 10, malt: 3,  talt: 3,  mach: 1.0, aspect: 90, yaw: -60 },
    offaxis_opp:  { preset: 'pl12a',   dist: 10, malt: 3,  talt: 3,  mach: 1.0, aspect: 90, yaw: 60 },
    wvr_tail:     { preset: 'r27er',   dist: 8,  malt: 1,  talt: 1,  mach: 1.3, aspect: 180, yaw: 0 }
  };

  /* ---------- 预设 → 表单填充 ---------- */
  function fillMissileForm(preset) {
    $('nmMass').value = preset.mass0;
    $('nmCaliber').value = preset.caliber;
    $('nmCxK').value = preset.cxK;
    const s0 = preset.stages[0], s1 = preset.stages[1];
    $('nmBoostT').value = s0 ? s0.t : 0;
    $('nmBoostThrust').value = s0 ? s0.thrust : 0;
    $('nmBoostFuel').value = s0 ? s0.massLost : 0;
    $('nmSusT').value = s1 ? s1.t : 0;
    $('nmSusThrust').value = s1 ? s1.thrust : 0;
    $('nmSusFuel').value = s1 ? s1.massLost : 0;
    $('nmNmaxM').value = preset.nMaxG;
    $('nmPn').value = preset.pnGain;
    $('nmFuse').value = preset.fuseR;
    $('nmSeekRate').value = preset.seekerRateMaxDeg;
    $('nmLife').value = preset.lifeS;
    $('nmTimeOut').value = (preset.timeOutS != null ? preset.timeOutS : 0);
    $('chkLoft').checked = preset.loft;
    $('nmLoftAng').value = preset.loftAngleDeg;
    P_MACH.set(preset.launchMach);
  }

  function num(id) { return parseFloat($(id).value) || 0; }

  /* ---------- 组装仿真配置 ---------- */
  ui.collectCfg = function () {
    const preset = WT.MISSILE_PRESETS[$('selPreset').value] || WT.MISSILE_PRESETS.aim9l;
    const stages = [];
    if (num('nmBoostT') > 0) {
      stages.push({ t: num('nmBoostT'), thrust: num('nmBoostThrust'), massLost: num('nmBoostFuel') });
    }
    if (num('nmSusT') > 0) {
      stages.push({ t: num('nmSusT'), thrust: num('nmSusThrust'), massLost: num('nmSusFuel') });
    }
    if (!stages.length) stages.push({ t: 1, thrust: 1, massLost: 0 });

    /* 以预设为底、表单值覆盖 —— 保留 irSeeker/finMomentArmM 等未上表单的字段
     *（旧实现手工逐字段拷贝，静默丢字段 → aero 力臂回退 0.3 等隐性错误）；
     * 关键字段做钳位校验（mass0=0 等会产生 NaN 弹道） */
    const missile = Object.assign({}, preset, {
      mass0: Math.max(1, num('nmMass')),
      caliber: Math.max(0.01, num('nmCaliber')),
      cxK: num('nmCxK'),
      stages,
      nMaxG: Math.max(1, num('nmNmaxM')),
      pnGain: num('nmPn'),
      fuseR: num('nmFuse'),
      seekerRateMaxDeg: num('nmSeekRate'),
      lifeS: Math.max(1, num('nmLife')),
      timeOutS: num('nmTimeOut'),
      loft: $('chkLoft').checked,
      loftAngleDeg: num('nmLoftAng'),
      model: $('selModel').value
    });
    const cfg = {
      missile,
      aircraft: {
        mach: num('nmMach'),
        nMaxPos: num('nmNpos'),
        nMaxNeg: num('nmNneg'),
        rollRateMaxDeg: num('nmRoll'),
        model: $('selACModel').value,
        sepMax: num('nmSepMax'),
        gLossMax: num('nmGLoss'),
        maxEasKmh: num('nmMaxEas'),
        sepRate: 150
      },
      scenario: {
        preset: $('selPreset').value,
        launchDistM: P_DIST.get() * 1000,
        launchAltM: P_MALT.get() * 1000,
        targetAltM: P_TALT.get() * 1000,
        launchMach: P_MACH.get(),
        aspectDeg: P_ASPECT.get(),
        salvoN: num('nmSalvo'),
        salvoInterval: num('nmInterval'),
        launchYawDeg: num('nmLaunchYaw'),
        engine: $('selEngine').value
      }
    };
    return cfg;
  };

  ui.tacticId = () => $('selTactic').value;
  ui.tacticName = () => $('selTactic').selectedOptions[0].textContent;

  /* ---------- HUD ---------- */
  ui.updateHUD = function (eng) {
    const s = eng.sample();
    const a = WT.phys.attitudeAngles(eng.aircraft.quat);
    $('hMach').textContent = s.acMach.toFixed(2);
    $('hSpeed').textContent = Math.round(s.acMach * WT.phys.atmosphere(s.acAlt).a * 3.6);
    $('hAlt').textContent = Math.round(s.acAlt);
    $('hG').textContent = s.n.toFixed(1);
    $('hSep').textContent = (eng.aircraft.p.model === 'aero')
      ? `${(eng.aircraft.sepActual || 0).toFixed(0)} @${Math.round((eng.aircraft.thr != null ? eng.aircraft.thr : 1) * 100)}%`
      : '--';
    $('hDuelScore').textContent = '--';
    $('hEnemyStat').textContent = '--';
    $('hBank').textContent = Math.round(a.bank * 180 / Math.PI);
    $('hPitch').textContent = Math.round(a.pitch * 180 / Math.PI);
    $('hRange').textContent = (s.range / 1000).toFixed(2);
    $('hClosing').textContent = Math.round(s.closing);
    $('hMMach').textContent = (s.mSpeed / WT.phys.atmosphere(eng.missile.pos.y).a).toFixed(2);
    $('hMG').textContent = (eng.missile.gLoad || 0).toFixed(1);
    $('hMAoa').textContent = (eng.missile.alphaDeg != null)
      ? eng.missile.alphaDeg.toFixed(1) : '--';
    $('hMAlt').textContent = Math.round(eng.missile.pos.y);
    $('hMDist').textContent = ((eng.missile.travelDist || 0) / 1000).toFixed(1);
    $('hTgo').textContent = s.closing > 1 ? (s.range / s.closing).toFixed(1) : '--';
    /* NEZ/DEZ 双边界决策支持（仅动力学发动机+滑行段+活弹有效——论文语义） */
    const msNow = eng.missile;
    const dezValid = msNow && msNow.flying && msNow.guided !== false &&
      eng.cfg.scenario.engine === 'dynamic' && !(msNow.thrust > 0) && msNow.guidanceOn;
    if (WT.dez && !eng.done && dezValid) {
      const d = WT.dez.computeRdez(eng.missile, eng.aircraft, eng.cfg.missile,
        eng.cfg.aircraft.nMaxPos);
      const st = WT.dez.status(s.range, d.rNez, d.rDez);
      const f = (m) => (m >= 1000 ? (m / 1000).toFixed(1) + 'km' : Math.round(m) + 'm');
      const col = { safe: '#7bed9f', go: '#ffd166', contested: '#ffb26b', nez: '#ff6b6b' }[st.code];
      $('hDez').textContent = `N${f(d.rNez)}/D${f(d.rDez)}`;
      $('hDez').style.color = col;
      ui._mInfo = { col, stText: st.text, rNez: d.rNez, rDez: d.rDez };
    } else {
      /* 不适用场景：清空显示与缓存（防止跨局陈旧值） */
      $('hDez').textContent = (!eng.done && msNow && msNow.flying &&
        eng.cfg.scenario.engine === 'dynamic' && msNow.thrust > 0) ? '滑行段生效' : '--';
      $('hDez').style.color = '#8fae9d';
      ui._mInfo = null;
    }
    ui.drawRWR(eng);
    ui.drawNCurve(eng);
  };

  /* RWR 公共底座（背景/距离环/刻度/本机符号），返回几何参数 */
  function drawRWRBase(c, W, H) {
    const cx = W / 2, cy = H / 2, R = W / 2 - 8;
    c.clearRect(0, 0, W, H);
    c.fillStyle = 'rgba(5,20,10,0.75)';
    c.beginPath(); c.arc(cx, cy, R + 6, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#2f9e5f'; c.lineWidth = 1.2;
    c.beginPath(); c.arc(cx, cy, R, 0, Math.PI * 2); c.stroke();
    for (let i = 0; i < 12; i++) {
      const a = i * Math.PI / 6;
      c.beginPath();
      c.moveTo(cx + Math.sin(a) * (R - 4), cy - Math.cos(a) * (R - 4));
      c.lineTo(cx + Math.sin(a) * R, cy - Math.cos(a) * R);
      c.stroke();
    }
    c.setLineDash([3, 3]);
    c.strokeStyle = 'rgba(47,158,95,0.55)';
    for (const rr of [R / 12, R / 3]) {
      c.beginPath(); c.arc(cx, cy, rr, 0, Math.PI * 2); c.stroke();
    }
    c.setLineDash([]);
    c.fillStyle = '#2f9e5f';
    c.font = '13px Consolas, monospace'; c.textAlign = 'center';
    c.fillText('5 / 20 / 60km', cx, cy + R * 0.84);
    c.beginPath();
    c.moveTo(cx, cy - 14); c.lineTo(cx + 10, cy + 10); c.lineTo(cx, cy + 4);
    c.lineTo(cx - 10, cy + 10); c.closePath(); c.fill();
    return { cx, cy, R };
  }

  /* RWR 告警规则：弹目距离 ≤19km 才告警；红外弹（opticalSeeker）无雷达辐射 → 不告警 */
  const RWR_WARN_RANGE = WT.CONST.RWR_WARN_RANGE;
  function isIrMissile(p) {
    if (!p) return false;
    if (p.irSeeker != null) return !!p.irSeeker;     // missiles_patch 显式标记
    const n = p.name || '';
    if (/雷达/.test(n)) return false;   // 含"雷达"优先判雷达（AIM-7E2 半主动雷达格斗弹等）
    return /红外/.test(n);              // 命名约定兜底（自定义弹）
  }
  ui.isIrMissile = isIrMissile;   // 供 main 计算告警音级别

  /* ---------- RWR（雷达告警） ---------- */
  ui.drawRWR = function (eng) {
    const cv = $('rwr'), c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const { cx, cy, R } = drawRWRBase(c, W, H);

    const ms = eng.missile;
    const warnMs = ms && !eng.done &&
      ms.pos.distanceTo(eng.aircraft.pos) <= RWR_WARN_RANGE && !isIrMissile(ms.p);
    if (warnMs) {
      const brg = WT.tactics.missileBearing(eng);
      const elv = WT.tactics.missileElevation(eng);
      const range = ms.pos.distanceTo(eng.aircraft.pos);
      /* 径向 = 弹目距离【等比（线性）刻度】：rr = R·距离/60km，与距离严格成正比
       * 5km 环 = R/12，20km 环 = R/3，60km = 外圈(R)，>60km 贴外圈 */
      const radiusFor = (m) => R * Math.min(m / 60000, 1);   // 严格线性（无下限钳位）
      const rr = radiusFor(range);
      const x = cx + Math.sin(brg) * rr, y = cy - Math.cos(brg) * rr;
      /* NEZ（红 N）/ DEZ（绿 D）动态刻度：仅"动力学发动机 + 滑行段 + 活弹 +
       * 导引头跟踪"时显示 —— Alkaher2015 的对象是滑行段能量耗尽型导弹，
       * 助推段/恒速模式/死弹/脱锁情形下概念不适用，不绘制 */
      const dezValid = ms.flying && ms.guided !== false &&
        eng.cfg.scenario.engine === 'dynamic' &&
        !(ms.thrust > 0) && ms.guidanceOn && ui._nezOn !== false;
      if (dezValid) {
        let rNez = 0, rDez = 0;
        try {
          const d = WT.dez.computeRdez(ms, eng.aircraft, eng.cfg.missile,
            eng.cfg.aircraft.nMaxPos);
          rNez = d.rNez; rDez = d.rDez;
        } catch (e) { /* 解算失败就不画 */ }
        if (isFinite(rNez) && isFinite(rDez) && rDez > 0) {
          for (const [val, color, tag, angOff] of [
            [rNez, '#ff5040', 'N', -0.14],
            [rDez, '#50ff80', 'D', 0.14]]) {
            /* 最小半径避开中心本机符号；N/D 角度错开防两值接近时重叠 */
            const rt = Math.max(R * 0.17, radiusFor(val));
            const bb = brg + angOff;
            const tx = cx + Math.sin(bb) * rt, ty = cy - Math.cos(bb) * rt;
            const px = Math.cos(bb) * 8, py = Math.sin(bb) * 8;
            c.strokeStyle = color; c.lineWidth = 2;
            c.beginPath();
            c.moveTo(tx - px, ty - py); c.lineTo(tx + px, ty + py);
            c.stroke();
            c.fillStyle = color;
            c.font = 'bold 11px Consolas, monospace';
            c.textAlign = 'center';
            c.fillText(tag + (val >= 1000 ? (val / 1000).toFixed(1) : Math.round(val)),
              tx + px * 2.1, ty + py * 2.1 + 4);
          }
        }
      } else if (ms.flying && eng.cfg.scenario.engine === 'dynamic' &&
                 ms.thrust > 0 && ui._nezOn !== false) {
        /* 助推段：轻量提示（刻度滑行段才生效），避免"怎么不显示"的困惑 */
        c.fillStyle = '#6b7a70';
        c.font = '10px Consolas, monospace';
        c.textAlign = 'center';
        c.fillText('N/D 滑行段生效', cx, cy + R * 0.66);
      }
      c.setLineDash([3, 3]);
      c.strokeStyle = 'rgba(47,158,95,0.55)';
      c.beginPath(); c.arc(cx, cy, R / 12, 0, Math.PI * 2); c.stroke();
      c.beginPath(); c.arc(cx, cy, R / 3, 0, Math.PI * 2); c.stroke();
      c.setLineDash([]);
      c.fillStyle = '#2f9e5f';
      c.font = '13px Consolas, monospace';
      c.textAlign = 'center';
      c.fillText('5 / 20 / 60km', cx, cy + R * 0.84);
      /* 告警符号：绿色 M + 外圆（外圆半径 = 5km 环半径 R/12） */
      c.strokeStyle = '#2fe07a';
      c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, R / 12, 0, Math.PI * 2); c.stroke();
      c.lineWidth = 1.5;
      c.fillStyle = '#2fe07a';
      c.font = 'bold 14px Consolas, monospace';
      c.textAlign = 'center';
      c.textBaseline = 'middle';
      c.fillText('M', x, y + 1);
      c.textBaseline = 'alphabetic';
      /* 距离数值 + 上下标记 */
      c.fillStyle = '#9fe8bd';
      c.font = 'bold 13px Consolas, monospace';
      c.textAlign = 'left';
      c.fillText((range / 1000).toFixed(1), Math.min(x + 16, W - 42), y - 9);
      c.textAlign = 'center';
      if (elv > 0.18) c.fillText('^', x, y - 18);
      else if (elv < -0.18) c.fillText('v', x, y + 26);
      c.fillStyle = (Math.floor(eng.t * 4) % 2 === 0) ? '#ff3b30' : '#ff8a80';
      c.font = 'bold 15px Consolas, monospace';
      c.fillText('MISSILE', cx, H - 4);
    }
  };

  /* ---------- 导弹浮动信息框（跟随导弹；关闭时只显示在上方面板） ---------- */
  ui._mBoxOn = true;
  ui.updateMissileBox = function (eng, view) {
    const box = $('mBox');
    if (!ui._mBoxOn || eng.done || !view) { box.style.display = 'none'; return; }
    const scr = view.worldToScreen(eng.missile.pos.clone());
    if (!scr.visible) { box.style.display = 'none'; return; }
    const s = eng.sample();
    const ma = (s.mSpeed / WT.phys.atmosphere(eng.missile.pos.y).a).toFixed(2);
    const g = (eng.missile.gLoad || 0).toFixed(1);
    const aoa = (eng.missile.alphaDeg || 0).toFixed(1);
    /* 主动雷达导引头开机点：≤19km 显示"雷达开机"（与 RWR 告警同一物理阈值；红外弹无雷达） */
    const radarOn = !isIrMissile(eng.missile.p) && s.range <= 19000;
    box.innerHTML =
      `<b>${eng.cfg.missile.name || '导弹'}</b><br>` +
      `距离 ${(s.range / 1000).toFixed(2)}km · Ma ${ma}<br>` +
      `过载 ${g}G · AoA ${aoa}°<br>高度 ${Math.round(eng.missile.pos.y)}m · 飞程 ${((eng.missile.travelDist || 0) / 1000).toFixed(1)}km` +
      (radarOn ? '<br><span style="color:#ffb020">⚡ 雷达开机</span>' : '') +
      (ui._mInfo ? `<br><span style="color:${ui._mInfo.col}">${ui._mInfo.stText}</span>` +
        ` N ${(ui._mInfo.rNez / 1000).toFixed(1)} D ${(ui._mInfo.rDez / 1000).toFixed(1)}km` : '');
    box.style.display = 'block';
    box.style.left = Math.min(scr.x + 26, window.innerWidth - 240) + 'px';
    box.style.top = Math.max(scr.y - 40, 8) + 'px';
  };

  /* 敌机状态浮动标签（对抗模式，导弹标签同款，绿框） */
  ui.updateEnemyBox = function (duel, view) {
    const box = $('eBox');
    if (!view || !duel || duel.enemyDead || duel.done) {
      box.style.display = 'none';
      return;
    }
    const scr = view.worldToScreen(duel.enemy.pos.clone());
    if (!scr.visible) { box.style.display = 'none'; return; }
    const p = duel.enemy;
    const ma = (p.V / WT.phys.atmosphere(p.pos.y).a).toFixed(2);
    const dist = p.pos.distanceTo(duel.player.pos);
    box.innerHTML =
      `<b>敌机</b><br>` +
      `距离 ${(dist / 1000).toFixed(2)}km<br>` +
      `速度 ${(p.V * 3.6).toFixed(0)}km/h · Ma ${ma}<br>` +
      `高度 ${Math.round(p.pos.y)}m`;
    box.style.display = 'block';
    box.style.left = Math.min(scr.x + 26, (window.innerWidth || 1200) - 240) + 'px';
    box.style.top = Math.max(scr.y - 40, 8) + 'px';
  };

  /* ---------- 过载-马赫曲线（顶部） ----------
   * n_max(M) = min( 舵面权限平台 finsLatAccel, 升力链 q·S·kL·αmax/(m·g) )
   * 低速段 ∝M²（fin 面积/迎角限制，橙）；高速段平台（finsLatAccel，绿） */
  ui.drawNCurve = function (eng) {
    const cv = $('ncurve');
    if (!cv || !cv.getContext) return;
    const c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    c.clearRect(0, 0, W, H);
    if (ui._nChartOn === false) return;
    const ms = eng.missile;
    if (eng.done || !ms || !WT.nMaxAtMach) return;
    const p = eng.cfg.missile;
    const A = WT.buildAero(p);
    /* 实时包线：按【当前高度 + 当前质量】计算 —— 曲线随爬升/燃耗浮动，
     * 这正是高度与质量对机动性影响的直观体现（图表右上角有浮动说明） */
    const h = ms.pos.y;
    const m = ms.mass || p.mass0;
    const plat = Math.min(p.nMaxG, A.finsLatG);
    const machHi = Math.max(p.maxMach || 3, 2.5);
    const L = 32, R = 10, T = 16, B = 20;
    const px = (mm) => L + (W - L - R) * Math.min(Math.max(mm / machHi, 0), 1);
    const py = (nn) => H - B - (H - T - B) * Math.min(Math.max(nn / (plat * 1.15), 0), 1);

    c.fillStyle = '#8ecfa8';
    c.font = 'bold 11px Consolas, monospace';
    c.textAlign = 'left';
    c.fillText('过载-G / 马赫 @' + (h / 1000).toFixed(1) + 'km·' + m.toFixed(0) + 'kg', 8, 11);
    /* 浮动说明 */
    c.fillStyle = '#6f8d7d';
    c.font = '9px Consolas, monospace';
    c.textAlign = 'right';
    c.fillText('曲线随高度/质量浮动', W - 8, 11);
    c.textAlign = 'left';

    /* 坐标轴 */
    c.strokeStyle = 'rgba(120,170,140,0.6)';
    c.lineWidth = 1;
    c.beginPath();
    c.moveTo(L, T); c.lineTo(L, H - B); c.lineTo(W - R, H - B);
    c.stroke();
    c.fillStyle = '#7fae95';
    c.font = '9px Consolas, monospace';
    c.textAlign = 'center';
    for (let mm = 0; mm <= machHi; mm += 1) c.fillText('M' + mm, px(mm), H - B + 12);
    c.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const nn = plat * i / 4;
      c.fillText(nn.toFixed(0), L - 4, py(nn) + 3);
    }

    /* 曲线分段着色 */
    const pts = [];
    for (let i = 0; i <= 48; i++) {
      const mm = machHi * i / 48;
      const r = WT.nMaxAtMach(p, A, m, Math.max(mm, 0.05), h);
      pts.push([px(mm), py(r.n), r.lift < r.auth]);
    }
    c.lineWidth = 2.2;
    for (let i = 1; i < pts.length; i++) {
      c.beginPath();
      c.moveTo(pts[i - 1][0], pts[i - 1][1]);
      c.lineTo(pts[i][0], pts[i][1]);
      c.strokeStyle = (pts[i - 1][2] || pts[i][2]) ? '#ff9a4d' : '#58d68d';
      c.stroke();
    }

    /* 转折马赫标注（升力链=权限平台交点）：
     * 黄色虚线 + 交点圆圈 + 文字 —— 低于该马赫机动性开始下降 */
    const mStar = WT.cornerMach ? WT.cornerMach(p, A, m, h) : NaN;
    if (isFinite(mStar) && mStar > 0.05 && mStar < machHi) {
      const xs = px(mStar), ys = py(plat);
      c.strokeStyle = '#ffd166';
      c.lineWidth = 1.5;
      c.setLineDash([4, 4]);
      c.beginPath(); c.moveTo(xs, T); c.lineTo(xs, H - B); c.stroke();
      c.setLineDash([]);
      c.beginPath(); c.arc(xs, ys, 5, 0, Math.PI * 2); c.stroke();
      const flip = xs > W * 0.62;
      c.fillStyle = '#ffd166';
      c.textAlign = flip ? 'right' : 'left';
      c.font = 'bold 11px Consolas, monospace';
      c.fillText('M' + mStar.toFixed(2) + ' ' + plat.toFixed(0) + 'G',
        xs + (flip ? -7 : 7), T + 11);
    }

    /* 当前工作点（红点 + 马赫线） */
    const machNow = Math.min(ms.vel.length() / WT.phys.atmosphere(h).a, machHi);
    const gNow = Math.min(ms.gLoad || 0, plat * 1.15);
    c.strokeStyle = 'rgba(255,255,255,0.25)';
    c.setLineDash([3, 3]);
    c.beginPath(); c.moveTo(px(machNow), T); c.lineTo(px(machNow), H - B); c.stroke();
    c.setLineDash([]);
    c.fillStyle = '#ff5040';
    c.beginPath(); c.arc(px(machNow), py(gNow), 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#d8ffe6';
    c.font = '10px Consolas, monospace';
    c.textAlign = 'left';
    c.fillText(`M${machNow.toFixed(2)} ${gNow.toFixed(1)}G`,
      Math.min(px(machNow) + 7, W - 82), T + 10);

    /* 图例 */
    c.font = '9px Consolas, monospace';
    c.fillStyle = '#ff9a4d';
    c.fillText('■ fin面积/迎角限制', 8, H - 5);
    c.fillStyle = '#58d68d';
    c.fillText('■ finsLatAccel 限制', 130, H - 5);
  };

  /* ---------- 对抗模式 ---------- */
  /* 全局拦截许可（【允许拦截对方导弹】勾选；未勾选则任何模式都不得拦截） */
  ui.interceptAllowed = function () { return !!$('chkIntercept').checked; };

  /* 我方导弹参数（自定义 = 当前高级参数；否则取预设） */
  ui.myMissileParams = function () {
    const myKey = $('selMyMissile').value;
    if (myKey === 'custom' || !WT.MISSILE_PRESETS[myKey]) {
      return ui.collectCfg().missile;
    }
    return Object.assign({}, WT.MISSILE_PRESETS[myKey]);
  };

  ui.collectDuelCfg = function () {
    const base = ui.collectCfg();
    const playerMissile = ui.myMissileParams();
    const enemyKey = $('selEnemyMissile').value;
    const enemyMissile = Object.assign({},
      WT.MISSILE_PRESETS[enemyKey] || WT.MISSILE_PRESETS.aim9l);
    enemyMissile.launchMach = num('nmEnemyMach');
    /* 面板"导弹模型"对双方生效；我方弹初速取面板"导弹初速" */
    playerMissile.model = $('selModel').value;
    enemyMissile.model = $('selModel').value;
    if (!(playerMissile.launchMach > 0)) {
      playerMissile.launchMach = base.scenario.launchMach;
    }
    return {
      aircraft: base.aircraft,
      engine: $('selEngine').value === 'const' ? 'const' : 'dynamic',
      targetAltM: base.scenario.targetAltM,
      enemyAltM: isFinite(num('nmEnemyAlt')) ? num('nmEnemyAlt') * 1000 : undefined,   // 敌机高度 km
      enemyMach: isFinite(num('nmEnemyMach')) ? num('nmEnemyMach') : undefined,       // 敌机初速 Ma
      playerMissile,
      enemyMissile,
      playerInvincible: $('chkInvMe').checked,
      enemyInvincible: $('chkInvEnemy').checked,
      enemy: {
        fireInterval: num('nmEnemyInterval') || 8,
        offense: $('selEnemyOffense').value,
        evasion: $('selEnemyEvasion').value
      },
      startDist: (num('nmDuelDist') || 15) * 1000
    };
  };

  ui.updateDuelHUD = function (duel) {
    const p = duel.player;
    const atm = WT.phys.atmosphere(p.pos.y);
    $('hMach').textContent = (p.V / atm.a).toFixed(2);
    $('hSpeed').textContent = (p.V * 3.6).toFixed(0);
    $('hAlt').textContent = Math.round(p.pos.y);
    $('hG').textContent = p.n.toFixed(1);
    $('hSep').textContent = (p.p.model === 'aero')
      ? `${(p.sepActual || 0).toFixed(0)} @${Math.round((p.thr != null ? p.thr : 1) * 100)}%`
      : '--';
    const a = WT.phys.attitudeAngles(p.quat);
    $('hBank').textContent = (a.bank * 57.3).toFixed(0);
    $('hPitch').textContent = (a.pitch * 57.3).toFixed(0);
    $('hDuelScore').textContent =
      `${duel.stats.playerScored} / ${duel.stats.playerTaken} / ${duel.interceptCount || 0}`;
    const ed = duel.enemy.pos.distanceTo(p.pos);
    $('hEnemyStat').textContent = duel.enemyDead
      ? '已击落'
      : `${(ed / 1000).toFixed(1)}km · ${(duel.enemy.V * 3.6).toFixed(0)}km/h` +
        `${duel.cfg.enemyInvincible ? ' · 无敌' : ''}`;
    if (duel.playerDead) $('hEnemyStat').textContent += '（我方被击落）';
    /* 右栏"来袭导弹"行：最近威胁；浮动框/曲线在对抗模式清理 */
    const threat = duel.primaryThreat();
    if (threat && threat.flying) {
      const rel = new THREE.Vector3().subVectors(threat.pos, p.pos);
      const rdot = new THREE.Vector3().subVectors(p.vel, threat.vel);
      const rng = rel.length();
      const closing = -rel.dot(rdot) / Math.max(rng, 1e-6);
      const ta = WT.phys.atmosphere(threat.pos.y);
      $('hRange').textContent = (rng / 1000).toFixed(1);
      $('hClosing').textContent = Math.max(0, Math.round(closing));
      $('hMMach').textContent = (threat.vel.length() / ta.a).toFixed(2);
      $('hMG').textContent = (threat.gLoad || 0).toFixed(1);
      $('hMAoa').textContent = (threat.alphaDeg || 0).toFixed(1);
      $('hMAlt').textContent = Math.round(threat.pos.y);
      $('hMDist').textContent = ((threat.travelDist || 0) / 1000).toFixed(1);
      $('hTgo').textContent = closing > 1 ? (rng / closing).toFixed(1) : '--';
      $('hDez').textContent = '--';
    }
    $('mBox').style.display = 'none';

    /* 面板参数实时生效（无敌/敌方导弹/初速/间隔/策略/我方导弹）——首次立即、其后 5Hz。
     * 修复：模式切换即开局导致"切完再配置无效"（无敌不生效、敌方弹参数不生效） */
    duel._syncT = (duel._syncT || 0) + 1;   // 每局独立节流：新局首帧必同步
    if (duel._syncT === 1 || duel._syncT % 12 === 0) {
      duel.cfg.playerInvincible = !!$('chkInvMe').checked;
      duel.cfg.enemyInvincible = !!$('chkInvEnemy').checked;
      if (duel.cfg.enemy) {
        duel.cfg.enemy.fireInterval = num('nmEnemyInterval') || duel.cfg.enemy.fireInterval;
        duel.cfg.enemy.offense = $('selEnemyOffense').value || duel.cfg.enemy.offense;
        const ev = $('selEnemyEvasion').value;
        if (ev !== duel.cfg.enemy.evasion) {
          duel.cfg.enemy.evasion = ev;
          duel.evasion = (ev && WT.tactics) ? WT.tactics.create(ev, Math.random) : null;
        }
      }
      const ek = $('selEnemyMissile').value;
      const em = Object.assign({}, WT.MISSILE_PRESETS[ek] || WT.MISSILE_PRESETS.aim9l);
      em.launchMach = num('nmEnemyMach') || em.launchMach || 1.2;
      em.model = $('selModel').value;
      duel.cfg.enemyMissile = em;
      duel.cfg.playerMissile = ui.myMissileParams();
    }
  };

  ui.drawRWRDuel = function (duel) {
    const cv = $('rwr'), c = cv.getContext('2d');
    const W = cv.width, H = cv.height;
    const { cx, cy, R } = drawRWRBase(c, W, H);

    /* 以玩家机头水平航向为基准 */
    const ac = duel.player;
    const a = WT.phys.attitudeAngles(ac.quat);
    const fwdH = new THREE.Vector3(a.fwd.x, 0, a.fwd.z);
    const refH = fwdH.lengthSq() > 1e-8
      ? fwdH.normalize() : new THREE.Vector3(0, 0, -1);
    const rightH = new THREE.Vector3().crossVectors(refH, new THREE.Vector3(0, 1, 0));
    const radiusFor = (m) => R * Math.min(m / 60000, 1);   // 严格线性（无下限钳位）
    /* 标记位置 = 真实径向偏移（严格线性）。不做防重叠外推 —— 外推会让
     * "偏移∝距离"失真（导弹咬住敌机时被顶向外圈，接近看起来不线性） */
    const place = (x0, y0) => [x0, y0];
    const marker = (pos, color, label, big) => {
      const v = new THREE.Vector3().subVectors(pos, ac.pos);
      const brg = Math.atan2(v.dot(rightH), v.dot(refH));
      const rr = radiusFor(v.length());
      const [x, y] = place(cx + Math.sin(brg) * rr, cy - Math.cos(brg) * rr);
      c.fillStyle = color;
      if (big) {
        c.beginPath();
        c.moveTo(x, y - 8); c.lineTo(x + 7, y); c.lineTo(x, y + 8); c.lineTo(x - 7, y);
        c.closePath(); c.fill();
      } else {
        c.beginPath(); c.arc(x, y, 5, 0, Math.PI * 2); c.fill();
      }
      c.font = 'bold 11px Consolas, monospace'; c.textAlign = 'center';
      c.fillText(label, x, y - (big ? 12 : 8));
    };
    /* 导弹标记：圆圈 + 字母（原版样式；敌弹红 M / 我弹绿 F） */
    const missileMarker = (pos, color, label) => {
      const v = new THREE.Vector3().subVectors(pos, ac.pos);
      const brg = Math.atan2(v.dot(rightH), v.dot(refH));
      const rr = radiusFor(v.length());
      const [x, y] = place(cx + Math.sin(brg) * rr, cy - Math.cos(brg) * rr);
      c.strokeStyle = color; c.lineWidth = 2;
      c.beginPath(); c.arc(x, y, R / 12, 0, Math.PI * 2); c.stroke();
      c.fillStyle = color;
      c.font = 'bold 11px Consolas, monospace';
      c.textAlign = 'center'; c.textBaseline = 'middle';
      c.fillText(label, x, y + 1);
      c.textBaseline = 'alphabetic';
    };
    if (!duel.enemyDead) marker(duel.enemy.pos, '#ff5040', '', true);   // 敌机：只画符号，不带字母
    /* 只显示敌方导弹（我方导弹不上 RWR）；≤19km 告警；红外弹不告警 */
    for (const m of duel.missiles) {
      if (isIrMissile(m.p)) continue;
      if (m.pos.distanceTo(ac.pos) > RWR_WARN_RANGE) continue;
      if (m.flying && m.side === 'enemy') missileMarker(m.pos, '#ff8080', 'M');
    }
  };

  /* 模式特有选项显隐：单向=来袭配置/战术测试，对抗=敌方配置/无敌/计数 */
  const SINGLE_ONLY = ['secScenario', 'rowSalvo', 'rowDist', 'rowYaw',
    'rowMach', 'rowMAlt', 'rowAspect', 'secBatch'];
  ui.applyMode = function (mode) {
    const duel = mode === 'duel';
    $('duelOnly').style.display = duel ? '' : 'none';
    for (const id of SINGLE_ONLY) $(id).style.display = duel ? 'none' : '';
    if (!duel) $('eBox').style.display = 'none';
  };

  /* ---------- 结果横幅 ---------- */
  ui.showBanner = function (res, tacticName) {
    const b = $('banner');
    if (typeof res === 'string') {
      /* CSS 语义：hit=红=坏（失败/错误），miss=绿=好（胜利/成功） */
      b.className = 'banner ' + (tacticName === 'win' ? 'miss' : 'hit');
      b.innerHTML =
        `<div class="b-title">${res}</div>` +
        `<div class="b-hint">按 R 键 重置</div>`;
      return;
    }
    const ok = res.hit;
    b.className = ok ? 'banner hit' : 'banner miss';
    b.innerHTML =
      `<div class="b-title">${res.label}</div>` +
      `<div class="b-sub">规避战术：${tacticName}　脱靶量：${(res.missDist || 0).toFixed(1)} m　用时：${(res.t || 0).toFixed(1)} s</div>` +
      `<div class="b-hint">按 R 键 重置</div>`;
  };
  ui.hideBanner = () => { $('banner').className = 'banner hidden'; };

  ui.setPauseLabel = (paused) => { $('btnPause').textContent = paused ? '继续 (P)' : '暂停 (P)'; };
  ui.setCamLabel = (m) => {
    const names = { chase: '追尾', cockpit: '座舱', missile: '导弹', free: '自由' };
    $('btnCam').textContent = '视角：' + names[m] + ' (C)';
  };
  ui.toast = (msg) => {
    const b = $('banner');
    b.className = 'banner toast';
    b.innerHTML = `<div class="b-sub">${msg}</div>`;
    setTimeout(() => { if (b.className === 'banner toast') ui.hideBanner(); }, 2200);
  };

  /* ---------- 记录表 ---------- */
  function aspectName(deg) {
    if (deg < 45) return '迎头';
    if (deg < 135) return '侧向';
    return '尾追';
  }

  ui.addRecord = function (row) {
    ui.records.push(row);
    const tr = document.createElement('tr');
    tr.className = row.hit ? 'r-hit' : 'r-miss';
    tr.innerHTML =
      `<td>${row.tactic}</td><td>${row.missile}</td><td>${aspectName(row.aspect)} ${row.aspect}°</td>` +
      `<td>${(row.dist / 1000).toFixed(1)}</td><td>${row.label}</td>` +
      `<td>${row.missDist.toFixed(1)}</td><td>${row.t.toFixed(1)}</td><td>${row.peakG.toFixed(1)}</td>`;
    $('recordsBody').appendChild(tr);
  };

  ui.exportCsv = function () {
    const head = '战术,导弹,来袭方位(°),距离(m),结果,脱靶量(m),用时(s),峰值过载(G)';
    const lines = ui.records.map(r =>
      [r.tactic, r.missile, r.aspect, r.dist, r.label,
        r.missDist.toFixed(1), r.t.toFixed(1), r.peakG.toFixed(1)].join(','));
    const csv = '\uFEFF' + head + '\n' + lines.join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = 'evasion_records.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /* ---------- 批量测试结果 ---------- */
  ui.showBatch = function (results, tacticName) {
    const n = results.length;
    const hits = results.filter(r => r.hit).length;
    const misses = results.filter(r => !r.hit && r.result !== 'target_crash');
    const avgMiss = misses.length
      ? misses.reduce((s, r) => s + r.missDist, 0) / misses.length : 0;
    const minMiss = misses.length ? Math.min(...misses.map(r => r.missDist)) : 0;
    $('batchSummary').innerHTML =
      `战术「${tacticName}」× ${n} 发：命中 <b>${hits}</b>（命中率 ${(hits / n * 100).toFixed(0)}%）` +
      `　脱靶均值 ${avgMiss.toFixed(0)} m　最小脱靶 ${minMiss.toFixed(0)} m`;
    for (const r of results) {
      ui.addRecord({
        tactic: tacticName + '·批量', missile: r.missile || ui._batchMissileName,
        aspect: r.aspect != null ? r.aspect : ui._batchAspect,
        dist: r.dist != null ? r.dist : ui._batchDist,
        label: r.label, hit: r.hit,
        missDist: r.missDist, t: r.t, peakG: r.peakG
      });
    }
  };

  ui.setBatchContext = function (missileName, aspect, dist) {
    ui._batchMissileName = missileName;
    ui._batchAspect = aspect;
    ui._batchDist = dist;
  };

  ui.batchN = () => parseInt($('selBatchN').value, 10);

  /* ---------- 初始化 ---------- */
  ui.init = function (handlers) {
    ui._handlers = handlers;
    P_DIST = pair('slDist', 'nmDist');
    P_MALT = pair('slMAlt', 'nmMAlt');
    P_MACH = pair('slLaunchMach', 'nmLaunchMach');
    P_ASPECT = pair('slAspect', 'nmAspect');
    P_TALT = pair('slTAlt', 'nmTAlt');
    P_YAW = pair('slLaunchYaw', 'nmLaunchYaw');   // 初速偏角滑条/数字联动

    /* 导弹预设切换 */
    $('selPreset').addEventListener('change', () => {
      fillMissileForm(WT.MISSILE_PRESETS[$('selPreset').value]);
    });
    fillMissileForm(WT.MISSILE_PRESETS[WT.DEFAULTS.scenario.preset]);

    /* 场景预设装载（弹种 + 距离/高度/初速/方位/偏角） */
    const loadScenario = () => {
      const sc = SCENARIOS[$('selScenario').value];
      if (!sc) return;
      $('selPreset').value = sc.preset;
      fillMissileForm(WT.MISSILE_PRESETS[sc.preset]);
      P_DIST.set(sc.dist);
      P_MALT.set(sc.malt);
      P_TALT.set(sc.talt);
      P_MACH.set(sc.mach);
      P_ASPECT.set(sc.aspect);
      P_YAW.set(sc.yaw);
    };
    $('selScenario').addEventListener('change', loadScenario);

    /* 动态追加扩展导弹预设（js/missiles.js） */
    for (const key of Object.keys(WT.MISSILE_PRESETS)) {
      if (![...$('selPreset').options].some(o => o.value === key)) {
        const o = document.createElement('option');
        o.value = key;
        o.textContent = WT.MISSILE_PRESETS[key].name;
        $('selPreset').appendChild(o);
      }
    }
    loadScenario();   // 启动时灌入默认场景预设（必须在 selPreset 选项补全【之后】！）

    /* 来袭方位快捷按钮 */
    for (const btn of document.querySelectorAll('[data-aspect]')) {
      btn.addEventListener('click', () => P_ASPECT.set(parseFloat(btn.dataset.aspect)));
    }

    /* 战术下拉 */
    for (const t of WT.TACTICS) {
      const o = document.createElement('option');
      o.value = t.id; o.textContent = t.name;
      $('selTactic').appendChild(o);
    }

    /* 对抗模式：导弹下拉 + 模式切换 */
    for (const key of Object.keys(WT.MISSILE_PRESETS)) {
      const name = WT.MISSILE_PRESETS[key].name;
      const oE = document.createElement('option');
      oE.value = key; oE.textContent = name;
      $('selEnemyMissile').appendChild(oE);
      const oM = document.createElement('option');
      oM.value = key; oM.textContent = name;
      $('selMyMissile').appendChild(oM);
    }
    $('selEnemyMissile').value = WT.MISSILE_PRESETS.aim120d ? 'aim120d' : 'custom';
    $('selMyMissile').value = WT.MISSILE_PRESETS.aim120d ? 'aim120d' : 'custom';
    $('selMode').addEventListener('change', () => {
      if (ui._handlers.onModeChange) ui._handlers.onModeChange($('selMode').value);
    });
    ui.applyMode('single');

    $('btnLaunch').addEventListener('click', handlers.onLaunch);
    $('btnPause').addEventListener('click', handlers.onPause);
    $('btnCam').addEventListener('click', handlers.onCam);
    $('btnBatch').addEventListener('click', handlers.onBatch);
    $('btnExport').addEventListener('click', ui.exportCsv);
    /* 显示选项开关 */
    $('chkTri').addEventListener('change', () => {
      if (WT.view) WT.view.setMarker($('chkTri').checked);
    });
    $('chkLos').addEventListener('change', () => {
      if (WT.view) WT.view.setLosVisible($('chkLos').checked);
    });
    $('chkMBox').addEventListener('change', () => {
      ui._mBoxOn = $('chkMBox').checked;
      $('hudRight').style.display = ui._mBoxOn ? 'none' : '';
      $('mBox').style.display = 'none';
    });
    ui._mBoxOn = $('chkMBox').checked;
    $('hudRight').style.display = ui._mBoxOn ? 'none' : '';
    $('chkNez').addEventListener('change', () => {
      ui._nezOn = $('chkNez').checked;
    });
    ui._nezOn = $('chkNez').checked;
    $('chkNChart').addEventListener('change', () => {
      ui._nChartOn = $('chkNChart').checked;
    });
    ui._nChartOn = $('chkNChart').checked;
    $('chkSound').addEventListener('change', () => {
      if (WT.audio) { WT.audio.resume(); WT.audio.setMuted(!$('chkSound').checked); }
    });
    if (WT.audio) WT.audio.setMuted(!$('chkSound').checked);
    for (const btn of document.querySelectorAll('[data-warp]')) {
      btn.addEventListener('click', () => handlers.onWarp(parseFloat(btn.dataset.warp), btn));
    }
  };

  WT.ui = ui;
})(window.WT);
