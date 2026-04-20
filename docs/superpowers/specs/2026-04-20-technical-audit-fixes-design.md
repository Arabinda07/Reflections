# Technical Audit Fixes — Design Spec
**Date:** 2026-04-20
**Scope:** 7 targeted bug fixes across 3 files. No new features, no new abstractions.

---

## Site Philosophy (context)

Reflections is a calm, private journaling sanctuary. Core bet: *compiled context beats retrieval* — a personal LLM Wiki grows with every save, so AI reflections become deeply contextual over time. No streaks, no pressure, no optimisation loops.

---

## Bug Inventory

| # | File | Bug | Severity |
|---|---|---|---|
| 1 | `Insights.tsx` | `createPortal` not imported — theme modal crashes on click | Critical |
| 2 | `Insights.tsx` | Life Wiki section shows regardless of note count (3-note minimum not enforced) | High |
| 3 | `Insights.tsx` | `isPro` / `reflectionsUsed` state fetched but never used | Low |
| 4 | `Insights.tsx` | `handleGenerateReflection` just navigates to CreateNote — misleading | Low |
| 5 | `noteService.ts` | `NOTE_LIMIT = 50` dead constant — mismatches actual limit of 30 | Low |
| 6 | `noteService.ts` | `getCount()` and `getMonthlyCount()` read from Dexie — inaccurate on fresh login | High |
| 7 | `Home.tsx` | Realtime subscription not user-scoped — fires on any user's note changes | Medium |

---

## Section 1: `noteService.ts` changes

### Remove `NOTE_LIMIT = 50`
Delete `const NOTE_LIMIT = 50` (line 19). It is unused and contradicts `FREE_MONTHLY_NOTE_LIMIT = 30` in `wellnessPolicy.ts`.

### Rewrite `getCount()` — Supabase-first with Dexie fallback
```
1. Query Supabase: SELECT count(*) FROM notes WHERE user_id = uid
   - Use { count: 'exact', head: true } — returns integer only, no row data transferred
2. On success: return the count
3. On failure (offline / error): fall back to offlineStorage.getAllNotes(uid).length
```

### Rewrite `getMonthlyCount()` — Supabase-first with Dexie fallback
```
1. Compute start/end of current calendar month (UTC)
2. Query Supabase: SELECT count(*) FROM notes 
                   WHERE user_id = uid 
                     AND created_at >= month_start 
                     AND created_at < month_end
   - Use { count: 'exact', head: true }
3. On success: return the count
4. On failure (offline / error): fall back to existing Dexie filter logic
```

Both methods preserve the offline-first guarantee. The Supabase count query is cheap — no rows transferred, just an integer.

---

## Section 2: `Insights.tsx` changes

### Fix 1 — Import `createPortal`
Add to imports:
```ts
import { createPortal } from 'react-dom';
```
This unblocks the theme detail modal. No other change needed.

### Fix 2 — Life Wiki 3-note minimum gate
Import `FREE_AI_MINIMUM_NOTES` from `../../services/wellnessPolicy`.

The Life Wiki section renders one of three states based on `notes.length`:

**State A — Below minimum (`notes.length < FREE_AI_MINIMUM_NOTES`):**
Show a warm nudge (no lock icon, no upgrade wall):
> "Your wiki builds as you journal. Write [X] more [entry/entries] to unlock your personal Life Wiki."
> (X = `FREE_AI_MINIMUM_NOTES - notes.length`)
With a "Start writing" ghost button linking to CreateNote.

**State B — Above minimum, no themes yet (`notes.length >= 3 && themes.length === 0`):**
Existing empty state: "Your wiki is being built..." — no change.

**State C — Themes exist (`themes.length > 0`):**
Existing theme grid — no change.

The nudge copy deliberately avoids pressure language. It counts down ("2 more entries") rather than blocking with a hard gate.

### Fix 3 — Remove dead `isPro` / `reflectionsUsed` state
- Delete `const [isPro, setIsPro] = useState(false)`
- Delete `const [reflectionsUsed, setReflectionsUsed] = useState(0)`
- In `fetchData`, remove the `supabase.auth.getUser()` call and the metadata reads that populate these variables
- Simplify `Promise.all` to `[noteService.getAll(), wikiService.getAllThemes()]`

### Fix 4 — Remove `handleGenerateReflection`
Delete the function and any button/call site wired to it. The "Refresh Insights" flow is listed in the README roadmap as a future feature — this placeholder misleads users into thinking something is happening.

---

## Section 3: `Home.tsx` change

### Scope the realtime subscription to the current user
Change the `postgres_changes` options from:
```ts
{ event: '*', schema: 'public', table: 'notes' }
```
to:
```ts
{ event: '*', schema: 'public', table: 'notes', filter: `user_id=eq.${user!.id}` }
```

The `user!.id` non-null assertion is safe: `if (!isAuthenticated) return <Landing />` runs before this component renders its main body, guaranteeing `user` is non-null.

---

## What is explicitly NOT changing

- The offline-first architecture of `noteService` (Dexie remains the write-through cache and offline fallback)
- The 30-note monthly limit enforcement (server-side trigger + client-side check in `CreateNote.tsx` both remain)
- The stats cards on the Insights page (always visible regardless of note count)
- The Life Wiki theme grid UI and detail modal (unchanged beyond the import fix)
- Any AI service logic or wiki ingest flow

---

## Files changed

| File | Lines affected |
|---|---|
| `services/noteService.ts` | Remove line 19; rewrite `getCount()` and `getMonthlyCount()` |
| `pages/dashboard/Insights.tsx` | Add import; gate wiki section; remove 2 state vars + fetchData cleanup; remove dead function |
| `pages/dashboard/Home.tsx` | Add filter to realtime subscription |
