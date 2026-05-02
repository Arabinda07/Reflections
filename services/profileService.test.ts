import { beforeEach, describe, expect, it, vi } from 'vitest';
import { profileService } from './profileService';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

const mockAuth = vi.mocked(supabase.auth.getUser);
const mockFrom = vi.mocked(supabase.from);

describe('profileService.setSmartModeEnabled', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ data: { user: { id: 'user-1' } } } as any);
  });

  it('upserts Smart Mode so older accounts without profile rows can enable it', async () => {
    const profileChain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          smart_mode_enabled: true,
        },
        error: null,
      }),
    };
    const entitlementChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { plan: 'free' },
        error: null,
      }),
    };
    const usageChain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      in: vi.fn().mockResolvedValue({
        data: [],
        error: null,
      }),
    };
    mockFrom
      .mockReturnValueOnce(profileChain as any)
      .mockReturnValueOnce(entitlementChain as any)
      .mockReturnValueOnce(usageChain as any);

    const access = await profileService.setSmartModeEnabled(true);

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(profileChain.upsert).toHaveBeenCalledWith(
      { id: 'user-1', smart_mode_enabled: true },
      { onConflict: 'id' },
    );
    expect(profileChain.select).toHaveBeenCalledWith('smart_mode_enabled');
    expect(mockFrom).toHaveBeenCalledWith('account_entitlements');
    expect(mockFrom).toHaveBeenCalledWith('ai_usage_counters');
    expect(access.smartModeEnabled).toBe(true);
  });
});
