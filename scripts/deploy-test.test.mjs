import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { HOST_FINGERPRINT, knownFailureMatch, parseCredentials, parseOptions, snapshot, sourceUnchanged, uploadMiniPrograms, parseMobileCheck } from './deploy-test.mjs'
import { uploadEnvironment } from './deploy-test/mobile.mjs'

test('deployment requires an explicit action and rejects target overrides and shell-like release IDs', () => {
  assert.equal(parseOptions([]).mode, 'help')
  assert.equal(parseOptions(['--check']).mode, 'check')
  assert.deepEqual(parseOptions(['--deploy', '--allow-known-web-failures']), { mode: 'deploy', release: undefined, allowKnown: true, webOnly: false })
  assert.equal(parseOptions(['--deploy', '--web-only']).webOnly, true)
  assert.equal(parseOptions(['--check', '--web-only']).webOnly, true)
  assert.throws(() => parseOptions(['--status', '20261001180000-aabbccdd', '--web-only']))
  assert.equal(parseOptions(['--status', '20261001180000-aabbccdd']).release, '20261001180000-aabbccdd')
  for (const args of [['--host', 'production'], ['--check', '--deploy'], ['--status', 'x; reboot'], ['--check', '--allow-known-web-failures']]) assert.throws(() => parseOptions(args))
  assert.equal(HOST_FINGERPRINT, 'SHA256:32uCUmbKNWdximqXT8HzyEktQDv7WlZIKkSGxvBdGnI')
})

test('mini-program uploads force test endpoint and use each repository private-key configuration', () => {
  const env = uploadEnvironment('GAIA_APP_ENV=production\nGAIA_API_BASE_URL=https://production.invalid\nGAIA_EXAMPLES=true\nWECHAT_CI_PRIVATE_KEY_PATH=/fixture/worker.key\n', { WECHAT_CI_PRIVATE_KEY_PATH: '/fixture/consumer.key' })
  assert.equal(env.GAIA_APP_ENV, 'test')
  assert.equal(env.GAIA_API_BASE_URL, 'http://10.1.1.53:8011')
  assert.equal(env.GAIA_EXAMPLES, 'false')
  assert.equal(env.WECHAT_CI_PRIVATE_KEY_PATH, '/fixture/worker.key')
})

const uploadPlans = [{ repo: 'consumer', version: '0.1.1' }, { repo: 'worker', version: '0.2.1' }]

test('reads metadata despite the installed CI initialization banner and rejects wrong environment', () => {
  const metadata = { appId: 'wx0123456789abcdef', version: '0.1.1', environment: 'test' }
  assert.deepEqual(parseMobileCheck('[miniprogram-builder] initservices CI\n' + JSON.stringify(metadata) + '\n'), metadata)
  assert.throws(() => parseMobileCheck(JSON.stringify({ ...metadata, environment: 'production' })))
})

test('uploads sequentially and persists per-app completion', async () => {
  const calls = [], records = []
  const states = await uploadMiniPrograms(uploadPlans, {
    upload: async plan => calls.push(plan.repo), unchanged: () => true,
    record: state => records.push(structuredClone(state)),
  })
  assert.deepEqual(calls, ['consumer', 'worker'])
  assert.equal(records[1].consumer.state, 'UPLOADING')
  assert.equal(records[2].consumer.state, 'UPLOADED')
  assert.equal(records[3].worker.state, 'UPLOADING')
  assert.equal(states.worker.state, 'UPLOADED')
})

test('a lost upload response does not retry or hide partial success', async () => {
  const calls = []; let recorded
  await assert.rejects(uploadMiniPrograms(uploadPlans, {
    upload: async plan => { calls.push(plan.repo); if (plan.repo === 'consumer') throw new Error('connection lost') },
    unchanged: () => true, record: state => { recorded = structuredClone(state) },
  }), /Web／后端已更新/)
  assert.deepEqual(calls, ['consumer', 'worker'])
  assert.equal(recorded.consumer.state, 'UNCONFIRMED')
  assert.equal(recorded.worker.state, 'UPLOADED')
})

test('changed sources or cancellation block remaining uploads and preserve completed state', async () => {
  for (const reason of ['source', 'cancel']) {
    const calls = []; let recorded
    await assert.rejects(uploadMiniPrograms(uploadPlans, {
      upload: async plan => calls.push(plan.repo),
      unchanged: () => reason !== 'source' || calls.length === 0,
      cancelled: () => reason === 'cancel' && calls.length > 0,
      record: state => { recorded = structuredClone(state) },
    }), /已中止/)
    assert.deepEqual(calls, ['consumer'])
    assert.equal(recorded.consumer.state, 'UPLOADED')
    assert.equal(recorded.worker.state, 'PENDING')
  }
})

test('credentials are literal data, require the exact test destination and never expose the password in errors', () => {
  const text = "TOTO_TEST_SSH_HOST=10.1.1.53\nTOTO_TEST_SSH_USER=root\nTOTO_TEST_HTTP_URL=http://10.1.1.53:8011/\nTOTO_TEST_SSH_PASSWORD='literal$(touch /tmp/never-execute)#'\n"
  assert.equal(parseCredentials(text).TOTO_TEST_SSH_PASSWORD, 'literal$(touch /tmp/never-execute)#')
  assert.throws(() => parseCredentials(text.replace('10.1.1.53', 'production')), error => !error.message.includes('literal'))
  assert.throws(() => parseCredentials(text + 'TOTO_TEST_SSH_PASSWORD=another\n'))
})

test('known-test exception rejects new failures, changed counts, static failures and interrupted test runs', () => {
  const log = '✖ old one (1.1ms)\n✖ old two (2ms)\nℹ fail 2\n'
  const baseline = { failures: ['old two', 'old one'] }
  assert.ok(knownFailureMatch(log, baseline))
  assert.ok(!knownFailureMatch(log.replace('old two', 'new failure'), baseline))
  assert.ok(!knownFailureMatch(log.replace('fail 2', 'fail 3'), baseline))
  assert.ok(!knownFailureMatch(log.replace('ℹ fail 2', ''), baseline))
  assert.ok(!knownFailureMatch('typecheck error', baseline))
  const actual = readFileSync(new URL('./deploy-test/web-test-baseline.json', import.meta.url), 'utf8')
  assert.equal(new Set(JSON.parse(actual).failures).size, 37)
})

test('source snapshots preserve dirty inputs and detect same-status concurrent changes and new files', () => {
  const root = mkdtempSync(join(tmpdir(), 'toto-deploy-source-'))
  const git = args => execFileSync('git', ['-C', root, ...args], { stdio: 'pipe' })
  try {
    git(['init', '-q'])
    writeFileSync(join(root, 'source.txt'), 'original')
    git(['add', '.'])
    git(['-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.invalid', 'commit', '-qm', 'fixture'])
    writeFileSync(join(root, 'source.txt'), 'first edit')
    const first = snapshot(root)
    assert.ok(first.status.includes('M source.txt'))
    assert.equal(readFileSync(join(root, 'source.txt'), 'utf8'), 'first edit')
    writeFileSync(join(root, 'source.txt'), 'second edit')
    const second = snapshot(root)
    assert.equal(first.status, second.status)
    assert.ok(!sourceUnchanged({ repo: first }, { repo: second }))
    assert.ok(sourceUnchanged({ repo: second }, { repo: snapshot(root) }))
    writeFileSync(join(root, 'untracked.txt'), 'new source')
    assert.ok(!sourceUnchanged({ repo: second }, { repo: snapshot(root) }))
  } finally { rmSync(root, { recursive: true, force: true }) }
})
