# Stereotype Fighters — playable prototype

A dependency-free 2D browser fighting-game demo using the supplied pixel-art fighter sheets and generated combat atlases.

## Current fighters

- **Lefty Liberal** — close-range fighter. Special: **Safe Space Bubble**.
- **Agenda Fluid** — quicker movement and a travelling energy-wave special: **Gender Bending Beatdown**.
- **Bimbo Babe** — Valley Girl Diva built directly from the supplied `Bimbo.png` sprite sheet. Special: **Heart Blast**.
- **Douchebag Dave** — Trust Fund Tough rich-kid brawler built directly from the supplied `Dave.png` sprite sheet. Special: **Trust Fund Toss**.

Club Doll and Tweaker are no longer in the playable four-character roster.

## Play

Open `index.html` in a modern browser. Because the current runtime loads its compact game-code chunks with `fetch`, serve the folder through a local web server rather than opening it as a `file://` URL:

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
- Best-of-three rounds, 60-second timer, health bars and meter.
- Idle breathing/bobbing, walking, crouching, jumping, blocking and knockback.
- Multi-frame punch, kick, hurt and recovery animation sequences.
- Character-specific specials, hit sparks, particles and synthesized arcade sound.
- Basic CPU opponent with spacing, blocking, jumping and attack decisions.
- Responsive retro arcade presentation with a procedurally drawn animated neon pixel stage.
- No framework or package install.

## Sprite handling

Lefty Liberal and Agenda Fluid use compact 96×96 combat atlases. Bimbo Babe and Douchebag Dave use their supplied full sprite sheets directly. The runtime crops selected poses, removes the connected dark panel background in-browser, normalizes each pose to a 96×96 combat frame and caches it for animation.

Dave currently uses dedicated sequences from `Dave.png` for:

- five-frame idle breathing
- five-frame walk cycle
- five-frame jump cycle
- four-frame crouch cycle
- five-frame light punch
- four-frame kick
- four-frame **Trust Fund Toss** special
- four hurt frames
- two block frames
- five knockdown frames
- get-up/recovery frames
- taunt / win poses

His Trust Fund Toss also emits a small cash-particle burst during the special animation.

## Next useful additions

1. Add Dave's Yacht Kick as a second special / heavy kick path.
2. Use Bimbo Babe's dedicated walk, run, jump, crouch and knockdown sequences more fully.
3. Add heavy attacks, throws, aerial attacks and combo chains to the core engine.
4. Add stage selection and home stages for each archetype.
5. Add gamepad support, input remapping and difficulty settings.
6. Add music, sampled sound effects and combo counters.

This is a playable vertical slice rather than a finished fighting-game engine.
