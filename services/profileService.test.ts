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
    const chain = {
      upsert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: {
          plan: 'free',
          free_ai_reflections_used: 0,
          free_wiki_insights_used: 0,
          smart_mode_enabled: true,
        },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain as any);

    const access = await profileService.setSmartModeEnabled(true);

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(chain.upsert).toHaveBeenCalledWith(
      { id: 'user-1', smart_mode_enabled: true },
      { onConflict: 'id' },
    );
    expect(chain.select).toHaveBeenCalledWith(
      'plan, free_ai_reflections_used, free_wiki_insights_used, smart_mode_enabled',
    );
    expect(access.smartModeEnabled).toBe(true);
  });
});
