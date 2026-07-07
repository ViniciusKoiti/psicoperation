/**
 * Tema Mantine do PsiOps, derivado da fonte única de tokens (src/tokens).
 *
 * Entry point separado (`@psiops/ui/mantine`) para que apenas o apps/clinic
 * — único consumidor de Mantine — pague a dependência: `@mantine/core` é
 * peer OPCIONAL do pacote e nunca é importada pelos demais entries.
 *
 * Uso no apps/clinic:
 *
 *   import { MantineProvider } from "@mantine/core";
 *   import { psiopsTheme } from "@psiops/ui/mantine";
 *
 *   <MantineProvider theme={psiopsTheme}>...</MantineProvider>
 */

import { createTheme, type MantineColorsTuple } from "@mantine/core";
import {
  accent,
  fontStackToCss,
  neutral,
  primary,
  shadows,
  tokens,
  typography,
} from "../tokens/index.js";

/** Shades 50–900 na ordem esperada pelas tuplas de cor do Mantine. */
type TenShadeScale = Record<50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900, string>;

function toMantineTuple(scale: TenShadeScale): MantineColorsTuple {
  return [
    scale[50],
    scale[100],
    scale[200],
    scale[300],
    scale[400],
    scale[500],
    scale[600],
    scale[700],
    scale[800],
    scale[900],
  ];
}

/**
 * Índice da shade principal nas tuplas (50→0 … 900→9): 6 ≡ shade 600,
 * a cor de marca usada no protótipo (primary-600 / accent-600).
 */
export const PSIOPS_PRIMARY_SHADE = 6;

export const psiopsTheme = createTheme({
  fontFamily: fontStackToCss(typography.body.stack),
  headings: {
    fontFamily: fontStackToCss(typography.display.stack),
    fontWeight: "600",
  },
  white: neutral[0],
  black: neutral[950],
  colors: {
    primary: toMantineTuple(primary),
    accent: toMantineTuple(accent),
    // neutral-0 e neutral-950 ficam em white/black (tuplas têm 10 posições).
    neutral: toMantineTuple(neutral),
  },
  primaryColor: "primary",
  primaryShade: PSIOPS_PRIMARY_SHADE,
  shadows: {
    // Mapeamento das sombras nomeadas da spec para a escala do Mantine.
    sm: shadows.card.css,
    md: shadows.soft.css,
    lg: shadows.lift.css,
  },
  other: {
    // Tokens integrais (inclui semânticas, calm e tipografia) para consumo
    // programático via theme.other.psiops — ex.: cores light/medium/dark.
    psiops: tokens,
  },
});

export type PsiopsMantineTheme = typeof psiopsTheme;
