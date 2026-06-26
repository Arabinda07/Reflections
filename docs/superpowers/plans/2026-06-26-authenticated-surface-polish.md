# Authenticated Surface Polish — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development or superpowers:executing-plans to implement task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Fix two latent bugs and apply the design-craft fixes from the two
`docs/critique/2026-06-26-*.md` reports, raising the authenticated surfaces to the
project's own "calm, premium" bar — without adding features.

**Architecture:** Targeted, low-risk edits to existing surfaces and two services.
Reuse existing primitives (`Skeleton`, `EmptyState`, `Surface`, tone scopes). No new
dependencies, no new routes.

**Tech Stack:** React + TypeScript, Vite, Tailwind, Supabase (PostgREST), Vitest,
Playwright (visual verification).

## Global Constraints

- **No new features.** Polish/bug-fixes only. Search, read-view prev/next, and
  inline tag editing are explicitly OUT of scope (see Backlog).
- **Respect PRODUCT.md:** calm, never evaluative/score-like, no pressure mechanics.
- **Reuse the design system:** `components/ui/Skeleton.tsx`, `EmptyState.tsx`,
  `Surface.tsx`, surface-scope tones; CSS tokens in `index.css`. No magic colors.
- **Guarded tests must stay green / be updated in the same task:**
  `pages/dashboard/copySafetyContract.test.ts`, `seoCrawlabilityContract.test.ts`,
  `landingSemanticContract.test.ts`, `components/ui/proUpgradePricingContract.test.ts`.
- **Verification reality:** bug fixes get unit tests; visual changes are verified by
  running the app + Playwright screenshots at desktop + 390px (the F6 method), using
  the test login (`fantasyaan@gmail.com`).
- After each task: `npx tsc --noEmit` clean, relevant `vitest` green, then commit.

---

## Phase 1 — Bug fixes (safest, real defects)

### Task 1: Quiet the `life_themes` 406 on the People room

**Files:**
- Modify: `services/wikiService.ts` (`getWikiPage`, ~L185–195)

**Why:** `getWikiPage` does `.eq('page_type', pageType).single()`. `.single()`
returns **HTTP 406** when there are 0 rows, which fires twice on every Relationships
visit for users without a People wiki page. `.maybeSingle()` returns `{data:null,
error:null}` instead. (Same class as the shipped profile-406 fix.)

