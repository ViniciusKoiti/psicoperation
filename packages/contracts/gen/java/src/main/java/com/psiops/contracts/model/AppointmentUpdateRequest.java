package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.AppointmentStatus;
import com.psiops.contracts.model.WeeklyRecurrence;
import java.time.OffsetDateTime;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Remarcação/edição de consulta. Campos opcionais; apenas os presentes mudam.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class AppointmentUpdateRequest {

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime startsAt;

  private @Nullable Integer durationMinutes;

  private @Nullable WeeklyRecurrence recurrence;

  private @Nullable AppointmentStatus status;

  public AppointmentUpdateRequest startsAt(@Nullable OffsetDateTime startsAt) {
    this.startsAt = startsAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return startsAt
   */
  @Valid 
  @JsonProperty("startsAt")
  public @Nullable OffsetDateTime getStartsAt() {
    return startsAt;
  }

  @JsonProperty("startsAt")
  public void setStartsAt(@Nullable OffsetDateTime startsAt) {
    this.startsAt = startsAt;
  }

  public AppointmentUpdateRequest durationMinutes(@Nullable Integer durationMinutes) {
    this.durationMinutes = durationMinutes;
    return this;
  }

  /**
   * Get durationMinutes
   * minimum: 1
   * maximum: 480
   * @return durationMinutes
   */
  @Min(value = 1) @Max(value = 480) 
  @JsonProperty("durationMinutes")
  public @Nullable Integer getDurationMinutes() {
    return durationMinutes;
  }

  @JsonProperty("durationMinutes")
  public void setDurationMinutes(@Nullable Integer durationMinutes) {
    this.durationMinutes = durationMinutes;
  }

  public AppointmentUpdateRequest recurrence(@Nullable WeeklyRecurrence recurrence) {
    this.recurrence = recurrence;
    return this;
  }

  /**
   * Get recurrence
   * @return recurrence
   */
  @Valid 
  @JsonProperty("recurrence")
  public @Nullable WeeklyRecurrence getRecurrence() {
    return recurrence;
  }

  @JsonProperty("recurrence")
  public void setRecurrence(@Nullable WeeklyRecurrence recurrence) {
    this.recurrence = recurrence;
  }

  public AppointmentUpdateRequest status(@Nullable AppointmentStatus status) {
    this.status = status;
    return this;
  }

  /**
   * Get status
   * @return status
   */
  @Valid 
  @JsonProperty("status")
  public @Nullable AppointmentStatus getStatus() {
    return status;
  }

  @JsonProperty("status")
  public void setStatus(@Nullable AppointmentStatus status) {
    this.status = status;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    AppointmentUpdateRequest appointmentUpdateRequest = (AppointmentUpdateRequest) o;
    return Objects.equals(this.startsAt, appointmentUpdateRequest.startsAt) &&
        Objects.equals(this.durationMinutes, appointmentUpdateRequest.durationMinutes) &&
        Objects.equals(this.recurrence, appointmentUpdateRequest.recurrence) &&
        Objects.equals(this.status, appointmentUpdateRequest.status);
  }

  @Override
  public int hashCode() {
    return Objects.hash(startsAt, durationMinutes, recurrence, status);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class AppointmentUpdateRequest {\n");
    sb.append("    startsAt: ").append(toIndentedString(startsAt)).append("\n");
    sb.append("    durationMinutes: ").append(toIndentedString(durationMinutes)).append("\n");
    sb.append("    recurrence: ").append(toIndentedString(recurrence)).append("\n");
    sb.append("    status: ").append(toIndentedString(status)).append("\n");
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

