# Technical Audit Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix 7 confirmed bugs across 3 files — a crash on the Insights page, an unenforced 3-note minimum on the Life Wiki section, inaccurate note counters, dead code, and a non-user-scoped realtime subscription.

**Architecture:** Surgical fixes only. Each task targets one file. No new abstractions are introduced. The offline-first Dexie layer is preserved — Supabase becomes the primary data source for the two counter functions, with Dexie as the offline fallback. The 3-note minimum uses the constant already defined in `wellnessPolicy.ts`.

**Tech Stack:** React 19, TypeScript, Supabase JS v2, Dexie (IndexedDB), Vitest

---

## File Map

| File | Change |
|---|---|
| `services/noteService.test.ts` | **Create** — new test file for `getCount` and `getMonthlyCount` |
| `services/noteService.ts` | **Modify** — remove `NOTE_LIMIT = 50`; rewrite `getCount()` and `getMonthlyCount()` to query Supabase first |
| `pages/dashboard/Insights.tsx` | **Modify** — add `createPortal` import; remove `isPro`, `reflectionsUsed` state and `handleGenerateReflection`; simplify `fetchData`; add Life Wiki 3-note gate |
| `pages/dashboard/Home.tsx` | **Modify** — add user-scoped filter to the realtime subscription |

---

## Task 1: `noteService.ts` — write failing tests for `getCount` and `getMonthlyCount`

**Files:**
- Create: `services/noteService.test.ts`

- [ ] **Step 1: Create the test file with mocks and failing tests**

Create `services/noteService.test.ts` with the following content:

```typescript
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

    const result = await noteService.getMonthlyCount();

    expect(mockFrom).toHaveBeenCalledWith('notes');
    expect(chain.select).toHaveBeenCalledWith('*', { count: 'exact', head: true });
    expect(chain.eq).toHaveBeenCalledWith('user_id', 'uid-1');
    expect(chain.gte).toHaveBeenCalled();
    expect(chain.lt).toHaveBeenCalled();
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
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const inMonth = new Date(thisYear, thisMonth, 10).toISOString();
    const outOfMonth = new Date(thisYear, thisMonth - 1, 10).toISOString();

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
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd /c/Users/Arabinda/Reflections && npx vitest run services/noteService.test.ts
```

Expected output: Tests **FAIL**. `getCount` and `getMonthlyCount` currently call `offlineStorage` — the assertions about `supabase.from` being called will fail.

---

## Task 2: `noteService.ts` — remove dead constant, rewrite `getCount` and `getMonthlyCount`

**Files:**
- Modify: `services/noteService.ts`

- [ ] **Step 1: Remove `NOTE_LIMIT = 50` and rewrite `getCount`**

In `services/noteService.ts`, delete line 19 (`const NOTE_LIMIT = 50;`) entirely.

Then replace the `getCount` function (lines 196–201) with:

```typescript
  getCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    try {
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (error) throw error;
      return count ?? 0;
    } catch (err) {
      console.warn('Supabase getCount failed, falling back to local Dexie:', err);
      const notes = await offlineStorage.getAllNotes(user.id);
      return notes.length;
    }
  },
```

- [ ] **Step 2: Rewrite `getMonthlyCount`**

Replace the `getMonthlyCount` function (lines 212–228) with:

```typescript
  getMonthlyCount: async (): Promise<number> => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return 0;

    const now = new Date();
    const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));

    try {
      const { count, error } = await supabase
        .from('notes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', start.toISOString())
        .lt('created_at', end.toISOString());

      if (error) throw error;
      return count ?? 0;
    } catch (err) {
      console.warn('Supabase getMonthlyCount failed, falling back to local Dexie:', err);
      const notes = await offlineStorage.getAllNotes(user.id);
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      return notes.filter(note => {
        const noteDate = new Date(note.createdAt);
        return noteDate.getMonth() === currentMonth && noteDate.getFullYear() === currentYear;
      }).length;
    }
  },
```

- [ ] **Step 3: Run tests to confirm they pass**

```bash
cd /c/Users/Arabinda/Reflections && npx vitest run services/noteService.test.ts
```

Expected output: All 6 tests **PASS**.

- [ ] **Step 4: Run the full test suite to confirm no regressions**

```bash
cd /c/Users/Arabinda/Reflections && npx vitest run
```

