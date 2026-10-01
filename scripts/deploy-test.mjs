#!/usr/bin/env node
import { spawn, execFileSync } from 'node:child_process'
import { createHash, randomBytes } from 'node:crypto'
import { closeSync, cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, openSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const docs = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const workspace = resolve(docs, '../..')
const support = join(docs, 'scripts/deploy-test')
const host = '10.1.1.53'
const remoteBase = '/yundata/saas_test'
const httpUrl = `http://${host}:8011`
// Public key recorded in the deployment guide; a change must be investigated explicitly.
const hostKey = 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAINfb846DmE/iAOYcVviSTE1nCn+zbUYA1tFZrb5jruVb'
export const HOST_FINGERPRINT = 'SHA256:32uCUmbKNWdximqXT8HzyEktQDv7WlZIKkSGxvBdGnI'
const repositories = ['backend/gaia-after-sales', 'backend/gaia-saas-proj', 'frontend/gaia-ui']
const generatedTypes = /(?:^|\/)apps\/after-sales\/src\/types\/(?:auto-imports|components|env)\.d\.ts$/
let aborted = false, activeChild
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))
const save = (path, value) => writeFileSync(path, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 })

export function parseOptions(args) {
  if (!args.length || args.length === 1 && ['--help', '-h'].includes(args[0])) return { mode: 'help' }
  let mode, release, allowKnown = false
  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (['--check', '--deploy', '--status'].includes(arg)) {
      if (mode) throw new Error('只能选择一种执行模式')
      mode = arg.slice(2)
      if (mode === 'status') release = args[++i]
    } else if (arg === '--allow-known-web-failures') allowKnown = true
    else throw new Error(`未知参数：${arg}`)
  }
  if (!mode || mode === 'status' && !/^\d{14}-[a-f0-9]{8}$/.test(release || '')) throw new Error('缺少执行模式或发布编号无效')
  if (allowKnown && mode !== 'deploy') throw new Error('测试例外仅用于部署模式')
  return { mode, release, allowKnown }
}

export function parseCredentials(text) {
  const values = {}
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith('#')) continue
    const match = /^(?:export\s+)?(TOTO_TEST_[A-Z_]+)=(.*)$/.exec(line.trim())
    if (!match || Object.hasOwn(values, match[1])) throw new Error('测试环境凭据文件格式错误')
    let value = match[2].trim()
    if (/^['"]/.test(value)) {
      if (value.at(-1) !== value[0]) throw new Error('测试环境凭据引号不匹配')
      value = value.slice(1, -1)
    }
    if (/[\r\n\0]/.test(value)) throw new Error('测试环境配置包含无效控制字符')
    values[match[1]] = value
  }
  if (!values.TOTO_TEST_SSH_PASSWORD || values.TOTO_TEST_SSH_HOST !== host || values.TOTO_TEST_SSH_USER !== 'root' || values.TOTO_TEST_HTTP_URL?.replace(/\/$/, '') !== httpUrl) throw new Error('凭据必须对应已固定的 TOTO 测试环境')
  return values
}

