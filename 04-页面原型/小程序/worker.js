/* Service-worker prototype. All transitions below are local review scenarios, not API contracts. */
(function () {
  'use strict';
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = name => `<span data-icon="${name}" aria-hidden="true"></span>`;
  const go = (label, route, cls='secondary') => `<button type="button" class="${cls}" data-go="${route}">${label}</button>`;
  const act = (label, action, value='', cls='secondary') => `<button type="button" class="${cls}" data-worker="${action}" data-value="${e(value)}">${label}</button>`;
  const field = (label, name, value='', type='text', extra='') => `<label class="field"><span>${label}</span><input name="${name}" type="${type}" value="${e(value)}" ${extra}></label>`;
  const area = (label, name, value='', required=true) => `<label class="field"><span>${label}</span><textarea name="${name}" rows="3" ${required?'required':''}>${e(value)}</textarea></label>`;
  const select = (label,name,options,value='',required=true) => `<label class="field"><span>${label}</span><select name="${name}" ${required?'required':''}>${options.map(([v,t])=>`<option value="${v}" ${String(value)===v?'selected':''}>${t}</option>`).join('')}</select></label>`;
  const check = (label,name,value=false) => `<label class="choice"><input type="checkbox" name="${name}" ${value?'checked':''} required>${label}</label>`;
  const form = (kind, body, label='保存', id='') => `<form data-worker-form="${kind}" ${id?`id="${id}"`:''} class="stack">${body}${label?`<button class="primary" type="submit">${label}</button>`:''}</form>`;
  const card = (body, cls='') => `<section class="section-card ${cls}">${body}</section>`;
  const notice = (text,tone='blue') => `<div class="w-notice ${tone}">${text}</div>`;
  const empty = (text='暂无相关记录', detail='可以调整筛选条件后再试。') => `<div class="w-empty">${icon('service')}<h3>${text}</h3><p>${detail}</p></div>`;
  const row = (title, sub, route, ico='service') => `<button class="w-menu" data-go="${route}">${icon(ico)}<span><strong>${title}</strong><small>${sub}</small></span><b aria-hidden="true">›</b></button>`;
  const TODAY='2026-09-13';
  const queues = [['pending','待处理'],['returned','待补资料'],['review','审核中'],['history','历史任务']];
  const parts = [{id:'P001',name:'进水过滤组件',model:'DEMO-P001',price:68,stock:8},{id:'P002',name:'连接密封圈',model:'DEMO-P002',price:12,stock:12},{id:'P003',name:'连接软管',model:'DEMO-P003',price:35,stock:0}];
  const seedTasks = () => [
    {id:'WX202609130018',name:'陈女士',type:'维修',queue:'pending',flag:'已预约',date:TODAY,start:'14:00',end:'16:00',address:'徐汇区 · 云锦路示例花园 8 栋 602',product:'智能坐便器',model:'DEMO-T01',issue:'冲洗出水断续，偶尔无法启动。',note:'到达前 20 分钟电话联系。'},
    {id:'AZ202609110006',name:'赵先生',type:'安装',queue:'pending',flag:'审核退回',date:'2026-09-11',start:'16:00',end:'18:00',address:'徐汇区 · 龙华示例公寓 3 栋 201',product:'智能坐便器',model:'DEMO-T01',issue:'安装与试运行。',reason:'产品铭牌照片不清晰，请补充后重新提交。',versions:[{n:1,result:'完成安装及试运行',status:'审核退回',note:'产品铭牌照片不清晰'}]},
    {id:'AZ202609130021',name:'林女士',type:'安装',queue:'pending',flag:'已预约',date:TODAY,start:'17:00',end:'18:00',address:'徐汇区 · 漕溪示例苑 2 栋 301',product:'智能坐便器',model:'DEMO-T01',issue:'新产品安装，核对用水及电源条件。'},
    {id:'WX202609140031',name:'刘女士',type:'维修',queue:'pending',flag:'已预约',date:'2026-09-14',start:'09:00',end:'11:00',address:'徐汇区 · 示例江畔公寓 2 栋 501',product:'智能坐便器',model:'DEMO-T01',issue:'客户反馈出水异常，预约检查。'},
    {id:'AZ202609140032',name:'吴先生',type:'安装',queue:'pending',flag:'已预约',date:'2026-09-14',start:'10:00',end:'12:00',address:'徐汇区 · 示例汇景苑 6 栋 202',product:'智能坐便器',model:'DEMO-T01',issue:'安装与试运行，需联系核对时间。'},
    {id:'ZD202609130008',name:'许先生',type:'远程指导',queue:'pending',flag:'待联系',date:'',start:'',end:'',address:'徐汇区 · 远程服务',product:'智能坐便器',model:'DEMO-T01',issue:'需要了解遥控器设置。'},
    {id:'WX202609120007',name:'周女士',type:'维修',queue:'pending',flag:'缺件',date:'',start:'',end:'',address:'徐汇区 · 田林示例小区',product:'智能坐便器',model:'DEMO-T01',issue:'待更换进水过滤组件。',reason:'待领料，到件后重新预约。'},
    {id:'WX202609120009',name:'黄先生',type:'维修',queue:'review',flag:'等待审核',date:'2026-09-12',start:'10:00',end:'12:00',address:'徐汇区 · 桂林示例新村',product:'智能坐便器',model:'DEMO-T01',issue:'维修后试运行正常。',versions:[{n:1,result:'维修后试运行正常',status:'待审核',note:'已提交客户确认记录'}]},
    {id:'AZ202609100002',name:'孙女士',type:'安装',queue:'followup',flag:'审核通过',date:'2026-09-10',start:'09:00',end:'11:00',address:'徐汇区 · 示例华庭',product:'智能坐便器',model:'DEMO-T01',issue:'安装已完成。',versions:[{n:1,result:'安装完成',status:'审核通过',note:'审核通过，后续由服务中心跟进'}]},
    {id:'WX202609110019',name:'郑先生',type:'维修',queue:'lost',flag:'断联',date:'',start:'',end:'',address:'徐汇区 · 宜山示例社区',product:'智能坐便器',model:'DEMO-T01',issue:'无法启动。',reason:'两次电话未接听，待再次联系。'},
    {id:'WX202609090003',name:'王女士',type:'维修',queue:'cancelled',flag:'已取消',date:'',start:'',end:'',address:'徐汇区 · 示例雅苑',product:'智能坐便器',model:'DEMO-T01',issue:'功能异常。',reason:'客户表示产品已恢复正常。',appointmentHistory:[{date:'2026-09-09',start:'13:00',end:'15:00',outcome:'已取消'}]}
  ].map(t=>({assignedTo:'worker-demo',published:true,...t,phone:'138 **** 2608',backup:'',supplement:'',note:'',...t,service:{},completion:{},media:{},signed:false,history:[],appointmentHistory:t.appointmentHistory||[],versions:t.versions||[]}));
  let state;
  function reset(company='上海示例服务企业') {
    state={company,loggedIn:true,tasks:company==='上海示例服务企业'?seedTasks():[],taskId:'WX202609130018',queue:'pending',search:'',sort:'priority',filter:'all',step:0,listPosition:null,
      drafts:{},inventory:company==='上海示例服务企业'?{P001:2,P002:1,P003:0}:{P001:0,P002:0,P003:0},basket:{},partId:'P001',partSearch:'',linkTask:null,
      records:[],recordId:null,recordType:'领料',recordFilter:'全部',docsQuery:'',docsType:'全部',docId:0,warrantyQuery:'',feedback:[],feedbackMedia:false,nextUploadFail:false,overlay:null};
    window.TOTO_WORKER_MAP?.reset();
    window.TOTO_WORKER_SCHEDULE?.reset();
  }
  reset();
  // Local visibility fixture only; production must use the server's authorized task scope and actions.
  const visibleTasks = () => state.loggedIn ? state.tasks.filter(t=>t.assignedTo==='worker-demo'&&t.published===true&&['pending','lost','review','followup','closed','cancelled'].includes(t.queue)) : [];
  const task = () => visibleTasks().find(t=>t.id===state.taskId);
  const canArrange = t => !!t&&['pending','lost'].includes(t.queue)&&t.flag!=='审核退回';
  const inQueue = (t,key) => key==='all'||(key==='returned'?t.queue==='pending'&&t.flag==='审核退回':key==='pending'?['pending','lost'].includes(t.queue)&&t.flag!=='审核退回':key==='history'?['closed','cancelled'].includes(t.queue)||t.queue==='followup':t.queue===key);
  const availableQueues = () => queues;
  const isServing = t => !!t&&t.queue==='pending'&&t.flag!=='审核退回'&&t.serving===true;
  const activeTasks = () => visibleTasks().filter(isServing);
  function startService(t){t.serving=true;t.resumePage=t.resumePage||'w-service';}
  function pauseService(t){t.serving=false;t.signed=false;t.resumePage='w-service';t.resumeStep=0;}
  function resumeService(t){state.taskId=t.id;state.step=t.resumeStep||0;return t.resumePage==='w-completion'?'w-completion':'w-service';}

  const tone = t => t.flag==='审核退回'?'red':['缺件','断联','改期'].includes(t.flag)?'amber':['closed','followup'].includes(t.queue)?'green':'blue';
  const queueName = t => t.flag==='审核退回'?'待补资料':({pending:'待处理',lost:'待处理',review:'审核中',followup:'待回访',closed:'已关闭',cancelled:'已取消'}[t.queue]||'');
  const tag = (text,color='blue') => `<span class="w-tag ${color}">${e(text)}</span>`;
  const taskKey = page => `${state.company}:${task()?.id||'none'}:${page}:${page==='w-completion'?state.step:''}`;
  const draft = (page,base={}) => ({...base,...state.drafts[taskKey(page)]});
  const history = t => `<div class="w-timeline">${[...t.history].reverse().map(h=>`<div><strong>${e(h.title)}</strong><p>${e(h.note)}</p><small>${e(h.time)}</small></div>`).join('') || '<div><strong>服务中心已分配任务</strong><p>预约与后续处理记录将在这里保留。</p><small>示例记录</small></div>'}</div>`;
  const log = (t,title,note) => t.history.push({title,note,time:'09-13 · 本次演示'});
  function filteredTasks(queue=state.queue) {
    let list=visibleTasks().filter(t=>inQueue(t,queue) && [t.id,t.name,t.address].some(v=>v.toLowerCase().includes(state.search.toLowerCase())));
    if(state.filter==='returned')list=list.filter(t=>t.flag==='审核退回');
    if(state.filter==='today')list=list.filter(t=>t.date===TODAY&&t.flag==='已预约');
    if(state.filter==='parts')list=list.filter(t=>t.flag==='缺件');
    if(['cancelled','closed'].includes(state.filter))list=list.filter(t=>t.queue===state.filter);
    if(state.filter==='processing')list=list.filter(t=>t.queue==='followup');
    return list.sort((a,b)=>state.sort==='time'?(a.date+a.start||'9999').localeCompare(b.date+b.start||'9999'):(a.flag==='审核退回'?-1:0)-(b.flag==='审核退回'?-1:0)||(a.date+a.start||'9999').localeCompare(b.date+b.start||'9999'));
  }
  const taskButton = (t,label='查看任务',cls='w-text-button') => act(label,'task',t.id,cls);
  function nextStep(t) {
    if(isServing(t))return {label:'正在服务',hint:t.resumePage==='w-completion'?'现场处理已记录，继续补齐完工资料。':'服务已开始，继续记录处理过程与结果。',action:t.resumePage==='w-completion'?'继续填写完工资料':'继续服务',route:t.resumePage==='w-completion'?'w-completion':'w-service',word:'服务中'};
    if(t.queue==='review')return {label:'审核中',hint:'完工资料已提交，等待服务中心审核。',action:'查看审核进度',route:'w-review',word:'待审'};
    if(t.queue==='followup')return {label:'审核通过',hint:'本次服务已审核通过，无需再次提交。后续回访由服务中心跟进。',action:'查看进度',route:'w-review',word:'已通过'};
    if(t.queue==='cancelled')return {label:'已取消',hint:t.restoreRequested?'恢复申请已提交，等待服务中心确认。':t.reason||'任务已取消，可查看记录。',action:'查看记录',route:'w-detail',word:'已取消'};
    if(t.queue==='closed')return {label:'已关闭',hint:'本任务已办结，可查看服务与审核记录。',action:'查看记录',route:'w-detail',word:'已关闭'};
    if(t.flag==='审核退回')return {label:'退回待补',hint:t.reason||'请按退回意见补充材料。',action:'补充资料',route:'w-returned',word:'待补'};
    if(t.flag==='缺件')return {label:'等待配件',hint:'查看配件进度，到件后联系客户重新预约。',action:'跟进配件',route:'w-exception',word:'待件'};
    if(t.queue==='lost')return {label:'待再次联系',hint:t.reason||'联系客户，确认是否继续安排服务。',action:'联系客户',route:'w-appointment',word:'联系'};
    return {label:t.flag,hint:t.type==='远程指导'?'无需上门，联系客户后记录指导结果。':t.flag==='已预约'?`${t.date} 已确认，按预约时间上门。`:'联系客户，确认服务安排。',action:'处理任务',route:'w-detail',word:t.flag==='已预约'?t.start:'联系'};
  }
  function taskCard(t) {
    const next=nextStep(t);
    return `<article class="w-ticket ${tone(t)}"><div class="w-ticket-top">${tag(next.label,tone(t))}<small>${e(t.type)} · ${queueName(t)}</small></div><div class="w-ticket-main"><div class="w-time"><strong>${e(next.word)}</strong><small>${t.flag==='已预约'&&canArrange(t)?`至 ${e(t.end)}`:'当前阶段'}</small></div><div class="w-ticket-info"><h3>${e(t.name)}<span>${e(t.product)}</span></h3><p>${e(t.address)}</p></div></div><div class="w-ticket-hint">${e(next.hint)}</div><div class="w-ticket-bottom">${taskButton(t,'任务详情')}${act(next.action,'task-next',t.id,'w-text-button')}</div></article>`;
  }
  function summary(t=task()) {return t?`<div class="w-context"><div>${icon(t.type==='安装'?'install':t.type==='远程指导'?'guidance':'repair')}<strong>${e(t.name)} · ${e(t.type)}</strong>${tag(queueName(t),tone(t))}</div><small>${e(t.id)} · ${e(t.model)}</small></div>`:empty('当前没有任务','请返回任务页。');}
  function servingCard(t) {
    const completing=t.resumePage==='w-completion';
    return `<article class="w-serving" aria-label="正在服务 · ${e(t.name)}"><div class="w-serving-head"><span><i aria-hidden="true"></i>正在服务</span><small>${e(t.type)} · ${e(t.id.slice(-6))}</small></div><h3>${e(t.name)}<span>${e(t.product)}</span></h3><p>${e(t.address)}</p><div class="w-serving-progress"><span>${completing?'完工资料 · '+completionSteps[t.resumeStep||0]:'已开始 · 记录服务结果'}</span><small>${completing?(t.resumeStep||0)+1+' / 4':'当前优先'}</small></div><div class="w-serving-actions">${act(completing?'继续填写完工资料':'继续服务','resume-service',t.id,'primary')}${taskButton(t,'详情')}</div></article>`;
  }
  function renderTasks() {
    if(!availableQueues().some(([key])=>key===state.queue)){state.queue='history';state.filter='all';}
    const pending=visibleTasks().filter(t=>inQueue(t,'pending')),returned=visibleTasks().filter(t=>inQueue(t,'returned')).length;
    const active=activeTasks(),matched=filteredTasks(),promoted=matched.filter(isServing).length,list=matched.filter(t=>!isServing(t));
    const metrics=`<div class="w-focus-metrics"><button type="button" class="secondary" data-wsched="today" aria-label="查看今日预约日程"><strong>${visibleTasks().filter(t=>t.date===TODAY&&t.flag==='已预约'&&t.queue==='pending').length}</strong><span>今日预约</span></button>${act(`<strong>${returned}</strong><span>待补资料</span>`,'filter','returned')}${act(`<strong>${pending.filter(t=>t.flag==='缺件').length}</strong><span>等配件</span>`,'filter','parts')}</div>`;
    return `<div class="w-heading w-task-heading"><div><small>9 月 13 日 · 星期日</small><h2>今天，安排清楚</h2></div><div class="w-task-tools" aria-label="任务快捷入口"><button type="button" data-wsched="day"><img src="assets/icons/calendar.svg" alt="">日程</button><button type="button" data-wmap="open"><img src="assets/icons/map.svg" alt="">地图</button></div></div>
      ${active.length?`<section class="w-serving-area" aria-label="当前服务任务">${active.length>1?`<p class="w-serving-count">${active.length} 单正在服务，请核对并继续处理</p>`:''}${active.map(servingCard).join('')}</section><div class="w-focus w-focus-compact">${metrics}</div>`:`<div class="w-focus"><div class="w-focus-summary"><span>待处理任务</span><strong>${pending.length}<small> 单</small></strong><span class="w-focus-caption">按预约出发，及时补齐资料</span></div>${metrics}</div>`}
      <form data-worker-form="task-search" class="w-search"><input name="search" type="search" aria-label="查询任务" placeholder="任务号 / 联系人 / 地址" value="${e(state.search)}"><button type="submit">查询</button></form>
      <div class="w-queue w-task-queues" aria-label="任务队列">${availableQueues().map(([k,v])=>act(`${v}<small>${visibleTasks().filter(t=>inQueue(t,k)).length}</small>`,'queue',k,state.queue===k?'selected':'')).join('')}</div>
      ${state.queue==='history'?`<div class="w-chip-row" aria-label="历史任务筛选">${[['all','全部记录'],['processing','后续跟进'],['closed','已关闭'],['cancelled','已取消']].map(([key,label])=>act(label,'history-filter',key,state.filter===key?'selected':'')).join('')}</div><p class="w-history-caption">服务后的办结进度与历史记录可在这里查看。</p>`:''}
      ${state.queue==='returned'?'<p class="w-history-caption">按审核意见补齐资料即可，无需重新走现场服务。</p>':''}
      <div class="w-list-heading"><span>${state.filter==='all'?'全部':{today:'今日预约',returned:'待补资料',parts:'等配件',processing:'后续跟进',closed:'已关闭',cancelled:'已取消'}[state.filter]} · ${matched.length} 单 ${state.filter!=='all'||state.search?act('清除筛选','clear-filter','','w-text-button'):''}</span><label>排序 <select data-worker-sort aria-label="任务排序"><option value="priority" ${state.sort==='priority'?'selected':''}>优先处理</option><option value="time" ${state.sort==='time'?'selected':''}>预约时间</option></select></label></div>
      ${promoted?`<p class="w-promoted-note">其中 ${promoted} 单正在服务，已在上方展示</p>`:''}
      ${list.map(taskCard).join('')||(!promoted?empty('这个队列暂时没有任务','试试其他状态或清除查询条件。'):'')}`;
  }
  function detail() {
    const t=task();if(!t)return summary();
    return `<div class="w-status ${tone(t)}"><small>${queueName(t)}</small><h2>${e(nextStep(t).label)}</h2><p>${e(nextStep(t).hint)}</p></div>${summary(t)}
      ${card(`<div class="w-section-head"><h3>${canArrange(t)?'服务安排':'服务记录'}</h3>${canArrange(t)?go('联系 / 改约','w-appointment','w-text-button'):''}</div><div class="w-appointment-time">${t.date?e(`${t.date} · ${t.start}–${t.end}`):'尚未确认时间'}</div><p>${e(t.address)}</p><small class="muted">${e(t.supplement)}</small>${canArrange(t)?`<div class="w-contact">${act('拨打客户电话','phone',t.id)}${t.type!=='远程指导'?act('去这单','location',t.id):''}${go('编辑补充信息','w-edit','w-text-button')}</div>`:''}`)}
      ${card(`<div class="w-product">${icon(t.type==='安装'?'install':'repair')}<div><h3>${e(t.product)}</h3><small>${e(t.model)} · ${e(t.type)} × 1</small></div></div><p>${e(t.issue)}</p><p class="muted">${e(t.note||'暂无额外备注')}</p><div class="w-contact">${act('查本产品资料','task-docs','','w-text-button')}${act('本单配件记录','task-records','','w-text-button')}</div>`)}
      ${t.queue==='review'||t.versions.length?go('查看完工材料与审核记录','w-review'):''}
      ${card(`<h3>沟通与处理记录</h3>${history(t)}`)}`;
  }
  function detailFooter() {
    const t=task();if(!t)return go('返回任务','w-tasks','primary');
    if(isServing(t))return go('异常 / 改期','w-exception')+act(nextStep(t).action,'resume-service',t.id,'primary');
    if(t.queue==='cancelled')return go(t.restoreRequested?'查看恢复申请':'申请恢复任务','w-exception','primary');
    if(t.queue==='followup')return go('查看处理进度','w-review','primary');
    if(['review','closed'].includes(t.queue))return go('查看处理进度','w-review','primary');
    if(t.flag==='审核退回')return go('补充退回资料','w-returned','primary');
    if(t.queue==='lost'||['缺件','改期','待联系'].includes(t.flag))return go('异常跟进','w-exception')+go('联系并确认预约','w-appointment','primary');
    return go('异常 / 改期','w-exception')+go(t.flag==='审核退回'?'补充退回资料':t.type==='远程指导'?'开始远程指导':'开始现场服务',t.flag==='审核退回'?'w-returned':'w-service','primary');
  }
  function appointment() {const t=task();if(!t)return summary();const d=draft('w-appointment',{result:'confirmed',date:t.date||TODAY,start:t.start||'14:00',end:t.end||'16:00'});return summary()+card(form('appointment',select('联系结果','result',[['confirmed','客户已确认时间'],['later','客户稍后回复'],['lost','未接听 / 无法联系']],d.result)+field('预约日期（仅确认后生效）','date',d.date,'date')+`<div class="row">${field('开始时间','start',d.start,'time')}${field('结束时间','end',d.end,'time')}</div>`+area('联系记录','note',d.note||''),'保存联系记录'));}
  function edit() {const t=task();if(!t)return summary();const d=draft('w-edit',t);return summary()+card(form('edit',field('备用电话','backup',d.backup,'tel','pattern="[0-9+ -]{7,20}"')+area('地址补充','supplement',d.supplement,false)+area('任务备注','note',d.note,false),'保存补充信息'))+notice('主电话、受理来源及行政区在本页只读；需更正时联系服务中心。');}
  function exception() {const t=task();if(!t)return summary();const d=draft('w-exception');if(t.queue==='cancelled')return summary()+notice(e(t.reason),'amber')+(t.restoreRequested?card('<h3>恢复申请待处理</h3><p>服务中心确认后再安排任务，当前仍为已取消。</p>'):card(form('restore',area('申请恢复原因','reason',d.reason||'')+check('已核对客户继续服务的意愿','confirmed'),'提交恢复申请')));return summary()+card(form('exception',select('需要跟进的情况','flag',[['','请选择'],['改期','改期 / 再次上门'],['断联','无法联系'],['缺件','缺少配件'],['已取消','取消服务']],d.flag)+area('原因与下一步','reason',d.reason||''),'保存跟进记录'))+(t.flag==='缺件'?card(`<h3>等配件期间</h3><p>领料确认后，重新联系客户安排上门。</p>${act('为本单申请配件','task-parts','','primary')}${act('查看本单配件进度','task-records','','w-text-button')}`):'');}
  function service() {
    const t=task();if(!t)return summary();if(t.queue!=='pending'||t.flag==='审核退回')return notice('当前任务请先处理预约、审核或退回要求。')+go('返回任务详情','w-detail','primary');
    const d=draft('w-service',t.service),remote=t.type==='远程指导';
    return summary()+`<div class="w-section-head"><h2>${remote?'远程指导记录':'现场服务'}</h2>${act('暂存草稿','save','','w-text-button')}</div>`+
      (remote?card(isServing(t)?'<h3>远程指导进行中</h3><p>记录沟通方式和处理结果。</p>':`<h3>联系客户后开始</h3><p>远程指导无需上门签到。</p>${act('开始远程指导','start-remote','','primary')}`):card(`<div class="w-section-head"><h3>01 到达签到</h3>${tag(t.signed?'已记录':'待签到',t.signed?'green':'amber')}</div>${t.signed?`<p>${e(t.arrival||'示例位置签到 · 09-13 14:02')}</p>`:`<div class="w-contact">${act('定位签到','sign')}${act('无法定位','sign-failed','','w-text-button')}</div>`}`))+
      form('service',card(`<h3>${remote?'01':'02'} 检测与处理</h3>${area(remote?'沟通方式与问题':'检测结果','diagnosis',d.diagnosis||'')}${area('处理过程与结果','result',d.result||'')}${select('配件耗用','usage',[['','请选择'],['none','本次未使用配件'],['parts','记录个人库存中的实际用量']],d.usage)}${field('进水过滤组件用量（选耗用时填写）','quantity',d.quantity||1,'number',`min="1" step="1"`)}<p class="muted">个人可用 ${state.inventory.P001} 件；只记录本次实际使用，不把领料申请当成耗用。</p>${act('缺件，申请领料','task-parts','','w-text-button')}`)+card(`<h3>随手查资料</h3>${act('查看本产品技术资料','task-docs','','w-text-button')}`),'继续填写完工资料');
  }
  const completionSteps=['现场照片','产品信息','单据信息','确认提交'];
  function mediaTile(key,label,t=task()) {const status=t?.media[key]||'none';return `<div class="w-evidence ${status}">${icon('camera')}<div><strong>${label}</strong><small>${{none:'待添加',failed:'上传失败 · 请重试',ready:'1 份示例材料已就绪'}[status]}</small></div>${act(status==='ready'?'移除':status==='failed'?'重试':'添加','media',key,'w-text-button')}</div>`;}
  function completion() {
    const t=task();if(!t)return summary();if(t.queue!=='pending')return notice('资料已经提交，请查看本任务的审核进度。')+go('查看审核进度','w-review','primary');
    const d=draft('w-completion',t.completion);
    const contents=[
      `<h3>照片清晰，审核少返工</h3><p class="muted">${t.type==='远程指导'?'远程指导仅补充本次沟通记录；不强制现场照片。':'核对服务现场和产品铭牌，确保与本单一致。'}</p>${t.type==='远程指导'?mediaTile('remote','沟通记录'):mediaTile('site','服务现场')+mediaTile('label','产品铭牌')}${check('已核对材料清晰、与本单相关','evidenceChecked',d.evidenceChecked)}`,
      `<h3>核验本次服务产品</h3>${field('产品型号（只读）','model',t.model,'text','readonly')}${act('扫描产品码','scan','','w-text-button')}${field('制造编号 / 序列编号','serial',d.serial||'','text','required')}${field('RFID（没有时填写说明）','rfid',d.rfid||'')}${area('无 RFID / 信息差异说明','noRfidReason',d.noRfidReason||'',false)}${field('购买渠道','channel',d.channel||'')}${field('经销店名','store',d.store||'')}${field('购买日期','purchaseDate',d.purchaseDate||'','date',`max="${TODAY}"`)}${field('工厂代码','factory',d.factory||'')}${field('用水情况','water',d.water||'')}`,
      `<h3>服务单与客户确认</h3>${field('服务单据编号','documentNo',d.documentNo||'')}${area('服务结果','result',d.result||t.service.result||'')}${select('客户确认情况','confirmation',[['','请选择'],['confirmed','客户已确认服务结果'],['exception','无法确认，提交说明供审核']],d.confirmation)}${area('确认记录 / 例外原因','confirmationNote',d.confirmationNote||'')}${mediaTile('confirmation','客户确认附件（按需）')}`,
      `<h3>最后核对一次</h3><dl class="w-kv"><div><dt>服务对象</dt><dd>${e(t.name)} · ${e(t.type)}</dd></div><div><dt>产品信息</dt><dd>${e(t.completion.serial||'尚未填写')}</dd></div><div><dt>配件耗用</dt><dd>${t.service.usage==='parts'?`进水过滤组件 × ${e(t.service.quantity)}`:'未使用配件'}</dd></div><div><dt>客户确认</dt><dd>${t.completion.confirmation==='confirmed'?'已确认':t.completion.confirmation==='exception'?'待人工复核':'待填写'}</dd></div></dl>${notice('本原型不计算费用、不收款。提交后等待审核，通过后无需再次提交。','amber')}${check('已核对服务结果、材料和配件记录','submitChecked',d.submitChecked)}`
    ];
    return summary()+`<ol class="w-stepper">${completionSteps.map((v,i)=>`<li class="${i===state.step?'active':i<state.step?'done':''}"><b>${i+1}</b><span>${v}</span></li>`).join('')}</ol>`+card(form('completion',contents[state.step],'','w-completion-form'));
  }
  function completionFooter(){return (state.step?act('上一步','prev-step'):act('暂存','save'))+`<button class="primary" type="submit" form="w-completion-form">${state.step===3?'提交完工资料':'下一步'}</button>`;}
  function review(){const t=task();if(!t)return summary();return `<div class="w-status ${tone(t)}"><small>服务处理进度</small><h2>${e(queueName(t))}</h2><p>${e(nextStep(t).hint)}</p></div>${summary()}${card(`<h3>提交版本</h3>${t.versions.length?t.versions.map(v=>`<details class="w-version"><summary><strong>第 ${v.n} 次提交</strong>${tag('提交时 · '+v.status,v.status==='审核退回'?'red':'blue')}</summary><p>${e(v.result)}</p><p>${e(v.note||'')}</p><dl class="w-kv"><div><dt>产品编号</dt><dd>${e(v.serial||'历史示例未展开')}</dd></div><div><dt>材料</dt><dd>${e(v.evidence||'历史示例材料')}</dd></div></dl></details>`).join(''):empty('尚未提交完工资料','返回现场服务，完成材料采集。')}`)}${card(`<h3>处理时间线</h3>${history(t)}`)}${t.flag==='审核退回'?go('补充退回资料','w-returned','primary'):''}`;}
  function returned(){const t=task();if(!t)return summary();if(t.flag!=='审核退回')return review();const d=draft('w-returned');return `<div class="w-status red"><small>审核退回 · 需要处理</small><h2>补齐这项就能重提</h2><p>${e(t.reason)}</p></div>${summary()}${card(form('resubmit',mediaTile('replacement','补充清晰的产品铭牌')+area('补充说明','note',d.note||'')+check('已按退回意见核对本次补充材料','confirmed',d.confirmed),'重新提交审核'))}${go('查看原提交与审核记录','w-review','w-text-button')}`;}
  function renderParts(){if(state.company!=='上海示例服务企业')return `<div class="w-heading"><h2>配件</h2></div>`+notice(e(state.company))+empty('暂无授权库存','切换企业后，库存与配件记录按当前企业展示。');const visible=parts.filter(p=>(p.name+p.model).toLowerCase().includes(state.partSearch.toLowerCase()));return `<div class="w-heading"><div><small>${e(state.company==='上海示例服务企业'?'徐汇服务中心':state.company)}</small><h2>配件，心中有数</h2></div></div><div class="w-stock-summary"><div><small>个人可用库存</small><strong>${Object.values(state.inventory).reduce((a,b)=>a+b,0)}<span> 件</span></strong></div>${go('领配件','w-requisition','primary')}</div><div class="w-shortcuts">${act(`${icon('plus')}<strong>领料单</strong><small>申请与收件</small>`,'records','领料')}${act(`${icon('repair')}<strong>退料单</strong><small>退料与进度</small>`,'records','退料')}${act(`${icon('service')}<strong>调拨单</strong><small>调拨与接收</small>`,'records','调拨')}</div><form class="w-search" data-worker-form="part-search"><input name="search" aria-label="查找我的配件" placeholder="配件名称 / 型号" value="${e(state.partSearch)}"><button>查询</button></form><div class="w-list-heading"><span>我的库存</span><small>与库房库存分开显示</small></div>${visible.map(p=>`<button class="w-part-row" data-worker="part" data-value="${p.id}"><span class="w-part-icon">${icon('repair')}</span><span><strong>${p.name}</strong><small>${p.model}</small><small>参考单价 ¥${p.price.toFixed(2)} · 示例</small></span><span class="w-stock-count"><b>${state.inventory[p.id]}</b><small>可用</small></span></button>`).join('')||empty()}`;}
  const related = () => visibleTasks().find(t=>t.id===state.linkTask);
  function taskLink(){return related()?notice(`关联 ${e(related().name)} · ${e(related().id)} ${act('返回工单','linked-task','','w-text-button')}`):'';}
  function partDetail(){const p=parts.find(p=>p.id===state.partId);return card(`<div class="w-part-hero">${icon('repair')}<h2>${p.name}</h2><p>${p.model}</p><strong>${state.inventory[p.id]}<small> 件可用</small></strong></div><dl class="w-kv"><div><dt>库存归属</dt><dd>丁师傅 · 个人库存</dd></div><div><dt>参考单价</dt><dd>¥${p.price.toFixed(2)}（示例）</dd></div><div><dt>工厂 / 颜色</dt><dd>示例工厂 / 标准色</dd></div><div><dt>适用范围</dt><dd>以正式配件资料为准</dd></div></dl>`)+go('申请退料','w-return','primary')+act('查看领退记录','records','全部','secondary');}
  function requisition(){const d=draft('w-requisition');return taskLink()+notice('先选库房配件，再核对数量。申请提交后不立即增加个人库存。')+`<div class="w-section-head"><h3>徐汇服务中心库房</h3>${tag('单一来源')}</div>${parts.map(p=>card(`<div class="w-section-head"><div><h3>${p.name}</h3><small>${p.model} · 参考 ¥${p.price}</small></div>${tag(`可领 ${p.stock}`,p.stock?'blue':'amber')}</div><div class="w-quantity"><button type="button" data-worker="basket-minus" data-value="${p.id}" aria-label="减少 ${p.name}" ${!state.basket[p.id]?'disabled':''}>−</button><b>${state.basket[p.id]||0}</b><button type="button" data-worker="basket-plus" data-value="${p.id}" aria-label="增加 ${p.name}" ${!p.stock||state.basket[p.id]>=p.stock?'disabled':''}>+</button></div>`)).join('')}<div class="w-basket"><strong>待提交 · ${Object.values(state.basket).reduce((a,b)=>a+b,0)} 件</strong><small>来源：徐汇服务中心库房</small></div>${form('requisition',area('领料说明','note',d.note||'',false),'提交领料申请')}`;}
  function returnPart(){const p=parts.find(p=>p.id===state.partId),d=draft('w-return');return card(`<h3>${p.name}</h3><p class="muted">个人可用 ${state.inventory[p.id]} 件</p>`)+card(form('return',field('退料数量','quantity',d.quantity||1,'number',`min="1" max="${state.inventory[p.id]}" step="1" required`)+area('退料原因','note',d.note||''),'提交退料申请'))+notice('提交仅生成申请；实物确认前不回补库房库存。');}
  const record = () => state.records.find(r=>r.id===state.recordId);
  function records(){let rows=state.records.filter(r=>(state.recordType==='全部'||r.type===state.recordType)&&(state.recordFilter==='全部'||r.status===state.recordFilter)&&(!state.linkTask||r.taskId===state.linkTask));const filters=['全部','处理中','待收件','已完成','已拒绝','已撤销'];return taskLink()+`<div class="w-queue">${['全部','领料','退料','调拨'].map(k=>act(k,'record-type',k,state.recordType===k?'selected':'')).join('')}</div><div class="w-chip-row">${filters.map(k=>act(k,'record-filter',k,state.recordFilter===k?'selected':'')).join('')}</div>${rows.map(r=>`<button class="w-record" data-worker="record" data-value="${r.id}"><div>${tag(r.type)}${tag(r.status,r.status==='已拒绝'?'red':r.status==='已完成'?'green':'amber')}</div><h3>${r.items.map(i=>`${parts.find(p=>p.id===i.id).name} × ${i.quantity}`).join('、')}</h3><p>${r.source}</p><small>${r.id} · ${r.taskId||'日常备料'}</small><span class="w-text-button">查看进度 ›</span></button>`).join('')||empty('暂无'+(state.recordType==='全部'?'配件':state.recordType)+'记录','新申请与处理结果会显示在这里。')}${go('申请领料','w-requisition','primary')}`;}
  function recordDetail(){const r=record();if(!r)return empty('请先选择一张配件单')+go('查看配件记录','w-records','primary');return `<div class="w-status ${r.status==='已完成'?'green':r.status==='已拒绝'?'red':'amber'}"><small>${r.type}单</small><h2>${r.status}</h2><p>${e(r.reason||'提交申请与库存确认是不同步骤。')}</p></div>${card(`<h3>${r.items.map(i=>`${parts.find(p=>p.id===i.id).name} × ${i.quantity}`).join('、')}</h3><p>${e(r.source)}</p><small>${r.id}</small><p>${e(r.note)}</p>`)}${r.taskId?act('返回关联任务','linked-task',r.taskId,'primary'):''}${card(`<h3>处理进度</h3><div class="w-timeline">${r.history.map(h=>`<div><strong>${e(h)}</strong></div>`).join('')}</div>`)}${r.status==='待收件'?act('确认已收到实物','receive',r.id,'primary'):''}${r.status==='处理中'&&r.type==='领料'?act('撤销领料申请','cancel-record',r.id):''}${r.status==='已拒绝'?go('重新申请','w-requisition','primary'):''}${r.status==='已完成'&&r.taskId&&canArrange(visibleTasks().find(t=>t.id===r.taskId))?act('联系客户，安排后续服务','reappoint',r.taskId,'primary'):''}`;}
  const docs=[{title:'智能坐便器 · 常见问题与处理记录',type:'维修手册',model:'DEMO-T01',version:'V2.1'},{title:'智能坐便器 · 安装核对资料',type:'安装手册',model:'DEMO-T01',version:'V1.3'},{title:'遥控器功能介绍',type:'视频资料',model:'DEMO-T01',version:'V1.0'}];
  function technical(){const list=docs.map((d,i)=>({...d,i})).filter(d=>(d.title+d.model+d.version).toLowerCase().includes(state.docsQuery.toLowerCase())&&(state.docsType==='全部'||d.type===state.docsType));return `<form data-worker-form="docs-search" class="stack">${field('按品番、关键词或版本查询','query',state.docsQuery,'search')}${select('资料类型','type',['全部','安装手册','维修手册','视频资料'].map(v=>[v,v]),state.docsType)}<button class="primary">查询资料</button></form>${list.map(d=>`<button class="w-document" data-worker="doc" data-value="${d.i}">${icon('guidance')}<span><small>${d.type} · ${d.version}</small><strong>${d.title}</strong><small>${d.model} · 示例资料</small></span><b>›</b></button>`).join('')||empty()}${related()?act('返回当前任务','linked-task','','w-text-button'):''}`;}
  function documentDetail(){const d=docs[state.docId];return card(`${tag(d.type)}<h2>${d.title}</h2><p>${d.model} · ${d.version}</p><p class="muted">发布日期：2026-09-01 · 演示版本</p>`)+card(`<h3>资料预览</h3><p>本页演示标题、适用型号、版本与预览位置。</p><p>正式文件尚未接入，不提供未经核实的维修操作步骤。</p>${notice(d.type==='视频资料'?'视频文件尚未接入，正式版在此播放。':'正式版在此阅读已发布的完整文档。')}`)+go('返回资料查询','w-technical','primary');}
  function warranty(){return form('warranty-search',field('按项目、区域或品番查询','query',state.warrantyQuery,'search'),'查询延保资料')+(['示例花园','徐汇','DEMO-T01'].some(v=>v.toLowerCase().includes(state.warrantyQuery.toLowerCase()))?card(`${tag('延保资料')}<h3>示例花园 · 卫浴产品延保项目</h3><p>徐汇区 · 上海示例项目企业</p><small>DEMO-WARRANTY-001</small>${go('查看范围与有效期','w-warranty-detail','primary')}`):empty());}
  function mine(){return `<div class="w-profile"><img src="assets/icons/default-avatar.svg" alt=""><div><small>服务人员</small><h2>丁师傅</h2><p>${e(state.company)}</p></div>${go('切换','w-company','w-text-button')}</div><div class="w-section-head"><h3>资料查询</h3><small>现场需要，随时查</small></div><div class="w-library">${row('技术资料','安装、维修、使用与视频','w-technical','guidance')}${row('延保资料','项目范围、品番与有效期','w-warranty','check')}</div><div class="w-section-head"><h3>账号与帮助</h3></div><div class="w-library">${row('问题反馈','提交问题，查看处理进度','w-feedback','service')}${row('修改密码','账号安全','w-password','mine')}${row('切换企业','当前企业与数据范围','w-company','home')}${row('退出登录','退出当前演示身份','w-logout','mine')}</div><p class="w-brand-note">TOTO · 专业服务，安心相伴</p>`;}
  const baseNote='v0.8 交互评审稿，全部为会话内虚构数据。按钮授权、状态迁移、库存事务和校验必须以正式 Spec 为准；不接真实接口、位置、扫码、上传、短信或账号。';
  const screens=[];
  function screen(id,title,entry,tab,body,footer,goal,note=''){const scopedBody=()=>state.company!=='上海示例服务企业'&&['w-part-detail','w-requisition','w-return','w-records','w-record-detail','w-technical','w-document','w-warranty','w-warranty-detail'].includes(id)?empty('当前企业暂无授权数据','可在我的页面切换企业。')+go('返回我的','w-mine','primary'):(typeof body==='function'?body():body);screens.push({id,title,entry,tab,body:scopedBody,footer,goal:goal||'在当前业务上下文完成操作，并返回关联记录。',note:baseNote+' '+note});}
  screen('w-tasks','任务','W01','w-tasks',renderTasks,null,'用处理优先级、预约时间和下一步识别任务，三个 Tab 保留全部业务入口。','队列与预约／缺件／审核退回标签独立。顶部指标点击筛选；搜索、排序、计数使用同一数据集。v0.8 仅展示已下发给当前师傅的任务；待处理合并断联，退回单独归入待补资料；正在服务置顶，计入待处理但不在下方重复展示，继续入口恢复本单填写步骤；尚未约定同时仅能服务一单。审核中只查看进度，审核通过即结束师傅本次处理，进入历史任务，由服务中心回访跟进；无二次交单入口。首页以列表为主，日程／地图通过顶部快捷入口进入；今日预约直达今日日程。返回列表恢复同企业、同筛选下的位置。');
  screen('w-schedule','任务日程','W01','w-tasks',()=>window.TOTO_WORKER_SCHEDULE?.render()||notice('日程模块待加载'),null,'按确认预约查看今天、未来和过去，再查看当日地图或路线。','v0.5 独立日程页；不额外显示底部 Tab。返回原页面保留日期；未预约任务集中在待安排，历史改约单独留痕。');
  screen('w-detail','任务详情','W02','w-tasks',detail,detailFooter);
  screen('w-appointment','联系与预约','W02','w-tasks',appointment);
  screen('w-edit','编辑补充信息','W02','w-tasks',edit);
  screen('w-exception','异常跟进','W02','w-tasks',exception,null,null,'取消恢复仅形成申请，不能擅自定义恢复目标状态。');
  screen('w-map','任务地图','W03','w-tasks',()=>window.TOTO_WORKER_MAP?.render()||notice('地图模块待加载'),null,'查看授权任务标点，选择工单或安排今日路线，再打开目的地位置。','v0.3 地图交互稿：示意底图、位置和路程，未调用真实地图或定位。支持同址任务、待核地址、定位与算路失败。');
  screen('w-service','服务记录','W04','w-tasks',service);
  screen('w-completion','完工资料','W04','w-tasks',completion,completionFooter,'四步补齐证据，确认后进入审核；保留草稿和失败材料重试。','原费用页保留范围待定说明，不引入费用计算。现场与远程指导分别采集证据。');
  screen('w-review','审核与办结进度','W04','w-tasks',review,()=>go('返回任务列表','w-tasks','primary'));
  screen('w-returned','补充退回资料','W04','w-tasks',returned);
  screen('w-resubmitted','重新提交结果','W04','w-tasks',review,()=>go('返回任务列表','w-tasks','primary'));
  screen('w-parts','配件','W05 / W08','w-parts',renderParts);
  screen('w-part-detail','配件详情','W05','w-parts',partDetail);
  screen('w-requisition','领配件','W06','w-parts',requisition,null,null,'先支持同库房多项选料；跨来源拆单和人员库存领用仍待契约，不从截图推测。');
  screen('w-return','申请退料','W07','w-parts',returnPart);
  screen('w-records','配件记录','W09 / W10 / W11','w-parts',records);
  screen('w-record-detail','配件单详情','W09 / W10 / W11','w-parts',recordDetail,null,null,'领料、退料、调拨共用记录视图；示例审批由右侧评审控制器推进，师傅只确认收件。');
  screen('w-mine','我的','W08 / W14','w-mine',mine);
  screen('w-technical','技术资料','W13','w-mine',technical);
  screen('w-document','资料详情','W13','w-mine',documentDetail);
  screen('w-warranty','延保资料','W12','w-mine',warranty);
  screen('w-warranty-detail','延保项目详情','W12','w-mine',()=>card(`${tag('项目延保')}<h2>示例花园</h2><p>DEMO-WARRANTY-001</p><p>徐汇区 · 上海示例项目企业</p>`)+card(`<h3>智能坐便器 · DEMO-T01</h3><dl class="w-kv"><div><dt>资料有效期</dt><dd>2026-01-01 至 2028-12-31</dd></div><div><dt>安装场合 / 数量</dt><dd>项目住宅 / 12 台</dd></div></dl>`)+notice('以上均为资料样例。项目延保资料不直接代表某件产品的保修判定。','amber'));
  screen('w-feedback','问题反馈','W15','w-mine',()=>card(form('feedback',area('遇到了什么问题','note',draft('w-feedback').note||'')+field('联系方式','phone',draft('w-feedback').phone||'','tel','required pattern="[0-9+ -]{7,20}"')+act(state.feedbackMedia?'移除示例图片':'附加示例图片','feedback-media','','secondary'),'提交反馈'))+card(`<h3>我的反馈</h3>${state.feedback.map(f=>`<details class="w-version"><summary>${tag('待处理')} ${e(f.id)}</summary><p>${e(f.note)}</p><p class="muted">${f.media?'已附示例图片 · ':''}服务中心尚未回复</p></details>`).join('')||'<p class="muted">暂无反馈记录</p>'}`));
  screen('w-password','修改密码','W16','w-mine',()=>notice('原型仅演示验证和结果，请勿输入真实密码。演示旧密码：Demo1234。')+card(form('password',field('旧密码','old','','password','required autocomplete="off"')+field('新密码','next','','password','required minlength="8" autocomplete="off"')+field('确认新密码','confirm','','password','required minlength="8" autocomplete="off"'),'确认修改')));
  screen('w-company','切换企业','W16','w-mine',()=>notice('切换后清空本次企业的任务、草稿与配件上下文，再加载目标企业数据。','amber')+card(form('company',select('目标企业','company',[['上海示例服务企业','上海示例服务企业'],['苏州示例服务企业','苏州示例服务企业']],state.company)+check('已处理当前企业未提交的资料','confirmed'),'切换企业')));
  screen('w-logout','退出登录','W16','w-mine',()=>card(`<h2>退出当前账号？</h2><p>本次演示的草稿和企业数据将清除。</p><div class="w-contact">${go('继续使用','w-mine')}${act('确认退出','logout','','primary')}</div>`));
  screen('w-login','服务人员登录','W16','w-mine',()=>card(`<div class="w-part-hero">${icon('mine')}<h2>TOTO 服务人员</h2><p>已退出演示账号</p></div>${act('使用示例身份重新进入','login','','primary')}`));
  function saveDraft(root,page){
    if(!page?.startsWith('w-')||['w-password','w-company','w-login','w-logout'].includes(page))return;
    const values={};root?.querySelectorAll('input[name],select[name],textarea[name]').forEach(el=>{if(el.type!=='file')values[el.name]=el.type==='checkbox'?el.checked:el.value;});
    if(Object.keys(values).length)state.drafts[taskKey(page)]={...state.drafts[taskKey(page)],...values};
  }
  function overlay(){const o=state.overlay;if(!o)return '';return `<div class="w-scrim"><section class="w-dialog" role="dialog" aria-modal="true" aria-label="${e(o.title)}"><h2>${e(o.title)}</h2><p>${e(o.text)}</p>${o.kind==='arrival'?form('arrival',area('无法定位的到达说明','note'),'提交说明供核验'):''}<div class="w-contact">${act('返回','dismiss')}${o.kind==='cancel'?act('确认撤销','confirm-cancel',o.id,'primary'):''}</div></section></div>`;}
  const snapshot=()=>JSON.parse(JSON.stringify(state));
  const requireText=(value,message)=>{if(!String(value||'').trim())throw new Error(message);};
  const integer=(value,max)=>{const n=Number(value);if(!Number.isInteger(n)||n<1||n>max)throw new Error('数量须为正整数，且不能超过当前可用量。');return n;};
  function validateEvidence(t){if(t.type==='远程指导')return true;return t.media.site==='ready'&&t.media.label==='ready';}
  function complete(t){
    if(t.queue!=='pending'||t.flag==='审核退回')throw new Error('当前任务不可重复提交，请查看处理进度。');
    if(t.type!=='远程指导'&&!t.signed)throw new Error('请先完成签到或填写无法定位的到达说明。');
    requireText(t.service.diagnosis,'请先填写服务检测或沟通记录。');requireText(t.service.result,'请先填写处理结果。');
    if(!validateEvidence(t)||!t.completion.evidenceChecked)throw new Error('请补齐现场照片与铭牌照片，并核对材料。');
    requireText(t.completion.serial,'请补齐产品编号。');
    if(!t.completion.rfid&&!t.completion.noRfidReason)throw new Error('请填写 RFID 或无 RFID 说明。');
    requireText(t.completion.result,'请填写服务结果。');requireText(t.completion.confirmationNote,'请填写客户确认记录。');
    if(!t.completion.confirmation||!t.completion.submitChecked)throw new Error('请核对客户确认及提交清单。');
    if(!['none','parts'].includes(t.service.usage))throw new Error('请核对本次配件耗用。');
    if(t.service.usage==='parts'){const n=integer(t.service.quantity,state.inventory.P001);state.inventory.P001-=n;}
    t.versions.push({n:t.versions.length+1,status:'待审核',result:t.completion.result,note:t.completion.confirmationNote,serial:t.completion.serial,evidence:Object.entries(t.media).filter(([,v])=>v==='ready').map(([k])=>k).join('、'),service:{...t.service}});
    t.serving=false;t.queue='review';t.flag='等待审核';t.reason='';log(t,'完工资料已提交','已生成只读提交版本，等待审核。');state.step=0;
  }
  function addRecord(type,items,note){const r={id:`DEMO-${type==='领料'?'LL':type==='退料'?'TL':'DB'}-${String(state.records.length+1).padStart(3,'0')}`,type,items:items.map(i=>({...i})),note,taskId:state.linkTask,status:'处理中',source:type==='调拨'?'示例人员库存 → 丁师傅':'徐汇服务中心库房',history:['申请已提交 · 本次演示']};state.records.push(r);state.recordId=r.id;state.recordType=type;state.recordFilter='全部';return r;}
  function retainAppointment(t,outcome){if(t.date&&t.start&&t.end)(t.appointmentHistory||(t.appointmentHistory=[])).push({date:t.date,start:t.start,end:t.end,outcome});}
  function submitAction(kind,v,page){
    const t=task();
    if(state.company!=='上海示例服务企业' && ['requisition','return'].includes(kind))throw new Error('当前企业暂无授权库房或配件。');
    if(['appointment','edit','exception','restore','service','completion','resubmit','handover','arrival'].includes(kind)&&!t)throw new Error('请先选择任务。');
    switch(kind){
      case 'task-search':state.search=(v.search||'').trim();return 'w-tasks';
      case 'part-search':state.partSearch=(v.search||'').trim();return 'w-parts';
      case 'appointment':{
        if(!canArrange(t))throw new Error('当前阶段不可修改预约。');requireText(v.note,'请记录联系结果。');
        if(v.result==='confirmed'){
          if(!v.date||v.date<TODAY||!v.start||!v.end||v.end<=v.start)throw new Error('请选择今天或之后的日期，结束时间须晚于开始时间。');
          if(t.date!==v.date||t.start!==v.start||t.end!==v.end){retainAppointment(t,'已改约');pauseService(t);}
          t.date=v.date;t.start=v.start;t.end=v.end;t.queue='pending';
          if(t.flag!=='审核退回')t.flag='已预约';
          t.reason=t.flag==='审核退回'?t.reason:'';
        }else if(v.result==='lost'){retainAppointment(t,'原预约取消 · 无法联系');t.queue='lost';t.flag='断联';t.date='';t.start='';t.end='';t.reason=v.note;}
        else if(v.result==='later'){retainAppointment(t,'原预约取消 · 待重新确认');if(t.flag!=='审核退回')t.flag='待联系';t.date='';t.start='';t.end='';t.reason=v.note;}
        else throw new Error('请选择联系结果。');
        if(v.result!=='confirmed')pauseService(t);
        log(t,v.result==='confirmed'?'客户确认预约':'联系结果已记录',`${v.result==='confirmed'?`${v.date} ${v.start}–${v.end} · `:''}${v.note}`);return 'w-detail';
      }
      case 'edit':if(!canArrange(t))throw new Error('当前阶段仅可查看服务记录。');t.backup=v.backup||'';t.supplement=v.supplement||'';t.note=v.note||'';log(t,'补充信息已更新',t.note||t.supplement||'更新备用电话');return 'w-detail';
      case 'exception':if(!canArrange(t))throw new Error('当前阶段不可执行此变更。');requireText(v.reason,'请填写原因与下一步。');if(!['改期','断联','缺件','已取消'].includes(v.flag))throw new Error('请选择跟进情况。');retainAppointment(t,v.flag==='已取消'?'已取消':'原预约取消 · '+v.flag);t.flag=v.flag;t.reason=v.reason;t.queue=v.flag==='已取消'?'cancelled':v.flag==='断联'?'lost':'pending';t.date='';t.start='';t.end='';pauseService(t);log(t,v.flag,v.reason);return 'w-detail';
      case 'restore':if(t.queue!=='cancelled')throw new Error('仅取消任务可申请恢复。');requireText(v.reason,'请填写申请原因。');if(!v.confirmed)throw new Error('请核对客户意愿。');if(!t.restoreRequested){t.restoreRequested=true;log(t,'恢复申请待确认',v.reason);}return 'w-detail';
      case 'arrival':if(!canArrange(t)||t.queue!=='pending')throw new Error('当前阶段不可签到。');requireText(v.note,'请填写到达说明。');t.signed=true;startService(t);t.arrival='定位例外待核验：'+v.note;log(t,'到达说明已登记（待核验）',v.note);state.overlay=null;return 'w-service';
      case 'service':if(t.queue!=='pending'||t.flag==='审核退回')throw new Error('当前任务请先处理审核或退回要求。');if(t.type!=='远程指导'&&!t.signed)throw new Error('请先签到，无法定位时可填写到达说明。');requireText(v.diagnosis,'请填写检测 / 沟通记录。');requireText(v.result,'请填写处理结果。');if(!['none','parts'].includes(v.usage))throw new Error('请选择配件耗用情况。');if(v.usage==='parts')integer(v.quantity,state.inventory.P001);t.service={...v};startService(t);t.resumePage='w-completion';t.resumeStep=0;state.step=0;return 'w-completion';
      case 'completion':{
        if(t.queue!=='pending'||t.flag==='审核退回')throw new Error('本任务已提交，请查看审核进度或补充退回资料。');
        if(state.step===0&&(!validateEvidence(t)||!v.evidenceChecked))throw new Error('请补齐并核对材料；上传失败项请先重试。');
        if(state.step===1){requireText(v.serial,'请输入产品编号。');if(!v.rfid&&!String(v.noRfidReason||'').trim())throw new Error('请填写 RFID 或说明未找到 RFID 的情况。');if(v.purchaseDate&&v.purchaseDate>TODAY)throw new Error('购买日期不能晚于今天。');}
        if(state.step===2){requireText(v.result,'请填写服务结果。');requireText(v.confirmationNote,'请填写客户确认记录或例外原因。');if(!['confirmed','exception'].includes(v.confirmation))throw new Error('请选择客户确认情况。');}
        Object.assign(t.completion,v);if(state.step<3){state.step++;t.resumeStep=state.step;t.resumePage='w-completion';return 'w-completion';}complete(t);return 'w-review';
      }
      case 'resubmit':if(t.flag!=='审核退回')throw new Error('当前无需重提，请查看审核进度。');requireText(v.note,'请说明本次补充内容。');if(t.media.replacement!=='ready'||!v.confirmed)throw new Error('请补齐清晰材料并核对退回意见。');t.versions.push({...t.versions[t.versions.length-1],n:t.versions.length+1,status:'待审核',note:v.note,evidence:'补充铭牌示例材料'});t.queue='review';t.flag='等待审核';t.reason='';log(t,'补充资料已重新提交',v.note);return 'w-resubmitted';
      case 'handover':throw new Error('无需再次交单，请查看审核与后续进度。');
      case 'requisition':{const items=Object.entries(state.basket).filter(([,q])=>q>0).map(([id,q])=>({id,quantity:integer(q,parts.find(p=>p.id===id).stock)}));if(!items.length)throw new Error('请至少选择一件配件。');addRecord('领料',items,v.note||'日常备料');state.basket={};return 'w-record-detail';}
      case 'return':requireText(v.note,'请填写退料原因。');if(state.records.some(r=>r.type==='退料'&&r.status==='处理中'&&r.items.some(i=>i.id===state.partId)))throw new Error('该配件已有待处理退料单，请先查看处理进度。');addRecord('退料',[{id:state.partId,quantity:integer(v.quantity,state.inventory[state.partId])}],v.note);return 'w-record-detail';
      case 'docs-search':state.docsQuery=(v.query||'').trim();state.docsType=v.type;return 'w-technical';
      case 'warranty-search':state.warrantyQuery=(v.query||'').trim();return 'w-warranty';
      case 'feedback':requireText(v.note,'请描述问题。');requireText(v.phone,'请填写联系方式。');state.feedback.unshift({id:`DEMO-FB-${state.feedback.length+1}`,note:v.note,phone:v.phone,media:state.feedbackMedia});state.feedbackMedia=false;delete state.drafts[taskKey('w-feedback')];return 'w-feedback';
      case 'password':if(v.old!=='Demo1234')throw new Error('演示旧密码不正确，请使用 Demo1234。');if(!v.next||v.next.length<8||v.next!==v.confirm||v.next===v.old)throw new Error('新密码需至少 8 位、两次一致，并与旧密码不同。');return 'w-mine';
      case 'company':if(!v.confirmed)throw new Error('请先处理未提交资料。');if(!['上海示例服务企业','苏州示例服务企业'].includes(v.company))throw new Error('请选择可用企业。');if(v.company!==state.company)reset(v.company);return 'w-mine';
      default:throw new Error('未识别的原型操作。');
    }
  }
  function actAction(action,value){
    const t=task();
    switch(action){
      case 'task':if(!visibleTasks().some(x=>x.id===value))return 'w-tasks';state.taskId=value;state.step=0;return 'w-detail';
      case 'task-next':{const selected=visibleTasks().find(x=>x.id===value);if(!selected)return 'w-tasks';state.taskId=value;state.step=0;return isServing(selected)?resumeService(selected):nextStep(selected).route;}
      case 'resume-service':{const selected=activeTasks().find(x=>x.id===value);return selected?resumeService(selected):'w-tasks';}
      case 'start-remote':if(!canArrange(t)||t.type!=='远程指导'||t.queue!=='pending')throw new Error('当前任务不可开始远程指导。');startService(t);return 'w-service';
      case 'history-filter':state.queue='history';state.filter=['all','processing','closed','cancelled'].includes(value)?value:'all';return 'w-tasks';
      case 'queue':state.queue=availableQueues().some(([k])=>k===value)?value:'pending';state.filter='all';return 'w-tasks';
      case 'filter':state.filter=value==='returned'?'all':value;state.queue=value==='returned'?'returned':'pending';state.search='';return 'w-tasks';
      case 'clear-filter':state.filter='all';state.search='';return 'w-tasks';
      case 'part':state.partId=value;return 'w-part-detail';
      case 'records':state.recordType=value;state.recordFilter='全部';state.linkTask=null;return 'w-records';
      case 'task-records':state.linkTask=t?.id;state.recordType='全部';state.recordFilter='全部';return 'w-records';
      case 'task-parts':state.linkTask=t?.id;return 'w-requisition';
      case 'task-docs':state.linkTask=t?.id;state.docsQuery=t?.model||'';state.docsType='全部';return 'w-technical';
      case 'linked-task':case 'reappoint':{const linked=visibleTasks().find(x=>x.id===(value||state.linkTask));if(!linked)return 'w-tasks';state.taskId=linked.id;return action==='reappoint'&&canArrange(linked)?'w-appointment':'w-detail';}
      case 'record-type':state.recordType=value;state.recordFilter='全部';return 'w-records';
      case 'record-filter':state.recordFilter=value;return 'w-records';
      case 'record':state.recordId=value;return 'w-record-detail';
      case 'doc':state.docId=Number(value);return 'w-document';
      case 'basket-plus':{const p=parts.find(x=>x.id===value);if(p&&(state.basket[value]||0)<p.stock)state.basket[value]=(state.basket[value]||0)+1;return 'w-requisition';}
      case 'basket-minus':state.basket[value]=Math.max(0,(state.basket[value]||0)-1);return 'w-requisition';
      case 'prev-step':state.step=Math.max(0,state.step-1);if(t)t.resumeStep=state.step;return 'w-completion';
      case 'media':if(t){t.media[value]=t.media[value]==='ready'?'none':t.media[value]==='failed'?'ready':state.nextUploadFail?'failed':'ready';state.nextUploadFail=false;}return null;
      case 'sign':if(canArrange(t)&&t.queue==='pending'){t.signed=true;startService(t);t.arrival='示例位置签到 · 09-13 14:02';log(t,'到达签到已记录','仅示例位置，未读取真实定位。');}return null;
      case 'sign-failed':state.overlay={title:'无法获取位置',text:'可以重试定位，或登记到达说明供服务中心核验。',kind:'arrival'};return null;
      case 'scan':state.overlay={title:'扫码结果待核对',text:'示例产品编号 DEMO-SERIAL-001。扫描失败时可返回手动填写；未调用相机。'};return null;
      case 'phone':state.overlay={title:'联系客户',text:`${t?.name||''} · ${t?.phone||''}。正式小程序打开系统拨号确认；本原型未拨出电话。`};return null;
      case 'location':window.TOTO_WORKER_MAP?.open(t?.id);if(window.TOTO_WORKER_MAP?.point(t))window.TOTO_WORKER_MAP.act('single');return 'w-map';
      case 'dismiss':state.overlay=null;return null;
      case 'feedback-media':state.feedbackMedia=!state.feedbackMedia;return null;
      case 'cancel-record':state.overlay={kind:'cancel',id:value,title:'撤销领料申请？',text:'尚未完成领料确认，本次撤销不会改变个人库存。'};return null;
      case 'confirm-cancel':{const r=state.records.find(x=>x.id===value);if(r?.status==='处理中'&&r.type==='领料'){r.status='已撤销';r.history.push('申请人已撤销');}state.overlay=null;return 'w-record-detail';}
      case 'receive':{const r=state.records.find(x=>x.id===value);if(r?.status!=='待收件')throw new Error('当前记录无需再次确认收件。');r.items.forEach(i=>state.inventory[i.id]+=i.quantity);r.status='已完成';r.history.push('服务人员确认已收到实物 · 示例库存已更新');return 'w-record-detail';}
      case 'logout':reset();state.loggedIn=false;state.tasks=[];state.inventory={P001:0,P002:0,P003:0};return 'w-login';
      case 'login':reset();return 'w-tasks';
      default:return null;
    }
  }
  // Review-only external events. These are intentionally outside the phone, never technician permissions.
  function simulate(kind){const t=task(),r=record();switch(kind){
    case 'upload-fail':state.nextUploadFail=true;return null;
    case 'approved':if(t?.queue!=='review')throw new Error('先提交当前工单的完工资料，再模拟审核结果。');t.queue='followup';t.flag='审核通过';log(t,'服务中心审核通过','师傅本次处理结束，后续由服务中心回访跟进。');return 'w-review';
    case 'returned':if(t?.queue!=='review')throw new Error('当前工单不在待审核队列。');t.queue='pending';t.flag='审核退回';t.reason='产品铭牌照片不清晰，请补充后重新提交。';log(t,'服务中心退回补充',t.reason);return 'w-returned';
    case 'closed':if(t?.queue!=='followup')throw new Error('先通过完工审核，再模拟后台完成后续办结。');t.queue='closed';t.flag='已关闭';log(t,'后台完成回访与后续办结','仅外部结果演示，不等于确认了全部正式关闭条件。');return 'w-review';
    case 'part-approved':if(r?.status!=='处理中')throw new Error('请先打开处理中配件单。');if(r.type==='退料'){r.items.forEach(i=>integer(i.quantity,state.inventory[i.id]));r.items.forEach(i=>state.inventory[i.id]-=i.quantity);r.status='已完成';r.history.push('库房确认实物退回 · 示例个人库存已更新');}else{r.status='待收件';r.history.push('库房已处理，等待服务人员核对实物');}return 'w-record-detail';
    case 'part-rejected':if(r?.status!=='处理中')throw new Error('请先打开处理中配件单。');r.status='已拒绝';r.reason='示例：库存来源需要重新核对，请联系库房。';r.history.push('库房拒绝申请：库存来源需核对');return 'w-record-detail';
    case 'transfer':{if(!state.tasks.length)throw new Error('当前企业没有调拨演示数据。');const transfer=addRecord('调拨',[{id:'P002',quantity:1}],'示例授权调拨，等待接收确认');transfer.status='待收件';transfer.history=['后台创建授权调拨','来源人员已交出，等待接收确认'];return 'w-record-detail';}
    default:throw new Error('请选择一个后台结果。');
  }}
  const listPositionKey=()=>JSON.stringify([state.company,state.queue,state.filter,state.search,state.sort,activeTasks().map(t=>[t.id,t.resumePage,t.resumeStep])]);
  function saveListPosition(root){state.listPosition={key:listPositionKey(),top:Math.max(0,Number(root.scrollTop)||0),searchDraft:root.querySelector('[name="search"]')?.value??state.search};}
  function restoreListPosition(root){const position=state.listPosition;if(!position||position.key!==listPositionKey())return;root.scrollTop=position.top;const input=root.querySelector('[name="search"]');if(input)input.value=position.searchDraft;}
  window.TOTO_WORKER={
    onNavigate(id){state.overlay=null;if(['w-parts','w-mine'].includes(id))state.linkTask=null;},
    setSort(value){state.sort=value==='time'?'time':'priority';},
    owns:id=>id?.startsWith('w-'),snapshot,visibleTasks,canArrange,isServing,activeTasks,queueName,nextStep,reset,saveListPosition,restoreListPosition,filteredTasks,submitAction,actAction,simulate,saveDraft,overlay,
    guard(id){if(id==='w-handover')id='w-review';if(id==='w-apps')id='w-mine';if(!state.loggedIn&&id.startsWith('w-'))return 'w-login';
      if(['w-appointment','w-edit','w-service','w-exception','w-completion','w-returned','w-handover','w-detail','w-review','w-resubmitted'].includes(id)&&!task())return 'w-tasks';
      if(['w-appointment','w-edit','w-service'].includes(id)&&!canArrange(task()))return 'w-detail';
      if(id==='w-exception'&&!canArrange(task())&&task().queue!=='cancelled')return 'w-detail';
      if(id==='w-completion'&&(!canArrange(task())||task().queue!=='pending'))return 'w-review';
      return id;},
    handle(el,{root,page,render,showScreen,showToast}){
      if(!el.dataset.worker)return false;
      saveDraft(root,page);
      try{if(el.dataset.worker==='save'){showToast('已暂存在本次演示会话中；刷新会清除。');return true;}
        const target=actAction(el.dataset.worker,el.dataset.value);
        if(target)showScreen(target,true,true);else render();
        if(el.dataset.worker==='media')showToast(task()?.media[el.dataset.value]==='failed'?'演示上传失败，已保留其他内容，请点重试。':task()?.media[el.dataset.value]==='ready'?'示例材料已就绪。':'已移除示例材料。');
      }catch(err){showToast(err.message);}return true;
    },
    submit(formEl,{root,page,showScreen,showToast}){
      const kind=formEl.dataset.workerForm;if(!kind)return false;
      if(!formEl.checkValidity())return true;
      const values={};formEl.querySelectorAll('input[name],select[name],textarea[name]').forEach(el=>values[el.name]=el.type==='checkbox'?el.checked:el.value);
      saveDraft(root,page);
      try{const target=submitAction(kind,values,page);showScreen(target,true,true);if(kind==='password')showToast('密码修改结果演示完成，未修改真实账号。');if(kind==='feedback')showToast('本次反馈已保留在演示记录中，未发送给任何人。');}
      catch(err){showToast(err.message);}return true;
    },
    flows:[
      ['联系、履约与办结','不同工单独立保留资料；后台审核与办结使用右侧评审控制器。',['w-tasks','w-schedule','w-map','w-detail','w-appointment','w-service','w-completion','w-review']],
      ['缺件、领料与再次上门','申请不增加库存；库房处理后确认收件，再返回原工单预约。',['w-detail','w-exception','w-requisition','w-record-detail','w-appointment','w-service']],
      ['审核退回与新版本','先看退回原因，补充材料；原始提交记录保留。',['w-tasks','w-returned','w-resubmitted','w-review']],
      ['取消与恢复申请','取消时登记原因；恢复先提交申请，等待服务中心确认。',['w-detail','w-exception','w-tasks']],
      ['库存、退料与调拨','配件页集中承载库存与全部记录；调拨样例由右侧评审控制器提供。',['w-parts','w-part-detail','w-return','w-records','w-record-detail']],
      ['资料查询与现场返回','我的页统一查资料；任务内按产品快捷查询。',['w-mine','w-technical','w-document','w-warranty','w-warranty-detail']],
      ['远程指导','从许先生的远程指导任务进入；无需定位签到，采集沟通与处理记录。',['w-tasks','w-detail','w-service','w-completion','w-review']],
      ['账号与问题反馈','反馈保留可查记录；切企业和退出清理演示上下文。',['w-mine','w-feedback','w-password','w-company','w-logout','w-login']]
    ]
  };
  window.TOTO_SCREENS=window.TOTO_SCREENS||{};
  window.TOTO_SCREENS.worker={name:'服务人员小程序',tabs:[{label:'任务',go:'w-tasks',icon:'service'},{label:'配件',go:'w-parts',icon:'repair'},{label:'我的',go:'w-mine',icon:'mine'}],screens};
})();
