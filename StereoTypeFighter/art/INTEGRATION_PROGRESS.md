# V7 character-by-character sprite integration tracker

Updated: 2026-11-15. This file tracks **release gates**, not just image generation.

## Shared spec (applies to every character)
- Original contact sheets remain immutable source artwork. Preserve and hash every original in the companion 20-image archive; do not replace/overwrite classic assets.
- Runtime: 512x512 transparent RGBA PNGs, right facing, consistent identity and costume, source-to-frame provenance, baseline at (256,470) unless documented otherwise.
- Runtime IDs must match the animation identifiers in `renderer-v7.js` and `art/manifest.v7.template.json`; animations in concept-sheet labels do not prove complete game coverage.
- A sequence is eligible to ship only after manual silhouette/feet/continuity review, transparent alpha check, complete file count, preview playback, and 60 Hz match testing.
- Commit validated frames under `art/<id>/<animation>/NN.png`. Edit **active** `art/manifest.json` only for validated sequences. Keep fallback rig for absent moves.
- Publish one fighter at a time, with a separate V7 art-test URL/build when possible; do not promote a fighter when the cutout/animation check fails.

## Fighter 1: Bogan Tradie / Gaz
- Source: original approved 2048x682 concept sheet preserved in chat's `StereoTypeFighters_V7_full_roster_source_art.zip`.
- First automated segmentation attempt: **58 candidate frames** across 10 row types; **rejected for production** due to clipped limbs and merged poses.
- Controlled second pass: **16 RGBA 512x512 draft frames** (8 idle, 8 walk); machine checks passed for dimensions, RGBA and transparency. **Human gameplay QA remains pending**, so these frames are not yet enabled.
- Local artifact in chat: `StereoTypeFighters_Gaz_16_frame_preview.zip` (includes `QA_contact_sheet.jpg` and draft PNGs). No binary frames have been committed to GitHub.
- Reproducible extraction script committed: `tools/export-v7-gaz-idle-walk.py`.
- Known canon issue: concept-sheet hammer special is different from the game's Nail Gun Burst. DO NOT register the hammer frames as `special` without a deliberate combat-art decision.
- Next gate: improve action-pose segmentation and verify frame-by-frame in the real game, then commit only passing files.

## Fighters 2–20
In authoritative source ordering:
`yuppie`, `gym-bro`, `lefty`, `agenda`, `bimbo-babe`,
`douchebag-dave`, `junkie`, `rapthug`, `killwoodrat`,
`sk8r-boi`, `club-doll`, `grunge`, `fat-gamer`,
`influencer`, `yoga-mom`, `e-girl`, `cheerleader`,
`punk-princess`, `neckbeard-nate`.
All have concept sheets; none is signed off as fully integrated. Migration is blocked until the first-fighter export and QA process is proven.

## Publishing status
The repository tooling changes may automatically deploy on Vercel, but **that is not equivalent to publishing new fighter graphics**. A release is complete only when binary frames are in GitHub, active manifest updated, and a tested live page shows them. The current production game continues using existing art and fallback renderers.
