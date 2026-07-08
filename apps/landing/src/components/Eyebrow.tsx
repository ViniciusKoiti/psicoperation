import type { HTMLAttributes } from "react";

export type EyebrowProps = HTMLAttributes<HTMLParagraphElement>;

/**
 * Rótulo eyebrow do protótipo (`.eyebrow`, spec §2/apêndice): DM Sans 600
 * 13px, uppercase, `letter-spacing: .14em`, cor `--psi-accent-700`.
 */
export function Eyebrow({ className, children, ...rest }: EyebrowProps) {
  const cls = ["psi-eyebrow", className].filter(Boolean).join(" ");

  return (
    <p className={cls} {...rest}>
      {children}
    </p>
  );
}
