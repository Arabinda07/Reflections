import { describe, expect, it } from 'vitest';
import fs from 'node:fs';

const read = (path: string) => fs.readFileSync(path, 'utf8');

describe('transcript-inspired implementation contracts', () => {
  it('opts into platform text scaling and centralizes view transition capability checks', () => {
    const indexHtml = read('index.html');
    const transitionUtils = read('hooks/viewTransitionUtils.ts');
    const hook = read('hooks/useViewTransitionNavigation.ts');

    expect(indexHtml).toContain('<meta name="text-scale" content="scale" />');
    expect(indexHtml).not.toContain('layoutsubtree');
    expect(indexHtml).not.toContain('drawElementImage');
    expect(transitionUtils).toContain('export const prefersReducedMotion');
    expect(transitionUtils).toContain('export const supportsViewTransitions');
    expect(transitionUtils).toContain('export const supportsScopedViewTransitions');
    expect(transitionUtils).toContain('export const runScopedTransition');
    expect(transitionUtils).toContain('Element & {');
    expect(transitionUtils).toContain('startViewTransition?:');
    expect(transitionUtils).toContain('prefers-reduced-motion: reduce');
    expect(hook).toContain("from './viewTransitionUtils'");
  });

  it('uses view-transition navigation where the plan called for native-feeling route changes', () => {
    const hook = read('hooks/useViewTransitionNavigation.ts');
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const singleNote = read('pages/dashboard/SingleNote.tsx');
    const insights = read('pages/dashboard/Insights.tsx');

    expect(hook).toContain('startViewTransition');
    expect(hook).toContain('supportsViewTransitions');
    expect(hook).toContain('try');
    expect(hook).toContain('catch');
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

  it('uses scoped transitions for quiet in-page state changes and keeps gestures tactile', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const insights = read('pages/dashboard/Insights.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const mobileSidebar = read('layouts/MobileSidebar.tsx');

    expect(myNotes).toContain('runScopedTransition');
    expect(myNotes).toContain('notesViewScopeRef');
    expect(myNotes).toContain('handleViewModeChange');
    expect(myNotes).toContain('handleTagFilterChange');
    expect(myNotes).toContain('const rawNavigate = useNavigate();');
    expect(myNotes).toContain('NOTE_SWIPE_OPEN_THRESHOLD');
    expect(myNotes).toContain('haptics.light()');
    expect(modalSheet).toContain('dragOffsetYRef');
    expect(insights).toContain('runScopedTransition');
    expect(insights).toContain('insightsScopeRef');
    expect(insights).toContain('toggleInsightPanel');
    expect(lifeWiki).toContain('runScopedTransition');
    expect(lifeWiki).toContain('lifeWikiScopeRef');
    expect(modalSheet).toContain('SHEET_DRAG_CLOSE_THRESHOLD');
    expect(modalSheet).toContain('SHEET_DRAG_MINIMUM_MOVEMENT');
    expect(modalSheet).toContain('useHaptics');
    expect(mobileSidebar).toContain('SIDEBAR_DRAG_CLOSE_THRESHOLD');
    expect(mobileSidebar).toContain('SIDEBAR_DRAG_MINIMUM_MOVEMENT');
    expect(mobileSidebar).toContain('useHaptics');
  });

  it('keeps modern CSS enhancements progressive and reduced-motion aware', () => {
    const css = read('index.css');
    const modalCss = read('components/ui/modal-sheet.css');

    expect(css).toContain('@supports (color: light-dark(white, black))');
    expect(css).toContain('--native-control-accent');
    expect(css).toContain('@supports (color: contrast-color(white))');
    expect(css).toContain('color: var(--auto-contrast-ink)');
    expect(css).toContain('@supports (corner-shape: bevel)');
    expect(css).not.toContain('@supports (animation-trigger: --reflections-scroll-reveal)');
    expect(css).toContain('::view-transition-old(root)');
    expect(css).toContain('::view-transition-new(root)');
    expect(css).toContain('@media (prefers-reduced-motion: reduce)');
    expect(modalCss).toContain('transition-behavior: allow-discrete');
    expect(modalCss).toContain('@starting-style');
  });
});
