import { supabase } from '../src/supabaseClient';
import type { ReferralInvite } from '../types';

export interface SupabaseReferralInviteRow {
  id: string;
  user_id: string;
  code: string;
  created_at: string;
  last_shared_at: string | null;
}

export const mapReferralInvite = (data: SupabaseReferralInviteRow): ReferralInvite => ({
  id: data.id,
  userId: data.user_id,
  code: data.code,
  createdAt: data.created_at,
  lastSharedAt: data.last_shared_at || undefined,
});

export const referralRemoteStore = {
  fetchByUserId: async (userId: string): Promise<ReferralInvite | null> => {
    const { data, error } = await supabase
      .from('referral_invites')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapReferralInvite(data) : null;
  },

  insert: async (userId: string, code: string): Promise<ReferralInvite> => {
    const { data, error } = await supabase
      .from('referral_invites')
      .insert({
        user_id: userId,
        code,
      })
      .select()
      .single();

    if (error) throw error;
    return mapReferralInvite(data);
  },

  updateLastSharedAt: async (userId: string, inviteId: string, sharedAt: string): Promise<ReferralInvite> => {
    const { data, error } = await supabase
      .from('referral_invites')
      .update({ last_shared_at: sharedAt })
      .eq('id', inviteId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return mapReferralInvite(data);
  },

  acceptInvite: async (code: string): Promise<boolean> => {
    const { data, error } = await supabase
      .rpc('accept_referral_invite', { referral_code: code });

    if (error) throw error;
    return Boolean(data);
  },

  getAcceptedCount: async (userId: string): Promise<number> => {
    const { count, error } = await supabase
      .from('referrals')
      .select('*', { count: 'exact', head: true })
      .eq('inviter_user_id', userId);

    if (error) throw error;
    return count ?? 0;
  },
};
