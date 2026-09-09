# Stereotype Fighters — playable prototype

A dependency-free 2D browser fighting-game demo using the supplied pixel-art fighter sheets and generated combat atlases.

## Current fighters

- **Lefty Liberal** — close-range fighter. Special: **Safe Space Bubble**.
- **Agenda Fluid** — quicker movement and a travelling energy-wave special: **Gender Bending Beatdown**.
- **Bimbo Babe** — Valley Girl Diva built directly from the supplied `Bimbo.png` sprite sheet. Special: **Heart Blast**.
- **Tweaker** — unpredictable movement and sudden fake-out attacks. Special: **Street Static**.

**Club Doll has been removed from the playable roster and replaced by Bimbo Babe.**

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

- Four-character select, including mirror matches.
- Best-of-three rounds, 60-second timer, health bars and round markers.
- Idle breathing/bobbing, movement, crouching, jumping, blocking and knockback.
- Multi-frame punch, kick, hurt and recovery animation sequences.
- Character-specific specials, hit sparks, particles and synthesized arcade sound.
- Basic CPU opponent with spacing, blocking, jumping and attack decisions.
- Responsive retro arcade presentation with a procedurally drawn animated neon pixel stage.
- No framework, package install or build step.

## Sprite handling

Lefty Liberal, Agenda Fluid and Tweaker use compact 96×96 combat atlases. Bimbo Babe uses the supplied full reference sprite sheet directly. The runtime crops the selected poses, removes the connected dark panel background in-browser, normalizes each pose to a 96×96 combat frame and caches the result for animation.

The standard combat animation order remains:

`idleA, idleB, punchWindup, punchExtend, punchImpact, punchRecoil, kickLift, kickKnee, kickExtend, kickImpact, kickRecover, specialCharge, specialRelease, specialPeak, hurtImpact, hurtRecoil, stagger, knockback, recover, taunt`.

## Next useful additions

1. Use more of Bimbo Babe's supplied dedicated walk, run, jump, crouch and knockdown sequences rather than the current normalized 20-frame combat mapping.
2. Dedicated walk, crouch, jump, block, victory and KO sprite sequences for the other fighters.
3. More hit reactions, aerial attacks and throws.
4. Stage selection and additional pixel stages matching each archetype.
5. More fighters and a tournament ladder.
6. Gamepad support, input remapping and difficulty settings.
7. Music, richer sampled sound effects and combo counters.

This is a playable vertical slice rather than a finished fighting-game engine.
