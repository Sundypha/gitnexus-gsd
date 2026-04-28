# gitnexus-gsd

Integrate GitNexus graph intelligence into GSD (Get Shit Done) workflows for Cursor IDE. Instead of relying solely on grep/glob exploration, GSD agents will query the GitNexus knowledge graph first — symbol relationships, execution flows, and functional clusters — and only fall back to filesystem exploration when GitNexus returns no results or is unavailable.

## Prerequisites

- [GitNexus](https://github.com/nickarza/gitnexus) MCP server configured in Cursor
- Your project indexed with `npx gitnexus analyze`
- [GSD](https://github.com/coleam00/get-shit-done) installed (`.planning/` directory present)

## Install (project)

```bash
npx gitnexus-gsd init
```

Run in your **project root**. It interactively asks for your GitNexus index names and scopes (auto-detecting from `.gitnexus/` where possible), then writes:

- `.gitnexus-gsd.json` — index config (source of truth)
- `.cursor/rules/gitnexus-gsd-integration.mdc` — generated with your index names
- `.cursor/skills/gitnexus-gsd/SKILL.md` — generated with your index names
- Patches `AGENTS.md` / `CLAUDE.md` between `<!-- gitnexus-gsd:start -->` … `<!-- gitnexus-gsd:end -->`
- Populates `agent_skills` in `.planning/config.json` so GSD subagents receive the skill directly in their Task prompts

The rule uses `alwaysApply: true`, so it applies to every agent in that workspace (including GSD subagents). **It survives `gsd-update`** because it lives in your repo, not under `~/.cursor/get-shit-done/`.

If you add or rename indexes later, edit `.gitnexus-gsd.json` and run:

```bash
npx gitnexus-gsd regenerate
```

## Global GSD skills (`gsd-update` overwrites)

Shipped GSD skills under `~/.cursor/skills/` are replaced when you run **`/gsd-update`**. Optional hints for those skills are **not** part of `init` — re-apply them after an update:

```bash
npx gitnexus-gsd patch-gsd-skills
```

Optional: set `CURSOR_SKILLS_DIR` if your skills live elsewhere. Append more skill folder names (comma-separated): `GITNEXUS_GSD_PATCH_SKILLS=gsd-foo,gsd-bar npx gitnexus-gsd patch-gsd-skills`.

### Why patch global skills at all?

`AGENTS.md` and project `.mdc` rules are ideal for **repo-local** behavior, but a GSD command is often a **thin dispatch** skill: the model sees mostly `SKILL.md` plus a workflow path. That body can load **without** the same weight as `alwaysApply` rules in every turn. A one-line reminder **after** `</cursor_skill_adapter>` keeps “open the workspace GitNexus doc and use MCP before grep” in the same bundle as the command the user invoked. The text is **workspace-gated** (only act if the repo documents GitNexus), so other projects are unaffected.

`patch-gsd-skills` targets every GSD skill whose workflow **routinely touches the codebase or code-shaped artifacts** (discuss/plan/spec/research/execute, ship/undo/PR branch, verify/validate, audits, map/scan/intel, UI, eval, security, reviews, spikes/sketches, ingest/import, inbox, forensics, pause/resume, `gsd-do` router, etc.). The canonical list is **`CODEBASE_GSD_SKILLS`** in `src/commands/patch-gsd-skills.js` (~55 entries); pure-meta skills (help, settings, stats, …) are intentionally omitted.

If you had deeper edits to global GSD files, use **`/gsd-reapply-patches`** (three-way merge from `gsd-local-patches/`) in addition to or instead of `patch-gsd-skills`.

## How it works

- **Project rule** — primary mechanism; survives GSD updates; safe to commit.
- **`patch-gsd-skills`** — thin reminder in global skills so code-review / security flows still see “check workspace GitNexus doc” when the skill body is the main context.

## Monorepo / multi-index setup

GitNexus works best with one index per language root. For monorepos, create separate
indexes per root (e.g. `backend/`, `frontend/`) and run `init` with multiple entries.
`init` will ask you to name each index and map it to a directory scope. The generated
`.mdc` rule and `SKILL.md` will include a routing table so agents pick the right `repo`
parameter automatically.

## GSD workflows covered (template)

Includes discuss/plan/execute/verify, **code review**, **code-review-fix**, **secure-phase**, eval/UI/integration audits, map-codebase, scan, and more — see the `.mdc` template for the full list and MCP `repo` routing rules.

## Fallback behavior

Use the default GSD / filesystem approach when:

- `gitnexus_query` returns 0 results
- GitNexus reports a stale index (`npx gitnexus analyze`, or your project’s backend reindex script if documented)
- The MCP server is unavailable

## Commands

```
npx gitnexus-gsd init               Configure indexes and install all project files
npx gitnexus-gsd regenerate         Regenerate files from existing .gitnexus-gsd.json
npx gitnexus-gsd uninstall          Remove all project files
npx gitnexus-gsd patch-gsd-skills   Insert GitNexus hint into global GSD skills (after gsd-update)
npx gitnexus-gsd help               Show help
```

## Uninstall

```bash
npx gitnexus-gsd uninstall
```

Removes `.gitnexus-gsd.json`, `.cursor/rules/gitnexus-gsd-integration.mdc`, `.cursor/skills/gitnexus-gsd/SKILL.md`, the `<!-- gitnexus-gsd:start -->` blocks from `AGENTS.md` / `CLAUDE.md`, and the `agent_skills` entries from `.planning/config.json`. It does **not** remove snippets from `~/.cursor/skills/` (remove those manually if desired).

## License

MIT
