# Myriad CLI Test Raw Log

## Section 1: Setup

### S1. Install + version
**Command:** `npx @myriadmarkets/cli --version`
**Output:** `0.2.0`
**Status:** PASS

### S2. Help / list commands
**Command:** `npx @myriadmarkets/cli --help`
**Output (first 300 chars):**
```
Usage: myriad [options] [command]

Myriad Markets CLI for AI agents (MYRIAD API v2 + wallet execution)

Options:
  -V, --version                                  output the version number
  --plain                                        Output ASCII tables (default)
  --json                                         Output JSON
  --api-base-url <url>                           MYRIAD API v2 base URL
```
**Status:** PASS — Commands listed (mcp, markets, portfolio, wallet, swap, trade, ob, claim, skills), --json flag exists as global option.

### S3. Auth
**Command:** `wallet balances --json` (with MYRIAD_PRIVATE_KEY env var)
**Output:** Valid JSON with wallet address, BNB, USDT, USD1 balances. No interactive auth required.
**Status:** PASS

### S4. Balance
**Command:** Same as S3
**Output (first 300 chars):**
```json
{"wallet":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","chainId":56,"native":{"symbol":"BNB","raw":"3345879200000000","formatted":"0.0033458792"},"tokens":[{"label":"collateral","address":"0x55d398326f99059fF775485246999027B3197955","symbol":"USDT","decimals":18,"raw":"1345165122922471128","formatted":"1.345165122922471128"},{"label":"usd1","address":"0x8d0D000Ee44948FC98c9B98A4FA4921476f08B0d","symbol":"USD1","decimals":18,"raw":"1574146003137306546","formatted":"1.574146003137306546"}]}
```
**Status:** PASS — Valid JSON, BNB=0.00335, USDT=1.345, USD1=1.574

## Section 2: Discovery

### D1. List markets
**Command:** `ob markets list --json`
**Output (first 300 chars):**
```json
{"data":[{"id":4,"networkId":56,"slug":"bitcoin-above-68k-on-april-9-at-4pm-utc-3f5ecda8","title":"Bitcoin above $68K on April 9 at 4PM UTC?","description":"### **Market Details:**\n\n- **Market Period**: From the publication date through April 9, 2026, at 4:00 PM UTC...
```
**Status:** PASS — Returns structured list with IDs, titles, prices. 1 active OB market found (id=4).

### D2. Market detail
**Command:** `ob markets show 4 --json`
**Output (first 300 chars):**
```json
{"id":4,"networkId":56,"slug":"bitcoin-above-68k-on-april-9-at-4pm-utc-3f5ecda8","title":"Bitcoin above $68K on April 9 at 4PM UTC?","description":"...","publishedAt":"2026-04-06T14:27:21.252Z","expiresAt":"2026-04-09T16:00:00.000Z","fees":{"maker_fee_bps":0,"taker_fee_bps":73,...
```
**Status:** PASS — Outcomes present (Yes/No with prices, shares), volume=17842, fees (maker 0bps, taker 73bps).

### D3. Orderbook quality
**Command:** `ob markets orderbook --market-id 4 --outcome-id 0 --json`
**Output (first 300 chars):**
```json
{"marketId":4,"marketTitle":"Bitcoin above $68K on April 9 at 4PM UTC?","outcomeId":0,"bids":[["980000000000000000","27210884353741500416"],["970000000000000000","54982817869415809024"],["960000000000000000","83333333333333344256"],["950000000000000000","112280701754385973248"]...
```
**Analysis:** 18 bid levels (0.98 down to 0.01), 1 ask level (0.99). Bids monotonically decreasing. Best bid (0.98) < best ask (0.99).
**Status:** FAIL — Requires 5+ levels per side. Bids have 18 levels but asks have only 1 level. Orderbook is heavily one-sided.

### D4. Search
**Command:** `markets list --keyword bitcoin --json`
**Output (first 300 chars):**
```json
{"data":[{"id":19075,"networkId":56,"slug":"will-strategy-mstr-sell-any-btc-by-end-of-2026-c2005bf8-916d-4076-b401-822f1c40dca7","title":"Will Strategy (MSTR) sell any BTC by end of 2026?","description":"**Market Dates:**\n\n- **Market Period:** From publication through December 31, 2026...
```
**Status:** PASS — Returns relevant results (MSTR BTC sale market, Gold/BTC ratio market).

### D5. Schema consistency
**Command:** `markets show <id> --json` for IDs 120473, 10198, 141355
**Keys for all 3 markets (identical):**
```json
["bannerImageUrl","description","eventId","executionMode","expiresAt","externalSources","featured","featuredAt","fees","id","imageUrl","inPlay","inPlayStartsAt","liquidity","liquidityPrice","moneyline","negRisk","networkId","ogImageUrl","outcomeIndex","outcomes","perpetual","publishedAt","resolutionSource","resolutionTitle","resolvedOutcomeId","resolvesAt","shares","slug","state","title","token","topHolders","topics","users","voided","volume","volume24h","volumeNotional","volumeNotional24h"]
```
**Status:** PASS — All 3 markets have identical 40-key schema including id, title, volume, outcomes with prices.

## Section 3: Trading

