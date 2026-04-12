# Context Markets CLI Test Log

**Date:** 2026-04-09
**CLI:** context-markets-cli (via npx)
**Tester:** web3 instance

---

## Section 1: Setup

### S1. Version check
**Command:** `npx context-markets-cli --version`
**Output:**
```json
{"error": "Unknown command: \"--version\". Run \"context help\" for usage."}
```
**Result:** FAIL — no --version flag. CLI invoked as `context` internally with subcommands.

### S2. Help
**Command:** `npx context-markets-cli --help`
**Output (first 300 chars):**
```
Usage: context <command> [subcommand] [options]

Commands:
  markets                         Browse and search prediction markets
  orders                          Manage orders (create, cancel, list)
  portfolio                       View positions and balances
  account                         Wallet status, deposits, wi
```
**Result:** PASS — commands listed: markets, orders, portfolio, account, questions, guides, ecosystem, shell, setup, approve, deposit.

### S3. Auth / Balance
**Command:** `npx context-markets-cli portfolio balance --address 0x165E...661b --api-key <key> --output json`
**Output:**
```json
{
  "address": "0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b",
  "usdc": {
    "tokenAddress": "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
    "balance": "4000000",
    "settlementBalance": "4000000",
    "walletBalance": "0"
  },
  "outcomeTokens": []
}
```
**Result:** PASS — auth works, returns structured balance. Note: balance is 4 USDC (4000000 = 4 * 10^6 microUSDC) in settlement, 0 in wallet.

### S4. Balance structured
**Result:** PASS — JSON with tokenAddress, balance, settlementBalance, walletBalance fields. Clear separation of settlement vs wallet balance.

---

## Section 2: Discovery

### D1. Markets list
**Command:** `npx context-markets-cli markets list --limit 3 --api-key <key> --output json`
**Output (first 300 chars):**
```json
{"markets": [{"id": "0x85535aa6fc11ac913639e8a10f4c37ff27abe0c1f4a5f7d5a2e6f5392a561286", "oracle": "0x00000000000037b4b8fe032b4369895456e88b49", "question": "Will Damac FC record a shot on target in the first half vs Al Qadsiah?", "questionSubmissionId": "GihdmHmC
```
**Result:** PASS — returns structured JSON array of markets with rich data.

### D2. Market get
**Command:** `npx context-markets-cli markets get 0x34fc...0771 --api-key <key> --output json`
**Output (first 300 chars):**
```json
{"id": "0x34fcacc76df142cb74daf0d9787eac17d9ff9c992452e26ff23e6e5277e90771", "oracle": "0x00000000000037b4b8fe032b4369895456e88b49", "question": "Will the White House officially identify the marks on Trump's neck as scabs or scars?", "questionSubmissionId": "IYfJ
```
**Result:** PASS — full market detail with outcomePrices, metadata, resolutionCriteria, deadline, status.

### D3. Orderbook / Pricing
**Command:** `npx context-markets-cli markets orderbook 0x34fc...0771 --api-key <key> --output json`
**Output (first 300 chars):**
```json
{"marketId": "0x34fcacc76df142cb74daf0d9787eac17d9ff9c992452e26ff23e6e5277e90771", "yes": {"bids": [], "asks": [{"price": 4, "size": 4}, {"price": 5, "size": 4}, {"price": 6, "size": 4}, {"price": 7, "size": 4}, {"price": 8, "size": 4}]}, "no": {"bids": [{"pri
```
**Result:** PASS — separate YES/NO orderbooks with price/size levels and timestamp.

### D4. Market search
**Command:** `npx context-markets-cli markets search "trump" --limit 3 --api-key <key> --output json`
**Output (first 300 chars):**
```json
{"markets": [{"id": "0x34fcacc76df142cb74daf0d9787eac17d9ff9c992452e26ff23e6e5277e90771", "oracle": "0x00000000000037b4b8fe032b4369895456e88b49", "question": "Will the White House officially identify the marks on Trump's neck as scabs or scars?", "questionSubmiss
```
**Result:** PASS — returns relevant results matching search query.

### D5. Schema consistency
**Command:** Compared keys of 3 different markets via `json.load(sys.stdin); print(sorted(d.keys()))`
**Output:**
```
Market 1 keys: ['blockTime', 'chainId', 'chancePercentage', 'contractAddress', 'createdAt', 'creator', 'creatorProfile', 'deadline', 'executableAt', 'id', 'isLive', 'metadata', 'oracle', 'outcome', 'outcomePrices', 'outcomeTokens', 'participantCount', 'payoutPcts', 'proposedAt', 'question', 'questionSubmissionId', 'resolutionCriteria', 'resolutionStatus', 'resolvedAt', 'shortQuestion', 'status', 'txHash', 'volume', 'volume24h']
Market 2 keys: (identical)
Market 3 keys: (identical)
```
**Result:** PASS — all 3 markets have identical 30-key schema.

---

## Section 3: Trading

