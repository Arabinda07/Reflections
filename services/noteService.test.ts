import { describe, it, expect, vi, beforeEach } from 'vitest';
import { noteService } from './noteService';
import { supabase } from '../src/supabaseClient';
import { offlineStorage } from './offlineStorage';
import { noteRemoteStore } from './noteRemoteStore';
import { syncEngine } from './syncEngine';

vi.mock('../src/supabaseClient', () => ({
  supabase: {
    auth: { getUser: vi.fn() },
    from: vi.fn(),
  },
}));

vi.mock('./noteRemoteStore', () => ({
  noteRemoteStore: {
    fetchAll: vi.fn(),
    fetchById: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    remove: vi.fn(),
    count: vi.fn(),
    monthlyCount: vi.fn(),
  },
  mapToNote: vi.fn(),
  mapToDbNote: vi.fn(),
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

vi.mock('./syncEngine', () => ({
  syncEngine: {
    enqueueInsert: vi.fn(),
    enqueueUpdate: vi.fn(),
    enqueueDelete: vi.fn(),
  },
}));

const mockAuth = vi.mocked(supabase.auth.getUser);
const mockFrom = vi.mocked(supabase.from);
const mockGetAllNotes = vi.mocked(offlineStorage.getAllNotes);
const mockGetNoteById = vi.mocked(offlineStorage.getNoteById);
const mockSaveNote = vi.mocked(offlineStorage.saveNote);
const mockMarkAsSynced = vi.mocked(offlineStorage.markAsSynced);
const mockRemoteCount = vi.mocked(noteRemoteStore.count);
const mockRemoteMonthlyCount = vi.mocked(noteRemoteStore.monthlyCount);
const mockEnqueueInsert = vi.mocked(syncEngine.enqueueInsert);
const mockEnqueueUpdate = vi.mocked(syncEngine.enqueueUpdate);

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
  it('queries noteRemoteStore.count and returns the integer', async () => {
    mockRemoteCount.mockResolvedValue(7);

    const result = await noteService.getCount();

    expect(mockRemoteCount).toHaveBeenCalledWith('uid-1');
    expect(result).toBe(7);
  });

  it('falls back to Dexie when remote store throws', async () => {
    mockRemoteCount.mockRejectedValue(new Error('offline'));
    mockGetAllNotes.mockResolvedValue([
      { id: 'a', createdAt: '2026-04-01T00:00:00.000Z' } as any,
      { id: 'b', createdAt: '2026-04-02T00:00:00.000Z' } as any,
    ]);

    const result = await noteService.getCount();

    expect(mockGetAllNotes).toHaveBeenCalledWith('uid-1');
    expect(result).toBe(2);
  });

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ data: { user: null } } as any);

    await expect(noteService.getCount()).rejects.toThrow('User not authenticated');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('noteService.getMonthlyCount', () => {
  it('queries noteRemoteStore.monthlyCount and returns the integer', async () => {
    mockRemoteMonthlyCount.mockResolvedValue(4);

    const result = await noteService.getMonthlyCount();

    expect(mockRemoteMonthlyCount).toHaveBeenCalledWith('uid-1');
    expect(result).toBe(4);
  });

  it('falls back to Dexie when remote store throws', async () => {
    mockRemoteMonthlyCount.mockRejectedValue(new Error('offline'));

    const now = new Date();
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

  it('throws when user is not authenticated', async () => {
    mockAuth.mockResolvedValue({ data: { user: null } } as any);

    await expect(noteService.getMonthlyCount()).rejects.toThrow('User not authenticated');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('noteService.create', () => {
  it('calls syncEngine.enqueueInsert and returns the note', async () => {
    const randomUUID = vi
      .spyOn(crypto, 'randomUUID')
      .mockReturnValue('note-1' as `${string}-${string}-${string}-${string}-${string}`);

    const created = await noteService.create({
      title: 'Draft',
      content: 'A note',
      tasks: [{ id: 'task-1', text: 'Follow up', completed: false }],
    });

    expect(mockEnqueueInsert).toHaveBeenCalledWith('uid-1', expect.objectContaining({ id: 'note-1', title: 'Draft' }));
    expect(created).toMatchObject({ id: 'note-1', title: 'Draft' });
    randomUUID.mockRestore();
  });
});

describe('noteService.update', () => {
  it('calls syncEngine.enqueueUpdate', async () => {
    mockEnqueueUpdate.mockResolvedValue({} as any);

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

    expect(mockEnqueueUpdate).toHaveBeenCalledWith('uid-1', 'note-1', expect.objectContaining({ content: 'Final content' }));
  });
});
