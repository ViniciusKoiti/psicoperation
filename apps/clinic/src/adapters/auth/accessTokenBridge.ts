/**
 * Ponte em memória para o access token corrente, consumida pelos adapters
 * HTTP de domínio (`HttpPatientsAdapter`, `HttpAgendaAdapter`, ... — PSI-044)
 * para autenticar chamadas via `Authorization: Bearer <token>`.
 *
 * PROBLEMA QUE RESOLVE: `SessionManager` (`src/session/SessionManager.ts`,
 * fora do escopo permitido desta tarefa) é o único lugar do app que guarda
 * um access token válido, mas o mantém estritamente privado — só é
 * acessível via `withAuth(operation)`, um callback que RECEBE o token já
 * pronto. Os adapters HTTP de domínio, por outro lado, são singletons
 * instanciados uma única vez no import de `src/adapters/<dominio>/index.ts` — antes
 * de qualquer sessão existir — e precisam de uma função síncrona
 * `getAccessToken` no momento de CADA chamada (ver
 * `HttpPatientsAdapterOptions.getAccessToken` e equivalentes).
 *
 * Esta ponte fecha esse intervalo sem tocar `src/session/**`:
 * `withAccessTokenBridge` (`./withAccessTokenBridge.ts`) decora o
 * `AuthAdapter` composto em `./index.ts` — o MESMO adapter que
 * `SessionProvider`/`SessionManager` recebem via `App.tsx` — e grava aqui o
 * access token retornado por CADA login/registro/renovação bem-sucedidos,
 * exatamente as únicas operações que produzem um token novo. Como
 * `SessionManager` só chama essas operações através do adapter decorado, o
 * valor aqui refletido sempre acompanha a sessão real.
 *
 * Guardado só em memória (estado de módulo, por processo do navegador) —
 * nunca em `localStorage`/`sessionStorage`/cookies, mesma regra de
 * `SessionManager`. Não há como limpar isto em um `logout()`
 * (`SessionManager.logout` também está fora de `src/adapters/**` e não
 * chama o `AuthAdapter` — não existe endpoint de logout no contrato): o
 * token aqui fica obsoleto após logout, mas inofensivo, porque o fluxo
 * normal do app (`AuthGuard` exige sessão autenticada antes de qualquer
 * chamada de domínio) sempre passa por um novo login/registro — que
 * sobrescreve este valor antes de qualquer chamada autenticada acontecer.
 * Ver open_question do PR da PSI-044 para o registro formal dessa
 * limitação e a alternativa (mover a ponte para `src/session/**`, fora do
 * escopo permitido aqui).
 */
let currentAccessToken: string | undefined;

/** Lido por `getAccessToken` dos adapters HTTP de domínio a cada chamada autenticada. */
export function getBridgedAccessToken(): string | undefined {
  return currentAccessToken;
}

/** Chamado por `withAccessTokenBridge` após login/registro/renovação bem-sucedidos. */
export function setBridgedAccessToken(token: string | undefined): void {
  currentAccessToken = token;
}

/** Exportado só para testes que precisam resetar o estado do módulo entre casos. */
export function resetAccessTokenBridge(): void {
  currentAccessToken = undefined;
}
