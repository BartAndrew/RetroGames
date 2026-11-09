/* Ashen Realms 2 — game logic (V2.2: story cutscenes, script in story.js)
 * V2.1
 * V2.0: telegraphed enemy attacks, attacker limit, hit-chain scoring, dodge cooldown,
 * boss enrage, stage bonuses, hit-stop and floating damage numbers.
 * V2.3: arena ambush waves, elite foes, breakable urns, Ember Rune power-up, difficulty/accessibility
 *       settings, saved best scores, pixel hit FX, pause menu, stage progress bar, boss summons.
 * V2.1: rig-animated heroes (rig.js), a new spear-wielding lead (Astrid) and a real
 * combo system: light chain L1-L2-L3, heavy, a finisher after two lights, and magic.
 */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const C=$('#game'),g=C.getContext('2d'),W=1152,H=648;
const O=$('#overlay'),title=$('#menuTitle'),message=$('#menuText'),start=$('#start');
const menuDefault={title:document.getElementById('menuTitle').textContent,text:document.getElementById('menuText').textContent,btn:document.getElementById('start').textContent};
const choicePanel=$('#characterSelect'),choiceCards=$('#heroCards'),chooseButton=$('#confirmHero'),backButton=$('#backToTitle');

let state='menu',level=0,clock=0,runTime=0,frame=0,shake=0,camera=0,kills=0,totalKills=0,maxChain=0,hitstop=0,last=0;
let particles=[],enemies=[],drops=[],floaters=[],rings=[],banner=null;
let fxs=[],urns=[],waves=[],ambient=[],lockCam=null,goT=0,rageT=0,flash=0,hintT=0;
const keys=new Set(),gpLast=[];

const stages=[
 {name:'THE BURNING MARCH',sub:'THE FRONTIER HAS FALLEN',sky:['#161c38','#904a42','#e49a61'],hill:'#282b42',ground:'#433e3b'},
 {name:'THE FORGOTTEN WOODS',sub:'THE OLD GODS ARE WATCHING',sky:['#101d2b','#395c56','#a08e63'],hill:'#233e37',ground:'#303e39'},
 {name:'THE CINDER THRONE',sub:'THE FINAL RECKONING',sky:['#120e21','#552a3e','#c15539'],hill:'#39263a',ground:'#3c3037'}
],world=2500;

const heroes=[
 {id:'astrid',name:'ASTRID',role:'Spear Maiden · Reach',power:.95,speed:4.2,defense:1.1,magic:1.1,stats:[7,8,6,7],trail:'#d6f4f2',fx:['#ffd9a0','#bff3ee'],bio:'Dawnspear heir of the fallen frontier. Her spear keeps foes at range, and her combos end in a whirlwind or a four-thrust flurry.'},
 {id:'warden',name:'IRON WARDEN',role:'Knight · Balanced',power:1,speed:3.55,defense:1,magic:1,stats:[7,6,7,5],trail:'#fff0c8',fx:['#ffe39a','#fff6d8'],bio:'A veteran knight with balanced swordplay, a shield bash and dependable armour.'},
 {id:'berserker',name:'ASH BERSERKER',role:'Champion · Heavy',power:1.42,speed:2.85,defense:.82,magic:.8,stats:[10,4,8,3],trail:'#ffb27a',fx:['#ff8a4a','#ffd2a0'],bio:'Devastating axe blows and heavy armour at the cost of speed. Slow swings, huge impact.'},
 {id:'moonblade',name:'MOONBLADE',role:'Spellblade · Swift',power:.82,speed:4.65,defense:1.25,magic:1.5,stats:[6,10,4,10],trail:'#c9b8ff',fx:['#98a6ff','#ecd8ff'],bio:'An agile spellblade with rapid cuts, a dash slash and strong magic to offset light armour.'}
];
const hit=(p,reach,dmg,o={})=>({p,reach,dmg,back:o.back??25,yt:o.yt??50,kb:o.kb??18,heavy:!!o.heavy,ring:!!o.ring});
const spin=o=>({back:140,...o});
// Per-hero move tables. dur = frames at tempo 1; hits fire when the move's progress p passes hit.p
// (timed to the rig's strike keyframes); lunge = [p0,p1,distance]; cancel = progress after which a buffered input may begin the next move.
const MOVES={
 astrid:{
  L1:{dur:24,hits:[hit(.40,158,22,{yt:46})],lunge:[.25,.45,16],cancel:.56},
  L2:{dur:24,hits:[hit(.42,158,24,{yt:46})],lunge:[.25,.45,16],cancel:.56},
  L3:{dur:46,name:'WHIRLWIND',hits:[hit(.30,150,13,spin()),hit(.50,150,13,spin()),hit(.80,160,24,spin({heavy:true,kb:28}))],cancel:.9},
  H:{dur:40,name:'VAULT STRIKE',hits:[hit(.42,180,44,{heavy:true,kb:30,yt:46})],lunge:[.25,.42,55],cancel:.8},
  F:{dur:58,name:'DAWN FLURRY',hits:[hit(.12,155,12,{yt:46}),hit(.30,155,12,{yt:46}),hit(.50,155,14,{yt:46}),hit(.78,185,24,{heavy:true,kb:30,yt:46})],lunge:[.55,.78,40],cancel:1},
  M:{dur:52,name:'SPEAR RAIN',hitAt:.45,range:[260,110]}
 },
 warden:{
  L1:{dur:26,hits:[hit(.42,128,24)],lunge:[.3,.45,12],cancel:.58},
  L2:{dur:26,hits:[hit(.42,128,24)],lunge:[.3,.45,12],cancel:.58},
  L3:{dur:36,hits:[hit(.45,138,35,{heavy:true,kb:24})],cancel:.75},
  H:{dur:44,name:'CROWN BREAKER',hits:[hit(.42,142,46,{heavy:true,kb:30})],lunge:[.3,.42,10],cancel:.8},
  F:{dur:62,name:'SHIELD BREAKER',hits:[hit(.22,108,16,{kb:36}),hit(.68,138,44,{heavy:true,kb:26})],lunge:[.15,.3,16],cancel:1},
  M:{dur:52,name:'SUNFALL',hitAt:.5,range:[250,110]}
 },
 berserker:{
  L1:{dur:32,hits:[hit(.45,138,26,{kb:22})],lunge:[.3,.45,12],cancel:.64},
  L2:{dur:32,hits:[hit(.45,138,26,{kb:22})],lunge:[.3,.45,12],cancel:.64},
  L3:{dur:52,name:'WHIRLING AXE',hits:[hit(.30,140,18,spin()),hit(.50,140,18,spin()),hit(.85,150,34,spin({heavy:true,kb:30}))],cancel:.92},
  H:{dur:52,name:'CLEAVE',hits:[hit(.45,152,46,{heavy:true,kb:32})],lunge:[.3,.45,14],cancel:.85},
  F:{dur:66,name:'EARTHBREAKER',hits:[hit(.52,175,58,{back:115,yt:60,heavy:true,kb:36,ring:true})],cancel:1},
  M:{dur:56,name:'WAR CRY',hitAt:.48,range:[250,110]}
 },
 moonblade:{
  L1:{dur:20,hits:[hit(.40,128,22)],lunge:[.25,.42,14],cancel:.52},
  L2:{dur:20,hits:[hit(.42,128,22)],lunge:[.25,.42,14],cancel:.52},
  L3:{dur:28,name:'TWIN CUT',hits:[hit(.30,132,17),hit(.60,138,20,{kb:24})],lunge:[.25,.6,22],cancel:.74},
  H:{dur:34,name:'DASH SLASH',hits:[hit(.42,150,38,{heavy:true,kb:28})],lunge:[.2,.42,82],cancel:.78},
  F:{dur:56,name:'MOONFALL',hits:[hit(.28,135,14,spin({back:135})),hit(.50,135,14,spin({back:135})),hit(.80,150,26,spin({back:135,heavy:true,kb:30}))],cancel:1},
  M:{dur:48,name:'LUNAR WAVE',hitAt:.46,range:[340,110],fwd:true}
 }
};
for(const tbl of Object.values(MOVES))for(const m of Object.values(tbl)){
 if(m.hits)m.tr=[Math.max(0,m.hits[0].p-.24),Math.min(1,m.hits[m.hits.length-1].p+.1)];
 else m.tr=[m.hitAt-.2,m.hitAt+.15];
}
let selectedHero=0,chosenHero=heroes[0],heroSt=null,trail=[],ghosts=[],stepDt=0;

// Enemy tuning. wind = telegraph frames before the strike lands, reach = strike range (px),
// cd = frames between attacks, pts = score for the kill (before chain multiplier).
const foe=[
 {name:'goblin',  hp:43, reach:72, wind:20,dmg:8, speed:.62,cd:[70,110],pts:100},
 {name:'skeleton',hp:62, reach:76, wind:15,dmg:9, speed:.81,cd:[60,100],pts:150},
 {name:'mushroom',hp:100,reach:72, wind:28,dmg:12,speed:.62,cd:[85,125],pts:220},
 {name:'boss',    hp:360,reach:115,wind:30,dmg:18,speed:.62,cd:[80,92], pts:1500}
];
const MAX_ATTACKERS=2,CHAIN_WINDOW=150,DODGE_TOTAL=44,PAR_FRAMES=4800;

