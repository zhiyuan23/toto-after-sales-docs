'use strict';
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const CHEN='WX202609130018',SUN='AZ202609100002',HUANG='WX202609120009',ZHAO='AZ202609110006';
function fixture(transform=s=>s){const window={};for(const file of ['worker.js','worker-map.js','worker-schedule.js']){const src=readFileSync(resolve(__dirname,'../'+file),'utf8');vm.runInNewContext(file==='worker.js'?transform(src):src,{window});}return {w:window.TOTO_WORKER,m:window.TOTO_WORKER_MAP,s:window.TOTO_WORKER_SCHEDULE,page:id=>window.TOTO_SCREENS.worker.screens.find(p=>p.id===id)};}
test('unpublished, unassigned and unreleased-status tasks are excluded across list, calendar, map and deep links',()=>{
  for(const extra of ["published:false,","assignedTo:null,","assignedTo:'another-worker',","queue:'publish',"]){
    const {w,m,s,page}=fixture(src=>src.replace("name:'陈女士',type:'维修',queue:'pending',", "name:'陈女士',type:'维修',queue:'pending',"+extra));
    assert.ok(!w.filteredTasks('all').some(t=>t.id===CHEN));assert.ok(!m.rows().some(t=>t.id===CHEN));assert.ok(!s.entries().some(r=>r.task.id===CHEN));
    assert.equal(w.actAction('task',CHEN),'w-tasks');assert.equal(w.actAction('task-next',CHEN),'w-tasks');assert.equal(w.guard('w-detail'),'w-tasks');assert.doesNotMatch(page('w-tasks').body(),/陈女士|待发布/);
  }
});
test('task groups include disconnected follow-up and primary actions open the correct next step',()=>{
  const {w,page}=fixture();assert.ok(w.filteredTasks().some(t=>t.queue==='lost'));assert.match(page('w-tasks').body(),/待处理<small>7/);
  assert.equal(w.actAction('task-next',ZHAO),'w-returned');assert.equal(w.snapshot().taskId,ZHAO);
  assert.equal(w.actAction('task-next',HUANG),'w-review');assert.equal(w.actAction('task-next',SUN),'w-review');
  w.actAction('queue','history');assert.equal(w.filteredTasks().length,2);w.actAction('history-filter','closed');assert.equal(w.filteredTasks().length,0);
});
test('task home overview exposes explicit schedule and parts destinations without coupling secondary filters',()=>{
  const {w,s,page}=fixture();let html=page('w-tasks').body();
  assert.match(html,/class="w-task-tools"/);assert.match(html,/data-wmap="open"/);assert.doesNotMatch(html,/data-wsched="day"/);
  assert.match(html,/class="w-focus-actions"/);assert.match(html,/data-wsched="today"[^>]+查看今日日程，共 2 单预约/);assert.match(html,/data-worker="dashboard-filter" data-value="parts"[^>]+查看等配件任务，共 1 单/);
  assert.doesNotMatch(html,/class="w-task-nav"|快捷筛选/);assert.match(html,/待处理任务筛选/);assert.equal(s.act('today'),'w-schedule');
  assert.ok(html.indexOf('class="w-focus"')<html.indexOf('w-task-queues'));
  assert.equal(w.actAction('filter','today'),'w-tasks');assert.equal(w.filteredTasks().length,2);assert.equal(w.snapshot().queue,'pending');
  html=page('w-tasks').body();assert.match(html,/class="selected" data-worker="filter" data-value="today"/);
  w.actAction('queue','returned');w.actAction('filter','parts');assert.equal(w.snapshot().queue,'returned');assert.equal(w.snapshot().filter,'all');
  assert.doesNotMatch(page('w-tasks').body(),/待处理任务筛选/);
  w.actAction('dashboard-filter','parts');assert.equal(w.snapshot().queue,'pending');assert.equal(w.snapshot().filter,'parts');assert.equal(w.filteredTasks().length,1);
});
test('review and returned-material tasks cannot be modified through stale scheduling or service links',()=>{
  const {w,page}=fixture();for(const id of [HUANG,ZHAO]){w.actAction('task',id);assert.doesNotMatch(page('w-detail').body(),/联系 \/ 改约|编辑补充信息|去这单/);assert.equal(w.guard('w-appointment'),'w-detail');assert.equal(w.guard('w-service'),'w-detail');assert.throws(()=>w.submitAction('appointment',{result:'lost',note:'不应更改'}),/不可/);assert.throws(()=>w.submitAction('edit',{note:'不应更改'}),/仅可查看/);assert.throws(()=>w.submitAction('exception',{flag:'已取消',reason:'不应更改'}),/不可/);}
});
test('approved work is read-only across details, schedule and old handover links',()=>{
  const {w,page,s}=fixture();w.actAction('task',SUN);
  assert.equal(w.guard('w-handover'),'w-review');assert.equal(page('w-handover'),undefined);
  assert.doesNotMatch(page('w-tasks').body(),/待交单|data-value="handover"/);assert.match(page('w-review').body(),/无需再次提交/);
  assert.equal(w.guard('w-service'),'w-detail');assert.equal(w.guard('w-appointment'),'w-detail');assert.throws(()=>w.submitAction('appointment',{result:'lost',note:'不应更改'}),/不可/);
  w.actAction('history-filter','processing');assert.equal(w.filteredTasks()[0].id,SUN);assert.equal(s.status(s.entries('2026-09-10')[0]).label,'已完工 · 待回访');
});
test('review approval updates history counts without resubmission, inventory changes or automatic closure',()=>{
  const {w,page}=fixture();w.actAction('task',HUANG);const before=w.snapshot();w.simulate('approved');
  w.actAction('queue','review');assert.equal(w.filteredTasks().length,0);w.actAction('queue','history');assert.equal(w.filteredTasks().length,3);
  assert.match(page('w-review').body(),/服务中心跟进/);assert.equal(w.snapshot().tasks.find(t=>t.id===HUANG).queue,'followup');
  assert.equal(w.snapshot().tasks.find(t=>t.id===HUANG).versions.length,before.tasks.find(t=>t.id===HUANG).versions.length);
  assert.deepEqual(w.snapshot().inventory,before.inventory);assert.throws(()=>w.submitAction('handover',{}),/无需再次/);
});
test('map status and primary action follow completion progress instead of suggesting a new visit',()=>{
  const {w,m}=fixture();w.actAction('queue','review');m.open();assert.match(m.render(),/审核中/);assert.doesNotMatch(m.render(),/去这单 · 看路线/);assert.equal(m.act('next',HUANG),'w-review');
});
test('four task groups are disjoint, cover authorized tasks and track review return/resubmit',()=>{
  const {w,m}=fixture();const groups=['pending','returned','review','history'];
  const ids=groups.flatMap(key=>Array.from(w.filteredTasks(key),t=>t.id));
  assert.equal(ids.length,w.visibleTasks().length);assert.equal(new Set(ids).size,ids.length);
  assert.ok(!w.filteredTasks('pending').some(t=>t.id===ZHAO));
  w.actAction('queue','returned');assert.equal(w.snapshot().queue,'returned');m.open();assert.equal(m.rows()[0].id,ZHAO);
  w.actAction('task',HUANG);w.simulate('returned');assert.equal(w.filteredTasks().length,2);
  w.actAction('media','replacement');w.submitAction('resubmit',{note:'已补清晰材料',confirmed:true});assert.equal(w.filteredTasks().length,1);assert.equal(w.filteredTasks('review').length,1);
});
test('service focus starts on arrival, stays across queries and tabs and is not duplicated in the list',()=>{
  const {w,page,m,s}=fixture();assert.doesNotMatch(page('w-tasks').body(),/class="w-serving"/);
  page('w-service').body();assert.equal(w.activeTasks().length,0);w.actAction('sign');
  const html=page('w-tasks').body();assert.equal((html.match(/陈女士/g)||[]).length,2); // accessible article label + visible heading
  assert.match(html,/其中 1 单正在服务/);assert.match(html,/待处理<small>7/);assert.equal(w.filteredTasks().length,7);
  m.open();assert.match(m.render(),/继续服务/);assert.equal(s.status(s.entries().find(r=>r.task.id===CHEN)).label,'正在服务');
  w.actAction('queue','history');w.submitAction('task-search',{search:'不匹配'});assert.equal(w.filteredTasks().length,0);assert.match(page('w-tasks').body(),/正在服务 · 陈女士/);
});
test('continue restores the correct order, completion step and task-scoped draft',()=>{
  const {w,page}=fixture();w.actAction('sign');w.submitAction('service',{diagnosis:'已检查',result:'已处理',usage:'none'});
  w.actAction('media','site');w.actAction('media','label');w.submitAction('completion',{evidenceChecked:true});
  w.saveDraft({querySelectorAll:()=>[{name:'serial',type:'text',value:'未提交的产品编号'}]},'w-completion');
  w.actAction('task','AZ202609130021');assert.equal(w.snapshot().step,0);
  assert.equal(w.actAction('resume-service',CHEN),'w-completion');assert.equal(w.snapshot().step,1);assert.equal(w.snapshot().taskId,CHEN);assert.match(page('w-completion').body(),/未提交的产品编号/);
  w.actAction('prev-step');w.actAction('task',ZHAO);w.actAction('resume-service',CHEN);assert.equal(w.snapshot().step,0);
});
test('multiple actual service sessions remain visible without losing either resume target',()=>{
  const {w,page}=fixture();w.actAction('sign');w.actAction('task','AZ202609130021');w.actAction('sign');
  assert.equal(w.activeTasks().length,2);assert.match(page('w-tasks').body(),/2 单正在服务，请核对/);
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
