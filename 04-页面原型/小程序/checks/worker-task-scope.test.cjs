'use strict';
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const CHEN='WX202609130018',SUN='AZ202609100002',HUANG='WX202609120009',ZHAO='AZ202609110006';
function fixture(transform=s=>s){const window={};const src=readFileSync(resolve(__dirname,'../worker.js'),'utf8');vm.runInNewContext(transform(src),{window});return {w:window.TOTO_WORKER,page:id=>window.TOTO_SCREENS.worker.screens.find(p=>p.id===id)};}
test('unpublished, unassigned and unreleased-status tasks are excluded from the task list and deep links',()=>{
  for(const extra of ["published:false,","assignedTo:null,","assignedTo:'another-worker',","queue:'publish',"]){
    const {w,page}=fixture(src=>src.replace("name:'陈女士',type:'维修',queue:'pending',", "name:'陈女士',type:'维修',queue:'pending',"+extra));
    assert.ok(!w.filteredTasks('all').some(t=>t.id===CHEN));
    assert.equal(w.actAction('task',CHEN),'w-tasks');assert.equal(w.actAction('task-next',CHEN),'w-tasks');assert.equal(w.guard('w-detail'),'w-tasks');assert.doesNotMatch(page('w-tasks').body(),/陈女士|待发布/);
  }
});
test('task groups include disconnected follow-up and primary actions open the correct next step',()=>{
  const {w,page}=fixture();assert.ok(w.filteredTasks().some(t=>t.queue==='lost'));assert.match(page('w-tasks').body(),/待处理<small>7/);
  assert.equal(w.actAction('task-next',ZHAO),'w-returned');assert.equal(w.snapshot().taskId,ZHAO);
  assert.equal(w.actAction('task-next',HUANG),'w-review');assert.equal(w.actAction('task-next',SUN),'w-review');
  w.actAction('queue','history');assert.equal(w.filteredTasks().length,2);w.actAction('history-filter','closed');assert.equal(w.filteredTasks().length,0);
});
test('task cards open details as a whole and use one vertically centered chevron',()=>{
  const {w,page}=fixture();let html=page('w-tasks').body();
  assert.match(html,new RegExp(`class="w-ticket-hitarea" data-worker="task" data-value="${CHEN}"`));
  assert.match(html,/class="w-time"><strong>14:00<\/strong><small>至 16:00<\/small><\/div>/);
  assert.doesNotMatch(html,/class="w-time"><strong>(?:待补|待件|联系|待审|已通过|已取消|已关闭)<\/strong>/);
  assert.doesNotMatch(html,/>任务详情<\/button>|class="w-ticket-bottom"|class="w-ticket-cue"|data-worker="task-next"/);
  assert.equal((html.match(/class="w-ticket-chevron" aria-hidden="true">›<\/span>/g)||[]).length,w.filteredTasks().length);
  w.actAction('queue','history');html=page('w-tasks').body();
  assert.match(html,/审核通过/);assert.match(html,/已取消/);assert.doesNotMatch(html,/class="w-time"|class="w-ticket-bottom"/);
  assert.equal((html.match(/class="w-ticket-chevron" aria-hidden="true">›<\/span>/g)||[]).length,w.filteredTasks().length);
});
test('task detail groups product documents and work-order part records in one auxiliary action row',()=>{
  const {w,page}=fixture();w.actAction('task',CHEN);const html=page('w-detail').body();
  assert.match(html,/class="w-detail-links" aria-label="任务相关资料">[\s\S]*data-worker="task-docs"[\s\S]*查本产品资料[\s\S]*data-worker="task-records"[\s\S]*本单配件记录[\s\S]*<\/div>/);
  assert.equal((html.match(/class="w-text-button" data-worker="task-(?:docs|records)"/g)||[]).length,2);
});
test('task handling combines service and completion in one autosaved three-step flow',()=>{
  const {page}=fixture();const screen=page('w-service'),body=screen.body(),footer=screen.footer();
  assert.equal(screen.title,'处理任务');
  assert.match(body,/data-worker-form="service" id="w-service-form"/);
  assert.match(body,/本页内容自动保存/);assert.match(body,/服务处理[\s\S]*证据与确认[\s\S]*核对提交/);
  assert.doesNotMatch(body,/暂存草稿|已核对材料/);assert.doesNotMatch(footer,/data-worker="save"/);
  assert.match(footer,/type="submit" form="w-service-form">继续补齐证据<\/button>/);
});
test('review detail keeps one progress entry while returned work retains the original-record shortcut',()=>{
  const {w,page}=fixture();w.actAction('task',HUANG);
  assert.doesNotMatch(page('w-detail').body(),/查看完工材料与审核记录/);
  assert.match(page('w-detail').footer(),/data-go="w-review"[^>]*>查看处理进度<\/button>/);
  w.actAction('task',ZHAO);
  assert.match(page('w-detail').body(),/data-go="w-review"[^>]*>查看完工材料与审核记录<\/button>/);
  assert.match(page('w-detail').footer(),/data-go="w-returned"[^>]*>补充退回资料<\/button>/);
});
test('review progress uses a compact workflow overview instead of repeating the task detail header',()=>{
  const {w,page}=fixture();w.actAction('task',HUANG);let html=page('w-review').body();
  assert.match(html,/class="w-review-overview blue"/);assert.doesNotMatch(html,/class="w-status|class="w-context/);
  assert.match(html,/黄先生 · 维修[\s\S]*WX202609120009 · DEMO-T01/);
  assert.match(html,/当前进度[\s\S]*服务中心审核中[\s\S]*class="done"[^>]*>[\s\S]*完工提交[\s\S]*class="active" aria-current="step">[\s\S]*服务审核[\s\S]*class="pending"[^>]*>[\s\S]*后续办结/);
  w.simulate('approved');html=page('w-review').body();
  assert.match(html,/等待后续办结/);assert.equal((html.match(/class="done"/g)||[]).length,2);assert.match(html,/class="active" aria-current="step">[\s\S]*后续办结/);
  w.simulate('closed');html=page('w-review').body();
  assert.match(html,/服务已办结/);assert.equal((html.match(/class="done"/g)||[]).length,3);assert.doesNotMatch(html,/aria-current="step"/);
  w.actAction('task',ZHAO);html=page('w-review').body();
  assert.match(html,/class="w-review-overview red"/);assert.match(html,/资料退回待补充[\s\S]*class="issue" aria-current="step">[\s\S]*服务审核/);
});
test('task home overview switches the list to today and missing-parts filters',()=>{
  const {w,page}=fixture(),home=page('w-tasks');let html=home.body(),nav=home.rootNav();
  assert.match(nav,/9 月 13 日 · 星期日/);assert.match(nav,/今天，安排清楚/);assert.doesNotMatch(nav,/data-wmap|地图/);
  assert.equal(home.navigationMode,'custom-root');assert.match(home.note,/navigationStyle: custom[\s\S]*uni\.getWindowInfo\(\)[\s\S]*wx\.getMenuButtonBoundingClientRect\(\)/);
  assert.equal(page('w-schedule'),undefined);assert.equal(page('w-map'),undefined);assert.match(home.note,/日程与地图已经延期/);
  assert.doesNotMatch(html,/今天，安排清楚|data-wmap|data-wsched/);
  assert.match(html,/class="w-focus-actions"/);assert.match(html,/data-worker="dashboard-filter" data-value="today"[^>]+筛选今日预约任务，共 2 单/);assert.match(html,/data-worker="dashboard-filter" data-value="parts"[^>]+筛选等待配件任务，共 1 单/);
  assert.doesNotMatch(html,/class="w-task-nav"/);assert.match(html,/待处理任务筛选/);
  assert.ok(html.indexOf('class="w-focus"')<html.indexOf('w-task-queues'));
  assert.equal(w.actAction('dashboard-filter','today'),'w-tasks');assert.equal(w.filteredTasks().length,2);assert.equal(w.snapshot().queue,'pending');
  html=page('w-tasks').body();assert.match(html,/class="selected" data-worker="filter" data-value="today"/);
  w.actAction('queue','returned');w.actAction('filter','parts');assert.equal(w.snapshot().queue,'returned');assert.equal(w.snapshot().filter,'all');
  assert.doesNotMatch(page('w-tasks').body(),/待处理任务筛选/);
  w.actAction('dashboard-filter','parts');assert.equal(w.snapshot().queue,'pending');assert.equal(w.snapshot().filter,'parts');assert.equal(w.filteredTasks().length,1);
});
test('parts home separates inventory actions from record-only shortcuts and return supports a detail shortcut',()=>{
  const {w,page}=fixture(),screen=page('w-parts'),home=screen.body(),nav=screen.rootNav();
  assert.match(nav,/徐汇服务中心[\s\S]*配件，心中有数/);assert.doesNotMatch(home,/徐汇服务中心|配件，心中有数/);
  assert.equal(screen.navigationMode,'custom-root');assert.match(screen.note,/不得照搬原型 92px/);
  assert.match(home,/aria-label="个人库存概览"/);assert.match(home,/个人可用库存[\s\S]*2 种配件可用于现场服务/);
  assert.match(home,/aria-label="库存操作"/);assert.match(home,/data-go="w-requisition"[\s\S]*?领配件/);assert.match(home,/data-go="w-return"[\s\S]*?申请退料/);
  assert.match(home,/class="w-stock-records" data-worker="records" data-value="全部"/);assert.equal((home.match(/data-worker="records"/g)||[]).length,1);assert.doesNotMatch(home,/领料单|退料单|调拨单|class="w-shortcuts"/);
  w.actAction('records','退料');assert.doesNotMatch(page('w-records').body(),/>申请领料<|>申请退料</);
  assert.doesNotMatch(page('w-records').body(),/调拨|待收件/);
  w.actAction('part','P002');assert.equal(w.actAction('return-part','P002'),'w-return');assert.equal(w.snapshot().returnBasket.P002,1);assert.match(page('w-return').body(),/待提交 · 1 种 \/ 1 件/);
});
test('worker mine follows the consumer account-hub structure without duplicating company switching',()=>{
  const {page}=fixture();const screen=page('w-mine'),html=screen.body(),nav=screen.rootNav();
  assert.equal(screen.navigationMode,'custom-root');assert.match(nav,/徐汇服务中心[\s\S]*我的工作台[\s\S]*w-root-nav-compact-title">我的/);
  assert.match(html,/<header class="w-profile">[\s\S]*丁师傅[\s\S]*服务人员 · 上海示例服务企业[\s\S]*切换企业 ›[\s\S]*<\/header>/);
  assert.match(html,/<section class="w-resource-section"/);assert.match(html,/class="w-resource-grid is-single"/);assert.equal((html.match(/class="w-resource-card"/g)||[]).length,1);
  assert.match(html,/<section class="w-mine-section">/);assert.equal((html.match(/class="w-mine-row"/g)||[]).length,3);
  for(const label of ['技术资料','问题反馈','修改密码','退出登录'])assert.match(html,new RegExp(label));
  assert.doesNotMatch(html,/延保资料|data-go="w-warranty"/);
  assert.equal((html.match(/data-go="w-company"/g)||[]).length,1);assert.match(html,/资料查询[\s\S]*账号与帮助/);assert.doesNotMatch(html,/w-library|w-menu/);
});
test('root-tab navigation switches to a compact white title after content scrolls',()=>{
  const {page}=fixture();
  for(const [id,title] of [['w-tasks','任务'],['w-parts','配件'],['w-mine','我的']])assert.match(page(id).rootNav(),new RegExp(`w-root-nav-compact-title">${title}`));
  const app=readFileSync(resolve(__dirname,'../app.js'),'utf8'),css=readFileSync(resolve(__dirname,'../worker.css'),'utf8');
  assert.match(app,/phone-body'\)\.scrollTop>16/);assert.match(app,/addEventListener\('scroll',syncWorkerRootNavigation/);
  assert.match(css,/worker-nav-compact\[data-nav="root"\][\s\S]*background:#fff[\s\S]*w-root-nav-compact-title/);
});
test('technical and warranty resources use compact searches and grouped result cards',()=>{
  const {w,page}=fixture();let html=page('w-technical').body();
  assert.match(html,/data-worker-form="docs-search" class="w-resource-search"/);assert.match(html,/class="w-document-list"/);assert.equal((html.match(/class="w-document"/g)||[]).length,3);assert.match(html,/3 份资料/);
  w.submitAction('docs-search',{query:'安装',type:'安装手册'});html=page('w-technical').body();assert.equal((html.match(/class="w-document"/g)||[]).length,1);assert.match(html,/智能坐便器 · 安装核对资料/);
  html=page('w-warranty').body();assert.match(html,/data-worker-form="warranty-search" class="w-resource-search"/);assert.match(html,/class="w-warranty-card" data-go="w-warranty-detail"/);assert.doesNotMatch(html,/查看范围与有效期<\/button>|class="primary"/);
  w.submitAction('warranty-search',{query:'不存在'});assert.doesNotMatch(page('w-warranty').body(),/class="w-warranty-card"/);assert.match(page('w-warranty').body(),/未找到延保资料/);
  assert.match(page('w-document').body(),/w-resource-detail-hero[\s\S]*w-resource-detail-body/);assert.match(page('w-warranty-detail').body(),/w-warranty-hero[\s\S]*w-warranty-scope/);
});
test('requisition purpose separates work-order issue from standby stock replenishment',()=>{
  const {w,page}=fixture();let html=page('w-requisition').body();assert.match(html,/data-worker-purpose/);assert.match(html,/工单领料/);assert.match(html,/常备库存补充/);assert.match(html,/name="workOrder"/);assert.ok(html.indexOf('待提交')<html.indexOf('领料用途')&&html.indexOf('领料用途')<html.indexOf('关联工单'));
  w.actAction('requisition-purpose','stock');html=page('w-requisition').body();assert.match(html,/补充原因/);assert.match(html,/提交补充申请/);assert.doesNotMatch(html,/name="workOrder"/);
  w.actAction('task-parts');html=page('w-requisition').body();assert.match(html,/value="工单领料" readonly/);assert.doesNotMatch(html,/data-worker-purpose/);assert.match(html,/name="workOrder"/);
});
test('review and returned-material tasks cannot be modified through stale scheduling or service links',()=>{
  const {w,page}=fixture();for(const id of [HUANG,ZHAO]){w.actAction('task',id);assert.doesNotMatch(page('w-detail').body(),/联系 \/ 改约|编辑补充信息|去这单/);assert.equal(w.guard('w-appointment'),'w-detail');assert.equal(w.guard('w-service'),'w-detail');assert.throws(()=>w.submitAction('appointment',{result:'lost',note:'不应更改'}),/不可/);assert.throws(()=>w.submitAction('edit',{note:'不应更改'}),/仅可查看/);assert.throws(()=>w.submitAction('exception',{flag:'已取消',reason:'不应更改'}),/不可/);}
});
test('approved work is read-only across details and old handover links',()=>{
  const {w,page}=fixture();w.actAction('task',SUN);
  assert.equal(w.guard('w-handover'),'w-review');assert.equal(page('w-handover'),undefined);
  assert.doesNotMatch(page('w-tasks').body(),/待交单|data-value="handover"/);assert.match(page('w-review').body(),/无需再次提交/);
  assert.equal(w.guard('w-service'),'w-detail');assert.equal(w.guard('w-appointment'),'w-detail');assert.throws(()=>w.submitAction('appointment',{result:'lost',note:'不应更改'}),/不可/);
  w.actAction('history-filter','processing');assert.equal(w.filteredTasks()[0].id,SUN);assert.match(page('w-review').body(),/后续跟进|等待后续办结/);
});
test('review approval updates history counts without resubmission, inventory changes or automatic closure',()=>{
  const {w,page}=fixture();w.actAction('task',HUANG);const before=w.snapshot();w.simulate('approved');
  w.actAction('queue','review');assert.equal(w.filteredTasks().length,0);w.actAction('queue','history');assert.equal(w.filteredTasks().length,3);
  assert.match(page('w-review').body(),/服务中心跟进/);assert.equal(w.snapshot().tasks.find(t=>t.id===HUANG).queue,'followup');
  assert.equal(w.snapshot().tasks.find(t=>t.id===HUANG).versions.length,before.tasks.find(t=>t.id===HUANG).versions.length);
  assert.deepEqual(w.snapshot().inventory,before.inventory);assert.throws(()=>w.submitAction('handover',{}),/无需再次/);
});
test('four task groups are disjoint, cover authorized tasks and track review return/resubmit',()=>{
  const {w}=fixture();const groups=['pending','returned','review','history'];
  const ids=groups.flatMap(key=>Array.from(w.filteredTasks(key),t=>t.id));
  assert.equal(ids.length,w.visibleTasks().length);assert.equal(new Set(ids).size,ids.length);
  assert.ok(!w.filteredTasks('pending').some(t=>t.id===ZHAO));
  w.actAction('queue','returned');assert.equal(w.snapshot().queue,'returned');assert.equal(w.filteredTasks()[0].id,ZHAO);
  w.actAction('task',HUANG);w.simulate('returned');assert.equal(w.filteredTasks().length,2);
  w.actAction('media','replacement');w.submitAction('resubmit',{note:'已补清晰材料'});assert.equal(w.filteredTasks().length,1);assert.equal(w.filteredTasks('review').length,1);
});
test('service focus starts on arrival, stays across queries and tabs and is not duplicated in the list',()=>{
  const {w,page}=fixture();assert.doesNotMatch(page('w-tasks').body(),/class="w-serving"/);
  page('w-service').body();assert.equal(w.activeTasks().length,0);w.actAction('sign');
  const html=page('w-tasks').body();assert.equal((html.match(/陈女士/g)||[]).length,2); // accessible article label + visible heading
  assert.doesNotMatch(html,/class="w-focus"/);assert.equal((html.match(/class="w-serving"/g)||[]).length,1);assert.match(html,/class="w-serving-shortcuts"/);
  assert.match(html,/其中 1 单正在服务/);assert.match(html,/待处理<small>7/);assert.equal(w.filteredTasks().length,7);
  w.actAction('queue','history');w.submitAction('task-search',{search:'不匹配'});assert.equal(w.filteredTasks().length,0);assert.match(page('w-tasks').body(),/正在服务 · 陈女士/);
});
test('continue restores the correct order, completion step and task-scoped draft',()=>{
  const {w,page}=fixture();w.actAction('sign');w.submitAction('service',{diagnosis:'已检查',result:'已处理',usage:'none'});
  w.actAction('media','site');w.actAction('media','label');w.saveDraft({querySelectorAll:()=>[{name:'serial',type:'text',value:'未提交的产品编号'}]},'w-service');
  w.actAction('task','AZ202609130021');assert.equal(w.snapshot().step,0);
  assert.equal(w.actAction('resume-service',CHEN),'w-service');assert.equal(w.snapshot().step,1);assert.equal(w.snapshot().taskId,CHEN);assert.match(page('w-service').body(),/未提交的产品编号/);assert.equal(w.guard('w-completion'),'w-service');
  w.actAction('prev-step');w.actAction('task',ZHAO);w.actAction('resume-service',CHEN);assert.equal(w.snapshot().step,0);
});
test('multiple actual service sessions remain visible without losing either resume target',()=>{
  const {w,page}=fixture();w.actAction('sign');w.actAction('task','AZ202609130021');w.actAction('sign');
  const html=page('w-tasks').body();assert.equal(w.activeTasks().length,2);assert.match(html,/2 单需要继续处理/);assert.equal((html.match(/class="w-serving w-serving-group"/g)||[]).length,1);
  assert.match(html,/data-worker="resume-service" data-value="WX202609130018"/);assert.match(html,/data-worker="resume-service" data-value="AZ202609130021"/);
  assert.equal(w.actAction('resume-service',CHEN),'w-service');assert.equal(w.snapshot().taskId,CHEN);
  w.actAction('resume-service','AZ202609130021');assert.equal(w.snapshot().taskId,'AZ202609130021');
});
test('exceptions and changed appointments clear focus and require fresh arrival without discarding materials',()=>{
  for(const flag of ['改期','缺件','断联','已取消']){const {w}=fixture();w.actAction('sign');w.actAction('media','site');w.submitAction('exception',{flag,reason:'需要后续跟进'});assert.equal(w.activeTasks().length,0);assert.equal(w.snapshot().tasks[0].signed,false);assert.equal(w.snapshot().tasks[0].media.site,'ready');assert.equal(w.actAction('resume-service',CHEN),'w-tasks');}
  const {w}=fixture();w.actAction('sign');w.submitAction('appointment',{result:'confirmed',date:'2026-09-14',start:'14:00',end:'16:00',note:'已确认改约'});assert.equal(w.activeTasks().length,0);
});
test('remote start and arrival exception create focus; company switch and logout isolate it',()=>{
  const {w,page}=fixture();w.actAction('task','ZD202609130008');assert.match(page('w-service').body(),/开始远程指导/);w.actAction('start-remote');assert.equal(w.activeTasks()[0].type,'远程指导');assert.equal(w.activeTasks()[0].signed,false);
  w.actAction('task',CHEN);w.submitAction('arrival',{note:'现场定位失败，已到客户家'});assert.equal(w.activeTasks().length,2);
  w.submitAction('company',{company:'苏州示例服务企业',confirmed:true});assert.equal(w.activeTasks().length,0);assert.doesNotMatch(page('w-tasks').body(),/陈女士|许先生/);
  w.reset();w.actAction('sign');w.actAction('logout');assert.equal(w.activeTasks().length,0);
});
