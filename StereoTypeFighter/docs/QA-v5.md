# V5.1 validation - 14 September 2026

## Executed

42 checks passed in headless Chromium using the real source image pixels and the new ES modules in an offline fixture. The fixture embeds PNGs as data URLs and rewrites module imports to Blob URLs; it does not replace the combat implementation. Live Pages network delivery is a separate deployment check.

Coverage: all 18 fighters load; every generated frame has a nonempty image; each fighter can be selected; search filtering; local-match start; keyboard movement, jumping and crouching; pause freezes the clock; punch damage and reduced block damage; special knockdown/get-up; exactly one score per KO; match ends at two wins; return to select; Animation Lab and single-frame stepping; unlimited Practice timer/meter and reset; layouts at 390, 768 and 1024 CSS pixels without horizontal overflow and with Start reachable; no JavaScript exceptions. Desktop screenshots were also inspected at 1440 pixels.

Node syntax checks passed for the production ES modules. All production UI/runtime files and alpha-mask chunks were checked against their uploaded Git blob hashes. Gzip mask data decoded successfully with 42 mapped source poses each for RapThug and Grunge.

## Not claimed

This is not exhaustive gameplay balancing, every browser/device combination, physical keyboard rollover testing or a guarantee that every AI-generated source pose is perfectly consistent. Several source actions contain very few poses; Lefty/Agenda still lack bespoke movement cycles. Specials share their core range/damage implementation. The offline checks do not establish that a GitHub Pages deployment has finished.

## Reproduce

Run `tools/qa_v5.py` as described in the README. For HTTP validation use the `?test` flag; it exposes test controls only on that explicit URL. Normal play exposes only the read-only `window.SF` diagnostics.

Use Animation Lab to review individual moves before changing panel counts, source rectangles or sequence orders. For textured-sheet masks, export rectangles with `--extract`, then use `tools/build_mattes_v5.py` with that output directory. Do not replace complete source sheets or use another character's generic crop map.
