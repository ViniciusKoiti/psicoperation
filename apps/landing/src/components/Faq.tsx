"use client";

import { useRef, useState } from "react";

import { Eyebrow } from "./Eyebrow";
import { Section } from "./Section";

export interface FaqEntry {
  question: string;
  answer: string;
}

/**
 * Perguntas e respostas do FAQ (spec §1.8), transcrição fiel da referência
 * (`project/PsiOps Landing.html`, array `faqs` injetado via JS). Diferente
 * do protótipo, aqui o array tipado alimenta um componente React
 * declarativo em vez de `innerHTML`.
 */
export const FAQ_ITEMS: FaqEntry[] = [
  {
    question: "Quando vai lançar?",
    answer:
      "Estamos na fase final de construção. Quem entrar na lista de espera será avisado primeiro, com previsão para os próximos 2–3 meses.",
  },
  {
    question: "Quanto vai custar?",
    answer:
      "Ainda estamos definindo, mas a faixa será acessível para profissionais autônomos. Quem entrar agora terá condição especial garantida.",
  },
  {
    question: "Funciona com WhatsApp comum?",
    answer: "Sim. Você não precisa de WhatsApp Business para usar o PsiOps.",
  },
  {
    question: "E se eu não trabalho só com mensalidade?",
    answer: "Por enquanto o foco é mensalidade. Em breve, sessão avulsa também.",
  },
  {
    question: "Meus dados de pacientes ficam seguros?",
    answer:
      "Sim. Seguimos as boas práticas de segurança e a LGPD. Seus dados nunca são compartilhados.",
  },
];

/**
 * Seção "FAQ" (spec §1.8, `#faq`): header centralizado + accordion
 * acessível. Client component (estado React do item aberto — sem
 * manipulação direta do DOM, diferente do protótipo).
 */
export function Faq() {
  return (
    <Section id="faq" paddingTop={60} paddingBottom={100} wrapMaxWidth={820}>
      <div className="psi-faq__header">
        <Eyebrow>Dúvidas</Eyebrow>
        <h2 className="psi-faq__h2">Perguntas que você pode ter</h2>
      </div>
      <FaqAccordion items={FAQ_ITEMS} />
    </Section>
  );
}

export interface FaqAccordionProps {
  items: FaqEntry[];
}

/**
 * Accordion do FAQ (spec §8.3): apenas um item aberto por vez — abrir um
 * item fecha o anteriormente aberto; clicar no item aberto o fecha. Estado
 * mantido em React (`openIndex`), não em classes DOM manipuladas
 * imperativamente como no protótipo.
 */
export function FaqAccordion({ items }: FaqAccordionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="psi-faq__list psi-reveal">
      {items.map((item, index) => (
        <FaqItem
          key={item.question}
          index={index}
          question={item.question}
          answer={item.answer}
          isOpen={openIndex === index}
          onToggle={() => setOpenIndex((current) => (current === index ? null : index))}
        />
      ))}
    </div>
  );
}

interface FaqItemProps {
  index: number;
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}

/**
 * Item individual do accordion (`.faq-item`/`.faq-q`/`.faq-a`, spec §1.8):
 * cabeçalho é um `button` com `aria-expanded`/`aria-controls`; o painel
 * anima `max-height` de 0 até `scrollHeight` (medido via ref), robusto a
 * respostas de altura variável (spec §8.3, risco de corte de texto).
 */
function FaqItem({ index, question, answer, isOpen, onToggle }: FaqItemProps) {
  const panelInnerRef = useRef<HTMLDivElement>(null);
  const questionId = `faq-q-${index}`;
  const panelId = `faq-a-${index}`;

  return (
    <div className="psi-faq__item">
      <button
        type="button"
        id={questionId}
        className="psi-faq__q"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={onToggle}
      >
        <span>{question}</span>
        <FaqChevron open={isOpen} />
      </button>
      <div
        id={panelId}
        role="region"
        aria-labelledby={questionId}
        aria-hidden={!isOpen}
        className="psi-faq__a"
        style={{
          maxHeight: isOpen ? `${panelInnerRef.current?.scrollHeight ?? 0}px` : "0px",
          opacity: isOpen ? 1 : 0,
        }}
      >
        <div ref={panelInnerRef} className="psi-faq__a-inner">
          {answer}
        </div>
      </div>
    </div>
  );
}

/** Chevron "+" que rotaciona 45° (vira "×") quando o item está aberto (spec §1.8). */
function FaqChevron({ open }: { open: boolean }) {
  return (
    <svg
      width={22}
      height={22}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      className={["psi-faq__chev", open ? "psi-faq__chev--open" : null].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}
