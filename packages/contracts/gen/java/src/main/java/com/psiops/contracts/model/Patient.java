package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.PatientStatus;
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
 * Paciente (contato administrativo e de cobrança da psicóloga).
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class Patient {

  private UUID id;

  private String name;

  private @Nullable String whatsapp;

  private @Nullable String email;

  private Long monthlyFee;

  private Integer billingDay;

  private PatientStatus status;

  private @Nullable String notes;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime createdAt;

  public Patient() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public Patient(UUID id, String name, Long monthlyFee, Integer billingDay, PatientStatus status, OffsetDateTime createdAt) {
    this.id = id;
    this.name = name;
    this.monthlyFee = monthlyFee;
    this.billingDay = billingDay;
    this.status = status;
    this.createdAt = createdAt;
  }

  public Patient id(UUID id) {
    this.id = id;
    return this;
  }

  /**
   * Identificador único do paciente.
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

  public Patient name(String name) {
    this.name = name;
    return this;
  }

  /**
   * Nome do paciente.
   * @return name
   */
  @NotNull @Size(min = 1, max = 120) 
  @JsonProperty("name")
  public String getName() {
    return name;
  }

  @JsonProperty("name")
  public void setName(String name) {
    this.name = name;
  }

  public Patient whatsapp(@Nullable String whatsapp) {
    this.whatsapp = whatsapp;
    return this;
  }

  /**
   * Número de WhatsApp brasileiro (celular) normalizado em E.164: `+55` + DDD com 2 dígitos (nenhum DDD brasileiro contém 0) + `9` + 8 dígitos. Ex.: `+5511990000000`. A máscara de UI `(XX) XXXXX-XXXX` é apenas apresentação: o cliente remove a máscara e prefixa `+55` antes de enviar. Este é o formato canônico de armazenamento e integração (lembretes/cobranças via WhatsApp).
   * @return whatsapp
   */
  @Pattern(regexp = "^\\+55[1-9][1-9]9[0-9]{8}$") @Size(min = 14, max = 14) 
  @JsonProperty("whatsapp")
  public @Nullable String getWhatsapp() {
    return whatsapp;
  }

  @JsonProperty("whatsapp")
  public void setWhatsapp(@Nullable String whatsapp) {
    this.whatsapp = whatsapp;
  }

  public Patient email(@Nullable String email) {
    this.email = email;
    return this;
  }

  /**
   * E-mail de contato (opcional).
   * @return email
   */
  @Size(max = 254) @jakarta.validation.constraints.Email 
  @JsonProperty("email")
  public @Nullable String getEmail() {
    return email;
  }

  @JsonProperty("email")
  public void setEmail(@Nullable String email) {
    this.email = email;
  }

  public Patient monthlyFee(Long monthlyFee) {
    this.monthlyFee = monthlyFee;
    return this;
  }

  /**
   * Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
   * @return monthlyFee
   */
  @NotNull 
  @JsonProperty("monthlyFee")
  public Long getMonthlyFee() {
    return monthlyFee;
  }

  @JsonProperty("monthlyFee")
  public void setMonthlyFee(Long monthlyFee) {
    this.monthlyFee = monthlyFee;
  }

  public Patient billingDay(Integer billingDay) {
    this.billingDay = billingDay;
    return this;
  }

  /**
   * Dia do mês (1–28) de vencimento da mensalidade. Limitado a 28 para existir em todos os meses.
   * minimum: 1
   * maximum: 28
   * @return billingDay
   */
  @NotNull @Min(value = 1) @Max(value = 28) 
  @JsonProperty("billingDay")
  public Integer getBillingDay() {
    return billingDay;
  }

  @JsonProperty("billingDay")
  public void setBillingDay(Integer billingDay) {
    this.billingDay = billingDay;
  }

  public Patient status(PatientStatus status) {
    this.status = status;
    return this;
  }

  /**
   * Get status
   * @return status
   */
  @NotNull @Valid 
  @JsonProperty("status")
  public PatientStatus getStatus() {
    return status;
  }

  @JsonProperty("status")
  public void setStatus(PatientStatus status) {
    this.status = status;
  }

  public Patient notes(@Nullable String notes) {
    this.notes = notes;
    return this;
  }

  /**
   * Anotações ADMINISTRATIVAS livres (ex.: preferências de contato, combinados de pagamento). NÃO se destinam a conteúdo clínico.
   * @return notes
   */
  @Size(max = 2000) 
  @JsonProperty("notes")
  public @Nullable String getNotes() {
    return notes;
  }

  @JsonProperty("notes")
  public void setNotes(@Nullable String notes) {
    this.notes = notes;
  }

  public Patient createdAt(OffsetDateTime createdAt) {
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
    Patient patient = (Patient) o;
    return Objects.equals(this.id, patient.id) &&
        Objects.equals(this.name, patient.name) &&
        Objects.equals(this.whatsapp, patient.whatsapp) &&
        Objects.equals(this.email, patient.email) &&
        Objects.equals(this.monthlyFee, patient.monthlyFee) &&
        Objects.equals(this.billingDay, patient.billingDay) &&
        Objects.equals(this.status, patient.status) &&
        Objects.equals(this.notes, patient.notes) &&
        Objects.equals(this.createdAt, patient.createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, name, whatsapp, email, monthlyFee, billingDay, status, notes, createdAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Patient {\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    name: ").append(toIndentedString(name)).append("\n");
    sb.append("    whatsapp: ").append(toIndentedString(whatsapp)).append("\n");
    sb.append("    email: ").append(toIndentedString(email)).append("\n");
    sb.append("    monthlyFee: ").append(toIndentedString(monthlyFee)).append("\n");
    sb.append("    billingDay: ").append(toIndentedString(billingDay)).append("\n");
    sb.append("    status: ").append(toIndentedString(status)).append("\n");
    sb.append("    notes: ").append(toIndentedString(notes)).append("\n");
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

