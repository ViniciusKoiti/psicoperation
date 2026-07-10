package com.psiops.api.demo;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

/**
 * Funções puras (sem estado, sem I/O) que traduzem "a data de execução"
 * (recebida como {@link Clock}, nunca lida diretamente do relógio do sistema)
 * nas datas concretas que {@link DemoDataSeeder} usa para semear a agenda e
 * as mensalidades de demonstração.
 *
 * <p>Isolar essa lógica de datação em métodos estáticos puros permite
 * verificar o requisito "determinismo relativo à data de execução" (risco do
 * manifesto PSI-046) com um teste de relógio controlado simples ({@code
 * Clock.fixed(...)}), sem precisar de contexto Spring nem banco de dados —
 * ver {@code DemoDatePlannerTest}.
 */
final class DemoDatePlanner {

  /** Horizonte da agenda de demonstração: 7 dias antes e 7 depois de hoje. */
  private static final int AGENDA_WINDOW_DAYS = 7;

  /** Cobrança "em dia" (paga): vencimento futuro, mas já quitada pelo seed. */
  private static final int EM_DIA_DUE_OFFSET_DAYS = 15;

  /** Cobrança "pendente": vencimento futuro, ainda sem pagamento. */
  private static final int PENDENTE_DUE_OFFSET_DAYS = 20;

  /** Cobrança "atrasada": vencimento no passado, sem pagamento. */
  private static final int ATRASADA_DUE_OFFSET_DAYS = 20;

  private DemoDatePlanner() {}

  /** "Hoje" segundo o relógio informado — nunca {@code LocalDate.now()} direto. */
  static LocalDate today(Clock clock) {
    return LocalDate.now(clock);
  }

  /**
   * Dias úteis (segunda a sexta) na janela de 2 semanas em torno de {@code
   * today(clock)} (7 dias antes até 7 dias depois, ambos inclusive) — a
   * agenda de demonstração. Ordem crescente, sem duplicatas.
   */
  static List<LocalDate> agendaWeekdays(Clock clock) {
    LocalDate today = today(clock);
    LocalDate start = today.minusDays(AGENDA_WINDOW_DAYS);
    LocalDate end = today.plusDays(AGENDA_WINDOW_DAYS);
    List<LocalDate> weekdays = new ArrayList<>();
    for (LocalDate day = start; !day.isAfter(end); day = day.plusDays(1)) {
      DayOfWeek dayOfWeek = day.getDayOfWeek();
      if (dayOfWeek != DayOfWeek.SATURDAY && dayOfWeek != DayOfWeek.SUNDAY) {
        weekdays.add(day);
      }
    }
    return weekdays;
  }

  /** Competência (formato {@code AAAA-MM}) do mês corrente, segundo o relógio. */
  static String currentCompetence(Clock clock) {
    LocalDate today = today(clock);
    return String.format("%04d-%02d", today.getYear(), today.getMonthValue());
  }

  /** Vencimento da cobrança de demonstração já paga ("em dia"). */
  static LocalDate emDiaDueDate(Clock clock) {
    return today(clock).plusDays(EM_DIA_DUE_OFFSET_DAYS);
  }

  /** Vencimento da cobrança de demonstração ainda não vencida ("pendente"). */
  static LocalDate pendenteDueDate(Clock clock) {
    return today(clock).plusDays(PENDENTE_DUE_OFFSET_DAYS);
  }

  /** Vencimento (no passado) da cobrança de demonstração vencida ("atrasada"). */
  static LocalDate atrasadaDueDate(Clock clock) {
    return today(clock).minusDays(ATRASADA_DUE_OFFSET_DAYS);
  }
}
