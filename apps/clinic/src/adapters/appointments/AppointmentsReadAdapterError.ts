/**
 * Erro de acesso a dados de consultas (leitura), levantado por
 * `HttpAppointmentsReadAdapter`. Modela o suficiente do RFC 9457 (`Problem`,
 * ver `@psiops/contracts`) para a camada de features decidir o que fazer sem
 * depender de detalhes de transporte — mesmo padrão de `PatientsAdapterError`
 * (`src/adapters/patients/PatientsAdapterError.ts`, PSI-033).
 */
export class AppointmentsReadAdapterError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "AppointmentsReadAdapterError";
    this.status = status;
  }
}
