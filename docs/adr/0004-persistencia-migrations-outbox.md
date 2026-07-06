# ADR 0004 — Persistência centralizada, migrations serializadas e padrão Outbox

- Status: substituído pelo ADR 0009 em 2026-07-05 (pivô de stack)
- Data: 2026-07-05

## Contexto

Múltiplos agentes paralelos + um schema de banco = risco alto de migrations conflitantes
e de acesso a dados espalhado. Além disso, a automation precisa reagir a fatos do domínio
(cobrança atrasada, lembrete devido) sem acoplar a API ao Redis.

## Decisão

1. **Todo** acesso a banco passa por `packages/database` (Prisma + PostgreSQL);
   apps não instanciam clients próprios.
2. `schema.prisma`, migrations, seeds e fixtures estruturais só podem ser alterados por
   tarefas explicitamente designadas (PSI-006, PSI-020, PSI-040), sempre
   `shared_change: true` e portanto serializadas.
3. Migrations são **sequenciais e imutáveis**: nenhum agente altera ou reordena migration
   criada por outro. Correção = nova migration.
4. Multi-tenant lógico: toda tabela do domínio referencia `userId` (a psicóloga) e toda
   query da API filtra por ele. Índices compostos `(userId, período)` nas tabelas quentes.
5. **Padrão Outbox**: a API grava eventos de domínio (envelope definido em
   `@psiops/contracts`) na tabela `Outbox` dentro da transação de negócio.
   A automation faz poll, publica jobs no BullMQ e marca o evento como processado.
   A API não conhece Redis; a automation não contém regra de negócio.

## Consequências

- Fluxo de evolução de schema é gargalo deliberado (uma tarefa por vez) — previsível
  e livre de conflitos de migration.
- Entrega de e-mail é *at-least-once*; processors são idempotentes por `jobId`
  determinístico.
- Poll da Outbox introduz latência de segundos — aceitável para lembretes e cobrança.
