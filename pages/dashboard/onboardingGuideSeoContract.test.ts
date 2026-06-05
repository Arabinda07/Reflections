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
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const setupStep = read('features/private-writing-onboarding/PrivateWritingSetupStep.tsx');
    const hook = read('features/private-writing-onboarding/usePrivateWritingOnboarding.ts');
    const content = read('features/private-writing-onboarding/onboardingContent.ts');

    expect(home).toContain('PrivateWritingOnboardingFlow');
    expect(home).toContain('usePrivateWritingOnboarding');
    expect(home).toContain('setupEncryption={crypto.setupEncryption}');
    expect(home).toContain('confirmRecoveryKey={crypto.confirmRecoveryKey}');
    expect(home).not.toContain('profileService.getOnboardingState');
    expect(home).not.toContain('profileService.completeOnboarding');
    expect(home).not.toContain('PrivateWritingOnboardingSetup');

    expect(content).toContain('PRIVATE_WRITING_ONBOARDING_STEPS');
    expect(flow).toContain('onboardingStep');
    expect(flow).toContain('Step {onboardingStep + 1} of {PRIVATE_WRITING_ONBOARDING_STEPS.length}');
    expect(flow).toContain('onboarding-step-copy');
    expect(flow).toContain('Skip onboarding');
    expect(flow).toContain('disableDismiss={!canDismissOnboarding}');
    expect(flow).toContain('Back');
    expect(flow).toContain('Next');
    expect(flow).toContain('Begin writing');
    expect(flow).toContain('PrivateWritingSetupStep');
    expect(setupStep).toContain('Use my account password');
    expect(setupStep).toContain('Use a separate password');
    expect(content).toContain('Private and secure');
    expect(content).toContain('AI only runs if you specifically ask');
    expect(hook).toContain('profileService.getOnboardingState');
    expect(hook).toContain('profileService.completeOnboarding');
    expect(home).not.toContain('hasSeenOnboarding');
    expect(flow).toContain('aria-live="polite"');
  });

  it('keeps onboarding centered and non-repetitive on mobile', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const modalSheet = read('components/ui/ModalSheet.tsx');
    const modalCss = read('components/ui/modal-sheet.css');

    expect(flow).toContain('mobilePlacement="center"');
    expect(flow).toContain("title={shouldShowPrivateWritingSetup ? 'Set up private writing' : currentOnboardingStep.title}");
    expect(flow).not.toContain('description={currentOnboardingStep.body}');
    expect(flow).toContain('onboarding-footer-actions');
    expect(flow).toContain('sm:justify-between');
    expect(flow).toContain('onboarding-progress-rail');
    expect(home).not.toContain('const OnboardingIcon');
    expect(home).not.toContain('icon={<OnboardingIcon');

    expect(modalSheet).toContain("mobilePlacement?: 'bottom' | 'center'");
    expect(modalSheet).toContain('modal-sheet-root--center');
    expect(modalCss).toContain('.modal-sheet-root--center');
  });

  it('gives onboarding modal a distinctive editorial treatment', () => {
    const home = read('pages/dashboard/HomeAuthenticated.tsx');
    const flow = read('features/private-writing-onboarding/PrivateWritingOnboardingFlow.tsx');
    const modalCss = read('components/ui/modal-sheet.css');

    expect(flow).toContain('panelClassName="onboarding-modal-panel"');
    expect(flow).toContain('CurrentOnboardingIcon');
    expect(flow).toContain('onboarding-step-stage');
    expect(flow).toContain('onboarding-step-note');
    expect(flow).toContain('font-serif italic');
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
    const publicSeoCopy = read('src/config/publicSeoCopy.js');
    const tailwind = read('tailwind.config.js');

    expect(landing).not.toContain('usePWAInstall');
    expect(landing).not.toContain('Install app');
    expect(landing).toContain('HOME_SEO.heroLines[0]');
    expect(landing).toContain('HOME_SEO.heroLines[1]');
    expect(landing).toContain('HOME_SEO.heroLines[2]');
    expect(publicSeoCopy).toContain('Your mind');
    expect(publicSeoCopy).toContain('beautifully');
    expect(publicSeoCopy).toContain('organized');
    expect(landing).not.toContain('organized.');
    expect(landing).toContain('font-sans text-base font-normal');
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
    expect(bugReport).toContain('input-surface w-full min-h-[160px]');
    expect(bugReport).not.toContain('bg-body/50');
    expect(layout).not.toContain('openFeedbackDraft');
    expect(layout).not.toContain('Send feedback');
    const sidebar = read('layouts/MobileSidebar.tsx');
    expect(sidebar).toContain('const { canInstall, isInstalled, triggerInstall } = usePWAInstall();');
    expect(sidebar).toContain('canInstall && !isInstalled');
    expect(sidebar).toContain('aria-label="Add Reflections to your home screen"');
  });

  it('keeps the FAQ in its prior guide and feature-grid structure', () => {
    const faq = read('pages/dashboard/FAQ.tsx');
    const publicSeoCopy = read('src/config/publicSeoCopy.js');

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
    expect(publicSeoCopy).toContain('What is Reflections?');
    expect(publicSeoCopy).toContain('Reflections FAQ - Journaling, AI, Privacy, and Pricing');
    expect(publicSeoCopy).toContain(
      'Reflections is a private journal for writing notes, naming moods, adding tags, and noticing patterns over time.',
    );
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
    expect(generator).toContain("page.faqSchema");
    expect(generator).toContain("'@type': 'FAQPage'");
  });
});
