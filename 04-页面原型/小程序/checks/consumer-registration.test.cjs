'use strict';
// Run with: node --test checks/consumer-registration.test.cjs
// Executes the real controller in a minimal DOM host. This does not replace browser visual QA.
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = resolve(__dirname, '..');

function fixture({ hash = '', search = '' } = {}) {
  const elements = new Map(), events = new Map(), windowEvents = new Map(), readers = [], images = [];
  const element = () => ({
    dataset: {}, fields: [], style: {}, hidden: false, value: '', textContent: '', disabled: false,
    classList: { add() {}, toggle() {} },
    set innerHTML(value) { this.html = value; this.fields = []; },
    get innerHTML() { return this.html || ''; },
    querySelectorAll(selector) { return selector === 'input,select,textarea' ? this.fields : []; },
    querySelector() { return null; },
    addEventListener(type, fn) { this[type] = fn; },
  });
  const get = selector => { if (!elements.has(selector)) elements.set(selector, element()); return elements.get(selector); };
  const location = { hash, search };
  const document = { body: element(), querySelector: get, addEventListener: (type, fn) => events.set(type, fn) };
  const context = vm.createContext({
    document, location, console, URLSearchParams,
    FileReader: class { readAsDataURL(file) { this.result=file.data;readers.push(this); } },
    Image: class { set src(value) { this.value=value;images.push(this); } },
    history: { replaceState(_state, _title, next) { location.hash = next; } },
    setTimeout: () => 1, clearTimeout() {},
    window: { addEventListener: (type, fn) => windowEvents.set(type, fn) },
  });
  for (const file of ['consumer.js', 'worker.js', 'consumer-outlets.js', 'consumer-account.js', 'consumer-ai.js']) vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
  const source = readFileSync(resolve(root, 'app.js'), 'utf8');
  // Expose closure state only in this VM copy, keeping the prototype's production global surface unchanged.
  const hook = 'window.testController={consumer,registrationDraft,registrationContext,completeRegistration,lookupRegistrationCode,resetConsumer,showScreen,consumerContext,renderFlows,renderAtlas,prepareAssistantRequest,current:()=>current};';
  const index = source.lastIndexOf('})();');
  assert.ok(index > 0);
  vm.runInContext(source.slice(0, index) + hook + source.slice(index), context, { filename: 'app.js' });
  const api = context.window.testController;
  const fields = values => { get('#phone-body').fields = Object.entries(values).map(([name, value]) => ({ name, type: typeof value === 'boolean' ? 'checkbox' : 'text', value: typeof value === 'boolean' ? '' : value, checked: value === true })); };
  const click = dataset => events.get('click')({ preventDefault() {}, target: { closest: () => ({
    dataset, disabled: false,
    hasAttribute(name) {
      if (!name.startsWith('data-')) return false;
      const key=name.slice(5).replace(/-([a-z])/g,(_match,letter)=>letter.toUpperCase());
      return Object.hasOwn(dataset,key);
    },
  }) } });
  const change = (name, value) => events.get('change')({ target: { name, value, id: '', dataset: {}, hasAttribute: () => false } });
  const submit = (id, target, valid = true) => {
    const form = {
      id, dataset: { submitGo: target }, checkValidity: () => valid,
      hasAttribute: name => name === 'id' || name === 'data-submit-go' || (name === 'data-account-form' && id==='c-preferences-form'),
      matches(selector) {
        const match = /^form(?:\[([a-z-]+)\])?$/.exec(selector);
        return Boolean(match && (!match[1] || this.hasAttribute(match[1])));
      },
      closest(selector) { return this.matches(selector) ? this : null; },
    };
    // A submit event targets its form; distinguish normal submissions from outlet search forms.
    events.get('submit')({ preventDefault() {}, target: form });
  };
  return { ...api, api, readers, images, upload:file=>events.get('change')({target:{id:'c-avatar-file',files:file?[file]:[],value:'selected'}}), account: context.window.TOTO_ACCOUNT, assistant:context.window.TOTO_AI_ASSISTANT, worker:context.window.TOTO_WORKER, apps: context.window.TOTO_SCREENS, get, fields, click, change, submit, location, windowEvents };
}
const copy = value => JSON.parse(JSON.stringify(value));
const personal = { userName: '虚构顾客', phone: '13800000000', useType: 'self', region: '示例省 / 示例市 / 示例区', address: '虚构地址一号', privacyConsent: true };

test('v0.11 and v0.13 expose the same consumer screens and differ only by visual styles', () => {
  const index=readFileSync(resolve(root,'index.html'),'utf8');
  assert.match(index,/consumerVersion=0\.13/);
  assert.match(index,/consumerVersion=0\.11/);
  assert.match(index,/consumer-v011-legacy\.css/);
  assert.doesNotMatch(index,/consumer-v012\.(?:js|css)/);
  assert.ok(existsSync(resolve(root,'consumer-v011-legacy.css')));
  assert.equal(fixture().apps.consumer.screens.length,32);
  assert.ok(!fixture().apps.consumer.screens.some(screen=>screen.id==='c-phone-sync'));
});

test('profile fields are optional, update independently, and never rewrite historical registration', () => {
  const f=fixture({hash:'#c-profile'}), before=copy(f.consumer.ownedProducts);
  assert.doesNotMatch(f.get('#phone-body').innerHTML,/必填|选填|保存个人信息|服务进度提醒/);
  f.change('userName','新示例姓名');
  assert.equal(f.account.profile().userName,'新示例姓名');
  f.change('region','');
  f.change('address','只填写详细地址');
  assert.equal(f.account.profile().region,'');
  assert.equal(f.account.profile().address,'只填写详细地址');
  f.change('userName','');
  assert.equal(f.account.profile().userName,'');
  assert.deepEqual(copy(f.consumer.ownedProducts),before);
  f.click({go:'c-mine'});
  assert.match(f.get('#phone-body').innerHTML,/TOTO 用户/);
});

