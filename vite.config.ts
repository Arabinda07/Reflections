import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const lottieLightPlayer = path.resolve(__dirname, 'node_modules/lottie-web/build/player/esm/lottie_light.min.js');

const leanPrecacheAllowlist = [
  /^index\.html$/,
  /^(about|faq|privacy)(\/index)?\.html$/,
  /^(favicon\.ico|apple-touch-icon\.png|robots\.txt|sitemap\.xml|llms\.txt)$/,
  /^assets\/(index|App|vendor-core|vendor-routing|vendor-react)-[^/]+\.(js|css)$/,
  /^assets\/(AboutArabinda|FAQ|PrivacyPolicy|PublicPageIcon)-[^/]+\.js$/,
  /^assets\/fonts\/[^/]+\.woff2$/,
  /^assets\/videos\/(landing_video|landing_video_mobile|sanctuary)\.webp$/,
  /^assets\/images\/(og-social|founder)\.webp$/,
] as const;

const keepLeanPrecacheEntry = (url: string) =>
  leanPrecacheAllowlist.some((pattern) => pattern.test(url));

const vendorChunk = (id: string) => {
  if (id.includes('vite/preload-helper')) return 'vendor-core';
  if (!id.includes('node_modules')) return undefined;

  if (/[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/.test(id)) return 'vendor-core';
  if (id.includes('react-router')) return 'vendor-routing';
  if (id.includes('@capacitor')) return 'vendor-native';
  if (id.includes('@vercel')) return 'vendor-observability';
  if (
    id.includes('react-calendar') ||
    id.includes('date-fns') ||
    id.includes('@wojtekmaj/date-utils') ||
    id.includes('get-user-locale')
  ) return 'vendor-calendar';
  if (id.includes('quill')) return 'vendor-editor';
  if (id.includes('@supabase') || id.includes('idb-keyval')) return 'vendor-supabase';
  if (id.includes('dexie')) return 'vendor-dexie';
  if (id.includes('lottie-react') || id.includes('lottie-web')) return 'vendor-lottie';
  if (id.includes('motion')) return 'vendor-motion';
  if (id.includes('@phosphor-icons')) return undefined;
  if (id.includes('@google/genai') || id.includes('@splinetool/runtime')) return 'vendor-ai';
  if (id.includes('@sentry')) return 'vendor-sentry';
  if (id.includes('posthog-js') || id.includes('@posthog') || id.includes('iceberg-js')) return 'vendor-analytics';
  if (id.includes('zustand')) return 'vendor-state';

  return 'vendor-react';
};

export default defineConfig(() => {
    const hasSentryAuthToken = Boolean(process.env.SENTRY_AUTH_TOKEN);
    const sentrySourcemap: false | 'hidden' = hasSentryAuthToken ? 'hidden' : false;

    return {
      root: __dirname,
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          registerType: 'autoUpdate',
          injectRegister: 'script-defer',
          manifest: {
            name: 'Reflections',
            short_name: 'Reflections',
            description: 'A journal for writing, mood tracking, and reflection. AI stays on demand unless you turn on Smart Mode.',
            theme_color: '#f7f8f6',
            background_color: '#f7f8f6',
            display: 'standalone',
            start_url: '/',
            scope: '/',
            orientation: 'portrait-primary',
            lang: 'en',
            categories: ['health', 'lifestyle', 'productivity'],
            icons: [
              {
                src: 'icons/icon-192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'icons/icon-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any'
              },
              {
                src: 'icons/icon-maskable-512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'maskable'
              }
            ],
            shortcuts: [
              {
                name: 'New Entry',
                short_name: 'Write',
                description: 'Start a new journal entry',
                url: '/notes/new',
                icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
              }
            ]
          },
          workbox: {
            navigateFallback: '/index.html',
            navigateFallbackAllowlist: [/^(?!\/__).*$/],
            cleanupOutdatedCaches: true,
            maximumFileSizeToCacheInBytes: 2 * 1024 * 1024,
            globPatterns: [
              '**/*.{js,css,html,ico,svg,webp,woff2,txt,xml,webmanifest,png}',
              'icons/*.png',
            ],
            globIgnores: [
              '**/vendor-lottie-*.js',
              '**/vendor-analytics-*.js',
              '**/vendor-sentry-*.js',
              '**/*.mp4',
              '**/*.webm',
            ],
            manifestTransforms: [
              async (entries) => ({
                manifest: entries.filter((entry) => keepLeanPrecacheEntry(entry.url)),
                warnings: [],
              }),
            ],
            runtimeCaching: [
              {
                urlPattern: /\/assets\/.*\.(js|css)$/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'app-route-chunks',
                  expiration: {
                    maxEntries: 80,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /\/assets\/lottie\/.*\.(json|lottie)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'lottie-assets',
                  expiration: {
                    maxEntries: 20,
                    maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/auth\/.*/i,
                handler: 'NetworkOnly',
              },
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/v1\/.*/i,
                handler: 'NetworkOnly',
              },
              {
                urlPattern: /.*\.(mp4|webm)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'app-videos',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                  rangeRequests: true,
                },
              },
              {
                urlPattern: /.*\.(ogg|m4a|mp3)$/,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'app-audio',
                  expiration: {
                    maxEntries: 10,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                  rangeRequests: true,
                },
              },
              {
                urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/v1\/object\/public\/.*/i,
                handler: 'CacheFirst',
                options: {
                  cacheName: 'supabase-storage',
                  expiration: {
                    maxEntries: 100,
                    maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                  },
                  cacheableResponse: {
                    statuses: [0, 200],
                  },
                },
              },
            ],
          }
        }),
        // Source map upload — only runs when SENTRY_AUTH_TOKEN is set (CI/CD)
        sentryVitePlugin({
          org: process.env.SENTRY_ORG,
          project: process.env.SENTRY_PROJECT,
          authToken: process.env.SENTRY_AUTH_TOKEN,
          disable: !hasSentryAuthToken,
        }),
      ],
      build: {
        sourcemap: sentrySourcemap,
        modulePreload: {
          resolveDependencies: (_filename, deps) => {
            return deps.filter(dep => 
              !dep.includes('vendor-analytics') && 
              !dep.includes('vendor-supabase') &&
              !dep.includes('vendor-calendar') &&
              !dep.includes('vendor-editor')
            );
          }
        },
        rollupOptions: {
          output: {
            manualChunks: vendorChunk,
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          'lottie-web': lottieLightPlayer,
        }
      }
    };
});
