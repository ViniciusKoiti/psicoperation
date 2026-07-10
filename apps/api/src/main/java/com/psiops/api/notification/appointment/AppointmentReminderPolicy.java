package com.psiops.api.notification.appointment;

import com.psiops.api.appointment.domain.event.AppointmentCancelledEvent;
import com.psiops.api.appointment.domain.event.AppointmentCreatedEvent;
import com.psiops.api.appointment.domain.event.AppointmentRescheduledEvent;
import com.psiops.api.appointment.persistence.AppointmentEntity;
import com.psiops.api.appointment.persistence.AppointmentRepository;
import com.psiops.api.reminder.domain.command.CancelReminderCommand;
import com.psiops.api.reminder.domain.command.ScheduleReminderCommand;
import com.psiops.api.reminder.persistence.ReminderChannel;
import com.psiops.api.reminder.persistence.ReminderEntity;
import com.psiops.api.reminder.persistence.ReminderRepository;
import com.psiops.api.reminder.persistence.ReminderStatus;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.axonframework.commandhandling.gateway.CommandGateway;
import org.axonframework.config.ProcessingGroup;
import org.axonframework.eventhandling.EventHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

/**
 * Cria/cancela os dois lembretes automáticos de consulta (véspera e dia) a
 * partir dos eventos de agenda (PSI-024), fechando o acceptance criteria do
 * manifesto PSI-029: "Deadlines de lembrete de consulta criadas para véspera
 * e dia da consulta a partir dos eventos de domínio; remarcação/cancelamento
 * cancela ou reagenda as deadlines correspondentes".
 *
 * <p><strong>Sem mecanismo de deadline paralelo</strong>: os lembretes de
 * véspera/dia são {@link ReminderEntity} comuns (mesmo agregado do PSI-027),
 * criados aqui via {@link ScheduleReminderCommand} - o agendamento real do
 * deadline é responsabilidade de {@code
 * com.psiops.api.notification.reminder.ReminderDeadlinePolicy}, que já reage
 * a {@code ReminderScheduledEvent} independentemente de quem o disparou. Essa
 * reutilização dá aos lembretes de consulta, de graça: idempotência durável
 * ({@code reminders.sent_at}/{@code status}) e reidratação no startup.
 *
 * <p><strong>Vínculo duplo (patientId + appointmentId)</strong>: ao
 * contrário de {@code POST /reminders} (que exige NO MÁXIMO um vínculo, ver
 * javadoc de {@code ReminderService}), os lembretes criados aqui têm os DOIS
 * vínculos preenchidos - {@code appointmentId} (para localizar e
 * cancelar/reagendar quando a consulta muda) e {@code patientId} (para
 * resolver o destinatário do e-mail, ver {@code
 * com.psiops.api.notification.reminder.ReminderEmailHandler}). A regra "no
 * máximo um vínculo" é uma validação do CASO DE USO {@code
 * ReminderService#assertAtMostOneLink} para entrada via API, não uma
 * invariante do agregado ({@code ReminderEntity#handle(ScheduleReminderCommand)}
 * não a repete) - portanto não é violada por este uso interno.
 *
 * <p><strong>Horário no passado</strong>: se o instante calculado de véspera
 * ou dia já não estiver mais no futuro (ex.: consulta marcada em cima da
 * hora), o lembrete correspondente simplesmente não é criado - documentado
 * como limitação aceitável do MVP (nenhum aviso tardio é melhor que travar
 * a criação da consulta).
 *
 * <p>Processing group {@code appointment-reminders} (modo {@code
 * subscribing}, mesmo motivo de {@code ReminderDeadlinePolicy}: operação
 * rápida, sem I/O externo).
 */
@Component
@ProcessingGroup("appointment-reminders")
public class AppointmentReminderPolicy {

  private static final Logger log = LoggerFactory.getLogger(AppointmentReminderPolicy.class);

  private final CommandGateway commandGateway;
  private final ReminderRepository reminderRepository;
  private final AppointmentRepository appointmentRepository;

  public AppointmentReminderPolicy(
      CommandGateway commandGateway, ReminderRepository reminderRepository, AppointmentRepository appointmentRepository) {
    this.commandGateway = commandGateway;
    this.reminderRepository = reminderRepository;
    this.appointmentRepository = appointmentRepository;
  }

  @EventHandler
  public void on(AppointmentCreatedEvent event) {
    scheduleBoth(event.appointmentId(), event.userId(), event.patientId(), event.startsAt());
  }

  @EventHandler
  public void on(AppointmentRescheduledEvent event) {
    cancelExisting(event.appointmentId());
    // AppointmentRescheduledEvent não carrega userId/patientId (ver seu
    // javadoc) - diferente de reaproveitar um lembrete anterior (frágil: já
    // pode ter disparado/sido apagado), busca-se o vínculo direto na fonte
    // de verdade, o próprio agregado de consulta (imutáveis por remarcação).
    AppointmentEntity appointment = appointmentRepository.findById(event.appointmentId()).orElse(null);
    if (appointment == null) {
      log.warn(
          "consulta {} remarcada, mas não encontrada para recriar lembretes de véspera/dia (inesperado)",
          event.appointmentId());
      return;
    }
    scheduleBoth(event.appointmentId(), appointment.getUserId(), appointment.getPatientId(), event.newStartsAt());
  }

  @EventHandler
  public void on(AppointmentCancelledEvent event) {
    cancelExisting(event.appointmentId());
  }

  private void scheduleBoth(UUID appointmentId, UUID userId, UUID patientId, OffsetDateTime appointmentStartsAt) {
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);

    OffsetDateTime vespera = AppointmentReminderTemplates.vesperaInstant(appointmentStartsAt);
    if (vespera.isAfter(now)) {
      dispatchSchedule(
          appointmentId,
          userId,
          patientId,
          AppointmentReminderTemplates.vesperaSubject(),
          AppointmentReminderTemplates.vesperaBody(appointmentStartsAt),
          vespera,
          now);
    }

    OffsetDateTime dia = AppointmentReminderTemplates.diaInstant(appointmentStartsAt);
    if (dia.isAfter(now)) {
      dispatchSchedule(
          appointmentId,
          userId,
          patientId,
          AppointmentReminderTemplates.diaSubject(),
          AppointmentReminderTemplates.diaBody(appointmentStartsAt),
          dia,
          now);
    }
  }

  private void dispatchSchedule(
      UUID appointmentId,
      UUID userId,
      UUID patientId,
      String subject,
      String body,
      OffsetDateTime scheduledFor,
      OffsetDateTime now) {
    commandGateway.sendAndWait(
        new ScheduleReminderCommand(
            UUID.randomUUID(),
            userId,
            ReminderChannel.EMAIL,
            subject,
            body,
            scheduledFor,
            patientId,
            appointmentId,
            null,
            now));
  }

  private void cancelExisting(UUID appointmentId) {
    List<ReminderEntity> scheduled = reminderRepository.findByAppointmentIdAndStatus(appointmentId, ReminderStatus.AGENDADO);
    OffsetDateTime now = OffsetDateTime.now(ZoneOffset.UTC);
    for (ReminderEntity reminder : scheduled) {
      commandGateway.sendAndWait(new CancelReminderCommand(reminder.getId(), now));
    }
  }
}
