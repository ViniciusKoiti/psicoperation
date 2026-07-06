# ADR 0009 — Persistência JPA + Flyway e assincronicidade com eventos Axon

- Status: aceito
- Data: 2026-07-05
- Substitui: ADR 0004

## Contexto

Com o backend em Spring Boot (ADR 0007), Prisma e o pacote `packages/database`
deixam de fazer sentido. A integração API→automation via tabela Outbox também cai,
pois a assincronicidade agora vive dentro do próprio backend via Axon.

## Decisão

1. Persistência em **JPA/Hibernate + PostgreSQL**, com **Flyway** para migrations,
   tudo dentro de `apps/api` (`src/main/resources/db/migration/`).
2. Migrations são **sequenciais e imutáveis** (`V1__`, `V2__`, …): nenhum agente
   altera ou reordena migration existente; correção = nova migration. Somente tarefas
   designadas (`shared_change: true`) tocam `**/db/migration/**` — o glob é proibido
   por padrão em todos os outros manifestos.
3. Multi-tenant lógico preservado: toda tabela do domínio tem `user_id` (a psicóloga),
   toda query filtra por ele, índices compostos `(user_id, período)` nas tabelas quentes.
4. **Assincronicidade via Axon**, substituindo a Outbox:
   - agregados **state-stored** publicam eventos de domínio (schemas em
     `packages/contracts`);
   - event store JPA embutido no PostgreSQL (sem Axon Server no MVP);
   - **DeadlineManager** agenda lembretes (véspera/dia da consulta) e a verificação
     diária de cobranças vencidas;
   - event handlers cuidam de projeções e do envio de e-mail (SMTP/Mailpit),
     idempotentes e com retry — handlers não contêm regra de negócio, só entrega.
5. Seeds de demonstração rodam por perfil de aplicação (`demo`), nunca via migration.

## Consequências

- Um único banco (PostgreSQL) carrega domínio + event store + tokens de processamento:
  infraestrutura mínima, consistência transacional entre estado e eventos.
- Entrega de e-mail é *at-least-once*; idempotência por identificador determinístico.
- A imutabilidade de migrations vale também para as tabelas do Axon (criadas em
  migration própria, nunca por `ddl-auto`) — `hibernate.ddl-auto=validate`.
