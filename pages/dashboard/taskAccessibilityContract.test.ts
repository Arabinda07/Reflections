import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('task accessibility source contract', () => {
  it('keeps SingleNote task controls named for assistive technology', () => {
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(singleNote).toContain('aria-label={task.completed ? `Mark "${taskLabel}" as open` : `Mark "${taskLabel}" as complete`}');
    expect(singleNote).toContain('aria-label={`Edit task: ${taskLabel}`}');
    expect(singleNote).toContain('aria-label={`Remove task: ${taskLabel}`}');
  });
});
