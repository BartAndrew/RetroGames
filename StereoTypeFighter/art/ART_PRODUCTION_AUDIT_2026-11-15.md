# Stereotype Fighters V7 — full roster art readiness audit
_Date: 2026-11-15. Source: RetroGames repository plus the 20 PNG images present in the ChatGPT working files._

## Verified status
- **20/20** characters have locally available original concept PNG contact sheets. Files were checked for existence, format, pixel dimensions, and transparent pixels; the local reproducible report is `stereotype_fighters_art_audit.json`.
- **0/20** checked contact sheets contain any transparent pixels. The visible white/checkerboard background and row labels are baked into the artwork. All require cutout, segmentation, and QA; a contact sheet is **not** a playable animation.
- **3/20** characters have entries in the checked-in production `art/manifest.json`: `gym-bro`, `yuppie`, `bogan-tradie`. Manifest totals are **22**, **23**, **23** frame references respectively. This is not an assertion every referenced image has been visually validated.
- The 20-character `art/manifest.v7.template.json` is a **template, not the active manifest**. The gameplay already uses a fallback rig for absent/missing sprite art.
- The original three have user-approved V7 outfit redesigns; preserve classic V6.8, and distinguish the fallback rig costume from the approved V7 sprite costume.

## Source inventory
| # | Fighter | Local concept PNG filename | Size | Assessment |
|---:|---|---|---|---|
| 1 | `bogan-tradie` (Gaz) | `Bogan Tradie Fighting Game Sprite Sheet-1.png` | 2048x682 | Opaque concept; not game-ready |
| 2 | `yuppie` (Preston) | `Yuppie Fighter Animation Sprite Sheet-2.png` | 1536x1024 | Opaque concept; not game-ready |
| 3 | `gym-bro` (Tyler) | `Gym Bro Fighting Game Sprite Sheet-3.png` | 2048x682 | Opaque concept; not game-ready |
| 4 | `lefty` (Sam) | `lefty_liberal_fighting_game_sprite_sheet.png` | 2172x724 | Opaque concept; not game-ready |
| 5 | `agenda` (Rowan) | `rowan_fighting_game_sprite_sheet.png` | 1774x887 | Opaque concept; not game-ready |
| 6 | `bimbo-babe` (Tiffani) | `a_clean_high_detail_game_sprite_sheet_on_a_transp.png` | 1536x1024 | Opaque concept; not game-ready |
| 7 | `douchebag-dave` (Dave) | `a_highly_detailed_sprite_sheet_illustration_on_a_t.png` | 1536x1024 | Opaque concept; not game-ready |
| 8 | `junkie` (Mickey) | `a_detailed_high_resolution_sprite_sheet_infograph.png` | 1536x1024 | Opaque concept; not game-ready |
| 9 | `rapthug` (Marcus) | `a_clean_high_detail_sprite_sheet_style_illustratio.png` | 1536x1024 | Opaque concept; not game-ready |
| 10 | `killwoodrat` (Rae) | `wide_clean_sprite_sheet_layout_on_a_transparent_w.png` | 1536x1024 | Opaque concept; not game-ready |
| 11 | `sk8r-boi` (Jonno) | `a_detailed_sprite_sheet_style_illustration_image.png` | 1536x1024 | Opaque concept; not game-ready |
| 12 | `club-doll` (Margaux) | `a_wide_clean_sprite_sheet_animation_concept_layou.png` | 1536x1024 | Opaque concept; not game-ready |
| 13 | `grunge` (Ash) | `a_detailed_sprite_sheet_composite_poster_on_a_clea.png` | 1536x1024 | Opaque concept; not game-ready |
| 14 | `fat-gamer` (Dennis) | `a_detailed_game_sprite_sheet_composition_a_large.png` | 1536x1024 | Opaque concept; not game-ready |
| 15 | `influencer` (Kayla) | `a_wide_highly_detailed_game_sprite_sheet_on_a_pal.png` | 1536x1024 | Opaque concept; not game-ready |
| 16 | `yoga-mom` (Brooke) | `a_highly_detailed_sprite_sheet_style_image_on_a_wh.png` | 1536x1024 | Opaque concept; not game-ready |
| 17 | `e-girl` (Kai) | `a_detailed_production_sprite_sheet_illustration_a.png` | 1536x1024 | Opaque concept; not game-ready |
| 18 | `cheerleader` (Ashlyn) | `a_high_detail_cinematic_comic_video_game_sprite_s.png` | 1536x1024 | Opaque concept; not game-ready |
| 19 | `punk-princess` (Roxy) | `punk-princess-roxy-source.png` | 1536x1024 | Opaque concept; not game-ready |
| 20 | `neckbeard-nate` (Nate) | `neckbeard-nate-source.png` | 1536x1024 | Opaque concept; not game-ready |

