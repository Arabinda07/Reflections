# Private Pages Flagship Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Polish the authenticated Reflections private pages into one cohesive, calm writing workspace without changing product workflows.

**Architecture:** Use a contract-led, systems-first pass. Add one focused private-polish source contract, then make small edits in the shared private shell, shared CSS/primitives, and the included private pages until the contract, existing dashboard contracts, build, and browser checks pass.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Tailwind utility classes, Motion, Phosphor Icons, local UI primitives in `components/ui/`.

---

## Source Spec

Read this first:

- `docs/superpowers/specs/2026-05-03-private-pages-flagship-polish-design.md`

Implementation constraints from the approved spec:

- Keep existing workflows intact.
- Do not add features.
- Do not touch public landing, public FAQ, public About, public Privacy, or auth pages unless a private-shell regression requires a small shared fix.
- Keep every changed line traceable to private-app polish.
- Favor existing primitives over new abstractions.
- Keep motion purposeful and reduced-motion safe.

## File Structure

Create:

- `pages/dashboard/privateFlagshipPolishContract.test.ts`  
  Source-level contract for the surgical polish pass. It locks scope, shared rhythm, touch-safe writing controls, concrete trust copy, non-diagnostic insight copy, and empty/loading state coverage.

Modify:

- `pages/dashboard/HomeAuthenticated.tsx`  
  Restrain action motion, clarify primary/secondary action hierarchy, and keep the home dashboard centered on writing.

- `pages/dashboard/ReleaseMode.tsx`  
  Move the release flow onto `PageContainer`, `SectionHeader`, and `Surface` while preserving release behavior.

- `pages/dashboard/FutureLetters.tsx`  
  Replace plain loading and empty copy in the letter list with `Skeleton` and `EmptyState`.

- `pages/dashboard/LifeWiki.tsx`  
  Replace the manual main header with `SectionHeader`, and place the stats row in a tonal `Surface`.

- `pages/dashboard/CreateNote.tsx`  
  Add explicit pressed state and accessible label to focus controls, and make tag and mood controls easier to operate on touch.

- `pages/dashboard/SingleNote.tsx`  
  Make metadata edit controls touch-safe without changing note read/edit behavior.

- `pages/dashboard/Insights.tsx`  
  Reword monthly insight copy so it remains observational and non-diagnostic.

- `pages/dashboard/Account.tsx`  
  Make the destructive data deletion copy more concrete.

- `index.css`  
  Only touch if a repeated spacing/control pattern needs an existing shared class adjusted. Prefer existing `core-page-stack`, `core-section-stack`, `core-control-cluster`, `Surface`, and `Button` first.

Do not modify:

- `pages/dashboard/Landing.tsx`
- `pages/dashboard/FAQ.tsx`
- `pages/dashboard/AboutArabinda.tsx`
- `pages/dashboard/PrivacyPolicy.tsx`
- `pages/auth/*`
- backend services or Supabase files

## Task 1: Add The Private Polish Contract

**Files:**

- Create: `pages/dashboard/privateFlagshipPolishContract.test.ts`

- [ ] **Step 1: Write the failing contract**

Create `pages/dashboard/privateFlagshipPolishContract.test.ts` with this exact content:

