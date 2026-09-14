import {encodedMattes} from './matte-v5.js';
// Each sheet is mapped independently. Crops retain their original aspect ratio.
export const sequences=['idle','walk','jump','crouch','punch','kick','special','hurt','block','fall','getup','victory'];
export function surface(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
function median(values){values.sort((a,b)=>a-b);return values[Math.floor(values.length/2)]||0;}
function image(src){return new Promise((resolve,reject)=>{const img=new Image(),timer=setTimeout(()=>reject(new Error('Image loading timed out')),20000);img.onload=()=>{clearTimeout(timer);img.naturalWidth?resolve(img):reject(new Error('Empty image'));};img.onerror=()=>{clearTimeout(timer);reject(new Error('Sprite image unavailable'));};img.src=src;});}
function morph(mask,w,h,dilate){const out=new Uint8Array(mask.length);for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){let v=dilate?0:1;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(dilate)v|=mask[(y+dy)*w+x+dx];else v&=mask[(y+dy)*w+x+dx];}out[y*w+x]=v;}return out;}
function silhouette(data,w,h){
 const mask=new Uint8Array(w*h),corners=[];
 for(const y of [0,1,h-2,h-1])for(const x of [0,1,w-2,w-1])corners.push(Math.max(...data.slice((y*w+x)*4,(y*w+x)*4+3)));
 const darkSheet=median(corners)<42;
 for(let y=0;y<h;y++){
  const sides=[[],[],[],[],[],[]];
  for(let dx=0;dx<3;dx++)for(let dy=-2;dy<=2;dy++){const yy=Math.max(0,Math.min(h-1,y+dy));for(let c=0;c<3;c++){sides[c].push(data[(yy*w+dx)*4+c]);sides[c+3].push(data[(yy*w+w-1-dx)*4+c]);}}
  const bg=sides.map(median);
  for(let x=0;x<w;x++){let distance=0;const p=(y*w+x)*4;for(let c=0;c<3;c++)distance+=Math.abs(data[p+c]-(bg[c]+(bg[c+3]-bg[c])*x/(w-1)));mask[y*w+x]=(darkSheet?Math.max(data[p],data[p+1],data[p+2])>35:distance>54)?1:0;}
 }
 // Close tiny breaks in dark garment outlines, then flood only exterior pixels.
 const closed=morph(morph(mask,w,h,true),w,h,false),seen=new Uint8Array(w*h),q=new Int32Array(w*h);let tail=0;
 const add=p=>{if(!closed[p]&&!seen[p]){seen[p]=1;q[tail++]=p;}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x);}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1);}
 for(let head=0;head<tail;head++){const p=q[head],x=p%w,y=Math.floor(p/w);if(x)add(p-1);if(x<w-1)add(p+1);if(y)add(p-w);if(y<h-1)add(p+w);}
 for(let p=0;p<closed.length;p++)closed[p]=seen[p]?0:1;
 const visited=new Uint8Array(w*h),components=[];let largest=0;
 for(let p=0;p<closed.length;p++)if(closed[p]&&!visited[p]){
  const pts=[p];visited[p]=1;
  for(let i=0;i<pts.length;i++){const a=pts[i],x=a%w,y=Math.floor(a/w);for(const b of [x?a-1:-1,x<w-1?a+1:-1,y?a-w:-1,y<h-1?a+w:-1])if(b>=0&&closed[b]&&!visited[b]){visited[b]=1;pts.push(b);}}
  largest=Math.max(largest,pts.length);if(pts.length>=18)components.push(pts);
 }
 if(largest<30)throw new Error('Could not isolate sprite silhouette');
 const result=new Uint8Array(w*h);for(const pts of components)for(const p of pts)result[p]=1;
 return morph(result,w,h,true);
}
function trimFrame(canvas,sourceRect){
 const w=canvas.width,h=canvas.height,d=canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;
 let l=w,t=h,r=0,b=0;
 for(let yy=0;yy<h;yy++)for(let xx=0;xx<w;xx++)if(d[(yy*w+xx)*4+3]>64){l=Math.min(l,xx);r=Math.max(r,xx);t=Math.min(t,yy);b=Math.max(b,yy);}
 if(l>r||t>b)throw new Error('Empty sprite crop');
 const out=surface(r-l+1,b-t+1);out.getContext('2d').drawImage(canvas,l,t,out.width,out.height,0,0,out.width,out.height);
 const xs=[];for(let yy=t+Math.floor((b-t)*.25);yy<t+Math.floor((b-t)*.6);yy++)for(let xx=l;xx<=r;xx++)if(d[(yy*w+xx)*4+3]>64)xs.push(xx-l);
 return {canvas:out,px:median(xs),py:out.height,scale:1,sourceRect};
}
function isolate(img,x,y,w,h){
 const c=surface(w,h),cx=c.getContext('2d',{willReadFrequently:true});cx.drawImage(img,x,y,w,h,0,0,w,h);
 const d=cx.getImageData(0,0,w,h),m=silhouette(d.data,w,h);
 for(let p=0;p<m.length;p++)d.data[p*4+3]=m[p]?255:0;
 cx.putImageData(d,0,0);return trimFrame(c,[x,y,w,h]);
}
function panelFrames(img,rect){
 const [l,t,r,b,n]=rect,w=r-l,h=b-t,c=surface(w,h),cx=c.getContext('2d',{willReadFrequently:true});
 if(l<0||t<0||r>img.width||b>img.height||n<1||w<1||h<1)throw new Error('Invalid sprite panel');
 cx.drawImage(img,l,t,w,h,0,0,w,h);const data=cx.getImageData(0,0,w,h).data,occupancy=new Float64Array(w);
 for(let x=0;x<w;x++)for(let y=2;y<h-2;y++){const p=(y*w+x)*4;if(Math.max(data[p],data[p+1],data[p+2])>100)occupancy[x]++;}
 // Refine each expected separator against the actual empty gutter, not a shared grid.
 const cuts=[0],step=w/n;
 for(let i=1;i<n;i++){const center=i*step;let best=Math.round(center),score=Infinity;for(let x=Math.max(cuts[i-1]+12,Math.round(center-step*.28));x<Math.min(w-12,center+step*.28);x++){const s=occupancy[x-1]+occupancy[x]+occupancy[x+1]+Math.abs(x-center)*.055;if(s<score){score=s;best=x;}}cuts.push(best);}cuts.push(w);
 return cuts.slice(0,-1).map((x,i)=>isolate(img,l+x,t,cuts[i+1]-x,h));
}
function legacyFrame(img,index){const c=surface(96,96);c.getContext('2d').drawImage(img,index%5*96,Math.floor(index/5)*96,96,96,0,0,96,96);return {canvas:c,px:48,py:94,scale:1};}
let mattePromise;
function getMattes(){mattePromise||=(async()=>{if(typeof DecompressionStream==='undefined')return {};const bytes=Uint8Array.from(atob(encodedMattes),c=>c.charCodeAt(0));return new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).json();})().catch(()=>({}));return mattePromise;}
function matteFrame(img,record){
 const [x,y,w,h,polygons]=record,c=surface(w,h),cx=c.getContext('2d',{willReadFrequently:true}),mask=surface(w,h),mc=mask.getContext('2d');
 cx.drawImage(img,x,y,w,h,0,0,w,h);mc.fillStyle='#fff';
 for(const pts of polygons){if(!pts.length)continue;mc.beginPath();mc.moveTo(...pts[0]);for(const p of pts.slice(1))mc.lineTo(...p);mc.closePath();mc.fill();}
 cx.globalCompositeOperation='destination-in';cx.drawImage(mask,0,0);cx.globalCompositeOperation='source-over';return trimFrame(c,[x,y,w,h]);
}
export async function loadFighter(def){
 let img,frames={},portrait;
 if(def.legacy){
  const raw=def.legacy==='lefty'?window.__SF_LEFTY_ATLAS:window.__SF_AGENDA_ATLAS;if(!raw)throw new Error('Legacy sprite data is missing');img=await image('data:image/png;base64,'+raw);
  const maps={idle:[0,1],walk:[0,1],jump:[0],crouch:[0],block:[0],punch:[2,3,4,5],kick:[6,7,8,9,10],special:[11,12,13],hurt:[14,15,16],fall:[15,16],getup:[18,0],victory:[19]};
  for(const [name,ids] of Object.entries(maps))frames[name]=ids.map(i=>legacyFrame(img,i));
  portrait=surface(140,140);portrait.getContext('2d').drawImage(img,12,0,65,54,0,0,140,140);
 }else{
  img=await image(new URL(def.source,import.meta.url).href);
  if(img.naturalWidth!==1536||img.naturalHeight!==1024)throw new Error('Unexpected source-sheet dimensions');
  const mattes=(def.id==='rapthug'||def.id==='grunge')?(await getMattes())[def.id]:null;
  for(const [name,rect] of Object.entries(def.panels))frames[name]=mattes?.[name]?mattes[name].map(record=>matteFrame(img,record)):panelFrames(img,rect);
  const idleHeight=median(frames.idle.map(f=>f.canvas.height)),baseScale=90/idleHeight;
  for(const [name,group] of Object.entries(frames)){
   const standing=['punch','hurt','block','special','victory'].includes(name);
   const scale=standing?90/Math.max(idleHeight*.85,Math.min(idleHeight*1.15,median(group.map(f=>f.canvas.height)))):baseScale;
   for(const f of group)f.scale=scale;
  }
  frames.getup.sort((a,b)=>a.canvas.height-b.canvas.height);
  for(const [name,order] of Object.entries(def.orders||{}))frames[name]=order.map(i=>frames[name][i]);
  const [x,y,w,h]=def.portrait;portrait=surface(140,140);portrait.getContext('2d').drawImage(img,x,y,w,h,0,0,140,140);
 }
 return {def,frames,portrait,status:'ready'};
}
export function pose(asset,state,tick=0,duration=0,vy=0){
 if(state==='landing')return asset.frames.crouch[0];
 if(state==='ko'){const g=asset.frames.fall;return g[Math.min(g.length-1,Math.floor(tick/8))];}
 const group=asset.frames[state]||asset.frames.idle;let i=0;
 if(state==='jump')i=vy<-4?Math.min(1,group.length-1):vy>4?Math.max(0,group.length-2):Math.floor(group.length/2);
 else if(duration)i=Math.min(group.length-1,Math.floor(tick/duration*group.length));
 else if(['idle','walk','victory'].includes(state))i=Math.floor(tick/(state==='walk'?7:12))%group.length;
 else if(state==='crouch'||state==='block')i=Math.min(group.length-1,Math.floor(tick/7));
 return group[i];
}
export function drawSprite(ctx,asset,state,tick,x,y,size=2,face=1,duration=0,vy=0){
 if(!asset||asset.status!=='ready')return;
 const f=pose(asset,state,tick,duration,vy),s=size*f.scale;
 ctx.save();ctx.imageSmoothingEnabled=false;ctx.translate(Math.round(x),Math.round(y));ctx.scale(face,1);
 ctx.drawImage(f.canvas,Math.round(-f.px*s),Math.round(-f.py*s),Math.round(f.canvas.width*s),Math.round(f.canvas.height*s));ctx.restore();
}
