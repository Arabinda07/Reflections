import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) => readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

// Light gate for the icon framework (docs/brand/type-and-icon-framework.md).
// Authenticated surfaces use one canonical icon per concept and drop decorative
// tone-icon tiles. Meaningful tone-icon boxes (action sheets, list rows) are kept.
const MENU_FILES = [
  'pages/dashboard/MyNotes.tsx',
  'pages/dashboard/SingleNote.tsx',
  'pages/dashboard/CreateNote.tsx',
  'pages/dashboard/RelationshipProfile.tsx',
  'layouts/AuthenticatedMobileNav.tsx',
];

describe('icon framework contract', () => {
  it('uses one overflow-menu icon (SquaresFour), not DotsThreeCircle or DotsThreeVertical', () => {
    for (const file of MENU_FILES) {
      expect(read(file), file).not.toContain('DotsThreeCircle');
      expect(read(file), file).not.toContain('DotsThreeVertical');
      expect(read(file), file).toContain('SquaresFour');
    }
  });

  it('uses one export icon (DownloadSimple) and one write icon (PencilSimpleLine)', () => {
    for (const file of ['pages/dashboard/MyNotes.tsx', 'pages/dashboard/SingleNote.tsx']) {
      const src = read(file);
      // plain Download / PencilSimple imports collapsed into the *Simple(Line) canon
      expect(src, file).not.toContain("@phosphor-icons/react/Download'");
      expect(src, file).not.toContain("@phosphor-icons/react/PencilSimple'");
      expect(src, file).toContain('DownloadSimple');
      expect(src, file).toContain('PencilSimpleLine');
    }
  });

  it('drops the decorative tone-icon tile from the Insights wiki card', () => {
    const insights = read('pages/dashboard/Insights.tsx');
    expect(insights).not.toContain('tone-icon tone-icon-sage h-14');
  });
});
