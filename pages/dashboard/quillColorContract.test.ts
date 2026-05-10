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

  it('keeps the Create Note writing surface quiet while preserving control focus states', () => {
    const css = read('index.css');
    const quill = read('components/ui/quill-snow.css');

    expect(quill).toContain('@media (min-width: 641px) and (pointer: fine)');
    expect(quill).toContain('width: 32px;');
    expect(quill).toContain('height: 32px;');
    expect(quill).toContain('stroke-width: 1.65;');
    expect(quill).toContain('padding: 0 0 16px !important;');
    expect(quill).not.toContain('border-bottom: 1px solid var(--border-color) !important;');
    expect(quill).toContain('.note-editor .ql-toolbar.ql-snow button:focus-visible');
    expect(quill).toContain('color: var(--green) !important;');

    expect(css).toContain('.editor-title-input:focus-visible');
    expect(css).toContain('.note-editor [contenteditable]:focus-visible');
    expect(css).toContain('caret-color: var(--green);');
    expect(css).toContain('box-shadow: none;');
  });
});
