/* scenario-matrix.js — 战术效能矩阵：不同来袭条件下各规避战术的生存率
 * 运行：node tools/scenario-matrix.js
 * 输出命中率表，用于快速判断"什么条件下该怎么躲"。 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
global.window = global;
for (const f of ['lib/three.min.js', 'js/config.js', 'js/missiles.js', 'js/physics.js', 'js/aero.js', 'js/dez.js', 'js/tactics.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}
const WT = global.WT;
const P = WT.phys;
const preset = WT.MISSILE_PRESETS.aim9l;

const TACTICS = ['steadyTurn', 'tail', 'tailLevel', 'dez', 'perp'];
const ASPECTS = [0, 90, 180];
const DISTS = [3000, 6000, 10000, 15000];
const N = 10;

function mkCfg(aspect, dist) {
  return {
    missile: {
      mass0: preset.mass0, caliber: preset.caliber, wingMult: preset.wingMult,
      cxK: preset.cxK, stages: preset.stages.map(s => ({ ...s })),
      nMaxG: preset.nMaxG, pnGain: preset.pnGain, fuseR: preset.fuseR,
      seekerRateMaxDeg: preset.seekerRateMaxDeg,
      minDist: 30, lifeS: preset.lifeS, vMax: preset.vMax, maxMach: preset.maxMach,
      loft: false, loftAngleDeg: 0
    },
    aircraft: { ...WT.DEFAULTS.aircraft },
    scenario: {
      ...WT.DEFAULTS.scenario,
      aspectDeg: aspect, launchDistM: dist
    }
  };
}

console.log(`导弹: ${preset.name} (初速 Ma${WT.DEFAULTS.scenario.launchMach}) | 飞机: Ma${WT.DEFAULTS.aircraft.mach} +${WT.DEFAULTS.aircraft.nMaxPos}G | 每格 ${N} 发`);
const aspectNames = { 0: '迎头', 90: '侧向', 180: '尾追' };
const head = '战术\\场景'.padEnd(22) +
  ASPECTS.map(a => DISTS.map(d => `${aspectNames[a]}${d / 1000}km`.padStart(9)).join('')).join('');
console.log(head);

for (const tid of TACTICS) {
  let line = (WT.TACTICS.find(t => t.id === tid).name).padEnd(22);
  for (const a of ASPECTS) {
    for (const d of DISTS) {
      const rs = P.runBatch(mkCfg(a, d), (rng) => WT.tactics.create(tid, rng), N, 42);
      /* 损失 = 被命中 + 规避中撞地（对飞行员而言都是失败） */
      const losses = rs.filter(r => r.hit || r.result === 'target_crash').length;
      line += `${losses}/${N}`.padStart(9);
    }
  }
  console.log(line);
}
console.log('\n（表中为损失数 = 命中+撞地，越低表示该战术在该场景越有效）');
