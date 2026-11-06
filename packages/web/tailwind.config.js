import tailwindAnimate from 'tailwindcss-animate';

/** Tokens, fonts and radii live in @crypt.fyi/theme/tokens.css, shared with the extension. */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx,js,jsx}'],
  plugins: [tailwindAnimate],
};
