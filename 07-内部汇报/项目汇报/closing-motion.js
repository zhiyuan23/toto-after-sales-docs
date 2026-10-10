'use strict';
// Keep the original mirrored SVG while completing and tinting the closing backdrop.
window.createReportClosingMotion = reduce => {
  const scene = document.querySelector('.report-brand-scene');
  const symbol = scene.querySelector('.report-brand-symbol');
  const artwork = scene.querySelector('.report-brand-art');
  const animations = new Set();
  const crop = 'inset(26.126126% 14.414414% 15.315315% 14.414414%)';
  const css = getComputedStyle(document.documentElement);
  const ease = css.getPropertyValue('--ease-out').trim();
  const morphEase = css.getPropertyValue('--ease-in-out').trim();

  function cancel() {
    // Authored styles keep the full blue logo and left-hand text after interruption.
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function fit() {
    const rect = scene.getBoundingClientRect();
    const backdrop = getComputedStyle(document.body, '::before');
    // Draw at the original backdrop size, then scale down to keep the large SVG crisp.
    const size = Math.max(1110 * parseFloat(backdrop.width) / 790, rect.width);
    const transform = `scale(${rect.width / size})`;
    symbol.style.width = `${size}px`;
    symbol.style.transform = transform;
    return {left: rect.left, top: rect.top, size, transform, backdrop};
  }
  function play(element, frames, duration, delay = 0, easing = ease) {
    const animation = element.animate(frames, {duration, delay, easing, fill: 'backwards'});
    animations.add(animation);
    animation.finished.then(() => {
      animations.delete(animation);
      animation.cancel();
    }).catch(() => animations.delete(animation));
  }
  function enter(active, instant = false) {
    cancel();
    scene.hidden = !active;
    const target = active ? fit() : null;
    const copy = active ? document.querySelector('.closing-copy') : null;
    if (!active || instant || document.hidden || !scene.animate) return;
    if (reduce.matches) {
      play(scene, [{opacity: .6}, {opacity: 1}], 180);
      play(copy, [{opacity: .6}, {opacity: 1}], 180);
      return;
    }

    // The existing mask uses viewBox="160 290 790 650" with these mirrored paths.
    // Expand that coordinate system to 1110 square without changing the first frame.
    const backdrop = target.backdrop;
    const unit = parseFloat(backdrop.width) / 790;
    const fromSize = 1110 * unit;
    const fromLeft = innerWidth - parseFloat(backdrop.right) - 950 * unit;
    const fromTop = parseFloat(backdrop.top) - 290 * unit;
    const from = `translate(${fromLeft - target.left}px, ${fromTop - target.top}px) scale(${fromSize / target.size})`;
    play(symbol, [
      {transform: from},
      {transform: `translate(0, 0) ${target.transform}`}
    ], 2400, 0, morphEase);
    play(artwork, [{clipPath: crop}, {clipPath: 'inset(0% 0% 0% 0%)'}], 2200, 0, morphEase);
    play(scene.querySelector('.report-brand-upper'), [
      {opacity: 0, clipPath: 'inset(70% 0% 0% 0%)'},
      {opacity: 1, clipPath: 'inset(0% 0% 0% 0%)'}
    ], 1800, 200, morphEase);
    play(scene.querySelector('.report-brand-lower'), [
      {opacity: 0, clipPath: 'inset(0% 0% 100% 0%)'},
      {opacity: 1, clipPath: 'inset(0% 0% 0% 0%)'}
    ], 1800, 350, morphEase);
    // The colour layer shares the continuously visible base's five path definitions.
    play(scene.querySelector('.report-brand-color'), [{opacity: 0}, {opacity: 1}], 2000, 2400, morphEase);
    const backdropOpacity = parseFloat(backdrop.opacity) || 1;
    if (backdropOpacity < 1) play(artwork, [{opacity: backdropOpacity}, {opacity: 1}], 2400, 0, morphEase);

    // Reveal the stationary text group as the complete logo becomes blue.
    play(copy, [{opacity: 0}, {opacity: 1}], 2000, 2400, morphEase);
  }
  window.addEventListener('resize', () => {
    cancel();
    if (!scene.hidden) fit();
  });
  return {enter, cancel};
};
