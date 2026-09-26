#!/usr/bin/env node
/* ============================================================
 * tools/blkx2json.js —— War Thunder datamine .blkx → 本模拟器导弹预设 JSON
 *
 * 数据源：WTunpacker 解包的 rocketguns/*.blkx（文本 BLK 格式：
 *         key:type = value，块为 name { ... }，类型 b/i/r/t/pN）
 * 输出：  与 WT.MISSILE_PRESETS 同构的 JSON（可直接对照/导入）
 *
 * 用法：
 *   node tools/blkx2json.js [srcDir] [outJson] [--keys aim9l,r77_1,...]
 *   默认 srcDir = E:\code\WTunpacker\2.59.0.7\aces\gamedata\weapons\rocketguns
 *   默认 outJson = data/missiles_2.59.0.7.json
 *
 * 字段映射（datamine → 模拟器 schema）见 toPreset()。
 * ============================================================ */
'use strict';
const fs = require('fs');
const path = require('path');

const DEFAULT_SRC = 'E:\\code\\WTunpacker\\2.59.0.7\\aces\\gamedata\\weapons\\rocketguns';

/* 我方预设键（config.js + missiles.js 的完整集合） */
const PRESET_KEYS = [
  'aim9l', 'pl8', 'r60', 'aim120a',
  'aim120d', 'pl12', 'pl12a', 'r77', 'r77_1', 'mica_em', 'derby',
  'aim9m', 'aim7m', 'r73', 'r27r', 'r27t', 'pyton4', 'aam3', 'aam4',
  'pl5e2', 'pl9', 'skyflash', 'r3r', 'r27et', 'pl8b', 'r27er',
  'r60m', 'r13m1', 'magic2', 'aim9p4', 'pyton3', 'pl5b', 'aim4g',
  'r3s', 'aim9b', 'aim9d', 'aim9h', 'aim9j', 'magic', 'firestreak',
  'shafrir2', 'pl2', 'pl5c', 'pl7', 'pl11', 'aim4f', 'aim26b',
  'r60mk', 'r13m', 'fakour90', 'aim7e2', 'skyflash_dogfight',
  'aim120c4', 'mica_ir', 'redtop', 'r24t'
];

/* 键名历史拼写修正（pyton→python 等），匹配时按修正后的名字找文件 */
const KEY_ALIAS = { pyton3: 'python3', pyton4: 'python4' };

/* ---------- 文本 BLK 解析 ---------- */
function parseValue(type, raw) {
  const v = raw.trim();
  if (type === 'b') return v === 'true';
  if (type === 'i') return parseInt(v, 10);
  if (type === 'r') return parseFloat(v);
  if (type === 't') return v.replace(/^"|"$/g, '');
  if (/^p\d+$/.test(type)) return v.split(',').map((x) => parseFloat(x));
  return v;
}

function parseBlk(text) {
  const root = {};
  const stack = [{ name: '', obj: root }];
  for (let raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    if (line === '}') { if (stack.length > 1) stack.pop(); continue; }
    if (line.endsWith('{')) {
      const name = line.slice(0, -1).trim();
      const parent = stack[stack.length - 1].obj;
      const blk = {};
      /* 同名块（table0/table1…）保留首个；同名简单键后写覆盖前写（BLK 语义） */
      if (!parent[name]) parent[name] = blk;
      stack.push({ name, obj: parent[name] });
      continue;
    }
    const m = line.match(/^([A-Za-z0-9_]+):([A-Za-z0-9]+)\s*=\s*(.*)$/);
    if (m) {
      stack[stack.length - 1].obj[m[1]] = parseValue(m[2], m[3]);
    }
  }
  return root;
}

