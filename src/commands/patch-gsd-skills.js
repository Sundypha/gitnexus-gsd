'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const { readTemplate, log, BOLD, RESET, GREEN, YELLOW, DIM } = require('../utils/files');

const SNIPPET_MARKER_V1 = '<!-- gitnexus-gsd-global-skill-snippet:v1 -->';
const SNIPPET_MARKER_V2 = '<!-- gitnexus-gsd-global-skill-snippet:v2 -->';
const ADAPTER_END = '</cursor_skill_adapter>';

/**
 * Global GSD skills under ~/.cursor/skills/ that should prefer GitNexus when the
 * workspace documents it: anything whose workflow routinely reads application code,
 * traces git/code artifacts, cross-checks plans with implementation, or triages
 * work tied to the repo (issues/PRs, ship, spikes, imports, forensics, etc.).
 *
 * Why patch SKILL.md at all? Project rules are not always in the same context as
 * a thin dispatch skill; the snippet after </cursor_skill_adapter> keeps the hint
 * bundled with the invoked command. Workspace-gated: no effect in repos without
 * GitNexus docs.
 *
 * Omitted (not primarily codebase/code-graph work): help, stats, update,
 * reapply-patches, sync-skills, settings*, set-profile, note, next, progress, manager,
 * check-todos, add-todo/add-phase/add-backlog/insert-phase/remove-phase, plant-seed,
 * list-workspaces, new-milestone, remove-workspace, join-discord, session-report,
 * profile-user, thread, workstreams, health (.planning-only), cleanup (archive), …
 */
const CODEBASE_GSD_SKILLS = [
  'gsd-add-tests',
  'gsd-ai-integration-phase',
  'gsd-analyze-dependencies',
  'gsd-audit-fix',
  'gsd-audit-milestone',
  'gsd-audit-uat',
  'gsd-autonomous',
  'gsd-code-review',
  'gsd-code-review-fix',
  'gsd-complete-milestone',
  'gsd-debug',
  'gsd-discuss-phase',
  'gsd-do',
  'gsd-docs-update',
  'gsd-eval-review',
  'gsd-execute-phase',
  'gsd-explore',
  'gsd-extract_learnings',
  'gsd-fast',
  'gsd-forensics',
  'gsd-from-gsd2',
  'gsd-graphify',
  'gsd-import',
  'gsd-ingest-docs',
  'gsd-inbox',
  'gsd-intel',
  'gsd-list-phase-assumptions',
  'gsd-map-codebase',
  'gsd-milestone-summary',
  'gsd-new-project',
  'gsd-new-workspace',
  'gsd-pause-work',
  'gsd-plan-milestone-gaps',
  'gsd-plan-phase',
  'gsd-plan-review-convergence',
  'gsd-pr-branch',
  'gsd-quick',
  'gsd-research-phase',
  'gsd-resume-work',
  'gsd-review',
  'gsd-review-backlog',
  'gsd-scan',
  'gsd-secure-phase',
  'gsd-ship',
  'gsd-sketch',
  'gsd-sketch-wrap-up',
  'gsd-spec-phase',
  'gsd-spike',
  'gsd-spike-wrap-up',
  'gsd-ui-phase',
  'gsd-ui-review',
  'gsd-ultraplan-phase',
  'gsd-undo',
  'gsd-validate-phase',
  'gsd-verify-work',
];

/** @deprecated use CODEBASE_GSD_SKILLS */
const DEFAULT_SKILL_NAMES = CODEBASE_GSD_SKILLS;

function getSkillsRoot() {
  const override = process.env.CURSOR_SKILLS_DIR || process.env.GSD_SKILLS_DIR;
  if (override) return path.resolve(override);
  return path.join(os.homedir(), '.cursor', 'skills');
}

/**
 * Insert or upgrade the GitNexus hint snippet in a global GSD SKILL.md.
 *
 * - If v2 marker already present: unchanged.
 * - If v1 marker present: upgrade by replacing the v1 block with v2 content.
 * - If neither marker present: insert v2 snippet after </cursor_skill_adapter>.
 */
