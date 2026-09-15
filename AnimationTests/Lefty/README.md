# Lefty Liberal animation test

Standalone validation harness for the V6.7 Lefty Liberal 80-frame atlas.

- No Stereotype Fighter runtime dependencies.
- No roster fetches.
- No Base64 chunk reconstruction.
- Loads one `896x1120` AVIF atlas with an `8x10` grid of `112x112` cells.
- Cycles through idle, walk, jump, crouch, punch, kick, special, hurt, block, fall, getup and victory.
- Exposes `window.leftyTest.ready` for browser automation.

The main game should only consume this asset after this page has been confirmed working.
