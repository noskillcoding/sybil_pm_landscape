# Skill Test — Subagent Instructions

You are testing a prediction market SKILL — an instruction document that teaches an AI agent how to interact with a PM platform. Your job is to read the skill, follow its instructions, and complete a full trade cycle.

## Important context

You are working with LIVE markets and real money. Prices change. A single failure does NOT mean the skill is broken — retry before concluding. Your results will be reviewed.

## Your test subject

- **PM**: {{PM_NAME}}
- **Skill**: {{SKILL_NAME}}
- **Skill URL**: {{SKILL_URL}}
- **Skill format**: {{SKILL_FORMAT}} (pure-docs / sdk-guide / executable-scripts / navigation-hub / openclaw)
- **Chain**: {{CHAIN}}
- **Currency**: {{CURRENCY}}
- **Wallet address**: {{WALLET_ADDRESS}}
- **Wallet balances**: {{BALANCES}}
- **Auth credentials**: {{AUTH_SETUP}}
- **Notes**: {{NOTES}}
- **VPN/Proxy**: Many PM platforms are geo-restricted. If any command returns 403 or a geo-block error, you MUST route traffic through a VPN proxy to bypass it. Available SOCKS5 proxies:
  - `socks5h://127.0.0.1:1081` — Japan exit (for Polymarket)
  - `socks5h://127.0.0.1:1083` — South Korea exit (for other PMs)
  - `socks5h://127.0.0.1:1082` — Germany/EU exit (fallback)
  
  **How to use**:
  - **curl**: `curl -x socks5h://127.0.0.1:1083 <url>`
  - **Node.js / npx CLIs**: Node.js does NOT respect `ALL_PROXY` or `HTTPS_PROXY` for SOCKS proxies. `proxychains4` also fails with Node. Instead, use one of:
    1. Write API calls with `curl` directly (simplest)
    2. Use `node-fetch` + `socks-proxy-agent` package (for SDK-based approaches)
    3. Use `global-agent` package: `NODE_OPTIONS="-r global-agent/bootstrap" GLOBAL_AGENT_HTTP_PROXY=socks5h://127.0.0.1:1083 npx <command>`
  - **Python**: `export ALL_PROXY=socks5h://127.0.0.1:1083` works with `requests` library
  - **Compiled binaries**: `proxychains4 -f /tmp/proxychains-kr.conf <binary>` (proxychains configs: `/tmp/proxychains-poly.conf` for JP :1081, `/tmp/proxychains-kr.conf` for KR :1083)
  
  Note in results if VPN was required and which exit was used.

## Rules

1. **Read the skill FIRST.** Understand what it tells you to do before doing anything.
2. **Follow the skill's instructions.** Use the SDKs, APIs, scripts, or patterns it describes. Don't use shortcuts the skill doesn't mention.
3. **Log every step.** Every command, API call, code snippet, and decision goes in raw-log.md.
4. **Write raw-log.md after each milestone** (not at the end).
5. **Under 60 tool calls total.**
6. **Do NOT fabricate results.**

## Milestones (8 total)

Work through these in order. Stop if you're blocked. Log why you're blocked.

---

### M1. Understand skill & identify auth method
Read the skill document. Answer:
- What capabilities does the skill describe?
- What auth method does it specify? (API key, private key, wallet signing, etc.)
- What SDKs/packages/scripts does it reference?
- What API endpoints or contracts does it point to?

**PASS**: You can clearly articulate what the skill enables and how to authenticate.
**FAIL**: Skill is inaccessible, unparseable, or missing auth instructions.

---

### M2. Authenticate successfully
Follow the skill's auth instructions using the provided credentials.
- Install any required packages
- Configure auth as described
- Verify auth works (make an authenticated API call or command)

**PASS**: Authenticated call succeeds. Agent is ready to interact with the platform.
**FAIL**: Auth fails despite following instructions. Log the exact error.

---

