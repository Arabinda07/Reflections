# Relationships "People" — calm-first cleanup

**Date:** 2026-06-27
**Status:** Design approved, pending spec review
**Surfaces:** `pages/dashboard/Relationships.tsx`, `pages/dashboard/RelationshipProfile.tsx`, `services/relationshipSuggestions.ts`

## Context / Problem

The Relationships "People" surface has drifted into a lightweight CRM. The profile's
**"More about {name}"** `<details>` (RelationshipProfile.tsx ~454–568) unfolds a wall of
inputs — contact fields, a **stage** dropdown (6 values), a **tier** dropdown (t1/t2/t3),
three **closeness / energy / opportunity** sliders, a **Favors** ledger (given/received ×
6 categories), and a **Connections** graph. Users bounce when they voluntarily open it.

This contradicts the product philosophy (`PRODUCT.md`):

- *"Patterns emerge slowly. Insights should be observant and patient, **never evaluative
  or score-like**."* — the 1–5 sliders and tiers are exactly score-like.
- Anti-reference: *not "a product that treats … as data inventory,"* not "a tracker / leaderboard."
  The Favors ledger is a who-owes-whom scoreboard.
- Design Principle 3: *"Calm is behavior."* The wall is the opposite of calm.

Crucially, the **weekly-nudge engine** (`relationshipSuggestions.ts`) — the actual product
value — barely uses this data. It ranks on: open `hooks`, recency `gap` from `interactions`,
open `nextCare`, the `dormant` flag, and `closeness/energy/opportunity` **only** as opaque
score weights. So most of the wall is captured-but-unused, off-path, *and* off-philosophy.

**Intended outcome:** make the value loop — **add a name → gentle weekly nudge → log a
catch-up / save a reason** — the whole product. Let cadence emerge from behavior instead of
asking users to score people. Remove the wall so "show more" is calm, not a tax form.

## Goals

1. Replace the People-tab first-run with a near-zero, outcome-led empty state.
2. Reduce the profile to a single calm column; remove the CRM wall.
3. Rank weekly suggestions purely on behavior; derive "dormant" instead of asking for it.
4. Retain all stored data (no destructive migration).

## Non-goals (out of scope)

- The Import inbox (`RelationshipImportInbox.tsx`), the Weekly-tab suggestion cards, the
  Life-Wiki tie-in, navigation, and the create `ModalSheet` flow.
- No DB migration. No changes to `relationshipService` / `relationshipStore` persistence.

## Decisions (from brainstorming)

| # | Decision |
|---|----------|
| 1 | **Cut the bloat, derive cadence.** Remove sliders, tier, Favors, Connections, and the 6-stage dropdown from the UI. Engine ranks on behavior; `dormant` is derived. |
| 2 | **Near-zero, outcome-led onboarding.** Outcome line + single "Add a name" field + quiet "paste a few" secondary. After first add, land on the populated Weekly list. |
| 3 | **Calm column + one small optional contact disclosure.** Default shows the human content (incl. catch-up history, promoted up). One "Contact details (optional)" disclosure holds email/phone/role/company only. |
| 4 | **No migration; nothing destroyed.** Keep DB columns; stop collecting/rendering the removed fields. Existing favors/connections values remain in the record and exports, just unsurfaced. |

## Detailed design

### A. First-run empty state — `Relationships.tsx` (People tab, ~285–303)

Replace the `CirclesThreePlus` icon + headline + 3-step `<ol>` checklist + seed `<textarea>`
with:

- An outcome headline (e.g. **"Never lose touch with someone who matters."**) and one calm
  subline.
- A single-field **Add a name** quick-add (reuse the existing create path
  `relationshipService.create({ name })`), submitting on Enter/click.
- A quiet secondary control — **"or paste a few names"** — that reveals the existing
  multi-line seed `<textarea>` (`seedRelationships`, capped at 10) for power users. Collapsed
  by default so it isn't a wall.
- After the first person is added, the user is routed to / shown the **Weekly** list (the
  value), not a second empty state. (The Weekly tab's own "all caught up / no people" states
  are unchanged.)

Keep: the archived-people show/hide block, the pending-import banner, the right-rail cards.

### B. Profile — `RelationshipProfile.tsx`

