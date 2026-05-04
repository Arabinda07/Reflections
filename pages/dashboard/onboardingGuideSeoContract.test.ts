import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (filePath: string) =>
  readFileSync(path.resolve(process.cwd(), filePath), 'utf8');

const structuredDataTypes = () => {
  const indexHtml = read('index.html');
  const jsonLdMatch = indexHtml.match(
    /<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/,
  );

  expect(jsonLdMatch).not.toBeNull();

  const graph = JSON.parse(jsonLdMatch?.[1] || '[]') as Array<{ '@type': string }>;
  return graph.map((entry) => entry['@type']);
};

describe('onboarding, guide, install, feedback, and SEO contract', () => {
  it('keeps authenticated onboarding as a four-step writing-first dialog', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');

    expect(home).toContain('const ONBOARDING_STEPS');
    expect(home).toContain('onboardingStep');
    expect(home).toContain('Step {onboardingStep + 1} of {ONBOARDING_STEPS.length}');
    expect(home).toContain('onboarding-step-copy');
    expect(home).toContain('Skip onboarding');
    expect(home).toContain('Back');
    expect(home).toContain('Next');
    expect(home).toContain('Begin writing');
    expect(home).toContain('Private and secure');
    expect(home).toContain('AI only runs if you specifically ask');
    expect(home).toContain('hasSeenOnboarding');
    expect(home).toContain('aria-live="polite"');
  });

  it('keeps onboarding centered and non-repetitive on mobile', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const modalCss = read('components/ui/modal-sheet.css');

    expect(home).toContain('mobilePlacement="center"');
    expect(home).toContain('title={currentOnboardingStep.title}');
    expect(home).not.toContain('description={currentOnboardingStep.body}');
    expect(home).toContain('onboarding-footer-actions');
    expect(home).toContain('sm:justify-between');
    expect(home).toContain('onboarding-progress-rail');
    expect(home).not.toContain('const OnboardingIcon');
    expect(home).not.toContain('icon={<OnboardingIcon');

    expect(modalSheet).toContain("mobilePlacement?: 'bottom' | 'center'");
    expect(modalSheet).toContain('modal-sheet-root--center');
    expect(modalCss).toContain('.modal-sheet-root--center');
  });

  it('gives onboarding modal a distinctive editorial treatment', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const modalCss = read('components/ui/modal-sheet.css');

    expect(home).toContain('panelClassName="onboarding-modal-panel"');
    expect(home).toContain('CurrentOnboardingIcon');
    expect(home).toContain('onboarding-step-stage');
    expect(home).toContain('onboarding-step-note');
    expect(home).toContain('font-serif italic');
    expect(home).not.toContain('currentOnboardingStep.signal');
    expect(home).not.toContain('onboarding-step-index');
    expect(home).not.toContain('onboarding-step-folio');

    expect(modalCss).toContain('.onboarding-modal-panel .modal-sheet-title');
    expect(modalCss).toContain('font-family: var(--font-serif)');
    expect(modalCss).toContain('max-width: none');
    expect(modalCss).not.toContain('.onboarding-step-index');
    expect(modalCss).not.toContain('.onboarding-step-signal');
    expect(modalCss).not.toContain('.onboarding-step-folio');
  });

  it('keeps the landing page in its full-bleed hero form', () => {
    const landing = read('pages/dashboard/Landing.tsx');
    const tailwind = read('tailwind.config.js');

    expect(landing).not.toContain('usePWAInstall');
    expect(landing).not.toContain('Install app');
    expect(landing).toContain('Your mind');
    expect(landing).toContain('beautifully');
    expect(landing).toContain('organized');
    expect(landing).not.toContain('organized.');
    expect(landing).toContain('font-sans text-[19px] font-bold');
    expect(tailwind).toContain("editor: ['var(--font-editor)']");
    expect(landing).not.toContain('Plain answers');
    expect(landing).not.toContain('Last updated April 26, 2026');
  });

  it('keeps the original floating bug report and avoids footer feedback mailto actions', () => {
    const layout = read('layouts/DashboardLayout.tsx');
    const bugReport = read('layouts/BugReportFlow.tsx');

    expect(bugReport).toContain("import emailjs from '@emailjs/browser';");
    expect(bugReport).toContain('handleSubmit');
    expect(bugReport).toContain('Floating Bug Report Button');
    expect(bugReport).toContain('Report a bug');
    expect(layout).not.toContain('openFeedbackDraft');
    expect(layout).not.toContain('Send feedback');
    const sidebar = read('layouts/MobileSidebar.tsx');
    expect(sidebar).toContain('const { canInstall, isInstalled, triggerInstall } = usePWAInstall();');
    expect(sidebar).toContain('canInstall && !isInstalled');
    expect(sidebar).toContain('aria-label="Add Reflections to your home screen"');
  });

  it('keeps the FAQ in its prior guide and feature-grid structure', () => {
    const faq = read('pages/dashboard/FAQ.tsx');

    expect(faq).toContain('Untangle your');
    expect(faq).toContain('thoughts</span>');
    expect(faq).not.toContain('thoughts.</span>');
    expect(faq).toContain('const guideSections');
    expect(faq).toContain('const practiceItems');
    expect(faq).toContain('const detailItems');
    expect(faq).toContain('const featureGrid');
    expect(faq).toContain('What is Reflections?');
    expect(faq).toContain('Who is Reflections for?');
    expect(faq).toContain('Why writing first?');
    expect(faq).toContain('robinsaha434@gmail.com');
    expect(faq).not.toContain('What does Reflections do?');
    expect(faq).not.toContain('No. Reflections is not therapy');
  });

  it('publishes structured data for app, service, and install help in the global shell', () => {
    const indexHtml = read('index.html');
    const types = structuredDataTypes();

    expect(types).toContain('SoftwareApplication');
    expect(types).toContain('Service');
    expect(types).toContain('HowTo');
    expect(indexHtml).not.toContain('AI-powered');
    expect(indexHtml).not.toContain('therapy replacement');

    // FAQPage schema now lives in the /faq postbuild snapshot, not the global shell
    const generator = read('scripts/generate-public-seo-pages.mjs');
    expect(generator).toContain('"FAQPage"');
  });
});
