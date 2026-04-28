'use strict';

const path = require('path');
const { hasGsdInstall, hasGitNexusIndex, detectGitNexusIndexes } = require('../utils/detect');
const { loadConfig, writeConfig, CURRENT_VERSION } = require('../utils/config');
const { generateMdcRule, generateSkillMd, generateAgentsMdSection } = require('../utils/generate');
const { promptIndexes } = require('../utils/prompt');
const { patchAgentSkills } = require('../utils/config-patch');
const {
  writeIfChanged,
  patchMarkdownFile,
  log,
  BOLD, RESET, YELLOW, GREEN, DIM,
} = require('../utils/files');

const SKILL_RELATIVE_PATH = '.cursor/skills/gitnexus-gsd';

async function run(cwd) {
  console.log();
  console.log(`${BOLD}GitNexus-GSD Init${RESET} ${DIM}v${CURRENT_VERSION}${RESET}`);
  console.log();

  if (!hasGsdInstall(cwd)) {
    log(`${YELLOW}!${RESET}`, `No .planning/ directory found -- GSD may not be initialized here.`);
  }
  if (!hasGitNexusIndex(cwd)) {
    log(`${YELLOW}!${RESET}`, `No GitNexus index found -- run ${BOLD}npx gitnexus analyze${RESET} first.`);
  }

  // 1. Check for existing config
  const existingConfig = loadConfig(cwd);
  let indexes;

  if (existingConfig && Array.isArray(existingConfig.indexes) && existingConfig.indexes.length > 0) {
    const names = existingConfig.indexes.map((i) => `${BOLD}${i.name}${RESET}`).join(', ');
    log(`${DIM}i${RESET}`, `Found existing .gitnexus-gsd.json with indexes: ${names}`);
    console.log();
    console.log(`  Press Enter to keep existing config, or type ${BOLD}r${RESET} to reconfigure.`);

    // Quick readline prompt without the full prompt module
    const readline = require('readline');
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    const answer = await new Promise((resolve) => {
      rl.question('  Choice [Enter/r]: ', (a) => { rl.close(); resolve(a.trim().toLowerCase()); });
    });

    if (answer === 'r') {
      const detected = detectGitNexusIndexes(cwd);
      indexes = await promptIndexes(detected);
    } else {
      indexes = existingConfig.indexes;
      log(`${DIM}=${RESET}`, `Using existing index configuration.`);
    }
  } else {
    // 2. Auto-detect + interactive prompts
    const detected = detectGitNexusIndexes(cwd);
    indexes = await promptIndexes(detected);
  }

  const config = { indexes };

  // 3. Write .gitnexus-gsd.json
  writeConfig(cwd, config);
  log(`${GREEN}+${RESET}`, `.gitnexus-gsd.json written`);

  // 4. Generate and write .mdc rule
  const mdcPath = path.join(cwd, '.cursor', 'rules', 'gitnexus-gsd-integration.mdc');
  const mdcContent = `<!-- gitnexus-gsd v${CURRENT_VERSION} -->\n` + generateMdcRule(config);
  const mdcResult = writeIfChanged(mdcPath, mdcContent);
  log(`${GREEN}+${RESET}`, `.cursor/rules/gitnexus-gsd-integration.mdc (${mdcResult === 'unchanged' ? 'unchanged' : mdcResult})`);

  // 5. Generate and write project-level SKILL.md
  const skillPath = path.join(cwd, '.cursor', 'skills', 'gitnexus-gsd', 'SKILL.md');
  const skillContent = generateSkillMd(config);
  const skillResult = writeIfChanged(skillPath, skillContent);
  log(`${GREEN}+${RESET}`, `.cursor/skills/gitnexus-gsd/SKILL.md (${skillResult === 'unchanged' ? 'unchanged' : skillResult})`);

  // 6. Patch AGENTS.md and CLAUDE.md
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

  // 7. Patch agent_skills in .planning/config.json
  const agentSkillsResult = patchAgentSkills(cwd, SKILL_RELATIVE_PATH);
  switch (agentSkillsResult) {
    case 'patched':
      log(`${GREEN}+${RESET}`, `.planning/config.json agent_skills updated (${SKILL_RELATIVE_PATH} injected for all supported agent types)`);
      break;
    case 'unchanged':
      log(`${DIM}=${RESET}`, `.planning/config.json agent_skills already up to date.`);
      break;
    case 'not_found':
      log(`${DIM}-${RESET}`, `.planning/config.json not found -- skipping agent_skills injection.`);
      break;
  }

  console.log();
  console.log(`${BOLD}Done.${RESET} GSD will now prefer GitNexus for codebase exploration.`);
  console.log();
}

module.exports = { run };
