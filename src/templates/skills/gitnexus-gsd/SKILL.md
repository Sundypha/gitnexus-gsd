---
name: gitnexus-gsd
description: Use GitNexus MCP tools before grep/glob/shell for any codebase exploration task
---

# GitNexus-First Codebase Exploration

> **This is a generic fallback template.** Run `npx gitnexus-gsd init` to generate
> a project-specific version with your actual index names and routing.

**ALWAYS query GitNexus before using Grep, Glob, Shell, or reading arbitrary files.**
This applies to ALL codebase exploration: research, pattern mapping, scout_codebase,
understanding how features work, tracing where data is stored or processed.

## Workflow

1. `gitnexus_query({query: "<concept>", repo: "<your-index>"})` -- execution flows
2. `gitnexus_context({name: "<symbol>", repo: "<your-index>"})` -- 360 degree view
3. `READ gitnexus://repo/<your-index>/clusters` -- functional areas
4. Only fall back to Grep/Glob/Shell/file reads if GitNexus returns 0 results

## When this applies

- "How is X implemented?" -- gitnexus_query first
- "Where is Y stored?" -- gitnexus_query first
- "What calls Z?" -- gitnexus_context first
- Researching a phase -- gitnexus_query the feature area first
- Finding code patterns -- gitnexus_query + gitnexus_context before grep
- scout_codebase (discuss-phase) -- gitnexus_query before .planning/codebase/
- Pattern mapping (plan-phase) -- gitnexus_context before spawning mapper agent

## Index routing

See `.gitnexus-gsd.json` in the project root for index names and path routing,
or run `npx gitnexus-gsd init` to configure them.

## Fallback

Use grep/files only when:
- `gitnexus_query` returns 0 processes
- `gitnexus_impact` returns 0 upstream -- retry once before falling back to grep
- GitNexus index is stale -- run `npx gitnexus analyze`
- MCP server unavailable