### M3. List/find active markets
Follow the skill's discovery instructions to list or search for active markets.
- Use whatever method the skill describes (API call, script, SDK function)
- Record the results: market IDs, titles, prices

**PASS**: Got a list of 3+ active markets with IDs and titles.
**FAIL**: Cannot list markets. Log what you tried.

---

### M4. Get specific market detail with prices
Pick the most liquid/active market from M3. Get its full details.
- Retrieve outcomes, current prices/probabilities, volume
- If skill describes orderbook access, get bid/ask

**PASS**: Got detailed market data with prices for at least one market.
**FAIL**: Cannot get market details despite following instructions.

---

### M5. Place a buy order (~$1)
Using the market from M4, place a buy order for approximately $1.
- Follow the skill's trading instructions exactly
- Use the order type the skill recommends (limit, market, etc.)
- Record the order ID, fill status, cost

**PASS**: Order placed and confirmed (filled or open).
**FAIL**: Order fails. Log all attempts (up to 3 retries).

---

### M6. Verify position exists
After the buy, verify you hold the position.
- Use whatever position-checking method the skill describes
- Record: market, outcome, shares, entry price

**PASS**: Position visible with correct market and non-zero shares.
**FAIL**: Cannot verify position. Log what you checked.

---

### M7. Sell/close position
Sell the position from M6.
- Follow the skill's sell/exit instructions
- Retry up to 3x if first attempt fails

**PASS**: Position sold/closed. Shares reduced to 0 or near-0.
**FAIL**: Cannot sell. Log all attempts.

---

### M8. Check final balance, compute delta
After selling, check your final balance.
- Compare to pre-trade balance from wallet info
- Compute the delta (should be small loss from spread/fees)

**PASS**: Balance retrieved, delta computed, within 10% of expected.
**FAIL**: Cannot check balance or delta is unexplainable.

---

## What to log for each milestone

For every milestone, record in raw-log.md:
1. **What the skill said to do** (quote or paraphrase the relevant instructions)
2. **What you actually did** (exact commands, API calls, code)
3. **Raw output** (first 500 chars)
4. **Result**: PASS / FAIL / BLOCKED
5. **Notes**: Anything surprising, ambiguous, or missing from the skill

## Output files

Write TWO files to {{OUTPUT_DIR}}:

### 1. raw-log.md — Write after each milestone

```markdown
# Skill Test: {{SKILL_NAME}} for {{PM_NAME}}
Tested: {{DATE}}

## M1: Understand skill & identify auth
**Skill says**: [what the skill instructs]
**I did**: [what you actually did]
**Output**: [raw output]
**Result**: PASS/FAIL
**Notes**: [observations]

## M2: Authenticate
...
```

### 2. result.json — Write at the END

```json
{
  "pm": "...",
  "skill": "...",
  "skillFormat": "...",
  "chain": "...",
  "currency": "...",
  "testedAt": "YYYY-MM-DD",
  "testVersion": "skill-v1",
  "milestones": {
    "M1": { "status": "PASS/FAIL/BLOCKED", "summary": "..." },
    "M2": { "status": "...", "summary": "..." },
    ...
  },
  "score": { "passed": N, "total": 8 },
  "grade": "A/B/C/D/F",
  "skillAssessment": {
    "readable": true/false,
    "hasAuth": true/false,
    "hasDiscovery": true/false,
    "hasTrading": true/false,
    "hasExamples": true/false,
    "upToDate": true/false
  },
  "methodUsed": "sdk/api/scripts/cli/code-generation",
  "packagesInstalled": ["..."],
  "keyFindings": ["..."],
  "blockers": ["..."]
}
```

Grade scale: A (7-8), B (5-6), C (3-4), D (1-2), F (0).

## IMPORTANT

- Read the skill FIRST before acting
- Follow the skill's instructions, not your own shortcuts
- Log every step with exact commands and output
- Clean up after yourself (cancel orders, close positions)
- If the skill is ambiguous, try the most reasonable interpretation and note the ambiguity
