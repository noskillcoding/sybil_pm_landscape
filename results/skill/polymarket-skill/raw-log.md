# Polymarket Skill Test — Raw Log

**Started**: 2026-04-10
**Skill**: Polymarket Agent Skills (SKILL.md)
**Format**: pure-docs
**Method**: TypeScript SDK (@polymarket/clob-client)

---

## M1. Understand skill & identify auth method

**Skill overview**: The Polymarket Agent Skills document describes a comprehensive integration for prediction market trading on Polygon. It covers:
- Two-level authentication: L1 (EIP-712 signing) to derive API credentials, L2 (HMAC-SHA256) for authenticated trading requests
- Order placement: GTC, GTD, FOK, FAK order types with limit and market order patterns
- Market data: Gamma API (events/markets, no auth), CLOB (orderbook/prices, no auth for reads), Data API (trades/positions)
- WebSocket streaming for real-time data
- CTF operations (split, merge, redeem)
- Contract addresses on Polygon (USDC.e, CTF Exchange, etc.)

**Auth method**: 
1. Create a temp ClobClient with private key (L1)
2. Call `createOrDeriveApiKey()` to get `{apiKey, secret, passphrase}`
3. Create full trading ClobClient with those credentials + signature type + funder address
4. Signature type 0 = EOA for our case

**SDKs referenced**: 
- TypeScript: `@polymarket/clob-client` + `ethers` v5
- Python: `py-clob-client`

**STATUS**: PASS — Clear understanding of capabilities and auth flow.

---

## M2. Authenticate successfully

**Skill said**: Use ClobClient with private key to derive API creds (L1), then create full trading client with creds + signature_type + funder (L2).

**Agent did**:
1. Created temp ClobClient with private key (L1 auth)
2. Called `create_or_derive_api_creds()` — got API key, secret, passphrase
3. Created full trading client with signature_type=0 (EOA), funder=wallet address
4. Called `get_balance_allowance()` — confirmed balance of 4,221,699 raw (4.221699 USDCe)

**Notes**:
- Skill doc uses attribute names `secret`/`passphrase` but actual SDK uses `api_secret`/`api_passphrase` — minor naming mismatch
- Skill doc shows `get_balance_allowance(asset_type="COLLATERAL")` but actual SDK uses `BalanceAllowanceParams` dataclass — API mismatch
- Both are minor friction points, not blockers

**STATUS**: PASS — Authenticated and verified with balance check.

---

## M3. List/find active markets

**Skill said**: Use Gamma API — `GET https://gamma-api.polymarket.com/events?active=true&closed=false&limit=N`

**Agent did**: 
- Fetched active events from Gamma API via curl with SOCKS proxy
- Note: `order=volume_24hr` parameter from skill doc returned "validation error" — not a valid sort parameter. Used default ordering instead.

**Markets found (sample)**:
1. **MicroStrategy sells any Bitcoin by December 31, 2026?** — Yes: $0.12, No: $0.88, Liquidity: $60K
2. **Kraken IPO by December 31, 2026?** — Yes: $0.39, No: $0.61, Liquidity: $5.6K
3. **Starmer out by December 31, 2026?** — Yes: $0.505, No: $0.495, Liquidity: $154K, Spread: 0.01
4. **Will any country leave NATO by December 31, 2026?** — Yes: $0.115, No: $0.885, Liquidity: $100K

**Selected for trading**: Starmer out by December 31, 2026? (most liquid, tightest spread)

**STATUS**: PASS — Found 10+ active markets with IDs, titles, and prices.

---

## M4. Get specific market detail with prices

**Skill said**: Use CLOB REST endpoints — `GET /book?token_id=`, `GET /price?token_id=&side=`, `GET /midpoint?token_id=`, `GET /spread?token_id=`

**Selected market**: Will bitcoin hit $1m before GTA VI?
- ConditionID: `0xbb57ccf5853a85487bc3d83d04d669310d28c6c810758953b9d9b91d1aee89d2`
- YES token: `105267568073659068217311993901927962476298440625043565106676088842803600775810`
- NO token: `91863162118308663069733924043159186005106558783397508844234610341221325526200`
- Tick size: 0.001
- Min size: 5
- NegRisk: false

