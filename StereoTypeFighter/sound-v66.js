import {getAudioAsset,loadAudioConfig,saveAudioConfig} from './audio-store-v66.js';
export const ACTION_SLOTS=['idle','walk','jump','crouch','punch','kick','special','block','hurt','fall','getup','victory'];
export const UI_SLOTS=['ui.select','ui.confirm','ui.start','ui.pause','ui.round','ui.fight','ui.ko','ui.result'];
export function buildDefaultAudioConfig(fighters,stages){const fighterSfx={};for(const f of fighters){fighterSfx[f.id]={};for(const a of ACTION_SLOTS)fighterSfx[f.id][a]={assetKey:`fighter:${f.id}:${a}`,offsetMs:0,volume:1,enabled:false}}const stageMusic={};for(const s of stages)stageMusic[s.id]={assetKey:`stage:${s.id}:music`,offsetMs:0,volume:1,enabled:false,loop:true};const uiSfx={};for(const s of UI_SLOTS)uiSfx[s]={assetKey:s,offsetMs:0,volume:1,enabled:false};return{version:'6.6',masterVolume:.85,musicVolume:.55,sfxVolume:.9,stageMusic,fighterSfx,uiSfx}}
function merge(target,defaults){if(!target)return structuredClone(defaults);const out=structuredClone(defaults);for(const[k,v]of Object.entries(target))out[k]=v&&typeof v==='object'&&!Array.isArray(v)&&out[k]&&typeof out[k]==='object'&&!Array.isArray(out[k])?merge(v,out[k]):v;return out}
export async function loadOrCreateAudioConfig(fighters,stages){const d=buildDefaultAudioConfig(fighters,stages),loaded=await loadAudioConfig(),m=merge(loaded,d);await saveAudioConfig(m);return m}
export class SoundSystem{
 constructor(fighters,stages){this.fighters=fighters;this.stages=stages;this.ctx=null;this.master=null;this.musicGain=null;this.sfxGain=null;this.buffers=new Map();this.config=null;this.muted=false;this.musicNode=null}
 async init(){this.config=await loadOrCreateAudioConfig(this.fighters,this.stages);if(!this.ctx){this.ctx=new(window.AudioContext||window.webkitAudioContext)();this.master=this.ctx.createGain();this.musicGain=this.ctx.createGain();this.sfxGain=this.ctx.createGain();this.musicGain.connect(this.master);this.sfxGain.connect(this.master);this.master.connect(this.ctx.destination)}this.applyVolumes();return this}async resume(){if(!this.ctx)await this.init();if(this.ctx.state!=='running')await this.ctx.resume()}applyVolumes(){if(!this.master)return;const c=this.config||{};this.master.gain.value=this.muted?0:(c.masterVolume??.85);this.musicGain.gain.value=c.musicVolume??.55;this.sfxGain.gain.value=c.sfxVolume??.9}setMuted(v){this.muted=!!v;this.applyVolumes()}async refreshConfig(){this.config=await loadOrCreateAudioConfig(this.fighters,this.stages);this.applyVolumes();return this.config}
 async getBuffer(key){if(this.buffers.has(key))return this.buffers.get(key);const asset=await getAudioAsset(key);if(!asset)return null;const b=await this.ctx.decodeAudioData(asset.data.slice(0));this.buffers.set(key,b);return b}
 async playUi(slot){if(!this.config)await this.init();const meta=this.config.uiSfx[slot];if(meta&&await this.playMeta(meta))return;this.fallbackTone(slot)}async playAction(id,action){if(!this.config)await this.init();const meta=this.config.fighterSfx[id]?.[action];if(meta&&await this.playMeta(meta))return;this.fallbackTone(action)}
 async playStageMusic(id){if(!this.config)await this.init();this.stopStageMusic();const m=this.config.stageMusic[id];if(!m?.enabled)return;const b=await this.getBuffer(m.assetKey);if(!b)return;const s=this.ctx.createBufferSource(),g=this.ctx.createGain();g.gain.value=m.volume??1;s.buffer=b;s.loop=m.loop!==false;s.connect(g).connect(this.musicGain);s.start(this.ctx.currentTime+Math.max(0,(m.offsetMs||0)/1000));this.musicNode={source:s,gain:g}}stopStageMusic(){try{this.musicNode?.source?.stop()}catch{}this.musicNode=null}
 async playMeta(m){if(!m?.enabled)return false;const b=await this.getBuffer(m.assetKey);if(!b)return false;const s=this.ctx.createBufferSource(),g=this.ctx.createGain();g.gain.value=m.volume??1;s.buffer=b;s.connect(g).connect(this.sfxGain);s.start(this.ctx.currentTime+Math.max(0,(m.offsetMs||0)/1000));return true}
 fallbackTone(kind){if(!this.ctx||this.muted)return;const map={idle:[160,.01],walk:[120,.015],jump:[420,.03],crouch:[100,.01],punch:[180,.035],kick:[140,.045],special:[280,.08],block:[235,.035],hurt:[90,.06],fall:[75,.08],getup:[160,.03],victory:[520,.18],'ui.select':[500,.025],'ui.confirm':[620,.04],'ui.start':[190,.12],'ui.pause':[310,.05],'ui.round':[340,.09],'ui.fight':[170,.13],'ui.ko':[85,.2],'ui.result':[520,.16]},[freq,dur]=map[kind]||[220,.03],o=this.ctx.createOscillator(),g=this.ctx.createGain(),now=this.ctx.currentTime;o.frequency.setValueAtTime(freq,now);if(['special','ui.fight','ui.start'].includes(kind))o.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.55),now+dur);o.type=kind==='special'?'sawtooth':kind==='victory'||kind==='ui.result'?'triangle':'square';g.gain.setValueAtTime(.0001,now);g.gain.linearRampToValueAtTime(.09,now+.005);g.gain.exponentialRampToValueAtTime(.0001,now+dur);o.connect(g).connect(this.sfxGain);o.start(now);o.stop(now+dur+.02)}
}


