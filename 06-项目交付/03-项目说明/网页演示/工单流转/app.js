'use strict';
// Presentation only: illustrative states, with no business APIs or customer data.
const $ = (id) => document.getElementById(id);
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const colorScheme = matchMedia('(prefers-color-scheme: dark)');
const embedded = new URLSearchParams(location.search).get('embed') === '1';
if (embedded) { document.body.classList.add('embedded'); document.documentElement.classList.add('embedded'); }
const easing = { out: 'cubic-bezier(.23,1,.32,1)', move: 'cubic-bezier(.77,0,.175,1)' };
const svgNS = 'http://www.w3.org/2000/svg';
const phaseStart = [0, 1, 3, 5, 6];
const roleStart = { consumer: 0, customer: 1, station: 2, worker: 3 };
const steps = [
  { role: 'consumer', target: 'customer', title: '消费者发起服务申请', status: '待分站', owner: '消费者', position: [271.5, 171.2], route: 'request', phase: 0 },
  { role: 'customer', target: 'station', title: '客服分配服务站', status: '服务站已匹配', owner: '客服分站', position: [752.5, 140], route: 'dispatch', phase: 1, smart: { title: '系统智能匹配服务站', owner: '智能分站' } },
  { role: 'station', target: 'worker', title: '服务站安排服务人员', status: '执行人已安排', owner: '服务站派人', position: [915, 300], route: 'assign', phase: 1, smart: { title: '系统连续完成站内派人', owner: '智能派人' } },
  { role: 'worker', target: 'consumer', title: '师傅联系客户，确认预约', status: '预约已确认', owner: '服务人员', position: [401.5, 340], route: 'contact', phase: 2 },
  { role: 'worker', target: 'customer', title: '完成服务，提交处理结果', status: '待完工审核', owner: '服务人员', position: [510, 210], route: 'review', phase: 2 },
  { role: 'customer', target: null, title: '客服审核本次服务结果', status: '审核通过', owner: '授权审核人员', position: [739.5, 164], route: 'review', phase: 3 },
  { role: 'consumer', target: null, title: '审核通过，本次服务办结', status: '已办结', owner: '服务记录留存', position: [587, 210], route: 'close', phase: 4 }
];
let mode = 'smart';
let step = 0;
let playing = false;
let motionPaused = false;
let timer = null;
let generation = 0;
const animations = new Map();
const streams = [];

