import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PublicPageIcon, type PublicPageIconName } from '../../components/ui/PublicPageIcon';
import { PublicPageHero, PublicPageShell } from '../../components/ui/PublicPageShell';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { PUBLIC_SEO_COPY } from '../../src/config/publicSeoCopy.js';
import { getPublicHomePath } from '../../src/utils/authHints';

type AboutSection = {
  title: string;
  icon: PublicPageIconName;
  body: string;
};

const ABOUT_SEO = PUBLIC_SEO_COPY.about;

const sections: AboutSection[] = [
  {
    title: 'The pace around us',
    icon: 'feather',
    body: 'I keep thinking about how quickly ordinary life moves now. Work, reels, episodes, messages, family expectations, the whole thing. Even rest can start feeling like another tab you forgot to close. Reflections is my attempt at a slower counterweight.',
  },
  {
    title: 'Why writing helps',
    icon: 'feather',
    body: 'Therapy can help, and for many people it is the right support. It is also too expensive for a lot of us. Reflections is not a replacement for trained professionals. It is smaller and more ordinary: write it down before it becomes your whole personality.',
  },
  {
    title: 'Private writing',
    icon: 'lock',
    body: 'I built Reflections to help writing stay private and ordinary. Your notes are yours. You can export them when you want. Write for 2 minutes before bed, add music if it helps, keep a small rhythm if you like, or restart whenever life gets crowded again.',
  },
  {
    title: 'AI that waits',
    icon: 'sparkle',
    body: 'AI should wait until you invite it. When it does appear, the job is simple: read carefully, reflect gently, and never act like it knows your life better than you do.',
  },
];

export const AboutArabinda: React.FC = () => {
  useDocumentMeta({
    title: ABOUT_SEO.title,
    description: ABOUT_SEO.description,
    path: ABOUT_SEO.path,
  });
  const navigate = useNavigate();
  const homePath = getPublicHomePath();

  return (
    <PublicPageShell scope="paper">
      <PublicPageHero
        onBack={() => navigate(homePath)}
        title={
          <>
            A note from <br />
            <span className="font-serif italic font-normal text-green">Arabinda</span>
          </>
        }
        updated="May 2026"
        media={
          <div className="aspect-[4/5] overflow-hidden rounded-[2rem] shadow-sm">
            <img
              src="/assets/images/founder.webp"
              alt="Arabinda, creator of Reflections"
              className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              loading="lazy"
            />
          </div>
        }
        intro={
          <>
            <p className="max-w-[55ch] text-xl font-serif italic leading-relaxed text-gray-text">
              Reflections began as a reminder to slow down before the day ends.
            </p>
            <p className="max-w-[55ch] font-sans text-ui-base leading-relaxed text-gray-light">
              {'I made this app because a lot of us are carrying full days, full phones, and full heads. I wanted one private place to check in, write something down, and leave without being pushed to perform.'}
            </p>
            <p className="max-w-[55ch] font-sans text-ui-base leading-relaxed text-gray-light">
              Thank you for trusting me with a few minutes of your day.
            </p>
          </>
        }
      />

      <div className="space-y-3">
        {sections.map((section) => (
          <section
            key={section.title}
            className="group flex flex-col gap-3 rounded-[2rem] p-6 transition-colors duration-500 hover:bg-gray-text/[0.03] md:flex-row md:gap-12 md:p-10"
          >
            <div className="shrink-0 md:w-1/3">
              <h2 className="flex items-center gap-2.5 text-ui-lg font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon
                  name={section.icon}
                  size={20}
                  className="flex-none text-green transition-transform duration-500 ease-out-expo group-hover:-rotate-6"
                />
                {section.title}
              </h2>
            </div>
            <div className="flex items-center md:w-2/3">
              <p className="max-w-[65ch] font-sans text-ui-base leading-relaxed text-gray-light">{section.body}</p>
            </div>
          </section>
        ))}
      </div>
    </PublicPageShell>
  );
};
