# Unified CLI/MCP Tool Test — Subagent Instructions

You are testing a prediction market CLI or MCP tool from scratch. Your job is to determine whether this tool can support an AI trading agent — from installation through reliable execution.

## Important context

You are testing against LIVE markets with real money. Prices and liquidity change between commands. A single trade failure does NOT prove a feature is broken — retry before concluding.

Your results will be reviewed. Accuracy matters more than speed.

## Your test subject

- **PM**: {{PM_NAME}}
- **Tool**: {{TOOL_NAME}}
- **Type**: {{TOOL_TYPE}}
- **Chain**: {{CHAIN}}
- **Currency**: {{CURRENCY}}
- **Auth method**: {{AUTH_METHOD}}
- **Command prefix**: {{CMD_PREFIX}}
- **Auth setup**: {{AUTH_SETUP}}
- **Wallet balances**: {{BALANCES}}
- **Notes**: {{NOTES}}

## Rules

1. **Run every check. Record exact commands and first 300 chars of output.**
2. Write to raw-log.md AFTER EACH SECTION (not at the end).
3. Use `--json` / `-o json` wherever available.
4. Under 38 tool calls total.
5. Do NOT fabricate results.

## Retry rules (for trading checks)

1. Re-check orderbook/price immediately before placing an order.
2. Retry up to 3 times on trade failures. Wait 3-5 seconds between retries.
3. Prefer GTC over FAK for sell orders. Use wait/poll flags if available.
4. After 3 failed attempts, mark as FAIL with all attempts recorded.
5. Record orderbook state alongside every trade attempt.

## Checks (18 total, 4 sections)

---

### Section 1: Setup (4 checks)

**S1. Install + version**
Run the tool's install/version command. Verify it starts and reports a version.
PASS: tool runs, version shown.

**S2. Help / list commands**
List available commands or tools. Verify structured output.
PASS: commands listed with descriptions. JSON output flag exists.

**S3. Auth**
Configure authentication using provided credentials.
PASS: auth succeeds, subsequent commands work. BLOCKED: requires browser/KYC.

**S4. Balance**
Query wallet/account balance.
PASS: returns structured balance data showing funds available.

If S1 fails, stop and write results (grade F). If S3 is BLOCKED, continue discovery but mark trading as BLOCKED.

---

### Section 2: Discovery (5 checks)

**D1. List markets**
List active/open markets. Verify parseable output with IDs, titles, prices.
PASS: structured list with 3+ markets.

**D2. Market detail**
Query single market using an ID from D1. Verify outcomes, prices, volume.
PASS: detailed market data with required fields.

**D3. Orderbook quality**
Query orderbook/pricing for the most liquid market.
For CLOB: verify 5+ levels per side, monotonic prices, bid < ask.
For AMM: verify price in [0,1], volume > 0, consistent data.
PASS: well-formed, deep data. Note level counts.

**D4. Search**
Search markets by keyword (e.g., "bitcoin" or relevant term).
PASS: returns relevant results in same format as D1. FAIL if no search capability.

**D5. Schema consistency**
Query 3 different markets (vary by volume/category). Compare top-level keys.
PASS: all 3 have same required fields (id, title, price/probability, volume). Types consistent.

---

### Section 3: Trading (5 checks)

Pick the most liquid market for all trading checks.

**T1. Preview / dry-run**
If the tool has a preview/dry-run/simulate command, run it for a ~$1 trade.
PASS: returns expected shares, cost, and/or fees without executing. FAIL: no preview capability.

**T2. Limit order + verify open**
Place limit order far from mid (e.g., BUY at $0.01 or lowest valid price) — should not fill.
Query order — verify status is OPEN/LIVE.
PASS: order placed and confirmed open.

**T3. Cancel + verify cancelled**
Cancel the order from T2. Retry up to 3x if cancel fails.
Query order or open orders list — verify cancelled/absent.
PASS: order cancelled and no longer in open orders.

**T4. Market buy + verify position**
Record orderbook state. Place market buy for ~$1.
Query positions — verify share count increased.
PASS: order filled, position visible with correct shares.

**T5. Sell + balance delta**
Record balance before (from S4 or current). Record orderbook state.
Sell the position from T4 (retry up to 3x, prefer GTC).
Record final balance. Compute delta.
PASS: position closed, balance delta within 5% of expected, gas/fees visible or derivable.

---

### Section 4: Error Handling (4 checks)

**E1. Insufficient balance**
Attempt order for 100x available balance.
PASS: structured, parseable error mentioning balance/insufficient funds.
FAIL: silent cancellation, crash, or unparseable error.

**E2. Invalid inputs**
Attempt 3 invalid orders (use --dry-run if available): size=0, size=-1, price=-1.
PASS: 3/3 return parseable error messages with useful descriptions.

**E3. Resolved market**
Find a resolved/closed market. Attempt to trade on it.
PASS: clear error about market being closed/resolved.

**E4. Error recovery**
Query a nonexistent market ID (e.g., 999999999).
Immediately run a valid command (balance or list markets).
PASS: valid command succeeds, no state corruption.

---

## Output files

Write TWO files to {{OUTPUT_DIR}}:

### 1. raw-log.md — Write after each section

```markdown
# CLI/MCP Tool Test: {{TOOL_NAME}}
Tested: {{DATE}}

## Setup
S1. Install: [command] → [output] → PASS/FAIL
S2. Help: [command] → [output] → PASS/FAIL
...

## Discovery
D1. List markets: [command] → [output] → PASS/FAIL
...
```

### 2. result.json — Write at the END

Key fields:
- pm, tool, toolType, version, chain, currency, testedAt
- checklistVersion: "unified-v1"
- sections: object with setup/discovery/trading/errors, each containing checks
- Each check: id, name, status (PASS/FAIL/SKIP/BLOCKED), command, output (300 chars), evidence
- score: { passed, total (18) }
- grade: A (16-18) / B (13-15) / C (9-12) / D (5-8) / F (0-4)
- metadata: { auth, outputQuality, hasPreview, hasFeeInfo }
- keyFindings: array of strings
- blockers: array of strings

## IMPORTANT

- Do NOT fabricate results
- Record exact commands and raw output
- Clean up after yourself (cancel orders, close positions)
- Under 38 tool calls
