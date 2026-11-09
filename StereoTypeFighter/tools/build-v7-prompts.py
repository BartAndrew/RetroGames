#!/usr/bin/env python3
"""Builds every V7 art prompt (character sheets, portraits, animation strips, single frames, cutscenes).

Run:  python3 tools/build-v7-prompts.py        (from StereoTypeFighter/)
Writes: art/PROMPTS.md, art/prompts-v7.json, art/manifest.v7.template.json

Edit the data below (locks, frame beats, scenes) and re-run to regenerate everything consistently.
"""
import json, os

HERE = os.path.dirname(os.path.abspath(__file__))
ART = os.path.join(HERE, '..', 'art')

STYLE_PREFIX = "Photorealistic fighting-game character art, cinematic studio quality, believable anatomy and fabric,"
STYLE_SUFFIX = ("Soft key light from upper left with a subtle cool rim light, sharp focus, consistent face and costume, "
                "plain flat mid-grey background (for easy cut-out), no text, no logo, no watermark, no extra limbs, "
                "no cropped limbs, no outfit changes.")
NEGATIVE = ("text, logo, watermark, caption, extra fingers, extra limbs, cropped feet, cropped hands, different outfit, "
            "different face, cartoon, pixel art, celebrity likeness, blurry, deformed")

# ----------------------------------------------------------------- fighters
FIGHTERS = {
  'bogan-tradie': dict(
    name='Bogan Tradie', nick='Gaz',
    lock=("Gaz, an original fictional Australian tradesman in his mid-30s, stocky athletic build, weathered friendly face with light stubble, "
          "short brown hair under a yellow hard hat, orange hi-vis vest with two yellow reflective bands over a grey work shirt with rolled sleeves, "
          "navy cargo work trousers, brown steel-capped boots, worn leather work gloves tucked into his belt"),
    face="weathered friendly face, light stubble, squinting grin",
    victory="holds up a bronze spirit-level trophy and grins proudly",
    intro_a="tips the brim of the hard hat with two fingers",
    intro_b="cracks his knuckles and rolls his neck",
    special_name="Nail Gun Burst",
    special=[
      "guard stance, eyes locked on the opponent",
      "lead hand drops to a hip holster, shoulders turning side-on",
      "draws a bright yellow pneumatic nail gun, body turned sideways",
      "aims and fires: muzzle flash, arm recoiling, nails streaking forward",
      "second shot, bigger recoil, a spray of nails in a line toward the opponent",
      "lowers the nail gun and exhales, returning to guard",
    ],
    super_name="KNOCK-OFF TIME",
    charge="hands on hips, head thrown back bellowing, hi-vis vest glowing with golden light",
    fa="shovel-hand chop with the lead hand",
    fb="steel-capped front kick",
    fc="rapid double jab",
    fin_wind="spinning with a long aluminium spirit level held in both hands overhead",
    fin_hit="slamming the spirit level straight down, the ground cracking beneath it",
    prop="none",
  ),
  'yuppie': dict(
    name='Yuppie', nick='Preston',
    lock=("Preston, an original fictional American finance professional in his mid-30s, lean athletic build, sharp jaw, slicked-back dark hair, "
          "tailored navy suit jacket and trousers, crisp white shirt, red tie, polished black leather shoes, brown leather briefcase, steel wristwatch"),
    face="sharp jaw, confident smirk, slicked-back hair",
    victory="straightens his tie and checks his wristwatch with a smirk",
    intro_a="adjusts his cufflinks without breaking eye contact",
    intro_b="taps the briefcase like he is closing a deal",
    special_name="Hostile Takeover",
    special=[
      "guard stance, briefcase in the rear hand",
      "pulls the briefcase back, shoulders dropping",
      "lowers lead shoulder, briefcase held out front like a battering ram",
      "charging forward low and fast, suit jacket flaring, motion blur behind",
      "impact: shoulder and briefcase driving forward, back foot digging in",
      "straightens up, adjusting his jacket, back to guard",
    ],
    super_name="GOLDEN PARACHUTE",
    charge="crouches with the briefcase hugged to his chest, golden light and stock-ticker glow around him",
    fa="briefcase swing",
    fb="loafer snap kick",
    fc="cuff jab",
    fin_wind="leaping high with the briefcase raised overhead, jacket flaring",
    fin_hit="crashing down with a briefcase slam, a golden parachute-shaped burst of light",
    prop="briefcase",
  ),
  'gym-bro': dict(
    name='Gym Bro', nick='Tyler',
    lock=("Tyler, an original fictional American gym-goer in his mid-20s, very muscular with broad shoulders, short dark hair, white sweatband, "
          "neon-green tank top, black training shorts, white trainers, a clear shaker bottle with green contents, friendly intense expression"),
    face="friendly intense expression, bright eyes, slight grin",
    victory="flexes both biceps with the shaker bottle in one hand",
    intro_a="chugs from the shaker bottle",
    intro_b="pops a chest-flex and winks",
    special_name="Protein Shaker Blast",
    special=[
      "guard stance, shaker bottle clipped at the hip",
      "pulls the clear shaker bottle free from his hip",
      "shakes it hard, green contents swirling",
      "pops the lid, green liquid surging inside",
      "hurls the shaker forward with a full throw, a green shockwave leaving his hand",
      "follow-through, flexing the throwing arm",
    ],
    super_name="LEG DAY TSUNAMI",
    charge="drops into a heavy squat, shaker set down, veins and a green aura rising",
    fa="bicep cross",
    fb="quad axe kick",
    fc="pump jab",
    fin_wind="dropping into a deep squat with one fist on the ground",
    fin_hit="slamming the ground with a stomp, a tsunami of green light surging forward",
    prop="shaker",
  ),
}

