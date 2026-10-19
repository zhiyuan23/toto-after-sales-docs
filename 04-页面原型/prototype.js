/* Frame navigation uses messages so direct file previews also keep the outer URL. */
(() => {
  'use strict'
  const catalog=window.TOTO_PROTOTYPE_CATALOG
  const {views,pageFor,parseRoute,routeHash}=catalog
  const stage=document.getElementById('previewStage'),loading=document.getElementById('loadingState')
  const frames=new Map()
  const messageOrigin=catalog.root.protocol==='file:'?'*':catalog.root.origin
  let current='',pending
  function updateAddress(key,page){history.replaceState(null,'',routeHash(key,page))}
  function navigate(key){
    if(!Object.hasOwn(views,key)||key===current)return
    location.hash=routeHash(key,frames.get(key)?.dataset.page||'')
  }
  function showLoading(frame){
    clearTimeout(pending);loading.replaceChildren()
    const title=document.createElement('strong'),hint=document.createElement('span')
    title.textContent='正在打开原型';hint.textContent='各应用均使用原型演示数据';loading.append(title,hint)
    loading.hidden=frame.dataset.ready==='true'
    if(loading.hidden)return
    pending=setTimeout(()=>{
      if(frame.hidden||frame.dataset.ready==='true')return
      title.textContent='原型仍在加载';hint.textContent='可重新加载，或在独立页面查看。'
      const link=document.createElement('a');link.href=views[current].file;link.target='_blank';link.rel='noopener';link.textContent='单独打开当前原型';loading.append(link)
    },8000)
  }
  function activate(key,page){
    const view=views[key];current=key
    document.title=`${view.title} · TOTO 原型统一预览`
    stage.setAttribute('aria-label',`当前原型：${view.title}`)
    for(const [id,frame] of frames)frame.hidden=id!==key
    let frame=frames.get(key)
    if(!frame){
      frame=document.createElement('iframe');frame.className='workbench-frame';frame.title=view.title;frame.dataset.ready='false'
      frames.set(key,frame)
      const frameURL=new URL(view.file,catalog.root)
      frame.dataset.page=page||pageFor(key,frameURL.hash)
      if(frame.dataset.page)frameURL.hash=frame.dataset.page
      frameURL.searchParams.set('prototypeRevision',catalog.revision)
      frame.addEventListener('load',()=>{
        frame.dataset.ready='true'
        if(key===current){clearTimeout(pending);loading.hidden=true}
      })
      frame.src=frameURL.href;stage.append(frame)
    }else{
      frame.dataset.page=page||frame.dataset.page||''
      frame.contentWindow.postMessage({type:'toto-prototype:restore',page:frame.dataset.page},messageOrigin)
    }
    frame.hidden=false;updateAddress(key,frame.dataset.page);showLoading(frame)
  }
  window.addEventListener('message',event=>{
    if(!catalog.acceptsMessageOrigin(event.origin))return
    const entry=[...frames].find(([,frame])=>frame.contentWindow===event.source)
    if(!entry)return
    const [key,frame]=entry,data=event.data
    if(!data||typeof data!=='object')return
    if(data.type==='toto-prototype:navigate'&&key===current&&Object.hasOwn(views,data.key))navigate(data.key)
    if(data.type==='toto-prototype:state'&&Object.hasOwn(views,data.key)&&data.key!==key){
      frames.delete(key);frame.remove()
      if(key===current&&parseRoute(location.hash).key===key)location.hash=routeHash(data.key,pageFor(data.key,typeof data.page==='string'?data.page:''))
      return
    }
    if(data.type==='toto-prototype:state'&&data.key===key){
      frame.dataset.page=pageFor(key,typeof data.page==='string'?data.page:'')
      if(key===current&&parseRoute(location.hash).key===key)updateAddress(key,frame.dataset.page)
    }
  })
  function restore(){const {key,page}=parseRoute(location.hash);activate(key,page)}
  window.addEventListener('hashchange',restore)
  restore()
})()
