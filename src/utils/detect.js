'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');

function hasGsdInstall(cwd) {
  return fs.existsSync(path.join(cwd, '.planning'));
}

function hasGitNexusIndex(cwd) {
  return (
    fs.existsSync(path.join(cwd, '.gitnexus')) ||
    fs.existsSync(path.join(cwd, 'gitnexus.json'))
  );
}

function hasCursorRulesDir(cwd) {
  return fs.existsSync(path.join(cwd, '.cursor', 'rules'));
}

function hasExistingMdcRule(cwd) {
  return fs.existsSync(
    path.join(cwd, '.cursor', 'rules', 'gitnexus-gsd-integration.mdc')
  );
}

/**
 * Discover GitNexus indexes for this project by reading the global
 * ~/.gitnexus/registry.json, which GitNexus maintains automatically
 * after every `npx gitnexus analyze` run.
 *
 * Matches registry entries whose `path` equals cwd or is a
 * subdirectory of cwd (sub-indexes for monorepos).
 *
 * Each result includes a `scope` field: the path relative to cwd
 * (e.g. '.' for the root index, 'backend' for a sub-directory index).
 *
 * Returns [] if the registry doesn't exist or no entries match.
 *
 * @param {string} cwd  Absolute path to the project root.
 * @returns {Array<{ name: string, scope: string, stats?: object }>}
 */
function detectGitNexusIndexes(cwd) {
  const registryPath = path.join(os.homedir(), '.gitnexus', 'registry.json');
  if (!fs.existsSync(registryPath)) return [];

  let registry;
  try {
    registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
  } catch {
    return [];
  }

  if (!Array.isArray(registry)) return [];

  const normalizedCwd = cwd.endsWith(path.sep) ? cwd : cwd + path.sep;

  return registry
    .filter((entry) => {
      if (!entry || typeof entry.path !== 'string') return false;
      const entryPath = entry.path.endsWith(path.sep)
        ? entry.path
        : entry.path + path.sep;
      // Match exact cwd or any subdirectory of cwd
      return entryPath === normalizedCwd || entryPath.startsWith(normalizedCwd);
    })
    .map((entry) => {
      const relative = path.relative(cwd, entry.path);
      return {
        name: entry.name,
        scope: relative === '' ? '.' : relative,
        stats: entry.stats,
      };
    })
    // Root index first, then sub-indexes sorted by scope depth
    .sort((a, b) => {
      if (a.scope === '.') return -1;
      if (b.scope === '.') return 1;
      return a.scope.localeCompare(b.scope);
    });
}

module.exports = {
  hasGsdInstall,
  hasGitNexusIndex,
  hasCursorRulesDir,
  hasExistingMdcRule,
  detectGitNexusIndexes,
};
