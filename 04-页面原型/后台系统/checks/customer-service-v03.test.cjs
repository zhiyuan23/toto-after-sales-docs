const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')

const root=path.resolve(__dirname,'..')
const html=fs.readFileSync(path.join(root,'customer-service-v03.html'),'utf8')
const css=fs.readFileSync(path.join(root,'customer-service-v03.css'),'utf8')
const js=fs.readFileSync(path.join(root,'customer-service-v03.js'),'utf8')

test('客服 v0.3 使用独立入口并保留现版',()=>{
  assert.match(html,/customer-service-v03\.css/)
  assert.match(html,/customer-service-v03\.js/)
  assert.match(js,/href="customer-service\.html"/)
  assert.match(js,/已保留/)
})

test('三栏工作台聚合队列、同页办理和业务上下文',()=>{
  for(const selector of ['cs3-inbox','cs3-task','cs3-context','cs3-board'])assert.match(css,new RegExp(selector))
  for(const copy of ['待办队列','当前业务上下文','顾客与联系方式','关联商品','最近服务记录'])assert.ok(js.includes(copy),`missing ${copy}`)
})

test('首屏只使用已确认的客服队列口径',()=>{
  for(const copy of ['待受理','PENDING_ACCEPTANCE','待分配服务站','待服务站派人','待完工审核','PENDING_REVIEW','待定责投诉','OPEN 队列','全部工单'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(!js.includes('满意度'))
  assert.ok(!js.includes('SLA 达标率'))
})

test('客服主要操作可在工作台内接续完成',()=>{
  for(const copy of ['识别顾客','选择购买记录','确认服务信息','创建服务工单','服务辖区候选','确认分配','服务站处理进度','完工材料核验','审核通过','退回补充','投诉核对与定责','提交定责记录'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['selectQueue','selectRecord','finishTask','startNewIntake'])assert.ok(js.includes(token),`missing ${token}`)
})

test('客服只分配服务站且不虚构实时人员数据',()=>{
  for(const copy of ['客服只分配或转服务站','站内人员安排由服务站','不展示人员实时位置','不将 OPEN 解释为全部未结投诉'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.doesNotMatch(js,/选择服务人员/)
})

test('数据可视化只表达待办分布和今日处理节奏',()=>{
  for(const copy of ['客服待办概览','今日已处理','今日处理节奏'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.match(css,/cs3-rhythm-chart/)
  assert.match(css,/cs3-queue-strip/)
})

test('键盘、深浅主题、菜单和减少动效偏好保留',()=>{
  for(const token of ['metaKey','requestFullscreen','dataset.theme','is-sidebar-collapsed'])assert.ok(js.includes(token),`missing ${token}`)
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
})
