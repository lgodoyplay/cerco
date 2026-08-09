import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.png', 'LOGO.gif', 'pwa/apple-touch-icon.png'],
      manifest: {
        name: 'CIVIL EUFORIA - Investigativa do Estado da Euforia',
        short_name: 'CIVIL EUFORIA',
        description: 'Plataforma investigativa da CIVIL EUFORIA com acesso rapido e seguro.',
        start_url: '/',
        display: 'standalone',
        background_color: '#020617',
        theme_color: '#020617',
        lang: 'pt-BR',
        icons: [
          {
            src: '/pwa/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: '/pwa/icon-512-maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,gif,webp,woff,woff2}'],
        globIgnores: ['**/LOGO.gif', '**/PDF/fundo.png'],
        runtimeCaching: [
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'script' ||
              request.destination === 'style' ||
              request.destination === 'worker' ||
              (request.destination === 'document' && url.origin === self.location.origin),
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'app-shell-cache',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request, url }) =>
              request.destination === 'image' && url.origin === self.location.origin,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 80,
                maxAgeSeconds: 7 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: ({ request }) => request.destination === 'font',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'font-cache',
              expiration: {
                maxEntries: 20,
                maxAgeSeconds: 30 * 24 * 60 * 60,
              },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.(co|in)\/.*$/,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /^https?:\/\/.*\/api\/.*$/,
            handler: 'NetworkOnly',
          },
        ],
      },
    }),
  ],
  build: {
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'clsx'],
        },
      },
    },
  },
})
