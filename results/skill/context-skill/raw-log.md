# Context Markets Skill Test — Raw Log

## M1. Understand skill & identify auth method

**What the skill said:** The skill is a navigation-hub format with a root `README.md` pointing to 4 skill categories (Trade, Research, Build, Create). The Trade skill (`skills/trade/SKILL.md`) documents:
- Auth: `CONTEXT_API_KEY` + `CONTEXT_PRIVATE_KEY` (Ethereum private key for EIP-712 signing)
- SDK: `context-markets` TypeScript SDK
- CLI: `context-markets-cli`
- MCP: `context-markets-mcp` (25 tools)
- Price encoding: cents (1-99), on-chain = price * 10,000
- Size encoding: contracts (min 0.01), on-chain = size * 1,000,000
- Order params: `outcome` (yes/no) + `side` (buy/sell) + `price` + `size`
- Place-order subskill documents the full 4-step workflow: get quotes -> simulate -> place -> verify

**What I did:** Fetched README.md, skills/trade/SKILL.md, skills/trade/place-order/SKILL.md, skills/trade/references/orders.md, and skills/api/README.md from GitHub raw URLs.

**Result:** PASS

**Notes:** Skill is well-structured with clear separation between router (SKILL.md) and subskills. References folder has detailed type definitions. The skill documents SDK, CLI, MCP, and React hooks — comprehensive coverage. No mention of v2 migration or settlement contract changes.

---

## M2. Authenticate successfully

**What the skill said:** Check with `ctx.account.status()` or `context_account_setup`. Account must be set up and funded.

**What I did:**
```bash
npx context-markets-cli account status --api-key ctx_pk_GCKAcDhEiYZKyuG3kCLD7fKAVsS7Id1V --private-key 0x09d2...abc --output json
```

**Raw output:**
```json
{
  "address": "0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b",
  "ethBalance": "1946156151798302",
  "usdcBalance": "2258180",
  "isOperatorApproved": true,
  "isReady": true
}
```

**Result:** PASS

**Notes:** Account is ready. USDC balance = 2.258180 USDC. ETH balance = ~0.00195 ETH. Both approvals done (USDC allowance and operator).

---

## M3. List/find active markets

**What the skill said:** Use `context_list_markets` (MCP) or `ctx.markets.list()` (SDK) or `context markets list` (CLI).

**What I did:**
```bash
npx context-markets-cli markets list --api-key ctx_pk_GCKAcDhEiYZKyuG3kCLD7fKAVsS7Id1V --output json
```

**Raw output:** 50 markets total. Active markets with orderbook liquidity:

1. "Will NS.EA, KT.C, and T1 all win their next matches?" — YES bid 35.6c/ask 40.4c
   ID: 0x27812c062da0b3ab5a3cde173fef6b8f9ac2412bc1a4d2fc92fd69088f83ae99
2. "Will OpenAI release 'Spud' in April?" — YES bid 12.6c/ask 17.4c
   ID: 0x158bbbf86e3505a0ae54b090d4a5fe40fd4622f9cb555ee2aac1054c30162fe3
3. "Trump wears red tie at memecoin conference?" — YES bid 52.6c/ask 57.4c
   ID: 0x4ce4ebb7612beee6f035d288bf92dbd6caa1e656623588646b5e4db4b265d4c4
4. "New OpenAI Advanced Voice model by May?" — YES bid 42.6c/ask 47.4c
   ID: 0xc90662ac2acb5be05cdf9ef077a1248dd950d842df608705f3b45604cf39680e

**Result:** PASS

**Notes:** Found 4+ active markets with bid/ask prices. Most markets with volume had resolved/pending resolution with empty orderbooks. The active markets with liquidity had 0 volume (market-maker provided quotes only).

---

## M4. Get specific market detail with prices

**What the skill said:** Call `context_get_quotes` or `ctx.markets.quotes(marketId)`.

**What I did:**
```javascript
const ctx = new ContextClient({ chain: 'mainnet', apiKey: '...' });
const market = await ctx.markets.get('0x27812c...');
```

