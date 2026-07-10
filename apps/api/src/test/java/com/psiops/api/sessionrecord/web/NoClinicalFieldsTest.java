package com.psiops.api.sessionrecord.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.psiops.api.appointment.persistence.SessionRecordEntity;
import com.psiops.contracts.model.AttendanceRecord;
import java.lang.reflect.Field;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

/**
 * Afirma, por reflexão, a restrição de produto inviolável do módulo de
 * registros administrativos de consulta (PSI-025): nenhum campo clínico é
 * modelado em nenhum DTO/entidade exposto por este módulo.
 *
 * <p>Verifica duas coisas para cada tipo relevante ({@link
 * SessionRecordEntity} — persistência —, {@link AttendanceRecord} — DTO de
 * contrato —, {@link SessionRecordHistoryItem} e {@link SessionRecordPage} —
 * DTOs locais do histórico): (1) o conjunto de campos é exatamente o
 * esperado (fecha a porta para adição futura despercebida de um campo
 * clínico) e (2) nenhum nome de campo contém um termo associado a conteúdo
 * clínico/de saúde.
 */
class NoClinicalFieldsTest {

  /**
   * Termos que indicariam conteúdo clínico/de saúde caso aparecessem em
   * qualquer nome de campo dos tipos deste módulo — nenhum é aceitável.
   */
  private static final List<String> FORBIDDEN_SUBSTRINGS =
      List.of(
          "diagnos",
          "evolu",
          "queixa",
          "hipotese",
          "hipótese",
          "prontuario",
          "prontuário",
          "sintoma",
          "clinic",
          "clínic",
          "saude",
          "saúde",
          "terapia",
          "sessaoclinica",
          "tratamento",
          "medicament",
          "cid",
          "dsm",
          "psicoterap");

  @Test
  void sessionRecordEntity_hasOnlyAdministrativeFields() {
    Set<String> fieldNames = fieldNames(SessionRecordEntity.class);
    assertThat(fieldNames)
        .containsExactlyInAnyOrder(
            "id", "userId", "appointmentId", "attendance", "administrativeNotes", "recordedAt", "createdAt");
    assertNoForbiddenTerm(SessionRecordEntity.class, fieldNames);
  }

  @Test
  void attendanceRecordContractDto_hasOnlyAdministrativeFields() {
    Set<String> fieldNames = fieldNames(AttendanceRecord.class);
    assertThat(fieldNames).containsExactlyInAnyOrder("attendance", "administrativeNotes", "recordedAt");
    assertNoForbiddenTerm(AttendanceRecord.class, fieldNames);
  }

  @Test
  void sessionRecordHistoryItem_hasOnlyCorrelationAndAdministrativeFields() {
    Set<String> fieldNames = fieldNames(SessionRecordHistoryItem.class);
    assertThat(fieldNames).containsExactlyInAnyOrder("id", "appointmentId", "record", "createdAt");
    assertNoForbiddenTerm(SessionRecordHistoryItem.class, fieldNames);
  }

  @Test
  void sessionRecordPage_hasOnlyItemsAndPaginationMeta() {
    Set<String> fieldNames = fieldNames(SessionRecordPage.class);
    assertThat(fieldNames).containsExactlyInAnyOrder("items", "meta");
    assertNoForbiddenTerm(SessionRecordPage.class, fieldNames);
  }

  private static Set<String> fieldNames(Class<?> type) {
    return Stream.of(type.getDeclaredFields())
        .filter(field -> !field.isSynthetic())
        .map(Field::getName)
        .collect(java.util.stream.Collectors.toSet());
  }

  private static void assertNoForbiddenTerm(Class<?> type, Set<String> fieldNames) {
    for (String fieldName : fieldNames) {
      String normalized = fieldName.toLowerCase(Locale.ROOT);
      for (String forbidden : FORBIDDEN_SUBSTRINGS) {
        assertThat(normalized)
            .as(
                "campo '%s' de %s não deve conter termo clínico '%s' — restrição de produto inviolável (PSI-025)",
                fieldName, type.getSimpleName(), forbidden)
            .doesNotContain(forbidden);
      }
    }
  }
}
