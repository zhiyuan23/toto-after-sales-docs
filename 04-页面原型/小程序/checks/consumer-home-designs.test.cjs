'use strict';
// Run with: node --test checks/consumer-home-designs.test.cjs
// Uses index.html's real bootstrap, script order, and controller. Visual QA remains a browser check.
const assert = require('node:assert/strict');
const { readFileSync, existsSync } = require('node:fs');
const { resolve } = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const root = resolve(__dirname, '..');
const styles = ['showcase', 'living', 'living-layered', 'living-editorial', 'concierge'];
const copy = value => JSON.parse(JSON.stringify(value));

function fixture({ search = '?consumerVersion=0.15', hash = '#c-home' } = {}) {
  const elements = new Map(), events = new Map(), windowEvents = new Map();
  const element = () => ({
    dataset: {}, fields: [], style: {}, hidden: false, value: '', textContent: '', disabled: false,
    classList: { add() {}, toggle() {} },
    set innerHTML(value) { this.html = value; this.fields = []; },
    get innerHTML() { return this.html || ''; },
    insertAdjacentHTML(position, value) {
      assert.ok(['afterbegin', 'beforeend'].includes(position));
      this.html = position === 'afterbegin' ? value + this.innerHTML : this.innerHTML + value;
    },
    querySelectorAll(selector) { return selector === 'input,select,textarea' ? this.fields : []; },
    querySelector() { return null; },
    addEventListener(type, fn) { this[type] = fn; },
  });
  const get = selector => {
    if (!elements.has(selector)) elements.set(selector, element());
    return elements.get(selector);
  };
  let url = new URL('https://prototype.example/miniprogram/index.html' + search + hash);
  const location = {};
  for (const key of ['href', 'hash', 'search', 'pathname']) {
    Object.defineProperty(location, key, { get: () => url[key], set: value => { url[key] = value; } });
  }
  const document = {
    body: element(), documentElement: element(), querySelector: get, querySelectorAll: () => [],
    dispatchEvent: event => { events.get(event.type)?.(event); return true; },
    addEventListener: (type, fn) => {
      const previous=events.get(type);
      events.set(type,event=>{previous?.(event);if(!event.immediateStopped)fn(event);});
    },
  };
  const context = vm.createContext({
    document, location, console, URL, URLSearchParams, Event,
    FileReader: class { readAsDataURL(file) { this.result = file.data; } },
    Image: class { set src(value) { this.value = value; } },
    history: { replaceState(_state, _title, next) { url = new URL(next, url); } },
    setTimeout: () => 1, clearTimeout() {},
    window: { addEventListener: (type, fn) => windowEvents.set(type, fn) },
  });
  const index = readFileSync(resolve(root, 'index.html'), 'utf8');
  const bootstrap = index.match(/<script>\s*([\s\S]*?)<\/script>/);
  assert.ok(bootstrap, 'index exposes its version bootstrap');
  vm.runInContext(bootstrap[1], context, { filename: 'index.html:bootstrap' });
  // Shared perspective navigation has its own frame/DOM fixture; this VM exercises the phone controller.
  const scripts = [...index.matchAll(/<script\b[^>]*\bsrc="([^"?]+)(?:\?[^"<>]*)?"[^>]*><\/script>/g)].map(match => match[1]).filter(file => !file.startsWith('../'));
  assert.equal(scripts.at(-1), 'app.js', 'controller runs after its screen adapters');
  let originalHomeBody;
  for (const file of scripts) {
    if (file === 'consumer-home.js') originalHomeBody = context.window.TOTO_SCREENS.consumer.screens.find(screen => screen.id === 'c-home').body;
    let source = readFileSync(resolve(root, file), 'utf8');
    if (file === 'app.js') {
      const end = source.lastIndexOf('})();');
      assert.ok(end > 0);
      // Expose closure state in this VM copy only; no globals are added to the actual prototype.
      const hook = 'window.testController={consumer,registrationDraft,resetConsumer,showScreen,consumerContext,renderState,drafts,namedDrafts,submitted,current:()=>current};';
      source = source.slice(0, end) + hook + source.slice(end);
    }
    vm.runInContext(source, context, { filename: file });
  }
  const api = context.window.testController;
  const fields = values => {
    get('#phone-body').fields = Object.entries(values).map(([name, value]) => ({
      name, type: typeof value === 'boolean' ? 'checkbox' : 'text',
      value: typeof value === 'boolean' ? '' : value, checked: value === true,
    }));
  };
  const click = dataset => events.get('click')({ preventDefault() {}, stopImmediatePropagation(){this.immediateStopped=true;}, target: { closest: () => ({
    dataset, disabled: false,
    hasAttribute(name) {
      return name.startsWith('data-') && Object.hasOwn(dataset, name.slice(5).replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()));
    },
  }) } });
  const change = (id, value) => events.get('change')({ target: { id, value, dataset: {}, hasAttribute: () => false } });
  return {
    ...api, get, click, change, fields, location, scripts, originalHomeBody,
    dispatch: (type, event) => events.get(type)?.(event),
    version: context.window.TOTO_CONSUMER_VERSION, apps: context.window.TOTO_SCREENS,
    designs: context.window.TOTO_HOME_DESIGNS, variants: context.window.TOTO_HOME_VARIANTS,
    assistant: context.window.TOTO_AI_ASSISTANT, html: () => get('#phone-body').innerHTML,
  };
}

