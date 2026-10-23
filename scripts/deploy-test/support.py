"""Standard-library helpers shared by local and remote TOTO test deployment."""
import hashlib
import base64
import io
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
import xml.etree.ElementTree as ET

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
ENTRY_CACHE_DESCRIPTOR = '''<?xml version="1.0" encoding="UTF-8"?>
<web-app xmlns="https://jakarta.ee/xml/ns/jakartaee" version="6.1">
  <filter>
    <filter-name>totoHtmlRevalidation</filter-name>
    <filter-class>org.apache.catalina.filters.ExpiresFilter</filter-class>
    <async-supported>true</async-supported>
    <init-param>
      <param-name>ExpiresByType text/html</param-name>
      <param-value>access plus 0 seconds</param-value>
    </init-param>
  </filter>
  <filter-mapping>
    <filter-name>totoHtmlRevalidation</filter-name>
    <url-pattern>/*</url-pattern>
    <dispatcher>REQUEST</dispatcher>
  </filter-mapping>
</web-app>
'''


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


def strip_embedded_external_credentials(data):
    """Private external credentials must not be reintroduced by runtime-config preservation."""
    secret = re.compile(r'^\s*gaia\.after-sales\.(?:(?:ai|dispatch\.ai|assistant\.ai|completion-audit\.ai)\.api-key|amap\.(?:web-service-key|js-api-key|js-security-code)|external-services\.encryption-key)\s*[:=]')
    return b''.join(line for line in data.splitlines(keepends=True)
                    if not secret.match(line.decode('utf-8', errors='strict')))


AMAP_ROOT_RULE = 'RewriteRule ^/_AMapService(/.*)$ /api/api/afterSales/external-services/_AMapService$1 [L]'

def map_root_ready(tomcat):
    try:
        tree = ET.parse(tomcat / 'conf/server.xml')
        for engine in tree.findall('.//Engine'):
            for host in engine.findall('Host'):
                if not any(v.get('className') == 'org.apache.catalina.valves.rewrite.RewriteValve' for v in host.findall('Valve')):
                    continue
                rules = tomcat / 'conf' / engine.get('name', 'Catalina') / host.get('name', 'localhost') / 'rewrite.config'
                if rules.exists() and AMAP_ROOT_RULE in [line.strip() for line in rules.read_text().splitlines() if not line.lstrip().startswith('#')]:
                    return True
        return False
    except (OSError, ET.ParseError):
        return False


