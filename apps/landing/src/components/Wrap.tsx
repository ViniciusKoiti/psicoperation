import type { HTMLAttributes } from "react";

export interface WrapProps extends HTMLAttributes<HTMLDivElement> {
  /**
   * Largura máxima do container, em px.
   * Padrão 1180 (spec §4); a seção de FAQ (PSI-017) usa 820.
   */
  maxWidth?: number;
}

/**
 * Container centralizado do protótipo (`.wrap`, spec §4): `max-width`
 * configurável, centralizado, com padding lateral responsivo definido em
 * `globals.css` (`.psi-wrap`: 24px padrão, 20px ≤860px, 18px ≤600px).
 */
export function Wrap({ maxWidth = 1180, className, style, children, ...rest }: WrapProps) {
  const cls = ["psi-wrap", className].filter(Boolean).join(" ");

  return (
    <div className={cls} style={{ maxWidth, ...style }} {...rest}>
      {children}
    </div>
  );
}
