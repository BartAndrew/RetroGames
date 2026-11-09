/* Ashen Realms: cinematic environments v1.3.
 * Three original generated environments are embedded in assets-stage-{1,2,3}.js.
 * All atmosphere is deterministic screen-space decoration and does not change gameplay hitboxes.
 */
(() => {
  const images = [window.ASHEN_STAGE_1,window.ASHEN_STAGE_2,window.ASHEN_STAGE_3].map(src=>{
    const img = new Image(); img.decoding='async'; img.src=src; return img;
  });
  // High-resolution generated image layers: 0.14x distant scenery, 0.48x midground,
  // 1.04x ground cover, 1.3x nearest masked scenery. Fighters stay at 1.0x.
  const layers=[window.ASHEN_PARALLAX_1,window.ASHEN_PARALLAX_2,window.ASHEN_PARALLAX_3].map(pack=>{
    const obj={};
    for(const name of ['mid','floor','edge']){
      const img=new Image();img.decoding='async';img.src=pack?.[name]||'';
      obj[name]=img;
    }
    return obj;
  });
  const ready=img=>img?.complete&&img.naturalWidth>0;
  const maxCam=1348;
  const progress=(camera)=>Math.max(0,Math.min(1,camera/maxCam));
  const reduced=()=>typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parallaxOn=()=>window.ASHEN_PARALLAX_ENABLED!==false;
  function midground(ctx,stage,camera,W,H){
    const image=layers[stage]?.mid;if(!ready(image))return;
    // The image has an alpha gradient in the upper half, revealing the far scenery.
    const drawW=W*1.43,drawH=H*1.13;
    const travel=(drawW-W)*progress(camera);
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    ctx.drawImage(image,-travel,-H*.078,drawW,drawH);ctx.restore();
  }
  function foreground(ctx,stage,camera,frame,W,H,heroX=W*.38){
    if(!parallaxOn())return;
    const pack=layers[stage];if(!pack)return;
    const floor=pack.floor,edge=pack.edge;
    ctx.save();ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';
    // V1.5 foreground is a shallow foreground band, not a full-height tinted
    // image. The combat lane (y < 554) is fully unobscured.
    const band=H*.128,top=H-band;
    ctx.beginPath();ctx.rect(0,top,W,band);ctx.clip();
    if(ready(floor)){
      const width=W*.92, height=H*.23;
      const offset=-(((camera*1.13)%width+width)%width);
      // Feathered image foreground, dimmer than last release to keep foot
      // contact shadows and pickup UI visible.
      ctx.globalAlpha=.38;
      for(let n=-1;n<4;n++)ctx.drawImage(floor,offset+n*width,H-height+20,width,height);
    }
    ctx.restore();
    if(ready(edge)){
      // Decorative ruined architecture lives mostly at the outer screen edges
      // rather than covering player attacks in the middle of the screen.
      // Each object fades as the camera approaches it to avoid hard occlusion.
      const ew=W*.17,eh=H*.56;
      ctx.save();
      ctx.beginPath();ctx.rect(0,0,W*.20,H);ctx.rect(W*.80,0,W*.20,H);ctx.clip();
      for(let i=0;i<7;i++){
        const xx=i*480-160-camera*1.18;
        if(xx>W+ew||xx<-ew)continue;
        const dist=Math.abs(xx+ew*.5-heroX);
        const fade=Math.max(.10,Math.min(1,(dist-90)/230));
        ctx.save();ctx.globalAlpha=(stage===1?.35:.28)*fade;
        if(i%2){ctx.translate(xx+ew,0);ctx.scale(-1,1);ctx.drawImage(edge,0,H-eh,ew,eh)}
        else ctx.drawImage(edge,xx,H-eh,ew,eh);
        ctx.restore();
      }
      ctx.restore();
    }
    // The nearest ground details scroll faster than the battlefield.
    ctx.save();ctx.beginPath();ctx.rect(0,H-65,W,65);ctx.clip();
    const drift=reduced()?0:frame*.10;
    for(let i=0;i<28;i++){
      const x=wrap(i*167-camera*1.23+drift*(1+i%3),W+90)-45;
      const y=H-7-(i%5)*10;
      const tint=stage===1?'#618e72':stage===2?'#a56b48':'#8f7960';
      elliptical(ctx,x,y,2.2+i%3,1.3+i%2,tint+'55');
      if(i%4===0){
        line(ctx,x,y,x-6,y-7-i%3*5,tint+'79',1.1);
        line(ctx,x,y,x+5,y-5,tint+'6a',1);
      }
    }
    ctx.restore();
  }
  window.drawAshenForeground=foreground;
  window.ASHEN_PARALLAX_STATUS=()=>layers.map((obj,index)=>({stage:index+1,
    mid:ready(obj.mid),floor:ready(obj.floor),edge:ready(obj.edge)}));
  const hash=(n)=>{const x=Math.sin(n*127.1+17.31)*43758.5453;return x-Math.floor(x)};
  const wrap=(x,width)=>((x%width)+width)%width;
  const elliptical=(ctx,x,y,w,h,fill)=>{ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fillStyle=fill;ctx.fill()};
  const line=(ctx,x,y,x2,y2,stroke,thick=1)=>{ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x2,y2);ctx.strokeStyle=stroke;ctx.lineWidth=thick;ctx.stroke()};
  const vignette=(ctx,W,H)=>{
    const gradient=ctx.createRadialGradient(W*.52,H*.48,H*.17,W*.5,H*.51,W*.72);
    gradient.addColorStop(0,'#00000000');gradient.addColorStop(.67,'#05070b0d');gradient.addColorStop(1,'#06090b80');
    ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);
  };
  function groundDetails(ctx,stage,camera,W,H){
    for(let i=0;i<57;i++){
      const worldX=90+i*48+hash(i*47+stage)*60;
      const x=worldX-camera*.91;
      if(x<-100||x>W+80)continue;
      const y=455+hash(i+43)*190;
      const type=i%7;
      if(type<3){
        elliptical(ctx,x,y,4+hash(i*8)*14,1.5+hash(i*9)*3,stage===1?'#14241b75':stage===2?'#19141a83':'#1f171783');
        line(ctx,x-4,y,x+8+hash(i)*20,y-1,stage===1?'#b1b39b36':'#dfb59137',1.1);
      }else if(type===3){
        for(let j=0;j<3;j++){
          const xx=x+j*2;
          line(ctx,xx,y,xx-4+j*2,y-5-hash(i+j)*9,stage===1?'#536d4e7f':stage===2?'#98684b8f':'#a88e5783',1);
        }
      }else if(type===4){
        ctx.save();ctx.translate(x,y);ctx.rotate(-.1+hash(i)*.3);
        ctx.fillStyle=stage===1?'#3b4d4268':'#25212680';ctx.fillRect(-5,-2,11,4);ctx.restore();
      }else if(type===5 && stage!==1){
        line(ctx,x-3,y,x+5,y-6,stage===2?'#c8674159':'#ab896b6b',2);
      }
    }
  }
  function driftingFog(ctx,stage,camera,frame,W,H){
    ctx.save();ctx.globalCompositeOperation='screen';
    for(let layer=0;layer<2;layer++){
      for(let i=0;i<7;i++){
        const speed=.075+layer*.12,sw=W+510;
        let x=wrap(i*254-camera*(.09+layer*.13)+frame*speed,sw)-230;
        const y=360+layer*82+hash(i*17+stage)*100;
        const width=200+hash(i+64)*160;
        const grad=ctx.createRadialGradient(x,y,20,x,y,width);
        const tint=stage===1?'155,191,193':stage===2?'216,140,128':'225,190,150';
        grad.addColorStop(0,'rgba('+tint+','+(layer===0?.09:.055)+')');
        grad.addColorStop(1,'rgba('+tint+',0)');
        ctx.fillStyle=grad;ctx.fillRect(x-width,y-width,width*2,width*2);
      }
    }
    ctx.restore();
  }
  function atmosphere(ctx,stage,camera,frame,W,H){
    const t=frame/60;
    if(stage===1){
      // Light rays, drifting leaves, and small distant fireflies.
      ctx.save();ctx.globalCompositeOperation='screen';
      for(let i=0;i<5;i++){
        const x=80+i*245-camera*.13;
        ctx.beginPath();ctx.moveTo(x,-40);ctx.lineTo(x+55,0);ctx.lineTo(x+250,520);ctx.lineTo(x+125,520);ctx.closePath();
        ctx.fillStyle='rgba(165,213,224,'+(.011+Math.sin(t*.3+i)*.005)+')';ctx.fill();
      }
      for(let i=0;i<53;i++){
        const x=wrap(37+i*211-camera*.26+t*(5+hash(i)*12),W+100)-50;
        const y=80+hash(i*3)*470+Math.sin(t*.95+i)*13;
        const size=.7+hash(i+91)*1.7;
        elliptical(ctx,x,y,size,size,'rgba(208,238,173,'+(.17+.22*Math.sin(t*1.8+i)**2)+')');
      }
      ctx.restore();
      for(let i=0;i<16;i++){
        const x=wrap(i*103-camera*.32+t*(12+hash(i)*14),W+130)-65;
        const y=210+hash(i*29)*400+Math.sin(i+t)*26;
        ctx.save();ctx.translate(x,y);ctx.rotate(t*.3+i);ctx.fillStyle=i%3?'#ab635e7a':'#c5a66a5d';ctx.fillRect(-3,-1,6,2);ctx.restore();
      }
    }else if(stage===0||stage===2){
      ctx.save();ctx.globalCompositeOperation='screen';
      for(let i=0;i<95;i++){
        const x=wrap(i*137+hash(i*17)*W-camera*.24+Math.sin(t+i)*5,W+70)-35;
        const y=wrap(250+i*83-t*(14+hash(i*9)*34),H+100);
        const rad=.5+hash(i*13)*1.9;
        const alpha=.13+hash(i*4)*.35;
        elliptical(ctx,x,y,rad,rad,i%4===0?'rgba(255,233,171,'+alpha+')':'rgba(255,115,52,'+alpha+')');
      }
      ctx.restore();
      // Burning / volcanic glow breathes slowly.
      const glow=ctx.createLinearGradient(0,H*.48,0,H);
      glow.addColorStop(0,'#ed5b2100');glow.addColorStop(1,stage===2?'#f74f160e':'#f17e1d0b');
      ctx.fillStyle=glow;ctx.fillRect(0,H*.48,W,H*.52);
    }
  }
  window.drawAshenBackdrop=function(ctx,stage,camera,frame,W,H){
    const image=images[stage];
    if(!image?.complete||!image.naturalWidth)return false;
    const baseW=W*1.15,baseH=H*1.15,maxPan=baseW-W;
    const progress=Math.max(0,Math.min(1,camera/1348));
    ctx.save();
    ctx.imageSmoothingEnabled=true;
    ctx.imageSmoothingQuality='high';
    ctx.drawImage(image,-maxPan*progress*(parallaxOn()?1:.3),-(baseH-H)*.56,baseW,baseH);
    if(parallaxOn())midground(ctx,stage,camera,W,H);
    const grade=ctx.createLinearGradient(0,H*.45,0,H);
    grade.addColorStop(0,'#0d111900');
    grade.addColorStop(.56,stage===1?'#0d191017':'#120f1214');
    grade.addColorStop(1,stage===1?'#07100a23':'#110b0925');
    ctx.fillStyle=grade;ctx.fillRect(0,H*.45,W,H*.55);
    driftingFog(ctx,stage,camera,frame,W,H);
    groundDetails(ctx,stage,camera,W,H);
    atmosphere(ctx,stage,camera,frame,W,H);
    vignette(ctx,W,H);
    ctx.restore();
    return true;
  };
  window.ASHEN_ENVIRONMENT_STATUS=()=>images.map((img,i)=>({stage:i+1,ready:img.complete&&img.naturalWidth>0,width:img.naturalWidth,height:img.naturalHeight}));
})();