function buttons(html) {
  return [...html.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/g)].map(match => {
    const opening = match[0].slice(0, match[0].indexOf('>') + 1);
    const dataset = Object.fromEntries([...opening.matchAll(/\bdata-([a-z-]+)(?:="([^"]*)")?/g)].map(attr => [
      attr[1].replace(/-([a-z])/g, (_match, letter) => letter.toUpperCase()),
      (attr[2] || '').replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>'),
    ]));
    return { html: match[0], dataset };
  });
}

function action(f, predicate, description) {
  const found = buttons(f.html()).find(button => predicate(button.dataset));
  assert.ok(found, description || 'expected action is rendered');
  return found;
}

function choose(f, style) {
  const direction = style.startsWith('living') ? 'space' : style;
  const option = buttons(f.get('#home-design-picker').innerHTML).find(button => button.dataset.homeDesign === direction);
  assert.ok(option, `picker exposes ${direction}`);
  f.click(option.dataset);
  if (style.startsWith('living')) {
    const select = f.get('#home-design-picker').innerHTML.match(/<select\b[^>]*\bid="([^"]+)"[^>]*>([\s\S]*?)<\/select>/);
    assert.ok(select, 'space direction exposes its layout select');
    assert.ok(select[2].includes(`value="${style}"`), `layout select exposes ${style}`);
    f.change(select[1], style);
  }
  assert.equal(f.designs.selected(), style);
  assert.equal(f.current().id, 'c-home');
  assert.equal(f.get('#phone').dataset.homeStyle, style);
}

function snapshot(f) {
  return copy({
    products: f.consumer.ownedProducts, productId: f.consumer.productId,
    orders: [...f.consumer.orders], forms: [...f.consumer.forms], media: [...f.consumer.media],
    registrationDrafts: [...f.consumer.registrationDrafts], registrationMethod: f.consumer.registrationMethod,
    drafts: [...f.drafts], namedDrafts: [...f.namedDrafts], submitted: [...f.submitted],
    lastSubmitted: f.consumer.lastSubmitted, nextInstance: f.consumer.nextInstance,
    hasProducts: f.consumer.hasProducts, visitor: f.consumer.visitor,
    phoneAuthorized: f.consumer.phoneAuthorized, phoneSyncStatus: f.consumer.phoneSyncStatus,
  });
}

function assertHelp(f) {
  assert.equal(buttons(f.html()).filter(button => button.dataset.ai === 'start').length, 1);
  assert.equal(buttons(f.html()).filter(button => button.dataset.go === 'c-outlets').length, 1);
  assert.equal(buttons(f.html()).filter(button => button.dataset.go === 'c-customer-service').length, 1);
  for (const file of ['assistant-purple-v1.png', 'outlets-teal-v1.png', 'support-orange-v1.png']) {
    assert.ok(existsSync(resolve(root, 'assets/help-icons', file)), `${file} is a runtime resource`);
    assert.ok(f.html().includes(`assets/help-icons/${file}`));
  }
  assert.doesNotMatch(f.html(), /data-action=/, 'visual action names are translated into controller events');
}

test('v0.16 keeps public discovery and three support entries usable in guest and member scenarios', () => {
  const f = fixture({ search: '?consumerVersion=0.16' });
  assert.equal(f.version, '0.16');
  assert.equal(f.consumer.visitor, true);
  for (const scenario of ['visitor', 'unlinked', 'registered', 'pending', 'confirmed', 'multiple']) {
    f.resetConsumer(scenario);
    f.showScreen('c-home');
    assert.match(f.html(), /bp-home/);
    assert.equal(f.get('#phone-floating').innerHTML, '');
    for (const go of ['c-brand-catalog', 'c-brand-story', 'c-outlets']) {
      const entry = buttons(f.html()).find(button => button.dataset.go === go);
      assert.ok(entry, `${scenario}: ${go} visible`);
      f.click(entry.dataset);
      assert.equal(f.current().id, go);
      f.showScreen('c-home');
    }
    f.click(buttons(f.html()).find(button => button.dataset.ai === 'start').dataset);
    assert.equal(f.current().id, 'c-ai-assistant');
    f.showScreen('c-home');
    f.click(buttons(f.html()).find(button => button.dataset.go === 'c-customer-service').dataset);
    assert.equal(f.consumer.customerServiceOpen, true);
    assert.equal(f.current().id, 'c-home');
  }
});

test('v0.16 public product selection opens the matching v0.14 detail without creating ownership', () => {
  const f = fixture({ search: '?consumerVersion=0.16' });
  for (const [product, model] of [['t01', 'CES8G820GCN'], ['b02', 'LW1535B']]) {
    f.showScreen('c-home');
    f.click(buttons(f.html()).find(button => button.dataset.brandProduct === product).dataset);
    assert.equal(f.current().id, 'c-brand-product');
    assert.match(f.html(), new RegExp(model));
    assert.equal(f.consumer.ownedProducts.length, 0);
    assert.equal(f.consumer.visitor, true);
  }
});

