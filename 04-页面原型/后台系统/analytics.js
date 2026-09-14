(function(){
'use strict'
const icons={
 'arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>','arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>',archive:'<rect x="3" y="5" width="18" height="15" rx="2"/><path d="M3 9h18M9 13h6M5 2h14"/>',building:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M9 21v-4h6v4M8 7h.01M12 7h.01M16 7h.01M8 11h.01M12 11h.01M16 11h.01"/>',calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',chart:'<path d="M3 3v18h18M7 16l4-5 4 3 5-7"/>','chevron-down':'<path d="m6 9 6 6 6-6"/>','chevron-right':'<path d="m9 18 6-6-6-6"/>',clipboard:'<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4.5V3h6v1.5M9 9h6M9 13h6M9 17h4"/>',database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.66 3.58 3 8 3s8-1.34 8-3V5M4 11v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6"/>',download:'<path d="M12 3v12M7 10l5 5 5-5M5 21h14"/>','file-chart':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 18v-3M12 18v-6M16 18v-8"/>',flask:'<path d="M9 3h6M10 9V3h4v6l5 9a2 2 0 0 1-1.74 3H6.74A2 2 0 0 1 5 18Z"/><path d="M7.5 15h9"/>',gauge:'<path d="M20.38 8.57a9 9 0 1 0 .13 6.58"/><path d="m12 12 4-4"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',layout:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M9 9h12"/>',maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>',moon:'<path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5 9 9 0 1 0 20.5 14.5Z"/>','panel-left':'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M14 9l-3 3 3 3"/>',receipt:'<path d="M6 3h12v18l-3-2-3 2-3-2-3 2Z"/><path d="M9 8h6M9 12h6M9 16h4"/>',refresh:'<path d="M20 7h-5V2M4 17h5v5"/><path d="M5.2 9A8 8 0 0 1 18 5l2 2M18.8 15A8 8 0 0 1 6 19l-2-2"/>',scan:'<path d="M3 7V5a2 2 0 0 1 2-2h2M17 3h2a2 2 0 0 1 2 2v2M21 17v2a2 2 0 0 1-2 2h-2M7 21H5a2 2 0 0 1-2-2v-2M7 12h10"/>',search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>',store:'<path d="M3 9l2-6h14l2 6M5 13v8h14v-8M9 21v-6h6v6"/><path d="M3 9a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>','triangle-alert':'<path d="m21.7 18-8-14a2 2 0 0 0-3.4 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3Z"/><path d="M12 9v4M12 17h.01"/>',wrench:'<path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L4 17a2 2 0 1 0 3 3l7.7-8.3a4 4 0 0 0 0-5.4Z"/>',x:'<path d="M18 6 6 18M6 6l12 12"/>'
}
const svgIcon=name=>`<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]||''}</svg>`
const $=id=>document.getElementById(id)
document.querySelectorAll('[data-icon]').forEach(node=>{if(icons[node.dataset.icon])node.innerHTML=svgIcon(node.dataset.icon)})
let toastTimer,currentState='data',drawerContext=null
const page=document.documentElement.dataset.analyticsPage

const qualityData={
 region:[
  {id:'R-EAST',code:'REG-EAST',name:'华东大区',date:'09/12',volume:682,timely:94.72,firstFix:91.08,rating:4.82,complaints:8,trend:[91.8,93.1,92.7,94.2,93.8,94.1,94.72]},
  {id:'R-SOUTH',code:'REG-SOUTH',name:'华南大区',date:'09/12',volume:537,timely:92.36,firstFix:89.73,rating:4.76,complaints:11,trend:[90.5,91.2,92.1,91.7,92.6,91.9,92.36]},
  {id:'R-NORTH',code:'REG-NORTH',name:'华北大区',date:'09/12',volume:496,timely:90.18,firstFix:87.91,rating:4.68,complaints:13,trend:[89.4,90.2,89.8,90.6,91.1,90.7,90.18]},
  {id:'R-CENTRAL',code:'REG-CENTRAL',name:'华中大区',date:'09/12',volume:421,timely:91.54,firstFix:88.65,rating:4.71,complaints:9,trend:[90.1,90.8,91.4,90.9,91.8,91.2,91.54]},
  {id:'R-WEST',code:'REG-WEST',name:'西部大区',date:'09/12',volume:308,timely:88.73,firstFix:86.42,rating:4.63,complaints:14,trend:[87.9,88.6,87.8,89.1,88.4,89.0,88.73]}
 ],
 station:[
  {id:'S-001',code:'SH-PD-001',name:'上海浦东授权服务站',date:'09/12',volume:126,timely:96.03,firstFix:93.65,rating:4.88,complaints:1,trend:[94.3,95.1,94.8,95.7,96.2,95.5,96.03]},
  {id:'S-002',code:'HZ-GS-002',name:'杭州拱墅授权服务站',date:'09/12',volume:109,timely:94.50,firstFix:91.74,rating:4.81,complaints:2,trend:[92.7,93.5,94.1,93.8,94.9,94.2,94.5]},
  {id:'S-003',code:'GZ-TH-003',name:'广州天河授权服务站',date:'09/12',volume:98,timely:92.86,firstFix:90.82,rating:4.75,complaints:3,trend:[91.2,92.1,91.8,92.4,93.1,92.6,92.86]},
  {id:'S-004',code:'BJ-CY-004',name:'北京朝阳授权服务站',date:'09/12',volume:93,timely:89.25,firstFix:86.02,rating:4.62,complaints:5,trend:[88.7,89.1,88.4,90.0,89.6,88.9,89.25]},
  {id:'S-005',code:'CD-GX-005',name:'成都高新授权服务站',date:'09/12',volume:81,timely:87.65,firstFix:84.00,rating:4.55,complaints:6,trend:[86.8,87.5,88.0,87.1,88.4,87.9,87.65]}
 ],
 personnel:[
  {id:'P-001',code:'EMP-0218',name:'陈师傅',date:'09/12',volume:12,timely:100,firstFix:91.67,rating:4.92,complaints:0,trend:[91.7,100,100,92.3,100,100,100]},
  {id:'P-002',code:'EMP-0361',name:'周师傅',date:'09/12',volume:11,timely:90.91,firstFix:90.91,rating:4.86,complaints:0,trend:[90.9,91.7,92.3,90.0,91.7,90.9,90.91]},
  {id:'P-003',code:'EMP-0177',name:'林师傅',date:'09/12',volume:10,timely:90.00,firstFix:80.00,rating:4.70,complaints:1,trend:[88.9,90.0,90.9,89.0,91.0,90.0,90.0]},
  {id:'P-004',code:'EMP-0422',name:'徐师傅',date:'09/12',volume:9,timely:88.89,firstFix:88.89,rating:4.67,complaints:1,trend:[87.5,88.9,90.0,87.5,88.9,90.0,88.89]},
  {id:'P-005',code:'EMP-0098',name:'王师傅',date:'09/12',volume:8,timely:87.50,firstFix:75.00,rating:4.50,complaints:2,trend:[85.7,87.5,88.9,86.7,87.5,88.9,87.5]}
 ]
}
const objectTypeLabels={region:'区域',station:'服务站',personnel:'服务人员'}
const serviceTypeLabels={all:'全部类型',INSTALLATION:'安装',REPAIR:'维修',GUIDANCE:'指导'}
const sourceLabels={all:'全部来源',CONSUMER:'消费者',DEALER:'门店',CUSTOMER_SERVICE:'客服'}
let appliedQuality={date:'2026-09-12',type:'region',keyword:''}
let qualityType='region',qualityRows=qualityData.region,selectedQuality=qualityRows[0],qualityMetric='timely'

const reportDimensions={
 date:{label:'日期',groups:[['08/15—08/21',774,598,21,15],['08/22—08/28',831,649,26,18],['08/29—09/04',902,706,29,20],['09/05—09/11',927,721,31,22],['09/12—09/13',301,230,9,7]]},
 type:{label:'服务类型',groups:[['安装',1742,1390,41,24],['维修',1568,1164,59,51],['指导',425,350,16,7]]},
 source:{label:'建单来源',groups:[['消费者',1526,1213,37,29],['门店',1184,918,33,24],['客服',1025,773,46,29]]},
 region:{label:'服务省份',groups:[['上海市',1168,932,29,20],['广东省',861,671,27,19],['北京市',746,566,26,18],['湖北省',568,432,19,14],['四川省',392,303,15,11]]},
 station:{label:'服务站',groups:[['上海浦东授权服务站',426,344,8,5],['广州天河授权服务站',382,297,11,7],['北京朝阳授权服务站',354,268,13,9],['杭州拱墅授权服务站',331,260,7,5],['其他服务站',2242,1735,77,56]]},
 dealer:{label:'门店',groups:[['上海浦东旗舰店',318,253,7,4],['杭州城西门店',286,224,6,5],['广州天河门店',274,210,9,6],['北京朝阳门店',251,191,10,7],['其他门店',2606,2026,84,60]]},
 product:{label:'商品',groups:[['CW188B 智能坐便器',986,764,27,21],['CES9433CS 坐便器',812,642,20,16],['TLE28002 龙头',731,561,24,15],['LW896B 面盆',655,508,18,12],['其他商品',894,690,31,23]]}
}
let reportDimension='date',reportFactor=1
let appliedReport={start:'2026-08-15',end:'2026-09-13',serviceType:'all',source:'all'}
let reportSummary={total:3735,closed:2904,canceled:116,complaints:82}

function formatNumber(value){return Number(value).toLocaleString('zh-CN')}
function percentOf(value,total){return total?`${(value/total*100).toFixed(1)}%`:'0.0%'}
function showToast(message){$('toast').textContent=message;$('toast').classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.remove('is-visible'),2300)}
function stateMarkup(icon,title,description,action){return `<div class="state-content"><span class="state-icon"><span class="icon">${svgIcon(icon)}</span></span><strong>${title}</strong><p>${description}</p>${action?`<button class="secondary-button" type="button" id="retryTable">${action}</button>`:''}</div>`}
function setTableState(state){
 currentState=state;document.querySelectorAll('[data-table-state]').forEach(button=>button.classList.toggle('is-active',button.dataset.tableState===state))
 const panel=document.querySelector('.analytics-table-panel'),workspace=document.querySelector('.analytics-workspace'),exportButton=$('qualityExport')||$('reportExport');if(panel)panel.setAttribute('aria-busy',String(state==='loading'));workspace?.classList.toggle('is-forbidden-state',state==='forbidden');document.querySelectorAll('.analytics-filter input,.analytics-filter select,.analytics-filter button:not(#stateButton)').forEach(control=>{control.disabled=state==='forbidden'||state==='loading'});if(exportButton)exportButton.hidden=state==='forbidden'
 if(state==='data'){$('tableState').hidden=true;return}
 $('tableState').hidden=false
 if(state==='loading')$('tableState').innerHTML='<div class="skeleton-lines" role="status" aria-label="正在加载分析数据"><i></i><i></i><i></i><i></i></div>'
 if(state==='empty')$('tableState').innerHTML=stateMarkup('archive','暂无汇总数据','当前授权范围和筛选条件下没有已生成的事实。','')
 if(state==='error'){$('tableState').innerHTML=stateMarkup('triangle-alert','分析数据加载失败','失败不会显示为 0，已保留当前筛选条件。','重试');$('retryTable').addEventListener('click',()=>simulateLoad('数据已重新加载'))}
 if(state==='forbidden')$('tableState').innerHTML=stateMarkup('shield','暂无查看权限','当前账号未取得该页面的读取权限；正式实现不得继续请求业务数据。','')
}
function simulateLoad(message,callback){setTableState('loading');setTimeout(()=>{callback?.();if(currentState==='loading')setTableState('data');showToast(message)},520)}
function openOverlay(panel){$('scopePopover').hidden=true;$('statePopover').hidden=true;$('scrim').hidden=false;panel.hidden=false;panel.querySelector('button')?.focus()}
function closeOverlays(){$('scrim').hidden=true;$('prototypePanel').hidden=true;$('commandDialog').hidden=true;$('analyticsDrawer').hidden=true;$('exportDialog').hidden=true}
function openDrawer(title,kicker,content){$('drawerTitle').textContent=title;$('drawerKicker').textContent=kicker;$('drawerContent').innerHTML=content;openOverlay($('analyticsDrawer'))}
function setValidation(id,message){const node=$(id);node.textContent=message;node.hidden=!message}
function updatePagination(total){$('pageSummary').textContent=`第 1 / ${total?1:0} 页`;$('previousPage').disabled=true;$('nextPage').disabled=true}
function shortDate(value){return value.replaceAll('-','/')}
function updateQualityApplied(){const keyword=appliedQuality.keyword?`关键词“${appliedQuality.keyword}”`:'全部对象';$('appliedQueryText').textContent=`${appliedQuality.date} · ${objectTypeLabels[appliedQuality.type]} · ${keyword}`}
function updateReportApplied(){$('appliedQueryText').textContent=`${appliedReport.start} 至 ${appliedReport.end} · ${serviceTypeLabels[appliedReport.serviceType]} · ${sourceLabels[appliedReport.source]} · 按${reportDimensions[reportDimension].label}`;$('reportRangeLabel').textContent=`${shortDate(appliedReport.start)}—${shortDate(appliedReport.end)}`}
function openExport(){const label=page==='quality'?`${appliedQuality.date} · ${objectTypeLabels[appliedQuality.type]}`:`${appliedReport.start} 至 ${appliedReport.end} · 按${reportDimensions[reportDimension].label}`;$('exportScope').textContent=label;openOverlay($('exportDialog'))}

function renderQuality(){
 const keyword=appliedQuality.keyword.toLowerCase(),date=appliedQuality.date
 qualityType=appliedQuality.type
 qualityRows=qualityData[qualityType].filter(item=>!keyword||`${item.name}${item.code}`.toLowerCase().includes(keyword)).map(item=>({...item,date:date.slice(5).replace('-','/')}))
 $('qualityTableDescription').textContent=`按${objectTypeLabels[qualityType]}展示，点击行联动顶部指标与趋势`
 $('qualityObjectType').textContent=objectTypeLabels[qualityType]
 $('qualityRows').innerHTML=qualityRows.map(item=>`<tr data-quality-id="${item.id}"><td><span class="quality-object"><strong>${item.name}</strong><small>${item.code}</small></span></td><td>${item.date}</td><td class="metric-cell">${formatNumber(item.volume)}</td><td class="metric-cell">${item.timely.toFixed(2)}%</td><td class="metric-cell">${item.firstFix.toFixed(2)}%</td><td><span class="rating"><i>★</i><span class="metric-cell">${item.rating.toFixed(2)}</span></span></td><td class="metric-cell${item.complaints>=10?' is-danger':''}">${item.complaints}</td><td><button class="row-action" type="button" data-quality-detail="${item.id}" aria-label="查看 ${item.name}"><span class="icon">${svgIcon('chevron-right')}</span></button></td></tr>`).join('')
 $('tableCount').textContent=`共 ${qualityRows.length} 条日汇总事实，当前展示演示数据`
 updatePagination(qualityRows.length);updateQualityApplied()
 if(!qualityRows.length){$('qualityVolume').textContent='—';$('qualityTimely').textContent='—';$('qualityFirstFix').textContent='—';$('qualityRating').textContent='—';$('qualityComplaints').textContent='—';$('qualityMetricScope').textContent='当前条件无事实';$('qualityChartTitle').textContent='暂无可展示的质量趋势';$('qualityChart').innerHTML='';$('qualityLatest').textContent='—';$('qualityInsights').innerHTML='';setTableState('empty');return}
 selectedQuality=qualityRows.find(item=>item.id===selectedQuality?.id)||qualityRows[0];selectQuality(selectedQuality.id,false)
 document.querySelectorAll('[data-quality-id]').forEach(row=>row.addEventListener('click',event=>{if(!event.target.closest('[data-quality-detail]'))selectQuality(row.dataset.qualityId)}))
 document.querySelectorAll('[data-quality-detail]').forEach(button=>button.addEventListener('click',()=>showQualityDetail(button.dataset.qualityDetail)))
}
function selectQuality(id,scroll=true){
 const item=qualityRows.find(row=>row.id===id);if(!item)return;selectedQuality=item
 $('qualityVolume').textContent=formatNumber(item.volume);$('qualityTimely').textContent=`${item.timely.toFixed(2)}%`;$('qualityFirstFix').textContent=`${item.firstFix.toFixed(2)}%`;$('qualityRating').textContent=item.rating.toFixed(2);$('qualityComplaints').textContent=item.complaints;$('qualityMetricScope').textContent=`${item.name} · ${item.date}`;$('qualityChartTitle').textContent=`${item.name}近 7 条日汇总`
 document.querySelectorAll('[data-quality-id]').forEach(row=>row.classList.toggle('is-selected',row.dataset.qualityId===id));renderQualityChart();renderQualityInsights()
 if(scroll)document.querySelector('.analytics-metrics').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'})
}
function renderQualityChart(){
 const values=qualityMetric==='timely'?selectedQuality.trend:qualityMetric==='firstFix'?selectedQuality.trend.map((value,index)=>Math.max(72,value-3-(index%2))):selectedQuality.trend.map((value,index)=>Math.min(4.96,4.48+value%5/10+index*.015))
 const max=qualityMetric==='rating'?5:100,end=new Date(`${appliedQuality.date}T00:00:00`),labels=Array.from({length:7},(_,index)=>{const day=new Date(end);day.setDate(end.getDate()-6+index);return `${String(day.getMonth()+1).padStart(2,'0')}/${String(day.getDate()).padStart(2,'0')}`})
 $('qualityChart').innerHTML=values.map((value,index)=>`<span class="bar-item"><button type="button" style="--bar-height:${Math.max(10,value/max*100)}%;--bar-delay:${index*45}ms" data-quality-day="${labels[index]}" data-quality-value="${value.toFixed(qualityMetric==='rating'?2:2)}"><span>${qualityMetric==='rating'?value.toFixed(2):value.toFixed(1)+'%'}</span></button><small>${labels[index]}</small></span>`).join('')
 $('qualityLatest').textContent=qualityMetric==='rating'?values.at(-1).toFixed(2):`${values.at(-1).toFixed(2)}%`
 document.querySelectorAll('[data-quality-day]').forEach(button=>button.addEventListener('click',()=>showToast(`${selectedQuality.name} ${button.dataset.qualityDay}：${button.dataset.qualityValue}${qualityMetric==='rating'?' 分':'%'}`)))
}
function renderQualityInsights(){
 const rows=[['及时率',`${selectedQuality.timely.toFixed(2)}%`,'仅展示单条汇总'],['一次完工率',`${selectedQuality.firstFix.toFixed(2)}%`,'待正式口径验收'],['投诉工单线索',`${selectedQuality.complaints} 单`,'可下钻关联工单']]
 $('qualityInsights').innerHTML=rows.map((row,index)=>`<div class="insight-item"><span class="insight-rank">0${index+1}</span><span class="insight-copy"><strong>${row[0]}</strong><small>${row[2]}</small></span><span class="insight-value"><strong>${row[1]}</strong><small>${selectedQuality.date}</small></span></div>`).join('')
}
function showQualityDetail(id){
 const item=qualityRows.find(row=>row.id===id);if(!item)return;selectQuality(id,false)
 drawerContext=`服务质量：${objectTypeLabels[qualityType]} ${item.code}，汇总日期 ${appliedQuality.date}`
 openDrawer(item.name,'质量汇总详情',`<div class="detail-hero"><span>汇总日期</span><strong>${item.date}</strong></div><div class="detail-grid"><div class="detail-field"><span>对象编码</span><strong>${item.code}</strong></div><div class="detail-field"><span>服务量</span><strong>${formatNumber(item.volume)} 单</strong></div><div class="detail-field"><span>及时率</span><strong>${item.timely.toFixed(2)}%</strong></div><div class="detail-field"><span>一次完工率</span><strong>${item.firstFix.toFixed(2)}%</strong></div><div class="detail-field"><span>评价均分</span><strong>${item.rating.toFixed(2)}</strong></div><div class="detail-field"><span>投诉数</span><strong>${item.complaints}</strong></div></div><div class="drawer-note">下钻时继承对象 ID、汇总日期和当前授权组织范围；该详情展示一条日汇总事实，不对多个对象再次聚合。</div>`)
}

function distribute(total,weights){const sum=weights.reduce((value,item)=>value+item,0),result=weights.map(item=>Math.round(total*item/sum));result[result.length-1]+=total-result.reduce((value,item)=>value+item,0);return result}
function dateBuckets(){
 const start=new Date(`${appliedReport.start}T00:00:00`),end=new Date(`${appliedReport.end}T00:00:00`),days=Math.round((end-start)/86400000)+1,count=Math.min(5,days),size=Math.ceil(days/count),rows=[]
 for(let index=0;index<count;index+=1){const from=new Date(start.getTime()+index*size*86400000),to=new Date(Math.min(end.getTime(),from.getTime()+(size-1)*86400000));if(from>end)break;const format=date=>`${String(date.getMonth()+1).padStart(2,'0')}/${String(date.getDate()).padStart(2,'0')}`;rows.push(`${format(from)}—${format(to)}`)}
 return rows
}
function scaledGroups(){
 if(reportDimension!=='date')return reportDimensions[reportDimension].groups.map(group=>[group[0],...group.slice(1).map(value=>Math.round(value*reportFactor))])
 const labels=dateBuckets(),weights=reportDimensions.date.groups.slice(0,labels.length).map(group=>group[1]),orders=distribute(reportSummary.total,weights),closed=distribute(reportSummary.closed,weights),canceled=distribute(reportSummary.canceled,weights),complaints=distribute(reportSummary.complaints,weights)
 return labels.map((label,index)=>[label,orders[index],closed[index],canceled[index],complaints[index]])
}
function updateReportSummary(){
 $('reportTotal').textContent=formatNumber(reportSummary.total);$('reportClosed').textContent=formatNumber(reportSummary.closed);$('reportCanceled').textContent=formatNumber(reportSummary.canceled);$('reportComplaints').textContent=formatNumber(reportSummary.complaints);$('reportLegendTotal').textContent=formatNumber(reportSummary.total);$('reportLegendClosed').textContent=formatNumber(reportSummary.closed);$('reportLegendCanceled').textContent=formatNumber(reportSummary.canceled);$('reportLegendComplaints').textContent=`${formatNumber(reportSummary.complaints)} 单`
}
function renderReport(){
 const config=reportDimensions[reportDimension],groups=scaledGroups(),total=reportSummary.total,max=Math.max(1,...groups.map(item=>item[1]))
 $('reportDimensionLabel').textContent=config.label;$('reportChartTitle').textContent=`工单量按${config.label}分组`;$('reportTableTitle').textContent=`${config.label}分组明细`;$('reportGroupHeader').textContent=config.label
 $('reportTableDescription').textContent=reportDimension==='product'?'同组内按工单 ID 去重；跨商品组不可相加为总数':'同组内按工单 ID 去重'
 $('reportChart').innerHTML=groups.map((item,index)=>`<span class="bar-item"><button type="button" style="--bar-height:${Math.max(8,item[1]/max*100)}%;--bar-delay:${index*45}ms" data-report-group="${index}"><span>${formatNumber(item[1])}</span></button><small title="${item[0]}">${item[0]}</small></span>`).join('')
 $('reportRows').innerHTML=groups.map((item,index)=>`<tr data-report-row="${index}"><td><span class="quality-object"><strong>${item[0]}</strong><small>${config.label}分组</small></span></td><td class="metric-cell">${formatNumber(item[1])}</td><td class="metric-cell">${formatNumber(item[2])}</td><td class="metric-cell${item[3]>30?' is-danger':''}">${formatNumber(item[3])}</td><td class="metric-cell">${formatNumber(item[4])}</td><td class="metric-cell">${percentOf(item[1],total)}</td><td><button class="row-action" type="button" data-report-detail="${index}" aria-label="查看 ${item[0]}"><span class="icon">${svgIcon('chevron-right')}</span></button></td></tr>`).join('')
 $('tableCount').textContent=`共 ${groups.length} 个${config.label}分组，当前展示演示数据`
 updatePagination(groups.length);updateReportApplied();updateReportSummary()
 document.querySelectorAll('[data-report-group],[data-report-detail],[data-report-row]').forEach(node=>node.addEventListener('click',event=>{if(node.hasAttribute('data-report-row')&&event.target.closest('[data-report-detail]'))return;showReportDetail(Number(node.dataset.reportGroup??node.dataset.reportDetail??node.dataset.reportRow))}))
 document.querySelectorAll('[data-report-row]').forEach(row=>row.addEventListener('mouseenter',()=>row.classList.add('is-selected')));document.querySelectorAll('[data-report-row]').forEach(row=>row.addEventListener('mouseleave',()=>row.classList.remove('is-selected')))
}
function showReportDetail(index){
 const config=reportDimensions[reportDimension],item=scaledGroups()[index],total=reportSummary.total;if(!item)return
 drawerContext=`运营报表：${config.label}=${item[0]}，创建日期 ${appliedReport.start} 至 ${appliedReport.end}`
 openDrawer(item[0],`${config.label}分组详情`,`<div class="detail-hero"><span>工单数</span><strong>${formatNumber(item[1])} 单</strong></div><div class="detail-grid"><div class="detail-field"><span>当前已关闭</span><strong>${formatNumber(item[2])}</strong></div><div class="detail-field"><span>当前已取消</span><strong>${formatNumber(item[3])}</strong></div><div class="detail-field"><span>有投诉工单</span><strong>${formatNumber(item[4])}</strong></div><div class="detail-field"><span>工单数占比</span><strong>${percentOf(item[1],total)}</strong></div><div class="detail-field"><span>创建日期范围</span><strong>${appliedReport.start} — ${appliedReport.end}</strong></div><div class="detail-field"><span>数据范围</span><strong>当前授权组织</strong></div></div><div class="drawer-note">查看关联工单时继承当前日期、服务类型、来源、分组键和授权范围。关闭与取消是查询时的当前状态；多个投诉不重复累计。</div>`)
}
function runReportQuery(){
 const start=new Date($('reportStart').value),end=new Date($('reportEnd').value),days=(end-start)/86400000+1
 if(!Number.isFinite(days)||days<1){setValidation('reportValidation','创建日期止不能早于创建日期起。');return}if(days>93){setValidation('reportValidation','创建日期范围不能超过 93 天，请缩短后重试。');return}
 setValidation('reportValidation','');appliedReport={start:$('reportStart').value,end:$('reportEnd').value,serviceType:$('reportServiceType').value,source:$('reportSource').value}
 const serviceFactors={all:1,INSTALLATION:.47,REPAIR:.42,GUIDANCE:.11},sourceFactors={all:1,CONSUMER:.41,DEALER:.32,CUSTOMER_SERVICE:.27},dateFactor=days/30;reportFactor=dateFactor*serviceFactors[appliedReport.serviceType]*sourceFactors[appliedReport.source]
 reportSummary={total:Math.round(3735*reportFactor),closed:Math.round(2904*reportFactor),canceled:Math.round(116*reportFactor),complaints:Math.round(82*reportFactor)}
 simulateLoad('报表已按当前条件更新',renderReport)
}

const commandRoutes={'运营工作台':'index.html','服务质量':'service-quality.html','运营报表':'operations-report.html'}
function renderCommands(keyword){const commands=['运营工作台','服务质量','运营报表','服务工单','顾客购买记录','安装码管理','下载中心'],results=commands.filter(item=>item.includes(keyword.trim()));$('commandResults').innerHTML=results.length?results.map(item=>`<button type="button" data-command="${item}"><strong>${item}</strong><span>总部运营</span></button>`).join(''):stateMarkup('search','未找到功能','请尝试其他关键词。','');document.querySelectorAll('[data-command]').forEach(button=>button.addEventListener('click',()=>{const route=commandRoutes[button.dataset.command];if(route){location.href=route;return}closeOverlays();showToast(`${button.dataset.command}：专业页入口已保留`)}))}
function openCommand(){$('scrim').hidden=false;$('commandDialog').hidden=false;renderCommands('');$('commandInput').focus()}

document.querySelectorAll('.menu-group-title').forEach(button=>button.addEventListener('click',()=>{const group=button.closest('.menu-group');group.classList.toggle('is-open');button.setAttribute('aria-expanded',String(group.classList.contains('is-open')))}))
document.querySelectorAll('[data-preview-link]').forEach(button=>button.addEventListener('click',()=>showToast(`${button.dataset.previewLink}：专业页入口已保留`)))
$('sidebarButton').addEventListener('click',()=>{const shell=$('appShell');shell.classList.toggle('is-sidebar-collapsed');$('sidebarButton').querySelector('span:last-child').textContent=shell.classList.contains('is-sidebar-collapsed')?'展开菜单':'收起菜单'})
$('scopeButton').addEventListener('click',event=>{event.stopPropagation();$('statePopover').hidden=true;$('scopePopover').hidden=!$('scopePopover').hidden})
$('stateButton').addEventListener('click',event=>{event.stopPropagation();const rect=event.currentTarget.getBoundingClientRect();$('scopePopover').hidden=true;$('statePopover').style.top=`${rect.bottom+6}px`;$('statePopover').style.left=`${rect.right-145}px`;$('statePopover').hidden=!$('statePopover').hidden})
document.querySelectorAll('[data-table-state]').forEach(button=>button.addEventListener('click',()=>{setTableState(button.dataset.tableState);$('statePopover').hidden=true}))
$('prototypeFab').addEventListener('click',()=>openOverlay($('prototypePanel')));$('perspectiveButton').addEventListener('click',()=>openOverlay($('prototypePanel')));$('closePrototypePanel').addEventListener('click',closeOverlays);$('searchButton').addEventListener('click',openCommand);$('commandInput').addEventListener('input',event=>renderCommands(event.target.value));$('scrim').addEventListener('click',closeOverlays);$('closeDrawer').addEventListener('click',closeOverlays);$('drawerCloseButton').addEventListener('click',closeOverlays)
$('drawerAction').addEventListener('click',()=>{const message=drawerContext?`已生成下钻条件：${drawerContext}`:'关联工单将继承当前数据范围与分组条件';closeOverlays();showToast(message)})
$('closeExportDialog').addEventListener('click',closeOverlays);$('cancelExport').addEventListener('click',closeOverlays);$('confirmExport').addEventListener('click',()=>{const format=$('exportFormat').value;closeOverlays();showToast(`导出任务已提交（${format}），完成后进入下载中心获取`)})
$('previousPage').addEventListener('click',()=>showToast('当前已是第一页'));$('nextPage').addEventListener('click',()=>showToast('当前已是最后一页'))
document.addEventListener('click',event=>{if(!event.target.closest('.popover')&&!event.target.closest('#scopeButton')&&!event.target.closest('#stateButton')){$('scopePopover').hidden=true;$('statePopover').hidden=true}})
document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommand()}if(event.key==='Escape')closeOverlays()})
$('refreshButton').addEventListener('click',()=>simulateLoad('演示数据已刷新',()=>{$('lastUpdated').textContent=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});if(page==='quality')renderQuality();else renderReport()}))
$('themeButton').addEventListener('click',()=>{const root=document.documentElement,dark=root.dataset.theme!=='dark';root.dataset.theme=dark?'dark':'light';$('themeButton').innerHTML=`<span class="icon">${svgIcon(dark?'sun':'moon')}</span>`})
$('fullscreenButton').addEventListener('click',async()=>{try{if(!document.fullscreenElement)await document.documentElement.requestFullscreen();else await document.exitFullscreen()}catch(_){showToast('浏览器未允许进入全屏')}})