test('mine page uses one compact product summary instead of repeating product cards', () => {
  const f=fixture({hash:'#c-mine'}), html=f.get('#phone-body').innerHTML;
  const css=readFileSync(resolve(root,'consumer.css'),'utf8');
  assert.match(html,/c-my-products-summary/);
  assert.match(html,/3 件产品/);
  assert.doesNotMatch(html,/当前：|智能坐便器 · CES8G820GCN|我的服务/);
  assert.doesNotMatch(html,/c-product-mini-grid|<img[^>]+product-/);
  assert.match(css,/data-screen="c-mine"\] \.c-section \{ padding-top: 0; padding-bottom: 0; \}/);
  f.click({go:'c-products'});
  assert.equal(f.current().id,'c-products');

  f.resetConsumer('welcome');
  f.showScreen('c-mine');
  assert.match(f.get('#phone-body').innerHTML,/还没有登记产品/);
  assert.match(f.get('#phone-body').innerHTML,/data-go="c-register"/);
});

test('account and registration cards share one spacing rhythm', () => {
  const css=readFileSync(resolve(root,'consumer.css'),'utf8');
  assert.match(css,/--c-card-gap: 12px;/);
  assert.match(css,/--c-card-padding: 16px;/);
  assert.match(css,/data-screen="c-profile"\] \.c-account-phone \{ margin-bottom: var\(--c-card-gap\); \}/);
  assert.match(css,/data-screen="c-profile"\] \.c-preference-entry \{ margin-top: var\(--c-card-gap\);/);
  assert.match(css,/data-screen="c-purchases"\] \.c-purchase-refresh \{ margin-top: var\(--c-card-gap\); \}/);
  assert.match(css,/\.c-registration-summary \{ margin: 0 0 var\(--c-card-gap\); \}/);
  assert.match(css,/\.c-registration-summary \.c-product-context \{ margin: 0; \}/);
  assert.match(css,/\.c-install-code \{[^}]*padding: var\(--c-card-padding\);[^}]*margin-bottom: var\(--c-card-gap\);/);
  assert.match(css,/\.c-list-summary \{[^}]*margin: 0 0 var\(--c-card-gap\);/);
});

test('product gallery stays focused on selecting a product without duplicate acquisition actions', () => {
  const f=fixture({hash:'#c-products'}), html=f.get('#phone-body').innerHTML;
  const css=readFileSync(resolve(root,'consumer.css'),'utf8');
  assert.match(html,/我的产品 · 共 3 件/);
  assert.match(html,/class="c-product-image" data-image-background="scene" src="assets\/product-bathtub-scene\.jpg"/);
  assert.match(html,/class="c-product-image" data-image-background="solid" src="assets\/product-toilet\.jpg"/);
  assert.match(css,/img\.c-product-image\[data-image-background="scene"\] \{[^}]*object-fit:cover;[^}]*mix-blend-mode:normal;[^}]*border-radius:9px;/);
  assert.doesNotMatch(html,/当前产品|购买记录自动同步|扫一扫添加其他产品|data-go="c-register"/);
  f.showScreen('c-purchases');
  assert.match(f.get('#phone-body').innerHTML,/class="c-product-image" data-image-background="scene" src="assets\/product-bathtub-scene\.jpg"/);
});

test('home uses outlined pill product tabs and equal clear service actions', () => {
  const f=fixture({hash:'#c-home'}), html=f.get('#phone-body').innerHTML;
  const css=readFileSync(resolve(root,'consumer.css'),'utf8');
  assert.match(html,/class="c-product-switcher"/);
  assert.match(html,/class="c-add-product"[^>]*aria-label="添加产品"[^>]*>.*<span>添加<\/span>/);
  assert.match(html,/data-product="t01"[^>]*aria-pressed="true"[^>]*class="is-selected"/);
  assert.match(css,/\.c-product-switcher \{[^}]*border:0;[^}]*background:transparent;/);
  assert.match(css,/\.c-product-switcher button \{[^}]*border-radius:999px;[^}]*color:#425966;[^}]*background:transparent;/);
  assert.match(css,/\.c-product-switcher button\.is-selected \{[^}]*color:#205f90;[^}]*border-color:#74a8cf;[^}]*background:transparent;/);
  assert.match(css,/\.c-product-switcher button\.is-selected::after \{[^}]*content:none;/);
  assert.match(css,/\.c-product-switcher \.c-add-product \{[^}]*margin-left:auto;[^}]*border:0;[^}]*background:transparent;/);
  assert.match(css,/\.c-service-actions \{[^}]*grid-template-columns:repeat\(3,1fr\);[^}]*border:0;[^}]*background:transparent;[^}]*box-shadow:none;/);
  assert.match(css,/\.c-service-actions > button \{[^}]*min-height:88px;[^}]*border:0;[^}]*background:transparent;[^}]*color:#294353;/);
  assert.doesNotMatch(css,/\.c-service-actions > button::(?:before|after)/);
  assert.match(css,/\.c-service-icon \{[^}]*width:56px;[^}]*height:56px;[^}]*border-radius:50%;[^}]*background:#edf7fd;/);
  assert.match(css,/\.c-service-actions \.c-service-primary \{[^}]*min-height:88px;[^}]*border:0;[^}]*background:transparent;[^}]*color:#294353;/);
  f.click({product:'b02',go:'c-home'});
  assert.match(f.get('#phone-body').innerHTML,/data-product="b02"[^>]*aria-pressed="true"[^>]*class="is-selected"/);
  assert.match(f.get('#phone-body').innerHTML,/台下式洗面器/);
  f.click({product:'bath03',go:'c-home'});
  assert.equal(f.consumerContext().product.imageBackgroundType,'scene');
  assert.match(f.get('#phone-body').innerHTML,/class="c-product-stage is-scene" data-image-background="scene"/);
  assert.match(css,/\.c-product-stage\.is-scene \{[^}]*padding:0;[^}]*background:#dfe5e8;/);
  assert.match(css,/\.c-product-stage\.is-scene img \{[^}]*object-fit:cover;[^}]*mix-blend-mode:normal;/);
});

