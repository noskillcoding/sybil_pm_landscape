// assets/js/landscape.js

import { state } from './state.js';
import { esc, toolPillClass, toolPillLabel } from './helpers.js';
import { Sort } from './sort.js';
import { Router } from './router.js';

// Legacy stable-sort defaults — read by getFiltered() but never written.
const sortCol = 'volumeNumeric';
const sortDir = -1;

function getFiltered() {
  return window.DATA.filter(pm => {
    if (state.catFilter && pm.category !== state.catFilter) return false;
    if (state.toolFilter === 'hasDevTools' && pm.coreTools.length === 0) return false;
    if (state.toolFilter === 'hasAiTools' && pm.aiTools.length === 0) return false;
    if (state.toolFilter === 'noTools' && (pm.coreTools.length > 0 || pm.aiTools.length > 0)) return false;
    if (state.searchQ) {
      const q = state.searchQ.toLowerCase();
      const hay = (pm.name + ' ' + pm.description + ' ' + pm.chain + ' ' + pm.category).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }).sort((a, b) => {
    let va, vb;
    if (sortCol === 'name') { va = a.name.toLowerCase(); vb = b.name.toLowerCase(); return sortDir * va.localeCompare(vb); }
    if (sortCol === 'category') { va = a.category; vb = b.category; return sortDir * va.localeCompare(vb); }
    if (sortCol === 'chain') { va = a.chain; vb = b.chain; return sortDir * va.localeCompare(vb); }
    if (sortCol === 'volumeNumeric') { return sortDir * ((a.volumeNumeric || 0) - (b.volumeNumeric || 0)); }
    if (sortCol === 'coreTools') { return sortDir * (a.coreTools.length - b.coreTools.length); }
    if (sortCol === 'aiTools') { return sortDir * (a.aiTools.length - b.aiTools.length); }
    return 0;
  });
}

export function render() {
  const DATA = window.DATA;
  // Stats
  const total = DATA.length;

  const topbarCount = document.getElementById('topbarCount');
  if (topbarCount) topbarCount.textContent = `${total} markets`;

  // Category filters
  const cats = ['Decentralized', 'Regulated/CeFi', 'Play Money'];
  document.getElementById('catFilters').innerHTML =
    `<button class="t-chip${state.catFilter === null ? ' active' : ''}" data-cat="">all</button>` +
    cats.map(c =>
      `<button class="t-chip${state.catFilter === c ? ' active' : ''}" data-cat="${c}">${c.toLowerCase()}</button>`
    ).join('');

  // Tool filters
  const tfs = [
    { key: 'hasDevTools', label: 'Has Dev Tools' },
    { key: 'hasAiTools', label: 'Has AI Tools' },
    { key: 'noTools', label: 'No Tools' }
  ];
  document.getElementById('toolFilters').innerHTML = tfs.map(t =>
    `<button class="t-chip${state.toolFilter === t.key ? ' active' : ''}" data-tool="${t.key}">${t.label.toLowerCase()}</button>`
  ).join('');

  // Table head
  const arrow = key => {
    if (Sort.state.key !== key) return '';
    return `<span class="t-sort-arrow mono">${Sort.state.dir === 'asc' ? '↑' : '↓'}</span>`;
  };
  document.getElementById('tableHead').innerHTML = `
    <tr>
      <th></th>
      <th class="sortable" data-sort="name">Market${arrow('name')}</th>
      <th class="sortable" data-sort="category">Category${arrow('category')}</th>
      <th class="num sortable" data-sort="volume">Volume${arrow('volume')}</th>
      <th>Dev tools</th>
      <th>Agent tools</th>
    </tr>
  `;
  document.querySelectorAll('#tableHead th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      Sort.cycle(th.dataset.sort);
      render();
      Router.push();
    });
  });

  // Table body
  let filtered = getFiltered();
  filtered = Sort.apply(filtered);
  document.getElementById('resultsCount').textContent = `Showing ${filtered.length} of ${total} prediction markets`;

  let html = '';
  filtered.forEach((pm, i) => {
    const initial = (pm.name[0] || '?').toUpperCase();
    const catClass = pm.category === 'Decentralized' ? 't-cat-dec'
                   : pm.category === 'Regulated/CeFi' ? 't-cat-cefi'
                   : 't-cat-play';
    const volDisplay = (pm.volumeNumeric > 0)
      ? esc(pm.volumeEstimate || '—')
      : `<span class="t-vol-muted">${esc(pm.volumeEstimate || 'undisclosed')}</span>`;

    const devToolsHtml = pm.coreTools.length
      ? `<div class="t-tools">${pm.coreTools.map(t => `<span class="${toolPillClass(t.type)}">${esc(toolPillLabel(t.type))}</span>`).join('')}</div>`
      : `<span class="t-pill t-pill-none">—</span>`;
    const aiToolsHtml = pm.aiTools.length
      ? `<div class="t-tools">${pm.aiTools.map(t => `<span class="${toolPillClass(t.type)}">${esc(toolPillLabel(t.type))}</span>`).join('')}</div>`
      : `<span class="t-pill t-pill-none">—</span>`;

    const domain = (pm.website || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
    const chainShort = pm.chain && pm.chain.length > 22 ? pm.chain.split(/[(,]/)[0].trim() : (pm.chain || '');
    const metaLine = chainShort ? `${domain} · ${chainShort}` : domain;
    const rowHtml = `
  <tr class="t-row" data-pm="${esc(pm.name)}">
    <td class="t-chev">▶</td>
    <td>
      <div class="t-pm">
        <div class="t-pm-glyph">${initial}</div>
        <div>
          <div class="t-pm-name">${esc(pm.name)}</div>
          <div class="t-pm-meta">${esc(metaLine)}</div>
        </div>
      </div>
    </td>
    <td><span class="t-cat ${catClass}">${esc(pm.category)}</span></td>
    <td class="t-vol">${volDisplay}</td>
    <td>${devToolsHtml}</td>
    <td>${aiToolsHtml}</td>
  </tr>
`;
    const primaryUrl = (t) => {
      if (t.docsUrl) return t.docsUrl;
      if (Array.isArray(t.docsUrls) && t.docsUrls[0]) return t.docsUrls[0];
      if (t.githubUrl) return t.githubUrl;
      if (Array.isArray(t.githubUrls) && t.githubUrls[0]) return t.githubUrls[0];
      if (t.npmUrl) return t.npmUrl;
      return null;
    };
    const renderToolInline = (t) => {
      const url = primaryUrl(t);
      const tipAttr = t.description ? ` title="${esc(t.description)}"` : '';
      return url
        ? `<a class="t-dt-name" href="${esc(url)}" target="_blank"${tipAttr}>${esc(t.name)}</a>`
        : `<span class="t-dt-name"${tipAttr}>${esc(t.name)}</span>`;
    };
    const allTools = [...pm.coreTools, ...pm.aiTools];
    const toolsHtml = allTools.map(renderToolInline).join('<span class="t-dt-sep">·</span>');

    const linksHtml = [
      pm.website ? `<a href="${esc(pm.website)}" target="_blank">website</a>` : '',
      pm.twitter ? `<a href="${esc(pm.twitter)}" target="_blank">twitter</a>` : ''
    ].filter(Boolean).join('');

    const toolsSection = allTools.length
      ? `<div class="t-detail-section">
           <div class="t-detail-h">tools · ${allTools.length}</div>
           <div class="t-dt-inline">${toolsHtml}</div>
         </div>`
      : '';

    const detailHtml = `
  <tr class="t-detail" data-pm="${esc(pm.name)}">
    <td colspan="6">
      <div class="t-detail-inner">
        <div class="t-detail-about">
          <div class="t-detail-h">about</div>
          <p>${esc(pm.description || '')}</p>
          <div class="t-detail-links">${linksHtml}</div>
        </div>
        <div class="t-detail-toolchain">
          ${toolsSection}
        </div>
      </div>
    </td>
  </tr>
`;
    html += rowHtml + detailHtml;
  });
  document.getElementById('tableBody').innerHTML = html;

  // Expand/collapse detail rows
  document.querySelectorAll('#tableBody .t-row').forEach(row => {
    row.addEventListener('click', () => {
      const isOpen = row.classList.toggle('expanded');
      const detail = row.nextElementSibling;
      if (detail && detail.classList.contains('t-detail')) {
        detail.classList.toggle('open', isOpen);
      }
      row.querySelector('.t-chev').textContent = isOpen ? '▼' : '▶';
      const rState = Router.currentState();
      rState.pm = isOpen ? Router.slug(row.dataset.pm) : null;
      Router.write(rState);
    });
  });

  // Event listeners
  bindEvents();
}

function bindEvents() {
  // Category filters
  document.querySelectorAll('#catFilters .t-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const c = btn.dataset.cat;
      state.catFilter = c || null;
      render();
      Router.push();
    });
  });

  // Tool filters
  document.querySelectorAll('#toolFilters .t-chip').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.dataset.tool;
      state.toolFilter = state.toolFilter === t ? null : t;
      render();
      Router.push();
    });
  });

  // Search
  const searchBox = document.getElementById('searchBox');
  if (searchBox) {
    searchBox.value = state.searchQ;
    searchBox.addEventListener('input', e => {
      state.searchQ = e.target.value;
      render();
      Router.push();
    });
  }
}
