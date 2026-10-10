'use strict';
// Compact flat illustrations enrich the existing copy without repeating business flows.
// Tabler glyphs, rounded outlines and the report's theme tokens keep the visual language shared.
window.REPORT_DIAGRAMS = (() => {
  const rect = (x, y, width, height, radius = 8, style = 'art-paper') => `<rect x="${x}" y="${y}" width="${width}" height="${height}" rx="${radius}" class="${style}"/>`;
  const line = (d, style = '') => `<path d="${d}" class="${style}"/>`;
  const dot = (x, y, radius = 2.5, style = 'art-accent') => `<circle cx="${x}" cy="${y}" r="${radius}" class="${style}"/>`;
  const glyph = (name, x, y, size) => `<g transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="currentColor" stroke-width="1.5">${window.REPORT_ICONS[name]}</g>`;
  const svg = (body, width = 200, height = 150) => `<svg xmlns="http://www.w3.org/2000/svg" class="business-svg" viewBox="0 0 ${width} ${height}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" preserveAspectRatio="xMidYMid meet" focusable="false" aria-hidden="true">${body}</svg>`;
  const chrome = (x, y, width) => line(`M${x} ${y}h${width}`, 'art-muted') + dot(x + 12, y - 9, 2) + dot(x + 21, y - 9, 2, 'art-muted-dot');
  return {
    // A product record in front of stored information, with no relationship connectors.
    data: svg(
      '<path d="M30 55V113C30 131 100 131 100 113V55" class="art-soft"/><ellipse cx="65" cy="55" rx="35" ry="12" class="art-soft"/>' +
      line('M30 76C30 94 100 94 100 76M30 97C30 115 100 115 100 97', 'art-muted') +
      rect(92, 15, 78, 117, 12) + rect(102, 25, 58, 44, 6, 'art-soft') + glyph('package', 114, 30, 34) +
      line('M106 85H155M106 96H148M106 107H136', 'art-muted') + dot(155, 119, 3)),
    // A configuration workbench, not a dispatch diagram.
    coordination: svg(
      rect(22, 21, 156, 109, 12) + chrome(22, 43, 156) +
      '<circle cx="66" cy="83" r="29" class="art-soft art-no-stroke"/>' + glyph('settings', 41, 58, 50) +
      line('M112 66H160M112 86H160M112 106H160', 'art-muted') +
      dot(133, 66, 4, 'art-control') + dot(149, 86, 4, 'art-control') + dot(125, 106, 4, 'art-control')),
    // An interface scene with a cursor and mobile screen; no app-to-app connectors.
    applications: svg(
      rect(15, 21, 143, 98, 14) + chrome(15, 43, 143) +
      rect(27, 54, 30, 52, 6, 'art-soft') + rect(68, 54, 75, 18, 5, 'art-soft art-no-stroke') +
      line('M69 86H106M69 97H97', 'art-muted') +
      rect(140, 51, 45, 84, 9) + line('M155 61H170', 'art-muted') + rect(149, 73, 27, 30, 5, 'art-soft') +
      line('M152 114H173', 'art-muted') + dot(162.5, 124, 2) +
      '<path d="M110 88L109 121L118 114L125 127L132 123L124 110L136 109Z" class="art-paper"/>'),
    // A platform application panel with shallow flat overlap, not physical 3D slabs.
    platform: svg(
      rect(34, 13, 133, 98, 14, 'art-soft') + rect(24, 28, 133, 108, 14) +
      chrome(24, 49, 133) + rect(34, 60, 24, 63, 5, 'art-soft art-no-stroke') +
      line('M41 73H51M41 85H51M41 97H47', 'art-muted') +
      rect(72, 62, 31, 26, 6, 'art-soft') + rect(112, 62, 31, 26, 6, 'art-soft') +
      rect(72, 99, 71, 23, 6, 'art-soft art-no-stroke') + line('M83 110H125', 'art-muted')),
    // A material record, shown as an illustration rather than another labeled field list.
    trace: svg(
      rect(28, 20, 92, 124, 12) + rect(52, 10, 43, 21, 7, 'art-soft') +
      rect(41, 47, 64, 31, 6, 'art-soft art-no-stroke') + glyph('file-check', 58, 46, 30) +
      line('M44 94H99M44 108H91M44 122H77', 'art-muted') +
      '<path d="M120 110L132 120L132 153L120 145L108 153V120Z" class="art-soft"/>', 150, 164),
    // A service order and maintenance tool form one compact support illustration.
    order: svg(
      rect(45, 20, 99, 115, 14) + rect(71, 14, 47, 20, 7, 'art-soft') +
      '<circle cx="71" cy="56" r="9" class="art-soft"/>' + line('M90 53H125M90 62H113M61 80H123M61 94H112M61 108H104', 'art-muted') +
      '<circle cx="148" cy="111" r="29" class="art-soft art-no-stroke"/>' + glyph('tool', 125, 88, 46)),
    // Rule controls and a subtle intelligence accent, without candidates or flow arrows.
    dispatch: svg(
      rect(24, 26, 139, 107, 14) + chrome(24, 48, 139) +
      line('M42 69H139M42 91H139M42 113H139', 'art-muted') +
      rect(67, 62, 14, 14, 4, 'art-soft') + rect(109, 84, 14, 14, 4, 'art-soft') + rect(49, 106, 14, 14, 4, 'art-soft') +
      '<circle cx="162" cy="32" r="25" class="art-soft art-no-stroke"/>' + glyph('sparkles', 141, 14, 42)),
  };
})();