```ts
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const PRIVATE_PAGE_FILES = [
  'pages/dashboard/HomeAuthenticated.tsx',
  'pages/dashboard/MyNotes.tsx',
  'pages/dashboard/CreateNote.tsx',
  'pages/dashboard/SingleNote.tsx',
  'pages/dashboard/Insights.tsx',
  'pages/dashboard/LifeWiki.tsx',
  'pages/dashboard/ReleaseMode.tsx',
  'pages/dashboard/FutureLetters.tsx',
  'pages/dashboard/Account.tsx',
] as const;

describe('private flagship polish contract', () => {
  it('keeps the polish pass scoped to authenticated private pages', () => {
    const excludedFiles = [
      'pages/dashboard/Landing.tsx',
      'pages/dashboard/FAQ.tsx',
      'pages/dashboard/AboutArabinda.tsx',
      'pages/dashboard/PrivacyPolicy.tsx',
      'pages/auth/SignIn.tsx',
      'pages/auth/SignUp.tsx',
      'pages/auth/ResetPassword.tsx',
    ];

    for (const filePath of excludedFiles) {
      expect(PRIVATE_PAGE_FILES).not.toContain(filePath as (typeof PRIVATE_PAGE_FILES)[number]);
    }

    for (const filePath of PRIVATE_PAGE_FILES) {
      expect(read(filePath), filePath).toContain('page-wash');
    }
  });

  it('keeps non-canvas private pages on shared page rhythm primitives', () => {
    const containerPages = [
      'pages/dashboard/MyNotes.tsx',
      'pages/dashboard/SingleNote.tsx',
      'pages/dashboard/Insights.tsx',
      'pages/dashboard/LifeWiki.tsx',
      'pages/dashboard/ReleaseMode.tsx',
      'pages/dashboard/FutureLetters.tsx',
      'pages/dashboard/Account.tsx',
    ];

    for (const filePath of containerPages) {
      const source = read(filePath);
      expect(source, filePath).toContain('<PageContainer');
      expect(source, filePath).toContain('core-page-stack');
    }

    const release = read('pages/dashboard/ReleaseMode.tsx');
    expect(release).toContain("from '../../components/ui/PageContainer'");
    expect(release).toContain("from '../../components/ui/SectionHeader'");
    expect(release).toContain("from '../../components/ui/Surface'");
  });

  it('keeps home actions restrained and writing-first', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(home).toContain('Begin Writing');
    expect(home).toContain('Quick check-in');
    expect(home).toContain('Future letter');
    expect(home).toContain('Your Intentions');
    expect(home).not.toContain('whileHover={{ scale: 1.02 }}');
    expect(home).not.toContain('whileTap={{ scale: 0.98 }}');
  });

  it('keeps writing and review controls touch-safe and explicit', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(createNote).toContain('aria-label="Exit focus mode"');
    expect(createNote).toContain('aria-pressed={isFocusModeEnabled}');
    expect(createNote).toContain('aria-label={`Remove ${tag} tag`}');
    expect(createNote).toMatch(/aria-label=\{`Remove \$\{tag\} tag`\}[\s\S]*min-h-11[\s\S]*min-w-11/);
    expect(createNote).toMatch(/MOOD_OPTIONS\.map[\s\S]*min-h-11/);

    expect(singleNote).toMatch(/onClick=\{\(\) => setIsMoodOpen\(true\)\}[\s\S]*min-h-11/);
    expect(singleNote).toMatch(/onClick=\{\(\) => setIsTagsOpen\(true\)\}[\s\S]*min-h-11/);
    expect(singleNote).toMatch(/onClick=\{\(\) => setIsTasksOpen\(true\)\}[\s\S]*min-h-11/);
  });

  it('uses deliberate empty and loading states on support pages', () => {
    const futureLetters = read('pages/dashboard/FutureLetters.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(futureLetters).toContain("from '../../components/ui/EmptyState'");
    expect(futureLetters).toContain("from '../../components/ui/Skeleton'");
    expect(futureLetters).toContain('<EmptyState');
    expect(futureLetters).toContain('<Skeleton');

    expect(lifeWiki).toContain("from '../../components/ui/SectionHeader'");
    expect(lifeWiki).toContain('<SectionHeader');
  });

  it('keeps insight and account copy concrete without score-like or diagnostic language', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    const account = read('pages/dashboard/Account.tsx');

    expect(insights).not.toContain('emotional tone leans');
    expect(insights.toLowerCase()).not.toContain('score');
    expect(insights).toContain('most-used mood label');

    expect(account).toContain('This cannot be undone from inside Reflections.');
    expect(account).toContain('Export anything you want to keep before deleting.');
  });
});
```

