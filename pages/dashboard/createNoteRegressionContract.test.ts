import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('CreateNote regression contract', () => {
  it('keeps the entry experience on a lottie-based loading state', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const trailLoadingMark = read('components/ui/TrailLoadingMark.tsx');

    expect(createNote).toContain("import('../../components/ui/TrailLoadingMark')");
    expect(createNote).toContain("import('../../components/ui/CompanionObservation')");
    expect(createNote).toContain("import('../../components/ui/PaperPlaneToast')");
    expect(createNote).toContain('<TrailLoadingMark />');
    expect(createNote).toContain('h-40 w-40');
    expect(trailLoadingMark).toContain("import Lottie from 'lottie-react'");
    expect(trailLoadingMark).toContain("from '@/src/lottie/trail-loading.json'");
    expect(createNote).not.toContain("from 'motion/react'");
    expect(createNote).not.toContain("from '../../components/ui/Magnetic'");
    expect(createNote).not.toContain("from '@/src/lottie/loading.json'");
  });

  it('hydrates the editor with fetched note HTML in edit mode', () => {
    const noteDraft = read('hooks/useNoteDraft.ts');
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(noteDraft).toContain('setContent(note.content);');
    expect(createNote).toContain('value={content}');
    expect(createNote).not.toContain('content={content}');
  });

  it('opens a blank new-note draft before remote wellness checks settle', () => {
    const noteDraft = read('hooks/useNoteDraft.ts');
    const newDraftBlock = noteDraft.slice(
      noteDraft.indexOf('if (!id) {'),
      noteDraft.indexOf('const access = await profileService.getWellnessAccess();', noteDraft.indexOf('if (!id) {')),
    );

    expect(noteDraft).toContain('openBlankDraftAfterMinimumDelay');
    expect(noteDraft).toContain("console.warn('[useNoteDraft] Could not verify note limits for new draft:'");
    expect(newDraftBlock).toContain('setBaselineSnapshot(buildCreateNoteDraftSnapshot(EMPTY_DRAFT_INPUT));');
    expect(newDraftBlock).toContain('openBlankDraftAfterMinimumDelay();');
    expect(newDraftBlock).toContain('await loadNewDraftAccess();');
  });
});
