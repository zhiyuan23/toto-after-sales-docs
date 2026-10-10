'use strict';
// Explanatory cover: the work order follows its owner through curved role handoffs.
window.createReportCoverMotion = (root, reduce) => {
  const period = 3600;
  const routes = [...root.querySelectorAll('[data-cover-route]')];
  const states = [...root.querySelectorAll('[data-cover-state]')];
  const pips = [...root.querySelectorAll('[data-cover-pip]')];
  const dots = [...root.querySelectorAll('[data-cover-dot]')];
  const nodes = [...root.querySelectorAll('[data-cover-node]')];
  const order = root.querySelector('[data-cover-order]');
  const owners = ['consumer', 'customer', 'station', 'worker', 'customer', 'customer', null];
  const phases = [0,1,2,3,4,5,6];
  const positions = [[360,270],[412,255],[412,365],[355,420],[412,255],[412,255],[375,315]];
  const routeSteps = [0,1,2,3,4,-1,-1];
  const particleGroup = root.querySelector('.cover-flow-particles');
  const button = root.querySelector('#cover-motion-toggle');
  let current = 0;
  const routeIndex = () => routeSteps[current];
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
  const ease = 'cubic-bezier(.23,1,.32,1)';
  const cancelParticles = () => {
    particles.forEach(animation => animation.cancel());
    particles = [];
  };
  function buildParticles() {
    cancelParticles();
    if (reduce.matches || routeIndex() < 0) return;
    const route = routes[routeIndex()];
    particleGroup.style.color = getComputedStyle(route).stroke;
    const length = route.getTotalLength();
    const frames = Array.from({length:65}, (_, i) => {
      const t = i / 64;
      const point = route.getPointAtLength(length * t);
      return {transform:`translate(${point.x}px, ${point.y}px)`, opacity: t === 0 || t === 1 ? 0 : Math.min(1,t * 8,(1-t) * 8), offset:t};
    });
    particles = dots.map((dot, i) => {
      const animation = dot.animate(frames, {duration:2300, delay:300 + i * 120, iterations:1, easing:'linear', fill:'both'});
      animation.finished.catch(() => {});
      animation.pause();
      return animation;
    });
  }
  function paint(animate = false) {
    const owner = owners[current];
    root.dataset.coverOwner = reduce.matches ? 'order' : owner || 'order';
    states[0].querySelector('.cover-order-status').textContent = reduce.matches ? '全程服务协同' : '待分站';
    states[0].querySelector('.cover-order-owner').textContent = reduce.matches ? '消费者申请 · 总部支撑' : '消费者自主申请';
    routes.forEach((route,i) => route.classList.toggle('is-current',!reduce.matches && i === routeIndex()));
    states.forEach((state,i) => state.classList.toggle('is-current',i === current));
    pips.forEach((pip,i) => pip.classList.toggle('is-current',i === phases[current]));
    nodes.forEach(node => node.classList.toggle('is-current',!reduce.matches && node.dataset.coverNode === owner));
    // Place the card beside the current owner; settle at the centre after closure.
    const [x,y] = reduce.matches ? [375,315] : positions[current];
    const target = `translate(${x}px,${y}px)`;
    const from = getComputedStyle(order).transform || order.style.transform;
    orderMove?.cancel(); orderMove = null;
    order.style.transform = target;
    if (animate && !reduce.matches && from !== target) {
      const move = order.animate([{transform:from},{transform:target}],{duration:600,easing:ease});
      orderMove = move;
      move.finished.then(() => {
        if (orderMove === move) { move.cancel(); orderMove = null; }
      }).catch(() => {});
    }
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
    const label = reduce.matches ? '减少动态效果：静态展示' : userPaused ? '继续首页自动动画' : '暂停首页自动动画';
    button.setAttribute('aria-label',label);
    button.title = label;
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
      entrance?.play();
      orderMove?.play();
      schedule();
    } else {
      if (timer !== null) remaining = Math.max(0,deadline - performance.now());
      clearTimeout(timer); timer = null;
      particles.forEach(animation => animation.pause());
      entrance?.pause();
      orderMove?.pause();
    }
  }
  button.addEventListener('click',() => { userPaused = !userPaused; updateButton(); reconcile(); });
  paint(); updateButton();
  return {
    sync(isActive,isBlocked) { active = isActive; blocked = isBlocked; reconcile(); },
    themeChanged() {
      if (particles.length) particleGroup.style.color = getComputedStyle(routes[routeIndex()]).stroke;
    },
    reduced() {
      clearTimeout(timer); timer = null; running = false;
      remaining = period;
      // Static mode shows the overall relationship instead of a frozen partial stage.
      current = 0;
      paint(); updateButton(); reconcile();
    }
  };
};
