'use strict';

const fs = require('fs');
const path = require('path');
const { removePatchBlock, log, BOLD, RESET, GREEN, DIM, YELLOW } = require('../utils/files');

function run(cwd) {
  console.log();
  console.log(`${BOLD}GitNexus-GSD Uninstall${RESET}`);
  console.log();

  // 1. Remove .mdc rule file
  const mdcPath = path.join(cwd, '.cursor', 'rules', 'gitnexus-gsd-integration.mdc');
  if (fs.existsSync(mdcPath)) {
    fs.unlinkSync(mdcPath);
    log(`${GREEN}x${RESET}`, `Removed .cursor/rules/gitnexus-gsd-integration.mdc`);
  } else {
    log(`${DIM}-${RESET}`, `.cursor/rules/gitnexus-gsd-integration.mdc not found, skipping.`);
  }

  // 2. Remove project-level skill
  const skillPath = path.join(cwd, '.cursor', 'skills', 'gitnexus-gsd', 'SKILL.md');
  if (fs.existsSync(skillPath)) {
    fs.unlinkSync(skillPath);
    log(`${GREEN}x${RESET}`, `Removed .cursor/skills/gitnexus-gsd/SKILL.md`);
    const skillDir = path.dirname(skillPath);
    if (fs.existsSync(skillDir) && fs.readdirSync(skillDir).length === 0) {
      fs.rmdirSync(skillDir);
    }
  } else {
    log(`${DIM}-${RESET}`, `.cursor/skills/gitnexus-gsd/SKILL.md not found, skipping.`);
  }

  // 3. Remove patch blocks from AGENTS.md and CLAUDE.md
  for (const filename of ['AGENTS.md', 'CLAUDE.md']) {
    const filePath = path.join(cwd, filename);
    const result = removePatchBlock(filePath);
    switch (result) {
      case 'not_found':
        log(`${DIM}-${RESET}`, `${filename} not found, skipping.`);
        break;
      case 'no_block':
        log(`${DIM}-${RESET}`, `${filename} has no gitnexus-gsd block, skipping.`);
        break;
      case 'removed':
        log(`${GREEN}x${RESET}`, `${filename} block removed.`);
        break;
    }
  }

  console.log();
  console.log(`${BOLD}Done.${RESET} All gitnexus-gsd project files removed.`);
  console.log();
}

module.exports = { run };
