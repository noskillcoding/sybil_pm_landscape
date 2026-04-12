# Frontend redesign — Sybil PM Landscape

**Date:** 2026-04-12
**Status:** Approved design, awaiting implementation plan
**Scope:** Visual + interaction redesign of `index.html` (Landscape page + Testing page). No data, methodology, or build-system changes.

---

## 1. Vision & scope

Replace the current AI-slop-feeling dashboard with a screenshot-worthy, deep-linkable, "state of the agent-prediction-markets landscape" research publication that reads as data-first research, not a SaaS admin panel. Keep the existing information architecture (stats bar → filters → table → expandable row) and rebuild every visual element from scratch in a **terminal-density** direction (DeFiLlama × Bloomberg vibe). Add a working **light theme** with the existing dark theme as default. Add **column sorting**, **URL state**, and **per-PM deep links**.

**In scope**
- Landscape page full visual + interaction rebuild
- Testing page full visual + interaction rebuild (sharing one design system with Landscape)
- Light theme with toggle
- Sortable columns
- URL hash state for filters / sort / view / expanded PM
- Per-PM deep links
- Responsive (desktop / tablet / mobile)

**Out of scope**
- Methodology pages
- Underlying `DATA`, `AA_RESULTS`, `TEST_RESULTS` shapes (presentation only)
- The dual-source-of-truth issue between `results/*.json` and inline `DATA`
- Charts / visualizations
- DSL search
- PM logos (using monogram tiles instead)
- Build step or framework migration (stays a single static `index.html`)

---

## 2. Page architecture

Both pages share the same chrome:

1. **Topbar** — left: brand `$ sybil.pm_landscape // v4 · apr 2026`. Center: tab switcher (`Landscape` / `Testing`). Right: live indicator + market count + theme toggle (`◐`).
2. **Hero** — kicker label (uppercase mono), display headline, one-paragraph subtitle, agent-generated caveat callout.
3. **Stats strip** — 4 hairline-bordered cells in a single row.
4. **Filter bar** — chip groups on the left, search input on the right.
5. **Data table** — sortable headers, one row per PM, expandable detail row.
6. **Footer** — hairline-bordered, mono small-caps, links.

**Per-page differences**

| | Landscape | Testing |
|---|---|---|
| Stats | markets / dev tools / agent tools / category split | avg AA grade / avg CLI/MCP grade / avg Skill grade / framework count |
| Table columns | Market · Category · Chain · Volume · Dev tools · Agent tools | Market · Category · Dev tools (count) · Agent Access · CLI/MCP · Skill · Framework |
| Expanded row | About + Toolchain grid + external links | Tabbed AA / CLI/MCP / Skill / Framework, each showing per-check breakdown (preserved from current code, restyled) |

Testing page filter set is identical in structure to Landscape (category chips + has-tools chips + search), restricted to the testable subset already returned by `getTestablePMs()`.

---

## 3. Visual system

### Color tokens — dark (default)

```
--bg          #000
--bg-1        #07090c
--bg-2        #0c1015
--line        #1a1f27
--line-2      #242a33
--ink         #e6e8eb
--ink-dim     #8a919b
--ink-muted   #5a626c
--accent      #4ade80
--warn        #f59e0b
--cyan        #22d3ee
--red         #ef4444
```

### Color tokens — light

```
--bg          #f6f7f9
--bg-1        #ffffff
--bg-2        #eef0f3
--line        #d8dde3
--line-2      #c2c8d0
--ink         #1f2328
--ink-dim     #5b626d
--ink-muted   #8a919b
--accent      #16a34a
--warn        #b45309
--cyan        #0891b2
--red         #b91c1c
```

Theme is a token swap on `[data-theme="light"]` applied to `<html>`.

### Typography

- **Sans:** `-apple-system, "Inter", "SF Pro Text", sans-serif` — body, PM names, hero headline.
- **Mono:** `"JetBrains Mono", "IBM Plex Mono", "SF Mono", Menlo, monospace` — labels, numbers, chain names, prompt symbols, filter chips, table headers.
- **Hero headline:** 34px / 700 / -1px tracking / sans, with a mono kicker label (10–11px, uppercase, 1.5px tracking, `--ink-muted`) above it.
- **Section headers in expanded row:** 10px mono uppercase, 1.2px tracking.
- **Numbers:** mono with `font-feature-settings: 'tnum'` so columns line up.
- No web font is required for either family — system stack falls through cleanly. JetBrains Mono is loaded from Google Fonts CDN with `display=swap` if available; otherwise system mono is used.

### Geometry

- **Border radius: 0** everywhere except round status dots.
- **Borders:** 1px solid `--line` for all hairlines. No shadows. No gradients. No glows except a single 0-blur halo on the "live" dot.
- **Spacing scale:** 4 / 8 / 12 / 16 / 20 / 24 / 32 / 48 / 64.
- **Container max-width:** 1440px.
- **Side padding:** 32px desktop, 20px tablet, 16px mobile.

