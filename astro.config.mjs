import { defineConfig } from 'astro/config';

// Tailwindの参照を一時的に削除
export default defineConfig({
    site: 'https://hello-pj.github.io',
    base: '/helloproject-event',
    output: 'static'
});