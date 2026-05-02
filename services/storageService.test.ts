import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageService } from './storageService';
import { supabase } from '../src/supabaseClient';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    storage: {
      from: vi.fn(),
    },
  },
}));

const mockFrom = vi.mocked(supabase.storage.from);

describe('storageService upload hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects disallowed attachment types before reaching Supabase Storage', async () => {
    const file = new File(['<script>alert(1)</script>'], 'payload.html', {
      type: 'text/html',
    });

    await expect(
      storageService.uploadFile(file, 'user-1', 'notes', 'note-1'),
    ).rejects.toThrow('File type not allowed');

    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('uploads with overwrite disabled and an explicit content type', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'ok' }, error: null });
    mockFrom.mockReturnValue({ upload } as any);

    const file = new File(['hello'], 'voice.webm', { type: 'audio/webm' });
    const path = await storageService.uploadFile(file, 'user-1', 'notes', 'note-1');

    expect(path).toMatch(/^user-1\/notes\/note-1\/[a-f0-9-]+\.webm$/);
    expect(upload).toHaveBeenCalledWith(
      path,
      file,
      expect.objectContaining({
        cacheControl: '3600',
        contentType: 'audio/webm',
        upsert: false,
      }),
    );
  });
});
