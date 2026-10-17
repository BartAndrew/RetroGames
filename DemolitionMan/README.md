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

The scene is Three.js. The target is now a simplified structural skeleton made from nodes, columns, beams, thin floor slabs and a stronger central core. Charges remove structural joints rather than applying a large outward blast. Support loss propagates upward through the frame, floor cells detach when too few supports remain, and gravity plus a small inward bias creates a house-of-cards style progressive collapse. Protected buildings remain static collision volumes and debris entering those volumes is counted once as collateral damage.

The city is generated road-first: streets and sidewalks are placed before lots, then buildings are restricted to those parcels so nothing can spawn in the roadway. Street lights, trees, cars, site fencing, a site office, construction equipment and a distant skyline make the playable area read as a city rather than a few isolated towers.

Engineering View exposes the structural frame, core and charge vertices while the normal view retains the façade.

The game intentionally uses stylised procedural geometry and an SVG cover so there are no binary art dependencies.


## Tutorial and city life

Contract 01 now includes an optional guided tutorial that teaches Engineering View, structural vertices, charge placement, higher-floor collapse planning, and detonation. The tutorial can be replayed from the T button.

Falling debris now transfers impact energy into intact floors below. A sufficiently heavy or fast slab can detach the lower slab, damage nearby support nodes, and create a progressive pancake-style chain reaction. This allows upper-floor demolition strategies to work instead of requiring every collapse to begin at ground level.

The city also has lightweight ambient animation: cars continuously travel both road axes and pedestrians walk the sidewalks with simple leg animation. These are visual city-life systems rather than collision-critical simulation, so they stay inexpensive enough to leave the structural physics budget focused on the target building.
