# Arcade directory QA

## Executed checks

- Eight standard-library builder regression tests passed: staging, ZIP exclusion, missing entry points, missing runtime assets, missing directory images, unlisted entry points, relative-path safety and parsing.
- `node --check arcade/arcade.js` passed.
- Chromium rendered the actual directory HTML, CSS and JavaScript from local files injected into a page. Four cards and nine unique launch links were present.
- Fighting/shooter filters, combined search, version-term search, the empty state, reset, live count and expanded version links passed.
- No JavaScript page errors occurred during the UI checks.
- No horizontal overflow at 320, 375, 390, 768, 1024 and 1440 pixels.
- With JavaScript disabled, all four cards and nine launch links remained present; native version details opened correctly.

## Verification boundaries

HTTP navigation was blocked in the editing environment, and the repository's binary artwork and existing game runtime files were not available locally. Local screenshots therefore assessed layout, not loaded game artwork. Artwork and launch paths were inspected using the GitHub repository; the deployment build validates their existence and each game's immediate HTML script/stylesheet references against a full checkout.

Live game launches, full gameplay, random-button navigation and final production image rendering were not browser-tested in this session. Existing game logic was not modified. The preview cards intentionally use original source artwork rather than claiming to show gameplay screenshots.
