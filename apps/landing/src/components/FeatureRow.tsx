import type { ReactNode } from "react";

export interface FeatureRowProps {
  /** Cor do texto da badge (spec §1.4, ex.: `var(--psi-primary-700)`). */
  badgeColor: string;
  /** Cor de fundo da badge. */
  badgeBg: string;
  badge: string;
  /** Status-dot opcional antes do texto da badge (feature "Automático"). */
  badgeDot?: string;
  title: string;
  text: string;
  visual: ReactNode;
  /**
   * Quando `true`, inverte o lado do visual (texto à esquerda, visual à
   * direita) — feature 2 "Lembretes automáticos" (spec §1.4). Em mobile
   * (≤920px) o texto permanece acima do visual (`feat-order-*`, spec §7).
   */
  reverse?: boolean;
}

/**
 * Linha de feature alternada da seção Solução (spec §1.4, classes
 * `.feature`/`.feat-visual`/`.feat-text` do protótipo): grid 1fr/1fr,
 * gap 64px, colapsa para 1 coluna ≤920px (`.psi-feature`, globals.css).
 *
 * A alternância de lado é resolvida pela ordem no DOM (como no protótipo:
 * feature 2 renderiza o texto antes do visual), sem `order` via CSS — isso
 * também garante que o texto fique acima do visual em mobile quando
 * `reverse` (spec §7, `.feat-order-1`/`.feat-order-2`).
 */
export function FeatureRow({
  badgeColor,
  badgeBg,
  badge,
  badgeDot,
  title,
  text,
  visual,
  reverse = false,
}: FeatureRowProps) {
  const content = (
    <div className="psi-feature__content" key="content">
      <span className="psi-feature__badge" style={{ color: badgeColor, background: badgeBg }}>
        {badgeDot !== undefined ? (
          <span
            aria-hidden="true"
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: badgeDot,
              flexShrink: 0,
            }}
          />
        ) : null}
        {badge}
      </span>
      <h3 className="psi-feature__title">{title}</h3>
      <p className="psi-feature__text">{text}</p>
    </div>
  );
  const visualEl = (
    <div className="psi-feature__visual" key="visual">
      {visual}
    </div>
  );

  return <div className="psi-feature">{reverse ? [content, visualEl] : [visualEl, content]}</div>;
}
