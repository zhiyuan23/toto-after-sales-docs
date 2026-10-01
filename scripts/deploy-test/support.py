"""Standard-library helpers shared by local and remote TOTO test deployment."""
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import shutil
import subprocess
import sys
import tarfile
import time
from urllib.parse import urljoin, urlparse, unquote
from urllib.request import build_opener, ProxyHandler, Request
import zipfile

BASE = Path('/yundata/saas_test')
CONFIGS = [
    'WEB-INF/classes/application.properties',
    'WEB-INF/classes/config/application.properties',
    'WEB-INF/classes/config/spring-core.xml',
    'WEB-INF/classes/config/spring-mybatis.xml',
    'WEB-INF/classes/logback-spring.xml',
]
PUBLIC = ['/api/afterSales/mobile/consumer/privacy-policy',
          '/api/afterSales/mobile/consumer/agreements/TERMS',
          '/api/afterSales/mobile/consumer/support-channels']
PRIVATE = ['/api/afterSales/authorization', '/api/afterSales/mobile/consumer/products',
           '/api/afterSales/customer/work-orders']


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def require(condition, message):
    if not condition:
        raise ValueError(message)


def save(path, value):
    path = Path(path)
    temporary = path.with_suffix('.tmp')
    temporary.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    temporary.chmod(0o600)
    temporary.replace(path)


def probe(base=BASE):
    catalina = base / 'tomcat11'
    web = catalina / 'webapps'
    paths = [web / 'api.war', web / 'api', web / 'ROOT']
    require(all(p.exists() and not p.is_symlink() for p in paths), 'Unexpected application layout')
    args = subprocess.check_output(['ps', '-eo', 'pid=,user=,args='], text=True)
    pids = []
    for line in args.splitlines():
        fields = line.split(None, 2)
        if len(fields) != 3:
            continue
        pid, user, command = fields
        if re.search(r'(?:^|\s)-Dcatalina.base=' + re.escape(str(catalina)) + r'(?:\s|$)', command) and 'org.apache.catalina.startup.Bootstrap start' in command:
            require(user == 'root', 'Unexpected Tomcat process owner')
            pids.append(int(pid))
    require(len(pids) == 1, 'Expected exactly one target Tomcat')
    properties = '\n'.join((web / 'api' / p).read_text() for p in CONFIGS[:2])
    urls = re.findall(r'^\s*spring.datasource.url\s*=\s*(\S+)', properties, re.M)
    require(urls and all(re.match(r'jdbc:mysql://10\.1\.1\.106(?::3306)?/gaia_wh_init_wzy(?:\?|$)', u) for u in urls), 'Unexpected test database')
    tenants = re.findall(r'^\s*gaia.multi-tenant\s*=\s*(\S+)', properties, re.M)
    require(tenants and all(t == 'false' for t in tenants), 'Unexpected tenant mode')
    require(shutil.disk_usage(base).free > 2 * 1024 ** 3, 'Insufficient backup space')
    return {'pid': pids[0], 'war': digest(web / 'api.war'),
            'externalConfig': digest(catalina / 'conf/gaia-after-sales.properties'),
            'configs': {p: digest(web / 'api' / p) for p in CONFIGS},
            'indexes': {p: digest(web / 'ROOT' / p) for p in ['index.html', 'after-sales/index.html']}}


def unchanged(expected, actual):
    require(expected == actual, 'Target process, application or configuration changed; run a new preflight')


def safe_member(name):
    path = PurePosixPath(name)
    require(not path.is_absolute() and '..' not in path.parts and '\\' not in name, 'Unsafe archive member')
    return path


def extract_web(archive, target):
    with tarfile.open(archive) as tar:
        for item in tar.getmembers():
            path = target / safe_member(item.name)
            require(item.isdir() or item.isfile(), 'Archive links and special files are forbidden')
            if item.isdir():
                path.mkdir(parents=True, exist_ok=True)
            else:
                path.parent.mkdir(parents=True, exist_ok=True)
                with tar.extractfile(item) as source, path.open('wb') as destination:
                    shutil.copyfileobj(source, destination)


