import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync, utimesSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { createBoundedLogWriter, pruneFinishedBackendLogs } from './bounded-backend-log.mjs'

test('console output remains bounded during a long running backend', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toto-bounded-log-'))
  const path = join(directory, 'backend.log')
  try {
    const writer = createBoundedLogWriter(path, 64)
    for (let index = 0; index < 100; index++) writer.write(`error ${index}\n`)
    writer.close()
    assert.ok(statSync(path).size <= 64)
    assert.match(readFileSync(path, 'utf8'), /error 99\n$/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('CLI drains output larger than a pipe buffer before closing', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toto-bounded-log-'))
  const path = join(directory, `shared-backend-${process.pid}.log`)
  try {
    const input = `${'startup log\n'.repeat(20_000)}ready\n`
    execFileSync(process.execPath, [new URL('./bounded-backend-log.mjs', import.meta.url).pathname, path], {
      input,
      timeout: 10_000,
    })
    assert.match(readFileSync(path, 'utf8'), /ready\n$/)
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('an existing oversized log is compacted before more output is appended', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toto-bounded-log-'))
  const path = join(directory, 'backend.log')
  try {
    writeFileSync(path, `${'old log\n'.repeat(100)}last old line\n`)
    const writer = createBoundedLogWriter(path, 64)
    writer.write('new line\n')
    writer.close()
    assert.ok(statSync(path).size <= 64)
    assert.match(readFileSync(path, 'utf8'), /last old line\nnew line\n$/)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

test('only a bounded number of finished backend logs is retained', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toto-bounded-log-'))
  try {
    for (let index = 0; index < 7; index++) {
      const path = join(directory, `shared-backend-${900000 + index}.log`)
      writeFileSync(path, 'old run\n')
      utimesSync(path, index + 1, index + 1)
    }
    pruneFinishedBackendLogs(join(directory, `shared-backend-${process.pid}.log`), 3)
    assert.deepEqual(readdirSync(directory).sort(), [
      'shared-backend-900004.log',
      'shared-backend-900005.log',
      'shared-backend-900006.log',
    ])
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
