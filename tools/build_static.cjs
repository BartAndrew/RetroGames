#!/usr/bin/env node
/* Zero-dependency arcade deploy: stage every linked playable game. */
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dest=path.join(root,'_site');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const re=/<a\b(?=[^>]*\bdata-game-link\b)[^>]*\bhref="([^"]+)"/g;
const linked=[...html.matchAll(re)].map(m=>m[1]);
const folders=new Set(['arcade']);
for(const url of linked){
 if(!url.startsWith('./')||url.includes('..'))throw new Error('Unsafe arcade link: '+url);
 const relative=url.slice(2).split(/[?#]/)[0];
 const target=path.resolve(root,relative);
 const entry=fs.statSync(target).isDirectory()?path.join(target,'index.html'):target;
 if(!fs.existsSync(entry))throw new Error('Missing game entry: '+relative);
 folders.add(relative.split('/')[0]);
}
if(!folders.has('Panelworks'))throw new Error('Panelworks directory not linked');
fs.rmSync(dest,{recursive:true,force:true});fs.mkdirSync(dest,{recursive:true});
fs.copyFileSync(path.join(root,'index.html'),path.join(dest,'index.html'));
const ignored=new Set(['.git','node_modules','__pycache__','test-results','playwright-report','.production']);
function cp(source,target){
 const st=fs.statSync(source);
 if(st.isDirectory()){
  fs.mkdirSync(target,{recursive:true});
  for(const name of fs.readdirSync(source)){
   if(ignored.has(name)||/\.(?:zip|log|md)$/i.test(name)||name==='prompts-v7.json'||name==='tests')continue;
   cp(path.join(source,name),path.join(target,name));
  }
 }else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
}
if(fs.existsSync(path.join(root,'AnimationTests')))folders.add('AnimationTests');
for(const folder of folders)cp(path.join(root,folder),path.join(dest,folder));
fs.writeFileSync(path.join(dest,'.nojekyll'),'');

// Vendored, open-licensed audio. Fetch during production build; fall back to Web Audio if an upstream is unreachable.
const https=require('node:https');
const audioAssets=[
 {file:'ShadowKombat/assets/heavy-battle-2.ogg',url:'https://opengameart.org/sites/default/files/heavy_battle_2_bpm185_0.ogg'},
 {file:'ShadowKombat/assets/whoosh.wav',url:'https://opengameart.org/sites/default/files/whoosh2_0.wav'}
];
function download(url,redirects=3){return new Promise((resolve,reject)=>{https.get(url,{headers:{'User-Agent':'RetroGames-AssetBuild/1.0'}},res=>{if(res.statusCode>=300&&res.statusCode<400&&res.headers.location&&redirects>0){res.resume();return resolve(download(res.headers.location,redirects-1))}if(res.statusCode!==200){res.resume();return reject(Error('HTTP '+res.statusCode))}const chunks=[];res.on('data',d=>chunks.push(d));res.on('end',()=>resolve(Buffer.concat(chunks)));res.on('error',reject)}).on('error',reject)})}
Promise.all(audioAssets.map(async a=>{try{const bytes=await download(a.url);if(bytes.length<10000)throw Error('Truncated asset');const target=path.join(dest,a.file);fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);console.log('Licensed audio bundled: '+a.file+' ('+bytes.length+' bytes)')}catch(err){console.warn('Optional audio unavailable: '+a.file+' '+err.message)}})).catch(err=>console.warn(err.message));

console.log('RetroGames build complete. Games: '+folders.size+' | Launch links: '+linked.length);
