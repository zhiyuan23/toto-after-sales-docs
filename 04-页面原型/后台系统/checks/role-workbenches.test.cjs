const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..')
const js=fs.readFileSync(path.join(root,'role-workbench.js'),'utf8')
const css=fs.readFileSync(path.join(root,'admin.css'),'utf8')+fs.readFileSync(path.join(root,'role-workbench.css'),'utf8')

test('客服与服务站保留旧版固定入口，门店使用独立新原型',()=>{
  const pages={
    'customer-service.html':'serviceDesk',
    'service-station.html':'station'
  }
  for(const [file,view] of Object.entries(pages)){
    const html=fs.readFileSync(path.join(root,file),'utf8')
    assert.match(html,new RegExp(`data-view="${view}"`))
    assert.match(html,/role-workbench\.js/)
    assert.match(html,/role-workbench\.css/)
  }
  const dealer=fs.readFileSync(path.join(root,'dealer.html'),'utf8')
  assert.match(dealer,/data-view="dealer"/)
  assert.match(dealer,/dealer-workbench\.js/)
  assert.match(dealer,/dealer-workbench\.css/)
  assert.doesNotMatch(dealer,/role-workbench\.js/)
})

test('原有四视角目录中的客服入口进入行动工作台',()=>{
  assert.match(js,/\['02','客服作业','状态辨识优化工作台 v0\.17','customer-service-v03\.html','serviceDesk'\]/)
})

test('客服首版队列和办理边界完整',()=>{
  for(const copy of ['待受理','PENDING_ACCEPTANCE','待派单','PENDING_DISPATCH','待完工审核','PENDING_REVIEW','待定责投诉','投诉 OPEN；不等于全部未结','顾客识别与受理'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(js.includes('完工审核只属于客服视角'))
})

test('服务站首版围绕今日履约且不推导负荷',()=>{
  for(const copy of ['今日期望服务','按期望服务日期，包含各状态','待完工','缺件工单','今日已配置排班','已配置日容量','不推断剩余工位或人员负荷'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(!configsSlice('station').includes('完工审核'))
})

test('门店首页从顾客与购买记录出发，安装状态仅用于筛选',()=>{
  const dealer=fs.readFileSync(path.join(root,'dealer.html'),'utf8')
  for(const copy of ['先找到购买记录','新增购买登记','保存购买记录本身不会创建服务工单','未申请安装','部分申请','安装状态仅供筛选，不代表顾客已提出需求','服务进度','客服安排中','服务站安排中','服务履约中'])assert.ok(dealer.includes(copy),`missing ${copy}`)
  assert.doesNotMatch(dealer,/data-record-filter="pending"|>待建单</)
  assert.doesNotMatch(dealer,/>待分站<|>待分人<|>待完工</)
})

test('客服与服务站旧版保留核心交互、状态和降级动效',()=>{
  for(const token of ['selectQueue','renderRows','openWork','openCommand','setTableState','requestFullscreen','prefers-reduced-motion'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  for(const state of ['data','loading','empty','error'])assert.match(js,new RegExp(`data-table-state=\\"${state}\\"`))
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
})

test('第二版补齐客服关键闭环和补充队列',()=>{
  for(const copy of ['待分配服务站','全部工单','识别顾客','选择购买记录','创建工单','选择服务站','审核通过','退回补充','进入待分配服务站队列'])assert.ok(js.includes(copy),`missing ${copy}`)
})

test('第二版补齐服务站提交完工和异常处理',()=>{
  for(const copy of ['选择服务人员','添加现场照片','配件耗用','提交客服审核','异常类型','后续动作','不在服务站视角执行审核'])assert.ok(js.includes(copy),`missing ${copy}`)
})

test('门店服务提交绑定购买记录和商品实例，工单只读查看',()=>{
  const dealer=fs.readFileSync(path.join(root,'dealer-workbench.js'),'utf8')
  for(const token of ['recordId: record.id','instanceId: instance.id','name="type"','name="selected-instance"','activeOrderForInstance','openOrder','submitRegistration','submitService','PENDING_DISPATCH'])assert.ok(dealer.includes(token),`missing ${token}`)
  assert.match(dealer,/type === 'INSTALLATION' && instance\.status !== 'AVAILABLE'/)
  assert.match(dealer,/安装码已登记/)
  assert.doesNotMatch(dealer,/PENDING_ACCEPTANCE|待建单|fetch\(/)
})

test('门店原型字段与当前购买登记、建单和工单查询契约一致',()=>{
  const html=fs.readFileSync(path.join(root,'dealer.html'),'utf8')
  const dealer=fs.readFileSync(path.join(root,'dealer-workbench.js'),'utf8')
  for(const token of ['data-order-filter="PENDING_DISPATCH"','data-order-filter="PENDING_ASSIGNMENT"','data-order-filter="PENDING_COMPLETION"','id="searchType"','value="mobile"','value="name"'])assert.ok(html.includes(token),`missing ${token}`)
  for(const token of ['name="storeId"','name="sourceType"','name="quantity"','name="contactName"','name="expectedTimeWindow"','name="faultId"','name="problemDescription"','name="province"','name="district"','clientRequestId'])assert.ok(dealer.includes(token),`missing ${token}`)
  assert.match(html,/当前账号授权门店/)
  assert.doesNotMatch(html,/id="storeSelect"|直营门店|data-order-filter="active"/)
})

test('办理后会更新队列数量并定位下一项',()=>{
  for(const token of ['finishWork','updateCounts','row.handled=true','highlightNext=true','当前队列已更新'])assert.ok(js.includes(token),`missing ${token}`)
  assert.match(css,/tbody tr\.is-next/)
})

test('客服只分配或转派服务站，服务站再派服务人员',()=>{
  const serviceDesk=configsSlice('serviceDesk')
  const station=configsSlice('station')
  assert.doesNotMatch(serviceDesk,/action:'派单'/)
  assert.doesNotMatch(serviceDesk,/action:'改派'/)
  assert.match(serviceDesk,/action:'转服务站'/)
  assert.match(station,/action:'派单'/)
  assert.ok(js.includes('等待站点安排人员'))
})

test('两级候选信息采用当前业务可解释的推荐依据',()=>{
  for(const copy of ['街道级辖区匹配','区域优先级 1','支持安装','距离演示','当前候选接口需补充区域、站点详情和距离字段','安装技能匹配','期望日期可用','当日已分配 2 / 日容量 6','当日容量已满','当前没有可靠的人员实时位置数据'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.match(css,/candidate-card\.is-best/)
  assert.match(css,/candidate-card\.has-conflict/)
})

test('旧版岗位工作台仍保留原状态视图',()=>{
  for(const layout of ['lanes','timeline','journey'])assert.match(js,new RegExp(`data-status-layout="${layout}"`))
  for(const copy of ['待办责任泳道','等待 42 分钟','待回访','今日任务时间轴','容量条','已排 / 已配置容量','购买记录服务轨迹','已购买','待安装','安装待受理','已安装','维修服务中'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['statusVisualMarkup','data-status-node','data-status-count','insertAdjacentHTML'])assert.ok(js.includes(token),`missing ${token}`)
  for(const selector of ['service-swimlanes','capacity-bar','task-timeline','service-track'])assert.match(css,new RegExp(selector))
})

function configsSlice(view){
  const start=js.indexOf(`${view}:{`)
  const next=js.indexOf('\n  },',start)
  return js.slice(start,next)
}
