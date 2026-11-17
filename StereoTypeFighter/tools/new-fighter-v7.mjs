#!/usr/bin/env node
/**
 * Produce a canonical, inspectable V7 fighter production handoff.
 * Reads existing roster, story, combat and artwork contract. No character
 * identity, move, dialogue, art approval or gameplay timing is invented.
 *
 * node tools/new-fighter-v7.mjs --id yuppie
 * node tools/new-fighter-v7.mjs --all
 * node tools/new-fighter-v7.mjs --id gym-bro --out /tmp/gym-bro.json
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {ROSTER,byId} from '../roster-v7.js';
import {FPS} from '../combat-v7.js';
import {getScene,sceneId,ladderFor} from '../story-v7.js';
const ROOT=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const REPO=path.resolve(ROOT,'..');
export const ACTION_IDS=Object.freeze(['idle','walk','walkBack','dashF','dashB','crouch','block','blockLow',
 'prejump','jumpUp','jumpApex','jumpDown','land','lp','lk','hp','hk','launcher','sweep','airP',
 'airK','hurt','hurtLow','launched','knockdown','ko','getup','special','super','victory','intro']);
const REQUIRE_ART='candidate_only';
export async function buildHandoff(id) {
 const fighter=byId(id);
 if(!fighter)throw Error(`Unknown fighter ID "${id}". Valid: ${ROSTER.map(x=>x.id).join(', ')}`);
 if(FPS!==60)throw Error('Unexpected combat tick rate');
 const source=JSON.parse(await fs.readFile(path.join(ROOT,'art/manifest.v7.template.json'),'utf8'));
 const art=source[id];
 if(!art?.anims)throw Error(`Missing canonical art specification for ${id}`);
 const got=Object.keys(art.anims);
 if(ACTION_IDS.length!==31 || got.length!==31 || ACTION_IDS.some(k=>!art.anims[k]))
   throw Error(`${id} must have exactly 31 canonical animation states`);
 const rivals=ladderFor(id,ROSTER);
 if(rivals.length<1 || rivals.some(x=>!byId(x)))throw Error(`${id}: invalid rival ladder`);
 const sceneIds=[sceneId.prologue(id),...rivals.flatMap(r=>[sceneId.pre(id,r),sceneId.post(id,r)]),sceneId.ending(id)];
 const scenes=sceneIds.map(s=>{
   const obj=getScene(s);
   if(!obj || !Array.isArray(obj.lines) || !obj.lines.length)
     throw Error(`${id}: missing authored scene ${s}`);
   return {id:s,art_key:obj.art||null,place:obj.place||null,
      dialogue_lines:obj.lines.length,status:'canonical_story_exists',image_approval:'pending'};
 });
 const actions=ACTION_IDS.map(key=>{
   const spec=art.anims[key];
   const move=fighter.moves?.[key];
   return {id:key,frames_required:spec.frames,render_fps:spec.fps??null,
     loop:!(spec.once===true),move_name:move?.name??null,
     combat:{startup:move?.startup??null,active:move?.active??null,
       recovery:move?.recovery??null,damage:move?.dmg??null},
     source:'art/manifest.v7.template.json',art_status:REQUIRE_ART,animation_qa:'pending'};
 });
 return {
  schema:'retrogames.fighter-production.v1',fighter_id:id,display_name:fighter.name,
  character_name:fighter.nick,fighting_style:fighter.style,
  appearance:{...fighter.look},appearance_reference:'roster-v7.js (approved V7 overrides in art/ART_SPEC.md)',
  combat:{fps:FPS,hp:fighter.hp,speed:fighter.speed,jump:fighter.jump,
   special_name:fighter.special,super_name:fighter.superName,
   special_spec:fighter.specialSpec,super_hits:[...(fighter.moves.super.hits||[])]},
  animation:{required_actions:31,required_frames:actions.reduce((n,a)=>n+a.frames_required,0),
   baseline:art.anchor,render_scale:art.scale,actions},
  story:{rivals,scenes,required_illustrations:scenes.length},
  integration:{selection_entry:'StereoTypeFighter/app-v7-1.js',
   artwork_manifest:'StereoTypeFighter/art/manifest-v7-1.json',
   gameplay_engine:'StereoTypeFighter/combat-v7.js',
   renderer:'StereoTypeFighter/renderer-v7.js',
   art_directory:`StereoTypeFighter/art/${id}`,
   release_entry:'StereoTypeFighter/index.html'},
  release_gates:{canon_and_rights:'pending',art_technical_qa:'pending',manual_fidelity_qa:'pending',
   60hz_gameplay:'pending',selection_controls:'pending',four_rival_story_or_canonical_ladder:'pending',
   browser_keyboard_gamepad_mobile:'pending',vercel_production:'pending'},
  policy:'Never change canonical moves, identity, dialogue or hitboxes to match unapproved images; never enable a sprite or claim sign-off without validated assets and QA.'
 };
}
async function main(){
 const args=process.argv.slice(2);
 const id=args[args.indexOf('--id')+1],all=args.includes('--all');
 if(all===!!id)throw Error('Specify exactly one of --id <fighter-id> or --all');
 const outArg=args.indexOf('--out')>=0?args[args.indexOf('--out')+1]:null;
 if(outArg&&all)throw Error('--out supports one fighter only');
 const fighters=all?ROSTER.map(f=>f.id):[id];
 for(const current of fighters){
   const handoff=await buildHandoff(current);
   const output=outArg?path.resolve(outArg):path.join(REPO,'source-art','fighter-production',current,'HANDOFF.v7.json');
   if(!output.startsWith(REPO+path.sep) && !outArg)throw Error('Output escapes repository');
   await fs.mkdir(path.dirname(output),{recursive:true});
   const payload=JSON.stringify(handoff,null,2)+'\n';
   try{if(await fs.readFile(output,'utf8')===payload){console.log('Unchanged '+output);continue}}
   catch(e){if(e.code!=='ENOENT')throw e}
   if(!args.includes('--force')){
      try{await fs.access(output);throw Error('Existing handoff differs: '+output+' (use --force to regenerate)')}
      catch(e){if(e.code!=='ENOENT')throw e}
   }
   await fs.writeFile(output,payload,'utf8');
   console.log(`Handoff: ${current} · ${handoff.animation.required_frames} frames / ${handoff.story.required_illustrations} story scenes -> ${output}`);
 }
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))
  main().catch(e=>{console.error(e.message);process.exitCode=1});
