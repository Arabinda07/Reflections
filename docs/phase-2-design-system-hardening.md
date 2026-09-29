# Phase 2 Design System Hardening & Architectural Traps Resolution

**Status:** Proposed / In-Progress  
**Related ADR:** [ADR 0003: Agent-First Design System Linting & Tailwind CSS v4 Migration](file:///e:/Reflections/docs/adr/0003-agent-first-design-system-linting.md)  
**Date:** 2026-09-29  

---

## 1. Executive Summary

Following the initial Tailwind CSS v4 and `@shadcn/lint` AST migration in Commit `0d93759`, Reflections achieved zero raw-color violations across 353 files. However, an architectural review uncovered **4 critical traps** in static analysis, continuous integration, and token ergonomics, along with subtle dark-mode visual regressions (such as input label contrast collapse).

This document serves as the operational engineering blueprint for **resolving the 4 traps** and executing the **Phase 2 rollout** across the remaining dashboard screens (`Relationships.tsx`, `ReleaseMode.tsx`, `Account.tsx`, `LifeWiki.tsx`, `FutureLetters.tsx`).

---

## 2. The 4 Architectural Traps & Concrete Remedies

### Trap 1: The Phantom Gate Paradox (Broken CI & Missing Lint Step)

#### The Problem:
- In `.github/workflows/ci.yml`, the workflow runs `npx tsc --noEmit`, `npm test`, and `npm run build`.
- **`npm run lint` (or `eslint .`) is completely omitted from CI.** The `@shadcn/lint` AST rules are never enforced on pull requests or commits to `main`.
- **`package.json` has no `"test"` script.** Calling `npm test` causes GitHub Actions to crash with code 1 (`npm error Missing script: "test"`).
- Result: The design system guardrails currently operate as local opt-in checks rather than automated enforcement gates.

#### The Remedy:
1. Update `package.json` to define the test script:
   ```json
   "scripts": {
     "test": "vitest run",
     "lint": "eslint . && tsc --noEmit"
   }
   ```
2. Update `.github/workflows/ci.yml` to run the linter and add security/concurrency controls:
   ```yaml
   name: CI
   on:
     push:
       branches: [main, master]
     pull_request:
       branches: [main, master]

   concurrency:
     group: ${{ github.workflow }}-${{ github.ref }}
     cancel-in-progress: true

   jobs:
     validate:
       runs-on: ubuntu-latest
       permissions:
         contents: read
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: 20
             cache: 'npm'
         - run: npm ci
         - name: Static Analysis & Typecheck
           run: npm run lint
         - name: Vitest Contract Suite
           run: npm test
         - name: Production Build
           run: npm run build
   ```

---

### Trap 2: The Inner `<span>` Evasion Anti-Pattern (Primitive Restyle Bypasses)

#### The Problem:
- In `eslint.config.mjs`, `<Button>` enforces `deny: ['color']` to keep button primitives variant-governed.
- In `pages/dashboard/Insights.tsx` and `pages/dashboard/MyNotes.tsx`, developers worked around the linter by nesting a styled `<span>`:
  ```tsx
  // Anti-pattern: Bypasses AST check, breaks hover/disabled state coordination
  <Button variant="ghost" onClick={handleAction}>
    <span className="text-green">Write something</span>
  </Button>
  ```
- Autonomous coding agents learn this pattern and replicate it across components, eroding component encapsulation.

#### The Remedy:
1. Expand the `ButtonProps` interface in `components/ui/Button.tsx` to support a semantic `tone` prop:
   ```tsx
   interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
     variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'bezel';
     tone?: 'default' | 'green' | 'clay' | 'gray';
     size?: 'sm' | 'md' | 'lg';
     isLoading?: boolean;
   }
   ```
2. Refactor existing bypasses in `Insights.tsx` and `MyNotes.tsx`:
   ```tsx
   // Clean, variant-driven button
   <Button variant="ghost" tone="green" onClick={handleAction}>
     Write something
   </Button>
   ```

---

### Trap 3: Token Clashing & Dual Configuration Drift

#### The Problem:
- `index.css` retains `@config "./tailwind.config.js";` at line 34, while simultaneously declaring tokens inside `@theme` (lines 36–128).
- Retaining both means tokens exist in two separate locations. If one is updated without the other, Tailwind v4's internal cascade produces unexpected utility output and confuses coding agents.

#### The Remedy:
1. Migrate any remaining plugins or utility mappings from `tailwind.config.js` into CSS-native `@utility` directives in `index.css`.
2. Remove `@config "./tailwind.config.js";` from `index.css`.
3. Deprecate and archive `tailwind.config.js`.

---

### Trap 4: Arbitrary Whitelist Rot (Unjustified Value Leakage)

#### The Problem:
- `eslint.config.mjs` whitelists 48 arbitrary value strings in `allowedArbitraryValues`.
- 34 of these (71%) are **redundant escapes** that duplicate standard Tailwind scales, existing `@theme` tokens, or native CSS features:
  - `min-h-[100dvh]` $\rightarrow$ Native Tailwind v4 supports `min-h-dvh`.
  - `h-[24px]` $\rightarrow$ Standard scale `h-6`.
  - `w-[1px]` $\rightarrow$ Standard utility `w-px`.
  - `active:scale-[0.98]` $\rightarrow$ `--scale-98: 0.98;` is already declared in `@theme`!
  - `rounded-[var(--radius-control)]` $\rightarrow$ `--radius-control` generates `rounded-control`.
  - `rounded-[2rem]` $\rightarrow$ Standard scale `rounded-4xl`.
  - 13 distinct permutations of `transition-[...]`.

#### The Remedy:
Purge the whitelist down to **only legitimate hardware offsets, viewport aspect clamps, and dynamic OKLCH math**:
```javascript
// Curated allowedArbitraryValues:
const allowedArbitraryValues = [
  // Hardware Safe Area Geometries
  'pb-[calc(env(safe-area-inset-bottom)+1.75rem)]',
  'pt-[calc(env(safe-area-inset-top)+var(--header-height)+1.5rem)]',
  'sm:pt-[calc(env(safe-area-inset-top)+var(--header-height)+2rem)]',
  'pt-[env(safe-area-inset-top)]',
  'pb-[env(safe-area-inset-bottom)]',
  'bottom-[calc(2rem+env(safe-area-inset-bottom))]',
  'top-[var(--native-top-control-offset)]',
  'pt-[var(--native-page-top-padding)]',

  // Dynamic Viewport / Aspect Clamps
  'h-[min(66vmin,34rem)]',
  'w-[min(66vmin,34rem)]',
  'lg:pt-[28vh]',
  'aspect-[21/9]',

  // Dynamic OKLCH Relative Color Math & Shadows
  '[background-color:oklch(from_var(--bg-color)_l_c_h_/_0.95)]',
  'shadow-[0_8px_20px_-12px_var(--green-shadow)]',
  'hover:shadow-[0_10px_24px_-12px_var(--green-shadow)]',
  'sm:shadow-[0_10px_24px_-12px_var(--green-shadow)]',
  'sm:hover:shadow-[0_12px_28px_-12px_var(--green-shadow)]',
];
```

---

## 3. Phase 2 Implementation Roadmap

```
┌────────────────────────────────────────────────────────────────────────┐
│                      PHASE 2 EXECUTION PHASES                          │
├─────────┬──────────────────────────────────────────────────────────────┤
│ Phase 0 │ CI Workflow & package.json Repair (P0 - Immediate)           │
│ Phase 1 │ Native PageContainer Scoping & Button Tone Variants          │
│ Phase 2 │ Arbitrary Whitelist Purge & Tailwind v4 Config Consolidation │
│ Phase 3 │ Module Refactor: Relationships, ReleaseMode, Account         │
│ Phase 4 │ Strict Error Boundary Promotion in eslint.config.mjs         │
└─────────┴──────────────────────────────────────────────────────────────┘
```

### Phase 0: CI Workflow & `package.json` Repair
- Add `"test": "vitest run"` in `package.json`.
- Add `npm run lint` step into `.github/workflows/ci.yml`.
- Verify remote CI passes on branch push.

### Phase 1: Native `<PageContainer>` Scoping & Button Variants
- Update `components/ui/PageContainer.tsx` to accept `scope?: 'sage' | 'paper' | 'sky' | 'honey' | 'clay' | 'mixed'`.
- Apply `surface-scope-${scope} page-wash min-h-dvh` directly within `PageContainer`.
- Remove redundant wrapper `<div className="surface-scope-sage page-wash min-h-dvh">` in `SingleNote.tsx`, `Insights.tsx`, and `MyNotes.tsx`.
- Add `tone` prop to `components/ui/Button.tsx`.

### Phase 2: Arbitrary Whitelist Purge & Config Consolidation
- Replace `min-h-[100dvh]` with `min-h-dvh` across `Landing.tsx`, `AuthAppShell.tsx`, `LandingRoute.tsx`.
- Replace `active:scale-[0.98]` with `active:scale-98`.
- Replace `rounded-[var(--radius-control)]` with `rounded-control`.
- Remove `@config "./tailwind.config.js";` from `index.css`.

### Phase 3: Module Refactor (Top Remaining Screens)
Refactor the following screens to semantic tokens:
1. `pages/dashboard/Relationships.tsx`:
   - Replace `lg:grid-cols-[1fr_20rem]` with `lg:grid-cols-3` or `@theme` grid token.
   - Replace `pb-[calc(var(--mobile-bottom-nav-reserved-space)+1rem)]` with semantic spacing.
   - Use `<PageContainer scope="sage">`.
   - Remove custom button colors on lines 217 & 265 in favor of `tone="green"`.
2. `pages/dashboard/ReleaseMode.tsx`:
   - Replace `hover:bg-[var(--surface-current-soft-bg)]` and `hover:text-[var(--surface-current-accent)]` with semantic tokens (`hover:bg-accent-soft hover:text-accent`).
   - Use `<PageContainer scope="sage">`.
3. `pages/dashboard/Account.tsx`:
   - Replace any remaining off-token button or container classes.
   - Use `<PageContainer scope="paper">`.

### Phase 4: Strict Error Boundary Promotion
Promote all dashboard routes into the zero-tolerance `error` block in `eslint.config.mjs`:
```javascript
files: [
  'components/ui/Input.tsx',
  'components/ui/Button.tsx',
  'components/ui/PageContainer.tsx',
  'pages/dashboard/Landing.tsx',
  'pages/dashboard/SingleNote.tsx',
  'pages/dashboard/Insights.tsx',
  'pages/dashboard/MyNotes.tsx',
  'pages/dashboard/CreateNote.tsx',
  'pages/dashboard/Relationships.tsx',
  'pages/dashboard/RelationshipProfile.tsx',
  'pages/dashboard/ReleaseMode.tsx',
  'pages/dashboard/Account.tsx',
  'pages/dashboard/LifeWiki.tsx',
  'pages/dashboard/FutureLetters.tsx',
],
```
Run `npm run lint` and verify `0` errors and clean builds.
