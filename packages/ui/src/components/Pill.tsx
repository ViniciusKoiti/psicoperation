import type { HTMLAttributes } from "react";

export interface PillProps extends HTMLAttributes<HTMLSpanElement> {
  /** Exibe o status-dot à esquerda (8×8px; padrão accent-500). */
  dot?: boolean;
  /** Cor CSS do dot (implica `dot`). Ex.: "var(--psi-success-medium)". */
  dotColor?: string;
}

/**
 * Pill primitivo do design system (.pill do protótipo): DM Sans 500 13.5px,
 * fundo primary-100, borda primary-200, raio 999px.
 */
export function Pill({ dot = false, dotColor, className, children, ...rest }: PillProps) {
  const showDot = dot || dotColor !== undefined;
  const cls = ["psi-pill", className].filter(Boolean).join(" ");

  return (
    <span className={cls} {...rest}>
      {showDot ? (
        <span
          className="psi-pill__dot"
          aria-hidden="true"
          style={dotColor !== undefined ? { background: dotColor } : undefined}
          data-testid="psi-pill-dot"
        />
      ) : null}
      {children}
    </span>
  );
}
