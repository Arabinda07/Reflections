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

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue({ data: { user: { id: 'uid-1' } } } as any);
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
