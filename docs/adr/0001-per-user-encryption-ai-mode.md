# ADR 0001: Per-User Encryption vs. AI Insights Choice

**Status:** Accepted  
**Date:** 2026-07-01

---

## Context

Reflections was originally designed as a globally zero-knowledge encrypted application. While this provides maximum privacy, it prevents server-side AI features (such as background Life Wiki updates and note analysis) because the backend cannot decrypt note contents.

The current `isStrictPrivateModeEnabled` in `services/privateMode.ts` is a hardcoded `() => true` — a global switch that disables AI for all users. To allow users who value AI reflections and indexing to use those features, while preserving zero-knowledge protections for privacy-first users, we are introducing a permanent per-user mode chosen at account creation.

---

## Decision

Introduce a mandatory onboarding step at a dedicated route (`/onboarding/mode-select`) for all new users — both email/password and Google OAuth — to choose between two modes. The choice is **locked at account creation** and cannot be self-changed by the user.

### Mode 1: Encrypted Vault (Privacy First)

- Full end-to-end encryption for notes, moods, relationships, and future letters.
- Requires setting up a private-writing password and a recovery key during onboarding.
- **Disabled features:** Life Wiki (`/wiki`), Sanctuary (`/sanctuary`), and the "Life Wiki" card on the Relationships page are hidden from navigation.
- **Route guard:** Manually navigating to a disabled route triggers a silent redirect to `/notes`.
- **Account page:** Shows full encryption settings — private-writing password, recovery phrase.

### Mode 2: Reflective Sanctuary (AI First)

- Notes stored in plaintext in the database so the Gemini API can process them server-side.
- Bypasses the private-writing password and recovery key setup entirely.
- **Hidden from UI:** All encryption-related copy (e.g., "zero-knowledge," "locally encrypted," "private-writing password") is suppressed throughout the app.
- **Account page:** Shows only standard account-password change. No recovery phrase or private-writing password options.

---

## Migration: Existing Users

Existing users are **defaulted to `'reflective'` mode**. This is intentional: the current user base is small, and the existing app experience (AI features enabled, no encryption setup forced) most closely matches Reflective Sanctuary. No data migration of note contents is required.

---

## Technical Implementation

### 1. Database — `public.profiles` column

Add `user_mode text not null default 'reflective' check (user_mode in ('encrypted', 'reflective'))` to `public.profiles`.

All existing rows default to `'reflective'`. New users have `user_mode` set explicitly by the onboarding screen before proceeding.

### 2. Database — `zero_knowledge_is_forced()` rewrite

The existing `public.zero_knowledge_is_forced()` function reads from a global `zero_knowledge_enforcement` table. This must be rewritten to inspect the current user's profile row instead:

```sql
create or replace function public.zero_knowledge_is_forced()
returns boolean language sql stable security definer
set search_path = public as $$
  select coalesce(
    (select user_mode = 'encrypted' from public.profiles where id = auth.uid()),
    false
  );
$$;
```

> **Note:** PostgreSQL `CHECK` constraints cannot reference other tables directly. Because the existing constraints on `notes`, `mood_checkins`, `future_letters`, `life_themes`, and `relationships` already call `zero_knowledge_is_forced()` through a `security definer` function, rewriting the function body alone is sufficient — no constraint DDL changes are needed.

### 3. Client — `UserModeContext`

A new React context (`context/UserModeContext.tsx`) reads `user_mode` from the profile once at boot and exposes it app-wide. This avoids the need to make `isStrictPrivateModeEnabled` async at every callsite.

Exposed shape: `{ userMode: 'encrypted' | 'reflective' | null }`

### 4. Client — `services/privateMode.ts`

`isStrictPrivateModeEnabled` and `isPrivateAiDisabled` are updated to accept `userMode` as a parameter (sourced from `UserModeContext`) rather than returning a hardcoded `true`. All callers in `api/ai.ts` and `api/ai-runs.ts` are updated accordingly.

### 5. Onboarding — `/onboarding/mode-select` route

A new dedicated page at `RoutePath.MODE_SELECT = '/onboarding/mode-select'`. All new users — both email/password and Google OAuth — are redirected here immediately after their first successful authentication, before any password setup pages.

- The page writes the chosen `user_mode` to `public.profiles`.
- **Encrypted Vault** → continues to private-writing password setup.
- **Reflective Sanctuary** → goes directly to `/home`.

The `AuthCallback` and `SignUp` completion handlers detect first-time users (e.g., `user_mode` not yet set, or an `is_onboarded` flag) and redirect to this route. This ensures Google OAuth users are covered the same as email/password users.

### 6. Routing guards

A new `withModeGuard(requiredMode, redirectTo)` HOC wraps routes that require a specific mode. In `App.tsx`:

- `/wiki`, `/sanctuary`, `/sanctuary/:pageType` are wrapped with `withModeGuard('reflective', RoutePath.NOTES)`.
- Encrypted Vault users navigating to these routes are silently redirected to `/notes`.

### 7. Navigation & UI conditional rendering

Throughout the app, navigation links, Account tabs, and copy are rendered conditionally based on `userMode` from `UserModeContext`. Key locations:

- Sidebar / bottom nav: hide Life Wiki and Sanctuary links for `'encrypted'` users.
- Relationships page: hide the "Life Wiki" card for `'encrypted'` users.
- Account page: show/hide encryption settings tabs based on mode.
- Any copy mentioning "zero-knowledge" or "locally encrypted": hidden for `'reflective'` users.

---

## Consequences

- **No self-serve mode switching.** Users who want to change modes must contact support. This avoids data-consistency edge cases (re-encrypting plaintext notes or purging encrypted payloads).
- **Google OAuth users are fully covered** by the dedicated `/onboarding/mode-select` route, which intercepts all new users post-auth regardless of provider.
- **Existing tests** in `privateMode.test.ts`, `ai.test.ts`, `ai-runs.test.ts`, and `zeroKnowledgeSchemaContract.test.ts` must be updated to account for the per-user mode.
- **`securityRegressionContract.test.ts`** should gain a test asserting that encrypted-mode users cannot write plaintext rows that bypass the check constraint.
