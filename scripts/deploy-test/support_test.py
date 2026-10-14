"""Isolated deployment tests: no network, production paths, credentials or real JVMs."""
import importlib.util
import io
import json
from pathlib import Path
import shutil
import subprocess
import sys
import tarfile
import tempfile
import unittest
from unittest.mock import patch
import zipfile

sys.dont_write_bytecode = True
spec = importlib.util.spec_from_file_location('deployment', Path(__file__).with_name('support.py'))
deploy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(deploy)


class DeploymentTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.base = Path(self.temp.name)
        self.web = self.base / 'tomcat11/webapps'
        self.release = self.base / 'packages/20261001180000-aabbccdd'
        self.release.mkdir(parents=True)
        self.props = b'spring.datasource.url=jdbc:mysql://10.1.1.106:3306/gaia_wh_init_wzy\ngaia.multi-tenant=false\nprivate.fixture=keep-old\n'
        for file in deploy.CONFIGS:
            target = self.web / 'api' / file
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(self.props if file.endswith('application.properties') else b'old runtime')
        self.external = self.base / 'tomcat11/conf/gaia-after-sales.properties'
        self.external.parent.mkdir(parents=True)
        self.external.write_text('private fixture config')
        self.old = self.web / 'ROOT'
        (self.old / 'after-sales').mkdir(parents=True)
        (self.old / 'index.html').write_text('old main')
        (self.old / 'after-sales/index.html').write_text('old child')
        (self.old / 'WW_verify_fixture.txt').write_text('preserve verification')
        (self.web / 'api.war').write_bytes(b'old war')
        self.new = self.base / 'new-web'
        (self.new / 'after-sales/assets').mkdir(parents=True)
        (self.new / 'index.html').write_text('<script src="./main.js"></script>')
        (self.new / 'main.js').write_text('main')
        (self.new / 'after-sales/index.html').write_text('<script src="/after-sales/assets/app.js"></script>')
        (self.new / 'after-sales/assets/app.js').write_text('child')
        self.ps = patch.object(deploy.subprocess, 'check_output', return_value=f'123 root java -Dcatalina.base={self.base}/tomcat11 org.apache.catalina.startup.Bootstrap start\n')
        self.ps.start()
        self.disk = patch.object(deploy.shutil, 'disk_usage', return_value=shutil._ntuple_diskusage(10**11, 0, 10**11))
        self.disk.start()

    def tearDown(self):
        self.ps.stop()
        self.disk.stop()
        self.temp.cleanup()

    def prepare(self):
        original = deploy.probe(self.base)
        deploy.save(self.release / 'manifest.json', {'remote': original})
        war = self.base / 'new.war'
        with zipfile.ZipFile(war, 'w') as archive:
            for file in deploy.CONFIGS:
                archive.writestr(file, b'wrong local config')
            for module in ['api', 'core']:
                buffer = io.BytesIO()
                with zipfile.ZipFile(buffer, 'w') as dependency:
                    dependency.writestr('fixture.txt', module.encode())
                archive.writestr(f'WEB-INF/lib/gaia-after-sales-{module}-3.0-SNAPSHOT.jar', buffer.getvalue())
                (self.base / (module + '.jar')).write_bytes(buffer.getvalue())
        deploy.package(war, self.new, self.release, self.base / 'api.jar', self.base / 'core.jar')
        return original

    def test_external_source_defaults_to_server_and_readiness_never_returns_secrets(self):
        properties = '\n'.join(name + '=private-fixture' for name in [
            'gaia.after-sales.ai.api-key', 'gaia.after-sales.amap.web-service-key',
            'gaia.after-sales.amap.js-api-key', 'gaia.after-sales.amap.js-security-code'])
        result = deploy.external_credential_status(properties)
        self.assertEqual(result, {'externalCredentialSource': 'SERVER', 'externalServerCredentialsReady': True})
        self.assertNotIn('private-fixture', json.dumps(result))
        self.assertFalse(deploy.external_credential_status(properties.replace('gaia.after-sales.ai.api-key=private-fixture', 'gaia.after-sales.ai.api-key='))['externalServerCredentialsReady'])
        self.assertFalse(deploy.external_credential_status(properties.replace('gaia.after-sales.ai.api-key=private-fixture', 'gaia.after-sales.dispatch.ai.api-key=private-fixture'))['externalServerCredentialsReady'])
        self.assertEqual(deploy.external_credential_status('gaia.after-sales.external-services.credential-source=DATABASE')['externalCredentialSource'], 'DATABASE')
        self.assertEqual(deploy.external_credential_status('gaia.after-sales.external-services.credential-source=')['externalCredentialSource'], '')

    def test_external_package_rejects_missing_server_credentials_and_invalid_source(self):
        import base64
        self.external.write_text('gaia.after-sales.external-services.encryption-key=' + base64.b64encode(bytes(32)).decode())
        original = deploy.probe(self.base)
        original['mapRootReady'] = True
        deploy.save(self.release / 'manifest.json', {'remote': original})
        core = self.base / 'core.jar'
        with zipfile.ZipFile(core, 'w') as domain:
            domain.writestr('com/ehsure/gaia/afterSales/external/ExternalSettingsService.class', b'fixture')
        api = self.base / 'api.jar'; api.write_bytes(b'api')
        war = self.base / 'new.war'
        with zipfile.ZipFile(war, 'w') as archive:
            for file in deploy.CONFIGS: archive.writestr(file, b'fixture config')
            archive.writestr('WEB-INF/lib/gaia-after-sales-core-3.0-SNAPSHOT.jar', core.read_bytes())
            archive.writestr('WEB-INF/lib/gaia-after-sales-api-3.0-SNAPSHOT.jar', api.read_bytes())
        with self.assertRaisesRegex(ValueError, 'Server-managed'):
            deploy.package(war, self.new, self.release, api, core)
        original['externalCredentialSource'] = 'TYPO'
        deploy.save(self.release / 'manifest.json', {'remote': original})
        with self.assertRaisesRegex(ValueError, 'source'):
            deploy.package(war, self.new, self.release, api, core)
        original['externalCredentialSource'] = 'DATABASE'
        deploy.save(self.release / 'manifest.json', {'remote': original})
        deploy.package(war, self.new, self.release, api, core)

    def test_staging_preserves_configs_checks_dependencies_and_keeps_live_files_untouched(self):
        original = self.prepare()
        deploy.stage(self.release, self.base)
        self.assertEqual(deploy.probe(self.base), original)
        for file in deploy.CONFIGS:
            self.assertEqual((self.release / 'api-ready' / file).read_bytes(), (self.web / 'api' / file).read_bytes())
        self.assertEqual((self.release / 'root-ready/WW_verify_fixture.txt').read_text(), 'preserve verification')
        with zipfile.ZipFile(self.release / 'api-preserved.war') as archive:
            self.assertEqual(archive.read(deploy.CONFIGS[0]), self.props)

    def test_corrupt_upload_and_concurrent_server_config_change_block_staging(self):
        self.prepare()
        self.external.write_text('concurrent change')
        with self.assertRaisesRegex(ValueError, 'changed'):
            deploy.stage(self.release, self.base)
        self.external.write_text('private fixture config')
        (self.release / 'gaia-saas-web.war').write_bytes(b'corrupt upload')
        with self.assertRaisesRegex(ValueError, 'WAR mismatch'):
            deploy.stage(self.release, self.base)
        self.assertEqual((self.web / 'api.war').read_bytes(), b'old war')

    def test_wrong_database_or_multiple_processes_are_rejected(self):
        (self.web / 'api' / deploy.CONFIGS[0]).write_text('spring.datasource.url=jdbc:mysql://production/db\ngaia.multi-tenant=false')
        with self.assertRaisesRegex(ValueError, 'database'):
            deploy.probe(self.base)
        (self.web / 'api' / deploy.CONFIGS[0]).write_bytes(self.props)
        with patch.object(deploy.subprocess, 'check_output', return_value=''):
            with self.assertRaisesRegex(ValueError, 'one target Tomcat'):
                deploy.probe(self.base)

    def test_archive_traversal_and_links_are_rejected(self):
        for name, kind in [('../escape', tarfile.REGTYPE), ('link', tarfile.SYMTYPE)]:
            archive = self.base / 'unsafe.tar.gz'
            with tarfile.open(archive, 'w:gz') as tar:
                item = tarfile.TarInfo(name)
                item.type = kind
                item.linkname = '/tmp/outside'
                item.size = 1 if kind == tarfile.REGTYPE else 0
                tar.addfile(item, io.BytesIO(b'x') if item.size else None)
            with self.assertRaises(ValueError):
                deploy.extract_web(archive, self.base / 'extraction')
        self.assertFalse((self.base.parent / 'escape').exists())

    def test_full_backup_and_live_checks_reject_corruption(self):
        self.prepare()
        deploy.stage(self.release, self.base)
        backup = self.base / 'backups' / self.release.name
        backup.mkdir(parents=True)
        for file in ['api', 'ROOT']:
            shutil.copytree(self.web / file, backup / file)
        shutil.copy2(self.web / 'api.war', backup / 'api.war')
        shutil.copy2(self.external, backup / 'gaia-after-sales.properties')
        deploy.verify_backup(self.release, self.base)
        for file, ready in [('api', 'api-ready'), ('ROOT', 'root-ready')]:
            shutil.rmtree(self.web / file)
            shutil.copytree(self.release / ready, self.web / file)
        shutil.copy2(self.release / 'api-preserved.war', self.web / 'api.war')
        self.assertEqual(deploy.verify_live(self.release, self.base)['configsPreserved'], 5)
        (self.web / 'api' / deploy.CONFIGS[0]).write_bytes(b'config corrupted')
        with self.assertRaises(ValueError):
            deploy.verify_live(self.release, self.base)
        (backup / 'api.war').write_bytes(b'corrupt backup')
        with self.assertRaisesRegex(ValueError, 'Backup WAR mismatch'):
            deploy.verify_backup(self.release, self.base)

    def run_remote_fixture(self, fail_phase):
        # Exercise the actual shell transaction against temporary application paths.
        # Process termination and the Linux flock utility are replaced locally;
        # no real service is stopped and /yundata is never touched.
        (self.base / 'backups').mkdir()
        scripts = self.base / 'fixture-bin'
        scripts.mkdir()
        flock = scripts / 'flock'
        flock.write_text('#!/bin/sh\nexit 0\n')
        flock.chmod(0o700)
        process = scripts / 'ps'
        process.write_text(f'#!/bin/sh\necho "123 java -Dcatalina.base={self.base}/tomcat11 org.apache.catalina.startup.Bootstrap start"\n')
        process.chmod(0o700)
        helper = self.release / 'support.py'
        helper.write_text('''import json,sys
from pathlib import Path
action,*args=sys.argv[1:]
release=Path(__file__).parent
if action=='status':
 (release/'status.json').write_text(json.dumps({'state':args[1]}))
elif action=='stage':
 if FAIL_PHASE=='stage':sys.exit(1)
 for directory in ['api-ready','root-ready']:
  (release/directory).mkdir()
  (release/directory/'marker').write_text('new application')
 (release/'api-preserved.war').write_bytes(b'new war')
elif action=='wait-http':
 count=release/'starts'
 calls=int(count.read_text())+1 if count.exists() else 1
 count.write_text(str(calls))
 if FAIL_PHASE=='startup' and calls==1:sys.exit(1)
'''.replace('FAIL_PHASE', repr(fail_phase)))
        startup = self.base / 'tomcat11/bin/startup.sh'
        startup.parent.mkdir(parents=True)
        startup.write_text('#!/bin/sh\n[ ! -e /dev/fd/9 ] || exit 99\nexit 0\n')
        startup.chmod(0o700)
        for directory in ['api', 'ROOT']:
            (self.web / directory / 'marker').write_text('old application')
        script = Path(__file__).with_name('remote.sh').read_text()
        script = script.replace('BASE=/yundata/saas_test', 'BASE=' + str(self.base))
        script = script.replace(r'\/yundata\/saas_test\/tomcat11', str(self.base / 'tomcat11').replace('/', r'\/'))
        begin, end = script.index('stop_process() {'), script.index('restart() {')
        script = script[:begin] + 'stop_process() { return 0; }\n' + script[end:]
        remote = self.base / 'remote-fixture.sh'
        remote.write_text(script)
        import os
        env = {**os.environ, 'PATH': str(scripts) + ':' + os.environ['PATH']}
        return subprocess.run(['bash', str(remote), self.release.name], env=env, stdout=subprocess.PIPE, stderr=subprocess.PIPE, timeout=10)

    def test_remote_staging_failure_never_replaces_live_application(self):
        result = self.run_remote_fixture('stage')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(json.loads((self.release / 'status.json').read_text())['state'], 'FAILED')
        self.assertEqual((self.web / 'api.war').read_bytes(), b'old war')
        self.assertEqual((self.web / 'ROOT/marker').read_text(), 'old application')

    def test_remote_failed_restart_restores_both_apps_and_war_then_records_rollback(self):
        result = self.run_remote_fixture('startup')
        self.assertNotEqual(result.returncode, 0)
        self.assertEqual(json.loads((self.release / 'status.json').read_text())['state'], 'ROLLED_BACK', result.stderr.decode())
        self.assertEqual((self.web / 'api.war').read_bytes(), b'old war')
        self.assertEqual((self.web / 'api/marker').read_text(), 'old application')
        self.assertEqual((self.web / 'ROOT/marker').read_text(), 'old application')
        self.assertEqual(self.external.read_text(), 'private fixture config')


if __name__ == '__main__':
    unittest.main()
