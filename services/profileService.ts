import { supabase } from '../src/supabaseClient';
import { PlanTier, WellnessAccess } from '../types';

const getAuthenticatedUser = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('User not authenticated');
  return user;
};

export const profileService = {
  getWellnessAccess: async (): Promise<WellnessAccess> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('profiles')
      .select('plan, free_ai_reflections_used, free_wiki_insights_used')
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
      };
    }

    return {
      userId: user.id,
      planTier: (data.plan as PlanTier) || 'free',
      freeAiReflectionsUsed: data.free_ai_reflections_used || 0,
      freeWikiInsightsUsed: data.free_wiki_insights_used || 0,
    };
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
  },

  getSmartModeEnabled: async (): Promise<boolean> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('profiles')
      .select('smart_mode_enabled')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[profileService] Error fetching smart mode:', error);
      return false;
    }

    return data?.smart_mode_enabled ?? false;
  },

  setSmartModeEnabled: async (enabled: boolean): Promise<void> => {
    const user = await getAuthenticatedUser();

    const { error } = await supabase
      .from('profiles')
      .update({ smart_mode_enabled: enabled })
      .eq('id', user.id);

    if (error) throw error;
  },
};
