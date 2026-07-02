// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';

// https://astro.build/config
export default defineConfig({
  site: 'https://wallaroofc.com',

  // Static by default; individual routes opt in to SSR with `export const prerender = false`
  output: 'static',
  adapter: vercel({
    webAnalytics: { enabled: true },
    imageService: true,
  }),

  build: { inlineStylesheets: 'auto' },

  vite: {
    plugins: [tailwindcss()]
  },

  integrations: [sitemap()]
});
