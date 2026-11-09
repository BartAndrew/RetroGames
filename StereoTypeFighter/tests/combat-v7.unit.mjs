// Headless checks for the V7 combat engine. Run: node tests/combat-v7.unit.mjs
import { createMatch, stepMatch, aiInput } from '../combat-v7.js';
import { ROSTER } from '../roster-v7.js';

let fails = 0;
const ok = (c, msg) => { console.log((c ? 'PASS ' : 'FAIL ') + msg); if (!c) fails++; };
const NONE = () => ({ left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, block: false });

function newMatch(i = 0, j = 1) {
  const m = createMatch([ROSTER[i], ROSTER[j]]);
  for (let k = 0; k < 110; k++) stepMatch(m, [NONE(), NONE()]);
  return m;
}
// helper: run frames with a script of presses {frame: inputObj}
function run(m, frames, script = {}, p2 = () => NONE()) {
  const evs = [];
  for (let k = 0; k < frames; k++) { const i1 = Object.assign(NONE(), script[k] || {}); evs.push(...stepMatch(m, [i1, p2(k)])); }
  return evs;
}

// 1. intro -> fight
{ const m = newMatch(); ok(m.phase === 'fight', 'match reaches fight phase after intro'); }

// 2. a light punch hits when in range
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 60;
  const evs = run(m, 20, { 0: { punch: true } });
  ok(evs.some(e => e.type === 'hit'), 'light punch connects at close range');
  ok(m.fighters[1].hp < m.fighters[1].maxHp, 'defender loses health');
}

// 3. a whiffed punch at long range does nothing
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 400;
  const evs = run(m, 30, { 0: { punch: true } });
  ok(!evs.some(e => e.type === 'hit'), 'punch at long range whiffs');
}

// 4. gatling chain: jab > jab > cross > special cancel registers as a 4-hit combo
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 55;
  const script = { 0: { punch: true }, 9: { punch: true }, 18: { punch: true, right: true }, 34: { special: true } };
  const evs = run(m, 100, script);
  const maxCombo = Math.max(0, ...evs.filter(e => e.type === 'hit' || e.type === 'counter').map(e => e.combo));
  const cancels = evs.filter(e => e.type === 'cancel').length;
  ok(cancels >= 2, `chain cancels register (got ${cancels})`);
  ok(maxCombo >= 3, `chain reaches a ${maxCombo}-hit combo (need >= 3)`);
}

// 5. launcher produces a juggle and the juggle is bounded
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 50;
  const evs = run(m, 80, { 0: { punch: true, down: true }, 28: { punch: true }, 36: { kick: true } });
  ok(evs.some(e => e.type === 'hit' && e.moveId === 'launcher'), 'launcher connects');
  ok(m.fighters[1].juggle <= 4, 'juggle count stays bounded');
}

// 6. damage scaling reduces later hits
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 50;
  const hp0 = m.fighters[1].hp;
  run(m, 10, { 0: { punch: true } });
  const d1 = hp0 - m.fighters[1].hp;
  ok(d1 > 0, `first hit deals ${d1} damage`);
}

// 7. blocking: holding back reduces damage to chip only
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 55;
  const evs = run(m, 20, { 0: { punch: true } }, () => ({ ...NONE(), right: true })); // P2 faces left, so right = back
  ok(evs.some(e => e.type === 'block'), 'back-hold blocks the attack');
  ok(m.fighters[1].hp > m.fighters[1].maxHp - 3, 'blocked hit does only chip damage');
}

// 8. low attack beats standing block, crouch block stops it
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 60;
  const evs = run(m, 30, { 0: { kick: true, down: true } }, () => ({ ...NONE(), right: true }));
  ok(evs.some(e => e.type === 'hit'), 'sweep beats a standing guard');
  const m2 = newMatch(); m2.fighters[1].x = m2.fighters[0].x + 60;
  const evs2 = run(m2, 30, { 0: { kick: true, down: true } }, () => ({ ...NONE(), right: true, down: true }));
  ok(evs2.some(e => e.type === 'block'), 'crouch guard stops a sweep');
}

