/* Ashen Realms 2 — game logic (V2.0)
 * Same art, audio and hero roster as V1.5. What changed is how fights play:
 * telegraphed enemy attacks, an attacker limit, hit-chain scoring, a dodge
 * cooldown, boss enrage, stage bonuses, hit-stop and floating damage numbers.
 */
(()=>{'use strict';
const $=s=>document.querySelector(s);
const C=$('#game'),g=C.getContext('2d'),W=1152,H=648;
const O=$('#overlay'),title=$('#menuTitle'),message=$('#menuText'),start=$('#start');
const choicePanel=$('#characterSelect'),choiceCards=$('#heroCards'),chooseButton=$('#confirmHero'),backButton=$('#backToTitle');

let state='menu',level=0,clock=0,runTime=0,frame=0,shake=0,camera=0,kills=0,totalKills=0,maxChain=0,hitstop=0,last=0;
let particles=[],enemies=[],drops=[],floaters=[],rings=[],banner=null;
const keys=new Set(),gpLast=[];

const stages=[
 {name:'THE BURNING MARCH',sub:'THE FRONTIER HAS FALLEN',sky:['#161c38','#904a42','#e49a61'],hill:'#282b42',ground:'#433e3b'},
 {name:'THE FORGOTTEN WOODS',sub:'THE OLD GODS ARE WATCHING',sky:['#101d2b','#395c56','#a08e63'],hill:'#233e37',ground:'#303e39'},
 {name:'THE CINDER THRONE',sub:'THE FINAL RECKONING',sky:['#120e21','#552a3e','#c15539'],hill:'#39263a',ground:'#3c3037'}
],world=2500;

const heroes=[
 {id:'warden',name:'IRON WARDEN',role:'Knight · Balanced',pack:'hero',filter:'none',power:1,speed:3.55,defense:1,magic:1,stats:[7,6,7,5],bio:'A veteran knight with balanced swordplay and dependable armour.'},
 {id:'berserker',name:'ASH BERSERKER',role:'Champion · Heavy',pack:'boss',filter:'sepia(.22) saturate(1.35)',power:1.42,speed:2.85,defense:.82,magic:.8,stats:[10,4,8,3],bio:'Devastating blows and heavy armour at the cost of speed.'},
 {id:'moonblade',name:'MOONBLADE',role:'Spellblade · Swift',pack:'hero',filter:'hue-rotate(92deg) saturate(1.5) brightness(1.15)',power:.82,speed:4.65,defense:1.25,magic:1.5,stats:[6,10,4,10],bio:'An agile spellblade whose strong magic offsets light armour.'}
];
let selectedHero=0,chosenHero=heroes[0];

// Enemy tuning. wind = telegraph frames before the strike lands, reach = strike range (px),
// cd = frames between attacks, pts = score for the kill (before chain multiplier).
const foe=[
 {name:'goblin',  hp:43, reach:72, wind:20,dmg:8, speed:.62,cd:[70,110],pts:100},
 {name:'skeleton',hp:62, reach:76, wind:15,dmg:9, speed:.81,cd:[60,100],pts:150},
 {name:'mushroom',hp:100,reach:72, wind:28,dmg:12,speed:.62,cd:[85,125],pts:220},
 {name:'boss',    hp:360,reach:115,wind:30,dmg:18,speed:.62,cd:[80,92], pts:1500}
];
const MAX_ATTACKERS=2,CHAIN_WINDOW=150,DODGE_TOTAL=44,PAR_FRAMES=4800;

const player={x:120,y:485,hp:100,max:100,mana:100,face:1,attack:0,attackKind:'normal',combo:0,cool:0,stun:0,inv:0,dodge:0,dodgeCool:0,anim:0,score:0,chain:0,chainTimer:0,moving:false};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const multiplier=()=>1+Math.min(4,Math.floor(player.chain/5));

function makeEnemy(type,x,y){
 const hp=foe[type].hp;
 return {x,y,type,hp,max:hp,face:-1,stun:0,attack:0,windup:0,cd:rnd(20,100),dead:0,walk:rnd(0,6),moving:false,attackVariant:false,enraged:false};
}
function reset(l=0){
 level=l;clock=0;frame=0;camera=0;kills=0;hitstop=0;
 enemies=[];drops=[];particles=[];floaters=[];rings=[];
 if(l===0){player.score=0;maxChain=0;totalKills=0;runTime=0}
 Object.assign(player,{x:120,y:480,hp:l===0?100:Math.min(100,player.hp+28),mana:100,face:1,attack:0,attackKind:'normal',combo:0,cool:0,stun:0,inv:0,dodge:0,dodgeCool:0,anim:0,chain:0,chainTimer:0,moving:false});
 for(let i=0;i<12+l*3;i++)enemies.push(makeEnemy(i%5===0?2:i%3===0?1:0,350+i*145+rnd(-30,30),rnd(410,535)));
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
const sheetPacks={hero:window.ASHEN_HERO,boss:window.ASHEN_BOSS,...window.ASHEN_MONSTERS};
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
   entry.ready=true;sheetsLoaded++;paintPortraits();
  };
  img.onerror=()=>{entry.failed=true;sheetsLoaded++};
  img.src=info.src;
 }
}
function sprite(e,hero=false){
 const boss=!hero&&e.type===3;
 const character=hero?chosenHero.pack:boss?'boss':e.type===0?'goblin':e.type===1?'skeleton':'mushroom';
 const pack=sheetCache[character];if(!pack)return;
 const dead=!hero&&e.hp<=0,hurt=!hero?e.stun>0:player.stun>0,attacking=e.attack>0,moving=!!e.moving;
 const winding=!hero&&e.windup>0;
 const comboAnim=hero&&chosenHero.pack==='hero'&&player.combo===2?'attackAlt':'attack';
 const requested=dead?'death':hurt?'hurt':attacking?(hero?(player.attackKind==='heavy'?'heavy':comboAnim):boss?(e.attackVariant?'heavy':'attack'):'attack'):moving?'walk':'idle';
 const st=pack[requested]?.ready?requested:'idle';
 const a=pack[st];if(!a?.ready)return;
 const total=a.frames,rate=a.fps||10;
 let index;
 if(st==='death')index=Math.min(total-1,Math.floor(e.dead*rate/60));
 else if(st==='hurt')index=Math.min(total-1,Math.floor((17-e.stun)*rate/60));
 else if(st==='attack'||st==='heavy'||st==='attackAlt'){
  const duration=hero?(player.attackKind==='heavy'?22:14):23;
  index=Math.min(total-1,Math.max(0,Math.floor((duration-e.attack)/duration*total)));
 }else index=Math.floor((hero?player.anim:e.walk)*rate/60)%total;
 const visualClock=hero?player.anim:e.walk,poseTime=visualClock*rate/60;
 const blend=(st==='walk'||st==='idle')?(poseTime-Math.floor(poseTime)):0;
 const cellW=a.img.naturalWidth/total,cellH=a.img.naturalHeight;
 const scale=hero?(chosenHero.pack==='boss'?2.65:2.8):boss?3.1:2.7;
 const x=e.x-camera,y=e.y;
 g.save();g.translate(Math.round(x),Math.round(y));
 g.fillStyle='#04080ab0';g.beginPath();g.ellipse(0,4,boss?46:hero?34:28,boss?11:7,0,0,Math.PI*2);g.fill();
 if(hero&&e.inv>0&&Math.floor(frame/4)%2)g.globalAlpha=.5;
 if(dead)g.globalAlpha=Math.max(0,1-e.dead/80);
 g.scale(e.face||1,1);g.imageSmoothingEnabled=false;
 const bounds=a.bounds?.[index]||{bottom:cellH-1,left:0,right:cellW-1,top:0};
 const groundOffset=boss?2:hero?1:0,footY=-(bounds.bottom+1)*scale+groundOffset;
 if(hero&&chosenHero.filter!=='none')g.filter=chosenHero.filter;
 if(!hero&&e.enraged&&!dead)g.filter='saturate(1.7) hue-rotate(-18deg) brightness(1.08)';
 if(winding){g.translate(-5,0);if(Math.floor(frame/3)%2)g.filter='brightness(1.35) saturate(1.4)'}
 if(moving&&!dead)g.translate(0,Math.sin(visualClock*.24)*1.3);
 if(attacking&&!hurt)g.rotate((hero?.025:.015)*Math.sin((hero?player.attack:e.attack)*.18));
 const left=Math.round(-cellW*scale/2),sizeW=Math.round(cellW*scale),sizeH=Math.round(cellH*scale);
 g.drawImage(a.img,index*cellW,0,cellW,cellH,left,Math.round(footY),sizeW,sizeH);
 if(blend>.13&&blend<.87&&!dead&&!hurt&&st!=='attack'){
  const next=(index+1)%total,nb=a.bounds?.[next],ny=-(nb?.bottom+1||cellH)*scale+groundOffset;
  g.save();g.globalAlpha*=Math.min(.11,blend*(1-blend)*.45);
  g.drawImage(a.img,next*cellW,0,cellW,cellH,left,Math.round(ny),sizeW,sizeH);g.restore();
 }
 g.filter='none';
 if((hero||boss)&&e.attack>0&&e.attack<11){g.strokeStyle=hero?'#fbe9b8a8':'#ff795b99';g.lineWidth=5;g.beginPath();g.arc(25,-95,70,-1.15,.45);g.stroke()}
 g.restore();
 if(!hero&&e.stun>0){for(let i=0;i<3;i++)ellipse(x+Math.sin(i*2+frame*.1)*19,y-132+Math.cos(i*2+frame*.1)*9,3,3,'#ffb761')}
}
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
function spawnBurst(x,y,color,count=15){for(let i=0;i<count;i++)particles.push({x,y,vx:rnd(-5,5),vy:rnd(-6,1),life:rnd(12,29),color,size:rnd(2,6)})}
function floater(x,y,text,color='#ffe3a6',life=48,size=20){floaters.push({x,y,text,color,life,max:life,size})}
const attackers=()=>enemies.reduce((n,e)=>n+(e.type!==3&&e.hp>0&&(e.windup>0||e.attack>0)?1:0),0);

