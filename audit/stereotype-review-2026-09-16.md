# StereoType Fighter audit — 16 September 2026

Scope: live V6.7 page, source snapshot `c8d5afc` (main at the beginning of review), complete StereoTypeFighter file inventory, and repository-level layout. The checkout switched externally to `add-club-doll-tweaker` (`04983b8`) during inspection; no branch was changed by this audit. Findings about current game source below refer to c8d5afc. No game code or assets were changed.

## Recommendation

Keep the existing engine and artwork. First make the production asset pipeline reliable, then establish one canonical fighter manifest, then repair animation/collision alignment with two representative fighters. Expand that proven process across the roster. Deleting source art or generating more sheets first would not solve the current failure.

## Shared component names

| ID | Name | Location / meaning |
|---|---|---|
| S1 | Header / utility bar | Title, version, loading status, FPS, Help, sound, motion, Animation Lab and Admin |
| S2 | P1 preview panel | Left large character preview, Player 1 assignment button, name, biography and stats |
| S3 | Roster grid | Middle grid of 20 fighter cards |
| S4 | Fighter card / portrait | One selectable headshot, name, archetype and P1/P2 badge |
| S5 | P2 preview panel | Right preview and Player 2 assignment button |
| S6 | Stage picker | Environment cards below the roster |
| S7 | Match setup | Mode, difficulty, rules and Fight button |
| M1 | Match toolbar | Fighter Select, mode, stage name and Pause |
| M2 | Arena / playfield | Entire rectangular game canvas |
| M3 | Stage backdrop | Environmental artwork behind the fighters |
| M4 | Ground line / foot anchor | Invisible floor where the fighters' feet and shadows sit |
| M5 | Fighter sprite | Full-body character drawn during play |
| M6 | HUD | Heads-up display: names, health bars, special meters, round markers and clock |
| M7 | Health bar | Wide cyan / pink bar; remaining life |
| M8 | Special meter | Thin gold bar below health; resource spent on special moves |
| M9 | Round markers / clock | Small circles show rounds won; centre number is remaining time |
| M10 | Combat effects | Projectiles, hit sparks, shadows and screen shake |
| M11 | Match overlay | Round/Fight announcement, Pause panel or match result |
| M12 | Touch controls | Mobile movement and attack buttons |
| D1 | Animation Lab | Developer preview for sequences and debug boxes |
| D2 | Audio Admin | Local audio import/configuration interface |

Sprite sheet: source picture containing poses, sometimes labels and backgrounds. Runtime atlas: cleaned, packed frames actually loaded by the game. Animation sequence: ordered frames for one action. Hitbox: region of an attack that deals damage. Hurtbox: region of a fighter that can receive damage. Pushbox: region keeping fighters apart. Pivot/foot anchor: reference point keeping frames grounded.

## Confirmed runtime failures

1. Live `tools/roster-runtime-v66.json?v=6.8` returns HTTP 404. The app falls back to `roster-v66.json`, whose 20 entries specify `render: puppet`. The loader treats these as ready. Rap Thug and Bogan Tradie visibly use portrait-headed procedural figures in selection and combat. Build and publish the generated roster and atlases; production should not silently accept puppet readiness.
2. Live `assets/characters/v66/lefty-v68-atlas.webp` returns HTTP 200 but contains 14,998 bytes without a WebP RIFF header and fails image decoding. The matching Git asset also fails decoding. The enhancement patch forces Lefty to use it. Replace it from a verified source and validate actual decoded pixels, not just path existence.
3. The checked-in browser test expects Lefty's atlasCell, atlasColumns and spriteScale from `SF.roster()`, but that method does not expose those fields. Repair the test/API contract before relying on this release gate.

The intended Pages workflow stages the arcade, builds core atlases, builds the production roster, prunes legacy files, verifies assets and runs browser tests. Live delivery is inconsistent with that intended output. The exact deployment configuration/run responsible was not inspected, so the 404 does not establish which publishing setting or CI failure caused it.

## Visual and gameplay findings

