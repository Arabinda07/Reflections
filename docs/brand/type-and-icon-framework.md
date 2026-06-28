# Typography & Icon Framework

_The repeatable rules for **font size**, **font style**, and **icons** across Reflections. Companion to [`type-and-icon-audit.md`](./type-and-icon-audit.md) (the findings this fixes) and [`DESIGN.md`](./DESIGN.md) (the brand it serves)._

This document does not re-decide the typefaces — that is settled (Manrope + Spectral, see DESIGN.md). It defines the layer on top: which **size**, which **style**, and which **icon** to use **for each context**, so the same role looks the same everywhere. Everything here references tokens/classes that already exist in `index.css`, `tailwind.config.js`, and `components/ui/PublicPageIcon.tsx` — nothing new is invented.

---

## A. Typography framework

### A.1 The two faces, and what they _mean_

| Face | Files shipped | Role | Voice |
|------|---------------|------|-------|
| **Manrope** | Variable (200–800) | Display, headings, all UI, labels | Functional, clear, structural |
| **Spectral** | Regular 400, Italic 400, Bold 700 | Reflective accents + long-form reading | Literary, warm, human |

Only these **four faces** exist. Do not specify a weight that isn't shipped (e.g. Spectral 600). Manrope is variable so any weight 200–800 is available; in practice use the steps in A.3.

### A.2 Style rules — when regular / italic / bold

This is the part the project never wrote down. Style is **semantic**, not decorative:

| Style | Use it for | Never for |
|-------|-----------|-----------|
| **Spectral _italic_ 400** | The reflective/emotional voice: hero accent line, page intros, note previews, AI reflections, writing prompts, future-letter body, quiet quotes | UI labels, buttons, metadata, dense data, anything the user acts on |
| **Spectral regular 400** | Long-form reading body: `.dashboard-prose`, `.dashboard-letter-text`, wiki & letter content | Headings, controls |
| **Manrope 800 (extrabold)** | Display & primary headings, hero, page titles | Body copy |
| **Manrope 700 (bold)** | Card titles, section heads, buttons, action labels | Long paragraphs |
| **Manrope 500–600 (medium/semibold)** | Secondary & supporting UI, helper text, form labels | Headlines |
| **Manrope 900 (black) + caps + 0.16em** | Tiny eyebrow labels only — `.label-caps` | Anywhere it appears more than once per view; use sparingly |

Rule of thumb: **Spectral = the user's inner voice; Manrope = the app's voice.** If text is something the user *feels or reads slowly*, it's Spectral. If it's something the app *says or the user clicks*, it's Manrope.

### A.3 The canonical size ladder

One ladder, two tracks. Stop using arbitrary `text-[Npx]`.

**Marketing / public surfaces** — fluid scale (already in `tailwind.config.js:31-39`):

| Tier | Token | Value |
|------|-------|-------|
| Display | `text-mk-display` | clamp(2.5→4.5rem) |
| H1 | `text-mk-h1` | clamp(2→3.5rem) |
| H2 | `text-mk-h2` | clamp(1.5→2.5rem) |
| H3 | `text-mk-h3` | clamp(1.25→1.75rem) |
| Body | `text-mk-body` | clamp(1→1.125rem) |

**App / authenticated surfaces** — fixed ladder, mapped to existing tokens/classes:

| Tier | Use for | Token / class | Size |
|------|---------|---------------|------|
| `caption` | metadata, timestamps, word count | `text-ui-xs` | 12px |
| `label` | eyebrow labels (sparingly) | `.label-caps` | 11px caps |
| `small` | secondary text, sublabels, helper | `text-ui-sm` / `.dashboard-supporting-text` | 14px |
| `body` | default body, form input, card body | `text-ui-base` | 16px |
| `lead` | section intros | `--text-base` | 18px |
| `title` | card titles | `text-ui-lg` / `.dashboard-card-title` | 20px |
| `subhead` | modal & subsection heads | `text-ui-xl` | 25px |
| `section` | page section heads | `.h2-section` / `text-2xl` | 1.5–2rem |

> **Reconcile the duplicate names first.** `--text-*` (1.25 ratio, 18px base — `index.css:245-262`) and Tailwind `text-*` currently disagree (`--text-xl` ≈ 28px vs Tailwind `text-xl` = 20px). When this framework is applied, pick the **Tailwind `ui-*` track as the app source of truth** and treat the `--text-*` ladder as legacy (or align them). Until then, prefer the `ui-*` tokens and the `.dashboard-*` classes, which already use `--text-*` internally and are self-consistent.

### A.4 Migration map — arbitrary literal → canonical

Apply per role (the role decides, not the pixel value):

| Current literal | → Tier | Use instead |
|-----------------|--------|-------------|
| `text-[11px]` (caps label) | label | `.label-caps` |
| `text-[12px]` | caption | `text-ui-xs` |
| `text-[13px]` (button) | small | `text-btn-sm` (button) or `text-ui-sm` |
| `text-[14px]` | small | `text-ui-sm` |
| `text-[15px]` | body or small (by role) | `text-ui-base` (body) / `text-ui-sm` (secondary) |
| `text-[16px]` | body | `text-ui-base` |
| `text-[17px]`, `text-[18px]` | lead | `--text-base` via `.dashboard-letter-text`/lead class |
| `text-[20px]` | title | `text-ui-lg` / `.dashboard-card-title` |
| `text-[22px]` | title→subhead | `text-ui-lg` (card) or `text-ui-xl` (subhead) |
| `text-xl`/`text-2xl`/`text-3xl` (titles) | title/section | `.dashboard-card-title*` / `.h2-section` |

