#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..'),html=await fs.readFile(path.join(ROOT,'index.html'),'utf8'),css=await fs.readFile(path.join(ROOT,'ui-v6.css'),'utf8');
const required=['app','setup-row','mode-tabs','selection-layout','fighter-preview','preview-copy','roster-area','roster-tools','fighter-grid','stage-picker','stage-grid','match-rules','primary','arena-shell','hud','arena-overlay','clock','lab-controls','touch-controls'];
const deprecated=['shell','selection','fighter-info','roster-controls','mode-panel','mode-buttons','game-wrap','overlay','round','lab-tools'];
const htmlClasses=new Set([...html.matchAll(/class="([^"]+)"/g)].flatMap(m=>m[1].split(/\s+/).filter(Boolean)));
const missingHtml=required.filter(c=>!htmlClasses.has(c)),missingCss=required.filter(c=>!new RegExp(`\\.${c}(?:[\\s,{:.#>+~\\[]|$)`).test(css));
const legacy=deprecated.filter(c=>htmlClasses.has(c));
if(!html.includes('id="touchControls"')||!/#touchControls|\.touch-controls/.test(css))missingCss.push('touchControls');
if(missingHtml.length||missingCss.length||legacy.length){console.error(JSON.stringify({missingHtml,missingCss,deprecatedStillInHtml:legacy},null,2));process.exit(1)}
console.log(`Layout contract OK: ${required.length} structural classes are present in HTML and CSS; no competing deprecated layout contract detected.`);
