#!/usr/bin/env node
// scripts/regrade.js
//
// Re-grades the test data using the weighted methodology described on
// the /methodology page. Reads:
//   data/tests.json
//   data/accessibility.json
// Writes:
//   data/tests.regraded.json
//   data/accessibility.regraded.json
//
// Each tool / skill / AA entry gets a `_regrade` audit object so the
// computation is traceable. Originals are not modified.
//
// Run from repo root:  node scripts/regrade.js
//
// Re-running is idempotent: it always reads the originals and overwrites
// the regraded files.

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const TESTS_IN  = path.join(ROOT, 'data/tests.json');
const AA_IN     = path.join(ROOT, 'data/accessibility.json');
const TESTS_OUT = path.join(ROOT, 'data/tests.regraded.json');
const AA_OUT    = path.join(ROOT, 'data/accessibility.regraded.json');

// ---------------------------------------------------------------------
// Status helpers — handles both `status` and `result` field names that
// exist in the dataset due to schema drift.
// ---------------------------------------------------------------------
const statusOf = (c) => String((c && (c.status || c.result)) || '').toUpperCase();
const isPass    = (c) => statusOf(c) === 'PASS';
const isBlocked = (c) => statusOf(c) === 'BLOCKED';

const TIER_ORDER  = ['A','B','C','D','F'];
const tierIndex = (g) => TIER_ORDER.indexOf(String(g || '').toUpperCase());
const dropTier  = (g) => {
  const i = tierIndex(g);
  if (i < 0) return g;
  return TIER_ORDER[Math.min(i + 1, TIER_ORDER.length - 1)];
};

// ---------------------------------------------------------------------
// Agent Accessibility re-grade
// 15 checks, weighted:
//   3pt × 2  critical: 2.1, 3.3
//   2pt × 4  important: 1.1, 4.1, 4.2, 4.3
//   1pt × 9  standard: 1.2, 1.3, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.4
// Total max: 23
// Buckets: A 19-23, B 14-18, C 9-13, D 4-8, F 0-3
// Floor: 2.1 AND 3.3 both fail → max grade D.
// ---------------------------------------------------------------------
const AA_WEIGHTS = {
  '2.1': 3, '3.3': 3,
  '1.1': 2, '4.1': 2, '4.2': 2, '4.3': 2,
  '1.2': 1, '1.3': 1,
  '2.2': 1, '2.3': 1, '2.4': 1, '2.5': 1,
  '3.1': 1, '3.2': 1, '3.4': 1
};
const AA_MAX = Object.values(AA_WEIGHTS).reduce((a, b) => a + b, 0); // 23
const aaBucket = (s) =>
  s >= 19 ? 'A' :
  s >= 14 ? 'B' :
  s >= 9  ? 'C' :
  s >= 4  ? 'D' : 'F';

function regradeAa(entry) {
  const checks = entry.checks || {};
  let score = 0;
  const breakdown = {};
  for (const [id, w] of Object.entries(AA_WEIGHTS)) {
    const passed = !!(checks[id] && checks[id].pass);
    if (passed) score += w;
    breakdown[id] = { weight: w, pass: passed };
  }
  let grade = aaBucket(score);
  let floorReason = null;
  const c21pass = !!(checks['2.1'] && checks['2.1'].pass);
  const c33pass = !!(checks['3.3'] && checks['3.3'].pass);
  if (!c21pass && !c33pass) {
    if (['A','B','C'].includes(grade)) {
      floorReason = 'Critical floor: 2.1 (content without JS) AND 3.3 (programmatic surface) both fail → cap D';
      grade = 'D';
    }
  }
  return {
    score, max: AA_MAX, grade,
    floorReason,
    breakdown,
    formula: 'AA v2 (weighted): 3pt×2 critical + 2pt×4 important + 1pt×9 standard'
  };
}

