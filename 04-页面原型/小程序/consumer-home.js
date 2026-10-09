/* Homepage visual review, using the existing consumer product and service context. */
(() => {
  if (window.TOTO_CONSUMER_VERSION !== '0.15') return;
  const renderers = window.TOTO_HOME_VARIANTS;
  const home = window.TOTO_SCREENS.consumer.screens.find(screen => screen.id === 'c-home');
  const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const options = [
    {id:'showcase', number:'01', name:'产品展台', note:'白底产品大图，紧凑资料与服务区域'},
    {id:'living', number:'02A', name:'通栏空间', note:'完整空间影像，产品与服务清晰分层'},
    {id:'living-layered', number:'02B', name:'叠层生活卡', note:'白色产品卡叠入照片，服务融入卡片'},
    {id:'living-editorial', number:'02C', name:'留白画册', note:'小幅生活影像，留白与深蓝服务横条'},
    {id:'concierge', number:'03', name:'服务管家', note:'服务信息优先，当前产品紧凑呈现'},
  ];
  const directions = [
    {id:'showcase', number:'01', name:'产品展台'},
    {id:'space', number:'02', name:'空间生活'},
    {id:'concierge', number:'03', name:'服务管家'},
  ];
  const requested = new URLSearchParams(location.search).get('homeStyle');
  let selected = options.some(option => option.id === requested) ? requested : 'living';
  let lastLiving = selected.startsWith('living') ? selected : 'living';
  const icon = name => `<img class="icon" src="assets/icons/${e(name)}.svg" alt="" aria-hidden="true">`;
  const empty = () => `<section class="hd-unavailable"><small>我的产品</small><h2>让产品与服务，<br>在这里相遇。</h2><p>同步购买记录，或扫码添加产品。<br>之后可查看资料、申请和跟进服务。</p><button class="hd-primary" data-action="add">添加我的产品</button><button class="hd-secondary" data-action="sync">同步购买记录</button></section>`;
  const error = () => `<section class="hd-unavailable"><small>我的产品</small><h2>暂时无法读取产品</h2><p>请检查网络连接后重试。<br>需要帮助时，也可联系 TOTO 客服。</p><button class="hd-primary" data-action="retry">重新读取</button></section>`;
  function service(ctx) {
    const active = ctx.order && !['completed','closed','cancelled'].includes(ctx.order.status);
    if (active) return {title:ctx.order.status === 'confirmed' ? '服务时间已确认' : '等待联系确认',hint:ctx.order.status === 'confirmed' ? '查看本次服务安排与进度' : '申请已收到，请留意来电',label:'查看进度',icon:'calendar',status:ctx.order.status === 'confirmed' ? '时间已确认' : '等待联系',confirmed:ctx.order.status === 'confirmed',active:true};
    return {title:'申请售后服务',hint:'描述使用问题，获得专业服务',label:'去申请',icon:'repair',status:'可申请服务',active:false};
  }
  function render(ctx, forcedState) {
    const currentService = service(ctx);
    const state = forcedState || (ctx.visitor || !ctx.hasProducts || !ctx.products.length ? 'empty' : currentService.active ? 'progress' : 'repair');
    const actions = {
      product:'data-go="c-product"', switch:'data-go="c-products"',
      add:ctx.visitor ? 'data-brand-access="c-register"' : 'data-go="c-register"',
      sync:ctx.visitor ? 'data-brand-access="c-register"' : 'data-phone-sync data-sync-target="products"',
      service:currentService.active ? 'data-go="c-progress"' : 'data-service-type="repair" data-go="c-repair"',
      assistant:'data-ai="start"', outlets:'data-go="c-outlets"', support:'data-go="c-customer-service"', retry:'data-retry',
    };
    return renderers[selected]({...ctx,state,service:currentService,icon,empty,error})
      .replace('class="variant ', 'class="home-design variant ')
      .replace(/data-action="([a-z-]+)"/g, (_match, action) => actions[action] || '')
      .replace(/data-product="([^"]+)"/g, 'data-product="$1" data-go="c-home"');
  }
  Object.assign(home, {
    entry:'C01 · 首页设计方案评审',
    goal:'用右侧三个主方案比较产品展台、空间生活与服务管家；空间生活可继续切换通栏、叠层和画册三种布局。产品资料、申请和进度使用同一套原型数据。',
    note:'v0.15 为首页视觉评审，默认展示 02A 通栏空间及已同步产品场景。空间图片为独立的生活灵感示意；产品图保留白底并完整呈现。安装入口与评价资格没有在本轮增加；原版 v0.14 完整保留在左侧版本入口。',
    body: ctx => render(ctx),
  });
  window.TOTO_HOME_DESIGNS = {
    selected:() => selected,
    options,
    picker:() => directions.map(direction => {
      const active = direction.id === 'space' ? selected.startsWith('living') : selected === direction.id;
      return `<button type="button" data-home-design="${direction.id}" aria-pressed="${active}"><span>${direction.number}</span><strong>${direction.name}</strong>${active ? '<i aria-hidden="true">✓</i>' : ''}</button>`;
    }).join('') + (selected.startsWith('living') ? `<div class="home-living-layout"><label class="review-field" for="consumer-living-layout">空间生活 · 布局细化</label><select id="consumer-living-layout">${options.filter(option => option.id.startsWith('living')).map(option => `<option value="${option.id}"${selected === option.id ? ' selected' : ''}>${option.number} ${option.name}</option>`).join('')}</select></div>` : ''),
    note:() => options.find(option => option.id === selected).note,
    choose(id) {
      if (id === 'space') id = lastLiving;
      if (!options.some(option => option.id === id)) return false;
      selected = id;
      if (id.startsWith('living')) lastLiving = id;
      const url = new URL(location.href);
      url.searchParams.set('homeStyle', id);
      history.replaceState(null, '', url.pathname + url.search + url.hash);
      return true;
    },
    statusView:(state,ctx) => ['empty','error'].includes(state) ? render(ctx,state) : '',
  };
})();
