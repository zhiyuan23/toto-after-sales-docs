/* v0.17 public catalog. Categories and series remain independent product references. */
(() => {
  if (window.TOTO_CONSUMER_VERSION !== '0.17') return;
  const data=window.TOTO_CATALOG_DATA;
  const screens=window.TOTO_SCREENS.consumer.screens;
  const brand=window.TOTO_BRAND;
  const e=value=>String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const categories=data.categories.filter(c=>c.enabled && c.kind==='PRODUCT').sort((a,b)=>a.sortOrder-b.sortOrder);
  const series=data.series.filter(s=>s.enabled).sort((a,b)=>a.sortOrder-b.sortOrder);
  const products=data.products.filter(p=>p.enabled && p.listed);
  const roots=categories.filter(c=>!categories.some(parent=>parent.id===c.parentId));
  const state={root:roots[0]?.id,series:'all',product:products[0]?.id};
  const categoryName=id=>categories.find(c=>c.id===id)?.name || '';
  const seriesName=id=>series.find(s=>s.id===id)?.name || '';
  function descendantIds(id) {
    const ids=new Set([id]);
    for(let changed=true;changed;) {
      changed=false;
      for(const c of categories) if(ids.has(c.parentId) && !ids.has(c.id)) {ids.add(c.id);changed=true;}
    }
    return ids;
  }
  const categoryProducts=()=>{const ids=descendantIds(state.root);return products.filter(p=>ids.has(p.categoryId));};
  const availableSeries=()=>series.filter(s=>categoryProducts().some(p=>p.seriesId===s.id));
  const productName=p=>p.name.endsWith(' '+p.code)?p.name.slice(0,-p.code.length-1):p.name;
  const chip=(attr,id,name,current)=>`<button data-${attr}="${e(id)}" aria-pressed="${current===id}">${e(name)}</button>`;
  const productCard=p=>`<button class="ct-product" data-catalog-product="${e(p.id)}" aria-label="查看${e(p.name)}商品档案"><span class="ct-product-image"><img src="${e(p.image)}" alt="${e(p.name)}" loading="lazy"></span><span class="ct-product-copy"><strong>${e(productName(p))}</strong><small>${e(p.code)}</small></span></button>`;
  function catalog() {
    const covers={'30':'23','31':'27','32':'28','33':'30'};
    return `<div class="ct-catalog ct-category-home"><div class="ct-product-grid">${roots.map(c=>{
      const cover=products.find(p=>p.id===covers[c.id]) || products.find(p=>descendantIds(c.id).has(p.categoryId));
      return `<button class="ct-product ct-category-card" data-catalog-root="${e(c.id)}" aria-label="浏览${e(c.name)}"><span class="ct-product-image">${cover?`<img src="${e(cover.image)}" alt="${e(c.name)}">`:''}</span><span class="ct-product-copy"><strong>${e(c.name)}</strong><img src="assets/icons/entry-chevron.svg" alt="" aria-hidden="true"></span></button>`;
    }).join('')}</div></div>`;
  }
  function catalogProducts() {
    const pool=categoryProducts();
    const related=availableSeries();
    const list=pool.filter(p=>state.series==='all'||(state.series==='none'?!p.seriesId:p.seriesId===state.series));
    return `<div class="ct-catalog">
      ${related.length?`<nav class="ct-series-tabs ct-chips" aria-label="商品系列">${chip('catalog-series','all','全部',state.series)}${related.map(s=>chip('catalog-series',s.id,s.name,state.series)).join('')}${pool.some(p=>!p.seriesId)?chip('catalog-series','none','其他商品',state.series):''}</nav>`:''}
      <section class="ct-results"><div class="ct-product-grid">${list.length?list.map(productCard).join(''):'<p class="ct-empty">暂无商品</p>'}</div></section></div>`;
  }
  function detail() {
    const p=products.find(p=>p.id===state.product)||products[0];
    if(!p) return '<p class="ct-empty">暂无商品资料</p>';
    const fields=[['品番',p.code],['商品分类',categoryName(p.categoryId)],['商品系列',seriesName(p.seriesId)],['机能型号',p.model],['规格',p.specification],['颜色',p.color],['尺寸',p.productSize]].filter(([,value])=>value);
    return `<article class="ct-detail"><div class="ct-detail-image"><img src="${e(p.image)}" alt="${e(p.name)}"></div><div class="ct-detail-title">${p.seriesId?`<small>${e(seriesName(p.seriesId))}</small>`:''}<h2>${e(productName(p))}</h2><p>${e(p.code)}</p></div><dl class="ct-facts">${fields.map(([label,value])=>`<div><dt>${e(label)}</dt><dd>${e(value)}</dd></div>`).join('')}</dl><div class="ct-detail-actions"><button class="primary" data-go="c-outlets">联系门店</button><button class="secondary" data-go="c-customer-service">联系客服</button></div></article>`;
  }
  Object.assign(screens.find(s=>s.id==='c-brand-catalog'),{
    entry:'v0.17 · 商品分类入口',
    goal:'首屏只展示商品分类卡片。点击分类进入独立商品页，再切换系列浏览商品；不叠放多层筛选，不显示搜索和宣传说明。',
    note:'离线原型采用 2026-09-23 已留存的后台目录快照：11 类、3 系列、12 商品；字段结构核对当前 catalog/types.ts。不是实时后台数据。仅展示公开档案基础字段和既有官网图，不展示测试保修参数、内部字段或本人购买信息。',body:catalog,
  });
  const categoryScreen={id:'c-catalog-products',title:categoryName(state.root),entry:'v0.17 · 分类下的商品',parent:'c-brand-catalog',goal:'展示当前分类及其子分类下的商品；仅在存在系列时提供系列切换，无系列商品正常展示。卡片沿用上图下文的白色圆角样式。',note:'分类和系列仍按商品档案的关联关系组织，不把系列改为分类的固定子节点。',body:catalogProducts};
  screens.splice(screens.findIndex(s=>s.id==='c-brand-product'),0,categoryScreen);
  Object.assign(screens.find(s=>s.id==='c-brand-product'),{parent:'c-catalog-products',title:'商品档案',entry:'v0.17 · 公开商品档案',goal:'展示所选商品的图片、名称、品番、分类、系列及已维护的规格信息，通过门店或客服继续咨询。',note:'缺失字段不编造；不展示内部备注和测试保修承诺。查看公开商品不建立本人商品关系。',body:detail});
  const reset=brand.reset,handle=brand.handle;
  brand.reset=function(){reset.call(this);Object.assign(state,{root:roots[0]?.id,series:'all',product:products[0]?.id});categoryScreen.title=categoryName(state.root);};
  brand.handle=function(el,api) {
    const d=el.dataset;
    if(d.catalogRoot) {
      if(roots.some(c=>c.id===d.catalogRoot)) {state.root=d.catalogRoot;state.series='all';categoryScreen.title=categoryName(state.root);api.showScreen('c-catalog-products');}
      return true;
    }
    if(d.catalogSeries) {
      if(d.catalogSeries==='all'||d.catalogSeries==='none'||availableSeries().some(s=>s.id===d.catalogSeries)) {state.series=d.catalogSeries;api.render();}
      return true;
    }
    if(d.catalogProduct || d.brandProduct) {
      const id=d.catalogProduct || ({t01:'19',b02:'26'}[d.brandProduct]);
      if(products.some(p=>p.id===id)) {state.product=id;api.showScreen('c-brand-product');}
      return true;
    }
    return handle.call(this,el,api);
  };
})();