test('v0.15 bootstraps the five layouts and keeps its selection in the current URL', () => {
  const f = fixture({ search: '?consumerVersion=0.15&review=keep' });
  assert.equal(f.version, '0.15');
  assert.equal(f.designs.selected(), 'living');
  assert.equal(f.consumer.visitor, false);
  assert.equal(f.consumer.ownedProducts.length, 2);
  assert.equal(f.get('#home-design-controls').hidden, false);
  assert.deepEqual(Object.keys(f.variants).sort(), [...styles].sort());
  assert.deepEqual(copy(f.designs.options.map(option => option.id)), styles);
  assert.deepEqual(buttons(f.get('#home-design-picker').innerHTML).map(button => button.dataset.homeDesign), ['showcase', 'space', 'concierge']);
  assert.ok(f.scripts.indexOf('consumer-brand.js') < f.scripts.indexOf('consumer-home.js'));
  assert.ok(f.scripts.indexOf('consumer-home-variants.js') < f.scripts.indexOf('consumer-home.js'));
  choose(f, 'showcase');
  const url = new URL(f.location.href);
  assert.equal(url.searchParams.get('consumerVersion'), '0.15');
  assert.equal(url.searchParams.get('homeStyle'), 'showcase');
  assert.equal(url.searchParams.get('review'), 'keep');
  assert.equal(url.hash, '#c-home');
  assert.equal(f.designs.choose('missing-layout'), false);
  assert.equal(f.designs.selected(), 'showcase');
  assert.equal(f.get('#phone-floating').innerHTML, '');
  const restored = fixture({ search: url.search, hash: url.hash });
  assert.equal(restored.designs.selected(), 'showcase');
  assert.match(restored.html(), /class="home-design variant v-showcase/);
  assert.equal(fixture({ search: '?consumerVersion=0.15&homeStyle=unknown' }).designs.selected(), 'living');
});

test('v0.14 and the no-version entry retain the original visitor brand home and floating assistant', () => {
  const explicit = fixture({ search: '?consumerVersion=0.14&homeStyle=showcase' });
  const defaultEntry = fixture({ search: '' });
  for (const f of [explicit, defaultEntry]) {
    assert.equal(f.version, '0.14');
    assert.equal(f.designs, undefined);
    assert.equal(f.variants, undefined);
    assert.equal(f.consumer.visitor, true);
    assert.equal(f.consumer.ownedProducts.length, 0);
    assert.equal(f.current().body, f.originalHomeBody);
    assert.equal(f.get('#home-design-controls').hidden, true);
    assert.match(f.html(), /class="brand-home"/);
    assert.doesNotMatch(f.html(), /home-design variant/);
    assert.match(f.get('#phone-floating').innerHTML, /data-ai="start"/);
  }
  assert.equal(explicit.html(), defaultEntry.html());
});

for (const version of ['0.11', '0.13']) {
  test(`v${version} is not overridden by the home or brand adapters`, () => {
    const f = fixture({ search: `?consumerVersion=${version}&homeStyle=concierge` });
    assert.equal(f.version, version);
    assert.equal(f.designs, undefined);
    assert.equal(f.variants, undefined);
    assert.equal(f.apps.consumer.screens.length, 32);
    assert.equal(f.current().body, f.originalHomeBody);
    assert.equal(f.get('#home-design-controls').hidden, true);
    assert.equal(f.consumer.ownedProducts.length, 3);
    assert.match(f.html(), /class="c-product-switcher"/);
    assert.doesNotMatch(f.html(), /home-design variant|class="brand-home"/);
    assert.match(f.get('#phone-floating').innerHTML, /data-ai="start"/);
  });
}

test('v0.14 keeps its original brand body for guest and member scenarios', () => {
  const f = fixture({ search: '?consumerVersion=0.14' });
  for (const scenario of ['visitor', 'unlinked', 'registered', 'pending', 'confirmed', 'multiple']) {
    f.resetConsumer(scenario);
    f.showScreen('c-home');
    assert.equal(f.current().body, f.originalHomeBody);
    assert.equal(f.html(), f.originalHomeBody(f.consumerContext()), scenario);
    assert.match(f.get('#phone-floating').innerHTML, /data-ai="start"/);
    assert.equal(f.get('#home-design-controls').hidden, true);
  }
});

test('the space direction remembers its latest sub-layout without resetting scenario data', () => {
  const f = fixture();
  f.resetConsumer('multiple');
  f.consumer.productId = 'b02';
  f.showScreen('c-home');
  const before = snapshot(f);
  for (const layout of ['living-layered', 'living-editorial']) {
    choose(f, layout);
    choose(f, 'concierge');
    assert.doesNotMatch(f.get('#home-design-picker').innerHTML, /<select/);
    f.click(action({ html: () => f.get('#home-design-picker').innerHTML }, data => data.homeDesign === 'space').dataset);
    assert.equal(f.designs.selected(), layout);
    assert.equal(new URL(f.location.href).searchParams.get('homeStyle'), layout);
    assert.deepEqual(snapshot(f), before);
  }
});

test('switching every layout preserves real service and registration drafts, products, and orders', () => {
  const f = fixture();
  f.showScreen('c-repair');
  f.fields({ description: '已填写但尚未提交的问题', problemType: 'flush' });
  f.click({ go: 'c-home' });
  f.showScreen('c-product-code');
  f.fields({ productCode: 'DEMO-INSTALL-003' });
  f.click({ go: 'c-home' });
  assert.equal(f.consumer.forms.get('t01:repair').description, '已填写但尚未提交的问题');
  assert.equal(f.registrationDraft().productCode, 'DEMO-INSTALL-003');
  f.consumer.media.set('t01:repair', 'failed');
  const order = { id: 'PRESERVED-ORDER', productId: 't01', status: 'pending', serviceType: 'repair', description: '正在处理的服务' };
  f.consumer.orders.set('t01', order);
  f.consumer.ownedProducts[0].name = '保留的产品名称';
  const products = f.consumer.ownedProducts, orders = f.consumer.orders, forms = f.consumer.forms;
  const before = snapshot(f);
  for (const style of styles) {
    choose(f, style);
    assert.deepEqual(snapshot(f), before, style);
    assert.equal(f.consumer.ownedProducts, products, style);
    assert.equal(f.consumer.orders, orders, style);
    assert.equal(f.consumer.forms, forms, style);
    assert.equal(f.consumerContext().order, order, style);
  }
});

for (const style of styles) {
  test(`${style}: pending, confirmed, and multiple orders drive the same service progress`, () => {
    const f = fixture({ search: `?consumerVersion=0.15&homeStyle=${style}` });
    for (const [scenario, productId, status] of [
      ['pending', 't01', 'pending'], ['confirmed', 't01', 'confirmed'],
      ['multiple', 't01', 'confirmed'], ['multiple', 'b02', 'pending'],
    ]) {
      f.resetConsumer(scenario);
      f.consumer.productId = productId;
      f.showScreen('c-home');
      const ctx = f.consumerContext();
      assert.equal(ctx.order.status, status);
      assert.equal(ctx.order, f.consumer.orders.get(productId));
      assert.equal(ctx.product, f.consumer.ownedProducts.find(product => product.id === productId));
      assert.ok(f.html().includes(ctx.product.name));
      const image = action(f, data => data.go === 'c-product').html;
      assert.ok(image.includes(`src="${ctx.product.image}"`), 'detail entry depicts the selected product');
      const selected = action(f, data => data.product === productId).html;
      assert.match(selected, /aria-pressed="true"/);
      const progress = buttons(f.html()).filter(button => button.dataset.go === 'c-progress');
      assert.equal(progress.length, 1, 'one active service entry');
      assert.match(f.html(), status === 'pending' ? /等待联系确认/ : /服务时间已确认/);
      if (status === 'pending') assert.doesNotMatch(f.html(), /服务时间已确认|时间已确认|联系已确认/);
      assert.match(progress[0].html, /查看进度/);
      assert.equal(buttons(f.html()).filter(button => button.dataset.serviceType).length, 0);
      assertHelp(f);
      const order = ctx.order;
      f.click(progress[0].dataset);
      assert.equal(f.current().id, 'c-progress');
      assert.equal(f.consumerContext().order, order);
      assert.equal(f.consumerContext().product.id, productId);
      assert.equal(f.consumer.orders.size, scenario === 'multiple' ? 2 : 1);
    }
  });

  test(`${style}: product switching stays home and detail, repair, and help actions use the current product`, () => {
    const f = fixture({ search: `?consumerVersion=0.15&homeStyle=${style}` });
    const product = f.consumer.ownedProducts.find(item => item.id === 'b02');
    f.click(action(f, data => data.product === 'b02').dataset);
    assert.equal(f.current().id, 'c-home');
    assert.equal(f.consumerContext().product, product);
    assert.equal(f.designs.selected(), style);
    assert.equal(f.location.hash, '#c-home');
    f.click(action(f, data => data.go === 'c-product').dataset);
    assert.equal(f.current().id, 'c-product');
    assert.equal(f.consumerContext().product, product);
    assert.ok(f.html().includes(product.name));
    f.showScreen('c-home');
    const service = buttons(f.html()).filter(button => button.dataset.serviceType);
    assert.equal(service.length, 1, 'one service application entry');
    assert.equal(service[0].dataset.serviceType, 'repair');
    assert.equal(service[0].dataset.go, 'c-repair');
    f.click(service[0].dataset);
    assert.equal(f.current().id, 'c-repair');
    assert.equal(f.consumerContext().product, product);
    assert.equal(f.consumer.serviceType, 'repair');
    assert.equal(f.consumer.orders.size, 0, 'opening the request does not create an order');
    f.showScreen('c-home');
    assertHelp(f);
    f.click(action(f, data => data.ai === 'start').dataset);
    assert.equal(f.current().id, 'c-ai-assistant');
    assert.equal(f.assistant.snapshot().productId, 'b02');
    assert.equal(f.assistant.snapshot().stage, 'asking');
    f.showScreen('c-home');
    f.click(action(f, data => data.go === 'c-outlets').dataset);
    assert.equal(f.current().id, 'c-outlets');
    f.showScreen('c-home');
    f.click(action(f, data => data.go === 'c-customer-service').dataset);
    assert.equal(f.current().id, 'c-home');
    assert.equal(f.consumer.customerServiceOpen, true);
    assert.equal(f.consumer.customerServiceContext.source, 'c-home');
    assert.match(f.get('#outlet-overlay').innerHTML, /data-customer-channel="phone"/);
    assert.match(f.get('#outlet-overlay').innerHTML, /data-customer-channel="online"/);
    assert.equal(f.consumerContext().product, product);
  });

  test(`${style}: no-product help remains public and error retry preserves products and orders`, () => {
    const f = fixture({ search: `?consumerVersion=0.15&homeStyle=${style}` });
    f.resetConsumer('unlinked');
    f.showScreen('c-home');
    assert.equal(f.current().id, 'c-home');
    assert.equal(f.consumer.ownedProducts.length, 0);
    assertHelp(f);
    assert.match(f.html(), /data-go="c-register"/);
    assert.match(f.html(), /data-phone-sync/);
    assert.equal(buttons(f.html()).filter(button => button.dataset.serviceType || button.dataset.go === 'c-progress').length, 0);
    f.click(action(f, data => data.ai === 'start').dataset);
    assert.equal(f.current().id, 'c-ai-assistant');
    assert.equal(f.assistant.snapshot().stage, 'no-product');
    assert.equal(f.assistant.snapshot().productId, '');
    f.showScreen('c-home');
    f.click(action(f, data => data.go === 'c-outlets').dataset);
    assert.equal(f.current().id, 'c-outlets');
    f.showScreen('c-home');
    f.click(action(f, data => data.go === 'c-customer-service').dataset);
    assert.equal(f.consumer.customerServiceOpen, true);
    assert.equal(f.current().id, 'c-home');
    assert.equal(f.consumer.ownedProducts.length, 0);
    f.showScreen('c-home');
    f.click(action(f, data => data.go === 'c-register').dataset);
    assert.equal(f.current().id, 'c-register');
    f.resetConsumer('visitor');
    f.showScreen('c-home');
    assertHelp(f);
    f.click(action(f, data => data.brandAccess === 'c-register').dataset);
    assert.equal(f.current().id, 'c-brand-access', 'visitor add uses the original private-feature access flow');
    f.resetConsumer('multiple');
    f.consumer.productId = 'b02';
    f.showScreen('c-home');
    const before = snapshot(f);
    f.renderState('error');
    assert.match(f.html(), /暂时无法读取产品/);
    assertHelp(f);
    assert.equal(buttons(f.html()).filter(button => button.dataset.serviceType || button.dataset.go === 'c-progress').length, 0);
    const retry = action(f, data => Object.hasOwn(data, 'retry'));
    assert.deepEqual(snapshot(f), before);
    f.click(retry.dataset);
    assert.equal(f.current().id, 'c-home');
    assert.equal(f.designs.selected(), style);
    assert.match(f.html(), /等待联系确认/);
    assert.deepEqual(snapshot(f), before);
    assert.equal(f.get('#ui-state').value, 'normal');
  });
}

test('v0.17 uses owned-product-specific mutually exclusive install and repair entries', () => {
  const f=fixture({search:'?consumerVersion=0.17',hash:'#c-product-hub'});
  assert.equal(f.version,'0.17');
  assert.equal(f.consumer.visitor,false);
  assert.match(f.html(),/pc-home/);
  assert.equal(f.get('#phone-floating').innerHTML,'');
  assert.deepEqual(buttons(f.html()).filter(b=>b.dataset.serviceType).map(b=>b.dataset.serviceType),['install']);
  f.click(action(f,d=>d.serviceType==='install').dataset);
  assert.equal(f.current().id,'c-install');
  f.showScreen('c-product-hub');
  f.click(action(f,d=>d.product==='b02').dataset);
  assert.equal(f.consumer.productId,'b02');
  assert.match(f.html(),/LW1535B/);
  assert.deepEqual(buttons(f.html()).filter(b=>b.dataset.serviceType).map(b=>b.dataset.serviceType),['repair']);
  f.click(action(f,d=>d.serviceType==='repair').dataset);
  assert.equal(f.current().id,'c-repair');
  f.resetConsumer('installed');f.showScreen('c-product-hub');
  assert.deepEqual(buttons(f.html()).filter(b=>b.dataset.serviceType).map(b=>b.dataset.serviceType),['repair']);
});

test('v0.17 gives each product order priority over new service actions',()=>{
  const f=fixture({search:'?consumerVersion=0.17',hash:'#c-product-hub'});
  for(const scenario of ['pending','confirmed','multiple']) {
    f.resetConsumer(scenario);f.showScreen('c-product-hub');
    assert.equal(buttons(f.html()).filter(b=>b.dataset.serviceType).length,0);
    f.click(action(f,d=>d.go==='c-progress').dataset);
    assert.equal(f.current().id,'c-progress');
    f.showScreen('c-product-hub');
    f.click(action(f,d=>d.product==='b02').dataset);
    assert.equal(buttons(f.html()).filter(b=>b.dataset.go==='c-progress').length,scenario==='multiple'?1:0);
  }
  f.resetConsumer('confirmed');
  f.consumer.orders.get('t01').status='completed';f.showScreen('c-product-hub');
  assert.match(f.html(),/服务已完成/);
  assert.equal(buttons(f.html()).filter(b=>b.dataset.serviceType).length,0);
});

test('v0.17 keeps help, binding, and product detail destinations available across scenarios',()=>{
  const f=fixture({search:'?consumerVersion=0.17',hash:'#c-product-hub'});
  for(const scenario of ['visitor','unlinked','registered','installed','pending','confirmed','multiple']) {
    f.resetConsumer(scenario);f.showScreen('c-product-hub');
    f.click(action(f,d=>d.ai==='start').dataset);assert.equal(f.current().id,'c-ai-assistant');f.showScreen('c-product-hub');
    f.click(action(f,d=>d.go==='c-outlets').dataset);assert.equal(f.current().id,'c-outlets');f.showScreen('c-product-hub');
    f.click(action(f,d=>d.go==='c-customer-service').dataset);assert.equal(f.consumer.customerServiceOpen,true);f.showScreen('c-product-hub');
    if(['visitor','unlinked'].includes(scenario)) {
      assert.equal(buttons(f.html()).filter(b=>b.dataset.serviceType).length,0);
      f.click(action(f,d=>d.brandAccess==='c-register'||d.go==='c-register').dataset);
      assert.equal(f.current().id,scenario==='visitor'?'c-brand-access':'c-register');
    } else {
      f.click(action(f,d=>d.go==='c-product').dataset);assert.equal(f.current().id,'c-product');
    }
  }
});

test('v0.17 exploration and service tabs preserve data while the product-page alternative stays available',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  assert.deepEqual(copy(f.apps.consumer.tabs.map(t=>[t.label,t.go])),[['探索','c-home'],['服务','c-service'],['我的','c-mine']]);
  f.resetConsumer('multiple');f.showScreen('c-product-hub');
  assert.match(f.html(),/pc-product/);assert.match(f.get('#phone-tabs').innerHTML,/c-product-hub/);
  f.click(action(f,d=>d.product==='b02').dataset);
  assert.match(f.html(),/LW1535B/);assert.match(f.html(),/申请已收到/);
  const before=snapshot(f);f.showScreen('c-home');
  for(const go of ['c-mine','c-home','c-service']) {
    f.click(buttons(f.get('#phone-tabs').innerHTML).find(b=>b.dataset.go===go).dataset);
    assert.equal(f.current().id,go);
    for(const key of ['products','productId','orders','forms','media','registrationDrafts','submitted']) assert.deepEqual(snapshot(f)[key],before[key]);
  }
  f.showScreen('c-mine');f.click(action(f,d=>d.go==='c-service').dataset);assert.equal(f.current().id,'c-service');
});

