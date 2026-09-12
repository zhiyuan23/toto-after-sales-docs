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
  const elements = new Map(), events = new Map(), windowEvents = new Map();
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
    history: { replaceState(_state, _title, next) { location.hash = next; } },
    setTimeout: () => 1, clearTimeout() {},
    window: { addEventListener: (type, fn) => windowEvents.set(type, fn) },
  });
  for (const file of ['consumer.js', 'worker.js', 'consumer-outlets.js']) vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
  const source = readFileSync(resolve(root, 'app.js'), 'utf8');
  // Expose closure state only in this VM copy, keeping the prototype's production global surface unchanged.
  const hook = 'window.testController={consumer,registrationDraft,registrationContext,completeRegistration,lookupRegistrationCode,resetConsumer,showScreen,consumerContext,renderFlows,renderAtlas,current:()=>current};';
  const index = source.lastIndexOf('})();');
  assert.ok(index > 0);
  vm.runInContext(source.slice(0, index) + hook + source.slice(index), context, { filename: 'app.js' });
  const api = context.window.testController;
  const fields = values => { get('#phone-body').fields = Object.entries(values).map(([name, value]) => ({ name, type: typeof value === 'boolean' ? 'checkbox' : 'text', value: typeof value === 'boolean' ? '' : value, checked: value === true })); };
  const click = dataset => events.get('click')({ preventDefault() {}, target: { closest: () => ({ dataset, disabled: false, hasAttribute: () => false }) } });
  const submit = (id, target, valid = true) => {
    const form = {
      id, dataset: { submitGo: target }, checkValidity: () => valid,
      hasAttribute: name => name === 'id' || name === 'data-submit-go',
      matches(selector) {
        const match = /^form(?:\[([a-z-]+)\])?$/.exec(selector);
        return Boolean(match && (!match[1] || this.hasAttribute(match[1])));
      },
      closest(selector) { return this.matches(selector) ? this : null; },
    };
    // A submit event targets its form; distinguish normal submissions from outlet search forms.
    events.get('submit')({ preventDefault() {}, target: form });
  };
  return { ...api, api, apps: context.window.TOTO_SCREENS, get, fields, click, submit, location, windowEvents };
}
const copy = value => JSON.parse(JSON.stringify(value));
const personal = { userName: '虚构顾客', phone: '13800000000', useType: 'self', region: '示例省 / 示例市 / 示例区', address: '虚构地址一号', privacyConsent: true };
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

test('product label examples only select catalog goods; prior labels and installation codes never imply ownership', () => {
  const f = fixture();
  f.click({ regMethod: 'product-code' });
  f.fields({ productCode: 'DEMO-PRODUCT-001' });
  f.submit('c-product-code-form', 'c-register-result'); // Target is ignored in favor of the permitted transition.
  assert.equal(f.current().id, 'c-code-result');
  assert.equal(f.registrationDraft().lookupStatus, 'matched');
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
  assert.equal(f.registrationDraft().lookupStatus, 'matched');
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
});

test('misentered installation codes cannot reach purchase details or registration by hash, form target or stale method', () => {
  for (const value of ['DEMO-INSTALL-003', 'TOTO-9007199254740993']) {
    const f = fixture();
    f.resetConsumer('welcome');
    f.click({ regMethod: 'product-code' });
    f.fields({ productCode: value });
    f.submit('c-product-code-form', 'c-register-result');
    assert.equal(f.current().id, 'c-code-result');
    assert.equal(f.registrationDraft().lookupStatus, 'wrong-type');
    assert.equal(f.registrationContext().selectedProducts.length, 0);
    assert.doesNotMatch(f.get('#phone-footer').innerHTML, /data-go="c-purchase/);
    f.showScreen('c-purchase');
    assert.equal(f.current().id, 'c-product-code');
    assert.equal(f.completeRegistration(), false);
    assert.equal(f.consumer.ownedProducts.length, 0);
    assert.equal(f.consumer.registrationReceipt, null);
  }
  const f = fixture();
  f.resetConsumer('welcome');
  f.consumer.registrationMethod = 'installation-code';
  Object.assign(f.registrationDraft(), personal, { catalogProductId: 't01', purchaseDate: '2026-09-01', lookupStatus: 'matched', installationCode: 'DEMO-INSTALL-003' });
  assert.equal(f.registrationContext().selectedProducts.length, 0);
  assert.equal(f.lookupRegistrationCode(), false);
  assert.equal(f.completeRegistration(), false);
  assert.equal(f.current().id, 'c-installation-code');
  assert.equal(f.consumer.ownedProducts.length, 0);
  f.submit('c-installation-code-form', 'c-register-result');
  assert.equal(f.current().id, 'c-installation-code');
  assert.equal(f.consumer.registrationReceipt, null);
});

test('legacy hash, capture URL and registration method resolve to a non-submitting installation explanation', () => {
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
  assert.equal(f.current().id, 'c-product-code');
  f.click({ regMethod: 'installation-code' });
  assert.equal(f.current().id, 'c-installation-code');
  f.showScreen('c-code-help');
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /<form|<input|recoveryPhone/);
  f.location.hash = '#c-installation-code';
  f.windowEvents.get('hashchange')();
  assert.equal(f.current().id, 'c-installation-code');
});