function attack(heavy=false,magic=false){
 if(state!=='playing'||player.stun>0||player.cool>0)return;
 if(magic){
  const cost=Math.round(35/chosenHero.magic);if(player.mana<cost)return;
  player.mana-=cost;player.attack=22;player.attackKind='heavy';player.cool=45;shake=14;hitstop=Math.max(hitstop,4);
  sfx('magic',.45);blip(460,.5,'triangle',.16);
  for(let i=0;i<75;i++){const a=rnd(-Math.PI,Math.PI),r=rnd(10,170);particles.push({x:player.x+Math.cos(a)*r*.55,y:player.y-60+Math.sin(a)*r*.35,vx:Math.cos(a)*rnd(2,11),vy:Math.sin(a)*rnd(2,7),life:rnd(20,45),color:i%2?'#98a6ff':'#ecd8ff',size:rnd(3,10)})}
  for(const e of enemies)if(e.hp>0&&Math.abs(e.x-player.x)<250&&Math.abs(e.y-player.y)<110)damage(e,Math.round(80*chosenHero.power*chosenHero.magic),player.x,true);
  return;
 }
 player.combo=(player.combo%3)+1;player.attack=heavy?22:14;player.attackKind=heavy?'heavy':'normal';
 player.cool=(heavy?32:19)*(3.55/chosenHero.speed);
 const reach=heavy?130:108,dmg=Math.round((heavy?44:player.combo===3?33:23)*chosenHero.power);
 blip(heavy?130:240,.14,'sawtooth',.09);sfx(heavy?'chop':'slash',.22);
 let impacted=false;
 for(const e of enemies){
  const d=(e.x-player.x)*player.face;
  if(e.hp>0&&d>-35&&d<reach&&Math.abs(e.y-player.y)<52){damage(e,dmg,player.x,heavy);impacted=true}
 }
 if(impacted){shake=Math.max(shake,heavy?9:5);hitstop=Math.max(hitstop,heavy?4:1.5);sfx(heavy?'heavy':'hit',.32)}
}
function damage(e,n,from,heavy=false){
 if(e.hp<=0)return;
 e.hp=Math.max(0,e.hp-n);
 // The boss shrugs off light hits (no stagger, no interrupt); heavy hits and magic break its wind-up.
 if(e.type!==3||heavy){e.stun=17;e.windup=0}
 e.x+=Math.sign(e.x-from||1)*(e.type===3?6:18);
 spawnBurst(e.x,e.y-80,e.type===3?'#ffba70':'#dca35c',17);
 player.chain++;player.chainTimer=CHAIN_WINDOW;maxChain=Math.max(maxChain,player.chain);
 const mult=multiplier();player.score+=5*mult;
 floater(e.x,e.y-150,String(n),heavy?'#ffd27a':'#fff0cf',40,heavy?26:20);
 if(!e.hp){
  sfx('death',.24);kills++;totalKills++;
  const pts=foe[e.type].pts*mult;player.score+=pts;
  floater(e.x,e.y-185,'+'+pts,'#ffe08a',70,24);
  player.mana=Math.min(100,player.mana+12);hitstop=Math.max(hitstop,e.type===3?12:3);
  if(Math.random()<.3)drops.push({x:e.x,y:e.y,type:Math.random()<.55?'heal':'mana',tick:0});
 }
}
function hurtPlayer(n){
 if(player.inv>0||player.dodge>0)return false;
 const dmg=Math.max(1,Math.round(n*chosenHero.defense));
 player.hp=Math.max(0,player.hp-dmg);player.stun=12;player.inv=35;player.chain=0;player.chainTimer=0;shake=Math.max(shake,11);
 spawnBurst(player.x,player.y-65,'#e65d47',20);sfx('hit',.34);blip(90,.23,'sawtooth',.18);
 floater(player.x,player.y-160,'-'+dmg,'#ff8c75',46,24);
 return true;
}
function enrage(e){
 e.enraged=true;e.windup=0;shake=22;banner={text:'THE CINDER WARDEN ENRAGES',sub:'HEAVY HITS BREAK HIS GUARD',t:150,max:150};
 rings.push({x:e.x,y:e.y,t:0,r:260,color:'#ff6a3c'});blip(70,.6,'sawtooth',.2);
}
function strike(e){
 const f=foe[e.type];
 e.attack=23;e.attackVariant=e.type===3&&Math.random()<(e.enraged?.55:.4);
 e.cd=rnd(f.cd[0],f.cd[1])*(e.enraged?.7:1);
 const dx=player.x-e.x,dy=player.y-e.y;
 const inRange=Math.abs(dx)<f.reach+22&&Math.abs(dy)<44&&dx*e.face>-20;
 if(inRange){
  if(player.dodge>0){player.mana=Math.min(100,player.mana+8);floater(player.x,player.y-165,'PERFECT DODGE','#9fd2ff',54,18)}
  else hurtPlayer(e.type===3?(e.enraged?22:f.dmg):f.dmg);
 }
 // Enraged boss slam: a shockwave ring that can only be avoided by dodging through it.
 if(e.type===3&&e.enraged&&e.attackVariant){
  rings.push({x:e.x,y:e.y,t:0,r:170,color:'#ff9a4d'});shake=Math.max(shake,12);
  if(Math.abs(dx)<170&&Math.abs(dy)<60){
   if(player.dodge>0){player.mana=Math.min(100,player.mana+8);floater(player.x,player.y-165,'PERFECT DODGE','#9fd2ff',54,18)}
   else hurtPlayer(12);
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
 }else if(Math.abs(dx)<420){
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
 if(state!=='playing'||player.dodge>0||player.dodgeCool>0||player.stun>0)return;
 player.dodge=15;player.inv=Math.max(player.inv,17);player.dodgeCool=DODGE_TOTAL;blip(350,.12,'triangle');
}

// ---------- Update ----------
function stageBonus(){
 const hp=Math.round(player.hp)*5,time=Math.max(0,Math.round((PAR_FRAMES-clock)/8));
 return {hp,time};
}
const fmtTime=f=>{const s=Math.floor(f/60);return Math.floor(s/60)+':'+String(s%60).padStart(2,'0')};
function update(dt){
 if(state!=='playing')return;
 soundtrack();
 if(hitstop>0){hitstop-=dt;return}
 clock+=dt;runTime+=dt;frame+=dt;
 for(const k of ['stun','inv','dodge','dodgeCool','cool','attack'])player[k]=Math.max(0,player[k]-dt);
 player.anim+=dt;
 if(player.chainTimer>0){player.chainTimer-=dt;if(player.chainTimer<=0)player.chain=0}
 if(banner){banner.t-=dt;if(banner.t<=0)banner=null}
 let mx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),
     my=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);
 const gp=navigator.getGamepads?.()[0];
 if(gp){
  mx+=Math.abs(gp.axes[0])>.2?gp.axes[0]:0;my+=Math.abs(gp.axes[1])>.2?gp.axes[1]:0;
  for(let i=0;i<4;i++){const b=gp.buttons[i]?.pressed||false;if(b&&!gpLast[i])i===0?attack():i===2?attack(true):i===1?attack(false,true):dodge();gpLast[i]=b}
  if(gp.buttons[14]?.pressed)mx=-1;if(gp.buttons[15]?.pressed)mx=1;if(gp.buttons[12]?.pressed)my=-1;if(gp.buttons[13]?.pressed)my=1;
 }
 player.moving=!!(mx||my);
 if(player.stun<=0){
  const speed=player.dodge>0?chosenHero.speed*2.15:chosenHero.speed;
  player.x+=clamp(mx,-1,1)*speed*dt;player.y+=clamp(my,-1,1)*speed*.75*dt;
  if(mx)player.face=mx>0?1:-1;
 }
 player.x=clamp(player.x,30,world-36);player.y=clamp(player.y,413,550);
 camera+=(clamp(player.x-355,0,world-W)-camera)*Math.min(.12*dt,1);
 for(const e of enemies)enemyAI(e,dt);
 for(const p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.15*dt;p.life-=dt}
 particles=particles.filter(p=>p.life>0);
 for(const f of floaters){f.y-=.55*dt;f.life-=dt}floaters=floaters.filter(f=>f.life>0);
 for(const r of rings)r.t+=dt;rings=rings.filter(r=>r.t<34);
 for(const d of drops){
  d.tick+=dt;
  if(Math.abs(d.x-player.x)<36&&Math.abs(d.y-player.y)<36){
   if(d.type==='heal')player.hp=Math.min(100,player.hp+24);else player.mana=Math.min(100,player.mana+28);
   d.gone=true;sfx('pickup',.25);blip(660,.3,'sine');
  }
 }
 drops=drops.filter(d=>!d.gone);shake*=Math.pow(.84,dt);
 if(player.hp<=0){end(false);return}
 if(enemies.every(e=>e.hp<=0)&&player.x>world-400){
  const b=stageBonus(),cleared=level;player.score+=b.hp+b.time;
  if(level===2){end(true,b);return}
  reset(level+1);state='interlude';
  title.textContent=stages[level].name;
  message.textContent=stages[cleared].name+' CLEARED · HP BONUS +'+b.hp+' · TIME BONUS +'+b.time+'. '+stages[level].sub+' — THE CROWN DRAWS NEARER.';
  start.textContent='CONTINUE THE QUEST';O.hidden=false;
 }
}
function end(win,bonus){
 state='end';O.hidden=false;
 const stats=' Score: '+player.score+' · Foes felled: '+totalKills+' · Best chain: '+maxChain+' · Time: '+fmtTime(runTime);
 title.textContent=win?'THE CROWN IS YOURS':'THE REALM REMEMBERS';
 message.textContent=(win?'The Cinder King has fallen. You are the last light of the Ashen Realms.'+(bonus?' Final stage bonus +'+(bonus.hp+bonus.time)+'.':''):'Your quest ends beneath the ashes. The fallen await a champion.')+stats;
 start.textContent=win?'PLAY AGAIN':'RISE AGAIN';
}