def assets(root):
    result = {}
    for entry in ['index.html', 'after-sales/index.html']:
        page = root / entry
        require(page.is_file(), 'Missing Web entry: ' + entry)
        result[entry] = digest(page)
        for ref in re.findall(r'(?:src|href)=["\']([^"\']+)', page.read_text()):
            if re.match(r'^(https?:|data:|#)', ref):
                continue
            relative = unquote(urlparse(urljoin('http://test/' + entry, ref)).path.lstrip('/'))
            safe_member(relative)
            require(entry != 'after-sales/index.html' or relative.startswith('after-sales/'), 'Subsystem asset escapes its base')
            file = root / relative
            require(file.resolve().is_relative_to(root.resolve()) and file.is_file() and not file.is_symlink(), 'Missing or unsafe Web asset: ' + relative)
            result[relative] = digest(file)
    require(any(p.startswith('after-sales/assets/') for p in result), 'Missing subsystem assets')
    return result


def package(war, web, release, api, core):
    manifest = json.loads((release / 'manifest.json').read_text())
    with zipfile.ZipFile(war) as archive:
        require(archive.testzip() is None, 'Invalid WAR')
        dependencies = {}
        for module, local in [('api', api), ('core', core)]:
            name = 'WEB-INF/lib/gaia-after-sales-' + module + '-3.0-SNAPSHOT.jar'
            value = hashlib.sha256(archive.read(name)).hexdigest()
            require(value == digest(local), 'Stale after-sales dependency: ' + module)
            dependencies[name] = value
    with tarfile.open(release / 'root-dist.tar.gz', 'w:gz') as tar:
        tar.add(web, arcname='.', filter=lambda info: None if info.issym() or info.islnk() else info)
    shutil.copyfile(war, release / 'gaia-saas-web.war')
    manifest.update({'war': digest(release / 'gaia-saas-web.war'),
                     'web': digest(release / 'root-dist.tar.gz'), 'dependencies': dependencies,
                     'assets': assets(web)})
    save(release / 'manifest.json', manifest)


def stage(release, base=BASE):
    manifest = json.loads((release / 'manifest.json').read_text())
    unchanged(manifest['remote'], probe(base))
    require(digest(release / 'gaia-saas-web.war') == manifest['war'], 'Uploaded WAR mismatch')
    require(digest(release / 'root-dist.tar.gz') == manifest['web'], 'Uploaded Web mismatch')
    web = base / 'tomcat11/webapps'
    root = release / 'root-ready'
    api = release / 'api-ready'
    root.mkdir()
    api.mkdir()
    extract_web(release / 'root-dist.tar.gz', root)
    require(assets(root) == manifest['assets'], 'Staged Web mismatch')
    for file in (web / 'ROOT').glob('WW_verify_*.txt'):
        require(file.is_file() and not file.is_symlink(), 'Unexpected verification file link')
        shutil.copy2(file, root / file.name)
    if (web / 'ROOT/.well-known').exists():
        known = web / 'ROOT/.well-known'
        require(known.is_dir() and not known.is_symlink() and not any(p.is_symlink() for p in known.rglob('*')), 'Unexpected well-known links')
        shutil.copytree(web / 'ROOT/.well-known', root / '.well-known')
    replacements = {p: (web / 'api' / p).read_bytes() for p in CONFIGS}
    with zipfile.ZipFile(release / 'gaia-saas-web.war') as old, zipfile.ZipFile(release / 'api-preserved.war', 'w') as new:
        require(set(CONFIGS).issubset(old.namelist()), 'Missing WAR runtime configuration')
        for info in old.infolist():
            safe_member(info.filename)
            new.writestr(info, replacements.get(info.filename, old.read(info)))
    with zipfile.ZipFile(release / 'api-preserved.war') as archive:
        require(archive.testzip() is None, 'Invalid preserved WAR')
        archive.extractall(api)
    for file, value in {**manifest['dependencies'], **manifest['remote']['configs']}.items():
        require(digest(api / file) == value, 'Staged dependency or configuration mismatch')
    manifest['liveWar'] = digest(release / 'api-preserved.war')
    save(release / 'manifest.json', manifest)


