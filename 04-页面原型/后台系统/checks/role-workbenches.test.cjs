const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..')
const js=fs.readFileSync(path.join(root,'role-workbench.js'),'utf8')
const css=fs.readFileSync(path.join(root,'admin.css'),'utf8')+fs.readFileSync(path.join(root,'role-workbench.css'),'utf8')

test('三个角色原型都有独立固定入口',()=>{
  const pages={
    'customer-service.html':'serviceDesk',
    'service-station.html':'station',
    'dealer.html':'dealer'
  }
  for(const [file,view] of Object.entries(pages)){
    const html=fs.readFileSync(path.join(root,file),'utf8')
    assert.match(html,new RegExp(`data-view="${view}"`))
    assert.match(html,/role-workbench\.js/)
    assert.match(html,/role-workbench\.css/)
  }
})

test('客服首版队列和办理边界完整',()=>{
  for(const copy of ['待受理','PENDING_ACCEPTANCE','待派单','PENDING_DISPATCH','待完工审核','PENDING_REVIEW','待定责投诉','投诉 OPEN；不等于全部未结','顾客识别与受理'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(js.includes('完工审核只属于客服视角'))
})

test('服务站首版围绕今日履约且不推导负荷',()=>{
  for(const copy of ['今日期望服务','按期望服务日期，包含各状态','待完工','缺件工单','今日已配置排班','已配置日容量','不推断剩余工位或人员负荷'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(!configsSlice('station').includes('完工审核'))
})

test('门店首版按购买记录统计并同页办理',()=>{
  for(const copy of ['未申请安装','NOT_APPOINTED','部分申请安装','PARTIALLY_APPOINTED','全部购买记录','按购买记录统计，不是商品件数','开始购买登记','发起服务'])assert.ok(js.includes(copy),`missing ${copy}`)
})

test('三个原型具备核心交互、状态和降级动效',()=>{
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

test('第二版明确门店从购买记录统一发起安装或维修',()=>{
  for(const copy of ['选择购买记录','选择商品实例','选择服务类型','服务申请建单','提交并创建工单','INSTALLATION / REPAIR','PENDING_ACCEPTANCE','门店不分站、不派人'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.match(js,/name="dealer-service-type"/)
  assert.doesNotMatch(js,/data-work-action="代客报修"/)
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

test('三个岗位工作台使用不重复指标卡的独立状态视图',()=>{
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
