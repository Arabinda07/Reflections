import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('optimize audit contract', () => {
  it('keeps the app shell off speculative preloading and native-only boot code', () => {
    const app = read('App.tsx');
    const vite = read('vite.config.ts');

    expect(app).not.toContain('requestIdleCallback(preloadRoutes)');
    expect(app).not.toContain('setTimeout(preloadRoutes, 2000)');
    expect(app).not.toContain('const preloadRoutes = () =>');
    expect(app).not.toContain("from '@capacitor/app'");
    expect(app).not.toContain("from '@capacitor/core'");
    expect(app).not.toContain("from './src/auth/googleOAuth'");

    expect(app).toContain("await import('@capacitor/core')");
    expect(app).toContain("import('@capacitor/app')");
    expect(app).toContain("import('./src/auth/googleOAuth')");

    expect(vite).toContain("return 'vendor-core'");
    expect(vite).toContain("return 'vendor-routing'");
    expect(vite).toContain("return 'vendor-native'");
    expect(vite).toContain("return 'vendor-observability'");
  });

  it('removes perception-slow waits from the authenticated home prompt refresh', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).not.toContain('window.setTimeout(() => {');
    expect(homeAuthenticated).not.toContain('}, 600);');
  });

  it('drops dead public media that still bloats the shipped build', () => {
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/audio/music.ogg'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/awe.mp4'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/twist.mp4'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/user_hero.mp4'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/robot_meeting.mp4'))).toBe(false);
  });
});
