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
      'I have always been fascinated by how consumed we are by work and by the pace of ordinary life now. Even rest has started to move quickly. Reels, episodes, feeds, messages, everything asks us to keep up. We hardly sit down to read, write, draw, or listen to the music we quietly like when it does not match the mainstream choice.',
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
        <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.HOME)} className="-ml-2 min-h-11">
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>

        <SectionHeader eyebrow="Founder Talk" title="A note from Arabinda" />

        <Surface variant="bezel" tone="sage">
          <div className="space-y-5 p-6 sm:p-10">
            <p className="font-serif text-[26px] italic leading-relaxed text-gray-text sm:text-[32px]">
              Reflections began as a reminder to take a few quiet minutes before the day ends.
            </p>
            <p className="text-[16px] font-medium leading-8 text-gray-light">
              I am Arabinda. I made this app because we are all part of a mass movement that often prefers fitting in. I wanted a quieter counterweight: a place to check in with your emotions, write something down, and leave without being pushed to perform. Thank you for trusting me with a few minutes of your day.
            </p>
          </div>
        </Surface>

        <div className="space-y-5">
          {sections.map((section, index) => (
            <Surface key={section.title} variant="flat" tone={index % 2 === 0 ? 'sky' : 'honey'}>
              <div className="p-6 sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`tone-icon h-12 w-12 ${index % 2 === 0 ? 'tone-icon-sky' : 'tone-icon-honey'}`}>{section.icon}</div>
                  <h2 className="text-[21px] font-display font-bold text-gray-text">
                    {section.title}
                  </h2>
                </div>
                <p className="text-[15px] font-medium leading-8 text-gray-light">{section.body}</p>
              </div>
            </Surface>
          ))}
        </div>
      </div>
    </PageContainer>
  );
};
