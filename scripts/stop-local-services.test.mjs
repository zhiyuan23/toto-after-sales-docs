import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { once } from 'node:events'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import test from 'node:test'
import { localServiceKind, parseProcessTable, selectLocalServiceProcesses, stopLocalServices } from './stop-local-services.mjs'
import { assertServicesNotStopping } from './local-backend.mjs'

const root = '/workspace/Gaia'
const web = `${root}/frontend/gaia-ui`
const backend = `${root}/backend/gaia-saas-proj`
const docs = `${root}/docs/toto`
const mobile = `${root}/mobile/gaia-after-sales-uni`
const info = (command, cwd, pid = 100) => ({ pid, ppid: 1, birth: 'Tue Oct 20 10:00:00 2026', command, cwd })

test('recognizes only this workspace development entry points, not builds or tools', () => {
  assert.equal(localServiceKind(info('node scripts/frontends/dev-shared.mjs after-sales', web), root), 'frontend')
  assert.equal(localServiceKind(info('node scripts/frontends/dev.mjs', web), root), 'frontend')
  assert.equal(localServiceKind(info(`node ${web}/apps/after-sales/node_modules/vite/bin/vite.js`, `${web}/apps/after-sales`), root), 'frontend')
  assert.equal(localServiceKind(info('node ./scripts/tenant-command.mjs dev:h5 TOTO', mobile), root), 'frontend')
  assert.equal(localServiceKind(info(`node ${docs}/scripts/local-backend.mjs`, mobile), root), 'launcher')
  assert.equal(localServiceKind(info(`bash ${docs}/scripts/start-local-backend.sh`, root), root), 'backend')
  assert.equal(localServiceKind(info(`node ${docs}/scripts/bounded-backend-log.mjs ${backend}/.local/logs/shared-backend-100.log`, root), root), 'backend')
  for (const action of ['build', 'build:h5', 'upload', 'release', 'check']) {
    assert.equal(localServiceKind(info(`node scripts/tenant-command.mjs ${action} TOTO`, mobile), root), '')
  }
  assert.equal(localServiceKind(info('node scripts/frontends/dev-shared.mjs after-sales', '/workspace/other'), root), '')
  assert.equal(localServiceKind(info('node server.mjs', web), root), '')
  assert.equal(localServiceKind(info('node -e "scripts/frontends/dev-shared.mjs"', web), root), '')
  assert.equal(localServiceKind(info('node node_modules/vite/bin/vite.js build', web), root), '')
  assert.equal(localServiceKind(info('node scripts/stop-local-services.mjs', docs), root), '')
})

test('includes unbound managed JVMs but never unrelated Java or another project Redis', () => {
  assert.equal(localServiceKind(info(`java -jar ${backend}/.local/runtime/gaia-web-20261020100000-100.jar`, backend), root), 'backend')
  assert.equal(localServiceKind(info('java -jar other.jar', backend), root), '')
  assert.equal(localServiceKind(info('java -jar /workspace/Gaoge/.local/runtime/gaia-web-100.jar', '/workspace/Gaoge'), root), '')
  assert.equal(localServiceKind(info('java -jar language-server.jar', backend), root), '')
  assert.equal(localServiceKind(info('redis-server 127.0.0.1:16379', root), root, 100), 'redis')
  assert.equal(localServiceKind(info('redis-server 127.0.0.1:16379', root), root, 999), '')
  assert.equal(localServiceKind(info('redis-server 127.0.0.1:16379', '/workspace/other'), root, 100), '')
  assert.equal(localServiceKind(info('redis-server 127.0.0.1:6379', root), root, 100), '')
})

test('includes Maven/worker descendants while protecting the caller and all ancestors', () => {
  const launcher = info(`node ${docs}/scripts/local-backend.mjs`, docs, 10)
  const rows = [launcher,
    { ...info('java MavenCli', backend, 20), ppid: 10 },
    { ...info('worker', backend, 30), ppid: 20 },
    info('java -jar another.jar', '/workspace/other', 40),
  ]
  assert.deepEqual(selectLocalServiceProcesses(rows, root, 0, 999).map(row => row.pid), [10, 20, 30])
  rows.push({ ...info('node stop-local-services.mjs', docs, 50), ppid: 20 })
  assert.deepEqual(selectLocalServiceProcesses(rows, root, 0, 50).map(row => row.pid), [])
})

