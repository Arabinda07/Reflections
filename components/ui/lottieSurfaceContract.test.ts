import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('lottie surface mapping contract', () => {
  it('keeps each surface on its intended lottie file', () => {
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const loadingState = read('components/ui/LoadingState.tsx');
    const paperPlaneToast = read('components/ui/PaperPlaneToast.tsx');
    const routeErrorBoundary = read('pages/RouteErrorBoundary.tsx');

    expect(createNote).toContain("from '@/src/lottie/trail-loading.json'");
    expect(createNote).not.toContain("from '@/src/lottie/loading.json'");

    expect(loadingState).toContain("from '@/src/lottie/loading.json'");
    expect(paperPlaneToast).toContain("from '@/src/lottie/paperplane.json'");
    expect(routeErrorBoundary).toContain("from '@/src/lottie/error-404.json'");
  });
});
