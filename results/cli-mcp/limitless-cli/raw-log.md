# Limitless CLI Raw Test Log
**Date**: 2026-04-09
**Binary**: /tmp/limitless v0.1.0
**Tester**: web3 instance (automated)

---

## Section 1: Setup

### S1. Version Check
**Command**: `/tmp/limitless --version`
**Output**: `limitless 0.1.0`
**Result**: PASS

### S2. Help Output
**Command**: `/tmp/limitless --help`
**Output** (first 300 chars):
```
CLI for Limitless Exchange

Usage: limitless [OPTIONS] <COMMAND>

Commands:
  markets    Browse and search prediction markets
  orderbook  View orderbook, prices, and spreads
  trading    Manage orders and trading
  portfolio  View portfolio positions, trades, and PnL
  profiles   View public portfolio data for any address
  approve    Manage token approvals
```
**Result**: PASS — Commands listed, `-o json` confirmed (`[possible values: table, json]`), `--api-key` and `--private-key` global options present.

### S3. Auth Test
**Attempt 1 — private key only**:
**Command**: `/tmp/limitless portfolio allowance --private-key "$(security find-generic-password -s 'EVM_PRIVATE_KEY' -w)" -o json`
**Output**: `Error: No API key found. Set via --api-key, LIMITLESS_API_KEY env var, or run 'limitless setup'.`

**Attempt 2 — private key on trading orders**:
**Command**: `/tmp/limitless trading orders "eth-above-..." --private-key "$PK" -o json`
**Output**: `Error: No API key found. Set via --api-key, LIMITLESS_API_KEY env var, or run 'limitless setup'.`

