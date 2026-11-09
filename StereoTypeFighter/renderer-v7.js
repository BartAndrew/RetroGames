// V7 renderer.
// Two modes, chosen per fighter at runtime:
//   1. ART mode: frame sequences you supply (see art/ART_SPEC.md). Frames cross-fade for smooth motion.
//   2. RIG mode (fallback): a shaded, keyframe-interpolated skeletal figure so the game is fully playable and
//      the motion, timing and combos can be judged before the realistic art exists. It is a stand-in, not final art.
import { STAGE } from './combat-v7.js';

const D2R = Math.PI / 180;
const smooth = t => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const DRAW_SCALE = 1.12;

// ------------------------------------------------------------------ poses
const K = ['lean', 'head', 'a1u', 'a1l', 'a2u', 'a2l', 'l1u', 'l1l', 'l2u', 'l2l', 'drop', 'rot'];
const P = (...v) => Object.fromEntries(K.map((k, i) => [k, v[i] ?? 0]));
const STANCE = P(6, 0, 55, 95, 40, 110, 14, -25, -18, -22, 4, 0);
const GUARD = P(10, 2, 85, 120, 75, 125, 14, -25, -18, -22, 5, 0);
const CROUCH = P(22, 6, 55, 100, 45, 110, 70, -110, 40, -100, 24, 0);
const seq = (...ps) => ps;
const POSES = {
  idle: { loop: true, fps: 2.2, frames: [STANCE, P(7, -1, 58, 92, 43, 108, 13, -24, -17, -22, 7, 0)] },
  walk: { loop: true, fps: 9, frames: [P(8, 0, 45, 95, 30, 105, 32, -15, -28, -30, 3), P(7, 0, 50, 95, 38, 105, 5, -55, 8, -8, 6), P(8, 0, 40, 95, 50, 100, -28, -30, 32, -15, 3), P(7, 0, 50, 95, 38, 105, 8, -8, 5, -55, 6)] },
  walkBack: { loop: true, fps: 8, frames: [P(2, 0, 60, 105, 45, 110, -24, -28, 24, -14, 3), P(3, 0, 62, 105, 48, 110, 6, -50, 6, -8, 6), P(2, 0, 60, 105, 45, 110, 26, -14, -24, -28, 3), P(3, 0, 62, 105, 48, 110, 8, -8, 6, -50, 6)] },
  crouch: { loop: true, fps: 1, frames: [CROUCH] },
  block: { loop: true, fps: 1, frames: [GUARD] },
  blockLow: { loop: true, fps: 1, frames: [P(24, 4, 90, 125, 80, 130, 70, -110, 40, -100, 24)] },
  prejump: { loop: true, fps: 1, frames: [P(20, 4, 20, 90, 15, 95, 50, -80, 30, -70, 16)] },
  jumpUp: { loop: true, fps: 1, frames: [P(4, 0, 110, 60, 95, 70, 55, -75, 18, -100, -4)] },
  jumpApex: { loop: true, fps: 1, frames: [P(10, 2, 90, 60, 80, 70, 70, -100, 35, -110, -2)] },
  jumpDown: { loop: true, fps: 1, frames: [P(2, 0, 100, 50, 80, 60, 28, -22, -10, -30, 0)] },
  land: { loop: true, fps: 1, frames: [P(20, 4, 40, 100, 40, 105, 62, -100, 40, -90, 20)] },
  dashF: { loop: true, fps: 1, frames: [P(32, 6, -35, 80, -20, 90, 55, -35, -50, -30, 10)] },
  dashB: { loop: true, fps: 1, frames: [P(-14, -4, 50, 100, 40, 110, -35, -40, 30, -20, 12)] },
  hurt: { loop: true, fps: 5, frames: [P(-16, -16, -8, 55, -18, 50, 18, -30, -14, -26, 6), P(-12, -12, -4, 50, -14, 48, 16, -28, -12, -24, 5)] },
  hurtLow: { loop: true, fps: 5, frames: [P(2, -12, 10, 60, 5, 55, 60, -100, 34, -95, 24)] },
  launched: { loop: true, fps: 8, frames: [P(-20, -14, -30, 40, -50, 30, 40, -50, 10, -80, -30, -60), P(-24, -16, -50, 30, -30, 40, 20, -70, 50, -40, -30, -76)] },
  knockdown: { loop: true, fps: 1, frames: [P(0, -10, -10, 20, -5, 25, 4, -10, 2, -6, 49, -90)] },
  ko: { loop: true, fps: 1, frames: [P(0, -12, -20, 15, -10, 20, 6, -8, 3, -4, 49, -90)] },
  victory: { loop: true, fps: 2.5, frames: [P(2, -4, 170, 12, 45, 100, 10, -20, -14, -18, 3), P(4, -6, 178, 6, 50, 100, 12, -22, -16, -20, 9)] },
  intro: { loop: true, fps: 1.6, frames: [P(4, 0, 70, 138, 60, 140, 12, -20, -16, -18, 3), P(5, -2, 72, 134, 62, 138, 11, -19, -15, -18, 6)] },
};
// time-aligned attack timelines: stance -> windup -> impact -> follow-through -> stance
const ATK = (wind, hit, follow) => [[0, STANCE], [0.2, wind], [0.4, hit], [0.58, follow], [1, STANCE]];
const TIMELINES = {
  lp: ATK(P(4, 0, 22, 118, 50, 95, 14, -25, -18, -22, 4), P(18, -3, 90, 4, 35, 112, 28, -22, -26, -26, 6), P(12, -2, 72, 24, 38, 110, 22, -22, -22, -24, 5)),
  lk: ATK(P(-4, 0, 60, 105, 50, 108, 70, -95, -14, -20, 4), P(-12, -2, 55, 100, 45, 108, 84, -4, -10, -14, 4), P(-4, 0, 58, 100, 45, 108, 40, -55, -14, -20, 4)),
  hp: ATK(P(-8, 0, 15, 125, 60, 100, 22, -30, -26, -26, 10), P(28, -5, 92, 2, 40, 118, 42, -35, -36, -20, 12), P(18, -3, 70, 30, 42, 112, 34, -30, -30, -22, 9)),
  hk: ATK(P(-14, 0, 60, 100, 45, 108, 132, -12, -12, -20, 6), P(8, 0, 60, 100, 45, 108, 12, -4, -14, -20, 8), P(6, 0, 58, 100, 45, 108, 20, -30, -14, -22, 6)),
  launcher: ATK(P(30, 6, -10, 55, 20, 80, 62, -100, 40, -92, 22), P(-8, -8, 172, 6, 40, 118, 28, -30, -22, -40, -2), P(-6, -6, 150, 20, 45, 110, 20, -28, -20, -30, 0)),
  sweep: ATK(P(26, 6, 40, 100, 30, 105, 66, -110, 40, -100, 24), P(-26, -6, 40, 100, 30, 105, 90, -2, 62, -122, 44), P(-10, 0, 45, 100, 35, 105, 60, -70, 40, -100, 28)),
  airP: ATK(P(8, 0, 40, 110, 50, 100, 50, -80, 20, -100, 0), P(16, -2, 92, 4, 45, 110, 46, -85, 22, -100, 0), P(10, 0, 70, 30, 46, 105, 48, -82, 20, -100, 0)),
  airK: ATK(P(0, 0, 60, 100, 45, 108, 80, -100, 20, -110, 0), P(-14, -2, 60, 100, 45, 108, 88, -2, 25, -100, 0), P(-4, 0, 60, 100, 45, 108, 60, -50, 20, -100, 0)),
  special: ATK(P(-6, 0, -30, 70, -20, 80, 22, -30, -26, -28, 10), P(16, -3, 88, 6, 80, 8, 40, -28, -32, -26, 8), P(10, -2, 70, 24, 66, 26, 30, -26, -26, -24, 7)),
};
const sampleTimeline = (tl, t) => {
  for (let i = 0; i < tl.length - 1; i++) if (t <= tl[i + 1][0]) { const u = smooth(clamp((t - tl[i][0]) / (tl[i + 1][0] - tl[i][0]), 0, 1)); return mixPose(tl[i][1], tl[i + 1][1], u); }
  return tl[tl.length - 1][1];
};
const mixPose = (a, b, t) => Object.fromEntries(K.map(k => [k, lerp(a[k], b[k], t)]));
const sampleLoop = (def, tFrames) => {
  const n = def.frames.length; if (n === 1) return def.frames[0];
  const x = (tFrames / 60) * def.fps, i = Math.floor(x) % n, u = smooth(x - Math.floor(x));
  return mixPose(def.frames[i], def.frames[(i + 1) % n], u);
};
export function poseFor(f) {
  const a = f.anim;
  if (a === 'getup') { const u = clamp(f.animT / 20, 0, 1); return u < 0.5 ? mixPose(POSES.knockdown.frames[0], CROUCH, smooth(u * 2)) : mixPose(CROUCH, STANCE, smooth(u * 2 - 1)); }
  if (a === 'super') {
    const p = f.animP, t = f.animT;
    if (p < 0.2) return mixPose(STANCE, P(24, 4, 150, 60, 150, 60, 60, -90, 30, -90, 20), smooth(p / 0.2));
    if (p > 0.8) return sampleTimeline(TIMELINES.launcher, 0.42 + (p - 0.8) * 0.5);
    const cyc = Math.floor(t / 6) % 3, key = ['lp', 'hp', 'lk'][cyc], u = (t % 6) / 6;
    return sampleTimeline(TIMELINES[key], 0.22 + 0.2 * Math.sin(u * Math.PI));
  }
  if (TIMELINES[a]) return sampleTimeline(TIMELINES[a], f.animP);
  if (a === 'launched') { const w = Math.sin(f.animT * 0.25); const p = POSES.launched.frames; const base = sampleLoop(POSES.launched, f.animT); base.rot = clamp(-30 - f.animT * 6 * Math.sign(f.vx || 1) * 0 - f.animT * 5, -90, -20) + w * 4; return base; }
  const d = POSES[a] || POSES.idle;
  return sampleLoop(d, f.animT);
}

