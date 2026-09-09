# Stereotype Fighters — playable prototype

A dependency-free 2D browser fighting-game demo built from the two supplied character animation sheets.

## Current fighters

- **Lefty Liberal** — close-range fighter. Special: **Safe Space Bubble**.
- **Agenda Fluid** — quicker movement and a travelling energy-wave special: **Gender Bending Beatdown**.

The supplied character sheets were converted into compact transparent atlases so the prototype animates the existing artwork rather than placeholder fighters.

## Play

Open `index.html` in a modern browser. For the most predictable local asset loading, serve the folder:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/StereoTypeFighter/` when serving from the repository root, or `http://localhost:8080/` when serving from this folder.

## Controls

| Action | Player 1 | Player 2 |
| --- | --- | --- |
| Move | A / D | Left / Right |
| Jump | W | Up |
| Crouch | S | Down |
| Block | E | I |
| Punch | F | J |
| Kick | G | K |
| Special | H | L |
| Pause | P | P |

Two modes are available from character select: **Vs CPU** and **2 Player** on one keyboard.

## Demo feature set

- Character select for both supplied fighters, including mirror matches.
- Best-of-three rounds, 60-second timer, health bars and round markers.
- Idle breathing/bobbing, movement, crouching, jumping, blocking and knockback.
- Multi-frame punch, kick, hurt and recovery animation sequences.
- Character-specific specials, hit sparks, particles, hit-stop, screen shake and synthesized arcade sound.
- Basic CPU opponent with spacing, blocking, jumping and attack decisions.
- Responsive retro arcade presentation with a procedurally drawn animated neon pixel stage.
- No framework, package install, build step or external asset dependency.

## Sprite atlas layout

Each generated atlas uses **96×96 frames** in a 5-column × 4-row grid:

`idleA, idleB, punchWindup, punchExtend, punchImpact, punchRecoil, kickLift, kickKnee, kickExtend, kickImpact, kickRecover, specialCharge, specialRelease, specialPeak, hurtImpact, hurtRecoil, stagger, knockback, recover, taunt`.

The atlases and game source are packaged as small JavaScript chunks under `assets/`; `index.html` concatenates those chunks and `game-loader.js` starts the game. This keeps the prototype self-contained despite the connected GitHub workflow's binary-file limitations.

## Next useful additions

1. Dedicated walk, crouch, jump, block, victory and KO sprite sequences.
2. More hit reactions, aerial attacks and throws.
3. Stage selection and additional pixel stages matching each archetype.
4. More fighters and a tournament ladder.
5. Gamepad support, input remapping and difficulty settings.
6. Music and richer sampled sound effects.
7. Combo counter and optional command-input special moves.

This is a playable vertical slice rather than a finished fighting-game engine.
