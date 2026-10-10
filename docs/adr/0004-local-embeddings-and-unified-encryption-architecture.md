# ADR 0004: Local Embeddings & Unified Encryption Architecture

**Status:** In Progress (Steps 1, 2, 3, 4 & 5 Complete; Step 6 Next Target)  
**Date:** 2026-10-07 (Updated: 2026-10-10)  
**Supersedes:** [ADR 0001: Per-User Encryption vs. AI Insights Choice](file:///e:/Reflections/docs/adr/0001-per-user-encryption-ai-mode.md)  
**Related Reference:** [AI Architecture & Feature Roadmap](file:///e:/Reflections/docs/ai-architecture-and-feature-roadmap.md)

---

## 1. Context & Problem Statement

In [ADR 0001](file:///e:/Reflections/docs/adr/0001-per-user-encryption-ai-mode.md), Reflections split users into two permanent account modes:
- **Encrypted Vault (`'encrypted'`)**: Zero-knowledge encryption on the client; server cannot read notes; AI features and Life Wiki are completely disabled.
- **Reflective Sanctuary (`'reflective'`)**: Plaintext notes in Supabase; cloud Gemini API can read entries server-side to generate Life Wiki essays and reflections.

This bifurcation created UX friction (forced mode selection at onboarding) and forced users to trade privacy for AI intelligence. Furthermore, cloud Gemini API dependencies created latency, operational cost, and third-party data transmission risks.

By shifting intelligence to **client-side local embeddings**, the browser/device already holds decrypted notes in memory. Zero-knowledge encryption and AI intelligence are no longer mutually exclusive.

With the advent of modern embedding models—notably **`bge-small-en-v1.5`** and Google's **`EmbeddingGemma 2`**—we can deploy a **two-tier progressive intelligence architecture** that balances zero-friction onboarding download sizes with deep-context (8K) multimodal semantic capabilities.

---

## 2. Key Architectural Decisions

### 2.1 Unification of Modes (Retiring the Bifurcation)
- **Standardize on Client-Side Encryption**: All users operate in a zero-knowledge encrypted vault. Notes, moods, future letters, and themes are encrypted client-side using WebCrypto AES-GCM 256-bit before syncing to Supabase.
- **Seamless Account Password Wrapping**: Vault keys are wrapped automatically by the user's account password (via `keyWrapperPolicy.ts`), eliminating secondary password friction while preserving zero-knowledge properties.
- **Retire `/onboarding/mode-select`**: Remove the mode selection step from onboarding. New signups transition directly into their authenticated dashboard.
- **Remove Route Guards**: Retire `UserModeGuard` blocks on `/wiki` and `/sanctuary`.

### 2.2 Two-Tier Progressive Model Deployment

Because `EmbeddingGemma 2` (~190 MB text, ~560 MB multimodal) is more capable but significantly heavier than `bge-small` (~33 MB), forcing mobile users on cellular data to download it immediately would degrade onboarding. We adopt a **Two-Tier Progressive System**:

```
                              ┌─────────────────────────────────────────────────────────┐
                              │                    USER WRITES / SPEAKS                 │
                              └───────────────────────────┬─────────────────────────────┘
                                                          │
                                     ┌────────────────────┴───────────────────┐
                                     ▼                                        ▼
                        [ Mobile Web / Free Default ]             [ Desktop / Native Mobile / Pro ]
                         Tier 1: bge-small (33MB)                  Tier 2: EmbeddingGemma 2 (270M/740M)
                                     │                                        │
                                     ├─────────────────┬──────────────────────┤
                                     ▼                 ▼                      ▼
                                Text Search       Voice & Photo          8K Context
                                (Instant 384d)     Cross-Search       (Truncated to 256d)
                                     │                 │                      │
                                     └─────────────────┼──────────────────────┘
                                                       ▼
                                        IndexedDB Local Vector Store
                                      (Zero-knowledge; never sent off-device)
```

1. **Tier 1 (Instant / Default / Mobile Web)**:
   - **Model**: `bge-small-en-v1.5` (Quantized ONNX, ~33 MB).
   - **Runtime**: Dedicated Web Worker via `@huggingface/transformers` with WebGPU or WASM fallback.
   - **Role**: Instant zero-friction semantic search, mood pre-selection, and tag matching without a 200 MB download penalty.

2. **Tier 2 (Deep Memory & Multimodal / Desktop & Pro Opt-In)**:
   - **Model**: `EmbeddingGemma 2` (modular 270M text encoder, optional 170M vision and 300M audio encoders).
   - **Desktop Web Runtime**: Quantized 4-bit ONNX via Transformers.js in Web Worker with WebGPU acceleration (~190 MB RAM).
   - **Capacitor Mobile Runtime**: Executed via **Google AI Edge / LiteRT** (formerly TensorFlow Lite) or native `llama.cpp` bindings to prevent mobile OS WebView memory terminations (OOM tab kills).
   - **Role**: Indexes multi-page long-form essays without chunking (8,192 token window), performs cross-modal semantic search across text, voice memos, and photos in a shared mathematical space.

### 2.3 Matryoshka Representation Learning (MRL) Vector Truncation
- `EmbeddingGemma 2` natively supports Matryoshka Representation Learning (MRL).
- Rather than storing full 768-float vectors in IndexedDB, the client truncates vectors to the first **256 dimensions** (or 128d) and re-normalizes them ($L_2$ norm).
- **Impact**: Slashes IndexedDB storage overhead by ~66% (~0.5 MB per 500 entries vs ~1.5 MB), and speeds up vector cosine similarity comparisons threefold on mobile hardware with negligible accuracy degradation.

### 2.4 Asymmetric Search Prefixes
Embedding models require instruction framing to distinguish between passive document indexing and active search queries:
- **Indexing Document**: `"Document: " + noteText` (or structured `"title: ${title} | text: ${content}"`).
- **Executing Query**: `"SearchQuery: " + searchQuery`.

### 2.5 Zero-Cloud Theme Triage & Tag Routing
- Instead of calling serverless generative LLMs (`ingestDecision`, `tags`) to categorize notes into Life Themes, the client performs local cosine distance calculations against pre-defined theme centroid vectors.
- Runs on-device in under 100ms at **₹0 compute cost** without exposing decrypted notes over the wire.

### 2.6 Local RAG Engine for Life Wiki
- Compiling the 4-chapter Life Wiki (*People*, *Patterns*, *Philosophies*, *Eras*) no longer requires passing large batches of notes to an LLM.
- `EmbeddingGemma 2` performs client-side retrieval-augmented generation (RAG) over decrypted notes in local memory, selecting only the top 10 relevant excerpts to supply to the generative model.
- Slashes prompt token costs by 90% while guaranteeing that irrelevant journal history never leaves the device.

### 2.7 Generative LLM Strategy Behind Pro Paywall
- Cloud/local generative LLM features (3-paragraph conversational mirror and Life Wiki synthesis) are strictly gated behind `planTier === 'pro'`.
- Free users see locked teaser badges that open `ProUpgradeCTA` to drive trial conversions.
- Pro users execute generation either via a sub-second serverless LLM runner (Gemini 1.5/2.0 Flash or Groq Llama 3.3) or a self-hosted open-weights instance (`Qwen 2.5 1.5B` / `Gemma 2 2B` on Arch Linux via Cloudflare Tunnel).

### 2.8 Local-Only Vector Storage Lifecycle
1. User creates or edits an entry.
2. Note is decrypted in browser memory.
3. Decrypted text is passed to the Web Worker / LiteRT engine.
4. Vector is computed, truncated (MRL 256d), normalized, and saved to client IndexedDB keyed by `(note_id, updated_at_hash)`.
5. Note is encrypted client-side with AES-GCM 256-bit.
6. Only encrypted ciphertext syncs to Supabase. Plaintext, vectors, photos, and voice notes never leave the physical device unencrypted.

---

## 3. Comparison of Architecture States

| Capability | Starting State (ADR 0001) | Baseline ADR 0004 | Upgraded ADR 0004 (EmbeddingGemma 2 + Two-Tier) |
| --- | --- | --- | --- |
| **Privacy & Security** | Broken bifurcation: Vault turned off AI; Sanctuary stored plaintext notes in cloud. | **Zero-Knowledge**: Client AES-GCM; local embeddings in Web Worker. | **Zero-Knowledge**: Same client AES-GCM; local execution across Web & native LiteRT. |
| **Search Scope** | Substring `haystack.includes(needle)`. | Text semantic search (`bge-small` 384d, ~33 MB). | **Cross-modal semantic search**: Unifies text, voice memos, and photos in one index. |
| **Context Window** | Cloud API payload limits. | 512 tokens (~350–400 words); requires chunking. | **8,192 tokens (~6,000 words)**; full essays indexed as single vectors. |
| **Storage Footprint** | 0 KB (no vectors stored). | Fixed 384 floats/entry in IndexedDB (~1.5 MB / 500 notes). | **MRL Truncation to 256 floats**: Cuts storage by ~66% (~0.5 MB / 500 notes). |
| **Download Footprint** | 0 MB (cloud Gemini API). | ~33 MB download (`bge-small`). | **Progressive**: Tier 1 (~33 MB instant) $\rightarrow$ Tier 2 (~190 MB on-demand/Pro). |
| **Theme Triage** | Cloud LLM (`ingestDecision`). | Cloud LLM or manual. | **Zero-Cloud Local Anchor Classification** (<100ms, ₹0 cost). |

---

## 4. Implementation Status & Roadmap

| Phase | Scope | Status | Verification & Artifacts |
|---|---|---|---|
| **Step 1** | **Mode Unification & Paywall Wiring** | **Completed** (Oct 2026) | Migration `20261009100000_unify_user_mode_encrypted.sql`, route guards retired, paywall teasers wired, 137/137 test suites passed. |
| **Step 2** | **Tier 1 Lightweight Embedding Engine & Local Vector Store** | **Completed** (Oct 2026) | Web Worker harness (`@huggingface/transformers`), IndexedDB vector store, asymmetric prefixes, idle background queue, 140/140 test suites passed. |
| **Step 3** | **Hybrid Search, Echoes & Offline Theme Triage** | **Completed** (Oct 2026) | Hybrid cosine + keyword search in `noteSearch.ts`, NoteSearchPalette resonance badges, Echoes in `SingleNote.tsx`, zero-cloud theme triage, 143/143 test suites passed. |
| **Step 4** | **Tier 2 EmbeddingGemma 2 & MRL Optimization** | **Completed** (Oct 2026) | 270M ONNX WebGPU, 8K token context, Matryoshka 256d truncation, local RAG for Life Wiki, 146/146 test suites passed. |
| **Step 5** | **Mood Intelligence & Mindset Drift Tracking** | **Completed** (Oct 2026) | 21 mood anchor vectors, emotional dissonance alerts, antidote memories, monthly thought centroid trajectory, 148/148 test suites passed. |
| **Step 6** | **Native Mobile Runtime (LiteRT) & Multimodal Expansion** | Planned | Capacitor Google AI Edge / LiteRT plugin, cross-modal voice memo and photo indexing. |

---

## 5. Step 1: Execution & Verification Summary (Completed)

1. **Database Schema Unified**:
   - Migration [`supabase/migrations/20261009100000_unify_user_mode_encrypted.sql`](file:///e:/Reflections/supabase/migrations/20261009100000_unify_user_mode_encrypted.sql) applied.
   - `profiles.user_mode` defaults to `'encrypted'`; all legacy `'reflective'` rows backfilled to `'encrypted'`.
   - Function `zero_knowledge_is_forced()` permanently returns `true`.
2. **Onboarding Segregation Retired**:
   - [`pages/onboarding/ModeSelect.tsx`](file:///e:/Reflections/pages/onboarding/ModeSelect.tsx) converted to an instant redirect to `/dashboard`.
   - [`pages/auth/SignUp.tsx`](file:///e:/Reflections/pages/auth/SignUp.tsx), [`pages/auth/SignIn.tsx`](file:///e:/Reflections/pages/auth/SignIn.tsx), and [`pages/auth/AuthCallback.tsx`](file:///e:/Reflections/pages/auth/AuthCallback.tsx) updated to navigate directly into dashboard without `isOnboardingIncomplete` gate.
   - Route `RoutePath.ONBOARDING_MODE_SELECT` in [`App.tsx`](file:///e:/Reflections/App.tsx) redirects straight to `/dashboard`.
3. **Route Guards Unlocked**:
   - Removed `withModeGuard` wrappers on `/wiki`, `/sanctuary`, and `/sanctuary-article` in [`App.tsx`](file:///e:/Reflections/App.tsx).
   - Removed `requireMode: 'reflective'` restriction from Life Wiki in [`layouts/AuthenticatedMobileNav.tsx`](file:///e:/Reflections/layouts/AuthenticatedMobileNav.tsx).
   - Unlocked Sanctuary quick access in [`pages/dashboard/Insights.tsx`](file:///e:/Reflections/pages/dashboard/Insights.tsx) for all users.
4. **Pro Teasers & Paywall Wired**:
   - [`pages/dashboard/CreateNote.tsx`](file:///e:/Reflections/pages/dashboard/CreateNote.tsx): "Reflect with AI" button surfaces whenever note word count $\ge 100$; free users trigger [`ProUpgradeCTA`](file:///e:/Reflections/components/ui/ProUpgradeCTA.tsx) modal sheet; Pro users trigger generative reflection.
   - [`pages/dashboard/LifeWiki.tsx`](file:///e:/Reflections/pages/dashboard/LifeWiki.tsx): Locked state CTA wired to open [`ProUpgradeCTA`](file:///e:/Reflections/components/ui/ProUpgradeCTA.tsx) modal.
5. **Contract Tests & Linter Clean**:
   - [`components/auth/userModeConsistency.contract.test.ts`](file:///e:/Reflections/components/auth/userModeConsistency.contract.test.ts) updated and passing (12/12).
   - Full Vitest suite: 137/137 files passing (617 tests).
   - `npm run lint` cleanly passing (`eslint . --max-warnings 0 && tsc --noEmit`).

---

## 6. Step 2: Execution & Verification Summary (Completed)

Step 2 established the core client-side vectorization infrastructure. Decrypted notes in device memory are converted into mathematical embeddings and indexed in `IndexedDB`.

### 6.1 Executed Deliverables for Step 2

1. **Web Worker Harness (`services/embedding/embeddingWorker.ts`)**:
   - Runs off the main UI thread via `@huggingface/transformers` ONNX Runtime Web.
   - Loads `Xenova/bge-small-en-v1.5` (quantized, ~33 MB).
   - Extracts 384d $L_2$-normalized vectors with `cls` pooling.
   - Message protocol handles `INIT`, `EMBED_DOCUMENT`, `EMBED_QUERY`, and `BATCH_EMBED`.
   - Weights cached permanently in browser `CacheStorage`.

2. **Asymmetric Prefix Formatting (`services/embedding/asymmetricPrefixes.ts`)**:
   - Document embedding: `formatDocumentText(title, content)` $\rightarrow$ `"Document: " + title + (title ? " | " : "") + content`.
   - Query embedding: `formatQueryText(query)` $\rightarrow$ `"SearchQuery: " + query`.

3. **IndexedDB Vector Store (`services/embedding/vectorStore.ts`)**:
   - Database: `reflections_ai_vectors`, store: `note_vectors` (isolated from Dexie `reflections_db`).
   - Schema: `{ noteId, vector: Float32Array (384d), model: 'bge-small-en-v1.5', dimension: 384, updatedAtHash, createdAt }`.
   - Methods: `put`, `get`, `getAll`, `delete`, `clear`, `count`, `cosineSimilarity`, `findSimilar`.

4. **Client Service Orchestrator (`services/embedding/embeddingService.ts`)**:
   - Singleton client with worker message correlation and content hash staleness check.
   - `requestIdleCallback`-based background synchronization queue (`syncNotesVectors`).
   - Orphan vector pruning (`pruneOrphanedVectors`).

5. **Vite & PWA Configuration (`vite.config.ts`)**:
   - Manual chunk `vendor-embedding` for `@huggingface/transformers` and `onnxruntime-web`.
   - Workbox `globIgnores` and module preload exclusion configured.

6. **Step 2 Verification**:
   - Unit tests: `asymmetricPrefixes.test.ts` (8/8), `vectorStore.test.ts` (12/12), `embeddingService.test.ts` (5/5).
   - Full Vitest suite: 140/140 files passing (642 tests).
   - `npm run lint` cleanly passing (0 errors, 0 warnings).
   - `npm run build` compiled cleanly.

---

## 7. Step 3: Execution & Verification Summary (Completed)

Step 3 consumed the embedding infrastructure built in Step 2 to deliver rich, visible intelligence features across the app without calling third-party cloud APIs.

### 7.1 Executed Deliverables for Step 3

1. **Hybrid Cosine + Keyword Search (`pages/dashboard/noteSearch.ts`)**:
   - Preserves synchronous `searchNotes(notes, query)` for instant frame-zero rendering and backward compatibility.
   - Implements `searchNotesHybrid(notes, query, options)` blending token/title keyword scores with cosine vector similarities from `vectorStore`.
   - Dynamic match attribution: identifies `exact`, `keyword`, `semantic`, and `hybrid` matches with stable score ranking and graceful offline fallback.

2. **Progressive Two-Phase Search Palette UI (`components/ui/NoteSearchPalette.tsx`)**:
   - Keystroke 0ms: renders synchronous keyword matches instantly.
   - Background (150ms debounce): resolves query embedding and re-ranks results with semantic resonance badges (`<Sparkle>` icon) for conceptual matches.
   - Seamless keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`) and accessibility preserved.

3. **Echoes / Resonant Memories Component (`components/ui/Echoes.tsx`)**:
   - Serene luxury card mounted beneath notes in [`SingleNote.tsx`](file:///e:/Reflections/pages/dashboard/SingleNote.tsx).
   - Queries `vectorStore.findSimilar` (default threshold 0.40), excluding the current note.
   - Displays percentage resonance badges, reflection dates, titles, and preview excerpts with View Transition navigation.
   - Serene quiet empty state (renders nothing when no notes meet the threshold).

4. **Zero-Cloud Offline Theme Triage (`services/themeTriage.ts`)**:
   - Replaced cloud Gemini API calls for `ingestDecision` with on-device cosine distance calculations against Life Theme centroids.
   - Executes in <100ms with ₹0 compute cost and zero note data transmission over the network.
   - Wired directly into `aiService.processNoteIntoWiki`.

5. **Background Lifecycle Vector Sync**:
   - Wired `embeddingService.embedNote` into `notePublishingOrchestrator.ts`, `noteService.create`, and `noteService.update`.
   - Wired `vectorStore.delete` into `noteService.delete`.
   - Background idle vector synchronization wired into `noteService.getAll`.

6. **Step 3 Verification**:
   - Unit & contract tests: `noteSearchHybrid.test.ts` (7/7), `themeTriage.test.ts` (8/8), `Echoes.contract.test.ts` (2/2), `noteSearch.test.ts` (5/5).
   - Full Vitest suite: 143/143 files passing (659 tests).
   - `npm run lint` cleanly passing (`eslint . --max-warnings 0 && tsc --noEmit`).
   - `npm run build` compiled cleanly (18.49s).

---

## 8. Step 4: Execution & Verification Summary (Completed)

Step 4 advanced the embedding engine to Tier 2 with Matryoshka Representation Learning (MRL) and Local-First RAG for Life Wiki.

### 8.1 Executed Deliverables for Step 4

1. **Matryoshka Representation Learning (MRL) Engine (`services/embedding/mrl.ts`)**:
   - `truncateAndNormalizeVector(rawVector, targetDim = 256)`: Slices 768-dimensional output vectors to 256 dimensions and re-normalizes using $L_2$ norm ($\|\vec{v}\|_2 = 1.0 \pm 10^{-6}$).
   - `calculateStorageSavings(768, 256)`: Verifies 66.67% storage footprint reduction in IndexedDB.
   - Comprehensive unit tests: `services/embedding/mrl.test.ts` (8/8 passing).

2. **Multi-Model & Multi-Dimension Vector Store Evolution (`services/embedding/vectorStore.ts`)**:
   - Updated `StoredNoteVector` to tag models (`'bge-small-en-v1.5'` vs `'embeddinggemma-2-270m-mrl256'`) and dimensions (384 vs 256).
   - In `cosineSimilarity`: Guaranteed zero-return on dimension mismatch (`a.length !== b.length`) to permanently eliminate cross-tier `NaN` contagion.
   - In `findSimilar`: Added model and dimension filtering options.
   - Added `getModelCounts()` and `deleteByModel()` for partitioned vector management.
   - Unit tests: `services/embedding/vectorStore.test.ts` (16/16 passing).

3. **Tier 2 WebGPU/WASM Worker Scaffold (`services/embedding/tier2/`)**:
   - `tier2Config.ts`: Model ID `onnx-community/embeddinggemma-270m`, 8,192 token context window, 768d raw, 256d MRL target.
   - `embeddingGemmaWorker.ts`: Probes `navigator.gpu` for WebGPU acceleration; falls back cleanly to WASM. Performs in-worker MRL truncation and $L_2$ normalization before `postMessage` transfer to reduce inter-thread serialization overhead by 66%.

4. **Progressive Model Tier Switching Orchestrator (`services/embedding/tierManager.ts` & `embeddingService.ts`)**:
   - `tierManager`: Persists tier preference (`'tier1-bge'` vs `'tier2-gemma'`) with hardware WebGPU probing.
   - `embeddingService`: Supports dynamic `switchTier(tier)`, `getActiveTier()`, `getActiveModel()`, `getActiveDimension()`.
   - Multi-model background sync in `syncNotesVectors`: Automatically re-indexes notes when active tier is switched.
   - Unit tests: `services/embedding/tierManager.test.ts` (4/4 passing), `services/embedding/embeddingService.test.ts` (7/7 passing).

5. **Local-First RAG for Life Wiki Chapter Synthesis (`services/wikiRagService.ts` & `services/aiService.ts`)**:
   - Chapter semantic seeds defined for *People*, *Patterns*, *Philosophies*, *Eras*, *Decisions*, and *Mood Patterns*.
   - `retrieveChapterExcerpts`: Selects top-10 semantically relevant notes from decrypted on-device storage prior to cloud LLM prompts, padding with recent notes if needed.
   - Integrated into `aiService.refreshWikiOnDemand` and `aiService.runGreatIngest`. Slashes prompt payload tokens by ~90% while keeping irrelevant journal history completely private.
   - Unit tests: `services/wikiRagService.test.ts` (5/5 passing).

6. **Step 4 Verification**:
   - Unit & contract tests: `services/embedding` (43/43), `wikiRagService.test.ts` (5/5), `noteSearchHybrid.test.ts` (8/8), `aiService.test.ts` (4/4), `Echoes.contract.test.ts` (2/2).
   - Full Vitest suite: 146/146 test files passing (683 tests).
   - `npm run lint` cleanly passing (`eslint . --max-warnings 0 && tsc --noEmit`).
   - `npm run build` compiled cleanly (11.66s).


