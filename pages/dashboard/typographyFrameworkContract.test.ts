import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) => readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

// Light gate for the typography framework (docs/brand/type-and-icon-framework.md).
// Authenticated surfaces resolve content roles to semantic .dashboard-* classes instead
// of arbitrary text-[Npx] literals. Public pages (FAQ/About/Privacy/Landing/Comparison)
// are intentionally out of scope and keep their editorial literals.
describe('typography framework contract', () => {
  it('routes MyNotes note cards through semantic role classes, not literals', () => {
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    expect(myNotes).toContain('dashboard-card-title');
    expect(myNotes).toContain('dashboard-editorial-preview');
    // Once migrated, the file carries no arbitrary px font-size literals.
    expect(myNotes).not.toMatch(/text-\[\d+px\]/);
  });
});