Expected output: All existing tests **PASS** (wellnessPolicy, wellnessPrompts, wellnessStats, createNoteTasks).

- [ ] **Step 5: Commit**

```bash
cd /c/Users/Arabinda/Reflections && git add services/noteService.ts services/noteService.test.ts && git commit -m "fix: rewrite getCount and getMonthlyCount to query Supabase first with Dexie fallback"
```

---

## Task 3: `Insights.tsx` — dead code removal and `createPortal` import

**Files:**
- Modify: `pages/dashboard/Insights.tsx`

- [ ] **Step 1: Add `createPortal` to the React DOM import**

At the top of `pages/dashboard/Insights.tsx`, the current first import line is:

```typescript
import React, { useState, useEffect, useMemo } from 'react';
```

Add a new import line directly below it:

```typescript
import { createPortal } from 'react-dom';
```

- [ ] **Step 2: Remove `isPro` and `reflectionsUsed` state declarations**

Find and delete these two lines (currently around lines 34–35):

```typescript
  const [isPro, setIsPro] = useState(false);
  const [reflectionsUsed, setReflectionsUsed] = useState(0);
```

- [ ] **Step 3: Simplify `fetchData` — remove the Supabase auth call and dead setters**

Find the `fetchData` function inside the `useEffect`. It currently reads:

```typescript
      const [allNotes, userResponse, allThemes] = await Promise.all([
        noteService.getAll(),
        supabase.auth.getUser(),
        wikiService.getAllThemes()
      ]);
      
      setNotes(allNotes);
      setThemes(allThemes);
      
      if (userResponse.data.user) {
        const meta = userResponse.data.user.user_metadata || {};
        setIsPro(meta.is_pro || false);
        setReflectionsUsed(meta.reflections_used || 0);
      }
```

Replace the entire block with:

```typescript
      const [allNotes, allThemes] = await Promise.all([
        noteService.getAll(),
        wikiService.getAllThemes()
      ]);

      setNotes(allNotes);
      setThemes(allThemes);
```

- [ ] **Step 4: Remove the unused `supabase` import**

Find and delete this import line:

```typescript
import { supabase } from '../../src/supabaseClient';
```

- [ ] **Step 5: Remove `handleGenerateReflection`**

Find and delete the entire function (currently around lines 128–133):

```typescript
  const handleGenerateReflection = async () => {
    // Note: We are migrating towards incremental background ingestion.
    // For now, this button can act as a "Force Sync" or a trigger for a global audit
    // but the actual Wiki is populated primarily through Note Saves.
    navigate(RoutePath.CREATE_NOTE); // Encourage writing to grow the wiki
  };
```

Also grep the JSX below for any `onClick={handleGenerateReflection}` usage and delete those attributes too:

```bash
grep -n "handleGenerateReflection" /c/Users/Arabinda/Reflections/pages/dashboard/Insights.tsx
```

- [ ] **Step 6: TypeScript check**

```bash
cd /c/Users/Arabinda/Reflections && npx tsc --noEmit
```

Expected output: No errors. If there are errors, they will point to remaining references to `isPro`, `reflectionsUsed`, `supabase`, or `handleGenerateReflection` — delete those references.

- [ ] **Step 7: Commit**

```bash
cd /c/Users/Arabinda/Reflections && git add pages/dashboard/Insights.tsx && git commit -m "fix: remove dead isPro/reflectionsUsed state and add missing createPortal import"
```

---

## Task 4: `Insights.tsx` — Life Wiki 3-note minimum gate

**Files:**
- Modify: `pages/dashboard/Insights.tsx`

- [ ] **Step 1: Import `FREE_AI_MINIMUM_NOTES` from wellnessPolicy**

Add to the existing imports at the top of `pages/dashboard/Insights.tsx`:

```typescript
import { FREE_AI_MINIMUM_NOTES } from '../../services/wellnessPolicy';
```

- [ ] **Step 2: Replace the wiki section conditional with the three-state gate**

Find the existing conditional in the Life Wiki section (currently around line 280). It currently reads:

