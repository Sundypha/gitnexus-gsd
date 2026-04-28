'use strict';

const path = require('path');
const { loadConfig, CURRENT_VERSION } = require('../utils/config');
const { generateMdcRule, generateSkillMd, generateAgentsMdSection } = require('../utils/generate');
const { patchAgentSkills } = require('../utils/config-patch');
const {
  writeIfChanged,
  patchMarkdownFile,
  log,
  BOLD, RESET, YELLOW, GREEN, DIM, RED,
} = require('../utils/files');

const SKILL_RELATIVE_PATH = '.cursor/skills/gitnexus-gsd';

function run(cwd) {
  console.log();
  console.log(`${BOLD}GitNexus-GSD Regenerate${RESET} ${DIM}v${CURRENT_VERSION}${RESET}`);
  console.log();

  const config = loadConfig(cwd);

  if (!config || !Array.isArray(config.indexes) || config.indexes.length === 0) {
    console.error(`  ${RED}Error:${RESET} No .gitnexus-gsd.json found (or it has no indexes).`);
    console.error(`  Run ${BOLD}npx gitnexus-gsd init${RESET} first to configure indexes.`);
    console.log();
    process.exit(1);
  }

  const names = config.indexes.map((i) => `${BOLD}${i.name}${RESET}`).join(', ');
  log(`${DIM}i${RESET}`, `Regenerating from config: ${names}`);
  console.log();

  // Re-generate and write .mdc rule
  const mdcPath = path.join(cwd, '.cursor', 'rules', 'gitnexus-gsd-integration.mdc');
  const mdcContent = `<!-- gitnexus-gsd v${CURRENT_VERSION} -->\n` + generateMdcRule(config);
  const mdcResult = writeIfChanged(mdcPath, mdcContent);
  log(`${GREEN}+${RESET}`, `.cursor/rules/gitnexus-gsd-integration.mdc (${mdcResult === 'unchanged' ? 'unchanged' : mdcResult})`);

  // Re-generate and write project-level SKILL.md
  const skillPath = path.join(cwd, '.cursor', 'skills', 'gitnexus-gsd', 'SKILL.md');
  const skillContent = generateSkillMd(config);
  const skillResult = writeIfChanged(skillPath, skillContent);
  log(`${GREEN}+${RESET}`, `.cursor/skills/gitnexus-gsd/SKILL.md (${skillResult === 'unchanged' ? 'unchanged' : skillResult})`);

  // Re-patch AGENTS.md and CLAUDE.md
  const sectionContent = generateAgentsMdSection(config);
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

  // Re-patch agent_skills
  const agentSkillsResult = patchAgentSkills(cwd, SKILL_RELATIVE_PATH);
  switch (agentSkillsResult) {
    case 'patched':
      log(`${GREEN}+${RESET}`, `.planning/config.json agent_skills updated`);
      break;
    case 'unchanged':
      log(`${DIM}=${RESET}`, `.planning/config.json agent_skills already up to date.`);
      break;
    case 'not_found':
      log(`${DIM}-${RESET}`, `.planning/config.json not found -- skipping agent_skills injection.`);
      break;
  }

  console.log();
  console.log(`${BOLD}Done.${RESET} All files regenerated from .gitnexus-gsd.json.`);
  console.log();
}

module.exports = { run };
