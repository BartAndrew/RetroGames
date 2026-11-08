# Stereotype Fighters — Build 12 playtest hub

The public playtest landing page is at `/StereoTypeFighter/build-12/`.

**Status: landing page published; Build 12 playable or downloadable package not supplied.**
Do not label V6.8 or any existing browser build as Build 12.

When the verified Build 12 package becomes available:

1. Confirm its platform and version, obtain release notes and a checksum.
2. For a browser build, publish its complete runtime under `StereoTypeFighter/build-12/play/`, ensure all asset paths work under the site's subdirectory, and add an explicit `data-game-link` launch link to the arcade directory if it should count as a separately playable build.
3. For a Windows Unreal package, publish a ZIP via a GitHub release (or other verified distribution) and link its asset on the landing page. A Windows Unreal executable cannot run merely by embedding it in HTML.
4. Update `StereoTypeFighter/tools/prune-v66-site.mjs` if additional Build 12 browser files must survive GitHub Pages production pruning.
5. Update the page's status, remove the unavailable message, document actual controls/platforms and keep the existing V6.8 comparison link.
6. Run both the Vercel build and GitHub Pages validation, then smoke-test the final public URL and feedback flow.

Feedback currently links to a pre-filled GitHub Issue. No Build 12 binaries or executables are stored in this folder.
