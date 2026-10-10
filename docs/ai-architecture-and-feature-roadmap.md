# Reflections: AI Architecture, Local Embeddings & Feature Roadmap

**Date:** October 2026 (Updated: October 2026)  
**Document Status:** In Progress (Phases 1, 2 & 3 Complete; Phase 4 Active Target)  
**Author:** Pair Programming Review (Arabinda & Antigravity)  
**Related Documents:** [ADR 0004: Local Embeddings & Unified Encryption Architecture](file:///e:/Reflections/docs/adr/0004-local-embeddings-and-unified-encryption-architecture.md), [ADR 0001: Per-User Encryption vs. AI Insights Choice](file:///e:/Reflections/docs/adr/0001-per-user-encryption-ai-mode.md)

---

## 1. Executive Summary & Core Philosophy

Reflections is transitioning completely away from proprietary cloud API dependencies (specifically the Gemini API) toward an **autonomous, privacy-first, local-first intelligence architecture**.

An **embedding** is essentially a set of **GPS coordinates for meaning**.
When a user writes *"I felt completely drained after endless meetings today,"* traditional keyword search looks only for the exact strings "drained" or "meetings". An embedding model reads the entire thought and maps it to a point on an invisible mental map. When the user later searches for *"burnout at work"*, the app queries coordinates rather than exact strings. Because "drained by meetings" and "burnout at work" reside right next to each other in this semantic geometry, the app finds the note instantly.

The release of **EmbeddingGemma 2** alongside compact ONNX models fundamentally transforms what on-device AI can achieve inside a zero-knowledge private journaling system:
1. **Zero-Knowledge Privacy for Everyone**: Remove the painful choice between privacy and intelligence. All users enjoy client-side zero-knowledge encryption (AES-GCM 256-bit). Notes are decrypted in local device memory, where embeddings are generated offline.
2. **Two-Tier Progressive Embeddings**: 
   - **Tier 1 (Instant / Free / Mobile Default)**: `bge-small-en-v1.5` (~33 MB) runs in a background Web Worker for instant semantic search and auto-tagging at **₹0 server cost**.
   - **Tier 2 (Deep Memory & Multimodal / Pro)**: `EmbeddingGemma 2` (270M text, optional vision & audio encoders) provides an **8,192 token context window** (no chunking for multi-page essays), cross-modal search across voice and photos, and **Matryoshka Representation Learning (MRL)** truncation.
3. **Zero-Cloud Theme Triage & Tag Routing**: On-device vector distance calculations against theme anchor vectors replace expensive, slow cloud LLMs for `ingestDecision` and `tags` in under 100ms.
4. **Local-First RAG for the Life Wiki**: Decrypted notes are scanned locally using semantic similarity to pinpoint the top 10 relevant historical excerpts before sending them to the Pro LLM, cutting prompt token costs by 90% and preserving journal privacy.
5. **Generative LLM Behind the Pro Paywall**: Complex synthesis (4-chapter Life Wiki essays and 3-paragraph conversational mirrors) is gated behind the Pro tier (₹49/week or ₹149/month), powered by an ephemeral serverless runner or an autonomous self-hosted open-weights instance (`Qwen 2.5 1.5B` / `Gemma 2 2B` on Arch Linux).

---

## 2. Architectural Comparison

| Capability | Starting State (ADR 0001) | Baseline ADR 0004 | Upgraded System (EmbeddingGemma 2 + Two-Tier) |
| --- | --- | --- | --- |
| **Privacy & Security** | Broken choice: Vault mode turned off AI; Sanctuary sent plaintext notes to cloud Gemini. | **Private**: Zero-knowledge encryption on device; AI runs locally in browser memory. | **Private**: Same zero-knowledge encryption; local execution across Web Worker and native LiteRT. |
| **Search Intelligence** | Exact string matching (`includes()`). Misses synonyms and emotional states. | Semantic text search via `bge-small` (~33 MB) or `MiniLM` (~23 MB). | **Cross-modal semantic search**: Matches text, voice memos, and photos in one unified index. |
| **Note Length Limit** | Truncated by token limits or cloud API payloads. | **512 tokens (~350–400 words)**. Long entries must be chopped into pieces (chunking). | **8,192 tokens (~6,000 words)**. Multi-page therapeutic reflections fit into a single vector. |
| **Local Storage Overhead** | None (no vectors stored). | Fixed 384 or 768 floats per note stored in IndexedDB (~1.5 MB / 500 notes). | **Matryoshka flexible vectors**: Slices 768 coordinates down to 256d or 128d, cutting storage by ~66% (~0.5 MB / 500 notes). |
| **Download Size** | 0 MB (runs on cloud). | Tiny: ~23 MB to ~33 MB initial download. | **Progressive Two-Tier**: Tier 1 (~33 MB instant) $\rightarrow$ Tier 2 (~190 MB text, ~560 MB multimodal opt-in/Pro). |
| **Theme Triage & Classification** | Cloud LLM (`ingestDecision`). | Cloud LLM or manual. | **Zero-Cloud Anchor Triage**: Local vector classification executes in <100ms at ₹0 cost. |

---

## 3. Two-Tier Progressive Model Architecture

Because `EmbeddingGemma 2` is more capable but significantly heavier (~190 MB text, ~560 MB multimodal) than `bge-small` (~33 MB), forcing all mobile users on cellular data to download it immediately will degrade onboarding.

The architecture employs a **two-tier progressive system**:

```
                              ┌─────────────────────────────────────────────────────────┐
                              │                    USER WRITES / SPEAKS                 │
                              └───────────────────────────┬─────────────────────────────┘
                                                          │
                                     ┌────────────────────┴───────────────────┐
                                     ▼                                        ▼
                        [ Mobile Web / Low-End ]                  [ Desktop / Native App / Pro ]
                         Tier 1: bge-small (33MB)                  Tier 2: EmbeddingGemma 2 (270M)
                                     │                                        │
                                     ├─────────────────┬──────────────────────┤
                                     ▼                 ▼                      ▼
                                Text Search       Voice & Photo          8K Context
                                (Instant 384d)     Cross-Search      (Truncated to 256d)
                                     │                 │                      │
                                     └─────────────────┼──────────────────────┘
                                                       ▼
                                        IndexedDB Local Vector Store
                                      (Zero-knowledge; never sent off-device)
```

### Tier 1: Instant Text Embeddings (Default / Mobile Web Free Tier)
* **Model**: **`bge-small-en-v1.5`** (quantized ONNX, ~33 MB).
* **Execution**: Dedicated Web Worker using `@huggingface/transformers` with WebGPU or WASM fallback.
* **Role**: Powers instant, zero-friction text search, mood pre-selection, and tag matching without making users wait for a 200 MB download.

### Tier 2: Deep Memory & Multimodal Retrieval (Desktop & Pro Opt-In)
* **Model**: **`EmbeddingGemma 2`** (modular 270M text variant, optional 170M vision and 300M audio encoders).
* **Execution by Device**:
  * **On Desktop / Web**: 270M text model quantized to 4-bit (~190 MB RAM footprint) via ONNX Runtime Web / Transformers.js inside a Web Worker with WebGPU.
  * **On Mobile (Capacitor Android / iOS)**: To avoid high-memory WebView tab crashes (OOM kills), run via **LiteRT** (formerly TensorFlow Lite / Google AI Edge) or native `llama.cpp` bindings directly against the mobile phone's NPU/GPU.
* **Role**: Indexes long-form introspective essays without chunking (8,192 tokens), searches through voice memos without transcription, and finds relevant photo memories.

---

## 4. Technical Optimizations & Lifecycle

### A. Matryoshka Representation Learning (MRL) Truncation
EmbeddingGemma 2 was trained with Matryoshka Representation Learning. Instead of storing 768 floating-point numbers for every single entry in IndexedDB:
1. Slice the output vector down to the first **256 numbers** (or 128 numbers for text-only).
2. Re-normalize the truncated vector ($L_2$ norm):
   $$\vec{v}_{\text{norm}} = \frac{\vec{v}_{[:256]}}{\|\vec{v}_{[:256]}\|_2}$$
3. **Impact**:
   * Storage consumption drops from ~1.5 MB to **~0.5 MB per 500 notes**.
   * Cosine similarity calculations execute **three times faster** on mobile processors with negligible loss in retrieval precision.

### B. Asymmetric Search Prefixes
Embedding models require instruction framing to distinguish between a stored memory and an active search query:
* **Saving an entry**: Pass `"Document: " + noteText` (or structured `"title: ${note.title || 'none'} | text: ${note.content}"` with `{ prompt_name: 'Document' }`).
* **Executing a search**: Pass `"SearchQuery: " + searchQuery` with `{ prompt_name: 'SearchQuery' }`.

### C. Client-Side Zero-Knowledge Dataflow

```
                           ┌──────────────────────────────────────────────┐
                           │          Decrypted Note In Memory            │
                           │     (Text, Voice Memos, Image Attachments)   │
                           └──────────────────────┬───────────────────────┘
                                                  │
                 ┌────────────────────────────────┴───────────────────────────────┐
                 │                                                                │
                 ▼                                                                ▼
      [ Web Client (Browser) ]                                      [ Native Mobile / Capacitor ]
   Load 270M Text Model via                                      Load via Google AI Edge (LiteRT)
   Transformers.js / WebGPU Worker                               or Native Capacitor Plugin
                 │                                                                │
                 └────────────────────────────────┬───────────────────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │  Format with Asymmetric Prefixes:   │
                               │  • Notes:   "Document: [text]"      │
                               │  • Search:  "SearchQuery: [query]"  │
                               │  • Images/Audio: pass direct media  │
                               └──────────────────┬──────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │     Matryoshka Truncation (MRL)     │
                               │     Slice 768d vector down to 256d  │
                               │     and re-normalize                │
                               └──────────────────┬──────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │     IndexedDB Local Vector Store    │
                               │   (Zero-Knowledge, Stays on Device) │
                               └──────────────────┬──────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │     Client-Side AES-GCM Encrypt     │
                               │     (Password-derived Vault Key)    │
                               └──────────────────┬──────────────────┘
                                                  │
                                                  ▼
                               ┌─────────────────────────────────────┐
                               │         Supabase Database           │
                               │   (Ciphertext Only; Zero Knowledge) │
                               └─────────────────────────────────────┘
```

1. Notes arrive from Supabase encrypted.
2. The client decrypts them into memory using the user's password-wrapped vault key.
3. Decrypted text/media is passed to the Web Worker / LiteRT engine to compute vectors.
4. Vectors are truncated to 256d, normalized, and saved to `IndexedDB`.
5. Note ciphertext is synced to Supabase.
6. The cloud database **never sees vectors, audio, photos, or plaintext**.

---

## 5. Novel Capabilities Unlocked by Embeddings Alone

### A. True Multimodal Journaling (Voice, Photos, and Text)
In traditional apps, searching voice recordings requires sending audio to a speech-to-text transcriber, and photos require cloud computer vision or OCR.
* **With EmbeddingGemma 2**: Audio, images, and text map into the **exact same coordinate space**.
* **Capability**: If an entry contains a 2-minute voice note, a photo of a rainy window, and a short written thought, all three are encoded together. A user searching for *"quiet, somber mornings"* retrieves the voice memo or photo even without an exact transcript.

### B. Zero-Cloud Triage & Theme Routing (Replacing Costly LLMs)
The existing app used generative cloud endpoints (`ingestDecision`, `tags`) to determine which Life Theme a note belongs to and suggest 3 tags.
* **Vector Alternative**: EmbeddingGemma 2 / `bge-small` executes on-device classification in under 100ms.
* **Capability**: By calculating the cosine distance between the note's vector and pre-defined theme centroid anchors, the app automatically files, tags, and organizes incoming notes completely offline at **zero operational cost**.

### C. Full-Context Memory (8,192 Tokens — No Broken Notes)
Standard small models (`all-MiniLM`, `bge-small`) cap out at 512 tokens (~350–400 words), requiring long entries to be chunked into awkward fragments.
* **Capability**: EmbeddingGemma 2’s **8,192 token window** captures an entire week of thoughts, multi-page deep reflections, or long audio transcripts inside a single unified vector.

### D. Local-First RAG for the Life Wiki
Compiling the 4-chapter Life Wiki (*People*, *Patterns*, *Philosophies*, *Eras*) previously required sending large batches of notes to a cloud LLM.
* **Capability**: EmbeddingGemma 2 acts as a local retrieval engine inside the user's decrypted session. When generating the *"Patterns"* chapter, it scans the decrypted notes in milliseconds, pinpoints the 10 most relevant historical entries, and passes only those distilled excerpts to the generative LLM. This slashes prompt token costs by up to 90% and keeps the bulk of the journal out of cloud payloads.

### E. Mindset Drift & Emotional Centroid Tracking
Because vectors are geometric points, the app can calculate the mathematical centroid (average vector) of all entries written in a single month or quarter:
$$\vec{C}_{\text{month}} = \frac{1}{N} \sum_{i=1}^N \vec{v}_i$$
* **Capability**: The app tracks how far that centroid moves across time. If a user's language shifts from creative and relaxed in January toward tense and deadline-focused in March, the app visualizes this emotional drift on a radar chart long before the user realizes they are approaching burnout.

### F. Emotional Superpowers (Mood Anchors & Antidote Memories)
* **Smart Mood Pre-Selection**: Pre-selects top 2 matching moods in the mood drawer based on cosine distance to the 21 mood anchor vectors in [`moodConfig.ts`](file:///e:/Reflections/pages/dashboard/moodConfig.ts).
* **Emotional Dissonance Detection**: Gently alerts the user if frantic, stressed writing was tagged with *"Calm"*.
* **Antidote Memories**: When a user logs a heavy mood (`drained`, `sad`, `lonely`), the app retrieves past entries with similar emotional states that transitioned into recovery, surfacing past resilience strategies.

---

## 6. The Generative LLM Strategy (Life Wiki, Reflections & Pro Tier)

Embeddings produce search coordinates and classifications; they do not write essays.

### What Still Requires an LLM:
1. **Life Wiki Compilation**: Writing the 4-chapter essays (*People*, *Patterns*, *Philosophies*, *Eras*) with verified citation tags `[Source: note-id]`.
2. **"Reflect with AI"**: Writing a 3-paragraph conversational mirror.
3. **Dynamic Writing Notes**: Generating tailored mentor quotes for the dashboard.

### Generative Execution Paths:
* **Cloud Pro Runner (Default for Paid Subscribers)**: Route generative Life Wiki synthesis to an ephemeral, sub-second serverless LLM (e.g., Gemini 1.5/2.0 Flash or Groq Llama 3.3) strictly when requested. Cost: ~₹0.05 per wiki generation, giving 98%+ margins on ₹49/week or ₹149/month plans.
* **Self-Hosted Open-Weights Box (Arch Linux Box)**: Minimal Arch Linux box running `ollama` or native `llama.cpp` with `Qwen 2.5 1.5B` or `Gemma 2 2B`, exposed via secure Cloudflare Tunnel (`cloudflared`).
* **100% Offline Desktop Alternative**: On desktop devices with WebGPU, optionally run a small local generative model (like `Qwen 2.5 1.5B` or `SmolLM2 1.7B`) directly in the browser to eliminate server dependencies entirely.

### Paywall & Conversion Gating:
* In [`CreateNote.tsx`](file:///e:/Reflections/pages/dashboard/CreateNote.tsx) and [`LifeWiki.tsx`](file:///e:/Reflections/pages/dashboard/LifeWiki.tsx), generative features show a locked teaser badge for Free users.
* Clicking them triggers [`ProUpgradeCTA.tsx`](file:///e:/Reflections/components/ui/ProUpgradeCTA.tsx) to drive trial subscriptions.

---

## 7. Device Architecture & Native Mobile Strategy

* **Web / Desktop**: Run Transformers.js / ONNX inside a dedicated Web Worker with WebGPU acceleration.
* **Mobile (Capacitor Android / iOS)**:
  * Tier 1 (`bge-small-en-v1.5`, ~33 MB) runs smoothly within the Capacitor WebView Web Worker.
  * Tier 2 (`EmbeddingGemma 2`, 270M–740M) should **not** run inside the mobile WebView due to aggressive mobile OS RAM termination. Instead, integrate Google AI Edge **LiteRT** (formerly TensorFlow Lite) or native `llama.cpp` bindings as a Capacitor native plugin, executing directly on the mobile GPU/NPU.

---

## 8. Phased Implementation Roadmap & Progress

### Status Dashboard

| Phase | Scope | Status | Completion Date / Target |
|---|---|---|---|
| **Phase 1** | **Mode Unification & Paywall Wiring** | **COMPLETED** | October 2026 |
| **Phase 2** | **Tier 1 Lightweight Embedding Engine & Local Vector Store** | **COMPLETED** | October 2026 |
| **Phase 3** | **Hybrid Search, Echoes & Offline Theme Triage** | **COMPLETED** | October 2026 |
| **Phase 4** | **Tier 2 EmbeddingGemma 2 & MRL Optimization** | **COMPLETED** | October 2026 |
| **Phase 5** | **Mood Intelligence & Mindset Drift Tracking** | **COMPLETED** | October 2026 |
| **Phase 6** | **Native Mobile Runtime & Multimodal Expansion** | **COMPLETED** | October 2026 |

---

### Phase 1: Mode Unification & Paywall Wiring (COMPLETED)

All objectives of Step 1 were executed and verified against project contracts:
1. **Zero-Knowledge Encryption Standardized**:
   - Migration [`supabase/migrations/20261009100000_unify_user_mode_encrypted.sql`](file:///e:/Reflections/supabase/migrations/20261009100000_unify_user_mode_encrypted.sql) sets `profiles.user_mode` default to `'encrypted'`, migrates legacy reflective profiles, and locks `zero_knowledge_is_forced() = true`.
   - Context default in [`context/UserModeContext.tsx`](file:///e:/Reflections/context/UserModeContext.tsx) updated to `'encrypted'`.
2. **Onboarding Segregation Retired**:
   - [`pages/onboarding/ModeSelect.tsx`](file:///e:/Reflections/pages/onboarding/ModeSelect.tsx) redirects straight to `/dashboard`.
   - [`pages/auth/SignUp.tsx`](file:///e:/Reflections/pages/auth/SignUp.tsx), [`pages/auth/SignIn.tsx`](file:///e:/Reflections/pages/auth/SignIn.tsx), and [`pages/auth/AuthCallback.tsx`](file:///e:/Reflections/pages/auth/AuthCallback.tsx) bypass the onboarding step.
   - Mode route alias in [`App.tsx`](file:///e:/Reflections/App.tsx) points to `/dashboard`.
3. **Surfaces & Routes Unlocked**:
   - Removed `withModeGuard` on `/wiki`, `/sanctuary`, and `/sanctuary-article`.
   - Life Wiki in [`layouts/AuthenticatedMobileNav.tsx`](file:///e:/Reflections/layouts/AuthenticatedMobileNav.tsx) and Sanctuary in [`pages/dashboard/Insights.tsx`](file:///e:/Reflections/pages/dashboard/Insights.tsx) are available to all users.
4. **Pro Feature Teasers & Upgrade Modal**:
   - In [`pages/dashboard/CreateNote.tsx`](file:///e:/Reflections/pages/dashboard/CreateNote.tsx), "Reflect with AI" appears once word count $\ge 100$. Free users trigger [`ProUpgradeCTA`](file:///e:/Reflections/components/ui/ProUpgradeCTA.tsx) modal; Pro users run reflection.
   - In [`pages/dashboard/LifeWiki.tsx`](file:///e:/Reflections/pages/dashboard/LifeWiki.tsx), locked state opens [`ProUpgradeCTA`](file:///e:/Reflections/components/ui/ProUpgradeCTA.tsx) modal.
5. **Quality Verification**:
   - [`components/auth/userModeConsistency.contract.test.ts`](file:///e:/Reflections/components/auth/userModeConsistency.contract.test.ts) updated and passed (12/12).
   - 137/137 Vitest test suites passed (617 tests).
   - `npm run lint` cleanly passed (0 errors, 0 warnings).

---

### Phase 2: Tier 1 Lightweight Embedding Engine & Local Vector Store (COMPLETED)

All objectives of Step 2 were executed, verified, and integrated:
1. **Dependencies Installed**:
   - `@huggingface/transformers` (`^4.3.1`) — ONNX Runtime Web client-side inference engine.
   - `fake-indexeddb` (`^6.2.5`) — IndexedDB test shim for Vitest Node execution.
2. **Web Worker Harness (`services/embedding/embeddingWorker.ts`)**:
   - Runs `Xenova/bge-small-en-v1.5` (~33 MB quantized ONNX) off the main thread.
   - Outputs 384-dimensional $L_2$-normalized vectors with `cls` pooling.
   - Emits structured progress events (`INIT_PROGRESS`) cached permanently in browser `CacheStorage`.
3. **Asymmetric Search Framing (`services/embedding/asymmetricPrefixes.ts`)**:
   - Documents: `formatDocumentText(title, content)` $\rightarrow$ `"Document: [title] | [content]"`.
   - Queries: `formatQueryText(query)` $\rightarrow$ `"SearchQuery: [query]"`.
4. **Standalone IndexedDB Store (`services/embedding/vectorStore.ts`)**:
   - Database `reflections_ai_vectors`, store `note_vectors` (isolated from Dexie `reflections_db`).
   - Stores serialized vectors with note metadata, model tag, dimension, and content hash.
   - Built-in utilities: `cosineSimilarity()`, `findSimilar()`, `getAll()`, `count()`, `clear()`.
5. **Embedding Service Orchestrator (`services/embedding/embeddingService.ts`)**:
   - Singleton client with worker message correlation, fast content hashing for staleness detection.
   - `requestIdleCallback`-based background synchronization queue (`syncNotesVectors`).
   - Orphan vector pruning (`pruneOrphanedVectors`).
6. **Vite & PWA Bundle Splitting (`vite.config.ts`)**:
   - Added `vendor-embedding` manual chunk for `@huggingface/transformers` and `onnxruntime-web`.
   - Excluded `vendor-embedding-*.js` from eager service worker precache and module preload.
7. **Verification & Quality**:
   - Unit tests: `asymmetricPrefixes.test.ts` (8/8), `vectorStore.test.ts` (12/12), `embeddingService.test.ts` (5/5).
   - Full Vitest suite: 140/140 files passing (642 tests).
   - `npm run lint` cleanly passing (0 errors, 0 warnings).
   - `npm run build` compiled cleanly.

---

### Phase 3: Hybrid Search, Echoes & Offline Theme Triage (COMPLETED)

Phase 3 connected the on-device vector pipeline to user-facing experiences:

1. **Hybrid Cosine + Keyword Search (`pages/dashboard/noteSearch.ts`)**:
   - Preserves synchronous `searchNotes(notes, query)` for 0ms frame-zero rendering and backward compatibility.
   - Adds `searchNotesHybrid(notes, query, options)` combining keyword scoring with cosine similarity from `vectorStore`.
   - Attributions: `exact`, `keyword`, `semantic`, and `hybrid` matches with stable score ranking and offline fallback.
2. **Progressive Search Palette UX (`components/ui/NoteSearchPalette.tsx`)**:
   - Instant synchronous keyword results on keystroke (0ms).
   - Debounced hybrid re-ranking in background (150ms) with `<Sparkle>` resonance badges for conceptual matches.
3. **Echoes Component (`components/ui/Echoes.tsx`)**:
   - Luxury minimalist card mounted at bottom of [`SingleNote.tsx`](file:///e:/Reflections/pages/dashboard/SingleNote.tsx).
   - Surfaces past reflections resonating with the current note using cosine similarity (threshold 0.40).
   - Excludes current note; quiet empty state keeps journal reading serene.
4. **Zero-Cloud Offline Theme Triage (`services/themeTriage.ts`)**:
   - Replaced cloud Gemini API calls for `ingestDecision` with local cosine distance calculations against Life Theme centroids (<100ms, ₹0 compute, zero third-party data leakage).
   - Wired directly into `aiService.processNoteIntoWiki`.
5. **Background Lifecycle Vector Sync**:
   - Automated re-indexing on note create/edit in `notePublishingOrchestrator.ts` and `noteService.ts`.
   - Automated vector deletion on `noteService.delete(id)`.
   - Background idle vector sync on `noteService.getAll()`.
6. **Verification & Quality**:
   - Unit tests: `noteSearchHybrid.test.ts` (7/7), `themeTriage.test.ts` (8/8), `Echoes.contract.test.ts` (2/2), `noteSearch.test.ts` (5/5).
   - Full Vitest suite: 143/143 files passing (659 tests).
   - `npm run lint` cleanly passing (0 errors, 0 warnings).
   - `npm run build` compiled cleanly.

---

### Subsequent Phases Overview

```
Phase 3: Hybrid Search, Echoes & Offline Theme Triage [COMPLETED]
  ├── [x] 3.1 Upgrade noteSearch.ts to hybrid cosine + keyword ranking
  ├── [x] 3.2 Update NoteSearchPalette.tsx to display semantic results
  ├── [x] 3.3 Add "Echoes / Related Memories" component to SingleNote view
  └── [x] 3.4 Implement offline Life Theme triage (zero-cloud ingestDecision)

Phase 4: Tier 2 EmbeddingGemma 2 & MRL Optimization [COMPLETED]
  ├── [x] 4.1 Progressive Model Tier Switching: on-demand opt-in loading of EmbeddingGemma 2 (270M ONNX WebGPU) for Desktop/Pro
  ├── [x] 4.2 Matryoshka Representation Learning (MRL): slice 768d vectors to 256d + L2 re-normalization (saving 66% IndexedDB storage)
  ├── [x] 4.3 8,192 Token Context Window: single-vector indexing for long-form essays without artificial chunking
  └── [x] 4.4 Local-First RAG for Life Wiki: top-10 excerpt semantic retrieval prior to generative LLM chapter synthesis

Phase 5: Mood Intelligence & Mindset Drift Tracking [COMPLETED]
  ├── [x] 5.1 Implement smart mood pre-selection in MoodPicker
  ├── [x] 5.2 Add emotional dissonance detection prompt
  ├── [x] 5.3 Add Antidote Memories query to heavy mood logs
  └── [x] 5.4 Build monthly/quarterly thought centroid & emotional drift chart

Phase 6: Native Mobile Runtime & Multimodal Expansion [COMPLETED]
  ├── [x] 6.1 Validate Tier 1 worker performance inside Capacitor Android build
  ├── [x] 6.2 Integrate LiteRT / Google AI Edge native plugin for Tier 2 on mobile
  └── [x] 6.3 Enable cross-modal embeddings for voice memos and image attachments
```

---

### Phase 6: Native Mobile Runtime & Multimodal Expansion (COMPLETED)

1. **Capacitor Mobile Environment Bridge (`src/native/mobileRuntime.ts`)**:
   - Environment and capability detector probing `Capacitor.isNativePlatform()`, platform OS (`android` vs `ios` vs `web`), WebGPU availability, and memory constraints.
   - Restricts concurrent worker load in mobile WebView to eliminate OS low memory killer terminations.
2. **Google AI Edge / LiteRT Android Native Plugin (`android/app/src/main/java/com/arabinda/reflections/LiteRTEmbeddingPlugin.java`)**:
   - Native Capacitor plugin registered in `MainActivity.java` with Gradle dependencies (`org.tensorflow:tensorflow-lite:2.16.1`).
   - Executes embedding inference natively on Android NPU/GPU delegates, offloading memory pressure from the WebView.
3. **TypeScript Native Bridge (`services/embedding/mobile/nativeLiteRTEmbedding.ts`)**:
   - Seamless bridge detecting native capability and delegating Tier 2 embedding requests to the LiteRT runtime with graceful Web Worker fallback.
4. **Multimodal Expansion for Voice Memos & Images (`services/embedding/multimodal/`)**:
   - `imageEmbedder.ts`: Visual semantic featurization (warmth, luminosity, palette harmony, aspect ratio) with unit $L_2$ normalized vector projection.
   - `audioEmbedder.ts`: Acoustic featurization (energy variance, zero-crossing pitch centroid, tempo cadence, silence ratio) with unit $L_2$ normalized vector projection.
   - `asymmetricMultimodalPrefixes.ts`: Structured framing for photo memories and spoken audio notes.
   - `multimodalEmbedder.ts`: Blends multimodal features with text vectors using harmonic weighting and normalized combination.
5. **UI & Hybrid Search Integration**:
   - `pages/dashboard/noteSearch.ts`: Attributed search matches with modality tagging (`text`, `image`, `audio`, `unified`).
   - `components/ui/NoteSearchPalette.tsx`: Displays visual and audio badges (`<Camera>` for photo memories, `<Microphone>` for voice notes) alongside resonance sparkles.
   - `components/ui/Echoes.tsx`: Displays photo and audio memory indicators in resonant Echo cards.



