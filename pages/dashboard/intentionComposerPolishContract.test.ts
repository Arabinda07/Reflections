import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('intention composer polish contract', () => {
  it('uses a soft shared composer surface instead of the global hard input outline', () => {
    const css = read('index.css');
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(css).toContain('.intention-entry-control');
    expect(css).toContain('min-height: 46px;');
    expect(css).toContain('.intention-entry-control:focus-within');
    expect(css).toContain('.intention-entry-input:focus-visible');
    expect(css).not.toContain('.intention-entry-control:focus-within {\n    border-color: var(--green)');

    expect(home).toContain('className="intention-entry-control flex-1"');
    expect(home).toContain('className="intention-entry-input"');
    expect(createNote).toContain('className="intention-entry-control flex-1"');
    expect(createNote).toContain('className="intention-entry-input"');
  });
});