```typescript
        {themes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-[24px] bg-gray-50/30">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-nav shadow-sm mb-4">
                <Sparkles size={18} />
             </div>
             <p className="font-display text-gray-text text-xl">Your wiki is being built.</p>
             <p className="mt-2 text-gray-light text-[14px] max-w-sm mx-auto">As you journal, the AI librarian will automatically identify and update recurring themes in your life here.</p>
             <Button 
               variant="ghost" 
               className="mt-6 text-[11px] font-black"
               onClick={() => navigate(RoutePath.CREATE_NOTE)}
             >
                Write your first entry
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map(theme => (
```

Replace with:

```typescript
        {notes.length < FREE_AI_MINIMUM_NOTES ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-[24px] bg-gray-50/30">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-nav shadow-sm mb-4">
              <Sparkles size={18} />
            </div>
            <p className="font-display text-gray-text text-xl">Your wiki builds as you journal.</p>
            <p className="mt-2 text-gray-light text-[14px] max-w-sm mx-auto">
              Write {FREE_AI_MINIMUM_NOTES - notes.length} more {FREE_AI_MINIMUM_NOTES - notes.length === 1 ? 'entry' : 'entries'} to unlock your personal Life Wiki.
            </p>
            <Button
              variant="ghost"
              className="mt-6 text-[11px] font-black"
              onClick={() => navigate(RoutePath.CREATE_NOTE)}
            >
              Start writing
            </Button>
          </div>
        ) : themes.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-border rounded-[24px] bg-gray-50/30">
             <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-gray-nav shadow-sm mb-4">
                <Sparkles size={18} />
             </div>
             <p className="font-display text-gray-text text-xl">Your wiki is being built.</p>
             <p className="mt-2 text-gray-light text-[14px] max-w-sm mx-auto">As you journal, the AI librarian will automatically identify and update recurring themes in your life here.</p>
             <Button
               variant="ghost"
               className="mt-6 text-[11px] font-black"
               onClick={() => navigate(RoutePath.CREATE_NOTE)}
             >
                Write your first entry
             </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {themes.map(theme => (
```

- [ ] **Step 3: TypeScript check**

```bash
cd /c/Users/Arabinda/Reflections && npx tsc --noEmit
```

Expected output: No errors.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/Arabinda/Reflections && git add pages/dashboard/Insights.tsx && git commit -m "fix: gate Life Wiki section behind 3-note minimum using FREE_AI_MINIMUM_NOTES"
```

---

## Task 5: `Home.tsx` — scope realtime subscription to current user

**Files:**
- Modify: `pages/dashboard/Home.tsx`

- [ ] **Step 1: Add user-scoped filter to the postgres_changes subscription**

In `pages/dashboard/Home.tsx`, find the realtime subscription options object (currently around lines 84–89):

```typescript
        {
          event: '*',
          schema: 'public',
          table: 'notes',
        },
```

Replace with:

```typescript
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${user!.id}`,
        },
```

The `user!.id` non-null assertion is safe here: `if (!isAuthenticated) return <Landing />;` (line 121) runs before this component renders its main body, guaranteeing `user` is non-null by the time this `useEffect` executes.

- [ ] **Step 2: TypeScript check**

```bash
cd /c/Users/Arabinda/Reflections && npx tsc --noEmit
```

Expected output: No errors.

- [ ] **Step 3: Run the full test suite one final time**

```bash
cd /c/Users/Arabinda/Reflections && npx vitest run
```

Expected output: All tests **PASS**.

- [ ] **Step 4: Commit**

```bash
cd /c/Users/Arabinda/Reflections && git add pages/dashboard/Home.tsx && git commit -m "fix: scope realtime note subscription to current user only"
```

---

## Summary of all changes

| Task | File | What changed |
|---|---|---|
| 1–2 | `services/noteService.ts` | Removed `NOTE_LIMIT = 50`; `getCount` and `getMonthlyCount` now query Supabase first, fall back to Dexie |
| 1 | `services/noteService.test.ts` | New — 6 unit tests covering both Supabase and offline paths |
| 3 | `pages/dashboard/Insights.tsx` | Added `createPortal` import; removed `isPro`, `reflectionsUsed`, `supabase` import, `handleGenerateReflection` |
| 4 | `pages/dashboard/Insights.tsx` | Life Wiki section now shows a warm nudge if `notes.length < 3` |
| 5 | `pages/dashboard/Home.tsx` | Realtime subscription filtered to `user_id=eq.{uid}` |