// V6.8: Original procedural arcade soundtrack. No third-party recordings or licences.
// The sequencer uses Web Audio scheduling, so playback timing is independent of rendering FPS.
const STAGE_THEMES=[
 [0,3,5,7,10,7,5,3,0,3,7,10,12,10,7,5],
 [0,5,7,12,10,7,5,3,0,3,5,7,8,7,3,-2],
 [0,2,3,7,5,3,2,0,-2,2,5,7,10,7,5,2],
 [0,3,7,10,12,10,7,3,5,8,12,15,12,8,7,5],
 [0,2,5,7,9,7,5,2,-3,2,5,9,7,5,2,0],
 [0,3,5,10,7,5,3,0,-2,3,7,10,12,10,7,3]
];
const noteHz=n=>110*Math.pow(2,n/12);
function synthVoice(system,frequency,start,length,type,volume,slide=0){
 const ctx=system.ctx,osc=ctx.createOscillator(),gain=ctx.createGain();
 osc.type=type;osc.frequency.setValueAtTime(Math.max(30,frequency),start);
 if(slide)osc.frequency.exponentialRampToValueAtTime(Math.max(30,frequency*slide),start+length);
 gain.gain.setValueAtTime(.0001,start);
 gain.gain.exponentialRampToValueAtTime(Math.max(.0002,volume),start+.008);
 gain.gain.exponentialRampToValueAtTime(.0001,start+length);
 osc.connect(gain).connect(system.musicGain);osc.start(start);osc.stop(start+length+.01);
}
const previousMusicStart=SoundSystem.prototype.playStageMusic;
const previousMusicStop=SoundSystem.prototype.stopStageMusic;
SoundSystem.prototype.stopStageMusic=function(){
 if(this.arcadeTimer){clearInterval(this.arcadeTimer);this.arcadeTimer=null}
 this.arcadeRun=(this.arcadeRun||0)+1;
 previousMusicStop.call(this);
};
SoundSystem.prototype.playStageMusic=async function(id){
 await previousMusicStart.call(this,id);
 if(this.musicNode||!this.ctx)return;
 const run=this.arcadeRun,stageIndex=Math.max(0,this.stages.findIndex(s=>s.id===id));
 const melody=STAGE_THEMES[stageIndex%STAGE_THEMES.length],beat=.24;
 let index=0,next=this.ctx.currentTime+.04;
 const schedule=()=>{
  if(run!==this.arcadeRun||!this.ctx)return;
  const horizon=this.ctx.currentTime+.35;
  // Limit catch-up after tab suspension; never flood AudioContext with stale notes.
  if(next<this.ctx.currentTime-.5)next=this.ctx.currentTime+.04;
  while(next<horizon){
   const step=index%16,bar=Math.floor(index/16),root=stageIndex%2?3:0;
   if(step%2===0)synthVoice(this,noteHz(melody[step]+root+24),next,beat*.72,'square',.037);
   if(step%4===0)synthVoice(this,noteHz((bar%2?5:0)+root),next,beat*1.8,'triangle',.075);
   if(step%4===0)synthVoice(this,90,next,.10,'sine',.095,.38);
   if(step%4===2)synthVoice(this,220,next,.045,'triangle',.025,.55);
   if(step%2)synthVoice(this,780,next,.018,'square',.007,.5);
   index++;next+=beat;
  }
 };
 schedule();this.arcadeTimer=setInterval(schedule,90);
};
