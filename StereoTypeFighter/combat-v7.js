// StereoType Fighter V7 combat engine.
// Deterministic fixed-step (60 fps) simulation, no DOM access, so it can be unit-tested in Node.
// Flow design: light > light > heavy > launcher > special > super gatling chains, hit-stop,
// juggles with decay, counter hits, damage scaling, dashes, and momentum-based movement.

export const FPS = 60;
export const STAGE = { width: 960, floorY: 470, wallL: 40, wallR: 920 };
const GRAV = 0.62;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const approach = (v, t, a) => (v < t ? Math.min(v + a, t) : Math.max(v - a, t));

// ---------------------------------------------------------------- move data
const M = o => ({
  height: 'mid', rank: 1, hitstun: 16, blockstun: 9, kb: 4, launch: 0, hitstop: 6,
  meter: 6, advance: 0, dmg: 5, knockdown: false, air: false,
  hb: { x: 20, y: 78, w: 60, h: 32 }, startup: 5, active: 3, recovery: 9, ...o,
});

export function baseMoves(t = {}) {
  const m = {
    lp: M({ name: 'Jab', rank: 1, startup: 4, active: 3, recovery: 8, dmg: 4, hitstun: 14, blockstun: 8, kb: 3, advance: 1.2, hb: { x: 20, y: 78, w: 52, h: 30 } }),
    lk: M({ name: 'Low Kick', rank: 2, startup: 6, active: 4, recovery: 10, dmg: 5, hitstun: 16, blockstun: 9, kb: 4, advance: 1.5, hb: { x: 18, y: 36, w: 64, h: 34 } }),
    hp: M({ name: 'Cross', rank: 3, startup: 9, active: 4, recovery: 16, dmg: 9, hitstun: 20, blockstun: 11, kb: 8, advance: 3, hitstop: 8, hb: { x: 20, y: 74, w: 72, h: 40 } }),
    hk: M({ name: 'Axe Kick', rank: 3, startup: 11, active: 5, recovery: 18, dmg: 10, hitstun: 22, blockstun: 12, kb: 8, advance: 2.5, height: 'high', hitstop: 8, hb: { x: 12, y: 86, w: 78, h: 44 } }),
    launcher: M({ name: 'Rising Uppercut', rank: 4, startup: 8, active: 5, recovery: 22, dmg: 8, hitstun: 30, blockstun: 14, kb: 2, launch: 12.8, advance: 1, hitstop: 9, hb: { x: 8, y: 66, w: 54, h: 80 } }),
    sweep: M({ name: 'Sweep', rank: 4, startup: 9, active: 5, recovery: 22, dmg: 7, hitstun: 30, blockstun: 12, kb: 6, height: 'low', knockdown: true, hitstop: 8, hb: { x: 14, y: 0, w: 88, h: 26 } }),
    airP: M({ name: 'Jump Punch', rank: 2, air: true, startup: 4, active: 9, recovery: 6, dmg: 6, hitstun: 18, blockstun: 10, kb: 4, height: 'high', hb: { x: 14, y: 40, w: 58, h: 44 } }),
    airK: M({ name: 'Jump Kick', rank: 2, air: true, startup: 6, active: 10, recovery: 6, dmg: 8, hitstun: 20, blockstun: 11, kb: 5, height: 'high', hb: { x: 12, y: 8, w: 66, h: 46 } }),
    special: M({ name: 'Special', rank: 5, startup: 12, active: 4, recovery: 24, dmg: 12, hitstun: 24, blockstun: 14, kb: 9, hitstop: 9, knockdown: true, hb: { x: 14, y: 70, w: 84, h: 52 }, type: 'strike' }),
    super: M({ name: 'Super', rank: 6, startup: 16, active: 1, recovery: 30, dmg: 5, hitstun: 20, blockstun: 12, kb: 1.5, hitstop: 4, type: 'super', cost: 100,
      hits: [0, 6, 12, 18, 24], finisher: { dmg: 20, launch: 11, kb: 12 }, advance: 2.2, hb: { x: 10, y: 50, w: 100, h: 80 } }),
  };
  for (const k of Object.keys(t)) m[k] = { ...m[k], ...t[k], hb: { ...m[k].hb, ...(t[k].hb || {}) } };
  return m;
}

