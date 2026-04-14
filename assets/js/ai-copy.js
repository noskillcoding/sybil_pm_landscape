// assets/js/ai-copy.js
//
// "Give it to your AI" clipboard button.
// Builds a compact, pointer-style blob describing the dashboard and
// where to fetch each piece of data. Deliberately minimal — the
// website is fully agent-accessible, so the blob primes a fresh AI
// with the right mental model and points at the JSON / methodology
// endpoints. Specific data lives in those endpoints, not in the blob.

const SITE_URL  = (typeof window !== 'undefined' && window.location?.origin) || '';
const SITE_HOST = (typeof window !== 'undefined' && window.location?.host)   || 'sybil-pm-landscape';

const PRIMING = `[Pasted from Sybil PM Landscape — ${SITE_HOST}]

Tell the user what this dashboard is in one or two sentences, then wait for their question. Fetch the JSON or markdown endpoints below for specifics — the site is fully agent-accessible (plain GET, no auth, no CORS, no rate limits).`;

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

function buildClipboardText({ DATA, AA, TESTS }) {
  const pms = DATA || [];
  const aa = AA || {};
  const tests = (TESTS && TESTS.current) || {};

  const totalPms = pms.length;
  const aaGraded = Object.values(aa).filter(r => r && typeof r.score === 'number').length;
  const tested = Object.values(tests).filter(r => r && (r.cliMcp || r.skill || r.framework)).length;

  const lines = [
    PRIMING,
    '',
    '# Sybil PM Landscape',
    '',
    `Research dashboard ranking ${totalPms} prediction markets across 5 tiers (A–E) by what an autonomous AI agent can demonstrably do today. Four independent benchmarks: agent accessibility, CLI/MCP, skill, framework. April 2026 snapshot. Every test was run by autonomous coding agents.`,
    '',
    `${totalPms} PMs · ${aaGraded} graded for accessibility · ${tested} tested for agent tools · 5 tiers`,
    '',
    '## Pages',
    '',
    `- ${SITE_URL}/#/summary — 5-tier ranked list + 6 findings. Start here.`,
    `- ${SITE_URL}/#/landscape — full ${totalPms}-PM table with category, volume, tools.`,
    `- ${SITE_URL}/#/testing — per-benchmark grades + per-check evidence.`,
    `- ${SITE_URL}/#/methodology — formulas, floor rules, grade buckets.`,
    '',
    '## Data',
    '',
    `- ${SITE_URL}/data/pms.json — ${totalPms} PMs with metadata + tool links. THIS IS WHERE MCP-SERVER, CLI-REPO, SDK, AND FRAMEWORK LINKS LIVE.`,
    `- ${SITE_URL}/data/accessibility.json — per-PM AA grades + check-by-check evidence. Each entry has a _regrade field with the weighted-score breakdown.`,
    `- ${SITE_URL}/data/tests.json — CLI/MCP, skill, framework results. Each tool/skill/framework carries a _regrade audit (weighted score, max, floor reason, VPN reason).`,
    '',
    '## Methodology docs',
    '',
    `- ${SITE_URL}/methodology/agent-accessibility.md`,
    `- ${SITE_URL}/methodology/cli-mcp-test.md`,
    `- ${SITE_URL}/methodology/skill-test.md`,
    `- ${SITE_URL}/methodology/framework-assessment.md`,
    '',
    '## Source',
    '',
    '- X: https://x.com/sybil_pm',
    '- Parent project: https://sybil.exchange'
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
