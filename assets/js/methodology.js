// assets/js/methodology.js
// Renders the Methodology view: summary placeholder + 4 testing-formula blocks.
// Each block describes what's measured, how it's scored (with weights and
// floors), the resulting grade buckets, and a short "why this formula" note.

import { esc } from './helpers.js';
import { UNIFIED_CHECKS, SKILL_MILESTONES, AA_DIMS } from './constants.js';

// --- Helpers -------------------------------------------------------------

const aaAll = AA_DIMS.flatMap(d => d.checks).map(c => ({ id: c.id, name: c.label, why: c.why }));
const aaById = (id) => aaAll.find(c => c.id === id);
const aaNot = (ids) => aaAll.filter(c => !ids.includes(c.id));

const skillById = (id) => SKILL_MILESTONES.find(m => m.id === id);
const skillNot = (ids) => SKILL_MILESTONES.filter(m => !ids.includes(m.id));

// --- Method blocks -------------------------------------------------------

const METHOD_BLOCKS = [
  {
    id: 'aa',
    title: 'Agent Accessibility',
    lede: 'Can a fetch-only agent read this prediction market\'s site? 15 checks grouped into 4 dimensions, weighted by how much each one decides whether the site is usable to an agent at all.',
    weights: [
      {
        tier: 'Critical',
        pts: '3pt × 2',
        checks: [
          { id: '2.1', name: 'Content without JS', why: 'A fetch-only agent needs real text in the HTML body. JS-rendered shells are opaque without a browser.' },
          { id: '3.3', name: 'Programmatic surface documented', why: 'If the HTML is unparseable, a documented API is the agent\'s only way in.' }
        ]
      },
      {
        tier: 'Important',
        pts: '2pt × 4',
        checks: [
          aaById('1.1'),
          aaById('4.1'),
          aaById('4.2'),
          aaById('4.3')
        ]
      },
      {
        tier: 'Standard',
        pts: '1pt × 9',
        checks: aaNot(['2.1', '3.3', '1.1', '4.1', '4.2', '4.3'])
      }
    ],
    maxScore: 23,
    floor: {
      label: 'Grade adjustments',
      rules: [
        { when: 'Content without JS AND programmatic surface both fail', effect: 'max grade D', reason: 'No path for a fetch-only agent: the HTML is opaque and there is no documented API to fall back on.' }
      ]
    },
    buckets: [
      { grade: 'A', range: '19–23', label: 'Agent-ready' },
      { grade: 'B', range: '14–18', label: 'Agent-friendly' },
      { grade: 'C', range: '9–13',  label: 'Agent-tolerable' },
      { grade: 'D', range: '4–8',   label: 'Agent-hostile' },
      { grade: 'F', range: '0–3',   label: 'Agent-opaque' }
    ],
    why: 'An autonomous agent has two ways to extract useful information from a site: parse the rendered HTML, or call a documented API. If neither path works, the site is closed to agents regardless of how clean the sitemap or URLs are. Content without JS and a documented programmatic surface carry 3 points each, and the grade is capped at D when both fail. The 2-point tier covers signals that determine how welcome an agent is once it gets in: llms.txt, AI-crawler permissions in robots.txt, the absence of public-page CAPTCHA, and a documented bot policy. The 1-point tier is hygiene that helps an agent navigate but does not gate access.'
  },

  {
    id: 'cli',
    title: 'CLI / MCP Test',
    lede: 'Can an autonomous agent install this CLI or MCP tool and use it to place a real buy-and-sell trade with ~$1–2 of test funds? 18 checks across 4 sections, with trading checks worth double.',
    weights: [
      {
        tier: 'Trading',
        pts: '2pt × 5',
        checks: UNIFIED_CHECKS.trading,
        sub: '10 of 23 total points come from this section.'
      },
      {
        tier: 'Setup',
        pts: '1pt × 4',
        checks: UNIFIED_CHECKS.setup
      },
      {
        tier: 'Discovery',
        pts: '1pt × 5',
        checks: UNIFIED_CHECKS.discovery
      },
      {
        tier: 'Errors',
        pts: '1pt × 4',
        checks: UNIFIED_CHECKS.errors
      }
    ],
    maxScore: 23,
    floor: {
      label: 'Grade adjustments',
      rules: [
        { when: 'Neither buy nor sell completes', effect: 'max grade D', reason: 'Tool cannot perform any trade. This is the explicit floor for autonomous-trading evaluation.' },
        { when: 'Only one of buy / sell completes', effect: 'max grade C', reason: 'Half-trading. Agent can enter or exit but not cycle through positions.' },
        { when: 'Both buy AND sell complete', effect: 'no cap', reason: 'Eligible for B / A based on the weighted score.' },
        { when: 'A critical trading action only completes via VPN', effect: 'final grade −1 tier', reason: 'VPN-only trading works, but introduces operational complexity. Single penalty regardless of how many critical checks need a VPN.' }
      ]
    },
    buckets: [
      { grade: 'A', range: '20–23', label: 'Production-ready trading' },
      { grade: 'B', range: '16–19', label: 'Trades with minor gaps' },
      { grade: 'C', range: '11–15', label: 'Half-trading or partial' },
      { grade: 'D', range: '6–10',  label: 'Discovery only, no trading' },
      { grade: 'F', range: '0–5',   label: 'Cannot install or auth' }
    ],
    why: 'This benchmark exists to determine whether an autonomous agent can use the tool to trade. A tool that lists markets and handles errors well but cannot place a real buy and sell order has not demonstrated that capability, regardless of how many other checks it passes. Trading checks are weighted 2× (10 of 23 total points) and the grade is capped at D for any tool that cannot complete both a buy and a sell. VPN-only completion of a critical check is treated as a one-tier penalty rather than a hard cap, since the trade is real but the operational friction is meaningful for an agent running unattended.'
  },

  {
    id: 'skill',
    title: 'Skill Test',
    lede: 'Can an autonomous agent complete a full trade cycle given only a SKILL.md file and wallet credentials? 8 milestones, weighted by how directly each one proves the agent traded.',
    weights: [
      {
        tier: 'Critical',
        pts: '3pt × 2',
        checks: [
          { ...skillById('M5'), why: 'The entry trade. The first milestone that proves the skill\'s instructions can drive a real on-chain action.' },
          { ...skillById('M7'), why: 'The exit trade. Without it, the agent opens positions it cannot close, which is not autonomous trading.' }
        ]
      },
      {
        tier: 'Important',
        pts: '2pt × 1',
        checks: [
          { ...skillById('M2'), why: 'Auth is the gate for every later milestone. If the skill\'s auth instructions don\'t work, no downstream milestone can pass.' }
        ]
      },
      {
        tier: 'Standard',
        pts: '1pt × 5',
        checks: skillNot(['M5', 'M7', 'M2'])
      }
    ],
    maxScore: 13,
    floor: {
      label: 'Grade adjustments',
      rules: [
        { when: 'Neither buy nor sell milestone passes', effect: 'max grade D', reason: 'Skill cannot drive a trade end-to-end. No autonomous trading possible.' },
        { when: 'Only one of buy / sell milestones passes', effect: 'max grade C', reason: 'Half-cycle skill. Agent can enter or exit but not cycle.' },
        { when: 'Both buy AND sell milestones pass', effect: 'no cap', reason: 'Eligible for B / A based on score.' },
        { when: 'A critical milestone only passes via VPN', effect: 'final grade −1 tier', reason: 'Same VPN penalty as CLI/MCP. Single penalty regardless of how many critical milestones need a VPN.' }
      ]
    },
    buckets: [
      { grade: 'A', range: '11–13', label: 'Production-ready skill' },
      { grade: 'B', range: '8–10',  label: 'Round-trip with gaps' },
      { grade: 'C', range: '5–7',   label: 'Half-cycle or partial' },
      { grade: 'D', range: '1–4',   label: 'Cannot trade' },
      { grade: 'F', range: '0',     label: 'Skill unreadable / unusable' }
    ],
    why: 'A skill is only useful if it lets an agent execute a complete trade cycle. Earlier milestones (reading the skill, finding markets, authenticating) are preparation; the milestones that prove the skill works are placing a position and closing it. Both are weighted at 3 points, and a skill that fails either critical milestone is capped at C; failing both caps at D. Auth is weighted at 2 points because every subsequent milestone depends on it. The VPN penalty mirrors CLI/MCP: VPN-only completion of a critical milestone counts toward eligibility but drops the final grade by one tier.'
  },

  {
    id: 'fw',
    title: 'Framework Assessment',
    lede: 'How mature is this agentic framework for building autonomous PM agents? Five 0–3 quality dimensions, plus a type qualifier that distinguishes trading frameworks from forecasting libraries, plugins, and platform features.',
    weights: [
      {
        tier: 'Maintenance',
        pts: '0–3',
        sub: '0 abandoned (>6 mo) · 1 stale (3–6 mo) · 2 recent (1–3 mo) · 3 actively maintained (<30 days).'
      },
      {
        tier: 'Adoption',
        pts: '0–3',
        sub: '0 nobody · 1 single-digit signals · 2 real downloads / agents · 3 production agents at scale.'
      },
      {
        tier: 'Completeness',
        pts: '0–3',
        sub: '0 single connector · 1 partial pipeline · 2 full pipeline, single PM · 3 full pipeline, multi-PM.'
      },
      {
        tier: 'Documentation',
        pts: '0–3',
        sub: '0 README only · 1 setup but no examples · 2 setup + examples + reference · 3 tutorials + working agents.'
      },
      {
        tier: 'Safety',
        pts: '0–3',
        sub: '0 no guardrails · 1 error handling only · 2 position limits OR loss caps · 3 comprehensive guardrails.'
      }
    ],
    maxScore: 15,
    typeQualifier: {
      label: 'Type qualifier (badge, not score)',
      rules: [
        { tag: 'trading',          desc: 'Direct trading framework. The primary case the rubric is designed for.' },
        { tag: 'forecasting',      desc: 'Produces probability estimates only (e.g. Metaculus tools). Not penalized for not trading.' },
        { tag: 'plugin',           desc: 'Bridges to a host framework (e.g. ElizaOS plugin). Inherits the host\'s capabilities.' },
        { tag: 'platform-feature', desc: 'Not a framework at all (e.g. Baozi Agent Arena leaderboard). Receives N/A.' }
      ]
    },
    buckets: [
      { grade: 'Production',   range: '13–15', label: 'Real agents trading on this in prod today' },
      { grade: 'Usable',       range: '9–12',  label: 'Works, but has gaps' },
      { grade: 'Experimental', range: '5–8',   label: 'Proof of concept or single-agent quality' },
      { grade: 'Abandoned',    range: '0–4',   label: 'Dead repo, no users, no path forward' },
      { grade: 'N/A',          range: '—',     label: 'Type-qualifier override (not a framework)' }
    ],
    why: 'Frameworks are systems that make decisions and execute, not tools an agent calls directly. Their production-readiness depends on multiple independent dimensions, and a high score on one cannot compensate for failure on another: a project with clean architecture but no maintenance does not become useful by virtue of its architecture alone. The five dimensions (maintenance, adoption, completeness, documentation, safety) are each scored 0–3 for a total of 15. The type qualifier is a separate tag (trading, forecasting, plugin, platform-feature) that sets the context in which a framework should be evaluated, so a forecasting library is not graded against trading frameworks. The qualifier does not change the dimension totals.'
  }
];

