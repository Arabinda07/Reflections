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

const plainText = (html: string) =>
  html.replace(/<\/(p|div|li|h[1-6])>|<br\s*\/?>/gi, '\n').replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');

const personNames = (person: { name: string; aliases?: string[] }) =>
  [person.name, ...(person.aliases || [])].map((name) => name.trim()).filter(Boolean);

/**
 * The one way the app decides a note is "about" a person: an explicit tag, or
 * their name/alias appearing in the title or body. On-device, no AI.
 */
export const noteMentionsPerson = (
  note: { title?: string; content?: string; relationshipIds?: string[] },
  person: { id: string; name: string; aliases?: string[] },
): boolean => {
  if (note.relationshipIds?.includes(person.id)) return true;
  const text = `${note.title || ''}\n${plainText(note.content || '')}`;
  return personNames(person).some((name) => mentionRegExp(name).test(text));
};

/** The sentence in a note that names the person, trimmed for a quiet quote. */
export const mentionedLine = (
  note: { content?: string },
  person: { name: string; aliases?: string[] },
  maxLength = 120,
): string | undefined => {
  const sentences = plainText(note.content || '').split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  const names = personNames(person);
  const hit = sentences.find((sentence) => names.some((name) => mentionRegExp(name).test(sentence)));
  if (!hit) return undefined;
  return hit.length > maxLength ? `${hit.slice(0, maxLength - 1).trimEnd()}…` : hit;
};

/** Known people named in a draft who aren't tagged yet. */
export const untaggedMentions = <P extends { id: string; name: string; aliases?: string[] }>(
  draft: { title?: string; content?: string },
  people: P[],
  taggedIds: string[],
): P[] => people.filter((person) => !taggedIds.includes(person.id) && noteMentionsPerson(draft, person));
