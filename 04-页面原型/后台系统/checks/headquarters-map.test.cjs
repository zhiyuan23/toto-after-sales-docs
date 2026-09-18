const fs=require('node:fs')
const path=require('node:path')
const test=require('node:test')
const assert=require('node:assert/strict')

const root=path.resolve(__dirname,'..')
const html=fs.readFileSync(path.join(root,'headquarters-map.html'),'utf8')
const css=fs.readFileSync(path.join(root,'headquarters-map.css'),'utf8')
const js=fs.readFileSync(path.join(root,'headquarters-map.js'),'utf8')
const mapData=fs.readFileSync(path.join(root,'assets/china-data.js'),'utf8')

test('现版工作台保留并提供独立地图版入口',()=>{
  assert.ok(fs.existsSync(path.join(root,'index.html')))
  assert.match(html,/href="index\.html"/)
  assert.match(html,/运营工作台（现版）/)
  assert.match(html,/运营工作台（地图版）/)
})

test('总部队列使用当前实现中的四个正式队列',()=>{
  for(const copy of ['全部工单','待分配服务站','待完工','缺件工单','PENDING_STATION','PENDING_COMPLETION','MISSING_PARTS'])assert.match(html,new RegExp(copy))
})

test('全国地图使用真实省级地理数据并提供四类现有数据图层',()=>{
  assert.match(mapData,/FeatureCollection/)
  assert.match(mapData,/"name":"江苏"/)
  for(const layer of ['orders','stations','quality','coverage'])assert.match(html,new RegExp(`data-layer="${layer}"`))
  assert.match(html,/id="layerButton"/)
  assert.match(html,/id="layerMenu"[^>]*role="listbox"/)
  assert.doesNotMatch(html,/class="layer-tabs"/)
  assert.match(js,/ArrowDown/)
  assert.match(js,/ArrowUp/)
  for(const fn of ['decodeGeoJSON','geometryPath','renderMap','renderMarkers','selectProvince'])assert.match(js,new RegExp(fn))
  assert.doesNotMatch(html,/<img\b/)
})

test('全部工单由区域主数字承载，六节点状态河收进右侧总览',()=>{
  assert.doesNotMatch(html,/class="queue-ribbon/)
  assert.match(html,/class="queue-summary"/)
  assert.match(html,/全国待办与流转/)
  for(const stage of ['受理中','待分站','待派人','履约中','待完工','待审核'])assert.match(html,new RegExp(stage))
  for(const queue of ['station','completion','parts'])assert.match(html,new RegExp(`data-queue="${queue}"`))
  assert.match(css,/\.compact-flow\{[^}]*grid-template-columns:repeat\(6,minmax\(0,1fr\)\)/)
  assert.match(css,/\.compact-flow-node\.is-action/)
})

test('异常关注只展示已有缺件数字，未定口径不伪造数据',()=>{
  for(const copy of ['异常关注','缺件工单','审核退回','超时工单','待接入','口径待确认'])assert.match(html,new RegExp(copy))
  assert.match(html,/data-status="MISSING_PARTS"/)
  assert.match(css,/\.risk-summary-grid/)
})

test('全国质量汇总保留接入位但不从日事实推算',()=>{
  for(const copy of ['全国 30 天质量汇总','评价率','满意度','审核退回率','取消率','不从单条日事实或当前分页推算'])assert.match(html,new RegExp(copy))
  assert.match(html,/需要独立汇总接口/)
  assert.match(css,/\.quality-rollup-grid/)
})

test('新版增加近 30 天工单趋势并移除常用操作',()=>{
  for(const token of ['trendCardTitle','trendTotal','compactTrendArea','compactTrendLine'])assert.match(html,new RegExp(`id="${token}"`))
  assert.match(html,/趋势保持全国 30 天口径/)
  assert.match(js,/function renderTrend\(\)/)
  assert.match(js,/const trend = \[/)
  assert.doesNotMatch(html,/常用操作/)
  assert.doesNotMatch(html,/class="rail-card action-card"/)
})

test('地图优先获得宽屏增量且右栏保持稳定阅读宽度',()=>{
  assert.match(css,/grid-template-columns:minmax\(0,1fr\) clamp\(400px,29%,620px\)/)
  assert.match(css,/@media \(max-width:1280px\)\{\.map-dashboard\{grid-template-columns:minmax\(520px,1fr\) 390px/)
  assert.match(css,/\.region-summary h2\{font-size:20px\}/)
  assert.match(css,/\.region-main-number strong\{[^}]*font:780 46px\/\.9/)
  assert.match(css,/\.region-facts strong\{[^}]*font:740 18px\/1/)
  assert.match(css,/\.rail-card h3\{margin:0;font-size:14px\}/)
  assert.match(css,/\.compact-flow-node strong\{[^}]*font:720 14px\/1/)
  assert.match(css,/\.network-metrics strong\{[^}]*font:750 22px\/1/)
  assert.match(css,/\.quality-mini-grid strong\{[^}]*font:720 14px\/1/)
})

test('地图统计严格使用现有报表与服务资源字段',()=>{
  for(const copy of ['按服务省份分组','当前已关闭','当前已取消','有投诉工单','已配置坐标','单条质量日事实','已配置服务区域'])assert.match(html,new RegExp(copy))
  assert.match(html,/省份颜色来自运营报表；队列数量为全国授权范围，二者不混算/)
  assert.match(js,/配置日上限/)
  assert.match(js,/不等同于实际可用产能/)
  assert.match(js,/不把未配置区域直接判定为服务盲区/)
})

test('不展示当前系统无法可靠提供的地图结论',()=>{
  assert.doesNotMatch(html,/人员实时位置|服务人员位置|人员到客距离|利用率|实时产能|服务盲区/)
  assert.doesNotMatch(js,/人员实时位置|人员到客距离|利用率/)
})

test('主题、刷新、全屏、图层与减少动效均可评审',()=>{
  for(const token of ['requestFullscreen','themeButton','refreshButton','data-range','data-layer'])assert.ok(html.includes(token)||js.includes(token),`missing ${token}`)
  assert.match(css,/@media \(prefers-reduced-motion:reduce\)/)
})
