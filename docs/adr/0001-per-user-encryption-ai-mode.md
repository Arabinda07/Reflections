# ADR 0001: Per-User Encryption vs. AI Insights Choice

## Context
Reflections was originally designed as a globally zero-knowledge encrypted application. While this provides maximum privacy, it prevents server-side AI features (such as background Life Wiki updates and note analysis) because the backend cannot decrypt note contents. To allow users who value AI reflections and indexing to use those features while preserving zero-knowledge protections for privacy-first users, we need to allow choosing between two distinct modes on a per-user basis.

## Decision
We decided to introduce a mandatory onboarding step for new users to choose between two modes, locked in at account creation:

1. **Encrypted Vault Mode (Privacy First):**
   - Active end-to-end encryption for notes, moods, and relationships.
   - Requires setting up a private-writing password and recovery key.
   - **Constraint:** The Life Wiki page, Sanctuary rooms, and the "Life Wiki" card on the Relationships page are disabled and hidden.
   - **Constraint:** Manually typing disabled routes (e.g., `/wiki`, `/sanctuary`) triggers a silent, immediate redirect back to `/notes`.

2. **Reflective Sanctuary Mode (AI First):**
   - Notes are stored in plaintext in the database (or server-side decrypted) so the Gemini API can process them.
   - Bypasses password/recovery setup completely.
   - **Constraint:** All encryption-related copy (e.g., "zero-knowledge," "locally encrypted") is hidden from the UI.
   - **Constraint:** Password settings are simplified to a standard account-password change option (no recovery phrase or private-writing password options).

## Technical Implementation Details
- **User Preference:** Store the selection as `user_mode: 'encrypted' | 'reflective'` on the `public.profiles` database table.
- **Database Constraints:** Rewrite database check constraints (such as `zero_knowledge_is_forced()`) to dynamically inspect the user profile's mode instead of checking a global switch.
- **Client Guards:** Update `isStrictPrivateModeEnabled` in `services/privateMode.ts` to return dynamically based on the current user's profile setting.
- **Onboarding UI:** Add a choice screen during sign-up prior to any password setup pages.
- **Routing & Views:** Conditionally render navigation links, Account tabs, and copy throughout the app based on the `user_mode` setting.
