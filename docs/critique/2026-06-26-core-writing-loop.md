# Critique — Core writing loop (Home · Notes library · Read view)

**Date:** 2026-06-26 · **Method:** source-grounded (login-gated surfaces; live
authenticated screenshots blocked without test credentials — items needing pixels
are marked ⟂verify-live). **Bars:** Bear, Craft, Day One, Notion, Apple Notes,
Linear. **Guardrail:** PRODUCT.md anti-references — benchmarked for interaction
*craft*, never engagement hooks.

## Design Health (Nielsen /40, honest)

| Surface | Score | Band | Weakest heuristics |
|---|---|---|---|
| Home (`HomeAuthenticated.tsx`) | ~26/40 | Acceptable→Good | Aesthetic/minimalism, Flexibility, Help |
| Notes library (`MyNotes.tsx`) | ~26/40 | Acceptable→Good | Recognition (no search), Flexibility, Aesthetic |
| Read view (`SingleNote.tsx`) | ~30/40 | Good | Flexibility, Help |

The **read view is the strongest** surface and genuinely premium; the **library is
the weakest** mainly because of one missing capability (search) and over-decorated
cards.

## Product-slop test
Would a Bear/Day One/Notion-fluent user trust this? **Mostly yes** — the reading
view typography and the tone/surface system are refined and un-generic. Three things
make them pause: (1) **no search**, (2) **full-screen spinners** where every premium
tool shows skeletons, (3) **busy library cards** with duplicated affordances.

## Priority issues

- **[P1] No text search across notes** (`MyNotes.tsx`). Tag filter + calendar exist,
  but there is no way to find an entry by its words. This is table-stakes in every
  premium note/journal app and the single biggest "find" gap. *Note: this is a
  feature addition, not polish — flagged because it's the highest-impact gap.*
  → `/impeccable shape` (feature).
- **[P2] Loading = full-screen spinner, not skeletons** (all three: "Gathering your
  thoughts…", "Opening your reflection…"). DESIGN/product register both say
  "skeleton states for loading, not spinners in the middle of content." Skeleton the
  card grid and the document. → `/impeccable harden`.
- **[P2] Library cards carry duplicated, over-prominent affordances** (`MyNotes.tsx`
  `renderNoteCard`). Each card has: an always-visible delete button over the
  thumbnail **and** swipe-to-delete; an export button **and** swipe-to-export; and
  three separate links that all open the same note (image, title, "Open"). That's
  visual noise + cognitive load, and always-visible delete is anxiety-inducing on a
  *calm* journal. Pick one delete path (swipe on mobile, hover/menu on desktop),
  one open target, keep export in the overflow. → `/impeccable distill`.
- **[P2] Home runs an orchestrated hero-intro page-load sequence** (`HomeAuthenticated.tsx`
  hero with video + drag/scroll/timed dismiss). Product register: "No orchestrated
  page-load sequences. Product loads into a task; users don't want to watch it
  load." It conflicts with "Calm is behavior." It's session-gated (good), but
  consider making it quieter / first-session-only. → `/impeccable quieter`.
- **[P3] Read view metadata editing is modal-heavy** (`SingleNote.tsx` — mood, tags,
  tasks, export each open a `ModalSheet`). Defensible on mobile, but tags especially
  could be inline. Register note: "Modal as first thought is usually laziness." →
  `/impeccable distill`.

## Minor / polish
- **[P3] No prev/next between entries** in the read view (Day One swipes between
  days). Only "Back to list." A flow gap for browsing a journal.
- **[P3] Library re-staggers card entrance on every visit** (`--note-card-delay:
  index*50ms`), not just first load — can feel slow returning to a full library.
- **[P3] Read↔edit is a hard surface split** (SingleNote → CreateNote on Edit). Calm
  by design, but more friction than the inline-edit benchmark (Bear/Notion).
- ⟂verify-live: contrast of the serif preview (`text-gray-text/70`) and of mood/date
  `MetadataPill`s laid over photo thumbnails — needs a pixel/contrast check.

## What's genuinely working (keep)
- **Optimistic updates with rollback + plain-language error `Alert`s**
  (`SingleNote.persistNote`) — best-in-class interaction polish; matches Linear.
- **Document-anchored reading typography** (Spectral serif, `prose-lg`,
  `typographic-measure-wide`) — premium, on par with Day One/Bear.
- **Empty states that teach and invite** (`MyNotes` Lottie + warm, non-pressuring
  copy) — exactly the register.
- **Coherent tone/surface-scope system** (paper for reading, sage for overview) —
  consistent and on-brand across surfaces.
- **Strong a11y baseline** — aria-labels on icon buttons, `focus-visible` rings,
  `aria-live` regions, `aria-haspopup/expanded`, haptics on swipe.

## Cross-surface consistency audit
- **Loading**: consistent with each other, consistently *against* the skeleton
  principle. Fix once, apply to all three.
- **Delete pattern diverges**: library = always-visible trash + swipe; read view =
  top-bar button. Standardize the destructive affordance.
- **Tone usage**: correct and consistent (paper/sage) — a real strength.
- **No global search/command surface** anywhere — Home and library both lack it; a
  premium app would put it in the nav or a ⌘K palette.

## Persona red-flags
- **Casey (distracted mobile):** hero intro delays content on Home (session-gated,
  ok); biggest issue is **no search** → one-handed scrolling to find an old entry.
  Capture is well-served by the bottom "Write" tab.
- **Sam (screen reader / keyboard):** strong baseline; watch **focus verbosity** —
  each library card exposes 3 links to the same note + a delete button (repetitive
  to tab through). ⟂verify-live contrast on tinted pills/preview.
- **Alex (power user):** the weakest fit — no keyboard shortcuts, no ⌘K, no search,
  no bulk actions, no prev/next. Some of this is intentional (calm over efficiency),
  but search and prev/next are reasonable even for a calm tool.

## Evidence boundary
Live authenticated screenshots (populated / empty / loading at desktop + 390px
mobile) were **not** captured — the surfaces require login + encryption unlock and
no test credentials were available; `/home` confirmed-redirects to `/login`. Provide
a seeded test login and I'll capture the visual set and confirm the ⟂verify-live
items (contrast, card density, motion feel).
