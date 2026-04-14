# Migration: sybil_pm_landscape → sybil-landing

This is a step-by-step migration spec for moving this repo's content into [sybil-landing](https://github.com/noskillcoding/sybil-landing) at `https://sybil.exchange/agentic-research`. Written 2026-04-14 against the state of both repos on that date.

**Read this end to end before starting**. The spec is designed to be runnable by either you or a future Claude Code session — every file in this repo is accounted for, and anything that doesn't have a clean destination is preserved under a `legacy/` folder rather than deleted. **No data loss should be possible** if you follow the steps in order.

---

## Goals

1. **Serve the dashboard at `https://sybil.exchange/agentic-research`** as static content from sybil-landing's `public/` directory (Option B from the original migration plan — drop-in static blob, no Next.js rewrite).
2. **Preserve all research artifacts** (methodology, raw subagent outputs, prompt templates, regrading scripts) somewhere accessible — not in `public/` (would be world-readable in a way that's confusing), but in a `research/` directory at the sybil-landing repo root.
3. **Preserve all dev/historical artifacts** (mocks, planning docs, prior README) under `legacy/sybil-pm-landscape/` in sybil-landing rather than deleting.
4. **No data loss**. Everything in this repo ends up somewhere in sybil-landing, except for transient/system files (`.DS_Store`, `.git`, `.playwright-mcp`, `.vercel`, `node_modules`).
5. **Original repo stays untouched** during the migration so it acts as the rollback. After verification, the user decides whether to archive it.

---

## Pre-flight (do BEFORE moving anything)

### P-1. Decide source of truth for editing

After migration, when you (or a future agent) add a new test result, the edits happen **in sybil-landing**, not here. Specifically:

- `data/{pms,accessibility,tests}.json` → edit in `sybil-landing/public/agentic-research/data/`
- `methodology/*.md` → edit in `sybil-landing/research/agentic-research/methodology/`
- `results/<category>/<pm>/...` → write in `sybil-landing/research/agentic-research/results/`
- Then commit + push sybil-landing + redeploy

This decision is **already locked in** by this migration. If you'd rather keep editing in a separate repo and sync to sybil-landing, stop and write a different spec. The rest of this doc assumes single-repo source of truth.

### P-2. Verify sybil-landing's existing apex files

The agent must NOT blindly overwrite these. Read them first to know what to merge into:

```bash
cat "/Users/r/pr/Sybil frontend/public/robots.txt"
cat "/Users/r/pr/Sybil frontend/public/sitemap.xml"
cat "/Users/r/pr/Sybil frontend/public/llms.txt"
```

You'll merge our `robots.txt`, `sitemap.xml`, `llms.txt` INTO these in step 6 — not replace.

### P-3. Branch the work

In sybil-landing, work on a feature branch:

```bash
cd "/Users/r/pr/Sybil frontend"
git checkout main && git pull
git checkout -b feat/agentic-research-route
```

All file moves and edits below land on this branch. Final step is a PR + merge + Vercel deploy.

---

## File-by-file destination map

This is **the complete inventory** of `/Users/r/pr/sybil_pm_landscape/`. Every entry has a destination. Nothing is deleted unless explicitly marked `DELETE` with a safe rationale.

### Browser content → `sybil-landing/public/agentic-research/`

| Source | Destination |
|---|---|
| `index.html` | `public/agentic-research/index.html` |
| `assets/css/base.css` | `public/agentic-research/assets/css/base.css` |
| `assets/css/tokens.css` | `public/agentic-research/assets/css/tokens.css` |
| `assets/css/layout.css` | `public/agentic-research/assets/css/layout.css` |
| `assets/css/filters.css` | `public/agentic-research/assets/css/filters.css` |
| `assets/css/table.css` | `public/agentic-research/assets/css/table.css` |
| `assets/css/detail.css` | `public/agentic-research/assets/css/detail.css` |
| `assets/css/responsive.css` | `public/agentic-research/assets/css/responsive.css` |
| `assets/css/methodology.css` | `public/agentic-research/assets/css/methodology.css` |
| `assets/css/summary.css` | `public/agentic-research/assets/css/summary.css` |
| `assets/js/main.js` | `public/agentic-research/assets/js/main.js` |
| `assets/js/state.js` | `public/agentic-research/assets/js/state.js` |
| `assets/js/constants.js` | `public/agentic-research/assets/js/constants.js` |
| `assets/js/helpers.js` | `public/agentic-research/assets/js/helpers.js` |
| `assets/js/theme.js` | `public/agentic-research/assets/js/theme.js` |
| `assets/js/sort.js` | `public/agentic-research/assets/js/sort.js` |
| `assets/js/router.js` | `public/agentic-research/assets/js/router.js` |
| `assets/js/view.js` | `public/agentic-research/assets/js/view.js` |
| `assets/js/landscape.js` | `public/agentic-research/assets/js/landscape.js` |
| `assets/js/testing.js` | `public/agentic-research/assets/js/testing.js` |
| `assets/js/methodology.js` | `public/agentic-research/assets/js/methodology.js` |
| `assets/js/summary.js` | `public/agentic-research/assets/js/summary.js` |
| `assets/js/ai-copy.js` | `public/agentic-research/assets/js/ai-copy.js` |
| `assets/img/sybil-mark.png` | `public/agentic-research/assets/img/sybil-mark.png` |
| `data/pms.json` | `public/agentic-research/data/pms.json` |
| `data/tests.json` | `public/agentic-research/data/tests.json` |
| `data/accessibility.json` | `public/agentic-research/data/accessibility.json` |

### Domain-wide files → MERGE (do not overwrite)

| Source | Action | Destination |
|---|---|---|
| `robots.txt` | **MERGE** | `sybil-landing/public/robots.txt` — keep sybil-landing's existing rules; ensure `/agentic-research/` is allowed; if there's a `Sitemap:` line, leave it |
| `sitemap.xml` | **MERGE** | `sybil-landing/public/sitemap.xml` — append `<url>` entries for `/agentic-research` and any subpaths your sitemap.xml currently lists; preserve sybil-landing's existing entries |
| `llms.txt` | **MERGE** | `sybil-landing/public/llms.txt` — append a section describing the agentic research dashboard; preserve sybil-landing's existing content |

**If you can't easily merge, fall back to**: copy ours under a section header `## Agentic Research` in each file, leaving sybil-landing's content above untouched.

### Research artifacts → `sybil-landing/research/agentic-research/`

These are NOT browser content. They live OUTSIDE `public/` so they're not served as static files (Vercel only serves `public/`). They stay editable in the same repo.

| Source | Destination |
|---|---|
| `methodology/agent-accessibility.md` | `research/agentic-research/methodology/agent-accessibility.md` |
| `methodology/cli-mcp-test.md` | `research/agentic-research/methodology/cli-mcp-test.md` |
| `methodology/skill-test.md` | `research/agentic-research/methodology/skill-test.md` |
| `methodology/framework-assessment.md` | `research/agentic-research/methodology/framework-assessment.md` |
| `results/agent-accessibility/**` | `research/agentic-research/results/agent-accessibility/**` (preserve full directory tree) |
| `results/cli-mcp/**` | `research/agentic-research/results/cli-mcp/**` |
| `results/skill/**` | `research/agentic-research/results/skill/**` |
| `templates/cli-mcp/instructions.md` | `research/agentic-research/templates/cli-mcp/instructions.md` |
| `templates/cli-mcp/result-schema.json` | `research/agentic-research/templates/cli-mcp/result-schema.json` |
| `templates/skill/instructions.md` | `research/agentic-research/templates/skill/instructions.md` |
| `templates/skill/result-schema.json` | `research/agentic-research/templates/skill/result-schema.json` |
| `scripts/regrade.js` | `research/agentic-research/scripts/regrade.js` |

### Historical / dev / planning artifacts → `sybil-landing/legacy/sybil-pm-landscape/`

Not actively used, but preserved for history. The `legacy/` directory is also outside `public/` so it's not served.

| Source | Destination |
|---|---|
| `mocks/a-terminal.html` | `legacy/sybil-pm-landscape/mocks/a-terminal.html` |
| `docs/superpowers/plans/2026-04-12-frontend-redesign.md` | `legacy/sybil-pm-landscape/docs/superpowers/plans/2026-04-12-frontend-redesign.md` |
| `docs/superpowers/plans/2026-04-13-restructure.md` | `legacy/sybil-pm-landscape/docs/superpowers/plans/2026-04-13-restructure.md` |
| `docs/superpowers/specs/2026-04-12-frontend-redesign-design.md` | `legacy/sybil-pm-landscape/docs/superpowers/specs/2026-04-12-frontend-redesign-design.md` |
| `README.md` | `legacy/sybil-pm-landscape/README.md` |
| `CLAUDE.md` | `legacy/sybil-pm-landscape/CLAUDE.md` (the relevant runtime info has already been merged into `sybil-landing/CLAUDE.md`; this copy is for history) |
| `MIGRATION.md` (this file) | `legacy/sybil-pm-landscape/MIGRATION.md` (history of HOW the migration was done) |

### Delete (safe — transient or system noise)

| Source | Why safe to delete |
|---|---|
| `.git/` | sybil-landing has its own `.git` — this would conflict |
| `.gitignore` | sybil-landing has its own |
| `.nojekyll` | GitHub Pages relic, irrelevant on Vercel |
| `.playwright-mcp/` | Already gitignored; transient screenshots/logs from local Claude sessions |
| `.vercel/` (if exists) | repo-specific Vercel link; sybil-landing has its own |
| `node_modules/` (if exists) | not present, but if it is — never committed |
| `.DS_Store` (anywhere) | macOS noise |
| `data/*.regraded.json` (gitignored) | transient regrade output |

**Everything else in this repo is accounted for above.** If you find a file not listed, default behavior: copy to `legacy/sybil-pm-landscape/<original-path>`.

---

## Code edits required after the file move

These are **all** the in-file edits. Do them in this order.

### E-1. `public/agentic-research/index.html`

This file has absolute paths and metadata that need a `/agentic-research` prefix added.

1. **JSON-LD `contentUrl`** (search for `contentUrl`): change paths like `/data/pms.json` → `/agentic-research/data/pms.json`. There are 3: `pms.json`, `accessibility.json`, `tests.json`.

2. **Canonical URL** (search for `<link rel="canonical"`): if it's not already removed, change to `https://sybil.exchange/agentic-research`.

3. **Open Graph URL** (search for `og:url`): change to `https://sybil.exchange/agentic-research`.

4. **Any `href="/data/...` or `href="/methodology/..."` or `src="/assets/..."`**: the convention in this repo's index.html is `./data/...` (relative), so this should mostly NOT need changes — but verify. Anything that starts with `/` (root-relative) needs `/agentic-research` prefixed.

5. **`llms.txt` link**: search for `llms.txt`; the link should point at `/agentic-research/llms.txt` (a copy of our llms.txt that lives under the agentic-research route — see step E-3) **OR** at the merged apex `/llms.txt`. Decide which is canonical for the dashboard. Recommended: keep both, the agentic-research one being a focused subset.

### E-2. `public/agentic-research/assets/js/ai-copy.js`

This script builds clipboard text containing URLs. Search for any hardcoded paths like `/data/...`, `/methodology/...`, `${SITE_URL}/data`. They all need `/agentic-research` prefixed.

Specifically (based on the version as of 2026-04-14, lines 56–70):

```javascript
`- ${SITE_URL}/#/methodology — formulas, floor rules, grade buckets.`,
`- ${SITE_URL}/methodology/agent-accessibility.md`,
`- ${SITE_URL}/methodology/cli-mcp-test.md`,
`- ${SITE_URL}/methodology/skill-test.md`,
`- ${SITE_URL}/methodology/framework-assessment.md`,
```

After migration, `${SITE_URL}` is `https://sybil.exchange` and these need to become:

```javascript
`- ${SITE_URL}/agentic-research/#/methodology — formulas, floor rules, grade buckets.`,
`- ${SITE_URL}/agentic-research/methodology/agent-accessibility.md`,
// ... etc
```

**Important**: the `methodology/*.md` files won't actually exist at `/agentic-research/methodology/*` (they're in `research/` outside `public/`). Two choices:

- **(a)** Also copy the methodology .md files into `public/agentic-research/methodology/` so the AI-copy URLs resolve. The `research/` dir becomes the editorial source; `public/agentic-research/methodology/` is a runtime-served mirror that needs re-syncing when methodology changes. (Same pattern as the spike static mirror.)
- **(b)** Drop the URLs from `ai-copy.js` and inline the methodology content into the clipboard text directly.

**Recommended: (a)**. Add a step E-2.5 below.

### E-2.5. Mirror methodology .md files into `public/agentic-research/methodology/`

```bash
mkdir -p public/agentic-research/methodology
cp research/agentic-research/methodology/*.md public/agentic-research/methodology/
```

These are duplicates by design — the canonical editing location is `research/`, the public copies are for the dashboard's "Give it to your AI" feature and for direct browser access via `https://sybil.exchange/agentic-research/methodology/agent-accessibility.md`. After any edit to `research/agentic-research/methodology/*.md`, manually re-run the cp.

(A future improvement: a tiny build script that copies on prebuild. Out of scope for this migration.)

### E-3. `public/agentic-research/llms.txt` (if you keep a separate copy)

If you decided in E-1 to keep a focused `llms.txt` under `/agentic-research/`, search it for any path references and update them to be `/agentic-research/...` rooted.

If the dashboard's `llms.txt` is fully merged into the apex (no separate copy), skip this step.

### E-4. `sybil-landing/public/robots.txt`

Read the existing file. Verify:
- Default `User-agent: *` rule does NOT disallow `/agentic-research/`
- If there's a `Sitemap:` line, it points at the apex sitemap (which now includes our entries — see E-5)
- If our repo's `robots.txt` had any User-agent specific rules (read it: `/Users/r/pr/sybil_pm_landscape/robots.txt`), merge them in

### E-5. `sybil-landing/public/sitemap.xml`

Read the existing file. Append `<url>` entries from our `sitemap.xml`. Preserve the existing entries. Keep one canonical sitemap at the apex; do NOT create `/agentic-research/sitemap.xml`.

If our sitemap had `https://TODO.invalid/...` placeholders (it did at one point), replace with `https://sybil.exchange/agentic-research/...`.

### E-6. `sybil-landing/public/llms.txt`

Read the existing file. Append a section like:

```
## Agentic Research Dashboard
URL: https://sybil.exchange/agentic-research
What it is: Benchmarks 27+ prediction markets on how accessible they are to autonomous AI trading agents. Four test categories: agent accessibility, CLI/MCP, skill, framework assessment.
Data files (JSON):
- https://sybil.exchange/agentic-research/data/pms.json
- https://sybil.exchange/agentic-research/data/accessibility.json
- https://sybil.exchange/agentic-research/data/tests.json
Methodology docs:
- https://sybil.exchange/agentic-research/methodology/agent-accessibility.md
- https://sybil.exchange/agentic-research/methodology/cli-mcp-test.md
- https://sybil.exchange/agentic-research/methodology/skill-test.md
- https://sybil.exchange/agentic-research/methodology/framework-assessment.md
```

(Borrow the section's wording from our existing `llms.txt` for accuracy.)

### E-7. `sybil-landing/CLAUDE.md`

Add a new section after the existing **Spike-analysis routing** section:

```markdown
### Agentic-research routing

The agentic research dashboard (originally [sybil_pm_landscape](https://github.com/noskillcoding/sybil_pm_landscape), migrated <DATE>) is a static blob under `public/agentic-research/`. Routes:

- `/agentic-research` → `public/agentic-research/index.html`
- `/agentic-research/data/*.json` → fetched at runtime by `assets/js/main.js`
- `/agentic-research/methodology/*.md` → mirror of `research/agentic-research/methodology/` for the "Give it to your AI" feature (manual re-sync after editing methodology)

Editorial source: `research/agentic-research/` (outside `public/`). Edit methodology, results, templates, regrade scripts there. Browser-served mirrors: `public/agentic-research/data/` for JSON data, `public/agentic-research/methodology/` for .md files.
```

Update the **Key paths** section:

```markdown
- `public/agentic-research/` — Static dashboard (assets, data, methodology mirror)
- `research/agentic-research/` — Editorial source: methodology, results, templates, regrade scripts (NOT served)
- `legacy/sybil-pm-landscape/` — Historical artifacts from the original sybil_pm_landscape repo (mocks, planning docs, old README)
```

---

## Verification checklist (run after deploying to Vercel)

Run each curl. Expected results in the right column.

| Check | Expected |
|---|---|
| `curl -sI https://sybil.exchange/agentic-research` | `200`, `content-type: text/html` |
| `curl -s https://sybil.exchange/agentic-research \| grep '<title>'` | dashboard title |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/agentic-research/data/pms.json` | `200` |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/agentic-research/data/accessibility.json` | `200` |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/agentic-research/data/tests.json` | `200` |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/agentic-research/methodology/agent-accessibility.md` | `200` |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/agentic-research/assets/js/main.js` | `200` |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/agentic-research/assets/css/tokens.css` | `200` |
| `curl -sI https://sybil.exchange/` | `200` (or redirect to www) — apex landing unaffected |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/spike-analysis` | `200` — spike landing unaffected |
| `curl -s -o /dev/null -w "%{http_code}\n" https://sybil.exchange/spike-analysis/dashboard` | `200` — spike dashboard unaffected |
| `curl -sI https://sybil.exchange/robots.txt` | `200`, content includes both apex and agentic-research entries |
| `curl -sI https://sybil.exchange/sitemap.xml` | `200`, contains apex + agentic-research URLs |

**Browser smoke test** (open `https://sybil.exchange/agentic-research` in a browser):

- [ ] Dashboard renders without console errors
- [ ] All four nav tabs work: Landscape, Summary, Testing, Methodology
- [ ] Hash routing changes the URL (`#/methodology`, etc.) without page reload
- [ ] Theme toggle (light/dark) works
- [ ] Search/filter chips on the Landscape tab work
- [ ] PM detail row expands when clicking a row
- [ ] "Give it to your AI" button copies text containing valid `https://sybil.exchange/agentic-research/...` URLs
- [ ] Methodology page renders the markdown content correctly

If anything fails: check the browser Network tab for 404s. The most likely culprit is a missed absolute path that should have been prefixed with `/agentic-research`.

---

## After verification: archive the original repo

1. Make sure sybil-landing's `feat/agentic-research-route` PR is merged and the prod deploy is verified (above checklist).
2. Edit `/Users/r/pr/sybil_pm_landscape/README.md` to add at the very top:
   ```markdown
   # ⚠️ Migrated to sybil-landing

   This repo's content has been migrated into [sybil-landing](https://github.com/noskillcoding/sybil-landing) at `public/agentic-research/` (browser content), `research/agentic-research/` (methodology, results, templates), and `legacy/sybil-pm-landscape/` (historical files). The live site is at https://sybil.exchange/agentic-research. This repo is now archived.
   ```
3. Commit + push.
4. On GitHub: Settings → Archive repository.

**Do NOT delete the repo.** It's the historical record. Archiving makes it read-only on GitHub but preserves it forever.

---

## Rollback

If something breaks after deploying the migration to prod, you have multiple recovery paths:

1. **Vercel rollback**: in the sybil-landing Vercel dashboard, click "Promote to Production" on the previous deployment. Reverts in seconds. The agentic-research route disappears; everything else is restored.

2. **Git revert**: `git revert <merge-commit>` on sybil-landing's main branch. Push. Vercel auto-deploys.

3. **Original repo**: this repo (`sybil_pm_landscape`) is unchanged on GitHub during the migration — it's still there as a complete copy of everything. Worst case, you can clone it again and run the migration differently.

4. **`legacy/sybil-pm-landscape/` in sybil-landing**: even after archive, the historical artifacts live in sybil-landing under `legacy/`. Nothing is permanently lost.

---

## What this spec does NOT do

To keep scope clear:

- ❌ Does not set up a build step or sync automation. Methodology files and data files have to be manually copied between `research/` and `public/agentic-research/` after edits. A future improvement could automate this with a pre-commit hook or pre-build script, but it's out of scope here.
- ❌ Does not rewrite the dashboard as Next.js components (Option A from the original migration plan). The static blob approach is faster and equally functional.
- ❌ Does not move the dashboard's CSS to share design tokens with the Next.js landing. They live side by side, isolated by URL prefix.
- ❌ Does not update the dashboard's HTML/CSS/JS to remove the GH-Pages-era `.nojekyll` references or other historical baggage. The dashboard is moved as-is.
- ❌ Does not migrate the sybil_pm_landscape repo's git history into sybil-landing. The files are copied; commit history of the original repo lives only in the archived repo.
- ❌ Does not handle the case where someone has unmerged work on `redesign/terminal-density` or another branch in this repo. Pull and merge to main first, or do the migration FROM the redesign branch (the file paths are the same).

---

## TL;DR for an executing agent

If you're an LLM agent reading this:

1. **Don't touch sybil_pm_landscape.** All file moves are COPIES into sybil-landing. Original stays as backup.
2. **Three destinations** in sybil-landing: `public/agentic-research/` (browser), `research/agentic-research/` (editorial), `legacy/sybil-pm-landscape/` (history).
3. **Three files to merge, not overwrite**: `robots.txt`, `sitemap.xml`, `llms.txt` — all under `sybil-landing/public/`.
4. **One CLAUDE.md to extend**: `sybil-landing/CLAUDE.md` (add an "Agentic-research routing" section after the existing "Spike-analysis routing" section).
5. **Code edits** in 7 places — all listed in the **Code edits** section above. The most error-prone is the JSON-LD `contentUrl` paths in `index.html` and the URL construction in `ai-copy.js`.
6. **Verify** with the curl checklist + browser smoke test in the **Verification** section.
7. **Archive** the original repo on GitHub only after the deploy is verified.

If you're unsure whether to delete or move something: **always move to `legacy/sybil-pm-landscape/`**. Disk space is cheap, lost data is not.
