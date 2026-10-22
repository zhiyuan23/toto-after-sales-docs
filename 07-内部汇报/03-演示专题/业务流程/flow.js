'use strict';
(() => {
  const pages = window.FLOW_PAGES;
  const $ = id => document.getElementById(id);
  const NS = 'http://www.w3.org/2000/svg';
  const width = 1340, height = 620;
  let graphWidth = width, graphHeight = height;
  const viewport = $('viewport');
  let index = 0, scale = 1, fitScale = 1, fitMode = true, jumpTarget = '';
  const text = (tag, value, attrs = {}) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs).forEach(([key, val]) => el.setAttribute(key, val));
    if (value) el.textContent = value;
    return el;
  };
  const size = node => node.type.includes('decision') ? [196, 130] : [200, 100];
  function anchor(node, side) {
    const [w, h] = size(node);
    return ({left:[node.x-w/2,node.y],right:[node.x+w/2,node.y],top:[node.x,node.y-h/2],bottom:[node.x,node.y+h/2]})[side];
  }
  function sideTo(node, point) {
    const dx = point[0] - node.x, dy = point[1] - node.y;
    return Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'bottom' : 'top');
  }
  function edgePoints(edge, lookup) {
    const from = lookup.get(edge.from), to = lookup.get(edge.to);
    const mid = edge.via || [];
    return [anchor(from,edge.start || sideTo(from,mid[0] || [to.x,to.y])),...mid,anchor(to,edge.end || sideTo(to,mid.at(-1) || [from.x,from.y]))];
  }
  function buildDiagram(page) {
    const svg = text('svg','',{viewBox:`0 0 ${width} ${height}`,width,height,class:'flow-svg',role:'group','aria-label':page.title});
    svg.append(text('title',page.title),text('desc',page.subtitle+'。点击节点可查看规则与文档依据。'));
    const defs = text('defs');
    const marker = text('marker','',{id:'arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:7,markerHeight:7,orient:'auto-start-reverse'});
    marker.append(text('path','',{d:'M 0 0 L 10 5 L 0 10 z',fill:'var(--route)'}));
    defs.append(marker); svg.append(defs);
    const lookup = new Map(page.nodes.map(node => [node.id,node]));
    const labels = [];
    page.edges.forEach(edge => {
      const points = edgePoints(edge,lookup);
      const path = text('path','',{d:points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),class:'route'+(edge.conditional?' conditional':''),'marker-end':'url(#arrow)'});
      svg.append(path);
      if (edge.label) {
        const middle = Math.floor((points.length-1)/2);
        const a = points[middle], b = points[middle+1];
        const horizontal = points.length === 2 && a[1] === b[1];
        const from = lookup.get(edge.from), to = lookup.get(edge.to);
        const pos = edge.labelAt || [(a[0]+b[0])/2,horizontal ? Math.max(18,from.y-Math.max(size(from)[1],size(to)[1])/2-12) : (a[1]+b[1])/2-12];
        labels.push(text('text',edge.label,{x:pos[0],y:pos[1],class:'edge-label'}));
      }
    });
    // Labels are drawn after paths so another crossing line cannot obscure the text.
    svg.append(...labels);
    page.nodes.forEach(node => {
      const [w,h] = size(node);
      const group = text('g','',{class:'node '+node.type,transform:`translate(${node.x} ${node.y})`,role:'button',tabindex:'0','data-node':node.id,'aria-label':node.title.join('，')+(node.owner?'，'+node.owner:'')+'，查看规则'});
      group.append(text('title',node.title.join(' / ')+' · '+(node.owner || '条件判断')));
      group.append(node.type.includes('decision') ? text('polygon','',{points:`0,${-h/2} ${w/2},0 0,${h/2} ${-w/2},0`,class:'shape'}) : text('rect','',{x:-w/2,y:-h/2,width:w,height:h,rx:12,class:'shape'}));
      const startY = node.type.includes('decision') ? (node.title.length===1?7:-7) : (node.title.length===1?0:-14);
      node.title.forEach((line,i) => group.append(text('text',line,{x:0,y:startY+i*27,class:'node-title'})));
      if (node.owner) group.append(text('text',node.owner,{x:0,y:35,class:'node-owner'}));
      const open = () => showNode(node);
      group.addEventListener('click',open);
      group.addEventListener('keydown',event=>{if(event.key==='Enter'||event.key===' '){event.preventDefault();event.stopPropagation();open();}});
      svg.append(group);
    });
    return svg;
  }
  function applyScale(center = false) {
    const oldWidth = $('diagram').offsetWidth || graphWidth * scale;
    const oldHeight = $('diagram').offsetHeight || graphHeight * scale;
    const centerX = (viewport.scrollLeft+viewport.clientWidth/2)/oldWidth;
    const centerY = (viewport.scrollTop+viewport.clientHeight/2)/oldHeight;
    const w = graphWidth*scale, h = graphHeight*scale;
    $('diagram').style.width = w+'px'; $('diagram').style.height = h+'px';
    const svg = $('diagram').firstElementChild;
    if (svg) {svg.setAttribute('width',w);svg.setAttribute('height',h);}
    $('zoom').textContent = Math.round(scale*100)+'%';
    $('zoom-out').disabled = scale <= fitScale + .001;
    $('zoom-in').disabled = scale >= Math.max(2,fitScale*2) - .001;
    if (center) {viewport.scrollLeft = centerX*w-viewport.clientWidth/2;viewport.scrollTop = centerY*h-viewport.clientHeight/2;}
  }
  function fit() {
    fitScale = Math.min(viewport.clientWidth/graphWidth,viewport.clientHeight/graphHeight)*.98;
    scale = fitScale; fitMode = true; applyScale();
    viewport.scrollLeft = 0; viewport.scrollTop = 0;
  }
  function openDetails(title,body,kicker,notes,source,go='') {
    $('detail-title').textContent = title; $('detail-body').textContent = body;
    $('detail-kicker').textContent = kicker; $('detail-source').href = source;
    $('detail-notes').replaceChildren(...notes.map(value=>{const p=document.createElement('p');p.textContent=value;return p;}));
    jumpTarget = go; $('jump').hidden = !go;
    $('details').showModal();
  }
  function showNode(node) {
    const page = pages[index];
    openDetails(node.title.join('，'),node.detail || node.title.join('，')+'。具体规则和责任以本阶段文档及以下边界为准。',node.owner || '条件判断',page.notes,page.source,node.go);
  }
  function showBasis() {
    const page = pages[index];
    openDetails('依据与业务口径',page.boundary,'文档梳理 · 2026-10-13',page.notes,page.source);
    for (const [label,href] of page.basis || []) {
      const p=document.createElement('p'),link=document.createElement('a');
      link.textContent=label+' ↗';link.href=href;link.target='_blank';link.rel='noopener';p.append(link);$('detail-notes').append(p);
    }
  }
  function render() {
    const page = pages[index];
    $('kicker').textContent = page.number==='08'?'08 · 跨阶段条件专题':page.number+' · 业务流程';
    $('title').textContent=page.title; $('subtitle').textContent=page.subtitle;
    $('page-number').textContent=page.number;
    $('boundary').textContent=page.boundary; $('source').href=page.source;
    $('takeaways').replaceChildren(...page.takeaways.map(([title,body])=>{const div=document.createElement('div'),strong=document.createElement('strong'),span=document.createElement('span');div.className='takeaway';strong.textContent=title;span.textContent=body;div.append(strong,span);return div;}));
    $('diagram').replaceChildren(buildDiagram(page));
    const svg = $('diagram').firstElementChild;
    const bounds = svg.getBBox();
    graphWidth = bounds.width + 40; graphHeight = bounds.height + 40;
    svg.setAttribute('viewBox',`${bounds.x-20} ${bounds.y-20} ${graphWidth} ${graphHeight}`);
    $('chapters').querySelectorAll('a').forEach((a,i)=>{if(i===index)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
    $('previous').disabled=index===0;$('next').disabled=index===pages.length-1;
    $('announcement').textContent=page.number+'，'+page.title;
    document.title=page.nav+' · TOTO 售后业务流程地图';
    requestAnimationFrame(fit);
  }
  function go(id) {const next=pages.findIndex(page=>page.id===id);index=next<0?0:next;render();}
  function navigate(next) {if(next<0||next>=pages.length)return;location.hash=pages[next].id;}
  $('chapters').replaceChildren(...pages.map(page=>{const a=document.createElement('a'),span=document.createElement('span');a.href='#'+page.id;span.textContent=page.number;a.append(span,document.createTextNode(page.nav));return a;}));
  $('previous').addEventListener('click',()=>navigate(index-1));$('next').addEventListener('click',()=>navigate(index+1));
  $('fit').addEventListener('click',fit);
  $('zoom-in').addEventListener('click',()=>{fitMode=false;scale=Math.min(Math.max(2,fitScale*2),scale*1.25);applyScale(true);});
  $('zoom-out').addEventListener('click',()=>{scale=Math.max(fitScale,scale/1.25);fitMode=scale===fitScale;applyScale(true);});
  $('close-details').addEventListener('click',()=>$('details').close());
  $('details').addEventListener('click',event=>{if(event.target===$('details')){const r=$('details').getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)$('details').close();}});
  $('basis').addEventListener('click',showBasis);
  $('jump').addEventListener('click',()=>{$('details').close();location.hash=jumpTarget;});
  async function fullscreen() {
    try {if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}
    catch {$('announcement').textContent='当前浏览器未允许全屏，请使用浏览器全屏功能。';}
  }
  $('fullscreen').addEventListener('click',fullscreen);
  document.addEventListener('fullscreenchange',()=>{$('fullscreen').textContent=document.fullscreenElement?'退出全屏':'全屏';});
  document.addEventListener('keydown',event=>{
    if($('details').open||event.altKey||event.ctrlKey||event.metaKey||event.shiftKey||event.target.closest('input,select,textarea,[contenteditable="true"]'))return;
    if(event.key==='ArrowRight'){event.preventDefault();navigate(index+1);}
    if(event.key==='ArrowLeft'){event.preventDefault();navigate(index-1);}
    if(event.key.toLowerCase()==='f'){event.preventDefault();fullscreen();}
    if(event.key==='Home'){event.preventDefault();navigate(0);}
    if(event.key==='End'){event.preventDefault();navigate(pages.length-1);}
  });
  const query = new URLSearchParams(location.search);
  const variant = query.get('from');
  const reports = {original:'../../01-当前汇报/项目汇报/index.html',color:'../../04-视觉备选/项目汇报-color/index.html',keynote:'../../04-视觉备选/项目汇报-keynote/index.html'};
  const reportPath = Object.hasOwn(reports,variant) ? reports[variant] : reports.original;
  $('return-report').href=reportPath+(variant==='original'&&query.get('return')==='delivery'?'#delivery':'');
  addEventListener('hashchange',()=>go(location.hash.slice(1)));
  new ResizeObserver(()=>{if(fitMode)fit();else{fitScale=Math.min(viewport.clientWidth/graphWidth,viewport.clientHeight/graphHeight)*.98;scale=Math.max(scale,fitScale);applyScale();}}).observe(viewport);
  addEventListener('beforeprint',()=>{scale=fitScale;applyScale();});
  addEventListener('afterprint',fit);
  go(location.hash.slice(1));
})();