const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch{return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
const SETTINGS=Object.assign({diff:1,shake:true,flash:true},store.get('ashen2.settings',{}));
const DIFFS=[{n:'EASY',hp:.8,dmg:.7},{n:'NORMAL',hp:1,dmg:1},{n:'HARD',hp:1.3,dmg:1.35}];
const saveSettings=()=>store.set('ashen2.settings',SETTINGS);
const bestKey=()=>'ashen2.best.'+chosenHero.id+'.'+SETTINGS.diff;
const flashFx=a=>{if(SETTINGS.flash)flash=Math.max(flash,a)};
for(const h of heroes)h.tempo=clamp(3.55/h.speed,.75,1.25);
const player={x:120,y:485,hp:100,max:100,mana:100,face:1,atk:null,buf:null,step:0,strT:0,gait:0,dying:0,pa:'',mixT:1,prevPose:null,lastPose:null,ghostT:0,stun:0,inv:0,dodge:0,dodgeCool:0,anim:0,score:0,chain:0,chainTimer:0,moving:false};
const multiplier=()=>1+Math.min(4,Math.floor(player.chain/5));

function makeEnemy(type,x,y,o={}){
 const d=DIFFS[SETTINGS.diff],elite=!!o.elite&&type!==3,hp=Math.round(foe[type].hp*d.hp*(elite?1.7:1));
 return {x,y,type,hp,max:hp,elite,wave:o.wave||null,face:-1,stun:0,attack:0,windup:0,cd:rnd(20,100),dead:0,walk:rnd(0,6),moving:false,attackVariant:false,enraged:false};
}
function reset(l=0){
 level=l;clock=0;frame=0;camera=0;kills=0;hitstop=0;
 enemies=[];drops=[];particles=[];floaters=[];rings=[];fxs=[];urns=[];waves=[];ambient=[];lockCam=null;goT=0;rageT=0;flash=0;hintT=l===0?660:0;
 if(l===0){player.score=0;maxChain=0;totalKills=0;runTime=0}
 Object.assign(player,{x:120,y:480,hp:l===0?100:Math.min(100,player.hp+28),mana:100,face:1,atk:null,buf:null,step:0,strT:0,gait:0,dying:0,bossSeen:false,pa:'',mixT:1,prevPose:null,lastPose:null,ghostT:0,stun:0,inv:0,dodge:0,dodgeCool:0,anim:0,chain:0,chainTimer:0,moving:false});
 trail=[];ghosts=[];heroSt=window.AshenRig?window.AshenRig.makeState(chosenHero.id):null;
 // Roaming foes in three stretches of the stage, plus two ambush arenas that lock the screen.
 const pool=[[0,0,1],[0,1,1,2],[0,1,2,2]][Math.min(l,2)],pick=()=>pool[Math.floor(Math.random()*pool.length)];
 [[430,790],[930,1380],[1540,2100]].forEach(([a,b],sgm)=>{
  const n=2+l+(sgm===1?1:0);
  for(let i=0;i<n;i++)enemies.push(makeEnemy(pick(),rnd(a,b),rnd(410,535),{elite:l>0&&Math.random()<.15}));
 });
 for(let k=0;k<2;k++){
  const queue=[];for(let i=0;i<3+l+k;i++)queue.push({type:pick(),elite:i===0&&((l>=1&&k===1)||l===2)});
  waves.push({x:k?1480:880,queue,started:false,done:false,active:false,t:0});
 }
 for(let i=0;i<3;i++)urns.push({x:rnd(520,2100),y:rnd(430,530),hp:2,hit:0});
 for(let i=0;i<38;i++)ambient.push({x:rnd(0,W),y:rnd(0,H),z:rnd(.4,1),ph:rnd(0,6.28)});
 enemies.push(makeEnemy(3,world-210,473));
}

// ---------- Audio (V1.5 audio module does the real work; this is the offline fallback) ----------
const src='https://raw.githubusercontent.com/GeorgeQLe/assets-sfx-combat/main/assets/kenney/';
const sounds={hit:src+'impact-sounds/Audio/impactGeneric_light_001.ogg',heavy:src+'impact-sounds/Audio/impactBell_heavy_002.ogg',slash:src+'rpg-audio/Audio/drawKnife1.ogg',chop:src+'rpg-audio/Audio/chop.ogg',step:src+'rpg-audio/Audio/footstep00.ogg'};
let audioCtx=null,nextBeat=0,beatIndex=0;
const notes=[110,146.83,164.81,146.83,98,130.81,146.83,130.81];
function soundtrack(){
 if(state!=='playing')return;
 if(window.ASHEN_AUDIO&&!window.ASHEN_AUDIO.loadError)return;
 try{
  audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
  if(audioCtx.state==='suspended')return;
  const now=audioCtx.currentTime;if(nextBeat<now)nextBeat=now;
  let n=0;
  while(nextBeat<now+.18&&n++<4){
   const note=notes[(beatIndex+level*2)%notes.length],osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();
   osc.type=beatIndex%4===0?'sawtooth':'triangle';osc.frequency.value=note;filter.type='lowpass';filter.frequency.value=430;
   gain.gain.setValueAtTime(.0001,nextBeat);gain.gain.exponentialRampToValueAtTime(.026,nextBeat+.02);gain.gain.exponentialRampToValueAtTime(.0001,nextBeat+.27);
   osc.connect(filter).connect(gain).connect(audioCtx.destination);osc.start(nextBeat);osc.stop(nextBeat+.28);
   if(beatIndex%4===0){
    const low=audioCtx.createOscillator(),lg=audioCtx.createGain();
    low.type='sine';low.frequency.setValueAtTime(78,nextBeat);low.frequency.exponentialRampToValueAtTime(42,nextBeat+.18);
    lg.gain.setValueAtTime(.09,nextBeat);lg.gain.exponentialRampToValueAtTime(.0001,nextBeat+.21);
    low.connect(lg).connect(audioCtx.destination);low.start(nextBeat);low.stop(nextBeat+.22);
   }
   nextBeat+=.32;beatIndex++;
  }
 }catch{}
}
function sfx(id,vol=.45){
 if(window.ASHEN_AUDIO){window.ASHEN_AUDIO.playFX(id,vol);return}
 const u=sounds[id];if(!u)return;
 try{const a=new Audio(u);a.volume=vol;a.play().catch(()=>{})}catch{}
}
function blip(freq=190,dur=.15,kind='sawtooth',vol=.09){
 if(window.ASHEN_AUDIO?.muted)return;
 try{
  audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();
  const o=audioCtx.createOscillator(),gain=audioCtx.createGain();
  o.type=kind;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.46),audioCtx.currentTime+dur);
  gain.gain.setValueAtTime(vol,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);
  o.connect(gain).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur);
 }catch{}
}

