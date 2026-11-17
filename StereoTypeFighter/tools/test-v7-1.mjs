// V7.1 must preserve V7 gameplay and dialogue while adding Gym Bro scene-art routes.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ROSTER } from '../roster-v7.js';
import { getScene as original, ladderFor as originalLadder } from '../story-v7.js';
import { getScene, ladderFor, sceneId } from '../story-v7-1.js';
const manifest=JSON.parse(readFileSync(new URL('../art/manifest-v7-1.json',import.meta.url)));
assert.equal(manifest.scenes,true,'new version needs scene loading');
const gym=ROSTER.find(x=>x.id==='gym-bro');
assert.ok(gym);
assert.equal(gym.special,'Protein Shaker Blast');
assert.equal(gym.superName,'LEG DAY TSUNAMI');
const rivals=['bogan-tradie','yuppie','fat-gamer','cheerleader'];
assert.deepEqual(ladderFor('gym-bro',ROSTER),rivals);
assert.deepEqual(ladderFor('gym-bro',ROSTER),originalLadder('gym-bro',ROSTER));
const sceneIds=[sceneId.prologue('gym-bro'),...rivals.flatMap(x=>[sceneId.pre('gym-bro',x),sceneId.post('gym-bro',x)]),sceneId.ending('gym-bro')];
assert.equal(sceneIds.length,10);
for(const id of sceneIds){
  const before=original(id),after=getScene(id);
  assert.ok(before && after,'missing scene '+id);
  assert.deepEqual(after.lines,before.lines,'canonical dialogue changed '+id);
  assert.equal(after.place,before.place);
  assert.equal(after.mood,before.mood);
  assert.match(after.art,/gym-bro/,'missing V7.1 scene art route '+id);
}
const html=readFileSync(new URL('../v7-1.html',import.meta.url),'utf8');
const script=readFileSync(new URL('../app-v7-1.js',import.meta.url),'utf8');
assert.match(html,/app-v7-1\.js/);
assert.match(script,/manifest-v7-1\.json/);
assert.match(script,/story-v7-1\.js/);
console.log('PASS V7.1: 10 canonical scenes preserved, artwork routes enabled, standalone game entry');
