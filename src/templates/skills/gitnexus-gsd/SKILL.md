---
name: gitnexus-gsd
description: Use GitNexus MCP tools before grep/glob/shell for any codebase exploration task
---

# GitNexus-First Codebase Exploration

**ALWAYS query GitNexus before using Grep, Glob, Shell, or reading arbitrary files.**
This applies to ALL codebase exploration: research, pattern mapping, scout_codebase,
understanding how features work, tracing where data is stored or processed.

## Workflow

1. `gitnexus_query({query: "<concept>"})` — find execution flows related to the topic
2. `gitnexus_context({name: "<symbol>"})` — 360° view of any key symbol returned
3. `READ gitnexus://repo/{name}/clusters` — discover functional areas
4. Only fall back to Grep/Glob/Shell/file reads if GitNexus returns 0 results

## When this applies

- "How is X implemented?" → gitnexus_query first
- "Where is Y stored?" → gitnexus_query first
- "What calls Z?" → gitnexus_context first
- Researching a phase → gitnexus_query the feature area first
- Finding code patterns → gitnexus_query + gitnexus_context before grep
- scout_codebase (discuss-phase) → gitnexus_query before .planning/codebase/
- Pattern mapping (plan-phase 7.8) → gitnexus_context before spawning mapper agent

## Fallback

Use grep/files only when:
- `gitnexus_query` returns 0 processes
- GitNexus index is stale → run `npx gitnexus analyze`
- MCP server unavailable
