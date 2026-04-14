// assets/js/helpers.js

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}

export function pmFaviconUrl(pm) {
  if (!pm || !pm.website) return null;
  try {
    const u = new URL(pm.website);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

export function pmGlyphHtml(pm) {
  const initial = ((pm && pm.name && pm.name[0]) || '?').toUpperCase();
  const fav = pmFaviconUrl(pm);
  return `<div class="t-pm-glyph">
    <span class="t-pm-glyph-letter mono">${esc(initial)}</span>
    ${fav ? `<img class="t-pm-glyph-img" src="${esc(fav)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}
  </div>`;
}

export function gradeClass(grade) {
  if (!grade) return 't-grade t-grade-na';
  const g = grade.toLowerCase();
  if (g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'f') return 't-grade t-grade-' + g;
  if (g === 'production')   return 't-grade t-grade-fwprod';
  if (g === 'usable')       return 't-grade t-grade-fwusable';
  if (g === 'experimental') return 't-grade t-grade-fwexp';
  return 't-grade t-grade-na';
}

export function toolPillClass(type) {
  switch ((type || '').toLowerCase()) {
    case 'api':       return 't-pill t-pill-api';
    case 'sdk':       return 't-pill t-pill-sdk';
    case 'websocket': return 't-pill t-pill-ws';
    case 'cli':       return 't-pill t-pill-cli';
    case 'mcp':       return 't-pill t-pill-mcp';
    case 'skill':     return 't-pill t-pill-skill';
    case 'framework': return 't-pill t-pill-fw';
    default:          return 't-pill';
  }
}

export function toolPillLabel(type) {
  const t = (type || '').toLowerCase();
  if (t === 'websocket') return 'WS';
  return (type || '').toUpperCase();
}

export function catBadgeClass(cat) {
  if (cat === 'Decentralized') return 'badge-decentralized';
  if (cat === 'Regulated/CeFi') return 'badge-regulated';
  if (cat === 'Play Money') return 'badge-playmoney';
  return '';
}

export function toolTypeBadgeClass(type) {
  const t = type.toLowerCase();
  if (t === 'api') return 'tool-type-api';
  if (t === 'sdk') return 'tool-type-sdk';
  if (t === 'websocket') return 'tool-type-websocket';
  if (t === 'cli') return 'tool-type-cli';
  if (t === 'mcp') return 'tool-type-mcp';
  if (t === 'framework') return 'tool-type-framework';
  if (t === 'skill') return 'tool-type-skill';
  return 'tool-type-api';
}

export function toolTypeGlyphClass(type) {
  switch ((type || '').toLowerCase()) {
    case 'api':       return 't-dt-glyph t-dt-glyph-api';
    case 'sdk':       return 't-dt-glyph t-dt-glyph-sdk';
    case 'websocket': return 't-dt-glyph t-dt-glyph-ws';
    case 'cli':       return 't-dt-glyph t-dt-glyph-cli';
    case 'mcp':       return 't-dt-glyph t-dt-glyph-mcp';
    case 'skill':     return 't-dt-glyph t-dt-glyph-skl';
    case 'framework': return 't-dt-glyph t-dt-glyph-fw';
    default:          return 't-dt-glyph';
  }
}

export function toolTypeGlyphLabel(type) {
  const t = (type || '').toLowerCase();
  if (t === 'websocket') return 'WS';
  if (t === 'framework') return 'FW';
  if (t === 'skill') return 'SKL';
  return (type || '').toUpperCase();
}

export function aaGrade(score) {
  if (score >= 13) return 'A';
  if (score >= 10) return 'B';
  if (score >= 7) return 'C';
  if (score >= 4) return 'D';
  return 'F';
}
