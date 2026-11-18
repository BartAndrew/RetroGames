import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const read=path=>fs.readFile(new URL(path,import.meta.url),'utf8');
test('V8.0 stable HTML is published at default and direct routes',async()=>{
 for(const name of ['index.html','v8.html']){
  const page=await read('../'+name);
  assert.match(page,/<title>StereoType Fighters V8\.0/);
  assert.match(page,/V8\.0/);
  assert.match(page,/src="\.\/app-v8\.js"/);
 }
});
test('V8 entry preserves gameplay modules and enables rig on explicit V8 route',async()=>{
 const app=await read('../app-v8.js');
 assert.match(app,/import '\.\/app-v7-1\.js'/);
 assert.match(app,/version:'8\.0'/);
 const renderer=await read('../renderer-v7.js');
 assert.match(renderer,/\(\?:v7-2\|v8\)/);
});
test('release pruning keeps all entry points and historical V7.2',async()=>{
 const prune=await read('../tools/prune-v66-site.mjs');
 for(const p of ['index.html','v8.html','app-v8.js','v7-2.html'])
  assert.ok(prune.includes("'"+p+"'"),p);
 const old=await read('../v7-2.html');
 assert.match(old,/V7\.2/);
});
