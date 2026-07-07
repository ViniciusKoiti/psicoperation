/**
 * Fonte única dos tokens de design do PsiOps.
 *
 * Todos os valores foram transcritos de docs/design/landing-page-spec.md
 * (§2 Tipografia e §3 Cores). Os demais alvos do pacote — tokens.json,
 * css/tokens.css, tema Mantine e preset Tailwind — DERIVAM deste módulo;
 * nunca duplique valores à mão em outro lugar.
 *
 * A fidelidade à spec é garantida por tests/spec-fidelity.test.ts, que
 * parseia o markdown da spec e compara com este módulo valor a valor.
 */

// ---------------------------------------------------------------------------
// Cores
// ---------------------------------------------------------------------------

/** Primary (roxo) — spec §3. */
export const primary = {
  50: "#F5F3FA",
  100: "#EBE7F4",
  200: "#D9D2EA",
  300: "#C0B5DC",
  400: "#A294C9",
  500: "#8676B5",
  600: "#6E5E9E",
  700: "#594C81",
  800: "#443A61",
  900: "#2F2842",
} as const;

/** Accent (terracota) — spec §3. */
export const accent = {
  50: "#FCF3F0",
  100: "#FAE6DF",
  200: "#F4CCBF",
  300: "#ECAE9B",
  400: "#E08E75",
  500: "#D2725A",
  600: "#BC5C45",
  700: "#9C4A37",
  800: "#7A3A2C",
  900: "#532823",
} as const;

/** Neutral (cinza quente) — spec §3. */
export const neutral = {
  0: "#FFFFFF",
  50: "#FAF9F7",
  100: "#F4F2EE",
  200: "#E9E5DF",
  300: "#D8D2C9",
  400: "#BAB2A6",
  500: "#968D7F",
  600: "#756D61",
  700: "#595348",
  800: "#3D3833",
  900: "#262320",
  950: "#181614",
} as const;

/** Semânticas (light/medium/dark) — spec §3. */
export const semantic = {
  success: { light: "#E7F1EA", medium: "#7FB08D", dark: "#3D6B4E" },
  warning: { light: "#FBF1DE", medium: "#E0B057", dark: "#8A6321" },
  error: { light: "#F9E9E6", medium: "#D38478", dark: "#9B4035" },
  info: { light: "#E7EEF4", medium: "#7CA0C4", dark: "#3C5F84" },
} as const;

/** Calm (teal) — spec §3. */
export const calm = {
  soft: "#DCEBE8",
  base: "#88BAB2",
  deep: "#436E68",
} as const;

export const colors = {
  primary,
  accent,
  neutral,
  ...semantic,
  calm,
} as const;

// ---------------------------------------------------------------------------
// Sombras
// ---------------------------------------------------------------------------

/**
 * Camada de sombra em formato estruturado e agnóstico de plataforma
 * (consumível pelo Flutter via tokens.json). Medidas em px; a cor referencia
 * um hex da paleta + canal alfa separado.
 */
export interface ShadowLayer {
  readonly offsetX: number;
  readonly offsetY: number;
  readonly blur: number;
  readonly spread: number;
  readonly color: { readonly hex: string; readonly alpha: number };
}

