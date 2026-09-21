import { execFile, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs'
import { request } from 'node:http'
import { createConnection } from 'node:net'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const LOCAL_BACKEND_PORT = 8080
export const LOCAL_BACKEND_BASE_URL = `http://127.0.0.1:${LOCAL_BACKEND_PORT}/api`
export const LOCAL_REDIS_PORT = 16379

const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const workspaceRoot = resolve(scriptDirectory, '../../..')
const backendRoot = resolve(workspaceRoot, 'backend/gaia-saas-proj')
const runtimeRoot = resolve(backendRoot, '.local/runtime')
const logRoot = resolve(backendRoot, '.local/logs')
const backendScript = resolve(scriptDirectory, 'start-local-backend.sh')
const startupLock = resolve(runtimeRoot, 'shared-backend-start.lock')
const backendLog = resolve(logRoot, 'shared-backend.log')
const backendStateFile = resolve(runtimeRoot, 'shared-backend-state.json')
const redisLog = resolve(logRoot, 'shared-redis.log')
const redisPidFile = resolve(runtimeRoot, 'shared-redis.pid')
const wait = milliseconds => new Promise(resolveWait => setTimeout(resolveWait, milliseconds))
const ignoredSourceDirectories = new Set(['.git', '.local', 'node_modules', 'target'])

function commandOutput(command, args, allowEmpty = false) {
  return new Promise((resolveCommand, reject) => execFile(command, args, { encoding: 'utf8' }, (error, stdout) => {
    if (error && !(allowEmpty && error.code === 1)) reject(error)
    else resolveCommand(stdout || '')
  }))
}

function collectBackendSourceFiles(root, files = [], baseRoot = root) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    if (entry.isSymbolicLink() || (entry.isDirectory() && ignoredSourceDirectories.has(entry.name))) continue
    const absolutePath = resolve(root, entry.name)
    if (entry.isDirectory()) collectBackendSourceFiles(absolutePath, files, baseRoot)
    else {
      const relativePath = absolutePath.slice(baseRoot.length + 1)
      if (entry.name === 'pom.xml' || relativePath.includes('/src/main/') || relativePath.startsWith('src/main/')) files.push(absolutePath)
    }
  }
  return files
}

export function fingerprintBackendFiles(entries) {
  const hash = createHash('sha256')
  let latestMtimeMs = 0
  for (const entry of [...entries].sort((left, right) => left.key.localeCompare(right.key))) {
    const stat = statSync(entry.path)
    latestMtimeMs = Math.max(latestMtimeMs, stat.mtimeMs)
    hash.update(entry.key)
    hash.update('\0')
    hash.update(readFileSync(entry.path))
    hash.update('\0')
  }
  return { fingerprint: hash.digest('hex'), latestMtimeMs }
}

function backendSourceSnapshot() {
  const afterSalesRoot = resolve(workspaceRoot, 'backend/gaia-after-sales')
  const repositories = [
    { label: 'gaia-after-sales', root: afterSalesRoot },
    { label: 'gaia-saas-proj', root: backendRoot },
  ]
  const entries = repositories.flatMap(repository => collectBackendSourceFiles(repository.root).map(path => ({
    key: `${repository.label}/${path.slice(repository.root.length + 1)}`,
    path,
  })))
  entries.push({ key: 'docs/toto/scripts/start-local-backend.sh', path: backendScript })
  return fingerprintBackendFiles(entries)
}

async function processIdsOnPort(port) {
  const output = await commandOutput('lsof', ['-nP', `-tiTCP:${port}`, '-sTCP:LISTEN'], true)
  return [...new Set(output.trim().split(/\s+/).filter(Boolean).map(Number))]
}

async function processCommand(pid) {
  try {
    return (await commandOutput('ps', ['-p', String(pid), '-o', 'command='], true)).trim()
  }
  catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') return ''
    throw error
  }
}

async function processWorkingDirectory(pid) {
  const output = await commandOutput('lsof', ['-a', '-p', String(pid), '-d', 'cwd', '-Fn'], true)
  return output.split(/\r?\n/).find(line => line.startsWith('n'))?.slice(1) || ''
}

async function processOpenFiles(pid) {
  const output = await commandOutput('lsof', ['-p', String(pid), '-Fn'], true)
  return output.split(/\r?\n/).filter(line => line.startsWith('n')).map(line => line.slice(1))
}

