import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('contrast and visual accessibility contract', () => {
  it('enforces accessible input labels in Input component without dark border inversion', () => {
    const inputTsx = read('components/ui/Input.tsx');

    // dark:text-border collapses contrast to ~1.3:1 in dark mode
    expect(inputTsx).not.toContain('dark:text-border');
    expect(inputTsx).not.toContain('text-border');
    expect(inputTsx).toContain('text-gray-nav');
  });

  it('prohibits excessively attenuated placeholder opacities across forms', () => {
    const futureLetters = read('pages/dashboard/FutureLetters.tsx');
    const releaseMode = read('pages/dashboard/ReleaseMode.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');

    expect(futureLetters).not.toContain('placeholder:text-gray-nav/35');
    expect(releaseMode).not.toContain('placeholder:text-gray-nav/35');
    expect(createNote).not.toContain('placeholder:text-gray-nav/40');
  });

  it('supports semantic tone prop on Button to prevent child span contract evasion', () => {
    const buttonTsx = read('components/ui/Button.tsx');
    const insightsTsx = read('pages/dashboard/Insights.tsx');
    const myNotesTsx = read('pages/dashboard/MyNotes.tsx');

    expect(buttonTsx).toContain("tone?: 'default' | 'green' | 'clay'");
    expect(insightsTsx).toContain('tone="green"');
    expect(insightsTsx).not.toContain('<span className="text-green">Write something</span>');
    expect(myNotesTsx).toContain('tone="clay"');
    expect(myNotesTsx).not.toContain('<span className="text-clay">Clear filter</span>');
  });

  it('ensures continuous integration executes linting and vitest suites', () => {
    const ciYml = read('.github/workflows/ci.yml');
    const packageJson = JSON.parse(read('package.json'));

    expect(ciYml).toContain('npm run lint');
    expect(ciYml).toContain('npm test');
    expect(packageJson.scripts.test).toBe('vitest run');
    expect(packageJson.scripts.lint).toContain('eslint .');
  });
});
