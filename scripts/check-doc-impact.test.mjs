import assert from 'node:assert/strict'
import test from 'node:test'

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