// --- Renderers -----------------------------------------------------------

function renderWeights(weights) {
  return `<div class="t-mp-rules">` + weights.map(w => {
    let inner = '';
    if (w.checks) {
      inner = `<ul class="t-mp-rule-list">` + w.checks.map(c =>
        `<li><span class="t-mp-rule-name">${esc(c.name)}</span>${c.why ? `<span class="t-mp-rule-why">${esc(c.why)}</span>` : ''}</li>`
      ).join('') + `</ul>`;
    }
    if (w.sub) inner += `<div class="t-mp-rule-sub">${esc(w.sub)}</div>`;
    return `<div class="t-mp-rule">
      <div class="t-mp-rule-head">
        <span class="t-mp-rule-tier">${esc(w.tier)}</span>
        <span class="t-mp-rule-pts mono">${esc(w.pts)}</span>
      </div>
      ${inner}
    </div>`;
  }).join('') + `</div>`;
}

function renderFloor(floor) {
  if (!floor) return '';
  return `<div class="t-mp-floor">
    <div class="t-mp-floor-h mono">// ${esc(floor.label)}</div>
    <ul class="t-mp-floor-list">
      ${floor.rules.map(r => `<li>
        <span class="t-mp-floor-when">${esc(r.when)}</span>
        <span class="t-mp-floor-arrow mono">→</span>
        <span class="t-mp-floor-cap">${esc(r.effect)}</span>
        <div class="t-mp-floor-reason">${esc(r.reason)}</div>
      </li>`).join('')}
    </ul>
  </div>`;
}

