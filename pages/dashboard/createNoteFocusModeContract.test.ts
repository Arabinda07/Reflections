import path from 'node:path';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('CreateNote focus mode contract', () => {
  it('keeps focus mode opt-in and puts the cursor in the editor on open', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const focusModeHook = read('hooks/useFocusMode.ts');

    expect(focusModeHook).toContain('const [isEnabled, setIsEnabled] = useState(false);');
    expect(createNote).toContain('useFocusMode');
    expect(createNote).toContain('editorInstanceRef.current?.focus();');
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

  it('keeps the with-person action at the shared touch target size on desktop', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const personActionLabel = 'aria-label="Add or view people in this reflection"';
    const personActionIndex = createNote.indexOf(personActionLabel);

    expect(personActionIndex).toBeGreaterThan(-1);

    const personActionButtonBlock = createNote.slice(personActionIndex - 400, personActionIndex + 100);

    expect(personActionButtonBlock).toContain('min-h-11');
    expect(personActionButtonBlock).not.toContain('sm:min-h-0');
    expect(personActionButtonBlock).not.toContain('sm:py-1');
  });
});