### Accent usage rules (anti-AI-slop)

The accent green appears **only** in:

- The "live" dot in the topbar
- The brand prompt `$`
- The Decentralized category tag (border + text only, no background fill)
- Hover affordances on filter chips (border lighten)
- Active filter chip (text + border + 6%-alpha background)
- Link underlines on hover
- The 1px border on the agent-generated caveat callout
- The active tab indicator (1px bottom border under the active topbar tab)

It does **not** appear on buttons, headlines, hero text, table headers, or backgrounds. Buttons are 1px-bordered hairlines with a hover state — never filled. No gradients anywhere. No drop shadows. No emoji except `⚠` in the caveat. No SVG icons in the topbar — text only.

---

## 4. Interactions & state

### Sort

- Click sortable column header → sort asc.
- Click again → sort desc.
- Click third time → reset (restore default order, which is `DATA` array order on Landscape and `getTestablePMs()` order on Testing).
- Sorted column shows mono `↑` / `↓` after the header label.
- Numeric columns sort by underlying numeric (`volumeNumeric`, grade rank), not by display string.
- Untested grades sort to the bottom regardless of direction.

**Sortable columns**
- Landscape: Market, Category, Chain, Volume.
- Testing: Market, Category, Dev tools, Agent Access, CLI/MCP, Skill, Framework.

### Filter

- Filter chips toggle active state on click.
- Multiple chips within the same group are mutually exclusive (Category: All / Decentralized / Regulated / Play).
- Multiple chips across groups stack as AND (`Decentralized` AND `Has agent tools`).
- Search input filters on PM name + chain + tool names (case-insensitive substring).
- Empty state: a single mono row "no markets match the current filter." with a `clear filters` link.

### Expand

- Clicking anywhere on a row toggles expanded detail.
- Chevron rotates `▶ → ▼`.
- Multiple rows may be expanded at once.
- Expand/collapse is instant (no height animation).

### URL state

All state reflects to the URL hash (no server required for static deploy):

- View: `#/landscape` or `#/testing` (default = landscape).
- Filters: `#/landscape?cat=decentralized&has=agent`.
- Sort: `#/landscape?sort=volume&dir=desc`.
- Search: `#/landscape?q=poly`.
- Expanded PM: `#/landscape/polymarket` (also serves as deep link — page scrolls to and expands the row on arrival).

Hash is read on load and on `hashchange`. Updated via `history.replaceState` so back/forward work but chip clicks don't pollute history.

### Theme toggle

- Single button in topbar (`◐`).
- Click → flip dark/light, write `localStorage.theme = 'dark' | 'light'`.
- On first load: read `localStorage.theme`, fall back to `prefers-color-scheme`, default dark.
- CSS implementation: `[data-theme="light"]` on `<html>` swaps the token block.
- No flash of wrong theme: theme attribute is set in a tiny inline `<script>` in `<head>` before stylesheet renders.

### Keyboard

- `/` focuses the search input.
- `Esc` clears the search input.
- Tab order follows visual order.
- All interactive elements have a visible focus ring: 1px solid `--accent`, 0 offset, no rounding.

---

## 5. Component inventory

1. **Topbar** (`.topbar`) — flex row, 8/20px padding, `border-bottom: 1px solid --line`. Left: brand. Center: tab switcher (active tab gets `border-bottom: 1px solid --accent`). Right: `● live · 28 markets · ◐`.

2. **Hero** (`.hero`) — order: kicker (10px mono uppercase) → headline (34px sans -1px tracking) → paragraph (13.5px sans `--ink-dim` max-width 720px) → caveat callout. Caveat is a hairline-bordered inline-flex with `⚠` icon and one line of warn-orange text.

3. **Stats strip** (`.stats`) — 4-cell grid in a single hairline-bordered container. Each cell: 16/20 padding; mono uppercase 10px label; 24px mono value; 11px sans dim detail. Internal cell separators are 1px `--line`.

4. **Filter bar** (`.filters`) — flex row, hairline `border-bottom`. Left: chip groups separated by 1px×18px vertical dividers. Right: 260px search input with mono 11px placeholder `/ search 28 markets…`. Chips: 11px mono, 5/10 padding, hairline border; `:hover` lightens; `.active` gets accent text + accent border + 6%-alpha accent background.

5. **Table** (`table`) — full-width, `border-collapse: collapse`. Header cells: 10px mono uppercase 1px-tracking `--ink-muted`, hairline bottom border. Body cells: 14px sans, 14/12 padding, hairline bottom border per row, `--bg-1` on row hover.

6. **Row PM cell** (`.pm`) — flex row: monogram tile (24×24, hairline border, 11px mono center letter `--ink-dim`) + name (14px sans 500 `--ink`) + meta domain (11px mono `--ink-muted`).

7. **Category badge** (`.cat`) — 10px mono uppercase 1px tracking, 3/8 padding, hairline border, color tinted by category (decentralized=accent, cefi=warn, play=cyan). No background fill.

