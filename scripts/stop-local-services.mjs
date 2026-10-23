import { execFile } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { managedBackendRuntime } from './local-backend.mjs'

const exec = promisify(execFile)
const defaultWorkspaceRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../..')
const delay = ms => new Promise(done => setTimeout(done, ms))
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

function runsScript(info, script, argumentsPattern = '(?:\\s|$)') {
  const paths = [script, relative(info.cwd, script)]
  return paths.some(path => new RegExp(`^\\S+\\s+(?:--[\\w-]+(?:=[^\\s]+)?\\s+)*(?:\\./)?${escape(path)}${argumentsPattern}`).test(info.command))
}

export function localServiceKind(info, workspaceRoot, redisPid) {
  if (!info.cwd) return ''
  const backend = resolve(workspaceRoot, 'backend/gaia-saas-proj')
  const docs = resolve(workspaceRoot, 'docs/toto')
  const web = resolve(workspaceRoot, 'frontend/gaia-ui')
  const mobiles = ['gaia-after-sales-uni', 'gaia-customer-service-uni']
    .map(name => resolve(workspaceRoot, 'mobile', name))
  const executable = basename(info.command.split(/\s+/)[0])
  if (executable === 'java' && managedBackendRuntime(info, backend)) return 'backend'
  if (executable === 'redis-server' && info.pid === redisPid && info.cwd === workspaceRoot
    && /^\S*redis-server\s+127\.0\.0\.1:16379(?:\s|$)/.test(info.command)) return 'redis'
  if (executable === 'bash' && runsScript(info, resolve(docs, 'scripts/start-local-backend.sh'))) return 'backend'
  if (executable === 'bash' && runsScript(info, resolve(docs, 'scripts/start-local-redis.sh'))) return 'redis'
  if (executable !== 'node') return ''
  if (runsScript(info, resolve(docs, 'scripts/local-backend.mjs'))) return 'launcher'
  if (runsScript(info, resolve(docs, 'scripts/bounded-backend-log.mjs'))
    && info.command.includes(`${backend}/.local/logs/shared-backend-`)) return 'backend'
  if (info.cwd === web && ['dev-shared.mjs', 'dev.mjs'].some(name =>
    runsScript(info, resolve(web, 'scripts/frontends', name)))) return 'frontend'
  for (const mobile of mobiles) {
    if (info.cwd === mobile && runsScript(info, resolve(mobile, 'scripts/tenant-command.mjs'),
      '\\s+(?:dev|dev:h5|dev:consumer:h5|examples:h5)(?:\\s|$)')) return 'frontend'
  }
  const frontendDirectories = [web, resolve(web, 'apps/after-sales'), ...mobiles]
  if (frontendDirectories.includes(info.cwd) && !/(?:^|\s)build(?:\s|$)/.test(info.command)
    && /\/(?:vite\/bin\/vite\.js|\.bin\/vite|vite-plugin-uni\/bin\/uni\.js)(?:\s|$)/.test(info.command)) return 'frontend'
  return ''
}

export function parseProcessTable(output) {
  return output.split(/\r?\n/).flatMap(line => {
    const match = /^\s*(\d+)\s+(\d+)\s+(\S+)\s+(\w{3}\s+\w{3}\s+\d+\s+\d{2}:\d{2}:\d{2}\s+\d{4})\s+(.+)$/.exec(line)
    if (!match || match[3].includes('Z')) return []
    return [{ pid: Number(match[1]), ppid: Number(match[2]), birth: match[4], command: match[5].trim() }]
  })
}

async function output(command, args) {
  try {
    return (await exec(command, args, { env: { ...process.env, LC_ALL: 'C' }, maxBuffer: 16 * 1024 * 1024 })).stdout
  }
  catch (error) {
    if (command === 'lsof' && error.code === 1) return error.stdout || ''
    throw new Error(`无法检查本地进程，未按端口强制停止：${command}: ${error.message}`)
  }
}

async function processSnapshot() {
  const rows = parseProcessTable(await output('ps', ['-axo', 'pid=,ppid=,stat=,lstart=,command=']))
  if (!rows.length) throw new Error('无法读取进程列表，拒绝停止未知进程')
  const directories = await output('lsof', ['-a', '-p', rows.map(row => row.pid).join(','), '-d', 'cwd', '-Fpn'])
  const cwdByPid = new Map()
  let pid
  for (const line of directories.split(/\r?\n/)) {
    if (line.startsWith('p')) pid = Number(line.slice(1))
    if (line.startsWith('n')) cwdByPid.set(pid, resolve(line.slice(1)))
  }
  return rows.map(row => ({ ...row, cwd: cwdByPid.get(row.pid) || '' }))
}

export function selectLocalServiceProcesses(rows, workspaceRoot, redisPid, ownPid = process.pid) {
  const protectedPids = new Set([ownPid, 1])
  let ancestor = rows.find(row => row.pid === ownPid)
  while (ancestor && !protectedPids.has(ancestor.ppid)) {
    protectedPids.add(ancestor.ppid)
    ancestor = rows.find(row => row.pid === ancestor.ppid)
  }
  const selected = new Map()
  for (const row of rows) {
    if (protectedPids.has(row.pid)) continue
    const kind = localServiceKind(row, workspaceRoot, redisPid)
    if (kind) selected.set(row.pid, { ...row, kind })
  }
  // Include package-manager children, detached Vite groups and in-flight Maven builds.
  let changed = true
  while (changed) {
    changed = false
    for (const row of rows) {
      if (selected.has(row.pid) || protectedPids.has(row.pid)) continue
      const parent = selected.get(row.ppid)
      if (parent) {
        selected.set(row.pid, { ...row, kind: parent.kind })
        changed = true
      }
    }
  }
  return [...selected.values()]
}

