import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Android shell contract', () => {
  it('drops the placeholder native splash and keeps launch polish in the in-app startup screen', () => {
    const capacitorConfig = read('capacitor.config.ts');
    const app = read('App.tsx');
    const authenticatedShell = read('layouts/AuthenticatedAppShell.tsx');
    const statusBarHook = read('hooks/useNativeStatusBar.ts');
    const styles = read('android/app/src/main/res/values/styles.xml');
    const appBootstrapper = read('components/ui/AppBootstrapper.tsx');

    expect(app).not.toContain("import { useNativeStatusBar }");
    expect(authenticatedShell).toContain('useNativeStatusBar');
    expect(statusBarHook).toContain('StatusBar.setOverlaysWebView');
    expect(capacitorConfig).not.toContain('SplashScreen: {');
    expect(app).not.toContain('@capacitor/splash-screen');
    expect(app).not.toContain('SplashScreen.hide');
    expect(styles).not.toContain('Theme.SplashScreen');
    expect(appBootstrapper).toContain('NATIVE_STARTUP_MIN_MS');
    expect(appBootstrapper).not.toContain('2500');
  });

  it('routes Android back presses through the shared registry and native toast bridge', () => {
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const backHook = read('src/native/useAndroidBackHandler.ts');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const mainActivity = read('android/app/src/main/java/com/arabinda/reflections/MainActivity.java');

    const mobileSidebar = read('layouts/MobileSidebar.tsx');

    expect(modalSheet).toContain('registerAndroidBackAction');
    expect(backHook).toContain('Press back again to exit');
    expect(backHook).toContain('App.exitApp');
    expect(backHook).toContain('nativeToast.show');
    expect(backHook).toContain("navigate(fallbackOutcome.path)");
    expect(backHook).toContain('isListenerActive');
    expect(backHook).toContain('lastExitPromptAtRef.current = null');
    expect(mobileSidebar).toContain('onBugReport');
    expect(mainActivity).toContain('registerPlugin(NativeToastPlugin.class);');
  });

  it('returns successful native Google auth to home and keeps floating mobile chrome below the status bar', () => {
    const app = read('App.tsx');
    const authenticatedShell = read('layouts/AuthenticatedAppShell.tsx');
    const oauthHook = read('hooks/useNativeOAuthListener.ts');
    const googleOAuth = read('src/auth/googleOAuth.ts');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const safeArea = read('src/native/safeArea.ts');

    expect(app).toContain("import { useNativeOAuthListener }");
    expect(authenticatedShell).not.toContain('useNativeOAuthListener');
    expect(oauthHook).toContain('consumeNativeGoogleAuthSuccessRedirectPath');
    expect(oauthHook).toContain("import('@capacitor/browser')");
    expect(googleOAuth).toContain('skipBrowserRedirect: true');
    expect(googleOAuth).toContain("import('@capacitor/browser')");
    expect(googleOAuth).toContain('Browser.open');
    const mobileSidebar = read('layouts/MobileSidebar.tsx');
    expect(mobileSidebar).toContain('NATIVE_TOP_CONTROL_OFFSET');
    expect(createNote).toContain('NATIVE_TOP_CONTROL_OFFSET');
    expect(createNote).toContain('NATIVE_PAGE_TOP_PADDING');
    expect(safeArea).toContain('env(safe-area-inset-top)');
  });
});
