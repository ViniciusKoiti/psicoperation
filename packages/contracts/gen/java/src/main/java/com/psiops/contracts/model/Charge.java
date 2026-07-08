package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;
import com.psiops.contracts.model.ChargeStatus;
import com.psiops.contracts.model.Payment;
import com.psiops.contracts.model.SimpleInterestParams;
import java.time.LocalDate;
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
 * Cobrança de mensalidade de um paciente, referente a uma competência (mês). O valor é fixado na emissão a partir da mensalidade combinada.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class Charge {

  private UUID id;

  private UUID patientId;

  private String competence;

  private Long amount;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dueDate;

  private ChargeStatus status;

  private @Nullable SimpleInterestParams interest;

  private @Nullable Payment payment;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME)
  private OffsetDateTime createdAt;

  public Charge() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public Charge(UUID id, UUID patientId, String competence, Long amount, LocalDate dueDate, ChargeStatus status, OffsetDateTime createdAt) {
    this.id = id;
    this.patientId = patientId;
    this.competence = competence;
    this.amount = amount;
    this.dueDate = dueDate;
    this.status = status;
    this.createdAt = createdAt;
  }

  public Charge id(UUID id) {
    this.id = id;
    return this;
  }

  /**
   * Identificador único da cobrança.
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

  public Charge patientId(UUID patientId) {
    this.patientId = patientId;
    return this;
  }

  /**
   * Paciente cobrado.
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

  public Charge competence(String competence) {
    this.competence = competence;
    return this;
  }

  /**
   * Competência (mês de referência) da mensalidade no formato `AAAA-MM`. Ex.: `2026-07`. Distinta de IsoDate por não ter dia.
   * @return competence
   */
  @NotNull @Pattern(regexp = "^[0-9]{4}-(0[1-9]|1[0-2])$") 
  @JsonProperty("competence")
  public String getCompetence() {
    return competence;
  }

  @JsonProperty("competence")
  public void setCompetence(String competence) {
    this.competence = competence;
  }

  public Charge amount(Long amount) {
    this.amount = amount;
    return this;
  }

  /**
   * Valor monetário em reais (BRL) representado como inteiro em centavos. Ex.: R$ 150,00 → 15000; R$ 0,99 → 99. Nunca usar ponto flutuante nem string decimal: toda aritmética monetária acontece sobre centavos inteiros, e a formatação para exibição (R$) é responsabilidade exclusiva da camada de apresentação. Valores negativos são permitidos apenas em contextos que documentem explicitamente estornos/ajustes.
   * @return amount
   */
  @NotNull 
  @JsonProperty("amount")
  public Long getAmount() {
    return amount;
  }

  @JsonProperty("amount")
  public void setAmount(Long amount) {
    this.amount = amount;
  }

  public Charge dueDate(LocalDate dueDate) {
    this.dueDate = dueDate;
    return this;
  }

  /**
   * Data de calendário ISO 8601 (`YYYY-MM-DD`), sem componente de hora nem fuso. Usada para conceitos de \"dia civil\" (ex.: dia de vencimento).
   * @return dueDate
   */
  @NotNull @Valid 
  @JsonProperty("dueDate")
  public LocalDate getDueDate() {
    return dueDate;
  }

  @JsonProperty("dueDate")
  public void setDueDate(LocalDate dueDate) {
    this.dueDate = dueDate;
  }

  public Charge status(ChargeStatus status) {
    this.status = status;
    return this;
  }

  /**
   * Get status
   * @return status
   */
  @NotNull @Valid 
  @JsonProperty("status")
  public ChargeStatus getStatus() {
    return status;
  }

  @JsonProperty("status")
  public void setStatus(ChargeStatus status) {
    this.status = status;
  }

  public Charge interest(@Nullable SimpleInterestParams interest) {
    this.interest = interest;
    return this;
  }

  /**
   * Get interest
   * @return interest
   */
  @Valid 
  @JsonProperty("interest")
  public @Nullable SimpleInterestParams getInterest() {
    return interest;
  }

  @JsonProperty("interest")
  public void setInterest(@Nullable SimpleInterestParams interest) {
    this.interest = interest;
  }

  public Charge payment(@Nullable Payment payment) {
    this.payment = payment;
    return this;
  }

  /**
   * Get payment
   * @return payment
   */
  @Valid 
  @JsonProperty("payment")
  public @Nullable Payment getPayment() {
    return payment;
  }

  @JsonProperty("payment")
  public void setPayment(@Nullable Payment payment) {
    this.payment = payment;
  }

  public Charge createdAt(OffsetDateTime createdAt) {
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
    Charge charge = (Charge) o;
    return Objects.equals(this.id, charge.id) &&
        Objects.equals(this.patientId, charge.patientId) &&
        Objects.equals(this.competence, charge.competence) &&
        Objects.equals(this.amount, charge.amount) &&
        Objects.equals(this.dueDate, charge.dueDate) &&
        Objects.equals(this.status, charge.status) &&
        Objects.equals(this.interest, charge.interest) &&
        Objects.equals(this.payment, charge.payment) &&
        Objects.equals(this.createdAt, charge.createdAt);
  }

  @Override
  public int hashCode() {
    return Objects.hash(id, patientId, competence, amount, dueDate, status, interest, payment, createdAt);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class Charge {\n");
    sb.append("    id: ").append(toIndentedString(id)).append("\n");
    sb.append("    patientId: ").append(toIndentedString(patientId)).append("\n");
    sb.append("    competence: ").append(toIndentedString(competence)).append("\n");
    sb.append("    amount: ").append(toIndentedString(amount)).append("\n");
    sb.append("    dueDate: ").append(toIndentedString(dueDate)).append("\n");
    sb.append("    status: ").append(toIndentedString(status)).append("\n");
    sb.append("    interest: ").append(toIndentedString(interest)).append("\n");
    sb.append("    payment: ").append(toIndentedString(payment)).append("\n");
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