# ------------------------------------------------------------ animation beats
# (name, kind, frames[...]) kind: loop | attack | once. Lead = hand/foot nearest the opponent. Fighter faces right.
def A(name, kind, *frames): return (name, kind, list(frames))

COMMON = [
  A('idle', 'loop',
    "relaxed fighting stance, knees slightly bent, lead fist at the chin, rear fist by the jaw, weight centred",
    "chest rises slightly as he breathes in, shoulders lift",
    "highest point of the bounce, guard unchanged, head level",
    "settles, weight shifts a touch onto the rear foot",
    "lowest point of the bounce, knees bending a little deeper",
    "returns toward the first pose with a tiny head tilt"),
  A('walk', 'loop',
    "contact pose: lead foot lands heel first, rear heel lifting, guard up",
    "weight transfers onto the lead leg, rear knee swings forward",
    "passing pose: rear leg passes beside the lead leg, body at its highest",
    "rear foot reaches forward, lead foot pushes off the ground",
    "rear foot lands, lead leg lifts, guard still up",
    "second passing pose mirrored, body at its highest"),
  A('walkBack', 'loop',
    "retreating, lead foot slides backward, torso leaning back slightly, guard high",
    "rear foot steps back, weight over the rear leg",
    "passing pose retreating, both legs close together, guard high",
    "lead foot pushes backward, rear leg planting",
    "rear foot lands, lead foot slides back again",
    "settling into a wider stance, eyes on the opponent"),
  A('dashF', 'loop',
    "low lunge start, torso leaning forward about 25 degrees, rear foot driving",
    "full stride, almost airborne, torso low, arms tucked back",
    "landing slide, front foot planted, motion-blur streaks behind him"),
  A('dashB', 'loop',
    "pushes off the front foot, leaning back, guard up",
    "hop backward with both feet off the ground, guard up",
    "landing on the rear foot, knees absorbing, eyes on the opponent"),
  A('crouch', 'loop',
    "dropping into a crouch, hands guarding the face",
    "full crouch, thighs parallel to the ground, guard at the face"),
  A('block', 'loop',
    "raising both forearms to cover face and chest, elbows tucked in",
    "braced behind the guard, shoulders hunched, grimacing"),
  A('blockLow', 'loop',
    "crouching with forearms low, covering the shins and body",
    "braced in the crouch, head tucked behind the guard"),
  A('prejump', 'loop', "deep knee bend, arms swung back, about to spring upward"),
  A('jumpUp', 'loop',
    "launching: legs extending, arms driving up",
    "rising: knees tucking, fists near the chin"),
  A('jumpApex', 'loop', "at the top of the jump, knees tucked, fists up, body compact"),
  A('jumpDown', 'loop',
    "descending, legs stretching downward, arms guarding",
    "about to land, feet pointing down, knees soft"),
  A('land', 'loop', "landing crouch, knees deeply bent absorbing the impact, one hand brushing the ground"),
  A('lp', 'attack',
    "guard stance, eyes locked on the opponent",
    "lead shoulder dips and the lead fist pulls back slightly",
    "IMPACT: lead arm snapping straight, fist at chin height, torso twisting forward",
    "arm fully extended with a small follow-through, rear hand guarding the jaw",
    "fist retracts toward the guard"),
  A('lk', 'attack',
    "guard stance",
    "lifts the lead knee, chambering the kick",
    "IMPACT: lead shin snaps out low toward thigh height, torso leaning back slightly",
    "leg fully extended with the foot flat, arms balancing",
    "leg retracts and plants, returning to guard"),
  A('hp', 'attack',
    "guard stance",
    "rear fist drawn back by the hip, weight loading onto the rear leg, torso coiled",
    "hips rotating, rear shoulder driving forward",
    "IMPACT: rear arm fully extended, torso rotated, front foot planted, big forward lean",
    "follow-through leaning far forward, weight over the front knee",
    "recovering back to guard"),
  A('hk', 'attack',
    "guard stance",
    "small hop, lead knee rising",
    "leg swung high above the head, body leaning back",
    "leg descending, torso tilting forward, heel leading",
    "IMPACT: heel driving down at head height, standing leg bent",
    "lands and recovers to guard"),
  A('launcher', 'attack',
    "guard stance",
    "dropping into a deep crouch, rear fist by the hip",
    "coiled low, eyes on the opponent's chin",
    "explosive rise, rear fist driving upward",
    "IMPACT: arm fully extended skyward, legs extended on tiptoes, head back",
    "coming down, recovering to guard"),
  A('sweep', 'attack',
    "guard stance",
    "dropping low, one hand reaching toward the ground",
    "body pivoting, lead leg beginning to extend",
    "IMPACT: lead leg fully extended along the ground at ankle height, torso low and leaning away, hand on the ground",
    "leg slides back as he starts to rise",
    "back in a crouch guard"),
  A('airP', 'attack',
    "mid-jump, fist cocked back",
    "diving diagonally, lead fist starting forward",
    "IMPACT: arm fully extended forward and down, legs tucked",
    "follow-through while descending"),
  A('airK', 'attack',
    "mid-jump, knees tucked",
    "one leg extending diagonally downward",
    "IMPACT: leg fully extended in a diagonal flying kick, torso leaning back, arms out for balance",
    "leg retracting while descending"),
  A('hurt', 'loop',
    "head snapping back from a hit, eyes squeezed shut, torso recoiling",
    "stumbling backward, guard dropped, grimacing"),
  A('hurtLow', 'loop',
    "crouched, hit low, wincing, one leg buckling",
    "crouched and stumbling, hand dropping to the knee"),
  A('launched', 'loop',
    "lifted off the ground, torso arched back, limbs flailing",
    "mid-air, nearly horizontal, tumbling backward",
    "falling, arms out, about to land"),
  A('knockdown', 'loop',
    "slamming onto his back, a puff of dust, arms thrown out",
    "lying flat, dazed, head turned slightly"),
  A('ko', 'loop', "lying flat on his back, completely limp, eyes closed"),
  A('getup', 'once',
    "lying on his back, groaning",
    "rolling to the side, propping on one elbow",
    "pushing up onto one knee",
    "rising into a crouch",
    "standing up straight into a guard stance"),
]

