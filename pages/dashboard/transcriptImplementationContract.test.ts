import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');

describe('transcript-inspired implementation contracts', () => {
  it('uses view-transition navigation where the plan called for native-feeling route changes', () => {
    const hook = read('hooks/useViewTransitionNavigation.ts');
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const singleNote = read('pages/dashboard/SingleNote.tsx');
    const insights = read('pages/dashboard/Insights.tsx');

    expect(hook).toContain('startViewTransition');
    expect(hook).toContain('prefers-reduced-motion');
    expect(myNotes).toContain('useViewTransitionNavigation');
    expect(singleNote).toContain('useViewTransitionNavigation');
    expect(insights).toContain('useViewTransitionNavigation');
  });

  it('adds gesture seams for sheets, sidebar, and note actions without removing confirmation', () => {
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const mobileSidebar = read('layouts/MobileSidebar.tsx');
    const myNotes = read('pages/dashboard/MyNotes.tsx');

    expect(modalSheet).toContain('modal-sheet-panel--dragging');
    expect(modalSheet).toContain('onPointerDown');
    expect(mobileSidebar).toContain('mobile-sidebar-shell--dragging');
    expect(mobileSidebar).toContain('onPointerDown');
    expect(myNotes).toContain('data-swipe-action-rail');
    expect(myNotes).toContain('initiateDelete');
    expect(myNotes).toContain('downloadNoteExport');
  });

  it('keeps mobile sidebar drag capture on a dedicated edge zone', () => {
    const mobileSidebar = read('layouts/MobileSidebar.tsx');
    const shellSegment = mobileSidebar.slice(
      mobileSidebar.indexOf('className={`mobile-sidebar-shell'),
      mobileSidebar.indexOf('data-sidebar-drag-zone'),
    );

    expect(mobileSidebar).toContain('data-sidebar-drag-zone');
    expect(mobileSidebar).toContain('onPointerDown={handleSidebarPointerDown}');
    expect(shellSegment).not.toContain('onPointerDown={handleSidebarPointerDown}');
  });
});
