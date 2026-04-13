// assets/js/ai-copy.js
//
// "Give it to your AI" clipboard button.
// Builds a compact plaintext summary of the 27-PM dataset + benchmark results
// and copies it to the clipboard. On click, a fresh AI chat can parse the blob
// and answer general questions, or fetch the linked JSON endpoints for specifics.

// Use the current origin so the clipboard blob works on localhost AND production
// without a swap — URLs resolve to whatever host the user is actually on.
const SITE_URL = (typeof window !== 'undefined' && window.location?.origin) || '';
const SITE_HOST = (typeof window !== 'undefined' && window.location?.host) || 'sybil-pm-landscape';

const PRIMING = `[Pasted from Sybil PM Landscape — ${SITE_HOST}]

Briefly tell the user what this data is and what you can help them explore, then wait for their question. You can fetch the JSON endpoints at the end to answer specific questions about any PM's grade, tools, or raw check results.`;

const GRADE_RANK = { A: 0, B: 1, C: 2, D: 3, F: 4 };

let _dataCache = null;

async function getData() {
  if (_dataCache) return _dataCache;
  if (window.DATA && window.AA_RESULTS && window.TEST_RESULTS) {
    _dataCache = { DATA: window.DATA, AA: window.AA_RESULTS, TESTS: window.TEST_RESULTS };
    return _dataCache;
  }
  const [DATA, AA, TESTS] = await Promise.all([
    fetch('./data/pms.json').then(r => r.json()),
    fetch('./data/accessibility.json').then(r => r.json()),
    fetch('./data/tests.json').then(r => r.json())
  ]);
  _dataCache = { DATA, AA, TESTS };
  return _dataCache;
}

function categoryCounts(pms) {
  const c = { Decentralized: 0, 'Regulated/CeFi': 0, 'Play Money': 0 };
  pms.forEach(p => { if (c[p.category] != null) c[p.category]++; });
  return c;
}

function distString(dist) {
  return ['A','B','C','D','F'].filter(g => dist[g]).map(g => `${g}×${dist[g]}`).join(' ') || '(none)';
}

function sortedByGrade(entries) {
  return [...entries].sort((a, b) => (GRADE_RANK[a.grade] ?? 9) - (GRADE_RANK[b.grade] ?? 9));
}

