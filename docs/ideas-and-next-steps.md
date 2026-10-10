# Reflections: Product Ideas, Architectural Retrospective & Next Steps

**Date:** October 2026  
**Status:** Approved for Implementation  
**Product Core:** Private Journaling Sanctuary + Relationship Intelligence

---

## 1. Architectural Retrospective (Layman's Terms)

### Where We Started: The Forced Compromise
Reflections initially struggled with the classic trade-off in digital journaling:
* **Vault Mode:** Offered client-side encryption, but turned off all AI features.
* **Sanctuary Mode:** Offered AI insights, but required sending plaintext journals to cloud LLMs (Google Gemini).

### How Embedding Gemma 2 & On-Device Embeddings Solved It
1. **Unified Zero-Knowledge Standard**:
   Every user receives AES-GCM 256-bit encryption. The cloud database (`Supabase`) only ever stores ciphertext. Notes are decrypted **strictly in local device memory**.
2. **Embeddings as "GPS Coordinates for Meaning"**:
   Rather than matching exact strings (which fails when searching for "burnout" in a note about "being drained by endless meetings"), an on-device embedding model reads decrypted text in device RAM and assigns it mathematical coordinates on an invisible semantic map.
3. **Two-Tier Engine**:
   * **Tier 1 (`bge-small` ~33 MB)**: Instant semantic search, tag recommendations, and offline theme classification in <100ms at ₹0 server cost.
   * **Tier 2 (`EmbeddingGemma` 270M)**: Deep memory model via WebGPU (fp16) or WASM (q4) in a worker, MRL-truncated 768→256d. **Status (Oct 10 2026):** worker path implemented but not exposed in UI; the Android LiteRT plugin is still a hash stub and is hard-disabled (`NATIVE_LITERT_READY = false`) until a real `.tflite` model runs natively.
4. **Echoes & Antidote Memories**:
   Quietly surfaces forgotten reflections that share the same feeling or topic, or surfaces past resilience entries when the user logs a heavy mood.

---

## 2. Product Philosophy & Non-Negotiables

Reflections is **not**:
* A pure mental health or diagnostic app (no clinical depression scores, no faux-therapist bot).
* A messaging or social app (no public feeds, no chat threads).
* A streak/gamification engine (no broken streak guilt, no XP points).

Reflections **is**:
* A **writing-first sanctuary**: A calm place to write privately without distraction.
* A **relationship companion**: A tool to remember who matters, protect emotional energy, and maintain meaningful human connections without feeling like a sales CRM.
* **Human-led, not AI-dependent**: All reflection prompts are authentic and static. AI is restricted to private on-device math (vector search, resonant memory linking), never generative unsolicited chatter.

---

## 3. Vetted Ideas & Deliberate Exclusions

During our design review evaluating ideas from the wellness space (*Insight Timer, Finch, Wysa*), we made conscious design decisions:

### Accepted Enhancements (High Impact, Zero Clutter)
1. **Time-Aware Cadence in Existing Reflection Prompt**:
   Transform the existing "Today's Reflection" prompt on `/home` into a time-dependent guide (Morning intentions $\rightarrow$ Afternoon check-in $\rightarrow$ Evening decompression/gratitude) using our static prompt collection.
2. **Mindful Opening Pacing & Arrival Sound**:
   Enhance the note editor's opening transition with a smooth, unhurried visual pace and a soft arrival chime via our offline Web Audio engine (`audioEngine.ts`), inspired by Insight Timer.
3. **Journal $\leftrightarrow$ Relationship Bi-Directional Bridge**:
   Add a subtle "With [Person]" selector to the note editor toolbar, and display shared journal memories in each person's profile timeline.
4. **Relationship Boundaries**:
   Add an intentional field under relationship details: *"What boundary keeps this relationship healthy / protects my peace?"*
5. **Unified Mindset & Relational Energy in "This Month"**:
   Eliminate the separate "Mindset trajectory" card. Integrate emotional family balance and the relational energy orbit (*who brought you energy vs. who brought tension*) directly into the existing "This month" card in `/insights`.

