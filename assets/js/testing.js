// assets/js/testing.js

import { state } from './state.js';
import { esc, gradeClass, toolTypeGlyphClass, toolTypeGlyphLabel } from './helpers.js';
import {
  TEST_COLS,
  TOOL_COL_MAP,
  TOOL_STAGES,
  UNIFIED_CHECKS,
  UNIFIED_SECTIONS,
  UNIFIED_SECTION_LABELS,
  SKILL_MILESTONES,
  AA_DIMS,
  AA_TOTAL_CHECKS,
  FRAMEWORK_CATEGORIES,
  FRAMEWORK_MATURITY
} from './constants.js';

// === Unified check-list primitive ============================
// Data drives UI; tokens do the theming. Zero inline styles.
const STATUS_CLASS = {
  PASS:    'is-pass',
  PARTIAL: 'is-partial',
  FAIL:    'is-fail',
  BLOCKED: 'is-blocked'
};
const STATUS_ICON = { PASS: '✓', PARTIAL: '●', FAIL: '✗', BLOCKED: '▪' };

// items: [{ label, status?, detail? }]   // num is ignored (was never useful to readers)
function renderItems(items, twoCol = false) {
  const cls = twoCol ? 'm-items m-items--two-col' : 'm-items';
  return `<ul class="${cls}">` + items.map(it => {
    const sc = STATUS_CLASS[it.status] || 'is-na';
    const ic = STATUS_ICON[it.status]  || '○';
    const det = it.detail ? `<span class="m-why">${esc(it.detail)}</span>` : '';
    return `<li class="m-item ${sc}"><span class="m-ico">${ic}</span><span class="m-label">${esc(it.label)}${det}</span></li>`;
  }).join('') + `</ul>`;
}

// groups: [{ title, items, twoCol? }]
// asGrid: lay the groups themselves out in a 2-column grid (good for
// AA / CLI tabs that have 4+ groups and would otherwise be a long column).
function renderGroups(groups, asGrid = false) {
  const listCls = asGrid ? 'm-list m-list-grid' : 'm-list';
  return `<ul class="${listCls}">` + groups.map(g =>
    `<li class="m-group"><div class="m-group-label">${esc(g.title)}</div>${renderItems(g.items, g.twoCol)}</li>`
  ).join('') + `</ul>`;
}

function renderMeta(pills) {
  const nonEmpty = pills.filter(Boolean);
  if (!nonEmpty.length) return '';
  return `<ul class="m-meta">${nonEmpty.map(p => `<li>${esc(p)}</li>`).join('')}</ul>`;
}

function renderFindings(title, items, tone /* 'info' | 'red' */) {
  if (!items || !items.length) return '';
  return `<div class="m-findings m-findings-${tone}">
    <div class="m-findings-h">${esc(title)}</div>
    <ul>${items.map(i => `<li>${esc(i)}</li>`).join('')}</ul>
  </div>`;
}

