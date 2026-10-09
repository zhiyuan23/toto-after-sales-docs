(() => {
if (window.TOTO_CONSUMER_VERSION !== '0.15') return;
/* Visual alternatives for the consumer v0.15 homepage. No separate state or navigation. */
window.TOTO_HOME_VARIANTS = {};

(() => {
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[character]);

function brand(ctx) {
  return `<header class="showcase-brand">
    <div class="showcase-brand__identity"><span class="showcase-wordmark">TOTO</span><span class="showcase-brand__caption">售后服务</span></div>
    <button class="showcase-add" type="button" data-action="add">${ctx.icon('plus')}<span>添加产品</span></button>
  </header>`;
}

function products(ctx) {
  return `<nav class="showcase-products" aria-label="选择产品">${ctx.products.map(product => `<button type="button" class="showcase-product-tab${product.id === ctx.product.id ? ' is-selected' : ''}" data-product="${escape(product.id)}" aria-pressed="${product.id === ctx.product.id}">${escape(product.name)}</button>`).join('')}</nav>`;
}

function help(ctx) {
  return `<section class="showcase-help" aria-label="帮助与支持">
    <h2>帮助与支持</h2>
    <div class="showcase-help__entries">
      <button type="button" data-action="assistant"><span class="showcase-help-icon"><img src="assets/help-icons/assistant-purple-v1.png" alt="" aria-hidden="true" draggable="false"></span><span>智能助手</span></button>
      <button type="button" data-action="outlets"><span class="showcase-help-icon"><img src="assets/help-icons/outlets-teal-v1.png" alt="" aria-hidden="true" draggable="false"></span><span>服务网点</span></button>
      <button type="button" data-action="support"><span class="showcase-help-icon"><img src="assets/help-icons/support-orange-v1.png" alt="" aria-hidden="true" draggable="false"></span><span>TOTO 客服</span></button>
    </div>
  </section>`;
}

function empty() {
  return `<section class="showcase-onboarding" aria-label="添加产品，开启专属服务">
    <span class="showcase-state-eyebrow">我的产品</span>
    <h1>为产品开启<br>专属服务</h1>
    <p class="showcase-state-copy">添加产品，查看资料或预约服务。<br>也可绑定手机号，同步已关联产品。</p>
    <figure class="showcase-onboarding__art">
      <img src="assets/product-toilet.jpg" alt="TOTO 智能坐便器产品示意" draggable="false">
      <figcaption>产品示意</figcaption>
    </figure>
    <button class="showcase-state-primary" type="button" data-action="add">添加我的产品</button>
    <button class="showcase-state-secondary" type="button" data-action="sync">同步已关联产品</button>
  </section>`;
}

function error(ctx) {
  return `<section class="showcase-status" aria-label="产品读取失败">
    <span class="showcase-status__icon" aria-hidden="true">${ctx.icon('service')}</span>
    <h1>暂时无法读取产品</h1>
    <p class="showcase-state-copy">请检查网络连接后重试。<br>需要帮助时，也可联系 TOTO 客服。</p>
    <button class="showcase-state-primary" type="button" data-action="retry">重新读取</button>
  </section>`;
}

function render(ctx) {
  const top = brand(ctx);
  if (ctx.state === 'empty' || ctx.state === 'error') {
    return `<div class="variant v-showcase v-showcase--${ctx.state}">${top}${ctx.state === 'empty' ? empty() : error(ctx)}${help(ctx)}</div>`;
  }
  const serviceIcon = { install: 'install', repair: 'repair', progress: 'calendar', evaluation: 'check' }[ctx.state] || 'service';
  return `<div class="variant v-showcase">
    ${top}
    ${products(ctx)}
    <section class="showcase-plate" aria-label="当前产品与服务">
      <button class="showcase-object" type="button" data-action="product" aria-label="查看${escape(ctx.product.name)}的产品资料">
        <div class="showcase-object__heading">
          <div class="showcase-object__eyebrow"><span>我的产品</span><span class="showcase-object__entry">产品资料${ctx.icon('entry-chevron')}</span></div>
          <h1>${escape(ctx.product.name)}</h1>
        </div>
        <div class="showcase-object__art"><img src="${escape(ctx.product.image)}" alt="${escape(ctx.product.name)}产品外观" draggable="false"></div>
      </button>
      <button class="showcase-service showcase-service--${escape(ctx.state)}" type="button" data-action="service" aria-label="${escape(ctx.service.title)}，${escape(ctx.service.label)}">
        <div class="showcase-service__main">
          <span class="showcase-service__symbol">${ctx.icon(serviceIcon)}</span>
          <span class="showcase-service__copy"><strong>${escape(ctx.service.title)}</strong><span>${escape(ctx.service.hint)}</span></span>
        </div>
        <span class="showcase-service__action">${escape(ctx.service.label)}${ctx.icon('entry-chevron')}</span>
      </button>
    </section>
    ${help(ctx)}
  </div>`;
}

window.TOTO_HOME_VARIANTS['showcase'] = render;
})();

(() => {
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[character]));

function render(ctx) {
  const product = ctx.product;
  const productIndex = Math.max(0, ctx.products.findIndex(item => item.id === product?.id));
  const scene = `<section class="living-scene" aria-label="卫浴生活灵感">
    <img class="living-scene-image" src="assets/product-bathtub-scene.jpg" alt="自然光下的石材与浴缸，卫浴空间灵感影像">
    <div class="living-brand-row">
      <span class="living-brand" aria-label="TOTO">TOTO</span>
      <button type="button" class="living-add" data-action="add">${ctx.icon('plus')}<span>添加产品</span></button>
    </div>
    <div class="living-scene-copy"><span class="living-eyebrow">卫浴生活</span><h1>让日常<br>回归舒适</h1></div>
    <span class="living-scene-caption">空间灵感</span>
  </section>`;

  if (ctx.state === 'empty' || ctx.state === 'error') {
    return `<div class="variant v-living is-${ctx.state}">${scene}<div class="living-content">${renderState(ctx)}${renderHelp()}</div></div>`;
  }

  return `<div class="variant v-living">
    ${scene}
    <div class="living-content">
      <section class="living-product-section" aria-label="当前产品">
        <div class="living-section-heading"><h2>我的产品</h2><button type="button" class="living-switch" data-action="switch"><span class="living-product-count">${String(productIndex + 1).padStart(2, '0')}<i>/</i>${String(ctx.products.length).padStart(2, '0')}</span><span>切换产品</span>${ctx.icon('entry-chevron')}</button></div>
        <div class="living-product">
          <button type="button" class="living-product-image-wrap" data-action="product" aria-label="查看${escapeHTML(product.name)}资料"><img class="living-product-image" src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" draggable="false"></button>
          <div class="living-product-copy"><span class="living-product-brand">TOTO</span><h3>${escapeHTML(product.name)}</h3><div class="living-product-dots" role="group" aria-label="选择产品">${ctx.products.map(item => `<button type="button" class="living-product-dot ${item.id === product.id ? 'is-selected' : ''}" data-product="${escapeHTML(item.id)}" aria-label="切换到${escapeHTML(item.name)}" aria-pressed="${item.id === product.id}"></button>`).join('')}</div></div>
        </div>
      </section>
        <button type="button" class="living-service" data-action="service">
          <span class="living-service-icon">${ctx.icon(ctx.service.icon)}</span>
          <span class="living-service-copy"><strong>${escapeHTML(ctx.service.title)}</strong><span>${escapeHTML(ctx.service.hint)}</span></span>
          <span class="living-service-action">${escapeHTML(ctx.service.label)}${ctx.icon('entry-chevron')}</span>
        </button>
      ${renderHelp()}
    </div>
  </div>`;
}

function renderHelp() {
  return `<nav class="living-help" aria-label="帮助与支持">
    <button type="button" data-action="assistant"><span class="living-help-icon"><img src="assets/help-icons/assistant-purple-v1.png" alt="" aria-hidden="true" draggable="false"></span><span>智能助手</span></button>
    <button type="button" data-action="outlets"><span class="living-help-icon"><img src="assets/help-icons/outlets-teal-v1.png" alt="" aria-hidden="true" draggable="false"></span><span>服务网点</span></button>
    <button type="button" data-action="support"><span class="living-help-icon"><img src="assets/help-icons/support-orange-v1.png" alt="" aria-hidden="true" draggable="false"></span><span>TOTO 客服</span></button>
  </nav>`;
}

function renderState(ctx) {
  if (ctx.state === 'empty') {
    return `<section class="living-state-card" aria-label="添加产品，开启专属服务"><span class="living-state-eyebrow">我的产品</span><h2>为产品开启<br>专属服务</h2><p>添加产品，查看资料或预约服务。<br>也可同步已关联的产品。</p><button type="button" class="living-state-primary" data-action="add">添加我的产品${ctx.icon('plus')}</button><button type="button" class="living-state-secondary" data-action="sync">同步已关联产品</button></section>`;
  }
  return `<section class="living-state-card living-state-error" aria-label="产品读取失败"><span class="living-state-eyebrow">我的产品</span><span class="living-state-symbol" aria-hidden="true">${ctx.icon('service')}</span><h2>暂时无法读取产品</h2><p>请检查网络连接后重试。<br>需要帮助时，也可联系 TOTO 客服。</p><button type="button" class="living-state-primary" data-action="retry">重新读取${ctx.icon('entry-chevron')}</button></section>`;
}

window.TOTO_HOME_VARIANTS['living'] = render;
})();

