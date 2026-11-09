# Ashen Realms 2: Crown of Cinders

A second pass on the Ashen Realms fantasy beat 'em up. The art, music, three stages and three champions are the same as [V1.5](../AshenRealms/); what changed is how the fights play. This folder is self-contained and does not depend on `AshenRealms/`.

Open `index.html` (any static server works: `python3 -m http.server 8080`, then visit `/AshenRealms2/`).

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | WASD / arrows | Left stick / D-pad |
| Attack | J | A |
| Heavy attack | K | X |
| Magic | L | B |
| Dodge | Space | Y |
| Pause | P / Esc | |
| Mute | M | |

Touch buttons appear automatically on touch devices.

## What's new in V2.0

- **Telegraphed attacks.** Enemies wind up before they strike: a "!" appears overhead and a warning ring shows their reach. Damage only lands at the end of the wind-up, and only if you are still in range and in front of them. Hitting an enemy during its wind-up interrupts it.
- **Attacker limit.** At most two grunts attack at once; the rest hold position and wait their turn, so crowds are readable rather than unavoidable.
- **Dodge cooldown and perfect dodge.** Dodge now has a short recovery (shown under the mana bar). In V1.5 it could be chained into near-permanent invulnerability. Dodging through a strike refunds a little mana.
- **Hit chain scoring.** Consecutive hits build a chain (x2 at 5 hits, up to x5 at 20). The chain times out after about 2.5 seconds without a hit and resets if you are hit.
- **Boss rework.** The Cinder Warden shrugs off light hits (no stagger, wind-up not interrupted). Heavy attacks and magic break his guard. At half health he enrages: faster, quicker attacks, harder hits, and a shockwave slam you must dodge through.
- **Stage bonuses.** Clearing a stage awards an HP bonus and a time bonus. The end screen reports score, foes felled, best chain and run time.
- **Game feel.** Brief hit-stop on heavy hits and kills, floating damage and score numbers, a stage title banner, and enemies spread out instead of stacking on one point.
- **Fixes.** Score now resets at the start of a new run (V1.5 carried it over). The game pauses automatically when the tab is hidden.

## Tuning

Balance values live at the top of `game.js`: the `foe` table (hp, reach, wind-up frames, damage, speed, attack cooldown, points) and the constants `MAX_ATTACKERS`, `CHAIN_WINDOW`, `DODGE_TOTAL` and `PAR_FRAMES` (the time-bonus par, in frames at 60 Hz).

Opening the page with `?debug` exposes `window.ASHEN2_DEBUG` for testing from the console.

## Credits

Sprites, backdrops, music and sound effects are unchanged from V1.5; see [credits.html](credits.html).
