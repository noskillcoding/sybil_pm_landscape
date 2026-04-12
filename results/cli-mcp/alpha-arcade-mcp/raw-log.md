# Alpha Arcade MCP - Raw Test Log
**Date**: 2026-04-09
**Tool**: @alpha-arcade/mcp
**Chain**: Algorand
**Wallet**: 6QD3JGXHWU2FXQSVIVV2PAGQWJBDYBFF5H2S5QNP6CLXPD4PUK7XCOVKWM

---

## Section 1: Setup

### S1. Initialize MCP Server
**Command**: `printf '{"jsonrpc":"2.0","id":1,"method":"initialize",...}' | ALPHA_MNEMONIC=<mnemonic> npx @alpha-arcade/mcp 2>/dev/null`
**Output (first 300 chars)**: `{"result":{"protocolVersion":"2024-11-05","capabilities":{"resources":{"listChanged":true},"tools":{"listChanged":true}},"serverInfo":{"name":"alpha-arcade","version":"0.1.0"}},"jsonrpc":"2.0","id":1}`
**Result**: PASS - Server responds with protocolVersion 2024-11-05, serverInfo name "alpha-arcade" version "0.1.0", capabilities include resources and tools with listChanged.

### S2. List Tools + Agent Guide
**Command**: `tools/list` + `tools/call get_agent_guide`
**Output (first 300 chars)**: `{"result":{"tools":[{"name":"get_agent_guide","description":"Returns the Alpha Arcade agent guide..."},{"name":"get_live_markets",...},{"name":"get_reward_markets",...},{"name":"get_market",...},{"name":"get_orderbook",...},...`
**Tools found (20)**: get_agent_guide, get_live_markets, get_reward_markets, get_market, get_orderbook, get_full_orderbook, get_open_orders, get_positions, create_limit_order, create_market_order, cancel_order, amend_order, propose_match, split_shares, merge_shares, claim, stream_orderbook, stream_live_markets, stream_market, stream_wallet_orders
**Agent Guide**: Retrieved successfully. Covers units (microunits: 1M = $1), data model (binary + multi-choice markets), orderbook mechanics (4-sided, cross-side equivalence), collateral (~0.957 ALGO MBR), key workflows (buy, portfolio, amend, cancel, claim), common pitfalls.
**Result**: PASS - 20 tools listed. Agent guide provides comprehensive operational documentation.

### S3. Auth (get_positions)
**Command**: `tools/call get_positions {}`
**Output (first 300 chars)**: `{"result":{"content":[{"type":"text","text":"No positions found for this wallet."}]},"jsonrpc":"2.0","id":11}`
**Result**: PASS - Mnemonic auth works. Returns structured response (no positions in wallet currently).

### S4. Balance Check
**Command**: No dedicated balance tool exists.
**Notes**: The MCP server has no `get_balance` or `get_wallet` tool. Balance info (USDC/ALGO) is not directly exposed. The wallet's balances (~13 ALGO + ~$3.38 USDC) are known from external chain queries. Positions tool confirms auth works. The agent guide mentions USDC collateral requirements but provides no tool to check available balance.
**Result**: FAIL - No tool to query wallet USDC or ALGO balance. An agent cannot check available funds before trading.

---

## Section 2: Discovery

### D1. List Live Markets
**Command**: `tools/call get_live_markets {}`
**Output (first 300 chars)**: `[{"id":"3100809224","title":"Will Jesus Christ return before GTA VI?","marketAppId":3100809224,"yesAssetId":3100809335,"noAssetId":3100809336,"endsAt":"2026-07-31T04:00:00.000Z","isResolved":false,"source":"onchain","feeBase":70000},{"id":"group:Republican Presi`
**Result**: PASS - 177 live markets returned with IDs. Mix of binary and multi-choice (sports, politics, crypto, real estate). Each has id, title, marketAppId, yesAssetId, noAssetId, endsAt, isResolved, source, feeBase. Multi-choice markets include options[] array.

