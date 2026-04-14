// assets/js/summary.js
//
// Renders the Summary view: stat strip + 4-tier ranked list + hot takes.
// Tier assignments, verdicts, and findings are hand-curated below so they
// can be edited directly without changing data files.

import { esc, gradeClass, pmGlyphHtml } from './helpers.js';

// ---------------------------------------------------------------------
// Tier data — single source of truth for the ranking.
// Order within a tier matters: it's the display order.
// `linkTo` = 'testing' means PM cards deep-link into the testing view
// (per-check evidence). `linkTo` = 'landscape' goes to the landscape
// view (tool list and metadata).
// ---------------------------------------------------------------------
const TIERS = [
  {
    id: 'tier-1',
    letter: 'A',
    name: 'Production-ready',
    sub:  'Round-trip trade demonstrably works through a tested surface, no critical blockers.',
    layout: 'featured',
    linkTo: 'testing',
    pms: [
      { name: 'Manifold',           verdict: 'Play-money MCP scores 17 of 18; the easiest place to start.' },
      { name: 'Baozi',              verdict: '76-tool MCP server on Solana with a clean round-trip.' },
      { name: 'Myriad',             verdict: 'BNB-chain CLI nails the full trade with one rough edge.' },
      { name: 'Seer',               verdict: 'Gnosis framework deploys real trading agents to Seer markets.' },
      { name: 'AIOmen / Presagio',  verdict: '300+ daily active agents already trading via Olas.' },
      { name: 'Metaculus',          verdict: 'Active forecasting framework with daily commits — submits probability estimates, not trades.' }
    ]
  },
  {
    id: 'tier-2',
    letter: 'B',
    name: 'Trying but blocked',
    sub:  'Has tested agent surfaces, but blocked by a trading failure, broken accessibility, or geofencing.',
    layout: 'featured',
    linkTo: 'testing',
    pms: [
      { name: 'Polymarket',      verdict: 'Most polished agent stack on the market; geoblocked in 33 countries including the US, UK, EU, and Australia.' },
      { name: 'Alpha Arcade',    verdict: 'MCP completes the trade, but the website is rated D for agent accessibility — agents must already know the tool exists.' },
      { name: 'Rain Protocol',   verdict: 'OpenClaw skill opens positions but cannot close them.' },
      { name: 'Limitless',       verdict: 'Two tools published, both auth-walled, zero trading checks pass.' },
      { name: 'Context Markets', verdict: 'CLI and Skill both exist; neither completes a trade end-to-end.' },
      { name: 'Sapience',        verdict: 'ElizaOS plugin gets one download per week and hasn\'t shipped since August 2025.' }
    ]
  },
  {
    id: 'tier-3',
    letter: 'C',
    name: 'Dev tools, no agentic layer',
    sub:  'These PMs ship developer APIs and SDKs, but no MCP, Skill, or Framework has been published or tested. They could be agent-ready with effort; we just don\'t have evidence yet.',
    layout: 'compact',
    linkTo: 'landscape',
    pms: [
      { name: 'Kalshi' },
      { name: 'XO Market' },
      { name: 'Opinion' },
      { name: 'SX Bet' },
      { name: 'predict.fun' },
      { name: 'Probable' },
      { name: 'Trueo' },
      { name: 'Interactive Brokers (ForecastTrader)' },
      { name: 'PredictIt' }
    ]
  },
  {
    id: 'tier-4',
    letter: 'D',
    name: 'Closed to agents',
    sub:  'No public dev surface beyond the consumer web UI. No documented API, no SDK, no agent layer.',
    layout: 'compact',
    linkTo: 'landscape',
    pms: [
      { name: 'Robinhood Prediction Markets' },
      { name: 'OG (by Crypto.com)' },
      { name: 'DraftKings Predictions' },
      { name: 'FanDuel Predicts' },
      { name: 'Overtime' },
      { name: 'worm.wtf' }
    ]
  }
];

