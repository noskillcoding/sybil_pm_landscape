# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this repo is

A research project that benchmarks prediction markets (PMs) on how accessible they are to autonomous AI trading agents. There is **no build system, no package.json, no tests** — the "product" is a single static dashboard (`index.html`) plus a corpus of methodology docs, subagent templates, and raw test results.

## Deploy / run

- Local preview: open `index.html` directly in a browser, or `python3 -m http.server` in the repo root.
- Production deploy: `npx vercel deploy --prod` (Vercel static hosting).
- The dashboard is password-gated client-side: `index.html` stores a SHA-256 hash in a `HASH` constant and unlocks on match (`tryUnlock` near line 514). This is obfuscation, not security — don't put secrets behind it.

## Architecture

### The dashboard (`index.html`, ~3400 lines, single file)

Everything — styles, data, rendering logic — is inlined. The structure:

1. **CSS + gate markup** (top).
2. **`const DATA = [...]`** (starts ~line 518): the canonical in-repo dataset. One object per PM with fields like `name`, `chain`, `volumeNumeric`, `coreTools[]`, plus nested scores for the four test categories (accessibility, cli-mcp, skill, framework). **The dashboard reads only from this embedded array — it does not fetch `results/*.json` at runtime.** When you update a test result, you must also update the corresponding entry in `DATA` or the dashboard won't reflect it.
3. **Render/filter/sort code** (bottom): builds the stats bar, filter chips, and the main PM table; framework-assessment rendering walks `fw.categories` (~line 3376).

When editing `index.html`, prefer surgical edits inside `DATA` entries. Avoid reformatting the file — diffs on a 3400-line single-file app are painful to review.

### The four test categories

Each has its own methodology doc, and (except accessibility) its own subagent template. They are independent — a PM can be scored in some categories and not others.

| Category | Methodology | Template | Results dir |
|---|---|---|---|
| Agent Accessibility (15 checks) | `methodology/agent-accessibility.md` | — | `results/agent-accessibility/<pm>.json` |
| CLI/MCP Test (18 checks) | `methodology/cli-mcp-test.md` | `templates/cli-mcp/` | `results/cli-mcp/<pm>-{cli,mcp}/` |
| Skill Test (8 milestones) | `methodology/skill-test.md` | `templates/skill/` | `results/skill/<pm>-skill/` |
| Framework Assessment (5 categories) | `methodology/framework-assessment.md` | — | (dashboard-only, no raw dir) |

### Subagent templates

`templates/cli-mcp/` and `templates/skill/` each contain:
- `instructions.md` — prompt with `{{PLACEHOLDER}}` variables (`{{PM_NAME}}`, `{{TOOL_NAME}}`, `{{CHAIN}}`, `{{AUTH_SETUP}}`, etc.) that you fill in per run.
- `result-schema.json` — JSON schema the subagent must produce.

These are run as live tests against real markets with real money, so the templates enforce: record exact commands, cap tool calls, write `raw-log.md` after each section, never fabricate results.

### Results convention

For cli-mcp and skill runs, each result directory contains two files: `raw-log.md` (the subagent's command/output trace) and `result.json` (schema-conformant scored output). Agent-accessibility results are a single `<pm>.json` file per PM.

## Working on this repo

- **Adding a new PM or test result**: write the raw files under `results/...`, then reflect the scores into the `DATA` array in `index.html`. Don't rely on a build step — there isn't one.
- **Editing methodology**: if you change check counts or milestone definitions, update both the methodology doc and the README coverage table, and audit the `DATA` entries since their score shapes are tied to the methodology.
- **Don't introduce a bundler or framework** unless explicitly asked — the single-file static site is a deliberate deployment choice.
