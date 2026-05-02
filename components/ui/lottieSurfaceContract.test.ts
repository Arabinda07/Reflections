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
    const lottieAnimation = read('components/ui/LottieAnimation.tsx');
    const notFound = read('pages/NotFound.tsx');
    const myNotes = read('pages/dashboard/MyNotes.tsx');
    const lifeWiki = read('pages/dashboard/LifeWiki.tsx');

    expect(createNote).toContain("from '@/src/lottie/trail-loading.json'");
    expect(createNote).not.toContain("from '@/src/lottie/loading.json'");

    expect(loadingState).toContain("from '@/src/lottie/loading.json'");
    expect(paperPlaneToast).toContain("from '@/src/lottie/paperplane.json'");
    expect(routeErrorBoundary).toContain("import('../components/ui/LottieAnimation')");
    expect(routeErrorBoundary).toContain('error404Animation');
    expect(lottieAnimation).toContain("from '@lottiefiles/dotlottie-react'");
    expect(notFound).toContain('/assets/lottie/Error 404.json');
    expect(myNotes).toContain('/assets/lottie/empty%20notes.json');
    expect(lifeWiki).toContain('/assets/lottie/Level%20Up%20Animation.json');
    expect(lifeWiki).toContain('const [isEnteringWiki, setIsEnteringWiki]');
    expect(lifeWiki).toContain('location.pathname === RoutePath.WIKI');
    expect(lifeWiki).toContain('isRefreshingWiki || isEnteringWiki');
  });
});
