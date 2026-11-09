/* Ashen Realms V1.5: three CC0 fantasy compositions, Kenney layered combat FX.
 * Sources and licences: credits.html. The local synthesis fallback works offline.
 */
(() => {
  const musicSources=[
    {name:"Hope — MintoDog",url:"https://opengameart.org/sites/default/files/hope_orchestral_battle_music_bpm165_0.ogg"},
    {name:"Heartfelt Battle — request",url:"https://opengameart.org/sites/default/files/heartfelt-battle_loop.ogg"},
    {name:"The Final Battle — skrjablin",url:"https://opengameart.org/sites/default/files/the_final_battle.ogg"}
  ];
  const kenney="https://raw.githubusercontent.com/GeorgeQLe/assets-sfx-combat/main/assets/kenney/";
  const imp=n=>kenney+"impact-sounds/Audio/"+n+".ogg";
  const rpg=n=>kenney+"rpg-audio/Audio/"+n+".ogg";
  const libraries={
    slash:[rpg("drawKnife1"),rpg("drawKnife2"),rpg("drawKnife3")],
    chop:[rpg("chop"),imp("impactMetal_light_001"),imp("impactMetal_medium_002")],
    hit:[imp("impactPunch_medium_000"),imp("impactPunch_medium_002"),imp("impactPunch_heavy_001"),imp("impactGeneric_light_003")],
    heavy:[imp("impactMetal_heavy_000"),imp("impactMetal_heavy_002"),imp("impactBell_heavy_003")],
    step:[rpg("footstep01"),rpg("footstep05"),imp("footstep_concrete_003")],
    magic:[imp("impactGlass_medium_002"),imp("impactBell_heavy_002")],
    shield:[imp("impactMetal_medium_001"),imp("impactPlate_medium_003")],
    pickup:[rpg("metalClick"),imp("impactBell_heavy_004")],
    death:[imp("impactPunch_heavy_003"),imp("impactMetal_heavy_004")]
  };
  const channels={music:0.42,sfx:0.70};
  let muted=false,active=-1,playing=false,loadError=false,lastStep=0,synth=null;
  const media=musicSources.map(track=>{
    const element=new Audio();
    element.preload="none";element.src=track.url;element.loop=true;element.volume=0;
    element.addEventListener("error",()=>{loadError=true});
    return element;
  });
  const pools=new Map();
  const rand=()=>Math.random();
  const currentVol=()=>muted?0:channels.music;
  function fallback(freq=190,length=.16,kind="triangle",amplitude=.07){
    if(muted||!channels.sfx)return;
    try{
      const AC=window.AudioContext||window.webkitAudioContext;
      synth ||= new AC();if(synth.state==="suspended")synth.resume().catch(()=>{});
      const osc=synth.createOscillator(),gain=synth.createGain(),now=synth.currentTime;
      osc.type=kind;osc.frequency.setValueAtTime(Math.max(40,freq),now);
      osc.frequency.exponentialRampToValueAtTime(Math.max(35,freq*.56),now+length);
      gain.gain.setValueAtTime(Math.max(.0001,amplitude*channels.sfx),now);
      gain.gain.exponentialRampToValueAtTime(.0001,now+length);
      osc.connect(gain).connect(synth.destination);osc.start(now);osc.stop(now+length);
    }catch{}
  }
  function playFX(name,vol=.45){
    if(muted||!channels.sfx)return;
    const arr=libraries[name]||libraries.hit,choice=arr[Math.floor(rand()*arr.length)];
    let pool=pools.get(choice);
    if(!pool){
      pool=Array.from({length:4},()=>{
        const audio=new Audio(choice);audio.preload="auto";audio.addEventListener("error",()=>fallback(name==="magic"?420:165));
        return audio;
      });pools.set(choice,pool);
    }
    let a=pool.find(x=>x.paused||x.ended)||pool[0];
    try{a.pause();a.currentTime=0;a.playbackRate=.94+rand()*.13;
      a.volume=Math.min(1,vol*channels.sfx*1.3);a.play().catch(()=>fallback(190,.12));}
    catch{fallback(190,.12)}
    if(name==="heavy"||name==="magic")fallback(name==="magic"?460:110,.22,name==="magic"?"sine":"sawtooth",.045);
  }
  function unlock(){
    if(muted)return;
    try{if(!synth){const AC=window.AudioContext||window.webkitAudioContext;synth=new AC()}
      if(synth.state==="suspended")synth.resume().catch(()=>{})}catch{}
  }
  function enterStage(index){
    if(index===active)return;
    active=Math.max(0,Math.min(2,index|0));
    if(muted){media.forEach(a=>a.pause());return}
    const track=media[active];
    track.preload="auto";
    track.play().catch(()=>{loadError=true});
  }
  function update(index,state){
    const shouldPlay=state==="playing"&&!muted;
    if(shouldPlay&&index!==active)enterStage(index);
    for(let i=0;i<media.length;i++){
      const a=media[i],target=shouldPlay&&i===active?currentVol():0;
      if(shouldPlay&&i===active&&a.paused&&!loadError)a.play().catch(()=>{loadError=true});
      if(Math.abs(a.volume-target)>.008) a.volume=Math.min(1,Math.max(0,a.volume+(a.volume<target?.009:-.012)));
      if(a.volume<.012&&(i!==active||!shouldPlay)&&!a.paused)a.pause();
    }
    playing=shouldPlay;
  }
  function switchMute(force){
    muted=typeof force==="boolean"?force:!muted;
    if(muted)media.forEach(a=>a.pause());
    else if(playing&&active>=0)media[active].play().catch(()=>{loadError=true});
    persist();refresh();
    return muted;
  }
  function persist(){
    try{localStorage.setItem("ashenAudio",JSON.stringify({muted,channels}))}catch{}
  }
  function restore(){
    try{const v=JSON.parse(localStorage.getItem("ashenAudio")||"{}");muted=!!v.muted;
    if(Number.isFinite(v.channels?.music))channels.music=Math.max(0,Math.min(1,v.channels.music));
    if(Number.isFinite(v.channels?.sfx))channels.sfx=Math.max(0,Math.min(1,v.channels.sfx))}catch{}
  }
  function refresh(){
    const btn=document.querySelector("#soundToggle");
    if(btn){btn.textContent=muted?"♪ SOUND OFF":"♫ SOUND ON";btn.setAttribute("aria-pressed",muted?"true":"false")}
    const music=document.querySelector("#musicVolume"),sfx=document.querySelector("#sfxVolume");
    if(music)music.value=Math.round(channels.music*100);
    if(sfx)sfx.value=Math.round(channels.sfx*100);
  }
  restore();
  document.addEventListener("DOMContentLoaded",()=>{
    const btn=document.querySelector("#soundToggle");
    if(btn)btn.addEventListener("click",()=>{unlock();switchMute()});
    for(const [id,key] of [["musicVolume","music"],["sfxVolume","sfx"]]){
      const el=document.querySelector("#"+id);
      if(el)el.addEventListener("input",()=>{channels[key]=Number(el.value)/100;persist();refresh()});
    }
    refresh();
  });
  window.ASHEN_AUDIO={unlock,playFX,update,enterStage,switchMute,refresh,channels,get muted(){return muted},get loadError(){return loadError},sources:musicSources};
})();