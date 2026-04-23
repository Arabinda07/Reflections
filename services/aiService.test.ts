import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { LifeTheme, Note } from '../types';
import { aiService } from './aiService';
import { aiClient } from './aiClient';
import { wikiService } from './wikiService';

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

  it('refreshes structured pages from existing freeform themes when they exist', async () => {
    vi.mocked(wikiService.getUserThemes).mockResolvedValue([baseTheme()]);

    const refreshWikiOnDemand = (aiService as {
      refreshWikiOnDemand?: (notes: Note[]) => Promise<{ pageCount: number; source: string }>;
    }).refreshWikiOnDemand;

    expect(typeof refreshWikiOnDemand).toBe('function');
    if (typeof refreshWikiOnDemand !== 'function') return;

    const result = await refreshWikiOnDemand([baseNote()]);

    expect(result).toEqual({ pageCount: 4, source: 'themes' });
    expect(vi.mocked(aiClient.requestText)).toHaveBeenCalledWith(
      'wikiPage',
      expect.objectContaining({
        allThemeContent: expect.stringContaining('## Growth'),
      }),
    );
    expect(vi.mocked(wikiService.upsertWikiPage)).toHaveBeenCalledWith(
      'mood_patterns',
      'Mood Patterns',
      'Mood Patterns body',
    );
  });

  it('builds structured pages from notes when no freeform themes exist yet', async () => {
    vi.mocked(wikiService.getUserThemes).mockResolvedValue([]);

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
        allThemeContent: expect.stringContaining('Morning pages'),
      }),
    );
    expect(vi.mocked(aiClient.requestText)).toHaveBeenCalledWith(
      'wikiPage',
      expect.objectContaining({
        allThemeContent: expect.not.stringContaining('<p>'),
      }),
    );
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