(() => {
const escape = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function scene(ctx) {
  return `<section class="ll-scene" aria-label="卫浴生活灵感">
    <img class="ll-scene-image" src="assets/product-bathtub-scene.jpg" alt="石材与自然光中的浴缸，卫浴空间灵感影像" draggable="false">
    <header class="ll-brand-row"><span class="ll-wordmark" aria-label="TOTO">TOTO</span><button type="button" class="ll-add" data-action="add">${ctx.icon('plus')}<span>添加产品</span></button></header>
    <div class="ll-scene-copy"><span class="ll-eyebrow">卫浴生活</span><h1>舒适生活<br>从每天开始</h1></div>
    <span class="ll-scene-caption">空间灵感</span>
  </section>`;
}

function productCard(ctx) {
  const product = ctx.product;
  const index = Math.max(0, ctx.products.findIndex(item => item.id === product.id));
  return `<section class="ll-card ll-product-card" aria-label="当前产品与服务">
    <div class="ll-card-heading"><h2>我的产品</h2><button type="button" class="ll-switch" data-action="switch"><span>${String(index + 1).padStart(2, '0')}<i>/</i>${String(ctx.products.length).padStart(2, '0')}</span>切换产品${ctx.icon('entry-chevron')}</button></div>
    <div class="ll-product">
      <div class="ll-product-copy"><span class="ll-product-brand">TOTO</span><h3>${escape(product.name)}</h3><div class="ll-product-selector" role="group" aria-label="选择产品">${ctx.products.map(item => `<button type="button" class="ll-product-dot${item.id === product.id ? ' is-selected' : ''}" data-product="${escape(item.id)}" aria-label="选择${escape(item.name)}" aria-pressed="${item.id === product.id}"></button>`).join('')}</div></div>
      <button type="button" class="ll-product-art" data-action="product" aria-label="查看${escape(product.name)}资料"><img src="${escape(product.image)}" alt="${escape(product.name)}" draggable="false"></button>
    </div>
    <button type="button" class="ll-service" data-action="service"><span class="ll-service-icon">${ctx.icon(ctx.service.icon)}</span><span class="ll-service-copy"><strong>${escape(ctx.service.title)}</strong><span>${escape(ctx.service.hint)}</span></span><span class="ll-service-cta">${escape(ctx.service.label)}</span></button>
  </section>`;
}

function stateCard(ctx) {
  if (ctx.state === 'empty') {
    return `<section class="ll-card ll-state-card" aria-label="添加产品，开启专属服务"><span class="ll-state-eyebrow">我的产品</span><h2>为产品开启<br>专属服务</h2><p>添加产品，查看资料或预约服务。<br>也可同步已关联的产品。</p><button type="button" class="ll-state-primary" data-action="add">添加我的产品${ctx.icon('plus')}</button><button type="button" class="ll-state-secondary" data-action="sync">同步已关联产品</button></section>`;
  }
  return `<section class="ll-card ll-state-card ll-state-error" aria-label="产品读取失败"><span class="ll-state-eyebrow">我的产品</span><span class="ll-error-symbol" aria-hidden="true">${ctx.icon('service')}</span><h2>暂时无法读取产品</h2><p>请检查网络连接后重试。<br>需要帮助时，也可联系 TOTO 客服。</p><button type="button" class="ll-state-primary" data-action="retry">重新读取${ctx.icon('entry-chevron')}</button></section>`;
}

function help() {
  const entries = [
    ['assistant', '智能助手', 'assistant-purple-v1'],
    ['outlets', '服务网点', 'outlets-teal-v1'],
    ['support', 'TOTO 客服', 'support-orange-v1'],
  ];
  return `<nav class="ll-help" aria-label="帮助与支持">${entries.map(([action, title, asset]) => `<button type="button" data-action="${action}"><span class="ll-help-icon"><img src="assets/help-icons/${asset}.png" alt="" aria-hidden="true" draggable="false"></span><span>${title}</span></button>`).join('')}</nav>`;
}

function render(ctx) {
  const unavailable = ctx.state === 'empty' || ctx.state === 'error';
  return `<div class="variant v-living-layered${unavailable ? ` v-living-layered--${ctx.state}` : ''}">${scene(ctx)}<div class="ll-content">${unavailable ? stateCard(ctx) : productCard(ctx)}${help()}</div></div>`;
}

window.TOTO_HOME_VARIANTS['living-layered'] = render;
})();

