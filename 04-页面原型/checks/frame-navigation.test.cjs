const fs=require('node:fs')
const path=require('node:path')
const vm=require('node:vm')
const test=require('node:test')
const assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..')
const catalogSource=fs.readFileSync(path.join(root,'prototype-catalog.js'),'utf8')
const controllerSource=fs.readFileSync(path.join(root,'prototype.js'),'utf8')
const perspectiveSource=fs.readFileSync(path.join(root,'perspective.js'),'utf8')

function viewer(href){
  let url=new URL(href)
  const listeners={},frames=[]
  const stage={setAttribute(){},append(frame){frames.push(frame)}}
  const loading={hidden:false,replaceChildren(){},append(){}}
  const window={addEventListener(type,fn){listeners[type]=fn}}
  const location={get hash(){return url.hash},set hash(value){url.hash=value;listeners.hashchange?.()}}
  const document={currentScript:{src:new URL('prototype-catalog.js',url).href},getElementById(id){return id==='previewStage'?stage:loading},createElement(tag){
    if(tag!=='iframe')return {}
    const frame={dataset:{},addEventListener(){},remove(){this.removed=true},contentWindow:{messages:[],postMessage(data,origin){this.messages.push({data,origin})}}}
    Object.defineProperty(frame,'contentDocument',{get(){throw new Error('Opaque file frame: parent DOM access denied')}})
    return frame
  }}
  const context={URL,window,document,location,history:{replaceState(_state,_title,hash){url.hash=hash}},setTimeout(){return 1},clearTimeout(){}}
  vm.runInNewContext(catalogSource,context)
  vm.runInNewContext(controllerSource,context)
  return {frames,url:()=>url.href,pending(hash){url.hash=hash},flush(){listeners.hashchange()},message(frame,data,origin=url.origin){listeners.message({source:frame.contentWindow,origin,data})},foreign(data){listeners.message({source:{},origin:url.origin,data})}}
}

for(const protocol of ['http://localhost:8771/','file:///prototype/']){
  test(`${protocol} 不读取子页面DOM即可切换两端，刷新保留视角与当前页`,()=>{
    const app=viewer(`${protocol}index.html#headquarters`)
    app.message(app.frames[0],{type:'toto-prototype:navigate',key:'consumer'})
    assert.equal(new URL(app.url()).hash,'#consumer/c-home')
    app.message(app.frames[1],{type:'toto-prototype:state',key:'consumer',page:'c-products'})
    const consumerReload=viewer(app.url())
    assert.equal(new URL(consumerReload.frames[0].src).hash,'#c-products')
    assert.equal(new URL(consumerReload.frames[0].src).searchParams.get('consumerVersion'),'0.17')
    app.message(app.frames[1],{type:'toto-prototype:navigate',key:'worker'})
    app.message(app.frames[2],{type:'toto-prototype:state',key:'worker',page:'w-schedule'})
    assert.equal(new URL(app.url()).hash,'#worker/w-schedule')
    const workerReload=viewer(app.url())
    assert.equal(new URL(workerReload.frames[0].src).hash,'#w-schedule')
    assert.equal(new URL(workerReload.frames[0].src).searchParams.get('consumerVersion'),'0.13')
    app.message(app.frames[2],{type:'toto-prototype:navigate',key:'consumer'})
    assert.equal(new URL(app.url()).hash,'#consumer/c-products')
    assert.equal(app.frames.length,3,'往返复用原页面')
    assert.equal(app.frames[1].contentWindow.messages.at(-1).data.page,'c-products')
  })
}

test('导航只接受已装载页面的消息，拒绝伪造来源、隐藏页与非法视角',()=>{
  const app=viewer('http://localhost:8771/index.html#headquarters')
  const frame=app.frames[0]
  app.foreign({type:'toto-prototype:navigate',key:'worker'})
  app.message(frame,{type:'toto-prototype:navigate',key:'worker'},'https://example.com')
  app.message(frame,{type:'toto-prototype:navigate',key:'javascript:alert(1)'})
  assert.equal(new URL(app.url()).hash,'#headquarters')
  app.message(frame,{type:'toto-prototype:navigate',key:'consumer'})
  app.message(frame,{type:'toto-prototype:navigate',key:'worker'})
  app.message(app.frames[1],{type:'toto-prototype:state',key:'consumer',page:'w-schedule'})
  assert.equal(new URL(app.url()).hash,'#consumer')
})

