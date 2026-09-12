import fs from 'node:fs'
import path from 'node:path'

const outDir = 'E:/workspace/toto-after-sales-docs/outputs/2026-09-11-network-channel-v2'
const devtoolsBase = `http://127.0.0.1:${process.env.CDP_PORT || '9223'}`
const username = process.env.AFS_TEST_USER || 'admin'
const password = process.env.AFS_TEST_PASSWORD || ''
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

async function waitDevtools() {
  for (let index = 0; index < 60; index += 1) {
    try {
      const response = await fetch(`${devtoolsBase}/json/version`)
      if (response.ok) return
    } catch {
      // keep waiting
    }
    await sleep(500)
  }
  throw new Error('Chrome DevTools endpoint did not start')
}

async function newTarget(url) {
  let response = await fetch(`${devtoolsBase}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' })
  if (!response.ok) response = await fetch(`${devtoolsBase}/json/new?${encodeURIComponent(url)}`)
  if (!response.ok) throw new Error(`create target failed: ${response.status}`)
  return response.json()
}

async function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  await new Promise((resolve, reject) => {
    ws.addEventListener('open', resolve, { once: true })
    ws.addEventListener('error', reject, { once: true })
  })
  let id = 0
  const pending = new Map()
  ws.addEventListener('message', event => {
    const message = JSON.parse(event.data)
    if (!message.id || !pending.has(message.id)) return
    const callbacks = pending.get(message.id)
    pending.delete(message.id)
    if (message.error) callbacks.reject(new Error(`${message.error.message || 'CDP error'} ${JSON.stringify(message.error)}`))
    else callbacks.resolve(message.result || {})
  })
  return {
    send(method, params = {}) {
      const callId = ++id
      ws.send(JSON.stringify({ id: callId, method, params }))
      return new Promise((resolve, reject) => pending.set(callId, { resolve, reject }))
    },
    close() {
      ws.close()
    },
  }
}

async function evalValue(cdp, expression, timeout = 30000) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
    timeout,
  })
  if (result.exceptionDetails) throw new Error(JSON.stringify(result.exceptionDetails))
  return result.result?.value
}

async function navigate(cdp, url) {
  await cdp.send('Page.navigate', { url })
  await sleep(2500)
}

async function waitForText(cdp, expected, timeout = 25000) {
  const startedAt = Date.now()
  let text = ''
  while (Date.now() - startedAt < timeout) {
    text = await evalValue(cdp, 'document.body ? document.body.innerText : ""')
    if (String(text).includes(expected)) return String(text)
    await sleep(800)
  }
  throw new Error(`timeout waiting for text ${expected}; last text=${String(text).slice(0, 500)}`)
}

async function waitForReady(cdp, title, readyText, timeout = 35000) {
  const startedAt = Date.now()
  let text = ''
  while (Date.now() - startedAt < timeout) {
    text = await evalValue(cdp, 'document.body ? document.body.innerText : ""')
    const source = String(text)
    if (source.includes(title) && source.includes(readyText) && !source.includes('暂无访问权限')) return source
    await sleep(800)
  }
  throw new Error(`timeout waiting for page ready ${title}/${readyText}; last text=${String(text).slice(0, 500)}`)
}

async function screenshot(cdp, name) {
  const shot = await cdp.send('Page.captureScreenshot', {
    format: 'png',
    fromSurface: true,
    captureBeyondViewport: false,
  })
  fs.writeFileSync(path.join(outDir, `${name}.png`), Buffer.from(shot.data, 'base64'))
}

async function main() {
  if (!password) throw new Error('AFS_TEST_PASSWORD is required')
  await waitDevtools()
  const target = await newTarget('http://localhost:7004/after-sales/#/login')
  const cdp = await connect(target.webSocketDebuggerUrl)
  await cdp.send('Page.enable')
  await cdp.send('Runtime.enable')
  await cdp.send('Network.enable')
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1440,
    height: 1100,
    deviceScaleFactor: 1,
    mobile: false,
  })

  await navigate(cdp, 'http://localhost:7004/after-sales/#/login')
  await waitForText(cdp, '登录', 40000).catch(() => {})
  const login = await evalValue(cdp, `
    (async () => {
      const captcha = await fetch('/api/sys/passport/captcha?userName=${username}', { credentials: 'same-origin', cache: 'no-store' }).then(r => r.json());
      const form = new FormData();
      form.append('username', '${username}');
      form.append('password', '${password}');
      form.append('verificationCode', '');
      const body = await fetch('/api/sys/passport/login', { method: 'POST', body: form, credentials: 'same-origin' }).then(r => r.json());
      if (body.code !== 0) return { ok: false, code: body.code, errMsg: body.errMsg };
      localStorage.setItem('loginDate', JSON.stringify(body.data));
      localStorage.setItem('token', crypto.randomUUID());
      localStorage.setItem('afterSales:account', '${username}');
      return { ok: true, code: body.code, captchaCode: captcha.code, hasUser: !!body.data };
    })()
  `, 60000)
  if (!login.ok) throw new Error(`login failed ${JSON.stringify(login)}`)

  const pages = [
    ['dealer', 'http://localhost:7004/after-sales/#/network/dealer', '代理商管理', '新增代理商'],
    ['store', 'http://localhost:7004/after-sales/#/network/store', '门店管理', '新增门店'],
    ['service-station', 'http://localhost:7004/after-sales/#/network/serviceStation', '服务站管理', '新增服务站'],
    ['service-area', 'http://localhost:7004/after-sales/#/network/serviceArea', '服务区域', '新增服务区域'],
    ['dictionary', 'http://localhost:7004/after-sales/#/dataCenter/dictionary', '字典管理', '新增字典'],
  ]
  const results = []
  for (const [name, url, expected, readyText] of pages) {
    await navigate(cdp, url)
    const text = await waitForReady(cdp, expected, readyText, 45000)
    await sleep(800)
    await screenshot(cdp, name)
    results.push({
      name,
      url,
      expected,
      found: true,
      textSample: text.replace(/\s+/g, ' ').slice(0, 300),
      screenshot: path.join(outDir, `${name}.png`).replace(/\\/g, '/'),
    })
  }
  fs.writeFileSync(path.join(outDir, 'page-smoke-result.json'), JSON.stringify({
    testedAt: new Date().toISOString(),
    login,
    pages: results,
  }, null, 2), 'utf8')
  cdp.close()
  console.log(JSON.stringify({ ok: true, pages: results.map(row => ({
    name: row.name,
    found: row.found,
    screenshot: row.screenshot,
  })) }))
}

main().catch(error => {
  console.error(error.stack || error.message)
  process.exit(1)
})
