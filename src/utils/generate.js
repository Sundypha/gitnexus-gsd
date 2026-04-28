'use strict';

/**
 * Generate project-specific content from .gitnexus-gsd.json config.
 * All functions are pure: they return strings and do no file I/O.
 */

const { isMonorepo } = require('./config');

/**
 * Build the Cursor .mdc rule content from config.
 *
 * Single-index: simple "use repo: X" guidance, no routing table.
 * Multi-index: full routing table mapping paths to index names.
 *
 * @param {{ version: string, indexes: Array<{ name: string, path: string, detectChanges?: boolean }> }} config
 * @returns {string}
 */
function generateMdcRule(config) {
  const { indexes } = config;
  const primary = indexes[0];
  const detectChangesIndex = indexes.find((i) => i.detectChanges) || primary;

  if (!isMonorepo(config)) {
    return `---
description: Use GitNexus graph intelligence before grep or file exploration for any codebase question or GSD workflow
alwaysApply: true
---

# GitNexus-First Codebase Exploration

For ANY question about how the codebase works -- how a feature is implemented,
where something is stored, how data flows, what calls what -- query GitNexus
before reaching for Grep, Glob, or Shell. Fall back to filesystem exploration
only when GitNexus returns no results or is unavailable.

**Use \`repo: "${primary.name}"\` for all \`gitnexus_query\`, \`gitnexus_context\`,
\`gitnexus_impact\`, and \`gitnexus_detect_changes\` calls.**

## Priority: GitNexus > .planning/codebase/ > grep/glob/shell

## All GSD workflows (mandatory)

Applies to **every** GSD command, orchestrator step, and subagent that inspects
application code -- including discuss-phase, plan-phase, execute-phase (\`gsd-executor\`),
verify-work (\`gsd-verifier\`), code review (\`gsd-code-review\` / \`gsd-code-reviewer\`),
code-review-fix (\`gsd-code-fixer\`), secure-phase (\`gsd-security-auditor\`),
eval-review, validate-phase, audit-fix, audit-milestone, audit-uat, map-codebase,
scan, intel, add-tests, autonomous waves, and any workflow that builds call graphs
or answers "what calls this?" / "what breaks if...?".

1. **Before** relying on Grep/Glob/shell for import trees, callers, callees,
   execution flows, or blast radius: use \`gitnexus_query\`, \`gitnexus_context\`,
   and/or \`gitnexus_impact\` with \`repo: "${primary.name}"\`.
2. **\`gitnexus_detect_changes\`**: use \`repo: "${detectChangesIndex.name}"\` (git-aware).

## General codebase questions

1. \`gitnexus_query({query: "<concept>", repo: "${primary.name}"})\`
2. \`gitnexus_context({name: "<symbol>", repo: "${primary.name}"})\` for returned symbols
3. Read source files only to confirm implementation details
4. Fall back to Grep/Glob/Shell only if GitNexus returns 0 results

## Fallback triggers

Use filesystem exploration when:
- \`gitnexus_query\` returns 0 processes
- \`gitnexus_impact\` returns 0 upstream -- retry once before falling back to grep
- GitNexus warns index is stale (run \`npx gitnexus analyze\`)
- MCP server is unavailable
`;
  }

  // Multi-index: build routing table
  const routingRows = indexes.map((idx) => {
    const scope = idx.path === '.' ? 'Full repo / root' : `\`${idx.path}\``;
    return `| ${scope} | \`${idx.name}\` |`;
  });
  const routingTable = [
    '| Work area | `repo` |',
    '|-----------|--------|',
    ...routingRows,
    `| \`gitnexus_detect_changes\` | \`${detectChangesIndex.name}\` (always) |`,
  ].join('\n');

  // Impact retry hints per non-primary index
  const retryHints = indexes
    .filter((idx) => idx !== primary)
    .map(
      (idx) =>
        `- \`gitnexus_impact\` returns 0 upstream on code under \`${idx.path}\` -- **retry with \`repo: "${idx.name}"\` first**`
    )
    .join('\n');

  return `---
description: Use GitNexus graph intelligence before grep or file exploration for any codebase question or GSD workflow
alwaysApply: true
---

# GitNexus-First Codebase Exploration

For ANY question about how the codebase works -- how a feature is implemented,
where something is stored, how data flows, what calls what -- query GitNexus
before reaching for Grep, Glob, or Shell. Fall back to filesystem exploration
only when GitNexus returns no results or is unavailable.

## Priority: GitNexus > .planning/codebase/ > grep/glob/shell

## Index routing

This project uses ${indexes.length} GitNexus indexes. Route queries to the correct one:

${routingTable}

## All GSD workflows (mandatory)

Applies to **every** GSD command, orchestrator step, and subagent that inspects
application code -- including discuss-phase, plan-phase, execute-phase (\`gsd-executor\`),
verify-work (\`gsd-verifier\`), code review (\`gsd-code-review\` / \`gsd-code-reviewer\`),
code-review-fix (\`gsd-code-fixer\`), secure-phase (\`gsd-security-auditor\`),
eval-review, validate-phase, audit-fix, audit-milestone, audit-uat, map-codebase,
scan, intel, add-tests, autonomous waves, and any workflow that builds call graphs
or answers "what calls this?" / "what breaks if...?".

1. **Before** relying on Grep/Glob/shell for import trees, callers, callees,
   execution flows, or blast radius on **application** code: use \`gitnexus_query\`,
   \`gitnexus_context\`, and/or \`gitnexus_impact\` with the correct **\`repo\`**
   (see Index routing above).
2. **Choose \`repo\` from in-scope paths**: check the routing table above.
3. **\`gitnexus_detect_changes\`**: always use \`repo: "${detectChangesIndex.name}"\` (git-aware full repo).
4. Subagents inherit these rules -- do not skip GitNexus when delegating.

## General codebase questions

1. Choose \`repo\` from the routing table above based on where the code lives
2. \`gitnexus_query({query: "<concept>", repo: "<chosen>"})\`
3. \`gitnexus_context({name: "<symbol>", repo: "<chosen>"})\` for returned symbols
4. Read source files only to confirm implementation details
5. Fall back to Grep/Glob/Shell only if GitNexus returns 0 results

## Fallback triggers

Use filesystem exploration when:
- \`gitnexus_query\` returns 0 processes
${retryHints}
- GitNexus warns index is stale (run \`npx gitnexus analyze\`)
- MCP server is unavailable
`;
}