Near-duplicates (`text-[15px]` vs `text-[16px]` vs `text-base`; `text-[13px]` vs `btn-sm` vs `text-[12px]`) collapse into the single tier for that role.

### A.5 Measure & leading

Line length and leading are already tokenized — use them, don't re-specify:
- **Measure:** `--measure-compact` 52ch · `--measure-readable` 65ch · `--measure-wide` 75ch (`index.css:263-266`), via `.typographic-measure*`. Cap reading body at 65ch.
- **Leading** is baked into the `ui-*`/`mk-*` tokens and `.dashboard-*` classes; don't hand-tune `leading-[…]` unless a display heading genuinely needs it.

---

## B. Icon framework

### B.1 Two systems, one rulebook

- **Public pages** → `PublicPageIcon` (inline SVG, 23 curated names in `PublicPageIcon.tsx`).
- **Authenticated pages** → `@phosphor-icons/react`.

Keep the split (public ships zero icon-library weight), but both obey the rules below. The vocabulary table (B.4) lists **both** the PublicPageIcon name and the Phosphor name per concept so the two stay in sync.

### B.2 Placement — inline by default

The default, generalized from the public pages:

```tsx
<h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold text-gray-text">
  <Icon size={19} className="flex-none text-green" weight="regular" />
  {title}
</h3>
```

- Icon is the **first child** of its heading/label, vertically centered (`flex items-center gap-2.5`).
- `flex-none` so it never shrinks; color via `text-green` / `currentColor`, never hard-coded.
- **No `tone-icon` decorative box as a default.** Reserve tinted icon-boxes for a genuine list affordance (e.g. distinct task categories), never as a single decorative hero tile.

### B.3 Icon size ↔ text size (fixed tier table)

Icon size is **bound to the adjacent text**, not chosen ad hoc:

| Text context | Text size | Icon px |
|--------------|-----------|:-------:|
| metadata / caption | 12–14 | **14** |
| body / inline action | 16 | **16** |
| card title | 20 | **19** |
| section head | 24+ | **24** |
| empty-state / illustration **only** | — | **40–48** |

**The big-icon rule:** sizes 40–48 are allowed **only** for a standalone empty-state or illustration. An icon must never be so large that its label drops to a separate line/paragraph beneath it — the filler anti-pattern. Inline icons stay in the 14–24 band.

### B.4 Weight

One default: **`weight="regular"`** for inline/line UI. Reserve **`duotone`/`fill`** for status & emphasis only — Pro (`Crown`/`Sparkle`), security (`ShieldCheck`), warnings (`Warning`). Don't mix weights for the same role.

### B.5 Curated vocabulary — one icon per concept

The approved set. Pick the canonical icon for the concept; collapse the variants listed under "replaces."

| Concept / context | Phosphor | PublicPageIcon | Replaces |
|-------------------|----------|----------------|----------|
| write / compose | `PencilSimpleLine` | `pen` | Pen, PencilSimple, NotePencil, Feather* |
| journal / note | `Notebook` | `book` | — |
| read / wiki | `Book` | `book` | — |
| person (one) | `User` | `user` | UserCircle |
| people (many) | `UsersThree` | `user` | AddressBook |
| add person | `UserPlus` | `user` | CirclesThreePlus |
| privacy / encryption | `ShieldCheck` | `shield` | Lock, LockKey, Shield |
| password action | `Key` | `lock` | _(kept — distinct action)_ |
| AI / smart | `Sparkle` | `sparkle` | Robot |
| patterns / insight | `ChartLine` | `chart` | Brain |
| mood / feeling | `Smiley` | `heart` | — |
| relationships | `Heart` | `heart` | — |
| tag | `Tag` | `tag` | — |
| tasks | `ListChecks` | `checklist` | — |
| menu / overflow | `DotsThreeVertical` | — | DotsThreeCircle |
| confirm (state) | `CheckCircle` | — | — |
| confirm (inline) | `Check` | — | — |
| delete / release | `Trash` | `trash` | — |
| export / download | `DownloadSimple` | — | Download |
| email | `EnvelopeSimple` | `envelope` | Envelope |
| sound | `Headphones` | `headphones` | — |
| voice | `Microphone` | `microphone` | MicrophoneSlash (toggle pair) |
| Pro / premium | `Crown` | — | — |
| back | `ArrowLeft` | `arrowLeft` | CaretLeft |

\* **Feather** is the one allowed exception: it may stay as a brand/quill accent for "the author's voice" (e.g. the About page), but not as the generic "write" action icon — that's `PencilSimpleLine`.

When a concept needs a new icon, add a row here first; don't introduce a second icon for an existing concept.

---

## How to use this doc

- **Building a new surface:** pick the role → use the tier's token/class (A.3) and the concept's icon at the bound size (B.3–B.5). No arbitrary `text-[Npx]`, no ad-hoc icon sizes.
- **Refactoring an existing surface:** walk the migration map (A.4) and the vocabulary table (B.5); replace literals and stray icons with the canonical choices.
- **Guardrails (optional, future):** these rules are contract-test-able — e.g. assert no raw `text-[Npx]` in `pages/dashboard/*`, assert icon sizes come from {14,16,19,24,40,48}. Add alongside the existing `typographyMotionContract` if the team wants enforcement, not just guidance.

All rules here stay within the locked constraints (Manrope+Spectral, 4 faces, no negative tracking, no `transition-all`, surface-scope color routing). Nothing in this framework requires breaking an existing contract; applying it is a consolidation, not a redesign.
