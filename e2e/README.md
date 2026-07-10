# E2E — PSI-044 (integração web real + suíte cross-app)

Suíte Playwright que prova, contra a API Spring **real** (não mocks), os
fluxos críticos do MVP:

- **clinic** (`apps/clinic/e2e/clinic-flow.spec.ts`): registro → login
  (automático) → onboarding pulado → criar paciente → agendar consulta, com
  asserções na UI real (navegador Chromium).
- **landing** (`e2e/specs/landing-lead.spec.ts`): submissão do lead via
  `HttpLeadAdapter` (`apps/landing/src/adapters/lead/**`) → `POST /leads`
  real → persistência verificada por consulta direta ao Postgres.
- **anti-mock** (`apps/clinic/e2e/check-no-mock-in-bundle.mjs`): builda o
  clinic em modo produção (sem overrides) e falha se algum `Mock*Adapter`
  aparecer no bundle. Não precisa de infraestrutura nenhuma.

Ver a nota de escopo sobre a landing logo abaixo — **`<LeadForm>` (a UI)
ainda não chama `HttpLeadAdapter`**, por uma restrição de `allowed_paths` da
PSI-044.

## 0. Pré-requisitos (uma vez)

```bash
# Da raiz do repo:
pnpm install
bash e2e/scripts/link-playwright.sh   # ver "Por que link-playwright.sh?" abaixo
pnpm --filter @psiops/ui build        # gera dist/ consumido por @psiops/clinic (typecheck/build)
pnpm exec playwright install chromium # se ainda não instalado

# JDK 21 no PATH (build/execução da API):
export JAVA_HOME=~/.local/jdk/current
export PATH=$JAVA_HOME/bin:$PATH

# Docker acessível (ex.: WSL2 com Docker Desktop):
export DOCKER_HOST=unix:///var/run/docker.sock
```

### Por que `link-playwright.sh`?

`@playwright/test` já é devDependency do workspace, mas hoje só de
`apps/landing` (PSI-009/PSI-019). O `node_modules` do pnpm é isolado por
pacote (sem hoisting): sem declarar a dependência em `apps/clinic` ou na
raiz — o que esta tarefa **não pode fazer** (`package.json`/
`pnpm-lock.yaml` são `forbidden_paths` da PSI-044) — nem `apps/clinic/e2e/**`
nem `e2e/**` conseguem resolver `import { test } from "@playwright/test"`.
`e2e/scripts/link-playwright.sh` cria links simbólicos (`node_modules` é
gitignorado — isto é só estado de ambiente local/CI, nunca versionado)
apontando para a cópia já resolvida em `apps/landing/node_modules`. Rode-o
uma vez depois de cada `pnpm install`.

**Solução interina** — ver open_question do PR da PSI-044: o correto a
prazo é uma tarefa `shared_change` futura declarar `@playwright/test` como
devDependency da raiz (ou de `apps/clinic` também), tornando este script
desnecessário.

## 1. Rodar tudo de uma vez

```bash
bash e2e/run-e2e.sh
```

Sobe a infra (`docker compose`), builda e sobe a API Spring, espera as duas
ficarem saudáveis, roda a suíte do clinic e a suíte da landing/raiz, e
derruba tudo no final (API sempre; o `docker compose` também, a menos que
`PSI044_KEEP_INFRA=1` esteja setado).

## 2. Rodar passo a passo (útil para depurar)

```bash
# 1. Infra (Postgres 16 + Mailpit) — espera healthy.
bash e2e/scripts/start-infra.sh

# 2. API Spring — builda com o Maven Wrapper e espera /actuator/health = UP
#    (pode levar até 3 min na primeira vez, pelo download de dependências).
bash e2e/scripts/start-api.sh

# 3a. Suíte do clinic (sobe só o proxy CORS local + `vite dev` — não a infra
#     pesada, que já está de pé pelos passos 1-2).
cd apps/clinic && pnpm exec playwright test --config e2e/playwright.config.ts

# 3b. Suíte cross-app (landing-lead), da raiz do repo.
cd ../.. && pnpm exec playwright test --config e2e/playwright.config.ts

# 4. Derrubar tudo.
bash e2e/scripts/stop-all.sh
```

### Anti-mock (não precisa de infra — pode rodar isolado a qualquer momento)

