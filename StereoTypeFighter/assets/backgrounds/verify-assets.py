#!/usr/bin/env python3
"""Validate the seven original background PNGs using only Python's standard library."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import struct
import sys


def main() -> int:
    root = Path(__file__).resolve().parent
    try:
        manifest = json.loads((root / 'stages.json').read_text(encoding='utf-8'))
        records = [manifest['overview']] + [s['composite'] for s in manifest['stages']]
        if len(records) != 7:
            raise ValueError('Expected six stage images and one overview')
        seen: set[str] = set()
        failures = 0
        for item in records:
            relative = item['file']
            if relative in seen:
                raise ValueError(f'Duplicate asset path: {relative}')
            seen.add(relative)
            path = (root / relative).resolve()
            if not path.is_relative_to(root):
                raise ValueError(f'Asset path escapes background directory: {relative}')
            if not path.is_file():
                print(f'MISSING {relative}')
                failures += 1
                continue
            data = path.read_bytes()
            errors = []
            if len(data) != item['bytes']:
                errors.append('byte length mismatch')
            if hashlib.sha256(data).hexdigest() != item['sha256']:
                errors.append('SHA-256 mismatch')
            if len(data) < 33 or data[:8] != b'\x89PNG\r\n\x1a\n' or data[12:16] != b'IHDR':
                errors.append('invalid PNG header')
            elif struct.unpack('>II', data[16:24]) != (item['width'], item['height']):
                errors.append('dimensions mismatch')
            if errors:
                print(f'FAIL {relative}: {", ".join(errors)}')
                failures += 1
            else:
                print(f'OK {relative} ({item["width"]} x {item["height"]})')
        if failures:
            print(f'{failures} of {len(records)} assets are missing or invalid.')
            return 1
        print('All seven original PNGs verified. Separate parallax layers are not included.')
        return 0
    except (OSError, ValueError, KeyError, TypeError, struct.error) as exc:
        print(f'Cannot validate background pack: {exc}', file=sys.stderr)
        return 2


if __name__ == '__main__':
    raise SystemExit(main())
