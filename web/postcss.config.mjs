const config = {
  plugins: {
    // optimize memaksa lightningcss meratakan CSS bersarang milik daisyUI; tanpa ini
    // parser Turbopack di mode `next dev` menolak selector relatif ("Invalid empty selector").
    "@tailwindcss/postcss": { optimize: { minify: false } },
  },
};

export default config;
