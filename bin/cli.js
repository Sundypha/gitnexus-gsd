#!/usr/bin/env node
'use strict';

const command = process.argv[2];
const cwd = process.cwd();

// init is async -- wrap the others in Promise.resolve for uniform handling
const COMMANDS = {
  'init':             () => require('../src/commands/init').run(cwd),
  'regenerate':       () => Promise.resolve(require('../src/commands/regenerate').run(cwd)),
  'uninstall':        () => Promise.resolve(require('../src/commands/uninstall').run(cwd)),
  'patch-gsd-skills': () => Promise.resolve(require('../src/commands/patch-gsd-skills').run()),
  'help':             () => Promise.resolve(showHelp()),
};

function showHelp() {
  const { BOLD, RESET } = require('../src/utils/files');
  console.log();
  console.log(`${BOLD}gitnexus-gsd${RESET} -- GitNexus graph intelligence for GSD workflows`);
  console.log();
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  npx gitnexus-gsd init               Configure indexes and install project rules`);
  console.log(`  npx gitnexus-gsd regenerate          Regenerate files from .gitnexus-gsd.json`);
  console.log(`  npx gitnexus-gsd uninstall           Remove all project-level files`);
  console.log(`  npx gitnexus-gsd patch-gsd-skills    Insert GitNexus hint into global GSD skills`);
  console.log(`  npx gitnexus-gsd help                Show this help`);
  console.log();
}

const handler = COMMANDS[command] || (() => Promise.resolve(showHelp()));

handler().catch((err) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
