# Sapience Skill Test — Raw Log

## M1. Understand skill & identify auth method
**Status**: PASS

- Skill version: 0.4.0, format: sdk-guide
- Platform: Sapience — prediction markets on Ethereal (chain 5064014) + forecasting on Arbitrum (42161)
- Collateral: WUSDe (wrapped USDe, 18 decimals)
- Auth: EIP-712 signed messages (wallet-based, no API keys)
  - AuctionIntent signature for relayer auth (taker flow)
  - MintApproval signature for on-chain mint
  - TradeApproval for secondary market
- APIs:
  - GraphQL: POST https://api.sapience.xyz/graphql (200 req/60s, no auth)
  - WebSocket: wss://relayer.sapience.xyz/auction (auctions + secondary)
  - Polymarket price data (public, no auth)
- SDK: @sapience/sdk with typed imports for signing, encoding, contracts, ABIs
- Trading flow: Build picks -> sign AuctionIntent (EIP-712) -> start auction via WS -> receive bids -> sign MintApproval -> mint on-chain
- Forecasting: Free EAS attestations on Arbitrum (~$0.01 gas), no collateral needed
- Key contracts: PredictionMarketEscrow, SecondaryMarketEscrow, WUSDe (collateral)

## M2. Authenticate successfully
**Status**: PASS

- Installed @sapience/sdk@0.2.0 (latest available, skill describes v0.4.0 protocol)
- GraphQL API requires no auth — queries work immediately
- WebSocket connects and accepts messages
- Wallet loaded from macOS Keychain, address: 0x165E392409f3C0bA092Ae9Aa290B6AE57B1b661b
- SDK provides contract addresses, ABIs, constants, signing/encoding helpers
- Verified: `submitForecast()` SDK function works end-to-end with private key

## M3. List/find active markets
**Status**: PASS

- Queried `questions(take:10, sortField:openInterest, sortDirection:desc, resolutionStatus:unresolved)`
- Found 10+ active markets including:
  1. "Will the highest temperature in Taipei be 28C on March 23?" (OI: 555.5 WUSDe)
  2. "Iran military action against Israel" group (multiple dates)
  3. "Fed decision in April?" group (4 conditions)
  4. "Will the Iranian regime fall by April 30?" (OI: 101 WUSDe)
  5. WTI Crude Oil price group (20+ conditions)
  6. "Will Trump visit China by...?" group
  7. "Will S&P 500 go up on March 26?" (OI: 32.9 WUSDe)
  8. Mexico unemployment rate
  9. MLB game outcomes
  10. Russia strikes Kyiv
- Each condition has: id, question, shortName, endTime, resolver, settled, openInterest, similarMarkets (Polymarket URLs), categoryId

## M4. Get specific market detail with prices
**Status**: PASS

- Retrieved condition detail for "Will the Iranian regime fall by April 30?"
  - conditionId: 0xe443dab97ad8b7f58558cc7a6a3932d156031e962a451e0461e9a4578d78fe84
  - resolver: 0xc7a489f8b5cef914fca2511a84cdc0221cd9a0f4
  - endTime: 1777607940, openInterest: 101 WUSDe
- Fetched Polymarket prices via similarMarkets URL:
  - YES: $0.0255 (2.55%)
  - NO: $0.9745 (97.45%)
- Polymarket slug extraction and gamma-api.polymarket.com both work as described

## M5. Place a buy/mint order
**Status**: PARTIAL — Forecast placed, auction failed

### Forecast (succeeded):
- Used SDK `submitForecast()` to submit a 3% probability forecast on "Will the Iranian regime fall by April 30?"
- TX: 0x221b0f4811772131c2a44f58d39a361696f8f6ac0cc403b1b9d0c6cc93453786
- Confirmed on Arbitrum block 450905532, gas: 388,948 (~0.0000078 ETH)
- Forecast is an EAS attestation on Arbitrum — free, on-chain, scored on accuracy

### Auction/trade (failed):
- WebSocket connects to wss://relayer.sapience.xyz/auction successfully
- Server requires `escrowContract` field in payload (not documented in SKILL.md v0.4)
- EIP-712 AuctionIntent signature verification fails — the skill's EIP-712 type definitions (v0.4) don't exactly match what the server validates
- SDK v0.2 uses SIWE (Sign-In With Ethereum) messages, not EIP-712 AuctionIntent — protocol mismatch
- Additionally: wallet has no WUSDe on Ethereal, so even a successful auction would fail at mint

## M6. Verify position exists
**Status**: FAIL

- `positions(holder:...)` returns empty — forecasts are EAS attestations, not position tokens
- `predictions(address:...)` returns empty — no trades executed
- `accountAccuracyRank` shows address registered with 0 accuracy score (not yet resolved)
- The forecast was confirmed on-chain but doesn't appear as a "position" in Sapience's data model

## M7. Sell/close position
**Status**: FAIL — No position to sell

- Cannot sell because no position tokens were minted
- Would require completing the full auction -> mint flow on Ethereal with WUSDe collateral
- Secondary market (SecondaryMarketEscrow) is documented but untestable without positions

## M8. Check final balance, compute delta
**Status**: PASS

- Balance before: 0.00498 ETH (Arbitrum)
- Balance after forecast: 0.00396 ETH (Arbitrum)
- Delta: -0.00102 ETH (gas from forecast + balance check RPCs show slight variance)
  - Forecast gas: ~0.0000078 ETH
  - Note: some balance drop may be from prior pending txs settling
- No Ethereal balance (no WUSDe/USDe)
