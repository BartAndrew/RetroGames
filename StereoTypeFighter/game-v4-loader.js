(async () => {
  const response = await fetch('./game-v3.js?selector-v4');
  if (!response.ok) throw new Error(`Unable to load game-v3.js: ${response.status}`);
  let source = await response.text();

  // v3 stopped in setupMenu under strict mode because img was assigned without
  // a declaration. Fix that before evaluating the runtime.
  const brokenPortraitLine = "const pc=b.querySelector('canvas'), pctx=pc.getContext('2d'); pctx.imageSmoothingEnabled=false, img=images.get(f.id);";
  const fixedPortraitLine = "const pc=b.querySelector('canvas'), pctx=pc.getContext('2d'); pctx.imageSmoothingEnabled=false; const img=images.get(f.id);";
  if (!source.includes(brokenPortraitLine)) throw new Error('Selector repair marker was not found in game-v3.js.');
  source = source.replace(brokenPortraitLine, fixedPortraitLine);

  // The repository contains 16 named character sheets. v3 already has Bimbo
  // Babe, Douchebag Dave and Junkie; add the remaining 13 sheets to the same
  // playable roster. bimboRects is deliberately reused as a conservative
  // common crop map because these reference sheets share the same template.
  const rosterMarker = "\n  ];\n\n  const images = new Map();";
  if (!source.includes(rosterMarker)) throw new Error('Roster insertion marker was not found in game-v3.js.');

  const additionalFighters = `,
    { id:'rapthug', name:'RapThug', style:'Gangster Rapper', accent:'#d4a13b', color:'#55452e', special:'Bass Drop', atlas:()=> './RapThug.png', sourceRects:bimboRects, speed:.96, defense:1.08, bio:'Heavy street boxing, rhythm-timed punches and a ground-hugging bass shockwave.' },
    { id:'killwoodrat', name:'KillWoodRat', style:'Toxic Alt Girl', accent:'#d96b88', color:'#593b46', special:'Razor Riff', atlas:()=> './KillWoodRat.png', sourceRects:bimboRects, speed:1.08, defense:.94, bio:'Fast close-range rushdown, low kicks and jagged arcade sound-wave effects.' },
    { id:'sk8r-boi', name:'SK8R BOI', style:'Skater Dude', accent:'#72c78a', color:'#466553', special:'Kickflip KO', atlas:()=> './Sk8rBoi.png', sourceRects:bimboRects, speed:1.12, defense:.92, bio:'Mobile footwork, slides and skateboard-flavoured aerial movement.' },
    { id:'club-doll', name:'Club Doll', style:'Nightlife Queen', accent:'#ff63ca', color:'#7b3e7e', special:'Velvet Rope Vortex', atlas:()=> './ClubDoll.png', sourceRects:bimboRects, speed:1.08, defense:.93, bio:'Stylish high kicks, evasive spins and dance-floor footwork.' },
    { id:'grunge', name:'Grunge', style:'Grunge Outcast', accent:'#9d8468', color:'#524a42', special:'Feedback Frenzy', atlas:()=> './Grunge.png', sourceRects:bimboRects, speed:.95, defense:1.06, bio:'Loose-limbed heavy brawling with sudden bursts of distorted feedback.' },
    { id:'yuppie', name:'Yuppie', style:'Finance Bro', accent:'#f2c14e', color:'#49617b', special:'Hostile Takeover', atlas:()=> './Yuppie.png', sourceRects:bimboRects, speed:1.0, defense:1.03, bio:'Precise boxing, calculated counters and briefcase-assisted attacks.' },
    { id:'fat-gamer', name:'Fat Gamer', style:'Pro Gamer', accent:'#65e0ff', color:'#59606b', special:'Level Up', atlas:()=> './FatGamer.png', sourceRects:bimboRects, speed:.9, defense:1.14, bio:'Defensive reads and explosive counters powered by suspiciously good frame data.' },
    { id:'influencer', name:'Influencer', style:'Selfie Superstar', accent:'#ff8bd6', color:'#82588f', special:'Viral Spiral', atlas:()=> './Influencer.png', sourceRects:bimboRects, speed:1.06, defense:.95, bio:'Mobile kickboxing, camera flashes and distraction-based spacing.' },
    { id:'yoga-mom', name:'Yoga Mom', style:'Organic Warrior', accent:'#83cf72', color:'#61785a', special:'Namaste Knockout', atlas:()=> './Yoga Mom.png', sourceRects:bimboRects, speed:.98, defense:1.07, bio:'Balanced defensive movement, palm strikes, sweeps and flexible counters.' },
    { id:'e-girl', name:'E-Girl', style:'Stream Queen', accent:'#b477ff', color:'#5b4b7d', special:'Lag Spike', atlas:()=> './E-Girl.png', sourceRects:bimboRects, speed:1.1, defense:.93, bio:'Quick feints, glitchy movement and deliberately awkward timing.' },
    { id:'cheerleader', name:'Cheerleader', style:'Spirit Striker', accent:'#ff5b6e', color:'#a94655', special:'Pom-Pom Cyclone', atlas:()=> './Cheerleader.png', sourceRects:bimboRects, speed:1.1, defense:.92, bio:'Gymnastics, aerial kicks and explosive competition-style bursts.' },
    { id:'punk-princess', name:'Punk Princess', style:'Anarchy Angel', accent:'#ff3d9f', color:'#7b385b', special:'Mosh Pit Riot', atlas:()=> './PunkPrincess.png', sourceRects:bimboRects, speed:1.07, defense:.97, bio:'Aggressive elbows, knees, stomps and mosh-pit pressure.' },
    { id:'neckbeard-nate', name:'Neckbeard Nate', style:'Tip of the Fedora', accent:'#c9a56b', color:'#66564d', special:'Actually…', atlas:()=> './Neckbeard Nate.png', sourceRects:bimboRects, speed:.93, defense:1.08, bio:'Defensive counters, awkward tricks and surprisingly effective timing.' }`;

  source = source.replace(rosterMarker, additionalFighters + rosterMarker);
  (0, eval)(source);
})().catch(error => {
  console.error('Stereotype Fighters v4 loader failed:', error);
  const grid = document.getElementById('fighterGrid');
  if (grid) grid.innerHTML = `<div class="selector-error"><strong>Character select failed to load.</strong><span>${String(error.message || error)}</span></div>`;
});
