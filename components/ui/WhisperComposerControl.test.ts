import { describe, expect, it } from 'vitest';
import { appendTranscriptToHtml } from './WhisperComposerControl';

describe('appendTranscriptToHtml', () => {
  it('appends final voice text without breaking existing paragraphs', () => {
    expect(appendTranscriptToHtml('<p>First thought.</p>', 'Second thought.')).toBe(
      '<p>First thought. Second thought.</p>',
    );
  });

  it('escapes transcript text before inserting it into editor HTML', () => {
    expect(appendTranscriptToHtml('', '<script>alert(1)</script>')).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
  });
});
