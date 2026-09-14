#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import sharp from 'sharp';
const HERE=path.dirname(fileURLToPath(import.meta.url)),GAME=path.resolve(HERE,'..'),arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i>=0?process.argv[i+1]:fallback},ROOT=path.resolve(arg('--site',GAME));
const sequences=['idle','walk','jump','crouch','punch','kick','special','hurt','block','fall','getup','victory'];
const fail=m=>{throw new Error(m)},exists=async p=>{try{await fs.access(p);return true}catch{return false}},json=async p=>JSON.parse(await fs.readFile(p,'utf8'));
let rosterPath=path.join(ROOT,'tools/roster-runtime-v6.json'),roster;
if(await exists(rosterPath))roster=await json(rosterPath);else{const base=await json(path.join(GAME,'tools/roster-v5.json')),patch=await json(path.join(GAME,'tools/roster-v6.json')),repl=new Map(patch.replace.map(x=>[x.id,x]));roster=base.map(x=>repl.get(x.id)||x);for(const x of patch.add)roster.push(x)}
if(roster.length!==20||new Set(roster.map(x=>x.id)).size!==20)fail(`Expected 20 unique fighters, got ${roster.length}`);
const production=await exists(rosterPath);if(production){for(const d of roster){if(!d.atlas)fail(`${d.id}: production roster has no compact atlas`);for(const s of sequences)if(!d.atlasCounts?.[s])fail(`${d.id}: missing ${s} animation count`);const rel=d.atlas.replace(/^\.\//,''),file=path.join(ROOT,rel);if(!await exists(file))fail(`${d.id}: missing atlas ${rel}`);const meta=await sharp(file).metadata(),[cw,ch]=d.atlasCell||[];if(!cw||!ch||meta.width%cw||meta.height%ch)fail(`${d.id}: atlas dimensions ${meta.width}x${meta.height} do not match ${cw}x${ch}`);if(meta.width/cw!==(d.atlasColumns||8))fail(`${d.id}: atlas column mismatch`);const capacity=(meta.width/cw)*(meta.height/ch),needed=sequences.reduce((n,s)=>n+d.atlasCounts[s],0);if(needed>capacity)fail(`${d.id}: atlas capacity ${capacity} below ${needed} frames`)}}
const stageDir=path.join(ROOT,'assets/backgrounds/game'),stageFiles=(await fs.readdir(stageDir)).filter(x=>x.endsWith('.webp'));if(stageFiles.length!==6)fail(`Expected 6 production arena WebPs, got ${stageFiles.length}`);for(let i=0;i<4;i++)if(!await exists(path.join(ROOT,`assets/characters/portraits/roster-${i}.b64`)))fail(`Missing portrait chunk ${i}`);
if(production){for(const bad of ['sprites-v5.js','arena-v5.js','app-v5.js','ui-v5.css','ui-v5-2.css','matte-v5.js','assets/agenda-fluid'])if(await exists(path.join(ROOT,bad)))fail(`Obsolete/source-only path shipped in production: ${bad}`);const top=await fs.readdir(ROOT);const huge=top.filter(x=>/\.png$/i.test(x));if(huge.length)fail(`Source PNG sheets leaked into production: ${huge.join(', ')}`)}
console.log(`V6 asset QA OK: ${roster.length} fighters, ${sequences.length} required sequences each${production?', 20 compact production atlases':''}, 6 arenas, portrait atlas present.`);
