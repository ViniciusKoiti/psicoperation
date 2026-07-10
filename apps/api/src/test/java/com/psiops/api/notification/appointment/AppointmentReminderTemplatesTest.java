package com.psiops.api.notification.appointment;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

/**
 * Testes do cálculo de véspera/dia no fuso de referência America/Sao_Paulo
 * (PSI-029, risco do manifesto: "fuso horário incorreto dispara lembrete de
 * véspera no dia errado"). O Brasil não observa horário de verão desde 2019,
 * então America/Sao_Paulo é UTC-3 fixo, simplificando os casos abaixo.
 */
class AppointmentReminderTemplatesTest {

  @Test
  void vesperaInstant_isDayBeforeAt18hSaoPauloTime() {
    // 2026-07-10T17:00:00Z = 14:00 em São Paulo (UTC-3).
    OffsetDateTime appointmentStartsAt = OffsetDateTime.of(2026, 7, 10, 17, 0, 0, 0, ZoneOffset.UTC);

    OffsetDateTime vespera = AppointmentReminderTemplates.vesperaInstant(appointmentStartsAt);

    // Véspera (dia 9) às 18:00 -03:00 = 21:00 UTC do dia 9.
    OffsetDateTime expected = OffsetDateTime.of(2026, 7, 9, 21, 0, 0, 0, ZoneOffset.UTC);
    assertThat(vespera).isEqualTo(expected);
  }

  @Test
  void diaInstant_isSameDayAt8hSaoPauloTime() {
    OffsetDateTime appointmentStartsAt = OffsetDateTime.of(2026, 7, 10, 17, 0, 0, 0, ZoneOffset.UTC);

    OffsetDateTime dia = AppointmentReminderTemplates.diaInstant(appointmentStartsAt);

    // Dia (dia 10) às 08:00 -03:00 = 11:00 UTC do dia 10.
    OffsetDateTime expected = OffsetDateTime.of(2026, 7, 10, 11, 0, 0, 0, ZoneOffset.UTC);
    assertThat(dia).isEqualTo(expected);
  }

  @Test
  void vesperaAndDiaBodies_mentionSaoPauloLocalDateTime_noClinicalContent() {
    OffsetDateTime appointmentStartsAt = OffsetDateTime.of(2026, 7, 10, 17, 0, 0, 0, ZoneOffset.UTC);

    String vesperaBody = AppointmentReminderTemplates.vesperaBody(appointmentStartsAt);
    String diaBody = AppointmentReminderTemplates.diaBody(appointmentStartsAt);

    assertThat(vesperaBody).contains("10/07/2026 às 14:00").doesNotContainIgnoringCase("diagnóstico");
    assertThat(diaBody).contains("10/07/2026 às 14:00").doesNotContainIgnoringCase("diagnóstico");
  }
}
