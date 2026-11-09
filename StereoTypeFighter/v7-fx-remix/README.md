# Stereotype Fighters — V7 FX Remix comparison

**Published entry:** `/StereoTypeFighter/v7-fx-remix/`  
**Original V7:** `/StereoTypeFighter/` (unchanged)  
**Implementation:** `../app-v7-remix.js` plus `../remix-fx-v7.js`  
**Reference:** `../../resources/research/instagram-reel-DfSZuNNoIpN.md`

## What changed

A separate playable V7 entry point uses the existing 20-character roster, hand-tuned moves, engine, scene flow and character art/rig fallback. The Remix's additional *presentation-only* procedural effects work for every character:

- Character-accented hit and counter bursts with expanding impact rings.
- Distinct block, projectile impact, projectile launch, knockdown/landing dust.
- Attack arcs tied to active move animation phase, super aura and dash/air motion trails.
- Stronger super text callouts and clear on-canvas V7 FX Remix identifier.
- Bounded particle pool; effect positions are derived from combat events. The fixed 60 Hz combat simulator remains unchanged.

These are **original effects inspired by PixelFX's procedural techniques**, not upstream PixelFX code or sprites. There is no third-party runtime dependency. The visual simulation is advanced once per 60 Hz gameplay update, independent of drawing frequency, but visual-only particles are not fully replay-deterministic.

## Comparison checklist

1. Open original V7 and this build in separate tabs, use the same fighters and stage.
2. Test the full 20-fighter character select. Compare punch, kick, block, dash, jump, special, projectile impact, super and KO transitions.
3. Check keyboard, local two-player, CPU and training mode.
4. Compare fluidity and readability when both fighters exchange hits; look for excessive visual clutter.
5. Check gamepads and mobile scaling. Existing V7 input limitations remain.
6. Confirm no missing art or broken story cutscenes.

## Boundaries

This is a **first comparison pass**, not a complete 20-character art and animation remaster. No new canonical fighter sprite sheets, skeletal rigs, voice acting, unique abilities, hitboxes or game balance changes have been completed. The existing character-specific moves and specials are preserved. Browser QA could not be run from the connector-only editing environment; the Vercel deployment status is READY, but that does not demonstrate gameplay correctness.

## Next iteration

Use the per-character art manifests and original sprite references to author missing frames and add contact/anticipation/recovery poses. Integrate selected MIT-licensed PixelFX effects with upstream source revision and notices, instead of just procedural inspiration. Build automated frame-data and visual regression tests before advancing the release label.
