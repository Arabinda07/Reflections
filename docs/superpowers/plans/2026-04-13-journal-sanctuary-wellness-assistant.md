# Journal Sanctuary Wellness Assistant Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the existing journaling app into a calm journal-first wellness companion with free monthly usage limits, on-demand AI reflection, and a monthly wellness journey.

**Architecture:** Keep the existing React/Vite/Supabase structure. Add small service modules for subscription/usage policy, AI reflection prompting, and monthly wellness calculations, then wire those services into the existing `CreateNote`, `Insights`, `Home`, and `Account` screens. Payments are out of scope for this pass; upgrade actions route to the Account page or show copy that Pro checkout is not connected yet.

**Tech Stack:** React 19, TypeScript, Vite, Supabase, Google GenAI, date-fns, lucide-react, Vitest for pure service tests.

---

## File Structure

- Modify: `package.json` to add Vitest and a `test` script.
- Modify: `types.ts` to add plan, usage, AI gate, and monthly journey types.
- Modify: `supabase_setup.sql` to add `user_wellness_access` and RLS policies.
- Create: `services/wellnessPolicy.ts` for free/pro constants and entitlement helpers.
- Create: `services/wellnessStats.ts` for monthly wellness journey calculations.
- Create: `services/usageService.ts` for Supabase reads/writes of plan tier and free AI sample usage.
- Create: `services/aiReflectionService.ts` for crisis detection, human prompt building, and Google GenAI note reflection calls.
- Create: `services/wellnessPolicy.test.ts`, `services/wellnessStats.test.ts`, and `services/aiReflectionService.test.ts`.
- Modify: `services/noteService.ts` to replace the lifetime note limit of 3 with 30 notes per calendar month.
- Modify: `pages/dashboard/CreateNote.tsx` to gate on-demand AI reflection and soften the writing sanctuary.
- Modify: `pages/dashboard/Insights.tsx` to show monthly wellness journey and Pro gating.
- Modify: `pages/dashboard/Home.tsx` and `pages/dashboard/Account.tsx` for Pro/free messaging.
- Modify: `index.css` to add sanctuary UI utilities.

## Task 1: Add Test Harness And Shared Types

**Files:**
- Modify: `package.json`
- Modify: `types.ts`

- [ ] **Step 1: Install Vitest**

Run: `npm install -D vitest`

Expected: `package.json` and `package-lock.json` include `vitest` in dev dependencies.

- [ ] **Step 2: Update package scripts**

In `package.json`, replace the scripts block with:

```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "preview": "vite preview",
  "lint": "tsc --noEmit",
  "test": "vitest run"
}
```

- [ ] **Step 3: Add shared contracts**

Append this to `types.ts`:

```ts
export type PlanTier = 'free' | 'pro';

export interface WellnessAccess {
  userId: string;
  planTier: PlanTier;
  freeAiReflectionsUsed: number;
}

export interface NoteUsage {
  usedThisMonth: number;
  monthlyLimit: number;
  remainingThisMonth: number;
  canCreateNote: boolean;
}

export interface AiReflectionGate {
  canReflect: boolean;
  reason?: 'needs_more_notes' | 'sample_used' | 'missing_content';
  remainingFreeSamples: number;
  requiresUpgrade: boolean;
}

export interface MonthlyWellnessJourney {
  monthLabel: string;
  noteCount: number;
  writingDays: number;
  topMood?: string;
  moodCounts: Record<string, number>;
  topTags: Array<{ tag: string; count: number }>;
  recurringThemes: string[];
  summary: string;
  nextStep: string;
}
```

- [ ] **Step 4: Verify**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add package.json package-lock.json types.ts
git commit -m "chore: add wellness assistant test contracts"
```

## Task 2: Add Wellness Policy Helpers With Tests

**Files:**
- Create: `services/wellnessPolicy.ts`
- Create: `services/wellnessPolicy.test.ts`

- [ ] **Step 1: Write failing test**

Create `services/wellnessPolicy.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import {
  FREE_AI_REFLECTION_SAMPLES,
  FREE_MONTHLY_NOTE_LIMIT,
  getAiReflectionGate,
  getMonthlyNoteUsage,
} from './wellnessPolicy';
import type { Note, WellnessAccess } from '../types';

const note = (id: string, createdAt: string): Note => ({
  id,
  title: id,
  content: '<p>Today felt heavy but I took a walk.</p>',
  createdAt,
  updatedAt: createdAt,
});