export function managedBackendRuntime(processInfo, projectRoot = backendRoot) {
  if (resolve(processInfo.cwd || '/') !== resolve(projectRoot)) return null
  const jarArgument = processInfo.command.match(/(?:^|\s)-jar\s+(?:"([^"]+)"|'([^']+)'|(\S+))/)?.slice(1).find(Boolean)
  const expectedPrefix = `${resolve(projectRoot, '.local/runtime')}/gaia-web-`
  if (jarArgument) {
    const runtimeJar = resolve(projectRoot, jarArgument)
    return runtimeJar.startsWith(expectedPrefix) && runtimeJar.endsWith('.jar') ? runtimeJar : null
  }
  if (processInfo.command) return null
  const openedJars = [...new Set((processInfo.openFiles || []).filter(path =>
    path.startsWith(expectedPrefix) && path.endsWith(`-${processInfo.pid}.jar`)))]
  return openedJars.length === 1 ? openedJars[0] : null
}

export function backendRuntimeIsFresh({ currentFingerprint, recordedFingerprint, runtimeMtimeMs, latestSourceMtimeMs }) {
  if (recordedFingerprint) return recordedFingerprint === currentFingerprint
  return Number.isFinite(runtimeMtimeMs) && runtimeMtimeMs >= latestSourceMtimeMs
}

function readBackendState() {
  if (!existsSync(backendStateFile)) return null
  try { return JSON.parse(readFileSync(backendStateFile, 'utf8')) }
  catch { return null }
}

function writeBackendState({ fingerprint, pid, runtimeJar }) {
  writeFileSync(backendStateFile, `${JSON.stringify({ version: 1, fingerprint, pid, runtimeJar, builtAt: new Date().toISOString() }, null, 2)}\n`, { mode: 0o600 })
}

async function inspectLocalBackend(sourceSnapshot) {
  const probes = await probeUnifiedBackend()
  const pids = await processIdsOnPort(LOCAL_BACKEND_PORT)
  const listeners = await Promise.all(pids.map(async pid => {
    const command = await processCommand(pid)
    const info = {
      pid,
      command,
      cwd: await processWorkingDirectory(pid),
      openFiles: command ? [] : await processOpenFiles(pid),
    }
    return { ...info, runtimeJar: managedBackendRuntime(info) }
  }))
  const managed = listeners.length === 1 && listeners[0].runtimeJar ? listeners[0] : null
  const state = readBackendState()
  const runtimeMtimeMs = managed && existsSync(managed.runtimeJar) ? statSync(managed.runtimeJar).mtimeMs : Number.NaN
  const fresh = Boolean(managed && backendRuntimeIsFresh({
    currentFingerprint: sourceSnapshot.fingerprint,
    recordedFingerprint: state?.runtimeJar === managed.runtimeJar ? state.fingerprint : '',
    runtimeMtimeMs,
    latestSourceMtimeMs: sourceSnapshot.latestMtimeMs,
  }))
  return { probes, listeners, managed, fresh, ready: isUnifiedBackendReady(probes) }
}

async function stopManagedBackend(processInfo) {
  console.log(`[backend] 检测到本工作区旧后端（PID ${processInfo.pid}），正在安全重启`)
  try { process.kill(processInfo.pid, 'SIGTERM') }
  catch (error) { if (error.code !== 'ESRCH') throw error }
  await waitUntil(async () => !(await portIsOpen(LOCAL_BACKEND_PORT)), 20000, '旧 Gaia 统一后端退出')
  rmSync(backendStateFile, { force: true })
}

export function isWebProbeReady(response) {
  return response.statusCode === 200 && /"code"\s*:\s*4001/.test(response.body)
}

export function isMobileProbeReady(response) {
  if (response.statusCode !== 200 || !response.body.trim()) return false
  try {
    const payload = JSON.parse(response.body)
    return Object.hasOwn(payload, 'code')
      && !response.body.includes('后端接口-未登录')
      && !response.body.includes('缺少有效租户上下文')
      && (Number(payload.code) !== 4001 || response.body.includes('登录状态已失效'))
  }
  catch {
    return false
  }
}

export function isUnifiedBackendReady(probes) {
  return isWebProbeReady(probes.web) && isMobileProbeReady(probes.mobile)
}

