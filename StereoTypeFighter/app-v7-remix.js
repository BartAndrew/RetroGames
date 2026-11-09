// V7 game shell: title > character select > cutscene > match > cutscene (> ending). Everything draws on one canvas.
import { createMatch, stepMatch, aiInput, STAGE } from './combat-v7.js';
import { addRemixFx, advanceRemixFx, drawRemixFx } from './remix-fx-v7.js';
import { ROSTER, byId } from './roster-v7.js';
import { ArtStore, drawMatch, drawPortrait, pushFx } from './renderer-v7.js';
import { Cutscene } from './cutscene-v7.js';
import { getScene, sceneId, ladderFor, TITLE_CARD } from './story-v7.js';

const canvas = document.getElementById('game'), ctx = canvas.getContext('2d');
const W = 960, H = 540;
const store = new ArtStore();
const hud = { chip: [] };
const keys = new Set(), pressed = new Set();
const KEYMAP = [
  { left: 'KeyA', right: 'KeyD', up: 'KeyW', down: 'KeyS', punch: 'KeyF', kick: 'KeyG', special: 'KeyH', block: 'KeyE' },
  { left: 'ArrowLeft', right: 'ArrowRight', up: 'ArrowUp', down: 'ArrowDown', punch: 'KeyJ', kick: 'KeyK', special: 'KeyL', block: 'KeyI' },
];
const MODES = [
  { id: 'story', label: 'Story Mode', sub: 'Pick a stereotype. Fight the field. Earn your ending.' },
  { id: 'cpu', label: 'Versus CPU', sub: 'Quick match with pre and post-fight scenes.' },
  { id: 'local', label: 'Local 2 Player', sub: 'WASD+FGH vs Arrows+JKL on one keyboard.' },
  { id: 'training', label: 'Training', sub: 'Unlimited time. Practice your combos.' },
];
const DIFFS = ['easy', 'normal', 'hard'];

const G = {
  screen: 'title', menu: 0, diff: 1, mode: null, picks: [0, 1], pickSlot: 0, cursor: 0,
  match: null, cut: null, story: null, result: null, tick: 0, ai: [null, null], resultMenu: 0, muted: false, resume: null,
};
window.SF7 = G;

// ------------------------------------------------------------------- audio
let actx = null;
function sfx(kind) {
  if (G.muted) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    const t = actx.currentTime, o = actx.createOscillator(), g = actx.createGain(); o.connect(g); g.connect(actx.destination);
    const P = { hit: [180, 60, 0.12, 'square'], counter: [260, 80, 0.18, 'sawtooth'], block: [320, 220, 0.07, 'triangle'], slam: [90, 40, 0.22, 'sawtooth'], spawn: [520, 300, 0.12, 'square'], superFlash: [140, 700, 0.5, 'sawtooth'], ko: [200, 40, 0.6, 'sawtooth'], fight: [330, 660, 0.25, 'square'], menu: [600, 800, 0.06, 'square'] }[kind];
    if (!P) return;
    o.type = P[3]; o.frequency.setValueAtTime(P[0], t); o.frequency.exponentialRampToValueAtTime(P[1], t + P[2]);
    g.gain.setValueAtTime(0.12, t); g.gain.exponentialRampToValueAtTime(0.0001, t + P[2]); o.start(t); o.stop(t + P[2] + 0.02);
  } catch { /* audio unavailable */ }
}

// ------------------------------------------------------------------- input
addEventListener('keydown', e => {
  if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
  if (!keys.has(e.code)) pressed.add(e.code);
  keys.add(e.code);
  onKey(e.code);
});
addEventListener('keyup', e => keys.delete(e.code));
addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', e => {
  const r = canvas.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  onClick(x, y);
});
function readInput(i) {
  const k = KEYMAP[i], o = {};
  for (const a of Object.keys(k)) o[a] = keys.has(k[a]);
  // gamepad (player 1 only, optional)
  if (i === 0) { const gp = (navigator.getGamepads && navigator.getGamepads()[0]); if (gp) { o.left ||= gp.axes[0] < -0.4 || gp.buttons[14]?.pressed; o.right ||= gp.axes[0] > 0.4 || gp.buttons[15]?.pressed; o.up ||= gp.axes[1] < -0.6 || gp.buttons[12]?.pressed; o.down ||= gp.axes[1] > 0.6 || gp.buttons[13]?.pressed; o.punch ||= gp.buttons[2]?.pressed; o.kick ||= gp.buttons[0]?.pressed; o.special ||= gp.buttons[1]?.pressed; o.block ||= gp.buttons[4]?.pressed || gp.buttons[5]?.pressed; } }
  return o;
}