// ----------------------------------------------------------- fighter creation
export function createFighter(def, side) {
  return {
    def, side, x: side === 0 ? 330 : 630, y: 0, vx: 0, vy: 0, facing: side === 0 ? 1 : -1,
    hp: def.hp || 1000, maxHp: def.hp || 1000, meter: 0,
    state: 'idle', t: 0, move: null, moveId: null, moveT: 0, hitDone: false, lastHitFrame: -1,
    connected: 'none', stun: 0, freeze: 0, combo: 0, comboDmg: 0, juggle: 0, chain: 0,
    buf: [], prev: {}, tapT: { left: -99, right: -99 }, tapRel: { left: true, right: true }, frame: 0,
    dashDir: 0, airUsed: false, invuln: 0, wins: 0, anim: 'idle', animT: 0, animP: 0, phase: 'idle',
    crouching: false, blocking: false, lastResult: null, aiState: { queue: [], timer: 0, mode: 'neutral' },
  };
}

const fwdHeld = (f, i) => (f.facing === 1 ? i.right : i.left);
const backHeld = (f, i) => (f.facing === 1 ? i.left : i.right);
const isActionable = f => ['idle', 'walk', 'crouch', 'block'].includes(f.state);
const moveTotal = mv => mv.startup + mv.active + mv.recovery;

function setAnim(f, name) { if (f.anim !== name) { f.anim = name; f.animT = 0; } }

function startMove(f, id) {
  const mv = f.def.moves[id];
  f.move = mv; f.moveId = id; f.moveT = 0; f.hitDone = false; f.connected = 'none'; f.lastHitFrame = -1;
  f.state = 'attack'; f.crouching = id === 'launcher' || id === 'sweep';
  if (id === 'super') { f.meter = Math.max(0, f.meter - 100); f.invuln = mv.startup + 6; }
  if (!mv.air && id !== 'special' && id !== 'super') f.vx *= 0.3;
  setAnim(f, id);
}

// pick the next attack from the input buffer; returns move id or null
function chooseAttack(f, o, grounded, cancelFrom) {
  for (const b of f.buf) {
    let id = null;
    if (!grounded) {
      if (f.airUsed) continue;
      if (b.btn === 'punch') id = 'airP'; else if (b.btn === 'kick') id = 'airK';
    } else if (b.btn === 'special') {
      id = b.down && f.meter >= 100 ? 'super' : 'special';
    } else if (b.btn === 'punch') {
      id = b.down ? 'launcher' : b.fwd ? 'hp' : 'lp';
    } else if (b.btn === 'kick') {
      id = b.down ? 'sweep' : b.fwd ? 'hk' : 'lk';
    }
    if (!id) continue;
    if (cancelFrom) {
      const cur = cancelFrom, nxt = f.def.moves[id];
      const rapid = cur.rank === 1 && nxt.rank === 1 && f.chain < 3;
      if (!(nxt.rank > cur.rank || rapid)) continue;
    }
    f.buf.splice(f.buf.indexOf(b), 1);
    return id;
  }
  return null;
}

// ------------------------------------------------------------------ boxes
const hurtbox = f => {
  const air = f.y > 4 || f.state === 'launched';
  const h = f.crouching && !air ? 78 : f.state === 'knockdown' || f.state === 'ko' ? 34 : air ? 104 : 120;
  return { x0: f.x - 24, x1: f.x + 24, y0: f.y, y1: f.y + h };
};
const hitRect = (f, mv) => {
  const x0 = f.facing === 1 ? f.x + mv.hb.x : f.x - mv.hb.x - mv.hb.w;
  return { x0, x1: x0 + mv.hb.w, y0: f.y + mv.hb.y, y1: f.y + mv.hb.y + mv.hb.h };
};
const overlap = (a, b) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

// ---------------------------------------------------------------- hit logic
const SCALE = [1, 1, 0.92, 0.82, 0.72, 0.62, 0.52, 0.44, 0.38, 0.32];
const comboScale = n => SCALE[Math.min(n, SCALE.length - 1)];

