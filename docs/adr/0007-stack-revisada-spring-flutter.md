# ADR 0007 — Stack revisada: Spring Boot + Axon no backend, Flutter no mobile

- Status: aceito
- Data: 2026-07-05
- Substitui: ADR 0003

## Contexto

Decisão do product owner antes de qualquer código de produto ser escrito:
backend em Java Spring (com Axon Framework para assincronicidades), React restrito
à web, e inclusão de um aplicativo mobile Flutter no MVP.

## Decisão

| App | Stack | Racional |
|---|---|---|
| `apps/landing` | **Next.js** (React) + Tailwind com tokens do `@psiops/ui` | Inalterado: SEO, estático, paridade com o protótipo. |
| `apps/clinic` | **Vite + React + Mantine** (web) | Inalterado: SPA autenticada da psicóloga no desktop. |
| `apps/mobile` | **Flutter** (Material 3, go_router) | Novo no MVP: app companion da psicóloga (dashboard, agenda, pacientes, financeiro). |
| `apps/api` | **Spring Boot 3 (Java 21, Maven) + Axon Framework** | Backend único: REST + regras de negócio + assincronicidade (eventos, sagas, deadlines). |
| Persistência | **JPA/Hibernate + Flyway + PostgreSQL** (dentro de `apps/api`) | Ver ADR 0009. |
| Testes | Vitest/Playwright (JS), JUnit + Testcontainers (Java), flutter_test/integration_test (Dart) | Runner idiomático por ecossistema. |
| Infra local | Docker Compose: PostgreSQL 16 + Mailpit (**sem Redis**) | Axon dispensa broker externo no MVP. |

`apps/automation` **deixa de existir**: filas BullMQ/Redis são substituídas por
eventos, sagas e o DeadlineManager do Axon dentro do próprio backend (lembretes de
consulta, verificação de cobranças atrasadas, envio de e-mail).

Uso pragmático do Axon no MVP: **agregados state-stored** (estado em JPA) publicando
eventos de domínio, event store JPA embutido no PostgreSQL, **sem Axon Server** e sem
event sourcing completo. Migrar para event sourcing/Axon Server é evolução possível
sem trocar o modelo de programação.

## Consequências

- Monorepo poliglota: pnpm/Turborepo orquestram apenas o lado JS; CI ganha jobs
  dedicados para Java (JDK 21 + Maven) e Flutter.
- Contratos não podem mais ser "Zod como fonte única" → OpenAPI-first (ADR 0008).
- `packages/database` (Prisma) deixa de existir → ADR 0009.
- Toolchains exigidas no ambiente de desenvolvimento: Node 22 + pnpm, JDK 21 + Maven,
  Flutter 3.32+, Docker.