function httpProbe({ path, headers = {} }) {
  return new Promise(resolveProbe => {
    const probe = request({
      host: '127.0.0.1',
      port: LOCAL_BACKEND_PORT,
      path,
      method: 'GET',
      timeout: 1500,
      headers: { Accept: 'application/json', ...headers },
    }, response => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', chunk => { body += chunk })
      response.once('end', () => resolveProbe({ statusCode: response.statusCode ?? 0, body }))
    })
    probe.once('timeout', () => { probe.destroy(); resolveProbe({ statusCode: 0, body: '' }) })
    probe.once('error', () => resolveProbe({ statusCode: 0, body: '' }))
    probe.end()
  })
}

async function probeUnifiedBackend() {
  const [web, mobile] = await Promise.all([
    httpProbe({ path: '/api/api/sys/Module/tree?categoryCode=pc_web' }),
    httpProbe({
      path: '/api/api/afterSales/mobile/service-personnel/context',
      headers: {
        'x-tenant': 'TOTO',
        'x-afs-session-id': '__gaia_local_readiness_probe__',
      },
    }),
  ])
  return { web, mobile }
}

function portIsOpen(port) {
  return new Promise(resolveProbe => {
    const socket = createConnection({ host: '127.0.0.1', port })
    const finish = result => {
      socket.destroy()
      resolveProbe(result)
    }
    socket.setTimeout(1000)
    socket.once('connect', () => finish(true))
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
  })
}

function redisIsReady() {
  return new Promise(resolveProbe => {
    const socket = createConnection({ host: '127.0.0.1', port: LOCAL_REDIS_PORT })
    let response = ''
    const finish = result => {
      socket.destroy()
      resolveProbe(result)
    }
    socket.setTimeout(1000)
    socket.once('connect', () => socket.write('*1\r\n$4\r\nPING\r\n'))
    socket.on('data', chunk => {
      response += chunk.toString()
      if (response.includes('+PONG')) finish(true)
    })
    socket.once('timeout', () => finish(false))
    socket.once('error', () => finish(false))
    socket.once('end', () => finish(response.includes('+PONG')))
  })
}

async function waitUntil(check, timeout, label) {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const result = await check()
    if (result) return result
    await wait(250)
  }
  throw new Error(`${label}未在 ${timeout / 1000} 秒内就绪`)
}

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false
  try {
    process.kill(pid, 0)
    return true
  }
  catch (error) {
    return error.code === 'EPERM'
  }
}

function clearStaleLock() {
  if (!existsSync(startupLock)) return
  try {
    const { pid } = JSON.parse(readFileSync(startupLock, 'utf8'))
    if (processIsAlive(Number(pid))) return
  }
  catch {
    // An unreadable lock cannot identify a live owner and is safe to replace.
  }
  rmSync(startupLock, { force: true })
}

function tryAcquireStartupLock() {
  clearStaleLock()
  try {
    const descriptor = openSync(startupLock, 'wx', 0o600)
    writeFileSync(descriptor, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() }))
    closeSync(descriptor)
    return true
  }
  catch (error) {
    if (error.code === 'EEXIST') return false
    throw error
  }
}

function releaseStartupLock() {
  try {
    const { pid } = JSON.parse(readFileSync(startupLock, 'utf8'))
    if (Number(pid) === process.pid) rmSync(startupLock, { force: true })
  }
  catch {
    // Another launcher may already have cleared a stale lock.
  }
}

function spawnDetached(command, args, { cwd, logFile }) {
  const output = openSync(logFile, 'a')
  const child = spawn(command, args, {
    cwd,
    detached: true,
    env: process.env,
    stdio: ['ignore', output, output],
  })
  closeSync(output)
  return new Promise((resolveSpawn, reject) => {
    child.once('error', reject)
    child.once('spawn', () => {
      child.unref()
      resolveSpawn(child.pid)
    })
  })
}

async function ensureRedis() {
  if (await redisIsReady()) {
    console.log(`[redis] 复用已运行的 127.0.0.1:${LOCAL_REDIS_PORT}`)
    return
  }
  if (await portIsOpen(LOCAL_REDIS_PORT)) throw new Error(`端口 ${LOCAL_REDIS_PORT} 已被非 Redis 服务占用`)
  await spawnDetached('redis-server', [
    '--bind', '127.0.0.1',
    '--port', String(LOCAL_REDIS_PORT),
    '--protected-mode', 'yes',
    '--save', '',
    '--appendonly', 'no',
    '--pidfile', redisPidFile,
  ], { cwd: workspaceRoot, logFile: redisLog })
  await waitUntil(redisIsReady, 10000, 'Redis ')
  console.log(`[redis] 已启动 127.0.0.1:${LOCAL_REDIS_PORT}`)
}

