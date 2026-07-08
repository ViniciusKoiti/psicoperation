/**
 * Pipeline CSS próprio do apps/landing (Tailwind v3 via PostCSS).
 * O protótipo de referência usa Tailwind por CDN — isso é artefato de
 * handoff e é proibido em produção; aqui o CSS é compilado no build.
 */
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
