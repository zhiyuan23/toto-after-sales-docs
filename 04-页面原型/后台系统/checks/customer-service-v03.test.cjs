const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')

const root=path.resolve(__dirname,'..')
const html=fs.readFileSync(path.join(root,'customer-service-v03.html'),'utf8')
const css=fs.readFileSync(path.join(root,'customer-service-v03.css'),'utf8')
const js=fs.readFileSync(path.join(root,'customer-service-v03.js'),'utf8')

test('客服 v0.17 使用独立入口并保留现版',()=>{
  assert.match(html,/customer-service-v03\.css/)
  assert.match(html,/customer-service-v03\.js/)
  assert.match(html,/v0\.17/)
  assert.match(js,/href="customer-service\.html"/)
  assert.match(js,/已保留/)
})

test('顶部工作视角可切换到四个角色原型',()=>{
  for(const href of ['index.html','customer-service-v03.html','service-station.html','dealer.html'])assert.match(js,new RegExp(`href="${href.replace('.','\\.')}"`),`missing ${href}`)
  for(const copy of ['四视角原型目录','总部运营','客服作业','服务站作业','门店业务','4 / 4'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.match(js,/id="perspectiveButton" aria-haspopup="dialog" aria-controls="prototypePanel"/)
})

test('双栏主工作面聚合队列、同页办理和按需上下文',()=>{
  for(const selector of ['cs3-inbox','cs3-task','cs3-context','cs3-board'])assert.match(css,new RegExp(selector))
  for(const copy of ['统一工作篮','服务上下文','顾客与联系方式','关联商品','最近服务记录'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['setContextOpen','contextToggleButton','closeContextButton','is-context-open'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
})

test('首屏只使用已确认的客服队列口径',()=>{
  for(const copy of ['待受理','PENDING_ACCEPTANCE','待分配服务站','服务站处理中','待完工审核','PENDING_REVIEW','待定责投诉','OPEN 队列','全部工单'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(!js.includes('满意度'))
  assert.ok(!js.includes('SLA 达标率'))
})

test('客服主要操作可在工作台内接续完成',()=>{
  for(const copy of ['识别顾客','选择购买记录','确认服务信息','创建服务工单','服务辖区候选','确认分配','服务站处理进度','完工材料核验','审核通过','退回补充','投诉核对与定责','提交定责记录'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['selectQueue','selectRecord','finishTask','startNewIntake'])assert.ok(js.includes(token),`missing ${token}`)
})

test('客服只分配服务站且不虚构实时人员数据',()=>{
  for(const copy of ['客服只分配或转服务站','站内人员安排由服务站','服务站操作 · 客服跟进','站内派人','服务人员','不展示人员实时位置','不将 OPEN 解释为全部未结投诉'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.doesNotMatch(js,/选择服务人员/)
})

test('首屏延展总部新版七列卡片结构并突出当前消费者',()=>{
  for(const copy of ['统一办理中','继续办理','刘女士','待受理','2 项需关注','最长等待 1 小时 28 分','待分配服务站','待完工审核','待定责投诉','新建服务','查顾客 / 工单'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['cs3-executive-deck','cs3-current-customer','cs3-current-facts','cs3-kpi-card','grid-template-columns:repeat(7','grid-column:span 2','data-kpi-count','renderCurrentCustomer'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  assert.match(css,/cs3-queue-strip/)
  assert.doesNotMatch(js,/id="newIntakeButton"/)
})

test('办理区用辅助信息栏收窄表单并随队列更新',()=>{
  for(const copy of ['办理辅助','当前等待','服务资格','活动工单','当前责任方','材料完整度','责任阶段','下一步','服务上下文'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['assistMarkup','cs3-task-workarea','cs3-task-assist','data-context-open'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) 226px/)
})

test('左侧队列展示随筛选变化的关注提示',()=>{
  for(const token of ['queueAttentionSignal','attentionCount','cs3-queue-attention'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  for(const copy of ['项需关注','无特别关注'])assert.ok(js.includes(copy),`missing ${copy}`)
})

test('工单状态流使用图标并明确岗位归属',()=>{
  for(const token of ['cs3-status-main','cs3-flow-node','cs3-flow-connector','cs3-flow-exception','is-external'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  for(const copy of ['客服操作','服务站操作 · 客服跟进','需审核权限','异常分支 · 按权限处理','工单状态总览和队列筛选'])assert.ok(js.includes(copy),`missing ${copy}`)
})

test('主流程箭头展示今日流转量而不伪造转化率',()=>{
  for(const token of ['transitionMeta','cs3-flow-metric','今日转入','今日 00:00 至当前'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  for(const count of [8,6,5])assert.match(js,new RegExp(`today:${count}`))
  assert.doesNotMatch(js,/转化率|conversionRate/)
})

test('顶部指标和状态流都支持带数字的快捷筛选',()=>{
  for(const token of ['activeQueueSummary','workbasketButton','aria-pressed','data-kpi-count','data-summary-queue','summaryQueue','data-queue'])assert.ok(js.includes(token),`missing ${token}`)
  assert.match(js,/data-summary-queue="dispatch"/)
  assert.match(js,/服务站处理中/)
  assert.match(js,/<strong>\$\{item\.total\}<\/strong>/)
  assert.doesNotMatch(js,/queueTabs/)
  assert.doesNotMatch(css,/\.cs3-tabs/)
})

test('统一工作篮可跨状态连续办理并保留单队列筛选',()=>{
  for(const copy of ['统一工作篮','统一办理','连续办理','跨状态自动接续','当前优先原因','下一项预览','稍后处理','完成后自动进入下一项授权待办'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['actionableQueueKeys','workbasketRecords','workbasketTotal','priorityReason','nextWorkItem','skipCurrentTask','activeQueue=\'workbasket\'','cs3-continuous-summary','cs3-continuous-badge'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  assert.match(js,/activeQueue!==\'workbasket\'/)
  assert.match(js,/data-summary-queue="acceptance"/)
})

test('蓝色消费者卡与第二行状态流共同表达统一办理模式',()=>{
  for(const copy of ['统一办理中','继续办理','返回统一办理','统一办理 · 跨状态','覆盖全部可办理工单状态'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['currentCustomerCard','is-workbasket-active','cs3-flow-mode-badge','classList.toggle','aria-pressed'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  assert.match(js,/card\.onclick=\(\)=>selectQueue\('workbasket'\)/)
  assert.match(css,/cs3-current-customer\[aria-pressed="true"\]/)
  assert.match(css,/cs3-queue-strip\.is-workbasket-active/)
})

test('第二行选中状态沿用顶部图标语义色并保持固定高度',()=>{
  for(const token of ['is-acceptance','is-station','is-dispatch','is-review','is-complaint','var(--cyan)','var(--amber)','var(--success)','var(--danger)'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  assert.match(css,/\.cs3-queue-strip\{[^}]*height:62px[^}]*flex:0 0 62px/)
  assert.match(css,/\.cs3-flow-mode-badge\{[^}]*position:absolute/)
  assert.doesNotMatch(css,/\.cs3-flow-mode-badge\{[^}]*grid-column/)
})

test('可见文案不使用长破折号字符',()=>{
  assert.doesNotMatch(`${html}\n${css}\n${js}`,/[—–]/)
})

test('辅助操作可在工作台内完成而非只保留跳转入口',()=>{
  for(const copy of ['顾客与工单统一查询','安装码与商品核验','服务知识库','补记沟通','保存沟通记录','带入受理'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['toolMarkup','openTool','bindToolButtons','toolDialog'])assert.ok(js.includes(token),`missing ${token}`)
  assert.match(css,/cs3-tool-dialog/)
})

test('键盘、深浅主题、菜单和减少动效偏好保留',()=>{
  for(const token of ['metaKey','requestFullscreen','dataset.theme','is-sidebar-collapsed'])assert.ok(js.includes(token),`missing ${token}`)
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
})
