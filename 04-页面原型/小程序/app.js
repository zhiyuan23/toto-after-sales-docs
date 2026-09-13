'use strict';
(() => {
  const apps = window.TOTO_SCREENS || {};
  const outlets = window.TOTO_OUTLETS;
  const account = window.TOTO_ACCOUNT;
  const $ = (selector) => document.querySelector(selector);
  const escape = (text) => String(text ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const all = Object.entries(apps).flatMap(([app, value]) => value.screens.map(screen => ({...screen, app})));
  let current = all[0];
  let view = 'screen';
  let routeHistory = [];
  let toastTimer;
  const drafts = new Map();
  const namedDrafts = new Map();
  const submitted = new Set();
  const servicePages = new Set(['c-repair','c-install','c-contact','c-confirm']);
  const registrationPages = new Set(['c-manual-select','c-purchase-date','c-product-code','c-code-result','c-purchase']);
  const registrationStarts = {manual:'c-manual-select','product-code':'c-product-code'};
  const registrationSubmits = {'c-product-code': ['c-product-code-form','c-code-result'], 'c-purchase-date': ['c-purchase-date-form','c-purchase'], 'c-purchase': ['c-purchase-form','c-register-result']};
  const registrationAllowed = () => Object.hasOwn(registrationStarts, consumer.registrationMethod);
  const consumer = {productId:'t01',serviceType:'repair',hasProducts:true,registered:{},orders:new Map(),forms:new Map(),media:new Map(),lastSubmitted:null,
    ownedProducts:[],registrationMethod:'manual',registrationDrafts:new Map(),registrationReceipt:null,nextInstance:3};
  const registrationDraft = () => {
    if (!consumer.registrationDrafts.has(consumer.registrationMethod)) consumer.registrationDrafts.set(consumer.registrationMethod, {
      categoryId:'',seriesId:'',catalogProductId:'',purchaseDate:'',productCode:'',lookupStatus:'idle',
      userName:'',phone:'',useType:'self',region:'示例省 / 示例市 / 示例区',address:'',privacyConsent:false
    });
    return consumer.registrationDrafts.get(consumer.registrationMethod);
  };
  const registrationContext = () => {
    const draft=registrationDraft();
    const matched=registrationAllowed() && (consumer.registrationMethod==='manual' || draft.lookupStatus==='matched');
    const selectedProducts=matched ? (apps.consumer.products || []).filter(p=>p.id===draft.catalogProductId) : [];
    return {...draft,method:consumer.registrationMethod,selectedProducts};
  };
  function seedProducts(scenario) {
    consumer.ownedProducts=scenario==='welcome'?[]:(apps.consumer.products || []).map((product,i)=>({...product,catalogId:product.id,
      installationCode:`DEMO-INSTALL-00${i+1}`,installationCodeLinked:true,
      registration:{method:'existing-record',purchaseRecordId:'DEMO-PURCHASE-001',storeName:'TOTO 示例门店（虚构）',purchaseDate:'2026-09-10',installationCode:`DEMO-INSTALL-00${i+1}`,
        userName:'陈女士',phone:'13800000026',useType:'self',region:'示例省 / 示例市 / 示例区',address:'样板路88号1栋101室（虚构）'}
    }));
  }
  seedProducts('registered');
  const serviceKey = () => `${consumer.productId}:${consumer.serviceType}`;
  const draftKey = () => servicePages.has(current?.id) ? `${current.id}:${serviceKey()}` : registrationPages.has(current?.id) ? `${current.id}:${consumer.registrationMethod}` : current?.id;
  const serviceNames = {install:'安装',repair:'维修','remote-guidance':'远程使用指导','onsite-guidance':'上门使用指导'};
  const consumerContext = () => {
    const products = consumer.ownedProducts;
    const product=products.find(p=>p.id===consumer.productId) || products[0] || apps.consumer.products[0];
    return {profile:account?.profile(),products,catalog:apps.consumer.products,product,registration:registrationContext(),registrationReceipt:consumer.registrationReceipt,serviceType:consumer.serviceType,
      order:consumer.orders.get(consumer.productId) || null,submittedOrder:consumer.lastSubmitted,
      serviceOrders:[...new Map([...consumer.orders.values()].map(order=>[order.id,order])).values()],
      form:consumer.forms.get(serviceKey()) || {},registered:product?.registration || consumer.registered,
      mediaStatus:consumer.media.get(serviceKey()) || 'none',hasProducts:consumer.hasProducts};
  };
  const markup = (value) => typeof value === 'function' ? value(consumerContext()) : value || '';
  function hydrateIcons(scope) {
    scope.querySelectorAll('[data-icon]').forEach(el => {
      if (!['install','repair','guidance','home','service','mine','check','plus','camera'].includes(el.dataset.icon)) return;
      el.innerHTML = `<img src="assets/icons/${el.dataset.icon}.svg" alt="" width="24" height="24">`;
    });
  }
  let renderedState = 'normal';
  const captureId = new URLSearchParams(location.search).get('capture');
  if (captureId) document.body.classList.add('capture-mode');
  const saveDraft = () => {
    if (!current || renderedState !== 'normal') return;
    if (account?.owns(current.id)) {account.saveDraft($('#phone-body'));return;}
    if (outlets?.owns(current.id)) return;
    const fields = [...$('#phone-body').querySelectorAll('input,select,textarea')];
    const values = Object.fromEntries(fields.filter(el => el.name && el.name !== 'installProducts' && (el.type!=='radio' || el.checked)).map(el => [el.name, el.type === 'checkbox' ? el.checked : el.value]));
    if (fields.some(el=>el.name==='installProducts')) values.installProducts=fields.filter(el=>el.name==='installProducts' && el.checked).map(el=>el.value);
    drafts.set(draftKey(), fields.map(el => ({value:el.value, checked:el.checked})));
    namedDrafts.set(current.id, values);
    if (servicePages.has(current.id)) consumer.forms.set(serviceKey(), {...consumer.forms.get(serviceKey()),...values});
    if (registrationPages.has(current.id)) Object.assign(registrationDraft(),values);
  };
  const restoreDraft = () => {
    if (account?.owns(current.id)) return;
    if (outlets?.owns(current.id)) return;
    const values = drafts.get(draftKey());
    if (!values) return;
    [...$('#phone-body').querySelectorAll('input,select,textarea')].forEach((el, i) => {
      if (values[i] && el.type !== 'file') { el.value = values[i].value; el.checked = values[i].checked; }
    });
  };
  const showToast = (message) => {
    $('#toast').textContent = message;
    $('#toast').hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { $('#toast').hidden = true; }, 3600);
  };
  function showScreen(id, push = true, skipSave = false) {
    if (!skipSave) saveDraft();
    if (['c-outlet-contact','c-outlet-navigation'].includes(id)) id='c-outlet-detail';
    outlets?.clearOverlay();
    if (id === 'c-home' && !consumer.hasProducts) id = 'c-welcome';
    const registrationEntry=Object.entries(registrationStarts).find(([,page])=>page===id);
    if (registrationEntry) consumer.registrationMethod=registrationEntry[0];
    if (registrationPages.has(id) && !registrationAllowed()) id='c-installation-code';
    if (['c-manual-select','c-purchase-date','c-purchase'].includes(id) && registrationDraft().completedInstanceId) id='c-register-result';
    if (id==='c-code-result' && consumer.registrationMethod!=='product-code') id='c-product-code';
    if (id==='c-product-code') consumer.registrationMethod='product-code';
    if (['c-purchase-date','c-purchase'].includes(id) && !registrationContext().selectedProducts.length) id=registrationStarts[consumer.registrationMethod];
    if (id==='c-purchase' && !validPurchaseDate(registrationDraft().purchaseDate)) id='c-purchase-date';
    if (id==='c-product' && !consumer.hasProducts) id='c-register';
    if ((id === 'c-install' && consumer.serviceType !== 'install') || (id === 'c-repair' && consumer.serviceType === 'install')) {
      consumer.serviceType = id === 'c-install' ? 'install' : 'repair';
    }
    const next = all.find(s => s.id === id);
    if (!next) { showToast('该页面不在本轮原型范围内。'); return; }
    if (push && current && current.id !== id) routeHistory.push(current.id);
    current = next;
    $('#ui-state').value = 'normal';
    if (!captureId && location.hash !== '#' + id) history.replaceState(null, '', '#' + id);
    view = 'screen';
    render();
  }
  function renderOutletOverlay() {
    const overlay=$('#outlet-overlay');
    overlay.innerHTML=outlets?.owns(current.id) ? outlets.overlay() : '';
    overlay.hidden=!overlay.innerHTML;
    ['#phone-body','#phone-footer','#phone-tabs'].forEach(selector=>{$(selector).inert=!overlay.hidden;});
    const target=outlets?.takeFocus();
    if(target) $('#phone').querySelector(target)?.focus();
    if(!overlay.hidden) overlay.querySelector('[role="dialog"]')?.scrollIntoView({block:'center',inline:'nearest'});
  }
  function render() {
    outlets?.clearOverlay();
    const app = apps[current.app];
    $('#phone').classList.toggle('consumer-phone', current.app === 'consumer');
    $('#phone').dataset.screen = current.id;
    $('#consumer-controls').hidden = current.app !== 'consumer';
    $('#outlet-controls').hidden = !outlets?.owns(current.id);
    if (outlets?.owns(current.id)) $('#outlet-location-outcome').value=outlets.locationOutcome();
    document.title = `${current.title} · TOTO 小程序设计原型`;
    $('[data-app="consumer"]').classList.toggle('selected', current.app === 'consumer');
    $('[data-app="worker"]').classList.toggle('selected', current.app === 'worker');
    $('#screen-count').textContent = app.screens.length;
    $('#screen-list').innerHTML = app.screens.map((s, i) => `<button class="screen-link ${s.id === current.id ? 'selected' : ''}" data-go="${escape(s.id)}" ${s.id === current.id ? 'aria-current="page"' : ''}><span class="screen-index">${String(i + 1).padStart(2, '0')}</span>${escape(s.title)}</button>`).join('');
    $('#canvas-name').textContent = app.name + ' / ' + current.entry;
    $('#phone-title').textContent = current.title;
    $('#phone-body').innerHTML = markup(current.body);
    renderedState = 'normal';
    $('#phone-body').scrollTop = 0;
    $('#phone-footer').innerHTML = markup(current.footer);
    renderOutletOverlay();
    const isRoot = app.tabs.some(t => t.go === current.id) || current.id==='c-welcome';
    $('#phone-tabs').innerHTML = isRoot ? app.tabs.map((t,i) => `<button data-go="${escape(t.go)}" class="${t.go === (current.tab || current.id) ? 'selected' : ''}" ${t.go === (current.tab || current.id) ? 'aria-current="page"' : ''}>${current.app==='consumer'?`<span data-icon="${['home','service','mine'][i]}" aria-hidden="true"></span>`:''}${escape(t.label)}</button>`).join('') : '';
    $('#phone-back').style.visibility = isRoot ? 'hidden' : 'visible';
    $('#review-title').textContent = current.title;
    $('#entry-id').textContent = current.entry;
    $('#review-goal').textContent = current.goal;
    $('#review-note').textContent = current.note;
    const index = app.screens.findIndex(s => s.id === current.id);
    $('#page-number').textContent = `${String(index + 1).padStart(2,'0')} / ${app.screens.length}`;
    $('#prev-page').disabled = index === 0;
    $('#next-page').disabled = index === app.screens.length - 1;
    $('#toast').hidden = true;
    restoreDraft();
    hydrateIcons($('#phone'));
    $('#phone-body').querySelectorAll('[data-bind]').forEach(el => {
      const [screenId, field] = el.dataset.bind.split('.');
      const value = namedDrafts.get(screenId)?.[field];
      if (value !== undefined && value !== '') el.textContent = value;
    });
    if (submitted.has('w-returned') && current.id === 'w-tasks') {
      const card = $('#phone-body [data-returned-card]');
      if (card) {
        card.hidden = true;
        card.querySelector('[data-returned-status]').textContent = '待审核 · 已补充资料';
        card.querySelector('.notice').textContent = '第 2 次提交已收到，等待重新审核。';
        const button = card.querySelector('[data-returned-button]');
        button.textContent = '查看重提状态';
        button.dataset.go = 'w-resubmitted';
      }
      const count = $('#phone-body [data-return-count]');
      if (count) count.textContent='0';
      const reviewCount = $('#phone-body [data-review-count]');
      if (reviewCount) reviewCount.textContent='2';
      const queue = $('#phone-body [data-pending-queue]');
      if (queue) queue.textContent='待完工 2';
      const reviewQueue = $('#phone-body [data-review-queue]');
      if (reviewQueue) reviewQueue.textContent='待审核 2';
    }
    setView(view);
  }
  function setView(next) {
    view = next;
    if (view!=='screen') {outlets?.clearOverlay();renderOutletOverlay();}
    ['screen','flows','atlas'].forEach(name => {
      $(`#${name}-view`).hidden = name !== view;
      $(`[data-view="${name}"]`).classList.toggle('selected', name === view);
    });
    if (view === 'flows') renderFlows();
    if (view === 'atlas') renderAtlas();
  }
  function renderFlows() {
    const c = current.app === 'consumer';
    const definitions = c ? [
      ['登记产品：手动选择商品','选择分类、系列和商品，补充购买日期与个人信息。登记完成后可从该产品申请服务。',['c-welcome','c-register','c-manual-select','c-purchase-date','c-purchase','c-register-result','c-home']],
      ['已有安装码：联系查询协助','安装码供门店或客服查询已关联的购买记录。消费者查看用途并联系协助，不通过安装码认领或登记产品。',['c-register','c-installation-code','c-code-help']],
      ['产品标签码：辅助选择商品','标签码仅用于本次商品识别演示；确认商品后补充购买日期和个人信息，不推断实物身份或购买归属。',['c-code-guide','c-product-code','c-code-result','c-purchase-date','c-purchase','c-register-result']],
      ['产品需要维修或指导','带入当前产品，分步说明问题、确认联系方式和期望时间，再复核提交。同一笔申请可从产品页继续跟进。',['c-home','c-repair','c-contact','c-confirm','c-submit-result','c-progress']],
      ['查找授权门店与维修网点','地图选点后直接电话或导航；列表按需展开，地区与详情独立查看，无需先登记产品。',['c-service','c-outlets','c-outlet-region','c-outlet-detail']],
      ['新产品安装 · 设计探索','选择本次涉及的产品，确认地址和期望时间，提交后等待联系。消费者安装正式开放条件仍待确认。',['c-home','c-install','c-contact','c-confirm','c-submit-result']],
      ['个人资料与购买记录','从我的修改头像、常用资料和兴趣偏好，按购买记录查看商品和安装码；历史购买和服务信息不随资料编辑而改变。',['c-mine','c-profile','c-preferences','c-purchases','c-product']],
      ['多产品与服务跟进','服务页按申请汇总，直接切换服务，查看确认安排和完整进度；右侧可体验等待联系、已确认及多项服务。评价页展示独立已完成示例。',['c-home','c-service','c-progress','c-evaluation']]
    ] : [
      ['联系客户与现场履约','先确认预约，再记录现场作业；提交完工后进入审核。',['w-tasks','w-detail','w-appointment','w-service','w-completion','w-review']],
      ['缺件与重新安排','先记录异常和配件需求，到件后重新联系确认时间。',['w-detail','w-exception','w-parts','w-requisition','w-appointment']],
      ['审核退回与补充','清楚展示退回原因，修正资料后产生新的提交版本。',['w-tasks','w-returned','w-resubmitted']]
    ];
    $('#flows-view').innerHTML = `<h1>${apps[current.app].name} · 核心流程</h1><p class="muted">点击任意节点进入对应页面。连接表示设计中的用户路径，不替代后端状态机与权限契约。</p>` + definitions.map(([title,desc,ids]) => `<article class="flow-card"><h2>${escape(title)}</h2><p class="muted">${escape(desc)}</p><div class="flow-stops">${ids.filter(id => all.some(s => s.id === id)).map(id => {const s=all.find(s=>s.id===id);return `<button data-go="${id}">${escape(s.title)}</button>`;}).join('<span>→</span>')}</div></article>`).join('');
  }
  function renderAtlas() {
    $('#atlas-view').innerHTML = `<h1>${apps[current.app].name} · 页面总览</h1><p class="muted">点击页面名称进入交互走查；缩略图用于检查跨页面结构一致性。</p><div class="screen-grid">${apps[current.app].screens.map(s => `<article class="screen-tile"><button data-go="${escape(s.id)}"><strong>${escape(s.title)}</strong><span>${escape(s.entry)}</span></button><div class="thumb-shell" inert aria-hidden="true"><div class="phone ${current.app==='consumer'?'consumer-phone':''}" data-screen="${escape(s.id)}"><div class="phone-nav"><strong>${escape(s.title)}</strong></div><div class="phone-body">${markup(s.body).replace(/\s(?:id|form)="[^"]*"/g,'')}</div><div class="phone-footer">${markup(s.footer).replace(/\s(?:id|form)="[^"]*"/g,'')}</div><nav class="phone-tabs">${apps[current.app].tabs.some(t=>t.go===s.id) ? apps[current.app].tabs.map(t=>`<button class="${t.go===s.id?'selected':''}">${escape(t.label)}</button>`).join(''):''}</nav></div></div><p>${escape(s.goal)}</p></article>`).join('')}</div>`;
    hydrateIcons($('#atlas-view'));
  }
  function renderState(value) {
    if (value === 'normal') { if(current.id==='c-outlets')outlets?.recover(); render(); return; }
    if (value === 'error' && current.id==='c-outlets') {outlets.fail();render();return;}
    renderedState = value;
    if (value==='empty' && current.id==='c-purchases') {$('#phone-body').innerHTML=account.empty();$('#phone-footer').innerHTML='';hydrateIcons($('#phone'));return;}
    const messages = {
      empty:['暂无记录','这里还没有相关记录。可以返回当前功能，继续登记产品或办理服务。','返回正常内容'],
      error:['暂时无法加载','网络连接不稳定，已有填写内容仍保留在本次演示中。请重试。','重新加载'],
      upload:['有一项资料未上传成功','其他已填写内容保留。重新上传失败项后，再继续提交。','重试失败项']
    };
    const [title,desc,action] = messages[value];
    $('#phone-body').innerHTML = `<div class="empty-state"><span class="badge">状态示例</span><h2>${title}</h2><p>${desc}</p><button class="primary" data-retry>${action}</button></div>`;
    $('#phone-footer').innerHTML = '';
  }
  function resetConsumer(scenario = 'registered') {
    outlets?.reset();
    account?.reset();
    consumer.productId='t01'; consumer.serviceType='repair'; consumer.hasProducts=scenario!=='welcome';
    consumer.registered={}; seedProducts(scenario); consumer.registrationMethod='manual'; consumer.registrationDrafts.clear(); consumer.registrationReceipt=null;consumer.nextInstance=3;consumer.orders.clear(); consumer.forms.clear(); consumer.media.clear(); consumer.lastSubmitted=null;
    [...drafts.keys()].filter(key=>key.startsWith('c-')).forEach(key=>drafts.delete(key));
    [...namedDrafts.keys()].filter(key=>key.startsWith('c-')).forEach(key=>namedDrafts.delete(key));
    [...submitted].filter(key=>key.startsWith('c-')).forEach(key=>submitted.delete(key));
    if (['confirmed','multiple'].includes(scenario)) consumer.orders.set('t01',{
      id:'DEMO-SR-001',productId:'t01',productName:apps.consumer.products?.[0]?.name || '智能坐便器',serviceType:'repair',
      serviceLabel:'维修',status:'confirmed',description:'冲洗功能偶尔无法启动。',contactName:'陈女士',phone:'13800000026',
      address:'虚构地址：示例市样板路88号1栋101室',preferredDate:'2026-09-15',preferredTime:'上午 09:00–12:00',
      confirmedDate:'2026-09-15',confirmedTime:'下午 14:00–17:00'
    });
    if (['pending','multiple'].includes(scenario)) {
      const productId=scenario==='multiple'?'b02':'t01';
      const product=consumer.ownedProducts.find(p=>p.id===productId);
      consumer.orders.set(productId,{
        id:'DEMO-SR-002',productId,productIds:[productId],productName:product.name,serviceType:'remote-guidance',
        serviceLabel:'远程使用指导',status:'pending',description:'希望了解日常清洁与保养方法。',contactName:'陈女士',phone:'13800000026',
        preferredDate:'2026-09-16',preferredTime:'morning'
      });
    }
    $('#consumer-scenario').value=scenario;
  }
  const validPurchaseDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && value<=new Date().toLocaleDateString('en-CA') && !Number.isNaN(Date.parse(value));
  function lookupRegistrationCode() {
    if (consumer.registrationMethod!=='product-code') return false;
    const reg=registrationDraft();
    const value=String(reg.productCode || '').trim().toUpperCase();
    delete reg.completedInstanceId;
    reg.catalogProductId='';reg.lookupStatus='not-found';reg.productCode=value;
    if (value.startsWith('DEMO-INSTALL-') || value.startsWith('TOTO-')) {reg.lookupStatus='wrong-type';return true;}
    const productByExample={'DEMO-PRODUCT-001':'t01','DEMO-PRODUCT-002':'b02','DEMO-PRODUCT-003':'t01'};
    if (!Object.hasOwn(productByExample,value)) return true;
    reg.lookupStatus='matched';reg.catalogProductId=productByExample[value];
    return true;
  }
  function completeRegistration() {
    if (!registrationAllowed()) {consumer.registrationReceipt=null;showScreen('c-installation-code');showToast('安装码用于向门店或客服查询记录，不能在这里登记产品。');return false;}
    const reg=registrationDraft(),ctx=registrationContext();
    if (reg.completedInstanceId) {
      const existing=consumer.ownedProducts.find(p=>p.id===reg.completedInstanceId);
      if (existing) {consumer.productId=existing.id;consumer.registrationReceipt={...existing.registration,products:[existing]};return true;}
    }
    if (!ctx.selectedProducts.length) {showScreen(registrationStarts[consumer.registrationMethod]);showToast('请先选择商品或完成码识别。');return false;}
    if (!validPurchaseDate(reg.purchaseDate)) {showScreen('c-purchase-date');showToast('请先填写有效的购买日期。');return false;}
    if (!reg.userName?.trim() || !/^1\d{10}$/.test(reg.phone || '') || !reg.address?.trim() || !reg.region || !reg.privacyConsent) {
      showToast('请核对姓名、手机号、使用地址和隐私同意项。');return false;
    }
    const info={method:consumer.registrationMethod,purchaseDate:reg.purchaseDate,
      installationCode:'',recognizedProductCode:consumer.registrationMethod==='product-code'?reg.productCode:'',
      userName:reg.userName.trim(),phone:reg.phone,useType:reg.useType,region:reg.region,address:reg.address.trim()};
    const catalogProduct=ctx.selectedProducts[0];
    const instance={...catalogProduct,id:`registered-${consumer.nextInstance++}`,catalogId:catalogProduct.id,room:'新登记产品',
      code:'',productCode:'',installationCode:'',installationCodeLinked:false,registration:info};
    consumer.ownedProducts.push(instance);consumer.productId=instance.id;consumer.hasProducts=true;
    consumer.registered={...info};consumer.registrationReceipt={...info,products:[instance]};reg.completedInstanceId=instance.id;
    routeHistory=[];
    $('#consumer-scenario').value='registered';return true;
  }
  function completeConsumerRequest() {
    if (!consumer.hasProducts) {showScreen('c-register');showToast('请先登记需要服务的产品。');return false;}
    const form=consumer.forms.get(serviceKey()) || {};
    const remote=consumer.serviceType==='remote-guidance';
    if (consumer.serviceType!=='install' && !form.description?.trim()) {
      showScreen('c-repair');showToast('请先补充需要帮助的问题。');return false;
    }
    if (!form.contactName?.trim() || !/^1\d{10}$/.test(form.phone || '') || !form.preferredDate || !form.preferredTime || (!remote && !form.address?.trim())) {
      showScreen('c-contact');showToast('请先核对联系人、地址和期望时间。');return false;
    }
    const productIds=consumer.serviceType==='install' ? (form.installProducts || []) : [consumer.productId];
    const validIds=productIds.filter(id=>consumer.ownedProducts.some(p=>p.id===id));
    if (!validIds.length) {showScreen('c-install');showToast('请选择本次需要安装的产品。');return false;}
    if (consumer.media.get(serviceKey())==='failed') {showScreen('c-repair');showToast('照片尚未上传，可重试或移除后继续。');return false;}
    const existing=validIds.map(id=>consumer.orders.get(id)).find(Boolean);
    if (existing) {consumer.productId=existing.productId;showScreen('c-progress',true,true);showToast('所选产品已有服务进行中，请先查看进度或联系客服。');return false;}
    const productNames=validIds.map(id=>consumer.ownedProducts.find(p=>p.id===id).name).join('、');
    const primaryId=validIds.includes(consumer.productId)?consumer.productId:validIds[0];
    const mediaStatus=consumer.media.get(serviceKey());
    const order={...form,id:`DEMO-SR-${String(consumer.orders.size+2).padStart(3,'0')}`,productId:primaryId,
      productIds:validIds,productName:productNames,serviceType:consumer.serviceType,serviceLabel:serviceNames[consumer.serviceType],status:'pending'};
    consumer.lastSubmitted=order;
    validIds.forEach(id=>consumer.orders.set(id,order));
    consumer.productId=primaryId;
    consumer.forms.set(serviceKey(),{...form});
    if (mediaStatus) consumer.media.set(serviceKey(),mediaStatus);
    return true;
  }
  document.addEventListener('click', event => {
    const el = event.target.closest('button,[data-go],[data-action]');
    if (!el || el.disabled) return;
    if (outlets?.handle(el,{render:()=>{$('#ui-state').value='normal';render();},renderOverlay:renderOutletOverlay,showScreen,showToast,returnTo:id=>{const index=routeHistory.lastIndexOf(id);if(index>=0)routeHistory.length=index;showScreen(id,false);}})) {event.preventDefault();return;}
    if (account?.owns(current.id) && account.handle(el,{root:$('#phone-body'),context:consumerContext(),render,showToast})) {event.preventDefault();return;}
    if (el.dataset.regMethod) {
      event.preventDefault();
      if (el.dataset.regMethod==='installation-code') {showScreen('c-installation-code');return;}
      if (!Object.hasOwn(registrationStarts,el.dataset.regMethod)) return;
      saveDraft();
      consumer.registrationMethod=el.dataset.regMethod;
      if (registrationDraft().completedInstanceId) {
        consumer.registrationDrafts.delete(consumer.registrationMethod);
        [...drafts.keys()].filter(key=>registrationPages.has(key.split(':')[0]) && key.endsWith(':'+consumer.registrationMethod)).forEach(key=>drafts.delete(key));
      }
      showScreen(registrationStarts[consumer.registrationMethod],true,true);
    }
    else if (el.dataset.category || el.dataset.series || el.dataset.catalogProduct) {
      event.preventDefault();saveDraft();
      const reg=registrationDraft(),catalog=apps.consumer.products || [];
      if (el.dataset.category && catalog.some(p=>p.categoryId===el.dataset.category)) {
        if (reg.categoryId!==el.dataset.category) {reg.categoryId=el.dataset.category;reg.seriesId='';reg.catalogProductId='';}
      } else if (el.dataset.series && catalog.some(p=>p.categoryId===reg.categoryId && p.seriesId===el.dataset.series)) {
        if (reg.seriesId!==el.dataset.series) {reg.seriesId=el.dataset.series;reg.catalogProductId='';}
      } else if (el.dataset.catalogProduct && catalog.some(p=>p.id===el.dataset.catalogProduct && p.categoryId===reg.categoryId && p.seriesId===reg.seriesId)) reg.catalogProductId=el.dataset.catalogProduct;
      render();
    }
    else if (el.dataset.codeExample) {
      event.preventDefault();saveDraft();
      if (current.id!=='c-product-code' || consumer.registrationMethod!=='product-code') {showScreen('c-installation-code');return;}
      const example=el.dataset.codeExample;
      registrationDraft().productCode=example==='not-found'?'NOT-FOUND':example==='wrong-type'?'DEMO-INSTALL-003':`DEMO-PRODUCT-${example==='alternate'?'002':'003'}`;
      drafts.delete(draftKey());lookupRegistrationCode();showScreen('c-code-result',true,true);
    }
    else if (el.dataset.product) {
      event.preventDefault();
      if (!consumer.ownedProducts.some(p=>p.id===el.dataset.product)) return;
      saveDraft();consumer.productId=el.dataset.product;
      showScreen(el.dataset.go || current.id,true,true);
    }
    else if (el.dataset.serviceType) {
      event.preventDefault();
      if (!serviceNames[el.dataset.serviceType]) return;
      if (!consumer.hasProducts) {showScreen('c-register');showToast('先登记产品，让服务准确找到需要帮助的产品。');return;}
      saveDraft();consumer.serviceType=el.dataset.serviceType;
      const order=consumer.orders.get(consumer.productId);
      if (order) {showScreen('c-progress',true,true);showToast('已有服务进行中，可以先查看进度或联系客服。');return;}
      showScreen(el.dataset.go || (consumer.serviceType==='install'?'c-install':'c-repair'),true,true);
    }
    else if (el.dataset.media) {
      event.preventDefault();saveDraft();
      consumer.media.set(serviceKey(),el.dataset.media==='remove'?'none':el.dataset.media==='retry'?'uploaded':'failed');
      render();
      showToast(el.dataset.media==='add'?'演示上传失败：内容已保留，可重试或移除。':el.dataset.media==='retry'?'演示重试成功，照片已就绪。':'已移除这张演示照片。');
    }
    else if (el.dataset.go) {event.preventDefault(); if (el.dataset.registrationRecord==='current') consumer.registrationReceipt=null;showScreen(el.dataset.go);}
    else if (el.dataset.app) showScreen(apps[el.dataset.app].screens[0].id);
    else if (el.dataset.view) {saveDraft(); setView(el.dataset.view);}
    else if (el.hasAttribute('data-retry')) {$('#ui-state').value='normal';render();showToast('已恢复内容，可继续本次演示。');}
    else if (el.dataset.action) {event.preventDefault();showToast(el.dataset.action);}
  });
  document.addEventListener('submit', event => {
    if (account?.owns(current.id) && account.submit(event.target,{root:$('#phone-body'),render,showToast})) {event.preventDefault();return;}
    if (event.target.matches('form[data-outlet-search]')) {event.preventDefault();outlets.submit(event.target,{render:()=>{$('#ui-state').value='normal';render();}});return;}
    const form=event.target.closest('form[data-submit-go]');
    if (!form) return;
    event.preventDefault();
    if (current.app==='consumer') {
      if (form.id==='c-installation-code-form' || current.id==='c-installation-code' || (registrationPages.has(current.id) && !registrationAllowed())) {
        consumer.registrationReceipt=null;showScreen('c-installation-code');return;
      }
      if (registrationPages.has(current.id) && (!registrationSubmits[current.id] || registrationSubmits[current.id][0]!==form.id)) return;
    }
    if (form.checkValidity()) {
      saveDraft();
      if (current.id==='c-install' && !consumer.forms.get(serviceKey())?.installProducts?.length) {
        let error=form.querySelector('[data-install-error]');
        if (!error) {error=document.createElement('p');error.className='field-error';error.dataset.installError='';error.setAttribute('role','alert');form.prepend(error);}
        error.textContent='请至少选择一件需要安装的产品。';error.scrollIntoView({block:'center'});return;
      }
      if (current.id==='c-confirm' && !completeConsumerRequest()) return;
      if (current.id==='c-product-code' && !lookupRegistrationCode()) return;
      if (current.id==='c-purchase-date' && !validPurchaseDate(registrationDraft().purchaseDate)) {showToast('请选择不晚于今天的购买日期。');return;}
      if (current.id==='c-purchase' && !completeRegistration()) return;
      const evaluated=current.id==='c-evaluation';
      const registeredNow=current.id==='c-purchase';
      const requestSubmitted=['c-confirm','c-purchase'].includes(current.id);
      const target=registrationSubmits[current.id]?.[1] || form.dataset.submitGo;
      submitted.add(current.id);showScreen(target,true,requestSubmitted);
      if (registeredNow) routeHistory=[];
      if (evaluated) showToast('这笔已完成指导服务的评价已记录在本次演示中。');
    }
  });
  document.addEventListener('invalid', event => {
    const input=event.target;
    if (!input.closest('#phone-body')) return;
    event.preventDefault();
    input.setAttribute('aria-invalid','true');
    let error=input.parentElement.querySelector('.field-error');
    if (!error) {error=document.createElement('span');error.className='field-error';input.parentElement.append(error);}
    error.textContent=input.type==='checkbox'?'请勾选后继续。':'请填写此项或选择有效内容。';
    input.scrollIntoView({block:'center'});
  },true);
  document.addEventListener('input',event=>{
    if (!event.target.closest('#phone-body')) return;
    outlets?.input(event.target);
    if (event.target.name==='productCode' && consumer.registrationMethod==='product-code') {const reg=registrationDraft();reg.lookupStatus='idle';reg.catalogProductId='';}
    if (event.target.validity?.valid) {event.target.removeAttribute('aria-invalid');event.target.parentElement.querySelector('.field-error')?.remove();}
  });
  document.addEventListener('change',event=>{
    if (current.id==='c-profile' && event.target.id==='c-avatar-file') account.changeAvatar(event.target,{root:$('#phone-body'),render,showToast});
  });
  $('#ui-state').addEventListener('change',event=>{saveDraft();renderState(event.target.value);});
  $('#outlet-location-outcome').addEventListener('change',event=>outlets?.setLocationOutcome(event.target.value));
  $('#phone-back').addEventListener('click',()=>{
    if(outlets?.dismiss()){renderOutletOverlay();return;}
    showScreen(routeHistory.pop() || current.parent || current.tab || apps[current.app].screens[0].id,false);
  });
  document.addEventListener('keydown',event=>{
    if($('#outlet-overlay').hidden)return;
    if(event.key==='Escape'){event.preventDefault();outlets.dismiss();renderOutletOverlay();}
    if(event.key==='Tab'){
      const buttons=Array.from($('#outlet-overlay').querySelectorAll('#outlet-dialog button'));
      const first=buttons[0],last=buttons[buttons.length-1];
      if(event.shiftKey && document.activeElement===first){event.preventDefault();last?.focus();}
      else if(!event.shiftKey && document.activeElement===last){event.preventDefault();first?.focus();}
    }
  });
  $('#prev-page').addEventListener('click',()=>{const screens=apps[current.app].screens;showScreen(screens[screens.findIndex(s=>s.id===current.id)-1].id);});
  $('#next-page').addEventListener('click',()=>{const screens=apps[current.app].screens;showScreen(screens[screens.findIndex(s=>s.id===current.id)+1].id);});
  $('#consumer-scenario').addEventListener('change',event=>{const keepPage=current.id==='c-service' || account?.owns(current.id) ? current.id : null;resetConsumer(event.target.value);routeHistory=[];current=null;showScreen(keepPage || (consumer.hasProducts?'c-home':'c-welcome'),false,true);});
  $('#reset-demo').addEventListener('click',()=>{drafts.clear();namedDrafts.clear();submitted.clear();resetConsumer();routeHistory=[];current=null;showScreen(all[0].id,false);showToast('本次演示已重置。');});
  window.addEventListener('hashchange',()=>showScreen(location.hash.slice(1),false));
  if(all.length) showScreen(captureId || location.hash.slice(1) || all[0].id,false);
})();