### D2. Market Detail
**Command**: `tools/call get_market {"marketId":"3100809224"}`
**Output (first 300 chars)**: `{"id":"3100809224","title":"Will Jesus Christ return before GTA VI?","marketAppId":3100809224,"yesAssetId":3100809335,"noAssetId":3100809336,"endTs":1785470400,"isResolved":false,"isLive":true,"feeBase":70000,"source":"onchain"}`
**Result**: PASS - Returns full market detail with id, title, marketAppId, yesAssetId, noAssetId, endTs, isResolved, isLive, feeBase, source.

### D3. Orderbook Quality
**Command**: `tools/call get_orderbook {"marketAppId":3100809224}` (Jesus/GTA VI market)
**Output (first 300 chars)**: `{"unified":{"asks":[],"bids":[{"price":"11.00c","priceRaw":110000,"shares":"298.35","total":"$32.82","escrowAppId":3239431941,"owner":"2QNWN7...","source":"YES bid"}],"spread":"N/A"},"totalOrders":1}`
**Additional orderbooks checked**:
- Heat vs Raptors (3512808729): 2 orders, bid 39.50c / ask 41.50c, spread 2.00c, ~$155-164 depth
- Bitcoin Up/Down Apr 9 (3513835005): 2 orders, bid 16.50c / ask 22.50c, spread 6.00c, ~$43-53 depth
- Celtics vs Knicks (3512809382): 2 orders, bid 36.50c / ask 38.50c, spread 2.00c, ~$143 depth
- OKC NBA Champion (3447238620): 5+ orders, bid 39.50c / best ask 41.00c, spread 1.50c, ~$155+ depth per side
**Result**: PASS - Orderbook data present with unified YES-perspective view. Includes price, priceRaw, shares, total, escrowAppId, owner, source (YES bid/ask, NO bid/ask mapped). Sports markets show tighter spreads (1.5-2c) with $100-300 total depth. Thin but functional.

### D4. Search
**Command**: N/A - no search tool in tools/list
**Result**: FAIL - No search/filter tool. Agent must retrieve all 177 markets and filter client-side.

### D5. Compare 3 Markets Structure
**Markets queried**:
1. Binary: "Will Jesus Christ return before GTA VI?" (3100809224) - fields: id, title, marketAppId, yesAssetId, noAssetId, endTs, isResolved, isLive, feeBase, source
2. Binary: "Will the Heat beat the Raptors?" (3512808729) - fields: id, title, marketAppId, yesAssetId, noAssetId, endTs, isResolved, isLive, feeBase, source
3. Binary: "Bitcoin Up or Down - April 9, 12PM ET" (3513835005) - fields: id, title, marketAppId, yesAssetId, noAssetId, endTs, isResolved, isLive, feeBase, source
**Result**: PASS - Consistent structure across all markets. All binary markets have identical field set. Multi-choice markets add options[] array with per-option marketAppId, yesAssetId, noAssetId.

---

## Section 3: Trading

### T1. Preview / Simulate
**Command**: N/A - no simulate/estimate tool in tools/list
**Result**: FAIL - No preview/simulation tool. Agent must calculate costs from orderbook data and microunit math manually.

### T2. Place Limit Order + Verify
**Command**: `tools/call create_limit_order {"marketAppId":3513835005,"position":1,"price":100000,"quantity":1000000,"isBuying":true}`
**Output (first 300 chars)**: `Limit order created. Market App ID: 3513835005 Escrow App ID: 3513867552 Position: YES Side: BUY Price: $0.10 Quantity: 1.00 shares Tx IDs: EXSWVVAAIUAZ7WJ3GQJMPZNA5FJB2QFPMP6RXUXLPRAPRMLMUZJA, DPHOOQEPBSCVFL24AIJCIH7BC64G5BRI2IQHSM2PKNQ7Q7TDEN7A, ZFUJTJVTYXT6JZ...`
**Verification**: `get_open_orders` confirmed escrowAppId 3513867552, YES BUY at $0.10, 1.00 shares, 0.00 filled, 1.00 remaining.
**Result**: PASS - Limit order placed on-chain, confirmed at round 60077518. Verified via get_open_orders.

