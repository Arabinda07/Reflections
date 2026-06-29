import React, { useEffect } from 'react';
import { PublicPageIcon, type PublicPageIconName } from '../../components/ui/PublicPageIcon';
import { PublicPageHero, PublicPageSection, PublicPageShell } from '../../components/ui/PublicPageShell';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { PUBLIC_SEO_COPY } from '../../src/config/publicSeoCopy.js';

type PublicIconCard = {
  icon: PublicPageIconName;
  title: string;
  body: string;
};

const FAQ_SEO = PUBLIC_SEO_COPY.faq;

const guideSections: PublicIconCard[] = [
  {
    icon: 'book',
    title: 'What is Reflections?',
    body:
      'A private place for the mess before it has words. You save notes, name moods, tag patterns, and come back when your brain has cooled down a little.',
  },
  {
    icon: 'heart',
    title: 'Who is Reflections for?',
    body:
      'For people in their 20s and 30s who need one calm tab for the thing they keep replaying. You set the pace, keep your notes private, and choose when AI gets invited.',
  },
  {
    icon: 'pen',
    title: 'Why writing first?',
    body:
      'Because the point is to hear yourself before the app starts talking. AI and Life Wiki refreshes wait until you ask.',
  },
];

const practiceItems: PublicIconCard[] = [
  {
    title: 'The practice',
    body: 'A place to write, one reflection at a time.',
    icon: 'book',
  },
  {
    title: 'Morning or night',
    body: 'Set an intention for the day or clear your head before sleep. Write whenever you find your rhythm.',
    icon: 'compass',
  },
  {
    title: 'The daily spark',
    body: "For the thought that keeps doing laps. Tap the spark when the page is blank but your mind clearly isn't.",
    icon: 'tag',
  },
  {
    title: 'Just you and the page',
    body: 'Focus Mode lets the interface fade away. No distractions, just you and your words.',
    icon: 'shield',
  },
  {
    title: 'Naming the feeling',
    body: "Check in with your mood. Feelings, but make them less loud.",
    icon: 'heart',
  },
  {
    title: 'Keeping up with people',
    body: 'Keep a private list of the people you want to stay close to. Each week it names a few worth reaching out to, with a reason.',
    icon: 'user',
  },
];

// The substantive trust/billing answers, featured in a tone panel.
const featuredDetails: PublicIconCard[] = [
  {
    title: 'Encrypted on your device',
    body: 'Your notes, moods, letters, attachments, Life Wiki, and relationships are encrypted on your device before they are saved. The key comes from your password, so the server stores writing it cannot read.',
    icon: 'shield',
  },
  {
    title: 'Your password and recovery phrase',
    body: 'You unlock your writing once on each device. If you forget your password, the recovery phrase you saved during setup is the only other way in, so keep it somewhere safe. On a device you trust, you can choose to stay unlocked.',
    icon: 'shield',
  },
  {
    title: 'Plans and billing',
    body:
      'Pro has weekly and monthly options. The trial lasts 3 days. No payment is due during the trial, and Reflections shows the first charge date before checkout. After that, weekly Pro renews at ₹49/week and monthly Pro renews at ₹149/month until canceled.',
    icon: 'creditCard',
  },
];

const detailItems: PublicIconCard[] = [
  {
    title: 'Private to your account',
    body: 'Your notes are tied to your login and protected by account-level security. You own your writing, period.',
    icon: 'shield',
  },
  {
    title: 'Notice the rhythm',
    body: 'See how your feelings shift over time with simple mood mapping.',
    icon: 'brain',
  },
  {
    title: 'Keep what matters',
    body: 'Attach images, tasks, and notes as you need them.',
    icon: 'tag',
  },
  {
    title: 'AI on your terms',
    body: 'Reflections can spot patterns or refresh your Life Wiki, but only when you choose. It never fires in the background. See our Privacy page for how your notes are protected.',
    icon: 'brain',
  },
  {
    title: 'Relationships, kept private',
    body: 'The people you add and the notes around them are encrypted on your device like the rest of your writing. Nothing is shared, scored, or pushed at you — it waits until you open it.',
    icon: 'heart',
  },
];

const featureGrid: PublicIconCard[] = [
  { title: 'Ambient sound', body: 'Soundscapes to help you focus. Quiet the room as you write.', icon: 'headphones' },
  { title: 'Whisper mode', body: 'Speak your thoughts. Fast, private transcription for when you need it.', icon: 'microphone' },
  { title: 'Writing sparks', body: 'Gentle prompts for those days when you aren\'t sure where to start.', icon: 'tag' },
  { title: 'Visual covers', body: 'Add atmospheric imagery to set the mood for your entries.', icon: 'image' },
  { title: 'Embedded tasks', body: 'Keep track of follow-ups and intentions right inside your prose.', icon: 'checklist' },
  { title: 'Life Wiki', body: 'A high-level summary of your world, updated only when you choose.', icon: 'brain' },
  { title: 'Relationships', body: 'A private list of the people who matter, with a few weekly reach-outs worth making.', icon: 'heart' },
];

