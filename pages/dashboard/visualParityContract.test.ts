import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('visual parity contract', () => {
  it('keeps the welcome banner name legible against media-heavy backgrounds', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const css = read('index.css');

    expect(css).toContain('.hero-ink-accent');
    expect(home).toContain('hero-ink-accent');
    expect(home).not.toContain('text-green drop-shadow-none');
  });

  it('keeps the Reflect with AI action horizontally locked and prevents sound rows from using a perpetual spinner', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('Reflect with AI');
    expect(createNote).toContain('whitespace-nowrap');
    expect(createNote).toContain('pendingTrackId');
    expect(createNote).toContain('Starting...');
    expect(createNote).toContain('Playing');
    expect(createNote).not.toContain(
      '{activeMusicTrack?.id === track.id && <CircleNotch size={16} className="animate-spin" />}',
    );
  });

  it('reframes the mobile landing video to preserve the subject on the left edge', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).toContain('object-[70%_center]');
    expect(landing).toContain('sm:object-[64%_center]');
    expect(landing).not.toContain('object-[82%_center]');
  });
});
