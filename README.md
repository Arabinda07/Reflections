# 🌿 Reflections

> A calm, AI-powered journaling sanctuary for mental clarity and self-understanding.
> No streaks. No pressure. No optimisation loops.
> Just a quiet space to think, write, and understand yourself — and an AI that remembers everything you write.

---

## Table of Contents

1. [What Reflections Is](#1-what-reflections-is)
2. [The Core Philosophy](#2-the-core-philosophy)
3. [Feature Overview](#3-feature-overview)
4. [Tech Stack](#4-tech-stack)
5. [Architecture Overview](#5-architecture-overview)
6. [The LLM Wiki System](#6-the-llm-wiki-system)
7. [Database Schema](#7-database-schema)
8. [Service Layer](#8-service-layer)
9. [Gemini AI Integration](#9-gemini-ai-integration)
10. [Project Structure](#10-project-structure)
11. [Environment Variables](#11-environment-variables)
12. [Local Development Setup — Step by Step](#12-local-development-setup--step-by-step)
13. [Supabase Setup — Step by Step](#13-supabase-setup--step-by-step)
14. [Running the App](#14-running-the-app)
15. [Freemium Limits & Plan Logic](#15-freemium-limits--plan-logic)
16. [Storage Architecture](#16-storage-architecture)
17. [Authentication Flow](#17-authentication-flow)
18. [AI Call Budget](#18-ai-call-budget)
19. [Roadmap](#19-roadmap)
20. [Author](#20-author)
21. [License](#21-license)

---

## 1. What Reflections Is

Reflections is a journaling application. Users write long-form entries about their thoughts, emotions, and experiences. The app stores these entries securely, helps users track their mood over time, and uses AI to generate personalised reflections and insights.

What makes Reflections different from a standard journaling app is the **LLM Wiki system** — a persistent, compounding knowledge base that the AI builds and maintains *per user*, automatically, in the background. Every time a user saves a journal entry, the AI reads it, identifies the life themes it touches, and updates a private structured wiki for that user. Over time, this wiki becomes a rich, interconnected picture of who the user is — their patterns, their recurring concerns, their emotional landscape, their timeline of growth.

When a user requests an AI reflection on a new entry, Gemini does not start from scratch. It reads the user's compiled wiki first. The reflection it returns is therefore personal, contextual, and specific — not generic. It references patterns the user has established over months of writing. It notices when something contradicts a previous belief. It asks questions that are informed by everything the user has shared before.

This is the central architectural bet of the application: **compiled context beats retrieval every time.**

---

## 2. The Core Philosophy

### No streaks, no pressure

Reflections deliberately avoids gamification mechanics — no streak counters, no "you haven't journaled in 3 days" nudges, no progress badges. These mechanisms turn a contemplative practice into a performance. The app is a sanctuary, not a productivity tool.

### Privacy first

Users' journal entries are stored with Supabase Row Level Security (RLS). No entry is ever accessible to any other user or to any administrator. The AI processes entries ephemerally — Gemini is called with the entry content, returns a response, and the content is not retained by Google for training. The wiki is stored only in the user's own Supabase rows.

### User-triggered AI

The AI never fires automatically in a way the user doesn't initiate. The wiki ingest is triggered by the user pressing Save on a note. The reflection is triggered by the user pressing "AI Reflect." The wiki refresh is triggered by the user pressing "Refresh Insights." The AI is a tool the user reaches for, not a system that watches them.

### Simplicity over complexity

Every feature exists because journaling is better with it. If removing it wouldn't make the app worse for a user trying to process their thoughts, it doesn't belong.

---

## 3. Feature Overview

### Writing
- **Rich text editor** built on Quill.js with full formatting support
- **Focus mode** — the UI fades away when the user is typing, restoring on mouse movement or keypress
- **Whisper mode** — voice-to-text transcription using the Web Speech API, so users can speak entries directly into the editor
- **Mood tracking** — six mood states (happy, calm, anxious, sad, angry, tired) attached to each entry
- **Tags** — user-defined tags for filtering and organising entries, with AI-suggested tags based on entry content
- **Cover images** — users can attach a cover image to each entry
- **File attachments** — any file type can be attached to an entry, stored in Supabase Storage
- **Tasks** — inline actionable task lists within each entry, with completion state that persists

### AI Features
- **Dynamic journaling prompts** — context-aware prompts generated from the user's last 3 entries, shown in the editor as cycling suggestions
- **AI Reflection** — a personalised reflection on the current entry, informed by the user's full wiki context
- **LLM Wiki** — an automatically maintained personal knowledge base, described in full in Section 6
- **AI tag suggestions** — 3 relevant tags suggested for each entry based on its content
- **Refresh Insights** — user-triggered rebuild of the 4 structured wiki pages from all accumulated themes

### Insights Dashboard
- Monthly note count, writing rhythm (unique days), prevalent mood, task completion rate
- Mood frequency bar chart
- Tag mind map (weighted by frequency)
- Life wiki viewer — the user's personal wiki displayed as browsable cards with a full-page detail modal

### Ambient Features
- **Ambient audio** — 4 generative sound environments (Rain, Forest, White Noise, Fireplace) that play while the user writes, with waveform animations
- **Ambient music button** — a floating persistent music control accessible from the home screen
- **Breathing exercises** — a guided breathing animation available from the editor

### Calendar View
- Monthly calendar with mood icons plotted on the days entries were written
- Click any day to see all entries from that date in a side panel

### Account Management
- Full name, display name, timezone
- Avatar upload stored in Supabase Storage
- Password reset via email
- Account deletion — wipes all notes, themes, citations, and profile data permanently

---

## 4. Tech Stack

| Layer | Technology | Why |
|---|---|---|
| **Frontend** | React 19 + TypeScript + Vite | Type safety, fast builds, modern React features |
| **Styling** | Tailwind CSS | Utility-first, consistent design tokens |
| **Animations** | Motion (Framer Motion v11) | Declarative, performant animations |
| **Backend** | Supabase (PostgreSQL) | Managed Postgres with RLS, Auth, Storage, and Realtime |
| **Auth** | Supabase Auth | Email/password + Google OAuth |
| **Storage** | Supabase Storage | File uploads behind signed URLs |
| **AI** | Google Gemini 2.5 Flash | Fast, cost-efficient, handles long context well |
| **Editor** | Quill.js | Rich text editing with good HTML output |
| **Charts** | Recharts | React-native charting |
| **3D / Landing** | Spline | Interactive 3D on the FAQ/landing page |
| **Audio** | Web Audio API | Browser-native ambient sound synthesis |
| **Router** | React Router v6 | Client-side routing |

---

## 5. Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser / Client                     │
│                                                             │
│  React 19 + TypeScript + Vite                               │
│  Pages: Home, CreateNote, MyNotes, Insights, Account, FAQ  │
│  Components: Editor, StorageImage, AmbientAudio, etc.      │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  noteService │  │  wikiService │  │    aiService     │  │
│  │  (CRUD notes)│  │ (wiki CRUD)  │  │ (Gemini calls)   │  │
│  └──────┬───────┘  └──────┬───────┘  └────────┬─────────┘  │
└─────────┼─────────────────┼──────────────────┼─────────────┘
          │                 │                   │
          ▼                 ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                        Supabase                             │
│                                                             │
│  PostgreSQL                                                 │
│  ├── auth.users        (managed by Supabase Auth)          │
│  ├── public.profiles   (name, avatar, plan)                │
│  ├── public.notes      (journal entries)                   │
│  ├── public.life_themes (wiki pages — both freeform        │
│  │                       and structured, by page_type)     │
│  └── public.theme_citations (note → theme links)          │
│                                                             │
│  Storage                                                    │
│  └── app-files/        (avatars, note covers, attachments) │
│                                                             │
│  Row Level Security enforced on every table                 │
└─────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                    Google Gemini API                         │
│                    (gemini-2.5-flash)                       │
│                                                             │
│  All calls made from the browser via @google/genai SDK.     │
│  No server-side proxy. API key set in environment.         │
└─────────────────────────────────────────────────────────────┘
```

### Key architectural decisions

**Client-side Gemini calls.** The AI SDK is called directly from the browser. This avoids the need for a backend server or Edge Functions. The tradeoff is that the API key is in the client environment — this is acceptable for a free-tier application where the key is the developer's own, and where the app's primary users are trusted. For production at scale, this would move to a Supabase Edge Function or a serverless proxy.

**Supabase as the only backend.** There is no Node.js server, no Express API, no custom backend. Supabase handles auth, database, and storage. All database access goes through the Supabase JS client with RLS enforcing ownership. This means zero infrastructure to manage.

**The wiki lives in the same table as freeform themes.** The `life_themes` table holds both user-created freeform themes and AI-maintained structured wiki pages. They are distinguished by the `page_type` column. This was a deliberate decision to avoid schema complexity — one table, one set of RLS policies, one query path.

---

## 6. The LLM Wiki System

This section explains the most important and novel feature in the application.

### The problem with standard AI journaling assistants

Most AI journaling apps work like this: the user writes an entry, presses a button, and the AI reads that one entry and returns a reflection. This is called a **stateless interaction**. The AI has no memory of what the user wrote last week, last month, or last year. Every reflection starts cold. The AI cannot tell the user that they have been writing about the same fear for six months. It cannot notice that their mood has shifted. It cannot reference what they said in a previous entry without being explicitly shown it.

Some apps solve this with RAG (Retrieval-Augmented Generation) — they store embeddings of all previous entries and retrieve the most relevant chunks when the user asks a question. This is better, but it has a ceiling. The AI is still re-reading raw fragments of the user's past writing and re-deriving insights from scratch every time. The insights are not accumulated. The connections are not built up. The AI never actually *learns* the user.

### The wiki approach

Reflections uses a different model, inspired by the LLM Wiki pattern. Instead of retrieving raw entries, the AI **incrementally builds and maintains a persistent personal wiki** for each user. This wiki is not raw entries — it is a synthesised, structured, human-readable knowledge base about the user, compiled and maintained by the AI.

The wiki is the compiled output of everything the user has written. It captures patterns, not events. It captures recurring themes, not individual mentions. It tracks how the user's thinking has evolved over time. It is the AI's model of the user, and it gets richer with every entry saved.

When the user asks for a reflection, Gemini reads the wiki, not the raw entries. The wiki is short (a few KB per page). The reflection is therefore fast, cheap, and deeply contextual.

### Wiki structure

Each user has exactly one instance of each structured wiki page, stored as rows in `public.life_themes` with a specific `page_type` value:

| page_type | Title | Purpose |
|---|---|---|
| `index` | Wiki Index | One-liner summary of every other page. Gemini reads this first on every query. It is the table of contents. |
| `mood_patterns` | Mood Patterns | Recurring emotional states, triggers, and how they shift over time. |
| `recurring_themes` | Recurring Themes | Topics, concerns, and subjects the user keeps returning to across entries. |
| `self_model` | Self Model | How the user describes themselves — their values, beliefs, and self-perception, including contradictions. |
| `timeline` | Timeline | Key moments, turning points, and significant events, listed chronologically. |
| `theme` | (user-created) | Freeform life theme pages that the AI creates based on individual journal entries. These are the most granular layer of the wiki. |

The `index` page is rebuilt after every ingest and after every full wiki refresh. It is the cheapest and most important page — it is what allows Gemini to navigate the wiki without reading every page in full.

### How the wiki grows — the Ingest Flow

This is triggered every time the user saves a journal entry (presses the Save button).

**Step 1 — Decision (1 Gemini call)**

The AI reads the new entry and the list of all existing freeform themes (title + ID only). It decides:
- `append` — this entry should be integrated into an existing theme
- `create` — this entry introduces a new theme that doesn't exist yet
- `skip` — this entry is entirely mundane and contains no personal insight worth filing

The decision is returned as JSON. If `skip`, the flow ends.

**Step 2 — Synthesis (1 Gemini call)**

The AI reads the full content of the target theme (or starts fresh for a new theme). It rewrites the theme's markdown to integrate the new entry's insights. If the new entry contradicts something already in the theme, the contradiction is named explicitly (e.g. "Earlier they felt X → Now they believe Y"). The theme stays under 400 words.

The updated theme content is written back to `life_themes`. A `theme_citations` row is created linking this note to this theme.

**Step 3 — Index rebuild (1 Gemini call)**

The AI reads the first 500 characters of every wiki page (freeform themes + structured pages), and writes a new one-liner summary for each. The `index` page is updated.

Total: **3 Gemini calls per save.** The user never waits for this — it runs as a fire-and-forget background process after the save animation completes.

### How the wiki is read — the Reflection Flow

This is triggered when the user presses "AI Reflect" on an entry they have written at least 100 words in.

**Step 1 — Context assembly (0 Gemini calls)**

The service fetches all structured wiki pages (`mood_patterns`, `recurring_themes`, `self_model`, `timeline`) and the `index` page from Supabase. This is a single DB query.

**Step 2 — Enriched reflection (1 Gemini call)**

Gemini receives:
- The full structured wiki context (the user's compiled profile)
- The current entry being written

It returns a 3–4 paragraph reflection that is personal, specific, and informed by the user's history. If no wiki exists yet (first-time user), Gemini responds warmly to the entry alone.

Total: **1 Gemini call per reflection request.**

### How the wiki is refreshed — the Refresh Flow

This is triggered when the user presses the "Refresh Insights" button on the Insights page. It is not automatic. Recommended frequency: every 5–10 new entries.

**Step 1 — Rebuild all 4 structured pages (4 Gemini calls)**

Gemini reads all freeform themes and synthesises each structured page from scratch. Each page is kept under 300 words. Pages are written in sequence (not parallel) to avoid rate limits.

**Step 2 — Index rebuild (1 Gemini call)**

Same as in the ingest flow.

Total: **5 Gemini calls per refresh.** User-initiated only.

### Why this is Supabase-efficient

Standard AI personalisation approaches use pgvector — storing 1,536-dimensional float arrays for every entry chunk. On a 500MB free tier, this kills available space quickly.

The wiki approach uses text. Each wiki page is approximately 300–600 words. A user with a fully populated wiki has 6 pages at roughly 4KB total. For 1,000 users, the total wiki storage is approximately 4MB. The raw entries (long-form text) are the actual space cost, not the AI-generated pages.

**No vector embeddings. No pgvector. No external search index. Just text rows in a standard Postgres table.**

---

## 7. Database Schema

The full schema is in `supabase_setup.sql`. This section explains every table and every design decision.

### `public.profiles`

Stores metadata about each user that supplements the Supabase `auth.users` record.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. References `auth.users(id)`. Cascades on delete. |
| `full_name` | `text` | User's display name, populated from OAuth metadata on signup. |
| `avatar_url` | `text` | Storage path to the user's avatar image in `app-files/`. |
| `plan` | `text` | `'free'` or `'pro'`. Defaults to `'free'`. |
| `updated_at` | `timestamptz` | Last update timestamp. |

**RLS Policies:**
- `SELECT`: Users can only read their own profile row.
- `INSERT`: Users can only insert a row where `id = auth.uid()`.
- `UPDATE`: Users can only update their own row.

A trigger (`on_auth_user_created`) automatically creates a `profiles` row when a new user signs up, copying `full_name` and `avatar_url` from Supabase Auth metadata.

### `public.notes`

The central table. One row per journal entry.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. Auto-generated. |
| `user_id` | `uuid` | Foreign key to `auth.users(id)`. Cascades on delete. |
| `title` | `text` | Entry title. Can be empty. |
| `content` | `text` | Rich text content as HTML (Quill.js output). |
| `mood` | `text` | One of: `happy`, `calm`, `anxious`, `sad`, `angry`, `tired`. Nullable. |
| `thumbnail_url` | `text` | Storage path to the cover image. Nullable. |
| `tags` | `text[]` | Array of user-defined tag strings. Defaults to `{}`. |
| `attachments` | `jsonb` | Array of attachment objects: `{name, path, size, type, id}`. |
| `tasks` | `jsonb` | Array of task objects: `{id, text, completed, dueDate?}`. |
| `created_at` | `timestamptz` | Auto-set on insert. |
| `updated_at` | `timestamptz` | Auto-set on insert, manually updated on save. |

**RLS Policies:** Full CRUD, all scoped to `user_id = auth.uid()`.

**Trigger:** `tr_enforce_note_limit` fires before insert. It counts the user's notes in the current calendar month. If the count is 30 or more, it raises `FREE_LIMIT_REACHED`. This is server-side enforcement — it cannot be bypassed by calling the API directly.

**Indexes:**
- `idx_notes_user_id` on `(user_id)` — speeds up all user-scoped queries
- `idx_notes_user_created` on `(user_id, created_at DESC)` — speeds up recency-ordered fetches

### `public.life_themes`

Stores both freeform user-created life themes and AI-maintained structured wiki pages. These are distinguished by `page_type`.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. Auto-generated. |
| `user_id` | `uuid` | Foreign key to `auth.users(id)`. Cascades on delete. |
| `title` | `text` | Human-readable title of the page. |
| `content` | `text` | Full markdown content of the page. The AI writes and overwrites this. |
| `state` | `text` | `active`, `archived`, or `resolved`. Defaults to `active`. |
| `page_type` | `text` | Distinguishes wiki page types. See table below. |
| `created_at` | `timestamptz` | Auto-set on insert. |
| `updated_at` | `timestamptz` | Auto-updated via trigger on every UPDATE. |

**`page_type` values:**

| Value | Written by | Meaning |
|---|---|---|
| `theme` | AI (ingest flow) | A freeform life theme page created and maintained by the AI. This is the most common type. |
| `mood_patterns` | AI (refresh flow) | Compiled emotional patterns. One row per user, max. |
| `recurring_themes` | AI (refresh flow) | Compiled topic recurrences. One row per user, max. |
| `self_model` | AI (refresh flow) | Compiled self-description. One row per user, max. |
| `timeline` | AI (refresh flow) | Compiled chronological milestones. One row per user, max. |
| `index` | AI (ingest + refresh) | One-liner summaries of all pages. One row per user, max. |

**RLS Policies:** Full CRUD, all scoped to `user_id = auth.uid()`.

**Trigger:** `set_timestamp_life_themes` fires before every UPDATE to keep `updated_at` current.

**Indexes:**
- `idx_life_themes_user_id` on `(user_id)`
- `idx_life_themes_user_type` on `(user_id, page_type)` — used when fetching a specific page type (e.g. `getWikiPage('mood_patterns')`)

### `public.theme_citations`

A junction table linking notes to the themes they contributed to.

| Column | Type | Description |
|---|---|---|
| `id` | `uuid` | Primary key. Auto-generated. |
| `theme_id` | `uuid` | Foreign key to `life_themes(id)`. Cascades on delete. |
| `note_id` | `uuid` | Foreign key to `notes(id)`. Cascades on delete. |
| `created_at` | `timestamptz` | Auto-set on insert. |

Note: `user_id` was intentionally removed from this table. Ownership is enforced via RLS by joining to `life_themes.user_id`. This avoids data redundancy and potential inconsistency.

**UNIQUE constraint** on `(theme_id, note_id)` — prevents duplicate citations.

**RLS Policies:** All operations require that the `theme_id` references a `life_themes` row owned by `auth.uid()`. This is verified via a subquery in each policy.

**Indexes:**
- `idx_theme_citations_theme_id` on `(theme_id)`
- `idx_theme_citations_note_id` on `(note_id)`

### Utility Functions

**`public.delete_user_data()`**
Called when a user deletes their account. Deletes in order: all `theme_citations` belonging to the user's themes, all `life_themes` rows, all `notes` rows, the `profiles` row. Defined with `SECURITY DEFINER` so it runs with elevated permissions.

**`public.handle_new_user()`**
Trigger function on `auth.users`. Fires after every new signup. Inserts a `profiles` row, copying `full_name` and `avatar_url` from `raw_user_meta_data`.

**`public.enforce_note_limit()`**
Trigger function on `notes`. Fires before every INSERT. Counts notes for the inserting user in the current month. Raises an exception if the count is 30 or above.

**`public.trigger_set_timestamp()`**
Generic trigger function used on `life_themes`. Sets `updated_at = now()` on every UPDATE.

---

## 8. Service Layer

All Supabase and Gemini interactions are encapsulated in service files under `services/`. Components never import from `supabase` directly — they use services.

### `noteService.ts`
CRUD operations for the `notes` table.
- `getAll()` — all notes for the current user, ordered by `updated_at` desc
- `getById(id)` — single note by ID, RLS-enforced
- `getRecent(n)` — last `n` notes ordered by `created_at` desc
- `getCount()` — total note count for the current user
- `getMonthlyCount()` — note count for the current calendar month
- `create(data)` — insert a new note row
- `update(id, data)` — update a note row, scoped to the current user
- `delete(id)` — soft-delete pattern with 5-second undo window

### `wikiService.ts`
CRUD operations for the `life_themes` and `theme_citations` tables.
- `getUserThemes()` — all active freeform themes (`page_type = 'theme'`)
- `getAllThemes()` — all active rows regardless of page_type (used by UI)
- `getThemeById(id)` — single theme by ID
- `createTheme(title, content)` — insert a new freeform theme
- `updateThemeContent(id, content)` — overwrite content of any theme
- `getWikiPage(pageType)` — fetch a single structured wiki page by type
- `getAllWikiPages()` — fetch all structured wiki pages (excludes freeform themes)
- `upsertWikiPage(pageType, title, content)` — create or update a structured wiki page
- `addCitation(themeId, noteId)` — link a note to a theme
- `getThemeSources(themeId)` — all notes that contributed to a theme

### `aiService.ts`
All Gemini interactions.
- `processNoteIntoWiki(note)` — ingest flow (decision + synthesis + index rebuild)
- `generateReflection(note)` — enriched reflection using wiki context
- `refreshWikiSummaries()` — rebuild all 4 structured pages + index
- `_rebuildIndex()` — internal, called after ingest and refresh

### `storageService.ts`
Supabase Storage operations.
- `uploadFile(file, userId, type, noteId)` — upload to `app-files/{userId}/...`
- `getSignedUrl(path)` — generate a time-limited signed URL for a file
- `deleteFile(path)` — remove a file from storage

### `observationService.ts`
Milestone detection. Checks for significant moments (first note, 10th note, writing streaks) and returns a short celebratory message to display as the `CompanionObservation` card.

### `wellnessPrompts.ts`
Manages the cycling of journaling prompt suggestions in the editor. Handles both default prompts and dynamically generated ones from Gemini.

---

## 9. Gemini AI Integration

### Model
All calls use `gemini-2.5-flash`. This model is fast, handles long context well, and is cost-efficient on the free tier.

### SDK
`@google/genai` (the official Google Generative AI JS SDK). Imported from `aiService.ts` only. No other file makes Gemini calls except `CreateNote.tsx` for the dynamic prompt and tag suggestion features.

### Key call sites

| Function | File | Purpose | Structured output? |
|---|---|---|---|
| `processNoteIntoWiki` (decision) | `aiService.ts` | Decide: append / create / skip | Yes — JSON object |
| `processNoteIntoWiki` (synthesis) | `aiService.ts` | Rewrite wiki page markdown | No — raw markdown |
| `_rebuildIndex` | `aiService.ts` | Rebuild index bullet list | No — raw markdown |
| `generateReflection` | `aiService.ts` | Personal reflection paragraph | No — prose |
| `refreshWikiSummaries` (×4) | `aiService.ts` | Rebuild 4 structured pages | No — raw markdown |
| `generateDynamicPrompts` | `CreateNote.tsx` | Generate 4 contextual journaling prompts | Yes — JSON array |
| `generateSuggestedTags` | `CreateNote.tsx` | Suggest 3 tags | Yes — JSON array |
| `handleAiReflect` (deprecated) | `CreateNote.tsx` | Now proxied through `aiService.generateReflection` | No |

### Error handling
All Gemini calls are wrapped in try/catch. Wiki ingest failures are suppressed (logged to console) to prevent breaking the save flow. Reflection failures return a fallback message. Structured JSON responses are cleaned of markdown fences before parsing.

---

## 10. Project Structure

```
Reflections/
│
├── pages/                         Route-level page components
│   ├── NotFound.tsx
│   ├── auth/
│   │   ├── SignIn.tsx
│   │   └── SignUp.tsx
│   └── dashboard/
│       ├── Account.tsx            User account settings
│       ├── Calendar.css           Styles for react-calendar
│       ├── CreateNote.tsx         Main note editor — the heart of the app
│       ├── FAQ.tsx                Landing / how-it-works page (with Spline)
│       ├── Home.tsx               Authenticated home + Landing for guests
│       ├── Insights.tsx           Stats, mood charts, wiki viewer
│       ├── Landing.tsx            Public landing page with video hero
│       ├── MyNotes.tsx            Note grid + calendar view
│       ├── PrivacyPolicy.tsx
│       └── SingleNote.tsx         Read-only single note view
│
├── components/
│   └── ui/
│       ├── AmbientMusicButton.tsx  Floating persistent music control
│       ├── Button.tsx
│       ├── CompanionObservation.tsx Milestone card overlay
│       ├── Editor.tsx              Quill.js wrapper
│       ├── Input.tsx
│       ├── LoadingState.tsx        Sanctuary loader with Lottie
│       ├── PaperPlaneToast.tsx     Save animation
│       └── StorageImage.tsx        Image loader with signed URL handling
│
├── services/
│   ├── aiService.ts               All Gemini interactions
│   ├── noteService.ts             Notes CRUD
│   ├── observationService.ts      Milestone detection
│   ├── storageService.ts          Supabase Storage
│   ├── wellnessPrompts.ts         Prompt cycling logic
│   └── wikiService.ts             Wiki CRUD (life_themes + citations)
│
├── context/
│   ├── AuthContext.tsx             Global auth state
│   └── PWAInstallContext.tsx       PWA install prompt state
│
├── hooks/
│   └── useAmbientAudio.ts         Shared ambient audio state + crossfade
│
├── src/
│   └── supabaseClient.ts          Supabase JS client singleton
│
├── types.ts                       All TypeScript interfaces and enums
├── supabase_setup.sql             Full database schema + RLS + triggers
├── WIKI_SCHEMA.md                 AI librarian instructions (see below)
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 11. Environment Variables

Create a `.env.local` file at the project root. This file must never be committed to version control.

```env
# Supabase — get these from your Supabase project Settings → API
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# Google Gemini — get this from https://aistudio.google.com/app/apikey
VITE_GEMINI_API_KEY=your-gemini-api-key-here
```

**Why `VITE_` prefix?** Vite only exposes environment variables prefixed with `VITE_` to the browser bundle. Variables without this prefix remain server-side only. Since this app has no server, all variables must be prefixed.

**Security note:** The Supabase anon key is safe to expose in the browser — it is a public key designed for client-side use. Row Level Security enforces data isolation. The Gemini API key is also used client-side. For production deployments with real billing, consider proxying Gemini calls through a Supabase Edge Function to keep the key server-side.

---

## 12. Local Development Setup — Step by Step

This section walks through every step required to run Reflections locally from a blank machine.

### Step 1: Install Node.js

Reflections requires Node.js version 20 or higher.

1. Go to https://nodejs.org
2. Download the **LTS** version (20.x or higher)
3. Run the installer and follow the prompts
4. Open a terminal and verify: `node --version` — should print `v20.x.x` or higher

### Step 2: Clone the repository

```bash
git clone https://github.com/Arabinda07/Reflections.git
cd Reflections
```

### Step 3: Install dependencies

```bash
npm install
```

This installs all packages listed in `package.json`, including React, Vite, Tailwind, Supabase JS client, Framer Motion, Quill, and the Google GenAI SDK.

If you see peer dependency warnings, they are safe to ignore. If you see errors, check that your Node version is 20+.

### Step 4: Create the environment file

In the project root, create a new file called `.env.local`. Do not name it `.env` — Vite prioritises `.env.local` for local development and it is git-ignored by default.

```bash
touch .env.local
```

Open it in your editor and add the three variables from Section 11. You will fill in the values in the next steps.

### Step 5: Get your Gemini API key

1. Go to https://aistudio.google.com/app/apikey
2. Sign in with a Google account
3. Click **Create API key**
4. Copy the key and paste it as the value of `VITE_GEMINI_API_KEY` in `.env.local`

The free tier of Gemini API is generous — you do not need billing enabled for development.

### Step 6: Set up Supabase

See Section 13 for the complete Supabase setup walkthrough. Once complete, you will have a `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to add to `.env.local`.

### Step 7: Verify your `.env.local`

At this point your file should look like this (with real values):

```env
VITE_SUPABASE_URL=https://abcdefghij.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_GEMINI_API_KEY=AIzaSy...
```

### Step 8: Run the development server

```bash
npm run dev
```

Vite will start a local server. You will see output like:

```
  VITE v5.x.x  ready in 300 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Open http://localhost:5173 in your browser. You should see the Reflections landing page.

---

## 13. Supabase Setup — Step by Step

### Step 1: Create a Supabase account

1. Go to https://supabase.com
2. Click **Start your project**
3. Sign up with GitHub or email

### Step 2: Create a new project

1. From the Supabase dashboard, click **New project**
2. Choose an organisation (create one if this is your first project)
3. Set a project name: `reflections` (or anything you prefer)
4. Set a strong database password — save this somewhere safe
5. Choose a region closest to your users
6. Click **Create new project**
7. Wait approximately 2 minutes for the project to provision

### Step 3: Get your API credentials

1. In the left sidebar, click the gear icon (**Settings**)
2. Click **API** in the settings menu
3. Find the **Project URL** — this is your `VITE_SUPABASE_URL`
4. Find the **anon public** key under **Project API keys** — this is your `VITE_SUPABASE_ANON_KEY`
5. Copy both values into your `.env.local` file

### Step 4: Run the database schema

1. In the left sidebar, click the SQL editor icon (looks like `>_`)
2. Click **New query**
3. Open `supabase_setup.sql` from this project in your text editor
4. Copy the entire contents
5. Paste it into the Supabase SQL editor
6. Click **Run** (or press Cmd+Enter / Ctrl+Enter)
7. You should see `Success. No rows returned` — this means all tables, triggers, functions, and RLS policies were created

### Step 5: Verify the schema was created

1. In the left sidebar, click the table icon (**Table Editor**)
2. You should see four tables listed: `profiles`, `notes`, `life_themes`, `theme_citations`
3. Click each table to confirm the columns match Section 7

### Step 6: Create the Storage bucket

1. In the left sidebar, click the box icon (**Storage**)
2. Click **New bucket**
3. Name it exactly: `app-files` (case-sensitive — the app refers to this exact name)
4. Leave **Public bucket** unchecked — this keeps all files private
5. Click **Save**

### Step 7: Apply the Storage RLS policies

1. In the left sidebar, click **SQL Editor**
2. Create a new query
3. Run the storage policy block from `supabase_setup.sql` (the section that starts with `create policy "Users can view own files"`)
4. Click Run — you should see success

### Step 8: Enable Google OAuth (optional)

If you want Google sign-in to work:

1. In the Supabase dashboard, go to **Authentication** → **Providers**
2. Find **Google** and toggle it on
3. You will need a Google OAuth Client ID and Secret
4. Go to https://console.cloud.google.com
5. Create a new project (or use an existing one)
6. Go to **APIs & Services** → **Credentials**
7. Click **Create Credentials** → **OAuth client ID**
8. Choose **Web application**
9. Under **Authorised redirect URIs**, add: `https://your-project-ref.supabase.co/auth/v1/callback`
10. Copy the Client ID and Client Secret
11. Paste them into the Supabase Google provider settings
12. Click **Save**

Email/password auth works without any extra configuration.

### Step 9: Configure the Auth email redirect URL (production)

If you are deploying to a custom domain:

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production domain (e.g. `https://reflections.app`)
3. Add your domain to **Redirect URLs**

For local development, `http://localhost:5173` is allowed by default.

---

## 14. Running the App

### Development

```bash
npm run dev
```

Starts the Vite dev server with hot module replacement. Changes to any file reload instantly.

### Production build

```bash
npm run build
```

Outputs a production bundle to `dist/`. This can be deployed to Vercel, Netlify, Cloudflare Pages, or any static hosting.

### Preview the production build locally

```bash
npm run preview
```

Serves the `dist/` folder locally at http://localhost:4173. Useful for testing the production build before deploying.

### Lint

```bash
npm run lint
```

Runs ESLint over the TypeScript files.

### Tests

```bash
npm test
```

---

## 15. Freemium Limits & Plan Logic

### Free tier limits

- **30 notes per calendar month.** Enforced server-side by the `enforce_note_limit` trigger. If the limit is reached, the trigger raises `FREE_LIMIT_REACHED`. The client catches this error and shows the upgrade overlay.
- All wiki features (ingest, reflection, refresh) are available on the free tier.

### Plan field

The `plan` column on `profiles` is `'free'` by default. It can be set to `'pro'` manually or via a future Stripe webhook. The front-end reads `is_pro` from `user_metadata` (set via `supabase.auth.updateUser`). Currently the Stripe integration is a placeholder.

### Checking the limit client-side

`noteService.getMonthlyCount()` returns the user's note count for the current month. This is checked on the `CreateNote` page load — if already at 30, the limit overlay is shown immediately before the user types anything.

---

## 16. Storage Architecture

All files are stored in the `app-files` Supabase Storage bucket. Files are organised by user ID:

```
app-files/
└── {user-id}/
    ├── avatar/           Profile avatars
    ├── notes/
    │   └── {note-id}/    Cover images and attachments per note
```

All files are served via **signed URLs** — time-limited, cryptographically signed links generated server-side. The `StorageImage` component handles fetching signed URLs transparently. Files cannot be accessed without a valid signed URL, and signed URLs expire, so even if a URL is shared, it becomes useless after expiry.

The free tier provides **1 GB of file storage** and **5 GB of egress per month**. Long-form text journal entries do not use storage — they are stored as text rows in the database.

---

## 17. Authentication Flow

### Email + Password

1. User fills in the signup form with name, email, and password
2. `supabase.auth.signUp` is called with `data: { full_name: name }` in the options
3. Supabase sends a confirmation email (if email confirmation is enabled in the Supabase project settings)
4. On confirmation, the `on_auth_user_created` trigger fires and creates a `profiles` row
5. User is redirected to sign in and then to the home page

### Google OAuth

1. User clicks "Continue with Google"
2. `supabase.auth.signInWithOAuth({ provider: 'google' })` redirects to Google
3. After Google authentication, the user is redirected back to `{origin}/`
4. Supabase creates the `auth.users` row and fires the profile creation trigger
5. The `AuthContext` picks up the session and redirects to home

### Session persistence

Supabase Auth stores the session in `localStorage` by default. The `AuthContext` listens to `supabase.auth.onAuthStateChange` and keeps the `user` and `isAuthenticated` state in sync. Protected routes check `isAuthenticated` and redirect to `/login` if false.

---

## 18. AI Call Budget

This section documents how many Gemini calls each user action generates, to help reason about costs at scale.

| User action | Gemini calls | Notes |
|---|---|---|
| Save a new note (ingest) | 3 | Decision + synthesis + index rebuild. Fire-and-forget. |
| Save an existing note (edit) | 3 | Same as new note. |
| Press "AI Reflect" | 1 | Wiki context pre-fetched from Supabase, not Gemini. |
| Open tags panel (auto) | 1 | Tag suggestions for the current entry content. |
| Open a new note (auto) | 1 | Dynamic prompt generation from last 3 entries. |
| Press "Refresh Insights" | 5 | 4 structured pages + index. User-triggered only. |

On Gemini 2.5 Flash's free tier (1,500 requests per day, 1M tokens per minute), a single active user generating 5 saves + 5 reflections + 1 refresh per day = 26 calls. This is well within free tier limits even for hundreds of daily active users.

---

## 19. Roadmap

- [ ] **Stripe integration** — Pro plan upgrade flow
- [ ] **End-to-end encryption** — client-side encryption before storage
- [ ] **Export** — PDF and Markdown export of notes and wiki
- [ ] **Offline support** — Service worker + IndexedDB for offline writing
- [ ] **Insights: Refresh button** — visible in the Insights page header
- [ ] **Wiki page differentiation** — Insights page sections for structured vs freeform wiki pages
- [ ] **Granola sync** — import meeting transcripts into the wiki ingest pipeline

---

## 20. Author

**Arabinda Saha**
Portfolio: arabinda07.github.io

---

## 21. License

MIT License. See `LICENSE` for full text.
