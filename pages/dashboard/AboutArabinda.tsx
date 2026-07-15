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
    title: 'Our minds are always busy',
    icon: 'pen',
    body: 'Between office work, Instagram reels, WhatsApp chats, and family, our brains never get a break. Even when we try to rest, we are still thinking about the next thing. Reflections is my small attempt to help you pause and clear that mental clutter.',
  },
  {
    title: 'Write it down to let it go',
    icon: 'sparkle',
    body: 'Therapy is helpful, but it is too expensive or hard to find for many of us. Reflections is not a replacement for professional therapy. It is just a simple, everyday tool. When you write a thought down, it stops spinning in your head and taking over your day.',
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
        updated="July 2026"
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
              Tired of keeping everything in your head? This app might just be for you.
            </p>
            <p className="max-w-[55ch] font-sans text-ui-base leading-relaxed text-gray-light">
              We all try to juggle too many things—tasks, random ideas, errands, and worries. It clogs up our brain and makes it hard to focus on what actually matters right now.
            </p>
            <p className="max-w-[55ch] font-sans text-ui-base leading-relaxed text-gray-light">
              And when you open your phone to quickly write something down, you see a dozen notifications. Before you know it, you are distracted, and you have forgotten what you wanted to do in the first place.
            </p>
          </>
        }
      />

      <div className="space-y-3 mt-12">
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