/**
 * Build the project-level .cursor/skills/gitnexus-gsd/SKILL.md content.
 *
 * @param {{ indexes: Array<{ name: string, path: string, detectChanges?: boolean }> }} config
 * @returns {string}
 */
function generateSkillMd(config) {
  const { indexes } = config;
  const primary = indexes[0];
  const detectChangesIndex = indexes.find((i) => i.detectChanges) || primary;

  if (!isMonorepo(config)) {
    return `---
name: gitnexus-gsd
description: Use GitNexus MCP tools before grep/glob/shell for any codebase exploration task
---

# GitNexus-First Codebase Exploration

**ALWAYS query GitNexus before using Grep, Glob, Shell, or reading arbitrary files.**
This applies to ALL codebase exploration: research, pattern mapping, scout_codebase,
understanding how features work, tracing where data is stored or processed.

## Workflow

1. \`gitnexus_query({query: "<concept>", repo: "${primary.name}"})\` -- execution flows
2. \`gitnexus_context({name: "<symbol>", repo: "${primary.name}"})\` -- 360 degree view
3. \`READ gitnexus://repo/${primary.name}/clusters\` -- functional areas
4. Only fall back to Grep/Glob/Shell/file reads if GitNexus returns 0 results

## When this applies

- "How is X implemented?" -- gitnexus_query first
- "Where is Y stored?" -- gitnexus_query first
- "What calls Z?" -- gitnexus_context first
- Researching a phase -- gitnexus_query the feature area first
- Finding code patterns -- gitnexus_query + gitnexus_context before grep
- scout_codebase (discuss-phase) -- gitnexus_query before .planning/codebase/
- Pattern mapping (plan-phase) -- gitnexus_context before spawning mapper agent

## Index

Repo: \`${primary.name}\`
detect_changes repo: \`${detectChangesIndex.name}\`

## Fallback

Use grep/files only when:
- \`gitnexus_query\` returns 0 processes
- \`gitnexus_impact\` returns 0 upstream -- retry once before falling back to grep
- GitNexus index is stale -- run \`npx gitnexus analyze\`
- MCP server unavailable
`;
  }

  // Multi-index
  const routingLines = indexes
    .map((idx) => {
      const scope = idx.path === '.' ? 'full repo' : `\`${idx.path}\``;
      return `- ${scope} -- \`repo: "${idx.name}"\``;
    })
    .join('\n');

  const exampleIndex = indexes.find((i) => i.path !== '.') || primary;

  return `---
name: gitnexus-gsd
description: Use GitNexus MCP tools before grep/glob/shell for any codebase exploration task
---

# GitNexus-First Codebase Exploration

**ALWAYS query GitNexus before using Grep, Glob, Shell, or reading arbitrary files.**
This applies to ALL codebase exploration: research, pattern mapping, scout_codebase,
understanding how features work, tracing where data is stored or processed.

## Workflow

1. Pick \`repo\` per Index routing below
2. \`gitnexus_query({query: "<concept>", repo: "<chosen>"})\` -- execution flows
3. \`gitnexus_context({name: "<symbol>", repo: "<same>"})\` -- 360 degree view
4. \`READ gitnexus://repo/<same>/clusters\` -- functional areas
5. Only fall back to Grep/Glob/Shell/file reads if GitNexus returns 0 results

## When this applies

- "How is X implemented?" -- gitnexus_query first
- "Where is Y stored?" -- gitnexus_query first
- "What calls Z?" -- gitnexus_context first
- Researching a phase -- gitnexus_query the feature area first
- Finding code patterns -- gitnexus_query + gitnexus_context before grep
- scout_codebase (discuss-phase) -- gitnexus_query before .planning/codebase/
- Pattern mapping (plan-phase) -- gitnexus_context before spawning mapper agent

## Index routing

This project uses ${indexes.length} GitNexus indexes (see \`CLAUDE.md\` "Dual Index"):
${routingLines}
- detect_changes: always \`repo: "${detectChangesIndex.name}"\`

## Fallback

Use grep/files only when:
- \`gitnexus_query\` returns 0 processes
- \`gitnexus_impact\` returns 0 upstream -- retry with the scope-matched repo before falling back to grep
- GitNexus index is stale -- run \`npx gitnexus analyze\` or scope-specific reindex script
- MCP server unavailable

## Example

\`\`\`
gitnexus_impact({target: "MySymbol", direction: "upstream", repo: "${exampleIndex.name}"})
\`\`\`
`;
}

