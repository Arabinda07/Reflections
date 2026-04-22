import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('remaining surfaces source contract', () => {
  it('keeps the guest home path lighter and the notes calendar lazy', () => {
    const home = read('pages/dashboard/Home.tsx');
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const loadingState = read('components/ui/LoadingState.tsx');

    expect(home).toContain("import('./HomeAuthenticated')");
    expect(home).not.toContain("from '../../services/noteService'");
    expect(home).not.toContain("from '../../src/supabaseClient'");

    expect(myNotes).not.toContain("import ReactCalendar from 'react-calendar'");
    expect(myNotes).not.toContain("import 'react-calendar/dist/Calendar.css'");
    expect(loadingState).not.toContain('DotLottieReact');
  });

  it('hardens the remaining note and account surfaces', () => {
    const singleNote = read('pages/dashboard/SingleNote.tsx');
    const account = read('pages/dashboard/Account.tsx');
    const vite = read('vite.config.ts');
    const landing = read('pages/dashboard/Landing.tsx');

    expect(singleNote).toContain('sanitizeNoteHtml');
    expect(singleNote).not.toContain('Math.random().toString(36).slice(2, 11)');
    expect(account).not.toContain("document.getElementById('avatar-upload')?.click()");
    expect(account).toContain('aria-label="Sign out of your account"');
    expect(account).toContain('aria-label="Discard account changes"');
    expect(account).toContain('aria-label="Save account changes"');

    expect(vite).not.toContain('50 * 1024 * 1024');
    expect(vite).not.toContain('mp4,ogg,m4a,json,spline,splinecode');
    expect(vite).toContain('manualChunks');

    expect(landing).not.toContain('rounded-full shadow-[0_8px_24px_-8px_rgba(22,163,74,0.4)]');
    expect(landing).not.toContain('backdrop-blur-md');
  });
});
