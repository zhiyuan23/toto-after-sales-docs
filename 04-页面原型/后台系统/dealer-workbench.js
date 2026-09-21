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
    { id: 'o2', no: 'SO-20260919-014', recordId: 'r3', instanceId: 'i3', type: 'REPAIR', status: 'PENDING_COMPLETION', expectedDate: '2026-09-22', expectedTimeWindow: '09:00—12:00', station: '徐汇服务站', personnel: '王师傅', fault: '出水量异常', note: '出水量变小', events: [{ status: 'PENDING_COMPLETION', time: '2026-09-21 09:15' }, { status: 'PENDING_DISPATCH', time: '2026-09-19 10:25' }] },
    { id: 'o3', no: 'SO-20260901-008', recordId: 'r4', instanceId: 'i4', type: 'INSTALLATION', status: 'COMPLETED', expectedDate: '2026-09-03', expectedTimeWindow: '下午', station: '徐汇服务站', personnel: '李师傅', note: '安装服务已完成', events: [{ status: 'COMPLETED', time: '2026-09-03 16:20' }, { status: 'PENDING_DISPATCH', time: '2026-09-01 11:10' }] },
    { id: 'o4', no: 'SO-20260919-009', recordId: 'r5', instanceId: 'i5', type: 'REPAIR', status: 'PENDING_ASSIGNMENT', expectedDate: '2026-09-25', expectedTimeWindow: '全天', station: '浦东服务站', personnel: '', fault: '阀芯漏水', note: '阀芯位置持续滴水', events: [{ status: 'PENDING_ASSIGNMENT', time: '2026-09-20 08:40' }, { status: 'PENDING_DISPATCH', time: '2026-09-19 14:10' }] }
  ]

  const state = { query: '', searchType: 'keyword', recordFilter: 'all', selectedRecordId: 'r1', selectedInstanceId: 'i1', orderFilter: 'all', lastFocus: null }
  const $ = (selector) => document.querySelector(selector)
  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character])
  const icon = (name) => `<svg aria-hidden="true"><use href="#i-${name}"/></svg>`
  const recordById = (id) => records.find((record) => record.id === id)
  const activeStatuses = new Set(['PENDING_DISPATCH', 'PENDING_ASSIGNMENT', 'PENDING_COMPLETION', 'PENDING_REVIEW'])
  const activeOrderForInstance = (id) => orders.find((order) => order.instanceId === id && activeStatuses.has(order.status))
  const today = () => { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` }
  const clientRequestId = () => `dealer-${Date.now()}-${Math.random().toString(16).slice(2)}`
  const compact = (value) => String(value ?? '').toLowerCase().replace(/\s/g, '')
  const storeName = (id) => stores.find((store) => store.id === id)?.name ?? '—'
  const typeLabel = (type) => ({ INSTALLATION: '安装', REPAIR: '维修' })[type] ?? type
  const statusLabel = (status) => ({ PENDING_VERIFICATION: '客服受理中', PENDING_DISPATCH: '客服安排中', PENDING_ASSIGNMENT: '服务站安排中', PENDING_COMPLETION: '服务履约中', PENDING_REVIEW: '完工审核中', COMPLETED: '已完成', CANCELLED: '已取消' })[status] ?? status
  const eventLabel = (status) => ({ PENDING_DISPATCH: '工单进入待分配服务站', PENDING_ASSIGNMENT: '服务站已确定，等待分配人员', PENDING_COMPLETION: '服务人员处理中', PENDING_REVIEW: '完工资料待审核', COMPLETED: '服务已完成', CANCELLED: '工单已取消' })[status] ?? statusLabel(status)
  const serviceOwner = (order) => order.personnel ? `${order.station} · ${order.personnel}` : order.station ? `${order.station} · 服务人员待确定` : '服务站待确定'

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

  function selectedRecord() { return records.find((record) => record.id === state.selectedRecordId) }

  function keepVisibleSelection(list) {
    if (!list.some((record) => record.id === state.selectedRecordId)) {
      state.selectedRecordId = list[0]?.id ?? null
      state.selectedInstanceId = list[0]?.instances[0]?.id ?? null
    }
    const record = selectedRecord()
    if (record && !record.instances.some((instance) => instance.id === state.selectedInstanceId)) state.selectedInstanceId = record.instances[0]?.id ?? null
  }

  function emptyState(title, copy) {
    return `<div class="empty-state">${icon('search')}<strong>${escapeHtml(title)}</strong><p>${escapeHtml(copy)}</p></div>`
  }

  function renderRecords() {
    const list = visibleRecords()
    keepVisibleSelection(list)
    $('#recordCount').textContent = `${list.length} 条记录`
    $('#recordList').innerHTML = list.length ? list.map((record) => {
      const appointment = appointmentState(record)
      const selected = record.id === state.selectedRecordId
      return `<button type="button" class="record-item ${selected ? 'selected' : ''}" data-record-id="${record.id}" aria-pressed="${selected}"><span class="record-avatar">${escapeHtml(record.customer.slice(0, 1))}</span><span class="record-main"><strong>${escapeHtml(record.customer)} · ${escapeHtml(record.mobile)}</strong><small>${escapeHtml(record.no)} · ${record.instances.length} 件商品</small></span><span class="record-aside"><em class="${appointment.key !== 'appointed' ? 'status-mini' : ''}">${appointment.label}</em><small>${escapeHtml(record.purchaseDate)}</small></span></button>`
    }).join('') : emptyState('没有符合条件的购买记录', state.query ? '请核对当前查询类型和输入内容。姓名、手机号需精确匹配。' : '可切换安装状态筛选，或从顶部查询。')
    renderRecordDetail()
    document.querySelectorAll('[data-record-filter]').forEach((button) => {
      button.classList.toggle('active', button.dataset.recordFilter === state.recordFilter)
      button.setAttribute('aria-pressed', String(button.dataset.recordFilter === state.recordFilter))
    })
    $('#clearSearch').hidden = !state.query
  }

  function renderRecordDetail() {
    const record = selectedRecord()
    if (!record) {
      $('#recordDetail').innerHTML = emptyState('选择一条购买记录', '核对购买人和商品实例后，再办理本次服务需求。')
      return
    }
    const instance = record.instances.find((item) => item.id === state.selectedInstanceId) ?? record.instances[0]
    const relatedOrders = orders.filter((order) => order.recordId === record.id)
    $('#recordDetail').innerHTML = `<span class="detail-eyebrow">当前选择 · 购买记录详情</span><div class="detail-head"><div><h3>${escapeHtml(record.customer)}</h3><p>${escapeHtml(record.mobile)} · ${escapeHtml(appointmentState(record).label)}</p></div><span class="record-code">${escapeHtml(record.no)}</span></div><dl class="detail-facts"><div><dt>购买日期</dt><dd>${escapeHtml(record.purchaseDate)}</dd></div><div><dt>登记门店</dt><dd>${escapeHtml(storeName(record.storeId))}</dd></div><div><dt>关联工单</dt><dd>${relatedOrders.length} 笔</dd></div></dl><p class="detail-label">选择本次需要服务的商品</p><div class="instance-list">${record.instances.map((item) => `<label class="instance-item"><input type="radio" name="selected-instance" value="${item.id}" ${item.id === instance.id ? 'checked' : ''}><span>${icon('receipt')}</span><div><strong>${escapeHtml(item.product)}</strong><small>安装码 ${escapeHtml(item.code)}</small></div><em class="${item.status === 'AVAILABLE' ? 'busy' : ''}">${item.status === 'AVAILABLE' ? '可申请安装' : item.status === 'APPOINTED' ? '已申请安装' : '已退回'}</em></label>`).join('')}</div><div class="detail-foot"><p>系统在提交时校验商品状态和活动工单，重复申请会被拒绝。</p><button type="button" class="primary-button" id="startServiceButton">发起安装 / 维修 ${icon('arrow')}</button></div>`
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

  function render() { renderRecords(); renderOrders() }

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
    const product = products.find((item) => item.id === data.get('productId'))
    const id = `r${Date.now()}`
    const stamp = Date.now()
    const newRecord = { id, clientRequestId: clientRequestId(), storeId: String(data.get('storeId')), no: `REG-DEMO-${String(records.length + 1).padStart(3, '0')}`, customer: String(data.get('customer')).trim(), mobile, purchaseDate: String(data.get('purchaseDate')), province: String(data.get('province')).trim(), city: String(data.get('city')).trim(), district: String(data.get('district')).trim(), street: String(data.get('street')).trim(), address: String(data.get('address')).trim(), instances: codes.map((code, index) => ({ id: `i${stamp}-${index + 1}`, productId: product.id, product: product.name, code, status: 'AVAILABLE' })) }
    records.unshift(newRecord)
    state.query = ''
    $('#searchInput').value = ''
    state.recordFilter = 'all'
    state.selectedRecordId = id
    state.selectedInstanceId = newRecord.instances[0].id
    closeDrawer()
    render()
    toast('购买登记已保存；当前没有自动创建服务工单。')
  }

  function faultOptions(productId) { return (faults[productId] ?? []).map((fault) => `<option value="${fault.id}">${escapeHtml(fault.name)}</option>`).join('') }

  function openService() {
    const record = selectedRecord()
    const instance = record?.instances.find((item) => item.id === state.selectedInstanceId)
    if (!record || !instance || instance.status === 'RETURNED') { renderRecordDetail(); return }
    const installAllowed = instance.status === 'AVAILABLE'
    openDrawer('购买记录 · 发起服务', '办理安装或维修', `<div class="drawer-note"><strong>${escapeHtml(record.customer)} · ${escapeHtml(record.no)}</strong><br>${escapeHtml(instance.product)} · 安装码 ${escapeHtml(instance.code)}<br>提交时由系统再次校验购买登记、商品状态和活动工单。</div><form id="serviceForm" class="drawer-form"><div class="type-choice"><label><input type="radio" name="type" value="INSTALLATION" ${installAllowed ? 'checked' : 'disabled'}>安装${installAllowed ? '' : '（商品已申请）'}</label><label><input type="radio" name="type" value="REPAIR" ${installAllowed ? '' : 'checked'}>维修</label></div><div class="two-col"><label>联系人姓名<input name="contactName" required maxlength="100" value="${escapeHtml(record.customer)}"></label><label>联系人手机<input name="mobile" required inputmode="tel" maxlength="30" value="${escapeHtml(record.mobile)}"></label></div><div class="two-col"><label>期望上门日期<input name="expectedDate" type="date" required min="${today()}" value="${today()}"></label><label>期望时段<input name="expectedTimeWindow" maxlength="100" placeholder="例如 09:00—12:00"></label></div><div class="region-grid"><label>省份<input name="province" required value="${escapeHtml(record.province)}"></label><label>城市<input name="city" value="${escapeHtml(record.city)}"></label><label>区县<input name="district" value="${escapeHtml(record.district)}"></label><label>街道<input name="street" value="${escapeHtml(record.street)}"></label></div><label>详细地址<input name="address" required maxlength="500" value="${escapeHtml(record.address)}"></label><label id="faultField" hidden>故障分类<select name="faultId">${faultOptions(instance.productId)}</select></label><label id="problemField" hidden>问题描述<textarea name="problemDescription" maxlength="500" placeholder="请描述故障现象"></textarea></label><label>受理备注<textarea name="remark" maxlength="200" placeholder="选填"></textarea></label><p class="form-error" id="serviceError" hidden></p></form>`, `<button type="button" data-close-drawer>取消</button><button type="submit" form="serviceForm" class="primary-button">提交服务工单</button>`)
    $('#serviceForm').dataset.recordId = record.id
    $('#serviceForm').dataset.instanceId = instance.id
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
    const instance = record?.instances.find((item) => item.id === form.dataset.instanceId)
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
      if (target.dataset.recordId) { state.selectedRecordId = target.dataset.recordId; state.selectedInstanceId = selectedRecord()?.instances[0]?.id ?? null; renderRecords(); return }
      if (target.dataset.orderId) { openOrder(target.dataset.orderId); return }
      if (target.dataset.recordFilter) { state.recordFilter = target.dataset.recordFilter; renderRecords(); return }
      if (target.dataset.orderFilter) { state.orderFilter = target.dataset.orderFilter; renderOrders(); return }
      if (target.dataset.closeDrawer !== undefined) { closeDrawer(); return }
      if (target.id === 'startServiceButton') { openService(); return }
      if (target.dataset.nav === 'registration') { openRegistration(); return }
      if (target.dataset.nav) { const section = { top: '#top', records: '#recordsSection', orders: '#ordersSection' }[target.dataset.nav]; $(section)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); document.querySelectorAll('[data-nav]').forEach((button) => button.classList.toggle('active', button === target)) }
    })
    document.addEventListener('change', (event) => {
      if (event.target.name === 'selected-instance') { state.selectedInstanceId = event.target.value; renderRecordDetail() }
      if (event.target.name === 'type') updateServiceFields()
    })
    document.addEventListener('submit', (event) => {
      if (event.target.id === 'registrationForm') { event.preventDefault(); submitRegistration(event.target) }
      if (event.target.id === 'serviceForm') { event.preventDefault(); submitService(event.target) }
    })
    render()
  }

  init()
})()
