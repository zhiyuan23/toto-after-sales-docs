(() => {
  'use strict'

  const stores = [
    { id: 's101', code: 'SH-XH-01', name: '上海徐汇门店', dealer: '上海区域代理商' },
    { id: 's102', code: 'SH-PD-02', name: '上海浦东门店', dealer: '上海区域代理商' }
  ]
  const products = [
    { id: 'p992', name: '智能坐便器 CW992' },
    { id: 'p093', name: '台盆龙头 TLG093' },
    { id: 'p014', name: '淋浴花洒 TBW014' }
  ]
  const faults = {
    p992: [{ id: 'f101', name: '冲洗功能异常' }, { id: 'f102', name: '座圈加热异常' }],
    p093: [{ id: 'f201', name: '出水量异常' }, { id: 'f202', name: '阀芯漏水' }],
    p014: [{ id: 'f301', name: '切换功能异常' }, { id: 'f302', name: '连接处漏水' }]
  }

  const records = [
    { id: 'r1', storeId: 's101', no: 'REG-20260921-018', customer: '王女士', mobile: '138 0000 9021', purchaseDate: '2026-09-21', province: '上海市', city: '上海市', district: '徐汇区', street: '徐家汇街道', address: '漕溪北路 18 号', instances: [{ id: 'i1', productId: 'p992', product: '智能坐便器 CW992', code: 'TO-9A21018', status: 'AVAILABLE' }] },
    { id: 'r2', storeId: 's101', no: 'REG-20260920-042', customer: '陈先生', mobile: '139 0000 7042', purchaseDate: '2026-09-20', province: '上海市', city: '上海市', district: '徐汇区', street: '田林街道', address: '宜山路 126 号', instances: [{ id: 'i2a', productId: 'p992', product: '智能坐便器 CW992', code: 'TO-8B20042', status: 'APPOINTED' }, { id: 'i2b', productId: 'p992', product: '智能坐便器 CW992', code: 'TO-8B20043', status: 'AVAILABLE' }] },
    { id: 'r3', storeId: 's101', no: 'REG-20260912-006', customer: '刘女士', mobile: '137 0000 5106', purchaseDate: '2026-09-12', province: '上海市', city: '上海市', district: '徐汇区', street: '天平路街道', address: '天钥桥路 86 号', instances: [{ id: 'i3', productId: 'p093', product: '台盆龙头 TLG093', code: 'TO-7C12006', status: 'APPOINTED' }] },
    { id: 'r4', storeId: 's101', no: 'REG-20260828-031', customer: '赵先生', mobile: '136 0000 3031', purchaseDate: '2026-08-28', province: '上海市', city: '上海市', district: '徐汇区', street: '斜土路街道', address: '龙华中路 199 号', instances: [{ id: 'i4', productId: 'p992', product: '智能坐便器 CW992', code: 'TO-6D28031', status: 'APPOINTED' }] },
    { id: 'r5', storeId: 's102', no: 'REG-20260918-013', customer: '周女士', mobile: '135 0000 8013', purchaseDate: '2026-09-18', province: '上海市', city: '上海市', district: '浦东新区', street: '陆家嘴街道', address: '浦东南路 88 号', instances: [{ id: 'i5', productId: 'p093', product: '台盆龙头 TLG093', code: 'TO-5E18013', status: 'AVAILABLE' }] }
  ]

  const orders = [
    { id: 'o1', no: 'SO-20260920-021', recordId: 'r2', instanceId: 'i2a', type: 'INSTALLATION', status: 'PENDING_DISPATCH', expectedDate: '2026-09-24', expectedTimeWindow: '上午', station: '', personnel: '', note: '顾客到店提出安装需求', events: [{ status: 'PENDING_DISPATCH', time: '2026-09-20 15:40' }] },
    { id: 'o2', no: 'SO-20260919-014', recordId: 'r3', instanceId: 'i3', type: 'REPAIR', status: 'PENDING_COMPLETION', expectedDate: '2026-09-22', expectedTimeWindow: '09:00-12:00', station: '徐汇服务站', personnel: '王师傅', fault: '出水量异常', note: '出水量变小', events: [{ status: 'PENDING_COMPLETION', time: '2026-09-21 09:15' }, { status: 'PENDING_DISPATCH', time: '2026-09-19 10:25' }] },
    { id: 'o3', no: 'SO-20260901-008', recordId: 'r4', instanceId: 'i4', type: 'INSTALLATION', status: 'COMPLETED', expectedDate: '2026-09-03', expectedTimeWindow: '下午', station: '徐汇服务站', personnel: '李师傅', note: '安装服务已完成', events: [{ status: 'COMPLETED', time: '2026-09-03 16:20' }, { status: 'PENDING_DISPATCH', time: '2026-09-01 11:10' }] },
    { id: 'o4', no: 'SO-20260919-009', recordId: 'r5', instanceId: 'i5', type: 'REPAIR', status: 'PENDING_ASSIGNMENT', expectedDate: '2026-09-25', expectedTimeWindow: '全天', station: '浦东服务站', personnel: '', fault: '阀芯漏水', note: '阀芯位置持续滴水', events: [{ status: 'PENDING_ASSIGNMENT', time: '2026-09-20 08:40' }, { status: 'PENDING_DISPATCH', time: '2026-09-19 14:10' }] }
  ]

  const storeInsight = {
    todayProducts: 12,
    products: 286,
    customers: 241,
    records: 258,
    productTrend: [7, 8, 8, 10, 9, 11, 12, 11, 13, 14, 13, 15, 16, 14, 17, 18, 16, 19, 18, 20, 22, 19, 21, 23, 22, 24, 21, 25, 27, 25],
    customerTrend: [6, 7, 7, 8, 8, 9, 10, 10, 11, 12, 11, 12, 13, 12, 14, 15, 14, 16, 16, 17, 18, 16, 18, 19, 18, 20, 18, 21, 22, 20],
    topProducts: [
      { id: 'p992', name: '智能坐便器 CW992', shortName: '智能坐便器', value: 92 },
      { id: 'p093', name: '台盆龙头 TLG093', shortName: '台盆龙头', value: 68 },
      { id: 'p014', name: '淋浴花洒 TBW014', shortName: '淋浴花洒', value: 54 },
      { id: 'other', name: '其他商品', shortName: '其他商品', value: 72 }
    ],
    customerMix: { newCustomers: 198, repeatCustomers: 43 }
  }

  const state = { query: '', searchType: 'keyword', recordFilter: 'all', orderFilter: 'all', lastFocus: null }
  const $ = (selector) => document.querySelector(selector)
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`
  const recordById = (id) => records.find((record) => record.id === id)
  const activeStatuses = new Set(['PENDING_DISPATCH', 'PENDING_ASSIGNMENT', 'PENDING_COMPLETION', 'PENDING_REVIEW'])
  const activeOrderForInstance = (id) => orders.find((order) => order.instanceId === id && activeStatuses.has(order.status))
  const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
  const clientRequestId = () => `dealer-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const compact = (value) => String(value ?? '').toLowerCase().replace(/\s/g, '')
  const storeName = (id) => stores.find((store) => store.id === id)?.name ?? '--'
  const typeLabel = (type) => ({ INSTALLATION: '安装', REPAIR: '维修' })[type] ?? type
  const statusLabel = (status) => ({ PENDING_VERIFICATION: '客服受理中', PENDING_DISPATCH: '客服安排中', PENDING_ASSIGNMENT: '服务站安排中', PENDING_COMPLETION: '服务履约中', PENDING_REVIEW: '完工审核中', COMPLETED: '已完成', CANCELLED: '已取消' })[status] ?? status
  const eventLabel = (status) => ({ PENDING_DISPATCH: '工单进入待分配服务站', PENDING_ASSIGNMENT: '服务站已确定，等待分配人员', PENDING_COMPLETION: '服务人员处理中', PENDING_REVIEW: '完工资料待审核', COMPLETED: '服务已完成', CANCELLED: '工单已取消' })[status] ?? statusLabel(status)
  const serviceOwner = (order) => order.personnel ? `${order.station} · ${order.personnel}` : order.station ? `${order.station} · 服务人员待确定` : '服务站待确定'
  const serviceEligible = (instance) => instance.status !== 'RETURNED' && !activeOrderForInstance(instance.id)

  function appointmentState(record) {
    const appointed = record.instances.filter((instance) => instance.status === 'APPOINTED').length
    if (appointed === 0) return { key: 'not-appointed', label: '未申请安装' }
    if (appointed < record.instances.length) return { key: 'partial', label: '部分申请' }
    return { key: 'appointed', label: '已申请安装' }
  }

  function matchesSearch(record) {
    if (!state.query) return true
    const query = compact(state.query)
    if (state.searchType === 'mobile') return compact(record.mobile) === query
    if (state.searchType === 'name') return compact(record.customer) === query
    return [record.no, storeName(record.storeId), ...record.instances.map((item) => item.code)].some((value) => compact(value).includes(query))
  }

  function visibleRecords() {
    return records.filter((record) => state.recordFilter === 'all' || appointmentState(record).key === state.recordFilter).filter(matchesSearch)
  }

  function emptyState(title, copy) {
    return `<div class="empty-state">${icon('search')}<strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p></div>`
  }

  function renderRecords() {
    const list = visibleRecords()
    $('#recordCount').textContent = `${list.length} 条记录`
    $('#recordList').innerHTML = list.length ? list.map((record) => {
      const appointment = appointmentState(record)
      const productNames = record.instances.map((item) => item.product)
      const uniqueProducts = [...new Set(productNames)]
      const productSummary = uniqueProducts.length > 1 ? `${uniqueProducts[0]} 等 ${record.instances.length} 件` : `${uniqueProducts[0]} · ${record.instances.length} 件`
      const eligible = record.instances.some(serviceEligible)
      return `<div class="record-row"><div class="record-customer"><span class="record-avatar">${escapeHtml(record.customer.slice(0, 1))}</span><span class="record-cell"><strong>${escapeHtml(record.customer)} · ${escapeHtml(record.mobile)}</strong><small>${escapeHtml(record.no)}</small></span></div><div class="record-cell"><strong>${escapeHtml(productSummary)}</strong><small>${escapeHtml(record.purchaseDate)} · ${escapeHtml(storeName(record.storeId))}</small></div><span class="record-status ${appointment.key !== 'appointed' ? 'attention' : ''}">${appointment.label}</span><div class="record-actions"><button type="button" class="row-action" data-view-record="${record.id}">查看</button><button type="button" class="row-action row-service" data-create-service="${record.id}" ${eligible ? '' : 'disabled'}>${eligible ? '创建工单' : '暂不可建'}</button></div></div>`
    }).join('') : emptyState('没有符合条件的购买记录', state.query ? '请核对当前查询类型和输入内容。姓名、手机号需精确匹配。' : '可切换安装状态筛选，或在购买记录中查询。')
    document.querySelectorAll('[data-record-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.recordFilter === state.recordFilter)
      button.setAttribute('aria-pressed', String(button.dataset.recordFilter === state.recordFilter))
    })
    $('#clearSearch').hidden = !state.query
  }

  function openRecord(id) {
    const record = recordById(id)
    if (!record) return
    const relatedOrders = orders.filter((order) => order.recordId === record.id)
    const productsMarkup = record.instances.map((item) => `<div class="instance-item"><span>${icon('receipt')}</span><div><strong>${escapeHtml(item.product)}</strong><small>安装码 ${escapeHtml(item.code)}</small></div><em class="${item.status === 'AVAILABLE' ? 'busy' : ''}">${item.status === 'AVAILABLE' ? '未申请安装' : item.status === 'APPOINTED' ? '已申请安装' : '已退回'}</em></div>`).join('')
    openDrawer('购买记录 · 只读详情', record.no, `<div class="record-readonly"><h3>${escapeHtml(record.customer)} · ${escapeHtml(record.mobile)}</h3><dl><div><dt>购买日期</dt><dd>${escapeHtml(record.purchaseDate)}</dd></div><div><dt>登记门店</dt><dd>${escapeHtml(storeName(record.storeId))}</dd></div><div><dt>安装状态</dt><dd>${escapeHtml(appointmentState(record).label)}</dd></div><div><dt>关联工单</dt><dd>${relatedOrders.length} 笔</dd></div></dl><div class="drawer-note">${escapeHtml(record.province)} ${escapeHtml(record.city)} ${escapeHtml(record.district)} ${escapeHtml(record.street)} ${escapeHtml(record.address)}</div><div><p class="drawer-section-title">登记商品</p><div class="instance-list">${productsMarkup}</div></div></div>`, `<button type="button" data-close-drawer>关闭</button>`)
  }

  function renderOrders() {
    const list = orders.filter((order) => state.orderFilter === 'all' || order.status === state.orderFilter)
    $('#orderCount').textContent = `${list.length} 笔工单`
    $('#orderList').innerHTML = list.length ? list.map((order) => {
      const record = recordById(order.recordId)
      const completed = ['COMPLETED', 'CANCELLED'].includes(order.status)
      const instance = record?.instances.find((item) => item.id === order.instanceId)
      return `<button type="button" class="order-card" data-order-id="${order.id}"><div class="order-card-top"><b>${escapeHtml(order.no)}</b><span class="order-state ${completed ? 'completed' : ''}">${escapeHtml(statusLabel(order.status))}</span></div><h3>${escapeHtml(typeLabel(order.type))} · ${escapeHtml(instance?.product || record?.no)}</h3><p>${escapeHtml(record?.customer)} · ${escapeHtml(record?.mobile)}</p><p>${escapeHtml(serviceOwner(order))}</p><div class="order-card-foot"><span>预约 ${escapeHtml(order.expectedDate)} ${escapeHtml(order.expectedTimeWindow)}</span><span>查看进度 →</span></div></button>`
    }).join('') : emptyState('当前状态暂无工单', '切换其他明确状态，或查看全部授权范围工单。')
    document.querySelectorAll('[data-order-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.orderFilter === state.orderFilter)
      button.setAttribute('aria-pressed', String(button.dataset.orderFilter === state.orderFilter))
    })
  }

  function openOrdersOverview() {
    const orderMarkup = orders.map((order) => {
      const record = recordById(order.recordId)
      const completed = ['COMPLETED', 'CANCELLED'].includes(order.status)
      const instance = record?.instances.find((item) => item.id === order.instanceId)
      return `<button type="button" class="order-drawer-card" data-order-id="${order.id}"><span><b>${escapeHtml(order.no)}</b><em class="order-state ${completed ? 'completed' : ''}">${escapeHtml(statusLabel(order.status))}</em></span><strong>${escapeHtml(typeLabel(order.type))} · ${escapeHtml(instance?.product || record?.no)}</strong><small>${escapeHtml(record?.customer)} · ${escapeHtml(record?.mobile)}</small><small>${escapeHtml(serviceOwner(order))} · 预约 ${escapeHtml(order.expectedDate)}</small></button>`
    }).join('')
    openDrawer('低频查询 · 当前授权门店', '本店服务工单', `<div class="drawer-note">顾客咨询服务进度时按需进入。门店只查看客服安排、服务站安排和履约进度，不执行分站、派人或审核。</div><div class="orders-drawer-list">${orderMarkup}</div>`, `<button type="button" data-close-drawer>关闭</button>`)
  }

  function drawStoreTrend() {
    const canvas = $('#storeTrendChart')
    if (!canvas) return
    const width = Math.max(1, Math.round(canvas.clientWidth))
    const height = Math.max(1, Math.round(canvas.clientHeight))
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * ratio
    canvas.height = height * ratio
    const context = canvas.getContext('2d')
    context.scale(ratio, ratio)
    const values = [...storeInsight.productTrend, ...storeInsight.customerTrend]
    const max = Math.ceil((Math.max(...values) + 2) / 10) * 10
    const min = 0
    const left = 28
    const right = width - 6
    const top = 7
    const bottom = height - 10
    const x = (index) => left + ((right - left) * index) / (storeInsight.productTrend.length - 1)
    const y = (value) => bottom - ((bottom - top) * (value - min)) / (max - min)
    context.lineWidth = 1
    context.strokeStyle = '#edf1f6'
    context.font = '8px "SF Pro Display", "PingFang SC", sans-serif'
    context.fillStyle = '#98a4b3'
    context.textAlign = 'right'
    context.textBaseline = 'middle'
    for (let index = 0; index < 4; index += 1) {
      const guideValue = (max * index) / 3
      const guideY = y(guideValue)
      context.beginPath()
      context.moveTo(left, guideY)
      context.lineTo(right, guideY)
      context.stroke()
      context.fillText(String(Math.round(guideValue)), left - 6, guideY)
    }
    const drawLine = (data, color) => {
      const gradient = context.createLinearGradient(0, top, 0, bottom)
      gradient.addColorStop(0, `${color}24`)
      gradient.addColorStop(1, `${color}00`)
      context.beginPath()
      data.forEach((value, index) => {
        if (index === 0) context.moveTo(x(index), y(value))
        else context.lineTo(x(index), y(value))
      })
      context.lineTo(x(data.length - 1), bottom)
      context.lineTo(x(0), bottom)
      context.closePath()
      context.fillStyle = gradient
      context.fill()
      context.beginPath()
      data.forEach((value, index) => {
        if (index === 0) context.moveTo(x(index), y(value))
        else context.lineTo(x(index), y(value))
      })
      context.lineWidth = 1.8
      context.strokeStyle = color
      context.lineJoin = 'round'
      context.lineCap = 'round'
      context.stroke()
      const last = data.length - 1
      context.beginPath()
      context.arc(x(last), y(data[last]), 2.2, 0, Math.PI * 2)
      context.fillStyle = color
      context.fill()
    }
    drawLine(storeInsight.productTrend, '#3979ca')
    drawLine(storeInsight.customerTrend, '#59aaa0')
  }

  function drawProductMix() {
    const canvas = $('#productMixChart')
    if (!canvas) return
    const width = Math.max(1, Math.round(canvas.clientWidth))
    const height = Math.max(1, Math.round(canvas.clientHeight))
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * ratio
    canvas.height = height * ratio
    const context = canvas.getContext('2d')
    context.scale(ratio, ratio)
    const labelWidth = Math.min(116, Math.max(88, width * 0.32))
    const valueWidth = 28
    const barLeft = labelWidth
    const barRight = width - valueWidth
    const max = Math.max(...storeInsight.topProducts.map((item) => item.value))
    const rowHeight = height / storeInsight.topProducts.length
    context.font = '9px "SF Pro Display", "PingFang SC", sans-serif'
    context.textBaseline = 'middle'
    storeInsight.topProducts.forEach((item, index) => {
      const centerY = rowHeight * index + rowHeight / 2
      const barHeight = 10
      context.fillStyle = '#5f6f84'
      context.textAlign = 'left'
      context.fillText(item.shortName, 0, centerY)
      context.fillStyle = '#edf1f6'
      context.fillRect(barLeft, centerY - barHeight / 2, barRight - barLeft, barHeight)
      context.fillStyle = index === 0 ? '#3979ca' : index === 1 ? '#5b91d2' : index === 2 ? '#7da8da' : '#a7b7cb'
      context.fillRect(barLeft, centerY - barHeight / 2, ((barRight - barLeft) * item.value) / max, barHeight)
      context.fillStyle = '#52647a'
      context.textAlign = 'right'
      context.fillText(`${item.value}`, width, centerY)
    })
  }

  function renderProductRank() {
    const list = $('#productRankList')
    if (!list) return
    const max = Math.max(...storeInsight.topProducts.map((item) => item.value), 1)
    const total = Math.max(storeInsight.products, 1)
    list.innerHTML = storeInsight.topProducts.map((item, index) => {
      const share = ((item.value / total) * 100).toFixed(1)
      const rankLabel = item.id === 'other' ? '其他' : String(index + 1).padStart(2, '0')
      return `<div class="product-rank-item" role="listitem"><span class="rank-number">${rankLabel}</span><div class="rank-product"><strong>${escapeHtml(item.shortName)}</strong><small>${escapeHtml(item.name)}</small><span class="rank-line"><i style="--rank-width:${Math.round((item.value / max) * 100)}%"></i></span></div><div class="rank-value"><strong>${item.value}</strong><small>${share}%</small></div></div>`
    }).join('')
  }

  function drawCustomerMix() {
    const canvas = $('#customerMixChart')
    if (!canvas) return
    const width = Math.max(1, Math.round(canvas.clientWidth))
    const height = Math.max(1, Math.round(canvas.clientHeight))
    const ratio = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = width * ratio
    canvas.height = height * ratio
    const context = canvas.getContext('2d')
    context.scale(ratio, ratio)
    const { newCustomers, repeatCustomers } = storeInsight.customerMix
    const total = Math.max(1, newCustomers + repeatCustomers)
    const repeatRate = repeatCustomers / total
    const radius = Math.min(width, height) * 0.34
    const lineWidth = Math.max(8, radius * 0.28)
    const centerX = width / 2
    const centerY = height / 2
    const start = -Math.PI / 2
    context.lineWidth = lineWidth
    context.lineCap = 'butt'
    context.strokeStyle = '#dce8f6'
    context.beginPath()
    context.arc(centerX, centerY, radius, start, start + Math.PI * 2)
    context.stroke()
    context.strokeStyle = '#4f91cf'
    context.beginPath()
    context.arc(centerX, centerY, radius, start, start + Math.PI * 2 * repeatRate)
    context.stroke()
    context.fillStyle = '#1d2d45'
    context.font = '700 14px "SF Pro Display", "PingFang SC", sans-serif'
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.fillText(`${(repeatRate * 100).toFixed(1)}%`, centerX, centerY - 4)
    context.fillStyle = '#8b98a9'
    context.font = '7px "SF Pro Display", "PingFang SC", sans-serif'
    context.fillText('复购客户', centerX, centerY + 10)
  }

  function drawStoreCharts() {
    drawStoreTrend()
    drawProductMix()
    drawCustomerMix()
  }

  function renderStoreInsight() {
    $('#todayProductCount').textContent = storeInsight.todayProducts.toLocaleString('zh-CN')
    $('#productSalesCount').textContent = storeInsight.products.toLocaleString('zh-CN')
    $('#productChartTotal').textContent = `共 ${storeInsight.products.toLocaleString('zh-CN')} 件`
    $('#customerCount').textContent = storeInsight.customers.toLocaleString('zh-CN')
    $('#purchaseRecordCount').textContent = storeInsight.records.toLocaleString('zh-CN')
    $('#newCustomerCount').textContent = storeInsight.customerMix.newCustomers.toLocaleString('zh-CN')
    $('#repeatCustomerCount').textContent = storeInsight.customerMix.repeatCustomers.toLocaleString('zh-CN')
    const customerMixTotal = Math.max(1, storeInsight.customerMix.newCustomers + storeInsight.customerMix.repeatCustomers)
    $('#repeatCustomerRate').textContent = `${((storeInsight.customerMix.repeatCustomers / customerMixTotal) * 100).toFixed(1)}%`
    renderProductRank()
    drawStoreCharts()
  }

  function render() { renderRecords(); renderStoreInsight() }

  function openDrawer(kicker, title, body, footer) {
    state.lastFocus = document.activeElement
    $('#drawerKicker').textContent = kicker
    $('#drawerTitle').textContent = title
    $('#drawerBody').innerHTML = body
    $('#drawerFooter').innerHTML = footer
    $('#drawerBackdrop').hidden = false
    $('#drawer').hidden = false
    $('.app-shell').inert = true
    document.body.classList.add('drawer-open')
    $('#drawer').querySelector('input, select, textarea, button')?.focus()
  }

  function closeDrawer() {
    if ($('#drawer').hidden) return
    $('#drawerBackdrop').hidden = true
    $('#drawer').hidden = true
    $('.app-shell').inert = false
    document.body.classList.remove('drawer-open')
    state.lastFocus?.focus?.()
  }

  let toastTimer
  function toast(message) {
    const element = $('#toast')
    element.textContent = message
    element.hidden = false
    clearTimeout(toastTimer)
    toastTimer = setTimeout(() => { element.hidden = true }, 4000)
  }

  function storeOptions() { return stores.map((store) => `<option value="${store.id}">${escapeHtml(store.code)} · ${escapeHtml(store.name)}</option>`).join('') }
  function productOptions() { return products.map((product) => `<option value="${product.id}">${escapeHtml(product.name)}</option>`).join('') }

  function openRegistration() {
    openDrawer('购买登记 · 当前系统字段', '新增购买登记', `<div class="drawer-note">登记门店从当前账号授权选项中选择。保存后形成购买记录和商品实例，不会自动创建服务工单。</div><form id="registrationForm" class="drawer-form"><div class="two-col"><label>登记门店<select name="storeId" required>${storeOptions()}</select></label><label>购买来源<select name="sourceType" required><option value="OFFLINE">线下门店</option><option value="VIRTUAL">虚拟门店</option><option value="EXTERNAL">外部系统</option></select></label></div><div class="two-col"><label>使用者姓名<input name="customer" required maxlength="100" placeholder="例如 王女士"></label><label>购买人手机号<input name="mobile" required inputmode="tel" maxlength="30" placeholder="请输入 11 位手机号"></label></div><div class="two-col"><label>购买日期<input name="purchaseDate" type="date" required max="${today()}" value="${today()}"></label><label>售后商品<select name="productId" required>${productOptions()}</select></label></div><div class="two-col"><label>数量<input name="quantity" type="number" min="1" max="100" value="1" required></label><label>商品安装码（与数量一致）<input name="code" required maxlength="500" placeholder="多个安装码用逗号分隔"></label></div><div class="region-grid"><label>省份<input name="province" required value="上海市"></label><label>城市<input name="city" value="上海市"></label><label>区县<input name="district" value="徐汇区"></label><label>街道<input name="street" value="徐家汇街道"></label></div><label>详细地址<input name="address" required maxlength="500" placeholder="填写门牌号等详细地址"></label><label class="check-row"><input name="vip" type="checkbox"><span>标记为 VIP 顾客</span></label><label>登记备注<textarea name="remark" maxlength="200" placeholder="选填"></textarea></label><p class="form-error" id="registrationError" hidden></p></form>`, `<button type="button" data-close-drawer>取消</button><button type="submit" form="registrationForm" class="primary-button">保存购买登记</button>`)
  }

  function submitRegistration(form) {
    const data = new FormData(form)
    const mobile = String(data.get('mobile')).replace(/\s/g, '')
    const quantity = Number(data.get('quantity'))
    const codes = String(data.get('code')).split(/[,，;；\r\n]+/).map((value) => value.trim()).filter(Boolean)
    const error = $('#registrationError')
    if (!/^1\d{10}$/.test(mobile)) { error.textContent = '请填写 11 位手机号。'; error.hidden = false; return }
    if (codes.length !== quantity) { error.textContent = '安装码数量必须与商品数量一致。'; error.hidden = false; return }
    if (new Set(codes.map(compact)).size !== codes.length) { error.textContent = '同一购买登记中的安装码不能重复。'; error.hidden = false; return }
    if (records.some((record) => record.instances.some((item) => codes.some((code) => compact(item.code) === compact(code))))) { error.textContent = '安装码已登记，请先查询已有购买记录。'; error.hidden = false; return }
    const isNewCustomer = !records.some((record) => compact(record.mobile) === compact(mobile))
    const product = products.find((item) => item.id === data.get('productId'))
    const id = `r${Date.now()}`
    const stamp = Date.now()
    const newRecord = { id, clientRequestId: clientRequestId(), storeId: String(data.get('storeId')), no: `REG-DEMO-${String(records.length + 1).padStart(3, '0')}`, customer: String(data.get('customer')).trim(), mobile, purchaseDate: String(data.get('purchaseDate')), province: String(data.get('province')).trim(), city: String(data.get('city')).trim(), district: String(data.get('district')).trim(), street: String(data.get('street')).trim(), address: String(data.get('address')).trim(), instances: codes.map((code, index) => ({ id: `i${stamp}-${index + 1}`, productId: product.id, product: product.name, code, status: 'AVAILABLE' })) }
    records.unshift(newRecord)
    storeInsight.todayProducts += quantity
    storeInsight.products += quantity
    storeInsight.records += 1
    storeInsight.customers += isNewCustomer ? 1 : 0
    if (isNewCustomer) storeInsight.customerMix.newCustomers += 1
    else if (storeInsight.customerMix.newCustomers > 0) { storeInsight.customerMix.newCustomers -= 1; storeInsight.customerMix.repeatCustomers += 1 }
    storeInsight.productTrend[storeInsight.productTrend.length - 1] += quantity
    storeInsight.customerTrend[storeInsight.customerTrend.length - 1] += isNewCustomer ? 1 : 0
    const productRank = storeInsight.topProducts.find((item) => item.id === product.id)
    if (productRank) productRank.value += quantity
    state.query = ''
    $('#searchInput').value = ''
    state.recordFilter = 'all'
    closeDrawer()
    render()
    toast('购买登记已保存；当前没有自动创建服务工单。')
  }

  function faultOptions(productId) { return (faults[productId] ?? []).map((fault) => `<option value="${fault.id}">${escapeHtml(fault.name)}</option>`).join('') }

  function openService(id) {
    const record = recordById(id)
    if (!record) return
    const initial = record.instances.find(serviceEligible)
    if (!initial) { toast('这笔购买记录暂无可新建服务工单的商品。'); return }
    const instanceOptions = record.instances.map((item) => {
      const active = activeOrderForInstance(item.id)
      const eligible = serviceEligible(item)
      const status = active ? '已有进行中工单' : item.status === 'RETURNED' ? '已退回' : item.status === 'AVAILABLE' ? '可安装或维修' : '可报修'
      return `<label><input type="radio" name="instanceId" value="${item.id}" data-install-allowed="${item.status === 'AVAILABLE'}" ${item.id === initial.id ? 'checked' : ''} ${eligible ? '' : 'disabled'}><span><strong>${escapeHtml(item.product)}</strong><small>安装码 ${escapeHtml(item.code)}</small></span><small class="choice-status">${status}</small></label>`
    }).join('')
    const installAllowed = initial.status === 'AVAILABLE'
    openDrawer('代消费者办理 · 来自购买记录', '创建服务工单', `<div class="drawer-note"><strong>${escapeHtml(record.customer)} · ${escapeHtml(record.no)}</strong><br>请在弹出层中选择本次服务的商品和类型。提交时由系统再次校验购买登记、商品状态和活动工单。</div><form id="serviceForm" class="drawer-form" data-record-id="${record.id}"><div><p class="drawer-section-title">选择需要服务的商品</p><div class="choice-list">${instanceOptions}</div></div><div><p class="drawer-section-title">选择服务类型</p><div class="type-choice"><label><input id="installationType" type="radio" name="type" value="INSTALLATION" ${installAllowed ? 'checked' : 'disabled'}>安装 <small id="installChoiceHint">${installAllowed ? '' : '已申请安装'}</small></label><label><input type="radio" name="type" value="REPAIR" ${installAllowed ? '' : 'checked'}>维修</label></div></div><div class="two-col"><label>联系人姓名<input name="contactName" required maxlength="100" value="${escapeHtml(record.customer)}"></label><label>联系人手机<input name="mobile" required inputmode="tel" maxlength="30" value="${escapeHtml(record.mobile)}"></label></div><div class="two-col"><label>期望上门日期<input name="expectedDate" type="date" required min="${today()}" value="${today()}"></label><label>期望时段<input name="expectedTimeWindow" maxlength="100" placeholder="例如 09:00-12:00"></label></div><div class="region-grid"><label>省份<input name="province" required value="${escapeHtml(record.province)}"></label><label>城市<input name="city" value="${escapeHtml(record.city)}"></label><label>区县<input name="district" value="${escapeHtml(record.district)}"></label><label>街道<input name="street" value="${escapeHtml(record.street)}"></label></div><label>详细地址<input name="address" required maxlength="500" value="${escapeHtml(record.address)}"></label><label id="faultField" hidden>故障分类<select name="faultId">${faultOptions(initial.productId)}</select></label><label id="problemField" hidden>问题描述<textarea name="problemDescription" maxlength="500" placeholder="请描述故障现象"></textarea></label><label>受理备注<textarea name="remark" maxlength="200" placeholder="选填"></textarea></label><p class="form-error" id="serviceError" hidden></p></form>`, `<button type="button" data-close-drawer>取消</button><button type="submit" form="serviceForm" class="primary-button">提交服务工单</button>`)
    updateServiceFields()
  }

  function updateServiceInstance() {
    const form = $('#serviceForm')
    const selected = form?.querySelector('input[name="instanceId"]:checked')
    if (!form || !selected) return
    const record = recordById(form.dataset.recordId)
    const instance = record?.instances.find((item) => item.id === selected.value)
    if (!instance) return
    const installation = $('#installationType')
    const installAllowed = instance.status === 'AVAILABLE'
    installation.disabled = !installAllowed
    $('#installChoiceHint').textContent = installAllowed ? '' : '已申请安装'
    if (!installAllowed && installation.checked) form.querySelector('input[name="type"][value="REPAIR"]').checked = true
    const faultSelect = form.querySelector('select[name="faultId"]')
    if (faultSelect) faultSelect.innerHTML = faultOptions(instance.productId)
    updateServiceFields()
  }

  function updateServiceFields() {
    const repair = $('#serviceForm input[name="type"]:checked')?.value === 'REPAIR'
    const fault = $('#faultField')
    const problem = $('#problemField')
    if (!fault || !problem) return
    fault.hidden = !repair
    problem.hidden = !repair
    fault.querySelector('select').required = repair
    problem.querySelector('textarea').required = repair
  }

  function submitService(form) {
    const data = new FormData(form)
    const record = recordById(form.dataset.recordId)
    const instance = record?.instances.find((item) => item.id === data.get('instanceId'))
    const type = String(data.get('type') ?? '')
    const error = $('#serviceError')
    if (!record || !instance || instance.status === 'RETURNED') { error.textContent = '购买记录或商品状态已变化，请重新选择。'; error.hidden = false; return }
    if (activeOrderForInstance(instance.id)) { error.textContent = '该商品已有进行中的服务工单，请先查看工单进度。'; error.hidden = false; return }
    if (type === 'INSTALLATION' && instance.status !== 'AVAILABLE') { error.textContent = '该商品已申请安装，不能重复提交。'; error.hidden = false; return }
    const mobile = String(data.get('mobile')).replace(/\s/g, '')
    if (!/^1\d{10}$/.test(mobile)) { error.textContent = '请填写 11 位手机号。'; error.hidden = false; return }
    if (type === 'REPAIR' && (!data.get('faultId') || !String(data.get('problemDescription')).trim())) { error.textContent = '维修工单必须选择故障分类并填写问题描述。'; error.hidden = false; return }
    if (type === 'INSTALLATION') instance.status = 'APPOINTED'
    const selectedFault = (faults[instance.productId] ?? []).find((item) => item.id === data.get('faultId'))
    const newOrder = { id: `o${Date.now()}`, clientRequestId: clientRequestId(), no: `SO-DEMO-${String(orders.length + 1).padStart(3, '0')}`, recordId: record.id, instanceId: instance.id, type, status: 'PENDING_DISPATCH', expectedDate: String(data.get('expectedDate')), expectedTimeWindow: String(data.get('expectedTimeWindow')).trim(), fault: selectedFault?.name ?? '', note: type === 'REPAIR' ? String(data.get('problemDescription')).trim() : String(data.get('remark')).trim(), events: [{ status: 'PENDING_DISPATCH', time: new Date().toLocaleString('zh-CN', { hour12: false }) }] }
    orders.unshift(newOrder)
    closeDrawer()
    state.recordFilter = 'all'
    state.orderFilter = 'PENDING_DISPATCH'
    render()
    toast(`${typeLabel(type)}工单已创建，当前进入“客服安排中”。`)
  }

  function openOrder(id) {
    const order = orders.find((item) => item.id === id)
    if (!order) return
    const record = recordById(order.recordId)
    const instance = record?.instances.find((item) => item.id === order.instanceId)
    const completed = ['COMPLETED', 'CANCELLED'].includes(order.status)
    openDrawer('服务工单详情 · 只读', order.no, `<div class="service-readonly"><span class="order-state ${completed ? 'completed' : ''}">${escapeHtml(statusLabel(order.status))}</span><h3>${escapeHtml(typeLabel(order.type))} · ${escapeHtml(instance?.product)}</h3><dl><div><dt>联系人</dt><dd>${escapeHtml(record?.customer)}</dd></div><div><dt>联系手机</dt><dd>${escapeHtml(record?.mobile)}</dd></div><div><dt>购买登记单</dt><dd>${escapeHtml(record?.no)}</dd></div><div><dt>登记门店</dt><dd>${escapeHtml(storeName(record?.storeId))}</dd></div><div><dt>期望上门日期</dt><dd>${escapeHtml(order.expectedDate)}</dd></div><div><dt>期望时段</dt><dd>${escapeHtml(order.expectedTimeWindow || '未填写')}</dd></div></dl>${order.fault ? `<div class="drawer-note"><strong>故障分类：</strong>${escapeHtml(order.fault)}<br>${escapeHtml(order.note)}</div>` : `<div class="drawer-note">${escapeHtml(order.note || '未填写补充说明')}</div>`}<div class="drawer-section-title">状态轨迹</div><ol class="timeline">${order.events.map((event) => `<li><b>${escapeHtml(eventLabel(event.status))}</b>${escapeHtml(event.time)}</li>`).join('')}</ol><p class="drawer-note">门店在当前权限下只查看工单详情和状态轨迹，不执行分站、分人、完工或审核。</p></div>`, `<button type="button" data-close-drawer>关闭</button>`)
  }

  function updateSearchPlaceholder() {
    const placeholders = { keyword: '输入登记单号、安装码或门店名称', mobile: '输入完整手机号', name: '输入完整顾客姓名' }
    $('#searchInput').placeholder = placeholders[state.searchType]
    $('#searchInput').setAttribute('aria-label', placeholders[state.searchType])
  }

  function init() {
    updateSearchPlaceholder()
    $('#searchType').addEventListener('change', (event) => { state.searchType = event.target.value; state.query = ''; $('#searchInput').value = ''; updateSearchPlaceholder(); render(); $('#searchInput').focus() })
    $('#searchForm').addEventListener('submit', (event) => { event.preventDefault(); state.query = $('#searchInput').value.trim(); state.recordFilter = 'all'; render() })
    $('#clearSearch').addEventListener('click', () => { state.query = ''; $('#searchInput').value = ''; render(); $('#searchInput').focus() })
    $('#registerButton').addEventListener('click', openRegistration)
    $('#closeDrawer').addEventListener('click', closeDrawer)
    $('#drawerBackdrop').addEventListener('click', closeDrawer)
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeDrawer() })
    document.addEventListener('click', (event) => {
      const target = event.target.closest('button')
      if (!target) return
      if (target.dataset.viewRecord) { openRecord(target.dataset.viewRecord); return }
      if (target.dataset.createService) { openService(target.dataset.createService); return }
      if (target.dataset.orderId) { openOrder(target.dataset.orderId); return }
      if (target.dataset.recordFilter) { state.recordFilter = target.dataset.recordFilter; renderRecords(); return }
      if (target.dataset.orderFilter) { state.orderFilter = target.dataset.orderFilter; renderOrders(); return }
      if (target.dataset.closeDrawer !== undefined) { closeDrawer(); return }
      if (target.dataset.nav === 'registration') { openRegistration(); return }
      if (target.dataset.nav === 'orders') { openOrdersOverview(); return }
      if (target.dataset.nav) { const section = { top: '#top', records: '#recordsSection', orders: '#ordersSection' }[target.dataset.nav]; $(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelectorAll('[data-nav]').forEach((button) => button.classList.toggle('active', button === target)) }
    })
    document.addEventListener('change', (event) => {
      if (event.target.name === 'instanceId') updateServiceInstance()
      if (event.target.name === 'type') updateServiceFields()
    })
    document.addEventListener('submit', (event) => {
      if (event.target.id === 'registrationForm') { event.preventDefault(); submitRegistration(event.target) }
      if (event.target.id === 'serviceForm') { event.preventDefault(); submitService(event.target) }
    })
    window.addEventListener('resize', drawStoreCharts)
    render()
  }

  init()
})()