/**
 * Build the AGENTS.md / CLAUDE.md section content (wrapped in gitnexus-gsd markers).
 *
 * @param {{ indexes: Array<{ name: string, path: string, detectChanges?: boolean }> }} config
 * @returns {string}
 */
function generateAgentsMdSection(config) {
  const { indexes } = config;
  const primary = indexes[0];

  if (!isMonorepo(config)) {
    return `<!-- gitnexus-gsd:start -->
## GSD + GitNexus Integration

For **all** GSD workflows (discuss, plan, execute, verify, code review, security review,
audits, map-codebase, scan, fixers, etc.), use GitNexus MCP before grep-first exploration
of application code. Use \`repo: "${primary.name}"\` for all queries. Subagents inherit
this. Step-by-step per workflow: \`.cursor/rules/gitnexus-gsd-integration.mdc\`.
<!-- gitnexus-gsd:end -->`;
  }

  const routingParts = indexes
    .map((idx) => {
      const scope = idx.path === '.' ? 'full repo' : `\`${idx.path}\``;
      return `**\`${idx.name}\`** for ${scope}`;
    })
    .join(', ');

  return `<!-- gitnexus-gsd:start -->
## GSD + GitNexus Integration

For **all** GSD workflows (discuss, plan, execute, verify, code review, security review,
audits, map-codebase, scan, fixers, etc.), use GitNexus MCP before grep-first exploration
of application code. Use ${routingParts} -- see "Dual Index" above. Subagents inherit
this. Step-by-step per workflow: \`.cursor/rules/gitnexus-gsd-integration.mdc\`.
<!-- gitnexus-gsd:end -->`;
}

module.exports = {
  generateMdcRule,
  generateSkillMd,
  generateAgentsMdSection,
};
