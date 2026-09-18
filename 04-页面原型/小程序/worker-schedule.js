/* Task schedule review model. Dates are confirmed appointment dates, not completion dates. */
(function () {
  'use strict';
  const TODAY='2026-09-13',worker=window.TOTO_WORKER;
  const e=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const button=(label,action,value='',cls='',extra='')=>`<button type="button" data-wsched="${action}" data-value="${e(value)}" class="${cls}" ${extra}>${label}</button>`;
  const validDate=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s+'T00:00:00Z'))&&new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;
  const dateObject=s=>new Date(s+'T00:00:00Z');
  const iso=d=>d.toISOString().slice(0,10);
  const addDays=(s,n)=>{const d=dateObject(s);d.setUTCDate(d.getUTCDate()+n);return iso(d);};
  const dayLabel=s=>`${Number(s.slice(5,7))} 月 ${Number(s.slice(8))} 日`;
  const weekdays=['日','一','二','三','四','五','六'];
  let state;
  function reset(){state={view:'day',date:TODAY,month:TODAY.slice(0,7),expanded:false,showFinished:false};}
  reset();
  const tasks=()=>worker.visibleTasks();
  const slot=t=>validDate(t.date)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t.start)&&/^([01]\d|2[0-3]):[0-5]\d$/.test(t.end)&&t.end>t.start;
  function entries(date=state.date){return tasks().flatMap(t=>[
    ...(slot(t)&&t.date===date?[{task:t,date:t.date,start:t.start,end:t.end,kind:'current',key:t.id+':current'}]:[]),
    ...(t.appointmentHistory||[]).filter(h=>slot(h)&&h.date===date&&date<TODAY).map((h,i)=>({task:t,...h,kind:'history',key:t.id+':history:'+i}))
  ]).sort((a,b)=>a.start.localeCompare(b.start)||a.end.localeCompare(b.end)||a.key.localeCompare(b.key));}
  const unplanned=()=>tasks().filter(t=>worker.canArrange(t)&&!slot(t));
  const finished=r=>r.kind==='history'||['review','followup','closed','cancelled'].includes(r.task.queue);
  const followup=r=>r.kind==='current'&&r.date<TODAY&&['pending','lost'].includes(r.task.queue);
  function status(r){if(r.kind==='history')return {label:r.outcome||'原预约已调整',tone:'muted'};const t=r.task;
    if(worker.isServing(t))return {label:'正在服务',tone:'blue'};
    if(t.queue==='cancelled')return {label:'已取消',tone:'muted'};
    if(t.queue==='closed')return {label:'已关闭',tone:'green'};
    if(t.queue==='review')return {label:'已完工 · 审核中',tone:'green'};
    if(t.queue==='followup')return {label:'已完工 · '+worker.queueName(t),tone:'green'};
    if(t.flag==='审核退回')return {label:'退回待补',tone:'red'};
    if(followup(r))return {label:'预约已过 · 需跟进',tone:'amber'};
    return {label:t.flag,tone:'blue'};
  }
  function conflicts(list=entries()){const active=list.filter(r=>r.kind==='current'&&r.task.queue==='pending'&&r.task.flag==='已预约');const ids=new Set();
    active.forEach((a,i)=>active.slice(i+1).forEach(b=>{if(a.start<b.end&&b.start<a.end){ids.add(a.key);ids.add(b.key);}}));return ids;
  }
  function week(){const d=dateObject(state.date),offset=(d.getUTCDay()+6)%7;const start=addDays(state.date,-offset);return Array.from({length:7},(_,i)=>addDays(start,i));}
  const count=date=>entries(date).length;

  function monthPicker(){if(!state.expanded)return '';const first=state.month+'-01',offset=(dateObject(first).getUTCDay()+6)%7;const days=new Date(Date.UTC(Number(state.month.slice(0,4)),Number(state.month.slice(5)),0)).getUTCDate();return `<section class="ws-month" aria-label="选择日程日期"><div class="ws-month-top">${button('‹','month-step','-1','','aria-label="上个月"')}<strong>${Number(state.month.slice(0,4))} 年 ${Number(state.month.slice(5))} 月</strong>${button('›','month-step','1','','aria-label="下个月"')}</div><div class="ws-month-grid">${['一','二','三','四','五','六','日'].map(d=>`<small>${d}</small>`).join('')}${'<span></span>'.repeat(offset)}${Array.from({length:days},(_,i)=>{const date=state.month+'-'+String(i+1).padStart(2,'0'),n=count(date);return button(`<b>${i+1}</b><small>${n?n+'单':date===TODAY?'今天':' '}</small>`,'date',date,`${date===state.date?'selected':''} ${date===TODAY?'today':''}`,`aria-label="选择 ${date}${n?'，'+n+' 项安排':''}" aria-pressed="${date===state.date}"`);}).join('')}</div><label class="ws-date-jump">跳转日期<input type="date" data-wsched-date value="${state.date}" aria-label="跳转到指定日期"></label></section>`;}
  function taskRow(r,conflict=false){const t=r.task,s=status(r);return `<article class="ws-event ${s.tone}"><div class="ws-event-time"><b>${e(r.start)}</b><small>${e(r.end)}</small></div><div class="ws-event-card"><header><span class="ws-badge ${s.tone}">${e(s.label)}${conflict?' · 时间重叠':''}</span><small>${e(t.type)}</small></header><button class="ws-event-open" data-wsched="detail" data-value="${e(t.id)}" aria-label="查看${e(t.name)}的日程任务"><strong>${e(t.name)}</strong><span>${e(t.address.split(' · ').pop())}</span></button>${r.kind==='history'?`<p class="ws-history">原预约记录 · ${t.date?'现约 '+e(t.date+' '+t.start):'当前暂无确认预约'}</p>`:''}${t.flag==='审核退回'&&r.kind==='current'?`<p class="ws-history">${e(t.reason||'请按退回意见补充材料')}</p>`:''}<footer><small>${e(t.id)}</small>${button(r.kind==='history'?'查看当前工单':followup(r)?'跟进处理':'查看详情','detail',t.id,'ws-link')}</footer></div></article>`;}
  function unplannedView(){const list=unplanned();return `<div class="ws-section-title"><h3>待安排 <small>${list.length} 单</small></h3>${button('返回日程','day','','ws-link')}</div><p class="ws-caption">未确认的时间不占用日程，先联系再安排。</p>${list.map(t=>`<article class="ws-unplanned-card"><header><span class="ws-badge amber">${e(t.flag)}</span><small>${e(t.type)}</small></header><h3>${e(t.name)}</h3><p>${e(t.address)}</p><div>${button('查看详情','detail',t.id,'ws-link')}${button(t.type==='远程指导'?'联系并约指导时间':'联系并确认预约','appointment',t.id,'primary')}</div></article>`).join('')||'<div class="ws-empty"><h3>没有待安排任务</h3><p>新分配且未确认时间的任务会显示在这里。</p></div>'}`;}
  function render(){const list=entries(),overlap=conflicts(list),archived=state.date<TODAY?list.filter(finished):[],visible=state.date<TODAY?list.filter(r=>!finished(r)):list,needs=list.filter(followup).length;return `<section class="ws-page"><div class="ws-calendar-toolbar">${button(`${Number(state.date.slice(0,4))} 年 ${Number(state.date.slice(5,7))} 月 ⌄`,'month','','ws-month-toggle',`aria-expanded="${state.expanded}"`)}${button('回到今天','today','','ws-link')}<div>${button('‹','week','-1','','aria-label="上一周"')}${button('›','week','1','','aria-label="下一周"')}</div></div>${monthPicker()}<div class="ws-week" aria-label="一周日程">${week().map(date=>{const n=count(date);return button(`<span>周${weekdays[dateObject(date).getUTCDay()]}</span><b>${Number(date.slice(8))}</b><small>${n?n+'单':date===TODAY?'今天':'—'}</small>`,'date',date,date===state.date?'selected':'',`aria-label="${date}${date===TODAY?' 今天':''}，${n} 项安排" aria-pressed="${date===state.date}"`);}).join('')}</div>${button(`<span>待安排 <b>${unplanned().length}</b></span><small>未确认时间的任务</small><strong>›</strong>`,'unplanned','','ws-unplanned-entry')}<div aria-live="polite">${state.view==='unplanned'?unplannedView():`<div class="ws-section-title"><h3>${state.date===TODAY?'今天':dayLabel(state.date)}<small>周${weekdays[dateObject(state.date).getUTCDay()]}</small></h3><span>${list.length} 项安排</span></div>${needs?`<div class="ws-followup">${needs} 单仍需跟进 <small>按当前状态处理，不自动判定超时</small></div>`:''}${overlap.size?`<div class="ws-followup amber">${overlap.size} 单预约时间重叠，请先联系确认</div>`:''}<div class="ws-timeline">${visible.map(r=>taskRow(r,overlap.has(r.key))).join('')}</div>${archived.length?`<div class="ws-archive">${button(`${state.showFinished?'收起':'展开'}已处理与变更记录 · ${archived.length} 项`,'archive','','ws-link',`aria-expanded="${state.showFinished}"`)}${state.showFinished?archived.map(r=>taskRow(r)).join(''):'<p>包含已完工、已取消或原预约记录</p>'}</div>`:''}${!list.length?`<div class="ws-empty"><span>▦</span><h3>${state.date<TODAY?'当天暂无预约记录':'当天暂无确认预约'}</h3><p>${state.date<TODAY?'切换日期查看，或回到今天。':'可查看待安排任务，联系客户后确认时间。'}</p>${button('查看待安排','unplanned','','secondary')}</div>`:''}<div class="ws-day-actions">${button('查看当日地图','date-map','','primary',list.some(r=>r.kind==='current'&&r.task.type!=='远程指导')?'':'disabled')}</div>${state.date<TODAY?'<p class="ws-caption">按原预约日期回看；并非实际完工日期。</p>':''}`}</div></section>`;}
  function setDate(value){if(!validDate(value))throw Error('请选择有效日期');state.date=value;state.month=value.slice(0,7);state.expanded=false;state.showFinished=false;state.view='day';}
  function act(action,value){switch(action){
    case 'day':state.view='day';return 'w-schedule';
    case 'date':setDate(value);break;
    case 'today':setDate(TODAY);return 'w-schedule';
    case 'week':setDate(addDays(state.date,Number(value)<0?-7:7));break;
    case 'month':state.expanded=!state.expanded;state.month=state.date.slice(0,7);break;
    case 'month-step':{const d=dateObject(state.month+'-01');d.setUTCMonth(d.getUTCMonth()+(Number(value)<0?-1:1));state.month=iso(d).slice(0,7);break;}
    case 'unplanned':state.view='unplanned';state.expanded=false;break;
    case 'archive':state.showFinished=!state.showFinished;break;
    case 'detail':return worker.actAction('task',value);
    case 'appointment':worker.actAction('task',value);return 'w-appointment';
    case 'date-map':window.TOTO_WORKER_MAP.openDate(state.date);return 'w-map';
  }return null;}
  window.TOTO_WORKER_SCHEDULE={reset,entries,unplanned,conflicts,status,followup,validDate,week,setDate,render,act,snapshot:()=>({...state}),back(){if(state.expanded){state.expanded=false;return true;}if(state.view==='unplanned'){state.view='day';return true;}return false;},
    handle(el,{render,showScreen,showToast}){if(!el.dataset.wsched)return false;try{const target=act(el.dataset.wsched,el.dataset.value);if(target)showScreen(target);else render();}catch(err){showToast(err.message);}return true;}
  };
})();
