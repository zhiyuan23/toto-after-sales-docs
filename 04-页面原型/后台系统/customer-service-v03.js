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
  acceptance:{label:'待受理',total:18,caption:'PENDING_ACCEPTANCE'},
  station:{label:'待分配服务站',total:6,caption:'客服可办'},
  dispatch:{label:'待服务站派人',total:12,caption:'跟进站点进度'},
  review:{label:'待完工审核',total:7,caption:'PENDING_REVIEW'},
  complaint:{label:'待定责投诉',total:5,caption:'OPEN 队列'},
  all:{label:'全部工单',total:248,caption:'包含关闭与取消'}
}

const records=[
  {id:'AS202609170001',queue:'acceptance',type:'安装',customer:'王女士',phone:'138****9123',context:'智能坐便器 · 400 热线',time:'等待 42 分钟',attention:true,status:'待受理',action:'创建服务工单'},
  {id:'AS202609170002',queue:'acceptance',type:'维修',customer:'陈女士',phone:'159****3287',context:'智能柜 · 安装码 TO-8C92',time:'新进 8 分钟',status:'待受理',action:'创建服务工单'},
  {id:'AS202609160998',queue:'acceptance',type:'使用指导',customer:'刘女士',phone:'186****7721',context:'智能坐便器 · 微信公众号',time:'等待 1 小时 28 分',attention:true,status:'待受理',action:'创建服务工单'},
  {id:'AS202609160997',queue:'station',type:'安装',customer:'沈女士',phone:'137****6655',context:'浦东新区张杨路 · 候选 2 站',time:'待办 23 分钟',status:'待分配服务站',action:'确认分配'},
  {id:'AS202609160996',queue:'station',type:'维修',customer:'宋先生',phone:'139****4411',context:'徐汇区虹桥路 · 匹配完成',time:'待办 36 分钟',status:'待分配服务站',action:'确认分配'},
  {id:'AS202609160995',queue:'dispatch',type:'维修',customer:'赵先生',phone:'136****2210',context:'杭州拱墅服务站',time:'已分站 2 小时',status:'待服务站派人',action:'跟进站点'},
  {id:'AS202609160994',queue:'dispatch',type:'安装',customer:'冯女士',phone:'188****3322',context:'广州天河服务站',time:'已分站 3 小时',attention:true,status:'待服务站派人',action:'转服务站'},
  {id:'AS202609160993',queue:'review',type:'维修',customer:'邹先生',phone:'135****7766',context:'现场照片 3 张 · 有配件耗用',time:'提交 26 分钟',status:'待完工审核',action:'审核通过'},
  {id:'CP202609170005',queue:'complaint',type:'投诉',customer:'周女士',phone:'137****8899',context:'关联 AS202609150041 · 服务履约阶段',time:'待定责 51 分钟',attention:true,status:'待定责',action:'提交定责记录'}
]

let activeQueue='acceptance'
let selectedId=records[0].id
let toastTimer

function menuMarkup(){
  const groups=[['工单处理',['客服工作台','服务受理','服务工单','派单调度','完工审核']],['异常与投诉',['异常工单','投诉管理']],['业务查询',['顾客购买记录','安装码管理','服务知识库','商品档案']],['服务分析',['服务质量','运营报表']]]
  return groups.map((group,index)=>`<section class="menu-group${index<2?' is-open':''}"><button class="menu-group-title" type="button" aria-expanded="${index<2}"><span>${group[0]}</span>${icon('chevron-down')}</button><div class="menu-list">${group[1].map((item,itemIndex)=>`<button type="button" class="menu-item${index===0&&itemIndex===0?' is-active':''}" data-preview="${item}">${icon(index===0&&itemIndex===0?'gauge':item.includes('工单')?'clipboard':'archive')}<span>${item}</span></button>`).join('')}</div></section>`).join('')
}

