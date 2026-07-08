package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.ReminderChannel;
import com.psiops.contracts.model.ReminderStatus;
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
 * Lembrete agendado/enviado pela psicóloga a um paciente.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class Reminder {

  private UUID id;

  private ReminderChannel channel;

  private String subject;

  private String body;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime scheduledFor;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private @Nullable OffsetDateTime sentAt;

  private ReminderStatus status;

  private @Nullable UUID patientId;

  private @Nullable UUID appointmentId;

  private @Nullable UUID chargeId;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime createdAt;

  public Reminder() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public Reminder(UUID id, ReminderChannel channel, String subject, String body, OffsetDateTime scheduledFor, ReminderStatus status, OffsetDateTime createdAt) {
    this.id = id;
    this.channel = channel;
    this.subject = subject;
    this.body = body;
    this.scheduledFor = scheduledFor;
    this.status = status;
    this.createdAt = createdAt;
  }

  public Reminder id(UUID id) {
    this.id = id;
    return this;
  }

  /**
   * Get id
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

  public Reminder channel(ReminderChannel channel) {
    this.channel = channel;
    return this;
  }

  /**
   * Get channel
   * @return channel
   */
  @NotNull @Valid 
  @JsonProperty("channel")
  public ReminderChannel getChannel() {
    return channel;
  }

  @JsonProperty("channel")
  public void setChannel(ReminderChannel channel) {
    this.channel = channel;
  }

  public Reminder subject(String subject) {
    this.subject = subject;
    return this;
  }

  /**
   * Assunto/título do lembrete.
   * @return subject
   */
  @NotNull @Size(min = 1, max = 200) 
  @JsonProperty("subject")
  public String getSubject() {
    return subject;
  }

  @JsonProperty("subject")
  public void setSubject(String subject) {
    this.subject = subject;
  }

  public Reminder body(String body) {
    this.body = body;
    return this;
  }

  /**
   * Corpo do lembrete (texto administrativo).
   * @return body
   */
  @NotNull @Size(min = 1, max = 2000) 
  @JsonProperty("body")
  public String getBody() {
    return body;
  }

  @JsonProperty("body")
  public void setBody(String body) {
    this.body = body;
  }

  public Reminder scheduledFor(OffsetDateTime scheduledFor) {
    this.scheduledFor = scheduledFor;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return scheduledFor
   */
  @NotNull @Valid 
  @JsonProperty("scheduledFor")
  public OffsetDateTime getScheduledFor() {
    return scheduledFor;
  }

  @JsonProperty("scheduledFor")
  public void setScheduledFor(OffsetDateTime scheduledFor) {
    this.scheduledFor = scheduledFor;
  }

  public Reminder sentAt(@Nullable OffsetDateTime sentAt) {
    this.sentAt = sentAt;
    return this;
  }

  /**
   * Instante ISO 8601 / RFC 3339 com offset explícito. O backend sempre emite em UTC com sufixo `Z` (ex.: `2026-07-05T12:00:00Z`); a conversão para o fuso da usuária é responsabilidade da camada de apresentação.
   * @return sentAt
   */
  @Valid 
  @JsonProperty("sentAt")
  public @Nullable OffsetDateTime getSentAt() {
    return sentAt;
  }

  @JsonProperty("sentAt")
  public void setSentAt(@Nullable OffsetDateTime sentAt) {
    this.sentAt = sentAt;
  }

  public Reminder status(ReminderStatus status) {
    this.status = status;
    return this;
  }

  /**
   * Get status
   * @return status
   */
  @NotNull @Valid 
  @JsonProperty("status")
  public ReminderStatus getStatus() {
    return status;
  }

  @JsonProperty("status")
  public void setStatus(ReminderStatus status) {
    this.status = status;
  }

  public Reminder patientId(@Nullable UUID patientId) {
    this.patientId = patientId;
    return this;
  }

  /**
   * Paciente vinculado (opcional).
   * @return patientId
   */
  @Valid 
  @JsonProperty("patientId")
  public @Nullable UUID getPatientId() {
    return patientId;
  }

  @JsonProperty("patientId")
  public void setPatientId(@Nullable UUID patientId) {
    this.patientId = patientId;
  }

  public Reminder appointmentId(@Nullable UUID appointmentId) {
    this.appointmentId = appointmentId;
    return this;
  }

  /**
   * Consulta vinculada (opcional).
   * @return appointmentId
   */
  @Valid 
  @JsonProperty("appointmentId")
  public @Nullable UUID getAppointmentId() {
    return appointmentId;
  }

  @JsonProperty("appointmentId")
  public void setAppointmentId(@Nullable UUID appointmentId) {
    this.appointmentId = appointmentId;
  }

  public Reminder chargeId(@Nullable UUID chargeId) {
    this.chargeId = chargeId;
    return this;
  }

  /**
   * Cobrança vinculada (opcional).
   * @return chargeId
   */
  @Valid 
  @JsonProperty("chargeId")
  public @Nullable UUID getChargeId() {
    return chargeId;
  }

  @JsonProperty("chargeId")
  public void setChargeId(@Nullable UUID chargeId) {
    this.chargeId = chargeId;
  }

  public Reminder createdAt(OffsetDateTime createdAt) {
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
    Reminder reminder = (Reminder) o;
    return Objects.equals(this.id, reminder.id) &&
        Objects.equals(this.channel, reminder.channel) &&
        Objects.equals(this.subject, reminder.subject) &&
        Objects.equals(this.body, reminder.body) &&
        Objects.equals(this.scheduledFor, reminder.scheduledFor) &&
        Objects.equals(this.sentAt, reminder.sentAt) &&
        Objects.equals(this.status, reminder.status) &&
        Objects.equals(this.patientId, reminder.patientId) &&
        Objects.equals(this.appointmentId, reminder.appointmentId) &&
        Objects.equals(this.chargeId, reminder.chargeId) &&
        Objects.equals(this.createdAt, reminder.createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, channel, subject, body, scheduledFor, sentAt, status, patientId, appointmentId, chargeId, createdAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Reminder {\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    channel: ").append(toIndentedString(channel)).append("\n");
    sb.append("    subject: ").append(toIndentedString(subject)).append("\n");
    sb.append("    body: ").append(toIndentedString(body)).append("\n");
    sb.append("    scheduledFor: ").append(toIndentedString(scheduledFor)).append("\n");
    sb.append("    sentAt: ").append(toIndentedString(sentAt)).append("\n");
    sb.append("    status: ").append(toIndentedString(status)).append("\n");
    sb.append("    patientId: ").append(toIndentedString(patientId)).append("\n");
    sb.append("    appointmentId: ").append(toIndentedString(appointmentId)).append("\n");
    sb.append("    chargeId: ").append(toIndentedString(chargeId)).append("\n");
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

