#!/usr/bin/env python3
"""Preview by default. Only known expired logs and redundant completed build outputs are eligible."""
import argparse
import datetime as dt
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
from zoneinfo import ZoneInfo

DOCS = Path(__file__).resolve().parent.parent
WORKSPACE = DOCS.parent.parent
DAY = 86400
RELEASE = re.compile(r'^\d{14}-[a-f0-9]{8}$')
ARCHIVE = re.compile(r'^(?P<date>\d{4}-\d{2}-\d{2})\.\d+\.(all|error|after-sales)\.log(?:\.gz|\d+\.tmp)$|^console\.log\.(?P<console>\d{4}-\d{2}-\d{2})\.\d+\.gz$')
DISPOSABLE = {'node_modules', 'target', 'dist', '.vite', 'cold-store', 'cold-store-fixed'}


def safe_child(root, relative):
    """Refuse traversal and symlink ancestors; rmtree itself never follows nested symlinks."""
    root = root.resolve()
    rel = Path(relative)
    if rel.is_absolute() or not rel.parts or any(x in {'.', '..'} for x in rel.parts):
        raise ValueError('清理路径必须是根目录内的明确相对路径')
    path = root
    for part in rel.parts:
        path = path / part
        if path.is_symlink():
            raise ValueError(f'拒绝符号链接路径：{relative}')
    if not path.is_relative_to(root) or path == root:
        raise ValueError('清理路径越界')
    return path


def size_bytes(path):
    if path.is_file():
        return path.stat().st_size
    return sum(p.stat().st_size for p in path.rglob('*') if p.is_file() and not p.is_symlink())


def candidates(docs, backend, now, manifest=None):
    result = []
    logs = backend / '.local/logs'
    cutoff = now.timestamp() - 7 * DAY
    if logs.is_dir() and not logs.is_symlink():
        # Only the root and the known application directory; never arbitrary repository trees.
        for folder in [logs, logs / 'gaia_saas']:
            if not folder.is_dir() or folder.is_symlink():
                continue
            for p in folder.iterdir():
                if not p.is_file() or p.is_symlink():
                    continue
                match = ARCHIVE.fullmatch(p.name)
                expired = False
                if match:
                    date = dt.datetime.strptime(match['date'] or match['console'], '%Y-%m-%d').replace(tzinfo=now.tzinfo)
                    expired = max(date.timestamp(), p.stat().st_mtime) < cutoff
                elif p.name == 'shared-backend.log':
                    expired = p.stat().st_mtime < cutoff
                if expired:
                    result.append((p, '超过7天的历史应用日志／废弃收集日志'))

    evidence = docs / '.local/verification-artifacts'
    releases = evidence / 'deploy-test'
    complete = []
    if releases.is_dir() and not releases.is_symlink():
        for p in releases.iterdir():
            if not p.is_dir() or p.is_symlink() or not RELEASE.fullmatch(p.name):
                continue
            try:
                if json.loads((p / 'status.json').read_text())['state'] == 'COMPLETE':
                    complete.append(p)
            except (OSError, ValueError, KeyError, TypeError):
                continue
        for p in sorted(complete, reverse=True)[3:]:
            started = dt.datetime.strptime(p.name[:14], '%Y%m%d%H%M%S').replace(tzinfo=ZoneInfo('Asia/Shanghai'))
            if started.timestamp() >= cutoff:
                continue
            # Never remove release directories, manifests, status, configs, backups, or reports.
            for name in ['gaia-saas-web.war', 'root-dist.tar.gz', 'root-dist.tar']:
                f = safe_child(evidence, str((p / name).relative_to(evidence)))
                if f.is_file():
                    result.append((f, '成功发布超过7天且不属于最新3次；仅删除本机制品副本'))

    if manifest:
        if manifest.get('version') != 1:
            raise ValueError('清理清单版本必须是1')
        for item in manifest['items']:
            p = safe_child(evidence, item['path'])
            protected_parent = any(part in {'.git', '.local'} or re.search(r'(^|[-_])(backups?|rollback|restore)([-_]|$)', part, re.I)
                                   for part in p.relative_to(evidence).parts[:-1])
            if protected_parent or p.name not in DISPOSABLE or not item.get('reason') or not item.get('evidence'):
                raise ValueError('任务清单只接受有完成依据的缓存／构建输出；备份和源码快照不在范围内')
            if p.exists():
                result.append((p, item['reason']))
    # Parent entries subsume children, avoiding duplicate accounting or deletion.
    unique = []
    selected = set()
    for p, reason in sorted(result, key=lambda x: len(x[0].parts)):
        if p not in selected and not any(parent in selected for parent in p.parents):
            unique.append((p, reason))
            selected.add(p)
    return unique


