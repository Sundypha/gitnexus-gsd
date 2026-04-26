'use strict';

const fs = require('fs');
const path = require('path');

const BOLD = '\x1b[1m';
const DIM = '\x1b[2m';
const RESET = '\x1b[0m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED = '\x1b[31m';

function readTemplate(name) {
  return fs.readFileSync(
    path.join(__dirname, '..', 'templates', name),
    'utf-8'
  );
}

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function writeIfChanged(filePath, content) {
  if (fs.existsSync(filePath)) {
    const existing = fs.readFileSync(filePath, 'utf-8');
    if (existing === content) return 'unchanged';
  }
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf-8');
  return fs.existsSync(filePath) ? 'updated' : 'created';
}

const GSD_START = '<!-- gitnexus-gsd:start -->';
const GSD_END = '<!-- gitnexus-gsd:end -->';
const NEXUS_END = '<!-- gitnexus:end -->';

function patchMarkdownFile(filePath, sectionContent) {
  if (!fs.existsSync(filePath)) return 'not_found';

  let content = fs.readFileSync(filePath, 'utf-8');
  const startIdx = content.indexOf(GSD_START);
  const endIdx = content.indexOf(GSD_END);

  if (startIdx !== -1 && endIdx !== -1) {
    const before = content.slice(0, startIdx);
    const after = content.slice(endIdx + GSD_END.length);
    content = before + sectionContent.trim() + after;
    fs.writeFileSync(filePath, content, 'utf-8');
    return 'replaced';
  }

  const nexusEndIdx = content.indexOf(NEXUS_END);
  if (nexusEndIdx !== -1) {
    const insertAt = nexusEndIdx + NEXUS_END.length;
    const before = content.slice(0, insertAt);
    const after = content.slice(insertAt);
    content = before + '\n\n' + sectionContent.trim() + '\n' + after;
    fs.writeFileSync(filePath, content, 'utf-8');
    return 'inserted_after_gitnexus';
  }

  content = content.trimEnd() + '\n\n' + sectionContent.trim() + '\n';
  fs.writeFileSync(filePath, content, 'utf-8');
  return 'appended';
}

function removePatchBlock(filePath) {
  if (!fs.existsSync(filePath)) return 'not_found';

  const content = fs.readFileSync(filePath, 'utf-8');
  const startIdx = content.indexOf(GSD_START);
  const endIdx = content.indexOf(GSD_END);

  if (startIdx === -1 || endIdx === -1) return 'no_block';

  let before = content.slice(0, startIdx);
  let after = content.slice(endIdx + GSD_END.length);

  // Clean up extra blank lines left behind
  before = before.replace(/\n{3,}$/, '\n\n');
  after = after.replace(/^\n{2,}/, '\n');

  fs.writeFileSync(filePath, before + after, 'utf-8');
  return 'removed';
}

function log(icon, message) {
  console.log(`  ${icon} ${message}`);
}

module.exports = {
  BOLD, DIM, RESET, GREEN, YELLOW, RED,
  readTemplate,
  ensureDir,
  writeIfChanged,
  patchMarkdownFile,
  removePatchBlock,
  log,
};
