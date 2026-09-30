import { readFileSync, writeFileSync } from 'node:fs';
import { globSync } from 'glob';
import path from 'node:path';

/**
 * Design System Autofix Codemod
 * Transforms recurring off-token classes into their Tailwind v4 theme scale equivalents.
 */

const REPLACEMENTS = [
  // Section & modal gaps
  { pattern: /\bgap-\[var\(--space-section(?:,\s*4rem)?\)\]/g, replacement: 'gap-section' },
  { pattern: /\bp-\[var\(--space-section(?:,\s*4rem)?\)\]/g, replacement: 'p-section' },
  
  // Radius tokens
  { pattern: /\brounded-\[var\(--radius-panel\)\]/g, replacement: 'rounded-panel' },
  { pattern: /\brounded-\[var\(--radius-card\)\]/g, replacement: 'rounded-card' },

  // Viewport dvh (when not protected by contract tests)
  // E.g. modal backdrop or full-screen overlays
  { pattern: /\bmin-h-\[100vh\]/g, replacement: 'min-h-screen' },

  // Typography tracking
  { pattern: /\btracking-\[0\.08em\]/g, replacement: 'tracking-widest' },
  
  // Spacing scales
  { pattern: /\bmin-h-\[18rem\]/g, replacement: 'min-h-72' },
  { pattern: /\bsm:min-h-\[19rem\]/g, replacement: 'sm:min-h-76' },
  { pattern: /\bmax-w-\[36rem\]/g, replacement: 'max-w-xl' },
  { pattern: /\bmax-w-\[42rem\]/g, replacement: 'max-w-2xl' },
  { pattern: /\bmax-w-\[1440px\]/g, replacement: 'max-w-360' },
  { pattern: /\bmax-w-\[420px\]/g, replacement: 'max-w-105' },
  { pattern: /\bmax-w-\[280px\]/g, replacement: 'max-w-70' },
];

console.log('✨ Running Design System Codemod on TSX/TS files...');

const files = globSync('**/*.{ts,tsx}', {
  ignore: ['node_modules/**', 'dist/**', 'android/**', 'coverage/**', 'scratch/**', '**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}'],
});

let modifiedFiles = 0;
let totalFixes = 0;

for (const file of files) {
  const fullPath = path.resolve(process.cwd(), file);
  const content = readFileSync(fullPath, 'utf8');
  let updated = content;
  let fileFixes = 0;

  for (const { pattern, replacement } of REPLACEMENTS) {
    const matches = updated.match(pattern);
    if (matches) {
      fileFixes += matches.length;
      updated = updated.replace(pattern, replacement);
    }
  }

  if (updated !== content) {
    writeFileSync(fullPath, updated, 'utf8');
    modifiedFiles++;
    totalFixes += fileFixes;
    console.log(`  ✓ ${file}: applied ${fileFixes} fixes`);
  }
}

console.log(`\n🎉 Codemod finished: applied ${totalFixes} token transformations across ${modifiedFiles} files.`);