test('outlet page keeps only the compact type switch in its top controls', () => {
  const f=fixture({hash:'#c-outlets'}), html=f.get('#phone-body').innerHTML;
  const css=readFileSync(resolve(root,'consumer-outlets.css'),'utf8');
  assert.match(html,/class="o-top-controls"><div class="o-type-switch"/);
  assert.match(html,/class="o-type-switch"/);
  assert.match(html,/>维修网点<\/button>.*>授权门店<\/button>/);
  assert.doesNotMatch(html,/o-search|outletKeyword|data-outlet="region"/);
  assert.match(css,/\.o-top-controls \{[^}]*left:50%;[^}]*width:230px;[^}]*translateX\(-50%\)/);
  assert.match(css,/\.o-discovery\.is-list \.o-sheet \{ top:78px;/);
  f.click({outlet:'kind',value:'store'});
  assert.match(f.get('#phone-body').innerHTML,/徐汇产品体验店/);
});

test('phone changes use a WeChat authorization dialog without SMS verification', () => {
  const f=fixture({hash:'#c-profile'});
  f.click({account:'change-phone'});
  assert.match(f.get('#outlet-overlay').innerHTML,/微信绑定号码/);
  assert.doesNotMatch(f.get('#outlet-overlay').innerHTML,/验证码|短信/);
  f.click({account:'dismiss-phone-auth'});
  assert.equal(f.account.profile().phone,'13800000026');
  f.click({account:'change-phone'});
  f.click({account:'confirm-phone-auth'});
  assert.equal(f.account.profile().phone,'13900000000');
  assert.equal(f.get('#outlet-overlay').innerHTML,'');
  f.resetConsumer();
  assert.equal(f.account.profile().phone,'13800000026');
});

test('purchase records group explicit synced orders and distinguish user reported products', () => {
  const f=fixture({hash:'#c-purchases'});
  assert.equal(f.account.records(f.consumerContext()).length,1);
  assert.equal(f.account.records(f.consumerContext())[0].products.length,3);
  assert.doesNotMatch(f.get('#phone-body').innerHTML,/来源与产品信息|DEMO-INSTALL|data-record-id/);
  f.click({product:'b02',go:'c-product'});
  assert.equal(f.consumer.productId,'b02');
  assert.doesNotMatch(f.get('#phone-body').innerHTML,/DEMO-INSTALL-002/);
  f.click({productInfo:''});
  assert.match(f.get('#phone-body').innerHTML,/DEMO-INSTALL-002/);
  f.resetConsumer('welcome');chooseManual(f);finish(f);
  f.click({go:'c-purchases'});
  assert.match(f.get('#phone-body').innerHTML,/用户申报/);
  assert.match(f.get('#phone-body').innerHTML,/购买门店未提供/);
  assert.doesNotMatch(f.get('#phone-body').innerHTML,/DEMO-INSTALL/);
  f.resetConsumer('welcome');f.showScreen('c-purchases');
  assert.match(f.get('#phone-body').innerHTML,/还没有购买记录/);
});

test('verified mobile authorization syncs purchase products automatically and remains idempotent', () => {
  const f=fixture({hash:'#c-welcome'});
  f.resetConsumer('welcome');f.showScreen('c-welcome');
  assert.equal(f.consumer.phoneAuthorized,false);
  assert.equal(f.consumer.ownedProducts.length,0);
  f.click({phoneSync:''});
  assert.equal(f.current().id,'c-welcome');
  assert.match(f.get('#outlet-overlay').innerHTML,/授权手机号/);
  f.click({account:'confirm-phone-auth'});
  assert.equal(f.current().id,'c-products');
  assert.equal(f.consumer.phoneAuthorized,true);
  assert.equal(f.consumer.phoneSyncStatus,'synced');
  assert.equal(f.consumer.ownedProducts.length,3);
  assert.ok(f.consumer.ownedProducts.every(product=>product.sourceLabel==='手机号同步'));
  f.showScreen('c-purchases');f.click({phoneSync:''});
  assert.equal(f.current().id,'c-purchases');
  assert.equal(f.consumer.ownedProducts.length,3);
});
function chooseManual(f) {
  f.click({ regMethod: 'manual' });
  f.click({ category: 'toilet' });
  f.click({ series: 'neorest' });
  f.click({ catalogProduct: 't01' });
  f.click({ go: 'c-purchase-date' });
}
function finish(f, info = personal) {
  f.fields({ purchaseDate: '2026-09-01' });
  f.submit('c-purchase-date-form', 'c-purchase');
  assert.equal(f.current().id, 'c-purchase');
  f.fields(info);
  f.submit('c-purchase-form', 'c-register-result');
  assert.equal(f.current().id, 'c-register-result');
}

test('manual registration retains its selected product and never creates or borrows an installation code', () => {
  const f = fixture();
  const seededCount = f.consumer.ownedProducts.length;
  chooseManual(f);
  finish(f);
  assert.equal(f.consumer.ownedProducts.length, seededCount + 1);
  const added = f.consumer.ownedProducts.at(-1);
  assert.equal(added.catalogId, 't01');
  assert.equal(added.registration.userName, personal.userName);
  assert.equal(added.registration.purchaseDate, '2026-09-01');
  assert.equal(added.installationCode, '');
  assert.equal(added.installationCodeLinked, false);
  assert.equal(f.consumer.registrationReceipt.installationCode, '');
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /DEMO-INSTALL/);
  // Repeated completion of the same draft remains idempotent without inferring real product identity.
  assert.equal(f.completeRegistration(), true);
  assert.equal(f.consumer.ownedProducts.length, seededCount + 1);
});