// === Methodology overview panel =============================
// Rendered once per view entry, into #testMethodology.
// Uses the same renderGroups primitive so per-check rationales live
// inline under a Show details toggle.
function renderMethodologyPanel() {
  const host = document.getElementById('testMethodology');
  if (!host || host.children.length) return;

  const aaGroups = AA_DIMS.map(dim => ({
    title: dim.label,
    items: dim.checks.map(c => ({ num: c.id, label: c.label, detail: c.why }))
  }));
  const cliGroups = UNIFIED_SECTIONS.map(sec => ({
    title: UNIFIED_SECTION_LABELS[sec],
    items: UNIFIED_CHECKS[sec].map(c => ({ num: c.id, label: c.name, detail: c.why }))
  }));
  const skillGroups = [{
    title: 'Trade Cycle Milestones',
    items: SKILL_MILESTONES.map(m => ({ num: m.id, label: m.name, detail: m.why })),
    twoCol: true
  }];
  const fwGroups = [{
    title: 'Assessment Categories',
    items: FRAMEWORK_CATEGORIES.map(c => ({ num: c.num, label: c.name, detail: c.why }))
  }, {
    title: 'Maturity Scale',
    items: FRAMEWORK_MATURITY.map(m => ({ label: m.grade, detail: m.why }))
  }];

  const gradeScale = (scale) => scale.map(s => `<span class="t-grade t-grade-${s.cls}">${s.g}</span> ${s.r}`).join(' · ');
  const aaScale    = gradeScale([{cls:'a',g:'A',r:'13–15'},{cls:'b',g:'B',r:'10–12'},{cls:'c',g:'C',r:'7–9'},{cls:'d',g:'D',r:'4–6'},{cls:'f',g:'F',r:'0–3'}]);
  const cliScale   = gradeScale([{cls:'a',g:'A',r:'16–18'},{cls:'b',g:'B',r:'13–15'},{cls:'c',g:'C',r:'9–12'},{cls:'d',g:'D',r:'5–8'},{cls:'f',g:'F',r:'0–4'}]);
  const skillScale = gradeScale([{cls:'a',g:'A',r:'7–8'},{cls:'b',g:'B',r:'5–6'},{cls:'c',g:'C',r:'3–4'},{cls:'d',g:'D',r:'1–2'},{cls:'f',g:'F',r:'0'}]);
  const fwBadgeMap = {Production:'fwprod', Usable:'fwusable', Experimental:'fwexp', 'N/A':'na'};
  const fwScale = FRAMEWORK_MATURITY.map(m => `<span class="t-grade t-grade-${fwBadgeMap[m.grade]}">${esc(m.grade)}</span>`).join(' · ');

  host.innerHTML = `
    <details class="t-methodology">
      <summary class="t-methodology-summary">
        <span class="t-methodology-chev mono">▸</span>
        <span class="t-methodology-title mono">// testing methodology</span>
        <span class="t-methodology-meta mono">15 accessibility · 18 cli/mcp · 8 skill · 5 framework</span>
      </summary>
      <div class="t-methodology-body">
        <section class="t-methodology-section">
          <div class="t-detail-h">agent accessibility</div>
          <p class="t-methodology-lede">Can an AI agent discover, read, and understand this PM's website without a browser? 15 checks across 4 dimensions. Automated via curl/fetch (no browser).</p>
          ${renderGroups(aaGroups)}
          <button class="m-show-more" data-show-more>Show details</button>
          <div class="t-methodology-scale">${aaScale}</div>
        </section>
        <section class="t-methodology-section">
          <div class="t-detail-h">cli / mcp test</div>
          <p class="t-methodology-lede">Can an AI agent use this CLI/MCP tool to trade autonomously? 18 checks across 4 sections. Real trades with ~$1–2.</p>
          ${renderGroups(cliGroups)}
          <button class="m-show-more" data-show-more>Show details</button>
          <div class="t-methodology-scale">${cliScale}</div>
        </section>
        <section class="t-methodology-section">
          <div class="t-detail-h">skill test</div>
          <p class="t-methodology-lede">Can an AI agent complete a full trade cycle using only a SKILL.md file and wallet credentials? 8 milestones, real trades with ~$1.</p>
          ${renderGroups(skillGroups)}
          <button class="m-show-more" data-show-more>Show details</button>
          <div class="t-methodology-scale">${skillScale}</div>
        </section>
        <section class="t-methodology-section">
          <div class="t-detail-h">framework assessment</div>
          <p class="t-methodology-lede">How mature is this agentic framework? 5 categories rated on a maturity scale, not a numeric score.</p>
          ${renderGroups(fwGroups)}
          <button class="m-show-more" data-show-more>Show details</button>
          <div class="t-methodology-scale">${fwScale}</div>
        </section>
      </div>
    </details>
  `;

  host.querySelectorAll('[data-show-more]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const section = btn.closest('.t-methodology-section');
      if (!section) return;
      section.querySelectorAll('.m-why').forEach(el => el.classList.toggle('visible'));
      btn.textContent = btn.textContent === 'Show details' ? 'Hide details' : 'Show details';
    });
  });
}

export function getTestablePMs() {
  return window.DATA.filter(pm =>
    (pm.category === 'Decentralized' || pm.category === 'Play Money') &&
    (pm.coreTools.length > 0 || pm.aiTools.length > 0)
  );
}

export function pmToolsByCol(pm) {
  const cols = {};
  TEST_COLS.forEach(c => cols[c.key] = []);
  [...pm.coreTools, ...pm.aiTools].forEach(tool => {
    const colKey = TOOL_COL_MAP[tool.type];
    if (colKey) cols[colKey].push(tool);
  });
  return cols;
}

