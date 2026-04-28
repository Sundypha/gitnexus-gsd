'use strict';

const fs = require('fs');
const path = require('path');

const CONFIG_FILENAME = '.gitnexus-gsd.json';
const CURRENT_VERSION = '0.4.0';

/**
 * Load .gitnexus-gsd.json from the given project root.
 * Returns the parsed config object, or null if the file does not exist.
 */
function loadConfig(cwd) {
  const filePath = path.join(cwd, CONFIG_FILENAME);
  if (!fs.existsSync(filePath)) return null;
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

/**
 * Write .gitnexus-gsd.json to the given project root.
 * Always stamps the current package version.
 *
 * @param {string} cwd
 * @param {{ indexes: Array<{ name: string, path: string, detectChanges?: boolean }> }} config
 */
function writeConfig(cwd, config) {
  const filePath = path.join(cwd, CONFIG_FILENAME);
  const data = Object.assign({ version: CURRENT_VERSION }, config);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
}

/**
 * Remove .gitnexus-gsd.json from the given project root.
 */
function removeConfig(cwd) {
  const filePath = path.join(cwd, CONFIG_FILENAME);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    return true;
  }
  return false;
}

/**
 * Attempt to detect existing GitNexus index names and their scopes from
 * the .gitnexus/ directory structure or gitnexus.json in the project root.
 *
 * Returns an array of { name, path } objects. Returns [] if nothing is found.
 *
 * @param {string} cwd
 * @returns {Array<{ name: string, path: string }>}
 */
function detectIndexes(cwd) {
  // Strategy 1: .gitnexus/ directory — each sub-directory is an index name
  const gitnexusDir = path.join(cwd, '.gitnexus');
  if (fs.existsSync(gitnexusDir) && fs.statSync(gitnexusDir).isDirectory()) {
    try {
      const entries = fs.readdirSync(gitnexusDir, { withFileTypes: true });
      const indexDirs = entries.filter((e) => e.isDirectory());
      if (indexDirs.length > 0) {
        return indexDirs.map((e) => ({
          name: e.name,
          path: '.',
        }));
      }
    } catch {
      // fall through
    }
  }

  // Strategy 2: gitnexus.json — may contain name field
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

/**
 * Returns true if more than one index is defined.
 *
 * @param {{ indexes: Array }} config
 */
function isMonorepo(config) {
  return Array.isArray(config.indexes) && config.indexes.length > 1;
}

module.exports = {
  CONFIG_FILENAME,
  CURRENT_VERSION,
  loadConfig,
  writeConfig,
  removeConfig,
  detectIndexes,
  isMonorepo,
};
