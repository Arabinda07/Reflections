import type { Note, LifeTheme } from '../types';
import type { IngestDecision } from './aiContracts';
import { embeddingService } from './embedding/embeddingService';
import { vectorStore } from './embedding/vectorStore';
import { formatDocumentText } from './embedding/asymmetricPrefixes';

/**
 * Extracts a concise candidate title from plain text when creating a new theme.
 */
export const extractThemeCandidateTitle = (plainText: string): string => {
  const firstSentence = plainText.split(/[.!?\n]/)[0]?.trim() || '';
  const words = firstSentence.split(/\s+/).filter(Boolean).slice(0, 5).join(' ');
  if (words.length >= 3) {
    return words.charAt(0).toUpperCase() + words.slice(1);
  }
  return 'Emerging Life Pattern';
};

/**
 * Zero-Cloud Life Theme Triage.
 *
 * Replaces remote AI calls with local vector cosine similarity calculations
 * against Life Theme centroids (<100ms, ₹0 compute, zero third-party data leakage).
 *
 * Decision tree:
 * - Plaintext < 30 chars -> skip (too brief)
 * - Best theme similarity >= 0.52 -> append to bestTheme
 * - Best theme similarity < 0.38 and >= 40 words -> create new theme
 * - Otherwise -> skip (diffused concepts)
 */
export const triageNoteTheme = async (
  note: Note,
  themes: LifeTheme[]
): Promise<IngestDecision> => {
  const plainText = note.content.replace(/<[^>]*>/g, '').trim();
  if (plainText.length < 30) {
    return {
      action: 'skip',
      themeId: null,
      newThemeTitle: null,
      reasoning: 'Entry too brief for theme ingestion.',
    };
  }

  let noteVector: Float32Array;
  try {
    noteVector = await embeddingService.embedNote(note);
  } catch (err) {
    return {
      action: 'skip',
      themeId: null,
      newThemeTitle: null,
      reasoning: `Local embedding engine unavailable: ${err instanceof Error ? err.message : 'Unknown error'}`,
    };
  }

  // Compute similarity against all active themes
  let bestTheme: LifeTheme | null = null;
  let bestScore = -1;

  for (const theme of themes) {
    if (theme.state === 'archived') continue;
    try {
      const themeText = formatDocumentText(theme.title, theme.content);
      const themeVector = await embeddingService.embedQuery(themeText);
      const score = vectorStore.cosineSimilarity(noteVector, themeVector);
      if (score > bestScore) {
        bestScore = score;
        bestTheme = theme;
      }
    } catch {
      // Continue inspecting other themes
    }
  }

  // Threshold decision tree
  if (bestTheme && bestScore >= 0.52) {
    return {
      action: 'append',
      themeId: bestTheme.id,
      newThemeTitle: null,
      reasoning: `Strong resonance (${Math.round(bestScore * 100)}%) with "${bestTheme.title}".`,
    };
  }

  const wordCount = plainText.split(/\s+/).filter(Boolean).length;
  if (bestScore < 0.38 && wordCount >= 40) {
    const candidateTitle = note.title.trim() || extractThemeCandidateTitle(plainText);
    return {
      action: 'create',
      themeId: null,
      newThemeTitle: candidateTitle,
      reasoning: 'Distinct life pattern identified with no existing theme match.',
    };
  }

  return {
    action: 'skip',
    themeId: null,
    newThemeTitle: null,
    reasoning: 'Diffused concepts; does not warrant theme update.',
  };
};
