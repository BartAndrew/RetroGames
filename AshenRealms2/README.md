# Ashen Realms 2: Crown of Cinders

A second pass on the Ashen Realms fantasy beat 'em up. Backdrops, music, enemies and the three stages come from [V1.5](../AshenRealms/); V2.0 reworked how fights play and V2.1 replaced the heroes with new rig-animated characters and a combo system. This folder is self-contained and does not depend on `AshenRealms/`.

Open `index.html` (any static server works: `python3 -m http.server 8080`, then visit `/AshenRealms2/`).

## Controls

| Action | Keyboard | Gamepad |
| --- | --- | --- |
| Move | WASD / arrows | Left stick / D-pad |
| Attack (tap to chain) | J | A |
| Heavy attack / finisher | K | X |
| Magic | L | B |
| Dodge | Space | Y |
| Pause | P / Esc | |
| Mute | M | |

Touch buttons appear automatically on touch devices.

## What's new in V2.3

- **Ambush arenas.** Each stage has two ambushes: the screen locks and a warband (with an elite in later stages) streams in from both sides until it is cleared, then a GO arrow sends you on.
- **Elite foes.** Gold-tinted, larger, tougher and harder-hitting, worth double score and always drop an item.
- **Breakable urns and Ember Runes.** Smash urns for health and mana. A rare Ember Rune gives 10 seconds of +40% damage.
- **Boss fight.** When the Cinder Warden enrages he now calls two warriors in from the sides, and the arena flashes.
- **Difficulty and accessibility.** Easy / Normal / Hard on the title screen, plus switches for screen shake and screen flashes. Choices are remembered.
- **Best scores.** The best score per hero and difficulty is saved in the browser and shown on the end screen.
- **Hit effects.** Pixel-style flash stars, slash marks and glowing sparks on every hit, dust on dodges, heavy moves and walking, enemies dissolve into embers, a screen flash on big hits, a red pulse at low health, and drifting embers, fireflies or ash by stage.
- **HUD and UX.** A stage progress bar with ambush and boss markers, an Ember Rage timer, first-stage tutorial hints, and a pause screen listing your hero's move list (Q returns to the title).

## What's new in V2.2

- **Story and cutscenes.** A short cinematic story runs through the game: a prologue, an interlude after each stage, a boss confrontation, an ending and a defeat scene. Each plays over the painted stage art with slow camera moves, colour grading, letterbox, grain and drifting embers, using your chosen hero and the other three champions as the fallen and as spirits. Advance with Enter / Space / J / click, skip with Esc. Script: `story.js`.
- **Reference art.** `reference/` holds character pose sheets for all four heroes, the three backdrop plates, a storyboard of every cutscene shot and the story bible (`reference/STORY.md`).

## What's new in V2.1

- **Astrid, a new spear-wielding lead.** Long reach, fast thrusts and a red-pennon spear. She is the first card and the default hero.
- **Combos.** Tap attack to chain L1, L2 and L3. Press heavy after two lights (J, J, K) for a hero-specific finisher. Inputs are buffered, moves cancel into the next one part-way through, and a dodge can cancel any move once it has landed.
  - Astrid: L3 Whirlwind, heavy Vault Strike, finisher Dawn Flurry (four thrusts), magic Spear Rain.
  - Iron Warden: L3 overhead chop, heavy Crown Breaker, finisher Shield Breaker (bash then rising cut), magic Sunfall.
  - Ash Berserker: L3 Whirling Axe, heavy Cleave, finisher Earthbreaker (shockwave), magic War Cry.
  - Moonblade: L3 Twin Cut, heavy Dash Slash, finisher Moonfall (triple spin), magic Lunar Wave.
- **Rig-based animation.** All four heroes are drawn by `rig.js`: a skeleton with two-bone IK legs and arms, keyframed anticipation / strike / recovery for every move, and cloth, scarf and hair that trail behind. The result is pixelated to match the backdrops. Heroes also get walk cycles driven by distance moved, a hurt flinch, a roll, and a death animation.
- **Feedback.** Weapon trails, dodge afterimages, per-hero magic effects, and hits land on the strike frame rather than on the button press.
- Heroes now plant their feet while attacking (slower movement, locked facing), so combos commit you.

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

Balance values live at the top of `game.js`: the `MOVES` table (per-hero damage, reach, hit timing, lunge and cancel point), the `foe` table (hp, reach, wind-up frames, damage, speed, attack cooldown, points) and the constants `MAX_ATTACKERS`, `CHAIN_WINDOW`, `DODGE_TOTAL` and `PAR_FRAMES` (the time-bonus par, in frames at 60 Hz).

Opening the page with `?debug` exposes `window.ASHEN2_DEBUG` for testing from the console.

## Credits

Heroes are procedural (`rig.js`). Enemy sprites, backdrops, music and sound effects are from V1.5; see [credits.html](credits.html).
