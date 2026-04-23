import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('CreateNote regression contract', () => {
  it('keeps the entry experience on a lottie-based loading state', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('DotLottieReact');
    expect(createNote).toContain("from '@/src/lottie/trail-loading.json'");
    expect(createNote).toContain('h-48 w-48');
    expect(createNote).not.toContain("from '@/src/lottie/loading.json'");
  });

  it('hydrates the editor with fetched note HTML in edit mode', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('setContent(note.content);');
    expect(createNote).toContain('value={content}');
    expect(createNote).not.toContain('content={content}');
  });
});
