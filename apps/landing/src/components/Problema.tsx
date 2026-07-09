import type { ReactNode } from "react";
import { Card } from "@psiops/ui";

import { Eyebrow } from "./Eyebrow";
import { Section } from "./Section";

/**
 * Ícones dos cards de problema (spec §1.3): traçado idêntico ao protótipo
 * (`project/PsiOps Landing.html` #problema), `stroke: currentColor;
 * stroke-width: 1.6; fill: none; stroke-linecap/linejoin: round` (`.ico`,
 * spec §4/apêndice).
 */
function SpreadsheetIcon() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18M9 4v16" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}

function CalculatorIcon() {
  return (
    <svg
      width={26}
      height={26}
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.6}
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M8 7h8M8 11h2M12 11h2M16 11h0M8 15h2M12 15h2M16 15h0" />
    </svg>
  );
}

interface ProblemaCardData {
  icon: ReactNode;
  /** Fundo do quadrado do ícone (52×52, raio 15px, spec §1.3). */
  iconBg: string;
  /** Cor do traço do ícone (`color` herdado pelo `currentColor` do SVG). */
  iconColor: string;
  title: string;
  text: string;
}

const CARDS: ProblemaCardData[] = [
  {
    icon: <SpreadsheetIcon />,
    iconBg: "var(--psi-primary-100)",
    iconColor: "var(--psi-primary-600)",
    title: "Perdeu o controle de quem pagou",
    text: "A planilha cresce e cada mês fica mais difícil saber quem está em dia.",
  },
  {
    icon: <ClockIcon />,
    iconBg: "var(--psi-accent-100)",
    iconColor: "var(--psi-accent-700)",
    title: "Cobrança toma tempo da semana",
    text: "Digitar mensagem para cada paciente atrasado, entre uma sessão e outra.",
  },
  {
    icon: <CalculatorIcon />,
    iconBg: "var(--psi-calm-soft)",
    iconColor: "var(--psi-calm-deep)",
    title: "Juros e multa calculados na mão",
    text: "Fazer a conta toda vez que alguém atrasa é desgastante e dá margem para erro.",
  },
];

/**
 * Seção "Problema" (spec §1.3, `#problema`): header centralizado + grid de
 * 3 cards com hover lift (`Card lift`, spec §6 utilitário `.lift`). Textos
 * idênticos à referência — ver `docs/design/landing-page-spec.md` §1.3.
 */
export function Problema() {
  return (
    <Section id="problema">
      <div className="psi-problema__header psi-reveal">
        <Eyebrow>A realidade de quem atende sozinho</Eyebrow>
        <h2 className="psi-problema__h2">Você já passou por isso?</h2>
      </div>
      <div className="psi-problema__grid">
        {CARDS.map((card, index) => (
          <Card
            key={card.title}
            lift
            className="psi-problema__card psi-reveal"
            style={{ transitionDelay: index === 0 ? undefined : `${index * 0.08}s` }}
          >
            <span
              className="psi-problema__icon"
              style={{ background: card.iconBg, color: card.iconColor }}
            >
              {card.icon}
            </span>
            <h3 className="psi-problema__title">{card.title}</h3>
            <p className="psi-problema__text">{card.text}</p>
          </Card>
        ))}
      </div>
    </Section>
  );
}
