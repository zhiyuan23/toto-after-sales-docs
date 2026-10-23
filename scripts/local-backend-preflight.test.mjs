import assert from 'node:assert/strict'
import { createServer } from 'node:net'
import test from 'node:test'
import { mysqlEndpoint, probeMysqlGreeting } from './local-backend-preflight.mjs'

test('extracts only the MySQL endpoint, never credentials or query parameters', () => {
  assert.deepEqual(mysqlEndpoint('# spring.datasource.url=ignored\nspring.datasource.url=jdbc:mysql://10.1.1.106:3306/db?password=hidden'), { host: '10.1.1.106', port: 3306 })
  assert.throws(() => mysqlEndpoint('spring.datasource.url=jdbc:mysql://user:hidden@host/db'), /标准 MySQL/)
})

async function serverProbe(handler, action) {
  const sockets = new Set()
  const server = createServer(socket => { sockets.add(socket); socket.on('close', () => sockets.delete(socket)); handler(socket) })
  await new Promise(done => server.listen(0, '127.0.0.1', done))
  try { await action({ host: '127.0.0.1', port: server.address().port }) }
  finally { for (const socket of sockets) socket.destroy(); await new Promise(done => server.close(done)) }
}

test('accepts a fragmented MySQL greeting without sending authentication bytes', async () => {
  await serverProbe(socket => {
    socket.on('data', () => assert.fail('preflight must not log in'))
    socket.write(Buffer.from([1, 0, 0]))
    setTimeout(() => socket.end(Buffer.from([0, 10])), 10)
  }, endpoint => probeMysqlGreeting(endpoint, 500))
})

test('an open TCP port without a MySQL greeting fails promptly with VPN guidance', async () => {
  await serverProbe(() => {}, endpoint => assert.rejects(probeMysqlGreeting(endpoint, 40), /VPN／路由/))
})

test('rejects an unrelated service and a connection closed before handshake', async () => {
  await serverProbe(socket => socket.end('HTTP/1.1'), endpoint => assert.rejects(probeMysqlGreeting(endpoint), /MySQL 协议握手/))
  await serverProbe(socket => socket.end(), endpoint => assert.rejects(probeMysqlGreeting(endpoint), /握手前连接关闭/))
})