test('ordinary product codes only identify a model and create user-reported pending instances', () => {
  const f = fixture();
  f.click({ regMethod: 'product-code' });
  f.fields({ productCode: 'DEMO-PRODUCT-001' });
  f.submit('c-product-code-form', 'c-register-result'); // Target is ignored in favor of the permitted transition.
  assert.equal(f.current().id, 'c-code-result');
  assert.equal(f.registrationDraft().lookupStatus, 'matched-model');
  assert.equal(f.registrationContext().selectedProducts.length, 1);
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /已经登记过|<dt>购买日期|DEMO-INSTALL/);
  f.click({ go: 'c-purchase-date' });
  finish(f);
  const count = f.consumer.ownedProducts.length;
  const added = f.consumer.ownedProducts.at(-1);
  assert.equal(added.productCode, '');
  assert.equal(added.registration.recognizedProductCode, 'DEMO-PRODUCT-001');
  assert.equal(added.installationCode, '');
  f.click({ regMethod: 'product-code' });
  f.fields({ productCode: 'DEMO-PRODUCT-001' });
  f.submit('c-product-code-form', 'c-code-result');
  assert.equal(f.registrationDraft().lookupStatus, 'matched-model');
  assert.equal(f.consumer.ownedProducts.length, count);
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /已经登记过/);
  f.click({ go: 'c-purchase-date' });
  finish(f, { ...personal, userName: '另一位虚构顾客', address: '另一处虚构地址' });
  const second = f.consumer.ownedProducts.at(-1);
  assert.equal(f.consumer.ownedProducts.length, count + 1);
  assert.notEqual(second.id, added.id);
  assert.equal(second.catalogId, added.catalogId);
  assert.equal(added.registration.userName, personal.userName);
  assert.equal(added.registration.address, personal.address);
  assert.equal(second.registration.userName, '另一位虚构顾客');
  assert.equal(second.registration.address, '另一处虚构地址');
  assert.equal(added.installationCode, '');
  assert.equal(second.installationCode, '');
  assert.equal(second.registration.installationCode, '');
  assert.equal(added.identityLevel, 'model-only');
  assert.equal(second.ownershipStatus, 'pending-verification');
});

test('trusted product identifiers and purchase credential codes add directly and deduplicate by identifier', () => {
  for (const value of ['DEMO-SN-001', 'DEMO-INSTALL-003']) {
    const f = fixture();f.resetConsumer('welcome');f.click({regMethod:'product-code'});
    f.fields({productCode:value});f.submit('c-product-code-form','c-code-result');
    assert.ok(['matched-instance','matched-purchase'].includes(f.registrationDraft().lookupStatus));
    assert.equal(f.registrationContext().selectedProducts.length,1);
    f.click({claimScan:''});
    assert.equal(f.current().id,'c-register-result');
    assert.equal(f.consumer.ownedProducts.length,1);
    assert.equal(f.consumer.ownedProducts[0].identityLevel,'trusted-identifier');
    assert.equal(f.account.records(f.consumerContext()).length,value==='DEMO-INSTALL-003'?1:0);
    const id=f.consumer.ownedProducts[0].id;
    f.click({regMethod:'product-code'});f.fields({productCode:value});f.submit('c-product-code-form','c-code-result');
    assert.equal(f.registrationDraft().lookupStatus,'owned');
    f.click({claimScan:''});
    assert.equal(f.consumer.ownedProducts.length,1);
    assert.equal(f.consumer.productId,id);
  }
});

test('phone sync and trusted scan converge on the same known product instance in either order', () => {
  const syncedFirst=fixture();
  const original=syncedFirst.consumer.ownedProducts.find(product=>product.id==='t01');
  syncedFirst.click({regMethod:'product-code'});syncedFirst.fields({productCode:'DEMO-SN-001'});syncedFirst.submit('c-product-code-form','c-code-result');
  assert.equal(syncedFirst.registrationDraft().lookupStatus,'owned');syncedFirst.click({claimScan:''});
  assert.equal(syncedFirst.consumer.ownedProducts.length,3);
  assert.ok(original.identifierKeys.includes('sn:DEMO-SN-001'));

  const scanFirst=fixture();scanFirst.resetConsumer('welcome');scanFirst.click({regMethod:'product-code'});
  scanFirst.fields({productCode:'DEMO-SN-001'});scanFirst.submit('c-product-code-form','c-code-result');scanFirst.click({claimScan:''});
  const scanned=scanFirst.consumer.ownedProducts[0];scanFirst.click({phoneSync:''});scanFirst.click({account:'confirm-phone-auth'});
  assert.equal(scanFirst.consumer.ownedProducts.length,3);
  assert.equal(scanFirst.consumer.ownedProducts.find(product=>product.catalogId==='t01').id,scanned.id);
  assert.equal(scanned.sourceLabel,'手机号同步 + 扫码');
});

test('unknown codes cannot create products and the retired standalone installation method remains blocked', () => {
  const unknown=fixture();unknown.resetConsumer('welcome');unknown.click({regMethod:'product-code'});
  unknown.fields({productCode:'TOTO-9007199254740993'});unknown.submit('c-product-code-form','c-code-result');
  assert.equal(unknown.registrationDraft().lookupStatus,'not-found');
  assert.equal(unknown.registrationContext().selectedProducts.length,0);
  unknown.click({claimScan:''});assert.equal(unknown.consumer.ownedProducts.length,0);
  const f = fixture();
  f.resetConsumer('welcome');
  f.consumer.registrationMethod = 'installation-code';
  Object.assign(f.registrationDraft(), personal, { catalogProductId: 't01', purchaseDate: '2026-09-01', lookupStatus: 'matched-purchase', installationCode: 'DEMO-INSTALL-003' });
  assert.equal(f.registrationContext().selectedProducts.length, 0);
  assert.equal(f.lookupRegistrationCode(), false);
  assert.equal(f.completeRegistration(), false);
  assert.equal(f.current().id, 'c-installation-code');
  assert.equal(f.consumer.ownedProducts.length, 0);
  f.submit('c-installation-code-form', 'c-register-result');
  assert.equal(f.current().id, 'c-installation-code');
  assert.equal(f.consumer.registrationReceipt, null);
});

test('legacy installation help links resolve to unified scan guidance without a submit form', () => {
  for (const options of [{ hash: '#c-installation-code' }, { search: '?capture=c-installation-code' }]) {
    const f = fixture(options);
    assert.equal(f.current().id, 'c-installation-code');
    assert.doesNotMatch(f.get('#phone-body').innerHTML, /<form|<input|data-code-example/);
    assert.doesNotMatch(f.get('#phone-footer').innerHTML, /type="submit"|data-go="c-purchase/);
    f.submit('c-installation-code-form', 'c-code-result');
    assert.equal(f.current().id, 'c-installation-code');
    assert.equal(f.consumer.registrationReceipt, null);
  }
  const f = fixture({ hash: '#c-code-result' });
  assert.equal(f.current().id, 'c-code-result');
  f.click({ regMethod: 'installation-code' });
  assert.equal(f.current().id, 'c-installation-code');
  f.showScreen('c-code-help');
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /<form|<input|recoveryPhone/);
  f.location.hash = '#c-installation-code';
  f.windowEvents.get('hashchange')();
  assert.equal(f.current().id, 'c-installation-code');
});

