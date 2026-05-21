import { useEffect } from 'react';
import { buildPublicCanonicalUrl } from '../src/config/publicSite.js';
import { PUBLIC_SEO_DEFAULT } from '../src/config/publicSeoCopy.js';

const DEFAULT_TITLE = PUBLIC_SEO_DEFAULT.title;
const DEFAULT_DESCRIPTION = PUBLIC_SEO_DEFAULT.description;

interface DocumentMeta {
  title: string;
  description: string;
  path: string;
}

export function useDocumentMeta({ title, description, path }: DocumentMeta) {
  useEffect(() => {
    document.title = title;

    // Primary Meta Tags
    const descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descEl) descEl.content = description;

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.href = buildPublicCanonicalUrl(path);

    // Open Graph / Facebook
    const ogTitleEl = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.content = title;

    const ogDescEl = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.content = description;

    const ogUrlEl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.content = buildPublicCanonicalUrl(path);

    // Twitter
    const twTitleEl = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twTitleEl) twTitleEl.content = title;

    const twDescEl = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twDescEl) twDescEl.content = description;

    return () => {
      document.title = DEFAULT_TITLE;
      if (descEl) descEl.content = DEFAULT_DESCRIPTION;
      if (canonicalEl) canonicalEl.href = buildPublicCanonicalUrl('/');

      if (ogTitleEl) ogTitleEl.content = DEFAULT_TITLE;
      if (ogDescEl) ogDescEl.content = DEFAULT_DESCRIPTION;
      if (ogUrlEl) ogUrlEl.content = buildPublicCanonicalUrl('/');

      if (twTitleEl) twTitleEl.content = DEFAULT_TITLE;
      if (twDescEl) twDescEl.content = DEFAULT_DESCRIPTION;
    };
  }, [title, description, path]);
}
