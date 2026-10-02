'use strict';
// Review-only fictional data. No API, real account data, or persistent storage.
(() => {
const products=[['smart-toilet','智能一体型座便器'],['washlet','智能座便盖'],['toilet','普通座便器'],['faucet-shower','龙头与淋浴'],['bathtub','浴缸'],['bathroom-heater','浴室暖风设备'],['bathroom-space','整体卫浴']];
const plans=[['none','暂无购买计划'],['undecided','时间未定'],['within-3-months','3个月内'],['3-to-6-months','3～6个月'],['after-6-months','6个月以后'],['','未填写']];
const scenes=[['new-home','新房装修'],['renovation','旧房翻新'],['replacement','现有产品换新']];
const rows=[
['辽宁省','40～49岁',['washlet','smart-toilet'],'within-3-months',['replacement']],
['浙江省','30～39岁',['smart-toilet'],'undecided',['new-home']],
['广东省','30～39岁',['faucet-shower','bathtub'],'3-to-6-months',['renovation']],
['辽宁省','18～29岁',[], '',[]],
['浙江省','50～59岁',[], 'none',[],true],
['广东省','40～49岁',['smart-toilet','washlet','faucet-shower'],'within-3-months',['new-home']],
['辽宁省','18～29岁',['bathtub'],'after-6-months',['renovation']],
['未填写','未填写',['bathroom-heater'],'',['replacement']],
['广东省','18～29岁',[],'undecided',['new-home']],
['未填写','未填写',[],'',[]],
['浙江省','60岁以上',['washlet'],'within-3-months',['replacement']],
['广东省','50～59岁',['bathroom-space'],'after-6-months',['renovation']],
].map(([province,age,interests,plan,usageScenes,explicitNone],i)=>({id:i+1,name:`演示会员 ${String(i+1).padStart(3,'0')}`,province,age,interests,plan,usageScenes,interestsAnswered:interests.length>0 || Boolean(explicitNone),updatedAt:interests.length || plan || usageScenes.length?'2026-09-29 10:30':'未填写'}));
const $=s=>document.querySelector(s),escape=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let view='statistics';
const label=(options,id)=>options.find(([key])=>key===id)?.[1] || '未填写';
const answered=r=>r.interestsAnswered || Boolean(r.plan) || r.usageScenes.length>0;
const percent=(n,total)=>total?`${(100*n/total).toFixed(1)}%`:'—';
function bars(options,list,getter){return options.map(([id,title])=>{const n=list.filter(r=>getter(r,id)).length;return `<div class="bar-line ${id===''?'unknown':''}"><div class="bar-title"><span>${escape(title)}</span><b>${n}<i>${percent(n,list.length)}</i></b></div><div class="bar-track" role="img" aria-label="${escape(title)}：${n}人，占${percent(n,list.length)}"><span style="width:${list.length?100*n/list.length:0}%"></span></div></div>`;}).join('');}
function render(){const list=rows.filter(r=>(!$('#province').value || r.province===$('#province').value)&&(!$('#age').value || r.age===$('#age').value));const total=list.length,responded=list.filter(answered).length,interested=list.filter(r=>r.interestsAnswered).length,planned=list.filter(r=>r.plan).length,near=list.filter(r=>r.plan==='within-3-months').length;
$('#cohort').textContent=`当前人群 ${total} 人`;$('#metrics').innerHTML=[['当前会员',total,'地区／年龄筛选后的有效账号'],['已填写调查',responded,`填写率 ${percent(responded,total)}`],['已填写产品偏好',interested,`包括明确选择暂无偏好 · ${percent(interested,total)}`],['自报3个月内购买',near,`占已填写购买计划的 ${percent(near,planned)}`]].map(([name,n,note])=>`<article class="metric"><span>${name}</span><strong>${n}</strong><small>${note}</small></article>`).join('');
$('#interest-chart').innerHTML=bars(products,list,(r,id)=>r.interests.includes(id));$('#interest-status').textContent=`未填写 ${list.filter(r=>!r.interestsAnswered).length} 人 · 暂无明确偏好 ${list.filter(r=>r.interestsAnswered && !r.interests.length).length} 人`;
$('#plan-chart').innerHTML=bars(plans,list,(r,id)=>r.plan===id);$('#scene-chart').innerHTML=bars(scenes,list,(r,id)=>r.usageScenes.includes(id));$('#scene-status').textContent=`未填写 ${list.filter(r=>!r.usageScenes.length).length} 人`;
const cross=$('#cross-dimension').value;
const dimensions={plan:{title:'购买计划',options:plans,matches:(r,id)=>r.plan===id},province:{title:'所在省份',options:['辽宁省','浙江省','广东省','未填写'].map(v=>[v,v]),matches:(r,id)=>r.province===id},age:{title:'年龄段',options:['18岁以下','18～29岁','30～39岁','40～49岁','50～59岁','60岁以上','未填写'].map(v=>[v,v]),matches:(r,id)=>r.age===id},scene:{title:'使用场景',options:[...scenes,['','未填写']],matches:(r,id)=>id?r.usageScenes.includes(id):!r.usageScenes.length}};
const dimension=dimensions[cross];$('#matrix-title').textContent='品类 × '+dimension.title;
$('#matrix').innerHTML=`<thead><tr><th>关注的产品</th>${dimension.options.map(([,name])=>`<th>${escape(name)}</th>`).join('')}</tr></thead><tbody>${products.map(([id,title])=>`<tr><td>${title}</td>${dimension.options.map(([key])=>`<td>${list.filter(r=>r.interests.includes(id) && dimension.matches(r,key)).length}</td>`).join('')}</tr>`).join('')}</tbody>`;
$('#archive').innerHTML=`<thead><tr><th>会员</th><th>所在省份</th><th>关注的产品</th><th>购买计划</th><th>使用场景</th><th>最近偏好更新</th></tr></thead><tbody>${list.length?list.map(r=>`<tr><td><button class="archive-button" data-member="${r.id}">${escape(r.name)}</button></td><td>${r.province}</td><td>${r.interests.map(id=>label(products,id)).join('、') || (r.interestsAnswered?'暂无明确偏好':'未填写')}</td><td>${label(plans,r.plan)}</td><td>${r.usageScenes.map(id=>label(scenes,id)).join('、') || '未填写'}</td><td>${r.updatedAt}</td></tr>`).join(''):'<tr><td colspan="6" class="empty">当前筛选条件下暂无会员，可重置筛选。</td></tr>'}</tbody>`;
$('#statistics-view').hidden=view!=='statistics';$('#archive-view').hidden=view!=='archive';document.querySelectorAll('[data-view]').forEach(b=>{if(b.dataset.view===view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});}
$('#cross-dimension').addEventListener('change',render);$('#province').addEventListener('change',render);$('#age').addEventListener('change',render);$('#reset').addEventListener('click',()=>{$('#province').value='';$('#age').value='';render();});
function openMember(id){const r=rows.find(row=>row.id===id);if(!r)return;window.memberDetailPrototype.open({...r,productLabels:Object.fromEntries(products),sceneLabels:Object.fromEntries(scenes),planLabel:label(plans,r.plan)});}
document.addEventListener('click',e=>{const tab=e.target.closest('[data-view]');if(tab){view=tab.dataset.view;render();}const button=e.target.closest('[data-member]');if(button)openMember(Number(button.dataset.member));});
$('#close-detail').addEventListener('click',()=>$('#member-detail').close());
const previewId=Number(location.hash.match(/^#member-(\d+)$/)?.[1]);if(previewId)view='archive';render();if(previewId)openMember(previewId);
})();