def per_fighter(fid):
    f = FIGHTERS[fid]
    out = []
    out.append(A('special', 'attack', *f['special']))
    s = [
        "crouching to gather power, " + f['charge'],
        "charge peak: " + f['charge'] + ", energy flaring",
        "explosive launch into the flurry, " + f['fa'],
        "IMPACT: " + f['fa'],
        "windup for " + f['fb'],
        "IMPACT: " + f['fb'],
        "IMPACT: " + f['fc'],
        "again: " + f['fa'],
        "again: " + f['fb'],
        "finisher windup: " + f['fin_wind'],
        "FINISHER IMPACT: " + f['fin_hit'],
        "recovering, breathing hard, shoulders heaving",
    ]
    out.append(A('super', 'attack', *s))
    out.append(A('victory', 'loop',
        "straightening up, breathing hard",
        "raising the lead fist overhead",
        "arm fully raised in triumph, chest out",
        "signature celebration: " + f['victory']))
    out.append(A('intro', 'loop',
        "stepping into frame with confidence",
        "taunt: " + f['intro_a'],
        "taunt: " + f['intro_b'],
        "settling into a guard stance with a smirk"))
    return out

def anims_for(fid):
    return COMMON + per_fighter(fid)

# ------------------------------------------------------------------ cutscenes
CUT_RULES = ("Cinematic photoreal film still, 16:9 wide (1920x1080), shallow depth of field, natural skin and fabric detail. "
             "Keep the bottom 28% of the frame visually quiet (floor, sky, shadow or blur) because the dialogue box covers it; "
             "keep faces and key action in the top 70%. No text, no logos, no watermark.")

