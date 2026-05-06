import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('loading state source contract', () => {
  it('uses the shared lottie loading treatment instead of the fallback spinner', () => {
    const loadingState = read('components/ui/LoadingState.tsx');

    expect(loadingState).toContain("from 'lottie-react'");
    expect(loadingState).toContain("from '@/src/lottie/loading.json'");
    expect(loadingState).toContain('<Lottie');
    expect(loadingState).toContain('h-72 w-72');
    expect(loadingState).toContain('body-editorial');
    expect(loadingState).not.toContain('CircleNotch');
  });
});