function insertSnippet(skillMdPath, snippet) {
  if (!fs.existsSync(skillMdPath)) {
    return { status: 'missing', path: skillMdPath };
  }
  let content = fs.readFileSync(skillMdPath, 'utf-8');

  // Already at v2 -- nothing to do
  if (content.includes(SNIPPET_MARKER_V2)) {
    return { status: 'unchanged', path: skillMdPath };
  }

  // Upgrade from v1: replace the entire v1 block
  if (content.includes(SNIPPET_MARKER_V1)) {
    const v1Start = content.indexOf(SNIPPET_MARKER_V1);
    // Find the next ## heading after the v1 block, or use EOF
    const afterV1 = content.indexOf('\n## ', v1Start + SNIPPET_MARKER_V1.length);
    const v1End = afterV1 !== -1 ? afterV1 : content.length;
    const upgraded =
      content.slice(0, v1Start) +
      snippet.trim() +
      '\n' +
      content.slice(v1End);
    fs.writeFileSync(skillMdPath, upgraded, 'utf-8');
    return { status: 'upgraded', path: skillMdPath };
  }

  // Fresh insert after </cursor_skill_adapter>
  const idx = content.indexOf(ADAPTER_END);
  if (idx === -1) {
    return { status: 'no_adapter', path: skillMdPath };
  }
  const insertAt = idx + ADAPTER_END.length;
  const next =
    content.slice(0, insertAt) +
    '\n\n' +
    snippet.trim() +
    '\n' +
    content.slice(insertAt);
  fs.writeFileSync(skillMdPath, next, 'utf-8');
  return { status: 'patched', path: skillMdPath };
}

function run() {
  const snippet = readTemplate('gsd-global-skill-snippet.md');
  if (!snippet.includes(SNIPPET_MARKER_V2)) {
    throw new Error('Template gsd-global-skill-snippet.md must include the v2 version marker');
  }

  const extra = (process.env.GITNEXUS_GSD_PATCH_SKILLS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const skillNames = [...new Set([...CODEBASE_GSD_SKILLS, ...extra])].sort();

  const skillsRoot = getSkillsRoot();
  console.log();
  console.log(`${BOLD}gitnexus-gsd patch-gsd-skills${RESET} ${DIM}(global Cursor skills)${RESET}`);
  console.log();
  console.log(`  Skills root: ${skillsRoot}`);
  console.log(`  Skills to patch: ${skillNames.length}${extra.length ? ` (+${extra.length} from GITNEXUS_GSD_PATCH_SKILLS)` : ''}`);
  console.log();

  let patched = 0;
  let upgraded = 0;
  let unchanged = 0;
  let missing = 0;
  let errors = 0;

  for (const name of skillNames) {
    const skillMd = path.join(skillsRoot, name, 'SKILL.md');
    const r = insertSnippet(skillMd, snippet);
    switch (r.status) {
      case 'patched':
        log(`${GREEN}+${RESET}`, `${name}/SKILL.md — inserted GitNexus hint`);
        patched += 1;
        break;
      case 'upgraded':
        log(`${GREEN}^${RESET}`, `${name}/SKILL.md — upgraded v1 hint to v2`);
        upgraded += 1;
        break;
      case 'unchanged':
        log(`${DIM}=${RESET}`, `${name}/SKILL.md — hint already at v2`);
        unchanged += 1;
        break;
      case 'missing':
        log(`${YELLOW}!${RESET}`, `${name}/SKILL.md — file not found (skip)`);
        missing += 1;
        break;
      case 'no_adapter':
        log(`${YELLOW}!${RESET}`, `${name}/SKILL.md — no ${ADAPTER_END} anchor (skip)`);
        errors += 1;
        break;
      default:
        break;
    }
  }

  console.log();
  console.log(`${BOLD}Done.${RESET} Patched: ${patched}, upgraded v1→v2: ${upgraded}, already at v2: ${unchanged}, missing: ${missing}, anchor errors: ${errors}.`);
  console.log();
}

module.exports = {
  run,
  insertSnippet,
  SNIPPET_MARKER_V1,
  SNIPPET_MARKER_V2,
  /** @deprecated use SNIPPET_MARKER_V2 */
  SNIPPET_MARKER: SNIPPET_MARKER_V2,
  CODEBASE_GSD_SKILLS,
  DEFAULT_SKILL_NAMES,
};
