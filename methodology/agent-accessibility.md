# Agent Accessibility Checklist v3

> How easily can an AI agent discover, read, and understand this PM's website?

## Reachability (separate flag, not scored)

| Status | Meaning |
|--------|---------|
| `open` | Homepage returns 200 with content on simple fetch |
| `cf-blocked` | Cloudflare managed challenge blocks non-browser access |
| `waf-blocked` | AWS WAF or other bot protection blocks access |

If blocked: test quality via Playwright (browser), note reachability separately.

## Checks (15 total, each 1 point)

### 1. Discovery (3)

| # | Check | Procedure |
|---|-------|-----------|
| 1.1 | /llms.txt | Fetch `{domain}/llms.txt` AND `docs.{domain}/llms.txt`. Pass if EITHER returns markdown starting with `#`. |
| 1.2 | Markdown negotiation | Fetch homepage with `Accept: text/markdown`. Pass if markdown returned. |
| 1.3 | Structured metadata | Homepage has `<meta name="description">` or JSON-LD that explains what the PM does. Use Playwright snapshot if CF-blocked. |

### 2. Crawlability (5)

| # | Check | Procedure |
|---|-------|-----------|
| 2.1 | Content without JS | Fetch homepage with curl. Pass if real text (nav, markets, descriptions) in HTML. If CF-blocked, note "Requires browser" but test via Playwright too. |
| 2.2 | Semantic HTML | Rendered HTML has `<nav>`, `<main>`, `<article>`, `<header>`, `<footer>`. Pass if 3+ present. Use Playwright for CF sites. |
| 2.3 | Readable URL slugs | Market pages use `/markets/us-election` not `/markets/0x87c2a`. |
| 2.4 | Sitemap.xml | `/sitemap.xml` returns valid XML. |
| 2.5 | Proper 404s | `/this-does-not-exist-xyz123` returns HTTP 404, not 200/403. Use Playwright for CF sites. |

### 3. Documentation (4)

| # | Check | Procedure |
|---|-------|-----------|
| 3.1 | Dev docs exist | Check `/docs`, `docs.{domain}`, `dev.{domain}`, `developer.{domain}`. |
| 3.2 | Docs findable | From homepage, docs reachable within 2 clicks (nav → page → docs link). Use Playwright snapshot. |
| 3.3 | Programmatic surface documented | Docs describe APIs/SDKs/tools — endpoints, methods, install commands. Not just protocol concepts. |
| 3.4 | Standard navigation (a href) | Homepage uses `<a href>` links for nav, not JS-only routing. Agent can follow links without JS. |

### 4. Access (3)

| # | Check | Procedure |
|---|-------|-----------|
| 4.1 | AI crawlers allowed | `/robots.txt` doesn't block ClaudeBot, GPTBot, PerplexityBot, etc. No robots.txt = pass. |
| 4.2 | No CAPTCHA | No Cloudflare challenge, hCaptcha, reCAPTCHA on public pages. CF managed challenge = fail. |
| 4.3 | Bot policy or agent docs | Concrete: bot/agent policy, agent quickstart, MCP/tool docs, or dedicated agent section. Not just "AI" in marketing. |

## Grading

| Grade | Score | Label |
|-------|-------|-------|
| A | 13-15 | Agent-ready |
| B | 10-12 | Agent-friendly |
| C | 7-9 | Agent-tolerable |
| D | 4-6 | Agent-hostile |
| F | 0-3 | Agent-opaque |

## Testing Note

Tests use fetch/curl by default. Sites behind Cloudflare managed challenges return 403 and are also tested via Playwright (browser automation) to assess actual content quality. Reachability status is shown separately from the quality score.
