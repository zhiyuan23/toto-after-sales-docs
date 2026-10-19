/* Native header enhancement. The original page content and draft state stay in place. */
(() => {
  'use strict'
  const catalog=window.TOTO_PROTOTYPE_CATALOG
  if(!catalog||document.body.classList.contains('capture-mode'))return
  const {root,views,resolveView,pageFor}=catalog
  const embedded=window.parent!==window
  const messageOrigin=root.protocol==='file:'?'*':root.origin
  function publishState(){
    if(!embedded)return
    const key=resolveView(new URL(location.href))
    window.parent.postMessage({type:'toto-prototype:state',key,page:pageFor(key,location.hash)},messageOrigin)
  }
  // Capture locally: file: frames cannot read their parent's DOM, or vice versa.
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return
    const anchor=event.target.closest('a[href]')
    if(!anchor||['_blank','_top'].includes(anchor.target)||anchor.hasAttribute('download'))return
    const key=resolveView(new URL(anchor.href))
    if(!key)return
    const current=resolveView(new URL(location.href))
    // Same-page anchors drive the existing mini-program and parts interactions.
    if(key===current&&!anchor.closest('.prototype-identity'))return
    event.preventDefault();event.stopImmediatePropagation()
    document.querySelector('.prototype-perspective')?.removeAttribute('open')
    if(embedded)window.parent.postMessage({type:'toto-prototype:navigate',key},messageOrigin)
    else if(key!==current)location.assign(new URL(`index.html#${key}`,root).href)
  },true)
  window.addEventListener('message',event=>{
    if(!embedded||event.source!==window.parent||!catalog.acceptsMessageOrigin(event.origin)||event.data?.type!=='toto-prototype:restore')return
    const key=resolveView(new URL(location.href))
    const page=pageFor(key,typeof event.data.page==='string'?event.data.page:'')
    document.querySelector('.prototype-perspective')?.removeAttribute('open')
    if(page&&location.hash!==`#${page}`)location.hash=page
  })
  window.addEventListener('hashchange',publishState)
  document.addEventListener('toto-prototype-pagechange',publishState)
  let listeners
  function enhanceHeader(){
  const header=document.querySelector('.topbar,.workspace-header,.design-top,.parts-topbar')
  if(!header||header.querySelector('.prototype-identity'))return
  listeners?.abort();listeners=new AbortController()
  const listenerOptions={signal:listeners.signal}
  const {root,views,perspectives,perspectiveFor,resolveView}=catalog
  const key=resolveView(new URL(location.href))||'administrator'
  const hostMini=decodeURIComponent(location.pathname).includes('/小程序/')
  if(hostMini)document.body.classList.add('prototype-mini-host')
  if(location.pathname.endsWith('/service-station-card-prototype.html'))document.body.classList.add('prototype-card-host')
  header.classList.add('prototype-native-header')
  const legacy=header.querySelectorAll('.brand,.parts-brand,.workspace-brand,.perspective-switch,.perspective-menu,.topbar-perspective,.view-switch')
  for(const node of legacy){node.classList.add('prototype-retired-control');node.hidden=true;node.setAttribute('aria-hidden','true')}
  if(header.classList.contains('design-top'))for(const node of [...header.children].filter(node=>node.matches('strong,span'))){node.classList.add('prototype-retired-control');node.hidden=true}
  const identity=document.createElement('div');identity.className='prototype-identity'
  const brand=document.createElement('a');brand.className='prototype-brand';brand.target='_top'
  brand.innerHTML='<strong>蓝鲸数字</strong><span>售后服务</span>'
  const chooser=document.createElement('details');chooser.className='prototype-perspective'
  const trigger=document.createElement('summary')
  trigger.innerHTML='<span class="native-current-view"></span><svg class="native-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"/></svg>'
  const menu=document.createElement('nav');menu.className='prototype-perspective-menu';menu.setAttribute('aria-label','选择工作视角')
  let group=''
  const roleLinks=new Map()
  for(const role of perspectives){
    if(role.group!==group){const heading=document.createElement('p');heading.className='native-group-label';heading.textContent=role.group;menu.append(heading);group=role.group}
    const link=document.createElement('a');link.href=new URL(`index.html#${role.key}`,root);link.target='_top';link.setAttribute('aria-label',role.label)
    const copy=document.createElement('span'),label=document.createElement('strong'),note=document.createElement('small')
    label.textContent=role.label;note.textContent=role.note;copy.append(label,note);link.append(copy);menu.append(link);roleLinks.set(role.key,link)
  }
  const more=document.createElement('details');more.className='prototype-more-pages'
  const moreSummary=document.createElement('summary');moreSummary.textContent='其他页面与方案';moreSummary.setAttribute('aria-label','其他页面与方案');more.append(moreSummary)
  group=''
  for(const [id,view] of Object.entries(views)){
    if(perspectives.some(role=>role.key===id))continue
    if(group!==view.group){const heading=document.createElement('p');heading.className='native-group-label';heading.textContent=view.group;more.append(heading);group=view.group}
    const link=document.createElement('a');link.href=new URL(`index.html#${id}`,root);link.target='_top';link.textContent=view.title;link.setAttribute('aria-label',view.title)
    if(id===key)link.setAttribute('aria-current','page')
    more.append(link)
  }
  menu.append(more);chooser.append(trigger,menu);identity.append(brand,chooser);header.prepend(identity)
  function sync(){
    const currentKey=resolveView(new URL(location.href))||key
    const roleKey=perspectiveFor(currentKey),role=perspectives.find(value=>value.key===roleKey)
    trigger.querySelector('.native-current-view').textContent=role.label
    trigger.setAttribute('aria-label',`切换工作视角，当前：${role.label}`)
    brand.href=new URL(`index.html#${roleKey}`,root)
    for(const [id,link] of roleLinks){
      link.querySelector('svg')?.remove()
      if(id===roleKey){link.setAttribute('aria-current','page');link.insertAdjacentHTML('beforeend','<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m5 12 4 4L19 6"/></svg>')}
      else link.removeAttribute('aria-current')
    }
  }
  document.addEventListener('click',event=>{
    if(!chooser.contains(event.target))chooser.open=false
    if(event.target.closest('.prototype-perspective-menu a'))chooser.open=false
    if(event.target.closest('[data-app]'))queueMicrotask(sync)
  },listenerOptions)
  chooser.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();event.stopPropagation();chooser.open=false;trigger.focus();return}
    if(!['ArrowDown','ArrowUp','Home','End'].includes(event.key))return
    event.preventDefault();chooser.open=true
    const links=[...menu.querySelectorAll('a')].filter(link=>link.getClientRects().length)
    const index=links.indexOf(document.activeElement)
    const next=event.key==='Home'?0:event.key==='End'?links.length-1:index<0?(event.key==='ArrowUp'?links.length-1:0):(index+(event.key==='ArrowUp'?-1:1)+links.length)%links.length
    links[next]?.focus()
  },listenerOptions)
  window.addEventListener('hashchange',sync,listenerOptions)
  document.addEventListener('toto-prototype-pagechange',sync,listenerOptions)
  sync()
  }
  document.addEventListener('toto-prototype-header-ready',enhanceHeader)
  window.addEventListener('load',enhanceHeader,{once:true})
  enhanceHeader()
  publishState()
  window.addEventListener('load',publishState,{once:true})
})()
