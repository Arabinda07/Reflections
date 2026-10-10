/**
 * Asymmetric prefix formatting for embedding model input.
 *
 * Each model was trained with its own prompt format; using the wrong one
 * quietly degrades retrieval quality.
 * - bge-small-en-v1.5: documents raw, queries get the BGE retrieval instruction.
 * - EmbeddingGemma: `title: … | text: …` for documents, `task: search result | query: …` for queries.
 *
 * Reference: ADR 0004 §2.4 — Asymmetric Search Prefixes
 */
import type { EmbeddingModelTier } from './embeddingTypes';

const BGE_QUERY_INSTRUCTION = 'Represent this sentence for searching relevant passages: ';

/** Formats a note for document embedding in the given tier's native format. */
export const formatDocumentText = (
  title: string,
  content: string,
  tier: EmbeddingModelTier = 'tier1-bge',
): string => {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle && !trimmedContent) return '';

  if (tier === 'tier2-gemma') {
    return `title: ${trimmedTitle || 'none'} | text: ${trimmedContent}`;
  }
  return trimmedTitle ? `${trimmedTitle}\n${trimmedContent}` : trimmedContent;
};

/** Formats a search query for query embedding in the given tier's native format. */
export const formatQueryText = (query: string, tier: EmbeddingModelTier = 'tier1-bge'): string => {
  const trimmed = query.trim();
  if (!trimmed) return '';
  return tier === 'tier2-gemma'
    ? `task: search result | query: ${trimmed}`
    : `${BGE_QUERY_INSTRUCTION}${trimmed}`;
};
