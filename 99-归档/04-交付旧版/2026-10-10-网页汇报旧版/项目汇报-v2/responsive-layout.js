'use strict';
// Grow authored diagrams and type together, using the space left by the presentation tools.
window.createReportResponsiveLayout = stage => {
  function refresh() {
    const {width, height} = stage.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    // The compact desktop composition is 1178 × 575 (a 1280 × 720 window).
    // Width and height both limit growth; a wide, short window cannot over-enlarge the page.
    const scale = Math.max(1, Math.min(width / 1178, height / 575));
    stage.style.setProperty('--display-unit', `${scale.toFixed(4)}px`);
    stage.style.setProperty('--display-vw', `${(Math.min(window.innerWidth, 1280) / 100 * scale).toFixed(4)}px`);
  }
  const observer = new ResizeObserver(refresh);
  observer.observe(stage);
  window.addEventListener('resize', refresh);
  document.addEventListener('fullscreenchange', refresh);
  refresh();
  return {refresh};
};
