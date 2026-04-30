import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('app router compatibility', () => {
  it('keeps CreateNote route blocking on a data router shell', () => {
    const app = read('App.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('useBlocker(');
    expect(app).toContain('createBrowserRouter');
    expect(app).toContain('RouterProvider');
    expect(app).not.toContain('HashRouter as Router');
  });
});
