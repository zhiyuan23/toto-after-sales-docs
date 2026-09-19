(() => {
  const icons = {
    building:'<path d="M4 21V5l8-3 8 3v16"/><path d="M9 21v-4h6v4M8 8h.01M12 8h.01M16 8h.01M8 12h.01M12 12h.01M16 12h.01"/>',
    'chevron-down':'<path d="m6 9 6 6 6-6"/>', chart:'<path d="M3 3v18h18"/><path d="m7 15 4-4 3 3 5-7"/>', search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>', archive:'<path d="M4 7h16v13H4zM3 3h18v4H3zM9 11h6"/>', maximize:'<path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5"/>', refresh:'<path d="M20 7h-5V2"/><path d="M20 7a9 9 0 1 0 1 8"/>', moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z"/>', sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.42 1.42M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.42-1.42M17.66 6.34l1.41-1.41"/>', gauge:'<path d="M4 14a8 8 0 1 1 16 0"/><path d="m12 14 4-4M5 19h14"/>', map:'<path d="m3 6 6-3 6 3 6-3v15l-6 3-6-3-6 3z"/><path d="M9 3v15M15 6v15"/>', shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/><path d="m9 12 2 2 4-4"/>', 'file-chart':'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 17v-3M12 17v-6M16 17v-2"/>', clipboard:'<path d="M9 5H6a2 2 0 0 0-2 2v13h16V7a2 2 0 0 0-2-2h-3"/><rect x="9" y="2" width="6" height="5" rx="1"/>', receipt:'<path d="M5 3v18l3-2 4 2 4-2 3 2V3l-3 2-4-2-4 2z"/><path d="M9 9h6M9 13h6"/>', scan:'<path d="M3 7V3h4M17 3h4v4M21 17v4h-4M7 21H3v-4M8 12h8"/>', store:'<path d="M3 9l2-6h14l2 6M5 9v12h14V9M9 21v-7h6v7"/><path d="M3 9c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0"/>', wrench:'<path d="M14.7 6.3a4 4 0 0 0-5-5l2.1 2.1-2.4 2.4-2.1-2.1a4 4 0 0 0 5 5L20 16.4a2.1 2.1 0 0 1-3 3l-7.7-7.7"/>', package:'<path d="m12 2 9 5-9 5-9-5zM3 7v10l9 5 9-5V7M12 12v10"/>', boxes:'<path d="M3 6h8v6H3zM13 3h8v6h-8zM13 12h8v6h-8zM3 15h8v6H3z"/>', database:'<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v6c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 11v6c0 1.7 3.6 3 8 3s8-1.3 8-3v-6"/>', 'panel-left':'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M9 4v16M15 9l-3 3 3 3"/>', layers:'<path d="m12 2 9 5-9 5-9-5z"/><path d="m3 12 9 5 9-5M3 17l9 5 9-5"/>', send:'<path d="m22 2-7 20-4-9-9-4zM22 2 11 13"/>', users:'<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', layout:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', 'rotate-ccw':'<path d="M3 2v6h6"/><path d="M3 8a9 9 0 1 1 2.6 8.4"/>', info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>', 'arrow-up-right':'<path d="M7 17 17 7M7 7h10v10"/>', 'chevron-right':'<path d="m9 18 6-6-6-6"/>', x:'<path d="M18 6 6 18M6 6l12 12"/>', 'arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>'
  };

  const provinceStats = {
    北京:{orders:468,closed:371,cancelled:9,complaints:6,stations:12,located:12,enabled:12},天津:{orders:286,closed:221,cancelled:7,complaints:3,stations:8,located:8,enabled:8},河北:{orders:716,closed:562,cancelled:17,complaints:8,stations:22,located:20,enabled:21},山西:{orders:342,closed:262,cancelled:8,complaints:4,stations:11,located:9,enabled:10},内蒙古:{orders:251,closed:191,cancelled:6,complaints:3,stations:9,located:7,enabled:9},辽宁:{orders:469,closed:368,cancelled:11,complaints:5,stations:15,located:14,enabled:14},吉林:{orders:226,closed:176,cancelled:5,complaints:2,stations:8,located:7,enabled:8},黑龙江:{orders:258,closed:198,cancelled:6,complaints:3,stations:9,located:8,enabled:9},上海:{orders:628,closed:504,cancelled:12,complaints:6,stations:15,located:15,enabled:15},江苏:{orders:1248,closed:986,cancelled:26,complaints:18,stations:42,located:38,enabled:40},浙江:{orders:1086,closed:864,cancelled:21,complaints:13,stations:34,located:32,enabled:33},安徽:{orders:612,closed:472,cancelled:15,complaints:7,stations:18,located:16,enabled:17},福建:{orders:536,closed:421,cancelled:12,complaints:6,stations:16,located:15,enabled:16},江西:{orders:386,closed:296,cancelled:9,complaints:4,stations:12,located:11,enabled:11},山东:{orders:928,closed:731,cancelled:20,complaints:11,stations:28,located:26,enabled:27},河南:{orders:759,closed:591,cancelled:18,complaints:9,stations:24,located:21,enabled:23},湖北:{orders:648,closed:507,cancelled:14,complaints:7,stations:20,located:18,enabled:19},湖南:{orders:573,closed:449,cancelled:13,complaints:6,stations:18,located:16,enabled:17},广东:{orders:1486,closed:1173,cancelled:31,complaints:17,stations:46,located:44,enabled:45},广西:{orders:417,closed:321,cancelled:10,complaints:5,stations:13,located:11,enabled:12},海南:{orders:138,closed:105,cancelled:3,complaints:2,stations:5,located:5,enabled:5},重庆:{orders:354,closed:278,cancelled:8,complaints:4,stations:11,located:10,enabled:11},四川:{orders:784,closed:612,cancelled:17,complaints:9,stations:25,located:22,enabled:24},贵州:{orders:291,closed:221,cancelled:7,complaints:3,stations:9,located:8,enabled:9},云南:{orders:315,closed:239,cancelled:8,complaints:4,stations:10,located:8,enabled:9},西藏:{orders:48,closed:34,cancelled:1,complaints:0,stations:2,located:1,enabled:2},陕西:{orders:426,closed:331,cancelled:9,complaints:5,stations:13,located:12,enabled:13},甘肃:{orders:192,closed:145,cancelled:5,complaints:2,stations:7,located:5,enabled:6},青海:{orders:79,closed:58,cancelled:2,complaints:1,stations:3,located:2,enabled:3},宁夏:{orders:96,closed:72,cancelled:2,complaints:1,stations:3,located:3,enabled:3},新疆:{orders:184,closed:137,cancelled:4,complaints:2,stations:6,located:5,enabled:6},台湾:{orders:0,closed:0,cancelled:0,complaints:0,stations:0,located:0,enabled:0},香港:{orders:42,closed:34,cancelled:1,complaints:0,stations:1,located:1,enabled:1},澳门:{orders:26,closed:20,cancelled:1,complaints:0,stations:1,located:1,enabled:1}
  };

  const stations = [
    {name:'北京北区服务站',province:'北京',coord:[116.41,39.91],enabled:true,limit:28,people:12,areas:8,items:'安装、维修'},
    {name:'上海浦东服务站',province:'上海',coord:[121.48,31.23],enabled:true,limit:36,people:15,areas:11,items:'安装、维修、指导'},
    {name:'南京中心服务站',province:'江苏',coord:[118.80,32.06],enabled:true,limit:32,people:14,areas:9,items:'安装、维修'},
    {name:'苏州工业园服务站',province:'江苏',coord:[120.62,31.30],enabled:true,limit:26,people:11,areas:7,items:'安装、维修'},
    {name:'杭州城东服务站',province:'浙江',coord:[120.19,30.26],enabled:true,limit:30,people:13,areas:8,items:'安装、维修、指导'},
    {name:'宁波海曙服务站',province:'浙江',coord:[121.55,29.87],enabled:false,limit:18,people:8,areas:5,items:'安装、维修'},
    {name:'济南中心服务站',province:'山东',coord:[117.12,36.65],enabled:true,limit:28,people:12,areas:8,items:'安装、维修'},
    {name:'郑州中心服务站',province:'河南',coord:[113.62,34.75],enabled:true,limit:30,people:13,areas:9,items:'安装、维修'},
    {name:'武汉江汉服务站',province:'湖北',coord:[114.31,30.59],enabled:true,limit:27,people:12,areas:8,items:'安装、维修、指导'},
    {name:'长沙中心服务站',province:'湖南',coord:[112.94,28.23],enabled:true,limit:24,people:10,areas:7,items:'安装、维修'},
    {name:'广州东区服务站',province:'广东',coord:[113.27,23.13],enabled:true,limit:38,people:16,areas:12,items:'安装、维修、指导'},
    {name:'深圳中心服务站',province:'广东',coord:[114.06,22.55],enabled:true,limit:34,people:14,areas:9,items:'安装、维修'},
    {name:'成都高新服务站',province:'四川',coord:[104.07,30.57],enabled:true,limit:29,people:12,areas:9,items:'安装、维修、指导'},
    {name:'西安中心服务站',province:'陕西',coord:[108.94,34.34],enabled:true,limit:24,people:10,areas:7,items:'安装、维修'},
    {name:'沈阳中心服务站',province:'辽宁',coord:[123.43,41.80],enabled:true,limit:22,people:9,areas:6,items:'安装、维修'}
  ];

  const qualityFacts = {
    全国:{object:'华东区域',date:'2026-09-16',serviceCount:682,timeliness:'94.72%',firstTime:'91.06%',complaints:8},
    江苏:{object:'南京中心服务站',date:'2026-09-16',serviceCount:46,timeliness:'95.65%',firstTime:'91.30%',complaints:1},
    浙江:{object:'杭州城东服务站',date:'2026-09-16',serviceCount:41,timeliness:'95.12%',firstTime:'92.68%',complaints:0},
    广东:{object:'广州东区服务站',date:'2026-09-16',serviceCount:53,timeliness:'92.45%',firstTime:'88.68%',complaints:2},
    北京:{object:'北京北区服务站',date:'2026-09-16',serviceCount:32,timeliness:'96.88%',firstTime:'93.75%',complaints:0},
    上海:{object:'上海浦东服务站',date:'2026-09-16',serviceCount:38,timeliness:'94.74%',firstTime:'92.11%',complaints:1}
  };

  const national = {orders:12486,closed:9826,cancelled:286,complaints:118,stations:326,located:298,enabled:311};
  const trend = [76,88,81,95,103,91,108,113,105,122,117,129,112,126,136,131,144,128,119,133,141,138,153,147,139,151,145,157,149,158];
  const state = {layer:'orders',range:30,province:'全国',features:[],project:null};
  const $ = (selector, root=document) => root.querySelector(selector);
  const $$ = (selector, root=document) => [...root.querySelectorAll(selector)];
  const format = value => new Intl.NumberFormat('zh-CN').format(Math.round(value));

  function applyIcons() {
    $$('[data-icon]').forEach(node => {
      const name = node.dataset.icon;
      if (icons[name]) node.innerHTML = `<svg viewBox="0 0 24 24" aria-hidden="true">${icons[name]}</svg>`;
    });
  }

  function decodeGeoJSON(json) {
    if (!json || !json.UTF8Encoding) return json;
    const decodeRing = (encoded, offset) => {
      const ring = [];
      let prevX = offset[0], prevY = offset[1];
      for (let i=0; i<encoded.length; i+=2) {
        let x = encoded.charCodeAt(i)-64;
        let y = encoded.charCodeAt(i+1)-64;
        x = (x >> 1) ^ (-(x & 1));
        y = (y >> 1) ^ (-(y & 1));
        prevX += x; prevY += y;
        ring.push([prevX / 1024, prevY / 1024]);
      }
      return ring;
    };
    json.features.forEach(feature => {
      const geometry = feature.geometry;
      const coords = geometry.coordinates;
      const offsets = geometry.encodeOffsets;
      if (geometry.type === 'Polygon') {
        geometry.coordinates = coords.map((ring, i) => decodeRing(ring, offsets[i]));
      } else if (geometry.type === 'MultiPolygon') {
        geometry.coordinates = coords.map((polygon, i) => polygon.map((ring, j) => decodeRing(ring, offsets[i][j])));
      }
      delete geometry.encodeOffsets;
    });
    json.UTF8Encoding = false;
    return json;
  }

  function prepareMap() {
    const geo = decodeGeoJSON(window.__CHINA_GEOJSON__);
    if (!geo?.features?.length) throw new Error('地图数据不可用');
    state.features = geo.features;
    const points = [];
    const collect = coords => Array.isArray(coords[0]) ? coords.forEach(collect) : points.push(coords);
    geo.features.forEach(feature => collect(feature.geometry.coordinates));
    const valid = points.filter(([lon,lat]) => lon>70 && lon<140 && lat>15 && lat<56);
    const lons = valid.map(p=>p[0]), lats = valid.map(p=>p[1]);
    const bounds = {minLon:Math.min(...lons), maxLon:Math.max(...lons), minLat:Math.min(...lats), maxLat:Math.max(...lats)};
    const scale = Math.min(900/(bounds.maxLon-bounds.minLon), 570/(bounds.maxLat-bounds.minLat));
    const mapWidth=(bounds.maxLon-bounds.minLon)*scale, mapHeight=(bounds.maxLat-bounds.minLat)*scale;
    const offsetX=(1000-mapWidth)/2, offsetY=(620-mapHeight)/2+3;
    state.project = ([lon,lat]) => [offsetX+(lon-bounds.minLon)*scale, offsetY+(bounds.maxLat-lat)*scale];
    renderMap();
    $('#mapLoading').hidden = true;
  }

  function geometryPath(geometry) {
    const polygons = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
    return polygons.map(polygon => polygon.map(ring => ring.map((point,index) => {
      const [x,y] = state.project(point);
      return `${index?'L':'M'}${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(' ')+' Z').join(' ')).join(' ');
  }

  function normalizedName(name) { return String(name || '').replace(/省$|市$|壮族自治区$|回族自治区$|维吾尔自治区$|自治区$|特别行政区$/g,''); }
  function orderColor(value) {
    if (!value) return 'color-mix(in srgb, var(--surface-strong) 80%, var(--surface))';
    const ratio = Math.min(1, value/1500);
    return `color-mix(in srgb, var(--primary) ${Math.round(16+ratio*70)}%, var(--surface))`;
  }
  function coverageColor(name) {
    const stat=provinceStats[name];
    if (!stat?.stations) return 'color-mix(in srgb, var(--surface-strong) 82%, var(--surface))';
    const ratio=Math.min(1, stat.stations/46);
    return `color-mix(in srgb, var(--success) ${Math.round(13+ratio*55)}%, var(--surface))`;
  }

  function renderMap() {
    const provinceLayer=$('#provinceLayer'), markerLayer=$('#markerLayer');
    provinceLayer.innerHTML=''; markerLayer.innerHTML='';
    const scaleFactor=state.range/30;
    const labels = new Set(['北京','上海','江苏','浙江','山东','河南','湖北','四川','广东']);
    state.features.forEach(feature => {
      const name=normalizedName(feature.properties?.name);
      const stat=provinceStats[name] || {orders:0};
      const path=document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',geometryPath(feature.geometry));
      path.setAttribute('class',`province-shape${state.province===name?' is-selected':''}`);
      path.setAttribute('tabindex','0'); path.setAttribute('role','button'); path.setAttribute('aria-label',`${name}，${format(stat.orders*scaleFactor)} 单`);
      path.dataset.province=name;
      path.style.fill=state.layer==='orders'?orderColor(stat.orders*scaleFactor):state.layer==='coverage'?coverageColor(name):'color-mix(in srgb, var(--primary-soft) 45%, var(--surface))';
      path.addEventListener('click',()=>selectProvince(name));
      path.addEventListener('keydown',event=>{ if(event.key==='Enter'||event.key===' '){event.preventDefault();selectProvince(name);} });
      path.addEventListener('pointerenter',event=>showProvinceTooltip(event,name,stat));
      path.addEventListener('pointermove',moveTooltip); path.addEventListener('pointerleave',hideTooltip);
      provinceLayer.appendChild(path);
      if (feature.properties?.cp && (labels.has(name)||state.province===name)) {
        const [x,y]=state.project(feature.properties.cp);
        const label=document.createElementNS('http://www.w3.org/2000/svg','text');
        label.setAttribute('x',x); label.setAttribute('y',y); label.setAttribute('class',`province-label${stat.orders>850&&state.layer==='orders'?' is-inverted':''}`); label.textContent=name;
        provinceLayer.appendChild(label);
      }
    });
    if (state.layer!=='orders') renderMarkers();
    updateLegend();
  }

  function renderMarkers() {
    const layer=$('#markerLayer');
    stations.filter(station=>state.province==='全国'||station.province===state.province).forEach((station,index)=>{
      const [x,y]=state.project(station.coord);
      const group=document.createElementNS('http://www.w3.org/2000/svg','g');
      const statusClass=!station.enabled?' is-disabled':state.layer==='quality'&&station.name.includes('广州')?' is-warning':'';
      group.setAttribute('class',`station-marker${statusClass}`); group.setAttribute('tabindex','0'); group.setAttribute('role','button'); group.setAttribute('aria-label',station.name);
      group.style.animationDelay=`${index*35}ms`;
      if(state.layer==='coverage') {
        const ring=document.createElementNS('http://www.w3.org/2000/svg','circle'); ring.setAttribute('class','coverage-ring'); ring.setAttribute('cx',x); ring.setAttribute('cy',y); ring.setAttribute('r',18+station.areas*.7); layer.appendChild(ring);
      }
      if(state.layer==='quality') {
        const ring=document.createElementNS('http://www.w3.org/2000/svg','circle'); ring.setAttribute('class','quality-ring'); ring.setAttribute('cx',x); ring.setAttribute('cy',y); ring.setAttribute('r',12); layer.appendChild(ring);
      }
      group.innerHTML=`<circle class="marker-halo" cx="${x}" cy="${y}" r="9"></circle><circle class="marker-core" cx="${x}" cy="${y}" r="4.2"></circle>`;
      group.addEventListener('pointerenter',event=>showStationTooltip(event,station)); group.addEventListener('pointermove',moveTooltip); group.addEventListener('pointerleave',hideTooltip);
      group.addEventListener('click',()=>{selectProvince(station.province); showToast(`已定位 ${station.name}；正式页面可继续进入服务站档案。`);});
      layer.appendChild(group);
    });
  }

  function selectProvince(name) {
    state.province=name;
    updateRegionPanel(); renderMap();
  }

  function updateRegionPanel() {
    const name=state.province;
    const base=name==='全国'?national:(provinceStats[name]||{orders:0,closed:0,cancelled:0,complaints:0,stations:0,located:0,enabled:0});
    const factor=state.range/30;
    $('#regionName').textContent=name==='全国'?'全国':`${name}${['北京','上海','天津','重庆'].includes(name)?'市':['香港','澳门'].includes(name)?'特别行政区':['内蒙古','西藏','宁夏','新疆','广西'].includes(name)?'自治区':'省'}`;
    $('#regionMeta').textContent=`${name==='全国'?'34 个省级区域':'服务省份'} · 近 ${state.range} 天`;
    $('#regionOrders').textContent=format(base.orders*factor); $('#regionClosed').textContent=format(base.closed*factor); $('#regionCancelled').textContent=format(base.cancelled*factor); $('#regionComplaints').textContent=format(base.complaints*factor);
    $('#stationCount').textContent=format(base.stations); $('#locatedCount').textContent=format(base.located); $('#enabledCount').textContent=format(base.enabled); $('#networkScope').textContent=`${name}服务站档案`;
    const progress=base.stations?`${Math.min(100,base.located/base.stations*100).toFixed(1)}%`:'0%'; $('.coordinate-progress span').style.setProperty('--progress',progress);
    const sorted=Object.entries(provinceStats).filter(([,s])=>s.orders>0).sort((a,b)=>b[1].orders-a[1].orders); const rank=sorted.findIndex(([province])=>province===name)+1;
    $('#regionRank').textContent=name==='全国'?'全局':rank?`第 ${rank} 位`:'暂无';
    const fact=qualityFacts[name]||qualityFacts.全国; $('#qualityObject').textContent=`${fact.object} · ${fact.date}`; $('#qualityServiceCount').textContent=format(fact.serviceCount); $('#qualityTimeliness').textContent=fact.timeliness; $('#qualityFirstTime').textContent=fact.firstTime; $('#qualityComplaints').textContent=fact.complaints;
  }

  function updateLegend() {
    const title=$('#mapLegend>span'), gradient=$('.legend-gradient'), subtitle=$('#mapSubtitle'), note=$('#mapBoundaryNote');
    const config={
      orders:{title:'工单数',subtitle:`近 ${state.range} 天 · 按服务省份分组 · 颜色越深工单数越多`,note:'省份颜色来自运营报表；队列数量为全国授权范围，二者不混算。',gradient:'linear-gradient(90deg,#eaf2ff,#377ef0)'},
      stations:{title:'站点状态',subtitle:'服务站档案点位 · 蓝色已启用 · 灰色已停用',note:'点位来自服务站经纬度；“配置日上限”不等同于实际可用产能。',gradient:'linear-gradient(90deg,#8893a7,#377ef0)'},
      quality:{title:'质量事实',subtitle:'当前服务站单日质量事实 · 点击省份筛选对象',note:'展示单个对象、单个日期的事实，不对多个对象百分比再次平均。',gradient:'linear-gradient(90deg,#54c0d2,#d99021)'},
      coverage:{title:'配置密度',subtitle:'已配置服务区域 · 颜色与范围标记仅表达现有配置',note:'仅显示已配置服务区域，不把未配置区域直接判定为服务盲区。',gradient:'linear-gradient(90deg,#dff4ea,#259a69)'}
    }[state.layer];
    title.textContent=config.title; subtitle.textContent=config.subtitle; note.textContent=config.note; gradient.style.background=config.gradient;
  }

  function showProvinceTooltip(event,name,stat) {
    const factor=state.range/30; const tooltip=$('#mapTooltip');
    tooltip.innerHTML=`<strong>${name}</strong><span>近 ${state.range} 天工单 <b>${format(stat.orders*factor)}</b></span><span>服务站档案 <b>${format(stat.stations||0)}</b></span><span>有投诉工单 <b>${format(stat.complaints*factor)}</b></span>`;
    tooltip.hidden=false; moveTooltip(event);
  }
  function showStationTooltip(event,station) {
    const tooltip=$('#mapTooltip');
    tooltip.innerHTML=`<strong>${station.name}</strong><span>档案状态 <b>${station.enabled?'已启用':'已停用'}</b></span><span>配置日上限 <b>${station.limit} 单</b></span><span>服务人员 <b>${station.people} 人</b></span><span>服务项目 <b>${station.items}</b></span><span>关联服务区域 <b>${station.areas} 个</b></span>`;
    tooltip.hidden=false; moveTooltip(event);
  }
  function moveTooltip(event) { const stage=$('#mapStage'), tip=$('#mapTooltip'); if(tip.hidden)return; const rect=stage.getBoundingClientRect(); tip.style.left=`${Math.min(rect.width-tip.offsetWidth-10,Math.max(10,event.clientX-rect.left+13))}px`; tip.style.top=`${Math.min(rect.height-tip.offsetHeight-10,Math.max(10,event.clientY-rect.top+13))}px`; }
  function hideTooltip(){ $('#mapTooltip').hidden=true; }

  let toastTimer;
  function showToast(message) { const toast=$('#toast'); toast.textContent=message; toast.classList.add('is-visible'); clearTimeout(toastTimer); toastTimer=setTimeout(()=>toast.classList.remove('is-visible'),2400); }

  function animateNumbers() {
    $$('[data-value]').forEach(node=>{
      const target=Number(node.dataset.value), start=performance.now(), duration=650;
      const tick=now=>{const progress=Math.min(1,(now-start)/duration), eased=1-Math.pow(1-progress,3); node.textContent=format(target*eased); if(progress<1)requestAnimationFrame(tick);}; requestAnimationFrame(tick);
    });
  }

  function renderTrend() {
    const width=420, height=100, max=Math.max(...trend)*1.08;
    const points=trend.map((value,index)=>({x:index*width/(trend.length-1),y:height-value/max*height}));
    const line=points.map((point,index)=>`${index?'L':'M'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
    $('#compactTrendLine').setAttribute('d',line);
    $('#compactTrendArea').setAttribute('d',`${line} L${width},${height} L0,${height} Z`);
    $('#trendTotal').textContent=format(trend.reduce((sum,value)=>sum+value,0));
  }

  function openOverlay(target) { $('#scrim').hidden=false; target.hidden=false; requestAnimationFrame(()=>target.classList.add('is-open')); }
  function closeOverlays() { $('#scrim').hidden=true; $$('.prototype-panel,.command-dialog').forEach(node=>{node.classList.remove('is-open');node.hidden=true;}); }
  function setupShell() {
    $('.menu-group-title') && $$('.menu-group-title').forEach(button=>button.addEventListener('click',()=>{const group=button.closest('.menu-group');group.classList.toggle('is-open');button.setAttribute('aria-expanded',group.classList.contains('is-open'));}));
    $('#sidebarButton').addEventListener('click',()=>$('#appShell').classList.toggle('is-sidebar-collapsed'));
    $('#scopeButton').addEventListener('click',event=>{event.stopPropagation();const pop=$('#scopePopover');pop.hidden=!pop.hidden;});
    document.addEventListener('click',event=>{if(!event.target.closest('#scopeButton')&&!event.target.closest('#scopePopover'))$('#scopePopover').hidden=true;});
    const prototypePanel=$('#prototypePanel'); $('#prototypeFab').addEventListener('click',()=>openOverlay(prototypePanel)); $('#perspectiveButton').addEventListener('click',()=>openOverlay(prototypePanel)); $('#closePrototypePanel').addEventListener('click',closeOverlays); $('#scrim').addEventListener('click',closeOverlays);
    const commands=[['全国地图工作台','headquarters-map.html'],['运营工作台（现版）','index.html'],['运营报表','operations-report.html'],['服务质量','service-quality.html'],['客服行动工作台','customer-service-v03.html'],['服务站工作台','service-station.html'],['门店工作台','dealer.html']];
    const commandDialog=$('#commandDialog'), commandInput=$('#commandInput'), commandResults=$('#commandResults');
    const renderCommands=value=>{commandResults.innerHTML=commands.filter(([name])=>name.includes(value||'')).map(([name,url])=>`<button type="button" data-command-url="${url}"><strong>${name}</strong><span>打开页面</span></button>`).join('')||'<button type="button"><span>没有匹配功能</span></button>';};
    const openCommands=()=>{renderCommands('');openOverlay(commandDialog);setTimeout(()=>commandInput.focus(),30);};
    $('#searchButton').addEventListener('click',openCommands); commandInput.addEventListener('input',()=>renderCommands(commandInput.value)); commandResults.addEventListener('click',event=>{const button=event.target.closest('[data-command-url]');if(button)location.href=button.dataset.commandUrl;});
    document.addEventListener('keydown',event=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==='k'){event.preventDefault();openCommands();}if(event.key==='Escape')closeOverlays();});
    $('#fullscreenButton').addEventListener('click',async()=>{if(!document.fullscreenElement){await document.documentElement.requestFullscreen?.();}else{await document.exitFullscreen?.();}});
    $('#themeButton').addEventListener('click',()=>{const root=document.documentElement,dark=root.dataset.theme==='dark';root.dataset.theme=dark?'light':'dark';$('#themeButton [data-icon]').dataset.icon=dark?'moon':'sun';applyIcons();renderMap();});
    $('#refreshButton').addEventListener('click',()=>{const button=$('#refreshButton');button.classList.add('is-spinning');setTimeout(()=>button.classList.remove('is-spinning'),600);$('#lastUpdated').textContent=new Date().toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false});renderMap();showToast('全国运营数据已刷新（原型演示）。');});
    $$('[data-preview-link]').forEach(node=>node.addEventListener('click',()=>showToast(`${node.dataset.previewLink}：正式实现时按当前权限与区域条件进入。`)));
  }

  function setupInteractions() {
    $$('[data-queue-button]').forEach(button=>button.addEventListener('click',()=>{$$('[data-queue-button]').forEach(item=>{item.classList.toggle('is-active',item===button);item.setAttribute('aria-pressed',item===button);});showToast(`${button.querySelector('small').textContent}：队列数量来自全国授权范围，可继续下钻服务工单。`);}));
    const layerButton=$('#layerButton'), layerMenu=$('#layerMenu');
    const layerOptions=$$('.layer-menu button');
    const closeLayerMenu=()=>{layerMenu.hidden=true;layerButton.setAttribute('aria-expanded','false');};
    layerButton.addEventListener('click',event=>{event.stopPropagation();const willOpen=layerMenu.hidden;layerMenu.hidden=!willOpen;layerButton.setAttribute('aria-expanded',String(willOpen));});
    layerButton.addEventListener('keydown',event=>{if(event.key==='ArrowDown'){event.preventDefault();layerMenu.hidden=false;layerButton.setAttribute('aria-expanded','true');(layerOptions.find(item=>item.classList.contains('is-active'))||layerOptions[0]).focus();}});
    layerOptions.forEach(button=>button.addEventListener('click',()=>{state.layer=button.dataset.layer;layerOptions.forEach(item=>{item.classList.toggle('is-active',item===button);item.setAttribute('aria-selected',item===button);});$('#activeLayerName').textContent=button.querySelector('strong').textContent;closeLayerMenu();renderMap();}));
    layerMenu.addEventListener('keydown',event=>{const current=layerOptions.indexOf(document.activeElement);if(['ArrowDown','ArrowUp','Home','End'].includes(event.key)){event.preventDefault();const next=event.key==='Home'?0:event.key==='End'?layerOptions.length-1:event.key==='ArrowDown'?(current+1)%layerOptions.length:(current-1+layerOptions.length)%layerOptions.length;layerOptions[next].focus();}if(event.key==='Escape'){event.preventDefault();closeLayerMenu();layerButton.focus();}});
    document.addEventListener('click',event=>{if(!event.target.closest('#layerButton')&&!event.target.closest('#layerMenu'))closeLayerMenu();});
    document.addEventListener('keydown',event=>{if(event.key==='Escape')closeLayerMenu();});
    $$('.range-switch button').forEach(button=>button.addEventListener('click',()=>{state.range=Number(button.dataset.range);$$('.range-switch button').forEach(item=>item.classList.toggle('is-active',item===button));updateRegionPanel();renderMap();}));
    $('#mapResetButton').addEventListener('click',()=>selectProvince('全国'));
  }

  function init() {
    applyIcons(); setupShell(); setupInteractions(); animateNumbers(); renderTrend(); updateRegionPanel();
    try { prepareMap(); } catch(error) { $('#mapLoading').innerHTML='<p>地图载入失败，请刷新后重试。</p>'; console.error(error); }
  }
  init();
})();