// ------------------------------------------------------------- rig drawing
const SEG = { thigh: 32, shin: 31, torso: 38, neck: 6, head: 11, upper: 24, lower: 22 };
const shade = (hex, amt) => { const n = parseInt(hex.slice(1), 16); const c = v => clamp(Math.round(v + amt), 0, 255); return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`; };

function limb(ctx, x, y, ang, len, w0, w1, color, hi) {
  const ex = x + Math.sin(ang) * len, ey = y + Math.cos(ang) * len;
  ctx.lineCap = 'round';
  ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = Math.max(w0, w1) + 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  const g = ctx.createLinearGradient(x, y, ex, ey); g.addColorStop(0, color); g.addColorStop(1, hi || color);
  ctx.strokeStyle = g; ctx.lineWidth = (w0 + w1) / 2; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.13)'; ctx.lineWidth = Math.max(1.5, (w0 + w1) / 6); ctx.beginPath(); ctx.moveTo(x - 1.5, y); ctx.lineTo(ex - 1.5, ey); ctx.stroke();
  return [ex, ey];
}

function drawProp(ctx, look, hx, hy, ang) {
  ctx.save(); ctx.translate(hx, hy); ctx.rotate(-ang);
  if (look.prop === 'briefcase') { ctx.fillStyle = '#3a2a1c'; ctx.strokeStyle = '#150e08'; ctx.lineWidth = 2; ctx.fillRect(-2, 2, 30, 20); ctx.strokeRect(-2, 2, 30, 20); ctx.fillStyle = '#c9a24a'; ctx.fillRect(10, 10, 5, 3); ctx.strokeStyle = '#150e08'; ctx.strokeRect(8, -2, 10, 5); }
  if (look.prop === 'megaphone') { ctx.fillStyle = '#e8e8e8'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(24, -4); ctx.lineTo(24, 20); ctx.lineTo(0, 12); ctx.closePath(); ctx.fill(); ctx.stroke(); }
  if (look.prop === 'handbag') { ctx.fillStyle = '#ff77c8'; ctx.strokeStyle = '#7a2a5a'; ctx.lineWidth = 2; ctx.fillRect(0, 6, 22, 16); ctx.strokeRect(0, 6, 22, 16); ctx.beginPath(); ctx.arc(11, 6, 7, Math.PI, 0); ctx.stroke(); }
  if (look.prop === 'controller') { ctx.fillStyle = '#2b2b33'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.fillRect(-2, 6, 26, 12); ctx.strokeRect(-2, 6, 26, 12); ctx.fillStyle = '#96d84e'; ctx.fillRect(15, 9, 4, 4); }
  if (look.prop === 'phone') { ctx.fillStyle = '#111'; ctx.strokeStyle = '#ff74a6'; ctx.lineWidth = 2; ctx.fillRect(2, -4, 12, 22); ctx.strokeRect(2, -4, 12, 22); }
  if (look.prop === 'pompom') { ctx.fillStyle = '#f4f4f4'; ctx.strokeStyle = '#d93030'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(8, 8, 11, 0, 7); ctx.fill(); ctx.stroke(); }
  if (look.prop === 'shaker') { ctx.fillStyle = 'rgba(220,240,255,0.85)'; ctx.strokeStyle = '#222'; ctx.lineWidth = 2; ctx.fillRect(2, -6, 12, 24); ctx.strokeRect(2, -6, 12, 24); ctx.fillStyle = '#8cff20'; ctx.fillRect(3, 6, 10, 11); ctx.fillStyle = '#222'; ctx.fillRect(1, -10, 14, 5); }
  ctx.restore();
}

export function drawRig(ctx, def, f, pose, opts = {}) {
  const L = def.look, B = L.build || 1, hipH = SEG.thigh + SEG.shin;
  const skin = L.skin, skinHi = shade(skin, 22), skinLo = shade(skin, -35);
  const top = L.top, topHi = shade(top, 25), pants = L.pants, pantsHi = shade(pants, 22);
  ctx.save();
  const hy = -hipH + pose.drop;
  ctx.translate(0, hy); ctx.rotate(pose.rot * D2R);
  const hip = [0, 0];
  const lean = pose.lean * D2R, up = [Math.sin(lean), -Math.cos(lean)];
  const sh = [up[0] * SEG.torso, up[1] * SEG.torso];
  const headAng = lean + pose.head * D2R;
  const hc = [sh[0] + Math.sin(headAng) * (SEG.neck + SEG.head), sh[1] - Math.cos(headAng) * (SEG.neck + SEG.head)];
  const legW = 12 * B, armW = 9.5 * B;
  const drawArm = (u, l, back) => {
    const sx = sh[0] + (back ? -2 : 3), sy = sh[1] + 3;
    const sleeve = L.tank ? skin : top, sleeveHi = L.tank ? skinHi : topHi;
    const e = limb(ctx, sx, sy, u * D2R, SEG.upper, armW + 2, armW, sleeve, sleeveHi);
    const h = limb(ctx, e[0], e[1], (u + l) * D2R, SEG.lower, armW, armW - 1.5, skin, skinHi);
    ctx.fillStyle = skin; ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(h[0], h[1], 5.2 * B, 0, 7); ctx.fill(); ctx.stroke();
    return [h[0], h[1], (u + l) * D2R];
  };
  const drawLeg = (u, l, back) => {
    const ox = back ? -3 : 2;
    const k = limb(ctx, ox, 2, u * D2R, SEG.thigh, legW + 2, legW, pants, pantsHi);
    const a = limb(ctx, k[0], k[1], (u + l) * D2R, SEG.shin, legW, legW - 2, pants, pantsHi);
    const fa = (u + l) * D2R;
    ctx.save(); ctx.translate(a[0], a[1]); ctx.rotate(-fa * 0.35);
    ctx.fillStyle = L.boots; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.roundRect(-5, -3, 21 * B, 9, 3); ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-3, -2, 17 * B, 2); ctx.restore();
  };
  // back limbs
  drawArm(pose.a2u, pose.a2l, true);
  drawLeg(pose.l2u, pose.l2l, true);
  // torso
  ctx.save();
  const tw = 15 * B;
  const nx = -up[1], ny = up[0];
  const quad = [[hip[0] - nx * tw * 0.9, hip[1] - ny * tw * 0.9], [hip[0] + nx * tw * 0.9, hip[1] + ny * tw * 0.9], [sh[0] + nx * tw * 1.15, sh[1] + ny * tw * 1.15], [sh[0] - nx * tw * 1.15, sh[1] - ny * tw * 1.15]];
  const tg = ctx.createLinearGradient(sh[0] - tw, sh[1], sh[0] + tw, sh[1]);
  tg.addColorStop(0, shade(top, -25)); tg.addColorStop(0.5, topHi); tg.addColorStop(1, shade(top, -45));
  ctx.fillStyle = L.tank ? tg : tg; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); quad.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.fill(); ctx.stroke();
  if (L.shirt) { ctx.fillStyle = L.shirt; ctx.beginPath(); ctx.moveTo(sh[0] - 3, sh[1] - 1); ctx.lineTo(sh[0] + 4, sh[1] - 1); ctx.lineTo(hip[0] + up[0] * 12 + 3, hip[1] + up[1] * 12); ctx.lineTo(hip[0] + up[0] * 12 - 3, hip[1] + up[1] * 12); ctx.fill(); }
  if (L.tie) { ctx.strokeStyle = L.tie; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(sh[0] + nx * 1, sh[1] - 2); ctx.lineTo(hip[0] + up[0] * 14, hip[1] + up[1] * 14); ctx.stroke(); }
  if (L.tank) { ctx.fillStyle = skin; ctx.beginPath(); ctx.arc(sh[0] - up[0] * 4 + 2, sh[1] - up[1] * 4, 6, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(sh[0] - 3, sh[1] + 8, 10, 2); }
  if (!L.tank && !L.shirt && def.id === 'bogan-tradie') { ctx.fillStyle = '#e8f04a'; ctx.globalAlpha = 0.8; ctx.fillRect(sh[0] - tw, sh[1] + 12, tw * 2.2, 3); ctx.fillRect(sh[0] - tw, sh[1] + 20, tw * 2.2, 3); ctx.globalAlpha = 1; }
  ctx.restore();
  // belt
  ctx.strokeStyle = '#111'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(hip[0] - nx * tw * 0.9, hip[1] - ny * tw * 0.9); ctx.lineTo(hip[0] + nx * tw * 0.9, hip[1] + ny * tw * 0.9); ctx.stroke();
  drawLeg(pose.l1u, pose.l1l, false);
  // neck + head
  limb(ctx, sh[0], sh[1], headAng, SEG.neck + 2, 7, 7, skin, skinHi);
  ctx.save(); ctx.translate(hc[0], hc[1]); ctx.rotate(headAng);
  const hg = ctx.createRadialGradient(-3, -4, 2, 0, 0, SEG.head + 3); hg.addColorStop(0, skinHi); hg.addColorStop(1, skinLo);
  ctx.fillStyle = hg; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.ellipse(0, 0, SEG.head - 1, SEG.head + 1.5, 0, 0, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = L.hair; ctx.beginPath(); ctx.ellipse(-1.5, -4.5, SEG.head, 7.5, 0, Math.PI, 0); ctx.fill();
  // face
  const hurt = ['hurt', 'hurtLow', 'launched', 'knockdown', 'ko'].includes(f.anim);
  ctx.strokeStyle = '#1a1210'; ctx.lineWidth = 1.8; ctx.fillStyle = '#fff';
  if (hurt) { ctx.beginPath(); ctx.moveTo(2, -3); ctx.lineTo(7, 0); ctx.moveTo(7, -3); ctx.lineTo(2, 0); ctx.stroke(); }
  else { ctx.beginPath(); ctx.ellipse(5, -2, 2.2, 2.6, 0, 0, 7); ctx.fill(); ctx.fillStyle = '#1a1210'; ctx.beginPath(); ctx.arc(5.8, -2, 1.3, 0, 7); ctx.fill(); }
  ctx.beginPath(); ctx.moveTo(2.5, -6); ctx.lineTo(8, hurt ? -5 : -7.5); ctx.stroke();
  ctx.beginPath(); if (hurt || f.state === 'attack') { ctx.ellipse(6, 5, 2.5, 2, 0, 0, 7); ctx.stroke(); } else { ctx.moveTo(3, 5); ctx.lineTo(8, 4.5); ctx.stroke(); }
  if (L.hat === 'hardhat') {
    ctx.fillStyle = L.hatColor; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(-1, -6, SEG.head + 1, 9, 0, Math.PI, 0); ctx.fill(); ctx.stroke();
    ctx.fillRect(-SEG.head - 1, -7, SEG.head * 2 + 9, 3.5); ctx.strokeRect(-SEG.head - 1, -7, SEG.head * 2 + 9, 3.5);
    ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(-4, -13, 8, 2);
  }
  if (L.hat === 'cap' || L.hat === 'beanie') { ctx.fillStyle = L.hatColor || '#222'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(-1, -5, SEG.head, 9, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); if (L.hat === 'cap') ctx.fillRect(2, -7, SEG.head + 6, 3); }
  if (L.hat === 'fedora') { ctx.fillStyle = L.hatColor || '#111'; ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 2; ctx.fillRect(-SEG.head - 3, -9, SEG.head * 2 + 10, 3); ctx.beginPath(); ctx.ellipse(-1, -9, SEG.head - 2, 8, 0, Math.PI, 0); ctx.fill(); ctx.stroke(); }
  if (L.hat === 'headset') { ctx.strokeStyle = '#2b2b3a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, -3, SEG.head + 1, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke(); ctx.fillStyle = '#6a3dc0'; ctx.fillRect(-SEG.head - 3, -2, 5, 8); }
  if (L.sunglasses || L.glasses) { ctx.fillStyle = L.sunglasses ? '#0a0a0a' : 'rgba(255,255,255,0.35)'; ctx.strokeStyle = '#0a0a0a'; ctx.lineWidth = 1.2; ctx.fillRect(3, -5, 7, 5); ctx.strokeRect(3, -5, 7, 5); }
  if (def.id === 'yuppie') { ctx.strokeStyle = L.hair; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-9, -6); ctx.quadraticCurveTo(0, -17, 10, -7); ctx.stroke(); }
  if (def.id === 'gym-bro') { ctx.fillStyle = '#e9e9e9'; ctx.fillRect(-SEG.head, -9, SEG.head * 2, 3); }
  ctx.restore();
  // front arm last (over torso), with prop
  const h = drawArm(pose.a1u, pose.a1l, false);
  if (L.prop && L.prop !== 'none') drawProp(ctx, L, h[0], h[1], h[2] - Math.PI / 2 + Math.PI / 2);
  ctx.restore();
}

// ------------------------------------------------------------------ art mode
export class ArtStore {
  constructor() { this.manifest = null; this.imgs = new Map(); }
  async load(url = './art/manifest.json') {
    try { const r = await fetch(url, { cache: 'no-cache' }); if (!r.ok) return false; this.manifest = await r.json(); this.preload(); return true; } catch { return false; }
  }
  // load every listed frame up front so a fighter never flashes back to the stand-in rig mid-move
  preload() {
    for (const [id, s] of Object.entries(this.manifest || {})) {
      if (!s || !s.anims) continue;
      for (const [a, spec] of Object.entries(s.anims)) for (let n = 1; n <= spec.frames; n++) this.img(id, a, n);
      this.portrait(id);
    }
  }
  has(id) { return !!(this.manifest && this.manifest[id] && this.manifest[id].anims); }
  spec(id) { return this.manifest && this.manifest[id]; }
  img(id, anim, n) {
    const s = this.spec(id), url = s.path.replace('{id}', id).replace('{anim}', anim).replace('{n}', String(n).padStart(2, '0'));
    let e = this.imgs.get(url); if (!e) { e = new Image(); e.src = url; e.ok = false; e.onload = () => (e.ok = true); this.imgs.set(url, e); }
    return e.ok ? e : null;
  }
  portrait(id) { const s = this.spec(id); if (!s || !s.portrait) return null; const url = s.portrait.replace('{id}', id); let e = this.imgs.get(url); if (!e) { e = new Image(); e.src = url; e.ok = false; e.onload = () => (e.ok = true); this.imgs.set(url, e); } return e.ok ? e : null; }
  scene(url) { if (!this.manifest || !this.manifest.scenes) return null; let e = this.imgs.get(url); if (!e) { e = new Image(); e.src = url; e.ok = false; e.onload = () => (e.ok = true); e.onerror = () => (e.bad = true); this.imgs.set(url, e); } return e.ok ? e : null; }
}
const ATTACK_ANIMS = new Set(['lp', 'lk', 'hp', 'hk', 'launcher', 'sweep', 'airP', 'airK', 'special', 'super']);
const FALLBACKS = { blockLow: 'block', hurtLow: 'hurt', jumpApex: 'jumpUp', prejump: 'crouch', land: 'crouch', dashF: 'walk', dashB: 'walkBack', launched: 'hurt', intro: 'idle', taunt: 'victory' };

function drawArt(ctx, store, def, f) {
  const spec = store.spec(def.id);
  let name = f.anim; if (!spec.anims[name]) name = FALLBACKS[name] || 'idle'; if (!spec.anims[name]) return false;
  const a = spec.anims[name], n = a.frames;
  let x, idx;
  if (ATTACK_ANIMS.has(f.anim) || a.once) x = clamp(f.animP || f.animT / (a.fps ? 60 / a.fps * n : 20), 0, 0.999) * n;
  else x = (f.animT / 60) * (a.fps || 10);
  idx = Math.floor(x) % n; const u = x - Math.floor(x);
  const cur = store.img(def.id, name, idx + 1); if (!cur) return false;
  const nxt = (a.loop !== false || idx + 1 < n) ? store.img(def.id, name, ((idx + 1) % n) + 1) : null;
  const w = cur.width * spec.scale, h = cur.height * spec.scale, ax = spec.anchor[0] * spec.scale, ay = spec.anchor[1] * spec.scale;
  ctx.drawImage(cur, -ax, -ay, w, h);
  if (nxt && u > 0.01) { ctx.globalAlpha = smooth(u) * 0.85; ctx.drawImage(nxt, -ax, -ay, w, h); ctx.globalAlpha = 1; }
  return true;
}

// ------------------------------------------------------------ fighter + fx
export function drawFighter(ctx, f, store) {
  const def = f.def, s = DRAW_SCALE, floor = STAGE.floorY;
  // ground shadow
  const sh = clamp(1 - f.y / 260, 0.25, 1);
  ctx.save(); ctx.translate(f.x, floor); ctx.fillStyle = `rgba(0,0,0,${0.38 * sh})`; ctx.beginPath(); ctx.ellipse(0, 4, 42 * sh, 9 * sh, 0, 0, 7); ctx.fill(); ctx.restore();
  ctx.save(); ctx.translate(f.x, floor - f.y); ctx.scale(f.facing * s, s);
  if (f.invuln > 0 && f.anim === 'super') { ctx.shadowColor = def.accent; ctx.shadowBlur = 28; }
  let done = false;
  if (f.freeze > 0 && (f.state === 'hit' || f.state === 'launched')) ctx.filter = 'brightness(2.1) saturate(0.6)'; // hit-stop flash on the silhouette
  if (store && store.has(def.id)) done = drawArt(ctx, store, def, f);
  if (!done) drawRig(ctx, def, f, poseFor(f));
  ctx.filter = 'none';
  ctx.restore();
}

const fx = { parts: [], texts: [] };
export function pushFx(events) {
  for (const e of events) {
    if (e.type === 'hit' || e.type === 'counter') {
      const n = 8 + Math.round((e.power || 0.3) * 14);
      for (let i = 0; i < n; i++) { const a = Math.random() * 6.28, v = 2 + Math.random() * 6; fx.parts.push({ x: e.x, y: STAGE.floorY - e.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1, life: 16 + Math.random() * 10, c: e.type === 'counter' ? '#ffcc33' : '#ffffff', r: 2 + Math.random() * 3 }); }
      fx.parts.push({ x: e.x, y: STAGE.floorY - e.y, ring: true, life: 10, max: 10, r: 10 + (e.power || 0.3) * 30, c: e.type === 'counter' ? '#ffcc33' : '#ffffff' });
      if (e.type === 'counter') fx.texts.push({ t: 'COUNTER!', x: e.x, y: STAGE.floorY - e.y - 40, life: 45, c: '#ffcc33' });
    } else if (e.type === 'block') { for (let i = 0; i < 6; i++) fx.parts.push({ x: e.x, y: STAGE.floorY - e.y, vx: (Math.random() - 0.5) * 6, vy: -Math.random() * 4, life: 12, c: '#7ec8ff', r: 2 }); }
    else if (e.type === 'slam' || e.type === 'land') { for (let i = 0; i < 8; i++) fx.parts.push({ x: e.x, y: STAGE.floorY, vx: (Math.random() - 0.5) * 7, vy: -Math.random() * 2.5, life: 20, c: 'rgba(200,190,170,0.7)', r: 3 + Math.random() * 3 }); }
    else if (e.type === 'projectileHit') for (let i = 0; i < 10; i++) { const a = Math.random() * 6.28; fx.parts.push({ x: e.x, y: e.y ? STAGE.floorY - e.y : STAGE.floorY - 80, vx: Math.cos(a) * 4, vy: Math.sin(a) * 4, life: 14, c: '#ffb347', r: 3 }); }
    else if (e.type === 'bonus') fx.texts.push({ t: e.text, x: 480, y: 170, life: 70, c: '#7fe0d2' });
  }
}
function drawFx(ctx) {
  for (const p of fx.parts) {
    p.life--; if (p.ring) { const u = 1 - p.life / p.max; ctx.strokeStyle = p.c; ctx.globalAlpha = 1 - u; ctx.lineWidth = 4 * (1 - u) + 1; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * (0.4 + u), 0, 7); ctx.stroke(); ctx.globalAlpha = 1; continue; }
    p.x += p.vx; p.y += p.vy; p.vy += 0.25; ctx.globalAlpha = clamp(p.life / 14, 0, 1); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
  }
  fx.parts = fx.parts.filter(p => p.life > 0);
  for (const t of fx.texts) { t.life--; t.y -= 0.4; ctx.globalAlpha = clamp(t.life / 20, 0, 1); ctx.fillStyle = t.c; ctx.strokeStyle = '#000'; ctx.lineWidth = 4; ctx.font = 'italic 900 26px system-ui,sans-serif'; ctx.textAlign = 'center'; ctx.strokeText(t.t, t.x, t.y); ctx.fillText(t.t, t.x, t.y); ctx.globalAlpha = 1; }
  fx.texts = fx.texts.filter(t => t.life > 0);
}
export function drawProjectile(ctx, p) {
  const y = STAGE.floorY - p.y; ctx.save(); ctx.translate(p.x, y); ctx.scale(Math.sign(p.vx) || 1, 1);
  if (p.kind === 'nail') { ctx.shadowColor = '#ffd31a'; ctx.shadowBlur = 12; for (let i = -1; i <= 1; i++) { ctx.fillStyle = '#d8d8d8'; ctx.fillRect(-14, i * 6 - 1, 26, 2.5); ctx.fillStyle = '#ffd31a'; ctx.fillRect(10, i * 6 - 2, 6, 5); } }
  else if (p.kind === 'shaker') { ctx.rotate(p.x * 0.05); ctx.shadowColor = '#8cff20'; ctx.shadowBlur = 16; ctx.fillStyle = 'rgba(210,240,255,0.9)'; ctx.fillRect(-9, -15, 18, 30); ctx.fillStyle = '#8cff20'; ctx.fillRect(-8, -4, 16, 18); ctx.fillStyle = '#222'; ctx.fillRect(-10, -19, 20, 6); }
  else if (p.kind === 'sound' || p.kind === 'palm') { ctx.strokeStyle = p.kind === 'sound' ? '#35e6e1' : '#4ed8b4'; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 14; ctx.lineWidth = 4; for (let i = 0; i < 3; i++) { ctx.globalAlpha = 1 - i * 0.28; ctx.beginPath(); ctx.arc(-i * 10, 0, 12 + i * 6, -1, 1); ctx.stroke(); } }
  else if (p.kind === 'flash') { ctx.shadowColor = '#ff74a6'; ctx.shadowBlur = 20; ctx.fillStyle = '#fff'; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4, r = i % 2 ? 7 : 18; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); }
  else if (p.kind === 'bubble') { ctx.shadowColor = '#6ac0ff'; ctx.shadowBlur = 12; ctx.fillStyle = 'rgba(210,235,255,0.92)'; ctx.strokeStyle = '#6ac0ff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(0, 0, 22, 14, 0, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = '#6ac0ff'; ctx.fillRect(-12, -3, 24, 2.5); ctx.fillRect(-12, 2, 16, 2.5); }
  else { ctx.fillStyle = '#7fe0d2'; ctx.beginPath(); ctx.arc(0, 0, 10, 0, 7); ctx.fill(); }
  ctx.restore();
}

// -------------------------------------------------------------------- stage
export function drawStage(ctx, tick, accent = '#7fe0d2') {
  const W = STAGE.width, F = STAGE.floorY;
  const g = ctx.createLinearGradient(0, 0, 0, F); g.addColorStop(0, '#0b1230'); g.addColorStop(0.6, '#2a1b4d'); g.addColorStop(1, '#6a2f5e');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 540);
  // moon + haze
  ctx.fillStyle = 'rgba(255,240,220,0.9)'; ctx.beginPath(); ctx.arc(760, 90, 34, 0, 7); ctx.fill();
  ctx.fillStyle = 'rgba(255,240,220,0.08)'; ctx.beginPath(); ctx.arc(760, 90, 80, 0, 7); ctx.fill();
  // skyline layers (parallax-free but layered)
  const bld = (seed, col, base, hmin, hmax, win) => {
    let x = -20, s = seed; ctx.fillStyle = col;
    while (x < W + 20) { s = (s * 16807) % 2147483647; const w = 50 + (s % 60), h = hmin + (s % (hmax - hmin)); ctx.fillRect(x, base - h, w, h);
      if (win) for (let wy = base - h + 10; wy < base - 8; wy += 16) for (let wx = x + 6; wx < x + w - 8; wx += 14) { s = (s * 16807) % 2147483647; if (s % 5 < 2) { ctx.fillStyle = (s % 3 === 0) ? 'rgba(255,200,120,0.85)' : 'rgba(140,200,255,0.65)'; ctx.fillRect(wx, wy, 6, 8); } }
      ctx.fillStyle = col; x += w + 4; }
  };
  bld(7, '#15183a', F - 30, 120, 230, true); bld(13, '#0e1028', F - 8, 70, 150, true);
  // neon sign
  ctx.save(); ctx.shadowColor = accent; ctx.shadowBlur = 18; ctx.strokeStyle = accent; ctx.lineWidth = 3; ctx.globalAlpha = 0.75 + 0.2 * Math.sin(tick / 25);
  ctx.strokeRect(70, 170, 130, 36); ctx.font = '700 20px system-ui'; ctx.fillStyle = accent; ctx.textAlign = 'center'; ctx.fillText('SOCIAL CLUB', 135, 195); ctx.restore();
  // floor
  const fg = ctx.createLinearGradient(0, F, 0, 540); fg.addColorStop(0, '#2a2236'); fg.addColorStop(1, '#0d0a14'); ctx.fillStyle = fg; ctx.fillRect(0, F, W, 540 - F);
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 1;
  for (let i = -8; i <= 18; i++) { ctx.beginPath(); ctx.moveTo(480 + (i * 60 - 480) * 0.25, F); ctx.lineTo(480 + (i * 60 - 480) * 1.5, 540); ctx.stroke(); }
  for (let y = F + 8; y < 540; y += 9 + (y - F) * 0.2) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, F, W, 2);
}

// ---------------------------------------------------------------------- HUD
export function drawHUD(ctx, m, hudState) {
  const [a, b] = m.fighters, W = STAGE.width;
  const bar = (f, side) => {
    const x = side === 0 ? 30 : W - 30 - 360, w = 360, y = 22;
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 3, y - 3, w + 6, 26);
    const hp = f.hp / f.maxHp, chip = hudState.chip[side] = Math.max(hp, (hudState.chip[side] ?? hp) - 0.004);
    const draw = (v, col) => { ctx.fillStyle = col; if (side === 0) ctx.fillRect(x, y, w * v, 20); else ctx.fillRect(x + w * (1 - v), y, w * v, 20); };
    draw(chip, '#c0392b'); draw(hp, hp > 0.3 ? f.def.accent : '#ff5555');
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y, w, 7);
    // meter
    const my = y + 30; ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x - 3, my - 2, 250 + 6, 14 + 4 - 2);
    const mv = f.meter / 100; ctx.fillStyle = mv >= 1 ? (Math.floor(m.tick / 8) % 2 ? '#fff' : '#ffd31a') : '#4aa8ff';
    ctx.fillRect(side === 0 ? x : x + w - 250 * mv, my, 250 * mv, 12);
    if (mv >= 1) { ctx.font = '800 11px system-ui'; ctx.fillStyle = '#000'; ctx.textAlign = side === 0 ? 'left' : 'right'; ctx.fillText('SUPER READY: DOWN + SPECIAL', side === 0 ? x + 6 : x + w - 6, my + 10); }
    ctx.font = '700 15px system-ui'; ctx.fillStyle = '#fff'; ctx.textAlign = side === 0 ? 'left' : 'right'; ctx.fillText(f.def.name.toUpperCase(), side === 0 ? x : x + w, my + 30);
    for (let i = 0; i < m.toWin; i++) { ctx.globalAlpha = i < f.wins ? 1 : 0.28; ctx.fillStyle = '#ffd31a'; ctx.beginPath(); const px = side === 0 ? x + 8 + i * 18 : x + w - 8 - i * 18; ctx.arc(px, my + 44, 6, 0, 7); ctx.fill(); }
    ctx.globalAlpha = 1;
  };
  bar(a, 0); bar(b, 1);
  ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(W / 2 - 34, 14, 68, 44); ctx.fillStyle = '#fff'; ctx.font = '900 32px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(m.training ? '∞' : String(m.timer), W / 2, 48);
  // combo counters
  for (const [f, side] of [[a, 0], [b, 1]]) if (f.combo >= 2) {
    ctx.save(); ctx.textAlign = side === 0 ? 'left' : 'right'; const x = side === 0 ? 40 : W - 40;
    ctx.font = 'italic 900 54px system-ui'; ctx.fillStyle = '#ffd31a'; ctx.strokeStyle = '#000'; ctx.lineWidth = 6; ctx.strokeText(`${f.combo} HITS`, x, 180); ctx.fillText(`${f.combo} HITS`, x, 180);
    ctx.font = '700 18px system-ui'; ctx.fillStyle = '#fff'; ctx.strokeText(`${f.comboDmg} damage`, x, 206); ctx.fillText(`${f.comboDmg} damage`, x, 206); ctx.restore();
  }
  // announcer
  const say = (t, c = '#fff', sz = 76) => { ctx.save(); ctx.textAlign = 'center'; ctx.font = `italic 900 ${sz}px system-ui`; ctx.lineWidth = 8; ctx.strokeStyle = '#000'; ctx.fillStyle = c; ctx.strokeText(t, W / 2, 270); ctx.fillText(t, W / 2, 270); ctx.restore(); };
  if (m.phase === 'intro') { if (m.phaseT < 60) say(`ROUND ${m.round}`); else say('FIGHT!', '#ffd31a'); }
  if (m.phase === 'fight' && m.phaseT < 35) say('FIGHT!', '#ffd31a');
  if (m.phase === 'ko' || m.phase === 'over') say(m.roundWinner === -1 ? 'DRAW' : 'K.O.!', '#ff4d4d', 110);
  if (m.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${m.flash / 18})`; ctx.fillRect(0, 0, W, 540); }
}