test('v0.17 home restores product image, model, and matching install or repair action',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  f.resetConsumer('registered');f.showScreen('c-home');
  for(const [id,go,type] of [['t01','c-install','install'],['b02','c-repair','repair']]) {
    f.click(action(f,d=>d.homeProduct===id).dataset);
    assert.match(f.html(),/hc-product-visual/);assert.match(f.html(),/hc-product-info/);
    assert.equal(buttons(f.html()).filter(b=>b.dataset.serviceType).length,1);
    f.click(action(f,d=>d.product===id&&d.serviceType===type).dataset);
    assert.equal(f.current().id,go);assert.equal(f.consumer.productId,id);assert.equal(f.consumer.serviceType,type);
    f.showScreen('c-home');
    f.click(action(f,d=>d.product===id&&d.go==='c-product').dataset);
    assert.equal(f.current().id,'c-product');assert.equal(f.consumer.productId,id);f.showScreen('c-home');
  }
  assert.doesNotMatch(f.html(),/ex-collection|ex-service-card|data-brand-product/);
});

test('v0.17 exploration help and brand content stay public without fake owned cards',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  for(const scenario of ['visitor','unlinked','registered','pending','confirmed']) {
    f.resetConsumer(scenario);f.showScreen('c-home');
    assert.match(f.html(),/ex-banner/);
    assert.equal(buttons(f.html()).filter(b=>b.dataset.product).length>0,!['visitor','unlinked'].includes(scenario));
    for(const go of ['c-brand-story','c-outlets']) {
      f.click(action(f,d=>d.go===go).dataset);assert.equal(f.current().id,go);f.showScreen('c-home');
    }
    f.click(action(f,d=>d.ai==='start').dataset);assert.equal(f.current().id,'c-ai-assistant');f.showScreen('c-home');
    f.click(action(f,d=>d.go==='c-customer-service').dataset);assert.equal(f.consumer.customerServiceOpen,true);f.showScreen('c-home');
  }
});


