/**
 * Geradores de dados únicos por execução (PSI-044 acceptance criteria:
 * "testes E2E reexecutáveis sem intervenção manual" — e-mail/usuária únicos
 * por rodada, para nunca colidir com "e-mail já cadastrado"/"e-mail já na
 * lista de espera" de uma execução anterior contra o mesmo banco).
 */

function runToken() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function uniqueEmail(prefix) {
  return `${prefix}-${runToken()}@e2e.psiops.test`;
}