// ---------------------------------------------------------------------
// CLI/MCP re-grade
// 18 checks, weighted:
//   1pt × 4  setup
//   1pt × 5  discovery
//   2pt × 5  trading   ← doubled
//   1pt × 4  errors
// Total max: 23
// Buckets: A 20-23, B 16-19, C 11-15, D 6-10, F 0-5
// Floor:
//   - Neither T4 nor T5 passes → max D
//   - Only one of T4/T5 passes → max C
//   - Both T4+T5 pass → eligible for B/A
// VPN penalty:
//   - vpnRequired === true on the tool record → drop final grade by one tier
// ---------------------------------------------------------------------
const CLI_SECTION_WEIGHT = { setup: 1, discovery: 1, trading: 2, errors: 1 };
const CLI_MAX = 4*1 + 5*1 + 5*2 + 4*1; // 23
const cliBucket = (s) =>
  s >= 20 ? 'A' :
  s >= 16 ? 'B' :
  s >= 11 ? 'C' :
  s >= 6  ? 'D' : 'F';

function regradeCliTool(tool) {
  const sections = tool.sections || {};
  const breakdown = {};
  let score = 0;
  let max = 0;

  for (const sec of ['setup','discovery','trading','errors']) {
    const w = CLI_SECTION_WEIGHT[sec];
    const checks = (sections[sec] || {}).checks || {};
    const items = {};
    let secPass = 0, secTotal = 0;
    for (const [id, c] of Object.entries(checks)) {
      const pass = isPass(c);
      const blocked = isBlocked(c);
      const status = pass ? 'PASS' : (blocked ? 'BLOCKED' : 'FAIL');
      items[id] = { weight: w, status, pass };
      secTotal++;
      if (pass) secPass++;
    }
    breakdown[sec] = { weight: w, pass: secPass, total: secTotal, items };
    score += secPass * w;
    max   += secTotal * w;
  }

  const trChecks = (sections.trading || {}).checks || {};
  const t4ok = !!(trChecks.T4 && isPass(trChecks.T4));
  const t5ok = !!(trChecks.T5 && isPass(trChecks.T5));

  let grade = cliBucket(score);
  let floorReason = null;
  if (!t4ok && !t5ok) {
    if (['A','B','C'].includes(grade)) {
      floorReason = 'Trading floor: neither T4 (buy) nor T5 (sell) completes → cap D';
      grade = 'D';
    }
  } else if (!t4ok || !t5ok) {
    if (['A','B'].includes(grade)) {
      floorReason = `Trading floor: only ${t4ok ? 'T4 (buy)' : 'T5 (sell)'} completes → cap C`;
      grade = 'C';
    }
  }

  let vpnReason = null;
  if (tool.vpnRequired === true && (t4ok || t5ok)) {
    const before = grade;
    grade = dropTier(grade);
    vpnReason = `VPN penalty: vpnRequired=true on a critical-trading tool → drop one tier (${before} → ${grade})`;
  }

  return {
    score, max, grade,
    expectedMax: CLI_MAX,
    floorReason, vpnReason,
    breakdown,
    t4: t4ok, t5: t5ok,
    formula: 'CLI/MCP v2 (weighted, 2× trading): 1pt setup + 1pt discovery + 2pt trading + 1pt errors'
  };
}

// PM-level cliMcp grade is the BEST of the per-tool grades, matching how
// the testing page already displays things. We pick the lowest tierIndex
// (A=0 is best).
function bestGradeOf(grades) {
  if (!grades.length) return null;
  return grades
    .filter(Boolean)
    .map(g => ({ g, i: tierIndex(g) }))
    .sort((a, b) => a.i - b.i)[0]?.g || null;
}

// ---------------------------------------------------------------------
// Skill re-grade
// 8 milestones, weighted:
//   3pt × 2  critical: M5 (buy), M7 (sell)
//   2pt × 1  important: M2 (auth)
//   1pt × 5  standard: M1, M3, M4, M6, M8
// Total max: 13
// Buckets: A 11-13, B 8-10, C 5-7, D 1-4, F 0
// Floor:
//   - Neither M5 nor M7 passes → max D
//   - Only one of M5/M7 passes → max C
//   - Both M5+M7 pass → eligible for B/A
// VPN penalty: same as CLI/MCP (vpnRequired=true → -1 tier)
// ---------------------------------------------------------------------
const SKILL_WEIGHT = { M1:1, M2:2, M3:1, M4:1, M5:3, M6:1, M7:3, M8:1 };
const SKILL_MAX = Object.values(SKILL_WEIGHT).reduce((a,b)=>a+b,0); // 13
const skillBucket = (s) =>
  s >= 11 ? 'A' :
  s >= 8  ? 'B' :
  s >= 5  ? 'C' :
  s >= 1  ? 'D' : 'F';

