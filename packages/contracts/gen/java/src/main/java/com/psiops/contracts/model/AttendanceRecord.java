package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.AttendanceStatus;
import java.time.OffsetDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Registro ADMINISTRATIVO de uma consulta: se o paciente compareceu, faltou ou remarcou, mais uma anotação administrativa livre. AUSÊNCIA PROPOSITAL DE DADOS CLÍNICOS: este schema NÃO contém — e não deve receber — campos de diagnóstico, evolução, queixa, conduta ou qualquer informação clínica/de saúde. Ele existe apenas para controle de presença e faturamento. A restrição é uma decisão de produto inviolável.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class AttendanceRecord {

  private AttendanceStatus attendance;

  private @Nullable String administrativeNotes;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime recordedAt;

  public AttendanceRecord() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public AttendanceRecord(AttendanceStatus attendance) {
    this.attendance = attendance;
  }

  public AttendanceRecord attendance(AttendanceStatus attendance) {
    this.attendance = attendance;
    return this;
  }

  /**
   * Get attendance
   * @return attendance
   */
  @NotNull @Valid 
  @JsonProperty("attendance")
  public AttendanceStatus getAttendance() {
    return attendance;
  }

  @JsonProperty("attendance")
  public void setAttendance(AttendanceStatus attendance) {
    this.attendance = attendance;
  }

  public AttendanceRecord administrativeNotes(@Nullable String administrativeNotes) {
    this.administrativeNotes = administrativeNotes;
    return this;
  }

  /**
   * Anotação ADMINISTRATIVA (ex.: \"remarcou por viagem\", \"faltou sem aviso\"). Nunca conteúdo clínico.
   * @return administrativeNotes
   */
  @Size(max = 2000) 
  @JsonProperty("administrativeNotes")
  public @Nullable String getAdministrativeNotes() {
    return administrativeNotes;
  }

  @JsonProperty("administrativeNotes")
  public void setAdministrativeNotes(@Nullable String administrativeNotes) {
    this.administrativeNotes = administrativeNotes;
  }

  public AttendanceRecord recordedAt(@Nullable OffsetDateTime recordedAt) {
    this.recordedAt = recordedAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return recordedAt
   */
  @Valid 
  @JsonProperty("recordedAt")
  public @Nullable OffsetDateTime getRecordedAt() {
    return recordedAt;
  }

  @JsonProperty("recordedAt")
  public void setRecordedAt(@Nullable OffsetDateTime recordedAt) {
    this.recordedAt = recordedAt;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    AttendanceRecord attendanceRecord = (AttendanceRecord) o;
    return Objects.equals(this.attendance, attendanceRecord.attendance) &&
        Objects.equals(this.administrativeNotes, attendanceRecord.administrativeNotes) &&
        Objects.equals(this.recordedAt, attendanceRecord.recordedAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(attendance, administrativeNotes, recordedAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class AttendanceRecord {\n");
    sb.append("    attendance: ").append(toIndentedString(attendance)).append("\n");
    sb.append("    administrativeNotes: ").append(toIndentedString(administrativeNotes)).append("\n");
    sb.append("    recordedAt: ").append(toIndentedString(recordedAt)).append("\n");
    sb.append("}");
    return sb.toString();
  }

  /**
   * Convert the given object to string with each line indented by 4 spaces
   * (except the first line).
   */
  private String toIndentedString(@Nullable Object o) {
    return o == null ? "null" : o.toString().replace("\n", "\n    ");
  }
}