- [ ] **Step 2: Run the new contract to verify it fails**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts
```

Expected: FAIL. The failures should point to `ReleaseMode`, `HomeAuthenticated`, `CreateNote`, `SingleNote`, `FutureLetters`, `LifeWiki`, `Insights`, and `Account`.

- [ ] **Step 3: Commit only the failing contract**

Run:

```powershell
git add pages/dashboard/privateFlagshipPolishContract.test.ts
git commit -m "test: capture private page polish contract"
```

Expected: commit succeeds and includes one new test file.

## Task 2: Restrain The Authenticated Home Actions

**Files:**

- Modify: `pages/dashboard/HomeAuthenticated.tsx`
- Test: `pages/dashboard/privateFlagshipPolishContract.test.ts`
- Test: `pages/dashboard/focusedProductSliceContract.test.ts`
- Test: `pages/dashboard/visualParityContract.test.ts`

- [ ] **Step 1: Remove custom scale overrides from the three main home action buttons**

In `pages/dashboard/HomeAuthenticated.tsx`, find the three buttons labelled `Begin Writing`, `Quick check-in`, and `Future letter`.

For `Begin Writing`, replace:

```tsx
<Button
  variant="primary"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="h-14 w-full px-8 rounded-xl text-base font-bold bg-green text-white hover:bg-green/90 transition-colors shadow-none sm:w-fit"
  onClick={() => handleCreateClick(dailyPrompt)}
  aria-label="Begin writing with today's prompt"
>
```

with:

```tsx
<Button
  variant="primary"
  className="h-14 w-full px-8 text-base shadow-none sm:w-fit"
  onClick={() => handleCreateClick(dailyPrompt)}
  aria-label="Begin writing with today's prompt"
>
```

For `Quick check-in`, replace:

```tsx
<Button
  variant="secondary"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="h-12 w-full rounded-xl px-6 text-base font-bold"
  onClick={() => setIsCheckInOpen(true)}
  aria-label="Save a quick mood check-in"
>
```

with:

```tsx
<Button
  variant="secondary"
  className="h-12 w-full px-6 text-base"
  onClick={() => setIsCheckInOpen(true)}
  aria-label="Save a quick mood check-in"
>
```

For `Future letter`, replace:

```tsx
<Button
  variant="outline"
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  className="h-12 w-full justify-center rounded-xl border-sky/25 bg-sky/5 px-6 text-sky hover:bg-sky/10"
  onClick={() => navigate(RoutePath.FUTURE_LETTERS)}
  aria-label="Write a future letter"
>
```

with:

```tsx
<Button
  variant="secondary"
  className="h-12 w-full justify-center px-6 text-sky hover:text-sky"
  onClick={() => navigate(RoutePath.FUTURE_LETTERS)}
  aria-label="Write a future letter"
>
```

- [ ] **Step 2: Add a visible focus ring to the prompt refresh icon control**

In `pages/dashboard/HomeAuthenticated.tsx`, replace this refresh button class fragment:

```tsx
className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:text-green ${
  isRefreshing ? 'animate-spin' : ''
}`}
```

with:

```tsx
className={`flex h-11 w-11 items-center justify-center rounded-[var(--radius-control)] text-gray-nav transition-colors hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${
  isRefreshing ? 'animate-spin' : ''
}`}
```

- [ ] **Step 3: Run the home-focused contracts**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts pages/dashboard/focusedProductSliceContract.test.ts pages/dashboard/visualParityContract.test.ts
```

Expected: the home-related assertions pass. Other private polish assertions may still fail until later tasks.

- [ ] **Step 4: Commit the home polish**

Run:

```powershell
git add pages/dashboard/HomeAuthenticated.tsx
git commit -m "polish: restrain authenticated home actions"
```

Expected: commit succeeds and touches only `pages/dashboard/HomeAuthenticated.tsx`.

## Task 3: Move Release Mode Onto Shared Layout Primitives

**Files:**

- Modify: `pages/dashboard/ReleaseMode.tsx`
- Test: `pages/dashboard/privateFlagshipPolishContract.test.ts`
- Test: `components/ui/designSystemPhase23.test.ts`

- [ ] **Step 1: Add shared primitive imports**

At the top of `pages/dashboard/ReleaseMode.tsx`, add these imports beside the existing `Button` import:

```tsx
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
```

- [ ] **Step 2: Replace the root wrappers with `PageContainer` and `core-page-stack`**

Replace:

```tsx
<div className="surface-scope-clay page-wash flex min-h-[100dvh] flex-1 flex-col bg-body">
  <div className="mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col px-5 py-5 sm:px-8 sm:py-8">
