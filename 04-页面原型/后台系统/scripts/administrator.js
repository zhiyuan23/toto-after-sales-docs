// Icon paths from the shared backend prototype glyph set.
const icons={
users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M22 21v-2a4 4 0 0 0-3-3.87"/><circle cx="9" cy="7" r="4"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3ZM9 3v15M15 6v15"/>',
'map-pin':'<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
check:'<path d="m5 12 4 4L19 6"/>',
'arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>','arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',archive:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M9 13h6M5 2h14"/>',boxes:'<path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>','building-plus':'<path d="M6 22V4c0-.55.45-1 1-1h10c.55 0 1 .45 1 1v18M6 12H4c-.55 0-1 .45-1 1v9M18 9h3M19.5 7.5v3M10 7h4M10 11h4M10 15h4M9 22v-3h6v3"/>',chart:'<path d="M3 3v18h18M7 16l4-5 4 3 5-7"/>','chevron-down':'<path d="m6 9 6 6 6-6"/>','chevron-right':'<path d="m9 18 6-6-6-6"/>',clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>','file-chart':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 18v-3M12 18v-6M16 18v-8"/>',flask:'<path d="M9 3h6M10 9V3h4v6l5 9a2 2 0 0 1-1.74 3H6.74A2 2 0 0 1 5 18Z"/><path d="M7.5 15h9"/>',gauge:'<path d="M20.38 8.57a9 9 0 1 0 .13 6.58"/><path d="m12 12 4-4M7.5 8.5h.01M12 6h.01M16.5 8.5h.01"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',layers:'<path d="m12 2 9 5-9 5-9-5Z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>',layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 9h12"/>',lock:'<rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5Z"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',package:'<path d="m12 2 9 5-9 5-9-5Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10M7.5 4.5l9 5"/>','panel-left':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 9l-3 3 3 3"/>',receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',refresh:'<path d="M20 7h-5V2M4 17h5v5"/><path d="M5.2 9A8 8 0 0 1 18 5l2 2M18.8 15A8 8 0 0 1 6 19l-2-2"/>',scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',sliders:'<path d="M4 6h16M4 12h16M4 18h16M8 4v4M16 10v4M10 16v4"/>',store:'<path d="M3 9l2-6h14l2 6M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>','triangle-alert':'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',wrench:'<path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17a2 2 0 1 0 3 3l7.7-8.3a4 4 0 0 0 0-5.4Z"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>'}
;
/* Prototype only: no backend requests, authentication or configuration writes. */
(() => {
  'use strict'
  const $ = id => document.getElementById(id)
  const icon = name => `<i data-icon="${name}" aria-hidden="true"><svg viewBox="0 0 24 24">${icons[name] || icons.info}</svg></i>`
  function paintIcons(root = document) {
    root.querySelectorAll('[data-icon]').forEach(node => {
      node.setAttribute('aria-hidden', 'true')
      node.innerHTML = `<svg viewBox="0 0 24 24">${icons[node.dataset.icon] || icons.info}</svg>`
    })
  }
  const records = [
    { id:'DEMO-01', time:'09:38:24', category:'外部调用', tone:'external', title:'AI 服务调用未成功', source:'AI 外部调用', action:'AI_ASSISTANT', summary:'外部调用返回失败，请结合追踪编号查看相关记录。', object:'消费者助手', trace:'demo-ai-20261019-093824', status:'502', code:'EXTERNAL_CALL_FAILED' },
    { id:'DEMO-02', time:'09:31:08', category:'请求', tone:'', title:'工单详情请求未成功', source:'售后接口请求', action:'GET /api/afterSales/work-order/{id}', summary:'请求未完成，请根据业务错误码与关联记录进一步定位。', object:'服务工单', trace:'demo-order-20261019-093108', status:'200', code:'BUSINESS_FAILURE' },
    { id:'DEMO-03', time:'09:26:41', category:'安全', tone:'login', title:'后台账号登录校验失败', source:'Gaia 登录日志', action:'LOGIN', summary:'登录校验未通过。单条失败记录不能据此判定为安全攻击。', object:'后台登录', trace:'', status:'—', code:'LOGIN_VALIDATION_FAILED' },
    { id:'DEMO-04', time:'09:19:35', category:'客户端', tone:'client', title:'消费者端请求异常上报', source:'消费者客户端诊断', action:'CLIENT_REQUEST_ERROR', summary:'客户端上报请求异常，请按关联号检查服务端记录。', object:'消费者小程序', trace:'demo-client-20261019-091935', status:'—', code:'REQUEST_ERROR' },
    { id:'DEMO-05', time:'09:14:12', category:'请求', tone:'', title:'库存查询请求未成功', source:'售后接口请求', action:'GET /api/afterSales/inventory', summary:'请求返回业务失败，请查看业务错误码及关联请求。', object:'配件库存', trace:'demo-stock-20261019-091412', status:'200', code:'BUSINESS_FAILURE' },
    { id:'DEMO-06', time:'09:07:52', category:'安全', tone:'login', title:'后台账号登录校验失败', source:'Gaia 登录日志', action:'LOGIN', summary:'登录校验未通过，请结合记录上下文进行核查。', object:'后台登录', trace:'', status:'—', code:'LOGIN_VALIDATION_FAILED' },
  ]
  const tasks = [
    {name:'业务字典导出', status:'处理中', time:'09:35'},
    {name:'商品档案导出', status:'已完成', time:'09:20'},
  ]
  // Illustrative counts only; use existing scoped identity lists and page nodes on integration.
  // Daily counts are illustrative full-day aggregates, independent of the six-row preview.
  const dailyCounts = [{name:'请求',count:7,tone:'request',glyph:'clipboard'},{name:'外部调用',count:5,tone:'external',glyph:'layers'},{name:'安全',count:4,tone:'security',glyph:'lock'},{name:'其他',count:2,tone:'other',glyph:'layout'}]
  const identityStats = { users: { total: 24, enabled: 22, disabled: 2 }, roles: 7, pages: 48 }
  const sideGroups = {
    系统管理:[['','工作台','gauge'],['账号与权限','用户管理','users'],['','角色管理','shield'],['','菜单与权限','lock'],['系统运维','日志查询','clipboard'],['','外部服务配置','sliders']],
    服务运营:[['服务运营','服务工单','clipboard'],['','投诉管理','shield'],['客户与会员','顾客购买记录','archive'],['','会员档案','building'],['运营配置','服务设置','sliders'],['岗位工作台','总部运营','gauge'],['','客服作业','gauge'],['','服务站作业','gauge'],['','门店业务','gauge']],
    基础资料:[['商品资料','商品分类','layers'],['','商品档案','archive'],['字典与模板','业务字典','database'],['','导入导出模板','archive']],
    配件库存:[['配件资料','配件档案','archive'],['配件库存','配件入库','boxes'],['','配件库存','boxes'],['领退料','领料单','clipboard'],['','退料单','clipboard']],
  }
  let filter = '全部', scenario = 'default', pending, toastTimer, dialogReturnFocus
  const serviceOriginal = $('servicesPanel').innerHTML
  const accessOriginal = $('accessPanel').innerHTML
  function toast(message) {
    clearTimeout(toastTimer); $('toast').textContent=message; $('toast').hidden=false
    toastTimer=setTimeout(() => { $('toast').hidden=true }, 3200)
  }
  function drawSide(module) {
    $('sideMenus').innerHTML=sideGroups[module].map(([group,name,glyph]) => `${group ? `<p class="side-label">${group}</p>` : ''}<button class="side-link ${name==='工作台'?'active':''}" data-open="${name}">${icon(glyph)}<span>${name}</span></button>`).join('')
  }
  function stateMarkup(glyph,title,description,retry=false) {
    return `<div class="state">${icon(glyph)}<strong>${title}</strong><p>${description}</p>${retry ? '<button class="button" data-retry>重新读取</button>' : ''}</div>`
  }
  function draw() {
    const denied=scenario==='denied', error=scenario==='error', empty=scenario==='empty', partial=scenario==='partial'
    $('failureOverview').hidden=denied
    $('failureCount').innerHTML=error?'—':`${empty?'0':partial?'12':'18'}<small>条</small>`
    $('failureNote').textContent=error?'读取失败，数量未知':partial?'仅含当前可查询来源':'当前可查来源'
    $('sourceWarning').hidden=!partial
    $('distributionPanel').hidden=denied
    const buckets=dailyCounts.map((item,index)=>({...item,count:empty?0:partial?[5,3,2,2][index]:item.count}))
    const total=buckets.reduce((sum,item)=>sum+item.count,0)
    $('distributionScope').textContent=error?'统计暂不可用':partial?`部分来源 · ${total} 条`:`当前授权来源 · ${total} 条`
    $('distributionChart').innerHTML=error?'<p class="distribution-state">读取失败，无法展示构成。<button class="text-button" data-retry>重试</button></p>':`<div class="distribution-track" role="img" aria-label="今日失败记录构成：${buckets.map(item=>`${item.name} ${item.count} 条`).join('，')}">${buckets.map(item=>`<span class="${item.tone}" style="flex-basis:${total?item.count/total*100:0}%" title="${item.name} ${item.count} 条"></span>`).join('')}</div><div class="distribution-legend">${buckets.map(item=>`<span class="legend-item ${item.tone}">${icon(item.glyph)}<span>${item.name}</span><b>${item.count}</b></span>`).join('')}</div>`
    document.querySelectorAll('[data-filter]').forEach(el => { el.setAttribute('aria-selected',String(el.dataset.filter===filter)); el.tabIndex=el.dataset.filter===filter?0:-1 })
    $('servicesPanel').innerHTML=serviceOriginal
    $('configOverview').hidden=scenario==='externalDenied'
    if(scenario==='externalError' || scenario==='externalDenied') {
      const unavailable=scenario==='externalError'
      $('servicesPanel').innerHTML=`<header class="panel-heading"><h2 id="servicesTitle">外部服务配置</h2></header><div class="services-state">${icon(unavailable?'triangle-alert':'lock')}<strong>${unavailable?'暂时无法读取配置':'当前账号无配置查看权限'}</strong><span>${unavailable?'配置状态未知，请重试。':'不展示配置内容，请联系有权限的管理员。'}</span>${unavailable?'<button class="button" data-retry>重新读取</button>':''}</div>`
      if(unavailable) { $('configOverview').querySelector('.overview-number').textContent='—'; $('configOverview').querySelector('.overview-note').textContent='配置读取失败，状态未知' }
    } else {
      $('configOverview').querySelector('.overview-number').innerHTML='1<small>项</small>'
      $('configOverview').querySelector('.overview-note').textContent='地图 JS 服务'
    }
    $('tasksButton').hidden=scenario==='tasksDenied'
    $('accessPanel').innerHTML=accessOriginal
    if(scenario==='accessError'||scenario==='accessDenied') {
      const error=scenario==='accessError'
      $('accessPanel').innerHTML=`<header class="panel-heading"><h2 id="accessTitle">账号与权限</h2></header>${stateMarkup(error?'triangle-alert':'lock',error?'账号概览读取失败':'当前账号无相关查看权限',error?'用户、角色和页面数量未知，请重新读取。':'不展示数量和管理入口，工作视角不替代功能授权。',error)}`
    } else {
      $('userCount').textContent=identityStats.users.total
      $('userStatus').textContent=`启用 ${identityStats.users.enabled} · 停用 ${identityStats.users.disabled}`
      $('enabledSegment').style.width=`${identityStats.users.enabled/identityStats.users.total*100}%`
      $('disabledSegment').style.width=`${identityStats.users.disabled/identityStats.users.total*100}%`
      $('userChart').setAttribute('aria-label',`${identityStats.users.total} 个示例用户：启用 ${identityStats.users.enabled}，停用 ${identityStats.users.disabled}`)
      $('roleCount').textContent=identityStats.roles
      $('menuCount').textContent=identityStats.pages
    }
    document.querySelectorAll('.side-link[data-open="用户管理"],.side-link[data-open="角色管理"],.side-link[data-open="菜单与权限"]').forEach(el=>{el.hidden=scenario==='accessDenied'})
    $('allLogs').hidden=denied
    document.querySelector('.log-tabs').hidden=denied||error
    document.querySelector('.log-columns').hidden=denied||error||empty
    document.querySelector('.log-footer').hidden=denied
    if(denied) $('logContent').innerHTML=stateMarkup('lock','当前账号无日志查看权限','工作视角不替代功能授权。请联系有权限的管理员查看，其他已授权管理功能仍可使用。')
    else if(error) $('logContent').innerHTML=stateMarkup('triangle-alert','日志暂时读取失败','当前失败记录数量未知，请重新读取。外部服务配置可独立查看。',true)
    else if(empty) $('logContent').innerHTML=stateMarkup('clipboard','今日可查询范围内暂无失败记录','可以查看其他日期的日志；此状态仅描述当前授权来源的查询结果。')
    else {
      const visible=records.filter(row => filter==='全部'||filter===row.category)
      $('listScope').textContent=filter==='全部'?'最近 6 条':`最近 6 条中 ${visible.length} 条`
      const categoryIcons={请求:'clipboard',外部调用:'layers',安全:'lock',客户端:'layout'}
      $('logContent').innerHTML=visible.map(row=>`<button class="log-row" data-record="${row.id}" aria-label="查看 ${row.time} ${row.title}，${row.category}，${row.source}，${row.object}，${row.status==='200'?'业务失败，HTTP 200':row.status==='—'?row.code:'HTTP '+row.status}"><span class="log-time">${row.time}</span><span class="log-row-body"><span class="event-icon ${row.tone}" title="${row.category}">${icon(categoryIcons[row.category])}</span><span class="event-copy"><strong title="${row.title}">${row.title}</strong><small class="trace-caption" title="${row.trace||'本来源未提供追踪编号'}">${row.trace||'未提供追踪编号'}</small></span></span><span class="log-source"><span title="${row.source}">${row.source}</span><small title="${row.object}">${row.object}</small></span><span class="log-result"><strong>${row.status==='200'?'业务失败':row.status==='—'?row.category==='安全'?'校验失败':'请求异常':'HTTP '+row.status}</strong><small title="${row.code}">${row.status==='200'?'HTTP 200':row.status==='—'?row.category==='安全'?'登录未通过':'客户端上报':'外部调用失败'}</small></span>${icon('chevron-right')}</button>`).join('')
    }
    $('logContent').scrollTop=0
    if(empty) $('listScope').textContent='0 条'
    document.querySelectorAll('[data-open="外部服务配置"]').forEach(el=>{ el.hidden=scenario==='externalDenied' })
    document.querySelectorAll('.side-link[data-open="日志查询"]').forEach(el=>{ el.hidden=denied })
    paintIcons()
  }
  function openDrawer(title,caption,body) {
    dialogReturnFocus=document.activeElement
    $('detailTitle').textContent=title; $('detailCaption').textContent=caption; $('detailBody').innerHTML=body
    paintIcons($('detailDialog')); $('detailDialog').showModal()
  }
  function detail(id) {
    const row=records.find(value=>value.id===id)
    if(!row)return
    openDrawer(row.title,'日志详情 · 虚构示例',`<span class="badge red">结果：失败</span><dl><dt>发生时间</dt><dd>2026-10-19 ${row.time}</dd><dt>类别 / 来源</dt><dd>${row.category} / ${row.source}</dd><dt>操作</dt><dd><code>${row.action}</code></dd><dt>业务对象</dt><dd>${row.object}</dd><dt>HTTP 状态</dt><dd>${row.status}</dd><dt>业务错误码</dt><dd><code>${row.code}</code></dd><dt>追踪编号</dt><dd>${row.trace?`<code>${row.trace}</code>`:'本来源未提供'}</dd></dl><h3>记录摘要</h3><p>${row.summary}</p><div class="drawer-hint">HTTP 200 仍可能对应业务失败。请结合结果与业务错误码判断。</div><div class="drawer-actions">${row.trace?`<button class="button" data-copy="${row.id}">复制追踪编号</button><button class="button primary" data-trace="${row.id}">查看关联记录</button>`:''}</div>`)
  }
  const entryDetails = {
    用户管理:['维护后台账号、启停状态和既有角色关系。首页示例为 24 个用户，其中启用 22、停用 2。','统计范围与售后用户列表一致；正式接入使用列表总数及启停状态筛选，不统计 Gaia 全系统账号。'],
    角色管理:['核对岗位角色与授权范围。首页示例为 7 个售后角色。','正式接入使用现有售后角色列表总数，不统计其他系统角色。'],
    菜单与权限:['维护既有菜单与精确操作授权。首页示例为 48 个售后页面。','页面数量按售后菜单管理树的页面节点统计，不含根节点、目录和操作权限；导航分组不产生额外权限。'],
    业务字典:['进入基础资料中的业务字典，维护已确认业务选项。','系统管理员 → 基础资料 → 字典与模板'],
    导入导出模板:['查看既有模板和场景说明，业务任务仍按本人权限处理。','系统管理员 → 基础资料 → 字典与模板'],
  }
  function entry(name) {
    const urls={总部运营:'../当前原型/headquarters-map.html',客服作业:'../当前原型/customer-service-v03.html',服务站作业:'../当前原型/service-station-v02.html',门店业务:'../当前原型/dealer.html'}
    if(urls[name]) { location.href=urls[name]; return }
    if(name==='工作台') { window.scrollTo({top:0,behavior:'auto'}); return }
    if(name==='日志查询') { logEntry(); return }
    if(name==='外部服务配置') {
      openDrawer(name,'管理入口预览 · 示例数据','<p>集中查看 AI、地图 Web 与地图 JS 服务配置。</p><dl><dt>AI 服务</dt><dd><span class="badge green">已启用 · 配置齐全</span></dd><dt>地图 Web</dt><dd><span class="badge green">已启用 · 配置齐全</span></dd><dt>地图 JS</dt><dd><span class="badge amber">已启用 · 配置待补齐</span></dd><dt>凭证来源</dt><dd>数据库配置</dd><dt>配置修订号</dt><dd>12</dd><dt>加密配置</dt><dd>已配置</dd><dt>最近更新</dt><dd>2026-10-19 09:12</dd></dl><h3>下一步</h3><p>进入正式配置页核对待补齐项，并按需测试连接。凭证来源由服务端配置决定，首页不展示私密凭证。</p><div class="drawer-hint">当前是布局与交互评审原型，没有保存配置或测试外部连接。</div>'); return
    }
    const info=entryDetails[name]||['从对应模块进入现有已授权功能。','本次原型仅设计管理员工作台。']
    openDrawer(name,'管理入口预览',`<p>${info[0]}</p><div class="drawer-hint">${info[1]}</div><h3>原型范围</h3><p>此处演示入口意图；正式实现跳转系统已有页面，并沿用其权限与数据范围。</p>`)
  }
  function logEntry(row) {
    openDrawer(row?'关联记录查询':'日志查询','下钻条件预览',`<p>正式页面继续查询当前条件下的日志，本原型展示应当继承的筛选条件。</p><dl><dt>时间范围</dt><dd>2026-10-19 00:00 至当前</dd><dt>结果</dt><dd>失败</dd><dt>类别</dt><dd>${row?'全部类别':filter}</dd>${row?`<dt>追踪编号</dt><dd><code>${row.trace}</code></dd>`:''}</dl><div class="drawer-hint">首页仅展示最近 6 条，完整日志在原日志查询页查看。此处不把最近记录推算为全量分布。</div>`)
  }
  document.addEventListener('click',async event=>{
    if(event.target.closest('[data-task-retry]')){scenario='default';$('scenario').value=scenario;$('detailBody').innerHTML=taskBody();paintIcons($('detailDialog'));return}
    const record=event.target.closest('[data-record]')
    if(record){detail(record.dataset.record);return}
    const target=event.target.closest('[data-open]')
    if(target){entry(target.dataset.open);return}
    const retry=event.target.closest('[data-retry]')
    if(retry){ scenario='default'; $('scenario').value=scenario; reload();return }
    const trace=event.target.closest('[data-trace]')
    if(trace){const row=records.find(value=>value.id===trace.dataset.trace);$('detailDialog').close();logEntry(row);return}
    const copy=event.target.closest('[data-copy]')
    if(copy){try{await navigator.clipboard.writeText(records.find(value=>value.id===copy.dataset.copy).trace);toast('已复制示例追踪编号')}catch{toast('复制未成功，请在详情中选择追踪编号复制。')}return}
  })
  document.querySelectorAll('[data-module]').forEach(el=>el.addEventListener('click',()=>{
    document.querySelectorAll('[data-module]').forEach(item=>item.classList.toggle('active',item===el));drawSide(el.dataset.module)
    if(scenario==='denied')document.querySelectorAll('.side-link[data-open="日志查询"]').forEach(item=>{item.hidden=true})
    if(scenario==='externalDenied')document.querySelectorAll('.side-link[data-open="外部服务配置"]').forEach(item=>{item.hidden=true})
    if(scenario==='accessDenied')document.querySelectorAll('.side-link[data-open="用户管理"],.side-link[data-open="角色管理"],.side-link[data-open="菜单与权限"]').forEach(item=>{item.hidden=true})
  }))
  document.querySelectorAll('[data-filter]').forEach(el=>el.addEventListener('click',()=>{filter=el.dataset.filter;draw()}))
  document.querySelector('.log-tabs').addEventListener('keydown',event=>{
    const tabs=[...document.querySelectorAll('[data-filter]')], index=tabs.indexOf(document.activeElement)
    if(index<0||!['ArrowRight','ArrowLeft','Home','End'].includes(event.key))return
    event.preventDefault()
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length
    tabs[next].click();tabs[next].focus()
  })
  function reload() {
    clearTimeout(pending);$('refreshButton').disabled=true;$('scenario').disabled=true
    $('logContent').innerHTML='<div class="loading-lines" aria-label="正在读取示例记录"><span></span><span></span><span></span><span></span><span></span></div>'
    pending=setTimeout(()=>{draw();$('refreshButton').disabled=false;$('scenario').disabled=false;$('updated').textContent='示例已刷新 · 数据未连接后端';toast('示例数据已刷新')},450)
  }
  $('scenario').addEventListener('change',()=>{scenario=$('scenario').value;filter='全部';drawSide('系统管理');document.querySelectorAll('[data-module]').forEach(el=>el.classList.toggle('active',el.dataset.module==='系统管理'));draw()})
  $('refreshButton').addEventListener('click',reload)
  $('failureOverview').addEventListener('click',()=>document.querySelector('.logs-panel').scrollIntoView({block:'center',behavior:'auto'}))
  $('configOverview').addEventListener('click',()=>{const panel=$('servicesPanel');panel.classList.remove('flash');void panel.offsetWidth;panel.classList.add('flash');panel.scrollIntoView({block:'center',behavior:'auto'})})
  $('allLogs').addEventListener('click',()=>logEntry())
  function taskBody() {
    if(scenario==='tasksError')return '<div class="state">'+icon('triangle-alert')+'<strong>本人任务读取失败</strong><p>任务状态未知，请重新读取。</p><button class="button" data-task-retry>重新读取</button></div>'
    return `<p>查看本人发起的任务，不作为全系统任务监控。</p>${scenario==='tasksEmpty'?stateMarkup('archive','本人暂无导入导出任务','在已授权业务页面发起任务后，可在这里查看。'):tasks.map(task=>`<div class="task-row"><strong>${task.name}</strong><div><span class="badge ${task.status==='已完成'?'green':''}">${task.status}</span><span>今日 ${task.time} · 示例任务</span></div></div>`).join('')}<h3>任务入口</h3><p>正式实现复用现有导入导出任务抽屉及其独立授权；首页不常驻任务统计。</p>`
  }
  $('tasksButton').addEventListener('click',()=>openDrawer('我的导入导出','仅当前账号 · 虚构示例',taskBody()))
  $('closeDialog').addEventListener('click',()=>$('detailDialog').close())
  $('detailDialog').addEventListener('click',event=>{if(event.target===$('detailDialog')&&event.clientX<$('detailDialog').getBoundingClientRect().left)$('detailDialog').close()})
  $('detailDialog').addEventListener('close',()=>{if(dialogReturnFocus?.isConnected)dialogReturnFocus.focus()})
  drawSide('系统管理');draw()
})()
