'use strict';
// One entrance per page. Authored text and diagrams settle in place after the explanation.
window.createReportDisplayMotion = reduce => {
  const ease = getComputedStyle(document.documentElement).getPropertyValue('--ease-out').trim();
  const animations = new Set();
  // selector, pose, start, stagger. Timings follow the existing diagram's reading order.
  const scenes = {
    cover: [
      ['.cover-art', 'fade', 100], ['.cover-bottom', 'fade', 220]
    ],
    background: [
      ['.v2-source-strip', 'right', 100], ['.v2-direction', 'right', 180, 70]
    ],
    saas: [
      ['.v3-platform-board', 'fade', 100],
      ['.v3-platform-piece:not(.is-service)', 'fade', 160, 35],
      ['.v3-platform-piece.is-service', 'lift', 360],
      ['.v3-platform-story', 'fade', 280],
      ['.v3-platform-capability', 'fade', 360, 40], ['.v3-platform-evidence', 'fade', 460]
    ],
    system: [
      ['.web-app', 'fade', 100], ['.web-grid>div', 'lift', 170, 50],
      ['.mobile-app', 'lift', 330, 70]
    ],
    'product-service': [
      ['.journey-stop', 'right', 130, 60], ['.v2-journey-anchors>span', 'lift', 470, 50]
    ],
    exceptions: [
      ['.change-card', 'lift', 130, 60], ['.change-route>strong:last-child', 'right', 300, 50],
      ['.trace-panel', 'fade', 340], ['.trace-fields>div', 'lift', 400, 50]
    ],
    support: [
      ['.v2-support-centre', 'settle', 100], ['.v2-support-card', 'lift', 200, 60]
    ],
    'anti-diversion': [
      ['.channel-node', 'right', 130, 60], ['.channel-arrow', 'fade', 190, 60],
      ['.channel-key', 'fade', 320], ['.channel-check-list>div', 'right', 380, 45],
      ['.channel-checks>div', 'lift', 400, 50]
    ],
    experience: [
      ['.v3-experience-card', 'lift', 130, 70], ['.small-caption', 'fade', 460]
    ],
    'smart-dispatch': [
      ['.v3-dispatch-intelligence', 'fade', 100],
      ['.v3-dispatch-focus', 'lift', 170, 70], ['.v3-dispatch-policy', 'fade', 450]
    ],
    assistant: [
      ['.v3-knowledge-source', 'fade', 100], ['.v3-knowledge-branches', 'fade', 190],
      ['.v3-assist-card', 'lift', 210, 70], ['.v3-assist-scene', 'fade', 340, 60],
      ['.v3-value', 'fade', 470, 40]
    ],
    'live-demo': [
      ['.v2-demo-app', 'right', 130, 90], ['.v2-demo-return', 'lift', 440],
      ['.v2-demo-cue', 'fade', 520]
    ],
    future: [
      ['.v3-future-centre', 'lift', 100], ['.v3-future-direction', 'lift', 170, 55],
      ['.v3-future-path', 'fade', 450]
    ],
    delivery: [
      ['.delivery-track>div', 'lift', 130, 65], ['.v2-closing-value>strong', 'lift', 380, 50],
      ['.material-links', 'fade', 520], ['.v2-signoff', 'fade', 560]
    ]
  };
  function cancel() {
    // No fill-forwards styles: cancellation always exposes the complete resting page.
    animations.forEach(animation => animation.cancel());
    animations.clear();
  }
  function play(element, pose, delay, direction, duration = 420) {
    if (element.getClientRects().length === 0 || !element.animate) return;
    const transforms = {
      fade: ['none', 'none'],
      lift: ['translateY(14px)', 'translateY(0)'],
      right: [`translateX(${direction * -18}px)`, 'translateX(0)'],
      settle: ['translateY(10px) scale(.975)', 'translateY(0) scale(1)']
    };
    const [from, to] = transforms[pose];
    const animation = element.animate([
      {opacity: duration === 180 ? .6 : .12, transform: from}, {opacity: 1, transform: to}
    ], {duration, delay, easing: ease, fill: 'backwards'});
    animations.add(animation);
    animation.finished.then(() => {
      animations.delete(animation);
      animation.cancel();
    }).catch(() => animations.delete(animation));
  }
  function enter(section, direction, instant) {
    cancel();
    // The closing controller owns its single, stationary text fade.
    if (instant || document.hidden || section.dataset.slide === 'closing') return;
    if (reduce.matches) {
      // Preserve a gentle page transition without movement or stagger.
      play(section.querySelector('.slide-header'), 'fade', 0, direction, 180);
      play(section.querySelector('.visual'), 'fade', 0, direction, 180);
      return;
    }
    section.querySelectorAll('.slide-header>.eyebrow,.slide-header>h1,.slide-header>.subtitle')
      .forEach((element, i) => play(element, 'lift', i * 40, direction));
    const scene = scenes[section.dataset.slide] || [['.visual', 'fade', 100]];
    scene.forEach(([selector, pose, delay, stagger = 0]) => {
      section.querySelectorAll(selector).forEach((element, i) => play(element, pose, delay + i * stagger, direction));
    });
  }
  function feedback(element, instant) {
    // Rapid repeats retarget from the current opacity rather than restarting a flash.
    const from = getComputedStyle(element).opacity;
    cancel();
    if (instant || reduce.matches || document.hidden || !element.animate) return;
    const animation = element.animate([{opacity: from * .55}, {opacity: 1}], {duration: 180, easing: ease});
    animations.add(animation);
    animation.finished.then(() => { animations.delete(animation); animation.cancel(); })
      .catch(() => animations.delete(animation));
  }
  return {enter, cancel, feedback};
};
