import { supabase } from '../src/supabaseClient';
import { PlanTier, WellnessAccess } from '../types';

export const profileService = {
  getWellnessAccess: async (): Promise<WellnessAccess> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('profiles')
      .select('plan, free_ai_reflections_used')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('[profileService] Error fetching profile:', error);
      // Fallback for new users or missing profiles
      return {
        userId: user.id,
        planTier: 'free',
        freeAiReflectionsUsed: 0
      };
    }

    return {
      userId: user.id,
      planTier: (data.plan as PlanTier) || 'free',
      freeAiReflectionsUsed: data.free_ai_reflections_used || 0
    };
  },

  incrementFreeAiReflections: async (): Promise<void> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

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
  }
};