function regradeSkill(st) {
  const ms = st.milestones || {};
  let score = 0;
  const breakdown = {};
  for (const [id, w] of Object.entries(SKILL_WEIGHT)) {
    const m = ms[id];
    const pass = !!(m && isPass(m));
    if (pass) score += w;
    breakdown[id] = {
      weight: w, pass,
      status: m ? statusOf(m) : 'MISSING'
    };
  }

  const m5ok = !!(ms.M5 && isPass(ms.M5));
  const m7ok = !!(ms.M7 && isPass(ms.M7));

  let grade = skillBucket(score);
  let floorReason = null;
  if (!m5ok && !m7ok) {
    if (['A','B','C'].includes(grade)) {
      floorReason = 'Trading floor: neither M5 (buy) nor M7 (sell) passes → cap D';
      grade = 'D';
    }
  } else if (!m5ok || !m7ok) {
    if (['A','B'].includes(grade)) {
      floorReason = `Trading floor: only ${m5ok ? 'M5 (buy)' : 'M7 (sell)'} passes → cap C`;
      grade = 'C';
    }
  }

  let vpnReason = null;
  if (st.vpnRequired === true && (m5ok || m7ok)) {
    const before = grade;
    grade = dropTier(grade);
    vpnReason = `VPN penalty: vpnRequired=true on a critical milestone → drop one tier (${before} → ${grade})`;
  }

  return {
    score, max: SKILL_MAX, grade,
    floorReason, vpnReason,
    breakdown,
    m5: m5ok, m7: m7ok,
    formula: 'Skill v2 (weighted): 3pt×2 critical (M5,M7) + 2pt×1 auth (M2) + 1pt×5 standard'
  };
}

// ---------------------------------------------------------------------
// Framework re-grade
// 5 dimensions × 0-3 = 15 max
//   maintenance · adoption · completeness · documentation · safety
// Buckets: Production 13-15, Usable 9-12, Experimental 5-8, Abandoned 0-4
// Type qualifier: trading | forecasting | plugin | platform-feature
//   - platform-feature → grade override = N/A
//
// Scores are HAND-CURATED from each framework's existing keyFindings
// and category descriptions, reviewed against the April 2026 snapshot.
// Re-running this script always re-applies these same scores; to update
// a framework, edit the FRAMEWORK_SCORES entry below.
//
// Key format: "<pm>::<framework name>"
// ---------------------------------------------------------------------
const FRAMEWORK_SCORES = {
  'Polymarket::Polymarket Agents': {
    type: 'trading',
    dimensions: {
      maintenance:   0, // last substantive commit Oct 2024 → 18 mo stale
      adoption:      1, // 2.7K stars but 47 unanswered issues, no documented production users
      completeness:  2, // full pipeline (data + decision + execution), Polymarket-only
      documentation: 1, // setup steps exist, no examples; "test suite" is Python tutorial files
      safety:        0  // "zero safety guardrails" per keyFindings
    }
  },
  'Sapience::ElizaOS Plugin': {
    type: 'plugin',
    dimensions: {
      maintenance:   0, // single version 1.0.7, August 2025, never updated → 8 mo stale
      adoption:      0, // 1 download/week on npm
      completeness:  1, // plugin only — bridges to ElizaOS host (4 actions + 1 provider)
      documentation: 1, // setup steps exist (install ElizaOS, configure character)
      safety:        0  // no guardrails; signs and submits transactions blindly
    }
  },
  'Baozi::Agent Arena + AgentBook': {
    type: 'platform-feature',
    dimensions: null  // type override → N/A
  },
  'Metaculus::forecasting-tools': {
    type: 'forecasting',
    dimensions: {
      maintenance:   3, // daily commits, actively maintained
      adoption:      2, // tournament use, multiple bot implementations, free API credits
      completeness:  2, // full pipeline (research → forecast → publish), Metaculus-only
      documentation: 3, // bot template + GH Actions + multiple working bots
      safety:        1  // forecasting has no positions; error handling exists, no loss caps to apply
    }
  },
  'Seer::Gnosis prediction-market-agent-tooling': {
    type: 'trading',
    dimensions: {
      maintenance:   3, // daily commits, Polymarket integration April 2026
      adoption:      3, // 300+ daily active agents (Olas), Pearl no-code app, 16 example agents
      completeness:  3, // multi-platform (Omen, Seer, Manifold, Polymarket, Metaculus)
      documentation: 2, // clean override points + 16 example agents; no formal tutorial
      safety:        2  // 6 betting strategies including Full Kelly with binary search → loss caps
    }
  },
  'AIOmen / Presagio::Gnosis prediction-market-agent-tooling': {
    type: 'trading',
    dimensions: {
      maintenance:   3,
      adoption:      3,
      completeness:  3,
      documentation: 2,
      safety:        2
    }
  }
};