def verify_live(release, base=BASE):
    manifest = json.loads((release / 'manifest.json').read_text())
    current = probe(base)
    expected = manifest['remote']
    require(current['war'] == manifest['liveWar'] and current['configs'] == expected['configs'] and current['externalConfig'] == expected['externalConfig'], 'Published WAR or runtime configuration mismatch')
    web = base / 'tomcat11/webapps'
    for file, value in manifest['dependencies'].items():
        require(digest(web / 'api' / file) == value, 'Published dependency mismatch')
    for file, value in manifest['assets'].items():
        require(digest(web / 'ROOT' / file) == value, 'Published Web mismatch')
    backup = base / 'backups' / release.name
    for file in (backup / 'ROOT').glob('WW_verify_*.txt'):
        require(digest(file) == digest(web / 'ROOT' / file.name), 'Verification file changed')
    if (backup / 'ROOT/.well-known').exists():
        for file in (backup / 'ROOT/.well-known').rglob('*'):
            if file.is_file():
                require(digest(file) == digest(web / 'ROOT' / file.relative_to(backup / 'ROOT')), 'Well-known file changed')
    return {'pid': current['pid'], 'war': current['war'], 'configsPreserved': len(CONFIGS)}


def verify_backup(release, base=BASE):
    expected = json.loads((release / 'manifest.json').read_text())['remote']
    backup = base / 'backups' / release.name
    require(digest(backup / 'api.war') == expected['war'], 'Backup WAR mismatch')
    require(digest(backup / 'gaia-after-sales.properties') == expected['externalConfig'], 'Backup external configuration mismatch')
    for file, value in expected['configs'].items():
        require(digest(backup / 'api' / file) == value, 'Backup runtime configuration mismatch')
    for file, value in expected['indexes'].items():
        require(digest(backup / 'ROOT' / file) == value, 'Backup Web entry mismatch')


def http(manifest, base_url):
    # Company LAN endpoints must be checked directly, independent of desktop proxy settings.
    opener = build_opener(ProxyHandler({}))
    def get(path):
        with opener.open(Request(base_url.rstrip('/') + '/' + path.lstrip('/'), headers={'Cache-Control': 'no-cache'}), timeout=15) as response:
            require(response.status == 200, 'Unexpected HTTP status: ' + path)
            return response.read()
    for path, value in manifest['assets'].items():
        require(hashlib.sha256(get(path)).hexdigest() == value, 'HTTP asset mismatch: ' + path)
    result = {'staticFiles': len(manifest['assets']), 'apis': []}
    for path in PUBLIC + PRIVATE:
        data = json.loads(get(path))
        code = data.get('code')
        require(code == 0 if path in PUBLIC else code not in (0, None) and not data.get('data'), 'Unexpected API authorization: ' + path)
        result['apis'].append({'path': path, 'code': code})
    return result


def wait_http(seconds, base_url):
    opener = build_opener(ProxyHandler({}))
    deadline = time.monotonic() + seconds
    while time.monotonic() < deadline:
        try:
            with opener.open(base_url + PUBLIC[0], timeout=3) as response:
                if response.status == 200 and json.loads(response.read()).get('code') == 0:
                    return
        except Exception:
            pass
        time.sleep(3)
    raise ValueError('Backend startup timed out')


def main():
    os.umask(0o077)
    require(sys.version_info >= (3, 9), 'Python 3.9+ is required')
    action, *args = sys.argv[1:]
    if action == 'probe':
        require(shutil.which('bash') and shutil.which('flock'), 'Server Bash and flock are required')
        print(json.dumps(probe()))
    elif action == 'package':
        package(*(Path(p) for p in args))
    elif action == 'stage':
        stage(Path(args[0]))
    elif action == 'unchanged':
        unchanged(json.loads(Path(args[0]).read_text())['remote'], probe())
    elif action == 'verify-live':
        print(json.dumps(verify_live(Path(args[0]))))
    elif action == 'verify-backup':
        verify_backup(Path(args[0]))
    elif action == 'http':
        manifest = json.loads(Path(args[0]).read_text())
        result = http(manifest, args[1])
        save(Path(args[0]).with_name('http-verification.json'), result)
        print(json.dumps(result))
    elif action == 'wait-http':
        wait_http(int(args[0]), args[1])
    elif action == 'status':
        release, state = args[:2]
        save(Path(release) / 'status.json', {'state': state, 'updatedAt': time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime()), 'release': Path(release).name, 'details': args[2:]})
    else:
        raise ValueError('Unknown deployment helper command')


if __name__ == '__main__':
    try:
        main()
    except Exception as error:
        # Avoid exception values from XML, properties, HTTP bodies or credentials.
        print('DEPLOY_HELPER_FAILED: ' + (str(error) if isinstance(error, ValueError) else type(error).__name__), file=sys.stderr)
        sys.exit(1)
