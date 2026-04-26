'use strict';

const { hasGsdInstall } = require('../utils/detect');
const { readTemplate, BOLD, DIM, RESET, YELLOW } = require('../utils/files');

function run(cwd) {
  const ruleText = readTemplate('user-rule.txt');

  console.log();
  console.log(`${BOLD}GitNexus-GSD User Rule${RESET}`);
  console.log();
  console.log(`Copy the text between the markers and paste it into:`);
  console.log(`${DIM}Cursor Settings > General > Rules for AI${RESET}`);
  console.log();
  console.log(`${'─'.repeat(60)}`);
  console.log(ruleText.trim());
  console.log(`${'─'.repeat(60)}`);
  console.log();

  if (hasGsdInstall(cwd)) {
    console.log(
      `${YELLOW}Tip:${RESET} This project has .planning/ -- run ${BOLD}npx gitnexus-gsd init${RESET} for per-project rules too.`
    );
    console.log();
  }
}

module.exports = { run };