```

with:

```tsx
<PageContainer size="narrow" className="surface-scope-clay page-wash flex min-h-[100dvh] flex-col pb-10 pt-5 sm:pt-8">
  <div className="core-page-stack flex min-h-[calc(100dvh-4rem)] flex-col">
```

At the bottom of the component, replace the matching close:

```tsx
  </div>
</div>
```

with:

```tsx
  </div>
</PageContainer>
```

- [ ] **Step 3: Replace the manual hero copy with `SectionHeader`**

Replace the `div` that contains the icon, `h1`, and description:

```tsx
<div className="space-y-3 text-center">
  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-green/15 bg-green/10 text-green">
    <Feather size={24} weight="duotone" />
  </div>
  <h1 className="h1-hero !leading-none">
    Write it here. Let it leave.
  </h1>
  <p className="mx-auto max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
    Release mode does not create a note. When you release, the written text disappears and only a content-free marker remains.
  </p>
</div>
```

with:

```tsx
<SectionHeader
  align="center"
  title="Write it here. Let it leave."
  description="Release mode does not create a note. When you release, the written text disappears and only a content-free marker remains."
  icon={
    <div className="icon-block icon-block-sm">
      <Feather size={24} weight="duotone" />
    </div>
  }
/>
```

- [ ] **Step 4: Route the writing panel through `Surface`**

Replace:

```tsx
<div className="surface-flat p-4 sm:p-6">
```

with:

```tsx
<Surface variant="flat" tone="clay" className="p-4 sm:p-6">
```

Replace the matching closing `</div>` after the `textarea` with:

```tsx
</Surface>
```

- [ ] **Step 5: Run the release/design-system contracts**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts components/ui/designSystemPhase23.test.ts
```

Expected: release layout assertions pass. The full private contract may still fail for other pages.

- [ ] **Step 6: Commit the release polish**

Run:

```powershell
git add pages/dashboard/ReleaseMode.tsx
git commit -m "polish: align release mode with private layout primitives"
```

Expected: commit succeeds and touches only `pages/dashboard/ReleaseMode.tsx`.

## Task 4: Give Future Letters Real Loading And Empty States

**Files:**

- Modify: `pages/dashboard/FutureLetters.tsx`
- Test: `pages/dashboard/privateFlagshipPolishContract.test.ts`
- Test: `components/ui/designSystemPhase23.test.ts`

- [ ] **Step 1: Add `EmptyState` and `Skeleton` imports**

In `pages/dashboard/FutureLetters.tsx`, add:

```tsx
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
```

- [ ] **Step 2: Replace the plain loading paragraph**

Replace:

```tsx
{isLoading ? (
  <p className="dashboard-supporting-text">Loading letters...</p>
) : letters.length === 0 ? (
```

with:

```tsx
{isLoading ? (
  <div className="space-y-3" aria-label="Loading letters">
    <Skeleton variant="text" className="h-5 w-3/4" />
    <Skeleton variant="card" className="h-28" />
    <Skeleton variant="card" className="h-28" />
  </div>
) : letters.length === 0 ? (
```

- [ ] **Step 3: Replace the plain empty paragraph**

Replace:

```tsx
<p className="dashboard-supporting-text">
  No letters yet. Write one when there is something you want to return to later.
</p>
```

with:

```tsx
<EmptyState
  surface="none"
  icon={<PaperPlaneTilt size={22} weight="duotone" />}
  title="No letters waiting yet"
  description="Write one when there is something you want to return to later."
/>
```