function canBlock(d, a, mv, inp) {
  if (!d.def || d.state === 'attack' || d.state === 'launched' || d.state === 'knockdown' || d.state === 'ko' || d.state === 'getup') return false;
  if (d.y > 4) return false;
  if (d.state === 'hit') return false;
  const holdBack = backHeld(d, inp) || inp.block;
  if (!holdBack && d.state !== 'block') return false;
  if (!holdBack) return false;
  if (mv.height === 'low' && !inp.down) return false;
  if (mv.height === 'high' && inp.down) return false;
  return true;
}

function landHit(a, d, mv, inp, ev, opts = {}) {
  const dir = a.x < d.x ? 1 : -1;
  const blocked = !opts.noBlock && canBlock(d, a, mv, inp);
  if (d.invuln > 0) return false;
  if (!blocked && d.state === 'launched' && d.juggle >= 4) return false; // juggle limit
  a.connected = blocked ? 'block' : 'hit';
  let dmg = mv.dmg * (opts.dmgMul || 1);
  if (blocked) {
    d.hp = Math.max(1, d.hp - Math.round(dmg * 0.12));
    d.state = 'block'; d.stun = mv.blockstun; d.vx = dir * mv.kb * 0.9; d.blocking = true;
    d.crouching = !!inp.down;
    a.vx -= dir * 0.8; // attacker pushback so blockstrings stay fair
    a.freeze = d.freeze = Math.floor(mv.hitstop * 0.6);
    a.meter = Math.min(100, a.meter + mv.meter * 0.4); d.meter = Math.min(100, d.meter + 2);
    ev.push({ type: 'block', x: d.x, y: d.y + 80, who: d.side });
    return true;
  }
  const counter = d.state === 'attack' && d.moveT <= d.move.startup;
  if (counter) dmg *= 1.25;
  a.combo += 1; d.juggle = d.state === 'launched' ? d.juggle + 1 : 0;
  const scaled = Math.max(1, Math.round(dmg * comboScale(a.combo - 1) * (a.combo === 1 ? 1 : 1)));
  d.hp = Math.max(0, d.hp - scaled); a.comboDmg += scaled;
  a.meter = Math.min(100, a.meter + mv.meter); d.meter = Math.min(100, d.meter + scaled * 0.4);
  a.chain = mv.rank === 1 ? a.chain + 1 : 0;
  a.freeze = d.freeze = mv.hitstop + (counter ? 3 : 0);
  d.blocking = false; d.moveT = 0; d.hitDone = false;
  const launchV = opts.launch ?? mv.launch;
  const kb = (opts.kb ?? mv.kb) * (d.y > 4 ? 0.7 : 1);
  if (d.hp <= 0) {
    d.state = 'launched'; d.vy = 9; d.vx = dir * 7; d.stun = 0; d.ko = true; d.y += 1;
    ev.push({ type: 'ko', who: d.side });
  } else if (launchV > 0 || d.y > 4) {
    d.state = 'launched'; d.crouching = false;
    d.vy = launchV > 0 ? launchV : Math.max(5.5 - d.juggle * 1.1, 2.6);
    d.vx = dir * Math.max(1.2, kb * (launchV > 0 ? 0.35 : 0.5));
    if (d.y <= 4) d.y = 5;
  } else if (mv.knockdown) {
    d.state = 'launched'; d.vy = 5.5; d.vx = dir * kb * 0.9; d.y = 5; d.crouching = false;
  } else {
    d.state = 'hit'; d.stun = mv.hitstun + (counter ? 6 : 0); d.vx = dir * kb; d.crouching = false;
    d.move = null;
  }
  setAnim(d, d.state === 'hit' ? (a.moveId === 'sweep' || mv.height === 'low' ? 'hurtLow' : 'hurt') : 'launched');
  ev.push({ type: counter ? 'counter' : 'hit', x: d.x, y: d.y + 85, who: d.side, power: Math.min(1, scaled / 20), combo: a.combo, moveId: a.moveId });
  return true;
}

// -------------------------------------------------------------------- step
export function createMatch(defs, opts = {}) {
  const m = {
    fighters: [createFighter(defs[0], 0), createFighter(defs[1], 1)],
    projectiles: [], phase: 'intro', phaseT: 0, round: 1, timer: opts.time || 60, tick: 0,
    toWin: opts.toWin || 2, winner: null, roundWinner: null, events: [], training: !!opts.training, flash: 0, shake: 0,
  };
  return m;
}

