import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) => readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('UserModeGuard route protection', () => {
  const source = read('components/auth/UserModeGuard.tsx');

  it('shows a loading frame while the mode is still resolving', () => {
    expect(source).toContain('isUserModeLoading');
    expect(source).toContain('RouteLoadingFrame');
  });

  it('redirects when the resolved mode does not match the required mode', () => {
    expect(source).toContain('userMode !== requireMode');
    expect(source).toContain('<Navigate to={fallbackPath} replace />');
  });
});

describe('ModeSelect onboarding destination', () => {
  const source = read('pages/onboarding/ModeSelect.tsx');

  it('navigates to the authenticated dashboard after setting the mode', () => {
    expect(source).toContain('set_user_mode');
    expect(source).toContain('navigate(RoutePath.DASHBOARD, { replace: true })');
  });

  it('does not send successfully onboarded users to the public landing page', () => {
    // A single RoutePath.HOME navigation is acceptable only for the
    // "already onboarded" redirect guard, never as the success destination.
    const successBlock = source.slice(source.indexOf('set_user_mode'));
    expect(successBlock).not.toContain('navigate(RoutePath.HOME');
  });
});

describe('CryptoContext boot ordering', () => {
  const source = read('context/CryptoContext.tsx');

  it('stays in loading while the user mode is unresolved instead of forcing setup', () => {
    expect(source).toContain('if (userMode == null)');
    // The null-mode guard must appear before the setupRequired decision.
    expect(source.indexOf('if (userMode == null)')).toBeLessThan(
      source.indexOf("setStatus('setupRequired')"),
    );
  });
});

describe('UserModeContext failure handling', () => {
  const source = read('context/UserModeContext.tsx');

  it('surfaces an error instead of silently assuming reflective on fetch failure', () => {
    expect(source).toContain('userModeError');
    const errorBranch = source.slice(source.indexOf('if (error)'), source.indexOf('if (data == null)'));
    expect(errorBranch).toContain('setUserMode(null)');
    expect(errorBranch).toContain('setUserModeError(true)');
    expect(errorBranch).not.toContain("setUserMode('reflective')");
  });

  it('fails closed when the profile row is missing', () => {
    expect(source).toContain('if (data == null)');
    const missingRowBranch = source.slice(
      source.indexOf('if (data == null)'),
      source.indexOf('A missing user_mode column value'),
    );
    expect(missingRowBranch).toContain('setUserMode(null)');
    expect(missingRowBranch).toContain('setUserModeError(true)');
    expect(missingRowBranch).not.toContain("?? 'reflective'");
  });

  it('cancels stale mode fetches with a request token instead of a by-value flag', () => {
    expect(source).toContain('requestIdRef');
    expect(source).toContain('requestId !== requestIdRef.current');
    expect(source).not.toContain('loadMode(user.id, isActive)');
  });
});

describe('ModeSelect already-set escape hatch', () => {
  const source = read('pages/onboarding/ModeSelect.tsx');

  it('treats already-set RPC errors as a redirect after reading user_mode', () => {
    expect(source).toContain("message.includes('already been set')");
    expect(source).toContain(".select('user_mode')");
    expect(source).toContain('setCurrentUserMode(resolvedMode)');
    expect(source).toContain('navigate(RoutePath.DASHBOARD, { replace: true })');
  });

  it('reads RPC error messages from plain objects as well as Error instances', () => {
    expect(source).toContain("'message' in err");
  });
});

describe('CreateNote gates AI features by mode', () => {
  const source = read('pages/dashboard/CreateNote.tsx');

  it('derives an aiEnabled flag from the resolved user mode', () => {
    expect(source).toContain('useUserMode');
    expect(source).toContain('isPrivateAiDisabled');
    expect(source).toContain('const aiEnabled =');
  });

  it('gates tag suggestions and the Reflect with AI button on aiEnabled', () => {
    expect(source).toContain('if (!aiEnabled) return;');
    expect(source).toContain('const canReflect = aiEnabled &&');
  });
});

describe('RecoverPrivateWriting is encrypted-only', () => {
  const source = read('App.tsx');

  it('wraps the recovery route in an encrypted mode guard', () => {
    const routeLine = source
      .split('\n')
      .find((line) => line.includes('RECOVER_PRIVATE_WRITING'));
    expect(routeLine).toBeDefined();
    expect(routeLine).toContain("withModeGuard");
    expect(routeLine).toContain("'encrypted'");
  });
});
