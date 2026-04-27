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
    const css = read('index.css');

    expect(home).toContain('mobilePlacement="center"');
    expect(home).toContain('title={currentOnboardingStep.title}');
    expect(home).toContain('description={currentOnboardingStep.body}');
    expect(home).not.toContain('<OnboardingIcon size={28} weight="duotone" />');

    expect(modalSheet).toContain("mobilePlacement?: 'bottom' | 'center'");
    expect(modalSheet).toContain('modal-sheet-root--center');
    expect(css).toContain('.modal-sheet-root--center');
  });

  it('keeps the landing page in its full-bleed hero form', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).not.toContain('usePWAInstall');
    expect(landing).not.toContain('Install app');
    expect(landing).toContain('Your mind,');
    expect(landing).toContain('beautifully');
    expect(landing).toContain('organized.');
    expect(landing).not.toContain('Plain answers');
    expect(landing).not.toContain('Last updated April 26, 2026');
  });

  it('keeps the original floating bug report and avoids footer feedback mailto actions', () => {
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain("import emailjs from '@emailjs/browser';");
    expect(layout).toContain('handleBugSubmit');
    expect(layout).toContain('Floating Bug Report Button');
    expect(layout).toContain('Report a bug');
    expect(layout).not.toContain('openFeedbackDraft');
    expect(layout).not.toContain('Send feedback');
    expect(layout).toContain('const { canInstall, isInstalled, triggerInstall } = usePWAInstall();');
    expect(layout).toContain('canInstall && !isInstalled');
    expect(layout).toContain('aria-label="Add Reflections to your home screen"');
  });

  it('keeps the FAQ in its prior guide and feature-grid structure', () => {
    const faq = read('pages/dashboard/FAQ.tsx');

    expect(faq).toContain('Untangle your');
    expect(faq).toContain('thoughts.');
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

  it('publishes structured data for app, service, guide answers, and install help', () => {
    const indexHtml = read('index.html');
    const types = structuredDataTypes();

    expect(types).toContain('SoftwareApplication');
    expect(types).toContain('Service');
    expect(types).toContain('FAQPage');
    expect(types).toContain('HowTo');
    expect(indexHtml).toContain('Optional AI support only runs when the user asks for it.');
    expect(indexHtml).not.toContain('AI-powered');
    expect(indexHtml).not.toContain('therapy replacement');
  });
});