(() => {
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[character]));

function brand(ctx) {
  return `<header class="le-brand">
    <div class="le-brand-identity"><span class="le-wordmark">TOTO</span><span class="le-brand-caption">售后服务</span></div>
    <button class="le-add" type="button" data-action="add">${ctx.icon('plus')}<span>添加产品</span></button>
  </header>`;
}

function scene() {
  return `<figure class="le-scene" aria-label="卫浴空间灵感">
    <div class="le-scene-photo"><img src="assets/product-bathtub-scene.jpg" alt="自然光下的浴缸与石材，卫浴空间灵感影像" draggable="false"></div>
    <figcaption><h1>把日常，过得更舒适。</h1><span>卫浴生活</span></figcaption>
  </figure>`;
}

function productAndService(ctx) {
  const product = ctx.product;
  const index = Math.max(0, ctx.products.findIndex(item => item.id === product.id));
  return `<section class="le-product-service" aria-label="当前产品与服务">
    <div class="le-section-heading"><h2>我的产品</h2><button class="le-switch" type="button" data-action="switch"><span class="le-product-count">${String(index + 1).padStart(2, '0')}<i>/</i>${String(ctx.products.length).padStart(2, '0')}</span><span>切换产品</span>${ctx.icon('entry-chevron')}</button></div>
    <div class="le-product-row">
      <button class="le-product-photo" type="button" data-action="product" aria-label="查看${escapeHTML(product.name)}产品资料"><img src="${escapeHTML(product.image)}" alt="${escapeHTML(product.name)}" draggable="false"></button>
      <div class="le-product-copy">
        <h3>${escapeHTML(product.name)}</h3>
        <div class="le-product-tools"><button class="le-product-details" type="button" data-action="product">产品资料${ctx.icon('entry-chevron')}</button><div class="le-product-options" role="group" aria-label="选择产品">${ctx.products.map(item => `<button class="le-product-option${item.id === product.id ? ' is-selected' : ''}" type="button" data-product="${escapeHTML(item.id)}" aria-label="切换到${escapeHTML(item.name)}" aria-pressed="${item.id === product.id}"><span></span></button>`).join('')}</div></div>
      </div>
    </div>
    <button class="le-service" type="button" data-action="service" aria-label="${escapeHTML(ctx.service.title)}，${escapeHTML(ctx.service.label)}">
      <span class="le-service-symbol">${ctx.icon(ctx.service.icon)}</span>
      <span class="le-service-copy"><strong>${escapeHTML(ctx.service.title)}</strong><span>${escapeHTML(ctx.service.hint)}</span></span>
      <span class="le-service-action">${escapeHTML(ctx.service.label)}${ctx.icon('entry-chevron')}</span>
    </button>
  </section>`;
}

