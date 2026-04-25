import { describe, expect, it } from 'vitest';
import {
  canNavigateBackInApp,
  createAndroidBackActionRegistry,
  isTopLevelAndroidRoute,
  resolveAndroidBackOutcome,
} from './androidBack';

describe('createAndroidBackActionRegistry', () => {
  it('runs the most recently registered action first', async () => {
    const registry = createAndroidBackActionRegistry();
    const calls: string[] = [];

    registry.register(() => {
      calls.push('first');
      return true;
    });
    registry.register(() => {
      calls.push('second');
      return true;
    });

    await expect(registry.runTopmost()).resolves.toBe(true);
    expect(calls).toEqual(['second']);
  });
});

describe('resolveAndroidBackOutcome', () => {
  it('gives modal-like overlays first priority', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: true,
        isTopLevelRoute: true,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'registered-action' });
  });

  it('navigates back when the user is not on a top-level route', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        isTopLevelRoute: false,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'navigate-back' });
  });

  it('prompts before exit, then exits on a second press inside the confirmation window', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        isTopLevelRoute: true,
        canNavigateBack: false,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({
      type: 'prompt-exit',
      nextExitPromptAt: 1000,
    });

    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        isTopLevelRoute: true,
        canNavigateBack: false,
        now: 2500,
        lastExitPromptAt: 1000,
      }),
    ).toEqual({ type: 'exit-app' });
  });

  it('navigates back from a top-level route when the in-app history can still pop', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        isTopLevelRoute: true,
        canNavigateBack: true,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'navigate-back' });
  });
});

describe('isTopLevelAndroidRoute', () => {
  it('treats the agreed shell routes as top-level exits', () => {
    expect(isTopLevelAndroidRoute('/')).toBe(true);
    expect(isTopLevelAndroidRoute('/notes')).toBe(true);
    expect(isTopLevelAndroidRoute('/account')).toBe(true);
    expect(isTopLevelAndroidRoute('/insights')).toBe(true);
    expect(isTopLevelAndroidRoute('/login')).toBe(true);
    expect(isTopLevelAndroidRoute('/signup')).toBe(true);
    expect(isTopLevelAndroidRoute('/faq')).toBe(true);
    expect(isTopLevelAndroidRoute('/privacy')).toBe(true);
    expect(isTopLevelAndroidRoute('/terms')).toBe(true);
    expect(isTopLevelAndroidRoute('/notes/new')).toBe(false);
    expect(isTopLevelAndroidRoute('/notes/123')).toBe(false);
  });
});

describe('canNavigateBackInApp', () => {
  it('prefers the router history index when it is available', () => {
    expect(canNavigateBackInApp({ idx: 2 }, 1)).toBe(true);
    expect(canNavigateBackInApp({ idx: 0 }, 5)).toBe(false);
  });

  it('falls back to the browser history length when router state is unavailable', () => {
    expect(canNavigateBackInApp(undefined, 2)).toBe(true);
    expect(canNavigateBackInApp(undefined, 1)).toBe(false);
  });
});
