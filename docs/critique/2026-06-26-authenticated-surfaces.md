# Critique — Remaining authenticated surfaces (live pass)

**Date:** 2026-06-26 · **Method:** **live**, logged in (test account, empty data),
desktop + 390px mobile screenshots. Surfaces: Insights, Relationships, Future
Letters, Release Mode, Life Wiki, Account, + the encryption Unlock gate. Companion
to `2026-06-26-core-writing-loop.md`. **Guardrail:** PRODUCT.md — craft, not hooks.

## Design Health (Nielsen /40, honest)

| Surface | Score | Note |
|---|---|---|
| Release Mode | ~31/40 | Focused moment-surface; strong copy |
| Unlock gate | ~31/40 | Plain, concrete, privacy-as-promise |
| Future Letters | ~30/40 | Warm, inline compose, anticipation card |
| Account | ~30/40 | Standard, clean settings (appropriately) |
| Life Wiki | ~27/40 | Good gated empty state; **null-deref bug** |
| Relationships | ~28/40 | Calm empty state; **406 console errors** |
| **Insights** | **~22/40** | **Scoreboard of zeros — tone mismatch** |

## Priority issues (new)

- **[P1] Insights reads as a scoreboard — and contradicts the product's own ethos.**
  The empty Insights screen is "**You returned 0 days**" above a grid of **six "0"
  tiles** (Reflections/Check-ins/Release moments/Letters scheduled/Letters
  opened/Active days). On mobile that's a full phone of zeros. This is (a) the
  **banned hero-metric template**, (b) **6 items** at once (>working memory), and
  (c) a direct violation of PRODUCT.md: *"Insights should be observant and patient,
  never evaluative or score-like… not a productivity tracker."* A scoreboard of
  nothing is the most demoralizing thing to show a new user. **Fix:** a patient
  narrative empty state ("Not enough writing yet to notice patterns — keep going");
  when populated, present patterns as gentle prose observations, not a count grid.
  → `/impeccable distill` + `/impeccable onboard` (empty state).
- **[P2] Two real console errors on normal navigation.**
  - Relationships: `GET life_themes?...page_type=eq.people` → **406 ×2** every visit
    (PostgREST `.single()` on no rows). Same class as the shipped "quiet profile
    406" fix, not applied to the People room.
  - Life Wiki: `[LifeWiki] Failed to load AI run activity: TypeError: Cannot read
    properties of null (reading 'data')` **×2** — an actual null-deref. Non-fatal
    but it's a genuine bug. **Fix:** guard the null; quiet the 406.
- **[P3 / taste] Eyebrow-on-every-section is the app's default cadence.** Small-caps
  tracked labels sit above nearly every card on every surface (TODAY'S REFLECTION,
  THIS WEEK, LIFE WIKI OPENS AFTER 3 ENTRIES, MEMBERSHIP, SECURITY…). Consistent,
  but it's the one systemic pattern that reads as templated/AI-scaffold. Vary the
  cadence on hero moments. → `/impeccable typeset`.

## What's genuinely working (confirmed live)

- **The tone / surface-scope system is the best thing about the app.** Each surface
  has a calm, distinct, on-brand identity — sage (Home), sky (Insights, Life Wiki),
  honey (Future Letters), clay (Release), paper (reading/Account). Consistently
  applied, never random. This is premium-grade and rare.
- **Emotionally well-judged moment-surfaces.** Release Mode ("Write it here. Let it
  leave." on clay, with a clear upfront note that the text disappears) and Future
  Letters ("Waiting to open · Your 30th birthday · Locked until July 5, 2026") are
  peak-end moments done right.
- **Empty states that teach + show progress** — Relationships ("No people yet… Go to
  People") and Life Wiki ("Still gathering enough signal" + progress bar + "Write 1
  more entry"). Insights is the lone exception that breaks this otherwise-strong
  craft.
- **AI is explicitly invited** ("Refresh with AI") — matches "AI invited, not
  ambient."
- **Mobile bottom-tab nav** (Home · Write · Notes · More) is clean and thumb-zone.
- **Unlock gate** is plain and concrete ("Your writing is encrypted on this device.
  Enter your password to unlock it." + recovery-phrase fallback) — privacy-as-
  promise, exactly the register.

## Cross-surface synthesis

- **Strength:** tone system + empty-state craft + emotional moment-surfaces are
  consistently strong. The authenticated app feels like one calm product.
- **The one tonal outlier is Insights** — it imports a SaaS-analytics scoreboard
  into an explicitly anti-scoreboard product. Highest-value fix for brand
  coherence.
- **Two latent bugs** (life_themes 406, LifeWiki null-deref) surface on ordinary
  navigation — quick wins for polish + console hygiene.
- **Eyebrows everywhere** is the only systemic "templated" tell; a typographic-
  cadence pass would lift distinctiveness.

## Persona red-flags
- **Casey (mobile):** nav + moment-surfaces are thumb-friendly; Insights' zero-grid
  is a poor first mobile impression.
- **Sam (a11y):** unlock gate + forms are labelled; ⟂ contrast of muted small-caps
  metric labels on tinted tiles is the weakest spot to verify with a checker.
- **Riley (stress-tester):** caught the two console errors on empty data — exactly
  the edge a methodical user hits first.

## Evidence
Live screenshots captured: `live-home.png`, `live-insights2.png`,
`live-insights-mobile.png`, `live-relationships.png`, `live-letters.png`,
`live-release.png`, `live-wiki.png`, `live-account.png` (repo root). Dev server
started in background and stopped before reporting.
