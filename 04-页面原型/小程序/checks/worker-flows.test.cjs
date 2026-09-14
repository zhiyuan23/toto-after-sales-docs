'use strict';
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
function fixture(){const window={};vm.runInNewContext(readFileSync(resolve(__dirname,'../worker.js'),'utf8'),{window});return window.TOTO_WORKER;}
const current=w=>w.snapshot().tasks.find(t=>t.id===w.snapshot().taskId);
const photo=(w,k)=>{w.simulate('upload-fail');w.actAction('media',k);assert.equal(current(w).media[k],'failed');w.actAction('media',k);assert.equal(current(w).media[k],'ready');};
function complete(w,usage='none'){
  w.actAction('sign');w.submitAction('service',{diagnosis:'演示检测',result:'已处理并试运行',usage,quantity:1});
  photo(w,'site');photo(w,'label');w.submitAction('completion',{evidenceChecked:true});
  w.submitAction('completion',{serial:'DEMO-001',noRfidReason:'无标签，待人工核验'});
  w.submitAction('completion',{result:'已完成',confirmation:'confirmed',confirmationNote:'客户现场确认'});
  return w.submitAction('completion',{submitChecked:true});
}
test('queue, substatus, search and counts use the same tasks',()=>{
  const w=fixture();assert.equal(w.filteredTasks().length,7);w.actAction('filter','returned');assert.equal(w.filteredTasks().length,1);assert.equal(w.filteredTasks()[0].queue,'pending');
  w.actAction('clear-filter');w.actAction('queue','pending');w.submitAction('task-search',{search:'云锦'});assert.equal(w.filteredTasks().length,1);assert.equal(w.filteredTasks()[0].name,'陈女士');
  w.submitAction('task-search',{search:'no-match'});assert.equal(w.filteredTasks().length,0);
});
test('appointment rejects inverted time and unconfirmed dates never become confirmed schedules',()=>{
  const w=fixture();assert.throws(()=>w.submitAction('appointment',{result:'confirmed',date:'2026-09-14',start:'16:00',end:'14:00',note:'已联系'}),/结束时间/);
  w.submitAction('appointment',{result:'later',date:'2026-09-14',start:'14:00',end:'16:00',note:'等待回复'});assert.equal(current(w).date,'');assert.equal(current(w).flag,'待联系');
  w.submitAction('appointment',{result:'confirmed',date:'2026-09-14',start:'14:00',end:'16:00',note:'客户确认'});assert.equal(current(w).date,'2026-09-14');assert.equal(current(w).flag,'已预约');
});
test('drafts are task scoped and overlays do not discard fields',()=>{
  const w=fixture();const root=value=>({querySelectorAll:()=>[{name:'diagnosis',type:'text',value}]});
  w.saveDraft(root('甲任务草稿'),'w-service');w.actAction('task','AZ202609130021');w.saveDraft(root('乙任务草稿'),'w-service');
  const drafts=w.snapshot().drafts;assert.equal(Object.keys(drafts).length,2);assert.deepEqual(Object.values(drafts).map(d=>d.diagnosis),['甲任务草稿','乙任务草稿']);
});
test('completion gates sign-in, product/evidence and forms; stock is consumed exactly once',()=>{
  const w=fixture();assert.throws(()=>w.submitAction('service',{diagnosis:'检查',result:'完成',usage:'none'}),/签到/);
  assert.throws(()=>w.submitAction('completion',{evidenceChecked:true}),/材料/);
  assert.equal(complete(w,'parts'),'w-review');assert.equal(w.activeTasks().length,0);assert.equal(current(w).queue,'review');assert.equal(w.snapshot().inventory.P001,1);
  assert.throws(()=>w.submitAction('completion',{submitChecked:true}),/已提交/);assert.equal(w.snapshot().inventory.P001,1);assert.equal(current(w).versions.length,1);
});
test('completion retains old versions and resubmission never deducts parts again',()=>{
  const w=fixture();complete(w,'parts');const first=JSON.stringify(current(w).versions[0]);w.simulate('returned');
  assert.throws(()=>w.submitAction('resubmit',{note:'补充',confirmed:true}),/材料/);photo(w,'replacement');w.submitAction('resubmit',{note:'清晰铭牌已补充',confirmed:true});
  assert.equal(current(w).versions.length,2);assert.equal(JSON.stringify(current(w).versions[0]),first);assert.equal(w.snapshot().inventory.P001,1);
});
test('approval ends technician work without another submission and closure remains a separate external step',()=>{
  const w=fixture();assert.throws(()=>w.simulate('approved'),/先提交/);complete(w);assert.throws(()=>w.simulate('closed'),/先通过/);w.simulate('approved');assert.equal(current(w).queue,'followup');
  assert.equal(current(w).versions.length,1);assert.throws(()=>w.submitAction('handover',{note:'重复单据',confirmed:true}),/无需再次/);assert.throws(()=>w.simulate('approved'),/先提交/);w.simulate('closed');assert.equal(current(w).queue,'closed');
});
test('parts retain quantities and task association, submit/approval/receipt affect stock at distinct stages',()=>{
  const w=fixture();w.actAction('task-parts');w.actAction('basket-plus','P001');w.actAction('basket-plus','P001');w.actAction('basket-plus','P002');w.submitAction('requisition',{note:'维修领料'});
  let s=w.snapshot(),r=s.records[0];assert.equal(r.items[0].quantity,2);assert.equal(r.taskId,s.taskId);assert.equal(s.inventory.P001,2);
  w.simulate('part-approved');assert.equal(w.snapshot().inventory.P001,2);w.actAction('receive',r.id);assert.equal(w.snapshot().inventory.P001,4);assert.equal(w.snapshot().inventory.P002,2);
  assert.throws(()=>w.actAction('receive',r.id),/再次确认/);assert.equal(w.snapshot().inventory.P001,4);
});
test('empty/zero-stock requisitions, returns above stock and duplicate pending returns are blocked',()=>{
  const w=fixture();assert.throws(()=>w.submitAction('requisition',{}),/至少/);w.actAction('basket-plus','P003');assert.throws(()=>w.submitAction('requisition',{}),/至少/);
  assert.throws(()=>w.submitAction('return',{quantity:3,note:'退回'}),/数量/);w.submitAction('return',{quantity:1,note:'剩余未使用'});assert.equal(w.snapshot().inventory.P001,2);
  assert.throws(()=>w.submitAction('return',{quantity:1,note:'重复'}),/已有/);w.simulate('part-approved');assert.equal(w.snapshot().inventory.P001,1);assert.throws(()=>w.simulate('part-approved'),/处理中/);
});
test('rejection, cancellation and transfer receipts do not conflate inventory operations',()=>{
  const w=fixture();w.actAction('basket-plus','P001');w.submitAction('requisition',{});w.simulate('part-rejected');assert.equal(w.snapshot().inventory.P001,2);
  w.actAction('basket-plus','P001');w.submitAction('requisition',{});const id=w.snapshot().recordId;w.actAction('confirm-cancel',id);assert.equal(w.snapshot().inventory.P001,2);assert.equal(w.snapshot().records[1].status,'已撤销');
  w.simulate('transfer');w.actAction('receive',w.snapshot().recordId);assert.equal(w.snapshot().inventory.P002,2);
});
test('cancellation recovery remains a request and does not invent a target queue',()=>{
  const w=fixture();w.submitAction('exception',{flag:'已取消',reason:'客户申请取消'});w.submitAction('restore',{reason:'客户要求继续',confirmed:true});assert.equal(current(w).queue,'cancelled');assert.equal(current(w).restoreRequested,true);
});
test('remote guidance skips arrival and onsite evidence but requires service and product evidence',()=>{
  const w=fixture();w.actAction('task','ZD202609130008');w.submitAction('service',{diagnosis:'电话指导',result:'已解释设置',usage:'none'});w.submitAction('completion',{evidenceChecked:true});
  w.submitAction('completion',{serial:'DEMO-REMOTE',noRfidReason:'远程无法读取'});w.submitAction('completion',{result:'指导完成',confirmation:'confirmed',confirmationNote:'电话确认'});w.submitAction('completion',{submitChecked:true});assert.equal(current(w).queue,'review');assert.equal(current(w).signed,false);
});
test('company switching and logout clear tenant context and block historical deep links',()=>{
  const w=fixture();w.actAction('task-parts');w.actAction('basket-plus','P001');w.submitAction('requisition',{});
  w.submitAction('company',{company:'苏州示例服务企业',confirmed:true});assert.equal(w.snapshot().tasks.length,0);assert.equal(w.snapshot().records.length,0);assert.equal(w.snapshot().linkTask,null);assert.equal(w.snapshot().inventory.P001,0);assert.throws(()=>w.submitAction('requisition',{}),/暂无授权/);
  w.actAction('logout');assert.equal(w.guard('w-detail'),'w-login');assert.equal(w.guard('c-home'),'c-home');w.actAction('login');assert.equal(w.guard('w-apps'),'w-mine');
});
test('feedback is inspectable locally and credential demo validates old password and repeated new password',()=>{
  const w=fixture();w.actAction('feedback-media');w.submitAction('feedback',{note:'原型问题示例',phone:'13800000000'});assert.equal(w.snapshot().feedback[0].media,true);
  assert.throws(()=>w.submitAction('password',{old:'bad',next:'NewDemo123',confirm:'NewDemo123'}),/旧密码/);assert.throws(()=>w.submitAction('password',{old:'Demo1234',next:'NewDemo123',confirm:'different'}),/两次一致/);
  assert.equal(w.submitAction('password',{old:'Demo1234',next:'NewDemo123',confirm:'NewDemo123'}),'w-mine');
});
