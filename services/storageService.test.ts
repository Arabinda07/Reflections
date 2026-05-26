import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageService } from './storageService';
import { supabase } from '../src/supabaseClient';
import { cryptoService } from './cryptoService';
import { setCurrentCryptoSession } from './cryptoSessionStore';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: {
      getUser: vi.fn(),
    },
    storage: {
      from: vi.fn(),
    },
  },
}));

const mockFrom = vi.mocked(supabase.storage.from);
const mockGetUser = vi.mocked(supabase.auth.getUser);

describe('storageService upload hardening', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setCurrentCryptoSession(null);
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null } as any);
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

  it('paginates user-prefix deletion beyond the first 1000 storage objects', async () => {
    const firstPage = Array.from({ length: 1000 }, (_, index) => ({
      id: `file-${index}`,
      name: `file-${index}.enc`,
    }));
    const secondPage = [
      { id: 'file-1000', name: 'file-1000.enc' },
      { id: 'file-1001', name: 'file-1001.enc' },
    ];
    const list = vi.fn()
      .mockResolvedValueOnce({ data: firstPage, error: null })
      .mockResolvedValueOnce({ data: secondPage, error: null });
    const remove = vi.fn().mockResolvedValue({ data: null, error: null });
    mockFrom.mockReturnValue({ list, remove } as any);

    await storageService.deleteUserPrefix('user-1');

    expect(list).toHaveBeenCalledWith('user-1', { limit: 1000, offset: 0 });
    expect(list).toHaveBeenCalledWith('user-1', { limit: 1000, offset: 1000 });
    expect(remove).toHaveBeenCalledWith(expect.arrayContaining([
      'user-1/file-0.enc',
      'user-1/file-1001.enc',
    ]));
    expect(remove.mock.calls[0][0]).toHaveLength(1002);
  });
});
