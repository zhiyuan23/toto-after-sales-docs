(function(){
'use strict'

const icons={
  'arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
  archive:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M9 13h6M5 2h14"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',
  chart:'<path d="M3 3v18h18M7 16l4-5 4 3 5-7"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  gauge:'<path d="M20.38 8.57a9 9 0 1 0 .13 6.58"/><path d="m12 12 4-4M7.5 8.5h.01M12 6h.01M16.5 8.5h.01"/>',
  headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19c0 1.1-.9 2-2 2h-3M4 14h3v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 1-2ZM20 14h-3v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-2Z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 9h12"/>',
  maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5Z"/>',
  'panel-left':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 9l-3 3 3 3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  refresh:'<path d="M20 7h-5V2M4 17h5v5"/><path d="M5.2 9A8 8 0 0 1 18 5l2 2M18.8 15A8 8 0 0 1 6 19l-2-2"/>',
  scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  'triangle-alert':'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>'
}
const svgIcon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||''}</svg>`
const icon=name=>`<span class="icon" data-icon="${name}">${svgIcon(name)}</span>`
const $=id=>document.getElementById(id)

const queueMeta={
  workbasket:{label:'统一工作篮',total:48,caption:'跨状态连续办理'},
  acceptance:{label:'待受理',total:18,caption:'PENDING_ACCEPTANCE'},
  station:{label:'待分配服务站',total:6,caption:'客服可办'},
  dispatch:{label:'服务站处理中',total:12,caption:'服务站操作 · 客服跟进'},
  review:{label:'待完工审核',total:7,caption:'PENDING_REVIEW'},
  complaint:{label:'待定责投诉',total:5,caption:'OPEN 队列'},
  all:{label:'全部工单',total:248,caption:'包含关闭与取消'}
}

const actionableQueueKeys=['acceptance','station','dispatch','review','complaint']

const transitionMeta={
  station:{label:'今日转入',today:8,from:'待受理',to:'待分配服务站'},
  dispatch:{label:'今日转入',today:6,from:'待分配服务站',to:'服务站处理中'},
  review:{label:'今日转入',today:5,from:'服务站处理中',to:'待完工审核'}
}

const records=[
  {id:'AS202609170001',queue:'acceptance',type:'安装',customer:'王女士',phone:'138****9123',context:'智能坐便器 · 400 热线',time:'等待 42 分钟',attention:true,priority:2,status:'待受理',action:'创建服务工单'},
  {id:'AS202609170002',queue:'acceptance',type:'维修',customer:'陈女士',phone:'159****3287',context:'智能柜 · 安装码 TO-8C92',time:'新进 8 分钟',status:'待受理',action:'创建服务工单'},
  {id:'AS202609160998',queue:'acceptance',type:'使用指导',customer:'刘女士',phone:'186****7721',context:'智能坐便器 · 微信公众号',time:'等待 1 小时 28 分',attention:true,priority:1,status:'待受理',action:'创建服务工单'},
  {id:'AS202609160997',queue:'station',type:'安装',customer:'沈女士',phone:'137****6655',context:'浦东新区张杨路 · 候选 2 站',time:'待办 23 分钟',status:'待分配服务站',action:'确认分配'},
  {id:'AS202609160996',queue:'station',type:'维修',customer:'宋先生',phone:'139****4411',context:'徐汇区虹桥路 · 匹配完成',time:'待办 36 分钟',status:'待分配服务站',action:'确认分配'},
  {id:'AS202609160995',queue:'dispatch',type:'维修',customer:'赵先生',phone:'136****2210',context:'杭州拱墅服务站',time:'已分站 2 小时',status:'服务站处理中',action:'跟进站点'},
  {id:'AS202609160994',queue:'dispatch',type:'安装',customer:'冯女士',phone:'188****3322',context:'广州天河服务站',time:'已分站 3 小时',attention:true,status:'服务站处理中',action:'转服务站'},
  {id:'AS202609160993',queue:'review',type:'维修',customer:'邹先生',phone:'135****7766',context:'现场照片 3 张 · 有配件耗用',time:'提交 26 分钟',status:'待完工审核',action:'审核通过'},
  {id:'CP202609170005',queue:'complaint',type:'投诉',customer:'周女士',phone:'137****8899',context:'关联 AS202609150041 · 服务履约阶段',time:'待定责 51 分钟',attention:true,priority:3,status:'待定责',action:'提交定责记录'}
]

let activeQueue='workbasket'
let selectedId='AS202609160998'
let contextOpen=false
let toastTimer

function menuMarkup(){
  const groups=[['工单处理',['客服工作台','服务受理','服务工单','派单调度','完工审核']],['异常与投诉',['异常工单','投诉管理']],['业务查询',['顾客购买记录','安装码管理','服务知识库','商品档案']],['服务分析',['服务质量','运营报表']]]
  return groups.map((group,index)=>`<section class="menu-group${index<2?' is-open':''}"><button class="menu-group-title" type="button" aria-expanded="${index<2}"><span>${group[0]}</span>${icon('chevron-down')}</button><div class="menu-list">${group[1].map((item,itemIndex)=>`<button type="button" class="menu-item${index===0&&itemIndex===0?' is-active':''}" data-preview="${item}">${icon(index===0&&itemIndex===0?'gauge':item.includes('工单')?'clipboard':'archive')}<span>${item}</span></button>`).join('')}</div></section>`).join('')
}

function shellMarkup(){
  return `<div class="app-shell" id="appShell"><header class="topbar"><a class="brand" href="index.html" aria-label="TOTO 售后服务首页"><span class="brand-mark" aria-hidden="true"><span>T</span></span><span class="brand-copy"><strong>TOTO 售后服务</strong><small>Blue Whale Digital</small></span></a><button class="perspective-switch" type="button" id="perspectiveButton" aria-haspopup="dialog" aria-controls="prototypePanel"><span class="perspective-icon icon">${svgIcon('headset')}</span><span><small>当前工作视角</small><strong>客服作业</strong></span>${icon('chevron-down')}</button><nav class="module-nav" aria-label="一级功能"><button type="button" class="module-link is-active">${icon('gauge')}工单处理</button><button type="button" class="module-link" data-preview="异常与投诉">${icon('clipboard')}异常与投诉</button><button type="button" class="module-link" data-preview="业务查询">${icon('archive')}业务查询</button></nav><div class="topbar-actions"><button class="search-trigger" type="button" id="searchButton">${icon('search')}<span>搜索功能</span><kbd>⌘ K</kbd></button><button class="icon-button" type="button" id="fullscreenButton" aria-label="进入全屏">${icon('maximize')}</button><button class="icon-button" type="button" id="refreshButton" aria-label="刷新数据">${icon('refresh')}</button><button class="icon-button" type="button" id="themeButton" aria-label="切换深浅模式">${icon('moon')}</button><button class="user-menu" type="button" data-preview="个人菜单"><span class="avatar">客</span><span>客服主管</span>${icon('chevron-down')}</button></div></header><aside class="sidebar" aria-label="客服作业功能菜单"><div class="sidebar-scroll">${menuMarkup()}</div><button class="sidebar-collapse" id="sidebarButton" type="button">${icon('panel-left')}<span>收起菜单</span></button></aside><main class="workspace cs3-workspace" id="workspace">${workspaceMarkup()}</main></div>${overlayMarkup()}`
}

function workspaceMarkup(){
  const today=new Date()
  return `<div class="page-heading role-heading cs3-heading"><div class="role-heading-main"><div><div class="context-line"><span>${today.getFullYear()} 年 ${today.getMonth()+1} 月 ${today.getDate()} 日</span><i></i><button type="button" id="scopeButton">全国客服中心${icon('chevron-down')}</button></div><h1>客服工作台</h1></div><span class="cs3-version">v0.17 · 状态辨识优化</span></div><div class="heading-actions"><button class="cs3-heading-action" type="button" data-tool="lookup">${icon('search')}查顾客 / 工单</button><button class="cs3-heading-action is-primary" type="button" data-action="intake">${icon('plus')}新建服务</button><span class="sample-badge"><span class="status-dot"></span>原型数据</span><a class="cs3-version-link" href="customer-service.html">查看现版</a></div></div>
  <section class="cs3-executive-deck" aria-label="当前消费者与客服核心待办指标">
    <button class="cs3-signal-card cs3-current-customer" id="currentCustomerCard" type="button" aria-label="继续统一办理" aria-pressed="true"></button>
    <button class="cs3-signal-card cs3-kpi-card" type="button" data-summary-queue="acceptance" aria-pressed="true"><span class="cs3-kpi-icon">${icon('headset')}</span><span class="cs3-kpi-label">待受理</span><span class="cs3-kpi-value"><strong data-kpi-count="acceptance">18</strong><small>单</small></span><span class="cs3-kpi-caption is-attention">2 项需关注 · 最长等待 1 小时 28 分</span></button>
    <button class="cs3-signal-card cs3-kpi-card is-station" type="button" data-summary-queue="station" aria-pressed="false"><span class="cs3-kpi-icon">${icon('building')}</span><span class="cs3-kpi-label">待分配服务站</span><span class="cs3-kpi-value"><strong data-kpi-count="station">6</strong><small>单</small></span><span class="cs3-kpi-caption">客服选择服务站</span></button>
    <button class="cs3-signal-card cs3-kpi-card is-dispatch" type="button" data-summary-queue="dispatch" aria-pressed="false"><span class="cs3-kpi-icon">${icon('clock')}</span><span class="cs3-kpi-label">服务站处理中</span><span class="cs3-kpi-value"><strong data-kpi-count="dispatch">12</strong><small>单</small></span><span class="cs3-kpi-caption">服务站操作 · 客服跟进</span></button>
    <button class="cs3-signal-card cs3-kpi-card is-review" type="button" data-summary-queue="review" aria-pressed="false"><span class="cs3-kpi-icon">${icon('shield')}</span><span class="cs3-kpi-label">待完工审核</span><span class="cs3-kpi-value"><strong data-kpi-count="review">7</strong><small>单</small></span><span class="cs3-kpi-caption">需审核权限</span></button>
    <button class="cs3-signal-card cs3-kpi-card is-complaint" type="button" data-summary-queue="complaint" aria-pressed="false"><span class="cs3-kpi-icon">${icon('triangle-alert')}</span><span class="cs3-kpi-label">待定责投诉</span><span class="cs3-kpi-value"><strong data-kpi-count="complaint">5</strong><small>项</small></span><span class="cs3-kpi-caption">异常分支 · 按权限处理</span></button>
  </section>
  <section class="cs3-queue-strip" id="queueStrip" aria-label="工单状态总览和队列筛选"></section>
  <section class="cs3-board" id="workbenchBoard"><article class="cs3-panel cs3-inbox"><header class="cs3-panel-heading"><div><h2 id="queueTitle">统一工作篮</h2><p><span id="activeQueueSummary" aria-live="polite">48 项 · 跨状态优先排序</span><span class="cs3-queue-attention" id="queueAttentionSignal"></span></p></div><div class="cs3-panel-heading-actions"><button class="cs3-workbasket-button" type="button" id="workbasketButton" aria-pressed="true">${icon('layout')}<span>统一办理</span><strong>48</strong></button><button class="plain-icon-button" type="button" id="queueStateButton" aria-label="队列状态演示">${icon('info')}</button></div></header><label class="cs3-search">${icon('search')}<input id="workSearch" type="search" placeholder="搜工单、顾客、手机或安装码" aria-label="搜索客服待办"></label><div class="cs3-inbox-list" id="inboxList"></div><footer class="cs3-inbox-footer"><span id="inboxCount"></span><button type="button" data-tool="lookup">全量查询</button></footer></article><article class="cs3-panel cs3-task" id="taskPanel"></article><aside class="cs3-panel cs3-context" id="contextPanel"></aside></section>`
}

function overlayMarkup(){
  return `<button class="prototype-fab" id="prototypeFab" type="button" aria-haspopup="dialog" aria-controls="prototypePanel">${icon('layout')}<span>原型目录</span><strong>4 / 4</strong></button><div class="scrim" id="scrim" hidden></div><aside class="prototype-panel" id="prototypePanel" role="dialog" aria-modal="true" aria-labelledby="prototypeTitle" hidden><header><div><span class="panel-kicker">WEB 管理后台</span><h2 id="prototypeTitle">四视角原型目录</h2><p>同一套后台外壳，按角色工作目标切换。</p></div><button class="icon-button" id="closePrototypePanel" type="button" aria-label="关闭原型目录">${icon('x')}</button></header><div class="prototype-list"><a href="index.html" class="prototype-card"><span class="prototype-number">01</span><span class="prototype-copy"><span class="prototype-status">工作视角</span><strong>总部运营</strong><small>全国运营与数据判断</small></span>${icon('arrow-up-right')}</a><a href="customer-service-v03.html" class="prototype-card is-current"><span class="prototype-number">02</span><span class="prototype-copy"><span class="prototype-status is-ready">当前</span><strong>客服作业</strong><small>状态辨识优化工作台 v0.17</small></span>${icon('arrow-up-right')}</a><a href="service-station.html" class="prototype-card"><span class="prototype-number">03</span><span class="prototype-copy"><span class="prototype-status">工作视角</span><strong>服务站作业</strong><small>派工、履约与配件处理</small></span>${icon('arrow-up-right')}</a><a href="dealer.html" class="prototype-card"><span class="prototype-number">04</span><span class="prototype-copy"><span class="prototype-status">工作视角</span><strong>门店业务</strong><small>购买登记与服务发起</small></span>${icon('arrow-up-right')}</a><a href="customer-service.html" class="prototype-card"><span class="prototype-number">旧</span><span class="prototype-copy"><span class="prototype-status is-ready">版本对照</span><strong>客服工作台现版</strong><small>指标＋泳道＋抽屉</small></span>${icon('arrow-up-right')}</a></div><footer><a href="01-四视角后台原型设计说明.md">查看原型设计说明${icon('arrow-right')}</a><a href="../README.md">返回全部页面原型</a></footer></aside><div class="command-dialog" id="commandDialog" role="dialog" aria-modal="true" aria-label="搜索功能" hidden><label>${icon('search')}<input id="commandInput" type="search" placeholder="输入功能名称…"><kbd>ESC</kbd></label><div class="command-results" id="commandResults"></div></div><section class="cs3-tool-dialog" id="toolDialog" role="dialog" aria-modal="true" aria-labelledby="toolTitle" hidden><header class="cs3-tool-header"><div><span>客服快捷工具</span><h2 id="toolTitle">工作台内查询</h2></div><button class="icon-button" id="closeToolDialog" type="button" aria-label="关闭快捷工具">${icon('x')}</button></header><div class="cs3-tool-body" id="toolBody"></div></section><div class="popover scope-popover" id="scopePopover" hidden><span>当前授权范围</span><strong>全国客服中心</strong><p>工作台只聚合获授权数据；每项办理仍校验功能、动作权限、对象范围和后端 actions。</p></div><div class="toast cs3-toast" id="toast" role="status" aria-live="polite"></div>`
}

function queueStripMarkup(){
  const nodes=[
    {key:'acceptance',icon:'headset',owner:'客服操作',tone:'is-acceptance'},
    {key:'station',icon:'building',owner:'客服操作',tone:'is-station'},
    {key:'dispatch',icon:'clock',owner:'服务站操作 · 客服跟进',tone:'is-dispatch',external:true},
    {key:'review',icon:'shield',owner:'需审核权限',tone:'is-review'}
  ]
  const main=nodes.map((node,index)=>{const item=queueMeta[node.key];const transition=transitionMeta[node.key];const detail=transition?`今日 00:00 至当前，从${transition.from}进入${transition.to} ${transition.today} 单`:'';const connector=index?`<span class="cs3-flow-connector" role="img" aria-label="${detail}" title="${detail}"><span class="cs3-flow-metric"><small>${transition.label}</small><strong>${transition.today} 单</strong></span>${icon('arrow-right')}</span>`:'';return `${connector}<button type="button" class="cs3-flow-node ${node.tone}${node.external?' is-external':''}" data-queue="${node.key}" aria-pressed="${activeQueue===node.key}"><span class="cs3-flow-icon">${icon(node.icon)}</span><span class="cs3-flow-copy"><span>${item.label}</span><small>${node.owner}</small></span><strong>${item.total}</strong></button>`}).join('')
  const complaint=queueMeta.complaint
  const unifiedBadge=activeQueue==='workbasket'?`<span class="cs3-flow-mode-badge">${icon('layout')}统一办理 · 跨状态</span>`:''
  return `${unifiedBadge}<div class="cs3-status-main">${main}</div><button type="button" class="cs3-flow-node cs3-flow-exception is-complaint" data-queue="complaint" aria-pressed="${activeQueue==='complaint'}"><span class="cs3-flow-icon">${icon('triangle-alert')}</span><span class="cs3-flow-copy"><span>${complaint.label}</span><small>异常分支 · 按权限处理</small></span><strong>${complaint.total}</strong></button>`
}

function filteredRecords(){
  const keyword=$('workSearch')?.value.trim().toLowerCase()||''
  const scoped=activeQueue==='workbasket'?workbasketRecords():records.filter(item=>activeQueue==='all'||item.queue===activeQueue)
  return scoped.filter(item=>!keyword||`${item.id}${item.customer}${item.phone}${item.context}${item.type}${item.status}${item.action}`.toLowerCase().includes(keyword))
}

function workbasketRecords(){
  return records.filter(item=>actionableQueueKeys.includes(item.queue)).sort((left,right)=>{
    const leftPriority=Number.isFinite(left.priority)?left.priority:99
    const rightPriority=Number.isFinite(right.priority)?right.priority:99
    if(leftPriority!==rightPriority)return leftPriority-rightPriority
    if(Boolean(left.attention)!==Boolean(right.attention))return Number(Boolean(right.attention))-Number(Boolean(left.attention))
    return records.indexOf(left)-records.indexOf(right)
  })
}

function workbasketTotal(){
  return actionableQueueKeys.reduce((total,key)=>total+queueMeta[key].total,0)
}

function priorityReason(item){
  if(item.attention)return `等待时长较长，已进入关注队列`
  if(item.queue==='complaint')return '异常分支待定责'
  if(item.queue==='review')return '完工材料已提交待审核'
  if(item.queue==='station')return '顾客需求已确认，等待分配服务站'
  if(item.queue==='dispatch')return '服务站尚未回传处理进度'
  return '当前授权范围内的优先待办'
}

function nextWorkItem(current){
  const scope=activeQueue==='workbasket'?workbasketRecords():records.filter(item=>item.queue===current.queue)
  return scope.find(item=>item.id!==current.id)
}

function renderCurrentCustomer(){
  const item=records.find(record=>record.id===selectedId)||records.find(record=>record.queue!=='all')||records[0]
  const card=$('currentCustomerCard')
  const unified=activeQueue==='workbasket'
  card.setAttribute('aria-pressed',String(unified))
  card.setAttribute('aria-label',unified?`继续统一办理，当前优先消费者${item.customer}`:`返回统一办理并打开最高优先级待办`)
  card.innerHTML=`<span class="cs3-current-heading"><span>${unified?'统一办理中':'当前聚焦队列'} · ${item.status}</span><em>${unified?'继续办理':'返回统一办理'}${icon('arrow-up-right')}</em></span><span class="cs3-current-person"><strong>${item.customer}</strong><small>${item.phone}</small></span><span class="cs3-current-order">${item.id}</span><span class="cs3-current-facts"><span><small>服务事项</small><strong>${item.type}</strong></span><span><small>当前时长</small><strong>${item.time}</strong></span><span><small>来源与商品</small><strong>${item.context}</strong></span></span>`
  card.onclick=()=>selectQueue('workbasket')
}

function renderOverview(){
  queueMeta.workbasket.total=workbasketTotal()
  renderCurrentCustomer()
  $('queueStrip').innerHTML=queueStripMarkup()
  $('queueStrip').classList.toggle('is-workbasket-active',activeQueue==='workbasket')
  $('queueStrip').setAttribute('aria-label',activeQueue==='workbasket'?'统一办理中，覆盖全部可办理工单状态':'工单状态总览和队列筛选')
  $('queueTitle').textContent=activeQueue==='workbasket'?'统一工作篮':`${queueMeta[activeQueue].label}队列`
  $('activeQueueSummary').textContent=activeQueue==='workbasket'?`${queueMeta.workbasket.total} 项 · 跨状态优先排序`:`${queueMeta[activeQueue].label} ${queueMeta[activeQueue].total} 条，${activeQueue==='all'?'按最新记录展示':'优先项在前'}`
  const attentionCount=records.filter(item=>(activeQueue==='workbasket'?actionableQueueKeys.includes(item.queue):activeQueue==='all'||item.queue===activeQueue)&&item.attention).length
  $('queueAttentionSignal').classList.toggle('is-clear',attentionCount===0)
  $('queueAttentionSignal').innerHTML=attentionCount?`${icon('triangle-alert')}${attentionCount} 项需关注`:`${icon('check')}无特别关注`
  $('workbasketButton').setAttribute('aria-pressed',String(activeQueue==='workbasket'))
  $('workbasketButton').querySelector('strong').textContent=queueMeta.workbasket.total
  document.querySelectorAll('[data-summary-queue]').forEach(button=>button.setAttribute('aria-pressed',String(activeQueue===button.dataset.summaryQueue)))
  document.querySelectorAll('[data-kpi-count]').forEach(value=>{value.textContent=queueMeta[value.dataset.kpiCount].total})
  document.querySelectorAll('[data-queue]').forEach(button=>button.addEventListener('click',()=>selectQueue(button.dataset.queue)))
}

function renderInbox(){
  const rows=filteredRecords()
  $('inboxList').innerHTML=rows.length?rows.map(item=>`<button type="button" class="cs3-inbox-item${item.attention?' is-attention':''}" data-record="${item.id}" aria-current="${selectedId===item.id}"><span class="item-main"><span class="item-id">${item.id}<span class="cs3-badge${item.queue==='complaint'?' is-danger':item.attention?' is-warn':''}">${item.type}</span><span class="cs3-queue-tag">${queueMeta[item.queue]?.label||item.status}</span></span><span class="item-copy">${item.customer} · ${item.phone}</span><span class="item-meta">${item.context}</span><span class="item-next">下一动作：${item.action}</span></span><span class="item-side"><strong>${item.time}</strong><small>${item.status}</small></span></button>`).join(''):`<div class="cs3-empty"><div><span>${icon('search')}</span><strong>未找到匹配待办</strong><p>请调整搜索词或切换队列。</p></div></div>`
  $('inboxCount').textContent=`共 ${queueMeta[activeQueue].total} 条，当前显示 ${rows.length} 条演示数据`
  document.querySelectorAll('[data-record]').forEach(button=>button.addEventListener('click',()=>selectRecord(button.dataset.record)))
  if(!rows.some(item=>item.id===selectedId)&&rows.length)selectedId=rows[0].id
}

function progressMarkup(queue){
  const steps=[
    {label:'客服受理',owner:'客服'},
    {label:'分配服务站',owner:'客服'},
    {label:'站内派人',owner:'服务站',external:true},
    {label:'现场履约',owner:'服务人员',external:true},
    {label:'完工审核',owner:'授权客服'}
  ]
  const order={acceptance:0,station:1,dispatch:2,review:4,complaint:0,all:4}
  const current=order[queue]??0
  return `<div class="cs3-progress" aria-label="工单进度与岗位分工">${steps.map((step,index)=>`<span class="cs3-progress-step${index<current?' is-done':index===current?' is-current':''}${step.external?' is-external':''}"><i>${index<current?svgIcon('check'):index+1}</i><span class="cs3-progress-copy"><b>${step.label}</b><small>${step.owner}</small></span></span>`).join('')}</div>`
}

function acceptanceForm(item){
  return `<section class="cs3-section"><div class="cs3-section-title"><h3>1. 识别顾客</h3><span>可使用手机号或安装码</span></div><form class="cs3-form"><label><span>手机号或安装码 <em>*</em></span><input value="138 0000 9123" aria-label="手机号或安装码"></label></form><div class="cs3-customer-match" style="margin-top:7px"><span><strong>${item.customer} · ${item.phone}</strong><small>已匹配 1 位顾客，2 条购买记录</small></span><button type="button" data-preview="顾客详情">查看顾客</button></div></section><section class="cs3-section"><div class="cs3-section-title"><h3>2. 选择购买记录</h3><span>当前可发起服务</span></div><label class="cs3-purchase-option"><input type="radio" name="purchase" checked><span class="cs3-option-rank">01</span><span class="cs3-option-copy"><strong>PR202406120018 · TOTO 智能坐便器</strong><small>安装码 TO-8C92 · 上海浦东授权门店</small></span><span class="cs3-option-side"><em>可办理</em><small>1 件商品</small></span></label></section><section class="cs3-section"><div class="cs3-section-title"><h3>3. 确认服务信息</h3><span>创建后可接续分站</span></div><form class="cs3-form"><div class="cs3-form-grid"><label><span>服务类型 <em>*</em></span><select aria-label="服务类型"><option>安装服务</option><option>维修服务</option><option>使用指导</option></select></label><label><span>期望服务日期 <em>*</em></span><input type="date" value="2026-09-20" aria-label="期望服务日期"></label></div><label><span>服务地址 <em>*</em></span><input value="上海市浦东新区张杨路 1888 号 3 栋 1201 室" aria-label="服务地址"></label><label><span>问题与沟通记录</span><textarea aria-label="问题与沟通记录">新房装修，已收货，需安排安装。希望周末上门，家里下午有人。</textarea></label></form></section><div class="cs3-note">${icon('info')}创建前会重新校验顾客、购买记录、商品状态和活动工单；成功后进入待分配服务站队列。</div>`
}

function stationForm(){
  return `<section class="cs3-section"><div class="cs3-section-title"><h3>服务辖区候选</h3><span>依匹配层级与配置优先级排序</span></div><div class="cs3-station-list"><label class="cs3-station-option"><input type="radio" name="station" checked><span class="cs3-option-rank">01</span><span class="cs3-option-copy"><strong>上海浦东授权服务站</strong><small>街道级辖区匹配 · 区域优先级 1 · 支持安装</small></span><span class="cs3-option-side"><em>推荐</em><small>已启用</small></span></label><label class="cs3-station-option"><input type="radio" name="station"><span class="cs3-option-rank">02</span><span class="cs3-option-copy"><strong>上海徐汇授权服务站</strong><small>区级辖区匹配 · 区域优先级 2 · 支持安装</small></span><span class="cs3-option-side"><em>候选</em><small>已启用</small></span></label></div></section><section class="cs3-section"><form class="cs3-form"><label><span>人工覆盖原因</span><textarea aria-label="分站备注">采用区域推荐第一顺位。</textarea></label></form></section><div class="cs3-note">${icon('info')}客服只分配或转服务站；站内人员安排由服务站在本站工作台完成。人工偏离推荐或转站需填写原因并留痕。</div>`
}

function dispatchForm(item){
  return `<section class="cs3-section"><div class="cs3-section-title"><h3>服务站处理进度</h3><span>客服跟进，不代替站点人员安排</span></div><div class="cs3-customer-match"><span><strong>${item.context}</strong><small>已于 09-17 10:08 分配·站点尚未回传派人结果</small></span><button type="button" data-preview="分配历史">分配历史</button></div></section><section class="cs3-section"><form class="cs3-form"><label><span>跟进记录</span><textarea aria-label="跟进记录">已联系服务站，请于 30 分钟内确认处理进度。</textarea></label><label><span>需要转站时的原因</span><select aria-label="转站原因"><option>不转站，仅保存跟进</option><option>顾客地址变更</option><option>服务站无法承接</option></select></label></form></section><div class="cs3-note">${icon('info')}工作台只显示可解释的分站状态，不展示人员实时位置、到客距离或推导出的实时产能。</div>`
}

function reviewForm(){
  return `<section class="cs3-section"><div class="cs3-section-title"><h3>完工材料核验</h3><span>当前不可变提交版本 v1</span></div><div class="cs3-material-grid"><div class="cs3-material-item">${icon('check')}<span><strong>现场照片</strong><small>3 张</small></span></div><div class="cs3-material-item">${icon('check')}<span><strong>服务记录</strong><small>已填写</small></span></div><div class="cs3-material-item">${icon('check')}<span><strong>配件耗用</strong><small>1 项</small></span></div></div></section><section class="cs3-section"><form class="cs3-form"><label><span>审核意见 <em>*</em></span><textarea aria-label="审核意见">材料齐全，服务结果与工单内容一致。</textarea></label></form></section><div class="cs3-note">${icon('info')}审核通过后进入待回访；退回时保留原提交，服务站补充后生成新版本。审核动作只对获授权岗位开放。</div>`
}

function complaintForm(){
  return `<section class="cs3-section"><div class="cs3-section-title"><h3>投诉核对与定责</h3><span>OPEN 只代表待定责队列</span></div><form class="cs3-form"><div class="cs3-form-grid"><label><span>责任阶段 <em>*</em></span><select aria-label="责任阶段"><option>服务履约阶段</option><option>受理与沟通阶段</option></select></label><label><span>关联工单</span><input value="AS202609150041" disabled aria-label="关联工单"></label></div><label><span>处理记录 <em>*</em></span><textarea aria-label="投诉处理记录">已联系顾客，等待服务站补充现场说明。</textarea></label></form></section><div class="cs3-note">${icon('info')}后续处理、待回访与结案仍按投诉状态机逐阶段办理，不将 OPEN 解释为全部未结投诉。</div>`
}

function taskBody(item){
  if(item.queue==='station')return stationForm(item)
  if(item.queue==='dispatch')return dispatchForm(item)
  if(item.queue==='review')return reviewForm(item)
  if(item.queue==='complaint')return complaintForm(item)
  return acceptanceForm(item)
}

function assistMarkup(item){
  const content={
    acceptance:{checks:[['服务资格','商品实例可办理','check'],['活动工单','未发现处理中冲突','check'],['最近沟通','今日 09:42 · 400 热线','clock']],next:'创建后进入待分配服务站，由客服选择服务站。'},
    station:{checks:[['辖区匹配','街道级命中','check'],['候选服务站','2 个已启用','building'],['最近沟通','今日 09:31 · 顾客确认地址','clock']],next:'确认分站后，由服务站在本站工作台安排人员。'},
    dispatch:{checks:[['当前责任方','服务站','building'],['站点反馈','尚未回传派人结果','clock'],['最近跟进','今日 10:08 · 已联系站点','headset']],next:'客服可催办或按权限转站，不代替服务站派人。'},
    review:{checks:[['材料完整度','3 / 3 已提交','check'],['提交版本','v1 · 不可变','shield'],['当前权限','完工审核可操作','shield']],next:'通过后进入待回访；退回会保留本次提交版本。'},
    complaint:{checks:[['关联工单','AS202609150041','clipboard'],['责任阶段','服务履约阶段','triangle-alert'],['最近沟通','今日 09:42 · 已联系顾客','headset']],next:'完成定责后进入投诉处理中，仍按状态逐步办理。'}
  }[item.queue]||{checks:[['当前状态',item.status,'info']],next:'请按当前工单状态完成处理。'}
  const checks=[['当前等待',item.time,item.attention?'triangle-alert':'clock'],...content.checks]
  const visibleChecks=activeQueue==='workbasket'?checks.slice(0,3):checks
  const upcoming=nextWorkItem(item)
  const continuous=activeQueue==='workbasket'?`<section class="cs3-continuous-summary"><span><small>当前优先原因</small><strong>${priorityReason(item)}</strong></span><span><small>下一项预览</small><strong>${upcoming?`${queueMeta[upcoming.queue].label} · ${upcoming.customer}`:'当前工作篮已清空'}</strong></span></section>`:''
  return `<aside class="cs3-task-assist" aria-label="当前办理辅助"><header><span>${activeQueue==='workbasket'?'连续办理':'办理辅助'}</span><small>${activeQueue==='workbasket'?'跨状态自动接续':'随当前待办更新'}</small></header>${continuous}<div class="cs3-assist-checks">${visibleChecks.map(row=>`<div><span class="cs3-assist-icon">${icon(row[2])}</span><span><small>${row[0]}</small><strong>${row[1]}</strong></span></div>`).join('')}</div><section class="cs3-assist-next"><span>当前任务下一步</span><p>${content.next}</p></section><div class="cs3-assist-actions">${activeQueue==='workbasket'?`<button class="cs3-assist-skip" type="button" data-skip-task>稍后处理</button>`:''}<button class="cs3-assist-open" type="button" data-context-open>${icon('user')}服务上下文${icon('arrow-right')}</button></div></aside>`
}

function footerActions(item){
  if(item.queue==='review')return `<button class="secondary-button" type="button" data-submit="return">退回补充</button><button class="primary-button" type="button" data-submit="review">审核通过</button>`
  if(item.queue==='dispatch')return `<button class="secondary-button" type="button" data-submit="save">保存跟进</button><button class="primary-button" type="button" data-submit="transfer">确认转服务站</button>`
  return `<button class="secondary-button" type="button" data-submit="draft">暂存</button><button class="primary-button" type="button" data-submit="primary">${item.action}</button>`
}

function setContextOpen(open){
  contextOpen=open
  $('workbenchBoard').classList.toggle('is-context-open',contextOpen)
  $('contextToggleButton')?.setAttribute('aria-expanded',String(contextOpen))
}

function renderTask(){
  const item=records.find(record=>record.id===selectedId)||records[0]
  $('taskPanel').classList.toggle('is-continuous',activeQueue==='workbasket')
  $('taskPanel').innerHTML=`<header class="cs3-panel-heading cs3-task-heading"><div class="cs3-task-title">${icon(item.queue==='complaint'?'triangle-alert':'clipboard')}<div><h2>${item.status}</h2><span class="task-id">${item.id} · ${item.type} · ${item.customer}</span></div></div><div class="cs3-task-heading-actions">${activeQueue==='workbasket'?'<span class="cs3-continuous-badge">统一工作篮</span>':''}<span class="cs3-permission">${icon('shield')}权限已校验</span><button class="cs3-context-toggle" type="button" id="contextToggleButton" aria-expanded="${contextOpen}">${icon('user')}服务上下文</button></div></header>${progressMarkup(item.queue)}<div class="cs3-task-workarea"><div class="cs3-task-scroll">${taskBody(item)}</div>${assistMarkup(item)}</div><footer class="cs3-task-footer"><span>${icon('check')}${activeQueue==='workbasket'?'完成后自动进入下一项授权待办':'离开前确认未保存内容'}</span><div>${footerActions(item)}</div></footer>`
  $('taskPanel').querySelectorAll('[data-submit]').forEach(button=>button.addEventListener('click',()=>finishTask(button.dataset.submit,item)))
  $('contextToggleButton').addEventListener('click',()=>setContextOpen(!contextOpen))
  $('taskPanel').querySelector('[data-context-open]')?.addEventListener('click',()=>setContextOpen(true))
  $('taskPanel').querySelector('[data-skip-task]')?.addEventListener('click',skipCurrentTask)
  bindPreviewButtons($('taskPanel'))
}

function renderContext(){
  const item=records.find(record=>record.id===selectedId)||records[0]
  $('contextPanel').innerHTML=`<header class="cs3-panel-heading"><div><h2>服务上下文</h2><p>随当前待办联动</p></div><button class="plain-icon-button cs3-context-close" type="button" id="closeContextButton" aria-label="关闭服务上下文">${icon('x')}</button></header><div class="cs3-context-scroll"><section class="cs3-context-card"><h3>顾客与联系方式<button type="button" data-tool="lookup">完整记录</button></h3><div class="cs3-profile"><span class="cs3-profile-avatar">${item.customer[0]}</span><span class="cs3-profile-copy"><strong>${item.customer}</strong><span>${item.phone}</span><small>当前仅展示脱敏联系方式</small></span></div><dl class="cs3-fact-list"><div><dt>服务地址</dt><dd>上海市浦东新区张杨路</dd></div><div><dt>本次来源</dt><dd>${item.context.split('·').pop().trim()}</dd></div><div><dt>期望日期</dt><dd>2026-09-20</dd></div></dl></section><section class="cs3-context-card"><h3>关联商品<button type="button" data-tool="code">核验商品</button></h3><div class="cs3-product"><span class="cs3-product-mark">TOTO</span><span><strong>智能坐便器 · CW992</strong><small>安装码 TO-8C92 · 商品实例当前可办理</small></span></div></section><section class="cs3-context-card"><h3>最近服务记录<button type="button" data-tool="lookup">全部历史</button></h3><ol class="cs3-history"><li><i></i><span><strong>今日 09:42 · 进入${item.status}</strong><small>当前授权队列</small></span></li><li><i></i><span><strong>09-16 · 顾客留下服务诉求</strong><small>来源信息已脱敏</small></span></li><li><i></i><span><strong>2024-06-12 · 购买登记</strong><small>上海浦东授权门店</small></span></li></ol></section><section class="cs3-context-card"><h3>就地辅助</h3><div class="cs3-shortcuts"><button type="button" data-tool="communication">${icon('headset')}<strong>补记沟通</strong><small>保留当前工单上下文</small></button><button type="button" data-tool="knowledge">${icon('archive')}<strong>服务知识库</strong><small>按问题快速检索</small></button></div></section></div>`
  $('closeContextButton').addEventListener('click',()=>setContextOpen(false))
  bindPreviewButtons($('contextPanel'))
  bindToolButtons($('contextPanel'))
}

function selectQueue(key){
  activeQueue=key
  const first=key==='workbasket'?workbasketRecords()[0]:records.find(item=>key==='all'||item.queue===key)
  if(first)selectedId=first.id
  renderOverview();renderInbox();renderTask();renderContext()
}

function selectRecord(id){
  const target=records.find(record=>record.id===id)
  if(target&&activeQueue!=='workbasket')activeQueue=target.queue
  selectedId=id
  renderOverview();renderInbox();renderTask();renderContext()
}

function finishTask(outcome,item){
  if(outcome==='draft'||outcome==='save'){showToast('已保存当前原型草稿');return}
  const continuousMode=activeQueue==='workbasket'
  const oldQueue=item.queue
  if(outcome==='return'){
    item.status='已退回补充';item.queue='all';queueMeta.review.total=Math.max(0,queueMeta.review.total-1)
  }else if(oldQueue==='acceptance'){
    item.status='待分配服务站';item.queue='station';item.action='确认分配';queueMeta.acceptance.total--;queueMeta.station.total++;transitionMeta.station.today++
  }else if(oldQueue==='station'){
    item.status='服务站处理中';item.queue='dispatch';item.action='跟进站点';queueMeta.station.total--;queueMeta.dispatch.total++;transitionMeta.dispatch.today++
  }else if(oldQueue==='review'){
    item.status='待回访';item.queue='all';queueMeta.review.total--
  }else if(oldQueue==='complaint'){
    item.status='投诉处理中';item.queue='all';queueMeta.complaint.total--
  }else if(outcome==='transfer'){
    item.status='已转服务站，待站点派人'
  }
  item.priority=99
  const next=continuousMode?(oldQueue==='acceptance'&&item.queue==='station'?item:workbasketRecords().find(record=>record.id!==item.id)||workbasketRecords()[0]||records[0]):records.find(record=>record.queue===oldQueue&&record.id!==item.id)||records.find(record=>record.queue===item.queue)||records[0]
  activeQueue=continuousMode?'workbasket':oldQueue
  selectedId=next.id
  renderOverview();renderInbox();renderTask();renderContext()
  showToast(continuousMode?`${item.id} 已完成本阶段，统一工作篮已接续下一项授权任务`:`${item.id} 已完成本次原型办理，已定位到下一项`)
}

function skipCurrentTask(){
  if(activeQueue!=='workbasket')return
  const current=records.find(record=>record.id===selectedId)
  if(current)current.priority=98
  const next=workbasketRecords().find(record=>record.id!==selectedId)
  if(next)selectedId=next.id
  renderOverview();renderInbox();renderTask();renderContext()
  showToast('已暂缓当前待办，继续处理下一项')
}

function startNewIntake(){
  const item={id:'新建服务受理',queue:'acceptance',type:'待选择',customer:'待识别顾客',phone:'未填写',context:'客服人工受理',time:'刚刚',priority:0,status:'服务受理',action:'创建服务工单'}
  if(!records.some(record=>record.id===item.id))records.unshift(item)
  activeQueue='workbasket';selectedId=item.id
  renderOverview();renderInbox();renderTask();renderContext()
  $('taskPanel').querySelector('input')?.focus()
}

function bindPreviewButtons(root=document){
  root.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>showToast(`${button.dataset.preview}：专业页入口已保留`)))
}

function bindToolButtons(root=document){
  root.querySelectorAll('[data-tool]').forEach(button=>button.addEventListener('click',()=>openTool(button.dataset.tool)))
}

function toolResult(iconName,title,meta,action='',featured=false){
  return `<article class="cs3-tool-result${featured?' is-featured':''}"><span>${icon(iconName)}</span><div><strong>${title}</strong><small>${meta}</small></div>${action}</article>`
}

function toolMarkup(kind){
  const item=records.find(record=>record.id===selectedId)||records[0]
  if(kind==='code')return {title:'安装码与商品核验',body:`<label class="cs3-tool-search">${icon('scan')}<input value="TO-8C92" aria-label="输入安装码"><button type="button" data-tool-query="code">核验</button></label><div class="cs3-tool-results">${toolResult('check','安装码 TO-8C92 · 可办理','TOTO 智能坐便器 CW992 · 购买记录 PR202406120018 · 上海浦东授权门店','<button type="button" data-use-code>带入受理</button>',true)}${toolResult('info','当前无活动工单','商品实例状态正常；新建服务时仍由后端重新校验资格。')}</div><p class="cs3-tool-callout">${icon('shield')}查询结果只显示当前授权范围内的脱敏业务信息，正式办理仍校验顾客、购买记录、商品状态和活动工单。</p>`}
  if(kind==='knowledge')return {title:'服务知识库',body:`<label class="cs3-tool-search">${icon('search')}<input value="智能坐便器 遥控器" aria-label="搜索服务知识库"><button type="button" data-tool-query="knowledge">搜索</button></label><div class="cs3-tool-results">${toolResult('archive','智能坐便器遥控器重新配对','适用品番 CW992 · 指引版本 3 · 2026-08-18 生效','<button type="button" data-tool-choose="已打开知识指引">查看指引</button>',true)}${toolResult('archive','遥控器无响应的基础排查','检查电池、配对状态与遮挡；现场拆机前须转维修服务。','<button type="button" data-tool-choose="已打开排查指引">查看指引</button>')}${toolResult('archive','常见使用问题沟通话术','客服沟通参考，不替代产品维修判断。','<button type="button" data-tool-choose="已打开沟通话术">查看</button>')}</div>`}
  if(kind==='communication')return {title:'补记沟通',body:`<div class="cs3-tool-results">${toolResult('headset',`${item.customer} · ${item.id}`,`${item.type} · ${item.phone} · ${item.status}`,'',true)}</div><form class="cs3-form" style="margin-top:12px"><div class="cs3-form-grid"><label><span>沟通方式 <em>*</em></span><select aria-label="沟通方式"><option>电话呼出</option><option>电话呼入</option><option>在线客服</option></select></label><label><span>沟通结果 <em>*</em></span><select aria-label="沟通结果"><option>已联系并确认</option><option>未接通</option><option>待对方回复</option></select></label></div><label><span>沟通记录 <em>*</em></span><textarea aria-label="沟通记录">已向顾客确认当前诉求与可联系时间。</textarea></label><button class="primary-button" type="button" data-tool-save>保存沟通记录</button></form>`}
  return {title:'顾客与工单统一查询',body:`<label class="cs3-tool-search">${icon('search')}<input value="138 0000 9123" aria-label="搜索顾客、工单、手机号或安装码"><button type="button" data-tool-query="lookup">查询</button></label><div class="cs3-tool-results">${toolResult('user','王女士 · 138****9123','2 条购买记录 · 1 张活动工单','<button type="button" data-tool-choose="已查看顾客完整记录">查看记录</button>',true)}${toolResult('clipboard','AS202609170001 · 安装待受理','智能坐便器 · 400 热线 · 等待 42 分钟','<button type="button" data-open-record="AS202609170001">打开办理</button>')}${toolResult('archive','PR202406120018 · 购买记录','安装码 TO-8C92 · 当前商品实例可办理','<button type="button" data-tool="code">核验商品</button>')}</div>`}
}

function openTool(kind){
  const view=toolMarkup(kind)
  $('toolTitle').textContent=view.title
  $('toolBody').innerHTML=view.body
  openOverlay($('toolDialog'))
  $('toolBody').querySelectorAll('[data-tool-query]').forEach(button=>button.addEventListener('click',()=>showToast('已按当前授权范围刷新查询结果')))
  $('toolBody').querySelectorAll('[data-tool-choose]').forEach(button=>button.addEventListener('click',()=>showToast(button.dataset.toolChoose)))
  $('toolBody').querySelectorAll('[data-open-record]').forEach(button=>button.addEventListener('click',()=>{closeOverlays();selectRecord(button.dataset.openRecord);showToast('已打开工单，可在当前页继续办理')}))
  $('toolBody').querySelectorAll('[data-use-code]').forEach(button=>button.addEventListener('click',()=>{closeOverlays();startNewIntake();showToast('已把安装码带入新的服务受理')}))
  $('toolBody').querySelectorAll('[data-tool-save]').forEach(button=>button.addEventListener('click',()=>{closeOverlays();showToast('沟通记录已保存到当前工单')}))
  bindToolButtons($('toolBody'))
}

function showToast(message){
  $('toast').textContent=message;$('toast').classList.add('is-visible')
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('is-visible'),2200)
}

function openOverlay(panel){$('scrim').hidden=false;panel.hidden=false;panel.querySelector('button,input')?.focus()}
function closeOverlays(){$('scrim').hidden=true;$('prototypePanel').hidden=true;$('commandDialog').hidden=true;$('toolDialog').hidden=true}

function renderCommands(keyword=''){
  const commands=['客服工作台','服务受理','服务工单','派单调度','完工审核','异常工单','投诉管理','顾客购买记录','安装码管理','服务知识库','商品档案','服务质量','运营报表']
  const result=commands.filter(item=>item.includes(keyword.trim()))
  $('commandResults').innerHTML=result.length?result.map(item=>`<button type="button" data-command="${item}"><strong>${item}</strong><span>客服作业</span></button>`).join(''):'<div class="cs3-empty"><div><strong>未找到功能</strong><p>请尝试其他关键词。</p></div></div>'
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{closeOverlays();showToast(`${button.dataset.command}：入口已保留`)}))
}

function bindEvents(){
  $('workSearch').addEventListener('input',renderInbox)
  $('workbasketButton').addEventListener('click',()=>selectQueue('workbasket'))
  document.querySelectorAll('[data-summary-queue]').forEach(button=>button.addEventListener('click',()=>selectQueue(button.dataset.summaryQueue)))
  document.querySelectorAll('[data-action="intake"]').forEach(button=>button.addEventListener('click',startNewIntake))
  $('prototypeFab').addEventListener('click',()=>openOverlay($('prototypePanel')))
  $('perspectiveButton').addEventListener('click',()=>openOverlay($('prototypePanel')))
  $('closePrototypePanel').addEventListener('click',closeOverlays)
  $('closeToolDialog').addEventListener('click',closeOverlays)
  $('scrim').addEventListener('click',closeOverlays)
  $('searchButton').addEventListener('click',()=>{renderCommands();openOverlay($('commandDialog'))})
  $('commandInput').addEventListener('input',event=>renderCommands(event.target.value))
  $('sidebarButton').addEventListener('click',()=>{const shell=$('appShell');shell.classList.toggle('is-sidebar-collapsed');$('sidebarButton').querySelector('span:last-child').textContent=shell.classList.contains('is-sidebar-collapsed')?'展开菜单':'收起菜单'})
  $('scopeButton').addEventListener('click',event=>{event.stopPropagation();$('scopePopover').hidden=!$('scopePopover').hidden})
  $('refreshButton').addEventListener('click',()=>{showToast('演示数据已刷新');renderOverview();renderInbox();renderTask();renderContext()})
  $('themeButton').addEventListener('click',()=>{const root=document.documentElement;const dark=root.dataset.theme!=='dark';root.dataset.theme=dark?'dark':'light';$('themeButton').innerHTML=icon(dark?'sun':'moon')})
  $('fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(_){showToast('浏览器未允许进入全屏')}})
  $('queueStateButton').addEventListener('click',()=>showToast('队列支持有数据、加载、空数据、失败与无权限状态'))
  document.querySelectorAll('.menu-group-title').forEach(button=>button.addEventListener('click',()=>{const group=button.closest('.menu-group');group.classList.toggle('is-open');button.setAttribute('aria-expanded',String(group.classList.contains('is-open')))}))
  document.addEventListener('click',event=>{if(!event.target.closest('#scopeButton')&&!event.target.closest('#scopePopover'))$('scopePopover').hidden=true})
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();renderCommands();openOverlay($('commandDialog'))}if(event.key==='Escape'){closeOverlays();$('scopePopover').hidden=true;setContextOpen(false)}})
  bindPreviewButtons()
  bindToolButtons()
}

$('customerWorkbenchApp').innerHTML=shellMarkup()
renderOverview();renderInbox();renderTask();renderContext();bindEvents()
})()