function shellMarkup(){
  return `<div class="app-shell" id="appShell"><header class="topbar"><a class="brand" href="index.html" aria-label="TOTO 售后服务首页"><span class="brand-mark" aria-hidden="true"><span>T</span></span><span class="brand-copy"><strong>TOTO 售后服务</strong><small>Blue Whale Digital</small></span></a><button class="perspective-switch" type="button" id="perspectiveButton"><span class="perspective-icon icon">${svgIcon('headset')}</span><span><small>当前工作视角</small><strong>客服作业</strong></span>${icon('chevron-down')}</button><nav class="module-nav" aria-label="一级功能"><button type="button" class="module-link is-active">${icon('gauge')}工单处理</button><button type="button" class="module-link" data-preview="异常与投诉">${icon('clipboard')}异常与投诉</button><button type="button" class="module-link" data-preview="业务查询">${icon('archive')}业务查询</button></nav><div class="topbar-actions"><button class="search-trigger" type="button" id="searchButton">${icon('search')}<span>搜索功能</span><kbd>⌘ K</kbd></button><button class="icon-button" type="button" id="fullscreenButton" aria-label="进入全屏">${icon('maximize')}</button><button class="icon-button" type="button" id="refreshButton" aria-label="刷新数据">${icon('refresh')}</button><button class="icon-button" type="button" id="themeButton" aria-label="切换深浅模式">${icon('moon')}</button><button class="user-menu" type="button" data-preview="个人菜单"><span class="avatar">客</span><span>客服主管</span>${icon('chevron-down')}</button></div></header><aside class="sidebar" aria-label="客服作业功能菜单"><div class="sidebar-scroll">${menuMarkup()}</div><button class="sidebar-collapse" id="sidebarButton" type="button">${icon('panel-left')}<span>收起菜单</span></button></aside><main class="workspace cs3-workspace" id="workspace">${workspaceMarkup()}</main></div>${overlayMarkup()}`
}

function workspaceMarkup(){
  const today=new Date()
  return `<div class="page-heading role-heading cs3-heading"><div class="role-heading-main"><div><div class="context-line"><span>${today.getFullYear()} 年 ${today.getMonth()+1} 月 ${today.getDate()} 日</span><i></i><span>授权组织范围</span><button type="button" id="scopeButton">全国客服中心${icon('chevron-down')}</button></div><h1>客服工作台</h1><p>按优先级找到下一项任务，在当前页完成受理、分站、审核和投诉跟进。</p></div><span class="cs3-version">v0.3 · 新版</span></div><div class="heading-actions"><a class="secondary-button" href="customer-service.html">查看现版</a><span class="sample-badge"><span class="status-dot"></span>原型演示数据</span><button class="primary-button" type="button" id="newIntakeButton">${icon('plus')}发起服务受理</button></div></div><section class="cs3-overview" aria-label="客服待办概览"><div class="cs3-queue-strip" id="queueStrip"></div><article class="cs3-rhythm" aria-label="今日处理节奏"><div class="cs3-rhythm-copy"><span>今日已处理</span><strong>34</strong><small>较昨日同时 +6</small></div><div class="cs3-rhythm-chart" aria-label="9 点至 14 点每小时处理量"><span><i style="--h:28%"></i><small>09</small></span><span><i style="--h:46%"></i><small>10</small></span><span><i style="--h:72%"></i><small>11</small></span><span><i style="--h:42%"></i><small>12</small></span><span><i style="--h:61%"></i><small>13</small></span><span><i style="--h:84%"></i><small>14</small></span></div></article></section><section class="cs3-board"><article class="cs3-panel cs3-inbox"><header class="cs3-panel-heading"><div><h2>待办队列</h2><p>数量取各队列分页 total，搜索不改变统计口径</p></div><button class="plain-icon-button" type="button" id="queueStateButton" aria-label="队列状态演示">${icon('info')}</button></header><label class="cs3-search">${icon('search')}<input id="workSearch" type="search" placeholder="搜工单、顾客、手机或安装码" aria-label="搜索客服待办"></label><div class="cs3-tabs" id="queueTabs" role="tablist" aria-label="客服待办队列"></div><div class="cs3-inbox-list" id="inboxList"></div><footer class="cs3-inbox-footer"><span id="inboxCount"></span><button type="button" data-preview="完整工单列表">打开完整列表</button></footer></article><article class="cs3-panel cs3-task" id="taskPanel"></article><aside class="cs3-panel cs3-context" id="contextPanel"></aside></section>`
}

