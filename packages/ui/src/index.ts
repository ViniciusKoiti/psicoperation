/**
 * @psiops/ui — design system do PsiOps.
 *
 * Entry principal: tokens + componentes primitivos React.
 * Entries dedicados (não reexportados aqui, de propósito, para não acoplar
 * consumidores a um framework):
 *
 * - `@psiops/ui/mantine`  → tema Mantine (apps/clinic);
 * - `@psiops/ui/tailwind` → preset Tailwind (apps/landing);
 * - `@psiops/ui/tokens.css` / `@psiops/ui/components.css` /
 *   `@psiops/ui/styles.css` → estilos;
 * - `@psiops/ui/tokens.json` → tokens canônicos (tema Flutter, PSI-013).
 */

export * from "./tokens/index.js";
export * from "./components/index.js";