export interface ShadowToken {
  /** Camadas estruturadas (fonte para o Flutter/PSI-013). */
  readonly layers: readonly ShadowLayer[];
  /** Valor CSS equivalente, derivado de `layers` (idêntico à spec §3). */
  readonly css: string;
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

/** Formata alfa como na spec: `.06` (sem zero à esquerda). */
function formatAlpha(alpha: number): string {
  return String(alpha).replace(/^0\./, ".");
}

function px(value: number): string {
  return value === 0 ? "0" : `${value}px`;
}

function layerToCss(layer: ShadowLayer): string {
  const [r, g, b] = hexToRgb(layer.color.hex);
  const spread = layer.spread === 0 ? "" : ` ${px(layer.spread)}`;
  return `${px(layer.offsetX)} ${px(layer.offsetY)} ${px(layer.blur)}${spread} rgba(${r},${g},${b},${formatAlpha(layer.color.alpha)})`;
}

/** Deriva o valor CSS de uma lista de camadas estruturadas. */
export function shadowLayersToCss(layers: readonly ShadowLayer[]): string {
  return layers.map(layerToCss).join(", ");
}

function shadowToken(layers: readonly [ShadowLayer, ...ShadowLayer[]]): ShadowToken {
  return { layers, css: shadowLayersToCss(layers) };
}

function layer(
  offsetX: number,
  offsetY: number,
  blur: number,
  hex: string,
  alpha: number,
): ShadowLayer {
  return { offsetX, offsetY, blur, spread: 0, color: { hex, alpha } };
}

/**
 * Sombras — spec §3. As cores das camadas derivam da paleta:
 * soft/lift usam primary-600 (#6E5E9E); card usa primary-900 (#2F2842).
 */
export const shadows = {
  soft: shadowToken([layer(0, 2, 8, primary[600], 0.06), layer(0, 12, 32, primary[600], 0.07)]),
  lift: shadowToken([layer(0, 4, 12, primary[600], 0.08), layer(0, 24, 56, primary[600], 0.12)]),
  card: shadowToken([layer(0, 1, 2, primary[900], 0.05), layer(0, 6, 20, primary[900], 0.06)]),
} as const;

// ---------------------------------------------------------------------------
// Tipografia
// ---------------------------------------------------------------------------

export interface FontToken {
  /** Nome da família principal (como carregada via Google Fonts). */
  readonly family: string;
  /** Pilha completa de fallback, na ordem do CSS. */
  readonly stack: readonly string[];
  /** Pesos disponíveis por estilo (import do Google Fonts, spec §2). */
  readonly weights: {
    readonly normal: readonly number[];
    readonly italic?: readonly number[];
  };
  /** Estilo predominante de uso na identidade. */
  readonly defaultStyle: "normal" | "italic";
}

/**
 * Tipografia — spec §2. As fontes NÃO são embarcadas neste pacote;
 * cada app carrega os arquivos e aqui só referenciamos as famílias.
 */
export const typography = {
  /** Headings, botões, labels, badges e valores. */
  display: {
    family: "DM Sans",
    stack: ["DM Sans", "Inter", "sans-serif"],
    weights: { normal: [400, 500, 600, 700] },
    defaultStyle: "normal",
  },
  /** Corpo de texto (default do body). */
  body: {
    family: "Inter",
    stack: ["Inter", "sans-serif"],
    weights: { normal: [400, 500, 600] },
    defaultStyle: "normal",
  },
  /** Acentos serifados (itálico por padrão via classe .serif). */
  serif: {
    family: "Fraunces",
    stack: ["Fraunces", "Georgia", "serif"],
    weights: { normal: [500, 600], italic: [400, 500] },
    defaultStyle: "italic",
  },
} as const satisfies Record<string, FontToken>;

/** Nomes de família que devem ser citados entre aspas no CSS. */
const QUOTED_FAMILIES: ReadonlySet<string> = new Set(
  Object.values(typography).map((font) => font.family),
);

/**
 * Converte uma pilha de fontes no valor CSS correspondente, citando as
 * famílias próprias da identidade (`"DM Sans", "Inter", sans-serif`).
 */
export function fontStackToCss(stack: readonly string[]): string {
  return stack.map((name) => (QUOTED_FAMILIES.has(name) ? `"${name}"` : name)).join(", ");
}

// ---------------------------------------------------------------------------
// Objeto agregado
// ---------------------------------------------------------------------------

/** Todos os tokens de design do PsiOps em um único objeto tipado. */
export const tokens = {
  colors,
  shadows,
  typography,
} as const;

export type PsiopsTokens = typeof tokens;
export type PrimaryShade = keyof typeof primary;
export type AccentShade = keyof typeof accent;
export type NeutralShade = keyof typeof neutral;
export type SemanticTone = keyof typeof semantic;
export type SemanticVariant = "light" | "medium" | "dark";
export type CalmVariant = keyof typeof calm;

export {
  buildCssVariables,
  renderTokensCss,
  buildTokensJson,
  renderTokensJson,
} from "./artifacts.js";