function resolved() { return { ...steps[step], ...(mode === 'smart' ? steps[step].smart : {}) }; }
function cancelAnimation(key) { animations.get(key)?.cancel(); animations.delete(key); }
function animateElement(key, element, keyframes, options) {
  cancelAnimation(key);
  const animation = element.animate(keyframes, options);
  animations.set(key, animation);
  animation.finished.then(() => {
    if (animations.get(key) === animation) { animation.cancel(); animations.delete(key); }
  }).catch(() => {});
  return animation;
}
function setMotionState() {
  const pause = motionPaused || reducedMotion.matches || step === 6 || document.hidden;
  for (const animation of streams) pause ? animation.pause() : animation.play();
  for (const animation of animations.values()) motionPaused ? animation.pause() : animation.play();
}
function publishState() {
  if (embedded) parent.postMessage({ type: 'toto-flow-state', title: resolved().title, mode }, location.origin === 'null' ? '*' : location.origin);
}
function buildStreams() {
  for (const animation of streams) animation.cancel();
  streams.length = 0;
  document.querySelectorAll('.connection').forEach((connection) => {
    const container = connection.querySelector('.particles');
    container.replaceChildren();
    if (reducedMotion.matches) return;
    const path = connection.querySelector('path');
    const length = path.getTotalLength();
    // Position is sampled once; playback transforms the dots without layout reads.
    const frames = Array.from({ length: 49 }, (_, i) => {
      const p = path.getPointAtLength(length * i / 48);
      return { transform: 'translate(' + p.x + 'px,' + p.y + 'px)', opacity: i === 0 || i === 48 ? 0 : 1, offset: i / 48 };
    });
    const count = Math.max(5, Math.round(length / 58));
    const duration = length / 92 * 1000;
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElementNS(svgNS, 'g');
      const halo = document.createElementNS(svgNS, 'circle');
      halo.setAttribute('r', '9');
      halo.setAttribute('class', 'particle-halo');
      const core = document.createElementNS(svgNS, 'circle');
      core.setAttribute('r', '3.7');
      core.setAttribute('class', 'particle-core');
      dot.append(halo, core);
      container.append(dot);
      streams.push(dot.animate(frames, { duration, delay: -duration * i / count, iterations: Infinity, easing: 'linear' }));
    }
  });
  setMotionState();
}
function moveOrder(position, instant) {
  const element = $('order-position');
  const previous = getComputedStyle(element).transform;
  const target = 'translate(' + position[0] + 'px,' + position[1] + 'px)';
  cancelAnimation('order');
  element.style.transform = target;
  if (!instant && !reducedMotion.matches) animateElement('order', element, [{ transform: previous === 'none' ? target : previous }, { transform: target }], { duration: 1100, easing: easing.move });
}
function arrival(role, instant) {
  const node = document.querySelector('.role-node[data-role="' + role + '"]');
  const wave = node.querySelector('.node-wave');
  // Cancel previous waves, including when a transition is interrupted.
  for (const name of Object.keys(roleStart)) cancelAnimation('wave-' + name);
  cancelAnimation('card');
  if (instant || reducedMotion.matches) return;
  animateElement('wave-' + role, wave, [{ transform: 'scale(.9)', opacity: .7 }, { transform: 'scale(1.55)', opacity: 0 }], { duration: 1450, easing: easing.out });
  animateElement('card', document.querySelector('.order-art'), [{ transform: 'scale(.97)', opacity: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 450, easing: easing.out });
}
function render({ instant = false, announce = true } = {}) {
  const data = resolved();
  const root = document.documentElement;
  document.body.dataset.mode = mode;
  document.body.dataset.step = String(step);
  root.style.setProperty('--current', 'var(--' + data.role + ')');
  root.style.setProperty('--current-soft', 'var(--' + data.role + '-soft)');
  $('step-title').textContent = data.title;
  $('order-status').textContent = data.status;
  $('order-owner').textContent = data.owner;
  document.querySelectorAll('button[data-mode]').forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.mode === mode)));
  document.querySelectorAll('button[data-phase]').forEach((button) => {
    const index = Number(button.dataset.phase);
    button.classList.toggle('done', index < data.phase);
    if (index === data.phase) button.setAttribute('aria-current', 'step'); else button.removeAttribute('aria-current');
  });
  const visitedRoles = new Set(steps.slice(0, step).map((item) => item.role));
  document.querySelectorAll('.role-node').forEach((node) => {
    node.classList.toggle('active', step !== 6 && node.dataset.role === data.role);
    node.classList.toggle('receiving', node.dataset.role === data.target);
    node.classList.toggle('done', step === 6 || visitedRoles.has(node.dataset.role));
  });
  const visitedRoutes = new Set(steps.slice(0, step).map((item) => item.route));
  document.querySelectorAll('.connection').forEach((connection) => {
    connection.classList.toggle('active', step !== 6 && connection.dataset.route === data.route);
    connection.classList.toggle('traversed', step === 6 || visitedRoutes.has(connection.dataset.route));
  });
  $('timeline-fill').style.transform = 'scaleX(' + data.phase / 4 + ')';
  $('completion').setAttribute('opacity', step === 6 ? '1' : '0');
  $('previous').disabled = step === 0;
  $('next').disabled = step === 6;
  updatePlayButton();
  moveOrder(data.position, instant);
  arrival(data.role, instant);
  cancelAnimation('title');
  cancelAnimation('complete');
  if (!instant && !reducedMotion.matches) {
    animateElement('title', $('step-title'), [{ opacity: .1, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 420, easing: easing.out });
    if (step === 6) animateElement('complete', $('completion'), [{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'scale(1)' }], { duration: 1200, easing: easing.out });
  }
  setMotionState();
  if (announce && !playing) $('announcement').textContent = data.title + '，工单状态：' + data.status;
  publishState();
}
function stopSchedule() { playing = false; generation += 1; clearTimeout(timer); timer = null; }
function updatePlayButton() {
  const label = playing ? '暂停播放' : step === 6 ? '重播流转' : motionPaused ? '继续播放' : '播放流转';
  $('play').innerHTML = label + ' <span aria-hidden="true">' + (playing ? 'Ⅱ' : step === 6 ? '↻' : '▶') + '</span>';
}
function goTo(index, instant = false) {
  stopSchedule();
  motionPaused = false;
  step = Math.max(0, Math.min(6, index));
  render({ instant });
}
function schedule(token) {
  clearTimeout(timer);
  // Smart station/person assignment joins continuously; timing is presentation pacing.
  const dwell = mode === 'smart' && (step === 1 || step === 2) ? 1450 : 3000;
  timer = setTimeout(() => {
    if (!playing || token !== generation) return;
    step = Math.min(6, step + 1);
    if (step === 6) stopSchedule();
    render({ announce: false });
    if (playing) schedule(token);
  }, dwell);
}
function pause() {
  stopSchedule();
  motionPaused = true;
  setMotionState();
  updatePlayButton();
}
function togglePlay() {
  if (playing) { pause(); return; }
  if (step === 6) { step = 0; motionPaused = false; render({ instant: true }); }
  playing = true;
  motionPaused = false;
  generation += 1;
  setMotionState();
  updatePlayButton();
  schedule(generation);
}
function setTheme(dark) { document.documentElement.dataset.theme = dark ? 'dark' : 'light'; $('theme').textContent = dark ? '浅色' : '深色'; }
$('play').addEventListener('click', togglePlay);
$('next').addEventListener('click', () => goTo(step + 1));
$('previous').addEventListener('click', () => goTo(step - 1));
$('reset').addEventListener('click', () => goTo(0));
document.querySelectorAll('button[data-phase]').forEach((button) => button.addEventListener('click', () => goTo(phaseStart[Number(button.dataset.phase)])));
document.querySelectorAll('button[data-mode]').forEach((button) => button.addEventListener('click', () => { stopSchedule(); motionPaused = false; mode = button.dataset.mode; render({ instant: true }); }));
document.querySelectorAll('.role-node').forEach((node) => {
  node.addEventListener('click', () => goTo(roleStart[node.dataset.role]));
  node.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.code === 'Space') { event.preventDefault(); event.stopPropagation(); goTo(roleStart[node.dataset.role], true); }
  });
});
$('theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'dark'));
colorScheme.addEventListener('change', (event) => setTheme(event.matches));
reducedMotion.addEventListener('change', () => {
  stopSchedule();
  motionPaused = false;
  for (const key of [...animations.keys()]) cancelAnimation(key);
  buildStreams();
  render({ instant: true });
});
$('fullscreen').addEventListener('click', async () => {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { $('announcement').textContent = '浏览器未允许全屏，可使用浏览器的全屏功能。'; }
});
document.addEventListener('fullscreenchange', () => { $('fullscreen').textContent = document.fullscreenElement ? '退出全屏' : '全屏'; });
document.addEventListener('keydown', (event) => {
  if (event.altKey || event.ctrlKey || event.metaKey || event.target.closest('input,textarea,select')) return;
  if (event.code === 'Space' && event.target.closest('button,a')) return;
  if (event.key === 'ArrowRight') { event.preventDefault(); goTo(step + 1, true); }
  if (event.key === 'ArrowLeft') { event.preventDefault(); goTo(step - 1, true); }
  if (event.code === 'Space') { event.preventDefault(); togglePlay(); }
  if (event.key === 'Escape' && playing) pause();
});
document.addEventListener('visibilitychange', () => { if (document.hidden && playing) pause(); else setMotionState(); });
// The local report shares heading and mode controls; the standalone demo keeps its own controls.
window.addEventListener('message', (event) => {
  if (!embedded || event.source !== parent || (location.origin !== 'null' && event.origin !== location.origin) || event.data?.type !== 'toto-report') return;
  if (event.data.theme === 'light' || event.data.theme === 'dark') setTheme(event.data.theme === 'dark');
  if (event.data.action === 'pause') pause();
  if (event.data.action === 'activate') { motionPaused = false; setMotionState(); updatePlayButton(); }
  if (event.data.action === 'mode' && ['manual','smart'].includes(event.data.mode)) {
    stopSchedule(); motionPaused = false; mode = event.data.mode; render({ instant: true });
  }
  if (event.data.action === 'activate') publishState();
});
setTheme(colorScheme.matches);
buildStreams();
render({ instant: true, announce: false });
if (!reducedMotion.matches) {
  document.querySelectorAll('.intro,.stage,.footer').forEach((element, index) => animateElement('intro-' + index, element, [{ opacity: 0, transform: 'translateY(12px)' }, { opacity: 1, transform: 'translateY(0)' }], { duration: 600, delay: index * 65, easing: easing.out }));
}