function buildClipboardText({ DATA, AA, TESTS }) {
  const pms = DATA || [];
  const aa = AA || {};
  const tests = (TESTS && TESTS.current) || {};

  // Agent Accessibility: sort by numeric score, top 3
  const aaEntries = Object.entries(aa)
    .filter(([, r]) => r && typeof r.score === 'number')
    .map(([name, r]) => ({ name, score: r.score, grade: r.grade }))
    .sort((a, b) => b.score - a.score);
  const aaDist = {};
  aaEntries.forEach(e => { aaDist[e.grade] = (aaDist[e.grade] || 0) + 1; });
  const aaTop = aaEntries.slice(0, 3).map(e => `${e.name} ${e.score}/15`).join(', ') || '(none)';

  // CLI/MCP
  const cliEntries = sortedByGrade(
    Object.entries(tests)
      .filter(([, r]) => r?.cliMcp?.grade)
      .map(([name, r]) => ({ name, grade: r.cliMcp.grade }))
  );
  const cliDist = {};
  cliEntries.forEach(e => { cliDist[e.grade] = (cliDist[e.grade] || 0) + 1; });
  const cliTop = cliEntries.slice(0, 3).map(e => `${e.name} ${e.grade}`).join(', ') || '(none)';

  // Skill
  const skEntries = sortedByGrade(
    Object.entries(tests)
      .filter(([, r]) => r?.skill?.grade)
      .map(([name, r]) => ({ name, grade: r.skill.grade }))
  );
  const skDist = {};
  skEntries.forEach(e => { skDist[e.grade] = (skDist[e.grade] || 0) + 1; });
  const skTop = skEntries.slice(0, 3).map(e => `${e.name} ${e.grade}`).join(', ') || '(none)';

  // Framework (maturity buckets, not numeric)
  const fwBuckets = { Production: [], Usable: [], Experimental: [], 'N/A': [] };
  Object.entries(tests).forEach(([name, r]) => {
    const g = r?.framework?.grade;
    if (fwBuckets[g]) fwBuckets[g].push(name);
  });
  const fwTestedCount = Object.values(fwBuckets).reduce((n, arr) => n + arr.length, 0);

  const cats = categoryCounts(pms);

  const lines = [
    PRIMING,
    '',
    '# Sybil PM Landscape',
    '',
    'Research dashboard benchmarking how accessible 27 prediction markets are to autonomous AI trading agents. Four independent benchmarks — agent accessibility, CLI/MCP, skill, and framework — all run by autonomous coding agents against every PM with a developer surface. Every test, score, and summary on this site was produced by autonomous coding agents.',
    '',
    '## Key Numbers',
    `- ${pms.length} PMs surveyed: ${cats.Decentralized} decentralized, ${cats['Regulated/CeFi']} regulated/CeFi, ${cats['Play Money']} play money`,
    '- 4 independent benchmarks: 15 agent-accessibility checks, 18 CLI/MCP checks, 8 skill-test milestones, 5 framework-assessment categories',
    '- April 2026 snapshot',
    '',
    '## Agent Accessibility',
    `Tested: ${aaEntries.length} PMs. Distribution: ${distString(aaDist)}`,
    `Top: ${aaTop}`,
    'Per-PM scores + check-by-check evidence: /data/accessibility.json',
    '',
    '## CLI/MCP Test',
    `Tested: ${cliEntries.length} PMs with a CLI/MCP developer surface. Distribution: ${distString(cliDist)}`,
    `Top: ${cliTop}`,
    'Per-PM results: /data/tests.json (current.<pm>.cliMcp + current.<pm>._tools)',
    '',
    '## Skill Test',
    `Tested: ${skEntries.length} PMs. Distribution: ${distString(skDist)}`,
    `Top: ${skTop}`,
    'Per-PM results: /data/tests.json (current.<pm>.skill + current.<pm>._skillTools)',
    '',
    '## Framework Assessment',
    `Tested: ${fwTestedCount} frameworks.`,
    `Production: ${fwBuckets.Production.join(', ') || '(none)'}`,
    `Usable: ${fwBuckets.Usable.join(', ') || '(none)'}`,
    `Experimental: ${fwBuckets.Experimental.join(', ') || '(none)'}`,
    'Per-PM results: /data/tests.json (current.<pm>.framework + current.<pm>._frameworkTools)',
    '',
    '## Explore Further',
    '',
    'All data is fetchable as static JSON — no API key, no CORS, no rate limits. Here is what lives in each file so you can fetch the right one on the first try:',
    '',
    `- ${SITE_URL}/data/pms.json — full 27-PM metadata. Each entry: name, category, chain, volume, website, twitter, description, coreTools[] (API / SDK / CLI / WebSocket), aiTools[] (MCP / Skill / Framework). Tool entries carry name, type, description, githubUrl / docsUrl / docsUrls[] / githubUrls[] / npmUrl. THIS IS WHERE MCP-SERVER, CLI-REPO, SDK, AND FRAMEWORK LINKS LIVE.`,
    `- ${SITE_URL}/data/accessibility.json — per-PM agent-accessibility grades, keyed by PM name. Each entry: { grade, score, checks: { "1.1": { pass, note }, "1.2": ..., ... } } covering all 15 checks across Discovery, Crawlability, Documentation, Access.`,
    `- ${SITE_URL}/data/tests.json — CLI/MCP, skill, framework benchmark results. Shape: { current: { "<pm-name>": { cliMcp: { grade, ... }, _tools: [per-tool runs], skill: { grade, ... }, _skillTools: [per-run], framework: { grade, ... }, _frameworkTools: [per-framework] } } }. The _tools / _skillTools / _frameworkTools arrays hold the 18 / 8 / 5 per-check results with evidence strings.`,
    `- ${SITE_URL}/llms.txt — same site summary served from the server (useful if you want to re-verify this blob is current).`,
    `- ${SITE_URL}/methodology/agent-accessibility.md, cli-mcp-test.md, skill-test.md, framework-assessment.md — full methodology docs explaining every check.`,
    '',
    'For deep per-PM questions: fetch /data/pms.json for tool links and metadata, /data/accessibility.json for check-by-check AA evidence, /data/tests.json for CLI/MCP/skill/framework run details.',
  ];

  return lines.join('\n');
}

let _toast;
function showToast(message) {
  if (!_toast) {
    _toast = document.createElement('div');
    _toast.className = 't-ai-toast mono';
    document.body.appendChild(_toast);
  }
  _toast.textContent = message;
  _toast.classList.add('is-visible');
  clearTimeout(_toast._hideTimer);
  _toast._hideTimer = setTimeout(() => _toast.classList.remove('is-visible'), 2500);
}

export function initAiCopy() {
  const buttons = document.querySelectorAll('[data-ai-copy]');
  if (!buttons.length) return;

  // Pre-warm the data cache so the first click can write to the clipboard
  // synchronously within the click handler's user-gesture window.
  getData().catch(() => {});

  buttons.forEach(btn => {
    if (btn._aiCopyBound) return;
    btn._aiCopyBound = true;
    btn.addEventListener('click', async () => {
      const origText = btn.textContent;
      try {
        const data = await getData();
        const text = buildClipboardText(data);
        await navigator.clipboard.writeText(text);
        btn.classList.add('is-copied');
        btn.textContent = 'copied';
        showToast('Copied! Paste into Claude, ChatGPT, or any AI assistant.');
        setTimeout(() => {
          btn.classList.remove('is-copied');
          btn.textContent = origText;
        }, 2500);
      } catch (err) {
        console.error('ai-copy failed:', err);
        showToast('Clipboard blocked — check console for the text');
        try {
          const data = await getData();
          console.log('--- Sybil PM Landscape clipboard blob ---\n' + buildClipboardText(data));
        } catch {}
      }
    });
  });
}

// Self-init on DOMContentLoaded so we don't need to import this from main.js.
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAiCopy);
} else {
  initAiCopy();
}
