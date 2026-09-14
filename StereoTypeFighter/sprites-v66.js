export const sequences = ['idle','walk','jump','crouch','punch','kick','special','hurt','block','fall','getup','victory'];

const CELL = 64;
const COLS = 5;
const portraitSheetPromise = (async () => {
  const parts = await Promise.all([0,1,2,3].map(i => fetch(new URL(`./assets/characters/portraits/roster-${i}.b64`, import.meta.url)).then(r => { if (!r.ok) throw new Error('Portrait chunk unavailable'); return r.text(); })));
  const raw = atob(parts.join('').replace(/\s/g,''));
  const bytes = new Uint8Array(raw.length);
  for (let i=0;i<raw.length;i++) bytes[i] = raw.charCodeAt(i);
  return loadImage(URL.createObjectURL(new Blob([bytes], {type:'image/webp'})));
})();
const assetCache = new Map();

export const surface = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h; return c;
};

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Unable to load image: ' + src));
    img.src = src;
  });
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function lerp(a, b, t) { return a + (b - a) * t; }

export async function loadRosterPortrait(index) {
  const sheet = await portraitSheetPromise;
  const sx = (index % COLS) * CELL;
  const sy = Math.floor(index / COLS) * CELL;
  const c = surface(CELL, CELL);
  c.getContext('2d').drawImage(sheet, sx, sy, CELL, CELL, 0, 0, CELL, CELL);
  return c;
}

function trim(c, anchorX = c.width / 2, anchorY = c.height) {
  const w = c.width, h = c.height;
  const data = c.getContext('2d', { willReadFrequently: true }).getImageData(0, 0, w, h).data;
  let l = w, t = h, r = -1, b = -1;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (data[(y * w + x) * 4 + 3] > 8) {
        l = Math.min(l, x); r = Math.max(r, x); t = Math.min(t, y); b = Math.max(b, y);
      }
    }
  }
  if (r < l) return { canvas: c, px: anchorX, py: anchorY, scale: 1 };
  const out = surface(r - l + 1, b - t + 1);
  out.getContext('2d').drawImage(c, l, t, out.width, out.height, 0, 0, out.width, out.height);
  return { canvas: out, px: anchorX - l, py: anchorY - t, scale: 1 };
}

function makeAtlasCell(img, index, [w, h], cols) {
  const c = surface(w, h);
  const x = (index % cols) * w;
  const y = Math.floor(index / cols) * h;
  c.getContext('2d').drawImage(img, x, y, w, h, 0, 0, w, h);
  return trim(c, w / 2, h);
}

function median(arr) {
  const vals = [...arr].sort((a, b) => a - b);
  return vals[Math.floor(vals.length / 2)] || 1;
}

function normalizeAtlasFrames(frames) {
  const idleHeights = frames.idle?.map(f => f.canvas.height) || [88];
  const target = 104;
  const idleMedian = median(idleHeights);
  const baseScale = target / idleMedian;
  for (const [state, list] of Object.entries(frames)) {
    const stateHeights = list.map(f => f.canvas.height);
    const stateMedian = median(stateHeights) || idleMedian;
    const consistentScale = target / clamp(stateMedian, idleMedian * 0.85, idleMedian * 1.18);
    const scale = ['punch','kick','special','hurt','block','victory'].includes(state) ? consistentScale : baseScale;
    for (const frame of list) frame.scale = scale;
  }
}

function poseFromFrames(asset, state, tick, duration = 0) {
  const preferred = asset.frames[state]?.length ? state : 'idle';
  const frames = asset.frames[preferred];
  const len = frames.length;
  if (len === 1) return frames[0];
  const holdStates = new Set(['hurt','block']);
  if (holdStates.has(preferred) && duration && tick >= duration - 1) return frames[len - 1];
  const index = Math.floor(tick / (preferred === 'walk' ? 4 : preferred === 'idle' ? 7 : 5)) % len;
  return frames[index];
}

async function loadAtlasAsset(def) {
  const portrait = await loadRosterPortrait(def.rosterPortraitIndex ?? def.portraitIndex);
  const src = new URL('./assets/characters/v66/' + def.atlas, import.meta.url).href;
  const img = await loadImage(src);
  const frames = {};
  let cursor = 0;
  for (const state of sequences) {
    const count = def.atlasCounts?.[state] || 0;
    if (!count) continue;
    frames[state] = Array.from({ length: count }, () => makeAtlasCell(img, cursor++, def.atlasCell, def.atlasColumns));
  }
  normalizeAtlasFrames(frames);
  return { def, portrait, frames, renderMode: 'atlas', status: 'ready' };
}