// ---------- Render ----------
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
 const boss=enemies.find(e=>e.type===3&&e.hp>0&&e.x-player.x<530);
 if(boss){
  g.fillStyle='#1c1021e6';g.fillRect(W/2-215,H-54,430,34);g.fillStyle=boss.enraged?'#e2452c':'#b64c3b';g.fillRect(W/2-207,H-44,414*boss.hp/boss.max,11);
  g.fillStyle='#e7c49a';g.font='bold 13px Cinzel';g.textAlign='center';g.fillText(boss.enraged?'THE CINDER WARDEN · ENRAGED':'THE CINDER WARDEN',W/2,H-27);g.textAlign='left';
 }
 if(enemies.every(e=>e.hp<=0)){g.textAlign='center';g.font='bold 28px Cinzel';g.fillStyle='#ffdd97';g.fillText('THE WAY IS CLEAR — ADVANCE →',W/2,135);g.textAlign='left'}
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
 g.save();if(shake>1)g.translate(rnd(-shake,shake),rnd(-shake,shake));
 backdrop();
 for(const d of drops){
  const x=d.x-camera;ellipse(x,d.y-14+Math.sin(d.tick*.1)*4,13,13,d.type==='heal'?'#9cda77':'#9c9ef7');
  g.fillStyle='#18252a';g.font='bold 18px Arial';g.textAlign='center';g.fillText(d.type==='heal'?'+':'✦',x+1,d.y-8);g.textAlign='left';
 }
 for(const r of rings){
  const p=r.t/34;g.save();g.globalAlpha=(1-p)*.8;g.strokeStyle=r.color;g.lineWidth=6*(1-p)+1;
  g.beginPath();g.ellipse(r.x-camera,r.y,r.r*p,r.r*p*.28,0,0,Math.PI*2);g.stroke();g.restore();
 }
 const entities=[...enemies.filter(e=>e.dead<80),player].sort((a,b)=>a.y-b.y);
 for(const e of entities){
  if(e===player)sprite(e,true);else sprite(e);
  if(e!==player&&e.hp>0&&e.hp<e.max){g.fillStyle='#190d14';g.fillRect(e.x-camera-28,e.y-159,56,5);g.fillStyle='#d75b42';g.fillRect(e.x-camera-28,e.y-159,56*e.hp/e.max,5)}
  if(e!==player&&e.hp>0&&e.windup>0)telegraph(e);
 }
 if(player.attack>0&&sheetsLoaded>=sheetsExpected){
  const x=player.x-camera,y=player.y-83;g.save();g.translate(x,y);g.scale(player.face,1);
  g.strokeStyle='#fff6d4aa';g.lineWidth=7;g.beginPath();g.arc(15,-6,85,-.9,.65);g.stroke();
  g.strokeStyle='#f8bd6688';g.lineWidth=13;g.stroke();g.restore();
 }
 for(const p of particles){g.globalAlpha=Math.min(1,p.life/17);ellipse(p.x-camera,p.y,p.size,p.size*.8,p.color)}
 g.globalAlpha=1;
 if(window.drawAshenForeground)window.drawAshenForeground(g,level,camera,frame,W,H,player.x-camera);
 for(const f of floaters){
  g.save();g.globalAlpha=Math.min(1,f.life/(f.max*.4));g.textAlign='center';g.font='bold '+f.size+'px Cinzel,Georgia,serif';
  g.lineWidth=4;g.strokeStyle='#150b0c';g.strokeText(f.text,f.x-camera,f.y);g.fillStyle=f.color;g.fillText(f.text,f.x-camera,f.y);g.restore();
 }
 g.restore();
 if(state==='playing'||state==='paused')hud();
 if(state==='paused'){
  g.fillStyle='#0a0d18b6';g.fillRect(0,0,W,H);g.textAlign='center';g.fillStyle='#f9dcac';g.font='bold 52px Cinzel';g.fillText('PAUSED',W/2,H/2);
  g.font='20px Arial';g.fillText('PRESS P TO RESUME',W/2,H/2+40);g.textAlign='left';
 }
}

