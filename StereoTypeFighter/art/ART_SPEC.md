# StereoType Fighter V7: Art Spec

The V7 engine draws **your frames** whenever they exist and falls back to a built-in stand-in figure when they don't.
You can drop in art one fighter, one animation at a time. Nothing in the code needs to change.

## How the game finds your art

1. Copy `manifest.example.json` to `art/manifest.json` and edit it.
2. Put frames at the path the manifest gives, by default `art/<fighter-id>/<anim>/<NN>.png` (`01.png`, `02.png`, ...).
3. Reload `v7.html`. A fighter with a manifest entry uses your frames; others keep the stand-in.

Fighter ids in the V7 slice: `bogan-tradie`, `yuppie`, `gym-bro`.

## Frame rules (these keep all 19 animations lined up)

| Rule | Value |
| --- | --- |
| Format | PNG with transparent background |
| Canvas | Same size for every frame of a fighter (recommended 512 x 512) |
| Facing | Fighter faces **right** |
| Foot baseline | Feet on the same pixel row in every frame. Put that row in the manifest as `anchor` |
| Horizontal anchor | Centre of the body at idle. Put it in the manifest as `anchor` |
| Scale | The `scale` value in the manifest. Idle should be about 130 game pixels tall (e.g. 340 px at scale 0.38) |
| Lighting | One consistent key light from upper left, same on every frame |
| Face and costume | Locked reference per fighter (see prompts); do not change between frames |

## Animations the engine will ask for

Attacks are **progress-driven**: the engine picks the frame from how far through the move the fighter is, and
cross-fades neighbouring frames. So list frames in time order: windup, impact (the pose where the hit lands), follow-through.
More frames means smoother flow. Eight is a good target for attacks.

| Animation | Type | Suggested frames | Notes |
| --- | --- | --- | --- |
| `idle` | loop | 6-8 | Breathing, guard up |
| `walk` / `walkBack` | loop | 8 | Back-walk keeps guard high |
| `dashF` / `dashB` | loop | 3-4 | Lean, motion blur welcome |
| `crouch` | loop | 1-2 | |
| `prejump`, `jumpUp`, `jumpApex`, `jumpDown`, `land` | loop | 1-3 each | |
| `block` / `blockLow` | loop | 1-2 | |
| `lp` Jab | attack | 5-6 | Fast, small |
| `lk` Low Kick | attack | 6 | |
| `hp` Cross | attack | 8 | Whole-body rotation, big follow-through |
| `hk` Axe Kick | attack | 8 | Overhead |
| `launcher` Uppercut | attack | 8 | Rising, ends airborne |
| `sweep` | attack | 8 | Very low |
| `airP`, `airK` | attack | 5 | |
| `special` | attack | 8 | Fighter-specific (nail gun, briefcase charge, shaker) |
| `super` | attack | 12-16 | Charge pose, flurry, finishing blow |
| `hurt`, `hurtLow` | loop | 2 | |
| `launched` | loop | 3 | Tumbling |
| `knockdown`, `ko` | loop | 1-2 | Flat on back |
| `getup` | once | 6 | Mark `"once": true` |
| `victory`, `intro` | loop | 4 | |

Missing animations fall back automatically (for example `blockLow` uses `block`, `dashF` uses `walk`),
so you can start with `idle`, `walk`, `lp`, `hp`, `lk`, `hurt`, `knockdown` and add the rest later.

## Extra images (all optional)

| File | Used for |
| --- | --- |
| `art/<id>/portrait.png` | Character select and result screens (set `"portrait"` in the manifest) |
| `art/scenes/<scene-art>.png` | Full-frame cutscene illustration, 1920 x 1080. Names are in `story-v7.js` (the `art` field), e.g. `prologue-bogan-tradie`, `pre-bogan-tradie-yuppie`, `post-yuppie-gym-bro`, `ending-gym-bro` |

Set `"scenes": true` in the manifest to switch scene art on. Scenes without a file keep the staged fallback, so you can add them gradually.
Cutscene illustrations should leave the bottom 28% of the frame free: the dialogue box covers it.

## Keeping the look consistent (works with any image tool)

Generate one **character reference sheet** first (front, side, back, three-quarter, plus close-up of the face and costume),
then reuse it as the reference input for every frame. Lock these per fighter:

- **Bogan Tradie (Gaz)**: Australian tradesman in his 30s, stocky athletic build, short brown hair, yellow hard hat,
  orange hi-vis vest with yellow reflective bands over a work shirt, navy work trousers, brown steel-capped boots, weathered friendly face.
- **Yuppie (Preston)**: American finance professional in his 30s, lean athletic build, slicked dark hair, tailored navy suit,
  white shirt, red tie, polished black shoes, brown leather briefcase, confident smirk.
- **Gym Bro (Tyler)**: American gym-goer in his 20s, very muscular build, short dark hair, white headband, neon-green tank top,
  black training shorts or pants, white trainers, clear shaker bottle with green contents, cheerful intense expression.

Style line to append to every prompt: *"photorealistic fighting-game character, full body, facing right, transparent or plain
grey background, soft studio key light from upper left, sharp focus, consistent face and costume, no text, no logo."*

Frame prompt template: *"[locked character description], [animation name] pose, frame [n] of [total], [what the body is doing in plain words], same camera height and distance as the reference."*

Examples of the plain-words part:
- `lp` frame 3 (impact): *"right fist fully extended at chin height, torso twisting forward, rear hand guarding the jaw, weight on front foot."*
- `launcher` frame 4 (impact): *"crouched, driving a rising uppercut straight up, rear leg fully extended, head tilted back."*
- `knockdown` frame 1: *"lying flat on back, head toward the left, legs straight, arms limp."*

Cutscene prompt template: *"cinematic photoreal film still, [place from the scene], [who is in frame and what they are doing],
[mood: warm comic / tense / triumphant], shallow depth of field, wide 16:9, lower third kept visually quiet."*

## Likeness and content rules

- Every fighter is an **original fictional person**. Do not use or imitate a real person or celebrity.
- The satire targets *tropes and behaviours* (the hi-vis and the sandwich, the synergy talk, the shaker bottle), never demeaning a real group.
  Keep the portrayal affectionate and self-aware, in line with the story's theme that nobody fits the box.