test('synced records display their linked codes while stale retired receipts cannot render success', () => {
  const f = fixture();
  const result = f.apps.consumer.screens.find(screen => screen.id === 'c-register-result');
  const context = f.consumerContext();
  assert.match(result.body(context), /DEMO-INSTALL-001/);
  assert.match(result.body(context), /手机号自动同步/);
  assert.doesNotMatch(result.body(context), /产品已添加/);
  assert.doesNotMatch(result.body({ ...context, product: { ...context.product, installationCodeLinked: false } }), /DEMO-INSTALL/);
  const stale = { method: 'installation-code', installationCode: 'DEMO-INSTALL-003', products: context.products };
  assert.doesNotMatch(result.body({ ...context, registrationReceipt: stale }), /登记完成，产品已添加|DEMO-INSTALL-003/);
  const purchase = f.apps.consumer.screens.find(screen => screen.id === 'c-purchase');
  assert.doesNotMatch(purchase.body({ ...context, registration: { method: 'installation-code', lookupStatus: 'matched', selectedProducts: context.products } }), /<form/);
});

test('required account, usage info and purchase dates gate manual and model-only registration', () => {
  for (const method of ['manual', 'product-code']) {
    const f = fixture();
    f.resetConsumer('welcome');
    if (method === 'manual') chooseManual(f);
    else { f.click({ regMethod: method }); f.click({ codeExample: 'model' }); }
    f.showScreen('c-purchase');
    assert.equal(f.current().id, 'c-purchase-date');
    Object.assign(f.registrationDraft(), personal, { purchaseDate: '2999-01-01' });
    assert.equal(f.completeRegistration(), false);
    Object.assign(f.registrationDraft(), { purchaseDate: '2026-09-01', privacyConsent: false });
    assert.equal(f.completeRegistration(), false);
    assert.equal(f.consumer.ownedProducts.length, 0);
  }
});

test('all templates render across consumer scenarios, registration methods, code results and service types', () => {
  const f = fixture();
  const screens = [...f.apps.consumer.screens, ...f.apps.worker.screens];
  const ids = new Set(screens.map(screen => screen.id));
  assert.equal(f.apps.consumer.screens.length, 32);
  assert.equal(f.apps.worker.screens.length, 25);
  assert.equal(ids.size, 57);
  let combinations = 0;
  for (const scenario of ['welcome', 'registered', 'confirmed']) {
    f.resetConsumer(scenario);
    for (const method of ['manual', 'product-code', 'installation-code']) {
      f.consumer.registrationMethod = method;
      for (const status of ['idle', 'matched-instance', 'matched-purchase', 'matched-model', 'not-found', 'owned']) {
        Object.assign(f.registrationDraft(), { lookupStatus: status, catalogProductId: 't01', productCode: 'DEMO-PRODUCT-003', installationCode: 'DEMO-INSTALL-003', purchaseDate: '2026-09-01' });
        for (const serviceType of ['install', 'repair', 'remote-guidance', 'onsite-guidance']) {
          f.consumer.serviceType = serviceType;
          const ctx = f.consumerContext();
          for (const screen of screens) {
            const html = [screen.body, screen.footer].map(value => typeof value === 'function' ? value(ctx) : value || '').join('');
            assert.equal(typeof html, 'string');
            for (const [, id] of html.matchAll(/data-go="([^"]+)"/g)) assert.ok(ids.has(id), `${screen.id} has unknown route ${id}`);
            for (const [, src] of html.matchAll(/(?:src|href)="([^"]+)"/g)) if (!/^(?:https?:|#|data:)/.test(src)) assert.ok(existsSync(resolve(root, src)), `${screen.id} has missing local asset ${src}`);
            for (const [, value] of html.matchAll(/data-reg-method="([^"]+)"/g)) assert.ok(['manual', 'product-code'].includes(value));
            if (screen.id === 'c-installation-code') assert.doesNotMatch(html, /<input|<form|type="submit"/);
            combinations++;
          }
        }
      }
    }
  }
  assert.equal(combinations, 12312);
  f.consumer.registrationMethod = 'manual';
  f.showScreen('c-home');
  f.renderFlows();
  assert.equal((f.get('#flows-view').innerHTML.match(/class="flow-card"/g) || []).length, 9);
  f.renderAtlas();
  assert.equal((f.get('#atlas-view').innerHTML.match(/class="screen-tile"/g) || []).length, 32);
});

test('AI assistant starts from the current product and a resolved answer never creates a service order', () => {
  const f=fixture({hash:'#c-home'});
  assert.doesNotMatch(f.get('#phone-body').innerHTML,/智能售后助手/);
  assert.match(f.get('#phone-floating').innerHTML,/c-ai-fab/);
  f.click({ai:'start'});
  assert.equal(f.current().id,'c-ai-assistant');
  assert.match(f.get('#phone-body').innerHTML,/CES8G820GCN/);
  f.click({ai:'quick',value:'喷嘴无法伸出或出水'});
  assert.equal(f.assistant.snapshot().stage,'answered');
  assert.match(f.get('#phone-body').innerHTML,/KB-CES8G820GCN-WASH-07/);
  f.click({ai:'resolved'});
  assert.equal(f.assistant.snapshot().stage,'resolved');
  assert.equal(f.consumer.orders.size,0);
  assert.match(f.get('#phone-body').innerHTML,/没有创建服务单/);
});

test('an unresolved AI conversation prefills the existing repair request without creating an order', () => {
  const f=fixture({hash:'#c-home'});
  f.click({ai:'start'});f.click({ai:'quick',value:'冲洗功能按下后无反应'});f.click({ai:'unresolved'});
  assert.equal(f.current().id,'c-ai-handoff');
  assert.match(f.get('#phone-body').innerHTML,/AI 已整理/);
  assert.match(f.get('#phone-body').innerHTML,/可修改后继续/);
  f.fields({summaryIssue:'冲洗按键持续无响应',summaryRequest:'希望安排维修人员检查'});
  f.click({ai:'continue-request'});
  assert.equal(f.current().id,'c-repair');
  assert.equal(f.consumer.orders.size,0);
  const draft=f.consumer.forms.get('t01:repair');
  assert.match(draft.description,/冲洗按键持续无响应/);
  assert.match(draft.description,/希望安排维修人员检查/);
  assert.match(draft.description,/KB-CES8G820GCN-POWER-04/);
  assert.equal(draft.assistantSummary.knowledgeId,'KB-CES8G820GCN-POWER-04');
  assert.match(f.get('#phone-body').innerHTML,/冲洗按键持续无响应/);
});

