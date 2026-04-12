# Polymarket CLI (polymarket-cli) — unified-v1 Test Log
**Tested**: 2026-04-10
**Version**: 0.1.5
**Binary**: /tmp/poly (wrapper w/ VPN proxy + key injection)
**Wallet (EOA)**: 0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b
**Proxy wallet**: 0x70262b80988E317A2a32f963A99A9aD03dC3F107

---

## Section 1: Setup (4 checks)

### S1: Version check — PASS
```
$ /tmp/poly --version
polymarket 0.1.5
```

### S2: Help/list commands — PASS
```
$ /tmp/poly --help
Commands:
  setup, shell, markets, events, tags, series, comments, profiles, sports,
  approve, clob, ctf, data, bridge, wallet, status, upgrade, help
Options: -o/--output, --private-key, --signature-type, -h, -V
```
Rich command set with 18 top-level commands. Supports JSON output globally via `-o json`.

### S3: Auth — PASS
```
$ /tmp/poly wallet show -o json
{
  "address": "0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b",
  "config_path": "/Users/pat/.config/polymarket/config.json",
  "configured": true,
  "proxy_address": "0x70262b80988E317A2a32f963A99A9aD03dC3F107",
  "signature_type": "proxy",
  "source": "--private-key flag"
}
```
Shows configured=true, correct addresses, signature type, and key source.

### S4: Balance — PASS
```
$ /tmp/poly clob balance --asset-type collateral -o json
{
  "allowances": {
    "0x4bFb41d5B3570DeFd03C39a9A4D8dE6Bd8B8982E": "0",
    "0xC5d563A36AE78145C45a50134d48A1215220f80a": "0",
    "0xd91E80cF2E7be2e162c6513ceD06f1dD0dA35296": "0"
  },
  "balance": "0"
}
```
Returns structured JSON with per-contract allowances and balance. Balance is 0 on CLOB (funds are on EOA, not proxy).

---

## Section 2: Discovery (5 checks)

### D1: List markets — PASS
```
$ /tmp/poly markets list --limit 5 -o json
```
Returns array of 5 market objects. Each has 156 fields including: id, question, slug, conditionId, clobTokenIds, outcomes, outcomePrices, volume, liquidity, active, closed, endDate, etc. Pagination via --limit/--offset works.

### D2: Market detail — PASS
```
$ /tmp/poly markets get "russia-ukraine-ceasefire-before-gta-vi-554" -o json
```
Returns full market object with nested events array. Same schema as list items but includes related event data, clobRewards, resolution details. Accepts slug as identifier.

### D3: Orderbook quality — PASS
```
$ /tmp/poly clob book "0x12cbad478677529833263a8cf73d557ed608689f85c9f568aac63f73ab0af80a" -o json
```
Returns structured orderbook with:
- 47 bid levels (0.01–0.51)
- 30 ask levels (0.53–0.99)
- Each level has price + size
- Includes: market (conditionId), asset_id, timestamp, hash, min_order_size, neg_risk, tick_size, last_trade_price

**Note**: Token ID is positional argument, NOT `--token`. Documented command `--token <ID>` fails with "unexpected argument" error. Correct: `clob book <TOKEN_ID>`.

### D4: Search — FAIL
```
$ /tmp/poly events search "bitcoin" -o json
error: unrecognized subcommand 'search'
```
No search command exists. `events` only supports: list, get, tags. `events list` has filters: --active, --closed, --tag, --order, --ascending — but no text/keyword search.

**Workaround tested**:
```
$ /tmp/poly events list --tag "crypto" --limit 3 -o json
```
Returns events filtered by tag, but this is tag-based filtering, not search. No way to search by keyword/question text.

### D5: Schema consistency — PASS
```
$ /tmp/poly markets list --limit 5 -o json  # compare schemas
Common keys across 5 markets: 156
Extra keys per market: [0, 0, 0, 0, 0]
Schema consistent: True
```
All 5 markets have identical 156-key schema. No nullability inconsistencies in structure.

---

## Section 3: Trading (5 checks)

**Pre-requisite**: Ran `approve set -o json` — all 3 contracts approved (CTF Exchange, Neg Risk Exchange, Neg Risk Adapter). USDC allowance set to max uint256. Also ran `clob update-balance --asset-type collateral` — returned success.

**BLOCKER**: Despite approvals, CLOB balance remains 0. The ~4.26 USDCe is on the EOA wallet (0x165E...) but the CLOB operates via proxy wallet (0x7026...) which holds 0 USDCe. The CLI has no transfer/deposit command to move funds from EOA to proxy. Trading tests T2-T5 are blocked.