function overlayMarkup(){
  return `<button class="prototype-fab" id="prototypeFab" type="button">${icon('layout')}<span>原型目录</span><strong>客服 2 版</strong></button><div class="scrim" id="scrim" hidden></div><aside class="prototype-panel" id="prototypePanel" role="dialog" aria-modal="true" aria-labelledby="prototypeTitle" hidden><header><div><span class="panel-kicker">WEB 管理后台</span><h2 id="prototypeTitle">客服工作台版本</h2><p>现版保留，新版独立评审。</p></div><button class="icon-button" id="closePrototypePanel" type="button" aria-label="关闭原型目录">${icon('x')}</button></header><div class="prototype-list"><a href="customer-service-v03.html" class="prototype-card is-current"><span class="prototype-number">03</span><span class="prototype-copy"><span class="prototype-status is-ready">当前</span><strong>客服聚焦办理台</strong><small>三栏同页办理</small></span>${icon('arrow-up-right')}</a><a href="customer-service.html" class="prototype-card"><span class="prototype-number">02</span><span class="prototype-copy"><span class="prototype-status is-ready">已保留</span><strong>客服工作台现版</strong><small>指标＋泳道＋抽屉</small></span>${icon('arrow-up-right')}</a><a href="index.html" class="prototype-card"><span class="prototype-number">01</span><span class="prototype-copy"><span class="prototype-status">其他视角</span><strong>总部运营</strong><small>返回后台原型</small></span>${icon('arrow-up-right')}</a></div><footer><a href="01-四视角后台原型设计说明.md">查看原型设计说明${icon('arrow-right')}</a><a href="../README.md">返回全部页面原型</a></footer></aside><div class="command-dialog" id="commandDialog" role="dialog" aria-modal="true" aria-label="搜索功能" hidden><label>${icon('search')}<input id="commandInput" type="search" placeholder="输入功能名称…"><kbd>ESC</kbd></label><div class="command-results" id="commandResults"></div></div><div class="popover scope-popover" id="scopePopover" hidden><span>当前授权范围</span><strong>全国客服中心</strong><p>工作台只聚合获授权数据；每项办理仍校验功能、动作权限、对象范围和后端 actions。</p></div><div class="toast cs3-toast" id="toast" role="status" aria-live="polite"></div>`
}

function queueStripMarkup(){
  return ['acceptance','station','dispatch','review','complaint'].map(key=>{const item=queueMeta[key];return `<button type="button" class="cs3-queue-button${key==='complaint'?' is-danger':''}" data-queue="${key}" aria-pressed="${activeQueue===key}"><span>${item.label}</span><strong>${item.total}</strong><small>${item.caption}</small></button>`}).join('')
}

function tabsMarkup(){
  return Object.entries(queueMeta).map(([key,item])=>`<button type="button" role="tab" data-tab="${key}" aria-selected="${activeQueue===key}">${key==='dispatch'?'待派人':item.label}<b>${item.total}</b></button>`).join('')
}

function filteredRecords(){
  const keyword=$('workSearch')?.value.trim().toLowerCase()||''
  return records.filter(item=>(activeQueue==='all'||item.queue===activeQueue)&&(!keyword||`${item.id}${item.customer}${item.phone}${item.context}${item.type}`.toLowerCase().includes(keyword)))
}

function renderOverview(){
  $('queueStrip').innerHTML=queueStripMarkup()
  $('queueTabs').innerHTML=tabsMarkup()
  document.querySelectorAll('[data-queue]').forEach(button=>button.addEventListener('click',()=>selectQueue(button.dataset.queue)))
  document.querySelectorAll('[data-tab]').forEach(button=>button.addEventListener('click',()=>selectQueue(button.dataset.tab)))
}

function renderInbox(){
  const rows=filteredRecords()
  $('inboxList').innerHTML=rows.length?rows.map(item=>`<button type="button" class="cs3-inbox-item${item.attention?' is-attention':''}" data-record="${item.id}" aria-current="${selectedId===item.id}"><span class="item-main"><span class="item-id">${item.id}<span class="cs3-badge${item.queue==='complaint'?' is-danger':item.attention?' is-warn':''}">${item.type}</span></span><span class="item-copy">${item.customer} · ${item.phone}</span><span class="item-meta">${item.context}</span></span><span class="item-side"><strong>${item.time}</strong><small>${item.status}</small></span></button>`).join(''):`<div class="cs3-empty"><div><span>${icon('search')}</span><strong>未找到匹配待办</strong><p>请调整搜索词或切换队列。</p></div></div>`
  $('inboxCount').textContent=`共 ${queueMeta[activeQueue].total} 条，当前显示 ${rows.length} 条演示数据`
  document.querySelectorAll('[data-record]').forEach(button=>button.addEventListener('click',()=>selectRecord(button.dataset.record)))
  if(!rows.some(item=>item.id===selectedId)&&rows.length)selectedId=rows[0].id
}

