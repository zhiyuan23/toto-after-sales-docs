/* v0.16: brand-first homepage. Public destinations and service behavior reuse v0.14. */
(() => {
  if (window.TOTO_CONSUMER_VERSION !== '0.16') return;
  const home = window.TOTO_SCREENS.consumer.screens.find(screen => screen.id === 'c-home');
  const icon = name => `<img src="../assets/brand-center/${name}.svg" alt="" aria-hidden="true">`;
  const arrow = icon('arrow-top-right');
  Object.assign(home, {
    title: 'TOTO 品牌产品中心',
    entry: 'C01 · 品牌产品中心 · v0.16 设计评审',
    nav: 'immersive',
    goal: '以品牌空间影像建立第一印象，通过探索产品与了解 TOTO 两个主入口连接产品和品牌；智能助手、服务网点、TOTO 客服在首屏直接可达。',
    note: '本次仅设计首页。游客与已登录用户均先浏览品牌产品中心，本人产品和服务仍从既有服务／我的入口访问。影像取自 TOTO 官网，文案及版式为待评审设计；精选产品仍为原型两件样品，不代表新增商品或已获品牌发布审核。',
    body: () => `<div class="bp-home">
      <section class="bp-hero" aria-labelledby="bp-title">
        <img class="bp-hero-image" src="../assets/brand-center/neorest-ls-space.jpg" alt="TOTO 诺锐斯特 LS 与石材、城市暮色相融的卫浴空间" fetchpriority="high">
        <header class="bp-masthead"><span class="bp-wordmark">TOTO</span><span class="bp-brand-label">品牌产品中心</span></header>
        <div class="bp-hero-copy"><p class="bp-eyebrow">WELLNESS, EVERY DAY</p><h1 id="bp-title">让日常，自有非凡。</h1></div>
        <div class="bp-hero-foot"><span>NEOREST <small>诺锐斯特</small></span><span class="bp-photo-label">空间灵感 · 01</span></div>
      </section>
      <nav class="bp-discover" aria-label="探索 TOTO">
        <button class="bp-explore" data-go="c-brand-catalog">探索产品 ${arrow}</button>
        <button class="bp-about" data-go="c-brand-story">了解 TOTO ${arrow}</button>
      </nav>
      <nav class="bp-support" aria-label="服务与支持">
        <button data-ai="start">${icon('robot-outline')}<strong>智能助手</strong><small>解答使用疑问</small></button>
        <button data-go="c-outlets">${icon('map-marker-outline')}<strong>服务网点</strong><small>发现身边的服务</small></button>
        <button data-go="c-customer-service">${icon('face-agent')}<strong>TOTO 客服</strong><small>与我们取得联系</small></button>
      </nav>
      <section class="bp-collection" aria-labelledby="bp-collection-title">
        <div class="bp-section-heading"><div><p class="bp-eyebrow">THE COLLECTION</p><h2 id="bp-collection-title">为理想生活而设计</h2></div><button data-go="c-brand-catalog" aria-label="查看全部产品">${arrow}</button></div>
        <div class="bp-product-grid">
          <button class="bp-product" data-brand-product="t01"><span class="bp-product-image"><img src="../assets/product-toilet.jpg" alt="诺锐斯特 LS 产品外观" loading="lazy"></span><span class="bp-product-type">智能坐便器</span><span class="bp-product-name">诺锐斯特 LS ${arrow}</span><span class="bp-product-model">CES8G820GCN</span></button>
          <button class="bp-product" data-brand-product="b02"><span class="bp-product-image"><img src="../assets/product-basin.jpg" alt="台下式洗面器产品外观" loading="lazy"></span><span class="bp-product-type">洗面器</span><span class="bp-product-name">台下式洗面器 ${arrow}</span><span class="bp-product-model">LW1535B</span></button>
        </div>
      </section>
      <section class="bp-journal" aria-labelledby="bp-journal-title">
        <img class="bp-journal-image" src="../assets/brand-center/neorest-nx-space.jpg" alt="TOTO 诺锐斯特 NX 与自然光、湖景相融的空间" loading="lazy">
        <div class="bp-journal-copy"><p class="bp-eyebrow">LIFE WITH TOTO</p><h2 id="bp-journal-title">舒适，自然而然。</h2><p>让设计融入生活，让每一天多一份从容。</p><button data-go="c-brand-story">走近 TOTO ${arrow}</button></div>
      </section>
      <footer class="bp-signature"><span class="bp-wordmark">TOTO</span><span>以水为始，关照日常。</span></footer>
    </div>`,
  });
})();
