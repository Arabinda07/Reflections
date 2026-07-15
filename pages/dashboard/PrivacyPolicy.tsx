import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { PublicPageIcon, type PublicPageIconName } from '../../components/ui/PublicPageIcon';
import { PublicPageHero, PublicPageSection, PublicPageShell } from '../../components/ui/PublicPageShell';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { PUBLIC_SEO_COPY } from '../../src/config/publicSeoCopy.js';
import { getPublicHomePath } from '../../src/utils/authHints';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';
const PRIVACY_SEO = PUBLIC_SEO_COPY.privacy;

type PolicySection = {
  title: string;
  icon: PublicPageIconName;
  body: string[];
};

const policySections: PolicySection[] = [
  {
    title: 'What Reflections keeps',
    icon: 'database',
    body: [
      'Reflections stores the account information needed to sign you in, including your email address and profile details you choose to save, such as your name, display name, timezone, and avatar.',
      'The app stores the writing you create here: notes, moods, tags, tasks, attachments, note covers, future letters, mood check-ins, Life Wiki pages, relationships, referral invite status, and the small usage counters needed for Free and Pro access. For users in Encrypted Vault mode, private writing is encrypted on your device before it reaches the server.',
    ],
  },
  {
    title: 'Privacy Modes: Encrypted Vault vs Reflective Sanctuary',
    icon: 'shield',
    body: [
      'Reflections offers two privacy modes. In Encrypted Vault, your private writing — notes, moods, tags, tasks, attachments, future letters, Life Wiki pages, and relationships — is encrypted on your device before it is saved. The key is derived from your password and never sent to the server, so what Reflections stores is data it cannot read.',
      'Because the key stays on your device in Encrypted Vault mode, you unlock your writing once on each device you use. If you forget your password, the recovery phrase is the only other way to unlock your writing. AI features that need the server to read your writing stay off while this protection is on.',
      'In Reflective Sanctuary mode, device-side encryption is bypassed so that the Gemini API can process your notes server-side for AI reflections. Your data is still secured with Supabase account security, private storage, and Row Level Security.',
    ],
  },
  {
    title: 'Local and offline copies',
    icon: 'device',
    body: [
      'Reflections keeps a local copy of your notes in the browser or app database so writing can feel quick and can keep working through short connection drops.',
      'Local copies are tied to the device and browser you use. Clearing browser data, uninstalling the app, or signing out may remove local copies from that device, but server copies remain until you delete them from your account.',
    ],
  },
  {
    title: 'Attachments and files',
    icon: 'image',
    body: [
      'Images, avatars, and note attachments are stored in a private Supabase Storage bucket. The app creates short-lived signed links when it needs to show those files back to you.',
      'If you delete saved writing from Account, Reflections also tries to remove stored attachments and avatar files before signing you out.',
    ],
  },
  {
    title: 'AI and Smart Mode',
    icon: 'robot',
    body: [
      'Most AI work runs when you choose an AI action, or when you explicitly turn on Smart Mode. If you use Reflect with AI, Refresh with AI, or Smart Mode, the relevant writing is sent to the AI service so it can return that result.',
      'The Home dashboard may also refresh short note suggestions. If your Life Wiki has an index page, that index may be sent as context for those suggestions.',
      'We do not use your personal notes to train AI models. AI reflections and Life Wiki updates are saved only to your account. They are for personal reflection, not medical advice.',
      'Smart Mode can be turned off in Account. Turning it off stops future automatic Life Wiki refreshes. It does not delete Life Wiki pages that already exist.',
    ],
  },
  {
    title: 'No product analytics',
    icon: 'chart',
    body: [
      'Reflections does not send product analytics, route tracking, session replay, or error-monitoring events to PostHog, Sentry, Vercel Analytics, or Vercel Speed Insights.',
      'The services that run chosen features can still process the data needed for those features, such as Supabase sign-in and storage, AI requests, payments, email delivery, and ordinary hosting logs.',
    ],
  },
  {
    title: 'Payments and referrals',
    icon: 'creditCard',
    body: [
      'Razorpay handles checkout, subscription billing, and card or bank details. Reflections stores the selected plan, Razorpay subscription ID, payment status, and enough billing metadata to manage Pro access.',
      'If you use an invite link, Reflections stores the invite code and whether someone joined from it. Invites do not create a public social graph, rewards feed, or public list.',
    ],
  },
  {
    title: 'Export, deletion, and account closure',
    icon: 'trash',
    body: [
      'Your notes belong to you. You can export saved notes from note pages in the formats currently available in the app.',
      'You can delete individual notes, and you can delete saved writing and app data from Account. That removes saved notes, moods, tags, tasks, profile data, engagement data, and stored files that the app can find.',
      'Deleting saved app data does not automatically close the sign-in account itself. If you want the sign-in account closed too, email support after deleting saved writing.',
    ],
  },
  {
    title: 'Using Reflections',
    icon: 'user',
    body: [
      'Use Reflections as a personal writing tool. Do not use it for anything illegal or harmful, and do not try to access another person\'s account or files.',
      'You must be at least 13 years old to use Reflections. If you are under 18, a parent or guardian should review this page with you.',
    ],
  },
  {
    title: 'Security and service limits',
    icon: 'shield',
    body: [
      'For users in Encrypted Vault mode, private writing is encrypted on your device before it is saved. For all users, Reflections uses Supabase account security, private storage, Row Level Security, and encrypted connections. No online service can promise perfect security.',
      'Some features require an internet connection. AI features, sync, payments, and exports can fail if a provider is unavailable. Features and Free or Pro limits may change as the product changes, but the app should explain limits plainly where they matter.',
    ],
  },
];

