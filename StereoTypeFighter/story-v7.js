// V7 story content: every scene is data. `art` is the optional realistic illustration for the scene
// (art/scenes/<art>.png); without it the cutscene engine stages the fighters itself.
// Tone: affectionate satire. The joke is how absurd stereotypes are, so every arc ends with the label cracking.
//
// Scene shape: { id, mood, art, left, right, lines: [{ who, text }] }
//   who: fighter id, or 'narrator'. left/right: fighter ids shown in the scene (right may be null).
//   mood: 'calm' | 'tense' | 'comic' | 'triumph' | 'defeat'

import { CAST_STORY, SCENE_ART } from './cast-v7.js';

const L = (who, text) => ({ who, text });

export const TITLE_CARD = {
  title: 'STEREOTYPE FIGHTER',
  subtitle: 'The Ultimate Social Champion Tournament',
};

export const SCENES = {
  // ---------------------------------------------------------------- prologues
  'prologue:bogan-tradie': {
    mood: 'comic', art: 'prologue-bogan-tradie', left: 'bogan-tradie', right: null, place: 'A Bunnings car park, 6:42 a.m.',
    lines: [
      L('narrator', 'Gaz has framed more houses than he can count and has opinions about every one of them.'),
      L('bogan-tradie', 'Fair dinkum, a fighting tournament with a prize pool? That\'s smoko money sorted.'),
      L('bogan-tradie', 'They reckon I\'m just a bloke in a hi-vis with a ute. Cheeky. I\'m a bloke in a hi-vis with a ute and a plan.'),
      L('narrator', 'The plan is a deposit on a block of land. The tournament does not know what is coming.'),
    ],
  },
  'prologue:yuppie': {
    mood: 'tense', art: 'prologue-yuppie', left: 'yuppie', right: null, place: 'Harbour Capital, 54th floor',
    lines: [
      L('narrator', 'Preston turned a corner office into a personality and a personality into a brand.'),
      L('yuppie', 'Someone on the trading floor said private equity isn\'t a martial art. I\'ve decided it is.'),
      L('yuppie', 'This tournament is a hostile acquisition. I just need to find out who owns the ring.'),
      L('narrator', 'He books a car. Then forgets he does not drive it. Then books another car.'),
    ],
  },
  'prologue:gym-bro': {
    mood: 'comic', art: 'prologue-gym-bro', left: 'gym-bro', right: null, place: 'The 24/7 gym, a very specific rack',
    lines: [
      L('narrator', 'Tyler has not missed a session since the Great Protein Shortage of last Tuesday.'),
      L('gym-bro', 'Bro. A tournament? To see who the ultimate social champion is? I do social. I do champion.'),
      L('gym-bro', 'People say gym guys only talk about gym stuff. That is untrue. Sometimes I talk about the gym.'),
      L('narrator', 'He fills the shaker. It is not clear what is in it. The shaker is not clear either.'),
    ],
  },

  // ---------------------------------------------------- pre-fight (a vs b)
  'pre:bogan-tradie:yuppie': {
    mood: 'tense', art: 'pre-bogan-tradie-yuppie', left: 'bogan-tradie', right: 'yuppie', place: 'Arena floor, Neon Laneway',
    lines: [
      L('yuppie', 'You\'re the contractor with the ute. I\'m told you\'re "ruggedly undervalued."'),
      L('bogan-tradie', 'And you\'re the suit who\'s never held a spirit level. Reckon you\'d find it relaxing.'),
      L('yuppie', 'Let\'s circle back after I take you out of the market.'),
      L('bogan-tradie', 'Mate, I\'ve been circling back since seven. Come on, then.'),
    ],
  },
  'pre:yuppie:bogan-tradie': {
    mood: 'tense', art: 'pre-bogan-tradie-yuppie', left: 'yuppie', right: 'bogan-tradie', place: 'Arena floor, Neon Laneway',
    lines: [
      L('bogan-tradie', 'Nice briefcase. What\'s in it, a sandwich?'),
      L('yuppie', 'Deliverables. And, yes, a sandwich. It\'s a very good sandwich.'),
      L('bogan-tradie', 'Righto. Fight first, lunch after.'),
      L('yuppie', 'I\'ll put that in the calendar.'),
    ],
  },
  'pre:bogan-tradie:gym-bro': {
    mood: 'comic', art: 'pre-bogan-tradie-gym-bro', left: 'bogan-tradie', right: 'gym-bro', place: 'Arena floor, Neon Laneway',
    lines: [
      L('gym-bro', 'Bro. Are those steel caps? That\'s a lot of dead weight on a lift.'),
      L('bogan-tradie', 'It\'s not a lift, mate, it\'s a boot. It goes in your face.'),
      L('gym-bro', 'Respect. Honestly, great form. Let me tape a protein bar to your boot.'),
      L('bogan-tradie', 'That\'s the nicest thing anyone\'s ever said before I\'ve hit them.'),
    ],
  },
  'pre:gym-bro:bogan-tradie': {
    mood: 'comic', art: 'pre-bogan-tradie-gym-bro', left: 'gym-bro', right: 'bogan-tradie', place: 'Arena floor, Neon Laneway',
    lines: [
      L('bogan-tradie', 'Big bloke. Reckon you can lift a pallet of bricks?'),
      L('gym-bro', 'Bro, I can lift anything if it has a handle. Does it have a handle?'),
      L('bogan-tradie', 'It\'s a pallet.'),
      L('gym-bro', 'Then it\'s a lot of handles. Let\'s go.'),
    ],
  },
  'pre:yuppie:gym-bro': {
    mood: 'comic', art: 'pre-yuppie-gym-bro', left: 'yuppie', right: 'gym-bro', place: 'Arena floor, Neon Laneway',
    lines: [
      L('gym-bro', 'Bro, nice suit. Do you even flex?'),
      L('yuppie', 'Every quarter. It\'s called a stretch target.'),
      L('gym-bro', 'That is the most sophisticated thing I have ever heard.'),
      L('yuppie', 'It\'s also on a slide. I\'ll send you the deck.'),
    ],
  },
  'pre:gym-bro:yuppie': {
    mood: 'tense', art: 'pre-yuppie-gym-bro', left: 'gym-bro', right: 'yuppie', place: 'Arena floor, Neon Laneway',
    lines: [
      L('yuppie', 'Tyler. Your shaker bottle is leaking onto my loafers.'),
      L('gym-bro', 'It\'s not leaking, bro, it\'s pre-workout. For the floor.'),
      L('yuppie', 'Those are Italian.'),
      L('gym-bro', 'And now they\'re fortified. Respect the gains.'),
    ],
  },

  // ----------------------------------------------- post-fight (winner, loser)
  'post:bogan-tradie:yuppie': {
    mood: 'triumph', art: 'post-bogan-tradie-yuppie', left: 'bogan-tradie', right: 'yuppie', place: 'Arena floor',
    lines: [
      L('bogan-tradie', 'You alright, Preston? Brought you a sausage sandwich. Nobody should lose on an empty stomach.'),
      L('yuppie', 'I was told your type only cares about the tools. You didn\'t even use the nail gun.'),
      L('bogan-tradie', 'And I was told yours only cares about money. You paid for the ambulance. Twice.'),
      L('yuppie', '...I think we\'ve both been briefed by the same bad consultant.'),
    ],
  },
  'post:yuppie:bogan-tradie': {
    mood: 'triumph', art: 'post-yuppie-bogan-tradie', left: 'yuppie', right: 'bogan-tradie', place: 'Arena floor',
    lines: [
      L('yuppie', 'It was a clean win. I\'ll have my assistant send you a ride home.'),
      L('bogan-tradie', 'Nah, I\'ve got the ute. You look like you could use a lift, though.'),
      L('yuppie', 'You\'re offering me a lift after I flattened you?'),
      L('bogan-tradie', 'Mate, it\'s a tournament. Not a war. Get in.'),
    ],
  },
  'post:bogan-tradie:gym-bro': {
    mood: 'triumph', art: 'post-bogan-tradie-gym-bro', left: 'bogan-tradie', right: 'gym-bro', place: 'Arena floor',
    lines: [
      L('bogan-tradie', 'Good fight. You\'ve got more technique than I figured.'),
      L('gym-bro', 'I read all of Wikipedia once. The whole fighting section. It was mostly about bridges.'),
      L('bogan-tradie', 'I\'ll teach you to build one. Honest work, no shaker required.'),
      L('gym-bro', 'Bro. A bridge. That is leg day for the soul.'),
    ],
  },
  'post:gym-bro:bogan-tradie': {
    mood: 'triumph', art: 'post-gym-bro-bogan-tradie', left: 'gym-bro', right: 'bogan-tradie', place: 'Arena floor',
    lines: [
      L('gym-bro', 'You good, bro? You took that Leg Day Tsunami like an absolute pro.'),
      L('bogan-tradie', 'Cheers. Your technique is bloody sharp for a bloke who talks that much.'),
      L('gym-bro', 'Same to you. I thought tradies only knew how to drink and leave.'),
      L('bogan-tradie', 'I thought gym blokes only knew how to lift and talk. Seems we both bought the brochure.'),
    ],
  },
  'post:yuppie:gym-bro': {
    mood: 'triumph', art: 'post-yuppie-gym-bro', left: 'yuppie', right: 'gym-bro', place: 'Arena floor',
    lines: [
      L('yuppie', 'Tyler, I owe you an apology. I assumed you were all muscle and no strategy.'),
      L('gym-bro', 'And I thought you were all suit and no heart. You carried me to the medic tent.'),
      L('yuppie', 'It was a transactional gesture. With a warm undertone.'),
      L('gym-bro', 'Bro, that is the most emotionally intelligent thing a finance guy has ever said.'),
    ],
  },
  'post:gym-bro:yuppie': {
    mood: 'triumph', art: 'post-gym-bro-yuppie', left: 'gym-bro', right: 'yuppie', place: 'Arena floor',
    lines: [
      L('gym-bro', 'GG, Preston. You hit like a rounding error, but a really motivated one.'),
      L('yuppie', 'That is, frankly, a compliment. Are you going to gloat?'),
      L('gym-bro', 'Nah. I\'m going to ask you to teach me about compound interest. I want those gains too.'),
      L('yuppie', '...Come to my office. Bring the shaker. We\'ll invest in each other.'),
    ],
  },

  // --------------------------------------------------------------- endings
  'ending:bogan-tradie': {
    mood: 'triumph', art: 'ending-bogan-tradie', left: 'bogan-tradie', right: null, place: 'A block of land, golden hour',
    lines: [
      L('narrator', 'Gaz is declared the Ultimate Social Champion. The trophy is a bronze spirit level.'),
      L('bogan-tradie', 'Funny thing, mate. All week, people kept telling me what a bogan does. I did none of it.'),
      L('bogan-tradie', 'Turns out I\'m a bloke who builds things, makes a decent sandwich and apologises to the people he knocks out.'),
      L('narrator', 'The label peels off like cheap sticker paper. Underneath is just a person.'),
    ],
  },
  'ending:yuppie': {
    mood: 'triumph', art: 'ending-yuppie', left: 'yuppie', right: null, place: 'Harbour Capital, rooftop, dawn',
    lines: [
      L('narrator', 'Preston wins the title and, for the first time in ten years, does not check his phone.'),
      L('yuppie', 'Everyone said a man like me can\'t lose gracefully. I lost three rounds gracefully. Pretty good.'),
      L('yuppie', 'I\'m starting a fund. For fighters who need physio and sandwiches. The ROI is... feelings.'),
      L('narrator', 'He looks at the skyline. The skyline does not look back. It never did.'),
    ],
  },
  'ending:gym-bro': {
    mood: 'triumph', art: 'ending-gym-bro', left: 'gym-bro', right: null, place: 'The 24/7 gym, empty at 3 a.m.',
    lines: [
      L('narrator', 'Tyler wins by knockout, then asks if the loser is okay. That is the real trophy.'),
      L('gym-bro', 'They said gym guys are all ego. Turns out my ego has a spotter.'),
      L('gym-bro', 'I\'m tired, bro. Not leg-day tired. Pretending-to-be-a-stereotype tired.'),
      L('narrator', 'He sets the shaker down. It rolls under the squat rack and is never seen again.'),
    ],
  },
};

