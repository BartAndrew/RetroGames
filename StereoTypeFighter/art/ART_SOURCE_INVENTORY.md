# V7 artwork source inventory (2026-11-14)

The conversation contains seven reference contact sheets covering the first seven fighters. **This document records provenance and status only**: source binary PNGs are not yet checked in by this operation, and none of these contact sheets has been certified as a runtime animation.

| V7 fighter ID | Chat source filename | Current stage |
| --- | --- | --- |
| `bogan-tradie` | `Bogan Tradie Fighting Game Sprite Sheet-1.png` | Draft sheet; visual appearance approved |
| `yuppie` | `Yuppie Fighter Animation Sprite Sheet-2.png` | Draft sheet; visual appearance approved |
| `gym-bro` | `Gym Bro Fighting Game Sprite Sheet-3.png` | Draft sheet; visual appearance approved |
| `lefty` | `lefty_liberal_fighting_game_sprite_sheet.png` | Draft sheet |
| `agenda` | `rowan_fighting_game_sprite_sheet.png` | Draft sheet |
| `bimbo-babe` | `a_clean_high_detail_game_sprite_sheet_on_a_transp.png` | Draft sheet |
| `douchebag-dave` | `a_highly_detailed_sprite_sheet_illustration_on_a_t.png` | Draft sheet |

## Production standard for remaining fighters

- Follow the roster ordering and character descriptions in `tools/cast_data.py`. Next is `junkie` (Mickey).
- Maintain original high-detail side-scrolling arcade-fighter visual language, side view facing right, uniform neutral/checkerboard presentation for **contact-sheet previews** and black rounded headings.
- Canonical game assets must be transparent `512 x 512` PNGs under `art/<fighter-id>/<animation>/NN.png`, registered to the same fighter-specific body centre and grounded foot baseline; contact sheet labels and checkerboard **must not** appear within the frame files.
- Concept-sheet frame counts and animation labels are illustrative; use the generated manifest / V7 gameplay contract for exact counts and IDs. Inspect every pose for duplicate frames, clipped limbs, inconsistent accessories/costumes, and background contamination before import.
- Do not call art `game-ready`, `published` or `integrated` without binary files in GitHub and a live game test. Existing V6/V7 production assets must not be overwritten by unfinished contact sheets.

## Handoff

The source image files were packaged separately in this ChatGPT conversation as `StereotypeFighters_V7_art_sources.zip` with a `SOURCES.json` checksum inventory. Add those actual assets via Git or Git LFS to `StereoTypeFighter/art/sources/` when a binary-upload path is available; this document deliberately does **not** claim they are already hosted in GitHub.
