import { describe, expect, it } from 'vitest';
import { validateWikiPageOutput } from './aiOutputValidation';

describe('validateWikiPageOutput', () => {
  it('accepts source-grounded safe markdown', () => {
    const result = validateWikiPageOutput(
      '## People\nA recurring collaborator appears around hard weeks. [Source: note-1]',
      { allowedSourceIds: ['note-1'] },
    );

    expect(result.ok).toBe(true);
  });

  it('rejects pages without source markers', () => {
    const result = validateWikiPageOutput('A claim without a citation.', {
      allowedSourceIds: ['note-1'],
    });

    expect(result).toEqual({ ok: false, reason: 'missing_source_markers' });
  });

  it('rejects fake source ids, diagnostic language, raw HTML, and oversized output', () => {
    expect(validateWikiPageOutput('Claim. [Source: fake-note]', { allowedSourceIds: ['note-1'] })).toEqual({
      ok: false,
      reason: 'unknown_source_id:fake-note',
    });
    expect(validateWikiPageOutput('This suggests depression. [Source: note-1]', { allowedSourceIds: ['note-1'] })).toEqual({
      ok: false,
      reason: 'diagnostic_language:depression',
    });
    expect(validateWikiPageOutput('<script>alert(1)</script> [Source: note-1]', { allowedSourceIds: ['note-1'] })).toEqual({
      ok: false,
      reason: 'unsafe_markdown',
    });
    expect(validateWikiPageOutput(`${'word '.repeat(430)}[Source: note-1]`, { allowedSourceIds: ['note-1'], maxWords: 20 })).toEqual({
      ok: false,
      reason: 'too_long',
    });
  });
});
