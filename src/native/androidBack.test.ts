import { describe, expect, it } from 'vitest';
import {
  canNavigateBackInApp,
  createAndroidBackActionRegistry,
  getAndroidBackFallbackPath,
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
        pathname: '/home',
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'registered-action' });
  });

  it('navigates back when the user is not on a top-level route', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        pathname: '/notes/new',
        canNavigateBack: true,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'navigate-back' });
  });

  it('routes detail and writing pages to stable parents when there is no in-app history', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        pathname: '/notes/new',
        canNavigateBack: false,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'navigate-to-fallback', path: '/notes' });

    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        pathname: '/sanctuary/grief',
        canNavigateBack: false,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'navigate-to-fallback', path: '/sanctuary' });
  });

  it('prompts before exit, then exits on a second press inside the confirmation window', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        pathname: '/home',
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
        pathname: '/home',
        canNavigateBack: false,
        now: 2500,
        lastExitPromptAt: 1000,
      }),
    ).toEqual({ type: 'exit-app' });
  });

  it('prompts from top-level routes instead of popping shell history', () => {
    expect(
      resolveAndroidBackOutcome({
        hasRegisteredAction: false,
        pathname: '/notes',
        canNavigateBack: true,
        now: 1000,
        lastExitPromptAt: null,
      }),
    ).toEqual({ type: 'prompt-exit', nextExitPromptAt: 1000 });
  });
});

describe('isTopLevelAndroidRoute', () => {
  it('treats the agreed shell routes as top-level exits', () => {
    expect(isTopLevelAndroidRoute('/')).toBe(true);
    expect(isTopLevelAndroidRoute('/home')).toBe(true);
    expect(isTopLevelAndroidRoute('/notes')).toBe(true);
    expect(isTopLevelAndroidRoute('/account')).toBe(true);
    expect(isTopLevelAndroidRoute('/insights')).toBe(true);
    expect(isTopLevelAndroidRoute('/letters')).toBe(true);
    expect(isTopLevelAndroidRoute('/login')).toBe(true);
    expect(isTopLevelAndroidRoute('/signup')).toBe(true);
    expect(isTopLevelAndroidRoute('/reset-password')).toBe(true);
    expect(isTopLevelAndroidRoute('/faq')).toBe(true);
    expect(isTopLevelAndroidRoute('/about')).toBe(true);
    expect(isTopLevelAndroidRoute('/privacy')).toBe(true);
    expect(isTopLevelAndroidRoute('/terms')).toBe(true);
    expect(isTopLevelAndroidRoute('/wiki')).toBe(true);
    expect(isTopLevelAndroidRoute('/sanctuary')).toBe(true);
    expect(isTopLevelAndroidRoute('/notes/new')).toBe(false);
    expect(isTopLevelAndroidRoute('/notes/123')).toBe(false);
  });
});

describe('getAndroidBackFallbackPath', () => {
  it('maps nested Android routes to stable parents', () => {
    expect(getAndroidBackFallbackPath('/notes/new')).toBe('/notes');
    expect(getAndroidBackFallbackPath('/notes/123')).toBe('/notes');
    expect(getAndroidBackFallbackPath('/notes/123/edit')).toBe('/notes');
    expect(getAndroidBackFallbackPath('/sanctuary/grief')).toBe('/sanctuary');
    expect(getAndroidBackFallbackPath('/release')).toBe('/home');
    expect(getAndroidBackFallbackPath('/unknown')).toBe('/home');
  });

  it('does not provide a fallback for top-level routes', () => {
    expect(getAndroidBackFallbackPath('/home')).toBeNull();
    expect(getAndroidBackFallbackPath('/notes')).toBeNull();
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
