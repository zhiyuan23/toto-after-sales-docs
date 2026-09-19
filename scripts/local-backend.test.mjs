import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isMobileProbeReady,
  isUnifiedBackendReady,
  isWebProbeReady,
  LOCAL_BACKEND_BASE_URL,
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