SCENES = [
  ('prologue-bogan-tradie', 'comic', "dawn, 6:42 a.m., warm low sun",
   "A large Australian hardware-store car park at dawn, a sausage-sizzle stand setting up, a work ute with a ladder rack. {bogan} leans on the ute with a takeaway coffee, reading a crumpled tournament flyer and raising one eyebrow, hi-vis catching the sunrise.",
   ['bogan-tradie']),
  ('prologue-yuppie', 'tense', "dusk, cool blue and magenta glow",
   "A corner office on the 54th floor above a harbour city skyline at dusk. {yuppie} stands at the glass with a phone in one hand, three ride-app notifications glowing on the screen, jacket off, tie loosened, the briefcase on the desk behind him.",
   ['yuppie']),
  ('prologue-gym-bro', 'comic', "bright overhead gym lighting with neon accents",
   "A 24/7 gym, a squat rack behind him, rows of mirrors. {gym} fills a clear shaker bottle with green powder, mid-laugh, looking confidently at the camera.",
   ['gym-bro']),
  ('pre-bogan-tradie-yuppie', 'tense', "neon laneway arena, purple and teal light, hazy air",
   "Face-off in a neon-lit city laneway arena, crowd blurred in the background. {bogan} on the left, boots planted, fists loose; {yuppie} on the right gripping his briefcase. Low camera angle, the two looking directly at each other, sparks of neon on wet ground.",
   ['bogan-tradie', 'yuppie']),
  ('pre-bogan-tradie-gym-bro', 'comic', "neon laneway arena, warm orange and green light",
   "Neon laneway arena. {bogan} on the left lifts a steel-capped boot, bemused; {gym} on the right holds out a protein bar as if to tape it on, enthusiastic. Crowd blurred behind them. Comic tension.",
   ['bogan-tradie', 'gym-bro']),
  ('pre-yuppie-gym-bro', 'comic', "neon laneway arena, teal and green light",
   "Neon laneway arena. {yuppie} on the left holding a tablet showing a slide deck, one eyebrow up; {gym} on the right, a green liquid dripping from the shaker onto Preston's polished loafers. Crowd blurred.",
   ['yuppie', 'gym-bro']),
  ('post-bogan-tradie-yuppie', 'triumph', "arena floor after the fight, warm medic-tent light",
   "{yuppie} sits on the arena floor against the ring edge, bruised, jacket torn, tie loosened. {bogan} crouches beside him and offers a sausage sandwich wrapped in paper, smiling. A medic tent glows in the background.",
   ['bogan-tradie', 'yuppie']),
  ('post-yuppie-bogan-tradie', 'triumph', "night car park outside the arena, headlights and neon",
   "Night car park outside the arena. {bogan} (bruised, grinning) holds open the passenger door of his work ute; {yuppie} (the winner, an ice pack on his jaw, suit rumpled) hesitates, then half-smiles. Headlights flare softly.",
   ['yuppie', 'bogan-tradie']),
  ('post-bogan-tradie-gym-bro', 'triumph', "arena floor after the fight, warm golden light",
   "{bogan} (the winner) crouches next to {gym}, sketching a bridge on a pizza box with a carpenter's pencil while Tyler studies it with wide, amazed eyes. Empty arena seating behind them.",
   ['bogan-tradie', 'gym-bro']),
  ('post-gym-bro-bogan-tradie', 'triumph', "arena floor after the fight, warm golden light",
   "{gym} (the winner) pulls {bogan} to his feet in a handshake-turned-hug, both battered and laughing, the shaker bottle lying on the floor between them.",
   ['gym-bro', 'bogan-tradie']),
  ('post-yuppie-gym-bro', 'triumph', "medic-tent light, soft and warm",
   "{yuppie} (the winner) helps {gym} walk toward a medic tent, Tyler's arm over his shoulders, Preston's tie loosened and sleeves rolled up, both exhausted and smiling.",
   ['yuppie', 'gym-bro']),
  ('post-gym-bro-yuppie', 'triumph', "quiet arena bench, warm light, confetti on the floor",
   "{gym} (the winner) sits on a bench beside {yuppie}, holding a small notepad and pen, listening earnestly while Preston explains something on his fingers. The shaker bottle sits between them next to a paper coffee cup.",
   ['gym-bro', 'yuppie']),
  ('ending-bogan-tradie', 'triumph', "golden hour, long warm shadows",
   "A bare block of land at golden hour with timber framing half-built behind him. {bogan}, hi-vis dusty, holds a small bronze spirit-level trophy at his side, looking out at the horizon with a calm, relieved smile.",
   ['bogan-tradie']),
  ('ending-yuppie', 'triumph', "dawn, soft pink and gold",
   "A city rooftop at dawn. {yuppie}, tie loosened, jacket over one shoulder, phone left face-down on a ledge, watching the sunrise over the skyline with an unguarded, genuine smile.",
   ['yuppie']),
  ('ending-gym-bro', 'triumph', "empty gym at 3 a.m., soft overhead light and a single neon sign",
   "An empty 24/7 gym at 3 a.m. {gym} sits on a bench, exhausted, trophy beside him, looking relieved. In the foreground a shaker bottle has rolled under the squat rack.",
   ['gym-bro']),
]