**Orderbook (YES token, derived prices)**:
- Best bid (sell price): $0.489
- Best ask (buy price): $0.488 
- Midpoint: $0.4885
- Spread: 0.001
- Liquidity: $420K

**Note**: Raw `/book` endpoint shows complement (inverted) orderbook. The `/price`, `/midpoint`, `/spread` endpoints compute derived prices correctly. The SDK handles this internally.

**STATUS**: PASS — Detailed market data with prices obtained.

---

## M5. Place a buy order (~$1)

**Skill said**: Use `client.create_and_post_order(OrderArgs(...), options={"tick_size": ..., "neg_risk": ...}, order_type=OrderType.GTC)`

**Agent did**:
1. Checked current midpoint ($0.4885) and buy price ($0.488)
2. Placed GTC limit buy: 5 shares YES at $0.489 (min order = 5 shares)
3. Total cost: $2.445

**Result**:
- Order ID: `0x59998929321cbbd46dfd1bd5b241dc5d3ddd7fcd4d1479b23fe0a29ba187c367`
- Status: `matched` (immediately filled)
- TX: `0x97fcb6f87a8a3bb982a77fedc3ccf2059341d473d24e42d81af44d4cb4209e56`

**Skill accuracy issues**:
1. Skill shows `options={"tick_size": ..., "neg_risk": ...}` (dict) — actual SDK requires `PartialCreateOrderOptions` typed object
2. Skill shows `order_type=OrderType.GTC` as third arg — actual `create_and_post_order` has no `order_type` parameter (defaults to GTC)
3. Skill shows `OrderArgs(token_id=..., price=..., size=..., side=BUY)` — actual SDK uses string `side` not constant, and attribute names match but `side=BUY` works with the imported constant

**STATUS**: PASS — Order placed and confirmed.

---

## M6. Verify position exists

**Skill said**: Use `client.get_balance_allowance()` with conditional token type.

**Agent did**: Called `get_balance_allowance` with `AssetType.CONDITIONAL` for the YES token.

**Results**:
- YES token balance: 5,000,000 raw (5.0 shares, 6 decimals)
- USDC balance: 1,776,699 raw (1.776699 USDC)
- Balance delta: 4.221699 - 1.776699 = 2.445 USDC spent (matches order cost)
- No open orders (order fully filled/matched)

**STATUS**: PASS — Position visible and confirmed.

---

## M7. Sell/close position

**Skill said**: Use same `create_and_post_order` with `side=SELL`. Cancel with `client.cancel(order_id)`.

**Agent did**:
1. First attempt: sold at $0.489 — order went "live" (resting, no immediate match)
2. Cancelled resting order via `client.cancel(order_id)` — confirmed cancelled
3. Second attempt: sold at $0.488 (one tick lower) — matched immediately

**Results**:
- Sell Order ID: `0x7ce09b56f166b19cff9fb6cbf4ccd6b559dd3114d79fa0d93a78e4f727d9f051`
- Status: `matched`
- Taking amount: $2.44
- TX: `0xb554d3c8684faa485366cb565fb1f95dec558119efb62d713166acef60ace8f0`

**Insight**: The 0.489 sell price was at the bid (from the perspective of the derived price endpoint), but it wasn't marketable — it rested. Selling one tick lower at 0.488 crossed the spread and matched. The skill doesn't explain the derived-price vs raw-CLOB distinction clearly.

**STATUS**: PASS — Position closed on second attempt.

---

## M8. Check final balance, compute delta

**Agent did**: Called `get_balance_allowance` for collateral and conditional tokens.

**Results**:
- Initial balance: 4.221699 USDC
- Final balance: 4.216699 USDC
- Delta: -$0.005 (lost half a cent on the spread)
- Conditional token balance: 0.0 shares (position fully closed)
- Open orders: none

**Explanation**: Bought 5 shares at $0.489 ($2.445 total), sold at $0.488 ($2.44 received). The $0.005 loss = 5 shares x $0.001 spread.

**STATUS**: PASS — Delta computed. Round trip complete.
