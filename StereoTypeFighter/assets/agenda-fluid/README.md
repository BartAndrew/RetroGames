# Agenda Fluid - Expanded Sprite Assets

This folder contains the first game-ready **Agenda Fluid** expansion assets for **StereoTypeFighter**.

## Character visual lock

Future sprite work should preserve:

- electric-blue swept punk hair
- black/red punk jacket
- black cropped `AGENDA FLUID` shirt
- ripped black jeans and chains
- wrist accessories
- black/white sneakers
- late-16-bit / arcade fighting-game pixel treatment
- nearest-neighbour scaling only

The runtime strips in this commit deliberately reuse the locked Agenda Fluid source sprite and use only tiny pixel-preserving whole-sprite transforms. This keeps the face, outfit, proportions and palette consistent while giving the character more natural background movement.

## Runtime assets added

Each file is an 8-frame transparent horizontal strip:

- `runtime/agenda-fluid-idle-sway-breath-strip-v1.png` - subtle breathing and stance sway.
- `runtime/agenda-fluid-defensive-weave-strip-v1.png` - left/right defensive head-and-body weave.
- `runtime/agenda-fluid-ready-bounce-strip-v1.png` - Street-Fighter-style ready bounce for a more active idle state.
- `runtime/agenda-fluid-forward-feint-strip-v1.png` - short forward fake/weight shift that can lead into an attack.

`agenda-fluid-sprite-manifest.json` captures the character lock and next animation backlog.

## Generated concept work to productionise next

The broader generated sheets from the design session cover idle, walk, run, jump, crouch, blocking, hit reactions, knockdown/get-up, punches, uppercut, elbow, palm, backfist, spin punch, front/roundhouse/spin/jump/low/axe/flying/special kicks, taunts and win poses. Those should be cut into clean transparent runtime atlases using the same baseline and frame dimensions before wiring them into the game.

## Recommended implementation

1. Anchor standing frames to a common foot/baseline point.
2. Move the fighter through the world in game code rather than baking large horizontal travel into sprites.
3. Mirror at runtime for left/right facing unless asymmetric costume details become gameplay-relevant.
4. Store hitboxes, hurtboxes, pushboxes and cancel windows as metadata rather than painting them into art.
5. Split purple special-move energy and impact sparks into separate VFX atlases.
6. Keep concept/reference sheets separate from transparent runtime atlases.

## Next unique pose families

Crouching jab, crouching heavy punch, true sweep, overhead strike, air punch, air block, forward/back throws, throw escape, wall bounce, air-juggle hit, quick-rise/tech, guard break, dizzy/stun, KO, intro, perfect-win and super/EX startup-active-recovery sequences.
