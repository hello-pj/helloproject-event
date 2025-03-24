/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ['./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}'],
    theme: {
        extend: {
            colors: {
                // カスタムカラーを追加する場合はここに定義
                'primary': '#4F46E5',
                'secondary': '#EC4899',
                'accent': '#10B981',
            },
            fontFamily: {
                // カスタムフォントを定義する場合はここに追加
                'sans': ['"Noto Sans JP"', 'sans-serif'],
            },
        },
    },
    plugins: [],
}