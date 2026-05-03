import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PublicPageIcon, type PublicPageIconName } from '../../components/ui/PublicPageIcon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { RoutePath } from '../../types';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

type PolicySection = {
  title: string;
  icon: PublicPageIconName;
  color: string;
  body: string[];
};

const policySections: PolicySection[] = [
  {
    title: 'What Reflections keeps',
    icon: 'database',
    color: 'tone-icon-sky',
    body: [
      'Reflections stores the account information needed to sign you in, including your email address and profile details you choose to save, such as your name, display name, timezone, and avatar.',
      'The app stores the writing you create here: notes, moods, tags, tasks, attachments, note covers, future letters, mood check-ins, Life Wiki pages, referral invite status, and the small usage counters needed for Free and Pro access.',
    ],
  },
  {
    title: 'Local and offline copies',
    icon: 'device',
    color: 'tone-icon-sage',
    body: [
      'Reflections keeps a local copy of your notes in the browser or app database so writing can feel quick and can keep working through short connection drops.',
      'Local copies are tied to the device and browser you use. Clearing browser data, uninstalling the app, or signing out may remove local copies from that device, but server copies remain until you delete them from your account.',
    ],
  },
  {
    title: 'Attachments and files',
    icon: 'image',
    color: 'tone-icon-honey',
    body: [
      'Images, avatars, and note attachments are stored in a private Supabase Storage bucket. The app creates short-lived signed links when it needs to show those files back to you.',
      'If you delete saved writing from Account, Reflections also tries to remove stored attachments and avatar files before signing you out.',
    ],
  },
  {
    title: 'AI and Smart Mode',
    icon: 'robot',
    color: 'tone-icon-sky',
    body: [
      'Most AI work runs when you choose an AI action, or when you explicitly turn on Smart Mode. If you use Reflect with AI, Refresh with AI, or Smart Mode, the relevant writing is sent to the AI service so it can return that result.',
      'The Home dashboard may also refresh short Writing Note suggestions. If your Life Wiki has an index page, that index may be sent as context for those suggestions.',
      'We do not use your personal notes to train AI models. AI reflections and Life Wiki updates are saved only to your account. They are for personal reflection, not medical advice.',
      'Smart Mode can be turned off in Account. Turning it off stops future automatic Life Wiki refreshes. It does not delete Life Wiki pages that already exist.',
    ],
  },
  {
    title: 'Analytics',
    icon: 'chart',
    color: 'tone-icon-clay',
    body: [
      'If analytics are configured, Reflections may record basic product events such as sign-in status, note saves, route groups, plan tier, counts of tags or attachments, and whether an AI refresh was used.',
      'Analytics should not include the body of your notes, future letters, attachments, moods as private prose, or AI reflection text. These events help find broken flows and understand which parts of the product are used.',
    ],
  },
  {
    title: 'Payments and referrals',
    icon: 'creditCard',
    color: 'tone-icon-honey',
    body: [
      'Payments are handled through Razorpay. Reflections stores enough payment and plan information to know whether your account has Pro access, but card and bank details are handled by Razorpay.',
      'If you use an invite link, Reflections stores the invite code and whether someone joined from it. Invites do not create a public social graph, rewards feed, or public list.',
    ],
  },
  {
    title: 'Export, deletion, and account closure',
    icon: 'trash',
    color: 'tone-icon-sage',
    body: [
      'Your notes belong to you. You can export saved notes from note pages in the formats currently available in the app.',
      'You can delete individual notes, and you can delete saved writing and app data from Account. That removes saved notes, moods, tags, tasks, profile data, engagement data, and stored files that the app can find.',
      'Deleting saved app data does not automatically close the sign-in account itself. If you want the sign-in account closed too, email support after deleting saved writing.',
    ],
  },
  {
    title: 'Using Reflections',
    icon: 'user',
    color: 'tone-icon-sky',
    body: [
      'Use Reflections as a personal writing tool. Do not use it for anything illegal or harmful, and do not try to access another person\'s account or files.',
      'You must be at least 13 years old to use Reflections. If you are under 18, a parent or guardian should review this page with you.',
    ],
  },
  {
    title: 'Security and service limits',
    icon: 'shield',
    color: 'tone-icon-honey',
    body: [
      'Reflections uses Supabase account security, private storage, Row Level Security, and encrypted connections to protect saved writing. No online service can promise perfect security.',
      'Some features require an internet connection. AI features, sync, payments, and exports can fail if a provider is unavailable. Features and Free or Pro limits may change as the product changes, but the app should explain limits plainly where they matter.',
    ],
  },
];

