import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { listMarkdownFiles, markdownBody, parseFrontmatter } from './knowledge-base-core.mjs';
import { pageMetadata, prepareWikiPage, serializeFrontmatter } from './prepare-wiki-page.mjs';

const directory = path.dirname(fileURLToPath(import.meta.url));
const date = '2026-10-14';
function fixture(t, configuration = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'toto-llm-wiki-'));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  writeFileSync(path.join(root, '.llm-wiki.json'), JSON.stringify({ roots: ['01-功能需求'], files: [], ...configuration }));
  const write = (file, text) => { const full = path.join(root, file); mkdirSync(path.dirname(full), { recursive: true }); writeFileSync(full, text); };
  const page = (id, body = '# 示例\n', extra = {}) => serializeFrontmatter({ ...pageMetadata('example.md', { date }), belongs_to: [], id, ...extra }, body);
  const validate = (...args) => {
    const result = spawnSync(process.execPath, [path.join(directory, 'validate-knowledge-base.mjs'), '--kb-root', root, ...args], { encoding: 'utf8' });
    assert.ok(result.stdout, result.stderr);
    return { status: result.status, ...JSON.parse(result.stdout) };
  };
  return { root, write, page, validate };
}

test('文件头前置正文会被拒绝，不把无效 YAML 静默当作正文', () => {
  assert.equal(parseFrontmatter('---\n2026-10-14 更新说明\ntype: llm-wiki-project\n---\n# 内容').error, 'invalid_frontmatter');
  assert.throws(() => markdownBody('---\nstatus: active\n正文\n---\n# 内容'), /Invalid/);
});

test('剥离文件头保留原始标题、正文、表格及链接', () => {
  const body = '# 手册\n\n## 步骤\n\n| 列 |\n| --- |\n| 内容 |\n\n[来源](../specs/example.md)\n';
  assert.equal(markdownBody(serializeFrontmatter(pageMetadata('example.md', { date }), body)), body);
  assert.equal(markdownBody(body), body);
});

test('自定义目录真正进入检查，证据与历史不混入正式范围', t => {
  const f = fixture(t, { exclude: ['01-功能需求/evidence/'], historyRoots: ['99-归档'] });
  f.write('01-功能需求/main.md', f.page('kb:project:main'));
  f.write('01-功能需求/evidence/raw.md', '未整理证据');
  f.write('99-归档/old.md', '历史原文');
  assert.equal(listMarkdownFiles(f.root).length, 1);
  assert.equal(f.validate().files, 1);
  assert.equal(f.validate().ok, true);
});

test('零文件检查失败，避免错报整个项目通过', t => {
  const f = fixture(t);
  const result = f.validate();
  assert.equal(result.status, 1);
  assert.equal(result.summary.empty_knowledge_scope, 1);
});

test('保留路径的同名 README 只在明确例外下通过，ID 仍不能重复', t => {
  const f = fixture(t, { allowDuplicateBasenames: ['README.md'] });
  f.write('01-功能需求/a/README.md', f.page('kb:project:readme-a'));
  f.write('01-功能需求/b/README.md', f.page('kb:project:readme-b'));
  assert.equal(f.validate().ok, true);
  f.write('01-功能需求/b/README.md', f.page('kb:project:readme-a'));
  assert.equal(f.validate().ok, false);
  assert.ok(f.validate().summary.duplicate_id);
});

test('生命周期不接受证据状态，知识关系和来源必须可解析', t => {
  const f = fixture(t);
  f.write('01-功能需求/a.md', f.page('kb:project:a', '# 示例\n[错误](missing.md)', { status: 'source-verified', belongs_to: ['kb:project:missing'] }));
  const result = f.validate();
  assert.equal(result.summary.invalid_status, 1);
  assert.equal(result.summary.unknown_relationship_target, 1);
  assert.equal(result.summary.unresolved_link, 1);
});

test('历史稳定身份可支撑替代关系，历史内容不计入当前知识', t => {
  const f = fixture(t, { historyRoots: ['99-归档'] });
  f.write('01-功能需求/new.md', f.page('kb:project:new', '# 当前\n', { supersedes: ['kb:project:old'] }));
  f.write('99-归档/old.md', f.page('kb:project:old', '# 历史\n', { status: 'deprecated' }));
  const result = f.validate();
  assert.equal(result.ok, true);
  assert.equal(result.files, 1);
});

test('准备工具不会覆盖已有身份与正文，也不会修改范围之外的页面', t => {
  const f = fixture(t);
  f.write('01-功能需求/new.md', '# 新需求\n\n- 状态：待确认\n');
  assert.equal(prepareWikiPage(f.root, '01-功能需求/new.md', date), true);
  const first = readFileSync(path.join(f.root, '01-功能需求/new.md'), 'utf8');
  assert.equal(prepareWikiPage(f.root, '01-功能需求/new.md', date), false);
  assert.equal(readFileSync(path.join(f.root, '01-功能需求/new.md'), 'utf8'), first);
  assert.match(markdownBody(first), /状态：待确认/);
  f.write('outside.md', '# 不在范围内');
  assert.throws(() => prepareWikiPage(f.root, 'outside.md', date), /正式知识范围/);
});

test('配置不得逃逸仓库目录', t => {
  const f = fixture(t, { roots: ['../outside'] });
  assert.throws(() => listMarkdownFiles(f.root), /Invalid LLM Wiki configuration/);
});

test('私密知识不能声明共享', t => {
  const f = fixture(t);
  f.write('01-功能需求/private.md', f.page('kb:project:private', '# 内容', { sensitivity: 'private', share: 'true' }));
  assert.equal(f.validate().ok, false);
});

test('独立文档副本允许缺少已配置的源码仓库，内部断链仍然失败', t => {
  const f = fixture(t, { workspaceReferences: ['backend'] });
  f.write('01-功能需求/a.md', f.page('kb:project:a', '# 内容\n[源码](../../../backend/app/source.java)\n'));
  assert.equal(f.validate().ok, true);
  assert.equal(f.validate().warnings[0].code, 'unavailable_workspace_reference');
  f.write('01-功能需求/a.md', f.page('kb:project:a', '# 内容\n[需求](missing.md)\n'));
  assert.equal(f.validate().ok, false);
  assert.equal(f.validate().summary.unresolved_link, 1);
});

test('严格工作区模式保留跨仓断链报错，不放宽未配置的外部路径', t => {
  const f = fixture(t, { workspaceReferences: ['backend'] });
  f.write('01-功能需求/a.md', f.page('kb:project:a', '# 内容\n[源码](../../../backend/app/source.java)\n'));
  assert.equal(f.validate('--strict-workspace-links').ok, false);
  f.write('01-功能需求/a.md', f.page('kb:project:a', '# 内容\n[其它](../../../unregistered/missing.md)\n'));
  assert.equal(f.validate().ok, false);
});