def open_paths():
    # Include cwd and open/mapped files, not only port listeners. Failure is fail-closed.
    result = subprocess.run(['lsof', '-nP', '-F', 'n'], capture_output=True, text=True, timeout=30)
    if result.returncode != 0 or result.stderr.strip():
        raise RuntimeError('无法完整读取 lsof；拒绝清理，请在具有进程读取权限的终端重试')
    return {Path(line[1:].removesuffix(' (deleted)')) for line in result.stdout.splitlines() if line.startswith('n/')}


def execute(items, apply=False, opened=None):
    opened = open_paths() if opened is None else opened
    # A directory is busy if it is an ancestor of any open file/cwd. Index once:
    # thousands of archives multiplied by every machine-wide fd is unnecessarily costly.
    protected = set(opened)
    for p in opened:
        protected.update(p.parents)
    report = {'apply': apply, 'removedBytes': 0, 'eligibleBytes': 0, 'items': []}
    for path, reason in items:
        status = 'in-use' if path in protected else 'eligible'
        size = size_bytes(path)
        if status == 'eligible':
            report['eligibleBytes'] += size
            if apply:
                if path.is_dir():
                    shutil.rmtree(path)
                else:
                    path.unlink()
                report['removedBytes'] += size
                status = 'removed'
        report['items'].append({'path': str(path), 'bytes': size, 'reason': reason, 'status': status})
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--apply', action='store_true')
    parser.add_argument('--manifest', type=Path, help='本机JSON清单：version=1，items含path、reason、evidence；path相对verification-artifacts')
    parser.add_argument('--report', type=Path, help='将详细清单保存到本机忽略目录，不含文件正文')
    args = parser.parse_args()
    manifest = json.loads(args.manifest.read_text()) if args.manifest else None
    report_path = None
    if args.report:
        report_path = safe_child(DOCS / '.local', str(args.report.absolute().relative_to((DOCS / '.local').absolute())))
        report_path.parent.mkdir(parents=True, exist_ok=True)
    lock = DOCS / '.local/cleanup-local-artifacts.lock'
    lock.parent.mkdir(parents=True, exist_ok=True)
    fd = os.open(lock, os.O_CREAT | os.O_EXCL | os.O_WRONLY, 0o600)
    try:
        os.write(fd, str(os.getpid()).encode())
        items = candidates(DOCS, WORKSPACE / 'backend/gaia-saas-proj', dt.datetime.now(ZoneInfo('Asia/Shanghai')), manifest)
        report = execute(items, args.apply)
        if report_path:
            report_path.write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
            report_path.chmod(0o600)
        print(json.dumps({k: v for k, v in report.items() if k != 'items'}, ensure_ascii=False))
        print('条目', len(report['items']), '使用中跳过', sum(i['status'] == 'in-use' for i in report['items']))
        for item in sorted(report['items'], key=lambda x: x['bytes'], reverse=True)[:12]:
            print(item['status'], f"{item['bytes'] / 1048576:.2f} MiB", item['path'])
    finally:
        os.close(fd)
        lock.unlink()


if __name__ == '__main__':
    main()
