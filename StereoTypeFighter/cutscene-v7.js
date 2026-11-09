// V7 cutscene player: letterboxed cinematic scenes with camera moves, typewriter dialogue, speaker highlighting,
// and a slot for realistic scene illustrations (art/scenes/<art>.png). With no illustration it stages the fighters
// itself using portraits (or the rig stand-in) so story, pacing and dialogue can be reviewed before the art exists.
import { drawPortrait, DRAW_SCALE } from './renderer-v7.js';
import { byId } from './roster-v7.js';

const W = 960, H = 540;
const MOODS = {
  calm: ['#0e1a2b', '#26405f'], tense: ['#1a0d1f', '#5c1d3a'], comic: ['#2a1a0a', '#a8601e'],
  triumph: ['#14233a', '#e0a431'], defeat: ['#101018', '#3a3a4d'],
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const ease = t => t * t * (3 - 2 * t);

export class Cutscene {
  constructor(scene, store, onDone) {
    this.s = scene; this.store = store; this.onDone = onDone; this.i = 0; this.t = 0; this.chars = 0; this.done = false;
    this.cps = 1.6; this.sceneT = 0;
  }
  get line() { return this.s.lines[this.i]; }
  advance() {
    const full = this.line.text.length;
    if (this.chars < full) { this.chars = full; return; }
    if (this.i + 1 >= this.s.lines.length) { this.done = true; this.onDone && this.onDone(); return; }
    this.i++; this.chars = 0; this.t = 0;
  }
  skip() { if (!this.done) { this.done = true; this.onDone && this.onDone(); } }
  update() { this.t++; this.sceneT++; this.chars = Math.min(this.line.text.length, this.chars + this.cps); }
  draw(ctx) {
    const s = this.s, m = MOODS[s.mood] || MOODS.calm, T = this.sceneT;
    const bg = ctx.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, m[0]); bg.addColorStop(1, m[1]); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // Ken Burns on supplied scene art; slow push on the staged version
    const art = s.art && this.store ? this.store.scene(`./art/scenes/${s.art}.png`) : null;
    const zoom = 1.04 + 0.06 * ease(clamp(T / 600, 0, 1)), px = Math.sin(T / 300) * 10;
    ctx.save(); ctx.translate(W / 2 + px, H / 2); ctx.scale(zoom, zoom); ctx.translate(-W / 2, -H / 2);
    if (art) { const r = Math.max(W / art.width, H / art.height); ctx.drawImage(art, (W - art.width * r) / 2, (H - art.height * r) / 2, art.width * r, art.height * r); }
    else this.drawStaged(ctx, T);
    ctx.restore();
    // vignette + letterbox
    const vg = ctx.createRadialGradient(W / 2, H / 2, 200, W / 2, H / 2, 620); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, 54); ctx.fillRect(0, H - 150, W, 150);
    if (s.place) { ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.font = '600 15px system-ui'; ctx.textAlign = 'left'; ctx.fillText(s.place.toUpperCase(), 28, 33); }
    this.drawDialogue(ctx);
    // fade in
    if (T < 24) { ctx.fillStyle = `rgba(0,0,0,${1 - T / 24})`; ctx.fillRect(0, 0, W, H); }
  }
  drawStaged(ctx, T) {
    const s = this.s, left = byId(s.left), right = s.right ? byId(s.right) : null, who = this.line.who;
    // light shafts
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let k = 0; k < 4; k++) { const x = 160 + k * 220 + Math.sin(T / 90 + k) * 18; const g = ctx.createLinearGradient(x, 0, x + 60, H); g.addColorStop(0, 'rgba(255,230,180,0.10)'); g.addColorStop(1, 'rgba(255,230,180,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 80, 0); ctx.lineTo(x + 20, H); ctx.lineTo(x - 90, H); ctx.fill(); }
    ctx.restore();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(0, 380, W, 12);
    const place = (def, cx, flip, speaking) => {
      ctx.save(); ctx.translate(cx, 0); if (flip) ctx.scale(-1, 1); ctx.translate(-cx, 0);
      ctx.globalAlpha = speaking ? 1 : 0.55; const sc = speaking ? 2.0 : 1.8;
      const anim = this.s.mood === 'triumph' && speaking ? 'victory' : 'idle';
      drawPortrait(ctx, def, this.store, cx, 362 + (speaking ? 0 : 4), sc, T, anim);
      ctx.restore();
    };
    if (right) { place(left, 270, false, who === left.id); place(right, 690, true, who === right.id); }
    else place(left, 480, false, true);
  }
  drawDialogue(ctx) {
    const ln = this.line, y = H - 140;
    const def = ln.who !== 'narrator' ? byId(ln.who) : null;
    const accent = def ? def.accent : '#9fb3c8';
    ctx.fillStyle = 'rgba(8,10,18,0.92)'; ctx.fillRect(0, y - 6, W, 146);
    ctx.fillStyle = accent; ctx.fillRect(0, y - 6, W, 3);
    ctx.textAlign = 'left'; ctx.font = '800 20px system-ui'; ctx.fillStyle = accent;
    ctx.fillText(def ? `${def.name.toUpperCase()}${def.nick ? ` · ${def.nick}` : ''}` : 'NARRATOR', 40, y + 26);
    ctx.font = (def ? '500' : 'italic 500') + ' 22px system-ui'; if (!def) ctx.font = 'italic 500 22px system-ui'; ctx.fillStyle = '#f2f5f9';
    const text = ln.text.slice(0, Math.floor(this.chars)), words = text.split(' '); let row = '', yy = y + 60;
    for (const w of words) { const test = row + w + ' '; if (ctx.measureText(test).width > W - 100 && row) { ctx.fillText(row, 40, yy); row = w + ' '; yy += 30; } else row = test; }
    ctx.fillText(row, 40, yy);
    if (this.chars >= ln.text.length) { ctx.fillStyle = accent; ctx.globalAlpha = 0.5 + 0.5 * Math.sin(this.t / 8); ctx.fillText('▶', W - 56, y + 120); ctx.globalAlpha = 1; }
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.font = '500 13px system-ui'; ctx.textAlign = 'right'; ctx.fillText('Space / click: next    Esc: skip', W - 24, y + 134);
    // progress pips
    ctx.textAlign = 'left'; for (let k = 0; k < this.s.lines.length; k++) { ctx.fillStyle = k <= this.i ? accent : 'rgba(255,255,255,0.2)'; ctx.fillRect(40 + k * 22, y + 120, 16, 4); }
  }
}
