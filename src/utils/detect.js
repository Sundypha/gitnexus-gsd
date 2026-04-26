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

module.exports = {
  hasGsdInstall,
  hasGitNexusIndex,
  hasCursorRulesDir,
  hasExistingMdcRule,
};
