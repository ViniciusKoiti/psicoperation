package com.psiops.api.notification.email;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import org.junit.jupiter.api.Test;

/** Testes de formatação pt-BR usada exclusivamente na renderização do e-mail (PSI-029). */
class BrazilianFormatsTest {

  @Test
  void currency_formatsCentsAsBrazilianReais() {
    assertThat(BrazilianFormats.currency(15000L)).isEqualTo("R$ 150,00");
    assertThat(BrazilianFormats.currency(99L)).isEqualTo("R$ 0,99");
    assertThat(BrazilianFormats.currency(100_00L)).isEqualTo("R$ 100,00");
  }

  @Test
  void date_formatsAsDdMmYyyy() {
    assertThat(BrazilianFormats.date(LocalDate.of(2026, 7, 9))).isEqualTo("09/07/2026");
  }

  @Test
  void dateTimeInSaoPaulo_convertsUtcInstantToSaoPauloLocalTime() {
    // 2026-07-09T15:00:00Z = 12:00 em America/Sao_Paulo (UTC-3, sem horário de verão no Brasil desde 2019).
    OffsetDateTime utcInstant = OffsetDateTime.of(2026, 7, 9, 15, 0, 0, 0, ZoneOffset.UTC);

    assertThat(BrazilianFormats.dateTimeInSaoPaulo(utcInstant)).isEqualTo("09/07/2026 às 12:00");
  }
}
