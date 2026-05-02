import { describe, it, expect, vi, beforeEach } from 'vitest';
import { noteService } from './noteService';
import { supabase } from '../src/supabaseClient';
import { offlineStorage } from './offlineStorage';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

vi.mock('./offlineStorage', () => ({
  offlineStorage: {
    getAllNotes: vi.fn(),
    getNoteById: vi.fn(),
    saveNote: vi.fn(),
    markAsSynced: vi.fn(),
    deleteNote: vi.fn(),
  },
}));

const mockAuth = vi.mocked(supabase.auth.getUser);
const mockFrom = vi.mocked(supabase.from);
const mockGetAllNotes = vi.mocked(offlineStorage.getAllNotes);
const mockGetNoteById = vi.mocked(offlineStorage.getNoteById);
const mockSaveNote = vi.mocked(offlineStorage.saveNote);
const mockMarkAsSynced = vi.mocked(offlineStorage.markAsSynced);

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ data: { user: { id: 'uid-1' } } } as any);
});

describe('noteService.getById', () => {
  it('does not return a cached Dexie note owned by another signed-in user', async () => {
    const otherUsersNote = {
      id: 'note-1',
      userId: 'uid-2',
      syncStatus: 'synced',
      title: 'Someone else',
      content: 'Private',
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:00:00.000Z',
    } as any;
    mockGetNoteById.mockImplementation(async (_id, userId) =>
      userId === 'uid-2' ? otherUsersNote : undefined,
    );

    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
    };
    mockFrom.mockReturnValue(chain as any);

    const note = await noteService.getById('note-1');

    expect(mockGetNoteById).toHaveBeenCalledWith('note-1', 'uid-1');
    expect(note).toBeUndefined();
  });
});

describe('noteService.getCount', () => {
  it('queries Supabase with count:exact and returns the integer', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: 7, error: null }),
    };
    mockFrom.mockReturnValue(chain as any);

    const result = await noteService.getCount();

    expect(mockFrom).toHaveBeenCalledWith('notes');
    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'uid-1');
    expect(result).toBe(7);
  });

  it('falls back to Dexie when Supabase throws', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ count: null, error: new Error('offline') }),
    };
    mockFrom.mockReturnValue(chain as any);
    mockGetAllNotes.mockResolvedValue([
      { id: 'a', createdAt: '2026-04-01T00:00:00.000Z' } as any,
      { id: 'b', createdAt: '2026-04-02T00:00:00.000Z' } as any,
    ]);

    const result = await noteService.getCount();

    expect(mockGetAllNotes).toHaveBeenCalledWith('uid-1');
    expect(result).toBe(2);
  });

  it('returns 0 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ data: { user: null } } as any);

    const result = await noteService.getCount();

    expect(result).toBe(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('noteService.getMonthlyCount', () => {
  it('queries Supabase with month range and returns the integer', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ count: 4, error: null }),
    };
    mockFrom.mockReturnValue(chain as any);

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)).toISOString();
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString();

    const result = await noteService.getMonthlyCount();

    expect(mockFrom).toHaveBeenCalledWith('notes');
    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'uid-1');
    expect(chain.gte).toHaveBeenCalledWith('created_at', start);
    expect(chain.lt).toHaveBeenCalledWith('created_at', end);
    expect(result).toBe(4);
  });

  it('falls back to Dexie when Supabase throws', async () => {
    const chain = {
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      gte: vi.fn().mockReturnThis(),
      lt: vi.fn().mockResolvedValue({ count: null, error: new Error('offline') }),
    };
    mockFrom.mockReturnValue(chain as any);

    const now = new Date();
    // Use UTC boundaries to match the implementation
    const inMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 10)).toISOString();
    const outOfMonth = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 10)).toISOString();

    mockGetAllNotes.mockResolvedValue([
      { id: 'a', createdAt: inMonth } as any,
      { id: 'b', createdAt: inMonth } as any,
      { id: 'c', createdAt: outOfMonth } as any,
    ]);

    const result = await noteService.getMonthlyCount();

    expect(mockGetAllNotes).toHaveBeenCalledWith('uid-1');
    expect(result).toBe(2);
  });

  it('returns 0 when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ data: { user: null } } as any);

    const result = await noteService.getMonthlyCount();

    expect(result).toBe(0);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('noteService.create', () => {
  it('waits for the create insert to settle before resolving', async () => {
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('note-1' as `${string}-${string}-${string}-${string}-${string}`);
    let resolveInsert: (value: { error: null }) => void = () => {};
    const insertResult = new Promise<{ error: null }>((resolve) => {
      resolveInsert = resolve;
    });
    const chain = {
      insert: vi.fn().mockReturnValue(insertResult),
    };
    mockFrom.mockReturnValue(chain as any);

    const created = noteService.create({
      title: 'Draft',
      content: 'A note',
      tasks: [{ id: 'task-1', text: 'Follow up', completed: false }],
    });
    let settled = false;
    void created.then(() => {
      settled = true;
    });

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(chain.insert).toHaveBeenCalled();
    expect(settled).toBe(false);
    expect(chain.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'note-1',
        user_id: 'uid-1',
        title: 'Draft',
        content: 'A note',
        tasks: [{ id: 'task-1', text: 'Follow up', completed: false }],
      }),
    );

    resolveInsert({ error: null });
    await expect(created).resolves.toMatchObject({ id: 'note-1', title: 'Draft' });
    expect(mockSaveNote).toHaveBeenCalledWith(expect.objectContaining({ syncStatus: 'pending_insert' }));
    expect(mockMarkAsSynced).toHaveBeenCalledWith('note-1');
    randomUUID.mockRestore();
  });
});

describe('noteService.update', () => {
  it('upserts the full note when the local note is still pending insert', async () => {
    const upsert = vi.fn().mockResolvedValue({ error: null });
    mockFrom.mockReturnValue({ upsert } as any);
    mockGetNoteById.mockResolvedValue({
      id: 'note-1',
      userId: 'uid-1',
      syncStatus: 'pending_insert',
      title: 'Draft',
      content: 'Old content',
      createdAt: '2026-04-20T00:00:00.000Z',
      updatedAt: '2026-04-20T00:00:00.000Z',
      tasks: [{ id: 'task-1', text: 'Follow up', completed: false }],
    } as any);

    await noteService.update('note-1', {
      content: 'Final content',
      attachments: [
        {
          id: 'attachment-1',
          name: 'voice.m4a',
          path: 'notes/note-1/voice.m4a',
          size: 123,
          type: 'audio/mp4',
        },
      ],
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'note-1',
        user_id: 'uid-1',
        title: 'Draft',
        content: 'Final content',
        attachments: [
          {
            id: 'attachment-1',
            name: 'voice.m4a',
            path: 'notes/note-1/voice.m4a',
            size: 123,
            type: 'audio/mp4',
          },
        ],
        tasks: [{ id: 'task-1', text: 'Follow up', completed: false }],
        created_at: '2026-04-20T00:00:00.000Z',
      }),
    );
    expect(mockMarkAsSynced).toHaveBeenCalledWith('note-1');
  });
});