/* ---------- 映射：datamine → 模拟器预设 schema ---------- */
function toPreset(blk, key, fileName) {
  const r = blk.rocket || {};
  const g = r.guidance || {};
  const ga = g.guidanceAutopilot || {};
  const seeker = g.opticalSeeker || g.radarSeeker || {};
  const n = (x) => (typeof x === 'number' && isFinite(x) ? x : undefined);
  const mass0 = n(r.mass), massEnd = n(r.massEnd);
  return {
    key,
    source: fileName,
    name: `${key}（datamine 2.59.0.7）`,
    mass0: n(mass0),
    massEnd: n(massEnd),
    caliber: n(r.caliber),
    cxK: n(r.CxK),
    wingMult: n(r.wingAreaMult),
    stages: [{
      t: n(r.timeFire),
      thrust: n(r.force),
      massLost: (mass0 != null && massEnd != null) ? +(mass0 - massEnd).toFixed(3) : undefined
    }],
    nMaxG: n(r.loadFactorMax),
    pnGain: n(ga.propNavMult),
    fuseR: n(r.explosionPatchRadius),
    seekerRateMaxDeg: n(seeker.rateMax),
    lifeS: n(r.timeLife),
    timeOutS: n(ga.timeOut) != null ? n(ga.timeOut) : n(ga.timeToGain),
    loft: !!ga.loftEnabled,
    loftAngleDeg: n(ga.loftElevation),
    maxMach: n(r.machMax),
    minDist: n(r.minDistance),
    lengthM: n(r.length),
    finMomentArmM: n(r.distFromCmToStab),
    finAoaHorRad: n(r.finsAoaHor),
    finAoaVerRad: n(r.finsAoaVer),
    finsLatAccelG: n(r.finsLatAccel),
    irSeeker: r.guidanceType === 'optical',
    guidanceType: r.guidanceType,
    pid: {
      p: n(ga.accelControlProp), i: n(ga.accelControlIntg),
      d: n(ga.accelControlDiff), iLim: n(ga.accelControlIntgLim),
      baseIndSpeedKmh: n(ga.baseIndSpeed)
    }
  };
}

/* ---------- 键名 → blkx 文件：精确 > 包含（最短优先）> 令牌全含 ---------- */
function norm(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, ''); }

function matchFile(key, files) {
  const cands = [key, KEY_ALIAS[key]].filter(Boolean);
  for (const c of cands) {
    const want = norm(c);
    let best = null, bestScore = Infinity;
    for (const f of files) {
      if (/_default|_switzerland|_tornado/i.test(f)) continue;   // 变体文件跳过
      const fn = norm(f.replace(/\.blkx$/i, ''));
      if (fn === want) return f;                       // 精确命中
      if (fn.includes(want)) {
        const score = fn.length - want.length;         // 最短优先（r60 不吃 r60m）
        if (score < bestScore) { best = f; bestScore = score; }
      }
    }
    if (best) return best;
    /* 令牌回退：键名所有段均出现在文件名（skyflash_dogfight → uk_skyflash_aim_7_dogfight） */
    const tokens = c.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean);
    for (const f of files) {
      const fl = f.toLowerCase().replace(/\.blkx$/i, '');
      if (tokens.every((t) => fl.includes(t))) return f;
    }
  }
  return null;
}

/* ---------- 主流程 ---------- */
function main() {
  const args = process.argv.slice(2);
  const flags = args.filter((a) => a.startsWith('--'));
  const pos = args.filter((a) => !a.startsWith('--'));
  const srcDir = pos[0] || DEFAULT_SRC;
  const outJson = pos[1] || path.join(__dirname, '..', 'data', 'missiles_2.59.0.7.json');
  const onlyFlag = flags.find((a) => a.startsWith('--keys='));
  const keys = onlyFlag
    ? onlyFlag.slice(7).split(',').map((s) => s.trim()).filter(Boolean)
    : PRESET_KEYS;

  if (!fs.existsSync(srcDir)) {
    console.error('数据源不存在：' + srcDir);
    process.exit(1);
  }
  const files = fs.readdirSync(srcDir).filter((f) => /\.blkx$/i.test(f));
  const out = {};
  const unmatched = [];
  for (const key of keys) {
    const file = matchFile(key, files);
    if (!file) { unmatched.push(key); continue; }
    const text = fs.readFileSync(path.join(srcDir, file), 'utf8');
    out[key] = toPreset(parseBlk(text), key, file);
  }
  fs.mkdirSync(path.dirname(outJson), { recursive: true });
  fs.writeFileSync(outJson, JSON.stringify(out, null, 2), 'utf8');
  console.log(`转换完成：${Object.keys(out).length}/${keys.length} 枚 → ${outJson}`);
  if (unmatched.length) console.log('未匹配键（文件名对不上，需 --map 人工映射）：' + unmatched.join(', '));
  /* 简要校验：打印 3 枚样本关键字段 */
  for (const k of ['aim9l', 'aim120d', 'r77_1']) {
    const p = out[k];
    if (p) console.log(`  ${k}: mass0=${p.mass0} t=${p.stages[0].t}s thrust=${p.stages[0].thrust} ` +
      `nMaxG=${p.nMaxG} pn=${p.pnGain} lifeS=${p.lifeS} IR=${p.irSeeker}`);
  }
}

main();
