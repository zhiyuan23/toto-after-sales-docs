'use strict';
const {readFileSync}=require('node:fs');
const {resolve}=require('node:path');
const vm=require('node:vm');
const test=require('node:test');
const assert=require('node:assert/strict');
const CHEN='WX202609130018',LIN='AZ202609130021',ZHOU='WX202609120007';
function fixture(){const window={};for(const f of ['worker.js','worker-map.js'])vm.runInNewContext(readFileSync(resolve(__dirname,'../'+f),'utf8'),{window});return {w:window.TOTO_WORKER,m:window.TOTO_WORKER_MAP};}
const ids=list=>Array.from(list,t=>t.id);

test('map uses the WeChat-native marker, location and include-points capability boundary',()=>{
  const {m,w}=fixture();m.open();const html=m.render();
  assert.match(html,/data-native-component="map"/);assert.match(html,/data-map-bindings="markers show-location include-points bindmarkertap"/);
  assert.match(html,/data-marker-id="WX202609130018"[^>]+data-latitude="31\.1818"[^>]+data-longitude="121\.4426"/);
  assert.doesNotMatch(html,/今日路线|驾车|步行|预览路线|里程|多站|data-wmap="(?:calculate|mode|up|remove|restore|zoom)"/);
  assert.match(html,/data-wmap="locate"/);assert.match(html,/data-wmap="fit"/);
  assert.equal(m.rows().length,7);assert.equal(m.groups().length,5);assert.equal(m.snapshot().selected,CHEN);assert.equal(m.point(m.rows().find(t=>t.id===ZHOU)),null);
  w.actAction('queue','returned');m.render();assert.equal(m.rows().length,1);assert.equal(m.groups().length,1);
  w.submitAction('task-search',{search:'no-match'});m.render();assert.equal(m.groups().length,0);assert.equal(m.snapshot().selected,null);
});

test('selected native marker and detail navigation refer to the same authorized task',()=>{
  const {m,w}=fixture();m.open();const before=JSON.stringify(w.snapshot().tasks);m.act('select',LIN);assert.equal(m.snapshot().selected,LIN);assert.equal(w.snapshot().taskId,CHEN);
  assert.equal(m.act('detail',LIN),'w-detail');assert.equal(w.snapshot().taskId,LIN);assert.equal(JSON.stringify(w.snapshot().tasks),before);assert.throws(()=>m.act('select','unknown'),/授权/);
  w.actAction('location');assert.equal(m.rows().length,1);assert.equal(m.rows()[0].id,LIN);assert.equal(m.snapshot().view,'map');
});

test('same-coordinate tasks are aggregated without inventing coordinates for missing addresses',()=>{
  const {m}=fixture();m.open();m.simulate('scenario','overlap');const group=m.groups().find(g=>g.ids.length===2);assert.ok(group);m.act('group',group.ids.join(','));assert.equal(m.snapshot().group.length,2);
  m.act('select',LIN);assert.equal(m.snapshot().selected,LIN);assert.equal(m.snapshot().group.length,0);m.simulate('scenario','missing');assert.equal(m.groups().length,0);assert.throws(()=>m.act('native',LIN),/核实/);
});

test('location permission outcomes never block viewing authorized task markers',()=>{
  for(const outcome of ['denied','failed']){const {m}=fixture();m.open();m.simulate('location',outcome);m.act('locate');assert.equal(m.snapshot().location,outcome);assert.equal(m.groups().length,5);assert.match(m.render(),outcome==='denied'?/未开启位置权限/:/定位暂不可用/);}
  const {m}=fixture();m.open();m.act('locate');assert.equal(m.snapshot().location,'ready');assert.match(m.render(),/class="wm-origin"/);
});

test('fit-all maps to includePoints without custom zoom state or task mutation',()=>{
  const {m,w}=fixture();m.open();const before=JSON.stringify(w.snapshot()),selected=m.snapshot().selected;m.act('fit');assert.equal(m.snapshot().fitRevision,1);assert.equal(m.snapshot().selected,selected);assert.equal(JSON.stringify(w.snapshot()),before);assert.ok(!Object.hasOwn(m.snapshot(),'zoom'));
});

test('wx.openLocation handoff is destination-specific and does not claim in-app routing',()=>{
  const {m,w}=fixture();m.open();const before=JSON.stringify(w.snapshot());m.act('native',LIN);assert.equal(m.snapshot().modal.id,LIN);const overlay=m.overlay();assert.match(overlay,/wx\.openLocation/);assert.match(overlay,/漕溪示例苑/);assert.doesNotMatch(overlay,/小程序已开始导航/);
  m.act('native-return');assert.equal(m.overlay(),'');assert.equal(JSON.stringify(w.snapshot()),before);assert.throws(()=>m.act('native',ZHOU),/核实/);
});

test('company switch and logout clear location, selection, markers and customer context',()=>{
  const {m,w}=fixture();m.open();m.act('locate');m.act('native',LIN);
  w.submitAction('company',{company:'苏州示例服务企业',confirmed:true});assert.equal(m.rows().length,0);assert.equal(m.groups().length,0);assert.equal(m.snapshot().location,'idle');assert.equal(m.snapshot().modal,null);assert.equal(m.snapshot().selected,null);
  w.actAction('logout');assert.equal(m.groups().length,0);
});
