# @psiops/clinic

Aplicação web da clínica (psicóloga solo) — Vite + React + TypeScript com
Mantine, tematizado a partir dos design tokens de `@psiops/ui`.

Esta é a fundação técnica entregue pela **PSI-012**: React Router com rota
pública (`/login`, placeholder) e área protegida por um guard placeholder
(sempre permite hoje — sem autenticação real), layout shell com sidebar e
topbar, e estrutura de pastas por feature (`src/features/*`), com acesso a
dados isolado em adapters (`src/adapters/*`, ADR 0006) e componentes
compartilhados em `src/components/*`. As features de domínio (carteira de
pacientes, mensalidades, cobranças) chegam em tarefas futuras.

## Design system

- **Tema Mantine**: `@psiops/ui/mantine` exporta `psiopsTheme`, derivado da
  fonte única de tokens de `@psiops/ui/tokens` (cores, tipografia, sombras).
  `src/main.tsx` monta `<MantineProvider theme={psiopsTheme}>` — nenhum valor
  de tema é hardcoded aqui.

## Contratos

Tipos de payloads e recursos da API vêm exclusivamente de `@psiops/contracts`
(codegen comitado em `gen/ts`) — nenhum DTO é redefinido localmente. Ver
`src/adapters/patients/PatientsAdapter.ts` e `MockPatientsAdapter.ts`.

## Adapters (ADR 0006)

Todo acesso a dados passa por uma interface de adapter. Hoje só existe
`MockPatientsAdapter` (estado em memória, padrão em desenvolvimento e
testes); `HttpPatientsAdapter` chega completa na PSI-039. O ponto de
composição único fica em `src/adapters/patients/index.ts`.

## Comandos

```bash
pnpm dev            # servidor de desenvolvimento
pnpm build          # tsc --noEmit + build de produção (dist/)
pnpm preview        # serve o build de produção localmente
pnpm lint           # ESLint (preset react de @psiops/config)
pnpm typecheck      # tsc --noEmit
pnpm test           # Vitest (unit; jsdom + Testing Library)
```
