import {Arena} from './arena-v66.js';

const WORLD_W = 960;
const WORLD_H = 540;
const STEP_MS = 1000 / 60;
const MAX_BACKING_W = 1920;
const MAX_DPR = 2;

const originalUpdate = Arena.prototype.update;
const originalDraw = Arena.prototype.draw;

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

function captureMotion(arena, before) {
  if (!arena.people?.length) return;
  arena.__visualMotion = arena.people.map((fighter, index) => {
    const previous = before[index] || {x: fighter.x, y: fighter.y};
    return {
      dx: fighter.x - previous.x,
      dy: fighter.y - previous.y,
    };
  });
  arena.__visualUpdateAt = now();
}

Arena.prototype.update = function enhancedUpdate(...args) {
  const before = (this.people || []).map(fighter => ({x: fighter.x, y: fighter.y}));
  const beforePhase = this.phase;
  const result = originalUpdate.apply(this, args);
  captureMotion(this, before);

  if (this.soundSystem) {
    if (this.phase === 'intro' && this.phaseTick === 1) this.soundSystem.playUi?.('ui.round').catch?.(() => {});
    if (this.phase === 'intro' && this.phaseTick === 57) this.soundSystem.playUi?.('ui.fight').catch?.(() => {});
    if (beforePhase === 'fight' && this.phase === 'roundover' && /ko/.test(this.roundReason || '')) {
      this.soundSystem.playUi?.('ui.ko').catch?.(() => {});
    }
  }
  return result;
};

function resizeBackingStore(arena) {
  const canvas = arena.canvas;
  if (!canvas?.isConnected) return;
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;

  const dpr = Math.min(MAX_DPR, Math.max(1, window.devicePixelRatio || 1));
  let targetW = Math.max(WORLD_W, Math.round(rect.width * dpr));
  targetW = Math.min(MAX_BACKING_W, targetW);
  const targetH = Math.round(targetW * WORLD_H / WORLD_W);

  if (canvas.width !== targetW || canvas.height !== targetH) {
    canvas.width = targetW;
    canvas.height = targetH;
    canvas.dataset.renderScale = (targetW / WORLD_W).toFixed(2);
  }
}

Arena.prototype.draw = function enhancedDraw(...args) {
  resizeBackingStore(this);
  const ctx = this.ctx;
  const people = this.people || [];
  const motion = this.__visualMotion || [];
  const elapsed = Math.max(0, now() - (this.__visualUpdateAt || now()));
  const extrapolation = Math.min(0.78, elapsed / STEP_MS);
  const originals = people.map(fighter => ({x: fighter.x, y: fighter.y}));

  if (!this.reduced && extrapolation > 0) {
    people.forEach((fighter, index) => {
      const delta = motion[index];
      if (!delta) return;
      fighter.x += delta.dx * extrapolation;
      fighter.y += delta.dy * extrapolation;
    });
  }

  const sx = this.canvas.width / WORLD_W;
  const sy = this.canvas.height / WORLD_H;
  ctx.save();
  ctx.setTransform(sx, 0, 0, sy, 0, 0);
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);
  try {
    return originalDraw.apply(this, args);
  } finally {
    ctx.restore();
    people.forEach((fighter, index) => {
      fighter.x = originals[index].x;
      fighter.y = originals[index].y;
    });
  }
};

function syncViewportVars() {
  const viewport = window.visualViewport;
  const width = viewport?.width || window.innerWidth;
  const height = viewport?.height || window.innerHeight;
  document.documentElement.style.setProperty('--visual-viewport-width', `${Math.round(width)}px`);
  document.documentElement.style.setProperty('--visual-viewport-height', `${Math.round(height)}px`);
}

function syncPlayingClass() {
  const match = document.getElementById('matchScreen');
  document.body.classList.toggle('playing', !!match?.classList.contains('active'));
}

function keepRetryActionUsable() {
  const button = document.getElementById('startButton');
  if (!button) return;
  if (/retry/i.test(button.textContent || '') && button.disabled) {
    button.disabled = false;
    button.removeAttribute('aria-busy');
  } else if (/preparing|loading/i.test(button.textContent || '')) {
    button.setAttribute('aria-busy', 'true');
  } else {
    button.removeAttribute('aria-busy');
  }
}

syncViewportVars();
syncPlayingClass();
keepRetryActionUsable();

window.addEventListener('resize', syncViewportVars, {passive: true});
window.addEventListener('orientationchange', syncViewportVars, {passive: true});
window.visualViewport?.addEventListener('resize', syncViewportVars, {passive: true});
window.visualViewport?.addEventListener('scroll', syncViewportVars, {passive: true});

const matchScreen = document.getElementById('matchScreen');
if (matchScreen) new MutationObserver(syncPlayingClass).observe(matchScreen, {attributes: true, attributeFilter: ['class']});

const startButton = document.getElementById('startButton');
if (startButton) new MutationObserver(keepRetryActionUsable).observe(startButton, {
  attributes: true,
  attributeFilter: ['disabled', 'aria-busy'],
  childList: true,
  characterData: true,
  subtree: true,
});

const touchControls = document.getElementById('touchControls');
if (touchControls) {
  touchControls.addEventListener('contextmenu', event => event.preventDefault());
  touchControls.addEventListener('dragstart', event => event.preventDefault());
}

window.SFEnhancements = Object.freeze({
  visualVersion: '6.7-mobile-motion',
  simulationHz: 60,
  renderDprCap: MAX_DPR,
  renderWidthCap: MAX_BACKING_W,
});
