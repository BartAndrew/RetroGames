# Stereotype Fighters — playable prototype

A dependency-free browser-based 2D fighting-game prototype built from the pixel-art fighter sheets in this repository.

## Current roster

The character-select screen now exposes the complete named sprite-sheet roster in `StereoTypeFighter`, plus the two original prototype fighters:

1. Lefty Liberal — **Safe Space Bubble**
2. Agenda Fluid — **Gender Bending Beatdown**
3. RapThug — **Bass Drop**
4. KillWoodRat — **Razor Riff**
5. SK8R BOI — **Kickflip KO**
6. Club Doll — **Velvet Rope Vortex**
7. Grunge — **Feedback Frenzy**
8. Yuppie — **Hostile Takeover**
9. Fat Gamer — **Level Up**
10. Bimbo Babe — **Heart Blast**
11. Influencer — **Viral Spiral**
12. Yoga Mom — **Namaste Knockout**
13. E-Girl — **Lag Spike**
14. Cheerleader — **Pom-Pom Cyclone**
15. Punk Princess — **Mosh Pit Riot**
16. Douchebag Dave — **Trust Fund Toss**
17. Junkie — **Needle Rush**
18. Neckbeard Nate — **Actually…**

The 16 named-sheet characters correspond to the roster documented in `CHARACTER_BIBLE.md`. Lefty Liberal and Agenda Fluid remain as bonus/original prototype fighters.

## Character-select v4

The selector was rebuilt after the previous version stopped during menu initialization. The immediate cause was a strict-mode JavaScript error in the portrait setup path: the `img` variable was being assigned without a declaration, which stopped `setupMenu()` before the selector buttons became interactive.

The v4 selector now:

- repairs that runtime error before the game initializes;
- supports the full 18-fighter roster;
- uses a compact arcade-style portrait grid instead of large two-column cards;
- keeps the P1/P2 selection summary and start buttons visible;
- gives the roster its own scroll area so a large roster fits inside the game cabinet;
- supports mouse, touch and keyboard button activation;
- continues to use the named sprite-sheet images already stored in this repository.

## Play

GitHub Pages:

`https://bartandrew.github.io/RetroGames/StereoTypeFighter/`

For local testing from the repository root:

```bash
python3 -m http.server 8080
```

Then open:

`http://localhost:8080/StereoTypeFighter/`

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

Two modes are available: **Vs CPU** and **2 Player** on one keyboard.

## Sprite handling

Lefty Liberal and Agenda Fluid use compact 96×96 combat atlases. Junkie uses the dedicated compact runtime atlas generated from the supplied Junkie sheet. Douchebag Dave keeps his detailed frame map.

The other named full-sheet characters use a conservative common crop map based on the shared sprite-sheet layout so they can immediately participate in the current game engine. These generic mappings are a playable baseline; each fighter can progressively receive bespoke animation coordinates, attack timings and unique specials without changing the selector architecture again.

## Next useful additions

1. Replace generic full-sheet crops with bespoke animation maps for each fighter.
2. Add each character's second special / super from the character bible.
3. Add heavy attacks, throws, aerial attacks and combo chains.
4. Add stage selection and character-specific home stages.
5. Add gamepad support and input remapping.
6. Add music, sampled sound effects and combo counters.

This remains a playable vertical slice rather than a finished fighting-game engine.
