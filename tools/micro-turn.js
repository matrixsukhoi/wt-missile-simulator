/* micro-turn.js — 转向方向符号实证：bank ±90 + 拉杆 → 机头偏转方向 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
global.window = global;
for (const f of ['lib/three.min.js', 'js/config.js', 'js/missiles.js', 'js/physics.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}
const WT = global.WT, P = WT.phys;

function trial(rollCmd) {
  const ac = new P.Aircraft(
    { mach: 1, nMaxPos: 9, nMaxNeg: -4, rollRateMaxDeg: 180 },
    new THREE.Vector3(0, 5000, 0));
  for (let i = 0; i < 250; i++) ac.step(0.01, { pitch: 0, roll: rollCmd });
  const bank = P.attitudeAngles(ac.quat).bank * 57.3;
  const f0 = P.attitudeAngles(ac.quat).fwd.x;
  for (let i = 0; i < 100; i++) ac.step(0.01, { pitch: 1, roll: 0 });
  const f1 = P.attitudeAngles(ac.quat).fwd.x;
  console.log(`rollCmd=${rollCmd > 0 ? '+' : ''}${rollCmd} → bank=${bank.toFixed(0)}° ` +
    `拉杆后 fwd.x: ${f0.toFixed(3)} → ${f1.toFixed(3)} = 机头向${f1 - f0 > 0 ? '右' : '左'}偏`);
}
trial(1);
trial(-1);
