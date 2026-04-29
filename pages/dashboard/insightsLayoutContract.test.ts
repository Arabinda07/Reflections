import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('Insights layout contract', () => {
  it('keeps the page heading on one line without shrinking the whole app header system', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    const css = read('index.css');

    expect(insights).toContain('className="insights-section-header"');
    expect(css).toContain('.insights-section-header .section-header-title');
    expect(css).toContain('white-space: nowrap');
  });

  it('adds the weekly recap from standalone engagement signals without streak copy', () => {
    const insights = read('pages/dashboard/Insights.tsx');

    expect(insights).toContain('buildWeeklyRecap');
    expect(insights).toContain('moodCheckinService.list');
    expect(insights).toContain('ritualEventService.listSince');
    expect(insights).toContain('This week');
    expect(insights).toContain('Mood frequency');
    expect(insights).toContain('weeklyRecap.moodData');
    expect(insights).toContain('Overview');
    expect(insights).toContain('Completion card');
    expect(insights).not.toContain('nextQuestion');
    expect(insights).not.toContain('Common mood');
    expect(insights.toLowerCase()).not.toMatch(/\b(streak|lost|xp|leaderboard)\b/);
    expect(insights).not.toMatch(/>\s*Failed/i);
  });
});
