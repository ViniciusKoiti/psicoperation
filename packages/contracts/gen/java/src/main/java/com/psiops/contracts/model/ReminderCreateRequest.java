package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.ReminderChannel;
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
 * Payload de criação de lembrete. Os vínculos (patientId/appointmentId/ chargeId) são todos opcionais e independentes.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class ReminderCreateRequest {

  private ReminderChannel channel;

  private String subject;

  private String body;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime scheduledFor;

  private @Nullable UUID patientId;

  private @Nullable UUID appointmentId;

  private @Nullable UUID chargeId;

  public ReminderCreateRequest() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public ReminderCreateRequest(ReminderChannel channel, String subject, String body, OffsetDateTime scheduledFor) {
    this.channel = channel;
    this.subject = subject;
    this.body = body;
    this.scheduledFor = scheduledFor;
  }

  public ReminderCreateRequest channel(ReminderChannel channel) {
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

  public ReminderCreateRequest subject(String subject) {
    this.subject = subject;
    return this;
  }

  /**
   * Get subject
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

  public ReminderCreateRequest body(String body) {
    this.body = body;
    return this;
  }

  /**
   * Get body
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

  public ReminderCreateRequest scheduledFor(OffsetDateTime scheduledFor) {
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

  public ReminderCreateRequest patientId(@Nullable UUID patientId) {
    this.patientId = patientId;
    return this;
  }

  /**
   * Get patientId
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

  public ReminderCreateRequest appointmentId(@Nullable UUID appointmentId) {
    this.appointmentId = appointmentId;
    return this;
  }

  /**
   * Get appointmentId
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

  public ReminderCreateRequest chargeId(@Nullable UUID chargeId) {
    this.chargeId = chargeId;
    return this;
  }

  /**
   * Get chargeId
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

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ReminderCreateRequest reminderCreateRequest = (ReminderCreateRequest) o;
    return Objects.equals(this.channel, reminderCreateRequest.channel) &&
        Objects.equals(this.subject, reminderCreateRequest.subject) &&
        Objects.equals(this.body, reminderCreateRequest.body) &&
        Objects.equals(this.scheduledFor, reminderCreateRequest.scheduledFor) &&
        Objects.equals(this.patientId, reminderCreateRequest.patientId) &&
        Objects.equals(this.appointmentId, reminderCreateRequest.appointmentId) &&
        Objects.equals(this.chargeId, reminderCreateRequest.chargeId);
  }

  @Override
  public int hashCode() {
    return Objects.hash(channel, subject, body, scheduledFor, patientId, appointmentId, chargeId);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ReminderCreateRequest {\n");
    sb.append("    channel: ").append(toIndentedString(channel)).append("\n");
    sb.append("    subject: ").append(toIndentedString(subject)).append("\n");
    sb.append("    body: ").append(toIndentedString(body)).append("\n");
    sb.append("    scheduledFor: ").append(toIndentedString(scheduledFor)).append("\n");
    sb.append("    patientId: ").append(toIndentedString(patientId)).append("\n");
    sb.append("    appointmentId: ").append(toIndentedString(appointmentId)).append("\n");
    sb.append("    chargeId: ").append(toIndentedString(chargeId)).append("\n");
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