### T1: Preview/dry-run — FAIL
```
$ /tmp/poly clob create-order --help
```
No `--dry-run`, `--preview`, or `--simulate` flag exists. Orders are live-only. No way to preview order cost, fees, or expected fill before submission.

### T2: Limit order — FAIL (blocked by balance)
```
$ /tmp/poly clob create-order --token "0x12cb..." --side buy --price 0.01 --size 5 --order-type GTC -o json
{"error":"Status: error(400 Bad Request) making POST call to /order with {\"error\":\"not enough balance / allowance: the balance is not enough -> balance: 0, order amount: 50000\"}"}
```
Command syntax works. Server-side validation caught the 0 balance. Error is structured JSON with clear message.

### T3: Cancel — SKIP (no order placed)
No order to cancel due to T2 failure.

### T4: Market buy — SKIP (blocked by balance)
Cannot execute market order with 0 CLOB balance.

### T5: Sell — SKIP (blocked by balance)
No position to sell.

---

## Section 4: Error Handling (4 checks)

### E1: Insufficient balance — PASS
```
$ /tmp/poly clob create-order --token "0x12cb..." --side buy --price 0.01 --size 10000 -o json
{"error":"Status: error(400 Bad Request) making POST call to /order with {\"error\":\"not enough balance / allowance: the balance is not enough -> balance: 0, order amount: 100000000\"}"}
```
Returns structured JSON error with clear message including actual balance and required amount. HTTP status code included. Exit code is non-zero.

### E2: Invalid inputs — PARTIAL PASS
**size=0**:
```
$ /tmp/poly clob create-order --token "..." --side buy --price 0.01 --size 0 -o json
{"error":"Validation: invalid: Unable to build Order due to negative size 0"}
```
Client-side validation catches size=0. Good JSON error. Note: error says "negative size 0" which is technically inaccurate (0 is not negative).

**size=-1**:
```
$ /tmp/poly clob create-order --token "..." --side buy --price 0.01 --size -1 -o json
error: unexpected argument '-1' found
Usage: polymarket clob create-order [OPTIONS] --token <TOKEN> --side <SIDE> --price <PRICE> --size <SIZE>
```
CLI arg parser rejects -1 as unexpected argument (interprets as flag). NOT JSON output — prints plain text error. Agent-hostile: can't parse programmatically.

**price=-1**: Same behavior as size=-1 — arg parser error, not JSON.

### E3: Resolved market — PASS
```
$ /tmp/poly clob create-order --token "0x7579629ff765d220e36a47fcdb4faa919a1d3865207e6f3bf0bdc5b5f312dd77" --side buy --price 0.01 --size 5 -o json
{"error":"Status: error(404 Not Found) making GET call to /fee-rate with {\"error\":\"fee rate not found for market\"}"}
```
Server rejects order on closed market. Error is JSON but message is indirect — "fee rate not found" rather than "market is closed/resolved". An agent would need to infer the meaning.

### E4: Error recovery — PASS
```
$ /tmp/poly markets get "nonexistent-market-slug-12345" -o json
{"error":"Status: error(404 Not Found) making GET call to /markets/slug/nonexistent-market-slug-12345 with {\"type\":\"not found error\",\"error\":\"slug not found\"}"}

$ /tmp/poly markets get "russia-ukraine-ceasefire-before-gta-vi-554" -o json
{... valid response ...}
```
After 404 error, subsequent valid command works fine. No state corruption. Errors are isolated per invocation (stateless CLI).

---

## Key Findings

1. **No search command**: `events search` doesn't exist. Only tag-based filtering via `events list --tag`.
2. **No preview/dry-run**: All orders are live. No way to simulate before committing.
3. **No EOA-to-proxy transfer**: CLI cannot move funds from EOA wallet to proxy wallet. Trading is blocked if funds are on the wrong address.
4. **Arg parser doesn't output JSON for negative values**: `-1` treated as flag, produces plain-text error instead of JSON.
5. **CLI docs mismatch**: `clob book --token <ID>` documented but actual syntax is `clob book <TOKEN_ID>` (positional).
6. **Rich CLOB tooling**: 40+ clob subcommands covering orders, rewards, notifications, API keys.
7. **Consistent schemas**: 156-key market objects, identical structure across markets.
8. **Excellent orderbook depth**: 47 bids / 30 asks on tested market.
9. **Closed market error is indirect**: Says "fee rate not found" instead of "market closed".
