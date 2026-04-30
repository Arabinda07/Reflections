import { supabase } from '../src/supabaseClient';
import { PlanTier, WellnessAccess } from '../types';
import { getAuthenticatedUser } from './authUtils';

export interface SupabaseProfileRow {
  plan: string | null;
  free_ai_reflections_used: number | null;
  free_wiki_insights_used: number | null;
  smart_mode_enabled: boolean | null;
}

const VALID_PLAN_TIERS = new Set<PlanTier>(['free', 'pro']);
const parsePlanTier = (raw?: string | null): PlanTier =>
  raw && VALID_PLAN_TIERS.has(raw as PlanTier) ? (raw as PlanTier) : 'free';

const mapWellnessAccess = (userId: string, data: SupabaseProfileRow | null): WellnessAccess => ({
  userId,
  planTier: parsePlanTier(data?.plan),
  freeAiReflectionsUsed: data?.free_ai_reflections_used || 0,
  freeWikiInsightsUsed: data?.free_wiki_insights_used || 0,
  smartModeEnabled: Boolean(data?.smart_mode_enabled),
});

export const profileService = {
  getWellnessAccess: async (): Promise<WellnessAccess> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('profiles')
      .select('plan, free_ai_reflections_used, free_wiki_insights_used, smart_mode_enabled')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[profileService] Error fetching profile:', error);
      // Fallback for new users or missing profiles
      return {
        userId: user.id,
        planTier: 'free',
        freeAiReflectionsUsed: 0,
        freeWikiInsightsUsed: 0,
        smartModeEnabled: false,
      };
    }

    return mapWellnessAccess(user.id, data);
  },

  setSmartModeEnabled: async (enabled: boolean): Promise<WellnessAccess> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, smart_mode_enabled: enabled },
        { onConflict: 'id' },
      )
      .select('plan, free_ai_reflections_used, free_wiki_insights_used, smart_mode_enabled')
      .single();

    if (error) throw error;
    return mapWellnessAccess(user.id, data);
  },

  incrementFreeAiReflections: async (): Promise<void> => {
    const user = await getAuthenticatedUser();

    // Fetch current count first
    const { data } = await supabase
      .from('profiles')
      .select('free_ai_reflections_used')
      .eq('id', user.id)
      .single();

    const currentCount = data?.free_ai_reflections_used || 0;

    const { error } = await supabase
      .from('profiles')
      .update({ free_ai_reflections_used: currentCount + 1 })
      .eq('id', user.id);

    if (error) throw error;
  },

  incrementFreeWikiInsights: async (): Promise<boolean> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('profiles')
      .update({ free_wiki_insights_used: 1 })
      .eq('id', user.id)
      .eq('free_wiki_insights_used', 0)
      .select('id')
      .limit(1);

    if (error) throw error;
    return (data?.length ?? 0) === 1;
  },

  releaseClaimedFreeWikiInsight: async (): Promise<void> => {
    const user = await getAuthenticatedUser();

    const { error } = await supabase
      .from('profiles')
      .update({ free_wiki_insights_used: 0 })
      .eq('id', user.id)
      .eq('free_wiki_insights_used', 1);

    if (error) throw error;
  }
};
