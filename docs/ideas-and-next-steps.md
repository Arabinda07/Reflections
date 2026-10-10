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
   * **Tier 2 (`Embedding Gemma 2` 270M)**: Deep memory model running via WebGPU on desktop and Google LiteRT on Android mobile. Captures up to 8,000 words without chunking and compresses memory by 66% using Matryoshka Representation Learning (MRL).
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
