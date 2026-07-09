/**
 * Fundação do Axon Framework (PSI-011): configuração de infraestrutura
 * compartilhada por todos os módulos de domínio que virão a seguir.
 *
 * <h2>Decisão arquitetural: agregados state-stored, sem event sourcing (ADR
 * local desta tarefa, ver também ADR 0007 do monorepo)</h2>
 *
 * <p>Os agregados do PsiOps são <strong>state-stored</strong>: o estado é
 * persistido diretamente via JPA (entidade anotada com {@code @Entity} +
 * {@code @Aggregate(repository = "...")}, carregada/salva por um {@code
 * org.axonframework.modelling.command.GenericJpaRepository}). Os eventos
 * publicados por {@code AggregateLifecycle.apply(...)} <strong>não são a
 * fonte de verdade</strong> do estado do agregado — eles existem para
 * alimentar projeções (read models), integrações e auditoria. Isso significa
 * que:
 *
 * <ul>
 *   <li>agregados NÃO precisam de {@code @EventSourcingHandler} para
 *       reconstruir estado em produção (o {@code GenericJpaRepository}
 *       carrega a linha JPA diretamente, sem repropagar o stream de
 *       eventos);</li>
 *   <li>event sourcing completo, snapshotting e upcasting de eventos ficam
 *       fora do MVP (ver {@code tasks/PSI-011.yaml}, {@code out_of_scope});</li>
 *   <li>cada agregado precisa de um bean {@code Repository<T>} explícito
 *       (via {@code GenericJpaRepository.builder(...)}), registrado em uma
 *       classe {@code @Configuration} do próprio módulo de domínio — ver
 *       {@code com.psiops.api.axonsample.config} como gabarito.</li>
 * </ul>
 *
 * <h2>Sem Axon Server</h2>
 *
 * <p>O connector do Axon Server ({@code axon-server-connector}) é excluído
 * no {@code pom.xml} e {@code axon.axonserver.enabled=false} está setado em
 * {@code application.yml}. Não há Axon Server no MVP nem em produção. Com
 * {@code spring-boot-starter-data-jpa} no classpath e o connector ausente, a
 * autoconfiguração do Axon ({@code axon-spring-boot-autoconfigure}) usa,
 * automaticamente, as implementações JPA embutidas para:
 *
 * <ul>
 *   <li><strong>event store</strong> — {@code JpaEventStorageEngine}, grava
 *       em {@code DomainEventEntry}/{@code SnapshotEventEntry} no PostgreSQL
 *       da aplicação;</li>
 *   <li><strong>token store</strong> — {@code JpaTokenStore}, rastreia o
 *       progresso de tracking event processors em {@code TokenEntry};</li>
 *   <li><strong>saga store</strong> — {@code JpaSagaStore} (disponível para
 *       quando uma saga for necessária; esta tarefa não implementa sagas).</li>
 * </ul>
 *
 * <p>As entidades JPA acima são registradas automaticamente pela
 * autoconfiguração do Axon porque a aplicação não declara nenhum
 * {@code @EntityScan} próprio (ver {@code PsiopsApiApplication}) — se um dia
 * um {@code @EntityScan} explícito for adicionado, os pacotes {@code
 * org.axonframework.eventsourcing.eventstore.jpa}, {@code
 * org.axonframework.eventhandling.tokenstore.jpa} e {@code
 * org.axonframework.modelling.saga.repository.jpa} precisam ser incluídos
 * manualmente.
 *
 * <h2>Schema das tabelas do Axon</h2>
 *
 * <p>As tabelas acima têm migration Flyway própria desde a PSI-021 ({@code
 * V2__mvp_domain.sql}), obtida de forma determinística a partir do schema
 * exportado das próprias entidades JPA do Axon (Hibernate {@code
 * jakarta.persistence.schema-generation.scripts.action=create}) e transcrita
 * ajustada às convenções do projeto. Com isso, {@code
 * spring.jpa.hibernate.ddl-auto: validate} vale tanto em produção quanto em
 * teste — não há mais nenhum override de teste (a antiga anotação {@code
 * EphemeralAxonSchema}, que usava {@code ddl-auto=update}, foi removida).
 *
 * <h2>DeadlineManager</h2>
 *
 * <p>{@link com.psiops.api.axon.config.AxonDeadlineConfig} registra um
 * {@code SimpleDeadlineManager} (em memória, baseado em {@code
 * ScheduledExecutorService}). Decisão conservadora para o MVP sem Axon
 * Server: não exige infraestrutura adicional (sem JobRunr, sem
 * db-scheduler), mas <strong>não sobrevive a um restart da aplicação</strong>
 * — deadlines agendados e ainda não disparados são perdidos se o processo
 * cair. Essa limitação é aceitável para esta fundação e para o fluxo exemplo;
 * a PSI-029 (lembretes de cobrança) deve reavaliar se uma implementação
 * persistente (ex.: {@code db-scheduler-spring-boot-starter}) é necessária
 * antes de ir para produção.
 */
package com.psiops.api.axon.config;
