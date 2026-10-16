import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('quill and chooser color contract', () => {
  it('keeps Quill editor overrides on Reflections tokens instead of fixed hex values', () => {
    const quill = read('components/ui/quill-bubble.css');

    expect(quill).not.toMatch(/#[0-9A-Fa-f]{3,8}/);
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

  it('keeps the Create Note writing surface quiet while preserving control focus states', () => {
    const css = read('index.css');
    const quill = read('components/ui/quill-bubble.css');

    expect(quill).toContain('.note-editor .ql-bubble .ql-toolbar button:focus-visible');

    expect(css).toContain('.editor-title-input:focus-visible');
    expect(css).toContain('.note-editor [contenteditable]:focus-visible');
    expect(css).toContain('caret-color: var(--green);');
    expect(css).toContain('box-shadow: none;');
  });
});
