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

describe('ModeSelect retirement destination (ADR 0004)', () => {
  const source = read('pages/onboarding/ModeSelect.tsx');

  it('immediately redirects to the authenticated dashboard', () => {
    expect(source).toContain('navigate(RoutePath.DASHBOARD, { replace: true })');
  });

  it('renders a route loading frame while redirecting', () => {
    expect(source).toContain('<RouteLoadingFrame />');
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

describe('Life Wiki route unification (ADR 0004)', () => {
  const source = read('App.tsx');

  it('does not restrict Life Wiki or Sanctuary routes to reflective mode', () => {
    const lines = source.split('\n');
    const wikiLine = lines.find((line) => line.includes('RoutePath.WIKI'));
    const sanctuaryLine = lines.find((line) => line.includes('RoutePath.SANCTUARY}'));
    expect(wikiLine).toBeDefined();
    expect(wikiLine).not.toContain("'reflective'");
    expect(sanctuaryLine).toBeDefined();
    expect(sanctuaryLine).not.toContain("'reflective'");
  });
});

describe('CreateNote gates AI features with Pro teaser (ADR 0004)', () => {
  const source = read('pages/dashboard/CreateNote.tsx');

  it('derives an aiEnabled flag from the resolved user mode', () => {
    expect(source).toContain('useUserMode');
    expect(source).toContain('const aiEnabled =');
  });

  it('gates tag suggestions on aiEnabled and provides Pro teaser for reflection', () => {
    expect(source).toContain('if (!aiEnabled) return;');
    expect(source).toContain('const canReflect =');
    expect(source).toContain('isReflectProOpen');
    expect(source).toContain('ProUpgradeCTA');
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
