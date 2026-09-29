import { readdirSync, readFileSync, statSync, writeFileSync, mkdirSync } from 'node:fs';
import path from 'node:path';

console.log('🔍 Running Reflections Design System Contrast & Visual Issue Audit...');

// Canonical OKLCH Lightness thresholds from index.css:
// WCAG AA requires contrast ratio >= 4.5:1 for normal text, >= 3.0:1 for large text/placeholders
const THEME = {
  light: {
    bg: 0.99,
    panel: 0.98,
    textPrimary: 0.25,
    textSecondary: 0.43,
    navText: 0.46,
    border: 0.92,
    green: 0.47,
  },
  dark: {
    bg: 0.18,
    panel: 0.22,
    textPrimary: 0.85,
    textSecondary: 0.65,
    navText: 0.70,
    border: 0.25, // Deadly if used for text on dark bg!
    green: 0.68,
  }
};

// Simple relative luminance approx from OKLCH Lightness: Lr ~ L^3
function oklchLightnessToLum(L) {
  return Math.pow(L, 3);
}

function contrastRatio(L1, L2) {
  const y1 = oklchLightnessToLum(L1);
  const y2 = oklchLightnessToLum(L2);
  const brighter = Math.max(y1, y2);
  const darker = Math.min(y1, y2);
  return (brighter + 0.05) / (darker + 0.05);
}

const DIRS_TO_SCAN = ['components', 'pages', 'layouts'];

function getAllFiles(dir, exts = ['.tsx', '.ts']) {
  let files = [];
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== '__tests__') {
          files = files.concat(getAllFiles(fullPath, exts));
        }
      } else if (exts.includes(path.extname(entry.name)) && !entry.name.endsWith('.test.ts') && !entry.name.endsWith('.test.tsx')) {
        files.push(fullPath);
      }
    }
  } catch (e) {
    // skip unreadable
  }
  return files;
}

const issues = [];

for (const dir of DIRS_TO_SCAN) {
  const files = getAllFiles(path.resolve(process.cwd(), dir));
  for (const file of files) {
    const relativePath = path.relative(process.cwd(), file).replace(/\\/g, '/');
    const content = readFileSync(file, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const lineNum = idx + 1;

      // 1. Check for text-border or dark:text-border
      if (line.includes('text-border') && !line.includes('hover:border') && !line.includes('FileText')) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'CRITICAL_CONTRAST',
          detail: 'Uses `text-border` for typography (border color has <1.3:1 contrast against surface)',
          snippet: line.trim()
        });
      }

      // 2. Check for extreme text opacity reductions (e.g. text-.../20, text-.../30, text-.../35)
      const opacityMatch = line.match(/(text|placeholder):[a-zA-Z-]+(?:\/|\s+\/\s*)([0-4][0-9]|10|15|20|25|30|35)\b/);
      if (opacityMatch && !line.includes('hover:')) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'LOW_OPACITY_TEXT',
          detail: `Excessive opacity attenuation on text/placeholder (\`${opacityMatch[0]}\`). Risks WCAG AA failure in dark mode.`,
          snippet: line.trim()
        });
      }

      // 3. Check for Button contract evasion: <Button ...><span className="text-...">
      if (line.includes('<span className="text-green"') || line.includes('<span className="text-clay"')) {
        // check surrounding lines for <Button
        const context = lines.slice(Math.max(0, idx - 4), idx + 1).join(' ');
        if (context.includes('<Button')) {
          issues.push({
            file: relativePath,
            line: lineNum,
            type: 'BUTTON_EVASION',
            detail: 'Nests colored `<span>` inside `<Button>` bypassing contract & interaction states',
            snippet: line.trim()
          });
        }
      }

      // 4. Check for arbitrary dark: background or text colors
      const darkColorMatch = line.match(/dark:(text|bg)-(zinc|slate|gray-[0-9]+|white\/[0-9]+)/);
      if (darkColorMatch) {
        issues.push({
          file: relativePath,
          line: lineNum,
          type: 'AD_HOC_DARK_TOKEN',
          detail: `Uses non-tokenized dark utility \`${darkColorMatch[0]}\` instead of semantic OKLCH CSS variables`,
          snippet: line.trim()
        });
      }
    });
  }
}

console.log(`\nScan Complete. Found ${issues.length} potential issues across codebase.`);

// Group by type
const byType = {};
for (const iss of issues) {
  byType[iss.type] = (byType[iss.type] || []);
  byType[iss.type].push(iss);
}

for (const [t, items] of Object.entries(byType)) {
  console.log(`  • ${t}: ${items.length} occurrences`);
}

// Generate Markdown report
let md = `# Visual & Contrast Static Audit Report\n\n`;
md += `**Date:** ${new Date().toISOString()}  \n`;
md += `**Total Issues Flagged:** ${issues.length}\n\n`;

for (const [t, items] of Object.entries(byType)) {
  md += `## ${t} (${items.length})\n\n`;
  md += `| File | Line | Detail | Snippet |\n`;
  md += `| :--- | :--- | :----- | :------ |\n`;
  for (const item of items) {
    const safeSnippet = item.snippet.replace(/\|/g, '\\|').slice(0, 80);
    md += `| \`${item.file}\` | ${item.line} | ${item.detail} | \`${safeSnippet}...\` |\n`;
  }
  md += `\n`;
}

const outDir = path.resolve(process.cwd(), 'scratch');
mkdirSync(outDir, { recursive: true });
writeFileSync(path.join(outDir, 'contrast_audit_report.md'), md);
console.log(`\n✅ Saved audit report to scratch/contrast_audit_report.md`);
