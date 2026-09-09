(() => {
  'use strict';
  const canvas = document.getElementById('gameCanvas');
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = false;
  const overlay = document.getElementById('selectOverlay');
  const grid = document.getElementById('fighterGrid');
  const p1Name = document.getElementById('p1Name');
  const p2Name = document.getElementById('p2Name');
  const cpuButton = document.getElementById('cpuButton');
  const duelButton = document.getElementById('duelButton');
  const muteButton = document.getElementById('muteButton');
  const W = canvas.width, H = canvas.height, FLOOR = 445;
  const FRAME = 96, COLS = 5;
  const keys = Object.create(null), pressed = new Set();
  let audioMuted = false, paused = false, frame = 0;

  const fighters = [
    { id:'lefty', name:'Lefty Liberal', style:'Activist Brawler', accent:'#ffba08', color:'#687836', special:'Safe Space Bubble', atlas: () => 'data:image/png;base64,' + (window.__SF_LEFTY_ATLAS || ''), bio:'A caffeinated street activist who fights with righteous jabs and defensive energy.' },
    { id:'agenda', name:'Agenda Fluid', style:'Identity Punk', accent:'#dc5cff', color:'#1687dc', special:'Gender Bending Beatdown', atlas: () => 'data:image/png;base64,' + (window.__SF_AGENDA_ATLAS || ''), bio:'A neon punk rushdown fighter with fast kicks and a purple energy wave.' },
    { id:'club-doll', name:'Club Doll', style:'Nightlife Queen', accent:'#ff64c8', color:'#ff2f98', special:'Velvet Rope Vortex', atlas: () => './assets/club-doll-atlas.png', bio:'Paris nightlife royalty: high kicks, evasive spins and camera-ready finishing poses.' },
    { id:'tweaker', name:'Tweaker', style:'Street Static', accent:'#8ce6ff', color:'#3f5364', special:'Street Static', atlas: () => './assets/tweaker-atlas.png', bio:'An unpredictable fictional arcade drifter built around fake-outs, sudden dashes and awkward angles.' }
  ];

  const frameMap = {
    idle:[0,1], walk:[0,1], punch:[2,3,4,5], kick:[6,7,8,9,10], special:[11,12,13,12], hurt:[14,15,16], knockback:[17], recover:[18], taunt:[19], crouch:[18], block:[16], jump:[17], ko:[17]
  };

  const images = new Map();
  for (const f of fighters) {
    const img = new Image(); img.src = f.atlas(); images.set(f.id, img);
  }

  const state = { mode:'select', editSlot:0, selected:[0,1], cpu:false, timer:60, round:1, wins:[0,0], banner:'', bannerTime:0, entities:[], particles:[] };

  const controls = [
    {left:'KeyA',right:'KeyD',jump:'KeyW',down:'KeyS',block:'KeyE',punch:'KeyF',kick:'KeyG',special:'KeyH'},
    {left:'ArrowLeft',right:'ArrowRight',jump:'ArrowUp',down:'ArrowDown',block:'KeyI',punch:'KeyJ',kick:'KeyK',special:'KeyL'}
  ];

  class Fighter {
    constructor(def, x, side, isCPU=false) {
      this.def=def; this.x=x; this.y=FLOOR; this.vx=0; this.vy=0; this.side=side; this.face=side===0?1:-1; this.cpu=isCPU;
      this.health=100; this.meter=0; this.state='idle'; this.anim=0; this.attack=null; this.hurt=0; this.blocking=false; this.cool=0; this.ai=0;
    }
    get grounded(){ return this.y>=FLOOR-1; }
    update(other){
      if(this.health<=0){ this.state='ko'; this.vx*=.9; this.physics(); return; }
      if(this.hurt>0){ this.hurt--; this.state='hurt'; this.vx*=.88; this.physics(); return; }
      if(this.cool>0) this.cool--;
      let input = this.cpu ? this.aiInput(other) : this.playerInput();
      this.blocking = !!input.block && this.grounded && !this.attack;
      if(this.attack){ this.updateAttack(other); this.physics(); return; }
      if(input.jump && this.grounded){ this.vy=-13; this.state='jump'; beep(520,.05); }
      if(input.punch) this.startAttack('punch'); else if(input.kick) this.startAttack('kick'); else if(input.special && this.meter>=35) this.startAttack('special');
      if(!this.attack){
        if(this.blocking){ this.state='block'; this.vx=0; }
        else if(input.down && this.grounded){ this.state='crouch'; this.vx=0; }
        else { this.vx=(input.axis||0)*3.6; this.state=this.grounded?(Math.abs(this.vx)>.1?'walk':'idle'):'jump'; }
      }
      this.physics(); this.face=this.x<other.x?1:-1;
    }
    physics(){
      this.vy += .68; this.x += this.vx; this.y += this.vy;
      if(this.y>=FLOOR){ this.y=FLOOR; this.vy=0; }
      this.x=Math.max(70,Math.min(W-70,this.x));
    }
    playerInput(){ const c=controls[this.side]; return {axis:(keys[c.right]?1:0)-(keys[c.left]?1:0), jump:pressed.has(c.jump), down:keys[c.down], block:keys[c.block], punch:pressed.has(c.punch), kick:pressed.has(c.kick), special:pressed.has(c.special)}; }
    aiInput(other){
      this.ai--; const dx=other.x-this.x, d=Math.abs(dx); let axis=d>120?Math.sign(dx):(d<65?-Math.sign(dx):0), punch=false,kick=false,special=false,jump=false,block=false;
      if(this.ai<=0){ this.ai=8+Math.random()*12; if(d<75){ punch=Math.random()<.48; kick=!punch&&Math.random()<.55; } else if(d<170&&this.meter>=35&&Math.random()<.25) special=true; jump=Math.random()<.08; block=other.attack&&Math.random()<.45; }
      return {axis,jump,down:false,block,punch,kick,special};
    }
    startAttack(type){
      if(this.cool||this.attack) return;
      const p={punch:{len:20,active:[7,11],range:72,damage:8,kb:8},kick:{len:27,active:[9,15],range:92,damage:12,kb:11},special:{len:38,active:[14,24],range:145,damage:18,kb:16}}[type];
      this.attack={type,t:0,...p,hit:false}; this.state=type; this.vx*=.3; this.cool=4; beep(type==='special'?260:type==='kick'?160:110,.06);
      if(type==='special') this.meter-=35;
    }
    updateAttack(other){
      const a=this.attack; a.t++; this.state=a.type;
      if(!a.hit && a.t>=a.active[0] && a.t<=a.active[1]){
        const dx=(other.x-this.x)*this.face; const dy=Math.abs(other.y-this.y);
        if(dx>10 && dx<a.range && dy<95){ a.hit=true; other.takeHit(a,this); }
      }
      if(a.t>=a.len){ this.attack=null; this.state=this.grounded?'idle':'jump'; }
    }
    takeHit(a,attacker){
      const blocked=this.blocking && attacker.x!==this.x && ((attacker.x<this.x&&this.face<0)||(attacker.x>this.x&&this.face>0));
      const damage=blocked?Math.max(1,Math.round(a.damage*.25)):a.damage;
      this.health=Math.max(0,this.health-damage); this.hurt=blocked?6:13; this.vx=attacker.face*a.kb*(blocked?.35:1); this.vy=blocked?-1.5:-3.6;
      attacker.meter=Math.min(100,attacker.meter+(a.type==='special'?8:12)); this.meter=Math.min(100,this.meter+7);
      spawnHit(this.x,this.y-110,attacker.def.accent,blocked); state.bannerTime=8; beep(blocked?90:70,.05);
    }
    draw(){
      const img=images.get(this.def.id); if(!img||!img.complete) return;
      const seq=frameMap[this.state]||frameMap.idle;
      let idx=seq[0];
      if(this.attack){ idx=seq[Math.min(seq.length-1,Math.floor(this.attack.t/(this.attack.len/seq.length)))]; }
      else if(seq.length>1) idx=seq[Math.floor(frame/(this.state==='idle'?16:9))%seq.length];
      const sx=(idx%COLS)*FRAME, sy=Math.floor(idx/COLS)*FRAME;
      let scale=2.35, dw=FRAME*scale, dh=FRAME*scale, x=this.x-dw/2, y=this.y-dh+10;
      if(this.state==='crouch'){ dh*=.82; y=this.y-dh+8; }
      ctx.save(); if(this.face<0){ ctx.translate(this.x,0); ctx.scale(-1,1); x=-dw/2; }
      ctx.drawImage(img,sx,sy,FRAME,FRAME,x,y,dw,dh); ctx.restore();
    }
  }

  function setupMenu(){
    grid.innerHTML=''; fighters.forEach((f,i)=>{
      const b=document.createElement('button'); b.className='fighter-card'; b.type='button'; b.innerHTML=`<div class="portrait-wrap"><canvas width="96" height="96"></canvas><div class="pick-badges"><span class="pick-badge p1-badge">P1</span><span class="pick-badge p2-badge">P2</span></div></div><div class="fighter-copy"><strong>${f.name}</strong><span class="archetype">${f.style}</span><p>${f.bio}</p><div class="move-row"><em>${f.special}</em></div></div>`;
      b.onclick=()=>{ state.selected[state.editSlot]=i; syncMenu(); };
      grid.appendChild(b); const pc=b.querySelector('canvas'), pctx=pc.getContext('2d'); pctx.imageSmoothingEnabled=false; const img=images.get(f.id);
      const draw=()=>{ if(img.complete&&img.naturalWidth){ pctx.clearRect(0,0,96,96); pctx.drawImage(img,0,0,96,96,0,0,96,96); } else requestAnimationFrame(draw); }; draw();
    });
    document.querySelectorAll('.slot-tab').forEach(btn=>btn.onclick=()=>{ state.editSlot=Number(btn.dataset.slot); syncMenu(); }); syncMenu();
  }
  function syncMenu(){
    [...grid.children].forEach((el,i)=>{ el.classList.toggle('p1',state.selected[0]===i); el.classList.toggle('p2',state.selected[1]===i); });
    document.querySelectorAll('.slot-tab').forEach(b=>b.classList.toggle('active',Number(b.dataset.slot)===state.editSlot));
    p1Name.textContent=fighters[state.selected[0]].name; p2Name.textContent=fighters[state.selected[1]].name;
  }
  function start(cpu){
    state.cpu=cpu; state.mode='fight'; state.timer=60; state.round=1; state.wins=[0,0]; overlay.classList.add('hidden'); resetRound(true);
  }
  function resetRound(){
    state.entities=[new Fighter(fighters[state.selected[0]],260,0,false),new Fighter(fighters[state.selected[1]],700,1,state.cpu)]; state.timer=60; state.roundClock=0; state.banner=`ROUND ${state.round}`; state.bannerTime=90;
  }
  function endRound(){
    if(state.mode!=='fight') return; const [a,b]=state.entities; let win=a.health===b.health?(Math.random()<.5?0:1):(a.health>b.health?0:1); state.wins[win]++; state.banner=`${state.entities[win].def.name} WINS`; state.bannerTime=120;
    if(state.wins[win]>=2){ state.mode='matchover'; state.banner=`${state.entities[win].def.name} TAKES THE MATCH`; }
    else { state.round++; setTimeout(()=>{ if(state.mode==='fight') resetRound(); },1400); }
  }
  function spawnHit(x,y,color,blocked){ for(let i=0;i<12;i++) state.particles.push({x,y,vx:(Math.random()-.5)*8,vy:(Math.random()-.5)*8,life:20,color:blocked?'#fff':color}); }
  function update(){
    if(paused||state.mode==='select'||state.mode==='matchover'){ pressed.clear(); return; }
    frame++; const [a,b]=state.entities; a.update(b); b.update(a);
    const gap=b.x-a.x; if(Math.abs(gap)<64){ const push=(64-Math.abs(gap))/2; if(gap>=0){a.x-=push;b.x+=push;}else{a.x+=push;b.x-=push;} }
    state.roundClock=(state.roundClock||0)+1; if(state.roundClock%60===0) state.timer=Math.max(0,state.timer-1);
    if((a.health<=0||b.health<=0||state.timer<=0) && !state.ending){ state.ending=true; setTimeout(()=>{state.ending=false;endRound();},500); }
    state.particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vx*=.92;p.vy*=.92;p.life--;}); state.particles=state.particles.filter(p=>p.life>0);
    if(state.bannerTime>0) state.bannerTime--; pressed.clear();
  }
  function draw(){ drawStage(); if(state.mode!=='select'){ state.entities.forEach(f=>f.draw()); drawParticles(); drawHUD(); drawBanner(); } }
  function drawStage(){
    const g=ctx.createLinearGradient(0,0,0,H); g.addColorStop(0,'#18112c'); g.addColorStop(.55,'#311b4a'); g.addColorStop(1,'#0b0b13'); ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    ctx.fillStyle='#090a12'; for(let i=0;i<14;i++){ const x=i*74; const h=80+(i*37)%145; ctx.fillRect(x,H-185-h,72,h); }
    ctx.fillStyle='#49265f';ctx.fillRect(0,360,W,85); ctx.fillStyle='#1b1521';ctx.fillRect(0,445,W,95);
    ctx.strokeStyle='#7b3aa1';ctx.lineWidth=2; for(let x=0;x<W;x+=80){ctx.beginPath();ctx.moveTo(x,445);ctx.lineTo(x-38,H);ctx.stroke();}
    ctx.fillStyle='#ff4db8';ctx.font='bold 18px monospace';ctx.fillText('STEREOTYPE',38,335); ctx.fillStyle='#62d8ff';ctx.fillText('FIGHTERS',165,335);
    for(let i=0;i<28;i++){const x=12+i*35,y=407+(i%3)*4;ctx.fillStyle=i%2?'#11131b':'#17121d';ctx.beginPath();ctx.arc(x,y-18,8,0,Math.PI*2);ctx.fill();ctx.fillRect(x-7,y-10,14,25);}
  }
  function drawHUD(){ const [a,b]=state.entities; healthBar(a,30,false); healthBar(b,W-30,true); ctx.textAlign='center';ctx.font='bold 28px monospace';ctx.fillStyle='#ffe082';ctx.fillText(String(state.timer).padStart(2,'0'),W/2,48);ctx.font='bold 13px monospace';ctx.fillStyle='#fff';ctx.fillText(`ROUND ${state.round}`,W/2,69); }
  function healthBar(f,x,right){ const w=330; ctx.fillStyle='#171720';ctx.fillRect(right?x-w:x,22,w,22);ctx.fillStyle=f.def.color;const hw=w*f.health/100;ctx.fillRect(right?x-hw:x,22,hw,22);ctx.strokeStyle='#f5df9b';ctx.strokeRect(right?x-w:x,22,w,22);ctx.fillStyle='#fff';ctx.font='bold 15px monospace';ctx.textAlign=right?'right':'left';ctx.fillText(f.def.name.toUpperCase(),x,17); const mw=180, mx=right?x-mw:x;ctx.fillStyle='#20202a';ctx.fillRect(mx,50,mw,7);ctx.fillStyle=f.def.accent;ctx.fillRect(right?x-mw*(f.meter/100):mx,50,mw*(f.meter/100),7); }
  function drawParticles(){ state.particles.forEach(p=>{ctx.globalAlpha=Math.max(0,p.life/20);ctx.fillStyle=p.color;ctx.fillRect(p.x,p.y,5,5);});ctx.globalAlpha=1; }
  function drawBanner(){ if(state.bannerTime<=0&&state.mode!=='matchover') return; ctx.fillStyle='rgba(0,0,0,.62)';ctx.fillRect(0,218,W,90);ctx.textAlign='center';ctx.font='900 36px monospace';ctx.fillStyle='#fff1b5';ctx.fillText(state.banner,W/2,272); if(state.mode==='matchover'){ctx.font='bold 14px monospace';ctx.fillStyle='#d8d9e7';ctx.fillText('ENTER: REMATCH    M: CHARACTER SELECT',W/2,298);} }
  function beep(freq,dur){ if(audioMuted) return; try{const ac=beep.ac||(beep.ac=new (window.AudioContext||window.webkitAudioContext)());const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=freq;g.gain.value=.025;o.connect(g);g.connect(ac.destination);o.start();g.gain.exponentialRampToValueAtTime(.0001,ac.currentTime+dur);o.stop(ac.currentTime+dur);}catch{} }

  addEventListener('keydown',e=>{ if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(e.code))e.preventDefault(); if(!keys[e.code])pressed.add(e.code); keys[e.code]=true; if(e.code==='KeyP')paused=!paused; if(e.code==='KeyM'&&state.mode==='matchover'){state.mode='select';overlay.classList.remove('hidden');} if(e.code==='Enter'&&state.mode==='matchover')start(state.cpu); });
  addEventListener('keyup',e=>{keys[e.code]=false;});
  cpuButton.onclick=()=>start(true); duelButton.onclick=()=>start(false); muteButton.onclick=()=>{audioMuted=!audioMuted;muteButton.textContent=`SOUND: ${audioMuted?'OFF':'ON'}`;muteButton.setAttribute('aria-pressed',audioMuted);};
  setupMenu(); drawStage();
  let last=performance.now(),acc=0; function loop(now){acc+=Math.min(100,now-last);last=now;while(acc>=1000/60){update();acc-=1000/60;}draw();requestAnimationFrame(loop);}requestAnimationFrame(loop);
})();