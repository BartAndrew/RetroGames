# Sandbag Siege V2

Sandbag Siege V2 is a browser-based first-person arcade shooter with movement, pickups, grenades, medkits, and a gunship boss.

## What changed in version 2

- The camera is now first person instead of a fixed shooting gallery.
- The player can move around the battlefield with `W`, `A`, `S`, and `D`.
- `Q` uses a medical power-up.
- `E` throws a grenade.
- The sprite art has been modernized with cleaner SVG character, weapon, and effect sheets.

## Controls

- Mouse: aim
- Left click: fire
- `W A S D`: move
- `Q`: use medkit
- `E`: grenade attack
- `1`: ranger rifle
- `2`: auto rifle
- `R`: reload
- `P`: pause

## Teaching focus

This project is useful for teaching:

1. game loops
2. keyboard and mouse input
3. first-person projection tricks
4. state objects
5. sprite animation
6. pickups, health, and simple AI

## Files

- `index.html`: page structure
- `style.css`: HUD and layout styling
- `game.js`: first-person game logic
- `assets/generate_svg_assets.py`: creates the version 2 SVG sprite sheets
- `assets/modern_units.svg`: enemy and pickup art
- `assets/modern_vehicles.svg`: boss art
- `assets/modern_fx.svg`: effects art
- `assets/modern_weapon.svg`: first-person weapon art
- `docs/TEACHING_NOTES.md`: lesson notes