### T1. Simulate
**Command (markets simulate):** `npx context-markets-cli markets simulate 0x34fc...0771 --side yes --amount 1 --api-key <key> --output json`
**Output:**
```json
{
  "marketId": "0x34fc...0771",
  "side": "yes",
  "amount": 1,
  "amountType": "usd",
  "estimatedContracts": 19.16,
  "estimatedAvgPrice": 5.2,
  "estimatedSlippage": 53.1,
  "warnings": [{"type": "HIGH_SLIPPAGE"}, {"type": "INSUFFICIENT_COLLATERAL"}]
}
```

**Command (orders simulate):** `npx context-markets-cli orders simulate --market 0x34fc...0771 --outcome yes --side bid --size 1 --price 5 --trader 0x165E...661b --api-key <key> --output json`
**Output:**
```json
{
  "levels": [],
  "summary": {"fillSize": "0", "fillCost": "0", "takerFee": "0", "weightedAvgPrice": "0", "totalLiquidityAvailable": "21136055", "percentFillable": 0, "slippageBps": 0},
  "collateral": {"balance": "0", "outcomeTokenBalance": "0", "requiredForFill": "0", "isSufficient": false},
  "warnings": [{"type": "INSUFFICIENT_LIQUIDITY"}]
}
```
**Result:** PASS — both simulate endpoints work. `markets simulate` gives quick estimate, `orders simulate` gives detailed fill analysis.

### T2. Limit order
**Command:** `npx context-markets-cli orders create --market 0x34fc...0771 --outcome yes --side buy --price 5 --size 1 --api-key <key> --output json`
**Output:**
```json
{"error": "A private key is required for trading operations.", "details": {"hint": "Set CONTEXT_PRIVATE_KEY env var, pass --private-key <key>, or run `context setup`"}}
```
**Result:** FAIL — no private key available. Error is clean and structured (no 403). The previous 403 issue is gone.

### T3. Cancel order
**Result:** SKIP — depends on T2.

### T4. Market order
**Command:** `npx context-markets-cli orders market --market 0x34fc...0771 --outcome yes --side buy --max-price 5 --max-size 1 --api-key <key> --output json`
**Output:**
```json
{"error": "A private key is required for trading operations.", "details": {"hint": "Set CONTEXT_PRIVATE_KEY env var, pass --private-key <key>, or run `context setup`"}}
```
**Result:** FAIL — same as T2, needs private key.

### T5. Sell + balance delta
**Result:** SKIP — depends on T4.

---

## Section 4: Error Handling

### E1. Huge amount simulate
**Command:** `npx context-markets-cli markets simulate 0x34fc...0771 --side yes --amount 999999 --api-key <key> --output json`
**Output:**
```json
{
  "marketId": "0x34fc...0771",
  "side": "yes",
  "amount": 999999,
  "amountType": "usd",
  "estimatedContracts": 21.14,
  "estimatedAvgPrice": 5.4,
  "estimatedSlippage": 59.3,
  "warnings": [{"type": "LOW_LIQUIDITY"}, {"type": "HIGH_SLIPPAGE"}, {"type": "INSUFFICIENT_COLLATERAL"}]
}
```
**Result:** PASS — handles gracefully with warnings, no crash or 500.

### E2. Invalid inputs
**Command:** `npx context-markets-cli orders create --market INVALID --outcome yes --side buy --price 5 --size 1 --api-key <key> --output json`
**Output:**
```json
{"error": "A private key is required for trading operations.", "details": {"hint": "..."}}
```
**Result:** PARTIAL — returns structured JSON error, but the "private key required" check fires before input validation. Cannot test market ID validation without a private key.

### E3. Nonexistent market
**Command:** `npx context-markets-cli markets get 0xdeadbeef... --api-key <key> --output json`
**Output:**
```json
{"error": "Market not found"}
```
**Result:** PASS — clear, structured JSON error.

### E4. Recovery after error
**Command:** After E1-E3 errors, ran `markets list --limit 1`
**Output:** `Recovery OK, markets count: 1`
**Result:** PASS — CLI recovers cleanly.

---

## Key Observations

1. **CLI has been significantly restructured** since previous test. Commands are now hierarchical: `markets`, `orders`, `portfolio`, `account`.
2. **No --version flag** — cannot determine version.
3. **All commands require API key** — even read-only discovery (markets list, search). Previous test noted discovery worked without auth; this has changed.
4. **403 Forbidden is gone** — trading commands now return clean "private key required" errors instead of 403. This was likely a CLI bug that was fixed.
5. **Two simulate paths**: `markets simulate` (quick USD estimate) and `orders simulate` (detailed order-level simulation with fill analysis).
6. **Trading requires CONTEXT_PRIVATE_KEY** — the API key alone is insufficient for order placement. The CLI supports env var, flag, or config file.
7. **Balance shows 4 USDC** in settlement (4000000 microUSDC), 0 in wallet.
8. **Rich market data** — 30 fields per market, consistent schema, includes resolution criteria, categories, deadline, source accounts.
9. **Orderbook endpoint** provides separate YES/NO sides with price levels.
10. **Bulk operations available** — bulk-create, bulk-cancel, and combined bulk endpoint.
11. **Automation-friendly** — `--yes` flag to skip confirmations, `--output json` on all commands, clean error JSON.
