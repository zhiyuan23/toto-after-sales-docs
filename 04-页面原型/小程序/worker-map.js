/* Local map interaction model. Fixture coordinates, geometry and travel figures are illustrative only. */
(function () {
  'use strict';
  const worker=window.TOTO_WORKER;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(text,action,value='',cls='',extra='')=>`<button type="button" data-wmap="${action}" data-value="${e(value)}" class="${cls}" ${extra}>${text}</button>`;
  // Not geocoded addresses. No fixture is used outside the local prototype.
  const positions={WX202609130018:[262,279],AZ202609110006:[166,234],AZ202609130021:[83,198],WX202609120009:[240,111],AZ202609100002:[71,190],WX202609110019:[125,350],WX202609090003:[304,81],WX202609140031:[230,116],AZ202609140032:[312,77]};
  const station={x:275,y:94,name:'徐汇服务中心'},device={x:245,y:109,name:'我的位置'};
  let state;
  function reset(){state={scope:'filtered',date:null,only:null,query:'',selected:null,view:'map',routeKind:'single',stops:[],mode:'driving',origin:null,location:'idle',locationOutcome:'success',routeOutcome:'success',scenario:'normal',route:null,error:'',group:[],modal:null,zoom:1};}
  reset();
  function authorized(){return worker.visibleTasks();}
  function point(t){if(!t||t.type==='远程指导'||!positions[t.id]||state.scenario==='missing')return null;const xy=state.scenario==='overlap'&&t.id==='AZ202609130021'?positions.WX202609130018:positions[t.id];return {x:xy[0],y:xy[1]};}
  function today(){return authorized().filter(t=>t.queue==='pending'&&t.flag==='已预约'&&t.date==='2026-09-13'&&t.type!=='远程指导').sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id));}
  function routeTasks(){return state.routeKind==='date'?authorized().filter(t=>t.date===state.date&&t.queue==='pending'&&t.flag==='已预约'&&t.type!=='远程指导').sort((a,b)=>a.start.localeCompare(b.start)||a.id.localeCompare(b.id)):today();}
  function openDate(date,route=false){if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date+'T00:00:00Z'))||new Date(date+'T00:00:00Z').toISOString().slice(0,10)!==date)throw Error('请选择有效日期');if(route&&date<'2026-09-13')throw Error('过去日期不生成当日出行路线');reset();state.date=date;state.scope='date';if(route){state.routeKind='date';state.view='route';state.stops=routeTasks().filter(point).map(t=>t.id);}reconcile();}
  function rows(){let list=state.only?authorized().filter(t=>t.id===state.only):state.scope==='date'?authorized().filter(t=>t.date===state.date):state.scope==='today'?today():worker.filteredTasks().filter(t=>authorized().some(a=>a.id===t.id));return list.filter(t=>(t.id+t.name+t.address).toLowerCase().includes(state.query.toLowerCase()));}
  const selected=()=>rows().find(t=>t.id===state.selected)||null;
  function invalidate(){state.route=null;state.error='';}
  function reconcile(){const list=rows();if(!list.some(t=>t.id===state.selected))state.selected=(list.find(t=>point(t)&&t.date==='2026-09-13'&&t.flag==='已预约')||list.find(t=>point(t)&&t.flag==='已预约')||list.find(point)||list[0])?.id||null;
    const valid=new Set((state.view==='route'&&state.routeKind==='date'?routeTasks():rows()).filter(point).map(t=>t.id));const stops=state.stops.filter(id=>valid.has(id));if(stops.join()!==state.stops.join()){state.stops=stops;invalidate();}
    if(state.route&&state.route.key!==routeKey())invalidate();
  }
  function open(id=null){reset();state.only=id;state.selected=id;reconcile();}
  const tone=t=>t.flag==='审核退回'?'returned':['缺件','断联'].includes(t.flag)?'warning':'normal';
  const brief=t=>t.address.split(' · ').pop().replace(/\s\d+\s栋.*$/,'');
  function groups(){const result=[];rows().filter(point).forEach(t=>{const p=point(t);let g=result.find(g=>g.x===p.x&&g.y===p.y);if(!g){g={...p,ids:[]};result.push(g);}g.ids.push(t.id);});return result;}
  const originPoint=()=>state.origin==='station'&&authorized().length?station:state.origin==='device'&&state.location==='ready'?device:null;
  const stopTasks=()=>state.stops.map(id=>authorized().find(t=>t.id===id)).filter(Boolean);
  const routeKey=()=>JSON.stringify([state.stops,state.stops.map(id=>point(authorized().find(t=>t.id===id))),state.mode,state.origin]);
  function calculate(){invalidate();if(!originPoint()){state.error='先选择出发位置，再预览路线。';return;}if(!state.stops.length){state.error='请保留至少一个有坐标的目的地。';return;}
    if(state.routeOutcome!=='success'){state.error=state.routeOutcome==='no-route'?'未找到可用路线。可切换出行方式，或打开目的地位置。':'路线暂时获取失败，目的地与顺序已保留。';return;}
    // Sample paths follow the reused schematic streets. This is not a routing engine.
    const ac={x:136,y:160},cd={x:178,y:262},bd={x:229,y:296},bc={x:198,y:312};
    const spoke=(p,id)=>{
      if(id==='WX202609130018'||state.scenario==='overlap'&&id==='AZ202609130021')return [p,bd,cd];
      if(id==='WX202609110019')return [p,bc,cd];
      if(['AZ202609110006','AZ202609130021','AZ202609100002'].includes(id))return [p,cd];
      return [p,ac,cd];
    };
    const destinations=stopTasks();let previous=spoke(originPoint()),geometry=[originPoint()];
    const same=(a,b)=>a.x===b.x&&a.y===b.y;
    for(const t of destinations){const next=spoke(point(t),t.id);let join=previous.findIndex(p=>next.some(q=>same(p,q)));
      if(join<0)join=previous.length-1;
      const tail=next.findIndex(p=>same(p,previous[join]));
      geometry.push(...previous.slice(1,join+1),...next.slice(0,tail).reverse());previous=next;
    }
    let distance=0;for(let i=1;i<geometry.length;i++)distance+=Math.hypot(geometry[i].x-geometry[i-1].x,geometry[i].y-geometry[i-1].y)*9;

    state.route={key:routeKey(),points:geometry,distance:Math.round(distance),minutes:Math.max(1,Math.round(distance/(state.mode==='driving'?310:72))),example:true};
  }
  function act(action,value){reconcile();
    switch(action){
      case 'open':open();return 'w-map';
      case 'task-location':open(value);return 'w-map';
      case 'scope':state.date=null;state.scope=value==='today'?'today':'filtered';state.only=null;state.query='';state.selected=null;state.view='map';state.group=[];invalidate();break;
      case 'select':if(!rows().some(t=>t.id===value))throw Error('任务已不在当前授权范围内');state.selected=value;state.group=[];state.view='map';invalidate();break;
      case 'group':state.group=groups().find(g=>g.ids.join(',')===value)?.ids||[];state.view='map';break;
      case 'list':state.view=state.view==='list'?'map':'list';state.group=[];break;
      case 'single':if(!selected()||!point(selected()))throw Error('地址待核实，暂不能规划路线');state.routeKind='single';state.stops=[selected().id];state.view='route';invalidate();break;
      case 'date-route':openDate(state.date,true);break;
      case 'today':state.date=null;state.scope='today';state.only=null;state.query='';state.routeKind='today';state.stops=today().filter(point).map(t=>t.id);state.view='route';state.group=[];invalidate();break;
      case 'browse':state.view='map';state.group=[];state.modal=null;break;
      case 'origin':state.origin=value==='station'?'station':null;invalidate();break;
      case 'locate':state.location=state.locationOutcome==='success'?'ready':state.locationOutcome;state.origin=state.location==='ready'?'device':null;invalidate();break;
      case 'mode':state.mode=value==='walking'?'walking':'driving';invalidate();break;
      case 'calculate':calculate();break;
      case 'up':{const i=state.stops.indexOf(value);if(i>0){[state.stops[i-1],state.stops[i]]=[state.stops[i],state.stops[i-1]];invalidate();}break;}
      case 'remove':state.stops=state.stops.filter(id=>id!==value);invalidate();break;
      case 'restore':state.stops=routeTasks().filter(point).map(t=>t.id);invalidate();break;
      case 'next':if(!rows().some(t=>t.id===value))throw Error('任务已不在当前授权范围内');return worker.actAction('task-next',value);
      case 'detail':if(!rows().some(t=>t.id===value))throw Error('任务已不在当前授权范围内');return worker.actAction('task',value);
      case 'native':{const id=value||state.stops[0]||selected()?.id,t=rows().find(t=>t.id===id);if(!point(t))throw Error('请先联系服务中心核实地址坐标');state.modal={id:t.id,name:brief(t),address:t.address};break;}
      case 'dismiss':state.modal=null;break;
      case 'native-return':state.modal=null;return {toast:'已返回路线原型。未打开真实地图，也未改变签到或工单状态。'};
      case 'zoom':state.zoom=state.zoom===1?1.25:1;break;
      case 'fit':state.zoom=1;break;
    }reconcile();return null;
  }
  function simulate(kind,value){if(kind==='scenario'){state.scenario=['normal','overlap','missing'].includes(value)?value:'normal';state.group=[];invalidate();}else if(kind==='location'){state.locationOutcome=value;}else if(kind==='route'){state.routeOutcome=value;invalidate();}reconcile();}
  function mapCanvas(){const route=state.view==='route';const list=route?stopTasks():rows().filter(point);const pins=route?list.map(t=>({...point(t),ids:[t.id]})):groups();return `<div class="wm-canvas" role="group" aria-label="任务示意地图"><div class="wm-map-layer" style="transform:scale(${state.zoom})"><img class="wm-base" src="assets/worker-map-base.svg" alt="示意街区底图，非真实地理位置">${route&&state.route?`<svg class="wm-route-line" viewBox="0 0 390 410" preserveAspectRatio="none" aria-label="示例路线"><polyline points="${state.route.points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="white" stroke-width="10" stroke-linejoin="round"/><polyline points="${state.route.points.map(p=>`${p.x},${p.y}`).join(' ')}" fill="none" stroke="#1766db" stroke-width="5" stroke-linejoin="round" stroke-dasharray="${state.mode==='walking'?'6 6':'none'}"/></svg>`:''}${(route?originPoint():state.location==='ready'?device:null)?`<span class="wm-origin" style="left:${(route?originPoint():device).x/3.9}%;top:${(route?originPoint():device).y/4.1}%">${state.origin==='station'&&route?'站':'我'}</span>`:''}${pins.map((g,i)=>{const t=list.find(t=>t.id===g.ids[0]),active=g.ids.includes(state.selected);return button(`<span class="wm-pin-label">${g.ids.length>1?`${g.ids.length} 单同址`:route?`${i+1} · ${e(t.start||t.flag)}`:e(worker.canArrange(t)&&t.flag==='已预约'?(t.date!=='2026-09-13'?t.date.slice(5)+' ':'')+t.start+' '+t.type:worker.nextStep(t).label)}</span><b>${g.ids.length>1?g.ids.length:route?i+1:t.type==='安装'?'装':'修'}</b>`,route?'native':g.ids.length>1?'group':'select',route?t.id:g.ids.length>1?g.ids.join(','):t.id,`wm-pin ${tone(t)} ${active?'active':''}`,`style="left:${g.x/3.9}%;top:${g.y/4.1}%" aria-label="${route?'打开位置':'选择'}${g.ids.length>1?g.ids.length+' 单同址任务':e(t.name+' '+t.flag)}" aria-pressed="${active}"`);}).join('')}</div><span class="wm-map-caption">示意地图 · 非真实路网</span><div class="wm-tools">${button('⊙','locate','','','aria-label="定位我的位置"')}${button('⌗','fit','','','aria-label="显示全部标点"')}${button(state.zoom===1?'+':'−','zoom','','','aria-label="切换地图缩放"')}</div>${!list.length?'<div class="wm-map-empty">暂无可标注的位置<br><small>仍可在列表中查看任务</small></div>':''}</div>`;}
  function locationNotice(){return ['denied','failed'].includes(state.location)?`<div class="wm-alert" role="status"><strong>${state.location==='denied'?'未开启位置权限':'定位暂不可用'}</strong><span>仍可查看标点；路线可从服务中心出发。</span>${button(state.location==='denied'?'已开启权限，重试':'重新定位','locate','','wm-link')}</div>`:'';}
  function taskCard(t){if(!t)return '<div class="wm-empty">当前没有匹配任务，试试其他筛选。</div>';return `<article class="wm-task"><div class="wm-card-head"><span class="wm-status ${tone(t)}">${e(worker.nextStep(t).label)}</span><small>${e(t.type)} · ${e(t.id.slice(-6))}</small></div><div class="wm-card-title"><div><h2>${e(t.name)}</h2><p>${e(brief(t))}</p></div><div class="wm-time"><b>${e(worker.nextStep(t).word)}</b><small>${worker.canArrange(t)&&t.flag==='已预约'?e(t.date.slice(5)+' · 至 '+t.end):'当前阶段'}</small></div></div><p class="wm-address">${e(t.address)}</p><div class="wm-actions">${button('工单详情','detail',t.id,'secondary')}${worker.isServing(t)||!worker.canArrange(t)?button(worker.nextStep(t).action,'next',t.id,'primary'):point(t)?button('去这单 · 看路线','single','','primary'):button(t.type==='远程指导'?'查看远程任务':'核实地址','detail',t.id,'primary')}</div></article>`;}
  function listRow(t){return `<div class="wm-list-row"><span class="wm-list-dot ${tone(t)}"></span><div><strong>${e(t.name)} <small>${e(worker.nextStep(t).label)}</small></strong><p>${e(brief(t))}</p><small>${t.type==='远程指导'?'远程服务 · 无需上门':!point(t)?'地址待核实 · 未标点':e(t.start||'暂无预约时间')}</small></div>${button(point(t)?'选中':'查看',point(t)?'select':'detail',t.id,'wm-link')}</div>`;}
  function browse(){const list=rows(),mapped=list.filter(point),remote=list.filter(t=>t.type==='远程指导'),missing=list.filter(t=>t.type!=='远程指导'&&!point(t));return `<div class="wm-heading"><div><small>${state.only?'当前工单':state.scope==='date'?state.date+' · 当日任务':state.scope==='today'?'9 月 13 日 · 今日预约':'跟随任务页的队列与筛选'}</small><h2>把下一站，看清楚</h2></div>${button(state.view==='list'?'地图':'列表','list','','wm-switch')}</div><div class="wm-segments">${button('当前筛选','scope','filtered',state.scope==='filtered'&&!state.only?'selected':'')}${button('今日预约','scope','today',state.scope==='today'?'selected':'')}${state.scope==='date'?button(state.date.slice(5)+' 路线 ↗','date-route','','wm-route-entry',state.date<'2026-09-13'?'disabled':''):button('今日路线 ↗','today','','wm-route-entry')}</div>${state.view==='list'?'':mapCanvas()}<section class="wm-sheet">${locationNotice()}<div class="wm-sheet-heading"><strong>${mapped.length} 单已标点</strong><span>${missing.length} 单待核址 · ${remote.length} 单远程</span></div>${state.group.length?`<div class="wm-group"><h3>同一位置 · ${state.group.length} 张工单</h3>${list.filter(t=>state.group.includes(t.id)).map(listRow).join('')}</div>`:state.view==='list'?`<form data-wmap-search class="w-search"><input name="query" type="search" aria-label="搜索地图任务" placeholder="姓名 / 地址 / 工单号" value="${e(state.query)}"><button type="submit">搜索</button></form>${list.map(listRow).join('')||'<p class="wm-empty">未找到匹配任务</p>'}`:taskCard(selected())}${state.view!=='list'&&!state.group.length&&missing.length?`<div class="wm-unlocated">${button(`${missing.length} 单地址待核实 · 查看 ›`,'list','','wm-link')}</div>`:''}<p class="wm-example">虚构任务与位置，仅供交互评审</p></section>`;}
  function routeView(){const stops=stopTasks(),missing=routeTasks().filter(t=>!point(t));return `<div class="wm-route-heading">${button('‹ 分布','browse','','wm-link')}<strong>${state.routeKind==='date'?state.date.slice(5)+' 多站路线':state.routeKind==='today'?'今日多站路线':'前往任务'}</strong><small>${state.routeKind!=='single'?'预约顺序 · 可调整':'单个目的地'}</small></div>${mapCanvas()}<section class="wm-sheet wm-route-sheet"><div class="wm-origin-row"><span class="wm-origin-symbol">起</span><strong>${originPoint()?e(originPoint().name):'从哪里出发？'}</strong><div>${button('我的位置','locate','',state.origin==='device'?'selected':'')}${button('服务中心','origin','station',state.origin==='station'?'selected':'',authorized().length?'':'disabled')}</div></div>${locationNotice()}<div class="wm-mode">${button('驾车','mode','driving',state.mode==='driving'?'selected':'','aria-pressed="'+(state.mode==='driving')+'"')}${button('步行','mode','walking',state.mode==='walking'?'selected':'','aria-pressed="'+(state.mode==='walking')+'"')}<span>按顺序连接各站</span></div><ol class="wm-stops">${stops.map((t,i)=>`<li><b>${i+1}</b><div><strong>${e(brief(t))}</strong><small>${e(t.name)} · ${e(t.date?t.start+'–'+t.end:t.flag)}</small></div>${button('↗','native',t.id,'',`aria-label="导航到${e(t.name)}"`)}${state.routeKind!=='single'?`${button('↑','up',t.id,'',`aria-label="上移${e(t.name)}" ${i===0?'disabled':''}`)}${button('×','remove',t.id,'',`aria-label="移除${e(t.name)}"`)}`:''}</li>`).join('')}</ol>${state.routeKind!=='single'?`<div class="wm-stops-note"><span>${missing.length?`${missing.length} 单未定位，暂未加入`:'调整顺序不会修改客户预约'}</span>${button('恢复预约顺序','restore','','wm-link')}</div>`:''}${!stops.length?'<div class="wm-alert">暂无可规划目的地，可返回分布核实地址。</div>':''}${state.error?`<div class="wm-alert" role="alert">${e(state.error)}</div>`:''}${state.route?`<div class="wm-route-summary"><div><strong>${state.route.minutes}<small> 分钟</small></strong><span>${(state.route.distance/1000).toFixed(1)} 公里 · ${stops.length} 站</span></div><small>示例行程<br>不含服务耗时</small></div>`:''}<div class="wm-actions">${button(state.route?'重新预览':state.error?'重试路线':'预览路线','calculate','',''+(state.route?'secondary':'primary'),stops.length?'':'disabled')}${button(state.routeKind!=='single'?'导航到第 1 站':'打开微信位置页','native',stops[0]?.id||'',state.route?'primary':'secondary',stops.length?'':'disabled')}</div><p class="wm-example">路线、里程和时长为模拟值 · 非实时路况</p></section>`;}
  function overlay(){if(!state.modal)return '';return `<div class="w-scrim"><section class="w-dialog" role="dialog" aria-modal="true" aria-label="微信位置页示意" tabindex="-1"><small class="wm-example">微信位置页 · 交接示意</small><h2>${e(state.modal.name)}</h2><p>${e(state.modal.address)}</p><div class="wm-alert">正式版打开此目的地的微信位置页，再由用户继续导航。多站路线按站打开；本原型不会启动外部地图。</div><div class="wm-actions">${button('取消','dismiss','','secondary')}${button('模拟返回小程序','native-return','','primary')}</div><p class="wm-example">返回后保留顺序；到达签到需单独操作。</p></section></div>`;}
  window.TOTO_WORKER_MAP={reset,open,openDate,act,simulate,rows,groups,point,snapshot:()=>JSON.parse(JSON.stringify(state)),render(){reconcile();return `<div class="wm-page">${state.view==='route'?routeView():browse()}</div>`;},overlay,
    back(){if(state.modal){state.modal=null;return true;}if(state.view==='route'||state.view==='list'||state.group.length){state.view='map';state.group=[];return true;}return false;},
    handle(el,{render,showScreen,showToast}){if(!el.dataset.wmap)return false;try{const result=act(el.dataset.wmap,el.dataset.value);if(typeof result==='string')showScreen(result);else{render();if(result?.toast)showToast(result.toast);}}catch(err){showToast(err.message);}return true;},
    submit(form,{render}){if(!form.hasAttribute('data-wmap-search'))return false;state.query=form.querySelector('[name="query"]').value.trim();state.group=[];invalidate();reconcile();render();return true;}
  };
})();