- S2/S5: the source artwork is much richer than the displayed puppets. Restore runtime sprites before redesigning their containers.
- S3/S6/S7: on the observed desktop viewport the long five-column roster pushes stage selection and Fight below the fold. Keep setup/start visible, reduce roster height, and make the active player assignment explicit.
- S1: developer controls, FPS and technical loading status compete with the main game flow. Put Lab/Admin/FPS under a developer menu; leave essential player controls visible.
- M3: the six background files decode, but are only 240×135, 320×180 or 400×225 and are stretched into a 960×540 world. The observed stage looks soft. Recover larger masters before commissioning replacements.
- M5: atlas sprites are normalized to roughly 104 pixels then drawn at 1.95 scale, with an additional 1.45 Lefty multiplier. Standing hurtboxes remain 52×112. Artwork and damageable body area therefore use inconsistent scales. Define body boxes and pivots in the same world units and inspect them over the real sprites.
- Animation: core atlas generation cross-fades adjacent poses and enlarges 64×40 source cells. This cannot restore missing detail and can produce ghosted in-between frames. Use selected source poses and proper authored transitions where needed.
- Animation: attack rendering advances by fixed frame cadence and loops independently of startup/active/recovery timing. Map poses to those phases; clamp one-shot reactions and get-up, and loop only looping actions. Jump currently selects a few poses from velocity rather than using its entire declared sequence.
- D1: Lab draws a doubled sprite but a fixed-size hurtbox, approximates attack boxes at 0.7 scale, and Step advances five ticks. It is not a faithful frame/collision authoring view. Render the same boxes and timing as gameplay; show frame index and attack phase.
- Combat scope: attacks cannot start airborne; crouch also prevents attack initiation. There are no implemented air/crouching normals or throws in this engine. Six archetypes and projectile/dash/burst specials provide a foundation, but move names are more distinctive than their effects. Start with responsive ground combat before adding the broader Street Fighter vocabulary.
- Help/Lab dialogs do not pause arena simulation when opened; input handling returns early while a dialog is open. Pause the match when opening a blocking dialog, and restore its prior pause state on close.
- Displayed speed/defense values are source multipliers rather than final effective movement/defense after archetype tuning. Show understandable ratings derived from actual gameplay values.
- Rendering consumes the same random generator as simulation for screen shake. Separate cosmetic randomness to keep rendered and headless seeded simulations consistent.

## Repository map

The repository contains multiple independent game families: StereoTypeFighter; Left Vs Right variants; Pacific Fighter/Lightning variants; and Sandbag Siege variants. Root arcade files and `tools/build_site.py` publish the collection. Do not treat those other games as unused Stereotype Fighter files.

Within StereoTypeFighter, the active entry point imports `app-v66.js` plus `enhancements-v67.js`, styled by `ui-v66.css` and `mobile-v67.css`. The app uses `arena-v66.js`, `sprites-v66.js`, `combat-v66.js`, `sound-v66.js` and `audio-store-v66.js`. Admin has a separate page/module. `tools/` contains roster definitions, extraction/build scripts and asset checks. `tests/` contains engine and browser tests. `AnimationTests/Lefty` is a separate animation experiment outside the game folder.

Old app/arena/sprites v5/v6, v2/v3/v4 loaders, old CSS and encoded code chunks coexist with the active code. Some older data remains an active build dependency: `roster-v5.json`, `roster-v6.json`, and `matte-v5.js` with its parts feed the current production build. Do not delete them solely because their names look old.

Version labels conflict: page V6.7, app V6.6, enhancement V6.8, and README V5.1. Format the hand-written code normally, adopt one release version, and replace the global fetch interception / prototype patches with explicit configuration and normal module methods.

## Asset decisions

