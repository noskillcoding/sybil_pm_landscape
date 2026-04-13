# Prediction Markets Landscape

Interactive dashboard tracking 29 prediction markets and their AI agent tooling. Evaluates how accessible each PM is to autonomous trading agents across four dimensions.

**Live:** _(deployment URL pending — run locally with `python3 -m http.server 8765` from the repo root)_

## Testing Categories

### 1. Agent Accessibility (15 checks)
Can an AI agent discover, read, and understand this PM's website without a browser?
- 15 checks across 4 dimensions: Discovery, Crawlability, Documentation, Access
- [Methodology](methodology/agent-accessibility.md)

### 2. CLI/MCP Test (18 checks)
Can an AI agent use this CLI/MCP tool to trade autonomously?
- 18 checks across 4 sections: Setup, Discovery, Trading, Error Handling
- [Methodology](methodology/cli-mcp-test.md) | [Template](templates/cli-mcp/)

### 3. Skill Test (8 milestones)
Can an AI agent complete a full trade cycle using only a SKILL.md file and wallet credentials?
- 8 milestones from reading docs through round-trip trading
- [Methodology](methodology/skill-test.md) | [Template](templates/skill/)

### 4. Framework Assessment (5 categories)
How mature is this agentic framework for building autonomous PM agents?
- 5 categories rated on a maturity scale (Production / Usable / Experimental / N/A)
- [Methodology](methodology/framework-assessment.md)

## Structure

```
├── index.html                 # Dashboard (all data embedded)
├── methodology/               # Testing approaches
├── templates/                 # Subagent instruction templates
│   ├── cli-mcp/               # CLI/MCP test template
│   └── skill/                 # Skill test template
└── results/                   # Raw test outputs
    ├── agent-accessibility/   # 22 PM accessibility scores
    ├── cli-mcp/               # 8 tool test results
    └── skill/                 # 5 skill test results
```

## Deployment

Hosted on Vercel as a static site.

```bash
# Deploy to production
npx vercel deploy --prod
```

## Coverage

| Category | Tested | Total |
|----------|--------|-------|
| Agent Accessibility | 22 | 22 |
| CLI/MCP Tests | 8 | — |
| Skill Tests | 5 | — |
| Framework Assessments | 6 | — |