const principles = [
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
];

export const PrivacyPolicy: React.FC = () => {
  useDocumentMeta({
    title: PRIVACY_SEO.title,
    description: PRIVACY_SEO.description,
    path: PRIVACY_SEO.path,
  });
  const navigate = useNavigate();
  const homePath = getPublicHomePath();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PublicPageShell scope="paper">
      <PublicPageHero
        onBack={() => navigate(homePath)}
        title="Privacy"
        updated="June 2026"
        intro={
          <p className="max-w-[36rem] font-serif text-[18px] leading-relaxed text-gray-light">
            This page explains what Reflections stores, when AI is used, how payments work, and how you can remove your
            writing.
          </p>
        }
      />

      {/* Short version + the three things that matter most */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="surface-flat surface-tone-paper rounded-[var(--radius-panel)] p-8 md:p-12">
          <h2 className="max-w-[14ch] text-mk-h2 font-display font-bold leading-tight text-gray-text">
            Your writing is yours.
          </h2>
          <div className="mt-7 max-w-[62ch] space-y-4 font-sans text-ui-base leading-relaxed text-gray-light">
            <p>
              Reflections stores the account and writing data needed to make the journal work. AI runs only for the
              actions you choose, or for Smart Mode if you turn it on.
            </p>
            <p>
              You can export notes, delete individual notes, and request account closure when you want the sign-in
              account removed too.
            </p>
          </div>
        </article>

        <div className="flex flex-col justify-center gap-7">
          {policySections.slice(0, 3).map((section) => (
            <article key={section.title} className="group">
              <h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={section.icon} size={19} className="flex-none text-green" />
                {section.title}
              </h3>
              <p className="mt-2.5 font-sans text-ui-base leading-relaxed text-gray-light">{section.body[0]}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Principles */}
      <PublicPageSection tone="sage">
        <div className="grid gap-8 lg:grid-cols-3">
          {principles.map((item) => (
            <article key={item.title} className="group">
              <h2 className="flex items-center gap-2.5 text-ui-lg font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={item.icon} size={20} className="flex-none text-green" />
                {item.title}
              </h2>
              <p className="mt-2.5 font-sans text-ui-base leading-relaxed text-gray-light">{item.body}</p>
            </article>
          ))}
        </div>
      </PublicPageSection>

      {/* Full policy — borderless rows, generous rhythm */}
      <PublicPageSection
        heading="The full data picture."
        lead="Read what Reflections stores, what can leave your device, and what you can remove."
      >
        <div className="flex flex-col gap-12">
          {policySections.map((section) => (
            <article
              key={section.title}
              className="group grid gap-x-5 gap-y-3 md:grid-cols-[minmax(13rem,0.34fr)_minmax(0,1fr)]"
            >
              <h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={section.icon} size={19} className="flex-none text-green" />
                {section.title}
              </h3>

              <div className="space-y-3 md:pt-1">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="max-w-[72ch] font-sans text-ui-base leading-relaxed text-gray-light">
                    {paragraph}
                  </p>
                ))}
              </div>
            </article>
          ))}
        </div>
      </PublicPageSection>

      {/* Contact */}
      <PublicPageSection tone="paper">
        <div className="space-y-3">
          <h2 className="flex items-center gap-2.5 text-ui-xl font-display font-bold text-gray-text">
            <PublicPageIcon name="envelope" size={20} className="flex-none text-green" />
            Questions or account deletion
          </h2>
          <p className="max-w-2xl font-sans text-ui-base leading-relaxed text-gray-light">
            If you have questions, want everything deleted, or need the sign-in account closed, email us at{' '}
            <a className="public-contact-link" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
          </p>
        </div>
      </PublicPageSection>
    </PublicPageShell>
  );
};