// roster grid: up to 10 per row, tiles shrink as the roster grows
const GRID_COLS = 10;
function tileRect(i) {
  const n = ROSTER.length, cols = Math.min(GRID_COLS, n), tw = Math.min(220, Math.floor(920 / cols) - 6), th = n > 10 ? 150 : 210;
  const row = Math.floor(i / cols), col = i % cols, inRow = Math.min(cols, n - row * cols);
  const x = 480 + (col - (inRow - 1) / 2) * (tw + 6) - tw / 2;
  return { x, y: (n > 10 ? 176 : 290) + row * (th + 28), w: tw, h: th, cx: x + tw / 2 };
}

// ------------------------------------------------------------------ flow
function go(screen) { G.screen = screen; sfx('menu'); }
function startMode(mode) {
  G.mode = mode; G.story = null; G.picks = [0, 1]; G.pickSlot = 0; G.cursor = 0; go('select');
}
function confirmPick() {
  G.picks[G.pickSlot] = G.cursor;
  if (G.mode === 'story' || G.mode === 'training' && false) { beginStory(ROSTER[G.cursor].id); return; }
  if ((G.mode === 'cpu') && G.pickSlot === 0) { G.pickSlot = 1; G.cursor = (G.picks[0] + 1) % ROSTER.length; sfx('menu'); return; }
  if (G.mode === 'local' && G.pickSlot === 0) { G.pickSlot = 1; G.cursor = (G.picks[0] + 1) % ROSTER.length; sfx('menu'); return; }
  if (G.mode === 'training' && G.pickSlot === 0) { G.pickSlot = 1; G.cursor = (G.picks[0] + 1) % ROSTER.length; sfx('menu'); return; }
  if (G.mode === 'training') { launchMatch(G.picks[0], G.picks[1], { training: true, afterMatch: 'menu' }); return; }
  scenesThenMatch(G.picks[0], G.picks[1]);
}
function beginStory(id) {
  G.story = { id, ladder: ladderFor(id, ROSTER), step: -1, lost: 0 };
  playScene(sceneId.prologue(id), () => nextStoryFight());
}
function nextStoryFight() {
  const st = G.story; st.step++;
  if (st.step >= st.ladder.length) { playScene(sceneId.ending(st.id), () => { G.story = null; go('title'); }); return; }
  const oppId = st.ladder[st.step], me = ROSTER.findIndex(r => r.id === st.id), opp = ROSTER.findIndex(r => r.id === oppId);
  scenesThenMatch(me, opp, true);
}
function scenesThenMatch(a, b, story = false) {
  playScene(sceneId.pre(ROSTER[a].id, ROSTER[b].id), () => launchMatch(a, b, { story }));
}
function playScene(id, done) {
  const scene = getScene(id);
  if (!scene) { done(); return; }
  G.cut = new Cutscene(scene, store, () => { G.cut = null; done(); });
  G.screen = 'cutscene';
}
function launchMatch(a, b, opts = {}) {
  const defs = [ROSTER[a], ROSTER[b]];
  G.match = createMatch(defs, { training: !!opts.training });
  G.matchOpts = { ...opts, a, b, cpu: G.mode !== 'local' && G.mode !== 'training' };
  G.ai = [null, null]; hud.chip = [];
  G.screen = 'match'; G.paused = false; G.endHandled = false;
}
function finishMatch() {
  const m = G.match, w = m.winner, o = G.matchOpts;
  if (G.endHandled) return; G.endHandled = true;
  const winner = ROSTER[w === 0 ? o.a : o.b], loser = ROSTER[w === 0 ? o.b : o.a];
  const playerWon = w === 0 || !o.cpu;
  G.result = { winner, loser, playerWon, story: o.story, w };
  // winner/loser scene, then result menu
  playScene(sceneId.post(winner.id, loser.id), () => { G.resultMenu = 0; G.screen = 'result'; });
}
function afterResult(choice) {
  const r = G.result, o = G.matchOpts;
  if (o.story) {
    if (choice === 0) { if (r.playerWon) nextStoryFight(); else launchMatch(o.a, o.b, { story: true }); }
    else { G.story = null; go('title'); }
    return;
  }
  if (choice === 0) launchMatch(o.a, o.b, o); else go('title');
}

