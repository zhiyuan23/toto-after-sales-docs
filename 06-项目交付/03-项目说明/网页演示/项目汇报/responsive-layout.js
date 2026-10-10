'use strict';
// Fit the complete composition, including its bottom clearance, into the presentation stage.
window.createReportResponsiveLayout = stage => {
  function refresh() {
    const {width, height} = stage.getBoundingClientRect();
    if (width <= 0 || height <= 0) return;
    // All desktop pages share one design scale. Extra logical height gives dense pages
    // room for their notes and card shadows before the fixed footer begins.
    const desktop = window.innerWidth > 760;
    const scale = desktop ? Math.min(width / 1178, height / 620) : 1;
    stage.style.setProperty('--report-canvas-scale', String(scale));
    stage.style.setProperty('--report-canvas-width', `${width / scale}px`);
    stage.style.setProperty('--report-canvas-height', `${height / scale}px`);
    // Scale the whole canvas once, so type, spacing, fixed-size artwork and shadows agree.
    stage.style.setProperty('--display-unit', '1px');
    stage.style.setProperty('--display-vw', `${Math.min(window.innerWidth, 1280) / 100}px`);
  }
  const observer = new ResizeObserver(refresh);
  observer.observe(stage);
  window.addEventListener('resize', refresh);
  document.addEventListener('fullscreenchange', refresh);
  refresh();
  return {refresh};
};
