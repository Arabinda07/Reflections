import { useEffect } from 'react';

const SITE_ORIGIN = 'https://reflections-ebon.vercel.app';
const DEFAULT_TITLE = 'Reflections – A Calm Space to Write and Reflect';
const DEFAULT_DESCRIPTION =
  'A private journal for writing notes, naming moods, and noticing patterns. Reflections stays out of the way until you need it.';

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
    if (canonicalEl) canonicalEl.href = `${SITE_ORIGIN}${path}`;

    // Open Graph / Facebook
    const ogTitleEl = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (ogTitleEl) ogTitleEl.content = title;

    const ogDescEl = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (ogDescEl) ogDescEl.content = description;

    const ogUrlEl = document.querySelector<HTMLMetaElement>('meta[property="og:url"]');
    if (ogUrlEl) ogUrlEl.content = `${SITE_ORIGIN}${path}`;

    // Twitter
    const twTitleEl = document.querySelector<HTMLMetaElement>('meta[name="twitter:title"]');
    if (twTitleEl) twTitleEl.content = title;

    const twDescEl = document.querySelector<HTMLMetaElement>('meta[name="twitter:description"]');
    if (twDescEl) twDescEl.content = description;

    return () => {
      document.title = DEFAULT_TITLE;
      if (descEl) descEl.content = DEFAULT_DESCRIPTION;
      if (canonicalEl) canonicalEl.href = `${SITE_ORIGIN}/`;

      if (ogTitleEl) ogTitleEl.content = DEFAULT_TITLE;
      if (ogDescEl) ogDescEl.content = DEFAULT_DESCRIPTION;
      if (ogUrlEl) ogUrlEl.content = `${SITE_ORIGIN}/`;

      if (twTitleEl) twTitleEl.content = DEFAULT_TITLE;
      if (twDescEl) twDescEl.content = DEFAULT_DESCRIPTION;
    };
  }, [title, description, path]);
}
