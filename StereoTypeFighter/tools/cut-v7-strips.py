#!/usr/bin/env python3
"""First-cut importer: magenta-keyed strips -> numbered 512x512 frames + manifest entries.

Usage: python3 tools/cut-v7-strips.py <fighter-id> <anim>=<strip.png>:<frames> [...] [--ref-anim idle] [--target 400]

- Keys out the magenta background (soft edge + despill), finds each pose as a connected blob (so uneven spacing,
  jumps and overlapping columns still slice cleanly), and groups blobs into the requested number of frames.
- One uniform scale per fighter (from the reference anim's standing height -> --target px of 512) so every strip matches.
- Each frame is bottom-aligned (lowest pixel = row 470) because the engine moves airborne fighters itself.
  Horizontal anchor is the centre of the feet (lowest 20% of the pose).
- `anim=strip.png:N:A-B` keeps only poses A..B of an N-pose strip, so one strip can feed several anims (e.g. a jump strip).
- Writes art/<id>/<anim>/NN.png and merges the anim into art/manifest.json.
"""
import sys, os, json
import numpy as np
from PIL import Image
from scipy import ndimage as ndi

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SIZE, BASE, AX = 512, 470, 256

def key(path):
    a = np.asarray(Image.open(path).convert('RGB')).astype(np.float32)
    R, G, B = a[..., 0], a[..., 1], a[..., 2]
    d = np.minimum(R, B) - G                     # magenta-ness
    alpha = np.clip(1 - (d - 70) / 110, 0, 1)    # <=70 opaque, >=180 clear
    spill = (d > 15) & (alpha > 0)
    cap = G + 10
    R = np.where(spill, np.minimum(R, cap), R); B = np.where(spill, np.minimum(B, cap), B)
    out = np.dstack([R, G, B, alpha * 255]).clip(0, 255).astype(np.uint8)
    return Image.fromarray(out, 'RGBA')

def poses(im, n):
    """Returns n (box, mask) poses left to right. Each pose owns only its own pixels, so a fist or leg that reaches
    into the neighbouring frame's box never leaks into it."""
    al = np.asarray(im)[..., 3] > 40
    lab, k = ndi.label(ndi.binary_dilation(al, iterations=6))
    items = []
    for i, sl in enumerate(ndi.find_objects(lab)):
        m = (lab == i + 1) & al
        if m.sum() < 400: continue
        ys, xs = np.where(m); items.append(m); 
    items.sort(key=lambda m: np.where(m)[1].mean())
    cx = lambda m: np.where(m)[1].mean()
    while len(items) > n:   # merge fragments (fists, shoes) into the nearest pose
        gaps = [(cx(items[i + 1]) - cx(items[i]), i) for i in range(len(items) - 1)]
        _, i = min(gaps); items[i:i + 2] = [items[i] | items[i + 1]]
    if len(items) < n:      # touching poses merged into one blob: cut at the emptiest column near each equal-width boundary
        cols = al.sum(axis=0); xs = np.where(cols > 0)[0]; x0, x1 = xs.min(), xs.max() + 1; cw = (x1 - x0) / n
        cuts = [x0]
        for k in range(1, n):
            c = x0 + k * cw; lo, hi = int(c - 0.35 * cw), int(c + 0.35 * cw)
            cuts.append(lo + int(np.argmin(cols[lo:hi])))
        cuts.append(x1); items = []
        for a, b in zip(cuts, cuts[1:]):
            m = np.zeros_like(al); m[:, a:b] = al[:, a:b]; items.append(m)
    out = []
    for m in items:
        ys, xs = np.where(m); out.append(([xs.min(), ys.min(), xs.max() + 1, ys.max() + 1], m))
    return out

def feet_x(mask, box):
    sub = mask[box[1]:box[3], box[0]:box[2]]; h = sub.shape[0]
    xs = np.where(sub[int(h * 0.8):].any(axis=0))[0]
    return box[0] + (xs.mean() if len(xs) else (box[2] - box[0]) / 2)

