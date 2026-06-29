# Graphify × OKF × SEO — topic-graph roadmap

**Date:** 2026-06-28 · **Method:** one-time graphify topic-graph analysis · **Status:** roadmap (no code shipped)

## What this is

A content + internal-linking + OKF roadmap, derived by running graphify (Leiden community detection + degree centrality + bridge detection) over a 55-node topic graph assembled from: our 5 public pages, our 7 OKF nodes, 4 scraped competitors (Day One, Journey, Penzu, Apple Journal), a target-query list, product facts mined from the existing code graph, and customer-language themes. Corpus + graph live in the session scratchpad (throwaway). Every recommendation below is tagged with the graph signal that produced it.

**Graph:** 55 nodes · 98 edges · **9 communities**. Pillar candidates by degree: Notes (8), OKF-features (8), FAQ (7), **Android journaling (7)**, **Cross-platform (7)**, Home (6), Optional AI (6), Zero-knowledge (6), **Comparison intent (6)**, Relationships (5).

## The 9 topic clusters (your site's real architecture)

| # | Cluster (theme) | Own coverage | Read |
|---|---|---|---|
| 0 | Encryption & trust (12 nodes, biggest) | Privacy + OKF-encryption | **Strong** |
| 1 | Cross-platform / Android comparison (10) | only vs-Day-One | **Under-covered, high centrality** |
| 2 | AI stance (7) | About (weak) | Under-covered |
| 3 | Writing core (6) | Home | Strong |
| 4 | Pricing (5, cohesion 0.70) | FAQ | Strong |
| 5 | AI features / letters (4) | OKF-features | OK |
| 6 | Web / Penzu (4) | none | **Whitespace** |
| 7 | Relationships (4, cohesion 0.67) | none (sections only) | **Whitespace — pillar missing** |
| 8 | Calm tools (3) | none | Orphan (low priority) |

## Prioritized new pages (Part 3 — comparison ≈33% of AI citations)

**P1 — Relationships pillar page.** *Signal: Community 7 (cohesion 0.67), degree-5 topic, zero public page — and `/features/relationships` currently 301-redirects to `/faq` (vercel.json).* The most differentiated feature has no findable page. Build a definitive guide (what it is, weekly reach-out suggestions, "not a CRM", encrypted). Reuse the `publicSeoCopy.js` + `RoutePath` + static-snapshot pattern; auto-flows into OKF + sitemap when added.

**P2 — Android / cross-platform comparison set.** *Signal: Community 1 is the highest-centrality under-covered cluster (Android 7, cross-platform 7, comparison 6); whitespace nodes "Best alternative for Android", "Apple Journal alternative".* Add, in order: (a) "Best private journal app for Android" (answer/listicle, positions vs Day One's Apple-first + Apple Journal's iPhone-only), (b) **vs Apple Journal**, (c) **vs Journey** (contrast their always-on Odyssey AI with our optional/quiet AI). Each reuses `ComparisonPage`.

**P3 — Trust answer page: "Can journaling apps read your entries?"** *Signal: Community 0 whitespace — "Data ownership / can they read it", "Breach / company-can-read fear", "Cloud-sync distrust" are customer-language nodes with no page answering them directly.* High citation intent; write as a definitive answer with **statistics-with-sources (+37% citation boost)** and explicit zero-knowledge model. Links into Privacy + OKF-encryption.

**P4 — vs Penzu + "no-install web journal" angle.** *Signal: Community 6 whitespace (Penzu, Penzu alternative, web/PWA, no-install) has no own coverage.* Lower priority; a `vs Penzu` page (Penzu gates encryption behind paid Pro — strong contrast) plus a web/no-install angle folded into P2.

**Deferred:** Community 2 "private/optional AI" stance — strong differentiator vs Journey; ship as FAQ expansion + an OKF depth node (below) before a dedicated page. Community 8 calm-tools — fold into a features page, don't build standalone.

## Internal-linking actions (graph bridges + co-community)

1. **Comparison hub:** vs-Day-One ↔ new Android-best / vs-Apple-Journal / vs-Journey pages (all Community 1). *Signal: co-community, currently disconnected.*
2. **Encryption spine:** Privacy ↔ FAQ encryption Q ↔ OKF-encryption. *Signal: existing bridge "FAQ → Device-side encryption" (community 4→0) is the only link; make it bidirectional and explicit.*
3. **Home → Relationships pillar (P1).** *Signal: Home bridges to Relationships (community 3→7) but the target is a thin section; point it at the new pillar.*
4. **Pricing funnel:** Home + About + each comparison page → FAQ pricing. *Signal: Community 4 (pricing) is tightly cohesive but only FAQ sits in it.*
5. **Trust page (P3) → Privacy + FAQ + OKF-encryption.** *Signal: pull the orphaned Community 0 customer-language nodes into the covered pillar.*
6. **Relationships pillar (P1) → Home + FAQ relationship Q + OKF-features.** *Signal: close Community 7 back to the hub.*

## OKF enrichment (graph-driven)

- **Add `relationships.md` depth node.** *Signal: Community 7 whitespace; currently only a row inside `features.md`.* A cohesive, differentiated cluster deserves its own OKF concept (mirrors the future P1 page).
- **Add `ai-stance.md` depth node** — "AI never runs automatically; Smart Mode off by default." *Signal: Community 2 whitespace; differentiator vs Journey's always-on chat.*
- **Cross-link day-one.md → future comparison nodes** once P2 ships (they auto-emit into the bundle). *Signal: Community 1 co-membership.*
- Community 0 already well-covered by `encryption.md` — no change.

## On-page SEO actions (ai-seo / seo-audit)

- **Stats-with-sources (+37%)** on P3 trust page and comparison pages (encryption specifics, platform facts, dated pricing).
- **FAQPage schema** on every new page via the existing `faqSchema` path in `publicSeoCopy.js` → `buildExtraSchema` (`scripts/generate-public-seo-pages.mjs`).
- **Freshness:** bump `PUBLIC_SEO_LAST_MODIFIED` when pages change; it already flows to sitemap + OKF `timestamp`.
- **Wiring per new page (existing pattern, don't forget any):** `publicSeoCopy.js` entry → `RoutePath` + route → page component → `sitemap.xml` entry → `robots.txt` allow → update `seoCrawlabilityContract.test.ts` (it asserts the exact sitemap list). New pages then auto-flow into the OKF bundle.

## Off-site (highest citation leverage, non-code)

Third-party presence is where AI pulls most citations: accurate Reddit participation (r/Journaling, privacy subs — the customer-language source), review-site profiles, and a Wikipedia-grade external mention. Not graph-derived; flagged for completeness.

## How to refresh this analysis

Re-run when content grows: regenerate the corpus, rebuild `topic-graph-out/graphify-out/graph.json`, `graphify cluster-only <dir> --no-label --no-viz`, re-read communities + degree + whitespace. No API key needed (clustering/centrality are LLM-free).