function resetRound(m) {
  const [a, b] = m.fighters;
  for (const [f, x] of [[a, 330], [b, 630]]) {
    f.x = x; f.y = 0; f.vx = f.vy = 0; f.hp = f.maxHp; f.state = 'idle'; f.move = null; f.moveId = null;
    f.freeze = 0; f.stun = 0; f.combo = 0; f.comboDmg = 0; f.juggle = 0; f.chain = 0; f.ko = false; f.invuln = 0;
    f.crouching = false; f.buf = []; f.airUsed = false; f.anim = 'idle'; f.connected = 'none';
    f.facing = f === a ? 1 : -1;
  }
  m.projectiles = []; m.timer = m.training ? 99 : 60; m.phase = 'intro'; m.phaseT = 0; m.roundWinner = null;
}

export function stepMatch(m, inputs) {
  const ev = m.events = [];
  m.tick++; m.phaseT++;
  if (m.shake > 0) m.shake--; if (m.flash > 0) m.flash--;
  const [a, b] = m.fighters;
  const fighting = m.phase === 'fight';
  const idle = { left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, block: false };

  m.fighters.forEach((f, i) => {
    const inp = (fighting || m.phase === 'ko') ? (inputs[i] || idle) : idle;
    f.frame++;
    // buffer presses (edge detection)
    for (const btn of ['punch', 'kick', 'special']) {
      if (inp[btn] && !f.prev[btn]) f.buf.push({ btn, age: 0, down: inp.down, fwd: fwdHeld(f, inp) });
    }
    f.buf.forEach(x => x.age++); f.buf = f.buf.filter(x => x.age <= 10);
    f.inp = inp;
  });

  if (m.phase === 'intro' && m.phaseT > 100) { m.phase = 'fight'; m.phaseT = 0; ev.push({ type: 'fight' }); }
  if (fighting) {
    if (!m.training && m.tick % FPS === 0) m.timer = Math.max(0, m.timer - 1);
    if (m.training) m.timer = 99;
  }

  for (let i = 0; i < 2; i++) stepFighter(m, m.fighters[i], m.fighters[1 - i], m.fighters[i].inp, ev);
  resolveHits(m, ev);
  stepProjectiles(m, ev);

  // pushbox separation
  const A = hurtbox(a), B = hurtbox(b);
  if (A.y0 < B.y1 && B.y0 < A.y1 && Math.abs(a.x - b.x) < 40) {
    const push = (40 - Math.abs(a.x - b.x)) / 2, s = a.x <= b.x ? -1 : 1;
    a.x += s * push; b.x -= s * push;
  }
  for (const f of m.fighters) f.x = clamp(f.x, STAGE.wallL, STAGE.wallR);
  // if one fighter is cornered, make sure the other is still pushed out
  if (Math.abs(a.x - b.x) < 38 && a.y < 8 && b.y < 8) { if (a.x < 60) b.x = a.x + 38; else if (a.x > 900) b.x = a.x - 38; }

  for (const f of m.fighters) {
    f.prev = { ...f.inp };
    if (f.invuln > 0) f.invuln--;
    f.animT++;
    // combo ends when the victim recovers
    const o = f === a ? b : a;
    if (f.combo > 0 && !['hit', 'launched'].includes(o.state) && o.state !== 'knockdown') { f.combo = 0; f.comboDmg = 0; f.chain = f.state === 'attack' ? f.chain : 0; }
  }
  if (!['hit', 'launched'].includes(a.state) && !['hit', 'launched'].includes(b.state)) { a.juggle = 0; b.juggle = 0; }

  // facing when actionable
  for (const f of m.fighters) { const o = f === a ? b : a; if (isActionable(f) || f.state === 'dash') f.facing = o.x >= f.x ? 1 : -1; }

  // round flow
  if (fighting) {
    if (a.ko || b.ko || m.timer <= 0) {
      m.phase = 'ko'; m.phaseT = 0;
      m.roundWinner = a.ko && b.ko ? (a.hp >= b.hp ? 0 : 1) : a.ko ? 1 : b.ko ? 0 : (a.hp === b.hp ? -1 : a.hp > b.hp ? 0 : 1);
      if (m.roundWinner >= 0) m.fighters[m.roundWinner].wins++;
      if (!a.ko && !b.ko) { (m.roundWinner === 0 ? b : a).ko = true; }
      m.shake = 14; ev.push({ type: 'roundEnd', winner: m.roundWinner });
    }
  } else if (m.phase === 'ko' && m.phaseT > 150) {
    const w = m.fighters.findIndex(f => f.wins >= m.toWin);
    if (w >= 0) { m.phase = 'over'; m.winner = w; ev.push({ type: 'matchEnd', winner: w }); }
    else { m.round++; resetRound(m); }
  }
  if (m.phase === 'ko' || m.phase === 'over') {
    const w = m.roundWinner;
    if (w >= 0) { const wf = m.fighters[w]; if (wf.state === 'idle' && wf.y === 0 && m.phaseT > 50) { wf.state = 'victory'; setAnim(wf, 'victory'); } }
  }
  return ev;
}