// ---------- Drawing helpers + procedural backdrop (used only if the stage art fails to load) ----------
function path(points,col,stroke=null,lw=1){g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=col;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function line(x1,y1,x2,y2,col,w=2){g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
function ellipse(x,y,rx,ry,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()}
function polygonMountain(base,color,offset,amplitude,scale){g.fillStyle=color;g.beginPath();g.moveTo(0,H);for(let x=0;x<=W+20;x+=8){const xx=(x+offset)*scale;g.lineTo(x,base+Math.sin(xx*.006)*amplitude+Math.sin(xx*.013+1.7)*amplitude*.45+Math.sin(xx*.027)*amplitude*.22)}g.lineTo(W,H);g.fill()}
function backdrop(){
 if(window.drawAshenBackdrop?.(g,level,camera,frame,W,H))return;
 const s=stages[level],sky=g.createLinearGradient(0,0,0,H);
 sky.addColorStop(0,s.sky[0]);sky.addColorStop(.63,s.sky[1]);sky.addColorStop(1,s.sky[2]);g.fillStyle=sky;g.fillRect(0,0,W,H);
 ellipse(945-camera*.017%130,120,56,56,level===1?'#d6d7ac88':'#ffddad65');
 for(let i=0;i<50;i++){const x=((i*187+69-camera*.08)%(W+200)+(W+200))%(W+200)-80,y=40+(i*83)%340;ellipse(x,y,1+i%3,1+i%3,'#f9d5ac25')}
 polygonMountain(331,'#211e35a8',camera*.12,80,.9);polygonMountain(398,s.hill,camera*.25,72,.9);
 for(let i=0;i<17;i++){
  const x=i*168-camera*.46%168-200,y=390+Math.sin(i*6)*20;
  if(level===1){line(x,y,x-12,y+150,'#172e29',13);for(let q=0;q<3;q++)ellipse(x+(q-1)*25,y-20-q*25,50,70,'#183a33')}
  else{path([[x-20,y+70],[x-14,y-80],[x+12,y-110],[x+22,y+70]],'#211e2da9');path([[x-36,y-70],[x,y-135],[x+33,y-70]],'#2c2334')}
 }
 const floor=g.createLinearGradient(0,410,0,H);floor.addColorStop(0,s.ground);floor.addColorStop(1,'#111723');g.fillStyle=floor;g.fillRect(0,423,W,H);
 for(let i=0;i<100;i++){const x=((i*149-camera*.85)%(W+180)+(W+180))%(W+180)-90,y=436+(i*91)%220;line(x,y,x+12+(i%4)*8,y+(i%3)*2,'#a79a7550',1.5)}
 g.fillStyle='#060a0e66';g.fillRect(0,0,W,25);g.fillRect(0,H-21,W,21);
}

// ---------- Sprite sheets (CC0 strips bundled as data URIs) ----------
const sheetPacks={boss:window.ASHEN_BOSS,...window.ASHEN_MONSTERS};
const sheetCache={};let sheetsLoaded=0,sheetsExpected=0;
for(const [character,animations] of Object.entries(sheetPacks)){
 sheetCache[character]={};
 for(const [st,info] of Object.entries(animations||{})){
  sheetsExpected++;
  const img=new Image(),entry={...info,img,ready:false};
  sheetCache[character][st]=entry;
  img.onload=()=>{
   // Sheets have big transparent margins; measure each frame's lowest opaque pixel so feet sit on the shadow.
   try{
    const off=document.createElement('canvas');off.width=img.naturalWidth;off.height=img.naturalHeight;
    const ctx=off.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
    const {data}=ctx.getImageData(0,0,off.width,off.height),fw=Math.round(off.width/info.frames);
    entry.bounds=[];
    for(let i=0;i<info.frames;i++){
     let minX=fw,maxX=0,minY=off.height,maxY=0;
     for(let y=0;y<off.height;y++)for(let x=0;x<fw;x++){
      if(data[((y*off.width)+(i*fw+x))*4+3]>70){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
     }
     entry.bounds.push({left:minX,right:maxX,top:minY,bottom:maxY});
    }
   }catch(e){console.warn('Sprite bounds unavailable',e)}
   entry.ready=true;sheetsLoaded++;
  };
  img.onerror=()=>{entry.failed=true;sheetsLoaded++};
  img.src=info.src;
 }
}
function sprite(e){
 const boss=e.type===3;
 const character=boss?'boss':e.type===0?'goblin':e.type===1?'skeleton':'mushroom';
 const pack=sheetCache[character];if(!pack)return;
 const dead=e.hp<=0,hurt=e.stun>0,attacking=e.attack>0,moving=!!e.moving,winding=e.windup>0;
 const requested=dead?'death':hurt?'hurt':attacking?(boss&&e.attackVariant?'heavy':'attack'):moving?'walk':'idle';
 const st=pack[requested]?.ready?requested:'idle';
 const a=pack[st];if(!a?.ready)return;
 const total=a.frames,rate=a.fps||10;
 let index;
 if(st==='death')index=Math.min(total-1,Math.floor(e.dead*rate/60));
 else if(st==='hurt')index=Math.min(total-1,Math.floor((17-e.stun)*rate/60));
 else if(st==='attack'||st==='heavy')index=Math.min(total-1,Math.max(0,Math.floor((23-e.attack)/23*total)));
 else index=Math.floor(e.walk*rate/60)%total;
 const poseTime=e.walk*rate/60,blend=(st==='walk'||st==='idle')?(poseTime-Math.floor(poseTime)):0;
 const cellW=a.img.naturalWidth/total,cellH=a.img.naturalHeight;
 const scale=(boss?3.1:2.7)*(e.elite?1.16:1),x=e.x-camera,y=e.y;
 g.save();g.translate(Math.round(x),Math.round(y));
 g.fillStyle='#04080ab0';g.beginPath();g.ellipse(0,4,boss?46:28,boss?11:7,0,0,Math.PI*2);g.fill();
 if(dead)g.globalAlpha=Math.max(0,1-e.dead/80);
 g.scale(e.face||1,1);g.imageSmoothingEnabled=false;
 const bounds=a.bounds?.[index]||{bottom:cellH-1,left:0,right:cellW-1,top:0};
 const footY=-(bounds.bottom+1)*scale+(boss?2:0);
 if(e.enraged&&!dead)g.filter='saturate(1.7) hue-rotate(-18deg) brightness(1.08)';else if(e.elite&&!dead)g.filter='hue-rotate(38deg) saturate(1.7) brightness(1.12)';
 if(winding){g.translate(-5,0);if(Math.floor(frame/3)%2)g.filter='brightness(1.35) saturate(1.4)'}
 if(moving&&!dead)g.translate(0,Math.sin(e.walk*.24)*1.3);
 if(attacking&&!hurt)g.rotate(.015*Math.sin(e.attack*.18));
 const left=Math.round(-cellW*scale/2),sizeW=Math.round(cellW*scale),sizeH=Math.round(cellH*scale);
 g.drawImage(a.img,index*cellW,0,cellW,cellH,left,Math.round(footY),sizeW,sizeH);
 if(blend>.13&&blend<.87&&!dead&&!hurt&&st!=='attack'){
  const next=(index+1)%total,nb=a.bounds?.[next],ny=-(nb?.bottom+1||cellH)*scale+(boss?2:0);
  g.save();g.globalAlpha*=Math.min(.11,blend*(1-blend)*.45);
  g.drawImage(a.img,next*cellW,0,cellW,cellH,left,Math.round(ny),sizeW,sizeH);g.restore();
 }
 g.filter='none';
 if(boss&&e.attack>0&&e.attack<11){g.strokeStyle='#ff795b99';g.lineWidth=5;g.beginPath();g.arc(25,-95,70,-1.15,.45);g.stroke()}
 g.restore();
 if(e.stun>0){for(let i=0;i<3;i++)ellipse(x+Math.sin(i*2+frame*.1)*19,y-132+Math.cos(i*2+frame*.1)*9,3,3,'#ffb761')}
}
// ---------- Hero (procedural rig, see rig.js) ----------
function drawHero(){
 const R=window.AshenRig;if(!R)return;
 const h=chosenHero,p=player,a=p.atk;
 let anim,pp;
 if(p.dying>0){anim='death';pp=Math.min(1,p.dying/62)}
 else if(p.stun>0){anim='hurt';pp=clamp(1-p.stun/12,0,.999)}
 else if(p.dodge>0){anim='roll';pp=clamp(1-p.dodge/15,0,1)}
 else if(a){anim=a.id;pp=clamp(a.t/a.dur,0,1)}
 else if(p.moving&&p.walking){anim='walk';pp=((p.gait%1)+1)%1}
 else{anim='idle';pp=(p.anim/100)%1}
 let P=R.pose(h.id,anim,pp);
 if(anim!==p.pa){p.prevPose=p.lastPose||P;p.pa=anim;p.mixT=0}
 if(p.mixT<1&&p.prevPose){const u=p.mixT;P=R.mix(p.prevPose,P,u*u*(3-2*u))}
 p.lastPose=P;
 const out=R.render(h.id,P,heroSt,{ex:p.x,ey:p.y,face:p.face,dt:stepDt}),S=R.S;
 const x=Math.round(p.x-camera),y=Math.round(p.y);
 // dodge afterimages (snapshot straight after render, while the shared canvas still holds this frame)
 if(p.dodge>0&&stepDt>0){p.ghostT+=stepDt;if(p.ghostT>=3){p.ghostT=0;ghosts.push({c:R.snapshot(),x:p.x,y:p.y,face:p.face,life:12})}}
 g.save();g.translate(x,y);
 g.fillStyle='#04080ab0';g.beginPath();g.ellipse(0,4,34,8,0,0,Math.PI*2);g.fill();g.restore();
 for(const gh of ghosts){g.save();g.globalAlpha=gh.life/12*.38;g.translate(Math.round(gh.x-camera),Math.round(gh.y));g.scale(gh.face,1);g.imageSmoothingEnabled=false;g.filter='saturate(.4) brightness(1.5)';g.drawImage(gh.c,-OXS(R),-OYS(R),R.S*176,R.S*136);g.restore()}
 g.save();g.translate(x,y);g.scale(p.face,1);g.imageSmoothingEnabled=false;
 if(p.inv>0&&p.dying<=0&&Math.floor(frame/4)%2)g.globalAlpha=.55;
 g.drawImage(out.canvas,-out.ox*S,-out.oy*S,out.w*S,out.h*S);
 g.restore();
 // weapon trail + magic glow
 const tw=(r)=>({x:p.x+p.face*r.x*S,y:p.y+r.y*S});
 if(a&&a.m.tr&&stepDt>0){
  const q=a.t/a.dur;
  if(q>=a.m.tr[0]&&q<=a.m.tr[1]){const t1=tw(out.tip),m1=tw(out.mid);trail.push({tx:t1.x,ty:t1.y,mx:m1.x,my:m1.y,age:0,brk:trail.length===0||trail[trail.length-1].age>2})}
 }
 if(trail.length){
  g.save();g.fillStyle=h.trail;
  for(let i=1;i<trail.length;i++){
   const a0=trail[i-1],b0=trail[i];if(b0.brk)continue;
   g.globalAlpha=clamp(1-b0.age/9,0,1)*.62;
   g.beginPath();g.moveTo(a0.tx-camera,a0.ty);g.lineTo(b0.tx-camera,b0.ty);g.lineTo(b0.mx-camera,b0.my);g.lineTo(a0.mx-camera,a0.my);g.closePath();g.fill();
  }
  g.restore();
 }
 if(P.glow>.05){
  const c=tw(out.glow),r=34+P.glow*20,gr=g.createRadialGradient(c.x-camera,c.y,2,c.x-camera,c.y,r);
  gr.addColorStop(0,h.fx[1]+'cc');gr.addColorStop(1,h.fx[0]+'00');
  g.save();g.globalAlpha=P.glow*.85;g.fillStyle=gr;g.fillRect(c.x-camera-r,c.y-r,r*2,r*2);g.restore();
 }
}
const OXS=R=>88*R.S,OYS=R=>112*R.S;
// Warning ring on the ground + "!" over the head while an enemy winds up.
function telegraph(e){
 const f=foe[e.type],total=f.wind*(e.enraged?.7:1),p=clamp(1-e.windup/total,0,1),x=e.x-camera,y=e.y,top=e.type===3?232:180;
 g.save();
 g.globalAlpha=.25+.5*p;g.strokeStyle=e.type===3?'#ff3b2a':'#ff7a45';g.lineWidth=3;
 g.beginPath();g.ellipse(x+e.face*f.reach*.45,y,f.reach*.78,14,0,0,Math.PI*2);g.stroke();
 g.globalAlpha=1;g.textAlign='center';g.font='bold 36px Cinzel,Georgia,serif';g.lineWidth=5;g.strokeStyle='#4a0d06';g.fillStyle=p>.6?'#ff6a4d':'#ffe08a';
 const bob=Math.sin(frame*.5)*2;g.strokeText('!',x,y-top+bob);g.fillText('!',x,y-top+bob);
 g.restore();
}

// ---------- Combat ----------
function sq(x,y,vx,vy,life,color,size,extra){particles.push(Object.assign({x,y,vx,vy,life,color,size,sq:true},extra))}
function spawnBurst(x,y,color,count=15){for(let i=0;i<count;i++)sq(x,y,rnd(-5,5),rnd(-6,1),rnd(12,29),color,Math.round(rnd(2,5)))}
// Pixel-art style hit FX: a flash star, a slash mark and glowing sparks thrown along the blow.
function impactFx(x,y,heavy,face,color){
 fxs.push({x,y,t:0,life:heavy?11:8,kind:'star',heavy,color});
 fxs.push({x,y,t:0,life:9,kind:'slash',heavy,ang:(face>0?-.5:Math.PI+.5)+rnd(-.35,.35)});
 for(let i=0;i<(heavy?18:10);i++){const a=(face>0?0:Math.PI)+rnd(-1,1);sq(x,y,Math.cos(a)*rnd(3,12),Math.sin(a)*rnd(3,12)-2,rnd(10,22),i%3?'#fff1c6':color,Math.round(rnd(2,4)),{glow:true})}
}
function dust(x,y,n=6,face=0){for(let i=0;i<n;i++)sq(x+rnd(-10,10),y-2,rnd(-1.6,1.6)-face*.9,rnd(-1.3,-.2),rnd(16,30),'#b4a68f',Math.round(rnd(3,7)),{dust:true,g:-.03})}
function deathEmbers(e){for(let i=0;i<30;i++)sq(e.x+rnd(-22,22),e.y-rnd(15,135),rnd(-1,1),-rnd(1,3.4),rnd(30,66),i%2?'#ff9b4a':'#ffd08a',Math.round(rnd(2,4)),{glow:true,g:-.02})}
function dropFrom(x,y,chance){
 if(Math.random()>=chance)return;
 const r=Math.random(),low=player.hp<45;
 drops.push({x,y,tick:0,type:r<.1?'rage':(low?r<.65:r<.45)?'heal':'mana'});
}
function breakUrn(u,n){
 u.hp-=n;u.hit=9;spawnBurst(u.x,u.y-30,'#7a5a44',8);
 if(u.hp<=0){spawnBurst(u.x,u.y-30,'#4b362e',18);spawnBurst(u.x,u.y-30,'#ff8a3c',10);dust(u.x,u.y,8);sfx('hit',.3);dropFrom(u.x,u.y,.9);floater(u.x,u.y-70,'URN SHATTERED','#e8c48a',40,15)}
}
function floater(x,y,text,color='#ffe3a6',life=48,size=20){floaters.push({x,y,text,color,life,max:life,size})}
const attackers=()=>enemies.reduce((n,e)=>n+(e.type!==3&&e.hp>0&&(e.windup>0||e.attack>0)?1:0),0);

const axisX=()=>{let mx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0);const gp=navigator.getGamepads?.()[0];if(gp&&Math.abs(gp.axes[0])>.2)mx+=gp.axes[0];return clamp(mx,-1,1)};
// Input is buffered for ~16 frames so a press just before a move ends still chains.
function pressAttack(kind){
 if(state!=='playing'||player.dying>0)return;
 player.buf={kind,t:16};
}
const attack=(heavy=false,magic=false)=>pressAttack(magic?'M':heavy?'H':'L');
function pickMove(kind){
 if(kind==='M'){
  const cost=Math.round(35/chosenHero.magic);
  if(player.mana<cost){floater(player.x,player.y-170,'NO MANA','#9fb0ff',34,16);return null}
  player.mana-=cost;return 'M';
 }
 if(kind==='H')return player.step===2&&player.strT>0?'F':'H';
 return 'L'+((player.strT>0?player.step:0)%3+1);
}
function startMove(id){
 const m=MOVES[chosenHero.id][id],ax=axisX();
 if(ax)player.face=ax>0?1:-1;
 player.atk={id,m,t:0,dur:m.dur*chosenHero.tempo,i:0,done:false};
 player.step=id[0]==='L'?+id[1]:0;player.strT=99;trail.length=0;
 const heavy=id==='H'||id==='F'||id==='L3';
 blip(heavy?130:240,.14,'sawtooth',.09);sfx(heavy?'chop':'slash',.22);if(heavy)dust(player.x-player.face*18,player.y,5);
 if(m.name)floater(player.x,player.y-195,m.name,id==='M'?chosenHero.fx[1]:'#ffd27a',46,id==='L3'?19:22);
}
function strikeHit(h){
 const dmg=Math.round(h.dmg*chosenHero.power*(rageT>0?1.4:1));let n=0;
 for(const e of enemies){
  if(e.hp<=0)continue;
  const d=(e.x-player.x)*player.face;
  if(d>-h.back&&d<h.reach&&Math.abs(e.y-player.y)<h.yt+(e.type===3?12:0)){damage(e,dmg,player.x,h.heavy,h.kb);n++}
 }
 for(const u of urns){
  if(u.hp<=0)continue;
  const d=(u.x-player.x)*player.face;
  if(d>-h.back&&d<h.reach&&Math.abs(u.y-player.y)<h.yt+12){breakUrn(u,h.heavy?2:1);n++}
 }
 if(h.ring){rings.push({x:player.x+player.face*70,y:player.y,t:0,r:170,color:'#ffb066'});shake=Math.max(shake,16);dust(player.x+player.face*70,player.y,16);flashFx(.22)}
 if(n&&h.heavy)flashFx(.12);
 if(n){shake=Math.max(shake,h.heavy?9:5);hitstop=Math.max(hitstop,h.heavy?4:1.5);sfx(h.heavy?'heavy':'hit',.32)}
 return n;
}
function magicBlast(m){
 const h=chosenHero,c=h.fx;
 shake=14;hitstop=Math.max(hitstop,4);sfx('magic',.45);blip(460,.5,'triangle',.16);
 const f=player.face;
 if(h.id==='astrid'){
  for(let i=0;i<34;i++){const life=rnd(14,22),vy=15,tx=player.x+f*rnd(-40,230)+rnd(-60,60),ty=player.y+rnd(-14,24);
   particles.push({x:tx,y:ty-vy*life-.075*life*life,vx:rnd(-.5,.5),vy,life,color:i%2?c[0]:c[1],size:rnd(3,6),streak:true})}
 }else if(h.id==='moonblade'){
  for(let i=0;i<46;i++){const k=rnd(0,1);particles.push({x:player.x+f*rnd(20,60),y:player.y-rnd(20,110),vx:f*rnd(10,18),vy:rnd(-1.5,1.5),life:rnd(14,26),color:k>.5?c[0]:c[1],size:rnd(3,8),streak:true})}
 }
 for(let i=0;i<60;i++){const a=rnd(-Math.PI,Math.PI),r=rnd(10,170);particles.push({x:player.x+Math.cos(a)*r*.55,y:player.y-60+Math.sin(a)*r*.35,vx:Math.cos(a)*rnd(2,11),vy:Math.sin(a)*rnd(2,7),life:rnd(20,45),color:i%2?c[0]:c[1],size:rnd(3,10)})}
 rings.push({x:player.x+(m.fwd?f*60:0),y:player.y,t:0,r:m.range[0]*.9,color:c[0]});
 let n=0;
 for(const e of enemies){
  if(e.hp<=0||Math.abs(e.y-player.y)>=m.range[1])continue;
  const d=(e.x-player.x)*f;
  if(m.fwd?(d>-50&&d<m.range[0]):Math.abs(e.x-player.x)<m.range[0]){damage(e,Math.round(80*h.power*h.magic*(rageT>0?1.4:1)),player.x,true,26);n++}
 }
 for(const u of urns){if(u.hp>0&&Math.abs(u.x-player.x)<m.range[0]&&(!m.fwd||(u.x-player.x)*f>-50))breakUrn(u,2)}
 flashFx(.35);
 return n;
}
// Advance the current move: start buffered input, lunge, fire hit frames, finish.
function stepAttack(dt){
 let a=player.atk;const b=player.buf;
 if(b&&player.stun<=0&&player.dodge<=0&&(!a||a.t/a.dur>=a.m.cancel)){
  player.buf=null;
  const id=pickMove(b.kind);
  if(id){startMove(id);a=player.atk}
 }
 if(!a)return;
 const prev=a.t/a.dur;a.t+=dt;const p=a.t/a.dur,m=a.m;
 if(m.lunge){
  const [p0,p1,d]=m.lunge,ease=u=>1-Math.pow(1-u,2);
  const u0=clamp((prev-p0)/(p1-p0),0,1),u1=clamp((p-p0)/(p1-p0),0,1);
  player.x+=player.face*d*(ease(u1)-ease(u0));
 }
 if(m.hits){while(a.i<m.hits.length&&p>=m.hits[a.i].p){const n=strikeHit(m.hits[a.i]);a.i++;a.done=true;if(n&&a.i===m.hits.length&&m.hits.length>1)floater(player.x+player.face*60,player.y-175,'FINISH','#ffd27a',30,16)}}
 else if(!a.done&&p>=m.hitAt){a.done=true;magicBlast(m)}
 if(a.t>=a.dur){player.atk=null;player.strT=26}
}
function damage(e,n,from,heavy=false,kb=18){
 if(e.hp<=0)return;
 e.hp=Math.max(0,e.hp-n);
 // The boss shrugs off light hits (no stagger, no interrupt); heavy hits and magic break its wind-up.
 if(e.type!==3||heavy){e.stun=17;e.windup=0}
 e.x+=Math.sign(e.x-from||1)*(e.type===3?6:kb);
 spawnBurst(e.x,e.y-80,e.type===3?'#ffba70':'#dca35c',9);
 impactFx(e.x,e.y-85,heavy,player.face,heavy?'#ffcf7a':'#ffe0a0');
 player.chain++;player.chainTimer=CHAIN_WINDOW;maxChain=Math.max(maxChain,player.chain);
 const mult=multiplier();player.score+=5*mult;
 floater(e.x,e.y-150,String(n),heavy?'#ffd27a':'#fff0cf',40,heavy?26:20);
 if(!e.hp){
  sfx('death',.24);kills++;totalKills++;
  const pts=foe[e.type].pts*(e.elite?2:1)*mult;player.score+=pts;deathEmbers(e);if(e.type===3)flashFx(.5);
  floater(e.x,e.y-185,'+'+pts,'#ffe08a',70,24);
  player.mana=Math.min(100,player.mana+12);hitstop=Math.max(hitstop,e.type===3?12:3);
  dropFrom(e.x,e.y,e.elite||e.type===3?1:.28);
 }
}
function hurtPlayer(n){
 if(player.inv>0||player.dodge>0||player.dying>0)return false;
 const dmg=Math.max(1,Math.round(n*chosenHero.defense));
 player.hp=Math.max(0,player.hp-dmg);player.stun=12;player.inv=35;player.atk=null;player.buf=null;player.step=0;player.strT=0;player.chain=0;player.chainTimer=0;shake=Math.max(shake,11);
 spawnBurst(player.x,player.y-65,'#e65d47',20);sfx('hit',.34);blip(90,.23,'sawtooth',.18);
 floater(player.x,player.y-160,'-'+dmg,'#ff8c75',46,24);
 return true;
}
function enrage(e){
 e.enraged=true;e.windup=0;shake=22;banner={text:'THE CINDER WARDEN ENRAGES',sub:'HEAVY HITS BREAK HIS GUARD',t:150,max:150};
 rings.push({x:e.x,y:e.y,t:0,r:260,color:'#ff6a3c'});blip(70,.6,'sawtooth',.2);flashFx(.3);
 for(let i=0;i<2;i++){const m=makeEnemy(0,camera+(i?W+60:-60),rnd(430,535));m.aggro=true;m.face=i?-1:1;enemies.push(m)}
 floater(e.x,e.y-240,'HE CALLS HIS WARBAND','#ff9a6a',90,22);
}
function strike(e){
 const f=foe[e.type];
 e.attack=23;e.attackVariant=e.type===3&&Math.random()<(e.enraged?.55:.4);
 e.cd=rnd(f.cd[0],f.cd[1])*(e.enraged?.7:1);
 const dm=DIFFS[SETTINGS.diff].dmg*(e.elite?1.25:1);
 const dx=player.x-e.x,dy=player.y-e.y;
 const inRange=Math.abs(dx)<f.reach+22&&Math.abs(dy)<44&&dx*e.face>-20;
 if(inRange){
  if(player.dodge>0){player.mana=Math.min(100,player.mana+8);floater(player.x,player.y-165,'PERFECT DODGE','#9fd2ff',54,18)}
  else hurtPlayer((e.type===3?(e.enraged?22:f.dmg):f.dmg)*dm);
 }
 // Enraged boss slam: a shockwave ring that can only be avoided by dodging through it.
 if(e.type===3&&e.enraged&&e.attackVariant){
  rings.push({x:e.x,y:e.y,t:0,r:170,color:'#ff9a4d'});shake=Math.max(shake,12);
  if(Math.abs(dx)<170&&Math.abs(dy)<60){
   if(player.dodge>0){player.mana=Math.min(100,player.mana+8);floater(player.x,player.y-165,'PERFECT DODGE','#9fd2ff',54,18)}
   else hurtPlayer(12*dm);
  }
 }
}
function enemyAI(e,dt){
 if(e.hp<=0){e.dead=Math.min(85,e.dead+dt);return}
 const f=foe[e.type];
 e.stun=Math.max(0,e.stun-dt);e.cd-=dt;e.attack=Math.max(0,e.attack-dt);e.walk+=dt;e.moving=false;
 if(e.type===3&&!e.enraged&&e.hp<=e.max*.5)enrage(e);
 if(e.stun>0){e.windup=0;return}
 if(e.windup>0){e.windup-=dt;if(e.windup<=0){e.windup=0;strike(e)}return}
 if(e.attack>0)return;
 const dx=player.x-e.x,dy=player.y-e.y;
 e.face=dx>=0?1:-1;
 const near=Math.abs(dx)<f.reach&&Math.abs(dy)<37;
 if(near){
  if(e.cd<=0){
   // Only a couple of grunts press the attack at once; the rest wait their turn.
   if(e.type===3||attackers()<MAX_ATTACKERS)e.windup=f.wind*(e.enraged?.7:1);
   else e.cd=rnd(12,30);
  }
 }else if(Math.abs(dx)<420||e.wave||e.aggro){
  e.moving=true;
  const sp=f.speed+(e.enraged?.25:0);
  if(Math.abs(dx)>f.reach*.55)e.x+=Math.sign(dx)*sp*dt;
  e.y+=Math.sign(dy)*Math.min(1.05,Math.abs(dy)*.025)*dt;
 }
 for(const o of enemies){
  if(o===e||o.hp<=0)continue;
  const ox=e.x-o.x,oy=e.y-o.y;
  if(Math.abs(ox)<34&&Math.abs(oy)<16){e.x+=(ox>0?1:ox<0?-1:(e.walk%2<1?1:-1))*.5*dt;e.y+=(oy>=0?1:-1)*.2*dt}
 }
 e.x=clamp(e.x,30,world-25);e.y=clamp(e.y,415,550);
}
function dodge(){
 if(state!=='playing'||player.dying>0||player.dodge>0||player.dodgeCool>0||player.stun>0)return;
 if(player.atk&&!player.atk.done)return; // a dodge can cancel a move only after it has landed
 player.atk=null;player.buf=null;player.step=0;player.strT=0;player.dodge=15;player.inv=Math.max(player.inv,17);player.dodgeCool=DODGE_TOTAL;blip(350,.12,'triangle');dust(player.x,player.y,10,player.face);
}

// ---------- Update ----------
function stageBonus(){
 const hp=Math.round(player.hp)*5,time=Math.max(0,Math.round((PAR_FRAMES-clock)/8));
 return {hp,time};
}
const fmtTime=f=>{const s=Math.floor(f/60);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function update(dt){
 stepDt=0;
 if(state==='cutscene'){stepScene(dt);return}
 if(state!=='playing')return;
 soundtrack();
 if(hitstop>0){hitstop-=dt;return}
 stepDt=dt;
 clock+=dt;runTime+=dt;frame+=dt;
 for(const k of ['stun','inv','dodge','dodgeCool'])player[k]=Math.max(0,player[k]-dt);
 player.anim+=dt;player.mixT=Math.min(1,player.mixT+dt/5);
 if(player.buf){player.buf.t-=dt;if(player.buf.t<=0)player.buf=null}
 if(player.strT>0&&!player.atk){player.strT-=dt;if(player.strT<=0)player.step=0}
 for(const t of trail)t.age+=dt;trail=trail.filter(t=>t.age<9);
 for(const gh of ghosts)gh.life-=dt;ghosts=ghosts.filter(gh=>gh.life>0);
 if(player.chainTimer>0){player.chainTimer-=dt;if(player.chainTimer<=0)player.chain=0}
 if(banner){banner.t-=dt;if(banner.t<=0)banner=null}
 if(goT>0)goT-=dt;if(rageT>0)rageT-=dt;if(hintT>0)hintT-=dt;flash*=Math.pow(.86,dt);
 for(const u of urns)if(u.hit>0)u.hit-=dt;
 let mx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),
     my=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
 const gp=navigator.getGamepads?.()[0];
 if(gp){
  mx+=Math.abs(gp.axes[0])>.2?gp.axes[0]:0;my+=Math.abs(gp.axes[1])>.2?gp.axes[1]:0;
  for(let i=0;i<4;i++){const b=gp.buttons[i]?.pressed||false;if(b&&!gpLast[i])i===0?attack():i===2?attack(true):i===1?attack(false,true):dodge();gpLast[i]=b}
  if(gp.buttons[14]?.pressed)mx=-1;if(gp.buttons[15]?.pressed)mx=1;if(gp.buttons[12]?.pressed)my=-1;if(gp.buttons[13]?.pressed)my=1;
 }
 player.moving=!!(mx||my);player.walking=false;
 if(player.dying>0){player.dying+=dt}
 else{
  stepAttack(dt);
  if(player.dodge>0){if(!mx)mx=player.face;else player.face=mx>0?1:-1}
  if(player.stun<=0){
   const atk=player.atk,speed=player.dodge>0?chosenHero.speed*2.15:atk?chosenHero.speed*.4:chosenHero.speed;
   const ox=player.x,oy=player.y;
   player.x+=clamp(mx,-1,1)*speed*dt;player.y+=clamp(my,-1,1)*speed*.75*dt;
   if(mx&&!atk&&player.dodge<=0)player.face=mx>0?1:-1;
   const moved=Math.hypot(player.x-ox,(player.y-oy)/.75);
   if(moved>.2&&!atk&&player.dodge<=0){player.gait+=moved/108;player.walking=true;player.stepD=(player.stepD||0)+moved;if(player.stepD>64){player.stepD=0;dust(player.x-player.face*10,player.y,2)}}
  }
 }
 {const lo=lockCam!==null?Math.max(30,camera+40):30,hi=lockCam!==null?lockCam+W-50:world-36;player.x=clamp(player.x,lo,hi)}
 player.y=clamp(player.y,413,550);
 {let tgt=clamp(player.x-355,0,world-W);if(lockCam!==null)tgt=Math.min(tgt,lockCam);camera+=(tgt-camera)*Math.min(.12*dt,1)}
 // Ambush arenas: the screen locks and the warband pours in from both sides until it is dead.
 if(lockCam===null){
  const w=waves.find(w=>!w.started&&player.x>=w.x);
  if(w){w.started=w.active=true;w.t=40;lockCam=clamp(w.x-355,0,world-W);banner={text:'AMBUSH',sub:'CUT DOWN THE WARBAND TO PRESS ON',t:150,max:150};blip(110,.4,'sawtooth',.18);shake=Math.max(shake,8)}
 }else{
  const w=waves.find(v=>v.active);
  if(w){
   w.t-=dt;
   const alive=enemies.filter(e=>e.wave===w&&e.hp>0).length;
   if(w.queue.length&&w.t<=0&&alive<4){
    const q=w.queue.shift(),left=w.queue.length%2===0,e=makeEnemy(q.type,left?lockCam-70:lockCam+W+70,rnd(425,540),{elite:q.elite,wave:w});
    e.face=left?1:-1;enemies.push(e);w.t=rnd(35,75);
   }
   if(!w.queue.length&&alive===0){w.active=false;w.done=true;lockCam=null;goT=320;floater(player.x,player.y-195,'AREA CLEARED','#ffd27a',80,26);sfx('pickup',.3);dropFrom(player.x+60,player.y,1)}
  }
 }
 for(const a of ambient){a.ph+=.02*dt;a.y+=(level===1?Math.sin(a.ph)*.25:-.5*a.z)*dt;a.x+=(Math.sin(a.ph*.7)*.3+(level===2?-.35:.12))*dt;if(a.y<-6)a.y=H+6;if(a.y>H+6)a.y=-6;if(a.x<-6)a.x=W+6;if(a.x>W+6)a.x=-6}
 for(const f of fxs)f.t+=dt;fxs=fxs.filter(f=>f.t<f.life);
 for(const e of enemies)enemyAI(e,dt);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=(p.g??.15)*dt;if(p.dust)p.vx*=Math.pow(.95,dt);p.life-=dt}
 particles=particles.filter(p=>p.life>0);
 for(const f of floaters){f.y-=.55*dt;f.life-=dt}floaters=floaters.filter(f=>f.life>0);
 for(const r of rings)r.t+=dt;rings=rings.filter(r=>r.t<34);
 for(const d of drops){
  d.tick+=dt;
  if(Math.abs(d.x-player.x)<36&&Math.abs(d.y-player.y)<36){
   if(d.type==='heal'){player.hp=Math.min(100,player.hp+24);floater(player.x,player.y-170,'+HP','#b9eb8e',40,18)}
   else if(d.type==='rage'){rageT=600;floater(player.x,player.y-170,'EMBER RAGE','#ffb066',70,22);flashFx(.2);for(let i=0;i<20;i++)sq(player.x+rnd(-20,20),player.y-rnd(0,120),rnd(-1,1),-rnd(1,3),rnd(24,48),'#ff9a4a',3,{glow:true,g:-.03})}
   else{player.mana=Math.min(100,player.mana+28);floater(player.x,player.y-170,'+MP','#a7b0ff',40,18)}
   d.gone=true;sfx('pickup',.25);blip(660,.3,'sine');
  }
 }
 drops=drops.filter(d=>!d.gone);shake*=Math.pow(.84,dt);
 if(player.hp<=0&&!(player.dying>0)){player.dying=.01;player.atk=null;player.buf=null;player.stun=0;shake=16;hitstop=Math.max(hitstop,8);sfx('death',.3);banner=null}
 if(player.dying>=78){end(false);return}
 if(level===2&&!player.bossSeen&&player.dying<=0&&player.x>world-780&&enemies.some(e=>e.type===3&&e.hp>0)){player.bossSeen=true;player.atk=null;player.buf=null;playScene('boss',()=>{state='playing'});return}
 if(player.dying<=0&&enemies.every(e=>e.hp<=0)&&waves.every(w=>w.done)&&player.x>world-400){
  const b=stageBonus(),cleared=level;player.score+=b.hp+b.time;
  if(level===2){end(true,b);return}
  reset(level+1);state='interlude';
  title.textContent=stages[level].name;
  message.textContent=stages[cleared].name+' CLEARED · HP BONUS +'+b.hp+' · TIME BONUS +'+b.time+'. '+stages[level].sub+' — THE CROWN DRAWS NEARER.';
  start.textContent='CONTINUE THE QUEST';O.hidden=true;
  playScene('stage'+(cleared+1),()=>{state='interlude';O.hidden=false});
 }
}
function end(win,bonus,seen){
 if(!seen&&scene===null&&window.AshenRig){playScene(win?'ending':'fallen',()=>end(win,bonus,true));return}
 state='end';O.hidden=false;
 const prevBest=store.get(bestKey(),0),isBest=player.score>prevBest;if(isBest)store.set(bestKey(),player.score);
 const stats=' Score: '+player.score+' · Foes felled: '+totalKills+' · Best chain: '+maxChain+' · Time: '+fmtTime(runTime)+' · '+DIFFS[SETTINGS.diff].n+' · BEST '+Math.max(prevBest,player.score)+(isBest&&player.score>0?' (NEW!)':'');
 title.textContent=win?'THE CROWN IS YOURS':'THE REALM REMEMBERS';
 message.textContent=(win?'The Cinder King has fallen and the Ember Crown has gone dark. You are the last light of the Ashen Realms.'+(bonus?' Final stage bonus +'+(bonus.hp+bonus.time)+'.':''):'Your quest ends beneath the ashes. The fallen await a champion.')+stats;
 start.textContent=win?'PLAY AGAIN':'RISE AGAIN';
}

// ---------- Render ----------
function drawUrn(u){
 if(u.hp<=0)return;
 const x=Math.round(u.x-camera),y=Math.round(u.y),w=u.hit>0?Math.sin(u.hit*2.2)*3:0;
 g.save();g.translate(x+w,y);
 g.fillStyle='#04080a99';g.beginPath();g.ellipse(0,3,24,6,0,0,Math.PI*2);g.fill();
 g.fillStyle='#2a1d19';g.fillRect(-16,-10,32,10);
 g.fillStyle='#4b362e';g.fillRect(-20,-34,40,26);g.fillStyle='#6a4c3d';g.fillRect(-20,-34,6,26);g.fillStyle='#2a1d19';g.fillRect(14,-34,6,26);
 g.fillStyle='#4b362e';g.fillRect(-12,-44,24,10);g.fillStyle='#7a5a44';g.fillRect(-15,-50,30,6);
 g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.55+.25*Math.sin(frame*.15+u.x);g.fillStyle='#ff8a3c';g.fillRect(-9,-48,18,2);g.restore();
 if(u.hp<2){g.fillStyle='#ff9a50';g.fillRect(-2,-32,2,14);g.fillRect(0,-20,2,8)}
 g.restore();
}
function drawFx(){
 for(const f of fxs){
  const p=f.t/f.life;
  g.save();g.translate(Math.round(f.x-camera),Math.round(f.y));g.globalCompositeOperation='lighter';g.globalAlpha=1-p;
  if(f.kind==='star'){
   const r=(f.heavy?36:23)*(p<.2?1.25:1-p*.55),t=Math.max(2,Math.round((f.heavy?7:5)*(1-p)));
   g.fillStyle=p<.35?'#ffffff':f.color;
   g.fillRect(-r,-t/2,r*2,t);g.fillRect(-t/2,-r,t,r*2);g.rotate(Math.PI/4);g.fillRect(-r*.6,-t/2,r*1.2,t);g.fillRect(-t/2,-r*.6,t,r*1.2);
  }else{
   g.rotate(f.ang);const L=(f.heavy?96:64)*Math.min(1,p*3.5+.35);
   g.fillStyle='#fff7df';g.fillRect(-L/2,-2,L,Math.max(1,Math.round(4*(1-p))));
   g.fillStyle='#ffd58a';g.fillRect(-L/2+8,-4,L-16,2);
  }
  g.restore();
 }
}
function drawAmbient(){
 g.save();g.globalCompositeOperation='lighter';
 for(const a of ambient){
  const x=((a.x-camera*a.z*.35)%W+W)%W,tw=.5+.5*Math.sin(a.ph*3);
  g.globalAlpha=(level===1?.25+.6*tw:.5*a.z)*.8;
  g.fillStyle=level===1?'#d6ff8e':level===2&&a.z<.6?'#aeb4c4':'#ff9d52';
  const sz=a.z>.75?3:2;g.fillRect(Math.round(x),Math.round(a.y),sz,sz);
 }
 g.restore();
}
function drawPause(){
 g.fillStyle='#0a0d18d8';g.fillRect(0,0,W,H);g.textAlign='center';
 g.fillStyle='#f9dcac';g.font='bold 52px Cinzel';g.fillText('PAUSED',W/2,H/2-150);
 const m=MOVES[chosenHero.id],rows=[['J  J  J',m.L3.name||'COMBO FINISH'],['K',m.H.name],['J  J  K',m.F.name],['L',m.M.name+' (MANA)'],['SPACE','DODGE (INVULNERABLE FOR A MOMENT)']];
 g.font='bold 22px Cinzel';g.fillStyle='#e0b878';g.fillText(chosenHero.name+' · MOVE LIST',W/2,H/2-100);
 rows.forEach(([k,n],i)=>{g.textAlign='right';g.font='bold 20px Barlow Condensed,Arial';g.fillStyle='#ffd98f';g.fillText(k,W/2-20,H/2-60+i*34);g.textAlign='left';g.font='20px Barlow Condensed,Arial';g.fillStyle='#f3e5c8';g.fillText(n,W/2+10,H/2-60+i*34)});
 g.textAlign='center';g.font='18px Arial';g.fillStyle='#cdbb9c';
 g.fillText('P / ESC  RESUME     ·     Q  QUIT TO TITLE     ·     M  MUTE',W/2,H/2+150);
 g.fillText('Difficulty: '+DIFFS[SETTINGS.diff].n,W/2,H/2+180);g.textAlign='left';
}
function drawProgress(){
 const x0=W/2-130,y=30,w=260;
 g.fillStyle='#0b101bcc';g.fillRect(x0-6,y-9,w+12,18);g.fillStyle='#3a3340';g.fillRect(x0,y-2,w,4);
 g.fillStyle='#d9a24f';g.fillRect(x0,y-2,w*clamp(player.x/world,0,1),4);
 for(const v of waves){g.fillStyle=v.done?'#9fd2a0':v.active?'#ff7a45':'#c9b28a';g.fillRect(x0+w*v.x/world-3,y-5,6,10)}
 g.fillStyle=enemies.some(e=>e.type===3&&e.hp>0)?'#e2452c':'#9fd2a0';g.fillRect(x0+w-4,y-6,8,12);
 g.fillStyle='#fff3d6';g.fillRect(x0+w*clamp(player.x/world,0,1)-2,y-7,4,14);
}
function hud(){
 g.fillStyle='#0b101bdd';g.fillRect(22,23,366,95);g.strokeStyle='#94734d';g.lineWidth=2;g.strokeRect(22,23,366,95);
 g.fillStyle='#f6d7a1';g.font='bold 20px Cinzel,serif';g.fillText(chosenHero.name,37,49);
 g.fillStyle='#282431';g.fillRect(37,58,290,16);g.fillStyle='#b5453b';g.fillRect(39,60,286*player.hp/100,12);
 g.fillStyle='#282431';g.fillRect(37,82,290,12);g.fillStyle='#6989d9';g.fillRect(39,84,286*player.mana/100,8);
 // Dodge pip: bright when ready, fills back up while recovering.
 const ready=player.dodgeCool<=0,fill=ready?1:1-player.dodgeCool/DODGE_TOTAL;
 g.fillStyle='#282431';g.fillRect(37,100,290,6);g.fillStyle=ready?'#9fd2a0':'#6a7a6c';g.fillRect(38,101,288*fill,4);
 g.fillStyle='#f9e1bd';g.font='16px Barlow Condensed,Arial';g.fillText('HP',336,72);g.fillText('MP',336,94);g.font='12px Barlow Condensed,Arial';g.fillText('DODGE',334,107);g.font='16px Barlow Condensed,Arial';
 g.textAlign='right';g.font='bold 22px Cinzel,serif';g.fillStyle='#f7d5a0';g.fillText(stages[level].name,W-25,48);
 g.font='17px Arial';const foesLeft=enemies.filter(e=>e.hp>0).length;g.fillText('SCORE '+player.score+'   •   '+foesLeft+(foesLeft===1?' FOE':' FOES'),W-25,75);
 if(player.chain>=2){
  const m=multiplier();
  g.font='bold 28px Cinzel,serif';g.fillStyle=m>=4?'#ffb25a':'#f7d5a0';g.fillText(player.chain+' HIT CHAIN',W-25,112);
  g.font='bold 18px Cinzel,serif';g.fillText('SCORE ×'+m,W-25,136);
  g.fillStyle='#282431';g.fillRect(W-185,144,160,5);g.fillStyle='#e0a95a';g.fillRect(W-185,144,160*player.chainTimer/CHAIN_WINDOW,5);
 }
 g.textAlign='left';
 if(rageT>0){g.fillStyle='#ffb066';g.font='bold 14px Cinzel,serif';g.fillText('EMBER RAGE',37,140);g.fillStyle='#282431';g.fillRect(37,146,120,5);g.fillStyle='#ff9a4a';g.fillRect(37,146,120*rageT/600,5)}
 drawProgress();
 const boss=enemies.find(e=>e.type===3&&e.hp>0&&e.x-player.x<530);
 if(boss){
  g.fillStyle='#1c1021e6';g.fillRect(W/2-215,H-54,430,34);g.fillStyle=boss.enraged?'#e2452c':'#b64c3b';g.fillRect(W/2-207,H-44,414*boss.hp/boss.max,11);
  g.fillStyle='#e7c49a';g.font='bold 13px Cinzel';g.textAlign='center';g.fillText(boss.enraged?'THE CINDER WARDEN · ENRAGED':'THE CINDER WARDEN',W/2,H-27);g.textAlign='left';
 }
 if(enemies.every(e=>e.hp<=0)&&waves.every(w=>w.done)){g.textAlign='center';g.font='bold 28px Cinzel';g.fillStyle='#ffdd97';g.fillText('THE WAY IS CLEAR — ADVANCE →',W/2,135);g.textAlign='left'}
 else if(goT>0&&lockCam===null&&Math.floor(frame/22)%2===0){g.textAlign='right';g.font='900 54px Cinzel,serif';g.lineWidth=6;g.strokeStyle='#2a0f0a';g.strokeText('GO ▶',W-50+Math.sin(frame*.2)*8,H*.42);g.fillStyle='#ffd98f';g.fillText('GO ▶',W-50+Math.sin(frame*.2)*8,H*.42);g.textAlign='left'}
 if(hintT>0&&level===0){
  const k=Math.floor((660-hintT)/220),tx=[['MOVE  WASD / ARROWS','ATTACK  J   (TAP J THREE TIMES TO CHAIN)'],['FINISHER  J  J  K','HEAVY  K · BREAKS GUARDS'],['DODGE  SPACE  (THROUGH ATTACKS)','MAGIC  L · SMASH URNS FOR ITEMS']][clamp(k,0,2)],ph=(660-hintT)%220,a=clamp(Math.min(ph/20,(220-ph)/20),0,1);
  g.save();g.globalAlpha=a;g.textAlign='center';g.fillStyle='#0b101bcc';g.fillRect(W/2-300,H-150,600,60);g.fillStyle='#ffd98f';g.font='bold 22px Barlow Condensed,Arial';g.fillText(tx[0],W/2,H-123);g.fillStyle='#f3e5c8';g.font='18px Barlow Condensed,Arial';g.fillText(tx[1],W/2,H-100);g.restore();
 }
 if(banner){
  const p=banner.t/banner.max,a=Math.min(1,p*5,(1-p)*8+.0001);
  g.save();g.globalAlpha=clamp(a,0,1);g.textAlign='center';
  g.font='bold 20px Barlow Condensed,Arial';g.fillStyle='#d9aa64';g.fillText(banner.text.startsWith('STAGE')?banner.text:'— WARNING —',W/2,H*.30-34);
  g.font='900 46px Cinzel,Georgia,serif';g.lineWidth=6;g.strokeStyle='#2a0f0a';
  const main=banner.text.startsWith('STAGE')?banner.sub:banner.text;
  g.strokeText(main,W/2,H*.30+12);g.fillStyle='#f8e7bf';g.fillText(main,W/2,H*.30+12);
  g.font='18px Barlow Condensed,Arial';g.fillStyle='#d6c3a9';g.fillText(banner.text.startsWith('STAGE')?stages[level].sub:banner.sub,W/2,H*.30+44);
  g.restore();
 }
}
function render(){
 if(state==='cutscene'&&scene){drawScene();return}
 g.save();if(shake>1&&SETTINGS.shake)g.translate(rnd(-shake,shake),rnd(-shake,shake));
 backdrop();
 for(const u of urns)drawUrn(u);
 for(const d of drops){
  const x=d.x-camera,col=d.type==='heal'?'#9cda77':d.type==='rage'?'#ff9a4a':'#9c9ef7',by=d.y-14+Math.sin(d.tick*.1)*4;
  g.save();g.globalCompositeOperation='lighter';g.globalAlpha=.35+.15*Math.sin(d.tick*.15);ellipse(x,by,24,24,col);g.restore();
  ellipse(x,by,13,13,col);
  g.fillStyle='#18252a';g.font='bold 18px Arial';g.textAlign='center';g.fillText(d.type==='heal'?'+':d.type==='rage'?'⚔':'✦',x+1,by+6);g.textAlign='left';
 }
 for(const r of rings){
  const p=r.t/34;g.save();g.globalAlpha=(1-p)*.8;g.strokeStyle=r.color;g.lineWidth=6*(1-p)+1;
  g.beginPath();g.ellipse(r.x-camera,r.y,r.r*p,r.r*p*.28,0,0,Math.PI*2);g.stroke();g.restore();
 }
 const entities=[...enemies.filter(e=>e.dead<80),player].sort((a,b)=>a.y-b.y);
 for(const e of entities){
  if(e===player)drawHero();else sprite(e);
  if(e!==player&&e.hp>0&&e.hp<e.max){g.fillStyle='#190d14';g.fillRect(e.x-camera-28,e.y-159,56,5);g.fillStyle=e.elite?'#e9c04e':'#d75b42';g.fillRect(e.x-camera-28,e.y-159,56*e.hp/e.max,5)}
  if(e!==player&&e.hp>0&&e.elite){g.fillStyle='#ffd35a';g.font='bold 14px Arial';g.textAlign='center';g.fillText('★ ELITE',e.x-camera,e.y-166);g.textAlign='left'}
  if(e!==player&&e.hp>0&&e.windup>0)telegraph(e);
 }
  for(const p of particles){
  g.globalAlpha=Math.min(1,p.life/(p.dust?22:17))*(p.dust?.7:1);
  if(p.streak){g.strokeStyle=p.color;g.lineWidth=p.size;g.lineCap='round';g.beginPath();g.moveTo(p.x-camera,p.y);g.lineTo(p.x-camera-p.vx*2.2,p.y-p.vy*2.2);g.stroke()}
  else if(p.sq){if(p.glow)g.globalCompositeOperation='lighter';g.fillStyle=p.color;g.fillRect(Math.round(p.x-camera),Math.round(p.y),p.size,p.size);g.globalCompositeOperation='source-over'}
  else ellipse(p.x-camera,p.y,p.size,p.size*.8,p.color)}
 g.globalAlpha=1;
 drawFx();drawAmbient();
 if(window.drawAshenForeground)window.drawAshenForeground(g,level,camera,frame,W,H,player.x-camera);
 for(const f of floaters){
  g.save();g.globalAlpha=Math.min(1,f.life/(f.max*.4));g.textAlign='center';g.font='bold '+f.size+'px Cinzel,Georgia,serif';
  g.lineWidth=4;g.strokeStyle='#150b0c';g.strokeText(f.text,f.x-camera,f.y);g.fillStyle=f.color;g.fillText(f.text,f.x-camera,f.y);g.restore();
 }
 g.restore();
 if(flash>.02){g.fillStyle='rgba(255,244,222,'+Math.min(.6,flash)+')';g.fillRect(0,0,W,H)}
 if(player.hp<35&&player.dying<=0&&(state==='playing'||state==='paused')){const a=(1-player.hp/35)*(.5+.18*Math.sin(frame*.12)),vg=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.9);vg.addColorStop(0,'rgba(120,0,0,0)');vg.addColorStop(1,'rgba(150,10,10,'+a+')');g.fillStyle=vg;g.fillRect(0,0,W,H)}
 if(state==='playing'||state==='paused')hud();
 if(state==='paused')drawPause();
}