test('v0.17 home shows one owned card and prioritizes active service without mutating products',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  f.resetConsumer('multiple');
  const original=copy(f.consumer.ownedProducts);
  for(const status of ['completed','closed','cancelled']) {
    f.consumer.orders.get('t01').status=status;f.showScreen('c-home');
    assert.equal((f.html().match(/data-owned-carousel/g)||[]).length,1);
    action(f,d=>d.product==='b02'&&d.go==='c-progress');
    assert.match(action(f,d=>d.homeProduct==='b02').html,/aria-pressed="true"/);
    f.click(action(f,d=>d.homeProduct==='t01').dataset);
    action(f,d=>d.product==='t01'&&d.go==='c-product');
    action(f,d=>d.product==='t01'&&d.go==='c-progress');
    f.showScreen('c-home');action(f,d=>d.product==='t01'&&d.go==='c-product');
    f.consumer.orders.get('t01').status='confirmed';f.showScreen('c-home');
  }
  assert.deepEqual(copy(f.consumer.ownedProducts),original);
  f.consumer.orders.clear();f.showScreen('c-home');
  action(f,d=>d.product==='t01'&&d.go==='c-product');
  assert.doesNotMatch(f.html(),/ex-service-card/);
  f.consumer.ownedProducts.splice(1);f.showScreen('c-home');
  assert.equal((f.html().match(/data-owned-carousel/g)||[]).length,1);
  assert.doesNotMatch(f.html(),/data-home-product=/);
  for(const scenario of ['visitor','unlinked']) {
    f.resetConsumer(scenario);f.showScreen('c-home');
    assert.doesNotMatch(f.html(),/data-owned-carousel|data-home-product=/);
  }
});