function stepFighter(m, f, o, inp, ev) {
  if (f.freeze > 0) { f.freeze--; return; }
  f.t++;
  const grounded = f.y <= 0.01;
  switch (f.state) {
    case 'idle': case 'walk': case 'crouch': case 'block': {
      f.blocking = false; f.crouching = !!inp.down;
      const atk = chooseAttack(f, o, true, null);
      if (atk) { startMove(f, atk); break; }
      if (inp.up) { f.state = 'prejump'; f.t = 0; f.jumpDir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0); f.crouching = false; setAnim(f, 'prejump'); break; }
      // double-tap dashes
      for (const dir of ['left', 'right']) {
        if (inp[dir] && !f.prev[dir] && f.tapRel[dir]) {
          if (f.frame - f.tapT[dir] < 15) {
            const toward = (dir === 'right') === (f.facing === 1);
            f.state = 'dash'; f.t = 0; f.dashDir = dir === 'right' ? 1 : -1; f.dashBack = !toward; f.vx = f.dashDir * (toward ? 9.2 : 7.6);
            if (f.dashBack) f.invuln = Math.max(f.invuln, 6);
            setAnim(f, toward ? 'dashF' : 'dashB'); break;
          }
          f.tapT[dir] = f.frame;
        }
        if (!inp[dir]) f.tapRel[dir] = true; else if (!f.prev[dir]) f.tapRel[dir] = true;
      }
      if (f.state === 'dash') break;
      if (inp.down) { f.state = 'crouch'; f.vx = approach(f.vx, 0, 0.9); setAnim(f, 'crouch'); }
      else if ((backHeld(f, inp) || inp.block) && (fwdHeld(f, inp) === false) && (inp.block || backHeld(f, inp))) {
        // holding back = walking back (and guarding). Guard only becomes a hard 'block' on contact.
        const sp = (f.def.speed || 1) * 2.6; f.vx = approach(f.vx, -f.facing * sp * 0.82, 0.55); f.state = 'walk'; setAnim(f, 'walkBack');
        if (inp.block) { f.state = 'block'; f.vx = approach(f.vx, 0, 0.9); setAnim(f, 'block'); }
      } else if (inp.left || inp.right) {
        const dirv = (inp.right ? 1 : 0) - (inp.left ? 1 : 0), sp = (f.def.speed || 1) * 3.1;
        f.vx = approach(f.vx, dirv * sp, 0.6); f.state = 'walk'; setAnim(f, dirv === f.facing ? 'walk' : 'walkBack');
      } else { f.vx = approach(f.vx, 0, 0.7); f.state = 'idle'; setAnim(f, 'idle'); }
      f.x += f.vx;
      break;
    }
    case 'prejump': {
      f.x += f.vx *= 0.8;
      if (f.t >= 4) { f.state = 'air'; f.vy = (f.def.jump || 13.6); f.vx = f.jumpDir * 4.4 * (f.def.speed || 1); f.y = 0.02; f.airUsed = false; setAnim(f, f.jumpDir * f.facing >= 0 ? 'jumpUp' : 'jumpUp'); }
      break;
    }
    case 'air': {
      f.vy -= GRAV; f.y += f.vy; f.x += f.vx; f.vx += ((inp.right ? 1 : 0) - (inp.left ? 1 : 0)) * 0.05;
      const atk = chooseAttack(f, o, false, null);
      if (atk) { startMove(f, atk); f.airUsed = true; break; }
      setAnim(f, f.vy > 2 ? 'jumpUp' : f.vy < -2 ? 'jumpDown' : 'jumpApex');
      if (f.y <= 0 && f.vy < 0) { f.y = 0; f.vy = 0; f.vx *= 0.3; f.state = 'land'; f.t = 0; setAnim(f, 'land'); ev.push({ type: 'land', x: f.x, who: f.side }); }
      break;
    }
    case 'land': f.t++; f.x += f.vx; f.vx *= 0.7; if (f.t > 3) { f.state = 'idle'; } break;
    case 'dash': {
      f.x += f.vx; f.vx = approach(f.vx, 0, f.dashBack ? 0.55 : 0.5);
      const atk = f.t > 4 ? chooseAttack(f, o, true, null) : null;
      if (atk) { startMove(f, atk); f.vx = f.dashDir * 4.5; break; }
      if (f.t >= (f.dashBack ? 18 : 16)) { f.state = 'idle'; f.vx *= 0.3; }
      break;
    }
    case 'attack': {
      const mv = f.move; f.moveT++;
      f.phase = f.moveT <= mv.startup ? 'startup' : f.moveT <= mv.startup + mv.active + (mv.hits ? mv.hits[mv.hits.length - 1] : 0) ? 'active' : 'recovery';
      const total = mv.type === 'super' ? mv.startup + mv.hits[mv.hits.length - 1] + 14 + mv.recovery : moveTotal(mv);
      f.animP = clamp(f.moveT / total, 0, 1);
      // momentum: step into the strike during startup/active so combos flow
      if (!mv.air && f.moveT <= mv.startup + mv.active) f.x += f.facing * (mv.type === 'super' && f.moveT < mv.startup ? 0 : mv.advance);
      else if (!mv.air) f.vx = approach(f.vx, 0, 0.6), f.x += f.vx;
      if (mv.air) { f.vy -= GRAV; f.y += f.vy; f.x += f.vx; if (f.y <= 0 && f.vy < 0) { f.y = 0; f.vy = 0; f.vx = 0; f.state = 'land'; f.t = -2; f.move = null; ev.push({ type: 'land', x: f.x, who: f.side }); break; } }
      // projectile / special effects
      if (f.moveId === 'special') {
        const sp = f.def.specialSpec || {};
        if (sp.kind === 'projectile' && f.moveT === mv.startup) {
          m.projectiles.push({ x: f.x + f.facing * 44, y: sp.py ?? 82, vx: f.facing * (sp.speed || 7), dmg: sp.dmg || 10, w: sp.w || 36, h: sp.h || 26, life: 110, owner: f.side, kind: sp.fx || 'orb', hit: false });
          ev.push({ type: 'spawn', who: f.side, kind: sp.fx || 'orb' });
        }
        if (sp.kind === 'charge' && f.moveT > mv.startup && f.moveT <= mv.startup + mv.active) f.x += f.facing * (sp.dash || 6);
      }
      if (f.moveId === 'super' && f.moveT === 1) { m.flash = 14; ev.push({ type: 'superFlash', who: f.side, name: f.def.superName }); }
      // gatling / special cancels (only on hit or block)
      if (f.connected !== 'none' && f.moveT > mv.startup) {
        const atk = chooseAttack(f, o, !mv.air, mv);
        if (atk && !(mv.air)) { startMove(f, atk); f.connected = f.connected; ev.push({ type: 'cancel', who: f.side, into: atk }); break; }
      }
      if (f.moveT >= total) { f.state = 'idle'; f.move = null; f.moveId = null; f.chain = 0; f.crouching = false; setAnim(f, 'idle'); }
      break;
    }
    case 'hit': case 'block': {
      f.x += f.vx; f.vx = approach(f.vx, 0, 0.6);
      f.stun--;
      if (f.state === 'block') setAnim(f, f.crouching ? 'blockLow' : 'block');
      if (f.stun <= 0) { f.state = 'idle'; f.blocking = false; setAnim(f, 'idle'); }
      break;
    }
    case 'launched': {
      f.vy -= GRAV * 0.92; f.y += f.vy; f.x += f.vx; f.vx *= 0.995;
      if (f.y <= 0 && f.vy < 0) {
        f.y = 0; f.state = 'knockdown'; f.t = 0; f.vx *= 0.3; f.vy = 0; setAnim(f, f.ko ? 'ko' : 'knockdown');
        ev.push({ type: 'slam', x: f.x, who: f.side }); m.shake = Math.max(m.shake, 8);
      }
      break;
    }
    case 'knockdown': {
      f.x += f.vx; f.vx = approach(f.vx, 0, 0.5);
      if (f.ko) { setAnim(f, 'ko'); break; }
      if (f.t > 34) { f.state = 'getup'; f.t = 0; f.invuln = 22; setAnim(f, 'getup'); }
      break;
    }
    case 'getup': if (f.t > 20) { f.state = 'idle'; setAnim(f, 'idle'); } break;
    case 'victory': case 'taunt': break;
    default: break;
  }
  if (f.state === 'idle' && f.anim !== 'idle' && !['victory'].includes(f.anim) && f.t > 0) setAnim(f, 'idle');
}

