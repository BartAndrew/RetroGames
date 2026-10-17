# Performance release 2.1.0

## Diagnosis

The previous renderer applied shadowBlur for every projectile, rescaled atlas regions repeatedly, and rebuilt the ocean gradient and approximately 150 ripple paths each frame. Fullscreen at 1920 x 1080 with device-pixel-ratio 2 rendered 3840 x 2160 pixels (8.29 million). A 100 ms frame-delta cap also discarded simulation time during sustained low frame rate. Pointer easing caused trailing near a target.

## Implemented fixes

- Cache pre-scaled sprites, projectile-light stamps, glow stamps, ocean base, ripple pattern and island textures; skip off-screen drawing.
- Bound the render canvas to 1.5 million pixels in Auto, 850,000 in FAST, or 3 million in High. Auto can lower resolution further under load. HUD resolution and collision coordinates are independent of this setting.
- Use a fixed 120 Hz simulation consuming elapsed time, capped at 250 ms / 30 steps to avoid runaway catch-up after long stalls. Display refresh still determines actual rendered FPS.
- Remove pointer easing, increase keyboard travel from 400 to 520 units/second, preserve Shift precision, and process bomb/evasion feedback on input.
- Limit cosmetic particles, avoid unchanged HUD mutations and unnecessary canvas resets, reuse pointer geometry, stop repainting paused scenes and suspend hidden-tab animation.

## Recorded local comparison

Earlier local profiling in this release used headless Chromium with local copies of the actual code/assets. Same initial future-era scene: power 4, one boss and eight heavies, QA invulnerability; 1.5-second warmup and one 6-second measured sample per configuration.

| CSS viewport | DPR | 2.0.1 FPS | 2.1.0 Auto FPS | Old / new backing canvas |
| --- | --- | --- | --- | --- |
| 1440 x 900 | 1 | 6.70 | 60.00 | 1440 x 900 / 1440 x 900 |
| 1920 x 1080 | 2 | 1.61 | 59.50 | 3840 x 2160 / 1632 x 918 |

These are constrained headless observations, not measurements on the user's computer or a hardware-independent guarantee. The old version loses simulation time under load, so per-frame entity populations differ despite identical initial setup. High-DPR gains combine cheaper effects and fewer rendered pixels. JavaScript callback time alone excludes asynchronous raster/compositor work. Approved asset files are unchanged.

## Regression coverage

The eight performance tests check pixel budgets at common desktop, Retina, ultrawide and mobile sizes; equal simulation time at 30/60/120/144 Hz display rates; 200 ms stalls; bounded long-gap recovery; automatic quality adjustment; direct pointer movement; and refresh-independent keyboard travel. They run through the existing smoke-test entry point alongside 13 gameplay checks.

The real-browser suite checks pause without canvas repainting, quality changes without moving the player/world, live FPS diagnostics, real touch dragging, desktop controls and the full five-era progression. It intentionally makes no hardware-specific FPS assertion.

`Midway.performance()` exposes local read-only diagnostics: FPS, backing resolution, draw callback time, caches, particle budget, simulation frequency and dropped long-stall time. Nothing is transmitted. Auto is the default; select FAST for limited graphics hardware.
