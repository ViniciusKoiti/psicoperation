# @psiops/clinic

Aplicação web da clínica (psicóloga solo) — Vite + React + TypeScript com
Mantine, tematizado a partir dos design tokens de `@psiops/ui`.

Esta é a fundação técnica entregue pela **PSI-012**, com o fluxo de
autenticação e sessão entregue pela **PSI-030**: React Router com rotas
públicas (`/login`, `/registrar`) e área protegida por `AuthGuard` (redireciona
para `/login` sem sessão autenticada, preservando a rota de destino), layout
shell com sidebar e topbar, e estrutura de pastas por feature
(`src/features/*`), com acesso a dados isolado em adapters (`src/adapters/*`,
ADR 0006) e componentes compartilhados em `src/components/*`. As features de
domínio (carteira de pacientes, mensalidades, cobranças) chegam em tarefas
futuras.

## Design system

- **Tema Mantine**: `@psiops/ui/mantine` exporta `psiopsTheme`, derivado da
  fonte única de tokens de `@psiops/ui/tokens` (cores, tipografia, sombras).
  `src/main.tsx` monta `<MantineProvider theme={psiopsTheme}>` — nenhum valor
  de tema é hardcoded aqui.

## Contratos

Tipos de payloads e recursos da API vêm exclusivamente de `@psiops/contracts`
(codegen comitado em `gen/ts`) — nenhum DTO é redefinido localmente. Ver
`src/adapters/patients/PatientsAdapter.ts`/`MockPatientsAdapter.ts` e
`src/adapters/auth/AuthAdapter.ts`/`MockAuthAdapter.ts`.

## Adapters (ADR 0006)

Todo acesso a dados passa por uma interface de adapter.

- **Pacientes**: só existe `MockPatientsAdapter` (estado em memória, padrão
  em desenvolvimento e testes); `HttpPatientsAdapter` chega completa na
  PSI-039. Composição em `src/adapters/patients/index.ts`.
- **Autenticação**: `AuthAdapter` tem duas implementações — `MockAuthAdapter`
  (estado em memória, usuário semente, simulação de expiração de token via
  relógio injetável) e `HttpAuthAdapter` (tipada contra os contratos,
  aponta para a API Spring Boot, mas sem chamadas reais habilitadas nesta
  fase — a integração completa é a PSI-044). A seleção entre mock e http é
  concentrada em `src/adapters/auth/index.ts` (`resolveAuthAdapterKind`):
  variável de ambiente `VITE_AUTH_ADAPTER` (`mock`|`http`) força a escolha;
  sem ela, o padrão é `http` em build de produção e `mock` nos demais modos —
  ou seja, o mock **nunca** é o padrão em produção.

## Sessão

`src/session/SessionManager.ts` mantém o access token **apenas em memória**
(nunca em `localStorage`/`sessionStorage`/cookies geridos pelo app) e expõe
`login`/`register`/`logout`/`withAuth` via `SessionProvider`/`useSession`
(`src/session/SessionContext.tsx`). `withAuth` renova a sessão
automaticamente quando o access token expira ou uma operação falha com 401,
repete a operação uma vez, e serializa renovações concorrentes (nunca duas
chamadas paralelas a `adapter.refresh`). Falha na renovação encerra a sessão
— `AuthGuard` (`src/app/AuthGuard.tsx`) reage e redireciona para `/login`.

## Comandos

```bash
pnpm dev            # servidor de desenvolvimento
pnpm build          # tsc --noEmit + build de produção (dist/)
pnpm preview        # serve o build de produção localmente
pnpm lint           # ESLint (preset react de @psiops/config)
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (unit; jsdom + Testing Library)
```
