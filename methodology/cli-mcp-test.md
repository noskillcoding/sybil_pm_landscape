# Unified CLI/MCP Tool Test — Plan

## Overview

Single test that evaluates whether a PM CLI/MCP tool can support an AI trading agent. Covers installation through error handling in one pass.

4 sections, 18 checks, ~33 tool calls per tool.

## Sections

### Setup (4 checks: S1-S4)
Install, help, auth, balance. Can the tool run and authenticate?

### Discovery (5 checks: D1-D5)
List markets, market detail, orderbook quality, search, schema consistency (3 markets).

### Trading (5 checks: T1-T5)
Preview, limit order cycle (place+cancel with verification), market buy+sell round-trip with balance delta check.

### Error Handling (4 checks: E1-E4)
Insufficient balance, invalid inputs (3 boundary tests), resolved market, error recovery.

## Grading

18 checks, each 1 point. Pure score-based:

| Score | Grade |
|-------|-------|
| 16-18 | A |
| 13-15 | B |
| 9-12 | C |
| 5-8 | D |
| 0-4 | F |

## Tools to Test

| PM | Tool | Type | Chain | Status |
|----|------|------|-------|--------|
| Myriad | @myriadmarkets/cli | CLI | BNB Chain | Pending (test orderbook, not AMM) |
| Polymarket | polymarket-cli | CLI | Polygon | Pending (needs VPN) |
| Manifold | manifold-mcp-server | MCP | Play money | Pending |
| Alpha Arcade | @alpha-arcade/mcp | MCP | Algorand | Pending |
| Limitless | limitless-cli | CLI | Base | Pending |
| Limitless | @iqai/mcp-limitless | MCP | Base | Pending |
| Context | context-markets-cli | CLI | Base | Pending |

## Subagent Strategy

- One subagent per tool, fresh context
- Subagent gets: unified template + tool-specific config
- Writes raw-log.md incrementally, result.json at end
- Post-subagent review: spot-check 2-3 claims, verify key findings
