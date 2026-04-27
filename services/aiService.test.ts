import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LifeTheme, Note } from '../types';
import { aiService } from './aiService';
import { aiClient } from './aiClient';
import { wikiService } from './wikiService';
import { absorbLogService } from './absorbLogService';

vi.mock('./aiClient', () => ({
  aiClient: {
    requestText: vi.fn(),
  },
}));

vi.mock('./wikiService', () => ({
  wikiService: {
    getUserThemes: vi.fn(),
    getAllWikiPages: vi.fn(),
    getWikiPage: vi.fn(),
    upsertWikiPage: vi.fn(),
  },
}));

vi.mock('./absorbLogService', () => ({
  absorbLogService: {
    needsReAbsorb: vi.fn(),
    logAbsorption: vi.fn(),
    logAbsorptions: vi.fn(),
  },
}));

const baseTheme = (overrides: Partial<LifeTheme> = {}): LifeTheme => ({
  id: 'theme-1',
  userId: 'user-1',
  title: 'Growth',
  content: 'I am learning to trust slow progress.',
  state: 'active',
  pageType: 'theme',
  createdAt: '2026-04-01T00:00:00.000Z',
  updatedAt: '2026-04-02T00:00:00.000Z',
  ...overrides,
});

const baseNote = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: 'Morning pages',
  content: '<p>Finding clarity in routine.</p>',
  createdAt: '2026-04-03T00:00:00.000Z',
  updatedAt: '2026-04-03T00:00:00.000Z',
  mood: 'calm',
  tags: ['clarity'],
  tasks: [],
  attachments: [],
  ...overrides,
});

describe('aiService.refreshWikiOnDemand', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(wikiService.getAllWikiPages).mockResolvedValue([]);
    vi.mocked(wikiService.getWikiPage).mockResolvedValue(null);
    vi.mocked(wikiService.upsertWikiPage).mockImplementation(async (pageType, title, content) =>
      baseTheme({
        id: `${pageType}-page`,
        title,
        content,
        pageType,
      }),
    );
    vi.mocked(aiClient.requestText).mockImplementation(async (action, payload) => {
      if (action === 'index') {
        return 'Fresh index';
      }

      return `${(payload as { title: string }).title} body`;
    });
  });

  it('refreshes the five Sanctuary pages from notes even when freeform themes exist', async () => {
    vi.mocked(wikiService.getUserThemes).mockResolvedValue([baseTheme()]);

    const refreshWikiOnDemand = (aiService as {
      refreshWikiOnDemand?: (notes: Note[]) => Promise<{ pageCount: number; source: string }>;
    }).refreshWikiOnDemand;

    expect(typeof refreshWikiOnDemand).toBe('function');
    if (typeof refreshWikiOnDemand !== 'function') return;

    const result = await refreshWikiOnDemand([baseNote()]);

    expect(result).toEqual({ pageCount: 5, source: 'notes' });
    expect(vi.mocked(aiClient.requestText)).toHaveBeenCalledWith(
      'wikiPage',
      expect.objectContaining({
        allThemeContent: expect.stringMatching(/Morning pages[\s\S]*Note id: note-1/),
      }),
    );
    expect(vi.mocked(wikiService.upsertWikiPage)).toHaveBeenCalledWith(
      'people',
      'People',
      'People body',
    );
    expect(vi.mocked(wikiService.upsertWikiPage)).not.toHaveBeenCalledWith(
      'mood_patterns',
      expect.any(String),
      expect.any(String),
    );
  });

  it('asks for inline note-id source markers and skips empty generated pages', async () => {
    vi.mocked(wikiService.getUserThemes).mockResolvedValue([]);
    vi.mocked(aiClient.requestText).mockImplementation(async (_action, payload) => {
      const title = (payload as { title: string }).title;
      return title === 'People' ? '' : `${title} body [source:note-1]`;
    });

    const refreshWikiOnDemand = (aiService as {
      refreshWikiOnDemand?: (notes: Note[]) => Promise<{ pageCount: number; source: string }>;
    }).refreshWikiOnDemand;

    expect(typeof refreshWikiOnDemand).toBe('function');
    if (typeof refreshWikiOnDemand !== 'function') return;

    const result = await refreshWikiOnDemand([baseNote()]);

    expect(result).toEqual({ pageCount: 4, source: 'notes' });
    expect(vi.mocked(aiClient.requestText)).toHaveBeenCalledWith(
      'wikiPage',
      expect.objectContaining({
        instruction: expect.stringContaining('[Source: note-id]'),
      }),
    );
    expect(vi.mocked(aiClient.requestText)).toHaveBeenCalledWith(
      'wikiPage',
      expect.objectContaining({
        allThemeContent: expect.not.stringContaining('<p>'),
      }),
    );
    expect(vi.mocked(wikiService.upsertWikiPage)).not.toHaveBeenCalledWith(
      'people',
      expect.any(String),
      expect.any(String),
    );
  });
});

