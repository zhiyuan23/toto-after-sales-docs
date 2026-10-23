import { readFileSync } from 'node:fs'
import { createConnection } from 'node:net'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export function mysqlEndpoint(properties) {
  const line = properties.split(/\r?\n/).filter(value => /^\s*spring\.datasource\.url\s*=/.test(value)).at(-1)
  const match = line?.match(/=\s*jdbc:mysql:\/\/([\w.-]+|\[[\da-fA-F:]+\])(?::(\d+))?\//)
  if (!match) throw new Error('本地预检需要 .local/application.properties 中的标准 MySQL spring.datasource.url')
  const port = Number(match[2] || 3306)
  if (port < 1 || port > 65535) throw new Error('本地 MySQL 端口配置无效')
  return { host: match[1].replace(/^\[|\]$/g, ''), port }
}

export function probeMysqlGreeting({ host, port }, timeoutMs = 5000) {
  return new Promise((done, reject) => {
    const socket = createConnection({ host, port })
    let greeting = Buffer.alloc(0)
    let settled = false
    // This is an absolute deadline, not an inactivity timeout reset by incoming bytes.
    const timer = setTimeout(() => finish(new Error('握手超时')), timeoutMs)
    const finish = error => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      socket.destroy()
      if (error) reject(new Error(`MySQL ${host}:${port} 预检失败（${error.code || error.message}）；请检查内网 VPN／路由，尚未执行 Maven 构建。`))
      else done()
    }
    socket.on('data', chunk => {
      greeting = Buffer.concat([greeting, chunk])
      if (greeting.length >= 5) finish(greeting[3] === 0 && greeting[4] === 10 ? null : new Error('未收到 MySQL 协议握手'))
    })
    socket.once('error', finish)
    socket.once('end', () => { if (greeting.length < 5) finish(new Error('握手前连接关闭')) })
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const endpoint = mysqlEndpoint(readFileSync(process.argv[2], 'utf8'))
    await probeMysqlGreeting(endpoint)
    console.log(`[backend] MySQL ${endpoint.host}:${endpoint.port} 握手预检通过（未登录／写入数据库）`)
  }
  catch (error) { console.error(error.message); process.exitCode = 1 }
}