const FW_MAX = 15;
const fwBucket = (s) =>
  s >= 13 ? 'Production' :
  s >= 9  ? 'Usable' :
  s >= 5  ? 'Experimental' : 'Abandoned';

function regradeFramework(pm, fw) {
  const key = pm + '::' + fw.name;
  const entry = FRAMEWORK_SCORES[key];
  if (!entry) {
    return {
      score: null, max: FW_MAX, grade: fw.grade,
      missing: true,
      reason: `No hand-scored entry for "${key}" — left at original grade`,
      formula: 'Framework v2: 5 dimensions × 0-3 + type qualifier'
    };
  }
  if (entry.type === 'platform-feature' || !entry.dimensions) {
    return {
      score: null, max: FW_MAX, grade: 'N/A',
      typeQualifier: entry.type,
      typeOverrideReason: 'Type qualifier `platform-feature` → grade overridden to N/A (not a framework)',
      formula: 'Framework v2: 5 dimensions × 0-3 + type qualifier'
    };
  }
  const d = entry.dimensions;
  const score = d.maintenance + d.adoption + d.completeness + d.documentation + d.safety;
  return {
    score, max: FW_MAX, grade: fwBucket(score),
    typeQualifier: entry.type,
    dimensions: d,
    formula: 'Framework v2: 5 dimensions × 0-3 + type qualifier'
  };
}

