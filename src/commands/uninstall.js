'use strict';

const fs = require('fs');
const path = require('path');
const { removePatchBlock, log, BOLD, RESET, GREEN, DIM } = require('../utils/files');
const { removeConfig } = require('../utils/config');
const { removeAgentSkills } = require('../utils/config-patch');

const SKILL_RELATIVE_PATH = '.cursor/skills/gitnexus-gsd';

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

  // 4. Remove agent_skills entries from .planning/config.json
  const agentResult = removeAgentSkills(cwd, SKILL_RELATIVE_PATH);
  switch (agentResult) {
    case 'cleaned':
      log(`${GREEN}x${RESET}`, `.planning/config.json agent_skills entries removed.`);
      break;
    case 'unchanged':
      log(`${DIM}-${RESET}`, `.planning/config.json agent_skills had no gitnexus-gsd entries.`);
      break;
    case 'not_found':
      log(`${DIM}-${RESET}`, `.planning/config.json not found, skipping.`);
      break;
  }

  // 5. Remove .gitnexus-gsd.json
  const removed = removeConfig(cwd);
  if (removed) {
    log(`${GREEN}x${RESET}`, `Removed .gitnexus-gsd.json`);
  } else {
    log(`${DIM}-${RESET}`, `.gitnexus-gsd.json not found, skipping.`);
  }

  console.log();
  console.log(`${BOLD}Done.${RESET} All gitnexus-gsd project files removed.`);
  console.log();
}

module.exports = { run };
