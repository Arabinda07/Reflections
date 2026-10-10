import { describe, it, expect, vi, beforeEach } from 'vitest';
import { wikiRagService, WIKI_CHAPTER_SEMANTIC_SEEDS } from './wikiRagService';
import { embeddingService } from './embedding/embeddingService';
import { vectorStore } from './embedding/vectorStore';
import type { Note } from '../types';

const makeTestNote = (id: string, title: string, content: string, daysAgo: number = 0): Note => ({
  id,
  title,
  content,
  createdAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  updatedAt: new Date(Date.now() - daysAgo * 86400000).toISOString(),
  tags: ['test'],
  mood: 'reflective',
});

describe('wikiRagService', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('defines semantic query seeds for all major structured wiki chapters', () => {
    expect(WIKI_CHAPTER_SEMANTIC_SEEDS.people).toContain('friendships');
    expect(WIKI_CHAPTER_SEMANTIC_SEEDS.patterns).toContain('patterns');
    expect(WIKI_CHAPTER_SEMANTIC_SEEDS.philosophies).toContain('philosophies');
    expect(WIKI_CHAPTER_SEMANTIC_SEEDS.eras).toContain('transitions');
  });

  it('returns all notes when note count is less than or equal to topK', async () => {
    const notes = [
      makeTestNote('1', 'Note 1', 'Content 1'),
      makeTestNote('2', 'Note 2', 'Content 2'),
    ];

    const result = await wikiRagService.retrieveChapterExcerpts('people', notes, 10);
    expect(result.selectedNotes.length).toBe(2);
    expect(result.selectedNotes.map((n) => n.id)).toEqual(expect.arrayContaining(['1', '2']));
  });

  it('ranks and prioritizes semantically relevant notes from vector store', async () => {
    const notes = [
      makeTestNote('1', 'Random grocery list', 'Bought milk and apples', 1),
      makeTestNote('2', 'Best friend conversation', 'Deep discussion with Rahul about trust and support', 2),
      makeTestNote('3', 'Another chore', 'Cleaned the garage', 3),
      makeTestNote('4', 'Relationship reflection', 'Thinking about my parents and gratitude for family', 4),
    ];

    // Mock embeddingService and vectorStore
    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(256).fill(0.5));
    vi.spyOn(vectorStore, 'findSimilar').mockResolvedValue([
      { noteId: '2', score: 0.88 },
      { noteId: '4', score: 0.75 },
    ]);

    const result = await wikiRagService.retrieveChapterExcerpts('people', notes, 2);
    expect(result.selectedNotes.length).toBe(2);
    expect(result.selectedNotes[0].id).toBe('2');
    expect(result.selectedNotes[1].id).toBe('4');
    expect(result.semanticMatchCount).toBe(2);
  });

  it('pads with recent notes if semantic matches are fewer than topK', async () => {
    const notes = [
      makeTestNote('1', 'Recent note 1', 'Recent thoughts', 1),
      makeTestNote('2', 'Recent note 2', 'Recent thoughts', 2),
      makeTestNote('3', 'Relevant friend note', 'Deep talk with friend', 10),
    ];

    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(256).fill(0.5));
    vi.spyOn(vectorStore, 'findSimilar').mockResolvedValue([
      { noteId: '3', score: 0.85 },
    ]);

    const result = await wikiRagService.retrieveChapterExcerpts('people', notes, 3);
    expect(result.selectedNotes.length).toBe(3);
    // Relevant note is included first, followed by padded recent notes
    expect(result.selectedNotes[0].id).toBe('3');
    expect(result.selectedNotes.map((n) => n.id)).toContain('1');
    expect(result.selectedNotes.map((n) => n.id)).toContain('2');
    expect(result.semanticMatchCount).toBe(1);
  });

  it('buildChapterRagCorpus produces a valid NotesCorpus with restricted sourceNoteIds', async () => {
    const notes = [
      makeTestNote('1', 'Friendship reflections', 'Rahul has been my closest anchor.', 1),
      makeTestNote('2', 'Unrelated errand', 'Checked car tire pressure.', 2),
    ];

    vi.spyOn(embeddingService, 'embedQuery').mockResolvedValue(new Float32Array(256).fill(0.5));
    vi.spyOn(vectorStore, 'findSimilar').mockResolvedValue([
      { noteId: '1', score: 0.9 },
    ]);

    const ragResult = await wikiRagService.buildChapterRagCorpus('people', notes, 1);
    expect(ragResult.pageType).toBe('people');
    expect(ragResult.corpus.noteCount).toBe(1);
    expect(ragResult.corpus.sourceNoteIds).toEqual(['1']);
    expect(ragResult.corpus.text).toContain('Friendship reflections');
    expect(ragResult.corpus.text).not.toContain('tire pressure');
  });
});
