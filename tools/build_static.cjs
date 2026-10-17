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
   if(ignored.has(name)||/\.(?:zip|log)$/i.test(name))continue;
   cp(path.join(source,name),path.join(target,name));
  }
 }else{fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(source,target);}
}
if(fs.existsSync(path.join(root,'AnimationTests')))folders.add('AnimationTests');
for(const folder of folders)cp(path.join(root,folder),path.join(dest,folder));
fs.writeFileSync(path.join(dest,'.nojekyll'),'');
console.log('RetroGames build complete. Games: '+folders.size+' | Launch links: '+linked.length);
