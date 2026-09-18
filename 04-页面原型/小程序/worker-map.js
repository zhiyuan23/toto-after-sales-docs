/* Local review model for the WeChat Mini Program map component. */
(function () {
  'use strict';
  const worker=window.TOTO_WORKER;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action,value='',cls='',extra='')=>`<button type="button" data-wmap="${action}" data-value="${e(value)}" class="${cls}" ${extra}>${text}</button>`;
  // Review-only GCJ-02-like coordinates and canvas positions. They are not real customer locations.
  const positions={
    WX202609130018:{x:262,y:279,latitude:31.1818,longitude:121.4426},AZ202609110006:{x:166,y:234,latitude:31.1863,longitude:121.4308},
    AZ202609130021:{x:83,y:198,latitude:31.1901,longitude:121.4209},WX202609120009:{x:240,y:111,latitude:31.1994,longitude:121.4398},
    AZ202609100002:{x:71,y:190,latitude:31.1910,longitude:121.4194},WX202609110019:{x:125,y:350,latitude:31.1743,longitude:121.4258},
    WX202609090003:{x:304,y:81,latitude:31.2027,longitude:121.4479},WX202609140031:{x:230,y:116,latitude:31.1988,longitude:121.4386},
    AZ202609140032:{x:312,y:77,latitude:31.2032,longitude:121.4490}
  };
  const device={x:245,y:109,name:'我的位置'};
  let state;
  function reset(){state={scope:'filtered',date:null,only:null,query:'',selected:null,view:'map',location:'idle',locationOutcome:'success',scenario:'normal',group:[],modal:null,fitRevision:0};}
  reset();
  const authorized=()=>worker.visibleTasks();
  function point(t){
    if(!t||t.type==='远程指导'||!positions[t.id]||state.scenario==='missing')return null;
    if(state.scenario==='overlap'&&t.id==='AZ202609130021')return positions.WX202609130018;
    return positions[t.id];
  }
  const today=()=>authorized().filter(t=>t.queue==='pending'&&t.flag==='已预约'&&t.date==='2026-09-13'&&t.type!=='远程指导').sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));
  function openDate(date){
    if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('请选择有效日期');
    reset();state.date=date;state.scope='date';reconcile();
  }
  function rows(){
    let list=state.only?authorized().filter(t=>t.id===state.only):state.scope==='date'?authorized().filter(t=>t.date===state.date):state.scope==='today'?today():worker.filteredTasks().filter(t=>authorized().some(a=>a.id===t.id));
    return list.filter(t=>(t.id+t.name+t.address).toLowerCase().includes(state.query.toLowerCase()));
  }
  const selected=()=>rows().find(t=>t.id===state.selected)||null;
  function reconcile(){
    const list=rows();
    if(!list.some(t=>t.id===state.selected))state.selected=(list.find(t=>point(t)&&t.date==='2026-09-13'&&t.flag==='已预约')||list.find(t=>point(t)&&t.flag==='已预约')||list.find(point)||list[0])?.id||null;
    if(!state.group.every(id=>list.some(t=>t.id===id)))state.group=[];
    if(!authorized().length){state.location='idle';state.modal=null;}
  }
  function open(id=null){reset();state.only=id;state.selected=id;reconcile();}
  const tone=t=>t.flag==='审核退回'?'returned':['缺件','断联'].includes(t.flag)?'warning':'normal';
  const brief=t=>t.address.split(' · ').pop().replace(/\s\d+\s栋.*$/,'');
  function groups(){
    const result=[];
    rows().filter(point).forEach(t=>{const p=point(t);let g=result.find(g=>g.latitude===p.latitude&&g.longitude===p.longitude);if(!g){g={...p,ids:[]};result.push(g);}g.ids.push(t.id);});
    return result;
  }
  function act(action,value){
    reconcile();
    switch(action){
      case 'open':open();return 'w-map';
      case 'task-location':open(value);return 'w-map';
      case 'scope':state.date=null;state.scope=value==='today'?'today':'filtered';state.only=null;state.query='';state.selected=null;state.view='map';state.group=[];break;
      case 'select':if(!rows().some(t=>t.id===value))throw Error('任务已不在当前授权范围内');state.selected=value;state.group=[];state.view='map';break;
      case 'group':state.group=groups().find(g=>g.ids.join(',')===value)?.ids||[];state.view='map';break;
      case 'list':state.view=state.view==='list'?'map':'list';state.group=[];break;
      case 'locate':state.location=state.locationOutcome==='success'?'ready':state.locationOutcome;break;
      case 'fit':state.fitRevision++;break;
      case 'next':if(!rows().some(t=>t.id===value))throw Error('任务已不在当前授权范围内');return worker.actAction('task-next',value);
      case 'detail':if(!rows().some(t=>t.id===value))throw Error('任务已不在当前授权范围内');return worker.actAction('task',value);
      case 'native':{const t=rows().find(t=>t.id===(value||selected()?.id));if(!point(t))throw Error('请先联系服务中心核实地址坐标');state.modal={id:t.id,name:brief(t),address:t.address};break;}
      case 'dismiss':state.modal=null;break;
      case 'native-return':state.modal=null;return {toast:'已返回任务地图。未改变签到或工单状态。'};
    }
    reconcile();return null;
  }
  function simulate(kind,value){
    if(kind==='scenario'){state.scenario=['normal','overlap','missing'].includes(value)?value:'normal';state.group=[];}
    else if(kind==='location')state.locationOutcome=value;
    reconcile();
  }
  function mapCanvas(){
    const list=rows().filter(point),pins=groups();
    return `<div class="wm-canvas" role="group" aria-label="微信小程序任务地图示意" data-native-component="map" data-map-bindings="markers show-location include-points bindmarkertap"><div class="wm-map-layer"><img class="wm-base" src="assets/worker-map-base.svg" alt="微信地图组件布局示意，非真实客户位置">${state.location==='ready'?`<span class="wm-origin" style="left:${device.x/3.9}%;top:${device.y/4.1}%">我</span>`:''}${pins.map(g=>{const t=list.find(t=>t.id===g.ids[0]),active=g.ids.includes(state.selected);return button(`<span class="wm-pin-label">${g.ids.length>1?`${g.ids.length} 单同址`:e(worker.canArrange(t)&&t.flag==='已预约'?(t.date!=='2026-09-13'?t.date.slice(5)+' ':'')+t.start+' '+t.type:worker.nextStep(t).label)}</span><b>${g.ids.length>1?g.ids.length:t.type==='安装'?'装':'修'}</b>`,g.ids.length>1?'group':'select',g.ids.length>1?g.ids.join(','):t.id,`wm-pin ${tone(t)} ${active?'active':''}`,`style="left:${g.x/3.9}%;top:${g.y/4.1}%" data-marker-id="${e(g.ids[0])}" data-latitude="${g.latitude}" data-longitude="${g.longitude}" aria-label="${g.ids.length>1?g.ids.length+'单同址任务':e('选择'+t.name+t.flag)}" aria-pressed="${active}"`);}).join('')}</div><span class="wm-map-caption">微信 map 组件接入示意</span><div class="wm-tools">${button('◉','locate','','','aria-label="定位我的位置"')}${button('▣','fit','','','aria-label="显示全部标点"')}</div>${!list.length?'<div class="wm-map-empty">暂无可标注的位置<br><small>仍可在列表中查看任务</small></div>':''}</div>`;
  }
  function locationNotice(){return ['denied','failed'].includes(state.location)?`<div class="wm-alert" role="status"><strong>${state.location==='denied'?'未开启位置权限':'定位暂不可用'}</strong><span>仍可查看任务标点和目的地位置。</span>${button(state.location==='denied'?'已开启权限，重试':'重新定位','locate','','wm-link')}</div>`:'';}
  function taskCard(t){
    if(!t)return '<div class="wm-empty">当前没有匹配任务，试试其他筛选。</div>';
    const hasPoint=!!point(t);
    return `<article class="wm-task"><div class="wm-card-head"><span class="wm-status ${tone(t)}">${e(worker.nextStep(t).label)}</span><small>${e(t.type)} · ${e(t.id.slice(-6))}</small></div><div class="wm-card-title"><div><h2>${e(t.name)}</h2><p>${e(brief(t))}</p></div>${worker.canArrange(t)&&t.flag==='已预约'?`<div class="wm-time"><b>${e(t.start)}</b><small>${e(t.date.slice(5)+' · 至 '+t.end)}</small></div>`:''}</div><p class="wm-address">${e(t.address)}</p><div class="wm-actions">${button('工单详情','detail',t.id,'secondary')}${hasPoint?button('打开微信位置页','native',t.id,'primary'):button(t.type==='远程指导'?'查看远程任务':'核实地址','detail',t.id,'primary')}</div></article>`;
  }
  function listRow(t){return `<div class="wm-list-row"><span class="wm-list-dot ${tone(t)}"></span><div><strong>${e(t.name)} <small>${e(worker.nextStep(t).label)}</small></strong><p>${e(brief(t))}</p><small>${t.type==='远程指导'?'远程服务 · 无需上门':!point(t)?'地址待核实 · 未标点':e(t.start||'暂无预约时间')}</small></div>${button(point(t)?'选中':'查看',point(t)?'select':'detail',t.id,'wm-link')}</div>`;}
  function browse(){
    const list=rows(),mapped=list.filter(point),remote=list.filter(t=>t.type==='远程指导'),missing=list.filter(t=>t.type!=='远程指导'&&!point(t));
    const scopeLabel=state.scope==='date'?`${state.date.slice(5)} 任务`:null;
    return `<div class="wm-segments">${scopeLabel?`<span class="wm-date-scope">${e(scopeLabel)}</span>`:`${button('当前筛选','scope','filtered',state.scope==='filtered'&&!state.only?'selected':'')}${button('今日预约','scope','today',state.scope==='today'?'selected':'')}`}</div>${state.view==='list'?'':mapCanvas()}<section class="wm-sheet">${locationNotice()}<div class="wm-sheet-heading"><div class="wm-sheet-summary"><strong>${mapped.length} 单已标点</strong><span>${missing.length} 单待核址 · ${remote.length} 单远程</span></div>${button(state.view==='list'?'地图':'列表','list','','wm-switch')}</div>${state.group.length?`<div class="wm-group"><h3>同一位置 · ${state.group.length} 张工单</h3>${list.filter(t=>state.group.includes(t.id)).map(listRow).join('')}</div>`:state.view==='list'?`<form data-wmap-search class="w-search"><input name="query" type="search" aria-label="搜索地图任务" placeholder="姓名 / 地址 / 工单号" value="${e(state.query)}"><button type="submit">搜索</button></form>${list.map(listRow).join('')||'<p class="wm-empty">未找到匹配任务</p>'}`:taskCard(selected())}${state.view!=='list'&&!state.group.length&&missing.length?`<div class="wm-unlocated">${button(`${missing.length} 单地址待核实 · 查看 ›`,'list','','wm-link')}</div>`:''}</section>`;
  }
  function overlay(){
    if(!state.modal)return '';
    return `<div class="w-scrim"><section class="w-dialog" role="dialog" aria-modal="true" aria-label="微信位置页示意" tabindex="-1"><small class="wm-example">wx.openLocation · 原生位置页交接示意</small><h2>${e(state.modal.name)}</h2><p>${e(state.modal.address)}</p><div class="wm-alert">正式版把当前目的地交给微信位置页。是否继续导航由微信和设备决定，小程序不展示自行计算的路线、里程或时长。</div><div class="wm-actions">${button('取消','dismiss','','secondary')}${button('模拟返回小程序','native-return','','primary')}</div><p class="wm-example">返回后仍需单独执行到达签到。</p></section></div>`;
  }
  window.TOTO_WORKER_MAP={reset,open,openDate,act,simulate,rows,groups,point,snapshot:()=>JSON.parse(JSON.stringify(state)),render(){reconcile();return `<div class="wm-page">${browse()}</div>`;},overlay,
    back(){if(state.modal){state.modal=null;return true;}if(state.view==='list'||state.group.length){state.view='map';state.group=[];return true;}return false;},
    handle(el,{render,showScreen,showToast}){if(!el.dataset.wmap)return false;try{const result=act(el.dataset.wmap,el.dataset.value);if(typeof result==='string')showScreen(result);else{render();if(result?.toast)showToast(result.toast);}}catch(err){showToast(err.message);}return true;},
    submit(form,{render}){if(!form.hasAttribute('data-wmap-search'))return false;state.query=form.querySelector('[name="query"]').value.trim();state.group=[];reconcile();render();return true;}
  };
})();