```bash
node apps/clinic/e2e/check-no-mock-in-bundle.mjs
```

### Só compilar/listar as specs (sem rodar, sem infra)

```bash
cd apps/clinic && pnpm exec playwright test --config e2e/playwright.config.ts --list
cd ../.. && pnpm exec playwright test --config e2e/playwright.config.ts --list
```

## 3. O que cada suíte cobre e como

### `apps/clinic/e2e/clinic-flow.spec.ts`

Roda em Chromium real contra `vite dev` do clinic, com
`VITE_{AUTH,PATIENTS,AGENDA}_ADAPTER=http` (força os `HttpAdapters` reais —
ver `apps/clinic/src/adapters/*/index.ts`) e `VITE_API_BASE_URL` apontando
para um **proxy CORS local** (`apps/clinic/e2e/support/api-proxy.mjs`, os
dois sobem via `webServer` do `playwright.config.ts`).

**Por que o proxy existe**: a API (`apps/api`) não configura CORS — pensada
para rodar atrás de um proxy que compartilhe origem com o front (o próprio
default `VITE_API_BASE_URL ?? "/api"`, um caminho relativo, já sugere isso).
Rodar o clinic (`vite dev`, porta 5180) contra a API (porta 8080)
diretamente faria o navegador bloquear o preflight `OPTIONS` de qualquer
`POST`/`PUT`/`DELETE` JSON (login, cadastrar paciente, agendar consulta).
Alterar isso na API ou em `vite.config.ts` (`server.proxy`) está fora de
`allowed_paths` desta tarefa — o proxy local fecha a lacuna sem tocar
nenhum dos dois.

**Passos do teste**: registro (`/auth/register` real) → onboarding pulado
("Concluir depois" — usa `MockSettingsAdapter`, ver nota abaixo) →
dashboard → cadastrar paciente (`POST /patients` real, com
`Authorization: Bearer <token>` — ver a ponte de access token) → agendar
consulta (`POST /appointments` real) → cartão da consulta visível na
agenda. **Navegação só via clique** depois do login inicial: a sessão do
clinic vive só em memória (nunca `localStorage`/cookie —
`src/session/SessionManager.ts`), e um `page.goto()` recarregaria o app e
derrubaria a sessão (achado ao rodar esta suíte pela primeira vez).

**Onboarding usa mock, não a API real**: `HttpSettingsAdapter` ainda não
persiste onboarding contra o contrato (`SettingsAdapterUnsupportedError` —
o contrato não modela perfil profissional/horários/lembretes ainda).
`VITE_SETTINGS_ADAPTER` fica de fora do `webServer` de propósito, então
`vite dev` (modo não-produção) usa o padrão (`MockSettingsAdapter`) — o
teste só clica "Concluir depois", nunca depende de nenhum dado persistido
ali. Fora do escopo desta tarefa (acceptance criteria cobre auth/pacientes/
agenda).

**Ponte de access token** (`apps/clinic/src/adapters/auth/accessTokenBridge.ts`):
os `HttpPatientsAdapter`/`HttpAgendaAdapter` são singletons instanciados no
import de `src/adapters/*/index.ts`, antes de qualquer sessão existir — não
têm como receber o token do `SessionManager` (que o mantém estritamente
privado, só acessível via `withAuth(operation)`). `withAccessTokenBridge`
decora o `authAdapter` (o MESMO que `SessionProvider` usa) para espelhar o
token de cada login/registro/renovação numa variável de módulo, que os
outros adapters HTTP leem via `getAccessToken`. Ver a doc do arquivo para
os detalhes e a limitação conhecida (token não é limpo em `logout()` — sem
efeito prático no fluxo normal do app).

### `e2e/specs/landing-lead.spec.ts`

**Não** passa pela UI (`<LeadForm>`) — ver a nota de escopo abaixo. Chama
`HttpLeadAdapter` (`apps/landing/src/adapters/lead/HttpLeadAdapter.ts`)
diretamente contra `POST http://localhost:8080/leads` e confirma a
persistência consultando a tabela `leads` do Postgres via
`docker exec psiops-postgres psql` (`e2e/support/db.mjs` — sem driver npm
novo, ver a doc do arquivo). Também prova o comportamento idempotente REAL
da API para e-mail duplicado (devolve o registro já existente, não um 409 —
divergência descoberta ao integrar, documentada no teste e no PR).

