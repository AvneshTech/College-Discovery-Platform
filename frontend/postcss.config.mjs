// Tailwind CSS v4 uses the dedicated PostCSS plugin (the globals.css uses
// `@import "tailwindcss"` + `@custom-variant`, both v4 syntax).
const config = {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};

export default config;
