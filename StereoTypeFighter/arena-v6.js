import {drawSprite} from './sprites-v6.js';
export const CONTROL = [
 {left:'KeyA',right:'KeyD',jump:'KeyW',down:'KeyS',block:'KeyE',punch:'KeyF',kick:'KeyG',special:'KeyH'},
 {left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',down:'ArrowDown',block:'KeyI',punch:'KeyJ',kick:'KeyK',special:'KeyL'}
];
const FLOOR=446, GRAVITY=.65;
const MOVES={punch:{length:22,start:7,end:12,range:98,damage:8,push:7},kick:{length:30,start:12,end:19,range:131,damage:12,push:10},special:{length:44,start:14,end:26,range:190,damage:18,push:13}};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const STAGE_DEFS=[
 {id:'neon-laneway-beatdown',name:'Neon Laneway Beatdown',src:'./assets/backgrounds/game/neon-laneway-beatdown.webp'},
 {id:'backyard-bbq-bash',name:'Backyard BBQ Bash',src:'./assets/backgrounds/game/backyard-bbq-bash.webp'},
 {id:'construction-yard-throwdown',name:'Construction Yard Throwdown',src:'./assets/backgrounds/game/construction-yard-throwdown.webp'},
 {id:'arcade-food-court-frenzy',name:'Arcade Food Court Frenzy',src:'./assets/backgrounds/game/arcade-food-court-frenzy.webp'},
 {id:'docklands-container-clash',name:'Docklands Container Clash',src:'./assets/backgrounds/game/docklands-container-clash.webp'},
 {id:'outback-servo-showdown',name:'Outback Servo Showdown',src:'./assets/backgrounds/game/outback-servo-showdown.webp'}
];
const stageUrl=src=>new URL(src,document.baseURI).href;
const STAGES=STAGE_DEFS.map(def=>{const image=new Image(),stage={...def,image,failed:false};image.decoding='async';image.loading='eager';image.onerror=()=>{stage.failed=true;console.warn('Arena background failed to load:',stageUrl(def.src));};image.src=stageUrl(def.src);return stage;});
class Fighter {
 constructor(asset,side){this.asset=asset;this.side=side;this.x=side?700:260;this.y=FLOOR;this.vx=0;this.vy=0;this.face=side?-1:1;this.hp=100;this.meter=35;this.state='idle';this.tick=0;this.action=null;this.stun=0;this.buffer=null;this.think=0;this.plan={axis:0};}
 setState(name){if(this.state!==name){this.state=name;this.tick=0;}}
 get grounded(){return this.y>=FLOOR-.1;}
 input(game,other){
  if(game.mode==='cpu'&&this.side===1){
   if(--this.think<=0){
    const d=Math.abs(other.x-this.x),sign=Math.sign(other.x-this.x),level=game.difficulty;
    this.think=level==='easy'?27:level==='hard'?9:17;
    this.plan={axis:d>105?sign:d<75?-sign:0,block:!!other.action&&d<175&&Math.random()<(level==='hard'?.8:.4)};
    if(d<143&&Math.random()<.8)this.buffer={type:d<104&&Math.random()<.65?'punch':'kick',ttl:9};
    if(this.meter>=35&&d<240&&Math.random()<.26)this.buffer={type:'special',ttl:9};
    this.plan.jump=d>145&&Math.random()<.07;
   }else this.plan.jump=false;
   return this.plan;
  }
  const c=CONTROL[this.side],k=game.keys,p=game.pressed;
  for(const type of ['punch','kick','special'])if(p.has(c[type]))this.buffer={type,ttl:9};
  return {axis:Number(k.has(c.right))-Number(k.has(c.left)),jump:p.has(c.jump),down:k.has(c.down),block:k.has(c.block)};
 }
 update(game,other){
  this.tick++;
  if(this.buffer&&--this.buffer.ttl<0)this.buffer=null;
  if(this.hp<=0){this.setState('ko');this.vx*=.83;this.physics();return;}
  const input=this.input(game,other);
  if(this.stun>0){this.stun--;this.vx*=.8;this.physics();if(!this.stun){if(this.state==='fall'){this.setState('getup');this.stun=22;}else this.setState('idle');}return;}
  if(this.action){
   const a=this.action;this.vx*=.75;
   if(this.tick>=a.start&&this.tick<=a.end&&!a.hit){
    const dx=(other.x-this.x)*this.face,dy=Math.abs(other.y-this.y);
    if(dx>0&&dx<a.range&&dy<(other.state==='crouch'?60:108)){a.hit=true;other.hit(a,this,game);}
   }
   if(this.tick>=a.length){this.action=null;this.setState(this.grounded?'idle':'jump');}
  }else{
   this.face=this.x<other.x?1:-1;
   if(input.jump&&this.grounded&&!input.block){this.vy=-12.6;this.setState('jump');game.sound(430,.04);}
   if(this.buffer&&(!input.block)&&(!input.down||this.grounded)){
    const type=this.buffer.type;
    if(type!=='special'||this.meter>=35){
     this.buffer=null;this.action={...MOVES[type],type,hit:false};this.setState(type);this.tick=0;
     if(type==='special'){this.meter-=35;game.burst(this.x+this.face*35,this.y-110,this.asset.def.accent,22);}
     game.sound(type==='kick'?155:type==='special'?310:115,.05);
    }
   }
   if(!this.action){
    this.vx=(input.block||input.down)?0:input.axis*3.35*(this.asset.def.speed||1);
    this.setState(!this.grounded||this.vy<0?'jump':input.block?'block':input.down?'crouch':input.axis?'walk':'idle');
   }
  }
  const wasAir=!this.grounded;this.physics();
  if(wasAir&&this.grounded&&this.state==='jump'&&!this.action){this.setState('landing');this.stun=4;}
  if(game.mode==='training')this.meter=100;
 }
 physics(){this.vy+=GRAVITY;this.x=clamp(this.x+this.vx,55,905);this.y+=this.vy;if(this.y>=FLOOR){this.y=FLOOR;this.vy=0;}}
 hit(a,attacker,game){
  if(this.hp<=0||this.state==='getup'||this.state==='fall')return;
  const blocked=this.state==='block'&&this.face===-attacker.face;
  const damage=Math.max(1,Math.round(a.damage/(this.asset.def.defense||1)*(blocked?.2:1)));
  this.hp=Math.max(0,this.hp-damage);this.action=null;this.buffer=null;
  this.setState(blocked?'block':a.type==='special'?'fall':'hurt');this.tick=0;this.stun=blocked?9:a.type==='special'?42:17;
  this.vx=attacker.face*a.push*(blocked?.4:1);this.vy=blocked?0:a.type==='special'?-6:-2;
  attacker.meter=clamp(attacker.meter+10,0,100);this.meter=clamp(this.meter+7,0,100);
  game.freeze=blocked?3:5;game.shake=blocked?1:5;game.burst(this.x,this.y-100,blocked?'#d7eeff':attacker.asset.def.accent,12);game.sound(blocked?210:70,.065);
 }
 draw(ctx,game){
  const state=this.hp<=0?'ko':this.state,duration=this.action?.length||({hurt:17,fall:42,getup:22}[state]||0);
  const bob=state==='idle'&&this.asset.def.legacy?Math.sin(this.tick*.08)*1.2:0;
  ctx.fillStyle='rgba(0,0,0,.38)';ctx.beginPath();ctx.ellipse(this.x,FLOOR+3,43,8,0,0,Math.PI*2);ctx.fill();
  const walkLength=this.asset.frames.walk.length*7;
  const animTick=state==='walk'&&this.vx*this.face<0?walkLength-1-this.tick%walkLength:this.tick;
  drawSprite(ctx,this.asset,state,animTick,this.x,this.y+bob,2.2,this.face,duration,this.vy);
  if(this.action?.type==='special'&&this.tick>=10&&this.tick<30){
   const t=(this.tick-10)/20,x=this.x+this.face*(55+90*t),y=this.y-105;
   ctx.strokeStyle=this.asset.def.accent;ctx.lineWidth=3;ctx.globalAlpha=1-t;
   ctx.beginPath();ctx.arc(x,y,14+25*t,0,Math.PI*2);ctx.stroke();ctx.globalAlpha=1;
  }
 }
}
export class Arena {
 constructor(canvas,onChange,sound){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.onChange=onChange;this.sound=sound;this.keys=new Set();this.pressed=new Set();this.phase='off';this.paused=false;this.tick=0;this.fx=[];this.freeze=0;this.shake=0;this.reduced=false;this.stageId='random';this.venue=null;}
 start(mode,assets,difficulty='normal',stageId='random'){this.mode=mode;this.assets=assets;this.difficulty=difficulty;this.stageId=stageId;this.venue=stageId==='random'?STAGES[Math.floor(Math.random()*STAGES.length)]:(STAGES.find(stage=>stage.id===stageId)||STAGES[0]);this.wins=[0,0];this.round=1;this.paused=false;this.keys.clear();this.pressed.clear();this.reset();}
 reset(){this.people=this.assets.map((a,i)=>new Fighter(a,i));this.remaining=3600;this.phase=this.mode==='training'?'fight':'intro';this.phaseTick=0;this.fx=[];this.freeze=0;this.shake=0;if(this.mode==='training')this.people.forEach(f=>f.meter=100);this.onChange(this);}
 stop(){this.phase='off';this.paused=false;this.keys.clear();this.pressed.clear();}
 pause(value=!this.paused){if(this.phase==='off'||this.phase==='matchover')return;this.paused=value;this.keys.clear();this.pressed.clear();this.onChange(this);}
 key(code,down){if(down){if(!this.keys.has(code))this.pressed.add(code);this.keys.add(code);}else this.keys.delete(code);}
 burst(x,y,color,n){if(this.reduced)n=4;for(let i=0;i<n;i++)this.fx.push({x,y,vx:(Math.random()-.5)*9,vy:(Math.random()-.6)*9,life:22,color});}
 update(){
  if(this.phase==='off'||this.paused){this.pressed.clear();return;}
  this.tick++;this.phaseTick++;
  if(this.phase==='intro'){this.people.forEach(f=>f.tick++);if(this.phaseTick>=90){this.phase='fight';this.phaseTick=0;}}
  else if(this.phase==='fight'){
   if(this.freeze>0)this.freeze--;
   else{
    const [a,b]=this.people;a.update(this,b);b.update(this,a);
    const gap=b.x-a.x;
    if(Math.abs(a.y-b.y)<80&&Math.abs(gap)<65){const push=(65-Math.abs(gap))/2,sign=gap>=0?1:-1;a.x=clamp(a.x-sign*push,55,905);b.x=clamp(b.x+sign*push,55,905);}
    if(this.mode!=='training')this.remaining=Math.max(0,this.remaining-1);
    if(a.hp<=0||b.hp<=0||this.remaining<=0){
     this.winner=a.hp===b.hp?-1:a.hp>b.hp?0:1;
     if(this.mode==='training'){this.phase='training-reset';this.phaseTick=0;}
     else{if(this.winner>=0)this.wins[this.winner]++;this.phase='roundover';this.phaseTick=0;this.people.forEach((p,i)=>{p.action=null;p.buffer=null;p.stun=0;p.setState(i===this.winner?'victory':p.hp<=0?'ko':'idle');});}
     this.onChange(this);
    }
   }
  }else if(this.phase==='roundover'||this.phase==='training-reset'){
   this.people.forEach(p=>{p.tick++;p.vx*=.8;p.physics();});
   if(this.phaseTick>=130){if(this.mode==='training')this.reset();else if(this.wins.some(w=>w>=2)){this.phase='matchover';this.onChange(this);}else{this.round++;this.reset();}}
  }else if(this.phase==='matchover')this.people.forEach(f=>f.tick++);
  this.fx=this.fx.filter(p=>--p.life>0);this.fx.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.12;});this.shake*=.8;
  this.pressed.clear();if(this.tick%6===0)this.onChange(this);
 }
 draw(){
  const c=this.ctx;c.save();if(!this.reduced&&this.shake>.3)c.translate(Math.random()*this.shake-this.shake/2,0);
  this.stage(c);if(this.phase!=='off'){this.people.forEach(p=>p.draw(c,this));for(const p of this.fx){c.globalAlpha=p.life/22;c.fillStyle=p.color;c.fillRect(p.x,p.y,4,4);}c.globalAlpha=1;}
  c.restore();
  let banner='';
  if(this.phase==='intro')banner=this.phaseTick<57?'ROUND '+this.round:'FIGHT';
  if(this.phase==='roundover')banner=this.winner<0?'DRAW':this.people[this.winner].asset.def.name.toUpperCase()+' WINS';
  if(banner){c.fillStyle='rgba(7,10,18,.7)';c.fillRect(0,203,960,78);c.fillStyle='#ffe09a';c.textAlign='center';c.font='bold 34px monospace';c.fillText(banner,480,253,880);}
 }
 stage(c){
  const image=this.venue?.image;
  if(image?.complete&&image.naturalWidth&&!this.venue?.failed){c.drawImage(image,0,0,960,540);c.fillStyle='rgba(4,8,16,.06)';c.fillRect(0,0,960,540);return;}
  const g=c.createLinearGradient(0,0,0,540);g.addColorStop(0,'#0c1225');g.addColorStop(.65,'#31364b');g.addColorStop(1,'#161a25');c.fillStyle=g;c.fillRect(0,0,960,540);
  c.fillStyle='#c9c6b6';c.fillRect(713,55,34,34);c.fillStyle='#202438';c.fillRect(720,55,30,21);
  for(let i=0;i<13;i++){const x=i*83,h=90+(i*71)%130;c.fillStyle=i%2?'#141d2d':'#192638';c.fillRect(x,285-h,79,h);for(let y=290-h;y<275;y+=19)for(let j=0;j<4;j++){c.fillStyle=(j+i+y)%3?'#314256':'#ac8460';c.fillRect(x+12+j*16,y,6,7);}}
  c.fillStyle='#242332';c.fillRect(0,280,960,163);for(let y=293;y<442;y+=19){c.fillStyle='#35303e';c.fillRect(0,y,960,2);for(let x=(y%2)*18;x<960;x+=66)c.fillRect(x,y,2,19);}
  c.fillStyle='#111724';c.fillRect(24,286,255,123);c.fillRect(738,280,198,144);c.strokeStyle='#dd88ad';c.lineWidth=3;c.strokeRect(36,291,235,41);c.fillStyle='#f3c9d4';c.font='bold 21px monospace';c.textAlign='center';c.fillText('THE NIGHT SHIFT',152,319);
  c.strokeStyle='#779ea7';c.strokeRect(756,285,160,64);c.fillStyle='#b8d9d9';c.fillText('OPEN LATE',837,323);
  for(let i=0;i<19;i++){const x=285+i*23,y=409+Math.sin((this.reduced?0:this.tick)*.018+i)*2;c.fillStyle=i%3?'#131827':'#202231';c.fillRect(x-6,y-28,12,12);c.fillRect(x-9,y-16,18,31);}
  c.fillStyle='#444150';c.fillRect(0,441,960,8);c.fillStyle='#222734';c.fillRect(0,449,960,91);
  c.fillStyle='#555365';for(let x=0;x<960;x+=75)c.fillRect(x,456,48,2);c.fillStyle='#393f4d';for(let x=18;x<960;x+=130)c.fillRect(x,512,75,3);
 }
 snapshot(){return {phase:this.phase,paused:this.paused,round:this.round,wins:[...(this.wins||[])],remaining:this.remaining,venue:this.venue?.id||'procedural-neon-quarter',stageId:this.stageId,people:(this.people||[]).map(f=>({id:f.asset.def.id,x:f.x,y:f.y,state:f.state,tick:f.tick,hp:f.hp,meter:f.meter,attack:f.action?.type||null}))};}
}