function unavailable(ctx) {
  const empty = ctx.state === 'empty';
  return `<section class="le-unavailable" aria-label="${empty ? '暂无关联产品' : '产品读取失败'}">
    <span class="le-state-label">我的产品</span>
    <h2>${empty ? '还没有关联产品' : '暂时无法读取产品'}</h2>
    <p>${empty ? '添加产品，查看资料或预约服务。<br>也可同步手机号已关联的产品。' : '检查网络连接后重试。<br>需要帮助时，可通过下方入口联系客服。'}</p>
    <div class="le-state-actions"><button class="le-state-primary" type="button" data-action="${empty ? 'add' : 'retry'}">${empty ? '添加我的产品' : '重新读取'}</button>${empty ? '<button class="le-state-secondary" type="button" data-action="sync">同步已关联产品</button>' : ''}</div>
  </section>`;
}

function help() {
  return `<nav class="le-help" aria-label="帮助与支持">
    <button type="button" data-action="assistant"><img src="assets/help-icons/assistant-purple-v1.png" alt="" aria-hidden="true"><span>智能助手</span></button>
    <button type="button" data-action="outlets"><img src="assets/help-icons/outlets-teal-v1.png" alt="" aria-hidden="true"><span>服务网点</span></button>
    <button type="button" data-action="support"><img src="assets/help-icons/support-orange-v1.png" alt="" aria-hidden="true"><span>TOTO 客服</span></button>
  </nav>`;
}

