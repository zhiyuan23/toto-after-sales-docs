import datetime as dt
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest
from zoneinfo import ZoneInfo

spec = importlib.util.spec_from_file_location('cleanup', Path(__file__).with_name('cleanup-local-artifacts.py'))
cleanup = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cleanup)


class CleanupTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = Path(self.temp.name)
        self.docs = self.root / 'docs'
        self.backend = self.root / 'backend'
        self.evidence = self.docs / '.local/verification-artifacts'
        self.now = dt.datetime(2026, 10, 23, 20, tzinfo=ZoneInfo('Asia/Shanghai'))

    def tearDown(self):
        self.temp.cleanup()

    def write(self, path, text='data'):
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(text)
        return path

    def test_only_expired_archives_not_active_files_or_backup(self):
        import os
        logs = self.backend / '.local/logs/gaia_saas'
        old = self.write(logs / '2026-09-23.1.all.log.gz')
        os.utime(old, (0, 0))
        self.write(logs / 'all.log')
        self.write(logs / 'backup.sql')
        self.write(logs / '2026-10-23.0.error.log.gz')
        self.assertEqual([p for p, _ in cleanup.candidates(self.docs, self.backend, self.now)], [old])

    def test_keeps_latest_three_successful_releases_and_all_incomplete_evidence(self):
        for day, state in [(1, 'COMPLETE'), (2, 'COMPLETE'), (3, 'COMPLETE'), (4, 'COMPLETE'), (5, 'STARTING')]:
            release = self.evidence / f'deploy-test/2026100{day}120000-12345678'
            self.write(release / 'status.json', json.dumps({'state': state}))
            self.write(release / 'gaia-saas-web.war')
            self.write(release / 'backup.sql')
            self.write(release / 'manifest.json', '{}')
        items = cleanup.candidates(self.docs, self.backend, self.now)
        self.assertEqual([p.name for p, _ in items], ['gaia-saas-web.war'])
        self.assertIn('20261001', str(items[0][0]))

    def test_preview_and_open_directory_are_never_removed(self):
        target = self.write(self.evidence / 'completed/node_modules/data')
        folder = target.parent
        cleanup.execute([(folder, 'done')], False, set())
        self.assertTrue(target.exists())
        report = cleanup.execute([(folder, 'done')], True, {target})
        self.assertEqual(report['items'][0]['status'], 'in-use')
        self.assertTrue(target.exists())
        cleanup.execute([(folder, 'done')], True, set())
        self.assertFalse(folder.exists())

    def test_refuses_traversal_symlink_ancestors_backup_and_source_targets(self):
        self.evidence.mkdir(parents=True)
        (self.evidence / 'link').symlink_to(self.root)
        for path in ['../outside', '/tmp/outside', 'link/node_modules', 'task/backups', 'task/backups/node_modules', 'task/.local/dist', 'task/workspace']:
            with self.subTest(path=path), self.assertRaises(ValueError):
                cleanup.candidates(self.docs, self.backend, self.now, {'version': 1, 'items': [{'path': path, 'reason': 'done', 'evidence': 'document'}]})

    def test_nested_symlink_is_unlinked_without_deleting_its_target(self):
        outside = self.write(self.root / 'protected')
        folder = self.evidence / 'completed/node_modules'
        folder.mkdir(parents=True)
        (folder / 'link').symlink_to(outside)
        cleanup.execute([(folder, 'done')], True, set())
        self.assertTrue(outside.exists())


if __name__ == '__main__':
    unittest.main()
