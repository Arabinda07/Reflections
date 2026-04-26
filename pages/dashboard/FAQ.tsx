import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookOpen,
  Brain,
  Checks,
  Compass,
  EnvelopeSimple,
  Heart,
  PenNib,
  ShieldCheck,
  Tag,
} from '@phosphor-icons/react';

import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

const guideSections = [
  {
    icon: BookOpen,
    title: 'What is Reflections?',
    body:
      'Reflections is a private writing-first wellness journal. It helps you write honestly, save what matters, notice patterns, and return to your own words without pressure.',
  },
  {
    icon: Heart,
    title: 'Who is Reflections for?',
    body:
      'It is for people who want a calm place to think in writing. It is useful when your thoughts feel scattered, when you want a record of what keeps returning, or when you need a quieter alternative to habit apps.',
  },
  {
    icon: PenNib,
    title: 'What does Reflections do?',
    body:
      'You can write notes, add moods and tags, keep small tasks near your prose, attach context, and revisit your saved reflections. The product is built around writing before dashboards.',
  },
  {
    icon: ShieldCheck,
    title: 'Is Reflections private?',
    body:
      'Your notes stay tied to your account and are not public. Privacy copy stays plain on purpose: Reflections should make control understandable without overpromising what software cannot guarantee.',
  },
  {
    icon: Brain,
    title: 'Does AI run automatically?',
    body:
      'No. AI-supported reflections and Life Wiki refreshes run only when you choose them. Optional AI support stays out of the way until you ask for it.',
  },
  {
    icon: Compass,
    title: 'Is Reflections therapy?',
    body:
      'No. Reflections is not therapy, a diagnosis tool, or professional mental health care. It is a private writing space for noticing your own thoughts more clearly.',
  },
  {
    icon: Checks,
    title: 'How do Free and Pro work?',
    body:
      'The free plan includes 30 notes each month, one AI reflection, and one Life Wiki refresh after there is enough writing to support it. Pro keeps writing unlimited and lets you refresh AI-supported views whenever you ask.',
  },
  {
    icon: Tag,
    title: 'Can I export or keep ownership of my notes?',
    body:
      'Your writing belongs to you. Today, saved notes remain in your account and support can help with access or deletion requests. A fuller self-serve export path should stay on the product improvement list.',
  },
];

const detailItems = [
  'Writing remains the first action on the page.',
  'Mood and tag patterns are there to help you notice, not score yourself.',
  'Life Wiki and AI-supported views are refreshed only when you ask.',
  'Pro language is about continuity and room, not pressure.',
];

export const FAQ: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-full bg-body pb-28 text-gray-text transition-colors duration-300">
      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-28">
        <div className="lg:col-span-8">
          <p className="label-caps mb-6 text-green">Guide</p>
          <h1 className="text-mk-display font-display leading-[0.95] tracking-tight text-gray-text">
            Untangle your <br />
            <span className="font-serif italic text-green">thoughts.</span>
          </h1>
        </div>

        <div className="lg:col-span-4">
          <p className="border-l border-border pl-6 font-serif text-[18px] leading-relaxed text-gray-light">
            Reflections is a calm, private writing space. This guide explains what the product does,
            what it avoids, and how optional AI fits around the writing.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <section className="mb-20 grid gap-4 md:grid-cols-2">
          {guideSections.map((section) => {
            const Icon = section.icon;

            return (
              <article key={section.title} className="surface-flat overflow-hidden">
                <div className="flex h-full flex-col gap-8 p-8 sm:p-10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-panel)] border border-green/10 bg-green/5 text-green">
                    <Icon size={24} weight="duotone" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-[28px] font-display leading-tight text-gray-text">
                      {section.title}
                    </h2>
                    <p className="font-serif text-[17px] leading-relaxed text-gray-light">
                      {section.body}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mb-20 border-y border-border py-14">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
            <div className="space-y-5">
              <p className="label-caps text-green">How to read Reflections</p>
              <h2 className="text-mk-h2 font-display leading-tight text-gray-text">
                A journal first, with support around the edges.
              </h2>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {detailItems.map((item) => (
                <div key={item} className="rounded-[var(--radius-panel)] border border-border bg-white/5 p-5">
                  <p className="text-[14px] font-semibold leading-relaxed text-gray-light">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-panel)] border border-green/10 bg-green/5 text-green">
              <EnvelopeSimple size={24} weight="duotone" />
            </div>
            <h2 className="text-[32px] font-display leading-tight text-gray-text">
              Have a question about your writing or account?
            </h2>
            <p className="max-w-2xl font-serif text-[17px] leading-relaxed text-gray-light">
              Send a note to{' '}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-bold text-green hover:underline">
                {SUPPORT_EMAIL}
              </a>
              . Keep private details out of the first message unless they are needed to help with the request.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Button
              variant="primary"
              size="lg"
              onClick={() => navigate(RoutePath.SIGNUP)}
              aria-label="Begin writing"
            >
              Begin writing
              <ArrowRight size={20} weight="bold" className="ml-2" />
            </Button>
            <Button variant="secondary" size="lg" onClick={() => navigate(RoutePath.HOME)}>
              Back to home
            </Button>
          </div>
        </section>
      </main>
    </div>
  );
};
