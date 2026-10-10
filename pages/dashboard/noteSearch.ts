import type { Note } from '../../types';
import { extractNotePlainText } from './noteContent';
import { vectorStore } from '../../services/embedding/vectorStore';
import { embeddingService } from '../../services/embedding/embeddingService';

export interface ScoredNoteSearchResult {
  note: Note;
  score: number;
  matchType: 'exact' | 'keyword' | 'semantic' | 'hybrid';
  similarity?: number;
}

export interface HybridSearchOptions {
  topK?: number;
  keywordWeight?: number; // default 0.45
  semanticWeight?: number; // default 0.55
  minSemanticScore?: number; // default 0.28
}

/**
 * In-memory synchronous note search. Notes arrive already decrypted from `noteService.getAll()`,
 * so we match the query (case-insensitive) against title, plain-text content, and tags.
 * An empty query returns the list unchanged (callers show it as "recent").
 */
export const searchNotes = (notes: Note[], query: string): Note[] => {
  const needle = query.trim().toLowerCase();
  if (!needle) return notes;

  return notes.filter((note) => {
    const haystack = [
      note.title,
      extractNotePlainText(note.content || ''),
      ...(note.tags || []),
    ]
      .join(' ')
      .toLowerCase();

    return haystack.includes(needle);
  });
};

interface KeywordMatch {
  score: number;
  isExact: boolean;
}

const computeKeywordScores = (notes: Note[], query: string): Map<string, KeywordMatch> => {
  const needle = query.trim().toLowerCase();
  const tokens = needle.split(/\s+/).filter(Boolean);
  const scores = new Map<string, KeywordMatch>();

  for (const note of notes) {
    const titleLower = (note.title || '').toLowerCase();
    const plainText = extractNotePlainText(note.content || '').toLowerCase();
    const tagsLower = (note.tags || []).map((t) => t.toLowerCase());
    const haystack = [titleLower, plainText, ...tagsLower].join(' ');

    let score = 0;
    let isExact = false;

    if (titleLower === needle) {
      score = 1.0;
      isExact = true;
    } else if (titleLower.startsWith(needle)) {
      score = Math.max(score, 0.85);
    } else if (titleLower.includes(needle)) {
      score = Math.max(score, 0.75);
    }

    if (tagsLower.includes(needle)) {
      score = Math.max(score, 0.8);
    } else if (tagsLower.some((t) => t.includes(needle))) {
      score = Math.max(score, 0.65);
    }

    if (plainText.includes(needle)) {
      score = Math.max(score, 0.55);
    }

    if (tokens.length > 1) {
      let matchedTokens = 0;
      for (const tok of tokens) {
        if (haystack.includes(tok)) matchedTokens += 1;
      }
      if (matchedTokens === tokens.length) {
        score = Math.max(score, 0.65);
      } else if (matchedTokens > 0) {
        const partial = (matchedTokens / tokens.length) * 0.45;
        score = Math.max(score, partial);
      }
    }

    if (score > 0) {
      scores.set(note.id, { score, isExact });
    }
  }

  return scores;
};

const blendScores = (
  notes: Note[],
  keywordScores: Map<string, KeywordMatch>,
  semanticScores: Map<string, number>,
  options?: HybridSearchOptions
): ScoredNoteSearchResult[] => {
  const kwWeight = options?.keywordWeight ?? 0.45;
  const semWeight = options?.semanticWeight ?? 0.55;

  const results: ScoredNoteSearchResult[] = [];

  for (const note of notes) {
    const kw = keywordScores.get(note.id);
    const sem = semanticScores.get(note.id);

    const kwScore = kw ? kw.score : 0;
    const semScore = sem ?? 0;

    if (kwScore === 0 && semScore === 0) continue;

    let matchType: ScoredNoteSearchResult['matchType'];
    let combinedScore: number;

    if (kw?.isExact) {
      matchType = 'exact';
      combinedScore = 1.0 + semScore * 0.1;
    } else if (kwScore > 0 && semScore > 0) {
      matchType = 'hybrid';
      combinedScore = kwScore * kwWeight + semScore * semWeight;
    } else if (kwScore > 0) {
      matchType = 'keyword';
      combinedScore = kwScore * kwWeight;
    } else {
      matchType = 'semantic';
      combinedScore = semScore * semWeight;
    }

    results.push({
      note,
      score: combinedScore,
      matchType,
      similarity: semScore > 0 ? semScore : undefined,
    });
  }

  results.sort((a, b) => {
    if (Math.abs(b.score - a.score) > 0.001) {
      return b.score - a.score;
    }
    const bTime = new Date(b.note.updatedAt || b.note.createdAt).getTime();
    const aTime = new Date(a.note.updatedAt || a.note.createdAt).getTime();
    return bTime - aTime;
  });

  if (options?.topK && options.topK > 0) {
    return results.slice(0, options.topK);
  }

  return results;
};

/**
 * Asynchronous hybrid search combining keyword matching
 * with cosine vector similarity from IndexedDB.
 */
export const searchNotesHybrid = async (
  notes: Note[],
  query: string,
  options?: HybridSearchOptions
): Promise<ScoredNoteSearchResult[]> => {
  const trimmed = query.trim();
  if (!trimmed) {
    const all = notes.map((note) => ({
      note,
      score: 1.0,
      matchType: 'exact' as const,
    }));
    return options?.topK && options.topK > 0 ? all.slice(0, options.topK) : all;
  }

  const keywordScores = computeKeywordScores(notes, trimmed);
  const minSemanticScore = options?.minSemanticScore ?? 0.28;

  const semanticScores = new Map<string, number>();
  try {
    const queryVector = await embeddingService.embedQuery(trimmed);
    if (queryVector && queryVector.length > 0 && queryVector.some((v) => v !== 0)) {
      const storedVectors = await vectorStore.getAll();
      for (const record of storedVectors) {
        if (record.dimension !== queryVector.length) continue;
        const sim = vectorStore.cosineSimilarity(queryVector, record.vector);
        if (sim >= minSemanticScore) {
          semanticScores.set(record.noteId, sim);
        }
      }
    }
  } catch {
    // Graceful fallback to pure keyword scoring
  }

  return blendScores(notes, keywordScores, semanticScores, options);
};
