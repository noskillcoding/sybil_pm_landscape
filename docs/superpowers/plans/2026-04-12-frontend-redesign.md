# Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current dashboard look-and-feel with a terminal-density research-publication aesthetic, sharing one design system across the Landscape and Testing pages, with light theme, sortable columns, URL state, per-PM deep links, and a responsive layout — all inside the existing single-file static `index.html`.

**Architecture:** Single static HTML file with inlined CSS and JS. Dark/light theme via `[data-theme]` attribute on `<html>` swapping CSS custom properties. Existing `render()` and `renderTesting()` template functions are extended (not replaced) to emit new markup using new class names. New JS modules — theme, router, sort — are added inline. Existing data objects (`DATA`, `AA_RESULTS`, `TEST_RESULTS`) and the methodology static markup are preserved unchanged in shape but restyled.

**Tech Stack:** Vanilla HTML / CSS / JS. No build, no framework, no test framework. Verification is **visual + interactive in the browser** at `http://localhost:8765/index.html` (the local Python static server already running) and against the reference mockup at `http://localhost:8765/mocks/a-terminal.html`. The design spec lives at `docs/superpowers/specs/2026-04-12-frontend-redesign-design.md` and is the source of truth — every task references the spec sections it implements.

**File map**

| File | What changes |
|---|---|
| `index.html` lines 5–268 | Entire `<style>` block replaced with new ~600-line stylesheet (Phase 1–6) |
| `index.html` lines 270–497 | Static markup rebuilt section by section (Phase 2–6) |
| `index.html` line 498 onwards | New JS modules added inside the existing `<script>` tag (theme, router, sort); existing `render()` / `renderTesting()` / `initViewNav()` functions modified |
| `mocks/b-refined.html`, `mocks/c-hybrid.html` | Deleted at the end (Phase 7) |
| `mocks/a-terminal.html` | Kept as frozen reference snapshot |

**Conventions for this plan**

