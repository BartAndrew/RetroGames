#!/usr/bin/env python3
"""Slice a generated animation strip into numbered V7 frames.

Usage: python3 tools/slice-v7-strip.py <strip.png> <frames> <out_dir> [--size 512] [--rows 1]

- Splits the strip into equal columns (and optional rows, read left-to-right, top-to-bottom).
- Scales each cell to fit a SIZExSIZE canvas and bottom-aligns it so the feet sit on the baseline
  (row 470 of 512 by default, matching art/manifest anchor [256, 470]).
- Writes 01.png, 02.png, ... into out_dir.
Background removal is not done here: generate on transparent, or cut out first (e.g. with your image tool or rembg).
"""
import sys, os
from PIL import Image

def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    opts = dict(zip([x for x in sys.argv[1:] if x.startswith('--')], [None] * 9))
    if len(a) < 3:
        print(__doc__); sys.exit(1)
    src, n, out = a[0], int(a[1]), a[2]
    size = 512; rows = 1
    argv = sys.argv[1:]
    if '--size' in argv: size = int(argv[argv.index('--size') + 1])
    if '--rows' in argv: rows = int(argv[argv.index('--rows') + 1])
    baseline = round(size * 470 / 512)
    im = Image.open(src).convert('RGBA')
    cols = -(-n // rows)
    cw, ch = im.width // cols, im.height // rows
    os.makedirs(out, exist_ok=True)
    for i in range(n):
        r, c = divmod(i, cols)
        cell = im.crop((c * cw, r * ch, (c + 1) * cw, (r + 1) * ch))
        s = min((size * 0.96) / cell.width, (baseline * 0.99) / cell.height)
        cell = cell.resize((max(1, round(cell.width * s)), max(1, round(cell.height * s))), Image.LANCZOS)
        canvas = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        canvas.paste(cell, ((size - cell.width) // 2, baseline - cell.height), cell)
        canvas.save(os.path.join(out, f'{i + 1:02d}.png'))
    print(f'wrote {n} frames to {out}')

main()
