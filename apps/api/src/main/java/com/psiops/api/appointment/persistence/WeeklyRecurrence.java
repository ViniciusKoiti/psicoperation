package com.psiops.api.appointment.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import java.time.LocalDate;

/**
 * Recorrência semanal simples de uma consulta (embutido em {@link
 * AppointmentEntity}). Espelha o schema {@code WeeklyRecurrence} do contrato
 * de appointment (PSI-020). Ausente (todos os campos nulos) indica consulta
 * avulsa.
 */
@Embeddable
public class WeeklyRecurrence {

  @Enumerated(EnumType.STRING)
  @Column(name = "recurrence_weekday", length = 10)
  private Weekday weekday;

  @Column(name = "recurrence_interval")
  private Integer interval;

  @Column(name = "recurrence_until")
  private LocalDate until;

  protected WeeklyRecurrence() {
    // Exigido pelo JPA.
  }

  public WeeklyRecurrence(Weekday weekday, Integer interval, LocalDate until) {
    this.weekday = weekday;
    this.interval = interval;
    this.until = until;
  }

  public Weekday getWeekday() {
    return weekday;
  }

  public Integer getInterval() {
    return interval;
  }

  public LocalDate getUntil() {
    return until;
  }
}
