package com.psiops.api.notification.email;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Formatação exclusiva de APRESENTAÇÃO em pt-BR para o corpo dos e-mails
 * (PSI-029) - nunca usada para aritmética monetária, que permanece em
 * centavos inteiros em todo o resto do sistema (ver CLAUDE.md: "Dinheiro em
 * centavos, formatado pt-BR (R$) só na renderização do e-mail").
 */
public final class BrazilianFormats {

  private static final ZoneId SAO_PAULO = ZoneId.of("America/Sao_Paulo");
  private static final DateTimeFormatter DATE_PT_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy");
  private static final DateTimeFormatter DATE_TIME_PT_BR = DateTimeFormatter.ofPattern("dd/MM/yyyy 'às' HH:mm");

  private BrazilianFormats() {}

  /**
   * {@code amountCents} (centavos, inteiro) formatado como {@code R$ 150,00}.
   *
   * <p>Normaliza o espaço entre o símbolo e o valor: os dados de locale do
   * CLDR embutidos no JDK usam um espaço sem quebra ({@code U+00A0}) ou
   * estreito sem quebra ({@code U+202F}) ali, que renderiza de forma
   * inconsistente em clientes de e-mail em texto simples - trocado por um
   * espaço comum.
   */
  public static String currency(long amountCents) {
    NumberFormat format = NumberFormat.getCurrencyInstance(new Locale("pt", "BR"));
    BigDecimal reais = BigDecimal.valueOf(amountCents, 2).setScale(2, RoundingMode.UNNECESSARY);
    return format.format(reais).replace(' ', ' ').replace(' ', ' ');
  }

  /** Data de calendário (sem fuso) formatada como {@code dd/MM/yyyy}. */
  public static String date(LocalDate date) {
    return date.format(DATE_PT_BR);
  }

  /**
   * Instante convertido para o fuso de referência do MVP
   * (America/Sao_Paulo, ver assumption do manifesto PSI-029) e formatado
   * como {@code dd/MM/yyyy às HH:mm}.
   */
  public static String dateTimeInSaoPaulo(OffsetDateTime instant) {
    return instant.atZoneSameInstant(SAO_PAULO).format(DATE_TIME_PT_BR);
  }

  /** Zona de referência única do MVP para cálculo de véspera/dia (ver PSI-029). */
  public static ZoneId saoPauloZone() {
    return SAO_PAULO;
  }
}