function render(ctx) {
  const exceptional = ctx.state === 'empty' || ctx.state === 'error';
  return `<div class="variant v-living-editorial${exceptional ? ` is-${escapeHTML(ctx.state)}` : ''}">${brand(ctx)}${scene()}${exceptional ? unavailable(ctx) : productAndService(ctx)}${help()}</div>`;
}

window.TOTO_HOME_VARIANTS['living-editorial'] = render;
})();

(() => {
const escapeHtml = (value = '') => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));

function renderProduct(ctx) {
  const { product, products } = ctx;
  return `<section class="cc-product" aria-label="当前产品">
    <div class="cc-product-main">
      <button class="cc-product-photo" type="button" data-action="product" aria-label="查看${escapeHtml(product.name)}产品资料"><img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}"></button>
      <div class="cc-product-info"><span class="cc-label">当前产品</span><h2>${escapeHtml(product.name)}</h2></div>
      ${ctx.service.status ? `<span class="cc-product-status">${escapeHtml(ctx.service.status)}</span>` : ''}
    </div>
    <div class="cc-products" aria-label="切换产品">${products.map(item => `<button class="cc-product-chip ${item.id === product.id ? 'is-current' : ''}" type="button" data-product="${escapeHtml(item.id)}" aria-pressed="${item.id === product.id}"><span class="cc-product-dot"></span><span>${escapeHtml(item.name)}</span></button>`).join('')}</div>
  </section>`;
}

function renderHelp(ctx) {
  return `<section class="cc-help" aria-label="帮助与支持">
    <h2>帮助与支持</h2>
    <div class="cc-help-grid">
      <button class="cc-help-item" type="button" data-action="assistant"><span class="cc-help-icon"><img src="assets/help-icons/assistant-purple-v1.png" alt="" aria-hidden="true"></span><span>智能助手</span></button>
      <button class="cc-help-item" type="button" data-action="outlets"><span class="cc-help-icon"><img src="assets/help-icons/outlets-teal-v1.png" alt="" aria-hidden="true"></span><span>服务网点</span></button>
      <button class="cc-help-item" type="button" data-action="support"><span class="cc-help-icon"><img src="assets/help-icons/support-orange-v1.png" alt="" aria-hidden="true"></span><span>TOTO 客服</span></button>
    </div>
  </section>`;
}

function render(ctx) {
  const service = ctx.service;
  const exceptional = ctx.state === 'empty' || ctx.state === 'error';
  return `<div class="variant v-concierge">
    <header class="cc-header"><div class="cc-brand"><strong>TOTO</strong><span>售后服务</span></div><button class="cc-add" type="button" data-action="add">${ctx.icon('plus')}<span>添加产品</span></button></header>
    <div class="cc-intro"><h1>安心使用，从这里开始</h1></div>
    ${exceptional ? `<div class="cc-exception">${ctx.state === 'empty' ? ctx.empty() : ctx.error()}</div>` : `${renderProduct(ctx)}
      <section class="cc-service ${ctx.state === 'progress' ? 'cc-service--progress' : ''}" aria-label="当前服务">
        <div class="cc-service-head"><span>当前服务</span><span class="cc-service-icon">${ctx.icon(service.icon)}</span></div>
        <h2>${escapeHtml(service.title)}</h2><p class="cc-service-description">${escapeHtml(service.hint)}</p>
        ${ctx.state === 'progress' ? `<div class="cc-progress" aria-label="服务阶段"><div class="cc-step is-done"><i></i><span>申请提交</span></div><div class="cc-step is-active"><i></i><span>${service.confirmed ? '联系已确认' : '等待联系'}</span></div><div class="cc-step"><i></i><span>服务完成</span></div></div>` : '<div class="cc-service-rule"></div>'}
        <button class="cc-primary" type="button" data-action="service"><span>${escapeHtml(service.label)}</span><span aria-hidden="true">${ctx.icon('entry-chevron')}</span></button>
      </section>`}
    ${renderHelp(ctx)}
  </div>`;
}

window.TOTO_HOME_VARIANTS['concierge'] = render;
})();
})();
