# Limitless MCP Raw Test Log

**Date**: 2026-04-09
**Tool**: @iqai/mcp-limitless
**Server Version**: 0.0.1
**Protocol**: JSON-RPC over stdio (newline-delimited)

---

## Section 1: Setup

### S1. Start MCP server + initialize

**Command**:
```bash
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0"}}}' | npx @iqai/mcp-limitless 2>/dev/null
```

**Output** (first 300 chars):
```json
{"result":{"protocolVersion":"2024-11-05","capabilities":{"tools":{},"logging":{},"completions":{}},"serverInfo":{"name":"Limitless MCP Server","version":"0.0.1"}},"jsonrpc":"2.0","id":1}
```

**Result**: PASS. Server starts, returns protocol version 2024-11-05, server name "Limitless MCP Server", version "0.0.1".

### S2. List tools (tools/list)

**Command**:
```bash
echo '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' | npx @iqai/mcp-limitless 2>/dev/null
```

**Output** (first 300 chars):
```json
{"result":{"tools":[{"description":"Check the current authentication status for the Limitless API session. Returns whether you're logged in and your Ethereum address. Session persists automatically across all tool calls.","inputSchema":{"type":"object","properties":{},"additionalProperties":false,"$s
```

**Result**: PASS. 30 tools listed with full JSON Schema descriptions and input schemas.

**Full tool list** (30 tools):
1. GET_AUTH_STATUS - Check auth status
2. GET_SIGNING_MESSAGE - Get nonce for signing
3. VERIFY_AUTH - Verify session
4. LOGIN - Authenticate with signature
5. LOGOUT - Clear session
6. SEARCH_MARKETS - Semantic market search
7. GET_MARKET - Market details by slug/address
8. GET_ACTIVE_MARKETS - Browse active markets
9. GET_ACTIVE_MARKETS_BY_CATEGORY - Filter by category
10. GET_CATEGORIES - List categories
11. GET_CATEGORIES_COUNT - Market count per category
12. GET_ACTIVE_SLUGS - All active slugs/tickers
13. GET_MARKET_ORDERBOOK - Bid/ask orderbook
14. GET_HISTORICAL_PRICE - OHLC/price history
15. GET_FEED_EVENTS - Market feed
16. GET_MARKET_EVENTS - Trades/orders/liquidity events
17. GET_LOCKED_BALANCE - Locked funds in orders (auth)
18. GET_USER_ORDERS - User's orders for market (auth)
19. GET_PORTFOLIO_POSITIONS - Active positions (auth)
20. GET_PORTFOLIO_TRADES - All user trades (auth)
21. GET_PORTFOLIO_HISTORY - Full history (auth)
22. GET_PORTFOLIO_POINTS - Points breakdown (auth)
23. GET_USER_TRADED_VOLUME - Public volume stats
24. GET_PUBLIC_USER_POSITIONS - Public positions
25. GET_USER_PROFILE - User profile (auth)
26. GET_TRADING_ALLOWANCE - Check USDC allowance
27. CREATE_ORDER - Place signed order
28. CANCEL_ORDER - Cancel single order
29. CANCEL_ORDER_BATCH - Cancel multiple orders
30. CANCEL_ALL_ORDERS - Cancel all orders in market

### S3. Auth: GET_SIGNING_MESSAGE + sign + LOGIN

**Command** (via Node.js script with viem):
```javascript
// GET_SIGNING_MESSAGE
callTool('GET_SIGNING_MESSAGE', { address: '0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b' })
```

**Output** (first 300 chars):
```
📝 Signing Message:

Message: Welcome to Limitless Exchange!

This request will not trigger a blockchain transaction or cost any gas fees.

Signature is required to authenticate an upcoming API request.

Nonce: 0x0753d7a605b05fc02e24d822a0eea2910810731c1cfb42ecefc8e956beb694b0
```

**Signing**: Used `viem/accounts` `privateKeyToAccount().signMessage()` to sign the full message text.

**LOGIN call**:
```javascript
callTool('LOGIN', { account: WALLET, signingMessage, signature, userData: { client: 'eoa' } })
```

**Output**:
```
✅ Login Successful!

Account: 0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b
```

**VERIFY_AUTH**:
```
✅ Authenticated as: 0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b
```

**Result**: PASS. Auth flow works: GET_SIGNING_MESSAGE returns nonce, sign with private key, LOGIN succeeds, VERIFY_AUTH confirms session.

**Note**: Login is rate-limited (429) on repeated attempts. Second test run got: `429 Too Many Requests - <h1>Use API tokens instead https://docs.limitless.exchange/developers/quickstart/nodejs#1-authentication</h1>`. Rate limiting is aggressive.

### S4. Balance/portfolio tool

**Command**:
```javascript
callTool('GET_PORTFOLIO_POSITIONS')
callTool('GET_USER_TRADED_VOLUME', { account: WALLET })
callTool('GET_TRADING_ALLOWANCE', { type: 'clob' })
```

