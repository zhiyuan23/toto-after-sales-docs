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
      ['.platform-shell', 'fade', 100], ['.platform-service', 'lift', 170],
      ['.reuse-feature', 'right', 240, 60], ['.platform-expansion', 'lift', 420],
      ['.platform-evidence', 'fade', 460]
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
      ['.workbench', 'fade', 100], ['.task-example', 'lift', 180],
      ['.experience-points>div', 'right', 240, 60], ['.small-caption', 'fade', 460]
    ],
    'smart-dispatch': [
      ['.candidate-list>small', 'fade', 100], ['.candidate-list>span', 'right', 130, 50],
      ['.strategy-core', 'settle', 240], ['.dispatch-results>div', 'lift', 340, 80],
      ['.dispatch-results>span', 'fade', 400, 80], ['.takeaway', 'fade', 550]
    ],
    assistant: [
      ['.v2-knowledge-strip', 'right', 100], ['.v2-assist-card', 'fade', 180, 60],
      ['.v2-assist-card-top,.v2-assist-card h3,.v2-assist-path', 'fade', 240, 30],
      ['.v2-assist-question', 'right', 300], ['.v2-assist-answer', 'lift', 420],
      ['.v2-assist-parts>span', 'lift', 300, 50], ['.v2-assist-stock', 'right', 460],
      ['.v2-assist-preview>small,.v2-assist-benefit', 'fade', 480, 30]
    ],
    'live-demo': [
      ['.v2-demo-app', 'right', 130, 90], ['.v2-demo-return', 'lift', 440],
      ['.v2-demo-cue', 'fade', 520]
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
    if (instant || document.hidden) return;
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
