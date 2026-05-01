import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { sentryVitePlugin } from '@sentry/vite-plugin';

const vendorChunk = (id: string) => {
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
  if (id.includes('@supabase') || id.includes('dexie') || id.includes('idb-keyval')) return 'vendor-data';
  if (id.includes('@lottiefiles')) return 'vendor-lottie';
  if (id.includes('motion')) return 'vendor-motion';
  if (id.includes('@phosphor-icons')) return 'vendor-icons';
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
          includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
          manifest: {
            name: 'Reflections',
            short_name: 'Reflections',
            description: 'A private writing-first journal with optional AI support when you ask for it.',
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
            cleanupOutdatedCaches: true,
            maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
            globIgnores: [
              '**/vendor-lottie-*.js',
              '**/vendor-analytics-*.js',
              '**/vendor-sentry-*.js',
            ],
            runtimeCaching: [
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
        rollupOptions: {
          output: {
            manualChunks: vendorChunk,
          },
        },
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
