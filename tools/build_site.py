#!/usr/bin/env python3
"""Validate the arcade's local links and stage every linked game for GitHub Pages.

Uses only Python's standard library. Run from any working directory:
    python3 tools/build_site.py --check
    python3 tools/build_site.py
"""
from __future__ import annotations
import argparse
import shutil
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]

class Links(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.games: list[str] = []
        self.assets: list[str] = []
        self.card_count = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        data = dict(attrs)
        if tag == 'a' and 'data-game-link' in data:
            self.games.append(data.get('href') or '')
        if tag == 'article' and 'game-card' in (data.get('class') or '').split():
            self.card_count += 1
        if tag in {'img', 'script'} and data.get('src'):
            self.assets.append(data['src'])
        if tag == 'link' and data.get('href'):
            self.assets.append(data['href'])

def local_path(base: Path, url: str, root: Path = ROOT) -> Path | None:
    parsed = urlsplit(url)
    if parsed.scheme or parsed.netloc or not parsed.path:
        return None
    if parsed.path.startswith('/'):
        raise ValueError(f'Use a relative URL so project Pages paths work: {url}')
    path = (base / unquote(parsed.path)).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError(f'Link escapes the repository: {url}')
    return path

def validate(root: Path = ROOT) -> tuple[Links, list[Path]]:
    root = root.resolve()
    page = Links()
    page.feed((root / 'index.html').read_text(encoding='utf-8'))
    if not page.games or page.card_count == 0:
        raise ValueError('The directory must contain game cards and launch links.')
    if len(page.games) != len(set(page.games)):
        raise ValueError('Duplicate data-game-link URLs; mark each launch path once.')
    errors: list[str] = []
    roots: set[Path] = set()
    linked_pages: set[Path] = set()
    for url in page.games:
        target = local_path(root, url, root)
        if target is None:
            errors.append(f'Game launch must be a local path: {url}')
            continue
        entry = target / 'index.html' if target.is_dir() else target
        if not entry.is_file():
            errors.append(f'Missing game entry point: {url}')
            continue
        linked_pages.add(entry)
        rel = entry.relative_to(root)
        if len(rel.parts) < 2:
            errors.append(f'Game must have its own directory: {url}')
            continue
        roots.add(root / rel.parts[0])
        child = Links()
        child.feed(entry.read_text(encoding='utf-8'))
        for resource in child.assets:
            asset = local_path(entry.parent, resource, root)
            if asset is not None and not asset.is_file():
                errors.append(f'Missing game asset in {rel}: {resource}')
    for url in page.assets:
        target = local_path(root, url, root)
        if target is not None and not target.is_file():
            errors.append(f'Missing directory asset: {url}')
    # Prevent a playable index page in a staged game folder being forgotten.
    # A page without scripts is not automatically treated as a game.
    for folder in roots:
        for entry in folder.rglob('index.html'):
            if entry in linked_pages:
                continue
            child = Links()
            child.feed(entry.read_text(encoding='utf-8'))
            if any(urlsplit(url).path.endswith(('.js', '.mjs')) for url in child.assets):
                errors.append(f'Unlisted entry point: {entry.relative_to(root)}')
    if errors:
        raise ValueError('\n'.join(errors))
    return page, sorted(roots)

def stage(root: Path = ROOT) -> Path:
    root = root.resolve()
    _, folders = validate(root)
    output = root / '_site'
    if output.exists():
        shutil.rmtree(output)
    output.mkdir()
    shutil.copy2(root / 'index.html', output / 'index.html')
    ignore = shutil.ignore_patterns('*.zip', '__pycache__', '.DS_Store', '.git')
    for folder in [root / 'arcade', *folders]:
        shutil.copytree(folder, output / folder.name, ignore=ignore)
    (output / '.nojekyll').touch()
    return output

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--check', action='store_true', help='Validate without staging.')
    args = parser.parse_args()
    try:
        page, folders = validate()
        print(f'Validated {page.card_count} game cards, {len(page.games)} launch paths, '
              f'and {len(page.assets)} directory assets across {len(folders)} game folders.')
        if not args.check:
            print(f'Staged GitHub Pages site at {stage()}')
    except (OSError, ValueError) as exc:
        parser.exit(1, f'Arcade validation failed:\n{exc}\n')

if __name__ == '__main__':
    main()