const SUPPORT_EMAIL = 'robinsaha434@gmail.com';

export const FAQ: React.FC = () => {
  useDocumentMeta({
    title: FAQ_SEO.title,
    description: FAQ_SEO.description,
    path: FAQ_SEO.path,
  });

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <PublicPageShell scope="sky">
      <PublicPageHero
        title={
          <>
            Untangle your <br />
            <span className="font-serif italic font-normal text-green">thoughts</span>
          </>
        }
        updated="June 2026"
        intro={
          <p className="max-w-[36rem] font-serif text-[18px] leading-relaxed text-gray-light">
            Reflections is a calm, private writing space for the thoughts that keep doing laps. This guide explains what
            the product does, how AI waits, and what stays yours.
          </p>
        }
      />

      {/* Quick guide */}
      <section className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:items-stretch">
        <article className="surface-flat surface-tone-sage flex flex-col justify-center rounded-[var(--radius-panel)] p-8 md:p-12">
          <h2 className="max-w-[12ch] text-mk-h2 font-display font-bold leading-tight text-gray-text">
            Writing stays at the center.
          </h2>
          <p className="mt-6 max-w-[52ch] font-serif text-[20px] italic leading-relaxed text-gray-text/75">
            Reflections is not a feed, a coach, or a scoreboard. It is a private place for notes, mood labels, and
            patterns you choose to inspect.
          </p>
        </article>

        <div className="flex flex-col justify-center gap-8">
          {guideSections.map((section) => (
            <article key={section.title} className="group">
              <h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold leading-tight text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={section.icon} size={20} className="flex-none text-green" />
                {section.title}
              </h3>
              <p className="mt-2.5 font-sans text-ui-base leading-relaxed text-gray-light">{section.body}</p>
            </article>
          ))}
        </div>
      </section>

      {/* The practice */}
      <PublicPageSection
        heading="A space to write, one reflection at a time"
        lead="The interface is deliberately quiet. The useful pieces stay close to the page, not above it."
      >
        <div className="grid gap-x-12 gap-y-9 sm:grid-cols-2">
          {practiceItems.map((item) => (
            <article key={item.title} className="group">
              <h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={item.icon} size={19} className="flex-none text-green" />
                {item.title}
              </h3>
              <p className="mt-2 font-sans text-ui-base leading-relaxed text-gray-light">{item.body}</p>
            </article>
          ))}
        </div>
      </PublicPageSection>

      {/* The details — featured trust/billing trio + the quieter list */}
      <PublicPageSection heading="Tools built to support you without getting in the way">
        <div className="surface-flat surface-tone-sage grid gap-x-10 gap-y-8 rounded-[var(--radius-panel)] p-7 md:grid-cols-3 md:p-10">
          {featuredDetails.map((item) => (
            <article key={item.title} className="group">
              <h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={item.icon} size={20} className="flex-none text-green" />
                {item.title}
              </h3>
              <p className="mt-3 font-sans text-ui-base leading-relaxed text-gray-light">{item.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
          {detailItems.map((item) => (
            <article key={item.title} className="group">
              <h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={item.icon} size={19} className="flex-none text-green" />
                {item.title}
              </h3>
              <p className="mt-2 font-sans text-ui-base leading-relaxed text-gray-light">{item.body}</p>
            </article>
          ))}
        </div>
      </PublicPageSection>

      {/* Feature shelf */}
      <PublicPageSection heading="Small tools, close to the page">
        <div className="grid gap-x-10 gap-y-8 sm:grid-cols-2">
          {featureGrid.map((feature) => (
            <article key={feature.title} className="group">
              <h3 className="flex items-center gap-2.5 text-ui-lg font-display font-bold text-gray-text transition-colors duration-300 group-hover:text-green">
                <PublicPageIcon name={feature.icon} size={19} className="flex-none text-green" />
                {feature.title}
              </h3>
              <p className="mt-2 font-sans text-ui-base leading-relaxed text-gray-light">{feature.body}</p>
            </article>
          ))}
        </div>
      </PublicPageSection>

      {/* Contact */}
      <section>
        <p className="max-w-[42rem] font-sans text-ui-base leading-relaxed text-gray-light">
          Questions about Reflections can go to{' '}
          <a className="public-contact-link" href={`mailto:${SUPPORT_EMAIL}`}>
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </PublicPageShell>
  );
};