if(page==='quality'){
 renderQuality();document.querySelectorAll('[data-quality-metric]').forEach(button=>button.addEventListener('click',()=>{qualityMetric=button.dataset.qualityMetric;document.querySelectorAll('[data-quality-metric]').forEach(item=>{item.classList.toggle('is-active',item===button);item.setAttribute('aria-selected',String(item===button))});renderQualityChart()}));$('qualityQuery').addEventListener('click',()=>{const date=$('qualityDate').value;if(!date){setValidation('qualityValidation','请选择汇总日期。');return}setValidation('qualityValidation','');appliedQuality={date,type:$('qualityType').value,keyword:$('qualityKeyword').value.trim()};simulateLoad('质量汇总已更新',renderQuality)});$('qualityReset').addEventListener('click',()=>{$('qualityDate').value='2026-09-12';$('qualityType').value='region';$('qualityKeyword').value='';setValidation('qualityValidation','');appliedQuality={date:'2026-09-12',type:'region',keyword:''};simulateLoad('筛选条件已重置',renderQuality)});$('qualityExport').addEventListener('click',openExport);document.querySelectorAll('#qualityDate,#qualityType,#qualityKeyword').forEach(control=>control.addEventListener('keydown',event=>{if(event.key==='Enter')$('qualityQuery').click()}))
}else{
 renderReport();document.querySelectorAll('[data-dimension]').forEach(button=>button.addEventListener('click',()=>{reportDimension=button.dataset.dimension;document.querySelectorAll('[data-dimension]').forEach(item=>{item.classList.toggle('is-active',item===button);item.setAttribute('aria-selected',String(item===button))});simulateLoad(`已切换为按${reportDimensions[reportDimension].label}查看`,renderReport)}));$('reportQuery').addEventListener('click',runReportQuery);$('reportReset').addEventListener('click',()=>{$('reportStart').value='2026-08-15';$('reportEnd').value='2026-09-13';$('reportServiceType').value='all';$('reportSource').value='all';setValidation('reportValidation','');appliedReport={start:'2026-08-15',end:'2026-09-13',serviceType:'all',source:'all'};reportFactor=1;reportSummary={total:3735,closed:2904,canceled:116,complaints:82};simulateLoad('筛选条件已重置',renderReport)});$('reportExport').addEventListener('click',openExport);document.querySelectorAll('#reportStart,#reportEnd,#reportServiceType,#reportSource').forEach(control=>control.addEventListener('keydown',event=>{if(event.key==='Enter')runReportQuery()}))
}
const today=new Date();$('fullDate').textContent=`${today.getFullYear()} 年 ${today.getMonth()+1} 月 ${today.getDate()} 日`
})()
