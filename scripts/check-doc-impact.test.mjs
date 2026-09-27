import assert from 'node:assert/strict'
import test from 'node:test'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { inspectEvidence, isTextDocumentation } from './evidence-policy.mjs'

import {
  findImpactedFiles,
  globToRegExp,
  matchesAny
} from './check-doc-impact.mjs'

test('双星号匹配跨目录路径', () => {
  assert.equal(globToRegExp('**/src/main/**').test('module/src/main/java/App.java'), true)
  assert.equal(globToRegExp('**/src/main/**').test('module/src/test/java/AppTest.java'), false)
})

test('单星号只匹配当前目录段', () => {
  assert.equal(matchesAny('vite.config.ts', ['vite.config.*']), true)
  assert.equal(matchesAny('config/vite.config.ts', ['vite.config.*']), false)
})

test('识别需要同步文档的功能文件', () => {
  const files = [
    'apps/after-sales/src/views/catalog/index.vue',
    'apps/after-sales/tests/catalog.test.ts',
    'README.md'
  ]

  assert.deepEqual(
    findImpactedFiles(files, ['apps/after-sales/src/**']),
    ['apps/after-sales/src/views/catalog/index.vue']
  )
})

test('仅 Markdown 算正文证据，运行资源与快照基准不被证据目录规则误伤', () => {
  assert.equal(isTextDocumentation('specs/result.md'), true)
  for (const path of ['specs/evidence/result.png', 'specs/evidence/check.log', 'specs/result.json']) {
    assert.equal(isTextDocumentation(path), false)
  }
  assert.deepEqual(inspectEvidence([
    { path: 'src/assets/banner.png', size: 800000 },
    { path: 'tests/__snapshots__/page.png', size: 800000 },
    { path: 'tests/fixtures/parser.log', size: 100 }
  ]), { errors: [], warnings: [] })
})

test('过程产物默认阻断，例外必须精确到文件且不能使用空泛短理由', () => {
  const files = ['specs/evidence/a/check.log', 'specs/evidence/a/network.har', 'tests/browser/test-results/run/trace.zip']
    .map(path => ({ path, size: 100 }))
  const result = inspectEvidence(files, [
    'Evidence-Keep: specs/evidence/a/check.log | 间歇故障唯一脱敏复现证据，摘要无法保留事件顺序',
    'Evidence-Keep: specs/evidence/a/network.har | 留存',
    'Evidence-Keep: tests/browser/test-results/** | 此通配理由不应放行目录下全部文件'
  ])
  assert.equal(result.errors.length, 2)
  assert.equal(result.warnings.length, 1)
  assert.match(result.warnings[0], /check\.log/)
})

test('截图数量与大小提示复核而不机械拒绝', () => {
  const files = ['one.png', 'two.jpg', 'three.webp'].map(path => ({ path: `specs/evidence/ui/${path}`, size: 512001 }))
  const result = inspectEvidence(files)
  assert.deepEqual(result.errors, [])
  assert.equal(result.warnings.length, 4)
  assert.ok(result.warnings.some(warning => warning.includes('不可替代的状态')))
})

function fixture(t) {
  const root = realpathSync(mkdtempSync(join(tmpdir(), 'toto-evidence-policy-')))
  t.after(() => rmSync(root, { recursive: true, force: true }))
  const docs = join(root, 'docs/toto')
  const code = join(root, 'frontend/app')
  for (const repo of [docs, code]) {
    mkdirSync(repo, { recursive: true })
    execFileSync('git', ['init', '-q', repo])
  }
  const write = (repo, path, content) => {
    const fullPath = join(repo, path)
    mkdirSync(dirname(fullPath), { recursive: true })
    writeFileSync(fullPath, content)
  }
  for (const name of ['check-doc-impact.mjs', 'evidence-policy.mjs', 'install-git-hooks.sh']) {
    write(docs, `scripts/${name}`, readFileSync(new URL(name, import.meta.url)))
  }
  write(docs, 'scripts/docs-impact-map.json', JSON.stringify({
    documentationPatterns: ['specs/**'],
    repositories: [{ id: 'app', path: 'frontend/app', impactPatterns: ['src/**'], localDocumentationPatterns: ['docs/**'] }]
  }))
  const add = (repo, ...paths) => execFileSync('git', ['-C', repo, 'add', '--', ...paths])
  const check = (...args) => spawnSync(process.execPath, [join(docs, 'scripts/check-doc-impact.mjs'), ...args], { cwd: docs, encoding: 'utf8' })
  return { root, docs, code, write, add, check }
}

test('纯文档提交仍阻断原始日志，无文档影响声明不绕过；仅读取暂存的例外', t => {
  const { docs, write, add, check } = fixture(t)
  write(docs, 'specs/evidence/ui/check.log', 'synthetic log')
  add(docs, 'specs/evidence/ui/check.log')
  write(docs, 'specs/evidence/ui/verification.md', 'Evidence-Keep: specs/evidence/ui/check.log | 间歇故障唯一脱敏复现证据，保留至问题关闭\n')
  let result = check('--staged', '--repo', docs, '--no-doc-impact', '仅整理文档不影响业务实现')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /证据留存检查失败/)
  add(docs, 'specs/evidence/ui/verification.md')
  write(docs, 'specs/evidence/ui/verification.md', '工作区已撤销例外，但尚未暂存。\n')
  result = check('--staged', '--repo', docs)
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /已声明特殊留存理由/)
  result = check('--working-tree', '--repo', docs)
  assert.equal(result.status, 1)
})

test('只有截图不能满足跨仓文档同步，增加正文结论后通过', t => {
  const { docs, code, write, add, check } = fixture(t)
  write(code, 'src/page.js', 'export const updated = true\n')
  add(code, 'src/page.js')
  write(docs, 'specs/evidence/ui/final.png', 'synthetic image for path testing')
  add(docs, 'specs/evidence/ui/final.png')
  let result = check('--staged', '--all')
  assert.equal(result.status, 1)
  assert.match(result.stderr, /没有检测到关联文档更新/)
  write(docs, 'specs/page.md', '验证范围、结果及待验边界。\n')
  add(docs, 'specs/page.md')
  result = check('--staged', '--all')
  assert.equal(result.status, 0, result.stderr)
  assert.match(result.stdout, /specs\/page.md/)
})

test('Hook 安装覆盖文档仓库且保留已有自定义和默认 Hook', t => {
  const { docs, write } = fixture(t)
  const install = () => execFileSync('bash', [join(docs, 'scripts/install-git-hooks.sh')], { encoding: 'utf8' })
  install()
  assert.equal(execFileSync('git', ['-C', docs, 'config', '--get', 'core.hooksPath'], { encoding: 'utf8' }).trim(), '.githooks')
  execFileSync('git', ['-C', docs, 'config', 'core.hooksPath', 'custom-hooks'])
  assert.match(install(), /已有 core.hooksPath=custom-hooks/)
  assert.equal(execFileSync('git', ['-C', docs, 'config', '--get', 'core.hooksPath'], { encoding: 'utf8' }).trim(), 'custom-hooks')
  execFileSync('git', ['-C', docs, 'config', '--unset', 'core.hooksPath'])
  write(docs, '.git/hooks/pre-commit', '#!/bin/sh\nexit 0\n')
  assert.match(install(), /已有默认 pre-commit/)
  assert.equal(spawnSync('git', ['-C', docs, 'config', '--get', 'core.hooksPath']).status, 1)
})