### T3. Cancel Order + Verify
**Command**: `tools/call cancel_order {"marketAppId":3513835005,"escrowAppId":3513867552,"orderOwner":"6QD3JGXHWU2FXQSVIVV2PAGQWJBDYBFF5H2S5QNP6CLXPD4PUK7XCOVKWM"}`
**Output (first 300 chars)**: `Order cancelled successfully. Market App ID: 3513835005 Escrow App ID: 3513867552 Tx IDs: 4ZOWYUBJOCIZ45V6HD2OQPTZK2IKOZBTIIXYRXZWNBU7OV37FI6A Confirmed round: 60077523`
**Result**: PASS - Order cancelled, confirmed at round 60077523.

### T4. Market Buy
**Command**: `tools/call create_market_order {"marketAppId":3512808729,"position":1,"price":415000,"quantity":1000000,"isBuying":true,"slippage":50000}`
**Output (first 300 chars)**: `Market order created and matched. Market App ID: 3512808729 Escrow App ID: 3513867926 Position: YES Side: BUY Submitted Price: $0.41 Fill Price: $0.41 Quantity: 1.00 shares Matched: 1.00 shares Tx IDs: WU447BINIQOI6B4DPCWETNLESL52BPGTHGFL4LU3O5IDSTOLBJNA,...`
**Market**: "Will the Heat beat the Raptors?" - bought 1 YES share at $0.41, fully matched.
**Result**: PASS - Market buy executed and matched against existing ask. Confirmed at round 60077529.

### T5. Sell + Balance Delta
**Command**: `tools/call create_market_order {"marketAppId":3512808729,"position":1,"price":395000,"quantity":1000000,"isBuying":false,"slippage":50000}`
**Output (first 300 chars)**: `Market order created and matched. Market App ID: 3512808729 Escrow App ID: 3513868170 Position: YES Side: SELL Submitted Price: $0.40 Fill Price: $0.40 Quantity: 1.00 shares Matched: 1.00 shares Tx IDs: RV2PIXQ54PQX22RNIHQ7U4NJ6U4HFVJMC7S7AJKPLKMAH4R3IELQ,...`
**Balance delta**: Bought at $0.41, sold at $0.40. Net loss ~$0.01 + fees (7% fee base = ~$0.03 each way). Approximate total cost: ~$0.07.
**Result**: PASS - Full round-trip: buy + sell executed and matched. Positions confirmed cleared.

---

## Section 4: Error Handling

### E1. Huge Amount Order
**Command**: `tools/call create_limit_order {"marketAppId":3513835005,"position":1,"price":500000,"quantity":100000000000,"isBuying":true}`
**Output (first 300 chars)**: `Network request error. Received status 400 (Bad Request): TransactionPool.Remember: transaction XPIRB5XA5ZQX3TXV7VAIU6EG2WSZ5SAENICNTW23PXH7L2W777PQ: underflow on subtracting 51750000000 from sender amount 3277574`
**Result**: PASS - Returns structured error with isError:true. Clear message about insufficient funds (underflow). Parseable by agent.

### E2. Invalid Inputs
**Command**: `tools/call create_limit_order {"marketAppId":"not-a-number","position":99,"price":-1,"quantity":0,"isBuying":"maybe"}`
**Output (first 300 chars)**: `MCP error -32602: Input validation error: Invalid arguments for tool create_limit_order: [{"code":"invalid_type","expected":"number","received":"string","path":["marketAppId"],"message":"Expected number, received string"},{"code":"invalid_type","expected":"boolean","re...`
**Result**: PASS - Returns structured Zod validation errors with isError:true, field-level detail (invalid_type for marketAppId, invalid_literal for position=99, invalid_type for isBuying). Excellent error quality.

### E3. Nonexistent Market
**Command**: `tools/call get_market {"marketId":"9999999999"}`
**Output (first 300 chars)**: `Market "9999999999" not found.`
**Result**: PASS - Clear, concise error message. No crash or stack trace.

### E4. Recovery After Error
**Command**: `tools/call get_positions {}` (after E1-E3 errors)
**Output (first 300 chars)**: `No positions found for this wallet.`
**Result**: PASS - Server recovers cleanly. Valid tool call succeeds after multiple error cases.

---