// ---- the 17 additional fighters: prologue + ending are written per fighter (cast_data.py)
for (const [id, c] of Object.entries(CAST_STORY)) {
  if (!c.prologue) continue;
  const map = ls => ls.map(([k, t]) => (k === 'me' ? L(id, t) : L('narrator', t)));
  SCENES[`prologue:${id}`] = { mood: c.prologue.mood, art: SCENE_ART.has(`prologue-${id}`) ? `prologue-${id}` : null, left: id, right: null, place: c.prologue.place, lines: map(c.prologue.lines) };
  SCENES[`ending:${id}`] = { mood: c.ending.mood, art: SCENE_ART.has(`ending-${id}`) ? `ending-${id}` : null, left: id, right: null, place: c.ending.place, lines: map(c.ending.lines) };
}

const fill = (t, opp) => t.replace(/\{opp\}/g, opp);

// Pre/post scenes for any pair are built from each fighter's own voice lines, so 20 fighters need 20 voices, not 380 scripts.
// Hand-written scenes in SCENES (the original three against each other) win over these.
export function getScene(id) {
  if (SCENES[id]) return SCENES[id];
  const [kind, a, b] = id.split(':');
  const A = CAST_STORY[a], B = CAST_STORY[b];
  if (!A || !B) return null;
  if (kind === 'pre') {
    const art = [`pre-${a}-${b}`, `pre-${b}-${a}`].find(x => SCENE_ART.has(x)) || null;
    return { mood: 'tense', art, left: a, right: b, place: 'Arena floor, Neon Laneway',
      lines: [L(a, fill(A.taunt, B.nick)), L(b, fill(B.answer, A.nick)), L(a, fill(A.quip, B.nick)), L(b, fill(B.ready, A.nick))] };
  }
  if (kind === 'post') { // a = winner, b = loser
    return { mood: 'triumph', art: null, left: a, right: b, place: 'After the bell',
      lines: [L(a, fill(A.win, B.nick)), L(b, fill(B.lose, A.nick)), L(b, fill(B.respect, A.nick)),
              L('narrator', `${A.nick} and ${B.nick} walk out together. Both were told what the other one was like. Both got it wrong.`)] };
  }
  return null;
}

export const sceneId = {
  prologue: id => `prologue:${id}`,
  pre: (a, b) => `pre:${a}:${b}`,
  post: (w, l) => `post:${w}:${l}`,
  ending: id => `ending:${id}`,
};

// Story-mode ladder: each fighter's own rivals (from cast_data.py), in order, so the 20-fighter story is a 4-fight run.
export function ladderFor(id, roster) {
  const have = new Set(roster.map(r => r.id));
  const rivals = ((CAST_STORY[id] && CAST_STORY[id].rivals) || []).filter(x => have.has(x) && x !== id);
  const rest = roster.map(r => r.id).filter(x => x !== id && !rivals.includes(x));
  return rivals.concat(rest).slice(0, 4);
}
