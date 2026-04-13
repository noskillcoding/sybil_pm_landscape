// assets/js/testing.js

import { state } from './state.js';
import { esc, gradeClass, toolTypeBadgeClass } from './helpers.js';
import {
  TEST_COLS,
  TOOL_COL_MAP,
  TOOL_STAGES,
  UNIFIED_SECTIONS,
  UNIFIED_SECTION_LABELS,
  SKILL_MILESTONES,
  AA_DIMS,
  AA_TOTAL_CHECKS
} from './constants.js';

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
    const tRenderToolCard = (t) => `
  <div class="t-detail-tool">
    <div class="t-dt-type">${esc((t.type || '').toLowerCase())}</div>
    <div class="t-dt-name">${esc(t.name)}</div>
    <div class="t-dt-desc">${esc(t.description || '')}</div>
    ${tToolLinks(t)}
  </div>
`;
    if (pm.coreTools.length) {
      bodyHtml += `<div class="t-detail-section">
        <div class="t-detail-h">dev tools · ${pm.coreTools.length}</div>
        <div class="t-detail-tools-grid">${pm.coreTools.map(tRenderToolCard).join('')}</div>
      </div>`;
    }
    if (pm.aiTools.length) {
      bodyHtml += `<div class="t-detail-section">
        <div class="t-detail-h">agent tools · ${pm.aiTools.length}</div>
        <div class="t-detail-tools-grid">${pm.aiTools.map(tRenderToolCard).join('')}</div>
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
      const tabClick = `document.querySelectorAll('#${uid}-tabs .m-tab').forEach(t=>t.classList.remove('active'));this.classList.add('active');document.querySelectorAll('#${uid}-panels .methodology-content').forEach(c=>c.classList.remove('open'));`;
      bodyHtml += `<div class="methodology" style="margin-top:16px; border-top:1px solid #30363d; padding-top:16px;">`;
      bodyHtml += `<div class="m-tabs" id="${uid}-tabs">`;
      if (hasAA) bodyHtml += `<button class="m-tab${firstTab==='aa'?' active':''}" onclick="${tabClick}document.getElementById('${uid}-aa').classList.add('open')">Agent Accessibility</button>`;
      if (hasCli) bodyHtml += `<button class="m-tab${firstTab==='cli'?' active':''}" onclick="${tabClick}document.getElementById('${uid}-cli').classList.add('open')">CLI/MCP Test</button>`;
      if (hasSkill) bodyHtml += `<button class="m-tab${firstTab==='skill'?' active':''}" onclick="${tabClick}document.getElementById('${uid}-skill').classList.add('open')">Skill Test</button>`;
      if (hasFw) bodyHtml += `<button class="m-tab${firstTab==='fw'?' active':''}" onclick="${tabClick}document.getElementById('${uid}-fw').classList.add('open')">Framework</button>`;
      bodyHtml += `</div>`;
      bodyHtml += `<div id="${uid}-panels">`;

      // === AA TAB ===
      if (hasAA) {
        bodyHtml += `<div class="methodology-content${firstTab==='aa'?' open':''}" id="${uid}-aa">`;
        bodyHtml += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;"><span class="test-badge grade-${aaRes.grade.toLowerCase()}">${aaRes.grade}</span><span style="font-size:12px; color:#8b949e;">${aaRes.score}/${AA_TOTAL_CHECKS} checks passed</span></div>`;
        bodyHtml += `<div class="m-checks-list">`;
        AA_DIMS.forEach(dim => {
          bodyHtml += `<div class="m-dim-block"><div class="m-dim-label">${dim.label}</div>`;
          dim.checks.forEach(chk => {
            const r = aaRes.checks[chk.id];
            const pass = r && r.pass;
            const col = pass ? '#3fb950' : '#f85149';
            const icon = pass ? '&#10003;' : '&#10007;';
            bodyHtml += `<div class="m-check-item"><span class="m-check-num" style="color:${col}">${icon}</span><span class="m-check-name">${esc(chk.label)}</span>`;
            if (r && r.note) bodyHtml += `<span class="m-check-why">${esc(r.note)}</span>`;
            bodyHtml += `</div>`;
          });
          bodyHtml += `</div>`;
        });
        bodyHtml += `</div>`;
        bodyHtml += `<button class="m-show-more" onclick="this.closest('.methodology-content').querySelectorAll('.m-check-why').forEach(e=>e.classList.toggle('visible'));this.textContent=this.textContent==='Show details'?'Hide details':'Show details'">Show details</button>`;
        bodyHtml += `</div>`;
      }

      // === CLI/MCP TEST TAB ===
      if (hasCli) {
        bodyHtml += `<div class="methodology-content${firstTab==='cli'?' open':''}" id="${uid}-cli">`;
        if (toolTests.length > 1) {
          const stid = uid + '-st';
          bodyHtml += `<div style="display:flex; gap:4px; margin-bottom:12px;">`;
          toolTests.forEach((tt, ti) => {
            bodyHtml += `<button style="background:${ti===0?'#1f6feb':'#21262d'}; color:${ti===0?'#fff':'#8b949e'}; border:1px solid ${ti===0?'#1f6feb':'#30363d'}; padding:3px 10px; border-radius:4px; font-size:11px; cursor:pointer;" onclick="document.querySelectorAll('.${stid}-panel').forEach(p=>p.style.display='none');document.getElementById('${stid}-${ti}').style.display='block';this.parentNode.querySelectorAll('button').forEach(b=>{b.style.background='#21262d';b.style.color='#8b949e';b.style.borderColor='#30363d'});this.style.background='#1f6feb';this.style.color='#fff';this.style.borderColor='#1f6feb'">${esc(tt.type)}: ${esc(tt.tool)}</button>`;
          });
          bodyHtml += `</div>`;
        }
        toolTests.forEach((tt, ti) => {
          if (toolTests.length > 1) bodyHtml += `<div class="${uid}-st-panel" id="${uid}-st-${ti}" style="${ti>0?'display:none':''}">`;
          const gClass = 'grade-' + tt.grade.toLowerCase();
          const statusColor = {PASS:'#3fb950',PARTIAL:'#d29922',FAIL:'#f85149',BLOCKED:'#6e7681'};
          const statusIcon = {PASS:'&#10003;',PARTIAL:'&#9679;',FAIL:'&#10007;',BLOCKED:'&#9644;'};
          bodyHtml += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">`;
          bodyHtml += `<span class="test-badge ${gClass}">${tt.grade}</span>`;
          bodyHtml += `<span style="font-weight:600; color:#e6edf3; font-size:13px;">${esc(tt.tool)}</span>`;
          bodyHtml += `<span class="tool-type-badge ${toolTypeBadgeClass(tt.type)}">${esc(tt.type)}</span>`;
          bodyHtml += `</div>`;
          bodyHtml += `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; font-size:11px; color:#8b949e;">`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">v${esc(tt.version)}</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">${esc(tt.chain)}</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">${esc(tt.currency)}</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">Auth: ${esc(tt.auth)}</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">Output: ${esc(tt.outputQuality)}</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">Install: ${esc(tt.installCmd)}</span>`;
          bodyHtml += `</div>`;
          if (tt.sections) {
            bodyHtml += `<div class="m-checks-list">`;
            UNIFIED_SECTIONS.forEach(sec => {
              const sData = tt.sections[sec];
              if (!sData || !sData.checks) return;
              bodyHtml += `<div class="m-dim-block"><div class="m-dim-label">${UNIFIED_SECTION_LABELS[sec]}</div>`;
              Object.values(sData.checks).forEach(chk => {
                const st = chk.status || chk.result || '—';
                const col = statusColor[st] || '#6e7681';
                const icon = statusIcon[st] || '&#9675;';
                bodyHtml += `<div class="m-check-item"><span class="m-check-num" style="color:${col}">${icon}</span><span class="m-check-name">${esc(chk.name)}</span>`;
                const ev = chk.evidence || chk.output || chk.notes || '';
                if (ev) bodyHtml += `<span class="m-check-why">${esc(ev)}</span>`;
                bodyHtml += `</div>`;
              });
              bodyHtml += `</div>`;
            });
            bodyHtml += `</div>`;
          }
          else if (tt.stages) {
            bodyHtml += `<div class="m-checks-list">`;
            TOOL_STAGES.forEach(stg => {
              const s = tt.stages[stg.id];
              if (!s) return;
              const col = statusColor[s.status] || '#6e7681';
              bodyHtml += `<div class="m-dim-block">`;
              bodyHtml += `<div class="m-dim-label">${stg.label}</div>`;
              if (s.blockedReason) bodyHtml += `<div style="font-size:11px; color:#f85149; margin-bottom:4px; padding-left:8px;">Blocked: ${esc(s.blockedReason)}</div>`;
              if (s.actions) {
                Object.entries(s.actions).forEach(([name, act]) => {
                  const aC = statusColor[act.status] || '#6e7681';
                  const aI = statusIcon[act.status] || '&#9675;';
                  bodyHtml += `<div class="m-check-item"><span class="m-check-num" style="color:${aC}">${aI}</span><span class="m-check-name">${esc(name)}</span>`;
                  if (act.note) bodyHtml += `<span class="m-check-why">${esc(act.note)}</span>`;
                  bodyHtml += `</div>`;
                });
              }
              bodyHtml += `</div>`;
            });
            bodyHtml += `</div>`;
          }
          bodyHtml += `<button class="m-show-more" onclick="this.closest('.methodology-content').querySelectorAll('.m-check-why').forEach(e=>e.classList.toggle('visible'));this.textContent=this.textContent==='Show details'?'Hide details':'Show details'">Show details</button>`;
          if (tt.keyFindings && tt.keyFindings.length > 0) {
            bodyHtml += `<div style="margin-top:8px; padding-top:8px; border-top:1px solid #21262d;">`;
            bodyHtml += `<div style="font-size:11px; font-weight:600; color:#e6edf3; margin-bottom:4px;">Key Findings</div>`;
            tt.keyFindings.forEach(f => { bodyHtml += `<div style="font-size:11px; color:#8b949e; padding-left:8px;">&#8226; ${esc(f)}</div>`; });
            bodyHtml += `</div>`;
          }
          if (tt.blockers && tt.blockers.length > 0) {
            bodyHtml += `<div style="margin-top:6px;">`;
            bodyHtml += `<div style="font-size:11px; font-weight:600; color:#f85149; margin-bottom:4px;">Blockers</div>`;
            tt.blockers.forEach(b => { bodyHtml += `<div style="font-size:11px; color:#f8514988; padding-left:8px;">&#8226; ${esc(b)}</div>`; });
            bodyHtml += `</div>`;
          }
          if (toolTests.length > 1) bodyHtml += `</div>`;
        });
        bodyHtml += `</div>`;
      }

      // === SKILL TEST TAB ===
      if (hasSkill) {
        bodyHtml += `<div class="methodology-content${firstTab==='skill'?' open':''}" id="${uid}-skill">`;
        const statusColor = {PASS:'#3fb950',PARTIAL:'#d29922',FAIL:'#f85149',BLOCKED:'#6e7681'};
        const statusIcon = {PASS:'&#10003;',PARTIAL:'&#9679;',FAIL:'&#10007;',BLOCKED:'&#9644;'};
        skillTests.forEach(st => {
          const gClass = 'grade-' + st.grade.toLowerCase();
          bodyHtml += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">`;
          bodyHtml += `<span class="test-badge ${gClass}">${st.grade}</span>`;
          bodyHtml += `<span style="font-weight:600; color:#e6edf3; font-size:13px;">${esc(st.skill)}</span>`;
          bodyHtml += `<span class="tool-type-badge tool-type-skill">Skill</span>`;
          bodyHtml += `</div>`;
          bodyHtml += `<div style="display:flex; flex-wrap:wrap; gap:6px; margin-bottom:12px; font-size:11px; color:#8b949e;">`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">Format: ${esc(st.skillFormat)}</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">${esc(st.chain)}</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">${esc(st.currency)}</span>`;
          if (st.vpnRequired) bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">VPN required</span>`;
          bodyHtml += `<span style="background:#21262d; padding:2px 6px; border-radius:4px;">Method: ${esc(st.methodUsed)}</span>`;
          bodyHtml += `</div>`;
          if (st.milestones) {
            const passed = Object.values(st.milestones).filter(m => m.status === 'PASS').length;
            bodyHtml += `<div style="font-size:12px; color:#8b949e; margin-bottom:8px;">${passed}/8 milestones passed</div>`;
            bodyHtml += `<div class="m-checks-list"><div class="m-dim-block m-dim-block-wide"><div class="m-dim-label">Trade Cycle Milestones</div>`;
            bodyHtml += `<div style="display:grid; grid-template-columns:1fr 1fr; gap:0 24px;">`;
            const leftMs = SKILL_MILESTONES.slice(0,4);
            const rightMs = SKILL_MILESTONES.slice(4,8);
            bodyHtml += `<div>`;
            leftMs.forEach(sm => {
              const m = st.milestones[sm.id];
              if (!m) return;
              const col = statusColor[m.status] || '#6e7681';
              const icon = statusIcon[m.status] || '&#9675;';
              bodyHtml += `<div class="m-check-item"><span class="m-check-num" style="color:${col}">${icon}</span><span class="m-check-name">${esc(sm.name)}</span>`;
              if (m.summary) bodyHtml += `<span class="m-check-why">${esc(m.summary)}</span>`;
              bodyHtml += `</div>`;
            });
            bodyHtml += `</div><div>`;
            rightMs.forEach(sm => {
              const m = st.milestones[sm.id];
              if (!m) return;
              const col = statusColor[m.status] || '#6e7681';
              const icon = statusIcon[m.status] || '&#9675;';
              bodyHtml += `<div class="m-check-item"><span class="m-check-num" style="color:${col}">${icon}</span><span class="m-check-name">${esc(sm.name)}</span>`;
              if (m.summary) bodyHtml += `<span class="m-check-why">${esc(m.summary)}</span>`;
              bodyHtml += `</div>`;
            });
            bodyHtml += `</div></div></div></div>`;
          }
          bodyHtml += `<button class="m-show-more" onclick="this.closest('.methodology-content').querySelectorAll('.m-check-why').forEach(e=>e.classList.toggle('visible'));this.textContent=this.textContent==='Show details'?'Hide details':'Show details'">Show details</button>`;
          if (st.keyFindings && st.keyFindings.length > 0) {
            bodyHtml += `<div style="margin-top:8px; padding-top:8px; border-top:1px solid #21262d;">`;
            bodyHtml += `<div style="font-size:11px; font-weight:600; color:#e6edf3; margin-bottom:4px;">Key Findings</div>`;
            st.keyFindings.forEach(f => { bodyHtml += `<div style="font-size:11px; color:#8b949e; padding-left:8px;">&#8226; ${esc(f)}</div>`; });
            bodyHtml += `</div>`;
          }
          if (st.blockers && st.blockers.length > 0) {
            bodyHtml += `<div style="margin-top:6px;">`;
            bodyHtml += `<div style="font-size:11px; font-weight:600; color:#f85149; margin-bottom:4px;">Blockers</div>`;
            st.blockers.forEach(b => { bodyHtml += `<div style="font-size:11px; color:#f8514988; padding-left:8px;">&#8226; ${esc(b)}</div>`; });
            bodyHtml += `</div>`;
          }
        });
        bodyHtml += `</div>`;
      }

      // === FRAMEWORK TAB ===
      if (hasFw) {
        bodyHtml += `<div class="methodology-content${firstTab==='fw'?' open':''}" id="${uid}-fw">`;
        const fwGradeMap = {'Production':'fw-production','Usable':'fw-usable','Experimental':'fw-experimental','N/A':'fw-na'};
        const categoryLabels = {type:'Type',architecture:'Architecture',stack:'Stack',platforms:'Platform Support',setup:'Setup Complexity'};
        fwTests.forEach(fw => {
          const gClass = fwGradeMap[fw.grade] || 'untested';
          bodyHtml += `<div style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">`;
          bodyHtml += `<span class="test-badge ${gClass}">${esc(fw.grade)}</span>`;
          bodyHtml += `<span style="font-weight:600; color:#e6edf3; font-size:13px;">${esc(fw.name)}</span>`;
          bodyHtml += `<span class="tool-type-badge tool-type-framework">Framework</span>`;
          bodyHtml += `</div>`;
          if (fw.categories) {
            Object.entries(fw.categories).forEach(([key, val]) => {
              bodyHtml += `<div class="fw-category"><div class="fw-category-label">${esc(categoryLabels[key] || key)}</div><div class="fw-category-value">${esc(val)}</div></div>`;
            });
          }
          if (fw.keyFindings && fw.keyFindings.length > 0) {
            bodyHtml += `<div style="margin-top:8px; padding-top:8px; border-top:1px solid #21262d;">`;
            bodyHtml += `<div style="font-size:11px; font-weight:600; color:#e6edf3; margin-bottom:4px;">Key Findings</div>`;
            fw.keyFindings.forEach(f => { bodyHtml += `<div style="font-size:11px; color:#8b949e; padding-left:8px;">&#8226; ${esc(f)}</div>`; });
            bodyHtml += `</div>`;
          }
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
}
