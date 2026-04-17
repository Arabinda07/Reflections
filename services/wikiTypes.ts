export type WikiPageType =
  | 'theme'
  | 'mood_patterns'
  | 'recurring_themes'
  | 'self_model'
  | 'timeline'
  | 'index';

export const STRUCTURED_WIKI_PAGES: WikiPageType[] = [
  'mood_patterns',
  'recurring_themes',
  'self_model',
  'timeline',
];
