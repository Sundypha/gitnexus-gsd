'use strict';

const fs = require('fs');
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
 * Attempt to discover GitNexus index names and their scopes from the
 * project directory structure.
 *
 * Strategy 1: .gitnexus/<index-name>/ sub-directories
 * Strategy 2: gitnexus.json root file with a `name` field
 *
 * Returns an array of { name, path } objects (path is the directory
 * scope, defaulting to '.'). Returns [] if nothing is found.
 *
 * @param {string} cwd
 * @returns {Array<{ name: string, path: string }>}
 */
function detectGitNexusIndexes(cwd) {
  // Strategy 1: .gitnexus/ directory -- each sub-directory is an index
  const gitnexusDir = path.join(cwd, '.gitnexus');
  if (fs.existsSync(gitnexusDir) && fs.statSync(gitnexusDir).isDirectory()) {
    try {
      const entries = fs.readdirSync(gitnexusDir, { withFileTypes: true });
      const indexDirs = entries.filter((e) => e.isDirectory());
      if (indexDirs.length > 0) {
        return indexDirs.map((e) => ({ name: e.name, path: '.' }));
      }
    } catch {
      // fall through
    }
  }

  // Strategy 2: gitnexus.json with a name field
  const jsonPath = path.join(cwd, 'gitnexus.json');
  if (fs.existsSync(jsonPath)) {
    try {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      if (data.name) {
        return [{ name: data.name, path: data.root || '.' }];
      }
    } catch {
      // fall through
    }
  }

  return [];
}

module.exports = {
  hasGsdInstall,
  hasGitNexusIndex,
  hasCursorRulesDir,
  hasExistingMdcRule,
  detectGitNexusIndexes,
};
