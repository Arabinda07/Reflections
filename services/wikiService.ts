import { supabase } from '../src/supabaseClient';
import { LifeTheme, ThemeCitation, Note } from '../types';

// Map snake_case from Supabase to camelCase for our TypeScript interfaces
const mapToLifeTheme = (data: any): LifeTheme => ({
  id: data.id,
  userId: data.user_id,
  title: data.title,
  content: data.content,
  state: data.state,
  createdAt: data.created_at,
  updatedAt: data.updated_at,
});

const mapToThemeCitation = (data: any): ThemeCitation => ({
  id: data.id,
  userId: data.user_id,
  themeId: data.theme_id,
  noteId: data.note_id,
  createdAt: data.created_at,
});

export const wikiService = {
  /**
   * Fetch all active life themes for the current user.
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
   * Create a brand new Life Theme.
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
        state: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return mapToLifeTheme(data);
  },

  /**
   * Update the content of an existing Life Theme.
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

  /**
   * Links a Note to a Theme so the user knows exactly where the insight originated from.
   */
  addCitation: async (themeId: string, noteId: string): Promise<ThemeCitation> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('theme_citations')
      .insert({
        user_id: user.id,
        theme_id: themeId,
        note_id: noteId
      })
      .select()
      .single();

    if (error) throw error;
    return mapToThemeCitation(data);
  },
  
  /**
   * Retrieves all Notes that were used to generate a specific theme.
   */
  getThemeSources: async (themeId: string): Promise<Note[]> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    // Fetch the citations to get note IDs
    const { data: citations, error: citeError } = await supabase
      .from('theme_citations')
      .select('note_id')
      .eq('theme_id', themeId)
      .eq('user_id', user.id);

    if (citeError) throw citeError;
    if (!citations || citations.length === 0) return [];

    const noteIds = citations.map(c => c.note_id);

    // Fetch the actual notes
    const { data: notes, error: noteError } = await supabase
      .from('notes')
      .select('*')
      .in('id', noteIds)
      .eq('user_id', user.id);

    if (noteError) throw noteError;
    
    return (notes || []).map(data => ({
      id: data.id,
      title: data.title || '',
      content: data.content || '',
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      thumbnailUrl: data.thumbnail_url || undefined,
      tags: data.tags || [],
      attachments: data.attachments || [],
      mood: data.mood || undefined,
      tasks: data.tasks || [],
    }));
  }
};
