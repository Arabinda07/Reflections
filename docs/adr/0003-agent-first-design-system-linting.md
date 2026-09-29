# ADR 0003: Agent-First Design System Linting & Tailwind CSS v4 Migration

**Status:** Accepted  
**Date:** 2026-09-29  

---

## Context

As Reflections expands its feature set (e.g. Relationship OS modules, Future Letters, Life Wiki, and ambient wellness audio), AI coding agents work autonomously to scaffold, extend, and refactor UI components.

Without automated mechanical enforcement of the design system:
1. **Design Drift**: Agents frequently invent ad-hoc utility classes (`px-5`, `bg-zinc-800`, `text-[13px]`, `rounded-[14px]`) instead of utilizing the curated design tokens and component props defined in `docs/brand/DESIGN.md` and `tailwind.config.js`.
2. **Brittle Verification**: The repository previously relied on string-matching Vitest tests (e.g., `components/ui/designSystemPhase23.test.ts`, `polishContract.test.ts`, `typeScaleContract.test.ts`) that use `readFileSync` to check whether certain strings or fonts exist in files. These tests do not run inside the IDE or AST parser and provide slow, post-facto failure messages.
3. **Theme & OKLCH Corruption**: Raw color classes break Reflections' dynamic OKLCH color engine (`surface-scope-paper`, `surface-scope-dawn`, sanctuary modes, and dark mode).

---

## Decision

We adopt [`@shadcn/lint`](https://github.com/shadcn-ui/lint) powered by **ESLint 9 Flat Config** (`eslint.config.mjs`) and migrate to **Tailwind CSS v4** with CSS `@theme` tokens in `index.css`.

### 1. Agent-First Error Messages & Self-Correction
`@shadcn/lint` treats design system violations as self-correcting instructions for AI agents and human contributors:
- Instead of generic errors, it indicates precisely why a pattern is disallowed and recommends the valid token or component variant.
- Component contracts restrict `className` overrides on primitives: layout utilities (margins, flex/grid positions) are permitted on wrappers, while internal padding, background colors, and font scales must be handled via component variants (`size`, `variant`, `tone`).

### 2. Tailwind CSS v4 Migration
- Replace `tailwind.config.js` with CSS-first `@theme` declarations directly in `index.css`.
- Integrate `@tailwindcss/vite` in `vite.config.ts`.
- Retain exact OKLCH brand scales, semantic surfaces (`--color-surface-muted`, `--color-text-primary`), and typography (`Manrope`, `Spectral`).

### 3. Phased Enforcement Boundary
- **Strict (`error`)**: Component primitives (`components/ui/*`) and authenticated dashboard pages (`pages/dashboard/*`). Any primitive restyling, arbitrary values, or raw palette colors immediately halt lint and build.
- **Transitional (`warn`)**: Legacy marketing and public landing pages while existing markup is baselined and systematically unified.

---

## Consequences

### Positive
- **Instant Agent Feedback**: Agents receive AST-level errors with suggested replacements before tests or builds run.
- **Single Source of Truth**: Design system tokens live in standard CSS variables (`@theme` in `index.css`).
- **Elimination of Flaky Regex Tests**: Replaces brittle string-scanning tests with standard ESLint diagnostics.
- **Fast Build**: Tailwind v4 via `@tailwindcss/vite` compiles faster and eliminates redundant PostCSS plugins.

### Trade-offs & Mitigations
- **Learning Curve**: Agents and contributors must inspect `npm run lint` suggestions rather than applying ad-hoc Tailwind classes.
- **Legacy Migration**: Pre-existing raw utility classes must be incrementally replaced with semantic tokens.
