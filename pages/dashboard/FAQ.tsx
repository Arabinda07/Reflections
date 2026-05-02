import React, { useEffect } from 'react';
import {
  BookOpen,
  Brain,
  Compass,
  Heart,
  PenNib,
  ShieldCheck,
  Tag,
  Headphones,
  Microphone,
  Image as ImageIcon,
  ListChecks,
} from '@phosphor-icons/react';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';

const guideSections = [
  {
    icon: BookOpen,
    title: 'What is Reflections?',
    body:
      'A journal where writing comes first. You save notes, name moods, tag patterns, and come back to them whenever you want.',
  },
  {
    icon: Heart,
    title: 'Who is Reflections for?',
    body:
      'It is for people who want a calm place to think in writing. You set the pace, keep your notes to yourself, and choose when to involve AI.',
  },
  {
    icon: PenNib,
    title: 'Why writing first?',
    body:
      'Writing is the main practice. AI and Life Wiki refreshes stay in the background until you invite them.',
  },
];

const practiceItems = [
  {
    title: 'The practice',
    body: 'A place to write, one reflection at a time.',
    icon: BookOpen,
  },
  {
    title: 'Morning or night',
    body: 'Set an intention for the day or clear your head before sleep. Write whenever you find your rhythm.',
    icon: Compass,
  },
  {
    title: 'The daily spark',
    body: "If you're staring at a blank page, tap the spark. It's a gentle nudge to help you get started.",
    icon: Tag,
  },
  {
    title: 'Just you and the page',
    body: 'Focus Mode lets the interface fade away. No distractions, just you and your words.',
    icon: ShieldCheck,
  },
  {
    title: 'Naming the feeling',
    body: "Check in with your mood. It's how you start noticing the patterns in your emotional life.",
    icon: Heart,
  },
];

const detailItems = [
  {
    title: 'Private to your account',
    body: 'Your notes are tied to your login and protected by account-level security. You own your writing, period.',
    label: 'Account protected',
    icon: ShieldCheck,
  },
  {
    title: 'Notice the rhythm',
    body: 'See how your feelings shift over time with simple mood mapping.',
    icon: Brain,
  },
  {
    title: 'Keep what matters',
    body: 'Attach images, tasks, and notes as you need them.',
    icon: Tag,
  },
  {
    title: 'AI on your terms',
    body: 'Reflections can spot patterns or refresh your Life Wiki, but only when you choose. It never fires in the background. See our Privacy page for how your notes are protected.',
    label: 'On demand only • Private by design',
    icon: Brain,
  },
];

const featureGrid = [
  { title: 'Ambient sound', body: 'Soundscapes to help you focus. Quiet the room as you write.', icon: Headphones },
  { title: 'Whisper mode', body: 'Speak your thoughts. Fast, private transcription for when you need it.', icon: Microphone },
  { title: 'Writing sparks', body: 'Gentle prompts for those days when you aren\'t sure where to start.', icon: Tag },
  { title: 'Visual covers', body: 'Add atmospheric imagery to set the mood for your entries.', icon: ImageIcon },
  { title: 'Embedded tasks', body: 'Keep track of follow-ups and intentions right inside your prose.', icon: ListChecks },
  { title: 'Life Wiki', body: 'A high-level summary of your world, updated only when you choose.', icon: Brain },
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

      <main className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Core Guide Sections */}
        <section className="mb-20 grid gap-6 md:grid-cols-3">
          {guideSections.map((section) => {
            const Icon = section.icon;

            return (
              <article key={section.title} className="surface-flat surface-tone-sage group relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-8 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-green/20">
                <div className="relative z-10">
                  <div className="tone-icon tone-icon-sage mb-8 h-12 w-12 rounded-2xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-6">
                    <Icon size={24} weight="duotone" />
                  </div>
                  <div className="space-y-4">
                    <h2 className="text-[22px] font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
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

        {/* The Practice Section */}
        <section className="mb-20">
          <div className="mb-10 space-y-4">
            <p className="label-caps text-green">The practice</p>
            <h2 className="text-mk-h2 font-display font-bold text-gray-text">A space to write, one reflection at a time</h2>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {practiceItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="surface-flat surface-tone-sky group relative flex flex-col justify-between overflow-hidden rounded-[2rem] p-8 transition-all duration-500 ease-out hover:-translate-y-1 hover:border-green/20">
                  <div className="relative z-10">
                    <div className="tone-icon tone-icon-sky mb-6 h-12 w-12 rounded-2xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:rotate-6">
                      <Icon size={24} weight="duotone" />
                    </div>
                    <h3 className="mb-3 text-[20px] font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">{item.title}</h3>
                    <p className="font-sans text-[16px] leading-relaxed text-gray-light">{item.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* The Details Section */}
        <section className="mb-20 border-y border-border py-20">
          <div className="mb-12 space-y-4">
            <p className="label-caps text-green">The details</p>
            <h2 className="text-mk-h2 font-display font-bold text-gray-text">Tools built to support you without getting in the way</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {detailItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="tone-panel tone-panel-sky group relative overflow-hidden rounded-[2rem] p-8 transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-[0_8px_40px_rgba(14,165,233,0.08)]">
                  <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:gap-6">
                    <div className="tone-icon tone-icon-sky flex h-14 w-14 flex-none rounded-2xl transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-12">
                      <Icon size={28} weight="duotone" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-[24px] font-display font-bold text-gray-text group-hover:text-green transition-colors duration-300">{item.title}</h3>
                        {item.label && <p className="text-[11px] font-black uppercase tracking-widest text-green/60">{item.label}</p>}
                      </div>
                      <p className="font-sans text-[17px] leading-relaxed text-gray-light">{item.body}</p>
                    </div>
                  </div>
                  {/* Subtle sweep effect on hover */}
                  <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-sky-400/0 via-sky-400/5 to-sky-400/0 translate-x-[-100%] transition-transform duration-1000 group-hover:translate-x-[100%]" />
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Grid */}
        <section className="mb-28">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featureGrid.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="surface-flat surface-tone-honey group relative rounded-[2rem] p-8 transition-all duration-500 hover:border-green/20 hover:-translate-y-1">
                  <div className="space-y-6">
                    <div className="tone-icon tone-icon-honey h-12 w-12 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                      <Icon size={24} weight="duotone" />
                    </div>
                    <div className="space-y-3">
                      <h4 className="text-[14px] font-black uppercase tracking-widest text-gray-text group-hover:text-green transition-colors duration-300">{feature.title}</h4>
                      <p className="font-sans text-[16px] leading-relaxed text-gray-light">{feature.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
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

      </main>
    </div>
    </div>
  );
};