- [ ] **Step 4: Run the future-letter contract**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts components/ui/designSystemPhase23.test.ts
```

Expected: `FutureLetters` empty/loading assertions pass.

- [ ] **Step 5: Commit the future-letter polish**

Run:

```powershell
git add pages/dashboard/FutureLetters.tsx
git commit -m "polish: clarify future letter states"
```

Expected: commit succeeds and touches only `pages/dashboard/FutureLetters.tsx`.

## Task 5: Align Life Wiki Header And Stats With Shared Primitives

**Files:**

- Modify: `pages/dashboard/LifeWiki.tsx`
- Test: `pages/dashboard/privateFlagshipPolishContract.test.ts`
- Test: `components/ui/designSystemPhase23.test.ts`
- Test: `pages/dashboard/sanctuaryContract.test.ts`

- [ ] **Step 1: Add `SectionHeader` import**

In `pages/dashboard/LifeWiki.tsx`, add:

```tsx
import { SectionHeader } from '../../components/ui/SectionHeader';
```

- [ ] **Step 2: Replace the manual main header**

Replace:

```tsx
<header className="mx-auto max-w-4xl space-y-5 pb-3 text-center">
  <h1 className="text-4xl font-display font-extrabold text-gray-text sm:text-5xl md:text-6xl">
    Your Life Wiki
  </h1>
  <p className="mx-auto max-w-[65ch] text-lg font-medium leading-relaxed text-gray-light">
    A dedicated Sanctuary library of AI-generated wiki pages, refreshed only when you ask.
  </p>
</header>
```

with:

```tsx
<SectionHeader
  align="center"
  title="Your Life Wiki"
  description="A dedicated Sanctuary library of AI-generated wiki pages, refreshed only when you ask."
/>
```

- [ ] **Step 3: Wrap the stats strip in a sage surface**

Replace:

```tsx
<section className="border-y border-border/60 py-5">
  <div className="grid gap-0 divide-y divide-border/60 md:grid-cols-4 md:divide-x md:divide-y-0">
```

with:

```tsx
<Surface variant="flat" tone="sage" className="p-5 md:p-6">
  <div className="grid gap-0 divide-y divide-border/60 md:grid-cols-4 md:divide-x md:divide-y-0">
```

Replace the matching `</section>` after the stats grid with:

```tsx
</Surface>
```

- [ ] **Step 4: Run Life Wiki contracts**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts components/ui/designSystemPhase23.test.ts pages/dashboard/sanctuaryContract.test.ts
```

Expected: Life Wiki assertions pass and sanctuary contracts remain green.

- [ ] **Step 5: Commit the Life Wiki polish**

Run:

```powershell
git add pages/dashboard/LifeWiki.tsx
git commit -m "polish: align life wiki header and stats"
```

Expected: commit succeeds and touches only `pages/dashboard/LifeWiki.tsx`.

## Task 6: Tighten Writing And Note Review Controls

**Files:**

- Modify: `pages/dashboard/CreateNote.tsx`
- Modify: `pages/dashboard/SingleNote.tsx`
- Test: `pages/dashboard/privateFlagshipPolishContract.test.ts`
- Test: `pages/dashboard/createNoteFocusModeContract.test.ts`
- Test: `pages/dashboard/visualParityContract.test.ts`
- Test: `pages/dashboard/taskAccessibilityContract.test.ts`

- [ ] **Step 1: Label the focus-mode exit control**

In `pages/dashboard/CreateNote.tsx`, replace:

```tsx
className="surface-floating fixed right-4 z-[85] inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 label-caps text-green hover:text-green"
style={{ top: NATIVE_TOP_CONTROL_OFFSET }}
>
```

with:

```tsx
className="surface-floating fixed right-4 z-[85] inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 label-caps text-green hover:text-green"
style={{ top: NATIVE_TOP_CONTROL_OFFSET }}
aria-label="Exit focus mode"
>
```

- [ ] **Step 2: Add pressed state to the focus-mode toggle**

In `pages/dashboard/CreateNote.tsx`, find the focus-mode toggle button with `Focus mode` text. Add:

```tsx
aria-pressed={isFocusModeEnabled}
```

The opening button should include:

