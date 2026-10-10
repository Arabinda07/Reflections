import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('good-css phase 1 contract', () => {
  it('guards hover-sensitive surface transitions with fine pointer queries and resets touch hover transforms', () => {
    const css = read('index.css');

    expect(css).toContain('@media (hover: hover) and (pointer: fine)');
    expect(css).toContain('@media (hover: none), (pointer: coarse)');
    expect(css).toContain('.surface-floating:hover');
    expect(css).toContain('.surface-floating--media:hover');
  });

  it('declares modern native utilities for auto-growing textareas and 44px hit expansion', () => {
    const css = read('index.css');

    expect(css).toContain('.textarea-auto-grow');
    expect(css).toContain('field-sizing: content');
    expect(css).toContain('.hit-target-expanded');
    expect(css).toContain('min-inline-size: 44px');
    expect(css).toContain('min-block-size: 44px');
  });

  it('declares native :user-invalid form feedback targeting semantic clay token', () => {
    const css = read('index.css');

    expect(css).toContain(':where(input, select, textarea):user-invalid');
    expect(css).toContain('border-color: var(--clay)');
  });

  it('uses overflow-clip instead of overflow-hidden on non-scrolling UI components', () => {
    const emptyState = read('components/ui/EmptyState.tsx');
    const driftCard = read('components/ui/MindsetDriftCard.tsx');
    const badge = read('components/ui/InlineLoadingBadge.tsx');
    const gate = read('components/auth/PrivateDataGate.tsx');

    expect(emptyState).toContain('className="overflow-clip"');
    expect(driftCard).toContain('overflow-clip rounded-full bg-surface-muted flex');
    expect(badge).toContain('overflow-clip rounded-full bg-green/8');
    expect(gate).toContain('overflow-clip rounded-full bg-surface-muted');
  });

  it('applies hit-target-expanded and textarea-auto-grow to target interfaces', () => {
    const ambientButton = read('components/ui/AmbientMusicButton.tsx');
    const relProfile = read('pages/dashboard/RelationshipProfile.tsx');
    const releaseMode = read('pages/dashboard/ReleaseMode.tsx');

    expect(ambientButton).toContain('audio-floating-button hit-target-expanded');
    expect(relProfile).toContain('textarea-auto-grow');
    expect(releaseMode).toContain('textarea-auto-grow');
  });
});