function onKey(code) {
  if (code === 'KeyM') { G.muted = !G.muted; return; }
  if (G.screen === 'title') {
    if (code === 'ArrowUp' || code === 'KeyW') { G.menu = (G.menu + MODES.length - 1) % MODES.length; sfx('menu'); }
    if (code === 'ArrowDown' || code === 'KeyS') { G.menu = (G.menu + 1) % MODES.length; sfx('menu'); }
    if (code === 'ArrowLeft' || code === 'ArrowRight' || code === 'KeyD' || code === 'KeyA') { G.diff = (G.diff + (code.includes('Left') || code === 'KeyA' ? 2 : 1)) % 3; sfx('menu'); }
    if (code === 'Enter' || code === 'Space') startMode(MODES[G.menu].id);
  } else if (G.screen === 'select') {
    if (code === 'ArrowLeft' || code === 'KeyA') { G.cursor = (G.cursor + ROSTER.length - 1) % ROSTER.length; sfx('menu'); }
    if (code === 'ArrowRight' || code === 'KeyD') { G.cursor = (G.cursor + 1) % ROSTER.length; sfx('menu'); }
    if ((code === 'ArrowUp' || code === 'KeyW') && ROSTER.length > GRID_COLS) { G.cursor = (G.cursor + ROSTER.length - GRID_COLS) % ROSTER.length; sfx('menu'); }
    if ((code === 'ArrowDown' || code === 'KeyS') && ROSTER.length > GRID_COLS) { G.cursor = (G.cursor + GRID_COLS) % ROSTER.length; sfx('menu'); }
    if (code === 'Enter' || code === 'Space' || code === 'KeyF') confirmPick();
    if (code === 'Escape') { if (G.pickSlot === 1) { G.pickSlot = 0; G.cursor = G.picks[0]; } else go('title'); }
  } else if (G.screen === 'cutscene' && G.cut) {
    if (code === 'Space' || code === 'Enter' || code === 'KeyF') G.cut.advance();
    if (code === 'Escape') G.cut.skip();
  } else if (G.screen === 'match') {
    if (code === 'KeyP' || code === 'Escape') G.paused = !G.paused;
    if (code === 'KeyR' && G.matchOpts.training) { launchMatch(G.matchOpts.a, G.matchOpts.b, G.matchOpts); }
    if (code === 'KeyQ' && G.paused) go('title');
  } else if (G.screen === 'result') {
    if (code === 'ArrowUp' || code === 'ArrowDown' || code === 'KeyW' || code === 'KeyS') G.resultMenu = 1 - G.resultMenu;
    if (code === 'Enter' || code === 'Space') afterResult(G.resultMenu);
  }
}
function onClick(x, y) {
  if (G.screen === 'title') {
    MODES.forEach((m, i) => { if (x > 300 && x < 660 && y > 250 + i * 50 && y < 292 + i * 50) { G.menu = i; startMode(m.id); } });
    if (y > 470 && y < 500 && x > 330 && x < 630) { G.diff = (G.diff + 1) % 3; sfx('menu'); }
  } else if (G.screen === 'select') {
    ROSTER.forEach((r, i) => { const t = tileRect(i); if (x > t.x && x < t.x + t.w && y > t.y && y < t.y + t.h) { if (G.cursor === i) confirmPick(); else { G.cursor = i; sfx('menu'); } } });
  } else if (G.screen === 'cutscene' && G.cut) G.cut.advance();
  else if (G.screen === 'result') { if (x > 330 && x < 630) { if (y > 300 && y < 350) afterResult(0); if (y > 360 && y < 410) afterResult(1); } }
}

