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
      'I wanted Reflections to feel like a quiet room for writing, not another app asking you to perform. The first promise is simple: open the page, write what is true enough for now, and leave with a little more room.',
  },
  {
    title: 'Writing-first',
    icon: <Feather size={22} weight="duotone" />,
    body:
      'The app is writing-first by design. Notes, moods, releases, and letters are here to support your own attention. They are not competitions or proof that you are doing life correctly.',
  },
  {
    title: 'Privacy intent',
    icon: <LockKey size={22} weight="duotone" />,
    body:
      'Private writing deserves plain privacy promises. Your notes belong to you, and private text should not be used as engagement fuel. Some features keep content-free markers so the app can remember that you showed up without exposing what you wrote.',
  },
  {
    title: 'Optional AI',
    icon: <Sparkle size={22} weight="duotone" />,
    body:
      'AI stays optional. It should appear only when you ask for help seeing a pattern, and it should speak like a careful reader of your words, not an authority over your life.',
  },
];

export const AboutArabinda: React.FC = () => {
  const navigate = useNavigate();

  return (
    <PageContainer size="narrow" className="py-12 sm:py-16">
      <div className="space-y-10">
        <Button variant="ghost" size="sm" onClick={() => navigate(RoutePath.HOME)} className="-ml-2">
          <ArrowLeft size={16} weight="bold" className="mr-2" />
          Back
        </Button>

        <SectionHeader eyebrow="About Arabinda" title="A note from the maker" />

        <Surface variant="bezel">
          <div className="space-y-5 p-8 sm:p-10">
            <p className="font-serif text-[26px] italic leading-relaxed text-gray-text sm:text-[32px]">
              Reflections is my attempt to build a softer kind of technology around private writing.
            </p>
            <p className="text-[16px] font-medium leading-8 text-gray-light">
              I am Arabinda. I care about tools that respect people when they are tired, uncertain, or simply trying to hear themselves think. This app exists because writing can be a sanctuary without becoming a performance loop.
            </p>
          </div>
        </Surface>

        <div className="space-y-5">
          {sections.map((section) => (
            <Surface key={section.title} variant="flat">
              <div className="p-7 sm:p-8">
                <div className="mb-4 flex items-center gap-3">
                  <div className="icon-block icon-block-sm">{section.icon}</div>
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
