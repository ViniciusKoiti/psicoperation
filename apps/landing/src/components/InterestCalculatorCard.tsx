import { Card } from "@psiops/ui";

/**
 * Visual 3 da Solução (spec §1.4, feature "Juros calculados
 * automaticamente"): card ilustrativo de juros simples (1% a.m.) + multa
 * fixa (2%) sobre um atraso de 4 dias, com os valores exatos da referência.
 * Estático/apresentacional — sem integração ou regra de negócio nova
 * (out_of_scope do manifesto PSI-016).
 */
export function InterestCalculatorCard() {
  return (
    <Card shadow="soft" className="psi-interest" data-testid="interest-calculator-card">
      <p className="psi-interest__name">Carla Dias</p>
      <p className="psi-interest__status">Atrasado há 4 dias</p>
      <div className="psi-interest__rows">
        <div className="psi-interest__row">
          <span className="psi-interest__label">Valor original</span>
          <span className="psi-interest__value">R$ 350,00</span>
        </div>
        <div className="psi-interest__row">
          <span className="psi-interest__label">Juros (1% a.m.)</span>
          <span className="psi-interest__value">R$ 0,47</span>
        </div>
        <div className="psi-interest__row">
          <span className="psi-interest__label">Multa (2%)</span>
          <span className="psi-interest__value">R$ 7,00</span>
        </div>
        <div className="psi-interest__divider" aria-hidden="true" />
        <div className="psi-interest__total">
          <span className="psi-interest__total-label">Total atualizado</span>
          <span className="psi-interest__total-value">R$ 357,47</span>
        </div>
      </div>
    </Card>
  );
}
