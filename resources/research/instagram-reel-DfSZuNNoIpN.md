# PixelFX — code-driven pixel-art VFX for RetroGames

**Status:** Source and project verified 2026-11-10; integration into RetroGames games **not yet performed**.

## References
- Instagram discovery: https://www.instagram.com/reel/DfSZuNNoIpN/ (shared screenshot from @ekimakes)
- Source: https://github.com/patch-gg/pixelfx
- Live visual gallery: https://patch-gg.github.io/pixelfx/
- Effect catalog: https://github.com/patch-gg/pixelfx/blob/main/docs/CATALOG.md
- Authoring instructions: https://github.com/patch-gg/pixelfx/blob/main/docs/AUTHORING.md
- Licence: https://github.com/patch-gg/pixelfx/blob/main/LICENSE
- Notices/exclusions: https://github.com/patch-gg/pixelfx/blob/main/NOTICE.md

## Verified capabilities

PixelFX by patch-gg contains **244** procedural pixel-art effects/animations across **21 categories**, including attacks, melee, impacts, explosions, fire, sci-fi, projectiles, status, UI, weather and transitions. Effects are JavaScript modules under `src/fx/<category>/<effect>.js`, and can be used in a Canvas/browser runtime or exported as transparent sprite sheets plus JSON for other engines. The project also bundles a Claude Code skill for searching, rendering, adapting and creating effects. The source repository describes **12 complete moves** with wind-up/contact/recovery and hit stop; effects use seeded randomness for repeatability.

## Game-specific opportunities (proposals, not changes already made)

| RetroGames project | Recommended first trial |
| --- | --- |
| StereoType Fighters | Try `melee/sword-slash`, impact flashes, critical hits, charge-up and hit-stop timing. Render just the effect over existing character art rather than replacing canonical sprites. Keep the deterministic 60 Hz gameplay clock authoritative; visual effect time is derived from its tick count. |
| Ashen Realms | Add hit sparks, spell effects, explosions, projectile trails, pickup sparkles; ensure effects anchor to real enemy feet/hitboxes and match parallax layers. |
| Event Horizon / First Crossing | Try sci-fi `glitch`, `emp-blast`, force-field, sparks and atmosphere, but grade for restrained cinematic horror rather than cartoon intensity. |
| Midway / Pacific Lightning | Explore bullet impact, muzzle flash, cannon shot, ship explosion and HUD pickup effects without affecting collision logic. |
| Cross-game tools | Curated sprite-sheet export pipeline, asset manifest with upstream revision, per-effect preview/contact sheet and automated licence checks. |

## Browser integration

Official source instructions:

```sh
npm i github:patch-gg/pixelfx
```

Example (ES module; requires bundler or compatible import mapping):

```js
import { createFrame, clearFrame, createFx, composite } from "pixelfx";
import * as frostNova from "pixelfx/fx/ice/frost-nova";

const frame = createFrame(320, 180);
const img = new ImageData(320, 180);
const fx = createFx(frostNova, { x: 160, y: 140 });

function tick(dt) {
  fx.update(dt);
  clearFrame(frame);
  fx.draw(frame, "back");
  // Render game characters in the integration's existing drawing pipeline.
  fx.draw(frame, "front");
  composite(frame, img.data, 0x000000);
  // Use the target Canvas 2D context to present img.
}
```

For our existing static/browser arcade, prefer exporting a selected sprite atlas or vendoring only the needed permissively licensed core/effect files after review; do not introduce a mandatory runtime npm/build step without testing the site builder.

## Sprite export and quality workflow

From a separate checkout of the upstream library (Node.js required):

```sh
node tools/render.mjs ice/frost-nova --sheet
node tools/render.mjs arcane/my-spell
node tools/check.mjs arcane/my-spell
```

The `--sheet` command emits transparent PNG frames and Aseprite-style JSON including frame rectangles/durations and pivot metadata. To create a new effect, the upstream documents `node tools/new.mjs arcane/my-spell`, followed by render, visual inspection, revisions and checking. Exported assets are appropriate for engines such as Unreal via imported textures and flipbook/material pipelines, subject to verifying scale and filtering.

For fighting games, do **not** substitute the built-in acting dummy for an approved character. Map the wind-up, impact freeze, recoil and recovery timings onto our existing sprite and 60 Hz combat states. Preserve rollback/replay determinism: game simulation owns collisions, damage and hit-stop, while VFX are presentation only; seed any particles from deterministic combat event IDs.

## Licence and provenance

The project describes its code and effects as MIT, including permitted commercial reuse, but calls out assets such as the Patch Pixel font under a separate exception in `NOTICE.md`. Before shipping, pin an upstream commit, review `LICENSE` and `NOTICE.md`, preserve copyright/notice text, and document which files or exported sprites are used. Do not assume Instagram video/audio is reusable.

## Suggested first implementation PR

1. Choose three candidate effects: `melee/sword-slash`, `impacts/hit-flash` (confirm exact catalog ID), `explosions/big-explosion`.
2. Export sprites to an isolated `assets/fx/pixelfx/` folder with source revision + licence notices.
3. Add a small manifest recording effect ID, frame size, frame timings, anchor/pivot, scale and intended game.
4. Wire one hit effect into a single StereoType Fighters test interaction. Trigger on the authoritative hit event, not every render frame.
5. Compare before/after footage, test keyboard/mobile, confirm frame rate and that gameplay remains identical.
6. Only then roll out to other games.

**Not performed in this research update:** cloning external assets, importing PixelFX into an individual game, testing, or deploying new playable effects.
