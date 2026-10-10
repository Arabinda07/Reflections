import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Note, LifeTheme } from '../types';
import { triageNoteTheme, extractThemeCandidateTitle } from './themeTriage';
import { embeddingService } from './embedding/embeddingService';
import { vectorStore } from './embedding/vectorStore';

const makeNote = (over: Partial<Note>): Note => ({
  id: over.id || 'note-1',
  title: over.title || 'Journal Entry',
  content: over.content || '<p>Default note text for test purposes that exceeds thirty characters easily.</p>',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

const makeTheme = (over: Partial<LifeTheme>): LifeTheme => ({
  id: over.id || 'theme-1',
  userId: over.userId || 'user-1',
  title: over.title || 'Creative Pursuits',
  content: over.content || 'Notes about writing, music, and art.',
  state: over.state || 'active',
  pageType: over.pageType || 'theme',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
});

describe('themeTriage', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('skips notes with fewer than 30 characters of plain text', async () => {
    const briefNote = makeNote({ content: '<p>Too short</p>' });
    const decision = await triageNoteTheme(briefNote, [makeTheme({})]);

    expect(decision.action).toBe('skip');
    expect(decision.reasoning).toContain('too brief');
  });

  it('appends to matching theme when cosine similarity is >= 0.52', async () => {
    const note = makeNote({
      content: '<p>Spent three hours painting watercolor landscapes and reflecting on color harmonies today.</p>',
    });
    const theme = makeTheme({ id: 'art-theme', title: 'Art & Creativity' });

    vi.spyOn(embeddingService, 'embedNote').mockResolvedValue(new Float32Array(384));
    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(384));
    vi.spyOn(vectorStore, 'cosineSimilarity').mockReturnValue(0.78);

    const decision = await triageNoteTheme(note, [theme]);

    expect(decision.action).toBe('append');
    expect(decision.themeId).toBe('art-theme');
    expect(decision.reasoning).toContain('78%');
    expect(decision.reasoning).toContain('Art & Creativity');
  });

  it('creates new theme when similarity < 0.38 and entry has >= 40 words', async () => {
    const longContent = Array(45).fill('mindfulness').join(' ');
    const note = makeNote({
      title: 'Vipassana Retreat Insights',
      content: `<p>${longContent}</p>`,
    });
    const theme = makeTheme({ id: 'work-theme', title: 'Corporate Work' });

    vi.spyOn(embeddingService, 'embedNote').mockResolvedValue(new Float32Array(384));
    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(384));
    vi.spyOn(vectorStore, 'cosineSimilarity').mockReturnValue(0.20);

    const decision = await triageNoteTheme(note, [theme]);

    expect(decision.action).toBe('create');
    expect(decision.newThemeTitle).toBe('Vipassana Retreat Insights');
    expect(decision.themeId).toBeNull();
  });

  it('skips when similarity is in middle range (0.45) without strong match', async () => {
    const note = makeNote({
      content: '<p>A standard reflective entry about balancing different aspects of daily life and routine.</p>',
    });
    const theme = makeTheme({});

    vi.spyOn(embeddingService, 'embedNote').mockResolvedValue(new Float32Array(384));
    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(384));
    vi.spyOn(vectorStore, 'cosineSimilarity').mockReturnValue(0.45);

    const decision = await triageNoteTheme(note, [theme]);

    expect(decision.action).toBe('skip');
    expect(decision.reasoning).toContain('Diffused concepts');
  });

  it('ignores archived themes during comparison', async () => {
    const note = makeNote({
      content: '<p>Working on the old consulting project archive documents.</p>',
    });
    const archivedTheme = makeTheme({ id: 'old-1', state: 'archived' });

    vi.spyOn(embeddingService, 'embedNote').mockResolvedValue(new Float32Array(384));
    const embedSpy = vi.spyOn(embeddingService, 'embedQuery');

    const decision = await triageNoteTheme(note, [archivedTheme]);

    expect(embedSpy).not.toHaveBeenCalled();
    expect(decision.action).toBe('skip');
  });

  it('gracefully handles embedding failures with skip decision', async () => {
    const note = makeNote({
      content: '<p>A substantial note that encounters a worker crash during embedding test.</p>',
    });
    vi.spyOn(embeddingService, 'embedNote').mockRejectedValue(new Error('Worker crashed'));

    const decision = await triageNoteTheme(note, [makeTheme({})]);

    expect(decision.action).toBe('skip');
    expect(decision.reasoning).toContain('unavailable');
  });

  describe('extractThemeCandidateTitle', () => {
    it('extracts first few words as candidate title', () => {
      const title = extractThemeCandidateTitle('Deep meditation practice and breathing techniques every morning');
      expect(title).toBe('Deep meditation practice and breathing');
    });

    it('falls back to default title for very short text', () => {
      const title = extractThemeCandidateTitle('Hi');
      expect(title).toBe('Emerging Life Pattern');
    });
  });
});