## Required changes before runtime import
1. **Background and segmentation (blocker):** remove opaque white/checkerboard, labels and foot shadows from every contact sheet, separate individual poses, preserve loose clothing/effects, and export straight-alpha RGBA PNG. Do not use the existing `cut-v7-strips.py` on a white sheet without adapting its **magenta-specific** keyer.
2. **Frame count and semantics (blocker):** contact sheet labels are approximate/illustrative and differ from engine IDs. Map `light_attack → lp`, `heavy_attack → hp` only where visually appropriate; separately produce `lk`, `hk`, `launcher`, `sweep`, `airP`, `airK`, `block`, `blockLow`, `super`, `intro`, and `walkBack`. `knockdown`/KO and get-up require distinct temporal logic. Never silently copy a punch to a kick.
3. **Frame validation (blocker):** count independent poses, detect duplicated/missing beats, ensure windup/contact/recovery, eliminate body-part clipping, verify direction/scale/garment continuity. Image generation occasionally labels eight frames while showing fewer distinct poses: manual inspection required, not an OCR-only check.
4. **Baseline and canvas (blocker):** pad/crop each pose to **512×512**, right-facing, same body proportions and key light, anchor `[256,470]` initially, consistent ground contact; preserve genuine aerial displacement in game logic. The sheet sizes vary from **1536×1024** to **2172×724**.
5. **Canon exceptions:** verify `lefty` against Sam's teal jacket/olive cargo-trouser canon; check `bogan-tradie`, `yuppie`, `gym-bro` against their explicitly approved V7 redesigns, not older hard-hat/suit/headband descriptions; verify costume/props on all others against `tools/cast_data.py`. Revisions should be tracked per fighter, not applied blindly to the complete roster.
6. **Special VFX:** separate composited energy trails, speech bubbles, electric arcs, etc. as optional overlays when they extend beyond a fighter's hitbox; the 60 Hz combat data remains authoritative for contact timing.
7. **Storage/deployment:** original sheets belong in `art/sources/` for production or an external source archive, **not** uncompressed in a Vercel-served game bundle if this risks hobby storage limits. Ship compressed runtime sprites only when QA passes.

## Implementation order
**Phase A — Preserve sources:** import the 20 original PNG sheets into a source-art archive or Git LFS on an art branch; retain SHA-256 checksums, originals, reviewer status and prompt/canon references. Avoid overwriting `art/manifest.json`.

**Phase B — One-character vertical slice:** choose `bogan-tradie` (or `gym-bro`) and implement `idle`, `walk`, `lp`, `hp`, `hurt`, `knockdown`, `getup`, `victory`. Render in a local browser. Add `lk`, `special`, `block`, aerials, super and others after validation. Start from the actual runtime's animation names, not the attractive labels on the source poster.

**Phase C — Automated QA:** write a manifest asset checker for path existence, 512×512 dimensions, nontrivial alpha, file naming, frame order/count, foot-anchor tolerance, consistent identity/scale, missing moves and runtime asset request failures; test a fighter against the fallback and a mirror match.

**Phase D — Rollout:** migrate in groups of three/four, retain fallback for incomplete moves, make a tester page/switch for render mode, test 60 Hz combat/combos across keyboard/controllers; deploy a preview then promote.

## Specific code observations
- `renderer-v7.js` already resolves sprite paths by `art/{id}/{anim}/{n}.png` and uses rig fallback if images are missing.
- `tools/cut-v7-strips.py` currently assumes a magenta background and connected components, whereas all 20 checked concept sheets are opaque pale/white. It will mis-handle labels and checkerboard until modified.
- The current 3-fighter active manifest is substantially narrower than the 20-fighter template. Don't replace it wholesale before assets exist, or every missing URL will preload and fail.
- Treat visual image counts and exact animation completeness as unverified pending frame-by-frame visual QA. This audit verifies file properties and repo structure, not successful in-browser gameplay.

## GitHub binary limitation
The 20 PNG files were inspected in the chat's working container. The available GitHub connector accepts blob bytes but cannot directly read the local container paths, and direct outbound Git access from the container is unavailable. Accordingly, this commit contains **the audit/manifest guidance**, not the 20 PNG binaries. A prepared ZIP + import guide is attached to this conversation for a Git-enabled local checkout.
