package com.psiops.api.notification.appointment;

import com.psiops.api.notification.email.BrazilianFormats;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;

/**
 * Calcula os instantes de véspera/dia de uma consulta e compõe o
 * assunto/corpo (pt-BR, texto simples, exclusivamente administrativo) dos
 * dois lembretes automáticos criados por {@link AppointmentReminderPolicy}
 * (PSI-029).
 *
 * <p><strong>Fuso de referência</strong>: America/Sao_Paulo (assumption do
 * manifesto PSI-029, único fuso do MVP) - {@code startsAt} do evento de
 * agenda (PSI-024) é sempre um instante absoluto (UTC); os horários fixos de
 * disparo abaixo são interpretados nesse fuso e convertidos de volta para
 * instante absoluto antes de agendar o deadline.
 *
 * <p><strong>Horários fixos</strong> (não configuráveis nesta tarefa, ver
 * open_question no PR): véspera às {@value #VESPERA_HOUR}h do dia anterior à
 * consulta; dia às {@value #DIA_HOUR}h do próprio dia da consulta. Se o
 * instante calculado já estiver no passado (ex.: consulta agendada em cima
 * da hora, sem tempo hábil para a véspera), o lembrete correspondente
 * simplesmente não é criado - ver {@link AppointmentReminderPolicy}.
 */
final class AppointmentReminderTemplates {

  static final int VESPERA_HOUR = 18;
  static final int DIA_HOUR = 8;

  private AppointmentReminderTemplates() {}

  static OffsetDateTime vesperaInstant(OffsetDateTime appointmentStartsAt) {
    ZonedDateTime appointmentLocal = appointmentStartsAt.atZoneSameInstant(BrazilianFormats.saoPauloZone());
    LocalDate dayBefore = appointmentLocal.toLocalDate().minusDays(1);
    return ZonedDateTime.of(dayBefore, LocalTime.of(VESPERA_HOUR, 0), BrazilianFormats.saoPauloZone())
        .toOffsetDateTime();
  }

  static OffsetDateTime diaInstant(OffsetDateTime appointmentStartsAt) {
    ZonedDateTime appointmentLocal = appointmentStartsAt.atZoneSameInstant(BrazilianFormats.saoPauloZone());
    LocalDate sameDay = appointmentLocal.toLocalDate();
    return ZonedDateTime.of(sameDay, LocalTime.of(DIA_HOUR, 0), BrazilianFormats.saoPauloZone())
        .toOffsetDateTime();
  }

  static String vesperaSubject() {
    return "Lembrete: consulta amanhã";
  }

  static String vesperaBody(OffsetDateTime appointmentStartsAt) {
    return "Você tem consulta agendada para amanhã, " + BrazilianFormats.dateTimeInSaoPaulo(appointmentStartsAt) + ".";
  }

  static String diaSubject() {
    return "Lembrete: consulta hoje";
  }

  static String diaBody(OffsetDateTime appointmentStartsAt) {
    return "Você tem consulta agendada para hoje, " + BrazilianFormats.dateTimeInSaoPaulo(appointmentStartsAt) + ".";
  }
}
