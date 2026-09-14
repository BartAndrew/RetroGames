#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const HERE=path.dirname(fileURLToPath(import.meta.url));
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback};
const SITE=path.resolve(arg('--site',path.join(HERE,'../../_site/StereoTypeFighter')));
const exact=new Set(['index.html','app-v6.js','arena-v6.js','sprites-v6.js','combat-v6.js','audio-v6.js','ui-v6.css','tools/roster-runtime-v6.json']);
const prefixes=['assets/backgrounds/game/','assets/characters/portraits/','assets/characters/v6/','assets/characters/v6-generated/'];
const keep=rel=>exact.has(rel)||prefixes.some(p=>rel.startsWith(p));
async function walk(dir){for(const ent of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,ent.name),rel=path.relative(SITE,full).split(path.sep).join('/');if(ent.isDirectory()){await walk(full);try{if((await fs.readdir(full)).length===0)await fs.rmdir(full)}catch{}}else if(!keep(rel))await fs.unlink(full)}}
await walk(SITE);
const files=[];async function list(dir){for(const ent of await fs.readdir(dir,{withFileTypes:true})){const full=path.join(dir,ent.name);ent.isDirectory()?await list(full):files.push(path.relative(SITE,full).split(path.sep).join('/'))}}await list(SITE);console.log(`Pruned StereotypeFighter production bundle to ${files.length} files.`);
