import type { HTMLAttributes } from "react";

/** Sombra do card: card (padrão do .card), soft ou lift (spec §3/§6). */
export type CardShadow = "card" | "soft" | "lift";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  shadow?: CardShadow;
  /**
   * Aplica o utilitário .lift do protótipo: eleva no hover
   * (translateY(-4px) scale(1.015) + shadow-lift).
   */
  lift?: boolean;
}

/**
 * Superfície primitiva do design system (.card do protótipo):
 * fundo neutral-0, borda neutral-200, raio 22px, shadow-card.
 */
export function Card({ shadow = "card", lift = false, className, children, ...rest }: CardProps) {
  const cls = [
    "psi-card",
    shadow !== "card" ? `psi-card--shadow-${shadow}` : null,
    lift ? "psi-card--lift" : null,
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} {...rest}>
      {children}
    </div>
  );
}
