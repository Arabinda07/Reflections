import { execSync } from 'node:child_process';
import { writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

console.log('🔍 Running ESLint audit with @shadcn/lint analysis across Reflections...');

let rawJson = '';
try {
  rawJson = execSync('npx eslint . --format json', {
    maxBuffer: 50 * 1024 * 1024,
    encoding: 'utf8',
    cwd: process.cwd(),
  });
} catch (error) {
  // ESLint exits with code 1 if errors or warnings are found
  rawJson = error.stdout || '';
}

if (!rawJson.trim()) {
  console.error('❌ Failed to obtain ESLint output.');
  process.exit(1);
}

let results;
try {
  results = JSON.parse(rawJson);
} catch (err) {
  console.error('❌ Failed to parse ESLint JSON output:', err.message);
  process.exit(1);
}

// Aggregate metrics
let totalFiles = results.length;
let filesWithIssues = 0;
let totalErrors = 0;
let totalWarnings = 0;

const ruleCounts = {};
const directoryCounts = {};
const tokenCounts = {};
const contractViolations = [];

for (const fileResult of results) {
  const { filePath, messages } = fileResult;
  if (!messages || messages.length === 0) continue;

  filesWithIssues++;
  const relativePath = path.relative(process.cwd(), filePath).replace(/\\/g, '/');
  const dirGroup = relativePath.split('/')[0] + (relativePath.split('/').length > 1 ? '/' + relativePath.split('/')[1] : '');

  if (!directoryCounts[dirGroup]) {
    directoryCounts[dirGroup] = { errors: 0, warnings: 0, files: new Set() };
  }
  directoryCounts[dirGroup].files.add(relativePath);

  for (const msg of messages) {
    if (msg.severity === 2) {
      totalErrors++;
      directoryCounts[dirGroup].errors++;
    } else {
      totalWarnings++;
      directoryCounts[dirGroup].warnings++;
    }

    const rule = msg.ruleId || 'other';
    ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;

    // Track specific tokens/classes mentioned in messages
    const match = msg.message.match(/"([^"]+)"/);
    if (match) {
      const token = match[1];
      tokenCounts[token] = (tokenCounts[token] || 0) + 1;
    }

    if (rule === 'shadcn/no-restyle') {
      contractViolations.push({
        file: relativePath,
        line: msg.line,
        message: msg.message,
      });
    }
  }
}

// Sort breakdowns
const sortedRules = Object.entries(ruleCounts).sort((a, b) => b[1] - a[1]);
const sortedDirs = Object.entries(directoryCounts)
  .map(([dir, data]) => ({
    dir,
    errors: data.errors,
    warnings: data.warnings,
    total: data.errors + data.warnings,
    fileCount: data.files.size,
  }))
  .sort((a, b) => b.total - a.total);

const sortedTokens = Object.entries(tokenCounts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 20);

// Generate Markdown summary
let md = `# Design System & @shadcn/lint Baseline Audit Report

**Date:** ${new Date().toISOString()}  
**Files Scanned:** ${totalFiles}  
**Files with Violations:** ${filesWithIssues}  
**Total Violations:** ${totalErrors + totalWarnings} (${totalErrors} errors, ${totalWarnings} warnings)

---

## 1. Violations by Rule

| Rule ID | Count | Severity | Description / Remediation |
|---------|-------|----------|---------------------------|
`;

for (const [rule, count] of sortedRules) {
  let desc = 'Other linter check';
  if (rule === 'shadcn/no-arbitrary-values') desc = 'Off-token arbitrary bracket values (e.g. p-[...], w-[...])';
  if (rule === 'shadcn/no-raw-colors') desc = 'Raw palette colors (should use semantic tokens like text-primary, bg-surface)';
  if (rule === 'shadcn/no-restyle') desc = 'Component contract violations (forbidden classes on primitive)';
  if (rule === 'shadcn/no-unknown-classes') desc = 'Unregistered Tailwind utility class';
  md += `| \`${rule}\` | ${count} | ${rule.startsWith('shadcn') ? 'Configured' : 'General'} | ${desc} |\n`;
}

md += `\n---

## 2. Violations by Directory Group

| Directory Area | Total Issues | Errors | Warnings | Affected Files |
|----------------|--------------|--------|----------|----------------|
`;

for (const dir of sortedDirs) {
  md += `| \`${dir.dir}\` | ${dir.total} | ${dir.errors} | ${dir.warnings} | ${dir.fileCount} |\n`;
}

md += `\n---

## 3. Top 20 Most Repeated Off-Token Patterns

| Rank | Token / Class | Occurrences | Recommended Action |
|------|---------------|-------------|--------------------|
`;

sortedTokens.forEach(([token, count], idx) => {
  let action = 'Map to semantic token';
  if (token.includes('100dvh')) action = 'Replace with native `h-dvh` or `min-h-dvh`';
  if (token.includes('radius')) action = 'Declare in @theme as token or use standard rounded scale';
  if (token.includes('brand-')) action = 'Emails scope exemption or define in email theme';
  if (token === 'text-primary' || token === 'text-secondary') action = 'Declared in @theme (alias verified)';
  md += `| ${idx + 1} | \`${token}\` | ${count} | ${action} |\n`;
});

md += `\n---

## 4. Primitive Restyle Contract Violations (Sample)

| File | Line | Diagnostic Message |
|------|------|--------------------|
`;

for (const viol of contractViolations.slice(0, 15)) {
  md += `| \`${viol.file}\` | ${viol.line} | ${viol.message.replace(/\|/g, '\\|')} |\n`;
}

console.log('\n📊 Audit Complete:');
console.log(`- Files Scanned: ${totalFiles}`);
console.log(`- Files with Issues: ${filesWithIssues}`);
console.log(`- Total Errors: ${totalErrors}`);
console.log(`- Total Warnings: ${totalWarnings}`);
console.log('\nTop Rules:');
sortedRules.slice(0, 5).forEach(([rule, cnt]) => console.log(`  • ${rule}: ${cnt}`));
console.log('\nTop Directories:');
sortedDirs.slice(0, 5).forEach((d) => console.log(`  • ${d.dir}: ${d.total} issues (${d.errors} err, ${d.warnings} warn)`));

// Save output
const outputDir = path.resolve(process.cwd(), 'scratch');
mkdirSync(outputDir, { recursive: true });
writeFileSync(path.join(outputDir, 'audit_report.json'), JSON.stringify(results, null, 2));
writeFileSync(path.join(outputDir, 'design_system_audit_baseline.md'), md);

console.log(`\n✅ Saved audit report to scratch/design_system_audit_baseline.md`);
