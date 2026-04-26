# gitnexus-gsd

Integrate GitNexus graph intelligence into GSD (Get Shit Done) workflows for Cursor IDE. Instead of relying solely on grep/glob exploration, GSD agents will query the GitNexus knowledge graph first -- getting symbol relationships, execution flows, and functional clusters -- and only fall back to filesystem exploration when GitNexus returns no results or is unavailable.

## Prerequisites

- [GitNexus](https://github.com/nickarza/gitnexus) MCP server configured in Cursor
- Your project indexed with `npx gitnexus analyze`
- [GSD](https://github.com/coleam00/get-shit-done) installed (`.planning/` directory present)

## Install

```bash
npx gitnexus-gsd init
```

Run this in your project root. It installs a `.cursor/rules/gitnexus-gsd-integration.mdc` file with detailed per-workflow instructions, and patches `AGENTS.md` / `CLAUDE.md` with a summary block.

That's it. No global settings to configure, no SQLite to touch.

## How It Works

`init` adds a project rule (`.cursor/rules/gitnexus-gsd-integration.mdc`) with `alwaysApply: true`. This means every agent working in the project -- including GSD subagents like `gsd-phase-researcher`, `gsd-pattern-mapper`, and `gsd-codebase-mapper` -- receives the GitNexus-first instruction automatically.

The rule is version-controlled, survives `gsd-update`, and works identically on Windows, Mac, and Linux.

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
npx gitnexus-gsd init         Install project-level .mdc rule and patch AGENTS.md/CLAUDE.md
npx gitnexus-gsd uninstall    Remove project-level files and patch blocks
npx gitnexus-gsd help         Show available commands
```

## Uninstall

```bash
npx gitnexus-gsd uninstall
```

Removes `.cursor/rules/gitnexus-gsd-integration.mdc` and the `<!-- gitnexus-gsd:start -->` blocks from `AGENTS.md` and `CLAUDE.md`.

## License

MIT
