# Gym Bro R13 — detached VFX preview for Leg Day Tsunami

The original 12 `super` sprite candidates remain **unapproved**: several merge detached fighter fragments into blast art, and multiple panels clip the body. This patch **does not replace or approve those PNGs**.

To improve preview clarity without changing combat, `renderer-v7.js` has a deterministic, visual-only shockwave overlay drawn behind and in front of Gym Bro's existing safe rig. Activate it with `/StereoTypeFighter/v7-1.html?gymBroSuperFX=1`. It uses frame count/progress exclusively; never `Math.random`, never writes to match state, and never changes the canonical 60 Hz hit schedule (five hits at offsets 0/6/12/18/24), damage, hitboxes or i-frames.

This can be combined with `?gymBroVictory=1` to preview the technically validated four-frame victory action from the same revision. Both remain off by default. Full 12-frame **identity-locked fighter-only** animation, true independent energy/VFX assets, in-game appearance acceptance and full story approval are still required before release.

The poster-style AI graphics previously generated with words such as RELEASED/PUBLISHED are **not release evidence**.
