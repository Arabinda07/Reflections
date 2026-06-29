# Typography & Icon Audit — all surfaces

_Audit date: 2026-06-28 · Scope: font size/style + icon usage across public and authenticated surfaces · Method: impeccable `audit`, read-only._

This is a code-level audit of two themes only — **typography** (size & style discipline) and **icons** (vocabulary, sizing, placement). It does not re-review color, motion, or layout, which are in good shape. The fixes live in the companion doc, [`type-and-icon-framework.md`](./type-and-icon-framework.md).

---

## Health score

| # | Dimension | Score | Key finding |
|---|-----------|:---:|-------------|
| 1 | Type consistency | 1/4 | Three competing size systems; same role rendered at 4 different sizes |
| 2 | Token discipline | 1/4 | 137 arbitrary `text-[Npx]` across 34 files; rich semantic classes sit unused |
| 3 | Responsive / touch | 3/4 | Icon-only buttons mostly ≥44px; a few small swipe actions to verify |
| 4 | Theming (color-via-token) | 4/4 | Icons color through `text-green`/`currentColor` + surface tokens; no hard-coded hex |
| 5 | Anti-patterns | 2/4 | Surviving `tone-icon` boxes + oversized decorative icons + redundant icon vocab |
| **Total** | | **11/20** | **Acceptable — significant tightening needed, foundation is sound** |

The low scores are **consistency and token discipline**, not taste. The design language itself (two families, surface tones, AA-tuned contrast) is strong; the problem is that it is not applied through one repeatable system, so every page re-invents sizes.

---

## Anti-pattern verdict — does this look AI-generated?

**Mostly no, with three real tells.** The brand voice is distinctive (Spectral italic as the "reflective" voice is a genuine, non-generic choice). But three patterns read as un-curated:

1. **Oversized decorative icons.** `FileText size={48}` fills the empty-note placeholder (`MyNotes.tsx:292`); `Book size={26}` sits in a `tone-icon` box (`Insights.tsx:321`). Large icons used as filler is exactly the "icon as decoration, not affordance" tell the public pages already removed.
2. **Surviving `tone-icon` decorative boxes** — rounded tinted squares wrapping a small icon — in Insights and across MyNotes / SingleNote, while the public pages standardized on inline icons. Two contradictory patterns live in one app.
3. **Competing size systems** producing visual drift: card titles appear at 4 different sizes depending on which file you open.

None are fatal; all are addressable by the framework.

---

## Findings by severity

### [P1] Three competing font-size systems
**Category:** Typography · **Location:** `tailwind.config.js:23-39`, `index.css:245-262`, and 34 component files.

Font size is specified three incompatible ways at once:
- **Tailwind tokens** — `ui-xs…ui-xl`, `btn-sm/lg`, `mk-display…mk-body` (`tailwind.config.js:23-39`).
- **A separate CSS ladder** — `--text-xs…--text-3xl` on a 1.25 ratio off an 18px base (`index.css:245-262`). Note these **disagree** with Tailwind: `--text-xl` = 1.758rem (~28px) while Tailwind `text-xl` = 1.25rem (20px). Same name, different size.
- **Arbitrary literals** — `text-[Npx]` appears **137 times across 34 files** (`CreateNote.tsx` 28×, `FAQ.tsx` 13×, `ComparisonPage.tsx` 7×, `Account.tsx` 5×, …). The most common: `text-[15px]` (~22), `text-[13px]` (~19), `text-[16px]` (~17), `text-[14px]` (~16).

**Impact:** No single source of truth. A `15px`/`16px`/`text-base` body distinction carries no meaning — it's noise. Designers and future agents have no rule to follow, so the fragmentation compounds.
**Recommendation:** Adopt one canonical ladder (framework §A), retire arbitrary literals, and reconcile the duplicate `--text-*` vs Tailwind names. **Suggested command:** `/impeccable typeset`.

### [P1] Semantic type classes exist but are bypassed
**Category:** Typography · **Location:** `index.css:676-1149` vs page files.

A full set of role classes already ships and is largely unused: `.h2-section` (`:698`), `.body-editorial` (`:720`), `.label-caps` (`:734`), `.dashboard-card-title` (`:996`), `.dashboard-card-title-lg` (`:1005`), `.dashboard-prose` (`:1091`), `.dashboard-supporting-text`, `.dashboard-caption`. Pages re-spell them with utilities instead — e.g. the note-card title is `text-xl font-display font-extrabold …` (`MyNotes.tsx:324`) where `.dashboard-card-title-lg` already encodes that role (and at a *different*, larger size).

**Impact:** The semantic layer that would enforce consistency is dead weight; the value drift (20px vs ~28px for "the card title") is invisible until you compare files.
**Recommendation:** Make the semantic classes the prescribed way to express each role; the framework's migration map points each arbitrary utility at the right class. **Suggested command:** `/impeccable typeset`.

### [P2] Card / section-title size drift
**Category:** Typography · **Location:** MyNotes, LifeWiki, FAQ, CreateNote, Account.

