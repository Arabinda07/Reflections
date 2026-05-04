import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('CreateNote focus mode contract', () => {
  it('keeps focus mode opt-in and does not auto-focus the editor after the entry experience', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const focusModeHook = read('hooks/useFocusMode.ts');

    expect(focusModeHook).toContain('const [isEnabled, setIsEnabled] = useState(false);');
    expect(createNote).toContain('useFocusMode');
    expect(createNote).not.toContain('editorInstanceRef.current?.focus();');
  });

  it('quiets surrounding chrome without dimming the editor canvas itself', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('const isFocusModeActive =');
    expect(createNote).toContain('Focus mode');
    expect(createNote).toContain('Exit focus');
    expect(createNote).not.toContain('opacity-40 scale-[0.98]');
  });
});