```tsx
<button
  type="button"
  onClick={() => {
    setIsFocusModeEnabled((current) => {
      const next = !current;
      if (!next) {
        setIsFlowing(false);
      } else {
        setIsFlowing(true);
        lastFocusToggleRef.current = Date.now();
      }
      return next;
    });
  }}
  aria-pressed={isFocusModeEnabled}
  className={`inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 label-caps transition-colors sm:min-h-0 sm:px-3 sm:py-1 ${
    isFocusModeEnabled
      ? 'bg-green text-white'
      : 'control-surface text-gray-text hover:bg-green/10 hover:text-green'
  }`}
>
```

- [ ] **Step 3: Make tag removal controls easier to operate**

In `pages/dashboard/CreateNote.tsx`, replace the tag remove button class:

```tsx
className="text-green/70 hover:text-clay"
```

with:

```tsx
className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)] text-green/70 transition-colors hover:bg-clay/5 hover:text-clay focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
```

- [ ] **Step 4: Make mood choices touch-safe**

In `pages/dashboard/CreateNote.tsx`, replace the mood option button class prefix:

```tsx
className={`flex flex-col items-center rounded-2xl border-2 p-4 transition-colors ${mood === entry ? moodConfig.modal : `${moodConfig.option} dark:bg-white/5`}`}
```

with:

```tsx
className={`flex min-h-11 flex-col items-center justify-center rounded-2xl border-2 p-4 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green ${mood === entry ? moodConfig.modal : `${moodConfig.option} dark:bg-white/5`}`}
```

- [ ] **Step 5: Make SingleNote metadata edit controls touch-safe**

In `pages/dashboard/SingleNote.tsx`, update the mood, tag, and task metadata button classes.

For the mood button, change:

```tsx
className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 label-caps transition-colors ${
```

to:

