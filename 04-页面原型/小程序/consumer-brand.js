/* Consumer v0.14 exploration only. Existing service flows and older versions stay intact. */
(() => {
  if (window.TOTO_CONSUMER_VERSION !== '0.14') return;

  const app = window.TOTO_SCREENS.consumer;
  const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const publicProducts = [
    {id:'t01', category:'智能坐便器', name:'诺锐斯特 LS', model:'CES8G820GCN', image:'assets/product-toilet.jpg', intro:'为日常空间带来简洁、完整的卫浴体验。', highlight:'从外观到使用感受，细节保持统一。'},
    {id:'b02', category:'洗面器', name:'台下式洗面器', model:'LW1535B', image:'assets/product-basin.jpg', intro:'让洗漱空间回到清爽、从容的日常。', highlight:'以利落形态融入不同的空间搭配。'},
  ];
  const state = {selected:'t01',category:'全部',query:'',pending:'c-register'};
  const selectedProduct = () => publicProducts.find(product => product.id === state.selected) || publicProducts[0];
  const publicProductCard = product => `<button class="brand-product-card" data-brand-product="${e(product.id)}" aria-label="查看${e(product.name)}产品介绍"><span class="brand-product-image"><img src="${e(product.image)}" alt="${e(product.name)}产品外观示意"></span><span class="brand-product-copy"><small>${e(product.category)}</small><strong>${e(product.name)}</strong><span>${e(product.model)} <i aria-hidden="true">↗</i></span></span></button>`;
  const sectionTitle = (eyebrow,title,action,go) => `<div class="brand-section-heading"><div><span>${e(eyebrow)}</span><h2>${e(title)}</h2></div>${action?`<button data-go="${e(go)}">${e(action)} <i aria-hidden="true">↗</i></button>`:''}</div>`;
  const scene = `<img class="brand-scene-image" src="assets/product-bathtub-scene.jpg" alt="简洁宁静的浴室空间示意">`;
  const publicHome = ctx => `<div class="brand-home">
    <header class="brand-intro"><span class="brand-wordmark">TOTO</span><p>以水为始 · 让日常更舒适</p><h1>让舒适，<br>从每一天开始。</h1><div class="brand-intro-actions"><button class="brand-main-link" data-go="c-brand-catalog">探索产品 <span aria-hidden="true">↗</span></button><button class="brand-quiet-link" data-go="c-brand-story">了解 TOTO <span aria-hidden="true">›</span></button></div></header>
    <button class="brand-scene" data-go="c-brand-story" aria-label="了解 TOTO 的生活理念">${scene}<span>洁净与舒适的生活想象 <i aria-hidden="true">↗</i></span></button>
    <section class="brand-home-section">${sectionTitle('SELECTED PRODUCTS','精选产品','查看全部','c-brand-catalog')}<div class="brand-product-grid">${publicProducts.map(publicProductCard).join('')}</div></section>
    <section class="brand-home-section brand-story-teaser">${sectionTitle('TOTO JOURNAL','关于更好的日常','','')}<p>从洁净、空间与使用体验出发，了解产品背后的思考。</p><button data-go="c-brand-story">阅读品牌故事 <span aria-hidden="true">↗</span></button></section>
    <section class="brand-owned-prompt"><div><small>${ctx.visitor?'已经在使用 TOTO？':'我的产品'}</small><strong>${ctx.visitor?'把产品加入我的产品':'尚未关联产品'}</strong><p>${ctx.visitor?'之后可查看自己的产品和服务。':'购买数据可能尚未同步，也可以扫码或手动添加。'}</p></div><button data-brand-access="c-register">添加产品 <span aria-hidden="true">›</span></button></section>
    <div class="brand-home-utility"><button data-go="c-outlets">查找门店 <span aria-hidden="true">↗</span></button><button data-go="c-customer-service">联系 TOTO <span aria-hidden="true">↗</span></button></div>
  </div>`;
  const memberExtra = `<section class="brand-member-discover">${sectionTitle('DISCOVER TOTO','探索更多','','')}<button class="brand-member-story" data-go="c-brand-catalog">${scene}<span><small>精选产品与生活灵感</small><strong>让熟悉的空间，<br>拥有更多可能。</strong><i>探索产品 ↗</i></span></button><button class="brand-member-journal" data-go="c-brand-story">了解 TOTO 的洁净与舒适理念 <span aria-hidden="true">↗</span></button></section>`;
  const serviceLinks = `<div class="brand-service-links"><button data-go="c-brand-guide"><strong>使用与养护</strong><span>查找适合产品的资料 <i aria-hidden="true">↗</i></span></button><button data-go="c-outlets"><strong>查找服务网点</strong><span>了解附近的服务入口 <i aria-hidden="true">↗</i></span></button><button data-go="c-customer-service"><strong>联系 TOTO</strong><span>电话或微信在线客服 <i aria-hidden="true">↗</i></span></button></div>`;
  const publicService = ctx => `<div class="brand-service-home"><header class="brand-service-intro"><small>SERVICE & SUPPORT</small><h2>需要帮助时，<br>从这里开始。</h2><p>无论是否已经关联产品，都可以查找门店与客服。</p></header><section class="brand-service-primary"><span>${ctx.visitor?'拥有 TOTO 产品？':'尚未关联产品'}</span><h3>添加产品，获得更贴合的服务</h3><p>${ctx.visitor?'登录后可同步购买记录、扫码或辅助添加。':'您可能已有未同步的购买记录；也可扫码或辅助添加。'}</p><button data-brand-access="c-register">添加我的产品 <i aria-hidden="true">↗</i></button></section>${sectionTitle('SERVICE MENU','服务入口','','')}${serviceLinks}</div>`;
  const guestMine = `<div class="brand-guest-mine"><header><span class="brand-wordmark">TOTO</span><h2>为你的产品，<br>留一处安心的位置。</h2><p>登录后查看自己的产品、购买记录与服务进度。</p><button data-brand-access="c-products">登录查看我的产品 <span aria-hidden="true">↗</span></button></header><section><button data-go="c-brand-catalog">探索产品 <span aria-hidden="true">›</span></button><button data-go="c-outlets">查找门店 <span aria-hidden="true">›</span></button><button data-go="c-customer-service">联系 TOTO <span aria-hidden="true">›</span></button></section><p>浏览产品和服务信息，无需先登录。</p></div>`;

  const originalHome = app.screens.find(screen => screen.id === 'c-home');
  const originalService = app.screens.find(screen => screen.id === 'c-service');
  const originalMine = app.screens.find(screen => screen.id === 'c-mine');
  const homeBody = originalHome.body;
  const serviceBody = originalService.body;
  const mineBody = originalMine.body;
  Object.assign(originalHome, {
    title:'TOTO 产品与服务', entry:'C01 · 品牌产品与服务首页 · 方案评审',
    goal:'已关联产品时先呈现本人产品和服务；游客与未关联产品者先浏览精选产品，随时可进入添加产品、门店或客服。',
    note:'品牌产品与内容均为原型示意，尚未形成正式发布资料或新需求编号。“尚未关联”不等于“未购买”；切换右侧场景可对比游客、未关联与有产品首页。v0.13 保留原售后首页供对照。',
    body: ctx => ctx.visitor || !ctx.hasProducts ? publicHome(ctx) : `${homeBody(ctx)}${memberExtra}`,
  });
  Object.assign(originalService, {
    goal:'游客也能直接找到公共服务；有产品时优先跟进当前服务，并保留产品、使用资料、网点和客服入口。',
    note:'游客和未关联产品者不生成本人服务数据。添加产品时模拟登录引导；已有产品和工单继续沿用 v0.13 的原型服务状态与交互。',
    body: ctx => ctx.visitor || !ctx.hasProducts ? publicService(ctx) : `${serviceBody(ctx)}<section class="brand-member-service">${sectionTitle('MORE SUPPORT','使用与帮助','','')}${serviceLinks}</section>`,
  });
  Object.assign(originalMine, {
    goal:'游客可以先了解产品与公共服务；登录后查看个人产品、记录与账户信息。',
    note:'游客视图不显示虚构的本人手机号、购买或服务记录。已登录视图沿用现有“我的”业务入口；公开产品浏览不要求登录。',
    body: ctx => ctx.visitor ? guestMine : mineBody(ctx),
  });

  const brandScreens = [
    {
      id:'c-brand-catalog', title:'探索产品', entry:'新增建议 · 公开产品浏览', parent:'c-home',
      goal:'按产品类别和关键词找到感兴趣的产品，再进入独立的公开产品介绍。',
      note:'仅展示两件原型样品；真实上线需要经品牌审核的公开商品资料。这里的浏览不建立本人关系，也不证明购买。',
      body: () => { const list=publicProducts.filter(product => (state.category==='全部'||product.category===state.category) && `${product.name} ${product.model} ${product.category}`.toLowerCase().includes(state.query.toLowerCase())); return `<div class="brand-catalog"><header><small>PRODUCTS</small><h2>探索产品</h2><p>从空间与需要出发，慢慢找到适合自己的选择。</p></header><form data-brand-search class="brand-search"><input name="brandQuery" value="${e(state.query)}" placeholder="搜索产品或品番" aria-label="搜索产品或品番"><button type="submit" aria-label="搜索">⌕</button></form><div class="brand-filters" aria-label="按类别筛选">${['全部','智能坐便器','洗面器'].map(category=>`<button data-brand-category="${e(category)}" aria-pressed="${state.category===category}">${e(category)}</button>`).join('')}</div><div class="brand-catalog-grid">${list.length?list.map(publicProductCard).join(''):'<div class="brand-no-results"><strong>没有找到对应产品</strong><p>试试其他关键词或类别。</p><button data-brand-category="全部">查看全部产品</button></div>'}</div><p class="brand-catalog-note">当前展示内容仅供原型评审。</p></div>`; },
    },
    {
      id:'c-brand-product', title:'产品介绍', entry:'新增建议 · 公开产品详情', parent:'c-brand-catalog',
      goal:'用一张清晰产品图、简短介绍和明确的门店／咨询入口帮助用户了解产品。',
      note:'公开介绍与本人产品档案分开。产品图与型号只供原型评审，功能、参数、价格和服务权益没有在此确认；“添加我的产品”仍进入原有核验流程。',
      body: () => { const product=selectedProduct(); return `<article class="brand-detail"><p class="brand-detail-path">产品探索 / ${e(product.category)}</p><div class="brand-detail-image"><img src="${e(product.image)}" alt="${e(product.name)}产品外观示意"></div><div class="brand-detail-title"><small>${e(product.category)}</small><h2>${e(product.name)}</h2><span>品番 ${e(product.model)}</span></div><p class="brand-detail-intro">${e(product.intro)}</p><section class="brand-detail-copy"><span>DESIGN & EVERYDAY</span><h3>${e(product.highlight)}</h3><p>以产品、空间和使用感受为线索，了解这件产品如何融入日常生活。</p></section><div class="brand-detail-actions"><button class="primary" data-go="c-outlets">查找门店</button><button class="secondary" data-go="c-customer-service">咨询产品</button></div><button class="brand-owned-link" data-brand-access="c-register">已经拥有这件产品？添加到我的产品 <i aria-hidden="true">↗</i></button><p class="brand-detail-footnote">图片与文字为原型示意；正式产品信息以审核发布版本为准。</p></article>`; },
    },
    {
      id:'c-brand-story', title:'品牌与生活', entry:'新增建议 · 品牌内容', parent:'c-home',
      goal:'用一个简洁的空间场景和少量文字传达洁净、舒适的品牌方向，再自然连接产品与服务。',
      note:'内容、图片及措辞为评审示意，不代表已获品牌发布审核；首阶段只保留少量精选内容，不形成资讯流或活动弹窗。',
      body: () => `<article class="brand-story"><header><small>TOTO JOURNAL</small><h2>让每一天的<br>洁净与舒适，自然发生。</h2><p>生活的质感，常在那些习以为常的片刻里。</p></header><figure>${scene}<figcaption>卫浴空间场景示意</figcaption></figure><div class="brand-story-copy"><p>从清晨的洗漱，到一天结束时的放松，空间与产品共同承接着日常的节奏。</p><p>我们希望以克制的设计、清晰的使用体验，让这些时刻更从容。</p></div><div class="brand-story-actions"><button data-go="c-brand-catalog">探索精选产品 <span aria-hidden="true">↗</span></button><button data-go="c-outlets">查找附近门店 <span aria-hidden="true">↗</span></button></div></article>`,
    },
    {
      id:'c-brand-guide', title:'使用与养护', entry:'新增建议 · 产品使用资料入口', parent:'c-service',
      goal:'将产品使用资料与售后帮助放在同一处，资料不足时直接引导联系人工。',
      note:'本页只演示入口层级，不虚构具体型号的维修、拆装、保养步骤或服务权益；真实资料需逐品番审核与发布。',
      body: ctx => `<div class="brand-guide"><header><small>CARE & SUPPORT</small><h2>让产品，<br>陪伴更长久。</h2><p>查找适合产品的资料；遇到问题，可以随时获得帮助。</p></header><div class="brand-guide-menu"><button ${ctx.visitor?'data-brand-access="c-products"':'data-go="c-products"'}><span>01</span><strong>我的产品资料</strong><small>从已关联产品查看对应信息</small><i aria-hidden="true">↗</i></button><button data-go="c-brand-catalog"><span>02</span><strong>探索产品</strong><small>了解公开产品介绍</small><i aria-hidden="true">↗</i></button><button data-go="c-ai-assistant"><span>03</span><strong>智能售后助手</strong><small>描述问题，或直接联系人工</small><i aria-hidden="true">↗</i></button></div><button class="brand-guide-contact" data-go="c-customer-service">需要人工帮助？联系 TOTO <span aria-hidden="true">↗</span></button></div>`,
    },
    {
      id:'c-brand-access', title:'登录后继续', entry:'方案评审 · 私人功能访问提示', parent:'c-home',
      goal:'在用户主动访问本人产品或服务时解释登录用途；公开浏览保持开放。',
      note:'登录按钮只模拟原型状态，不采集真实微信身份、手机号或购买资料。正式授权与产品自动关联仍按已有功能契约设计。',
      body: () => `<div class="brand-access"><span class="brand-wordmark">TOTO</span><h2>继续了解你的产品</h2><p>登录后，才会查看与你有关的产品、购买记录和服务进度。浏览公开产品与品牌内容无需登录。</p><button class="primary" data-brand-login>模拟登录并继续</button><button class="brand-quiet-link" data-go="c-home">先浏览产品</button><small>本页仅演示入口与说明，不执行真实身份授权。</small></div>`,
    },
  ];
  app.screens.splice(1,0,...brandScreens);

  window.TOTO_BRAND = {
    reset(){Object.assign(state,{selected:'t01',category:'全部',query:'',pending:'c-register'});},
    handle(el,{context,render,showScreen,showToast,simulateLogin}){
      if (el.dataset.brandProduct) {state.selected=el.dataset.brandProduct;showScreen('c-brand-product');return true;}
      if (el.dataset.brandCategory) {state.category=el.dataset.brandCategory;state.query='';render();return true;}
      if (el.dataset.brandAccess) {state.pending=el.dataset.brandAccess;showScreen(context.visitor?'c-brand-access':state.pending);return true;}
      if ('brandLogin' in el.dataset) {simulateLogin();showScreen(state.pending || 'c-register');showToast('已模拟登录，可继续体验私人产品入口。');return true;}
      return false;
    },
    submit(form,{render}){
      if (!form.hasAttribute('data-brand-search')) return false;
      state.query=String(form.elements.namedItem('brandQuery')?.value || '').trim();
      render();
      return true;
    },
  };
})();