test('AI human-service path copies the summary without claiming a live handoff or creating an order', () => {
  const f=fixture({hash:'#c-home'});
  f.click({ai:'start'});f.click({ai:'quick',value:'喷嘴无法伸出或出水'});f.click({ai:'unresolved'});f.click({ai:'copy-summary'});
  assert.equal(f.assistant.snapshot().summaryCopied,true);
  assert.equal(f.consumer.orders.size,0);
  assert.equal(f.current().id,'c-ai-handoff');
  assert.equal(f.consumer.customerServiceOpen,true);
  assert.match(f.get('#outlet-overlay').innerHTML,/问题摘要已复制/);
  assert.match(f.consumer.lastCopiedText,/喷嘴无法伸出/);
  assert.match(f.get('#outlet-overlay').innerHTML,/data-customer-channel="phone"/);
  assert.match(f.get('#outlet-overlay').innerHTML,/open-type="contact"[^>]*data-customer-channel="online"/);
  assert.doesNotMatch(f.get('#outlet-overlay').innerHTML,/已转人工|已将问题摘要发给人工客服/);
});

test('AI remains available without products and exposes direct human and failure fallbacks', () => {
  const f=fixture();
  f.resetConsumer('welcome');f.showScreen('c-home');
  assert.equal(f.current().id,'c-welcome');
  assert.match(f.get('#phone-floating').innerHTML,/c-ai-fab/);
  f.click({ai:'start'});
  assert.equal(f.assistant.snapshot().stage,'no-product');
  assert.match(f.get('#phone-body').innerHTML,/微信授权并同步产品/);
  f.click({ai:'contact-human'});
  assert.equal(f.current().id,'c-ai-assistant');
  assert.equal(f.consumer.customerServiceOpen,true);
  assert.equal(f.consumer.lastCopiedText,'');
  f.showScreen('c-ai-assistant');
  f.get('#ui-state').change({target:{value:'error'}});
  assert.match(f.get('#phone-body').innerHTML,/智能服务暂时不可用/);
  assert.match(f.get('#phone-body').innerHTML,/data-ai="contact-human"/);
});

test('service and code-help customer links open the C09 phone and native WeChat drawer', () => {
  const f=fixture({hash:'#c-service'});
  assert.match(f.get('#phone-body').innerHTML,/data-go="c-customer-service"/);
  f.click({go:'c-customer-service'});
  assert.equal(f.current().id,'c-service');
  assert.equal(f.consumer.customerServiceOpen,true);
  assert.match(f.get('#outlet-overlay').innerHTML,/电话客服/);
  assert.match(f.get('#outlet-overlay').innerHTML,/open-type="contact"/);
  assert.doesNotMatch(f.get('#outlet-overlay').innerHTML,/选择后将直接|后台配置的客服热线|原型不会真实/);
  f.click({customerServiceDismiss:''});
  assert.equal(f.consumer.customerServiceOpen,false);
  assert.equal(f.get('#outlet-overlay').innerHTML,'');
  f.showScreen('c-code-help');
  assert.match(f.get('#phone-body').innerHTML,/电话或微信在线客服/);
  f.click({go:'c-customer-service'});
  f.click({customerChannel:'online'});
  assert.equal(f.consumer.customerServiceOpen,false);
});

test('safety and unmatched-product questions do not invent self-repair guidance, and active orders block continuation', () => {
  const f=fixture({hash:'#c-home'});
  f.click({ai:'start'});f.click({ai:'quick',value:'产品底部出现漏水'});
  assert.equal(f.assistant.snapshot().answer.kind,'safety');
  assert.match(f.get('#phone-body').innerHTML,/停止使用并隔离风险/);
  assert.doesNotMatch(f.get('#phone-footer').innerHTML,/已经解决/);
  f.click({ai:'unresolved'});
  f.consumer.orders.set('t01',{id:'DEMO-SR-ACTIVE',productId:'t01',serviceType:'repair',status:'pending'});
  f.click({ai:'continue-request'});
  assert.equal(f.current().id,'c-service');
  assert.equal(f.consumer.orders.size,1);
  assert.equal(f.consumer.orders.get('t01').id,'DEMO-SR-ACTIVE');
  f.showScreen('c-home');f.click({ai:'start'});f.click({ai:'product',value:'b02'});f.fields({question:'台盆排水异常'});f.submit('c-ai-question-form','');
  assert.equal(f.assistant.snapshot().answer.kind,'no-match');
  assert.match(f.get('#phone-body').innerHTML,/不会套用其他型号的维修知识/);
  assert.doesNotMatch(f.get('#phone-footer').innerHTML,/已经解决/);
});

test('service request exploration still follows the newly registered product without creating an installation code', () => {
  const f = fixture();
  f.resetConsumer('welcome');
  chooseManual(f);
  finish(f);
  const added = copy(f.consumer.ownedProducts.at(-1));
  f.click({ serviceType: 'repair', go: 'c-repair' });
  f.fields({ description: '虚构问题描述' });
  f.submit('c-repair-form', 'c-contact');
  f.fields({ contactName: '虚构顾客', phone: '13800000000', address: '虚构地址', preferredDate: '2026-09-15', preferredTime: 'morning' });
  f.submit('c-contact-form', 'c-confirm');
  f.fields({ privacyConsent: true });
  f.submit('c-confirm-form', 'c-submit-result');
  assert.equal(f.consumer.lastSubmitted.productId, added.id);
  assert.equal(f.consumer.lastSubmitted.productName, added.name);
  assert.equal(f.consumer.ownedProducts.at(-1).installationCode, '');
});

