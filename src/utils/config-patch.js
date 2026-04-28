'use strict';

const fs = require('fs');
const path = require('path');

/**
 * The agent types whose GSD workflows call `gsd-sdk query agent-skills <type>`.
 * Only these types benefit from agent_skills injection -- the others don't
 * consume the block even if set.
 *
 * Sourced by grepping `~/.cursor/get-shit-done/workflows/**` for
 * `gsd-sdk query agent-skills`.
 */
const AGENT_TYPES_WITH_SKILLS = [
  'gsd-phase-researcher',
  'gsd-planner',
  'gsd-plan-checker',
  'gsd-executor',
  'gsd-verifier',
  'gsd-codebase-mapper',
  'gsd-security-auditor',
  'gsd-ui-researcher',
  'gsd-ui-checker',
  'gsd-ui-auditor',
  'gsd-nyquist-auditor',
  'gsd-project-researcher',
  'gsd-research-synthesizer',
  'gsd-roadmapper',
  'gsd-assumptions-analyzer',
  'gsd-doc-writer',
  'gsd-advisor-researcher',
  'gsd-debugger',
  'gsd-integration-checker',
];

const PLANNING_CONFIG = '.planning/config.json';

/**
 * Add skillPath to agent_skills for all supported agent types in
 * .planning/config.json. Preserves existing entries; does not duplicate.
 * Silently skips if .planning/config.json does not exist.
 *
 * @param {string} cwd  Project root
 * @param {string} skillPath  Relative path to inject, e.g. '.cursor/skills/gitnexus-gsd'
 * @returns {'patched'|'unchanged'|'not_found'}
 */
function patchAgentSkills(cwd, skillPath) {
  const configPath = path.join(cwd, PLANNING_CONFIG);
  if (!fs.existsSync(configPath)) return 'not_found';

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return 'not_found';
  }

  if (!config.agent_skills || typeof config.agent_skills !== 'object') {
    config.agent_skills = {};
  }

  let changed = false;
  for (const agentType of AGENT_TYPES_WITH_SKILLS) {
    const existing = config.agent_skills[agentType];

    if (Array.isArray(existing)) {
      if (!existing.includes(skillPath)) {
        existing.push(skillPath);
        changed = true;
      }
    } else if (typeof existing === 'string') {
      if (existing !== skillPath) {
        config.agent_skills[agentType] = [existing, skillPath];
        changed = true;
      }
    } else {
      config.agent_skills[agentType] = [skillPath];
      changed = true;
    }
  }

  if (!changed) return 'unchanged';

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return 'patched';
}

/**
 * Remove skillPath from agent_skills for all supported agent types.
 * Cleans up empty arrays. Silently skips if .planning/config.json does not exist.
 *
 * @param {string} cwd  Project root
 * @param {string} skillPath  Relative path to remove
 * @returns {'cleaned'|'unchanged'|'not_found'}
 */
function removeAgentSkills(cwd, skillPath) {
  const configPath = path.join(cwd, PLANNING_CONFIG);
  if (!fs.existsSync(configPath)) return 'not_found';

  let config;
  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  } catch {
    return 'not_found';
  }

  if (!config.agent_skills || typeof config.agent_skills !== 'object') {
    return 'unchanged';
  }

  let changed = false;
  for (const agentType of AGENT_TYPES_WITH_SKILLS) {
    const existing = config.agent_skills[agentType];
    if (!existing) continue;

    if (Array.isArray(existing)) {
      const filtered = existing.filter((s) => s !== skillPath);
      if (filtered.length !== existing.length) {
        config.agent_skills[agentType] = filtered.length === 1 ? filtered[0] : filtered;
        if (Array.isArray(config.agent_skills[agentType]) && config.agent_skills[agentType].length === 0) {
          delete config.agent_skills[agentType];
        }
        changed = true;
      }
    } else if (existing === skillPath) {
      delete config.agent_skills[agentType];
      changed = true;
    }
  }

  if (!changed) return 'unchanged';

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  return 'cleaned';
}

module.exports = {
  AGENT_TYPES_WITH_SKILLS,
  patchAgentSkills,
  removeAgentSkills,
};
