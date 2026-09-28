/* ============================================================
 * render.js — Three.js 实时 3D 可视化
 * 视角：追尾 / 座舱 / 导弹 / 自由环绕；含尾迹、LOS 连线、爆炸特效
 * ============================================================ */
window.WT = window.WT || {};

(function (WT) {
  'use strict';

  /* ---------- 尾迹线 ---------- */
  class Trail {
    constructor(color, maxPts, opacity) {
      this.max = maxPts;
      this.n = 0;
      this.pos = new Float32Array(maxPts * 3);
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(this.pos, 3));
      g.setDrawRange(0, 0);
      this.line = new THREE.Line(g, new THREE.LineBasicMaterial({
        color, transparent: true, opacity: opacity == null ? 0.8 : opacity
      }));
      this.line.frustumCulled = false;
    }
    add(p) {
      if (this.n >= this.max) {          // 环形滚动：整体前移
        this.pos.copyWithin(0, 3);
        this.n--;
      }
      this.pos[this.n * 3] = p.x;
      this.pos[this.n * 3 + 1] = p.y;
      this.pos[this.n * 3 + 2] = p.z;
      this.n++;
      this.line.geometry.setDrawRange(0, this.n);
      this.line.geometry.attributes.position.needsUpdate = true;
    }
    clear() { this.n = 0; this.line.geometry.setDrawRange(0, 0); }
  }

  /* ---------- 程序化飞机模型（F-16 风格简化体） ---------- */
  function makeAircraft() {
    const g = new THREE.Group();
    const body = new THREE.MeshPhongMaterial({ color: 0x8a95a3 });
    const dark = new THREE.MeshPhongMaterial({ color: 0x222831 });
    const accent = new THREE.MeshPhongMaterial({ color: 0xb03a2e });

    /* 机身（指向 -Z） */
    const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.35, 9, 12), body);
    fus.rotation.x = -Math.PI / 2;
    g.add(fus);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.55, 2.4, 12), accent);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -5.7;
    g.add(nose);
    const canopy = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), dark);
    canopy.scale.set(0.8, 0.6, 1.6);
    canopy.position.set(0, 0.5, -2.2);
    g.add(canopy);

    /* 主翼（梯形近似） */
    const wingShape = new THREE.Shape();
    wingShape.moveTo(0, 0); wingShape.lineTo(4.6, 1.6);
    wingShape.lineTo(4.6, 2.6); wingShape.lineTo(0, 2.2);
    const wingGeo = new THREE.ExtrudeGeometry(wingShape,
      { depth: 0.14, bevelEnabled: false });
    const wingL = new THREE.Mesh(wingGeo, body);
    wingL.rotation.x = Math.PI / 2;
    wingL.position.set(0.3, -0.05, -0.4);
    g.add(wingL);
    const wingR = wingL.clone();
    wingR.scale.x = -1;
    wingR.position.x = -0.3;
    g.add(wingR);

    /* 平尾 + 垂尾 */
    for (const sgn of [1, -1]) {
      const tail = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.1, 1.2), body);
      tail.position.set(sgn * 1.5, 0, 3.9);
      g.add(tail);
    }
    const fin = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.9, 1.6), body);
    fin.position.set(0, 1.1, 3.6);
    fin.rotation.x = 0.25;
    g.add(fin);

    /* 尾喷口 */
    const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.3, 0.7, 10), dark);
    nozzle.rotation.x = -Math.PI / 2;
    nozzle.position.z = 4.7;
    g.add(nozzle);
    return g;
  }

  /* ---------- 程序化导弹模型 ---------- */
  function makeMissile() {
    const g = new THREE.Group();
    const skin = new THREE.MeshPhongMaterial({ color: 0xd8d8d8 });
    const dark = new THREE.MeshPhongMaterial({ color: 0x333333 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 2.6, 8), skin);
    body.rotation.x = -Math.PI / 2;
    g.add(body);
    const nose = new THREE.Mesh(new THREE.ConeGeometry(0.09, 0.5, 8), dark);
    nose.rotation.x = -Math.PI / 2;
    nose.position.z = -1.55;
    g.add(nose);
    for (let i = 0; i < 4; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.03, 0.35), dark);
      const a = i * Math.PI / 2 + Math.PI / 4;
      fin.position.set(Math.cos(a) * 0.25, Math.sin(a) * 0.25, 1.0);
      fin.rotation.z = a;
      g.add(fin);
      const fin2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.03, 0.22), dark);
      fin2.position.set(Math.cos(a) * 0.16, Math.sin(a) * 0.16, -0.6);
      fin2.rotation.z = a;
      g.add(fin2);
    }
    /* 尾焰（助推段显示） */
    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.12, 1.6, 8),
      new THREE.MeshBasicMaterial({ color: 0xffa726, transparent: true, opacity: 0.85 }));
    flame.rotation.x = Math.PI / 2;
    flame.position.z = 1.9;
    flame.name = 'flame';
    g.add(flame);
    return g;
  }

  /* ---------- 主视图 ---------- */
  class SimView {
    constructor(container) {
      this.container = container;
      this.renderer = new THREE.WebGLRenderer({ antialias: true });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      container.appendChild(this.renderer.domElement);
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x8fb8de);
      this.scene.fog = new THREE.Fog(0x8fb8de, 30000, 160000);

      this.camera = new THREE.PerspectiveCamera(55, 1, 0.5, 400000);
      this.camMode = 'free';       // chase | cockpit | missile | free
      this.freeCam = { theta: 0.6, phi: 1.15, radius: 90 };
      this.missileCam = { theta: 0.8, phi: 1.15, radius: 60 };  // 导弹视角：绕弹自由环绕
      this.cockpitLook = { yaw: 0, pitch: 0 };                  // 座舱视角：拖曳环视偏移

      this._buildWorld();

      /* 实体（导弹池 12 枚支持连发/对抗；对抗模式另有敌机网格与尾迹） */
      this.acMesh = makeAircraft();
      this.acMesh2 = makeAircraft();
      this.acMesh2.visible = false;
      this.scene.add(this.acMesh, this.acMesh2);
      this.mPool = [];
      this._ringIdx = 0;   // 槽位环形复用游标（池满时覆盖最旧）
      /* 不预创建槽位 —— 全部绑定时按【该弹寿命/推进时间】申请容量，
       * 否则前 12 发会吃到默认小容量（如 120D 7.75s 动力段被 5s 默认槽吃掉 → 黄色尾迹消失） */
      this.acTrail = new Trail(0xffffff, 4000, 0.5);
      this.acTrail2 = new Trail(0xff3020, 4000, 0.5);   // 敌机轨迹：红色
      this.scene.add(this.acTrail.line, this.acTrail2.line);

      /* LOS 连线 */
      const lg = new THREE.BufferGeometry();
      lg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      this.losLine = new THREE.Line(lg,
        new THREE.LineBasicMaterial({ color: 0xff3333, transparent: true, opacity: 0.35 }));
      this.losLine.frustumCulled = false;
      this.scene.add(this.losLine);
      this.losPool = [];   // 逐弹红色引导线池（每发弹连线 目标—导弹）

      /* 红色三角标记（导弹头顶；随相机距离缩放保持屏幕视觉大小） */
      const tc = document.createElement('canvas');
      tc.width = tc.height = 64;
      const t2 = tc.getContext('2d');
      t2.strokeStyle = '#ff2020';     // 空心三角
      t2.lineWidth = 6;
      t2.beginPath();
      t2.moveTo(32, 6); t2.lineTo(57, 52); t2.lineTo(7, 52);
      t2.closePath(); t2.stroke();
      this._triTex = new THREE.CanvasTexture(tc);
      this.triPool = [];
      for (let i = 0; i < 12; i++) this._makeTri();

      /* 敌机位置标记：绿色方框（状态数据见 eBox 浮动标签） */
      const bc = document.createElement('canvas');
      bc.width = 64; bc.height = 64;
      const b2 = bc.getContext('2d');
      b2.strokeStyle = '#2fe07a';
      b2.lineWidth = 5;
      b2.strokeRect(8, 8, 48, 48);
      this.enemyBox = new THREE.Sprite(new THREE.SpriteMaterial({
        map: new THREE.CanvasTexture(bc), transparent: true, depthTest: false
      }));
      this.enemyBox.renderOrder = 998;
      this.enemyBox.visible = false;
      this.scene.add(this.enemyBox);
      this.losOn = true;    // 红色引导线开关

      /* 特效 */
      this.burst = null;
      this.cpaMarker = null;

      window.addEventListener('resize', () => this.resize());
      this._bindMouse();
      this.resize();
    }

    _buildWorld() {
      const hemi = new THREE.HemisphereLight(0xffffff, 0x556b4f, 0.9);
      this.scene.add(hemi);
      const sun = new THREE.DirectionalLight(0xfff3d6, 0.8);
      sun.position.set(60000, 80000, 30000);
      this.scene.add(sun);

      /* 地面（程序化网格纹理） */
      const cv = document.createElement('canvas');
      cv.width = cv.height = 256;
      const c = cv.getContext('2d');
      c.fillStyle = '#4a6b45';
      c.fillRect(0, 0, 256, 256);
      c.strokeStyle = 'rgba(255,255,255,0.18)';
      c.strokeRect(0, 0, 256, 256);
      const tex = new THREE.CanvasTexture(cv);
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(300, 300);
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(300000, 300000),
        new THREE.MeshLambertMaterial({ map: tex }));
      ground.rotation.x = -Math.PI / 2;
      this.scene.add(ground);

      /* 远山（深度提示） */
      const mMat = new THREE.MeshLambertMaterial({ color: 0x6d7f6a });
      for (let i = 0; i < 40; i++) {
        const r = 2000 + Math.random() * 6000;
        const h = 600 + Math.random() * 2200;
        const m = new THREE.Mesh(new THREE.ConeGeometry(r, h, 6), mMat);
        const ang = Math.random() * Math.PI * 2;
        const dist = 25000 + Math.random() * 110000;
        m.position.set(Math.cos(ang) * dist, h / 2, Math.sin(ang) * dist);
        m.rotation.y = Math.random() * Math.PI;
        this.scene.add(m);
      }
    }

    _bindMouse() {
      const el = this.renderer.domElement;
      let drag = false, lx = 0, ly = 0;
      el.addEventListener('mousedown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; });
      window.addEventListener('mouseup', () => { drag = false; });
      window.addEventListener('mousemove', (e) => {
        if (!drag) return;
        const dx = e.clientX - lx, dy = e.clientY - ly;
        lx = e.clientX; ly = e.clientY;
        if (this.camMode === 'free' || this.camMode === 'missile') {
          /* 环绕旋转：自由视角绕我机、导弹视角绕导弹 */
          const cam = this.camMode === 'free' ? this.freeCam : this.missileCam;
          cam.theta -= dx * 0.005;
          cam.phi = Math.max(0.15, Math.min(1.5, cam.phi - dy * 0.005));
        } else if (this.camMode === 'cockpit') {
          /* 座舱环视：拖曳改变视线方向（偏航 ±150°、俯仰 ±70°） */
          const cl = this.cockpitLook;
          cl.yaw = Math.max(-2.6, Math.min(2.6, cl.yaw - dx * 0.005));
          cl.pitch = Math.max(-1.2, Math.min(1.2, cl.pitch - dy * 0.005));
        }
      });
      el.addEventListener('wheel', (e) => {
        if (this.camMode === 'free') {
          this.freeCam.radius = Math.max(15, Math.min(3000,
            this.freeCam.radius * (e.deltaY > 0 ? 1.1 : 0.9)));
        } else if (this.camMode === 'missile') {
          this.missileCam.radius = Math.max(10, Math.min(3000,
            this.missileCam.radius * (e.deltaY > 0 ? 1.1 : 0.9)));
        }
      }, { passive: true });
    }

    /* 显示开关 */
    setMarker(on) { this.triOn = !!on; }
    setLosVisible(on) { this.losOn = !!on; }

    /* 世界坐标 → 屏幕像素（浮动信息框定位用） */
    worldToScreen(v) {
      const p = v.clone().project(this.camera);
      return {
        x: (p.x * 0.5 + 0.5) * this.container.clientWidth,
        y: (-p.y * 0.5 + 0.5) * this.container.clientHeight,
        visible: p.z > -1 && p.z < 1
      };
    }

    /* 按需扩容：导弹槽位（上限 1024）；尾迹容量按【导弹寿命/制导时间】申请 ——
     * 采样 30Hz → 需 lifeS·30 点（600~6000 钳位）；动力段按各级推进时间单独小容量 */
    _makeMissileSlot(m) {
      const lifeS = (m && m.p && m.p.lifeS > 0) ? m.p.lifeS : 60;
      /* 尾迹容量按【预计存活时间】分配：航渡估算 = 弹目距离 / 平均闭合速度 × 1.5 余量，
       * 以寿命 lifeS 为上限（无 range0 时退回全寿命）——近距弹不再占用全程配额 */
      let estT = lifeS;
      if (m && m.range0 > 0 && m.vel) {
        const v0 = Math.max(m.vel.length(), 150);
        estT = Math.min(lifeS, (m.range0 / (v0 * 0.75)) * 1.5);
      }
      /* +20% 采样余量：时间加速/节流抖动下不丢点；容量上限 4000 控内存 */
      const coastPts = Math.min(Math.max(Math.ceil(estT * WT.CONST.TRAIL_HZ * 1.2), 400), 4000);
      let burnS = 5;
      if (m && m.p && Array.isArray(m.p.stages)) {
        burnS = m.p.stages.reduce((s, st) => s + (st.t || 0), 0) || 5;
      }
      const boostPts = Math.min(Math.max(Math.ceil(burnS * 30 * 1.2) + 30, 150), 2000);
      const mesh = makeMissile();
      mesh.visible = false;
      /* 导弹尾迹按动力段分色：黄=动力段，黑=出动力段（滑行） */
      const trailBoost = new Trail(0xffd21a, boostPts, 0.9);   // 动力段：黄
      const trailCoast = new Trail(0x111111, coastPts, 0.9);
      this.scene.add(mesh, trailBoost.line, trailCoast.line);
      const slot = { mesh, trail: trailBoost, trailCoast, bound: null };
      this.mPool.push(slot);
      return slot;
    }

    /* 逐弹红色引导线（2 点线段：导弹 → 目标） */
    _makeLos() {
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(6), 3));
      const line = new THREE.Line(g, new THREE.LineBasicMaterial({
        color: 0xff3333, transparent: true, opacity: 0.35
      }));
      line.frustumCulled = false;
      this.scene.add(line);
      this.losPool.push(line);
      return line;
    }

    /* 解析导弹的目标位置：拦截弹→其锁定弹；对抗弹→对方飞机；来袭弹→我机 */
    _targetPosOf(m, eng) {
      if (m.targetObj && m.targetObj.pos) return m.targetObj.pos;     // 对抗：弹对弹
      if (m.target && m.target.pos) return m.target.pos;
      if (m.isInterceptor && eng.missile && eng.missile.pos) return eng.missile.pos;
      if (m.side === 'enemy') {
        return (eng.player && eng.player.pos) ||
          (eng.aircraft && eng.aircraft.pos) || null;
      }
      if (m.side === 'player') {
        return (eng.enemy && eng.enemy.pos) ||
          (eng.aircraft && eng.aircraft.pos) || null;
      }
      return (eng.aircraft && eng.aircraft.pos) || null;              // 单向来袭弹 → 我机
    }

    _makeTri() {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({
        map: this._triTex, transparent: true, depthTest: false
      }));
      sp.renderOrder = 999;
      sp.visible = false;
      this.scene.add(sp);
      this.triPool.push(sp);
      return sp;
    }

    cycleCamera() {
      const modes = ['chase', 'cockpit', 'missile', 'free'];
      this.camMode = modes[(modes.indexOf(this.camMode) + 1) % modes.length];
      return this.camMode;
    }

    resize() {
      const w = this.container.clientWidth, h = this.container.clientHeight;
      this.renderer.setSize(w, h);
      this.camera.aspect = w / h;
      this.camera.updateProjectionMatrix();
    }

    /* 每帧同步 */
    update(eng, dt) {
      const ac = eng.aircraft, ms = eng.missile;

      /* 位置姿态（被击落的飞机隐藏） */
      this.acMesh.visible = !eng.playerDead;
      this.acMesh.position.copy(ac.pos);
      this.acMesh.quaternion.copy(ac.quat);
      /* 对抗模式：敌机（绿色方框位置标记 + eBox 状态浮动标签） */
      if (eng.enemy) {
        this.acMesh2.visible = !eng.enemyDead;
        this.acMesh2.position.copy(eng.enemy.pos);
        this.acMesh2.quaternion.copy(eng.enemy.quat);
        this.enemyBox.visible = !eng.enemyDead;
        this.enemyBox.position.copy(eng.enemy.pos);
        this.enemyBox.scale.setScalar(Math.max(
          this.camera.position.distanceTo(eng.enemy.pos) * 0.012, 0.8));
      } else {
        this.acMesh2.visible = false;
        this.enemyBox.visible = false;
      }

      /* 导弹池（连发/对抗）：稳定槽位绑定 —— 每发弹固定占用一个槽位直到结束，
       * 死弹保留尾迹、仅隐藏模型；槽满时环形复用最旧槽位（清轨迹后重新绑定）。
       * （旧实现按"活弹过滤下标"分配，死一枚全部错位 → 尾迹混乱） */
      this._tick = (this._tick || 0) + 1;
      const allMissiles = eng.missiles || [];
      let li = 0;   // 逐弹引导线槽位游标
      for (let i = 0; i < allMissiles.length; i++) {
        const m = allMissiles[i];
        if (m._slot == null) {
          if (!m.flying) continue;
          let slot = null;
          for (const s of this.mPool) { if (!s.bound) { slot = s; break; } }
          if (!slot && this.mPool.length < WT.CONST.MISSILE_POOL_CAP) slot = this._makeMissileSlot(m);
          if (!slot) {
            slot = this.mPool[this._ringIdx % this.mPool.length];
            this._ringIdx = (this._ringIdx + 1) % this.mPool.length;
            slot.trail.clear();
            if (slot.trailCoast) slot.trailCoast.clear();
            if (slot.bound) slot.bound._slot = null;
          }
          slot.bound = m;
          m._slot = slot;
        }
        const slot = m._slot;
        if (!m.flying) { slot.mesh.visible = false; continue; }
        slot.mesh.visible = true;
        slot.mesh.position.copy(m.pos);
        const dir = m.vel.clone().normalize();
        /* 注意：Object3D.lookAt 让 +Z 指向目标（仅相机是 -Z），
         * 而本导弹模型机头沿 -Z，故对准速度【反】方向 */
        slot.mesh.lookAt(m.pos.clone().addScaledVector(dir, -1));
        const flame = slot.mesh.getObjectByName('flame');
        if (flame) flame.visible = m.thrust > 0;
        /* 尾迹按【仿真时间 30Hz】采样（旧实现按帧奇偶——高刷屏 144Hz 采样翻倍，
         * 容量提前耗尽、旧段被环形滚动顶掉 = 轨迹"消失"；低刷屏永远复现不了） */
        if (m.t - (m._trailT == null ? -1 : m._trailT) >= 1 / WT.CONST.TRAIL_HZ) {
          m._trailT = m.t;
          if (m.thrust > 0) slot.trail.add(m.pos);        // 动力段：黄
          else slot.trailCoast.add(m.pos);                // 出动力段：黑
        }
        /* 逐弹红色引导线：连线 目标—导弹 */
        const tp = this._targetPosOf(m, eng);
        const los = this.losPool[li] || this._makeLos();
        li++;
        if (tp) {
          los.visible = this.losOn !== false;
          los.geometry.attributes.position.setXYZ(0, m.pos.x, m.pos.y, m.pos.z);
          los.geometry.attributes.position.setXYZ(1, tp.x, tp.y, tp.z);
          los.geometry.attributes.position.needsUpdate = true;
        } else {
          los.visible = false;
        }
      }
      for (const slot of this.mPool) {
        if (!slot.bound || !slot.bound.flying) slot.mesh.visible = false;
      }
      for (let i = li; i < this.losPool.length; i++) this.losPool[i].visible = false;

      /* 红色空心三角标记：所有【敌方】导弹上方（我方拦截弹不标），按需扩容（上限 1024） */
      let ti = 0;
      for (const m of (eng.missiles || [])) {
        if (ti >= WT.CONST.MISSILE_POOL_CAP) break;
        if (!m.flying || m.side === 'player') continue;
        const sp = this.triPool[ti] || this._makeTri();
        ti++;
        sp.visible = this.triOn;
        sp.position.copy(m.pos).add(new THREE.Vector3(0, 5, 0));
        const camDist = this.camera.position.distanceTo(m.pos);
        sp.scale.setScalar(Math.max(camDist * 0.02, 1.1));
      }
      for (; ti < this.triPool.length; ti++) this.triPool[ti].visible = false;

      /* 尾迹（节流：每 2 帧一次） */
      /* 飞机尾迹按【时间】30Hz 采样（与帧率解耦：高刷屏不超采样、低帧率不爆容量） */
      this._acTrailT = (this._acTrailT || 0) + (dt || 1 / 60);
      if (this._acTrailT >= 1 / WT.CONST.TRAIL_HZ) {
        this._acTrailT = 0;
        this.acTrail.add(ac.pos);
        if (eng.enemy) this.acTrail2.add(eng.enemy.pos);
      }

      /* LOS 连线（红色引导线，可开关；连到主威胁弹） */
      this.losLine.visible = this.losOn && !!(ms && ms.flying);
      const lp = this.losLine.geometry.attributes.position;
      lp.setXYZ(0, ac.pos.x, ac.pos.y, ac.pos.z);
      lp.setXYZ(1, ms ? ms.pos.x : ac.pos.x, ms ? ms.pos.y : ac.pos.y,
        ms ? ms.pos.z : ac.pos.z);
      lp.needsUpdate = true;
      this.losLine.geometry.computeBoundingSphere();

      /* 相机 */
      const a = WT.phys.attitudeAngles(ac.quat);
      const target = ac.pos.clone();
      const cam = this.camera;
      if (this.camMode === 'chase') {
        const back = new THREE.Vector3(0, 6, 34).applyQuaternion(ac.quat).add(ac.pos);
        cam.position.lerp(back, 1 - Math.exp(-8 * dt));
        cam.lookAt(target.clone().addScaledVector(a.fwd, 40).add(new THREE.Vector3(0, 4, 0)));
      } else if (this.camMode === 'cockpit') {
        const eye = new THREE.Vector3(0, 1.0, -1.5).applyQuaternion(ac.quat).add(ac.pos);
        cam.position.copy(eye);
        /* 视线 = 机体前向经（偏航, 俯仰）偏移（鼠标拖曳环视）后转世界系 */
        const cl = this.cockpitLook;
        const look = new THREE.Vector3(0, 0, -1)
          .applyAxisAngle(new THREE.Vector3(0, 1, 0), cl.yaw)
          .applyAxisAngle(new THREE.Vector3(1, 0, 0), cl.pitch)
          .applyQuaternion(ac.quat);
        cam.lookAt(eye.clone().addScaledVector(look, 200));
      } else if (this.camMode === 'missile' && ms) {
        /* 导弹视角：以导弹为中心自由环绕（拖拽旋转 / 滚轮缩放），随弹平移 */
        const mc = this.missileCam;
        const off = new THREE.Vector3(
          mc.radius * Math.sin(mc.phi) * Math.sin(mc.theta),
          mc.radius * Math.cos(mc.phi),
          mc.radius * Math.sin(mc.phi) * Math.cos(mc.theta));
        cam.position.copy(ms.pos).add(off);
        cam.lookAt(ms.pos);
      } else if (this.camMode === 'missile') {
        /* 无导弹时导弹视角回退追尾 */
        const back = new THREE.Vector3(0, 6, 34).applyQuaternion(ac.quat).add(ac.pos);
        cam.position.lerp(back, 1 - Math.exp(-8 * dt));
        cam.lookAt(target.clone().addScaledVector(a.fwd, 40).add(new THREE.Vector3(0, 4, 0)));
      } else {
        const fc = this.freeCam;
        const off = new THREE.Vector3(
          fc.radius * Math.sin(fc.phi) * Math.sin(fc.theta),
          fc.radius * Math.cos(fc.phi),
          fc.radius * Math.sin(fc.phi) * Math.cos(fc.theta));
        cam.position.copy(target).add(off);
        cam.lookAt(target);
      }

      /* 爆炸 / 脱靶标记动画 */
      if (this.burst) {
        this.burst.t += dt;
        const k = Math.min(this.burst.t / 1.0, 1);
        this.burst.flash.scale.setScalar(1 + k * 22);
        this.burst.flash.material.opacity = 0.9 * (1 - k);
        const pts = this.burst.pts;
        pts.geometry.attributes.position.needsUpdate = true;
        pts.material.opacity = 1 - k;
        if (k >= 1) {
          this.scene.remove(this.burst.flash, this.burst.pts);
          this.burst = null;
        }
      }

      this.renderer.render(this.scene, this.camera);
    }

    /* 命中爆炸 */
    spawnExplosion(pos) {
      if (WT.audio) WT.audio.explode();   // 爆炸音效（随视觉特效同点触发）
      const flash = new THREE.Mesh(new THREE.SphereGeometry(3, 12, 10),
        new THREE.MeshBasicMaterial({ color: 0xffcc66, transparent: true, opacity: 0.9 }));
      flash.position.copy(pos);
      const n = 220, arr = new Float32Array(n * 3), velArr = [];
      for (let i = 0; i < n; i++) {
        arr[i * 3] = pos.x; arr[i * 3 + 1] = pos.y; arr[i * 3 + 2] = pos.z;
        const v = new THREE.Vector3(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5)
          .normalize().multiplyScalar(15 + Math.random() * 55);
        velArr.push(v);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(arr, 3));
      const pts = new THREE.Points(g, new THREE.PointsMaterial({
        color: 0xff7733, size: 1.6, transparent: true, opacity: 1
      }));
      pts.frustumCulled = false;
      pts.userData.vel = velArr;
      pts.onBeforeRender = () => {
        const dt = 0.016;
        const p = pts.geometry.attributes.position;
        for (let i = 0; i < n; i++) {
          p.array[i * 3] += velArr[i].x * dt;
          p.array[i * 3 + 1] += (velArr[i].y - 20 * 0.016 * (i % 5)) * dt;
          p.array[i * 3 + 2] += velArr[i].z * dt;
        }
      };
      this.scene.add(flash, pts);
      this.burst = { flash, pts, t: 0 };
    }

    /* 脱靶点标记 */
    spawnCpaMarker(pos) {
      if (this.cpaMarker) this.scene.remove(this.cpaMarker);
      this.cpaMarker = new THREE.Mesh(new THREE.SphereGeometry(2.5, 10, 8),
        new THREE.MeshBasicMaterial({ color: 0x33ff88, wireframe: true }));
      this.cpaMarker.position.copy(pos);
      this.scene.add(this.cpaMarker);
    }

    reset() {
      this.acTrail.clear();
      if (this.acTrail2) {
        this.acTrail2.clear();
        this.acMesh2.visible = false;
        this.enemyBox.visible = false;
      }
      for (const slot of this.mPool) {
        slot.trail.clear();
        if (slot.trailCoast) slot.trailCoast.clear();
        slot.mesh.visible = false;
        slot.bound = null;
      }
      if (this.burst) {
        this.scene.remove(this.burst.flash, this.burst.pts);
        this.burst = null;
      }
      if (this.cpaMarker) { this.scene.remove(this.cpaMarker); this.cpaMarker = null; }
    }
  }

  WT.SimView = SimView;
})(window.WT);
