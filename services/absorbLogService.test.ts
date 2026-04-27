import { beforeEach, describe, expect, it, vi } from 'vitest';
import { absorbLogService } from './absorbLogService';
import { supabase } from '../src/supabaseClient';
import type { Note } from '../types';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

const mockAuth = vi.mocked(supabase.auth.getUser);
const mockFrom = vi.mocked(supabase.from);

const note = (overrides: Partial<Note> = {}): Note => ({
  id: 'note-1',
  title: 'A clear morning',
  content: '<p>I could think again.</p>',
  createdAt: '2026-04-27T00:00:00.000Z',
  updatedAt: '2026-04-27T00:00:00.000Z',
  mood: 'calm',
  tags: ['clarity'],
  tasks: [],
  attachments: [],
  ...overrides,
});

describe('absorbLogService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth.mockResolvedValue({ data: { user: { id: 'user-1' } } } as any);
  });

  it('uses a stable note fingerprint so unchanged notes do not re-absorb', async () => {
    const contentHash = await absorbLogService.getNoteContentHash(note());
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: vi.fn().mockResolvedValue({
        data: { content_hash: contentHash },
        error: null,
      }),
    };
    mockFrom.mockReturnValue(chain as any);

    await expect(absorbLogService.needsReAbsorb(note())).resolves.toBe(false);
    expect(mockFrom).toHaveBeenCalledWith('wiki_absorb_log');
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'user-1');
    expect(chain.eq).toHaveBeenCalledWith('note_id', 'note-1');
  });

  it('logs absorption with the current content hash', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert } as any);

    await absorbLogService.logAbsorption(note());

    expect(mockFrom).toHaveBeenCalledWith('wiki_absorb_log');
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-1',
        note_id: 'note-1',
        content_hash: expect.any(String),
      }),
      { onConflict: 'user_id,note_id' },
    );
  });
});