// ----------------------------------------------------------------- drawing
function drawBackdrop(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#0a0f26'); g.addColorStop(1, '#3a1a4a'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.15; for (let i = 0; i < 14; i++) { ctx.fillStyle = ['#7fe0d2', '#ffd31a', '#ff77c8'][i % 3]; const x = (i * 97 + t * (0.3 + (i % 4) * 0.15)) % (W + 200) - 100; ctx.fillRect(x, 0, 3, H); } ctx.globalAlpha = 1;
}
function text(s, x, y, size, color = '#fff', align = 'center', weight = 800, italic = false) {
  ctx.font = `${italic ? 'italic ' : ''}${weight} ${size}px system-ui,sans-serif`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(s, x, y);
}
function drawTitle() {
  drawBackdrop(G.tick);
  ctx.save(); ctx.shadowColor = '#7fe0d2'; ctx.shadowBlur = 24; text(TITLE_CARD.title, W / 2, 130, 72, '#fff', 'center', 900, true); ctx.restore();
  text(TITLE_CARD.subtitle.toUpperCase(), W / 2, 168, 18, '#ffd31a', 'center', 700);
  text('Everyone is a stereotype. Nobody fits the box. Fight about it anyway.', W / 2, 205, 16, 'rgba(255,255,255,0.7)', 'center', 500, true);
  MODES.forEach((m, i) => {
    const y = 250 + i * 50, sel = i === G.menu;
    ctx.fillStyle = sel ? 'rgba(127,224,210,0.22)' : 'rgba(0,0,0,0.35)'; ctx.fillRect(300, y, 360, 42);
    if (sel) { ctx.strokeStyle = '#7fe0d2'; ctx.lineWidth = 2; ctx.strokeRect(300, y, 360, 42); }
    text(m.label, W / 2, y + 28, 22, sel ? '#7fe0d2' : '#fff');
  });
  text(MODES[G.menu].sub, W / 2, 462, 15, 'rgba(255,255,255,0.75)', 'center', 500);
  text(`CPU difficulty: ${DIFFS[G.diff].toUpperCase()}  (← →)`, W / 2, 492, 15, '#ffd31a', 'center', 700);
  text('M mutes sound · Enter to select', W / 2, 520, 12, 'rgba(255,255,255,0.45)', 'center', 500);
}
function drawSelect() {
  drawBackdrop(G.tick);
  const slot = G.mode === 'story' ? 'CHOOSE YOUR STEREOTYPE' : G.mode === 'training' ? (G.pickSlot ? 'TRAINING PARTNER' : 'YOUR FIGHTER') : `PLAYER ${G.pickSlot + 1}: CHOOSE YOUR FIGHTER`;
  text(slot, W / 2, 52, 28, '#fff', 'center', 900, true);
  const big = ROSTER.length <= 10;
  ROSTER.forEach((r, i) => {
    const t = tileRect(i), sel = i === G.cursor;
    ctx.fillStyle = sel ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.35)'; ctx.fillRect(t.x, t.y, t.w, t.h);
    ctx.strokeStyle = sel ? r.accent : 'rgba(255,255,255,0.2)'; ctx.lineWidth = sel ? 3 : 1; ctx.strokeRect(t.x, t.y, t.w, t.h);
    ctx.save(); ctx.beginPath(); ctx.rect(t.x + 1, t.y - (big ? 210 : 0), t.w - 2, t.h + (big ? 209 : -1)); ctx.clip();
    drawPortrait(ctx, r, store, t.cx, t.y + t.h - 14, big ? (sel ? 1.55 : 1.3) : (sel ? 0.95 : 0.82), G.tick, 'idle'); ctx.restore();
    if (big) text(r.name.toUpperCase(), t.cx, t.y - 8, 16, sel ? r.accent : '#fff', 'center', 800);
    else text(r.nick.toUpperCase(), t.cx, t.y + t.h + 15, 11, sel ? r.accent : 'rgba(255,255,255,0.8)', 'center', 800);
  });
  const r = ROSTER[G.cursor];
  text(`${r.style} · ${r.country}`, W / 2, 84, 15, r.accent, 'center', 700);
  text(r.bio, W / 2, 106, r.bio.length > 120 ? 11 : r.bio.length > 95 ? 12 : 14, 'rgba(255,255,255,0.8)', 'center', 500, true);
  text(`Special: ${r.special}   ·   Super: ${r.superName}`, W / 2, 128, 14, '#fff', 'center', 700);
  const mv = r.moves; text(`Signature moves: ${mv.hp.name} · ${mv.launcher.name} · ${mv.sweep.name}`, W / 2, 150, 12, 'rgba(255,255,255,0.6)', 'center', 500);
  text('← → ↑ ↓ choose · Enter confirm · Esc back', W / 2, 536, 11, 'rgba(255,255,255,0.5)', 'center', 500);
}
function drawResult() {
  drawBackdrop(G.tick); const r = G.result;
  drawPortrait(ctx, r.winner, store, 480, 420, 2.4, G.tick, 'victory');
  ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, H);
  text(r.playerWon ? 'VICTORY' : 'DEFEAT', W / 2, 120, 72, r.playerWon ? '#ffd31a' : '#ff5d6c', 'center', 900, true);
  text(`${r.winner.name} defeats ${r.loser.name}`, W / 2, 170, 22, '#fff', 'center', 600);
  const labels = r.story ? (r.playerWon ? ['Next Fight', 'Quit to Title'] : ['Retry', 'Quit to Title']) : ['Rematch', 'Title'];
  labels.forEach((l, i) => { const y = 300 + i * 60, sel = G.resultMenu === i; ctx.fillStyle = sel ? 'rgba(255,211,26,0.25)' : 'rgba(255,255,255,0.1)'; ctx.fillRect(330, y, 300, 50); if (sel) { ctx.strokeStyle = '#ffd31a'; ctx.lineWidth = 2; ctx.strokeRect(330, y, 300, 50); } text(l, W / 2, y + 33, 24, sel ? '#ffd31a' : '#fff'); });
}

