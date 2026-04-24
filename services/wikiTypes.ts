export type WikiPageType =
  | 'theme'
  | 'people'
  | 'patterns'
  | 'philosophies'
  | 'eras'
  | 'decisions'
  | 'mood_patterns'
  | 'recurring_themes'
  | 'self_model'
  | 'index';

/** The 5 Librarian-maintained Sanctuary article categories. */
export const SANCTUARY_CATEGORIES: WikiPageType[] = [
  'people',
  'patterns',
  'philosophies',
  'eras',
  'decisions',
];

/** System-generated summary pages + Sanctuary categories. */
export const STRUCTURED_WIKI_PAGES: WikiPageType[] = [
  'mood_patterns',
  'recurring_themes',
  'self_model',
  'eras',
];
