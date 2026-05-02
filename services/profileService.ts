import { supabase } from '../src/supabaseClient';
import { PlanTier, WellnessAccess } from '../types';
import { getAuthenticatedUser } from './authUtils';

export interface SupabaseProfileRow {
  smart_mode_enabled: boolean | null;
}

interface SupabaseEntitlementRow {
  plan: string | null;
}

interface SupabaseAiUsageRow {
  action: string;
  used: number | null;
}

const VALID_PLAN_TIERS = new Set<PlanTier>(['free', 'pro']);
const parsePlanTier = (raw?: string | null): PlanTier =>
  raw && VALID_PLAN_TIERS.has(raw as PlanTier) ? (raw as PlanTier) : 'free';

const currentPeriodStart = () => {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
};

const getUsedCount = (rows: SupabaseAiUsageRow[] | null, action: string) =>
  rows?.find((row) => row.action === action)?.used || 0;

const mapWellnessAccess = (
  userId: string,
  profile: SupabaseProfileRow | null,
  entitlement: SupabaseEntitlementRow | null,
  usage: SupabaseAiUsageRow[] | null,
): WellnessAccess => ({
  userId,
  planTier: parsePlanTier(entitlement?.plan),
  freeAiReflectionsUsed: getUsedCount(usage, 'reflection'),
  freeWikiInsightsUsed: getUsedCount(usage, 'wikiPage'),
  smartModeEnabled: Boolean(profile?.smart_mode_enabled),
});

const getWellnessAccessForUser = async (
  userId: string,
  profileOverride?: SupabaseProfileRow | null,
): Promise<WellnessAccess> => {
  const periodStart = currentPeriodStart();

  const profilePromise = profileOverride !== undefined
    ? Promise.resolve({ data: profileOverride, error: null })
    : supabase
        .from('profiles')
        .select('smart_mode_enabled')
        .eq('id', userId)
        .single();

  const [profileResult, entitlementResult, usageResult] = await Promise.all([
    profilePromise,
    supabase
      .from('account_entitlements')
      .select('plan')
      .eq('user_id', userId)
      .maybeSingle(),
    supabase
      .from('ai_usage_counters')
      .select('action, used')
      .eq('user_id', userId)
      .eq('period_start', periodStart)
      .in('action', ['reflection', 'wikiPage']),
  ]);

  if (profileResult.error) {
    console.error('[profileService] Error fetching profile:', profileResult.error);
  }

  if (entitlementResult.error) {
    console.error('[profileService] Error fetching entitlement:', entitlementResult.error);
  }

  if (usageResult.error) {
    console.error('[profileService] Error fetching AI usage:', usageResult.error);
  }

  return mapWellnessAccess(
    userId,
    profileResult.data || null,
    entitlementResult.data || null,
    usageResult.data || [],
  );
};

export const profileService = {
  getWellnessAccess: async (): Promise<WellnessAccess> => {
    const user = await getAuthenticatedUser();

    return getWellnessAccessForUser(user.id);
  },

  setSmartModeEnabled: async (enabled: boolean): Promise<WellnessAccess> => {
    const user = await getAuthenticatedUser();

    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        { id: user.id, smart_mode_enabled: enabled },
        { onConflict: 'id' },
      )
      .select('smart_mode_enabled')
      .single();

    if (error) throw error;
    return getWellnessAccessForUser(user.id, data);
  },

  incrementFreeAiReflections: async (): Promise<void> => {
    await getAuthenticatedUser();
  },

  incrementFreeWikiInsights: async (): Promise<boolean> => {
    await getAuthenticatedUser();
    return true;
  },

  releaseClaimedFreeWikiInsight: async (): Promise<void> => {
    await getAuthenticatedUser();
  }
};
