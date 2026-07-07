/**
 * Preset Tailwind do PsiOps, derivado da fonte única de tokens (src/tokens).
 *
 * Entry point separado (`@psiops/ui/tailwind`) e sem dependência do pacote
 * `tailwindcss`: o preset é um objeto puro/serializável no formato aceito
 * por `presets` (Tailwind v3) e por configs legadas via `@config` (v4).
 *
 * Uso no apps/landing (tailwind.config):
 *
 *   import { psiopsPreset } from "@psiops/ui/tailwind";
 *   export default { presets: [psiopsPreset], content: [...] };
 *
 * Classes resultantes: bg-psi-primary-600, text-psi-success-dark,
 * bg-psi-calm-soft, shadow-soft/lift/card, font-display/body/serif.
 */

import { accent, calm, neutral, primary, semantic, shadows, typography } from "../tokens/index.js";

/** Forma mínima de um preset Tailwind (evita depender de tailwindcss). */
export interface PsiopsTailwindPreset {
  theme: {
    extend: {
      colors: Record<string, Record<string, string>>;
      boxShadow: Record<string, string>;
      fontFamily: Record<string, readonly string[]>;
    };
  };
}

function toColorScale(scale: Record<string | number, string>) {
  return Object.fromEntries(Object.entries(scale).map(([shade, hex]) => [String(shade), hex]));
}

export const psiopsPreset: PsiopsTailwindPreset = {
  theme: {
    extend: {
      colors: {
        "psi-primary": toColorScale(primary),
        "psi-accent": toColorScale(accent),
        "psi-neutral": toColorScale(neutral),
        "psi-success": toColorScale(semantic.success),
        "psi-warning": toColorScale(semantic.warning),
        "psi-error": toColorScale(semantic.error),
        "psi-info": toColorScale(semantic.info),
        "psi-calm": toColorScale(calm),
      },
      boxShadow: {
        soft: shadows.soft.css,
        lift: shadows.lift.css,
        card: shadows.card.css,
      },
      fontFamily: {
        display: typography.display.stack,
        body: typography.body.stack,
        serif: typography.serif.stack,
      },
    },
  },
};

export default psiopsPreset;
