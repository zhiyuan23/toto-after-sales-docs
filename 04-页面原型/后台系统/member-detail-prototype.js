'use strict';
// Visual review only. Every member, purchase and warranty below is fictional.
(() => {
  const dialog = document.querySelector('#member-detail');
  const body = document.querySelector('#detail-body');
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const catalog = [
    { name: '智能一体型座便器', model: '演示型号 NEO-01', category: '智能卫浴', image: '../小程序/assets/product-toilet.jpg', serial: 'DEMO-202506180001', source: '已确认购买', state: 'active', warranty: '保修期内', purchased: '2025-06-18', channel: '演示上海体验店', start: '2025-06-18', end: '2028-06-17', spec: '白色 · 地排 · 坑距 305mm', registered: '2025-06-20', verified: '购买资料已核验' },
    { name: '台上洗面器', model: '演示型号 BASIN-02', category: '洗面器', image: '../小程序/assets/product-basin.jpg', serial: 'DEMO-202109100002', source: '已确认购买', state: 'expired', warranty: '已过保', purchased: '2021-09-10', channel: '演示上海体验店', start: '2021-09-10', end: '2024-09-09', spec: '白色 · 台上式', registered: '2021-09-12', verified: '购买资料已核验' },
    { name: '独立式浴缸', model: '演示型号 BATH-03', category: '浴缸', image: '../小程序/assets/product-bathtub-scene.jpg', serial: 'DEMO-202609200003', source: '购买登记待核验', state: 'pending', warranty: '待核定', purchased: '2026-09-20（登记）', channel: '演示线上旗舰店', start: '待核定', end: '待核定', spec: '白色 · 独立式', registered: '2026-09-22', verified: '购买资料待核验' },
    { name: '智能座便盖', model: '演示型号 WASH-04', category: '智能卫浴', image: '', serial: 'DEMO-SCAN-0004', source: '仅扫码关联', state: 'unknown', warranty: '未核定', purchased: '未提供', channel: '未提供', start: '未核定', end: '未核定', spec: '白色 · 规格未确认', registered: '2026-09-29', verified: '扫码关联未确认购买' },
  ];
  const services = [
    { number: 'DEMO-AS-003', type: '维修', product: '智能一体型座便器', date: '2026-09-28 14:00', state: '已完成', note: '演示记录：完成产品检查与使用指导', station: '演示上海服务站' },
    { number: 'DEMO-AS-002', type: '安装', product: '智能一体型座便器', date: '2025-06-22 10:00', state: '已完成', note: '演示记录：产品安装与调试完成', station: '演示上海服务站' },
    { number: 'DEMO-AS-001', type: '指导', product: '台上洗面器', date: '2021-09-15 09:30', state: '已关闭', note: '演示记录：电话使用指导', station: '演示上海服务站' },
  ];
  let activeTab = 'products';
  let purchaseFilter = 'all';
  let warrantyFilter = 'all';
  const field = (label, value) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;
  const productIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><path d="m12 3 9 5v8l-9 5-9-5V8l9-5Z"/><path d="m3 8 9 5 9-5M12 13v8M7.5 5.5l9 5"/></svg>';
  function productCard(product) {
    return `<article class="member-product-card">
      <div class="member-product-heading">
        <div class="member-product-image">${product.image ? `<img src="${product.image}" alt="${escape(product.name)}示例图片">` : `${productIcon}<span>暂无商品图片</span>`}</div>
        <div class="member-product-identity"><span class="member-product-category">${escape(product.category)}</span><h3>${escape(product.name)}</h3><p>${escape(product.model)}</p><span class="member-source member-source--${product.state}">${escape(product.source)}</span></div>
      </div>
      <dl class="member-product-facts">${field('购买日期', product.purchased)}${field('购买渠道', product.channel)}${field('保修起始', product.start)}${field('保修截止', product.end)}</dl>
      <div class="member-product-bottom"><span class="member-warranty member-warranty--${product.state}"><i aria-hidden="true"></i>${escape(product.warranty)}</span><details><summary>更多商品信息</summary><dl>${field('唯一码', product.serial)}${field('规格', product.spec)}${field('关联日期', product.registered)}${field('购买核验', product.verified)}</dl></details></div>
    </article>`;
  }
  function renderProducts() {
    const list = catalog.filter(product => (purchaseFilter === 'all' || (purchaseFilter === 'purchased' ? product.source === '已确认购买' : product.source !== '已确认购买')) && (warrantyFilter === 'all' || product.state === warrantyFilter));
    document.querySelector('#member-products-list').innerHTML = list.length ? list.map(productCard).join('') : '<div class="member-product-empty"><strong>没有符合条件的商品</strong><p>可以重置筛选查看全部关联商品。</p><button type="button" data-reset-products>重置筛选</button></div>';
    document.querySelector('#member-product-result').textContent = `当前显示 ${list.length} 件`;
    body.querySelectorAll('[data-purchase-filter]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.purchaseFilter === purchaseFilter)));
  }
  function open(member) {
    activeTab = 'products'; purchaseFilter = 'all'; warrantyFilter = 'all';
    document.querySelector('#detail-title').textContent = '会员档案';
    const empty = member.province === '未填写' && member.age === '未填写';
    const interest = member.interests.map(id => member.productLabels[id]).join('、') || (member.interestsAnswered ? '暂无明确偏好' : '未填写');
    const scene = member.usageScenes.map(id => member.sceneLabels[id]).join('、') || '未填写';
    body.innerHTML = `<aside class="member-profile" aria-label="会员基础资料">
      <div class="member-profile-hero"><img class="member-profile-avatar" src="../小程序/assets/icons/default-avatar.svg" alt="会员头像示例"><div><h2>${escape(member.name)}</h2><p>${empty ? '性别未填写 · 年龄未填写' : `女 · ${escape(member.age)}`}</p></div></div>
      <div class="member-profile-phone">${empty ? '尚未绑定手机号' : '138****8001 <span title="演示：手机号已通过微信验证">✓ 微信已验证</span>'}</div>
      <section class="member-profile-section"><h3>基本信息</h3><dl>${field('所在地区', empty ? '未填写' : ({ '辽宁省': '辽宁省 / 沈阳市 / 和平区', '浙江省': '浙江省 / 杭州市 / 西湖区', '广东省': '广东省 / 广州市 / 天河区' }[member.province] || '未填写'))}${field('出生年份', empty ? '未填写' : ({ '40～49岁': '1986', '30～39岁': '1990', '18～29岁': '2000', '50～59岁': '1971', '60岁以上': '1960' }[member.age] || '未填写'))}${field('注册时间', '2025-06-16 10:30')}${field('最近活跃', '2026-10-02 09:20')}</dl></section>
      <section class="member-profile-section"><h3>关联概况</h3><div class="member-profile-counts"><div><strong>4</strong><span>关联商品</span></div><div><strong>2</strong><span>确认购买</span></div><div><strong>3</strong><span>服务记录</span></div></div></section>
      <details class="member-profile-preferences"><summary>兴趣偏好</summary><dl>${field('关注产品', interest)}${field('购买计划', member.planLabel)}${field('使用场景', scene)}${field('填写时间', member.updatedAt)}</dl><p>消费者主动填写，与已购买商品分别展示。</p></details>
    </aside>
    <section class="member-assets" aria-label="商品与服务记录">
      <nav class="member-detail-tabs" role="tablist" aria-label="会员关联信息"><button id="member-products-tab" role="tab" aria-selected="true" aria-controls="member-products-panel" data-detail-tab="products" tabindex="0">关联商品 <span>4</span></button><button id="member-services-tab" role="tab" aria-selected="false" aria-controls="member-services-panel" data-detail-tab="services" tabindex="-1">服务记录 <span>3</span></button></nav>
      <section id="member-products-panel" class="member-assets-panel" role="tabpanel" aria-labelledby="member-products-tab">
        <div class="member-assets-toolbar"><div class="member-purchase-filters" aria-label="购买确认状态"><button type="button" data-purchase-filter="all" aria-pressed="true">全部关联</button><button type="button" data-purchase-filter="purchased" aria-pressed="false">已确认购买</button><button type="button" data-purchase-filter="unconfirmed" aria-pressed="false">未确认购买</button></div><label class="member-warranty-filter"><span class="visually-hidden">保修状态</span><select id="member-warranty-select" aria-label="保修状态"><option value="all">全部保修状态</option><option value="active">保修期内</option><option value="expired">已过保</option><option value="pending">待核定</option><option value="unknown">未核定</option></select></label></div>
        <div class="member-assets-intro"><p>购买与保修信息按每件商品查看</p><span id="member-product-result"></span></div>
        <div id="member-products-list" class="member-products-grid"></div>
        <p class="member-warranty-note">保修日期与状态为原型示例；正式信息以购买资料核验结果为准。</p>
      </section>
      <section id="member-services-panel" class="member-assets-panel" role="tabpanel" aria-labelledby="member-services-tab" hidden><div class="member-service-heading"><h3>服务记录</h3><span>共 3 条</span></div><div class="member-services-list">${services.map(service => `<article><div class="member-service-marker" aria-hidden="true">${service.type}</div><div class="member-service-content"><div><h3>${service.product}</h3><span>${service.state}</span></div><p>${service.note}</p><footer><span>${service.number}</span><span>${service.station}</span><time>${service.date}</time></footer></div></article>`).join('')}</div></section>
    </section>`;
    renderProducts();
    if (!dialog.open) dialog.showModal();
  }
  window.memberDetailPrototype = { open };
  function switchTab(tab, focus = false) {
    activeTab = tab;
    body.querySelectorAll('[data-detail-tab]').forEach(button => {
      const selected = button.dataset.detailTab === activeTab;
      button.setAttribute('aria-selected', String(selected));
      button.tabIndex = selected ? 0 : -1;
      if (selected && focus) button.focus();
    });
    document.querySelector('#member-products-panel').hidden = tab !== 'products';
    document.querySelector('#member-services-panel').hidden = tab !== 'services';
  }
  body.addEventListener('click', event => {
    const tab = event.target.closest('[data-detail-tab]');
    if (tab) switchTab(tab.dataset.detailTab);
    const filter = event.target.closest('[data-purchase-filter]');
    if (filter) { purchaseFilter = filter.dataset.purchaseFilter; renderProducts(); }
    if (event.target.closest('[data-reset-products]')) { purchaseFilter = 'all'; warrantyFilter = 'all'; document.querySelector('#member-warranty-select').value = 'all'; renderProducts(); }
  });
  body.addEventListener('change', event => { if (event.target.id === 'member-warranty-select') { warrantyFilter = event.target.value; renderProducts(); } });
  body.addEventListener('keydown', event => {
    if (event.target.matches('[data-detail-tab]') && ['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      switchTab(event.key === 'Home' ? 'products' : event.key === 'End' ? 'services' : activeTab === 'products' ? 'services' : 'products', true);
    }
  });
  document.querySelector('#detail-fullscreen').addEventListener('click', event => {
    const full = dialog.classList.toggle('is-fullscreen');
    event.currentTarget.textContent = full ? '退出全屏' : '全屏查看';
    event.currentTarget.setAttribute('aria-pressed', String(full));
  });
  dialog.addEventListener('close', () => {
    dialog.classList.remove('is-fullscreen');
    const button = document.querySelector('#detail-fullscreen');
    button.textContent = '全屏查看'; button.setAttribute('aria-pressed', 'false');
  });
})();
