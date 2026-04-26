#!/usr/bin/env node
'use strict';

const command = process.argv[2];
const cwd = process.cwd();

const COMMANDS = {
  'init':      () => require('../src/commands/init').run(cwd),
  'uninstall': () => require('../src/commands/uninstall').run(cwd),
  'help':      showHelp,
};

function showHelp() {
  const { BOLD, RESET } = require('../src/utils/files');
  console.log();
  console.log(`${BOLD}gitnexus-gsd${RESET} -- GitNexus graph intelligence for GSD workflows`);
  console.log();
  console.log(`${BOLD}Usage:${RESET}`);
  console.log(`  npx gitnexus-gsd init         Install project-level rules`);
  console.log(`  npx gitnexus-gsd uninstall    Remove project-level rules`);
  console.log(`  npx gitnexus-gsd help         Show this help`);
  console.log();
}

const handler = COMMANDS[command] || showHelp;

try {
  handler();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exit(1);
}
