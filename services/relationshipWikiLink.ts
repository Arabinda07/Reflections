// Connects the Relationships feature to the Life Wiki "People" room by matching
// relationship names against the room's free-text content. No schema, no AI —
// just substring matching on names the user already typed.

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Word-boundary, case-insensitive match. Uses lookarounds (not \b) so names with
// punctuation/accents still match cleanly at edges.
const mentionRegExp = (name: string) =>
  new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(name.trim())}(?![\\p{L}\\p{N}])`, 'iu');

/** Paragraphs of `content` that mention `name`. Empty if name is blank or unmatched. */
export const findWikiMentions = (content: string, name: string): string[] => {
  const trimmed = name.trim();
  if (!content || !trimmed) return [];
  const pattern = mentionRegExp(trimmed);
  return content
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph && pattern.test(paragraph));
};

/** How many of `names` appear at least once in `content`. */
export const countMentionedNames = (content: string, names: string[]): number => {
  if (!content) return 0;
  return names.filter((name) => {
    const trimmed = name.trim();
    return trimmed && mentionRegExp(trimmed).test(content);
  }).length;
};