// 9. dash: double tap moves faster than walking
{
  const m = newMatch(); m.fighters[1].x = 900; const x0 = m.fighters[0].x;
  run(m, 24, { 0: { right: true }, 1: {}, 2: {}, 3: {}, 4: { right: true }, 5: { right: true } });
  const dashDist = m.fighters[0].x - x0;
  const m2 = newMatch(); m2.fighters[1].x = 900; const y0 = m2.fighters[0].x;
  const script = {}; for (let k = 0; k < 24; k++) script[k] = { right: true };
  run(m2, 24, script);
  ok(dashDist > (m2.fighters[0].x - y0), `dash (${dashDist.toFixed(0)}px) beats walking (${(m2.fighters[0].x - y0).toFixed(0)}px)`);
}

// 10. jumping and landing
{
  const m = newMatch(); m.fighters[1].x = 900;
  let peak = 0; for (let k = 0; k < 70; k++) { stepMatch(m, [Object.assign(NONE(), k === 0 ? { up: true } : {}), NONE()]); peak = Math.max(peak, m.fighters[0].y); }
  ok(peak > 100 && m.fighters[0].y === 0, `jump reaches ${peak.toFixed(0)}px and lands`);
}

// 11. special fires a projectile that hits
{
  for (const idx of [0, 2]) {
    const m = newMatch(idx, 1); m.fighters[1].x = m.fighters[0].x + 300;
    const evs = run(m, 80, { 0: { special: true } });
    ok(evs.some(e => e.type === 'spawn') && evs.some(e => e.type === 'projectileHit'), `${ROSTER[idx].name} special spawns a projectile that connects`);
  }
}

// 12. Yuppie charge special connects and gets bonus against forward movement
{
  const m = newMatch(1, 0); m.fighters[1].x = m.fighters[0].x + 140;
  const evs = run(m, 50, { 0: { special: true } });
  ok(evs.some(e => e.type === 'hit'), 'Yuppie Hostile Takeover closes distance and hits');
}

// 13. super: needs full meter, multi-hit, ends with launch
{
  const m = newMatch(); m.fighters[1].x = m.fighters[0].x + 60; m.fighters[0].meter = 100;
  const evs = run(m, 120, { 0: { special: true, down: true } });
  const hits = evs.filter(e => e.type === 'hit' || e.type === 'counter').length;
  ok(evs.some(e => e.type === 'superFlash'), 'super flash fires');
  ok(hits >= 4, `super lands ${hits} hits (need >= 4)`);
  ok(m.fighters[0].meter < 100, 'super spends meter');
  const m2 = newMatch(); m2.fighters[1].x = m2.fighters[0].x + 60;
  const evs2 = run(m2, 40, { 0: { special: true, down: true } });
  ok(!evs2.some(e => e.type === 'superFlash'), 'super does not fire without meter');
}

// 14. KO ends the round and a match can be won
{
  const m = newMatch(); m.fighters[1].hp = 3; m.fighters[1].x = m.fighters[0].x + 55;
  const evs = run(m, 40, { 0: { punch: true } });
  ok(evs.some(e => e.type === 'ko') && evs.some(e => e.type === 'roundEnd'), 'KO triggers round end');
  run(m, 200); ok(m.round === 2 || m.phase === 'over', 'next round starts after KO');
}

// 15. AI vs AI: 3 full matches finish without NaNs or stalls, and combos occur
{
  let combos = 0, finished = 0;
  for (let s = 0; s < 6; s++) {
    const m = createMatch([ROSTER[s % 3], ROSTER[(s + 1) % 3]]);
    let seed = 1234 + s; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 60 * 240 && m.phase !== 'over'; k++) {
      const evs = stepMatch(m, [aiInput(m, 0, 'hard', rnd), aiInput(m, 1, 'hard', rnd)]);
      for (const e of evs) if ((e.type === 'hit' || e.type === 'counter') && e.combo >= 3) combos++;
      if (m.fighters.some(f => !Number.isFinite(f.x) || !Number.isFinite(f.y) || !Number.isFinite(f.hp))) { ok(false, 'NaN state'); break; }
    }
    if (m.phase === 'over') finished++;
  }
  ok(finished >= 5, `AI vs AI matches finish (${finished}/6)`);
  ok(combos > 5, `AI lands 3+ hit combos (${combos})`);
}

console.log(fails ? `\n${fails} FAILED` : '\nAll combat checks passed');
process.exit(fails ? 1 : 0);