// ---------- Menus, input and main loop ----------
let menuPadCool=0,menuPadPrevConfirm=false,menuPadPrevBack=false;
function handleMenuPad(t){
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
 handleMenuPad(t);window.ASHEN_AUDIO?.update(level,state);update(dt);render();requestAnimationFrame(loop);
}
function paintPortraits(){
 if(!choiceCards)return;
 choiceCards.querySelectorAll('[data-preview]').forEach(cv=>{
  const hero=heroes[+cv.dataset.preview],entry=sheetCache[hero.pack]?.idle,ctx=cv.getContext('2d');
  ctx.clearRect(0,0,cv.width,cv.height);
  if(!entry?.ready)return;
  const fw=entry.img.width/entry.frames,fh=entry.img.height,b=entry.bounds?.[0];
  const visibleHeight=(b?.bottom??fh)-(b?.top??0)+1,scale=Math.min(2.2,140/visibleHeight);
  ctx.imageSmoothingEnabled=false;ctx.filter=hero.filter;
  ctx.drawImage(entry.img,0,0,fw,fh,Math.round(cv.width/2-fw*scale/2),Math.round(cv.height-12-(b?.bottom??fh)*scale),Math.round(fw*scale),Math.round(fh*scale));ctx.filter='none';
 });
}
function showCharacterSelect(){state='select';O.hidden=true;choicePanel.hidden=false;setHeroChoice(selectedHero)}
function backToTitle(){choicePanel.hidden=true;O.hidden=false;state='menu'}
function setHeroChoice(i){
 selectedHero=(i+heroes.length)%heroes.length;
 choiceCards.querySelectorAll('[data-hero]').forEach((b,j)=>{const active=j===selectedHero;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active?'true':'false')});
 $('#selectedBio').textContent=heroes[selectedHero].bio;paintPortraits();
}
function beginSelectedGame(){chosenHero=heroes[selectedHero];choicePanel.hidden=true;reset(0);startPlaying()}
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
start.addEventListener('click',play);
window.addEventListener('keydown',e=>{
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Space'].includes(e.code))e.preventDefault();
 if(state==='select'){
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
 }
 keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
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
 window.ASHEN2_DEBUG={get state(){return state},set state(v){state=v},get level(){return level},get enemies(){return enemies},get hitstop(){return hitstop},get banner(){return banner},get maxChain(){return maxChain},player,heroes,foe,reset,attack,damage,dodge,enemyAI,hurtPlayer,update,render,end,loop,beginSelectedGame,attackers,get floaters(){return floaters},get rings(){return rings}};
}
reset();state='menu';paintPortraits();requestAnimationFrame(loop);
})();
