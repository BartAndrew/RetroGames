import * as V5 from './sprites-v5.js';
export const sequences=V5.sequences;
export const surface=V5.surface;
export const pose=V5.pose;
export const drawSprite=V5.drawSprite;
const image=src=>new Promise((resolve,reject)=>{const i=new Image(),t=setTimeout(()=>reject(new Error('Sprite image loading timed out')),15000);i.onload=()=>{clearTimeout(t);resolve(i)};i.onerror=()=>{clearTimeout(t);reject(new Error('Sprite atlas unavailable: '+src))};i.src=src;});
const median=a=>{const b=[...a].sort((x,y)=>x-y);return b[Math.floor(b.length/2)]||1};
function trim(c){const w=c.width,h=c.height,d=c.getContext('2d',{willReadFrequently:true}).getImageData(0,0,w,h).data;let l=w,t=h,r=-1,b=-1;for(let y=0;y<h;y++)for(let x=0;x<w;x++)if(d[(y*w+x)*4+3]>8){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y)}if(r<l)return {canvas:c,px:w/2,py:h,scale:1};const o=surface(r-l+1,b-t+1);o.getContext('2d').drawImage(c,l,t,o.width,o.height,0,0,o.width,o.height);return {canvas:o,px:o.width/2,py:o.height,scale:1};}
function cell(img,index,[w,h],cols){const c=surface(w,h);c.getContext('2d').drawImage(img,(index%cols)*w,Math.floor(index/cols)*h,w,h,0,0,w,h);return trim(c);}
function scales(frames){const ih=median(frames.idle.map(f=>f.canvas.height)),base=90/ih;for(const [name,g] of Object.entries(frames)){const stand=['punch','hurt','block','special','victory'].includes(name),s=stand?90/Math.max(ih*.82,Math.min(ih*1.18,median(g.map(f=>f.canvas.height)))):base;for(const f of g)f.scale=s;}}
export async function loadFighter(def){
 if(!def.atlas)return V5.loadFighter(def);
 const img=await image(new URL(def.atlas,import.meta.url).href),frames={};let n=0;const cellSize=def.atlasCell||[96,60],cols=def.atlasColumns||8;
 for(const state of sequences){const count=def.atlasCounts?.[state]||0;if(!count)throw new Error(def.name+' missing '+state+' atlas frames');frames[state]=Array.from({length:count},()=>cell(img,n++,cellSize,cols));}
 scales(frames);const p=cell(img,def.portraitIndex??n,cellSize,cols),portrait=surface(140,140);portrait.getContext('2d').drawImage(p.canvas,0,0,p.canvas.width,p.canvas.height,0,0,140,140);return {def,frames,portrait,status:'ready'};
}
