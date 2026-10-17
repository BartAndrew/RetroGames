# Midway: Evolution 2.1.0

Five-era fullscreen arcade shooter using 96 approved original AI-generated sprite frames and icons. Ancient flight is deliberately fantasy. No Capcom code, ROM, music or sprites are reused.

Play: https://retrogames-smoky.vercel.app/Midway1942/

Mirror: https://bartandrew.github.io/RetroGames/Midway1942/

## Performance update

Cached sprite scaling, projectile lighting and ocean scenery replace expensive work repeated on every frame. Auto graphics adjusts internal resolution under load; Performance (FAST) favours responsiveness; High favours sharper rendering. Quality changes do not alter the game world or collision rules, and the HUD remains at native CSS resolution. An FPS counter appears in flight.

Keyboard movement is 30% faster (520 rather than 400 world units/second); Shift gives precision control. Pointer steering reaches the target without exponential trailing. Simulation runs at fixed 120 Hz independently of display refresh with bounded catch-up, not a promise of 120 rendered FPS. Paused scenes stop repainting; hidden tabs suspend animation. Existing artwork and local scores, medals and practice unlocks are preserved.

See [PERFORMANCE.md](PERFORMANCE.md) for the diagnosis, measured comparison and qualifications.

## Campaign

Age of Legends -> Dawn of Flight (WWI) -> Pacific Thunder (WWII) -> Supersonic Front -> Beyond the Horizon. Defeat each era's flagship and choose a guaranteed upgrade. The final boss ends the campaign; unlocked eras can be practised. Weapon tiers visibly expand firepower, with modern homing missiles and future piercing plasma. Supplies, repair, shields, bombs, combos and medals support progression. No purchases, loot boxes, daily penalties or telemetry.

## Controls

WASD / arrows: steer. Shift: precision. Space: fire when auto-fire is off. X or B: bomb. Z: evade. P / Escape: pause. F: fullscreen. Touch: drag to steer and use the on-screen buttons; firing is automatic. Launch requests native fullscreen, with a full-window fallback when the browser denies it.

## Tests and implementation

`core.js` contains seeded simulation; `performance.js` contains render budgets and the 120 Hz clock; `game.js` renders cached sprites, handles input and saves local progress. Assets remain under `assets/`.

```sh
node --check Midway1942/core.js
node --check Midway1942/performance.js
node --check Midway1942/game.js
node Midway1942/test-smoke.cjs
bash tools/build_vercel.sh
node Midway1942/test-browser.cjs
```

The smoke entry point includes 13 gameplay and 8 performance-contract tests. The browser suite exercises desktop/mobile controls, all five eras, quality switching and FPS diagnostics using the arcade's existing Playwright installation. Pass a deployed game URL to test the public site. This is detailed 2D artwork, not photorealistic 3D.
