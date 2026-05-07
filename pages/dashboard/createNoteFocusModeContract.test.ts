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

  it('keeps the focus mode toggle at the shared touch target size on desktop', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const focusModeAttribute = 'aria-pressed={isFocusModeEnabled}';
    const focusModeIndex = createNote.indexOf(focusModeAttribute);

    expect(focusModeIndex).toBeGreaterThan(-1);

    const focusModeButtonBlock = createNote.slice(focusModeIndex, focusModeIndex + 520);

    expect(focusModeButtonBlock).toContain('min-h-11');
    expect(focusModeButtonBlock).not.toContain('sm:min-h-0');
    expect(focusModeButtonBlock).not.toContain('sm:py-1');
  });

  it('keeps the reflect with AI action at the shared touch target size on desktop', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const reflectActionLabel = 'Reflect with AI';
    const reflectActionIndex = createNote.indexOf(reflectActionLabel);

    expect(reflectActionIndex).toBeGreaterThan(-1);

    const reflectActionButtonBlock = createNote.slice(reflectActionIndex - 520, reflectActionIndex + 120);

    expect(reflectActionButtonBlock).toContain('min-h-11');
    expect(reflectActionButtonBlock).not.toContain('sm:min-h-0');
    expect(reflectActionButtonBlock).not.toContain('sm:py-1');
  });
});
