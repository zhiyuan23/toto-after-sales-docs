'use strict';
(() => {
  const slides = window.REPORT_SLIDES;
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = $('stage');
  window.createReportResponsiveLayout(stage);
  const directory = $('directory');
  let page = 0;
  let mounted = -1;
  let notesOpen = false;
  let paused = false;
  let idleTimer;
  const displayMotion = window.createReportDisplayMotion(reduce);
  const strip = html => html.replace(/<br\s*\/?\s*>/g,'').replace(/<[^>]*>/g,'');
  // Content is authored locally. Never insert API responses or user input into these templates.
  const sections = slides.map((slide, i) => {
    const section = document.createElement('section');
    section.className = 'slide ' + (slide.layout || '');
    section.dataset.slide = slide.id;
    section.hidden = true;
    section.setAttribute('aria-labelledby','slide-title-' + i);
    section.innerHTML = `<header class="slide-header">${slide.chapter ? `<p class="eyebrow">${slide.chapter}</p>` : ''}<h1 id="slide-title-${i}">${slide.title}</h1></header><div class="visual">${slide.html}</div>`;
    if (slide.id === 'closing') {
      const copy = document.createElement('div');
      copy.className = 'closing-copy';
      copy.innerHTML = '<div class="closing-mark" aria-hidden="true"><img src="brand-logo.png" alt="" width="128" height="128"></div>';
      copy.append(...section.childNodes);
      section.append(copy);
    }
    stage.append(section);
    return section;
  });
  const coverMotion = window.createReportCoverMotion(sections[0], reduce);
  window.createReportGraphics(sections);
  const syncMotion = () => {
    const blocked = paused || directory.open || notesOpen || document.hidden;
    coverMotion.sync(slides[page].id === 'cover', blocked);
    displayMotion.sync(blocked);
  };
  function updateDirectory() {
    $('directory-list').querySelectorAll('button').forEach((button,i) => {
      if (i === page) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
  }
  function render(instant = false, replay = false) {
    const changed = mounted !== page || replay;
    const direction = page < mounted ? -1 : 1;
    sections.forEach((section,i)=>{ section.hidden = i !== page; section.inert = i !== page; });
    const section = sections[page];
    document.body.dataset.reportPage = slides[page].id;
    document.querySelector('.folio-index').textContent = slides[page].chapter?.slice(0, 2) || '';
    // Keep authored reveal markers for grouping; every page now opens complete.
    section.querySelectorAll('[data-reveal]').forEach(element=>{
      element.classList.remove('reveal-hidden');
      element.removeAttribute('aria-hidden');
      element.inert = false;
    });
    if (changed) displayMotion.enter(section, direction, instant || directory.open);
    mounted = page;
    const data = slides[page];
    $('previous').disabled = page === 0;
    $('next').disabled = page === slides.length - 1;
    $('counter').textContent = `${String(page + 1).padStart(2,'0')} / ${slides.length}`;
    $('counter').setAttribute('aria-label', `第 ${page + 1} 页，共 ${slides.length} 页`);
    $('notes-title').textContent = strip(data.title);
    $('notes-body').textContent = data.notes;
    $('announcement').textContent = `${page + 1} / ${slides.length}，${strip(data.title)}`;
    document.title = `${strip(data.title)} · 蓝鲸数字 售后服务 · TOTO 内部汇报`;
    updateDirectory();
    syncMotion();
    if (changed) stage.scrollTop = 0;
    history.replaceState(null,'','#' + data.id);
  }
  function go(index) {
    page = Math.max(0, Math.min(slides.length - 1,index));
    render();
  }
  function forward() {
    if (page < slides.length-1) go(page+1);
  }
  function back() {
    if (page > 0) go(page-1);
  }
  function togglePause() {
    paused = !paused;
    $('motion-toggle').textContent = paused ? '继续' : '暂停';
    $('motion-toggle').setAttribute('aria-pressed', String(paused));
    $('motion-toggle').title = paused ? '继续动画（P）' : '暂停动画（P）';
    syncMotion();
  }
  function showTools() {
    document.body.classList.add('tools-visible');
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => document.body.classList.remove('tools-visible'), 2200);
  }
  document.addEventListener('pointermove', showTools, {passive:true});
  document.addEventListener('pointerdown', showTools, {passive:true});
  document.addEventListener('keydown', showTools);
  showTools();
  function showDirectory(instant = false) { updateDirectory(); directory.dataset.instant = String(instant); directory.showModal(); syncMotion(); }
  function closeDirectory(instant = false) { directory.dataset.instant = String(instant); directory.close(); }
  function toggleNotes(instant = false) {
    notesOpen = !notesOpen;
    $('notes').dataset.instant = String(instant);
    $('notes').hidden = !notesOpen;
    $('notes-toggle').setAttribute('aria-pressed',String(notesOpen));
    syncMotion();
    if (notesOpen) $('notes-close').focus(); else $('notes-toggle').focus();
  }
  function setTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    const label = dark ? '切换浅色主题' : '切换深色主题';
    $('theme').setAttribute('aria-label',label);
    $('theme').title = label;
    $('theme').setAttribute('aria-pressed',String(dark));
    coverMotion.themeChanged();
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('announcement').textContent = '浏览器未允许全屏，请使用浏览器的全屏功能。'; }
  }
  $('directory-list').innerHTML = slides.map((slide,i)=>`<button type="button" data-page="${i}"><span>${String(i+1).padStart(2,'0')}</span>${strip(slide.title)}</button>`).join('');
  $('directory-list').addEventListener('click',event=>{const button=event.target.closest('button[data-page]'); if (!button) return; closeDirectory(event.detail === 0); go(Number(button.dataset.page)); stage.focus({preventScroll:true});});
  $('previous').addEventListener('click', back);
  $('next').addEventListener('click', forward);
  $('motion-toggle').addEventListener('click', togglePause);
  $('contents').addEventListener('click',event=>showDirectory(event.detail === 0));
  $('directory-close').addEventListener('click',event=>closeDirectory(event.detail === 0));
  $('notes-toggle').addEventListener('click',event=>toggleNotes(event.detail === 0));
  $('notes-close').addEventListener('click',event=>toggleNotes(event.detail === 0));
  $('theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme !== 'dark'));
  $('fullscreen').addEventListener('click',fullscreen);
  document.addEventListener('fullscreenchange',()=>{
    const label = document.fullscreenElement ? '退出全屏' : '全屏展示';
    $('fullscreen').setAttribute('aria-label',label);
    $('fullscreen').title = label;
    $('fullscreen').textContent = document.fullscreenElement ? '退出全屏' : '全屏';
  });
  stage.addEventListener('click',event=>{
    const button=event.target.closest('[data-example]');
    if (button) {
      $('example-feedback').textContent = button.dataset.example + '（交互示意）';
      displayMotion.feedback($('example-feedback'), event.detail === 0);
      return;
    }

  });
  let wheelAt = -Infinity;
  let wheelDelta = 0;
  let wheelUsed = false;
  stage.addEventListener('wheel', event => {
    if (event.ctrlKey || event.metaKey || event.altKey || event.shiftKey || directory.open || notesOpen) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX) || event.target.closest('a,button,input,textarea,select,[contenteditable]')) return;
    const section = sections[page];
    // Let a scrollable slide finish scrolling before treating the wheel as navigation.
    const scrollable = /^(auto|scroll)$/.test(getComputedStyle(section).overflowY);
    if (scrollable && section.scrollHeight > section.clientHeight + 1 && (event.deltaY > 0 ? section.scrollTop + section.clientHeight < section.scrollHeight - 1 : section.scrollTop > 0)) return;
    event.preventDefault();
    const now = performance.now();
    if (now - wheelAt > 220) {
      wheelDelta = 0;
      wheelUsed = false;
    }
    wheelAt = now;
    if (wheelUsed) return;
    const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? stage.clientHeight : 1);
    if (Math.sign(delta) !== Math.sign(wheelDelta)) wheelDelta = 0;
    wheelDelta += delta;
    if (Math.abs(wheelDelta) < 48) return;
    wheelUsed = true;
    if (wheelDelta > 0) forward(); else back();
  }, {passive: false});
  document.addEventListener('keydown',event=>{
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select,[contenteditable]') || directory.open) return;
    if (notesOpen) {
      if (event.key === 'Escape' || event.key.toLowerCase() === 'n') toggleNotes(true);
      return;
    }
    if (event.code === 'Space' && event.target.closest('button,a')) return;
    if (event.key === 'ArrowRight' || event.code === 'Space') { event.preventDefault(); forward(); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); back(); }
    else if (event.key === 'PageDown') { event.preventDefault(); go(page+1); }
    else if (event.key === 'PageUp') { event.preventDefault(); go(page-1); }
    else if (event.key === 'Home') { event.preventDefault(); go(0); }
    else if (event.key === 'End') { event.preventDefault(); go(slides.length-1); }
    else if (event.key.toLowerCase() === 'm') showDirectory(true);
    else if (event.key.toLowerCase() === 'n') toggleNotes(true);
    else if (event.key.toLowerCase() === 'f') fullscreen();
    else if (event.key.toLowerCase() === 'p') togglePause();
    else if (event.key.toLowerCase() === 'r') render(false, true);
  });
  window.addEventListener('hashchange',()=>{const index=slides.findIndex(x=>x.id===location.hash.slice(1)); if(index>=0) go(index);});
  directory.addEventListener('cancel',()=>{ directory.dataset.instant = 'true'; });
  directory.addEventListener('close',syncMotion);
  document.addEventListener('visibilitychange',syncMotion);
  reduce.addEventListener('change',()=>{ displayMotion.cancel(); coverMotion.reduced(); render(true); });
  const initial = slides.findIndex(x=>x.id===location.hash.slice(1));
  go(initial >= 0 ? initial : 0);
})();
