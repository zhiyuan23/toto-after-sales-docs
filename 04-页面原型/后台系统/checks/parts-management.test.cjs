'use strict'
const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..')
const html=fs.readFileSync(path.join(root,'parts-management.html'),'utf8')
const js=fs.readFileSync(path.join(root,'parts-management.js'),'utf8')
const css=fs.readFileSync(path.join(root,'parts-management.css'),'utf8')

test('配件专业页具有固定入口和独立资源',()=>{
  assert.match(html,/id="partsApp"/)
  assert.match(html,/parts-management\.css/)
  assert.match(html,/parts-management\.js/)
})

test('入库单查询、列字段和状态行为完整',()=>{
  for(const copy of ['入库单号','服务站名称','服务站编号','开始时间','结束时间','包含配件','配件种类数量','配件数量','创建人','创建时间','待提交','已完成'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['new-inbound','edit-inbound','submit-inbound','delete-inbound','confirm-delete-inbound','completeInbound'])assert.ok(js.includes(token),`missing ${token}`)
})

test('入库编号、配件选择和动态合计可走查',()=>{
  assert.match(js,/no\('RK',TODAY,state\.inbounds\)/)
  for(const token of ['data-picker-search','choose-part','data-detail-quantity','sumItems','data-inbound-date'])assert.ok(js.includes(token),`missing ${token}`)
  assert.ok(js.includes('3 位流水号'))
})

test('领退料列表、详情和通过拒绝转移库存完整',()=>{
  for(const copy of ['处理中','已拒绝','已撤销','工单号','领料人','退料人','领料说明','退料说明','拒绝原因','服务站库存数量','申请数量'])assert.ok(js.includes(copy),`missing ${copy}`)
  for(const token of ['action===`approve-${kind}`','action===`reject-${kind}`','confirm-approve-${kind}','confirm-reject','approve(kind,value)','balance.station-=item.quantity','balance[row.personId]-=item.quantity'])assert.ok(js.includes(token),`missing ${token}`)
})

test('原型有桌面密度、弹窗和减少动效降级',()=>{
  for(const selector of ['parts-filter','parts-table','parts-modal','parts-picker','parts-meta'])assert.match(css,new RegExp(selector))
  assert.match(css,/@media\(prefers-reduced-motion:reduce\)/)
})