### Deliberately Dropped Ideas (Why We Said No)
* ❌ **Mood Modal Context Chips**: Dropped because adding extra fields to the mood picker creates cognitive friction and clutters a fast, intuitive interaction.
* ❌ **Release Mode Unsent Letters**: Dropped because adding toggles and options to a cathartic release screen causes choice paralysis when a user arrives overwhelmed.
* ❌ **Future Letters Relational Tagging**: Dropped to preserve the clean, singular purpose of time-capsule letters to your future self.
* ❌ **New Cards / Dashboard Widgets**: Dropped to prevent UI bloat; all enhancements must live within existing cards.

---

## 4. Implementation Roadmap & Next Steps

### Phase 1: Editor Pacing, Prompts & AI Deprecation
* [x] Remove the "Reflect with AI" button and modal from `CreateNote.tsx`.
* [x] Categorize `DEFAULT_WELLNESS_PROMPTS` in `wellnessPrompts.ts` into Morning (5am–12pm), Afternoon (12pm–5pm), and Evening (5pm–5am) pools.
* [x] Update `HomeAuthenticated.tsx` so "Today's Reflection" selects from and refreshes within the active time pool.
* [x] Refine the opening transition in `CreateNote.tsx` with intentional pacing and a soft arrival sound via `useSound` (`playPageTurn()`).

### Phase 2: Connecting Notes to Relationships
* [x] Add `relationshipIds?: string[]` to the `Note` model in `types.ts`.
* [x] Add a subtle "With [Person]" chip selector in `CreateNote.tsx` toolbar.
* [x] When a note is saved with tagged people, update their last contact date.
* [x] In `RelationshipProfile.tsx`, surface decrypted journal notes matching that person in the existing memory section ("Shared Memories & Notes").
* [x] In `Relationships.tsx` ("Who to reach out to"), display when suggested people were recently mentioned in a journal note.

### Phase 3: Relationship Boundaries & Unified Insights
* [x] Add `boundaries?: string` to `RelationshipRecord` and add the field to "Edit details" in `RelationshipProfile.tsx`.
* [x] In `Insights.tsx`, remove the separate `<MindsetDriftCard>` section.
* [x] Weave emotional tone into "This week" and embed the mindset family balance bar + relational energy orbit directly inside "This month".
* [x] Run automated tests (`npx vitest run`: 158/158 files passed) and type check/linter (`npm run lint`: 0 errors, 0 warnings).

### Phase 4: Make the Private-Memory Promise True (Oct 10 2026 audit)
An audit found the embedding pipeline was never initialized in production (only tests called `initialize()`), so Echoes, antidote memories and semantic search silently returned nothing.
* [x] Lazy, shared-promise worker init inside `embeddingService` — every caller now works without wiring.
* [x] Reject in-flight requests on worker crash/restart (no hanging promises).
* [x] Wipe vectors + terminate worker on lock and logout (`embeddingService.reset()`); vectors are derived from plaintext and must not outlive the unlocked session.
* [x] Hard-disable the Android LiteRT stub (SHA-256 vectors).
* [x] Disable image/audio blending (no pixel/PCM input yet → constant vectors).
* [x] Model-native prefixes (BGE query instruction; Gemma `title: | text:` / `task: search result | query:`), with `EMBED_FORMAT_VERSION` forcing a re-embed of old vectors.
* [x] Echoes stores on-the-fly vectors with the note's real `updatedAt` (no re-embed churn).
* [ ] Encrypt vectors at rest with the session data key (removes the full re-embed after each unlock).
* [x] Remove dead Gemini code (`api/ai.ts`, `api/ai-runs.ts`, `@google/genai`, unused `aiService` functions); replace `suggestTags` with local nearest-tag lookup.
* [x] Keep the Life Wiki page and stored pages with refreshes unplugged (`aiRunClient` stub).
* [ ] Build Life Wiki pages on-device (extractive: cluster notes by embedding, quote the user's own sentences with note links).
* [ ] Quiet Paper UI pass: filled primary buttons on auth/unlock, hide nav behind the unlock veil, Home "Desk", blank-page-first editor, Insights a11y.
* [ ] Real on-device EmbeddingGemma on Android (only if Tier 1 proves insufficient).
