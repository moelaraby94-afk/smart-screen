/**
 * Renames "Workspace" → "Branch" in translation VALUES only (not keys).
 * Run: node scripts/rename-workspace-to-branch.cjs
 */
const fs = require('fs');
const path = require('path');

const dashboardSrc = path.join(__dirname, '..', 'apps', 'dashboard', 'src', 'i18n', 'messages');

function replaceEnValue(str) {
  return str
    .replace(/\bWorkspaces\b/g, 'Branches')
    .replace(/\bworkspaces\b/g, 'branches')
    .replace(/\bWorkspace\b/g, 'Branch')
    .replace(/\bworkspace\b/g, 'branch');
}

function replaceArValue(str) {
  return str
    .replace(/مساحات العمل/g, 'الفروع')
    .replace(/مساحة العمل/g, 'الفرع')
    .replace(/مساحة عمل/g, 'فرع')
    .replace(/منطقة عمل/g, 'فرع');
}

function walk(obj, replacer) {
  if (typeof obj === 'string') return replacer(obj);
  if (Array.isArray(obj)) return obj.map((v) => walk(v, replacer));
  if (obj && typeof obj === 'object') {
    const out = {};
    for (const key of Object.keys(obj)) {
      out[key] = walk(obj[key], replacer);
    }
    return out;
  }
  return obj;
}

let changed = 0;

for (const [file, replacer] of [
  ['en.json', replaceEnValue],
  ['ar.json', replaceArValue],
]) {
  const filePath = path.join(dashboardSrc, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const json = JSON.parse(raw);
  const before = JSON.stringify(json);
  const result = walk(json, replacer);
  const after = JSON.stringify(result);
  if (before !== after) {
    fs.writeFileSync(filePath, JSON.stringify(result, null, 2) + '\n', 'utf8');
    const diffs = after.length - before.length;
    console.log(`${file}: updated (diff=${diffs})`);
    changed++;
  } else {
    console.log(`${file}: no changes`);
  }
}

console.log(`Done. ${changed} file(s) modified.`);