test('switching from a scan attempt or retired method does not discard a manual registration draft', () => {
  const f = fixture();
  f.resetConsumer('welcome');
  chooseManual(f);
  f.fields({ purchaseDate: '2026-09-01' });
  f.submit('c-purchase-date-form', 'c-purchase');
  f.fields(personal);
  f.click({ regMethod: 'product-code' });
  f.click({ codeExample: 'valid' });
  assert.equal(f.registrationDraft().lookupStatus, 'matched-instance');
  f.click({ regMethod: 'installation-code' });
  assert.equal(f.current().id, 'c-installation-code');
  f.click({ regMethod: 'manual' });
  assert.equal(f.registrationDraft().catalogProductId, 't01');
  assert.equal(f.registrationDraft().userName, personal.userName);
  assert.equal(f.registrationDraft().purchaseDate, '2026-09-01');
  f.click({ go: 'c-purchase-date' });
  finish(f);
  assert.equal(f.consumer.ownedProducts.length, 1);
  assert.equal(f.consumer.ownedProducts[0].installationCode, '');
});

test('switching between existing and newly registered products never carries installation codes across records', () => {
  const f = fixture();
  chooseManual(f);
  finish(f);
  const id = f.consumer.productId;
  f.click({ product: 't01', go: 'c-product' });
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /DEMO-INSTALL-001/);
  f.click({ productInfo: '' });
  assert.match(f.get('#phone-body').innerHTML, /DEMO-INSTALL-001/);
  f.click({ registrationRecord: 'current', go: 'c-register-result' });
  assert.match(f.get('#phone-body').innerHTML, /DEMO-INSTALL-001/);
  f.click({ product: id, go: 'c-product' });
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /DEMO-INSTALL/);
  f.click({ productInfo: '' });
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /DEMO-INSTALL/);
  f.click({ registrationRecord: 'current', go: 'c-register-result' });
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /DEMO-INSTALL/);
  assert.match(f.get('#phone-body').innerHTML, /无码辅助添加/);
});