**Visible calm column (default), in order:**
1. Header (name, subtitle, last-caught-up, "Log a catch-up", overflow menu) — unchanged.
2. Catch-up composer (`catchUpOpen`) — unchanged.
3. **Facts** card: Name, How you know them, What they care about — unchanged.
4. **Reasons to reconnect** (`hooks`) — unchanged.
5. **Reminders** (`nextCare`) — unchanged.
6. **Catch-ups** history — **promoted out of the wall** into the visible column (it is the
   aha record). Read-only list of `interactions` (date + notes), same markup as today.
7. **From your Life Wiki** (`wikiMentions`) — unchanged (incl. the empty-state hint variant,
   which moves up so the People-room link stays reachable without the wall).

**Removed entirely from the UI** (state, handlers, and markup):
- The `<details>` "More about {name}" wrapper.
- **Details/status form**: the closeness/energy/opportunity sliders, the **stage** `<select>`,
  the **tier** `<select>`. (Contact fields survive — see below.)
- **Favors** card + `addValueEntry` + `valueEntry` state.
- **Connections** card + `addConnection` + `connection` state.

**One small disclosure — "Contact details (optional)":** a single `<details>` (or the lighter
existing pattern) holding only **email / phone / role / company** inputs and their Save
(`saveDetails`, trimmed to those four fields). No sliders, no stage, no tier.

**State/handler cleanup:** drop `valueEntry`, `connection` state and `addValueEntry`,
`addConnection`. Trim `saveDetails` to the four contact fields (remove stage/tier/closeness/
energy/opportunity from its `update(...)` payload). Remove now-unused imports
(`HandHeart`, `UsersThree`, `IdentificationCard` if unused, stage/tier label helpers if unused).

### C. Engine — `services/relationshipSuggestions.ts`

- **Derive dormant:** replace `relationship.stage === 'dormant'` checks (in `reason()` and the
  score) with a derived predicate `isDormant = daysSince(lastInteraction?.date) > 90`
  (reuse the existing 90-day threshold already in `reason()`). `stage === 'archived'` filter
  is unchanged.
- **Drop slider weights:** remove `closeness * 2 + energy + opportunity` from `score`. New
  score = dormant bonus + hook bonus + recency component (+ optionally open-`nextCare` bonus).
  Ranking is then fully behavior-driven.
- `markTended`, archive/unarchive, and the `lastTendedAt < startOfCurrentWeek()` filter are
  unchanged.

### D. Data handling

- No schema/migration change. `RelationshipRecord` keeps all columns.
- `relationshipService.create/update` plumbing is untouched; stored `closeness/energy/
  opportunity` keep their existing defaults (now constants, irrelevant to ranking).
- Existing `valueLedger` / `connections` / `tier` values remain in each record (and in any
  export) but are no longer rendered or editable. This is a deliberate, reversible capability
  reduction — data is retained, not deleted.

## Edge cases

- **Existing users with favors/connections data:** values persist in the DB; they simply stop
  appearing. No data loss, no error.
- **A person with no interactions:** `isDormant` is false (gap = ∞ handled as "not yet talked"
  via existing `reason()` branch `!last`), so they still surface with the "haven't talked yet"
  reason — unchanged behavior.
- **Seeded names** still default to `stage: 'active'`; dormant is now derived from contact gap.

## Files to modify

- `pages/dashboard/Relationships.tsx` — first-run empty state (Decision 2).
- `pages/dashboard/RelationshipProfile.tsx` — remove wall, promote catch-ups, optional contact
  disclosure, state/handler/import cleanup (Decision 1, 3).
- `services/relationshipSuggestions.ts` — derive dormant, drop slider weights (Decision 1).
- Relationship contract/unit tests that assert the removed UI or the old scoring — update to
  the new design intent (keep behavioral assertions, revise removed-field ones).

## Verification

- Unit tests for `relationshipSuggestions`: dormant is derived from a >90-day gap; ranking no
  longer depends on closeness/energy/opportunity; archived still excluded.
- `npx vitest run` and `npm run lint` (`tsc --noEmit`) green (incl. removed-import cleanup).
- Live (logged in as `fantasyaan@gmail.com`, unlock with `abcdef`): empty People tab → add one
  name → see the Weekly nudge; open a profile → calm single column, no wall; "Contact details
  (optional)" reveals only the four fields; "paste a few names" still seeds.

## Open question (flagged, not blocking)

This removes Favors / Connections / tiers as **features**, not just visually. Data is retained.
If any of these were intentionally marketed capabilities, that's a product call — default is to
remove them as off-philosophy and unused by the value loop.
