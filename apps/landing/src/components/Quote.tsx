import { Section } from "./Section";

/**
 * Seção "Quote" (spec §1.6): pull quote de largura total, Fraunces itálico
 * 42px `--psi-primary-800`, entre dois `.divider-line` (1×64px accent-300).
 * Fundo `--psi-primary-50`, padding 110px. Texto idêntico à referência — a
 * referência não traz atribuição/autoria separada (apenas o texto entre
 * aspas), então não há elemento de atribuição adicional aqui (ver
 * `open_questions`/assumptions do PR).
 */
export function Quote() {
  return (
    <Section
      paddingTop={110}
      paddingBottom={110}
      background="var(--psi-primary-50)"
      wrapMaxWidth={860}
    >
      <div className="psi-quote psi-reveal">
        <span className="psi-quote__divider" aria-hidden="true" />
        <p className="psi-quote__text">
          “Você cuida das pessoas. A gente cuida do que vem depois da sessão.”
        </p>
        <span className="psi-quote__divider psi-quote__divider--bottom" aria-hidden="true" />
      </div>
    </Section>
  );
}