test('v0.17 home supports horizontal swipe and keyboard while ignoring vertical or short drags',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  f.resetConsumer('registered');f.showScreen('c-home');
  const target={closest:selector=>selector==='[data-owned-carousel]'?{}:null};
  const drag=(x,y)=>{
    f.dispatch('pointerdown',{pointerId:1,button:0,clientX:200,clientY:200,target});
    f.dispatch('pointerup',{pointerId:1,clientX:200+x,clientY:200+y,target});
  };
  drag(-20,0);drag(-70,100);
  action(f,d=>d.product==='t01'&&d.go==='c-product');
  f.get('#phone-body').scrollTop=160;
  drag(-80,2);
  action(f,d=>d.product==='b02'&&d.go==='c-product');
  assert.equal(f.current().id,'c-home');assert.equal(f.get('#phone-body').scrollTop,160);
  assert.match(action(f,d=>d.homeProduct==='b02').html,/aria-pressed="true"/);
  drag(-80,0);action(f,d=>d.product==='b02'&&d.go==='c-product');
  f.dispatch('keydown',{key:'ArrowLeft',target,preventDefault(){}});
  action(f,d=>d.product==='t01'&&d.go==='c-product');
  assert.match(action(f,d=>d.homeProduct==='t01').html,/aria-pressed="true"/);
});


