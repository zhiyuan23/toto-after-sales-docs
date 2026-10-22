const today = '2026-09-20';
const station = { id: '5101', code: 'SH-PD', name: '上海浦东服务站' };
const seed = {
  people: [
    { id: '2101', code: 'P-021', name: '周明', mobile: '138****4382', skillTypes: ['INSTALLATION', 'REPAIR'], availability: 'AVAILABLE', scheduleStatus: 'PUBLISHED', dailyCapacity: 5 },
    { id: '2102', code: 'P-018', name: '陈婷', mobile: '139****7164', skillTypes: ['INSTALLATION', 'REPAIR'], availability: 'AVAILABLE', scheduleStatus: 'PUBLISHED', dailyCapacity: 4 },
    { id: '2103', code: 'P-033', name: '刘斌', mobile: '137****2569', skillTypes: ['REPAIR', 'CLEANING'], availability: 'AVAILABLE', scheduleStatus: 'PUBLISHED', dailyCapacity: 5 },
    { id: '2104', code: 'P-027', name: '赵晨', mobile: '136****8820', skillTypes: ['INSTALLATION', 'CLEANING'], availability: 'AVAILABLE', scheduleStatus: 'PUBLISHED', dailyCapacity: 4 },
    { id: '2105', code: 'P-042', name: '韩伟', mobile: '135****9031', skillTypes: ['REPAIR'], availability: 'AVAILABLE', scheduleStatus: 'PUBLISHED', dailyCapacity: 1 },
    { id: '2106', code: 'P-025', name: '吴悦', mobile: '158****6621', skillTypes: ['INSTALLATION'], availability: 'LEAVE', scheduleStatus: 'PUBLISHED', dailyCapacity: 5 },
    { id: '2107', code: 'P-039', name: '方磊', mobile: '150****1724', skillTypes: ['REPAIR', 'CLEANING'], availability: 'SUSPENDED', scheduleStatus: 'PUBLISHED', dailyCapacity: 5 }
  ],
  orders: [
    { id: '10031', orderNo: 'SO-0920-031', orderType: 'REPAIR', contactNameMasked: '徐女士', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '张江', expectedDate: today, expectedTimeWindow: '09:30', createTime: '2026-09-20T09:26:00', status: 'PENDING_ASSIGNMENT', personnelId: '', personnelAssignmentStatus: 'FAILED', personnelAssignmentFailureReason: 'AI 分配超时，已转人工处理', actions: ['dispatch'], version: 'v1' },
    { id: '10029', orderNo: 'SO-0920-029', orderType: 'INSTALLATION', contactNameMasked: '蒋先生', instances: [{ productCode: 'TOTO-SW01', productName: '智能盖板' }], districtName: '浦东新区', streetName: '金桥', expectedDate: today, expectedTimeWindow: '14:00', createTime: '2026-09-20T08:56:00', status: 'PENDING_ASSIGNMENT', personnelId: '', personnelAssignmentStatus: 'PENDING', personnelAssignmentFailureReason: '', actions: ['dispatch'], version: 'v1' },
    { id: '10024', orderNo: 'SO-0920-024', orderType: 'CLEANING', contactNameMasked: '林女士', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '花木', expectedDate: today, expectedTimeWindow: '18:00', createTime: '2026-09-20T08:12:00', status: 'PENDING_ASSIGNMENT', personnelId: '', personnelAssignmentStatus: 'FAILED', personnelAssignmentFailureReason: '智能分配未找到未满容量人员', actions: ['dispatch'], version: 'v1' },
    { id: '10018', orderNo: 'SO-0920-018', orderType: 'REPAIR', contactNameMasked: '郑先生', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '张江', expectedDate: today, expectedTimeWindow: '11:30', createTime: '2026-09-20T07:48:00', status: 'PENDING_COMPLETION', personnelId: '2101', actions: ['submitCompletion'], version: 'v1' },
    { id: '10017', orderNo: 'SO-0920-017', orderType: 'INSTALLATION', contactNameMasked: '董女士', instances: [{ productCode: 'TOTO-SW01', productName: '智能盖板' }], districtName: '浦东新区', streetName: '花木', expectedDate: '2026-09-21', expectedTimeWindow: '10:00', createTime: '2026-09-19T16:28:00', status: 'PENDING_COMPLETION', personnelId: '2102', actions: ['submitCompletion'], version: 'v1' },
    { id: '10019', orderNo: 'SO-0920-019', orderType: 'REPAIR', contactNameMasked: '陆先生', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '陆家嘴', expectedDate: today, expectedTimeWindow: '15:00', createTime: '2026-09-20T09:18:00', status: 'PENDING_COMPLETION', personnelId: '2103', exceptionCode: 'MISSING_PARTS', exceptionReason: '进水阀缺件，待核对领料申请与预计到件时间', exceptionPreviousStatus: 'PENDING_COMPLETION', actions: ['reopen'], version: 'v1' },
    { id: '10046', orderNo: 'SO-0919-046', orderType: 'INSTALLATION', contactNameMasked: '钱女士', instances: [{ productCode: 'TOTO-BW01', productName: '浴室柜' }], districtName: '浦东新区', streetName: '北蔡', expectedDate: '2026-09-21', expectedTimeWindow: '', createTime: '2026-09-19T17:42:00', status: 'PENDING_COMPLETION', personnelId: '2102', exceptionCode: 'RESCHEDULE', exceptionReason: '顾客希望调整上门时间，等待重新确认', exceptionPreviousStatus: 'PENDING_COMPLETION', actions: ['reopen'], version: 'v1' },
    { id: '10002', orderNo: 'SO-0920-002', orderType: 'INSTALLATION', contactNameMasked: '汪女士', instances: [{ productCode: 'TOTO-SW01', productName: '智能盖板' }], districtName: '浦东新区', streetName: '金桥', expectedDate: today, expectedTimeWindow: '08:30', createTime: '2026-09-18T09:10:00', status: 'COMPLETED', personnelId: '2101', actions: [], version: 'v1' },
    { id: '10011', orderNo: 'SO-0920-011', orderType: 'REPAIR', contactNameMasked: '杨先生', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '张江', expectedDate: today, expectedTimeWindow: '14:00', createTime: '2026-09-18T11:22:00', status: 'PENDING_REVIEW', personnelId: '2101', actions: [], version: 'v1' },
    { id: '10007', orderNo: 'SO-0920-007', orderType: 'INSTALLATION', contactNameMasked: '梅女士', instances: [{ productCode: 'TOTO-BW01', productName: '浴室柜' }], districtName: '浦东新区', streetName: '花木', expectedDate: today, expectedTimeWindow: '10:30', createTime: '2026-09-18T12:40:00', status: 'COMPLETED', personnelId: '2102', actions: [], version: 'v1' },
    { id: '10016', orderNo: 'SO-0920-016', orderType: 'REPAIR', contactNameMasked: '邱先生', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '联洋', expectedDate: today, expectedTimeWindow: '16:00', createTime: '2026-09-18T14:20:00', status: 'PENDING_REVIEW', personnelId: '2102', actions: [], version: 'v1' },
    { id: '10005', orderNo: 'SO-0920-005', orderType: 'REPAIR', contactNameMasked: '任女士', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '陆家嘴', expectedDate: today, expectedTimeWindow: '09:00', createTime: '2026-09-18T14:55:00', status: 'COMPLETED', personnelId: '2103', actions: [], version: 'v1' },
    { id: '10014', orderNo: 'SO-0920-014', orderType: 'CLEANING', contactNameMasked: '何先生', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '北蔡', expectedDate: today, expectedTimeWindow: '13:30', createTime: '2026-09-18T16:30:00', status: 'PENDING_REVIEW', personnelId: '2103', actions: [], version: 'v1' },
    { id: '10009', orderNo: 'SO-0920-009', orderType: 'INSTALLATION', contactNameMasked: '彭女士', instances: [{ productCode: 'TOTO-SW01', productName: '智能盖板' }], districtName: '浦东新区', streetName: '三林', expectedDate: today, expectedTimeWindow: '11:00', createTime: '2026-09-19T10:12:00', status: 'COMPLETED', personnelId: '2104', actions: [], version: 'v1' },
    { id: '10020', orderNo: 'SO-0920-020', orderType: 'REPAIR', contactNameMasked: '顾先生', instances: [{ productCode: 'TOTO-GW01', productName: '智能坐便器' }], districtName: '浦东新区', streetName: '川沙', expectedDate: today, expectedTimeWindow: '15:00', createTime: '2026-09-19T11:00:00', status: 'PENDING_REVIEW', personnelId: '2105', actions: [], version: 'v1' }
  ],
  candidates: {
    '10031': [{ id: '2103', recommended: true, available: true, skilled: true, assignedCount: 2, dailyCapacity: 5, overCapacity: false }, { id: '2101', recommended: false, available: true, skilled: true, assignedCount: 2, dailyCapacity: 5, overCapacity: false }, { id: '2105', recommended: false, available: true, skilled: true, assignedCount: 1, dailyCapacity: 1, overCapacity: true }],
    '10029': [{ id: '2102', recommended: true, available: true, skilled: true, assignedCount: 2, dailyCapacity: 4, overCapacity: false }, { id: '2104', recommended: false, available: true, skilled: true, assignedCount: 1, dailyCapacity: 4, overCapacity: false }, { id: '2106', recommended: false, available: false, skilled: true, assignedCount: 0, dailyCapacity: 5, overCapacity: false }],
    '10024': [{ id: '2104', recommended: true, available: true, skilled: true, assignedCount: 1, dailyCapacity: 4, overCapacity: false }, { id: '2103', recommended: false, available: true, skilled: true, assignedCount: 2, dailyCapacity: 5, overCapacity: false }, { id: '2107', recommended: false, available: false, skilled: true, assignedCount: 0, dailyCapacity: 5, overCapacity: false }]
  },
  stock: [
    { partId: '3101', partCode: 'PJ-1042', partName: '进水阀', ownerType: 'STATION', ownerId: station.id, quantity: 6 },
    { partId: '3102', partCode: 'PJ-2031', partName: '安装固定件', ownerType: 'STATION', ownerId: station.id, quantity: 12 },
    { partId: '3103', partCode: 'PJ-3188', partName: '密封圈', ownerType: 'STATION', ownerId: station.id, quantity: 4 }
  ],
  parts: [
    { id: '4106', documentNo: 'LL-0920-006', documentType: 'REQUISITION', status: 'PROCESSING', personnelId: '2101', personnelName: '周明', workOrderId: '10011', createTime: '2026-09-20T09:03:00', reason: '维修工单领料', lines: [{ partId: '3101', partCode: 'PJ-1042', partName: '进水阀', quantity: 1, personnelQuantity: 1 }], actions: ['approve', 'reject'], version: 'v1' },
    { id: '4107', documentNo: 'LL-0920-007', documentType: 'REQUISITION', status: 'PROCESSING', personnelId: '2103', personnelName: '刘斌', workOrderId: '10019', createTime: '2026-09-20T09:21:00', reason: '缺件工单补料', lines: [{ partId: '3101', partCode: 'PJ-1042', partName: '进水阀', quantity: 1, personnelQuantity: 0 }], actions: ['approve', 'reject'], version: 'v1' },
    { id: '4103', documentNo: 'TL-0920-003', documentType: 'RETURN', status: 'PROCESSING', personnelId: '2102', personnelName: '陈婷', workOrderId: '10014', createTime: '2026-09-20T08:39:00', reason: '完工后剩余配件退回', lines: [{ partId: '3102', partCode: 'PJ-2031', partName: '安装固定件', quantity: 2, personnelQuantity: 3 }], actions: ['approve', 'reject'], version: 'v1' }
  ]
};
let data = structuredClone(seed);
let activeTab = 'all';
let selectedTask = null;
let preferredNextIndex = null;
let peopleFilter = 'all';
let lastFocus = null;
let toastTimer;
const $ = selector => document.querySelector(selector);
const safe = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
const timeText = value => !value ? '待确认' : value.startsWith(today) ? value.slice(11, 16) : value.slice(5, 10) + ' ' + value.slice(11, 16);
const visitText = order => order.expectedDate ? order.expectedDate + (order.expectedTimeWindow ? ' ' + order.expectedTimeWindow.slice(0, 5) : '') : '待确认';
const personFor = id => data.people.find(person => person.id === id);
const kindFor = part => part.documentType === 'REQUISITION' ? '领料' : '退料';
const typeLabel = value => ({ INSTALLATION: '安装', REPAIR: '维修', CLEANING: '清洗', GUIDANCE: '指导' })[value] || value;
const productText = order => (order.instances || []).map(row => row.productName).filter(Boolean).join('、') + (order.orderType ? ' · ' + typeLabel(order.orderType) : '');
const areaText = order => [order.districtName, order.streetName].filter(Boolean).join(' · ') || '—';
const relatedOrderText = part => data.orders.find(order => order.id === part.workOrderId)?.orderNo || 'ID ' + part.workOrderId;
const statusText = order => ({ PENDING_ASSIGNMENT: '待分配', PENDING_COMPLETION: '待完工', PENDING_REVIEW: '待审核', COMPLETED: '已完成', CANCELLED: '已取消' })[order.status] || order.status;
const availabilityText = value => ({ AVAILABLE: '可用', LEAVE: '请假', SUSPENDED: '暂停' })[value] || value;
const taskLabels = { assignment: '待分配', parts: '领退料审批' };
function taskType(order) {
  return order.status === 'PENDING_ASSIGNMENT' && !order.personnelId && order.actions.includes('dispatch') ? 'assignment' : null;
}
function allPending() {
  return [...data.orders.filter(order => taskType(order)).map(item => ({ type: 'assignment', item })), ...data.parts.filter(part => part.status === 'PROCESSING' && part.actions.some(action => action === 'approve' || action === 'reject')).map(item => ({ type: 'parts', item }))];
}
function tabRows(tab) {
  return allPending().filter(row => tab === 'all' || row.type === tab);
}
function renderCounts() {
  const assignment = tabRows('assignment').map(row => row.item);
  const parts = tabRows('parts').map(row => row.item);
  const values = {
    statAll: assignment.length + parts.length,
    statAllAssignment: assignment.length,
    statAllParts: parts.length,
    statAssignment: assignment.length,
    statAutoFailed: assignment.filter(order => order.personnelAssignmentStatus === 'FAILED').length,
    statNormalAssignment: assignment.filter(order => order.personnelAssignmentStatus !== 'FAILED').length,
    statParts: parts.length,
    statRequisition: parts.filter(part => part.documentType === 'REQUISITION').length,
    statReturn: parts.filter(part => part.documentType === 'RETURN').length,
    statToday: data.orders.filter(order => order.expectedDate === today).length,
    statMissingPart: data.orders.filter(order => order.exceptionCode === 'MISSING_PARTS').length,
    workingCountTop: data.people.filter(person => person.availability === 'AVAILABLE').length,
    tabAllCount: allPending().length,
    tabAssignmentCount: assignment.length,
    tabPartsCount: parts.length,
    navAssignmentCount: assignment.length,
    navPartsCount: parts.length,
    workingCount: data.people.filter(person => person.availability === 'AVAILABLE').length,
    leaveCount: data.people.filter(person => person.availability === 'LEAVE').length,
    stoppedCount: data.people.filter(person => person.availability === 'SUSPENDED').length
  };
  Object.entries(values).forEach(([id, value]) => { document.getElementById(id).textContent = value; });
}
function getVisibleTasks() {
  const keyword = $('#taskSearch').value.trim().toLocaleLowerCase();
  return tabRows(activeTab).filter(({ item }) => [
    item.orderNo, item.documentNo, item.contactNameMasked, item.personnelName, item.workOrderId ? relatedOrderText(item) : '',
    productText(item), areaText(item), item.exceptionReason, ...(item.lines || []).map(line => line.partName)
  ].some(value => String(value ?? '').toLocaleLowerCase().includes(keyword)))
    .sort((a, b) => b.item.createTime.localeCompare(a.item.createTime) || a.item.id.localeCompare(b.item.id));
}
function renderTaskItem({ type, item }) {
  const current = selectedTask?.type === type && selectedTask?.id === item.id;
  const isPart = type === 'parts';
  const number = isPart ? item.documentNo : item.orderNo;
  const summary = isPart ? item.personnelName + ' · ' + kindFor(item) + ' ' + item.lines.map(line => line.partName + ' × ' + line.quantity).join('、') : item.contactNameMasked + ' · ' + typeLabel(item.orderType);
  const context = isPart ? '关联 ' + relatedOrderText(item) + ' · ' + item.reason : areaText(item) + ' · ' + (item.exceptionReason || '期望 ' + visitText(item));
  const next = type === 'assignment' ? '选择服务人员' : '核对双方库存并审批';
  return `<button type="button" class="queue-item ${current ? 'is-current' : ''}" data-select="${type}" data-id="${safe(item.id)}" aria-current="${current}"><span class="queue-item-top"><strong>${safe(number)}</strong><time datetime="${safe(item.createTime)}">${safe(timeText(item.createTime))}</time></span><span class="queue-item-summary"><b>${safe(summary)}</b><em class="task-category ${type}">${taskLabels[type]}</em></span><span class="queue-item-context">${safe(context)}</span><span class="queue-item-next">${next}</span></button>`;
}
function renderTasks() {
  const rows = getVisibleTasks();
  const list = $('#taskList');
  const oldScroll = list.scrollTop;
  $('#taskPanelCount').textContent = tabRows(activeTab).length + (activeTab === 'all' ? ' 项' : ' 单');
  $('#taskFootnote').textContent = activeTab === 'all' ? '按各单据创建时间混排 · 最新在前' : taskLabels[activeTab] + ' · 按创建时间排序';
  if (!rows.some(({ type, item }) => selectedTask?.type === type && selectedTask?.id === item.id)) {
    const next = rows[Math.max(0, Math.min(preferredNextIndex ?? 0, rows.length - 1))];
    selectedTask = next ? { type: next.type, id: next.item.id } : null;
  }
  preferredNextIndex = null;
  list.innerHTML = rows.length ? rows.map(renderTaskItem).join('') : '<div class="empty-state"><strong>当前没有匹配事项</strong><span>可切换页签或清空搜索</span></div>';
  list.scrollTop = oldScroll;
  renderDetail();
}
function selectTask(type, id) {
  selectedTask = { type, id };
  document.querySelectorAll('[data-select]').forEach(button => {
    const current = button.dataset.select === type && button.dataset.id === id;
    button.classList.toggle('is-current', current);
    button.setAttribute('aria-current', String(current));
  });
  renderDetail();
}
function setTab(tab) {
  activeTab = tab;
  selectedTask = null;
  preferredNextIndex = null;
  $('#taskSearch').value = '';
  $('#taskList').scrollTop = 0;
  document.querySelectorAll('[data-tab]').forEach(button => {
    const selected = button.dataset.tab === tab;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-selected', String(selected));
  });
  document.querySelectorAll('[data-stat]').forEach(button => {
    const selected = button.dataset.stat === tab;
    button.classList.toggle('is-active', selected);
    button.setAttribute('aria-pressed', String(selected));
    button.querySelector('.metric-card-link').textContent = selected ? '当前视图' : button.dataset.actionLabel;
  });
  renderCounts();
  renderTasks();
}
function renderInventoryPanel() {
  const total = data.stock.reduce((sum, stock) => sum + stock.quantity, 0);
  const rows = data.stock.map((stock, index) => {
    const share = total ? Math.round(stock.quantity / total * 100) : 0;
    return `<div class="stock-item"><span class="stock-item-index">${String(index + 1).padStart(2, '0')}</span><div class="stock-item-name"><strong>${safe(stock.partName)}</strong><small>${safe(stock.partCode)}</small></div><span class="stock-item-quantity"><strong>${stock.quantity}</strong><small>件</small></span><span class="stock-item-share">${share}%</span></div>`;
  }).join('');
  const segments = data.stock.map((stock, index) => `<span class="stock-segment stock-tone-${index % 3}" style="width:${total ? stock.quantity / total * 100 : 0}%" title="${safe(stock.partName)}：${stock.quantity} 件"></span>`).join('');
  const legend = data.stock.map((stock, index) => `<span><i class="stock-tone-${index % 3}" aria-hidden="true"></i>${safe(stock.partName)}</span>`).join('');
  $('#inventoryContent').innerHTML = `<section class="inventory-card" aria-labelledby="inventoryTitle"><header class="stock-head"><span class="stock-head-kicker">INVENTORY / DATA</span><h2 id="inventoryTitle">服务站库存</h2><p>所选服务站 · 重点配件当前余额</p></header><div class="stock-overview"><div><span>展示配件现存合计</span><strong>${total}<small>件</small></strong></div><div><span>当前展示</span><strong>${data.stock.length}<small>种</small></strong></div></div><div class="stock-body"><div class="stock-body-head"><h3>配件明细</h3><span>现存量 / 占比</span></div><div class="stock-items">${rows}</div><div class="stock-composition"><div class="stock-composition-head"><strong>库存构成</strong><span>按展示配件数量计算</span></div><div class="stock-composition-bar" role="img" aria-label="${safe(data.stock.map(stock => stock.partName + ' ' + stock.quantity + ' 件').join('，'))}">${segments}</div><div class="stock-composition-legend">${legend}</div></div><p class="stock-body-note">仅统计当前展示配件；完整余额以库存台账为准</p></div></section>`;
}
const scheduleSlots = Array.from({ length: 6 }, (_, index) => {
  const start = 8 + index * 2;
  return { start, end: start + 2, label: `${String(start).padStart(2, '0')}:00–${String(start + 2).padStart(2, '0')}:00` };
});
function scheduleSlotIndex(order) {
  const time = order.expectedTimeWindow?.slice(0, 5) || '';
  if (!/^\d{2}:\d{2}$/.test(time)) return -1;
  const hour = Number(time.slice(0, 2));
  return scheduleSlots.findIndex(slot => hour >= slot.start && hour < slot.end);
}
function renderSchedule() {
  const people = data.people.filter(person => peopleFilter === 'all' || (peopleFilter === 'working' ? person.availability === 'AVAILABLE' : person.availability !== 'AVAILABLE'));
  $('#scheduleGrid').innerHTML = `<div class="schedule-grid-head"><span>服务人员 · ${people.length} 人</span>${scheduleSlots.map(slot => `<span>${slot.label}</span>`).join('')}</div>${people.map(person => {
    const orders = data.orders.filter(order => order.personnelId === person.id && order.expectedDate === today).sort((a, b) => a.expectedTimeWindow.localeCompare(b.expectedTimeWindow));
    const available = person.availability === 'AVAILABLE';
    const personCell = `<button class="schedule-person ${available ? '' : 'is-away'}" type="button" data-open="person" data-id="${person.id}"><span class="schedule-person-top"><span class="schedule-person-avatar">${safe(person.name.slice(0, 1))}</span><strong>${safe(person.name)}</strong><small>${safe(person.code)}</small><em>${availabilityText(person.availability)}</em></span><span class="schedule-person-meta">${safe(person.skillTypes.map(typeLabel).join(' / '))} · ${safe(person.mobile)} · 排班${person.scheduleStatus === 'PUBLISHED' ? '已发布' : safe(person.scheduleStatus)}</span><span class="schedule-person-capacity">人员日容量 ${person.dailyCapacity} · 当日期望关联 ${orders.length} 单</span></button>`;
    if (!available && !orders.length) return `<div class="schedule-row is-away">${personCell}<div class="schedule-away">当日${availabilityText(person.availability)} · 无关联期望工单</div></div>`;
    const cells = scheduleSlots.map((slot, index) => {
      const slotOrders = orders.filter(order => scheduleSlotIndex(order) === index);
      return `<div class="schedule-cell ${slotOrders.length ? 'has-orders' : 'is-empty'}" aria-label="${safe(person.name)} ${slot.label} ${slotOrders.length ? slotOrders.length + ' 单期望工单' : '无关联工单'}">${slotOrders.map(order => `<button type="button" class="slot-order ${typeLabel(order.orderType) === '维修' ? 'repair' : typeLabel(order.orderType) === '清洗' ? 'clean' : ''}" data-open="scheduled" data-id="${order.id}"><strong>${safe(order.expectedTimeWindow || '待确认')}　${safe(typeLabel(order.orderType))}</strong><small>${safe(order.orderNo)} · ${safe(order.exceptionCode === 'MISSING_PARTS' ? '缺件' : statusText(order))}</small></button>`).join('') || '<span class="schedule-none">无关联</span>'}</div>`;
    }).join('');
    const unplaced = orders.filter(order => scheduleSlotIndex(order) === -1);
    const unscheduled = unplaced.length ? `<div class="schedule-unspecified">时段外或时间待确认：${unplaced.map(order => `<button type="button" data-open="scheduled" data-id="${order.id}">${safe(order.orderNo)} · ${safe(order.expectedTimeWindow || '待确认')}</button>`).join('')}</div>` : '';
    return `<div class="schedule-row ${available ? '' : 'is-away'} ${unplaced.length ? 'has-unspecified' : ''}">${personCell}${cells}${unscheduled}</div>`;
  }).join('')}`;
}
function setPeopleFilter(filter) {
  peopleFilter = filter;
  document.querySelectorAll('[data-people-filter]').forEach(button => {
    const selected = button.dataset.peopleFilter === filter;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  renderSchedule();
}
function renderAll() { renderCounts(); renderTasks(); renderInventoryPanel(); renderSchedule(); }
function showToast(message) {
  const element = $('#toast');
  element.textContent = message;
  element.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => element.classList.remove('show'), 3200);
}
const detailField = (label, value) => `<div class="detail-field"><span>${safe(label)}</span><strong>${safe(value)}</strong></div>`;
function assignmentDetail(order) {
  const candidates = (data.candidates[order.id] || []).map(candidate => ({ ...candidate, person: personFor(candidate.id) })).filter(candidate => candidate.person);
  const recommended = candidates.find(candidate => candidate.recommended && candidate.available && candidate.skilled)?.id;
  return `<div class="work-detail-layout"><div class="work-detail-main"><div class="detail-summary"><strong>${safe(productText(order))}</strong><p>${safe(order.contactNameMasked)} · ${safe(areaText(order))} · 期望服务 ${safe(visitText(order))}</p></div><div class="work-facts">${detailField('工单状态', statusText(order))}${detailField('人员分配状态', order.personnelAssignmentStatus)}${detailField('创建时间', timeText(order.createTime))}</div><section class="work-section"><div class="work-section-head"><h3>选择服务人员</h3><span>候选与推荐以接口返回为准</span></div>${order.personnelAssignmentFailureReason ? `<p class="drawer-help">${safe(order.personnelAssignmentFailureReason)}</p>` : ''}${candidates.map(candidate => {
    const person = candidate.person;
    const disabled = !candidate.available || !candidate.skilled;
    return `<label class="candidate-choice ${candidate.overCapacity ? 'full' : ''}"><input type="radio" name="candidate" value="${person.id}" ${person.id === recommended ? 'checked' : ''} ${disabled ? 'disabled' : ''}><span><strong>${safe(person.name)} · ${safe(person.code)}</strong><small>${safe(person.skillTypes.map(typeLabel).join(' / '))} · 已分配 ${candidate.assignedCount}/日容量 ${candidate.dailyCapacity}</small></span><em>${!candidate.available ? '排班不可用' : !candidate.skilled ? '技能不符' : candidate.overCapacity ? '超容量' : candidate.recommended ? '接口推荐' : '可选择'}</em></label>`;
  }).join('') || '<p class="drawer-help">当前没有可选候选人，请核对人员、排班和技能。</p>'}<label class="drawer-field" id="overrideField" hidden>超容量覆盖原因<textarea id="overrideReason" placeholder="填写超容量分配原因"></textarea></label><p class="work-error" id="workError"></p></section></div><aside class="work-context"><section class="context-card context-card-blue"><div class="context-card-head"><h3>候选人信息</h3><span>随选择更新</span></div><div id="candidateInsight"></div></section></aside></div>`;
}
function partDetail(part) {
  const lines = part.lines.map(line => {
    const stock = data.stock.find(row => row.partId === line.partId);
    const change = part.documentType === 'REQUISITION' ? -line.quantity : line.quantity;
    return `<div class="part-balance-values"><span>${safe(line.partName)} · 服务站<br><strong>${stock?.quantity ?? '—'} → ${stock ? stock.quantity + change : '—'} 件</strong></span><span>${safe(part.personnelName)} · 人员库存<br><strong>${line.personnelQuantity} → ${line.personnelQuantity - change} 件</strong></span></div>`;
  }).join('');
  return `<div class="work-detail-layout part-work"><div class="work-detail-main"><div class="detail-summary"><strong>${kindFor(part)} · ${safe(part.documentNo)}</strong><p>${safe(part.personnelName)} 申请 · ${safe(part.reason)}</p></div><div class="work-facts">${detailField('单据状态', '处理中')}${detailField('关联工单', relatedOrderText(part))}${detailField('配件种类 / 数量', part.lines.length + ' 种 / ' + part.lines.reduce((sum, line) => sum + line.quantity, 0) + ' 件')}</div><section class="part-balance-preview"><div class="work-section-head"><h3>通过后的双方余额</h3><span>当前尚未变更</span></div>${lines}</section><section class="work-section"><div class="work-section-head"><h3>审批申请</h3><span>按单据版本办理</span></div><p class="drawer-help">通过时服务端重新校验来源库存并同时变更双方余额；拒绝需填写原因且库存不变。</p><label class="drawer-field" id="rejectField" hidden>拒绝原因<textarea id="rejectReason" placeholder="必填：拒绝原因"></textarea></label><p class="work-error" id="workError"></p></section></div></div>`;
}
function renderDetail() {
  const type = selectedTask?.type;
  const item = type === 'parts' ? data.parts.find(row => row.id === selectedTask.id) : data.orders.find(row => row.id === selectedTask?.id);
  if (!item) {
    $('#workDetailHeader').innerHTML = '<div><span class="section-kicker">DETAIL / ACTION</span><h2>选择待办事项</h2><p>左侧选择一项，查看字段及当前可办理内容。</p></div>';
    $('#workDetailBody').innerHTML = '<div class="work-empty"><strong>当前列表没有待办</strong><span>可切换页签或调整搜索条件。</span></div>';
    $('#workDetailFooter').innerHTML = '<span>操作以当前单据权限和状态为准</span><a href="#schedule">查看今日排班 →</a>';
    return;
  }
  const title = type === 'assignment' ? '分配服务人员' : '领退料审批';
  const number = type === 'parts' ? item.documentNo : item.orderNo;
  $('#workDetailHeader').innerHTML = `<div><span class="section-kicker">DETAIL / ${taskLabels[type]}</span><h2>${title} <small>${safe(number)}</small></h2><p>创建 ${safe(timeText(item.createTime))} · ${type === 'parts' ? safe(item.personnelName) : safe(item.contactNameMasked)}</p></div><span class="work-detail-state ${type}">${type === 'parts' ? '处理中' : taskLabels[type]}</span>`;
  $('#workDetailBody').innerHTML = type === 'assignment' ? assignmentDetail(item) : partDetail(item);
  let actions = '';
  if (type === 'assignment' && item.actions.includes('dispatch')) actions = '<button type="button" class="drawer-submit" id="confirmAssignment" data-work-action="assign">确认分配</button>';
  if (type === 'parts') {
    if (item.actions.includes('reject')) actions += '<button type="button" class="drawer-danger" id="rejectPart" data-work-action="reject">拒绝</button>';
    if (item.actions.includes('approve')) actions += '<button type="button" class="drawer-submit" data-work-action="approve">通过申请</button>';
  }
  $('#workDetailFooter').innerHTML = `<span>按当前单据状态与授权动作办理</span><div><button type="button" class="drawer-cancel" data-work-action="next">下一项</button>${actions}</div>`;
  $('#workDetailBody').scrollTop = 0;
  if (type === 'assignment') updateCandidateInsight();
}
function updateCandidateInsight() {
  const selected = document.querySelector('input[name="candidate"]:checked');
  const person = personFor(selected?.value);
  const candidate = data.candidates[selectedTask?.id]?.find(row => row.id === person?.id);
  $('#confirmAssignment').disabled = !person || !candidate?.available || !candidate?.skilled;
  $('#overrideField').hidden = !candidate?.overCapacity;
  $('#workError').textContent = '';
  if (!person) { $('#candidateInsight').innerHTML = '<p>请选择一位候选人。</p>'; return; }
  const orders = data.orders.filter(order => order.personnelId === person.id && order.expectedDate === today).sort((a, b) => a.expectedTimeWindow.localeCompare(b.expectedTimeWindow));
  $('#candidateInsight').innerHTML = `<div class="context-person"><strong>${safe(person.name)}</strong><span>接口已分配 ${candidate.assignedCount} / 日容量 ${candidate.dailyCapacity}</span></div>${orders.map(order => `<div class="context-stock"><span>${safe(order.expectedTimeWindow)} ${safe(typeLabel(order.orderType))}</span><strong>${safe(order.streetName)}</strong></div>`).join('') || '<p>当前查询无当日期望工单。</p>'}<a href="#schedule">查看当日关联工单 →</a>`;
}
function prepareNextSelection() {
  preferredNextIndex = getVisibleTasks().findIndex(({ type, item }) => selectedTask?.type === type && selectedTask?.id === item.id);
  selectedTask = null;
}
function handleWorkAction(action) {
  const type = selectedTask?.type;
  const id = selectedTask?.id;
  const item = type === 'parts' ? data.parts.find(row => row.id === id) : data.orders.find(row => row.id === id);
  if (action === 'next') {
    const rows = getVisibleTasks();
    const index = rows.findIndex(row => row.type === type && row.item.id === id);
    const next = rows[(index + 1) % rows.length];
    if (next) selectTask(next.type, next.item.id);
    return;
  }
  if (!item) return;
  if (action === 'assign') {
    const candidate = data.candidates[id]?.find(row => row.id === document.querySelector('input[name="candidate"]:checked')?.value);
    const person = personFor(candidate?.id);
    if (!person || !candidate?.available || !candidate?.skilled) { $('#workError').textContent = '请选择可分配的候选人。'; return; }
    if (candidate.overCapacity && !$('#overrideReason').value.trim()) { $('#workError').textContent = '超容量分配需填写覆盖原因。'; $('#overrideReason').focus(); return; }
    if (!item.actions.includes('dispatch') || item.status !== 'PENDING_ASSIGNMENT' || item.personnelId) { $('#workError').textContent = '工单状态已变化，请刷新后重试。'; return; }
    prepareNextSelection();
    item.personnelId = person.id;
    item.status = 'PENDING_COMPLETION';
    item.actions = ['submitCompletion'];
    item.personnelAssignmentStatus = 'SUCCESS';
    Object.values(data.candidates).flat().filter(row => row.id === person.id).forEach(row => { row.assignedCount += 1; row.overCapacity = row.assignedCount >= row.dailyCapacity; });
    renderAll(); showToast(item.orderNo + ' 已在演示中分配给 ' + person.name + '。');
    return;
  }
  if (action === 'approve') {
    if (item.status !== 'PROCESSING' || !item.actions.includes('approve')) { $('#workError').textContent = '单据状态已变化。'; return; }
    const insufficient = item.lines.some(line => {
      const stock = data.stock.find(row => row.partId === line.partId);
      return !stock || (item.documentType === 'REQUISITION' ? stock.quantity < line.quantity : line.personnelQuantity < line.quantity);
    });
    if (insufficient) { $('#workError').textContent = '来源库存不足，不能通过。'; return; }
    prepareNextSelection();
    item.lines.forEach(line => {
      const stock = data.stock.find(row => row.partId === line.partId);
      const change = item.documentType === 'REQUISITION' ? -line.quantity : line.quantity;
      stock.quantity += change;
      data.parts.forEach(other => other.lines.forEach(otherLine => {
        if (otherLine.partId === line.partId && other.personnelId === item.personnelId) otherLine.personnelQuantity -= change;
      }));
    });
    item.status = 'COMPLETED';
    item.actions = [];
    renderAll(); showToast(item.documentNo + ' 已通过，双方库存已更新。');
    return;
  }
  if (action === 'reject') {
    if ($('#rejectField').hidden) { $('#rejectField').hidden = false; $('#rejectPart').textContent = '确认拒绝'; $('#rejectReason').focus(); return; }
    if (!$('#rejectReason').value.trim()) { $('#workError').textContent = '请填写拒绝原因。'; return; }
    if (item.status !== 'PROCESSING' || !item.actions.includes('reject')) { $('#workError').textContent = '单据状态已变化。'; return; }
    prepareNextSelection();
    item.status = 'REJECTED';
    item.actions = [];
    renderAll(); showToast(item.documentNo + ' 已拒绝，库存未变化。');
  }
}
function openDrawer(kicker, title, content) {
  lastFocus = document.activeElement;
  $('#drawerKicker').textContent = kicker;
  $('#drawerTitle').textContent = title;
  $('#drawerContent').innerHTML = content;
  $('#drawerFooter').innerHTML = '<button class="drawer-cancel" type="button" data-drawer-close>关闭</button>';
  $('#drawerBackdrop').hidden = false;
  $('#detailDrawer').hidden = false;
  $('#drawerClose').focus();
}
function closeDrawer() {
  $('#drawerBackdrop').hidden = true;
  $('#detailDrawer').hidden = true;
  if (lastFocus?.isConnected) lastFocus.focus();
}
function openPerson(id) {
  const person = personFor(id);
  if (!person) return;
  const orders = data.orders.filter(order => order.personnelId === id && order.expectedDate === today).sort((a, b) => a.expectedTimeWindow.localeCompare(b.expectedTimeWindow));
  openDrawer('SERVICE PERSONNEL', person.name + ' · ' + person.code, `<div class="drawer-section"><div class="detail-summary"><strong>当日${availabilityText(person.availability)} · 排班${person.scheduleStatus === 'PUBLISHED' ? '已发布' : safe(person.scheduleStatus)}</strong><p>人员日容量 ${person.dailyCapacity}；当日期望关联 ${orders.length} 单。两者不推算实时可接单数。</p></div></div><div class="drawer-section"><h3>人员资料</h3><div class="detail-grid">${detailField('工号', person.code)}${detailField('手机', person.mobile)}${detailField('服务站', station.name)}${detailField('技能', person.skillTypes.map(typeLabel).join('、'))}</div></div><div class="drawer-section"><h3>当日期望工单</h3>${orders.map(order => `<p class="drawer-help">${safe(order.expectedTimeWindow)}　${safe(typeLabel(order.orderType))} · ${safe(order.orderNo)} · ${safe(statusText(order))}</p>`).join('') || '<p class="drawer-help">当前查询无关联工单。</p>'}</div>`);
}
function openScheduled(id) {
  const order = data.orders.find(item => item.id === id);
  if (!order) return;
  openDrawer('EXPECTED WORK ORDER', order.orderNo, `<div class="drawer-section"><div class="detail-summary"><strong>${safe(typeLabel(order.orderType))} · ${safe(areaText(order))}</strong><p>期望服务 ${safe(visitText(order))} · 执行人 ${safe(personFor(order.personnelId)?.name || '未分配')}</p></div></div><div class="drawer-section"><h3>工单信息</h3><div class="detail-grid">${detailField('工单号', order.orderNo)}${detailField('工单状态', statusText(order))}${detailField('期望服务时间', visitText(order))}${detailField('异常', order.exceptionCode || '—')}</div></div><p class="drawer-help">这里按工单期望服务时间展示，不表示持续时长、到达记录或实时路线。</p>`);
}
document.addEventListener('click', event => {
  const choice = event.target.closest('[data-select]'); if (choice) { selectTask(choice.dataset.select, choice.dataset.id); return; }
  const workAction = event.target.closest('[data-work-action]'); if (workAction) { handleWorkAction(workAction.dataset.workAction); return; }
  const open = event.target.closest('[data-open]'); if (open) { ({ person: openPerson, scheduled: openScheduled })[open.dataset.open]?.(open.dataset.id); return; }
  if (event.target.closest('[data-drawer-close]')) { closeDrawer(); return; }
  const tab = event.target.closest('[data-tab]'); if (tab) { setTab(tab.dataset.tab); return; }
  const filter = event.target.closest('[data-people-filter]'); if (filter) { setPeopleFilter(filter.dataset.peopleFilter); return; }
  const stat = event.target.closest('[data-stat]'); if (stat) { setTab(stat.dataset.stat); $('#tasks').scrollIntoView({ behavior: 'smooth' }); return; }
  const nav = event.target.closest('[data-nav]'); if (nav && nav.dataset.nav !== 'top' && nav.dataset.nav !== 'schedule') setTab(nav.dataset.nav);
});
document.addEventListener('change', event => {
  if (event.target.matches('input[name="candidate"]')) updateCandidateInsight();
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !$('#detailDrawer').hidden) closeDrawer();
  if (event.key !== 'Tab' || $('#detailDrawer').hidden) return;
  const focusable = [...$('#detailDrawer').querySelectorAll('button:not([disabled]),a[href],input:not([disabled]),textarea:not([disabled])')];
  if (event.shiftKey && document.activeElement === focusable[0]) { event.preventDefault(); focusable.at(-1).focus(); }
  else if (!event.shiftKey && document.activeElement === focusable.at(-1)) { event.preventDefault(); focusable[0].focus(); }
});
$('#drawerClose').addEventListener('click', closeDrawer);
$('#drawerBackdrop').addEventListener('click', closeDrawer);
$('#taskSearch').addEventListener('input', () => { $('#taskList').scrollTop = 0; renderTasks(); });
$('#clearSearch').addEventListener('click', () => { $('#taskSearch').value = ''; $('#taskList').scrollTop = 0; renderTasks(); $('#taskSearch').focus(); });
$('#resetDemo').addEventListener('click', () => { data = structuredClone(seed); selectedTask = null; preferredNextIndex = null; setTab('all'); setPeopleFilter('all'); renderAll(); showToast('演示数据已重置。'); });
$('#todayLabel').textContent = '2026年9月20日 · 演示日期';
renderAll();
