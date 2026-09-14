import { ACTION_SLOTS, SoundSystem } from './sound-v66.js';
import { saveAudioAsset, deleteAudioAsset, getAudioAsset, saveAudioConfig } from './audio-store-v66.js';
import { STAGE_DEFS } from './arena-v66.js';
import { loadFighter, drawSprite } from './sprites-v66.js';

const $ = id => document.getElementById(id);
const state = {
  roster: [],
  sound: null,
  previewAsset: null,
  previewDef: null,
  previewAction: 'idle',
  previewRunning: false,
  previewStartedAt: 0,
  previewDuration: 36,
  currentBuffer: null,
  previewTick: 0
};

function currentCategory() { return $('categorySelect').value; }
function currentFighterId() { return $('fighterSelect').value; }
function currentAction() { return $('actionSelect').value; }
function currentStageId() { return $('stageSelect').value; }
function currentUiSlot() { return $('uiSlotSelect').value; }

function currentMeta() {
  const cfg = state.sound.config;
  if (currentCategory() === 'fighter') return cfg.fighterSfx[currentFighterId()][currentAction()];
  if (currentCategory() === 'stage') return cfg.stageMusic[currentStageId()];
  return cfg.uiSfx[currentUiSlot()];
}

function currentAssetKey() { return currentMeta()?.assetKey; }

function setStatus(text) { $('adminStatus').textContent = text; }

function populateSelectors() {
  $('fighterSelect').innerHTML = state.roster.map(f => `<option value="${f.id}">${f.name}</option>`).join('');
  $('stageSelect').innerHTML = STAGE_DEFS.map(s => `<option value="${s.id}">${s.name}</option>`).join('');
  $('actionSelect').innerHTML = ACTION_SLOTS.map(a => `<option value="${a}">${a}</option>`).join('');
}

function updateCategoryVisibility() {
  const cat = currentCategory();
  $('fighterSelect').parentElement.style.display = cat === 'fighter' ? '' : '';
  $('fighterSelect').previousElementSibling.style.display = cat === 'fighter' ? '' : 'none';
  $('fighterSelect').style.display = cat === 'fighter' ? '' : 'none';
  $('stageSelect').previousElementSibling.style.display = cat === 'stage' ? '' : 'none';
  $('stageSelect').style.display = cat === 'stage' ? '' : 'none';
  $('uiSlotSelect').previousElementSibling.style.display = cat === 'ui' ? '' : 'none';
  $('uiSlotSelect').style.display = cat === 'ui' ? '' : 'none';
  $('actionSelect').previousElementSibling.style.display = cat === 'fighter' ? '' : 'none';
  $('actionSelect').style.display = cat === 'fighter' ? '' : 'none';
  $('loopCheck').parentElement.style.display = cat === 'stage' ? '' : 'none';
}

async function refreshSlotUi() {
  updateCategoryVisibility();
  const meta = currentMeta();
  $('slotKeyLabel').textContent = currentAssetKey();
  $('offsetRange').value = meta.offsetMs ?? 0;
  $('offsetValue').textContent = `${meta.offsetMs ?? 0} ms`;
  $('volumeRange').value = Math.round((meta.volume ?? 1) * 100);
  $('volumeValue').textContent = `${Math.round((meta.volume ?? 1) * 100)}%`;
  $('enabledCheck').checked = !!meta.enabled;
  $('loopCheck').checked = meta.loop !== false;
  $('animMeta').textContent = currentCategory() === 'stage'
    ? 'Stage music preview uses the selected fighter preview while audio plays.'
    : currentCategory() === 'ui'
      ? 'UI sound preview uses the selected fighter idle motion as a timing reference.'
      : `${currentFighterId()} • ${currentAction()} • Sync and preview here.`;
  await loadPreviewAsset();
  await loadWaveform();
}

async function loadPreviewAsset() {
  const fighterId = currentFighterId();
  const def = state.roster.find(f => f.id === fighterId) || state.roster[0];
  state.previewDef = def;
  state.previewAsset = await loadFighter(def);
  renderPreview();
}