### T1. Preview / dry-run
**Command:** `ob market buy --market-id 4 --outcome-id 0 --value 1 --dry-run --json`
**Output (first 300 chars):**
```json
{"wallet":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","executionMode":"orderbook","marketId":4,"marketTitle":"Bitcoin above $68K on April 9 at 4PM UTC?","outcomeId":0,"side":"buy","timeInForce":"FAK","order":{"trader":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","marketId":"4",...
```
**Key data:** estimatedShares=1.0101, estimatedValue=1.0, deepestPrice=0.99, 1 level consumed.
**Status:** PASS — Returns expected shares, cost estimate, order details without submitting.

### T2. Limit order + verify
**Command:** `ob limit buy --market-id 4 --outcome-id 0 --price 0.05 --shares 1 --json`
**Output (first 300 chars):**
```json
{"wallet":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","executionMode":"orderbook","marketId":4,"marketTitle":"Bitcoin above $68K on April 9 at 4PM UTC?","outcomeId":0,"side":"buy","timeInForce":"GTC","order":{"trader":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","marketId":"4"...
```
**Verification:** `ob orders show 0x54ae...2d24` returned status="open", filledAmount="0".
**Status:** PASS — Order placed with hash, status=open confirmed.

### T3. Cancel + verify
**Command:** `ob orders cancel 0x54aeff471e2d2b230db4b2ba0cdcf357c8efc3e63297d38d254ec41b00ea2d24 --json`
**Output (first 300 chars):**
```json
{"wallet":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","orderHash":"0x54aeff471e2d2b230db4b2ba0cdcf357c8efc3e63297d38d254ec41b00ea2d24","response":{"orderHash":"0x54aeff471e2d2b230db4b2ba0cdcf357c8efc3e63297d38d254ec41b00ea2d24","status":"cancelled"}}
```
**Verification:** `ob orders show` returned status="cancelled".
**Status:** PASS — Cancel succeeded on first attempt, verified cancelled.

### T4. Market buy + position
**Command:** `ob market buy --market-id 4 --outcome-id 0 --value 1 --json --wait-ms 15000`
**Output (first 300 chars):**
```json
{"wallet":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","executionMode":"orderbook","marketId":4,"marketTitle":"Bitcoin above $68K on April 9 at 4PM UTC?","outcomeId":0,"side":"buy","timeInForce":"FAK","order":{"trader":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","marketId":"4"...
```
**Result:** observedStatus="filled", filledAmount=1.0101 shares at 0.99.
**Position:** `ob positions list` showed 1.0101 shares, outcomeTitle="Yes", status="ongoing".
**Status:** PASS — Filled, position visible with shares.

### T5. Sell + balance delta
**Pre-sell USD1:** 0.574046
**Command:** `ob market sell --market-id 4 --outcome-id 0 --shares 1.01 --json --wait-ms 15000`
**Output (first 300 chars):**
```json
{"wallet":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","executionMode":"orderbook","marketId":4,"marketTitle":"Bitcoin above $68K on April 9 at 4PM UTC?","outcomeId":0,"side":"sell","timeInForce":"FAK","order":{"trader":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","marketId":"4"...
```
**Result:** observedStatus="filled", sold 1.01 shares at 0.98.
**Post-sell USD1:** 1.563549 (recovered 0.9895 from sell)
**Balance delta:** Bought at 1.0001, sold at 0.9895, net loss = 0.0106 (1.06%) — within 5% threshold.
**Status:** PASS — Position closed, balance delta within tolerance.

## Section 4: Error Handling

### E1. Insufficient balance
**Command:** `ob market buy --market-id 4 --outcome-id 0 --value 300 --json`
**Output (first 300 chars):**
```json
{"wallet":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","executionMode":"orderbook","marketId":4,"marketTitle":"Bitcoin above $68K on April 9 at 4PM UTC?","outcomeId":0,"side":"buy","timeInForce":"FAK","order":{"trader":"0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b","marketId":"4"...
```
**Analysis:** The CLI submitted a $300 FAK order despite having only ~$1.56 USD1. The order was accepted then cancelled by the exchange (observedStatus="cancelled", filledAmount="0"). No pre-flight balance check or structured error about insufficient funds.
**Status:** FAIL — Silent cancellation instead of structured balance error. An AI agent would not know the order failed due to insufficient funds.

### E2. Invalid inputs
**Commands:**
1. `ob market buy --market-id 4 --outcome-id 0 --value 0 --dry-run --json`
2. `ob limit buy --market-id 4 --outcome-id 0 --price 0.05 --shares -1 --dry-run --json`
3. `ob limit buy --market-id 4 --outcome-id 0 --price -1 --shares 1 --dry-run --json`

**Outputs:**
1. `{"ok":false,"error":"value must be greater than zero. Received: 0"}`
2. `{"ok":false,"error":"shares must be a positive decimal amount. Received: -1"}`
3. `{"ok":false,"error":"price must be a positive decimal amount. Received: -1"}`

**Status:** PASS — All 3/3 return parseable JSON errors with clear messages.

### E3. Resolved market
**Command:** `trade buy --market-id 2116 --outcome-id 0 --value 0.01 --json` (market: "Will Donald Trump meet with CZ before December?", state=resolved)
**Output:**
```json
{"ok":false,"error":"MYRIAD API request failed (400): Market is not open for trading"}
```
**Status:** PASS — Clear structured error indicating market is not open for trading.

### E4. Error recovery
**Command 1:** `markets show 999999999 --json`
**Output 1:** `{"ok":false,"error":"MYRIAD API request failed (404): Market not found"}`
**Command 2:** `wallet balances --json` (immediately after)
**Output 2:** USD1=1.563549 — balance returned successfully.
**Status:** PASS — No state corruption, balance query succeeds after error.
