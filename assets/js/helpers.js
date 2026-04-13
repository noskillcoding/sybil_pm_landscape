// assets/js/helpers.js

export function esc(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
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
  if (t === 'framework') return 'FW';
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

export function aaGrade(score) {
  if (score >= 13) return 'A';
  if (score >= 10) return 'B';
  if (score >= 7) return 'C';
  if (score >= 4) return 'D';
  return 'F';
}
