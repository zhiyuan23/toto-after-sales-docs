'use strict';
/* Consumer prototype v0.12. The v0.11 screen definitions remain untouched in consumer.js. */
(() => {
  if (window.TOTO_CONSUMER_VERSION !== '0.12') return;
  const app = window.TOTO_SCREENS.consumer;
  const old = Object.fromEntries(app.screens.map(screen => [screen.id, screen]));
  const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const product = ctx => ctx.product || app.products[0];
  const products = ctx => ctx.products || [];
  const reg = ctx => ctx.registration || {};
  const info = ctx => product(ctx)?.registration || ctx.registered || {};
  const phoneMask = value => String(value || '').replace(/^(\d{3})\d{4}(\d{4})$/, '$1****$2');
  const row = (label, value) => `<div class="c-detail-row"><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`;
  const typeNames = {repair:'维修服务','remote-guidance':'远程使用指导','onsite-guidance':'上门使用指导'};
  const timeNames = {morning:'上午 09:00—12:00',afternoon:'下午 14:00—17:00',any:'时间均可，联系确认'};
  const registrationMethods = {manual:'手动添加','product-code':'扫码识别','scan-unique':'扫码添加','scan-credential':'购买凭证添加','existing-record':'手机号同步'};
  const contextCard = ctx => `<div class="c-product-context"><img src="${e(product(ctx).image)}" alt="${e(product(ctx).name)}"><div><span>本次服务产品</span><strong>${e(product(ctx).name)}</strong><p>${e(product(ctx).room)} · ${e(product(ctx).model)}</p></div></div>`;

  function home(ctx) {
    if (ctx.hasProducts === false) return `<section class="v12-empty v12-home-empty"><span class="v12-eyebrow">我的 TOTO</span><h2>添加产品，<br>售后服务更简单</h2><p>可先用购买时的手机号自动找回，也可直接扫码添加。</p><img src="${e(product(ctx).image)}" alt="TOTO 产品示意"><button class="primary" data-phone-sync>手机号同步产品</button><button class="secondary" data-go="c-register">扫码或手动添加</button><button class="c-text-button" data-go="c-support">暂时找不到产品？联系我们</button></section>`;
    const p=product(ctx), order=ctx.order;
    return `<section class="v12-home"><div class="v12-home-top"><span class="v12-eyebrow">${e(p.room || '我的产品')}</span><button class="c-text-button" data-go="c-products">${products(ctx).length} 件产品 ›</button></div><button class="v12-product-stage" data-go="c-product" aria-label="查看${e(p.name)}资料"><span class="v12-status ${p.ownershipStatus==='pending-verification'?'is-pending':''}">${p.ownershipStatus==='pending-verification'?'待核验':'已关联'}</span><h2>${e(p.name)}</h2><p>${e(p.model)}</p><img src="${e(p.image)}" alt="${e(p.name)} ${e(p.model)}"><span class="v12-detail-link">查看产品资料 ›</span></button>${order?`<button class="v12-order-card" data-go="c-progress"><span><small>${e(typeNames[order.serviceType] || '售后服务')}</small><strong>${order.status==='confirmed'?'服务时间已确认':'等待联系确认'}</strong></span><span>查看进度 ›</span></button>`:'<p class="v12-assurance">暂无进行中的服务</p>'}<div class="v12-primary-stack"><button class="primary" data-service-type="repair" data-go="c-repair">申请售后服务</button><button class="secondary" data-service-type="remote-guidance" data-go="c-repair">需要使用指导</button></div><div class="v12-link-row"><button data-go="c-register">＋ 添加产品</button><button data-go="c-support">联系我们</button></div></section>`;
  }

  function service(ctx) {
    const orders=ctx.serviceOrders || [];
    if (!orders.length) return `<header class="v12-page-head"><span class="v12-eyebrow">服务</span><h2>有需要时，<br>我们随时在这里</h2><p>提交申请后，可在这里查看联系与处理进度。</p></header><section class="v12-empty"><button class="primary" data-go="${ctx.hasProducts===false?'c-register':'c-products'}">${ctx.hasProducts===false?'先添加产品':'选择产品申请服务'}</button></section>${serviceLinks()}`;
    return `<header class="v12-page-head"><span class="v12-eyebrow">我的服务</span><h2>进行中 ${orders.length} 项</h2><p>最新状态与下一步集中展示。</p></header><div class="v12-service-list">${orders.map(order=>{const p=products(ctx).find(item=>item.id===order.productId);const confirmed=order.status==='confirmed';return `<article class="v12-service-card"><div class="v12-service-meta"><span>${e(typeNames[order.serviceType] || '售后服务')}</span><small>${e(order.id)}</small></div><h3>${confirmed?'时间已确认':'等待联系确认'}</h3><div class="v12-service-product">${p?`<img src="${e(p.image)}" alt="${e(p.name)}">`:''}<span><strong>${e(p?.name || order.productName)}</strong><small>${confirmed?`${e(order.confirmedDate || '')} ${e(timeNames[order.confirmedTime] || order.confirmedTime || '')}`:'请留意来电，暂无需重复提交'}</small></span></div><button class="primary" data-product="${e(order.productId)}" data-go="c-progress">查看完整进度</button></article>`;}).join('')}</div>${serviceLinks(true)}`;
  }
  const serviceLinks = withNew => `<section class="v12-menu-section">${withNew?'<button class="c-menu-row" data-go="c-products"><span>申请新服务</span><span>›</span></button>':''}<button class="c-menu-row" data-go="c-outlets"><span>查找授权门店与维修网点</span><span>›</span></button><button class="c-menu-row" data-go="c-support"><span>联系 TOTO</span><span>›</span></button><button class="c-menu-row" data-go="c-evaluation"><span>历史服务与评价</span><span>›</span></button></section>`;

  function mine(ctx) {
    return `<header class="c-profile v12-profile">${window.TOTO_ACCOUNT.avatarMarkup(ctx.profile?.avatar)}<div><h2>${e(ctx.profile?.userName || '陈女士')}</h2><p>${e(phoneMask(ctx.profile?.phone || '13800000026'))}</p></div><button class="c-text-button" data-go="c-profile">编辑 ›</button></header><section class="v12-menu-section"><button class="c-menu-row" data-go="c-purchases"><span>购买记录</span><span>›</span></button><button class="c-menu-row" data-go="c-preferences"><span>个性化与消息设置</span><span>›</span></button></section><section class="v12-menu-section"><button class="c-menu-row" data-go="c-privacy"><span>隐私与账户</span><span>›</span></button><button class="c-menu-row" data-go="c-support"><span>帮助与客服</span><span>›</span></button></section><p class="c-brand-signoff">TOTO · 舒适，与您长久相伴</p>`;
  }

  function register(ctx) {
    const r=reg(ctx), selected=r.selectedProducts?.[0];
    if (['matched-instance','matched-purchase','owned'].includes(r.lookupStatus) && selected) return `<header class="v12-page-head"><span class="v12-status">识别成功</span><h2>${r.lookupStatus==='owned'?'这件产品已添加':'找到产品'}</h2><p>${e(r.codeType || '产品编码')} 已通过演示校验。</p></header>${registrationCard(selected)}<dl class="c-details">${row('识别编码',r.productCode)}${row('关联方式',r.lookupStatus==='matched-purchase'?'购买凭证':'可信产品标识')}</dl><button class="c-text-button" data-scan-reset>换一个编码</button>`;
    if (r.lookupStatus==='matched-model' && selected) return `<header class="v12-page-head"><span class="v12-status is-pending">已识别型号</span><h2>再确认购买信息</h2><p>普通商品码只能确认型号，保存后将标记为待核验。</p></header>${registrationCard(selected)}<button class="primary" data-go="c-purchase">继续确认信息</button><button class="c-text-button" data-scan-reset>重新识别</button>`;
    return `<header class="v12-page-head"><span class="v12-eyebrow">添加产品</span><h2>${r.lookupStatus==='not-found'?'暂未识别，请重试':'扫一下，自动识别'}</h2><p>不用分辨产品码、SN 或购买凭证码。</p></header><button class="v12-scan-button" data-code-example="valid"><span data-icon="camera" aria-hidden="true"></span><strong>扫一扫</strong><small>对准产品、包装或凭证上的完整编码</small></button><div class="c-divider-label"><span>也可手动输入</span></div><form id="c-product-code-form" class="c-form" data-submit-go="c-register"><label class="field"><span>产品编码 <em>必填</em></span><input name="productCode" value="${e(r.productCode)}" placeholder="请输入完整编码" maxlength="80" autocomplete="off" required></label><button class="primary" type="submit">识别编码</button></form><details class="v12-help"><summary>编码在哪里？</summary><p>可在产品标签、外包装或购买凭证上查找。若仍无法识别，可手动选择产品。</p></details><button class="secondary" data-reg-method="manual">没有编码，手动选择</button><details class="c-code-examples"><summary>演示状态</summary><div><button data-code-example="valid">可信 SN</button><button data-code-example="credential">购买凭证</button><button data-code-example="model">普通商品码</button><button data-code-example="not-found">无结果</button></div></details>`;
  }
  const registrationCard = selected => `<section class="v12-registration-card"><img src="${e(selected.image)}" alt="${e(selected.name)}"><div><strong>${e(selected.name)}</strong><p>${e(selected.model)}</p></div></section>`;

  function purchase(ctx) {
    const r=reg(ctx), selected=r.selectedProducts?.[0];
    if (!selected) return '<div class="v12-empty"><h2>请先选择产品</h2><button class="primary" data-go="c-manual-select">返回选择</button></div>';
    const max=new Date().toLocaleDateString('en-CA');
    return `<div class="c-step-label">手动添加 · 第 2 步 / 共 2 步</div>${registrationCard(selected)}<form id="c-purchase-form" class="c-form" data-submit-go="c-product"><label class="field"><span>购买日期 <em>必填</em></span><input name="purchaseDate" type="date" max="${max}" value="${e(r.purchaseDate)}" required></label><label class="field"><span>姓名 <em>必填</em></span><input name="userName" value="${e(r.userName)}" maxlength="30" autocomplete="off" required></label><label class="field"><span>使用方式 <em>必填</em></span><select name="useType" required><option value="self"${r.useType!=='friend'?' selected':''}>自己使用</option><option value="friend"${r.useType==='friend'?' selected':''}>为亲友购买</option></select></label><label class="field"><span>使用地区 <em>必填</em></span><select name="region" required><option value="">请选择地区</option><option value="示例省 / 示例市 / 示例区"${r.region?' selected':''}>示例省 / 示例市 / 示例区</option></select></label><label class="field"><span>详细地址 <em>必填</em></span><input name="address" value="${e(r.address)}" maxlength="200" required></label><label class="c-consent"><input type="checkbox" name="privacyConsent"${r.privacyConsent?' checked':''} required><span>我确认以上信息，并同意用于产品档案与服务联系。</span></label></form>`;
  }

  function productDetail(ctx) {
    const p=product(ctx), i=info(ctx), added=Boolean(ctx.registrationReceipt);
    return `${added?`<div class="v12-success"><span data-icon="check"></span><strong>${ctx.registrationReceipt.alreadyOwned?'产品已在您的列表中':'产品已添加'}</strong><p>${ctx.registrationReceipt.alreadyOwned?'未重复创建产品档案。':'现在可查看资料或申请服务。'}</p></div>`:''}<header class="c-product-heading"><p>${e(p.room || '我的产品')} · ${e(p.sourceLabel || '已关联')}</p><h2>${e(p.name)}</h2><span>${e(p.model)}</span></header><div class="c-product-stage is-small"><img src="${e(p.image)}" alt="${e(p.name)}"></div><section class="c-section"><h3>产品信息</h3><dl class="c-details">${row('型号',p.model)}${row('添加方式',registrationMethods[i.method] || p.sourceLabel || '已有记录')}${row('购买日期',i.purchaseDate || '未提供')}${row('资料状态',p.ownershipStatus==='pending-verification'?'已添加，待核验':'已关联')}${p.installationCodeLinked?row('关联安装码',p.installationCode):''}</dl><p class="c-info-note">产品已添加不等于免费服务；具体资格将在申请时核验。</p></section>${ctx.order?`<button class="v12-order-card" data-go="c-progress"><strong>查看进行中的服务</strong><span>›</span></button>`:''}`;
  }

  function contact(ctx) {
    const oldMarkup=old['c-contact'].body(ctx)
      .replace('第 2 步 / 共 3 步','第 2 步 / 共 2 步')
      .replace('data-submit-go="c-confirm"','data-submit-go="c-submit-result"')
      .replace('</form>',`<section class="v12-review"><h3>提交前确认</h3><p>${e(typeNames[ctx.serviceType] || '售后服务')} · ${e(product(ctx).name)}</p><small>期望时间仍需服务人员联系确认。</small></section><label class="c-consent"><input type="checkbox" name="privacyConsent" required><span>我同意将以上信息用于本次服务联系与处理。</span></label></form>`);
    return oldMarkup;
  }

  const support = () => `<header class="v12-page-head"><span class="v12-eyebrow">帮助与客服</span><h2>我们可以怎样帮您？</h2><p>查询产品、编码或服务进度前，建议先准备购买凭证与产品信息。</p></header><section class="v12-menu-section"><button class="c-menu-row" data-action="官方客服电话待正式配置，本原型不发起拨号。"><span><strong>电话客服</strong><small>官方号码待配置</small></span><span>›</span></button><button class="c-menu-row" data-action="微信客服通道待接入，本原型不发送真实消息。"><span><strong>微信客服</strong><small>在线通道待接入</small></span><span>›</span></button><button class="c-menu-row" data-go="c-outlets"><span><strong>门店与维修网点</strong><small>按地区查找示例网点</small></span><span>›</span></button></section><section class="c-section"><h3>常见问题</h3><details class="v12-help"><summary>产品编码在哪里？</summary><p>可在产品标签、外包装或购买凭证上查找。</p></details><details class="v12-help"><summary>找不到购买记录怎么办？</summary><p>可尝试手机号同步，或准备凭证后联系购买门店与客服。</p></details></section>`;
  const privacy = () => `<header class="v12-page-head"><span class="v12-eyebrow">隐私与账户</span><h2>您的信息，由您掌控</h2><p>查看信息用途、同意记录与账户处理入口。</p></header><section class="v12-menu-section"><button class="c-menu-row" data-action="正式隐私政策文本待业务与法务确认。"><span>隐私政策</span><span>当前版本 ›</span></button><button class="c-menu-row" data-action="同意记录与生效时间待真实接口提供。"><span>授权与同意记录</span><span>›</span></button></section><section class="v12-danger"><h3>账户管理</h3><button data-action="撤回授权需要二次确认并说明影响；本原型不改变真实状态。">管理或撤回授权</button><button data-action="注销前需进行身份验证、影响告知与二次确认；本原型不执行注销。">申请注销账户</button></section>`;

  const screen = (id, changes={}) => ({...old[id],...changes});
  app.screens = [
    screen('c-home',{goal:'首屏只围绕当前产品和当前主任务，让用户一眼找到申请服务与服务进度。',note:'v0.12 去除安装探索与三个并列服务入口，将添加产品收敛为次级操作。',body:home}),
    screen('c-service',{goal:'服务页仅展示进行中申请的状态摘要与明确下一步。',note:'完整时间轴放在独立进度页，本页不再重复展示四步流程。',body:service}),
    screen('c-mine',{goal:'个人中心只承载账户、购买、隐私与帮助，不复制产品和服务展示。',note:'产品归首页，进行中服务归服务页；问卷只在真实待办出现时展示。',body:mine}),
    screen('c-profile'), screen('c-preferences'), screen('c-purchases'),
    screen('c-register',{title:'添加产品',entry:'C04 · 扫码、输入与手动添加',goal:'在一个页面内完成扫码、手动输入、识别结果与失败重试。',note:'v0.12 合并原“添加产品”“扫一扫添加”“识别结果”和编码帮助页，以同路由状态切换。',body:register,footer:ctx=>['matched-instance','matched-purchase','owned'].includes(reg(ctx).lookupStatus)?`<button class="primary" data-claim-scan>${reg(ctx).lookupStatus==='owned'?'查看已有产品':'确认添加产品'}</button>`:''}),
    screen('c-manual-select',{goal:'手动添加第一步只选择产品，选完直接进入统一信息确认。',body:ctx=>old['c-manual-select'].body(ctx).replace('第 1 步 / 共 3 步','第 1 步 / 共 2 步'),footer:ctx=>`<button class="primary" data-go="c-purchase"${reg(ctx).selectedProducts?.length?'':' disabled'}>下一步：确认信息</button>`}),
    screen('c-purchase',{title:'确认产品信息',entry:'C05 · 购买与使用信息',goal:'一次补齐购买日期与必要个人信息，将手动添加从三步缩减为两步。',body:purchase,footer:'<button class="primary" type="submit" form="c-purchase-form">完成添加</button>'}),
    screen('c-products',{footer:'<button class="primary" data-go="c-register">添加产品</button>'}),
    screen('c-product',{goal:'产品详情同时承载添加成功反馈，避免单独结果页。',note:'仅展示与产品判断有关的信息，不重复个人资料。产品关系与服务资格仍分开判断。',body:productDetail}),
    screen('c-repair',{goal:'服务申请第一步只选择服务方式并说明问题。',body:ctx=>old['c-repair'].body(ctx).replace('第 1 步 / 共 3 步','第 1 步 / 共 2 步')}),
    screen('c-contact',{goal:'在第二步一次确认联系、时间、用途与同意项，直接提交。',note:'v0.12 将独立复核页收进表单底部，期望时间不代表预约成功。',body:contact,footer:'<button class="primary" type="submit" form="c-contact-form">确认并提交申请</button>'}),
    screen('c-submit-result'), screen('c-progress'), screen('c-evaluation'),
    screen('c-outlets',{goal:'默认以列表呈现可扫读结果，地图按需展开；地区选择在同页面完成。'}),
    screen('c-outlet-detail'),
    {id:'c-support',parent:'c-mine',title:'帮助与客服',entry:'C09 / C16 · 联系与帮助',goal:'用一个支持面统一客服、编码查询与常见问题。',note:'原型不填造真实客服号码，不发起真实拨号或消息。',body:support},
    {id:'c-privacy',parent:'c-mine',title:'隐私与账户',entry:'C14 · 隐私与账户',goal:'将隐私说明、同意记录、撤回与注销收敛到可找到的设置页。',note:'撤回和注销均是高影响操作，正式实现需要身份验证、影响告知与二次确认。',body:privacy},
  ].filter(Boolean);
})();
