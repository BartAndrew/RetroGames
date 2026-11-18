# Gym Bro V8.0 — Action 01 of 25: Idle

**Status: published for user playtest; awaiting acceptance.** Only Idle is in scope. Action 02 starts when the user says continue.

## Source and design

- Original 3 x 2 transparent image sheet: `idle-source-sheet.png` (1536 x 1024 pixels, six right-facing frames).
- Visual review contact sheet: `idle-contact.jpg`.
- Published frames: `StereoTypeFighter/art/v8/gym-bro/idle/01.png` through `06.png`, each 512 x 512 RGBA.
- Identity locked: extremely muscular tan Tyler, backwards black cap, bright yellow **GYM BRO** tank, black shorts and wristbands, striped white socks and white trainers.
- Loop: neutral guard / inhale / peak / exhale / neutral, six frames at 7 image fps; deterministic combat remains fixed at 60 Hz.
- Alignment: horizontal anchor x=256, shoe/foot baseline y=470. Source-sheet cells cropped on a 512 x 512 grid; alpha below 9 cleared, image resized x=0.92 / y=0.785 with Lanczos filtering and feet aligned to y=470.

## QA / release gates

- Source PNG dimensions, RGBA and transparent matte, distinct frame hashes, foot registration and stable head alignment.
- The V8 renderer loops frames 01→06→01 in the actual game.
- `?gymBroRig=1` still switches to the procedural fallback for comparison.
- 31-action interactive viewer marks Idle as Sprite; Walk and 23 other remaining actions stay procedural.
- All historical V7 entries, roster, hitboxes, damage, story dialogue and all other fighters remain unchanged.

The V8 production artwork now totals **7 sprite actions, 34 actual sprite frames and 24 rig-only actions**. Of the canonical 120-frame target, 86 art frames remain. Artwork acceptance for Idle is held for user testing.
