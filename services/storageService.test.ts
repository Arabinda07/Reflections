import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageService } from './storageService';
import { supabase } from '../src/supabaseClient';
import { cryptoService } from './cryptoService';
import { setCurrentCryptoSession } from './cryptoSessionStore';

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
    setCurrentCryptoSession(null);
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

  it('encrypts note attachments before upload with overwrite disabled', async () => {
    const upload = vi.fn().mockResolvedValue({ data: { path: 'ok' }, error: null });
    mockFrom.mockReturnValue({ upload } as any);
    const bundle = await cryptoService.createKeyBundle({
      userId: 'user-1',
      passphrase: 'attachment passphrase',
      iterations: 1_000,
    });
    setCurrentCryptoSession(await cryptoService.unlockWithPassphrase({
      userId: 'user-1',
      passphrase: 'attachment passphrase',
      bundle,
    }));

    const file = new File(['hello'], 'voice.webm', { type: 'audio/webm' });
    const path = await storageService.uploadFile(file, 'user-1', 'notes', 'note-1');

    expect(path).toMatch(/^user-1\/notes\/note-1\/[a-f0-9-]+\.enc$/);
    expect(upload).toHaveBeenCalledWith(
      path,
      expect.any(Blob),
      expect.objectContaining({
        cacheControl: '3600',
        contentType: 'application/json',
        upsert: false,
      }),
    );
  });
});
