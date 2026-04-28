import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('polish contract', () => {
  it('labels mobile CreateNote icon controls for assistive tech', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('aria-label="Back to notes"');
    expect(createNote).toContain('aria-label="Remove cover image"');
    expect(createNote).toContain('aria-label="Open reflection options"');
    expect(createNote).toContain('aria-label="Show another writing prompt"');
    expect(createNote).toContain('aria-label="Save reflection"');
    expect(createNote).toContain('aria-label="Reflection title"');
    expect(createNote).toContain('ariaLabel="Reflection body"');
    expect(createNote).toContain('aria-label={`Remove ${tag} tag`}');
  });

  it('keeps startup from showing a black empty media frame before video is ready', () => {
    const startupScreen = read('components/ui/StartupScreen.tsx');
    const appLaunch = read('src/native/appLaunch.ts');

    expect(startupScreen).toContain('isVideoReady');
    expect(startupScreen).toContain('isPosterReady');
    expect(startupScreen).toContain('onLoad={() => setIsPosterReady(true)}');
    expect(startupScreen).toContain('onLoadedData={() => setIsVideoReady(true)}');
    expect(startupScreen).toContain("isPosterReady && !isVideoReady ? 'opacity-85' : 'opacity-0'");
    expect(startupScreen).toContain("isVideoReady ? 'opacity-85' : 'opacity-0'");
    expect(startupScreen).toContain('opacity-0');
    expect(startupScreen).toContain('bg-[radial-gradient');
    expect(startupScreen).not.toContain('animate-pulse');
    expect(appLaunch).toContain('NATIVE_STARTUP_MIN_MS = 650');
  });
});