async function loadWaveform() {
  const asset = await getAudioAsset(currentAssetKey());
  const canvas = $('waveCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f1628'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#293557'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, canvas.height / 2); ctx.lineTo(canvas.width, canvas.height / 2); ctx.stroke();
  ctx.fillStyle = '#a8b4d6'; ctx.font = '14px system-ui';
  if (!asset) { ctx.fillText('No audio uploaded for this slot yet.', 20, 30); state.currentBuffer = null; return; }
  const buffer = await state.sound.ctx.decodeAudioData(asset.data.slice(0));
  state.currentBuffer = buffer;
  const data = buffer.getChannelData(0);
  const step = Math.ceil(data.length / canvas.width);
  ctx.strokeStyle = '#71d7ff'; ctx.lineWidth = 1.5; ctx.beginPath();
  for (let x = 0; x < canvas.width; x++) {
    let min = 1, max = -1;
    for (let i = 0; i < step; i++) {
      const v = data[x * step + i] || 0;
      if (v < min) min = v;
      if (v > max) max = v;
    }
    ctx.moveTo(x, (1 + min) * canvas.height / 2);
    ctx.lineTo(x, (1 + max) * canvas.height / 2);
  }
  ctx.stroke();
  const center = canvas.width / 2;
  const marker = center + (Number($('offsetRange').value) / 1000) * (canvas.width / 2);
  ctx.strokeStyle = '#ffd166'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(marker, 0); ctx.lineTo(marker, canvas.height); ctx.stroke();
  ctx.fillStyle = '#ffd166'; ctx.fillText('sync marker', marker + 8, 18);
}

function renderPreview() {
  const canvas = $('animCanvas');
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#0f1628'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'rgba(255,255,255,.04)';
  for (let i = 0; i < canvas.width; i += 28) ctx.fillRect(i, canvas.height - 42, 16, 2);
  if (!state.previewAsset) return;
  const action = currentCategory() === 'fighter' ? currentAction() : 'idle';
  const tick = state.previewRunning
    ? Math.min(state.previewDuration, Math.floor((performance.now() - state.previewStartedAt) / (1000 / 60)))
    : Math.round(Number($('scrubRange').value) / 100 * state.previewDuration);
  drawSprite(ctx, state.previewAsset, action, tick, canvas.width / 2, canvas.height - 22, 1.95, 1, state.previewDuration, action === 'jump' ? -4 : 0);
  $('scrubValue').textContent = `${Math.round(tick / state.previewDuration * 100)}%`;
}

async function previewAudioOnly() {
  await state.sound.resume();
  await state.sound.playMeta(currentMeta(), 'manual');
}

async function previewSync() {
  await state.sound.resume();
  state.previewRunning = true;
  state.previewStartedAt = performance.now();
  state.previewDuration = currentCategory() === 'fighter'
    ? ({ idle: 60, walk: 42, jump: 32, crouch: 30, punch: 22, kick: 30, special: 44, block: 18, hurt: 20, fall: 42, getup: 24, victory: 56 }[currentAction()] || 36)
    : 60;
  await state.sound.playMeta(currentMeta(), 'manual');
  setTimeout(() => { state.previewRunning = false; renderPreview(); }, state.previewDuration * (1000 / 60) + 50);
}

function bindEvents() {
  for (const id of ['categorySelect','fighterSelect','stageSelect','uiSlotSelect','actionSelect']) {
    $(id).addEventListener('change', refreshSlotUi);
  }
  $('offsetRange').addEventListener('input', async e => {
    const value = Number(e.target.value);
    currentMeta().offsetMs = value;
    $('offsetValue').textContent = `${value} ms`;
    await loadWaveform();
  });
  $('volumeRange').addEventListener('input', e => {
    const value = Number(e.target.value);
    currentMeta().volume = value / 100;
    $('volumeValue').textContent = `${value}%`;
  });
  $('scrubRange').addEventListener('input', renderPreview);
  $('enabledCheck').addEventListener('change', e => currentMeta().enabled = e.target.checked);
  $('loopCheck').addEventListener('change', e => currentMeta().loop = e.target.checked);
  $('uploadButton').addEventListener('click', async () => {
    const file = $('audioFile').files?.[0];
    if (!file) return alert('Choose an audio file first.');
    await saveAudioAsset(currentAssetKey(), file);
    currentMeta().enabled = true;
    $('enabledCheck').checked = true;
    state.sound.buffers.delete(currentAssetKey());
    await loadWaveform();
    setStatus(`Uploaded ${file.name}`);
  });
  $('removeButton').addEventListener('click', async () => {
    await deleteAudioAsset(currentAssetKey());
    state.sound.buffers.delete(currentAssetKey());
    setStatus('Removed asset');
    await loadWaveform();
  });
  $('previewAudioButton').addEventListener('click', previewAudioOnly);
  $('previewSyncButton').addEventListener('click', previewSync);
  $('saveConfigButton').addEventListener('click', async () => {
    await saveAudioConfig(state.sound.config);
    setStatus('Config saved');
  });
  $('reloadConfigButton').addEventListener('click', async () => {
    await state.sound.refreshConfig();
    setStatus('Config reloaded');
    await refreshSlotUi();
  });
}

function tick() {
  renderPreview();
  requestAnimationFrame(tick);
}

async function init() {
  state.roster = await (await fetch(new URL('./tools/roster-v66.json', import.meta.url))).json();
  state.sound = await new SoundSystem(state.roster, STAGE_DEFS).init();
  await state.sound.resume();
  populateSelectors();
  bindEvents();
  await refreshSlotUi();
  setStatus('Ready');
  requestAnimationFrame(tick);
}

init().catch(err => {
  console.error(err);
  setStatus('Failed');
  alert('Audio admin failed to initialize. Check the console for details.');
});
