import { describe, expect, it } from 'vitest';
import { validateAiRequest, validateIngestDecision } from './aiContracts';

describe('aiContracts', () => {
  it('rejects unknown actions and malformed action payloads', () => {
    expect(validateAiRequest({ action: 'unknown', payload: {} })).toEqual({
      ok: false,
      error: 'Invalid AI action',
    });
    expect(validateAiRequest({ action: 'wikiPage', payload: { title: 'People' } })).toEqual({
      ok: false,
      error: 'Invalid wikiPage payload',
    });
    expect(validateAiRequest({ action: 'tags', payload: { content: 12 } })).toEqual({
      ok: false,
      error: 'Invalid tags payload',
    });
  });

  it('accepts valid action-specific payloads', () => {
    const result = validateAiRequest({
      action: 'wikiPage',
      payload: {
        title: 'People',
        instruction: 'Use sources.',
        allThemeContent: 'Note id: note-1',
      },
    });

    expect(result.ok).toBe(true);
  });

  it('rejects ingest decisions that point to unknown themes', () => {
    expect(
      validateIngestDecision(
        { action: 'append', themeId: 'theme-2', newThemeTitle: null, reasoning: 'Looks related.' },
        ['theme-1'],
      ),
    ).toEqual({ ok: false, error: 'AI selected an unknown theme' });
  });
});
