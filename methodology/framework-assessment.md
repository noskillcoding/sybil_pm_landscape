# Framework Assessment

## What We're Assessing

How mature and useful is this agentic framework for building autonomous prediction market agents?

Frameworks are fundamentally different from CLIs, MCPs, and Skills. They're systems that make decisions and execute — not tools you call. This assessment is research-based, not automated testing.

## Categories (5)

| # | Category | What it covers |
|---|----------|---------------|
| 1 | Type | What the framework actually is: autonomous trading bot, forecasting SDK, agent platform, reference architecture, or plugin |
| 2 | Architecture | Components and data flow — e.g., RAG pipeline → LLM forecaster → on-chain execution |
| 3 | Stack | Language, LLM providers, key dependencies and their versions |
| 4 | Platform support | Which prediction markets and chains the framework targets |
| 5 | Setup complexity | What it takes to get an agent running: install, config, API keys, wallet funding |

## Maturity Scale

| Rating | Meaning |
|--------|---------|
| Production | Actively maintained, documented, real agents using it in production |
| Usable | Works but has gaps — thin docs, limited adoption, or stale dependencies |
| Experimental | Proof of concept, abandoned, or not actually a framework |
| N/A | Doesn't fit the category (platform feature, not a framework) |

## Method

Each framework reviewed by examining:
- Source code on GitHub
- Documentation quality and accuracy
- npm/PyPI package metadata (versions, downloads, last update)
- GitHub activity (commit frequency, open issues, maintainer responsiveness)
- Architecture and design patterns

No automated test suite — the rating reflects expert assessment of whether a developer would realistically use this framework to build a PM trading agent today.
