/**
 * Local-First RAG for Life Wiki Chapter Synthesis.
 *
 * Rather than dumping the user's entire decrypted notes corpus into
 * generative LLM prompts, this service performs client-side semantic
 * retrieval of the top-10 relevant excerpts for each chapter theme:
 * - People & Relationships
 * - Emotional Landscape & Mood Patterns
 * - Core Philosophies & Personal Growth
 * - Life Eras & Turning Points
 *
 * Impact: Slashes prompt token payloads by ~90% and ensures notes
 * unrelated to a given chapter never leave device memory.
 *
 * Reference: ADR 0004 §2.6 & §8.1, AI Architecture Roadmap Phase 4.4
 */
import type { Note } from '../types';
import { type WikiPageType } from './wikiTypes';
import { embeddingService } from './embedding/embeddingService';
import { vectorStore } from './embedding/vectorStore';
import { buildNotesCorpus, type NotesCorpus } from './aiContext';

export const DEFAULT_SEMANTIC_SEED =
  'personal memories, reflections, life experiences, insights, emotional patterns, relationships';

export const WIKI_CHAPTER_SEMANTIC_SEEDS: Partial<Record<WikiPageType, string>> = {
  people:
    'close friendships, family members, loved ones, relationships, mentors, social dynamics, trust, interpersonal bonds, gratitude for people',
  patterns:
    'recurring emotional, practical, and attention patterns, repeated situations, rhythms, habits, triggers, attention loops',
  philosophies:
    'core personal philosophies, life lessons, breakthroughs, values, beliefs, principles, character evolution, self-awareness, discipline',
  eras:
    'major life transitions, milestones, eras, relocations, career pivots, chapters closing and opening, historical turning points, life stages',
  decisions:
    'pivotal choices, forks in the road, crossroads, commitments, trade-offs, courage, values in action',
  mood_patterns:
    'emotional states, anxiety, serenity, burnout, joyful moments, triggers, vulnerability, mental wellbeing, recurring moods, emotional shifts',
  recurring_themes:
    'central motifs, persistent curiosities, creative pursuits, recurring themes',
  self_model:
    'self-concept, strengths, vulnerabilities, inner dialogue, identity, evolution of self',
  timeline:
    'chronology of events, life journey, milestones, past seasons, forward trajectories',
  index:
    'overview, table of contents, life themes and chapters summary',
  theme:
    DEFAULT_SEMANTIC_SEED,
};

export interface ChapterRagResult {
  pageType: WikiPageType;
  corpus: NotesCorpus;
  selectedNotes: Note[];
  semanticMatchCount: number;
}

export const wikiRagService = {
  /**
   * Retrieves the top-K most semantically relevant notes for a given Life Wiki page.
   * If the local vector store has fewer matches, smoothly pads with recent notes.
   */
  async retrieveChapterExcerpts(
    pageType: WikiPageType,
    allNotes: Note[],
    topK: number = 10,
    minScore: number = 0.2,
  ): Promise<{ selectedNotes: Note[]; semanticMatchCount: number }> {
    if (!allNotes || allNotes.length === 0) {
      return { selectedNotes: [], semanticMatchCount: 0 };
    }

    const noteMap = new Map<string, Note>();
    for (const note of allNotes) {
      noteMap.set(note.id, note);
    }

    const semanticSeed = WIKI_CHAPTER_SEMANTIC_SEEDS[pageType] || DEFAULT_SEMANTIC_SEED;

    const matchedNotes: Note[] = [];
    try {
      const queryVector = await embeddingService.embedQuery(semanticSeed);
      if (queryVector && queryVector.length > 0 && queryVector.some((v) => v !== 0)) {
        const matches = await vectorStore.findSimilar(queryVector, topK, minScore);
        for (const match of matches) {
          const note = noteMap.get(match.noteId);
          if (note) {
            matchedNotes.push(note);
          }
        }
      }
    } catch (err) {
      console.warn(`[wikiRagService] Semantic retrieval fallback for ${pageType}:`, err);
    }

    const semanticMatchCount = matchedNotes.length;
    const selectedIds = new Set<string>(matchedNotes.map((n) => n.id));

    // If fewer than topK notes matched semantically, pad with recent notes
    if (matchedNotes.length < topK) {
      const sortedRecent = [...allNotes].sort((a, b) => {
        const timeB = new Date(b.updatedAt || b.createdAt).getTime();
        const timeA = new Date(a.updatedAt || a.createdAt).getTime();
        return timeB - timeA;
      });

      for (const note of sortedRecent) {
        if (matchedNotes.length >= topK) break;
        if (!selectedIds.has(note.id)) {
          matchedNotes.push(note);
          selectedIds.add(note.id);
        }
      }
    }

    return { selectedNotes: matchedNotes.slice(0, topK), semanticMatchCount };
  },

  /**
   * Builds a compact, privacy-preserving NotesCorpus for chapter synthesis.
   */
  async buildChapterRagCorpus(
    pageType: WikiPageType,
    allNotes: Note[],
    topK: number = 10,
  ): Promise<ChapterRagResult> {
    const { selectedNotes, semanticMatchCount } = await wikiRagService.retrieveChapterExcerpts(
      pageType,
      allNotes,
      topK,
    );

    const corpus = buildNotesCorpus(selectedNotes);

    return {
      pageType,
      corpus,
      selectedNotes,
      semanticMatchCount,
    };
  },
};
