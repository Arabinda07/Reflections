import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('quill and chooser color contract', () => {
  it('keeps Quill Snow colors on Reflections tokens instead of fixed hex values', () => {
    const quill = read('components/ui/quill-snow.css');

    expect(quill).toContain('--ql-editor-text: var(--gray-text);');
    expect(quill).toContain('--ql-editor-link: var(--green);');
    expect(quill).toContain('--ql-editor-swatch-red: var(--clay);');
    expect(quill).toContain('background: var(--ql-editor-quote-bg);');
    expect(quill).toContain('box-shadow: inset 0 0 0 1px var(--ql-editor-quote-border);');
    expect(quill).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
    expect(quill).not.toContain('border-left: 4px solid');
  });

  it('keeps editor chooser surfaces off raw white and slate utilities', () => {
    const css = read('index.css');

    expect(css).toContain('--chip-shadow: oklch(from var(--border-color) l c h);');
    expect(css).toContain('--popover-bg: var(--panel-bg);');
    expect(css).toContain('background-color: var(--surface-current-control-bg);');
    expect(css).toContain('background-color: var(--popover-bg);');
    expect(css).not.toContain('--chip-shadow: #E5E5E5;');
    expect(css).not.toContain('--popover-bg: #1E1E1E;');
    expect(css).not.toContain('var(--popover-bg, #ffffff)');
    expect(css).not.toContain('dark:text-slate-300');
  });
});
