const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const test=require('node:test')
const assert=require('node:assert/strict')
const source=fs.readFileSync(path.join(__dirname,'..','prototype-catalog.js'),'utf8')
const sandbox={URL,window:{},document:{currentScript:{src:'http://localhost:8771/prototype-catalog.js'}}}
vm.runInNewContext(source,sandbox)
const catalog=sandbox.window.TOTO_PROTOTYPE_CATALOG

test('同一小程序路径按端和版本解析，保持人员端唯一基线',()=>{
  const resolve=value=>catalog.resolveView(new URL(value,catalog.root))
  assert.equal(resolve('小程序/index.html?consumerVersion=0.17#c-home'),'consumer')
  assert.equal(resolve('小程序/index.html?consumerVersion=0.13#c-mine'),'consumer-013')
  assert.equal(resolve('小程序/index.html?consumerVersion=0.13#w-tasks'),'worker')
  assert.equal(resolve('小程序/index.html?consumerVersion=0.13&prototypeRevision=20261019-native-header-1#w-tasks'),'worker')
  assert.equal(resolve('小程序/index.html#c-service'),'consumer-014')
})

test('旧总部入口只解析为最新视角，外部来源不接管',()=>{
  assert.equal(catalog.resolveView(new URL('index.html#headquarters-classic',catalog.root)),'headquarters')
  assert.equal(catalog.resolveView(new URL('后台系统/index.html',catalog.root)),'headquarters')
  assert.equal(catalog.resolveView(new URL('https://example.com/index.html#administrator')),undefined)
})

test('专业页继续显示所属视角，小程序方案显示消费者端',()=>{
  assert.equal(catalog.perspectiveFor('quality'),'headquarters')
  assert.equal(catalog.perspectiveFor('parts'),'station')
  assert.equal(catalog.perspectiveFor('consumer-brand'),'consumer')
  assert.equal(catalog.perspectiveFor('consumer-011'),'consumer')
})


test('统一地址解析内部页面并拒绝跨端或未知页签',()=>{
  assert.equal(catalog.resolveView(new URL('index.html#worker/w-schedule',catalog.root)),'worker')
  const route=catalog.parseRoute('#consumer/c-brand-catalog')
  assert.equal(route.key,'consumer')
  assert.equal(route.page,'c-brand-catalog')
  assert.equal(catalog.parseRoute('#consumer/w-schedule').page,'')
  assert.equal(catalog.parseRoute('#parts/inventory').page,'inventory')
  assert.equal(catalog.parseRoute('#parts/unknown').page,'')
})

test('HTTP来源保持精确校验，file来源兼容两种浏览器序列化',()=>{
  assert.equal(catalog.acceptsMessageOrigin('null'),false)
  assert.equal(catalog.acceptsMessageOrigin('file://'),false)
  assert.equal(catalog.acceptsMessageOrigin('http://localhost:8771'),true)
  const local={URL,window:{},document:{currentScript:{src:'file:///prototype/prototype-catalog.js'}}}
  vm.runInNewContext(source,local)
  assert.equal(local.window.TOTO_PROTOTYPE_CATALOG.acceptsMessageOrigin('null'),true)
  assert.equal(local.window.TOTO_PROTOTYPE_CATALOG.acceptsMessageOrigin('file://'),true)
  assert.equal(local.window.TOTO_PROTOTYPE_CATALOG.acceptsMessageOrigin('https://example.com'),false)
})