// -------------------------------------------------------------------- loop
let last = performance.now(), acc = 0;
function frame(now) {
  acc += Math.min(100, now - last); last = now;
  while (acc >= 1000 / 60) { acc -= 1000 / 60; update(); }
  draw(); pressed.clear(); requestAnimationFrame(frame);
}
function update() {
  G.tick++;
  if (G.screen === 'match' && !G.paused) advanceRemixFx();
  if (G.screen === 'cutscene' && G.cut) G.cut.update();
  if (G.screen === 'match' && !G.paused) {
    const m = G.match, o = G.matchOpts, lvl = DIFFS[G.diff];
    const in0 = readInput(0);
    const in1 = o.cpu ? aiInput(m, 1, lvl) : readInput(1);
    const ev = stepMatch(m, [in0, in1]);
    pushFx(ev); addRemixFx(ev,m); for (const e of ev) sfx(e.type);
    if (o.training) { for (const f of m.fighters) { f.meter = Math.max(f.meter, 100); } m.fighters[1].hp = Math.max(m.fighters[1].hp, 1); if (m.fighters[1].hp < m.fighters[1].maxHp * 0.3 && m.fighters[1].state === 'idle') m.fighters[1].hp = m.fighters[1].maxHp; if (m.fighters[0].hp < m.fighters[0].maxHp * 0.3 && m.fighters[0].state === 'idle') m.fighters[0].hp = m.fighters[0].maxHp; m.phase = m.phase === 'ko' ? 'fight' : m.phase; }
    if (m.phase === 'over') finishMatch();
  }
}
function draw() {
  ctx.clearRect(0, 0, W, H);
  if (G.screen === 'title') drawTitle();
  else if (G.screen === 'select') drawSelect();
  else if (G.screen === 'cutscene' && G.cut) G.cut.draw(ctx);
  else if (G.screen === 'match') {
    drawMatch(ctx, G.match, store, hud);
    drawRemixFx(ctx, G.match);
    if (G.paused) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(0, 0, W, H); text('PAUSED', W / 2, 250, 64, '#fff', 'center', 900, true); text('P resume · Q quit to title', W / 2, 296, 18, 'rgba(255,255,255,0.8)', 'center', 600); }
    if (G.matchOpts.training) { const f = G.match.fighters[0]; text(f.combo ? `${f.combo} hit combo · ${f.comboDmg} dmg` : '', W / 2, 520, 16, '#ffd31a', 'center', 700); text('TRAINING · R resets · P pause', W / 2, 500, 12, 'rgba(255,255,255,0.5)', 'center', 500); }
    else if (G.match.phase === 'fight' && G.match.phaseT < 400) {
      text('F punch · G kick · H special · S+H super (full meter) · fwd/down + button = heavies', W / 2, 526, 12, 'rgba(255,255,255,0.5)', 'center', 500);
    }
  } else if (G.screen === 'result') drawResult();
}
(async () => { await store.load('./art/manifest.json'); requestAnimationFrame(frame); })();
