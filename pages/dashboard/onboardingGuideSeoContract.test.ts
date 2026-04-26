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
    expect(home).toContain('Private by default');
    expect(home).toContain('AI is optional');
    expect(home).toContain('hasSeenOnboarding');
    expect(home).toContain('aria-live="polite"');
  });

  it('removes landing install prompts and adds machine-readable product answers', () => {
    const landing = read('pages/dashboard/Landing.tsx');

    expect(landing).not.toContain('usePWAInstall');
    expect(landing).not.toContain('Install app');
    expect(landing).toContain('Last updated April 26, 2026');
    expect(landing).toContain('What is Reflections?');
    expect(landing).toContain('Who is Reflections for?');
    expect(landing).toContain('Why writing first?');
  });

  it('keeps install in the mobile menu only and adds global feedback mailto actions', () => {
    const layout = read('layouts/DashboardLayout.tsx');

    expect(layout).toContain('const SUPPORT_EMAIL');
    expect(layout).toContain('openFeedbackDraft');
    expect(layout).toContain('Send feedback');
    expect(layout).toContain('mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent');
    expect(layout).toContain('const { canInstall, isInstalled, triggerInstall } = usePWAInstall();');
    expect(layout).toContain('canInstall && !isInstalled');
    expect(layout).toContain('aria-label="Add Reflections to your home screen"');
  });

  it('turns FAQ into an editorial guide that answers the required product questions', () => {
    const faq = read('pages/dashboard/FAQ.tsx');

    expect(faq).toContain('Untangle your');
    expect(faq).toContain('thoughts.');
    expect(faq).toContain('What is Reflections?');
    expect(faq).toContain('Who is Reflections for?');
    expect(faq).toContain('What does Reflections do?');
    expect(faq).toContain('Is Reflections private?');
    expect(faq).toContain('Does AI run automatically?');
    expect(faq).toContain('Is Reflections therapy?');
    expect(faq).toContain('No. Reflections is not therapy');
    expect(faq).toContain('How do Free and Pro work?');
    expect(faq).toContain('Can I export or keep ownership of my notes?');
    expect(faq).toContain('robinsaha434@gmail.com');
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
