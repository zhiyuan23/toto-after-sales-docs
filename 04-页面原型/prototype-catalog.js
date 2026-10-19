/* Shared prototype navigation only; these labels do not grant business access. */
(() => {
  'use strict'
  const root=new URL('.',document.currentScript.src)
  const views={
    administrator:{app:'backend',group:'角色工作台',title:'系统管理员工作台',file:'后台系统/administrator.html',version:'紧凑版 V2'},
    headquarters:{app:'backend',group:'角色工作台',title:'总部运营工作台',file:'后台系统/headquarters-map.html',version:'全国地图版'},
    'customer-service':{app:'backend',group:'角色工作台',title:'客服作业工作台',file:'后台系统/customer-service-v03.html',version:'v0.17'},
    station:{app:'backend',group:'角色工作台',title:'服务站作业工作台',file:'后台系统/service-station-v02.html',version:'今日安排与配件版'},
    dealer:{app:'backend',group:'角色工作台',title:'门店业务工作台',file:'后台系统/dealer.html',version:'购买登记与记录版'},
    quality:{app:'backend',group:'专业页面',title:'服务质量',file:'后台系统/service-quality-v2.html',version:'新版'},
    report:{app:'backend',group:'专业页面',title:'运营报表',file:'后台系统/operations-report-v2.html',version:'新版'},
    parts:{app:'backend',group:'专业页面',title:'配件管理',file:'后台系统/parts-management.html#inbound',version:'入库 / 库存 / 领退料'},
    member:{app:'backend',group:'专业页面',title:'会员档案与购买倾向',file:'后台系统/member-purchase-preferences.html',version:'设计稿'},
    'station-cards':{app:'backend',group:'专业页面',title:'服务站卡片样式',file:'后台系统/service-station-card-prototype.html',version:'样式评审'},
    'quality-baseline':{app:'backend',group:'专业页面实施基线',title:'服务质量 · 实施基线',file:'后台系统/service-quality.html',version:'实施基线 v1.0'},
    'report-baseline':{app:'backend',group:'专业页面实施基线',title:'运营报表 · 实施基线',file:'后台系统/operations-report.html',version:'实施基线 v1.0'},
    consumer:{app:'consumer',group:'当前原型',title:'消费者原型 · 商品首页 v0.17',file:'小程序/index.html?consumerVersion=0.17#c-home',version:'v0.17'},
    'consumer-brand':{app:'consumer',group:'独立设计方案',title:'品牌产品中心 V1',file:'小程序/brand-center-v1.html#c-home',version:'独立方案'},
    'consumer-016':{app:'consumer',group:'保留的小程序方案对照',title:'品牌产品中心 v0.16',file:'小程序/index.html?consumerVersion=0.16#c-home',version:'v0.16'},
    'consumer-015':{app:'consumer',group:'保留的小程序方案对照',title:'首页方案对比 v0.15',file:'小程序/index.html?consumerVersion=0.15#c-home',version:'v0.15'},
    'consumer-014':{app:'consumer',group:'保留的小程序方案对照',title:'品牌方案 v0.14',file:'小程序/index.html?consumerVersion=0.14#c-home',version:'v0.14'},
    'consumer-013':{app:'consumer',group:'保留的小程序方案对照',title:'品牌蓝轻卡 v0.13',file:'小程序/index.html?consumerVersion=0.13#c-home',version:'v0.13'},
    'consumer-011':{app:'consumer',group:'保留的小程序方案对照',title:'旧样式对照 v0.11',file:'小程序/index.html?consumerVersion=0.11#c-home',version:'v0.11'},
    worker:{app:'worker',group:'当前原型',title:'服务人员原型 · 当前定稿版',file:'小程序/index.html?consumerVersion=0.13#w-tasks',version:'当前定稿版'},
  }
  const perspectives=[
    {key:'administrator',label:'系统管理员',group:'后台工作台',note:'账号、权限与系统配置'},
    {key:'headquarters',label:'总部运营',group:'后台工作台',note:'全国服务运营态势'},
    {key:'customer-service',label:'客服作业',group:'后台工作台',note:'受理、分配与连续办理'},
    {key:'station',label:'服务站作业',group:'后台工作台',note:'人员安排与领退料'},
    {key:'dealer',label:'门店业务',group:'后台工作台',note:'购买登记与服务查询'},
    {key:'consumer',label:'消费者端',group:'小程序',note:'消费者小程序'},
    {key:'worker',label:'服务人员端',group:'小程序',note:'服务人员小程序'},
  ]
  const pagePerspective={quality:'headquarters',report:'headquarters',member:'headquarters','quality-baseline':'headquarters','report-baseline':'headquarters',parts:'station','station-cards':'station'}
  function perspectiveFor(key){
    if(perspectives.some(role=>role.key===key))return key
    if(views[key]?.app==='consumer')return 'consumer'
    return pagePerspective[key]||'administrator'
  }
  function acceptsMessageOrigin(origin){
    return root.protocol==='file:'?origin==='null'||origin==='file://':origin===root.origin
  }
  function pageFor(key,hash=''){
    const page=hash.replace(/^#/,'')
    if(views[key]?.app==='consumer'&&/^c-[a-z\d-]+$/.test(page))return page
    if(key==='worker'&&/^w-[a-z\d-]+$/.test(page))return page
    if(key==='parts'&&['inbound','inventory','requisition','return'].includes(page))return page
    return ''
  }
  function parseRoute(hash=''){
    const [rawKey,rawPage='']=hash.replace(/^#/,'').split('/')
    const key=rawKey==='headquarters-classic'?'headquarters':Object.hasOwn(views,rawKey)?rawKey:'administrator'
    return {key,page:pageFor(key,rawPage)}
  }
  function routeHash(key,page=''){return `#${key}${pageFor(key,page)?'/'+pageFor(key,page):''}`}
  function resolveView(url){
    if(url.origin!==root.origin)return
    if(url.pathname===new URL('index.html',root).pathname||url.pathname===new URL('后台系统/workbenches.html',root).pathname)return parseRoute(url.hash).key
    if(url.pathname===new URL('后台系统/index.html',root).pathname)return 'headquarters'
    if(url.pathname===new URL('小程序/index.html',root).pathname){
      if(url.hash.startsWith('#w-'))return 'worker'
      const version=url.searchParams.get('consumerVersion')||'0.14'
      return Object.keys(views).find(key=>views[key].app==='consumer'&&new URL(views[key].file,root).searchParams.get('consumerVersion')===version)
    }
    return Object.keys(views).find(key=>new URL(views[key].file,root).pathname===url.pathname)
  }
  window.TOTO_PROTOTYPE_CATALOG={root,views,perspectives,perspectiveFor,resolveView,pageFor,parseRoute,routeHash,acceptsMessageOrigin,revision:'20261019-native-navigation-10'}
})()
