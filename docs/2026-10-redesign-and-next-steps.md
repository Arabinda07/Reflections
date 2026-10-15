# Redesign (October 2026) and next steps

Thesis: writing and people are one loop. You write, the app notices who you wrote about, and later brings them back gently. The editor is the home screen.

## Work done

### Writing
- **Encrypted autosave.** Unsaved writing is stored on the device (Dexie `drafts` table, AES-GCM through `cryptoService`) every 0.8s and when the app is hidden. It is restored on open and cleared on save, release or discard. A draft never overrides a note that was saved more recently elsewhere. Writes and clears are serialised. Files: `services/draftStore.ts`, `hooks/useNoteDraft.ts`.
- **Instant open.** The 450ms draft hold, the 650ms startup floor and the quote overlay (about 1.7s) are gone. The editor takes focus on open.
- **Leaving saves.** Back or tab navigation saves the note. A dialog shows only if the save fails.
- **Calm editor.** While you type, the chrome fades (opacity only, no layout shift). The Tasks UI is removed from the editor. Stored tasks stay readable on the note page.

### Today and navigation
- **Today page.** `/home` is a slim Today page: the prompt, voice input, people on your mind, the 3 most recent notes, future letter and release. The hero video, mood check-in and intentions are removed.
- **Launch to Write.** The first arrival in a session goes to a blank page (`src/utils/launchRouting.ts`). A session that starts on another route skips this.
- **Navigation.** Mobile tabs: Today, Notes, Write, People, More. Desktop: Today, Write, Notes, People, plus a More menu (Insights, Life Wiki, Future letters, Release, Account, FAQ).

### People
- **Writing is not contact.** Publishing a note no longer marks the people in it as tended.
- **One mention rule.** `noteMentionsPerson` and `mentionedLine` in `services/relationshipWikiLink.ts` decide when a note is about someone (a tag, a name or an alias). Today, People and Profile all use it.
- **Mention chips.** In the editor, a "+ Sam" chip offers to link a known person named in the draft.
- **Suggestions.** These use the writer's own words: a birthday, a reason to reconnect, the last line written about them, or the person's rhythm (`services/relationshipSuggestions.ts`).
- **New optional fields:** `aliases`, `birthday`, `cadenceWeeks`. Removed fields: closeness, energy, opportunity, connections, valueLedger.
- **Write about Sam.** The action opens a new page already tagged with that person.
- **Several names at once.** You can add "Sam, Priya, Mom" in one step.
- **Bug fix:** `boundaries` was never saved. It is fixed.

### Notes and reading
- **Notes list.** It is grouped by month (by date written) and has an instant search field.
- **Delete with Undo.** The real delete commits when the toast expires. `Toast` now supports one action.
- **Note page.** It has a visible Edit button, keyboard shortcuts (E, ← →, J K) and a delete handoff to the list with Undo.
- **Plainer labels.** Echoes shows dates, not "% resonance". The search badge reads "Related".
- **Onboarding.** The copy is accurate (no AI claim) and has a slide about people.

### Workflow
- **`CLAUDE.md`.** It now has the thesis, the commands, a layout map, an encryption rule and a contract-test rule.
- **`.claude/settings.json`.** It has allow and deny rules, plus a Stop hook that runs lint and tests.
- **`/verify`.** This command runs the full gate and writes a report.

### After live QA
- **Unlock once per device.** Every successful unlock now remembers the data key on this device (Android Keystore on native, this browser's IndexedDB on web). This covers login auto-unlock, the unlock form and first-time setup. The "Keep me unlocked" box starts checked. Sign-out clears the key. Reloads no longer ask for the password.
- **Undo toast.** The window is now 10s, the Undo button is larger, and on mobile the toast is centred above the tab bar.
- **No signed-in footer.** The marketing footer shows to guests only, and only after the auth check finishes, so it no longer flashes on load.
- **Empty People page.** With no people, it shows a "Who's on your mind?" prompt that opens the add dialog directly.

## Next steps: Insights (`pages/dashboard/Insights.tsx`, 525 lines)
1. **Lead with one quiet card.** Show "This week" by default (notes written, people who came up, one recurring theme). Put "This month" and the drift report behind "See more". Insights should support writing, not compete with it.
2. **Remove percentages from the mood-family bars.** The `title` values at `Insights.tsx:384-414` are `light: 32%` and so on. Use words instead ("mostly steady, some heavy days"). PRODUCT.md forbids score-like interpretation.
3. **Load progressively.** It fetches notes, themes, check-ins, rituals and relationships before anything renders. Show "This week" from local notes first, then fill in the rest.
4. **Add a people section.** Show who came up most this month, using `noteMentionsPerson` so it matches Profile and Today. Today the page counts only explicit tags.
5. **Mood check-ins.** The Home check-in is gone. Decide whether check-in history still belongs here, or whether note moods alone are enough.

## Next steps: Account (`pages/dashboard/Account.tsx`, about 900 lines, 22 `useState`)
1. **Group into three sections.** Profile (name, email), Security (password, biometric lock, recovery key) and Your data (export, delete). Extract each into its own component in the same folder to cut the state sprawl.
2. **One Export row** with a format choice (encrypted backup `.json` or Markdown `.zip`), not two buttons with long copy.
3. **Hide the biometric toggle** when the device can't support it. The availability check is near line 174; verify the toggle obeys it.
4. **Make the danger zone plain and specific.** Say exactly what is deleted, what is kept, and that it cannot be undone (PRODUCT.md, the privacy-must-be-concrete rule).
5. **Pin the invite.** It now lives only in the More menu; keep it there.

## Still open
- **Browser QA.** Logged-in QA against production, after this deploy.
- **Smoke test.** A Playwright smoke test (type, reload, restore). It needs a test account in CI.
- **Schema files.** `supabase_setup.sql` is unreferenced. Keep it until the owner decides.