Dados isolados por execução: e-mail único por rodada
(`e2e/support/unique.mjs`) — cada `bash e2e/run-e2e.sh` gera dados novos,
sem exigir reset de banco.

**Rate limit do `/leads` (5 submissões/min por IP, `LeadRateLimiter`)**: a
suíte usa só 3 submissões por execução, bem abaixo do limite, mas reruns
manuais MUITO próximos (menos de ~1 min entre eles, contra a MESMA API já
em execução) podem esbarrar no limite (em memória, por processo — sem reset
exceto reiniciar a API). Se isso acontecer, espere ~1 min ou reinicie a API
(`bash e2e/scripts/stop-all.sh && bash e2e/scripts/start-api.sh`).

### `apps/clinic/e2e/check-no-mock-in-bundle.mjs`

Builda `apps/clinic` em modo produção (sem nenhum `VITE_*_ADAPTER` no
ambiente — o default real de deploy) e varre `dist/assets/*.js` por
identificadores que só existem nos sete `Mock*Adapter`. Não precisa de
Postgres/Mailpit/API — só do próprio código do clinic. Ver o comentário no
topo do arquivo para o histórico: a primeira versão desta checagem PEGOU um
bundle de produção real vazando `MockAuthAdapter` inteiro, porque a
indireção original de `createXAdapter()` → `resolveXAdapterKind()` →
`readExplicitKind()` impedia o minificador de provar o branch morto —
corrigido "achatando" a decisão numa única expressão local em cada
`src/adapters/*/index.ts`.

## 4. Nota de escopo — landing/`<LeadForm>` não usa `HttpLeadAdapter`

A PSI-044 permite tocar apenas `apps/landing/src/adapters/**`. O adapter de
lead REAL da landing (`src/lib/lead-adapter.ts`, PSI-018) e o formulário que
o consome (`src/components/LeadForm.tsx`) vivem fora desse caminho — e o
manifesto lista explicitamente "telas fora de `src/adapters/**`" como
`out_of_scope`, com qualquer necessidade virando "registro para o
orquestrador". Por isso `HttpLeadAdapter`/`apps/landing/src/adapters/lead/**`
foram implementados, testados (`pnpm --filter @psiops/landing test`) e
provados via este E2E — mas `<LeadForm>` continua chamando o mock em
memória de `src/lib/lead-adapter.ts`. Ver open_question do PR desta tarefa.

## 5. Reexecutabilidade

Sem intervenção manual entre execuções:

- **clinic**: e-mail da conta e nome do paciente incluem
  `Date.now() + random` — nunca colidem com uma execução anterior.
- **landing**: mesma estratégia (`e2e/support/unique.mjs`); além disso a
  API é idempotente por e-mail (ver acima), então mesmo uma colisão nunca
  quebraria o teste com um erro inesperado.
- **Nenhum reset de banco é necessário** entre execuções — os dados de cada
  rodada só se acumulam (aceitável para ambiente local/CI efêmero; `docker
  compose down -v` limpa o volume se quiser começar do zero).

## 6. Arquivos desta suíte

```
e2e/
├── README.md                    # este arquivo
├── playwright.config.ts         # config da suíte cross-app (landing-lead)
├── run-e2e.sh                   # orquestra tudo: infra + API + as duas suítes + teardown
├── specs/
│   └── landing-lead.spec.ts
├── support/
│   ├── db.mjs                   # consulta ao Postgres via docker exec psql
│   └── unique.mjs               # e-mails únicos por execução
└── scripts/
    ├── link-playwright.sh       # ver seção 0
    ├── start-infra.sh           # docker compose up -d + espera healthy
    ├── start-api.sh             # builda/sobe apps/api + espera /actuator/health
    └── stop-all.sh              # derruba API + (por padrão) docker compose

apps/clinic/e2e/
├── playwright.config.ts         # config do fluxo crítico do clinic (webServer: proxy + vite dev)
├── clinic-flow.spec.ts
├── check-no-mock-in-bundle.mjs  # anti-mock — roda sem infra
└── support/
    └── api-proxy.mjs            # proxy CORS local (ver seção 3)
```
