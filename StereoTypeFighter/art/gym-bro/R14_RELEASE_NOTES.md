# Gym Bro V7.1 R14 — corrected procedural fallback identity

**Branch development only. Not a production-art approval.**

## Implemented
- Corrected the old green-tank, bare-head fallback to the V7-approved bright yellow `GYM BRO` top, black backward cap, tan muscular arms/legs, black shorts with white stripe, black wristbands, white striped socks and white trainers.
- The shaker prop uses the kit colour. Other fighters' rigs are unchanged.
- Added `tests/gym-bro-visual-canon.unit.mjs`, a real `drawRig` path test using a Canvas2D spy, plus canonical special/super/roster assertions.
- Preserved all previously committed sprite previews (R8–R13), existing V7.1 default manifest, deterministic 60 Hz combat, four-rival story and authored dialogue.

## Outstanding release blockers
- Final identity-locked 12-frame fighter-only super art and detached VFX, plus repaired idle/punch motions.
- Approved realistic selection portrait, heroic render and 10 individually directed story images.
- Strict asset audit, manual visual and controller QA, complete story-to-credits, confirmed preview and production deployment checks.
- The fallback is not equivalent to final production artwork. The default game's existing historical sprites remain unchanged until explicit acceptance.

## Test entry points
`npm run test:unit` and `node tools/test-gym-bro-v7.mjs` from `StereoTypeFighter/`.