def main():
    argv = sys.argv[1:]
    opt = lambda k, d: argv[argv.index(k) + 1] if k in argv else d
    ref, target = opt('--ref-anim', 'idle'), float(opt('--target', 400))
    pos = [x for i, x in enumerate(argv) if not x.startswith('--') and (i == 0 or not argv[i - 1].startswith('--'))]
    fid, specs = pos[0], pos[1:]
    jobs = {}
    for s in specs:
        name, rest = s.split('=', 1); parts = rest.rsplit(':', 2)
        if len(parts) == 3 and '-' in parts[2]: path, n, rg = parts[0], int(parts[1]), tuple(int(v) for v in parts[2].split('-'))
        else: path, n = rest.rsplit(':', 1); n = int(n); rg = (1, n)
        jobs[name] = (path, n, rg)
    cache = {}
    keyed = {a: cache.setdefault(p, key(p)) for a, (p, n, rg) in jobs.items()}
    blobs = {a: poses(keyed[a], jobs[a][1]) for a in jobs}
    full = blobs
    for a, b in blobs.items():
        if len(b) != jobs[a][1]: print(f'WARNING {a}: found {len(b)} poses, expected {jobs[a][1]}')
    mpath0 = os.path.join(ROOT, 'art', 'manifest.json')
    man0 = json.load(open(mpath0)) if os.path.exists(mpath0) else {}
    saved = (man0.get(fid) or {}).get('importScale')
    if ref in blobs or not saved:
        refb = blobs.get(ref) or next(iter(blobs.values()))
        if ref not in blobs: print(f'note: no {ref} strip given, scaling from the first strip')
        scale = target / float(np.median([b[0][3] - b[0][1] for b in refb]))
    else:
        scale = saved; print(f'using the scale saved from this fighter\'s idle import ({scale:.3f})')
    print(f'{fid}: scale {scale:.3f}')
    mpath = os.path.join(ROOT, 'art', 'manifest.json')
    man = json.load(open(mpath)) if os.path.exists(mpath) else {}
    ent = man.get(fid) or dict(path='art/{id}/{anim}/{n}.png', portrait='art/{id}/portrait.png', anchor=[AX, BASE], scale=0.38, anims={})
    ent.setdefault('anims', {})
    if ref in blobs or not saved: ent['importScale'] = round(float(scale), 4)
    for a, (p, n, rg) in jobs.items():
        im, bs = keyed[a], blobs[a][rg[0] - 1:rg[1]]
        out = os.path.join(ROOT, 'art', fid, a); os.makedirs(out, exist_ok=True)
        for i, (b, mask) in enumerate(bs):
            arr = np.asarray(im).copy(); arr[..., 3] = np.where(mask, arr[..., 3], 0)
            crop = Image.fromarray(arr).crop(tuple(int(v) for v in b))
            w, h = max(1, round(crop.width * scale)), max(1, round(crop.height * scale))
            crop = crop.resize((w, h), Image.LANCZOS)
            cv = Image.new('RGBA', (SIZE, SIZE), (0, 0, 0, 0))
            x = round(AX - (feet_x(mask, b) - b[0]) * scale)
            y = round(BASE - h)
            cv.alpha_composite(crop, (max(0, x), max(0, y))) if x >= 0 and y >= 0 else cv.paste(crop, (x, y), crop)
            cv.save(os.path.join(out, f'{i + 1:02d}.png'))
        spec = {'frames': len(bs)}
        if a not in ('lp', 'lk', 'hp', 'hk', 'launcher', 'sweep', 'airP', 'airK', 'special', 'super'):
            spec['fps'] = {'idle': 7, 'walk': 11, 'dashF': 14}.get(a, 8)
        ent['anims'][a] = spec
        print(f'  {a}: {len(bs)} frames -> art/{fid}/{a}/')
    man[fid] = ent
    json.dump(man, open(mpath, 'w'), indent=2)

main()
