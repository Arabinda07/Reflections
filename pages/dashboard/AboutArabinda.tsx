import React from 'react';
import { ArrowLeft, Feather, LockKey, Sparkle } from '@phosphor-icons/react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';
import { PageContainer } from '../../components/ui/PageContainer';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Surface } from '../../components/ui/Surface';
import { RoutePath } from '../../types';

const sections = [
  {
    title: 'The pace around us',
    icon: <Feather size={22} weight="duotone" />,
    body:
      'I have always been fascinated by how consumed we are by work and by the pace of ordinary life now. Even rest has started to move quickly. Reels, episodes, feeds, messages, everything asks us to keep up. We hardly sit down to read, write, draw, or listen to the music we like when it does not match the mainstream choice.',
  },
  {
    title: 'Why writing helps',
    icon: <Feather size={22} weight="duotone" />,
    body:
      'Therapy can help, and for many people it is the right support. It is also too expensive for a lot of us. Reflections is not a replacement for trained professionals. It is a smaller thing: a place to write feelings down, recognise what might be there, and take a little time out for yourself.',
  },
  {
    title: 'Private writing',
    icon: <LockKey size={22} weight="duotone" />,
    body:
      'I built Reflections to help writing stay private and ordinary. Your notes are yours. You can export them when you want. You can write for 2 minutes before bed, add music if it helps, keep a small rhythm if you like, or restart whenever life gets crowded again.',
  },
  {
    title: 'Optional AI',
    icon: <Sparkle size={22} weight="duotone" />,
    body:
      'AI should wait until you invite it. When it does appear, the job is simple: read carefully, reflect gently, and never act like it knows your life better than you do.',
  },
];

export const AboutArabinda: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer size="narrow" className="surface-scope-sage py-12 sm:py-16">
      <div className="space-y-10">
        <button
          onClick={() => navigate(RoutePath.HOME)}
          className="group flex items-center gap-2 text-sm font-bold text-gray-nav hover:text-green transition-all duration-300 w-fit hover:-translate-x-1"
          aria-label="Back to home"
        >
          <ArrowLeft size={16} weight="bold" className="transition-transform group-hover:scale-110" />
          <span>Back</span>
        </button>

        <SectionHeader title={<>A note from <span className="text-emphasis">Arabinda</span></>} />

        <Surface variant="bezel" tone="sage">
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start p-6 sm:p-10">
            <div className="flex-shrink-0">
              <div className="h-28 w-28 sm:h-32 sm:w-32 md:h-40 md:w-40 overflow-hidden rounded-[2rem] shadow-sm ring-1 ring-black/5 transition-shadow duration-500 hover:shadow-md">
                <img
                  src="/assets/images/founder.png"
                  alt="Arabinda, creator of Reflections"
                  className="h-full w-full object-cover grayscale-[0.3] transition-all duration-700 hover:scale-105 hover:grayscale-0"
                  loading="lazy"
                />
              </div>
            </div>
            <div className="flex-1 space-y-5 md:pt-2">
              <p className="max-w-[65ch] font-serif text-2xl italic leading-relaxed text-gray-text sm:text-3xl md:text-4xl">
                Reflections began as a reminder to take a few quiet minutes before the day ends.
              </p>
              <p className="max-w-[65ch] text-base font-medium leading-relaxed text-gray-light">
                I am <span className="text-emphasis">Arabinda</span>. I made this app because we are all part of a mass movement that often prefers fitting in. I wanted a quieter counterweight: a place to check in with your emotions, write something down, and leave without being pushed to perform. Thank you for trusting me with a few minutes of your day.
              </p>
            </div>
          </div>
        </Surface>

        <div className="space-y-6">
          {sections.map((section, index) => (
            <Surface
              key={section.title}
              variant="flat"
              tone={index % 2 === 0 ? 'sky' : 'honey'}
              className="group relative overflow-hidden rounded-[2.5rem] transition-all duration-500 hover:-translate-y-1 hover:shadow-lg"
            >
              <div className="relative z-10 p-8 sm:p-10">
                <div className="mb-6 flex items-center gap-4">
                  <div className={`tone-icon h-12 w-12 rounded-2xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 ${index % 2 === 0 ? 'tone-icon-sky' : 'tone-icon-honey'}`}>
                    {section.icon}
                  </div>
                  <h2 className="text-2xl font-display font-bold text-gray-text group-hover:text-green transition-colors duration-300">
                    {section.title}
                  </h2>
                </div>
                <p className="max-w-[65ch] text-lg font-medium leading-relaxed text-gray-light font-serif italic">
                  {section.body}
                </p>
              </div>
              {/* Subtle glow effect */}
              <div className={`pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-500 group-hover:opacity-100 bg-gradient-to-br ${index % 2 === 0 ? 'from-sky-500/5 to-transparent' : 'from-honey/5 to-transparent'}`} />
            </Surface>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