The same semantic role uses different sizes across surfaces: card/section titles appear as `text-xl` (MyNotes), `text-[22px]` (FAQ, CreateNote), `text-[20px]` (FAQ practice items), `text-2xl`/`text-3xl` (LifeWiki, Insights). Body copy spans `text-[15px]`/`text-[16px]`/`text-[17px]`/`text-base`.
**Impact:** Inconsistent hierarchy; the eye can't learn the system because there isn't one. **Recommendation:** Collapse to the canonical tiers (framework §A). **Suggested command:** `/impeccable typeset`.

### [P2] Icon size & weight drift (Phosphor)
**Category:** Icons · **Location:** authenticated pages + shared UI.

Authenticated icons span **12–48px** with no rule, and the Phosphor `weight` prop varies `regular`/`bold`/`duotone`/`fill` arbitrarily (e.g. `FileText size={22} weight="duotone"` `MyNotes.tsx:472` vs `FileText size={48} weight="light"` `:292`). Many icons omit an explicit `size`, falling back to defaults.
**Impact:** The same action reads at different visual weights on different screens; nothing ties icon size to the text it accompanies. **Recommendation:** Fixed icon↔text tier table + one default weight (framework §B). **Suggested command:** `/impeccable polish`.

### [P2] Redundant icon vocabulary
**Category:** Icons · **Location:** app-wide.

Multiple icons cover one concept: **write** — Pen / PencilSimple / PencilSimpleLine / NotePencil / Feather; **person** — User / UserCircle / UserPlus / AddressBook / UsersThree; **security** — Lock / LockKey / Shield / ShieldCheck / Key; **menu** — DotsThreeVertical / DotsThreeCircle.
**Impact:** No learnable icon language; the same idea looks different in two places. **Recommendation:** Curate one canonical icon per concept (framework §B vocabulary table). **Suggested command:** `/impeccable polish`.

### [P3] Surviving `tone-icon` decorative boxes
**Category:** Anti-pattern · **Location:** `Insights.tsx:321`, `MyNotes.tsx:544,559,575`, `SingleNote.tsx:496,534,557,590,605,620,636`.

Rounded tinted squares (`tone-icon tone-icon-* h-10 w-10`/`h-14 w-14`) wrap a small icon — the decorative pattern the public pages dropped in favor of inline icons.
**Impact:** Two contradictory icon patterns coexist. **Recommendation:** Decide per case — SingleNote's task-category boxes may be a legitimate list affordance; Insights' single hero box is decorative filler. Framework §B sets the default to inline. **Suggested command:** `/impeccable distill`.

### [P3] Near-duplicate sizes
**Category:** Typography · **Location:** app-wide.

`text-[15px]` vs `text-[16px]` vs `text-base`; `text-[13px]` vs `btn-sm` (0.8125rem) vs `text-[12px]`; `text-[11px]` vs `text-xs`. Sub-pixel distinctions that carry no intent.
**Impact:** Scale noise. **Recommendation:** Snap to canonical tiers. **Suggested command:** `/impeccable typeset`.

---

## Systemic patterns

- **Bypass-by-default.** The team reaches for `text-[Npx]` and raw utilities rather than the semantic classes — a tooling/affordance gap, not carelessness. The fix is to make the canonical path the *easy* path (documented tiers + classes), then enforce with a contract test if desired.
- **Public solved, authenticated lagging.** The inline-icon pattern, size discipline, and label cleanup already landed on public pages; the authenticated surfaces never got the same pass. This audit is the bridge.

## Positive findings (keep these)

- **Contrast is already AA-tuned** with documented reasoning (`index.css:56-89, 316-335`): `--green` ~4.95:1, `--gray-light` pulled to L0.43 ~5:1, secondary brand colors darkened for AA.
- **Color flows through tokens.** Icons use `text-green`/`currentColor`; surfaces inherit tone via `surface-scope-*`. No hard-coded icon colors found.
- **The public inline-icon pattern is clean and worth generalizing** (`flex items-center gap-2.5`, `flex-none text-green`, `size 18–20`).
- **Font system is locked to 4 faces** (Manrope Variable + Spectral Regular/Italic/Bold) by `coreTypographyLayoutContract` / `typographyMotionContract` — a strong constraint the framework builds on, not against.

## Constraints any future refactor must respect

From the existing `*Contract.test.ts` suite:
- **Manrope + Spectral only**, 4 weight/style files; no other webfonts (`coreTypographyLayoutContract`, `typographyMotionContract`).
- **No negative letter-spacing / `tracking-tight`**; no broad `transition-all` or layout-property animation (`typographyMotionContract`).
- **Surface-scope color routing** — no raw `bg-white/X`; tone via `surface-scope-*` (`designSystemPhase23`).

The framework in the companion doc stays inside all three.

---

## Recommended actions (priority order)

1. **[P1] `/impeccable typeset`** — adopt the canonical size ladder + migration map; retire arbitrary `text-[Npx]`; reconcile duplicate `--text-*`/Tailwind names.
2. **[P2] `/impeccable polish`** — apply the icon↔text size tiers, one Phosphor weight default, and the curated vocabulary.
3. **[P3] `/impeccable distill`** — resolve the surviving `tone-icon` boxes and oversized decorative icons case-by-case.
4. **[P3] `/impeccable polish`** — final consistency sweep.

> You can ask me to run these one at a time, all at once, or in any order you prefer.
> Re-run `/impeccable audit` after fixes to see the score improve.
