/**
 * Erro de acesso a dados de cobranças (mensalidades), levantado por
 * `MockChargesAdapter` e `HttpChargesAdapter`. SUBSTITUI `ChargesReadAdapterError`
 * (PSI-034, escopo só-leitura) agora que o adapter cobre geração, pagamento
 * e desfazer (PSI-037) — mesma reconciliação de `AgendaAdapterError`
 * (PSI-035) sobre `AppointmentsReadAdapterError`. Modela o suficiente do
 * RFC 9457 (`Problem`, `@psiops/contracts`) para a camada de features
 * decidir o que fazer sem depender de detalhes de transporte: `status`
 * segue os códigos HTTP documentados no contrato (400/401/404/409/500) —
 * mesmo padrão de `PatientsAdapterError`/`AgendaAdapterError`.
 */
export class ChargesAdapterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ChargesAdapterError";
    this.status = status;
  }
}

/**
 * Mensagem pt-BR de idempotência (409) para uma cobrança já existente na
 * mesma competência do paciente — mesmo espírito de `AGENDA_CONFLICT_MESSAGE`
 * (paridade "mesmo tipo de erro, mesmo status" entre `MockChargesAdapter` e
 * `HttpChargesAdapter`, sem depender do byte a byte do texto do servidor).
 */
export const CHARGE_ALREADY_EXISTS_MESSAGE = "Já existe uma mensalidade gerada para este paciente nesta competência.";

/** Mensagem pt-BR de cobrança já paga (409) — ver `RegisterPaymentRequest`/`registerCharge Payment`. */
export const CHARGE_ALREADY_PAID_MESSAGE = "Esta mensalidade já está paga.";

/** `true` quando o erro representa "mensalidade já gerada nesta competência" (409, idempotência). */
export function isChargeAlreadyExistsError(error: unknown): error is ChargesAdapterError {
  return error instanceof ChargesAdapterError && error.status === 409;
}

/** `true` quando o erro representa "cobrança já paga" (409, `registerChargePayment`). */
export function isChargeAlreadyPaidError(error: unknown): error is ChargesAdapterError {
  return error instanceof ChargesAdapterError && error.status === 409;
}

/** `true` quando o erro representa "cobrança não encontrada" (404) — inclui "nada para desfazer". */
export function isChargeNotFoundError(error: unknown): error is ChargesAdapterError {
  return error instanceof ChargesAdapterError && error.status === 404;
}
