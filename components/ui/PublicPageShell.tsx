import React from 'react';
import { PageContainer } from './PageContainer';
import { PublicPageIcon } from './PublicPageIcon';

type PublicScope = 'paper' | 'sage' | 'sky' | 'honey' | 'clay' | 'neutral';
type PublicTone = 'paper' | 'sage' | 'sky' | 'honey' | 'clay';

interface PublicPageShellProps {
  /** Surface scope tint for the whole page wash. */
  scope?: PublicScope;
  children: React.ReactNode;
}

/**
 * Shared shell for the public content pages (About, FAQ, Privacy) so they read
 * as one system: a single page wash, one container width (`page-container`,
 * 1180px), and consistent vertical rhythm via `--space-section`.
 */
export const PublicPageShell: React.FC<PublicPageShellProps> = ({ scope = 'paper', children }) => (
  <div
    className={`surface-scope-${scope} page-wash relative min-h-full bg-body pb-28 text-gray-text transition-colors duration-300`}
  >
    <PageContainer
      as="div"
      size="app"
      className="flex flex-col gap-[var(--space-section)] py-16 sm:py-20 lg:py-24"
    >
      {children}
    </PageContainer>
  </div>
);

interface PublicPageHeroProps {
  /** Supports a serif-italic accent span inside the heading. */
  title: React.ReactNode;
  intro: React.ReactNode;
  updated?: string;
  onBack?: () => void;
  /** Optional media slot (e.g. the founder photo on About). */
  media?: React.ReactNode;
}

const BackButton: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <button
    type="button"
    onClick={onClick}
    aria-label="Back to home"
    className="group -ml-2 mb-8 inline-flex min-h-11 w-fit items-center gap-2 rounded-[var(--radius-control)] px-3 text-btn-sm font-bold text-gray-nav transition-[color,transform] duration-300 hover:-translate-x-1 hover:text-green focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green"
  >
    <PublicPageIcon name="arrowLeft" size={16} className="transition-transform group-hover:scale-110" />
    <span>Back</span>
  </button>
);

const Heading: React.FC<{ title: React.ReactNode }> = ({ title }) => (
  <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
    {title}
  </h1>
);

const UpdatedLine: React.FC<{ updated?: string }> = ({ updated }) =>
  updated ? (
    <p className="text-ui-xs font-bold uppercase tracking-widest text-gray-nav">Last updated · {updated}</p>
  ) : null;

/**
 * Unified hero. With `media` it splits photo / text (About); without, the
 * heading and intro sit side by side on large screens (FAQ, Privacy).
 */
export const PublicPageHero: React.FC<PublicPageHeroProps> = ({ title, intro, updated, onBack, media }) => {
  if (media) {
    return (
      <header>
        {onBack && <BackButton onClick={onBack} />}
        <div className="grid items-center gap-12 md:grid-cols-12 md:gap-16">
          <div className="order-first md:order-last md:col-span-5">{media}</div>
          <div className="order-last space-y-8 md:order-first md:col-span-7">
            <Heading title={title} />
            <div className="space-y-6">
              {intro}
              <UpdatedLine updated={updated} />
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="grid gap-8 lg:grid-cols-12 lg:items-end">
      <div className="lg:col-span-8">
        {onBack && <BackButton onClick={onBack} />}
        <Heading title={title} />
      </div>
      <div className="space-y-4 lg:col-span-4">
        {intro}
        <UpdatedLine updated={updated} />
      </div>
    </header>
  );
};

interface PublicPageSectionProps {
  heading?: React.ReactNode;
  lead?: React.ReactNode;
  /** Wrap the section in a tone surface panel for grouping (no separators). */
  tone?: PublicTone;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Borderless content section. Grouping comes from whitespace and optional tone
 * fills — never from `border-*` / `divide-*` rules.
 */
export const PublicPageSection: React.FC<PublicPageSectionProps> = ({
  heading,
  lead,
  tone,
  className = '',
  children,
}) => {
  const toneClass = tone
    ? `surface-flat surface-tone-${tone} rounded-[var(--radius-panel)] p-7 md:p-10`
    : '';

  return (
    <section className={`${toneClass} ${className}`.trim()}>
      {(heading || lead) && (
        <div className="mb-8 max-w-3xl space-y-4">
          {heading && (
            <h2 className="text-mk-h2 font-display font-bold leading-tight text-gray-text text-balance">{heading}</h2>
          )}
          {lead && <p className="max-w-[60ch] font-sans text-ui-base leading-relaxed text-gray-light">{lead}</p>}
        </div>
      )}
      {children}
    </section>
  );
};
