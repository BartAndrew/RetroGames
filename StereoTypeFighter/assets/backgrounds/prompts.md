# Image 2.5 - Background Recreation Prompts

These are recreation prompts for the six images generated in the background-design conversation. They do not guarantee pixel-identical output or imply a particular image model supports layered files. Use the matching original PNG as the visual reference.

## Shared art direction

Append this to each scene prompt:

> Wide approximately 21:9 landscape composition for StereoType Fighters, a retro side-view 2D arcade fighting game. Polished 1990s-inspired stage illustration with pixel-art-inspired, hand-painted texture, crisp silhouettes and readable shapes. Match the reference palette, architecture, lighting direction, horizon, camera position and prop scale. A flat continuous fighting lane runs horizontally across the lower third. Keep the central gameplay area unobstructed and lower in visual contrast than the fighters. Put decorative foreground props at the extreme sides, not across the fighting lane. No fighters, people, HUD, captions, watermarks or readable brand text. This request produces one complete concept image; a separate export request is required for each parallax layer.

## 1. Neon Laneway Beatdown

Reference: `concepts/neon-laneway-beatdown.png`

> Create a gritty Melbourne-inspired laneway fighting stage at blue hour after rain. Warm amber wall lamps contrast with saturated blue and magenta neon reflections on cracked wet asphalt. Frame the sides with aged brick walls, torn posters, wheelie bins and milk crates. Include a graffiti-covered roller door with a snarling animal mural on the right, a parked delivery van farther back, pipes, rooftop antennas and overhead cables. Beyond the low rooftops, show an elevated railway and a layered illuminated city skyline. Maintain an empty, level foreground fighting strip. Separate the visual depth into sky, far skyline, intermediate rooftops and railway, nearby walls and props, ground, and low edge-only foreground objects. Match the supplied composition rather than redesigning the street.

Optional animation plan: distant train, restrained neon flicker, puddle highlights, light rain. These effects are not supplied as animations.

## 2. Outback Servo Showdown

Reference: `concepts/outback-servo-showdown.png`

> Create a dusty Australian roadside servo and roadhouse at vivid sunset. A weathered corrugated-metal building and rusty fuel canopy occupy the left half, with old fuel bowsers, small porch clutter and a dusty ute under the canopy. A windmill, water tank and another weathered ute sit toward the right. Behind a low fence, layer scrubland, power poles and distant flat-topped mesas below a huge yellow-orange setting sun and pink-purple clouds. Keep a broad red-dirt forecourt empty across the lower third. Tyre stacks, rusty drums and dry grass frame only the front corners. Warm ochre, orange and rust-red foreground; cooler purple distant landforms; clear separation of sky, mesas, scrubland, servo structures, dirt ground and foreground clutter.

Optional animation plan: windmill rotation, fine dust and subtle grass movement. These effects are not supplied as animations.

## 3. Docklands Container Clash

Reference: `concepts/docklands-container-clash.png`

> Create a nighttime industrial harbour dock fighting stage in cool navy and blue with warm orange work lamps. Stack weathered red, blue and green shipping containers on the left, with an illuminated open loading bay, ramp, forklift and safety rails. Place a cargo ship farther behind the dock, with giant port cranes overhead and in the distance. Across the harbour, show a lit bridge, modern city skyline, moon and broken clouds. A wide wet concrete-and-metal fighting surface spans the lower third, with embedded rails, seams and restrained light reflections. Confine bollards, coiled ropes, pallets and tarps to the outer foreground edges. Distinct depths: sky, far city and bridge, harbour and ship, container yard, fighting floor, edge-only dock clutter.

Optional animation plan: water shimmer, small navigation lights and subtle crane-cable sway. These effects are not supplied as animations.

## 4. Arcade Food Court Frenzy

Reference: `concepts/arcade-food-court-frenzy.png`

> Create a nostalgic 1990s shopping-centre food court beside a neon arcade. A row of colourful arcade cabinets and a claw machine fills the left side; a bright fast-food counter with simple burger, drink and pizza pictograms occupies the right. A central escalator leads toward an upper balcony behind a fountain and indoor palms. Add tiled columns, playful geometric hanging banners, a glass atrium skylight, distant storefront glows and red-and-chrome seating set back from the arena. Leave the lower middle as a broad unobstructed polished tile floor with pastel teal and pink squares. Place low table edges and plant leaves only in the extreme corners. Strong cyan, magenta and amber accents; separated atrium backdrop, balcony, fountain/escalator, cabinets/counters, floor and foreground corner elements.

Optional animation plan: cabinet screen cycles, fountain water, escalator movement and gentle sign flicker. These effects are not supplied as animations.

## 5. Construction Yard Throwdown

Reference: `concepts/construction-yard-throwdown.png`

> Create an urban construction-site fighting stage in dusty late-afternoon sunset light. A half-built concrete building with open floors, exposed rebar, scaffold platforms, ladders and temporary safety rails fills the left. Add stacked timber pallets, cement bags, blue tarps and chain-link fencing behind the arena. To the right, show a steel-frame building, a site office and yellow construction equipment. Tower cranes span the background against a hazy city skyline and low golden sun. Keep a broad level concrete fighting slab clear across the lower third, with seams, cracks and small puddles. Concrete pipes, rebar bundles, cones, a toolbox and a hard hat frame the extreme foreground edges. Distinct sky, distant skyline, cranes/frames, nearby site structures, concrete floor and edge props.

Optional animation plan: slight hook sway, tarp movement and sparse drifting dust. These effects are not supplied as animations.

## 6. Backyard BBQ Bash

Reference: `concepts/backyard-bbq-bash.png`

> Create a nostalgic Australian suburban backyard fighting stage at golden hour. A brick house and timber pergola with coloured string lights occupy the left, with a barbecue, small prep area and hanging plants. A lawn, flowering garden beds, corrugated boundary fence and rotary clothesline with shirts and striped towels form the middle distance. Neighbouring tiled rooftops, gum trees and a faint skyline recede behind the fence under a warm pink-orange sky. Leave a wide level paved patio clear across the lower third for the fighters. Put a picnic bench, esky and scattered party items at the far-left edge; a sunglasses-wearing garden gnome, toy truck, ball and chalk marks at the far-right edge. Separate sky, distant skyline, rooftops/trees, backyard structures, patio floor and edge-only foreground props. Retain the friendly, humorous suburban character of the reference.

Optional animation plan: barbecue smoke, light clothesline movement and gentle foliage movement. These effects are not supplied as animations.

## Layer-export prompt template

Attach the matching complete reference image. Replace the bracketed fields with one entry from that stage's `plannedLayers` in `stages.json`. Request one image per layer rather than a collage:

> Using the attached approved stage concept, generate only the [LAYER NAME] layer containing [LAYER CONTENTS]. Preserve the reference camera, composition, scale, lighting and pixel-art-inspired rendering. Use a full canvas aligned to the 1916 x 821 reference; do not crop to the object's bounds or move it to the centre. Reconstruct content hidden behind nearer objects so those foreground objects can move independently. Include no scenery assigned to other layers, no labels, no characters and no UI. For the backdrop layer use a fully opaque complete backdrop. For every other layer, use actual transparent alpha outside the specified scenery; do not paint a checkerboard or a solid replacement background. Keep the fighting lane clear. Output one PNG image, not an exploded-view diagram, contact sheet or flattened recomposition.

After export, inspect alpha, edge coverage and alignment in the game. Independently generated layers may still need retouching. Extend all layers on a consistent canvas if camera travel requires additional offscreen coverage. Do not claim a stage is parallax-ready until the layers have been composited and tested while the camera moves.
