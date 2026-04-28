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
  Headphones,
  Microphone,
  Image as ImageIcon,
  ListChecks,
} from '@phosphor-icons/react';

import { Button } from '../../components/ui/Button';
import { RoutePath } from '../../types';

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

const guideSections = [
  {
    icon: BookOpen,
    title: 'What is Reflections?',
    body:
      'Reflections is a private writing-first wellness journal for saving notes, naming moods, and returning to patterns when you are ready.',
  },
  {
    icon: Heart,
    title: 'Who is Reflections for?',
    body:
      'It is for people who want a calm place to think in writing without streaks, public sharing, pressure loops, or automatic AI interruptions.',
  },
  {
    icon: PenNib,
    title: 'Why writing first?',
    body:
      'Writing is the main practice. Optional AI support and Life Wiki refreshes stay out of the way until you ask for them.',
  },
];

const practiceItems = [
  {
    title: 'The practice',
    body: 'A quiet space to write, one reflection at a time.',
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
    title: 'Optional AI support',
    body: "Reflections can help notice patterns or refresh your Life Wiki, but only when you ask. It never runs in the background, and we don't use your notes to train AI models.",
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

export const FAQ: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="relative min-h-full bg-body pb-28 text-gray-text transition-colors duration-300">
      <section className="mx-auto grid w-full max-w-[1440px] gap-12 px-6 py-20 sm:px-10 lg:grid-cols-12 lg:items-end lg:px-16 lg:py-28">
        <div className="lg:col-span-8">
          <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
            Untangle your <br />
            <span className="font-serif italic font-normal text-green">thoughts</span>
          </h1>
        </div>

        <div className="lg:col-span-4">
          <p className="border-l border-border pl-6 font-serif text-[18px] leading-relaxed text-gray-light">
            Reflections is a calm, private writing space. This guide explains what the product does,
            what it avoids, and how optional AI fits around the writing
          </p>
        </div>
      </section>

      <main className="mx-auto w-full max-w-[1440px] px-6 sm:px-10 lg:px-16">
        {/* Core Guide Sections */}
        <section className="mb-20 grid gap-4 md:grid-cols-3">
          {guideSections.map((section) => {
            const Icon = section.icon;

            return (
              <article key={section.title} className="surface-flat overflow-hidden border border-border/50">
                <div className="flex h-full flex-col gap-6 p-8">
                  <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-panel)] border border-green/10 bg-green/5 text-green">
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

        {/* The Practice Section */}
        <section className="mb-20">
          <div className="mb-10 space-y-4">
            <p className="label-caps text-green">The practice</p>
            <h2 className="text-mk-h2 font-display font-bold text-gray-text">A space to write, one reflection at a time</h2>
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {practiceItems.map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="surface-flat p-8 border border-border/30">
                  <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl bg-body border border-border text-gray-light">
                    <Icon size={20} weight="bold" />
                  </div>
                  <h3 className="mb-3 text-[19px] font-display font-bold text-gray-text">{item.title}</h3>
                  <p className="font-sans text-[16px] leading-relaxed text-gray-light">{item.body}</p>
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
                <div key={item.title} className="relative overflow-hidden rounded-[var(--radius-panel)] border border-border bg-white/5 p-8">
                  <div className="flex gap-6">
                    <div className="flex-none flex h-12 w-12 items-center justify-center rounded-2xl bg-green/10 text-green">
                      <Icon size={24} weight="duotone" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <h3 className="text-[24px] font-display font-bold text-gray-text">{item.title}</h3>
                        {item.label && <p className="text-[11px] font-black uppercase tracking-widest text-green/60">{item.label}</p>}
                      </div>
                      <p className="font-sans text-[17px] leading-relaxed text-gray-light">{item.body}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Feature Grid */}
        <section className="mb-28">
          <div className="grid gap-x-12 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {featureGrid.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="space-y-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface border border-border/40 text-green shadow-sm">
                    <Icon size={20} weight="duotone" />
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[14px] font-black uppercase tracking-widest text-gray-text">{feature.title}</h4>
                    <p className="font-sans text-[16px] leading-relaxed text-gray-light">{feature.body}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

      </main>
    </div>
  );
};
