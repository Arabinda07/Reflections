# Android Follow-up Staged Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the remaining Android follow-up work in a controlled sequence: secure release signing, optimize Capacitor/native shell boot paths, then restore the mobile landing and surface-token contracts.

**Architecture:** Three stages, each with its own verification gate. Stage 1 is config hardening only and must not alter app behavior. Stage 2 is shell/performance cleanup focused on keeping native-only code off the default web path. Stage 3 is UI-only adaptation/polish guided by the existing design context and the red contract tests.

**Tech Stack:** React 19, TypeScript, Vite, Vitest, Capacitor Android, Gradle

---

## File Map

| File | Responsibility in this plan |
|---|---|
| `android/gradle.properties` | Remove tracked release signing secrets and keep only safe project-level Gradle flags |
| `android/app/build.gradle` | Load signing values from a local-only properties file and/or environment variables |
| `android/.gitignore` | Ensure any local signing file stays untracked |
| `src/native/androidSigningContract.test.ts` | Guard against secrets reappearing in tracked Gradle properties and require the secure loading path |
| `App.tsx` | Stage 2 shell boot cleanup: remove static Capacitor/native auth imports from the default shell path |
| `vite.config.ts` | Preserve vendor chunking that keeps native code split out of the base shell |
| `src/auth/googleOAuth.ts` | Keep auth redirect policy in the auth seam while `App.tsx` stays callback glue |
| `pages/dashboard/Landing.tsx` | Restore mobile video framing contract |
| `layouts/DashboardLayout.tsx` | Replace remaining raw surface color drift with shared surface tokens |
| `index.css` | Confirm shared scrim/surface tokens remain the source of truth |
| `pages/dashboard/optimizeAuditContract.test.ts` | Stage 2 regression gate |
| `pages/dashboard/visualParityContract.test.ts` | Stage 3 mobile framing regression gate |
| `pages/dashboard/polishContract.test.ts` | Stage 3 surface-token regression gate |

---

## Stage 1: Lock Down Android Signing Secrets

**Outcome:** No release keystore secrets remain in tracked Gradle properties, and local release builds still work from a private local-only source.

**Files:**
- Modify: `android/gradle.properties`
- Modify: `android/app/build.gradle`
- Modify: `android/.gitignore`
- Create: `src/native/androidSigningContract.test.ts`

- [ ] **Step 1: Write the failing contract test**

Create `src/native/androidSigningContract.test.ts` to assert:
- `android/gradle.properties` does not contain `REFLECTIONS_STORE_PASSWORD=`, `REFLECTIONS_KEY_PASSWORD=`, or a real `REFLECTIONS_STORE_FILE=`
- `android/app/build.gradle` loads signing data from `keystore.properties` and/or environment variables instead of only `findProperty(...)`
- `android/.gitignore` ignores `keystore.properties`

- [ ] **Step 2: Run the contract test and confirm it fails for the current tracked secrets**

Run:

```bash
npx vitest run src/native/androidSigningContract.test.ts
```

Expected:
- FAIL because `android/gradle.properties` still contains live signing values

- [ ] **Step 3: Implement the secure signing path**

Change the Android config so that:
- tracked `android/gradle.properties` keeps only non-secret Gradle settings
- `android/app/build.gradle` reads release signing values from `android/keystore.properties` when present
- environment variables remain valid as a fallback for CI or future automation
- local-only `android/keystore.properties` is ignored by Git

- [ ] **Step 4: Recreate the local private signing file for this machine only**

Create a local untracked `android/keystore.properties` using the current machine’s signing values so local release builds keep working after the tracked secrets are removed.

- [ ] **Step 5: Verify Stage 1**

Run:

```bash
npx vitest run src/native/androidSigningContract.test.ts
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
```

Expected:
- signing contract test passes
- debug and release Android builds complete successfully

- [ ] **Step 6: Review gate**

Confirm before Stage 2:
- no tracked file contains release passwords or keystore paths
- the release build still resolves a signing config locally
- any remaining external secret rotation work is called out separately

---

## Stage 2: Optimize Capacitor Imports and Shell Boot Paths

**Outcome:** The base app shell no longer statically pulls native-only Capacitor and auth callback code into the default path, and the optimize contract passes.

**Files:**
- Modify: `App.tsx`
- Inspect/Modify: `vite.config.ts`
- Inspect/Modify: `src/auth/googleOAuth.ts`
- Verify: `pages/dashboard/optimizeAuditContract.test.ts`

- [ ] **Step 1: Use the existing failing optimize contract as the red test**

Run:

```bash
npx vitest run pages/dashboard/optimizeAuditContract.test.ts
```

Expected:
- FAIL because `App.tsx` still contains static `@capacitor/app`, `@capacitor/core`, and native auth imports

- [ ] **Step 2: Move native-only boot code behind dynamic imports**

Refactor `App.tsx` so:
- the default shell imports only web-safe code eagerly
- native-only setup is done inside guarded async effects
- auth redirect policy remains in `src/auth/googleOAuth.ts`

- [ ] **Step 3: Re-verify optimize behavior**

Run:

```bash
npx vitest run pages/dashboard/optimizeAuditContract.test.ts
npm run build
```

Expected:
- optimize contract passes
- build still succeeds, with chunking preserved in `vite.config.ts`

- [ ] **Step 4: Review gate**

Confirm before Stage 3:
- `App.tsx` is thinner and native code is not statically imported into the base shell
- no auth behavior regressed for Android callback handling

---

## Stage 3: Re-close Mobile Landing and Surface-Token Contracts

**Outcome:** The mobile landing framing matches the intended subject-first sanctuary composition again, and the shared polished surfaces are back on tokens instead of one-off values.

**Files:**
- Modify: `pages/dashboard/Landing.tsx`
- Modify: `layouts/DashboardLayout.tsx`
- Inspect: `index.css`
- Verify: `pages/dashboard/visualParityContract.test.ts`
- Verify: `pages/dashboard/polishContract.test.ts`

- [ ] **Step 1: Use the visual parity and polish contracts as the red tests**

Run:

```bash
npx vitest run pages/dashboard/visualParityContract.test.ts pages/dashboard/polishContract.test.ts
```

Expected:
- FAIL on the landing crop drift
- FAIL on the remaining raw footer surface value in `DashboardLayout.tsx`

- [ ] **Step 2: Apply `adapt` to the landing framing**

Update `pages/dashboard/Landing.tsx` so the mobile and small-screen object positioning matches the subject-first framing contract while preserving the current sanctuary composition.

- [ ] **Step 3: Apply `polish` to the remaining shell surface drift**

Update `layouts/DashboardLayout.tsx` so the footer and any remaining shell surfaces use the shared tokenized surfaces already defined in `index.css`.

- [ ] **Step 4: Verify Stage 3**

Run:

```bash
npx vitest run pages/dashboard/visualParityContract.test.ts pages/dashboard/polishContract.test.ts
npm run lint
npm run build
npx cap sync android
.\gradlew.bat assembleDebug
```

Expected:
- both UI contracts pass
- lint/build/sync/debug build stay green

- [ ] **Step 5: Final review**

Confirm:
- mobile landing framing is back within the intended crop
- shell surfaces use shared tokens instead of hard-coded drift
- the earlier Android fixes still behave correctly after the cleanup
