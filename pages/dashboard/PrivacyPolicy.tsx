import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Database,
  Envelope,
  Handshake,
  Lock,
  Shield,
  Sparkle,
  Warning,
} from '@phosphor-icons/react';

import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

const privacySections = [
  {
    icon: Database,
    title: 'What we keep',
    body:
      'We save your email address, profile details you choose to share, and your reflections, including notes, moods, tags, tasks, and attachments. Saved writing is tied to your login.',
  },
  {
    icon: Lock,
    title: 'How AI works here',
    body:
      'AI runs only when you ask for it, or when you explicitly enable Smart Mode. We do not use your personal notes to train AI models, and generated insights stay private to your account.',
  },
  {
    icon: Shield,
    title: 'Security and control',
    body:
      'Your data is encrypted in transit and at rest. Supabase Row Level Security keeps saved writing locked to your account. You can edit or delete your writing whenever you want.',
  },
];

const termsSections = [
  {
    icon: Handshake,
    title: 'Using Reflections',
    body:
      'By using Reflections, you agree to use it as a personal writing tool. You must be at least 13 years old, and if you are under 18, a parent or guardian should review these terms.',
  },
  {
    icon: Sparkle,
    title: 'Your writing stays yours',
    body:
      'You own your notes and attachments. You allow Reflections to store and sync them so the app can show them back to you, but we do not claim ownership of your writing.',
  },
  {
    icon: Warning,
    title: 'Service expectations',
    body:
      'Do not use Reflections for anything illegal or harmful, and do not try to access another person\'s data. The app is provided as-is, and features or free limits may change as the product evolves.',
  },
];

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-full bg-body pb-28 text-gray-text transition-colors duration-300">
      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-16 sm:px-10 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-24">
        <div className="lg:col-span-8">
          <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.HOME)} className="-ml-2 mb-8">
            <ArrowLeft size={16} weight="bold" className="mr-2" />
            Back
          </Button>
          <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
            Privacy
          </h1>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <p className="label-caps text-green">Privacy and terms</p>
          <p className="max-w-[36rem] font-serif text-[18px] leading-relaxed text-gray-light">
            Plain expectations for private writing, account data, optional AI, and responsible use.
          </p>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-nav/50">
            Last updated April 26, 2026
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <section className="mb-20 grid gap-4 md:grid-cols-3">
          {privacySections.map((section) => {
            const Icon = section.icon;

            return (
              <article key={section.title} className="border-t border-border/60 py-8">
                <div className="flex h-full flex-col gap-6">
                  <div className="tone-icon tone-icon-sage h-10 w-10">
                    <Icon size={20} weight="duotone" />
                  </div>
                  <div className="space-y-3">
                    <h2 className="text-[22px] font-display font-bold leading-tight text-gray-text">
                      {section.title}
                    </h2>
                    <p className="font-sans text-[16px] leading-relaxed text-gray-light">
                      {section.body}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </section>

        <section className="mb-20 border-y border-border py-20">
          <div className="mb-12 space-y-4">
            <p className="label-caps text-green">Terms</p>
            <h2 className="text-mk-h2 font-display font-bold text-gray-text">The agreement in plain language</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {termsSections.map((section) => {
              const Icon = section.icon;

              return (
                <article key={section.title} className="tone-panel tone-panel-sky relative overflow-hidden p-7">
                  <div className="tone-icon tone-icon-sky mb-6 h-11 w-11 rounded-2xl">
                    <Icon size={22} weight="duotone" />
                  </div>
                  <h3 className="mb-3 text-[21px] font-display font-bold text-gray-text">{section.title}</h3>
                  <p className="font-sans text-[15px] leading-relaxed text-gray-light">{section.body}</p>
                </article>
              );
            })}
          </div>
        </section>

        <section className="mb-28 grid gap-8 border-t border-border/60 py-10 md:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="tone-icon tone-icon-honey h-12 w-12 rounded-xl">
            <Envelope size={22} weight="duotone" />
          </div>
          <div className="max-w-2xl space-y-4">
            <h2 className="text-[24px] font-display font-bold text-gray-text">Questions or account deletion</h2>
            <p className="font-sans text-[16px] leading-relaxed text-gray-light">
              If you have questions, want everything deleted, or need the sign-in account closed, email us directly.
            </p>
            <a
              href={`mailto:${SUPPORT_EMAIL}`}
              className="inline-flex items-center gap-2 text-[15px] font-bold text-green transition-colors hover:text-green-hover"
            >
              <Envelope size={16} weight="bold" />
              {SUPPORT_EMAIL}
            </a>
          </div>
        </section>
      </main>
    </div>
  );
};
