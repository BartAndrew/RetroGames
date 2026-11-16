# Gym Bro — Tyler: R12 identity and costume continuity lock

**Fighter ID:** `gym-bro` · **V7 character:** Tyler · **Source-of-truth fighting style:** Fitness Brawler (do not change to Power Striker without a separate canon decision)

The approved V7 redesign is the visual reference for every frame and scene. Tyler is ONE identifiable man—not a generic muscle character reinterpreted at every pose. The source comparison covers **R11 intro frames 01–04** and **R12 Quad Axe `hk` frames 01–06**. See `R12_Identity_Continuity_Comparison.jpg` in the separately delivered source archive.

## Never change between poses

| Landmark | Locked characteristic | R12 observed |
| --- | --- | --- |
| Face | Tanned adult male with defined angular jaw, strong brow, clean-shaven expression | Consistent profile and complexion in all six hk frames |
| Hair/cap | Short, dark wavy hair under **backward black baseball cap** | Present in all six |
| Body | Extremely muscular tan athlete, broad shoulders, sharply defined arms/legs | Preserved within the same 390px display height; no extra limbs |
| Tank | Bright saturated yellow sleeveless athletic tank with **GYM BRO** black lettering | Legible across frames, cloth deforms naturally |
| Shorts | Black athletic shorts with white stripes along outer side | Same cut and pattern in all six |
| Wrists | Black sports wristbands | Both wrists across frames |
| Feet | White trainers, white socks with black stripes | Same shoe/sock treatment in all six |
| Camera | Right facing, consistent side view, upper-left light, neutral scene | Six matching isolated game sprites |
| Alignment | 512×512 transparent RGBA, planted foot base y≈470 | Each frame reaches y=470; right-facing foot stays within canvas |

**Do not:** substitute an unrelated face, recolour tank green, change the hat to forward facing, remove shorts stripes, vary body size per pose, bake damage/VFX into the high kick, or let generated pictures redefine hitboxes or timing.

## Source and provenance

- Original generated 1536×1024 3×2 magenta-background motion sheet: `a_high_detail_comic_game_sprite_sheet_style_illu.png`
- Source SHA-256: `bb31c1a684ced36dc267de237b17d30a42880d47c41faa1743161c45bc44117d`
- Exact six derived PNG hashes are recorded by `tools/check-gym-bro-hk-r12.py` and inside R12 candidate ZIP `PROVENANCE.json`.
- Original source sheet, PNG extraction script, R12 montage, and source manifest are preserved outside the served Vercel bundle in `GymBro_V7.1_HK_Source_R12.zip`.

## Motion and creative review

- Move name remains **Quad Axe**. This visual is a six-keypose high kick, independent of the canonical attack's damage, startup, recovery, active hitboxes and deterministic 60Hz state machine.
- R12 source is substantially clearer than the old low-resolution `hk` crops; all six frames contain one connected figure and no visible chroma-key contamination.
- **Not yet motion-approved:** three similar-pose pairs: 01/06 (guard return), 02/05 (chamber/recoil), 03/04 (impact/follow-through). Although these are plausible endpoints, visual comparison and in-engine timing need approval before removing the action from holdback.
- Keep this sequence **opt-in preview only**. The complete Gym Bro sprite library, portrait, and ten cinematic story images still need individually assessed identity consistency and release approval.
