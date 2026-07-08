package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.AppointmentStatus;
import com.psiops.contracts.model.WeeklyRecurrence;
import java.time.OffsetDateTime;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Consulta agendada na agenda da psicóloga.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class Appointment {

  private UUID id;

  private UUID patientId;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime startsAt;

  private Integer durationMinutes;

  private @Nullable WeeklyRecurrence recurrence;

  private AppointmentStatus status;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime createdAt;

  public Appointment() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public Appointment(UUID id, UUID patientId, OffsetDateTime startsAt, Integer durationMinutes, AppointmentStatus status, OffsetDateTime createdAt) {
    this.id = id;
    this.patientId = patientId;
    this.startsAt = startsAt;
    this.durationMinutes = durationMinutes;
    this.status = status;
    this.createdAt = createdAt;
  }

  public Appointment id(UUID id) {
    this.id = id;
    return this;
  }

  /**
   * Identificador único da consulta.
   * @return id
   */
  @NotNull @Valid 
  @JsonProperty("id")
  public UUID getId() {
    return id;
  }

  @JsonProperty("id")
  public void setId(UUID id) {
    this.id = id;
  }

  public Appointment patientId(UUID patientId) {
    this.patientId = patientId;
    return this;
  }

  /**
   * Paciente da consulta.
   * @return patientId
   */
  @NotNull @Valid 
  @JsonProperty("patientId")
  public UUID getPatientId() {
    return patientId;
  }

  @JsonProperty("patientId")
  public void setPatientId(UUID patientId) {
    this.patientId = patientId;
  }

  public Appointment startsAt(OffsetDateTime startsAt) {
    this.startsAt = startsAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return startsAt
   */
  @NotNull @Valid 
  @JsonProperty("startsAt")
  public OffsetDateTime getStartsAt() {
    return startsAt;
  }

  @JsonProperty("startsAt")
  public void setStartsAt(OffsetDateTime startsAt) {
    this.startsAt = startsAt;
  }

  public Appointment durationMinutes(Integer durationMinutes) {
    this.durationMinutes = durationMinutes;
    return this;
  }

  /**
   * Duração da consulta em minutos.
   * minimum: 1
   * maximum: 480
   * @return durationMinutes
   */
  @NotNull @Min(value = 1) @Max(value = 480) 
  @JsonProperty("durationMinutes")
  public Integer getDurationMinutes() {
    return durationMinutes;
  }

  @JsonProperty("durationMinutes")
  public void setDurationMinutes(Integer durationMinutes) {
    this.durationMinutes = durationMinutes;
  }

  public Appointment recurrence(@Nullable WeeklyRecurrence recurrence) {
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

  public Appointment status(AppointmentStatus status) {
    this.status = status;
    return this;
  }

  /**
   * Get status
   * @return status
   */
  @NotNull @Valid 
  @JsonProperty("status")
  public AppointmentStatus getStatus() {
    return status;
  }

  @JsonProperty("status")
  public void setStatus(AppointmentStatus status) {
    this.status = status;
  }

  public Appointment createdAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return createdAt
   */
  @NotNull @Valid 
  @JsonProperty("createdAt")
  public OffsetDateTime getCreatedAt() {
    return createdAt;
  }

  @JsonProperty("createdAt")
  public void setCreatedAt(OffsetDateTime createdAt) {
    this.createdAt = createdAt;
  }

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    Appointment appointment = (Appointment) o;
    return Objects.equals(this.id, appointment.id) &&
        Objects.equals(this.patientId, appointment.patientId) &&
        Objects.equals(this.startsAt, appointment.startsAt) &&
        Objects.equals(this.durationMinutes, appointment.durationMinutes) &&
        Objects.equals(this.recurrence, appointment.recurrence) &&
        Objects.equals(this.status, appointment.status) &&
        Objects.equals(this.createdAt, appointment.createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, patientId, startsAt, durationMinutes, recurrence, status, createdAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Appointment {\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    patientId: ").append(toIndentedString(patientId)).append("\n");
    sb.append("    startsAt: ").append(toIndentedString(startsAt)).append("\n");
    sb.append("    durationMinutes: ").append(toIndentedString(durationMinutes)).append("\n");
    sb.append("    recurrence: ").append(toIndentedString(recurrence)).append("\n");
    sb.append("    status: ").append(toIndentedString(status)).append("\n");
    sb.append("    createdAt: ").append(toIndentedString(createdAt)).append("\n");
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