test('process birth time is retained for PID reuse checks and zombies are excluded', () => {
  const rows = parseProcessTable(' 10 1 S Tue Oct 20 10:00:00 2026 node dev.mjs\n 11 1 Z Tue Oct 20 09:00:00 2026 java\n')
  assert.equal(rows.length, 1)
  assert.equal(rows[0].pid, 10)
  assert.equal(rows[0].birth, 'Tue Oct 20 10:00:00 2026')
})

test('startup refuses a live stop operation and permits a missing or stale stop lock', () => {
  const directory = mkdtempSync(join(tmpdir(), 'toto-stop-lock-'))
  const lock = join(directory, 'stop.lock')
  try {
    assert.doesNotThrow(() => assertServicesNotStopping(lock))
    writeFileSync(lock, String(process.pid))
    assert.throws(() => assertServicesNotStopping(lock), /正在停止/)
    writeFileSync(lock, '99999999')
    assert.doesNotThrow(() => assertServicesNotStopping(lock))
  }
  finally { rmSync(directory, { recursive: true, force: true }) }
})

test('real stop handles descendants, TERM-resistant processes, dry-run and repeated invocation', {
  skip: process.platform === 'win32', timeout: 20000,
}, async () => {
  const directory = mkdtempSync(join(tmpdir(), 'toto-stop-services-'))
  const workspace = join(directory, 'Gaia')
  const frontend = join(workspace, 'frontend/gaia-ui')
  const scripts = join(frontend, 'scripts/frontends')
  const runtime = join(workspace, 'backend/gaia-saas-proj/.local/runtime')
  mkdirSync(scripts, { recursive: true })
  mkdirSync(runtime, { recursive: true })
  const stateFile = join(runtime, 'shared-backend-state.json')
  writeFileSync(stateFile, '{"pid":99999999}')
  // The child ignores TERM; the stop command must also drain surviving descendants.
  writeFileSync(join(scripts, 'dev-shared.mjs'), `
    import { spawn } from 'node:child_process';
    const child = spawn(process.execPath, ['-e', 'process.on("SIGTERM", () => {}); setInterval(() => {}, 1000)']);
    child.once('spawn', () => setTimeout(() => { console.log(child.pid); }, 100));
    process.on('SIGTERM', () => {});
    setInterval(() => {}, 1000);
  `)
  const owned = spawn(process.execPath, ['scripts/frontends/dev-shared.mjs'], { cwd: frontend, stdio: ['ignore', 'pipe', 'pipe'] })
  const foreign = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: directory, stdio: 'ignore' })
  let childPid
  const messages = []
  try {
    const [data] = await once(owned.stdout, 'data')
    childPid = Number(data.toString().trim())
    assert.ok(childPid > 1)
    const plan = await stopLocalServices({ workspaceRoot: workspace, dryRun: true, log: text => messages.push(text) })
    assert.ok(plan.some(row => row.pid === owned.pid))
    assert.ok(plan.some(row => row.pid === childPid))
    assert.ok(!plan.some(row => row.pid === foreign.pid))
    assert.equal(owned.exitCode, null)
    assert.equal(foreign.exitCode, null)
    assert.equal(readFileSync(stateFile, 'utf8'), '{"pid":99999999}')
    assert.ok(!existsSync(join(runtime, 'shared-services-stop.lock')))
    const exited = once(owned, 'exit')
    await stopLocalServices({ workspaceRoot: workspace, timeoutMs: 100, log: text => messages.push(text) })
    await exited
    assert.ok(!existsSync(stateFile))
    assert.equal(foreign.exitCode, null)
    assert.throws(() => process.kill(childPid, 0), { code: 'ESRCH' })
    await stopLocalServices({ workspaceRoot: workspace, log: text => messages.push(text) })
    assert.ok(messages.some(message => message.includes('均未运行')))
    assert.ok(messages.some(message => message.includes('本地服务已停止')))
  }
  finally {
    for (const pid of [owned.pid, childPid, foreign.pid]) {
      if (!pid) continue
      try { process.kill(pid, 'SIGKILL') } catch {}
    }
    rmSync(directory, { recursive: true, force: true })
  }
})
