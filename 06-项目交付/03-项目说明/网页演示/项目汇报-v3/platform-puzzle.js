'use strict';
// Reflow the six tiles inside the SVG viewport; text and icons retain their proportions.
window.createReportPlatformPuzzle = svg => {
  const namespace = 'http://www.w3.org/2000/svg';
  const make = (tag, attributes = {}) => {
    const node = document.createElementNS(namespace, tag);
    Object.entries(attributes).forEach(([key, value]) => node.setAttribute(key, value));
    return node;
  };
  const defs = make('defs');
  const shadow = make('filter', {id: 'platform-puzzle-shadow', x: '-10%', y: '-15%', width: '120%', height: '135%'});
  shadow.append(make('feDropShadow', {class: 'v3-puzzle-shadow', dx: 0, dy: 3, stdDeviation: 2, 'flood-opacity': '.1'}));
  defs.append(shadow);
  svg.prepend(defs);
  const assembly = make('g', {class: 'v3-puzzle-assembly', filter: 'url(#platform-puzzle-shadow)'});
  svg.append(assembly);
  const base = make('rect', {class: 'v3-puzzle-base'});
  assembly.append(base);
  svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');
  const tiles = Array.from(svg.querySelectorAll('.v3-platform-piece'), piece => {
    const face = piece.querySelector('.v3-puzzle-shape');
    const icon = piece.querySelector('g');
    const iconBase = make('rect', {class: 'v3-puzzle-icon-base'});
    icon.before(iconBase);
    const title = piece.querySelector('.v3-puzzle-title');
    const detail = piece.querySelector('.v3-puzzle-detail');
    const surface = make('g', {class: 'v3-puzzle-surface'});
    face.before(surface);
    surface.append(face);
    assembly.append(piece);
    return {surface, face, iconBase, icon, title, detail};
  });
  const outline = (x, y, width, height, row, column) => {
    const cx = x + width / 2, cy = y + height / 2;
    const corner = Math.min(14, height * .12), tab = Math.min(16, height * .13), bulge = tab * 1.45;
    // Round only the four exterior corners; shared edges meet without gaps.
    const tl = row === 0 && column === 0 ? corner : 0;
    const tr = row === 0 && column === 2 ? corner : 0;
    const br = row === 1 && column === 2 ? corner : 0;
    const bl = row === 1 && column === 0 ? corner : 0;
    let path = `M${x + tl} ${y}`;
    if (row) path += `L${cx - tab} ${y} C${cx - tab} ${y + bulge} ${cx + tab} ${y + bulge} ${cx + tab} ${y}`;
    path += `L${x + width - tr} ${y} Q${x + width} ${y} ${x + width} ${y + tr}`;
    if (column < 2) path += `L${x + width} ${cy - tab} C${x + width + bulge} ${cy - tab} ${x + width + bulge} ${cy + tab} ${x + width} ${cy + tab}`;
    path += `L${x + width} ${y + height - br} Q${x + width} ${y + height} ${x + width - br} ${y + height}`;
    if (!row) path += `L${cx + tab} ${y + height} C${cx + tab} ${y + height + bulge} ${cx - tab} ${y + height + bulge} ${cx - tab} ${y + height}`;
    path += `L${x + bl} ${y + height} Q${x} ${y + height} ${x} ${y + height - bl}`;
    if (column) path += `L${x} ${cy + tab} C${x + bulge} ${cy + tab} ${x + bulge} ${cy - tab} ${x} ${cy - tab}`;
    return path + `L${x} ${y + tl} Q${x} ${y} ${x + tl} ${y}Z`;
  };
  let previousSize = '';
  const fit = (width, height) => {
    if (width <= 0 || height <= 0) return; // Hidden slides are laid out when they become visible.
    const size = `${width.toFixed(1)}:${height.toFixed(1)}`;
    if (size === previousSize) return;
    previousSize = size;
    const canvasWidth = 580, canvasHeight = canvasWidth * height / width;
    const padding = Math.min(16, canvasHeight * .055), tileWidth = (canvasWidth - padding * 2) / 3;
    const tileHeight = (canvasHeight - padding * 2) / 2;
    svg.setAttribute('viewBox', `0 0 ${canvasWidth} ${canvasHeight}`);
    shadow.firstElementChild.setAttribute('dy', Math.min(3, tileHeight * .026));
    shadow.firstElementChild.setAttribute('stdDeviation', Math.min(2, tileHeight * .017));
    base.setAttribute('x', padding);
    base.setAttribute('y', padding + Math.min(3, tileHeight * .025));
    base.setAttribute('width', tileWidth * 3);
    base.setAttribute('height', tileHeight * 2);
    base.setAttribute('rx', Math.min(14, tileHeight * .12));
    tiles.forEach((tile, index) => {
      const row = Math.floor(index / 3), column = index % 3;
      const x = padding + column * tileWidth, y = padding + row * tileHeight;
      const cx = x + tileWidth / 2, cy = y + tileHeight / 2;
      const scale = Math.max(.05, Math.min(1.05, (tileHeight - Math.min(36, tileHeight * .45)) / 52));
      const d = outline(x, y, tileWidth, tileHeight, row, column);
      tile.face.setAttribute('d', d);
      tile.iconBase.setAttribute('x', cx - 64 * scale);
      tile.iconBase.setAttribute('y', cy - 27 * scale);
      tile.iconBase.setAttribute('width', 38 * scale);
      tile.iconBase.setAttribute('height', 38 * scale);
      tile.iconBase.setAttribute('rx', 12 * scale);
      tile.icon.setAttribute('transform', `translate(${cx - 58 * scale} ${cy - 21 * scale}) scale(${26 / 24 * scale})`);
      tile.title.setAttribute('x', cx + 22 * scale);
      tile.title.setAttribute('y', cy - 4 * scale);
      tile.title.style.fontSize = `${20 * scale}px`;
      tile.detail.setAttribute('x', cx);
      tile.detail.setAttribute('y', cy + 26 * scale);
      tile.detail.style.fontSize = `${12 * scale}px`;
    });
  };
  // Retain an authored-sized layout for offline printing and DOM-only consumers.
  fit(580, 300);
  const observer = new ResizeObserver(entries => {
    const box = entries[0]?.contentRect;
    if (box) fit(box.width, box.height);
  });
  observer.observe(svg);
  return {fit, destroy: () => observer.disconnect()};
};
