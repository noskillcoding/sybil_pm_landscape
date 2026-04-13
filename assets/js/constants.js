// assets/js/constants.js

export const TOOL_COL_MAP = {
  'API': 'devTools', 'SDK': 'devTools', 'WebSocket': 'devTools',
  'CLI': 'cliMcp', 'MCP': 'cliMcp',
  'Skill': 'skill',
  'Framework': 'framework'
};

export const TEST_COLS = [
  { key: 'devTools', label: 'Dev Tools' },
  { key: 'cliMcp', label: 'CLI / MCP' },
  { key: 'skill', label: 'Skill' },
  { key: 'framework', label: 'Framework' }
];

// Tool test checklist dimensions (for rendering detail rows)
export const TOOL_STAGES = [
  { id: '1_setup', label: 'Setup', desc: 'Install, auth, balance' },
  { id: '2_discovery', label: 'Discovery', desc: 'List, get, orderbook, search' },
  { id: '3_trade', label: 'Trade', desc: 'Preview, order, cancel, buy' },
  { id: '4_lifecycle', label: 'Lifecycle', desc: 'Sell, claim, final balance' }
];

// === UNIFIED TEST CHECKS ===
export const UNIFIED_CHECKS = {
  setup: [
    { id:'S1', name:'Install + version', why:'Tool installs and runs. Version number confirmed.' },
    { id:'S2', name:'Help / commands',   why:'Available commands listed with descriptions. JSON output flag exists.' },
    { id:'S3', name:'Auth',              why:'Authentication succeeds. Subsequent commands work.' },
    { id:'S4', name:'Balance',           why:'Returns structured balance data showing available funds.' }
  ],
  discovery: [
    { id:'D1', name:'List markets',        why:'Structured list of active markets with IDs, titles, prices.' },
    { id:'D2', name:'Market detail',       why:'Single market with outcomes, prices, volume.' },
    { id:'D3', name:'Orderbook quality',   why:'5+ levels/side, monotonic prices, bid < ask.' },
    { id:'D4', name:'Search',              why:'Keyword search returns relevant results.' },
    { id:'D5', name:'Schema consistency',  why:'3 different markets return same required fields.' }
  ],
  trading: [
    { id:'T1', name:'Preview / dry-run',       why:'Cost estimate before execution (shares, fees).' },
    { id:'T2', name:'Limit order + verify',    why:'Order placed, confirmed open in order list.' },
    { id:'T3', name:'Cancel + verify',         why:'Order cancelled, absent from open orders.' },
    { id:'T4', name:'Market buy + position',   why:'~$1 buy fills, position visible with shares.' },
    { id:'T5', name:'Sell + balance delta',    why:'Position closed, balance delta ≤5%.' }
  ],
  errors: [
    { id:'E1', name:'Insufficient balance', why:'100x order returns structured error, not silent failure.' },
    { id:'E2', name:'Invalid inputs',       why:'3 boundary tests return parseable errors.' },
    { id:'E3', name:'Resolved market',      why:'Clear error for closed/resolved market.' },
    { id:'E4', name:'Error recovery',       why:'Tool recovers from bad request, no state corruption.' }
  ]
};
export const UNIFIED_SECTIONS = ['setup','discovery','trading','errors'];

// === SKILL TEST MILESTONES ===
export const SKILL_MILESTONES = [
  { id:'M1', name:'Understand skill & auth',  why:'Agent reads skill, identifies capabilities, auth method, SDKs, and API endpoints.' },
  { id:'M2', name:'Authenticate',             why:"Follow skill's auth instructions. Verify with an API call." },
  { id:'M3', name:'List markets',             why:'Find 3+ active markets with IDs and titles.' },
  { id:'M4', name:'Market detail + prices',   why:'Get outcomes, probabilities, orderbook for a liquid market.' },
  { id:'M5', name:'Buy order (~$1)',          why:'Place and confirm a buy order following skill instructions.' },
  { id:'M6', name:'Verify position',          why:'Confirm position exists with correct market and shares.' },
  { id:'M7', name:'Sell / close position',    why:'Exit the position. Note if pari-mutuel (no pre-resolution exit).' },
  { id:'M8', name:'Balance delta',            why:'Compare final balance to pre-trade. Delta should be small (spread + fees).' }
];
export const UNIFIED_SECTION_LABELS = {setup:'Setup',discovery:'Discovery',trading:'Trading',errors:'Error Handling'};