export function drawMatch(ctx, m, store, hudState) {
  const sx = m.shake > 0 ? (Math.random() - 0.5) * m.shake : 0, sy = m.shake > 0 ? (Math.random() - 0.5) * m.shake * 0.6 : 0;
  ctx.save(); ctx.translate(sx, sy);
  drawStage(ctx, m.tick, m.fighters[0].def.accent);
  // draw the attacker in front
  const order = m.fighters.slice().sort((p, q) => (p.state === 'attack' ? 1 : 0) - (q.state === 'attack' ? 1 : 0));
  for (const f of order) drawFighter(ctx, f, store);
  for (const p of m.projectiles) drawProjectile(ctx, p);
  drawFx(ctx);
  ctx.restore();
  if (m.flash > 0) { /* superFlash vignette handled in HUD */ }
  drawHUD(ctx, m, hudState);
}

// large character portrait for select / cutscenes (art portrait if supplied, rig otherwise)
export function drawPortrait(ctx, def, store, cx, baseY, scale, animT = 0, anim = 'idle') {
  const img = store && store.portrait(def.id);
  if (img) { const h = 520 * scale / 2.4, w = img.width * (h / img.height); ctx.drawImage(img, cx - w / 2, baseY - h, w, h); return; }
  const f = { def, anim, animT, animP: 0, state: anim === 'hurt' ? 'hit' : 'idle', vx: 0, facing: 1 };
  ctx.save(); ctx.translate(cx, baseY); ctx.scale(scale, scale); drawRig(ctx, def, f, poseFor(f)); ctx.restore();
}
