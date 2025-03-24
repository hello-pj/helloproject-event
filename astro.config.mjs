// astro.config.mjs
import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import react from '@astrojs/react';

export default defineConfig({
    integrations: [tailwind(), react()],
    site: 'https://hello-pj.github.io',
    base: '/helloproject-event',
    output: 'static'
});