export function renderTesting() {
  const AA_RESULTS = window.AA_RESULTS;
  const TEST_RESULTS = window.TEST_RESULTS;
  renderMethodologyPanel();
  const pms = getTestablePMs();

  const tcats = ['Decentralized', 'Play Money'];
  document.getElementById('testCatFilters').innerHTML =
    `<button class="t-chip${state.testCatFilter === null ? ' active' : ''}" data-tcat="">all</button>` +
    tcats.map(c => `<button class="t-chip${state.testCatFilter === c ? ' active' : ''}" data-tcat="${c}">${c.toLowerCase()}</button>`).join('');
  document.getElementById('testHasFilters').innerHTML = [
    { key: 'aa', label: 'has agent access' },
    { key: 'cli', label: 'has cli/mcp' },
    { key: 'skill', label: 'has skill' },
  ].map(t => `<button class="t-chip${state.testHasFilter === t.key ? ' active' : ''}" data-thas="${t.key}">${t.label}</button>`).join('');
  const tsb = document.getElementById('testSearchBox');
  if (tsb) tsb.value = state.testSearchQ;

  document.querySelectorAll('#testCatFilters .t-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.testCatFilter = chip.dataset.tcat || null;
      renderTesting();
    });
  });
  document.querySelectorAll('#testHasFilters .t-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      state.testHasFilter = (state.testHasFilter === chip.dataset.thas) ? null : chip.dataset.thas;
      renderTesting();
    });
  });
  document.getElementById('testSearchBox').addEventListener('input', e => {
    state.testSearchQ = e.target.value;
    renderTesting();
  });

  let displayed = pms;
  if (state.testCatFilter) displayed = displayed.filter(p => p.category === state.testCatFilter);
  if (state.testHasFilter === 'aa') displayed = displayed.filter(p => AA_RESULTS[p.name]);
  if (state.testHasFilter === 'cli') displayed = displayed.filter(p => (TEST_RESULTS[p.name]||{}).cliMcp);
  if (state.testHasFilter === 'skill') displayed = displayed.filter(p => (TEST_RESULTS[p.name]||{}).skill);
  if (state.testSearchQ) {
    const q = state.testSearchQ.toLowerCase();
    displayed = displayed.filter(p => p.name.toLowerCase().includes(q) || (p.chain || '').toLowerCase().includes(q));
  }

  const total = pms.length;

  document.getElementById('testResultsCount').textContent = `${total} decentralized & play-money PMs with dev tools`;

  // Table head
  document.getElementById('testTableHead').innerHTML = `
  <tr>
    <th style="width:22px"></th>
    <th class="sortable" data-tsort="name">Market</th>
    <th class="sortable" data-tsort="category">Category</th>
    <th class="num sortable" data-tsort="devcount">Dev tools</th>
    <th class="sortable" data-tsort="aa">Agent Access</th>
    <th class="sortable" data-tsort="cli">CLI / MCP</th>
    <th class="sortable" data-tsort="skill">Skill</th>
    <th class="sortable" data-tsort="framework">Framework</th>
  </tr>
`;

  // Table body
  let bodyHtml = '';
  displayed.forEach((pm, i) => {
    const res = TEST_RESULTS[pm.name] || {};
    const aaRes = AA_RESULTS[pm.name];
    const devToolCount = pm.coreTools.length;

    const initial = (pm.name[0] || '?').toUpperCase();
    const catClass = pm.category === 'Decentralized' ? 't-cat-dec'
                   : pm.category === 'Regulated/CeFi' ? 't-cat-cefi'
                   : 't-cat-play';

    const aaCell = aaRes
      ? `<span class="${gradeClass(aaRes.grade)}">${aaRes.grade}</span><span class="t-cell-tools">${aaRes.score}/${AA_TOTAL_CHECKS}</span>`
      : `<span class="${gradeClass(null)}">untested</span>`;
    const tcell = key => {
      const r = res[key];
      if (!r || !r.grade) return `<span class="${gradeClass(null)}">—</span>`;
      return `<span class="${gradeClass(r.grade)}">${r.grade}</span>`;
    };

    bodyHtml += `
  <tr class="t-row" data-pm="${esc(pm.name)}">
    <td class="t-chev">▶</td>
    <td>
      <div class="t-pm">
        <div class="t-pm-glyph">${initial}</div>
        <div>
          <div class="t-pm-name">${esc(pm.name)}</div>
          <div class="t-pm-meta">${esc((pm.website || '').replace(/^https?:\/\//, '').replace(/\/$/, ''))}</div>
        </div>
      </div>
    </td>
    <td data-label="category"><span class="t-cat ${catClass}">${esc(pm.category)}</span></td>
    <td class="t-vol" data-label="dev tools">${devToolCount}</td>
    <td data-label="agent access"><span class="t-cell">${aaCell}</span></td>
    <td data-label="cli / mcp">${tcell('cliMcp')}</td>
    <td data-label="skill">${tcell('skill')}</td>
    <td data-label="framework">${tcell('framework')}</td>
  </tr>
`;

    // Detail row
    bodyHtml += `<tr class="t-detail" data-pm="${esc(pm.name)}"><td colspan="8"><div class="t-detail-inner" style="grid-template-columns: 1fr;">`;

    // Dev + agent tool sections using the same template as Landscape
    const tToolLinks = (t) => {
      const links = [];
      if (t.docsUrl) links.push(`<a href="${esc(t.docsUrl)}" target="_blank" onclick="event.stopPropagation()">docs</a>`);
      if (Array.isArray(t.docsUrls)) t.docsUrls.forEach(u => { if (u) links.push(`<a href="${esc(u)}" target="_blank" onclick="event.stopPropagation()">docs</a>`); });
      if (t.githubUrl) links.push(`<a href="${esc(t.githubUrl)}" target="_blank" onclick="event.stopPropagation()">github</a>`);
      if (Array.isArray(t.githubUrls)) t.githubUrls.forEach(u => { if (u) links.push(`<a href="${esc(u)}" target="_blank" onclick="event.stopPropagation()">github</a>`); });
      if (t.npmUrl) links.push(`<a href="${esc(t.npmUrl)}" target="_blank" onclick="event.stopPropagation()">npm</a>`);
      return links.length ? `<div class="t-dt-links">${links.join('')}</div>` : '';
    };
    const tPrimaryUrl = (t) => {
      if (t.docsUrl) return t.docsUrl;
      if (Array.isArray(t.docsUrls) && t.docsUrls[0]) return t.docsUrls[0];
      if (t.githubUrl) return t.githubUrl;
      if (Array.isArray(t.githubUrls) && t.githubUrls[0]) return t.githubUrls[0];
      if (t.npmUrl) return t.npmUrl;
      return null;
    };
    const tRenderToolRow = (t) => {
      const url = tPrimaryUrl(t);
      const nameEl = url
        ? `<a class="t-dt-name" href="${esc(url)}" target="_blank" onclick="event.stopPropagation()">${esc(t.name)}</a>`
        : `<span class="t-dt-name">${esc(t.name)}</span>`;
      const tipAttr = t.description ? ` title="${esc(t.description)}"` : '';
      return `<li class="t-dt-row"${tipAttr}>
        <span class="${toolTypeGlyphClass(t.type)}">${esc(toolTypeGlyphLabel(t.type))}</span>
        ${nameEl}
        ${tToolLinks(t)}
      </li>`;
    };
    const tAllTools = [...pm.coreTools, ...pm.aiTools];
    if (tAllTools.length) {
      bodyHtml += `<div class="t-detail-section">
        <div class="t-detail-h">tools · ${tAllTools.length}</div>
        <ul class="t-dt-list">${tAllTools.map(tRenderToolRow).join('')}</ul>
      </div>`;
    }

    // Tabbed test results
    const toolTests = res._tools || [];
    const skillTests = res._skillTools || [];
    const fwTests = res._frameworkTools || [];
    const hasAA = !!aaRes;
    const hasCli = toolTests.length > 0;
    const hasSkill = skillTests.length > 0;
    const hasFw = fwTests.length > 0;

    if (hasAA || hasCli || hasSkill || hasFw) {
      const uid = 'dt' + i;
      const firstTab = hasAA ? 'aa' : hasCli ? 'cli' : hasSkill ? 'skill' : 'fw';

      // --- panel header helper ---
      const head = (gradeBadgeHtml, name, scoreText) => `
        <div class="m-head">${gradeBadgeHtml}<span class="m-head-name">${esc(name)}</span>${scoreText ? `<span class="m-head-score">${esc(scoreText)}</span>` : ''}</div>`;

      const tabs = `<div class="m-tabs" data-testing-tabs>
        ${hasAA ? `<button class="m-tab${firstTab==='aa'?' active':''}" data-panel="${uid}-aa">Agent Accessibility</button>` : ''}
        ${hasCli ? `<button class="m-tab${firstTab==='cli'?' active':''}" data-panel="${uid}-cli">CLI/MCP Test</button>` : ''}
        ${hasSkill ? `<button class="m-tab${firstTab==='skill'?' active':''}" data-panel="${uid}-skill">Skill Test</button>` : ''}
        ${hasFw ? `<button class="m-tab${firstTab==='fw'?' active':''}" data-panel="${uid}-fw">Framework</button>` : ''}
      </div>`;

      bodyHtml += `<div class="methodology">${tabs}<div id="${uid}-panels">`;

      // === AA tab ===
      if (hasAA) {
        const groups = AA_DIMS.map(dim => ({
          title: dim.label,
          items: dim.checks.map(chk => {
            const r = aaRes.checks[chk.id];
            return {
              num: chk.id,
              label: chk.label,
              status: (r && r.pass) ? 'PASS' : 'FAIL',
              detail: r && r.note
            };
          })
        }));
        bodyHtml += `<div class="methodology-content${firstTab==='aa'?' open':''}" id="${uid}-aa">
          ${head(`<span class="${gradeClass(aaRes.grade)}">${aaRes.grade}</span>`, 'Agent Accessibility', `${aaRes.score}/${AA_TOTAL_CHECKS} checks passed`)}
          ${renderGroups(groups, true)}
          <button class="m-show-more" data-show-more>Show details</button>
        </div>`;
      }

      // === CLI/MCP tab ===
      if (hasCli) {
        bodyHtml += `<div class="methodology-content${firstTab==='cli'?' open':''}" id="${uid}-cli">`;

        const hasSubTabs = toolTests.length > 1;
        if (hasSubTabs) {
          bodyHtml += `<div class="m-tabs m-tabs-sub" data-sub-tabs="${uid}">`;
          toolTests.forEach((tt, ti) => {
            bodyHtml += `<button class="m-tab${ti===0?' active':''}" data-sub-panel="${uid}-st-${ti}">${esc(tt.type)}: ${esc(tt.tool)}</button>`;
          });
          bodyHtml += `</div>`;
        }

        toolTests.forEach((tt, ti) => {
          if (hasSubTabs) bodyHtml += `<div class="m-sub-panel" id="${uid}-st-${ti}" style="${ti>0?'display:none':''}">`;

          const pills = [
            tt.version ? 'v' + tt.version : '',
            tt.chain,
            tt.currency,
            tt.auth ? 'Auth: ' + tt.auth : '',
            tt.outputQuality ? 'Output: ' + tt.outputQuality : '',
            tt.installCmd ? 'Install: ' + tt.installCmd : ''
          ];

          let groups = [];
          if (tt.sections) {
            groups = UNIFIED_SECTIONS.map(sec => {
              const sData = tt.sections[sec];
              if (!sData || !sData.checks) return null;
              return {
                title: UNIFIED_SECTION_LABELS[sec],
                items: Object.values(sData.checks).map(chk => ({
                  label: chk.name,
                  status: chk.status || chk.result || null,
                  detail: chk.evidence || chk.output || chk.notes
                }))
              };
            }).filter(Boolean);
          } else if (tt.stages) {
            groups = TOOL_STAGES.map(stg => {
              const s = tt.stages[stg.id];
              if (!s) return null;
              const items = [];
              if (s.blockedReason) items.push({ label: 'Blocked', status: 'BLOCKED', detail: s.blockedReason });
              if (s.actions) {
                Object.entries(s.actions).forEach(([name, act]) => {
                  items.push({ label: name, status: act.status, detail: act.note });
                });
              }
              return { title: stg.label, items };
            }).filter(Boolean);
          }

          bodyHtml += head(`<span class="${gradeClass(tt.grade)}">${tt.grade}</span>`, tt.tool, tt.type);
          bodyHtml += renderMeta(pills);
          bodyHtml += renderGroups(groups, true);
          bodyHtml += `<button class="m-show-more" data-show-more>Show details</button>`;
          bodyHtml += renderFindings('Key findings', tt.keyFindings, 'info');
          bodyHtml += renderFindings('Blockers', tt.blockers, 'red');

          if (hasSubTabs) bodyHtml += `</div>`;
        });

        bodyHtml += `</div>`;
      }

      // === Skill tab ===
      if (hasSkill) {
        bodyHtml += `<div class="methodology-content${firstTab==='skill'?' open':''}" id="${uid}-skill">`;
        skillTests.forEach(st => {
          const pills = [
            st.skillFormat ? 'Format: ' + st.skillFormat : '',
            st.chain,
            st.currency,
            st.vpnRequired ? 'VPN required' : '',
            st.methodUsed ? 'Method: ' + st.methodUsed : ''
          ];
          const passed = st.milestones ? Object.values(st.milestones).filter(m => m.status === 'PASS').length : 0;
          const groups = [{
            title: 'Trade Cycle Milestones',
            twoCol: true,
            items: SKILL_MILESTONES.map(sm => {
              const m = (st.milestones || {})[sm.id] || {};
              return { num: sm.id, label: sm.name, status: m.status || null, detail: m.summary };
            })
          }];

          bodyHtml += head(`<span class="${gradeClass(st.grade)}">${st.grade}</span>`, st.skill, `${passed}/8 passed`);
          bodyHtml += renderMeta(pills);
          bodyHtml += renderGroups(groups);
          bodyHtml += `<button class="m-show-more" data-show-more>Show details</button>`;
          bodyHtml += renderFindings('Key findings', st.keyFindings, 'info');
          bodyHtml += renderFindings('Blockers', st.blockers, 'red');
        });
        bodyHtml += `</div>`;
      }

      // === Framework tab ===
      if (hasFw) {
        bodyHtml += `<div class="methodology-content${firstTab==='fw'?' open':''}" id="${uid}-fw">`;
        const categoryLabels = { type:'Type', architecture:'Architecture', stack:'Stack', platforms:'Platform Support', setup:'Setup Complexity' };
        fwTests.forEach(fw => {
          const items = fw.categories
            ? Object.entries(fw.categories).map(([k, v]) => ({ label: categoryLabels[k] || k, detail: v }))
            : [];
          const groups = items.length ? [{ title: 'Assessment', items }] : [];

          bodyHtml += head(`<span class="${gradeClass(fw.grade)}">${esc(fw.grade)}</span>`, fw.name, 'Framework');
          if (groups.length) bodyHtml += renderGroups(groups);
          if (items.length) bodyHtml += `<button class="m-show-more" data-show-more>Show details</button>`;
          bodyHtml += renderFindings('Key findings', fw.keyFindings, 'info');
        });
        bodyHtml += `</div>`;
      }

      bodyHtml += `</div></div>`;
    }

    bodyHtml += `</div></td></tr>`;
  });
  document.getElementById('testTableBody').innerHTML = bodyHtml;

  // Bind expand/collapse
  document.querySelectorAll('#testTableBody .t-row').forEach(row => {
    row.addEventListener('click', () => {
      const isOpen = row.classList.toggle('expanded');
      const detail = row.nextElementSibling;
      if (detail && detail.classList.contains('t-detail')) {
        detail.classList.toggle('open', isOpen);
      }
      row.querySelector('.t-chev').textContent = isOpen ? '▼' : '▶';
    });
  });

  // Bind methodology tab switching (top-level tabs inside each PM detail)
  document.querySelectorAll('#testTableBody [data-testing-tabs] .m-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const tabs = btn.closest('[data-testing-tabs]');
      const panels = tabs.nextElementSibling; // #<uid>-panels
      tabs.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      panels.querySelectorAll(':scope > .methodology-content').forEach(c => c.classList.remove('open'));
      const target = panels.querySelector('#' + btn.dataset.panel);
      if (target) target.classList.add('open');
    });
  });

  // Bind sub-tab switching (for CLI/MCP PMs with multiple tested tools)
  document.querySelectorAll('#testTableBody [data-sub-tabs] .m-tab').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const bar = btn.closest('[data-sub-tabs]');
      const container = bar.parentElement; // the methodology-content for cli
      bar.querySelectorAll('.m-tab').forEach(t => t.classList.remove('active'));
      btn.classList.add('active');
      container.querySelectorAll(':scope > .m-sub-panel').forEach(p => { p.style.display = 'none'; });
      const target = container.querySelector('#' + btn.dataset.subPanel);
      if (target) target.style.display = 'block';
    });
  });

  // Bind show-details toggle
  document.querySelectorAll('#testTableBody [data-show-more]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const scope = btn.closest('.methodology-content') || btn.closest('.m-sub-panel');
      if (!scope) return;
      scope.querySelectorAll('.m-why').forEach(el => el.classList.toggle('visible'));
      btn.textContent = btn.textContent === 'Show details' ? 'Hide details' : 'Show details';
    });
  });
}
