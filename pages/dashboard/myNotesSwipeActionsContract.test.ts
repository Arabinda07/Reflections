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

  it('requires horizontal swipe intent before revealing note actions', () => {
    const source = fs.readFileSync('pages/dashboard/MyNotes.tsx', 'utf8');

    expect(source).toContain('const NOTE_SWIPE_OPEN_THRESHOLD = 72;');
    expect(source).toContain('const NOTE_SWIPE_AXIS_INTENT_RATIO = 1.25;');
    expect(source).toContain('swipeStartYRef');
    expect(source).toContain('const deltaY = event.clientY - swipeStartYRef.current;');
    expect(source).toContain(
      'const hasHorizontalIntent = Math.abs(deltaX) > Math.abs(deltaY) * NOTE_SWIPE_AXIS_INTENT_RATIO;',
    );
    expect(source).toContain('if (hasHorizontalIntent && deltaX < -NOTE_SWIPE_OPEN_THRESHOLD)');
    expect(source).toContain('} else if (hasHorizontalIntent && deltaX > NOTE_SWIPE_CLOSE_THRESHOLD)');
  });
});
