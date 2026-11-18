# StereoType Fighters V8.0 — stable release

**Release:** 18 November 2026  
**Default game:** `/StereoTypeFighter/`  
**Direct entry:** `/StereoTypeFighter/v8.html`  
**Previous build:** `/StereoTypeFighter/v7-2.html`

## V8.0 changes
- Updated the game launch screen, arcade catalogue, HTML metadata, package version and stable release route to **V8.0**.
- Introduced a dedicated `app-v8.js` release entry, exposing `window.SF8` and `window.SF_RELEASE.version` while reusing the tested V7.2 gameplay modules.
- V8.0 direct route retains Gym Bro's locked yellow-kit procedural rig throughout all 31 animation states, matching the default production route.
- Preserved V7, V7.1 and V7.2 pages for comparisons, including their historical loading paths.
- Production asset pruning keeps both V8.0 and historical releases. Release smoke tests cover the default V8 route, the direct V8 route, and historical V7.2.

## Scope and visual-quality boundary
V8.0 is the latest stable **release version**, not a claim that the 120-frame premium Gym Bro art pack or all cinematic illustrations have been approved. V8.0 retains the V7.2 deterministic 60 Hz combat, four-rival story, shared character selection and fighter production workflow. Engine filenames ending in `-v7` are intentional compatibility names.

## Verification
Run `npm run test:unit` and `npm run test:browser:release` in `StereoTypeFighter/`. Confirm `python3 tools/build_site.py`, production pruning and Vercel's production deployment SHA. Do not mark an experimental asset as production approved solely because the V8 launch works.