// ---------- Story cutscenes (script in story.js) ----------
let scene=null,grainCv=null,grainT=0;
const lerp=(a,b,t)=>a+(b-a)*t,GRADES={ember:['#ff7a33',.22],ash:['#8c93a8',.2],cold:['#4e86a8',.26],dusk:['#9a4a88',.24],inferno:['#ff3b1a',.28],dawn:['#ffc878',.3]};
const cast=who=>{const o=heroes.filter(h=>h!==chosenHero);return who==='hero'?chosenHero:who==='ally'?o[0]:who==='ally2'?o[1]:who==='ally3'?o[2]:null};
const tokens=t=>(t||'').replace(/\{hero\}/g,chosenHero.name).replace(/\{ally\}/g,cast('ally').name).replace(/\{ally2\}/g,cast('ally2').name).replace(/\{ally3\}/g,cast('ally3').name);
function playScene(id,done){
 const shots=window.ASHEN_STORY?.scenes?.[id];
 if(!shots||!window.AshenRig){done&&done();return}
 scene={id,shots,i:0,t:0,typed:0,done,rig:{},fxp:[]};
 state='cutscene';O.hidden=true;choicePanel.hidden=true;
}
function endScene(){const d=scene?.done;scene=null;if(d)d()}
function nextShot(){scene.i++;scene.t=0;scene.typed=0;scene.fxp.length=Math.min(scene.fxp.length,30);if(scene.i>=scene.shots.length)endScene()}
function sceneAdvance(){
 if(state!=='cutscene'||!scene)return;
 const sh=scene.shots[scene.i],len=tokens(sh.text).length;
 if(scene.typed<len)scene.typed=len;else if(scene.t>.35)nextShot();
}
function skipScene(){if(state==='cutscene'&&scene)endScene()}
function stepScene(dt){
 if(!scene)return;
 const sh=scene.shots[scene.i];scene.t+=dt/60;scene.typed+=dt/60*44;
 const len=tokens(sh.text).length;
 if(!sh.text&&scene.t>=(sh.len||6)*.85)nextShot();
 else if(scene.typed>=len&&len&&scene.t>(sh.len||7)+6)nextShot();
 const fx=sh.fx;
 if(fx&&scene.fxp.length<90&&Math.random()<.75){
  const up=fx==='embers'||fx==='dawn'||fx==='motes';
  scene.fxp.push({x:rnd(0,W),y:up?H+10:-10,vx:rnd(-.4,.9),vy:up?-rnd(.4,1.6):rnd(.25,.9),s:rnd(1,fx==='ash'?3:3.4),l:rnd(260,480),c:fx==='embers'?(Math.random()<.5?'#ff9b4a':'#ffd08a'):fx==='ash'?'#c9ccd6':fx==='motes'?'#9fe6f0':'#ffe7a6',w:rnd(0,6)});
 }
 for(const p of scene.fxp){p.x+=p.vx*dt+Math.sin(p.w+scene.t*1.3)*.35*dt;p.y+=p.vy*dt;p.l-=dt}
 scene.fxp=scene.fxp.filter(p=>p.l>0&&p.y>-30&&p.y<H+30);
}
function drawRigChar(c,e){
 const R=window.AshenRig,S=R.S;
 const fromT=Array.isArray(c.x)?c.x:[c.x,c.x],x=lerp(fromT[0],fromT[1],e),y=c.y||580,sc=(c.scale||1.6)*lerp(1,1.04,e),face=c.face||1;
 if(c.who==='king'){
  const ent=sheetCache.boss?.idle;if(!ent?.ready)return;
  const idx=Math.floor(scene.t*8)%ent.frames,cw=ent.img.naturalWidth/ent.frames,ch=ent.img.naturalHeight,b=ent.bounds?.[idx]||{bottom:ch-1};
  g.save();g.translate(x,y);g.fillStyle='#04080acc';g.beginPath();g.ellipse(0,4,sc*16,sc*3.5,0,0,Math.PI*2);g.fill();
  g.scale(face,1);g.imageSmoothingEnabled=false;g.filter='brightness(.8) saturate(1.3)';
  g.drawImage(ent.img,idx*cw,0,cw,ch,-cw*sc/2,-(b.bottom+1)*sc+2,cw*sc,ch*sc);g.restore();return;
 }
 const h=cast(c.who);if(!h)return;
 const st=scene.rig[c.who]||(scene.rig[c.who]=R.makeState(h.id));
 const moving=fromT[0]!==fromT[1],anim=c.anim||(moving?'walk':'idle');
 const p=c.p!==undefined?c.p:(anim==='walk'?(scene.t*1.15)%1:(scene.t*60/100)%1);
 const out=R.render(h.id,R.pose(h.id,anim,p),st,{ex:x,ey:y,face,dt:1});
 g.save();g.translate(x,y);
 if(c.ghost){
  const gr=g.createRadialGradient(0,-70*sc,5,0,-70*sc,150*sc);gr.addColorStop(0,'#9fe6f055');gr.addColorStop(1,'#9fe6f000');g.fillStyle=gr;g.fillRect(-160*sc,-230*sc,320*sc,300*sc);
 }else{g.fillStyle='#04080acc';g.beginPath();g.ellipse(0,4,sc*14,sc*3.4,0,0,Math.PI*2);g.fill()}
 g.scale(face*sc,sc);g.imageSmoothingEnabled=false;
 if(c.ghost){g.globalAlpha=.6+.12*Math.sin(scene.t*2.2);g.filter='brightness(1.55) saturate(.45) hue-rotate(165deg)'}
 else if(c.dim)g.filter='brightness(.58) saturate(.7)';
 g.drawImage(out.canvas,-out.ox*S,-out.oy*S,out.w*S,out.h*S);g.restore();
}
function wrapText(txt,maxW){
 const words=txt.split(' '),lines=[];let cur='';
 for(const w of words){const t=cur?cur+' '+w:w;if(g.measureText(t).width>maxW&&cur){lines.push(cur);cur=w}else cur=t}
 if(cur)lines.push(cur);return lines;
}
function drawScene(){
 const sh=scene.shots[scene.i],t=scene.t,u=clamp(t/(sh.len||7),0,1),e=u*u*(3-2*u),bg=sh.bg<0?level:sh.bg;
 g.save();g.fillStyle='#05070c';g.fillRect(0,0,W,H);
 const z=lerp(sh.zoom[0],sh.zoom[1],e),cam=lerp(sh.cam[0],sh.cam[1],e);
 g.save();g.translate(W/2,H*.58);g.scale(z,z);g.translate(-W/2,-H*.58);
 if(!window.drawAshenBackdrop?.(g,bg,cam,t*60,W,H)){const s=stages[bg],gr=g.createLinearGradient(0,0,0,H);gr.addColorStop(0,s.sky[0]);gr.addColorStop(.6,s.sky[1]);gr.addColorStop(1,s.sky[2]);g.fillStyle=gr;g.fillRect(0,0,W,H);g.fillStyle=s.ground;g.fillRect(0,H*.66,W,H)}
 g.restore();
 // ground haze so figures sit in the picture
 const hz=g.createLinearGradient(0,H*.55,0,H);hz.addColorStop(0,'#00000000');hz.addColorStop(1,'#05070c99');g.fillStyle=hz;g.fillRect(0,H*.55,W,H);
 for(const c of sh.chars||[])drawRigChar(c,e);
 // drifting particles (additive)
 g.save();g.globalCompositeOperation='lighter';
 for(const p of scene.fxp){g.globalAlpha=clamp(Math.min(p.l/60,1),0,1)*.8;g.fillStyle=p.c;g.beginPath();g.arc(p.x,p.y,p.s,0,Math.PI*2);g.fill()}
 g.restore();
 // colour grade, vignette, film grain
 const gd=GRADES[sh.grade];
 if(gd){g.save();g.globalCompositeOperation='soft-light';g.globalAlpha=gd[1]*2.2;g.fillStyle=gd[0];g.fillRect(0,0,W,H);g.restore()}
 const vg=g.createRadialGradient(W/2,H*.5,H*.28,W/2,H*.5,H*.95);vg.addColorStop(0,'#00000000');vg.addColorStop(1,'#000000cc');g.fillStyle=vg;g.fillRect(0,0,W,H);
 if(!grainCv){grainCv=document.createElement('canvas');grainCv.width=192;grainCv.height=108}
 if(--grainT<=0){grainT=3;const gx=grainCv.getContext('2d'),im=gx.createImageData(192,108);for(let i=0;i<im.data.length;i+=4){const v=Math.random()*255;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=255}gx.putImageData(im,0,0)}
 g.save();g.globalAlpha=.07;g.globalCompositeOperation='overlay';g.imageSmoothingEnabled=false;g.drawImage(grainCv,0,0,W,H);g.restore();
 // letterbox
 g.fillStyle='#000';g.fillRect(0,0,W,64);g.fillRect(0,H-64,W,64);
 // chapter card
 if(sh.card){
  const a=Math.min(1,t/1.2,(Math.max(.01,(sh.len||7)-t))/1.5);
  g.save();g.globalAlpha=clamp(a,0,1);g.textAlign='center';
  g.font='900 62px Cinzel,Georgia,serif';g.lineWidth=8;g.strokeStyle='#1a0904';g.strokeText(sh.card.big,W/2,H*.44);g.fillStyle='#f8e7bf';g.fillText(sh.card.big,W/2,H*.44);
  g.font='20px Barlow Condensed,Arial';g.fillStyle='#e0b878';g.fillText(sh.card.small.split('').join(' '),W/2,H*.44+38);g.restore();
 }
 // dialogue
 const full=tokens(sh.text),shown=full.slice(0,Math.floor(scene.typed));
 if(full){
  const bar=g.createLinearGradient(0,H-300,0,H-64);bar.addColorStop(0,'#00000000');bar.addColorStop(1,'#000000d0');g.fillStyle=bar;g.fillRect(0,H-300,W,236);
  const who=tokens(sh.speaker);g.textAlign='left';
  g.font='italic 27px Georgia,serif';
  const lines=wrapText(full,W-300),baseY=H-64-26-(lines.length-1)*36;
  if(who){g.font='bold 18px Cinzel,Georgia,serif';g.fillStyle=who==='KING VAEL'?'#ff8d6a':'#e8bb74';g.fillText(who,150,baseY-40)}
  g.font=(who?'':'italic ')+'27px Georgia,serif';g.lineWidth=5;g.strokeStyle='#05070c';
  let n=shown.length;
  lines.forEach((ln,i)=>{const part=ln.slice(0,Math.max(0,n));n-=ln.length+1;if(part){g.strokeText(part,150,baseY+i*36);g.fillStyle='#f4ead6';g.fillText(part,150,baseY+i*36)}});
  if(scene.typed>=full.length&&Math.floor(t*2)%2===0){g.font='16px Arial';g.fillStyle='#e0b878';g.textAlign='right';g.fillText('ENTER ▶',W-40,H-26);g.textAlign='left'}
 }
 g.font='14px Arial';g.fillStyle='#ffffff88';g.textAlign='right';g.fillText('ESC · SKIP',W-26,44);g.textAlign='left';
 // fades
 const fi=clamp(1-t/.55,0,1);if(fi>0){g.fillStyle='rgba(0,0,0,'+fi+')';g.fillRect(0,0,W,H)}
 if(sh.flash){const f=clamp(1-t/.7,0,1);if(f>0){g.fillStyle='rgba(255,236,200,'+f*.85+')';g.fillRect(0,0,W,H)}}
 g.restore();
}