test('v0.17 home product card switches order information with the displayed product',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  for(const scenario of ['pending','confirmed','multiple']) {
    f.resetConsumer(scenario);f.showScreen('c-home');
    const service=action(f,d=>d.product==='t01'&&d.go==='c-progress').html;
    assert.match(service,scenario==='pending'?/待确认时间/:/时间已确认/);
    assert.doesNotMatch(service,/10月12日|hc-steps|服务安排/);
    f.click(action(f,d=>d.homeProduct==='b02').dataset);
    if(scenario==='multiple') {
      f.click(action(f,d=>d.product==='b02'&&d.go==='c-progress').dataset);
      assert.equal(f.current().id,'c-progress');assert.equal(f.consumer.productId,'b02');
    } else {
      assert.equal(buttons(f.html()).filter(b=>b.dataset.go==='c-progress').length,0);
      action(f,d=>d.product==='b02'&&d.serviceType==='repair');
    }
  }
});

test('v0.17 service page retains the earlier service layout across empty and order scenarios',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  const old=fixture({search:'?consumerVersion=0.14'});
  const currentBody=f.apps.consumer.screens.find(s=>s.id==='c-service').body;
  const previousBody=old.apps.consumer.screens.find(s=>s.id==='c-service').body;
  for(const scenario of ['visitor','unlinked','registered','pending','confirmed','multiple']) {
    f.resetConsumer(scenario);f.showScreen('c-service');
    assert.equal(currentBody(f.consumerContext()),previousBody(f.consumerContext()));
    assert.match(f.get('#phone-tabs').innerHTML,/c-service/);
  }
});

test('v0.17 home and product alternative offer public exploration and binding when unbound',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  for(const scenario of ['visitor','unlinked']) for(const screen of ['c-home','c-product-hub']) {
    f.resetConsumer(scenario);f.showScreen(screen);
    assert.doesNotMatch(f.html(),/ex-collection|data-brand-product|data-owned-carousel/);
    const before=snapshot(f);
    f.click(action(f,d=>d.go==='c-brand-catalog').dataset);
    assert.equal(f.current().id,'c-brand-catalog');
    assert.deepEqual(snapshot(f).products,before.products);
    assert.equal(f.consumer.visitor,scenario==='visitor');
    f.showScreen(screen);
    f.click(action(f,d=>d.brandAccess==='c-register'||d.go==='c-register').dataset);
    assert.equal(f.current().id,scenario==='visitor'?'c-brand-access':'c-register');
  }
});

test('v0.17 home retains exploration across ownership and opens featured archives without changing private data',()=>{
  const codes={'19':'CES8G820GCN','20':'CES7H311KCN','27':'LW1554B','28':'TLG12303B'};
  for(const scenario of ['visitor','unlinked','registered','confirmed','multiple']) {
    const f=fixture({search:'?consumerVersion=0.17'});
    f.resetConsumer(scenario);f.showScreen('c-home');const before=snapshot(f);
    const featured=buttons(f.html()).filter(b=>b.dataset.catalogProduct);
    assert.equal(featured.length,4);
    for(const card of featured) {
      f.click(card.dataset);assert.equal(f.current().id,'c-brand-product');
      assert.match(f.html(),new RegExp(codes[card.dataset.catalogProduct]));
      for(const key of ['products','productId','orders','forms','media','registrationDrafts','submitted']) assert.deepEqual(snapshot(f)[key],before[key]);
      assert.equal(f.consumer.visitor,scenario==='visitor');f.showScreen('c-home');
    }
  }
});

