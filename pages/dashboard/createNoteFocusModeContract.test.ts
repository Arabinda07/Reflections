import path from 'node:path';
import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('CreateNote focus mode removal contract', () => {
  it('removes focus mode state, hook, and visible controls', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const focusModeHookPath = path.resolve(process.cwd(), 'hooks/useFocusMode.ts');

    expect(existsSync(focusModeHookPath)).toBe(false);
    expect(createNote).not.toContain('useFocusMode');
    expect(createNote).not.toContain('isFocusMode');
    expect(createNote).not.toContain('Focus mode');
    expect(createNote).not.toContain('Exit focus');
    expect(createNote).not.toContain('aria-pressed={isFocusModeEnabled}');
    expect(createNote).not.toContain('setIsFocused');
    expect(createNote).not.toContain('setIsTitleFocused');
    expect(createNote).not.toContain('onFocusChange=');
    expect(createNote).not.toContain('editorInstanceRef.current?.focus();');
  });

  it('keeps writing tools as the secondary editor controls entrypoint', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('isWritingToolsOpen');
    expect(createNote).toContain('Writing tools');
    expect(createNote).toContain('openWritingTools');
    expect(createNote).toContain('renderWritingToolGrid');
    expect(createNote).toContain('aria-label="Open writing tools"');
    expect(createNote).not.toContain('isMobileOptionsOpen');
    expect(createNote).not.toContain('Desktop Sidebar');
    expect(createNote).not.toContain('Personalize');
  });

  it('keeps the editor layout stable without focus-mode distortion', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('editor-writing-measure mr-auto lg:ml-12 xl:ml-24');
    expect(createNote).toContain('opacity-100 translate-y-0');
    expect(createNote).not.toContain('scale-[1.02]');
    expect(createNote).not.toContain('opacity-0 translate-y-8');
    expect(createNote).not.toContain('opacity-0 -translate-y-4');
    expect(createNote).not.toContain('mx-auto scale');
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

  it('switches the floating action from prompt to save when title or body text exists', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(createNote).toContain('const hasDraftText = Boolean(draft.currentSnapshot.title || draft.currentSnapshot.content);');
    expect(createNote).toContain('{!hasDraftText ? (');
    expect(createNote).toContain('aria-label="Show another writing prompt"');
    expect(createNote).toContain('aria-label="Choose what to do with this reflection"');
    expect(createNote).toContain('Save reflection');
    expect(createNote).toContain('Release');
    expect(createNote).not.toContain('const hasContent = Boolean(draft.currentSnapshot.content);');
    expect(createNote).not.toContain('{!hasContent ? (');
  });
});
