import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('mood modal stage contract', () => {
  it('keeps the shared mood picker stage-aware without duplicating broad-stage copy', () => {
    const moodPicker = read('pages/dashboard/MoodPicker.tsx');

    expect(moodPicker).toContain("export type MoodPickerStage = 'group' | 'detail';");
    expect(moodPicker).toContain('onStageChange?: (stage: MoodPickerStage) => void;');
    expect(moodPicker).toContain("onStageChange(selectedGroup ? 'detail' : 'group');");
    expect(moodPicker).toContain('Want a closer word?');
    expect(moodPicker).toContain('Choose one, or keep it broad.');
    expect(moodPicker).not.toContain('How does it feel right now?');
    expect(moodPicker).not.toContain('Pick a broad mood. Details are optional.');
  });

  it('lets mood modals hide their broad-stage header while preserving accessible dialog names', () => {
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const homeAuthenticated = read('pages/dashboard/HomeAuthenticated.tsx');
    const singleNote = read('pages/dashboard/SingleNote.tsx');

    expect(modalSheet).toContain('ariaLabel?: string;');
    expect(modalSheet).toContain('aria-label={!title && ariaLabel ? ariaLabel : undefined}');

    [createNote, homeAuthenticated, singleNote].forEach((source) => {
      expect(source).toContain("useState<MoodPickerStage>('group')");
      expect(source).toContain("title={moodPickerStage === 'group' ? 'How does it feel right now?' : undefined}");
      expect(source).toContain("description={moodPickerStage === 'group' ? 'Pick a broad mood. Details are optional.' : undefined}");
      expect(source).toContain('ariaLabel="Choose a mood for this reflection"');
      expect(source).toContain('onStageChange={setMoodPickerStage}');
    });
  });
});
