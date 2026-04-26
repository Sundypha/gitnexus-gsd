<!-- gitnexus-gsd:start -->
## GSD + GitNexus Integration

When executing GSD codebase exploration workflows (scout_codebase, pattern
mapping, map-codebase, scan), prefer GitNexus MCP tools over the default
codebase mapper. Use `gitnexus_query` and `gitnexus_context` first; fall
back to `.planning/codebase/*.md` or grep only when GitNexus returns no
results. See `.cursor/rules/gitnexus-gsd-integration.mdc` for step-by-step
instructions per GSD workflow.
<!-- gitnexus-gsd:end -->
