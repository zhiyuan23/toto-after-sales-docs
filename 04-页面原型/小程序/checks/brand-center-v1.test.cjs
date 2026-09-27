'use strict';
// Run with: node --test checks/brand-center-v1.test.cjs
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
    insertAdjacentHTML() {}, dataset: {}, fields: [], style: {}, hidden: false, value: '', textContent: '', disabled: false,
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
    window: { TOTO_CONSUMER_VERSION:'brand-center-v1', addEventListener: (type, fn) => windowEvents.set(type, fn) },
  });
  for (const file of ['consumer.js', 'worker.js', 'consumer-outlets.js', 'consumer-account.js', 'consumer-ai.js', 'brand-center-v1.js']) vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
  const source = readFileSync(resolve(root, 'brand-center-v1-app.js'), 'utf8');
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

test('single service goes straight to its product progress and second-level pages have no tab bar', () => {
  const f=fixture();
  assert.match(f.get('#phone-body').innerHTML,/data-product="t01" data-go="c-progress"/);
  f.click({product:'t01',go:'c-progress'});
  assert.equal(f.current().id,'c-progress');
  assert.match(f.get('#phone-body').innerHTML,/DEMO-SR-001/);
  assert.equal(f.get('#phone-tabs').innerHTML,'');
});
test('multiple services remain associated with the correct product and pending is not confirmed', () => {
  const f=fixture(); f.resetConsumer('multiple');f.showScreen('c-home');
  assert.match(f.get('#phone-body').innerHTML,/2 项服务进行中/);
  f.click({go:'c-service'});
  f.click({product:'b02',go:'c-progress'});
  const body=f.get('#phone-body').innerHTML;
  assert.match(body,/DEMO-SR-002/); assert.match(body,/LW1535B/);
  assert.match(body,/等待联系/); assert.doesNotMatch(body,/已确认预约/);
});
test('no services and visitors hide progress while public help remains available', () => {
  const f=fixture();
  for(const scenario of ['registered','visitor','unlinked','welcome']){
    f.resetConsumer(scenario);f.showScreen('c-home');
    assert.doesNotMatch(f.get('#phone-body').innerHTML,/class="bc-service-card/);
    assert.match(f.get('#phone-body').innerHTML,/data-go="c-customer-service"/);
    if(scenario!=='registered') assert.doesNotMatch(f.get('#phone-body').innerHTML,/bc-owned-image/);
  }
  f.resetConsumer('visitor');f.showScreen('c-products');f.click({bcAccess:'c-register'});
  assert.equal(f.current().id,'bc-access');f.click({bcLogin:''});assert.equal(f.current().id,'c-register');
});
test('product tab enters its own archive rather than editorial homepage', () => {
  const f=fixture();f.click({go:'c-products'});
  assert.match(f.get('#phone-body').innerHTML,/data-product="b02" data-go="c-product"/);
  f.click({product:'b02',go:'c-product'});
  assert.match(f.get('#phone-body').innerHTML,/LW1535B/);
  f.click({go:'bc-guide'});assert.match(f.get('#phone-body').innerHTML,/LW1535B/);
});
test('all consumer screens, root tabs and review views render for supported scenarios', () => {
  const f=fixture();
  assert.deepEqual(copy(f.apps.consumer.tabs.map(t=>t.go)),['c-home','c-products','c-mine']);
  for(const scenario of ['confirmed','registered','pending','multiple','visitor','unlinked','welcome']){
    f.resetConsumer(scenario);
    for(const s of f.apps.consumer.screens){f.showScreen(s.id);assert.doesNotMatch(f.get('#phone-body').innerHTML,/\[object Object\]|undefined/);}
    f.showScreen('c-home');f.renderFlows();f.renderAtlas();
  }
});
test('completed or cancelled service does not stay in the homepage active summary', () => {
  const f=fixture();
  for(const status of ['completed','closed','cancelled']){
    f.consumer.orders.get('t01').status=status;f.showScreen('c-home');
    assert.doesNotMatch(f.get('#phone-body').innerHTML,/class="bc-service-card/);
  }
});
