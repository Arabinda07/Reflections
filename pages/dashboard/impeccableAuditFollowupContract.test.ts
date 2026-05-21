import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

describe('impeccable audit follow-up contract', () => {
  it('covers the non-bundle audit findings with explicit source-level guards', () => {
    const input = read('components/ui/Input.tsx');
    const account = read('pages/dashboard/Account.tsx');
    const createNote = read('pages/dashboard/CreateNote.tsx');
    const editor = read('components/ui/Editor.tsx');
    const quillCss = read('components/ui/quill-snow.css');
    const about = read('pages/dashboard/AboutArabinda.tsx');
    const indexHtml = read('index.html');
    const lottieAnimation = read('components/ui/LottieAnimation.tsx');
    const sanctuaryAnimation = read('src/lottie/sanctuaryAnimation.ts');

    expect(input).toContain('useId');
    expect(input).toContain('const inputId = props.id ?? generatedId;');
    expect(input).toContain('htmlFor={inputId}');
    expect(input).toContain('id={inputId}');

    expect(account).toContain('id="account-full-name"');
    expect(account).toContain('id="account-display-name"');
    expect(account).toContain('id="account-email"');
    expect(account).toContain('htmlFor="account-timezone"');
    expect(account).toContain('id="account-timezone"');

    expect(createNote).not.toContain('<main');
    expect(createNote).toContain('<section');
    expect(createNote).toContain('aria-labelledby="create-note-heading"');
    expect(createNote).toContain('id="create-note-heading"');
    expect(createNote).toContain('New reflection');
    expect(createNote).toContain('min-h-11');

    expect(editor).toContain('QUILL_TOOL_LABELS');
    expect(editor).toContain('applyToolbarAccessibility');
    expect(editor).toContain("setAttribute('aria-label'");
    expect(editor).toContain("setAttribute('type', 'button')");
    expect(quillCss).toContain('min-height: 44px;');
    expect(quillCss).toContain('min-width: 44px;');

    expect(about).not.toContain('lg:gap-24');
    expect(about).toContain('lg:gap-12');

    expect(indexHtml).not.toContain('landing_video_mobile.webp" as="image"');
    expect(indexHtml).not.toContain('landing_video.webp" as="image"');

    expect(sanctuaryAnimation).toContain("'/assets/lottie/level-up-animation.lottie'");
    expect(lottieAnimation).toContain("import { strFromU8, unzipSync } from 'fflate';");
    expect(lottieAnimation).toContain('loadLottieAnimation');
    expect(lottieAnimation).toContain("src.endsWith('.lottie')");
    expect(lottieAnimation).not.toContain('return res.json();');
  });

  it('pins the follow-up audit fixes without reintroducing the rejected landing CTA rail', () => {
    const lottieAnimation = read('components/ui/LottieAnimation.tsx');
    const landing = read('pages/dashboard/Landing.tsx');
    const faq = read('pages/dashboard/FAQ.tsx');
    const about = read('pages/dashboard/AboutArabinda.tsx');
    const css = read('index.css');
    const indexHtml = read('index.html');
    const insights = read('pages/dashboard/Insights.tsx');

    expect(lottieAnimation).toContain('animationId?: string;');
    expect(lottieAnimation).toContain('id={animationId}');

    expect(landing).not.toContain('<main aria-label="Welcome"');
    expect(faq).not.toContain('<main className=');
    expect(about).not.toContain('as="main"');

    expect(indexHtml).toContain('/assets/fonts/Spectral-Regular.woff2');
    expect(css).not.toContain('landing-secondary-cta');
    expect(landing).not.toContain('secondaryCtaRailClassName');
    expect(landing).not.toContain('secondaryCtaClassName');
    expect(landing).not.toContain('landing-secondary-cta');
    expect(landing).toContain('flex min-w-0 items-center gap-x-8 sm:gap-x-10');
    expect(landing).toContain('text-gray-nav transition-[color,transform] duration-200 ease-out-expo hover:-translate-y-px hover:text-green');
    expect(landing).not.toContain('text-white lg:text-gray-text');
    expect(landing).not.toContain('hover:text-white lg:hover:text-gray-text');
    expect(landing).toContain('surface-floating surface-floating--media');
    expect(landing).toContain('rounded-2xl !text-gray-text');
    expect(css).toContain('oklch(from var(--panel-bg) l c h / 0.44) 0%, transparent 24%');
    expect(css).not.toContain('panel-bg-rgb');
    expect(css).not.toContain('.landing-secondary-link');
    expect(css).not.toContain('.landing-media-toggle');
    expect(landing).not.toContain('rounded-full bg-[rgb(var(--panel-bg-rgb)/0.82)]');
    expect(insights).not.toContain('transition-[grid-template-rows');

    [
      'layouts/NavigationBar.tsx',
      'components/ui/Input.tsx',
      'components/ui/Toast.tsx',
      'pages/dashboard/CreateNote.tsx',
    ].forEach((file) => {
      expect(read(file), file).not.toContain('transition-all');
    });
  });
});
