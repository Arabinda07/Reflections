import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Android shell contract', () => {
  it('moves splash and status-bar control into the native shell and shortens the in-app wait', () => {
    const capacitorConfig = read('capacitor.config.ts');
    const app = read('App.tsx');
    const authContext = read('context/AuthContext.tsx');

    expect(capacitorConfig).toContain('launchAutoHide: false');
    expect(app).toContain('StatusBar.setOverlaysWebView');
    expect(app).toContain('SplashScreen.hide');
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
});
