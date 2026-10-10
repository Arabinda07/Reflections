import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('good-css phase 3 contract', () => {
  it('enables interpolate-size: allow-keywords on :root in index.css', () => {
    const css = read('index.css');

    expect(css).toContain('interpolate-size: allow-keywords;');
  });

  it('defines native details::details-content transitions with allow-discrete in index.css', () => {
    const css = read('index.css');

    expect(css).toContain('details::details-content');
    expect(css).toContain('details[open]::details-content');
    expect(css).toContain('content-visibility 300ms allow-discrete');
  });

  it('sets scroll-padding-block-start and overscroll-behavior-y: none on html in index.css', () => {
    const css = read('index.css');

    expect(css).toContain('scroll-padding-block-start: calc(var(--header-height) + 1.25rem);');
    expect(css).toContain('overscroll-behavior-y: none;');
  });

  it('declares .safe-center and .scroll-contained utilities in index.css', () => {
    const css = read('index.css');

    expect(css).toContain('.safe-center');
    expect(css).toContain('justify-content: safe center;');
    expect(css).toContain('align-items: safe center;');
    expect(css).toContain('.scroll-contained');
    expect(css).toContain('overscroll-behavior: contain;');
    expect(css).toContain('scrollbar-gutter: stable;');
  });

  it('defines top-layer discrete transitions with @starting-style in index.css', () => {
    const css = read('index.css');

    expect(css).toContain('dialog,');
    expect(css).toContain('[popover]');
    expect(css).toContain('display 240ms allow-discrete');
    expect(css).toContain('overlay 240ms allow-discrete');
    expect(css).toContain('@starting-style');
  });

  it('applies scroll containment and gutter stability to modal-sheet.css', () => {
    const modalCss = read('components/ui/modal-sheet.css');

    expect(modalCss).toContain('.modal-sheet-body');
    expect(modalCss).toContain('overscroll-behavior: contain;');
    expect(modalCss).toContain('scrollbar-gutter: stable;');
  });

  it('documents viewport and scroll ergonomics in DESIGN.md', () => {
    const design = read('docs/brand/DESIGN.md');

    expect(design).toContain('## Viewport & Scroll Ergonomics');
    expect(design).toContain('Scroll Containment');
    expect(design).toContain('Sticky Header Clearance');
    expect(design).toContain('Native Disclosure Animations');
    expect(design).toContain('Desktop Bounce Elimination');
  });
});