// ---------------------------------------------------------------------
// Hot takes — 7 short, shareable findings.
// Each is a numeral + headline + 2 sentence body.
// ---------------------------------------------------------------------
const FINDINGS = [
  {
    n: '01',
    headline: 'Geoblocking treats agents like they\'re human.',
    body: 'Polymarket, the most agent-tooled PM in the dataset, is geofenced in 33 countries including the US, UK, EU, and Australia. Agents run on cloud VPS in whichever region the operator chooses; that location reflects hosting decisions, not the operator\'s actual jurisdiction.'
  },
  {
    n: '02',
    headline: 'The biggest PMs are not the friendliest to agents.',
    body: 'Polymarket and Kalshi together account for the majority of total prediction-market volume. Neither is in Tier A. The top of the ranking is mid-volume DeFi: Manifold, Baozi, Myriad.'
  },
  {
    n: '03',
    headline: 'Some "agent surfaces" exist nominally but don\'t function.',
    body: 'Limitless ships a CLI and an MCP server — both pinned to versions, both auth-walled, both fail every trading check. Sapience\'s ElizaOS plugin gets ~1 download/week and targets a host framework version that no longer exists. Polymarket Agents has 2.7K stars but the execution path is commented out by default.'
  },
  {
    n: '04',
    headline: 'There is no shared format for agent surfaces.',
    body: 'The five skills tested use five different formats: SKILL.md, OpenClaw script bundles, custom SDK guides, navigation-hub markdown. Frameworks vary just as widely. An agent built for one PM cannot transfer to another. There is no equivalent of OpenAPI for prediction markets.'
  },
  {
    n: '05',
    headline: 'Most regulated PMs treat agents as a B2B integration channel, not as users.',
    body: 'Of seven regulated/CeFi PMs surveyed, only Kalshi has a developer surface that an agent could reasonably use today. Even Kalshi has not published an agent-specific layer — its API is built for institutional partners. Robinhood, OG, Interactive Brokers, PredictIt, DraftKings, and FanDuel have minimal or no public dev surface.'
  },
  {
    n: '06',
    headline: 'Dev surface and website live in two different worlds.',
    body: '11 of the 20 PMs scored for agent accessibility sit at C or D, including PMs whose APIs we know are functional. PMs invest in developer documentation for partners who already know what they\'re looking for, while leaving their consumer website unparseable to a fetch-only agent. Discoverability is a separate problem from documentation.'
  },
  {
    n: '07',
    headline: 'Only one agentic framework ships with built-in risk controls.',
    body: 'Of the six framework-grade integrations evaluated, only the Gnosis prediction-market-agent-tooling library includes any form of position sizing (Kelly criterion variants). Polymarket Agents ships with verbatim "zero safety guardrails: no position limits, no stop-losses, infinite recursive retry on errors". Every other agent framework executes whatever the model decides.'
  }
];

// ---------------------------------------------------------------------
// Helpers — find a PM in window.DATA by name
// ---------------------------------------------------------------------
function pmByName(name) {
  return (window.DATA || []).find(p => p.name === name);
}

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Returns array of { label, grade, kind } for a PM, in display order.
// `kind` matches the column the grade comes from.
function pmGrades(pm) {
  if (!pm) return [];
  const tr = (window.TEST_RESULTS || {})[pm.name] || {};
  const aa = (window.AA_RESULTS || {})[pm.name];
  const out = [];
  if (aa && aa.grade)            out.push({ label: 'AA',    grade: aa.grade });
  if (tr.cliMcp && tr.cliMcp.grade)    out.push({ label: 'CLI',   grade: tr.cliMcp.grade });
  if (tr.skill && tr.skill.grade)      out.push({ label: 'SKILL', grade: tr.skill.grade });
  if (tr.framework && tr.framework.grade) out.push({ label: 'FW',    grade: tr.framework.grade });
  return out;
}

function pmGradePillsHtml(pm) {
  const grades = pmGrades(pm);
  if (!grades.length) return '';
  return grades.map(g => `<div class="t-sm-grade-cell">
    <div class="t-sm-grade-label mono">${esc(g.label)}</div>
    <span class="t-sm-pill ${gradeClass(g.grade)}">${esc(g.grade)}</span>
  </div>`).join('');
}

