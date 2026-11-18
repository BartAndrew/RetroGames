import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const actionFrames={airP:4,airK:4,hk:6,launcher:6,intro:4,victory:4};
function file(...parts){return path.join(root,...parts)}
async function imageInfo(name) {
 const fd=await fs.open(name,'r');
 try{const bytes=Buffer.alloc(26);const out=await fd.read(bytes,0,bytes.length,0);
  assert.equal(out.bytesRead,26,name);
  assert.deepEqual([...bytes.subarray(0,8)],[137,80,78,71,13,10,26,10],name+' PNG signature');
  assert.equal(bytes.toString('ascii',12,16),'IHDR',name);
  return {w:bytes.readUInt32BE(16),h:bytes.readUInt32BE(20),color:bytes[25]};
 }finally{await fd.close()}
}
test('V8 Gym Bro production art has 28 verified RGBA sprite frames across 6 complete actions',async()=>{
 const manifest=JSON.parse(await fs.readFile(file('art','manifest-v8.json'),'utf8'));
 const spec=manifest['gym-bro'];
 assert.equal(spec.path,'art/v8/{id}/{anim}/{n}.png');
 assert.equal(spec.anims.intro?.once,true,'round intro must run once per 100-tick presentation');
 assert.equal(spec.anims.intro?.loop,false,'intro should not reset mid-entrance');
 assert.equal(spec.portrait,'art/v8/{id}/portrait.png');
 assert.deepEqual(Object.keys(spec.anims),Object.keys(actionFrames));
 assert.ok(!('idle' in spec.anims),'mismatched old gray-tank idle must remain disabled');
 assert.ok(!('walk' in spec.anims),'mismatched old gray-tank walk must remain disabled');
 let count=0;
 for(const [action,n] of Object.entries(actionFrames)){
   assert.equal(spec.anims[action].frames,n);
   for(let i=1;i<=n;i++){
     const p=file('art','v8','gym-bro',action,String(i).padStart(2,'0')+'.png');
     const info=await imageInfo(p);
     assert.deepEqual([info.w,info.h,info.color],[512,512,6],p);
     count++;
   }
 }
 assert.equal(count,28);
 assert.deepEqual(spec.anchor,[256,470]);
 assert.equal(manifest.scenes,true);
 const portrait=await imageInfo(file('art','v8','gym-bro','portrait.png'));
 assert.deepEqual([portrait.w,portrait.h],[900,1200]);
 const scene=await imageInfo(file('art','v8','scenes','prologue-gym-bro.png'));
 assert.deepEqual([scene.w,scene.h],[1600,900]);
});
test('V8 releases art without rewriting historical manifests or combat timing',async()=>{
 const historical=JSON.parse(await fs.readFile(file('art','manifest-v7-1.json'),'utf8'));
 assert.equal(historical['gym-bro'].path,'art/{id}/{anim}/{n}.png');
 assert.equal(historical['gym-bro'].anims.hk,undefined);
 const loader=await fs.readFile(file('app-v7-1.js'),'utf8');
 assert.match(loader,/releaseV8 \? '\.\/art\/manifest-v8\.json'/);
 const renderer=await fs.readFile(file('renderer-v7.js'),'utf8');
 assert.match(renderer,/window\.SF_RELEASE\?\.version !== '8\.0'/);
 assert.match(renderer,/GYM_RIG_RELEASE/);
 const cutscene=await fs.readFile(file('cutscene-v7.js'),'utf8');
 assert.match(cutscene,/\.\/art\/v8\/scenes\//);
 assert.match(renderer,/m\.phase === 'intro' && f\.def\.id === 'gym-bro'/);
 assert.match(renderer,/window\.SF_RELEASE\?\.version === '8\.0'/);
});
