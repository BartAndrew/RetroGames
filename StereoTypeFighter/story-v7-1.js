// V7.1 artwork routing for Tyler: keep all V7 dialogue and rival logic untouched.
// Existing scene filenames remain valid; absent images trigger the engine's staged fallback.
import { getScene as canonicalScene } from './story-v7.js';
export { sceneId, ladderFor, TITLE_CARD, SCENES } from './story-v7.js';
const opponents = new Set(['bogan-tradie','yuppie','fat-gamer','cheerleader']);
export function getScene(id) {
  const original=canonicalScene(id);
  if(!original) return null;
  const [kind,a,b]=id.split(':');
  if(kind==='prologue'&&a==='gym-bro') return {...original,art:'prologue-gym-bro'};
  if(kind==='ending'&&a==='gym-bro') return {...original,art:'ending-gym-bro'};
  if((kind==='pre'||kind==='post')&&a==='gym-bro'&&opponents.has(b))
    return {...original,art:kind+'-gym-bro-'+b};
  return original;
}
