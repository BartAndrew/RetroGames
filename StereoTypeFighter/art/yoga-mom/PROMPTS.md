# Yoga Mom (Brooke): sprite strip prompts

Every strip below is one image. Generate them one at a time, then save each as `art/yoga-mom/strips/<name>.png` and import with the command under it.

**Step 0, before any strips:** generate the reference sheet (prompt below), pick one result and attach it to every strip prompt.

```
Photorealistic fighting-game character art, cinematic studio quality, believable anatomy and fabric, Brooke, an original fictional American yoga studio owner and mother in her late 30s, fit build, blonde hair in a loose bun, green tank top, purple yoga leggings, barefoot, calm radiant expression. Character reference sheet: five full-body views in one row on a plain grey background (front, three-quarter front, side facing right, three-quarter back, back), neutral relaxed stance, plus a row of three face close-ups below (neutral, determined, grinning) showing calm radiant expression, loose bun, soft smile. Identical costume, proportions and lighting in every view. Soft key light from upper left with a subtle cool rim light, sharp focus, consistent face and costume, plain flat mid-grey background (for easy cut-out), no text, no logo, no watermark, no extra limbs, no cropped limbs, no outfit changes.
```

**Character:** Brooke, an original fictional American yoga studio owner and mother in her late 30s, fit build, blonde hair in a loose bun, green tank top, purple yoga leggings, barefoot, calm radiant expression.

**Header: paste at the start of every strip prompt**

```
Use the attached image as the exact character reference: same face, hair, outfit, proportions, art style and lighting. Brooke, an original fictional American yoga studio owner and mother in her late 30s, fit build, blonde hair in a loose bun, green tank top, purple yoga leggings, barefoot, calm radiant expression. Photorealistic fighting-game sprite strip, side view, character facing right. {N} equal-size poses in one horizontal row with a wide empty gap between poses, so no limb, fist or weapon ever crosses into a neighbouring pose. Same camera height, distance and scale in every pose; feet on the same ground line unless the pose is airborne. Solid flat magenta (#FF00FF) background, no text, no logo, no shadow, nothing floating loose. Poses left to right:
```

Replace `{N}` with the pose count shown on each strip (8, or 6 for the special).

**Status**: ✅ = already imported from your first upload, ⬜ = still to make. A ✅ strip can be skipped, or redone for a better take.


---

## Batch 1: movement basics (3 strips)

### 1. `idle`: 8 poses ⬜

```
1) relaxed fighting stance, knees slightly bent, lead fist at the chin, rear fist by the jaw, weight centred
2) chest rises as he breathes in, shoulders lift slightly
3) highest point of the bounce, guard unchanged, head level
4) settles, weight shifts a touch onto the rear foot
5) lowest point of the bounce, knees bending a little deeper
6) returns up, tiny head tilt, eyes on the opponent
7) shoulders roll slightly, fists loosen then re-tighten
8) back to the starting stance so the loop is seamless
```

Import: `python3 tools/cut-v7-strips.py yoga-mom idle=art/yoga-mom/strips/idle.png:8`

### 2. `walk`: 8 poses ⬜

```
1) walking contact pose: lead foot lands heel-first, rear heel lifting, guard up
2) weight moves onto the lead leg, rear knee swings forward
3) passing pose: rear leg passes beside the lead leg, body at its highest
4) rear foot reaches forward, lead foot pushes off
5) rear foot lands, lead leg lifts, guard up
6) weight moves onto the new lead leg, other knee swings forward
7) passing pose again, mirrored, body at its highest
8) lead foot reaches forward, ready to loop back to pose 1
```

Import: `python3 tools/cut-v7-strips.py yoga-mom walk=art/yoga-mom/strips/walk.png:8`

### 3. `guard_hit`: 8 poses ⬜

```
1) standing block: both forearms raised to cover face and chest, elbows tucked in
2) standing block braced: shoulders hunched behind the guard, grimacing
3) crouching block: dropped low, forearms covering shins and body
4) crouching block braced: head tucked behind the guard
5) standing hit reaction: head snapping back, eyes squeezed shut, torso recoiling
6) standing hit reaction: stumbling backward, guard dropped, grimacing
7) crouching hit reaction: crouched, wincing, one leg buckling
8) crouching hit reaction: crouched and stumbling, hand dropping to the knee
```

