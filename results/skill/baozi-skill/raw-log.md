# Baozi OpenClaw Skill Test - Raw Log

## M1. Understand skill & identify auth method
**Status: PASS**

Fetched SKILL.md from `https://raw.githubusercontent.com/bolivian-peru/baozi-openclaw/main/SKILL.md`.

The skill defines 10 scripts:
1. `scripts/list-markets` - Browse active markets (filters: --status, --layer, --query, --limit)
2. `scripts/get-odds` - Get implied probabilities and pool sizes for a market
3. `scripts/get-portfolio` - View positions for a wallet
4. `scripts/analyze-market` - Statistical summary of a market
5. `scripts/place-bet` - Place a bet (--market-id, --outcome, --amount, --affiliate)
6. `scripts/create-profile` - Create a CreatorProfile
7. `scripts/create-market` - Create boolean Lab market
8. `scripts/create-race-market` - Create multi-outcome race market
9. `scripts/claim-winnings` - Claim from resolved markets
10. `scripts/claim-affiliate` - Claim referral commissions

**Auth method:** Two env vars:
- `SOLANA_RPC_URL` - Required, recommends Helius/QuickNode
- `SOLANA_PRIVATE_KEY` - Required for trading, base58-encoded 64-byte key

**CRITICAL FINDING:** None of these 10 scripts exist in the repo. The `scripts/` directory contains unrelated subdirectories (agent-arena, calls-tracker, share-card-engine, trending-market-machine, trust-proof-explorer). The SKILL.md is aspirational documentation for scripts that were never implemented.

The repo is actually a bounty/integration platform. The real working tools are:
- `@baozi.bet/mcp-server` npm package (76 tools, full protocol coverage)
- Direct Solana RPC with program ID `FWyTPzm5cfJwRKzfkscxozatSxF6Qu78JQovQUwKPruJ`

## M2. Authenticate successfully
**Status: PASS (via workaround)**

The skill's scripts don't exist, so I used the `@baozi.bet/mcp-server` npm package (v5.0.0) which exports the same functionality as JavaScript modules.

Set up:
- `SOLANA_RPC_URL=https://api.mainnet-beta.solana.com`
- `SOLANA_PRIVATE_KEY` from macOS Keychain

Verified auth by:
1. Imported `listMarkets` from MCP server package
2. Successfully fetched all on-chain market data
3. Wallet confirmed: `AP4u47AMhh3fbuBJqk34vWbxqePPAHt8Yo5zcKPxecbm` (0.1328 SOL)

Note: Baozi's own API (`baozi.bet/api/markets`) returns 401 because their internal RPC key is expired/invalid. Direct on-chain reads via public RPC work fine.

## M3. List/find active markets
**Status: PASS**

Used `listMarkets('active')` from MCP server package. Found:
- **15 active markets total**
- **3 markets open for betting:**

| Market ID | Question | Pool | Close |
|-----------|----------|------|-------|
| 108 | Will Block Inc announce additional layoffs by June 30 2026? | 0 SOL | 2026-06-15 |
| 85 | Will Cboe launch its event contracts product before July 1, 2026? | 0 SOL | 2026-06-15 |
| 90 | Will the SEC approve a prediction market ETF before Jun 30, 2026? | 0.03 SOL | 2026-06-25 |

All are Lab layer markets. Market 90 was the only one with existing liquidity.

## M4. Get specific market detail with prices
**Status: PASS**

Market 90 details:
- **Question:** "Will the SEC approve a prediction market ETF before Jun 30, 2026? (Source: SEC EDGAR)"
- **PK:** `9RX4qTzJUtg4cd1DacPKnAwosexpyTzpFoWUiZCxtVkY`
- **Yes pool:** 0.01 SOL (33.3%)
- **No pool:** 0.02 SOL (66.7%)
- **Total pool:** 0.03 SOL
- **Layer:** Lab
- **Platform fee:** 300 bps (3%)
- **Creator fee:** 50 bps (0.5%)
- **Closing time:** 2026-06-25T00:00:00.000Z
- **Betting open:** true
- **Has bets:** true

## M5. Place a buy order (~0.01-0.05 SOL)
**Status: PASS**

Placed 0.01 SOL bet on "Yes" for Market 90.

- **Transaction signature:** `5FZsMQKjH1TRqHfxWw7ED5NyU46Kmnwz5Bnd2tBzhmKuCXF2FJFckeuqWhpBHm7QxRTZzho9S4NDSFGcDky83zGP`
- **Explorer:** https://solscan.io/tx/5FZsMQKjH1TRqHfxWw7ED5NyU46Kmnwz5Bnd2tBzhmKuCXF2FJFckeuqWhpBHm7QxRTZzho9S4NDSFGcDky83zGP
- **Status:** Confirmed on-chain
- **Cost:** 0.01175 SOL total (0.01 bet + ~0.00175 fees/rent)
- **Balance before:** 0.132840724 SOL
- **Balance after:** 0.121088764 SOL

## M6. Verify position exists
**Status: PASS**

Used `getPositionsEnriched` from MCP server package:

```json
{
  "publicKey": "Fkap1v86s8W6VB1pUF88c4xCtL9UU4kieBUYkmTM3Vw7",
  "user": "AP4u47AMhh3fbuBJqk34vWbxqePPAHt8Yo5zcKPxecbm",
  "marketId": "90",
  "yesAmountSol": 0.01,
  "noAmountSol": 0,
  "totalAmountSol": 0.01,
  "side": "Yes",
  "claimed": false,
  "marketPda": "9RX4qTzJUtg4cd1DacPKnAwosexpyTzpFoWUiZCxtVkY",
  "marketQuestion": "Will the SEC approve a prediction market ETF before Jun 30, 2026? (Source: SEC EDGAR)",
  "marketStatus": "Active",
  "marketOutcome": null
}
```

## M7. Sell/close position
**Status: PASS (documented limitation)**

Baozi uses pari-mutuel pricing. There is no sell/exit/withdraw mechanism before market resolution. Confirmed by:
1. SKILL.md states: "Pari-mutuel pricing: P(outcome) = pool_for_outcome / total_pool"
2. No sell/exit/cancel functions exist in the MCP server package (searched all 76 tools)
3. Only way to exit is to claim winnings after market resolves

This is inherent to pari-mutuel markets and is correctly documented.

## M8. Check final balance, compute delta
**Status: PASS**

- **Pre-trade balance:** 0.132840724 SOL
- **Post-trade balance:** 0.121088764 SOL
- **Delta:** -0.011751960 SOL
  - 0.01 SOL bet amount
  - ~0.00175 SOL in transaction fees + account rent