test('v0.17 home summarizes service states and routes to the matching detailed order',()=>{
  const f=fixture({search:'?consumerVersion=0.17'});
  f.resetConsumer('confirmed');
  for(const [status,label] of [['pending','待确认时间'],['confirmed','时间已确认'],['completed','已完成'],['closed','已办结'],['cancelled','已取消']]) {
    f.consumer.orders.get('t01').status=status;f.showScreen('c-home');
    const service=action(f,d=>d.product==='t01'&&d.go==='c-progress');
    assert.ok(service.html.includes(label));
    assert.doesNotMatch(service.html,/hc-steps|hc-service-detail|10月12日|2026-10-12/);
    assert.equal(buttons(f.html()).filter(b=>b.dataset.serviceType).length,0);
    f.click(service.dataset);assert.equal(f.current().id,'c-progress');assert.equal(f.consumer.productId,'t01');
  }
  f.consumer.orders.get('t01').status='confirmed';
  f.consumer.orders.get('t01').confirmedDate='';f.consumer.orders.get('t01').confirmedTime='';f.showScreen('c-home');
  assert.match(f.html(),/待确认时间/);assert.doesNotMatch(f.html(),/时间已确认/);
  f.consumer.orders.clear();f.showScreen('c-home');
  assert.doesNotMatch(f.html(),/hc-steps|hc-service-status/);
  action(f,d=>d.serviceType==='install');
});

test('v0.17 catalog separates category entry from series and includes descendant and direct products',()=>{
  const f=fixture({search:'?consumerVersion=0.17',hash:'#c-brand-catalog'});
  f.resetConsumer('visitor');f.showScreen('c-brand-catalog');
  assert.doesNotMatch(f.html(),/brand-search|PRODUCTS|从空间与需要出发|data-catalog-series|data-catalog-product=/);
  assert.deepEqual(buttons(f.html()).filter(b=>b.dataset.catalogRoot).map(b=>b.dataset.catalogRoot),['30','31','32','33']);
  const productIds=()=>buttons(f.html()).filter(b=>b.dataset.catalogProduct).map(b=>b.dataset.catalogProduct);
  const enterCategory=id=>{f.showScreen('c-brand-catalog');f.click(action(f,d=>d.catalogRoot===id).dataset);assert.equal(f.current().id,'c-catalog-products');};
  enterCategory('30');
  assert.equal(f.current().title,'坐便器');
  assert.doesNotMatch(f.html(),/data-catalog-root|data-catalog-category/);
  assert.deepEqual(productIds(),['19','20','21','22','23','24','25']);
  f.click(action(f,d=>d.catalogSeries==='12').dataset);
  assert.deepEqual(productIds(),['20','21']);
  enterCategory('31');
  assert.equal(f.current().title,'洗面器');
  assert.deepEqual(productIds(),['26','27']);
  assert.doesNotMatch(f.html(),/data-catalog-series/);
  enterCategory('32');assert.deepEqual(productIds(),['28','29']);
  enterCategory('33');assert.deepEqual(productIds(),['30']);
  enterCategory('30');
  assert.deepEqual(productIds(),['19','20','21','22','23','24','25']);
  f.click(action(f,d=>d.catalogSeries==='none').dataset);
  assert.deepEqual(productIds(),['22','23','24']);
});

test('v0.17 public archive matches selection and preserves owned data and catalog selection on return',()=>{
  for(const scenario of ['visitor','unlinked','multiple']) {
    const f=fixture({search:'?consumerVersion=0.17'});
    f.resetConsumer(scenario);f.showScreen('c-brand-catalog');const before=snapshot(f);
    f.click(action(f,d=>d.catalogRoot==='30').dataset);
    f.click(action(f,d=>d.catalogSeries==='12').dataset);
    f.click(action(f,d=>d.catalogProduct==='21').dataset);
    assert.equal(f.current().id,'c-brand-product');
    assert.match(f.html(),/CES7H310KCN/);assert.match(f.html(),/WASHLET 卫洗丽 G5A/);
    assert.doesNotMatch(f.html(),/DESIGN & EVERYDAY|12个月|保修|DEMO-SR/);
    f.click(action(f,d=>d.go==='c-outlets').dataset);assert.equal(f.current().id,'c-outlets');
    f.showScreen('c-brand-product');
    f.click(action(f,d=>d.go==='c-customer-service').dataset);assert.equal(f.consumer.customerServiceOpen,true);
    f.showScreen('c-catalog-products');assert.match(action(f,d=>d.catalogSeries==='12').html,/aria-pressed="true"/);
    for(const key of ['products','productId','orders','forms','media','registrationDrafts','submitted']) assert.deepEqual(snapshot(f)[key],before[key]);
    assert.equal(f.consumer.visitor,scenario==='visitor');
  }
});

test('v0.17 catalog uses complete local image assets while earlier catalogs retain search',()=>{
  const data={window:{}};vm.runInNewContext(readFileSync(resolve(root,'consumer-catalog-data.js'),'utf8'),data);
  const fixtureData=data.window.TOTO_CATALOG_DATA;
  assert.equal(fixtureData.categories.length,11);assert.equal(fixtureData.series.length,3);assert.equal(fixtureData.products.length,12);
  for(const p of fixtureData.products) {
    assert.ok(fixtureData.categories.some(c=>c.id===p.categoryId));
    assert.ok(!p.seriesId||fixtureData.series.some(s=>s.id===p.seriesId));
    assert.ok(existsSync(resolve(root,p.image)));
  }
  for(const version of ['0.14','0.15','0.16']) {
    const f=fixture({search:'?consumerVersion='+version,hash:'#c-brand-catalog'});
    assert.match(f.html(),/data-brand-search/);assert.doesNotMatch(f.html(),/data-catalog-root/);
  }
});
