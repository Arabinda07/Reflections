export const CANONICAL_PUBLIC_ORIGIN = 'https://www.reflections-sanctuary.space';
export const FALLBACK_PUBLIC_ORIGIN = 'https://reflections-ebon.vercel.app';

export const PUBLIC_CANONICAL_PATHS = ['/', '/faq', '/privacy', '/about'];

export const buildPublicCanonicalUrl = (path = '/') =>
  `${CANONICAL_PUBLIC_ORIGIN}${path === '/' ? '/' : path}`;
