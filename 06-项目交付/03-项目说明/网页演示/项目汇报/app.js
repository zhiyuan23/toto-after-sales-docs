'use strict';
(() => {
  const slides = window.REPORT_SLIDES;
  const $ = id => document.getElementById(id);
  const reduce = matchMedia('(prefers-reduced-motion: reduce)');
  const stage = $('stage');
  const directory = $('directory');
  let page = 0;
  let revealed = 0;
  let mounted = -1;
  let notesOpen = false;
  let transitions = [];
  const ease = 'cubic-bezier(.23,1,.32,1)';
  const strip = html => html.replace(/<br\s*\/?\s*>/g,'').replace(/<[^>]*>/g,'');
  // Content is authored locally. Never insert API responses or user input into these templates.
  const sections = slides.map((slide, i) => {
    const section = document.createElement('section');
    section.className = 'slide ' + (slide.layout || '');
    section.dataset.slide = slide.id;
    section.hidden = true;
    section.setAttribute('aria-labelledby','slide-title-' + i);
    section.innerHTML = `<header class="slide-header"><p class="eyebrow">${slide.chapter}</p><h1 id="slide-title-${i}">${slide.title}</h1><p class="subtitle">${slide.subtitle}</p></header><div class="visual">${slide.html}</div>`;
    if (slide.layout === 'flow') {
      section.querySelector('.slide-header').insertAdjacentHTML('beforeend','<div class="flow-modes" role="group" aria-label="选择工单分配模式"><button type="button" data-flow-mode="manual" aria-pressed="false">人工分配</button><button type="button" data-flow-mode="smart" aria-pressed="true">智能分配</button></div>');
    }
    stage.append(section);
    return section;
  });
  const notifyFlow = (action, mode) => {
    const frame = $('work-order-frame');
    frame?.contentWindow?.postMessage({type:'toto-report',action,mode,theme:document.documentElement.dataset.theme}, location.origin === 'null' ? '*' : location.origin);
  };
  // Only the embedded local animation may update the shared heading and mode controls.
  window.addEventListener('message',event=>{
    if (event.source !== $('work-order-frame').contentWindow || (location.origin !== 'null' && event.origin !== location.origin) || event.data?.type !== 'toto-flow-state') return;
    if (typeof event.data.title !== 'string' || event.data.title.length > 64 || !['manual','smart'].includes(event.data.mode)) return;
    const section = sections.find(item=>item.dataset.slide === 'work-order');
    section.querySelector('h1').textContent = event.data.title;
    section.querySelectorAll('[data-flow-mode]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.flowMode === event.data.mode)));
  });
  function animateIn(elements, instant) {
    if (instant || reduce.matches) return;
    elements.forEach((element, i) => {
      const animation = element.animate([{opacity:.05,transform:'translateY(12px)'},{opacity:1,transform:'translateY(0)'}],{duration:500,delay:i*60,easing:ease});
      transitions.push(animation);
      animation.finished.catch(()=>{});
    });
  }
  function updateDirectory() {
    $('directory-list').querySelectorAll('button').forEach((button,i) => {
      if (i === page) button.setAttribute('aria-current','page'); else button.removeAttribute('aria-current');
    });
  }
  function render(instant = false) {
    const changed = mounted !== page;
    transitions.forEach(a=>a.cancel());
    transitions = [];
    if (changed) notifyFlow('pause');
    sections.forEach((section,i)=>{ section.hidden = i !== page; });
    const section = sections[page];
    const newlyVisible = [];
    section.querySelectorAll('[data-reveal]').forEach(element=>{
      const hidden = Number(element.dataset.reveal) > revealed;
      if (!hidden && element.classList.contains('reveal-hidden')) newlyVisible.push(element);
      element.classList.toggle('reveal-hidden',hidden);
      element.setAttribute('aria-hidden',String(hidden));
      element.inert = hidden;
    });
    animateIn(changed ? [section.querySelector('.slide-header'),...section.querySelectorAll('[data-reveal="0"]'),...(!section.querySelector('[data-reveal]') ? [section.querySelector('.visual')] : [])] : newlyVisible, instant);
    mounted = page;
    const data = slides[page];
    $('chapter').textContent = data.chapter;
    $('counter').textContent = `${String(page + 1).padStart(2,'0')} / ${slides.length}`;
    $('progress-fill').style.transform = `scaleX(${(page + 1)/slides.length})`;
    $('previous').disabled = page === 0 && revealed === 0;
    $('next').disabled = page === slides.length - 1 && revealed === (data.steps || 0);
    $('next').innerHTML = (revealed < (data.steps || 0) ? '继续' : page === slides.length - 1 ? '汇报结束' : data.nextLabel || '下一页') + ' <span aria-hidden="true">→</span>';
    $('step-hint').textContent = data.steps ? `讲解 ${revealed + 1} / ${data.steps + 1}` : '';
    $('notes-title').textContent = strip(data.title);
    $('notes-body').textContent = data.notes;
    $('announcement').textContent = `${page + 1} / ${slides.length}，${strip(data.title)}`;
    document.title = `${strip(data.title)} · TOTO 项目汇报`;
    updateDirectory();
    if (changed && data.id === 'work-order') notifyFlow('activate');
    if (changed) stage.scrollTop = 0;
    history.replaceState(null,'','#' + data.id);
  }
  function go(index, instant = false) {
    page = Math.max(0, Math.min(slides.length - 1,index));
    revealed = 0;
    render(instant);
  }
  function forward(instant = false) {
    if (revealed < (slides[page].steps || 0)) { revealed++; render(instant); }
    else if (page < slides.length-1) go(page+1,instant);
  }
  function back(instant = false) {
    if (revealed > 0) { revealed--; render(instant); }
    else if (page > 0) { page--; revealed = slides[page].steps || 0; render(instant); }
  }
  function showDirectory() { updateDirectory(); directory.showModal(); }
  function toggleNotes() {
    notesOpen = !notesOpen;
    $('notes').hidden = !notesOpen;
    $('notes-toggle').setAttribute('aria-pressed',String(notesOpen));
    if (notesOpen) $('notes-close').focus(); else $('notes-toggle').focus();
  }
  function setTheme(dark) {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    $('theme').textContent = dark ? '浅色' : '深色';
    notifyFlow('theme');
  }
  async function fullscreen() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { $('announcement').textContent = '浏览器未允许全屏，请使用浏览器的全屏功能。'; }
  }
  $('directory-list').innerHTML = slides.map((slide,i)=>`<button type="button" data-page="${i}"><span>${String(i+1).padStart(2,'0')}</span>${strip(slide.title)}</button>`).join('');
  $('directory-list').addEventListener('click',event=>{const button=event.target.closest('button[data-page]'); if (!button) return; directory.close(); go(Number(button.dataset.page)); stage.focus({preventScroll:true});});
  $('contents').addEventListener('click',showDirectory);
  $('directory-close').addEventListener('click',()=>directory.close());
  $('previous').addEventListener('click',()=>back());
  $('next').addEventListener('click',()=>forward());
  $('notes-toggle').addEventListener('click',toggleNotes);
  $('notes-close').addEventListener('click',toggleNotes);
  $('theme').addEventListener('click',()=>setTheme(document.documentElement.dataset.theme !== 'dark'));
  $('fullscreen').addEventListener('click',fullscreen);
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent = document.fullscreenElement ? '退出全屏' : '全屏汇报';});
  stage.addEventListener('click',event=>{
    const modeButton = event.target.closest('[data-flow-mode]');
    if (modeButton) notifyFlow('mode',modeButton.dataset.flowMode);
    const button=event.target.closest('[data-example]');
    if (button) $('example-feedback').textContent = button.dataset.example + '（交互示意）';
  });
  document.addEventListener('keydown',event=>{
    if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select') || directory.open) return;
    if (event.code === 'Space' && event.target.closest('button,a')) return;
    if (event.key === 'ArrowRight' || event.code === 'Space') { event.preventDefault(); forward(true); }
    else if (event.key === 'ArrowLeft') { event.preventDefault(); back(true); }
    else if (event.key === 'PageDown') { event.preventDefault(); go(page+1,true); }
    else if (event.key === 'PageUp') { event.preventDefault(); go(page-1,true); }
    else if (event.key === 'Home') { event.preventDefault(); go(0,true); }
    else if (event.key === 'End') { event.preventDefault(); go(slides.length-1,true); }
    else if (event.key.toLowerCase() === 'm') showDirectory();
    else if (event.key.toLowerCase() === 'n') toggleNotes();
    else if (event.key.toLowerCase() === 'f') fullscreen();
    else if (event.key === 'Escape' && notesOpen) toggleNotes();
  });
  window.addEventListener('hashchange',()=>{const index=slides.findIndex(x=>x.id===location.hash.slice(1)); if(index>=0) go(index,true);});
  $('work-order-frame').addEventListener('load',()=>notifyFlow(slides[page].id === 'work-order' ? 'activate' : 'pause'));
  document.addEventListener('visibilitychange',()=>{if(document.hidden) notifyFlow('pause');});
  reduce.addEventListener('change',()=>render(true));
  const initial = slides.findIndex(x=>x.id===location.hash.slice(1));
  go(initial >= 0 ? initial : 0);
})();