function resolveHits(m, ev) {
  const [a, b] = m.fighters;
  for (const [att, def] of [[a, b], [b, a]]) {
    if (att.state !== 'attack' || !att.move || att.freeze > 0) continue;
    const mv = att.move;
    if (att.lastHitFrame === att.moveT) continue;
    const inp = def.inp || {};
    if (mv.type === 'super') {
      const k = mv.hits.indexOf(att.moveT - mv.startup);
      if (k < 0) continue;
      att.lastHitFrame = att.moveT;
      const last = k === mv.hits.length - 1;
      if (att.connected === 'hit' && !last) att.x += 0; // lock-in handled by small kb
      if (overlap(hitRect(att, mv), hurtbox(def)) || (att.connected === 'hit' && Math.abs(att.x - def.x) < 130)) {
        const fin = mv.finisher;
        landHit(att, def, mv, inp, ev, last ? { dmgMul: fin.dmg / mv.dmg, launch: fin.launch, kb: fin.kb, noBlock: false } : { launch: 0, noBlock: false });
        if (last) m.shake = 16;
      }
      continue;
    }
    if (att.hitDone) continue;
    if (att.moveId === 'special' && att.def.specialSpec && att.def.specialSpec.kind === 'projectile') continue; // damage comes from the projectile
    if (att.moveT <= mv.startup || att.moveT > mv.startup + mv.active) continue;
    if (overlap(hitRect(att, mv), hurtbox(def))) {
      let extra = {};
      if (att.moveId === 'special' && att.def.specialSpec && att.def.specialSpec.kind === 'charge') {
        const movingToward = def.vx * (att.x < def.x ? -1 : 1) > 0.5;
        if (movingToward) { extra.dmgMul = 1.4; ev.push({ type: 'bonus', text: 'HOSTILE TAKEOVER!' }); }
      }
      if (landHit(att, def, mv, inp, ev, extra)) att.hitDone = true;
    }
  }
}

