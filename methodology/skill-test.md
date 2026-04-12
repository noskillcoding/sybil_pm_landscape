# Skill Testing Plan

## What We're Testing

Can an AI agent, given only a SKILL.md file and wallet credentials, complete a full prediction market trade cycle?

Skills are instruction documents (not executable tools). They range from pure reference docs to executable scripts. The test measures both the skill's quality and the agent's ability to follow it.

## Approach

One subagent per skill, fresh context. Subagent receives:
1. The skill content (URL or inline)
2. Wallet credentials + balances
3. A milestone checklist
4. Instruction to log every step

The subagent reads the skill, figures out how to accomplish each milestone, and logs everything.

## Milestones (8)

| # | Milestone | What it proves |
|---|-----------|---------------|
| M1 | Understand skill, identify auth method | Skill is parseable and has auth instructions |
| M2 | Authenticate successfully | Auth instructions work, credentials valid |
| M3 | List/find active markets | Discovery instructions work |
| M4 | Get specific market detail with prices | Detail/pricing instructions work |
| M5 | Place a buy order (~$1) | Trading instructions work end-to-end |
| M6 | Verify position exists | Position tracking works |
| M7 | Sell/close position | Exit instructions work |
| M8 | Check final balance, compute delta | Full round-trip verified |

## Grading

8 milestones, each pass/fail:
- **A**: 7-8 milestones
- **B**: 5-6 milestones
- **C**: 3-4 milestones
- **D**: 1-2 milestones
- **F**: 0 milestones

## Skills to Test

| PM | Skill | Format | Chain | Notes |
|----|-------|--------|-------|-------|
| Polymarket | Agent Skills (SKILL.md) | Pure docs | Polygon | References py-clob-client / @polymarket/clob-client. Needs VPN. |
| Sapience | SKILL.md | SDK guide | Ethereal/Arbitrum | GraphQL + WebSocket + EIP-712. @sapience/sdk. |
| Baozi | OpenClaw Skill | Executable scripts | Solana | 10 pre-built scripts. Closest to CLI. |
| Context | Agent Skills | Navigation hub | Base | Router → subskills. References their MCP/CLI. |
| Rain | OpenClaw Skills | OpenClaw format | Unknown | Docs 403 — may be inaccessible. |

## Subagent Strategy

- One subagent per skill, fresh context
- Subagent gets: skill template + skill-specific config
- Budget: 60 tool calls max (more than CLI/MCP due to doc reading + code writing)
- Writes raw-log.md after each milestone attempt
- Writes result.json at end
- Post-subagent review: verify claims, check logs

## Key Differences from CLI/MCP Testing

1. **More open-ended** — agent interprets docs, writes code, calls APIs (not just runs commands)
2. **Higher tool budget** — needs to read docs, install packages, write scripts
3. **Skill quality matters** — bad docs = agent failure, even if the platform works fine
4. **May need SDK installs** — agent might need to npm/pip install packages from skill instructions
5. **Logs are critical** — every API call, every code snippet, every decision must be logged

## Output Structure

```
skill-tests/
  PLAN.md                    ← this file
  _template/
    instructions.md          ← subagent template
    result-schema.json       ← output format
  results/
    polymarket-skill/
      raw-log.md
      result.json
    sapience-skill/
      ...
```
