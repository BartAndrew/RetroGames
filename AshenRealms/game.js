(()=>{'use strict';
const C=document.querySelector('#game'),g=C.getContext('2d'),W=1152,H=648,O=document.querySelector('#overlay'),title=document.querySelector('#menuTitle'),message=document.querySelector('#menuText'),start=document.querySelector('#start');let state='menu',level=0,clock=0,frame=0,shake=0,camera=0,kills=0,particles=[],enemies=[],drops=[],sparks=[],keys=new Set(),pressed=new Set(),gpLast=[],music=null,last=0;
const stages=[{name:'THE BURNING MARCH',sub:'THE FRONTIER HAS FALLEN',sky:['#161c38','#904a42','#e49a61'],hill:'#282b42',ground:'#433e3b',theme:0},{name:'THE FORGOTTEN WOODS',sub:'THE OLD GODS ARE WATCHING',sky:['#101d2b','#395c56','#a08e63'],hill:'#233e37',ground:'#303e39',theme:1},{name:'THE CINDER THRONE',sub:'THE FINAL RECKONING',sky:['#120e21','#552a3e','#c15539'],hill:'#39263a',ground:'#3c3037',theme:2}],world=2500;
const heroes=[
{id:'warden',name:'IRON WARDEN',role:'Knight · Balanced',pack:'hero',filter:'none',power:1,speed:3.55,defense:1,magic:1,stats:[7,6,7,5],bio:'A veteran knight with balanced swordplay and dependable armour.'},
{id:'berserker',name:'ASH BERSERKER',role:'Champion · Heavy',pack:'boss',filter:'sepia(.22) saturate(1.35)',power:1.42,speed:2.85,defense:.82,magic:.8,stats:[10,4,8,3],bio:'Devastating blows and heavy armour at the cost of speed.'},
{id:'moonblade',name:'MOONBLADE',role:'Spellblade · Swift',pack:'hero',filter:'hue-rotate(92deg) saturate(1.5) brightness(1.15)',power:.82,speed:4.65,defense:1.25,magic:1.5,stats:[6,10,4,10],bio:'An agile spellblade whose strong magic offsets light armour.'}
];let selectedHero=0,chosenHero=heroes[0],previewTime=0,menuGamepad=false;
const player={x:120,y:485,hp:100,max:100,mana:100,face:1,attack:0,attackKind:'normal',combo:0,cool:0,stun:0,inv:0,dodge:0,anim:0,score:0};
const rnd=(a,b)=>a+Math.random()*(b-a),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function reset(l=0){level=l;clock=0;frame=0;camera=0;kills=0;enemies=[];drops=[];particles=[];sparks=[];Object.assign(player,{x:120,y:480,hp:l===0?100:Math.min(100,player.hp+28),mana:100,face:1,attack:0,attackKind:'normal',combo:0,cool:0,stun:0,inv:0,dodge:0,anim:0});for(let i=0;i<12+l*3;i++)enemies.push({x:350+i*145+rnd(-30,30),y:rnd(410,535),type:i%5===0?2:i%3===0?1:0,hp:i%5===0?100:i%3===0?62:43,max:i%5===0?100:i%3===0?62:43,face:-1,stun:0,attack:0,cd:rnd(20,100),dead:0,walk:rnd(0,6)});enemies.push({x:world-210,y:473,type:3,hp:360,max:360,face:-1,stun:0,attack:0,cd:70,dead:0,walk:0});}
const src='https://raw.githubusercontent.com/GeorgeQLe/assets-sfx-combat/main/assets/kenney/';
const sounds={hit:src+'impact-sounds/Audio/impactGeneric_light_001.ogg',heavy:src+'impact-sounds/Audio/impactBell_heavy_002.ogg',slash:src+'rpg-audio/Audio/drawKnife1.ogg',chop:src+'rpg-audio/Audio/chop.ogg',step:src+'rpg-audio/Audio/footstep00.ogg'};
let audioCtx=null;let nextBeat=0,beatIndex=0;const notes=[110,146.83,164.81,146.83,98,130.81,146.83,130.81];function soundtrack(){if(state!=='playing')return;try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();if(audioCtx.state==='suspended')return;const now=audioCtx.currentTime;if(nextBeat<now)nextBeat=now;let n=0;while(nextBeat<now+.18&&n++<4){let note=notes[(beatIndex+level*2)%notes.length],osc=audioCtx.createOscillator(),gain=audioCtx.createGain(),filter=audioCtx.createBiquadFilter();osc.type=beatIndex%4===0?'sawtooth':'triangle';osc.frequency.value=note;filter.type='lowpass';filter.frequency.value=430;gain.gain.setValueAtTime(.0001,nextBeat);gain.gain.exponentialRampToValueAtTime(.026,nextBeat+.02);gain.gain.exponentialRampToValueAtTime(.0001,nextBeat+.27);osc.connect(filter).connect(gain).connect(audioCtx.destination);osc.start(nextBeat);osc.stop(nextBeat+.28);if(beatIndex%4===0){let low=audioCtx.createOscillator(),lg=audioCtx.createGain();low.type='sine';low.frequency.setValueAtTime(78,nextBeat);low.frequency.exponentialRampToValueAtTime(42,nextBeat+.18);lg.gain.setValueAtTime(.09,nextBeat);lg.gain.exponentialRampToValueAtTime(.0001,nextBeat+.21);low.connect(lg).connect(audioCtx.destination);low.start(nextBeat);low.stop(nextBeat+.22)}nextBeat+=.32;beatIndex++}}catch{}}function sfx(id,vol=.45){const u=sounds[id];if(!u)return;try{const a=new Audio(u);a.volume=vol;a.play().catch(()=>{});}catch{}}
function blip(freq=190,dur=.15,kind='sawtooth',vol=.09){try{audioCtx ||= new (window.AudioContext||window.webkitAudioContext)();let o=audioCtx.createOscillator(),gain=audioCtx.createGain();o.type=kind;o.frequency.setValueAtTime(freq,audioCtx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.46),audioCtx.currentTime+dur);gain.gain.setValueAtTime(vol,audioCtx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,audioCtx.currentTime+dur);o.connect(gain).connect(audioCtx.destination);o.start();o.stop(audioCtx.currentTime+dur)}catch{}}
function path(points,col,stroke=null,lw=1){g.beginPath();points.forEach((p,i)=>i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1]));g.closePath();g.fillStyle=col;g.fill();if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function line(x1,y1,x2,y2,col,w=2){g.strokeStyle=col;g.lineWidth=w;g.beginPath();g.moveTo(x1,y1);g.lineTo(x2,y2);g.stroke()}
function ellipse(x,y,rx,ry,col){g.fillStyle=col;g.beginPath();g.ellipse(x,y,rx,ry,0,0,Math.PI*2);g.fill()}
function polygonMountain(base,color,offset,amplitude,scale){g.fillStyle=color;g.beginPath();g.moveTo(0,H);for(let x=0;x<=W+20;x+=8){let xx=(x+offset)*scale;g.lineTo(x,base+Math.sin(xx*.006)*amplitude+Math.sin(xx*.013+1.7)*amplitude*.45+Math.sin(xx*.027)*amplitude*.22)}g.lineTo(W,H);g.fill()}
function backdrop(){if(window.drawAshenBackdrop?.(g,level,camera,frame,W,H))return;let s=stages[level],sky=g.createLinearGradient(0,0,0,H);sky.addColorStop(0,s.sky[0]);sky.addColorStop(.63,s.sky[1]);sky.addColorStop(1,s.sky[2]);g.fillStyle=sky;g.fillRect(0,0,W,H);ellipse(945-camera*.017%130,120,56,56,level===1?'#d6d7ac88':'#ffddad65');for(let i=0;i<50;i++){let x=((i*187+69-camera*.08)% (W+200)+(W+200))%(W+200)-80,y=40+(i*83)%340;ellipse(x,y,1+i%3,1+i%3,'#f9d5ac25')}
polygonMountain(331,'#211e35a8',camera*.12,80,.9);polygonMountain(398,s.hill,camera*.25,72,.9);
for(let i=0;i<17;i++){let x=i*168-camera*.46%168-200,y=390+Math.sin(i*6)*20;if(level===1){line(x,y,x-12,y+150,'#172e29',13);for(let q=0;q<3;q++)ellipse(x+(q-1)*25,y-20-q*25,50,70,'#183a33')}else{path([[x-20,y+70],[x-14,y-80],[x+12,y-110],[x+22,y+70]],'#211e2da9');path([[x-36,y-70],[x,y-135],[x+33,y-70]],'#2c2334');for(let j=0;j<4;j++)line(x-13+j*7,y-32,x-13+j*7,y-20,'#d8a86f48',2);}}
let floor=g.createLinearGradient(0,410,0,H);floor.addColorStop(0,s.ground);floor.addColorStop(1,'#111723');g.fillStyle=floor;g.fillRect(0,423,W,H);for(let i=0;i<100;i++){let x=((i*149-camera*.85)%(W+180)+(W+180))%(W+180)-90,y=436+(i*91)%220;line(x,y,x+12+(i%4)*8,y+(i%3)*2,'#a79a7550',1.5)}
for(let i=0;i<24;i++){let x=((i*109-camera*.9)%(W+200)+(W+200))%(W+200)-40,y=410+i%4*63;ellipse(x,y,9,3,'#b4855438')}
if(level===0||level===2)for(let i=0;i<13;i++){let x=((i*237-camera*.58)%(W+300)+(W+300))%(W+300)-130,y=363+i%3*23;ellipse(x,y,12,35,'#e5804344');ellipse(x,y-10,5,21,'#f2bd6b77')}
g.fillStyle='#060a0e66';g.fillRect(0,0,W,25);g.fillRect(0,H-21,W,21);
}
// All sprites are CC0 PNG strips bundled as data URIs for stable, self-contained Vercel delivery.
const sheetPacks={hero:window.ASHEN_HERO,boss:window.ASHEN_BOSS,...window.ASHEN_MONSTERS};
const sheetCache={};let sheetsLoaded=0,sheetsExpected=0;
for(const [character,animations] of Object.entries(sheetPacks)){
 sheetCache[character]={};
 for(const [state,info] of Object.entries(animations)){
  sheetsExpected++;
  const img=new Image();
  const entry={...info,img,ready:false};
  sheetCache[character][state]=entry;
  img.onload=()=>{
  // Character sources include large transparent margins. A foot-anchor per animation FRAME removes floating.
  try{
   const off=document.createElement('canvas');off.width=img.naturalWidth;off.height=img.naturalHeight;
   const ctx=off.getContext('2d',{willReadFrequently:true});ctx.drawImage(img,0,0);
   const {data}=ctx.getImageData(0,0,off.width,off.height),fw=Math.round(off.width/info.frames);
   entry.bounds=[];
   for(let i=0;i<info.frames;i++){
    let minX=fw,maxX=0,minY=off.height,maxY=0;
    for(let y=0;y<off.height;y++)for(let x=0;x<fw;x++){
      const alpha=data[((y*off.width)+(i*fw+x))*4+3];
      if(alpha>70){minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y)}
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
 const dead=!hero&&e.hp<=0;
 const hurt=!hero?e.stun>0:player.stun>0;
 const attacking=e.attack>0;
 const moving=hero?!!e.moving:!!e.moving;
 const requested=dead?'death':hurt?'hurt':attacking?(hero&&player.attackKind==='heavy'||boss&&e.type===3?'heavy':'attack'):moving?'walk':'idle';
 const state=pack[requested]?.ready?requested:'idle';
 const a=pack[state];if(!a?.ready)return;
 const total=a.frames,rate=a.fps||10;
 let index;
 if(state==='death')index=Math.min(total-1,Math.floor(e.dead*rate/60));
 else if(state==='hurt')index=Math.min(total-1,Math.floor((17-e.stun)*rate/60));
 else if(state==='attack'||state==='heavy'){
  const duration=hero?(player.attackKind==='heavy'?22:14):23;
  index=Math.min(total-1,Math.max(0,Math.floor((duration-e.attack)/duration*total)));
 }else index=Math.floor((hero?player.anim:e.walk)*rate/60)%total;
 const cellW=a.img.naturalWidth/total,cellH=a.img.naturalHeight;
 const scale=hero?(chosenHero.pack==='boss'?2.65:2.8):boss?3.1:e.type===1?2.7:e.type===2?2.7:2.7;
 const x=e.x-camera,y=e.y;
 g.save();g.translate(Math.round(x),Math.round(y));
 g.fillStyle='#04080ab0';g.beginPath();g.ellipse(0,4,boss?46:hero?34:28,boss?11:7,0,0,Math.PI*2);g.fill();
 if((hero&&e.inv>0&&Math.floor(frame/4)%2))g.globalAlpha=.5;
 if(dead)g.globalAlpha=Math.max(0,1-e.dead/80);
 g.scale(e.face||1,1);
 g.imageSmoothingEnabled=false;
 // Pixel-perfect frame-by-frame grounding: compute the bottommost visible pixels, not the transparent sheet boundary.
 // The shadow stays on the collision plane; art feet are precisely anchored to it even during attacks.
 const bounds=a.bounds?.[index]||{bottom:cellH-1,left:0,right:cellW-1,top:0};
 const groundOffset=boss?2:hero?1:0;
 const footY=-(bounds.bottom+1)*scale+groundOffset;
 if(hero&&chosenHero.filter!=='none')g.filter=chosenHero.filter;
 g.drawImage(a.img,index*cellW,0,cellW,cellH,Math.round(-cellW*scale/2),Math.round(footY),Math.round(cellW*scale),Math.round(cellH*scale));
 g.filter='none';
 if((hero||boss)&&e.attack>0&&e.attack<11){g.strokeStyle=hero?'#fbe9b8a8':'#ff795b99';g.lineWidth=5;g.beginPath();g.arc(25,-95,70,-1.15,.45);g.stroke();}
 g.restore();
 if(!hero&&e.stun>0){for(let i=0;i<3;i++)ellipse(x+Math.sin(i*2+frame*.1)*19,y-132+Math.cos(i*2+frame*.1)*9,3,3,'#ffb761')}
}
function spawnBurst(x,y,color,count=15){for(let i=0;i<count;i++)particles.push({x,y,vx:rnd(-5,5),vy:rnd(-6,1),life:rnd(12,29),color,size:rnd(2,6)})}
function attack(heavy=false,magic=false){if(state!=='playing'||player.stun>0||player.cool>0)return;if(magic){if(player.mana<Math.round(35/chosenHero.magic))return;player.mana-=Math.round(35/chosenHero.magic);player.attack=22;player.attackKind='heavy';player.cool=45;shake=14;blip(460,.5,'triangle',.16);for(let i=0;i<75;i++){let a=rnd(-Math.PI,Math.PI),r=rnd(10,170);particles.push({x:player.x+Math.cos(a)*r*.55,y:player.y-60+Math.sin(a)*r*.35,vx:Math.cos(a)*rnd(2,11),vy:Math.sin(a)*rnd(2,7),life:rnd(20,45),color:i%2?'#98a6ff':'#ecd8ff',size:rnd(3,10)})}for(let e of enemies)if(e.hp>0&&Math.abs(e.x-player.x)<250&&Math.abs(e.y-player.y)<110)damage(e,Math.round(80*chosenHero.power*chosenHero.magic),player.x);return}
player.combo=(player.combo%3)+1;player.attack=heavy?22:14;player.attackKind=heavy?'heavy':'normal';player.cool=(heavy?32:19)*(3.55/chosenHero.speed);let reach=heavy?130:108,dmg=Math.round((heavy?44:player.combo===3?33:23)*chosenHero.power);blip(heavy?130:240,.14,'sawtooth',.09);sfx(heavy?'chop':'slash',.22);let impacted=false;for(let e of enemies)if(e.hp>0&&(e.x-player.x)*player.face>-35&&(e.x-player.x)*player.face<reach&&Math.abs(e.y-player.y)<52){damage(e,dmg,player.x);impacted=true}if(impacted){shake=heavy?9:5;sfx(heavy?'heavy':'hit',.32)}}
function damage(e,n,from){e.hp=Math.max(0,e.hp-n);e.stun=17;e.x+=Math.sign(e.x-from||1)*18;spawnBurst(e.x,e.y-80,e.type===3?'#ffba70':'#dca35c',17);if(!e.hp){kills++;player.score+=e.type===3?1500:100;player.mana=Math.min(100,player.mana+12);if(Math.random()<.3)drops.push({x:e.x,y:e.y,type:Math.random()<.55?'heal':'mana',tick:0});}}
function enemyAI(e,dt){if(e.hp<=0){e.dead=Math.min(85,e.dead+dt);return}e.stun=Math.max(0,e.stun-dt);e.cd-=dt;e.attack=Math.max(0,e.attack-dt);e.walk+=dt;e.moving=false;if(e.stun>0)return;let dx=player.x-e.x,dy=player.y-e.y;e.face=dx>=0?1:-1;let near=Math.abs(dx)<(e.type===3?115:72)&&Math.abs(dy)<37;if(near){if(e.cd<=0&&player.inv<=0){e.attack=23;e.cd=e.type===3?86:rnd(65,105);if(player.dodge<=0){player.hp=Math.max(0,player.hp-Math.round((e.type===3?19:9)*chosenHero.defense));player.stun=12;player.inv=35;shake=11;spawnBurst(player.x,player.y-65,'#e65d47',20);sfx('hit',.34);blip(90,.23,'sawtooth',.18)}}}else if(Math.abs(dx)<420){e.moving=true;e.x+=Math.sign(dx)*(.62+(e.type===1?.19:0))*dt;e.y+=Math.sign(dy)*Math.min(1.05,Math.abs(dy)*.025)*dt;}e.x=clamp(e.x,30,world-25);e.y=clamp(e.y,415,550)}
function update(dt){if(state!=='playing')return;soundtrack();clock+=dt;frame+=dt;player.stun=Math.max(0,player.stun-dt);player.inv=Math.max(0,player.inv-dt);player.dodge=Math.max(0,player.dodge-dt);player.cool=Math.max(0,player.cool-dt);player.attack=Math.max(0,player.attack-dt);player.anim+=dt;let mx=(keys.has('ArrowRight')||keys.has('KeyD')?1:0)-(keys.has('ArrowLeft')||keys.has('KeyA')?1:0),my=(keys.has('ArrowDown')||keys.has('KeyS')?1:0)-(keys.has('ArrowUp')||keys.has('KeyW')?1:0);const gp=navigator.getGamepads?.()[0];if(gp){mx+=Math.abs(gp.axes[0])>.2?gp.axes[0]:0;my+=Math.abs(gp.axes[1])>.2?gp.axes[1]:0;for(let i=0;i<4;i++){let b=gp.buttons[i]?.pressed||false;if(b&&!gpLast[i])i===0?attack():i===2?attack(true):i===1?attack(false,true):dodge();gpLast[i]=b;}if(gp.buttons[14]?.pressed)mx=-1;if(gp.buttons[15]?.pressed)mx=1;if(gp.buttons[12]?.pressed)my=-1;if(gp.buttons[13]?.pressed)my=1}
player.moving=!!(mx||my);if(player.stun<=0){let speed=player.dodge>0?chosenHero.speed*2.15:chosenHero.speed;player.x+=clamp(mx,-1,1)*speed*dt;player.y+=clamp(my,-1,1)*speed*.75*dt;if(mx)player.face=mx>0?1:-1}player.x=clamp(player.x,30,world-36);player.y=clamp(player.y,413,550);camera+=(clamp(player.x-355,0,world-W)-camera)*Math.min(.12*dt,1);
for(let e of enemies)enemyAI(e,dt);for(let p of particles){p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=.15*dt;p.life-=dt}particles=particles.filter(p=>p.life>0);for(let d of drops){d.tick+=dt;if(Math.abs(d.x-player.x)<36&&Math.abs(d.y-player.y)<36){if(d.type==='heal')player.hp=Math.min(100,player.hp+24);else player.mana=Math.min(100,player.mana+28);d.gone=true;blip(660,.3,'sine')}}drops=drops.filter(d=>!d.gone);shake*=Math.pow(.84,dt);
if(player.hp<=0){end(false);return}if(enemies.every(e=>e.hp<=0)&&player.x>world-400){if(level===2)end(true);else{reset(level+1);state='interlude';title.textContent=stages[level].name;message.textContent=stages[level].sub+' — THE CROWN DRAWS NEARER.';start.textContent='CONTINUE THE QUEST';O.hidden=false}}}
function dodge(){if(player.dodge||player.stun>0)return;player.dodge=15;player.inv=17;blip(350,.12,'triangle')}
function end(win){state='end';O.hidden=false;title.textContent=win?'THE CROWN IS YOURS':'THE REALM REMEMBERS';message.textContent=win?'The Cinder King has fallen. You are the last light of the Ashen Realms. Final score: '+player.score:'Your quest ends beneath the ashes. The fallen await a champion. Score: '+player.score;start.textContent=win?'PLAY AGAIN':'RISE AGAIN'}
function hud(){g.fillStyle='#0b101bdd';g.fillRect(22,23,366,95);g.strokeStyle='#94734d';g.lineWidth=2;g.strokeRect(22,23,366,95);g.fillStyle='#f6d7a1';g.font='bold 20px Cinzel,serif';g.fillText(chosenHero.name,37,49);g.fillStyle='#282431';g.fillRect(37,58,290,16);g.fillStyle='#b5453b';g.fillRect(39,60,286*player.hp/100,12);g.fillStyle='#282431';g.fillRect(37,82,290,12);g.fillStyle='#6989d9';g.fillRect(39,84,286*player.mana/100,8);g.fillStyle='#f9e1bd';g.font='16px Barlow Condensed,Arial';g.fillText('HP',336,72);g.fillText('MP',336,94);g.textAlign='right';g.font='bold 22px Cinzel,serif';g.fillStyle='#f7d5a0';g.fillText(stages[level].name,W-25,48);g.font='17px Arial';g.fillText('SCORE '+player.score+'   •   '+(enemies.filter(e=>e.hp>0).length)+' FOES',W-25,75);g.textAlign='left';let boss=enemies.find(e=>e.type===3&&e.hp>0&&e.x-player.x<530);if(boss){g.fillStyle='#1c1021e6';g.fillRect(W/2-215,H-54,430,34);g.fillStyle='#b64c3b';g.fillRect(W/2-207,H-44,414*boss.hp/boss.max,11);g.fillStyle='#e7c49a';g.font='bold 13px Cinzel';g.textAlign='center';g.fillText('THE CINDER WARDEN',W/2,H-27);g.textAlign='left'}if(enemies.filter(e=>e.hp>0).length===0){g.textAlign='center';g.font='bold 28px Cinzel';g.fillStyle='#ffdd97';g.fillText('THE WAY IS CLEAR — ADVANCE →',W/2,135);g.textAlign='left'}}
function render(){g.save();if(shake>1)g.translate(rnd(-shake,shake),rnd(-shake,shake));backdrop();for(let d of drops){let x=d.x-camera;ellipse(x,d.y-14+Math.sin(d.tick*.1)*4,13,13,d.type==='heal'?'#9cda77':'#9c9ef7');g.fillStyle='#18252a';g.font='bold 18px Arial';g.textAlign='center';g.fillText(d.type==='heal'?'+':'✦',x+1,d.y-8);g.textAlign='left'}
let entities=[...enemies.filter(e=>e.dead<80),player].sort((a,b)=>a.y-b.y);for(let e of entities){if(e===player)sprite(e,true);else sprite(e);if(e!==player&&e.hp>0&&e.hp<e.max){g.fillStyle='#190d14';g.fillRect(e.x-camera-28,e.y-159,56,5);g.fillStyle='#d75b42';g.fillRect(e.x-camera-28,e.y-159,56*e.hp/e.max,5)}}
if(player.attack>0&&sheetsLoaded>=sheetsExpected){let x=player.x-camera,y=player.y-83;g.save();g.translate(x,y);g.scale(player.face,1);g.strokeStyle='#fff6d4aa';g.lineWidth=7;g.beginPath();g.arc(15,-6,85,-.9,.65);g.stroke();g.strokeStyle='#f8bd6688';g.lineWidth=13;g.stroke();g.restore()}
for(let p of particles){g.globalAlpha=Math.min(1,p.life/17);ellipse(p.x-camera,p.y,p.size,p.size*.8,p.color)}g.globalAlpha=1;g.restore();if(state==='playing')hud();if(state==='paused'){g.fillStyle='#0a0d18b6';g.fillRect(0,0,W,H);g.textAlign='center';g.fillStyle='#f9dcac';g.font='bold 52px Cinzel';g.fillText('PAUSED',W/2,H/2);g.font='20px Arial';g.fillText('PRESS P TO RESUME',W/2,H/2+40);g.textAlign='left'}}
let menuPadCool=0,menuPadPrevConfirm=false,menuPadPrevBack=false;
function handleMenuPad(t){
 if(state!=='select')return;
 const gp=navigator.getGamepads?.()[0];if(!gp)return;
 const left=gp.buttons[14]?.pressed||gp.axes[0]<-.65;
 const right=gp.buttons[15]?.pressed||gp.axes[0]>.65;
 if(t>menuPadCool&&(left||right)){setHeroChoice(selectedHero+(right?1:-1));menuPadCool=t+240}
 const confirm=gp.buttons[0]?.pressed;
 const back=gp.buttons[1]?.pressed;
 if(confirm&&!menuPadPrevConfirm)beginSelectedGame();
 if(back&&!menuPadPrevBack){choicePanel.hidden=true;O.hidden=false;state='menu'}
 menuPadPrevConfirm=confirm;menuPadPrevBack=back;
}
function loop(t){previewTime=t;let dt=Math.min(2.5,(t-last)/16.667||1);last=t;handleMenuPad(t);update(dt);render();requestAnimationFrame(loop)}

const choicePanel=document.querySelector('#characterSelect');
const choiceCards=document.querySelector('#heroCards');
const chooseButton=document.querySelector('#confirmHero');
const backButton=document.querySelector('#backToTitle');
function paintPortraits(){
 if(!choiceCards)return;
 choiceCards.querySelectorAll('[data-preview]').forEach((cv)=>{
  const idx=+cv.dataset.preview, hero=heroes[idx],entry=sheetCache[hero.pack]?.idle;
  const ctx=cv.getContext('2d');ctx.clearRect(0,0,cv.width,cv.height);
  if(!entry?.ready)return;
  const fw=entry.img.width/entry.frames,fh=entry.img.height,b=entry.bounds?.[0];
  const visibleHeight=(b?.bottom??fh)-(b?.top??0)+1,scale=Math.min(2.2,140/visibleHeight);
  ctx.imageSmoothingEnabled=false;ctx.filter=hero.filter;
  ctx.drawImage(entry.img,0,0,fw,fh,Math.round(cv.width/2-fw*scale/2),Math.round(cv.height-12-(b?.bottom??fh)*scale),Math.round(fw*scale),Math.round(fh*scale));ctx.filter='none';
 });
}
function showCharacterSelect(){
 state='select';O.hidden=true;choicePanel.hidden=false;setHeroChoice(selectedHero);
}
function setHeroChoice(i){
 selectedHero=(i+heroes.length)%heroes.length;
 choiceCards.querySelectorAll('[data-hero]').forEach((b,j)=>{
  const active=j===selectedHero;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',active?'true':'false');
 });
 document.querySelector('#selectedBio').textContent=heroes[selectedHero].bio;
 paintPortraits();
}
function beginSelectedGame(){
 chosenHero=heroes[selectedHero];choicePanel.hidden=true;reset(0);startPlaying();
}
function startPlaying(){
 nextBeat=0;
 try{audioCtx ||= new(window.AudioContext||window.webkitAudioContext)();audioCtx.resume()}catch{}
 state='playing';O.hidden=true;choicePanel.hidden=true;sfx('slash',.12);
}
heroes.forEach((hero,i)=>{
 const btn=document.createElement('button');btn.type='button';btn.className='hero-card';btn.dataset.hero=i;
 const safe=(v)=>String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 btn.innerHTML='<canvas width="190" height="190" data-preview="'+i+'" aria-hidden="true"></canvas><span class="hero-name">'+safe(hero.name)+'</span><span class="hero-role">'+safe(hero.role)+'</span><span class="stat-lines">'+['POWER','SPEED','ARMOUR','MAGIC'].map((stat,j)=>'<span class="stat"><small>'+stat+'</small><i style="--value:'+hero.stats[j]*10+'%"></i></span>').join('')+'</span>';
 btn.addEventListener('click',()=>setHeroChoice(i));
 btn.addEventListener('dblclick',beginSelectedGame);
 choiceCards.appendChild(btn);
});
chooseButton.addEventListener('click',beginSelectedGame);
backButton.addEventListener('click',()=>{choicePanel.hidden=true;O.hidden=false;state='menu'});
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
   else if(e.code==='Escape'){choicePanel.hidden=true;O.hidden=false;state='menu'}
  }
 }else if(!keys.has(e.code)){
  if(e.code==='KeyJ')attack();
  if(e.code==='KeyK')attack(true);
  if(e.code==='KeyL')attack(false,true);
  if(e.code==='Space')dodge();
  if(e.code==='Enter'&&state!=='playing')play();
  if(e.code==='KeyP'||e.code==='Escape'){
   if(state==='playing')state='paused';
   else if(state==='paused')state='playing';
  }
 }
 keys.add(e.code);
});
window.addEventListener('keyup',e=>keys.delete(e.code));
window.addEventListener('blur',()=>keys.clear());
document.querySelectorAll('[data-key]').forEach(b=>{
 const k=b.dataset.key;
 b.addEventListener('pointerdown',e=>{
  e.preventDefault();b.setPointerCapture(e.pointerId);
  if(k==='KeyJ')attack();else if(k==='KeyK')attack(true);else if(k==='KeyL')attack(false,true);
  else if(k==='Space')dodge();else keys.add(k)
 });
 for(let event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(k))
});
reset();state='menu';paintPortraits();requestAnimationFrame(loop);
})();
