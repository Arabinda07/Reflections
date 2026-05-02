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

    const descEl = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (descEl) descEl.content = description;

    const canonicalEl = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (canonicalEl) canonicalEl.href = `${SITE_ORIGIN}${path}`;

    return () => {
      document.title = DEFAULT_TITLE;
      if (descEl) descEl.content = DEFAULT_DESCRIPTION;
      if (canonicalEl) canonicalEl.href = `${SITE_ORIGIN}/`;
    };
  }, [title, description, path]);
}
