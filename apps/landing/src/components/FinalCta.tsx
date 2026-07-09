import { Button } from "@psiops/ui";

import { Section } from "./Section";

/**
 * Seção "CTA final" (spec §1.9, última seção antes do footer): card com
 * gradiente 135deg (`--psi-primary-800` → `--psi-primary-600`) e dois
 * overlays radiais, marca (`psiops-mark.png`) invertida para branco via
 * `filter: brightness(0) invert(1)`, CTA `btn-white` para `#lista`. Sem
 * padding-top (encosta no FAQ) — 96px de padding-bottom (spec §4).
 */
export function FinalCta() {
  return (
    <Section paddingTop={0} paddingBottom={96} data-testid="final-cta">
      <div className="psi-cta psi-reveal">
        <span className="psi-cta__overlay" aria-hidden="true" />
        <div className="psi-cta__content">
          {/* Marca decorativa (o CTA abaixo já veicula a ação) — alt vazio. */}
          <img src="/assets/psiops-mark.png" alt="" className="psi-cta__mark" />
          <h2 className="psi-cta__title">Pronto para colocar o financeiro em ordem?</h2>
          <p className="psi-cta__text">Entre na lista de espera e ganhe acesso antecipado.</p>
          <Button variant="white" href="#lista">
            Quero acesso antecipado
          </Button>
        </div>
      </div>
    </Section>
  );
}
