# Manifold MCP Server — Raw Test Log
**Date**: 2026-04-08
**Tool**: manifold-mcp-server (npx)
**Server version**: 0.1.0

---

## Section 1: Setup (4 checks)

### S1. Start MCP server + initialize
**Command**: `printf '{"jsonrpc":"2.0","id":1,"method":"initialize",...}' | MANIFOLD_API_KEY=<key> npx manifold-mcp-server`
**Output (first 300 chars)**:
```json
{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{}},"serverInfo":{"name":"manifold-markets","version":"0.1.0"}},"jsonrpc":"2.0","id":1}
```
**Result**: PASS

### S2. List tools (tools/list)
**Command**: `{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}`
**Output (first 300 chars)**:
```json
{"result":{"tools":[{"name":"search_markets","description":"Search for prediction markets with optional filters",...},{"name":"get_market",...},{"name":"get_user",...},{"name":"place_bet",...},{"name":"cancel_bet",...},{"name":"sell_shares",...},{"name":"add_liquidity",...},{"name":"get_positions",...
```
**Tools found (9)**: search_markets, get_market, get_user, place_bet, cancel_bet, sell_shares, add_liquidity, get_positions, send_mana
**Result**: PASS

### S3. Auth — call tool requiring auth
**Command**: `{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"get_user","arguments":{"username":"R0N5U"}}}`
**Output (first 300 chars)**:
```json
{"result":{"content":[{"type":"text","text":"{\n  \"avatarUrl\": \"https://lh3.googleusercontent.com/...\",\n  \"id\": \"2vzewXU33MfqTp0T4nENhSmj3qx1\",\n  \"username\": \"R0N5U\",\n  \"name\": \"R\",\n  \"balance\": 1100.0000000000011,...
```
**Result**: PASS

### S4. Balance — check Mana balance
**Command**: (from get_user response above + REST API /v0/me)
**Output**: balance: 1100.0000000000011, cashBalance: 0, spiceBalance: 0, totalDeposits: 1100
**Note**: Balance is returned as part of get_user, no dedicated balance tool. Also confirmed via REST API.
**Result**: PASS

**Section 1 Score: 4/4**

---

## Section 2: Discovery (5 checks)

### D1. List/search markets
**Command**: `search_markets` with `{"limit":3,"filter":"open","sort":"liquidity"}`
**Output (first 300 chars)**:
```json
[{"id":"g6Z5yU5ZLA","creatorUsername":"vdb","question":"[READ DESCRIPTION] Will Jesus Christ return before GTA VI? [Polymarket]","probability":0.49,"volume":381942.63,"outcomeType":"BINARY","mechanism":"cpmm-1"},{"id":"WCsjjEUk1vxRy1wHNi63","question":"Will Eliezer Yudkowsky win his $150,000...
```
**Result**: PASS — 3 open markets returned sorted by liquidity

### D2. Get specific market detail
**Command**: `get_market` with `{"marketId":"WCsjjEUk1vxRy1wHNi63"}`
**Output**: Full market detail including probability (0.95), volume (9,632,298), creator (Joshua), description, pool, mechanism, groupSlugs, closeTime.
**Result**: PASS — rich detail including probability, volume, creator

### D3. Market data quality
**Checks**:
- Market g6Z5yU5ZLA: probability=0.49 (in [0,1] ✓), volume=381942.63 (>0 ✓)
- Market WCsjjEUk1vxRy1wHNi63: probability=0.95 (in [0,1] ✓), volume=9632298.95 (>0 ✓)
- Market lCdu8E6ySc: probability=0.20 (in [0,1] ✓), volume=22646.68 (>0 ✓)
**Result**: PASS — all probabilities in [0,1], all volumes > 0

### D4. Search by keyword
**Command**: `search_markets` with `{"term":"AI","limit":3,"filter":"open"}`
**Output (first 300 chars)**:
```json
[{"id":"LqzucsA0hZ","question":"April 2026 AI model releases","volume":18563.18},{"id":"lCdu8E6ySc","question":"Will I think all AI hell broke loose in 2026?","creatorUsername":"EliezerYudkowsky","probability":0.20},{"id":"pOpgN20ylC","question":"If AI wipes out humanity, which organization(s)...
```
**Result**: PASS — all 3 results are AI-related

### D5. Query 3 different markets, compare response structure
**Markets queried**: g6Z5yU5ZLA, WCsjjEUk1vxRy1wHNi63, lCdu8E6ySc
**Common fields across all 3**: id, creatorId, creatorUsername, creatorName, createdTime, closeTime, question, slug, url, pool, probability, p, totalLiquidity, outcomeType, mechanism, volume, volume24Hours, isResolved, uniqueBettorCount, lastUpdatedTime, lastBetTime, lastCommentTime, token, description, groupSlugs, textDescription
**Result**: PASS — consistent schema across all 3 markets

**Section 2 Score: 5/5**

---

## Section 3: Trading (5 checks)