export const PrivacyPolicy: React.FC = () => {
  useDocumentMeta({
    title: 'Privacy – How Reflections Handles Your Data',
    description: 'What Reflections stores, when AI runs, how payments and analytics work, and how to export or delete your writing.',
    path: '/privacy',
  });
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="surface-scope-paper page-wash relative min-h-full bg-body pb-28 text-gray-text transition-colors duration-300">
      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-28">
        <div className="lg:col-span-8">
          <button
            type="button"
            onClick={() => navigate(RoutePath.HOME)}
            className="-ml-2 mb-8 inline-flex min-h-11 items-center rounded-[var(--radius-control)] px-3 text-[13px] font-bold text-gray-nav transition-colors hover:bg-green/5 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
          >
            <PublicPageIcon name="arrowLeft" size={16} className="mr-2" />
            Back
          </button>
          <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
            Privacy
          </h1>
        </div>

        <div className="space-y-4 lg:col-span-4">
          <p className="max-w-[36rem] font-serif text-[18px] leading-relaxed text-gray-light">
            This page explains what Reflections stores, when AI is used, how payments and analytics work, and how you can remove your writing.
          </p>
          <p className="text-[12px] font-bold uppercase tracking-widest text-gray-nav">Last updated · May 2026</p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <section className="privacy-editorial-lead mb-20 grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <article className="surface-flat surface-tone-paper rounded-[2rem] p-8 md:p-12">
            <p className="label-caps text-green">Short version</p>
            <h2 className="mt-5 max-w-[14ch] text-mk-h2 font-display font-bold leading-tight text-gray-text">
              Your writing is yours.
            </h2>
            <div className="mt-7 max-w-[62ch] space-y-4 font-sans text-[17px] leading-relaxed text-gray-light">
              <p>
                Reflections stores the account and writing data needed to make the journal work. AI runs only for the actions you choose, or for Smart Mode if you turn it on.
              </p>
              <p>
                You can export notes, delete individual notes, and request account closure when you want the sign-in account removed too.
              </p>
            </div>
          </article>

          <aside className="privacy-compact-list rounded-[2rem] border border-border/70 bg-[rgb(var(--panel-bg-rgb)/0.54)]">
            {policySections.slice(0, 3).map((section) => (
              <article key={section.title} className="group flex gap-5 border-b border-border/60 p-6 last:border-b-0 md:p-8">
                <div className={`tone-icon ${section.color} mt-1 h-12 w-12 flex-none rounded-2xl transition-transform duration-500 ease-out-expo group-hover:scale-105`}>
                  <PublicPageIcon name={section.icon} size={24} />
                </div>
                <div>
                  <h2 className="text-[21px] font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                    {section.title}
                  </h2>
                  <p className="mt-3 font-sans text-[15px] leading-relaxed text-gray-light">
                    {section.body[0]}
                  </p>
                </div>
              </article>
            ))}
          </aside>
        </section>

        <section className="privacy-comparison-band mb-20 surface-flat surface-tone-sage rounded-[2rem] p-7 md:p-10">
          <div className="grid gap-8 lg:grid-cols-3">
            {[
              {
                title: 'Stays private',
                body: 'Notes, moods, tags, tasks, letters, and Life Wiki pages are scoped to your account.',
                icon: 'shield' as const,
              },
              {
                title: 'Leaves only by action',
                body: 'AI receives relevant writing only when you choose an AI action, or when Smart Mode is enabled.',
                icon: 'robot' as const,
              },
              {
                title: 'Can be removed',
                body: 'You can delete notes and app data, then email support if you want the sign-in account closed.',
                icon: 'trash' as const,
              },
            ].map((item) => (
              <article key={item.title} className="group flex gap-5">
                <div className="tone-icon tone-icon-sage mt-1 h-12 w-12 flex-none rounded-2xl transition-transform duration-500 ease-out-expo group-hover:-rotate-3">
                  <PublicPageIcon name={item.icon} size={24} />
                </div>
                <div>
                  <h2 className="text-[22px] font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">{item.title}</h2>
                  <p className="mt-3 font-sans text-[16px] leading-relaxed text-gray-light">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="privacy-compact-list mb-20 border-y border-border py-10">
          <div className="grid gap-x-12 lg:grid-cols-2">
            {policySections.map((section) => (
              <article key={section.title} className="group border-b border-border/60 py-7 lg:odd:pr-4 lg:even:pl-4">
                <div className="flex gap-5">
                  <div className={`tone-icon ${section.color} mt-1 h-11 w-11 flex-none rounded-2xl transition-transform duration-500 ease-out-expo group-hover:scale-105`}>
                    <PublicPageIcon name={section.icon} size={22} />
                  </div>
                  <div>
                    <h2 className="text-[22px] font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                      {section.title}
                    </h2>
                    <div className="mt-4 space-y-3">
                      {section.body.map((paragraph) => (
                        <p key={paragraph} className="font-sans text-[15px] leading-relaxed text-gray-light">
                          {paragraph}
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-28 surface-flat surface-tone-paper rounded-[2rem] p-8 md:p-10">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
            <div className="tone-icon tone-icon-sage h-14 w-14 flex-none rounded-2xl">
              <PublicPageIcon name="envelope" size={26} />
            </div>
            <div className="space-y-4">
              <h2 className="text-[24px] font-display font-bold text-gray-text">
                Questions or account deletion
              </h2>
              <p className="max-w-2xl font-sans text-[16px] leading-relaxed text-gray-light">
                If you have questions, want everything deleted, or need the sign-in account closed, email us directly.
              </p>
              <a
                href={`mailto:${SUPPORT_EMAIL}`}
                className="inline-flex min-h-11 items-center gap-2 text-[15px] font-black uppercase tracking-widest text-green transition-colors duration-300 hover:text-gray-text"
              >
                <PublicPageIcon name="envelope" size={16} />
                {SUPPORT_EMAIL}
              </a>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