def external_credential_status(text):
    """Read readiness only; never return a private value."""
    def value(name):
        matches = re.findall(r'^[ \t]*' + re.escape(name) + r'[ \t]*=[ \t]*([^\r\n]*)$', text, re.M)
        return matches[-1].strip() if matches else ''
    source_values = re.findall(r'^[ \t]*gaia\.after-sales\.external-services\.credential-source[ \t]*=[ \t]*([^\r\n]*)$', text, re.M)
    source = source_values[-1].strip().upper() if source_values else 'SERVER'
    names = ['gaia.after-sales.ai.api-key', 'gaia.after-sales.amap.web-service-key',
             'gaia.after-sales.amap.js-api-key', 'gaia.after-sales.amap.js-security-code']
    ready = all(value(name) and len(value(name)) <= 512 and not value(name).startswith('${') for name in names)
    return {'externalCredentialSource': source, 'externalServerCredentialsReady': bool(ready)}


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
    external_text = (catalina / 'conf/gaia-after-sales.properties').read_text()
    master = re.findall(r'^\s*gaia\.after-sales\.external-services\.encryption-key\s*=\s*(\S+)', external_text, re.M)
    try:
        encryption_ready = bool(master) and len(base64.b64decode(master[-1], validate=True)) == 32
    except (ValueError, TypeError):
        encryption_ready = False
    return {'pid': pids[0], 'war': digest(web / 'api.war'), 'externalEncryptionReady': encryption_ready, 'mapRootReady': map_root_ready(catalina),
            **external_credential_status(external_text),
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
    # Entry HTML lists preload hints, not every lazy route or dialog chunk.
    for directory in ['assets', 'after-sales/assets']:
        folder = root / directory
        require(not folder.is_symlink(), 'Unexpected asset directory link')
        if not folder.exists():
            continue
        for file in folder.rglob('*'):
            require(not file.is_symlink(), 'Unexpected asset link')
            if file.is_file():
                result[file.relative_to(root).as_posix()] = digest(file)
    return result


def immutable_asset(name):
    return bool(re.search(r'(?:-[A-Za-z0-9_-]{8,}|\.\d{13,})\.[A-Za-z0-9.]+$', name))


def install_entry_cache_policy(root):
    descriptor = root / 'WEB-INF/web.xml'
    require(not descriptor.exists() or descriptor.read_text() == ENTRY_CACHE_DESCRIPTOR,
            'Unexpected ROOT web.xml; review before replacing its configuration')
    descriptor.parent.mkdir(parents=True, exist_ok=True)
    descriptor.write_text(ENTRY_CACHE_DESCRIPTOR)
    return digest(descriptor)


def preserve_hashed_assets(previous, target):
    """Keep immutable chunks used by already-open pages; never copy old entries."""
    retained = {}
    for directory in ['assets', 'after-sales/assets']:
        folder = previous / directory
        require(not folder.is_symlink(), 'Unexpected previous asset directory link')
        if not folder.exists():
            continue
        for file in folder.rglob('*'):
            require(not file.is_symlink(), 'Unexpected previous asset link')
            if not file.is_file() or not immutable_asset(file.name):
                continue
            relative = file.relative_to(previous)
            destination = target / relative
            require(destination.resolve().is_relative_to(target.resolve()) and not destination.is_symlink(), 'Unsafe retained asset')
            value = digest(file)
            if destination.exists():
                require(destination.is_file() and digest(destination) == value, 'Hashed asset collision: ' + relative.as_posix())
                continue
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(file, destination)
            require(digest(destination) == value, 'Retained asset copy mismatch')
            retained[relative.as_posix()] = value
    return retained


def has_after_sales_map_bridge(content):
    # Preserve the public library's upstream defaults; reject domain credential wiring.
    return (b'gaiaAmapWebCredential' in content
            or b'com/ehsure/gaia/afterSales/' in content
            or b'gaia.after-sales.' in content)


def package(war, web, release, api, core):
    manifest = json.loads((release / 'manifest.json').read_text())
    with zipfile.ZipFile(war) as archive:
        require(archive.testzip() is None, 'Invalid WAR')
        for path in CONFIGS[:2]:
            content = archive.read(path)
            require(strip_embedded_external_credentials(content) == content, 'External service credentials remain embedded in WAR configuration')
        tools_name = 'WEB-INF/lib/gaia-sys-tools-core-3.0-SNAPSHOT.jar'
        if tools_name in archive.namelist():
            with zipfile.ZipFile(io.BytesIO(archive.read(tools_name))) as tools:
                map_class = 'com/ehsure/gaia/tools/service/impl/GdMapServiceImpl.class'
                if map_class in tools.namelist():
                    require(not has_after_sales_map_bridge(tools.read(map_class)), 'Shared map dependency contains after-sales credential wiring; restore its upstream implementation before publishing')
        dependencies = {}
        for module, local in [('api', api), ('core', core)]:
            name = 'WEB-INF/lib/gaia-after-sales-' + module + '-3.0-SNAPSHOT.jar'
            value = hashlib.sha256(archive.read(name)).hexdigest()
            require(value == digest(local), 'Stale after-sales dependency: ' + module)
            dependencies[name] = value
        with zipfile.ZipFile(io.BytesIO(archive.read('WEB-INF/lib/gaia-after-sales-core-3.0-SNAPSHOT.jar'))) as domain:
            if 'com/ehsure/gaia/afterSales/external/ExternalSettingsService.class' in domain.namelist():
                require(manifest['remote'].get('externalEncryptionReady') is True, 'External services require a provisioned private encryption master on the target; no application changes performed')
                source = manifest['remote'].get('externalCredentialSource')
                require(source in ('SERVER', 'DATABASE'), 'External credential source must be explicitly valid; no application changes performed')
                if source == 'SERVER':
                    require(manifest['remote'].get('externalServerCredentialsReady') is True, 'Server-managed AI and AMap credentials must be provisioned in private target configuration before publishing')
                # The after-sales JSAPI now connects directly in local/test/demo builds.
                # mapRootReady remains diagnostic for old deployments, not a release prerequisite.
    cache_policy = install_entry_cache_policy(web)
    with tarfile.open(release / 'root-dist.tar.gz', 'w:gz') as tar:
        tar.add(web, arcname='.', filter=lambda info: None if info.issym() or info.islnk() else info)
    shutil.copyfile(war, release / 'gaia-saas-web.war')
    manifest.update({'war': digest(release / 'gaia-saas-web.war'),
                     'web': digest(release / 'root-dist.tar.gz'), 'dependencies': dependencies,
                     'assets': assets(web), 'entryCachePolicy': cache_policy})
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
    require(digest(root / 'WEB-INF/web.xml') == manifest['entryCachePolicy'], 'Staged cache policy mismatch')
    previous_descriptor = web / 'ROOT/WEB-INF/web.xml'
    require(not previous_descriptor.exists() or previous_descriptor.read_text() == ENTRY_CACHE_DESCRIPTOR,
            'Unexpected live ROOT web.xml; review before replacing its configuration')
    manifest['retainedAssets'] = preserve_hashed_assets(web / 'ROOT', root)
    for file in (web / 'ROOT').glob('WW_verify_*.txt'):
        require(file.is_file() and not file.is_symlink(), 'Unexpected verification file link')
        shutil.copy2(file, root / file.name)
    if (web / 'ROOT/.well-known').exists():
        known = web / 'ROOT/.well-known'
        require(known.is_dir() and not known.is_symlink() and not any(p.is_symlink() for p in known.rglob('*')), 'Unexpected well-known links')
        shutil.copytree(web / 'ROOT/.well-known', root / '.well-known')
    replacements = {p: strip_embedded_external_credentials((web / 'api' / p).read_bytes())
                    if p.endswith('.properties') else (web / 'api' / p).read_bytes() for p in CONFIGS}
    manifest['expectedConfigs'] = {p: hashlib.sha256(value).hexdigest() for p, value in replacements.items()}
    with zipfile.ZipFile(release / 'gaia-saas-web.war') as old, zipfile.ZipFile(release / 'api-preserved.war', 'w') as new:
        require(set(CONFIGS).issubset(old.namelist()), 'Missing WAR runtime configuration')
        for info in old.infolist():
            safe_member(info.filename)
            new.writestr(info, replacements.get(info.filename, old.read(info)))
    with zipfile.ZipFile(release / 'api-preserved.war') as archive:
        require(archive.testzip() is None, 'Invalid preserved WAR')
        archive.extractall(api)
    for file, value in {**manifest['dependencies'], **manifest['expectedConfigs']}.items():
        require(digest(api / file) == value, 'Staged dependency or configuration mismatch')
    manifest['liveWar'] = digest(release / 'api-preserved.war')
    save(release / 'manifest.json', manifest)


def verify_live(release, base=BASE):
    manifest = json.loads((release / 'manifest.json').read_text())
    current = probe(base)
    expected = manifest['remote']
    require(current['war'] == manifest['liveWar'] and current['configs'] == manifest.get('expectedConfigs', expected['configs']) and current['externalConfig'] == expected['externalConfig'], 'Published WAR or runtime configuration mismatch')
    web = base / 'tomcat11/webapps'
    require(digest(web / 'ROOT/WEB-INF/web.xml') == manifest['entryCachePolicy'], 'Published cache policy mismatch')
    for file, value in manifest['dependencies'].items():
        require(digest(web / 'api' / file) == value, 'Published dependency mismatch')
    for file, value in {**manifest.get('retainedAssets', {}), **manifest['assets']}.items():
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
            if path in ('', 'index.html', 'after-sales/', 'after-sales/index.html'):
                policy = response.headers.get('Cache-Control', '').lower()
                require(bool(re.search(r'(?:^|,)\s*(?:no-cache|no-store|max-age\s*=\s*0)\s*(?:,|$)', policy)),
                        'HTML entry cache policy missing: ' + path)
            return response.read()
    checked_assets = {**manifest.get('retainedAssets', {}), **manifest['assets']}
    for path, value in checked_assets.items():
        require(hashlib.sha256(get(path)).hexdigest() == value, 'HTTP asset mismatch: ' + path)
    for alias, entry in [('', 'index.html'), ('after-sales/', 'after-sales/index.html')]:
        if entry in manifest['assets']:
            require(hashlib.sha256(get(alias)).hexdigest() == manifest['assets'][entry], 'HTTP welcome entry mismatch: ' + alias)
    result = {'staticFiles': len(checked_assets), 'retainedFiles': len(manifest.get('retainedAssets', {})), 'apis': []}
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
