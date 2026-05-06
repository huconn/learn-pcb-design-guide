// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import svelte from '@astrojs/svelte';
import mdx from '@astrojs/mdx';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

// https://astro.build/config
// Env-driven so the same repo can deploy to multiple hosts (e.g. /pcb under
// hulryung.com, /learn/hardware-pcb-guide under huconn.com). Defaults match
// the original hulryung deployment so existing behavior is preserved.
const BASE_PATH = process.env.BASE_PATH ?? '/pcb';
const SITE_URL = process.env.SITE_URL ?? 'https://hulryung.com';

export default defineConfig({
  site: SITE_URL,
  base: BASE_PATH,
  trailingSlash: 'never',
  integrations: [svelte(), mdx()],
  vite: { plugins: [tailwindcss()] },
  markdown: {
    remarkPlugins: [remarkMath],
    rehypePlugins: [rehypeKatex],
  },
});
