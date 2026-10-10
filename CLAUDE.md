# Reflections

A private, writing-first journaling app: React + Vite frontend, Vercel functions in `api/`, Supabase for auth and data, Capacitor for Android. Product voice and positioning live in `PRODUCT.md` and `CONTEXT.md`.

## Gotchas

- There is no server-side AI (Gemini and `api/ai*.ts` were removed). The Life Wiki page and stored pages remain, but refreshes are unplugged: `services/aiRunClient.ts` is a no-network stub until an on-device builder replaces it. All users are in `encrypted` mode (`services/privateMode.ts`), so the server can never read notes; all intelligence (related notes, tag suggestions, search) runs on-device via embeddings in `services/embedding/`. Don't add features that send note content to a server.
- Product copy stays non-clinical: no diagnoses, labels, or wellness slogans. The product does not claim to be therapy.
- The ~76 contract tests (`*.contract.test.ts`, `*Contract.test.ts`) read source files as text and assert on strings in them. Renaming a component, changing UI copy, or moving a call can fail them without any change in behavior. Run `npm test` after such edits.
- `npm run lint` runs ESLint with zero warnings allowed, plus `tsc --noEmit`.

## Working style

- When a step doesn't need my input, keep going. Put status notes in the same message as the next action.
- Stop and ask only when you can't continue without me, or before anything destructive: deleting data, force-pushing, or changing anything outside this repo.
- A change is done only when `npm run lint` and `npm test` pass. Run them; don't assume.
- Spawn search, log-reading, and summarizing subagents (Explore, etc.) with `model: haiku` or `model: sonnet`. Code edits stay on the main model.
- Effort: `low` for renames or applying a known pattern; `medium` (default) for features; `high` for bug fixes in existing code, security work (private-mode / encryption paths), and performance work.
- End every run with three headings: **Blocked on me**, **Changed**, **Found**. Mark anything unverified and say where you looked.

<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan
<!-- SPECKIT END -->
