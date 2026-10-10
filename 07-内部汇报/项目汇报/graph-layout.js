'use strict';
// The authored content stays in content.js. These are decorative flat illustrations and presentation-only wrappers.
window.createReportGraphics = sections => {
  const scene = (parent, name, before = null) => {
    const host = document.createElement('span');
    host.className = 'report-figure business-diagram';
    host.dataset.diagram = name;
    // The illustration is decorative; the accompanying text explains the business.
    host.setAttribute('aria-hidden', 'true');
    host.innerHTML = window.REPORT_DIAGRAMS[name];
    parent.insertBefore(host, before);
    return host;
  };
  const wrap = (parent, className) => {
    const copy = document.createElement('div');
    copy.className = className;
    copy.append(...parent.childNodes);
    parent.append(copy);
    return copy;
  };
  sections.forEach(section => {
    const find = selector => section.querySelector(selector);
    section.classList.add('graphic-report');
    switch (section.dataset.slide) {
      case 'background':
        section.querySelectorAll('.v2-direction').forEach((card, i) => {
          card.querySelector('.graphic-mark').remove();
          scene(card, ['data', 'coordination', 'applications'][i], card.firstChild);
        });
        break;
      case 'saas':
        window.createReportPlatformPuzzle(find('.v3-platform-puzzle'));
        break;
      case 'exceptions': {
        const panel = find('.trace-panel');
        const copy = wrap(panel, 'trace-copy');
        scene(panel, 'trace', copy);
        break;
      }
      case 'support': {
        const centre = find('.v2-support-centre');
        centre.querySelector('.graphic-mark').remove();
        scene(centre, 'order', centre.firstChild);
        break;
      }
      case 'anti-diversion':
        section.querySelectorAll('.channel-node').forEach(node => {
          const icon = node.querySelector('h3>.report-icon');
          const mark = document.createElement('span');
          mark.className = 'channel-scene-symbol';
          mark.setAttribute('aria-hidden', 'true');
          mark.append(icon);
          node.prepend(mark);
        });
        break;
      case 'experience':
        section.querySelectorAll('.experience-points>div').forEach((point, i) => {
          point.classList.add(['blue', 'gold', 'teal'][i]);
          const icon = point.querySelector('h3>.report-icon');
          const copy = wrap(point, 'experience-copy');
          const mark = document.createElement('span');
          mark.className = 'experience-device';
          mark.setAttribute('aria-hidden', 'true');
          mark.append(icon);
          point.insertBefore(mark, copy);
        });
        break;
    }
  });
  // Normalize presentation markup only: preserve every authored heading character.
  sections.filter(section => section.dataset.slide !== 'cover').forEach(section => {
    const title = section.querySelector('.slide-header>h1');
    if (!title) return;
    const emphasis = title.querySelector('em');
    const lineBreak = title.querySelector('br');
    if (emphasis && !lineBreak) {
      title.insertBefore(document.createElement('br'), emphasis);
    } else if (lineBreak && !emphasis) {
      const secondLine = document.createElement('em');
      while (lineBreak.nextSibling) secondLine.append(lineBreak.nextSibling);
      title.append(secondLine);
    }
  });
  // Size follows the icon's role, rather than a separate per-page convention.
  sections.forEach(section => {
    section.querySelectorAll('.report-icon').forEach(icon => {
      const role = section.dataset.slide === 'system' && icon.closest('.web-grid, .phone-scene-mark');
      const compact = icon.closest('.platform-chrome, #cover-motion-toggle');
      const smallMark = icon.closest('.platform-app-mark, .phone-scene-mark');
      const feature = icon.closest('.graphic-mark, .reuse-symbol, .journey-number, .channel-scene-symbol, .experience-device');
      const identity = icon.closest('.web-grid, .platform-heading');
      icon.classList.add(role ? 'icon-role' : compact ? 'icon-auxiliary' : smallMark ? 'icon-label' : feature ? 'icon-feature' : identity ? 'icon-identity' : 'icon-label');
    });
  });
  // One shared feedback class for authored HTML and SVG cards. New cards can use
  // report-card directly; existing compositions keep their layout selectors intact.
  const cardSelector = [
    '.report-card',
    '.cover-object', '.hero-order', '.v3-platform-piece',
    '.v2-source-strip', '.v2-direction', '.v3-platform-board',
    '.v3-platform-story', '.v3-platform-capability', '.web-app',
    '.web-grid>div', '.mobile-app', '.journey-stop', '.v2-journey-anchors>span',
    '.change-card', '.change-route>strong', '.trace-panel', '.trace-fields>div',
    '.v2-support-centre', '.v2-support-card', '.channel-node', '.channel-key',
    '.channel-check-list>div', '.v3-experience-card', '.task-example',
    '.v3-message-row', '.v3-dispatch-focus', '.v3-knowledge-source',
    '.v3-assist-card', '.v3-question', '.v3-answer', '.v2-demo-app',
    '.v3-demo-steps>span', '.v3-future-centre', '.v3-future-commerce',
    '.v3-future-direction', '.delivery-track>div', '.material-links'
  ].join(',');
  sections.forEach(section => {
    section.querySelectorAll(cardSelector).forEach(card => {
      card.classList.add('report-card');
      if (card.namespaceURI === 'http://www.w3.org/1999/xhtml') {
        card.classList.add('report-card-html');
        // The shadow must cover the border box, rather than the padding box.
        const style = getComputedStyle(card);
        ['top', 'right', 'bottom', 'left'].forEach(side => {
          card.style.setProperty('--report-card-border-' + side, style.getPropertyValue('border-' + side + '-width'));
        });
      }
    });
  });
  // SVGs are rendered once. Existing page entrance animations control their presentation.
};
