import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      // generateSW: Workbox generates the service worker automatically.
      // Push notification handling is done via sw-push.js (registered in main.jsx).
      strategies: 'generateSW',
      manifest: {
        name: 'Minute Mantra',
        short_name: 'Mantra',
        description: 'Learn a new mantra each morning. Chant for one minute. Transform your day.',
        start_url: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#fdf8f0',
        theme_color: '#b8860b',
        icons: [
          {
            src: 'https://minute-mantra.b-cdn.net/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'https://minute-mantra.b-cdn.net/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'https://minute-mantra.b-cdn.net/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api/],
        cleanupOutdatedCaches: true,
        skipWaiting: true,
        clientsClaim: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/minute-mantra\.b-cdn\.net\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'bunny-cdn-cache',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/mantras\/today/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'mantra-api-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
