import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createSpec } from './create-spec.mjs';
import { prepareWikiPage } from './prepare-wiki-page.mjs';
import { validateSpecLayout } from './spec-layout.mjs';
import { parseFrontmatter } from './knowledge-base-core.mjs';

const repository = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
function fixture(t) {
  const root = mkdtempSync(path.join(tmpdir(), 'toto-spec-layout-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, '.spec-layout.json'), readFileSync(path.join(repository, '.spec-layout.json')));
  writeFileSync(path.join(root, '.llm-wiki.json'), JSON.stringify({ roots: ['specs'], files: [], exclude: ['specs/_template.md'] }));
  mkdirSync(path.join(root, 'specs'));
  writeFileSync(path.join(root, 'specs/_template.md'), readFileSync(path.join(repository, 'specs/_template.md')));
  return root;
}
const options = { category: '03', name: '调度示例', date: '2026-10-22' };

test('必须显式分类，拒绝路径注入、未知分类与无效日期', t => {
  const root = fixture(t);
  for (const extra of [{ category: undefined }, { category: '99' }, { name: '../越界' }, { name: '嵌套/文件' }, { date: '2026-02-30' }]) {
    assert.throws(() => createSpec(root, { ...options, ...extra }));
  }
  assert.deepEqual(validateSpecLayout(root), []);
});

test('分类创建保留模板，生成独立 ID，重复创建不覆盖已有契约', t => {
  const root = fixture(t);
  const relative = createSpec(root, options);
  assert.equal(relative, 'specs/03-服务工单与调度/2026-10-22-调度示例.md');
  const content = readFileSync(path.join(root, relative), 'utf8');
  const record = parseFrontmatter(content);
  assert.equal(record.error, undefined);
  assert.match(record.data.id, /^kb:project:toto-doc-/);
  assert.match(content, /# 调度示例 Spec/);
  assert.match(content, /^- 状态：草稿$/m);
  assert.match(content, /\(\.\.\/README.md#spec-generation\)/);
  assert.throws(() => createSpec(root, options), /EEXIST/);
  assert.equal(readFileSync(path.join(root, relative), 'utf8'), content);
  assert.equal(prepareWikiPage(root, relative, options.date), false);
  const second = createSpec(root, { ...options, name: '另一契约' });
  assert.notEqual(parseFrontmatter(readFileSync(path.join(root, second), 'utf8')).data.id, record.data.id);
});

test('根目录误建即使已有文件头仍被拒绝，校验退出失败', t => {
  const root = fixture(t);
  const valid = createSpec(root, options);
  const invalid = 'specs/2026-10-22-错误位置.md';
  writeFileSync(path.join(root, invalid), readFileSync(path.join(root, valid)));
  assert.throws(() => prepareWikiPage(root, invalid, options.date), /spec_root_file/);
  assert.equal(validateSpecLayout(root)[0].code, 'spec_root_file');
  const result = spawnSync(process.execPath, [path.join(repository, 'scripts/validate-knowledge-base.mjs'), '--kb-root', root], { encoding: 'utf8' });
  assert.equal(result.status, 1);
  assert.ok(JSON.parse(result.stdout).errors.some(error => error.code === 'spec_root_file'));
});

test('未知目录和非规范文件名报错，根导航与配套证据目录允许', t => {
  const root = fixture(t);
  writeFileSync(path.join(root, 'specs/README.md'), '# 导航');
  for (const dir of ['assets', 'evidence', 'sql', 'support']) {
    mkdirSync(path.join(root, 'specs', dir));
    writeFileSync(path.join(root, 'specs', dir, 'sample.txt'), '配套材料');
  }
  assert.deepEqual(validateSpecLayout(root), []);
  mkdirSync(path.join(root, 'specs/plans'));
  mkdirSync(path.join(root, 'specs/03-服务工单与调度'));
  writeFileSync(path.join(root, 'specs/03-服务工单与调度/临时.md'), '# 未按命名规则');
  assert.deepEqual(new Set(validateSpecLayout(root).map(error => error.code)), new Set(['spec_unknown_category', 'spec_invalid_filename']));
});
