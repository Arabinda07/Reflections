import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PublicPageIcon, type PublicPageIconName } from '../../components/ui/PublicPageIcon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { PUBLIC_SEO_COPY } from '../../src/config/publicSeoCopy.js';
import { getPublicHomePath } from '../../src/utils/authHints';

const RELATIONSHIPS_SEO = PUBLIC_SEO_COPY.relationships;

const sectionIcons: PublicPageIconName[] = ['heart', 'compass', 'lock', 'feather'];

export const RelationshipsFeature: React.FC = () => {
  useDocumentMeta({
    title: RELATIONSHIPS_SEO.title,
    description: RELATIONSHIPS_SEO.description,
    path: RELATIONSHIPS_SEO.path,
  });
  const navigate = useNavigate();
  const homePath = getPublicHomePath();

  return (
    <PageContainer as="section" size="app" className="py-12 sm:py-16">
      <div className="mx-auto max-w-5xl px-4 sm:px-6">
        <button
          onClick={() => navigate(homePath)}
          className="group -ml-2 mb-12 flex min-h-11 w-fit items-center gap-2 px-2 text-sm font-bold text-gray-nav transition-[color,transform] duration-300 hover:-translate-x-1 hover:text-green"
          aria-label="Back to home"
        >
          <PublicPageIcon name="arrowLeft" size={16} className="transition-transform group-hover:scale-110" />
          <span>Back</span>
        </button>

        {/* Hero */}
        <header className="mb-20 max-w-3xl space-y-8">
          <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
            Quietly keep up with the
            <br />
            <span className="font-serif italic font-normal text-green">people who matter</span>
          </h1>
          <p className="max-w-[55ch] text-xl font-serif italic leading-relaxed text-gray-text">
            {RELATIONSHIPS_SEO.intro}
          </p>
          <p className="text-[12px] font-bold uppercase tracking-widest text-gray-nav">Last updated · June 2026</p>
        </header>

        {/* Sections */}
        <div className="space-y-4 border-t border-gray-text/5 pt-8">
          {RELATIONSHIPS_SEO.sections.map((section, index) => (
            <section
              key={section.title}
              className="group flex flex-col md:flex-row gap-6 md:gap-12 rounded-[2rem] p-6 md:p-10 transition-colors duration-500 hover:bg-gray-text/[0.03]"
            >
              <div className="md:w-1/3 shrink-0 flex flex-col items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[oklch(from_var(--panel-bg)_l_c_h)] shadow-sm ring-1 ring-border/70 transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-6">
                  <PublicPageIcon name={sectionIcons[index % sectionIcons.length]} size={24} className="text-green" />
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