function probeFailureMessage(probes) {
  const web = `${probes.web.statusCode || '连接失败'}${probes.web.body ? ` ${probes.web.body.slice(0, 120)}` : ''}`
  const mobile = `${probes.mobile.statusCode || '连接失败'}${probes.mobile.body ? ` ${probes.mobile.body.slice(0, 120)}` : ''}`
  return `Web 探针=${web}；移动端探针=${mobile}`
}

async function waitForBackend(startPid) {
  return waitUntil(async () => {
    const probes = await probeUnifiedBackend()
    if (isUnifiedBackendReady(probes)) return probes
    if (!processIsAlive(startPid))
      throw new Error(`Gaia 统一后端启动进程 PID ${startPid} 已提前退出；${probeFailureMessage(probes)}`)
    return false
  }, 720000, 'Gaia 统一后端 ')
}

export async function ensureLocalBackend() {
  if (process.platform === 'win32') throw new Error('统一本地后端启动目前依赖 bash、Maven、Redis 和 lsof，仅支持 macOS/Linux')
  if (!existsSync(backendScript)) throw new Error(`缺少后端启动脚本：${backendScript}`)
  mkdirSync(runtimeRoot, { recursive: true })
  mkdirSync(logRoot, { recursive: true })

  const sourceSnapshot = backendSourceSnapshot()
  const initial = await inspectLocalBackend(sourceSnapshot)
  if (initial.ready && initial.fresh) {
    if (!readBackendState()) writeBackendState({ fingerprint: sourceSnapshot.fingerprint, pid: initial.managed.pid, runtimeJar: initial.managed.runtimeJar })
    console.log(`[backend] 复用已运行的 Gaia 统一后端 ${LOCAL_BACKEND_BASE_URL}`)
    return
  }

  const deadline = Date.now() + 300000
  while (!tryAcquireStartupLock()) {
    const pending = await inspectLocalBackend(sourceSnapshot)
    if (pending.ready && pending.fresh) {
      console.log(`[backend] 另一个项目已启动 Gaia 统一后端，复用 ${LOCAL_BACKEND_BASE_URL}`)
      return
    }
    if (Date.now() >= deadline) throw new Error('等待另一个项目启动 Gaia 统一后端超时')
    await wait(500)
  }

  try {
    const locked = await inspectLocalBackend(sourceSnapshot)
    if (locked.ready && locked.fresh) {
      console.log(`[backend] 复用已运行的 Gaia 统一后端 ${LOCAL_BACKEND_BASE_URL}`)
      return
    }
    if (locked.listeners.length) {
      if (locked.managed) await stopManagedBackend(locked.managed)
      else {
        const details = locked.listeners.map(item => `PID ${item.pid}（${item.command || '命令未知'}）`).join('；')
        throw new Error(`端口 ${LOCAL_BACKEND_PORT} 被非本工作区受管后端占用，无法保证代码版本，已拒绝自动关闭：${details}。${probeFailureMessage(locked.probes)}`)
      }
    }

    await ensureRedis()
    const pid = await spawnDetached('bash', [backendScript], { cwd: workspaceRoot, logFile: backendLog })
    console.log(`[backend] 正在装配售后模块并启动共享后端（PID ${pid}），首次启动通常需要约 1–2 分钟`)
    await waitForBackend(pid)
    const started = await inspectLocalBackend(sourceSnapshot)
    if (!started.ready || !started.managed) throw new Error('新后端已响应但无法确认其属于当前工作区，拒绝记录为可复用实例')
    writeBackendState({ fingerprint: sourceSnapshot.fingerprint, pid: started.managed.pid, runtimeJar: started.managed.runtimeJar })
    console.log(`[backend] 已就绪并保持运行：${LOCAL_BACKEND_BASE_URL}`)
  }
  catch (error) {
    throw new Error(`${error.message}；后端日志：${backendLog}`)
  }
  finally {
    releaseStartupLock()
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    await ensureLocalBackend()
  }
  catch (error) {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  }
}
