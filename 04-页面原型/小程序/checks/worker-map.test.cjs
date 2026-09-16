'use strict';
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const CHEN='WX202609130018',LIN='AZ202609130021',ZHOU='WX202609120007';
function fixture(){const window={};for(const f of ['worker.js','worker-map.js'])vm.runInNewContext(readFileSync(resolve(__dirname,'../'+f),'utf8'),{window});return {w:window.TOTO_WORKER,m:window.TOTO_WORKER_MAP};}
const ids=list=>Array.from(list,t=>t.id);
test('map shares task filtering, excludes remote and missing coordinates from markers',()=>{
  const {m,w}=fixture();m.open();assert.equal(m.rows().length,7);assert.equal(m.groups().length,5);assert.equal(m.snapshot().selected,CHEN);assert.equal(m.point(m.rows().find(t=>t.id===ZHOU)),null);
  w.actAction('queue','returned');m.render();assert.equal(m.rows().length,1);assert.equal(m.groups().length,1);
  w.submitAction('task-search',{search:'no-match'});m.render();assert.equal(m.groups().length,0);assert.equal(m.snapshot().selected,null);
});
test('selected marker and detail navigation refer to the same task without implicit business mutation',()=>{
  const {m,w}=fixture();m.open();const before=JSON.stringify(w.snapshot().tasks);m.act('select',LIN);assert.equal(m.snapshot().selected,LIN);assert.equal(w.snapshot().taskId,CHEN);
  assert.equal(m.act('detail',LIN),'w-detail');assert.equal(w.snapshot().taskId,LIN);assert.equal(JSON.stringify(w.snapshot().tasks),before);assert.throws(()=>m.act('select','unknown'),/授权/);
  w.actAction('location');assert.equal(m.rows().length,1);assert.equal(m.rows()[0].id,LIN);
});
test('overlapping coordinates preserve distinct tasks; missing coordinates never get fake pins',()=>{
  const {m}=fixture();m.open();m.simulate('scenario','overlap');const group=m.groups().find(g=>g.ids.length===2);assert.ok(group);m.act('group',group.ids.join(','));assert.equal(m.snapshot().group.length,2);
  m.act('select',LIN);assert.equal(m.snapshot().selected,LIN);assert.equal(m.snapshot().group.length,0);m.simulate('scenario','missing');assert.equal(m.groups().length,0);assert.throws(()=>m.act('single'),/待核实/);
});
test('entering route does not request location; denied/failed location allows station origin fallback',()=>{
  const {m}=fixture();m.open();m.act('single');assert.equal(m.snapshot().location,'idle');m.act('calculate');assert.match(m.snapshot().error,/出发位置/);
  for(const outcome of ['denied','failed']){m.simulate('location',outcome);m.act('locate');assert.equal(m.snapshot().origin,null);assert.equal(m.snapshot().location,outcome);m.act('origin','station');m.act('calculate');assert.ok(m.snapshot().route);}
  m.simulate('location','success');m.act('locate');assert.equal(m.snapshot().origin,'device');assert.equal(m.snapshot().route,null);
});
test('mode, destination, origin and stop order changes invalidate previous route metrics',()=>{
  const {m}=fixture();m.open();m.act('today');assert.deepEqual(Array.from(m.snapshot().stops),[CHEN,LIN]);m.act('origin','station');m.act('calculate');const original=m.snapshot().route;assert.ok(original.example);
  m.act('mode','walking');assert.equal(m.snapshot().route,null);m.act('calculate');assert.ok(m.snapshot().route.minutes>original.minutes);
  m.act('up',LIN);assert.equal(m.snapshot().route,null);assert.deepEqual(Array.from(m.snapshot().stops),[LIN,CHEN]);m.act('calculate');m.act('origin','station');assert.equal(m.snapshot().route,null);
});
test('multi-stop editing is local and never rewrites appointments, supports removing all and restoring',()=>{
  const {m,w}=fixture();m.open();const before=JSON.stringify(w.snapshot().tasks);m.act('today');m.act('up',LIN);m.act('remove',CHEN);m.act('remove',CHEN);assert.equal(m.snapshot().stops.length,1);
  m.act('remove',LIN);m.act('origin','station');m.act('calculate');assert.equal(m.snapshot().route,null);assert.match(m.snapshot().error,/至少一个/);m.act('restore');assert.deepEqual(Array.from(m.snapshot().stops),[CHEN,LIN]);assert.equal(JSON.stringify(w.snapshot().tasks),before);
});
test('route failure clears obsolete geometry, retains stops and supports retry',()=>{
  const {m}=fixture();m.open();m.act('today');m.act('origin','station');m.act('calculate');const stops=m.snapshot().stops;
  for(const outcome of ['failed','no-route']){m.simulate('route',outcome);m.act('calculate');assert.equal(m.snapshot().route,null);assert.ok(m.snapshot().error);assert.deepEqual(m.snapshot().stops,stops);}
  m.simulate('route','success');m.act('calculate');assert.ok(m.snapshot().route);assert.equal(m.snapshot().error,'');
});
test('native handoff is destination specific; returning preserves route and never signs in',()=>{
  const {m,w}=fixture();m.open();m.act('today');m.act('origin','station');m.act('calculate');const before=JSON.stringify(w.snapshot()),route=m.snapshot().route;
  m.act('native',LIN);assert.equal(m.snapshot().modal.id,LIN);assert.match(m.overlay(),/漕溪示例苑/);m.act('native-return');assert.equal(m.overlay(),'');assert.deepEqual(m.snapshot().route,route);assert.equal(JSON.stringify(w.snapshot()),before);
  assert.throws(()=>m.act('native',ZHOU),/核实/);
});
test('changed appointment or task filter cannot retain stale route destinations',()=>{
  const {m,w}=fixture();m.open();m.act('today');m.act('origin','station');m.act('calculate');w.actAction('task',LIN);w.submitAction('appointment',{result:'later',note:'等待客户确认'});m.render();assert.deepEqual(Array.from(m.snapshot().stops),[CHEN]);assert.equal(m.snapshot().route,null);
});
test('company switch and logout remove location, route, selection, markers and customer context',()=>{
  const {m,w}=fixture();m.open();m.act('today');m.act('locate');m.act('calculate');m.act('native',LIN);
  w.submitAction('company',{company:'苏州示例服务企业',confirmed:true});assert.equal(m.rows().length,0);assert.equal(m.groups().length,0);assert.equal(m.snapshot().origin,null);assert.equal(m.snapshot().route,null);assert.equal(m.snapshot().modal,null);assert.equal(m.snapshot().stops.length,0);
  m.act('today');m.act('origin','station');m.act('calculate');assert.equal(m.snapshot().route,null);w.actAction('logout');assert.equal(m.groups().length,0);
});
