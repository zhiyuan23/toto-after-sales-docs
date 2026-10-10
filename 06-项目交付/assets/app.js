'use strict';
const queryInput=document.querySelector('[data-search]');
const statusFilter=document.querySelector('[data-status-filter]');
const categoryFilter=document.querySelector('[data-category-filter]');
const targets=[...document.querySelectorAll('[data-search-item]')];
const result=document.querySelector('[data-search-result]');
function filter(){
 const query=(queryInput?.value||'').trim().toLocaleLowerCase();
 const status=statusFilter?.value||'';
 const category=categoryFilter?.value||'';
 let visible=0;
 targets.forEach(el=>{const matches=(!query||el.textContent.toLocaleLowerCase().includes(query))&&(!status||el.dataset.status===status)&&(!category||el.dataset.category===category);el.hidden=!matches;if(matches)visible++;});
 document.querySelectorAll('[data-search-context]').forEach(section=>{section.hidden=!!(query||status||category);});
 document.querySelectorAll('[data-search-group]').forEach(group=>{group.hidden=!group.querySelector('[data-search-item]:not([hidden])');});
 document.querySelectorAll('.sidebar nav a[href^="#"],.rail a[href^="#"]').forEach(link=>{const section=document.getElementById(link.hash.slice(1));link.hidden=!!section?.hidden;});
 if(result)result.textContent=query||status||category?`找到 ${visible} 项内容`:`显示全部 ${targets.length} 项内容`;
 const empty=document.querySelector('[data-empty]');if(empty)empty.hidden=visible!==0;
}
[queryInput,statusFilter,categoryFilter].forEach(el=>el?.addEventListener('input',filter));
document.querySelector('[data-clear]')?.addEventListener('click',()=>{[queryInput,statusFilter,categoryFilter].forEach(el=>{if(el)el.value='';});filter();queryInput?.focus();});
// 筛选结果中的培训、交接等正文链接先恢复全文，再交给浏览器定位。
document.addEventListener('click',event=>{const link=event.target.closest('a[href^="#"]');if(!link)return;const target=document.getElementById(link.hash.slice(1));if(target?.closest('[hidden]')){[queryInput,statusFilter,categoryFilter].forEach(el=>{if(el)el.value='';});filter();}});
const menu=document.querySelector('[data-menu]');const sidebar=document.querySelector('.sidebar');
menu?.addEventListener('click',()=>{const open=sidebar.classList.toggle('is-open');menu.setAttribute('aria-expanded',String(open));});
sidebar?.addEventListener('click',event=>{if(event.target.closest('a')){sidebar.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',event=>{if(event.key==='Escape'){sidebar?.classList.remove('is-open');menu?.setAttribute('aria-expanded','false');}});
const sectionLinks=[...document.querySelectorAll('.sidebar nav a[href^="#"]')];
const sections=[...document.querySelectorAll('.content-section')];
const observer=new IntersectionObserver(entries=>{const active=entries.filter(entry=>entry.isIntersecting&&!entry.target.hidden).sort((a,b)=>a.boundingClientRect.top-b.boundingClientRect.top)[0];if(!active)return;sectionLinks.forEach(link=>{const selected=link.hash===`#${active.target.id}`;link.classList.toggle('current',selected);if(selected)link.setAttribute('aria-current','location');else link.removeAttribute('aria-current');});},{rootMargin:'-90px 0px -55% 0px',threshold:0});
sections.forEach(section=>observer.observe(section));
let printState=null;
window.addEventListener('beforeprint',()=>{if(printState)return;printState={hidden:[...document.querySelectorAll('[hidden]')],details:[...document.querySelectorAll('details:not([open])')]};printState.hidden.forEach(el=>{if(el.matches('[data-search-item],[data-search-group],[data-search-context]'))el.hidden=false;});printState.details.forEach(el=>el.open=true);});
window.addEventListener('afterprint',()=>{if(!printState)return;printState.details.forEach(el=>el.open=false);printState.hidden.forEach(el=>el.hidden=true);printState=null;});
document.querySelector('[data-print]')?.addEventListener('click',()=>window.print());
if(targets.length)filter();
