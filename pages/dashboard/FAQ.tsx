import React, { useEffect } from 'react';
import { PublicPageIcon, type PublicPageIconName } from '../../components/ui/PublicPageIcon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

type PublicIconCard = {
  icon: PublicPageIconName;
  title: string;
  body: string;
  label?: string;
};

const guideSections: PublicIconCard[] = [
  {
    icon: 'book',
    title: 'What is Reflections?',
    body:
      'A journal where writing comes first. You save notes, name moods, tag patterns, and come back to them whenever you want.',
  },
  {
    icon: 'heart',
    title: 'Who is Reflections for?',
    body:
      'It is for people who want a calm place to think in writing. You set the pace, keep your notes to yourself, and choose when to involve AI.',
  },
  {
    icon: 'pen',
    title: 'Why writing first?',
    body:
      'Writing is the main practice. AI and Life Wiki refreshes stay in the background until you invite them.',
  },
];

const practiceItems: PublicIconCard[] = [
  {
    title: 'The practice',
    body: 'A place to write, one reflection at a time.',
    icon: 'book',
  },
  {
    title: 'Morning or night',
    body: 'Set an intention for the day or clear your head before sleep. Write whenever you find your rhythm.',
    icon: 'compass',
  },
  {
    title: 'The daily spark',
    body: "If you're staring at a blank page, tap the spark. It's a gentle nudge to help you get started.",
    icon: 'tag',
  },
  {
    title: 'Just you and the page',
    body: 'Focus Mode lets the interface fade away. No distractions, just you and your words.',
    icon: 'shield',
  },
  {
    title: 'Naming the feeling',
    body: "Check in with your mood. It's how you start noticing the patterns in your emotional life.",
    icon: 'heart',
  },
];

const detailItems: PublicIconCard[] = [
  {
    title: 'Private to your account',
    body: 'Your notes are tied to your login and protected by account-level security. You own your writing, period.',
    label: 'Account protected',
    icon: 'shield',
  },
  {
    title: 'Notice the rhythm',
    body: 'See how your feelings shift over time with simple mood mapping.',
    icon: 'brain',
  },
  {
    title: 'Keep what matters',
    body: 'Attach images, tasks, and notes as you need them.',
    icon: 'tag',
  },
  {
    title: 'AI on your terms',
    body: 'Reflections can spot patterns or refresh your Life Wiki, but only when you choose. It never fires in the background. See our Privacy page for how your notes are protected.',
    label: 'On demand only • Private by design',
    icon: 'brain',
  },
];

const featureGrid: PublicIconCard[] = [
  { title: 'Ambient sound', body: 'Soundscapes to help you focus. Quiet the room as you write.', icon: 'headphones' },
  { title: 'Whisper mode', body: 'Speak your thoughts. Fast, private transcription for when you need it.', icon: 'microphone' },
  { title: 'Writing sparks', body: 'Gentle prompts for those days when you aren\'t sure where to start.', icon: 'tag' },
  { title: 'Visual covers', body: 'Add atmospheric imagery to set the mood for your entries.', icon: 'image' },
  { title: 'Embedded tasks', body: 'Keep track of follow-ups and intentions right inside your prose.', icon: 'checklist' },
  { title: 'Life Wiki', body: 'A high-level summary of your world, updated only when you choose.', icon: 'brain' },
];

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

