/* v0.17: product-owned service home. All data and actions remain local prototype fixtures. */
(() => {
  if (window.TOTO_CONSUMER_VERSION !== '0.17') return;
  const app = window.TOTO_SCREENS.consumer;
  const home = app.screens.find(screen => screen.id === 'c-home');
  const e = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon = (name, folder = 'icons') => `<img src="assets/${folder}/${name}.svg" alt="" aria-hidden="true">`;
  const arrow = icon('entry-chevron');
  const help = () => `<nav class="pc-help" aria-label="服务与支持">
    <button data-ai="start"><span class="pc-help-icon pc-ai">${icon('robot-outline','brand-center')}</span><strong>智能助手</strong></button>
    <button data-go="c-outlets"><span class="pc-help-icon">${icon('map-marker-outline','brand-center')}</span><strong>服务网点</strong></button>
    <button data-go="c-customer-service"><span class="pc-help-icon">${icon('face-agent','brand-center')}</span><strong>联系客服</strong></button>
  </nav>`;
  function service(ctx) {
    if (ctx.order) {
      const status = {pending:'申请已收到',confirmed:'服务时间已确认',completed:'服务已完成',closed:'服务已办结',cancelled:'服务已取消'}[ctx.order.status] || '服务处理中';
      const confirmed = ctx.order.status === 'confirmed';
      return `<section class="pc-service pc-progress" aria-label="当前商品工单"><button class="pc-progress-action" data-product="${e(ctx.product.id)}" data-go="c-progress"><span><small>${e(ctx.order.serviceLabel || '售后')}服务</small><strong>${status}</strong>${confirmed ? `<span class="pc-appointment">${e(ctx.order.confirmedDate)} · ${e(ctx.order.confirmedTime)}</span>` : ''}</span><span class="pc-action-arrow">${arrow}</span></button></section>`;
    }
    const mode = ctx.product.homeServiceAction;
    const install = mode === 'install';
    const known = ['install','repair'].includes(mode);
    return `<section class="pc-service" aria-label="当前商品可用服务"><button class="pc-service-action" data-product="${e(ctx.product.id)}" ${known?`data-service-type="${mode}" data-go="${install?'c-install':'c-repair'}"`:'data-go="c-customer-service"'}><span class="pc-action-label">${icon(install?'install':known?'repair':'guidance')}<strong>${install?'预约安装':known?'申请维修':'咨询客服'}</strong></span><span class="pc-action-arrow">${arrow}</span></button></section>`;
  }
  function productCard(ctx, carousel=false) {
    const product=ctx.product;
    return `<section class="pc-product" aria-label="我的商品" ${carousel?'data-owned-carousel tabindex="0"':''}>
      <button class="pc-product-image" data-product="${e(product.id)}" data-go="c-product" aria-label="查看${e(product.name)}资料"><img src="${e(product.image)}" alt="${e(product.name)}" fetchpriority="high" draggable="false"></button>
      <div class="pc-product-info"><div><h2>${e(product.seriesId==='neorest'?'诺锐斯特 LS':product.name)}</h2><p>${e(product.model)}</p></div><button data-product="${e(product.id)}" data-go="c-product" aria-label="查看产品资料">${arrow}</button></div>${service(ctx)}</section>`;
  }
  function render(ctx) {
    const owned = !ctx.visitor && ctx.hasProducts && ctx.products.length;
    return `<div class="pc-home"><header class="pc-masthead"><span class="pc-wordmark" aria-label="TOTO">TOTO</span></header>
      ${owned ? `<div class="pc-product-toolbar"><h1>我的商品</h1><button data-go="c-register" aria-label="绑定商品">${icon('plus')}绑定</button></div>
      <nav class="pc-product-tabs" aria-label="切换我的商品">${ctx.products.map(p=>`<button data-product="${e(p.id)}" data-go="c-product-hub" aria-pressed="${p.id===ctx.product.id}">${e(p.room || '我的商品')} · ${e(p.name)}</button>`).join('')}</nav>
      ${productCard(ctx)}` : `<section class="pc-empty"><h1>我的 TOTO</h1><p>绑定商品，查看专属服务。</p><div class="pc-empty-actions"><button class="pc-primary" ${ctx.visitor?'data-brand-access="c-register"':'data-go="c-register"'}>绑定商品</button><button class="pc-secondary" data-go="c-brand-catalog">探索商品</button></div></section>`}
      ${help()}</div>`;
  }
  let summaryProductId = null;
  let summaryRanking = '';
  const activeOrder = order => order && !['completed','closed','cancelled'].includes(order.status);
  const productOrder = (ctx, product) => {
    const orders=ctx.serviceOrders.filter(order=>(order.productIds || [order.productId]).includes(product.id));
    return orders.find(activeOrder) || orders[0];
  };
  function summaryProducts(ctx) {
    const products=[...ctx.products].sort((a,b)=>Number(Boolean(activeOrder(productOrder(ctx,b))))-Number(Boolean(activeOrder(productOrder(ctx,a)))));
    const ranking=products.map(p=>`${p.id}:${Boolean(activeOrder(productOrder(ctx,p)))}`).join('|');
    if(ranking!==summaryRanking || !products.some(p=>p.id===summaryProductId)) {
      summaryRanking=ranking;summaryProductId=products[0]?.id || null;
    }
    return products;
  }
  function homeService(ctx) {
    const {order,product}=ctx;
    if (!order) {
      const mode=product.homeServiceAction;
      const known=['install','repair'].includes(mode);
      return `<button class="hc-service hc-service-idle" data-product="${e(product.id)}" ${known?`data-service-type="${mode}" data-go="${mode==='install'?'c-install':'c-repair'}"`:'data-go="c-customer-service"'}><strong>${mode==='install'?'预约安装':known?'申请维修':'咨询客服'}</strong>${arrow}</button>`;
    }
    const statuses={pending:'待确认时间',confirmed:'时间已确认',completed:'已完成',closed:'已办结',cancelled:'已取消'};
    const status=order.status==='confirmed' && (!order.confirmedDate || !order.confirmedTime)?'待确认时间':statuses[order.status] || '处理中';
    return `<button class="hc-service" data-product="${e(product.id)}" data-go="c-progress"><strong>${e(order.serviceLabel || '售后')}服务</strong><span class="hc-service-divider" aria-hidden="true"></span><span class="hc-service-status">${status}</span>${arrow}</button>`;
  }
  function homeProductCard(ctx) {
    const product=ctx.product;
    return `<section class="hc-product" data-owned-carousel tabindex="0" aria-label="我的商品"><button class="hc-product-summary" data-product="${e(product.id)}" data-go="c-product" aria-label="查看${e(product.name)}资料"><span class="hc-product-visual"><img src="${e(product.image)}" alt="${e(product.name)}" draggable="false"></span><span class="hc-product-info">${product.room?`<small>${e(product.room)}</small>`:''}<strong>${e(product.seriesId==='neorest'?'诺锐斯特 LS':product.name)}</strong><span>${e(product.model)}</span></span>${arrow}</button>${homeService(ctx)}</section>`;
  }
  function summary(ctx) {
    if(ctx.visitor || !ctx.hasProducts || !ctx.products.length) return `<section class="ex-bind"><h2>我的商品</h2><p>绑定您的 TOTO，享受专属服务</p><div class="ex-bind-actions"><button class="ex-bind-primary" ${ctx.visitor?'data-brand-access="c-register"':'data-go="c-register"'}>绑定商品</button><button class="ex-bind-secondary" data-go="c-brand-catalog">探索商品</button></div></section>`;
    const products=summaryProducts(ctx);
    const index=products.findIndex(p=>p.id===summaryProductId);
    const product=products[index];
    const selectedContext={...ctx,product,order:productOrder(ctx,product)};
    return `<section class="ex-owned ex-product-home" aria-label="我的商品"><div class="ex-heading"><h2>我的商品</h2><button data-go="c-register" aria-label="绑定商品">${icon('plus')}绑定</button></div>
      ${products.length>1?`<nav class="ex-product-tabs" aria-label="切换商品">${products.map((p,i)=>`<button data-home-product="${e(p.id)}" aria-label="查看第 ${i+1} 件商品：${e(p.name)}" aria-pressed="${i===index}">${e(p.name)}</button>`).join('')}</nav>`:''}
      ${homeProductCard(selectedContext)}</section>`;
  }
  function explore(ctx) {
    return `<div class="pc-home ex-home"><header class="pc-masthead"><span class="pc-wordmark" aria-label="TOTO">TOTO</span></header>
      <button class="ex-banner" data-go="c-brand-story" aria-label="探索 TOTO 品牌与生活"><img src="assets/brand-center/neorest-nx-space.jpg" alt="TOTO 诺锐斯特卫浴空间"><span><strong>让舒适，融入日常。</strong><small>探索 TOTO ${arrow}</small></span></button>
      <nav class="ex-help" aria-label="服务与支持"><button class="ex-assistant" data-ai="start"><span><strong>智能助手</strong><small>使用问题，随时问</small></span><img src="assets/help-icons/assistant-purple-v1.png" alt=""></button><button class="ex-outlets" data-go="c-outlets"><span><strong>服务网点</strong><small>查找附近网点</small></span><span class="ex-map-pin" aria-hidden="true">${icon('map-marker-outline','brand-center')}</span></button></nav>
      ${summary(ctx)}
      <div class="ex-contact"><button data-go="c-customer-service">${icon('face-agent','brand-center')}<span>联系客服</span>${arrow}</button></div></div>`;
  }
  const productHub = {id:"c-product-hub",tab:"c-product-hub"};
  Object.assign(productHub,{title:'我的商品 · 产品页方案',entry:'C01 · 产品页保留方案 v0.17',nav:'immersive',
    goal:'以浅灰页面、银灰商品展示面和深蓝服务区建立层次，卡片下方安装、维修及工单状态区统一为 84px 高度；去掉口号、英文眉题、重复说明与装饰进度条。绑定商品是首页中心：先选择商品，再查看该商品工单；无工单时仅显示安装或维修一项服务。下方固定智能助手、服务网点、联系客服三个入口。',
    note:'v0.17 新增方案，旧版保持。默认商品一演示待安装、商品二演示维修，可在右侧切到“无工单 · 维修”与工单场景。安装／维修使用独立演示字段，不推断安装码或保修权益。联系客服沿用人工联系抽屉，不创建投诉记录。仅 HTML 原型，未改正式小程序。',body:render});
  app.screens.splice(1,0,productHub);
  app.tabs=[{label:'探索',go:'c-home',icon:'home'},{label:'服务',go:'c-service',icon:'service'},{label:'我的',go:'c-mine',icon:'mine'}];
  Object.assign(home,{title:'探索 TOTO',entry:'C01 · 探索首页 v0.17',nav:'immersive',
    goal:'保留 Banner 与并排助手／网点。商品改为白色圆角卡，左侧浅灰小图、右侧房间与名称型号；下方以一行浅色入口展示服务类型和简短状态，点击查看详情；详细进度由独立服务页承接。游客及未绑定时使用上下排列的 48px 标准通栏绑定／探索按钮，卡片按内容自然高度排列，不拉伸填满剩余空间。商品卡上方展示名称切换标签，仍支持滑动；适度放大 Banner、帮助入口和商品图片，并用弹性留白让联系客服靠近底部。原服务页和产品页方案保留供比较。',
    note:'底部为探索／服务／我的；服务页沿用原样式。工作台另保留产品页方案及其产品 Tab 预览，尚未确定最终第二 Tab。首页和产品页共用商品及工单数据；首页采用新的轻量卡片，产品页保留原方案。未接真实业务。',body:explore});
  const mine=app.screens.find(screen=>screen.id==='c-mine');
  const mineBody=mine.body;
  mine.body=ctx=>mineBody(ctx)+(ctx.visitor?'':`<section class="c-section"><button class="c-menu-row" data-go="c-service"><span>服务记录</span>${arrow}</button></section>`);
  mine.note='个人资料、购买与服务记录在此访问；当前商品操作可从首页与保留产品页访问。';
  window.TOTO_PERSONAL_HOME = {
    selectProduct(ctx, id) {
      if(ctx.visitor || !ctx.hasProducts || !summaryProducts(ctx).some(p=>p.id===id) || summaryProductId===id) return false;
      summaryProductId=id;return true;
    },
    switchProduct(ctx, step) {
      if(ctx.visitor || !ctx.hasProducts || ![-1,1].includes(step)) return false;
      const products=summaryProducts(ctx),index=products.findIndex(p=>p.id===summaryProductId),next=products[index+step];
      if(!next) return false;
      summaryProductId=next.id;return true;
    },
    seed(products, scenario) { summaryProductId=null;summaryRanking='';products.forEach((product,index)=>{product.homeServiceAction=scenario==='installed'||index>0?'repair':'install';}); },
  };
})();