const serviceOrder = (product, overrides = {}) => ({
  id: `DEMO-TEST-${product.id}`, productId: product.id, productIds: [product.id],
  productName: product.name, serviceType: 'repair', status: 'pending',
  description: '虚构服务问题', contactName: '虚构顾客', phone: '13800000000', address: '虚构地址',
  preferredDate: '2026-09-15', preferredTime: 'morning', ...overrides,
});
const renderedServiceButtons = f => [...f.get('#phone-body').innerHTML.matchAll(/<button\b([^>]*)>/g)].map(([, attributes]) =>
  Object.fromEntries([...attributes.matchAll(/data-([a-z-]+)="([^"]*)"/g)].map(([, name, value]) => [name.replace(/-([a-z])/g, (_, c) => c.toUpperCase()), value]))
);
const serviceProgressButton = f => {
  const buttons = renderedServiceButtons(f).filter(button => button.go === 'c-progress');
  assert.equal(buttons.length, 1, 'the selected service must expose one progress action');
  return buttons[0];
};

test('the service hub deduplicates a multi-product installation by order id', () => {
  const f = fixture();
  const [first, second] = f.consumer.ownedProducts;
  const order = serviceOrder(first, { serviceType: 'install', productIds: [first.id, second.id], productName: `${first.name}、${second.name}` });
  f.consumer.orders.set(first.id, order);
  f.consumer.orders.set(second.id, { ...order }); // Separate objects still represent the same application.
  f.consumer.productId = second.id;
  const orders = f.consumerContext().serviceOrders;
  assert.equal(orders.length, 1);
  assert.equal(orders[0].id, order.id);
  assert.deepEqual(copy(orders[0].productIds), [first.id, second.id]);
  f.showScreen('c-service');
  const action = serviceProgressButton(f);
  assert.equal(action.product, order.productId);
  f.click(action);
  assert.equal(f.current().id, 'c-progress');
  assert.equal(f.consumerContext().order.id, order.id);
});

test('the service hub exposes another product service when the current product has no active order', () => {
  const f = fixture();
  const [currentProduct, otherProduct] = f.consumer.ownedProducts;
  const order = serviceOrder(otherProduct);
  f.consumer.orders.set(otherProduct.id, order);
  f.consumer.productId = currentProduct.id;
  assert.equal(f.consumerContext().order, null);
  f.showScreen('c-service');
  assert.ok(f.get('#phone-body').innerHTML.includes(otherProduct.name));
  const action = serviceProgressButton(f);
  assert.equal(action.product, otherProduct.id);
  f.click(action);
  assert.equal(f.current().id, 'c-progress');
  assert.equal(f.consumer.productId, otherProduct.id);
  assert.equal(f.consumerContext().order.id, order.id);
});

test('the service hub prefers the current order and switches service records without returning home', () => {
  const f = fixture();
  const [first, second] = f.consumer.ownedProducts;
  f.consumer.orders.set(first.id, serviceOrder(first));
  f.consumer.orders.set(second.id, serviceOrder(second, { status: 'confirmed', confirmedDate: '2026-09-16', confirmedTime: 'afternoon' }));
  f.consumer.productId = second.id; // The current order must win over the first aggregate record.
  f.showScreen('c-service');
  assert.equal(serviceProgressButton(f).product, second.id);
  for (const product of [first, second]) {
    const action = renderedServiceButtons(f).find(button => button.product === product.id && button.go === 'c-service');
    assert.ok(action, 'each service record must be selectable within the service hub');
    f.click(action);
    assert.equal(f.current().id, 'c-service');
    assert.equal(f.consumer.productId, product.id);
    assert.equal(serviceProgressButton(f).product, product.id);
  }
});

test('pending service does not present requested or stale confirmation times as a confirmed arrangement', () => {
  const f = fixture();
  const product = f.consumer.ownedProducts[0];
  const order = serviceOrder(product, { preferredDate: '2026-09-17', preferredTime: '期望时段示例', confirmedDate: '2026-09-19', confirmedTime: '确认时段示例' });
  f.consumer.orders.set(product.id, order);
  f.showScreen('c-service');
  const pending = f.get('#phone-body').innerHTML.replace(/<[^>]+>/g, ' ');
  assert.ok(!pending.includes(order.confirmedDate));
  assert.ok(!pending.includes(order.confirmedTime));
  assert.ok(!pending.includes(order.preferredDate) || /期望/.test(pending), 'a requested date must remain identified as a preference');
  assert.doesNotMatch(pending, /时间已确认|已确认时间|安排已确认/);
  order.status = 'confirmed';
  f.showScreen('c-service');
  const confirmed = f.get('#phone-body').innerHTML;
  assert.ok(confirmed.includes(order.confirmedDate));
  assert.ok(confirmed.includes(order.confirmedTime));
});

test('an empty service hub does not imply active service or offer a progress action', () => {
  for (const scenario of ['registered', 'welcome']) {
    const f = fixture();
    f.resetConsumer(scenario);
    f.showScreen('c-service');
    assert.equal(f.consumerContext().serviceOrders.length, 0);
    assert.doesNotMatch(f.get('#phone-body').innerHTML, /正在为这件产品服务/);
    assert.equal(renderedServiceButtons(f).filter(button => button.go === 'c-progress').length, 0);
  }
});


const preferenceFields = (f, selected) => {
  f.get('#phone-body').fields = [['interests','smart-toilet'],['interests','bathtub'],['contentPreferences','care'],['contentPreferences','offers']].map(([name,value])=>({name,value,type:'checkbox',checked:selected.includes(value)}));
};
test('preference drafts survive navigation and save independently from profile and purchases', () => {
  const f=fixture({hash:'#c-profile'}), purchases=copy(f.consumer.ownedProducts);
  f.change('userName','资料更新');
  f.click({go:'c-preferences'});
  assert.equal(f.account.profile().preferencesSaved,false);
  assert.deepEqual(copy(f.account.profile().interests),[]);
  preferenceFields(f,['smart-toilet','care','offers']);
  f.click({go:'c-profile'});
  assert.match(f.get('#phone-body').innerHTML,/资料更新/);
  assert.equal(f.account.profile().preferencesSaved,false);
  f.click({go:'c-preferences'});
  assert.match(f.get('#phone-body').innerHTML,/value="care" checked/);
  preferenceFields(f,['smart-toilet','care','offers']);
  f.submit('c-preferences-form');
  assert.deepEqual(copy(f.account.profile().interests),['smart-toilet']);
  assert.deepEqual(copy(f.account.profile().contentPreferences),['care','offers']);
  assert.equal(f.account.profile().userName,'资料更新');
  f.click({go:'c-profile'});
  f.change('address','单项更新地址');
  assert.deepEqual(copy(f.account.profile().contentPreferences),['care','offers']);
  assert.deepEqual(copy(f.consumer.ownedProducts),purchases);
});
test('preferences can be cleared and empty saved selections differ from an untouched profile', () => {
  const f=fixture({hash:'#c-preferences'});
  preferenceFields(f,['smart-toilet','care']);f.submit('c-preferences-form');
  f.click({account:'clear-preferences'});
  assert.deepEqual(copy(f.account.profile().interests),['smart-toilet']);
  preferenceFields(f,[]);f.submit('c-preferences-form');
  assert.deepEqual(copy(f.account.profile().interests),[]);
  assert.deepEqual(copy(f.account.profile().contentPreferences),[]);
  assert.equal(f.account.profile().preferencesSaved,true);
  f.resetConsumer();
  assert.equal(f.account.profile().preferencesSaved,false);
});
const avatarFile = {type:'image/png',size:256,data:'data:image/png;base64,DEMO'};
test('avatar updates independently, validates files, preserves the saved image on failure, and allows replacing it', () => {
  const f=fixture({hash:'#c-profile'});
  f.upload(null);assert.equal(f.readers.length,0);
  f.upload({type:'image/svg+xml',size:50});assert.equal(f.readers.length,0);
  f.upload({...avatarFile,size:6*1024*1024});assert.equal(f.readers.length,0);
  f.upload(avatarFile);
  assert.equal(f.account.profile().avatar,'');
  f.readers[0].onload();f.images[0].onload();
  assert.equal(f.account.profile().avatar,avatarFile.data);
  assert.match(f.get('#phone-body').innerHTML,/data:image\/png;base64,DEMO/);
  f.click({go:'c-mine'});assert.match(f.get('#phone-body').innerHTML,/data:image\/png;base64,DEMO/);
  f.click({go:'c-profile'});f.upload(avatarFile);f.readers[1].onload();f.images[1].onerror();
  assert.equal(f.account.profile().avatar,avatarFile.data);
  f.upload({...avatarFile,data:'data:image/png;base64,REPLACED'});f.readers[2].onload();f.images[2].onload();
  assert.equal(f.account.profile().avatar,'data:image/png;base64,REPLACED');
  f.resetConsumer();f.showScreen('c-mine');assert.match(f.get('#phone-body').innerHTML,/default-avatar.svg/);
});
test('late avatar reads cannot overwrite a newer choice or revive a reset profile', () => {
  const f=fixture({hash:'#c-profile'});
  f.upload(avatarFile);f.readers[0].onload();
  f.upload({...avatarFile,data:'data:image/png;base64,NEW'});f.readers[1].onload();f.images[1].onload();
  f.images[0].onload();
  assert.equal(f.account.profile().avatar,'data:image/png;base64,NEW');
  f.upload(avatarFile);f.readers[2].onload();f.resetConsumer();f.images[2].onload();
  assert.equal(f.account.profile().avatar,'');
});


test('worker home overview buttons filter the current list without schedule or map pages',()=>{
  const f=fixture({hash:'#w-tasks'}),body=f.get('#phone-body');
  assert.match(body.innerHTML,/待处理任务快捷筛选/);assert.doesNotMatch(body.innerHTML,/data-wsched|data-wmap/);
  f.click({worker:'dashboard-filter',value:'today'});assert.equal(f.current().id,'w-tasks');assert.equal(f.worker.snapshot().filter,'today');assert.equal(f.worker.filteredTasks().length,2);
  f.click({worker:'dashboard-filter',value:'parts'});assert.equal(f.current().id,'w-tasks');assert.equal(f.worker.snapshot().filter,'parts');assert.equal(f.worker.filteredTasks().length,1);
  assert.equal(f.apps.worker.screens.some(page=>['w-schedule','w-map'].includes(page.id)),false);
});
