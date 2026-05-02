import React from 'react';
import { ArrowLeft, Feather, LockKey, Sparkle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { RoutePath } from '../../types';

const sections = [
  {
    title: 'The pace around us',
    icon: <Feather size={24} weight="duotone" className="text-sky-600" />,
    body: 'I have always been fascinated by how consumed we are by work and by the pace of ordinary life now. Even rest has started to move quickly. Reels, episodes, feeds, messages, everything asks us to keep up. We hardly sit down to read, write, draw, or listen to the music we like when it does not match the mainstream choice.',
  },
  {
    title: 'Why writing helps',
    icon: <Feather size={24} weight="duotone" className="text-sky-600" />,
    body: 'Therapy can help, and for many people it is the right support. It is also too expensive for a lot of us. Reflections is not a replacement for trained professionals. It is a smaller thing: a place to write feelings down, recognise what might be there, and take a little time out for yourself.',
  },
  {
    title: 'Private writing',
    icon: <LockKey size={24} weight="duotone" className="text-honey-600" />,
    body: 'I built Reflections to help writing stay private and ordinary. Your notes are yours. You can export them when you want. You can write for 2 minutes before bed, add music if it helps, keep a small rhythm if you like, or restart whenever life gets crowded again.',
  },
  {
    title: 'AI that waits',
    icon: <Sparkle size={24} weight="duotone" className="text-emerald-600" />,
    body: 'AI should wait until you invite it. When it does appear, the job is simple: read carefully, reflect gently, and never act like it knows your life better than you do.',
  },
];

export const AboutArabinda: React.FC = () => {
  useDocumentMeta({
    title: 'About Reflections & Arabinda – A Private Journal App',
    description: 'A note from Arabinda about why Reflections is a personal writing app with mood notes, Life Wiki, and AI that stays out of the way.',
    path: '/about',
  });
  const navigate = useNavigate();

  return (
    <PageContainer size="app" className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <button
          onClick={() => navigate(RoutePath.HOME)}
          className="group -ml-2 mb-12 flex min-h-11 w-fit items-center gap-2 px-2 text-sm font-bold text-gray-nav transition-all duration-300 hover:-translate-x-1 hover:text-green"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
          <span>Back</span>
        </button>

        {/* Hero Section */}
        <section className="mb-24 grid gap-12 md:grid-cols-12 md:gap-16 lg:gap-24 items-center">
          <div className="md:col-span-5 order-last md:order-first">
            <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-sm">
              <img
                src="/assets/images/founder.png"
                alt="Arabinda, creator of Reflections"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105 grayscale-[0.1]"
                loading="lazy"
              />
            </div>
          </div>
          <div className="md:col-span-7 space-y-8">
            <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
              A note from <br />
              <span className="font-serif italic font-normal text-green">Arabinda</span>
            </h1>
            <div className="space-y-6">
              <p className="max-w-[55ch] text-xl font-serif italic leading-relaxed text-gray-text">
                Reflections began as a reminder to slow down before the day ends.
              </p>
              <p className="max-w-[55ch] font-sans text-[16px] leading-relaxed text-gray-light">
                I made this app because we are all part of a mass movement that often prefers fitting in. I wanted a slower counterweight: a place to check in with your emotions, write something down, and leave without being pushed to perform. Thank you for trusting me with a few minutes of your day.
              </p>
              <p className="text-[12px] font-bold uppercase tracking-widest text-gray-nav">Last updated · May 2026</p>
            </div>
          </div>
        </section>

        {/* Philosophy Chapters */}
        <div className="space-y-0">
          {sections.map((section) => (
            <section
              key={section.title}
              className="group grid gap-6 rounded-3xl border-t border-gray-text/5 px-4 py-12 transition-colors duration-500 -mx-4 hover:bg-gray-text/[0.03] sm:-mx-6 sm:px-6 md:grid-cols-12 md:gap-12 md:py-16"
            >
              <div className="md:col-span-4 flex flex-col items-start gap-4">
                <div className="h-12 w-12 flex items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  {section.icon}
                </div>
                <h2 className="text-[22px] font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                  {section.title}
                </h2>
              </div>
              <div className="md:col-span-8 flex items-center">
                <p className="font-sans text-[16px] leading-relaxed text-gray-light max-w-[65ch]">
                  {section.body}
                </p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
