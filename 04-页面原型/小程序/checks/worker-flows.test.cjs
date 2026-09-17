'use strict';
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
function fixture(){const window={};vm.runInNewContext(readFileSync(resolve(__dirname,'../worker.js'),'utf8'),{window});return window.TOTO_WORKER;}
const current=w=>w.snapshot().tasks.find(t=>t.id===w.snapshot().taskId);
const req=(w,extra={})=>w.submitAction('requisition',{workOrder:w.snapshot().taskId,note:'维修领料',...extra});
const photo=(w,k)=>{w.simulate('upload-fail');w.actAction('media',k);assert.equal(current(w).media[k],'failed');w.actAction('media',k);assert.equal(current(w).media[k],'ready');};
function complete(w,usage='none'){
  w.actAction('sign');w.submitAction('service',{diagnosis:'演示检测',result:'已处理并试运行',usage,quantity:1});
  photo(w,'site');photo(w,'label');w.submitAction('service',{serial:'DEMO-001',noRfidReason:'无标签，待人工核验',confirmation:'confirmed',confirmationNote:'客户现场确认'});
  return w.submitAction('service',{});
}
test('queue, substatus, search and counts use the same tasks',()=>{
  const w=fixture();assert.equal(w.filteredTasks().length,7);w.actAction('queue','returned');assert.equal(w.filteredTasks().length,1);assert.equal(w.filteredTasks()[0].queue,'pending');
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
  const missing=fixture();assert.throws(()=>missing.submitAction('service',{diagnosis:'检查',result:'完成',usage:'none'}),/签到/);
  missing.actAction('sign');missing.submitAction('service',{diagnosis:'检查',result:'完成',usage:'none'});assert.throws(()=>missing.submitAction('service',{}),/材料/);
  const w=fixture();
  assert.equal(complete(w,'parts'),'w-review');assert.equal(w.activeTasks().length,0);assert.equal(current(w).queue,'review');assert.equal(w.snapshot().inventory.P001,1);
  assert.throws(()=>w.submitAction('service',{}),/当前任务|已提交/);assert.equal(w.snapshot().inventory.P001,1);assert.equal(current(w).versions.length,1);
});
test('completion retains old versions and resubmission never deducts parts again',()=>{
  const w=fixture();complete(w,'parts');const first=JSON.stringify(current(w).versions[0]);w.simulate('returned');
  assert.throws(()=>w.submitAction('resubmit',{note:'补充'}),/材料/);photo(w,'replacement');w.submitAction('resubmit',{note:'清晰铭牌已补充'});
  assert.equal(current(w).versions.length,2);assert.equal(JSON.stringify(current(w).versions[0]),first);assert.equal(w.snapshot().inventory.P001,1);
});
test('approval ends technician work without another submission and closure remains a separate external step',()=>{
  const w=fixture();assert.throws(()=>w.simulate('approved'),/先提交/);complete(w);assert.throws(()=>w.simulate('closed'),/先通过/);w.simulate('approved');assert.equal(current(w).queue,'followup');
  assert.equal(current(w).versions.length,1);assert.throws(()=>w.submitAction('handover',{note:'重复单据',confirmed:true}),/无需再次/);assert.throws(()=>w.simulate('approved'),/先提交/);w.simulate('closed');assert.equal(current(w).queue,'closed');
});
test('parts retain quantities and task association while approval updates stock once',()=>{
  const w=fixture();w.actAction('task-parts');w.actAction('basket-plus','P001');w.actAction('basket-plus','P001');w.actAction('basket-plus','P002');req(w);
  let s=w.snapshot(),r=s.records[0];assert.equal(r.items[0].quantity,2);assert.equal(r.taskId,s.taskId);assert.equal(s.inventory.P001,2);
  w.simulate('part-approved');assert.equal(w.snapshot().inventory.P001,4);assert.equal(w.snapshot().inventory.P002,2);assert.equal(w.snapshot().stationInventory.P001,6);
  assert.equal(w.snapshot().inventory.P001,4);
});
test('empty requisitions and returns are blocked while pending returns reserve personal stock',()=>{
  const w=fixture();assert.throws(()=>w.submitAction('requisition',{}),/关联工单/);w.actAction('basket-plus','P003');assert.throws(()=>req(w),/至少/);
  assert.throws(()=>w.submitAction('return',{workOrder:w.snapshot().taskId,note:'剩余未使用'}),/至少/);
  for(let i=0;i<3;i++)w.actAction('return-plus','P001');w.actAction('return-plus','P002');assert.equal(JSON.stringify(w.snapshot().returnBasket),JSON.stringify({P001:2,P002:1}));
  w.submitAction('return',{workOrder:w.snapshot().taskId,note:'多项剩余配件退回'});assert.equal(w.snapshot().inventory.P001,2);assert.equal(w.snapshot().records[0].items.length,2);
  w.actAction('return-plus','P001');assert.equal(Object.keys(w.snapshot().returnBasket).length,0);assert.throws(()=>w.submitAction('return',{workOrder:w.snapshot().taskId,note:'重复退料'}),/至少/);
  w.simulate('part-approved');assert.equal(w.snapshot().inventory.P001,0);assert.equal(w.snapshot().inventory.P002,0);assert.equal(w.snapshot().stationInventory.P001,10);assert.throws(()=>w.simulate('part-approved'),/处理中/);
});
test('standby stock replenishment requires a reason but not a work order',()=>{
  const w=fixture();w.actAction('requisition-purpose','stock');w.actAction('basket-plus','P001');assert.throws(()=>w.submitAction('requisition',{purpose:'stock'}),/补充原因/);
  w.submitAction('requisition',{purpose:'stock',note:'补充常用维修备件'});const r=w.snapshot().records[0];assert.equal(r.purpose,'stock');assert.equal(r.taskId,'');assert.equal(r.note,'补充常用维修备件');
  w.simulate('part-approved');assert.equal(w.snapshot().inventory.P001,3);assert.equal(w.snapshot().stationInventory.P001,7);
});
test('rejection and cancellation do not change inventory',()=>{
  const w=fixture();w.actAction('basket-plus','P001');req(w);w.simulate('part-rejected');assert.equal(w.snapshot().inventory.P001,2);
  w.actAction('basket-plus','P001');req(w);const id=w.snapshot().recordId;w.actAction('confirm-cancel',id);assert.equal(w.snapshot().inventory.P001,2);assert.equal(w.snapshot().records[1].status,'已撤销');
  assert.throws(()=>w.simulate('transfer'),/请选择一个后台结果/);assert.equal(w.snapshot().inventory.P002,1);
});
test('cancellation recovery remains a request and does not invent a target queue',()=>{
  const w=fixture();w.submitAction('exception',{flag:'已取消',reason:'客户申请取消'});w.submitAction('restore',{reason:'客户要求继续',confirmed:true});assert.equal(current(w).queue,'cancelled');assert.equal(current(w).restoreRequested,true);
});
test('remote guidance skips arrival and onsite evidence but requires service and product evidence',()=>{
  const w=fixture();w.actAction('task','ZD202609130008');w.submitAction('service',{diagnosis:'电话指导',result:'已解释设置',usage:'none'});
  w.submitAction('service',{serial:'DEMO-REMOTE',noRfidReason:'远程无法读取',confirmation:'confirmed',confirmationNote:'电话确认'});w.submitAction('service',{});assert.equal(current(w).queue,'review');assert.equal(current(w).signed,false);
});
test('company switching and logout clear tenant context and block historical deep links',()=>{
  const w=fixture();w.actAction('task-parts');w.actAction('basket-plus','P001');req(w);
  w.submitAction('company',{company:'苏州示例服务企业',confirmed:true});assert.equal(w.snapshot().tasks.length,0);assert.equal(w.snapshot().records.length,0);assert.equal(w.snapshot().linkTask,null);assert.equal(w.snapshot().inventory.P001,0);assert.throws(()=>w.submitAction('requisition',{}),/暂无授权/);
  w.actAction('logout');assert.equal(w.guard('w-detail'),'w-login');assert.equal(w.guard('c-home'),'c-home');w.actAction('login');assert.equal(w.guard('w-apps'),'w-mine');
});
test('feedback is inspectable locally and credential demo validates old password and repeated new password',()=>{
  const w=fixture();w.actAction('feedback-media');w.submitAction('feedback',{note:'原型问题示例',phone:'13800000000'});assert.equal(w.snapshot().feedback[0].media,true);
  assert.throws(()=>w.submitAction('password',{old:'bad',next:'NewDemo123',confirm:'NewDemo123'}),/旧密码/);assert.throws(()=>w.submitAction('password',{old:'Demo1234',next:'NewDemo123',confirm:'different'}),/两次一致/);
  assert.equal(w.submitAction('password',{old:'Demo1234',next:'NewDemo123',confirm:'NewDemo123'}),'w-mine');
});
