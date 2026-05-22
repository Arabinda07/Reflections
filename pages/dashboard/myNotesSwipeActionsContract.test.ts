import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

describe('MyNotes swipe actions contract', () => {
  it('keeps hidden swipe rail actions out of keyboard focus and activation', () => {
    const source = fs.readFileSync('pages/dashboard/MyNotes.tsx', 'utf8');

    expect(source).toContain('data-swipe-action-rail');
    expect(source).toContain('aria-hidden={!isSwipedOpen}');
    expect(source).toContain('tabIndex={isSwipedOpen ? 0 : -1}');
    expect(source).toContain('disabled={!isSwipedOpen}');
  });
});
