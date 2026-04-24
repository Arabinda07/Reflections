import { supabase } from '../src/supabaseClient';

const WIKILINK_REGEX = /\[\[([^\]]+)\]\]/g;

/**
 * Extracts unique wikilink titles from wiki content.
 * Parses [[Page Title]] patterns.
 */
export function extractWikilinks(content: string): string[] {
  const matches = new Set<string>();
  let match: RegExpExecArray | null;

  // Reset lastIndex for safety since the regex has the global flag
  WIKILINK_REGEX.lastIndex = 0;

  while ((match = WIKILINK_REGEX.exec(content)) !== null) {
    const title = match[1].trim();
    if (title) matches.add(title);
  }

  return Array.from(matches);
}

export const wikiLinksService = {
  /**
   * Parse [[wikilinks]] from page content, resolve titles to page IDs,
   * and upsert link records into wiki_links.
   * Deletes stale links that are no longer in the content.
   */
  syncLinks: async (sourcePageId: string, content: string): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const titles = extractWikilinks(content);
    if (titles.length === 0) {
      await supabase
        .from('wiki_links')
        .delete()
        .eq('source_page_id', sourcePageId);
      return;
    }

    // Resolve titles to page IDs
    const { data: pages, error: lookupError } = await supabase
      .from('life_themes')
      .select('id, title')
      .eq('user_id', user.id)
      .eq('state', 'active')
      .in('title', titles);

    if (lookupError) throw lookupError;

    const resolvedIds = (pages || [])
      .map((p: { id: string }) => p.id)
      .filter((id: string) => id !== sourcePageId);

    // Delete existing outlinks for this page
    await supabase
      .from('wiki_links')
      .delete()
      .eq('source_page_id', sourcePageId);

    // Insert new links
    if (resolvedIds.length > 0) {
      const rows = resolvedIds.map((targetId: string) => ({
        source_page_id: sourcePageId,
        target_page_id: targetId,
      }));

      const { error: insertError } = await supabase
        .from('wiki_links')
        .insert(rows);

      if (insertError) throw insertError;
    }
  },

  /**
   * Get all pages that link TO the given page (backlinks).
   */
  getBacklinks: async (pageId: string): Promise<{ id: string; title: string }[]> => {
    const { data, error } = await supabase
      .from('wiki_links')
      .select('source_page_id')
      .eq('target_page_id', pageId);

    if (error) throw error;
    if (!data || data.length === 0) return [];

    const sourceIds = data.map((row: any) => row.source_page_id);

    const { data: pages, error: pageError } = await supabase
      .from('life_themes')
      .select('id, title')
      .in('id', sourceIds);

    if (pageError) throw pageError;

    return (pages || []).map((p: any) => ({
      id: p.id,
      title: p.title,
    }));
  },

  /**
   * Delete all wiki links for pages owned by the current user.
   * Used during "Nuclear Option" sanctuary data deletion.
   */
  purgeAll: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data: pages, error: pageError } = await supabase
      .from('life_themes')
      .select('id')
      .eq('user_id', user.id);

    if (pageError) throw pageError;
    if (!pages || pages.length === 0) return;

    const pageIds = pages.map((p: { id: string }) => p.id);

    await supabase
      .from('wiki_links')
      .delete()
      .in('source_page_id', pageIds);
  },
};
