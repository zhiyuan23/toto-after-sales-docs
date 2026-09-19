import { spawn } from 'node:child_process'
import {
  closeSync,
  existsSync,
  mkdirSync,
  openSync,
  readFileSync,
  rmSync,
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
const redisLog = resolve(logRoot, 'shared-redis.log')
const redisPidFile = resolve(runtimeRoot, 'shared-redis.pid')
const wait = milliseconds => new Promise(resolveWait => setTimeout(resolveWait, milliseconds))

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

async function waitForBackend() {
  return waitUntil(async () => {
    const probes = await probeUnifiedBackend()
    return isUnifiedBackendReady(probes) ? probes : false
  }, 240000, 'Gaia 统一后端 ')
}

export async function ensureLocalBackend() {
  if (process.platform === 'win32') throw new Error('统一本地后端启动目前依赖 bash、Maven、Redis 和 lsof，仅支持 macOS/Linux')
  if (!existsSync(backendScript)) throw new Error(`缺少后端启动脚本：${backendScript}`)
  mkdirSync(runtimeRoot, { recursive: true })
  mkdirSync(logRoot, { recursive: true })

  const initialProbes = await probeUnifiedBackend()
  if (isUnifiedBackendReady(initialProbes)) {
    console.log(`[backend] 复用已运行的 Gaia 统一后端 ${LOCAL_BACKEND_BASE_URL}`)
    return
  }

  const deadline = Date.now() + 300000
  while (!tryAcquireStartupLock()) {
    const probes = await probeUnifiedBackend()
    if (isUnifiedBackendReady(probes)) {
      console.log(`[backend] 另一个项目已启动 Gaia 统一后端，复用 ${LOCAL_BACKEND_BASE_URL}`)
      return
    }
    if (Date.now() >= deadline) throw new Error('等待另一个项目启动 Gaia 统一后端超时')
    await wait(500)
  }

  try {
    const lockedProbes = await probeUnifiedBackend()
    if (isUnifiedBackendReady(lockedProbes)) {
      console.log(`[backend] 复用已运行的 Gaia 统一后端 ${LOCAL_BACKEND_BASE_URL}`)
      return
    }
    if (await portIsOpen(LOCAL_BACKEND_PORT)) {
      throw new Error(`端口 ${LOCAL_BACKEND_PORT} 已有服务，但不是同时具备 Web 与移动端能力的当前 Gaia 统一后端；已拒绝重复启动。${probeFailureMessage(lockedProbes)}`)
    }

    await ensureRedis()
    const pid = await spawnDetached('bash', [backendScript], { cwd: workspaceRoot, logFile: backendLog })
    console.log(`[backend] 正在装配售后模块并启动共享后端（PID ${pid}），首次启动通常需要约 1–2 分钟`)
    await waitForBackend()
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
