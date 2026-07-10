/**
 * Camada assíncrona de lembretes e e-mail (PSI-029) — fecha o ciclo iniciado
 * em PSI-026 (financeiro) e PSI-027 (lembretes), sem introduzir regra de
 * negócio nova.
 *
 * <h2>Responsabilidade única: agendar e entregar, nunca decidir</h2>
 *
 * <p>Nada neste pacote decide se uma cobrança está atrasada (isso é do
 * agregado {@code ChargeEntity}, PSI-026) nem se um lembrete é devido em si
 * (isso é o {@code scheduledFor} já validado por {@code ReminderService},
 * PSI-027). Este pacote só: (1) traduz eventos de domínio em deadlines reais
 * no {@code DeadlineManager}; (2) quando um deadline dispara, entrega o
 * e-mail correspondente; (3) mantém uma varredura diária que CHAMA a regra
 * já existente do módulo financeiro (nunca a reimplementa).
 *
 * <h2>Organização</h2>
 *
 * <ul>
 *   <li>{@code notification.reminder} — agenda/cancela o deadline real de um
 *       {@code ReminderEntity} (PSI-027) e entrega o e-mail quando ele
 *       dispara. Cobre tanto lembretes criados via {@code POST /reminders}
 *       quanto os lembretes de véspera/dia de consulta criados por {@code
 *       notification.appointment} — ambos são, sob o capô, a mesma entidade
 *       {@code ReminderEntity}, então ganham a mesma idempotência durável
 *       ({@code reminders.sent_at}/{@code status}) e a mesma reidratação no
 *       startup de graça.</li>
 *   <li>{@code notification.appointment} — reage a {@code
 *       AppointmentCreatedEvent}/{@code AppointmentRescheduledEvent}/{@code
 *       AppointmentCancelledEvent} (PSI-024) criando/cancelando os DOIS
 *       lembretes de consulta (véspera e dia) como {@code ReminderEntity}
 *       comuns — nenhum mecanismo de deadline paralelo.</li>
 *   <li>{@code notification.billing} — a varredura diária de cobranças
 *       vencidas (chama {@code ChargeService#detectOverdueForAllUsers}, que
 *       só amplia a SUPERFÍCIE de disparo da regra já existente em PSI-026,
 *       nunca a decisão em si) e o handler de e-mail de {@code
 *       cobranca.atrasada}.</li>
 *   <li>{@code notification.email} — infraestrutura de entrega comum: envio
 *       via {@code JavaMailSender} com retry/backoff, formatação pt-BR
 *       (moeda/data) e a projeção dos eventos internos no DTO de envelope
 *       comum dos contratos ({@code DomainEvent}/{@code ChargeOverdueEvent}/
 *       {@code ReminderDueEvent}, PSI-020).</li>
 * </ul>
 *
 * <h2>Decisões arquiteturais (ver detalhamento no PR)</h2>
 *
 * <ul>
 *   <li><strong>Deadline persistente vs reidratação</strong>: nenhuma
 *       migration nova é permitida (tabelas da PSI-021 são as únicas
 *       disponíveis) e db-scheduler/JobRunr exigiriam tabelas próprias — o
 *       MVP usa o {@code SimpleDeadlineManager} já configurado (em memória)
 *       MAIS uma reidratação no {@code ApplicationReadyEvent} ({@code
 *       ReminderDeadlineRehydrationRunner}) que relê {@code reminders} com
 *       {@code status = AGENDADO} e reagenda cada deadline — inclusive os já
 *       vencidos durante o tempo de indisponibilidade, que disparam quase
 *       imediatamente. Isso cobre tanto lembretes gerais quanto os de
 *       véspera/dia de consulta, por serem a mesma entidade.</li>
 *   <li><strong>Idempotência de lembrete</strong>: coluna persistente {@code
 *       reminders.sent_at}/{@code status} (durável, sobrevive a restart e a
 *       redelivery do processador).</li>
 *   <li><strong>Idempotência de cobrança atrasada</strong>: NÃO existe
 *       coluna de "e-mail enviado" para {@code charges} (fora de escopo criar
 *       migration) — usa-se um guard em memória por {@code eventId} dentro
 *       do handler ({@code ChargeOverdueEmailHandler}), suficiente para
 *       redelivery dentro da mesma execução, mas que NÃO sobrevive a
 *       restart. Registrado como open_question no PR: uma tabela de log de
 *       envio (migration futura) tornaria isso durável.</li>
 *   <li><strong>Isolamento</strong>: {@code ReminderEmailHandler} e {@code
 *       ChargeOverdueEmailHandler} vivem no processing group {@code
 *       email-delivery} (modo {@code tracking}, thread própria) - retries de
 *       SMTP nunca bloqueiam o agendamento de deadlines nem requisições
 *       HTTP.</li>
 * </ul>
 */
package com.psiops.api.notification;
