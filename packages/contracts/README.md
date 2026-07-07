# @psiops/contracts

Especificação **OpenAPI 3.1** do PsiOps — a **fonte única de verdade** dos
contratos entre os frontends web (`apps/landing`, `apps/clinic`), o app mobile
(`apps/mobile`) e o backend Spring Boot (`apps/api`). Ver ADR 0008
(`docs/adr/0008-contratos-openapi-first.md`).

Esta tarefa (PSI-005) entrega a spec base (common, auth, lead) e o codegen
**TypeScript**. Os alvos Java (`gen/java`) e Dart (`gen/dart`) chegam na
PSI-006; os contratos do domínio clínico/financeiro, na PSI-020.

## Estrutura

```
openapi/
  openapi.yaml               # arquivo raiz (info, servers, tags, paths, components)
  paths/
    auth/                    # /auth/register, /auth/login, /auth/refresh, /auth/session
    lead/                    # /leads
  components/
    common/                  # problem (RFC 9457), responses, pagination, money, datetime
    auth/                    # User, RegisterRequest, LoginRequest, TokenPair, ...
    lead/                    # WhatsAppBR, LeadCreateRequest, Lead
gen/
  ts/                        # codegen TypeScript COMITADO (não editar à mão)
    api.d.ts                 # paths / components / operations (openapi-typescript)
    index.d.ts               # reexports + um alias por schema (Lead, Problem, ...)
scripts/generate.mjs         # regenera gen/ts de forma determinística
redocly.yaml                 # lint da spec (Redocly CLI, ruleset recommended)
```

## Convenções do contrato (invioláveis)

- **Payloads em camelCase** — alinhado aos DTOs Java e modelos Dart gerados.
- **Dinheiro**: schema `MoneyBRL` — BRL como **inteiro em centavos**
  (R$ 150,00 → `15000`); nunca float, nunca string decimal.
- **Datas**: schemas `IsoDate` (`YYYY-MM-DD`) e `IsoDateTime`
  (ISO 8601/RFC 3339; backend emite UTC com sufixo `Z`).
- **Erros**: Problem Details (RFC 9457), media type `application/problem+json`
  (`Problem`; validação usa `ValidationProblem` com `violations` por campo).
- **WhatsApp brasileiro**: schema `WhatsAppBR`, E.164 restrito a celular BR —
  `^\+55[1-9][1-9]9[0-9]{8}$` (ex.: `+5511990000000`). A máscara de UI
  `(XX) XXXXX-XXXX` é apresentação; o cliente normaliza antes de enviar.
- **Autenticação**: bearer token JWT (`securitySchemes.bearerAuth`); refresh
  token opaco rotacionado, trafegando no corpo (open question registrada:
  pode migrar para cookie httpOnly por decisão de produto/segurança).

## Consumo

Pacote de **tipos puros** (sem runtime, sem build): os apps JS/TS adicionam
`"@psiops/contracts": "workspace:*"` e importam do codegen — nunca redefinem
DTOs (regra 8 do CLAUDE.md).

```ts
import type { LeadCreateRequest, Problem, paths } from "@psiops/contracts";
// granular: import type { operations } from "@psiops/contracts/api";
```

## Scripts

| Script             | O que faz                                                               |
| ------------------ | ----------------------------------------------------------------------- |
| `pnpm generate`    | Regenera `gen/ts` a partir de `openapi/openapi.yaml` (determinístico)   |
| `pnpm lint`        | ESLint + `redocly lint` da spec                                         |
| `pnpm lint:spec`   | Somente o lint da spec (Redocly, ruleset `recommended`)                 |
| `pnpm check:drift` | Regenera e roda `git diff --exit-code -- gen` (falha se houver drift)   |
| `pnpm test`        | Vitest: testes estruturais da spec, **teste de drift** e testes de tipo |
| `pnpm typecheck`   | `tsc --noEmit` sobre gen/, tests/ e configs                             |

## Codegen e drift

- Gerador: **openapi-typescript** (versão **exata** fixada no `package.json` —
  versão flutuante poderia mudar o output e disparar falso positivo de drift).
- `gen/ts` é **comitado**. Depois de qualquer mudança na spec:
  `pnpm --filter @psiops/contracts generate` e comite o diff.
- O drift é reprovado de duas formas equivalentes:
  1. `tests/drift.test.ts` — regenera **em memória** e compara byte a byte com
     o conteúdo comitado (roda no `pnpm test`/CI, sem sujar a árvore);
  2. `pnpm check:drift` — regenera no disco e roda `git diff --exit-code -- gen`.
- `gen/` fica fora do ESLint e do Prettier (`.prettierignore`): a formatação é
  do gerador; reformatar quebraria o teste de drift.

## Alvos Java e Dart (PSI-006)

- Gerador: **openapi-generator 7.23.0** (fixado em `openapitools.json`; CLI
  `@openapitools/openapi-generator-cli` no `package.json`). Requer JDK
  (`JAVA_HOME`) — em desenvolvimento local: `~/.local/jdk/current`.
- `pnpm generate` regenera os três alvos (`ts`, `java`, `dart`) via
  `scripts/generate.mjs`: a spec é _bundlada_ com Redocly e gerada em modo
  **models-only**; `pom.xml`/`pubspec.yaml` vêm dos templates em
  `scripts/templates/` (não do generator). `pnpm generate:java` /
  `pnpm generate:dart` regeneram um alvo só.

### Consumo no backend (apps/api, Maven)

`gen/java` é um projeto Maven mínimo (`com.psiops:psiops-contracts:0.1.0`,
Java 21, Jackson + jakarta.validation). Passos exatos:

```bash
# 1. instalar no repositório local do Maven (na raiz do monorepo):
mvn -f packages/contracts/gen/java/pom.xml install

# 2. consumir no pom.xml de apps/api:
#    <dependency>
#      <groupId>com.psiops</groupId>
#      <artifactId>psiops-contracts</artifactId>
#      <version>0.1.0</version>
#    </dependency>
```

O CI da API deve executar o passo 1 antes do `./mvnw verify` (responsabilidade
da PSI-010).

### Consumo no mobile (apps/mobile, Flutter)

`gen/dart` é um package Dart local (`psiops_contracts`). No `pubspec.yaml` do
app:

```yaml
dependencies:
  psiops_contracts:
    path: ../../packages/contracts/gen/dart
```

`pubspec.lock` e artefatos de build não são comitados em `gen/dart`.
