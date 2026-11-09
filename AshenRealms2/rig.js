/* Ashen Realms 2 — procedural hero rig (V2.1)
 * Every hero is a small animated skeleton (two-bone IK limbs, keyframed poses, spring-driven
 * cloth and hair) drawn to a low-resolution canvas, then hard-edged and outlined so it sits
 * next to the pixel-art enemies. Poses use "rig pixels": x forward, y down, origin between the
 * feet on the ground. The game scales the result by AshenRig.S.
 */
(()=>{'use strict';
const S=3,CW=176,CH=136,OX=88,OY=112;
const cv=document.createElement('canvas');cv.width=CW;cv.height=CH;
const c=cv.getContext('2d',{willReadFrequently:true});
const OUT='#140b10',PI2=Math.PI*2;
const lerp=(a,b,u)=>a+(b-a)*u,clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const wrapAng=a=>{a=(a+Math.PI)%PI2;if(a<0)a+=PI2;return a-Math.PI};
const EASE={lin:u=>u,io:u=>u*u*(3-2*u),out:u=>1-(1-u)*(1-u),out3:u=>1-Math.pow(1-u,3),in:u=>u*u,in3:u=>u*u*u};

// ---------- pose model ----------
// rx,ry pelvis offset (ry>0 sinks) · lean torso lean · head extra head tilt · fx,fy / bx,by front/back ankle targets
// hx,hy weapon-hand target · wa weapon angle (0 = forward, +cw) · ox,oy off-hand target · sa shield angle
// rot,rcy whole-body rotation about (0,rcy) · glow 0..1 weapon/spell glow
const BASE={rx:0,ry:0,lean:.1,head:0,fx:7,fy:0,bx:-7,by:0,hx:12,hy:-30,wa:-.6,ox:5,oy:-28,sa:0,rot:0,rcy:-16,glow:0};
const KEYS=Object.keys(BASE);
const K=(t,o,e)=>[t,o||{},e];
function sample(base,keys,p){
 p=clamp(p,0,1);let i=0;while(i<keys.length-2&&p>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],u=EASE[b[2]||'io'](clamp((p-a[0])/((b[0]-a[0])||1),0,1)),out={};
 for(const k of KEYS)out[k]=lerp(a[1][k]??base[k],b[1][k]??base[k],u);
 return out;
}
function mix(a,b,u){ // blend two poses (u=0 -> a, u=1 -> b), angles by shortest path
 const o={};for(const k of KEYS){
  if(k==='wa'||k==='rot')o[k]=a[k]+wrapAng(b[k]-a[k])*u;else o[k]=lerp(a[k],b[k],u);
 }return o;
}

// ---------- drawing helpers ----------
function ln(x1,y1,x2,y2,w,col){c.lineCap='round';c.lineJoin='round';c.strokeStyle=OUT;c.lineWidth=w+1.5;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.strokeStyle=col;c.lineWidth=w;c.stroke()}
function hl(x1,y1,x2,y2,w,col){c.lineCap='round';c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke()}
function pl(pts,col,lw=1.3,out=true){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.closePath();c.lineJoin='round';if(out){c.strokeStyle=OUT;c.lineWidth=lw;c.stroke()}c.fillStyle=col;c.fill()}
function ci(x,y,r,col,lw=1.3){c.beginPath();c.arc(x,y,r,0,PI2);c.strokeStyle=OUT;c.lineWidth=lw;c.stroke();c.fillStyle=col;c.fill()}
function rect(x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
// limb with a thin highlight on its lit side
function limb(x1,y1,x2,y2,w,col,hi){
 ln(x1,y1,x2,y2,w,col);if(!hi)return;
 const dx=x2-x1,dy=y2-y1,l=Math.hypot(dx,dy)||1;let nx=-dy/l,ny=dx/l;if(nx*.5-ny*.8<0){nx=-nx;ny=-ny}
 const o=w*.2;hl(x1+nx*o,y1+ny*o,x2+nx*o,y2+ny*o,Math.max(.8,w*.3),hi);
}
function ik(x0,y0,x1,y1,l1,l2,dir){
 let dx=x1-x0,dy=y1-y0,d=Math.hypot(dx,dy);const max=l1+l2-.02;
 if(d>max){const s=max/d;dx*=s;dy*=s;d=max;x1=x0+dx;y1=y0+dy}
 const min=Math.abs(l1-l2)+.05;if(d<min)d=min;
 const ux=dx/(d||1),uy=dy/(d||1),a=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-a*a));
 return {kx:x0+ux*a+uy*h*dir,ky:y0+uy*a-ux*h*dir,ex:x1,ey:y1};
}
// cloth / hair ribbon through simulated points (already in draw space)
function ribbon(pts,ws,col,dark,hi){
 if(!pts||pts.length<2)return;const L=[],R=[];
 for(let i=0;i<pts.length;i++){
  const a=pts[Math.max(0,i-1)],b=pts[Math.min(pts.length-1,i+1)];let dx=b.x-a.x,dy=b.y-a.y;const l=Math.hypot(dx,dy)||1;
  const nx=-dy/l,ny=dx/l,w=(ws[Math.min(i,ws.length-1)])/2;
  L.push([pts[i].x+nx*w,pts[i].y+ny*w]);R.push([pts[i].x-nx*w,pts[i].y-ny*w]);
 }
 pl(L.concat(R.reverse()),col,1.3);
 if(dark){c.strokeStyle=dark;c.lineWidth=1;c.beginPath();c.moveTo(pts[0].x,pts[0].y);for(let i=1;i<pts.length;i++)c.lineTo(pts[i].x,pts[i].y);c.stroke()}
 if(hi){hl(L[0][0],L[0][1],L[Math.floor(L.length/2)][0],L[Math.floor(L.length/2)][1],.9,hi)}
}
function boot(l,col,cuff){
 const x=l.ex,y=l.ey;
 pl([[x-2.3,y-1.6],[x+.4,y-2.5],[x+4.9,y-.5],[x+5.2,y+2.1],[x-2.6,y+2.1]],col);
 if(cuff)ln(x-1.2,y-2.7,x+.9,y-2.7,3.3,cuff);
}
function arm(s,a,up,fore,w1,w2,hand,hr,hiU,hiF){
 limb(s.x,s.y,a.kx,a.ky,w1,up,hiU);limb(a.kx,a.ky,a.ex,a.ey,w2,fore,hiF);ci(a.ex,a.ey,hr,hand);
}

// ---------- hero definitions ----------
const HEROES={};
const def=(id,o)=>{o.base={...BASE,...o.base};HEROES[id]=o};

// ===== ASTRID — spear =====
def('astrid',{
 name:'ASTRID',legs:[11,11],hipH:20.7,torso:13,neck:7.2,arm:[8,8],two:true,grip:12,stride:10,tipLen:40,innerLen:24,
 base:{lean:.12,fx:8,bx:-8,hx:13,hy:-29,wa:-.55,ry:.6},
 pal:{hair:'#c4571f',hairD:'#8d3b17',skin:'#f2c8aa',skinD:'#d29d84',silver:'#cfd8e3',silverL:'#f2f7fb',silverD:'#7e8b9c',leather:'#7b4a2c',leatherD:'#4c2e1c',teal:'#2d9296',tealD:'#1d5f66',gold:'#e8bb58',leg:'#2f3f57',legD:'#222e42',boot:'#6a4430',bootD:'#47291b',wood:'#936036',red:'#d3352d',steel:'#e4edf5'},
 tails:{scarf:{n:4,len:3.6,w:[3.4,3,2.5,1.8],o:{g:.16,damp:.88,back:.03}},pony:{n:3,len:4.6,w:[3.8,3.4,2.2],o:{g:.18,damp:.9,back:.035}},pen:{n:3,len:3.1,w:[2.8,2.2,1.4],o:{g:.08,damp:.86,back:.06}}},
 anchors(k){
  const {sh,n,u}=k;
  return {scarf:{x:sh.x+u.x*2.5-n.x*2.4,y:sh.y+u.y*2.5-n.y*2.4},pony:this.headPt(k,-4.5,-1.8),pen:{x:k.af.ex+k.wd.x*27,y:k.af.ey+k.wd.y*27}};
 },
 headPt(k,lx,ly){const a=k.ha*.7,s=Math.sin(a),co=Math.cos(a);return {x:k.hd.x+co*lx-s*ly,y:k.hd.y+s*lx+co*ly}},
 anim:{
  L1:[K(0),K(.18,{rx:-2,lean:.02,hx:5,hy:-27,wa:-.3,fx:6,bx:-10}),K(.40,{rx:5,lean:.34,hx:21,hy:-30,wa:-.04,fx:16,bx:-7},'out3'),K(.64,{rx:5,lean:.32,hx:22,hy:-30,wa:-.04,fx:16,bx:-7},'lin'),K(1)],
  L2:[K(0),K(.2,{rx:-2,lean:.05,hx:6,hy:-21,wa:.25,fx:6,bx:-10}),K(.42,{rx:5,lean:.3,hx:21,hy:-34,wa:-.3,fx:16,bx:-7},'out3'),K(.64,{rx:5,lean:.28,hx:22,hy:-34,wa:-.3,fx:16,bx:-7},'lin'),K(1)],
  L3:[K(0),K(.14,{rx:-2,ry:2,lean:.2,hx:8,hy:-26,wa:.6,fx:7,bx:-9}),K(.30,{ry:1,lean:.05,hx:9,hy:-34,wa:-1.6},'lin'),K(.5,{lean:-.05,hx:9,hy:-33,wa:-3.14},'lin'),K(.68,{rx:2,lean:.1,hx:9,hy:-30,wa:-4.71},'lin'),K(.85,{rx:4,lean:.2,hx:13,hy:-29,wa:-6.28,fx:12},'lin'),K(1,{wa:-6.83},'out')],
  H:[K(0),K(.25,{ry:4,rx:-4,lean:-.05,fx:4,bx:-12,hx:3,hy:-22,wa:-.2}),K(.42,{ry:-1,rx:10,lean:.5,fx:22,bx:-3,by:-3,hx:23,hy:-26,wa:.05},'out3'),K(.68,{rx:10,lean:.46,fx:22,bx:-3,hx:23,hy:-26,wa:.05},'lin'),K(1)],
  F:[K(0),K(.08,{rx:-1,hx:6,hy:-28,wa:-.2,lean:.1}),K(.12,{rx:4,lean:.28,hx:21,hy:-30,wa:-.04,fx:15,bx:-7},'out3'),K(.22,{rx:1,hx:9,hy:-28,wa:-.1,lean:.15}),K(.30,{rx:5,lean:.3,hx:22,hy:-34,wa:-.25,fx:16,bx:-7},'out3'),K(.40,{rx:1,hx:9,hy:-26,wa:0,lean:.15}),K(.50,{rx:5,lean:.3,hx:22,hy:-26,wa:.1,fx:16,bx:-7},'out3'),K(.62,{rx:-3,ry:3,lean:0,hx:3,hy:-24,wa:-.1,fx:5,bx:-12}),K(.78,{rx:12,ry:-1,lean:.55,hx:25,hy:-29,wa:-.02,fx:23,bx:-2,by:-3},'out3'),K(.92,{rx:12,lean:.5,hx:25,hy:-29,wa:-.02,fx:23,bx:-2,by:-3},'lin'),K(1)],
  M:[K(0),K(.3,{ry:-1,lean:-.08,hx:7,hy:-42,wa:-1.48,glow:1}),K(.45,{ry:3,rx:3,lean:.45,hx:17,hy:-34,wa:1,glow:1,fx:14},'out3'),K(.7,{ry:3,rx:3,lean:.42,hx:17,hy:-34,wa:1,glow:.7,fx:14},'lin'),K(1,{glow:0})]
 },
 draw(k,T){
  const {P,pv,sh,hd,n,u,lf,lb,af,ab,wd}=k,C=this.pal,A=(t,o)=>[pv.x+(sh.x-pv.x)*t+n.x*o,pv.y+(sh.y-pv.y)*t+n.y*o];
  ribbon(T.scarf,this.tails.scarf.w,C.teal,C.tealD,'#5ec6c9');
  limb(k.hipB.x,k.hipB.y,lb.kx,lb.ky,4.4,C.legD);limb(lb.kx,lb.ky,lb.ex,lb.ey,3.9,C.bootD);ci(lb.kx+.5,lb.ky,2,C.silverD,1);boot(lb,C.bootD,C.silverD);
  const sw=clamp((P.fx+P.bx)*.12,-2.5,2.5);
  pl([A(0,-3.6),A(0,1),[pv.x+sw-.2,pv.y+6.8],[pv.x+sw-5,pv.y+6.3]],C.tealD);
  pl([A(0,-3.7),A(0,3.7),A(.5,4.3),A(1,4.5),A(1,-4.5),A(.5,-4.3)],C.leather);
  pl([A(.42,4.8),A(.98,4.9),A(1.03,-1.4),A(.46,-1.7)],C.silver);hl(...A(.5,3.9),...A(.95,4.1),.9,C.silverL);
  ln(...A(.07,-3.9),...A(.07,4),1.7,C.gold);
  limb(k.hipF.x,k.hipF.y,lf.kx,lf.ky,4.6,C.leg,'#4a5d7a');limb(lf.kx,lf.ky,lf.ex,lf.ey,4,C.boot,'#8a5c42');ci(lf.kx+.6,lf.ky,2.2,C.silver,1);hl(lf.kx,lf.ky-.8,lf.kx+1,lf.ky-.8,.8,C.silverL);boot(lf,C.boot,C.silver);
  pl([A(0,.5),A(0,4.2),[pv.x+sw+5.2,pv.y+6.2],[pv.x+sw+.4,pv.y+7]],C.teal);ln(pv.x+sw+.6,pv.y+6.6,pv.x+sw+5,pv.y+6,.9,C.gold);
  limb(sh.x,sh.y,hd.x,hd.y,3.3,C.skinD);
  ribbon(T.pony,this.tails.pony.w,C.hair,C.hairD,'#e2793a');
  c.save();c.translate(hd.x,hd.y);c.rotate(k.ha*.7);
  ci(-1.5,-.6,5.1,C.hair,1.2);ci(.6,.5,4.3,C.skin,1.2);
  pl([[-3.4,-3.9],[2,-4.8],[4.5,-2.7],[3.1,-2.5],[1.1,-3.1],[-1,-1.4],[-3.4,-1.6]],C.hair,1);
  hl(-3.5,-1.9,4.4,-1.9,1,C.silver);rect(2.2,-.5,1.3,1.5,'#1b1118');rect(2.8,2.3,1.5,.7,'#b5604f');
  c.restore();
  // spear (two-handed)
  c.save();c.translate(af.ex,af.ey);c.rotate(P.wa);
  ln(-32,0,26,0,1.9,C.wood);hl(-30,-.4,24,-.4,.6,'#b98a5a');ci(-32,0,1.6,C.gold,1);
  ln(-6,0,-2,0,2.4,C.leatherD);
  const g=P.glow;pl([[25,0],[29.5,-3.3],[39,0],[29.5,3.3]],g>.2?C.silverL:C.steel);hl(26,-.2,37,-.2,.8,'#ffffff');
  pl([[24,-1.2],[26,-1.2],[26,1.2],[24,1.2]],C.gold,1);
  c.restore();
  ribbon(T.pen,this.tails.pen.w,C.red,'#8e1f1a','#ff7a66');
  arm(k.shB,ab,C.skinD,C.silverD,3.2,3.4,'#6b4a35',1.8);
  arm(k.shF,af,C.skin,C.silver,3.4,3.7,C.leatherD,1.9,C.skinD?'#fbe3d0':null,C.silverL);
  ci(k.shF.x+.2,k.shF.y-.2,3.2,C.silver,1.2);hl(k.shF.x-1,k.shF.y-1.5,k.shF.x+1.6,k.shF.y-1.7,.9,C.silverL);
 }
});

// ===== IRON WARDEN — sword & shield =====
def('warden',{
 name:'IRON WARDEN',legs:[11.5,11.5],hipH:21,torso:13.6,neck:7.2,arm:[8.2,8.2],two:false,grip:0,stride:10,tipLen:25,innerLen:11,
 base:{lean:.1,fx:7,bx:-7,hx:13,hy:-28,wa:-.9,ox:9,oy:-26},
 pal:{steel:'#a4b0c0',steelL:'#dbe3ee',steelD:'#5c6779',tunic:'#932f3b',tunicD:'#62202a',cape:'#2e62ae',capeD:'#1d4079',gold:'#e3b85a',skin:'#e3b392',skinD:'#bf8a6b',hair:'#5a3a24',boot:'#3d2f2c',blade:'#e6eef7',wood:'#6b4a2d'},
 tails:{cape:{n:5,len:4.6,w:[6,8,10,11,11],o:{g:.2,damp:.9,back:.05}}},
 anchors(k){const {sh,n,u}=k;return {cape:{x:sh.x-n.x*4.2-u.x*1.5,y:sh.y-n.y*4.2-u.y*1.5}}},
 anim:{
  L1:[K(0),K(.2,{rx:-2,lean:-.08,hx:4,hy:-34,wa:-2.3,fx:6,bx:-9}),K(.42,{rx:4,lean:.3,hx:17,hy:-27,wa:.15,fx:14,bx:-7,ox:12},'out3'),K(.64,{rx:4,lean:.28,hx:17,hy:-27,wa:.35,fx:14,bx:-7,ox:12},'lin'),K(1)],
  L2:[K(0),K(.2,{rx:-1,lean:.08,hx:11,hy:-21,wa:.95,fx:6,bx:-9}),K(.42,{rx:5,lean:.28,hx:17,hy:-35,wa:-1.15,fx:14,bx:-7},'out3'),K(.64,{rx:5,lean:.26,hx:17,hy:-35,wa:-1.3,fx:14,bx:-7},'lin'),K(1)],
  L3:[K(0),K(.25,{rx:-3,lean:-.2,hx:5,hy:-43,wa:-2.6,fx:5,bx:-10,ox:5,oy:-33}),K(.45,{rx:8,lean:.45,hx:18,hy:-25,wa:.55,fx:18,bx:-5,ox:14,oy:-24},'out3'),K(.68,{rx:8,lean:.42,hx:18,hy:-25,wa:.85,fx:18,bx:-5,ox:14,oy:-24},'lin'),K(1)],
  H:[K(0),K(.28,{rx:-4,ry:-1,lean:-.3,hx:4,hy:-45,wa:-2.9,fx:4,bx:-10,ox:4,oy:-34}),K(.42,{rx:9,ry:3,lean:.5,hx:20,hy:-18,wa:1.1,fx:21,bx:-4,ox:14,oy:-22},'out3'),K(.68,{rx:9,ry:3,lean:.48,hx:20,hy:-18,wa:1.15,fx:21,bx:-4,ox:14,oy:-22},'lin'),K(1)],
  F:[K(0),K(.12,{rx:-2,lean:-.1,hx:8,hy:-22,wa:.8,ox:-1,oy:-27,fx:5,bx:-9}),K(.22,{rx:6,lean:.3,hx:8,hy:-22,wa:.8,ox:21,oy:-28,fx:15,bx:-6,sa:.15},'out3'),K(.42,{rx:5,lean:.2,hx:9,hy:-20,wa:1,ox:14,oy:-27,fx:14}),K(.52,{rx:3,ry:2,lean:.05,hx:9,hy:-17,wa:1.35,ox:8,oy:-27,fx:11,bx:-9}),K(.68,{rx:7,ry:-1,lean:-.12,hx:13,hy:-40,wa:-1.5,ox:6,oy:-30,fx:15,bx:-5},'out3'),K(.88,{rx:7,ry:-1,lean:-.1,hx:13,hy:-40,wa:-1.5,ox:6,oy:-30,fx:15,bx:-5},'lin'),K(1)],
  M:[K(0),K(.3,{ry:-1,lean:-.1,hx:8,hy:-44,wa:-1.57,ox:6,oy:-40,glow:1}),K(.5,{ry:5,rx:5,lean:.5,hx:13,hy:-15,wa:1.5,ox:9,oy:-20,glow:1,fx:12,bx:-6},'out3'),K(.76,{ry:5,rx:5,lean:.48,hx:13,hy:-15,wa:1.5,ox:9,oy:-20,glow:.5,fx:12,bx:-6},'lin'),K(1,{glow:0})]
 },
 draw(k,T){
  const {P,pv,sh,hd,n,lf,lb,af,ab}=k,C=this.pal,A=(t,o)=>[pv.x+(sh.x-pv.x)*t+n.x*o,pv.y+(sh.y-pv.y)*t+n.y*o];
  ribbon(T.cape,this.tails.cape.w,C.cape,C.capeD,'#5b8fd6');
  limb(k.hipB.x,k.hipB.y,lb.kx,lb.ky,4.6,C.steelD);limb(lb.kx,lb.ky,lb.ex,lb.ey,4.1,C.steelD);ci(lb.kx+.5,lb.ky,2,C.steelD,1);boot(lb,C.boot);
  pl([A(0,-4),A(0,4),A(.5,4.6),A(1,4.9),A(1,-4.9),A(.5,-4.6)],C.tunic);
  pl([A(.3,5.1),A(1,5.3),A(1.03,-2),A(.34,-2.4)],C.steel);hl(...A(.4,4.2),...A(.95,4.4),1,C.steelL);ln(...A(.3,-2.2),...A(.3,5.2),1.2,C.gold);
  limb(k.hipF.x,k.hipF.y,lf.kx,lf.ky,4.8,C.steel,C.steelL);limb(lf.kx,lf.ky,lf.ex,lf.ey,4.2,C.steel,C.steelL);ci(lf.kx+.6,lf.ky,2.4,C.steelL,1);boot(lf,C.boot,C.gold);
  const sw=clamp((P.fx+P.bx)*.12,-2.5,2.5);
  pl([A(0,.5),A(0,4.4),[pv.x+sw+5.6,pv.y+7],[pv.x+sw+.2,pv.y+8]],C.tunic);ln(pv.x+sw+.4,pv.y+7.6,pv.x+sw+5.4,pv.y+6.8,1,C.gold);
  limb(sh.x,sh.y,hd.x,hd.y,3.6,C.skinD);
  c.save();c.translate(hd.x,hd.y);c.rotate(k.ha*.7);
  ci(.4,.4,4.5,C.skin,1.2);
  pl([[1,2.3],[4.8,1.2],[4.6,4.8],[2,6.8],[-.6,4.8]],C.hair,1);
  pl([[-5,.4],[-4.4,-4.6],[0,-6.3],[3.9,-4.8],[4.6,-2.2],[1.2,-2.6],[-1,-.6]],C.steel,1.2);hl(-3,-4.8,2.6,-5.4,.9,C.steelL);
  pl([[-4,-3.2],[4.4,-3.2],[4.6,-4.4],[3.2,-6.8],[1.6,-4.8],[0,-7.4],[-1.6,-4.8],[-3.2,-6.6],[-4.2,-4.4]],C.gold,1);
  rect(2.3,-.6,1.3,1.5,'#1b1118');
  c.restore();
  // shield (off hand, in front of torso)
  arm(k.shB,ab,C.steelD,C.steel,3.4,3.6,C.steelD,1.9);
  c.save();c.translate(ab.ex+1.2,ab.ey);c.rotate(P.sa);
  pl([[-1.4,-9],[2.6,-8],[3.2,1.5],[.6,10],[-2,1.5]],C.cape,1.4);pl([[-.4,-7.4],[1.8,-6.8],[2.2,1],[.5,7.6],[-1,1]],C.capeD,.8,false);
  ln(.3,-4,.5,5,1.2,C.gold);ci(.9,0,1.6,C.gold,1);c.restore();
  // sword
  c.save();c.translate(af.ex,af.ey);c.rotate(P.wa);
  ln(-5,0,2,0,2,'#3a2a22');ci(-5.4,0,1.5,C.gold,1);pl([[1.5,-3.6],[3.2,-3.6],[3.2,3.6],[1.5,3.6]],C.gold,1);
  pl([[3,-1.6],[22,-1.6],[25.4,0],[22,1.6],[3,1.6]],C.blade,1.1);hl(4,-.6,22,-.6,.8,'#ffffff');hl(4,.7,21,.7,.7,'#9fb0c4');
  c.restore();
  arm(k.shF,af,C.steel,C.steel,3.5,3.8,C.steelD,2,C.steelL,C.steelL);
  ci(k.shF.x+.3,k.shF.y-.3,3.9,C.steel,1.3);hl(k.shF.x-1.6,k.shF.y-2,k.shF.x+2,k.shF.y-2.2,1,C.steelL);ln(k.shF.x-2.6,k.shF.y+1.2,k.shF.x+3,k.shF.y+1.2,.9,C.gold);
 }
});

// ===== ASH BERSERKER — greataxe =====
def('berserker',{
 name:'ASH BERSERKER',legs:[12,12],hipH:22.4,torso:14.6,neck:7.6,arm:[9,9],two:true,grip:9,stride:11,tipLen:34,innerLen:21,
 base:{lean:.14,fx:9,bx:-9,hx:12,hy:-26,wa:-1,ry:.6},
 pal:{skin:'#c98f68',skinD:'#9d6a4a',skinL:'#e2ab83',iron:'#626874',ironL:'#9aa1ad',ironD:'#30343d',leather:'#43302a',leatherD:'#2a1c18',fur:'#8d6c49',furD:'#5f4730',paint:'#b5342a',beard:'#7a3d22',bone:'#e6dac2',ember:'#e8742c',emberD:'#a8431a',wood:'#5b3d27',blade:'#a6aebb'},
 tails:{scarf:{n:5,len:4,w:[4,4.2,3.6,3,2.2],o:{g:.14,damp:.88,back:.04}}},
 anchors(k){const {sh,n,u}=k;return {scarf:{x:sh.x+u.x*1.2-n.x*3.8,y:sh.y+u.y*1.2-n.y*3.8}}},
 anim:{
  L1:[K(0),K(.25,{rx:-3,lean:-.18,hx:3,hy:-36,wa:-2.4,fx:7,bx:-11}),K(.45,{rx:6,lean:.38,hx:18,hy:-28,wa:.3,fx:16,bx:-8},'out3'),K(.68,{rx:6,lean:.36,hx:18,hy:-28,wa:.6,fx:16,bx:-8},'lin'),K(1)],
  L2:[K(0),K(.25,{rx:-2,ry:2,lean:.1,hx:6,hy:-18,wa:1,fx:7,bx:-11}),K(.45,{rx:6,lean:.32,hx:17,hy:-38,wa:-.9,fx:16,bx:-8},'out3'),K(.68,{rx:6,lean:.3,hx:17,hy:-38,wa:-1.1,fx:16,bx:-8},'lin'),K(1)],
  L3:[K(0),K(.14,{rx:-3,ry:2,lean:.2,hx:8,hy:-26,wa:.8,fx:8,bx:-10}),K(.30,{lean:.05,hx:9,hy:-33,wa:-1.6},'lin'),K(.5,{lean:-.05,hx:9,hy:-32,wa:-3.14},'lin'),K(.68,{rx:2,lean:.1,hx:9,hy:-29,wa:-4.71},'lin'),K(.85,{rx:5,lean:.3,hx:13,hy:-28,wa:-6.28,fx:14},'lin'),K(1,{wa:-7.28},'out')],
  H:[K(0),K(.3,{rx:-4,ry:-1,lean:-.35,hx:3,hy:-46,wa:-2.2,fx:6,bx:-11}),K(.45,{rx:9,ry:4,lean:.6,hx:19,hy:-16,wa:1.2,fx:18,bx:-6},'out3'),K(.72,{rx:9,ry:4,lean:.58,hx:19,hy:-16,wa:1.2,fx:18,bx:-6},'lin'),K(1)],
  F:[K(0),K(.25,{rx:-3,ry:-1,lean:-.4,hx:4,hy:-48,wa:-2,fx:6,bx:-11}),K(.42,{rx:-3,ry:2,lean:-.4,hx:4,hy:-49,wa:-2.05,fx:6,bx:-11},'lin'),K(.52,{rx:10,ry:6,lean:.7,hx:20,hy:-12,wa:1.35,fx:20,bx:-6},'out3'),K(.82,{rx:10,ry:6,lean:.68,hx:20,hy:-12,wa:1.35,fx:20,bx:-6},'lin'),K(1)],
  M:[K(0),K(.3,{rx:-2,lean:-.28,head:-.35,hx:6,hy:-44,wa:-1.4,glow:1,fx:8,bx:-10}),K(.48,{rx:-1,lean:-.3,head:-.4,hx:7,hy:-46,wa:-1.5,glow:1,fx:8,bx:-10}),K(.76,{rx:-1,lean:-.28,head:-.35,hx:7,hy:-46,wa:-1.5,glow:.6,fx:8,bx:-10},'lin'),K(1,{glow:0})]
 },
 draw(k,T){
  const {P,pv,sh,hd,n,lf,lb,af,ab}=k,C=this.pal,A=(t,o)=>[pv.x+(sh.x-pv.x)*t+n.x*o,pv.y+(sh.y-pv.y)*t+n.y*o];
  ribbon(T.scarf,this.tails.scarf.w,C.ember,C.emberD,'#f6a04e');
  limb(k.hipB.x,k.hipB.y,lb.kx,lb.ky,5.4,C.leatherD);limb(lb.kx,lb.ky,lb.ex,lb.ey,4.8,C.furD);boot(lb,C.leatherD,C.furD);
  const sw=clamp((P.fx+P.bx)*.12,-2.5,2.5);
  pl([A(0,-4),A(0,1.4),[pv.x+sw-.2,pv.y+7],[pv.x+sw-5.4,pv.y+6.4]],C.leatherD);
  pl([A(0,-4.6),A(0,4.6),A(.5,5.5),A(1,6),A(1,-6),A(.5,-5.5)],C.skin);
  hl(...A(.55,4.8),...A(.92,5.1),1.2,C.skinL);
  ln(...A(.4,-.5),...A(.7,4),1.1,C.paint);ln(...A(.55,-.6),...A(.85,3.6),1.1,C.paint);
  ln(...A(.02,-4.6),...A(.98,5.8),1.8,C.leather);ln(...A(.98,-5.6),...A(.05,4.6),1.6,C.leather);
  ln(...A(.05,-4.8),...A(.05,4.8),2.6,C.leather);ci(...A(.05,0.2),1.1,C.ironL,.7);
  limb(k.hipF.x,k.hipF.y,lf.kx,lf.ky,5.6,C.leather,'#6a4c40');limb(lf.kx,lf.ky,lf.ex,lf.ey,5,C.fur,'#b08c63');boot(lf,C.leather,C.fur);
  ln(lf.ex-2,lf.ey-3.5,lf.ex+1.8,lf.ey-3.5,3.4,C.fur);
  pl([A(0,.4),A(0,5),[pv.x+sw+6,pv.y+7.8],[pv.x+sw+.2,pv.y+8.6]],C.leather);ln(pv.x+sw+.5,pv.y+8,pv.x+sw+5.8,pv.y+7.3,.9,C.ironL);
  limb(sh.x,sh.y,hd.x,hd.y,4.2,C.skinD);
  // fur mantle
  pl([A(.9,-6.4),A(1.12,-3),A(1.18,1.5),A(1.02,6.6),A(.84,6.2),A(.88,2)],C.fur,1.2);
  c.save();c.translate(hd.x,hd.y);c.rotate(k.ha*.7);
  ci(.4,.5,4.9,C.skin,1.2);
  pl([[1.4,2.4],[5.2,1.4],[5.8,5.4],[3,8.6],[-.2,5.6]],C.beard,1);
  ln(.6,-1.4,4.2,1.6,1,C.paint);
  pl([[-5.6,.8],[-5,-4.6],[-.4,-6.8],[4.4,-5],[5,-2.8],[1.4,-3.2],[-1.4,-1]],C.iron,1.2);hl(-3.4,-5,2.6,-5.8,1,C.ironL);
  // horns
  c.beginPath();c.moveTo(-3.6,-5.2);c.quadraticCurveTo(-8.5,-6.5,-7.4,-12);c.lineTo(-5.8,-6.2);c.closePath();c.strokeStyle=OUT;c.lineWidth=1.2;c.stroke();c.fillStyle=C.bone;c.fill();
  c.beginPath();c.moveTo(2.4,-6);c.quadraticCurveTo(7,-7.5,6.4,-12.5);c.lineTo(4.4,-6.4);c.closePath();c.strokeStyle=OUT;c.lineWidth=1.2;c.stroke();c.fillStyle=C.bone;c.fill();
  rect(2.5,-.6,1.4,1.5,'#f6e9c8');rect(3.1,-.4,.8,1,'#1b1118');
  c.restore();
  // greataxe (two-handed)
  c.save();c.translate(af.ex,af.ey);c.rotate(P.wa);
  ln(-12,0,30,0,2.5,C.wood);hl(-10,-.6,28,-.6,.7,'#8a6240');ln(-4,0,4,0,2.9,C.leatherD);
  pl([[19,-2],[22,-8.6],[28,-12.5],[34,-9.6],[35.6,-3],[34,3.4],[30,2.6],[24,1.4]],C.blade,1.3);
  pl([[22,2],[27,3],[27.4,7.6],[22.5,6]],C.ironD,1);hl(26,-10.6,34,-8,1,'#ffffff');hl(33.4,-6,34.4,1,.8,'#e9eef5');
  pl([[19,-1.4],[16,-4.4],[18,-.2]],C.ironL,.9);
  c.restore();
  arm(k.shB,ab,C.skinD,C.iron,4,4.3,C.leatherD,2.2);
  arm(k.shF,af,C.skin,C.iron,4.2,4.5,C.leatherD,2.3,C.skinL,C.ironL);
  pl([[k.shF.x-4.6,k.shF.y+1.4],[k.shF.x-3.6,k.shF.y-4.2],[k.shF.x+3.4,k.shF.y-4],[k.shF.x+4.6,k.shF.y+1.6],[k.shF.x,k.shF.y+3]],C.iron,1.3);
  hl(k.shF.x-3,k.shF.y-3.2,k.shF.x+2.6,k.shF.y-3.2,1,C.ironL);pl([[k.shF.x-1,k.shF.y-4],[k.shF.x,k.shF.y-8.2],[k.shF.x+1.4,k.shF.y-4]],C.ironL,.9);
 }
});

// ===== MOONBLADE — curved saber =====
def('moonblade',{
 name:'MOONBLADE',legs:[11.6,11.6],hipH:21.3,torso:13.3,neck:7.2,arm:[8.2,8.2],two:false,grip:0,stride:10.5,tipLen:26,innerLen:11,
 base:{lean:.1,fx:8,bx:-8,hx:14,hy:-28,wa:-.2,ox:-3,oy:-31},
 pal:{cloak:'#5a47a8',cloakD:'#33276f',lining:'#47c4cc',hair:'#dfe6f6',hairD:'#9aa6c6',skin:'#ead0ba',skinD:'#c4a28e',leather:'#2f2d41',leatherD:'#1f1e2e',silver:'#b8c0dc',silverL:'#eef1ff',boot:'#26243a',blade:'#e3f0ff',glow:'#8fd8ff'},
 tails:{cloak:{n:5,len:5,w:[5,7.5,10,12,12],o:{g:.17,damp:.9,back:.05}}},
 anchors(k){const {sh,n,u}=k;return {cloak:{x:sh.x-n.x*3.6-u.x*1,y:sh.y-n.y*3.6-u.y*1}}},
 anim:{
  L1:[K(0),K(.2,{rx:-2,lean:-.12,hx:5,hy:-38,wa:-2,fx:6,bx:-10,ox:-6,oy:-30}),K(.4,{rx:5,lean:.32,hx:18,hy:-24,wa:.45,fx:15,bx:-7,ox:-5,oy:-33},'out3'),K(.62,{rx:5,lean:.3,hx:18,hy:-24,wa:.6,fx:15,bx:-7},'lin'),K(1)],
  L2:[K(0),K(.2,{rx:-1,lean:.08,hx:13,hy:-19,wa:.85,fx:6,bx:-10}),K(.42,{rx:5,lean:.22,hx:17,hy:-38,wa:-1.1,fx:15,bx:-7},'out3'),K(.64,{rx:5,lean:.2,hx:17,hy:-38,wa:-1.25,fx:15,bx:-7},'lin'),K(1)],
  L3:[K(0),K(.15,{rx:-2,lean:-.05,hx:4,hy:-30,wa:-.9,ox:-6,oy:-30,fx:6,bx:-10}),K(.3,{rx:5,lean:.3,hx:19,hy:-29,wa:.1,fx:15,bx:-6},'out3'),K(.42,{rx:2,lean:.1,hx:7,hy:-32,wa:-1,fx:11}),K(.6,{rx:7,lean:.34,hx:20,hy:-26,wa:.4,fx:17,bx:-5},'out3'),K(.82,{rx:7,lean:.32,hx:20,hy:-26,wa:.5,fx:17,bx:-5},'lin'),K(1)],
  H:[K(0),K(.25,{rx:-5,ry:3,lean:-.05,hx:2,hy:-26,wa:-.1,fx:3,bx:-12,ox:-8,oy:-27}),K(.42,{rx:12,ry:1,lean:.6,hx:25,hy:-26,wa:.05,fx:23,bx:-2,by:-4,ox:-8,oy:-28},'out3'),K(.66,{rx:12,ry:1,lean:.58,hx:25,hy:-26,wa:.05,fx:23,bx:-2,by:-4,ox:-8,oy:-28},'lin'),K(1)],
  F:[K(0),K(.12,{rx:-2,ry:2,lean:.2,hx:8,hy:-26,wa:.7,fx:7,bx:-9,glow:.4}),K(.28,{lean:.05,hx:9,hy:-33,wa:-1.6,glow:1},'lin'),K(.45,{lean:-.05,hx:9,hy:-32,wa:-3.14,glow:1},'lin'),K(.62,{rx:2,lean:.1,hx:9,hy:-29,wa:-4.71,glow:1},'lin'),K(.8,{rx:5,lean:.3,hx:14,hy:-28,wa:-6.28,fx:14,glow:1},'lin'),K(1,{wa:-6.48,glow:0},'out')],
  M:[K(0),K(.3,{rx:-2,lean:-.1,hx:10,hy:-40,wa:-1.2,ox:8,oy:-43,glow:1}),K(.46,{rx:5,lean:.3,hx:21,hy:-28,wa:.2,ox:15,oy:-33,glow:1,fx:14},'out3'),K(.72,{rx:5,lean:.28,hx:21,hy:-28,wa:.2,ox:15,oy:-33,glow:.6,fx:14},'lin'),K(1,{glow:0})]
 },
 draw(k,T){
  const {P,pv,sh,hd,n,lf,lb,af,ab}=k,C=this.pal,A=(t,o)=>[pv.x+(sh.x-pv.x)*t+n.x*o,pv.y+(sh.y-pv.y)*t+n.y*o];
  ribbon(T.cloak,this.tails.cloak.w,C.cloak,C.cloakD,C.lining);
  arm(k.shB,ab,C.cloakD,C.leatherD,3,3.2,C.skinD,1.7);
  if(P.glow>.15){c.save();c.globalAlpha=Math.min(1,P.glow)*.9;ci(ab.ex,ab.ey,2.6+P.glow,C.glow,.6);c.restore()}
  limb(k.hipB.x,k.hipB.y,lb.kx,lb.ky,4,C.leatherD);limb(lb.kx,lb.ky,lb.ex,lb.ey,3.6,C.boot);boot(lb,C.boot,C.silver);
  pl([A(0,-3.3),A(0,3.3),A(.5,3.8),A(1,4),A(1,-4),A(.5,-3.8)],C.leather);
  pl([A(.12,-3.4),A(.12,3.6),A(1,4.2),A(1,2.2)],C.cloakD,1,false);
  ln(...A(.05,-3.6),...A(.98,4),1.9,C.silver);hl(...A(.3,.6),...A(.8,3.1),.7,C.silverL);
  ln(...A(.06,-3.5),...A(.06,3.7),1.7,C.lining);
  limb(k.hipF.x,k.hipF.y,lf.kx,lf.ky,4.3,C.leather,'#4a4868');limb(lf.kx,lf.ky,lf.ex,lf.ey,3.8,C.boot,'#46436a');ci(lf.kx+.5,lf.ky,1.9,C.silver,1);boot(lf,C.boot,C.silver);
  const sw=clamp((P.fx+P.bx)*.12,-2.5,2.5);
  pl([A(0,.4),A(0,3.8),[pv.x+sw+4.6,pv.y+7.5],[pv.x+sw+.2,pv.y+8.2]],C.cloak);ln(pv.x+sw+.5,pv.y+7.7,pv.x+sw+4.4,pv.y+7.1,.8,C.lining);
  limb(sh.x,sh.y,hd.x,hd.y,3.1,C.skinD);
  c.save();c.translate(hd.x,hd.y);c.rotate(k.ha*.7);
  pl([[-5.6,3.4],[-6,-3.6],[-2,-6.6],[2.8,-5.8],[4,-3],[1,-4],[-1.6,-2.2],[-2.2,3.4]],C.cloak,1.3);
  ci(.8,.6,4.1,C.skin,1.2);
  pl([[-1.2,-3.7],[3.6,-3.7],[4.4,-1.4],[2.6,-2],[.6,-1.4]],C.hair,1);
  pl([[-3.4,-1],[-6,3.6],[-3.2,3],[-2,0.6]],C.hair,.9);
  rect(2.3,-.5,1.3,1.5,'#16202a');rect(2.7,-.3,.8,.8,C.glow);
  c.restore();
  // curved saber
  c.save();c.translate(af.ex,af.ey);c.rotate(P.wa);
  ln(-4.5,0,2,0,1.9,C.leatherD);ci(-5,0,1.4,C.silver,1);pl([[1,-3.2],[2.6,-3.2],[2.6,3.2],[1,3.2]],C.silver,1);
  c.beginPath();c.moveTo(2.6,-1);c.quadraticCurveTo(15,-4.6,26,.2);c.quadraticCurveTo(14,1.2,2.6,1.2);c.closePath();c.strokeStyle=OUT;c.lineWidth=1.2;c.stroke();c.fillStyle=C.blade;c.fill();
  hl(4,-.2,22,-1.4,.7,'#ffffff');
  c.restore();
  arm(k.shF,af,C.leatherD,C.silver,3.2,3.4,C.skinD,1.8,null,C.silverL);
  ci(k.shF.x+.2,k.shF.y-.2,3,C.silver,1.2);hl(k.shF.x-1,k.shF.y-1.4,k.shF.x+1.4,k.shF.y-1.6,.9,C.silverL);
 }
});

// ---------- generic poses ----------
function generic(H){
 const B=H.base;
 return {
  hurt:[K(0,{lean:-.5,head:-.32,rx:-3,hx:6,hy:-30,wa:B.wa-.7,fx:3,bx:-11,ry:1}),K(.4,{lean:-.36,head:-.2,rx:-3,hx:7,hy:-29,wa:B.wa-.5,fx:3,bx:-11},'out'),K(1,{lean:-.2,head:-.1,rx:-1.5,fx:5,bx:-9,wa:B.wa-.25})],
  death:[K(0,{lean:-.5,head:-.4,rx:-3,hx:5,hy:-31,wa:B.wa-.8,fx:3,bx:-11}),K(.25,{lean:-.3,rx:-6,ry:4,head:-.3,fx:2,bx:-12,hx:3,hy:-26,wa:B.wa-.9},'out'),K(.55,{lean:-.2,rx:-3,ry:8,rot:-.9,rcy:-6,hx:2,hy:-24,fx:0,fy:-4,bx:-6,by:-2,wa:B.wa-.5}),K(1,{lean:0,rx:0,ry:13,rot:-1.55,rcy:-4.5,hx:0,hy:-19,fx:-2,fy:-5,bx:-3,by:-4,ox:-3,oy:-20,wa:1.3,head:-.1},'out')],
  roll:[K(0,{ry:3,lean:.4,fx:6,bx:-5,hx:8,hy:-24,ox:5,oy:-24,wa:B.wa+.3,rot:0,rcy:-14}),K(.5,{ry:8,lean:1,fx:3,fy:-8,bx:-1,by:-8,hx:5,hy:-18,ox:6,oy:-17,wa:B.wa+1,rot:Math.PI,rcy:-14},'lin'),K(1,{ry:3,lean:.4,fx:6,bx:-5,hx:8,hy:-24,ox:5,oy:-24,wa:B.wa+.3,rot:PI2,rcy:-14},'lin')]
 };
}
for(const H of Object.values(HEROES))H.gen=generic(H);

function walkPose(H,g){
 const B=H.base,s=H.stride,lift=4.3;
 const foot=ph=>{ph=((ph%1)+1)%1;if(ph<.5){const u=ph/.5;return {x:s*(1-2*u)*.9+1,y:0}}const u=(ph-.5)/.5;return {x:s*(-1+2*u)*.9+1,y:-lift*Math.sin(Math.PI*u)}};
 const A=foot(g),Bf=foot(g+.5),bob=1.3*(1-Math.abs(Math.sin(g*PI2)));
 return {...B,fx:A.x,fy:A.y,bx:Bf.x,by:Bf.y,ry:B.ry+bob,lean:B.lean+.07,hy:B.hy+bob*.5+Math.sin(g*PI2*2)*.4,wa:B.wa+Math.sin(g*PI2)*.05,ox:B.ox+(H.two?0:Math.cos(g*PI2)*2.2),head:-Math.sin(g*PI2)*.02};
}
function idlePose(H,p){
 const B=H.base,s=Math.sin(p*PI2);
 return {...B,ry:B.ry+s*.55+.3,lean:B.lean+s*.014,hy:B.hy+s*.5,wa:B.wa+s*.025,oy:B.oy+s*.45,head:s*.025};
}
function pose(id,anim,p){
 const H=HEROES[id];
 if(anim==='idle')return idlePose(H,p);
 if(anim==='walk')return walkPose(H,p);
 const keys=H.anim[anim]||H.gen[anim]||H.gen.hurt;
 return sample(H.base,keys,p);
}

// ---------- skeleton ----------
function skeleton(H,P){
 const pv={x:P.rx,y:-H.hipH+P.ry},sl=Math.sin(P.lean),cl=Math.cos(P.lean);
 const u={x:sl,y:-cl},n={x:cl,y:sl};
 const sh={x:pv.x+u.x*H.torso,y:pv.y+u.y*H.torso},ha=P.lean+P.head;
 const hd={x:sh.x+Math.sin(ha)*H.neck,y:sh.y-Math.cos(ha)*H.neck};
 const hipF={x:pv.x+1.4,y:pv.y},hipB={x:pv.x-1.4,y:pv.y};
 const lf=ik(hipF.x,hipF.y,P.fx,P.fy-2,H.legs[0],H.legs[1],1),lb=ik(hipB.x,hipB.y,P.bx,P.by-2,H.legs[0],H.legs[1],1);
 const shF={x:sh.x+n.x*.8,y:sh.y+n.y*.8+.6},shB={x:sh.x-n.x*.8,y:sh.y-n.y*.8+.6};
 const af=ik(shF.x,shF.y,P.hx,P.hy,H.arm[0],H.arm[1],-1),wd={x:Math.cos(P.wa),y:Math.sin(P.wa)};
 const bt=H.two?{x:af.ex-wd.x*H.grip,y:af.ey-wd.y*H.grip}:{x:P.ox,y:P.oy};
 const ab=ik(shB.x,shB.y,bt.x,bt.y,H.arm[0],H.arm[1],-1);
 return {P,H,pv,sh,hd,u,n,ha,hipF,hipB,lf,lb,shF,shB,af,ab,wd};
}

// ---------- cloth / hair springs (simulated in world space so movement drags them) ----------
function makeState(id){
 const H=HEROES[id],st={tails:{}};
 for(const [name,t] of Object.entries(H.tails))st.tails[name]={p:Array.from({length:t.n},()=>({x:0,y:0,px:0,py:0})),len:t.len,ok:false,out:[]};
 return st;
}
function stepTail(t,ax,ay,dt,face,o){
 const p=t.p;
 if(!t.ok||Math.hypot(ax-p[0].x,ay-p[0].y)>40){for(let i=0;i<p.length;i++){p[i].x=p[i].px=ax-face*i*t.len*.6;p[i].y=p[i].py=ay+i*t.len*.8}t.ok=true}
 p[0].x=p[0].px=ax;p[0].y=p[0].py=ay;
 if(dt>0){
  const steps=Math.max(1,Math.ceil(dt)),h=dt/steps;
  for(let s=0;s<steps;s++){
   for(let i=1;i<p.length;i++){const q=p[i],d=Math.pow(o.damp,h),vx=(q.x-q.px)*d,vy=(q.y-q.py)*d;q.px=q.x;q.py=q.y;q.x+=vx-face*o.back*h*h;q.y+=vy+o.g*h*h}
   for(let it=0;it<3;it++)for(let i=1;i<p.length;i++){const a=p[i-1],q=p[i],dx=q.x-a.x,dy=q.y-a.y,d=Math.hypot(dx,dy)||1e-4,kk=(d-t.len)/d;q.x-=dx*kk;q.y-=dy*kk}
  }
 }
}

// ---------- render ----------
function finish(){
 const img=c.getImageData(0,0,CW,CH),d=img.data,m=new Uint8Array(CW*CH);
 for(let i=0,j=0;i<d.length;i+=4,j++){if(d[i+3]>=112){d[i+3]=255;m[j]=1}else d[i+3]=0}
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
  const j=y*CW+x;if(!m[j])continue;
  const up=y>0?m[j-CW]:0,dn=y<CH-1?m[j+CW]:0,o=j*4;
  if(!up){d[o]=Math.min(255,d[o]*1.2+9);d[o+1]=Math.min(255,d[o+1]*1.2+9);d[o+2]=Math.min(255,d[o+2]*1.2+9)}
  else if(!dn){d[o]*=.78;d[o+1]*=.78;d[o+2]*=.78}
 }
 for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){
  const j=y*CW+x;if(m[j])continue;
  if((x>0&&m[j-1])||(x<CW-1&&m[j+1])||(y>0&&m[j-CW])||(y<CH-1&&m[j+CW])){const o=j*4;d[o]=20;d[o+1]=11;d[o+2]=16;d[o+3]=255}
 }
 c.putImageData(img,0,0);
}
function render(id,P,st,info){
 const H=HEROES[id],k=skeleton(H,P),face=info.face||1,ex=(info.ex||0)/S,ey=(info.ey||0)/S,dt=info.dt??1;
 const cr=Math.cos(P.rot),sr=Math.sin(P.rot);
 const rotP=p=>{const dx=p.x,dy=p.y-P.rcy;return {x:dx*cr-dy*sr,y:P.rcy+dx*sr+dy*cr}};       // pre-rotation -> post-rotation
 const unrot=p=>{const dx=p.x,dy=p.y-P.rcy;return {x:dx*cr+dy*sr,y:P.rcy-dx*sr+dy*cr}};       // post-rotation -> pre-rotation
 const anchors=H.anchors(k),T={};
 for(const [name,t] of Object.entries(st.tails)){
  const a=rotP(anchors[name]);
  stepTail(t,ex+face*a.x,ey+a.y,dt,face,H.tails[name].o);
  t.out=t.p.map(q=>unrot({x:(q.x-ex)*face,y:q.y-ey}));
  T[name]=t.out;
 }
 c.clearRect(0,0,CW,CH);c.save();c.translate(OX,OY);
 c.translate(0,P.rcy);c.rotate(P.rot);c.translate(0,-P.rcy);
 H.draw(k,T);
 c.restore();finish();
 const wd=k.wd,tp=rotP({x:k.af.ex+wd.x*H.tipLen,y:k.af.ey+wd.y*H.tipLen}),md=rotP({x:k.af.ex+wd.x*H.innerLen,y:k.af.ey+wd.y*H.innerLen});
 const gc=rotP({x:k.af.ex+wd.x*(H.innerLen+H.tipLen)/2,y:k.af.ey+wd.y*(H.innerLen+H.tipLen)/2});
 return {canvas:cv,ox:OX,oy:OY,w:CW,h:CH,tip:tp,mid:md,glow:gc};
}
function snapshot(){const s=document.createElement('canvas');s.width=CW;s.height=CH;s.getContext('2d').drawImage(cv,0,0);return s}

// ---------- menu portraits ----------
const PST={};
function portrait(id,ctx2,w,h,t){
 const st=PST[id]||(PST[id]=makeState(id)),P=pose(id,'idle',((t||0)/1700)%1);
 const out=render(id,P,st,{ex:0,ey:0,face:1,dt:1});
 ctx2.clearRect(0,0,w,h);ctx2.imageSmoothingEnabled=false;
 const sw=96,sh=96,sx=OX-46,sy=OY-82;
 ctx2.drawImage(out.canvas,sx,sy,sw,sh,0,0,w,h);
}

window.AshenRig={S,ids:['astrid','warden','berserker','moonblade'],HEROES,pose,mix,makeState,render,snapshot,portrait,KEYS};
})();
