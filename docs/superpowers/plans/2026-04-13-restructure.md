# Restructure: split the 4000-line index.html into a proper static site

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert the current single-file `index.html` (~4000 lines of markup + inlined CSS + inlined JS + inlined data) into a properly-organized static site with split CSS, ES-module JS, and JSON data files — while keeping the zero-toolchain deploy story (no `package.json`, no bundler, no `node_modules`).

**Architecture:** Static directory. `index.html` becomes a ~200-line shell with `<link>` to CSS files and a single `<script type="module" src="./assets/js/main.js">` entry. `main.js` async-fetches `./data/*.json` at boot, then wires up the feature modules (theme, router, sort, view, landscape, testing) against the fetched data. All mutable UI state lives in a single `state.js` module imported by the feature modules that need it. No build step, no framework, no dependency graph outside of relative path imports between the hand-written files.

**Tech stack:** Plain HTML5 + modern CSS (custom properties, `@media`, `color-mix`) + ES2020 modules. Served via `python3 -m http.server` for local dev and `npx vercel deploy --prod` for production — both already established in CLAUDE.md.

**Constraint: no build step.** This means:
- `<script type="module">` is the only loading mechanism for code. Classic scripts stay only for the synchronous no-flash theme bootstrap.
- Data is fetched at runtime via `fetch('./data/pms.json')` etc. — not imported as modules (`import data from './data/pms.json' assert { type: 'json' }` is still experimental and poorly supported).
- `file://` origin will NOT work for the dev page because ES modules and `fetch` are both CORS-blocked there. This is a minor regression from the current single-file (which also relies on a server for the password gate to persist sessionStorage, so the effective change for the user is zero). Document the server requirement in CLAUDE.md.
- No minification. Wire size grows by ~20% relative to today because we add some repeated strings and whitespace — negligible.

**Target file structure:**

```
sybil_pm_landscape/
├── index.html                       (~200 lines — head + body shell)
├── assets/
│   ├── css/
│   │   ├── tokens.css               (design tokens dark + light)
│   │   ├── base.css                 (reset, typography, .mono helper)
│   │   ├── layout.css               (.t-shell, topbar, hero, footer, view visibility)
│   │   ├── filters.css              (.t-filters, .t-chip, .t-search, .t-results-count)
│   │   ├── table.css                (.t-table, colgroup widths, row cells, pills, badges, grades)
│   │   ├── detail.css               (expanded detail row, tool cards, .t-dt-*, methodology tab strip inside detail)
│   │   └── responsive.css           (tablet + mobile media queries)
│   └── js/
│       ├── main.js                  (bootstrap — fetches data, wires everything, keyboard shortcuts)
│       ├── state.js                 (shared mutable UI state object)
│       ├── constants.js             (TEST_COLS, TOOL_COL_MAP, AA_DIMS, AA_TOTAL_CHECKS)
│       ├── helpers.js               (esc, toolPillClass, toolPillLabel, gradeClass)
│       ├── theme.js                 (Theme module)
│       ├── router.js                (Router module)
│       ├── sort.js                  (Sort module)
│       ├── view.js                  (initViewNav, applyViewVisibility, setSubtitle)
│       ├── landscape.js             (render() + getFiltered() + landscape event wiring)
│       └── testing.js               (renderTesting() + getTestablePMs + pmToolsByCol + testing filter handlers)
├── data/
│   ├── pms.json                     (the DATA array)
│   ├── accessibility.json           (AA_RESULTS)
│   └── tests.json                   ({ current: TEST_RESULTS, legacy: TEST_RESULTS_LEGACY })
├── CLAUDE.md                        (updated — new structure, server requirement)
├── README.md                        (unchanged)
├── methodology/                     (unchanged)
├── results/                         (unchanged — still the authoritative raw test outputs)
├── templates/                       (unchanged)
├── mocks/a-terminal.html            (unchanged — frozen reference)
└── docs/                            (unchanged)
```

**Migration ordering.** Each phase is a standalone commit that leaves the site fully functional. Order is chosen so the biggest line removals happen first and the riskiest swap (ES modules) happens last with the smallest surface area.

- **Phase 1:** Extract JSON data. Removes ~2500 lines from `index.html` with negligible risk (data-only, same inline JS still consumes it via window globals after fetch).
- **Phase 2:** Extract CSS. Removes ~600 lines. Medium risk (CSS load order, no-flash timing) but each file is a direct lift.
- **Phase 3:** Extract JS to ES modules. Removes ~900 lines. Highest risk — the swap replaces the entire inline script block with a single `<script type="module">`. Mitigated by creating all module files first, then doing the swap in one atomic commit.
- **Phase 4:** Delete dead code (static methodology reference panel hidden since Phase 5 of the original redesign, plus any leftover legacy classes).
- **Phase 5:** Update `CLAUDE.md`.