test('本地文件内的共享下拉在捕获阶段转发两端点击，不在iframe内嵌套统一入口',()=>{
  const documentListeners={},messages=[]
  const parent={postMessage(data,origin){messages.push({data,origin})}}
  const window={parent,addEventListener(){}}
  const location=new URL('file:///prototype/后台系统/当前原型/headquarters-map.html')
  const document={currentScript:{src:'file:///prototype/prototype-catalog.js'},body:{classList:{contains(){return false}}},querySelector(){return null},addEventListener(type,fn,options){if(options===true)documentListeners[type]=fn}}
  const context={URL,window,document,location}
  vm.runInNewContext(catalogSource,context)
  vm.runInNewContext(perspectiveSource,context)
  for(const key of ['consumer','worker']){
    const anchor={href:`file:///prototype/index.html#${key}`,hasAttribute(){return false}}
    let prevented=false,stopped=false
    documentListeners.click({button:0,target:{closest(){return anchor}},preventDefault(){prevented=true},stopImmediatePropagation(){stopped=true}})
    assert.ok(prevented&&stopped)
    assert.equal(messages.at(-1).data.key,key)
    assert.equal(messages.at(-1).origin,'*','opaque origin仅使用枚举视角消息')
  }
})


test('子页按钮直接跳转到专业页后，同步新入口并退役旧缓存',()=>{
  const app=viewer('file:///prototype/index.html#administrator')
  const frame=app.frames[0]
  app.message(frame,{type:'toto-prototype:state',key:'parts',page:'inventory'})
  assert.equal(new URL(app.url()).hash,'#parts/inventory')
  assert.equal(new URL(app.frames[1].src).hash,'#inventory')
  assert.equal(frame.removed,true)
})

test('小程序 replaceState 选页事件同步当前页，无须触发 hashchange',()=>{
  const handlers={},messages=[]
  const window={parent:{postMessage(data){messages.push(data)}},addEventListener(){}}
  const location=new URL('file:///prototype/小程序/当前原型/index.html?consumerVersion=0.13#w-tasks')
  const document={currentScript:{src:'file:///prototype/prototype-catalog.js'},body:{classList:{contains(){return false}}},querySelector(){return null},addEventListener(type,fn){handlers[type]=fn}}
  const context={URL,window,document,location}
  vm.runInNewContext(catalogSource,context)
  vm.runInNewContext(perspectiveSource,context)
  location.hash='w-schedule'
  handlers['toto-prototype-pagechange']()
  assert.equal(messages.at(-1).key,'worker')
  assert.equal(messages.at(-1).page,'w-schedule')
})

test('本地文件消息支持 file:// 序列化，同时仍拒绝非已装载窗口',()=>{
  const app=viewer('file:///prototype/index.html#headquarters')
  app.message(app.frames[0],{type:'toto-prototype:navigate',key:'worker'},'file://')
  assert.equal(new URL(app.url()).hash,'#worker/w-tasks')
  app.message(app.frames[1],{type:'toto-prototype:state',key:'worker',page:'w-schedule'},'file://')
  assert.equal(new URL(app.url()).hash,'#worker/w-schedule')
  app.foreign({type:'toto-prototype:navigate',key:'consumer'})
  assert.equal(new URL(app.url()).hash,'#worker/w-schedule')
})

test('原生顶层链接不被点击处理取消，切换不依赖消息投递',()=>{
  const handlers={},messages=[]
  const window={parent:{postMessage(data){messages.push(data)}},addEventListener(){}}
  const location=new URL('file:///prototype/后台系统/当前原型/headquarters-map.html')
  const document={currentScript:{src:'file:///prototype/prototype-catalog.js'},body:{classList:{contains(){return false}}},querySelector(){return null},addEventListener(type,fn,capture){if(capture===true)handlers[type]=fn}}
  const context={URL,window,document,location}
  vm.runInNewContext(catalogSource,context)
  vm.runInNewContext(perspectiveSource,context)
  const before=messages.length
  for(const key of ['administrator','consumer','worker']){
    const anchor={target:'_top',href:`file:///prototype/index.html#${key}`,hasAttribute(){return false}}
    handlers.click({button:0,target:{closest(){return anchor}},preventDefault(){assert.fail('不应取消原生顶层导航')},stopImmediatePropagation(){assert.fail('不应拦截原生链接')}})
  }
  assert.equal(messages.length,before,'链接不依赖postMessage')
})


test('旧页延迟状态不能覆盖已经请求的新视角地址',()=>{
  const app=viewer('file:///prototype/index.html#headquarters')
  app.pending('#consumer')
  app.message(app.frames[0],{type:'toto-prototype:state',key:'headquarters',page:''},'file://')
  assert.equal(new URL(app.url()).hash,'#consumer')
  app.flush()
  assert.equal(new URL(app.frames[1].src).hash,'#c-home')
})
