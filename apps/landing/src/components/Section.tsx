import type { HTMLAttributes, ReactNode } from "react";

import { Wrap } from "./Wrap";

export interface SectionProps extends Omit<HTMLAttributes<HTMLElement>, "id" | "children"> {
  id?: string;
  /** Padding-top em px (spec §4). Padrão 96 (problema/solução/como/lead form). */
  paddingTop?: number;
  /** Padding-bottom em px (spec §4). Padrão 96. */
  paddingBottom?: number;
  /**
   * Cor de fundo CSS (ex.: `"var(--psi-neutral-100)"`). Sem valor, herda o
   * fundo padrão do body (`--psi-neutral-50`).
   */
  background?: string;
  /** Repassado ao `<Wrap>` interno — override para a FAQ (820px). */
  wrapMaxWidth?: number;
  children: ReactNode;
}

/**
 * Primitiva de seção (spec §1, §4): encapsula o `<Wrap>` e os paddings
 * verticais de cada seção da landing. Abaixo de 600px, `.psi-section` força
 * 60px/60px via `!important` (globals.css), reproduzindo o comportamento do
 * protótipo independentemente do padding informado aqui.
 */
export function Section({
  id,
  paddingTop = 96,
  paddingBottom = 96,
  background,
  wrapMaxWidth,
  className,
  style,
  children,
  ...rest
}: SectionProps) {
  const cls = ["psi-section", className].filter(Boolean).join(" ");

  return (
    <section
      id={id}
      className={cls}
      style={{ paddingTop, paddingBottom, background, ...style }}
      {...rest}
    >
      <Wrap maxWidth={wrapMaxWidth}>{children}</Wrap>
    </section>
  );
}