// ---------------------------------------------------------------------
// Drive everything
// ---------------------------------------------------------------------
function regradeAll() {
  const tests = JSON.parse(fs.readFileSync(TESTS_IN, 'utf8'));
  const aa = JSON.parse(fs.readFileSync(AA_IN, 'utf8'));

  // ----- AA -----
  const aaOut = {};
  for (const [pm, entry] of Object.entries(aa)) {
    if (typeof entry.score !== 'number') {
      aaOut[pm] = entry;
      continue;
    }
    const reg = regradeAa(entry);
    aaOut[pm] = {
      ...entry,
      score: reg.score,
      grade: reg.grade,
      _regrade: reg
    };
  }

  // ----- tests (cliMcp + skill; framework left untouched, hand-scored later) -----
  const testsOut = JSON.parse(JSON.stringify(tests));
  const cur = testsOut.current || {};

  for (const [pm, r] of Object.entries(cur)) {
    // CLI/MCP
    if (Array.isArray(r._tools) && r._tools.length) {
      const newToolGrades = [];
      for (const tool of r._tools) {
        if (!tool.sections) continue;
        const reg = regradeCliTool(tool);
        tool.grade = reg.grade;
        tool._regrade = reg;
        newToolGrades.push(reg.grade);
      }
      if (r.cliMcp && newToolGrades.length) {
        r.cliMcp.grade = bestGradeOf(newToolGrades);
      }
    }
    // Skill
    if (Array.isArray(r._skillTools) && r._skillTools.length) {
      const newSkillGrades = [];
      for (const st of r._skillTools) {
        const reg = regradeSkill(st);
        st.grade = reg.grade;
        st._regrade = reg;
        newSkillGrades.push(reg.grade);
      }
      if (r.skill && newSkillGrades.length) {
        r.skill.grade = bestGradeOf(newSkillGrades);
      }
    }
    // Framework: hand-scored against the new rubric (see FRAMEWORK_SCORES).
    if (Array.isArray(r._frameworkTools) && r._frameworkTools.length) {
      const newFwGrades = [];
      for (const fw of r._frameworkTools) {
        const reg = regradeFramework(pm, fw);
        fw.grade = reg.grade;
        fw._regrade = reg;
        newFwGrades.push(reg.grade);
      }
      if (r.framework && newFwGrades.length) {
        // PM-level framework grade = best (or only) of the framework grades.
        // Type qualifier overrides keep N/A out of best-of consideration.
        const real = newFwGrades.filter(g => g !== 'N/A');
        if (real.length) {
          const fwOrder = ['Production','Usable','Experimental','Abandoned'];
          real.sort((a, b) => fwOrder.indexOf(a) - fwOrder.indexOf(b));
          r.framework.grade = real[0];
        } else {
          r.framework.grade = 'N/A';
        }
      }
    }
  }

  fs.writeFileSync(AA_OUT, JSON.stringify(aaOut, null, 2) + '\n');
  fs.writeFileSync(TESTS_OUT, JSON.stringify(testsOut, null, 2) + '\n');
  return { tests, aa, testsOut, aaOut };
}

// ---------------------------------------------------------------------
// Diff printer — what changed and why
// ---------------------------------------------------------------------
function colorArrow(oldG, newG) {
  if (oldG === newG) return ' ';
  return tierIndex(oldG) < tierIndex(newG) ? '↓' : '↑';
}