Import: `python3 tools/cut-v7-strips.py yoga-mom block=art/yoga-mom/strips/guard_hit.png:8:1-2 blockLow=art/yoga-mom/strips/guard_hit.png:8:3-4 hurt=art/yoga-mom/strips/guard_hit.png:8:5-6 hurtLow=art/yoga-mom/strips/guard_hit.png:8:7-8`


---

## Batch 2: knockdown and first attacks (3 strips)

### 4. `down`: 8 poses ⬜

```
1) launched: lifted off the ground, torso arched back, limbs flailing
2) mid-air, nearly horizontal, tumbling backward
3) falling, arms out, about to land
4) slamming onto the back, arms thrown out, small puff of dust
5) lying flat on the back, completely limp, eyes closed
6) rolling to the side, propping up on one elbow
7) pushing up onto one knee
8) rising into a crouch, one fist coming up into guard
```

Import: `python3 tools/cut-v7-strips.py yoga-mom launched=art/yoga-mom/strips/down.png:8:1-3 knockdown=art/yoga-mom/strips/down.png:8:4-4 ko=art/yoga-mom/strips/down.png:8:5-5 getup=art/yoga-mom/strips/down.png:8:6-8`

### 5. `lp_lk`: 8 poses ⬜

```
1) light punch 1: guard stance, eyes locked on the opponent
2) light punch 2: lead shoulder dips, lead fist pulls back slightly
3) light punch 3 IMPACT: lead arm snapping straight at chin height, torso twisting forward
4) light punch 4: fist retracting to the guard
5) low kick 1: guard stance
6) low kick 2: lifts the lead knee, chambering the kick
7) low kick 3 IMPACT: lead shin snaps out low at thigh height, torso leaning back slightly
8) low kick 4: leg retracts and plants, back to guard
```

Import: `python3 tools/cut-v7-strips.py yoga-mom lp=art/yoga-mom/strips/lp_lk.png:8:1-4 lk=art/yoga-mom/strips/lp_lk.png:8:5-8`

### 6. `hp`: 8 poses ⬜

```
1) heavy punch 1: guard stance
2) rear fist drawn back by the hip, weight loading onto the rear leg
3) torso coiled, hips beginning to rotate
4) hips rotating, rear shoulder driving forward
5) IMPACT: rear arm fully extended, torso rotated, front foot planted, big forward lean
6) follow-through leaning far forward, weight over the front knee
7) recovering, arm coming back
8) back to guard
```

Import: `python3 tools/cut-v7-strips.py yoga-mom hp=art/yoga-mom/strips/hp.png:8`


---

## Batch 3: heavy attacks, launcher, sweep, air attacks (3 strips)

### 7. `hk`: 8 poses ⬜

```
1) heavy kick 1: guard stance
2) small hop, lead knee rising
3) knee high, chambering the kick
4) leg swung high above the head, body leaning back
5) leg at its peak, torso tilting forward, heel leading
6) IMPACT: heel driving down at head height, standing leg bent
7) landing, knees absorbing
8) recovering to guard
```

Import: `python3 tools/cut-v7-strips.py yoga-mom hk=art/yoga-mom/strips/hk.png:8`

### 8. `launcher_sweep`: 8 poses ⬜

```
1) uppercut 1: dropping into a deep crouch, rear fist by the hip, eyes on the opponent's chin
2) uppercut 2: explosive rise, rear fist driving upward
3) uppercut 3 IMPACT: arm fully extended skyward, legs extended on tiptoes, head back
4) uppercut 4: coming down, recovering to guard
5) sweep 1: dropping low, one hand reaching toward the ground
6) sweep 2: body pivoting, lead leg beginning to extend
7) sweep 3 IMPACT: lead leg fully extended along the ground at ankle height, torso low, hand on the ground
8) sweep 4: leg slides back as he rises into a crouch guard
```

Import: `python3 tools/cut-v7-strips.py yoga-mom launcher=art/yoga-mom/strips/launcher_sweep.png:8:1-4 sweep=art/yoga-mom/strips/launcher_sweep.png:8:5-8`

### 9. `air`: 8 poses ⬜

```
1) jump punch 1: mid-jump, fist cocked back
2) jump punch 2: diving diagonally, lead fist starting forward
3) jump punch 3 IMPACT: arm fully extended forward and down, legs tucked
4) jump punch 4: follow-through while descending
5) jump kick 1: mid-jump, knees tucked
6) jump kick 2: one leg extending diagonally downward
7) jump kick 3 IMPACT: leg fully extended in a diagonal flying kick, torso leaning back, arms out for balance
8) jump kick 4: leg retracting while descending
```

