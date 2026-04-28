'use strict';

// Programmatic API for gitnexus-gsd.
// CLI usage: see bin/cli.js

module.exports = {
  init: require('./commands/init'),
  regenerate: require('./commands/regenerate'),
  uninstall: require('./commands/uninstall'),
  patchGsdSkills: require('./commands/patch-gsd-skills'),
  utils: {
    config: require('./utils/config'),
    configPatch: require('./utils/config-patch'),
    detect: require('./utils/detect'),
    generate: require('./utils/generate'),
  },
};