PORTRAIT = ("Three-quarter body portrait for a character-select screen, standing in a confident guard stance facing right, "
            "knees to head visible with a little room above, transparent or plain flat grey background, 2:3 portrait, ")

# --------------------------------------------------------------------- build
def frame_prompt(fid, anim, i, n, text):
    f = FIGHTERS[fid]
    return (f"{STYLE_PREFIX} {f['lock']}. Full body, side view, facing right, same camera height and distance in every frame. "
            f"Animation '{anim}', frame {i} of {n}: {text}. {STYLE_SUFFIX}")

def strip_prompt(fid, anim, frames):
    f = FIGHTERS[fid]
    n = len(frames)
    beats = ' '.join(f"{i}) {t}." for i, t in enumerate(frames, 1))
    return (f"{STYLE_PREFIX} {f['lock']}. Animation sprite strip for '{anim}': {n} frames in one horizontal row, equal spacing, "
            f"identical camera, scale and lighting, feet on one shared baseline, character facing right. Frames left to right: {beats} {STYLE_SUFFIX}")

def sheet_prompt(fid):
    f = FIGHTERS[fid]
    return (f"{STYLE_PREFIX} {f['lock']}. Character reference sheet: five full-body views in one row on a plain grey background "
            f"(front, three-quarter front, side facing right, three-quarter back, back), neutral relaxed stance, plus a row of three "
            f"face close-ups below (neutral, determined, grinning) showing {f['face']}. Identical costume, proportions and lighting in every view. {STYLE_SUFFIX}")

def portrait_prompt(fid):
    f = FIGHTERS[fid]
    return f"{STYLE_PREFIX} {PORTRAIT}{f['lock']}, {f['face']}. {STYLE_SUFFIX}"

def scene_prompt(art, mood, light, body):
    return f"{CUT_RULES} Mood: {mood}. Light: {light}. " + body