function stepProjectiles(m, ev) {
  for (const p of m.projectiles) {
    p.x += p.vx; p.life--;
    const def = m.fighters[1 - p.owner];
    if (!p.hit && overlap({ x0: p.x - p.w / 2, x1: p.x + p.w / 2, y0: p.y - p.h / 2, y1: p.y + p.h / 2 }, hurtbox(def))) {
      const att = m.fighters[p.owner];
      const mv = { ...att.def.moves.special, dmg: p.dmg, hitstop: 7, kb: 6, launch: 0, knockdown: false, height: 'mid' };
      p.hit = true;
      if (landHit(att, def, mv, def.inp || {}, ev, {})) att.connected = 'none';
      ev.push({ type: 'projectileHit', x: p.x, y: p.y });
    }
    if (p.x < -40 || p.x > STAGE.width + 40) p.life = 0;
  }
  // projectiles cancel each other
  for (let i = 0; i < m.projectiles.length; i++) for (let j = i + 1; j < m.projectiles.length; j++) {
    const a = m.projectiles[i], b = m.projectiles[j];
    if (a.owner !== b.owner && Math.abs(a.x - b.x) < 30 && Math.abs(a.y - b.y) < 30) { a.life = 0; b.life = 0; ev.push({ type: 'projectileHit', x: (a.x + b.x) / 2, y: a.y }); }
  }
  m.projectiles = m.projectiles.filter(p => p.life > 0 && !p.hit);
}

