# Midway: Evolution 2.0.1

Five-era browser arcade shooter with **96 approved original AI-generated sprite frames and icons**, smaller player craft, fullscreen launch, and evolving weapons. This release replaces the original oversized procedural aircraft. No Capcom code, ROM, soundtrack or sprites are reused. Ancient flight is intentionally fantasy, not historical simulation.

Play: https://retrogames-smoky.vercel.app/Midway1942/

GitHub Pages mirror: https://bartandrew.github.io/RetroGames/Midway1942/

## Five eras

Age of Legends (bronze gliders, ballista bolts, catapult islands, triremes) -> Dawn of Flight (WWI biplanes, zeppelins, railway fortress) -> Pacific Thunder (WWII fighters and carrier) -> Supersonic Front (jets, homing missiles, modern carrier) -> Beyond the Horizon (plasma craft and the Singularity).

Each stage has an approach and a damageable flagship with era-specific attack patterns. Sinking it unlocks the next era and pauses combat for a guaranteed upgrade choice. The final boss ends the campaign. Unlocked eras can be selected for practice.

## Controls

WASD / arrows: steer. Space: fire when auto-fire is off. Shift: precision speed. X or B: bomb. Z: evasive roll (six-second cooldown). P / Escape: pause. F: fullscreen. On touchscreens, drag relative to your current position and use the bomb/evade/pause buttons; weapons fire automatically.

Launch requests native fullscreen from the click gesture. If the browser denies or does not support the API, full-window play remains active. Mobile browser chrome cannot always be hidden.

## Rewards and progression

Weapon pickups raise a four-tier, visibly expanded weapon array. Modern tiers 3-4 add homing missiles; future tiers 3-4 add piercing plasma. Every fifth defeat grants a predictable supply; timed supplies support early progress. Repair, shield and bomb drops are distinct. Skill-based kill chains raise multipliers; medals recognise concrete accomplishments. Between eras, choose weapon evolution, shielding, or repair and ordnance. No purchases, loot boxes, daily streak penalties, compulsory notifications or analytics. Best score, practice unlocks and medals are saved only on the current device.

## Architecture and tests

- `core.js`: seeded deterministic simulation without DOM dependencies.
- `game.js`: sprite renderer, fixed-step loop, input, audio, local save, accessibility and fullscreen fallback.
- `assets/sprites.json`: exact atlas rectangles, source image names and hashes.
- `assets/era-*.webp` and `ui.webp`: optimized transparent artwork.
- `test-smoke.cjs`: 13 deterministic gameplay tests; no external dependencies.
- `test-browser.cjs`: real Chromium desktop/mobile, asset loading, controls, pause and five-era progression checks; uses the arcade's existing Playwright installation.

From the repository root:

```sh
node --check Midway1942/core.js
node --check Midway1942/game.js
node Midway1942/test-smoke.cjs
python3 tools/build_site.py
npm install --prefix StereoTypeFighter --no-audit --no-fund
cd StereoTypeFighter && npx playwright install chromium && cd ..
node Midway1942/test-browser.cjs
```

Test deployment: `node Midway1942/test-browser.cjs https://retrogames-smoky.vercel.app/Midway1942/`

`?qa=1` enables controlled browser test fixtures and disables save persistence. Normal gameplay exposes only read-only version/state diagnostics. All runtime assets are local; no account, backend, CDN library or API key is required.

## Known boundaries

This is detailed sprite-based 2D, not photorealistic 3D. Fullscreen availability is browser-dependent. Physical iPhone/Safari testing remains useful beyond Chromium mobile emulation. There is no gamepad support, online multiplayer or cross-device save.
