#!/bin/sh
# Static Vercel build matching the published GitHub Pages output.
set -eu
python3 -m unittest discover -s tools -p 'test_build_site.py' -v
python3 tools/build_site.py
node --check Midway1942/game.js
node Midway1942/test-smoke.cjs
cd StereoTypeFighter
npm install --no-audit --no-fund
node tools/build-v66-assets.mjs --site ../_site/StereoTypeFighter
node tools/prune-v66-site.mjs --site ../_site/StereoTypeFighter
node tools/verify-v66-assets.mjs --site ../_site/StereoTypeFighter