// ----------------------------------------------------------------------- AI
const LEVELS = {
  easy: { react: 22, aggr: 0.35, guard: 0.25, combo: 0.45, special: 0.1 },
  normal: { react: 12, aggr: 0.55, guard: 0.5, combo: 0.75, special: 0.22 },
  hard: { react: 6, aggr: 0.72, guard: 0.72, combo: 0.95, special: 0.35 },
};
const CHAINS = [
  [['punch'], ['punch'], ['punch', 'fwd'], ['special']],
  [['kick'], ['punch', 'fwd'], ['punch', 'down']],
  [['punch'], ['kick'], ['punch', 'fwd'], ['punch', 'down'], ['special']],
  [['kick', 'down']],
  [['punch', 'fwd']],
  [['punch'], ['kick'], ['kick', 'fwd']],
];

export function aiInput(m, idx, level = 'normal', rnd = Math.random) {
  const f = m.fighters[idx], o = m.fighters[1 - idx], L = LEVELS[level] || LEVELS.normal, s = f.aiState;
  const inp = { left: false, right: false, up: false, down: false, punch: false, kick: false, special: false, block: false };
  if (m.phase !== 'fight') return inp;
  const dx = o.x - f.x, d = Math.abs(dx), toward = dx > 0 ? 'right' : 'left', away = dx > 0 ? 'left' : 'right';
  s.timer--;
  // queued combo presses
  if (s.queue.length && s.timer <= 0) {
    const [btn, mod] = s.queue.shift();
    inp[btn] = true; if (mod === 'fwd') inp[toward] = true; if (mod === 'down') inp.down = true;
    s.timer = 7 + Math.floor(rnd() * 4); s.hold = 2;
    return inp;
  }
  if (s.hold > 0) { s.hold--; inp[toward] = !!s.holdFwd; }
  if (f.state === 'attack' || f.state === 'hit' || f.state === 'launched') return inp;
  // defend
  if (o.state === 'attack' && d < 150 && o.moveT <= o.move.startup + o.move.active && rnd() < L.guard * 0.12) { inp[away] = true; if (o.moveId === 'sweep') inp.down = true; return inp; }
  if (o.state === 'attack' && d < 150 && f.state === 'block') { inp[away] = true; return inp; }
  if (o.state === 'attack' && o.projectile) return inp;
  if (m.projectiles.some(p => p.owner !== idx && Math.abs(p.x - f.x) < 200 && Math.abs(p.x - f.x) > 40) && rnd() < 0.07) { inp.up = true; return inp; }
  if (d > 190) {
    if (rnd() < L.special * 0.02 && f.def.specialSpec && f.def.specialSpec.kind === 'projectile') { inp.special = true; return inp; }
    inp[toward] = true; if (rnd() < 0.015 * L.aggr) { inp.up = true; } return inp;
  }
  if (d > 100) {
    if (rnd() < 0.04) { inp[toward] = true; s.timer = 0; }
    inp[toward] = rnd() > 0.15;
    if (rnd() < 0.035 * L.aggr && f.state === 'idle') inp.punch = true;
    return inp;
  }
  // close range
  if (s.timer > 0) { if (rnd() < 0.3) inp[away] = rnd() < L.guard * 0.5; return inp; }
  if (f.meter >= 100 && rnd() < 0.05) { inp.special = true; inp.down = true; return inp; }
  if (rnd() < L.aggr * 0.12) {
    const ch = CHAINS[Math.floor(rnd() * CHAINS.length)].map(x => [...x]);
    const useLen = rnd() < L.combo ? ch.length : Math.max(1, Math.ceil(ch.length / 2));
    const first = ch.shift(); s.queue = ch.slice(0, useLen - 1); s.timer = 8;
    inp[first[0]] = true; if (first[1] === 'fwd') inp[toward] = true; if (first[1] === 'down') inp.down = true;
    return inp;
  }
  if (rnd() < 0.05) inp[away] = true;
  s.timer = Math.max(s.timer, 0);
  return inp;
}