**Verification model:** No test framework exists. Every task ends with refreshing `http://localhost:8765/index.html` and doing visual + interaction smoke checks: theme toggle, filter chips, search, sort, row expand, URL hash, testing tab, mobile breakpoint. The plan lists specific things to confirm per task.

---

## Phase 1 — Extract JSON data

### Task 1: Create data/ directory and extract the PM data

Removes `const DATA = [...]` from `index.html` (~1600 lines) and replaces it with a runtime fetch.

**Files:**
- Create: `/Users/r/pr/sybil_pm_landscape/data/pms.json`
- Modify: `/Users/r/pr/sybil_pm_landscape/index.html` (delete the DATA const, add fetch bootstrap)

- [ ] **Step 1: Create the data directory**

```bash
mkdir -p /Users/r/pr/sybil_pm_landscape/data
```

- [ ] **Step 2: Extract DATA into data/pms.json**

Find the `const DATA = [` line in `index.html` (grep: `grep -n 'const DATA = \[' index.html`). Let N = the starting line number. Find the closing `];` line of that const (it's the line right before `let catFilter` or similar variable declaration). Let M = the ending line number.

Read the block from lines N to M. The content is `const DATA = [ /* array */ ];`. Strip the `const DATA = ` prefix and the trailing `;`. The remaining content is a valid JSON array — write it to `data/pms.json` exactly as-is, preserving field order.

```bash
# Example shape — do NOT run this literally, use Read + Write tools instead
# data/pms.json should be a JSON array: [ {"name": "Polymarket", ...}, ... ]
```

- [ ] **Step 3: Delete the const DATA = [...]; block from index.html**

Use Edit to remove the exact range (N through M inclusive) from `index.html`.

- [ ] **Step 4: Add the fetch bootstrap block to index.html**

Locate the `window.addEventListener('DOMContentLoaded', ...)` line in the inline `<script>` block. Replace it with:

```js
async function boot() {
  const [pms, aa, tests] = await Promise.all([
    fetch('./data/pms.json').then(r => r.json()),
    fetch('./data/accessibility.json').then(r => r.json()),
    fetch('./data/tests.json').then(r => r.json())
  ]);
  window.DATA = pms;
  window.AA_RESULTS = aa;
  window.TEST_RESULTS = tests.current || tests;
  window.TEST_RESULTS_LEGACY = tests.legacy || null;
  Theme.init();
  initViewNav();
  Router.init();
}
window.addEventListener('DOMContentLoaded', boot);
```

Note: `window.DATA = pms` exposes the fetched data as a global, which the existing inline `render()` / `renderTesting()` code already expects (they reference `DATA` directly). After Phase 3 this becomes a proper module import, but for Phase 1 we keep the code unchanged by using a window global.

Important: the references in existing code are `DATA`, not `window.DATA` — that still works because `DATA` in a function body resolves to `window.DATA` if no local variable shadows it, as long as nothing else declared `let DATA`. Verify by grep: `grep -n 'let DATA\|var DATA\|const DATA' index.html` should return zero matches after the deletion in Step 3.

- [ ] **Step 5: Verify**

```bash
curl -sI http://localhost:8765/index.html | head -1
```
Expected: `HTTP/1.0 200 OK`.

```bash
curl -sI http://localhost:8765/data/pms.json | head -1
```
Expected: `HTTP/1.0 200 OK`.

Open `http://localhost:8765/index.html` in the browser. Expected:
- Page loads normally (landscape table populated with 27 PMs).
- Click a row → detail row expands with correct tool data.
- Filter chips work.
- No console errors.

- [ ] **Step 6: Commit**

```bash
git add data/pms.json index.html
git commit -m "Extract DATA array to data/pms.json + runtime fetch

Remove the ~1600-line inline const DATA = [...] block from
index.html and replace it with a fetch('./data/pms.json') call
inside an async boot handler. window.DATA preserves the global
the existing render code expects; the proper module import will
happen in Phase 3."
```

---

### Task 2: Extract AA_RESULTS and TEST_RESULTS

**Files:**
- Create: `/Users/r/pr/sybil_pm_landscape/data/accessibility.json`
- Create: `/Users/r/pr/sybil_pm_landscape/data/tests.json`
- Modify: `/Users/r/pr/sybil_pm_landscape/index.html`

- [ ] **Step 1: Extract AA_RESULTS**

Grep for `const AA_RESULTS = {`. Let N = its line number, M = the closing `};` line. Extract the object body (everything between `{` and `}` inclusive, but not `const AA_RESULTS = ` and not `;`) — that's the content for `data/accessibility.json`.

Write the content to `data/accessibility.json` as a valid JSON object. **Important:** the current inline object uses JS identifier keys (no quotes around `'Polymarket'` style keys) and some string values with template-literal-like syntax. You must convert to strict JSON:
- All property names in double quotes
- All string values in double quotes (no single quotes)
- No trailing commas
- No JS comments

If the inline content is already JSON-valid (all keys and values double-quoted), use it as-is.

- [ ] **Step 2: Extract TEST_RESULTS + TEST_RESULTS_LEGACY into tests.json**

Grep for `const TEST_RESULTS = {` and `const TEST_RESULTS_LEGACY = {`. Extract both object bodies. Write to `data/tests.json` with this structure:

```json
{
  "current": { /* TEST_RESULTS body */ },
  "legacy": { /* TEST_RESULTS_LEGACY body */ }
}
```

Apply the same JSON-validity conversion as Step 1.

- [ ] **Step 3: Delete both const blocks from index.html**

Use Edit to remove the `const AA_RESULTS = {...};` and `const TEST_RESULTS = {...};` and `const TEST_RESULTS_LEGACY = {...};` blocks.

- [ ] **Step 4: Verify the boot block already assigns them**

The Task 1 boot block already does `window.AA_RESULTS = aa;` and `window.TEST_RESULTS = tests.current || tests;`. Confirm those lines exist and are correct.

- [ ] **Step 5: Verify**

```bash
curl -sI http://localhost:8765/data/accessibility.json | head -1
curl -sI http://localhost:8765/data/tests.json | head -1
node -e 'JSON.parse(require("fs").readFileSync("data/accessibility.json"))' && echo "accessibility.json parses ok"
node -e 'JSON.parse(require("fs").readFileSync("data/tests.json"))' && echo "tests.json parses ok"
```

All four should succeed.

Open the page. Click the `testing` tab. Expected:
- Testing table populated (18 testable PMs)
- Grade badges render correctly (A/B/C/D/F colored)
- Click Polymarket → detail row expands with AA + CLI/MCP + Skill + Framework methodology tabs
- No console errors

- [ ] **Step 6: Commit**

```bash
git add data/accessibility.json data/tests.json index.html
git commit -m "Extract AA_RESULTS and TEST_RESULTS to data/ JSON files

AA_RESULTS → data/accessibility.json
TEST_RESULTS + TEST_RESULTS_LEGACY → data/tests.json (with
'current' and 'legacy' top-level keys). Boot handler already
assigns them to window globals for backward compat with the
inline render code."
```

---

## Phase 2 — Extract CSS

### Task 3: Create css directory and split the stylesheet

Moves the entire `<style>` block (lines ~19–618 in the current file, will have shifted) out of `index.html` into seven stylesheet files under `assets/css/`. Replaces the `<style>` block with `<link rel="stylesheet">` tags.

**Files:**
- Create: `/Users/r/pr/sybil_pm_landscape/assets/css/tokens.css`
- Create: `/Users/r/pr/sybil_pm_landscape/assets/css/base.css`
- Create: `/Users/r/pr/sybil_pm_landscape/assets/css/layout.css`
- Create: `/Users/r/pr/sybil_pm_landscape/assets/css/filters.css`
- Create: `/Users/r/pr/sybil_pm_landscape/assets/css/table.css`
- Create: `/Users/r/pr/sybil_pm_landscape/assets/css/detail.css`
- Create: `/Users/r/pr/sybil_pm_landscape/assets/css/responsive.css`
- Modify: `/Users/r/pr/sybil_pm_landscape/index.html`

**Splitting guide** — the current `<style>` block has section header comments that map cleanly to the target files. For each destination file, extract the corresponding section(s) verbatim and write them to the new file. Do not modify any rule.

| Destination file | Sections to extract (match the comment headings in the current `<style>` block) |
|---|---|
| `tokens.css` | `/* --- Design tokens --- */` through the end of the `[data-theme="light"]` block |
| `base.css` | `/* --- Reset --- */` block |
| `layout.css` | `/* --- Layout shell --- */`, `/* --- Topbar --- */`, `/* --- Hero --- */`, `/* --- Footer --- */`, and `/* --- View visibility --- */` |
| `filters.css` | `/* --- Filters --- */` block |
| `table.css` | `/* --- Stable table layout --- */`, `/* --- Table base --- */`, `/* --- Tool pills --- */`, `/* --- Testing grade badges --- */`, and all `#pmTable`/`#testTable` alignment rules |
| `detail.css` | `/* --- Expanded detail row (Landscape) --- */`, `/* --- Testing detail row --- */`, and `/* --- Hide legacy static methodology panel on testing view --- */` |
| `responsive.css` | `@media (max-width: 1023px)` and `@media (max-width: 639px)` blocks |

- [ ] **Step 1: Create assets/css/ and write all seven files**

```bash
mkdir -p /Users/r/pr/sybil_pm_landscape/assets/css
```

For each destination file: Read the corresponding section(s) from `index.html`, Write to the target CSS file exactly as-is. Do not add or remove whitespace, comments, or rules.

If any rule doesn't fit cleanly into one of the seven files, put it in the closest fit. The seven files above should collectively cover every rule in the current `<style>` block.

- [ ] **Step 2: Replace the `<style>` block in index.html with link tags**

Find the `<style>` line and `</style>` line in `index.html`. Replace the entire block with:

```html
<link rel="stylesheet" href="./assets/css/tokens.css">
<link rel="stylesheet" href="./assets/css/base.css">
<link rel="stylesheet" href="./assets/css/layout.css">
<link rel="stylesheet" href="./assets/css/filters.css">
<link rel="stylesheet" href="./assets/css/table.css">
<link rel="stylesheet" href="./assets/css/detail.css">
<link rel="stylesheet" href="./assets/css/responsive.css">
```

**Order matters:** tokens must come first (other files reference `var(--bg)` etc). responsive must come last (media queries override base rules). The order above is the only correct one.

- [ ] **Step 3: Confirm the no-flash theme script is BEFORE the link tags**

The inline `<script>` in `<head>` that sets `data-theme` on `<html>` must execute before any stylesheet parses. It's synchronous by default (no `defer`, no `async`). Locate it and confirm it precedes the seven `<link>` tags. If it doesn't, move it up.

- [ ] **Step 4: Verify**

```bash
for f in tokens base layout filters table detail responsive; do
  curl -sI "http://localhost:8765/assets/css/$f.css" | head -1
done
```
All seven should return `HTTP/1.0 200 OK`.

Open `http://localhost:8765/index.html`. Hard-refresh (Cmd+Shift+R) to bypass cache. Expected:
- Page renders identically to before — all chrome, colors, fonts, borders intact.
- Theme toggle (◐) works, flips dark ↔ light instantly with no flash.
- Click through a filter, a sort, and a row expansion — all visually unchanged.
- DevTools Network tab shows seven CSS files loaded, all 200 OK.
- No console errors.

- [ ] **Step 5: Commit**

```bash
git add assets/css index.html
git commit -m "Split inline CSS into seven stylesheets under assets/css/

tokens / base / layout / filters / table / detail / responsive.
Order in <head> matches cascade requirements (tokens first,
responsive last). No rule is changed — pure extraction.
index.html drops ~600 lines."
```

---

## Phase 3 — Extract JS to ES modules

### Task 4: Create js directory and write all module files

This is the biggest task. To minimize risk, all module files are **created first** (with their exact content copied out of the current inline script) without touching `index.html`. Only after every module exists does the single atomic swap in `index.html` replace the inline `<script>` with `<script type="module" src="./assets/js/main.js">`.

**Files to create** (in dependency order — leaves first):

- `/Users/r/pr/sybil_pm_landscape/assets/js/state.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/constants.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/helpers.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/theme.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/sort.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/router.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/view.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/landscape.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/testing.js`
- `/Users/r/pr/sybil_pm_landscape/assets/js/main.js`

**What goes where** — map from the current inline `<script>` block to the destination modules:

| Module | Content |
|---|---|
| `state.js` | A single `export const state = { currentView: 'landscape', catFilter: null, toolFilter: null, searchQ: '', testCatFilter: null, testHasFilter: null, testSearchQ: '' };` object. Replaces the existing `let catFilter`, `let toolFilter`, `let searchQ`, `let currentView`, `let testCatFilter`, `let testHasFilter`, `let testSearchQ` top-level `let` declarations. |
| `constants.js` | `export const TEST_COLS = [...]`, `export const TOOL_COL_MAP = {...}`, `export const AA_DIMS = [...]`, `export const AA_TOTAL_CHECKS = 15`. Lift from the current inline definitions. If `AA_DIMS` doesn't exist yet and the per-PM detail rendering uses inline dim definitions, extract them into this module. |
| `helpers.js` | `export function esc(s)`, `export function toolPillClass(type)`, `export function toolPillLabel(type)`, `export function gradeClass(grade)`, plus any other pure helper used by render/renderTesting (catBadgeClass if present). |
| `theme.js` | `export const Theme = { ... }` from the current inline Theme module. |
| `sort.js` | `export const Sort = { ... }` from the current inline Sort module. |
| `router.js` | `export const Router = { ... }` from the current inline Router module. Router.applyToState calls `render()` and `renderTesting()` — convert those to imported function calls (`import { render } from './landscape.js'; import { renderTesting } from './testing.js';`). Router.applyToState also reads/writes `state.catFilter` etc. — import from `./state.js`. |
| `view.js` | `export function initViewNav()`, `export function applyViewVisibility(view)`, `export function setSubtitle(view)`. Lift from the inline definitions. The tab click handler inside initViewNav calls `renderTesting()` and `Router.push()` — import them. |
| `landscape.js` | `export function render()` and any local helpers it uses (the landscape-specific ones that aren't in helpers.js: e.g. the local `renderToolCard` / `toolLinks`). It also attaches click handlers to `#tableBody .t-row` rows — keep those inside render() as it currently does (re-attached on every render, which is fine). Imports: state, helpers, constants, Sort, Router. |
| `testing.js` | `export function renderTesting()` and `export function getTestablePMs()`, `export function pmToolsByCol()`. Same treatment as landscape.js. Imports: state, helpers, constants, Router (not strictly needed, but Router handles the tab → view mapping). |
| `main.js` | Boot sequence. Imports everything, fetches data, sets window globals for backward compat, calls init functions in the right order, registers the keyboard shortcut handler (`/` focuses search, Esc clears). |

**Approximate main.js content:**

```js
import { Theme } from './theme.js';
import { Router } from './router.js';
import { initViewNav } from './view.js';
import { render } from './landscape.js';
import { renderTesting } from './testing.js';

async function boot() {
  const [pms, aa, tests] = await Promise.all([
    fetch('./data/pms.json').then(r => r.json()),
    fetch('./data/accessibility.json').then(r => r.json()),
    fetch('./data/tests.json').then(r => r.json())
  ]);
  // Expose as globals for any residual code that still reads them directly.
  window.DATA = pms;
  window.AA_RESULTS = aa;
  window.TEST_RESULTS = tests.current || tests;
  window.TEST_RESULTS_LEGACY = tests.legacy || null;

  Theme.init();
  initViewNav();
  Router.init();
}

// Keyboard shortcuts
document.addEventListener('keydown', e => {
  const t = document.activeElement.tagName;
  if (e.key === '/' && t !== 'INPUT' && t !== 'TEXTAREA') {
    e.preventDefault();
    const sb = document.getElementById('searchBox');
    if (sb && sb.offsetParent) sb.focus();
  }
  if (e.key === 'Escape' && t === 'INPUT') {
    document.activeElement.value = '';
    document.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
  }
});

window.addEventListener('DOMContentLoaded', boot);
```

**Imports pattern** — every feature module that needs `DATA` / `AA_RESULTS` / `TEST_RESULTS` can either:
1. Read `window.DATA` etc. directly (simpler, matches existing code),
2. Or import them as parameters — but since they're loaded async, this requires functions to accept them.

Use option 1 inside landscape.js and testing.js. The global is set by main.js before any render is called. No refactor of render() / renderTesting() internals.

- [ ] **Step 1: Create assets/js/ directory**

```bash
mkdir -p /Users/r/pr/sybil_pm_landscape/assets/js
```

- [ ] **Step 2: Create state.js**

```js
// assets/js/state.js
export const state = {
  currentView: 'landscape',
  catFilter: null,
  toolFilter: null,
  searchQ: '',
  testCatFilter: null,
  testHasFilter: null,
  testSearchQ: ''
};
```

- [ ] **Step 3: Create constants.js**

Locate the current inline `const TEST_COLS = [...]`, `const TOOL_COL_MAP = {...}`, `const AA_DIMS = [...]` (if it exists), `const AA_TOTAL_CHECKS = 15` in `index.html`. Write them to `constants.js` verbatim, prefixing each with `export `. If any constant doesn't exist inline and is instead hardcoded in a function, pull it out into this module.

- [ ] **Step 4: Create helpers.js**

Find every top-level helper function in the inline script: `esc`, `toolPillClass`, `toolPillLabel`, `gradeClass`, `catBadgeClass`. Write each to `helpers.js` prefixed with `export `. Keep signatures identical.

- [ ] **Step 5: Create theme.js**

Copy the `const Theme = { ... };` block verbatim into `theme.js`, change `const Theme` to `export const Theme`.

- [ ] **Step 6: Create sort.js**

Copy the `const Sort = { ... };` block verbatim into `sort.js`, change to `export const Sort`.

- [ ] **Step 7: Create router.js**

Copy the `const Router = { ... };` block. Change to `export const Router`. Add at the top:

```js
import { state } from './state.js';
import { Sort } from './sort.js';
import { render } from './landscape.js';
import { renderTesting } from './testing.js';
```

Inside `applyToState()`, replace references to the bare globals `catFilter`, `toolFilter`, `searchQ`, `currentView` with `state.catFilter`, `state.toolFilter`, etc. The existing code uses `typeof catFilter !== 'undefined'` checks — replace those with direct `state.catFilter = s.cat` assignments (state is always defined).

- [ ] **Step 8: Create view.js**

Lift `initViewNav`, `applyViewVisibility`, `setSubtitle`. Add imports:

```js
import { state } from './state.js';
import { Router } from './router.js';
import { renderTesting } from './testing.js';
```

Replace `currentView = view` with `state.currentView = view`.

- [ ] **Step 9: Create landscape.js**

Export `render`. Add imports:

```js
import { state } from './state.js';
import { esc, toolPillClass, toolPillLabel } from './helpers.js';
import { Sort } from './sort.js';
import { Router } from './router.js';
```

Replace `catFilter` → `state.catFilter`, `toolFilter` → `state.toolFilter`, `searchQ` → `state.searchQ`. Inside render, `DATA` stays as `window.DATA` implicit global access — or explicitly `const DATA = window.DATA;` at the top of render() for clarity. Do the latter for readability.

Keep every template string, every event listener, every helper (renderToolCard, toolLinks) exactly as-is inside landscape.js.

- [ ] **Step 10: Create testing.js**

Export `renderTesting`, `getTestablePMs`, `pmToolsByCol`. Add imports:

```js
import { state } from './state.js';
import { esc, gradeClass } from './helpers.js';
import { TEST_COLS, TOOL_COL_MAP, AA_TOTAL_CHECKS } from './constants.js';
```

Replace `testCatFilter`, `testHasFilter`, `testSearchQ` references with `state.testCatFilter` etc. Like landscape.js, access `DATA`, `AA_RESULTS`, `TEST_RESULTS` as `window.DATA` etc. (or `const DATA = window.DATA;` at top of functions for clarity).

- [ ] **Step 11: Create main.js**

Write the main.js content shown earlier in this task.

- [ ] **Step 12: Atomic swap in index.html**

Now replace the entire inline `<script>...</script>` block at the bottom of `index.html` with a single line:

```html
<script type="module" src="./assets/js/main.js"></script>
```

The inline `<head>` script that sets `data-theme` stays — it's a classic synchronous script and must remain in place to prevent flash.

Before committing, grep for leftovers:

```bash
grep -c 'const DATA\|const AA_RESULTS\|const TEST_RESULTS\|const TEST_RESULTS_LEGACY\|function render\|function renderTesting\|const Theme\|const Router\|const Sort' index.html
```

Expected: `0`. Any matches mean there's leftover inline code that should have been extracted.

- [ ] **Step 13: Verify**

Open the page. Hard-refresh. Expected:
- Everything works exactly as before: landscape renders, testing renders, filters work, sort works, theme toggles, URL hash updates on interaction, deep links resolve, keyboard shortcuts work, mobile breakpoint works.
- DevTools Network tab shows: index.html + 7 CSS files + 10 JS module files (main, state, constants, helpers, theme, sort, router, view, landscape, testing) + 3 JSON files (pms, accessibility, tests).
- DevTools Console: no errors, no warnings about module resolution or CORS.

Manually test the full interaction matrix:
1. Click `all` / `decentralized` / `regulated/cefi` / `play money` filter chips — list filters.
2. Click `has dev tools` / `has agent tools` — list filters.
3. Type `poly` in search — list filters.
4. Sort by Volume ascending, then descending, then reset.
5. Sort by Market.
6. Click Polymarket row → detail expands with dev + agent tool sections and website/twitter links.
7. URL should now be `#/landscape/polymarket`.
8. Open a new tab, paste the URL with a constructed deep link (e.g. `#/landscape/kalshi?cat=Regulated%2FCeFi&sort=volume&dir=desc`) — page loads, scrolls to Kalshi, expands detail, filter and sort are applied.
9. Click the `testing` tab. Verify table renders with grade badges, filter chips work, row expand shows dev/agent tool sections + methodology tab strip.
10. Toggle theme (◐) — both views render correctly in light mode.
11. Shrink viewport to <640px — mobile card layout kicks in, testing cards show labeled rows.
12. Press `/` — search input focuses.
13. With search focused, press Esc — input clears.

- [ ] **Step 14: Commit**

```bash
git add assets/js index.html
git commit -m "Extract JS to ES modules under assets/js/

Ten modules: state / constants / helpers / theme / sort / router
/ view / landscape / testing / main. Each module imports what it
needs via relative paths. main.js is the single entry point — it
async-fetches the three data JSONs, sets window globals for
backward compat, then calls Theme.init / initViewNav / Router.init
in the same order as before.

index.html drops ~900 lines of inline script — now just links
seven stylesheets and a single <script type=\"module\"> entry.
The no-flash <head> theme script stays inline."
```

---

## Phase 4 — Cleanup

### Task 5: Delete the hidden static methodology reference panel

The huge static `<div class="methodology">` block inside `#testingView` (~180 lines) is hidden by the `#testingView > .methodology { display: none }` rule added in Phase 5 Task 14 of the original redesign. Its per-check content lives in the per-PM expanded detail rows now, so the static panel is pure dead markup.

**Files:**
- Modify: `/Users/r/pr/sybil_pm_landscape/index.html` (delete the static methodology markup)
- Modify: `/Users/r/pr/sybil_pm_landscape/assets/css/detail.css` (delete the `display: none` rule that was hiding it)

- [ ] **Step 1: Confirm nothing references the panel's DOM IDs**

```bash
grep -n 'mContent-aa\|mContent-cli\|mContent-skill\|mContent-framework\|id="mTabs"' index.html assets/js/*.js
```

Inspect each match. The IDs `mContent-*` appear in the static markup and in the per-PM detail rendering in testing.js — but the testing detail uses `dt${i}-aa`, `dt${i}-cli` etc., NOT the static panel IDs. Confirm that the static panel's ID references are not reused elsewhere.

If any feature JS references `mContent-aa` directly (not as `dt${i}-...`), STOP and flag it — that's a blocker. Otherwise proceed.

- [ ] **Step 2: Delete the static methodology markup**

In `index.html`, find `<div class="methodology">` inside `#testingView`. Delete the entire `<div class="methodology">...</div>` block (everything from `<div class="methodology">` through its matching closing `</div>`).

- [ ] **Step 3: Delete the hiding CSS rule**

In `assets/css/detail.css` (or wherever it ended up after Phase 2 Task 3), find and delete:

```css
#testingView > .methodology { display: none; }
```

- [ ] **Step 4: Verify**

Open the page. Click `testing`. Expected:
- No visible difference vs before (the panel was already hidden).
- Click a testing row → detail panel opens with the methodology tabs AS GENERATED BY renderTesting (not from the deleted static panel).
- Methodology tab strip inside the detail row shows AA / CLI/MCP / Skill / Framework content correctly.

- [ ] **Step 5: Commit**

```bash
git add index.html assets/css/detail.css
git commit -m "Delete hidden static methodology reference panel

The ~180-line <div class=\"methodology\"> block inside
#testingView was hidden by display: none since Phase 5 Task 14.
Its per-check content is already generated dynamically inside
the per-PM expanded detail rows in renderTesting(). Removing the
dead markup and the hiding rule."
```

---

### Task 6: Drop leftover dead variables and legacy CSS

**Files:**
- Modify: `/Users/r/pr/sybil_pm_landscape/assets/js/*.js` (any lingering dead declarations)
- Modify: `/Users/r/pr/sybil_pm_landscape/assets/css/*.css` (any lingering legacy class definitions)

- [ ] **Step 1: Sweep JS for dead code**

```bash
grep -n 'sortCol\|sortDir\|searchQuery\|TEST_RESULTS_LEGACY' assets/js/*.js
```

`sortCol`, `sortDir`, `searchQuery` are leftover from the pre-redesign sort handler — flagged as dead code in Phase 4 subagent notes of the original redesign. If any references remain, delete their declarations and any code that only writes to them (never reads).

`TEST_RESULTS_LEGACY` may still be assigned but never read — delete the assignment in main.js if so. If it IS read somewhere (e.g. a legacy rendering path), leave it.

- [ ] **Step 2: Sweep CSS for legacy classes**

```bash
grep -n 'test-pm-row\|test-detail-row\|stat-card\|filter-btn\|view-tab\|pm-table-wrap\|pm-table \|filters-bar\|search-box\|results-count \|header \|view-nav\|footer ' assets/css/*.css
```

Any rules targeting classes that the current markup never uses (grep the markup and testing.js / landscape.js to confirm) can be deleted.

Do NOT delete rules that are only emitted by `renderTesting()` via string concatenation (e.g. `m-tabs`, `m-tab`, `methodology-content`) — those are still used.

- [ ] **Step 3: Verify**

Open the page. Full interaction smoke test as in Phase 3 Task 4 Step 13.

- [ ] **Step 4: Commit (only if any dead code was actually removed)**

```bash
git add assets/
git commit -m "Drop leftover dead variables and legacy CSS classes

[Describe what was removed — e.g. 'Removed unused sortCol/sortDir
declarations in landscape.js, and legacy .test-pm-row /
.test-detail-row / .filter-btn rules from table.css.']"
```

If nothing needed removal, skip this commit.

---

## Phase 5 — Update CLAUDE.md

### Task 7: Reflect the new structure in CLAUDE.md

**Files:**
- Modify: `/Users/r/pr/sybil_pm_landscape/CLAUDE.md`

The current CLAUDE.md describes `index.html` as a "single-file (~3400 lines)" with an inlined `const DATA = [...]` at line ~518 and warns that the dashboard reads only from that embedded array. That's all wrong after this restructure.

- [ ] **Step 1: Rewrite the Architecture section**

Open `CLAUDE.md`. Find the `## Architecture` section (or wherever the file-structure description lives). Replace it with a section describing the new structure:

```markdown
## Architecture

Static directory deployable as-is to any static host (Vercel, GitHub Pages, etc.). Requires a local HTTP server for development because the site uses ES modules and `fetch()` against local JSON files (which CORS-blocks the `file://` origin).

### File layout

- `index.html` — ~200-line shell. Contains: `<head>` with a synchronous no-flash theme script, seven `<link>` tags to CSS files, and a single `<script type="module" src="./assets/js/main.js">` entry point. Body is static markup for the topbar, hero sections, view containers, and footer.
- `assets/css/` — seven stylesheets (tokens, base, layout, filters, table, detail, responsive). Load order matters for cascade: tokens first, responsive last.
- `assets/js/` — ten ES modules. `main.js` is the entry point: it `fetch()`s the three data files, sets them on `window` for backward compat, then calls `Theme.init() / initViewNav() / Router.init()` in order. Feature modules (`landscape.js`, `testing.js`) read `window.DATA` etc. directly. Shared mutable UI state lives in `state.js`.
- `data/` — three JSON files: `pms.json` (PM metadata, the former `DATA` array), `accessibility.json` (the former `AA_RESULTS`), `tests.json` (`{ current, legacy }` — the former `TEST_RESULTS` + `TEST_RESULTS_LEGACY`).
- `results/` — raw per-test subagent outputs. Not consumed at runtime; the dashboard reads `data/*.json` instead. Dual-source-of-truth between `results/*.json` and `data/*.json` is a known issue and is NOT fixed by this restructure.

### Runtime flow

1. Browser loads `index.html`.
2. Synchronous `<head>` script sets `data-theme` on `<html>` based on localStorage / prefers-color-scheme — before any CSS parses, preventing FOUC.
3. Browser parses seven `<link>`ed stylesheets in cascade order.
4. Browser loads `assets/js/main.js` as a module (auto-deferred). Module graph resolves: state / constants / helpers / theme / sort / router / view / landscape / testing.
5. `main.js` registers the `DOMContentLoaded` handler.
6. On `DOMContentLoaded`, `boot()` fetches the three JSON data files in parallel, assigns them to `window.DATA / window.AA_RESULTS / window.TEST_RESULTS`, then calls `Theme.init()`, `initViewNav()`, `Router.init()`. Router reads the URL hash and calls `render()` or `renderTesting()` accordingly.

### Editing rules

- **Changing visual style?** Edit files under `assets/css/`. Each file has a clear responsibility (see the table above).
- **Changing page interaction?** Edit files under `assets/js/`. Each module has one purpose.
- **Changing PM data?** Edit `data/pms.json`. The dashboard picks up the change on next reload.
- **Changing test results?** Edit `data/accessibility.json` or `data/tests.json`. Same.
- **Adding a new PM?** Append to `data/pms.json`. No code changes needed.

### Deploy

```bash
npx vercel deploy --prod
```

Vercel serves the directory as static files.

### Local dev

```bash
python3 -m http.server 8765
# Then open http://localhost:8765/index.html
```

Opening `index.html` via `file://` will NOT work — ES modules and `fetch()` are CORS-blocked from local file origin.
```

- [ ] **Step 2: Remove obsolete warnings**

Anywhere CLAUDE.md says things like "single-file (~3400 lines)" or "inlined `DATA` array at line ~518" or "the dashboard reads only from the inlined DATA" — remove or rewrite those statements.

- [ ] **Step 3: Commit**

```bash
git add CLAUDE.md
git commit -m "Update CLAUDE.md to reflect restructured file layout

Replace the 'single-file' description with the new directory
structure: index.html shell + assets/css/ + assets/js/ + data/
JSON files. Document the runtime boot flow, editing rules, and
the local server requirement (file:// no longer works)."
```

---

## Verification (end-to-end)

After all seven tasks land, do a full walkthrough:

1. **Fresh clone test:**
   ```bash
   cd /tmp && rm -rf spl && git clone https://github.com/noskillcoding/sybil_pm_landscape.git spl
   cd spl && git checkout redesign/terminal-density
   python3 -m http.server 8765
   ```
   Open `http://localhost:8765/index.html`. Everything should work. (Alternatively use the existing local server at port 8765.)

2. **Visual equivalence check:** Compare screenshots side-by-side against the pre-restructure version (commit `8b83619` on the same branch). Nothing should have moved visually — no color changes, no spacing changes, no layout regression. This is a pure structural refactor.

3. **Interaction matrix:** Repeat the 13-step interaction check from Phase 3 Task 4 Step 13.

4. **Mobile:** Toggle DevTools device toolbar to Pixel 7 (412 × 915). Confirm both views render correctly as cards with labels.

5. **Deploy:** `npx vercel deploy` (staging, not prod). Load the preview URL and repeat steps 3–4. If everything works, deploy to production.

6. **Git log is clean:**
   ```bash
   git log --oneline -12
   ```
   Should show 5–7 incremental commits, each with a coherent title.

## Risks / known issues

- **CORS on `file://`:** After this restructure, opening `index.html` by double-clicking it in the finder will show a blank page. Users must run a server. Documented in CLAUDE.md, but worth mentioning in the README too (out of scope for this plan).
- **Source maps:** None. Stack traces point into the actual .js files since there's no build step. Good for us, but anyone used to Vite's source-map debugging will notice the absence.
- **No minification:** Wire size grows ~20% vs inlined single-file. For a static research page this is a non-issue.
- **Dual source of truth** between `results/*.json` (raw test outputs) and `data/*.json` (dashboard data) is preserved unchanged. Fixing it is a separate project.
- **Cache invalidation:** No content hashing. If the user pushes a CSS tweak, stale browsers may serve the old CSS until they hard-refresh. Acceptable for a research page with known readers; not acceptable for a high-traffic product.
