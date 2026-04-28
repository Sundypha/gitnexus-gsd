'use strict';

const readline = require('readline');
const { BOLD, RESET, DIM, GREEN, YELLOW, RED } = require('./files');

function createRl() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}

function askYesNo(rl, question, defaultYes = true) {
  return new Promise((resolve) => {
    rl.question(`  ${question} `, (answer) => {
      const t = answer.trim().toLowerCase();
      resolve(t ? t === 'y' || t === 'yes' : defaultYes);
    });
  });
}

function askText(rl, question, defaultValue) {
  const hint = defaultValue ? ` ${DIM}[${defaultValue}]${RESET}` : '';
  return new Promise((resolve) => {
    rl.question(`  ${question}${hint}: `, (answer) => {
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

function askNumber(rl, question, min, max, defaultVal) {
  return new Promise((resolve) => {
    const hint = ` ${DIM}[${defaultVal}]${RESET}`;
    rl.question(`  ${question}${hint}: `, (answer) => {
      const n = parseInt(answer.trim(), 10);
      resolve(n >= min && n <= max ? n : defaultVal);
    });
  });
}

/**
 * Resolve index configuration interactively.
 *
 * detectedIndexes comes from detectGitNexusIndexes() — entries already
 * filtered to this project from ~/.gitnexus/registry.json.
 * Each entry: { name, scope, stats? }
 *
 * Flow A — indexes found in registry (happy path, zero typing):
 *   • Show the list with scope and node counts
 *   • 1 index  → confirm with Y/n
 *   • 2+ indexes → confirm or let user deselect unwanted ones
 *   • If >1 remain, auto-pick the root-scope one as detect_changes;
 *     if ambiguous, ask user to choose by number
 *
 * Flow B — no registry matches:
 *   • Warn the user to run `npx gitnexus analyze` first
 *   • Offer manual fallback (type index names) for advanced users
 *
 * Returns Array<{ name, scope, detectChanges }>
 */
async function promptIndexes(detectedIndexes) {
  const rl = createRl();
  try {
    return await _promptIndexes(rl, detectedIndexes);
  } finally {
    rl.close();
  }
}

async function _promptIndexes(rl, detectedIndexes) {
  console.log();
  console.log(`${BOLD}GitNexus indexes${RESET}`);
  console.log();

  // ── Flow A: registry matches found ──────────────────────────────────────
  if (detectedIndexes.length > 0) {
    console.log(`  Found ${detectedIndexes.length} index${detectedIndexes.length > 1 ? 'es' : ''} for this project:`);
    console.log();

    for (let i = 0; i < detectedIndexes.length; i++) {
      const idx = detectedIndexes[i];
      const scopeLabel = idx.scope === '.' ? 'full repo' : idx.scope;
      const nodes = idx.stats && idx.stats.nodes ? ` ${DIM}${idx.stats.nodes.toLocaleString()} symbols${RESET}` : '';
      console.log(`    ${BOLD}${i + 1}.${RESET}  ${BOLD}${idx.name}${RESET}${nodes}`);
      console.log(`         scope: ${scopeLabel}`);
    }

    console.log();
    const confirmed = await askYesNo(rl, `Use ${detectedIndexes.length === 1 ? 'this index' : 'these indexes'}? ${DIM}[Y/n]${RESET}`, true);

    if (confirmed) {
      return resolveDetectChanges(detectedIndexes);
    }

    // User said no — allow deselection of individual entries
    console.log();
    console.log(`  ${DIM}Enter numbers to remove (comma-separated), or press Enter to keep all:${RESET}`);
    const removeStr = await new Promise((resolve) =>
      rl.question('  Remove: ', (a) => resolve(a.trim()))
    );

    let kept = [...detectedIndexes];
    if (removeStr) {
      const toRemove = new Set(
        removeStr.split(',').map((s) => parseInt(s.trim(), 10) - 1)
      );
      kept = detectedIndexes.filter((_, i) => !toRemove.has(i));
    }

    if (kept.length > 0) {
      return resolveDetectChanges(kept);
    }

    console.log(`  ${YELLOW}All indexes removed. Falling back to manual entry.${RESET}`);
    console.log();
  }

  // ── Flow B: no registry matches ─────────────────────────────────────────
  if (detectedIndexes.length === 0) {
    console.log(`  ${YELLOW}No GitNexus indexes found for this project.${RESET}`);
    console.log();
    console.log(`  Run ${BOLD}npx gitnexus analyze${RESET} in your project root (and any`);
    console.log(`  language sub-directories) to create indexes, then re-run`);
    console.log(`  ${BOLD}npx gitnexus-gsd init${RESET}.`);
    console.log();
    console.log(`  ${DIM}Advanced: enter index names manually instead? [y/N]${RESET}`);
    const manual = await askYesNo(rl, '', false);
    if (!manual) {
      return [{ name: 'my-project', scope: '.', detectChanges: true }];
    }
    console.log();
  }

  // ── Manual entry fallback ────────────────────────────────────────────────
  console.log(`  Enter index names and their directory scopes.`);
  console.log(`  ${DIM}Use . for the full repo root, or a sub-directory like backend/.${RESET}`);
  console.log();

  const indexes = [];
  let addMore = true;
  while (addMore) {
    const name = await askText(rl, `Index name`);
    if (!name) {
      console.log(`  ${YELLOW}Name cannot be empty. Skipping.${RESET}`);
    } else {
      const scope = await askText(rl, `Scope for ${BOLD}${name}${RESET}`, '.');
      indexes.push({ name, scope: scope || '.', detectChanges: false });
    }
    if (indexes.length > 0) {
      addMore = await askYesNo(rl, `Add another index? ${DIM}[y/N]${RESET}`, false);
    }
  }

  if (indexes.length === 0) {
    console.log(`  ${YELLOW}No indexes configured — using placeholder.${RESET}`);
    console.log(`  ${DIM}Run \`npx gitnexus-gsd regenerate\` after indexing.${RESET}`);
    return [{ name: 'my-project', scope: '.', detectChanges: true }];
  }

  return resolveDetectChanges(indexes);
}

/**
 * Mark which index should be used for gitnexus_detect_changes.
 * Auto-selects the root-scope index; prompts when ambiguous.
 */
async function resolveDetectChanges(indexes) {
  if (indexes.length === 1) {
    return [{ ...indexes[0], detectChanges: true }];
  }

  const rootIndex = indexes.findIndex((i) => i.scope === '.');
  if (rootIndex !== -1) {
    return indexes.map((idx, i) => ({ ...idx, detectChanges: i === rootIndex }));
  }

  // Ambiguous — ask
  const rl = createRl();
  try {
    console.log();
    console.log(`  ${BOLD}Which index covers the full repo?${RESET} ${DIM}(used for detect_changes)${RESET}`);
    for (let i = 0; i < indexes.length; i++) {
      console.log(`    ${BOLD}${i + 1}.${RESET}  ${indexes[i].name}  ${DIM}(${indexes[i].scope})${RESET}`);
    }
    const choice = await askNumber(rl, `Choice`, 1, indexes.length, 1);
    return indexes.map((idx, i) => ({ ...idx, detectChanges: i === choice - 1 }));
  } finally {
    rl.close();
  }
}

module.exports = { promptIndexes };