// === AGENT ACCESSIBILITY ===
export const AA_DIMS = [
  { key: 'discovery', label: 'Discovery', checks: [
    { id: '1.1', label: '/llms.txt',             why: 'Standard file that helps LLMs understand what the site is and where to find docs. 700+ sites have adopted it.' },
    { id: '1.2', label: 'Markdown negotiation',  why: 'When agent sends Accept: text/markdown, server returns clean markdown instead of HTML. Best agent onboarding path.' },
    { id: '1.3', label: 'Structured metadata',   why: 'Meta description or JSON-LD that tells an agent what the PM does, without parsing the full page.' }
  ]},
  { key: 'crawlability', label: 'Crawlability', checks: [
    { id: '2.1', label: 'Content without JS',  why: 'Can an agent read the page with a simple fetch? Fails if the HTML body is empty and needs JavaScript to render.' },
    { id: '2.2', label: 'Semantic HTML',       why: 'Uses <nav>, <main>, <article> etc. so agents can understand page structure, not just a wall of <div>s.' },
    { id: '2.3', label: 'Readable URLs',       why: 'Market URLs like /markets/us-election vs opaque /markets/0x87c2a. Readable slugs let agents understand content from the URL alone.' },
    { id: '2.4', label: 'Sitemap',             why: 'XML sitemap helps agents discover all pages without crawling. Lists markets, docs, key content.' },
    { id: '2.5', label: 'Proper 404s',         why: 'Unknown URLs return HTTP 404, not 200 with an empty app shell. Agents need real status codes to navigate.' }
  ]},
  { key: 'docs', label: 'Documentation', checks: [
    { id: '3.1', label: 'Developer docs exist',   why: 'Any developer documentation at all — API guides, SDK references, integration docs.' },
    { id: '3.2', label: 'Docs findable',          why: 'An agent can find docs from the main site (linked in nav/footer). Fails if docs are only discoverable via Google.' },
    { id: '3.3', label: 'Programmatic surface',   why: 'Docs describe APIs, SDKs, or tools that exist — endpoints, methods, or install commands. Not just conceptual protocol docs.' },
    { id: '3.4', label: 'Standard navigation',    why: 'Homepage uses standard <a href> links, not JS-only routing. Agent can follow links without executing JavaScript.' }
  ]},
  { key: 'access', label: 'Access', checks: [
    { id: '4.1', label: 'robots.txt allows AI crawlers', why: "robots.txt doesn't block ClaudeBot, GPTBot, PerplexityBot etc. Some sites explicitly block all AI crawlers." },
    { id: '4.2', label: 'No CAPTCHA',                    why: 'No Cloudflare challenge, hCaptcha, or reCAPTCHA blocking automated access to public pages.' },
    { id: '4.3', label: 'Bot policy / agent docs',       why: 'Site or docs have explicit bot policy, agent quickstart, or tool integration docs. Concrete — not just "AI" in marketing copy.' }
  ]}
];
export const AA_TOTAL_CHECKS = AA_DIMS.reduce((s, d) => s + d.checks.length, 0); // 15

// === FRAMEWORK ASSESSMENT (for methodology panel) ===
export const FRAMEWORK_CATEGORIES = [
  { num:'1', name:'Type',              why:'What the framework actually is: autonomous trading bot, forecasting SDK, agent platform, reference architecture, or plugin.' },
  { num:'2', name:'Architecture',      why:'Components and data flow — e.g., RAG pipeline → LLM forecaster → on-chain execution.' },
  { num:'3', name:'Stack',             why:'Language, LLM providers, key dependencies and their versions.' },
  { num:'4', name:'Platform support',  why:'Which prediction markets and chains the framework targets.' },
  { num:'5', name:'Setup complexity',  why:'What it takes to get an agent running: install, config, API keys, wallet funding.' }
];
export const FRAMEWORK_MATURITY = [
  { grade:'Production',   why:'Actively maintained, documented, real agents using it in production.' },
  { grade:'Usable',       why:'Works but has gaps — thin docs, limited adoption, or stale dependencies.' },
  { grade:'Experimental', why:'Proof of concept, abandoned, or not actually a framework.' },
  { grade:'N/A',          why:"Doesn't fit the category (platform feature, not a framework)." }
];