// ---------- Menus, input and main loop ----------
let menuPadCool=0,menuPadPrevConfirm=false,menuPadPrevBack=false;
function handleMenuPad(t){
 if(state==='cutscene'){const gp=navigator.getGamepads?.()[0];const a=!!gp?.buttons[0]?.pressed,s=!!gp?.buttons[9]?.pressed||!!gp?.buttons[1]?.pressed;if(a&&!menuPadPrevConfirm)sceneAdvance();if(s&&!menuPadPrevBack)skipScene();menuPadPrevConfirm=a;menuPadPrevBack=s;return}
 if(state!=='select')return;
 const gp=navigator.getGamepads?.()[0];if(!gp)return;
 const left=gp.buttons[14]?.pressed||gp.axes[0]<-.65,right=gp.buttons[15]?.pressed||gp.axes[0]>.65;
 if(t>menuPadCool&&(left||right)){setHeroChoice(selectedHero+(right?1:-1));menuPadCool=t+240}
 const confirm=gp.buttons[0]?.pressed,back=gp.buttons[1]?.pressed;
 if(confirm&&!menuPadPrevConfirm)beginSelectedGame();
 if(back&&!menuPadPrevBack)backToTitle();
 menuPadPrevConfirm=confirm;menuPadPrevBack=back;
}
function loop(t){
 const dt=Math.min(2.5,(t-last)/16.667||1);last=t;
 handleMenuPad(t);window.ASHEN_AUDIO?.update(level,state==='cutscene'?'playing':state);update(dt);render();if(state==='select')paintPortraits(t);requestAnimationFrame(loop);
}
let lastPaint=0;
function paintPortraits(t=performance.now()){
 if(!choiceCards||!window.AshenRig||t-lastPaint<45)return;lastPaint=t;
 choiceCards.querySelectorAll('[data-preview]').forEach(cv=>{
  const hero=heroes[+cv.dataset.preview];
  window.AshenRig.portrait(hero.id,cv.getContext('2d'),cv.width,cv.height,t+(+cv.dataset.preview)*430);
 });
}
function showCharacterSelect(){state='select';O.hidden=true;choicePanel.hidden=false;setHeroChoice(selectedHero)}
function backToTitle(){choicePanel.hidden=true;O.hidden=false;state='menu'}
function setHeroChoice(i){
 selectedHero=(i+heroes.length)%heroes.length;
 choiceCards.querySelectorAll('[data-hero]').forEach((b,j)=>{const active=j===selectedHero;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active?'true':'false')});
 $('#selectedBio').textContent=heroes[selectedHero].bio;lastPaint=0;paintPortraits();
}
function beginSelectedGame(){chosenHero=heroes[selectedHero];choicePanel.hidden=true;reset(0);playScene('prologue',startPlaying)}
function startPlaying(){
 nextBeat=0;
 try{audioCtx ||= new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume()}catch{}
 state='playing';O.hidden=true;choicePanel.hidden=true;window.ASHEN_AUDIO?.unlock();window.ASHEN_AUDIO?.enterStage(level);sfx('slash',.12);
 banner={text:'STAGE '+(level+1),sub:stages[level].name,t:170,max:170};
}
heroes.forEach((hero,i)=>{
 const btn=document.createElement('button');btn.type='button';btn.className='hero-card';btn.dataset.hero=i;
 const safe=v=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 btn.innerHTML='<canvas width="190" height="190" data-preview="'+i+'" aria-hidden="true"></canvas><span class="hero-name">'+safe(hero.name)+'</span><span class="hero-role">'+safe(hero.role)+'</span><span class="stat-lines">'+['POWER','SPEED','ARMOUR','MAGIC'].map((stat,j)=>'<span class="stat"><small>'+stat+'</small><i style="--value:'+hero.stats[j]*10+'%"></i></span>').join('')+'</span>';
 btn.addEventListener('click',()=>setHeroChoice(i));btn.addEventListener('dblclick',beginSelectedGame);choiceCards.appendChild(btn);
});
chooseButton.addEventListener('click',beginSelectedGame);
backButton.addEventListener('click',backToTitle);
function play(){
 if(state==='interlude'){startPlaying();return}
 if(state==='menu'||state==='end'){showCharacterSelect();return}
 if(state==='select')beginSelectedGame();
}
const settingsEl=$('#settings');
function renderSettings(){
 if(!settingsEl)return;settingsEl.innerHTML='';
 const add=(label,on,fn)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.className='chip'+(on?' on':'');b.setAttribute('aria-pressed',on?'true':'false');b.onclick=()=>{fn();saveSettings();renderSettings()};settingsEl.appendChild(b)};
 DIFFS.forEach((d,i)=>add(d.n,SETTINGS.diff===i,()=>{SETTINGS.diff=i}));
 add('SHAKE '+(SETTINGS.shake?'ON':'OFF'),SETTINGS.shake,()=>{SETTINGS.shake=!SETTINGS.shake});
 add('FLASH '+(SETTINGS.flash?'ON':'OFF'),SETTINGS.flash,()=>{SETTINGS.flash=!SETTINGS.flash});
}
renderSettings();
start.addEventListener('click',play);
window.addEventListener('keydown',e=>{
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();
 if(state==='cutscene'){
  if(!keys.has(e.code)){if(e.code==='Escape')skipScene();else if(['Enter','Space','KeyJ','KeyK','ArrowRight'].includes(e.code))sceneAdvance();else if(e.code==='KeyM')window.ASHEN_AUDIO?.switchMute()}
 }else if(state==='select'){
  if(!keys.has(e.code)){
   if(['ArrowLeft','KeyA','ArrowUp','KeyW'].includes(e.code))setHeroChoice(selectedHero-1);
   else if(['ArrowRight','KeyD','ArrowDown','KeyS'].includes(e.code))setHeroChoice(selectedHero+1);
   else if(['Enter','Space','KeyJ'].includes(e.code))beginSelectedGame();
   else if(e.code==='Escape')backToTitle();
  }
 }else if(!keys.has(e.code)){
  if(e.code==='KeyJ')attack();
  if(e.code==='KeyK')attack(true);
  if(e.code==='KeyL')attack(false,true);
  if(e.code==='Space')dodge();
  if(e.code==='KeyM')window.ASHEN_AUDIO?.switchMute();
  if(e.code==='Enter'&&state!=='playing'&&state!=='paused')play();
  if(e.code==='KeyP'||e.code==='Escape'){if(state==='playing')state='paused';else if(state==='paused')state='playing'}
  if(e.code==='KeyQ'&&state==='paused'){state='menu';O.hidden=false;title.textContent=menuDefault.title;message.textContent=menuDefault.text;start.textContent=menuDefault.btn}
 }
 keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
C.addEventListener('pointerdown',()=>sceneAdvance());
window.addEventListener('blur',()=>keys.clear());
document.addEventListener('visibilitychange',()=>{if(document.hidden&&state==='playing')state='paused'});
document.querySelectorAll('[data-key]').forEach(b=>{
 const k=b.dataset.key;
 b.addEventListener('pointerdown',e=>{
  e.preventDefault();b.setPointerCapture(e.pointerId);
  if(k==='KeyJ')attack();else if(k==='KeyK')attack(true);else if(k==='KeyL')attack(false,true);
  else if(k==='Space')dodge();else keys.add(k);
 });
 for(const ev of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(ev,()=>keys.delete(k));
});

// Test hook: only exists when the page is opened with ?debug
if(typeof location!=='undefined'&&/[?&]debug\b/.test(location.search||'')){
 window.ASHEN2_DEBUG={get state(){return state},set state(v){state=v},get level(){return level},get enemies(){return enemies},get hitstop(){return hitstop},get banner(){return banner},get maxChain(){return maxChain},player,heroes,foe,MOVES,reset,attack,pressAttack,damage,dodge,enemyAI,hurtPlayer,update,render,end,loop,beginSelectedGame,attackers,get floaters(){return floaters},get trail(){return trail},get drops(){return drops},get waves(){return waves},get urns(){return urns},get lockCam(){return lockCam},get rageT(){return rageT},set rageT(v){rageT=v},SETTINGS,breakUrn,dropFrom,makeEnemy,playScene,get scene(){return scene},sceneAdvance,skipScene,drawScene,get ghosts(){return ghosts},get heroSt(){return heroSt},set chosen(i){chosenHero=heroes[i]},get rings(){return rings}};
}
reset();state='menu';requestAnimationFrame(loop);
})();
