# Demolition Man

A browser-based 3D demolition puzzle for the RetroGames arcade.

## Play

Open `DemolitionMan/index.html` through a local web server or the published RetroGames site.

## Core loop

- Orbit around a compact city block.
- Place explosives on structural anchor points distributed across the condemned tower.
- Change charge power and delay group.
- Detonate and watch the tower break into physics-driven structural chunks.
- Score is reduced by explosive quantity/power, surviving target structure and collisions with protected buildings.
- Ten hand-seeded contracts are deterministic for every player.
- Contract 11 onward uses deterministic procedural generation from the contract number, so a given level number stays identical for every player.
- Progress and best scores are saved in localStorage.

## Controls

- Drag: orbit camera
- Mouse wheel: zoom
- Click glowing node: add/remove charge
- Charge Power slider: 35–100%
- Delay Group slider: 0–4, used to sequence charges
- Detonate: fire the plan
- Home button: reset camera

## Technical design

The scene is Three.js. Structural debris uses cannon-es rigid bodies after detonation. The target starts as a stack of concrete chunks. Placed charges damage nearby chunks, and the aggregate charge centroid creates a directional collapse bias. Protected buildings remain static and are represented by collision volumes; debris entering those volumes is counted once as collateral damage.

The game intentionally uses stylised procedural geometry and an SVG cover so there are no binary art dependencies.