export const FAQ: React.FC = () => {
  useDocumentMeta({
    title: 'FAQ – How Reflections Works | Private Journaling App',
    description: 'How Reflections works: the writing practice, mood check-ins, AI that waits for you, Life Wiki, and the design choices behind each feature.',
    path: '/faq',
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="surface-scope-sky page-wash relative min-h-full bg-body pb-28 text-gray-text transition-colors duration-300">
      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-28">
        <div className="lg:col-span-8">
          <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
            Untangle your <br />
            <span className="font-serif italic font-normal text-green">thoughts</span>
          </h1>
        </div>

        <div className="space-y-4 lg:col-span-4">

          <p className="max-w-[36rem] font-serif text-[18px] leading-relaxed text-gray-light">
            Reflections is a calm, private writing space. This guide explains what the product does,
            how AI fits around the writing, and the choices behind the design
          </p>
          <p className="text-[12px] font-bold uppercase tracking-widest text-gray-nav">Last updated · May 2026</p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        <section className="faq-editorial-lead mb-20 grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
          <article className="surface-flat surface-tone-sage rounded-[2rem] p-8 md:p-12">
            <p className="label-caps text-green">Quick guide</p>
            <h2 className="mt-5 max-w-[12ch] text-mk-h2 font-display font-bold leading-tight text-gray-text">
              Writing stays at the center.
            </h2>
            <p className="mt-6 max-w-[52ch] font-serif text-[20px] italic leading-relaxed text-gray-text/75">
              Reflections is not a feed, a coach, or a scorecard. It is a private place for notes, mood labels, and patterns you choose to inspect.
            </p>
          </article>

          <div className="faq-compact-list rounded-[2rem] border border-border/70 bg-[rgb(var(--panel-bg-rgb)/0.54)]">
            {guideSections.map((section, index) => (
              <article
                key={section.title}
                className="group grid gap-5 border-b border-border/60 p-6 last:border-b-0 sm:grid-cols-[3.25rem_minmax(0,1fr)] md:p-8"
              >
                <div className="tone-icon tone-icon-sage flex h-12 w-12 rounded-2xl transition-transform duration-500 ease-out-expo group-hover:scale-105">
                  <PublicPageIcon name={section.icon} size={24} />
                </div>
                <div>
                  <p className="label-caps text-green/70">0{index + 1}</p>
                  <h2 className="mt-2 text-[22px] font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                    {section.title}
                  </h2>
                  <p className="mt-3 font-sans text-[16px] leading-relaxed text-gray-light">
                    {section.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-20 grid gap-10 border-y border-border py-16 lg:grid-cols-[0.72fr_1.28fr] lg:py-20">
          <div className="space-y-4">
            <p className="label-caps text-green">The practice</p>
            <h2 className="text-mk-h2 font-display font-bold text-gray-text">A space to write, one reflection at a time</h2>
            <p className="max-w-[38rem] font-sans text-[16px] leading-relaxed text-gray-light">
              The interface is deliberately quiet. The useful pieces stay close to the page, not above it.
            </p>
          </div>

          <div className="faq-compact-list divide-y divide-border/60">
            {practiceItems.map((item) => (
              <article key={item.title} className="group flex gap-5 py-6 first:pt-0 last:pb-0">
                <div className="tone-icon tone-icon-sky mt-1 h-11 w-11 flex-none rounded-2xl transition-transform duration-500 ease-out-expo group-hover:rotate-3">
                  <PublicPageIcon name={item.icon} size={22} />
                </div>
                <div>
                  <h3 className="text-[20px] font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-sans text-[16px] leading-relaxed text-gray-light">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="faq-comparison-band mb-20 surface-flat surface-tone-sky rounded-[2rem] p-7 md:p-10">
          <div className="mb-10 max-w-3xl space-y-4">
            <p className="label-caps text-green">The details</p>
            <h2 className="text-mk-h2 font-display font-bold text-gray-text">Tools built to support you without getting in the way</h2>
          </div>

          <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
            {detailItems.map((item) => (
              <article key={item.title} className="group flex flex-col gap-4 sm:flex-row sm:gap-6">
                <div className="tone-icon tone-icon-sky flex h-14 w-14 flex-none rounded-2xl transition-transform duration-500 ease-out-expo group-hover:-rotate-3">
                  <PublicPageIcon name={item.icon} size={28} />
                </div>
                <div>
                  {item.label && <p className="mb-2 text-[11px] font-black uppercase tracking-widest text-green/60">{item.label}</p>}
                  <h3 className="text-[24px] font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">{item.title}</h3>
                  <p className="mt-3 font-sans text-[17px] leading-relaxed text-gray-light">{item.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mb-28 grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)]">
          <div className="space-y-4">
            <p className="label-caps text-green">Feature shelf</p>
            <h2 className="text-mk-h2 font-display font-bold text-gray-text">Small tools, close to the page</h2>
          </div>

          <div className="faq-compact-list grid gap-x-8 gap-y-0 sm:grid-cols-2">
            {featureGrid.map((feature) => (
              <article key={feature.title} className="group flex gap-4 border-t border-border/60 py-5">
                <div className="tone-icon tone-icon-honey mt-1 h-10 w-10 flex-none rounded-2xl transition-transform duration-500 ease-out-expo group-hover:scale-105">
                  <PublicPageIcon name={feature.icon} size={21} />
                </div>
                <div>
                  <h3 className="text-[13px] font-black uppercase tracking-widest text-gray-text transition-colors duration-300 group-hover:text-green">{feature.title}</h3>
                  <p className="mt-2 font-sans text-[15px] leading-relaxed text-gray-light">{feature.body}</p>
                </div>
              </article>
            ))}
          </div>
        </section>


        <section className="mb-28 border-t border-border pt-10">
          <p className="label-caps text-green">Contact</p>
          <p className="mt-3 max-w-[42rem] font-sans text-[16px] leading-relaxed text-gray-light">
            Questions about Reflections can go to{' '}
            <a className="font-bold text-green hover:opacity-70" href={`mailto:${SUPPORT_EMAIL}`}>
              {SUPPORT_EMAIL}
            </a>
            .
          </p>
        </section>

      </div>
    </div>
  );
};
