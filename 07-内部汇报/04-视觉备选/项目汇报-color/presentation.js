'use strict';
(() => {
  const slides = window.REPORT_SLIDES;
  const $ = id => document.getElementById(id);
  const stage = $('stage');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const strip = html => html.replace(/<[^>]*>/g, '');
  const ease = 'cubic-bezier(.23,1,.32,1)';
  let page = -1;
  let animations = [];
  let paused = false;
  let cycle = null;
  let phase = 0;
  let notesOpen = false;
  let idleTimer;
  const sections = slides.map((slide, index) => {
    const section = document.createElement('section');
    section.className = 'slide';
    section.dataset.slide = slide.id;
    section.hidden = true;
    section.setAttribute('aria-labelledby', `slide-title-${index}`);
    // Local, versioned author content only; edition-specific copy is maintained in content.js.
    section.innerHTML = `<div class="folio-shape" aria-hidden="true"></div><div class="folio-index" aria-hidden="true">${slide.chapter ? slide.chapter.slice(0, 2) : ''}</div><header class="slide-header">${slide.chapter ? `<p class="eyebrow">${slide.chapter}</p>` : ''}<h1 id="slide-title-${index}">${slide.title}</h1></header><div class="visual">${slide.html}</div>`;
    stage.append(section);
    return section;
  });
  const iconFromGroup = group => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.65');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('stroke-linejoin', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.classList.add('report-icon');
    svg.innerHTML = group.innerHTML;
    return svg.outerHTML;
  };
  // Redraw the original cover as an orbital composition; every role/state comes from the snapshot.
  const cover = sections[0];
  const originalCover = cover.querySelector('.cover-flow-canvas');
  const states = [...originalCover.querySelectorAll('[data-cover-state]')].map(node => ({
    status: node.querySelector('.cover-order-status').textContent,
    owner: node.querySelector('.cover-order-owner').textContent,
  }));
  const owners = ['consumer', 'customer', 'station', 'worker', 'customer', 'customer', null];
  const orbit = document.createElement('div');
  orbit.className = 'orbit';
  orbit.setAttribute('role', 'group');
  orbit.setAttribute('aria-label', originalCover.querySelector('title').textContent);
  orbit.innerHTML = '<div class="orbit-ring" aria-hidden="true"></div><div class="collaboration-line line-left" aria-hidden="true"></div><div class="collaboration-line line-right" aria-hidden="true"></div>' +
    [...originalCover.querySelectorAll('[data-cover-node]')].map(node =>
      `<div class="orbit-node" data-owner="${node.dataset.coverNode}">${iconFromGroup(node.querySelector('g'))}<h3>${node.querySelector('.cover-role-name').textContent}</h3><p>${node.querySelector('.cover-role-description').textContent}</p></div>`
    ).join('') + `<div class="order-core"><div class="order-label">${originalCover.querySelector('.cover-order-label').textContent}</div><h3>${originalCover.querySelector('.cover-order-title').textContent}</h3><div class="order-status"><strong></strong><small></small></div></div><div class="cover-rail">${[...originalCover.querySelectorAll('[data-cover-pip] text')].map(n => `<span>${n.textContent}</span>`).join('')}</div>`;
  originalCover.replaceWith(orbit);
  // The six capability names/details are preserved; the old puzzle becomes a modular board.
  const puzzle = stage.querySelector('.v3-platform-puzzle');
  const modules = document.createElement('div');
  modules.className = 'platform-modules';
  modules.setAttribute('role', 'group');
  modules.setAttribute('aria-label', puzzle.querySelector('desc').textContent);
  modules.innerHTML = [...puzzle.querySelectorAll('.v3-platform-piece')].map(node =>
    `<article class="platform-module ${node.classList.contains('is-service') ? 'is-service' : ''}">${iconFromGroup(node.querySelector('g'))}<h3>${node.querySelector('.v3-puzzle-title').textContent}</h3><p>${node.querySelector('.v3-puzzle-detail').textContent}</p></article>`
  ).join('');
  puzzle.replaceWith(modules);
  // Match the workbench specimen to the UI specimen without changing its task or feedback.
  const workbench = stage.querySelector('.v3-workbench-demo');
  workbench.querySelector('.v3-demo-chrome').insertAdjacentHTML('afterbegin', '<i></i><i></i><i></i>');
  workbench.querySelector('.v3-workbench-body').insertAdjacentHTML('afterbegin', '<div class="workbench-sidebar" aria-hidden="true"><b></b><span></span><span></span><span></span></div><div class="workbench-toolbar" aria-hidden="true"><b></b><span></span><i></i></div>');
  sections.at(-1).insertAdjacentHTML('beforeend', '<div class="closing-mark" aria-hidden="true"><img src="brand-logo.png" alt="" width="170" height="170"></div>');

  function fit() {
    const scale = Math.min(innerWidth / 1600, innerHeight / 900);
    $('canvas').style.transform = `scale(${scale})`;
  }
  addEventListener('resize', fit);
  fit();

  function cancelMotion() {
    animations.forEach(animation => animation.cancel());
    animations = [];
    clearInterval(cycle);
    cycle = null;
  }
  function animate(element, frames, options) {
    if (!element) return;
    const animation = element.animate(frames, {duration:850, easing:ease, fill:'backwards', ...options});
    animations.push(animation);
    animation.finished.then(() => {
      animation.cancel();
      animations = animations.filter(item => item !== animation);
    }).catch(() => {});
    if (paused || document.hidden || notesOpen || $('directory').open) animation.pause();
  }
  const groups = {
    cover: ['.orbit-ring', '.order-core', '.collaboration-line', '.orbit-node', '.cover-rail', '.cover-bottom'],
    background: ['.v2-source-strip', '.v2-direction'],
    saas: ['.v3-platform-heading', '.platform-module', '.v3-platform-story', '.v3-platform-capability'],
    system: ['.web-app', '.mobile-app'],
    'product-service': ['.journey-stop', '.v2-journey-anchors>span'],
    exceptions: ['.change-card', '.trace-panel'],
    support: ['.v2-support-centre', '.v2-support-card'],
    'anti-diversion': ['.channel-node', '.channel-key'],
    experience: ['.v3-experience-card', '.v3-experience-notices'],
    'smart-dispatch': ['.v3-dispatch-intelligence', '.v3-dispatch-focus'],
    assistant: ['.v3-knowledge-source', '.v3-assist-card'],
    'live-demo': ['.v3-demo-role-tour', '.v2-demo-app'],
    future: ['.v3-future-centre', '.v3-future-direction'],
    delivery: ['.delivery-track>div', '.material-links'],
    closing: ['.closing-mark', '.closing-invitation', '.closing-signature'],
  };
  function enter(section, direction) {
    if (reduced.matches) {
      animate(section, [{opacity:0}, {opacity:1}], {duration:150});
      return;
    }
    const title = section.querySelector('h1');
    animate(section.querySelector('.eyebrow'), [{opacity:0}, {opacity:1}], {duration:450});
    animate(title, [{opacity:0, transform:`translateY(${28 * direction}px)`}, {opacity:1, transform:'translateY(0)'}], {duration:900});
    animate(section.querySelector('.folio-shape'), [{opacity:0,transform:'translateY(25px) rotate(-8deg)'},{opacity:.6,transform:'none'}], {duration:1200});
    animate(section.querySelector('.folio-index'), [{opacity:0},{opacity:1}], {duration:800,delay:100});
    let count = 0;
    groups[section.dataset.slide].forEach(selector => {
      section.querySelectorAll(selector).forEach(element => {
        const delay = 90 + count++ * 65;
        let from = `translateY(${30 * direction}px)`;
        if (element.matches('.orbit-ring')) from = 'scale(.92) rotate(-8deg)';
        else if (element.matches('.order-core,.v2-support-centre,.closing-mark')) from = 'scale(.94)';
        else if (element.matches('.mobile-app')) from = 'translateX(50px)';
        else if (element.matches('.change-card,.delivery-track>div')) from = `translateX(${35 * direction}px)`;
        else if (element.matches('.v2-direction')) from = 'translateY(40px) rotate(1.5deg)';
        else if (element.matches('.journey-stop')) from = 'translateY(32px) scale(.96)';
        else if (element.matches('.collaboration-line')) from = 'scaleX(0)';
        else if (element.matches('.platform-module')) from = 'translateY(22px) scale(.96)';
        const to = 'none';
        animate(element, [{opacity:0,transform:from},{opacity:1,transform:to}], {delay,duration:element.matches('.closing-mark') ? 1400 : 900});
      });
    });
    // Narrative accents: trace the journey, reveal the shared answer and settle outcomes.
    section.querySelectorAll('.v3-answer,.v3-dispatch-focus-result,.v3-delivery-goal').forEach((element, index) => {
      animate(element, [{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}], {duration:650,delay:750 + index * 70});
    });
  }
  function paintPhase(withMotion = false) {
    orbit.querySelectorAll('.orbit-node').forEach(node => node.classList.toggle('is-current', node.dataset.owner === owners[phase]));
    orbit.querySelectorAll('.cover-rail span').forEach((node, index) => node.classList.toggle('is-current', index === phase));
    const status = orbit.querySelector('.order-status');
    status.querySelector('strong').textContent = states[phase].status;
    status.querySelector('small').textContent = states[phase].owner;
    if (withMotion && !reduced.matches) animate(status, [{opacity:0,transform:'translateY(7px)'},{opacity:1,transform:'none'}], {duration:380});
  }
  function syncMotion() {
    const blocked = paused || document.hidden || notesOpen || $('directory').open;
    animations.forEach(animation => blocked ? animation.pause() : animation.play());
    clearInterval(cycle);
    cycle = null;
    if (!blocked && page === 0 && !reduced.matches) {
      cycle = setInterval(() => { phase = (phase + 1) % states.length; paintPhase(true); }, 3600);
    }
  }
  function go(index, replay = false) {
    index = Math.max(0, Math.min(slides.length - 1, index));
    if (index === page && !replay) return;
    const direction = index < page ? -1 : 1;
    cancelMotion();
    page = index;
    const data = slides[page];
    sections.forEach((section, index) => { section.hidden = index !== page; section.inert = index !== page; });
    $('counter').textContent = `${String(page + 1).padStart(2, '0')} / ${slides.length}`;
    $('chapter-label').textContent = data.chapter;
    $('notes-title').textContent = strip(data.title);
    $('notes-body').textContent = data.notes;
    $('announcement').textContent = `第 ${page + 1} 页，共 ${slides.length} 页。${strip(data.title)}`;
    $('previous').disabled = page === 0;
    $('next').disabled = page === slides.length - 1;
    $('directory-list').querySelectorAll('button').forEach((button, index) => {
      if (index === page) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    document.title = `${strip(data.title)} · 蓝鲸数字 · TOTO 内部汇报`;
    history.replaceState(null, '', '#' + data.id);
    document.body.dataset.page = data.id;
    if (page === 0) { phase = 0; paintPhase(); }
    enter(sections[page], direction);
    syncMotion();
  }
  function togglePause() {
    paused = !paused;
    $('motion-toggle').textContent = paused ? '继续' : '暂停';
    $('motion-toggle').setAttribute('aria-pressed', String(paused));
    const coverButton = $('cover-motion-toggle');
    coverButton.classList.toggle('is-paused', paused);
    coverButton.setAttribute('aria-pressed', String(paused));
    coverButton.setAttribute('aria-label', paused ? '继续首页自动动画' : '暂停首页自动动画');
    coverButton.title = coverButton.getAttribute('aria-label');
    syncMotion();
  }
  function showTools() {
    document.body.classList.add('tools-visible');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.remove('tools-visible'), 2200);
  }
  function toggleNotes() {
    notesOpen = !notesOpen;
    $('notes').hidden = !notesOpen;
    $('notes-toggle').setAttribute('aria-pressed', String(notesOpen));
    if (notesOpen) $('notes-close').focus(); else $('notes-toggle').focus();
    syncMotion();
  }
  function openDirectory() { $('directory').showModal(); syncMotion(); }
  async function fullScreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch { $('announcement').textContent = '浏览器未允许全屏，请使用浏览器的全屏功能。'; }
  }
  $('directory-list').innerHTML = slides.map((slide, index) => `<button type="button" data-page="${index}"><span>${String(index + 1).padStart(2, '0')}</span>${strip(slide.title)}</button>`).join('');
  $('directory-list').addEventListener('click', event => {
    const button = event.target.closest('[data-page]');
    if (!button) return;
    $('directory').close();
    go(Number(button.dataset.page));
    stage.focus({preventScroll:true});
  });
  $('contents').addEventListener('click', openDirectory);
  $('directory-close').addEventListener('click', () => $('directory').close());
  $('directory').addEventListener('close', syncMotion);
  $('notes-toggle').addEventListener('click', toggleNotes);
  $('notes-close').addEventListener('click', toggleNotes);
  $('previous').addEventListener('click', () => go(page - 1));
  $('next').addEventListener('click', () => go(page + 1));
  $('motion-toggle').addEventListener('click', togglePause);
  $('cover-motion-toggle').addEventListener('click', togglePause);
  $('fullscreen').addEventListener('click', fullScreen);
  document.addEventListener('fullscreenchange', () => {
    $('fullscreen').textContent = document.fullscreenElement ? '退出全屏' : '全屏';
  });
  stage.addEventListener('click', event => {
    const example = event.target.closest('[data-example]');
    if (example) {
      $('example-feedback').textContent = `${example.dataset.example}（交互示意）`;
    }
  });
  let wheelAt = -Infinity, wheelDelta = 0, wheelUsed = false;
  stage.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || notesOpen || $('directory').open || Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    if (event.target.closest('button,a,input,textarea,select,[contenteditable]')) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelAt > 240) { wheelDelta = 0; wheelUsed = false; }
    wheelAt = now;
    if (wheelUsed) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1);
    if (Math.sign(delta) !== Math.sign(wheelDelta)) wheelDelta = 0;
    wheelDelta += delta;
    if (Math.abs(wheelDelta) < 48) return;
    wheelUsed = true;
    go(page + Math.sign(wheelDelta));
  }, {passive:false});
  document.addEventListener('keydown', event => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable]') || $('directory').open) return;
    if (event.key === 'Escape' && notesOpen) { toggleNotes(); return; }
    if (notesOpen) { if (event.key.toLowerCase() === 'n') toggleNotes(); return; }
    if (event.target.closest('button,a') && ['Space','Enter'].includes(event.code)) return;
    const next = ['ArrowRight','ArrowDown','PageDown'].includes(event.key) || event.code === 'Space';
    const previous = ['ArrowLeft','ArrowUp','PageUp'].includes(event.key);
    if (next || previous) { event.preventDefault(); go(page + (next ? 1 : -1)); }
    else if (event.key === 'Home') { event.preventDefault(); go(0); }
    else if (event.key === 'End') { event.preventDefault(); go(slides.length - 1); }
    else if (event.key.toLowerCase() === 'm') openDirectory();
    else if (event.key.toLowerCase() === 'n') toggleNotes();
    else if (event.key.toLowerCase() === 'f') fullScreen();
    else if (event.key.toLowerCase() === 'p') togglePause();
    else if (event.key.toLowerCase() === 'r') go(page, true);
    showTools();
  });
  addEventListener('hashchange', () => {
    const index = slides.findIndex(slide => slide.id === location.hash.slice(1));
    if (index >= 0) go(index);
  });
  document.addEventListener('visibilitychange', syncMotion);
  reduced.addEventListener('change', () => { go(page, true); });
  document.addEventListener('pointermove', showTools, {passive:true});
  document.addEventListener('pointerdown', showTools, {passive:true});
  go(Math.max(0, slides.findIndex(slide => slide.id === location.hash.slice(1))));
  showTools();
})();
