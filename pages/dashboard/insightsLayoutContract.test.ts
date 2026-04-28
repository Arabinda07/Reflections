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
    expect(insights).toContain('whitespace-nowrap');
    expect(css).toContain('.insights-section-header .section-header-title');
    expect(css).toContain('white-space: nowrap');
  });
});
