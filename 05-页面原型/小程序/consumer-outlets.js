/* C08: local, fictional outlet discovery. No location, telephone or map API calls. */
(() => {
  const app = window.TOTO_SCREENS.consumer;
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icons = {
    pin: '<path d="M20 10c0 6-8 11-8 11S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
    locate: '<circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 1v4m0 14v4M1 12h4m14 0h4"/>',
    search: '<circle cx="10" cy="10" r="6"/><path d="m15 15 5 5"/>',
    phone: '<path d="m7 3 3 5-3 3c1 3 3 5 6 6l3-3 5 3-1 4C10 23 1 14 3 4Z"/>',
    arrow: '<path d="m3 10 18-7-7 18-3-8-8-3Z"/>',
    shop: '<path d="M4 10v11h16V10M3 4h18l1 6c-2 3-5 3-7 0-2 3-4 3-6 0-2 3-5 3-7 0l1-6ZM9 21v-7h6v7"/>',
    repair: '<path d="M14 4a6 6 0 0 0-7 8l-5 5 5 5 5-5a6 6 0 0 0 8-7l-4 4-5-5 3-5Z"/>',
    list: '<path d="M8 5h13M8 12h13M8 19h13M3 5h1M3 12h1M3 19h1"/>',
    map: '<path d="m2 5 6-3 8 3 6-3v17l-6 3-8-3-6 3V5ZM8 2v17M16 5v17"/>',
  };
  const icon = name => `<svg class="o-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.pin}</svg>`;
  const kinds = {repair: {name:'维修网点',subtitle:'产品维修 · 售后咨询',intro:'找到身边的售后支持'},store: {name:'授权门店',subtitle:'产品体验 · 购买咨询',intro:'到店，发现更多舒适体验'}};
  const cities = {'上海市':['徐汇区','长宁区','浦东新区'],'杭州市':['上城区','拱墅区'],'南京市':['鼓楼区','建邺区']};
  const outlets = [
    {id:'r-xh',kind:'repair',city:'上海市',district:'徐汇区',name:'徐汇维修服务点',address:'示例路 88 号服务中心 1 层',hours:'周一至周六 09:00–18:00',phone:'021-0000-0101',services:['坐便器维修','卫洗丽维修','使用咨询'],coverage:'徐汇区、长宁区',visit:'到访前请先电话确认接待方式；上门服务请提交维修申请。',distance:1.2,x:35,y:57},
    {id:'r-pd',kind:'repair',city:'上海市',district:'浦东新区',name:'浦东维修服务点',address:'样板路 126 号服务中心 2 层',hours:'周一至周日 09:00–17:30',phone:'021-0000-0102',services:['卫浴产品维修','使用咨询'],coverage:'浦东新区',visit:'请先联系确认可受理产品和到访安排。',distance:6.8,x:75,y:33},
    {id:'s-xh',kind:'store',city:'上海市',district:'徐汇区',name:'徐汇产品体验店',address:'示例大道 66 号家居中心 1 层',hours:'周一至周日 10:00–20:00',phone:'021-0000-0201',services:['产品体验','选购咨询','购买服务'],coverage:'',visit:'出发前可先咨询目标型号的展示情况与接待时间。',distance:1.6,x:31,y:48},
    {id:'s-cn',kind:'store',city:'上海市',district:'长宁区',name:'长宁卫浴展示店',address:'样板路 18 号家居广场 B 区',hours:'周一至周日 10:00–18:00',phone:'021-0000-0202',services:['卫浴展示','选购咨询'],coverage:'',visit:'店内展示产品以电话咨询结果为准。',distance:3.5,x:66,y:30},
    {id:'r-hz',kind:'repair',city:'杭州市',district:'上城区',name:'上城维修服务点',address:'示例路 36 号服务中心',hours:'周一至周六 09:00–18:00',phone:'0571-0000-0101',services:['卫浴产品维修','使用咨询'],coverage:'上城区、拱墅区',visit:'到访前请先电话联系确认。',distance:null,x:48,y:46},
    {id:'s-hz',kind:'store',city:'杭州市',district:'拱墅区',name:'拱墅产品体验店',address:'样板大道 28 号家居中心',hours:'周一至周日 10:00–19:00',phone:'0571-0000-0201',services:['产品体验','选购咨询'],coverage:'',visit:'出发前可先咨询产品展示情况。',distance:null,x:40,y:39},
  ];
  const initial = () => ({kind:'repair',city:'上海市',district:'全部区县',query:'',searchDraft:'',view:'map',selectedId:'r-xh',location:'idle',locationOutcome:'success',failed:false,pickCity:'上海市',pickDistrict:'全部区县',overlay:''});
  let state = initial(), focusTarget = '';
  const results = () => outlets.filter(o => o.kind===state.kind && o.city===state.city && (state.district==='全部区县' || o.district===state.district) && `${o.name} ${o.city}${o.district}${o.address} ${o.services.join(' ')}`.includes(state.query.trim()));
  const selected = () => results().find(o=>o.id===state.selectedId) || results()[0];
  const distance = o => state.location==='ready' && o.city==='上海市' && o.distance ? `约 ${o.distance} km` : o.district;
  const address = o => `${o.city}${o.district}${o.address}`;
  const note = '地图优先：上方切换类别与搜索，下方只保留选中网点和电话、导航；点名称查看详情，展开列表选其他网点。名称、地址、电话、时间、距离及位置均为虚构演示资料。定位、拨号与微信位置页仅模拟；HTML 不调用真实微信接口，也不支持真实地图拖动或缩放。';
  const badge = o => `<span class="o-kind">${icon(o.kind==='store'?'shop':'repair')}${kinds[o.kind].name}</span>`;
  const actions = o => `<div class="o-actions"><button data-outlet="contact" data-outlet-id="${o.id}">${icon('phone')}电话</button><button data-outlet="navigation" data-outlet-id="${o.id}">${icon('arrow')}导航</button></div>`;
  function map(list, detail=false) {
    return `<div class="o-map${detail?' is-detail':''}" ${!detail && state.view==='list'?'inert aria-hidden="true"':''} role="group" aria-label="${e(state.city)}网点示意地图"><svg class="o-map-art" viewBox="0 0 390 560" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><rect width="390" height="560" fill="#eef1eb"/><g fill="#e3e8df" stroke="#edf1ea" stroke-width="5"><path d="M0 0h95l52 115-92 48L0 100Zm154 0h125l-28 138-80-25ZM0 221l129-64 49 102-102 53-76-8Zm213-66 56 0 40 126-68 28-58-51ZM82 359l125-66 53 104-141 62Zm202-57 106-24v170l-54 3ZM0 385l51-13 65 171H0Zm160 104 136-66 60 137H179Z"/></g><path d="M302-25c-105 135 99 162 25 324S269 486 351 594" fill="none" stroke="#d2e5e9" stroke-width="36"/><path d="M35 72 92 60l38 67-72 41-32-49Zm86 301 73-35 29 53-80 42Zm-20 120-27 17-25-61 30-9Z" fill="#d8e7d1"/><g fill="none" stroke="#fff" stroke-width="14"><path d="M-28 238 415 28M-16 423 419 197M61-20 317 598M-20 128l436 295M-20 526l421-190"/></g><g fill="none" stroke="#dbe0d7" stroke-width="1.2"><path d="M-28 238 415 28M-16 423 419 197M61-20 317 598M-20 128l436 295M-20 526l421-190"/></g><g fill="#8a968b" font-size="11" font-family="sans-serif"><text x="54" y="113">城市公园</text><text x="202" y="177">生活街区</text><text x="160" y="380">社区绿地</text><text x="292" y="469">滨河步道</text><text x="88" y="285">${e(state.city)}</text></g></svg>${state.location==='ready' && state.city==='上海市'?'<span class="o-user-point" aria-label="当前位置示意"></span>':''}${list.map((o,i)=>`<button class="o-map-pin${o.id===selected()?.id?' is-active':''}" style="left:${o.x}%;top:${detail?o.y:28+o.y*.6}%" data-outlet="select" data-outlet-id="${o.id}" aria-label="选择${e(o.name)}" aria-pressed="${o.id===selected()?.id}"><span>${i+1}</span>${o.id===selected()?.id?`<strong>${e(o.name)}</strong>`:''}</button>`).join('')}</div>`;
  }
  function controls() {
    const region = state.district==='全部区县' ? state.city.replace('市','') : state.district;
    return `<div class="o-top-controls"><form class="o-search" data-outlet-search><button type="button" data-outlet="region" aria-label="选择地区，当前${e(state.city)}${e(state.district)}">${e(region)}<span>⌄</span></button><label><span class="o-sr-only">搜索网点名称或地址</span><input type="search" name="outletKeyword" value="${e(state.searchDraft)}" maxlength="60" placeholder="搜索网点 / 地址" autocomplete="off" enterkeyhint="search"></label><button type="submit" aria-label="搜索网点">${icon('search')}</button></form><div class="o-type-switch" aria-label="网点类型">${Object.entries(kinds).map(([key,kind])=>`<button data-outlet="kind" data-value="${key}" aria-pressed="${state.kind===key}">${kind.name}</button>`).join('')}</div></div>`;
  }
  function locationNotice(inRegion=false) {
    if (!['denied','failed'].includes(state.location)) return '';
    return `<div class="o-location-note" role="status"><span>${state.location==='denied'?'定位未开启，可手动选地区':'定位暂不可用，可手动选地区'}</span>${inRegion && state.location==='denied'?'':`<button data-outlet="${state.location==='denied'?'region':inRegion?'locate-region':'locate'}">${state.location==='denied'?'选择地区':'重试'}</button>`}</div>`;
  }
  function result(o, compact=false) {
    if (compact) return `<button class="o-list-item${o.id===selected()?.id?' is-selected':''}" data-outlet="select" data-outlet-id="${o.id}"><span><strong>${e(o.name)}</strong><span>${e(address(o))}</span></span><small>${e(distance(o))}<span>查看 ›</span></small></button>`;
    return `<article class="o-selected"><button class="o-result-title" data-outlet="detail" data-outlet-id="${o.id}" aria-label="查看${e(o.name)}详情"><strong>${e(o.name)}</strong><span>详情 ›</span></button><p class="o-address">${e(address(o))}</p>${state.location==='ready' && o.city==='上海市'?`<p class="o-distance">${icon('pin')}${e(distance(o))} · 示例距离</p>`:''}${actions(o)}</article>`;
  }
  function directory() {
    const list=results(), o=selected();
    const empty = `<div class="o-empty">${icon('search')}<h3>这里暂未找到${kinds[state.kind].name}</h3><p>试试其他地区或关键词</p><button class="primary" data-outlet="${state.query || state.district!=='全部区县'?'clear':'region'}">${state.query || state.district!=='全部区县'?'清除筛选':'更换城市'}</button><button class="c-text-button" data-action="客服渠道待配置；本次原型不连接真实客服。">联系 TOTO 客服</button></div>`;
    return `<section class="o-discovery${state.view==='list'?' is-list':''}">${map(state.failed?[]:list)}${controls()}<div class="o-map-tools" ${state.view==='list'?'hidden':''}><span>示意地图</span><button data-outlet="locate" aria-label="使用当前位置">${icon('locate')}</button></div><section class="o-sheet" aria-label="网点查询结果">${locationNotice()}<header class="o-sheet-bar"><span>${state.failed?'暂时无法获取网点':`${e(state.city)}${state.district==='全部区县'?'':` · ${e(state.district)}`} · ${list.length} 个网点`}</span><button data-outlet="view" aria-expanded="${state.view==='list'}">${icon(state.view==='map'?'list':'map')}${state.view==='map'?'查看列表':'收起列表'}</button></header>${state.failed?'<div class="o-empty" role="alert"><h3>网点暂时加载不出来</h3><p>筛选条件已保留，请稍后重试</p><button class="primary" data-outlet="retry">重新加载</button></div>':!list.length?empty:state.view==='list'?`<div class="o-result-list">${list.map(o=>result(o,true)).join('')}</div>`:result(o)}</section></section>`;
  }
  const missing = () => '<div class="o-empty"><h3>请先选择一个网点</h3><button class="primary" data-go="c-outlets">查找网点</button></div>';
  app.screens.push(
    {id:'c-outlets',parent:'c-service',title:'查找服务网点',entry:'C08 · 地图查找',goal:'先在地图找到位置，再从底部卡片直接联系或导航；顶部仅保留地区搜索与网点类型，详细资料按需查看。未登记产品也可查询。',note,body:directory},
    {id:'c-outlet-region',parent:'c-outlets',title:'选择地区',entry:'C08 · 城市与区县',goal:'定位按用户意愿触发，拒绝或失败后仍能手选地区。确认后回到地图，保留类别和关键词。',note:'上海、杭州和南京为示例城市；南京用于体验空结果，不表示当地实际没有网点。',body:()=>`<button class="o-location-button" data-outlet="locate-region">${icon('locate')}使用当前位置<span>›</span></button>${locationNotice(true)}<section class="o-region-section"><h3>城市 <span>示例地区</span></h3><div class="o-region-options">${Object.keys(cities).map(city=>`<button data-outlet="pick-city" data-value="${city}" aria-pressed="${state.pickCity===city}">${city}</button>`).join('')}</div></section><section class="o-region-section"><h3>区县</h3><div class="o-region-options">${['全部区县',...cities[state.pickCity]].map(district=>`<button data-outlet="pick-district" data-value="${district}" aria-pressed="${state.pickDistrict===district}">${district}</button>`).join('')}</div></section>`,footer:'<button class="primary" data-outlet="apply-region">查看该地区网点</button>'},
    {id:'c-outlet-detail',parent:'c-outlets',title:'网点详情',entry:'C08 · 按需查看资料',goal:'查看营业或联系时间、服务范围和到访说明。电话与导航直接使用原生能力的模拟浮层，取消后留在当前页面。',note:note+' 维修申请进入统一流程，不将浏览的网点指定为承接站。',body:()=>{const o=selected();return o?`<section class="o-detail-heading">${badge(o)}<h2>${e(o.name)}</h2><p>${e(address(o))}</p></section>${map([o],true)}<dl class="o-detail-data"><div><dt>${o.kind==='store'?'营业时间':'联系时间'}</dt><dd>${e(o.hours)}</dd></div><div><dt>咨询电话</dt><dd>${e(o.phone)}</dd></div>${o.coverage?`<div><dt>服务地区</dt><dd>${e(o.coverage)}</dd></div>`:''}</dl><section class="o-detail-section"><h3>${o.kind==='store'?'到店可以了解':'可咨询的服务'}</h3><div class="o-service-tags">${o.services.map(s=>`<span>${e(s)}</span>`).join('')}</div><p>${e(o.visit)}</p></section>${o.kind==='repair'?'<section class="o-repair-entry"><div><h3>需要上门维修？</h3><p>提交申请，由服务团队安排</p></div><button data-service-type="repair" data-go="c-repair">申请维修 ›</button></section>':''}<p class="o-example-note">演示网点 · 资料与位置均为示例</p>`:missing();},footer:()=>selected()?actions(selected()):''}
  );
  function locate() {
    state.location=state.locationOutcome==='success'?'ready':state.locationOutcome;
    if (state.location==='ready') {state.city='上海市';state.district='全部区县';state.pickCity=state.city;state.pickDistrict=state.district;state.selectedId='';}
  }
  function dismiss() {
    if (!state.overlay) return false;
    focusTarget=`[data-outlet="${state.overlay}"][data-outlet-id="${selected()?.id}"]`;
    state.overlay='';
    return true;
  }
  function overlay() {
    const o=selected();
    if (!state.overlay || !o) return '';
    const phone=state.overlay==='contact';
    return `<button class="o-overlay-backdrop" data-outlet="dismiss" tabindex="-1" aria-label="关闭操作预览"></button><section id="outlet-dialog" class="o-native-dialog${phone?' is-phone':' is-location'}" role="dialog" aria-modal="true" aria-labelledby="outlet-dialog-title" aria-describedby="outlet-dialog-description"><span class="o-native-label">${phone?'系统拨号确认 · 原型模拟':'微信位置页 · 原型模拟'}</span>${phone?`<h2 id="outlet-dialog-title">${e(o.phone)}</h2><p>${e(o.name)}</p><p id="outlet-dialog-description" class="o-native-hint">示例号码，本次不会拨出电话</p><div class="o-native-actions"><button data-outlet="dismiss">取消</button><button data-outlet="call">拨打</button></div>`:`<div class="o-native-location-icon">${icon('pin')}</div><h2 id="outlet-dialog-title">${e(o.name)}</h2><p>${e(address(o))}</p><p id="outlet-dialog-description" class="o-native-hint">正式小程序在微信位置页查看地点，<br>再选择导航；此处仅演示交互。</p><button class="primary" data-outlet="navigate">${icon('arrow')}导航到这里</button><button class="o-native-close" data-outlet="dismiss">返回网点</button>`}</section>`;
  }
  window.TOTO_OUTLETS = {
    reset:()=>{state=initial();focusTarget='';},
    owns:id=>id==='c-outlets' || id.startsWith('c-outlet-'),
    input:el=>{if(el.name==='outletKeyword') state.searchDraft=el.value;},
    setLocationOutcome:value=>{if(['success','denied','failed'].includes(value))state.locationOutcome=value;},
    locationOutcome:()=>state.locationOutcome,
    fail:()=>{state.failed=true;}, recover:()=>{state.failed=false;},
    overlay, dismiss, clearOverlay:()=>{state.overlay='';focusTarget='';},
    takeFocus:()=>{const value=focusTarget;focusTarget='';return value;},
    submit:(form,api)=>{if(!form.hasAttribute('data-outlet-search'))return false;state.query=state.searchDraft.trim();state.selectedId='';state.failed=false;api.render();return true;},
    handle:(el,api)=>{
      const action=el.dataset.outlet;
      if(!action)return false;
      const value=el.dataset.value;
      if(el.dataset.outletId){const o=results().find(o=>o.id===el.dataset.outletId);if(!o)return true;state.selectedId=o.id;}
      if(action==='kind' && kinds[value]) {state.kind=value;state.selectedId='';state.query=state.searchDraft.trim();}
      else if(action==='view')state.view=state.view==='map'?'list':'map';
      else if(action==='select')state.view='map';
      else if(action==='region'){state.pickCity=state.city;state.pickDistrict=state.district;api.showScreen('c-outlet-region');return true;}
      else if(action==='pick-city' && cities[value]){state.pickCity=value;state.pickDistrict='全部区县';}
      else if(action==='pick-district' && ['全部区县',...cities[state.pickCity]].includes(value))state.pickDistrict=value;
      else if(action==='apply-region'){state.city=state.pickCity;state.district=state.pickDistrict;state.selectedId='';state.failed=false;state.location='idle';api.returnTo('c-outlets');return true;}
      else if(action==='locate' || action==='locate-region'){locate();if(action==='locate-region' && state.location==='ready'){api.returnTo('c-outlets');api.showToast('已使用上海徐汇的示例位置。');return true;}}
      else if(action==='clear'){state.query='';state.searchDraft='';state.district='全部区县';state.selectedId='';}
      else if(action==='retry')state.failed=false;
      else if(action==='detail'){api.showScreen('c-outlet-detail');return true;}
      else if(['contact','navigation'].includes(action)){state.overlay=action;focusTarget='#outlet-dialog [data-outlet="dismiss"]';api.renderOverlay();return true;}
      else if(['dismiss','call','navigate'].includes(action)){dismiss();api.renderOverlay();if(action==='call')api.showToast('已演示系统拨号交互，未拨出电话。');if(action==='navigate')api.showToast('已演示导航入口，未打开外部地图。');return true;}
      api.render();
      if (action==='locate' && state.location==='ready')api.showToast('已使用上海徐汇的示例位置。');
      return true;
    },
  };
})();
