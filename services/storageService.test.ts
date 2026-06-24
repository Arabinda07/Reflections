import { beforeEach, describe, expect, it, vi } from 'vitest';
import { storageService } from './storageService';
import { supabase } from '../src/supabaseClient';
import { keyWrapperPolicy } from './keyWrapperPolicy';
import { setCurrentCryptoSession } from './cryptoSessionStore';
import { cryptoService } from './cryptoService';

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
    const bundle = await keyWrapperPolicy.createBundle({
      userId: 'user-1',
      secret: 'attachment passphrase',
      iterations: 1_000,
    });
    const session = await keyWrapperPolicy.unlockWithPrimarySecret({
      userId: 'user-1',
      secret: 'attachment passphrase',
      bundle,
    });
    setCurrentCryptoSession(session);

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
    const body = upload.mock.calls[0][1] as Blob;
    const stored = JSON.parse(await body.text());
    expect(stored).toMatchObject({
      v: 1,
      metadata: expect.objectContaining({ alg: 'AES-GCM-256' }),
      content: expect.objectContaining({ alg: 'AES-GCM-256' }),
    });
    expect(await cryptoService.decryptJson(
      session,
      { table: 'storage.objects', rowId: `${path}:metadata`, userId: 'user-1' },
      stored.metadata,
    )).toEqual({ name: 'voice.webm', type: 'audio/webm' });
    expect(JSON.stringify(stored)).not.toContain('voice.webm');
  });

  it('restores MIME types and still reads legacy attachment envelopes', async () => {
    const bundle = await keyWrapperPolicy.createBundle({
      userId: 'user-1',
      secret: 'attachment passphrase',
      iterations: 1_000,
    });
    const session = await keyWrapperPolicy.unlockWithPrimarySecret({
      userId: 'user-1',
      secret: 'attachment passphrase',
      bundle,
    });
    setCurrentCryptoSession(session);
    const path = 'user-1/notes/note-1/file.enc';
    const content = new TextEncoder().encode('private audio');
    const stored = {
      v: 1,
      metadata: await cryptoService.encryptJson(
        session,
        { table: 'storage.objects', rowId: `${path}:metadata`, userId: 'user-1' },
        { name: 'voice.webm', type: 'audio/webm' },
      ),
      content: await cryptoService.encryptBytes(
        session,
        { table: 'storage.objects', rowId: `${path}:content`, userId: 'user-1' },
        content,
      ),
    };
    const createSignedUrl = vi.fn().mockResolvedValue({ data: { signedUrl: 'https://signed' }, error: null });
    mockFrom.mockReturnValue({ createSignedUrl } as any);
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify(stored)));
    const createObjectUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:decrypted');

    await expect(storageService.getSignedUrl(path)).resolves.toBe('blob:decrypted');
    expect((createObjectUrl.mock.calls[0][0] as Blob).type).toBe('audio/webm');

    const legacy = await cryptoService.encryptBytes(
      session,
      { table: 'storage.objects', rowId: path, userId: 'user-1' },
      content,
    );
    fetchSpy.mockResolvedValueOnce(new Response(JSON.stringify(legacy)));
    await storageService.getSignedUrl(path);
    expect((createObjectUrl.mock.calls[1][0] as Blob).type).toBe('application/octet-stream');

    fetchSpy.mockRestore();
    createObjectUrl.mockRestore();
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