async function loadPuppetAsset(def) {
  const portrait = await loadRosterPortrait(def.rosterPortraitIndex ?? def.portraitIndex);
  return { def, portrait, renderMode: 'puppet', status: 'ready' };
}

export function primeFighterSource(def) {
  if (assetCache.has(def.id)) return assetCache.get(def.id);
  const p = (def.render === 'atlas' ? loadAtlasAsset(def) : loadPuppetAsset(def)).catch(err => ({ def, renderMode: 'puppet', portrait: null, status: 'error', error: err }));
  assetCache.set(def.id, p);
  return p;
}

export async function loadFighter(def) {
  return primeFighterSource(def);
}

function drawPortraitHead(ctx, portrait, x, y, r) {
  if (!portrait) {
    ctx.fillStyle = '#ddd';
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
    return;
  }
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.clip();
  ctx.drawImage(portrait, x - r, y - r, r * 2, r * 2);
  ctx.restore();
  ctx.lineWidth = Math.max(2, r * 0.12);
  ctx.strokeStyle = '#10131d';
  ctx.stroke();
}

function drawPuppet(ctx, asset, state, tick, x, y, size = 1, face = 1, duration = 0, vy = 0) {
  const accent = asset.def.accent || '#5ec8ff';
  const t = tick / 60;
  const bodyH = 92 * size;
  const bob = state === 'walk' ? Math.sin(tick * 0.55) * 4 : state === 'idle' ? Math.sin(tick * 0.14) * 2 : 0;
  const crouch = state === 'crouch' ? 0.78 : 1;
  const jumpLift = state === 'jump' ? Math.max(-18, -vy * 2.6) : 0;
  const torsoW = 24 * size;
  const torsoH = 38 * size * crouch;
  const headR = 16 * size;
  const neckY = y - bodyH + 18 * size + bob + jumpLift;
  const torsoTop = neckY + headR + 2;
  const hipY = torsoTop + torsoH;
  const shoulderY = torsoTop + 6 * size;
  const shoulderX = 18 * size;
  const armLen = 24 * size;
  const foreLen = 19 * size;
  const legLen = 28 * size;

  let leadArm = 0.35, rearArm = -0.18, leadFore = 0.25, rearFore = 0.4;
  let leadLeg = 0.08, rearLeg = -0.08, leadKnee = 0.18, rearKnee = -0.15;
  let aura = 0;

  if (state === 'walk') {
    const s = Math.sin(tick * 0.55);
    leadArm = 0.18 - s * 0.5; rearArm = -0.12 + s * 0.5;
    leadLeg = 0.05 + s * 0.75; rearLeg = -0.05 - s * 0.75;
    leadKnee = 0.1 - s * 0.4; rearKnee = -0.1 + s * 0.4;
  } else if (state === 'jump') {
    leadArm = -0.7; rearArm = 0.7; leadFore = 0.6; rearFore = -0.6;
    leadLeg = 0.35; rearLeg = -0.35; leadKnee = 0.28; rearKnee = -0.28;
  } else if (state === 'punch') {
    const p = duration ? clamp(tick / duration, 0, 1) : clamp(tick / 20, 0, 1);
    leadArm = lerp(0.2, -1.05, p < 0.45 ? p / 0.45 : 1);
    leadFore = lerp(0.05, -0.15, p < 0.35 ? p / 0.35 : 1);
    rearArm = 0.45; rearFore = 0.55;
    leadLeg = 0.18; rearLeg = -0.2;
  } else if (state === 'kick') {
    const p = duration ? clamp(tick / duration, 0, 1) : clamp(tick / 24, 0, 1);
    leadLeg = lerp(0.1, -1.2, p < 0.5 ? p / 0.5 : 1);
    leadKnee = lerp(0.16, 0.05, p < 0.5 ? p / 0.5 : 1);
    rearLeg = 0.25; rearKnee = -0.25; leadArm = 0.55; rearArm = 0.25;
  } else if (state === 'special') {
    const p = duration ? clamp(tick / duration, 0, 1) : clamp(tick / 28, 0, 1);
    leadArm = lerp(-0.4, -1.25, p); rearArm = lerp(0.4, 1.15, p);
    leadFore = 0.1; rearFore = -0.1;
    aura = 0.45 + Math.sin(tick * 0.35) * 0.12;
  } else if (state === 'block') {
    leadArm = -0.9; rearArm = -0.45; leadFore = 0.35; rearFore = 0.15;
    leadLeg = 0.18; rearLeg = -0.25;
  } else if (state === 'hurt') {
    leadArm = 0.85; rearArm = -1; leadLeg = 0.2; rearLeg = -0.4;
  } else if (state === 'fall') {
    leadArm = -1.15; rearArm = 1.1; leadLeg = -1.05; rearLeg = 0.9;
  } else if (state === 'getup') {
    leadArm = -0.2; rearArm = 0.5; leadLeg = 0.6; rearLeg = -0.6;
  } else if (state === 'victory') {
    leadArm = -1.25; rearArm = 1.25; leadFore = 0.2; rearFore = -0.2;
    leadLeg = 0.1; rearLeg = -0.1;
    aura = 0.25;
  }

  const drawLimb = (x1, y1, ang1, len1, ang2, len2, width, color, hand = false) => {
    const ex = x1 + Math.cos(ang1) * len1 * face;
    const ey = y1 + Math.sin(ang1) * len1;
    const hx = ex + Math.cos(ang1 + ang2) * len2 * face;
    const hy = ey + Math.sin(ang1 + ang2) * len2;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(ex, ey);
    ctx.lineTo(hx, hy);
    ctx.stroke();
    if (hand) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(hx, hy, width * 0.4, 0, Math.PI * 2); ctx.fill();
    }
  };

  ctx.save();
  ctx.translate(Math.round(x), Math.round(y));
  ctx.scale(face, 1);
  const baseY = 0;

  ctx.fillStyle = 'rgba(0,0,0,.28)';
  ctx.beginPath(); ctx.ellipse(0, 2, 40 * size, 7 * size, 0, 0, Math.PI * 2); ctx.fill();

  if (aura > 0) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = accent;
    ctx.beginPath(); ctx.arc(0, -bodyH + 28 * size, 36 * size + aura * 18 * size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  drawLimb(-8 * size, hipY - baseY, Math.PI / 2 + rearLeg, legLen, rearKnee, 16 * size, 6 * size, '#1f2937');
  drawLimb(8 * size, hipY - baseY, Math.PI / 2 + leadLeg, legLen, leadKnee, 16 * size, 6 * size, '#111827');

  ctx.fillStyle = accent;
  ctx.strokeStyle = '#10131d';
  ctx.lineWidth = 3 * size;
  ctx.beginPath();
  ctx.roundRect(-torsoW / 2, torsoTop - baseY, torsoW, torsoH, 8 * size);
  ctx.fill();
  ctx.stroke();

  drawLimb(-shoulderX, shoulderY - baseY, Math.PI / 2 + rearArm, armLen, rearFore, foreLen, 6 * size, '#243042', true);
  drawLimb(shoulderX, shoulderY - baseY, Math.PI / 2 + leadArm, armLen, leadFore, foreLen, 6 * size, '#243042', true);

  ctx.strokeStyle = '#10131d';
  ctx.lineWidth = 4 * size;
  ctx.beginPath();
  ctx.moveTo(0, torsoTop - baseY - 2 * size);
  ctx.lineTo(0, torsoTop - baseY + 4 * size);
  ctx.stroke();

  drawPortraitHead(ctx, asset.portrait, 0, neckY - baseY, headR);

  if (state === 'block') {
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#b9e7ff';
    ctx.beginPath(); ctx.arc(12 * size, shoulderY - 2 * size, 16 * size, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

export function drawSprite(ctx, asset, state, tick, x, y, size = 1.7, face = 1, duration = 0, vy = 0) {
  if (!asset || asset.status !== 'ready') return;
  if (asset.renderMode === 'atlas') {
    const frame = poseFromFrames(asset, state, tick * (asset.def.motionRate || 1), duration);
    if (!frame) return;
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.translate(Math.round(x), Math.round(y));
    ctx.scale(face, 1);
    const s = size * frame.scale * 0.88;
    const dx = -frame.px * s;
    const dy = -frame.py * s;
    ctx.drawImage(frame.canvas, dx, dy, frame.canvas.width * s, frame.canvas.height * s);
    ctx.restore();
    return;
  }
  drawPuppet(ctx, asset, state, tick, x, y, size * 0.98, face, duration, vy);
}
