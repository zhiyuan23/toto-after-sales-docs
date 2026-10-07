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
  const displayMotion = window.createReportDisplayMotion(reduce);
  const strip = html => html.replace(/<br\s*\/?\s*>/g,'').replace(/<[^>]*>/g,'');
  // Content is authored locally. Never insert API responses or user input into these templates.
  const sections = slides.map((slide, i) => {
    const section = document.createElement('section');
    section.className = 'slide ' + (slide.layout || '');
    section.dataset.slide = slide.id;
    section.hidden = true;
    section.setAttribute('aria-labelledby','slide-title-' + i);
    section.innerHTML = `<header class="slide-header"><p class="eyebrow">${slide.chapter}</p><h1 id="slide-title-${i}">${slide.title}</h1><p class="subtitle">${slide.subtitle}</p></header><div class="visual">${slide.html}</div>`;
    stage.append(section);
    return section;
  });
  const coverMotion = window.createReportCoverMotion(sections[0], reduce);
  window.createReportGraphics(sections);
  const syncMotion = () => {
    const blocked = directory.open || notesOpen || document.hidden;
    coverMotion.sync(slides[page].id === 'cover', blocked);
    if (directory.open || document.hidden) displayMotion.cancel();
  };
  function updateDirectory() {
    $('directory-list').querySelectorAll('button').forEach((button,i) => {
      if (i === page) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
  }
  function render(instant = false) {
    const changed = mounted !== page;
    const direction = page < mounted ? -1 : 1;
    sections.forEach((section,i)=>{ section.hidden = i !== page; });
    const section = sections[page];
    // Keep authored reveal markers for grouping; every page now opens complete.
    section.querySelectorAll('[data-reveal]').forEach(element=>{
      element.classList.remove('reveal-hidden');
      element.removeAttribute('aria-hidden');
      element.inert = false;
    });
    if (changed) displayMotion.enter(section, direction, instant || directory.open);
    mounted = page;
    const data = slides[page];
    $('chapter').textContent = data.chapter;
    $('counter').textContent = `${String(page + 1).padStart(2,'0')} / ${slides.length}`;
    $('progress-fill').style.transitionDuration = instant || reduce.matches ? '0ms' : '';
    $('progress-fill').style.transform = `scaleX(${(page + 1)/slides.length})`;
    $('previous').disabled = page === 0;
    $('next').disabled = page === slides.length - 1;
    $('next').innerHTML = (page === slides.length - 1 ? '汇报结束' : data.nextLabel || '下一页') + ' <span aria-hidden="true">→</span>';
    $('step-hint').textContent = '';
    $('notes-title').textContent = strip(data.title);
    $('notes-body').textContent = data.notes;
    $('announcement').textContent = `${page + 1} / ${slides.length}，${strip(data.title)}`;
    document.title = `${strip(data.title)} · TOTO 项目汇报第三版`;
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
    $('theme').textContent = dark ? '浅色' : '深色';
    coverMotion.themeChanged();
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('announcement').textContent = '浏览器未允许全屏，请使用浏览器的全屏功能。'; }
  }
  $('directory-list').innerHTML = slides.map((slide,i)=>`<button type="button" data-page="${i}"><span>${String(i+1).padStart(2,'0')}</span>${strip(slide.title)}</button>`).join('');
  $('directory-list').addEventListener('click',event=>{const button=event.target.closest('button[data-page]'); if (!button) return; closeDirectory(event.detail === 0); go(Number(button.dataset.page)); stage.focus({preventScroll:true});});
  $('contents').addEventListener('click',event=>showDirectory(event.detail === 0));
  $('directory-close').addEventListener('click',event=>closeDirectory(event.detail === 0));
  $('previous').addEventListener('click',()=>back());
  $('next').addEventListener('click',()=>forward());
  $('notes-toggle').addEventListener('click',event=>toggleNotes(event.detail === 0));
  $('notes-close').addEventListener('click',event=>toggleNotes(event.detail === 0));
  $('theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme !== 'dark'));
  $('fullscreen').addEventListener('click',fullscreen);
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent = document.fullscreenElement ? '退出全屏' : '全屏汇报';});
  stage.addEventListener('click',event=>{
    const button=event.target.closest('[data-example]');
    if (button) {
      $('example-feedback').textContent = button.dataset.example + '（交互示意）';
      displayMotion.feedback($('example-feedback'), event.detail === 0);
    }
  });
  document.addEventListener('keydown',event=>{
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select') || directory.open) return;
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
    else if (event.key === 'Escape' && notesOpen) toggleNotes(true);
  });
  window.addEventListener('hashchange',()=>{const index=slides.findIndex(x=>x.id===location.hash.slice(1)); if(index>=0) go(index);});
  directory.addEventListener('cancel',()=>{ directory.dataset.instant = 'true'; });
  directory.addEventListener('close',syncMotion);
  document.addEventListener('visibilitychange',syncMotion);
  reduce.addEventListener('change',()=>{ displayMotion.cancel(); coverMotion.reduced(); render(true); });
  const initial = slides.findIndex(x=>x.id===location.hash.slice(1));
  go(initial >= 0 ? initial : 0);
})();
