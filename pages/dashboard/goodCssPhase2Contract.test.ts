import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('good-css phase 2 contract', () => {
  it('defines concentric radius tokens and radius-concentric utility in index.css', () => {
    const css = read('index.css');

    expect(css).toContain('--radius-concentric-panel: max(0px, calc(var(--radius-panel) - var(--space-4)));');
    expect(css).toContain('--radius-concentric-control: max(0px, calc(var(--radius-control) - var(--space-2)));');
    expect(css).toContain('.radius-concentric {');
    expect(css).toContain('border-radius: var(--radius-concentric-panel);');
  });

  it('documents concentric nested radius rule in DESIGN.md', () => {
    const design = read('docs/brand/DESIGN.md');

    expect(design).toContain('Concentric Nested Radii Formula');
    expect(design).toContain('inner-radius = max(0px, outer-radius - padding)');
  });

  it('declares zero-repaint shadow fading via .surface-lift-fade and ::after opacity', () => {
    const css = read('index.css');

    expect(css).toContain('.surface-lift-fade');
    expect(css).toContain('.surface-lift-fade::after');
    expect(css).toContain('box-shadow: var(--shadow-floating)');
    expect(css).toContain('transition: opacity');
  });

  it('declares optical label trimming under @supports for buttons, chips, and pills', () => {
    const css = read('index.css');

    expect(css).toContain('@supports (text-box: trim-both cap alphabetic)');
    expect(css).toContain('text-box: trim-both cap alphabetic');
    expect(css).toContain('.btn-primary');
    expect(css).toContain('.metadata-pill');
    expect(css).toContain('.chip');
  });

  it('declares subgrid 3-row layout utilities under @supports', () => {
    const css = read('index.css');

    expect(css).toContain('.grid-subgrid-3');
    expect(css).toContain('@supports (grid-template-rows: subgrid)');
    expect(css).toContain('.grid-subgrid-parent-3');
    expect(css).toContain('grid-template-rows: subgrid');
  });

  it('applies subgrid row alignment and tabular numbers to ProUpgradeCTA and MyNotes', () => {
    const cta = read('components/ui/ProUpgradeCTA.tsx');
    const myNotes = read('pages/dashboard/MyNotes.tsx');

    expect(cta).toContain('grid-subgrid-parent-3');
    expect(cta).toContain('tabular-nums');
    expect(myNotes).toContain('tabular-nums');
  });
});