function renderTypeQualifier(tq) {
  if (!tq) return '';
  return `<div class="t-mp-floor">
    <div class="t-mp-floor-h mono">// ${esc(tq.label)}</div>
    <ul class="t-mp-tag-list">
      ${tq.rules.map(r => `<li>
        <span class="t-mp-tag mono">${esc(r.tag)}</span>
        <div class="t-mp-floor-reason">${esc(r.desc)}</div>
      </li>`).join('')}
    </ul>
  </div>`;
}

function gradeChipClass(grade) {
  const g = String(grade).toLowerCase();
  if (g === 'a') return 't-grade t-grade-a';
  if (g === 'b') return 't-grade t-grade-b';
  if (g === 'c') return 't-grade t-grade-c';
  if (g === 'd') return 't-grade t-grade-d';
  if (g === 'f') return 't-grade t-grade-f';
  if (g === 'production')   return 't-grade t-grade-fwprod';
  if (g === 'usable')       return 't-grade t-grade-fwusable';
  if (g === 'experimental') return 't-grade t-grade-fwexp';
  if (g === 'abandoned')    return 't-grade t-grade-fwabandoned';
  return 't-grade t-grade-na';
}

function renderBuckets(buckets, maxScore) {
  return `<div class="t-mp-buckets">
    <div class="t-mp-floor-h mono">// grade buckets${maxScore ? ' · max ' + maxScore : ''}</div>
    <ul class="t-mp-bucket-list">
      ${buckets.map(b => `<li>
        <span class="${gradeChipClass(b.grade)}">${esc(b.grade)}</span>
        <span class="t-mp-bucket-range mono">${esc(b.range)}</span>
        <span class="t-mp-bucket-label">${esc(b.label)}</span>
      </li>`).join('')}
    </ul>
  </div>`;
}

function renderWhy(why) {
  return `<div class="t-mp-why">
    <div class="t-mp-floor-h mono">// why this formula</div>
    <p>${esc(why)}</p>
  </div>`;
}

function renderBlock(block) {
  return `<article class="t-mp-block" id="method-${block.id}">
    <h2 class="t-mp-h">${esc(block.title)}</h2>
    <p class="t-mp-lede">${esc(block.lede)}</p>
    ${renderWeights(block.weights)}
    ${renderFloor(block.floor)}
    ${renderTypeQualifier(block.typeQualifier)}
    ${renderBuckets(block.buckets, block.maxScore)}
    ${renderWhy(block.why)}
  </article>`;
}

let _rendered = false;
export function renderMethodology() {
  if (_rendered) return;
  const host = document.getElementById('methodFormulas');
  if (!host) return;
  host.innerHTML = `
    <div class="t-detail-h">methodology</div>
    ${METHOD_BLOCKS.map(renderBlock).join('')}
  `;
  _rendered = true;
}
