// V7 FX Remix: ORIGINAL visual signature presets, one per canonical fighter.
// Rendering-only personality data. Does not change combat damage, hitboxes or frame data.
// Names and IDs come from roster-v7.js / cast-v7.js.
export const SIGNATURES = Object.freeze({
  'bogan-tradie':   { motif:'bolts',  motion:'burst',  label:'NAIL STORM' },
  'yuppie':         { motif:'diamonds',motion:'slash',  label:'HOSTILE TAKEOVER' },
  'gym-bro':        { motif:'plates', motion:'pulse',  label:'PROTEIN POWER' },
  'lefty':          { motif:'waves',  motion:'wave',   label:'MEGAPHONE' },
  'agenda':         { motif:'stars',  motion:'pulse',  label:'IDENTITY SHIFT' },
  'bimbo-babe':     { motif:'hearts', motion:'orbit',  label:'GLAMOUR STRIKE' },
  'douchebag-dave': { motif:'bolts',  motion:'slash',  label:'DAVE SPECIAL' },
  'junkie':         { motif:'sparks', motion:'chaos',  label:'ADRENALINE' },
  'rapthug':        { motif:'waves',  motion:'wave',   label:'BASS DROP' },
  'killwoodrat':    { motif:'slashes',motion:'slash',  label:'RAT ATTACK' },
  'sk8r-boi':       { motif:'stars',  motion:'spin',   label:'SKATE STORM' },
  'club-doll':      { motif:'diamonds',motion:'orbit', label:'CLUB LIGHTS' },
  'grunge':         { motif:'slashes',motion:'chaos',  label:'DISTORTION' },
  'fat-gamer':      { motif:'pixels', motion:'burst',  label:'POWER UP' },
  'influencer':     { motif:'stars',  motion:'orbit',  label:'VIRAL' },
  'yoga-mom':       { motif:'waves',  motion:'pulse',  label:'INNER ENERGY' },
  'e-girl':         { motif:'pixels', motion:'glitch', label:'GLITCH MODE' },
  'cheerleader':    { motif:'stars',  motion:'burst',  label:'RALLY' },
  'punk-princess':  { motif:'bolts',  motion:'chaos',  label:'PUNK SHOCK' },
  'neckbeard-nate': { motif:'pixels', motion:'spin',   label:'CRITICAL ROLL' }
});
const DEFAULT={motif:'sparks',motion:'burst',label:'SPECIAL'};
export function signatureFor(def) {return SIGNATURES[def?.id] || DEFAULT;}
export function signatureName(def, kind='special') {
  if(kind==='super')return def?.superName || 'SUPER';
  return def?.special || signatureFor(def).label;
}
export function motifPath(ctx,motif,size){
  // centered path, in local canvas coordinates. Caller applies fill/stroke.
  const s=size;ctx.beginPath();
  if(motif==='diamonds'||motif==='plates'||motif==='pixels'){
    if(motif==='pixels')ctx.rect(-s/2,-s/2,s,s);
    else if(motif==='plates')ctx.roundRect(-s,-s*.35,s*2,s*.7,s*.2);
    else {ctx.moveTo(0,-s);ctx.lineTo(s,0);ctx.lineTo(0,s);ctx.lineTo(-s,0);ctx.closePath();}
  } else if(motif==='stars'){
    for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=(i%2?s*.4:s);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();
  }else if(motif==='bolts'){
    ctx.moveTo(-s*.2,-s);ctx.lineTo(s*.55,-s*.12);ctx.lineTo(s*.08,-s*.1);ctx.lineTo(s*.28,s);ctx.lineTo(-s*.6,s*.04);ctx.lineTo(-s*.1,s*.06);ctx.closePath();
  }else if(motif==='hearts'){
    ctx.moveTo(0,s*.7);ctx.bezierCurveTo(-s*1.6,-s*.25,-s*.7,-s*1.1,0,-s*.45);ctx.bezierCurveTo(s*.7,-s*1.1,s*1.6,-s*.25,0,s*.7);ctx.closePath();
  }else if(motif==='waves'){
    ctx.moveTo(-s,-s*.4);ctx.quadraticCurveTo(-s*.3,-s,s*.2,-s*.3);ctx.quadraticCurveTo(s*.6,s*.4,s,s*.2);
  }else if(motif==='slashes'){
    ctx.moveTo(-s,s);ctx.quadraticCurveTo(-s*.1,-s*.65,s,-s);
  }else{ctx.arc(0,0,s*.55,0,Math.PI*2);}
}
