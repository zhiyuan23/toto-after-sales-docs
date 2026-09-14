window.TOTO_SCREENS = window.TOTO_SCREENS || {};

(() => {
  const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const products = [
    { id: 't01', categoryId: 'toilet', categoryName: '坐便器', seriesId: 'neorest', seriesName: '诺锐斯特LS', name: '智能坐便器', model: 'CES8G820GCN', room: '主卫', image: 'assets/product-toilet.jpg', code: 'DEMO-TOTO-001' },
    { id: 'b02', categoryId: 'basin', categoryName: '洗面器', seriesId: 'unassigned', seriesName: '未分系列', name: '台下式洗面器', model: 'LW1535B', room: '客卫', image: 'assets/product-basin.jpg', code: 'DEMO-TOTO-002' },
  ];
  const types = { install: '安装服务', repair: '维修服务', 'remote-guidance': '远程使用指导', 'onsite-guidance': '上门使用指导' };
  const times = { morning: '上午 09:00—12:00', afternoon: '下午 14:00—17:00', any: '时间均可，联系确认' };
  const item = ctx => ctx.product || products[0];
  const allProducts = ctx => ctx.products || products;
  const type = ctx => ctx.serviceType || 'repair';
  const typeName = ctx => types[type(ctx)] || '维修服务';
  const isRemote = ctx => type(ctx) === 'remote-guidance';
  const field = (ctx, name, fallback = '') => ctx.form?.[name] ?? fallback;
  const registered = (ctx, name, fallback = '') => ctx.registered?.[name] ?? fallback;
  const icon = name => `<span class="c-service-icon" data-icon="${name}" aria-hidden="true"></span>`;
  const step = (number, title = '', description = '') => `<div class="c-step-label">第 ${number} 步 / 共 3 步</div>${title ? `<header class="c-page-heading"><h2>${e(title)}</h2>${description ? `<p>${e(description)}</p>` : ''}</header>` : description ? `<p class="c-page-intro">${e(description)}</p>` : ''}`;
  const compact = (ctx, caption = '本次服务产品', showInstallationSelection = false) => {
    let selected = [item(ctx)];
    if (showInstallationSelection) {
      const values = field(ctx, 'installProducts', [item(ctx).id]);
      const ids = Array.isArray(values) ? values : [values];
      selected = allProducts(ctx).filter(product => ids.includes(product.id));
    }
    if (!selected.length) return '<div class="c-product-context"><div><span>安装服务</span><strong>尚未选择安装产品</strong><p>请返回上一步选择需要安装的产品。</p></div></div>';
    const first = selected[0];
    const multiple = selected.length > 1;
    return `<div class="c-product-context"><img src="${e(first.image)}" alt="${e(first.name)}"><div><span>${e(caption)}${multiple ? ` · ${selected.length} 件产品` : ''}</span><strong>${e(selected.map(product => product.name).join('、'))}</strong><p>${multiple ? '同一使用地址' : `${e(first.room)} · ${e(first.model)}`}</p></div></div>`;
  };
  const hero = (ctx, small = false) => `<div class="c-product-stage${small ? ' is-small' : ''}"><img src="${e(item(ctx).image)}" alt="${e(item(ctx).name)} ${e(item(ctx).model)} 产品外观"></div>`;
  const switcher = ctx => `<div class="c-product-switcher" aria-label="选择当前产品">${allProducts(ctx).map(p => `<button data-product="${e(p.id)}" data-go="c-home" aria-pressed="${p.id === item(ctx).id}" class="${p.id === item(ctx).id ? 'is-selected' : ''}">${e(p.name)}</button>`).join('')}<button class="c-add-product" data-go="c-register" aria-label="登记其他产品"><span class="c-inline-icon" data-icon="plus" aria-hidden="true"></span></button></div>`;
  const actions = () => `<div class="c-service-actions" aria-label="为当前产品选择服务"><button data-service-type="install" data-go="c-install">${icon('install')}<strong>安装</strong><span>新产品，安心启用</span></button><button class="c-service-primary" data-service-type="repair" data-go="c-repair">${icon('repair')}<strong>维修</strong><span>遇到问题，帮您解决</span></button><button data-service-type="remote-guidance" data-go="c-repair">${icon('guidance')}<strong>使用指导</strong><span>让好体验更简单</span></button></div>`;
  const orderSummary = ctx => ctx.order ? `<button class="c-order-strip" data-go="c-progress"><span class="c-status-dot" aria-hidden="true"></span><span><strong>${e(types[ctx.order.serviceType] || '售后服务')} · ${ctx.order.status === 'confirmed' ? '时间已确认' : '等待联系确认'}</strong><small>${ctx.order.status === 'confirmed' ? '查看本次服务安排与进度' : '申请已收到，后续将与您联系'}</small></span><span aria-hidden="true">›</span></button>` : `<div class="c-assurance"><span class="c-status-dot" aria-hidden="true"></span><span>每一件 TOTO，都有贴心服务相伴</span></div>`;
  const row = (label, value) => `<div class="c-detail-row"><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`;
  const registration = ctx => ctx.registration || {};
  const catalog = ctx => ctx.catalog || products;
  const registrationProducts = ctx => ['manual', 'product-code'].includes(registration(ctx).method) && (registration(ctx).method === 'manual' || registration(ctx).lookupStatus === 'matched') ? registration(ctx).selectedProducts || [] : [];
  const registrationMethods = {manual: '手动选择商品', 'product-code': '辅助识别商品', 'existing-record': '已有购买登记'};
  const linkedInstallationCode = product => product?.installationCodeLinked === true ? product.installationCode || '' : '';
  const installationExplanation = () => '<header class="c-page-heading"><h2>安装码，帮助查询服务记录</h2><p>门店或客服可用安装码查找相应商品的购买记录和服务信息。</p></header><section class="c-code-explanation"><h3>拿到安装码后，怎么用？</h3><p>联系购买门店或客服时，提供安装码并说明您需要的帮助。</p><p>安装码不能在这里添加产品，也不表示已经申请安装服务。</p></section><button class="c-menu-row" data-go="c-code-help"><span>联系购买门店或客服</span><span aria-hidden="true">›</span></button>';
  const dateLimit = () => { const now = new Date(); return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`; };
  const registrationField = (ctx, name, fallback = '') => registration(ctx)[name] ?? fallback;
  const phoneMask = value => String(value || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const registrationSummary = (selected, caption = '本次登记的商品') => selected.length ? `<section class="c-registration-summary"><span class="c-registration-caption">${e(caption)}</span>${selected.map(product => `<div class="c-product-context"><img src="${e(product.image)}" alt="${e(product.name)}"><div><strong>${e(product.name)}</strong><p>${e(product.model)}</p></div></div>`).join('')}</section>` : '<div class="c-info-note">尚未选择或识别商品，请先完成上一项操作。</div>';
  const registrationResult = ctx => {
    if (ctx.registrationReceipt) {
      if (!['manual', 'product-code'].includes(ctx.registrationReceipt.method)) return null;
      return {...ctx.registrationReceipt, installationCode: ''};
    }
    if (ctx.hasProducts === false || !ctx.product) return null;
    const info = ctx.product.registration || {};
    return {...info, products: [ctx.product], method: info.method || '', installationCode: linkedInstallationCode(ctx.product)};
  };
  const codeInput = ctx => `<p class="c-page-intro">识别后请核对商品，再填写购买与使用信息。</p><button class="c-scan-button c-scan-compact" data-code-example="valid"><span class="c-scan-frame" data-icon="camera" aria-hidden="true"></span><strong>扫描产品标签码</strong><span>查看商品识别示例</span></button><div class="c-divider-label"><span>也可以手动填写</span></div><form id="c-product-code-form" class="c-form" data-submit-go="c-code-result"><label class="field"><span>产品标签码 <em>必填</em></span><input name="productCode" value="${e(registrationField(ctx, 'productCode'))}" placeholder="请输入产品标签上的编码" maxlength="80" autocomplete="off" required></label></form><button class="c-text-button" data-go="c-code-guide">不确定手上是哪一种码？</button><details class="c-code-examples"><summary>试用演示码</summary><p>示例只用于选择商品，不判断是否已登记。</p><div><button data-code-example="valid">坐便器示例</button><button data-code-example="alternate">洗面器示例</button><button data-code-example="not-found">未找到示例</button><button data-code-example="wrong-type">误填安装码</button></div></details>`;

  const productNames = ctx => {
    const chosen = field(ctx, 'installProducts', [item(ctx).id]);
    const ids = Array.isArray(chosen) ? chosen : [chosen];
    return allProducts(ctx).filter(p => ids.includes(p.id)).map(p => p.name).join('、') || item(ctx).name;
  };
  const serviceProducts = (ctx, order) => allProducts(ctx).filter(p => (order.productIds || [order.productId]).includes(p.id));
  const serviceProductSummary = (ctx, order) => {
    const list=serviceProducts(ctx,order),first=list[0];
    return `<div class="c-hub-product">${first?`<img src="${e(first.image)}" alt="${e(first.name)}">`:''}<div><strong>${e(list.map(p=>p.name).join('、') || order.productName || '本次服务产品')}</strong><p>${list.length>1?`${list.length} 件产品 · 同一服务申请`:e(first?`${first.room} · ${first.model}`:'产品资料见申请详情')}</p></div></div>`;
  };
  const serviceHub = ctx => {
    const orders=ctx.serviceOrders || (ctx.order?[ctx.order]:[]);
    const order=orders.find(o=>o.id===ctx.order?.id) || orders[0];
    const header=`<header class="c-hub-header"><div><h2>我的服务</h2>${orders.length?`<p>正在跟进 ${orders.length} 项服务</p>`:''}</div>${order?'<button class="c-text-button" data-go="c-products">＋ 申请新服务</button>':''}</header>`;
    const help=`<section class="c-hub-help"><button class="c-menu-row" data-go="c-evaluation"><span>历史服务与评价</span><span class="c-secondary-text">已完结示例 ›</span></button><div class="c-hub-help-links"><button data-go="c-outlets">查找服务网点 <span aria-hidden="true">›</span></button>${order?'':'<button data-action="可选择电话客服或微信客服；本次仅演示入口。">联系 TOTO 客服 <span aria-hidden="true">›</span></button>'}</div></section>`;
    if (!order) return `${header}<section class="c-hub-empty"><span class="c-hub-empty-symbol" data-icon="service" aria-hidden="true"></span><h3>暂无进行中的服务</h3><p>${ctx.hasProducts===false?'登记产品后，即可申请售后服务。':'提交申请后，可以在这里查看<br>服务进度与联系安排。'}</p><button class="primary" data-go="${ctx.hasProducts===false?'c-register':'c-products'}">${ctx.hasProducts===false?'登记产品':'申请服务'}</button></section>${help}`;
    const confirmed=order.status==='confirmed',remote=order.serviceType==='remote-guidance';
    const switcher=orders.length>1?`<div class="c-hub-switcher" aria-label="选择要跟进的服务">${orders.map(o=>{const list=serviceProducts(ctx,o),first=list[0];return `<button data-product="${e(o.productId)}" data-go="c-service" aria-pressed="${order.id===o.id}"><strong>${e(list.length>1?`${list.length} 件产品`:first?.room || '产品') } · ${e(types[o.serviceType] || '售后服务')}</strong><span>${o.status==='confirmed'?'时间已确认':'等待联系'}</span></button>`;}).join('')}</div>`:'';
    const currentTitle=confirmed?'时间已确认':'等待联系确认';
    const stageLabels=['申请提交','联系确认',remote?'使用指导':'服务处理','服务完成'];
    const stages=`<ol class="c-hub-stages" aria-label="服务阶段">${stageLabels.map((label,i)=>`<li class="${i===0?'is-done':i===1?'is-current':'is-next'}" ${i===1?'aria-current="step"':''}><span class="c-hub-stage-dot" aria-hidden="true">${i===0?'✓':i+1}</span><strong>${label}</strong><small>${i===0?'已提交':i===1?(confirmed?'已确认':'待联系'):'待进行'}</small></li>`).join('')}</ol>`;
    const arrangement=confirmed?`<div class="c-hub-arrangement"><span>${remote?'已确认联系时间':'已确认上门时间'}</span><strong>${e(order.confirmedDate || '日期待确认')}</strong><p>${e(times[order.confirmedTime] || order.confirmedTime || '时段待确认')}</p></div>`:`<div class="c-hub-arrangement is-pending"><span>服务安排</span><strong>联系后确认${remote?'指导方式与时间':'服务方式与时间'}</strong><p>申请已收到，请留意来电。</p></div>`;
    const next=confirmed?(remote?'请在确认时段保持电话畅通，便于沟通使用问题。':'请留意来电，并在确认时段做好产品现场准备。'):'我们将与您核对需求并确认安排，您暂时无需重复申请。';
    return `${header}${switcher}<section class="c-hub-overview" aria-label="当前服务"><div class="c-hub-status"><span>${e(types[order.serviceType] || '售后服务')}</span><h2>${currentTitle}</h2></div>${serviceProductSummary(ctx,order)}${stages}${arrangement}<div class="c-hub-next"><span>接下来</span><p>${next}</p></div><div class="c-hub-actions"><button class="secondary" data-action="本次只演示客服联系入口，未发起真实通话。">联系客服</button><button class="primary" data-product="${e(order.productId)}" data-go="c-progress">查看完整进度</button></div></section>${help}`;
  };
  const welcome = ctx => `<div class="c-welcome"><div class="c-welcome-brand">TOTO</div><h2>让家的每一份舒适<br>都有照顾</h2><p>登记您的 TOTO 产品，<br>安装、维修与使用指导，随时找到我们。</p><div class="c-welcome-image"><img src="${e(item(ctx).image)}" alt="TOTO 智能坐便器产品示意"></div><button class="primary" data-go="c-register">登记我的产品</button><button class="c-text-button" data-go="c-service">先了解售后服务</button></div>`;

  window.TOTO_SCREENS.consumer = {
    name: '消费者小程序',
    products,
    tabs: [
      { label: '首页', go: 'c-home' },
      { label: '服务', go: 'c-service' },
      { label: '我的', go: 'c-mine' },
    ],
    screens: [
      {
        id: 'c-home', title: '我的 TOTO', entry: 'C01 · 产品中心', tab: 'c-home',
        goal: '先看见自己正在使用的产品，再围绕它发起安装、维修或使用指导；用产品形象建立归属感。',
        note: '产品切换同步更新名称、型号、大图和当前服务。安装为本轮探索原型，尚未确认为正式需求；产品图为官方示意图，洗面器搭配图中的龙头及台面不表示随产品购买包含；数据仅供原型评审。产品无活动单时不展示其他产品的服务状态。',
        body: ctx => ctx.hasProducts === false ? welcome(ctx) : `${switcher(ctx)}<div class="c-product-heading"><p>${e(item(ctx).room)} · 已登记产品</p><h2>${e(item(ctx).name)}</h2><button data-go="c-product" aria-label="查看${e(item(ctx).name)}的产品资料">${e(item(ctx).model)} <span aria-hidden="true">›</span></button></div>${hero(ctx)}${ctx.order ? orderSummary(ctx) : ''}${actions()}${ctx.order ? '' : orderSummary(ctx)}<div class="c-home-links"><button data-go="c-product">产品资料 <span aria-hidden="true">›</span></button><button data-go="c-products">我的全部产品 <span aria-hidden="true">›</span></button></div>`,
      },
      {
        id: 'c-service', title: '服务', entry: 'C02 · 服务聚合与进度', tab: 'c-service',
        goal: '优先跟进服务：快速识别当前状态、确认安排和下一步；多产品直接切换服务记录，新申请从轻量入口回到产品选择。',
        note: '按申请单号汇总活动服务，多商品安装申请只展示一次。待联系和时间已确认沿用原有示例状态，期望时间不冒充确认时间；未来节点为待进行。无活动申请显示空态；历史入口仍为独立已完结评价示例，客服未接真实渠道。',
        body: serviceHub,
      },
      {
        id: 'c-mine', title: '我的', entry: 'C13 · 个人中心', tab: 'c-mine',
        goal: '保留清晰的个人产品和服务入口，降低账户、地址与隐私设置对核心服务的干扰。',
        note: '已登录的虚构演示身份；手机号变更、登录与授权状态仍待正式契约，点击反馈不代表验证已完成。未登记预览入口是评审工具，只跳转空态页面，不清除当前数据。',
        body: ctx => `<header class="c-profile">${window.TOTO_ACCOUNT.avatarMarkup(ctx.profile?.avatar)}<div><h2>${e((ctx.profile?.userName || '陈女士'))}</h2><p>${e(phoneMask(ctx.profile?.phone || '13800000026'))}</p></div><button class="c-text-button" data-go="c-profile">个人信息 ›</button></header><section class="c-my-products"><div class="c-section-heading"><h3>我的 TOTO</h3><button class="c-text-button" data-go="c-products">全部 ${ctx.hasProducts === false ? 0 : allProducts(ctx).length} 件 ›</button></div><div class="c-product-mini-grid">${ctx.hasProducts === false ? '<button class="c-register-prompt" data-go="c-register">登记第一件产品</button>' : allProducts(ctx).map(p => `<button data-product="${e(p.id)}" data-go="c-product"><img src="${e(p.image)}" alt="${e(p.name)}"><strong>${e(p.name)}</strong><span>${e(p.room)}</span></button>`).join('')}</div></section><section class="c-section"><button class="c-menu-row" data-go="c-service"><span>我的服务</span><span aria-hidden="true">›</span></button><button class="c-menu-row" data-registration-record="current" data-go="${ctx.hasProducts === false ? 'c-register' : 'c-register-result'}"><span>登记信息与安装码</span><span aria-hidden="true">›</span></button><button class="c-menu-row" data-go="c-purchases"><span>购买记录</span><span aria-hidden="true">›</span></button><button class="c-menu-row" data-action="可查看隐私条款及同意记录，并进入授权撤回与账户注销流程。"><span>隐私与账户</span><span aria-hidden="true">›</span></button><button class="c-menu-row" data-action="暂无需要填写的问卷。"><span>我的问卷</span><span aria-hidden="true">›</span></button></section><p class="c-brand-signoff">TOTO · 舒适，与您长久相伴</p>`,
      },
      {
        id: 'c-register', title: '登记产品', entry: 'C04 · 选择商品登记',
        goal: '以手动选择商品为登记主路径；产品标签码只辅助识别商品，安装码仅提供使用说明。',
        note: '安装码当前用于后台按产品实例查询，尚无消费者身份校验或归属认领契约，本原型不提供输入安装码绑定产品。手选与标签码识别均为虚构数据的原型探索，不表示实物已核验。',
        body: () => `<p class="c-page-intro">选择登记方式，核对商品后填写购买与使用信息。</p><div class="c-registration-methods"><button class="c-registration-method" data-reg-method="manual"><span class="c-method-number">01</span><span><strong>手动选择商品</strong><small>按分类、系列找到您的商品<br>核对商品外观与信息</small></span><span class="c-method-arrow" aria-hidden="true">›</span></button><button class="c-registration-method" data-reg-method="product-code"><span class="c-method-number">02</span><span><strong>用产品标签码辅助选择</strong><small>识别产品标签上的编码<br>核对商品后继续登记</small></span><span class="c-method-arrow" aria-hidden="true">›</span></button></div><section class="c-section"><button class="c-menu-row" data-go="c-installation-code"><span>拿到安装码，怎么用？</span><span aria-hidden="true">›</span></button><button class="c-menu-row" data-go="c-code-guide"><span>安装码和产品标签码的区别</span><span aria-hidden="true">›</span></button></section>`,
      },
      {
        id: 'c-manual-select', title: '选择您的商品', entry: 'C04 · 手动选择分类、系列与商品',
        goal: '按照分类、系列、商品逐级缩小范围，并用外观与型号确认具体商品；不把目录商品误当作已登记实物。',
        note: '当前两件目录商品只用于演示分组，分类与系列不作为最终主档。分类变更清空系列及商品，系列变更清空商品；每一级都需明确选择，不因只有一项而自动跳过。',
        body: ctx => {
          const reg = registration(ctx);
          const items = catalog(ctx);
          const categories = [...new Map(items.map(product => [product.categoryId, {id:product.categoryId, name:product.categoryName}])).values()];
          const series = [...new Map(items.filter(product => product.categoryId === reg.categoryId).map(product => [product.seriesId, {id:product.seriesId, name:product.seriesName}])).values()];
          const choices = items.filter(product => product.categoryId === reg.categoryId && product.seriesId === reg.seriesId);
          return `<div class="c-step-label">第 1 步 / 共 3 步</div><p class="c-page-intro">按分类和系列选择，再核对图片与型号。</p><section class="c-selection-section"><h3><span>1</span>选择分类</h3><div class="c-selection-options">${categories.map(category => `<button data-category="${e(category.id)}" aria-pressed="${category.id === reg.categoryId}">${e(category.name)}</button>`).join('')}</div></section><section class="c-selection-section"><h3><span>2</span>选择系列</h3>${reg.categoryId ? `<div class="c-selection-options">${series.map(group => `<button data-series="${e(group.id)}" aria-pressed="${group.id === reg.seriesId}">${e(group.name)}</button>`).join('')}</div>` : '<p class="c-selection-placeholder">先选择分类，再查看相应系列。</p>'}</section><section class="c-selection-section"><h3><span>3</span>确认商品</h3>${reg.seriesId ? `<div class="c-catalog-options">${choices.map(product => `<button class="c-catalog-product" data-catalog-product="${e(product.id)}" aria-pressed="${product.id === reg.catalogProductId}"><img src="${e(product.image)}" alt="${e(product.name)}"><span><strong>${e(product.name)}</strong><small>${e(product.model)}</small></span><span class="c-selection-indicator" aria-hidden="true">${product.id === reg.catalogProductId ? '已选' : '选择'}</span></button>`).join('')}</div>` : '<p class="c-selection-placeholder">选择系列后，用图片和型号确认商品。</p>'}</section>`;
        },
        footer: ctx => `<button class="primary" data-go="c-purchase-date"${registration(ctx).catalogProductId ? '' : ' disabled'}>下一步：购买日期</button>`,
      },
      {
        id: 'c-purchase-date', title: '填写购买日期', entry: 'C05 · 自主登记购买日期',
        goal: '商品识别完成后只确认购买日期，再进入个人信息，避免将找商品和填写资料混成一个长表单。',
        note: '手选与辅助标签码识别均需填写购买日期，不读取安装码购买摘要。日期为本地演示字段，不能晚于当天。',
        body: ctx => {
          const selected = registrationProducts(ctx);
          return `<div class="c-step-label">第 2 步 / 共 3 步</div>${selected.length ? `<div class="c-date-product"><img src="${e(selected[0].image)}" alt="${e(selected[0].name)}"><h3>${e(selected[0].name)}</h3><p>${e(selected[0].model)}</p></div>` : registrationSummary([])}<form id="c-purchase-date-form" class="c-form" data-submit-go="c-purchase"><label class="field"><span>购买日期 <em>必填</em></span><input name="purchaseDate" type="date" max="${dateLimit()}" value="${e(registrationField(ctx, 'purchaseDate'))}" required></label><p class="c-hint">请填写购买凭证或订单上的购买日期，请勿填写收货或安装日期。</p></form><button class="c-text-button" data-go="${registration(ctx).method === 'product-code' ? 'c-product-code' : 'c-manual-select'}">重新选择或识别商品</button>`;
        },
        footer: ctx => `<button class="primary" type="submit" form="c-purchase-date-form"${registrationProducts(ctx).length ? '' : ' disabled'}>下一步：个人信息</button>`,
      },
      {
        id: 'c-installation-code', title: '安装码使用说明', entry: 'C04 · 安装码查询协助',
        goal: '说明安装码供门店或客服查询记录，避免把查询标识当作消费者登记凭证。',
        note: '保留旧 hash 为说明页，不再提供输入、识别、购买摘要、个人信息绑定或提交入口。后台安装码关联产品实例；消费者身份与认领接口未形成，当前不开放消费者按码查记录。',
        body: installationExplanation,
        footer: '<button class="primary" data-reg-method="manual">选择商品登记</button>',
      },
      {
        id: 'c-product-code', title: '产品标签码识别', entry: 'C04 · 辅助识别商品',
        goal: '通过标签码辅助找到商品，再由消费者核对并补充购买和使用信息。',
        note: 'DEMO-PRODUCT-003 与 001 仅匹配坐便器目录商品，002 匹配洗面器。演示不使用摄像头；不推断标签码是唯一实物码、不与安装码建立映射、不判断归属或自动合并已登记产品。',
        body: codeInput,
        footer: '<button class="primary" type="submit" form="c-product-code-form">识别商品</button>',
      },
      {
        id: 'c-code-result', title: '商品识别结果', entry: 'C04 · 辅助识别与异常反馈',
        goal: '展示本次识别到的商品供核对，误填安装码时引导查看用途，不转入认领流程。',
        note: '结果只消费产品标签码辅助识别状态。没有购买摘要、已登记归属判断或安装码认领；同一标签码再次识别仍仅匹配商品，重复登记控制待真实实物身份契约确认。',
        body: ctx => {
          const reg = registration(ctx), status = reg.method === 'product-code' ? reg.lookupStatus || 'idle' : 'idle';
          if (status === 'matched') return `<div class="c-result-heading c-code-result-heading"><span class="c-result-mark" data-icon="check" aria-hidden="true"></span><h2>找到这款商品了</h2><p>请核对商品是否与您购买的一致，<br>再填写购买日期与个人信息。</p></div>${registrationSummary(registrationProducts(ctx), '本次识别的商品')}<dl class="c-details">${row('本次输入的标签码', reg.productCode)}</dl><p class="c-info-note">识别商品不会自动带入购买记录。</p><button class="c-text-button" data-go="c-product-code">商品不符，重新识别</button>`;
          if (status === 'wrong-type') return '<div class="c-result-heading c-code-result-heading"><h2>您填写的可能是安装码</h2><p>安装码可提供给门店或客服查询记录，<br>不能用于这里的商品识别或产品登记。</p></div><button class="c-menu-row" data-go="c-installation-code"><span>查看安装码使用说明</span><span aria-hidden="true">›</span></button>';
          return `<div class="c-result-heading c-code-result-heading"><h2>${status === 'not-found' ? '暂时没有找到对应商品' : '先识别商品'}</h2><p>${status === 'not-found' ? '请检查标签码是否完整。<br>也可以手动选择商品继续登记。' : '填写产品标签码后，再核对商品信息。'}</p></div><button class="c-menu-row" data-go="c-code-help"><span>需要门店或客服协助？</span><span aria-hidden="true">›</span></button>`;
        },
        footer: ctx => {
          const reg = registration(ctx);
          if (reg.method === 'product-code' && reg.lookupStatus === 'matched' && registrationProducts(ctx).length) return '<button class="primary" data-go="c-purchase-date">确认商品，填写购买日期</button>';
          return '<button class="secondary" data-reg-method="manual">手动选择商品</button><button class="primary" data-reg-method="product-code">重新识别商品</button>';
        },
      },
      {
        id: 'c-code-guide', title: '认识两种编码', entry: 'C04 · 安装码与产品标签码说明',
        goal: '区分后台查询标识与辅助商品识别输入，不把任何一种码当作消费者身份或实物归属证明。',
        note: '安装码关联后台产品实例，目前没有消费者认领接口；产品标签识别仅作商品选择探索，未定义条码格式、唯一实物身份或与安装码的映射。',
        body: () => `<header class="c-page-heading"><h2>两种码，用在不同的地方</h2><p>先看看手中的编码从哪里来。</p></header><section class="c-code-explanation"><span class="c-tag">购买或服务资料中</span><h3>安装码</h3><p>提供给门店或客服，帮助查询相应商品的购买记录和服务信息。它不能在这里添加产品。</p><button class="c-text-button" data-go="c-installation-code">查看安装码使用说明 ›</button></section><section class="c-code-explanation"><span class="c-tag">产品标签上</span><h3>产品标签码</h3><p>辅助找到商品。核对商品后，还需要填写购买日期与使用信息。</p><button class="c-text-button" data-reg-method="product-code">识别商品 ›</button></section><p class="c-info-note">登记产品与申请安装服务是不同步骤。安装安排需要后续联系确认。</p><button class="c-text-button" data-reg-method="manual">手动选择商品登记</button>`,
      },
      {
        id: 'c-code-help', title: '联系门店与客服', entry: 'C04 · 购买与安装码查询协助',
        goal: '提供人工协助方向，不演示通过手机号查回记录或通过安装码认领产品。',
        note: '只提供联系说明，不收集找回手机号、不发送短信、不验证身份、不查找或绑定购买记录。真实客服和门店联系渠道尚未接入。',
        body: () => '<header class="c-page-heading"><h2>让门店或客服帮您核对</h2><p>准备好购买凭证、商品信息，<br>有安装码时也可以一起提供。</p></header><section class="c-code-explanation"><h3>联系购买门店</h3><p>可通过购买凭证或订单上的门店联系方式，核对商品与购买记录。</p><h3>联系 TOTO 客服</h3><p>说明您需要查询的内容，请客服协助核实。没有安装码，也可以先说明购买情况。</p></section><button class="c-menu-row" data-action="请从购买凭证、订单或 TOTO 官方渠道查找联系方式，并说明您需要核对的记录。"><span>查看联系指引</span><span aria-hidden="true">›</span></button>',
        footer: '<button class="primary" data-reg-method="manual">选择商品登记</button>',
      },
      {
        id: 'c-purchase', title: '填写个人信息', entry: 'C05 · 共用个人与使用信息',
        goal: '核对本次所选商品和自行填写的购买日期，只补充所需的姓名、手机号、使用方式和地址。',
        note: '个人信息只写入本次选定商品的本地演示资料，不核验实物身份或归属。手选与辅助识别分别保留草稿；不提供安装码登记。手机号与隐私勾选仅用于原型演示。',
        body: ctx => !registrationProducts(ctx).length ? '<div class="c-info-note">请先选择商品并填写购买日期。</div>' : `<div class="c-step-label">第 3 步 / 共 3 步</div>${registrationSummary(registrationProducts(ctx))}<dl class="c-details c-registration-purchase-meta">${row('登记方式', registrationMethods[registration(ctx).method] || '尚未选择')}${row('购买日期', registrationField(ctx, 'purchaseDate') || '尚未填写')}</dl><form id="c-purchase-form" class="c-form" data-submit-go="c-register-result"><label class="field"><span>姓名 <em>必填</em></span><input name="userName" value="${e(registrationField(ctx, 'userName'))}" maxlength="30" autocomplete="off" placeholder="请输入姓名" required></label><label class="field"><span>手机号 <em>必填</em></span><input name="phone" type="tel" inputmode="numeric" value="${e(registrationField(ctx, 'phone'))}" pattern="1[0-9]{10}" maxlength="11" placeholder="请输入联系手机号" required></label><label class="field"><span>使用方式 <em>必填</em></span><select name="useType" required><option value="self"${registrationField(ctx, 'useType', 'self') === 'self' ? ' selected' : ''}>自己使用</option><option value="friend"${registrationField(ctx, 'useType') === 'friend' ? ' selected' : ''}>为亲友购买</option></select></label><label class="field"><span>使用地区 <em>必填</em></span><select name="region" required><option value="">请选择地区</option><option value="示例省 / 示例市 / 示例区"${['demo', '示例省 / 示例市 / 示例区'].includes(registrationField(ctx, 'region')) ? ' selected' : ''}>示例省 / 示例市 / 示例区</option></select></label><label class="field"><span>详细地址 <em>必填</em></span><input name="address" value="${e(registrationField(ctx, 'address'))}" maxlength="200" placeholder="请输入产品使用地址" required></label><label class="c-consent"><input type="checkbox" name="privacyConsent"${registrationField(ctx, 'privacyConsent') ? ' checked' : ''} required><span>我已阅读并同意将以上信息用于本次产品登记与服务联系。</span></label><button class="c-text-button" type="button" data-action="隐私条款说明登记信息用途，以及查询、撤回授权和注销入口。本次为原型说明。">查看隐私条款</button></form>`,
        footer: ctx => `<button class="primary" type="submit" form="c-purchase-form"${registrationProducts(ctx).length ? '' : ' disabled'}>完成产品登记</button>`,
      },
      {
        id: 'c-register-result', title: '登记信息', entry: 'C06 · 登记回执与已有记录',
        goal: '只展示本次真实演示登记或当前产品已有的信息，保持商品数量、购买日期、来源与个人资料一致。',
        note: '本次手选或辅助识别回执始终不含安装码。仅既有已关联的虚构产品记录只读显示安装码，用于向门店或客服查询；旧安装码登记回执不展示成功信息。消费者身份与归属接入仍待确认。',
        body: ctx => {
          const record = registrationResult(ctx);
          if (!record) return '<div class="c-result-heading"><h2>先登记您的 TOTO 产品</h2><p>完成登记后，即可查看这件产品的登记信息。</p></div>';
          return `<div class="c-result-heading"><span class="c-result-mark" data-icon="check" aria-hidden="true"></span><h2>${ctx.registrationReceipt ? '登记完成，产品已添加' : '这件产品的登记信息'}</h2><p>${ctx.registrationReceipt ? '可以回到产品中心，查看资料或申请服务。' : '购买与使用信息，集中在这里查看。'}</p></div>${registrationSummary(record.products || [], '本次登记的产品')}${record.installationCode ? `<section class="c-install-code"><span>已关联的安装码</span><strong>${e(record.installationCode)}</strong><p>联系门店或客服时，可提供此码查询相应记录。</p><button class="c-text-button" data-go="c-installation-code">安装码使用说明</button></section>` : '<p class="c-info-note">这次登记未关联安装码。您仍可从产品中心发起服务申请。</p>'}<section class="c-section"><h3>购买与使用信息</h3><dl class="c-details">${row('登记方式', registrationMethods[record.method] || '已有登记')}${row('购买日期', record.purchaseDate || '未提供')}${row('姓名', record.userName || '未提供')}${row('手机号', phoneMask(record.phone) || '未提供')}${row('使用方式', record.useType === 'friend' ? '为亲友购买' : '自己使用')}${row('使用地区', record.region === 'demo' ? '示例省 / 示例市 / 示例区' : record.region || '未提供')}${row('详细地址', record.address || '未提供')}</dl></section>`;
        },
        footer: ctx => {
          const record = registrationResult(ctx), first = record?.products?.[0];
          if (!first) return '<button class="primary" data-go="c-register">登记我的产品</button>';
          return `<button class="secondary" data-product="${e(first.id)}" data-go="c-product">查看产品资料</button><button class="primary" data-product="${e(first.id)}" data-go="c-home">回到产品中心</button>`;
        },
      },
      {
        id: 'c-products', title: '我的产品', entry: 'C10 · 产品展厅',
        goal: '用可以辨认的产品图帮助消费者切换到正确产品，避免把不同产品的服务申请与进度混在一起。',
        note: '仅显示当前演示账户实际已登记的产品实例。目录商品不计入已登记数量，新增登记按本次选择建立实例；产品选择、资料与服务按实例隔离。',
        body: ctx => ctx.hasProducts === false ? welcome(ctx) : `<p class="c-list-summary">已登记 ${allProducts(ctx).length} 件产品</p><p class="c-page-intro">选择产品，查看资料或申请服务。</p><div class="c-gallery">${allProducts(ctx).map(p => `<button class="c-gallery-product${p.id === item(ctx).id ? ' is-selected' : ''}" data-product="${e(p.id)}" data-go="c-home" aria-label="切换到${e(p.name)}"><div><span class="c-tag">${e(p.room)}</span>${p.id === item(ctx).id ? '<span class="c-current-label">当前产品</span>' : ''}</div><img src="${e(p.image)}" alt="${e(p.name)} ${e(p.model)}"><div class="c-gallery-caption"><span><strong>${e(p.name)}</strong><small>${e(p.model)}</small></span><span aria-hidden="true">›</span></div></button>`).join('')}</div>`,
        footer: '<button class="secondary" data-go="c-register">登记其他产品</button>',
      },
      {
        id: 'c-product', title: '产品资料', entry: 'C10 · 产品详情',
        goal: '把产品外观与身份信息放在一起，让产品资料、购买信息和关联服务容易确认。',
        note: '不展示未经确认的保修期限、免费服务、转赠或解绑承诺。已有安装码仅按明确示例关联只读展示；辅助标签码输入不是实物身份字段。资料和服务跟随本地演示产品，真实身份、归属和重复申请规则仍待确认。',
        body: ctx => {
          const product = item(ctx), info = product.registration || ctx.registered || {};
          return `<div class="c-product-heading"><p>${e(product.room || '我的产品')} · 我的 TOTO</p><h2>${e(product.name)}</h2><span>${e(product.model)}</span></div>${hero(ctx, true)}<section class="c-section"><h3>产品信息</h3><dl class="c-details">${row('型号', product.model)}${info.recognizedProductCode ? row('选商品时输入的标签码', info.recognizedProductCode) : ''}${row('购买日期', info.purchaseDate || '未提供')}${row('登记方式', registrationMethods[info.method] || '已有登记')}${linkedInstallationCode(product) ? row('关联安装码', linkedInstallationCode(product)) : ''}${row('姓名', info.userName || '未提供')}${row('手机号', phoneMask(info.phone) || '未提供')}${row('使用方式', info.useType === 'friend' ? '为亲友购买' : '自己使用')}</dl>${linkedInstallationCode(product) ? '<p class="c-info-note">联系门店或客服时，可提供安装码协助查询记录。</p>' : ''}<button class="c-menu-row" data-registration-record="current" data-go="${ctx.hasProducts === false ? 'c-register' : 'c-register-result'}"><span>查看完整登记信息</span><span aria-hidden="true">›</span></button></section>${ctx.order ? `<section class="c-section"><h3>当前服务</h3>${orderSummary(ctx)}</section>` : '<p class="c-quiet-empty">这件产品暂无进行中的服务。</p>'}`;
        },
        footer: '<button class="secondary" data-service-type="remote-guidance" data-go="c-repair">使用指导</button><button class="primary" data-service-type="repair" data-go="c-repair">申请维修</button>',
      },
      {
        id: 'c-repair', title: '告诉我们您的需要', entry: 'C07 · 问题说明与指导方式',
        goal: '一次只解决问题描述；当前产品始终可见，指导方式区分远程与上门，减少长表单压力。',
        note: '选择服务类型必须保留当前产品。问题描述为必填；媒体通过 none/failed/uploaded 本地状态演示，不访问相册或真实上传。远程与上门实际受理规则待正式契约确认。',
        body: ctx => `${step(1, type(ctx) === 'repair' ? '哪里需要帮助？' : '想了解怎样使用？')}${compact(ctx)}<div class="c-type-options" aria-label="服务类型"><button type="button" data-service-type="repair" data-go="c-repair" aria-pressed="${type(ctx) === 'repair'}">维修</button><button type="button" data-service-type="remote-guidance" data-go="c-repair" aria-pressed="${isRemote(ctx)}">远程指导</button><button type="button" data-service-type="onsite-guidance" data-go="c-repair" aria-pressed="${type(ctx) === 'onsite-guidance'}">上门指导</button></div>${isRemote(ctx) ? '<p class="c-hint">通过电话等远程方式沟通使用问题。</p>' : type(ctx) === 'onsite-guidance' ? '<p class="c-hint">服务人员将联系您，确认上门指导安排。</p>' : ''}<form id="c-repair-form" class="c-form" data-submit-go="c-contact"><label class="field"><span>${type(ctx) === 'repair' ? '问题描述' : '想咨询的问题'} <em>必填</em></span><textarea name="description" rows="4" maxlength="1000" placeholder="${type(ctx) === 'repair' ? '例如：哪项功能不正常，什么时候开始出现？' : '例如：想了解遥控器设置、清洁保养或日常使用。'}" required>${e(field(ctx, 'description'))}</textarea></label><div class="c-field-heading"><strong>照片或视频</strong><span>选填</span></div>${ctx.mediaStatus === 'failed' ? '<div class="c-media-feedback is-failed"><div><strong>这份资料还没有添加成功</strong><p>已填写的内容仍在，可以重试或稍后补充。</p></div><button type="button" class="secondary" data-media="retry">重试</button><button type="button" class="c-text-button" data-media="remove">暂不添加</button></div>' : ctx.mediaStatus === 'uploaded' ? '<div class="c-media-feedback"><div><strong>已添加 1 张示例照片</strong><p>可在提交前移除或重新添加。</p></div><button type="button" class="c-text-button" data-media="remove">移除</button></div>' : '<button class="c-media-add" type="button" data-media="add"><span class="c-inline-icon" data-icon="plus" aria-hidden="true"></span><strong>添加照片 / 视频</strong><small>帮助我们更快了解情况</small></button>'}</form>`,
        footer: '<button class="primary" type="submit" form="c-repair-form">下一步：联系与时间</button>',
      },
      {
        id: 'c-contact', title: '联系与期望时间', entry: 'C07 · 联系与期望时间',
        goal: '按服务方式收集必要的联系信息；远程指导不索取无关的上门地址，期望时间始终明确为待确认。',
        note: '联系信息为虚构演示，可修改并跨步保存。远程不展示地址。日期与时段是消费者期望，不推断已预约成功；正式地区校验、可服务范围和身份验证尚未接入。',
        body: ctx => `${step(2)}${compact(ctx, typeName(ctx), type(ctx) === 'install')}<form id="c-contact-form" class="c-form" data-submit-go="c-confirm"><div class="c-two-fields"><label class="field"><span>联系人 <em>必填</em></span><input name="contactName" autocomplete="off" value="${e(field(ctx, 'contactName', (ctx.profile?.userName || '陈女士')))}" maxlength="30" required></label><label class="field"><span>手机号码 <em>必填</em></span><input name="phone" type="tel" inputmode="numeric" value="${e(field(ctx, 'phone', registered(ctx, 'phone', '13800000026')))}" pattern="1[0-9]{10}" maxlength="11" required></label></div>${isRemote(ctx) ? '' : `<label class="field"><span>产品使用地址 <em>必填</em></span><textarea name="address" rows="2" maxlength="200" required>${e(field(ctx, 'address', registered(ctx, 'address', '示例市示例区样板路 88 号 1 栋 101 室（虚构）')))}</textarea></label>`}<h3>${isRemote(ctx) ? '您希望的联系时间' : '您期望的上门时间'}</h3><label class="field"><span>期望日期 <em>必填</em></span><input name="preferredDate" type="date" value="${e(field(ctx, 'preferredDate', '2026-09-15'))}" required></label><label class="field"><span>期望时段 <em>必填</em></span><select name="preferredTime" required>${Object.entries(times).map(([value, label]) => `<option value="${value}"${field(ctx, 'preferredTime', 'afternoon') === value ? ' selected' : ''}>${e(label)}</option>`).join('')}</select></label><p class="c-info-note">${isRemote(ctx) ? '这是您希望的联系时间。具体指导方式和时间，将在联系后与您确认。' : '这是您的期望时间。实际服务时间，将由服务人员联系后与您确认。'}</p></form>`,
        footer: '<button class="primary" type="submit" form="c-contact-form">下一步：核对申请</button>',
      },
      {
        id: 'c-confirm', title: '核对服务申请', entry: 'C07 · 提交前复核',
        goal: '提交前集中核对产品、服务方式、问题和联系方式；修改返回对应步骤并保留已有内容。',
        note: '复核内容来自本次服务草稿，与登记信息隔离。只有完成确认后才创建本地演示申请；本轮不承诺收费、免费、派工或预约成功。安装多产品为探索结构。',
        body: ctx => `${step(3, '', '提交后，我们会联系您确认服务安排。')}${compact(ctx, typeName(ctx), type(ctx) === 'install')}<section class="c-review-section"><div class="c-section-heading"><h3>服务内容</h3><button class="c-text-button" data-go="${type(ctx) === 'install' ? 'c-install' : 'c-repair'}">修改</button></div><dl class="c-details">${row('服务类型', typeName(ctx))}${type(ctx) === 'install' ? row('安装产品', productNames(ctx)) : ''}${row(type(ctx) === 'install' ? '安装需求' : '问题说明', field(ctx, 'description') || '未补充其他说明')}${row('照片 / 视频', ctx.mediaStatus === 'uploaded' ? '已添加 1 张示例照片' : '未添加')}</dl></section><section class="c-review-section"><div class="c-section-heading"><h3>联系与时间</h3><button class="c-text-button" data-go="c-contact">修改</button></div><dl class="c-details">${row('联系人', `${field(ctx, 'contactName', '陈女士')} · ${field(ctx, 'phone', registered(ctx, 'phone', '13800000026'))}`)}${isRemote(ctx) ? '' : row('使用地址', field(ctx, 'address'))}${row(isRemote(ctx) ? '期望联系时间' : '期望上门时间', `${field(ctx, 'preferredDate')} ${times[field(ctx, 'preferredTime')] || field(ctx, 'preferredTime')}`)}</dl><p class="c-info-note">期望时间尚未确认，请以之后沟通的安排为准。</p></section><form id="c-confirm-form" class="c-form" data-submit-go="c-submit-result"><label class="c-consent"><input type="checkbox" name="privacyConsent" required><span>我确认以上信息，并同意将相关信息用于本次服务联系与处理。</span></label></form>`,
        footer: '<button class="primary" type="submit" form="c-confirm-form">确认提交申请</button>',
      },
      {
        id: 'c-submit-result', title: '申请已收到', entry: 'C07 · 服务申请回执',
        goal: '明确传达申请已收到、仍等待联系，保持产品、服务与单号连续，并给出可靠的下一步入口。',
        note: '优先展示本次刚提交的申请；直接进入且无申请时给出返回入口，避免伪造成功。回执与进度必须使用同一申请，不把旧单确认时间带到新申请。',
        body: ctx => {
          const order = ctx.submittedOrder;
          if (!order) return `<div class="c-result-heading"><h2>还没有提交新的申请</h2><p>选择需要帮助的产品，填写后即可查看回执。</p></div><button class="primary" data-go="c-home">回到产品中心</button>`;
          return `<div class="c-result-heading"><span class="c-result-mark" data-icon="check" aria-hidden="true"></span><h2>申请已收到</h2><p>请保持手机畅通。<br>服务时间和具体安排将在联系后确认。</p></div><div class="c-receipt-status"><span class="c-status-dot" aria-hidden="true"></span><strong>等待联系确认</strong><span>申请已提交</span></div><section class="c-section"><h3>本次申请</h3><dl class="c-details">${row('服务产品', order.productName || item(ctx).name)}${row('服务类型', types[order.serviceType] || typeName(ctx))}${row('申请单号', order.id)}${row('联系人', `${order.contactName || ''} · ${order.phone || ''}`)}${row(order.serviceType === 'remote-guidance' ? '期望联系时间' : '期望上门时间', `${order.preferredDate || ''} ${times[order.preferredTime] || order.preferredTime || ''}`)}</dl></section><p class="c-hint">您可以随时在“服务”中查看这次申请的进度。</p>`;
        },
        footer: ctx => ctx.submittedOrder ? `<button class="secondary" data-product="${e(ctx.submittedOrder.productId)}" data-go="c-home">回到产品中心</button><button class="primary" data-product="${e(ctx.submittedOrder.productId)}" data-go="c-progress">查看服务进度</button>` : '',
      },
      {
        id: 'c-progress', title: '服务进度', entry: 'C10 · 当前产品服务进度',
        goal: '让消费者知道服务目前处于哪一步、是否需要配合，以及哪些安排还未确认。',
        note: '仅显示当前产品的活动单。新提交为 pending，既有 confirmed 才展示确认安排；不会模拟新申请瞬间受理或完工。历史评价单与这里的活动单严格分开；已有活动单时本原型引导查看进度，正式能否并发申请仍待业务规则。',
        body: ctx => {
          const order = ctx.order;
          if (!order) return `<header class="c-page-heading"><h2>这件产品暂无进行中服务</h2><p>需要帮助时，可以从产品中心发起申请。</p></header>${compact(ctx)}<button class="primary" data-go="c-home">回到产品中心</button>`;
          const confirmed = order.status === 'confirmed';
          return `<header class="c-progress-heading"><span class="c-tag">${e(types[order.serviceType] || '售后服务')}</span><h2>${confirmed ? '服务时间已确认' : '申请已收到，等待联系'}</h2><p>${confirmed ? '请留意来电，具体安排以双方沟通为准。' : '我们会联系您，确认问题与服务安排。'}</p></header>${serviceProductSummary(ctx, order)}<section class="c-section"><ol class="c-timeline"><li class="is-done"><strong>申请已提交</strong><p>您的服务需求已收到。</p></li><li class="${confirmed ? 'is-done' : 'is-current'}"><strong>${confirmed ? '服务安排已确认' : '等待联系确认'}</strong><p>${confirmed ? e(`${order.confirmedDate || '日期待确认'} ${times[order.confirmedTime] || order.confirmedTime || '时段待确认'}`) : '问题、服务方式与时间将在联系后确认。'}</p></li><li class="is-next"><strong>${order.serviceType === 'remote-guidance' ? '提供使用指导' : '服务人员处理'}</strong><p>处理后可查看服务记录。</p></li><li class="is-next"><strong>服务完成</strong><p>处理结果将随进度更新。</p></li></ol></section><section class="c-section"><h3>申请详情</h3><dl class="c-details">${row('申请单号', order.id)}${row(order.serviceType === 'remote-guidance' ? '期望联系时间' : '期望上门时间', `${order.preferredDate || '未填写'} ${times[order.preferredTime] || order.preferredTime || ''}`)}${confirmed ? row('已确认时间', `${order.confirmedDate || '日期待确认'} ${times[order.confirmedTime] || order.confirmedTime || '时段待确认'}`) : ''}${row('问题 / 需求', order.description || '未补充其他说明')}${row('联系人', `${order.contactName || ''} · ${order.phone || ''}`)}${order.serviceType === 'remote-guidance' ? '' : row('使用地址', order.address || '待联系确认')}</dl></section>`;
        },
        footer: ctx => ctx.order ? '<button class="secondary" data-action="本次只演示客服联系入口，未发起真实通话。">联系客服</button><button class="primary" data-go="c-home">回到产品中心</button>' : '',
      },
      {
        id: 'c-evaluation', title: '评价历史服务', entry: 'C15 · 已完结指导评价示例',
        goal: '在真实完成节点之后收集评价，与当前申请状态分离，避免消费者误以为新申请已经完成。',
        note: '此页始终指向独立的虚构历史单 DEMO-HISTORY-0901，2026-09-01 已完结远程指导，不读取或改变当前活动单。评价提交只提供反馈，不写后端。',
        body: () => `<header class="c-page-heading"><h2>这次服务，感觉如何？</h2><p>您的反馈，会帮助我们把服务做得更好。</p></header><div class="c-history-summary"><span class="c-tag">历史服务 · 已完结</span><strong>智能坐便器 · 远程使用指导</strong><p>2026 年 9 月 1 日<br>DEMO-HISTORY-0901</p></div><form class="c-form"><fieldset class="c-rating"><legend>总体评价</legend><label><input type="radio" name="rating" value="5" checked><span>5 分</span></label><label><input type="radio" name="rating" value="4"><span>4 分</span></label><label><input type="radio" name="rating" value="3"><span>3 分</span></label><label><input type="radio" name="rating" value="2"><span>2 分</span></label><label><input type="radio" name="rating" value="1"><span>1 分</span></label></fieldset><label class="field"><span>更多感受 <em>选填</em></span><textarea name="feedback" rows="4" maxlength="500" placeholder="例如：沟通是否清楚，问题是否得到解答。"></textarea></label></form>`,
        footer: '<button class="primary" data-action="感谢您的反馈。已演示历史服务评价提交，未影响当前服务申请。">提交本次评价</button>',
      },
      {
        id: 'c-install', title: '安装服务', entry: '探索 · 消费者安装申请',
        goal: '消费者围绕已登记产品表达安装意向，支持一次选择同一地址的多件产品，并沿用联系、复核与回执步骤。',
        note: '安装是本轮体验探索，不计为已确认正式需求。至少选择一件产品，所选产品限定同一演示登记地址；是否合并工单、服务范围、费用与安装资格必须另行确认。本页不保证预约成功。',
        body: ctx => {
          const selected = field(ctx, 'installProducts', [item(ctx).id]);
          const ids = Array.isArray(selected) ? selected : [selected];
          return `${step(1)}<form id="c-install-form" class="c-form" data-submit-go="c-contact"><fieldset class="c-install-products"><legend>需要安装的产品 <em>至少选择 1 件</em></legend>${allProducts(ctx).map(p => `<label><input type="checkbox" name="installProducts" value="${e(p.id)}"${ids.includes(p.id) ? ' checked' : ''}><img src="${e(p.image)}" alt="${e(p.name)}"><span><strong>${e(p.name)}</strong><small>${e(p.model)}</small><small>${e(p.room)}</small></span></label>`).join('')}</fieldset><p class="c-hint">同一使用地址的产品可一起填写安装意向。</p><label class="field"><span>补充安装需求 <em>选填</em></span><textarea name="description" rows="3" maxlength="1000" placeholder="例如：产品是否已到家，现场是否已具备安装条件。">${e(field(ctx, 'description'))}</textarea></label><p class="c-info-note">具体服务安排、现场条件和相关事项，将在联系后确认。</p></form>`;
        },
        footer: '<button class="primary" type="submit" form="c-install-form">下一步：联系与时间</button>',
      },
      {
        id: 'c-welcome', title: '欢迎来到 TOTO', entry: 'C01 · 未登记产品空态', tab: 'c-home',
        goal: '没有产品时，用明确的登记入口建立第一步；保留了解服务的低门槛路径。',
        note: '这是未登记产品的评审空态。产品图片仅是品牌产品示意，不代表用户名下已有该产品；登记完成后再建立产品关系。查看空态本身不删除已登记的演示数据。',
        body: welcome,
      },
    ],
  };
})();
