'use strict';
// Explanatory cover loop. Three dots on one strand; no live business data.
window.createReportCoverMotion = (root, reduce) => {
  const period = 3600;
  const routes = [...root.querySelectorAll('[data-cover-route]')];
  const states = [...root.querySelectorAll('[data-cover-state]')];
  const pips = [...root.querySelectorAll('[data-cover-pip]')];
  const dots = [...root.querySelectorAll('[data-cover-dot]')];
  const nodes = [...root.querySelectorAll('[data-cover-node]')];
  const titles = [...root.querySelectorAll('[data-cover-title]')];
  const order = root.querySelector('[data-cover-order]');
  const owners = ['consumer', 'customer', 'station', 'worker', 'customer', 'customer', null];
  const positions = [[230,225],[530,225],[530,305],[230,305],[530,225],[530,225],[380,265]];
  const phases = [0,1,1,2,2,3,4];
  const routeSteps = [0,1,2,3,4,-1,-1];
  const particleGroup = root.querySelector('.cover-flow-particles');
  const button = root.querySelector('#cover-motion-toggle');
  let current = 0;
  let active = false;
  let blocked = false;
  let userPaused = false;
  let timer = null;
  let deadline = 0;
  let remaining = period;
  let running = false;
  let particles = [];
  let entrance = null;
  let orderMove = null;
  const moveEase = 'cubic-bezier(.77,0,.175,1)';
  const ease = 'cubic-bezier(.23,1,.32,1)';
  const cancelParticles = () => {
    particles.forEach(animation => animation.cancel());
    particles = [];
  };
  function buildParticles() {
    cancelParticles();
    if (reduce.matches || routeSteps[current] < 0) return;
    const route = routes[routeSteps[current]];
    particleGroup.style.color = getComputedStyle(route).stroke;
    const length = route.getTotalLength();
    const frames = Array.from({length:41}, (_, i) => {
      const t = i / 40;
      const point = route.getPointAtLength(length * t);
      return {transform:`translate(${point.x}px, ${point.y}px)`, opacity: t === 0 || t === 1 ? 0 : Math.min(1,t * 8,(1-t) * 8), offset:t};
    });
    particles = dots.map((dot, i) => {
      const animation = dot.animate(frames, {duration:2400, delay:i * 600, iterations:Infinity, easing:'linear', fill:'both'});
      animation.finished.catch(() => {});
      animation.pause();
      return animation;
    });
  }
  function paint(animate = false) {
    routes.forEach((route,i) => route.classList.toggle('is-current',!reduce.matches && i === routeSteps[current]));
    states.forEach((state,i) => state.classList.toggle('is-current',i === current));
    titles.forEach((title,i) => title.classList.toggle('is-current',i === current));
    pips.forEach((pip,i) => pip.classList.toggle('is-current',i === phases[current]));
    nodes.forEach(node => node.classList.toggle('is-current',!reduce.matches && node.dataset.coverNode === owners[current]));
    const previous = getComputedStyle(order).transform;
    orderMove?.cancel();
    const position = reduce.matches ? [380,265] : positions[current];
    const target = `translate(${position[0]}px, ${position[1]}px)`;
    order.style.transform = target;
    // Submission hands responsibility directly to customer service; review stays there.
    const changesPosition = current === 0 || position.some((coordinate,i) => coordinate !== positions[current - 1][i]);
    if (animate && !reduce.matches && changesPosition) {
      const movement = order.animate([{transform:previous === 'none' ? target : previous},{transform:target}],{duration:1100,easing:moveEase,fill:'backwards'});
      orderMove = movement;
      movement.finished.then(()=>{
        if (orderMove === movement) { movement.cancel(); orderMove = null; }
      }).catch(()=>{});
    } else orderMove = null;
    entrance?.cancel();
    if (animate && !reduce.matches) {
      const fade = states[current].animate([{opacity:0,transform:'translateY(5px)'},{opacity:1,transform:'translateY(0)'}],{duration:240,easing:ease});
      entrance = fade;
      fade.finished.then(()=>{
        if (entrance === fade) { fade.cancel(); entrance = null; }
      }).catch(()=>{});
    }
    buildParticles();
  }
  function updateButton() {
    button.disabled = reduce.matches;
    button.setAttribute('aria-pressed',String(userPaused));
    button.setAttribute('aria-label',reduce.matches ? '减少动态效果：静态展示' : userPaused ? '继续首页自动动画' : '暂停首页自动动画');
    button.querySelector('span').textContent = reduce.matches ? '静态展示' : userPaused ? '继续动画' : '暂停动画';
    button.classList.toggle('is-paused',userPaused);
    root.classList.toggle('cover-static',reduce.matches);
  }
  function schedule() {
    deadline = performance.now() + remaining;
    timer = setTimeout(() => {
      timer = null;
      current = (current + 1) % states.length;
      remaining = period;
      paint(true);
      particles.forEach(animation => animation.play());
      schedule();
    },remaining);
  }
  function reconcile() {
    const shouldRun = active && !blocked && !document.hidden && !userPaused && !reduce.matches;
    if (shouldRun === running) return;
    running = shouldRun;
    if (running) {
      particles.forEach(animation => animation.play());
      orderMove?.play();
      entrance?.play();
      schedule();
    } else {
      if (timer !== null) remaining = Math.max(0,deadline - performance.now());
      clearTimeout(timer); timer = null;
      particles.forEach(animation => animation.pause());
      orderMove?.pause();
      entrance?.pause();
    }
  }
  button.addEventListener('click',() => { userPaused = !userPaused; updateButton(); reconcile(); });
  states[0].querySelector('.cover-order-status').textContent = reduce.matches ? '全程服务协同' : '待分站';
  states[0].querySelector('.cover-order-owner').textContent = reduce.matches ? '角色交接 · 过程留痕' : '消费者';
  titles[0].textContent = reduce.matches ? '一张工单，连接四类办理角色' : '消费者发起服务申请';
  paint(); updateButton();
  return {
    sync(isActive,isBlocked) { active = isActive; blocked = isBlocked; reconcile(); },
    themeChanged() {
      if (particles.length) particleGroup.style.color = getComputedStyle(routes[routeSteps[current]]).stroke;
    },
    reduced() {
      clearTimeout(timer); timer = null; running = false;
      remaining = period;
      // Static mode shows the overall relationship instead of a frozen partial stage.
      states[0].querySelector('.cover-order-status').textContent = reduce.matches ? '全程服务协同' : '待分站';
      states[0].querySelector('.cover-order-owner').textContent = reduce.matches ? '角色交接 · 过程留痕' : '消费者';
      titles[0].textContent = reduce.matches ? '一张工单，连接四类办理角色' : '消费者发起服务申请';
      current = 0;
      paint(); updateButton(); reconcile();
    }
  };
};