test('old installation registration receipts cannot render a false success and only linked seed records display codes', () => {
  const f = fixture();
  const result = f.apps.consumer.screens.find(screen => screen.id === 'c-register-result');
  const context = f.consumerContext();
  assert.match(result.body(context), /DEMO-INSTALL-001/);
  assert.match(result.body(context), /已有购买登记/);
  assert.doesNotMatch(result.body(context), /登记完成，产品已添加/);
  assert.doesNotMatch(result.body({ ...context, product: { ...context.product, installationCodeLinked: false } }), /DEMO-INSTALL/);
  const stale = { method: 'installation-code', installationCode: 'DEMO-INSTALL-003', products: context.products };
  assert.doesNotMatch(result.body({ ...context, registrationReceipt: stale }), /登记完成，产品已添加|DEMO-INSTALL-003/);
  const purchase = f.apps.consumer.screens.find(screen => screen.id === 'c-purchase');
  assert.doesNotMatch(purchase.body({ ...context, registration: { method: 'installation-code', lookupStatus: 'matched', selectedProducts: context.products } }), /<form/);
});

test('required personal info and purchase dates still gate manual and label registration', () => {
  for (const method of ['manual', 'product-code']) {
    const f = fixture();
    f.resetConsumer('welcome');
    if (method === 'manual') chooseManual(f);
    else { f.click({ regMethod: method }); f.click({ codeExample: 'valid' }); }
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
  assert.equal(f.apps.consumer.screens.length, 26);
  assert.equal(f.apps.worker.screens.length, 15);
  assert.equal(ids.size, 41);
  let combinations = 0;
  for (const scenario of ['welcome', 'registered', 'confirmed']) {
    f.resetConsumer(scenario);
    for (const method of ['manual', 'product-code', 'installation-code']) {
      f.consumer.registrationMethod = method;
      for (const status of ['idle', 'matched', 'not-found', 'wrong-type', 'owned']) {
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
  assert.equal(combinations, 7380);
  f.consumer.registrationMethod = 'manual';
  f.showScreen('c-home');
  f.renderFlows();
  assert.equal((f.get('#flows-view').innerHTML.match(/class="flow-card"/g) || []).length, 7);
  f.renderAtlas();
  assert.equal((f.get('#atlas-view').innerHTML.match(/class="screen-tile"/g) || []).length, 26);
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

test('misentered installation code and its retired method do not discard a manual registration draft', () => {
  const f = fixture();
  f.resetConsumer('welcome');
  chooseManual(f);
  f.fields({ purchaseDate: '2026-09-01' });
  f.submit('c-purchase-date-form', 'c-purchase');
  f.fields(personal);
  f.click({ regMethod: 'product-code' });
  f.click({ codeExample: 'wrong-type' });
  assert.equal(f.registrationDraft().lookupStatus, 'wrong-type');
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
  assert.match(f.get('#phone-body').innerHTML, /DEMO-INSTALL-001/);
  f.click({ registrationRecord: 'current', go: 'c-register-result' });
  assert.match(f.get('#phone-body').innerHTML, /DEMO-INSTALL-001/);
  f.click({ product: id, go: 'c-product' });
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /DEMO-INSTALL/);
  f.click({ registrationRecord: 'current', go: 'c-register-result' });
  assert.doesNotMatch(f.get('#phone-body').innerHTML, /DEMO-INSTALL/);
  assert.match(f.get('#phone-body').innerHTML, /这次登记未关联安装码/);
});

test('worker appointment and completion keep their existing form transitions and browser validity gate', () => {
  const f = fixture();
  f.showScreen('w-appointment');
  f.submit('', 'w-detail', false);
  assert.equal(f.current().id, 'w-appointment');
  f.submit('', 'w-detail');
  assert.equal(f.current().id, 'w-detail');
  f.showScreen('w-completion');
  f.submit('w-completion-form', 'w-review', false);
  assert.equal(f.current().id, 'w-completion');
  f.submit('w-completion-form', 'w-review');
  assert.equal(f.current().id, 'w-review');
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
