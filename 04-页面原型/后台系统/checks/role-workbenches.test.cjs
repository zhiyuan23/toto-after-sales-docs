const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..')
const js=fs.readFileSync(path.join(root,'role-workbench.js'),'utf8')
const css=fs.readFileSync(path.join(root,'role-workbench.css'),'utf8')

test('三个角色原型都有独立固定入口',()=>{
  const pages={
    'customer-service.html':'serviceDesk',
    'service-station.html':'station',
    'dealer.html':'dealer'
  }
  for(const [file,view] of Object.entries(pages)){
    const html=fs.readFileSync(path.join(root,file),'utf8')
    assert.match(html,new RegExp(`data-view="${view}"`))
    assert.match(html,/role-workbench\.js/)
    assert.match(html,/role-workbench\.css/)
  }
})

test('客服首版队列和办理边界完整',()=>{
  for(const copy of ['待受理','PENDING_ACCEPTANCE','待派单','PENDING_DISPATCH','待完工审核','PENDING_REVIEW','待定责投诉','投诉 OPEN；不等于全部未结','顾客识别与受理'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(js.includes('完工审核只出现在客服视角'))
})

test('服务站首版围绕今日履约且不推导负荷',()=>{
  for(const copy of ['今日期望服务','按期望服务日期，包含各状态','待完工','缺件工单','今日已配置排班','已配置日容量','不推断剩余工位或人员负荷'])assert.ok(js.includes(copy),`missing ${copy}`)
  assert.ok(!configsSlice('station').includes('完工审核'))
})

test('门店首版按购买记录统计并同页办理',()=>{
  for(const copy of ['未申请安装','NOT_APPOINTED','部分申请安装','PARTIALLY_APPOINTED','全部购买记录','按购买记录统计，不是商品件数','开始购买登记','申请安装'])assert.ok(js.includes(copy),`missing ${copy}`)
})

test('三个原型具备核心交互、状态和降级动效',()=>{
  for(const token of ['selectQueue','renderRows','openWork','openCommand','setTableState','requestFullscreen','prefers-reduced-motion'])assert.ok(js.includes(token)||css.includes(token),`missing ${token}`)
  for(const state of ['data','loading','empty','error'])assert.match(js,new RegExp(`data-table-state=\\"${state}\\"`))
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
})

function configsSlice(view){
  const start=js.indexOf(`${view}:{`)
  const next=js.indexOf('\n  },',start)
  return js.slice(start,next)
}
