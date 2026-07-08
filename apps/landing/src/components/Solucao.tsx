import { Eyebrow } from "./Eyebrow";
import { FeatureRow } from "./FeatureRow";
import { InterestCalculatorCard } from "./InterestCalculatorCard";
import { PatientWalletList } from "./PatientWalletList";
import { Section } from "./Section";
import { WhatsAppMock } from "./WhatsAppMock";

/**
 * Seção "Solução" (spec §1.4, `#solucao`): header centralizado + 3 feature
 * rows alternadas com os três visuais (carteira de pacientes, mock de
 * WhatsApp e calculadora de juros). Fundo `--psi-neutral-100` (spec §1).
 * Textos idênticos à referência.
 */
export function Solucao() {
  return (
    <Section id="solucao" background="var(--psi-neutral-100)">
      <div className="psi-solucao__header">
        <Eyebrow>A solução</Eyebrow>
        <h2 className="psi-solucao__h2">Tudo em um lugar, finalmente.</h2>
      </div>

      <FeatureRow
        badge="Cadastro"
        badgeColor="var(--psi-primary-700)"
        badgeBg="var(--psi-primary-100)"
        title="Carteira de pacientes mensalistas"
        text="Cadastre cada paciente uma vez. Defina o valor da mensalidade e o dia de vencimento. Pronto — o sistema acompanha tudo para você."
        visual={<PatientWalletList />}
      />

      <FeatureRow
        reverse
        badge="Automático"
        badgeColor="var(--psi-success-dark)"
        badgeBg="var(--psi-success-light)"
        badgeDot="var(--psi-success-medium)"
        title="Lembretes automáticos pelo WhatsApp"
        text="Configure uma vez e esqueça. Antes do vencimento, o sistema avisa seu paciente educadamente. Você só entra em cena quando precisa."
        visual={<WhatsAppMock />}
      />

      <FeatureRow
        badge="Sem conta de cabeça"
        badgeColor="var(--psi-accent-700)"
        badgeBg="var(--psi-accent-100)"
        title="Juros calculados automaticamente"
        text="Defina a regra uma vez — 1% ao mês, multa de 2%, o que fizer sentido pra você — e o sistema aplica em todos os atrasos. Sem conta de cabeça, sem erro."
        visual={<InterestCalculatorCard />}
      />
    </Section>
  );
}
