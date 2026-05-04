import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PublicPageIcon, type PublicPageIconName } from '../../components/ui/PublicPageIcon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { RoutePath } from '../../types';

type AboutSection = {
  title: string;
  icon: PublicPageIconName;
  iconClassName: string;
  body: string;
};

const sections: AboutSection[] = [
  {
    title: 'The pace around us',
    icon: 'feather',
    iconClassName: 'text-sky-600',
    body: 'I have always been fascinated by how consumed we are by work and by the pace of ordinary life now. Even rest has started to move quickly. Reels, episodes, feeds, messages, everything asks us to keep up. We hardly sit down to read, write, draw, or listen to the music we like when it does not match the mainstream choice.',
  },
  {
    title: 'Why writing helps',
    icon: 'feather',
    iconClassName: 'text-sky-600',
    body: 'Therapy can help, and for many people it is the right support. It is also too expensive for a lot of us. Reflections is not a replacement for trained professionals. It is a smaller thing: a place to write feelings down, recognise what might be there, and take a little time out for yourself.',
  },
  {
    title: 'Private writing',
    icon: 'lock',
    iconClassName: 'text-honey-600',
    body: 'I built Reflections to help writing stay private and ordinary. Your notes are yours. You can export them when you want. You can write for 2 minutes before bed, add music if it helps, keep a small rhythm if you like, or restart whenever life gets crowded again.',
  },
  {
    title: 'AI that waits',
    icon: 'sparkle',
    iconClassName: 'text-emerald-600',
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
    <PageContainer as="main" size="app" className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <button
          onClick={() => navigate(RoutePath.HOME)}
          className="group -ml-2 mb-12 flex min-h-11 w-fit items-center gap-2 px-2 text-sm font-bold text-gray-nav transition-[color,transform] duration-300 hover:-translate-x-1 hover:text-green"
          aria-label="Back to home"
        >
          <PublicPageIcon name="arrowLeft" size={16} className="transition-transform group-hover:scale-110" />
          <span>Back</span>
        </button>

        {/* Hero Section */}
        <section className="mb-24 grid gap-12 md:grid-cols-12 md:gap-16 lg:gap-24 items-center">
          <div className="md:col-span-5 order-last md:order-first">
            <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-sm">
              <img
                src="/assets/images/founder.webp"
                alt="Arabinda, creator of Reflections"
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
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
        <div className="space-y-4 border-t border-gray-text/5 pt-8">
          {sections.map((section) => (
            <section
              key={section.title}
              className="group flex flex-col md:flex-row gap-6 md:gap-12 rounded-[2rem] p-6 md:p-10 transition-colors duration-500 hover:bg-gray-text/[0.03]"
            >
              <div className="md:w-1/3 shrink-0 flex flex-col items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[rgb(var(--panel-bg-rgb))] shadow-sm ring-1 ring-border/70 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <PublicPageIcon name={section.icon} size={24} className={section.iconClassName} />
                </div>
                <h2 className="text-[22px] font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                  {section.title}
                </h2>
              </div>
              <div className="md:w-2/3 flex items-center">
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
