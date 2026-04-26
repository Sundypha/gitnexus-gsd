'use strict';

const path = require('path');
const { hasGsdInstall, hasGitNexusIndex, hasExistingMdcRule } = require('../utils/detect');
const {
  readTemplate,
  writeIfChanged,
  patchMarkdownFile,
  log,
  BOLD, RESET, YELLOW, GREEN, DIM,
} = require('../utils/files');

function getVersion() {
  const pkg = require('../../package.json');
  return pkg.version;
}

function run(cwd) {
  const version = getVersion();

  console.log();
  console.log(`${BOLD}GitNexus-GSD Init${RESET} ${DIM}v${version}${RESET}`);
  console.log();

  if (!hasGsdInstall(cwd)) {
    log(`${YELLOW}!${RESET}`, `No .planning/ directory found -- GSD may not be initialized here.`);
  }
  if (!hasGitNexusIndex(cwd)) {
    log(`${YELLOW}!${RESET}`, `No GitNexus index found -- run ${BOLD}npx gitnexus analyze${RESET} first.`);
  }

  // 1. Write .mdc project rule
  const mdcPath = path.join(cwd, '.cursor', 'rules', 'gitnexus-gsd-integration.mdc');
  const mdcContent =
    `<!-- gitnexus-gsd v${version} -->\n` + readTemplate('gitnexus-gsd-integration.mdc');
  const mdcResult = writeIfChanged(mdcPath, mdcContent);
  const mdcLabel = mdcResult === 'unchanged' ? 'unchanged' : mdcResult;
  log(`${GREEN}+${RESET}`, `.cursor/rules/gitnexus-gsd-integration.mdc (${mdcLabel})`);

  // 2. Write project-level skill (picked up by GSD subagents via agent-skills injection)
  const skillPath = path.join(cwd, '.cursor', 'skills', 'gitnexus-gsd', 'SKILL.md');
  const skillContent = readTemplate('skills/gitnexus-gsd/SKILL.md');
  const skillResult = writeIfChanged(skillPath, skillContent);
  log(`${GREEN}+${RESET}`, `.cursor/skills/gitnexus-gsd/SKILL.md (${skillResult === 'unchanged' ? 'unchanged' : skillResult})`);

  // 3. Patch AGENTS.md and CLAUDE.md
  const sectionContent = readTemplate('agents-md-section.md');
  for (const filename of ['AGENTS.md', 'CLAUDE.md']) {
    const filePath = path.join(cwd, filename);
    const result = patchMarkdownFile(filePath, sectionContent);
    switch (result) {
      case 'not_found':
        log(`${DIM}-${RESET}`, `${filename} not found, skipping.`);
        break;
      case 'replaced':
        log(`${GREEN}+${RESET}`, `${filename} block replaced.`);
        break;
      case 'inserted_after_gitnexus':
        log(`${GREEN}+${RESET}`, `${filename} block inserted after GitNexus section.`);
        break;
      case 'appended':
        log(`${GREEN}+${RESET}`, `${filename} block appended.`);
        break;
    }
  }

  console.log();
  console.log(`${BOLD}Done.${RESET} GSD will now prefer GitNexus for codebase exploration.`);
  console.log();
}

module.exports = { run };
