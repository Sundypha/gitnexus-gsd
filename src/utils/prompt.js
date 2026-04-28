'use strict';

const readline = require('readline');
const { BOLD, RESET, DIM, GREEN, YELLOW } = require('./files');

/**
 * Ask a single yes/no question. Returns true for yes, false for no.
 *
 * @param {readline.Interface} rl
 * @param {string} question  Must include the [Y/n] or [y/N] hint.
 * @param {boolean} defaultYes
 * @returns {Promise<boolean>}
 */
function askYesNo(rl, question, defaultYes = true) {
  return new Promise((resolve) => {
    rl.question(`  ${question} `, (answer) => {
      const trimmed = answer.trim().toLowerCase();
      if (!trimmed) return resolve(defaultYes);
      resolve(trimmed === 'y' || trimmed === 'yes');
    });
  });
}

/**
 * Ask a free-text question with an optional default value shown in brackets.
 *
 * @param {readline.Interface} rl
 * @param {string} question
 * @param {string} [defaultValue]
 * @returns {Promise<string>}
 */
function askText(rl, question, defaultValue) {
  const hint = defaultValue ? ` ${DIM}[${defaultValue}]${RESET}` : '';
  return new Promise((resolve) => {
    rl.question(`  ${question}${hint}: `, (answer) => {
      const trimmed = answer.trim();
      resolve(trimmed || defaultValue || '');
    });
  });
}

/**
 * Interactively gather index configuration from the user.
 *
 * Flow:
 *  1. If detectedIndexes has entries: show them and ask "Use these? [Y/n]"
 *     - If yes: ask each index's directory scope (pre-filled)
 *     - If no: fall through to manual entry
 *  2. Manual entry loop: name, scope, add another?
 *  3. If >1 index: ask which one is the full-repo (detect_changes) index
 *
 * @param {Array<{ name: string, path: string }>} detectedIndexes
 * @returns {Promise<Array<{ name: string, path: string, detectChanges: boolean }>>}
 */
async function promptIndexes(detectedIndexes) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await _promptIndexes(rl, detectedIndexes);
  } finally {
    rl.close();
  }
}

async function _promptIndexes(rl, detectedIndexes) {
  console.log();
  console.log(`${BOLD}Configure GitNexus indexes${RESET}`);
  console.log(
    `${DIM}GitNexus works best with one index per language. For monorepos, create${RESET}`
  );
  console.log(
    `${DIM}one index per major language root (e.g. backend/, frontend/).${RESET}`
  );
  console.log();

  let indexes = [];

  if (detectedIndexes.length > 0) {
    const names = detectedIndexes.map((i) => `${BOLD}${i.name}${RESET}`).join(', ');
    console.log(`  ${GREEN}Detected indexes:${RESET} ${names}`);
    console.log();

    const useDetected = await askYesNo(rl, `Use detected indexes? ${DIM}[Y/n]${RESET}`, true);

    if (useDetected) {
      // Confirm or override the path scope for each
      for (const detected of detectedIndexes) {
        const scopePath = await askText(
          rl,
          `  Scope for ${BOLD}${detected.name}${RESET} (directory, ${DIM}. = full repo${RESET})`,
          detected.path || '.'
        );
        indexes.push({ name: detected.name, path: scopePath || '.' });
      }
    }
  }

  if (indexes.length === 0) {
    // Manual entry
    console.log(`  Enter index names and their directory scopes.`);
    console.log(`  ${DIM}Tip: use . for the full repo root.${RESET}`);
    console.log();

    let addMore = true;
    while (addMore) {
      const name = await askText(rl, `Index name`);
      if (!name) {
        console.log(`  ${YELLOW}Index name cannot be empty. Skipping.${RESET}`);
      } else {
        const scopePath = await askText(rl, `Directory scope for ${BOLD}${name}${RESET}`, '.');
        indexes.push({ name, path: scopePath || '.' });
      }

      if (indexes.length > 0) {
        addMore = await askYesNo(rl, `Add another index? ${DIM}[y/N]${RESET}`, false);
      }
    }
  }

  if (indexes.length === 0) {
    // Fallback: single unnamed index
    console.log(`  ${YELLOW}No indexes configured. Using a placeholder.${RESET}`);
    console.log(`  ${DIM}Run \`npx gitnexus-gsd regenerate\` after running \`npx gitnexus analyze\`.${RESET}`);
    indexes = [{ name: 'my-project', path: '.' }];
  }

  // For multi-index: pick which one is detect_changes
  if (indexes.length > 1) {
    console.log();
    console.log(`  ${BOLD}Which index covers the full repo?${RESET}`);
    console.log(`  ${DIM}This index is used for \`gitnexus_detect_changes\` (git history).${RESET}`);
    console.log();

    for (let i = 0; i < indexes.length; i++) {
      const idx = indexes[i];
      const marker = idx.path === '.' ? ` ${DIM}(full repo)${RESET}` : '';
      console.log(`    ${BOLD}${i + 1}.${RESET} ${idx.name}${marker}`);
    }
    console.log();

    // Default: the one with path === '.' or first
    const defaultIdx = indexes.findIndex((i) => i.path === '.') + 1 || 1;
    const choiceStr = await askText(rl, `Choice`, String(defaultIdx));
    const choice = parseInt(choiceStr, 10);
    const detectChangesIdx = (choice >= 1 && choice <= indexes.length) ? choice - 1 : 0;

    indexes = indexes.map((idx, i) => ({
      ...idx,
      detectChanges: i === detectChangesIdx,
    }));
  } else {
    indexes = [{ ...indexes[0], detectChanges: true }];
  }

  console.log();
  console.log(`  ${GREEN}Index configuration:${RESET}`);
  for (const idx of indexes) {
    const dc = idx.detectChanges ? ` ${DIM}(detect_changes)${RESET}` : '';
    console.log(`    ${BOLD}${idx.name}${RESET}  scope: ${idx.path}${dc}`);
  }
  console.log();

  return indexes;
}

module.exports = { promptIndexes };
