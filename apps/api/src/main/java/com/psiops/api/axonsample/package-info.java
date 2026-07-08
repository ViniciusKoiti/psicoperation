/**
 * Fluxo exemplo fim-a-fim do Axon Framework (PSI-011).
 *
 * <p><strong>Este pacote não é um domínio real do PsiOps.</strong> Não
 * modela pacientes, mensalidades nem cobranças (isso é explicitamente fora
 * de escopo desta tarefa — ver {@code tasks/PSI-011.yaml}). Ele existe
 * apenas como <em>gabarito</em>: um comando despachado via {@code
 * CommandGateway} alcança um agregado state-stored, que aplica eventos
 * consumidos por uma projeção, consultável via {@code QueryGateway}, com um
 * {@code DeadlineManager} agendando e disparando um lembrete. As próximas
 * tarefas de domínio (pacientes, mensalidades, cobranças) devem seguir a
 * mesma organização de pacotes e as mesmas convenções descritas abaixo — e
 * então este pacote pode ser removido.
 *
 * <h2>Organização de pacotes por contexto</h2>
 *
 * <p>Segue a convenção do módulo raiz ({@code com.psiops.api}, ver seu
 * package-info): um pacote de topo por contexto ({@code axonsample}), com
 * subpacotes por camada:
 *
 * <ul>
 *   <li>{@code domain} — o agregado state-stored (entidade JPA + Axon) e seus
 *       comandos/eventos, em subpacotes {@code domain.command} e {@code
 *       domain.event};</li>
 *   <li>{@code application} — projeção (event handlers) e query handler, com
 *       o modelo de leitura e a query em {@code application.query};</li>
 *   <li>{@code config} — o bean {@code Repository<T>} do agregado (Axon não
 *       usa Spring Data aqui; state-stored aggregates precisam de um {@code
 *       GenericJpaRepository} configurado explicitamente).</li>
 * </ul>
 *
 * <h2>Convenções de nomenclatura</h2>
 *
 * <ul>
 *   <li><strong>Comandos</strong>: imperativo presente + substantivo + sufixo
 *       {@code Command} (ex.: {@code CreateSampleTaskCommand}). Carregam o
 *       identificador do agregado alvo anotado com {@code
 *       @TargetAggregateIdentifier}.</li>
 *   <li><strong>Eventos</strong>: particípio passado + sufixo {@code Event}
 *       (ex.: {@code SampleTaskCreatedEvent}) — fatos já ocorridos, nunca
 *       imperativos.</li>
 *   <li><strong>Queries</strong>: {@code Find...Query}/{@code Get...Query}
 *       (ex.: {@code FindSampleTaskQuery}); o resultado é um modelo de
 *       leitura próprio (ex.: {@code SampleTaskView}), nunca a entidade do
 *       agregado nem um DTO de {@code packages/contracts} usado como atalho.</li>
 * </ul>
 *
 * <h2>Imutabilidade</h2>
 *
 * <p>Comandos, eventos e queries são {@code record}s Java — imutáveis por
 * construção, sem setters, iguais/hashCode/toString gerados. Nenhuma lógica
 * de negócio vive neles: são mensagens de dados.
 *
 * <h2>Identificadores</h2>
 *
 * <p>O identificador do agregado ({@code taskId}) é uma {@code String} UUID
 * gerada pela camada que despacha o comando (fora do agregado) — o mesmo
 * padrão dos identificadores de aplicação já usados em {@code auth}/{@code
 * lead}/{@code settings} (UUID gerado pela aplicação). O campo é anotado com
 * {@code @Id} (JPA) e {@code @AggregateIdentifier} (Axon) simultaneamente,
 * como exige um agregado state-stored.
 */
package com.psiops.api.axonsample;
