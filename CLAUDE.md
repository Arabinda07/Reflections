# Reflections

A private, writing-first journaling app: React + Vite frontend, Vercel functions in `api/`, Supabase for auth and data, Capacitor for Android. Product voice and positioning live in `PRODUCT.md` and `CONTEXT.md`.

## Product thesis

Writing and people are one loop: you write, the app notices who you wrote about, and later brings them back gently. The editor is the home screen. Anything that doesn't serve that loop goes behind a menu or gets cut.

## Commands

- `npm run dev`: local app. `npm run lint`: ESLint (zero warnings) plus `tsc --noEmit`. `npm test`: Vitest. One file: `npx vitest run path/to/file.test.ts`.
- `/verify` runs the full gate and writes the end-of-run report.

## Layout

- `pages/dashboard/`: every screen (CreateNote, MyNotes, SingleNote, Relationships, ...). `layouts/`: shells and nav. `components/ui/`: primitives.
- `services/`: data and logic. Notes go through `noteService` / `syncEngine` (Dexie first, Supabase in the background). People live in `relationshipService` / `relationshipStore`.
- `api/`: Razorpay handlers only. `supabase/migrations/`: the schema source of truth (root `*.sql` files are older snapshots that some contract tests still read).

## Gotchas

- There is no server-side AI (Gemini and `api/ai*.ts` were removed). The Life Wiki page and stored pages remain, but refreshes are unplugged: `services/aiRunClient.ts` is a no-network stub until an on-device builder replaces it. All users are in `encrypted` mode (`services/privateMode.ts`), so the server can never read notes; all intelligence (related notes, tag suggestions, search) runs on-device via embeddings in `services/embedding/`. Don't add features that send note content to a server.
- Product copy stays non-clinical: no diagnoses, labels, or wellness slogans. The product does not claim to be therapy.
- The ~74 contract tests (`*.contract.test.ts`, `*Contract.test.ts`) read source files as text and assert on strings in them. Renaming a component, changing UI copy, or moving a call can fail them without any change in behavior. When one breaks because of an intended change, update or delete the stale assertion. Don't add new text-match tests; test behavior instead.
- Anything written to local storage that contains note or person text must be encrypted with `cryptoService` first, like synced data.
- `npm run lint` runs ESLint with zero warnings allowed, plus `tsc --noEmit`.

## Working style

- When a step doesn't need my input, keep going. Put status notes in the same message as the next action.
- Stop and ask only when you can't continue without me, or before anything destructive: deleting data, force-pushing, or changing anything outside this repo.
- A change is done only when `npm run lint` and `npm test` pass. Run them; don't assume.
- Spawn search, log-reading, and summarizing subagents (Explore, etc.) with `model: haiku` or `model: sonnet`. Code edits stay on the main model.
- Effort: `low` for renames or applying a known pattern; `medium` (default) for features; `high` for bug fixes in existing code, security work (private-mode / encryption paths), and performance work.
- End every run with three headings: **Blocked on me**, **Changed**, **Found**. Mark anything unverified and say where you looked.

