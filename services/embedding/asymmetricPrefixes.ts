/**
 * Asymmetric prefix formatting for embedding model input.
 *
 * BGE models require task-specific prefixes to distinguish between document
 * indexing and search queries. Without these, retrieval quality degrades
 * because the model conflates the two intents.
 *
 * Reference: ADR 0004 §2.4 — Asymmetric Search Prefixes
 */

/**
 * Formats a note for document embedding.
 * Prefixes with "Document: " and optionally includes the title.
 */
export const formatDocumentText = (title: string, content: string): string => {
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();

  if (!trimmedTitle && !trimmedContent) return '';

  if (trimmedTitle) {
    return `Document: ${trimmedTitle} | ${trimmedContent}`;
  }
  return `Document: ${trimmedContent}`;
};

/**
 * Formats a search query for query embedding.
 * Prefixes with "SearchQuery: " to activate the model's retrieval mode.
 */
export const formatQueryText = (query: string): string => {
  const trimmed = query.trim();
  if (!trimmed) return '';
  return `SearchQuery: ${trimmed}`;
};