- Every task ends with a commit. Use the commit messages exactly as written.
- Verification of every task happens in the browser. The Python static server serves the repo from `/Users/r/pr/sybil_pm_landscape`. If the server is not running, start it with `python3 -m http.server 8765` from that directory.
- New CSS class names use the prefix `t-` (for "terminal", the design's nickname). Example: `.t-topbar`, `.t-hero`, `.t-stats`. This namespace lets new and old CSS coexist during the migration without collisions.
- The migration is incremental. Until Task 23 (cleanup), the page may temporarily contain *both* old and new styles. That's expected. The acceptance criterion at each task is "the part you just touched looks right and nothing previously-passing is broken".
- When a step says "open the page", it means open or refresh `http://localhost:8765/index.html` in your browser. When it says "open the mock", it means `http://localhost:8765/mocks/a-terminal.html`.

---

## Phase 1 — Foundation

### Task 1: Add design tokens, reset, and theme infrastructure

Implements spec §3 (color tokens, typography, geometry) and §4 (theme toggle no-flash).

**Files:**
- Modify: `index.html` lines 1–10 (insert no-flash inline script in `<head>`)
- Modify: `index.html` lines 7–268 (replace entire `<style>` block)

- [ ] **Step 1: Add the no-flash theme script in `<head>`**

Locate the `<head>` section (lines 1–6 area) and insert this `<script>` tag right after the `<meta name="viewport">` line, **before** the `<title>` tag:

```html
<script>
  (function() {
    try {
      var stored = localStorage.getItem('theme');
      var prefersLight = window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches;
      var theme = stored || (prefersLight ? 'light' : 'dark');
      document.documentElement.setAttribute('data-theme', theme);
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
</script>
```

This runs synchronously before any CSS loads, so the correct theme attribute is on `<html>` before paint — no flash of wrong theme.

- [ ] **Step 2: Replace the entire `<style>` block**

Open `index.html`. Locate `<style>` at line 7 and `</style>` at line 269. Replace the **entire** block (everything between and including those tags) with the following:

```html
<style>
/* ============================================================
 * Sybil PM Landscape — terminal-density design system
 * Spec: docs/superpowers/specs/2026-04-12-frontend-redesign-design.md
 * ============================================================ */

/* --- Design tokens ---------------------------------------- */
:root, [data-theme="dark"] {
  --bg: #000;
  --bg-1: #07090c;
  --bg-2: #0c1015;
  --line: #1a1f27;
  --line-2: #242a33;
  --ink: #e6e8eb;
  --ink-dim: #8a919b;
  --ink-muted: #5a626c;
  --accent: #4ade80;
  --accent-soft: rgba(74, 222, 128, 0.06);
  --warn: #f59e0b;
  --cyan: #22d3ee;
  --red: #ef4444;
  --pill-api: #93c5fd;     --pill-api-bd: #1e3a5f;
  --pill-sdk: #c4b5fd;     --pill-sdk-bd: #3a2d5f;
  --pill-cli: #4ade80;     --pill-cli-bd: #2a5039;
  --pill-mcp: #f0abfc;     --pill-mcp-bd: #5a1e5f;
  --pill-skill: #22d3ee;   --pill-skill-bd: #1e4a52;
  --pill-fw: #f59e0b;      --pill-fw-bd: #503d1e;
}
[data-theme="light"] {
  --bg: #f6f7f9;
  --bg-1: #ffffff;
  --bg-2: #eef0f3;
  --line: #d8dde3;
  --line-2: #c2c8d0;
  --ink: #1f2328;
  --ink-dim: #5b626d;
  --ink-muted: #8a919b;
  --accent: #16a34a;
  --accent-soft: rgba(22, 163, 74, 0.08);
  --warn: #b45309;
  --cyan: #0891b2;
  --red: #b91c1c;
  --pill-api: #1d4ed8;     --pill-api-bd: #c2d4f5;
  --pill-sdk: #6d28d9;     --pill-sdk-bd: #d6cbf0;
  --pill-cli: #15803d;     --pill-cli-bd: #b9e5cb;
  --pill-mcp: #be185d;     --pill-mcp-bd: #f0c5d9;
  --pill-skill: #0e7490;   --pill-skill-bd: #b8e0e8;
  --pill-fw: #b45309;      --pill-fw-bd: #f2dcb9;
}

/* --- Reset ------------------------------------------------ */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  background: var(--bg);
  color: var(--ink);
  font-family: -apple-system, BlinkMacSystemFont, "Inter", "SF Pro Text", "Segoe UI", sans-serif;
  font-size: 13px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "cv11";
}
.mono, code, kbd, pre, samp {
  font-family: "JetBrains Mono", "IBM Plex Mono", "SF Mono", Menlo, Consolas, monospace;
  font-feature-settings: "tnum", "ss01";
}
a { color: inherit; text-decoration: none; }
button { font: inherit; color: inherit; background: none; border: 0; cursor: pointer; }
input { font: inherit; color: inherit; }
table { border-collapse: collapse; width: 100%; }

/* --- Layout shell ----------------------------------------- */
.t-shell { max-width: 1440px; margin: 0 auto; padding: 32px 32px 80px; }

/* The remaining component styles are added by subsequent tasks. */
</style>
```

This block contains: tokens for both themes, the reset, and layout shell only. Component styles are added incrementally by later tasks.

- [ ] **Step 3: Verify token swap works**

Open the page. Expected: the page is a black void with white-ish text (no chrome rendered yet — that's intentional, we just deleted all the old chrome CSS).

In DevTools console, run:

```js
document.documentElement.setAttribute('data-theme', 'light');
```

Expected: background flips to `#f6f7f9`, text to dark grey. Run:

```js
document.documentElement.setAttribute('data-theme', 'dark');
```

Expected: flips back. Confirms tokens are wired.

- [ ] **Step 4: Verify no-flash on reload**

In DevTools console:

```js
localStorage.setItem('theme', 'light'); location.reload();
```

Expected: page reloads directly into light theme with no dark flash. Then:

```js
localStorage.setItem('theme', 'dark'); location.reload();
```

Expected: reloads directly into dark.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Add design tokens, reset, and no-flash theme bootstrap

Replace the entire <style> block with the new tokenized base for the
terminal-density redesign. Add a synchronous <head> script that sets
data-theme on <html> before paint to eliminate flash of wrong theme.

Refs spec section 3 (visual system) and 4 (theme toggle)."
```

---

### Task 2: Theme toggle JS module

Implements spec §4 (theme toggle behavior).

**Files:**
- Modify: `index.html` line ~498 onwards (inside the existing `<script>` tag, immediately after `const PAGE_VERSION = 'v6.0';`)

- [ ] **Step 1: Insert the theme module**

Locate line 499 in the `<script>` tag: `const PAGE_VERSION = 'v6.0';`. Add the following block immediately after that line:

```js
// === Theme toggle ============================================
const Theme = {
  get current() { return document.documentElement.getAttribute('data-theme') || 'dark'; },
  set(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    document.querySelectorAll('[data-theme-icon]').forEach(el => {
      el.textContent = theme === 'dark' ? '◐' : '◑';
    });
  },
  toggle() { this.set(this.current === 'dark' ? 'light' : 'dark'); },
  init() {
    document.addEventListener('click', e => {
      if (e.target.closest('[data-theme-toggle]')) { e.preventDefault(); this.toggle(); }
    });
    this.set(this.current); // refresh icon on load
  }
};
```

- [ ] **Step 2: Wire `Theme.init()` into the existing `DOMContentLoaded` handler**

Find this line (currently around line 500):

```js
window.addEventListener('DOMContentLoaded',()=>{render();initViewNav();});
```

Replace with:

```js
window.addEventListener('DOMContentLoaded',()=>{Theme.init();render();initViewNav();});
```

- [ ] **Step 3: Verify**

Open the page. In DevTools console:

```js
Theme.toggle();
```

Expected: theme flips dark↔light, `localStorage.theme` is updated, and any element with `data-theme-icon` (none yet — that's fine) would have its icon glyph swapped. No errors.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Add Theme module for toggle + persistence

Theme.set/toggle/init handle the data-theme attribute on <html>,
persist to localStorage, and update any element marked with
data-theme-icon. Wired into DOMContentLoaded.

Refs spec section 4."
```

---

## Phase 2 — Landscape page chrome

### Task 3: Topbar markup + CSS

Implements spec §2 (topbar) and §5 (component 1).

**Files:**
- Modify: `index.html` lines 272–281 (replace `.container > .header` and `.view-nav` markup)
- Modify: `index.html` `<style>` block (append topbar CSS)

- [ ] **Step 1: Replace the static topbar markup**

Find lines 272–281, currently:

```html
<div id="dashboard">
<div class="container">
  <div class="header">
    <h1>Prediction Markets Landscape</h1>
    <div class="subtitle" id="subtitle">&mdash; April 2026</div>
  </div>
  <div class="view-nav">
    <button class="view-tab active" data-view="landscape">Landscape</button>
    <button class="view-tab testing-tab" data-view="testing">Testing Dashboard &rarr;</button>
  </div>
```

Replace with:

```html
<div id="dashboard">
<div class="t-shell">

  <header class="t-topbar">
    <div class="t-brand">
      <span class="t-prompt mono">$</span>
      <span class="t-brand-name mono">sybil.pm_landscape</span>
      <span class="t-brand-sep mono">//</span>
      <span class="t-brand-ver mono">v4 · apr 2026</span>
    </div>
    <nav class="t-tabs">
      <button class="t-tab active" data-view="landscape">Landscape</button>
      <button class="t-tab" data-view="testing">Testing</button>
    </nav>
    <div class="t-topbar-right">
      <span class="t-live mono"><span class="t-live-dot"></span>live</span>
      <span class="t-mcount mono" id="topbarCount">28 markets</span>
      <button class="t-theme-btn" data-theme-toggle title="Toggle theme"><span class="mono" data-theme-icon>◐</span></button>
    </div>
  </header>
```

- [ ] **Step 2: Append topbar CSS to the `<style>` block**

Locate the comment `/* The remaining component styles are added by subsequent tasks. */` in the `<style>` block (added in Task 1) and **replace that line** with:

```css
/* --- Topbar ----------------------------------------------- */
.t-topbar {
  display: flex;
  align-items: center;
  padding: 8px 0 20px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 32px;
  gap: 24px;
}
.t-brand { display: flex; align-items: baseline; gap: 10px; flex: 0 0 auto; }
.t-prompt { color: var(--accent); font-size: 13px; }
.t-brand-name { font-size: 13.5px; color: var(--ink); font-weight: 500; letter-spacing: -0.2px; }
.t-brand-sep { color: var(--ink-muted); font-size: 12px; }
.t-brand-ver { color: var(--ink-dim); font-size: 11px; }

.t-tabs { display: flex; gap: 0; flex: 1; justify-content: center; }
.t-tab {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 11.5px;
  color: var(--ink-dim);
  text-transform: lowercase;
  letter-spacing: 0.4px;
  padding: 8px 18px;
  border-bottom: 1px solid transparent;
  transition: color 0.1s, border-color 0.1s;
}
.t-tab:hover { color: var(--ink); }
.t-tab.active { color: var(--ink); border-bottom-color: var(--accent); }

.t-topbar-right {
  display: flex;
  align-items: center;
  gap: 16px;
  flex: 0 0 auto;
  font-size: 11px;
  color: var(--ink-dim);
}
.t-live { display: inline-flex; align-items: center; gap: 6px; }
.t-live-dot {
  display: inline-block;
  width: 6px; height: 6px;
  background: var(--accent);
  border-radius: 50%;
  box-shadow: 0 0 8px var(--accent);
}
.t-mcount { color: var(--ink-muted); }
.t-theme-btn {
  width: 28px; height: 28px;
  border: 1px solid var(--line);
  display: grid;
  place-items: center;
  color: var(--ink-dim);
  font-size: 13px;
  transition: color 0.1s, border-color 0.1s;
}
.t-theme-btn:hover { color: var(--ink); border-color: var(--line-2); }
```

- [ ] **Step 3: Wire up tab switcher**

The existing `initViewNav()` function (line ~1667) selects `.view-tab` elements. Update it to also recognize `.t-tab`. Find this line in `initViewNav`:

```js
document.querySelectorAll('.view-tab').forEach(tab => {
```

Replace with:

```js
document.querySelectorAll('.view-tab, .t-tab').forEach(tab => {
```

And the line below it:

```js
document.querySelectorAll('.view-tab').forEach(t => t.classList.remove('active'));
```

Replace with:

```js
document.querySelectorAll('.view-tab, .t-tab').forEach(t => t.classList.remove('active'));
```

- [ ] **Step 4: Verify**

Open the page. Expected:
- Topbar renders with `$ sybil.pm_landscape // v4 · apr 2026` on the left, two centered tabs (`landscape` underlined in green, `testing` dim), and `● live · 28 markets · ◐` on the right.
- Hover the `testing` tab — color brightens.
- Click `testing` — the active underline moves to it (and the testing view appears below, possibly unstyled — that's expected, we haven't restyled testing yet).
- Click `landscape` — underline returns.
- Click the `◐` button — theme flips, icon becomes `◑`. Click again, returns.

Open the mock at `http://localhost:8765/mocks/a-terminal.html` and compare topbars side by side. They should be very close.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Build Landscape topbar (brand, tabs, live indicator, theme toggle)

New .t-topbar component replaces the old .header + .view-nav. Tab
switcher is wired into the existing initViewNav() handler for both
old (.view-tab) and new (.t-tab) selectors so testing-page rendering
keeps working during the migration.

Refs spec sections 2, 5 (component 1)."
```

---

### Task 4: Hero markup + CSS (Landscape)

Implements spec §5 (component 2).

**Files:**
- Modify: `index.html` (insert hero markup right after the topbar `</header>` from Task 3)
- Modify: `index.html` `<style>` block (append hero CSS)

- [ ] **Step 1: Insert the hero markup**

Immediately after the `</header>` tag added in Task 3, and **before** the existing `<!-- LANDSCAPE VIEW -->` comment, insert:

```html
<section class="t-hero" id="landscapeHero">
  <div class="t-hero-kicker mono">// the landscape · 2026</div>
  <h1 class="t-hero-headline">Prediction markets, <em>ranked by how well an AI agent can actually use them.</em></h1>
  <p class="t-hero-sub">28 live prediction markets surveyed across volume, chain, developer surface, and AI-agent tooling. The dataset below is the source for our CLI/MCP, Skill, and Framework benchmarks.</p>
  <div class="t-caveat">
    <span class="t-caveat-icon">⚠</span>
    <span><strong class="mono">agent-generated research</strong> — every test, score, and summary on this site was produced by autonomous coding agents. treat findings accordingly.</span>
  </div>
</section>

<section class="t-hero" id="testingHero" style="display:none;">
  <div class="t-hero-kicker mono">// the benchmarks · 2026</div>
  <h1 class="t-hero-headline">Which prediction markets are <em>actually usable</em> by autonomous trading agents?</h1>
  <p class="t-hero-sub">Four independent benchmarks — agent accessibility, CLI/MCP, skill, and framework — run by autonomous coding agents against every PM with a developer surface. Per-check evidence is available in the expanded rows.</p>
  <div class="t-caveat">
    <span class="t-caveat-icon">⚠</span>
    <span><strong class="mono">agent-generated research</strong> — every test, score, and summary on this site was produced by autonomous coding agents. treat findings accordingly.</span>
  </div>
</section>
```

Both hero blocks are placed in the static markup; the testing hero starts hidden and is shown by `initViewNav()` updates in a later task.

- [ ] **Step 2: Append hero CSS to the `<style>` block**

Append at the end of the `<style>` block:

```css
/* --- Hero ------------------------------------------------- */
.t-hero { margin-bottom: 36px; }
.t-hero-kicker {
  font-size: 10px;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 1.5px;
  margin-bottom: 10px;
}
.t-hero-headline {
  font-size: 34px;
  line-height: 1.15;
  letter-spacing: -1px;
  font-weight: 700;
  color: var(--ink);
  max-width: 860px;
  margin-bottom: 12px;
}
.t-hero-headline em {
  font-style: normal;
  color: var(--ink-muted);
  font-weight: 500;
}
.t-hero-sub {
  color: var(--ink-dim);
  font-size: 13.5px;
  max-width: 720px;
  line-height: 1.6;
}
.t-caveat {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  margin-top: 18px;
  padding: 8px 12px;
  border: 1px solid var(--line-2);
  background: var(--bg-1);
  font-size: 11.5px;
  color: var(--ink-dim);
  max-width: 760px;
}
.t-caveat-icon { color: var(--warn); font-size: 13px; }
.t-caveat strong { color: var(--warn); font-weight: 500; font-size: 10.5px; text-transform: lowercase; letter-spacing: 0.4px; }
```

- [ ] **Step 3: Make tab clicks toggle which hero is visible**

In `initViewNav()` (around line 1667), find the click handler block:

```js
if (view === 'landscape') {
  document.getElementById('landscapeView').classList.remove('hidden');
  document.getElementById('testingView').classList.remove('active');
} else {
  document.getElementById('landscapeView').classList.add('hidden');
  document.getElementById('testingView').classList.add('active');
  renderTesting();
}
```

Replace with:

```js
const lh = document.getElementById('landscapeHero');
const th = document.getElementById('testingHero');
if (view === 'landscape') {
  document.getElementById('landscapeView').classList.remove('hidden');
  document.getElementById('testingView').classList.remove('active');
  if (lh) lh.style.display = '';
  if (th) th.style.display = 'none';
} else {
  document.getElementById('landscapeView').classList.add('hidden');
  document.getElementById('testingView').classList.add('active');
  if (lh) lh.style.display = 'none';
  if (th) th.style.display = '';
  renderTesting();
}
```

- [ ] **Step 4: Verify**

Open the page. Expected:
- Below the topbar, a hero section appears: small uppercase mono kicker `// THE LANDSCAPE · 2026`, then the bold headline (`ranked by how well an AI agent can actually use them.` is muted-grey, the rest is full-ink), then the dim sub-paragraph, then the hairline-bordered caveat callout with a `⚠` and the warning text.
- Compare to the mock — should be visually almost identical.
- Click the `testing` tab. The hero copy changes (different kicker, different headline, different subtitle), the caveat stays. Click `landscape` — original hero returns.
- Toggle theme. Both heroes should remain readable in light theme; the caveat border contrasts cleanly against the off-white background.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Build hero sections for Landscape and Testing pages

Two .t-hero sections (landscapeHero, testingHero) with kicker /
headline / subtitle / agent-generated caveat callout. Tab switcher
in initViewNav() now toggles their visibility alongside the existing
view containers.

Refs spec sections 2, 5 (component 2)."
```

---

### Task 5: Footer

Implements spec §5 (component 11).

**Files:**
- Modify: `index.html` line 495 (replace existing `.footer` div)
- Modify: `index.html` `<style>` block (append footer CSS)

- [ ] **Step 1: Replace footer markup**

Find line 495, currently:

```html
<div class="footer">Research compiled from official docs, GitHub repos, and direct verification. <span id="footerVersion"></span></div>
```

Replace with:

```html
<footer class="t-footer mono">
  <div class="t-footer-left">sybil_pm_landscape · agent-authored · <span id="footerVersion">apr 2026</span></div>
  <div class="t-footer-right">
    <a href="https://github.com/noskillcoding/sybil_pm_landscape/tree/main/methodology" target="_blank">methodology</a>
    <span class="t-footer-sep">·</span>
    <a href="https://github.com/noskillcoding/sybil_pm_landscape" target="_blank">source</a>
    <span class="t-footer-sep">·</span>
    <a href="#" target="_blank"><!-- TODO: replace # with project X handle when available -->x</a>
  </div>
</footer>
```

- [ ] **Step 2: Append footer CSS**

Append at the end of the `<style>` block:

```css
/* --- Footer ----------------------------------------------- */
.t-footer {
  margin-top: 60px;
  padding-top: 20px;
  border-top: 1px solid var(--line);
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 11px;
  color: var(--ink-muted);
}
.t-footer a { color: var(--ink-dim); }
.t-footer a:hover { color: var(--accent); }
.t-footer-sep { color: var(--ink-muted); margin: 0 4px; }
```

- [ ] **Step 3: Verify**

Open the page. Scroll to bottom. Expected:
- Hairline-bordered footer at the bottom of the page.
- Left: `sybil_pm_landscape · agent-authored · apr 2026` in dim mono.
- Right: `methodology · source · x` — three inline links separated by `·`. Hover any link → it turns accent green. Click `methodology` → opens the GitHub methodology directory in a new tab. Click `source` → opens the repo root.
- Toggle theme — footer remains legible.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Build hairline footer with methodology/source/X links

Replaces the legacy .footer div with .t-footer. Methodology and
source point to GitHub; X handle is a TODO placeholder.

Refs spec section 5 (component 11)."
```

---

## Phase 3 — Landscape page data area

### Task 6: Stats strip (Landscape)

Implements spec §5 (component 3).

**Files:**
- Modify: `index.html` `<style>` block (append stats CSS)
- Modify: `index.html` `render()` function (line ~1442) — replace the inner HTML written to `#stats`

- [ ] **Step 1: Append stats strip CSS**

Append at the end of the `<style>` block:

```css
/* --- Stats strip ------------------------------------------ */
.t-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0;
  border: 1px solid var(--line);
  margin-bottom: 28px;
}
.t-stat {
  padding: 16px 20px;
  border-right: 1px solid var(--line);
}
.t-stat:last-child { border-right: 0; }
.t-stat-label {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 10px;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 6px;
}
.t-stat-value {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.5px;
  color: var(--ink);
}
.t-stat-detail {
  font-size: 11px;
  color: var(--ink-dim);
  margin-top: 2px;
}
```

- [ ] **Step 2: Update the `render()` function to emit new stats markup**

Find the stats rendering block in `render()` (around lines 1442–1454):

```js
const total = DATA.length;
const withDev = DATA.filter(p => p.coreTools.length > 0).length;
const withAi = DATA.filter(p => p.aiTools.length > 0).length;
const decen = DATA.filter(p => p.category === 'Decentralized').length;
const cefi = DATA.filter(p => p.category === 'Regulated/CeFi').length;
const play = DATA.filter(p => p.category === 'Play Money').length;

document.getElementById('stats').innerHTML = `
  <div class="stat-card"><div class="label">Total PMs</div><div class="value">${total}</div><div class="detail">Verified live, April 2026</div></div>
  <div class="stat-card"><div class="label">With Dev Tools</div><div class="value">${withDev}</div><div class="detail">API, SDK, or WebSocket</div></div>
  <div class="stat-card"><div class="label">With AI Tools</div><div class="value">${withAi}</div><div class="detail">MCP, CLI, Framework, Skill</div></div>
  <div class="stat-card"><div class="label">Categories</div><div class="value">${decen}/${cefi}/${play}</div><div class="detail">Decentralized / CeFi / Play</div></div>
`;
```

Replace the `innerHTML` assignment with:

```js
document.getElementById('stats').className = 't-stats';
document.getElementById('stats').innerHTML = `
  <div class="t-stat"><div class="t-stat-label">markets</div><div class="t-stat-value mono">${total}</div><div class="t-stat-detail">verified live</div></div>
  <div class="t-stat"><div class="t-stat-label">with dev tools</div><div class="t-stat-value mono">${withDev}</div><div class="t-stat-detail">api · sdk · ws</div></div>
  <div class="t-stat"><div class="t-stat-label">with agent tools</div><div class="t-stat-value mono">${withAi}</div><div class="t-stat-detail">cli · mcp · skill · fw</div></div>
  <div class="t-stat"><div class="t-stat-label">decen · cefi · play</div><div class="t-stat-value mono">${decen}/${cefi}/${play}</div><div class="t-stat-detail">category mix</div></div>
`;
```

- [ ] **Step 3: Update the topbar market count to match the live total**

Inside `render()`, immediately before the stats `innerHTML` assignment, add:

```js
const topbarCount = document.getElementById('topbarCount');
if (topbarCount) topbarCount.textContent = `${total} markets`;
```

- [ ] **Step 4: Verify**

Open the page. Expected:
- A single hairline-bordered horizontal strip below the hero, containing 4 cells separated by hairline dividers.
- Each cell: `MARKETS` (uppercase mono label) → `28` (large mono value) → `verified live` (dim sans subtitle).
- Topbar `28 markets` matches the first stat value.
- Toggle theme — strip stays correct in both themes (cells and dividers visible).

Compare to the mock — should be a near-pixel match.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Restyle Landscape stats strip in terminal-density tokens

Renders 4 cells (markets / dev tools / agent tools / category split)
in a single hairline-bordered strip with mono labels and values.
Topbar market count is now driven by render() to stay in sync.

Refs spec section 5 (component 3)."
```

---

### Task 7: Filter bar (Landscape)

Implements spec §5 (component 4) and §4 (filter behavior — chips, search).

**Files:**
- Modify: `index.html` lines 286–292 (replace static filters markup)
- Modify: `index.html` `<style>` block (append filters CSS)
- Modify: `index.html` `render()` function — restyle the filter chip generation

- [ ] **Step 1: Replace static filters markup**

Find lines 286–292:

```html
<div class="filters-bar" id="filters">
  <div class="filter-group" id="catFilters"></div>
  <div class="filter-sep"></div>
  <div class="filter-group" id="toolFilters"></div>
  <input type="text" class="search-box" id="searchBox" placeholder="Search PMs...">
</div>
<div class="results-count" id="resultsCount"></div>
```

Replace with:

```html
<div class="t-filters" id="filters">
  <div class="t-filter-group" id="catFilters"></div>
  <div class="t-filter-sep"></div>
  <div class="t-filter-group" id="toolFilters"></div>
  <div class="t-filter-spacer"></div>
  <input type="text" class="t-search mono" id="searchBox" placeholder="/ search 28 markets…">
</div>
<div class="t-results-count mono" id="resultsCount"></div>
```

- [ ] **Step 2: Append filters CSS**

Append at the end of the `<style>` block:

```css
/* --- Filters ---------------------------------------------- */
.t-filters {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 0 16px;
  border-bottom: 1px solid var(--line);
  margin-bottom: 0;
}
.t-filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
.t-filter-sep { width: 1px; height: 18px; background: var(--line); margin: 0 4px; }
.t-filter-spacer { flex: 1; }
.t-chip {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 11px;
  color: var(--ink-dim);
  padding: 5px 10px;
  border: 1px solid var(--line);
  background: transparent;
  letter-spacing: 0.2px;
  text-transform: lowercase;
  transition: color 0.1s, border-color 0.1s, background 0.1s;
}
.t-chip:hover { color: var(--ink); border-color: var(--line-2); }
.t-chip.active {
  color: var(--accent);
  border-color: var(--accent);
  background: var(--accent-soft);
}
.t-search {
  flex: 0 0 280px;
  background: transparent;
  border: 1px solid var(--line);
  color: var(--ink);
  padding: 6px 10px;
  font-size: 11.5px;
  outline: none;
}
.t-search:focus { border-color: var(--line-2); }
.t-search::placeholder { color: var(--ink-muted); }
.t-results-count {
  font-size: 11px;
  color: var(--ink-muted);
  text-transform: lowercase;
  letter-spacing: 0.4px;
  margin: 14px 0 8px;
}
```

- [ ] **Step 3: Update the chip generation in `render()`**

Find these lines in `render()`:

```js
document.getElementById('catFilters').innerHTML = cats.map(c =>
  `<button class="filter-btn${catFilter === c ? ' active' : ''}" data-cat="${c}">${c}</button>`
).join('');
```

Replace with:

```js
document.getElementById('catFilters').innerHTML =
  `<button class="t-chip${catFilter === null ? ' active' : ''}" data-cat="">all</button>` +
  cats.map(c =>
    `<button class="t-chip${catFilter === c ? ' active' : ''}" data-cat="${c}">${c.toLowerCase()}</button>`
  ).join('');
```

Find the tool filter rendering, currently:

```js
document.getElementById('toolFilters').innerHTML = tfs.map(t =>
  `<button class="filter-btn${toolFilter === t.key ? ' active' : ''}" data-tool="${t.key}">${t.label}</button>`
).join('');
```

Replace with:

```js
document.getElementById('toolFilters').innerHTML = tfs.map(t =>
  `<button class="t-chip${toolFilter === t.key ? ' active' : ''}" data-tool="${t.key}">${t.label.toLowerCase()}</button>`
).join('');
```

- [ ] **Step 4: Update the click handlers to write to `catFilter`/`toolFilter`**

Locate the click handler for filter chips. The existing code attaches click listeners on `.filter-btn`. Find every `.filter-btn` selector inside `render()` or its surrounding helpers and add `, .t-chip` to each. There are typically two: one for `data-cat` and one for `data-tool`. After this change, both old and new chip elements respond to clicks identically.

If a "data-cat" handler does `catFilter = e.target.dataset.cat;`, ensure that an empty string (`""`) for the `all` chip resets to `null`. Update the line to:

```js
catFilter = e.target.dataset.cat || null;
```

- [ ] **Step 5: Verify**

Open the page. Expected:
- Hairline-bordered filter row sitting flush below the stats strip.
- Left: `[all] [decentralized] [regulated/cefi] [play money]  |  [has dev tools] [has agent tools]` — all mono lowercase chips with hairline borders.
- Right: a 280px-wide mono search input with placeholder `/ search 28 markets…`.
- Below the row: small mono `28 markets` results-count line.
- Click `decentralized` → chip turns accent-green text + accent border + faint accent-tinted background. The table below filters (rows reduce in count). Click `all` → resets.
- Click `has agent tools` → chip activates and table filters again.
- Type `poly` in the search box → table filters live.
- Toggle theme. All chips remain legible. The accent green darkens to `#16a34a` in light mode and the active background tint adjusts.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Restyle Landscape filter bar (chips + search)

Filter chips become hairline-bordered mono pills with accent-green
active state. Search input gets a 280px mono treatment with the
placeholder '/ search N markets…'. Both old and new chip selectors
remain wired so the existing click handlers keep working.

Refs spec section 5 (component 4)."
```

---

### Task 8: Table — head, row chrome, PM cell, category, volume

Implements spec §5 (components 5, 6, 7) and §3 (geometry).

**Files:**
- Modify: `index.html` lines 293–298 (replace `.pm-table-wrap` markup)
- Modify: `index.html` `<style>` block (append table base CSS)
- Modify: `index.html` `render()` function — replace the head generation and the row generation (the parts that emit name + category + chain + volume cells)

- [ ] **Step 1: Replace static table wrapper markup**

Find lines 293–298:

```html
<div class="pm-table-wrap">
  <table class="pm-table">
    <thead id="tableHead"></thead>
    <tbody id="tableBody"></tbody>
  </table>
</div>
```

Replace with:

```html
<div class="t-table-wrap">
  <table class="t-table" id="pmTable">
    <thead id="tableHead"></thead>
    <tbody id="tableBody"></tbody>
  </table>
</div>
```

- [ ] **Step 2: Append base table CSS**

Append at the end of the `<style>` block:

```css
/* --- Table base ------------------------------------------- */
.t-table-wrap { overflow-x: auto; }
.t-table { font-size: 12.5px; }
.t-table thead th {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 10px;
  font-weight: 500;
  color: var(--ink-muted);
  text-transform: uppercase;
  letter-spacing: 1px;
  padding: 14px 12px 10px;
  text-align: left;
  border-bottom: 1px solid var(--line);
  white-space: nowrap;
  user-select: none;
}
.t-table thead th.num { text-align: right; }
.t-table thead th.sortable { cursor: pointer; }
.t-table thead th.sortable:hover { color: var(--ink-dim); }
.t-table thead th .t-sort-arrow { margin-left: 4px; color: var(--accent); display: inline-block; width: 8px; }
.t-table tbody tr {
  border-bottom: 1px solid var(--line);
  transition: background 0.08s;
  cursor: pointer;
}
.t-table tbody tr:hover { background: var(--bg-1); }
.t-table tbody td { padding: 14px 12px; vertical-align: middle; }
.t-chev {
  width: 22px;
  color: var(--ink-muted);
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 11px;
}

/* PM cell */
.t-pm { display: flex; align-items: center; gap: 12px; }
.t-pm-glyph {
  width: 24px; height: 24px;
  border: 1px solid var(--line-2);
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 11px;
  display: grid;
  place-items: center;
  color: var(--ink-dim);
  flex-shrink: 0;
}
.t-pm-name { font-weight: 500; color: var(--ink); font-size: 13px; }
.t-pm-meta { font-family: "JetBrains Mono", "IBM Plex Mono", monospace; font-size: 11px; color: var(--ink-muted); }

/* Category badge */
.t-cat {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 10px;
  text-transform: lowercase;
  letter-spacing: 0.5px;
  padding: 3px 8px;
  border: 1px solid var(--line-2);
  display: inline-block;
  color: var(--ink-dim);
}
.t-cat-dec { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 35%, transparent); }
.t-cat-cefi { color: var(--warn); border-color: color-mix(in srgb, var(--warn) 35%, transparent); }
.t-cat-play { color: var(--cyan); border-color: color-mix(in srgb, var(--cyan) 35%, transparent); }

/* Chain and volume */
.t-chain { font-family: "JetBrains Mono", "IBM Plex Mono", monospace; font-size: 11.5px; color: var(--ink-dim); }
.t-vol { font-family: "JetBrains Mono", "IBM Plex Mono", monospace; font-size: 12.5px; color: var(--ink); text-align: right; }
.t-vol-muted { color: var(--ink-muted); font-style: italic; font-size: 11px; }
```

- [ ] **Step 3: Update the table head generation in `render()`**

Locate where `render()` writes to `tableHead`. Replace whatever HTML it currently emits with:

```js
document.getElementById('tableHead').innerHTML = `
  <tr>
    <th style="width:22px"></th>
    <th class="sortable" data-sort="name">Market</th>
    <th class="sortable" data-sort="category">Category</th>
    <th class="sortable" data-sort="chain">Chain</th>
    <th class="num sortable" data-sort="volume">Volume</th>
    <th>Dev tools</th>
    <th>Agent tools</th>
  </tr>
`;
```

(Sortability is wired up in Task 11; the `data-sort` attributes are added now so that task can attach handlers without re-touching this template.)

- [ ] **Step 4: Update the row generation in `render()`**

Find the section in `render()` that generates `tableBody` rows. Within that loop, replace whatever cell HTML it currently produces with the following (per row):

```js
const initial = (pm.name[0] || '?').toUpperCase();
const catClass = pm.category === 'Decentralized' ? 't-cat-dec'
               : pm.category === 'Regulated/CeFi' ? 't-cat-cefi'
               : 't-cat-play';
const volDisplay = (pm.volumeNumeric > 0)
  ? esc(pm.volumeEstimate || '—')
  : `<span class="t-vol-muted">${esc(pm.volumeEstimate || 'undisclosed')}</span>`;

const rowHtml = `
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
    <td><span class="t-cat ${catClass}">${esc(pm.category)}</span></td>
    <td class="t-chain">${esc(pm.chain || '—')}</td>
    <td class="t-vol">${volDisplay}</td>
    <td><!-- dev tools cell - filled by Task 9 --></td>
    <td><!-- agent tools cell - filled by Task 9 --></td>
  </tr>
`;
```

Concatenate this `rowHtml` for every PM and assign the result to `tableBody.innerHTML`. Keep the existing `esc()` helper function.

- [ ] **Step 5: Verify**

Open the page. Expected:
- Table with 7 column headers in mono uppercase: ` · Market · Category · Chain · Volume · Dev tools · Agent tools`.
- 28 rows (or filtered subset). Each row shows a 24×24 monogram tile with the first letter, the PM name (sans 13px), and the bare domain (mono 11px muted) on a second line. Category is a hairline-bordered mono pill, accent-green for decentralized, amber for cefi, cyan for play. Chain is mono dim. Volume is right-aligned mono.
- Dev tools and Agent tools columns are blank (filled in next task).
- Hover any row → background tints to `--bg-1`.
- Click `decentralized` chip → only decentralized rows remain. Click `all` → all 28 return.
- Toggle theme → table renders cleanly in both.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Restyle Landscape table header + base row cells

New .t-table with hairline borders, 7 sortable column headers in
mono uppercase, monogram-tile PM cell, category badge with tinted
border, mono chain and volume cells. Dev/agent tool cells are
intentionally empty until Task 9.

Refs spec sections 3, 5 (components 5, 6, 7)."
```

---

### Task 9: Tool pills + Dev/Agent tool cells

Implements spec §5 (component 8).

**Files:**
- Modify: `index.html` `<style>` block (append tool pill CSS)
- Modify: `index.html` `render()` function — fill the dev/agent tool cells in the row template from Task 8

- [ ] **Step 1: Append tool pill CSS**

```css
/* --- Tool pills ------------------------------------------- */
.t-tools { display: flex; gap: 5px; flex-wrap: wrap; }
.t-pill {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 10px;
  padding: 2px 7px;
  border: 1px solid var(--line-2);
  color: var(--ink-dim);
  letter-spacing: 0.3px;
  text-transform: uppercase;
}
.t-pill-api    { color: var(--pill-api);   border-color: var(--pill-api-bd); }
.t-pill-sdk    { color: var(--pill-sdk);   border-color: var(--pill-sdk-bd); }
.t-pill-cli    { color: var(--pill-cli);   border-color: var(--pill-cli-bd); }
.t-pill-mcp    { color: var(--pill-mcp);   border-color: var(--pill-mcp-bd); }
.t-pill-skill  { color: var(--pill-skill); border-color: var(--pill-skill-bd); }
.t-pill-fw     { color: var(--pill-fw);    border-color: var(--pill-fw-bd); }
.t-pill-ws     { color: var(--pill-api);   border-color: var(--pill-api-bd); }
.t-pill-none   { color: var(--ink-muted); border-color: transparent; padding-left: 0; }
```

- [ ] **Step 2: Add a tool-type → pill-class helper to the `<script>`**

Inside the `<script>` block, near the existing helpers (`esc`, `catBadgeClass`), add:

```js
function toolPillClass(type) {
  switch ((type || '').toLowerCase()) {
    case 'api':       return 't-pill t-pill-api';
    case 'sdk':       return 't-pill t-pill-sdk';
    case 'websocket': return 't-pill t-pill-ws';
    case 'cli':       return 't-pill t-pill-cli';
    case 'mcp':       return 't-pill t-pill-mcp';
    case 'skill':     return 't-pill t-pill-skill';
    case 'framework': return 't-pill t-pill-fw';
    default:          return 't-pill';
  }
}
function toolPillLabel(type) {
  const t = (type || '').toLowerCase();
  if (t === 'websocket') return 'WS';
  if (t === 'framework') return 'FW';
  return (type || '').toUpperCase();
}
```

- [ ] **Step 3: Fill the dev/agent tool cells in the row template**

In `render()`, in the row template from Task 8, replace the two placeholder comments with:

```js
const devToolsHtml = pm.coreTools.length
  ? `<div class="t-tools">${pm.coreTools.map(t => `<span class="${toolPillClass(t.type)}">${esc(toolPillLabel(t.type))}</span>`).join('')}</div>`
  : `<span class="t-pill t-pill-none">—</span>`;
const aiToolsHtml = pm.aiTools.length
  ? `<div class="t-tools">${pm.aiTools.map(t => `<span class="${toolPillClass(t.type)}">${esc(toolPillLabel(t.type))}</span>`).join('')}</div>`
  : `<span class="t-pill t-pill-none">—</span>`;
```

And update the row template's two placeholder cells:

```html
<td>${devToolsHtml}</td>
<td>${aiToolsHtml}</td>
```

(Use template literal interpolation in the existing JS string.)

- [ ] **Step 4: Verify**

Open the page. Expected:
- Every row's Dev tools and Agent tools columns now show one or more small mono uppercase pills, each with a hairline border tinted by tool type (API blue, SDK violet, CLI green, MCP pink, Skill cyan, Framework amber, WS blue).
- PMs with no tools show a faint `—` glyph.
- Toggle theme — pill colors swap to the light-theme palette and remain readable on the off-white background.
- Polymarket should show: `[API] [SDK] [WS]` in dev tools and `[CLI] [FW] [SKILL]` in agent tools (or close).

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Add tool-type pills and fill Dev/Agent tool cells

Six pill variants (API, SDK, CLI, MCP, Skill, Framework) with type-
tinted hairline borders. WebSocket reuses the API color. Empty
columns render a single muted em-dash.

Refs spec section 5 (component 8)."
```

---

### Task 10: Expanded detail row (Landscape)

Implements spec §5 (component 9).

**Files:**
- Modify: `index.html` `<style>` block (append detail row CSS)
- Modify: `index.html` `render()` function — emit a `tr.t-detail` row immediately after each `tr.t-row`, hidden by default
- Modify: `index.html` `<script>` — add a click handler that toggles the detail row

- [ ] **Step 1: Append detail row CSS**

```css
/* --- Expanded detail row (Landscape) ---------------------- */
.t-detail { display: none; }
.t-detail.open { display: table-row; }
.t-row.expanded { background: var(--bg-1) !important; }
.t-row.expanded .t-chev { color: var(--accent); }
.t-detail td { padding: 0; background: var(--bg-1); border-bottom: 1px solid var(--line); }
.t-detail-inner {
  padding: 20px 24px 24px 58px;
  display: grid;
  grid-template-columns: 2fr 3fr;
  gap: 32px;
}
.t-detail-h {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1.2px;
  color: var(--ink-muted);
  margin-bottom: 10px;
}
.t-detail-h::before { content: "// "; }
.t-detail-about p {
  font-size: 13px;
  color: var(--ink-dim);
  line-height: 1.65;
}
.t-detail-links {
  margin-top: 16px;
  display: flex;
  gap: 14px;
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 11px;
}
.t-detail-links a { color: var(--ink-dim); border-bottom: 1px solid transparent; }
.t-detail-links a:hover { color: var(--accent); border-bottom-color: var(--accent); }
.t-detail-tools-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.t-detail-tool {
  border-left: 2px solid var(--line-2);
  padding: 6px 0 6px 12px;
}
.t-detail-tool .t-dt-type {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: var(--ink-muted);
  margin-bottom: 2px;
}
.t-detail-tool .t-dt-name {
  font-size: 13px;
  color: var(--ink);
  font-weight: 500;
  margin-bottom: 2px;
}
.t-detail-tool .t-dt-desc {
  font-size: 12px;
  color: var(--ink-dim);
  line-height: 1.5;
}
```

- [ ] **Step 2: Emit a detail row after each main row in `render()`**

In the row generation loop in `render()`, after the `rowHtml` template literal, add a second template literal for the detail row:

```js
const allTools = [...pm.coreTools, ...pm.aiTools];
const detailToolsHtml = allTools.map(t => `
  <div class="t-detail-tool">
    <div class="t-dt-type">${esc((t.type || '').toLowerCase())}</div>
    <div class="t-dt-name">${esc(t.name)}</div>
    <div class="t-dt-desc">${esc(t.description || '')}</div>
  </div>
`).join('');

const linksHtml = [
  pm.website ? `<a href="${esc(pm.website)}" target="_blank">website</a>` : '',
  pm.twitter ? `<a href="${esc(pm.twitter)}" target="_blank">twitter</a>` : ''
].filter(Boolean).join('');

const detailHtml = `
  <tr class="t-detail" data-pm="${esc(pm.name)}">
    <td colspan="7">
      <div class="t-detail-inner">
        <div class="t-detail-about">
          <div class="t-detail-h">about</div>
          <p>${esc(pm.description || '')}</p>
          <div class="t-detail-links">${linksHtml}</div>
        </div>
        <div>
          <div class="t-detail-h">toolchain · ${allTools.length}</div>
          <div class="t-detail-tools-grid">${detailToolsHtml}</div>
        </div>
      </div>
    </td>
  </tr>
`;
```

Concatenate `rowHtml + detailHtml` per PM into the `tableBody.innerHTML` accumulator.

- [ ] **Step 3: Add the click-to-expand handler**

Inside `render()`, **after** assigning `tableBody.innerHTML`, add:

```js
document.querySelectorAll('#tableBody .t-row').forEach(row => {
  row.addEventListener('click', () => {
    const isOpen = row.classList.toggle('expanded');
    const detail = row.nextElementSibling;
    if (detail && detail.classList.contains('t-detail')) {
      detail.classList.toggle('open', isOpen);
    }
    row.querySelector('.t-chev').textContent = isOpen ? '▼' : '▶';
  });
});
```

- [ ] **Step 4: Verify**

Open the page. Expected:
- Click any row → its chevron flips `▶ → ▼`, the row background tints `--bg-1`, and a detail panel slides in (instantly — no animation) below it.
- Detail panel: two-column grid. Left column has `// ABOUT` header + the PM description paragraph + a `website · twitter` row of mono links. Right column has `// TOOLCHAIN · N` header + a 2-column grid of tools, each with a 2px left border, a tiny mono uppercase type label, the tool name, and its description.
- Click the row again → collapses.
- Click multiple rows → multiple panels open simultaneously.
- Hover the website/twitter links → they turn accent green and gain an underline.
- Toggle theme → detail panel still readable.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Build expanded detail row for Landscape PMs

Click-to-expand reveals a 2-col detail panel: about + external links
on the left, toolchain grid on the right. Multiple rows can be open
at once. Chevron flips ▶/▼ on toggle.

Refs spec section 5 (component 9)."
```

---

## Phase 4 — Sort, URL state, deep links

### Task 11: Sortable columns

Implements spec §4 (sort).

**Files:**
- Modify: `index.html` `<script>` — add a `Sort` module and integrate with `render()`

- [ ] **Step 1: Add the Sort module**

Inside the `<script>` block, near the `Theme` module from Task 2, add:

```js
// === Sort ====================================================
const Sort = {
  state: { key: null, dir: 'asc' }, // dir: 'asc' | 'desc'
  comparators: {
    name:     (a, b) => a.name.localeCompare(b.name),
    category: (a, b) => (a.category || '').localeCompare(b.category || ''),
    chain:    (a, b) => (a.chain || '').localeCompare(b.chain || ''),
    volume:   (a, b) => (a.volumeNumeric || 0) - (b.volumeNumeric || 0),
  },
  apply(rows) {
    if (!this.state.key) return rows;
    const cmp = this.comparators[this.state.key];
    if (!cmp) return rows;
    const sorted = rows.slice().sort(cmp);
    if (this.state.dir === 'desc') sorted.reverse();
    return sorted;
  },
  cycle(key) {
    if (this.state.key !== key) { this.state.key = key; this.state.dir = 'asc'; }
    else if (this.state.dir === 'asc') { this.state.dir = 'desc'; }
    else { this.state.key = null; this.state.dir = 'asc'; }
  }
};
```

- [ ] **Step 2: Apply sort inside `render()`**

In `render()`, find the line that filters `DATA` into the displayed list (it varies but typically looks like `let displayed = DATA.filter(...)`). After filtering and **before** building `tableBody.innerHTML`, add:

```js
displayed = Sort.apply(displayed);
```

Adapt the variable name to whatever the existing code uses (could be `filtered`, `pms`, etc.).

- [ ] **Step 3: Render sort arrows in the table head**

Replace the `tableHead.innerHTML` block from Task 8 with this version that includes arrow rendering:

```js
const arrow = key => {
  if (Sort.state.key !== key) return '';
  return `<span class="t-sort-arrow mono">${Sort.state.dir === 'asc' ? '↑' : '↓'}</span>`;
};
document.getElementById('tableHead').innerHTML = `
  <tr>
    <th style="width:22px"></th>
    <th class="sortable" data-sort="name">Market${arrow('name')}</th>
    <th class="sortable" data-sort="category">Category${arrow('category')}</th>
    <th class="sortable" data-sort="chain">Chain${arrow('chain')}</th>
    <th class="num sortable" data-sort="volume">Volume${arrow('volume')}</th>
    <th>Dev tools</th>
    <th>Agent tools</th>
  </tr>
`;
```

- [ ] **Step 4: Wire up header click handlers**

Inside `render()`, after setting the head HTML, add:

```js
document.querySelectorAll('#tableHead th.sortable').forEach(th => {
  th.addEventListener('click', () => {
    Sort.cycle(th.dataset.sort);
    render();
  });
});
```

- [ ] **Step 5: Verify**

Open the page. Expected:
- Hover the `Market` header → cursor becomes pointer and color brightens.
- Click `Volume` → table sorts by volume ascending (smallest first), green `↑` appears next to the header.
- Click `Volume` again → sorts descending (largest first, Polymarket on top), arrow becomes `↓`.
- Click a third time → sort resets, arrow disappears.
- Click `Market` → sorts alphabetically.
- Sort persists across filter chip clicks.
- Toggle theme → arrows remain accent-green-equivalent.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Add column sort to Landscape table (Market/Category/Chain/Volume)

Sort module holds state and per-column comparators (Volume by
numeric, others by string compare). Clicking a header cycles
asc → desc → none. Re-renders the table on each click; sort
arrow indicator next to the active header.

Refs spec section 4 (sort)."
```

---

### Task 12: URL hash router (filters, sort, search, view)

Implements spec §4 (URL state).

**Files:**
- Modify: `index.html` `<script>` — add a `Router` module and integrate with `render()` / `initViewNav()`

- [ ] **Step 1: Declare a global search-query variable**

Find where `catFilter` and `toolFilter` are declared (typically near the top of the `<script>` block, around line 500-something). Below those declarations, add:

```js
let searchQ = '';
```

This is referenced by both the existing search box input handler and the new Router below.

- [ ] **Step 2: Add the Router module**

Inside the `<script>` block, near the `Sort` module, add:

```js
// === Router ==================================================
const Router = {
  parse() {
    const hash = (location.hash || '').replace(/^#\/?/, '');
    const [pathPart, queryPart] = hash.split('?');
    const segments = pathPart.split('/').filter(Boolean);
    const view = segments[0] || 'landscape';
    const pmSlug = segments[1] || null;
    const params = new URLSearchParams(queryPart || '');
    return {
      view: (view === 'testing') ? 'testing' : 'landscape',
      pm: pmSlug,
      cat: params.get('cat') || null,
      has: params.get('has') || null,
      q:   params.get('q')   || '',
      sort: params.get('sort') || null,
      dir:  params.get('dir')  === 'desc' ? 'desc' : 'asc',
    };
  },
  write(state) {
    const params = new URLSearchParams();
    if (state.cat) params.set('cat', state.cat);
    if (state.has) params.set('has', state.has);
    if (state.q)   params.set('q', state.q);
    if (state.sort){ params.set('sort', state.sort); params.set('dir', state.dir); }
    const path = state.view + (state.pm ? '/' + state.pm : '');
    const qs = params.toString();
    const next = '#/' + path + (qs ? '?' + qs : '');
    if (next !== location.hash) history.replaceState(null, '', next);
  },
  slug(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); },
  init() {
    window.addEventListener('hashchange', () => this.applyToState());
    this.applyToState();
  },
  applyToState() {
    const s = this.parse();
    // Filters
    if (typeof catFilter !== 'undefined') catFilter = s.cat;
    if (typeof toolFilter !== 'undefined') toolFilter = s.has;
    if (typeof searchQ !== 'undefined') searchQ = s.q;
    const sb = document.getElementById('searchBox');
    if (sb && sb.value !== s.q) sb.value = s.q;
    // Sort
    Sort.state.key = s.sort;
    Sort.state.dir = s.dir;
    // View
    const targetView = s.view;
    if (typeof currentView !== 'undefined' && currentView !== targetView) {
      const tab = document.querySelector(`.t-tab[data-view="${targetView}"]`);
      if (tab) tab.click();
      else (targetView === 'landscape' ? render() : renderTesting());
    } else {
      (targetView === 'landscape' ? render() : renderTesting());
    }
    // Deep-link expansion
    if (s.pm) setTimeout(() => this.scrollToAndExpand(s.pm), 0);
  },
  scrollToAndExpand(slug) {
    const rows = document.querySelectorAll('#tableBody .t-row');
    for (const row of rows) {
      if (this.slug(row.dataset.pm || '') === slug) {
        if (!row.classList.contains('expanded')) row.click();
        row.scrollIntoView({ behavior: 'smooth', block: 'center' });
        break;
      }
    }
  },
  currentState() {
    return {
      view: (typeof currentView !== 'undefined') ? currentView : 'landscape',
      pm: null,
      cat: (typeof catFilter !== 'undefined') ? catFilter : null,
      has: (typeof toolFilter !== 'undefined') ? toolFilter : null,
      q:   (typeof searchQ !== 'undefined') ? searchQ : '',
      sort: Sort.state.key,
      dir:  Sort.state.dir,
    };
  },
  push() { this.write(this.currentState()); }
};
```

- [ ] **Step 3: Wire `Router.init()` into `DOMContentLoaded`**

Replace the `DOMContentLoaded` line:

```js
window.addEventListener('DOMContentLoaded',()=>{Theme.init();render();initViewNav();});
```

with:

```js
window.addEventListener('DOMContentLoaded',()=>{Theme.init();initViewNav();Router.init();});
```

`Router.init()` calls `applyToState()` which calls `render()` itself, so we no longer need to call `render()` directly here.

- [ ] **Step 4: Push state on filter / sort / search changes**

Find the click handler that updates `catFilter` and re-renders. After it sets the new value, add:

```js
Router.push();
```

Same for `toolFilter`. For the search input, find or add an `input` event listener:

```js
document.getElementById('searchBox').addEventListener('input', e => {
  searchQ = e.target.value;
  render();
  Router.push();
});
```

For sort, in the `Sort.cycle` click handler from Task 11, add `Router.push();` after `render();`.

For the tab switcher in `initViewNav()`, after setting `currentView`, add `Router.push();`.

- [ ] **Step 5: Verify**

Open the page. Expected:
- URL is `http://localhost:8765/index.html#/landscape` on first load.
- Click `decentralized` → URL becomes `#/landscape?cat=Decentralized` (case mirrors the data — that's fine).
- Click `Volume` header twice → URL becomes `#/landscape?cat=Decentralized&sort=volume&dir=desc`.
- Type `poly` in search → URL becomes `…&q=poly`.
- Switch to testing tab → URL becomes `#/testing`. Switch back → `#/landscape`.
- Open a new tab and paste a constructed URL like `http://localhost:8765/index.html#/landscape?cat=Decentralized&sort=volume&dir=desc&q=poly`. Expected: page loads with all those filters and sort already applied; the search box is pre-filled with `poly`.
- Browser back/forward buttons should *not* spam history (we used `replaceState`), but reload preserves state.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Add hash router for filters, sort, search, and view

Router parses #/<view>[/<pm>]?<params> and writes back via
history.replaceState on every chip/sort/search/tab change. Page
state is fully reflected in the URL — shareable and reloadable.

Refs spec section 4 (URL state)."
```

---

### Task 13: Per-PM deep links

Implements spec §4 (per-PM deep link).

**Files:**
- Modify: `index.html` `<script>` — wire up the row click handler to push the PM slug into the URL

- [ ] **Step 1: Update the row expand handler in `render()`**

Replace the row click handler from Task 10 step 3 with:

```js
document.querySelectorAll('#tableBody .t-row').forEach(row => {
  row.addEventListener('click', () => {
    const isOpen = row.classList.toggle('expanded');
    const detail = row.nextElementSibling;
    if (detail && detail.classList.contains('t-detail')) {
      detail.classList.toggle('open', isOpen);
    }
    row.querySelector('.t-chev').textContent = isOpen ? '▼' : '▶';
    // Push slug into URL when opened, drop it when closed
    const state = Router.currentState();
    state.pm = isOpen ? Router.slug(row.dataset.pm) : null;
    Router.write(state);
  });
});
```

Note: this URL push is **per-row open/close**, intentionally distinct from `Router.push()` which serializes the rest of the state. Multiple rows may be expanded simultaneously, but only the most-recently-toggled PM is reflected in the URL slug — that's acceptable for "shareable deep link to a single PM".

- [ ] **Step 2: Verify**

Open the page. Expected:
- Click the Polymarket row → URL becomes `#/landscape/polymarket`. Detail panel opens. Copy the URL.
- Open a new tab, paste the URL. Page loads, scrolls to Polymarket, and auto-expands its detail panel.
- Try a constructed URL like `#/landscape/limitless?cat=Decentralized` — page loads with the decentralized filter active and Limitless expanded.
- Click an already-open row → it collapses, URL drops the slug.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add per-PM deep links and scroll-to-expand on load

Clicking a row writes its slug into the URL hash; arriving at a
slug-tagged URL expands and scrolls to the matching row. Slugs
generated by lowercasing + collapsing non-alphanumerics.

Refs spec section 4 (per-PM deep link)."
```

---

## Phase 5 — Testing page

### Task 14: Testing page stats strip

Implements spec §2 (testing stats) and §5 (component 3 — restyle for testing).

**Files:**
- Modify: `index.html` line 303 (the `#testStats` element should keep its id, just lose the `stats-bar` class)
- Modify: `index.html` `renderTesting()` — replace the stats card emission with the new `.t-stats` markup

- [ ] **Step 1: Update the static class on `#testStats`**

Find line 303:

```html
<div id="testStats" class="stats-bar"></div>
```

Replace with:

```html
<div id="testStats"></div>
```

- [ ] **Step 1b: Hide the legacy static methodology reference panel**

The current testing view (lines ~304–485) contains a large static methodology reference panel — `<div class="methodology"> ... <div class="methodology-content" id="mContent-aa"> ... </div>` — that exists at the top of the testing view describing the four test categories' check definitions. The new design moves all methodology details into the per-PM expanded detail rows (Task 17), so this top-of-page panel is now redundant.

We do not delete the markup (it's still consumed by the per-PM detail tab strip render in Task 17, which references the same `mContent-*` IDs in some renderings). Instead, hide it on the testing view by appending this CSS to the `<style>` block:

```css
/* --- Hide legacy static methodology panel on testing view -- */
#testingView > .methodology { display: none; }
```

If a future task discovers that the per-PM detail rows depend on the static panel's existence (they shouldn't — `renderTesting()` writes its own check breakdowns), this rule can be lifted.

- [ ] **Step 2: Replace the stats `innerHTML` block in `renderTesting()`**

Find the block in `renderTesting()` that writes to `#testStats`. The current block (from earlier work) writes 4 cards using `.stat-card / .label / .value / .detail` classes. Replace the `innerHTML` assignment with:

```js
document.getElementById('testStats').className = 't-stats';
document.getElementById('testStats').innerHTML = `
  <div class="t-stat"><div class="t-stat-label">agent accessibility</div><div class="t-stat-value mono">${aa.avg}</div><div class="t-stat-detail">avg grade · ${aa.count} tested · ${aa.best} a/b</div></div>
  <div class="t-stat"><div class="t-stat-label">cli / mcp</div><div class="t-stat-value mono">${cli.avg}</div><div class="t-stat-detail">avg grade · ${cli.count} tested · ${cli.best} a/b</div></div>
  <div class="t-stat"><div class="t-stat-label">skill</div><div class="t-stat-value mono">${skill.avg}</div><div class="t-stat-detail">avg grade · ${skill.count} tested · ${skill.best} a/b</div></div>
  <div class="t-stat"><div class="t-stat-label">frameworks</div><div class="t-stat-value mono">${fwProduction}/${fwTested}</div><div class="t-stat-detail">production-grade${fwUsable ? ' · ' + fwUsable + ' usable' : ''}</div></div>
`;
```

(The variables `aa`, `cli`, `skill`, `fwProduction`, `fwTested`, `fwUsable` already exist in `renderTesting()` from prior work.)

- [ ] **Step 3: Verify**

Click the `testing` tab. Expected:
- The same hairline-bordered 4-cell strip used on Landscape now appears on Testing.
- Cells: `agent accessibility / B / avg grade · 22 tested · X a/b` etc. Numbers reflect actual tested counts.
- Toggle theme — strip is correct in both.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "Restyle Testing stats strip with terminal-density tokens

Reuses the .t-stats / .t-stat components from Landscape so both
pages share one stats look. Result-oriented metrics preserved
(avg grade per dimension, A/B counts, framework production count).

Refs spec sections 2, 5 (component 3)."
```

---

### Task 15: Testing page filter bar

Implements spec §2 (testing filter bar additions) and §5 (component 4).

**Files:**
- Modify: `index.html` lines 302–303 area (insert filter bar markup inside `#testingView`)
- Modify: `index.html` `renderTesting()` — emit chips and wire up filter state

- [ ] **Step 1: Insert filter bar markup inside `#testingView`**

Find line 302:

```html
<div id="testingView">
  <div id="testStats"></div>
```

Insert a filter bar between them:

```html
<div id="testingView">
  <div id="testStats"></div>
  <div class="t-filters" id="testFilters">
    <div class="t-filter-group" id="testCatFilters"></div>
    <div class="t-filter-sep"></div>
    <div class="t-filter-group" id="testHasFilters"></div>
    <div class="t-filter-spacer"></div>
    <input type="text" class="t-search mono" id="testSearchBox" placeholder="/ search…">
  </div>
```

- [ ] **Step 2: Add filter state for testing inside `<script>`**

Near the existing `catFilter` / `toolFilter` declarations in the JS, add:

```js
let testCatFilter = null;
let testHasFilter = null;
let testSearchQ = '';
```

- [ ] **Step 3: Render chips and apply filter inside `renderTesting()`**

At the very top of `renderTesting()` (after `const pms = getTestablePMs();`), add:

```js
// Render filter chips
const tcats = ['Decentralized', 'Play Money'];
document.getElementById('testCatFilters').innerHTML =
  `<button class="t-chip${testCatFilter === null ? ' active' : ''}" data-tcat="">all</button>` +
  tcats.map(c => `<button class="t-chip${testCatFilter === c ? ' active' : ''}" data-tcat="${c}">${c.toLowerCase()}</button>`).join('');
document.getElementById('testHasFilters').innerHTML = [
  { key: 'aa', label: 'has agent access' },
  { key: 'cli', label: 'has cli/mcp' },
  { key: 'skill', label: 'has skill' },
].map(t => `<button class="t-chip${testHasFilter === t.key ? ' active' : ''}" data-thas="${t.key}">${t.label}</button>`).join('');
const tsb = document.getElementById('testSearchBox');
if (tsb) tsb.value = testSearchQ;
```

Then filter the `pms` array based on testCatFilter / testHasFilter / testSearchQ:

```js
let displayed = pms;
if (testCatFilter) displayed = displayed.filter(p => p.category === testCatFilter);
if (testHasFilter === 'aa') displayed = displayed.filter(p => AA_RESULTS[p.name]);
if (testHasFilter === 'cli') displayed = displayed.filter(p => (TEST_RESULTS[p.name]||{}).cliMcp);
if (testHasFilter === 'skill') displayed = displayed.filter(p => (TEST_RESULTS[p.name]||{}).skill);
if (testSearchQ) {
  const q = testSearchQ.toLowerCase();
  displayed = displayed.filter(p => p.name.toLowerCase().includes(q) || (p.chain || '').toLowerCase().includes(q));
}
```

Then later in `renderTesting()`, the existing `pms.forEach((pm, i) => { ... })` loop should be replaced with `displayed.forEach((pm, i) => { ... })`.

- [ ] **Step 4: Wire up testing filter chip handlers**

Inside `renderTesting()`, after the chip HTML is set, add:

```js
document.querySelectorAll('#testCatFilters .t-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    testCatFilter = chip.dataset.tcat || null;
    renderTesting();
  });
});
document.querySelectorAll('#testHasFilters .t-chip').forEach(chip => {
  chip.addEventListener('click', () => {
    testHasFilter = (testHasFilter === chip.dataset.thas) ? null : chip.dataset.thas;
    renderTesting();
  });
});
document.getElementById('testSearchBox').addEventListener('input', e => {
  testSearchQ = e.target.value;
  renderTesting();
});
```

- [ ] **Step 5: Verify**

Click the `testing` tab. Expected:
- A filter bar appears below the stats strip with the same look as the Landscape filter bar.
- Chips: `[all] [decentralized] [play money]  |  [has agent access] [has cli/mcp] [has skill]`.
- Click `decentralized` → testing rows filter to decentralized only. Click `all` → reset.
- Click `has skill` → only PMs with skill results remain.
- Type `poly` in search → table filters live.
- Toggle theme — chips and search remain readable.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Add filter bar to Testing page

Reuses the .t-filters component from Landscape. Three category
chips (all/decentralized/play money) and three has-tools chips
(agent access / cli-mcp / skill), plus a mono search input.
Filter state is local to the testing view; URL state for testing
filters is intentionally deferred — will revisit if needed.

Refs spec sections 2, 5 (component 4)."
```

---

### Task 16: Testing table — head, base cells, grade badges

Implements spec §2 (testing table columns) and §5 (component 5).

**Files:**
- Modify: `index.html` lines 487–492 area (replace `.test-table-wrap`)
- Modify: `index.html` `<style>` block (append testing-specific CSS)
- Modify: `index.html` `renderTesting()` — replace table head + body emission

- [ ] **Step 1: Replace static testing table wrapper**

Find lines 487–492:

```html
<div class="results-count" id="testResultsCount"></div>
<div class="test-table-wrap">
  <table class="test-table">
    <thead id="testTableHead"></thead>
    <tbody id="testTableBody"></tbody>
  </table>
</div>
```

Replace with:

```html
<div class="t-results-count mono" id="testResultsCount"></div>
<div class="t-table-wrap">
  <table class="t-table" id="testTable">
    <thead id="testTableHead"></thead>
    <tbody id="testTableBody"></tbody>
  </table>
</div>
```

- [ ] **Step 2: Append grade badge CSS**

```css
/* --- Testing grade badges --------------------------------- */
.t-grade {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border: 1px solid var(--line-2);
  display: inline-block;
  color: var(--ink-dim);
  letter-spacing: 0.4px;
}
.t-grade-a { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.t-grade-b { color: var(--cyan);   border-color: color-mix(in srgb, var(--cyan)   40%, transparent); }
.t-grade-c { color: #c084fc;       border-color: #4a2a6f; }
.t-grade-d { color: var(--warn);   border-color: color-mix(in srgb, var(--warn)   40%, transparent); }
.t-grade-f { color: var(--red);    border-color: color-mix(in srgb, var(--red)    40%, transparent); }
.t-grade-na { color: var(--ink-muted); border-color: var(--line); border-style: dashed; }
.t-grade-fwprod   { color: var(--accent); border-color: color-mix(in srgb, var(--accent) 40%, transparent); }
.t-grade-fwusable { color: var(--cyan);   border-color: color-mix(in srgb, var(--cyan) 40%, transparent); }
.t-grade-fwexp    { color: var(--warn);   border-color: color-mix(in srgb, var(--warn) 40%, transparent); }
.t-cell-tools { font-family: "JetBrains Mono", monospace; font-size: 10.5px; color: var(--ink-muted); margin-left: 6px; }
.t-cell { display: inline-flex; align-items: center; gap: 4px; }
```

- [ ] **Step 3: Add a grade-class helper to `<script>`**

Near `toolPillClass`, add:

```js
function gradeClass(grade) {
  if (!grade) return 't-grade t-grade-na';
  const g = grade.toLowerCase();
  if (g === 'a' || g === 'b' || g === 'c' || g === 'd' || g === 'f') return 't-grade t-grade-' + g;
  if (g === 'production')   return 't-grade t-grade-fwprod';
  if (g === 'usable')       return 't-grade t-grade-fwusable';
  if (g === 'experimental') return 't-grade t-grade-fwexp';
  return 't-grade t-grade-na';
}
```

- [ ] **Step 4: Replace `renderTesting()` head + body markup**

Inside `renderTesting()`, find the existing `headHtml` block (which currently builds `<th>PM</th><th>Category</th><th>Dev Tools</th>...`). Replace it with:

```js
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
```

Find the existing row generation (`displayed.forEach((pm, i) => { ... })`). Replace the per-row body cells with:

```js
const initial = (pm.name[0] || '?').toUpperCase();
const catClass = pm.category === 'Decentralized' ? 't-cat-dec'
               : pm.category === 'Regulated/CeFi' ? 't-cat-cefi'
               : 't-cat-play';
const aaRes = AA_RESULTS[pm.name];
const res = TEST_RESULTS[pm.name] || {};
const devToolCount = pm.coreTools.length;

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
    <td><span class="t-cat ${catClass}">${esc(pm.category)}</span></td>
    <td class="t-vol">${devToolCount}</td>
    <td><span class="t-cell">${aaCell}</span></td>
    <td>${tcell('cliMcp')}</td>
    <td>${tcell('skill')}</td>
    <td>${tcell('framework')}</td>
  </tr>
`;
```

(The detail row generated by existing testing code still gets appended below — that gets restyled in Task 17.)

- [ ] **Step 5: Verify**

Click `testing`. Expected:
- New testing table appears with columns `· Market · Category · Dev tools · Agent Access · CLI/MCP · Skill · Framework`.
- Rows show monogram tile + PM name + domain (matching Landscape style), category badge, dev-tools count as a small mono number, then four grade badges.
- Grade badges: A green, B cyan, C purple, D amber, F red, untested dashed muted.
- Toggle theme — colors swap correctly.
- Click filter chips → table filters.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "Restyle Testing table head and rows in terminal-density tokens

Eight columns (chevron + Market + Category + Dev tools count + AA +
CLI/MCP + Skill + Framework). Grade badges are mono uppercase pills
with type-tinted hairline borders, sharing the .t-grade-* tokens.
Sortable headers carry data-tsort attributes for Task 18.

Refs spec sections 2, 5 (component 5)."
```

---

### Task 17: Testing expanded detail row — restyle, preserve methodology tabs

Implements spec §5 (component 10).

**Files:**
- Modify: `index.html` `<style>` block (append testing-detail CSS overrides for the existing methodology rendering)
- Modify: `index.html` `renderTesting()` — wrap the existing per-PM detail markup in `tr.t-detail`

- [ ] **Step 1: Append testing-detail CSS overrides**

```css
/* --- Testing detail row ----------------------------------- */
/* Reuses .t-detail layout from Landscape, but the right column is
   the existing methodology tab strip (AA/CLI/Skill/Framework) which
   keeps its current rendering — only colors are restyled here. */
.t-detail .methodology { margin-top: 0; padding-top: 0; border-top: 0; }
.t-detail .m-tabs {
  display: flex;
  gap: 0;
  margin-bottom: 14px;
  border-bottom: 1px solid var(--line);
}
.t-detail .m-tab {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 11px;
  color: var(--ink-dim);
  text-transform: lowercase;
  letter-spacing: 0.4px;
  padding: 6px 14px;
  border: 0;
  border-bottom: 1px solid transparent;
  background: transparent;
  cursor: pointer;
}
.t-detail .m-tab:hover { color: var(--ink); }
.t-detail .m-tab.active { color: var(--ink); border-bottom-color: var(--accent); }
.t-detail .methodology-content { display: none; }
.t-detail .methodology-content.open { display: block; }

.t-detail .m-checks-list,
.t-detail .m-dim-block,
.t-detail .m-check-item {
  color: var(--ink-dim);
  font-size: 12px;
}
.t-detail .m-dim-label {
  font-family: "JetBrains Mono", "IBM Plex Mono", monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--ink-muted);
  margin: 12px 0 6px;
}
.t-detail .m-check-num { color: var(--ink-muted); margin-right: 8px; }
.t-detail .m-check-name { color: var(--ink); }
.t-detail .m-check-why { color: var(--ink-dim); display: none; margin-left: 8px; }
.t-detail .m-check-why.visible { display: inline; }
.t-detail .m-show-more {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: var(--ink-dim);
  background: transparent;
  border: 1px solid var(--line);
  padding: 4px 10px;
  margin-top: 12px;
  cursor: pointer;
}
.t-detail .m-show-more:hover { color: var(--ink); border-color: var(--line-2); }
```

- [ ] **Step 2: Wrap existing detail markup in `tr.t-detail`**

In `renderTesting()`, after the row body block from Task 16, the existing code emits a long per-PM detail block (the methodology tab strip + check breakdowns). Wrap it like this:

```js
bodyHtml += `<tr class="t-detail" data-pm="${esc(pm.name)}"><td colspan="8"><div class="t-detail-inner" style="grid-template-columns: 1fr;">`;
// ... the existing methodology HTML (tab strip, AA panel, CLI panel, skill panel, framework panel) goes here unchanged ...
bodyHtml += `</div></td></tr>`;
```

(Override `grid-template-columns: 1fr;` inline because the testing detail uses the full width, not a 2-column layout.)

- [ ] **Step 3: Add expand handler for testing rows**

In `renderTesting()`, after `testTableBody.innerHTML = bodyHtml;`, add:

```js
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
```

- [ ] **Step 4: Verify**

Click `testing`. Expected:
- Click any row in the testing table → it expands to show the methodology tab strip (Agent Accessibility / CLI/MCP / Skill / Framework). Switching tabs reveals each per-check breakdown using the new mono / hairline / dim-grey terminal styling.
- Compare against the dark theme of the mock for visual consistency.
- Toggle theme — methodology content remains readable.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "Restyle Testing detail rows (methodology tab strip)

Wraps the existing per-PM testing detail markup in the new .t-detail
row chrome and overrides .m-tabs / .m-tab / .m-check-* selectors
inside it to inherit the terminal-density tokens. Methodology tab
content itself is structurally unchanged.

Refs spec section 5 (component 10)."
```

---

## Phase 6 — Responsive

### Task 18: Tablet breakpoint (640–1023px)

Implements spec §6.

**Files:**
- Modify: `index.html` `<style>` block (append `@media` block)

- [ ] **Step 1: Append the tablet media query**

```css
/* --- Tablet (640–1023px) ---------------------------------- */
@media (max-width: 1023px) {
  .t-shell { padding: 24px 20px 80px; }
  .t-stats { grid-template-columns: 1fr 1fr; }
  .t-stat:nth-child(2) { border-right: 0; }
  .t-stat:nth-child(1), .t-stat:nth-child(2) { border-bottom: 1px solid var(--line); }
  .t-filters { flex-wrap: wrap; }
  .t-filter-spacer { display: none; }
  .t-search { flex: 1 0 100%; margin-top: 8px; }
  .t-table thead th { padding: 12px 8px 9px; font-size: 9.5px; }
  .t-table tbody td { padding: 12px 8px; }
  .t-detail-inner { padding: 18px 16px 22px 40px; gap: 24px; }
}
```

- [ ] **Step 2: Verify**

Open the page. Resize the browser window to 800px wide (or use DevTools responsive mode at 800px). Expected:
- Stats strip becomes a 2×2 grid with internal hairline dividers.
- Filter chips wrap onto two lines; search input drops to its own row at full width below the chips.
- Table padding tightens but all columns still visible (some horizontal scroll allowed if absolutely needed — but test that there isn't any at 800px).
- Toggle theme.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add tablet responsive breakpoint (640–1023px)

Stats strip becomes 2x2, filter chips wrap onto two lines with the
search input dropping to a full-width row. Table padding tightens.

Refs spec section 6."
```

---

### Task 19: Mobile breakpoint (<640px) — table → card list

Implements spec §6 (mobile card layout).

**Files:**
- Modify: `index.html` `<style>` block (append `@media` block)

- [ ] **Step 1: Append the mobile media query**

```css
/* --- Mobile (<640px) -------------------------------------- */
@media (max-width: 639px) {
  .t-shell { padding: 16px 16px 60px; }
  .t-topbar { flex-wrap: wrap; gap: 12px; row-gap: 16px; }
  .t-tabs { order: 3; flex: 1 0 100%; justify-content: flex-start; }
  .t-topbar-right { gap: 10px; }
  .t-mcount { display: none; }

  .t-hero-headline { font-size: 26px; letter-spacing: -0.6px; }
  .t-hero-sub { font-size: 13px; }

  .t-stats { grid-template-columns: 1fr; }
  .t-stat { border-right: 0; border-bottom: 1px solid var(--line); }
  .t-stat:last-child { border-bottom: 0; }

  .t-filters { padding: 10px 0 12px; gap: 6px; }
  .t-filter-group { overflow-x: auto; flex-wrap: nowrap; padding-bottom: 4px; }
  .t-filter-sep { display: none; }
  .t-search { flex: 1 0 100%; margin-top: 6px; }

  /* Card list layout: hide table chrome, render rows as cards */
  .t-table thead { display: none; }
  .t-table, .t-table tbody, .t-table tr, .t-table td { display: block; width: 100%; }
  .t-table tbody tr.t-row {
    border: 1px solid var(--line);
    margin-bottom: 12px;
    padding: 14px 14px 12px;
    position: relative;
  }
  .t-table tbody tr.t-row:hover { background: var(--bg-1); }
  .t-table tbody tr.t-row td {
    padding: 0;
    border: 0;
  }
  .t-table tbody tr.t-row td.t-chev {
    position: absolute;
    top: 14px; right: 14px;
    width: auto;
  }
  .t-table tbody tr.t-row td:not(.t-chev) {
    margin-bottom: 8px;
  }
  .t-table tbody tr.t-row td:last-child { margin-bottom: 0; }

  /* Detail row in card mode */
  .t-detail.open { display: block; }
  .t-detail td { padding: 0; border: 0; background: transparent; }
  .t-detail-inner {
    padding: 14px 0 0;
    grid-template-columns: 1fr !important;
    gap: 16px;
    border-top: 1px solid var(--line);
    margin-top: 12px;
  }
  .t-detail-tools-grid { grid-template-columns: 1fr; }
}
```

- [ ] **Step 2: Verify**

Open the page. Resize to 380px wide. Expected:
- Topbar wraps; tabs drop to their own row.
- Hero headline shrinks (26px).
- Stats strip stacks 1×4 vertically.
- Filter chips become a horizontally scrollable strip.
- Search input goes full-width below.
- Table rows render as **cards** — each row is a hairline-bordered block stacking name → category → chain → volume → dev tools → agent tools vertically. Chevron sits in the top-right of each card.
- Click a card → expanded detail appears below the card content (within the same card border).
- Toggle theme.
- No horizontal page scroll.

Check the testing tab too — same card behavior should apply since it uses the same `.t-table` and `.t-row` classes.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "Add mobile responsive breakpoint (<640px) — table → cards

Below 640px the data table converts to a vertical card list: each
row becomes a hairline-bordered block with internal cells stacked
top-to-bottom and a chevron in the top-right. Detail row inherits
the card border via grid override. Topbar wraps with tabs on their
own line; stats strip stacks 1x4. No horizontal page scroll.

Refs spec section 6."
```

---

## Phase 7 — Cleanup & verification

### Task 20: Delete legacy CSS, mocks B and C, dead handlers

**Files:**
- Modify: `index.html` `<style>` block (remove any leftover legacy class definitions if present — they shouldn't be, since Task 1 wiped the block, but double-check after the migration)
- Modify: `index.html` `<script>` — remove any `.view-tab` / `.filter-btn` / `.stat-card` references that no longer have markup to attach to
- Delete: `mocks/b-refined.html`
- Delete: `mocks/c-hybrid.html`

- [ ] **Step 1: Search for any remaining legacy class references in index.html**

Run a grep for legacy classes that should no longer be in the markup:

```bash
grep -n 'class="header"\|class="view-nav"\|class="view-tab\|class="stats-bar\|class="stat-card\|class="filters-bar\|class="filter-btn\|class="filter-group\|class="search-box\|class="results-count\|class="pm-table\|class="pm-table-wrap\|class="test-table\|class="footer"' index.html
```

Expected: zero matches (or only matches inside string literals that the testing methodology code emits, which is fine).

- [ ] **Step 2: Strip unused selector references in JS**

Search for `.view-tab` and `.filter-btn` in the `<script>` block:

```bash
grep -n '\.view-tab\|\.filter-btn' index.html
```

Anywhere it appears, change `.view-tab, .t-tab` back to just `.t-tab` and `.filter-btn, .t-chip` back to just `.t-chip`. The legacy selectors are no longer in the markup, so dropping them simplifies the JS.

- [ ] **Step 3: Delete mocks B and C**

```bash
rm mocks/b-refined.html mocks/c-hybrid.html
```

Keep `mocks/a-terminal.html` as the frozen reference.

- [ ] **Step 4: Verify nothing broke**

Open the page. Click through every interaction one more time:
- Theme toggle (both directions)
- Tab switch (Landscape → Testing → Landscape)
- Filter chips (each one on each page)
- Search (typing and clearing)
- Sort headers (each sortable column on each page)
- Row expand on Landscape
- Row expand on Testing (with methodology tabs)
- A constructed deep link URL

All should still work. No console errors.

- [ ] **Step 5: Commit**

```bash
git add index.html mocks/
git commit -m "Drop legacy CSS class references and unused mockups

Remove leftover .view-tab / .filter-btn selectors in the JS, delete
mocks/b-refined.html and mocks/c-hybrid.html. mocks/a-terminal.html
is kept as a frozen reference snapshot of the chosen direction."
```

---

### Task 21: Final visual + interaction smoke test against the spec

This is a verification-only task — no code changes — but it ends with a final commit (the test pass record) only if you make any small fixes.

**Files:**
- (Possibly) `index.html` — only if you find a discrepancy worth fixing

- [ ] **Step 1: Open the page and walk through the spec section by section**

Open `http://localhost:8765/index.html` in the browser. Open the spec at `docs/superpowers/specs/2026-04-12-frontend-redesign-design.md` in a second tab. Walk through every numbered section and verify the rendered page matches:

- §2 Page architecture: topbar, hero, stats, filters, table, footer present in both views? ✔
- §3 Visual system: dark theme tokens, light theme tokens, mono on numbers/labels, sans on body, border radius = 0, no shadows, no gradients except the live dot halo? ✔
- §4 Interactions: sort cycles asc/desc/none, filters toggle, multiple expansions allowed, URL updates, deep link works, theme toggle persists, `/` focuses search, `Esc` clears? ✔
  - **Note:** the keyboard shortcuts (`/` and `Esc`) are not in any prior task. If they aren't working, add a small handler in Task 2's Theme module sibling area:
    ```js
    document.addEventListener('keydown', e => {
      if (e.key === '/' && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault();
        const sb = document.getElementById('searchBox');
        if (sb && sb.offsetParent) sb.focus();
      }
      if (e.key === 'Escape' && document.activeElement.tagName === 'INPUT') {
        document.activeElement.value = '';
        document.activeElement.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    ```
- §5 Components: 11 components present and visually correct? ✔
- §6 Responsive: ≥1024 / 640–1023 / <640 — all three breakpoints tested? ✔

- [ ] **Step 2: Walk through both themes**

For each of the two themes (dark, light), check:
- Topbar legible
- Hero headline + caveat readable
- Stats strip cells distinguishable
- Filter chips active state visible
- Table grade badges and tool pills color-distinct
- Detail row text readable

- [ ] **Step 3: Walk through the mock comparison**

Open `http://localhost:8765/mocks/a-terminal.html` next to the live page. The chrome (topbar, hero, stats, filters, table head) should be a near-pixel match against the dark theme. If anything is dramatically off, flag it and decide whether it's worth a small fix or whether the live page's behavior is fine.

- [ ] **Step 4: If you made any small fixes during steps 1–3, commit them**

```bash
git add index.html
git commit -m "Polish: small fixes from spec walkthrough

[describe what was tweaked]"
```

If no fixes were needed, skip this step.

- [ ] **Step 5: Final sanity check — git log should be clean and incremental**

```bash
git log --oneline -25
```

Expected: 21+ commits, each describing a single coherent step in the migration. No giant "rewrite everything" commits.

---

## Done

After Task 21 the redesign is complete. The page should render the new terminal-density design across both views, both themes, all three breakpoints, with sortable columns, URL state, deep links, and the agent-generated caveat prominently displayed. The next step is to push the branch and have the user open it in their browser for acceptance.
