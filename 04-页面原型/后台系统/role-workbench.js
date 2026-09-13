(function(){
'use strict'

const icons={
  'arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>',
  'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',
  archive:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M9 13h6M5 2h14"/>',
  boxes:'<path d="m7.5 4.27 9 5.15M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5M12 22V12"/>',
  building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',
  chart:'<path d="M3 3v18h18M7 16l4-5 4 3 5-7"/>',
  check:'<path d="m5 12 4 4L19 6"/>',
  'chevron-down':'<path d="m6 9 6 6 6-6"/>',
  'chevron-right':'<path d="m9 18 6-6-6-6"/>',
  clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>',
  flask:'<path d="M9 3h6M10 9V3h4v6l5 9a2 2 0 0 1-1.74 3H6.74A2 2 0 0 1 5 18Z"/><path d="M7.5 15h9"/>',
  gauge:'<path d="M20.38 8.57a9 9 0 1 0 .13 6.58"/><path d="m12 12 4-4M7.5 8.5h.01M12 6h.01M16.5 8.5h.01"/>',
  headset:'<path d="M4 14v-2a8 8 0 0 1 16 0v2"/><path d="M18 19c0 1.1-.9 2-2 2h-3M4 14h3v5H5a2 2 0 0 1-2-2v-1a2 2 0 0 1 1-2ZM20 14h-3v5h2a2 2 0 0 0 2-2v-1a2 2 0 0 0-1-2Z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 9h12"/>',
  maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',
  moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5Z"/>',
  package:'<path d="m12 2 9 5-9 5-9-5Z"/><path d="M3 7v10l9 5 9-5V7M12 12v10M7.5 4.5l9 5"/>',
  'panel-left':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 9l-3 3 3 3"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',
  refresh:'<path d="M20 7h-5V2M4 17h5v5"/><path d="M5.2 9A8 8 0 0 1 18 5l2 2M18.8 15A8 8 0 0 1 6 19l-2-2"/>',
  scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',
  store:'<path d="M3 9l2-6h14l2 6M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',
  sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>',
  'triangle-alert':'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',
  user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  wrench:'<path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17a2 2 0 1 0 3 3l7.7-8.3a4 4 0 0 0 0-5.4Z"/>',
  x:'<path d="M18 6 6 18M6 6l12 12"/>'
}

const svgIcon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||''}</svg>`
const configs={
  serviceDesk:{
    number:'02',perspective:'客服作业',title:'客服工作台',scope:'全国客服中心',user:'客服主管',avatar:'客',icon:'headset',
    subtitle:'把受理、调度、审核和投诉处理收拢到一条连续工作流。',primary:'发起服务受理',primaryAction:'服务受理',
    modules:['工单处理','异常与投诉','业务查询'],
    groups:[['工单处理',['客服工作台','服务受理','服务工单','派单调度','完工审核']],['异常与投诉',['异常工单','投诉管理']],['业务查询',['顾客购买记录','安装码管理','服务知识库','商品档案']],['服务分析',['服务质量','运营报表']]],
    metrics:[
      {key:'acceptance',label:'待受理',value:18,caption:'当前状态 PENDING_ACCEPTANCE',icon:'headset',tone:''},
      {key:'dispatch',label:'待派单',value:12,caption:'当前状态 PENDING_DISPATCH',icon:'users',tone:'is-amber'},
      {key:'review',label:'待完工审核',value:7,caption:'当前状态 PENDING_REVIEW',icon:'check',tone:'is-cyan'},
      {key:'complaint',label:'待定责投诉',value:5,caption:'投诉 OPEN；不等于全部未结',icon:'triangle-alert',tone:'is-rose'}
    ],
    rows:[
      {id:'AS202609130026',queue:'acceptance',type:'安装',person:'顾客 138****9021',context:'上海徐汇门店',time:'09/15 期望服务',status:'待受理',action:'开始受理'},
      {id:'AS202609130021',queue:'acceptance',type:'维修',person:'李女士',context:'安装码 TO-8C92',time:'09/14 期望服务',status:'待受理',action:'识别顾客'},
      {id:'AS202609130016',queue:'dispatch',type:'维修',person:'赵先生',context:'杭州拱墅服务站',time:'09/13 已分配站点',status:'待派单',action:'派单'},
      {id:'AS202609120093',queue:'dispatch',type:'安装',person:'王女士',context:'广州天河服务站',time:'09/14 已分配站点',status:'待派单',action:'改派'},
      {id:'AS202609120078',queue:'review',type:'维修',person:'陈先生',context:'南京秦淮服务站',time:'09/12 提交完工',status:'待完工审核',action:'审核'},
      {id:'CP202609130005',queue:'complaint',type:'投诉',person:'周女士',context:'关联 AS202609110041',time:'09/13 创建',status:'待定责',action:'处理投诉'}
    ],
    tabs:{acceptance:'待受理',dispatch:'待派单',review:'待完工审核',complaint:'待定责投诉'},
    rail:'service'
  },
  station:{
    number:'03',perspective:'服务站作业',title:'服务站工作台',scope:'上海浦东授权服务站',user:'站点管理员',avatar:'站',icon:'wrench',
    subtitle:'围绕今日到站任务安排师傅、跟进履约并处理配件阻塞。',primary:'打开派单调度',primaryAction:'派单调度',
    modules:['本站工单','人员与资料','配件管理'],
    groups:[['本站工单',['服务站工作台','服务工单','派单调度','异常工单']],['人员与资料',['服务人员','排班管理','服务知识库']],['配件管理',['配件档案','库存台账','领料管理','工单耗用','退料管理','调拨管理','盘点管理']],['服务分析',['服务质量','运营报表']]],
    metrics:[
      {key:'dispatch',label:'待派单',value:9,caption:'当前状态 PENDING_DISPATCH',icon:'users',tone:''},
      {key:'today',label:'今日期望服务',value:14,caption:'按期望服务日期，包含各状态',icon:'clock',tone:'is-cyan'},
      {key:'completion',label:'待完工',value:26,caption:'当前状态 PENDING_COMPLETION',icon:'check',tone:'is-amber'},
      {key:'parts',label:'缺件工单',value:4,caption:'仅包含 MISSING_PARTS',icon:'boxes',tone:'is-rose'}
    ],
    rows:[
      {id:'AS202609130031',queue:'dispatch',type:'维修',person:'孙先生',context:'浦东新区金桥路',time:'今日 10:30',status:'待派单',action:'派单'},
      {id:'AS202609130024',queue:'today',type:'安装',person:'刘女士',context:'浦东新区张杨路',time:'今日 11:00',status:'已派单',action:'查看'},
      {id:'AS202609130019',queue:'today',type:'保养',person:'姚先生',context:'浦东新区锦绣路',time:'今日 13:30',status:'服务中',action:'查看'},
      {id:'AS202609120102',queue:'completion',type:'安装',person:'谢女士',context:'浦东新区博山东路',time:'09/12 已服务',status:'待完工',action:'跟进完工'},
      {id:'AS202609120088',queue:'parts',type:'维修',person:'许先生',context:'浦东新区羽山路',time:'缺件待处理',status:'缺件',action:'处理异常'}
    ],
    tabs:{dispatch:'待派单',today:'今日期望服务',completion:'待完工',parts:'缺件工单'},
    rail:'station'
  },
  dealer:{
    number:'04',perspective:'门店业务',title:'门店工作台',scope:'上海徐汇授权门店',user:'门店店员',avatar:'店',icon:'store',
    subtitle:'从购买登记开始，快速找到顾客记录并继续发起安装申请。',primary:'登记购买',primaryAction:'购买登记',
    modules:['业务办理'],
    groups:[['业务办理',['门店工作台','购买登记','顾客购买记录']]],
    metrics:[
      {key:'notApplied',label:'未申请安装',value:23,caption:'购买记录 NOT_APPOINTED',icon:'receipt',tone:''},
      {key:'partial',label:'部分申请安装',value:8,caption:'购买记录 PARTIALLY_APPOINTED',icon:'package',tone:'is-amber'},
      {key:'all',label:'全部购买记录',value:1264,caption:'按购买记录统计，不是商品件数',icon:'archive',tone:'is-cyan'}
    ],
    rows:[
      {id:'PR202609130018',queue:'notApplied',type:'智能坐便器',person:'吴女士',context:'2 件商品',time:'今日 09:18 登记',status:'未申请安装',action:'申请安装'},
      {id:'PR202609130011',queue:'notApplied',type:'浴室柜',person:'唐先生',context:'1 件商品',time:'今日 08:42 登记',status:'未申请安装',action:'申请安装'},
      {id:'PR202609120076',queue:'partial',type:'卫浴组合',person:'陈女士',context:'3 件商品',time:'09/12 登记',status:'部分申请',action:'继续申请'},
      {id:'PR202609120051',queue:'all',type:'智能坐便器',person:'陆先生',context:'1 件商品',time:'09/12 登记',status:'已申请安装',action:'查看详情'},
      {id:'PR202609110098',queue:'all',type:'龙头组合',person:'高女士',context:'2 件商品',time:'09/11 登记',status:'无需安装',action:'查看详情'}
    ],
    tabs:{notApplied:'未申请安装',partial:'部分申请安装',all:'全部购买记录'},
    rail:'dealer'
  }
}

const view=document.body.dataset.view
const config=configs[view]||configs.serviceDesk
const $=id=>document.getElementById(id)
const reducedMotion=()=>matchMedia('(prefers-reduced-motion: reduce)').matches
let activeQueue=Object.keys(config.tabs)[0]
let toastTimer

function icon(name){return `<span class="icon" data-icon="${name}">${svgIcon(name)}</span>`}
function prototypeCards(){
  const items=[['01','总部运营','运营概览','index.html','headquarters'],['02','客服作业','客服工作台','customer-service.html','serviceDesk'],['03','服务站作业','服务站工作台','service-station.html','station'],['04','门店业务','门店工作台','dealer.html','dealer']]
  return items.map(([number,name,page,href,id])=>`<a href="${href}" class="prototype-card${id===view?' is-current':''}"><span class="prototype-number">${number}</span><span class="prototype-copy"><span class="prototype-status is-ready">可评审</span><strong>${name}</strong><small>${page}</small></span>${icon('arrow-up-right')}</a>`).join('')
}
function menuMarkup(){
  return config.groups.map((group,index)=>`<section class="menu-group${index<2?' is-open':''}"><button class="menu-group-title" type="button" aria-expanded="${index<2}"><span>${group[0]}</span>${icon('chevron-down')}</button><div class="menu-list">${group[1].map((item,itemIndex)=>`<button type="button" class="menu-item${index===0&&itemIndex===0?' is-active':''}" data-preview-link="${item}">${icon(itemIndex===0&&index===0?'gauge':item.includes('工单')?'clipboard':item.includes('配件')||item.includes('库存')?'boxes':item.includes('人员')?'users':item.includes('购买')?'receipt':'archive')}<span>${item}</span></button>`).join('')}</div></section>`).join('')
}
function metricMarkup(metric,index){
  const heights=[7,12,9,15,11,16,13]
  return `<button class="metric-card${index===0?' is-active is-featured':''} reveal" type="button" data-queue="${metric.key}" aria-pressed="${index===0}" style="--delay:${60+index*60}ms"><span class="metric-top"><span class="metric-icon ${metric.tone}">${icon(metric.icon)}</span><span class="metric-link">进入队列${icon('arrow-up-right')}</span></span><span class="metric-label">${metric.label}</span><strong class="metric-value" data-value="${metric.value}">0</strong><span class="metric-caption">${metric.caption}</span><span class="metric-mini-bars" aria-hidden="true">${heights.map((height,i)=>`<i style="height:${height}px;--i:${i}"></i>`).join('')}</span></button>`
}
function tableHeader(){
  if(view==='dealer')return '<tr><th>购买记录</th><th>商品摘要</th><th>顾客</th><th>商品范围</th><th>登记时间</th><th>安装状态</th><th><span class="visually-hidden">操作</span></th></tr>'
  if(view==='station')return '<tr><th>工单号</th><th>服务类型</th><th>顾客</th><th>服务地址</th><th>服务时间</th><th>当前状态</th><th><span class="visually-hidden">操作</span></th></tr>'
  return '<tr><th>业务编号</th><th>类型</th><th>顾客</th><th>业务上下文</th><th>时间</th><th>当前状态</th><th><span class="visually-hidden">操作</span></th></tr>'
}
function railMarkup(){
  if(config.rail==='service')return `<aside class="role-rail reveal" style="--delay:360ms"><section class="panel role-card"><header class="panel-heading"><div><h2>接续办理</h2><p>顾客识别与受理，沿上下文继续办理</p></div>${icon('arrow-up-right')}</header><div class="action-lane"><button class="action-step" data-work-action="识别顾客"><span class="step-icon">${icon('search')}</span><span><strong>识别顾客</strong><small>使用手机号或安装码查询购买记录</small></span>${icon('chevron-right')}</button><button class="action-step" data-work-action="服务受理"><span class="step-icon">${icon('headset')}</span><span><strong>服务受理</strong><small>确认服务需求，必要时代客建单</small></span>${icon('chevron-right')}</button><button class="action-step" data-work-action="分配服务站"><span class="step-icon">${icon('building')}</span><span><strong>分配服务站</strong><small>按工单动作权限继续处理</small></span>${icon('chevron-right')}</button></div><div class="complaint-callout"><span>待定责投诉</span><strong>5</strong><p>仅代表投诉 OPEN 队列，不等于全部未结投诉。</p><button type="button" data-queue-jump="complaint">进入投诉队列</button></div></section></aside>`
  if(config.rail==='station')return `<aside class="role-rail reveal" style="--delay:360ms"><section class="panel role-card"><header class="panel-heading"><div><h2>今日已配置排班</h2><p>展示前 5 条及已配置日容量</p></div><button class="plain-icon-button" data-preview-link="排班管理" aria-label="打开排班管理">${icon('arrow-up-right')}</button></header><div class="schedule-head"><strong>5</strong><span>条排班演示</span></div><div class="schedule-list">${[['08:30','周明','可用 · 日容量 6'],['09:00','许嘉','可用 · 日容量 5'],['10:00','吴磊','外勤 · 日容量 4'],['13:30','陈航','可用 · 日容量 6'],['14:00','林峰','外勤 · 日容量 5']].map(row=>`<button class="schedule-item" data-preview-link="${row[1]}的排班"><span class="schedule-time">${row[0]}</span><i class="schedule-marker"></i><span class="schedule-copy"><strong>${row[1]}</strong><small>服务人员排班</small></span><span class="capacity-tag">${row[2]}</span></button>`).join('')}</div><p class="role-note">${icon('info')}容量只展示已配置值，不推断剩余工位或人员负荷。</p></section></aside>`
  return `<aside class="panel continue-card reveal" style="--delay:360ms"><header class="panel-heading"><div><h2>继续办理</h2><p>回到最近处理的顾客购买记录</p></div><button class="plain-icon-button" data-preview-link="顾客购买记录" aria-label="打开购买记录">${icon('arrow-up-right')}</button></header><div class="continue-list">${[['吴女士','智能坐便器 · 2 件','未申请安装'],['陈女士','卫浴组合 · 3 件','部分申请'],['陆先生','智能坐便器 · 1 件','已申请']].map((item,index)=>`<button class="continue-item" data-work-action="${index<2?'申请安装':'购买记录详情'}"><span class="customer-avatar">${item[0][0]}</span><span class="continue-copy"><strong>${item[0]}</strong><small>${item[1]}</small></span><span class="continue-state"><b>${item[2]}</b><span>${index?'09/12':'今日'}更新</span></span></button>`).join('')}</div><p class="role-note">${icon('info')}申请时按商品实例状态再次检查可办理范围。</p></aside>`
}
function resourceMarkup(){
  if(view==='station')return `<section class="panel wide reveal" style="--delay:480ms"><header class="panel-heading"><div><h2>现场履约资源</h2><p>进入人员、排班和配件专业页面继续处理</p></div></header><div class="resource-strip"><button class="resource-tile" data-preview-link="服务人员">${icon('users')}<strong>服务人员</strong><small>查看授权人员资料</small></button><button class="resource-tile" data-preview-link="排班管理">${icon('clock')}<strong>排班管理</strong><small>维护已配置日容量</small></button><button class="resource-tile" data-preview-link="库存台账">${icon('boxes')}<strong>库存台账</strong><small>定位缺件工单所需配件</small></button></div></section>`
  if(view==='serviceDesk')return `<section class="panel wide reveal" style="--delay:480ms"><header class="panel-heading"><div><h2>辅助查询与分析</h2><p>专业页面保留在当前视角，工作台聚焦待办</p></div></header><div class="resource-strip"><button class="resource-tile" data-preview-link="安装码管理">${icon('scan')}<strong>安装码管理</strong><small>授权范围内查询与详情</small></button><button class="resource-tile" data-preview-link="服务知识库">${icon('archive')}<strong>服务知识库</strong><small>处理问题时快速检索</small></button><button class="resource-tile" data-preview-link="运营报表">${icon('chart')}<strong>运营报表</strong><small>进入专业分析页面</small></button></div></section>`
  return ''
}
function dealerHero(){
  if(view!=='dealer')return ''
  return `<article class="panel registration-hero reveal" style="--delay:300ms"><span class="registration-kicker">${icon('receipt')}门店业务起点</span><h2>一次登记，连接顾客、商品与后续安装服务</h2><p>购买登记复用正式业务表单的字段与校验边界；本页只模拟交互，不提交真实记录。</p><div class="registration-flow"><span>01 顾客</span><i></i><span>02 商品</span><i></i><span>03 使用与授权</span></div><button class="hero-button" type="button" data-work-action="购买登记">开始购买登记</button></article>`
}
function appMarkup(){
  const dealerClass=view==='dealer'?' dealer-stage':''
  return `<div class="app-shell" id="appShell"><header class="topbar"><a class="brand" href="${view==='headquarters'?'#':'index.html'}" aria-label="TOTO 售后服务首页"><span class="brand-mark" aria-hidden="true"><span>T</span></span><span class="brand-copy"><strong>TOTO 售后服务</strong><small>Blue Whale Digital</small></span></a><button class="perspective-switch" type="button" id="perspectiveButton" aria-haspopup="dialog" aria-controls="prototypePanel"><span class="perspective-icon icon">${svgIcon(config.icon)}</span><span><small>当前工作视角</small><strong>${config.perspective}</strong></span>${icon('chevron-down')}</button><nav class="module-nav" aria-label="一级功能">${config.modules.map((item,index)=>`<button type="button" class="module-link${index===0?' is-active':''}" data-preview-link="${item}">${icon(index===0?'gauge':index===1?'clipboard':'archive')}${item}</button>`).join('')}</nav><div class="topbar-actions"><button class="search-trigger" type="button" id="searchButton">${icon('search')}<span>搜索功能</span><kbd>⌘ K</kbd></button><button class="icon-button" type="button" id="fullscreenButton" aria-label="进入全屏" title="进入全屏">${icon('maximize')}</button><button class="icon-button" type="button" id="refreshButton" aria-label="刷新数据" title="刷新数据">${icon('refresh')}</button><button class="icon-button" type="button" id="themeButton" aria-label="切换深浅模式" title="切换深浅模式">${icon('moon')}</button><button class="user-menu" type="button" data-preview-link="个人菜单"><span class="avatar">${config.avatar}</span><span>${config.user}</span>${icon('chevron-down')}</button></div></header><aside class="sidebar" aria-label="${config.perspective}功能菜单"><div class="sidebar-scroll">${menuMarkup()}</div><button class="sidebar-collapse" id="sidebarButton" type="button">${icon('panel-left')}<span>收起菜单</span></button></aside><main class="workspace role-workspace" id="workspace"><div class="page-heading role-heading reveal" style="--delay:0ms"><div class="role-heading-main"><div><div class="context-line"><span id="fullDate">2026 年 9 月 13 日</span><i></i><span>授权组织范围</span><button type="button" id="scopeButton">${config.scope}${icon('chevron-down')}</button></div><h1>${config.title}</h1><p>${config.subtitle}</p></div><span class="role-sequence"><i></i>${config.number} / 04</span></div><div class="heading-actions"><span class="sample-badge"><span class="status-dot"></span>原型演示数据</span><span class="last-updated">更新于 <strong id="lastUpdated">09:32</strong></span><button class="primary-button role-primary-action" type="button" data-work-action="${config.primaryAction}">${icon('plus')}${config.primary}</button></div></div><section class="metric-grid role-metrics${config.metrics.length===3?' three':''}" aria-label="${config.title}核心指标">${config.metrics.map(metricMarkup).join('')}</section><section class="role-stage${dealerClass}">${dealerHero()}${view==='dealer'?railMarkup():`<article class="panel work-panel reveal" style="--delay:300ms"><header class="panel-heading orders-heading"><div><h2 id="queueTitle">${config.tabs[activeQueue]}</h2><p id="queueDescription">当前授权范围内的待办，数量取队列分页 total</p></div><div class="table-actions"><label class="table-search">${icon('search')}<input type="search" id="recordSearch" placeholder="搜索编号或顾客" aria-label="搜索当前队列"></label><button type="button" class="secondary-button" id="stateButton">${icon('flask')}状态演示</button></div></header><div class="queue-tabs" role="tablist" aria-label="${config.title}队列">${Object.entries(config.tabs).map(([key,label],index)=>`<button role="tab" aria-selected="${index===0}" data-queue="${key}" class="${key==='complaint'?'queue-pulse':''}">${label} <span>${config.metrics.find(item=>item.key===key)?.value||''}</span></button>`).join('')}</div><div class="role-table-wrap" id="tableWrap"><table class="role-table"><thead>${tableHeader()}</thead><tbody id="recordRows"></tbody></table><div class="table-state role-table-state" id="tableState" hidden></div></div><footer class="table-footer"><span id="tableCount">当前展示演示数据</span><button type="button" data-preview-link="完整业务列表">查看完整列表${icon('arrow-right')}</button></footer></article>${railMarkup()}${resourceMarkup()}`}${view==='dealer'?`<article class="panel work-panel wide reveal" style="--delay:420ms"><header class="panel-heading orders-heading"><div><h2 id="queueTitle">${config.tabs[activeQueue]}</h2><p id="queueDescription">按购买记录统计，执行申请时再检查商品实例状态</p></div><div class="table-actions"><label class="table-search">${icon('search')}<input type="search" id="recordSearch" placeholder="搜索记录或顾客" aria-label="搜索购买记录"></label><button type="button" class="secondary-button" id="stateButton">${icon('flask')}状态演示</button></div></header><div class="queue-tabs" role="tablist" aria-label="购买记录队列">${Object.entries(config.tabs).map(([key,label],index)=>`<button role="tab" aria-selected="${index===0}" data-queue="${key}">${label} <span>${config.metrics.find(item=>item.key===key)?.value||''}</span></button>`).join('')}</div><div class="role-table-wrap" id="tableWrap"><table class="role-table"><thead>${tableHeader()}</thead><tbody id="recordRows"></tbody></table><div class="table-state role-table-state" id="tableState" hidden></div></div><footer class="table-footer"><span id="tableCount">当前展示演示数据</span><button type="button" data-preview-link="顾客购买记录">打开完整购买记录${icon('arrow-right')}</button></footer></article>`:''}</section></main></div><button class="prototype-fab" id="prototypeFab" type="button" aria-haspopup="dialog" aria-controls="prototypePanel">${icon('layout')}<span>原型目录</span><strong>4 / 4</strong></button><div class="scrim" id="scrim" hidden></div><aside class="prototype-panel" id="prototypePanel" role="dialog" aria-modal="true" aria-labelledby="prototypeTitle" hidden><header><div><span class="panel-kicker">WEB 管理后台</span><h2 id="prototypeTitle">四视角原型目录</h2><p>同一套后台外壳，按角色工作目标分别设计。</p></div><button class="icon-button" id="closePrototypePanel" type="button" aria-label="关闭原型目录">${icon('x')}</button></header><div class="prototype-list">${prototypeCards()}</div><footer><a href="01-四视角后台原型设计说明.md">查看原型设计说明${icon('arrow-right')}</a><a href="../README.md">返回全部页面原型</a></footer></aside><div class="command-dialog" id="commandDialog" role="dialog" aria-modal="true" aria-labelledby="commandTitle" hidden><label>${icon('search')}<span id="commandTitle" class="visually-hidden">搜索功能</span><input id="commandInput" type="search" placeholder="输入功能名称…" autocomplete="off"><kbd>ESC</kbd></label><div class="command-results" id="commandResults"></div></div><div class="popover scope-popover" id="scopePopover" hidden><span>当前授权范围</span><strong>${config.scope}</strong><p>原型只模拟界面交互，实际范围由后端权限和对象范围决定。</p></div><div class="popover state-popover" id="statePopover" hidden><span>队列界面状态</span><button type="button" data-table-state="data" class="is-active">有数据</button><button type="button" data-table-state="loading">加载中</button><button type="button" data-table-state="empty">无数据</button><button type="button" data-table-state="error">加载失败</button></div><div class="detail-drawer work-drawer" id="workDrawer" role="dialog" aria-modal="true" aria-labelledby="drawerTitle" hidden><header><div><span class="drawer-kicker" id="drawerKicker">工作台办理</span><h2 id="drawerTitle">${config.primaryAction}</h2></div><button class="icon-button" type="button" id="closeDrawer" aria-label="关闭办理面板">${icon('x')}</button></header><div class="detail-content" id="drawerContent"></div><footer><button class="secondary-button" type="button" id="drawerCancel">取消</button><button class="primary-button" type="button" id="drawerSubmit">模拟保存</button></footer></div><div class="toast" id="toast" role="status" aria-live="polite"></div>`
}

function rowsForQueue(){
  const keyword=$('recordSearch').value.trim().toLowerCase()
  return config.rows.filter(row=>(activeQueue==='all'||row.queue===activeQueue)&&(!keyword||`${row.id}${row.person}${row.context}${row.type}`.toLowerCase().includes(keyword)))
}
function renderRows(){
  const rows=rowsForQueue()
  $('recordRows').innerHTML=rows.map(row=>`<tr><td><button class="order-link" type="button" data-record="${row.id}">${row.id}</button></td><td>${row.type}</td><td>${row.person}</td><td title="${row.context}">${row.context}</td><td>${row.time}</td><td><span class="status-tag${row.queue==='parts'||row.queue==='complaint'?' is-danger':''}">${row.status}</span></td><td><span class="row-actions"><button class="action-link" type="button" data-row-action="${row.action}" data-record="${row.id}">${row.action}</button></span></td></tr>`).join('')
  if(rows.length)$('tableState').hidden=true
  else if($('recordSearch').value.trim()){showTableMessage('search','未找到匹配记录','请调整编号或顾客关键词。')}
  else setTableState('empty')
  document.querySelectorAll('[data-record]').forEach(button=>button.addEventListener('click',event=>{event.stopPropagation();openWork(button.dataset.rowAction||'业务详情',button.dataset.record)}))
}
function selectQueue(queue,shouldScroll=true){
  activeQueue=queue
  $('queueTitle').textContent=config.tabs[queue]
  const metric=config.metrics.find(item=>item.key===queue)
  $('queueDescription').textContent=metric?.caption||'当前授权范围内的业务记录'
  $('tableCount').textContent=`共 ${metric?.value.toLocaleString('zh-CN')||config.metrics.at(-1).value.toLocaleString('zh-CN')} 条，当前展示演示数据`
  document.querySelectorAll('[data-queue]').forEach(button=>{const selected=button.dataset.queue===queue;button.classList.toggle('is-active',selected);button.setAttribute(button.getAttribute('role')==='tab'?'aria-selected':'aria-pressed',String(selected))})
  $('recordSearch').value=''
  setTableState('data')
  renderRows()
  if(shouldScroll)document.querySelector('.work-panel').scrollIntoView({behavior:reducedMotion()?'auto':'smooth',block:'nearest'})
}
function showTableMessage(iconName,title,description,action=''){
  $('tableState').hidden=false
  $('tableState').innerHTML=`<div class="state-content"><span class="state-icon">${icon(iconName)}</span><strong>${title}</strong><p>${description}</p>${action?`<button class="secondary-button" type="button" id="retryTable">${action}</button>`:''}</div>`
}
function setTableState(state){
  document.querySelectorAll('[data-table-state]').forEach(button=>button.classList.toggle('is-active',button.dataset.tableState===state))
  if(state==='data'){$('tableState').hidden=true;return}
  if(state==='loading'){$('tableState').hidden=false;$('tableState').innerHTML='<div class="skeleton-lines" role="status" aria-label="正在加载记录"><i></i><i></i><i></i><i></i></div>'}
  if(state==='empty')showTableMessage('archive','暂无记录','当前授权范围内没有该队列记录。')
  if(state==='error'){showTableMessage('triangle-alert','队列加载失败','失败不会显示为 0，可以保留当前队列后重试。','重试');$('retryTable').addEventListener('click',()=>{setTableState('loading');setTimeout(()=>{setTableState('data');renderRows()},650)})}
}
function formFor(action,id){
  const lead=id?`<div class="detail-hero"><span>${view==='dealer'?'购买记录':'关联业务'}</span><strong>${id}</strong>${icon(view==='dealer'?'receipt':'clipboard')}</div>`:''
  if(action.includes('购买登记'))return `${lead}<form class="mock-form"><label>顾客手机号<input value="138 0000 9021" aria-label="顾客手机号"></label><label>商品信息<input value="智能坐便器 · 演示商品" aria-label="商品信息"></label><label>使用与授权信息<textarea aria-label="使用与授权信息">上海市徐汇区 · 本人使用</textarea></label></form><div class="drawer-hint">${icon('info')}正式页面复用 RegistrationPanel；原型不会提交真实记录。</div>`
  if(action.includes('申请'))return `${lead}<form class="mock-form"><label>可申请商品实例<select aria-label="可申请商品实例"><option>智能坐便器 · 实例 01</option><option>智能坐便器 · 实例 02</option></select></label><label>期望服务日期<input type="date" value="2026-09-15" aria-label="期望服务日期"></label><label>安装地址<textarea aria-label="安装地址">上海市徐汇区虹桥路 888 号</textarea></label></form><div class="drawer-hint">${icon('info')}执行申请时会重新读取详情并检查商品实例状态。</div>`
  if(action.includes('审核'))return `${lead}<form class="mock-form"><label>完工材料<select aria-label="完工材料"><option>照片与服务记录已提交</option></select></label><label>审核意见<textarea aria-label="审核意见">材料齐全，等待确认。</textarea></label></form><div class="drawer-hint">${icon('info')}完工审核只出现在客服视角，并受行 actions 与操作权限控制。</div>`
  if(action.includes('派单')||action.includes('改派')||action.includes('分配'))return `${lead}<form class="mock-form"><label>${action.includes('服务站')?'目标服务站':'目标服务人员'}<select aria-label="处理对象"><option>${action.includes('服务站')?'上海浦东授权服务站':'周明 · 今日可用'}</option></select></label><label>服务日期<input type="date" value="2026-09-15" aria-label="服务日期"></label><label>处理备注<textarea aria-label="处理备注">请联系顾客确认上门时间。</textarea></label></form><div class="drawer-hint">${icon('info')}按钮仅模拟已授权行操作，不代表真实写入。</div>`
  if(action.includes('受理')||action.includes('识别'))return `${lead}<form class="mock-form"><label>手机号或安装码<input value="138 0000 9021" aria-label="手机号或安装码"></label><label>服务需求<select aria-label="服务需求"><option>安装服务</option><option>维修服务</option></select></label><label>沟通记录<textarea aria-label="沟通记录">顾客希望周二上午联系。</textarea></label></form><div class="drawer-hint">${icon('info')}顾客识别与代客建单复用既有购买记录和服务受理表单。</div>`
  return `${lead}<div class="detail-grid"><div class="detail-field"><span>当前状态</span><strong>${config.rows.find(row=>row.id===id)?.status||'待处理'}</strong></div><div class="detail-field"><span>数据范围</span><strong>${config.scope}</strong></div><div class="detail-field"><span>工作视角</span><strong>${config.perspective}</strong></div><div class="detail-field"><span>数据说明</span><strong>原型演示数据</strong></div></div><div class="drawer-hint">${icon('info')}打开办理前，正式页面会重新读取详情与可执行 actions。</div>`
}
function openWork(action,id=''){
  closePopovers()
  $('drawerKicker').textContent=id?'队列内办理':'快捷办理'
  $('drawerTitle').textContent=action
  $('drawerContent').innerHTML=formFor(action,id)
  $('drawerSubmit').textContent=action.includes('详情')?'关闭':'模拟保存'
  openOverlay($('workDrawer'))
}
function showToast(message){
  $('toast').textContent=message
  $('toast').classList.add('is-visible')
  clearTimeout(toastTimer)
  toastTimer=setTimeout(()=>$('toast').classList.remove('is-visible'),2300)
}
function closePopovers(){$('scopePopover').hidden=true;$('statePopover').hidden=true}
function openOverlay(panel){closePopovers();$('scrim').hidden=false;panel.hidden=false;panel.querySelector('button,input')?.focus()}
function closeOverlays(){$('scrim').hidden=true;$('prototypePanel').hidden=true;$('commandDialog').hidden=true;$('workDrawer').hidden=true}
function countUp(){
  const nodes=document.querySelectorAll('[data-value]')
  if(reducedMotion()){nodes.forEach(node=>node.textContent=Number(node.dataset.value).toLocaleString('zh-CN'));return}
  const start=performance.now(),duration=850
  function tick(now){const progress=Math.min(1,(now-start)/duration),eased=1-Math.pow(1-progress,3);nodes.forEach(node=>node.textContent=Math.round(Number(node.dataset.value)*eased).toLocaleString('zh-CN'));if(progress<1)requestAnimationFrame(tick)}
  requestAnimationFrame(tick)
}
function renderCommands(keyword){
  const commands=config.groups.flatMap(group=>group[1]).filter((item,index,array)=>array.indexOf(item)===index)
  const results=commands.filter(item=>item.includes(keyword.trim()))
  $('commandResults').innerHTML=results.length?results.map(item=>`<button type="button" data-command="${item}"><strong>${item}</strong><span>${config.perspective}</span></button>`).join(''):'<div class="state-content" style="padding:32px;margin:auto"><strong>未找到功能</strong><p>请尝试其他关键词。</p></div>'
  document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{closeOverlays();showToast(`${button.dataset.command}：专业页面入口已保留`)}))
}
function openCommand(){closePopovers();$('scrim').hidden=false;$('commandDialog').hidden=false;renderCommands('');$('commandInput').focus()}
function bindEvents(){
  document.querySelectorAll('[data-queue]').forEach(button=>button.addEventListener('click',()=>selectQueue(button.dataset.queue)))
  document.querySelectorAll('[data-queue-jump]').forEach(button=>button.addEventListener('click',()=>selectQueue(button.dataset.queueJump)))
  document.querySelectorAll('[data-work-action]').forEach(button=>button.addEventListener('click',()=>openWork(button.dataset.workAction)))
  document.querySelectorAll('[data-preview-link]').forEach(button=>button.addEventListener('click',()=>showToast(`${button.dataset.previewLink}：专业页面入口已保留，本轮聚焦工作台`)))
  document.querySelectorAll('.menu-group-title').forEach(button=>button.addEventListener('click',()=>{const group=button.closest('.menu-group');group.classList.toggle('is-open');button.setAttribute('aria-expanded',String(group.classList.contains('is-open')))}))
  $('recordSearch').addEventListener('input',renderRows)
  $('prototypeFab').addEventListener('click',()=>openOverlay($('prototypePanel')))
  $('perspectiveButton').addEventListener('click',()=>openOverlay($('prototypePanel')))
  $('closePrototypePanel').addEventListener('click',closeOverlays)
  $('searchButton').addEventListener('click',openCommand)
  $('commandInput').addEventListener('input',event=>renderCommands(event.target.value))
  $('scrim').addEventListener('click',closeOverlays)
  $('closeDrawer').addEventListener('click',closeOverlays)
  $('drawerCancel').addEventListener('click',closeOverlays)
  $('drawerSubmit').addEventListener('click',()=>{const action=$('drawerTitle').textContent;closeOverlays();showToast(action.includes('详情')?'已关闭详情':`${action}已完成原型演示（未提交真实数据）`)})
  $('sidebarButton').addEventListener('click',()=>{const shell=$('appShell');shell.classList.toggle('is-sidebar-collapsed');$('sidebarButton').querySelector('span:last-child').textContent=shell.classList.contains('is-sidebar-collapsed')?'展开菜单':'收起菜单'})
  $('scopeButton').addEventListener('click',event=>{event.stopPropagation();$('statePopover').hidden=true;$('scopePopover').hidden=!$('scopePopover').hidden})
  $('stateButton').addEventListener('click',event=>{event.stopPropagation();const rect=event.currentTarget.getBoundingClientRect();$('scopePopover').hidden=true;$('statePopover').style.top=`${rect.bottom+6}px`;$('statePopover').style.left=`${rect.right-145}px`;$('statePopover').hidden=!$('statePopover').hidden})
  document.querySelectorAll('[data-table-state]').forEach(button=>button.addEventListener('click',()=>{setTableState(button.dataset.tableState);$('statePopover').hidden=true}))
  document.addEventListener('click',event=>{if(!event.target.closest('.popover')&&!event.target.closest('#scopeButton')&&!event.target.closest('#stateButton'))closePopovers()})
  document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommand()}if(event.key==='Escape'){closeOverlays();closePopovers()}})
  $('refreshButton').addEventListener('click',()=>{const shell=$('appShell');shell.classList.add('is-refreshing');$('lastUpdated').textContent=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});setTableState('loading');setTimeout(()=>{shell.classList.remove('is-refreshing');setTableState('data');renderRows();countUp();showToast('演示数据已刷新')},620)})
  $('themeButton').addEventListener('click',()=>{const root=document.documentElement,dark=root.dataset.theme!=='dark';root.dataset.theme=dark?'dark':'light';$('themeButton').innerHTML=`<span class="icon">${svgIcon(dark?'sun':'moon')}</span>`})
  $('fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(_){showToast('浏览器未允许进入全屏')}})
  document.addEventListener('fullscreenchange',()=>{const button=$('fullscreenButton');button.setAttribute('aria-label',document.fullscreenElement?'退出全屏':'进入全屏');button.title=document.fullscreenElement?'退出全屏':'进入全屏'})
}

$('roleApp').innerHTML=appMarkup()
const today=new Date()
$('fullDate').textContent=`${today.getFullYear()} 年 ${today.getMonth()+1} 月 ${today.getDate()} 日`
bindEvents()
selectQueue(activeQueue,false)
countUp()
})()
