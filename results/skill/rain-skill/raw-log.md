# Rain Protocol Skill Test — Raw Log

**Date**: 2026-04-10
**Wallet**: 0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b
**Chain**: Arbitrum One (42161)
**SDK**: @buidlrrr/rain-sdk (installed via npm)

---

## M1: Understand Skill & Identify Auth Method
**Status**: PASS

Fetched three OpenClaw skill files from GitHub (rain1-labs/rain-sdk):
- `skills/rain-trade/SKILL.md` — Buy, sell, limit orders, cancel, liquidity, claims
- `skills/rain-data/SKILL.md` — Market queries, positions, analytics, WebSocket feeds
- `skills/rain-create-market/SKILL.md` — Market creation, resolution

**Architecture**: Two classes:
- `Rain` (stateless) — builds unsigned transactions, queries data
- `RainAA` (stateful) — Alchemy smart accounts with gas sponsorship

**Auth method**: Private key -> viem WalletClient. The SDK never sends transactions; caller signs and sends via viem. No API keys needed for basic usage (API keys needed for subgraph/analytics only).

**Chain**: Arbitrum One
**Currency**: USDT (0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9, 6 decimals)
**Environments**: production (prod-api.rain.one), stage, development

---

## M2: Authenticate Successfully
**Status**: PASS

```
Rain SDK initialized with production environment
Account address: 0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b
ETH balance: 0.00498 ETH
USDT balance: 0 USDT
```

SDK initialized successfully. No explicit auth step needed — the SDK is stateless and builds unsigned txs. Auth happens when viem WalletClient signs and sends.

---

## M3: List/Find Active Markets
**Status**: PASS

Found 10 Live markets via `rain.getPublicMarkets({ limit: 10, sortBy: 'Liquidity', status: 'Live' })`.

Note: The SDK returns field `_id` for market ID and `question` for title — not `id`/`title` as the SKILL.md documents. The API returns raw MongoDB objects.

Top markets by liquidity:
1. Netflix-Warner acquisition (Volume: $13,960 USDT)
2. Another market (Volume: $14,102 USDT)
3. Third market (Volume: $5,185 USDT)

All have contract addresses and Live status.

---

## M4: Get Market Detail with Prices
**Status**: PASS

Market: "Will the Netflix-Warner acquisition fail, resulting in Netflix paying Warner Bros-Discovery the $5.8B breakup fee?"
- ID: 69368cf62b28bc923f7100d8
- Contract: 0x1cd385293d30d2b77ba9fa777ef1470b5312dae9
- Base Token: USDT (6 decimals)

Prices via `getMarketPrices()`:
- Option 1 (YES): 60.30%
- Option 2 (NO): 30.91%
- Option 3 (Unclassified): 8.79%

Prices are in 1e18 scale as documented. `getMarketDetails()` and `getMarketPrices()` both work correctly.

---

## M5: Place a Buy Order (~$1)
**Status**: PASS

**Pre-trade**: Needed USDT. Swapped 0.001 ETH -> 2.186595 USDT via Uniswap V3 on Arbitrum.

1. Approved USDT spending: tx 0x3237b8c14080b52c70d8d4af8fc6f5a95992d1ea0e89b74ec83525148c9a4b35 (success)
2. Buy attempt with selectedOption: 0n — reverted (option indices are 1-based on-chain despite SDK docs saying 0-indexed)
3. Buy with selectedOption: 1n — SUCCESS: tx 0x33e987924da1624eccb040b7b82e3d3c1281be259f45b17110edabaa1efbd802
   - Bought 1 USDT worth of Option 1 ("YES") shares
   - Gas used: 201,265

---

## M6: Verify Position Exists
**Status**: PASS

`getPositionByMarket()` shows:
- Option 1: 1,666,666 shares
- Dynamic payout if Option 1 wins: 2.366897 USDT
- No shares in other options

`getPositions()` returned 0 markets (possible API delay), but `getPositionByMarket()` returned correct data.

---

## M7: Sell/Close Position
**Status**: PARTIAL FAIL

The SDK's `buildSellOptionTx()` only places LIMIT sell orders — there is no market sell function. Three attempts:

1. Sell at 0.01 — placed limit order (shares moved to escrow), no fill. Cancel tx: 0x8f823e8e60783378e09f29dccd146a50d471335a3499c171d9d779dd74cad1dd
2. Sell at 0.01 (retry) — same result. Cancel tx: 0x03e4e0d416103827a11d2e64b096fddc062d9d4c809c73dab63593d9ab209c11
3. Sell at 0.55 (below market 0.60) — same result, limit order placed. Cancel tx: 0x53d122b87386e380eebd75b3c70c78868d8f6748fbb89346bd736a5e18a2a04c

**Root cause**: Market liquidity data shows `firstBuyOrderPrice: 0` for option 1 — there are ZERO buy orders in the order book. The AMM provides pricing/buying, but selling requires matching with order book buyers. Position cannot be closed immediately.

**Workaround discovery**: To cancel sell orders, you need the orderID from the PlaceSellOrder event log (word[3] in the event data). The SDK doesn't return this from the sell call itself.

---

## M8: Check Final Balance, Compute Delta
**Status**: PASS

Pre-trade (after Uniswap swap):
- ETH: 0.003969064675528
- USDT: 2.186595

Post-trade (after buy + 3 sell attempts + 3 cancels):
- ETH: 0.003936127459032
- USDT: 1.186595
- Open position: 1,666,666 shares of Option 1 (dynamic payout: 2.366897 USDT if YES wins)

**Delta**:
- ETH: -0.000032937216496 ETH (~$0.06 gas across 7 transactions)
- USDT: -1.000000 (spent on buying shares, still held as position)
- Net unrealized: position worth ~$1.00 at current prices (60.3% * 1.666666 shares) or $2.37 if option wins