describe('wellnessPolicy', () => {
  it('uses a 30 note monthly free limit and one free AI sample', () => {
    expect(FREE_MONTHLY_NOTE_LIMIT).toBe(30);
    expect(FREE_AI_REFLECTION_SAMPLES).toBe(1);
  });

  it('counts only notes from the current month', () => {
    const usage = getMonthlyNoteUsage([
      note('march', '2026-03-31T23:00:00.000Z'),
      note('april-one', '2026-04-01T00:00:00.000Z'),
      note('april-two', '2026-04-13T08:00:00.000Z'),
      note('may', '2026-05-01T00:00:00.000Z'),
    ], new Date('2026-04-13T10:30:00.000Z'));

    expect(usage).toEqual({
      usedThisMonth: 2,
      monthlyLimit: 30,
      remainingThisMonth: 28,
      canCreateNote: true,
    });
  });

  it('gates AI reflection for free users before enough notes and after the sample is used', () => {
    const access: WellnessAccess = {
      userId: 'user-1',
      planTier: 'free',
      freeAiReflectionsUsed: 1,
    };

    expect(getAiReflectionGate(access, 2, true)).toEqual({
      canReflect: false,
      reason: 'needs_more_notes',
      remainingFreeSamples: 0,
      requiresUpgrade: false,
    });

    expect(getAiReflectionGate(access, 3, true)).toEqual({
      canReflect: false,
      reason: 'sample_used',
      remainingFreeSamples: 0,
      requiresUpgrade: true,
    });
  });

  it('lets free users use one sample after a few notes', () => {
    const access: WellnessAccess = {
      userId: 'user-1',
      planTier: 'free',
      freeAiReflectionsUsed: 0,
    };

    expect(getAiReflectionGate(access, 3, true)).toEqual({
      canReflect: true,
      remainingFreeSamples: 1,
      requiresUpgrade: false,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- services/wellnessPolicy.test.ts`

Expected: FAIL with an import error because `services/wellnessPolicy.ts` does not exist.

- [ ] **Step 3: Implement policy helper**

Create `services/wellnessPolicy.ts`:

```ts
import type { AiReflectionGate, Note, NoteUsage, WellnessAccess } from '../types';

export const FREE_MONTHLY_NOTE_LIMIT = 30;
export const FREE_AI_REFLECTION_SAMPLES = 1;
export const FREE_AI_MINIMUM_NOTES = 3;

export function getMonthRange(now = new Date()) {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
  return { start, end };
}

export function getMonthlyNoteUsage(notes: Note[], now = new Date()): NoteUsage {
  const { start, end } = getMonthRange(now);
  const usedThisMonth = notes.filter((note) => {
    const created = new Date(note.createdAt);
    return created >= start && created < end;
  }).length;

  return {
    usedThisMonth,
    monthlyLimit: FREE_MONTHLY_NOTE_LIMIT,
    remainingThisMonth: Math.max(FREE_MONTHLY_NOTE_LIMIT - usedThisMonth, 0),
    canCreateNote: usedThisMonth < FREE_MONTHLY_NOTE_LIMIT,
  };
}

export function getAiReflectionGate(
  access: WellnessAccess,
  noteCount: number,
  hasContent: boolean
): AiReflectionGate {
  const remainingFreeSamples = Math.max(FREE_AI_REFLECTION_SAMPLES - access.freeAiReflectionsUsed, 0);

  if (!hasContent) {
    return { canReflect: false, reason: 'missing_content', remainingFreeSamples, requiresUpgrade: false };
  }
  if (access.planTier === 'pro') {
    return { canReflect: true, remainingFreeSamples: 0, requiresUpgrade: false };
  }
  if (noteCount < FREE_AI_MINIMUM_NOTES) {
    return { canReflect: false, reason: 'needs_more_notes', remainingFreeSamples, requiresUpgrade: false };
  }
  if (remainingFreeSamples <= 0) {
    return { canReflect: false, reason: 'sample_used', remainingFreeSamples: 0, requiresUpgrade: true };
  }
  return { canReflect: true, remainingFreeSamples, requiresUpgrade: false };
}
```

- [ ] **Step 4: Verify**

Run: `npm test -- services/wellnessPolicy.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add services/wellnessPolicy.ts services/wellnessPolicy.test.ts
git commit -m "feat: add wellness usage policy"
```

## Task 3: Add Monthly Wellness Journey Calculations

**Files:**
- Create: `services/wellnessStats.ts`
- Create: `services/wellnessStats.test.ts`

- [ ] **Step 1: Write failing test**

Create `services/wellnessStats.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildMonthlyWellnessJourney } from './wellnessStats';
import type { Note } from '../types';

const makeNote = (id: string, createdAt: string, mood: string | undefined, tags: string[], content: string): Note => ({
  id,
  title: id,
  content,
  createdAt,
  updatedAt: createdAt,
  mood,
  tags,
});

describe('buildMonthlyWellnessJourney', () => {
  it('builds a gentle monthly journey from notes in the selected month', () => {
    const journey = buildMonthlyWellnessJourney([
      makeNote('outside', '2026-03-20T12:00:00.000Z', 'happy', ['travel'], '<p>Outside month</p>'),
      makeNote('one', '2026-04-02T12:00:00.000Z', 'calm', ['rest', 'family'], '<p>I wanted rest today.</p>'),
      makeNote('two', '2026-04-04T12:00:00.000Z', 'anxious', ['work', 'rest'], '<p>Work felt loud, but I took a pause.</p>'),
      makeNote('three', '2026-04-04T16:00:00.000Z', 'calm', ['rest'], '<p>The pause helped.</p>'),
    ], new Date('2026-04-13T10:00:00.000Z'));

    expect(journey.monthLabel).toBe('April 2026');
    expect(journey.noteCount).toBe(3);
    expect(journey.writingDays).toBe(2);
    expect(journey.topMood).toBe('calm');
    expect(journey.moodCounts).toEqual({ calm: 2, anxious: 1 });
    expect(journey.topTags).toEqual([
      { tag: 'rest', count: 3 },
      { tag: 'family', count: 1 },
      { tag: 'work', count: 1 },
    ]);
    expect(journey.recurringThemes).toContain('rest');
    expect(journey.summary).toContain('April 2026');
    expect(journey.nextStep.length).toBeGreaterThan(10);
  });

  it('uses human empty-state copy when there are no notes this month', () => {
    const journey = buildMonthlyWellnessJourney([], new Date('2026-04-13T10:00:00.000Z'));
    expect(journey.summary).toBe('April is still open. One honest note is enough to begin.');
    expect(journey.nextStep).toBe('Start with one line about what has been taking up space today.');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- services/wellnessStats.test.ts`

Expected: FAIL because `services/wellnessStats.ts` does not exist.

- [ ] **Step 3: Implement monthly journey helper**

Create `services/wellnessStats.ts`:

```ts
import type { MonthlyWellnessJourney, Note } from '../types';
import { getMonthRange } from './wellnessPolicy';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function countBy(values: string[]) {
  return values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] || 0) + 1;
    return acc;
  }, {});
}

function topEntries(counts: Record<string, number>, limit: number) {
  return Object.entries(counts)
    .sort(([aKey, aValue], [bKey, bValue]) => bValue - aValue || aKey.localeCompare(bKey))
    .slice(0, limit);
}

function fallbackThemes(notes: Note[]) {
  const ignored = new Set(['about', 'after', 'again', 'also', 'because', 'been', 'from', 'have', 'just', 'that', 'this', 'today', 'with']);
  const words = notes
    .flatMap((note) => stripHtml(`${note.title} ${note.content}`).toLowerCase().match(/[a-z]{4,}/g) || [])
    .filter((word) => !ignored.has(word));

  return topEntries(countBy(words), 4).map(([theme]) => theme);
}

export function buildMonthlyWellnessJourney(notes: Note[], now = new Date()): MonthlyWellnessJourney {
  const { start, end } = getMonthRange(now);
  const monthNotes = notes.filter((note) => {
    const created = new Date(note.createdAt);
    return created >= start && created < end;
  });

  const monthLabel = new Intl.DateTimeFormat('en', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(start);
  const monthName = new Intl.DateTimeFormat('en', { month: 'long', timeZone: 'UTC' }).format(start);
  const writingDays = new Set(monthNotes.map((note) => note.createdAt.slice(0, 10))).size;
  const moodCounts = countBy(monthNotes.map((note) => note.mood || '').filter(Boolean));
  const topMood = topEntries(moodCounts, 1)[0]?.[0];
  const tagCounts = countBy(monthNotes.flatMap((note) => note.tags || []));
  const topTags = topEntries(tagCounts, 5).map(([tag, count]) => ({ tag, count }));
  const recurringThemes = topTags.length ? topTags.map(({ tag }) => tag).slice(0, 4) : fallbackThemes(monthNotes);

  if (monthNotes.length === 0) {
    return {
      monthLabel,
      noteCount: 0,
      writingDays: 0,
      moodCounts: {},
      topTags: [],
      recurringThemes: [],
      summary: `${monthName} is still open. One honest note is enough to begin.`,
      nextStep: 'Start with one line about what has been taking up space today.',
    };
  }

  const themeCopy = recurringThemes.length
    ? `You kept coming back to ${recurringThemes.slice(0, 3).join(', ')}.`
    : 'A few different thoughts showed up without one clear theme yet.';
  const moodCopy = topMood ? `The mood that appeared most was ${topMood}.` : 'You did not label many moods yet, and that is okay.';

  return {
    monthLabel,
    noteCount: monthNotes.length,
    writingDays,
    topMood,
    moodCounts,
    topTags,
    recurringThemes,
    summary: `${monthLabel} had ${monthNotes.length} ${monthNotes.length === 1 ? 'note' : 'notes'} across ${writingDays} ${writingDays === 1 ? 'day' : 'days'}. ${themeCopy} ${moodCopy}`,
    nextStep: 'Choose one pattern that feels true and write one gentle sentence about what it might be asking for.',
  };
}
```

- [ ] **Step 4: Verify**

Run: `npm test -- services/wellnessStats.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add services/wellnessStats.ts services/wellnessStats.test.ts
git commit -m "feat: add monthly wellness journey stats"
```

## Task 4: Add Supabase Usage Service And Schema

**Files:**
- Modify: `supabase_setup.sql`
- Create: `services/usageService.ts`

- [ ] **Step 1: Extend Supabase setup SQL**

Append this to `supabase_setup.sql`:

```sql
-- ==========================================
-- 3. WELLNESS ACCESS TABLE & POLICIES
-- ==========================================

CREATE TABLE IF NOT EXISTS public.user_wellness_access (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_tier TEXT NOT NULL DEFAULT 'free' CHECK (plan_tier IN ('free', 'pro')),
    free_ai_reflections_used INTEGER NOT NULL DEFAULT 0 CHECK (free_ai_reflections_used >= 0),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_wellness_access ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own wellness access"
ON public.user_wellness_access FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own wellness access"
ON public.user_wellness_access FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own wellness access"
ON public.user_wellness_access FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Create usage service**

Create `services/usageService.ts`:

```ts
import { supabase } from '../src/supabaseClient';
import type { PlanTier, WellnessAccess } from '../types';

function mapAccess(data: any): WellnessAccess {
  return {
    userId: data.user_id,
    planTier: data.plan_tier as PlanTier,
    freeAiReflectionsUsed: data.free_ai_reflections_used || 0,
  };
}

export const usageService = {
  async getAccess(): Promise<WellnessAccess> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase
      .from('user_wellness_access')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error) throw error;
    if (data) return mapAccess(data);

    const { data: created, error: insertError } = await supabase
      .from('user_wellness_access')
      .insert({ user_id: user.id, plan_tier: 'free', free_ai_reflections_used: 0 })
      .select()
      .single();

    if (insertError) throw insertError;
    return mapAccess(created);
  },

  async markFreeAiReflectionUsed(): Promise<WellnessAccess> {
    const access = await usageService.getAccess();
    if (access.planTier === 'pro') return access;

    const { data, error } = await supabase
      .from('user_wellness_access')
      .update({
        free_ai_reflections_used: access.freeAiReflectionsUsed + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', access.userId)
      .select()
      .single();

    if (error) throw error;
    return mapAccess(data);
  },
};
```

- [ ] **Step 3: Verify**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
git add supabase_setup.sql services/usageService.ts
git commit -m "feat: add wellness access tracking"
```

## Task 5: Add AI Reflection Service With Crisis-Safe Fallback

**Files:**
- Create: `services/aiReflectionService.ts`
- Create: `services/aiReflectionService.test.ts`

- [ ] **Step 1: Write failing test**

Create `services/aiReflectionService.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { buildReflectionPrompt, getCrisisReflection, hasCrisisLanguage } from './aiReflectionService';
import type { Note } from '../types';

const note: Note = {
  id: 'note-1',
  title: 'A hard day',
  content: '<p>I felt overwhelmed and wanted to rest.</p>',
  mood: 'tired',
  tags: ['rest'],
  createdAt: '2026-04-13T10:00:00.000Z',
  updatedAt: '2026-04-13T10:00:00.000Z',
};

describe('aiReflectionService', () => {
  it('detects crisis language locally', () => {
    expect(hasCrisisLanguage('I want to hurt myself tonight')).toBe(true);
    expect(hasCrisisLanguage('I took a walk and felt calmer')).toBe(false);
  });

  it('builds a warm friend plus journal mirror prompt', () => {
    const prompt = buildReflectionPrompt(note, [note]);
    expect(prompt).toContain('warm friend');
    expect(prompt).toContain('journal mirror');
    expect(prompt).toContain('Do not diagnose');
    expect(prompt).toContain('I felt overwhelmed');
    expect(prompt).not.toContain('therapist');
  });

  it('returns crisis support copy without diagnosis language', () => {
    const response = getCrisisReflection();
    expect(response).toContain('988');
    expect(response).toContain('emergency services');
    expect(response).not.toContain('diagnosis');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- services/aiReflectionService.test.ts`

Expected: FAIL because `services/aiReflectionService.ts` does not exist.

- [ ] **Step 3: Implement AI reflection service**

Create `services/aiReflectionService.ts`:

```ts
import { GoogleGenAI } from '@google/genai';
import type { Note } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });

const CRISIS_PATTERNS = [
  /kill myself/i,
  /end my life/i,
  /hurt myself/i,
  /suicide/i,
  /self harm/i,
  /can't go on/i,
  /cannot go on/i,
];

export function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function hasCrisisLanguage(text: string) {
  return CRISIS_PATTERNS.some((pattern) => pattern.test(text));
}

export function getCrisisReflection() {
  return 'I am really glad you wrote this down. If you might be in immediate danger, please contact emergency services now. If you are in the United States, you can call or text 988 for immediate crisis support. You deserve real support from a person right now.';
}

export function buildReflectionPrompt(currentNote: Note, recentNotes: Note[]) {
  const recentContext = recentNotes
    .filter((note) => note.id !== currentNote.id)
    .slice(0, 5)
    .map((note) => `Title: ${note.title || 'Untitled'}\nMood: ${note.mood || 'Not shared'}\nText: ${stripHtml(note.content).slice(0, 700)}`)
    .join('\n\n---\n\n');

  return `You are a calm wellness journaling companion. Sound like a warm friend with a slight journal mirror.

Important boundaries:
- Do not diagnose.
- Do not claim to provide therapy, treatment, or medical advice.
- Do not use clinical labels.
- Do not say "you always" or "you are".
- Do not make the user feel measured, graded, or analyzed.
- Use grounded phrases like "I noticed", "it seems", "maybe", and "it might be worth listening to".
- Keep it human, plain, and specific to the writing.
- Write 3 to 5 short sentences.

Current entry:
Title: ${currentNote.title || 'Untitled'}
Mood: ${currentNote.mood || 'Not shared'}
Tags: ${(currentNote.tags || []).join(', ') || 'None'}
Text: ${stripHtml(currentNote.content)}

Recent context:
${recentContext || 'No recent notes yet.'}`;
}

export async function generateAiReflection(currentNote: Note, recentNotes: Note[]) {
  const currentText = stripHtml(currentNote.content);
  if (hasCrisisLanguage(currentText)) return getCrisisReflection();

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: buildReflectionPrompt(currentNote, recentNotes),
  });

  return response.text || 'I am here with you. There is something worth listening to in what you wrote, even if it is still taking shape.';
}
```

- [ ] **Step 4: Verify**

Run: `npm test -- services/aiReflectionService.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add services/aiReflectionService.ts services/aiReflectionService.test.ts
git commit -m "feat: add warm AI reflection service"
```

## Task 6: Update Note Limit To 30 Notes Per Month

**Files:**
- Modify: `services/noteService.ts`

- [ ] **Step 1: Import policy helpers**

At the top of `services/noteService.ts`, add:

```ts
import { FREE_MONTHLY_NOTE_LIMIT, getMonthRange } from './wellnessPolicy';
```

Then remove:

```ts
const NOTE_LIMIT = 3;
```

- [ ] **Step 2: Add monthly count method**

Add this method inside `noteService` after `getCount`:

```ts
  getCountForCurrentMonth: async (now = new Date()): Promise<number> => {
    const { start, end } = getMonthRange(now);
    const { count, error } = await supabase
      .from('notes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', start.toISOString())
      .lt('created_at', end.toISOString());

    if (error) {
      console.error('Supabase DB Error (getCountForCurrentMonth notes):', error.message, error);
      throw error;
    }
    return count || 0;
  },
```

- [ ] **Step 3: Change create limit check**

In `create`, replace:

```ts
    const currentCount = await noteService.getCount();
    if (currentCount >= NOTE_LIMIT) {
      throw new Error('FREE_LIMIT_REACHED');
    }
```

with:

```ts
    const currentCount = await noteService.getCountForCurrentMonth();
    if (currentCount >= FREE_MONTHLY_NOTE_LIMIT) {
      throw new Error('FREE_LIMIT_REACHED');
    }
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm test -- services/wellnessPolicy.test.ts
npm run lint
```

Expected: Both commands PASS.

- [ ] **Step 5: Commit**

Run:

```powershell
git add services/noteService.ts
git commit -m "feat: enforce monthly free note limit"
```

## Task 7: Wire On-Demand AI Into The Writing Sanctuary

**Files:**
- Modify: `pages/dashboard/CreateNote.tsx`

- [ ] **Step 1: Update imports and remove direct reflection client**

In `CreateNote.tsx`, change:

```ts
import { GoogleGenAI, Type } from "@google/genai";
```

to:

```ts
import { GoogleGenAI, Type } from '@google/genai';
import { generateAiReflection } from '../../services/aiReflectionService';
import { usageService } from '../../services/usageService';
import { getAiReflectionGate } from '../../services/wellnessPolicy';
import type { AiReflectionGate, WellnessAccess } from '../../types';
```

Keep the existing `const ai = new GoogleGenAI(...)` because dynamic prompts and suggested tags still use it. Only note reflection moves into the new service.

- [ ] **Step 2: Add access and gate state**

Add near the other state declarations:

```ts
  const [wellnessAccess, setWellnessAccess] = useState<WellnessAccess | null>(null);
  const [aiGate, setAiGate] = useState<AiReflectionGate | null>(null);
  const [aiGateMessage, setAiGateMessage] = useState<string | null>(null);
```

- [ ] **Step 3: Load access and update gate**

Add this effect after `const hasContent = content && content !== '<p><br></p>';` is declared. If hook ordering makes that awkward, move `hasContent` above the effect and keep it before the return statements:

```ts
  useEffect(() => {
    const loadAccess = async () => {
      try {
        const access = await usageService.getAccess();
        setWellnessAccess(access);
        const allNotes = await noteService.getAll();
        setAiGate(getAiReflectionGate(access, allNotes.length, Boolean(hasContent)));
      } catch (error) {
        console.error('Failed to load wellness access:', error);
      }
    };

    loadAccess();
  }, [hasContent]);
```

- [ ] **Step 4: Replace `handleAiReflect`**

Replace the existing function body with:

```ts
  const handleAiReflect = async () => {
    if (!content || content === '<p><br></p>') return;
    setAiGateMessage(null);

    const allNotes = await noteService.getAll();
    const access = wellnessAccess || await usageService.getAccess();
    const gate = getAiReflectionGate(access, allNotes.length, Boolean(hasContent));
    setAiGate(gate);

    if (!gate.canReflect) {
      if (gate.reason === 'needs_more_notes') {
        setAiGateMessage('Write a few notes first so your sample reflection has something real to work with.');
      } else if (gate.reason === 'sample_used') {
        setAiGateMessage('You have used your free AI reflection. Pro unlocks the full assistant.');
      } else {
        setAiGateMessage('Write a little first, then I can reflect it back with you.');
      }
      return;
    }

    setIsReflecting(true);
    setAiReflection(null);

    try {
      const reflection = await generateAiReflection({
        id: id || 'draft-note',
        title,
        content,
        mood,
        tags,
        tasks,
        attachments: existingAttachments,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }, allNotes);

      setAiReflection(reflection);

      if (access.planTier === 'free') {
        const updatedAccess = await usageService.markFreeAiReflectionUsed();
        setWellnessAccess(updatedAccess);
        setAiGate(getAiReflectionGate(updatedAccess, allNotes.length, Boolean(hasContent)));
      }
    } catch (error) {
      console.error('AI Reflection failed:', error);
      setAiReflection('I am having trouble reflecting right now, but I am still here with you.');
    } finally {
      setIsReflecting(false);
    }
  };
```

- [ ] **Step 5: Update button and gate copy**

Change the nav button label from `AI REFLECT` to `Reflect with AI`.

Add this block above the reflection card:

```tsx
                {aiGateMessage && (
                  <div className="mt-10 rounded-2xl border border-blue/15 bg-blue/5 p-5 text-[15px] font-medium leading-relaxed text-gray-text">
                    {aiGateMessage}
                    {aiGate?.requiresUpgrade && (
                      <button
                        onClick={() => navigate(RoutePath.ACCOUNT)}
                        className="ml-2 font-extrabold text-blue underline decoration-blue/30 underline-offset-4"
                      >
                        View Pro
                      </button>
                    )}
                  </div>
                )}
```

- [ ] **Step 6: Humanize reflection card copy**

Change `AI Insights` to `Reflection`, change `A moment of reflection` to `A gentle mirror for what you wrote`, and change `Thoughtfully generated for you` to `For reflection, not medical advice`.

- [ ] **Step 7: Update free limit copy**

In the limit reached UI, replace the 3-note copy with:

```tsx
Free users can create up to <span className="text-indigo-600 font-bold">30 notes each month</span>. Pro unlocks unlimited notes, reflections, and your monthly wellness journey.
```

- [ ] **Step 8: Verify**

Run:

```powershell
npm run lint
npm run build
```

Expected: Both commands PASS.

- [ ] **Step 9: Commit**

Run:

```powershell
git add pages/dashboard/CreateNote.tsx
git commit -m "feat: gate on-demand AI reflections"
```

## Task 8: Build The Monthly Wellness Journey Stats Center

**Files:**
- Modify: `pages/dashboard/Insights.tsx`

- [ ] **Step 1: Replace AI generation with local journey calculations**

Remove `GoogleGenAI` usage and add:

```ts
import { CalendarDays, Lock, Tag } from 'lucide-react';
import { buildMonthlyWellnessJourney } from '../../services/wellnessStats';
import { usageService } from '../../services/usageService';
import type { MonthlyWellnessJourney, WellnessAccess } from '../../types';
```

Keep existing useful icons such as `ArrowLeft`, `Brain`, `TrendingUp`, `Heart`, `Loader2`, and `Sparkles`.

- [ ] **Step 2: Replace reflection state**

Replace:

```ts
  const [reflection, setReflection] = useState<string>("");
  const [generating, setGenerating] = useState(false);
```

with:

```ts
  const [journey, setJourney] = useState<MonthlyWellnessJourney | null>(null);
  const [wellnessAccess, setWellnessAccess] = useState<WellnessAccess | null>(null);
```

- [ ] **Step 3: Replace data loading**

Inside the existing `fetchData`, replace its `try` block with:

```ts
      try {
        const [allNotes, access] = await Promise.all([
          noteService.getAll(),
          usageService.getAccess(),
        ]);
        setNotes(allNotes);
        setWellnessAccess(access);
        setJourney(buildMonthlyWellnessJourney(allNotes));
      } catch (error) {
        console.error('Failed to fetch wellness journey:', error);
      } finally {
        setLoading(false);
      }
```

Delete the old `generateReflection` function.

- [ ] **Step 4: Replace the old analytics cards**

Replace the current grid and AI reflection card content with these sections:

```tsx
        {journey && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border-2 border-border rounded-[28px] p-7 shadow-[0_4px_0_0_#E5E5E5]">
                <CalendarDays className="text-blue mb-5" size={26} />
                <p className="text-[12px] font-black uppercase tracking-widest text-gray-nav mb-2">This Month</p>
                <p className="text-[34px] font-display text-gray-text">{journey.noteCount}</p>
                <p className="text-[14px] font-medium text-gray-light">notes in {journey.monthLabel}</p>
              </div>

              <div className="bg-white border-2 border-border rounded-[28px] p-7 shadow-[0_4px_0_0_#E5E5E5]">
                <TrendingUp className="text-green mb-5" size={26} />
                <p className="text-[12px] font-black uppercase tracking-widest text-gray-nav mb-2">Writing Rhythm</p>
                <p className="text-[34px] font-display text-gray-text">{journey.writingDays}</p>
                <p className="text-[14px] font-medium text-gray-light">days you checked in</p>
              </div>

              <div className="bg-white border-2 border-border rounded-[28px] p-7 shadow-[0_4px_0_0_#E5E5E5]">
                <Brain className="text-blue mb-5" size={26} />
                <p className="text-[12px] font-black uppercase tracking-widest text-gray-nav mb-2">Mood That Showed Up</p>
                <p className="text-[34px] font-display text-gray-text">{journey.topMood || 'open'}</p>
                <p className="text-[14px] font-medium text-gray-light">based on your mood labels</p>
              </div>
            </div>

            <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5]">
              <div className="flex items-center gap-3 mb-5">
                <Sparkles className="text-green" size={24} />
                <h3 className="text-[22px] font-display text-gray-text lowercase">{journey.monthLabel}</h3>
              </div>
              <p className="text-[18px] leading-relaxed text-gray-text font-medium mb-6">{journey.summary}</p>
              <div className="rounded-2xl bg-green/5 border border-green/15 p-5 text-[15px] font-medium text-gray-text">
                {journey.nextStep}
              </div>
            </div>

            <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5]">
              <div className="flex items-center gap-3 mb-5">
                <Tag className="text-blue" size={22} />
                <h3 className="text-[18px] font-display text-gray-text lowercase">themes that kept appearing</h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {journey.recurringThemes.length > 0 ? journey.recurringThemes.map((theme) => (
                  <span key={theme} className="rounded-2xl border border-blue/10 bg-blue/5 px-4 py-2 text-[13px] font-extrabold text-blue">
                    #{theme}
                  </span>
                )) : (
                  <p className="text-[15px] font-medium text-gray-light">No strong themes yet. Keep writing and this will become more personal.</p>
                )}
              </div>
            </div>

            {wellnessAccess?.planTier !== 'pro' && (
              <div className="bg-white border-2 border-border rounded-[32px] p-8 shadow-[0_8px_0_0_#E5E5E5]">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-blue/5 text-blue flex items-center justify-center border border-blue/10">
                      <Lock size={22} />
                    </div>
                    <div>
                      <h3 className="text-[18px] font-display text-gray-text lowercase">pro unlocks the full assistant</h3>
                      <p className="mt-2 text-[15px] font-medium leading-relaxed text-gray-light">
                        Unlimited notes, unlimited reflections, and deeper monthly journey summaries.
                      </p>
                    </div>
                  </div>
                  <Button variant="primary" onClick={() => navigate(RoutePath.ACCOUNT)}>
                    View Pro
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
```

- [ ] **Step 5: Add safety footer**

Add near the end of the `space-y-8` wrapper:

```tsx
        <p className="text-center text-[12px] font-bold uppercase tracking-widest text-gray-nav">
          For reflection and general wellness only. This is not medical advice.
        </p>
```

- [ ] **Step 6: Verify**

Run:

```powershell
npm run lint
npm run build
```

Expected: Both commands PASS.

- [ ] **Step 7: Commit**

Run:

```powershell
git add pages/dashboard/Insights.tsx
git commit -m "feat: add monthly wellness journey"
```

## Task 9: Add Pro Messaging To Home And Account

**Files:**
- Modify: `pages/dashboard/Home.tsx`
- Modify: `pages/dashboard/Account.tsx`

- [ ] **Step 1: Update home copy**

In `Home.tsx`, replace:

```tsx
<h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider mb-2">Mental Health Insights</h3>
<p className="text-[15px] text-gray-light font-medium leading-relaxed">AI is ready to analyze your patterns and provide compassionate feedback.</p>
```

with:

```tsx
<h3 className="text-[16px] font-bold text-gray-nav uppercase tracking-wider mb-2">Monthly Wellness Journey</h3>
<p className="text-[15px] text-gray-light font-medium leading-relaxed">Gentle patterns from your journal, with AI reflection available when you ask for it.</p>
```

Also change the daily prompt button text from `WRITE ABOUT IT` to `Start Writing`.

- [ ] **Step 2: Add account plan card**

In `Account.tsx`, add this as the first section inside the main settings grid:

```tsx
                    <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                             <div className="h-10 w-10 rounded-xl bg-green/10 flex items-center justify-center text-green border border-green/15">
                                 <Shield size={20} strokeWidth={2.5} />
                             </div>
                             <h3 className="text-[18px] font-display text-gray-text lowercase">plan</h3>
                        </div>

                        <div className="rounded-[28px] border-2 border-border bg-white p-7 shadow-[0_4px_0_0_#E5E5E5]">
                          <p className="text-[12px] font-black uppercase tracking-widest text-gray-nav mb-2">Current plan</p>
                          <h4 className="text-[26px] font-display text-gray-text lowercase mb-3">free</h4>
                          <p className="text-[15px] font-medium leading-relaxed text-gray-light">
                            Free includes 30 notes each month and one sample AI reflection after a few notes. Pro will unlock unlimited notes, AI reflections, and the full monthly wellness journey.
                          </p>
                          <Button
                            type="button"
                            variant="primary"
                            className="mt-6"
                            onClick={() => alert('Pro checkout is not connected yet.')}
                          >
                            View Pro
                          </Button>
                        </div>
                    </div>
```

- [ ] **Step 3: Verify**

Run:

```powershell
npm run lint
npm run build
```

Expected: Both commands PASS.

- [ ] **Step 4: Commit**

Run:

```powershell
git add pages/dashboard/Home.tsx pages/dashboard/Account.tsx
git commit -m "feat: add wellness plan messaging"
```

## Task 10: Add Sanctuary UI Utilities And Polish CreateNote

**Files:**
- Modify: `index.css`
- Modify: `pages/dashboard/CreateNote.tsx`

- [ ] **Step 1: Add sanctuary utilities**

Add inside the existing `@layer components` block in `index.css`, after `.panel-label::after`:

```css
  .sanctuary-panel {
    background: rgba(var(--panel-bg-rgb, 255, 255, 255), 0.86);
    border: 1px solid color-mix(in srgb, var(--border-color) 78%, transparent);
    border-radius: 24px;
    box-shadow: 0 10px 30px rgba(16, 24, 40, 0.05);
  }

  .sanctuary-button {
    border-radius: 14px;
    border: 1px solid color-mix(in srgb, var(--border-color) 80%, transparent);
    box-shadow: none;
    text-transform: none;
    letter-spacing: 0;
  }

  .sanctuary-muted-copy {
    color: var(--gray-light);
    font-size: 14px;
    font-weight: 600;
    line-height: 1.7;
  }
```

- [ ] **Step 2: Soften the writing panel**

In `CreateNote.tsx`, replace:

```tsx
<div className="relative min-h-[70vh] rounded-[32px] border-2 border-border bg-white shadow-[0_8px_0_0_#E5E5E5] flex flex-col liquid-glass !overflow-visible">
```

with:

```tsx
<div className="relative min-h-[70vh] sanctuary-panel flex flex-col !overflow-visible">
```

- [ ] **Step 3: Update human writing copy**

Change the title input hint from `Title your entry...` to `What would you call this moment?`.

Change the safety footer text to:

```tsx
This is your space. Write what feels true, and ask for reflection only when you want it.
```

- [ ] **Step 4: Verify**

Run:

```powershell
npm run lint
npm run build
```

Expected: Both commands PASS.

Start the dev server with `npm run dev` and visually verify the Create Note page has a softer, less heavy writing panel, the AI button is on-demand, and no console errors appear.

- [ ] **Step 5: Commit**

Run:

```powershell
git add index.css pages/dashboard/CreateNote.tsx
git commit -m "style: soften journal sanctuary UI"
```

## Task 11: Final Verification

**Files:**
- Verify all changed files.

- [ ] **Step 1: Run full tests**

Run: `npm test`

Expected: PASS for all service tests.

- [ ] **Step 2: Run type check**

Run: `npm run lint`

Expected: PASS.

- [ ] **Step 3: Run production build**

Run: `npm run build`

Expected: PASS and Vite writes production output to `dist`.

- [ ] **Step 4: Manual flow check**

Run: `npm run dev`

Verify:

- A free user can create notes until the monthly count reaches 30.
- The note limit message says 30 notes per month.
- AI reflection does not run automatically.
- `Reflect with AI` gates free users before enough notes.
- `Reflect with AI` uses the one free sample after enough notes.
- After the free sample is used, the button shows upgrade messaging.
- Stats Center shows the monthly wellness journey.
- Free users see Pro messaging for full assistant access.
- The writing page feels calmer and has no layout overflow on mobile.

- [ ] **Step 5: Commit final cleanups if needed**

If verification required small fixes, run:

```powershell
git add .
git commit -m "fix: polish wellness assistant flow"
```

If no fixes were needed, do not create an empty commit.

## Self-Review

- Spec coverage: The plan covers the journal-first sanctuary, on-demand AI reflection, warm friend plus journal mirror voice, 30 notes/month free tier, one free sample reflection, Pro gating, monthly wellness journey, safety copy, and payment out-of-scope messaging.
- Red-flag scan: The plan contains concrete file paths, commands, code snippets, and expected outcomes for each task.
- Type consistency: `PlanTier`, `WellnessAccess`, `NoteUsage`, `AiReflectionGate`, and `MonthlyWellnessJourney` are introduced in Task 1 and reused consistently.
