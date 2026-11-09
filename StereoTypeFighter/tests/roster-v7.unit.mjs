// Roster + story checks for all 20 fighters (headless).
import { ROSTER } from '../roster-v7.js';
import { createMatch, stepMatch, aiInput } from '../combat-v7.js';
import { getScene, sceneId, ladderFor, SCENES } from '../story-v7.js';

let fails = 0;
const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };

ok(ROSTER.length === 20, `roster has 20 fighters (${ROSTER.length})`);
ok(new Set(ROSTER.map(r => r.id)).size === 20, 'fighter ids unique');

// every fighter plays 2 matches (as P1 and P2) against rotating opponents, AI vs AI, no NaN and the round resolves
let finished = 0, nan = 0, total = 0;
ROSTER.forEach((a, i) => {
  for (const off of [1, 7]) {
    const b = ROSTER[(i + off) % ROSTER.length]; total++;
    const m = createMatch([a, b]);
    let seed = 99 + i * 7 + off; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let f = 0; f < 60 * 240 && m.phase !== 'over'; f++) {
      stepMatch(m, [aiInput(m, 0, 'hard', rnd), aiInput(m, 1, 'hard', rnd)]);
      if (m.fighters.some(x => !Number.isFinite(x.x) || !Number.isFinite(x.y) || !Number.isFinite(x.hp))) { nan++; break; }
    }
    if (m.phase === 'over') finished++;
  }
});
ok(nan === 0, 'no NaN positions or hp across 40 matches');
ok(finished >= total - 2, `matches finish (${finished}/${total})`);

// each fighter: prologue, ending, a 4-fight ladder, and pre/post scenes with real lines for every ladder step
let sceneBad = 0;
for (const r of ROSTER) {
  const lad = ladderFor(r.id, ROSTER);
  if (lad.length !== 4 || lad.includes(r.id)) sceneBad++;
  for (const id of [sceneId.prologue(r.id), sceneId.ending(r.id)]) { const s = getScene(id); if (!s || s.lines.length < 3) sceneBad++; }
  for (const o of lad) for (const id of [sceneId.pre(r.id, o), sceneId.post(r.id, o), sceneId.post(o, r.id)]) {
    const s = getScene(id); if (!s || s.lines.length < 3 || s.lines.some(l => !l.text || /\{opp\}/.test(l.text) || l.text.includes('undefined'))) { sceneBad++; console.log('bad', id); }
  }
}
ok(sceneBad === 0, 'every fighter has valid prologue, ending, ladder and pre/post scenes');
ok(ROSTER.every(r => r.moves.special.name && r.superName && r.moves.super.hits.length >= 5), 'all fighters have special + super data');
console.log(fails ? `\n${fails} check(s) failed` : '\nAll roster checks passed');
process.exit(fails ? 1 : 0);