function readPid(path) {
  try { return Number(readFileSync(path, 'utf8').trim()) }
  catch { return 0 }
}

function alive(pid) {
  if (!Number.isInteger(pid) || pid <= 1) return false
  try { process.kill(pid, 0); return true }
  catch (error) { return error.code === 'EPERM' }
}

function signalSameProcess(expected, current, signal) {
  if (!current || expected.birth !== current.birth || expected.cwd !== current.cwd) return
  try { process.kill(expected.pid, signal) }
  catch (error) { if (error.code !== 'ESRCH') throw error }
}

async function stopProcesses(targets, timeoutMs) {
  const current = new Map((await processSnapshot()).map(row => [row.pid, row]))
  for (const target of targets) signalSameProcess(target, current.get(target.pid), 'SIGTERM')
  const deadline = Date.now() + timeoutMs
  let remaining = targets
  while (remaining.length) {
    const snapshot = new Map((await processSnapshot()).map(row => [row.pid, row]))
    remaining = remaining.filter(row => snapshot.get(row.pid)?.birth === row.birth)
    if (!remaining.length) return
    if (Date.now() >= deadline) {
      for (const row of remaining) signalSameProcess(row, snapshot.get(row.pid), 'SIGKILL')
      await delay(200)
      const final = await processSnapshot()
      const stuck = remaining.filter(row => final.some(item => item.pid === row.pid && item.birth === row.birth))
      if (stuck.length) throw new Error(`以下进程未退出或归属变化，未继续强制停止：${stuck.map(row => row.pid).join(', ')}`)
      return
    }
    await delay(200)
  }
}

export async function stopLocalServices({ workspaceRoot = defaultWorkspaceRoot, dryRun = false,
  timeoutMs = 20000, log = console.log } = {}) {
  if (process.platform === 'win32') throw new Error('统一停止命令依赖 ps 和 lsof，仅支持 macOS/Linux')
  workspaceRoot = realpathSync(workspaceRoot)
  const runtime = resolve(workspaceRoot, 'backend/gaia-saas-proj/.local/runtime')
  const stopLock = resolve(runtime, 'shared-services-stop.lock')
  const redisPidFile = resolve(runtime, 'shared-redis.pid')
  let locked = false
  if (!dryRun) {
    mkdirSync(runtime, { recursive: true })
    if (existsSync(stopLock) && !alive(readPid(stopLock))) rmSync(stopLock, { force: true })
    try { writeFileSync(stopLock, String(process.pid), { flag: 'wx', mode: 0o600 }) }
    catch (error) {
      if (error.code === 'EEXIST') throw new Error('另一个 stop:afs 正在运行，请等待其完成')
      throw error
    }
    locked = true
  }
  try {
    let total = 0
    for (let pass = 0; pass <= 3; pass++) {
      const rows = await processSnapshot()
      const targets = selectLocalServiceProcesses(rows, workspaceRoot, readPid(redisPidFile))
      if (dryRun) {
        for (const row of targets) log(`[预览] ${row.kind} PID ${row.pid} (${row.cwd || '服务子进程'})`)
        log(`[stop:afs] 将停止 ${targets.length} 个当前 TOTO 工作区进程；未发送停止信号`)
        return targets
      }
      if (!targets.length) {
        for (const name of ['shared-backend-state.json', 'shared-redis.pid']) rmSync(resolve(runtime, name), { force: true })
        const startupLock = resolve(runtime, 'shared-backend-start.lock')
        try {
          if (!alive(Number(JSON.parse(readFileSync(startupLock, 'utf8')).pid))) rmSync(startupLock, { force: true })
        }
        catch (error) { if (error.code !== 'ENOENT') throw error }
        log(`[stop:afs] ${total ? '当前 TOTO 本地服务已停止' : '当前 TOTO 本地服务均未运行'}`)
        return []
      }
      if (pass === 3) throw new Error('停止过程中仍出现本工作区新进程，请查看当前启动终端后重试')
      for (const kinds of [['frontend', 'launcher'], ['backend'], ['redis']]) {
        const group = targets.filter(row => kinds.includes(row.kind))
        if (!group.length) continue
        log(`[stop:afs] 停止 ${kinds.join('/')}：PID ${group.map(row => row.pid).join(', ')}`)
        await stopProcesses(group, timeoutMs)
      }
      total += targets.length
      await delay(200)
    }
  }
  finally {
    if (locked && readPid(stopLock) === process.pid) rmSync(stopLock, { force: true })
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    if (process.argv.slice(2).some(arg => arg !== '--dry-run')) throw new Error('用法：yarn stop:afs [--dry-run]')
    await stopLocalServices({ dryRun: process.argv.includes('--dry-run') })
  }
  catch (error) {
    console.error(`[stop:afs] ${error.message}`)
    process.exitCode = 1
  }
}
