import { loadFighter, loadRosterPortrait, drawSprite } from './sprites-v66.js';
import { Arena, STAGE_DEFS } from './arena-v66.js';
import { SoundSystem } from './sound-v66.js';

const $ = id => document.getElementById(id);
const state = {
  roster: [],
  portraits: new Map(),
  selected: ['lefty', 'bogan-tradie'],
  slot: 0,
  stageId: STAGE_DEFS[0].id,
  mode: 'cpu',
  difficulty: 'normal',
  muted: false,
  previewTick: 0,
  fps: 0,
  frameCount: 0,
  fpsStamp: performance.now(),
  arena: null,
  sound: null,
  running: false,
  assetCache: new Map()
};

const previewContexts = new Map();

function prettyLabel(id) {
  return id.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function fighterById(id) { return state.roster.find(f => f.id === id); }
function stageById(id) { return STAGE_DEFS.find(s => s.id === id); }

function updateLoadStatus(text) { $('loadStatus').textContent = text; }

async function ensureSelectedAssets() {
  const defs = state.selected.map(fighterById).filter(Boolean);
  const loaded = await Promise.all(defs.map(async def => {
    const asset = await loadFighter(def);
    state.assetCache.set(def.id, asset);
    return asset;
  }));
  return loaded;
}

function makeMetaHtml(def) {
  return `
    <div class="playerName">${def.name}</div>
    <div class="playerStyle">${def.style} • ${def.country}</div>
    <p class="note" style="margin:.35rem 0 .1rem">${def.bio || ''}</p>
    <div class="statRow">
      <span class="stat">SPD ${(def.speed || 1).toFixed(2)}</span>
      <span class="stat">DEF ${(def.defense || 1).toFixed(2)}</span>
      <span class="stat">Special: ${def.special || 'Finisher'}</span>
    </div>`;
}

async function buildRosterGrid() {
  const grid = $('rosterGrid');
  grid.innerHTML = '';
  for (const def of state.roster) {
    const card = document.createElement('button');
    card.className = 'card';
    card.type = 'button';
    card.dataset.id = def.id;
    const canvas = document.createElement('canvas');
    canvas.width = 72; canvas.height = 72;
    const portrait = await loadRosterPortrait(def.portraitIndex);
    state.portraits.set(def.id, portrait);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(portrait, 4, 4, 64, 64);
    const label = document.createElement('div');
    label.className = 'label'; label.textContent = def.name;
    const tiny = document.createElement('div');
    tiny.className = 'tiny'; tiny.textContent = def.render === 'atlas' ? 'HD Atlas' : 'Normalized';
    const tag = document.createElement('div');
    tag.className = 'assignTag';
    card.append(canvas, label, tiny, tag);
    card.onclick = async () => {
      await state.sound?.resume();
      state.sound?.playUi('ui.select');
      state.selected[state.slot] = def.id;
      updateSelectionUi();
      renderPreviews();
    };
    grid.append(card);
  }
}

function buildStageGrid() {
  const grid = $('stageGrid');
  grid.innerHTML = '';
  for (const stage of STAGE_DEFS) {
    const card = document.createElement('button');
    card.type = 'button'; card.className = 'stageCard'; card.dataset.id = stage.id;
    const img = document.createElement('img');
    img.className = 'stageThumb'; img.src = new URL(stage.src, import.meta.url).href; img.alt = stage.name;
    const info = document.createElement('div');
    info.className = 'stageInfo';
    info.innerHTML = `<strong>${stage.name}</strong><span>${prettyLabel(stage.id)}</span>`;
    card.append(img, info);
    card.onclick = () => { state.stageId = stage.id; updateSelectionUi(); };
    grid.append(card);
  }
}

function updateSelectionUi() {
  $('slotToggle').textContent = `Selecting: ${state.slot === 0 ? 'Player 1' : 'Player 2'}`;
  for (const card of $('rosterGrid').querySelectorAll('.card')) {
    card.classList.toggle('selected1', card.dataset.id === state.selected[0]);
    card.classList.toggle('selected2', card.dataset.id === state.selected[1]);
    card.classList.toggle('active', card.dataset.id === state.selected[state.slot]);
    const tag = card.querySelector('.assignTag');
    tag.textContent = card.dataset.id === state.selected[0] ? 'P1' : card.dataset.id === state.selected[1] ? 'P2' : '';
    tag.style.visibility = tag.textContent ? 'visible' : 'hidden';
  }
  for (const card of $('stageGrid').querySelectorAll('.stageCard')) card.classList.toggle('active', card.dataset.id === state.stageId);
  const [a, b] = state.selected.map(fighterById);
  if (a) $('p1Meta').innerHTML = makeMetaHtml(a);
  if (b) $('p2Meta').innerHTML = makeMetaHtml(b);
}

function primePreviewAsset(fighterId) {
  if (state.assetCache.has(fighterId)) return;
  const def = fighterById(fighterId);
  if (!def) return;
  loadFighter(def).then(asset => state.assetCache.set(fighterId, asset)).catch(() => {});
}

function renderPreviewInto(canvasId, fighterId, facing) {
  const canvas = $(canvasId); const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f1628'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.04)';
  for (let i = 0; i < canvas.width; i += 28) ctx.fillRect(i, canvas.height - 44, 16, 2);
  const def = fighterById(fighterId); if (!def) return;
  primePreviewAsset(fighterId);
  const asset = state.assetCache.get(fighterId);
  const demoStates = ['idle', 'walk', 'punch', 'kick', 'special', 'victory'];
  const segment = Math.floor((state.previewTick / 90) % demoStates.length);
  const subTick = state.previewTick % 90;
  const displayState = demoStates[segment];
  ctx.fillStyle = def.accent;
  ctx.globalAlpha = 0.08;
  ctx.beginPath(); ctx.arc(canvas.width / 2, canvas.height / 2 - 14, 92, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
  if (!asset) {
    ctx.fillStyle = '#dfe8ff';
    ctx.font = '14px system-ui';
    ctx.fillText('Loading preview…', 18, 24);
    return;
  }
  drawSprite(ctx, asset, displayState, subTick, canvas.width / 2, canvas.height - 30, 1.85, facing, 36, displayState === 'jump' ? -4 : 0);
}

function renderPreviews() {
  renderPreviewInto('p1Preview', state.selected[0], 1);
  renderPreviewInto('p2Preview', state.selected[1], -1);
}

function switchScreen(showMatch) {
  $('selectScreen').classList.toggle('active', !showMatch);
  $('matchScreen').classList.toggle('active', !!showMatch);
}

function updateHud(snapshot) {
  if (!snapshot?.people?.length) return;
  const [a, b] = snapshot.people;
  $('matchModeLabel').textContent = state.mode === 'cpu' ? `CPU (${state.difficulty})` : state.mode === 'training' ? 'Training' : 'Local Versus';
  $('matchStageLabel').textContent = stageById(state.stageId)?.name || '--';
  $('roundLabel').textContent = String(snapshot.round || 1);
  $('timerLabel').textContent = String(Math.ceil((snapshot.remaining || 0) / 60));
  $('p1HudName').textContent = fighterById(a.id)?.name || 'Player 1';
  $('p2HudName').textContent = fighterById(b.id)?.name || 'Player 2';
  $('p1HudHp').textContent = `${a.hp} HP`;
  $('p2HudHp').textContent = `${b.hp} HP`;
  $('p1HpBar').style.width = `${a.hp}%`;
  $('p2HpBar').style.width = `${b.hp}%`;
  $('p1MeterBar').style.width = `${a.meter}%`;
  $('p2MeterBar').style.width = `${b.meter}%`;
}

async function startMatch() {
  updateLoadStatus('Preparing fighters…');
  await state.sound.resume();
  await state.sound.playUi('ui.start');
  const assets = await ensureSelectedAssets();
  state.mode = $('modeSelect').value;
  state.difficulty = $('difficultySelect').value;
  $('modeSelect').disabled = true; $('difficultySelect').disabled = true;
  switchScreen(true);
  await state.arena.start(state.mode, assets, state.difficulty, state.stageId);
  updateHud(state.arena.snapshot());
  state.running = true;
  updateLoadStatus('Match ready');
}

function stopMatch() {
  state.running = false;
  state.arena.stop();
  $('modeSelect').disabled = false; $('difficultySelect').disabled = false;
  switchScreen(false);
  updateSelectionUi();
}

function bindUi() {
  $('slotToggle').onclick = () => { state.slot = state.slot ? 0 : 1; updateSelectionUi(); };
  $('randomButton').onclick = async () => {
    const pool = [...state.roster];
    state.selected[state.slot] = pool[Math.floor(Math.random() * pool.length)].id;
    await state.sound.resume();
    state.sound.playUi('ui.select');
    updateSelectionUi();
    renderPreviews();
  };
  $('startButton').onclick = startMatch;
  $('pauseButton').onclick = () => { state.arena.pause(); $('pauseButton').textContent = state.arena.paused ? 'Resume' : 'Pause'; };
  $('backButton').onclick = stopMatch;
  $('muteButton').onclick = () => {
    state.muted = !state.muted;
    state.sound.setMuted(state.muted);
    $('muteButton').textContent = state.muted ? 'Unmute' : 'Mute';
  };
  $('modeSelect').onchange = e => { state.mode = e.target.value; };
  $('difficultySelect').onchange = e => { state.difficulty = e.target.value; };
  window.addEventListener('keydown', async e => {
    if (['Tab'].includes(e.code)) { e.preventDefault(); state.slot = state.slot ? 0 : 1; updateSelectionUi(); }
    if (e.code === 'Enter' && $('selectScreen').classList.contains('active')) await startMatch();
    if (state.running) state.arena.key(e.code, true);
  });
  window.addEventListener('keyup', e => { if (state.running) state.arena.key(e.code, false); });
}

function loop(now) {
  state.frameCount++;
  if (now - state.fpsStamp >= 1000) {
    state.fps = Math.round(state.frameCount * 1000 / (now - state.fpsStamp));
    state.frameCount = 0; state.fpsStamp = now;
    $('fpsLabel').textContent = `FPS ${state.fps}`;
  }
  state.previewTick += 1;
  if ($('selectScreen').classList.contains('active')) renderPreviews();
  if (state.running) {
    state.accumulator = (state.accumulator || 0) + Math.min(50, now - (state.lastTime || now));
    while (state.accumulator >= 1000 / 60) {
      state.arena.update();
      state.accumulator -= 1000 / 60;
    }
    state.arena.draw();
    updateHud(state.arena.snapshot());
  }
  state.lastTime = now;
  requestAnimationFrame(loop);
}

async function init() {
  state.roster = await (await fetch(new URL('./tools/roster-v66.json', import.meta.url))).json();
  state.sound = await new SoundSystem(state.roster, STAGE_DEFS).init();
  state.arena = new Arena($('gameCanvas'), arena => updateHud(arena.snapshot()), state.sound);
  previewContexts.set('p1', $('p1Preview').getContext('2d'));
  previewContexts.set('p2', $('p2Preview').getContext('2d'));
  await buildRosterGrid();
  buildStageGrid();
  updateSelectionUi();
  bindUi();
  renderPreviews();
  updateLoadStatus('20 fighters ready • audio admin enabled • lazy load active');
  requestAnimationFrame(loop);
}

init().catch(err => {
  console.error(err);
  updateLoadStatus('Load failed');
  alert('StereoType Fighter V6.6 failed to initialize. Check the console for details.');
});