- [ ] **Step 1:** In `getWikiPage`, change `.single()` → `.maybeSingle()`.
- [ ] **Step 2:** Update the guard so a null row returns null (don't map null):

```ts
const { data, error } = await supabase
  .from('life_themes')
  .select('*')
  .eq('user_id', userId)
  .eq('page_type', pageType)
  .maybeSingle();

if (error || !data) return null;
return mapEncryptedLifeTheme(data as SupabaseLifeThemeRow);
```

- [ ] **Step 3:** Verify live — `npm run dev`, log in, open `/relationships`, confirm
  **no** `life_themes ... 406` errors in the browser console (was 2). Capture console.
- [ ] **Step 4:** `npx tsc --noEmit`; commit `fix: use maybeSingle for wiki page lookup to stop 406`.

### Task 2: Guard the Life Wiki AI-run null-deref

**Files:**
- Modify: `services/aiRunClient.ts` (`readAiRunResponse`, L53–61)
- Test: `services/aiRunClient.test.ts` (create)

**Why:** On `response.ok` with an empty/null body, `(data as AiRunResponse<T>).data`
throws `TypeError: Cannot read properties of null (reading 'data')` (fires twice on
Life Wiki load). Guard the null and surface a clean, catchable error.

- [ ] **Step 1: Write the failing test** `services/aiRunClient.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { readAiRunResponse } from './aiRunClient';

describe('readAiRunResponse', () => {
  it('throws a clean error (not a TypeError) when an ok response has an empty body', async () => {
    const res = new Response('', { status: 200 });
    await expect(readAiRunResponse(res)).rejects.toThrow(/empty|unexpected/i);
  });
  it('returns the inner data on a well-formed ok response', async () => {
    const res = new Response(JSON.stringify({ ok: true, data: { runs: [] } }), { status: 200 });
    await expect(readAiRunResponse(res)).resolves.toEqual({ runs: [] });
  });
});
```

- [ ] **Step 2:** `export` `readAiRunResponse` and add the null guard:

```ts
export const readAiRunResponse = async <T>(response: Response): Promise<T> => {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error((data as { error?: string } | null)?.error || `AI run failed with status ${response.status}`);
  }
  if (data == null || typeof data !== 'object') {
    throw new Error('AI run response was empty or unexpected.');
  }
  return (data as AiRunResponse<T>).data;
};
```

- [ ] **Step 3:** `npx vitest run services/aiRunClient.test.ts` → PASS.
- [ ] **Step 4:** Verify live — open `/sanctuary`, confirm console no longer shows the
  `[LifeWiki] Failed to load AI run activity: TypeError ...` (a clean handled log at
  most). Commit `fix: guard empty AI-run response to stop null deref`.

---

## Phase 2 — Insights "quiet week" (P1 brand coherence)

### Task 3: Replace the zero-scoreboard with a calm quiet-week state

**Files:**
- Modify: `pages/dashboard/Insights.tsx` (~L279–305, the recap branch)

**Why:** A returning user who hasn't written **this week** (`weeklyRecap.writingDays
=== 0`, but `notes.length > 0`) is shown "You returned 0 days" above a 6-tile grid of
zeros — evaluative/score-like, against PRODUCT.md ("never evaluative or score-like…
no pressure mechanics"). The brand-new-user case already gets the Lottie `EmptyState`
(`notes.length === 0 && writingDays === 0`) — leave that.

- [ ] **Step 1:** Add a branch **before** the scoreboard render: when
  `weeklyRecap.writingDays === 0 && notes.length > 0`, render a calm card (sky scope,
  reuse `EmptyState surface="bezel"` or a `Surface`) instead of the metric grid:
  - Title: `A quiet week — that's allowed.`
  - Body: `Nothing to count here. Your past reflections are still in My notes whenever you want them.`
  - One soft action: `Write something` → `navigate(RoutePath.CREATE_NOTE)` (ghost/secondary, not a push).
  - Do **not** render the six zero tiles in this state.
- [ ] **Step 2:** Keep the existing scoreboard only when `weeklyRecap.writingDays > 0`.
- [ ] **Step 3:** Confirm no `copySafetyContract` banned phrases (no "streak", no
  pressure/urgency words) in the new copy.
- [ ] **Step 4:** Verify live — log in, open `/insights` at desktop + 390px; confirm
  the quiet-week state (no zero grid) and screenshot. `npx tsc --noEmit`; commit
  `feat: calm quiet-week state for Insights instead of zero scoreboard`.

---

## Phase 3 — Loading skeletons (P2, consistency vs spinners)

DESIGN/product register: "skeleton states for loading, not spinners in the middle of
content." Reuse `components/ui/Skeleton.tsx`.

### Task 4: Skeleton the notes library
**Files:** Modify `pages/dashboard/MyNotes.tsx` (the `loading` branch, ~L389–393)
- [ ] **Step 1:** Replace the full-screen `LoadingState` while `loading` with a grid
  of ~6 `Skeleton` cards matching the real card footprint (rounded-[2.5rem], image
  block + 3 text lines), inside the existing `PageContainer` + `SectionHeader`, so the
  page chrome stays and only the grid skeletons.
- [ ] **Step 2:** Verify live — open `/notes`, observe the skeleton grid on load
  (throttle network in devtools if needed), screenshot. `tsc`; commit.

### Task 5: Skeleton the read view
**Files:** Modify `pages/dashboard/SingleNote.tsx` (the `loading` branch, L285–292)
- [ ] **Step 1:** Replace the full-screen `LoadingState` with a document skeleton
  (title bar + 6–8 `Skeleton` text lines) inside the `Surface variant="bezel"
  tone="paper"` shell, so the reading frame appears immediately.
- [ ] **Step 2:** Verify live — open a note, observe the document skeleton, screenshot.
  `tsc`; commit `polish: skeleton loading for library and read view`.

---

## Phase 4 — De-clutter the library card (P2)

### Task 6: One delete path, one open target per note card
**Files:** Modify `pages/dashboard/MyNotes.tsx` (`renderNoteCard`, L208–385)

**Why:** Each card currently has an always-visible delete over the thumbnail **and**
swipe-to-delete; an export button **and** swipe-export; and 3 separate links opening
the same note. Visual noise + cognitive load; always-visible delete is anxiety on a
calm journal.

- [ ] **Step 1:** Remove the always-visible delete button over the thumbnail
  (L293–304). Keep **swipe-to-delete** (mobile) and add delete to the swipe rail only;
  on desktop, surface delete on hover within the footer overflow (keep the existing
  footer Export; group Delete beside it, shown on `group-hover`).
- [ ] **Step 2:** Collapse the 3 open-links to the note (image, title, "Open" button)
  so screen readers aren't read 3 identical "Open {title}" links: keep the image +
  title as the primary link, make the footer "Open" a visual affordance inside the
  same anchor or remove its duplicate `aria-label` (one accessible "Open {title}").
- [ ] **Step 3:** Verify live — `/notes` at desktop + 390px; confirm one delete path,
  cleaner card, swipe still works; screenshot. Tab through one card with keyboard and
  confirm a single "Open" announcement. `tsc`; commit `polish: de-duplicate note card affordances`.

---

## Phase 5 — Quieter Home hero (P2)

### Task 7: Make the orchestrated hero intro calmer / first-session-only
**Files:** Modify `pages/dashboard/HomeAuthenticated.tsx` (hero intro: `heroIntroState`,
the video + drag/scroll/timed dismiss, ~L505–591 and the init `getInitialHomeHeroIntroState`)

**Why:** Product register: "No orchestrated page-load sequences. Product loads into a
task." The cinematic hero conflicts with "Calm is behavior."

- [ ] **Step 1 (lazy default):** Gate the hero intro to **first session only** — extend
  the existing `HOME_HERO_SEEN_SESSION_KEY` check to a persistent flag (localStorage)
  so the cinematic intro shows once, then Home loads straight into the dashboard on
  return visits. (Keep the dashboard itself unchanged.)
- [ ] **Step 2:** Verify live — first load shows the intro; reload → straight to
  dashboard; screenshot both. `tsc`; commit `polish: show Home hero intro once, then load into the dashboard`.

---

## Phase 6 — Typographic cadence (P3, taste)

### Task 8: Reduce eyebrow ubiquity on hero moments
**Files:** `pages/dashboard/HomeAuthenticated.tsx`, `Insights.tsx`, `MyNotes.tsx`
(the `label-caps` / small-caps eyebrows above primary cards)

**Why:** Small-caps tracked eyebrows sit above nearly every card on every surface — the
one systemic "templated" tell. Keep them on genuinely list-like/secondary sections;
drop them from the single hero card on each surface so the heading carries it.

- [ ] **Step 1:** On each surface's **primary** card only, remove the redundant
  `label-caps` eyebrow where the adjacent heading already names the section (e.g.
  "TODAY'S REFLECTION" above "What happened today?"). Leave eyebrows on secondary/
  grouped sections.
- [ ] **Step 2:** Verify live — screenshot Home/Insights/MyNotes; confirm calmer
  hierarchy, no orphaned spacing. `tsc`; commit `polish: vary section cadence, drop redundant hero eyebrows`.

---

## Backlog — OUT OF SCOPE (features, not polish)

Do **not** implement without an explicit green-light:
- **Global note search / ⌘K** (`MyNotes` / nav) — the highest-value gap, but a feature.
- **Read-view prev/next** between entries (`SingleNote`).
- **Inline tag editing** on the read view (replace the tags `ModalSheet`).

## Self-review notes
- Spec coverage: every P1/P2/P3 from both critique docs maps to a task (P1 Insights →
  T3; P2 bugs → T1/T2; P2 skeletons → T4/T5; P2 card → T6; P2 hero → T7; P3 eyebrows →
  T8). Search/prev-next/inline-tags intentionally deferred to Backlog.
- Bug fixes carry unit/live verification; visual tasks carry Playwright screenshot
  verification (no fabricated unit tests for pixels).
