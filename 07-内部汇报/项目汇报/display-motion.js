'use strict';
// Color edition choreography, mapped to the first edition's existing compositions.
window.createReportDisplayMotion = reduce => {
  const ease = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
  const animations = new Set();
  let blocked = false;
  const scenes = {
    cover: ['.cover-timing', '.cover-ambient', '.cover-hq-support', '.cover-flow', '[data-cover-node]'],
    background: ['.v2-source-strip', '.v2-direction'],
    saas: ['.v3-platform-heading', '.v3-platform-piece', '.v3-platform-story', '.v3-platform-capability'],
    system: ['.web-app', '.mobile-app'],
    'product-service': ['.journey-stop', '.v2-journey-anchors>span'],
    exceptions: ['.change-card', '.trace-panel'],
    support: ['.v2-support-centre', '.v2-support-card'],
    'anti-diversion': ['.channel-node', '.channel-key'],
    experience: ['.v3-experience-card', '.v3-experience-notices'],
    'smart-dispatch': ['.v3-dispatch-intelligence', '.v3-dispatch-focus'],
    assistant: ['.v3-knowledge-source', '.v3-assist-card'],
    'live-demo': ['.v3-demo-role-tour', '.v2-demo-app'],
    future: ['.v3-future-centre', '.v3-future-direction'],
    delivery: ['.delivery-track>div', '.material-links'],
    closing: ['.closing-mark', '.closing-theme', '.closing-invitation', '.closing-signature']
  };
  function cancel() {
    // Cancellation exposes the complete resting page, including rapid navigation.
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function play(element, from, delay = 0, duration = 900) {
    if (!element || element.getClientRects().length === 0 || !element.animate) return;
    // SVG role groups already carry positioning transforms; animate relative to them.
    const style = getComputedStyle(element);
    const base = style.transform === 'none' ? '' : style.transform;
    const animation = element.animate([
      {opacity:0, transform:`${base} ${from}`.trim() || 'none'},
      {opacity:style.opacity, transform:base || 'none'}
    ], {duration, delay, easing:ease, fill:'backwards'});
    animations.add(animation);
    if (blocked) animation.pause();
    animation.finished.then(() => {
      animations.delete(animation);
      animation.cancel();
    }).catch(() => animations.delete(animation));
  }
  function enter(section, direction, instant) {
    cancel();
    if (instant || document.hidden) return;
    if (reduce.matches) {
      // Fade the content, never the scaled slide canvas itself.
      play(section.querySelector('.closing-mark'), '', 0, 150);
      play(section.querySelector('.slide-header'), '', 0, 150);
      play(section.querySelector('.visual'), '', 0, 150);
      return;
    }
    document.querySelectorAll('.report-folio>div').forEach((element, index) => {
      play(element, element.matches('.folio-index') ? '' : 'translateY(25px) rotate(-8deg)', index * 65, 1200);
    });
    play(section.querySelector('.eyebrow'), '', 0, 450);
    play(section.querySelector('h1'), `translateY(${28 * direction}px)`);
    let count = 0;
    (scenes[section.dataset.slide] || ['.visual']).forEach(selector => {
      section.querySelectorAll(selector).forEach(element => {
        let from = `translateY(${30 * direction}px)`;
        if (element.matches('.v2-support-centre,.closing-mark')) from = 'scale(.94)';
        else if (element.matches('.mobile-app')) from = 'translateX(50px)';
        else if (element.matches('.change-card,.delivery-track>div')) from = `translateX(${35 * direction}px)`;
        else if (element.matches('.v2-direction')) from = 'translateY(40px) rotate(1.5deg)';
        else if (element.matches('.journey-stop')) from = 'translateY(32px) scale(.96)';
        else if (element.matches('.v3-platform-piece')) from = 'translateY(22px) scale(.96)';
        play(element, from, 90 + count++ * 65);
      });
    });
    // Draw links only after the neighboring cards have started to appear.
    section.querySelectorAll('.channel-map>.channel-arrow').forEach((element, index) => {
      play(element, 'scaleX(0)', 430 + index * 140, 300);
    });
    section.querySelectorAll('.v3-answer,.v3-dispatch-focus-result,.v3-delivery-goal').forEach((element, index) => {
      play(element, 'translateY(12px)', 750 + index * 70, 650);
    });
  }
  function sync(isBlocked) {
    blocked = isBlocked;
    animations.forEach(animation => blocked ? animation.pause() : animation.play());
  }
  function feedback(element, instant) {
    if (instant || reduce.matches || document.hidden || !element.animate) return;
    const from = getComputedStyle(element).opacity;
    // Only retarget feedback on this element; leave the page's other entrances intact.
    animations.forEach(animation => {
      if (animation.effect.target === element) { animation.cancel(); animations.delete(animation); }
    });
    const animation = element.animate([{opacity:from * .55}, {opacity:1}], {duration:180, easing:ease});
    animations.add(animation);
    if (blocked) animation.pause();
    animation.finished.then(() => { animations.delete(animation); animation.cancel(); })
      .catch(() => animations.delete(animation));
  }
  return {enter, cancel, sync, feedback};
};
