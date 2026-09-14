import { getAudioAsset, loadAudioConfig, saveAudioConfig } from './audio-store-v66.js';

export const ACTION_SLOTS = ['idle','walk','jump','crouch','punch','kick','special','block','hurt','fall','getup','victory'];
export const UI_SLOTS = ['ui.select','ui.confirm','ui.start'];

export function buildDefaultAudioConfig(fighters, stages) {
  const fighterSfx = {};
  for (const fighter of fighters) {
    fighterSfx[fighter.id] = {};
    for (const action of ACTION_SLOTS) {
      fighterSfx[fighter.id][action] = {
        assetKey: `fighter:${fighter.id}:${action}`,
        offsetMs: 0,
        volume: 1,
        enabled: false
      };
    }
  }
  const stageMusic = {};
  for (const stage of stages) {
    stageMusic[stage.id] = { assetKey: `stage:${stage.id}:music`, offsetMs: 0, volume: 1, enabled: false, loop: true };
  }
  const uiSfx = {};
  for (const slot of UI_SLOTS) {
    uiSfx[slot] = { assetKey: slot, offsetMs: 0, volume: 1, enabled: false };
  }
  return {
    version: '6.6',
    masterVolume: 0.85,
    musicVolume: 0.55,
    sfxVolume: 0.9,
    stageMusic,
    fighterSfx,
    uiSfx
  };
}

function mergeDefaults(target, defaults) {
  if (!target) return structuredClone(defaults);
  const out = structuredClone(defaults);
  for (const [k, v] of Object.entries(target)) {
    if (v && typeof v === 'object' && !Array.isArray(v) && out[k] && typeof out[k] === 'object' && !Array.isArray(out[k])) {
      out[k] = mergeDefaults(v, out[k]);
    } else {
      out[k] = v;
    }
  }
  return out;
}

export async function loadOrCreateAudioConfig(fighters, stages) {
  const defaults = buildDefaultAudioConfig(fighters, stages);
  const loaded = await loadAudioConfig();
  const merged = mergeDefaults(loaded, defaults);
  await saveAudioConfig(merged);
  return merged;
}

export class SoundSystem {
  constructor(fighters, stages) {
    this.fighters = fighters;
    this.stages = stages;
    this.ctx = null;
    this.master = null;
    this.musicGain = null;
    this.sfxGain = null;
    this.buffers = new Map();
    this.config = null;
    this.muted = false;
    this.musicNode = null;
  }

  async init() {
    this.config = await loadOrCreateAudioConfig(this.fighters, this.stages);
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.master = this.ctx.createGain();
      this.musicGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();
      this.musicGain.connect(this.master);
      this.sfxGain.connect(this.master);
      this.master.connect(this.ctx.destination);
    }
    this.applyVolumes();
    return this;
  }

  async resume() {
    if (!this.ctx) await this.init();
    if (this.ctx.state !== 'running') await this.ctx.resume();
  }

  applyVolumes() {
    if (!this.master) return;
    const c = this.config || {};
    const master = this.muted ? 0 : (c.masterVolume ?? 0.85);
    this.master.gain.value = master;
    this.musicGain.gain.value = c.musicVolume ?? 0.55;
    this.sfxGain.gain.value = c.sfxVolume ?? 0.9;
  }

  setMuted(value) {
    this.muted = !!value;
    this.applyVolumes();
  }

  async refreshConfig() {
    this.config = await loadOrCreateAudioConfig(this.fighters, this.stages);
    this.applyVolumes();
    return this.config;
  }

  async getBuffer(assetKey) {
    if (this.buffers.has(assetKey)) return this.buffers.get(assetKey);
    const asset = await getAudioAsset(assetKey);
    if (!asset) return null;
    const audioBuffer = await this.ctx.decodeAudioData(asset.data.slice(0));
    this.buffers.set(assetKey, audioBuffer);
    return audioBuffer;
  }

  async playUi(slot) {
    if (!this.config) await this.init();
    const meta = this.config.uiSfx[slot];
    if (!meta) return;
    await this.playMeta(meta, 'ui');
  }

  async playAction(fighterId, action) {
    if (!this.config) await this.init();
    const meta = this.config.fighterSfx[fighterId]?.[action];
    if (meta) {
      const ok = await this.playMeta(meta, action);
      if (ok) return;
    }
    this.fallbackActionTone(action);
  }

  async playStageMusic(stageId) {
    if (!this.config) await this.init();
    this.stopStageMusic();
    const meta = this.config.stageMusic[stageId];
    if (!meta?.enabled) return;
    const buffer = await this.getBuffer(meta.assetKey);
    if (!buffer) return;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = meta.volume ?? 1;
    source.buffer = buffer;
    source.loop = meta.loop !== false;
    source.connect(gain).connect(this.musicGain);
    const when = this.ctx.currentTime + Math.max(0, (meta.offsetMs || 0) / 1000);
    source.start(when);
    this.musicNode = { source, gain };
  }

  stopStageMusic() {
    try { this.musicNode?.source?.stop(); } catch {}
    this.musicNode = null;
  }

  async playMeta(meta, fallbackKind='tone') {
    if (!meta?.enabled) return false;
    const buffer = await this.getBuffer(meta.assetKey);
    if (!buffer) return false;
    const source = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    gain.gain.value = meta.volume ?? 1;
    source.buffer = buffer;
    source.connect(gain).connect(this.sfxGain);
    const when = this.ctx.currentTime + Math.max(0, (meta.offsetMs || 0) / 1000);
    source.start(when);
    return true;
  }

  fallbackActionTone(action) {
    if (!this.ctx || this.muted) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const now = this.ctx.currentTime;
    const map = {
      idle: [160, 0.01], walk: [120, 0.015], jump: [420, 0.03], crouch: [100, 0.01],
      punch: [180, 0.035], kick: [140, 0.045], special: [280, 0.08], block: [210, 0.025],
      hurt: [90, 0.06], fall: [75, 0.08], getup: [160, 0.03], victory: [520, 0.18]
    };
    const [freq, dur] = map[action] || [220, 0.03];
    osc.frequency.value = freq;
    osc.type = action === 'special' ? 'sawtooth' : action === 'victory' ? 'triangle' : 'square';
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(0.1, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + dur);
    osc.connect(gain).connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + dur + 0.02);
  }
}
