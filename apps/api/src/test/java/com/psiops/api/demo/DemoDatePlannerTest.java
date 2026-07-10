package com.psiops.api.demo;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import org.junit.jupiter.api.Test;

/**
 * Teste de unidade (sem Spring, sem banco) com relógio controlado (ver risco
 * do manifesto PSI-046: "determinismo deve ser relativo à data de execução e
 * coberto por teste de relógio controlado"). {@link DemoDatePlanner} nunca lê
 * {@code LocalDate.now()}/{@code OffsetDateTime.now()} sem argumento — só
 * recebe {@link Clock} — então este teste fixa dois relógios distintos e
 * verifica que toda data derivada muda de forma previsível (deslocamento
 * fixo relativo a "hoje") e que a mesma entrada sempre produz a mesma saída.
 */
class DemoDatePlannerTest {

  // Sexta-feira — cai dentro da própria janela de dias úteis.
  private static final Clock FRIDAY_CLOCK =
      Clock.fixed(Instant.parse("2026-07-10T12:00:00Z"), ZoneOffset.UTC);

  // Terça-feira, 46 dias depois — usado para provar que a saída acompanha a
  // data de execução (não fica presa à primeira data observada).
  private static final Clock LATER_TUESDAY_CLOCK =
      Clock.fixed(Instant.parse("2026-08-25T09:00:00Z"), ZoneOffset.UTC);

  @Test
  void todayReflectsTheInjectedClockNeverTheWallClock() {
    assertThat(DemoDatePlanner.today(FRIDAY_CLOCK)).isEqualTo(LocalDate.of(2026, 7, 10));
    assertThat(DemoDatePlanner.today(LATER_TUESDAY_CLOCK)).isEqualTo(LocalDate.of(2026, 8, 25));
  }

  @Test
  void agendaWeekdaysCoversExactlyTheWeekdaysInTheTwoWeekWindowAroundToday() {
    LocalDate today = LocalDate.of(2026, 7, 10);
    List<LocalDate> weekdays = DemoDatePlanner.agendaWeekdays(FRIDAY_CLOCK);

    assertThat(weekdays).isNotEmpty();
    assertThat(weekdays).allSatisfy(day -> {
      assertThat(day).isBetween(today.minusDays(7), today.plusDays(7));
      assertThat(day.getDayOfWeek()).isNotIn(DayOfWeek.SATURDAY, DayOfWeek.SUNDAY);
    });
    assertThat(weekdays).isSorted();
    // Janela [2026-07-03, 2026-07-17], ambas as pontas em sexta-feira: 11
    // dias úteis (duas semanas cheias mais a própria sexta de hoje contada
    // uma única vez nas duas pontas).
    assertThat(weekdays).hasSize(11);
    assertThat(weekdays.get(0)).isEqualTo(LocalDate.of(2026, 7, 3));
    assertThat(weekdays.get(weekdays.size() - 1)).isEqualTo(LocalDate.of(2026, 7, 17));
  }

  @Test
  void agendaWindowShiftsDeterministicallyWithTheExecutionDate() {
    List<LocalDate> fridayWindow = DemoDatePlanner.agendaWeekdays(FRIDAY_CLOCK);
    List<LocalDate> laterWindow = DemoDatePlanner.agendaWeekdays(LATER_TUESDAY_CLOCK);

    // Relógios diferentes (datas de execução diferentes) produzem janelas de
    // agenda diferentes, cada uma corretamente ancorada no seu próprio "hoje"
    // — nunca a mesma janela fixa independente da data de execução.
    assertThat(fridayWindow).isNotEqualTo(laterWindow);
    assertThat(laterWindow.get(0)).isEqualTo(LocalDate.of(2026, 8, 18));
    assertThat(laterWindow.get(laterWindow.size() - 1)).isEqualTo(LocalDate.of(2026, 9, 1));
  }

  @Test
  void sameClockAlwaysProducesTheSameAgendaWindow() {
    // Determinismo: a mesma data de execução nunca produz saídas diferentes
    // entre chamadas (função pura, sem estado mutável nem I/O).
    assertThat(DemoDatePlanner.agendaWeekdays(FRIDAY_CLOCK))
        .isEqualTo(DemoDatePlanner.agendaWeekdays(Clock.fixed(FRIDAY_CLOCK.instant(), ZoneOffset.UTC)));
  }

  @Test
  void currentCompetenceIsTheYearMonthOfToday() {
    assertThat(DemoDatePlanner.currentCompetence(FRIDAY_CLOCK)).isEqualTo("2026-07");
    assertThat(DemoDatePlanner.currentCompetence(LATER_TUESDAY_CLOCK)).isEqualTo("2026-08");
  }

  @Test
  void chargeDueDatesAreFixedOffsetsFromToday() {
    LocalDate today = LocalDate.of(2026, 7, 10);
    assertThat(DemoDatePlanner.emDiaDueDate(FRIDAY_CLOCK)).isEqualTo(today.plusDays(15));
    assertThat(DemoDatePlanner.pendenteDueDate(FRIDAY_CLOCK)).isEqualTo(today.plusDays(20));
    assertThat(DemoDatePlanner.atrasadaDueDate(FRIDAY_CLOCK)).isEqualTo(today.minusDays(20));

    // atrasada sempre no passado e pendente sempre no futuro, relativo ao
    // próprio "hoje" do relógio — nunca ao relógio real da máquina de teste.
    assertThat(DemoDatePlanner.atrasadaDueDate(FRIDAY_CLOCK)).isBefore(today);
    assertThat(DemoDatePlanner.pendenteDueDate(FRIDAY_CLOCK)).isAfter(today);
  }
}
