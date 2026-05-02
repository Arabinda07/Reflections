import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('optimize audit contract', () => {
  it('keeps the app shell off speculative preloading and native-only boot code', () => {
    const app = read('App.tsx');
    const vite = read('vite.config.ts');
    const statusBarHook = read('hooks/useNativeStatusBar.ts');
    const oauthHook = read('hooks/useNativeOAuthListener.ts');

    expect(app).not.toContain('requestIdleCallback(preloadRoutes)');
    expect(app).not.toContain('setTimeout(preloadRoutes, 2000)');
    expect(app).not.toContain('const preloadRoutes = () =>');
    expect(app).not.toContain("from '@capacitor/app'");
    expect(app).not.toContain("from '@capacitor/core'");
    expect(app).not.toContain("from './src/auth/googleOAuth'");

    expect(statusBarHook).toContain("await import('@capacitor/core')");
    expect(oauthHook).toContain("await import('@capacitor/core')");
    expect(oauthHook).toContain("import('@capacitor/app')");
    expect(oauthHook).toContain("import('../src/auth/googleOAuth')");

    expect(vite).toContain("return 'vendor-core'");
    expect(vite).toContain("return 'vendor-routing'");
    expect(vite).toContain("return 'vendor-native'");
    expect(vite).toContain("return 'vendor-observability'");
    expect(vite).toContain("return 'vendor-analytics'");
    expect(vite).toContain("return 'vendor-lottie'");
    expect(vite).toContain("return 'vendor-state'");
    expect(vite).toContain('const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);');
    expect(vite).toContain("const sentrySourcemap: false | 'hidden' = hasSentryAuthToken ? 'hidden' : false;");
    expect(vite).toContain('sourcemap: sentrySourcemap');
  });

  it('removes perception-slow waits from the authenticated home prompt refresh', () => {
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(homeAuthenticated).not.toContain('window.setTimeout(() => {');
    expect(homeAuthenticated).not.toContain('}, 600);');
  });

  it('keeps note routes free of artificial page and save delays', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const createNoteDraftState = read('pages/dashboard/createNoteDraftState.ts');
    const myNotes = read('pages/dashboard/MyNotes.tsx');

    expect(createNote).not.toContain('const [isBreathing');
    expect(createNote).not.toContain('setIsBreathing');
    expect(createNote).toContain('const showEntryExperience = loading;');
    expect(createNoteDraftState).toContain('CREATE_NOTE_SAVE_VISUAL_FLOOR_MS = 0');
    expect(myNotes).not.toContain('isContentVisible');
  });

  it('drops dead public media that still bloats the shipped build', () => {
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/audio/music.ogg'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/awe.mp4'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/twist.mp4'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/user_hero.mp4'))).toBe(false);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/robot_meeting.mp4'))).toBe(false);
  });

  it('ships optimized landing media for mobile first paint', () => {
    const landingPoster = path.resolve(process.cwd(), 'public/assets/videos/landing_video.webp');
    const mobileLandingPoster = path.resolve(process.cwd(), 'public/assets/videos/landing_video_mobile.webp');

    expect(existsSync(landingPoster)).toBe(true);
    expect(existsSync(mobileLandingPoster)).toBe(true);
    expect(existsSync(path.resolve(process.cwd(), 'public/assets/videos/landing_video.png'))).toBe(false);
    expect(statSync(landingPoster).size).toBeLessThan(240 * 1024);
    expect(statSync(mobileLandingPoster).size).toBeLessThan(120 * 1024);
  });
});
