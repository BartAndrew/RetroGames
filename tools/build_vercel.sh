#!/usr/bin/env bash
# Static build retaining the complete original arcade and the tested new release.
set -Eeuo pipefail
STAGE=runtime
trap 'echo "RetroGames build failed at stage: $STAGE (line $LINENO)" >&2' ERR
node --version
python3 --version
STAGE=midway-simulation
node --check Midway1942/core.js
node --check Midway1942/game.js
node Midway1942/test-smoke.cjs
STAGE=directory-validation
python3 -m unittest discover -s tools -p 'test_build_site.py' -v
python3 tools/build_site.py
STAGE=fighter-dependencies
cd StereoTypeFighter
npm install --no-audit --no-fund
STAGE=fighter-unit-tests
npm run test:layout
npm run test:unit
STAGE=fighter-atlases
node tools/build-v66-assets.mjs --site ../_site/StereoTypeFighter
node tools/prune-v66-site.mjs --site ../_site/StereoTypeFighter
node tools/verify-v66-assets.mjs --site ../_site/StereoTypeFighter
printf '%s\n' 'RetroGames build complete: Midway Evolution and original arcade assets verified.'
