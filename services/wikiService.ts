import { supabase } from '../src/supabaseClient';
import type { LifeTheme, ThemeCitation, Note } from '../types';
import { WikiPageType, STRUCTURED_WIKI_PAGES } from './wikiTypes';
import { mapToNote, type SupabaseNoteRow } from './noteService';

const VALID_THEME_STATES = new Set<LifeTheme['state']>(['active', 'archived', 'resolved']);
const parseThemeState = (raw: string): LifeTheme['state'] =>
  VALID_THEME_STATES.has(raw as LifeTheme['state']) ? (raw as LifeTheme['state']) : 'active';

export interface SupabaseLifeThemeRow {
  id: string;
  user_id: string;
  title: string;
  content: string;
  state: string;
  page_type: string;
  created_at: string;
  updated_at: string;
}

export interface SupabaseThemeCitationRow {
  id: string;
  theme_id: string;
  note_id: string;
  context_snippet: string;
  created_at: string;
}

// ─────────────────────────────────────────────
// Mappers
// ─────────────────────────────────────────────
const mapToLifeTheme = (data: SupabaseLifeThemeRow): LifeTheme => ({
  id: data.id,
  userId: data.user_id,
  title: data.title,
  content: data.content,
  state: parseThemeState(data.state),
  pageType: data.page_type as WikiPageType,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapToThemeCitation = (data: SupabaseThemeCitationRow): ThemeCitation => ({
  id: data.id,
  themeId: data.theme_id,
  noteId: data.note_id,
  createdAt: data.created_at,
});

// ─────────────────────────────────────────────
// Wiki Service
// ─────────────────────────────────────────────
export const wikiService = {

  // ── Freeform User Themes ──────────────────

  /**
   * Returns only freeform life themes the user created (page_type = 'theme').
   * Used by aiService during ingest to avoid Gemini touching structured wiki pages.
   */
  getUserThemes: async (): Promise<LifeTheme[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('life_themes')
      .select('*')
      .eq('user_id', user.id)
      .eq('page_type', 'theme')
      .eq('state', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToLifeTheme);
  },

  /**
   * Returns all active life themes (freeform + structured wiki pages).
   * Used by the UI to display everything.
   */
  getAllThemes: async (): Promise<LifeTheme[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('life_themes')
      .select('*')
      .eq('user_id', user.id)
      .eq('state', 'active')
      .order('updated_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(mapToLifeTheme);
  },

  /**
   * Fetch a single theme by its ID.
   */
  getThemeById: async (themeId: string): Promise<LifeTheme | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('life_themes')
      .select('*')
      .eq('id', themeId)
      .eq('user_id', user.id)
      .single();

    if (error) return null;
    return mapToLifeTheme(data);
  },

  /**
   * Create a new freeform life theme.
   */
  createTheme: async (title: string, content: string): Promise<LifeTheme> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('life_themes')
      .insert({
        user_id: user.id,
        title,
        content,
        state: 'active',
        page_type: 'theme',
      })
      .select()
      .single();

    if (error) throw error;
    return mapToLifeTheme(data);
  },

  /**
   * Update the content of an existing theme (freeform or structured).
   */
  updateThemeContent: async (themeId: string, newContent: string): Promise<LifeTheme> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('life_themes')
      .update({ content: newContent })
      .eq('id', themeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    return mapToLifeTheme(data);
  },

  // ── Structured Wiki Pages ─────────────────

  /**
   * Fetch a single structured wiki page by type (e.g. 'mood_patterns').
   * Returns null if it hasn't been created yet.
   */
  getWikiPage: async (pageType: WikiPageType): Promise<LifeTheme | null> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('life_themes')
      .select('*')
      .eq('user_id', user.id)
      .eq('page_type', pageType)
      .single();

    if (error) return null;
    return mapToLifeTheme(data);
  },

  /**
   * Fetch all structured wiki pages (excludes freeform themes).
   * Returns only the pages that have been created so far.
   */
  getAllWikiPages: async (): Promise<LifeTheme[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('life_themes')
      .select('*')
      .eq('user_id', user.id)
      .in('page_type', STRUCTURED_WIKI_PAGES)
      .eq('state', 'active');

    if (error) throw error;
    return (data || []).map(mapToLifeTheme);
  },

  /**
   * Create or update a structured wiki page.
   * Uses upsert on (user_id, page_type) — there is exactly one of each per user.
   */
  upsertWikiPage: async (
    pageType: WikiPageType,
    title: string,
    content: string
  ): Promise<LifeTheme> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Check if it already exists so we can update vs insert
    const existing = await wikiService.getWikiPage(pageType);

    if (existing) {
      return wikiService.updateThemeContent(existing.id, content);
    }

    const { data, error } = await supabase
      .from('life_themes')
      .insert({
        user_id: user.id,
        title,
        content,
        state: 'active',
        page_type: pageType,
      })
      .select()
      .single();

    if (error) throw error;
    return mapToLifeTheme(data);
  },

  // ── Citations ─────────────────────────────

  /**
   * Links a note to a theme.
   * user_id removed — RLS enforces ownership via life_themes join.
   */
  addCitation: async (themeId: string, noteId: string): Promise<ThemeCitation> => {
    const { data, error } = await supabase
      .from('theme_citations')
      .insert({
        theme_id: themeId,
        note_id: noteId,
      })
      .select()
      .single();

    if (error) throw error;
    return mapToThemeCitation(data);
  },

  /**
   * Retrieves all notes that contributed to a specific theme.
   * user_id removed from citations query — RLS handles it.
   */
  getThemeSources: async (themeId: string): Promise<Note[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: citations, error: citeError } = await supabase
      .from('theme_citations')
      .select('note_id')
      .eq('theme_id', themeId);

    if (citeError) throw citeError;
    if (!citations || citations.length === 0) return [];

    const noteIds = citations.map((c: { note_id: string }) => c.note_id);

    const { data: notes, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .in('id', noteIds)
      .eq('user_id', user.id);

    if (noteError) throw noteError;

    return ((notes || []) as SupabaseNoteRow[]).map(mapToNote);
  },
};
