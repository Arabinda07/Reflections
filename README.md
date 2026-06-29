# Reflections

> A private, writing-first wellness journal for mood tracking, long-form notes, and user-invited AI reflection.
>
> No streaks. No public feed. No hidden pressure loop. Reflections is built to help someone write, return to their own thoughts, and notice patterns without turning private life into a score.

## Table of Contents

1. [Project FAQ](#project-faq)
2. [Product FAQ](#product-faq)
3. [Feature FAQ](#feature-faq)
4. [Life Wiki and Sanctuary FAQ](#life-wiki-and-sanctuary-faq)
5. [AI FAQ](#ai-faq)
6. [Privacy and Security FAQ](#privacy-and-security-faq)
7. [Pricing and Access FAQ](#pricing-and-access-faq)
8. [Data Model FAQ](#data-model-faq)
9. [Architecture FAQ](#architecture-faq)
10. [Maintainer FAQ](#maintainer-faq)
11. [Troubleshooting FAQ](#troubleshooting-faq)
12. [Roadmap FAQ](#roadmap-faq)
13. [Author and License](#author-and-license)

## Project FAQ

### What is Reflections?

Reflections is a private journaling app. A user can write rich-text notes, attach mood labels, add tags, keep small tasks inside entries, upload cover images or attachments, and come back later through notes, calendar views, weekly recaps, and a personal Life Wiki.

The app's center is writing. AI exists as a support layer, not the product's main personality. When a user asks for help, Reflections can generate prompts, suggest tags, create a reflection, or build Life Wiki pages from their saved notes.

### What is the public promise?

Reflections is for quiet personal writing. The product avoids streaks, leaderboards, public feeds, shame nudges, and inflated wellness claims. It doesn't claim to be therapy, diagnosis, crisis care, or a replacement for professional support.

The plain promise is this: write privately, keep ownership of the notes, and use AI only when it helps the writing feel more understandable.

### Who is it for?

Reflections is for people who want a calm place to write through daily thoughts, emotional noise, decisions, memories, relationships, and unfinished questions. It is useful for someone who journals every day, someone who writes only when life gets loud, or someone who wants a gentler alternative to productivity apps.

The interface is designed for private moments: before bed, after work, during a pause, after a difficult conversation, or when a thought needs somewhere safe to land.

### What is it not?

Reflections isn't:

- A habit game
- A therapy service
- A diagnosis tool
- A social network
- An AI chatbot with a journal attached
- A productivity dashboard for optimizing mood
- A public sharing platform
- A dark-pattern subscription app

The app should never imply that care, clarity, or self-understanding requires payment.

### What is the current public site?

The canonical public origin is `https://www.reflections-sanctuary.space`. Public pages include:

- Homepage: `https://www.reflections-sanctuary.space/`
- FAQ: `https://www.reflections-sanctuary.space/faq`
- Privacy: `https://www.reflections-sanctuary.space/privacy`
- About: `https://www.reflections-sanctuary.space/about`

The fallback Vercel origin is defined in `src/config/publicSite.js`.

## Product FAQ

### What principles guide the product?

Reflections follows a few hard product rules:

- Writing comes first. Every surface should protect the user's ability to write.
- AI is invited. It shouldn't feel like a watcher sitting over the user's shoulder.
- Calm is behavior, not decoration. Copy, motion, hierarchy, and feature timing should lower pressure.
- Privacy should be concrete. Say what is stored, what leaves the app, and what can be deleted.
- Patterns emerge slowly. Insights should be observant, tentative, and grounded.
- Premium is additive. Free users shouldn't feel punished for needing a private writing space.

### What voice should the app use?

The brand voice is calm, plain, and specific. It should feel like a thoughtful notebook with a careful interface, not a wellness brand performing intimacy.

Good copy sounds like:

- "Write what is here."
- "Your Life Wiki needs a little more writing before it can say anything useful."
- "This reflection is a reading of your note, not a verdict."

Avoid copy like:

- "Unlock your best self."
- "Transform your mental health."
- "Optimize your mood."
- "Analyze my soul."
- "Insufficient data."

### What should the user feel while using Reflections?

The user should feel unhurried. A note can be short, messy, repeated, unfinished, or emotionally plain. The app shouldn't grade that. It should give the user enough structure to return to writing without making them feel watched or evaluated.

### What user actions matter most?

The most important actions are:

- Write a note
- Save it reliably
- Come back to it later
- Understand what is private
- Ask for AI only when wanted
- Delete personal data when needed

Everything else is secondary.

## Feature FAQ

### What can a user do in the journal?

Users can create, edit, read, and delete notes. Notes support:

- Rich text through Quill
- Mood labels
- Tags
- Cover images
- File attachments
- Inline tasks
- Local offline cache
- Remote sync through Supabase

The app treats the note as the main object. Mood, tags, and tasks support the note instead of replacing it.

### What does the writing surface include?

The writing surface includes:

- A rich-text editor
- Focus Mode, which reduces surrounding UI while the user types
- Whisper input through browser speech APIs where available
- Contextual prompts
- Suggested tags
- Mood selection
- Task extraction and completion state
- Save feedback
- Optional AI reflection
- Smart Mode controls when Life Wiki automation is enabled

### What are moods?

Mood labels help users mark how an entry felt at the time. Moods are used by note views, weekly recap, calendar surfaces, and insight summaries. The mood system should stay descriptive rather than clinical.

The app shouldn't infer diagnosis from mood data.

### What are tags?

Tags are user-visible labels for filtering and pattern recognition. A user can add their own tags, and the app can suggest tags from note content when asked. Tag suggestions are AI-assisted but remain lightweight: they help organize notes, not label the user.

### What are tasks inside notes?

Tasks are small actionable items that can live inside journal entries. They can be completed and tracked without turning the journal into a task manager. This is useful when a private entry contains something the user wants to remember or act on.

### What is My Notes?

My Notes is the saved-note library. It gives users a way to browse entries, revisit recent writing, filter by tags or moods where the UI supports it, and open individual notes.

### What is the calendar view?

The calendar view shows writing activity by date and mood. It helps a user return to entries from a certain day without turning activity into a streak.

### What is Release Mode?

Release Mode is a contained writing ritual for letting something go. Completing it records a ritual event, which can contribute to weekly rhythm and completion cards.

It should feel private and grounded. It shouldn't pressure the user to perform emotional closure.

### What are Future Letters?

Future Letters let a user write a letter to their future self. A letter stays locked until its chosen open date. When the date arrives, the user can open it, and the app records that moment as a ritual event.

Future Letters are stored per user and protected by the same authentication and Row Level Security model as the rest of the private app data.

### What is the weekly recap?

The weekly recap summarizes activity for the current local week. It can include:

- Writing days
- Notes saved
- Mood check-ins
- Release moments
- Letters scheduled
- Letters opened
- Recurring tags

The recap should describe activity without judging it. "You returned 2 days this week" is better than "You only wrote twice."

### What are completion cards?

Completion cards are shareable visual cards generated in the browser for certain moments, such as a weekly recap, a completed release ritual, or a scheduled letter. They use canvas rendering and the app's brand typography.

The user decides whether to share. The app shouldn't push public performance.

### What are referrals?

Referral invites let a signed-in user create an invite link. Referral codes are stored locally when someone arrives through an invite and are recorded after signup if valid.

The referral system should never expose private writing data. It only connects invite metadata.

### What is the newsletter flow?

Signup can include a newsletter opt-in. Email templates live under `emails/`, and Supabase functions handle welcome and newsletter preference flows. Newsletter unsubscribe state is stored on the profile side of the data model.

Email code must keep compliance details plain: opt-in, unsubscribe, sender identity, and mailing address must stay explicit.

### Is Reflections a PWA?

Yes. The app uses `vite-plugin-pwa` with a lean precache strategy, runtime caches for route chunks and selected media, install prompts, app icons, and a shortcut for starting a new entry.

### Is there an Android app?

Yes. The project includes Capacitor Android support. Android integration covers app shell behavior, safe areas, status bar handling, native back behavior, haptics, keyboard handling, splash screen behavior, and Android asset generation.

## Life Wiki and Sanctuary FAQ

### What is the Life Wiki?

Life Wiki is Reflections' personal knowledge layer. It turns saved notes into a small set of structured, readable pages about patterns in the user's writing.

The Life Wiki isn't a transcript of every note. It's a synthesis layer. It should capture recurring ideas, relationships, decisions, eras, and patterns without overstating certainty.

### What is Sanctuary?

Sanctuary is the user-facing Life Wiki experience. In code, the primary user-visible pages are defined in `services/wikiTypes.ts`:

- `people`
- `patterns`
- `philosophies`
- `eras`
- `decisions`

These pages are shown through `/wiki`, `/sanctuary`, and `/sanctuary/:pageType`.

### What are the older supporting wiki page types?

The code still supports additional structured page types:

- `mood_patterns`
- `recurring_themes`
- `self_model`
- `timeline`
- `index`

The current Sanctuary page set focuses on the newer five-page structure, while the supporting types remain part of the schema and service layer.

### What is the index page?

The `index` page is a compact summary of wiki pages. It acts like a table of contents that helps AI requests understand what exists without rereading every page in full.

The index is rebuilt after relevant wiki generation flows.

### What is a freeform theme?

Freeform themes use `page_type = 'theme'`. They are the older, granular Life Wiki layer created from note ingestion decisions. The service layer keeps theme support for compatibility and for flows that still use append/create/skip logic.

### How does Smart Mode work?

Smart Mode is an opt-in Life Wiki behavior stored on `profiles.smart_mode_enabled`.

When Smart Mode starts, the app can run a "great ingest" process. It selects signal-bearing notes, processes them in chronological batches, refreshes structured wiki pages as the corpus grows, and logs absorbed notes in `wiki_absorb_log`.

After that, saved notes can be checked for re-absorption. If a note needs to be absorbed, the wiki refresh runs from the saved note set. If not, the flow skips work.

### Does the Life Wiki update every time the user writes?

Not by default for every user. Reflections keeps AI user-invited. The app has explicit refresh flows and an opt-in Smart Mode path. When Smart Mode is enabled, a saved note may trigger background Life Wiki work after the note itself has already been saved.

The note save should never depend on AI success.

### How does manual Life Wiki refresh work?

A manual refresh builds a notes corpus, asks Gemini to produce the structured wiki pages, validates source markers, retries once when needed, writes pages through `wikiService.upsertWikiPage`, and rebuilds the index if at least one page succeeds.

The refresh result reports page count and source. If there's no usable note corpus, the result is `source: 'none'`.

### Why use a compiled wiki instead of vector search?

The wiki approach keeps the user's history small and readable. Rather than storing embeddings for every note chunk and retrieving raw fragments on every request, Reflections compiles writing into a few text pages.

That means:

- Lower storage pressure
- Less repeated AI work
- User-visible summaries
- Easier citation and validation
- A calmer mental model for the product

Vector search may become useful later, but the current product bet is that compiled context is enough for the core experience.

### How are Life Wiki claims grounded?

Structured Life Wiki pages are prompted to use inline source markers in the format `[Source: note-id]`. Output validation checks source markers against the bounded corpus of notes used for generation.

If validation fails, the app builds a retry instruction and asks for a corrected page. If the retry also fails, that page generation is skipped and the error is logged.

### What happens when Life Wiki AI fails?

The app logs the error and keeps the saved notes intact. Wiki generation can partially succeed: one page can fail while another succeeds. The user shouldn't lose writing because an AI request failed.

## AI FAQ

### What AI provider does Reflections use?

Reflections uses Google's Gemini API through `@google/genai`.

Current prompt configuration lives in `services/aiPromptSpecs.ts`:

- Default generation model: `gemini-3-flash-preview`
- Ingest and Life Wiki refresh model: `gemini-2.5-flash`
- Prompt version: `2026-05-19`

### Does the browser call Gemini directly?

No. The current architecture routes AI requests through `/api/ai`.

The browser calls `services/aiClient.ts`, which sends the user's Supabase access token to `/api/ai`. The API route verifies the user, validates the request shape, checks note ownership for note-bound actions, claims usage or quota, and then calls Gemini server-side.

This replaced the older browser-exposed provider-key approach. AI provider keys must stay server-side.

### What AI actions exist?

The AI API validates a fixed set of actions:

- `prompts`
- `reflection`
- `tags`
- `ingestDecision`
- `ingestSynthesis`
- `wikiPage`
- `index`
- `writingNotes`

Each action has its own payload validation in `services/aiContracts.ts`.

### What does AI reflection do?

AI reflection reads the current note plus available wiki context and returns a short reflection. It should be personal and grounded, but never diagnostic or final.

If the AI call fails, the service returns a fallback message rather than breaking the page.

### What do dynamic prompts do?

Dynamic prompts give the user writing suggestions based on recent context. They should help the user begin, not steer the user's emotional interpretation.

### What do suggested tags do?

Suggested tags generate a short list of possible tags for a note. The user can ignore them. Tags are organization aids, not labels placed on the person.

### How does AI usage get limited?

There are two layers:

- Local in-memory rate limits inside `/api/ai`
- Supabase-backed usage and feature counters through RPC functions

The API also hashes IPs before using them for rate-limit buckets or logs. Raw IPs shouldn't be written into application logs.

### What is the free AI policy?

The free policy is defined in `services/wellnessPolicy.ts`:

- Free users can create 30 notes per month
- Free users need at least 3 notes before the AI reflection sample is available
- Free users get 1 AI reflection sample
- Free users need at least 3 entries before a Life Wiki generation is useful
- Free users get 1 Life Wiki generation
- Pro users have access beyond those free feature gates

### Does AI train on user notes?

The app shouldn't claim more than the provider and deployment settings support. The product copy should say that notes are sent to the AI provider only when the user invokes an AI feature or enables Smart Mode behavior that performs AI work. It shouldn't promise things that aren't enforced in code.

### Can AI see all notes?

AI receives the bounded content needed for the specific action:

- Reflections receive the note and wiki context
- Life Wiki refresh receives a notes corpus
- Tag suggestions receive note content
- Prompts receive recent-note context where applicable

The system should avoid sending more data than the feature needs.

### Is AI automatic?

AI is mostly explicit. The user presses or enables something: reflection, refresh, prompts, tags, or Smart Mode.

Smart Mode is the main opt-in background path. Even there, the saved note should remain durable before AI processing begins.

## Privacy and Security FAQ

### What is private by default?

Journal notes, attachments, mood data, Life Wiki pages, Future Letters, ritual events, referrals, account data, and AI usage counters are scoped to the signed-in user.

Private app data should be protected through Supabase Auth, Row Level Security, and per-user query scoping in the service layer.

### How does authentication work?

The app uses Supabase Auth. Supported flows include:

- Email and password signup
- Email and password login
- Password reset
- Google OAuth
- Auth callback handling
- Session persistence through Supabase's browser client

Protected routes use an authenticated app shell and route guard.

### What does Row Level Security protect?

RLS policies protect user-owned tables so users can access only their own rows. The schema includes RLS for notes, profiles, Life Wiki data, citations, AI counters, Future Letters, ritual events, referrals, and storage objects.

API routes that need elevated access use service-role credentials server-side only.

### How are files stored?

Files are stored in the private Supabase Storage bucket named `app-files`. Paths are organized under the user's ID. Attachments and cover images are referenced by storage path and served through signed URLs.

Signed URLs expire. Direct public bucket access should stay disabled for private user files.

### What happens when a user deletes their account?

The database includes `delete_user_data()` to remove the user's private application data. The cleanup includes notes, Life Wiki rows, citations, Future Letters, ritual events, referral data, entitlements, AI counters, and profile data.

Account deletion should be treated as destructive and irreversible in user-facing copy.

### What configuration is required?

Configuration is split by category:

- Public Supabase browser configuration
- Server Supabase configuration
- Supabase service-role configuration for trusted API routes
- Gemini server-side API configuration
- Razorpay checkout, subscription, and webhook configuration
- Email provider configuration
- Supabase function secrets
- Public site origin configuration

Variable names may appear in code and documentation when useful, but README examples mustn't include real values, token-shaped placeholders, or copy-pasteable secret blocks.

### Which variable names are important?

Common configuration names in this project include:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`
- `GOOGLE_GEMINI_API_KEY`
- `RAZORPAY_KEY_ID`
- `VITE_RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `RAZORPAY_WEEKLY_PLAN_ID`
- `RAZORPAY_MONTHLY_PLAN_ID`
- `RAZORPAY_WEBHOOK_SECRET`
- `RESEND_API_KEY`
- `FUNCTION_SECRET`
- `NEWSLETTER_TOKEN_SECRET`
- `PUBLIC_SITE_URL`

This list is for orientation only. Don't paste values into the README.

### What should never be committed?

Never commit:

- `.env` files or local secret files
- Supabase service-role credentials
- Gemini API credentials
- Razorpay secrets or webhook secrets
- Resend credentials
- Supabase function secrets
- Android signing keys or keystore credentials
- Private user exports
- Production database dumps
- Raw logs containing personal writing
- Screenshots that show private notes

### Are public keys safe?

Some browser-facing keys are designed to be public, such as the Supabase anon key and Razorpay public key. They still need correct backend and RLS enforcement. Public key doesn't mean unrestricted access.

Secrets such as service-role keys, provider API keys, payment secrets, webhook secrets, and email provider credentials must never be exposed to the browser bundle.

### Is Reflections safe for crisis use?

No. Reflections isn't a crisis service. User-facing copy should make this clear in privacy, support, and wellness-related surfaces where the context calls for it.

## Pricing and Access FAQ

### What is free?

The free tier includes:

- 30 notes per calendar month
- Private journaling
- Mood tracking
- Tags and tasks
- One AI reflection sample after enough writing
- One Life Wiki generation after enough writing
- Core privacy protections

The 30-note monthly limit is enforced server-side for free users.

### What is Pro?

Pro expands continuity and convenience. Pricing is defined in `src/config/pricingCatalog.ts`:

- Weekly Pro: INR 49 per week after a 3-day trial
- Monthly Pro: INR 149 per month after a 3-day trial

The default Pro plan is weekly. Both plans are trial-eligible in the current catalog.

### How are payments handled?

Payments use Razorpay. Subscription creation happens through `/api/create-razorpay-subscription`, payment verification through `/api/verify-razorpay-payment`, and subscription state is confirmed through the Razorpay webhook route.

The UI shouldn't promise Pro activation until the trusted payment flow confirms it.

### How is entitlement stored?

Plan access is read from `account_entitlements`. The client maps that into `WellnessAccess`, which drives free/pro gates and Smart Mode state.

### What happens when payment configuration is missing?

The payment API routes return configuration errors instead of leaking secret values. Diagnostics should report presence, format, and mismatch hints without printing actual secrets.

## Data Model FAQ

### What are the main tables?

The current schema includes:

- `profiles`
- `notes`
- `life_themes`
- `theme_citations`
- `wiki_absorb_log`
- `account_entitlements`
- `ai_feature_usage_counters`
- `ai_runs`
- `ai_run_events`
- `mood_checkins`
- `future_letters`
- `ritual_events`
- `referral_invites`
- `referrals`
- `razorpay_subscriptions`

Schema files live at the project root and under `supabase/`.

### What is stored in `profiles`?

`profiles` stores user metadata that supplements Supabase Auth. It includes fields such as display/profile information, newsletter preference state, and Smart Mode state.

Profile rows are created when a user signs up.

### What is stored in `notes`?

`notes` stores journal entries. A note can contain:

- Title
- Rich HTML content
- Mood
- Tags
- Cover image path
- Attachments
- Tasks
- Timestamps
- User ownership

The app maps database rows into the frontend `Note` type in the note remote store and service layer.

### What is stored in `life_themes`?

`life_themes` stores both older freeform themes and structured Life Wiki pages. `page_type` determines the page kind.

The table supports active, archived, and resolved states. Structured pages are upserted by `(user_id, page_type)` so each user has at most one current page of each structured type.

### What are `theme_citations`?

`theme_citations` connect notes to Life Wiki themes or pages. They let the app show which notes contributed to a theme and help keep generated claims grounded.

### What is `wiki_absorb_log`?

`wiki_absorb_log` records which notes have already been absorbed into the wiki. Smart Mode uses it to avoid repeating work when a saved note hasn't changed in a meaningful way.

### What are AI run tables?

`ai_runs` and `ai_run_events` track Life Wiki refresh runs and run-level events. They support status reporting for manual, Smart Mode, and account-enable triggers.

### What are ritual tables?

`future_letters` stores delayed letters. `ritual_events` records moments such as completed releases, scheduled letters, opened letters, and completion-card moments.

### What are referral tables?

`referral_invites` stores a user's invite code. `referrals` records accepted invite relationships. Referral policies ensure users can see only referrals they are part of.

### What are AI usage counters?

`ai_feature_usage_counters` tracks feature-level usage for free/pro gating. Server-side RPC functions claim usage before AI work is performed.

### How is offline storage handled?

The app uses Dexie and local storage helpers for offline-first note behavior. Note operations enqueue inserts, updates, and deletes through the sync engine. When Supabase fetches fail, the app can fall back to local Dexie data.

Offline behavior should preserve user writing first and sync later.

## Architecture FAQ

### What is the current stack?

| Layer | Current technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite 6 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 3 |
| Motion | Motion 12 |
| Auth | Supabase Auth |
| Database | Supabase Postgres with RLS |
| Storage | Supabase Storage signed URLs |
| AI | Google Gemini through `@google/genai` |
| API | Vercel-style serverless routes under `api/` |
| Payments | Razorpay subscriptions and webhooks |
| Email | React Email, Resend, Supabase functions |
| Offline | Dexie, IndexedDB helpers, sync engine |
| PWA | `vite-plugin-pwa` |
| Android | Capacitor 8 |
| Editor | Quill |
| Icons | Phosphor Icons |
| Animation assets | Lottie and app media assets |

### What are the main routes?

Public routes:

- `/`
- `/faq`
- `/about`
- `/privacy`

Auth routes:

- `/login`
- `/signup`
- `/reset-password`
- `/auth/callback`

Protected routes:

- `/home`
- `/notes`
- `/notes/new`
- `/notes/:id`
- `/notes/:id/edit`
- `/release`
- `/letters`
- `/account`
- `/insights`
- `/wiki`
- `/sanctuary`
- `/sanctuary/:pageType`

`/dashboard` redirects to `/home`. Legacy `/signin` and `/sign-in` redirect to `/login`.

### How is the app loaded?

`App.tsx` defines lazy route components with Suspense fallbacks. Public routes use `PublicAppShell`, auth routes use `AuthAppShell`, and signed-in routes use `AuthenticatedAppShell` plus protected route checks.

### How do services divide responsibility?

Important service boundaries:

- `noteService` orchestrates note CRUD, offline cache, and sync
- `wikiService` owns Life Wiki reads and writes
- `aiService` owns reflection, ingest, Smart Mode, and wiki refresh flows
- `aiClient` calls `/api/ai`
- `storageService` owns file upload, signed URL, and delete operations
- `profileService` maps access, plan, usage, and Smart Mode state
- `futureLetterService` owns delayed letters
- `ritualService` records private ritual events
- `referralService` owns referral capture and invite logic
- `weeklyRecapService` builds weekly summary data

Components should use services rather than reaching directly into Supabase.

### How does an AI request move through the system?

1. The UI calls a service such as `aiService`.
2. `aiService` calls `aiClient`.
3. `aiClient` reads the Supabase session and posts to `/api/ai`.
4. `/api/ai` validates the authenticated user.
5. The API validates the action and payload.
6. For note-bound actions, the API confirms note ownership.
7. The API claims rate and feature usage.
8. The API builds the prompt and calls Gemini.
9. The response returns to the service.
10. The service updates UI state or writes validated wiki output.

### How does a note save move through the system?

1. The user writes or edits a note.
2. `noteService` resolves the authenticated user.
3. The change is enqueued through the sync engine.
4. Local storage is updated for immediate continuity.
5. Remote sync writes to Supabase when available.
6. Optional Smart Mode work can run after the note is durable.

### How are public SEO pages generated?

Public SEO generation is handled by `scripts/generate-public-seo-pages.mjs`. The public route metadata comes from `src/config/publicSeoCopy.js` and related public-site config.

Generated public assets include sitemap, robots metadata, `llms.txt`, and static public-page HTML where configured.

### How does email work?

React Email templates live under `emails/templates`. Shared email components live under `emails/components`.

Supabase functions handle email-related backend flows such as welcome email and newsletter preferences. Function code must keep secrets server-side and verify function-level authorization where required.

### How does Android fit in?

Capacitor wraps the web app for Android. Native support code lives under `src/native`, while Android assets are generated through scripts under `scripts/android`.

Android-specific tests check signing assumptions, shell behavior, native OAuth behavior, and back-button handling.

## Maintainer FAQ

### How should a maintainer work with the project locally?

This README assumes the maintainer is already working inside the repository workspace. It doesn't include repository acquisition instructions.

Common commands:

```bash
npm install
npm run dev
npm run build
npm run lint
npm exec vitest run
```

The Vite dev server is configured for port 3000.

### How do I use the local architecture graph?

Graphify outputs are local and ignored by Git. Build a directed graph after checking that the detected corpus excludes `.codex`, `node_modules`, `dist`, native build output, generated binaries, and secrets:

```bash
graphify . --directed --mode deep
graphify . --update --directed
```

If the Windows uv launcher cannot resolve its trampoline, use the equivalent portable form: `uv tool run --from graphifyy graphify <command>`.

Use `graphify query` for broad dependency questions, `graphify path` for end-to-end flows, and `graphify explain` for one module or concept. The most useful project traces are private data to APIs/storage/AI, authentication to crypto sessions, Dexie to Supabase sync, SQL migration state to row mappers, and changed modules to their tests. `graphify hook install` can refresh code relationships after local commits; documentation changes still need the explicit update command.

Keep this lightweight: do not commit `graphify-out`, run it in CI, or add Neo4j/MCP/watch infrastructure unless repeated team use justifies it.

### How do I run the public SEO audit?

Use:

```bash
npm run seo:audit
```

This runs the SEO crawlability contract test.

### How do I preview the production build?

Use:

```bash
npm run build
npm run preview
```

The production preview serves the built output locally.

### How do I work on email templates?

Use:

```bash
npm run email
```

This starts the React Email development flow for templates under `emails/`.

### How do I work on Android?

Useful commands:

```bash
npm run cap:sync
npm run cap:open:android
```

Use Android-specific tests and the Capacitor config before shipping native changes.

### Which files are the best starting points?

Good starting points:

- `PRODUCT.md` for product voice and boundaries
- `App.tsx` for routes
- `types.ts` for shared frontend types
- `services/aiPromptSpecs.ts` for model and prompt configuration
- `services/aiClient.ts` and `api/ai.ts` for AI request flow
- `services/wellnessPolicy.ts` for free/pro access logic
- `src/config/pricingCatalog.ts` for Pro pricing
- `supabase_schema.sql` and `supabase_security_lockdown.sql` for database and RLS
- `vite.config.ts` for PWA, build, and chunking behavior

### How should schema changes be made?

Schema changes should update the appropriate root schema file and, when needed, add a migration under `supabase/migrations`.

Any table holding user data needs an RLS policy before it is treated as ready.

### How should AI features be added?

Add AI work through the existing action-based API shape:

1. Add or extend an action in `services/aiContracts.ts`.
2. Validate the payload shape.
3. Add prompt construction in `services/aiPromptSpecs.ts` or the API route.
4. Keep provider credentials server-side.
5. Add ownership checks for note-bound or user-bound content.
6. Add usage gates if the feature consumes quota.
7. Add tests for payload validation, ownership assumptions, and failure behavior.

### How should UI features be added?

Start from the route and service boundary. Prefer existing primitives under `components/ui`, route-level page components under `pages/`, and product voice in `PRODUCT.md`.

Avoid adding new state systems unless the feature clearly needs one. The app already uses services, hooks, Supabase, Dexie, and Zustand where appropriate.

### How should tests be chosen?

Match test scope to risk:

- Service logic: unit tests beside the service
- AI contracts: payload and validation tests
- Schema/security: contract tests against SQL text
- Public pages: SEO and crawlability contract tests
- Mobile behavior: Android/native contract tests
- Visual/layout changes: targeted route/component contract tests

### How should deployment configuration be treated?

Deployment should keep secrets in the platform environment, not in files. Public origins, SEO metadata, PWA config, and public asset paths can live in source. Provider keys, payment secrets, webhook secrets, and function secrets can't.

## Troubleshooting FAQ

### The app loads a blank configuration screen. What is likely missing?

The browser-facing Supabase configuration is missing or empty. The app checks required client configuration at bootstrap and should fail visibly rather than running in a broken state.

### AI reflection says it is not configured. What does that mean?

The server-side Gemini configuration is missing in that environment. The fallback message comes from `aiService` when `/api/ai` can't call Gemini.

### AI returns a rate-limit error. What happened?

The action may have exceeded local API rate limits or Supabase-backed usage limits. Free feature counters and plan entitlements control some actions.

### Life Wiki refresh produced no pages. Why?

Common reasons:

- The user has too few notes
- The note corpus is empty
- Generated output failed source-marker validation
- The AI route failed
- All page generations failed and were logged

The user's notes should still be safe.

### Razorpay checkout fails. Where should maintainers look?

Check:

- Server Razorpay configuration presence
- Public and server key mode alignment
- Weekly and monthly plan configuration
- Webhook secret configuration
- Webhook delivery logs
- `api/payment-diagnostics.ts`
- Razorpay-related tests under `tests/api`

Diagnostics should never print secret values.

### Storage images do not load. What should be checked?

Check:

- The file exists in `app-files`
- The path is under the user's folder
- Storage RLS policies are installed
- Signed URL generation is working
- The component is using `StorageImage` or the storage service

### Offline notes are not syncing. What should be checked?

Check:

- Local Dexie records
- Sync status flags
- Supabase session state
- Network state
- `syncEngine`
- `offlineStorage`
- Note ownership and RLS errors

### Public SEO output looks stale. What should be checked?

Check:

- `src/config/publicSeoCopy.js`
- `src/config/publicSite.js`
- `scripts/generate-public-seo-pages.mjs`
- Generated files under `public/`
- SEO contract tests

## Roadmap FAQ

### What is already underway or represented in code?

Current code already includes the major product systems:

- Writing and note management
- Mood and weekly recap
- Life Wiki and Sanctuary
- Smart Mode
- AI reflection, prompts, tags, wiki pages, and writing notes
- Offline cache and sync
- PWA support
- Android shell support
- Razorpay Pro pricing and subscriptions
- Future Letters
- Release Mode
- Completion cards
- Referrals
- Newsletter and email infrastructure

### What future work still fits the product?

Future work should stay close to writing, privacy, and gentle pattern recognition. Good candidates include:

- Better export flows
- Clearer account deletion UX
- Stronger offline conflict handling
- Richer Life Wiki source review
- Better user control over Smart Mode
- Privacy copy that tracks implementation exactly
- Improved Android release readiness

### What should not be added?

Avoid:

- Streak mechanics
- Social feeds
- Public note sharing by default
- Diagnosis-like AI
- Manipulative subscription copy
- Hidden AI processing
- Growth loops that pressure private writing

## Author and License

Reflections is created by Arabinda Saha.

Portfolio: `arabinda07.github.io`

License: MIT. See `LICENSE` for the full license text.
