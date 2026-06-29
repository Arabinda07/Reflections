import React from 'react';
import { useNavigate } from 'react-router-dom';
import { PageContainer } from '../../components/ui/PageContainer';
import { PublicPageIcon } from '../../components/ui/PublicPageIcon';
import { useDocumentMeta } from '../../hooks/useDocumentMeta';
import { PUBLIC_SEO_COPY } from '../../src/config/publicSeoCopy.js';
import { getPublicHomePath } from '../../src/utils/authHints';

type ComparisonSeoKey = 'dayOne';

type ComparisonPageProps = {
  seoKey: ComparisonSeoKey;
};

export const ComparisonPage: React.FC<ComparisonPageProps> = ({ seoKey }) => {
  const seo = PUBLIC_SEO_COPY[seoKey];
  useDocumentMeta({
    title: seo.title,
    description: seo.description,
    path: seo.path,
  });
  const navigate = useNavigate();
  const homePath = getPublicHomePath();
  const comparison = seo.comparison;
  const faqItems = seo.faqSchema ?? [];

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

        <header className="mb-12 max-w-3xl space-y-6">
          <h1 className="text-mk-display font-display font-extrabold leading-[0.95] tracking-normal text-gray-text text-balance">
            {seo.h1}
          </h1>
          <p className="max-w-[60ch] text-lg font-serif italic leading-relaxed text-gray-text">{seo.intro}</p>
        </header>

        {comparison && (
          <div className="mb-16 overflow-x-auto rounded-[1.5rem] border border-border">
            <table className="w-full border-collapse text-left text-ui-base">
              <caption className="sr-only">{comparison.caption}</caption>
              <thead>
                <tr className="border-b border-border bg-gray-text/[0.03]">
                  {comparison.headers.map((header, index) => (
                    <th
                      key={index}
                      scope="col"
                      className="px-4 py-3 font-display text-ui-xs font-extrabold uppercase tracking-wide text-gray-text first:w-[30%]"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {comparison.rows.map((row, rowIndex) => (
                  <tr key={rowIndex} className="border-b border-border/60 last:border-0">
                    {row.map((cell, cellIndex) =>
                      cellIndex === 0 ? (
                        <th key={cellIndex} scope="row" className="px-4 py-3 font-bold text-gray-text">
                          {cell}
                        </th>
                      ) : (
                        <td key={cellIndex} className="px-4 py-3 text-gray-light">
                          {cell}
                        </td>
                      ),
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="space-y-4 border-t border-gray-text/5 pt-8">
          {seo.sections.map((section) => (
            <section
              key={section.title}
              className="group flex flex-col gap-3 rounded-[2rem] p-6 md:p-8 transition-colors duration-500 hover:bg-gray-text/[0.03]"
            >
              <h2 className="text-ui-lg font-display font-bold leading-tight text-gray-text">{section.title}</h2>
              <p className="font-sans text-ui-base leading-relaxed text-gray-light max-w-[70ch]">{section.body}</p>
            </section>
          ))}
        </div>

        {faqItems.length > 0 && (
          <div className="mt-16 space-y-4 border-t border-gray-text/5 pt-8">
            <h2 className="mb-4 text-ui-lg font-display font-bold text-gray-text">Common questions</h2>
            {faqItems.map((item) => (
              <details key={item.question} className="rounded-2xl border border-border p-5">
                <summary className="cursor-pointer font-bold text-gray-text">{item.question}</summary>
                <p className="mt-3 text-ui-base leading-relaxed text-gray-light max-w-[70ch]">{item.answer}</p>
              </details>
            ))}
          </div>
        )}

        <div className="mt-16">
          <a
            href="/signup"
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-green px-6 py-3 text-ui-base font-extrabold text-white shadow-sm shadow-green/10 transition-colors hover:bg-green-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green focus-visible:ring-offset-2"
          >
            Begin writing
          </a>
        </div>
      </div>
    </PageContainer>
  );
};
