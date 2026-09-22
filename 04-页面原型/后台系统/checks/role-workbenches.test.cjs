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

test('门店首页以购买登记为主任务，代客建单必须从购买记录发起',()=>{
  const dealer=fs.readFileSync(path.join(root,'dealer.html'),'utf8')
  const dealerJs=fs.readFileSync(path.join(root,'dealer-workbench.js'),'utf8')
  const dealerCss=fs.readFileSync(path.join(root,'dealer-workbench.css'),'utf8')
  for(const copy of ['登记一笔购买','消费者','购买记录','商品实例','保存后只生成购买记录，不会自动创建服务工单','未申请安装','部分申请','安装状态仅供筛选，不代表顾客已提出需求','服务工单查询'])assert.ok(dealer.includes(copy),`missing ${copy}`)
  assert.ok(!dealer.includes('主要工作 · 购买发生时'))
  assert.ok(!dealerJs.includes('商品安装码（与数量一致）'))
  assert.ok(dealerJs.includes('>确认登记</button>'))
  assert.ok(dealerCss.includes('.relationship-flow'))
  assert.ok(dealer.indexOf('id="recordsSection"')<dealer.indexOf('id="searchForm"'))
  assert.doesNotMatch(dealer,/id="recordDetail"|id="ordersSection"|class="lookup-card"/)
  for(const token of ['openOrdersOverview','低频查询 · 当前授权门店','本店服务工单'])assert.ok(dealerJs.includes(token),`missing ${token}`)
  assert.doesNotMatch(dealer,/data-record-filter="pending"|>待建单</)
  assert.doesNotMatch(dealer,/>待分站<|>待分人<|>待完工</)
})

test('门店概览只使用购买登记可解释的数据及趋势',()=>{
  const dealer=fs.readFileSync(path.join(root,'dealer.html'),'utf8')
  const dealerJs=fs.readFileSync(path.join(root,'dealer-workbench.js'),'utf8')
  const dealerCss=fs.readFileSync(path.join(root,'dealer-workbench.css'),'utf8')
  for(const copy of ['今日登记商品','近 30 天销售商品','近 30 天成交客户','近 30 天购买记录','较前 30 天','近 30 日登记趋势','热销商品','新客与复购','商品数按商品实例计','客户数按购买人手机号去重','storeTrendChart','productMixChart','customerMixChart'])assert.ok(dealer.includes(copy),`missing ${copy}`)
  for(const token of ['todayProducts','productTrend','customerTrend','topProducts','customerMix','drawStoreTrend','drawProductMix','drawCustomerMix','renderProductRank','renderStoreInsight'])assert.ok(dealerJs.includes(token),`missing ${token}`)
  for(const token of ['kpi-main','kpi-meta','kpi-icon','productRankList','按登记件数排序','register-button-icon','relationship-node','relationship-connector','#i-user','#i-receipt','#i-package'])assert.ok(dealer.includes(token),`missing ${token}`)
  assert.match(dealerCss,/\.analytics-workspace \.trend-panel\{grid-row:1/)
  assert.match(dealerCss,/\.analytics-workspace \.insight-rail\{grid-row:2/)
  assert.match(dealerCss,/\.analytics-workspace\{grid-template-rows:repeat\(2,minmax\(0,1fr\)\)\}/)
  assert.match(dealerCss,/\.register-card\{border:0;background:linear-gradient\(135deg,#245fbf,#377ef0\)/)
  assert.match(dealerCss,/\.relationship-flow\{padding:2px 0 0;border:0;border-radius:0;background:transparent;box-shadow:none\}/)
  assert.match(dealerCss,/\.relationship-flow\{width:max-content;max-width:100%;grid-template-columns:auto 16px auto 16px auto/)
  assert.match(dealerCss,/\.register-actions \.secondary-primary\{min-width:196px;height:44px/)
  assert.match(dealerCss,/\.store-summary-card \.kpi-grid\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\);grid-template-rows:1fr/)
  assert.match(dealerCss,/\.store-summary-card \.kpi-card\{--metric:#377ef0;--metric-soft:#eaf2ff;display:grid/)
  assert.match(dealerCss,/grid-template-columns:26px minmax\(0,1fr\);grid-template-rows:auto minmax\(0,1fr\) auto;gap:7px;padding:11px 12px 10px;border:1px solid/)
  assert.match(dealerCss,/border-radius:11px;background:linear-gradient\(155deg/)
  assert.match(dealerCss,/\.store-summary-card \.kpi-main\{display:contents\}/)
  assert.match(dealerCss,/\.store-summary-card \.kpi-meta\{display:flex;grid-column:1\/3;grid-row:3;min-width:0;flex-direction:column/)
  assert.match(dealerCss,/\.store-summary-card \.kpi-card \.kpi-meta p\{align-self:auto;margin:0;padding:0;border:0/)
  assert.doesNotMatch(dealer,/门店数据 · 当前授权范围|>经营概览</)
  assert.ok(dealer.indexOf('class="work-panels"')<dealer.indexOf('id="analyticsTitle"'),'经营图表应位于核心办理区之后')
  assert.ok(dealer.indexOf('id="recordsSection"')<dealer.indexOf('id="analyticsTitle"'),'购买记录应与经营趋势组成下方主区域')
  assert.doesNotMatch(dealer,/id="(?:salesAmount|revenue|profit)|<span>销售额|<h3>销售额|<span>利润|<h3>利润/)
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
  for(const token of ['recordId: record.id','instanceId: instance.id','name="type"','name="instanceId"','data-create-service','activeOrderForInstance','openRecord','openService(id)','openOrder','submitRegistration','submitService','PENDING_DISPATCH','代消费者办理 · 来自购买记录'])assert.ok(dealer.includes(token),`missing ${token}`)
  assert.match(dealer,/type === 'INSTALLATION' && instance\.status !== 'AVAILABLE'/)
  assert.match(dealer,/code: `TOTO-\$\{instanceId\}`/)
  assert.doesNotMatch(dealer,/PENDING_ACCEPTANCE|待建单|fetch\(/)
})

test('门店原型字段与当前购买登记、建单和工单查询契约一致',()=>{
  const html=fs.readFileSync(path.join(root,'dealer.html'),'utf8')
  const dealer=fs.readFileSync(path.join(root,'dealer-workbench.js'),'utf8')
  for(const token of ['id="searchType"','value="mobile"','value="name"','服务工单查询'])assert.ok(html.includes(token),`missing ${token}`)
  for(const token of ['PENDING_DISPATCH','PENDING_ASSIGNMENT','PENDING_COMPLETION','name="storeId"','name="sourceType"','name="quantity"','name="contactName"','name="expectedTimeWindow"','name="faultId"','name="problemDescription"','name="province"','name="district"','clientRequestId'])assert.ok(dealer.includes(token),`missing ${token}`)
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
