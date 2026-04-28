<!-- gitnexus-gsd-global-skill-snippet:v2 -->
## GitNexus Code Intelligence (workspace-gated)

Before using Grep, Glob, or Shell for codebase exploration (import trees, callers,
blast radius, pattern search), check if this workspace has GitNexus configured:

1. Check: does `.cursor/rules/gitnexus-gsd-integration.mdc` exist?
2. If yes: READ that file, then use `gitnexus_query` and `gitnexus_context`
   (with the correct `repo` per the index routing in that file) BEFORE
   falling back to grep/glob.
3. If no: proceed with normal grep/glob exploration.

This applies to research, pattern mapping, code review, security review, execution,
and any task that inspects application code structure.