Import: `python3 tools/cut-v7-strips.py yoga-mom airP=art/yoga-mom/strips/air.png:8:1-4 airK=art/yoga-mom/strips/air.png:8:5-8`


---

## Batch 4: dashes, jump, special (3 strips)

### 10. `dash`: 8 poses ⬜

```
1) forward dash 1: low lunge start, torso leaning forward about 25 degrees, rear foot driving
2) forward dash 2: full stride, almost airborne, torso low, arms tucked back
3) forward dash 3: landing slide, front foot planted, speed streaks behind him
4) forward dash 4: recovering to a guard stance
5) back dash 1: pushing off the front foot, leaning back, guard up
6) back dash 2: hop backward, both feet off the ground, guard up
7) back dash 3: landing on the rear foot, knees absorbing, eyes on the opponent
8) back dash 4: settling into guard
```

Import: `python3 tools/cut-v7-strips.py yoga-mom dashF=art/yoga-mom/strips/dash.png:8:1-4 dashB=art/yoga-mom/strips/dash.png:8:5-8`

### 11. `jump`: 8 poses ⬜

```
1) pre-jump: deep knee bend, arms swung back, about to spring
2) coiled, rising slightly onto the toes
3) launching: legs extending, arms driving up
4) rising: knees tucking, fists near the chin
5) at the top of the jump, knees tucked, fists up, body compact
6) descending, legs stretching downward, arms guarding
7) landing crouch, knees deeply bent absorbing the impact, one hand brushing the ground
8) standing back up into guard
```

Import: `python3 tools/cut-v7-strips.py yoga-mom prejump=art/yoga-mom/strips/jump.png:8:1-2 jumpUp=art/yoga-mom/strips/jump.png:8:3-4 jumpApex=art/yoga-mom/strips/jump.png:8:5-5 jumpDown=art/yoga-mom/strips/jump.png:8:6-6 land=art/yoga-mom/strips/jump.png:8:7-7`

### 12. `special`: 6 poses ⬜

```
1) guard stance, centred, palms soft
2) closes her eyes and breathes in, palms rising together
3) centres herself, a faint teal glow gathering at her palms
4) thrusts both palms forward, a teal shockwave pulsing out
5) second palm, a ring of light rolling across the floor
6) lowers her hands in a calm bow, eyes open
```

Import: `python3 tools/cut-v7-strips.py yoga-mom special=art/yoga-mom/strips/special.png:6`


---

## Batch 5: super and personality (3 strips)

### 13. `super`: 8 poses ⬜

```
1) crouching to gather power, sits in a lotus pose, floating, a glowing ring of teal chakra-like light spinning around her
2) charge peak: sits in a lotus pose, floating, a glowing ring of teal chakra-like light spinning around her, energy flaring
3) explosive launch into the flurry, warrior palm
4) IMPACT: lotus sweep
5) IMPACT: flowing palm jab
6) finisher windup: arms spread in a flowing wheel pose, glowing rings spiralling around her
7) FINISHER IMPACT: a final spinning kick that sends rings of teal light cascading outward
8) recovering, breathing hard, shoulders heaving
```

Import: `python3 tools/cut-v7-strips.py yoga-mom super=art/yoga-mom/strips/super.png:8`

### 14. `victory_intro`: 8 poses ⬜

```
1) intro 1: stepping into frame with confidence
2) intro 2 taunt: breathes in slowly with eyes closed, arms raised
3) intro 3 taunt: opens one eye and smiles, dangerously calm
4) intro 4: settling into a guard stance with a smirk
5) victory 1: straightening up, breathing hard
6) victory 2: raising the lead fist overhead
7) victory 3: arm fully raised in triumph, chest out
8) victory 4 signature: presses her palms together in a bow with a serene smile
```

Import: `python3 tools/cut-v7-strips.py yoga-mom intro=art/yoga-mom/strips/victory_intro.png:8:1-4 victory=art/yoga-mom/strips/victory_intro.png:8:5-8`


---

## Notes

- Import `idle` first (or in the same command as the others). It sets this fighter's scale, so every later strip matches.
- If a strip comes back with the wrong number of poses or poses that overlap, regenerate it; clean gaps give the cleanest cuts.
- Back-walk uses the walk strip played in reverse, so there is no separate strip.
- Keep strip images under `art/<id>/strips/` so imports can be repeated if the cutter improves.
