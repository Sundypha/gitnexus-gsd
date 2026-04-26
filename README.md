# gitnexus-gsd

Integrate GitNexus graph intelligence into GSD (Get Shit Done) workflows for Cursor IDE. Instead of relying solely on grep/glob exploration, GSD agents will query the GitNexus knowledge graph first -- getting symbol relationships, execution flows, and functional clusters -- and only fall back to filesystem exploration when GitNexus returns no results or is unavailable.

## Prerequisites

- [GitNexus](https://github.com/nickarza/gitnexus) MCP server configured in Cursor
- Your project indexed with `npx gitnexus analyze`
- [GSD](https://github.com/coleam00/get-shit-done) installed (`.planning/` directory present)

## Quick Start

### 1. Add the User Rule (global, all projects)

```bash
npx gitnexus-gsd
```

Copy the output text and paste it into **Cursor Settings > General > Rules for AI**.

This gives every GSD session across all your projects the instruction to prefer GitNexus.

### 2. Add Per-Project Rules (optional, recommended)

```bash
npx gitnexus-gsd init
```

This writes a `.cursor/rules/gitnexus-gsd-integration.mdc` project rule with detailed per-workflow instructions, and patches `AGENTS.md` / `CLAUDE.md` with a summary block.

## How It Works

The package uses a two-layer approach:

**User Rule (global)** -- A compact rule pasted into Cursor Settings that tells any GSD agent to try GitNexus MCP tools before grep/glob. Works across all projects without any project-level files.

**Project Rule (local)** -- An `.mdc` file with detailed instructions for each GSD workflow step (scout_codebase, pattern mapping, map-codebase, scan). Provides the agent with exact tool calls and fallback logic per workflow.

Both layers are additive. The User Rule ensures GitNexus is tried first even in projects without `init`. The Project Rule gives agents precise, step-by-step guidance for each GSD workflow.

## GSD Workflows Affected

| Workflow | What Changes |
|---|---|
| **scout_codebase** (discuss-phase) | Queries GitNexus for execution flows and symbol context before reading `.planning/codebase/*.md` |
| **Pattern mapping** (plan-phase step 7.8) | Uses `gitnexus_context` and `gitnexus_query` to find analog patterns; skips the mapper agent if coverage is sufficient |
| **map-codebase** | Seeds mapper agents with cluster data from `gitnexus://repo/{name}/clusters` |
| **scan** | Same as map-codebase -- graph data first, filesystem exploration second |
| **research-phase** | Uses GitNexus query to understand feature areas before exploring files |

## Fallback Behavior

GitNexus is skipped and the default GSD approach is used when:

- `gitnexus_query` returns 0 results
- GitNexus warns the index is stale (fix: `npx gitnexus analyze`)
- The MCP server is unavailable

## Commands

```
npx gitnexus-gsd              Print the User Rule text with paste instructions
npx gitnexus-gsd user-rule    Same as above
npx gitnexus-gsd init         Install project-level .mdc rule and patch AGENTS.md/CLAUDE.md
npx gitnexus-gsd uninstall    Remove project-level files and patch blocks
npx gitnexus-gsd help         Show available commands
```

## Uninstall

```bash
npx gitnexus-gsd uninstall
```

This removes the `.cursor/rules/gitnexus-gsd-integration.mdc` file and the `<!-- gitnexus-gsd:start -->` blocks from `AGENTS.md` and `CLAUDE.md`. You will need to manually remove the User Rule from Cursor Settings.

## License

MIT
