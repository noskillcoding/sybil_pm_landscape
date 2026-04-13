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
    { id:'S1', name:'Install + version' },
    { id:'S2', name:'Help / commands' },
    { id:'S3', name:'Auth' },
    { id:'S4', name:'Balance' }
  ],
  discovery: [
    { id:'D1', name:'List markets' },
    { id:'D2', name:'Market detail' },
    { id:'D3', name:'Orderbook quality' },
    { id:'D4', name:'Search' },
    { id:'D5', name:'Schema consistency' }
  ],
  trading: [
    { id:'T1', name:'Preview / dry-run' },
    { id:'T2', name:'Limit order + verify' },
    { id:'T3', name:'Cancel + verify' },
    { id:'T4', name:'Market buy + position' },
    { id:'T5', name:'Sell + balance delta' }
  ],
  errors: [
    { id:'E1', name:'Insufficient balance' },
    { id:'E2', name:'Invalid inputs' },
    { id:'E3', name:'Resolved market' },
    { id:'E4', name:'Error recovery' }
  ]
};
export const UNIFIED_SECTIONS = ['setup','discovery','trading','errors'];

// === SKILL TEST MILESTONES ===
export const SKILL_MILESTONES = [
  { id:'M1', name:'Understand skill & auth' },
  { id:'M2', name:'Authenticate' },
  { id:'M3', name:'List markets' },
  { id:'M4', name:'Market detail + prices' },
  { id:'M5', name:'Buy order (~$1)' },
  { id:'M6', name:'Verify position' },
  { id:'M7', name:'Sell / close position' },
  { id:'M8', name:'Balance delta' }
];
export const UNIFIED_SECTION_LABELS = {setup:'Setup',discovery:'Discovery',trading:'Trading',errors:'Error Handling'};

// === AGENT ACCESSIBILITY ===
export const AA_DIMS = [
  { key: 'discovery', label: 'Discovery', checks: [
    { id: '1.1', label: '/llms.txt' },
    { id: '1.2', label: 'Markdown negotiation' },
    { id: '1.3', label: 'Structured metadata' }
  ]},
  { key: 'crawlability', label: 'Crawlability', checks: [
    { id: '2.1', label: 'Content without JS' },
    { id: '2.2', label: 'Semantic HTML' },
    { id: '2.3', label: 'Readable URLs' },
    { id: '2.4', label: 'Sitemap' },
    { id: '2.5', label: 'Proper 404s' }
  ]},
  { key: 'docs', label: 'Documentation', checks: [
    { id: '3.1', label: 'Developer docs exist' },
    { id: '3.2', label: 'Docs findable' },
    { id: '3.3', label: 'Programmatic surface' },
    { id: '3.4', label: 'Standard navigation' }
  ]},
  { key: 'access', label: 'Access', checks: [
    { id: '4.1', label: 'robots.txt allows AI crawlers' },
    { id: '4.2', label: 'No CAPTCHA' },
    { id: '4.3', label: 'Bot policy / agent docs' }
  ]}
];
export const AA_TOTAL_CHECKS = AA_DIMS.reduce((s, d) => s + d.checks.length, 0); // 15
