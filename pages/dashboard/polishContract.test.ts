import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('polish surface contract', () => {
  it('defines shared scrim and floating-surface tokens', () => {
    const css = read('index.css');

    expect(css).toContain('.hero-scrim');
    expect(css).toContain('.hero-ink');
    expect(css).toContain('.screen-scrim');
    expect(css).toContain('.surface-floating');
    expect(css).toContain('.surface-floating--media');
    expect(css).toContain('.video-mask--mobile');
    expect(css).toContain('.video-mask--desktop');
  });

  it('removes the remaining raw scrims and inline color drift from the polished surfaces', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const landing = read('pages/dashboard/Landing.tsx');
    const layout = read('layouts/DashboardLayout.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const insights = read('pages/dashboard/Insights.tsx');
    const ambientButton = read('components/ui/AmbientMusicButton.tsx');
    const audioHook = read('hooks/useAmbientAudio.ts');

    expect(home).not.toContain('text-[rgb(255,255,255)]');
    expect(home).not.toContain('bg-[linear-gradient(180deg,rgba(14,28,18,0.18),rgba(14,28,18,0.3))]');
    expect(home).toContain('hero-ink');
    expect(home).toContain('screen-scrim');

    expect(landing).not.toContain('bg-[rgba(var(--panel-bg-rgb),0.62)]');
    expect(landing).not.toContain('hover:bg-[rgba(var(--panel-bg-rgb),0.76)]');
    expect(landing).toContain('video-mask--mobile');
    expect(landing).toContain('surface-floating--media');

    expect(layout).not.toContain('bg-[rgba(var(--panel-bg-rgb),0.82)]');
    expect(layout).toContain('screen-scrim');

    expect(createNote).not.toContain('bg-black/10');
    expect(createNote).not.toContain('bg-[rgba(var(--panel-bg-rgb),0.78)] text-white');
    expect(createNote).toContain('surface-floating');

    expect(insights).not.toContain('style={{ color }}');
    expect(insights).not.toContain('style={{ background }}');
    expect(insights).toContain('getMoodConfig');

    expect(audioHook).not.toContain('#fb923c');
    expect(audioHook).not.toContain('#4ade80');
    expect(audioHook).not.toContain('#818cf8');
    expect(audioHook).not.toContain('#34d399');

    expect(ambientButton).not.toContain("'#58cc02'");
    expect(ambientButton).not.toContain("'#ffffff'");
    expect(ambientButton).not.toContain("'rgba(39,39,42,0.86)'");
  });
});