function printDiff({ tests, aa, testsOut, aaOut }) {
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(' AGENT ACCESSIBILITY');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('PM                            old           new           Δ  reason');
  console.log('-'.repeat(80));
  const aaSorted = Object.entries(aaOut)
    .filter(([, r]) => r._regrade)
    .sort((a, b) => b[1]._regrade.score - a[1]._regrade.score);
  let aaUp = 0, aaDown = 0, aaSame = 0;
  for (const [pm, r] of aaSorted) {
    const oldG = aa[pm].grade, oldS = aa[pm].score;
    const ng = r.grade, ns = r._regrade.score;
    const arr = colorArrow(oldG, ng);
    if (oldG === ng) aaSame++;
    else if (tierIndex(oldG) > tierIndex(ng)) aaUp++;
    else aaDown++;
    const reason = r._regrade.floorReason || '';
    console.log(
      pm.padEnd(28),
      `${oldG} (${oldS}/15)`.padEnd(13),
      `${ng} (${ns}/23)`.padEnd(13),
      arr,
      ' ' + reason
    );
  }
  console.log(`\nAA changes: ${aaUp} up, ${aaDown} down, ${aaSame} unchanged (of ${aaSorted.length})`);

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(' CLI/MCP');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('PM/Tool                                       score    old → new  Δ  reason');
  console.log('-'.repeat(95));
  let cliUp = 0, cliDown = 0, cliSame = 0;
  for (const pm of Object.keys(testsOut.current || {})) {
    const oldTools  = (tests.current[pm] && tests.current[pm]._tools) || [];
    const newTools  = (testsOut.current[pm] && testsOut.current[pm]._tools) || [];
    if (!newTools.length) continue;
    for (let i = 0; i < newTools.length; i++) {
      const oldT = oldTools[i] || {};
      const newT = newTools[i];
      if (!newT._regrade) continue;
      const reg = newT._regrade;
      const oldG = oldT.grade;
      const ng = newT.grade;
      const arr = colorArrow(oldG, ng);
      if (oldG === ng) cliSame++;
      else if (tierIndex(oldG) > tierIndex(ng)) cliUp++;
      else cliDown++;
      const reason = [reg.floorReason, reg.vpnReason].filter(Boolean).join('; ');
      const label = (pm + '/' + newT.tool).slice(0, 44).padEnd(44);
      const sc = (reg.score + '/' + reg.max).padStart(7);
      console.log(label, sc, ' ', `${oldG} → ${ng}`.padEnd(8), arr, ' ' + reason);
    }
  }
  console.log(`\nCLI/MCP changes: ${cliUp} up, ${cliDown} down, ${cliSame} unchanged`);

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(' SKILL');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('PM                            score    old → new  Δ  reason');
  console.log('-'.repeat(85));
  let skUp = 0, skDown = 0, skSame = 0;
  for (const pm of Object.keys(testsOut.current || {})) {
    const oldSk = (tests.current[pm] && tests.current[pm]._skillTools) || [];
    const newSk = (testsOut.current[pm] && testsOut.current[pm]._skillTools) || [];
    if (!newSk.length) continue;
    for (let i = 0; i < newSk.length; i++) {
      const oldS = oldSk[i] || {};
      const newS = newSk[i];
      if (!newS._regrade) continue;
      const reg = newS._regrade;
      const oldG = oldS.grade;
      const ng = newS.grade;
      const arr = colorArrow(oldG, ng);
      if (oldG === ng) skSame++;
      else if (tierIndex(oldG) > tierIndex(ng)) skUp++;
      else skDown++;
      const reason = [reg.floorReason, reg.vpnReason].filter(Boolean).join('; ');
      const sc = (reg.score + '/' + reg.max).padStart(7);
      console.log(pm.padEnd(28), sc, ' ', `${oldG} → ${ng}`.padEnd(8), arr, ' ' + reason);
    }
  }
  console.log(`\nSkill changes: ${skUp} up, ${skDown} down, ${skSame} unchanged`);

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(' FRAMEWORK');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log('PM / Framework                                            old → new            score   type        Δ');
  console.log('-'.repeat(110));
  let fwUp = 0, fwDown = 0, fwSame = 0;
  for (const pm of Object.keys(testsOut.current || {})) {
    const oldFws = (tests.current[pm] && tests.current[pm]._frameworkTools) || [];
    const newFws = (testsOut.current[pm] && testsOut.current[pm]._frameworkTools) || [];
    if (!newFws.length) continue;
    for (let i = 0; i < newFws.length; i++) {
      const oldF = oldFws[i] || {};
      const newF = newFws[i];
      if (!newF._regrade) continue;
      const reg = newF._regrade;
      const oldG = oldF.grade;
      const ng = newF.grade;
      const arr = oldG === ng ? ' ' : '↓';
      if (oldG === ng) fwSame++; else fwDown++;
      const label = (pm + ' / ' + newF.name).slice(0, 58).padEnd(58);
      const sc = reg.score == null ? 'N/A' : (reg.score + '/' + reg.max);
      console.log(label, ` ${oldG} → ${ng}`.padEnd(28), sc.padEnd(8), (reg.typeQualifier || '').padEnd(11), arr);
    }
  }
  console.log(`\nFramework changes: ${fwDown} down, ${fwSame} unchanged`);

  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log(' PM-LEVEL CLI/MCP grades (best-of-tools aggregation)');
  console.log('══════════════════════════════════════════════════════════════════');
  for (const [pm, r] of Object.entries(testsOut.current || {})) {
    if (!r.cliMcp) continue;
    const oldG = (tests.current[pm].cliMcp || {}).grade;
    const ng = r.cliMcp.grade;
    if (oldG !== ng) {
      console.log(`  ${pm.padEnd(20)} ${oldG} → ${ng}`);
    }
  }
}

const result = regradeAll();
printDiff(result);
console.log(`\n→ Wrote ${path.relative(ROOT, AA_OUT)}`);
console.log(`→ Wrote ${path.relative(ROOT, TESTS_OUT)}`);
