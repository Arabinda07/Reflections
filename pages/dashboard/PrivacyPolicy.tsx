import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Envelope, 
  Database, 
  DeviceMobile, 
  Image as ImageIcon, 
  Robot, 
  ChartBar, 
  CreditCard, 
  Trash, 
  User, 
  ShieldCheck 
} from '@phosphor-icons/react';

import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

const policySections = [
  {
    title: 'What Reflections keeps',
    icon: Database,
    color: 'tone-icon-sky',
    body: [
      'Reflections stores the account information needed to sign you in, including your email address and profile details you choose to save, such as your name, display name, timezone, and avatar.',
      'The app stores the writing you create here: notes, moods, tags, tasks, attachments, note covers, future letters, mood check-ins, Life Wiki pages, referral invite status, and the small usage counters needed for Free and Pro access.',
    ],
  },
  {
    title: 'Local and offline copies',
    icon: DeviceMobile,
    color: 'tone-icon-sage',
    body: [
      'Reflections keeps a local copy of your notes in the browser or app database so writing can feel quick and can keep working through short connection drops.',
      'Local copies are tied to the device and browser you use. Clearing browser data, uninstalling the app, or signing out may remove local copies from that device, but server copies remain until you delete them from your account.',
    ],
  },
  {
    title: 'Attachments and files',
    icon: ImageIcon,
    color: 'tone-icon-honey',
    body: [
      'Images, avatars, and note attachments are stored in a private Supabase Storage bucket. The app creates short-lived signed links when it needs to show those files back to you.',
      'If you delete saved writing from Account, Reflections also tries to remove stored attachments and avatar files before signing you out.',
    ],
  },
  {
    title: 'AI and Smart Mode',
    icon: Robot,
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
    icon: ChartBar,
    color: 'tone-icon-clay',
    body: [
      'If analytics are configured, Reflections may record basic product events such as sign-in status, note saves, route groups, plan tier, counts of tags or attachments, and whether an AI refresh was used.',
      'Analytics should not include the body of your notes, future letters, attachments, moods as private prose, or AI reflection text. These events help find broken flows and understand which parts of the product are used.',
    ],
  },
  {
    title: 'Payments and referrals',
    icon: CreditCard,
    color: 'tone-icon-honey',
    body: [
      'Payments are handled through Razorpay. Reflections stores enough payment and plan information to know whether your account has Pro access, but card and bank details are handled by Razorpay.',
      'If you use an invite link, Reflections stores the invite code and whether someone joined from it. Invites do not create a public social graph, rewards feed, or public list.',
    ],
  },
  {
    title: 'Export, deletion, and account closure',
    icon: Trash,
    color: 'tone-icon-sage',
    body: [
      'Your notes belong to you. You can export saved notes from note pages in the formats currently available in the app.',
      'You can delete individual notes, and you can delete saved writing and app data from Account. That removes saved notes, moods, tags, tasks, profile data, engagement data, and stored files that the app can find.',
      'Deleting saved app data does not automatically close the sign-in account itself. If you want the sign-in account closed too, email support after deleting saved writing.',
    ],
  },
  {
    title: 'Using Reflections',
    icon: User,
    color: 'tone-icon-sky',
    body: [
      'Use Reflections as a personal writing tool. Do not use it for anything illegal or harmful, and do not try to access another person\'s account or files.',
      'You must be at least 13 years old to use Reflections. If you are under 18, a parent or guardian should review this page with you.',
    ],
  },
  {
    title: 'Security and service limits',
    icon: ShieldCheck,
    color: 'tone-icon-honey',
    body: [
      'Reflections uses Supabase account security, private storage, Row Level Security, and encrypted connections to protect saved writing. No online service can promise perfect security.',
      'Some features require an internet connection. AI features, sync, payments, and exports can fail if a provider is unavailable. Features and Free or Pro limits may change as the product changes, but the app should explain limits plainly where they matter.',
    ],
  },
];

export const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="surface-scope-paper relative min-h-full bg-body pb-28 text-gray-text transition-colors duration-300">
      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-28">
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
          <p className="max-w-[36rem] font-serif text-[18px] leading-relaxed text-gray-light">
            This page explains what Reflections stores, when AI is used, how payments and analytics work, and how you can remove your writing.
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <section className="mb-20 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {policySections.map((section) => {
            const Icon = section.icon;
            return (
              <article key={section.title} className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-body-surface border border-border/40 p-8 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-green/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
                <div className="relative z-10">
                  <div className={`tone-icon ${section.color} mb-8 h-12 w-12 rounded-2xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6`}>
                    <Icon size={24} weight="duotone" />
                  </div>
                  <h2 className="mb-4 text-[22px] font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {section.body.map((paragraph) => (
                      <p key={paragraph} className="font-sans text-[15px] leading-relaxed text-gray-light">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </div>
                {/* Subtle background glow effect on hover */}
                <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-green/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              </article>
            );
          })}

          {/* Questions & Contact Card */}
          <article className="group relative flex flex-col justify-between overflow-hidden rounded-[2rem] bg-body-surface border border-border/40 p-8 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-green/20 hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] md:col-span-2 xl:col-span-3">
            <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:gap-12">
              <div className="tone-icon tone-icon-sage h-14 w-14 flex-none rounded-2xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6">
                <Envelope size={26} weight="duotone" />
              </div>
              <div className="space-y-4">
                <h2 className="text-[24px] font-display font-bold text-gray-text group-hover:text-green transition-colors duration-300">
                  Questions or account deletion
                </h2>
                <p className="max-w-2xl font-sans text-[16px] leading-relaxed text-gray-light">
                  If you have questions, want everything deleted, or need the sign-in account closed, email us directly.
                </p>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="inline-flex items-center gap-2 text-[15px] font-black uppercase tracking-widest text-green transition-colors hover:text-gray-text"
                >
                  <Envelope size={16} weight="bold" />
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-green/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
          </article>
        </section>
      </main>
    </div>
  );
};