function progressMarkup(queue){
  const steps=['客服受理','分配服务站','站点派人','现场履约','完工审核']
  const order={acceptance:0,station:1,dispatch:2,review:4,complaint:0,all:4}
  const current=order[queue]??0
  return `<div class="cs3-progress" aria-label="工单进度">${steps.map((step,index)=>`<span class="cs3-progress-step${index<current?' is-done':index===current?' is-current':''}"><i>${index<current?svgIcon('check'):index+1}</i><span>${step}</span></span>`).join('')}</div>`
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

function footerActions(item){
  if(item.queue==='review')return `<button class="secondary-button" type="button" data-submit="return">退回补充</button><button class="primary-button" type="button" data-submit="review">审核通过</button>`
  if(item.queue==='dispatch')return `<button class="secondary-button" type="button" data-submit="save">保存跟进</button><button class="primary-button" type="button" data-submit="transfer">确认转服务站</button>`
  return `<button class="secondary-button" type="button" data-submit="draft">暂存</button><button class="primary-button" type="button" data-submit="primary">${item.action}</button>`
}

function renderTask(){
  const item=records.find(record=>record.id===selectedId)||records[0]
  $('taskPanel').innerHTML=`<header class="cs3-panel-heading cs3-task-heading"><div class="cs3-task-title">${icon(item.queue==='complaint'?'triangle-alert':'clipboard')}<div><h2>${item.status}</h2><span class="task-id">${item.id} · ${item.type} · ${item.customer}</span></div></div><span class="cs3-permission">${icon('shield')}按 actions 显示可办动作</span></header>${progressMarkup(item.queue)}<div class="cs3-task-scroll">${taskBody(item)}</div><footer class="cs3-task-footer"><span>${icon('check')}未保存内容在离开前会请求确认</span><div>${footerActions(item)}</div></footer>`
  $('taskPanel').querySelectorAll('[data-submit]').forEach(button=>button.addEventListener('click',()=>finishTask(button.dataset.submit,item)))
  bindPreviewButtons($('taskPanel'))
}

function renderContext(){
  const item=records.find(record=>record.id===selectedId)||records[0]
  $('contextPanel').innerHTML=`<header class="cs3-panel-heading"><div><h2>当前业务上下文</h2><p>随待办切换，办理时不丢失顾客与商品线索</p></div></header><div class="cs3-context-scroll"><section class="cs3-context-card"><h3>顾客与联系方式<button type="button" data-preview="顾客购买记录">查看记录</button></h3><div class="cs3-profile"><span class="cs3-profile-avatar">${item.customer[0]}</span><span class="cs3-profile-copy"><strong>${item.customer}</strong><span>${item.phone}</span><small>当前仅展示脱敏联系方式</small></span></div><dl class="cs3-fact-list"><div><dt>服务地址</dt><dd>上海市浦东新区张杨路</dd></div><div><dt>本次来源</dt><dd>${item.context.split('·').pop().trim()}</dd></div><div><dt>期望日期</dt><dd>2026-09-20</dd></div></dl></section><section class="cs3-context-card"><h3>关联商品<button type="button" data-preview="商品档案">商品档案</button></h3><div class="cs3-product"><span class="cs3-product-mark">TOTO</span><span><strong>智能坐便器 · CW992</strong><small>安装码 TO-8C92 · 商品实例当前可办理</small></span></div></section><section class="cs3-context-card"><h3>最近服务记录<button type="button" data-preview="全部服务历史">全部历史</button></h3><ol class="cs3-history"><li><i></i><span><strong>今日 09:42 · 进入${item.status}</strong><small>当前授权队列</small></span></li><li><i></i><span><strong>09-16 · 顾客留下服务诉求</strong><small>来源信息已脱敏</small></span></li><li><i></i><span><strong>2024-06-12 · 购买登记</strong><small>上海浦东授权门店</small></span></li></ol></section><section class="cs3-context-card"><h3>办理辅助</h3><div class="cs3-shortcuts"><button type="button" data-preview="安装码查询">${icon('scan')}<strong>安装码查询</strong><small>授权范围内详情</small></button><button type="button" data-preview="服务知识库">${icon('archive')}<strong>服务知识库</strong><small>按问题快速检索</small></button></div></section></div>`
  bindPreviewButtons($('contextPanel'))
}

function selectQueue(key){
  activeQueue=key
  const first=records.find(item=>key==='all'||item.queue===key)
  if(first)selectedId=first.id
  renderOverview();renderInbox();renderTask();renderContext()
}

function selectRecord(id){
  selectedId=id
  renderInbox();renderTask();renderContext()
}

function finishTask(outcome,item){
  if(outcome==='draft'||outcome==='save'){showToast('已保存当前原型草稿');return}
  const oldQueue=item.queue
  if(outcome==='return'){
    item.status='已退回补充';item.queue='all';queueMeta.review.total=Math.max(0,queueMeta.review.total-1)
  }else if(oldQueue==='acceptance'){
    item.status='待分配服务站';item.queue='station';item.action='确认分配';queueMeta.acceptance.total--;queueMeta.station.total++
  }else if(oldQueue==='station'){
    item.status='待服务站派人';item.queue='dispatch';item.action='跟进站点';queueMeta.station.total--;queueMeta.dispatch.total++
  }else if(oldQueue==='review'){
    item.status='待回访';item.queue='all';queueMeta.review.total--
  }else if(oldQueue==='complaint'){
    item.status='投诉处理中';item.queue='all';queueMeta.complaint.total--
  }else if(outcome==='transfer'){
    item.status='已转服务站，待站点派人'
  }
  const next=records.find(record=>record.queue===oldQueue&&record.id!==item.id)||records.find(record=>record.queue===item.queue)||records[0]
  activeQueue=oldQueue
  selectedId=next.id
  renderOverview();renderInbox();renderTask();renderContext()
  showToast(`${item.id} 已完成本次原型办理，已定位到下一项`)
}

function startNewIntake(){
  const item={id:'新建服务受理',queue:'acceptance',type:'待选择',customer:'待识别顾客',phone:'—',context:'客服人工受理',time:'刚刚',status:'服务受理',action:'创建服务工单'}
  if(!records.some(record=>record.id===item.id))records.unshift(item)
  activeQueue='acceptance';selectedId=item.id
  renderOverview();renderInbox();renderTask();renderContext()
  $('taskPanel').querySelector('input')?.focus()
}

function bindPreviewButtons(root=document){
  root.querySelectorAll('[data-preview]').forEach(button=>button.addEventListener('click',()=>showToast(`${button.dataset.preview}：专业页入口已保留`)))
}

function showToast(message){
  $('toast').textContent=message;$('toast').classList.add('is-visible')
  clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('is-visible'),2200)
}