```tsx
className={`group flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 label-caps transition-colors ${
```

For the tags button, change:

```tsx
className="control-surface group flex items-center gap-1.5 rounded-full px-2.5 py-1 label-caps text-gray-nav transition-colors hover:border-green/30 hover:bg-green/5 hover:text-green"
```

to:

```tsx
className="control-surface group flex min-h-11 items-center gap-1.5 rounded-full px-3 py-2 label-caps text-gray-nav transition-colors hover:border-green/30 hover:bg-green/5 hover:text-green"
```

For the tasks button, change:

```tsx
className={`group flex items-center gap-1.5 rounded-full border px-2.5 py-1 label-caps transition-colors ${
```

to:

```tsx
className={`group flex min-h-11 items-center gap-1.5 rounded-full border px-3 py-2 label-caps transition-colors ${
```

- [ ] **Step 6: Run writing/review contracts**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts pages/dashboard/createNoteFocusModeContract.test.ts pages/dashboard/visualParityContract.test.ts pages/dashboard/taskAccessibilityContract.test.ts
```

Expected: writing and note-review assertions pass.

- [ ] **Step 7: Commit writing/review control polish**

Run:

```powershell
git add pages/dashboard/CreateNote.tsx pages/dashboard/SingleNote.tsx
git commit -m "polish: tighten writing and review controls"
```

Expected: commit succeeds and touches only `CreateNote.tsx` and `SingleNote.tsx`.

## Task 7: Make Insight And Account Copy More Concrete

**Files:**

- Modify: `pages/dashboard/Insights.tsx`
- Modify: `pages/dashboard/Account.tsx`
- Test: `pages/dashboard/privateFlagshipPolishContract.test.ts`
- Test: `pages/dashboard/focusedProductSliceContract.test.ts`
- Test: `pages/dashboard/remainingSurfacesContract.test.ts`

- [ ] **Step 1: Replace diagnostic-leaning insight copy**

In `pages/dashboard/Insights.tsx`, replace:

```tsx
This month, you checked in on {stats.daysCheckedIn} different days, and the current emotional tone leans{' '}
<span className="font-bold not-italic text-green">
  {getMoodConfig(stats.topMood)?.label || stats.topMood || 'toward clarity'}
</span>
.
```

with:

```tsx
This month, you checked in on {stats.daysCheckedIn} different days. The most-used mood label is{' '}
<span className="font-bold not-italic text-green">
  {getMoodConfig(stats.topMood)?.label || stats.topMood || 'not settled yet'}
</span>
; treat it as a note, not a verdict.
```

- [ ] **Step 2: Make destructive account copy concrete**

In `pages/dashboard/Account.tsx`, replace:

```tsx
Saved writing and app data will be removed.
```

with:

```tsx
Saved writing and app data will be removed. This cannot be undone from inside Reflections. Export anything you want to keep before deleting.
```

- [ ] **Step 3: Run copy contracts**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts pages/dashboard/focusedProductSliceContract.test.ts pages/dashboard/remainingSurfacesContract.test.ts
```

Expected: private copy assertions pass. Existing "quietly" and account accessibility contracts remain green.

- [ ] **Step 4: Commit copy polish**

Run:

```powershell
git add pages/dashboard/Insights.tsx pages/dashboard/Account.tsx
git commit -m "polish: clarify insights and account copy"
```

Expected: commit succeeds and touches only `Insights.tsx` and `Account.tsx`.

## Task 8: Run The Private Dashboard Contract Suite

**Files:**

- No planned file edits. Edit only if a test exposes a regression caused by Tasks 1 through 7.

- [ ] **Step 1: Run the focused private-dashboard contracts**

Run:

```powershell
.\node_modules\.bin\vitest.cmd run pages/dashboard/privateFlagshipPolishContract.test.ts pages/dashboard/focusedProductSliceContract.test.ts pages/dashboard/remainingSurfacesContract.test.ts pages/dashboard/visualParityContract.test.ts pages/dashboard/createNoteFocusModeContract.test.ts pages/dashboard/taskAccessibilityContract.test.ts pages/dashboard/sanctuaryContract.test.ts components/ui/designSystemPhase23.test.ts components/ui/designSystemPhase4.test.ts
```

Expected: PASS.

- [ ] **Step 2: Fix only regressions introduced by this plan**

If a failure names a changed file from this plan, patch that file only. Use the smallest replacement that satisfies the failing assertion and preserves the approved spec.

Example repair pattern for a missing import:

```tsx
import { SectionHeader } from '../../components/ui/SectionHeader';
```

Example repair pattern for a missing touch target:

```tsx
className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-[var(--radius-control)]"
```

- [ ] **Step 3: Re-run the focused contracts**

Run the same command from Step 1.

Expected: PASS.

- [ ] **Step 4: Commit contract fixes if any were needed**

If Step 2 changed files, run:

```powershell
git add pages/dashboard components/ui index.css
git commit -m "fix: satisfy private polish contracts"
```

Expected: commit succeeds. If Step 2 made no changes, skip this commit.

## Task 9: Build And Browser-Check Private Pages

**Files:**

- No planned file edits. Edit only if build or browser checks expose a regression caused by Tasks 1 through 7.

- [ ] **Step 1: Run the production build**

Run:

```powershell
.\node_modules\.bin\vite.cmd build
```

Expected: PASS. The build may print chunk-size warnings that already existed; do not treat warnings as failures unless they name a changed file or a new error.

- [ ] **Step 2: Start the local Vite server**

Run:

```powershell
$out='E:\Reflections\.codex-vite.out.log'; $err='E:\Reflections\.codex-vite.err.log'; $p = Start-Process -FilePath '.\node_modules\.bin\vite.cmd' -ArgumentList @('--host','127.0.0.1','--port','5173','--strictPort') -WorkingDirectory 'E:\Reflections' -WindowStyle Hidden -RedirectStandardOutput $out -RedirectStandardError $err -PassThru; Start-Sleep -Seconds 4; "PID=$($p.Id)"; if (Test-Path $out) { Get-Content -Path $out }; if (Test-Path $err) { Get-Content -Path $err }; Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object LocalAddress,LocalPort,State,OwningProcess
```

Expected: server listens on `127.0.0.1:5173`. If port 5173 is already busy, use a different port and keep the browser-check URLs consistent.

- [ ] **Step 3: Browser-check mobile overflow and console errors**

Run this Playwright script with the bundled Node runtime available in the workspace:

```powershell
$env:NODE_PATH='C:\Users\Arabinda\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'; & 'C:\Users\Arabinda\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' -e "const { chromium } = require('playwright'); (async () => { const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }); const routes = ['/home','/notes','/notes/new','/insights','/wiki','/release','/letters','/account']; const results = []; for (const route of routes) { const page = await browser.newPage({ viewport: { width: 390, height: 820 }, deviceScaleFactor: 1, isMobile: true }); const errors = []; page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); }); await page.goto('http://127.0.0.1:5173' + route, { waitUntil: 'networkidle' }); const result = await page.evaluate(() => ({ overflowX: document.documentElement.scrollWidth > window.innerWidth, width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth, title: document.title, body: document.body.innerText.slice(0, 120) })); results.push({ route, ...result, errors }); await page.close(); } await browser.close(); console.log(JSON.stringify(results, null, 2)); })().catch((error) => { console.error(error); process.exit(1); });"
```

Expected: each result has `"overflowX": false` and no console errors caused by changed files. Auth redirects are acceptable if the local session is signed out; still inspect `/notes/new`, `/release`, and shared layout routes for overflow when reachable.

- [ ] **Step 4: Capture one desktop and one mobile screenshot if a visual issue is suspected**

Only run this step if Step 3 reports overflow, empty rendering, or console errors.

Mobile screenshot command:

```powershell
$env:NODE_PATH='C:\Users\Arabinda\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'; & 'C:\Users\Arabinda\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' -e "const { chromium } = require('playwright'); (async () => { const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }); const page = await browser.newPage({ viewport: { width: 390, height: 820 }, deviceScaleFactor: 1, isMobile: true }); await page.goto('http://127.0.0.1:5173/home', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'C:/tmp/reflections-private-home-mobile.png', fullPage: false }); await browser.close(); console.log('C:/tmp/reflections-private-home-mobile.png'); })().catch((error) => { console.error(error); process.exit(1); });"
```

Desktop screenshot command:

```powershell
$env:NODE_PATH='C:\Users\Arabinda\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\node_modules'; & 'C:\Users\Arabinda\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' -e "const { chromium } = require('playwright'); (async () => { const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' }); const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 }); await page.goto('http://127.0.0.1:5173/home', { waitUntil: 'networkidle' }); await page.screenshot({ path: 'C:/tmp/reflections-private-home-desktop.png', fullPage: false }); await browser.close(); console.log('C:/tmp/reflections-private-home-desktop.png'); })().catch((error) => { console.error(error); process.exit(1); });"
```

- [ ] **Step 5: Commit browser/build fixes if any were needed**

If Steps 1 through 4 required fixes, run:

```powershell
git add pages/dashboard components/ui index.css
git commit -m "fix: resolve private polish verification issues"
```

Expected: commit succeeds. If no fixes were needed, skip this commit.

## Task 10: Final Review And Handoff

**Files:**

- No planned file edits.

- [ ] **Step 1: Review final diff scope**

Run:

```powershell
git status --short
git log --oneline -6
```

Expected: worktree is clean except for changes the user intentionally left uncommitted outside this plan. Recent commits should correspond to the plan tasks.

- [ ] **Step 2: Summarize verification**

Record these in the final handoff:

```text
Vitest focused private contracts: PASS
Vite build: PASS
Mobile overflow check: PASS
Console error check: PASS
```

If any item did not pass, write the exact command and failure reason instead of claiming success.

- [ ] **Step 3: Stop**

Do not broaden into public pages, auth pages, backend behavior, or subscription behavior. If a desired polish issue remains outside this plan, note it as follow-up instead of editing it.

## Self-Review Checklist

- Spec coverage: each included private page has a task or is covered by shared contract verification.
- Scope: public pages, auth pages, backend services, and Supabase files are excluded.
- Red-flag scan: no banned planning terms or open implementation slots remain.
- Type consistency: all imports use the existing local primitive paths and existing component names.
- Karpathy constraint: every planned edit is small, testable, and traceable to the approved private-page polish spec.