export function knownFailureMatch(log, baseline) {
  const clean = log.replace(/\x1b\[[0-9;]*m/g, '')
  const failures = [...new Set([...clean.matchAll(/^✖ (.*?) \([\d.]+ms\)$/gm)].map(m => m[1]))].sort()
  const counts = [...clean.matchAll(/^ℹ fail (\d+)$/gm)]
  return failures.length > 0 && counts.length === 1 && Number(counts[0][1]) === failures.length
    && JSON.stringify(failures) === JSON.stringify([...baseline.failures].sort())
}

function git(directory, args) {
  return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
}

// Hash current tracked and non-ignored untracked inputs; preserve all existing changes.
export function snapshot(directory) {
  const commit = git(directory, ['rev-parse', 'HEAD']).trim()
  const status = git(directory, ['status', '--porcelain=v1'])
  const files = git(directory, ['ls-files', '-z', '--cached', '--others', '--exclude-standard']).split('\0').filter(Boolean).sort()
  const digest = createHash('sha256')
  for (const file of files) {
    if (generatedTypes.test(file)) continue
    const path = join(directory, file)
    digest.update(file + '\0')
    if (!existsSync(path)) { digest.update('deleted\0'); continue }
    const stat = lstatSync(path)
    if (stat.isFile()) digest.update(readFileSync(path))
    // Git submodules, including protected common pages, are inspected read-only.
    else if (stat.isDirectory()) digest.update(JSON.stringify(snapshot(path)))
    else throw new Error('构建输入包含未支持的链接：' + file)
    digest.update('\0')
  }
  return { commit, status, fingerprint: digest.digest('hex'), upstream: git(directory, ['status', '--short', '--branch']).split('\n')[0] }
}

export function sourceUnchanged(before, after) {
  return Object.keys(before).every(repo => before[repo].commit === after[repo]?.commit && before[repo].fingerprint === after[repo]?.fingerprint)
}

async function run(command, args, { cwd = docs, env = process.env, log, allowFailure = false, secret = '' } = {}) {
  if (aborted) throw new Error('本地执行已取消；若服务器事务已启动，请按发布编号查询状态')
  let output = ''
  const child = spawn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'] })
  activeChild = child
  const append = chunk => { output += chunk.toString() }
  child.stdout.on('data', append)
  child.stderr.on('data', append)
  const code = await new Promise((resolve, reject) => {
    child.once('error', reject)
    child.once('close', (code, signal) => resolve(signal ? -1 : code))
  })
  activeChild = undefined
  if (secret) output = output.split(secret).join('<redacted>')
  if (log) writeFileSync(log, output, { mode: 0o600 })
  if (code !== 0 && !allowFailure) throw new Error(`${command} 退出码 ${code}${log ? '；日志：' + log : ''}`)
  return { code, output }
}

async function execute(options) {
  if (process.platform === 'win32') throw new Error('此脚本支持 macOS／Linux；Windows 请使用 WSL 工作区')
  const credentialsFile = join(docs, '.local/test-server.env')
  if (lstatSync(credentialsFile).mode & 0o077) throw new Error('凭据文件须仅当前用户可读写（chmod 600）')
  const credentials = parseCredentials(readFileSync(credentialsFile, 'utf8'))
  const secret = credentials.TOTO_TEST_SSH_PASSWORD
  const keyFingerprint = 'SHA256:' + createHash('sha256').update(Buffer.from(hostKey.split(' ')[1], 'base64')).digest('base64').replace(/=+$/, '')
  if (keyFingerprint !== HOST_FINGERPRINT) throw new Error('脚本中的服务器公钥指纹不匹配')
  const temporary = mkdtempSync(join(tmpdir(), 'toto-test-deploy-'))
  const knownHosts = join(temporary, 'known_hosts')
  writeFileSync(knownHosts, `${host} ${hostKey}\n`, { mode: 0o600 })
  const sshOptions = ['-o', `UserKnownHostsFile=${knownHosts}`, '-o', 'GlobalKnownHostsFile=/dev/null', '-o', 'StrictHostKeyChecking=yes', '-o', 'HostKeyAlgorithms=ssh-ed25519', '-o', 'ConnectTimeout=12', '-o', 'ServerAliveInterval=15', '-o', 'ServerAliveCountMax=3']
  const connectionEnv = { ...process.env, TOTO_TEST_SSH_PASSWORD: secret }
  const connect = (program, args, log) => run('expect', [join(support, 'ssh.exp'), program, ...sshOptions, ...args], { env: connectionEnv, secret, log })
  const ssh = (command, log) => connect('ssh', [`root@${host}`, command], log)
  const localSources = () => Object.fromEntries(repositories.map(repo => [repo, snapshot(join(workspace, repo))]))
  let localLock, ownsLock = false
  try {
    if (options.mode === 'status') {
      const result = await ssh(`cat ${remoteBase}/packages/${options.release}/status.json`)
      console.log(JSON.stringify(JSON.parse(result.output.trim()), null, 2))
      return
    }
    const sources = localSources()
    console.log('源码快照：', Object.fromEntries(Object.entries(sources).map(([repo, state]) => [repo, { commit: state.commit.slice(0, 8), workingChanges: Boolean(state.status), upstream: state.upstream }])))
    for (const command of ['mvn', 'java', 'python3', 'expect', 'ssh', 'scp']) await run(command, command === 'java' ? ['-version'] : command === 'mvn' ? ['-version'] : command === 'python3' ? ['--version'] : command === 'expect' ? ['-v'] : ['-V'], { allowFailure: command === 'scp' })
    const { resolveNodeToolchain, rootNodeVersion, afterSalesNodeVersion } = await import(pathToFileURL(join(workspace, 'frontend/gaia-ui/scripts/frontends/toolchains.mjs')))
    const mainToolchain = resolveNodeToolchain(rootNodeVersion, 'Gaia 主站')
    const childToolchain = resolveNodeToolchain(afterSalesNodeVersion, '售后子站')
    childToolchain.env = { ...childToolchain.env, COREPACK_ENABLE_NETWORK: '0' }
    const childPackage = join(workspace, 'frontend/gaia-ui/apps/after-sales')
    const expectedPnpm = JSON.parse(readFileSync(join(childPackage, 'package.json'), 'utf8')).engines.pnpm
    const pnpmVersion = (await run('corepack', ['pnpm', '--version'], { cwd: childPackage, env: childToolchain.env })).output.trim()
    if (pnpmVersion !== expectedPnpm) throw new Error(`售后 pnpm 版本须为 ${expectedPnpm}，当前为 ${pnpmVersion}`)
    let javaHome = process.env.JAVA_HOME
    if (process.platform === 'darwin') javaHome = (await run('/usr/libexec/java_home', ['-v', '21'])).output.trim()
    const javaEnv = { ...process.env, ...(javaHome ? { JAVA_HOME: javaHome, PATH: join(javaHome, 'bin') + ':' + process.env.PATH } : {}) }
    const javaVersion = (await run('java', ['-version'], { env: javaEnv })).output
    if (!/version "21\./.test(javaVersion)) throw new Error('后端构建需要 JDK 21')
    // Execute the checked-in read-only probe through stdin-like shell content, without uploading.
    const helper = readFileSync(join(support, 'support.py'), 'utf8')
    const probe = JSON.parse((await ssh(`python3 - probe <<'TOTO_PROBE_PY'\n${helper}\nTOTO_PROBE_PY`)).output.trim())
    console.log(`预检通过：${httpUrl}，Tomcat PID ${probe.pid}，配置及测试库已核对`)
    if (options.mode === 'check') return

    const releaseId = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date()).replace(/\D/g, '') + '-' + randomBytes(4).toString('hex')
    const release = join(docs, '.local/verification-artifacts/deploy-test', releaseId)
    mkdirSync(release, { recursive: true, mode: 0o700 })
    localLock = join(docs, '.local/deploy-test.lock')
    // An exclusive local lock prevents simultaneous builds from racing on shared targets.
    const fd = openSync(localLock, 'wx', 0o600)
    ownsLock = true
    writeFileSync(fd, JSON.stringify({ pid: process.pid, release: releaseId }))
    closeSync(fd)
    const manifestFile = join(release, 'manifest.json')
    save(manifestFile, { release: releaseId, sources, remote: probe, target: httpUrl, knownWebFailures: false })
    const build = async (label, command, args, cwd, env) => {
      console.log(`[${releaseId}] ${label}`)
      return run(command, args, { cwd, env, log: join(release, label + '.log') })
    }
    await build('after-sales-build', 'mvn', ['-B', '-pl', 'gaia-after-sales-api', '-am', 'clean', 'install', '-DskipTests'], join(workspace, repositories[0]), javaEnv)
    await build('host-build', 'mvn', ['-B', '-pl', 'gaia-saas-web', '-am', 'package', '-DskipTests'], join(workspace, repositories[1]), javaEnv)
    const web = join(workspace, repositories[2])
    const child = join(web, 'apps/after-sales')
    console.log(`[${releaseId}] web-check`)
    const check = await run('corepack', ['pnpm', '--ignore-workspace', 'run', 'check'], { cwd: child, env: childToolchain.env, log: join(release, 'web-check.log'), allowFailure: true })
    if (check.code !== 0) {
      const baseline = JSON.parse(readFileSync(join(support, 'web-test-baseline.json'), 'utf8'))
      if (check.code < 0 || !options.allowKnown || !knownFailureMatch(check.output, baseline)) throw new Error('Web 完整检查未通过；新增／未知失败禁止发布。见 ' + join(release, 'web-check.log'))
      const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'))
      manifest.knownWebFailures = { baseline: baseline.source, count: baseline.failures.length }
      save(manifestFile, manifest)
      console.log(`已显式采用既有 Web 测试例外：${baseline.failures.length} 项；完整门禁未通过`)
    }
    await build('main-build', 'node', ['--max_old_space_size=6144', 'node_modules/vite/bin/vite.js', 'build', '--mode', 'productionSAAS'], web, mainToolchain.env)
    await build('child-build', 'node', ['node_modules/vite/bin/vite.js', 'build', '--mode', 'production'], child, childToolchain.env)
    await build('bundle-check', 'node', ['scripts/check-bundle-size.mjs'], child, childToolchain.env)
    rmSync(join(web, 'dist/after-sales'), { recursive: true, force: true })
    cpSync(join(child, 'dist'), join(web, 'dist/after-sales'), { recursive: true })
    await build('dist-check', 'node', ['scripts/frontends/verify-dist.mjs'], web, mainToolchain.env)
    if (!sourceUnchanged(sources, localSources())) throw new Error('构建期间源码已改变，停止发布；请从当前源码重新执行')
    await run('python3', [join(support, 'support.py'), 'package', join(workspace, 'backend/gaia-saas-proj/gaia-saas-web/target/gaia-saas-web.war'), join(web, 'dist'), release, ...['api', 'core'].map(module => join(workspace, `backend/gaia-after-sales/gaia-after-sales-${module}/target/gaia-after-sales-${module}-3.0-SNAPSHOT.jar`))])
    const stage = `${remoteBase}/packages/${releaseId}`
    await ssh(`mkdir -m 700 ${stage}`)
    console.log(`[${releaseId}] 上传完整制品`)
    await connect('scp', [join(release, 'gaia-saas-web.war'), join(release, 'root-dist.tar.gz'), manifestFile, join(support, 'support.py'), join(support, 'remote.sh'), `root@${host}:${stage}/`], join(release, 'upload.log'))
    if (!sourceUnchanged(sources, localSources())) throw new Error('上传期间源码已改变，未执行应用切换；请重新构建')
    // Detach the server transaction: losing the SSH connection must not interrupt rollback.
    await ssh(`nohup bash ${stage}/remote.sh ${releaseId} >${stage}/deployment.log 2>&1 </dev/null &`, join(release, 'launch.log'))
    console.log(`[${releaseId}] 服务器独立执行发布；断线后用 --status ${releaseId} 查询，勿重复发布`)
    const deadline = Date.now() + 20 * 60 * 1000
    let lastState = ''
    while (Date.now() < deadline) {
      await sleep(10000)
      const result = await ssh(`cat ${stage}/status.json`, join(release, 'status.log'))
      const state = JSON.parse(result.output.trim())
      save(join(release, 'status.json'), state)
      if (state.state !== lastState) { console.log(`[${releaseId}] ${state.state}`); lastState = state.state }
      if (['FAILED', 'ROLLED_BACK', 'NEEDS_ATTENTION'].includes(state.state)) throw new Error(`发布状态 ${state.state}；备份 ${remoteBase}/backups/${releaseId}`)
      if (state.state !== 'COMPLETE') continue
      await connect('scp', [`root@${host}:${stage}/manifest.json`, join(release, 'published-manifest.json')], join(release, 'manifest-download.log'))
      await run('python3', [join(support, 'support.py'), 'http', join(release, 'published-manifest.json'), httpUrl], { log: join(release, 'http-check.log') })
      console.log(`部署完成：${httpUrl}\n备份：${remoteBase}/backups/${releaseId}\n证据：${release}\n后端构建跳过测试；登录后岗位及微信验收需另行执行。`)
      return
    }
    throw new Error(`等待超时，服务端可能仍在执行；用 --status ${releaseId} 核对，不要重复切换`)
  } finally {
    if (ownsLock) rmSync(localLock, { force: true })
    rmSync(temporary, { recursive: true, force: true })
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => { aborted = true; activeChild?.kill('SIGTERM') })
  try {
    const options = parseOptions(process.argv.slice(2))
    if (options.mode === 'help') console.log('TOTO 测试环境部署（macOS／Linux，固定 10.1.1.53）\n  node scripts/deploy-test.mjs --check\n  node scripts/deploy-test.mjs --deploy [--allow-known-web-failures]\n  node scripts/deploy-test.mjs --status <发布编号>\n不会拉取／提交／推送代码、迁移数据库或发布小程序。')
    else await execute(options)
  } catch (error) {
    console.error('部署未确认完成：' + error.message)
    process.exitCode = 1
  }
}
