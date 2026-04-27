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
  | 'timeline'
  | 'index';

export const SANCTUARY_WIKI_PAGES = [
  'people',
  'patterns',
  'philosophies',
  'eras',
  'decisions',
] as const satisfies readonly WikiPageType[];

export const SUPPORTING_WIKI_PAGES = [
  'mood_patterns',
  'recurring_themes',
  'self_model',
  'timeline',
] as const satisfies readonly WikiPageType[];

export const USER_VISIBLE_WIKI_PAGES: WikiPageType[] = [
  ...SANCTUARY_WIKI_PAGES,
  ...SUPPORTING_WIKI_PAGES,
];

export const STRUCTURED_WIKI_PAGES: WikiPageType[] = USER_VISIBLE_WIKI_PAGES;

export const isUserVisibleWikiPage = (pageType: WikiPageType | string | undefined): pageType is WikiPageType =>
  Boolean(pageType && USER_VISIBLE_WIKI_PAGES.includes(pageType as WikiPageType));

export const isSanctuaryWikiPage = (pageType: WikiPageType | string | undefined): pageType is WikiPageType =>
  Boolean(pageType && SANCTUARY_WIKI_PAGES.includes(pageType as (typeof SANCTUARY_WIKI_PAGES)[number]));