function openOverlay(panel){$('scrim').hidden=false;panel.hidden=false;panel.querySelector('button,input')?.focus()}
function closeOverlays(){$('scrim').hidden=true;$('prototypePanel').hidden=true;$('commandDialog').hidden=true}

function renderCommands(keyword=''){
  const commands=['客服工作台','服务受理','服务工单','派单调度','完工审核','异常工单','投诉管理','顾客购买记录','安装码管理','服务知识库','商品档案','服务质量','运营报表']
  const result=commands.filter(item=>item.includes(keyword.trim()))
  $('commandResults').innerHTML=result.length?result.map(item=>`<button type="button" data-command="${item}"><strong>${item}</strong><span>客服作业</span></button>`).join(''):'<div class="cs3-empty"><div><strong>未找到功能</strong><p>请尝试其他关键词。</p></div></div>'
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{closeOverlays();showToast(`${button.dataset.command}：入口已保留`)}))
}

function bindEvents(){
  $('workSearch').addEventListener('input',renderInbox)
  $('newIntakeButton').addEventListener('click',startNewIntake)
  $('prototypeFab').addEventListener('click',()=>openOverlay($('prototypePanel')))
  $('perspectiveButton').addEventListener('click',()=>openOverlay($('prototypePanel')))
  $('closePrototypePanel').addEventListener('click',closeOverlays)
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
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();renderCommands();openOverlay($('commandDialog'))}if(event.key==='Escape'){closeOverlays();$('scopePopover').hidden=true}})
  bindPreviewButtons()
}

$('customerWorkbenchApp').innerHTML=shellMarkup()
renderOverview();renderInbox();renderTask();renderContext();bindEvents()
})()