function pmCategoryAndChain(pm) {
  if (!pm) return '';
  const cat = (pm.category || '').toLowerCase();
  const chain = pm.chain && pm.chain.toLowerCase() !== 'none'
    ? pm.chain.split(/[(,]/)[0].trim()
    : '';
  return [cat, chain].filter(Boolean).join(' · ');
}

// ---------------------------------------------------------------------
// Renderers
// ---------------------------------------------------------------------
function renderStats() {
  const totalPms = (window.DATA || []).length;
  const aaGraded = Object.values(window.AA_RESULTS || {}).filter(r => typeof r.score === 'number').length;
  const tested = Object.entries(window.TEST_RESULTS || {})
    .filter(([, r]) => r.cliMcp || r.skill || r.framework)
    .length;
  return `<div class="t-stats">
    <div class="t-stat">
      <div class="t-stat-label">surveyed</div>
      <div class="t-stat-value">${totalPms}</div>
      <div class="t-stat-detail">prediction markets</div>
    </div>
    <div class="t-stat">
      <div class="t-stat-label">benchmarks</div>
      <div class="t-stat-value">4</div>
      <div class="t-stat-detail">independent tests</div>
    </div>
    <div class="t-stat">
      <div class="t-stat-label">graded</div>
      <div class="t-stat-value">${aaGraded}</div>
      <div class="t-stat-detail">for accessibility</div>
    </div>
    <div class="t-stat">
      <div class="t-stat-label">tested</div>
      <div class="t-stat-value">${tested}</div>
      <div class="t-stat-detail">for agent tools</div>
    </div>
  </div>`;
}

function pmCardFeatured(entry, linkTo) {
  const pm = pmByName(entry.name);
  const meta = pmCategoryAndChain(pm);
  const pills = pmGradePillsHtml(pm);
  const slug = slugify(pm ? pm.name : entry.name);
  const href = `#/${linkTo}/${slug}`;
  return `<a class="t-sm-card" href="${href}">
    <div class="t-sm-card-head">
      ${pm ? pmGlyphHtml(pm) : ''}
      <div class="t-sm-card-id">
        <div class="t-sm-card-name">${esc(entry.name)}</div>
        <div class="t-sm-card-meta mono">${esc(meta)}</div>
      </div>
      <div class="t-sm-card-grades">${pills}</div>
    </div>
    <div class="t-sm-card-verdict">${esc(entry.verdict)}</div>
  </a>`;
}

function pmCardCompact(entry, linkTo) {
  const pm = pmByName(entry.name);
  const meta = pmCategoryAndChain(pm);
  const slug = slugify(pm ? pm.name : entry.name);
  const href = `#/${linkTo}/${slug}`;
  return `<a class="t-sm-mini" href="${href}">
    ${pm ? pmGlyphHtml(pm) : ''}
    <div class="t-sm-mini-id">
      <div class="t-sm-mini-name">${esc(entry.name)}</div>
      <div class="t-sm-mini-meta mono">${esc(meta)}</div>
    </div>
  </a>`;
}

function renderTier(tier) {
  const cards = tier.pms.map(p =>
    tier.layout === 'featured'
      ? pmCardFeatured(p, tier.linkTo)
      : pmCardCompact(p, tier.linkTo)
  ).join('');
  const gridClass = tier.layout === 'featured' ? 't-sm-grid-featured' : 't-sm-grid-compact';
  return `<section class="t-sm-tier ${tier.id}">
    <div class="t-sm-tier-head">
      <span class="t-sm-tier-badge mono">TIER ${esc(tier.letter)}</span>
      <span class="t-sm-tier-name mono">${esc(tier.name)}</span>
      <span class="t-sm-tier-count mono">${tier.pms.length} ${tier.pms.length === 1 ? 'PM' : 'PMs'}</span>
    </div>
    <p class="t-sm-tier-sub">${esc(tier.sub)}</p>
    <div class="${gridClass}">${cards}</div>
  </section>`;
}

function renderTiers() {
  return TIERS.map(renderTier).join('');
}

function renderFindings() {
  return `<div class="t-sm-findings-head">
    <span class="t-detail-h">hot takes</span>
  </div>
  <div class="t-sm-findings">
    ${FINDINGS.map(f => `<article class="t-sm-finding">
      <div class="t-sm-finding-num mono">${esc(f.n)}</div>
      <div class="t-sm-finding-body">
        <h3 class="t-sm-finding-headline">${esc(f.headline)}</h3>
        <p class="t-sm-finding-text">${esc(f.body)}</p>
      </div>
    </article>`).join('')}
  </div>`;
}

let _rendered = false;
export function renderSummary() {
  if (_rendered) return;
  const statsHost = document.getElementById('summaryStats');
  const tiersHost = document.getElementById('summaryTiers');
  const findingsHost = document.getElementById('summaryFindings');
  if (!statsHost || !tiersHost || !findingsHost) return;
  statsHost.innerHTML = renderStats();
  tiersHost.innerHTML = renderTiers();
  findingsHost.innerHTML = renderFindings();
  _rendered = true;
}
