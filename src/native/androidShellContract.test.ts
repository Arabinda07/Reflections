import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Android shell contract', () => {
  it('drops the placeholder native splash and keeps launch polish in the in-app startup screen', () => {
    const capacitorConfig = read('capacitor.config.ts');
    const app = read('App.tsx');
    const styles = read('android/app/src/main/res/values/styles.xml');
    const authContext = read('context/AuthContext.tsx');

    expect(app).toContain('StatusBar.setOverlaysWebView');
    expect(capacitorConfig).not.toContain('SplashScreen: {');
    expect(app).not.toContain('@capacitor/splash-screen');
    expect(app).not.toContain('SplashScreen.hide');
    expect(styles).not.toContain('Theme.SplashScreen');
    expect(authContext).toContain('NATIVE_STARTUP_MIN_MS');
    expect(authContext).not.toContain('2500');
  });

  it('routes Android back presses through the shared registry and native toast bridge', () => {
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const backHook = read('src/native/useAndroidBackHandler.ts');
    const mainActivity = read('android/app/src/main/java/com/arabinda/reflections/MainActivity.java');

    expect(modalSheet).toContain('registerAndroidBackAction');
    expect(backHook).toContain('Press back again to exit');
    expect(backHook).toContain('App.exitApp');
    expect(backHook).toContain('nativeToast.show');
    expect(mainActivity).toContain('registerPlugin(NativeToastPlugin.class);');
  });

  it('returns successful native Google auth to home and keeps floating mobile chrome below the status bar', () => {
    const app = read('App.tsx');
    const googleOAuth = read('src/auth/googleOAuth.ts');
    const dashboardLayout = read('layouts/DashboardLayout.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const safeArea = read('src/native/safeArea.ts');

    expect(app).toContain('consumeNativeGoogleAuthSuccessRedirectPath');
    expect(app).toContain("import('@capacitor/browser')");
    expect(googleOAuth).toContain('skipBrowserRedirect: true');
    expect(googleOAuth).toContain("import('@capacitor/browser')");
    expect(googleOAuth).toContain('Browser.open');
    expect(dashboardLayout).toContain('NATIVE_TOP_CONTROL_OFFSET');
    expect(createNote).toContain('NATIVE_TOP_CONTROL_OFFSET');
    expect(createNote).toContain('NATIVE_PAGE_TOP_PADDING');
    expect(safeArea).toContain('env(safe-area-inset-top)');
  });
});
