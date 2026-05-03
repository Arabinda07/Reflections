# Private Pages Flagship Polish Design

Date: 2026-05-03

## Scope

Polish the authenticated Reflections app as a cohesive private writing workspace.

Included pages:

- Authenticated shell and navigation
- `HomeAuthenticated`
- `MyNotes`
- `CreateNote` and edit mode
- `SingleNote`
- `Insights`
- `LifeWiki`
- `ReleaseMode`
- `FutureLetters`
- `Account`

Excluded pages:

- Public landing page
- Public FAQ, About, and Privacy pages
- Auth pages unless a private-shell regression requires a small shared fix

## Product Intent

Reflections should feel like a calm, private journal with careful editorial structure. The private app must support writing first, then help users return to notes, review patterns, manage trust settings, and use AI only through explicit actions.

This pass must not turn the product into a habit game, analytics dashboard, therapy replacement, or AI chatbot. The interface should remain quiet, concrete, and user-owned.

## Chosen Approach

Use a systems-first flagship polish pass.

First standardize shared drift in the private app: shell layout, page rhythm, surface tones, shared controls, action hierarchy, empty/loading states, interaction states, focus states, and mobile behavior.

Then tune each private page against that shared vocabulary so screens feel related without becoming visually identical.

## Assumptions

- Existing workflows remain intact.
- No new product features are introduced.
- No public-page redesign is included.
- Existing data fetching, save behavior, auth behavior, subscriptions, and AI service behavior remain unchanged unless a UI defect requires a small integration fix.
- Every changed line should trace to private-app polish.

## Design System Alignment

The pass should align with the existing Reflections design system:

- Use `PageContainer` for private page width and rhythm.
- Use `Surface` for tonal panels instead of one-off card shells.
- Use `SectionHeader` for page-level and major section headings.
- Use `Button` for command actions.
- Use `EmptyState` for no-content states.
- Use `Skeleton` and existing page skeleton compositions for loading states.
- Preserve inherited surface scopes: `paper`, `sage`, `sky`, `honey`, and `clay`.
- Use Phosphor icons with established weights.
- Keep motion on the existing expo easing and respect reduced motion.

Drift categories to fix:

- Missing token: a repeated spacing, tone, or state should become or use an existing token/class.
- One-off implementation: a local panel or control should use the matching shared primitive.
- Conceptual misalignment: a page section should change hierarchy or flow only when it conflicts with neighboring private surfaces.

## Experience Architecture

The private app should read as one calm workspace with these page roles:

- `HomeAuthenticated`: arrival, orientation, and first writing action.
- `MyNotes`: return to saved reflections through search, filters, list, and calendar states.
- `CreateNote`: protected writing surface with optional metadata, tasks, tags, cover, and AI reflection support.
- `SingleNote`: quiet reading, revising, and extracting meaning from an existing note.
- `Insights`: patient pattern review without scoring or diagnostic framing.
- `LifeWiki`: accumulated themes and self-knowledge with measured structure.
- `ReleaseMode`: contained emotional release with careful feedback.
- `FutureLetters`: delayed reflection, scheduling, locked letters, and opened letters.
- `Account`: concrete trust surface for profile, plan, privacy, export, and deletion.

## System Polish Targets

Standardize page containers:

- Consistent top and bottom padding across private pages.
- Appropriate `app`, `wide`, and `narrow` container sizes.
- Mobile spacing that avoids cramped controls and horizontal overflow.

Standardize surfaces:

- Shared panel vocabulary through `Surface`.
- Tone choices tied to semantic role rather than decoration.
- No nested-card feel where a flat section or inherited surface is enough.

Standardize actions:

- Primary actions are visually primary.
- Secondary actions recede without disappearing.
- Destructive actions use `clay` or `danger` treatment and stay separated from routine actions.
- Icon-only controls have accessible names.

Standardize states:

- Hover, focus, active, disabled, loading, error, success, and empty states are visible where relevant.
- Focus indicators remain clear and keyboard reachable.
- Empty states teach the next useful action without pressure language.

Standardize mobile:

- Touch targets are at least 44px where controls are touchable.
- No horizontal scrolling at common mobile widths.
- Private navigation and writing routes keep stable layout.

Standardize motion:

- Keep transitions short and purposeful.
- Avoid decorative page-load sequences.
- Respect `prefers-reduced-motion`.

## Page-by-Page Requirements

### HomeAuthenticated

Make the authenticated arrival page composed and useful. Clarify action hierarchy around writing, prompt, mood, and return-to-note actions. Reduce competing visual weight without removing warmth.

### MyNotes

Tighten search, filtering, note cards, empty states, and calendar/list transitions. Saved writing should be easy to scan and return to without feeling like a productivity database.

### CreateNote

Protect the writing surface. Polish side panels, mobile controls, metadata chips, tasks, tags, cover image controls, AI reflection panels, and focus mode without changing save behavior.

### SingleNote

Improve read/revise flow, metadata, tags/tasks editing, extraction panels, and modal surfaces. Reviewing a note should feel quiet and personal, not administrative.

### Insights

Align recap, mood chart, refresh, loading, and empty states to the `sky` tone. Keep language tentative and non-diagnostic.

### LifeWiki

Make themes and entries feel patient and structured. Avoid heavy dashboard energy. Keep upgrade and locked states clear without implying self-knowledge requires payment.

### ReleaseMode

Keep the release flow emotionally contained. Improve copy, completion feedback, and route exits while preserving a restrained `clay` tone.

### FutureLetters

Polish scheduling, locked letters, opened letters, and empty states. The page should feel warm and deliberate, not like a reminder utility.

### Account

Make privacy, plan, data deletion, and profile settings concrete and trustworthy. Destructive actions should be visibly separated and have clear recovery expectations.

## Non-Goals

- No new analytics, mood scoring, streaks, or gamification.
- No broad route restructuring.
- No replacement of the existing design system.
- No public-page polish.
- No subscription copy that implies care or privacy depends on payment.
- No changes to backend contracts unless a private UI defect requires it.

## Verification

Use focused verification instead of broad rewrites:

- Run relevant private-dashboard contract tests.
- Run shared UI contract tests touched by the polish.
- Run `vite` build.
- Browser-check private pages at mobile and desktop widths.
- Confirm no horizontal overflow on common mobile widths.
- Confirm visible focus states and accessible names on icon-only controls.
- Confirm no obvious console errors during private-page navigation.

## Success Criteria

- Authenticated private pages feel like one cohesive product system.
- Shared design primitives are used consistently where they already fit.
- Existing workflows and user data behavior are preserved.
- Mobile pages remain readable, stable, and touch-friendly.
- Existing relevant tests pass or any failure is explained with a concrete blocker.
- The final diff is scoped to private-app polish and necessary shared primitives.