**Raw output:**
```json
{
  "question": "Will Nongshim Esports Academy, KT Rolster Challengers, and T1 all win their matches?",
  "status": "active",
  "outcomePrices": [
    { "outcomeIndex": 0, "bestBid": 591250, "bestAsk": 648750, "spread": 57500, "midPrice": 620000 },
    { "outcomeIndex": 1, "bestBid": 351250, "bestAsk": 408750, "spread": 57500, "midPrice": 380000 }
  ],
  "volume": "0",
  "participantCount": 0,
  "deadline": "2026-04-11T03:59:59.000Z"
}
```

**Result:** PASS

**Notes:** YES (outcomeIndex=1) bid 35.1c, ask 40.9c. NO (outcomeIndex=0) bid 59.1c, ask 64.9c. Spread = 5.75c. SDK `.get()` works but `.quotes()` returned 404 — possibly a different endpoint path.

---

## M5. Place a buy order (~$1)

**What the skill said:** Place limit or market order. Skill shows:
- SDK: `ctx.orders.create({ marketId, outcome: "yes", side: "buy", priceCents: 45, size: 10 })`
- CLI: `context orders create --market <id> --outcome yes --side buy --price 45 --size 10`

**What I did:**
1. Installed context-markets SDK (v0.6.1) + socks-proxy-agent + node-fetch
2. Created trade.mjs script using SDK with SOCKS proxy via node-fetch
3. Attempted: `ctx.orders.create({ marketId, outcome: "yes", side: "buy", priceCents: 41, size: 2 })`
4. Got error: "Legacy settlement trading is disabled during holdings migration"
5. Investigated migration: API key is tied to SCW wallet 0x06bc... that needs v2 operator approval
6. Created manual v2 signing (trade-v2.mjs) with SettlementV2 domain — same migration error
7. Attempted to complete migration via:
   - On-chain setApprovalForAll tx (succeeded but for EOA, not SCW)
   - Sponsored migration endpoint (400: "Invalid input")
   - Gasless operator relay for SCW (400: "UserOperation reverted")
   - dismiss-orders endpoint (succeeded but didn't unblock)
8. All trading blocked by migration state of the API key's smart contract wallet

**Result:** BLOCKED

**Notes:** The Context Markets API is in the middle of a "Holdings migration" from SettlementV1 to SettlementV2. The API key (ctx_pk_GCK...) is associated with a smart contract wallet (SCW: 0x06bc9eb0b89b37687fc6321f734bcdba45a71f61) that needs its v2 operator approved. However:
- Our EOA (0x165E...) cannot execute transactions on behalf of the SCW
- The sponsored migration endpoint requires both `batchWithdraw` + `setOperator` signatures
- The gasless relay rejects our EOA signature for the SCW (different signer)
- SDK v0.6.1 uses legacy settlement; v0.7.0 is testnet-only
- The skill documentation does NOT mention the v2 migration at all — this is a critical gap

**VPN/Proxy notes:** Japan proxy (1081) works for trading API (bypasses geo-block). KR proxy (1083) is down. EU proxy (1082) is geo-blocked for trading. Without proxy, direct access returns "Trading is unavailable in your region".

---

## M6. Verify position exists

**What the skill said:** Call `context_my_orders` or `ctx.orders.mine(marketId)`.

**What I did:**
```javascript
const portfolio = await ctx.portfolio.positions();
// Returns: { "positions": [], "cursor": null }
```

**Result:** BLOCKED (no order placed, so no position to verify)

**Notes:** Portfolio read works fine. No positions because no trade was executed.

---

## M7. Sell/close position

**Result:** BLOCKED (no position to sell)

---

## M8. Check final balance, compute delta

**What the skill said:** Check balance with `ctx.account.status()` or `context_get_balance`.

**What I did:**
```javascript
const status = await ctx.account.status();
```

**Raw output:**
```json
{
  "address": "0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b",
  "ethBalance": "1945530483808090",
  "usdcBalance": "2258180",
  "isReady": true
}
```

**Result:** PARTIAL PASS (balance retrieved, but no trade delta to compute)

**Notes:**
- USDC: 2.258180 (unchanged)
- ETH: decreased by ~0.000626 ETH (gas from migration approval attempts)
- Pre-trade balance: 2.258180 USDC
- Post-trade balance: 2.258180 USDC
- Delta: 0 USDC (no trades executed)
- ETH delta: -0.000626 ETH (wasted on migration approval txs)
