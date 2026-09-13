# Stereotype Fighters — playable prototype

A dependency-free 2D browser fighting-game demo using the supplied pixel-art fighter sheets and generated combat atlases.

## Current fighters

- **Lefty Liberal** — close-range fighter. Special: **Safe Space Bubble**.
- **Agenda Fluid** — quicker movement and a travelling energy-wave special: **Gender Bending Beatdown**.
- **Bimbo Babe** — Valley Girl Diva built directly from the supplied `Bimbo.png` sprite sheet. Special: **Heart Blast**.
- **Douchebag Dave** — Trust Fund Tough rich-kid brawler built directly from the supplied `Dave.png` sprite sheet. Special: **Trust Fund Toss**.
- **Junkie** — fast, fragile Street Brawler / Tweaker archetype generated from the supplied Junkie sprite sheet. Special: **Needle Rush**.

Club Doll and Tweaker are no longer in the playable roster as separate characters.

## Play

Open `index.html` in a modern browser. The game has no framework or package install requirement.

For local testing, serve the repository through a simple web server:

```bash
python3 -m http.server 8080
```

Then visit `http://localhost:8080/StereoTypeFighter/` when serving from the repository root, or `http://localhost:8080/` when serving from this folder.

The same folder is configured for GitHub Pages deployment from `main`.

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

- Five-character select, including mirror matches.
- Best-of-three rounds, 60-second timer, health bars and meter.
- Idle breathing/bobbing, walking, crouching, jumping, blocking and knockback.
- Multi-frame punch, kick, hurt and recovery animation sequences.
- Character-specific specials, hit sparks, particles and synthesized arcade sound.
- Basic CPU opponent with spacing, blocking, jumping and attack decisions.
- Responsive retro arcade presentation with a procedurally drawn animated neon pixel stage.
- No framework or package install.

## Sprite handling

Lefty Liberal and Agenda Fluid use compact 96×96 combat atlases. Bimbo Babe and Douchebag Dave use their supplied full sprite sheets directly and are cropped / background-cleaned in-browser. Junkie uses a compact 480×960 runtime atlas generated from the newly supplied sheet, arranged as fifty 96×96 frames.

### Douchebag Dave

Dave uses dedicated sequences from `Dave.png` for idle breathing, walk, jump, crouch, light punch, kick, **Trust Fund Toss**, hurt, block, knockdown, get-up/recovery and taunt/win poses. Trust Fund Toss also emits a cash-particle burst.

### Junkie

Junkie uses dedicated sequences for:

- five-frame idle breathing
- five-frame walk cycle
- four-frame jump cycle
- four-frame crouch cycle
- four-frame light punch
- four-frame light kick
- four-frame **Needle Rush** special
- three hurt frames
- three block frames
- five knockdown frames
- five get-up/recovery frames
- four taunt / win poses

Junkie is tuned as a faster but more fragile pressure fighter and gets a green burst effect when Needle Rush is triggered.

## Next useful additions

1. Add Junkie's Crazed Flurry as a second special / combo route.
2. Add Dave's Yacht Kick as a second special / heavy kick path.
3. Use Bimbo Babe's dedicated walk, run, jump, crouch and knockdown sequences more fully.
4. Add heavy attacks, throws, aerial attacks and combo chains to the core engine.
5. Add stage selection and home stages for each archetype.
6. Add gamepad support, input remapping and difficulty settings.
7. Add music, sampled sound effects and combo counters.

This is a playable vertical slice rather than a finished fighting-game engine.
