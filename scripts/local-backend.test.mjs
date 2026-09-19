import assert from 'node:assert/strict'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import {
  backendRuntimeIsFresh,
  fingerprintBackendFiles,
  isMobileProbeReady,
  isUnifiedBackendReady,
  isWebProbeReady,
  LOCAL_BACKEND_BASE_URL,
  managedBackendRuntime,
} from './local-backend.mjs'

test('shared local backend uses the Gaia context path on one canonical port', () => {
  assert.equal(LOCAL_BACKEND_BASE_URL, 'http://127.0.0.1:8080/api')
})

test('web readiness requires the expected anonymous Gaia response', () => {
  assert.equal(isWebProbeReady({ statusCode: 200, body: '{"code":4001}' }), true)
  assert.equal(isWebProbeReady({ statusCode: 200, body: '{"code":0}' }), false)
  assert.equal(isWebProbeReady({ statusCode: 404, body: '' }), false)
})

test('mobile readiness rejects the generic web interceptor and accepts a mobile business response', () => {
  assert.equal(isMobileProbeReady({ statusCode: 200, body: '{"code":401,"message":"session invalid"}' }), true)
  assert.equal(isMobileProbeReady({ statusCode: 200, body: '{"code":4001,"errMsg":"登录状态已失效，请重新登录"}' }), true)
  assert.equal(isMobileProbeReady({ statusCode: 200, body: '{"code":4001,"errMsg":"后端接口-未登录"}' }), false)
  assert.equal(isMobileProbeReady({ statusCode: 200, body: '{"code":403,"errMsg":"缺少有效租户上下文"}' }), false)
  assert.equal(isMobileProbeReady({ statusCode: 404, body: '{}' }), false)
  assert.equal(isMobileProbeReady({ statusCode: 200, body: '<html></html>' }), false)
})

test('unified readiness requires both web and mobile capabilities', () => {
  const web = { statusCode: 200, body: '{"code":4001}' }
  const mobile = { statusCode: 200, body: '{"code":4001,"errMsg":"登录状态已失效，请重新登录"}' }
  assert.equal(isUnifiedBackendReady({ web, mobile }), true)
  assert.equal(isUnifiedBackendReady({ web, mobile: { statusCode: 404, body: '' } }), false)
})

test('only recognizes runtime jars owned by the configured backend workspace', () => {
  const root = '/workspace/backend/gaia-saas-proj'
  assert.equal(managedBackendRuntime({
    cwd: root,
    command: 'java -jar .local/runtime/gaia-web-20260919090000-123.jar --spring.config.additional-location=file:.local/',
  }, root), '/workspace/backend/gaia-saas-proj/.local/runtime/gaia-web-20260919090000-123.jar')
  assert.equal(managedBackendRuntime({ cwd: '/workspace/other', command: 'java -jar .local/runtime/gaia-web-1.jar' }, root), null)
  assert.equal(managedBackendRuntime({ cwd: root, command: 'java -jar other-service.jar' }, root), null)
})

test('fingerprint is authoritative and legacy runtimes fall back to source time', () => {
  assert.equal(backendRuntimeIsFresh({ currentFingerprint: 'new', recordedFingerprint: 'new', runtimeMtimeMs: 1, latestSourceMtimeMs: 2 }), true)
  assert.equal(backendRuntimeIsFresh({ currentFingerprint: 'new', recordedFingerprint: 'old', runtimeMtimeMs: 3, latestSourceMtimeMs: 2 }), false)
  assert.equal(backendRuntimeIsFresh({ currentFingerprint: 'new', recordedFingerprint: '', runtimeMtimeMs: 3, latestSourceMtimeMs: 2 }), true)
  assert.equal(backendRuntimeIsFresh({ currentFingerprint: 'new', recordedFingerprint: '', runtimeMtimeMs: 1, latestSourceMtimeMs: 2 }), false)
})

test('backend fingerprint changes when source content changes', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toto-backend-fingerprint-'))
  const source = join(directory, 'Source.java')
  try {
    writeFileSync(source, 'class Source {}\n')
    const first = fingerprintBackendFiles([{ key: 'module/src/main/java/Source.java', path: source }])
    writeFileSync(source, 'class Source { int revision = 2; }\n')
    const second = fingerprintBackendFiles([{ key: 'module/src/main/java/Source.java', path: source }])
    assert.notEqual(first.fingerprint, second.fingerprint)
    assert.ok(second.latestMtimeMs >= first.latestMtimeMs)
  } finally {
    rmSync(directory, { recursive: true, force: true })
  }
})
