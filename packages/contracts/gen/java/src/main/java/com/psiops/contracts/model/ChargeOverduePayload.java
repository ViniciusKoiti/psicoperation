package com.psiops.contracts.model;

import java.net.URI;
import java.util.Objects;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonCreator;
import java.time.LocalDate;
import java.util.UUID;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.lang.Nullable;
import java.time.OffsetDateTime;
import jakarta.validation.Valid;
import jakarta.validation.constraints.*;


import java.util.*;
import jakarta.annotation.Generated;

/**
 * Payload do evento &#x60;cobranca.atrasada&#x60;.
 */

@Generated(value = "org.openapitools.codegen.languages.SpringCodegen", comments = "Generator version: 7.23.0")
public class ChargeOverduePayload {

  private UUID chargeId;

  private UUID patientId;

  private String competence;

  private Long amount;

  @DateTimeFormat(iso = DateTimeFormat.ISO.DATE)
  private LocalDate dueDate;

  public ChargeOverduePayload() {
    super();
  }

  /**
   * Constructor with only required parameters
   */
  public ChargeOverduePayload(UUID chargeId, UUID patientId, String competence, Long amount, LocalDate dueDate) {
    this.chargeId = chargeId;
    this.patientId = patientId;
    this.competence = competence;
    this.amount = amount;
    this.dueDate = dueDate;
  }

  public ChargeOverduePayload chargeId(UUID chargeId) {
    this.chargeId = chargeId;
    return this;
  }

  /**
   * Get chargeId
   * @return chargeId
   */
  @NotNull @Valid 
  @JsonProperty("chargeId")
  public UUID getChargeId() {
    return chargeId;
  }

  @JsonProperty("chargeId")
  public void setChargeId(UUID chargeId) {
    this.chargeId = chargeId;
  }

  public ChargeOverduePayload patientId(UUID patientId) {
    this.patientId = patientId;
    return this;
  }

  /**
   * Get patientId
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

  public ChargeOverduePayload competence(String competence) {
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

  public ChargeOverduePayload amount(Long amount) {
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

  public ChargeOverduePayload dueDate(LocalDate dueDate) {
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

  @Override
  public boolean equals(Object o) {
    if (this == o) {
      return true;
    }
    if (o == null || getClass() != o.getClass()) {
      return false;
    }
    ChargeOverduePayload chargeOverduePayload = (ChargeOverduePayload) o;
    return Objects.equals(this.chargeId, chargeOverduePayload.chargeId) &&
        Objects.equals(this.patientId, chargeOverduePayload.patientId) &&
        Objects.equals(this.competence, chargeOverduePayload.competence) &&
        Objects.equals(this.amount, chargeOverduePayload.amount) &&
        Objects.equals(this.dueDate, chargeOverduePayload.dueDate);
  }

  @Override
  public int hashCode() {
    return Objects.hash(chargeId, patientId, competence, amount, dueDate);
  }

  @Override
  public String toString() {
    StringBuilder sb = new StringBuilder();
    sb.append("class ChargeOverduePayload {\n");
    sb.append("    chargeId: ").append(toIndentedString(chargeId)).append("\n");
    sb.append("    patientId: ").append(toIndentedString(patientId)).append("\n");
    sb.append("    competence: ").append(toIndentedString(competence)).append("\n");
    sb.append("    amount: ").append(toIndentedString(amount)).append("\n");
    sb.append("    dueDate: ").append(toIndentedString(dueDate)).append("\n");
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

