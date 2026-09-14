# StereoType Fighters - Background Pack

Six fighting-location concepts, recreation prompts, and a parallax production plan.

## Delivery status

The initial repository commit contains the catalogue, prompts, and verification script. **The seven original PNGs are supplied in the companion ZIP and still need to be imported into the repository.** No game code or stage-selection behaviour has been changed.

The artwork is flattened RGB concept art, not a set of transparent parallax layers. Each stage composite is 1916 x 821 pixels (approximately 21:9). The overview sheet is 1122 x 1402 pixels. Layer separation, reconstruction of hidden scenery, camera testing, and game integration remain to be done.

## Contents

| Stage | Original image destination |
| --- | --- |
| Neon Laneway Beatdown | `concepts/neon-laneway-beatdown.png` |
| Outback Servo Showdown | `concepts/outback-servo-showdown.png` |
| Docklands Container Clash | `concepts/docklands-container-clash.png` |
| Arcade Food Court Frenzy | `concepts/arcade-food-court-frenzy.png` |
| Construction Yard Throwdown | `concepts/construction-yard-throwdown.png` |
| Backyard BBQ Bash | `concepts/backyard-bbq-bash.png` |

Overview: `stereotype-fighters-background-pack.png`.

- [Recreation prompts and layer-export prompt](prompts.md)
- [Authoring catalogue, layer plans, dimensions and SHA-256 checksums](stages.json)
- [Original-asset verification script](verify-assets.py)

## Import the original images

Extract the companion ZIP into the root of a local `RetroGames` checkout. Its top-level `StereoTypeFighter` folder preserves the intended paths. Do not put the ZIP inside the assets directory or create another nested `RetroGames` directory.

From the repository root, run:

```sh
python StereoTypeFighter/assets/backgrounds/verify-assets.py
```

After all seven images pass, add and commit the PNG files through Git or GitHub Desktop. The script validates byte lengths, PNG dimensions, and SHA-256 checksums; it does not prove the scene is ready for gameplay. Update this delivery-status section when the PNG import is committed.

## Proposed parallax layout

These are starting values for tuning, not verified game settings. Draw from back to front:

| Layer | Camera factor X | Content |
| --- | ---: | --- |
| Backdrop | 0.05 | Sky or enclosed atrium backdrop |
| Far | 0.15 | Distant skyline or landscape |
| Middle | 0.35 | Intermediate buildings, water or vegetation |
| Near | 0.65 | Main scenery behind the fighters |
| Floor | 1.00 | Continuous walkable fighting surface |
| Fighters | 1.00 | Existing character sprites and gameplay |
| Foreground | 1.10 | Optional low, edge-only scenery |

Convention: `screenX = layerOriginX - cameraX * scrollFactorX`. The floor and fighters share the same world-to-screen movement. Keep their ground baseline fixed and tune the backdrop independently. Foreground props must not hide fighters, including at the arena edges.

Export each scene as aligned PNGs on a common canvas, initially matching the 1916 x 821 reference. Keep the backdrop opaque and other layers transparent outside their own content. Add sufficient offscreen artwork for the intended camera travel, without changing relative registration. Do not assume these compositions are horizontally tileable.

Cutting a flat image into strips is not enough: reconstruct scenery hidden behind nearer objects so camera movement does not reveal holes. Repaint or separate reflections when their source would otherwise slide independently. Keep rain, smoke, flicker, cloth movement, water highlights and other animation effects separate from the static artwork where useful.

`stages.json` is an authoring catalogue, not a runtime configuration. Do not load its planned layers as if image files already exist. Keep existing playable stages unchanged until imports, layer exports, and integration have been tested.
