# Stereotype Fighters — V6 runtime stabilization

Stereotype Fighters is the RetroGames pixel-art fighting game. This branch stabilizes the V6 runtime, controls, accessibility, combat simulation, production asset pipeline and browser QA while preserving the existing 20-character roster, personalities, six arenas, Animation Lab and visual direction.

## Version status

The live runtime intentionally remains **V6.4**. The repository contains newer Agenda Fluid HD work, but its manifest only provides four micro-movement strips and still lists required production work such as KO, air, throw and super states. Under the release rule, incomplete V6.5 art is not wired into production and the page title, footer, cache keys and `window.SF.version` remain 6.4. The production Pages bundle excludes the unfinished Agenda HD source folder.

## Game modes and roster

- **20 fighters**, with mirror matches supported.
- **Six selectable arenas** plus Random Stage.
- **VS CPU**: Easy, Normal and Hard.
- **Local 2 Player**.
- **Training**: unlimited timer, full special meter, `R` instant reset and short automatic reset after KO.
- **Animation Lab** with all required sequences, play/pause, stepping and hitbox view.
- Match hitboxes can also be shown with `?debug=hitboxes`.

## Controls

| Action | Player 1 | Player 2 | Gamepad |
| --- | --- | --- | --- |
| Move | W/A/S/D | Arrows | D-pad / left stick |
| Block | E | I | shoulder |
| Punch | F | J | A/X |
| Kick | G | K | B |
| Special | H | L | Y/RT |
| Pause | P / Escape | P / Escape | Start/Menu |
| Training reset | R | — | — |

Coarse-pointer devices receive Player 1 touch controls for left, right, jump, crouch, block, punch, kick and special. Pointer capture/cancel handling prevents stuck touch input. Desktop pointers do not show the controller.

## Combat model

V6 uses a symmetric two-phase simulation: both intentions are collected, both fighters advance, both hit/hurtbox interactions are gathered, all hit events are resolved together, bodies are separated, then round state is updated. P1 has no priority simply because it is first in an array.

Same-frame trades are valid. A simultaneous KO is a draw round and awards no point. A tied time-out is a draw; otherwise higher health wins the time-out and the losing fighter visibly falls. The 60-second clock freezes during hit-stop. Normal punch/kick attacks are intentionally grounded; accidental air normals are not started.

Gameplay collision is independent of sprite dimensions. Standing, crouching and airborne hurtboxes are explicit. Punch, kick and special moves specify startup, active frames, recovery, damage, knockback, hit stun and block stun. Projectile specials instantiate real moving gameplay entities, so rendered effects and collision occupy the same position.

## Fighter identity and CPU

`combat-v6.js` is the single balance table. Every fighter maps to one of six modest archetypes—rushdown, balanced, heavy, zoner, mobile or defensive—with per-fighter overrides for movement, defense, normal attacks, special type/cost/damage, knockback and recovery. Signature move names map to real burst, dash or projectile behaviour rather than identical attacks with different labels.

CPU levels vary reaction delay, aggression, defensive probability, spacing, attack selection, special use, anti-air response, punish behaviour, retreat behaviour and mistake probability. AI considers the fighter archetype and uses only current game state. Tests use a seeded RNG for deterministic CPU regression checks.

## Production sprite/loading architecture

Character select uses the compact portrait atlas, so all 20 fighter cards appear without loading combat data. Full move sets remain lazy-loaded when selected with a small idle warm cache.

`tools/build-v6-assets.mjs` moves the expensive legacy 1536×1024 sheet processing to CI/build time. It keeps the existing compact V6 atlases and builds compact lossless WebP combat atlases for the remaining roster, including stored matte handling for difficult legacy silhouettes. It writes `tools/roster-runtime-v6.json` into the staged site. The published `_site` does not contain old runtime extractors, source PNG sheets, unused historical runtime versions or incomplete Agenda HD development assets.

Failures are isolated: portrait-atlas failure leaves fallback cards and Retry Portraits; a single fighter move-set failure leaves other fighters playable and exposes Retry Move Set; stage failure uses the procedural fallback and can be retried; fatal roster/module failure shows and announces actionable reload guidance.

## Accessibility

Sound, reduced motion and Animation Lab playback expose `aria-pressed`. Fighter cards expose P1/P2 selected state semantically. Health and special meters expose current numeric values. Pause and result overlays are modal dialogs with focus containment. Focus moves to Resume on pause, back to Pause on resume, to Rematch on match completion, and back to the relevant fighter selector when leaving a match. Round/Fight/KO/time/result/winner events and actionable failures use live regions. Both canvases are labelled, the skip-to-roster link is hidden until focused, and visible keyboard focus is preserved without changing the retro aesthetic.

## Responsive/browser QA

The regression suite checks 320×568, 360×800, 390×844, 480×900, 768×1024, 1024×768 and 1440×900 for overflow, roster usability, stage/start reachability, canvas containment, HUD alignment and overlay coverage. Representative desktop/mobile selector/fight/pause/result screenshots are uploaded as CI artifacts.

Target browsers are current Chromium, Firefox and Safari with ES modules, Canvas 2D and Pointer Events. Gamepads use the browser Gamepad API when present. CI gates production with current Playwright Chromium.

## Test procedure

From the repository root:

```bash
python3 tools/build_site.py
cd StereoTypeFighter
npm install --no-audit --no-fund
npm run test:layout
npm run test:unit
cd ..
node StereoTypeFighter/tools/build-v6-assets.mjs --site _site/StereoTypeFighter
node StereoTypeFighter/tools/prune-v6-site.mjs --site _site/StereoTypeFighter
node StereoTypeFighter/tools/verify-v6-assets.mjs --site _site/StereoTypeFighter
cd StereoTypeFighter
npx playwright install --with-deps chromium
npm run test:browser
```

The Playwright suite launches the **actual staged production files** and does not replace the app controller, arena engine or production roster. GitHub Pages deployment runs only after site/link validation, layout/engine checks, offline atlas build, production asset verification and browser regression pass.