def build():
    data = dict(style_prefix=STYLE_PREFIX, style_suffix=STYLE_SUFFIX, negative=NEGATIVE, fighters={}, scenes={})
    manifest = {"scenes": True}
    md = []
    w = md.append
    w("# StereoType Fighter V7: Art Prompts\n")
    w("Generated by `tools/build-v7-prompts.py`. Edit the data in that script and re-run it to regenerate this file, "
      "`prompts-v7.json` (one entry per frame, for batch tools) and `manifest.v7.template.json`.\n")
    w("Frame counts here supersede the suggestions in `ART_SPEC.md`.\n")
    w("## Workflow (do it in this order)\n")
    w("1. **Reference sheet** for each fighter (prompt below). Pick one result and keep it. Use it as the image reference for everything else.\n"
      "2. **Portrait** for each fighter.\n"
      "3. **Animation strips**: one prompt per animation (or the single-frame prompts in the JSON if your tool does better one image at a time). "
      "Always attach the reference sheet and reuse the same seed where your tool allows.\n"
      "4. **Slice** strips into numbered frames: `python3 tools/slice-v7-strip.py strip.png 6 art/<id>/<anim>`.\n"
      "5. **Cutscenes**: one image per prompt in the cutscene section, with the fighter reference sheets attached.\n"
      "6. Copy `art/manifest.v7.template.json` to `art/manifest.json`.\n")
    w("**Negative prompt** (if your tool has one): " + NEGATIVE + "\n")
    w("**Style prefix** used in every prompt: " + STYLE_PREFIX + "\n")
    w("**Style suffix** used in every prompt: " + STYLE_SUFFIX + "\n")
    total = 0
    for fid, f in FIGHTERS.items():
        anims = anims_for(fid)
        data['fighters'][fid] = dict(name=f['name'], lock=f['lock'], reference_sheet=sheet_prompt(fid), portrait=portrait_prompt(fid), strips={}, frames={})
        manifest[fid] = dict(path="art/{id}/{anim}/{n}.png", portrait="art/{id}/portrait.png", anchor=[256, 470], scale=0.38, anims={})
        w(f"\n---\n\n## {f['name']} ({f['nick']}), id `{fid}`\n")
        w("**Locked description:** " + f['lock'] + ".\n")
        w("### 1. Reference sheet\n")
        w("```\n" + sheet_prompt(fid) + "\n```\n")
        w("### 2. Portrait (`art/%s/portrait.png`)\n" % fid)
        w("```\n" + portrait_prompt(fid) + "\n```\n")
        w("### 3. Animation strips (`art/%s/<anim>/NN.png`)\n" % fid)
        for name, kind, frames in anims:
            strip = strip_prompt(fid, name, frames)
            data['fighters'][fid]['strips'][name] = strip
            data['fighters'][fid]['frames'][name] = [frame_prompt(fid, name, i, len(frames), t) for i, t in enumerate(frames, 1)]
            total += len(frames)
            spec = {"frames": len(frames)}
            if kind == 'loop': spec["fps"] = {'idle': 7, 'walk': 11, 'walkBack': 10, 'victory': 6, 'intro': 6, 'hurt': 6}.get(name, 8)
            if kind == 'once': spec["fps"] = 12; spec["once"] = True
            manifest[fid]["anims"][name] = spec
            w(f"**`{name}`** ({len(frames)} frames, {kind})\n")
            w("```\n" + strip + "\n```\n")
    w("\n---\n\n## 4. Cutscene illustrations (`art/scenes/<name>.png`)\n")
    w("Set `\"scenes\": true` in `art/manifest.json` (already set in the template). Several story scenes share one image, so there are 15 images, not 18.\n")
    lookup = {k: v['lock'] for k, v in FIGHTERS.items()}
    def tag(fid, nick): return nick + " (" + lookup[fid].split(', ', 1)[1] + ")"
    fmt = dict(bogan=tag('bogan-tradie', 'Gaz'), yuppie=tag('yuppie', 'Preston'), gym=tag('gym-bro', 'Tyler'))
    for art, mood, light, body, who in SCENES:
        p = scene_prompt(art, mood, light, body.format(**fmt))
        data['scenes'][art] = dict(prompt=p, fighters=who)
        w(f"### `{art}.png`\n")
        w("Attach reference sheets: " + ', '.join(f"`{x}`" for x in who) + "\n")
        w("```\n" + p + "\n```\n")
    w("\n## Content rules\n")
    w("- Every character is an original fictional person. Do not use real people's names or likenesses in prompts.\n"
      "- Keep the satire on tropes and behaviours (hi-vis and sandwiches, synergy talk, shaker bottles), affectionate and self-aware.\n"
      "- Injuries in the post-fight scenes are bruises and torn clothing only: warm, not gory.\n")
    return data, manifest, '\n'.join(md), total

if __name__ == '__main__':
    data, manifest, md, total = build()
    os.makedirs(ART, exist_ok=True)
    with open(os.path.join(ART, 'PROMPTS.md'), 'w') as fh: fh.write(md)
    with open(os.path.join(ART, 'prompts-v7.json'), 'w') as fh: json.dump(data, fh, indent=1)
    with open(os.path.join(ART, 'manifest.v7.template.json'), 'w') as fh: json.dump(manifest, fh, indent=2)
    strips = sum(len(v['strips']) for v in data['fighters'].values())
    print(f"fighters={len(data['fighters'])} strips={strips} frames={total} scenes={len(data['scenes'])}")
