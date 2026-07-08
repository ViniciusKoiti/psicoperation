import { Card } from "@psiops/ui";

interface WalletRow {
  name: string;
  /** Cor do status-dot (spec §1.4: success/warning/error medium). */
  dotColor: string;
  value: string;
}

const ROWS: WalletRow[] = [
  { name: "Marcos Rocha", dotColor: "var(--psi-success-medium)", value: "R$ 350" },
  { name: "Beatriz Lima", dotColor: "var(--psi-warning-medium)", value: "R$ 300" },
  { name: "Carla Dias", dotColor: "var(--psi-error-medium)", value: "R$ 357" },
  { name: "João Prado", dotColor: "var(--psi-success-medium)", value: "R$ 320" },
];

/**
 * Visual 1 da Solução (spec §1.4, feature "Carteira de pacientes
 * mensalistas"): carteira de pacientes com status-dot + nome + valor.
 */
export function PatientWalletList() {
  return (
    <Card shadow="soft" className="psi-wallet" data-testid="patient-wallet-list">
      <p className="psi-wallet__title">Carteira de pacientes</p>
      <div className="psi-wallet__list">
        {ROWS.map((row) => (
          <div key={row.name} className="psi-wallet__row">
            <span className="psi-wallet__name-group">
              <span
                className="psi-wallet__dot"
                aria-hidden="true"
                style={{ background: row.dotColor }}
              />
              <span className="psi-wallet__name">{row.name}</span>
            </span>
            <span className="psi-wallet__value">{row.value}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
