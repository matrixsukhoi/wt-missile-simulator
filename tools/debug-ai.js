/* debug-ai.js — 敌机恢复状态机时间线 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const root = path.join(__dirname, '..');
global.window = global;
for (const f of ['lib/three.min.js', 'js/config.js', 'js/missiles.js', 'js/physics.js', 'js/aero.js', 'js/dez.js', 'js/tactics.js',
  'js/duel.js']) {
  vm.runInThisContext(fs.readFileSync(path.join(root, f), 'utf8'), { filename: f });
}
const WT = global.WT;
const duelZ = new WT.DuelSim({
  aircraft: Object.assign({}, WT.DEFAULTS.aircraft),
  engine: 'dynamic',
  playerMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
  enemyMissile: Object.assign({}, WT.MISSILE_PRESETS.aim9l),
  playerInvincible: true, enemyInvincible: true,
  enemy: { fireInterval: 60, offense: 'toward', evasion: 'dez' },
  startDist: 12000, targetAltM: 5000
});
duelZ.fire('player');
let last = -1;
for (let i = 0; i < 12000 && !duelZ.done; i++) {
  const cmd = duelZ._enemyCmd(0.01);
  duelZ.enemy.step(0.01, cmd);
  duelZ.player.step(0.01, { pitch: 0, roll: 0, sep: 1 });
  for (const m of duelZ.missiles) {
    if (!m.flying) continue;
    m.step(0.01, duelZ.player, 'dynamic');
    if (m.pos.y <= 5 || m.vel.length() < 180) m.flying = false;
  }
  duelZ.t += 0.01;
  if (duelZ.t - last >= 1) {
    last = duelZ.t;
    const a = WT.phys.attitudeAngles(duelZ.enemy.quat);
    const gam = Math.asin(Math.max(-1, Math.min(1, a.fwd.y))) * 57.3;
    const fwdH = new THREE.Vector3(a.fwd.x, 0, a.fwd.z);
    if (fwdH.lengthSq() < 1e-8) fwdH.set(0, 0, -1); else fwdH.normalize();
    const rightH = new THREE.Vector3().crossVectors(fwdH, new THREE.Vector3(0, 1, 0));
    const to = new THREE.Vector3().subVectors(duelZ.player.pos, duelZ.enemy.pos);
    const az = Math.atan2(to.dot(rightH), to.dot(fwdH)) * 57.3;
    console.log(`t=${duelZ.t.toFixed(0).padStart(3)}s ph=${duelZ.enemyPhase.padEnd(7)} ` +
      `y=${duelZ.enemy.pos.y.toFixed(0).padStart(6)} gam=${gam.toFixed(0).padStart(4)}° ` +
      `bank=${(a.bank * 57.3).toFixed(0).padStart(4)}° az=${az.toFixed(0).padStart(4)}° ` +
      `cmdP=${cmd.pitch.toFixed(2).padStart(5)} cmdR=${cmd.roll.toFixed(2).padStart(5)}`);
    if (duelZ.t > 90) break;
  }
}
console.log('final:', duelZ.enemyPhase, duelZ.enemy.pos.y.toFixed(0));