describe('aiService.runGreatIngest', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(wikiService.getUserThemes).mockResolvedValue([]);
    vi.mocked(wikiService.getAllWikiPages).mockResolvedValue([]);
    vi.mocked(wikiService.getWikiPage).mockResolvedValue(null);
    vi.mocked(wikiService.upsertWikiPage).mockImplementation(async (pageType, title, content) =>
      baseTheme({
        id: `${pageType}-page`,
        title,
        content,
        pageType,
      }),
    );
    vi.mocked(absorbLogService.logAbsorptions).mockResolvedValue(undefined);
    vi.mocked(aiClient.requestText).mockImplementation(async (action, payload) => {
      if (action === 'index') return 'Fresh index';
      return `${(payload as { title: string }).title} body [Source: note-1]`;
    });
  });

  it('processes the first Smart Mode ingest in batches of five and reports progress', async () => {
    const progress = vi.fn();
    const notes = Array.from({ length: 12 }, (_, index) =>
      baseNote({
        id: `note-${index + 1}`,
        title: `Entry ${index + 1}`,
        createdAt: `2026-04-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
        updatedAt: `2026-04-${String(index + 1).padStart(2, '0')}T00:00:00.000Z`,
      }),
    );

    const result = await aiService.runGreatIngest(notes, { onProgress: progress });

    expect(result).toEqual({
      batchCount: 3,
      processedCount: 12,
      pageCount: 5,
      source: 'notes',
      totalCount: 12,
    });
    expect(progress).toHaveBeenLastCalledWith({
      batchCount: 3,
      batchIndex: 3,
      processedCount: 12,
      totalCount: 12,
    });
    expect(vi.mocked(absorbLogService.logAbsorptions)).toHaveBeenCalledTimes(3);
    expect(vi.mocked(aiClient.requestText)).toHaveBeenCalledWith(
      'wikiPage',
      expect.objectContaining({
        allThemeContent: expect.stringMatching(/Entry 12[\s\S]*Note id: note-12/),
      }),
    );
  });
});

describe('aiService.autoIngestSavedNote', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(wikiService.getUserThemes).mockResolvedValue([]);
    vi.mocked(wikiService.getAllWikiPages).mockResolvedValue([]);
    vi.mocked(wikiService.getWikiPage).mockResolvedValue(null);
    vi.mocked(wikiService.upsertWikiPage).mockImplementation(async (pageType, title, content) =>
      baseTheme({
        id: `${pageType}-page`,
        title,
        content,
        pageType,
      }),
    );
    vi.mocked(absorbLogService.logAbsorption).mockResolvedValue(undefined);
    vi.mocked(aiClient.requestText).mockImplementation(async (action, payload) => {
      if (action === 'index') return 'Fresh index';
      return `${(payload as { title: string }).title} body [Source: note-1]`;
    });
  });

  it('skips background ingest when the saved note hash has not changed', async () => {
    vi.mocked(absorbLogService.needsReAbsorb).mockResolvedValue(false);

    const result = await aiService.autoIngestSavedNote(baseNote(), [baseNote()]);

    expect(result).toEqual({
      pageCount: 0,
      skipped: true,
      source: 'none',
    });
    expect(vi.mocked(aiClient.requestText)).not.toHaveBeenCalledWith(
      'wikiPage',
      expect.anything(),
    );
  });

  it('refreshes the Sanctuary from the current note corpus and logs the saved note', async () => {
    const savedNote = baseNote({ id: 'saved-note', title: 'Saved entry' });
    vi.mocked(absorbLogService.needsReAbsorb).mockResolvedValue(true);

    const result = await aiService.autoIngestSavedNote(savedNote, [
      baseNote({ id: 'older-note', title: 'Older entry' }),
      savedNote,
    ]);

    expect(result).toEqual({
      pageCount: 5,
      skipped: false,
      source: 'notes',
    });
    expect(vi.mocked(aiClient.requestText)).toHaveBeenCalledWith(
      'wikiPage',
      expect.objectContaining({
        allThemeContent: expect.stringMatching(/Older entry[\s\S]*Saved entry/),
      }),
    );
    expect(vi.mocked(absorbLogService.logAbsorption)).toHaveBeenCalledWith(savedNote);
  });
});

describe('aiService.generateReflection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(wikiService.getAllWikiPages).mockResolvedValue([]);
    vi.mocked(wikiService.getWikiPage).mockResolvedValue(null);
  });

  it('returns a setup hint when the Gemini key is missing', async () => {
    vi.mocked(aiClient.requestText).mockRejectedValueOnce(
      new Error('GEMINI_API_KEY is not configured'),
    );

    const result = await aiService.generateReflection(baseNote());

    expect(result).toBe(
      "AI reflections aren't configured on this environment yet. Add GEMINI_API_KEY and try again.",
    );
  });
});
