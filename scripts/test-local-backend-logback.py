#!/usr/bin/env python3
"""Use the existing host artifact's logging dependencies; create no Maven project or repository output."""
from pathlib import Path
import shutil
import subprocess
import tempfile
import zipfile

scripts = Path(__file__).resolve().parent
host = scripts.parents[2] / 'backend/gaia-saas-proj/gaia-saas-web-jar/target/gaia-web.jar'
with tempfile.TemporaryDirectory(prefix='toto-logback-test-') as directory:
    root = Path(directory)
    with zipfile.ZipFile(host) as jar:
        for name in jar.namelist():
            if name.startswith('BOOT-INF/lib/') and Path(name).name.startswith(('spring-boot-', 'spring-core-', 'spring-jcl-', 'logback-', 'slf4j-api-')):
                (root / Path(name).name).write_bytes(jar.read(name))
    java = subprocess.check_output(['/usr/libexec/java_home', '-v', '21'], text=True).strip() + '/bin/java' if Path('/usr/libexec/java_home').exists() else shutil.which('java')
    subprocess.run([java, '--class-path', str(root / '*'), str(scripts / 'LocalBackendLogbackTest.java'),
                    str(scripts / 'local-backend-logback.xml'), str(root / 'logs')], check=True)
