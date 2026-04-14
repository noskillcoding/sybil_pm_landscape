# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A research project that benchmarks prediction markets (PMs) on how accessible they are to autonomous AI trading agents. There is **no build system, no package.json, no tests** — the "product" is a static dashboard plus a corpus of methodology docs, subagent templates, and raw test results.

## Deploy / run

- **Local preview:** `python3 -m http.server 8765` from the repo root, then open `http://localhost:8765/index.html`.
- **Production deploy:** `npx vercel deploy --prod` (Vercel static hosting). **Note**: as of 2026-04-14 there is no live URL — Vercel deploy was stripped 2026-04-13 and the eventual home is a route in sybil-landing (see below). Active branch is `redesign/terminal-density`.
- **Important:** opening `index.html` via `file://` no longer works. The dashboard uses ES modules and `fetch()` against local JSON files, both of which are CORS-blocked from the `file://` origin. You need an HTTP server.

## Eventual home: sybil.exchange/agentic-research

This repo is destined to live as a route inside [sybil-landing](https://github.com/noskillcoding/sybil-landing) at `https://sybil.exchange/agentic-research` ("Phase 4" of the sybil deployment migration — not done as of 2026-04-14). Plan: drop `assets/`, `data/`, `index.html` into sybil-landing's `public/agentic-research/`. Research artifacts (`methodology/`, `results/`, `templates/`) stay here as the editorial source.

Wider sybil ecosystem (for context):
- [sybil-landing](https://github.com/noskillcoding/sybil-landing) — Next.js apex on Vercel; will host the agentic research dashboard as a route after Phase 4
- [sybil-spike-analysis](https://github.com/noskillcoding/sybil-spike-analysis) — Streamlit dashboard iframed at `sybil.exchange/spike-analysis/dashboard`, static viz at `sybil.exchange/spike-analysis/viz`
- VPS `185.182.185.70`: hosts the spike Streamlit dashboard and Postgres for sybil-landing's `/api/subscribe` and `/admin`. Sybil web traffic otherwise goes through Vercel.

## Architecture

Static directory deployable as-is. `index.html` is a ~130-line shell: `<head>` has a synchronous no-flash theme script + seven `<link>` tags to the CSS files, `<body>` has the static markup for topbar / hero / view containers / footer, and a single `<script type="module" src="./assets/js/main.js">` entry at the end.

### File layout

```
sybil_pm_landscape/
├── index.html                       (~130-line shell)
├── assets/
│   ├── css/
│   │   ├── tokens.css               design tokens (dark + light)
│   │   ├── base.css                 reset, typography, .mono helper
│   │   ├── layout.css               .t-shell, topbar, hero, footer, view visibility
│   │   ├── filters.css              .t-filters, .t-chip, .t-search
│   │   ├── table.css                .t-table, colgroup widths, pills, badges, grades
│   │   ├── detail.css               expanded detail row, tool cards, methodology tabs
│   │   └── responsive.css           tablet + mobile media queries
│   └── js/
│       ├── main.js                  entry point — fetches data, wires everything
│       ├── state.js                 shared mutable UI state object
│       ├── constants.js             TEST_COLS, TOOL_COL_MAP, AA_DIMS, etc.
│       ├── helpers.js                esc, toolPillClass, gradeClass, etc.
│       ├── theme.js                 Theme module (light/dark toggle)
│       ├── sort.js                  Sort module (column sort)
│       ├── router.js                Router module (hash-based state)
│       ├── view.js                  initViewNav, applyViewVisibility, setSubtitle
│       ├── landscape.js             render() for the landscape view
│       └── testing.js               renderTesting() + testing-page helpers
├── data/
│   ├── pms.json                     the 27 PM entries
│   ├── accessibility.json           agent-accessibility test results
│   └── tests.json                   { current, legacy } for cli-mcp / skill / framework tests
├── methodology/                     markdown docs for each of the 4 test categories
├── results/                         raw per-run subagent outputs (historical record)
├── templates/                       subagent instruction templates
├── mocks/a-terminal.html            frozen reference of the chosen visual direction
└── docs/superpowers/                specs + plans for design work
```

**Load order matters for CSS:** tokens first (defines the custom properties), responsive last (media queries override base rules). The seven `<link>` tags in `index.html` are in that order.

**No build step.** CSS and JS are hand-authored and served directly. Data is fetched at runtime from `data/*.json`.

### Runtime flow

1. Browser loads `index.html`.
2. The synchronous `<head>` script sets `data-theme` on `<html>` based on `localStorage.theme` / `prefers-color-scheme` — before any CSS parses, preventing flash.
3. Browser parses the seven `<link>` stylesheets in cascade order.
4. Browser loads `assets/js/main.js` as a module (auto-deferred). The module graph resolves: state → constants → helpers → theme / sort / (router ↔ landscape/testing) → view.
5. `main.js` registers a `DOMContentLoaded` handler.
6. On `DOMContentLoaded`, `boot()` fetches `data/pms.json`, `data/accessibility.json`, `data/tests.json` in parallel, assigns them to `window.DATA / window.AA_RESULTS / window.TEST_RESULTS`, then calls `Theme.init()`, `initViewNav()`, `Router.init()`. Router reads the URL hash and calls `render()` or `renderTesting()` for the appropriate view.

**Why `window` globals?** The `render()` and `renderTesting()` internals historically read `DATA`, `AA_RESULTS`, `TEST_RESULTS` as bare identifiers. ES modules don't share module-scope variables, so `main.js` publishes the fetched data onto `window` to preserve that pattern without refactoring the render internals. `state.js` is the opposite — proper ES module sharing for mutable UI state (`catFilter`, `searchQ`, `currentView`, etc.).

### The four test categories

Each has its own methodology doc, and (except accessibility) its own subagent template. They are independent — a PM can be scored in some categories and not others.

| Category | Methodology | Template | Raw results dir |
|---|---|---|---|
| Agent Accessibility (15 checks) | `methodology/agent-accessibility.md` | — | `results/agent-accessibility/<pm>.json` |
| CLI/MCP Test (18 checks) | `methodology/cli-mcp-test.md` | `templates/cli-mcp/` | `results/cli-mcp/<pm>-{cli,mcp}/` |
| Skill Test (8 milestones) | `methodology/skill-test.md` | `templates/skill/` | `results/skill/<pm>-skill/` |
| Framework Assessment (5 categories) | `methodology/framework-assessment.md` | — | (inlined in `data/tests.json` only) |

### Subagent templates

`templates/cli-mcp/` and `templates/skill/` each contain:
- `instructions.md` — prompt with `{{PLACEHOLDER}}` variables (`{{PM_NAME}}`, `{{TOOL_NAME}}`, `{{CHAIN}}`, `{{AUTH_SETUP}}`, etc.) that you fill in per run.
- `result-schema.json` — JSON schema the subagent must produce.

These are run as live tests against real markets with real money, so the templates enforce: record exact commands, cap tool calls, write `raw-log.md` after each section, never fabricate results.

### Dual source of truth (known issue)

`results/*.json` holds raw per-run subagent outputs (authoritative historical record) and `data/tests.json` / `data/accessibility.json` hold the dashboard's copy. They can drift — updating a raw result file does NOT update the dashboard automatically. When you add or update a test result:

1. Write the raw `result.json` + `raw-log.md` under `results/`.
2. Also hand-copy the relevant scored fields into `data/tests.json` (or `data/accessibility.json`).
3. Verify in the dashboard that the row shows the new grade.

A future improvement would be a tiny node script that rebuilds `data/tests.json` from the raw files, but that's out of scope today.

## Editing rules

- **Changing visual style?** Edit files under `assets/css/`. Each file has one responsibility (see the table above).
- **Changing page interaction?** Edit files under `assets/js/`. `render()` lives in `landscape.js`, `renderTesting()` in `testing.js`. Shared state goes in `state.js`. Helpers in `helpers.js`. Constants in `constants.js`.
- **Changing PM metadata (name, volume, tools, twitter)?** Edit `data/pms.json`. The dashboard picks up the change on next reload.
- **Changing test results?** Edit `data/accessibility.json` or `data/tests.json`. Remember to also update the raw file under `results/` so the historical record stays honest.
- **Adding a new PM?** Append to `data/pms.json`. No code changes needed. `getTestablePMs()` in `testing.js` will automatically include decentralized / play-money PMs with non-empty `coreTools` or `aiTools`.
- **Don't introduce a bundler, framework, or `package.json`** unless explicitly asked — the zero-toolchain static directory is a deliberate choice for a research publication.
