import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
    return {
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
            theme_color: '#ffffff',
            background_color: '#ffffff',
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
                url: '/#/create-note',
                icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }]
              }
            ]
          },
          workbox: {
            maximumFileSizeToCacheInBytes: 50 * 1024 * 1024, // 50 MiB
            globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp4,ogg,m4a,json,spline,splinecode}'],
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
                urlPattern: /.*\.mp4$/,
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
        })
      ],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