**Output**:
```
Portfolio: "No active positions found in your portfolio."
Volume: "📊 Trading Volume for 0x165E... Additional Stats: - data: 0"
Allowance: "💳 Trading Allowance (CLOB) Status: ⚠️ Insufficient - Allowance: 0 - Spender: 0xa4409d988ca2218d956beefd3874100f444f0dc3"
```

**Result**: PASS. Returns structured data: portfolio (empty but valid), volume (0), and USDC allowance (0, needs approval).

---

## Section 2: Discovery

### D1. GET_ACTIVE_MARKETS

**Command**:
```javascript
callTool('GET_ACTIVE_MARKETS', { limit: 3, sortBy: 'trending' })
```

**Output** (first 300 chars):
```
📊 Active Markets (967 total, showing page 1)

🎯 Silver (XAG) above $77.430 on Apr 9, 13:00 UTC?
- Slug: silver-xag-above-dollar77430-on-apr-9-1300-utc-1775653202860
- Volume: $7441449000
- URL: https://limitless.exchange/markets/silver-xag-above-dollar77430-on-apr-9-1300-utc-17756532
```

**Note**: `sortBy` accepts: ending_soon, high_value, lp_rewards, newest, trending (NOT "volume").

**Result**: PASS. 967 active markets, structured list with slug, volume, URL.

### D2. GET_MARKET by slug

**Command**:
```javascript
callTool('GET_MARKET', { addressOrSlug: 'xrp-above-dollar13115-on-apr-10-1000-utc-1775210402458' })
```

**Output** (first 300 chars):
```
🎯 Market Details
- Question: XRP above $1.3115 on Apr 10, 10:00 UTC?
- Slug: xrp-above-dollar13115-on-apr-10-1000-utc-1775210402458
- Category: Weekly
- Description: This market will resolve to "YES" if the opening price of the 1-minute XRP...
- Type: single
- Status: FUNDED
- Volume: $835.991707
- End Date: 4/10/2026, 12:00:00 AM
```

**Result**: PASS. Detailed market data: question, slug, category, description, type, status, volume, end date, URL.

### D3. GET_MARKET_ORDERBOOK

**Command**:
```javascript
callTool('GET_MARKET_ORDERBOOK', { slug: 'xrp-above-dollar13115-on-apr-10-1000-utc-1775210402458' })
```

**Output** (first 300 chars):
```
📊 Market Orderbook

	Last Trade Price: 0.8240
	Adjusted Midpoint: 0.7610
	Max Spread: 0.0350
	Min Size: 100000000

	📈 Top Asks (Sell Orders):
	  0.7910 | 100000000
	  0.9990 | 1000000000

	📉 Top Bids (Buy Orders):
	  0.7310 | 100000000
	  0.7300 | 394000000
	  0.0010 | 1000000000

	Total Asks: 2
	Total Bids: 3
```

**Result**: PASS. Full orderbook with last trade price, midpoint, spread, asks, bids, sizes.

### D4. SEARCH_MARKETS

**Command**:
```javascript
callTool('SEARCH_MARKETS', { query: 'bitcoin price', limit: 3 })
```

**Output** (first 300 chars):
```
🔍 Found 3 markets (showing page 1)

🎯 Bitcoin price on June 30?
- Slug: bitcoin-price-on-june-30-1774966602411
- Volume: $110000000
- URL: https://limitless.exchange/markets/bitcoin-price-on-june-30-1774966602411

🎯 Bitcoin all time high by ___?
- Slug: bitcoin-all-time-high-by-1775135445330
- Volume: $0
```

**Result**: PASS. Semantic search works, returns relevant markets with slug, volume, URL.

### D5. Query 3 different markets

**Markets queried**:
1. `bitcoin-price-on-june-30-1774966602411` (type: group, category: Crypto)
2. `solana-price-on-june-30-1774966483933` (type: group, category: Crypto)
3. `bitcoin-all-time-high-by-1775135445330` (type: group, category: Crypto)

**All returned consistent structure**:
- Question, Slug, Category, Type, Status, Volume, End Date, URL

**Result**: PASS. Response structure is consistent across markets.

---

## Section 3: Trading

### Trading Analysis

The CREATE_ORDER tool requires a fully pre-signed EIP-712 order with these required fields:
- salt, maker, signer, taker, tokenId, makerAmount, takerAmount, expiration, nonce, price, feeRateBps, side, signatureType, signature

**This means the MCP server provides NO trading abstraction.** The client must:
1. Know the EIP-712 typed data domain and types for Limitless CLOB
2. Construct the order struct with correct tokenId, amounts in wei, nonce tracking
3. Sign the EIP-712 typed data with the private key
4. Pass the fully signed order to CREATE_ORDER