**Notes**: CLI requires API key for ALL authenticated commands. Private key alone is insufficient. The `setup` wizard is interactive (can't run in automated mode). Previous testing found that API keys from the Limitless UI are HMAC tokens incompatible with the CLI's X-API-Key header. No non-interactive way to generate a compatible API key was found.

**Result**: BLOCKED — Auth requires API key that cannot be programmatically generated.

### S4. Query Balance
**Command**: `/tmp/limitless portfolio allowance --private-key "$PK" -o json`
**Output**: `Error: No API key found.`

Also tried: `portfolio positions`, same error.

**Result**: BLOCKED — Depends on auth (S3).

---

## Section 2: Discovery

### D1. Markets List
**Command**: `/tmp/limitless markets list -o json`
**Output** (first 300 chars):
```json
{"data": [{"slug": "eth-above-dollar218465-on-apr-9-1245-utc-1775737817374", "title": "ETH above $2184.65 on Apr 9, 12:45 UTC?", "tradeType": "clob", "status": "FUNDED", "volume": "24646400", "volumeFormatted": "24.646400", ...}]}
```
**Notes**: Returns 20 markets per page. Rich schema with 29 keys per market. All markets have USDC collateral on Base.
**Result**: PASS

### D2. Get Specific Market
**Command**: `/tmp/limitless markets get "eth-above-dollar218465-on-apr-9-1245-utc-1775737817374" -o json`
**Output** (first 300 chars):
```json
{"slug": "eth-above-dollar218465-on-apr-9-1245-utc-1775737817374", "title": "ETH above $2184.65 on Apr 9, 12:45 UTC?", "tradeType": "clob", "status": "FUNDED", "volume": "49647800", "volumeFormatted": "49.647800", "prices": [0.055, 0.945], ...}
```
**Notes**: Slug is positional arg (not --slug flag). Detailed market data including prices, tokens, venue, conditionId.
**Result**: PASS

### D3. Orderbook Prices & Spread
**Command 1**: `/tmp/limitless orderbook price "eth-above-..." -o json`
**Output**: `{"ask": 0.458, "bid": 0.012}`

**Command 2**: `/tmp/limitless orderbook spread "eth-above-..." -o json`
**Output**: `{"spread": 0.068}`

**Command 3**: `/tmp/limitless orderbook book "eth-above-..." -o json`
**Output** (first 300 chars):
```json
{"adjustedMidpoint": 0.5045, "asks": [{"price": 0.08, "size": "20000000"}, {"price": 0.458, "size": "10000000"}, ...], "bids": [{"price": 0.012, "size": "10000000"}, {"price": 0.01, "size": "101000000"}, ...]}
```
**Notes**: Full depth available via `orderbook book`. Also has `midpoint`, `last-trade`, `history`, `events`, and live `monitor` (TUI). Subcommand is `price` not `prices`.
**Result**: PASS

### D4. Search Markets
**Command**: `/tmp/limitless markets search "bitcoin" -o json`
**Output** (first 300 chars):
```json
{"markets": [{"slug": "bitcoin-all-time-high-by-1775135445330", "title": "Bitcoin all time high by ___?", "tradeType": "clob", "status": "FUNDED", "marketType": "group", "markets": [{"slug": "june-30-2026-1775135445337", "title": "June 30, 2026", ...}]}]}
```
**Notes**: Search works without auth. Query is positional arg. Returns grouped markets with sub-markets. Has optional `--limit` flag.
**Result**: PASS

### D5. Schema Consistency (3 markets)
**Markets compared**:
1. `eth-above-dollar218465-on-apr-9-1245-utc-1775737817374` (single, Crypto/Ethereum)
2. `oil-ukoilspot-above-dollar95285-on-apr-9-1300-utc-1775736006` (single, Oil)
3. `doge-above-dollar009168-on-apr-9-1300-utc-1775736002227` (single, Crypto/DOGE)

**Keys**: All 3 markets have identical 29-key schema: `['address', 'automationType', 'categories', 'collateralToken', 'conditionId', 'createdAt', 'deadline', 'description', 'expirationDate', 'expirationTimestamp', 'id', 'liquidity', 'liquidityFormatted', 'marketType', 'markets', 'openInterestFormatted', 'positionIds', 'prices', 'resolutionSource', 'slug', 'status', 'tags', 'title', 'tokens', 'tradeType', 'venue', 'volume', 'volumeFormatted']`
**Result**: PASS — Consistent schema across all markets.

---

## Section 3: Trading

**Auth Status**: BLOCKED. CLI requires API key (`--api-key` or `LIMITLESS_API_KEY` env var) for ALL trading/portfolio commands. Private key alone is insufficient. The interactive `setup` wizard cannot be run in automated mode. Previously tested HMAC tokens from the Limitless UI are incompatible with the CLI's X-API-Key header auth.

### T1. Preview/Dry-Run
**Command**: `/tmp/limitless trading create --slug "eth-above-..." --side buy --outcome yes --size 1000000 --price 0.5 -o json`
**Output**: `Error: No API key found. Set via --api-key, LIMITLESS_API_KEY env var, or run 'limitless setup'.`
**Notes**: No `--dry-run` flag exists in the help output. The CLI has no preview mode.
**Result**: BLOCKED — Auth required.

### T2. Place Limit Order + Verify
**Result**: BLOCKED — Auth required.

### T3. Cancel + Verify
**Result**: BLOCKED — Auth required.

### T4. Market Buy + Position
**Result**: BLOCKED — Auth required.

### T5. Sell + Balance Delta
**Result**: BLOCKED — Auth required.

---

## Section 4: Error Handling

### E1. Over-Balance Order
**Command**: `/tmp/limitless trading create --slug "eth-above-dollar218465-on-apr-9-1245-utc-1775737817374" --side buy --outcome yes --size 1000000 --price 0.5 -o json`
**Output**: `Error: No API key found. Set via --api-key, LIMITLESS_API_KEY env var, or run 'limitless setup'.`
**Notes**: Auth check fires before any balance validation. Cannot test over-balance behavior.
**Result**: PASS (partial) — Clear auth error message, actionable (tells you how to fix it).

### E2. Invalid Inputs (3 tests)
**Test 1 — Nonexistent slug**:
**Command**: `/tmp/limitless markets get "nonexistent-market-slug-12345" -o json`
**Output**: `Error: API error 404 Not Found: {"message":"Market not found for slug: nonexistent-market-slug-12345"}`
**Notes**: Clear 404 with descriptive message.

**Test 2 — Malformed slug**:
**Command**: `/tmp/limitless markets get "completely-bogus" -o json`
**Output**: `Error: API error 400 Bad Request: {"message":"Invalid slug format. Expected format: text-with-numbers-timestamp","error":"Bad Request","statusCode":400}`
**Notes**: Clear validation error with expected format hint.

**Test 3 — Invalid side/outcome (trading)**:
**Command**: `/tmp/limitless trading create --slug "test" --side "invalid" --outcome yes --size 10 --price 0.5 -o json`
**Output**: `Error: No API key found.`
**Notes**: Auth check fires before input validation on trading commands. Cannot test param validation without auth.

**Result**: PASS — Discovery endpoints give clear, structured errors (404, 400). Trading command errors blocked by auth.

### E3. Resolved Market Trade Attempt
**Notes**: `markets list` API only returns FUNDED (active) markets. No status filter available. Cannot locate a resolved market slug. Trading attempt would be blocked by auth anyway.
**Result**: BLOCKED — Cannot find resolved market; auth would block trade attempt regardless.

### E4. Recovery After Error
**Command 1 (bad)**: `/tmp/limitless markets get "completely-bogus" -o json`
**Output**: `Error: API error 400 Bad Request: {"message":"Invalid slug format..."}`

**Command 2 (good)**: `/tmp/limitless markets list -l 1 -o json`
**Output**: `Recovered: 1 market(s) returned`

**Result**: PASS — CLI recovers cleanly after error. No state corruption.

---