8. **Tool pill** (`.tool-pill`) — 10px mono, 2/7 padding, hairline border, color tinted by type (api=blue, sdk=violet, cli=green, mcp=pink, skill=cyan, fw=amber). Multiple pills wrap with 5px gap.

9. **Expanded detail row — Landscape** (`tr.detail`) — `--bg-1` background, hairline bottom border. Inner padding 20/24/24/58 (left-indented to align under PM name). Two-column grid: About | Toolchain. Each toolchain item is a 2px left-border + name + type label + one-line description. External links row at the bottom: `Website · Docs · GitHub · Twitter`.

10. **Expanded detail row — Testing** — same chrome as the Landscape detail row, but the right-hand grid is replaced with a tab strip (`AA / CLI-MCP / Skill / Framework`) and the per-check breakdown panels that already exist in `renderTesting()`, restyled to the new visual system.

11. **Footer** (`footer`) — 60px top margin, 20px top padding, hairline top border. Flex space-between, mono 11px `--ink-muted`. Left: `sybil_pm_landscape · agent-authored · apr 2026`. Right: `methodology · source · x` (inline links). `methodology` links to the GitHub `/methodology` directory; `source` links to the repo root; `x` links to the project's X handle (placeholder if none yet — leave the anchor in markup with a `TODO` comment for the user to fill).

---

## 6. Responsive

| Breakpoint | Stats | Filters | Table | Side padding |
|---|---|---|---|---|
| ≥1024px (desktop) | 4×1 | inline | full 7-column | 32px |
| 640–1023px (tablet) | 2×2 | wraps to 2 lines | full columns, 10/8 cell padding | 20px |
| <640px (mobile) | 1×4 stack | chip groups become horizontal-scroll strip; search full-width below | **card list** — each PM is a vertical hairline-bordered card with name + category + chain + volume + tool-pill rows; chevron in card top-right toggles expand | 16px |

No horizontal page scroll on mobile, ever.

---

## 7. Implementation approach

The redesign happens entirely inside the existing `index.html`. No build step, no framework, no new files (other than the spec doc itself).

### Migration plan

1. **CSS rewrite.** Replace the entire `<style>` block (~lines 5–268) with a new ~600-line stylesheet built around the design tokens above. CSS uses custom properties so dark/light is a token swap on `[data-theme]`.
2. **Markup rewrite.** Replace the static markup of the topbar, hero, stats containers, and filter bar with the new component structure. View-toggle, view containers, and methodology tab nodes stay where they are — just restyled.
3. **JS additions** — four new units inside the existing `<script>`:
   - **theme** (~25 lines): initial detection, toggle button handler, `localStorage` persistence, no-flash inline `<head>` snippet.
   - **router** (~60 lines): hash parsing, hash writing, scroll-and-expand on PM deep-link, `history.replaceState`.
   - **sort** (~30 lines): sortable column header click handlers, sort state, per-column comparators.
   - Existing `render()` and `renderTesting()` are wrapped to read sort / filter / search state from the router and re-render on `hashchange`.
4. **DOM keeps the same `id`s** (`stats`, `filters`, `pmTable`, `testStats`, `testTableHead`, etc.) so existing render loops, expand handlers, and testing-tab logic keep working with minimal touching.
5. **Existing data objects** (`DATA`, `AA_RESULTS`, `TEST_RESULTS`) **are untouched**.
6. **Mock A** (`mocks/a-terminal.html`) is kept after merge as a frozen reference snapshot. `mocks/b-refined.html` and `mocks/c-hybrid.html` are deleted.

### Risks & watchpoints

- The current `renderTesting()` rebuilds inner HTML on every call. Preserve this pattern; feed it from sort/filter state rather than refactoring it.
- The methodology tab rendering inside expanded testing rows is the most fragile area in the current code. Restyle, do not refactor structure.
- Light theme contrast on the green accent and tool-pill colors needs hand-tuning. Verify both themes against text in the detail rows during build.
- Mobile card layout for the table is a real layout fork (not just flexbox tweaks). It will be ~80 lines of media-query CSS plus markup the row template generates conditionally via CSS, no JS branching.
- Both pages share components but the testing detail row is structurally different from the landscape detail row — keep their templates independent rather than trying to unify them.

---

## Decisions log (for traceability)

| # | Question | Answer |
|---|---|---|
| 1 | Audience? | External showcase |
| 2 | Page shape? | Pure explorer, polished (keep current IA) |
| 3 | Aesthetic direction? | Mock A — terminal density |
| 4 | PM logos? | Monogram tiles |
| 5 | Light theme flavor? | Off-white tech (Linear / GitHub light) |
| 6 | Accent color? | Muted green `#4ade80` (dark) / `#16a34a` (light) |
| 7 | Table interactivity scope? | Sort + URL state + per-PM deep links |
| 8 | Testing page also? | Yes — both pages, one design system |
