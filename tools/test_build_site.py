"""Dependency-free regression tests: python3 -m unittest discover -s tools."""
import tempfile
import unittest
from pathlib import Path
from build_site import Links, local_path, stage, validate

class BuildTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        (self.root / 'arcade').mkdir()
        (self.root / 'arcade/style.css').write_text('body{}')
        (self.root / 'index.html').write_text(
            '<link href="./arcade/style.css"><article class="game-card">'
            '<a data-game-link href="./game/">Play</a></article>')
        (self.root / 'game').mkdir()
        (self.root / 'game/index.html').write_text('<script src="game.js"></script>')
        (self.root / 'game/game.js').write_text('"use strict";')

    def test_validates_and_stages(self):
        page, folders = validate(self.root)
        self.assertEqual(page.card_count, 1)
        self.assertEqual(len(folders), 1)
        (self.root / 'game/archive.zip').write_bytes(b'not for publishing')
        output = stage(self.root)
        self.assertTrue((output / 'game/game.js').is_file())
        self.assertTrue((output / '.nojekyll').is_file())
        self.assertFalse((output / 'game/archive.zip').exists())
        self.assertEqual(stage(self.root), output)

    def test_missing_asset_fails(self):
        (self.root / 'game/game.js').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing game asset'):
            validate(self.root)

    def test_missing_entry_fails(self):
        (self.root / 'game/index.html').unlink()
        with self.assertRaisesRegex(ValueError, 'Missing game entry'):
            validate(self.root)

    def test_path_escape_fails(self):
        with self.assertRaises(ValueError):
            local_path(self.root, '../outside.js', self.root)
        with self.assertRaises(ValueError):
            local_path(self.root, '/game/', self.root)

    def test_external_resources_are_not_local(self):
        self.assertIsNone(local_path(self.root, 'https://example.com/a.js', self.root))
        self.assertIsNone(local_path(self.root, '#games', self.root))

    def test_unlisted_index_fails(self):
        (self.root / 'game/extra').mkdir()
        (self.root / 'game/extra/index.html').write_text('<script src="test.js"></script>')
        with self.assertRaisesRegex(ValueError, 'Unlisted entry'):
            validate(self.root)

    def test_missing_preview_fails(self):
        with (self.root / 'index.html').open('a') as handle:
            handle.write('<img src="missing.svg">')
        with self.assertRaisesRegex(ValueError, 'Missing directory asset'):
            validate(self.root)

    def test_link_parser(self):
        page = Links()
        page.feed('<a data-game-link href="./test/">Play</a><img src="test.svg">')
        self.assertEqual(page.games, ['./test/'])
        self.assertEqual(page.assets, ['test.svg'])

if __name__ == '__main__':
    unittest.main()
