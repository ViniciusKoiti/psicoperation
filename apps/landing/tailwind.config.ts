import { psiopsPreset } from "@psiops/ui/tailwind";
import { typography } from "@psiops/ui/tokens";

/**
 * Config Tailwind do apps/landing.
 *
 * - `presets`: tokens do design system (cores psi-*, sombras soft/lift/card,
 *   pilhas tipográficas) vindos de @psiops/ui/tailwind (formato v3).
 * - `fontFamily`: sobrescreve as famílias principais pelas variáveis CSS
 *   expostas pelo next/font no layout raiz (fontes self-hosted), mantendo a
 *   pilha de fallback dos tokens.
 */
const config = {
  content: ["./src/**/*.{ts,tsx}"],
  presets: [psiopsPreset],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", ...typography.display.stack],
        body: ["var(--font-body)", ...typography.body.stack],
        serif: ["var(--font-serif)", ...typography.serif.stack],
      },
    },
  },
};

export default config;
