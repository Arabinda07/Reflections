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
    title: 'Why this exists',
    icon: <Feather size={22} weight="duotone" />,
    body:
      'I built Reflections because I wanted a place that lets writing stay private and ordinary. No performance. No pressure to keep up. Just a page that can hold a thought before it hardens into something louder.',
  },
  {
    title: 'Writing-first',
    icon: <Feather size={22} weight="duotone" />,
    body:
      'The note is the main thing here. Moods, releases, letters, and the Life Wiki exist around the writing, not above it. They are small tools for noticing what keeps returning.',
  },
  {
    title: 'Privacy intent',
    icon: <LockKey size={22} weight="duotone" />,
    body:
      'Private writing needs plain promises. Your notes should not become engagement fuel. When the app remembers a release or a quiet check-in, it can do that without keeping the words you chose to let go.',
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
              Reflections is my attempt to make technology behave more quietly around private writing.
            </p>
            <p className="text-[16px] font-medium leading-8 text-gray-light">
              I am Arabinda. I care about tools that respect people when they are tired, uncertain, or trying to hear themselves think. This app exists because writing can be a sanctuary without turning into another thing to keep up with.
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
