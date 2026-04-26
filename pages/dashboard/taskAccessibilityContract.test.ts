import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('task accessibility source contract', () => {
  it('keeps CreateNote task row controls named for assistive technology', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('aria-label={task.completed ? `Mark "${taskLabel}" as open` : `Mark "${taskLabel}" as complete`}');
    expect(createNote).toContain('aria-label={`Edit task: ${taskLabel}`}');
    expect(createNote).toContain('aria-label={`Remove task: ${taskLabel}`}');
  });

  it('keeps SingleNote task controls named for assistive technology', () => {
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(singleNote).toContain('aria-label={task.completed ? `Mark "${taskLabel}" as open` : `Mark "${taskLabel}" as complete`}');
    expect(singleNote).toContain('aria-label={`Edit task: ${taskLabel}`}');
    expect(singleNote).toContain('aria-label={`Remove task: ${taskLabel}`}');
  });
});