| Asset group | Evidence | Recommended handling |
|---|---|---|
| 16 named original sheets | All decode at 1536×1024 | Preserve as canonical source candidates; extract and clean at build time |
| Four v6 character atlases | Lefty, Agenda, Gym Bro, Bogan; all decode at 512×240, 64×40 cells | Keep as recovery baselines; inspect/replace low-resolution poses from better masters |
| Portrait roster chunks | Live grid displays all 20 portraits | Keep, preferably consolidate into a normal versioned image plus manifest |
| Six stage WebPs | All decode; only 240–400 pixels wide | Keep as previews/fallbacks; recover larger masters for gameplay |
| Newer Lefty assets | v67 AVIF and v68 WebP fail decoding | Quarantine from runtime; rebuild from verified art |
| Four reference-sprite-sheets WebPs | All fail full decoding | Preserve provenance but mark damaged; recover originals |
| Agenda animation strips | Idle strip decodes; weave, feint and ready-bounce fail | Keep good strip; recover or retire damaged experiments |
| Junkie v2 atlas | Fails full decoding | Use intact Junkie.png to regenerate |
| Timestamp-named concept/source PNGs | Decode successfully; three exact duplicate pairs | Identify contents, give descriptive names, retain one canonical copy per hash |
| Audio | Runtime uses browser-local storage and synthetic fallback tones; no packaged audio set found in snapshot | Create a small shared sound pack first, then distinctive specials and stage loops; package defaults for all players |
| Effects | Current engine draws circles/particles; source sheets contain useful effect concepts | Extract/author transparent hit, block, dust and projectile effects after core sprites work |

Named original sheets: Bimbo.png, Dave.png, Junkie.png, RapThug.png, KillWoodRat.png, Sk8rBoi.png, ClubDoll.png, Grunge.png, Yuppie.png, FatGamer.png, Influencer.png, Yoga Mom.png, E-Girl.png, Cheerleader.png, PunkPrincess.png, Neckbeard Nate.png.

Byte-identical pairs:

- `ChatGPT Image Sep 9, 2026, 09_26_04 PM.png` and `09_29_51 PM (1).png` (same date/prefix).
- `ChatGPT Image Sep 9, 2026, 09_32_30 PM.png` and `09_47_50 PM.png` (same date/prefix).
- `ChatGPT Image Sep 9, 2026, 09_32_42 PM (1).png` and `09_32_57 PM.png` (same date/prefix).

Full inventory: `stereotype-assets-2026-09-16.csv` lists all 158 files (74,195,482 bytes, approximately 70.8 MiB) in the inspected game snapshot, hashes, dimensions and image decode results. Of 53 PNG/WebP/AVIF files, 43 decoded and 10 failed. This is not a browser transfer-size measurement. Successful decode does not certify every pose or crop is visually correct.

Recommended organization: `src/` for runtime code; `assets/source/characters/` for preserved masters; `assets/runtime/characters/` for generated atlases; equivalent source/runtime stage folders; `assets/audio/`; `data/` for one canonical manifest; `tools/`; `tests/`; and `archive/` for experiments. Production publishes only explicitly listed runtime assets.

## Efficient repair order and completion criteria

1. Establish a stable current-source branch and reproducible build. Recover Lefty, generate the production roster, publish the built output, and smoke-test the public URL. Done when all 20 fighters load real atlases with no required asset errors.
2. Consolidate asset definitions. One manifest selects each fighter's source, atlas, frames, timings, pivot, scale and boxes. Retain original art and archive alternatives. Done when one clean build regenerates every runtime asset and decode checks pass.
3. Perfect a two-fighter test match using a detailed original-sheet fighter such as Dave and the repaired Lefty. Align feet, proportions, hitboxes, attack timing and reactions. Done when movement, punch, kick, block, special, knockdown and recovery look and behave consistently.
4. Apply that pipeline to the remaining roster; review each action in the repaired Lab. Generate only poses shown to be missing or unsuitable.
5. Tighten selection layout and HUD, improve stage masters and add shared effects/audio. Keep start reachable and special readiness understandable.
6. Expand combat depth incrementally: crouching attacks, air attacks, distinct specials, then throws/combos and balancing if desired. Test the exact published build after release.

## Verification and limits

Observed the live selector, a CPU match, health/meter updates, round progression, pause/resume, match result, and return to selection. Checked live roster HTTP status and decoded the live Lefty file independently. Scanned every PNG/WebP/AVIF in the immutable source snapshot. Ran six existing engine unit tests: all passed. Ran the structural layout contract: passed (this checks source selectors, not visual quality). Read the browser suite but did not execute the full staged browser/mobile/gamepad suite. No claim of exhaustive roster balance, controller compatibility, audio listening, or mobile usability verification is made.