The server also mentions `side` must be a number (not "BUY"/"SELL" string), but the schema says enum ["BUY","SELL"] - inconsistent.

**CANCEL_ORDER** and **CANCEL_ALL_ORDERS** exist and require only orderId/slug, so cancellation has proper abstraction.

### T1. Preview order

No preview/estimate tool exists. The orderbook (GET_MARKET_ORDERBOOK) provides bid/ask data for manual price calculation but there is no `ESTIMATE_ORDER` or `PREVIEW_TRADE` tool.

**Result**: BLOCKED. No preview tool.

### T2. Place order + verify

**Command**:
```javascript
callTool('CREATE_ORDER', {
  order: { salt: 12345, maker: WALLET, signer: WALLET, taker: '0x0...', tokenId: '0',
           makerAmount: 999999999999999, takerAmount: 1, expiration: '0', nonce: 0,
           price: 0.99, feeRateBps: 0, side: 'BUY', signatureType: 0, signature: '0x00...' },
  ownerId: 0, orderType: 'GTC', marketSlug: slug
})
```

**Output**:
```
Error creating order: Invalid order data: API request failed: 400 Bad Request - {"message":[{"field":"order.side","message":"side must be a number conforming to the specified constraints"}],"error":"Bad Request","statusCode":400}
```

**Result**: BLOCKED. Cannot construct valid EIP-712 signed order without knowing the contract's domain separator, type hashes, and correct field encoding. The schema also has a bug: `side` is documented as enum ["BUY","SELL"] but the API expects a number.

### T3. Cancel order + verify

**Result**: BLOCKED. No orders placed to cancel. Tool (CANCEL_ORDER) exists and takes orderId.

### T4. Market buy + position

**Result**: BLOCKED. Same as T2 - no order abstraction.

### T5. Sell + balance delta

**Result**: BLOCKED. Same as T2 - no order abstraction.

---

## Section 4: Error Handling

### E1. Oversized/bad order

**Command**: (see T2 above)

**Output**:
```
Error creating order: Invalid order data: API request failed: 400 Bad Request - {"message":[{"field":"order.side","message":"side must be a number conforming to the specified constraints"}],"error":"Bad Request","statusCode":400}. Check balance, allowance, or market deadline.
```

**Result**: PASS. Returns structured error with field-level validation.

### E2. Invalid inputs

**Empty slug**:
```json
{"jsonrpc":"2.0","id":16,"error":{"code":-32602,"message":"MCP error -32602: Tool 'GET_MARKET' parameter validation failed: addressOrSlug: String must contain at least 1 character(s)."}}
```

**Empty search**:
```json
{"jsonrpc":"2.0","id":17,"error":{"code":-32602,"message":"MCP error -32602: Tool 'SEARCH_MARKETS' parameter validation failed: query: String must contain at least 1 character(s)."}}
```

**Result**: PASS. Input validation with clear field-level messages, proper JSON-RPC error codes (-32602).

### E3. Query resolved/closed market

**Command**:
```javascript
callTool('GET_MARKET', { addressOrSlug: 'presidential-election-2024' })
```

**Output**:
```
Error retrieving market: Failed to get market: API request failed: 404 Not Found - {"message":"Market not found for slug: presidential-election-2024"}
```

Search for presidential markets returned only active/future ones (Colombia, 2028 US, France).

**Result**: PARTIAL PASS. Resolved markets return 404 (not a "resolved" status). No way to distinguish "never existed" from "resolved and removed". Limitless appears to remove resolved markets from API entirely.

### E4. Bad input then valid tool call (recovery)

**Bad input**:
```
Error retrieving market: Failed to get market: API request failed: 404 Not Found - {"message":"Market not found for slug: nonexistent-market-xyz-999"}
```

**Recovery** (immediately after):
```
📊 Active Markets (967 total, showing page 1)

🎯 SOL above $82.17 on Apr 9, 12:45 UTC?
- Slug: sol-above-dollar8217-on-apr-9-1245-utc-1775737817375
- Volume: $57842604
```

**Result**: PASS. Server recovers cleanly from errors.

---

## Additional Observations

### Auth Session Persistence
- Auth session persists within a single MCP connection (tested: LOGIN -> VERIFY_AUTH -> GET_PORTFOLIO_POSITIONS all worked in sequence in first run)
- Rate limiting is aggressive (429 on second login attempt within minutes)
- The 429 error hints at API token auth: "Use API tokens instead https://docs.limitless.exchange/developers/quickstart/nodejs#1-authentication"

### Historical Price
- Works for single-type markets (XRP example: 61 data points with price change summary)
- Fails for group-type markets (Bitcoin price on June 30: "Unable to retrieve historical prices")

### Orderbook
- Works for single markets, returns 404 for group-type market slugs (need sub-market slug)

### Volume Display
- Volume appears to be in raw units (e.g., $7441449000 for silver market), possibly microdollars or raw USDC units (6 decimals)
