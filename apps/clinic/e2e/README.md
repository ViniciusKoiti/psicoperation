# apps/clinic/e2e — fluxo crítico do clinic (PSI-044)

Documentação completa (como subir a infra, rodar as duas suítes E2E e
derrubar tudo) vive em [`e2e/README.md`](../../../e2e/README.md), na raiz
do repositório — esta suíte é uma das duas partes da suíte cross-app
descrita lá.

Atalhos rápidos (assumindo infra + API já de pé — ver README da raiz):

```bash
# Da raiz do repo:
cd apps/clinic

# Compilar/listar specs sem rodar (não precisa de infra):
pnpm exec playwright test --config e2e/playwright.config.ts --list

# Rodar de verdade (sobe o proxy CORS local + vite dev; API/Postgres/Mailpit
# precisam já estar de pé — bash e2e/scripts/start-infra.sh && bash e2e/scripts/start-api.sh):
pnpm exec playwright test --config e2e/playwright.config.ts

# Anti-mock (builda em modo produção; não precisa de infra nenhuma):
node e2e/check-no-mock-in-bundle.mjs
```

Arquivos:

- `playwright.config.ts` — sobe dois `webServer` (proxy CORS local +
  `vite dev`), nunca a infra pesada (Postgres/Mailpit/API).
- `clinic-flow.spec.ts` — registro → onboarding pulado → criar paciente →
  agendar consulta, contra a API real.
- `check-no-mock-in-bundle.mjs` — verificação anti-mock, roda sem infra.
- `support/api-proxy.mjs` — proxy CORS local (ver a doc no topo do arquivo
  e a seção 3 do README da raiz para o porquê).
