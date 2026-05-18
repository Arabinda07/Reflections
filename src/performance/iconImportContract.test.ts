import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const sourceRoots = ['components', 'hooks', 'layouts', 'pages', 'src'];

const collectSourceFiles = (directory: string): string[] => {
  const absoluteDirectory = path.resolve(process.cwd(), directory);

  return readdirSync(absoluteDirectory).flatMap((entry) => {
    const absoluteEntry = path.join(absoluteDirectory, entry);
    const relativeEntry = path.relative(process.cwd(), absoluteEntry);

    if (statSync(absoluteEntry).isDirectory()) {
      return collectSourceFiles(relativeEntry);
    }

    return /\.(ts|tsx)$/.test(entry) ? [relativeEntry] : [];
  });
};

describe('Phosphor icon import contract', () => {
  it('uses direct icon subpath imports instead of the package barrel', () => {
    const sourceFiles = sourceRoots
      .flatMap(collectSourceFiles)
      .filter((filePath) => !filePath.includes('.test.'));
    const offenders = sourceFiles.filter((filePath) => {
      const source = readFileSync(path.resolve(process.cwd(), filePath), 'utf8');
      return source.includes("from '@phosphor-icons/react';") ||
        source.includes('from "@phosphor-icons/react";');
    });

    expect(offenders).toEqual([]);
  });
});