### T1. Preview/cost estimation before trading
**Finding**: No dedicated preview/estimate tool exists. The `place_bet` tool supports `limitProb` parameter (limit order probability 0.01-0.99), which allows setting a max probability rather than previewing cost. There is no dry-run or quote mechanism.
**Note**: The AMM formula (CPMM-1) is deterministic from pool state, so an agent could calculate expected cost from pool values returned by `get_market`. Not ideal but workable.
**Result**: FAIL — no preview/estimate tool

### T2. Place a YES bet on an active market (~M$10)
**Command**: `place_bet` with `{"marketId":"lCdu8E6ySc","amount":10,"outcome":"YES"}`
**Output (first 300 chars)**:
```json
{"orderAmount":10,"amount":10,"shares":49.52845625770169,"isFilled":true,"isCancelled":false,"fills":[{"matchedBetId":null,"shares":49.52845625770169,"amount":10,"timestamp":1775752477160,"fees":{"creatorFee":0,"platformFee":0,"liquidityFee":0}}],"contractId":"lCdu8E6ySc","outcome":"YES","probBef...
```
**Details**: Spent M$10, received 49.53 YES shares. Prob moved 0.200 → 0.204.
**Result**: PASS

### T3. Check position after bet
**Command**: `get_positions` with `{"userId":"2vzewXU33MfqTp0T4nENhSmj3qx1"}` filtered to contractId=lCdu8E6ySc
**Output**: Position found — betId=ElA9zS0AzRL2, 49.53 YES shares, amount=10
**Result**: PASS

### T4. Sell the position
**Command**: `sell_shares` with `{"marketId":"lCdu8E6ySc","outcome":"YES"}`
**Note**: First attempt without `outcome` param returned "Bad Request" — outcome is required despite schema saying optional.
**Output (first 300 chars)**:
```json
{"contractId":"lCdu8E6ySc","amount":-9.999999999999645,"shares":-49.52845625770101,"outcome":"YES","probBefore":0.2038261198751439,"probAfter":0.20000000000000004,"createdTime":1775752501808,"fees":{"creatorFee":0,...},"isFilled":true,"betId":"R6ns00clPI5c"}
```
**Details**: Sold all 49.53 YES shares for ~M$10 back. Prob returned to 0.200.
**Result**: PASS

### T5. Check balance after sell — verify round-trip delta
**Pre-trade balance**: M$1100.0000000000011
**Post-trade balance**: M$1100.000000000001
**Delta**: ~M$0.000 (floating point noise only, zero fees on this market)
**Result**: PASS

**Section 3 Score: 4/5**

---

## Section 4: Error Handling (4 checks)

### E1. Attempt bet with amount > balance (M$999999)
**Command**: `place_bet` with `{"marketId":"lCdu8E6ySc","amount":999999,"outcome":"YES"}`
**Output**:
```json
{"jsonrpc":"2.0","id":40,"error":{"code":-32603,"message":"MCP error -32603: Manifold API error: Forbidden"}}
```
**Note**: Returns "Forbidden" rather than "insufficient balance" — the error message could be more specific, but it is structured JSON-RPC and parseable.
**Result**: PASS

### E2. Invalid inputs — missing required param (amount)
**Command**: `place_bet` with `{"marketId":"lCdu8E6ySc","outcome":"YES"}` (no amount)
**Output**:
```json
{"jsonrpc":"2.0","id":41,"error":{"code":-32602,"message":"MCP error -32602: Invalid parameters: amount: Required"}}
```
**Result**: PASS — clear, parseable error with field name

### E3. Query nonexistent market ID
**Command**: `get_market` with `{"marketId":"NONEXISTENT_MARKET_12345"}`
**Output**:
```json
{"jsonrpc":"2.0","id":42,"error":{"code":-32603,"message":"MCP error -32603: Manifold API error: Not Found"}}
```
**Result**: PASS — clear "Not Found" error

### E4. Recovery after error
**Command**: `get_market` with nonexistent ID, then immediately `get_market` with valid ID
**Output**: Error returned for bad ID, then valid market data returned for good ID (lCdu8E6ySc, prob=0.20)
**Result**: PASS — server recovers normally, no corruption

**Section 4 Score: 4/4**

---

## Summary

| Section | Passed | Total |
|---------|--------|-------|
| Setup | 4 | 4 |
| Discovery | 5 | 5 |
| Trading | 4 | 5 |
| Error Handling | 4 | 4 |
| **Total** | **17** | **18** |

**Grade: A (17/18)**

**Only failure**: T1 (no preview/cost estimation tool). The AMM is deterministic from pool state so an agent can calculate expected cost manually, but there's no built-in dry-run/quote mechanism.

**Key findings**:
- 9 tools implemented: search_markets, get_market, get_user, place_bet, cancel_bet, sell_shares, add_liquidity, get_positions, send_mana
- Buy/sell round-trip works with zero slippage on small bets (AMM with zero fees)
- `sell_shares` requires explicit `outcome` param despite schema listing it as optional — minor bug
- Error messages are structured JSON-RPC but sometimes vague ("Forbidden" instead of "insufficient balance")
- Server version 0.1.0, protocol version 2024-11-05
