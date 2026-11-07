/// <reference types="vitest/config" />
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { kidFeedback } from './scripts/feedback/plugin.ts';

const BASE = '/pocket-town/';

/**
 * Content Security Policy for the production build only (the dev server needs
 * inline scripts and a websocket for hot reload). It makes the "no network
 * requests except our own static files" rule enforced by the browser, not just
 * by convention.
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self' data: blob:",
  "connect-src 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ');

function contentSecurityPolicy(): Plugin {
  return {
    name: 'pocket-town:csp',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP },
          injectTo: 'head-prepend',
        },
      ],
    },
  };
}

export default defineConfig(({ mode }) => ({
  base: BASE,
  // Kid play-testing (dev server only): `npm run feedback` / `npm run feedback:lan`.
  server: { watch: { ignored: ['**/feedback/**'] } },
  plugins: [
    react(),
    contentSecurityPolicy(),
    kidFeedback(),
    // A tablet's browser only allows the microphone over https.
    mode === 'feedback-lan' && basicSsl(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: BASE,
        name: 'Pocket Town',
        short_name: 'Pocket Town',
        description: 'A little town of peg-folk to build, watch and play with.',
        lang: 'en',
        display: 'standalone',
        orientation: 'any',
        background_color: '#FFE6CF',
        theme_color: '#EF4B2F',
        start_url: BASE,
        scope: BASE,
        icons: [
          { src: 'pwa-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'pwa-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only Latin and Latin Extended font files are precached; other scripts
        // still load on demand from our own origin if a name ever needs them.
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}', '**/*latin*.woff2'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
    restoreMocks: true,
  },
}));
