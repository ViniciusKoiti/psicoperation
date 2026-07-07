import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";

export type ButtonVariant = "primary" | "ghost" | "white";

/**
 * Tamanhos do protótipo (spec §6/§9):
 * - md: padrão (padding 15px 26px, 16px);
 * - compact: CTA da nav (11px 20px, 15px);
 * - lg: submit do lead form (17px 26px, 17px).
 */
export type ButtonSize = "md" | "compact" | "lg";

interface ButtonOwnProps {
  /** Variante visual (.btn-primary / .btn-ghost / .btn-white). */
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Ícone opcional, renderizado após o rótulo (ex.: seta do hero). */
  icon?: ReactNode;
  /** Quando presente, renderiza um `<a>` estilizado como botão. */
  href?: string;
}

export type ButtonProps = ButtonOwnProps &
  ButtonHTMLAttributes<HTMLButtonElement> &
  AnchorHTMLAttributes<HTMLAnchorElement>;

function classes(variant: ButtonVariant, size: ButtonSize, className?: string): string {
  return ["psi-btn", `psi-btn--${variant}`, size !== "md" ? `psi-btn--${size}` : null, className]
    .filter(Boolean)
    .join(" ");
}

/**
 * Botão primitivo do design system (.btn do protótipo).
 *
 * Requer os estilos do pacote (`@psiops/ui/styles.css` ou tokens.css +
 * components.css) importados pelo app consumidor.
 */
export function Button({
  variant = "primary",
  size = "md",
  icon,
  href,
  className,
  children,
  type,
  ...rest
}: ButtonProps) {
  const cls = classes(variant, size, className);

  if (href !== undefined) {
    return (
      <a href={href} className={cls} {...rest}>
        {children}
        {icon}
      </a>
    );
  }

  return (
    <button type={type ?? "button"} className={cls} {...rest}>
      {children}
      {icon}
    </button>
  );
}
